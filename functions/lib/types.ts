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
  TRAINING_CALENDAR_ID: string;

  // Email (Resend)
  RESEND_API_KEY: string;
  EMAIL_FROM: string;

  // Slack
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL_ID: string;

  // Google Sheets
  IC_BOOKINGS_SHEET_ID: string;
  IC_AGREEMENTS_SHEET_ID: string;

  // HubSpot
  HUBSPOT_KENNISMAKING_FORM_ID: string;
  HUBSPOT_TRAINING_FORM_ID: string;
  HUBSPOT_TRAINING_ATTENDED_FORM_ID: string;

  // Auth / tokens
  BOOKING_SECRET: string;
  BASE_URL: string;
  SESSION_SECRET: string;
  APP_NAME: string;
  ADMIN_TOKENS: string; // comma-separated list

  // Rate limiting (KV namespace; bound in wrangler.toml)
  RATE_LIMIT?: KVNamespace;
}

// --- Booking domain types ---

export type BookingType = "training" | "intro_call" | "first_install";

export type BookingStatus =
  | "confirmed"
  | "pending_am_confirmation"
  | "cancelled"
  | "completed"
  | "no_show";

export type SessionStatus = "open" | "full" | "completed" | "cancelled";

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
