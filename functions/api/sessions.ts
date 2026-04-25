/**
 * GET /api/sessions -- list upcoming open training sessions (public).
 * Source: Cloudflare D1. Populated by POST /api/admin/sessions/sync from the
 * Trainingen Google Calendar.
 */

import { listUpcomingOpenSessions } from "../lib/d1-bookings";
import type { Env } from "../lib/types";

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}) => {
  try {
    const sessions = await listUpcomingOpenSessions(context.env);
    const upcoming = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      location: s.location,
      maxCapacity: s.max_capacity,
      spotsRemaining: Math.max(0, s.max_capacity - s.current_bookings),
      status: s.status,
    }));
    return Response.json(upcoming);
  } catch (e) {
    console.error("Sessions fetch error:", e);
    return Response.json({ error: "Kon trainingen niet laden" }, { status: 500 });
  }
};
