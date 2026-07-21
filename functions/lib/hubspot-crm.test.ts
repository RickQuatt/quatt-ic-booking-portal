import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  upsertContactProps,
  upsertCompanyProps,
  resolvePrimaryCompanyId,
  toHubSpotDateMs,
} from "./hubspot-crm";
import type { Env } from "./types";

function mockResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => body,
  } as unknown as Response;
}

function baseEnv(overrides: Partial<Env> = {}): Env {
  return {
    HUBSPOT_WRITE_TOKEN: "pat-test-token",
    ...overrides,
  } as unknown as Env;
}

describe("toHubSpotDateMs", () => {
  it("converts a YYYY-MM-DD date to UTC-midnight epoch-ms", () => {
    expect(toHubSpotDateMs("2026-08-18")).toBe(String(Date.UTC(2026, 7, 18)));
  });

  it("strips a time component so the result is still UTC midnight", () => {
    // A value with an offset must not leak a non-midnight timestamp (HubSpot
    // date properties reject that).
    expect(toHubSpotDateMs("2026-08-18T13:00:00+02:00")).toBe(
      String(Date.UTC(2026, 7, 18)),
    );
  });

  it("returns undefined for an unparseable date", () => {
    expect(toHubSpotDateMs("not-a-date")).toBeUndefined();
  });

  it("rejects out-of-range and overflow calendar dates", () => {
    expect(toHubSpotDateMs("2026-13-01")).toBeUndefined();
    expect(toHubSpotDateMs("2026-00-10")).toBeUndefined();
    expect(toHubSpotDateMs("2026-02-31")).toBeUndefined();
  });
});

