import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { parseUniqueTierKey } from '@/lib/packageStatus';
import { cn } from '@/lib/utils';

const BRAND = '#ff0044';

function TierBarRow({ label, count, max, barColor }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span className="truncate pr-2">{label}</span>
        <span className="font-semibold text-gray-900 shrink-0">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

export function PackageAnalyticsPanel({ isOpen, onClose, pkg, analytics, isMobile }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!pkg || !analytics) return null;

  const a = analytics;
  const hasViews = (a.views || 0) > 0;
  const tierEntries = Object.entries(a.tierClicks || {});
  const maxClicks = Math.max(0, ...tierEntries.map(([, c]) => c), 1);
  const last30 = a.last30DaysViews || Array(30).fill(0);
  const maxDay = Math.max(1, ...last30);
  const brandColor = pkg.brand_color || BRAND;

  const totalDevices =
    (a.deviceBreakdown?.mobile || 0) +
    (a.deviceBreakdown?.tablet || 0) +
    (a.deviceBreakdown?.desktop || 0);
  const showDevices = hasViews && totalDevices > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close overlay"
            className="fixed inset-0 z-[60] bg-black/40 md:bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            data-analytics-panel
            role="dialog"
            aria-modal="true"
            initial={{ x: isMobile ? 0 : 40, opacity: 0.98 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isMobile ? 0 : 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              'fixed z-[70] bg-white shadow-2xl flex flex-col border-l border-gray-100',
              isMobile ? 'inset-0 max-w-none w-full' : 'top-0 right-0 bottom-0 w-full max-w-md'
            )}
          >
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 leading-tight pr-2">
                {pkg.package_set_name || pkg.business_name || 'Package'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total views', value: a.views ?? 0 },
                  { label: 'CTA clicks', value: a.clicks ?? 0 },
                  {
                    label: 'Avg. time spent',
                    value: a.avgTime < 60 ? `${a.avgTime || 0}s` : `${Math.floor((a.avgTime || 0) / 60)}m`,
                  },
                  { label: 'Click rate', value: `${a.clickRate ?? 0}%` },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-gray-100 p-4 bg-gray-50/80">
                    <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                    <p className="text-xl font-bold text-gray-900">{m.value}</p>
                  </div>
                ))}
              </div>

              {!hasViews && (
                <p className="text-sm text-gray-500 text-center py-6">
                  No views yet. Share this package to start tracking.
                </p>
              )}

              {hasViews && tierEntries.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tier engagement</p>
                  <div className="space-y-3">
                    {tierEntries
                      .sort((x, y) => y[1] - x[1])
                      .map(([tierKey, count]) => {
                        const { tier, modeKey } = parseUniqueTierKey(tierKey);
                        const modeLabel = modeKey === 'retainer' ? 'Ongoing' : 'One-Time';
                        const label = `${a.tierLabels?.[tierKey] || tier} (${modeLabel})`;
                        return (
                          <TierBarRow
                            key={tierKey}
                            label={label}
                            count={count}
                            max={maxClicks}
                            barColor={brandColor}
                          />
                        );
                      })}
                  </div>
                </div>
              )}

              {hasViews && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Views last 30 days</p>
                  <div className="flex items-end gap-px h-32 border-b border-gray-100 px-0.5">
                    {last30.map((v, i) => {
                      const pct = maxDay > 0 ? Math.max(8, (v / maxDay) * 100) : 8;
                      const tint = i >= 20 ? brandColor : `${brandColor}66`;
                      return (
                        <div key={i} className="flex-1 min-w-[2px] h-full flex flex-col justify-end">
                          <div
                            className="w-full rounded-t-[1px] transition-colors"
                            style={{
                              height: `${pct}%`,
                              minHeight: v > 0 ? 3 : 0,
                              backgroundColor: v > 0 ? tint : 'transparent',
                            }}
                            title={`${v} views`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                    <span>30d ago</span>
                    <span>Today</span>
                  </div>
                </div>
              )}

              {showDevices && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Devices</p>
                  <div className="text-sm text-gray-700 space-y-1">
                    {(a.deviceBreakdown?.mobile || 0) > 0 && (
                      <p>
                        Mobile {Math.round(((a.deviceBreakdown.mobile || 0) / totalDevices) * 100)}%
                      </p>
                    )}
                    {(a.deviceBreakdown?.desktop || 0) > 0 && (
                      <p>
                        Desktop {Math.round(((a.deviceBreakdown.desktop || 0) / totalDevices) * 100)}%
                      </p>
                    )}
                    {(a.deviceBreakdown?.tablet || 0) > 0 && (
                      <p>
                        Tablet {Math.round(((a.deviceBreakdown.tablet || 0) / totalDevices) * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
