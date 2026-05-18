/**
 * HubSpot Forms API -- public, no auth required.
 * Already uses fetch() -- works in Cloudflare Workers as-is.
 */

import type { Env, TrainingTrack } from "./types";

const PORTAL_ID = "25848718";

/**
 * Map booking-portal track to the HubSpot multi-checkbox product-line value.
 * `ic__trained_products` / `ic__training_booked_products` options:
 *   - quatt_heat_pump (Hybrid Single + Duo + Duo Expansion)  <- track="hybrid"
 *   - all_e           (Single + Duo + Expansion)             <- track="alle"
 *   - chill                                                  <- track="chill" (future; Chill flow is external today)
 *   - home_battery                                           <- not in booking portal
 */
function trackToProductLine(track: TrainingTrack): string {
  if (track === "alle") return "all_e";
  if ((track as string) === "chill") return "chill";
  return "quatt_heat_pump";
}

/**
 * Pick the right form GUID per track. Each track has its own dedicated form so
 * HubSpot's submission log -- queryable from lists/workflows/dynamic content --
 * preserves a per-track history without needing any new contact properties.
 *
 * Hybrid uses the existing forms; All-e uses clones (HUBSPOT_TRAINING_ALLE_*).
 * If an All-e GUID isn't configured, we fall back to the Hybrid form so a
 * misconfigured deploy doesn't drop attendance signals on the floor.
 */
function pickBookedFormGuid(env: Env, track: TrainingTrack): string | undefined {
  if (track === "alle") return env.HUBSPOT_TRAINING_ALLE_FORM_ID || env.HUBSPOT_TRAINING_FORM_ID;
  return env.HUBSPOT_TRAINING_FORM_ID;
}

function pickAttendedFormGuid(env: Env, track: TrainingTrack): string | undefined {
  if (track === "alle") {
    return (
      env.HUBSPOT_TRAINING_ALLE_ATTENDED_FORM_ID ||
      env.HUBSPOT_TRAINING_ATTENDED_FORM_ID ||
      env.HUBSPOT_TRAINING_FORM_ID
    );
  }
  return env.HUBSPOT_TRAINING_ATTENDED_FORM_ID || env.HUBSPOT_TRAINING_FORM_ID;
}

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
  track: TrainingTrack = "hybrid",
): Promise<void> {
  const formGuid = pickBookedFormGuid(env, track);
  if (!formGuid) {
    console.warn(
      "HUBSPOT_TRAINING_FORM_ID not set, skipping HubSpot training booked update",
    );
    return;
  }

  const fields: { name: string; value: string }[] = [
    { name: "email", value: email },
    { name: "ic__training_booked", value: "true" },
    // Per-product-line tracking. Forms API multi-checkbox semantics OVERWRITE
    // (not append), so a partner who books Hybrid then All-E will end the day
    // with just "all_e" -- the Wall-E OS canonical-writer follow-up
    // (MASTER-BUILD-PLAN-2026-05-15 Move 8) fixes this with read-modify-write.
    { name: "ic__training_booked_products", value: trackToProductLine(track) },
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

  const pagePath = track === "alle" ? "/book/training/alle" : "/book/training";
  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${formGuid}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: `${env.BASE_URL}${pagePath}`,
          pageName: track === "alle" ? "All-e Training Booking" : "Training Booking",
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
  track: TrainingTrack = "hybrid",
): Promise<void> {
  // Dedicated per-track "IC - Training Attended" form. Each form carries a single
  // hidden ic__training_completed field pre-checked true. Per-track submission
  // logs are how we recover "which trainings did this contact actually attend"
  // without inventing new contact properties -- HubSpot's list/workflow filters
  // on form submissions are first-class.
  const formGuid = pickAttendedFormGuid(env, track);
  if (!formGuid) {
    console.warn(
      "HUBSPOT_TRAINING_ATTENDED_FORM_ID not set, skipping HubSpot training attended update",
    );
    return;
  }

  const fields: { name: string; value: string }[] = [
    { name: "email", value: email },
    { name: "ic__training_completed", value: "true" },
    // Per-product-line tracking. Same OVERWRITE caveat as setTrainingBooked.
    { name: "ic__trained_products", value: trackToProductLine(track) },
  ];

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${formGuid}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: `${env.BASE_URL}/training/check-in${track === "alle" ? "?track=alle" : ""}`,
          pageName: track === "alle" ? "All-e Training Check-in" : "Training Check-in",
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot Forms API error ${res.status}: ${text}`);
  }
}
