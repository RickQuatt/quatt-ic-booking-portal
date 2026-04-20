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

  return Response.json({ success: true });
};
