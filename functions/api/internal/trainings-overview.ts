/**
 * GET /api/internal/trainings-overview
 *
 * AM-toolkit-facing read endpoint. Returns the full universe of training
 * sessions (Hybrid + All-e, past + upcoming) plus every recent booking
 * tied to a session, so the toolkit can render a "Trainings" page with
 * date / capacity / attendee list per session.
 *
 * Auth: shared RESERVE_SECRET header (same pattern as
 * /api/internal/reserve-training). The toolkit's server-side proxy is
 * already gated by Cloudflare Access + Google OAuth -- this secret
 * stops anyone outside the toolkit from hitting it directly.
 *
 * Response:
 *   {
 *     sessions: [{id, title, date, startTime, endTime, location, track,
 *                 maxCapacity, currentBookings, status, calendarEventId}],
 *     bookings: [{id, sessionId, partnerName, partnerEmail, partnerPhone,
 *                 companyName, status, assignedAm, hubspotDealId, createdAt}]
 *   }
 *
 * Filter: `session_id IS NOT NULL` on bookings -- kennismakings + other
 * non-training rows don't belong on this surface.
 */

import { listAllSessions, listRecentBookings } from "../../lib/d1-bookings";
import type { Env } from "../../lib/types";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { env, request } = context;

  if (!env.RESERVE_SECRET) {
    return Response.json({ error: "Endpoint not configured" }, { status: 503 });
  }
  const provided = request.headers.get("x-reserve-secret") || "";
  if (!provided || !timingSafeEqual(provided, env.RESERVE_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pull 1000 most-recent bookings; matches admin /bookings limit pattern
  // but doubled because trainings-overview wants attendees across past
  // sessions too. With ~200 bookings/quarter this still covers >12 months.
  const [sessions, bookings] = await Promise.all([
    listAllSessions(env),
    listRecentBookings(env, 1000),
  ]);

  const trainingBookings = bookings.filter(
    (b) => b.type === "training" && b.session_id,
  );

  return Response.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      location: s.location,
      track: s.track,
      maxCapacity: s.max_capacity,
      currentBookings: s.current_bookings,
      status: s.status,
      calendarEventId: s.calendar_event_id,
    })),
    bookings: trainingBookings.map((b) => ({
      id: b.id,
      sessionId: b.session_id,
      partnerName: b.partner_name,
      partnerEmail: b.partner_email,
      partnerPhone: b.partner_phone,
      companyName: b.company_name,
      status: b.status,
      assignedAm: b.assigned_am,
      hubspotDealId: b.hubspot_deal_id,
      notes: b.notes,
      createdAt: b.created_at,
    })),
  });
};
