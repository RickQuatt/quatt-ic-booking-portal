/**
 * GET /api/bookings/:id?token=...&email=...&action=reschedule|cancel
 * Token-authenticated booking lookup for partner-facing pages.
 */

import { getSupabase } from "../../../lib/supabase";
import { verifyBookingAction } from "../../../lib/booking-tokens";
import type { Env } from "../../../lib/types";

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => {
  const id = context.params.id;
  const url = new URL(context.request.url);
  const token = url.searchParams.get("token");
  const email = url.searchParams.get("email");
  const action = url.searchParams.get("action") as "reschedule" | "cancel" | null;

  if (!token || !email || !action) {
    return Response.json({ error: "Missing token, email, or action" }, { status: 400 });
  }

  const valid = await verifyBookingAction(context.env.BOOKING_SECRET, token, id, email, action);
  if (!valid) {
    return Response.json({ error: "Ongeldige of verlopen link" }, { status: 403 });
  }

  const supabase = getSupabase(context.env);

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

  return Response.json({
    id: booking.id,
    type: booking.type,
    partnerName: booking.partner_name,
    companyName: booking.company_name,
    preferredDate: booking.preferred_date,
    preferredTimeSlot: booking.preferred_time_slot,
    location: booking.location,
    status: booking.status,
    assignedAm: booking.assigned_am,
    calendarEventId: booking.calendar_event_id,
    notes: booking.notes,
  });
};
