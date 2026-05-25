/**
 * GET /api/agreement-status?email=X&dealId=Y[&minVersion=2]
 *
 * Public lookup of "has this partner signed the agreement?" Used by:
 *   - /book/training page (gate before showing the calendar)
 *   - POST /api/bookings (defensive server-side gate)
 *   - Any future surface (AM toolkit, etc) that needs the same check
 *
 * Response: { signed: boolean, version?: string, signedAt?: string, matchedBy?: 'email'|'hubspot_deal_id' }
 *
 * Either email or dealId must be provided. Returns signed:false when both
 * are missing. No auth (the booking portal is public-facing and the response
 * leaks no PII beyond the existence of a signed record for the supplied lookup).
 */

import type { Env } from "../lib/types";
import { hasSignedAgreement } from "../lib/d1-agreements";

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const url = new URL(context.request.url);
  const email = url.searchParams.get("email") || undefined;
  const dealId = url.searchParams.get("dealId") || undefined;
  const minVersion = url.searchParams.get("minVersion") || undefined;

  if (!email && !dealId) {
    return new Response(
      JSON.stringify({
        signed: false,
        error: "missing-lookup",
        detail: "Provide email and/or dealId in the query string.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const status = await hasSignedAgreement(context.env, {
      email,
      dealId,
      minVersion,
    });
    return new Response(JSON.stringify(status), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({
        signed: false,
        error: "lookup-failed",
        detail: (e as Error).message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
