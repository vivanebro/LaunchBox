-- Standalone cost / budget calculator templates (reusable in package editor)

CREATE TABLE IF NOT EXISTS public.cost_calculator_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}',
  linked_package_id UUID REFERENCES public.package_configs(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cost_calculator_templates_created_by
  ON public.cost_calculator_templates (created_by);

ALTER TABLE public.cost_calculator_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cost_calculator_templates_owner_all" ON public.cost_calculator_templates
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
