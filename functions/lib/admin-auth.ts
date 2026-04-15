/**
 * Admin authentication helper -- shared across admin API routes.
 * Uses timing-safe comparison to prevent timing attacks on admin tokens.
 */

import { timingSafeCompare } from "./booking-tokens";
import type { Env } from "./types";

export function getAdminToken(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const adminCookie = cookies.find((c) => c.startsWith("admin_token="));
  return adminCookie ? adminCookie.split("=")[1] : null;
}

export async function validateAdmin(
  request: Request,
  env: Env,
): Promise<boolean> {
  const token = getAdminToken(request);
  if (!token) return false;

  const validTokens = (env.ADMIN_TOKENS || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (validTokens.length === 0) return false;

  for (const validToken of validTokens) {
    if (await timingSafeCompare(token, validToken)) {
      return true;
    }
  }

  return false;
}
