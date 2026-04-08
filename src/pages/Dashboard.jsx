import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Share2, Pencil, Sparkles } from 'lucide-react';
import { StatusDot, mapStatusToDotKind } from '@/components/packages/StatusDot';
import { createPageUrl } from '@/utils';
import supabaseClient from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { fetchAnalyticsForPackages, aggregateDashboardWeekMetrics, getDominantTierFromClicks } from '@/lib/packageAnalytics';
import {
  computeEngagementStatus,
  formatHotRelative,
  formatRelativeTimeNatural,
} from '@/lib/packageStatus';
import { getPublicPreviewPath } from '@/lib/publicPackageUrl';
import { toast } from '@/components/ui/use-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const GREETINGS = [
  "Who's about to close a deal? You are.",
  "Your clients aren't gonna price themselves. 😉",
  "Another day, another deal. Let's go, [NAME].",
  "[NAME], your packages missed you.",
  "Let's make someone say yes today.",
  "You didn't come here to play small.",
  "Deals don't close themselves, [NAME].",
  "Look who showed up ready to get paid. 🙃",
  "Hey handsome.",
  "Missed me? 😏",
  "Oh, it's you. The closer.",
  "Looking premium today, [NAME].",
  "Back so soon? Must be money time... LFG 🤑",
];

const COPY_TOASTS = [
  'Link copied. Go get \'em.',
  'Copied. Time to close.',
  'Link ready. Send it.',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatGreeting(template, firstName) {
  const name = firstName || 'there';
  return template.replace(/\[NAME\]/g, name);
}

function latestActivityMs(a) {
  const lv = a?.lastViewed ? new Date(a.lastViewed).getTime() : 0;
  const lc = a?.lastClickAt ? new Date(a.lastClickAt).getTime() : 0;
  return Math.max(lv, lc);
}

function pctDelta(current, previous) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function SectionSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 w-24 bg-gray-200 rounded" />
      <div className="h-24 bg-gray-100 rounded-2xl" />
    </div>
  );
}

