-- Full Cloudflare migration: bookings + training sessions + attendance now on D1.
-- Supabase tables stay in place (read-only archive, zero deletes per Rick's hard rule).
-- From this point forward every booking write goes to D1 only.

CREATE TABLE IF NOT EXISTS training_sessions (
  id TEXT PRIMARY KEY,                         -- uuid v4 (server-generated)
  title TEXT NOT NULL,
  date TEXT NOT NULL,                          -- YYYY-MM-DD
  start_time TEXT NOT NULL,                    -- HH:MM
  end_time TEXT NOT NULL,                      -- HH:MM
  location TEXT NOT NULL DEFAULT 'Quatt HQ, Amsterdam',
  max_capacity INTEGER NOT NULL DEFAULT 8,
  current_bookings INTEGER NOT NULL DEFAULT 0,
  calendar_event_id TEXT,                      -- Trainingen GCal event id; source of truth
  status TEXT NOT NULL DEFAULT 'open',         -- open | full | completed | cancelled
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_sessions_cal_event ON training_sessions(calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,                          -- training | intro_call | first_install
  session_id TEXT,                             -- FK training_sessions.id for type='training'
  partner_name TEXT NOT NULL,
  partner_email TEXT NOT NULL,
  partner_phone TEXT,
  company_name TEXT NOT NULL,
  kvk_number TEXT,
  preferred_date TEXT,                         -- YYYY-MM-DD or YYYY-Www (first_install)
  preferred_time_slot TEXT,                    -- morning | afternoon (site_visit)
  notes TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',    -- confirmed | pending_am_confirmation | cancelled | completed | no_show
  calendar_event_id TEXT,
  sheet_row_id TEXT,
  assigned_am TEXT,                            -- AM email
  hubspot_deal_id TEXT,
  meeting_format TEXT,                         -- showroom | online | site_visit (intro_call)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(type);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(partner_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  attended INTEGER,                            -- 0/1 (nullable until marked)
  marked_by TEXT,
  marked_at TEXT,
  notes TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_booking ON attendance(booking_id);
