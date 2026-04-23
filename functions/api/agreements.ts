/**
 * POST /api/agreements -- sign partner agreement (D1 + R2, no Supabase).
 *
 * Flow:
 *  1. Validate input.
 *  2. Snapshot = server-baked AGREEMENT_HTML (client cannot forge).
 *  3. Insert row into D1 `signed_agreements`.
 *  4. Generate PDF (pdf-lib), upload to R2, update the row with pdf_r2_key.
 *  5. Fire-and-forget: Google Sheet, HubSpot form, Slack ping, partner email with PDF.
 *  6. Return success + download URL (/api/agreements/{id}/pdf).
 */

import { appendAgreementRow } from "../lib/google-sheets";
import { sendSlackNotification } from "../lib/slack";
import {
  rateLimit,
  rateLimitResponse,
  originMatchesHost,
} from "../lib/rate-limit";
import { generateAgreementPdf } from "../lib/generate-agreement-pdf";
import {
  AGREEMENT_HTML,
  AGREEMENT_PLAINTEXT,
  AGREEMENT_VERSION,
} from "../lib/agreement-content";
import type { Env } from "../lib/types";
import { postWalleosBooking } from "../lib/walleos";

const HUBSPOT_PORTAL_ID = "25848718";
const HUBSPOT_FORM_GUID = "617e3a0d-0e25-44d6-b8c9-724e83226a96";

async function submitToHubSpot(env: Env, fields: Record<string, string>) {
  const response = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: Object.entries(fields).map(([name, value]) => ({ name, value })),
        context: {
          pageUri: `${env.BASE_URL}/book/agreement`,
          pageName: "IC - Partner Agreement",
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HubSpot form submission failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function sendAgreementPdfEmail(
  env: Env,
  to: string,
  pdfBase64: string,
  companyName: string,
  contactPerson: string,
): Promise<void> {
  const from = env.EMAIL_FROM || "Quatt Installatiepartners <onboarding@resend.dev>";
  const body = `<!DOCTYPE html>
<html lang="nl"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1A1A;">
  <div style="max-width:580px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #E8E4DD;">
      <h1 style="font-size:22px;margin:0 0 16px 0;color:#1A1A1A;">Bedankt voor het ondertekenen</h1>
      <p style="font-size:15px;line-height:1.6;color:#1A1A1A;">Beste ${contactPerson},</p>
      <p style="font-size:15px;line-height:1.6;color:#1A1A1A;">Je hebt zojuist de Quatt partnerovereenkomst ondertekend namens <strong>${companyName}</strong>. Een kopie van de ondertekende overeenkomst vind je in de bijlage van deze mail.</p>
      <p style="font-size:15px;line-height:1.6;color:#1A1A1A;">Je Quatt partnermanager neemt binnen enkele dagen contact met je op over de volgende stappen.</p>
      <p style="font-size:15px;line-height:1.6;color:#1A1A1A;margin-top:24px;">Met vriendelijke groet,<br>Team Quatt Installatiepartners</p>
    </div>
    <div style="margin-top:24px;padding:0 4px;color:#8A8580;font-size:13px;line-height:1.6;">
      <p>Vragen? Bel ons op <a href="tel:+31208082116" style="color:#FF6933;text-decoration:none;">020 808 2116</a> of mail naar <a href="mailto:zakelijk@quatt.io" style="color:#FF6933;text-decoration:none;">zakelijk@quatt.io</a></p>
      <p style="margin-top:8px;">Quatt B.V. - Koningin Wilhelminaplein 29, 1062 HJ Amsterdam</p>
    </div>
  </div>
</body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from,
      to,
      bcc: "partners@quatt.io",
      subject: "Je ondertekende Quatt partnerovereenkomst",
      html: body,
      attachments: [
        {
          filename: "Quatt-Partnerovereenkomst.pdf",
          content: pdfBase64,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend agreement mail failed (${res.status}): ${text}`);
  }
}

function pdfToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0].trim() ||
    "unknown"
  );
}

