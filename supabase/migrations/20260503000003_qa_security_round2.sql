-- QA round 2 security fixes (2026-05-03):
-- 1) Lock down is_admin from anon (defense in depth).
-- 2) Server-side capture of client IP on signed_contracts (browser
--    value is spoofable; this trigger overwrites it with the real
--    request IP from Supabase's edge headers).

-- ============================================================
-- 1) is_admin: revoke anon access. Function already returns false
--    for anon (auth.uid() is null), but no need to expose it.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ============================================================
-- 2) Server-side client IP for signed_contracts.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_signed_contract_ip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hdrs json;
  ip text;
BEGIN
  BEGIN
    hdrs := current_setting('request.headers', true)::json;
  EXCEPTION WHEN OTHERS THEN
    hdrs := NULL;
  END;
  IF hdrs IS NOT NULL THEN
    ip := COALESCE(hdrs->>'cf-connecting-ip', hdrs->>'x-real-ip', hdrs->>'x-forwarded-for');
    IF ip IS NOT NULL THEN
      ip := TRIM(SPLIT_PART(ip, ',', 1));
    END IF;
  END IF;
  NEW.client_ip := ip;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_signed_contract_ip ON public.signed_contracts;
CREATE TRIGGER set_signed_contract_ip
  BEFORE INSERT ON public.signed_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_signed_contract_ip();
