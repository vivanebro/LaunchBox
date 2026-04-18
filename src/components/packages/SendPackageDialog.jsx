import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { markPackageAsSent } from '@/lib/packageSend';

export function SendPackageDialog({ open, onClose, packageId, onMarked }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setSaving(false);
      setDone(false);
    }
  }, [open]);

  const handleMark = async () => {
    if (!packageId || saving) return;
    setSaving(true);
    try {
      await markPackageAsSent(packageId);
      setDone(true);
      onMarked && onMarked();
      setTimeout(() => {
        setSaving(false);
        setDone(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Failed to mark as sent', err);
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setDone(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 6 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-5">
              Link copied, send it to your client
            </p>
            <button
              type="button"
              onClick={handleMark}
              disabled={saving}
              className="w-full h-11 rounded-full font-semibold text-white shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {done ? 'Marked as sent' : 'Mark as sent'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Not yet
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
