/**
 * POST /api/admin/attendance -- mark attendance for a booking (D1-backed).
 */

import { updateBookingRow } from "../../lib/google-sheets";
import { validateAdmin, getAdminToken } from "../../lib/admin-auth";
import {
  getBookingById,
  requireDb,
  setBookingStatus,
  uuidv4,
} from "../../lib/d1-bookings";
import type { Env } from "../../lib/types";

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  if (!(await validateAdmin(context.request, context.env))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await context.request.json()) as {
    bookingId: string;
    attended: boolean;
    notes?: string;
  };
  const { bookingId, attended, notes } = body;

  if (!bookingId || attended === undefined) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const adminToken = getAdminToken(context.request) || "admin";
  const db = requireDb(context.env);
  const now = new Date().toISOString();
  const attendedInt = attended ? 1 : 0;

  try {
    const existing = await db
      .prepare(`SELECT id FROM attendance WHERE booking_id = ? LIMIT 1`)
      .bind(bookingId)
      .first<{ id: string }>();

    if (existing) {
      await db
        .prepare(
          `UPDATE attendance SET attended=?, marked_by=?, marked_at=?, notes=? WHERE id=?`,
        )
        .bind(attendedInt, adminToken, now, notes || null, existing.id)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO attendance (id, booking_id, attended, marked_by, marked_at, notes)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(uuidv4(), bookingId, attendedInt, adminToken, now, notes || null)
        .run();
    }

    const newStatus = attended ? "completed" : "no_show";
    await setBookingStatus(context.env, bookingId, newStatus);

    const booking = await getBookingById(context.env, bookingId);
    if (booking?.sheet_row_id) {
      updateBookingRow(context.env, booking.sheet_row_id, { status: newStatus }).catch((e) =>
        console.error("Sheet update failed:", e),
      );
    }

    return Response.json({ success: true, status: newStatus });
  } catch (e) {
    console.error("Attendance update failed:", e);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
};
