-- Signed partner agreements (v2 flow, replaces Supabase bookings rows of type='agreement').
-- One row per signed Partnerovereenkomst. Source of truth for "has this partner signed?".
--
-- R2 holds the PDF artifact; HubSpot holds the workflow trigger; this table holds the audit record.

CREATE TABLE IF NOT EXISTS signed_agreements (
  id TEXT PRIMARY KEY,                         -- uuid v4 generated server-side
  created_at TEXT NOT NULL DEFAULT (datetime('now')),  -- UTC "YYYY-MM-DD HH:MM:SS"
  signed_at TEXT NOT NULL,                     -- ISO 8601 from the server at insert time
  signed_ip TEXT,                              -- CF-Connecting-IP header, audit trail

  -- Partner identity
  company_name TEXT NOT NULL,
  kvk_number TEXT NOT NULL,
  btw_number TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  city TEXT NOT NULL,

  -- Integration ids
  hubspot_deal_id TEXT,

  -- Agreement specifics
  agreement_version TEXT NOT NULL,             -- e.g. "2", matches AGREEMENT_VERSION constant
  agreement_html_snapshot TEXT NOT NULL,       -- exact HTML the partner saw, frozen at sign time
  pdf_r2_key TEXT,                             -- R2 object key; null means PDF generation failed

  -- Consent flags (captured for audit even though required server-side)
  accept_terms INTEGER NOT NULL DEFAULT 0,         -- boolean 0/1
  accept_distribution INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_signed_agreements_email ON signed_agreements(email);
CREATE INDEX IF NOT EXISTS idx_signed_agreements_deal ON signed_agreements(hubspot_deal_id);
CREATE INDEX IF NOT EXISTS idx_signed_agreements_signed_at ON signed_agreements(signed_at);
