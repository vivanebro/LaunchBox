-- Personal intro note shown above the contract on the sign page.
-- Warms the cold link. Optional, owner-set.

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS intro_message TEXT;
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS intro_message TEXT;
