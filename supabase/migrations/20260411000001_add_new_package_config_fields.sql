-- Add new package_configs columns for session 2026-04-11

-- Editable section labels
ALTER TABLE public.package_configs
  ADD COLUMN IF NOT EXISTS deliverables_label TEXT,
  ADD COLUMN IF NOT EXISTS bonuses_label TEXT,
  ADD COLUMN IF NOT EXISTS show_bonuses BOOLEAN DEFAULT true;

-- Commitment discount feature
ALTER TABLE public.package_configs
  ADD COLUMN IF NOT EXISTS commitment_discount_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS commitment_discount_percent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commitment_discount_label TEXT,
  ADD COLUMN IF NOT EXISTS commitment_discount_prices JSONB DEFAULT '{}'::jsonb;

-- Update default labels from "monthly" to "ongoing"
ALTER TABLE public.package_configs
  ALTER COLUMN pricing_label_retainer SET DEFAULT 'ongoing',
  ALTER COLUMN pricing_button_label_retainer SET DEFAULT 'Ongoing';