const STATUS_CHART_COLORS = {
  won: '#0F6E56',
  lost: '#6B7280',
  converted: '#0F6E56',
  hot: '#ff0044',
  cooling: '#BA7517',
  cold: '#9CA3AF',
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(pick(GREETINGS));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentUser = await supabaseClient.auth.me();
      setUser(currentUser);
      const pkgs = await supabaseClient.entities.PackageConfig.filter(
        { created_by: currentUser.id },
        '-created_date'
      );
      setPackages(pkgs || []);
      if (pkgs?.length > 0) {
        const data = await fetchAnalyticsForPackages(pkgs.map((p) => p.id));
        setAnalytics(data);
      } else {
        setAnalytics({});
      }
    } catch (e) {
      console.error('Dashboard load error:', e);
      setError('Couldn\'t load your data. Try refreshing.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const firstName = user?.full_name?.split(' ')[0] || '';

  const enriched = useMemo(() => {
    return packages.map((pkg) => {
      const a = analytics[pkg.id] || {};
      const status = computeEngagementStatus({
        pkg,
        manualStatus: pkg.manual_status || null,
        views: a.views || 0,
        lastViewedAt: a.lastViewed || null,
        lastClickAt: a.lastClickAt || null,
        mostRecentClick: a.mostRecentClick || null,
      });
      return { pkg, a, status, activityMs: latestActivityMs(a) };
    });
  }, [packages, analytics]);

  const zeroPackages = packages.length === 0;
  const allZeroViews = packages.length > 0 && enriched.every((e) => (e.a.views || 0) === 0);

  const attentionCandidates = enriched.filter(
    (e) => e.status.attentionEligible && ['converted', 'hot', 'cooling'].includes(e.status.kind)
  );
  const attentionOrder = { converted: 0, hot: 1, cooling: 2 };
  attentionCandidates.sort((x, y) => {
    const ox = attentionOrder[x.status.kind] ?? 99;
    const oy = attentionOrder[y.status.kind] ?? 99;
    if (ox !== oy) return ox - oy;
    return y.activityMs - x.activityMs;
  });
  const attentionTotal = attentionCandidates.length;
  const attentionTop = attentionCandidates.slice(0, 3);
  const attentionOverflow = Math.max(0, attentionTotal - 3);

  const hasAttention = attentionTotal > 0;

  const weekAgg = aggregateDashboardWeekMetrics(analytics);
  const showWeekCompare = weekAgg.hasLastWeekData;

  const activityRows = useMemo(() => {
    const rows = enriched.slice().sort((a, b) => b.activityMs - a.activityMs);
    return rows.slice(0, 10);
  }, [enriched]);

  const activityOverflow = packages.length > 10;

  const trendData = useMemo(() => {
    const viewsSeries = Array(7).fill(0);
    Object.values(analytics).forEach((a) => {
      (a.weeklyViews || []).forEach((n, i) => {
        viewsSeries[i] += n || 0;
      });
    });

    // Build rolling day labels that match weeklyViews indexing:
    // index 0 = 6 days ago ... index 6 = today.
    return viewsSeries.map((views, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      return { label, views };
    });
  }, [analytics]);

  const statusMixData = useMemo(() => {
    const counts = { won: 0, lost: 0, converted: 0, hot: 0, cooling: 0, cold: 0 };
    enriched.forEach(({ status }) => {
      if (status.kind === 'won') counts.won += 1;
      else if (status.kind === 'lost') counts.lost += 1;
      else if (status.kind === 'converted') counts.converted += 1;
      else if (status.kind === 'hot') counts.hot += 1;
      else if (status.kind === 'cooling') counts.cooling += 1;
      else counts.cold += 1;
    });
    return [
      { name: 'Won', key: 'won', value: counts.won },
      { name: 'Lost', key: 'lost', value: counts.lost },
      { name: 'Clicked', key: 'converted', value: counts.converted },
      { name: 'Hot', key: 'hot', value: counts.hot },
      { name: 'Cooling', key: 'cooling', value: counts.cooling },
      { name: 'Cold', key: 'cold', value: counts.cold },
    ].filter((x) => x.value > 0);
  }, [enriched]);

  const subtitle = useMemo(() => {
    if (zeroPackages) return "Let's get your first package out the door.";
    if (allZeroViews) return 'Share a package link and watch what happens.';
    if (!hasAttention && packages.length > 0) return 'All quiet. Your packages are doing their thing.';
    return "Here's what's happening with your packages";
  }, [zeroPackages, allZeroViews, hasAttention, packages.length]);

  const handleOpenResults = (pkgId) => {
    window.location.href = `${createPageUrl('Results')}?packageId=${pkgId}`;
  };

  const handleCopyShare = async (pkg) => {
    try {
      const baseUrl = window.location.origin;
      const previewPath = await getPublicPreviewPath(pkg, user);
      await navigator.clipboard.writeText(baseUrl + previewPath);
      const t = toast({ title: pick(COPY_TOASTS) });
      setTimeout(() => t.dismiss(), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const greetingText = formatGreeting(greeting, firstName);

  if (zeroPackages && !loading) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="max-w-3xl mx-auto pt-8">
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{greetingText}</h1>
            <p className="text-gray-600">{subtitle}</p>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => { window.location.href = createPageUrl('PackageBuilder'); }}
                className="rounded-full text-white px-6 h-11 font-semibold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                New package
              </Button>
            </div>
          </header>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-10 shadow-lg border border-gray-100 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Build your first package</h2>
            <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
              Create a pricing package, send it to a client, and see how they engage with it. All your activity will show up right here.
            </p>
            <Button
              onClick={() => { window.location.href = createPageUrl('PackageBuilder'); }}
              size="lg"
              className="rounded-full text-white px-8 h-12 font-semibold"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              New package
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header — always immediate */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{greetingText}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          <Button
            onClick={() => { window.location.href = createPageUrl('PackageBuilder'); }}
            className="rounded-full text-white px-6 h-11 font-semibold shadow-md shrink-0 self-start"
            style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            New package
          </Button>
        </header>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading && !error && (
          <div className="space-y-10">
            <SectionSkeleton />
            <SectionSkeleton />
            <SectionSkeleton />
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Attention */}
            {hasAttention && (
              <section className="mb-10">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Needs your attention</p>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                  {attentionTop.map(({ pkg, a, status }) => {
                    const name = pkg.package_set_name || pkg.business_name || 'Untitled';
                    const views = a.views || 0;
                    const avgMin = a.avgTime ? Math.max(1, Math.round(a.avgTime / 60)) : 0;
                    let topLine = '';
                    let oneLiner = '';
                    if (status.kind === 'converted') {
                      topLine = `Clicked ${status.ctaLabel} ${status.tierName}`;
                      oneLiner = 'They picked a tier. Ball\'s in your court.';
                    } else if (status.kind === 'hot') {
                      topLine = `Hot ${formatHotRelative(a.lastViewed)}`;
                      oneLiner = `${views} views, ${avgMin} min reading. They're interested.`;
                    } else if (status.kind === 'cooling') {
                      const x = status.daysNoView ?? Math.floor((Date.now() - new Date(a.lastViewed).getTime()) / 86400000);
                      topLine = `Cooling ${x} days, no views`;
                      oneLiner = 'Might be worth a follow-up.';
                    }
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => handleOpenResults(pkg.id)}
                        className="min-w-[280px] max-w-[320px] flex-shrink-0 text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-[#ff0044]/40 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {status.kind === 'converted' && <StatusDot kind="converted" />}
                          {status.kind === 'hot' && <StatusDot kind="hot" />}
                          {status.kind === 'cooling' && <StatusDot kind="cooling" />}
                          <span className="text-xs font-medium text-gray-600">{topLine}</span>
                        </div>
                        <p className="font-bold text-gray-900 mb-2 truncate">{name}</p>
                        <p className="text-sm text-gray-500 leading-snug">{oneLiner}</p>
                      </button>
                    );
                  })}
                </div>
                {attentionOverflow > 0 && (
                  <button
                    type="button"
                    onClick={() => { window.location.href = createPageUrl('MyPackages'); }}
                    className="mt-3 text-sm font-medium text-[#ff0044] hover:underline"
                  >
                    {attentionOverflow} more packages need attention
                  </button>
                )}
              </section>
            )}

            {/* Metrics */}
            <section className="mb-10">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">This week</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Views',
                    value: weekAgg.viewsThisWeek,
                    prev: weekAgg.viewsLastWeek,
                  },
                  {
                    label: 'CTA clicks',
                    value: weekAgg.clicksThisWeek,
                    prev: weekAgg.clicksLastWeek,
                  },
                  {
                    label: 'Click rate',
                    value: `${weekAgg.clickRate}%`,
                    sub: 'Views that led to a click',
                    noCompare: true,
                  },
                ].map((m) => {
                  const delta = !m.noCompare && showWeekCompare ? pctDelta(m.value, m.prev) : null;
                  return (
                    <div key={m.label} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <p className="text-sm text-gray-500 mb-1">{m.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{m.value}</p>
                      {m.sub && <p className="text-xs text-gray-400 mt-1">{m.sub}</p>}
                      {!m.noCompare && showWeekCompare && delta !== null && (
                        <>
                          <p className={`text-sm font-semibold mt-2 ${delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {delta >= 0 ? '+' : ''}{delta}%
                          </p>
                          <p className="text-xs text-gray-400">vs {m.prev} last week</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Views trend</p>
                  <p className="text-xs text-gray-400 mb-3">Last 7 days</p>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff0044" stopOpacity={0.32} />
                            <stop offset="100%" stopColor="#ff0044" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                        <RechartsTooltip
                          cursor={{ stroke: '#fecdd3', strokeWidth: 1 }}
                          contentStyle={{ borderRadius: 12, border: '1px solid #fee2e2' }}
                        />
                        <Area type="monotone" dataKey="views" stroke="#ff0044" strokeWidth={2.5} fill="url(#viewsGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Status mix</p>
                  <p className="text-xs text-gray-400 mb-3">All active packages</p>
                  <div className="h-44 flex items-center justify-center">
                    {statusMixData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusMixData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={42}
                            outerRadius={66}
                            paddingAngle={2}
                            strokeWidth={0}
                          >
                            {statusMixData.map((entry) => (
                              <Cell key={entry.key} fill={STATUS_CHART_COLORS[entry.key]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-gray-400">No status data yet</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
                    {statusMixData.map((entry) => (
                      <span key={entry.key} className="inline-flex items-center gap-1.5 text-gray-600">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: STATUS_CHART_COLORS[entry.key] }}
                        />
                        {entry.name} ({entry.value})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Activity */}
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent activity</p>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {activityRows.map(({ pkg, a, status }) => {
                  const name = pkg.package_set_name || pkg.business_name || 'Untitled';
                  const dom = getDominantTierFromClicks(a.tierClicks, a.tierLabels);
                  const showGreenBadge = status.kind === 'converted';
                  const showAmberBadge = !showGreenBadge && dom && a.views > 0;
                  const dotKind = mapStatusToDotKind(status);

                  return (
                    <div
                      key={pkg.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleOpenResults(pkg.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleOpenResults(pkg.id)}
                      className="flex items-center gap-3 p-4 hover:bg-gray-50/80 cursor-pointer text-left"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {status.kind === 'won' && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F6E56] border border-emerald-100 shrink-0">Won</span>
                        )}
                        {status.kind === 'lost' && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 shrink-0">Lost</span>
                        )}
                        {status.kind !== 'won' && status.kind !== 'lost' && dotKind && <StatusDot kind={dotKind} />}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-gray-900 truncate">{name}</span>
                            {showGreenBadge && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-[#0F6E56]">
                                Clicked {status.ctaLabel}
                              </span>
                            )}
                            {showAmberBadge && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                                {dom.label} most viewed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {(a.views || 0) === 0 ? 'No views yet' : formatRelativeTimeNatural(a.lastViewed)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-gray-700 tabular-nums">{a.views || 0}</span>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                          aria-label="Copy share link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyShare(pkg);
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                          aria-label="Edit package"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenResults(pkg.id);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {activityOverflow && (
                <button
                  type="button"
                  onClick={() => { window.location.href = createPageUrl('MyPackages'); }}
                  className="mt-4 text-sm font-medium text-[#ff0044] hover:underline"
                >
                  See all packages
                </button>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
