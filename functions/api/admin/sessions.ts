/**
 * GET  /api/admin/sessions -- list all training sessions
 * POST /api/admin/sessions -- create a new training session
 */

import { getSupabase } from "../../lib/supabase";
import { createTrainingEvent } from "../../lib/google-calendar";
import type { Env } from "../../lib/types";

function getAdminToken(request: Request): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const adminCookie = cookies.find((c) => c.startsWith("admin_token="));
  return adminCookie ? adminCookie.split("=")[1] : null;
}

function validateAdmin(request: Request, env: Env): boolean {
  const token = getAdminToken(request);
  if (!token) return false;
  const validTokens = (env.ADMIN_TOKENS || "").split(",").map((t) => t.trim()).filter(Boolean);
  return validTokens.includes(token);
}

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}) => {
  if (!validateAdmin(context.request, context.env)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase(context.env);

  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Sessions fetch error:", error);
    return Response.json({ error: "Failed to load sessions" }, { status: 500 });
  }

  // Map snake_case to camelCase for frontend
  const mapped = (sessions || []).map((s) => ({
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
};

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}) => {
  if (!validateAdmin(context.request, context.env)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await context.request.json() as Record<string, unknown>;
  const { title, date, startTime, endTime, location, maxCapacity } = body as {
    title: string; date: string; startTime: string; endTime: string;
    location?: string; maxCapacity?: number;
  };

  if (!title || !date || !startTime || !endTime) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Create Google Calendar event
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

  const supabase = getSupabase(context.env);

  const { data: session, error: insertErr } = await supabase
    .from("training_sessions")
    .insert({
      title,
      date,
      start_time: startTime,
      end_time: endTime,
      location: location || "Quatt HQ, Amsterdam",
      max_capacity: maxCapacity || 8,
      calendar_event_id: calendarEventId,
      status: "open",
    })
    .select()
    .single();

  if (insertErr || !session) {
    console.error("Insert error:", insertErr);
    return Response.json({ error: "Session creation failed" }, { status: 500 });
  }

  return Response.json({
    id: session.id,
    title: session.title,
    date: session.date,
    startTime: session.start_time,
    endTime: session.end_time,
    location: session.location,
    maxCapacity: session.max_capacity,
    currentBookings: session.current_bookings,
    calendarEventId: session.calendar_event_id,
    status: session.status,
  });
};
