-- Contract analytics: track views and time spent for contract share links

CREATE TABLE IF NOT EXISTS contract_views (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  viewed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  device_type         TEXT,
  time_spent_seconds  INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contract_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_views_public_insert" ON contract_views
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contract_views_public_update" ON contract_views
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "contract_views_owner_select" ON contract_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM contracts c
      WHERE c.id = contract_views.contract_id
        AND c.created_by = auth.uid()
    )
  );

