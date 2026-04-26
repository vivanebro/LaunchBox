import React, { useState, useEffect } from 'react';
import { MessageCircle, Calendar, Instagram, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    const interacted = localStorage.getItem('helpButtonInteracted');
    if (interacted) setHasInteracted(true);
  }, []);

  const handleToggle = () => {
    if (!hasInteracted) {
      localStorage.setItem('helpButtonInteracted', 'true');
      setHasInteracted(true);
    }
    setIsOpen(!isOpen);
  };

  const handleBookCall = () => {
    window.open('https://api.leadconnectorhq.com/widget/booking/RnxvrnBT7Pgw4gaLonVa', '_blank');
    setIsOpen(false);
  };

  const handleInstagramDM = () => {
    window.open('https://ig.me/m/aviv_ben_or', '_blank');
    setIsOpen(false);
  };

  const handleCopyEmail = async () => {
    const email = 'aviv@launch-box.io';
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const ta = document.createElement('textarea');
        ta.value = email;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard copy failed:', e);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && !hasInteracted && (
          <div className="absolute inset-0 rounded-full animate-ping opacity-20"
               style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }} />
        )}

        <motion.button
          onClick={handleToggle}
          className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-3xl"
          style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={!isOpen && !hasInteracted ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          title="Need help? Talk to Aviv."
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get help fast</h3>
              <p className="text-sm text-gray-600 mb-6">Pick the fastest way to reach the founder.</p>

              <div className="space-y-3">
                <Button
                  onClick={handleBookCall}
                  className="w-full h-14 text-white font-semibold rounded-xl shadow-md hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule a Quick Call
                </Button>

                <Button
                  onClick={handleInstagramDM}
                  className="w-full h-14 text-white font-semibold rounded-xl shadow-md hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)' }}
                >
                  <Instagram className="w-5 h-5 mr-2" />
                  DM me on Instagram
                </Button>

              </div>

              <button
                onClick={handleCopyEmail}
                className="mt-4 w-full text-center text-xs text-gray-500 hover:text-gray-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                {emailCopied ? 'Email copied. Paste in Gmail.' : 'Or copy email: aviv@launch-box.io'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
