/**
 * GET /api/admin/bookings -- list all bookings for admin
 */

import { getSupabase } from "../../../lib/supabase";
import type { Env } from "../../../lib/types";

function getAdminToken(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const adminCookie = cookies.find((c) => c.startsWith("admin_token="));
  return adminCookie ? adminCookie.split("=")[1] : null;
}

function validateAdmin(request: Request, env: Env): boolean {
  const token = getAdminToken(request);
  if (!token) return false;
  const validTokens = (env.ADMIN_TOKENS || "").split(",").map((t) => t.trim()).filter(Boolean);
  return validTokens.includes(token);
}

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}) => {
  if (!validateAdmin(context.request, context.env)) {
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
