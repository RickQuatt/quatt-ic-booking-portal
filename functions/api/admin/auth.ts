/**
 * POST /api/admin/auth -- simple static token authentication for admin.
 * Checks request token against ADMIN_TOKENS env var (comma-separated).
 */

import type { Env } from "../../lib/types";

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  const { env } = context;
  const body = await context.request.json() as { token?: string };
  const { token } = body;

  if (!token) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  const validTokens = (env.ADMIN_TOKENS || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (validTokens.length === 0 || !validTokens.includes(token)) {
    return Response.json({ error: "Invalid token" }, { status: 401 });
  }

  // Set admin session cookie
  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set(
    "Set-Cookie",
    `admin_token=${token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; Secure; SameSite=Lax`,
  );

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
};
