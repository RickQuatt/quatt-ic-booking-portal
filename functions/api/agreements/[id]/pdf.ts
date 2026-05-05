/**
 * GET /api/agreements/:id/pdf
 *
 * Streams the signed agreement PDF from R2. Lookup via D1 on the UUID.
 * Gated by: origin check + UUID knowledge (v4 = 122 bits of entropy).
 * Future: swap for short-lived signed token in the response URL.
 */

import { originMatchesHost } from "../../../lib/rate-limit";
import type { Env } from "../../../lib/types";

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
  params: { id: string };
  waitUntil: (promise: Promise<unknown>) => void;
}) => {
  const { env, request, params, waitUntil } = context;

  if (!originMatchesHost(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const { id } = params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Invalid agreement id" }, { status: 400 });
  }

  if (!env.DB) {
    return Response.json({ error: "Opslag is niet beschikbaar." }, { status: 503 });
  }

  const row = await env.DB.prepare(
    "SELECT pdf_r2_key, company_name FROM signed_agreements WHERE id = ?",
  )
    .bind(id)
    .first<{ pdf_r2_key: string | null; company_name: string }>();

  if (!row || !row.pdf_r2_key) {
    return Response.json({ error: "Overeenkomst niet gevonden." }, { status: 404 });
  }

  if (!env.AGREEMENTS) {
    return Response.json(
      { error: "PDF storage is niet beschikbaar op deze omgeving." },
      { status: 503 },
    );
  }

  const object = await env.AGREEMENTS.get(row.pdf_r2_key);
  if (!object) {
    return Response.json({ error: "PDF bestand niet gevonden." }, { status: 404 });
  }

  // Audit log: one row per successful fetch. waitUntil keeps the D1 write
  // alive after the Response returns -- floating promises get killed by the
  // Pages Functions runtime and the row never lands. Closes the
  // "who downloaded the contract when?" legal-readiness gap.
  waitUntil(
    logAccess(env, id, request).catch((e) =>
      console.error("agreement access log write failed:", e),
    ),
  );

  const safeCompany = (row.company_name || "Partner")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .slice(0, 60);
  const filename = `Quatt-Partnerovereenkomst-${safeCompany}.pdf`;

  return new Response(object.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
};

function uuidv4(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function trimOrNull(s: string | null, max: number): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

async function logAccess(env: Env, agreementId: string, request: Request): Promise<void> {
  if (!env.DB) return;
  await env.DB.prepare(
    `INSERT INTO agreement_access_log (id, agreement_id, accessed_ip, user_agent, referer)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      uuidv4(),
      agreementId,
      request.headers.get("CF-Connecting-IP"),
      trimOrNull(request.headers.get("User-Agent"), 256),
      trimOrNull(request.headers.get("Referer"), 256),
    )
    .run();
}
