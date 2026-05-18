/**
 * POST /api/kennismaking/check-in
 *
 * Public endpoint hit when a partner scans the QR on the AM's kennismaking
 * slide / printed card. Records `kennismaking_completed` in Wall-E OS, which
 * then writes `ic__kennismaking_completed=true` on the HubSpot deal via the
 * property-drain worker.
 *
 * Mirror of /api/training/check-in but for kennismaking. No HubSpot Forms-API
 * call (kennismaking_completed has no contact mirror today -- Wall-E OS does
 * the direct deal-property write via the v2 outbox path).
 *
 * No authentication, no Supabase lookup. Same self-verify risk Rick accepted
 * for /training/check-in: anyone with a known IC contact email can mark
 * themselves attended.
 */

import { postWalleosBooking } from "../../lib/walleos";
import {
  rateLimit,
  rateLimitResponse,
  originMatchesHost,
} from "../../lib/rate-limit";
import type { Env } from "../../lib/types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  const { env, request } = context;

  if (!originMatchesHost(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const rl = await rateLimit(env.RATE_LIMIT, request, {
    bucket: "kennismaking-checkin",
    max: 20,
    windowSeconds: 60,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const company = String(body.company ?? "").trim();

  if (!email || !name || !company) {
    return Response.json(
      { error: "Vul e-mail, naam en bedrijf in." },
      { status: 400 },
    );
  }
  if (!EMAIL_REGEX.test(email)) {
    return Response.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  // Wall-E OS milestone (non-blocking, feature-flagged off until env is set).
  // Kennismaking check-in = kennismaking_completed. Wall-E OS resolves the
  // partner by email, records the milestone, and emits a v2 hubspot_outbox
  // row that the property-drain worker flushes to HubSpot as
  // ic__kennismaking_completed=true on the deal.
  const now = new Date().toISOString();
  postWalleosBooking(env, {
    event_id: `kennismaking-checkin-${email}-${now.slice(0, 10)}`,
    event_type: "kennismaking_completed",
    partner_email: email,
    session: {
      session_id: `checkin-${now}`,
      start_at: now,
      host: "self-service check-in",
    },
  }).catch((e) =>
    console.error("Wall-E OS kennismaking_completed push failed:", e),
  );

  return Response.json({ success: true });
};
