/**
 * POST /api/internal/reserve-training
 *
 * AM-only entry point that lets an account manager reserve a training slot
 * on behalf of a partner BEFORE the partnerovereenkomst is signed.
 *
 * Why this exists: the public /book/training flow blocks unsigned partners
 * (agreement-first gate). HubSpot Partner Progression workflow 4107807941
 * Branch AV is purpose-built for "training booked, agreement unsigned" --
 * it sends a 3-email re-sign ladder (T+0/T+14/T+21). So skipping the
 * agreement gate here is safe: the system will auto-nudge the partner.
 *
 * Auth: shared `RESERVE_SECRET` header. Called from quatt-am-toolkit's
 * server-side proxy after the AM has already passed Cloudflare Access
 * Google-OAuth gating. Fails closed if RESERVE_SECRET is unset.
 *
 * Differences vs. /api/bookings (handleTrainingBooking):
 *   - skips hasSignedAgreement() check entirely
 *   - skips Slack notification (AM already sees the action in the toolkit)
 *   - status = 'reserved_unsigned' instead of 'confirmed'
 *   - confirmation email includes an "agreement pending" CTA
 *   - assigned_am comes from the request body (the AM who reserved)
 */

import {
  addAttendeeToEvent,
  createTrainingEvent,
  ensureTrainingCoreAttendees,
} from "../../lib/google-calendar";
import { type Env, type TrainingTrack } from "../../lib/types";
import { appendBookingRow } from "../../lib/google-sheets";
import { setTrainingBooked } from "../../lib/hubspot-forms";
import { postWalleosBooking } from "../../lib/walleos";
import { sendTrainingConfirmation } from "../../lib/email";
import {
  findActiveSessionBookingForEmail,
  getSessionById,
  incrementSessionBookings,
  insertBooking,
  updateBookingSheetRow,
} from "../../lib/d1-bookings";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

interface ReserveTrainingBody {
  sessionId: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone?: string;
  companyName: string;
  kvkNumber?: string;
  dealId?: string;
  notes?: string;
  /** Email of the AM doing the reservation (resolved server-side in the toolkit). */
  assignedAm: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { env, request } = context;

  if (!env.RESERVE_SECRET) {
    console.error("RESERVE_SECRET unset; refusing reserve request");
    return Response.json({ error: "Reserve endpoint not configured" }, { status: 503 });
  }

