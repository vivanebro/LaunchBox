-- Add expiration date to contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
