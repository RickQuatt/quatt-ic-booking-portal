-- Soft-delete column for the GDPR Art. 17 / 7-year-retention erasure pattern.
-- See docs: 03 - Resources/Agreement Erasure Runbook.md
-- A NULL value means the agreement is active. A non-NULL ISO 8601 string
-- means the partner exercised erasure or the row was archived. The
-- agreement_access_log + R2 object stay in place for the legal retention
-- window; only after that window is anything physically deleted.

ALTER TABLE signed_agreements ADD COLUMN deleted_at TEXT NULL;
CREATE INDEX IF NOT EXISTS idx_signed_agreements_active ON signed_agreements(deleted_at);
