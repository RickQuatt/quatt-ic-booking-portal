/**
 * POST /api/admin/auth -- simple static token authentication for admin.
 * Validates token against ADMIN_TOKENS env var (comma-separated) using a
 * timing-safe compare (mirrors the check in lib/admin-auth.ts).
 */

import { timingSafeCompare } from "../../lib/booking-tokens";
import { rateLimit, rateLimitResponse } from "../../lib/rate-limit";
import type { Env } from "../../lib/types";

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  const { env, request } = context;

  // Throttle to slow brute-force on admin tokens.
  const rl = await rateLimit(env.RATE_LIMIT, request, {
    bucket: "admin-auth",
    max: 5,
    windowSeconds: 300,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  const body = (await request.json()) as { token?: string };
  const { token } = body;

  if (!token) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  const validTokens = (env.ADMIN_TOKENS || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (validTokens.length === 0) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  let match = false;
  for (const valid of validTokens) {
    // Always run all comparisons -- avoid early-return timing leak.
    if (await timingSafeCompare(token, valid)) match = true;
  }

  if (!match) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set(
    "Set-Cookie",
    `admin_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; Secure; SameSite=Strict`,
  );

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers,
  });
};
