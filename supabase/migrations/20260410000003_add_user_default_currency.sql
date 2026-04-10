-- Add default_currency preference to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS default_currency TEXT NOT NULL DEFAULT 'USD';
