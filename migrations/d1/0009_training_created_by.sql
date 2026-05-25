-- Track which AM created a training session via the AM Toolkit "Create training" flow.
-- NULL for sessions created via /api/admin/sessions (admin, rare), synced from GCal
-- by /api/admin/sessions/sync (sync worker), or pre-dating this column.

ALTER TABLE training_sessions ADD COLUMN created_by_email TEXT;
