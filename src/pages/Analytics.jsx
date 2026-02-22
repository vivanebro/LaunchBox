import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Clock, MousePointerClick, Smartphone, Monitor, Tablet, TrendingUp, Package } from 'lucide-react';
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

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await supabaseClient.auth.me();
      const pkgs = await supabaseClient.entities.PackageConfig.filter({ created_by: currentUser.id }, '-created_date') || [];
      setPackages(pkgs);
      if (pkgs.length > 0) {
        const data = await fetchAnalyticsForPackages(pkgs.map(p => p.id));
        setAnalytics(data);
      }
    } catch (e) { console.error('Failed to load analytics', e); }
    setLoading(false);
  };

  const totalViews = Object.values(analytics).reduce((s, a) => s + (a.views || 0), 0);
  const totalClicks = Object.values(analytics).reduce((s, a) => s + (a.clicks || 0), 0);
  const avgTimeAll = Object.values(analytics).length > 0
    ? Math.round(Object.values(analytics).reduce((s, a) => s + (a.avgTime || 0), 0) / Object.values(analytics).length) : 0;
  const hotPackages = packages.filter(p => analytics[p.id] && isHot(analytics[p.id]?.lastViewed));
  const mostViewed = packages.reduce((best, p) => (analytics[p.id]?.views || 0) > (analytics[best?.id]?.views || 0) ? p : best, null);
  const weeklyTotal = Object.values(analytics).reduce((sum, a) => sum + (a.weeklyViews?.reduce((s, v) => s + v, 0) || 0), 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#ff0044] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Package Analytics</h1>
          <p className="text-gray-500 text-lg">See how your clients are engaging with your packages</p>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-gray-200">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No packages yet</h3>
            <p className="text-gray-500 mb-6">Create and share a package to start seeing analytics</p>
            <button onClick={() => window.location.href = createPageUrl('PackageBuilder')}
              className="px-6 py-3 rounded-full text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}>
              Create Package
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard icon={Eye} label="Total Views" value={totalViews} sub="All time" color="#ff0044" />
              <StatCard icon={MousePointerClick} label="Button Clicks" value={totalClicks} sub="Get Started clicks" color="#6366f1" />
              <StatCard icon={Clock} label="Total Time on Page" value={formatTime(Object.values(analytics).reduce((s,a) => s + (a.avgTime||0), 0))} sub="Across all packages" color="#f59e0b" />
              <StatCard icon={TrendingUp} label="Views This Week" value={weeklyTotal} sub={`${hotPackages.length} hot packages 🔥`} color="#10b981" />
            </div>

            {mostViewed && analytics[mostViewed.id]?.views > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-5 mb-8 flex items-center gap-4">
                <span className="text-3xl">🔥</span>
                <div>
                  <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Most Viewed Package</p>
                  <p className="text-lg font-bold text-gray-900">
                    {mostViewed.package_set_name || mostViewed.business_name || 'Untitled'}
                    <span className="ml-3 text-base font-normal text-gray-500">{analytics[mostViewed.id]?.views} views</span>
                  </p>
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Per Package</h2>
              {packages.map((pkg, idx) => {
                const a = analytics[pkg.id] || {};
                const hot = isHot(a.lastViewed) && a.views > 0;
                const neverViewed = !a.views || a.views === 0;
                return (
                  <motion.div key={pkg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: pkg.brand_color || '#ff0044' }} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 truncate">{pkg.package_set_name || pkg.business_name || 'Untitled Package'}</h3>
                            {hot && <span className="text-sm">🔥</span>}
                            {!hot && a.views > 0 && <span className="text-sm">😴</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">Last viewed: <span className="font-medium text-gray-600">{formatLastViewed(a.lastViewed)}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            <p className="text-xl font-bold text-gray-900">{a.views || 0}</p>
                            <p className="text-xs text-gray-400">Views</p>
                          </div>
                          {a.weeklyViews && a.views > 0 && <MiniSparkline data={a.weeklyViews} color={pkg.brand_color || '#ff0044'} />}
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">{formatTime(a.avgTime)}</p>
                          <p className="text-xs text-gray-400">Time spent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">{a.clicks || 0}</p>
                          <p className="text-xs text-gray-400">Clicks</p>
                        </div>
                        {a.views > 0 && (
                          <div className="flex items-center gap-2">
                            {a.deviceBreakdown?.mobile > 0 && <div className="flex items-center gap-1 text-xs text-gray-500"><Smartphone className="w-3.5 h-3.5" />{a.deviceBreakdown.mobile}</div>}
                            {a.deviceBreakdown?.desktop > 0 && <div className="flex items-center gap-1 text-xs text-gray-500"><Monitor className="w-3.5 h-3.5" />{a.deviceBreakdown.desktop}</div>}
                            {a.deviceBreakdown?.tablet > 0 && <div className="flex items-center gap-1 text-xs text-gray-500"><Tablet className="w-3.5 h-3.5" />{a.deviceBreakdown.tablet}</div>}
                          </div>
                        )}
                        {a.clicks > 0 && Object.keys(a.tierClicks || {}).length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {Object.entries(a.tierClicks).map(([tier, count]) => (
                              <span key={tier} className="px-2 py-0.5 rounded-full text-xs font-semibold text-white capitalize"
                                style={{ backgroundColor: pkg.brand_color || '#ff0044' }}>{a.tierLabels?.[tier] || tier}: {count}</span>
                            ))}
                          </div>
                        )}
                        {neverViewed && <span className="text-xs text-gray-400 italic">Not viewed yet</span>}
                      </div>
                    </div>
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
