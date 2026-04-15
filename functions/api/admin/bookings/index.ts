/**
 * GET /api/admin/bookings -- list all bookings for admin
 */

import { getSupabase } from "../../../lib/supabase";
import { validateAdmin } from "../../../lib/admin-auth";
import type { Env } from "../../../lib/types";

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}) => {
  if (!(await validateAdmin(context.request, context.env))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase(context.env);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Bookings fetch error:", error);
    return Response.json({ error: "Failed to load bookings" }, { status: 500 });
  }

  // Map snake_case to camelCase
  const mapped = (bookings || []).map((b) => ({
    id: b.id,
    type: b.type,
    sessionId: b.session_id,
    partnerName: b.partner_name,
    partnerEmail: b.partner_email,
    partnerPhone: b.partner_phone,
    companyName: b.company_name,
    kvkNumber: b.kvk_number,
    preferredDate: b.preferred_date,
    preferredTimeSlot: b.preferred_time_slot,
    notes: b.notes,
    location: b.location,
    status: b.status,
    calendarEventId: b.calendar_event_id,
    assignedAm: b.assigned_am,
    hubspotDealId: b.hubspot_deal_id,
    createdAt: b.created_at,
  }));

  return Response.json(mapped);
};
