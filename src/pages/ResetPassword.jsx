import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createPageUrl } from '@/utils';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-sets the session from the recovery link hash.
    // We just confirm a session exists before showing the form.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else setError('This reset link is invalid or has expired. Request a new one.');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      window.location.href = createPageUrl('Dashboard');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e6df240580e3bf55058574/655c15688_LaunchBoxlogo_E3copy.png"
            alt="LaunchBox"
            style={{ height: '48px', objectFit: 'contain' }}
          />
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '22px', fontWeight: '700', color: '#111' }}>
          Set a new password
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '28px', fontSize: '14px' }}>
          Choose something at least 8 characters.
        </p>

        {error && (
          <div style={{
            padding: '12px', backgroundColor: '#fff0f3', borderRadius: '8px',
            color: '#cc0033', fontSize: '14px', marginBottom: '16px', border: '1px solid #ffd6de'
          }}>
            {error}
          </div>
        )}

        {ready && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                New password
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {submitting ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
