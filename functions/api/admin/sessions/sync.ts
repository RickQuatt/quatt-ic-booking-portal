/**
 * POST /api/admin/sessions/sync
 *
 * Reads upcoming events from the `Trainingen` Google Calendar (env.TRAINING_CALENDAR_ID)
 * and upserts them into the D1 `training_sessions` table so /book/training can render
 * them as bookable sessions. Sessions not present in the calendar (but still open in
 * the DB with a future date) get marked as `cancelled`.
 *
 * The Trainingen Google Calendar is the source of truth; the portal mirrors it.
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
import type { Env } from "../../../lib/types";

const VIRTUAL_HORIZON_DAYS = 90;

function isWeekday(date: Date): boolean {
  const d = date.getUTCDay();
  return d >= 1 && d <= 5;
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DEFAULT_MAX_CAPACITY = 8;
const DEFAULT_LOCATION = "Quatt HQ, Amsterdam";

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

  let events;
  try {
    events = await listUpcomingEvents(env, env.TRAINING_CALENDAR_ID, 120);
  } catch (e) {
    console.error("Failed to list calendar events:", e);
    return Response.json(
      { error: "Could not read Trainingen calendar", detail: String(e) },
      { status: 502 },
    );
  }

  // Debug mode: POST /api/admin/sessions/sync?dump=1 returns every event seen
  // (with title / times / isAllDay / status) and skips the D1 upsert. Used to
  // diagnose why an expected event isn't being imported.
  const dump = new URL(request.url).searchParams.get("dump") === "1";
  if (dump) {
    return Response.json({
      total: events.length,
      events: events
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((e) => ({
          id: e.id,
          summary: e.summary,
          start: e.start,
          end: e.end,
          isAllDay: e.isAllDay,
          status: e.status,
          location: e.location,
          wouldBeBookable:
            e.status !== "cancelled" && !e.isAllDay && isBookableTraining(e.summary),
        })),
    });
  }

  // Only bookable events: confirmed/tentative AND not all-day AND not a Block
  // placeholder. Any other timed event on the Trainingen calendar counts as a
  // bookable training.
  const bookable = events.filter(
    (e) => e.status !== "cancelled" && !e.isAllDay && isBookableTraining(e.summary),
  );
  const bookableIds = new Set(bookable.map((e) => e.id));

  const summary = {
    calendar_events_seen: events.length,
    all_day_ignored: events.filter((e) => e.isAllDay).length,
    non_training_ignored: events.filter(
      (e) => !e.isAllDay && e.status !== "cancelled" && !isBookableTraining(e.summary),
    ).length,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    cancelled: 0,
    errors: [] as string[],
  };

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
      });
      if (result === "inserted") summary.inserted += 1;
      else if (result === "updated") summary.updated += 1;
      else summary.unchanged += 1;

      // If Calendly seeded a spot count in the title, persist it so /book/training
      // shows accurate spots-remaining for migrated events. Only apply on first
      // insert -- don't overwrite partner bookings that accumulated in D1.
      if (spotsFromTitle && result === "inserted") {
        await requireDb(env)
          .prepare(
            `UPDATE training_sessions SET current_bookings = ?, updated_at = datetime('now') WHERE calendar_event_id = ?`,
          )
          .bind(spotsFromTitle.currentBookings, event.id)
          .run();
      }
    } catch (e) {
      summary.errors.push(`${event.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Cancel D1 rows whose GCal event disappeared or was cancelled.
  const todayIso = new Date().toISOString().slice(0, 10);
  const stale = await requireDb(env)
    .prepare(
      `SELECT id, calendar_event_id FROM training_sessions WHERE date >= ? AND status != 'cancelled'`,
    )
    .bind(todayIso)
    .all<{ id: string; calendar_event_id: string | null }>();

  for (const s of stale.results || []) {
    if (s.calendar_event_id && !bookableIds.has(s.calendar_event_id)) {
      try {
        await cancelSession(env, s.id);
        summary.cancelled += 1;
      } catch (e) {
        summary.errors.push(`cancel ${s.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // ---------------------------------------------------------------------
  // Virtual sessions: when Rick removes a "Block" from a weekday, that day
  // becomes bookable using the most recent training as a template. We
  // synthesize a session in D1 (no calendar_event_id yet); a real Google
  // Calendar event is created lazily on the first partner booking.
  // ---------------------------------------------------------------------

  const blockDates = new Set<string>(); // dates with a Block event
  const realEventDates = new Set<string>(); // dates with a non-Block training event
  for (const ev of events) {
    if (ev.status === "cancelled") continue;
    if (ev.isAllDay) continue; // Block placeholders are timed in this calendar
    const dt = ev.start.slice(0, 10);
    if (isBookableTraining(ev.summary)) realEventDates.add(dt);
    else blockDates.add(dt); // Block / OOO / etc.
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setUTCDate(horizon.getUTCDate() + VIRTUAL_HORIZON_DAYS);

  const template = await getLatestTrainingTemplate(env);

  const virtualDates = new Set<string>();
  let virtualInserted = 0;
  let virtualSkipped = 0;

  for (let cursor = new Date(today); cursor < horizon; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    if (!isWeekday(cursor)) continue;
    const ds = dateOnly(cursor);
    if (blockDates.has(ds)) continue; // still blocked
    if (realEventDates.has(ds)) continue; // a real timed training already covers this day
    virtualDates.add(ds);

    const existing = await getVirtualSessionByDate(env, ds);
    if (existing) {
      virtualSkipped += 1;
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
      });
      virtualInserted += 1;
    } catch (e) {
      summary.errors.push(`virtual ${ds}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Cancel virtual sessions that are no longer in the unblocked set AND have
  // zero bookings (preserving any session that already saw partner traffic).
  const virtualStale = await requireDb(env)
    .prepare(
      `SELECT id, date, current_bookings FROM training_sessions
         WHERE calendar_event_id IS NULL AND status != 'cancelled' AND date >= ?`,
    )
    .bind(dateOnly(today))
    .all<{ id: string; date: string; current_bookings: number }>();

  let virtualCancelled = 0;
  for (const vs of virtualStale.results || []) {
    if (virtualDates.has(vs.date)) continue;
    if (vs.current_bookings > 0) continue; // never cancel a session with bookings
    try {
      await cancelSession(env, vs.id);
      virtualCancelled += 1;
    } catch (e) {
      summary.errors.push(`virtual-cancel ${vs.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const extendedSummary = {
    ...summary,
    virtual_inserted: virtualInserted,
    virtual_skipped_existing: virtualSkipped,
    virtual_cancelled: virtualCancelled,
    template_used: {
      title: template.title,
      start_time: template.start_time,
      end_time: template.end_time,
      location: template.location,
      max_capacity: template.max_capacity,
    },
  };

  return Response.json({
    success: true,
    summary: extendedSummary,
    syncedAt: new Date().toISOString(),
  });
};
