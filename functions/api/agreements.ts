/**
 * POST /api/agreements -- sign partner agreement
 */

import { getSupabase } from "../lib/supabase";
import { appendAgreementRow } from "../lib/google-sheets";
import { sendSlackNotification } from "../lib/slack";
import type { Env } from "../lib/types";

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

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  const { env } = context;
  const body = await context.request.json() as Record<string, unknown>;

  const {
    companyName, kvkNumber, btwNumber, contactPerson,
    email, phone, address, postcode, city,
    signature, acceptTerms, acceptDistribution, dealId,
  } = body as {
    companyName: string; kvkNumber: string; btwNumber: string; contactPerson: string;
    email: string; phone: string; address: string; postcode: string; city: string;
    signature: string; acceptTerms: boolean; acceptDistribution: boolean; dealId?: string;
  };

  // Validate required fields
  if (!companyName || !kvkNumber || !btwNumber || !contactPerson || !email || !phone || !address || !postcode || !city) {
    return Response.json({ error: "Vul alle verplichte velden in." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Ongeldig e-mailadres." }, { status: 400 });
  }

  if (!signature) {
    return Response.json({ error: "Handtekening is verplicht." }, { status: 400 });
  }

  if (!acceptTerms || !acceptDistribution) {
    return Response.json({ error: "Accepteer de voorwaarden om door te gaan." }, { status: 400 });
  }

  try {
    const supabase = getSupabase(env);

    const { data: booking, error: insertErr } = await supabase
      .from("bookings")
      .insert({
        type: "agreement",
        partner_name: contactPerson,
        partner_email: email,
        partner_phone: phone,
        company_name: companyName,
        kvk_number: kvkNumber,
        status: "confirmed",
        hubspot_deal_id: dealId || null,
        notes: `BTW: ${btwNumber} | Adres: ${address}, ${postcode} ${city}`,
      })
      .select()
      .single();

    if (insertErr || !booking) {
      console.error("Insert error:", insertErr);
      return Response.json({ error: "Ondertekening mislukt. Probeer het later opnieuw." }, { status: 500 });
    }

    // Write to Google Sheet (non-blocking)
    appendAgreementRow(env, {
      companyName, kvkNumber, btwNumber, contactPerson,
      email, phone, address: `${address}, ${postcode} ${city}`,
      signedAt: new Date().toISOString(), dealId: dealId || "",
    }).catch((e) => console.error("Agreement sheet write failed:", e));

    // Submit to HubSpot Forms API (non-blocking)
    submitToHubSpot(env, {
      email,
      firstname: contactPerson.split(" ")[0],
      lastname: contactPerson.split(" ").slice(1).join(" "),
      company: companyName,
      phone,
      address: `${address}, ${postcode} ${city}`,
      kvkNumber,
      btwNumber,
    }).catch((e) => console.error("HubSpot form submission failed:", e));

    // Slack notification (non-blocking)
    sendSlackNotification(
      env,
      `*Nieuwe partnerovereenkomst ondertekend*\n` +
      `Bedrijf: ${companyName}\n` +
      `Contact: ${contactPerson}\n` +
      `KvK: ${kvkNumber}\n` +
      `E-mail: ${email}\n` +
      `Tel: ${phone}\n` +
      (dealId ? `Deal ID: ${dealId}\n` : "") +
      `_Ondertekend via Installatiepartners Booking Portal_`,
    ).catch((e) => console.error("Slack notification failed:", e));

    return Response.json({
      success: true,
      agreement: {
        id: booking.id,
        companyName,
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
