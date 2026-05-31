/**
 * walleos-pull.ts -- read canonical partner state from wall-e-os.
 *
 * Phase 5 of the portal ⇄ walleos sync project. The booking portal has
 * always WRITTEN to walleos but never READ from it. UX gates (block
 * training booking before agreement signed; block first-install before
 * training completed; prevent duplicate agreement sign) need canonical
 * state. This module is the thin HTTP client.
 *
 * Service-token auth via env.WALLEOS_SERVICE_TOKEN. The token needs scope
 * `partners:read`. Walleos endpoint:
 *   GET /api/v1/partners/by-email/:email
 *
 * Soft-fail: if walleos is unreachable or the env vars are missing, the
 * helper returns `null` so callers can fall back to legacy
 * D1 / HubSpot lookups. The gates ALWAYS read this; if it returns null,
 * we permit the action (fail-open) and log a warning. Better to let a
 * partner sign twice than block the whole portal on a walleos outage.
 */

import type { Env } from "./types";

export interface WalleosPartnerState {
  partner_id: number;
  hubspot_company_id: string;
  hubspot_deal_id: string | null;
  name: string;
  lifecycle_stage: string;
  tier_arch: string | null;
  am_owner: string | null;
  tombstoned_at: string | null;
  agreement_signed_at: string | null;
  kennismaking_booked_at: string | null;
  kennismaking_completed_at: string | null;
  training_booked_at: string | null;
  training_completed_at: string | null;
  first_install_booked_at: string | null;
  first_install_completed_at: string | null;
  portal_access_at: string | null;
  first_order_at: string | null;
  certified_at: string | null;
}

interface WalleosByEmailResponse {
  ok: boolean;
  matched_via: string;
  partner: WalleosPartnerState;
}

// In-memory cache keyed on lowercased email. 60s TTL -- the canonical
// state changes seldom between portal page loads. Bumps on every booking
// reset implicitly because the cache only lives for the duration of one
// Worker invocation in CF Pages (no shared state across requests). 60s
// is just a hedge for sub-bundle re-renders that fetch twice in close
// succession.
const cache = new Map<string, { exp: number; state: WalleosPartnerState }>();

/**
 * Resolve a partner by contact email. Returns null when:
 *   - env.WALLEOS_URL or env.WALLEOS_SERVICE_TOKEN is missing
 *   - the lookup returns 404 (no partner with this email)
 *   - the lookup errors (network, 5xx)
 *
 * Logs the failure mode so on-call can diagnose; callers should fail-open.
 */
export async function resolvePartnerByEmail(
  env: Env,
  email: string,
): Promise<WalleosPartnerState | null> {
  const url = env.WALLEOS_URL;
  const token = env.WALLEOS_SERVICE_TOKEN;
  if (!url || !token) {
    // Feature-flagged off -- silent.
    return null;
  }

  const key = email.trim().toLowerCase();
  if (!key || !/^[^@]+@[^@]+\.[^@]+$/.test(key)) return null;

  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.exp > now) return cached.state;

  const endpoint = `${url.replace(/\/$/, "")}/api/v1/partners/by-email/${encodeURIComponent(key)}`;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
  } catch (e) {
    console.warn(
      `[walleos-pull] transport error for ${key}: ${(e as Error).message}`,
    );
    return null;
  }

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(
      `[walleos-pull] ${res.status} for ${key}: ${body.slice(0, 200)}`,
    );
    return null;
  }

  let parsed: WalleosByEmailResponse;
  try {
    parsed = (await res.json()) as WalleosByEmailResponse;
  } catch {
    console.warn(`[walleos-pull] invalid JSON response for ${key}`);
    return null;
  }

  if (!parsed.partner) return null;
  cache.set(key, { exp: now + 60_000, state: parsed.partner });
  return parsed.partner;
}

/**
 * Has this email already signed an agreement? Returns true if walleos
 * has an `agreement_signed_at` for the partner attached to this email.
 * Soft-true: returns false when walleos can't resolve (fail-open).
 */
export async function hasSignedAgreement(env: Env, email: string): Promise<boolean> {
  const partner = await resolvePartnerByEmail(env, email);
  return !!partner?.agreement_signed_at;
}

/**
 * Has this email's partner completed training? Used as a gate for first-install.
 * Soft-false on lookup failure.
 */
export async function hasCompletedTraining(env: Env, email: string): Promise<boolean> {
  const partner = await resolvePartnerByEmail(env, email);
  return !!partner?.training_completed_at;
}
