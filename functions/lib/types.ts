/**
 * Shared types for IC Booking Portal.
 * All Cloudflare Functions import Env and domain types from here.
 */

// --- Cloudflare Worker Env bindings ---

export interface Env {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_KEY: string;

  // Google OAuth / Calendar / Sheets
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  IC_CALENDAR_ID: string;
  TRAINING_CALENDAR_ID: string; // Hybrid track ("Quatt Installatie Trainingen")
  ALLE_TRAINING_CALENDAR_ID?: string; // All-e track ("All-e Installatietraining"). Optional during rollout.

  // Email (Resend)
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  RESEND_OVERRIDE_TO?: string; // Stopgap: route every confirmation to this address with no bcc.

  // Slack
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL_ID: string;
  // Central sink for silent-failure alerts. Defaults to #wall-e-alerts
  // (C0B2E5S1XHD) when unset, so missing config never silences the alerts.
  SLACK_ALERT_CHANNEL_ID?: string;

  // Google Sheets
  IC_BOOKINGS_SHEET_ID: string;
  IC_AGREEMENTS_SHEET_ID: string;

  // HubSpot
  HUBSPOT_KENNISMAKING_FORM_ID: string;
  HUBSPOT_TRAINING_FORM_ID: string; // Hybrid track booked
  HUBSPOT_TRAINING_ATTENDED_FORM_ID: string; // Hybrid track attended
  // All-e track forms (clones of the Hybrid forms). Optional during rollout --
  // if unset, All-e bookings/attendance fall back to the Hybrid forms.
  HUBSPOT_TRAINING_ALLE_FORM_ID?: string;
  HUBSPOT_TRAINING_ALLE_ATTENDED_FORM_ID?: string;
  // Private-app token for direct CRM v3 contact-property writes. When set, the
  // portal PATCHes contacts directly instead of relying on the Forms API (whose
  // spam filter silently drops submissions). Unset = legacy Forms-only path.
  HUBSPOT_WRITE_TOKEN?: string;
  // Slack channel that receives a one-line audit for every direct CRM write.
  // Best-effort; unset = no audit line (write still happens).
  HUBSPOT_AUDIT_CHANNEL?: string;

  // Auth / tokens
  BOOKING_SECRET: string;
  BASE_URL: string;
  SESSION_SECRET: string;
  APP_NAME: string;
  ADMIN_TOKENS: string; // comma-separated list

  // Server-to-server secret used by the AM toolkit's "Reserveer training"
  // proxy when calling /api/internal/reserve-training. Set via
  // `wrangler secret put RESERVE_SECRET`. The endpoint refuses requests
  // when this is unset (fail closed).
  RESERVE_SECRET?: string;

  // Rate limiting (KV namespace; bound in wrangler.toml)
  RATE_LIMIT?: KVNamespace;

  // Signed partner agreements (D1). Replaces Supabase for the agreement flow.
  DB?: D1Database;

  // Signed partnerovereenkomst PDFs (R2).
  AGREEMENTS?: R2Bucket;

  // Wall-E OS bridge. When WALLEOS_URL + WALLEOS_WEBHOOK_SECRET are set,
  // every kennismaking/training booking also POSTs to Wall-E OS so the
  // platform sees milestones in real time alongside the existing HubSpot
  // Forms push. Non-blocking -- HubSpot stays the primary sink.
  WALLEOS_URL?: string;
  WALLEOS_WEBHOOK_SECRET?: string;
  // Service-token for walleos READ endpoints (functions/lib/walleos-pull.ts).
  // Scope: partners:read. When unset, the PULL gates fail-open (allow
  // action, log warning). Phase 5 of portal-sync.
  WALLEOS_SERVICE_TOKEN?: string;
}

// --- Booking domain types ---

export type BookingType = "training" | "intro_call" | "first_install";

export type BookingStatus =
  | "confirmed"
  | "pending_am_confirmation"
  | "reserved_unsigned" // AM-reserved before partnerovereenkomst signature
  | "cancelled"
  | "completed"
  | "no_show";

export type SessionStatus = "open" | "full" | "completed" | "cancelled";

/**
 * Training track. `hybrid` = existing Hybrid curriculum (Trainingen calendar).
 * `alle` = All-Electric curriculum (All-e Installatietraining calendar, since 2026-04-29).
 * `quatt_chill` is NOT stored in D1 -- /book/training/chill redirects to a HubSpot RSVP form.
 */
export type TrainingTrack = "hybrid" | "alle";

export interface TrainingSession {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  maxCapacity: number;
  currentBookings: number;
  calendarEventId: string | null;
  status: SessionStatus;
  track: TrainingTrack;
}

export interface Booking {
  id: string;
  type: BookingType;
  sessionId: string | null;
  partnerName: string;
  partnerEmail: string;
  partnerPhone: string | null;
  companyName: string;
  kvkNumber: string | null;
  preferredDate: string | null;
  preferredTimeSlot: string | null;
  notes: string | null;
  location: string | null;
  status: BookingStatus;
  calendarEventId: string | null;
  sheetRowId: string | null;
  assignedAm: string | null;
  hubspotDealId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  bookingId: string;
  attended: boolean;
  markedBy: string | null;
  markedAt: string | null;
  notes: string | null;
}

export interface SlotRule {
  id: string;
  type: string;
  capacityThreshold: number;
  defaultDayOfWeek: number | null;
  defaultStartTime: string | null;
  defaultDurationMinutes: number;
  defaultLocation: string | null;
  active: boolean;
}

// --- Calendar metadata ---

export interface CalendarEventMeta {
  type: string;
  partner: string;
  deal: string;
  am: string;
  source: "wall-e" | "booking-portal" | "manual";
  phone: string;
}

// --- AM configuration ---

export const AM_CONFIG = [
  {
    email: "ralph@quatt.io",
    name: "Ralph Peper",
    role: "Installatiepartnermanager",
  },
  {
    email: "mitchell.k@quatt.io",
    name: "Mitchell van Kleef",
    role: "Installatiepartnermanager",
  },
] as const;

/**
 * Internal team that must always be on a training event: the two AMs (Ralph,
 * Mitchell) and Rick. Plus the Quatt Lab learning-room resource so the room
 * is booked automatically. Used by the booking flow to ensure every training
 * event ships with this minimum attendee set, regardless of who created the
 * underlying GCal entry.
 */
export const TRAINING_CORE_ATTENDEES: ReadonlyArray<{
  email: string;
  displayName?: string;
  resource?: boolean;
}> = [
  { email: "ralph@quatt.io", displayName: "Ralph Peper" },
  { email: "mitchell.k@quatt.io", displayName: "Mitchell van Kleef" },
  { email: "rick@quatt.io", displayName: "Rick Hakkaart" },
  {
    email: "c_1883vm271ib7cg47n7ranf6tqf3oe@resource.calendar.google.com",
    displayName: "Quatt Lab-0-Learning Lab (25)",
    resource: true,
  },
];

// Calendar color IDs (Google Calendar v3)
export const IC_COLORS = {
  intro_call: "6", // Tangerine
  site_visit: "7", // Peacock
  first_install: "7", // Peacock
  training_followup: "10", // Basil
  followup: "9", // Blueberry
  diversion: "11", // Tomato
  quality_check: "8", // Graphite
} as const;
