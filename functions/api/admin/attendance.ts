/**
 * POST /api/admin/attendance -- mark attendance for a booking
 */

import { getSupabase } from "../../lib/supabase";
import { updateBookingRow } from "../../lib/google-sheets";
import type { Env } from "../../lib/types";

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

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  if (!validateAdmin(context.request, context.env)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await context.request.json() as { bookingId: string; attended: boolean; notes?: string };
  const { bookingId, attended, notes } = body;

  if (!bookingId || attended === undefined) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabase(context.env);

  // Get admin email from cookie (use token as identifier for simplicity)
  const adminToken = getAdminToken(context.request) || "admin";

  // Upsert attendance record
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("booking_id", bookingId);

  if (existing && existing.length > 0) {
    await supabase
      .from("attendance")
      .update({
        attended,
        marked_by: adminToken,
        marked_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq("booking_id", bookingId);
  } else {
    await supabase.from("attendance").insert({
      booking_id: bookingId,
      attended,
      marked_by: adminToken,
      marked_at: new Date().toISOString(),
      notes: notes || null,
    });
  }

  // Update booking status
  const newStatus = attended ? "completed" : "no_show";
  const { data: booking } = await supabase
    .from("bookings")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select()
    .single();

  // Update Google Sheet (non-blocking)
  if (booking?.sheet_row_id) {
    updateBookingRow(context.env, booking.sheet_row_id, { status: newStatus }).catch((e) =>
      console.error("Sheet update failed:", e),
    );
  }

  return Response.json({ success: true, status: newStatus });
};
