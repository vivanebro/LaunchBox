-- Contracts feature: e-signature workflow
-- Creates four tables: contracts, contract_templates, signed_contracts, notifications
-- Note: Create a storage bucket named "contracts" in Supabase for PDF uploads

CREATE TABLE IF NOT EXISTS contracts (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                       TEXT NOT NULL,
  body                       TEXT,
  merge_field_definitions    JSONB NOT NULL DEFAULT '[]',
  logo_url                   TEXT,
  accent_color               TEXT NOT NULL DEFAULT '#ff0044',
  custom_confirmation_message TEXT,
  custom_button_label        TEXT,
  custom_button_link        TEXT,
  status                     TEXT NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'shared', 'signed')),
  shareable_link             TEXT UNIQUE,
  linked_package_id          UUID,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_owner_all" ON contracts
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "contracts_public_read_by_link" ON contracts
  FOR SELECT
  USING (shareable_link IS NOT NULL);

CREATE TABLE IF NOT EXISTS contract_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_templates_owner_all" ON contract_templates
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS signed_contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id       UUID REFERENCES contracts(id) ON DELETE CASCADE,
  client_name       TEXT NOT NULL,
  client_email      TEXT,
  signed_body       TEXT,
  signature_image   TEXT,
  signed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  client_ip         TEXT,
  pdf_url           TEXT,
  client_folder_id  UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE signed_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signed_contracts_public_insert" ON signed_contracts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "signed_contracts_owner_select" ON signed_contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = signed_contracts.contract_id
        AND c.created_by = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by            UUID NOT NULL,
  type                  TEXT NOT NULL,
  title                 TEXT,
  message               TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}',
  is_read               BOOLEAN NOT NULL DEFAULT false,
  is_viewed_celebration  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner_select" ON notifications
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "notifications_owner_update" ON notifications
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
