/**
 * POST /api/admin/sessions/sync
 *
 * Reads upcoming events from each training Google Calendar and upserts them into
 * the D1 `training_sessions` table so /book/training (Hybrid) and /book/training/alle
 * (All-e) can render bookable sessions. Sessions not present in their source calendar
 * (but still open in the DB with a future date) get marked as `cancelled`.
 *
 * Each Google Calendar is the source of truth for its track:
 *   hybrid -> env.TRAINING_CALENDAR_ID       ("Quatt Installatie Trainingen")
 *   alle   -> env.ALLE_TRAINING_CALENDAR_ID  ("All-e Installatietraining")
 *
 * Capacity parsing: reads "Max: N" / "Max deelnemers: N" / "Capacity: N" from the
 * event description. Defaults to 8 if not present.
 */

import { listUpcomingEvents } from "../../../lib/google-calendar";
import { validateAdmin } from "../../../lib/admin-auth";
import {
  cancelSession,
  getLatestTrainingTemplate,
  getVirtualSessionByDate,
  insertVirtualSession,
  requireDb,
  upsertSessionByCalendarEventId,
} from "../../../lib/d1-bookings";
import type { Env, TrainingTrack } from "../../../lib/types";

const VIRTUAL_HORIZON_DAYS = 90;

function isWeekday(date: Date): boolean {
  const d = date.getUTCDay();
  return d >= 1 && d <= 5;
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DEFAULT_MAX_CAPACITY = 8;
const DEFAULT_LOCATION = "Quatt Lab -- Schakelstraat 17, Amsterdam";

function parseMaxCapacity(description: string | undefined): number {
  if (!description) return DEFAULT_MAX_CAPACITY;
  const match =
    description.match(/\bmax(?:\s+deelnemers)?\s*[:=]\s*(\d{1,3})/i) ||
    description.match(/\bcapacity\s*[:=]\s*(\d{1,3})/i);
  const n = match ? parseInt(match[1], 10) : DEFAULT_MAX_CAPACITY;
  return Number.isFinite(n) && n > 0 && n < 100 ? n : DEFAULT_MAX_CAPACITY;
}

/**
 * Events migrated from Calendly have titles like "Installatie Training Quatt (7 of 11 spots filled)".
 * Extract the pair so we can seed current_bookings + max_capacity without manual data entry.
 * Returns `null` if the title doesn't match the pattern.
 */
function parseSpotsFromTitle(
  title: string,
): { currentBookings: number; maxCapacity: number } | null {
  const m = title.match(/\((\d{1,3})\s+of\s+(\d{1,3})\s+spots?\s+filled\)/i);
  if (!m) return null;
  const cur = parseInt(m[1], 10);
  const max = parseInt(m[2], 10);
  if (!Number.isFinite(cur) || !Number.isFinite(max)) return null;
  if (max <= 0 || max > 100 || cur < 0 || cur > max) return null;
  return { currentBookings: cur, maxCapacity: max };
}

/**
 * Strip the Calendly spot-count suffix and the Quatt prefix so we store a clean title.
 */
function cleanTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\s*\(\d+\s+of\s+\d+\s+spots?\s+filled\)\s*$/i, "")
    .replace(/^Quatt Installatie Training\s*[-\u2013]+\s*/i, "")
    .trim() || rawTitle;
}

/**
 * The Trainingen calendar is dedicated to trainings -- any timed event on it is a
 * bookable training EXCEPT Rick's placeholder "Block" events (and variants). Partners
 * see whatever timed event Rick drops on the day.
 *
 * Rationale: Rick's workflow is "I just open a day in the calendar" -- he doesn't
 * want to remember a title convention. If an event ends up here that ISN'T a training,
 * that's a calendar discipline problem, not something to fix with a title regex.
 */
function isBookableTraining(title: string): boolean {
  const t = title.trim().toLowerCase();
  if (!t) return false;
  // Block placeholders in any capitalization / pluralization.
  if (t === "block" || t === "blocks" || t === "geblokkeerd") return false;
  return true;
}

function extractDate(iso: string): string {
  return iso.slice(0, 10);
}
function extractTime(iso: string): string {
  return iso.slice(11, 16);
}

