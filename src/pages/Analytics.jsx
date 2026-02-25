import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, RefreshCw, MousePointerClick, Smartphone, Monitor, Tablet } from 'lucide-react';
import supabaseClient from '@/lib/supabaseClient';
import { fetchAnalyticsForPackages } from '@/lib/packageAnalytics';
import { createPageUrl } from '@/utils';

const formatTime = (seconds) => {
  if (!seconds || seconds === 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
};

const formatLastViewed = (dateStr) => {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const isHot = (lastViewed) => {
  if (!lastViewed) return false;
  return (new Date() - new Date(lastViewed)) < 7 * 24 * 60 * 60 * 1000;
};

const MiniSparkline = ({ data, color }) => {
  const max = Math.max(...data, 1);
  const width = 80, height = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      {data.map((v, i) => (
        <circle key={i} cx={(i / (data.length - 1)) * width} cy={height - (v / max) * height} r="2.5" fill={color} opacity={v > 0 ? 1 : 0} />
      ))}
    </svg>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
      <Icon className="w-6 h-6" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function Analytics() {
  const [packages, setPackages] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const currentUser = await supabaseClient.auth.me();
      const pkgs = await supabaseClient.entities.PackageConfig.filter(
        { created_by: currentUser.id }, '-created_date'
      ) || [];
      setPackages(pkgs);
      if (pkgs.length > 0) {
        const data = await fetchAnalyticsForPackages(pkgs.map(p => p.id));
        setAnalytics(data);
      }
      setLastRefreshed(new Date());
    } catch (e) { console.error('Failed to load analytics', e); }
    setLoading(false);
    setRefreshing(false);
  };

  const totalViews = Object.values(analytics).reduce((s, a) => s + (a.views || 0), 0);
  const totalClicks = Object.values(analytics).reduce((s, a) => s + (a.clicks || 0), 0);
  const weeklyViews = Object.values(analytics).reduce((sum, a) =>
    sum + (a.weeklyViews?.reduce((s, v) => s + v, 0) || 0), 0);
  const mostViewed = packages.reduce((best, p) =>
    (analytics[p.id]?.views || 0) > (analytics[best?.id]?.views || 0) ? p : best, null);
  const hotCount = packages.filter(p => {
    const a = analytics[p.id];
    if (!a?.lastViewed || !a?.views) return false;
    return (new Date() - new Date(a.lastViewed)) < 24 * 3600000;
  }).length;

  const getStatus = (lastViewed, views) => {
    if (!lastViewed || !views) return null;
    const hoursAgo = (new Date() - new Date(lastViewed)) / 3600000;
    const daysAgo = hoursAgo / 24;
    if (hoursAgo < 24) return '🔥';
    if (daysAgo < 3) return '👀';
    if (daysAgo < 7) return '😴';
    return '🧊';
  };

  const MiniSparkline = ({ data, color }) => {
    const max = Math.max(...data, 1);
    const width = 64, height = 24;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 4) - 2}`).join(' ');
    return (
      <svg width={width} height={height} className="overflow-visible opacity-70">
        <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    );
  };

  const AnimatedNumber = ({ value }) => {
    const [display, setDisplay] = React.useState(value || 0);
    const prevValue = React.useRef(value);

    React.useEffect(() => {
      if (prevValue.current === value) return;
      prevValue.current = value;
      const target = value || 0;
      let start = display;
      const step = Math.ceil(Math.abs(target - start) / 20);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setDisplay(target); clearInterval(timer); }
        else setDisplay(start);
      }, 30);
      return () => clearInterval(timer);
    }, [value]);

    return <>{display}</>;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: 3, borderStyle: 'solid', borderColor: '#ff0044', borderTopColor: 'transparent' }} />
        <p className="text-gray-500 text-sm">Loading analytics...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics</h1>
            <p className="text-gray-400 text-sm">
              {lastRefreshed ? `Updated ${(() => {
                const diffMs = new Date() - lastRefreshed;
                const diffMins = Math.floor(diffMs / 60000);
                if (diffMins < 1) return 'just now';
                return `${diffMins}m ago`;
              })()}` : ''}
            </p>
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} style={{ color: '#ff0044' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
            <p className="text-4xl mb-4">📦</p>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No packages yet</h3>
            <p className="text-gray-400 mb-6 text-sm">Create and share a package to start seeing analytics</p>
            <button onClick={() => window.location.href = createPageUrl('PackageBuilder')}
              className="px-6 py-2.5 rounded-full text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}>
              Create Package
            </button>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl p-8 mb-6 text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
            >
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
              <p className="text-white/70 text-sm font-medium mb-2 uppercase tracking-wider">This week</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-6xl font-bold leading-none mb-1"><AnimatedNumber value={weeklyViews} /></p>
                  <p className="text-white/80 text-lg">
                    {weeklyViews === 1 ? 'package view' : 'package views'}
                    {hotCount > 0 && <span className="ml-2">🔥 {hotCount} hot right now</span>}
                  </p>
                </div>
                {mostViewed && analytics[mostViewed.id]?.views > 0 && (
                  <div className="ml-auto text-right">
                    <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Top package</p>
                    <p className="text-white font-bold text-base truncate max-w-[160px]">
                      {mostViewed.package_set_name || mostViewed.business_name || 'Untitled'}
                    </p>
                    <p className="text-white/70 text-sm">{analytics[mostViewed.id]?.views} views</p>
                  </div>
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-400">Total views</p>
                </div>
                <p className="text-3xl font-bold text-gray-900"><AnimatedNumber value={totalViews} /></p>
                <p className="text-xs text-gray-400 mt-1">All time</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointerClick className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-400">Button clicks</p>
                </div>
                <p className="text-3xl font-bold text-gray-900"><AnimatedNumber value={totalClicks} /></p>
                <p className="text-xs text-gray-400 mt-1">Get Started clicks</p>
              </motion.div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">Per Package</h2>
              {packages.map((pkg, idx) => {
                const a = analytics[pkg.id] || {};
                const status = getStatus(a.lastViewed, a.views);
                const isExpanded = expandedId === pkg.id;
                const hasData = a.views > 0;
                return (
                  <motion.div key={pkg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div
                      className={`p-5 flex items-center gap-4 ${hasData ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                      onClick={() => hasData && setExpandedId(isExpanded ? null : pkg.id)}
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pkg.brand_color || '#ff0044' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate text-sm">
                            {pkg.package_set_name || pkg.business_name || 'Untitled Package'}
                          </h3>
                          {status && <span className="text-base">{status}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {hasData ? `Last viewed ${(() => {
                            const d = new Date(a.lastViewed), now = new Date();
                            const h = Math.floor((now - d) / 3600000);
                            const days = Math.floor(h / 24);
                            if (h < 1) return 'just now';
                            if (h < 24) return `${h}h ago`;
                            if (days === 1) return 'yesterday';
                            return `${days}d ago`;
                          })()}` : 'Not viewed yet'}
                        </p>
                      </div>
                      {hasData ? (
                        <div className="flex items-center gap-5">
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900 leading-none">{a.views}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Views</p>
                          </div>
                          {a.weeklyViews && <MiniSparkline data={a.weeklyViews} color={pkg.brand_color || '#ff0044'} />}
                          <div className="text-center">
                            <p className="text-lg font-bold text-gray-900 leading-none">{a.clicks || 0}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Clicks</p>
                          </div>
                          <div className="text-gray-300 text-sm">{isExpanded ? '▲' : '▼'}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">No data yet</span>
                      )}
                    </div>
                    <AnimatePresence>
                      {isExpanded && hasData && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                          <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                            <div className="grid grid-cols-3 gap-4 mt-4">
                              <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-gray-900">{formatTime(a.avgTime)}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Time spent</p>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-400 mb-2">Devices</p>
                                <div className="space-y-1">
                                  {(a.deviceBreakdown?.mobile || 0) > 0 && <div className="flex items-center gap-1.5 text-xs text-gray-600"><Smartphone className="w-3 h-3" /><span>{a.deviceBreakdown.mobile} mobile</span></div>}
                                  {(a.deviceBreakdown?.desktop || 0) > 0 && <div className="flex items-center gap-1.5 text-xs text-gray-600"><Monitor className="w-3 h-3" /><span>{a.deviceBreakdown.desktop} desktop</span></div>}
                                  {(a.deviceBreakdown?.tablet || 0) > 0 && <div className="flex items-center gap-1.5 text-xs text-gray-600"><Tablet className="w-3 h-3" /><span>{a.deviceBreakdown.tablet} tablet</span></div>}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-xs text-gray-400 mb-2">Clicked tiers</p>
                                {Object.keys(a.tierClicks || {}).length > 0 ? (
                                  <div className="space-y-1">
                                    {Object.entries(a.tierClicks).map(([tier, count]) => {
                                      const parts = tier.split('_');
                                      const mode = parts[parts.length - 1];
                                      const label = a.tierLabels?.[tier] || parts[0];
                                      const modeLabel = mode === 'onetime' ? 'One-Time' : 'Monthly';
                                      return (
                                        <div key={tier} className="flex items-center justify-between text-xs">
                                          <span className="text-gray-600">{label} <span className="text-gray-400">({modeLabel})</span></span>
                                          <span className="font-semibold text-gray-900">{count}x</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : <p className="text-xs text-gray-400 italic">No clicks yet</p>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
