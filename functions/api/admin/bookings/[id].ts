/**
 * PATCH /api/admin/bookings/:id -- update booking status (D1-backed).
 */

import { validateAdmin } from "../../../lib/admin-auth";
import {
  decrementSessionBookings,
  getBookingById,
  requireDb,
} from "../../../lib/d1-bookings";
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
  const body = (await context.request.json()) as {
    status?: string;
    hubspotDealId?: string;
  };
  const { status, hubspotDealId } = body;

  const updates: string[] = [];
  const values: (string | null)[] = [];
  if (status) {
    updates.push("status = ?");
    values.push(status);
  }
  if (hubspotDealId) {
    updates.push("hubspot_deal_id = ?");
    values.push(hubspotDealId);
  }
  if (updates.length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }
  updates.push("updated_at = datetime('now')");
  values.push(id);

  try {
    const db = requireDb(context.env);
    const result = await db
      .prepare(`UPDATE bookings SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    if (!result.meta.changes) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }

    const updated = await getBookingById(context.env, id);
    if (!updated) {
      return Response.json({ error: "Booking not found after update" }, { status: 404 });
    }

    if (status === "cancelled" && updated.session_id) {
      decrementSessionBookings(context.env, updated.session_id).catch((e) =>
        console.error("Session decrement failed:", e),
      );
    }

    return Response.json({
      id: updated.id,
      type: updated.type,
      status: updated.status,
      partnerName: updated.partner_name,
      companyName: updated.company_name,
    });
  } catch (e) {
    console.error("Booking update failed:", e);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
};