function uuidv4(): string {
  // Workers have crypto.randomUUID() on all recent runtimes.
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback (shouldn't hit on Cloudflare).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  const { env, request } = context;

  if (!originMatchesHost(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }

  const rl = await rateLimit(env.RATE_LIMIT, request, {
    bucket: "agreements",
    max: 3,
    windowSeconds: 600,
  });
  if (!rl.ok) return rateLimitResponse(rl);

  if (!env.DB) {
    console.error("D1 binding 'DB' missing");
    return Response.json({ error: "Opslag is tijdelijk niet beschikbaar." }, { status: 503 });
  }

  const body = (await context.request.json()) as Record<string, unknown>;
  const {
    companyName,
    kvkNumber,
    btwNumber,
    contactPerson,
    email,
    phone,
    address,
    postcode,
    city,
    signature,
    acceptTerms,
    acceptDistribution,
    dealId,
    version,
  } = body as {
    companyName: string;
    kvkNumber: string;
    btwNumber: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    postcode: string;
    city: string;
    signature: string;
    acceptTerms: boolean;
    acceptDistribution: boolean;
    dealId?: string;
    version?: string;
  };

  if (
    !companyName ||
    !kvkNumber ||
    !btwNumber ||
    !contactPerson ||
    !email ||
    !phone ||
    !address ||
    !postcode ||
    !city
  ) {
    return Response.json({ error: "Vul alle verplichte velden in." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Ongeldig e-mailadres." }, { status: 400 });
  }
  if (!signature) {
    return Response.json({ error: "Handtekening is verplicht." }, { status: 400 });
  }
  if (!acceptTerms || !acceptDistribution) {
    return Response.json(
      { error: "Accepteer de voorwaarden om door te gaan." },
      { status: 400 },
    );
  }

  const resolvedVersion = (version && version.trim()) || AGREEMENT_VERSION;
  const resolvedSnapshot = AGREEMENT_HTML; // server-baked, never trust client
  const signedAt = new Date().toISOString();
  const signedIp = getClientIp(request);
  const id = uuidv4();

  try {
    // Insert the signed row first -- we never lose consent even if PDF/email fails.
    await env.DB.prepare(
      `INSERT INTO signed_agreements (
         id, signed_at, signed_ip,
         company_name, kvk_number, btw_number, contact_person, email, phone,
         address, postcode, city,
         hubspot_deal_id,
         agreement_version, agreement_html_snapshot,
         accept_terms, accept_distribution
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        signedAt,
        signedIp,
        companyName,
        kvkNumber,
        btwNumber,
        contactPerson,
        email,
        phone,
        address,
        postcode,
        city,
        dealId ?? null,
        resolvedVersion,
        resolvedSnapshot,
        acceptTerms ? 1 : 0,
        acceptDistribution ? 1 : 0,
      )
      .run();

    // Generate + upload PDF.
    let pdfR2Key: string | null = null;
    let pdfBase64: string | null = null;
    try {
      const pdfBytes = await generateAgreementPdf({
        companyName,
        kvkNumber,
        btwNumber,
        contactPerson,
        email,
        phone,
        address,
        postcode,
        city,
        dealId,
        version: resolvedVersion,
        signedAt,
        signedIp,
        signaturePngDataUrl: signature,
        agreementPlainText: AGREEMENT_PLAINTEXT,
      });
      pdfBase64 = pdfToBase64(pdfBytes);

      const year = new Date(signedAt).getUTCFullYear();
      pdfR2Key = `agreements/${year}/${dealId || "nodeal"}-${id}-v${resolvedVersion}.pdf`;

      if (env.AGREEMENTS) {
        await env.AGREEMENTS.put(pdfR2Key, pdfBytes, {
          httpMetadata: { contentType: "application/pdf" },
          customMetadata: {
            companyName,
            contactPerson,
            version: resolvedVersion,
            signedAt,
            dealId: dealId || "",
          },
        });
        await env.DB.prepare("UPDATE signed_agreements SET pdf_r2_key = ? WHERE id = ?")
          .bind(pdfR2Key, id)
          .run();
      } else {
        console.warn("AGREEMENTS R2 bucket not bound -- PDF not persisted");
      }
    } catch (pdfErr) {
      console.error("PDF generate/upload failed:", pdfErr);
      sendSlackNotification(
        env,
        `*ALERT: PDF generation failed for signed agreement*\n` +
          `D1 row ${id} exists but no PDF was stored.\n` +
          `Company: ${companyName}\nEmail: ${email}\n` +
          (dealId ? `Deal: ${dealId}\n` : "") +
          `Error: ${pdfErr instanceof Error ? pdfErr.message : String(pdfErr)}`,
      ).catch(() => {});
    }

    if (pdfBase64) {
      sendAgreementPdfEmail(env, email, pdfBase64, companyName, contactPerson).catch((e) => {
        console.error("Resend agreement PDF mail failed:", e);
        sendSlackNotification(
          env,
          `*ALERT: could not email signed agreement PDF to ${email}*\n` +
            `D1 row: ${id}\nR2 key: ${pdfR2Key ?? "(none)"}\n` +
            `Error: ${e instanceof Error ? e.message : String(e)}`,
        ).catch(() => {});
      });
    }

    appendAgreementRow(env, {
      companyName,
      kvkNumber,
      btwNumber,
      contactPerson,
      email,
      phone,
      address: `${address}, ${postcode} ${city}`,
      signedAt,
      dealId: dealId || "",
    }).catch((e) => console.error("Agreement sheet write failed:", e));

    const hubspotFields: Record<string, string> = {
      email,
      firstname: contactPerson.split(" ")[0],
      lastname: contactPerson.split(" ").slice(1).join(" "),
      company: companyName,
      phone,
      address: `${address}, ${postcode} ${city}`,
      kvkNumber,
      btwNumber,
    };
    if (dealId) hubspotFields.ic_agreement_deal_id = dealId;
    submitToHubSpot(env, hubspotFields).catch((e) => {
      console.error("HubSpot form submission failed:", e);
      sendSlackNotification(
        env,
        `*ALERT: HubSpot agreement form submission failed*\n` +
          `Partner saw success but the form did NOT reach HubSpot. Partner Progression will not fire.\n` +
          `Email: ${email}\nCompany: ${companyName}\n` +
          (dealId ? `Deal ID: ${dealId}\n` : "No dealId in payload\n") +
          `Error: ${e instanceof Error ? e.message : String(e)}`,
      ).catch(() => {});
    });

    sendSlackNotification(
      env,
      `*Nieuwe partnerovereenkomst ondertekend*\n` +
        `Bedrijf: ${companyName}\n` +
        `Contact: ${contactPerson}\n` +
        `KvK: ${kvkNumber}\n` +
        `E-mail: ${email}\n` +
        `Tel: ${phone}\n` +
        `Versie: ${resolvedVersion}\n` +
        (pdfR2Key ? `PDF: ${pdfR2Key}\n` : "") +
        (dealId ? `Deal ID: ${dealId}\n` : "") +
        `_Ondertekend via Installatiepartners Booking Portal_`,
    ).catch((e) => console.error("Slack notification failed:", e));

    // Wall-E OS milestone (non-blocking, feature-flagged off until env is set).
    // agreement_signed is now the canonical source for the Deelnameovereenkomst
    // -- JotForm is deprecated as of 2026-04-23.
    postWalleosBooking(env, {
      event_id: `agreement-${id}`,
      event_type: "agreement_signed",
      partner_email: email,
      hubspot_deal_id: dealId || undefined,
      session: {
        session_id: id,
        start_at: new Date().toISOString(),
        url: pdfR2Key ? `${env.BASE_URL}/api/agreements/${id}/pdf` : undefined,
        host: `agreement ${resolvedVersion}`,
      },
    }).catch((e) => console.error("Wall-E OS agreement_signed push failed:", e));

    return Response.json({
      success: true,
      agreement: {
        id,
        companyName,
        version: resolvedVersion,
        pdfR2Key,
        downloadUrl: pdfR2Key ? `/api/agreements/${id}/pdf` : null,
      },
    });
  } catch (error) {
    console.error("Agreement error:", error);
    return Response.json(
      { error: "Ondertekening mislukt. Probeer het later opnieuw." },
      { status: 500 },
    );
  }
};
