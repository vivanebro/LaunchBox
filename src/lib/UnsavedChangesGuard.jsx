import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const getDarkerBrandColor = (color) => {
  if (!color || typeof color !== 'string' || !color.startsWith('#')) return '#cc0033';
  const hex = color.slice(1);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const f = 0.8;
  const dr = Math.floor(r * f);
  const dg = Math.floor(g * f);
  const db = Math.floor(b * f);
  return `#${(1 << 24 | dr << 16 | dg << 8 | db).toString(16).slice(1)}`;
};

export default function UnsavedChangesGuard({ isDirty, brandColor = '#ff0044' }) {
  const [pendingUrl, setPendingUrl] = useState(null);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!isDirtyRef.current) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target.closest('a[href]');
      if (!link) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;

      const nextUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.origin !== currentUrl.origin) return;
      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingUrl(nextUrl.toString());
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, []);

  const stay = () => setPendingUrl(null);
  const leave = () => {
    const url = pendingUrl;
    setPendingUrl(null);
    if (url) window.location.href = url;
  };

  const darker = getDarkerBrandColor(brandColor);

  return (
    <AnimatePresence>
      {pendingUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          onClick={stay}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Leave without saving?</h3>
              <p className="text-gray-600 leading-relaxed">
                You have unsaved changes. If you leave now, your work will be lost.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={leave}
                className="flex-1 h-12 rounded-2xl border-2 border-gray-300 hover:bg-gray-50 font-semibold text-gray-700"
              >
                Leave anyway
              </button>
              <button
                onClick={stay}
                className="flex-1 h-12 rounded-2xl text-white font-semibold"
                style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darker} 100%)` }}
              >
                Stay on page
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
