-- Template branding + post-signature settings (parity with contracts when using a template)
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS accent_color TEXT NOT NULL DEFAULT '#ff0044';
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS custom_confirmation_message TEXT;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS custom_button_label TEXT;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS custom_button_link TEXT;
