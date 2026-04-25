/**
 * POST /api/bookings/:id/cancel
 * Partner-facing cancel endpoint (HMAC token-authenticated). D1-backed.
 */

import { verifyBookingAction } from "../../../lib/booking-tokens";
import { deleteCalendarEvent } from "../../../lib/google-calendar";
import { sendCancellationConfirmation } from "../../../lib/email";
import { sendSlackNotification, formatCancelNotification } from "../../../lib/slack";
import { AM_CONFIG, type Env } from "../../../lib/types";
import {
  decrementSessionBookings,
  getBookingById,
  setBookingStatus,
} from "../../../lib/d1-bookings";

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => {
  const { env } = context;
  const id = context.params.id;
  const body = (await context.request.json()) as { token: string; email: string };
  const { token, email } = body;

  if (!token || !email) {
    return Response.json({ error: "Missing token or email" }, { status: 400 });
  }

  const valid = await verifyBookingAction(env.BOOKING_SECRET, token, id, email, "cancel");
  if (!valid) {
    return Response.json({ error: "Ongeldige of verlopen link" }, { status: 403 });
  }

  const booking = await getBookingById(env, id);
  if (!booking) {
    return Response.json({ error: "Boeking niet gevonden" }, { status: 404 });
  }
  if (booking.partner_email !== email) {
    return Response.json({ error: "Ongeldige link" }, { status: 403 });
  }
  if (!["confirmed", "pending_am_confirmation"].includes(booking.status)) {
    return Response.json(
      {
        error: "Deze boeking kan niet meer worden geannuleerd",
        currentStatus: booking.status,
      },
      { status: 400 },
    );
  }

  await setBookingStatus(env, id, "cancelled");

  // Delete the calendar event. intro_call + first_install hold both live on IC_CALENDAR_ID;
  // training attendee-removal is handled by the session flow, not a full delete.
  if (booking.calendar_event_id && booking.type !== "training") {
    deleteCalendarEvent(env, env.IC_CALENDAR_ID, booking.calendar_event_id).catch((e) =>
      console.error("Calendar event deletion failed:", e),
    );
  }

  // Training cancel: free the seat
  if (booking.type === "training" && booking.session_id) {
    decrementSessionBookings(env, booking.session_id).catch((e) =>
      console.error("Session decrement failed:", e),
    );
  }

  const am = AM_CONFIG.find((a) => a.email === booking.assigned_am) || AM_CONFIG[0];

  sendCancellationConfirmation(env, {
    to: email,
    partnerName: booking.partner_name,
    companyName: booking.company_name,
    date: booking.preferred_date || "",
    amName: am.name,
  }).catch((e) => console.error("Cancellation email failed:", e));

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
