/**
 * GET /api/admin/agreements/:id/access-log
 *
 * Returns the download history for a specific signed agreement.
 * Cookie-authed (admin_token cookie + ADMIN_TOKENS env list).
 *
 * Each row corresponds to one fetch of /api/agreements/:id/pdf.
 */

import { validateAdmin } from "../../../../lib/admin-auth";
import type { Env } from "../../../../lib/types";

interface AccessLogRow {
  id: string;
  agreement_id: string;
  accessed_at: string;
  accessed_ip: string | null;
  user_agent: string | null;
  referer: string | null;
}

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
  params: { id: string };
}) => {
  const { env, request, params } = context;

  if (!(await validateAdmin(request, env))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.DB) {
    return Response.json({ error: "D1 binding missing" }, { status: 500 });
  }

  const { id } = params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Invalid agreement id" }, { status: 400 });
  }

  // Confirm the agreement itself exists (avoids leaking "doesn't exist" via empty result).
  const exists = await env.DB.prepare(
    "SELECT id FROM signed_agreements WHERE id = ? LIMIT 1",
  )
    .bind(id)
    .first<{ id: string }>();
  if (!exists) {
    return Response.json({ error: "Overeenkomst niet gevonden." }, { status: 404 });
  }

  const result = await env.DB.prepare(
    `SELECT id, agreement_id, accessed_at, accessed_ip, user_agent, referer
       FROM agreement_access_log
       WHERE agreement_id = ?
       ORDER BY accessed_at DESC
       LIMIT 1000`,
  )
    .bind(id)
    .all<AccessLogRow>();

  return Response.json({
    agreement_id: id,
    access_count: result.results?.length ?? 0,
    rows: result.results ?? [],
  });
};
