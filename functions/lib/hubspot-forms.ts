/**
 * HubSpot Forms API -- public, no auth required.
 * Already uses fetch() -- works in Cloudflare Workers as-is.
 */

import type { Env, TrainingTrack } from "./types";
import { upsertContactProps } from "./hubspot-crm";

const PORTAL_ID = "25848718";

// HubSpot's spam filter quarantines submissions that lack a valid absolute
// pageUri. BASE_URL is not reliably set on the Cloudflare Pages env (it was
// only set on the old Vercel deploy), so fall back to the production domain
// the same way agreements.ts does. Without this, training submissions went out
// with a relative/empty pageUri and got spam-quarantined.
function bookingBaseUrl(env: Env): string {
  return (env.BASE_URL || "https://booking.quatt.io").replace(/\/$/, "");
}

// Per-product-line multi-checkbox writes (ic__trained_products /
// ic__training_booked_products) moved to the Wall-E OS drain on 2026-05-22.
// Booking portal still picks per-track form GUIDs below so the HubSpot
// submission log preserves per-track history.

/**
 * Pick the right form GUID per track. Each track has its own dedicated form so
 * HubSpot's submission log -- queryable from lists/workflows/dynamic content --
 * preserves a per-track history without needing any new contact properties.
 *
 * Hybrid uses the existing forms; All-e uses clones (HUBSPOT_TRAINING_ALLE_*).
 * If an All-e GUID isn't configured, we fall back to the Hybrid form so a
 * misconfigured deploy doesn't drop attendance signals on the floor.
 */
function pickBookedFormGuid(
  env: Env,
  track: TrainingTrack,
): string | undefined {
  if (track === "alle")
    return env.HUBSPOT_TRAINING_ALLE_FORM_ID || env.HUBSPOT_TRAINING_FORM_ID;
  return env.HUBSPOT_TRAINING_FORM_ID;
}

function pickAttendedFormGuid(
  env: Env,
  track: TrainingTrack,
): string | undefined {
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
  const props: Record<string, string> = { ic__kennismaking_booked: "true" };
  if (meetingDate) {
    props.ic__kennismaking_date = meetingDate;
  }
  if (dealId) {
    props.ic__kennismaking_deal_id = dealId;
  }

  const direct = await upsertContactProps(
    env,
    email,
    props,
    "kennismaking booked",
  );
  await submitKennismakingForm(env, email, dealId, meetingDate, direct.skipped);
}

async function submitKennismakingForm(
  env: Env,
  email: string,
  dealId: string | undefined,
  meetingDate: string | undefined,
  primary: boolean,
): Promise<void> {
  try {
    await postKennismakingForm(env, email, dealId, meetingDate);
  } catch (e) {
    if (primary) {
      throw e;
    }
    // Direct CRM write already succeeded; form-submission history is
    // nice-to-have (HubSpot lists) so never fail the request for it.
    console.warn("legacy Forms API submit failed (kennismaking booked)", e);
  }
}

async function postKennismakingForm(
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
          pageUri: `${bookingBaseUrl(env)}/book/kennismaking`,
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
  const props: Record<string, string> = { ic__training_booked: "true" };
  if (trainingDate) {
    // HubSpot date properties want an epoch-ms at UTC midnight; an ISO
    // date-only string (YYYY-MM-DD) parses as UTC, same conversion the form
    // field used.
    props.ic__training_date = String(Date.parse(trainingDate));
  }
  if (dealId) {
    props.ic__kennismaking_deal_id = dealId;
  }

  const direct = await upsertContactProps(env, email, props, "training booked");
  await submitTrainingBookedForm(
    env,
    email,
    dealId,
    trainingDate,
    track,
    direct.skipped,
  );
}

async function submitTrainingBookedForm(
  env: Env,
  email: string,
  dealId: string | undefined,
  trainingDate: string | undefined,
  track: TrainingTrack,
  primary: boolean,
): Promise<void> {
  try {
    await postTrainingBookedForm(env, email, dealId, trainingDate, track);
  } catch (e) {
    if (primary) {
      throw e;
    }
    console.warn("legacy Forms API submit failed (training booked)", e);
  }
}

async function postTrainingBookedForm(
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
    // ic__training_booked_products (multi-checkbox) is owned by the Wall-E OS
    // drain via partner_milestones replay -- see
    // ~/.claude/plans/do-bit-better-resrach-cosmic-ullman.md. The drain composes
    // the full semicolon-joined value from all achieved training_booked
    // milestones, so the Forms-API overwrite bug stops dropping prior products.
    // Booking portal still owns the boolean ic__training_booked for immediate UX.
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
          pageUri: `${bookingBaseUrl(env)}${pagePath}`,
          pageName:
            track === "alle" ? "All-e Training Booking" : "Training Booking",
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
  const direct = await upsertContactProps(
    env,
    email,
    { ic__training_completed: "true" },
    "training attended",
  );
  await submitTrainingAttendedForm(env, email, track, direct.skipped);
}

async function submitTrainingAttendedForm(
  env: Env,
  email: string,
  track: TrainingTrack,
  primary: boolean,
): Promise<void> {
  try {
    await postTrainingAttendedForm(env, email, track);
  } catch (e) {
    if (primary) {
      throw e;
    }
    console.warn("legacy Forms API submit failed (training attended)", e);
  }
}

async function postTrainingAttendedForm(
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
    // ic__trained_products (multi-checkbox) owned by the Wall-E OS drain via
    // partner_milestones replay -- same pattern as ic__training_booked_products.
  ];

  const res = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${formGuid}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: `${bookingBaseUrl(env)}/training/check-in${track === "alle" ? "?track=alle" : ""}`,
          pageName:
            track === "alle" ? "All-e Training Check-in" : "Training Check-in",
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot Forms API error ${res.status}: ${text}`);
  }
}
