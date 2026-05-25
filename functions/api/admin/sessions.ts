/**
 * GET  /api/admin/sessions -- list all training sessions
 * POST /api/admin/sessions -- create a new training session (creates GCal event + D1 row)
 *
 * Prefer POST /api/admin/sessions/sync to pull from the Trainingen calendar instead
 * of creating sessions by hand. This endpoint remains for the rare one-off case.
 */

import { createTrainingEvent } from "../../lib/google-calendar";
import { validateAdmin } from "../../lib/admin-auth";
import { listAllSessions, requireDb, uuidv4 } from "../../lib/d1-bookings";
import type { Env } from "../../lib/types";

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}) => {
  if (!(await validateAdmin(context.request, context.env))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await listAllSessions(context.env);
    const mapped = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      location: s.location,
      maxCapacity: s.max_capacity,
      currentBookings: s.current_bookings,
      calendarEventId: s.calendar_event_id,
      status: s.status,
      createdAt: s.created_at,
    }));
    return Response.json(mapped);
  } catch (e) {
    console.error("Sessions fetch error:", e);
    return Response.json({ error: "Failed to load sessions" }, { status: 500 });
  }
};

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  if (!(await validateAdmin(context.request, context.env))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await context.request.json()) as Record<string, unknown>;
  const { title, date, startTime, endTime, location, maxCapacity } = body as {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    maxCapacity?: number;
  };

  if (!title || !date || !startTime || !endTime) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  let calendarEventId: string | null = null;
  try {
    calendarEventId = await createTrainingEvent(context.env, {
      title,
      date,
      startTime,
      endTime,
      location: location || "Quatt HQ, Amsterdam",
      maxCapacity: maxCapacity || 8,
    });
  } catch (e) {
    console.error("Calendar event creation failed:", e);
  }

  const id = uuidv4();
  const resolvedLocation = location || "Quatt HQ, Amsterdam";
  const resolvedMax = maxCapacity || 8;

  try {
    await requireDb(context.env)
      .prepare(
        `INSERT INTO training_sessions
         (id, title, date, start_time, end_time, location, max_capacity, current_bookings, calendar_event_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'open')`,
      )
      .bind(id, title, date, startTime, endTime, resolvedLocation, resolvedMax, calendarEventId)
      .run();
  } catch (e) {
    console.error("Insert error:", e);
    return Response.json({ error: "Session creation failed" }, { status: 500 });
  }

  return Response.json({
    id,
    title,
    date,
    startTime,
    endTime,
    location: resolvedLocation,
    maxCapacity: resolvedMax,
    currentBookings: 0,
    calendarEventId,
    status: "open",
  });
};
