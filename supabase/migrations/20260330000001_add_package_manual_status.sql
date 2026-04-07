-- Manual Won/Lost for proposal packages (dashboard attention exclusion)
ALTER TABLE public.package_configs
  ADD COLUMN IF NOT EXISTS manual_status TEXT CHECK (manual_status IS NULL OR manual_status IN ('won', 'lost')),
  ADD COLUMN IF NOT EXISTS manual_status_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.package_configs.manual_status IS 'User-set terminal state: won | lost; null = automatic engagement status';
COMMENT ON COLUMN public.package_configs.manual_status_updated_at IS 'When manual_status was last set or cleared';
