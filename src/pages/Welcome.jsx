import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createPageUrl } from '@/utils';
import { slugify, validateCreatorSlug, isCreatorSlugAvailable } from '@/lib/publicPackageUrl';

export default function Welcome() {
  const initialMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('signup') === '1' ? 'signup' : 'login';
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatorSlug, setCreatorSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setMessage(null);
    setCreatorSlug('');
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${createPageUrl('Dashboard')}` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

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
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${createPageUrl('ResetPassword')}`,
        });
        if (error) throw error;
        setMessage('Check your email for a reset link.');
        setSubmitting(false);
        return;
      }

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = createPageUrl('Dashboard');
      } else {
        const normalized = slugify(creatorSlug, '');
        if (!normalized) {
          setError('Please choose a company name (e.g. your Company Name or brand)');
          setSubmitting(false);
          return;
        }
        const validation = validateCreatorSlug(normalized);
        if (!validation.valid) {
          setError(validation.error);
          setSubmitting(false);
          return;
        }
        const available = await isCreatorSlugAvailable(normalized);
        if (!available) {
          setError('This company name is already taken. Please choose another.');
          setSubmitting(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { creator_slug: normalized },
            emailRedirectTo: `${window.location.origin}${createPageUrl('Dashboard')}`,
          },
        });
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
          {mode === 'login' ? 'Sign in to LaunchBox' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '28px', fontSize: '14px' }}>
          {mode === 'forgot' ? (
            <>
              Enter your email and we'll send you a reset link.{' '}
              <button
                onClick={() => switchMode('login')}
                style={{ color: '#ff0044', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: 0 }}
              >
                Back to sign in
              </button>
            </>
          ) : (
            <>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                style={{ color: '#ff0044', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: 0 }}
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </>
          )}
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

        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              style={{
                width: '100%', padding: '11px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                background: 'white', color: '#374151', fontSize: '15px', fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                marginBottom: '16px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 16px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>
          </>
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

          {mode === 'signup' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                Company name
              </label>
              <input
                type="text"
                value={creatorSlug}
                onChange={(e) => setCreatorSlug(e.target.value)}
                placeholder="Your company name"
                style={{
                  width: '100%', padding: '10px 14px', border: '1.5px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '15px', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Your package links will be: https://launch-box.io/<strong>{creatorSlug ? slugify(creatorSlug, '') || 'your-company-name' : 'your-company-name'}</strong>/package-name
              </p>
            </div>
          )}

          {mode !== 'forgot' && (
            <div style={{ marginBottom: mode === 'login' ? '8px' : '24px' }}>
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
          )}

          {mode === 'login' && (
            <div style={{ marginBottom: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                style={{ color: '#ff0044', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>
          )}

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
            {submitting ? 'Please wait...' : (mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send reset link')}
          </button>

          {mode === 'signup' && (
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#6b7280', textAlign: 'center', lineHeight: '1.5' }}>
              By creating an account, you agree to our{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#ff0044', textDecoration: 'underline' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#ff0044', textDecoration: 'underline' }}>Privacy Policy</a>.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
