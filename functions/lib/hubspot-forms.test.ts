import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setTrainingBooked } from "./hubspot-forms";
import type { Env } from "./types";

function mockResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => body,
  } as unknown as Response;
}

function env(overrides: Partial<Env> = {}): Env {
  return {
    HUBSPOT_TRAINING_FORM_ID: "form-guid-123",
    ...overrides,
  } as unknown as Env;
}

describe("hubspot-forms direct-write rewire", () => {
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

  it("resolves when the direct write succeeds and the legacy form submit fails", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(200, { id: "1" })) // CRM PATCH ok
      .mockRejectedValueOnce(new Error("forms spam filter down")); // Forms API fails

    await expect(
      setTrainingBooked(
        env({ HUBSPOT_WRITE_TOKEN: "pat-test" }),
        "partner@example.com",
        "42",
        "2026-07-21",
      ),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Best-effort form failure only warns.
    expect(console.warn).toHaveBeenCalled();
  });

  it("rejects when no write token is set and the legacy form submit fails", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(500, "forms error")); // Forms API primary

    await expect(
      setTrainingBooked(
        env({ HUBSPOT_WRITE_TOKEN: undefined }),
        "partner@example.com",
        "42",
        "2026-07-21",
      ),
    ).rejects.toThrow(/HubSpot Forms API error 500/);

    // No token -> no CRM fetch; only the Forms API call happened.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
