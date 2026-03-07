-- Add creator_slug to users table (unique URL handle)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS creator_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_creator_slug_unique
ON public.users(creator_slug)
WHERE creator_slug IS NOT NULL AND creator_slug != '';

-- Trigger: create public.users row when new auth user signs up (with creator_slug from metadata)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
