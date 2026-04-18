import { supabase } from './supabaseClient';
import { startOfWeek, subWeeks } from 'date-fns';

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

  let activeSeconds = 0;
  let isActive = false;
  let activityTimeout = null;
  let countingInterval = null;

  const IDLE_THRESHOLD = 60000;

  const onActivity = () => {
    if (!isActive) {
      isActive = true;
    }
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
      isActive = false;
    }, IDLE_THRESHOLD);
  };

  countingInterval = setInterval(() => {
    if (isActive && document.visibilityState === 'visible') {
      activeSeconds += 1;
      if (activeSeconds % 30 === 0) {
        updateTimeSpent(viewId, activeSeconds);
      }
    }
  }, 1000);

  const events = ['mousemove', 'scroll', 'keydown', 'touchstart', 'click'];
  events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

  onActivity();

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      updateTimeSpent(viewId, activeSeconds);
      isActive = false;
    } else {
      onActivity();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    clearInterval(countingInterval);
    clearTimeout(activityTimeout);
    events.forEach(e => window.removeEventListener(e, onActivity));
    document.removeEventListener('visibilitychange', onVisibilityChange);
    updateTimeSpent(viewId, activeSeconds);
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
      pricing_mode_label: modeLabel,
    }]);
  } catch (e) { console.error('Analytics: failed to log button click', e); }
};

export const logAddonSelect = async (viewId, packageId, addonId, addonLabel, modeLabel) => {
  if (!viewId || !packageId || !addonId) return;
  try {
    await supabase.from('package_clicks').insert([{
      package_id: packageId,
      view_id: viewId,
      tier: 'addon',
      tier_label: null,
      pricing_mode_label: modeLabel,
      addon_id: addonId,
      addon_label: addonLabel,
    }]);
  } catch (e) { console.error('Analytics: failed to log addon select', e); }
};

export const logPricingModeSwitch = async (viewId, packageId, modeLabel) => {
  if (!viewId || !packageId) return;
  try {
    await supabase.from('package_clicks').insert([{
      package_id: packageId,
      view_id: viewId,
      tier: 'pricing_mode',
      tier_label: modeLabel,
      pricing_mode_label: modeLabel,
    }]);
  } catch (e) { console.error('Analytics: failed to log pricing mode switch', e); }
};

export const logCommitmentDiscountToggle = async (viewId, packageId, enabled, modeLabel) => {
  if (!viewId || !packageId) return;
  try {
    await supabase.from('package_clicks').insert([{
      package_id: packageId,
      view_id: viewId,
      tier: 'commitment_discount',
      tier_label: enabled ? 'enabled' : 'disabled',
      pricing_mode_label: modeLabel,
    }]);
  } catch (e) { console.error('Analytics: failed to log commitment discount toggle', e); }
};

function clickTimestamp(click, viewsById) {
  if (click?.created_at) return click.created_at;
  const v = viewsById.get(click.view_id);
  return v?.viewed_at || null;
}

function buildHistogram30(pkgViews, now = new Date()) {
  const arr = Array(30).fill(0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (const v of pkgViews) {
    if (!v.viewed_at) continue;
    const d = new Date(v.viewed_at);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today - dayStart) / 86400000);
    if (diffDays >= 0 && diffDays < 30) {
      arr[29 - diffDays] += 1;
    }
  }
  return arr;
}

function countInRange(rows, dateField, start, end) {
  let n = 0;
  const t0 = start.getTime();
  const t1 = end.getTime();
  for (const r of rows) {
    const t = r[dateField];
    if (!t) continue;
    const d = new Date(t).getTime();
    if (d >= t0 && d < t1) n += 1;
  }
  return n;
}

/**
 * Aggregate analytics for many packages (views + clicks).
 * Used by Dashboard, My Packages, and side panel.
 */
