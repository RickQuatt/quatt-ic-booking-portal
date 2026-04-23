/**
 * Wall-E OS booking webhook bridge.
 *
 * Posts kennismaking / training milestone events to Wall-E OS alongside
 * the existing HubSpot Forms API push. HubSpot stays the primary sink
 * (for tier-property propagation via IC workflow 4107807941); Wall-E OS
 * is the canonical source going forward and drives the am-toolkit tier
 * pill + architecture dashboard.
 *
 * Non-blocking: callers .catch(console.error) to keep the booking
 * response path fast. Wall-E OS's webhook is idempotent on event_id.
 *
 * Env:
 *   WALLEOS_URL               https://wall-e-os.pages.dev (or preview)
 *   WALLEOS_WEBHOOK_SECRET    shared secret; header X-Webhook-Secret
 * If either env var is missing the function silently no-ops.
 */

import type { Env } from "./types";

export type WalleosMilestone =
  | "agreement_signed"
  | "kennismaking_booked"
  | "kennismaking_completed"
  | "training_booked"
  | "training_completed"
  | "first_install_booked"
  | "first_install_completed";

export interface WalleosBookingEvent {
  /** Stable id; same event retried -> idempotent. */
  event_id: string;
  event_type: WalleosMilestone;
  /**
   * One of the following must be set so Wall-E OS can locate the partner:
   *   - hubspot_company_id (preferred; rarely known to this portal today)
   *   - hubspot_deal_id (Wall-E OS resolves via deals table)
   *   - partner_email (Wall-E OS resolves via contacts table)
   */
  hubspot_company_id?: string;
  hubspot_deal_id?: string;
  partner_email?: string;
  hubspot_contact_id?: string;
  session: {
    session_id: string;
    start_at: string; // ISO 8601
    end_at?: string;
    url?: string;
    host?: string;
  };
}

export async function postWalleosBooking(
  env: Env,
  event: WalleosBookingEvent,
): Promise<void> {
  if (!env.WALLEOS_URL || !env.WALLEOS_WEBHOOK_SECRET) {
    // Feature-flagged off -- stay a silent no-op until Rick sets both vars.
    return;
  }
  const url = `${env.WALLEOS_URL.replace(/\/$/, "")}/api/v1/webhooks/booking-portal`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": env.WALLEOS_WEBHOOK_SECRET,
    },
    body: JSON.stringify(event),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Wall-E OS webhook HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }
}
