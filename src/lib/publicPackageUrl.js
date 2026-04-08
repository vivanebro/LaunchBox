import supabaseClient from '@/lib/supabaseClient';

const FALLBACK_CREATOR = 'creator';
const FALLBACK_PACKAGE = 'package';

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'dashboard', 'login', 'logout', 'signup', 'signin',
  'settings', 'results', 'welcome', 'templates', 'analytics', 'help',
  'embed', 'p', 's', 'creator', 'package', 'user', 'users', 'quiz'
]);

export const slugify = (value, fallback) => {
  const normalized = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
};

/** Validate creator slug: 3–40 chars, lowercase alphanumeric + hyphens, not reserved */
export const validateCreatorSlug = (slug) => {
  if (!slug || typeof slug !== 'string') return { valid: false, error: 'Slug is required' };
  const s = slug.trim().toLowerCase();
  if (s.length < 3) return { valid: false, error: 'Slug must be at least 3 characters' };
  if (s.length > 40) return { valid: false, error: 'Slug must be 40 characters or less' };
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(s)) {
    return { valid: false, error: 'Use only letters, numbers, and hyphens (no spaces or special characters)' };
  }
  if (RESERVED_SLUGS.has(s)) return { valid: false, error: 'This slug is reserved' };
  return { valid: true };
};

/** Check if creator_slug is available (not used by any other user) */
export const isCreatorSlugAvailable = async (slug, excludeUserId = null) => {
  const normalized = slugify(slug, '');
  if (!normalized) return false;
  const existing = await supabaseClient.asServiceRole.entities.User.filter({ creator_slug: normalized });
  const takenByOther = (existing || []).filter((u) => u.id !== excludeUserId);
  return takenByOther.length === 0;
};

export const deriveCreatorSlug = (user) => {
  if (user?.creator_slug) return user.creator_slug;
  const source = user?.full_name || user?.email?.split('@')?.[0] || FALLBACK_CREATOR;
  return slugify(source, FALLBACK_CREATOR);
};

export const derivePackageSlug = (pkg) => {
  const source = pkg?.package_set_name || pkg?.business_name || FALLBACK_PACKAGE;
  return slugify(source, FALLBACK_PACKAGE);
};

const reserveUniqueSlug = async (creatorSlug, basePackageSlug, currentPackageId) => {
  const existingForCreator = await supabaseClient.asServiceRole.entities.PackageConfig.filter({ creator_slug: creatorSlug });
  const taken = new Set(
    (existingForCreator || [])
      .filter((item) => item.id !== currentPackageId)
      .map((item) => item.public_slug)
      .filter(Boolean)
  );

  if (!taken.has(basePackageSlug)) {
    return basePackageSlug;
  }

  let counter = 2;
  while (taken.has(`${basePackageSlug}-${counter}`)) {
    counter += 1;
  }
  return `${basePackageSlug}-${counter}`;
};

export const ensurePublicUrlFields = async (pkg, user) => {
  if (!pkg?.id) {
    throw new Error('Cannot generate public URL without package id.');
  }

  const creatorSlug = pkg.creator_slug || deriveCreatorSlug(user);
  const basePackageSlug = derivePackageSlug(pkg);
  const needsCreator = !pkg.creator_slug;
  const needsPackageSlug = !pkg.public_slug;

  if (!needsCreator && !needsPackageSlug) {
    return { creatorSlug: pkg.creator_slug, packageSlug: pkg.public_slug };
  }

  const uniquePackageSlug = await reserveUniqueSlug(creatorSlug, basePackageSlug, pkg.id);

  await supabaseClient.entities.PackageConfig.update(pkg.id, {
    creator_slug: creatorSlug,
    public_slug: uniquePackageSlug
  });

  return { creatorSlug, packageSlug: uniquePackageSlug };
};

export const getPublicPreviewPath = async (pkg, user) => {
  const { creatorSlug, packageSlug } = await ensurePublicUrlFields(pkg, user);
  return `/${creatorSlug}/${packageSlug}`;
};
