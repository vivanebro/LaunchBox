export const config = {
  matcher: [
    '/((?!api|_next|assets|favicon|manifest|robots|sitemap|.*\\..*).*)',
  ],
};

const SUPABASE_URL = 'https://cxfewezzartyjsigplot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZmV3ZXp6YXJ0eWpzaWdwbG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzU4MzksImV4cCI6MjA4NjgxMTgzOX0.atBF4OJKHLtNc892v_3369nIAXGJrRfsbvDqcgrsVYk';

const RESERVED_TOP_LEVEL = new Set([
  'Dashboard', 'MyPackages', 'PackageBuilder', 'Settings', 'Templates',
  'Welcome', 'Subscribe', 'ResetPassword', 'Contracts', 'ContractEditor',
  'ContractSign', 'ContractTemplates', 'ClientsProjects', 'Quiz', 'QuizManager',
  'Admin', 'HelpRequests', 'Home', 'Results', 'terms', 'privacy', 'quiz',
]);

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchPackage(creator, slug) {
  const url = `${SUPABASE_URL}/rest/v1/package_configs?creator_slug=eq.${encodeURIComponent(creator)}&public_slug=eq.${encodeURIComponent(slug)}&select=business_name,headline,sub_headline&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch {
    return null;
  }
}

export default async function middleware(req) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);

  if (parts.length !== 2) return;
  const [creator, slug] = parts;
  if (RESERVED_TOP_LEVEL.has(creator)) return;
  if (creator.includes('.') || slug.includes('.')) return;

  const pkg = await fetchPackage(creator, slug);
  if (!pkg) return;

  const indexRes = await fetch(new URL('/index.html', url.origin), {
    headers: { 'cache-control': 'no-cache' },
  });
  if (!indexRes.ok) return;
  let html = await indexRes.text();

  const business = pkg.business_name || 'LaunchBox';
  const title = `${business} — Pricing Packages`;
  const description = pkg.sub_headline || pkg.headline || 'Pick the option that fits your goals.';
  const ogImage = `${url.origin}/api/og?creator=${encodeURIComponent(creator)}&slug=${encodeURIComponent(slug)}`;
  const pageUrl = `${url.origin}${url.pathname}`;

  const meta = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  `;

  html = html.replace(/<title>[^<]*<\/title>/i, '');
  html = html.replace(/<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi, '');
  html = html.replace('</head>', `${meta}\n</head>`);

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  });
}
