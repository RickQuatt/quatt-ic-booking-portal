/**
 * POST /api/bookings/:id/reschedule
 * Partner-facing reschedule endpoint (HMAC token-authenticated).
 */

import { getSupabase } from "../../../lib/supabase";
import { verifyBookingAction, signBookingAction } from "../../../lib/booking-tokens";
import {
  deleteCalendarEvent,
  createICEvent,
  getFreeBusy,
  buildMetaBlock,
} from "../../../lib/google-calendar";
import { IC_COLORS, AM_CONFIG, type Env } from "../../../lib/types";
import { setKennismakingBooked } from "../../../lib/hubspot-forms";
import { sendRescheduleConfirmation } from "../../../lib/email";
import { sendSlackNotification, formatRescheduleNotification } from "../../../lib/slack";

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => {
  const { env } = context;
  const id = context.params.id;
  const body = await context.request.json() as {
    token: string; email: string; newSlotStart: string; newSlotEnd: string;
  };
  const { token, email, newSlotStart, newSlotEnd } = body;

  if (!token || !email || !newSlotStart || !newSlotEnd) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const valid = await verifyBookingAction(env.BOOKING_SECRET, token, id, email, "reschedule");
  if (!valid) {
    return Response.json({ error: "Ongeldige of verlopen link" }, { status: 403 });
  }

  const supabase = getSupabase(env);

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (!booking) {
    return Response.json({ error: "Boeking niet gevonden" }, { status: 404 });
  }

  if (booking.partner_email !== email) {
    return Response.json({ error: "Ongeldige link" }, { status: 403 });
  }

  if (!booking.calendar_event_id) {
    return Response.json({
      error: "Dit type boeking kan niet online worden verplaatst. Bel ons op 020 808 2116.",
    }, { status: 400 });
  }

  if (booking.status !== "confirmed") {
    return Response.json({
      error: "Deze boeking kan niet meer worden verplaatst",
      currentStatus: booking.status,
    }, { status: 400 });
  }

  const am = AM_CONFIG.find((a) => a.email === booking.assigned_am) || AM_CONFIG[0];

  // Delete old calendar event first
  await deleteCalendarEvent(env, env.IC_CALENDAR_ID, booking.calendar_event_id);

  // Re-check availability after deleting old event
  const freshBusy = await getFreeBusy(env, [am.email, env.IC_CALENDAR_ID], newSlotStart, newSlotEnd);
  const stillBusy = [am.email, env.IC_CALENDAR_ID].some((calId) => {
    const cal = freshBusy?.[calId];
    return cal?.busy && cal.busy.length > 0;
  });

  if (stillBusy) {
    return Response.json({
      error: "Dit tijdslot is helaas niet meer beschikbaar. Kies een ander moment.",
    }, { status: 409 });
  }

  // Determine meeting format from notes
  const isOnline = booking.notes?.includes("[Online videogesprek");
  const meetingFormat = isOnline ? "online" : "showroom";
  const eventLocation = isOnline ? undefined : "Kon. Wilhelminaplein 29, 1062HJ Amsterdam";
  const summary = isOnline
    ? `Kennismaking - ${booking.company_name}`
    : `Showroom bezoek - ${booking.company_name}`;

  const meta = buildMetaBlock({
    type: meetingFormat,
    partner: booking.company_name,
    deal: booking.hubspot_deal_id || "",
    am: am.name,
    source: "booking-portal",
    phone: booking.partner_phone || "",
  });

  // Create new calendar event
  const calResult = await createICEvent(env, {
    summary,
    colorId: IC_COLORS.intro_call,
    startDateTime: newSlotStart,
    endDateTime: newSlotEnd,
    amEmail: am.email,
    description: meta,
    location: eventLocation,
    addGoogleMeet: isOnline,
    attendees: [email],
  });

  const newDate = newSlotStart.split("T")[0];
  const newTime = new Date(newSlotStart).toLocaleTimeString("nl-NL", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam",
  });

  // Update booking in DB
  await supabase
    .from("bookings")
    .update({
      preferred_date: newDate,
      preferred_time_slot: newTime,
      calendar_event_id: calResult.eventId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Re-push date to HubSpot (non-blocking)
  setKennismakingBooked(env, email, booking.hubspot_deal_id || undefined, newDate).catch((e) =>
    console.error("HubSpot re-push failed:", e),
  );

  // Generate new tokens
  const rescheduleToken = await signBookingAction(env.BOOKING_SECRET, id, email, "reschedule");
  const cancelToken = await signBookingAction(env.BOOKING_SECRET, id, email, "cancel");

  // Send new confirmation email (non-blocking)
  sendRescheduleConfirmation(env, {
    to: email,
    partnerName: booking.partner_name,
    companyName: booking.company_name,
    amName: am.name,
    date: newDate,
    startTime: newSlotStart,
    endTime: newSlotEnd,
    meetingFormat: meetingFormat as "showroom" | "online",
    location: eventLocation || null,
    meetLink: calResult.meetLink,
    bookingId: id,
    rescheduleToken,
    cancelToken,
  }).catch((e) => console.error("Reschedule confirmation email failed:", e));

  // Slack notification (non-blocking)
  sendSlackNotification(
    env,
    formatRescheduleNotification({
      partnerName: booking.partner_name,
      companyName: booking.company_name,
      oldDate: booking.preferred_date || "",
      newDate,
      newTime,
      amName: am.name,
    }),
  ).catch((e) => console.error("Slack reschedule notification failed:", e));

  return Response.json({
    success: true,
    booking: {
      id,
      date: newDate,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      meetLink: calResult.meetLink,
      location: eventLocation,
    },
  });
};
