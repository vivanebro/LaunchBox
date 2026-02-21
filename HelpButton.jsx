import React, { useState, useEffect } from 'react';
import { MessageCircle, Calendar, MessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
// ✅ FIX: Import from supabaseClient instead of the old base44Client
import supabaseClient from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

export default function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setSending(true);
    try {
      // ✅ FIX: Use supabaseClient.entities instead of base44.entities
      await supabaseClient.entities.HelpRequest.create({ message: message.trim() });
      setSent(true);
      setTimeout(() => {
        setMessage('');
        setSent(false);
        setShowMessageForm(false);
        setIsOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
    setSending(false);
  };

  return (
    <>
      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulsing ring effect - only show if not interacted */}
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
          title="Need help? We're here for you!"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Help Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 z-50 overflow-hidden"
          >
            {!showMessageForm ? (
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-6">Choose how you'd like to reach us</p>
                
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
                    onClick={() => setShowMessageForm(true)}
                    variant="outline"
                    className="w-full h-14 border-2 border-gray-200 hover:border-[#0EA5E9] hover:bg-blue-50 font-semibold rounded-xl"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Leave a Comment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {sent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-sm text-gray-600">We'll get back to you today</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Leave a Comment</h3>
                      <button 
                        onClick={() => setShowMessageForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help you?"
                      className="mb-3 min-h-[100px]"
                      autoFocus
                    />
                    
                    <p className="text-xs text-gray-500 mb-4 text-center">
                      We'll get back to you within 24 hours
                    </p>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sending}
                      className="w-full h-12 text-white font-semibold rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}
                    >
                      {sending ? 'Sending...' : 'Send Message'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
