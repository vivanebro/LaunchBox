import { supabase } from './supabaseClient';

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/Mobi|Android|iPhone|iPad/i.test(ua)) return 'mobile';
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  return 'desktop';
};

export const logPackageView = async (packageId) => {
  if (!packageId) return null;
  try {
    const { data, error } = await supabase
      .from('package_views')
      .insert([{ package_id: packageId, device_type: getDeviceType(), button_clicked: false, button_tier: null, time_spent_seconds: 0 }])
      .select().single();
    if (error) throw error;
    return data?.id || null;
  } catch (e) { console.error('Analytics: failed to log view', e); return null; }
};

export const updateTimeSpent = async (viewId, seconds) => {
  if (!viewId) return;
  try {
    await supabase.from('package_views').update({ time_spent_seconds: Math.round(seconds) }).eq('id', viewId);
  } catch (e) { console.error('Analytics: failed to update time spent', e); }
};

export const startTimeTracking = (viewId) => {
  if (!viewId) return;
  const startTime = Date.now();
  let lastSent = 0;

  const sendUpdate = () => {
    const seconds = Math.round((Date.now() - startTime) / 1000);
    if (seconds !== lastSent) {
      lastSent = seconds;
      updateTimeSpent(viewId, seconds);
    }
  };

  // Heartbeat every 30s
  const interval = setInterval(sendUpdate, 30000);

  // Also try on visibility change (tab switch, phone lock)
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') sendUpdate();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Cleanup
  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    sendUpdate(); // final send
  };
};

export const logButtonClick = async (viewId, tier, tierLabel, modeLabel, packageId) => {
  if (!viewId || !packageId) return;
  try {
    await supabase.from('package_clicks').insert([{
      package_id: packageId,
      view_id: viewId,
      tier,
      tier_label: tierLabel,
      pricing_mode_label: modeLabel
    }]);
  } catch (e) { console.error('Analytics: failed to log button click', e); }
};

export const fetchAnalyticsForPackages = async (packageIds) => {
  if (!packageIds || packageIds.length === 0) return {};
  try {
    const [viewsRes, clicksRes] = await Promise.all([
      supabase.from('package_views').select('*').in('package_id', packageIds).order('viewed_at', { ascending: false }),
      supabase.from('package_clicks').select('*').in('package_id', packageIds)
    ]);
    if (viewsRes.error) throw viewsRes.error;
    const views = viewsRes.data || [];
    const clicks = clicksRes.data || [];

    const result = {};
    for (const id of packageIds) {
      const pkgViews = views.filter(v => v.package_id === id);
      const pkgClicks = clicks.filter(c => c.package_id === id);
      const avgTime = pkgViews.length > 0
        ? Math.round(pkgViews.reduce((sum, v) => sum + (v.time_spent_seconds || 0), 0) / pkgViews.length)
        : 0;
      const now = new Date();
      const weeklyViews = Array(7).fill(0).map((_, i) => {
        const day = new Date(now); day.setDate(now.getDate() - (6 - i));
        const dayStr = day.toISOString().split('T')[0];
        return pkgViews.filter(v => v.viewed_at?.startsWith(dayStr)).length;
      });
      const tierClicks = {};
      const tierLabels = {};
      for (const click of pkgClicks) {
        const key = click.tier || 'unknown';
        tierClicks[key] = (tierClicks[key] || 0) + 1;
        if (click.tier_label) tierLabels[key] = click.tier_label;
      }
      const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0 };
      for (const v of pkgViews) { const d = v.device_type || 'desktop'; deviceBreakdown[d] = (deviceBreakdown[d] || 0) + 1; }

      result[id] = {
        views: pkgViews.length,
        avgTime,
        clicks: pkgClicks.length,
        lastViewed: pkgViews[0]?.viewed_at || null,
        tierClicks,
        tierLabels,
        deviceBreakdown,
        weeklyViews
      };
    }
    return result;
  } catch (e) { console.error('Analytics: failed to fetch analytics', e); return {}; }
};
