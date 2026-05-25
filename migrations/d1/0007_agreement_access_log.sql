-- Audit log for /api/agreements/[id]/pdf downloads.
-- Closes the legal-readiness gap: previously we knew when a partner SIGNED
-- an agreement but had no record of when (or by whom) the signed PDF was
-- subsequently downloaded. One row per fetch.

CREATE TABLE IF NOT EXISTS agreement_access_log (
  id           TEXT PRIMARY KEY,                -- uuid v4 (server-generated)
  agreement_id TEXT NOT NULL,                   -- FK signed_agreements.id
  accessed_at  TEXT NOT NULL DEFAULT (datetime('now')),
  accessed_ip  TEXT,                            -- CF-Connecting-IP
  user_agent   TEXT,                            -- truncated to 256 chars
  referer      TEXT                             -- truncated to 256 chars
);

CREATE INDEX IF NOT EXISTS idx_access_log_agreement ON agreement_access_log(agreement_id);
CREATE INDEX IF NOT EXISTS idx_access_log_when ON agreement_access_log(accessed_at);
