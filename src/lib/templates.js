// Template registry. Industries shown on the Templates page index, plus
// the actual template definitions (PackageConfig payloads) by industry.

export const INDUSTRIES = [
  { key: 'photography', name: 'Photography', icon: '📷', bg: '#FFE4E6', ready: true },
  { key: 'videography', name: 'Videography', icon: '🎥', bg: '#DBEAFE', ready: true },
  { key: 'hvac', name: 'HVAC', icon: '🔧', bg: '#FEF3C7', ready: false },
  { key: 'contractors', name: 'Contractors', icon: '🔨', bg: '#E0E7FF', ready: false },
  { key: 'plumbing', name: 'Plumbing', icon: '🚰', bg: '#D1FAE5', ready: false },
  { key: 'electrical', name: 'Electrical', icon: '⚡', bg: '#FED7AA', ready: false },
  { key: 'coaching', name: 'Coaching', icon: '🎯', bg: '#F3E8FF', ready: false },
  { key: 'interior_design', name: 'Interior Design', icon: '🎨', bg: '#FCE7F3', ready: false },
  { key: 'web_design', name: 'Web Design', icon: '💻', bg: '#CFFAFE', ready: false },
  { key: 'marketing_agency', name: 'Marketing Agency', icon: '📈', bg: '#FEF3C7', ready: false },
  { key: 'bookkeeping', name: 'Bookkeeping', icon: '🏢', bg: '#E0E7FF', ready: false },
];

const VIDEO_BRAND_COMMERCIAL = {
  id: 'video-brand-commercial',
  industry: 'videography',
  name: 'Brand & Commercial',
  icon: '🎬',
  brand_color: '#ff0044',
  price_range_display: '$2,500 — $15,000',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['brand-commercial'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: 'Hero brand video', quantity: 4, length: '60-90s', tooltip: '60-90s anchor video for homepage, ads, and pinned posts.' },
      { type: 'Short-form social clips', quantity: 20, length: '15-30s', tooltip: 'Quick cuts repurposed from your hero footage, ready to post anywhere.' },
      { type: 'Behind-the-scenes content', quantity: 1, length: '', tooltip: 'Raw moments from the shoot that humanize your brand.' },
      { type: 'Royalty-free B-roll library', quantity: 1, length: '', tooltip: 'Supplemental footage you own and can reuse for future content.' },
    ],
    additional_assets: [
      'Captions + sound design',
      'Custom motion graphics',
      'Brand strategy session (60 min)',
      'Quarterly strategy review',
    ],
    extras_bonuses: [
      'Brand sound pack',
      'Custom edits for every platform',
      'Brand video style guide',
      'Lifetime usage rights',
      'Source files',
    ],

    starter_deliverables: [
      { type: 'Hero brand video', quantity: 1, length: '60-90s', tooltip: '60-90s anchor video for homepage, ads, and pinned posts.' },
      { type: 'Vertical social clips', quantity: 3, length: '15-30s', tooltip: '15-30s reels for IG/TikTok/Shorts, optimized for each platform.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Brand sound pack', tooltip: "Curated royalty-free music in your brand's tone, ready to drop into any video." },
    ],

    growth_deliverables: [
      { type: 'Hero brand video', quantity: 2, length: '60-90s', tooltip: '60-90s anchor video for homepage, ads, and pinned posts.' },
      { type: 'Short-form clips', quantity: 8, length: '15-30s', tooltip: 'Quick cuts repurposed from your hero footage, ready to post anywhere.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Brand sound pack', tooltip: "Curated royalty-free music in your brand's tone, ready to drop into any video." },
      { text: 'Custom edits for every platform', tooltip: "Same content recut and resized for each platform's algorithm and audience." },
      { text: 'Brand video style guide', tooltip: "A doc capturing your brand's video look and feel so future videos stay consistent." },
    ],

    premium_deliverables: [
      { type: 'Hero brand video', quantity: 4, length: '60-90s', tooltip: '60-90s anchor video for homepage, ads, and pinned posts.' },
      { type: 'Short-form clips', quantity: 20, length: '15-30s', tooltip: 'Quick cuts repurposed from your hero footage, ready to post anywhere.' },
      { type: 'Behind-the-scenes content', quantity: 1, length: '', tooltip: 'Raw moments from the shoot that humanize your brand.' },
      { type: 'Royalty-free B-roll library', quantity: 1, length: '', tooltip: 'Supplemental footage you own and can reuse for future content.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Brand sound pack', tooltip: "Curated royalty-free music in your brand's tone, ready to drop into any video." },
      { text: 'Custom edits for every platform', tooltip: "Same content recut and resized for each platform's algorithm and audience." },
      { text: 'Brand video style guide', tooltip: "A doc capturing your brand's video look and feel so future videos stay consistent." },
      { text: 'Lifetime usage rights', tooltip: 'Repurpose, edit, republish forever. No relicensing, no fees.' },
      { text: 'Source files', tooltip: 'The raw footage we shot, yours to keep.' },
    ],

    project_duration: '10 days - 4 weeks',
    duration_min: 10,
    duration_max: 30,
    duration_unit: 'days',

    price_range: '$2,500-$15,000',
    price_starter: 2500,
    price_growth: 5500,
    price_premium: 15000,
    price_starter_retainer: 2000,
    price_growth_retainer: 4500,
    price_premium_retainer: 12000,

    package_names: {
      onetime: { starter: 'Starter', growth: 'Pro', premium: 'Premium' },
      retainer: { starter: 'Starter', growth: 'Pro', premium: 'Premium' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For brands establishing their first video presence.',
        growth: 'For growing brands building a content engine.',
        premium: 'For established brands running full campaigns.',
      },
      retainer: {
        starter: 'For brands establishing their first video presence.',
        growth: 'For growing brands building a content engine.',
        premium: 'For established brands running full campaigns.',
      },
    },

    guarantee: "We deliver on time. If we don't, you get two add-ons free on us.",
    urgency: '1 spot left for this month. Next slot opens in 2 weeks.',
    brand_color: '#ff0044',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-same-day', name: 'Same-day social cut', price: 300, quantity: 1, tooltip: 'Time-sensitive launches, edited and delivered the same day.' },
      { id: 'addon-localization', name: 'Voiceover and subtitles in another language', price: 600, quantity: 1, tooltip: 'Full localization. Translated subtitles plus a voiceover artist in the target language.' },
      { id: 'addon-ad-cuts', name: 'Performance ad cuts', price: 400, quantity: 1, tooltip: 'Video repackaged for paid ads (Meta, TikTok, YouTube) with hook variations to test.' },
      { id: 'addon-photo-day', name: 'Photography day during shoot', price: 600, quantity: 1, tooltip: 'Branded stills for website, press, social. Captured the same day, no extra session.' },
      { id: 'addon-thumbnails', name: 'Custom thumbnail design pack', price: 200, quantity: 1, tooltip: 'Scroll-stopping thumbnails so your videos actually get clicked.' },
    ],
    addons_label: 'Add-ons',

    button_links: {
      onetime: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Book a call',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Book a call',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Book a call',
      },
      retainer: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Book a call',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Book a call',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Book a call',
      },
    },
  },
};

export const TEMPLATES_BY_INDUSTRY = {
  photography: [],
  videography: [VIDEO_BRAND_COMMERCIAL],
};

export function getTemplateById(id) {
  for (const list of Object.values(TEMPLATES_BY_INDUSTRY)) {
    const found = list.find((t) => t.id === id);
    if (found) return found;
  }
  return null;
}
