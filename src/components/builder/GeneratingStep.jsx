import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GeneratingStep({ primaryColor, secondaryColor }) {
  const [stage, setStage] = useState(0);
  
  const messages = [
    'Analyzing your style...',
    'Creating unique designs...',
    'Generating color palettes...',
    'Finalizing layouts...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage(prev => (prev < messages.length - 1 ? prev + 1 : prev));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-2xl mx-auto text-center py-20 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ 
            background: `radial-gradient(circle, ${primaryColor || '#2563eb'} 0%, transparent 70%)` 
          }}
        />
      </div>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="relative w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${primaryColor || '#2563eb'} 0%, ${secondaryColor || '#3b82f6'} 100%)`
        }}
      >
        <Sparkles className="w-12 h-12 text-white animate-pulse" />
      </motion.div>

      <h2 className="text-4xl font-light mb-4 text-neutral-900">Generating Your Designs</h2>
      <p className="text-neutral-500 text-lg mb-12">Creating unique package presentations...</p>

      <div className="space-y-3 relative z-10">
        {messages.map((text, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: idx <= stage ? 1 : 0.3,
              x: 0 
            }}
            className="flex items-center gap-4 justify-center"
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: idx <= stage ? primaryColor || '#2563eb' : '#e5e5e5'
              }}
            />
            <span className={`text-base ${idx <= stage ? 'text-neutral-900 font-medium' : 'text-neutral-400'}`}>
              {text}
            </span>
            {idx === stage && <Loader2 className="w-4 h-4 animate-spin" style={{ color: primaryColor }} />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}