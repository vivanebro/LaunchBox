-- Extend get_shared_contract to also return the owner's display name,
-- so the public sign page can show "From: <Business>" for trust.

DROP FUNCTION IF EXISTS public.get_shared_contract(text);

CREATE OR REPLACE FUNCTION public.get_shared_contract(link text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT jsonb_build_object(
    'contract', to_jsonb(c.*),
    'owner_name', COALESCE(NULLIF(u.full_name, ''), u.email)
  )
  FROM contracts c
  LEFT JOIN public.users u ON u.id = c.created_by
  WHERE c.shareable_link = link
    AND c.shareable_link IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_contract(text) TO anon, authenticated;
