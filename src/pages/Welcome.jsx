import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

export default function Welcome() {
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        setStatus('Checking authentication...');
        
        // Use Promise.race with a timeout for robustness,
        // and ensure window.location.href assignment is within try-catch for Safari safety.
        const authCheckPromise = base44.auth.isAuthenticated();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout')), 10000)
        );
        
        const isAuthenticated = await Promise.race([authCheckPromise, timeoutPromise]);
        
        if (isAuthenticated) {
          setStatus('Redirecting to Dashboard...');
          try {
            window.location.href = createPageUrl('Dashboard');
          } catch (e) {
            console.error('Redirect to Dashboard failed:', e);
            setError('Failed to redirect to Dashboard.');
          }
        } else {
          setStatus('Redirecting to login...');
          try {
            base44.auth.redirectToLogin(createPageUrl('Dashboard'));
          } catch (e) {
            console.error('Redirect to Login failed:', e);
            setError('Failed to redirect to login page.');
          }
        }
      } catch (error) {
        console.error('Welcome page error during auth check:', error);
        setError(error.message || 'An unknown error occurred during initialization.');
        setStatus('Error occurred');
      }
    };

    handleRedirect();
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#F5F5F7',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          border: '4px solid #ff0044', 
          borderTopColor: 'transparent', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p style={{ color: '#666', marginBottom: '8px' }}>{status}</p>
        {error && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fee', 
            borderRadius: '8px',
            color: '#c00',
            fontSize: '14px'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}