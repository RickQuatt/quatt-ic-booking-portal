/**
 * POST /api/internal/create-training
 *
 * AM-toolkit-facing endpoint that lets an account manager create a new
 * training session. Writes a real Google Calendar event AND a D1 row in one
 * shot, so the next walleos-booking-sync run sees a consistent state.
 *
 * Auth: shared `RESERVE_SECRET` header (same pattern as
 * /api/internal/reserve-training and /api/internal/trainings-overview).
 * Called from quatt-am-toolkit's server-side proxy after the AM has already
 * passed the toolkit's Google-OAuth session check. Fails closed if
 * RESERVE_SECRET is unset.
 *
 * Differences vs. /api/admin/sessions POST:
 *   - secret header auth (not Cloudflare Access).
 *   - validates date is future weekday, time is HH:MM, end > start, capacity 1-30.
 *   - persists `created_by_email` for audit (added in migration 0009).
 *   - defaults match the canonical Hybrid template: location
 *     "Quatt Lab -- Schakelstraat 17, Amsterdam", capacity 11.
 *   - routes to the All-e calendar when track='alle' (sync route does the same).
 */

import { createTrainingEvent } from "../../lib/google-calendar";
import { requireDb, uuidv4 } from "../../lib/d1-bookings";
import type { Env, TrainingTrack } from "../../lib/types";

const TIME_RE = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_LOCATION = "Quatt Lab -- Schakelstraat 17, Amsterdam";
const DEFAULT_CAPACITY = 11;
const DEFAULT_START = "10:00";
const DEFAULT_END = "16:00";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

interface CreateTrainingBody {
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxCapacity?: number;
  track?: TrainingTrack;
  actorEmail?: string;
}

function validate(body: CreateTrainingBody):
  | { ok: true; v: Required<Pick<CreateTrainingBody, "title" | "date" | "startTime" | "endTime" | "location" | "maxCapacity" | "track" | "actorEmail">> }
  | { ok: false; error: string } {
  const title = (body.title || "").trim();
  if (!title) return { ok: false, error: "title required" };

  const date = (body.date || "").trim();
  if (!DATE_RE.test(date)) return { ok: false, error: "date must be YYYY-MM-DD" };
  // Parse as midnight Europe/Amsterdam-ish (date-only). We only care about the
  // calendar day, so use the local date constructor and compare to today.
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return { ok: false, error: "date invalid" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dt.getTime() < today.getTime()) return { ok: false, error: "date must be today or future" };
  const dow = dt.getDay(); // 0 Sun .. 6 Sat
  if (dow === 0 || dow === 6) return { ok: false, error: "date must be a weekday (Mon-Fri)" };

  const startTime = (body.startTime || DEFAULT_START).trim();
  const endTime = (body.endTime || DEFAULT_END).trim();
  if (!TIME_RE.test(startTime)) return { ok: false, error: "startTime must be HH:MM" };
  if (!TIME_RE.test(endTime)) return { ok: false, error: "endTime must be HH:MM" };
  if (startTime >= endTime) return { ok: false, error: "endTime must be after startTime" };

  const rawCap = body.maxCapacity;
  const maxCapacity =
    typeof rawCap === "number" && Number.isFinite(rawCap) ? Math.trunc(rawCap) : DEFAULT_CAPACITY;
  if (maxCapacity < 1 || maxCapacity > 30) {
    return { ok: false, error: "maxCapacity must be between 1 and 30" };
  }

  const track: TrainingTrack = body.track === "alle" ? "alle" : "hybrid";
  const location = (body.location || DEFAULT_LOCATION).trim();
  const actorEmail = (body.actorEmail || "").trim().toLowerCase();
  if (!EMAIL_RE.test(actorEmail)) return { ok: false, error: "actorEmail required" };

  return { ok: true, v: { title, date, startTime, endTime, location, maxCapacity, track, actorEmail } };
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { env, request } = context;

  if (!env.RESERVE_SECRET) {
    return Response.json({ error: "Endpoint not configured" }, { status: 503 });
  }
  const provided = request.headers.get("x-reserve-secret") || "";
  if (!provided || !timingSafeEqual(provided, env.RESERVE_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: CreateTrainingBody;
  try {
    raw = (await request.json()) as CreateTrainingBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = validate(raw);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  const v = result.v;

  // Route to the correct calendar per track. /api/admin/sessions/sync uses the
  // same env vars; staying consistent means a newly-created session shows up
  // again on the next sync (idempotent via the calendar_event_id unique index).
  const calendarId =
    v.track === "alle" && env.ALLE_TRAINING_CALENDAR_ID
      ? env.ALLE_TRAINING_CALENDAR_ID
      : env.TRAINING_CALENDAR_ID;
  const titlePrefix =
    v.track === "alle" ? "All-e Installatietraining" : "Quatt Installatie Training";

  let calendarEventId: string | null = null;
  try {
    calendarEventId = await createTrainingEvent(env, {
      title: v.title,
      date: v.date,
      startTime: v.startTime,
      endTime: v.endTime,
      location: v.location,
      maxCapacity: v.maxCapacity,
      calendarId,
      titlePrefix,
    });
  } catch (e) {
    console.error("[create-training] GCal create failed:", e);
    return Response.json(
      { error: "Calendar event creation failed", detail: (e as Error).message },
      { status: 502 },
    );
  }

  const id = uuidv4();
  try {
    await requireDb(env)
      .prepare(
        `INSERT INTO training_sessions
           (id, title, date, start_time, end_time, location, max_capacity,
            current_bookings, calendar_event_id, status, track, created_by_email)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'open', ?, ?)`,
      )
      .bind(
        id,
        v.title,
        v.date,
        v.startTime,
        v.endTime,
        v.location,
        v.maxCapacity,
        calendarEventId,
        v.track,
        v.actorEmail,
      )
      .run();
  } catch (e) {
    console.error("[create-training] D1 insert failed:", e);
    // GCal event already exists -- surface the conflict so the AM can decide
    // whether to delete the orphan or retry. The /sessions/sync run will
    // reconcile next cycle either way (unique index on calendar_event_id).
    return Response.json(
      {
        error: "Session record creation failed",
        detail: (e as Error).message,
        calendarEventId,
      },
      { status: 500 },
    );
  }

  return Response.json({
    id,
    title: v.title,
    date: v.date,
    startTime: v.startTime,
    endTime: v.endTime,
    location: v.location,
    maxCapacity: v.maxCapacity,
    currentBookings: 0,
    calendarEventId,
    status: "open",
    track: v.track,
    createdByEmail: v.actorEmail,
  });
};
