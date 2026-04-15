/**
 * POST /api/bookings/:id/cancel
 * Partner-facing cancel endpoint (HMAC token-authenticated).
 */

import { getSupabase } from "../../../lib/supabase";
import { verifyBookingAction } from "../../../lib/booking-tokens";
import { deleteCalendarEvent } from "../../../lib/google-calendar";
import { sendCancellationConfirmation } from "../../../lib/email";
import { sendSlackNotification, formatCancelNotification } from "../../../lib/slack";
import { AM_CONFIG, type Env } from "../../../lib/types";

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => {
  const { env } = context;
  const id = context.params.id;
  const body = await context.request.json() as { token: string; email: string };
  const { token, email } = body;

  if (!token || !email) {
    return Response.json({ error: "Missing token or email" }, { status: 400 });
  }

  const valid = await verifyBookingAction(env.BOOKING_SECRET, token, id, email, "cancel");
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

  if (!["confirmed", "pending_am_confirmation"].includes(booking.status || "")) {
    return Response.json({
      error: "Deze boeking kan niet meer worden geannuleerd",
      currentStatus: booking.status,
    }, { status: 400 });
  }

  // Update booking status
  await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);

  // Delete Google Calendar event (non-blocking)
  if (booking.calendar_event_id) {
    deleteCalendarEvent(env, env.IC_CALENDAR_ID, booking.calendar_event_id).catch((e) =>
      console.error("Calendar event deletion failed:", e),
    );
  }

  // If training booking, decrement session count
  if (booking.session_id) {
    const { data: session } = await supabase
      .from("training_sessions")
      .select("current_bookings")
      .eq("id", booking.session_id)
      .single();

    if (session) {
      await supabase
        .from("training_sessions")
        .update({
          current_bookings: Math.max((session.current_bookings ?? 1) - 1, 0),
          status: "open",
        })
        .eq("id", booking.session_id);
    }
  }

  const am = AM_CONFIG.find((a) => a.email === booking.assigned_am) || AM_CONFIG[0];

  // Cancellation email (non-blocking)
  sendCancellationConfirmation(env, {
    to: email,
    partnerName: booking.partner_name,
    companyName: booking.company_name,
    date: booking.preferred_date || "",
    amName: am.name,
  }).catch((e) => console.error("Cancellation email failed:", e));

  // Slack notification (non-blocking)
  sendSlackNotification(
    env,
    formatCancelNotification({
      partnerName: booking.partner_name,
      companyName: booking.company_name,
      date: booking.preferred_date || "",
      amName: am.name,
    }),
  ).catch((e) => console.error("Slack cancel notification failed:", e));

  return Response.json({ success: true });
};
