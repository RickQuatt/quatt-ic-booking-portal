import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { upsertContactProps, toHubSpotDateMs } from "./hubspot-crm";
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
      .mockResolvedValueOnce(mockResponse(409, { message: "Contact already exists" }))
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
