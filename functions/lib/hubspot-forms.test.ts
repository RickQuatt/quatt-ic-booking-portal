import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  setTrainingBooked,
  setTrainingAttended,
  setKennismakingBooked,
} from "./hubspot-forms";
import type { Env } from "./types";

function mockResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => body,
  } as unknown as Response;
}

// Audit channel intentionally unset so the ONLY fetch is the CRM write --
// nothing should ever hit api.hsforms.com.
function env(overrides: Partial<Env> = {}): Env {
  return {
    HUBSPOT_WRITE_TOKEN: "pat-test",
    ...overrides,
  } as unknown as Env;
}

const CONTACTS_PREFIX = "https://api.hubapi.com/crm/v3/objects/contacts";

function urlsOf(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.map((c) => String(c[0]));
}

function patchBodyOf(fetchMock: ReturnType<typeof vi.fn>, i = 0) {
  return JSON.parse(fetchMock.mock.calls[i][1].body);
}

describe("booking-milestone CRM writes (formerly Forms API)", () => {
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

  it("setKennismakingBooked writes only the CRM contact endpoint", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { id: "1" }));

    await setKennismakingBooked(env(), "partner@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const urls = urlsOf(fetchMock);
    expect(urls[0]).toContain(CONTACTS_PREFIX);
    expect(urls.some((u) => u.includes("api.hsforms.com"))).toBe(false);
    expect(patchBodyOf(fetchMock)).toEqual({
      properties: { ic__kennismaking_booked: "true" },
    });
  });

  it("setKennismakingBooked sets the flag + date and omits the phantom dealId prop", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { id: "1" }));

    // A dealId IS passed (the AM-reserve path does this). It must NOT be written.
    await setKennismakingBooked(
      env(),
      "partner@example.com",
      "42",
      "2026-07-21",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = patchBodyOf(fetchMock);
    expect(body.properties).toEqual({
      ic__kennismaking_booked: "true",
      ic__kennismaking_date: String(Date.UTC(2026, 6, 21)),
    });
    expect(
      Object.keys(body.properties).includes("ic__kennismaking_deal_id"),
    ).toBe(false);
    expect(JSON.stringify(body)).not.toContain("ic__kennismaking_deal_id");
  });

  it("setTrainingBooked sets the flag + date and never writes ic__kennismaking_deal_id", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { id: "1" }));

    await setTrainingBooked(env(), "partner@example.com", "42", "2026-07-21");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(urlsOf(fetchMock)[0]).toContain(CONTACTS_PREFIX);
    const body = patchBodyOf(fetchMock);
    expect(body.properties).toEqual({
      ic__training_booked: "true",
      ic__training_date: String(Date.UTC(2026, 6, 21)),
    });
    expect(JSON.stringify(body)).not.toContain("ic__kennismaking_deal_id");
    expect(urlsOf(fetchMock).some((u) => u.includes("api.hsforms.com"))).toBe(
      false,
    );
  });

  it("setTrainingBooked with an invalid date warns and sends no date property", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { id: "1" }));

    await setTrainingBooked(env(), "partner@example.com", "42", "not-a-date");

    expect(console.warn).toHaveBeenCalled();
    const body = patchBodyOf(fetchMock);
    expect(body.properties).toEqual({ ic__training_booked: "true" });
    expect(JSON.stringify(body)).not.toContain("ic__training_date");
  });

  it("setTrainingAttended writes only ic__training_completed to the CRM", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { id: "1" }));

    await setTrainingAttended(env(), "partner@example.com", "alle");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(urlsOf(fetchMock)[0]).toContain(CONTACTS_PREFIX);
    expect(patchBodyOf(fetchMock)).toEqual({
      properties: { ic__training_completed: "true" },
    });
    expect(urlsOf(fetchMock).some((u) => u.includes("api.hsforms.com"))).toBe(
      false,
    );
  });

  it("propagates a CRM failure without any Forms API fallback", async () => {
    // 400 has no retry; the single CRM call fails and the error surfaces.
    fetchMock.mockResolvedValueOnce(mockResponse(400, "PROPERTY_DOESNT_EXIST"));

    await expect(
      setTrainingBooked(env(), "partner@example.com", "42", "2026-07-21"),
    ).rejects.toThrow(/HubSpot CRM API error 400/);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(urlsOf(fetchMock).some((u) => u.includes("api.hsforms.com"))).toBe(
      false,
    );
  });
});
