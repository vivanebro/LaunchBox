import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const PRICES = {
  monthly: {
    id: 'price_1TNvccLfqSLJb7g2JMP3iPRB',
    label: 'Monthly',
    amount: '$29',
    period: 'per month',
    note: '7-day free trial',
  },
  yearly: {
    id: 'price_1TNveFLfqSLJb7g2kLkfKJAX',
    label: 'Yearly',
    amount: '$190',
    period: 'per year',
    note: '7-day free trial · best value',
  },
};

export default function Subscribe() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleSubscribe = async (priceKey) => {
    setError(null);
    setLoading(priceKey);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { price_id: PRICES[priceKey].id },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL returned');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setLoading(null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F5F7',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '880px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e6df240580e3bf55058574/655c15688_LaunchBoxlogo_E3copy.png"
            alt="LaunchBox"
            style={{ height: '48px', marginBottom: '24px' }}
          />
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px', color: '#111' }}>
            Choose your plan
          </h1>
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
            Start with 7 days free. Cancel anytime.
          </p>
        </div>

        {error && (
          <div style={{
            maxWidth: '560px',
            margin: '0 auto 24px',
            padding: '12px 16px',
            background: '#fff0f3',
            color: '#cc0033',
            borderRadius: '8px',
            border: '1px solid #ffd6de',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}>
          {Object.entries(PRICES).map(([key, plan]) => (
            <div key={key} style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                {plan.label}
              </div>
              <div style={{ fontSize: '44px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
                {plan.amount}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                {plan.period}
              </div>
              <button
                onClick={() => handleSubscribe(key)}
                disabled={loading !== null}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: 'none',
                  borderRadius: '10px',
                  background: loading === key ? '#666' : 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading !== null ? 'not-allowed' : 'pointer',
                  opacity: loading !== null && loading !== key ? 0.5 : 1,
                }}
              >
                {loading === key ? 'Redirecting…' : 'Start free trial'}
              </button>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '12px' }}>
                {plan.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
