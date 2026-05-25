/**
 * GET /api/sessions -- list upcoming open training sessions (public).
 * Source: Cloudflare D1. Populated by POST /api/admin/sessions/sync from the
 * Trainingen + All-e Installatietraining Google Calendars.
 *
 * Query params:
 *   ?track=hybrid -- only Hybrid track sessions (default for /book/training)
 *   ?track=alle   -- only All-e track sessions (used by /book/training/alle)
 *   (omitted)     -- all tracks merged (legacy callers)
 */

import { listUpcomingOpenSessions } from "../lib/d1-bookings";
import type { Env, TrainingTrack } from "../lib/types";

const ALLOWED_TRACKS: ReadonlySet<TrainingTrack> = new Set(["hybrid", "alle"]);

function parseTrack(req: Request): TrainingTrack | undefined {
  const raw = new URL(req.url).searchParams.get("track");
  if (!raw) return undefined;
  return ALLOWED_TRACKS.has(raw as TrainingTrack) ? (raw as TrainingTrack) : undefined;
}

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}) => {
  try {
    const track = parseTrack(context.request);
    const sessions = await listUpcomingOpenSessions(context.env, track);
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
      track: s.track,
    }));
    return Response.json(upcoming);
  } catch (e) {
    console.error("Sessions fetch error:", e);
    return Response.json({ error: "Kon trainingen niet laden" }, { status: 500 });
  }
};
