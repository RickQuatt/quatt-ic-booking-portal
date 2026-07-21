/**
 * Booking-milestone contact writes.
 *
 * Despite the filename (kept so the four callers stay untouched), this module no
 * longer talks to the HubSpot Forms API. It wraps direct CRM v3 contact-property
 * writes (upsertContactProps) for the booking milestones the portal owns:
 * kennismaking booked, training booked, training attended. The Forms API was
 * retired because its spam filter silently quarantines submissions (HTTP 200 but
 * never landed), and several fields we sent were phantom contact properties that
 * HubSpot dropped. A direct PATCH either succeeds or returns an honest error.
 *
 * Uses plain fetch() via hubspot-crm -- works in Cloudflare Workers as-is.
 */

import type { Env, TrainingTrack } from "./types";
import { upsertContactProps, toHubSpotDateMs } from "./hubspot-crm";

export async function setKennismakingBooked(
  env: Env,
  email: string,
  // dealId is accepted for caller compatibility but is NOT written as a contact
  // property: contact<->deal is a native HubSpot association handled elsewhere,
  // and ic__kennismaking_deal_id is a phantom property that would 400 the write.
  _dealId?: string,
  meetingDate?: string,
): Promise<void> {
  const props: Record<string, string> = { ic__kennismaking_booked: "true" };
  if (meetingDate) {
    // ic__kennismaking_date is a HubSpot `date` property -> epoch-ms UTC midnight.
    const ms = toHubSpotDateMs(meetingDate);
    if (ms) {
      props.ic__kennismaking_date = ms;
    } else {
      // Record the booking anyway (the flag matters most), but surface the bad
      // input -- callers are expected to pass YYYY-MM-DD.
      console.warn(
        `setKennismakingBooked: unparseable meetingDate "${meetingDate}", skipping ic__kennismaking_date`,
      );
    }
  }

  await upsertContactProps(env, email, props, "kennismaking booked");
}

export async function setTrainingBooked(
  env: Env,
  email: string,
  // See setKennismakingBooked: dealId stays in the signature but is never a
  // contact property (phantom ic__kennismaking_deal_id; association is native).
  _dealId?: string,
  trainingDate?: string,
  // track is retained for caller compatibility; per-track history no longer
  // needs a dedicated Forms submission now that the CRM flag is authoritative.
  _track: TrainingTrack = "hybrid",
): Promise<void> {
  const props: Record<string, string> = { ic__training_booked: "true" };
  if (trainingDate) {
    // ic__training_date is a HubSpot `date` property -> epoch-ms UTC midnight.
    const ms = toHubSpotDateMs(trainingDate);
    if (ms) {
      props.ic__training_date = ms;
    } else {
      console.warn(
        `setTrainingBooked: unparseable trainingDate "${trainingDate}", skipping ic__training_date`,
      );
    }
  }

  await upsertContactProps(env, email, props, "training booked");
}

export async function setTrainingAttended(
  env: Env,
  email: string,
  // track retained for caller compatibility (see setTrainingBooked).
  _track: TrainingTrack = "hybrid",
): Promise<void> {
  await upsertContactProps(
    env,
    email,
    { ic__training_completed: "true" },
    "training attended",
  );
}
