-- Add show_excluded_deliverables, show_package_buttons_in_edit_mode, retainer_discount_text
-- These were missing from the schema, causing values to be stripped on save.
ALTER TABLE public.package_configs
  ADD COLUMN IF NOT EXISTS show_excluded_deliverables BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_package_buttons_in_edit_mode BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS retainer_discount_text TEXT DEFAULT '15% off one-time price';
