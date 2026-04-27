-- Hardens contracts RLS to fix three vulnerabilities:
--   1. Force-sign attack (signed_contracts insert with no link verification)
--   2. Public enumeration of all shared contracts
--   3. Expiry not enforced server-side
-- Also blocks duplicate signatures (latest-sig-wins replacement attack).

-- ============================================================
-- Fix #2: Replace open public-read policy with a SECURITY DEFINER RPC.
-- Anon clients must now look up a contract by passing the exact link.
-- They can no longer enumerate all shared contracts via SELECT.
-- ============================================================

DROP POLICY IF EXISTS "contracts_public_read_by_link" ON contracts;

CREATE OR REPLACE FUNCTION public.get_shared_contract(link text)
RETURNS SETOF contracts
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT *
  FROM contracts
  WHERE shareable_link = link
    AND shareable_link IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_contract(text) TO anon, authenticated;

-- ============================================================
-- Fix #1 + #3 + duplicate-signature attack:
-- Tighten signed_contracts INSERT so anon callers can only sign
-- contracts that are (a) actually shared, (b) not already signed,
-- (c) not expired.
-- ============================================================

DROP POLICY IF EXISTS "signed_contracts_public_insert" ON signed_contracts;

CREATE POLICY "signed_contracts_public_insert" ON signed_contracts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = signed_contracts.contract_id
        AND c.shareable_link IS NOT NULL
        AND c.status = 'shared'
        AND (c.expires_at IS NULL OR c.expires_at > now())
    )
    AND NOT EXISTS (
      SELECT 1 FROM signed_contracts sc
      WHERE sc.contract_id = signed_contracts.contract_id
    )
  );

-- ============================================================
-- Fix #4 (bonus): Make signed_contracts immutable.
-- No UPDATE or DELETE policy exists, but explicitly deny to be safe
-- against future service-role-bound code paths.
-- ============================================================

REVOKE UPDATE, DELETE ON signed_contracts FROM anon, authenticated;
