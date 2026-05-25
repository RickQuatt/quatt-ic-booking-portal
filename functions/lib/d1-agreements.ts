/**
 * D1 access layer for signed agreements. Source of truth for the
 * "has this partner signed the agreement?" gate.
 *
 * Lookup is OR'd across email + hubspot_deal_id (per Rick's call):
 * once anyone at the company has signed, the company is allowed through
 * the training-booking gate (dealId is per-installer-company, so it's the
 * right "scope of trust" for colleague-forwarding edge cases).
 */

import type { Env } from "./types";
import { requireDb } from "./d1-bookings";

export interface AgreementStatus {
  signed: boolean;
  /** Most recent agreement_version found, when signed. */
  version?: string;
  /** Most recent signed_at (ISO-8601 UTC), when signed. */
  signedAt?: string;
  /** Which lookup hit -- helps debug + emits useful telemetry. */
  matchedBy?: "email" | "hubspot_deal_id";
}

export interface AgreementLookup {
  email?: string | null;
  dealId?: string | null;
  /** Optional minimum agreement version to accept (string compare). */
  minVersion?: string | null;
}

/**
 * Returns whether a signed agreement exists for the given email OR dealId.
 * Per-row OR semantics: a hit on EITHER email or hubspot_deal_id passes
 * the gate. minVersion is applied as `agreement_version >= minVersion`
 * (string compare, fine for "2" / "v2" patterns).
 */
export async function hasSignedAgreement(
  env: Env,
  lookup: AgreementLookup,
): Promise<AgreementStatus> {
  const email = lookup.email?.trim();
  const dealId = lookup.dealId?.trim();
  if (!email && !dealId) return { signed: false };

  const db = requireDb(env);

  // OR'd lookup. Pick most recent signing.
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (email) {
    conditions.push("LOWER(email) = LOWER(?)");
    params.push(email);
  }
  if (dealId) {
    conditions.push("hubspot_deal_id = ?");
    params.push(dealId);
  }
  let where = `(${conditions.join(" OR ")})`;
  if (lookup.minVersion) {
    where += " AND agreement_version >= ?";
    params.push(lookup.minVersion);
  }

  const row = await db
    .prepare(
      `SELECT email, hubspot_deal_id, agreement_version, signed_at
         FROM signed_agreements
        WHERE ${where}
        ORDER BY signed_at DESC
        LIMIT 1`,
    )
    .bind(...params)
    .first<{
      email: string | null;
      hubspot_deal_id: string | null;
      agreement_version: string;
      signed_at: string;
    }>();

  if (!row) return { signed: false };

  // Determine which side of the OR matched (for telemetry).
  let matchedBy: "email" | "hubspot_deal_id" | undefined;
  if (email && row.email && row.email.toLowerCase() === email.toLowerCase()) {
    matchedBy = "email";
  } else if (dealId && row.hubspot_deal_id === dealId) {
    matchedBy = "hubspot_deal_id";
  }

  return {
    signed: true,
    version: row.agreement_version,
    signedAt: row.signed_at,
    matchedBy,
  };
}
