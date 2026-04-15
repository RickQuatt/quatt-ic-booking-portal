/**
 * PATCH /api/admin/bookings/:id -- update booking status
 */

import { getSupabase } from "../../../lib/supabase";
import { validateAdmin } from "../../../lib/admin-auth";
import type { Env } from "../../../lib/types";

export const onRequestPatch = async (context: {
  request: Request;
  env: Env;
  params: Record<string, string>;
}) => {
  if (!(await validateAdmin(context.request, context.env))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = context.params.id;
  const body = await context.request.json() as { status?: string; hubspotDealId?: string };
  const { status, hubspotDealId } = body;

  const supabase = getSupabase(context.env);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (status) updates.status = status;
  if (hubspotDealId) updates.hubspot_deal_id = hubspotDealId;

  const { data: updated, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  // If cancelled and it was a training booking, decrement session count
  if (status === "cancelled" && updated.session_id) {
    const { data: session } = await supabase
      .from("training_sessions")
      .select("current_bookings")
      .eq("id", updated.session_id)
      .single();

    if (session) {
      await supabase
        .from("training_sessions")
        .update({
          current_bookings: Math.max((session.current_bookings ?? 1) - 1, 0),
          status: "open",
        })
        .eq("id", updated.session_id);
    }
  }

  return Response.json({
    id: updated.id,
    type: updated.type,
    status: updated.status,
    partnerName: updated.partner_name,
    companyName: updated.company_name,
  });
};
