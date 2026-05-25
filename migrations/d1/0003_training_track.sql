-- Training track differentiation: hybrid (default, existing curriculum) | alle (new All-Electric track)
-- Quatt Chill is NOT stored here -- it lives in the existing HubSpot RSVP form and redirects from /book/training/chill.
-- Source-of-truth per track: the Google Calendar an event came from.
--   hybrid -> "Quatt Installatie Trainingen" (c_224a0d54...)
--   alle   -> "All-e Installatietraining"    (c_0582aba2...)

ALTER TABLE training_sessions ADD COLUMN track TEXT NOT NULL DEFAULT 'hybrid';
CREATE INDEX IF NOT EXISTS idx_training_sessions_track ON training_sessions(track);
