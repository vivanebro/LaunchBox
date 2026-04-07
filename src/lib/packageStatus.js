/**
 * Dynamic package engagement status (proposal mode).
 * Won/Lost are stored on package_configs; automatic statuses derive from views/clicks.
 */

export const STATUS_PRIORITY = {
  converted: 1,
  hot: 2,
  cooling: 3,
  cold: 4,
  no_views: 5,
  won: 6,
  lost: 7,
};

export const COLORS = {
  converted: '#0F6E56',
  hot: '#ff0044',
  cooling: '#BA7517',
  cold: null, // use --color-text-tertiary in UI
};

const CTA_TYPE_LABELS = {
  book_a_call: 'Book a Call',
  lock_your_spot: 'Lock Your Spot',
  sign_contract: 'Sign Contract',
  apply: 'Apply',
  custom: 'Custom',
};

const MS_DAY = 86400000;
const MS_HOUR = 3600000;
export const HOT_MS = 48 * MS_HOUR;
export const CONVERTED_MS = 14 * MS_DAY;
const COOLING_MIN_DAYS = 5;
const COLD_MIN_DAYS = 14;

/** Parse `starter_onetime` / `growth_retainer` from package_clicks.tier */
export function parseUniqueTierKey(tierKey) {
  if (!tierKey || typeof tierKey !== 'string') return { tier: 'starter', modeKey: 'onetime' };
  if (tierKey.endsWith('_retainer')) {
    return { tier: tierKey.slice(0, -'_retainer'.length), modeKey: 'retainer' };
  }
  if (tierKey.endsWith('_onetime')) {
    return { tier: tierKey.slice(0, -'_onetime'.length), modeKey: 'onetime' };
  }
  return { tier: tierKey, modeKey: 'onetime' };
}

/** Human CTA label for a tier from package config (Book a Call, Lock Your Spot, …). */
export function getCtaTypeLabelForTier(pkg, modeKey, tier) {
  const links = pkg?.button_links?.[modeKey] || {};
  const typeId = links[`${tier}_type`];
  if (typeId && CTA_TYPE_LABELS[typeId]) return CTA_TYPE_LABELS[typeId];
  const custom = links[`${tier}_label`];
  if (typeId === 'custom' && custom && String(custom).trim()) return String(custom).trim();
  return CTA_TYPE_LABELS[typeId] || 'CTA';
}

/** Tier display name */
export function getTierDisplayName(pkg, modeKey, tier) {
  const names = pkg?.package_names?.[modeKey] || pkg?.package_names?.onetime || pkg?.package_names?.retainer;
  if (names?.[tier]) return names[tier];
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * @param {object} params
 * @param {object|null} params.pkg - package row (for CTA labels)
 * @param {string|null} params.manualStatus - 'won' | 'lost' | null
 * @param {number} params.views
 * @param {string|null} params.lastViewedAt - ISO
 * @param {string|null} params.lastClickAt - ISO of most recent CTA click
 * @param {object|null} params.mostRecentClick - click row + tier key for label
 */
export function computeEngagementStatus({
  pkg,
  manualStatus,
  views,
  lastViewedAt,
  lastClickAt,
  mostRecentClick,
}) {
  if (manualStatus === 'won') {
    return {
      kind: 'won',
      dot: null,
      badge: 'won',
      priorityRank: STATUS_PRIORITY.won,
      attentionEligible: false,
    };
  }
  if (manualStatus === 'lost') {
    return {
      kind: 'lost',
      dot: null,
      badge: 'lost',
      priorityRank: STATUS_PRIORITY.lost,
      attentionEligible: false,
    };
  }

  const now = Date.now();
  const lastViewMs = lastViewedAt ? new Date(lastViewedAt).getTime() : null;
  const lastClickMs = lastClickAt ? new Date(lastClickAt).getTime() : null;

  const converted =
    lastClickMs != null && !Number.isNaN(lastClickMs) && now - lastClickMs <= CONVERTED_MS;

  if (converted) {
    const { tier, modeKey } = mostRecentClick
      ? parseUniqueTierKey(mostRecentClick.tier)
      : { tier: 'starter', modeKey: pkg?.pricingMode === 'retainer' ? 'retainer' : 'onetime' };
    const tierName =
      mostRecentClick?.tier_label ||
      getTierDisplayName(pkg, modeKey, tier);
    const ctaLabel = getCtaTypeLabelForTier(pkg, modeKey, tier);
    return {
      kind: 'converted',
      dot: 'converted',
      badge: null,
      priorityRank: STATUS_PRIORITY.converted,
      attentionEligible: true,
      ctaLabel,
      tierName,
    };
  }

  if (!views || views === 0 || lastViewMs == null || Number.isNaN(lastViewMs)) {
    return {
      kind: 'no_views',
      dot: 'no_views',
      badge: null,
      priorityRank: STATUS_PRIORITY.no_views,
      attentionEligible: false,
    };
  }

  const msSinceView = now - lastViewMs;
  const daysSinceView = msSinceView / MS_DAY;

  if (msSinceView <= HOT_MS) {
    return {
      kind: 'hot',
      dot: 'hot',
      badge: null,
      priorityRank: STATUS_PRIORITY.hot,
      attentionEligible: true,
      lastViewMs,
    };
  }

  if (daysSinceView >= COOLING_MIN_DAYS && daysSinceView < COLD_MIN_DAYS) {
    const daysNoView = Math.floor(daysSinceView);
    return {
      kind: 'cooling',
      dot: 'cooling',
      badge: null,
      priorityRank: STATUS_PRIORITY.cooling,
      attentionEligible: true,
      daysNoView,
    };
  }

  return {
    kind: 'cold',
    dot: 'cold',
    badge: null,
    priorityRank: STATUS_PRIORITY.cold,
    attentionEligible: false,
    lastViewMs,
  };
}

/** Sort key for My Packages: lower = higher priority */
export function getStatusSortRank(status) {
  const kind = status?.kind || 'cold';
  const order = {
    converted: 0,
    hot: 1,
    cooling: 2,
    cold: 3,
    no_views: 3,
    won: 4,
    lost: 5,
  };
  return order[kind] ?? 99;
}

export function formatRelativeTimeShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / MS_HOUR);
  const days = Math.floor(diffMs / MS_DAY);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

export function formatRelativeTimeNatural(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / MS_HOUR);
  const days = Math.floor(diffMs / MS_DAY);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${days} days ago`;
}

/** Hot card: "Hot 2 hours ago" style */
export function formatHotRelative(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const hours = Math.floor(diffMs / MS_HOUR);
  const days = Math.floor(diffMs / MS_DAY);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
