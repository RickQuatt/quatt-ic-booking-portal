/**
 * HubSpot Forms API -- public, no auth required.
 * Already uses fetch() -- works in Cloudflare Workers as-is.
 */

import type { Env } from "./types";

const PORTAL_ID = "25848718";

export async function setKennismakingBooked(
  env: Env,
  email: string,
  dealId?: string,
  meetingDate?: string,
): Promise<void> {
  const formGuid = env.HUBSPOT_KENNISMAKING_FORM_ID;
  if (!formGuid) {
    console.warn(
      "HUBSPOT_KENNISMAKING_FORM_ID not set, skipping HubSpot update",
    );
    return;
  }

  const fields: { name: string; value: string }[] = [
    { name: "email", value: email },
    { name: "ic__kennismaking_booked", value: "true" },
  ];

  if (dealId) {
    fields.push({ name: "ic__kennismaking_deal_id", value: dealId });
  }
  if (meetingDate) {
    fields.push({ name: "ic__kennismaking_date", value: meetingDate });
  }

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${formGuid}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: `${env.BASE_URL}/book/kennismaking`,
          pageName: "Kennismaking Booking",
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot Forms API error ${res.status}: ${text}`);
  }
}
