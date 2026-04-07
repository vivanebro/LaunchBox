-- Add cost_data JSONB column for per-package cost calculator data
-- Structure: { onetime: { starter: {...}, growth: {...}, ... }, retainer: { ... } }
-- Each tier: { categories: [...], marginPercent: 30, hasOpened: boolean }
ALTER TABLE public.package_configs
ADD COLUMN IF NOT EXISTS cost_data JSONB DEFAULT '{}'::jsonb;
