-- 0010_signed_agreement_match_log.sql
--
-- Idempotency + forensics table for the signed-agreement-matcher Worker.
-- The Worker only processes rows in signed_agreements that have NO entry
-- here, so each agreement is matched at most once per logical attempt.
--
-- match_source:
--   'auto'              -- Worker auto-linked a high-confidence IC-pipeline deal
--   'alerted'           -- low/medium confidence: Slack alert sent, AM must link
--   'alerted-no-match'  -- no plausible deals found; Slack alert sent
--   'manual'            -- reserved for future reply-to-fix flow
--
-- top_candidates_json is the JSON snapshot of the top 5 ranked candidates at
-- the time of the run, useful for debugging why a particular row was alerted.

CREATE TABLE IF NOT EXISTS signed_agreement_match_log (
  agreement_id TEXT PRIMARY KEY,
  matched_at TEXT NOT NULL,
  match_source TEXT NOT NULL,
  resolved_deal_id TEXT,
  top_candidates_json TEXT,
  score REAL,
  FOREIGN KEY (agreement_id) REFERENCES signed_agreements(id)
);

CREATE INDEX IF NOT EXISTS idx_match_log_matched_at
  ON signed_agreement_match_log(matched_at);
