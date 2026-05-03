-- Backfill: handle_new_auth_user already exists in production but was never
-- written into the repo. Recording it here so the auto-claim logic is
-- discoverable and reproducible from a fresh DB rebuild.
--
-- Behavior: on auth.users INSERT, create the public.users row AND reassign
-- any package_configs / help_requests rows that have a matching email but
-- no owner yet. This is what makes Base44-migrated users see their old
-- packages immediately on signup.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, creator_slug, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'creator_slug'), ''), NULL),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Auto-claim legacy Base44 packages by email
  UPDATE public.package_configs
  SET created_by = NEW.id,
      created_by_email = NULL
  WHERE created_by IS NULL
    AND LOWER(created_by_email) = LOWER(NEW.email);

  -- Auto-claim legacy Base44 help requests by email
  UPDATE public.help_requests
  SET created_by = NEW.id,
      created_by_email = NULL
  WHERE created_by IS NULL
    AND LOWER(created_by_email) = LOWER(NEW.email);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
