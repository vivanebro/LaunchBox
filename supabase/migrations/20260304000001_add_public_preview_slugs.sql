ALTER TABLE public.package_configs
ADD COLUMN IF NOT EXISTS creator_slug TEXT,
ADD COLUMN IF NOT EXISTS public_slug TEXT;

CREATE INDEX IF NOT EXISTS idx_package_configs_creator_slug
ON public.package_configs(creator_slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_package_configs_creator_public_slug_unique
ON public.package_configs(creator_slug, public_slug)
WHERE creator_slug IS NOT NULL AND public_slug IS NOT NULL;
