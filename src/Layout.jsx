import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Settings, ChevronDown, ChevronRight, LayoutTemplate, Package, Plus, MessageSquare, BarChart2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabaseClient';
import HelpButton from '@/components/HelpButton';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Layout Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ color: '#ff0044', marginBottom: '20px' }}>Something went wrong!</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            We've encountered an unexpected error. Please refresh the page.
          </p>
          {this.state.error && (
            <p style={{ color: '#999', fontSize: '0.8em', marginBottom: '20px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              Error: {this.state.error.message || String(this.state.error)}
            </p>
          )}
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '12px 24px', 
              background: '#ff0044', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function Layout({ children, currentPageName }) {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [packageBuilderExpanded, setPackageBuilderExpanded] = React.useState(false);
  const [isMobileView, setIsMobileView] = React.useState(false);
  const [brandColor] = React.useState('#ff0044');
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);
  const [authError, setAuthError] = React.useState(null);
  
  const isWelcome = currentPageName === 'Welcome';
  
  // Use React.useMemo for URL parsing - native URLSearchParams is widely supported.
  const isPreview = React.useMemo(() => {
    try {
      if (typeof window === 'undefined') return false;
      const url = new URL(window.location.href);
      return url.searchParams.get('preview') === 'true';
    } catch (e) {
      console.warn('URL search param parsing failed:', e);
      return false; // Default to not preview on error
    }
  }, []);
  
  const isResultsPage = currentPageName === 'Results';
  
  React.useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const isPublicAccessAllowed = isWelcome || (isResultsPage && isPreview);

      if (isPublicAccessAllowed) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          window.location.href = createPageUrl('Welcome');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Don't redirect on network errors - just show the page
      }
      setIsCheckingAuth(false);
    };

    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        setIsAdmin(user?.role === 'admin');
      } catch (error) {
        console.warn('Layout: Admin check failed:', error);
        setIsAdmin(false);
      }
    };

    checkAuthAndRedirect().then(() => {
      checkAdmin();
    });
    
    const checkMobile = () => {
      try {
        setIsMobileView(window.innerWidth < 768);
      } catch (e) {
        console.warn('Mobile check failed:', e);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Auto-expand menu items
    if (['PackageBuilder', 'Templates', 'MyPackages'].includes(currentPageName)) {
      setPackageBuilderExpanded(true);
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, [currentPageName, isPreview, isWelcome, isResultsPage]);
  
  const getDarkerBrandColor = (color) => {
    if (!color || typeof color !== 'string' || !color.startsWith('#')) return '#cc0033';
    try {
      const hex = color.slice(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      const darkenFactor = 0.8;
      const dr = Math.floor(r * darkenFactor);
      const dg = Math.floor(g * darkenFactor);
      const db = Math.floor(b * darkenFactor);

      return `#${(1 << 24 | dr << 16 | dg << 8 | db).toString(16).slice(1)}`;
    } catch (e) {
      return '#cc0033';
    }
  };

  const darkerBrandColor = getDarkerBrandColor(brandColor);

  // Don't show layout for welcome or preview
  if (isWelcome || (isResultsPage && isPreview)) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  // Show loading
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff0044] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="text-center bg-white rounded-3xl p-8 shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#ff0044] text-white rounded-full font-semibold hover:bg-[#cc0033] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show mobile message
  if (isMobileView) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-sm mx-auto border-2 border-gray-200 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mobile Not Supported</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            LaunchBox is optimized for desktop use. Please switch to a laptop or desktop computer for the best experience.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Desktop Required</span>
          </div>
        </div>
      </div>
    );
  }

  // Main layout
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex" style={{ backgroundColor: '#F5F5F7' }}>
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6">
            <Link to={createPageUrl('Dashboard')} className="flex items-center relative">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e6df240580e3bf55058574/655c15688_LaunchBoxlogo_E3copy.png"
                alt="LaunchBox"
                className="h-12 w-auto object-contain"
              />
              <span className="ml-2 text-[10px] font-medium text-gray-400 border border-gray-300 px-1.5 py-0.5 rounded">
                BETA
              </span>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            <Link 
              to={createPageUrl('Dashboard')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                currentPageName === 'Dashboard'
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={currentPageName === 'Dashboard' ? {
                background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)'
              } : {}}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>

            <Link
              to={createPageUrl('Analytics')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${currentPageName === 'Analytics' ? 'text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
              style={currentPageName === 'Analytics' ? { background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' } : {}}
            >
              <BarChart2 className="w-5 h-5" />
              Analytics
            </Link>

            <div>
              <button
                onClick={() => setPackageBuilderExpanded(!packageBuilderExpanded)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  ['PackageBuilder', 'Templates', 'MyPackages'].includes(currentPageName)
                    ? 'text-[#ff0044] bg-red-50 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5" />
                  Package Builder
                </div>
                {packageBuilderExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {packageBuilderExpanded && (
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                  <Link 
                    to={createPageUrl('PackageBuilder')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      currentPageName === 'PackageBuilder'
                        ? 'text-[#ff0044] bg-red-50 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Build from Scratch
                  </Link>

                  <Link 
                    to={createPageUrl('MyPackages')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      currentPageName === 'MyPackages'
                        ? 'text-[#ff0044] bg-red-50 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    My Packages
                  </Link>

                  <Link 
                    to={createPageUrl('Templates')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      currentPageName === 'Templates'
                        ? 'text-[#ff0044] bg-red-50 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    Templates
                  </Link>
                </div>
              )}
            </div>

            <Link 
              to={createPageUrl('Settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                currentPageName === 'Settings'
                  ? 'text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={currentPageName === 'Settings' ? {
                background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)'
              } : {}}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>

            {isAdmin && (
              <Link 
                to={createPageUrl('HelpRequests')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  currentPageName === 'HelpRequests'
                    ? 'text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                style={currentPageName === 'HelpRequests' ? {
                  background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)'
                } : {}}
              >
                <MessageSquare className="w-5 h-5" />
                Help Requests
              </Link>
            )}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          {children}
        </main>

        <HelpButton />
        </div>
        </ErrorBoundary>
        );
        }