export const fetchAnalyticsForPackages = async (packageIds) => {
  if (!packageIds || packageIds.length === 0) return {};
  try {
    const [viewsRes, clicksRes] = await Promise.all([
      supabase.from('package_views').select('*').in('package_id', packageIds).order('viewed_at', { ascending: false }),
      supabase.from('package_clicks').select('*').in('package_id', packageIds),
    ]);
    if (viewsRes.error) throw viewsRes.error;
    if (clicksRes.error) throw clicksRes.error;
    const views = viewsRes.data || [];
    const clicks = clicksRes.data || [];

    const now = new Date();
    const startThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const startLastWeek = subWeeks(startThisWeek, 1);

    const viewsById = new Map(views.map((v) => [v.id, v]));

    const result = {};
    for (const id of packageIds) {
      const pkgViews = views.filter((v) => v.package_id === id);
      const pkgClicks = clicks.filter((c) => c.package_id === id);

      const sortedClicks = pkgClicks.slice().sort((a, b) => {
        const ta = new Date(clickTimestamp(a, viewsById) || 0).getTime();
        const tb = new Date(clickTimestamp(b, viewsById) || 0).getTime();
        return tb - ta;
      });

      const EVENT_TIERS = new Set(['addon', 'pricing_mode', 'commitment_discount']);
      const tierOnlyClicks = pkgClicks.filter((c) => !EVENT_TIERS.has(c.tier));
      const addonClicks = pkgClicks.filter((c) => c.tier === 'addon');
      const pricingModeClicks = pkgClicks.filter((c) => c.tier === 'pricing_mode');
      const commitmentClicks = pkgClicks.filter((c) => c.tier === 'commitment_discount');

      const sortedTierClicks = tierOnlyClicks.slice().sort((a, b) => {
        const ta = new Date(clickTimestamp(a, viewsById) || 0).getTime();
        const tb = new Date(clickTimestamp(b, viewsById) || 0).getTime();
        return tb - ta;
      });
      const mostRecentTierClick = sortedTierClicks[0] || sortedClicks[0] || null;
      const lastTierClickAt = mostRecentTierClick ? clickTimestamp(mostRecentTierClick, viewsById) : null;

      const addonBreakdown = {};
      for (const c of addonClicks) {
        if (!c.addon_id) continue;
        if (!addonBreakdown[c.addon_id]) {
          addonBreakdown[c.addon_id] = { id: c.addon_id, label: c.addon_label || c.addon_id, count: 0 };
        }
        addonBreakdown[c.addon_id].count += 1;
      }
      const addonsList = Object.values(addonBreakdown).sort((a, b) => b.count - a.count);

      const pricingModeCounts = {};
      for (const c of pricingModeClicks) {
        const k = c.tier_label || c.pricing_mode_label || 'unknown';
        pricingModeCounts[k] = (pricingModeCounts[k] || 0) + 1;
      }

      const commitmentCounts = { enabled: 0, disabled: 0 };
      for (const c of commitmentClicks) {
        const k = c.tier_label === 'enabled' ? 'enabled' : 'disabled';
        commitmentCounts[k] += 1;
      }

      const mostRecentClick = mostRecentTierClick;
      const lastClickAt = lastTierClickAt;

      const avgTime = pkgViews.length > 0
        ? Math.round(pkgViews.reduce((sum, v) => sum + (v.time_spent_seconds || 0), 0) / pkgViews.length)
        : 0;

      const weeklyViews = Array(7).fill(0).map((_, i) => {
        const day = new Date(now);
        day.setDate(now.getDate() - (6 - i));
        const dayStr = day.toISOString().split('T')[0];
        return pkgViews.filter((v) => v.viewed_at?.startsWith(dayStr)).length;
      });

      const last30DaysViews = buildHistogram30(pkgViews, now);

      const tierClicks = {};
      const tierLabels = {};
      for (const click of tierOnlyClicks) {
        const key = click.tier || 'unknown';
        tierClicks[key] = (tierClicks[key] || 0) + 1;
        if (click.tier_label) tierLabels[key] = click.tier_label;
      }

      const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0 };
      for (const v of pkgViews) {
        const d = v.device_type || 'desktop';
        deviceBreakdown[d] = (deviceBreakdown[d] || 0) + 1;
      }

      const viewsThisWeek = countInRange(pkgViews, 'viewed_at', startThisWeek, now);
      const viewsLastWeek = countInRange(pkgViews, 'viewed_at', startLastWeek, startThisWeek);

      const tierClicksWithTs = tierOnlyClicks.map((c) => ({
        ...c,
        _ts: clickTimestamp(c, viewsById),
      }));
      const clicksThisWeek = countInRange(tierClicksWithTs, '_ts', startThisWeek, now);
      const clicksLastWeek = countInRange(tierClicksWithTs, '_ts', startLastWeek, startThisWeek);

      const totalViewSeconds = pkgViews.reduce((s, v) => s + (v.time_spent_seconds || 0), 0);

      const clickRate = pkgViews.length > 0
        ? Math.round((tierOnlyClicks.length / pkgViews.length) * 1000) / 10
        : 0;

      result[id] = {
        views: pkgViews.length,
        avgTime,
        totalViewSeconds,
        clicks: tierOnlyClicks.length,
        lastViewed: pkgViews[0]?.viewed_at || null,
        lastClickAt,
        mostRecentClick,
        tierClicks,
        tierLabels,
        deviceBreakdown,
        weeklyViews,
        last30DaysViews,
        viewsThisWeek,
        viewsLastWeek,
        clicksThisWeek,
        clicksLastWeek,
        clickRate,
        addonsList,
        pricingModeCounts,
        commitmentCounts,
      };
    }
    return result;
  } catch (e) {
    console.error('Analytics: failed to fetch analytics', e);
    return {};
  }
};

/**
 * Dashboard-level aggregates across all packages.
 */
export function aggregateDashboardWeekMetrics(analyticsByPackageId) {
  const values = Object.values(analyticsByPackageId || {});
  let viewsThisWeek = 0;
  let viewsLastWeek = 0;
  let clicksThisWeek = 0;
  let clicksLastWeek = 0;
  for (const a of values) {
    viewsThisWeek += a.viewsThisWeek || 0;
    viewsLastWeek += a.viewsLastWeek || 0;
    clicksThisWeek += a.clicksThisWeek || 0;
    clicksLastWeek += a.clicksLastWeek || 0;
  }
  const clickRate =
    viewsThisWeek > 0
      ? Math.round((clicksThisWeek / viewsThisWeek) * 1000) / 10
      : 0;
  return {
    viewsThisWeek,
    viewsLastWeek,
    clicksThisWeek,
    clicksLastWeek,
    clickRate,
    hasLastWeekData: viewsLastWeek > 0 || clicksLastWeek > 0,
  };
}

/** Tier with most clicks (for activity badge) */
export function getDominantTierFromClicks(tierClicks, tierLabels) {
  const entries = Object.entries(tierClicks || {});
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [key, count] = entries[0];
  const second = entries[1]?.[1] || 0;
  if (entries.length === 1 && count >= 1) {
    return { tierKey: key, count, label: tierLabels?.[key] || key };
  }
  if (count >= 2 && count > second * 1.2) {
    return { tierKey: key, count, label: tierLabels?.[key] || key };
  }
  return null;
}
