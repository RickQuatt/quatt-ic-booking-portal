/**
 * am-assignment.ts -- resolve which AM owns a training booking.
 *
 * 3-step routing (Rick 2026-06-03):
 *   1. existing-am  -- partner already has an owner in walleos.
 *   2. override     -- specific-partner override table (e.g. De Vreeden -> Daniel).
 *   3. round-robin  -- Mitchell/Ralph rotation, same pattern as kennismaking.
 *
 * Returns { amEmail, amName, source }. Both `amEmail` and `amName` are
 * always populated; `source` lets callers log how the assignment was made.
 *
 * Service-only -- never expose this resolution decision to the partner
 * (would leak AM-routing logic).
 */

import { AM_CONFIG, type Env } from "./types";
import type { WalleosPartnerState } from "./walleos-pull";
import { countBookingsByType } from "./d1-bookings";

export type AmAssignment = {
  amEmail: string;
  amName: string;
  source: "existing-am" | "override" | "round-robin";
};

/**
 * Specific-partner overrides. Match against partner companyName (case-insensitive,
 * trimmed) or kvkNumber. First match wins. Phase F (AM Toolkit CRUD) will move
 * this to a walleos `am_routing_rules` table.
 */
const OVERRIDES: ReadonlyArray<{
  matchType: "companyName" | "kvkNumber";
  value: string;
  amEmail: string;
  amName: string;
}> = [
  {
    matchType: "companyName",
    value: "de vreeden klimaservice",
    amEmail: "daniel.m@quatt.io",
    amName: "Daniel Mens",
  },
];

function findOverride(
  companyName: string | null | undefined,
  kvkNumber: string | null | undefined,
): { amEmail: string; amName: string } | null {
  const cn = (companyName || "").trim().toLowerCase();
  const kvk = (kvkNumber || "").trim();
  for (const rule of OVERRIDES) {
    if (rule.matchType === "companyName" && cn && cn === rule.value) {
      return { amEmail: rule.amEmail, amName: rule.amName };
    }
    if (rule.matchType === "kvkNumber" && kvk && kvk === rule.value) {
      return { amEmail: rule.amEmail, amName: rule.amName };
    }
  }
  return null;
}

/**
 * Resolve an AM for a booking. Always returns a populated assignment.
 */
export async function resolveAmForBooking(
  env: Env,
  input: {
    companyName?: string | null;
    kvkNumber?: string | null;
    partnerState?: WalleosPartnerState | null;
  },
): Promise<AmAssignment> {
  // Step 1: existing AM on the partner record.
  if (input.partnerState?.am_owner) {
    const match = AM_CONFIG.find(
      (a) => a.email.toLowerCase() === input.partnerState!.am_owner!.toLowerCase(),
    );
    if (match) {
      return { amEmail: match.email, amName: match.name, source: "existing-am" };
    }
    // Unknown AM email in walleos -- pass it through anyway (e.g. Daniel
    // isn't in AM_CONFIG but is the recorded owner). Use the email as the
    // "name" fallback.
    return {
      amEmail: input.partnerState.am_owner,
      amName: input.partnerState.am_owner.split("@")[0] || "AM",
      source: "existing-am",
    };
  }

  // Step 2: specific-partner override.
  const override = findOverride(input.companyName, input.kvkNumber);
  if (override) {
    return { amEmail: override.amEmail, amName: override.amName, source: "override" };
  }

  // Step 3: round-robin Mitchell/Ralph. Reuses the kennismaking pattern:
  // count training bookings so far, modulo AM_CONFIG length.
  const count = await countBookingsByType(env, "training");
  const am = AM_CONFIG[count % AM_CONFIG.length];
  return { amEmail: am.email, amName: am.name, source: "round-robin" };
}
