import { supabase, entities } from './supabaseClient';

export async function markPackageAsSent(pkgId) {
  if (!pkgId) return null;
  const { data, error } = await supabase
    .from('package_configs')
    .select('marked_sent_count')
    .eq('id', pkgId)
    .single();
  if (error) throw error;
  const next = (data?.marked_sent_count || 0) + 1;
  const updated = await entities.PackageConfig.update(pkgId, {
    marked_sent_count: next,
    last_marked_sent_at: new Date().toISOString(),
  });
  return updated;
}

