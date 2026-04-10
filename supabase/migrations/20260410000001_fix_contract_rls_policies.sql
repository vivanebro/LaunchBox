-- #5: Allow anonymous visitors to view signed contracts via shareable link
CREATE POLICY "signed_contracts_public_select_via_link" ON signed_contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = signed_contracts.contract_id
        AND c.shareable_link IS NOT NULL
    )
  );

-- #6: Tighten contract_views UPDATE — only allow updating recent rows (within 24h)
DROP POLICY IF EXISTS "contract_views_public_update" ON contract_views;

CREATE POLICY "contract_views_public_update_recent" ON contract_views
  FOR UPDATE
  USING (viewed_at > now() - interval '24 hours')
  WITH CHECK (viewed_at > now() - interval '24 hours');