  const provided = request.headers.get("x-reserve-secret") || "";
  if (!provided || !timingSafeEqual(provided, env.RESERVE_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.DB) {
    console.error("D1 binding missing");
    return Response.json({ error: "Storage unavailable" }, { status: 503 });
  }

  let body: ReserveTrainingBody;
  try {
    body = (await request.json()) as ReserveTrainingBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    sessionId,
    partnerName,
    partnerEmail,
    partnerPhone,
    companyName,
    kvkNumber,
    dealId,
    notes,
    assignedAm,
  } = body;

  if (!sessionId || !partnerName || !partnerEmail || !companyName || !assignedAm) {
    return Response.json(
      { error: "Missing required fields (sessionId, partnerName, partnerEmail, companyName, assignedAm)" },
      { status: 400 },
    );
  }
  if (!EMAIL_REGEX.test(partnerEmail)) {
    return Response.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }
  if (!EMAIL_REGEX.test(assignedAm)) {
    return Response.json({ error: "Invalid assignedAm" }, { status: 400 });
  }

  const session = await getSessionById(env, sessionId);
  if (!session) {
    return Response.json({ error: "Training session not found" }, { status: 404 });
  }
  if (session.status !== "open") {
    return Response.json(
      { error: "Training session is not open for bookings" },
      { status: 400 },
    );
  }
  if (session.current_bookings >= session.max_capacity) {
    return Response.json({ error: "Training session is full" }, { status: 400 });
  }

  const duplicate = await findActiveSessionBookingForEmail(env, sessionId, partnerEmail);
  if (duplicate) {
    return Response.json(
      { error: "Partner is al ingeschreven voor deze training" },
      { status: 409 },
    );
  }

  const reserveNotes = [
    notes,
    `[reserved by ${assignedAm} -- agreement pending]`,
  ]
    .filter(Boolean)
    .join("\n");

  const booking = await insertBooking(env, {
    type: "training",
    session_id: sessionId,
    partner_name: partnerName,
    partner_email: partnerEmail,
    partner_phone: partnerPhone || null,
    company_name: companyName,
    kvk_number: kvkNumber || null,
    notes: reserveNotes,
    status: "reserved_unsigned",
    assigned_am: assignedAm,
    hubspot_deal_id: dealId || null,
  });

  await incrementSessionBookings(env, sessionId);

  const sessionTrack = (session.track as TrainingTrack) || "hybrid";
  const trackCalendarId =
    sessionTrack === "alle" && env.ALLE_TRAINING_CALENDAR_ID
      ? env.ALLE_TRAINING_CALENDAR_ID
      : env.TRAINING_CALENDAR_ID;
  const trackTitlePrefix =
    sessionTrack === "alle" ? "All-e Installatietraining" : "Quatt Installatie Training";

  // Calendar attach (non-blocking) -- mirrors handleTrainingBooking.
  if (session.calendar_event_id) {
    const eventId = session.calendar_event_id;
    ensureTrainingCoreAttendees(env, trackCalendarId, eventId).catch((e) =>
      console.error("Core training attendee backfill failed:", e),
    );
    addAttendeeToEvent(env, trackCalendarId, eventId, partnerEmail, partnerName).catch((e) =>
      console.error("Calendar attendee add failed:", e),
    );
  } else {
    (async () => {
      try {
        const newEventId = await createTrainingEvent(env, {
          title: session.title,
          date: session.date,
          startTime: session.start_time,
          endTime: session.end_time,
          location: session.location,
          maxCapacity: session.max_capacity,
          calendarId: trackCalendarId,
          titlePrefix: trackTitlePrefix,
        });
        if (newEventId) {
          await env.DB!.prepare(
            `UPDATE training_sessions SET calendar_event_id = ?, updated_at = datetime('now') WHERE id = ?`,
          )
            .bind(newEventId, sessionId)
            .run();
          await addAttendeeToEvent(env, trackCalendarId, newEventId, partnerEmail, partnerName);
        }
      } catch (e) {
        console.error("Lazy training calendar event creation failed:", e);
      }
    })();
  }

  // HubSpot: flip ic__training_booked so PP Branch AV picks the deal up.
  setTrainingBooked(env, partnerEmail, dealId, session.date, sessionTrack).catch((e) =>
    console.error("HubSpot training-booked push failed:", e),
  );

  // Wall-E OS milestone (non-blocking)
  postWalleosBooking(env, {
    event_id: `booking-training-${booking.id}`,
    event_type: "training_booked",
    partner_email: partnerEmail,
    hubspot_deal_id: dealId || undefined,
    session: {
      session_id: String(session.id),
      start_at: session.date,
      host: "Mitchell van Kleef",
    },
  }).catch((e) => console.error("Wall-E OS training-booked push failed:", e));

  // Audit row in Google Sheet (non-blocking). Use status flag so Rick can
  // filter "reserved without agreement" reservations later.
  appendBookingRow(env, {
    type: "training",
    partnerName,
    email: partnerEmail,
    phone: partnerPhone || "",
    company: companyName,
    date: session.date,
    am: assignedAm,
    status: "reserved_unsigned",
    hubspotDealId: dealId || "",
  })
    .then((rowId) => {
      if (rowId) updateBookingSheetRow(env, booking.id, rowId).catch(() => {});
    })
    .catch((e) => console.error("Sheet write failed:", e));

  // NO Slack notification. AM already sees the action in the AM toolkit.

  // Confirmation email with agreement-pending CTA (non-blocking).
  sendTrainingConfirmation(env, {
    to: partnerEmail,
    partnerName,
    sessionDate: session.date,
    sessionTime: `${session.start_time} - ${session.end_time}`,
    location: session.location || "",
    agreementPending: true,
    dealId,
  }).catch((e) => console.error("Training confirmation email failed:", e));

  return Response.json({
    success: true,
    booking: {
      id: booking.id,
      sessionId: session.id,
      sessionDate: session.date,
      sessionTime: `${session.start_time} - ${session.end_time}`,
      location: session.location,
      track: sessionTrack,
      status: "reserved_unsigned",
      assignedAm,
    },
  });
};
