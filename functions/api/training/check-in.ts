/**
 * POST /api/training/check-in
 *
 * Public endpoint hit when a partner scans the QR on the trainer's slide.
 * Flips contact `ic__training_completed=true` in HubSpot via the Forms API.
 * A HubSpot sync workflow copies that to the associated deal, which
 * Partner Progression Branch D uses to trigger the post-training sequence.
 *
 * No authentication, no Supabase lookup. Rick explicitly accepted the
 * self-verify risk: anyone with a known IC contact email can mark themselves
 * attended. The fallout (AM sees a surprise task or progression mail) is
 * cheaper than adding friction to the training room check-in flow.
 */

import { setTrainingAttended } from "../../lib/hubspot-forms";
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
    bucket: "training-checkin",
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

  await setTrainingAttended(env, email);

  // Wall-E OS milestone (non-blocking, feature-flagged off until env is set).
  // Training check-in = training_completed. Check-in timestamps land in evidence
  // via session.start_at so the milestone row is deduped on the event_id.
  const now = new Date().toISOString();
  postWalleosBooking(env, {
    event_id: `training-checkin-${email}-${now.slice(0, 10)}`,
    event_type: "training_completed",
    partner_email: email,
    session: {
      session_id: `checkin-${now}`,
      start_at: now,
      host: "self-service check-in",
    },
  }).catch((e) => console.error("Wall-E OS training_completed push failed:", e));

  return Response.json({ success: true });
};
