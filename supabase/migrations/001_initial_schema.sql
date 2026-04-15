-- IC Booking Portal: initial schema
-- Migrated from Vercel Postgres/Drizzle to Supabase

create extension if not exists "pgcrypto";

-- Training sessions (instructor-led sessions with limited capacity)
create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  location text default 'Quatt HQ, Amsterdam',
  max_capacity integer default 8,
  current_bookings integer default 0,
  calendar_event_id text,
  status text default 'open' check (status in ('open', 'full', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

-- Bookings (all types: training, intro_call, first_install, agreement)
create table bookings (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('training', 'intro_call', 'first_install', 'agreement')),
  session_id uuid references training_sessions(id),
  partner_name text not null,
  partner_email text not null,
  partner_phone text,
  company_name text not null,
  kvk_number text,
  preferred_date date,
  preferred_time_slot text,
  notes text,
  location text,
  status text default 'confirmed' check (status in ('confirmed', 'pending_am_confirmation', 'cancelled', 'completed', 'no_show')),
  calendar_event_id text,
  sheet_row_id text,
  assigned_am text,
  hubspot_deal_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Attendance tracking for training sessions
create table attendance (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  attended boolean,
  marked_by text,
  marked_at timestamptz,
  notes text
);

-- Slot rules for auto-creating training sessions
create table slot_rules (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  capacity_threshold real default 0.8,
  default_day_of_week integer,
  default_start_time time,
  default_duration_minutes integer default 120,
  default_location text,
  active boolean default true
);

-- Indexes for common queries
create index idx_bookings_type on bookings(type);
create index idx_bookings_status on bookings(status);
create index idx_bookings_session_id on bookings(session_id);
create index idx_bookings_partner_email on bookings(partner_email);
create index idx_bookings_created_at on bookings(created_at desc);
create index idx_training_sessions_status on training_sessions(status);
create index idx_training_sessions_date on training_sessions(date);
create index idx_attendance_booking_id on attendance(booking_id);
