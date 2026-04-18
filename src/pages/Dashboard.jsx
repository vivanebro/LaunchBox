import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Plus, Send, Sparkles, Trophy, X as XIcon, MoreHorizontal, ChevronRight } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
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
import { SendPackageDialog } from '@/components/packages/SendPackageDialog';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
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

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [packages, setPackages] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [sendDialog, setSendDialog] = useState({ open: false, pkgId: null });

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

  const pipeline = useMemo(() => {
    const sent = packages.reduce((s, p) => s + (p.marked_sent_count || 0), 0);
    const viewed = Object.values(analytics).reduce((s, a) => s + (a.views || 0), 0);
    const clicked = Object.values(analytics).reduce((s, a) => s + (a.clicks || 0), 0);
    const won = packages.filter((p) => p.manual_status === 'won').length;
    const lost = packages.filter((p) => p.manual_status === 'lost').length;
    return { sent, viewed, clicked, won, lost };
  }, [packages, analytics]);

  const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : null);

  const activityRows = useMemo(() => {
    const rows = enriched.slice().sort((a, b) => b.activityMs - a.activityMs);
    return rows.slice(0, 5);
  }, [enriched]);

  const activityOverflow = packages.length > 5;

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
      try {
        await navigator.clipboard.writeText(baseUrl + previewPath);
      } catch (copyErr) {
        console.warn('Clipboard write failed, opening dialog anyway', copyErr);
      }
      setSendDialog({ open: true, pkgId: pkg.id });
    } catch (err) {
      console.error(err);
    }
  };

  const setPackageStatus = async (pkgId, status) => {
    const prevPackages = packages;
    setPackages((prev) =>
      prev.map((p) =>
        p.id === pkgId ? { ...p, manual_status: status, manual_status_updated_at: new Date().toISOString() } : p
      )
    );
    try {
      await supabaseClient.entities.PackageConfig.update(pkgId, {
        manual_status: status,
        manual_status_updated_at: new Date().toISOString(),
      });
      if (status === 'won') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } });
        const t = toast({ title: 'Deal closed! 🎉' });
        setTimeout(() => t.dismiss(), 2000);
      } else if (status === 'lost') {
        const t = toast({ title: 'Noted. On to the next one.' });
        setTimeout(() => t.dismiss(), 2000);
      } else {
        const t = toast({ title: 'Status cleared.' });
        setTimeout(() => t.dismiss(), 1500);
      }
    } catch (e) {
      console.error(e);
      setPackages(prevPackages);
      alert('Could not update status');
    }
  };

  const handleSendMarked = () => {
    setPackages((prev) =>
      prev.map((p) =>
        p.id === sendDialog.pkgId
          ? { ...p, marked_sent_count: (p.marked_sent_count || 0) + 1 }
          : p
      )
    );
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
        {/* Header — tight, charm not content */}
        <header className="flex items-center justify-between gap-4 mb-12">
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{greetingText}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <Button
            onClick={() => { window.location.href = createPageUrl('PackageBuilder'); }}
            className="rounded-full text-white px-5 h-10 font-semibold shadow-md shrink-0"
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

            {/* Pipeline */}
            {!zeroPackages && (
              <section className="mb-10">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pipeline</p>
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-1 md:gap-2">
                    {[
                      { label: 'Sent', value: pipeline.sent, conv: null },
                      { label: 'Viewed', value: pipeline.viewed, conv: pct(pipeline.viewed, pipeline.sent) },
                      { label: 'Clicked', value: pipeline.clicked, conv: pct(pipeline.clicked, pipeline.viewed) },
                      { label: 'Won', value: pipeline.won, conv: pct(pipeline.won, pipeline.clicked) },
                    ].map((step, i, arr) => (
                      <React.Fragment key={step.label}>
                        <div className="flex-1 text-center">
                          <p className="text-xs text-gray-500 mb-1">{step.label}</p>
                          <p className="text-2xl md:text-3xl font-bold text-gray-900 tabular-nums">{step.value}</p>
                        </div>
                        {i < arr.length - 1 && (
                          <div className="flex flex-col items-center shrink-0 w-10 md:w-14">
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                            <span className="text-[10px] md:text-xs text-gray-400 font-medium tabular-nums mt-0.5">
                              {arr[i + 1].conv !== null ? `${arr[i + 1].conv}%` : '—'}
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>Lost: <span className="font-semibold text-gray-700 tabular-nums">{pipeline.lost}</span></span>
                    {pipeline.sent === 0 && (
                      <span className="text-gray-400">Send a package to start your pipeline.</span>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Trend — flat */}
            <section className="mb-14">
              <div className="flex items-end justify-between mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Views, last 7 days</p>
                {showWeekCompare && (
                  <p className="text-xs text-gray-500">
                    Click rate <span className="font-semibold text-gray-900">{weekAgg.clickRate}%</span>
                  </p>
                )}
              </div>
              <div className="h-40">
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
            </section>

            {/* Activity — flat */}
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent activity</p>
              <div className="divide-y divide-gray-200/70">
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
                      className="flex items-center gap-3 py-4 px-1 hover:bg-white/60 rounded-xl cursor-pointer text-left transition-colors"
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
                          className="flex items-center gap-1 px-2 h-8 rounded-lg hover:bg-gray-100 text-gray-600"
                          aria-label="Send package"
                          title="Copy link and send to your client"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyShare(pkg);
                          }}
                        >
                          <Send className="w-4 h-4" />
                          <span className="text-xs font-semibold">Send</span>
                          {(pkg.marked_sent_count || 0) > 0 && (
                            <span className="text-[11px] font-semibold text-gray-500 tabular-nums">· {pkg.marked_sent_count}</span>
                          )}
                        </button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                              aria-label="Mark status"
                              title="Mark won or lost"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-1" align="end" onClick={(e) => e.stopPropagation()}>
                            {pkg.manual_status !== 'won' && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPackageStatus(pkg.id, 'won'); }}
                                className="flex items-center gap-2 w-full px-3 h-9 rounded-lg text-sm font-medium text-[#0F6E56] hover:bg-emerald-50"
                              >
                                <Trophy className="w-4 h-4" /> Mark as won
                              </button>
                            )}
                            {pkg.manual_status !== 'lost' && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPackageStatus(pkg.id, 'lost'); }}
                                className="flex items-center gap-2 w-full px-3 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                              >
                                <XIcon className="w-4 h-4" /> Mark as lost
                              </button>
                            )}
                            {(pkg.manual_status === 'won' || pkg.manual_status === 'lost') && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setPackageStatus(pkg.id, null); }}
                                className="flex items-center gap-2 w-full px-3 h-9 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100"
                              >
                                Clear status
                              </button>
                            )}
                          </PopoverContent>
                        </Popover>
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
      <SendPackageDialog
        open={sendDialog.open}
        packageId={sendDialog.pkgId}
        onClose={() => setSendDialog({ open: false, pkgId: null })}
        onMarked={handleSendMarked}
      />
    </div>
  );
}
