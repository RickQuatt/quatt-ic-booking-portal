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

export async function setTrainingBooked(
  env: Env,
  email: string,
  dealId?: string,
  trainingDate?: string,
): Promise<void> {
  const formGuid = env.HUBSPOT_TRAINING_FORM_ID;
  if (!formGuid) {
    console.warn(
      "HUBSPOT_TRAINING_FORM_ID not set, skipping HubSpot training booked update",
    );
    return;
  }

  const fields: { name: string; value: string }[] = [
    { name: "email", value: email },
    { name: "ic__training_booked", value: "true" },
  ];

  if (dealId) {
    fields.push({ name: "ic__kennismaking_deal_id", value: dealId });
  }
  if (trainingDate) {
    fields.push({
      name: "ic__training_date",
      value: trainingDate,
    });
  }

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${formGuid}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: `${env.BASE_URL}/book/training`,
          pageName: "Training Booking",
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot Forms API error ${res.status}: ${text}`);
  }
}

export async function setTrainingAttended(
  env: Env,
  email: string,
): Promise<void> {
  // Dedicated "IC - Training Attended" form with a single hidden
  // ic__training_completed field pre-checked true. Keeps the attended signal
  // separate from the training-booked form so submissions are easy to query.
  const formGuid = env.HUBSPOT_TRAINING_ATTENDED_FORM_ID || env.HUBSPOT_TRAINING_FORM_ID;
  if (!formGuid) {
    console.warn(
      "HUBSPOT_TRAINING_ATTENDED_FORM_ID not set, skipping HubSpot training attended update",
    );
    return;
  }

  const fields: { name: string; value: string }[] = [
    { name: "email", value: email },
    { name: "ic__training_completed", value: "true" },
  ];

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${formGuid}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: `${env.BASE_URL}/training/check-in`,
          pageName: "Training Check-in",
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot Forms API error ${res.status}: ${text}`);
  }
}
