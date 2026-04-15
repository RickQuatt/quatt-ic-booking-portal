/**
 * GET /api/sessions -- list upcoming open training sessions (public).
 */

import { getSupabase } from "../lib/supabase";
import type { Env } from "../lib/types";

export const onRequestGet = async (context: {
  request: Request;
  env: Env;
}) => {
  const supabase = getSupabase(context.env);
  const today = new Date().toISOString().split("T")[0];

  const { data: sessions, error } = await supabase
    .from("training_sessions")
    .select("*")
    .eq("status", "open")
    .gte("date", today)
    .order("date", { ascending: true });

  if (error) {
    console.error("Sessions fetch error:", error);
    return Response.json(
      { error: "Kon trainingen niet laden" },
      { status: 500 },
    );
  }

  const upcoming = (sessions || []).map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    location: s.location,
    maxCapacity: s.max_capacity ?? 8,
    spotsRemaining: (s.max_capacity ?? 8) - (s.current_bookings ?? 0),
    status: s.status,
  }));

  return Response.json(upcoming);
};
