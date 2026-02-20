import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createPageUrl } from '@/utils';

export default function Welcome() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // If already logged in, go straight to Dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = createPageUrl('Dashboard');
      } else {
        setLoading(false);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = createPageUrl('Dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created! Check your email to confirm, then log in.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message);
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#F5F5F7'
      }}>
        <div style={{
          width: '48px', height: '48px', border: '4px solid #ff0044',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: '#F5F5F7',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%', maxWidth: '400px', padding: '40px',
        backgroundColor: 'white', borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e6df240580e3bf55058574/655c15688_LaunchBoxlogo_E3copy.png"
            alt="LaunchBox"
            style={{ height: '48px', objectFit: 'contain' }}
          />
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '22px', fontWeight: '700', color: '#111' }}>
          {mode === 'login' ? 'Sign in to LaunchBox' : 'Create your account'}
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '28px', fontSize: '14px' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }}
            style={{ color: '#ff0044', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: 0 }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>

        {error && (
          <div style={{
            padding: '12px', backgroundColor: '#fff0f3', borderRadius: '8px',
            color: '#cc0033', fontSize: '14px', marginBottom: '16px', border: '1px solid #ffd6de'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            padding: '12px', backgroundColor: '#f0fff4', borderRadius: '8px',
            color: '#15803d', fontSize: '14px', marginBottom: '16px', border: '1px solid #bbf7d0'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
                borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
                borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '12px', border: 'none', borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)',
              color: 'white', fontSize: '16px', fontWeight: '700',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1
            }}
          >
            {submitting ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}
