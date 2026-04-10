-- Add logo_height column to contracts and contract_templates
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS logo_height INTEGER DEFAULT 80;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS logo_height INTEGER DEFAULT 80;
