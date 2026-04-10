-- Add consent_text column to contracts table
-- (Column already exists in production; this migration ensures repo consistency)
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS consent_text TEXT;
