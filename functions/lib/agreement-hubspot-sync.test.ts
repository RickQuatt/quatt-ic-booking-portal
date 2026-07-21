import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { syncAgreementToHubSpot } from "./agreement-hubspot-sync";
import type { Env } from "./types";

function mockResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => body,
  } as unknown as Response;
}

// Audit env set so the "not attached" postToChannel actually fires when there
// is no linked company.
function env(overrides: Partial<Env> = {}): Env {
  return {
    HUBSPOT_WRITE_TOKEN: "pat-test",
    SLACK_BOT_TOKEN: "xoxb-test",
    HUBSPOT_AUDIT_CHANNEL: "C_AUDIT",
    ...overrides,
  } as unknown as Env;
}

type Call = [
  string,
  { method: string; headers: Record<string, string>; body?: string },
];

function callsMatching(
  fetchMock: ReturnType<typeof vi.fn>,
  predicate: (url: string) => boolean,
): Call[] {
  return fetchMock.mock.calls.filter((c) => predicate(String(c[0]))) as Call[];
}

const isContact = (u: string) => u.includes("/crm/v3/objects/contacts");
const isCompany = (u: string) => u.includes("/crm/v3/objects/companies");
const isAssoc = (u: string) => u.includes("/associations/companies");
const isSlack = (u: string) => u.includes("slack.com");

const DATA = {
  email: "partner@example.com",
  firstname: "Jan",
  lastname: "de Vries",
  company: "Acme Installaties BV",
  phone: "0612345678",
  // Composed exactly the way the route composes it: `${address}, ${postcode} ${city}`.
  address: "Dorpsstraat 1, 1234 AB Amsterdam",
  kvkNumber: "12345678",
  btwNumber: "NL001234567B01",
};

describe("syncAgreementToHubSpot", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("writes the contact fields and the company KvK/BTW when the deal has a linked company", async () => {
    fetchMock.mockImplementation((url: string) => {
      const u = String(url);
      if (isAssoc(u)) {
        return Promise.resolve(
          mockResponse(200, {
            results: [{ toObjectId: 900, associationTypes: [{ typeId: 5 }] }],
          }),
        );
      }
      if (isContact(u)) return Promise.resolve(mockResponse(200, { id: "c" }));
      if (isCompany(u)) return Promise.resolve(mockResponse(200, { id: "co" }));
      return Promise.resolve(mockResponse(200, { ok: true }));
    });

    await syncAgreementToHubSpot(env(), { ...DATA, dealId: "42" });

    // Contact write: exactly the five standard props + composed address, and
    // NONE of the deal/KvK/BTW fields leak onto the contact.
    const contactCalls = callsMatching(fetchMock, isContact);
    expect(contactCalls).toHaveLength(1);
    expect(contactCalls[0][1].method).toBe("PATCH");
    expect(contactCalls[0][0]).toContain("partner%40example.com");
    const contactProps = JSON.parse(contactCalls[0][1].body!).properties;
    expect(contactProps).toEqual({
      firstname: "Jan",
      lastname: "de Vries",
      company: "Acme Installaties BV",
      phone: "0612345678",
      address: "Dorpsstraat 1, 1234 AB Amsterdam",
    });
    for (const leaked of [
      "kvkNumber",
      "btwNumber",
      "commercial_registration_number__kvk_",
      "vat_number_btw",
      "ic_agreement_deal_id",
      "dealId",
    ]) {
      expect(Object.keys(contactProps)).not.toContain(leaked);
    }

    // Association was resolved from the deal.
    expect(callsMatching(fetchMock, isAssoc)).toHaveLength(1);

    // Company write: exactly the two KvK/BTW property names + values.
    const companyCalls = callsMatching(fetchMock, isCompany);
    expect(companyCalls).toHaveLength(1);
    expect(companyCalls[0][1].method).toBe("PATCH");
    expect(companyCalls[0][0]).toContain(
      "https://api.hubapi.com/crm/v3/objects/companies/900",
    );
    expect(JSON.parse(companyCalls[0][1].body!).properties).toEqual({
      commercial_registration_number__kvk_: "12345678",
      vat_number_btw: "NL001234567B01",
    });

    // Company existed -> no "not attached" notice.
    const notAttached = callsMatching(fetchMock, isSlack).filter((c) =>
      JSON.parse(c[1].body!).text.includes("not attached"),
    );
    expect(notAttached).toHaveLength(0);
  });

  it("posts exactly one 'not attached' audit and no company write when the deal has no linked company", async () => {
    fetchMock.mockImplementation((url: string) => {
      const u = String(url);
      if (isAssoc(u))
        return Promise.resolve(mockResponse(200, { results: [] }));
      if (isContact(u)) return Promise.resolve(mockResponse(200, { id: "c" }));
      return Promise.resolve(mockResponse(200, { ok: true }));
    });

    await syncAgreementToHubSpot(env(), { ...DATA, dealId: "42" });

    // Association was looked up but no company PATCH happened.
    expect(callsMatching(fetchMock, isAssoc)).toHaveLength(1);
    expect(callsMatching(fetchMock, isCompany)).toHaveLength(0);

    const notAttached = callsMatching(fetchMock, isSlack).filter((c) =>
      JSON.parse(c[1].body!).text.includes("not attached"),
    );
    expect(notAttached).toHaveLength(1);
    expect(JSON.parse(notAttached[0][1].body!)).toMatchObject({
      channel: "C_AUDIT",
      text: `agreement KvK/BTW not attached: ${DATA.company} ${DATA.email} -- no linked HubSpot company (data in D1 + Sheet)`,
    });
  });

  it("skips the association lookup entirely when there is no dealId", async () => {
    fetchMock.mockImplementation((url: string) => {
      const u = String(url);
      if (isContact(u)) return Promise.resolve(mockResponse(200, { id: "c" }));
      return Promise.resolve(mockResponse(200, { ok: true }));
    });

    await syncAgreementToHubSpot(env(), { ...DATA, dealId: undefined });

    // No deal -> no association GET, no company PATCH.
    expect(callsMatching(fetchMock, isAssoc)).toHaveLength(0);
    expect(callsMatching(fetchMock, isCompany)).toHaveLength(0);

    const notAttached = callsMatching(fetchMock, isSlack).filter((c) =>
      JSON.parse(c[1].body!).text.includes("not attached"),
    );
    expect(notAttached).toHaveLength(1);
  });
});
