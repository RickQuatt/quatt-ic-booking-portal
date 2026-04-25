/**
 * D1 access layer for booking portal. Replaces functions/lib/supabase.ts for new writes.
 * Supabase is never touched by anything that imports from here.
 */

import type { Env } from "./types";

export function requireDb(env: Env): D1Database {
  if (!env.DB) throw new Error("D1 binding 'DB' missing");
  return env.DB;
}

export function uuidv4(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- Training sessions ------------------------------------------------------

export interface TrainingSessionRow {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  max_capacity: number;
  current_bookings: number;
  calendar_event_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listUpcomingOpenSessions(env: Env): Promise<TrainingSessionRow[]> {
  // Include both 'open' and 'full' so partners see full sessions as "Vol" instead of
  // those sessions vanishing -- frontend /book/training renders the Vol badge when
  // spotsRemaining <= 0. 'cancelled' + 'completed' remain hidden.
  const today = new Date().toISOString().slice(0, 10);
  const res = await requireDb(env)
    .prepare(
      `SELECT * FROM training_sessions
         WHERE status IN ('open', 'full') AND date >= ?
         ORDER BY date ASC, start_time ASC`,
    )
    .bind(today)
    .all<TrainingSessionRow>();
  return res.results || [];
}

/**
 * Returns the most recent non-cancelled, calendar-backed training session as a template
 * for "synthetic" sessions auto-created when Rick removes a Block from the calendar.
 * Falls back to hard-coded defaults if no prior training exists.
 */
export async function getLatestTrainingTemplate(
  env: Env,
): Promise<{
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  max_capacity: number;
}> {
  const row = await requireDb(env)
    .prepare(
      `SELECT title, start_time, end_time, location, max_capacity
         FROM training_sessions
         WHERE status != 'cancelled' AND calendar_event_id IS NOT NULL
         ORDER BY date DESC, created_at DESC
         LIMIT 1`,
    )
    .first<{
      title: string;
      start_time: string;
      end_time: string;
      location: string;
      max_capacity: number;
    }>();

  return (
    row ?? {
      title: "Installatie Training Quatt",
      start_time: "10:00",
      end_time: "16:00",
      location: "Schakelstraat 17, Amsterdam",
      max_capacity: 11,
    }
  );
}

export async function getVirtualSessionByDate(
  env: Env,
  date: string,
): Promise<TrainingSessionRow | null> {
  return await requireDb(env)
    .prepare(
      `SELECT * FROM training_sessions WHERE date = ? AND calendar_event_id IS NULL AND status != 'cancelled' LIMIT 1`,
    )
    .bind(date)
    .first<TrainingSessionRow>();
}

export async function insertVirtualSession(
  env: Env,
  row: {
    date: string;
    title: string;
    start_time: string;
    end_time: string;
    location: string;
    max_capacity: number;
  },
): Promise<string> {
  const id = uuidv4();
  await requireDb(env)
    .prepare(
      `INSERT INTO training_sessions
       (id, title, date, start_time, end_time, location, max_capacity, current_bookings, calendar_event_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 'open')`,
    )
    .bind(
      id,
      row.title,
      row.date,
      row.start_time,
      row.end_time,
      row.location,
      row.max_capacity,
    )
    .run();
  return id;
}

export async function listAllSessions(env: Env): Promise<TrainingSessionRow[]> {
  const res = await requireDb(env)
    .prepare(`SELECT * FROM training_sessions ORDER BY date DESC`)
    .all<TrainingSessionRow>();
  return res.results || [];
}

export async function getSessionById(
  env: Env,
  id: string,
): Promise<TrainingSessionRow | null> {
  return await requireDb(env)
    .prepare(`SELECT * FROM training_sessions WHERE id = ?`)
    .bind(id)
    .first<TrainingSessionRow>();
}

export async function getSessionByCalendarEventId(
  env: Env,
  eventId: string,
): Promise<TrainingSessionRow | null> {
  return await requireDb(env)
    .prepare(`SELECT * FROM training_sessions WHERE calendar_event_id = ?`)
    .bind(eventId)
    .first<TrainingSessionRow>();
}

export async function upsertSessionByCalendarEventId(
  env: Env,
  row: {
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    max_capacity: number;
    calendar_event_id: string;
    status: string;
  },
): Promise<"inserted" | "updated" | "unchanged"> {
  const db = requireDb(env);
  const existing = await getSessionByCalendarEventId(env, row.calendar_event_id);

  if (!existing) {
    await db
      .prepare(
        `INSERT INTO training_sessions
         (id, title, date, start_time, end_time, location, max_capacity, current_bookings, calendar_event_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      )
      .bind(
        uuidv4(),
        row.title,
        row.date,
        row.start_time,
        row.end_time,
        row.location,
        row.max_capacity,
        row.calendar_event_id,
        row.status,
      )
      .run();
    return "inserted";
  }

  const unchanged =
    existing.title === row.title &&
    existing.date === row.date &&
    existing.start_time === row.start_time &&
    existing.end_time === row.end_time &&
    existing.location === row.location &&
    existing.max_capacity === row.max_capacity &&
    existing.status === row.status;
  if (unchanged) return "unchanged";

  await db
    .prepare(
      `UPDATE training_sessions
       SET title=?, date=?, start_time=?, end_time=?, location=?, max_capacity=?, status=?, updated_at=datetime('now')
       WHERE id=?`,
    )
    .bind(
      row.title,
      row.date,
      row.start_time,
      row.end_time,
      row.location,
      row.max_capacity,
      row.status,
      existing.id,
    )
    .run();
  return "updated";
}

export async function cancelSession(env: Env, id: string): Promise<void> {
  await requireDb(env)
    .prepare(
      `UPDATE training_sessions SET status='cancelled', updated_at=datetime('now') WHERE id=?`,
    )
    .bind(id)
    .run();
}

export async function incrementSessionBookings(env: Env, sessionId: string): Promise<void> {
  await requireDb(env)
    .prepare(
      `UPDATE training_sessions
         SET current_bookings = current_bookings + 1,
             status = CASE WHEN current_bookings + 1 >= max_capacity THEN 'full' ELSE status END,
             updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(sessionId)
    .run();
}

export async function decrementSessionBookings(env: Env, sessionId: string): Promise<void> {
  await requireDb(env)
    .prepare(
      `UPDATE training_sessions
         SET current_bookings = MAX(0, current_bookings - 1),
             status = CASE WHEN status = 'full' AND current_bookings - 1 < max_capacity THEN 'open' ELSE status END,
             updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(sessionId)
    .run();
}

// --- Bookings ---------------------------------------------------------------

export interface BookingRow {
  id: string;
  type: string;
  session_id: string | null;
  partner_name: string;
  partner_email: string;
  partner_phone: string | null;
  company_name: string;
  kvk_number: string | null;
  preferred_date: string | null;
  preferred_time_slot: string | null;
  notes: string | null;
  location: string | null;
  status: string;
  calendar_event_id: string | null;
  sheet_row_id: string | null;
  assigned_am: string | null;
  hubspot_deal_id: string | null;
  meeting_format: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewBookingInput {
  type: string;
  session_id?: string | null;
  partner_name: string;
  partner_email: string;
  partner_phone?: string | null;
  company_name: string;
  kvk_number?: string | null;
  preferred_date?: string | null;
  preferred_time_slot?: string | null;
  notes?: string | null;
  location?: string | null;
  status: string;
  calendar_event_id?: string | null;
  assigned_am?: string | null;
  hubspot_deal_id?: string | null;
  meeting_format?: string | null;
}

export async function insertBooking(env: Env, input: NewBookingInput): Promise<BookingRow> {
  const id = uuidv4();
  const db = requireDb(env);
  await db
    .prepare(
      `INSERT INTO bookings
       (id, type, session_id, partner_name, partner_email, partner_phone,
        company_name, kvk_number, preferred_date, preferred_time_slot, notes, location,
        status, calendar_event_id, assigned_am, hubspot_deal_id, meeting_format)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.type,
      input.session_id ?? null,
      input.partner_name,
      input.partner_email,
      input.partner_phone ?? null,
      input.company_name,
      input.kvk_number ?? null,
      input.preferred_date ?? null,
      input.preferred_time_slot ?? null,
      input.notes ?? null,
      input.location ?? null,
      input.status,
      input.calendar_event_id ?? null,
      input.assigned_am ?? null,
      input.hubspot_deal_id ?? null,
      input.meeting_format ?? null,
    )
    .run();

  const row = await db
    .prepare(`SELECT * FROM bookings WHERE id = ?`)
    .bind(id)
    .first<BookingRow>();
  if (!row) throw new Error("Insert succeeded but row not found");
  return row;
}

export async function getBookingById(env: Env, id: string): Promise<BookingRow | null> {
  return await requireDb(env)
    .prepare(`SELECT * FROM bookings WHERE id = ?`)
    .bind(id)
    .first<BookingRow>();
}

export async function findActiveSessionBookingForEmail(
  env: Env,
  sessionId: string,
  email: string,
): Promise<BookingRow | null> {
  return await requireDb(env)
    .prepare(
      `SELECT * FROM bookings WHERE session_id = ? AND partner_email = ? AND status != 'cancelled' LIMIT 1`,
    )
    .bind(sessionId, email)
    .first<BookingRow>();
}

export async function countBookingsByType(env: Env, type: string): Promise<number> {
  const row = await requireDb(env)
    .prepare(`SELECT COUNT(*) as n FROM bookings WHERE type = ?`)
    .bind(type)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

export async function updateBookingCalendar(
  env: Env,
  id: string,
  calendarEventId: string,
): Promise<void> {
  await requireDb(env)
    .prepare(
      `UPDATE bookings SET calendar_event_id=?, updated_at=datetime('now') WHERE id=?`,
    )
    .bind(calendarEventId, id)
    .run();
}

export async function updateBookingSheetRow(
  env: Env,
  id: string,
  sheetRowId: string,
): Promise<void> {
  await requireDb(env)
    .prepare(
      `UPDATE bookings SET sheet_row_id=?, updated_at=datetime('now') WHERE id=?`,
    )
    .bind(sheetRowId, id)
    .run();
}

export async function setBookingStatus(
  env: Env,
  id: string,
  status: string,
): Promise<void> {
  await requireDb(env)
    .prepare(
      `UPDATE bookings SET status=?, updated_at=datetime('now') WHERE id=?`,
    )
    .bind(status, id)
    .run();
}

export async function rescheduleBooking(
  env: Env,
  id: string,
  patch: {
    calendar_event_id?: string | null;
    preferred_date?: string | null;
    location?: string | null;
    notes?: string | null;
    assigned_am?: string | null;
  },
): Promise<void> {
  const updates: string[] = [];
  const values: (string | null)[] = [];

  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    updates.push(`${k} = ?`);
    values.push(v);
  }
  if (updates.length === 0) return;

  updates.push(`updated_at = datetime('now')`);
  values.push(id);

  await requireDb(env)
    .prepare(`UPDATE bookings SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function listRecentBookings(
  env: Env,
  limit = 200,
): Promise<BookingRow[]> {
  const res = await requireDb(env)
    .prepare(`SELECT * FROM bookings ORDER BY created_at DESC LIMIT ?`)
    .bind(limit)
    .all<BookingRow>();
  return res.results || [];
}
