/**
 * GET /api/internal/bookings-summary?since=YYYY-MM-DD
 *
 * Lightweight booking evidence for the AM toolkit's Aanmeldingen view: which
 * emails/companies have an active (non-cancelled) booking of any type since
 * `since`. The toolkit's own milestone flags are unreliable (W8 company-id
 * corruption), so it derives "contacted" from this + Aircall matches.
 *
 * Auth: same x-reserve-secret / RESERVE_SECRET as the other /api/internal/
 * endpoints (middleware whitelists the prefix; the secret gates it).
 */

import type { Env } from "../../lib/types";
import { requireDb } from "../../lib/d1-bookings";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

const SINCE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { env, request } = context;

  if (!env.RESERVE_SECRET) {
    return Response.json({ error: "Endpoint not configured" }, { status: 503 });
  }
  const provided = request.headers.get("x-reserve-secret") || "";
  if (!provided || !timingSafeEqual(provided, env.RESERVE_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const since = url.searchParams.get("since") || "";
  if (!SINCE_RE.test(since)) {
    return Response.json({ error: "since is required (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const db = requireDb(env);
    const { results } = await db
      .prepare(
        `SELECT type, status, partner_email, company_name, created_at
           FROM bookings
          WHERE status != 'cancelled'
            AND created_at >= ?
          ORDER BY created_at DESC
          LIMIT 2000`,
      )
      .bind(since)
      .all<{
        type: string;
        status: string;
        partner_email: string;
        company_name: string;
        created_at: string;
      }>();

    const rows = results ?? [];
    return Response.json({
      since,
      truncated: rows.length === 2000,
      bookings: rows.map((b) => ({
        type: b.type,
        status: b.status,
        partnerEmail: b.partner_email,
        companyName: b.company_name,
        createdAt: b.created_at,
      })),
    });
  } catch (e) {
    console.error("bookings-summary failed:", e);
    return Response.json({ error: "Query failed" }, { status: 500 });
  }
};