interface TrackSyncSummary {
  track: TrainingTrack;
  calendar_id: string;
  calendar_events_seen: number;
  all_day_ignored: number;
  non_training_ignored: number;
  inserted: number;
  updated: number;
  unchanged: number;
  cancelled: number;
  virtual_inserted: number;
  virtual_skipped_existing: number;
  virtual_cancelled: number;
  template_used: {
    title: string;
    start_time: string;
    end_time: string;
    location: string;
    max_capacity: number;
  };
  errors: string[];
}

/**
 * Sync a single Google Calendar -> D1 for one training track.
 * Each track is independent: D1 stale-detection and virtual-session generation
 * are scoped to the track, so an empty All-e calendar will never cancel Hybrid
 * sessions and vice versa.
 */
async function syncTrackCalendar(
  env: Env,
  track: TrainingTrack,
  calendarId: string,
  dumpEvents?: { id: string; summary: string; start: string; end: string; isAllDay: boolean; status: string; location?: string; wouldBeBookable: boolean }[],
): Promise<TrackSyncSummary> {
  const sum: TrackSyncSummary = {
    track,
    calendar_id: calendarId,
    calendar_events_seen: 0,
    all_day_ignored: 0,
    non_training_ignored: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    cancelled: 0,
    virtual_inserted: 0,
    virtual_skipped_existing: 0,
    virtual_cancelled: 0,
    template_used: {
      title: "",
      start_time: "",
      end_time: "",
      location: "",
      max_capacity: 0,
    },
    errors: [],
  };

  let events;
  try {
    events = await listUpcomingEvents(env, calendarId, 120);
  } catch (e) {
    sum.errors.push(`list ${track}: ${e instanceof Error ? e.message : String(e)}`);
    return sum;
  }

  sum.calendar_events_seen = events.length;
  sum.all_day_ignored = events.filter((e) => e.isAllDay).length;
  sum.non_training_ignored = events.filter(
    (e) => !e.isAllDay && e.status !== "cancelled" && !isBookableTraining(e.summary),
  ).length;

  if (dumpEvents) {
    for (const e of events) {
      dumpEvents.push({
        id: e.id,
        summary: e.summary,
        start: e.start,
        end: e.end,
        isAllDay: e.isAllDay,
        status: e.status,
        location: e.location,
        wouldBeBookable:
          e.status !== "cancelled" && !e.isAllDay && isBookableTraining(e.summary),
      });
    }
  }

  const bookable = events.filter(
    (e) => e.status !== "cancelled" && !e.isAllDay && isBookableTraining(e.summary),
  );
  const bookableIds = new Set(bookable.map((e) => e.id));

  for (const event of bookable) {
    const spotsFromTitle = parseSpotsFromTitle(event.summary);
    const title = cleanTitle(event.summary);
    const maxCapacity = spotsFromTitle?.maxCapacity ?? parseMaxCapacity(event.description);

    try {
      const result = await upsertSessionByCalendarEventId(env, {
        title,
        date: extractDate(event.start),
        start_time: extractTime(event.start),
        end_time: extractTime(event.end),
        location: event.location || DEFAULT_LOCATION,
        max_capacity: maxCapacity,
        calendar_event_id: event.id,
        status: "open",
        track,
      });
      if (result === "inserted") sum.inserted += 1;
      else if (result === "updated") sum.updated += 1;
      else sum.unchanged += 1;

      // If Calendly seeded a spot count in the title, persist it so the booking
      // page shows accurate spots-remaining. Only on first insert.
      if (spotsFromTitle && result === "inserted") {
        await requireDb(env)
          .prepare(
            `UPDATE training_sessions SET current_bookings = ?, updated_at = datetime('now') WHERE calendar_event_id = ?`,
          )
          .bind(spotsFromTitle.currentBookings, event.id)
          .run();
      }
    } catch (e) {
      sum.errors.push(`${event.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Cancel rows whose GCal event disappeared or was cancelled -- scoped to this track.
  const todayIso = new Date().toISOString().slice(0, 10);
  const stale = await requireDb(env)
    .prepare(
      `SELECT id, calendar_event_id FROM training_sessions
         WHERE date >= ? AND status != 'cancelled' AND track = ? AND calendar_event_id IS NOT NULL`,
    )
    .bind(todayIso, track)
    .all<{ id: string; calendar_event_id: string | null }>();

  for (const s of stale.results || []) {
    if (s.calendar_event_id && !bookableIds.has(s.calendar_event_id)) {
      try {
        await cancelSession(env, s.id);
        sum.cancelled += 1;
      } catch (e) {
        sum.errors.push(`cancel ${s.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // Virtual sessions: synthesize bookable days when the calendar has neither a
  // training event nor a Block placeholder. Per-track template + per-track scope.
  const blockDates = new Set<string>();
  const realEventDates = new Set<string>();
  for (const ev of events) {
    if (ev.status === "cancelled") continue;
    if (ev.isAllDay) continue;
    const dt = ev.start.slice(0, 10);
    if (isBookableTraining(ev.summary)) realEventDates.add(dt);
    else blockDates.add(dt);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setUTCDate(horizon.getUTCDate() + VIRTUAL_HORIZON_DAYS);

  const template = await getLatestTrainingTemplate(env, track);
  sum.template_used = template;

  // All-e is explicit-schedule-only: only events Rick puts on the calendar are
  // bookable. Hybrid keeps its "every unblocked weekday is bookable" behavior
  // because it runs continuously; All-e runs as discrete announced sessions.
  const skipVirtuals = track === "alle";

  const virtualDates = new Set<string>();
  if (!skipVirtuals) {
    for (
      let cursor = new Date(today);
      cursor < horizon;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      if (!isWeekday(cursor)) continue;
      const ds = dateOnly(cursor);
      if (blockDates.has(ds)) continue;
      if (realEventDates.has(ds)) continue;
      virtualDates.add(ds);

      const existing = await getVirtualSessionByDate(env, ds, track);
      if (existing) {
        sum.virtual_skipped_existing += 1;
        continue;
      }

      try {
        await insertVirtualSession(env, {
          date: ds,
          title: template.title,
          start_time: template.start_time,
          end_time: template.end_time,
          location: template.location,
          max_capacity: template.max_capacity,
          track,
        });
        sum.virtual_inserted += 1;
      } catch (e) {
        sum.errors.push(`virtual ${ds}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // Cancel virtual sessions for THIS track that are no longer in the unblocked
  // set AND have zero bookings.
  const virtualStale = await requireDb(env)
    .prepare(
      `SELECT id, date, current_bookings FROM training_sessions
         WHERE calendar_event_id IS NULL AND status != 'cancelled' AND date >= ? AND track = ?`,
    )
    .bind(dateOnly(today), track)
    .all<{ id: string; date: string; current_bookings: number }>();

  for (const vs of virtualStale.results || []) {
    if (!skipVirtuals && virtualDates.has(vs.date)) continue;
    if (vs.current_bookings > 0) continue;
    try {
      await cancelSession(env, vs.id);
      sum.virtual_cancelled += 1;
    } catch (e) {
      sum.errors.push(`virtual-cancel ${vs.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return sum;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  const { env, request } = context;

  if (!(await validateAdmin(request, env))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!env.TRAINING_CALENDAR_ID) {
    return Response.json(
      { error: "TRAINING_CALENDAR_ID not configured" },
      { status: 500 },
    );
  }
  if (!env.DB) {
    return Response.json({ error: "D1 binding missing" }, { status: 500 });
  }

  const dump = new URL(request.url).searchParams.get("dump") === "1";
  const dumpEvents = dump ? [] : undefined;

  const tracks: { track: TrainingTrack; calendarId: string }[] = [
    { track: "hybrid", calendarId: env.TRAINING_CALENDAR_ID },
  ];
  if (env.ALLE_TRAINING_CALENDAR_ID) {
    tracks.push({ track: "alle", calendarId: env.ALLE_TRAINING_CALENDAR_ID });
  }

  const results: TrackSyncSummary[] = [];
  for (const t of tracks) {
    const r = await syncTrackCalendar(env, t.track, t.calendarId, dumpEvents);
    results.push(r);
  }

  if (dump) {
    return Response.json({
      total: dumpEvents!.length,
      events: dumpEvents!.sort((a, b) => a.start.localeCompare(b.start)),
      tracks: results.map((r) => ({ track: r.track, calendar_id: r.calendar_id, seen: r.calendar_events_seen })),
    });
  }

  return Response.json({
    success: true,
    tracks: results,
    syncedAt: new Date().toISOString(),
  });
};