describe("upsertContactProps", () => {
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

  it("PATCHes an existing contact (happy path)", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { id: "1" }));

    const result = await upsertContactProps(
      baseEnv(),
      "partner@example.com",
      { ic__training_booked: "true" },
      "training booked",
    );

    expect(result).toEqual({ skipped: false, created: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.hubapi.com/crm/v3/objects/contacts/partner%40example.com?idProperty=email",
    );
    expect(init.method).toBe("PATCH");
    expect(init.headers.Authorization).toBe("Bearer pat-test-token");
    expect(JSON.parse(init.body)).toEqual({
      properties: { ic__training_booked: "true" },
    });
  });

  it("creates the contact via POST on 404", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(404, { message: "not found" }))
      .mockResolvedValueOnce(mockResponse(201, { id: "2" }));

    const result = await upsertContactProps(
      baseEnv(),
      "new@example.com",
      { ic__training_completed: "true" },
      "training attended",
    );

    expect(result).toEqual({ skipped: false, created: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [createUrl, createInit] = fetchMock.mock.calls[1];
    expect(createUrl).toBe("https://api.hubapi.com/crm/v3/objects/contacts");
    expect(createInit.method).toBe("POST");
    expect(JSON.parse(createInit.body)).toEqual({
      properties: { ic__training_completed: "true", email: "new@example.com" },
    });
  });

  it("recovers via PATCH when create hits a 409 duplicate", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(404, { message: "not found" }))
      .mockResolvedValueOnce(
        mockResponse(409, { message: "Contact already exists" }),
      )
      .mockResolvedValueOnce(mockResponse(200, { id: "9" }));

    const result = await upsertContactProps(
      baseEnv(),
      "dupe@example.com",
      { ic__training_booked: "true" },
      "training booked",
    );

    expect(result).toEqual({ skipped: false, created: false });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [retryUrl, retryInit] = fetchMock.mock.calls[2];
    expect(retryUrl).toBe(
      "https://api.hubapi.com/crm/v3/objects/contacts/dupe%40example.com?idProperty=email",
    );
    expect(retryInit.method).toBe("PATCH");
  });

  it("retries once on 429 then succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(429, "rate limited"))
      .mockResolvedValueOnce(mockResponse(200, { id: "3" }));

    const result = await upsertContactProps(
      baseEnv(),
      "retry@example.com",
      { ic__kennismaking_booked: "true" },
      "kennismaking booked",
    );

    expect(result).toEqual({ skipped: false, created: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws on a 400 with status + body", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(400, "PROPERTY_DOESNT_EXIST"));

    await expect(
      upsertContactProps(
        baseEnv(),
        "bad@example.com",
        { nope: "x" },
        "training booked",
      ),
    ).rejects.toThrow(/HubSpot CRM API error 400: PROPERTY_DOESNT_EXIST/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips entirely when no write token is configured", async () => {
    const result = await upsertContactProps(
      baseEnv({ HUBSPOT_WRITE_TOKEN: undefined }),
      "notoken@example.com",
      { ic__training_booked: "true" },
      "training booked",
    );

    expect(result).toEqual({ skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not reject when the audit post fails", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(200, { id: "4" })) // CRM PATCH
      .mockRejectedValueOnce(new Error("slack down")); // audit post

    const result = await upsertContactProps(
      baseEnv({
        SLACK_BOT_TOKEN: "xoxb-test",
        HUBSPOT_AUDIT_CHANNEL: "C_AUDIT",
      }),
      "audit@example.com",
      { ic__training_booked: "true" },
      "training booked",
    );

    expect(result).toEqual({ skipped: false, created: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("resolvePrimaryCompanyId", () => {
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

  it("issues an authenticated GET with no body to the encoded v4 endpoint", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, { results: [{ toObjectId: 555 }] }),
    );

    const id = await resolvePrimaryCompanyId(baseEnv(), "deal/1");

    expect(id).toBe("555");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.hubapi.com/crm/v4/objects/deals/deal%2F1/associations/companies",
    );
    expect(init.method).toBe("GET");
    expect(init.headers.Authorization).toBe("Bearer pat-test-token");
    // A GET must not carry a request body.
    expect(init.body).toBeUndefined();
  });

  it("prefers the Primary association (typeId 5) even when it is not first", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, {
        results: [
          { toObjectId: 100, associationTypes: [{ typeId: 3 }] },
          {
            toObjectId: 200,
            associationTypes: [{ typeId: 5, label: "Primary" }],
          },
        ],
      }),
    );

    expect(await resolvePrimaryCompanyId(baseEnv(), "42")).toBe("200");
  });

  it("falls back to the first result when none is Primary", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, {
        results: [
          { toObjectId: 100, associationTypes: [{ typeId: 3 }] },
          { toObjectId: 200, associationTypes: [{ typeId: 4 }] },
        ],
      }),
    );

    expect(await resolvePrimaryCompanyId(baseEnv(), "42")).toBe("100");
  });

  it("falls back to the first result when associationTypes is absent", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, { results: [{ toObjectId: 777 }] }),
    );

    expect(await resolvePrimaryCompanyId(baseEnv(), "42")).toBe("777");
  });

  it("returns undefined on an empty result set", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { results: [] }));

    expect(await resolvePrimaryCompanyId(baseEnv(), "42")).toBeUndefined();
  });

  it("returns undefined without fetching when no write token is set", async () => {
    expect(
      await resolvePrimaryCompanyId(
        baseEnv({ HUBSPOT_WRITE_TOKEN: undefined }),
        "42",
      ),
    ).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns undefined (never throws) after a final non-ok response", async () => {
    // 500 retries once via hsFetch, then gives up -> undefined.
    fetchMock
      .mockResolvedValueOnce(mockResponse(500, "boom"))
      .mockResolvedValueOnce(mockResponse(500, "boom"));

    expect(await resolvePrimaryCompanyId(baseEnv(), "42")).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("upsertCompanyProps", () => {
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

  it("PATCHes the company endpoint and returns { skipped: false }", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, { id: "c1" }));

    const result = await upsertCompanyProps(
      baseEnv(),
      "9001",
      {
        commercial_registration_number__kvk_: "12345678",
        vat_number_btw: "NL001",
      },
      "agreement kvk/btw",
    );

    expect(result).toEqual({ skipped: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.hubapi.com/crm/v3/objects/companies/9001");
    expect(init.method).toBe("PATCH");
    expect(init.headers.Authorization).toBe("Bearer pat-test-token");
    expect(JSON.parse(init.body)).toEqual({
      properties: {
        commercial_registration_number__kvk_: "12345678",
        vat_number_btw: "NL001",
      },
    });
  });

  it("initiates the exact audit line after a successful write", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(200, { id: "c1" })) // company PATCH
      .mockResolvedValueOnce(mockResponse(200, { ok: true })); // Slack audit

    await upsertCompanyProps(
      baseEnv({
        SLACK_BOT_TOKEN: "xoxb-test",
        HUBSPOT_AUDIT_CHANNEL: "C_AUDIT",
      }),
      "9001",
      { vat_number_btw: "NL001" },
      "agreement kvk/btw",
    );

    // Give the fire-and-forget audit a tick to land.
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const auditBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(auditBody.channel).toBe("C_AUDIT");
    expect(auditBody.text).toBe(
      'booking-portal write: company 9001 {"vat_number_btw":"NL001"} (agreement kvk/btw)',
    );
  });

  it("retries exactly once on 429 then succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(429, "rate limited"))
      .mockResolvedValueOnce(mockResponse(200, { id: "c1" }));

    const result = await upsertCompanyProps(
      baseEnv(),
      "9001",
      { vat_number_btw: "NL001" },
      "agreement kvk/btw",
    );

    expect(result).toEqual({ skipped: false });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws via throwHsError on a final 400", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(400, "PROPERTY_DOESNT_EXIST"));

    await expect(
      upsertCompanyProps(baseEnv(), "9001", { nope: "x" }, "agreement kvk/btw"),
    ).rejects.toThrow(/HubSpot CRM API error 400: PROPERTY_DOESNT_EXIST/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not expose the write token in a thrown error or the request", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(400, "bad"));

    const err = await upsertCompanyProps(
      baseEnv({ HUBSPOT_WRITE_TOKEN: "super-secret-token" }),
      "9001",
      { vat_number_btw: "NL001" },
      "agreement kvk/btw",
    ).catch((e) => e as Error);

    expect(err.message).not.toContain("super-secret-token");
    // The token only travels in the Authorization header, never the URL/body.
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain("super-secret-token");
    expect(String(init.body)).not.toContain("super-secret-token");
  });

  it("skips (no fetch) when no write token is configured", async () => {
    const result = await upsertCompanyProps(
      baseEnv({ HUBSPOT_WRITE_TOKEN: undefined }),
      "9001",
      { vat_number_btw: "NL001" },
      "agreement kvk/btw",
    );

    expect(result).toEqual({ skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not reject when the audit delivery fails", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(200, { id: "c1" })) // company PATCH
      .mockRejectedValueOnce(new Error("slack down")); // audit post

    const result = await upsertCompanyProps(
      baseEnv({
        SLACK_BOT_TOKEN: "xoxb-test",
        HUBSPOT_AUDIT_CHANNEL: "C_AUDIT",
      }),
      "9001",
      { vat_number_btw: "NL001" },
      "agreement kvk/btw",
    );

    expect(result).toEqual({ skipped: false });
  });
});
