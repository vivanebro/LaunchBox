import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://cxfewezzartyjsigplot.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZmV3ZXp6YXJ0eWpzaWdwbG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzU4MzksImV4cCI6MjA4NjgxMTgzOX0.atBF4OJKHLtNc892v_3369nIAXGJrRfsbvDqcgrsVYk';

async function fetchPackage(creator: string, slug: string) {
  const url = `${SUPABASE_URL}/rest/v1/package_configs?creator_slug=eq.${encodeURIComponent(creator)}&public_slug=eq.${encodeURIComponent(slug)}&select=business_name,headline,sub_headline,brand_color,logo_url,package_names,price_starter,price_growth,price_premium,currency,active_packages,pricingMode&limit=1`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

function formatPrice(amount: any, currency: string) {
  if (amount == null) return '';
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ILS: '₪' };
  const s = symbols[currency] || (currency ? currency + ' ' : '$');
  return `${s}${Number(amount).toLocaleString()}`;
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const creator = searchParams.get('creator') || '';
    const slug = searchParams.get('slug') || '';
    const variant = (searchParams.get('variant') || 'A').toUpperCase();

    const pkg: any = creator && slug ? await fetchPackage(creator, slug) : null;
    const brand = pkg?.brand_color || '#ff0044';
    const business = pkg?.business_name || 'LaunchBox';
    const headline = pkg?.headline || 'Pricing Packages';
    const mode = pkg?.pricingMode === 'retainer' ? 'retainer' : 'onetime';
    const tiers: string[] = (pkg?.active_packages?.[mode] || ['starter', 'growth', 'premium']).slice(0, 3);
    const names = pkg?.package_names?.[mode] || { starter: 'Starter', growth: 'Growth', premium: 'Premium', elite: 'Elite' };
    const prices: Record<string, any> = {
      starter: pkg?.price_starter,
      growth: pkg?.price_growth,
      premium: pkg?.price_premium,
    };
    const currency = pkg?.currency || 'USD';

    if (variant === 'D') {
      const isDefaultBrand = !pkg?.brand_color || pkg.brand_color.toLowerCase() === '#ff0044';
      const nameColor = isDefaultBrand ? '#0f172a' : brand;
      const accentColor = isDefaultBrand ? '#0f172a' : brand;

      const interBlackUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-900-normal.woff';
      const interMediumUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-500-normal.woff';
      const [interBlack, interMedium] = await Promise.all([
        fetch(interBlackUrl).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null),
        fetch(interMediumUrl).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null),
      ]);
      const fonts: any[] = [];
      if (interBlack) fonts.push({ name: 'Inter', data: interBlack, weight: 900, style: 'normal' });
      if (interMedium) fonts.push({ name: 'Inter', data: interMedium, weight: 500, style: 'normal' });

      return new ImageResponse(
        (
          <div
            style={{
              width: '1200px',
              height: '630px',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {pkg?.logo_url ? (
              <img src={pkg.logo_url} height="180" style={{ maxHeight: '180px', maxWidth: '720px', objectFit: 'contain', marginBottom: '40px' }} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  fontSize: '104px',
                  fontWeight: 900,
                  color: nameColor,
                  marginBottom: '40px',
                  textAlign: 'center',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                {business}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                fontSize: '26px',
                fontWeight: 500,
                color: '#475569',
                letterSpacing: '0.01em',
              }}
            >
              <span>View packages</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '999px',
                  background: accentColor,
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                →
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: '32px',
                right: '40px',
                display: 'flex',
                fontSize: '22px',
                color: '#94a3b8',
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}
            >
              Powered by LaunchBox
            </div>
          </div>
        ),
        { width: 1200, height: 630, fonts: fonts.length ? fonts : undefined }
      );
    }

    if (variant === 'B') {
      return new ImageResponse(
        (
          <div
            style={{
              width: '1200px',
              height: '630px',
              background: brand,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px',
              fontFamily: 'sans-serif',
              color: '#fff',
            }}
          >
            {pkg?.logo_url ? (
              <img src={pkg.logo_url} height="100" style={{ maxHeight: '100px', objectFit: 'contain', marginBottom: '32px' }} />
            ) : (
              <div style={{ display: 'flex', fontSize: '64px', fontWeight: 800, marginBottom: '24px' }}>{business}</div>
            )}
            <div style={{ display: 'flex', fontSize: '36px', fontWeight: 600, opacity: 0.95, textAlign: 'center' }}>
              Your packages, ready to review
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    if (variant === 'C') {
      return new ImageResponse(
        (
          <div
            style={{
              width: '1200px',
              height: '630px',
              background: '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              padding: '64px',
              fontFamily: 'sans-serif',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
              {pkg?.logo_url ? (
                <img src={pkg.logo_url} height="64" style={{ maxHeight: '64px', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '40px', fontWeight: 800, color: brand }}>{business}</div>
              )}
            </div>

            <div style={{ display: 'flex', fontSize: '52px', fontWeight: 800, color: '#0f172a', lineHeight: 1.05, marginBottom: '40px', maxWidth: '900px' }}>
              {headline}
            </div>

            <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
              {tiers.map((tier, i) => {
                const popular = i === 1;
                return (
                  <div
                    key={tier}
                    style={{
                      flex: 1,
                      background: popular ? brand : '#fff',
                      color: popular ? '#fff' : '#0f172a',
                      borderRadius: '20px',
                      padding: '28px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: popular ? `0 12px 40px ${hexToRgba(brand, 0.35)}` : '0 1px 3px rgba(15,23,42,0.08)',
                      border: popular ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', fontSize: '20px', fontWeight: 700, opacity: popular ? 0.9 : 0.7 }}>
                      {names[tier] || tier}
                    </div>
                    <div style={{ display: 'flex', fontSize: '44px', fontWeight: 800, marginTop: '12px' }}>
                      {formatPrice(prices[tier], currency) || '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '80px',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '56px' }}>
            {pkg?.logo_url ? (
              <img src={pkg.logo_url} height="80" style={{ maxHeight: '80px', objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: '52px', fontWeight: 800, color: brand }}>{business}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            {tiers.map((tier, i) => (
              <div
                key={tier}
                style={{
                  flex: 1,
                  borderRadius: '20px',
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: i === 1 ? brand : '#f8fafc',
                  color: i === 1 ? '#fff' : '#0f172a',
                }}
              >
                <div style={{ display: 'flex', fontSize: '20px', fontWeight: 600, opacity: 0.85, marginBottom: '12px' }}>
                  {names[tier] || tier}
                </div>
                <div style={{ display: 'flex', fontSize: '48px', fontWeight: 800 }}>
                  {formatPrice(prices[tier], currency) || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch (e: any) {
    return new Response('Failed to generate image: ' + (e?.message || 'unknown'), { status: 500 });
  }
}
