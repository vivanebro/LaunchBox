// Template registry. Industries shown on the Templates page index, plus
// the actual template definitions (PackageConfig payloads) by industry.

export const INDUSTRIES = [
  { key: 'photography', name: 'Photography', icon: '📷', bg: '#FFE4E6', ready: true },
  { key: 'videography', name: 'Videography', icon: '🎥', bg: '#DBEAFE', ready: true },
  { key: 'hvac', name: 'HVAC', icon: '🔧', bg: '#FEF3C7', ready: true },
  { key: 'contractors', name: 'Contractors', icon: '🔨', bg: '#E0E7FF', ready: false },
  { key: 'plumbing', name: 'Plumbing', icon: '🚰', bg: '#D1FAE5', ready: false },
  { key: 'electrical', name: 'Electrical', icon: '⚡', bg: '#FED7AA', ready: false },
  { key: 'coaching', name: 'Coaching', icon: '🎯', bg: '#F3E8FF', ready: false },
  { key: 'interior_design', name: 'Interior Design', icon: '🎨', bg: '#FCE7F3', ready: false },
  { key: 'web_design', name: 'Web Design', icon: '💻', bg: '#CFFAFE', ready: false },
  { key: 'marketing_agency', name: 'Marketing Agency', icon: '📈', bg: '#FEF3C7', ready: false },
  { key: 'bookkeeping', name: 'Bookkeeping', icon: '🏢', bg: '#E0E7FF', ready: false },
  { key: 'msp', name: 'MSP / IT Services', icon: '🛡️', bg: '#DBEAFE', ready: true },
];

const VIDEO_BRAND_COMMERCIAL = {
  id: 'video-brand-commercial',
  industry: 'videography',
  name: 'Brand & Commercial',
  icon: '🎬',
  brand_color: '#ff0044',
  price_range_display: '$2,500 to $15,000',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['brand-commercial'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: '4 × Hero brand video (60-90s)', tooltip: '60-90s anchor video for homepage, ads, and pinned posts.' },
      { type: '20 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts, optimized for each platform.' },
      { type: 'Behind-the-scenes content', tooltip: 'Raw moments from the shoot that humanize your brand.' },
      { type: 'Royalty-free B-roll library', tooltip: 'Supplemental footage you own and can reuse for future content.' },
      { type: 'Brand story documentary (3-5 min)', tooltip: 'Long-form film telling your brand story for website, sales, and investor decks.' },
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
      { type: 'Hero brand video (60-90s)', tooltip: '60-90s anchor video for homepage, ads, and pinned posts.' },
      { type: '3 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts, optimized for each platform.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Brand sound pack', tooltip: "Curated royalty-free music in your brand's tone, ready to drop into any video." },
    ],

    growth_deliverables: [
      { type: '2 × Hero brand video (60-90s)', tooltip: '60-90s anchor video for homepage, ads, and pinned posts.' },
      { type: '8 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts, optimized for each platform.' },
      { type: 'Behind-the-scenes content', tooltip: 'Raw moments from the shoot that humanize your brand.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Brand sound pack', tooltip: "Curated royalty-free music in your brand's tone, ready to drop into any video." },
      { text: 'Custom edits for every platform', tooltip: "Same content recut and resized for each platform's algorithm and audience." },
      { text: 'Brand video style guide', tooltip: "A doc capturing your brand's video look and feel so future videos stay consistent." },
    ],

    premium_deliverables: [
      { type: '4 × Hero brand video (60-90s)', tooltip: '60-90s anchor video for homepage, ads, and pinned posts.' },
      { type: '20 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts, optimized for each platform.' },
      { type: 'Behind-the-scenes content', tooltip: 'Raw moments from the shoot that humanize your brand.' },
      { type: 'Royalty-free B-roll library', tooltip: 'Supplemental footage you own and can reuse for future content.' },
      { type: 'Brand story documentary (3-5 min)', tooltip: 'Long-form film telling your brand story for website, sales, and investor decks.' },
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

const VIDEO_REAL_ESTATE = {
  id: 'video-real-estate',
  industry: 'videography',
  name: 'Real Estate',
  icon: '🏡',
  brand_color: '#2563eb',
  price_range_display: '$1,500 to $9,500',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['real-estate'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: 'Cinematic property tour (2-3 min)', tooltip: 'Hero listing video showcasing every key room, feature, and selling point of the property.' },
      { type: '10 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts to drive traffic and saves to your listing.' },
      { type: 'Aerial drone footage', tooltip: 'Cinematic drone shots of the property and surrounding neighborhood.' },
      { type: 'Twilight / golden hour shoot', tooltip: 'Dedicated shoot at golden hour for premium lighting and mood.' },
      { type: 'Agent on-camera intro', tooltip: 'On-camera agent introduction tying the listing to your personal brand.' },
      { type: '3D motion overlay (property + area)', tooltip: 'Animated graphics highlighting key property features and area landmarks (schools, highways, parks).' },
      { type: 'Property photo set (20 stills)', tooltip: 'Professional stills shot the same day, ready for MLS, social, and print.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'MLS + Zillow ready exports',
      'Branded intro/outro with agent contact',
      'Captions + music licensing',
      'Lifetime usage rights',
      'Source files',
    ],

    starter_deliverables: [
      { type: 'Cinematic property tour (2-3 min)', tooltip: 'Hero listing video showcasing every key room, feature, and selling point of the property.' },
      { type: '3 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts to drive traffic and saves to your listing.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'MLS + Zillow ready exports', tooltip: 'Listing video formatted and exported for MLS, Zillow, and Realtor.com requirements.' },
    ],

    growth_deliverables: [
      { type: 'Cinematic property tour (2-3 min)', tooltip: 'Hero listing video showcasing every key room, feature, and selling point of the property.' },
      { type: '5 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts to drive traffic and saves to your listing.' },
      { type: 'Aerial drone footage', tooltip: 'Cinematic drone shots of the property and surrounding neighborhood.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'MLS + Zillow ready exports', tooltip: 'Listing video formatted and exported for MLS, Zillow, and Realtor.com requirements.' },
      { text: 'Branded intro/outro with agent contact', tooltip: 'Custom intro/outro card with your name, brokerage, and contact info.' },
      { text: 'Captions + music licensing', tooltip: 'Burned-in captions and royalty-free music cleared for use.' },
    ],

    premium_deliverables: [
      { type: 'Cinematic property tour (2-3 min)', tooltip: 'Hero listing video showcasing every key room, feature, and selling point of the property.' },
      { type: '10 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts to drive traffic and saves to your listing.' },
      { type: 'Aerial drone footage', tooltip: 'Cinematic drone shots of the property and surrounding neighborhood.' },
      { type: 'Twilight / golden hour shoot', tooltip: 'Dedicated shoot at golden hour for premium lighting and mood.' },
      { type: 'Agent on-camera intro', tooltip: 'On-camera agent introduction tying the listing to your personal brand.' },
      { type: '3D motion overlay (property + area)', tooltip: 'Animated graphics highlighting key property features and area landmarks (schools, highways, parks).' },
      { type: 'Property photo set (20 stills)', tooltip: 'Professional stills shot the same day, ready for MLS, social, and print.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'MLS + Zillow ready exports', tooltip: 'Listing video formatted and exported for MLS, Zillow, and Realtor.com requirements.' },
      { text: 'Branded intro/outro with agent contact', tooltip: 'Custom intro/outro card with your name, brokerage, and contact info.' },
      { text: 'Captions + music licensing', tooltip: 'Burned-in captions and royalty-free music cleared for use.' },
      { text: 'Lifetime usage rights', tooltip: 'Repurpose, edit, republish forever. No relicensing, no fees.' },
      { text: 'Source files', tooltip: 'The raw footage we shot, yours to keep.' },
    ],

    project_duration: '5 days - 14 days',
    duration_min: 5,
    duration_max: 14,
    duration_unit: 'days',

    price_range: '$1,500-$9,500',
    price_starter: 1500,
    price_growth: 3500,
    price_premium: 9500,
    price_starter_retainer: 1300,
    price_growth_retainer: 3000,
    price_premium_retainer: 8000,

    pricing_label_onetime: 'listing',
    pricing_label_retainer: 'listing',
    pricing_button_label_onetime: 'One-time',
    pricing_button_label_retainer: '3x Bundle',

    package_names: {
      onetime: { starter: 'Standard', growth: 'Premier', premium: 'Luxury' },
      retainer: { starter: 'Standard', growth: 'Premier', premium: 'Luxury' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For agents listing standard residential properties.',
        growth: 'For agents listing high-end homes that need to stand out.',
        premium: 'For luxury listings that demand a full cinematic production.',
      },
      retainer: {
        starter: 'For agents listing standard residential properties.',
        growth: 'For agents listing high-end homes that need to stand out.',
        premium: 'For luxury listings that demand a full cinematic production.',
      },
    },

    guarantee: 'Ready in time for your listing date. If we miss, the next revision round is on us.',
    urgency: 'Limited slots. Only 2 listings open this month.',
    brand_color: '#2563eb',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-photo-set', name: 'Property photo set (20 stills)', price: 500, quantity: 1, tooltip: 'Professional stills shot the same day, ready for MLS, social, and print.' },
      { id: 'addon-neighborhood-reel', name: 'Neighborhood lifestyle reel', price: 600, quantity: 1, tooltip: 'Standalone video featuring local cafes, parks, schools, and lifestyle hotspots near the property.' },
      { id: 'addon-open-house', name: 'Open house teaser video', price: 300, quantity: 1, tooltip: 'Short hype video to promote your open house in the days leading up.' },
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

const VIDEO_WEDDING = {
  id: 'video-wedding',
  industry: 'videography',
  name: 'Wedding',
  icon: '💍',
  brand_color: '#9333ea',
  price_range_display: '$2,500 to $12,000',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['wedding'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: 'Cinematic wedding film (5-7 min)', tooltip: 'A 5-7 minute cinematic highlight film capturing the emotion and story of the day.' },
      { type: '10 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts, ready to share with family and friends.' },
      { type: 'Full ceremony video (uncut)', tooltip: 'Multi-camera uncut recording of the full ceremony, vows, and exchange.' },
      { type: 'Reception speeches video', tooltip: 'Speeches, toasts, and key reception moments captured in full.' },
      { type: 'Aerial drone footage', tooltip: 'Cinematic drone shots of the venue and key outdoor moments.' },
      { type: 'Same-day edit (shown at reception)', tooltip: 'A short film edited during the day and projected at the reception.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Bloopers + outtakes reel',
      '"How we met" friend tributes',
      'Guest video booth montage',
      'Anniversary teaser cut',
      'Pre-wedding consultation call',
    ],

    starter_deliverables: [
      { type: 'Cinematic wedding film (5-7 min)', tooltip: 'A 5-7 minute cinematic highlight film capturing the emotion and story of the day.' },
      { type: '3 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts, ready to share with family and friends.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Bloopers + outtakes reel', tooltip: 'A fun reel of candid mistakes and laughs from the day.' },
    ],

    growth_deliverables: [
      { type: 'Cinematic wedding film (5-7 min)', tooltip: 'A 5-7 minute cinematic highlight film capturing the emotion and story of the day.' },
      { type: '5 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts, ready to share with family and friends.' },
      { type: 'Full ceremony video (uncut)', tooltip: 'Multi-camera uncut recording of the full ceremony, vows, and exchange.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Bloopers + outtakes reel', tooltip: 'A fun reel of candid mistakes and laughs from the day.' },
      { text: '"How we met" friend tributes', tooltip: 'Friends and family record short intros for the bride and groom, played at the ceremony.' },
      { text: 'Guest video booth montage', tooltip: 'Guests record well-wishes throughout the day, edited into one keepsake reel.' },
    ],

    premium_deliverables: [
      { type: 'Cinematic wedding film (5-7 min)', tooltip: 'A 5-7 minute cinematic highlight film capturing the emotion and story of the day.' },
      { type: '10 × Vertical social clips (15-30s)', tooltip: '15-30s reels for IG/TikTok/Shorts, ready to share with family and friends.' },
      { type: 'Full ceremony video (uncut)', tooltip: 'Multi-camera uncut recording of the full ceremony, vows, and exchange.' },
      { type: 'Reception speeches video', tooltip: 'Speeches, toasts, and key reception moments captured in full.' },
      { type: 'Aerial drone footage', tooltip: 'Cinematic drone shots of the venue and key outdoor moments.' },
      { type: 'Same-day edit (shown at reception)', tooltip: 'A short film edited during the day and projected at the reception.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Bloopers + outtakes reel', tooltip: 'A fun reel of candid mistakes and laughs from the day.' },
      { text: '"How we met" friend tributes', tooltip: 'Friends and family record short intros for the bride and groom, played at the ceremony.' },
      { text: 'Guest video booth montage', tooltip: 'Guests record well-wishes throughout the day, edited into one keepsake reel.' },
      { text: 'Anniversary teaser cut', tooltip: 'A short re-edit ready to post on your 1-year anniversary.' },
      { text: 'Pre-wedding consultation call', tooltip: 'A planning call to align on shot list, key moments, and timeline.' },
    ],

    project_duration: '3 weeks - 8 weeks',
    duration_min: 3,
    duration_max: 8,
    duration_unit: 'weeks',

    price_range: '$2,500-$12,000',
    price_starter: 2500,
    price_growth: 5500,
    price_premium: 12000,

    pricing_availability: 'onetime',
    pricing_label_onetime: 'one-time',
    pricing_button_label_onetime: 'One-time',

    package_names: {
      onetime: { starter: 'Bronze', growth: 'Silver', premium: 'Gold' },
      retainer: { starter: 'Bronze', growth: 'Silver', premium: 'Gold' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For couples who want their highlight film, captured cinematically.',
        growth: 'For couples who want their full ceremony preserved alongside the highlight.',
        premium: 'For couples who want every moment of the day covered like a movie.',
      },
      retainer: {
        starter: 'For couples who want their highlight film, captured cinematically.',
        growth: 'For couples who want their full ceremony preserved alongside the highlight.',
        premium: 'For couples who want every moment of the day covered like a movie.',
      },
    },

    guarantee: 'Highlight film delivered within 6 weeks. If we miss, your next revision is on us.',
    urgency: 'Limited dates. Only 2 weddings left this season.',
    brand_color: '#9333ea',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-engagement', name: 'Engagement / pre-wedding shoot', price: 800, quantity: 1, tooltip: 'Separate cinematic session before the wedding for save-the-dates and social.' },
      { id: 'addon-livestream', name: 'Live ceremony streaming', price: 500, quantity: 1, tooltip: 'Live broadcast of the ceremony for remote family and friends.' },
      { id: 'addon-save-the-date', name: 'Save-the-date video', price: 400, quantity: 1, tooltip: 'Short pre-wedding video to announce the date on social.' },
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

const PHOTO_WEDDING = {
  id: 'photo-wedding',
  industry: 'photography',
  name: 'Wedding',
  icon: '💍',
  brand_color: '#ec4899',
  price_range_display: '$1,800 to $7,500',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['wedding'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: '10 hours wedding day coverage', tooltip: 'Full coverage from getting-ready through reception send-off.' },
      { type: '500+ edited high-res photos', tooltip: 'Professionally edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing photos with family and friends. Lifetime hosting.' },
      { type: 'Second photographer', tooltip: 'A second shooter capturing additional angles, candids, and groom prep simultaneously.' },
      { type: 'Pre-wedding engagement session', tooltip: 'Separate engagement shoot for save-the-dates, social, and album lead-in photos.' },
      { type: 'Premium wedding album (hardcover)', tooltip: 'Custom-designed hardcover album with your favorite photos from the day.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Sneak peek photos within 48 hours',
      'Getting-ready candid story (bride + groom)',
      'Couple\'s "first look" reveal series',
      'Lifetime usage rights',
      'Print release',
    ],

    starter_deliverables: [
      { type: '6 hours wedding day coverage', tooltip: 'Coverage of the ceremony and key reception moments.' },
      { type: '200 edited high-res photos', tooltip: 'Professionally edited, color-graded high-resolution photos delivered via online gallery.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Sneak peek photos within 48 hours', tooltip: 'A handful of preview photos delivered within 48 hours of your wedding.' },
    ],

    growth_deliverables: [
      { type: '8 hours wedding day coverage', tooltip: 'Coverage from prep through key reception moments.' },
      { type: '350 edited high-res photos', tooltip: 'Professionally edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing photos with family and friends. Lifetime hosting.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Sneak peek photos within 48 hours', tooltip: 'A handful of preview photos delivered within 48 hours of your wedding.' },
      { text: 'Getting-ready candid story (bride + groom)', tooltip: 'A curated narrative set of getting-ready candids from both sides.' },
      { text: 'Couple\'s "first look" reveal series', tooltip: 'Dedicated coverage of the first-look reveal moment, edited as a mini-series.' },
    ],

    premium_deliverables: [
      { type: '10 hours wedding day coverage', tooltip: 'Full coverage from getting-ready through reception send-off.' },
      { type: '500+ edited high-res photos', tooltip: 'Professionally edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing photos with family and friends. Lifetime hosting.' },
      { type: 'Second photographer', tooltip: 'A second shooter capturing additional angles, candids, and groom prep simultaneously.' },
      { type: 'Pre-wedding engagement session', tooltip: 'Separate engagement shoot for save-the-dates, social, and album lead-in photos.' },
      { type: 'Premium wedding album (hardcover)', tooltip: 'Custom-designed hardcover album with your favorite photos from the day.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Sneak peek photos within 48 hours', tooltip: 'A handful of preview photos delivered within 48 hours of your wedding.' },
      { text: 'Getting-ready candid story (bride + groom)', tooltip: 'A curated narrative set of getting-ready candids from both sides.' },
      { text: 'Couple\'s "first look" reveal series', tooltip: 'Dedicated coverage of the first-look reveal moment, edited as a mini-series.' },
      { text: 'Lifetime usage rights', tooltip: 'Print, post, and share forever. No relicensing, no fees.' },
      { text: 'Print release', tooltip: 'Permission to print your photos at any lab of your choice.' },
    ],

    project_duration: '3 weeks - 8 weeks',
    duration_min: 3,
    duration_max: 8,
    duration_unit: 'weeks',

    price_range: '$1,800-$7,500',
    price_starter: 1800,
    price_growth: 3500,
    price_premium: 7500,

    pricing_availability: 'onetime',
    pricing_label_onetime: 'one-time',
    pricing_button_label_onetime: 'One-time',

    currentDesign: 0,

    package_names: {
      onetime: { starter: 'Bronze', growth: 'Silver', premium: 'Gold' },
      retainer: { starter: 'Bronze', growth: 'Silver', premium: 'Gold' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For couples who want their day captured beautifully with the essentials.',
        growth: 'For couples who want full coverage with a curated gallery and online sharing.',
        premium: 'For couples who want the complete photographic story including engagement, album, and second shooter.',
      },
      retainer: {
        starter: 'For couples who want their day captured beautifully with the essentials.',
        growth: 'For couples who want full coverage with a curated gallery and online sharing.',
        premium: 'For couples who want the complete photographic story including engagement, album, and second shooter.',
      },
    },

    guarantee: 'Sneak peek within 48 hours. Full gallery delivered within 5 weeks or your next session is on us.',
    urgency: 'Limited dates. Only 2 weddings left this season.',
    brand_color: '#ec4899',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-photo-booth', name: 'Photo booth setup at reception', price: 600, quantity: 1, tooltip: 'Branded photo booth with props, prints on the spot, and digital copies for guests.' },
      { id: 'addon-drone-photo', name: 'Drone aerial photo coverage', price: 400, quantity: 1, tooltip: 'Cinematic aerial stills of the venue, ceremony location, and group shots.' },
      { id: 'addon-day-after', name: 'Day-after "trash the dress" session', price: 500, quantity: 1, tooltip: 'Adventurous day-after shoot in dramatic locations, no need to keep the dress pristine.' },
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

const PHOTO_NEWBORN = {
  id: 'photo-newborn',
  industry: 'photography',
  name: 'Newborn',
  icon: '👶',
  brand_color: '#f59e0b',
  price_range_display: '$450 to $1,800',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['newborn'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: '3-hour studio newborn session', tooltip: 'Relaxed in-studio session with props, wraps, and posed setups in a calm, baby-friendly environment.' },
      { type: '60 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing with family and friends. Lifetime hosting.' },
      { type: 'Family + sibling portraits', tooltip: 'Dedicated time during the session for parents and siblings with the new baby.' },
      { type: 'Custom hardcover album', tooltip: 'Bespoke designed hardcover album of your favorite photos from the session.' },
      { type: 'Wall art print (16×20)', tooltip: 'A single 16×20 print of your favorite shot, ready to hang.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Sneak peek photos within 24 hours',
      'Big sibling "first meeting" photo series',
      'Parents-with-baby connection portraits',
      'Lifetime usage rights',
      'Print release',
    ],

    starter_deliverables: [
      { type: '1.5-hour studio newborn session', tooltip: 'Compact in-studio session with essential posed setups.' },
      { type: '25 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Sneak peek photos within 24 hours', tooltip: 'A handful of preview photos delivered within 24 hours of your session.' },
    ],

    growth_deliverables: [
      { type: '2-hour studio newborn session', tooltip: 'Relaxed in-studio session with props and wraps.' },
      { type: '40 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing with family and friends. Lifetime hosting.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Sneak peek photos within 24 hours', tooltip: 'A handful of preview photos delivered within 24 hours of your session.' },
      { text: 'Big sibling "first meeting" photo series', tooltip: 'Dedicated coverage of an older sibling meeting the baby for the first time, edited as a mini-series.' },
      { text: 'Parents-with-baby connection portraits', tooltip: 'Quiet, intimate portraits of mom and dad bonding with the baby.' },
    ],

    premium_deliverables: [
      { type: '3-hour studio newborn session', tooltip: 'Relaxed in-studio session with props, wraps, and posed setups in a calm, baby-friendly environment.' },
      { type: '60 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing with family and friends. Lifetime hosting.' },
      { type: 'Family + sibling portraits', tooltip: 'Dedicated time during the session for parents and siblings with the new baby.' },
      { type: 'Custom hardcover album', tooltip: 'Bespoke designed hardcover album of your favorite photos from the session.' },
      { type: 'Wall art print (16×20)', tooltip: 'A single 16×20 print of your favorite shot, ready to hang.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Sneak peek photos within 24 hours', tooltip: 'A handful of preview photos delivered within 24 hours of your session.' },
      { text: 'Big sibling "first meeting" photo series', tooltip: 'Dedicated coverage of an older sibling meeting the baby for the first time, edited as a mini-series.' },
      { text: 'Parents-with-baby connection portraits', tooltip: 'Quiet, intimate portraits of mom and dad bonding with the baby.' },
      { text: 'Lifetime usage rights', tooltip: 'Print, post, and share forever. No relicensing, no fees.' },
      { text: 'Print release', tooltip: 'Permission to print your photos at any lab of your choice.' },
    ],

    project_duration: '2 weeks - 6 weeks',
    duration_min: 2,
    duration_max: 6,
    duration_unit: 'weeks',

    price_range: '$450-$1,800',
    price_starter: 450,
    price_growth: 850,
    price_premium: 1800,

    pricing_availability: 'onetime',
    pricing_label_onetime: 'one-time',
    pricing_button_label_onetime: 'One-time',

    currentDesign: 0,

    package_names: {
      onetime: { starter: 'Bronze', growth: 'Silver', premium: 'Gold' },
      retainer: { starter: 'Bronze', growth: 'Silver', premium: 'Gold' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For parents who want their newborn captured with the essentials.',
        growth: 'For parents who want a gallery they can share with family and friends.',
        premium: 'For parents who want the complete newborn story with family portraits and an album.',
      },
      retainer: {
        starter: 'For parents who want their newborn captured with the essentials.',
        growth: 'For parents who want a gallery they can share with family and friends.',
        premium: 'For parents who want the complete newborn story with family portraits and an album.',
      },
    },

    guarantee: 'Sneak peek within 24 hours. Final gallery in 4 weeks or your next session is free.',
    urgency: 'Limited slots. Newborn sessions book up fast.',
    brand_color: '#f59e0b',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-in-home', name: 'In-home lifestyle session', price: 400, quantity: 1, tooltip: 'Relaxed at-home session capturing baby in their natural environment.' },
      { id: 'addon-maternity', name: 'Maternity session prequel', price: 500, quantity: 1, tooltip: 'Pre-baby maternity shoot to bookend the newborn story.' },
      { id: 'addon-milestone-sub', name: 'Milestone subscription (3, 6, 12 months)', price: 750, quantity: 1, tooltip: 'Three follow-up sessions throughout baby\'s first year to capture growth.' },
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

const PHOTO_EVENT = {
  id: 'photo-event',
  industry: 'photography',
  name: 'Event',
  icon: '🎉',
  brand_color: '#06b6d4',
  price_range_display: '$750 to $3,500',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['event'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: '8-hour event coverage', tooltip: 'Full coverage from setup through key moments and wrap.' },
      { type: '400+ edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Same-day social preview (10 photos)', tooltip: '10 polished photos delivered the same day, ready to post on social.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing with team, sponsors, and attendees. Lifetime hosting.' },
      { type: 'VIP / speaker portrait setup', tooltip: 'Dedicated portrait corner with controlled lighting for speakers, VIPs, and sponsors.' },
      { type: 'Branded event recap deck', tooltip: 'Designed PDF recap deck with key shots, ready for stakeholders and post-event marketing.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Sneak peek photos within 24 hours',
      'Crowd / atmosphere candids reel',
      'Branded watermark on social-ready cuts',
      'Lifetime usage rights',
      'Print release',
    ],

    starter_deliverables: [
      { type: '4-hour event coverage', tooltip: 'Coverage of the core event window.' },
      { type: '100 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Sneak peek photos within 24 hours', tooltip: 'A handful of preview photos delivered within 24 hours of the event.' },
    ],

    growth_deliverables: [
      { type: '6-hour event coverage', tooltip: 'Coverage of setup through main event.' },
      { type: '250 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Same-day social preview (10 photos)', tooltip: '10 polished photos delivered the same day, ready to post on social.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Sneak peek photos within 24 hours', tooltip: 'A handful of preview photos delivered within 24 hours of the event.' },
      { text: 'Crowd / atmosphere candids reel', tooltip: 'A curated set of candid crowd and atmosphere shots that capture the energy.' },
      { text: 'Branded watermark on social-ready cuts', tooltip: 'Subtle branded watermark on the social preview photos.' },
    ],

    premium_deliverables: [
      { type: '8-hour event coverage', tooltip: 'Full coverage from setup through key moments and wrap.' },
      { type: '400+ edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Same-day social preview (10 photos)', tooltip: '10 polished photos delivered the same day, ready to post on social.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing with team, sponsors, and attendees. Lifetime hosting.' },
      { type: 'VIP / speaker portrait setup', tooltip: 'Dedicated portrait corner with controlled lighting for speakers, VIPs, and sponsors.' },
      { type: 'Branded event recap deck', tooltip: 'Designed PDF recap deck with key shots, ready for stakeholders and post-event marketing.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Sneak peek photos within 24 hours', tooltip: 'A handful of preview photos delivered within 24 hours of the event.' },
      { text: 'Crowd / atmosphere candids reel', tooltip: 'A curated set of candid crowd and atmosphere shots that capture the energy.' },
      { text: 'Branded watermark on social-ready cuts', tooltip: 'Subtle branded watermark on the social preview photos.' },
      { text: 'Lifetime usage rights', tooltip: 'Repurpose, edit, republish forever. No relicensing, no fees.' },
      { text: 'Print release', tooltip: 'Permission to print your photos at any lab of your choice.' },
    ],

    project_duration: '5 days - 3 weeks',
    duration_min: 5,
    duration_max: 21,
    duration_unit: 'days',

    price_range: '$750-$3,500',
    price_starter: 750,
    price_growth: 1500,
    price_premium: 3500,
    price_starter_retainer: 650,
    price_growth_retainer: 1300,
    price_premium_retainer: 3000,

    pricing_label_onetime: 'event',
    pricing_label_retainer: 'event',
    pricing_button_label_onetime: 'One-time',
    pricing_button_label_retainer: '3x Bundle',

    package_names: {
      onetime: { starter: 'Bronze', growth: 'Silver', premium: 'Gold' },
      retainer: { starter: 'Bronze', growth: 'Silver', premium: 'Gold' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For events that need core coverage and a clean gallery.',
        growth: 'For events that need full coverage with same-day social-ready previews.',
        premium: 'For high-profile events that need premium coverage, VIP portraits, and a recap deck.',
      },
      retainer: {
        starter: 'For events that need core coverage and a clean gallery.',
        growth: 'For events that need full coverage with same-day social-ready previews.',
        premium: 'For high-profile events that need premium coverage, VIP portraits, and a recap deck.',
      },
    },

    guarantee: 'Sneak peek within 24 hours. Full gallery delivered within 2 weeks.',
    urgency: 'Limited availability. Only 3 events open this month.',
    brand_color: '#06b6d4',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-roving', name: 'Roving photographer for sponsor activations', price: 400, quantity: 1, tooltip: 'A second shooter dedicated to sponsor booths and activations during the event.' },
      { id: 'addon-print-station', name: 'On-site printing station', price: 700, quantity: 1, tooltip: 'Branded photo printing station so guests leave with physical keepsakes.' },
      { id: 'addon-slideshow', name: 'Highlight slideshow (set to music)', price: 300, quantity: 1, tooltip: 'Edited slideshow of the day\'s best photos, scored to licensed music.' },
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

const PHOTO_PORTRAIT_FAMILY = {
  id: 'photo-portrait-family',
  industry: 'photography',
  name: 'Portrait / Family',
  icon: '👨‍👩‍👧',
  brand_color: '#059669',
  price_range_display: '$250 to $1,200',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['portrait-family'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: 'Multi-location portrait session', tooltip: 'Full session split between a studio setup and an outdoor location of your choice.' },
      { type: '50 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing with family and friends. Lifetime hosting.' },
      { type: 'Custom holiday card design', tooltip: 'Designed holiday card template with your photo, ready to print or send digitally.' },
      { type: 'Framed wall art (16×20)', tooltip: 'A single 16×20 framed print of your favorite shot, ready to hang.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Outfit + styling consultation',
      'Photo printing credit ($100)',
      'Family candids reel',
      'Annual session reminder',
    ],

    starter_deliverables: [
      { type: 'Studio portrait session', tooltip: 'Compact in-studio session focused on classic portrait setups.' },
      { type: '15 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Outfit + styling consultation', tooltip: 'A pre-session call to align on outfits, colors, and styling so everyone looks cohesive.' },
    ],

    growth_deliverables: [
      { type: 'Studio or outdoor portrait session', tooltip: 'Single-location session at your choice of studio or an outdoor spot.' },
      { type: '30 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing with family and friends. Lifetime hosting.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Outfit + styling consultation', tooltip: 'A pre-session call to align on outfits, colors, and styling so everyone looks cohesive.' },
      { text: 'Photo printing credit ($100)', tooltip: '$100 credit toward prints, products, or wall art from your gallery.' },
      { text: 'Family candids reel', tooltip: 'A curated set of unposed candids from in-between the formal shots.' },
    ],

    premium_deliverables: [
      { type: 'Multi-location portrait session', tooltip: 'Full session split between a studio setup and an outdoor location of your choice.' },
      { type: '50 edited high-res photos', tooltip: 'Hand-edited, color-graded high-resolution photos delivered via online gallery.' },
      { type: 'Online client gallery', tooltip: 'Private gallery for sharing with family and friends. Lifetime hosting.' },
      { type: 'Custom holiday card design', tooltip: 'Designed holiday card template with your photo, ready to print or send digitally.' },
      { type: 'Framed wall art (16×20)', tooltip: 'A single 16×20 framed print of your favorite shot, ready to hang.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Outfit + styling consultation', tooltip: 'A pre-session call to align on outfits, colors, and styling so everyone looks cohesive.' },
      { text: 'Photo printing credit ($100)', tooltip: '$100 credit toward prints, products, or wall art from your gallery.' },
      { text: 'Family candids reel', tooltip: 'A curated set of unposed candids from in-between the formal shots.' },
      { text: 'Annual session reminder', tooltip: 'A friendly reminder around the same time next year to book your annual family update.' },
    ],

    project_duration: '1 week - 4 weeks',
    duration_min: 1,
    duration_max: 4,
    duration_unit: 'weeks',

    price_range: '$250-$1,200',
    price_starter: 250,
    price_growth: 500,
    price_premium: 1200,

    pricing_availability: 'onetime',
    pricing_label_onetime: 'session',
    pricing_button_label_onetime: 'One-time',

    currentDesign: 0,

    package_names: {
      onetime: { starter: 'Mini', growth: 'Classic', premium: 'Signature' },
      retainer: { starter: 'Mini', growth: 'Classic', premium: 'Signature' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For families who want a quick session for holiday cards or social updates.',
        growth: 'For families who want a beautiful session and a gallery to share.',
        premium: 'For families who want the full portrait experience with prints and keepsakes to display.',
      },
      retainer: {
        starter: 'For families who want a quick session for holiday cards or social updates.',
        growth: 'For families who want a beautiful session and a gallery to share.',
        premium: 'For families who want the full portrait experience with prints and keepsakes to display.',
      },
    },

    guarantee: 'Sneak peek within 48 hours. Final gallery delivered in 3 weeks max.',
    urgency: 'Limited weekend slots. 2 sessions left this month.',
    brand_color: '#059669',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-pet', name: 'Pet inclusion in session', price: 100, quantity: 1, tooltip: 'Bring the family dog or cat into the session.' },
      { id: 'addon-grandparents', name: 'Extended family group (grandparents, etc.)', price: 150, quantity: 1, tooltip: 'Add grandparents, aunts, uncles, or cousins for a multi-generation portrait.' },
      { id: 'addon-album', name: 'Photo album / coffee-table book', price: 250, quantity: 1, tooltip: 'Bespoke coffee-table book with your favorite photos from the session.' },
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

const PHOTO_REAL_ESTATE = {
  id: 'photo-real-estate',
  industry: 'photography',
  name: 'Real Estate',
  icon: '🏠',
  brand_color: '#ea580c',
  price_range_display: '$200 to $850',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['real-estate'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: 'Full-property photo coverage', tooltip: 'Comprehensive coverage of every key room, exterior angle, and curb appeal shot.' },
      { type: '30 edited high-res photos', tooltip: 'Hand-edited, color-corrected, MLS-ready high-resolution photos.' },
      { type: 'Aerial drone photos', tooltip: 'Cinematic aerial stills of the property and surrounding context.' },
      { type: 'Virtual twilight enhancement', tooltip: 'Digital sky replacement and golden-hour mood applied to your daytime exterior shots.' },
      { type: '360° virtual tour', tooltip: 'Interactive walkthrough tour buyers can explore from your listing page.' },
      { type: 'Floor plan with measurements', tooltip: 'Professionally drawn floor plan with room dimensions, ready for the listing.' },
      { type: 'Neighborhood lifestyle photos', tooltip: 'Curated photos of nearby amenities to help buyers picture the neighborhood.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'MLS + Zillow ready exports',
      'Branded marketing flyer template',
      'Social-ready vertical cuts',
      'Listing description copywriting',
      'Lifetime cloud hosting',
    ],

    starter_deliverables: [
      { type: 'Interior + exterior photo coverage', tooltip: 'Coverage of the main living areas plus key exterior shots.' },
      { type: '12 edited high-res photos', tooltip: 'Hand-edited, color-corrected, MLS-ready high-resolution photos.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'MLS + Zillow ready exports', tooltip: 'Photos formatted and exported for MLS, Zillow, and Realtor.com requirements.' },
    ],

    growth_deliverables: [
      { type: 'Full-property photo coverage', tooltip: 'Comprehensive coverage of every key room, exterior angle, and curb appeal shot.' },
      { type: '20 edited high-res photos', tooltip: 'Hand-edited, color-corrected, MLS-ready high-resolution photos.' },
      { type: 'Aerial drone photos', tooltip: 'Cinematic aerial stills of the property and surrounding context.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'MLS + Zillow ready exports', tooltip: 'Photos formatted and exported for MLS, Zillow, and Realtor.com requirements.' },
      { text: 'Branded marketing flyer template', tooltip: 'Designed flyer template with your photos, branding, and listing details.' },
      { text: 'Social-ready vertical cuts', tooltip: 'Vertical-cropped versions of key photos optimized for IG and TikTok feeds.' },
    ],

    premium_deliverables: [
      { type: 'Full-property photo coverage', tooltip: 'Comprehensive coverage of every key room, exterior angle, and curb appeal shot.' },
      { type: '30 edited high-res photos', tooltip: 'Hand-edited, color-corrected, MLS-ready high-resolution photos.' },
      { type: 'Aerial drone photos', tooltip: 'Cinematic aerial stills of the property and surrounding context.' },
      { type: 'Virtual twilight enhancement', tooltip: 'Digital sky replacement and golden-hour mood applied to your daytime exterior shots.' },
      { type: '360° virtual tour', tooltip: 'Interactive walkthrough tour buyers can explore from your listing page.' },
      { type: 'Floor plan with measurements', tooltip: 'Professionally drawn floor plan with room dimensions, ready for the listing.' },
      { type: 'Neighborhood lifestyle photos', tooltip: 'Curated photos of nearby amenities to help buyers picture the neighborhood.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'MLS + Zillow ready exports', tooltip: 'Photos formatted and exported for MLS, Zillow, and Realtor.com requirements.' },
      { text: 'Branded marketing flyer template', tooltip: 'Designed flyer template with your photos, branding, and listing details.' },
      { text: 'Social-ready vertical cuts', tooltip: 'Vertical-cropped versions of key photos optimized for IG and TikTok feeds.' },
      { text: 'Listing description copywriting', tooltip: 'Professionally written listing description that pairs with your photos.' },
      { text: 'Lifetime cloud hosting', tooltip: 'Your photo gallery stays online forever, even after the listing closes.' },
    ],

    project_duration: '1 day - 4 days',
    duration_min: 1,
    duration_max: 4,
    duration_unit: 'days',

    price_range: '$200-$850',
    price_starter: 200,
    price_growth: 400,
    price_premium: 850,
    price_starter_retainer: 180,
    price_growth_retainer: 360,
    price_premium_retainer: 780,

    pricing_label_onetime: 'listing',
    pricing_label_retainer: 'listing',
    pricing_button_label_onetime: 'One-time',
    pricing_button_label_retainer: '5x Bundle',

    commitment_discount_enabled: true,
    commitment_discount_percent: 10,
    commitment_discount_label: 'Preferred agent (annual)',

    package_names: {
      onetime: { starter: 'Standard', growth: 'Showcase', premium: 'Luxury' },
      retainer: { starter: 'Standard', growth: 'Showcase', premium: 'Luxury' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For agents listing standard residential properties.',
        growth: 'For agents whose listings need extra attention to compete.',
        premium: 'For agents listing high-end properties that demand a complete visual story.',
      },
      retainer: {
        starter: 'For agents listing standard residential properties.',
        growth: 'For agents whose listings need extra attention to compete.',
        premium: 'For agents listing high-end properties that demand a complete visual story.',
      },
    },

    guarantee: 'Edited gallery delivered within 48 hours of your shoot.',
    urgency: 'Limited weekday slots. Book before the next weekend rush.',
    brand_color: '#ea580c',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-twilight', name: 'On-site twilight shoot', price: 200, quantity: 1, tooltip: 'A real golden-hour shoot at the property for premium mood (separate from virtual twilight).' },
      { id: 'addon-rush', name: 'Same-day rush turnaround', price: 150, quantity: 1, tooltip: 'Edited gallery delivered the same day as the shoot.' },
      { id: 'addon-reshoot', name: 'Day-after re-shoot for staging changes', price: 150, quantity: 1, tooltip: 'Return shoot the next day if staging or details change after the first session.' },
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

const VIDEO_CORPORATE = {
  id: 'video-corporate',
  industry: 'videography',
  name: 'Corporate / Testimonial',
  icon: '💼',
  brand_color: '#4f46e5',
  price_range_display: '$3,000 to $25,000',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['corporate'],
    video_types: [],
    desired_results: ['Increase sales'],

    core_deliverables: [
      { type: 'Brand story film (2-3 min)', tooltip: 'Cinematic 2-3 minute hero video telling your company story for the homepage, sales decks, and pitches.' },
      { type: '5 × Testimonial videos', tooltip: 'On-camera customer interviews edited into individual case-study videos.' },
      { type: '12 × Short social cuts (15-30s)', tooltip: 'Repurposed clips for LinkedIn, X, and company social channels.' },
      { type: 'Executive interviews', tooltip: 'On-camera interviews with executives for thought-leadership content (3 min each).' },
      { type: 'Motion graphics package', tooltip: 'Custom animated lower-thirds, transitions, and end cards in your brand style.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Pre-production strategy call',
      'Recruiting highlight reel',
      'Animated thumbnail pack',
      'Caption + subtitle files',
    ],

    starter_deliverables: [
      { type: 'Brand story film (2-3 min)', tooltip: 'Cinematic 2-3 minute hero video telling your company story for the homepage, sales decks, and pitches.' },
      { type: 'Testimonial video', tooltip: 'One on-camera customer interview edited into a case-study video.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Pre-production strategy call', tooltip: 'A planning call to align on positioning, message, shot list, and timeline.' },
    ],

    growth_deliverables: [
      { type: 'Brand story film (2-3 min)', tooltip: 'Cinematic 2-3 minute hero video telling your company story for the homepage, sales decks, and pitches.' },
      { type: '3 × Testimonial videos', tooltip: 'On-camera customer interviews edited into individual case-study videos.' },
      { type: '6 × Short social cuts (15-30s)', tooltip: 'Repurposed clips for LinkedIn, X, and company social channels.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Pre-production strategy call', tooltip: 'A planning call to align on positioning, message, shot list, and timeline.' },
      { text: 'Recruiting highlight reel', tooltip: 'A separate culture-focused reel from your office, ready to use in recruiting funnels.' },
      { text: 'Animated thumbnail pack', tooltip: 'On-brand thumbnail templates for LinkedIn and YouTube to drive clicks.' },
    ],

    premium_deliverables: [
      { type: 'Brand story film (2-3 min)', tooltip: 'Cinematic 2-3 minute hero video telling your company story for the homepage, sales decks, and pitches.' },
      { type: '5 × Testimonial videos', tooltip: 'On-camera customer interviews edited into individual case-study videos.' },
      { type: '12 × Short social cuts (15-30s)', tooltip: 'Repurposed clips for LinkedIn, X, and company social channels.' },
      { type: 'Executive interviews', tooltip: 'On-camera interviews with executives for thought-leadership content (3 min each).' },
      { type: 'Motion graphics package', tooltip: 'Custom animated lower-thirds, transitions, and end cards in your brand style.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Pre-production strategy call', tooltip: 'A planning call to align on positioning, message, shot list, and timeline.' },
      { text: 'Recruiting highlight reel', tooltip: 'A separate culture-focused reel from your office, ready to use in recruiting funnels.' },
      { text: 'Animated thumbnail pack', tooltip: 'On-brand thumbnail templates for LinkedIn and YouTube to drive clicks.' },
      { text: 'Caption + subtitle files', tooltip: 'SRT and VTT subtitle files plus burned-in caption versions for accessibility.' },
    ],

    project_duration: '1 week - 4 weeks',
    duration_min: 1,
    duration_max: 4,
    duration_unit: 'weeks',

    price_range: '$3,000-$25,000',
    price_starter: 3000,
    price_growth: 7500,
    price_premium: 25000,
    price_starter_retainer: 2500,
    price_growth_retainer: 6500,
    price_premium_retainer: 22000,

    pricing_label_onetime: 'project',
    pricing_label_retainer: 'month',
    pricing_button_label_onetime: 'One-time',
    pricing_button_label_retainer: 'Monthly',

    headline: 'Content that scales with your team',
    sub_headline: 'From your first hero video to ongoing monthly production.',

    active_packages: {
      onetime: ['starter', 'growth', 'premium', 'elite'],
      retainer: ['starter', 'growth', 'premium', 'elite'],
    },

    custom_offer_tiers: { elite: true },

    package_names: {
      onetime: { starter: 'Essentials', growth: 'Growth', premium: 'Enterprise', elite: 'Custom' },
      retainer: { starter: 'Essentials', growth: 'Growth', premium: 'Enterprise', elite: 'Custom' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For startups establishing their first visual brand presence.',
        growth: 'For scaling companies building a content engine.',
        premium: 'For established enterprises running ongoing content programs.',
        elite: 'For organizations that need something beyond our standard packages.',
      },
      retainer: {
        starter: 'For startups establishing their first visual brand presence.',
        growth: 'For scaling companies building a content engine.',
        premium: 'For established enterprises running ongoing content programs.',
        elite: 'For organizations that need something beyond our standard packages.',
      },
    },

    guarantee: 'First cut delivered on schedule. If we miss, we credit the next round.',
    urgency: 'Limited Q1 production slots. 3 booking slots left.',
    brand_color: '#4f46e5',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-on-camera-coach', name: 'Executive on-camera coaching', price: 400, quantity: 1, tooltip: 'A coach helps execs prep their delivery, body language, and key talking points before the shoot.' },
      { id: 'addon-drone-hq', name: 'Drone / aerial shots of HQ', price: 500, quantity: 1, tooltip: 'Cinematic aerial shots of your office or campus to elevate establishing scenes.' },
      { id: 'addon-translated-subs', name: 'Translated subtitles (any language)', price: 300, quantity: 1, tooltip: 'Professional translation and subtitle file for one additional language per video.' },
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
        elite: 'https://your-calendar-link.com',
        elite_type: 'book_a_call',
        elite_label: 'Get a custom quote',
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
        elite: 'https://your-calendar-link.com',
        elite_type: 'book_a_call',
        elite_label: 'Get a custom quote',
      },
    },
  },
};

const HVAC_MAINTENANCE = {
  id: 'hvac-maintenance',
  industry: 'hvac',
  name: 'Maintenance Plan',
  icon: '🌡️',
  brand_color: '#0284c7',
  price_range_display: '$9 to $39 / month',
  packageConfig: {
    business_name: 'Your Company',
    niches: ['hvac-maintenance'],
    video_types: [],
    desired_results: ['Increase sales'],

    headline: 'Stay comfortable year-round',
    sub_headline: 'A plan that keeps your system running and your bills low.',

    core_deliverables: [
      { type: '2 seasonal tune-ups', tooltip: 'Spring AC tune-up and fall furnace tune-up performed by a licensed technician.' },
      { type: '20% off all repairs', tooltip: 'Member discount applied to all parts and labor on repair visits.' },
      { type: 'Priority service line', tooltip: 'Skip the queue. Members get same-day or next-day service ahead of non-members.' },
      { type: 'Annual filter replacement', tooltip: 'Filters replaced and matched to your system to keep airflow and air quality optimal.' },
      { type: 'Indoor air quality assessment', tooltip: 'Annual review of humidity, particulates, and ventilation with recommendations.' },
      { type: 'No-overtime weekend coverage', tooltip: 'Weekend and holiday calls billed at standard rates with no overtime fees.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Extended labor warranty',
      'Member loyalty rewards',
      'System upgrade buyback credit',
      'Welcome inspection for new equipment',
    ],

    starter_deliverables: [
      { type: '1 annual tune-up', tooltip: 'One scheduled tune-up per year by a licensed technician.' },
      { type: '10% off repairs', tooltip: 'Member discount applied to all parts and labor on repair visits.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Extended labor warranty', tooltip: 'Extra labor coverage on covered repairs beyond the manufacturer warranty.' },
    ],

    growth_deliverables: [
      { type: '1 annual tune-up', tooltip: 'One scheduled tune-up per year by a licensed technician.' },
      { type: '15% off repairs', tooltip: 'Member discount applied to all parts and labor on repair visits.' },
      { type: 'Priority service line', tooltip: 'Skip the queue. Members get same-day or next-day service ahead of non-members.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Extended labor warranty', tooltip: 'Extra labor coverage on covered repairs beyond the manufacturer warranty.' },
      { text: 'Member loyalty rewards', tooltip: 'Earn rewards on every visit redeemable toward future service or system upgrades.' },
      { text: 'System upgrade buyback credit', tooltip: 'Credit toward a new system if you upgrade with us, scaled to your years as a member.' },
    ],

    premium_deliverables: [
      { type: '2 seasonal tune-ups', tooltip: 'Spring AC tune-up and fall furnace tune-up performed by a licensed technician.' },
      { type: '20% off all repairs', tooltip: 'Member discount applied to all parts and labor on repair visits.' },
      { type: 'Priority service line', tooltip: 'Skip the queue. Members get same-day or next-day service ahead of non-members.' },
      { type: 'Annual filter replacement', tooltip: 'Filters replaced and matched to your system to keep airflow and air quality optimal.' },
      { type: 'Indoor air quality assessment', tooltip: 'Annual review of humidity, particulates, and ventilation with recommendations.' },
      { type: 'No-overtime weekend coverage', tooltip: 'Weekend and holiday calls billed at standard rates with no overtime fees.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Extended labor warranty', tooltip: 'Extra labor coverage on covered repairs beyond the manufacturer warranty.' },
      { text: 'Member loyalty rewards', tooltip: 'Earn rewards on every visit redeemable toward future service or system upgrades.' },
      { text: 'System upgrade buyback credit', tooltip: 'Credit toward a new system if you upgrade with us, scaled to your years as a member.' },
      { text: 'Welcome inspection for new equipment', tooltip: 'Free inspection any time you add new HVAC equipment under your plan.' },
    ],

    project_duration: '1 day - 7 days',
    duration_min: 1,
    duration_max: 7,
    duration_unit: 'days',

    price_range: '$9 to $39 / month',
    price_starter: 9,
    price_growth: 19,
    price_premium: 39,
    price_starter_retainer: 9,
    price_growth_retainer: 19,
    price_premium_retainer: 39,

    pricing_availability: 'retainer',
    pricing_label_onetime: 'month',
    pricing_label_retainer: 'month',
    pricing_button_label_onetime: 'Monthly',
    pricing_button_label_retainer: 'Monthly',
    retainer_discount_text: '',

    commitment_discount_enabled: true,
    commitment_discount_percent: 20,
    commitment_discount_label: 'Pay annually',

    currentDesign: 0,

    package_names: {
      onetime: { starter: 'Comfort', growth: 'Comfort Plus', premium: 'Total Care' },
      retainer: { starter: 'Comfort', growth: 'Comfort Plus', premium: 'Total Care' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For homeowners who want the basics covered.',
        growth: 'For homeowners who want priority service and discount perks.',
        premium: 'For homeowners who want full system protection and zero hassle.',
      },
      retainer: {
        starter: 'For homeowners who want the basics covered.',
        growth: 'For homeowners who want priority service and discount perks.',
        premium: 'For homeowners who want full system protection and zero hassle.',
      },
    },

    guarantee: 'If we miss a scheduled tune-up, we credit your next year\'s plan.',
    urgency: 'Plan enrollment open. Sign up before peak season.',
    brand_color: '#0284c7',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-thermostat', name: 'Smart thermostat installation', price: 300, quantity: 1, tooltip: 'Pro install of a smart thermostat with remote and zoning support.' },
      { id: 'addon-duct-cleaning', name: 'Duct cleaning service', price: 400, quantity: 1, tooltip: 'Full duct system clean to remove dust and debris that hurts airflow and air quality.' },
      { id: 'addon-uv-purifier', name: 'UV air purifier installation', price: 700, quantity: 1, tooltip: 'In-duct UV light system that kills airborne mold, bacteria, and viruses.' },
    ],
    addons_label: 'Add-ons',

    button_links: {
      onetime: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Enroll now',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Enroll now',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Enroll now',
      },
      retainer: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Enroll now',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Enroll now',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Enroll now',
      },
    },
  },
};

const HVAC_INSTALLATION = {
  id: 'hvac-installation',
  industry: 'hvac',
  name: 'System Installation',
  icon: '🏗️',
  brand_color: '#0d9488',
  price_range_display: '$6,500 to $30,000',
  packageConfig: {
    business_name: 'Your Company',
    niches: ['hvac-installation'],
    video_types: [],
    desired_results: ['Increase sales'],

    headline: 'A new system, professionally installed',
    sub_headline: 'From standard upgrades to whole-home comfort.',

    core_deliverables: [
      { type: 'Variable-speed HVAC system', tooltip: 'Top-tier inverter / variable-speed compressor system. Highest efficiency, quietest operation, best comfort.' },
      { type: '12-year parts + labor warranty', tooltip: 'Full parts and labor coverage for 12 years on the installed equipment.' },
      { type: 'Smart Wi-Fi thermostat', tooltip: 'Connected thermostat with remote app control, scheduling, and energy reports.' },
      { type: 'Multi-zone climate control', tooltip: 'Independent temperature control for different areas of your home.' },
      { type: 'Whole-home air purifier', tooltip: 'In-duct purifier that filters allergens, dust, and airborne particles across the whole house.' },
      { type: 'Lifetime annual tune-ups', tooltip: 'Annual maintenance visits at no charge for as long as you own the system.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Manual J load calculation',
      'Pre-install duct inspection',
      'Permits + code compliance',
      'Commissioning report',
    ],

    starter_deliverables: [
      { type: 'Single-stage HVAC system', tooltip: 'Builder-grade single-stage system. Reliable, code-compliant, lower upfront cost.' },
      { type: '5-year parts warranty', tooltip: 'Manufacturer parts warranty for 5 years on the installed equipment.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Manual J load calculation', tooltip: 'Industry-standard load calculation to size your system correctly for the home.' },
    ],

    growth_deliverables: [
      { type: 'Two-stage HVAC system', tooltip: 'Two-stage compressor for better efficiency and quieter operation than single-stage.' },
      { type: '10-year parts + labor warranty', tooltip: 'Both parts and labor covered for 10 years on the installed equipment.' },
      { type: 'Smart Wi-Fi thermostat', tooltip: 'Connected thermostat with remote app control, scheduling, and energy reports.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Manual J load calculation', tooltip: 'Industry-standard load calculation to size your system correctly for the home.' },
      { text: 'Pre-install duct inspection', tooltip: 'Inspection of existing ductwork to identify leaks, sizing issues, or code problems before install.' },
      { text: 'Permits + code compliance', tooltip: 'We pull all permits and ensure inspection passes the first time.' },
    ],

    premium_deliverables: [
      { type: 'Variable-speed HVAC system', tooltip: 'Top-tier inverter / variable-speed compressor system. Highest efficiency, quietest operation, best comfort.' },
      { type: '12-year parts + labor warranty', tooltip: 'Full parts and labor coverage for 12 years on the installed equipment.' },
      { type: 'Smart Wi-Fi thermostat', tooltip: 'Connected thermostat with remote app control, scheduling, and energy reports.' },
      { type: 'Multi-zone climate control', tooltip: 'Independent temperature control for different areas of your home.' },
      { type: 'Whole-home air purifier', tooltip: 'In-duct purifier that filters allergens, dust, and airborne particles across the whole house.' },
      { type: 'Lifetime annual tune-ups', tooltip: 'Annual maintenance visits at no charge for as long as you own the system.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Manual J load calculation', tooltip: 'Industry-standard load calculation to size your system correctly for the home.' },
      { text: 'Pre-install duct inspection', tooltip: 'Inspection of existing ductwork to identify leaks, sizing issues, or code problems before install.' },
      { text: 'Permits + code compliance', tooltip: 'We pull all permits and ensure inspection passes the first time.' },
      { text: 'Commissioning report', tooltip: 'Detailed report verifying every system spec is calibrated correctly after install.' },
    ],

    project_duration: '1 day - 3 days',
    duration_min: 1,
    duration_max: 3,
    duration_unit: 'days',

    price_range: '$6,500-$30,000',
    price_starter: 6500,
    price_growth: 11000,
    price_premium: 30000,

    pricing_availability: 'onetime',
    pricing_label_onetime: 'install',
    pricing_button_label_onetime: 'One-time',

    currentDesign: 1,

    active_packages: {
      onetime: ['starter', 'growth', 'premium', 'elite'],
      retainer: ['starter', 'growth', 'premium', 'elite'],
    },

    custom_offer_tiers: { elite: true },

    package_names: {
      onetime: { starter: 'Standard', growth: 'Performance', premium: 'Elite', elite: 'Custom' },
      retainer: { starter: 'Standard', growth: 'Performance', premium: 'Elite', elite: 'Custom' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For homeowners who need a reliable replacement at the lowest cost.',
        growth: 'For homeowners who want better efficiency, comfort, and a longer warranty.',
        premium: 'For homeowners who want maximum comfort and the most efficient system on the market.',
        elite: 'For complex installs, dual-fuel, ductless, or heat-pump conversions.',
      },
      retainer: {
        starter: 'For homeowners who need a reliable replacement at the lowest cost.',
        growth: 'For homeowners who want better efficiency, comfort, and a longer warranty.',
        premium: 'For homeowners who want maximum comfort and the most efficient system on the market.',
        elite: 'For complex installs, dual-fuel, ductless, or heat-pump conversions.',
      },
    },

    guarantee: 'Permits and inspections handled. We don\'t leave until you\'re 100% comfortable.',
    urgency: 'Limited install slots before peak season.',
    brand_color: '#0d9488',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-humidifier', name: 'Whole-home humidifier', price: 800, quantity: 1, tooltip: 'Whole-home humidifier integrated with the HVAC system for balanced winter humidity.' },
      { id: 'addon-heat-pump', name: 'Heat pump conversion option', price: 4500, quantity: 1, tooltip: 'Upgrade the install to include heat pump for electrification and lower utility bills.' },
      { id: 'addon-extra-zone', name: 'Additional climate zone', price: 1200, quantity: 1, tooltip: 'Adds another independent climate zone with its own thermostat.' },
    ],
    addons_label: 'Add-ons',

    button_links: {
      onetime: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Get a free estimate',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Get a free estimate',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Get a free estimate',
        elite: 'https://your-calendar-link.com',
        elite_type: 'book_a_call',
        elite_label: 'Schedule a consultation',
      },
      retainer: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Get a free estimate',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Get a free estimate',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Get a free estimate',
        elite: 'https://your-calendar-link.com',
        elite_type: 'book_a_call',
        elite_label: 'Schedule a consultation',
      },
    },
  },
};

const HVAC_AIR_QUALITY = {
  id: 'hvac-air-quality',
  industry: 'hvac',
  name: 'Indoor Air Quality',
  icon: '🌬️',
  brand_color: '#22c55e',
  price_range_display: '$500 to $2,800',
  packageConfig: {
    business_name: 'Your Company',
    niches: ['hvac-iaq'],
    video_types: [],
    desired_results: ['Increase sales'],

    headline: 'Cleaner air, healthier home',
    sub_headline: 'Pick the level of indoor air quality that fits your family.',

    core_deliverables: [
      { type: 'Whole-home duct cleaning', tooltip: 'Full system clean to remove dust, pet dander, and debris from supply and return ducts.' },
      { type: 'HEPA filter upgrade', tooltip: 'Higher-grade HEPA filtration upgrade for the existing HVAC system.' },
      { type: 'UV-C sterilization light', tooltip: 'In-duct UV-C light that kills airborne mold, bacteria, and viruses passing through the system.' },
      { type: 'Smart air quality monitor', tooltip: 'Continuous in-home monitoring of humidity, particulates, VOCs, and CO2 with phone alerts.' },
      { type: '3 years of annual IAQ tune-ups', tooltip: 'Annual visit to clean, recalibrate, and replace IAQ components for 3 years.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Sealed duct + airflow test',
      'Allergen reduction guarantee',
      'Carbon monoxide detector setup',
      'Quarterly filter delivery',
    ],

    starter_deliverables: [
      { type: 'Whole-home duct cleaning', tooltip: 'Full system clean to remove dust, pet dander, and debris from supply and return ducts.' },
      { type: 'HEPA filter upgrade', tooltip: 'Higher-grade HEPA filtration upgrade for the existing HVAC system.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Sealed duct + airflow test', tooltip: 'Diagnostic test to identify duct leaks and airflow imbalances after the clean.' },
    ],

    growth_deliverables: [
      { type: 'Whole-home duct cleaning', tooltip: 'Full system clean to remove dust, pet dander, and debris from supply and return ducts.' },
      { type: 'HEPA filter upgrade', tooltip: 'Higher-grade HEPA filtration upgrade for the existing HVAC system.' },
      { type: 'UV-C sterilization light', tooltip: 'In-duct UV-C light that kills airborne mold, bacteria, and viruses passing through the system.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Sealed duct + airflow test', tooltip: 'Diagnostic test to identify duct leaks and airflow imbalances after the clean.' },
      { text: 'Allergen reduction guarantee', tooltip: 'Verified airflow particle reduction post-install or your filter upgrade is on us.' },
      { text: 'Carbon monoxide detector setup', tooltip: 'CO detector calibration and placement check for combustion-fueled equipment.' },
    ],

    premium_deliverables: [
      { type: 'Whole-home duct cleaning', tooltip: 'Full system clean to remove dust, pet dander, and debris from supply and return ducts.' },
      { type: 'HEPA filter upgrade', tooltip: 'Higher-grade HEPA filtration upgrade for the existing HVAC system.' },
      { type: 'UV-C sterilization light', tooltip: 'In-duct UV-C light that kills airborne mold, bacteria, and viruses passing through the system.' },
      { type: 'Smart air quality monitor', tooltip: 'Continuous in-home monitoring of humidity, particulates, VOCs, and CO2 with phone alerts.' },
      { type: '3 years of annual IAQ tune-ups', tooltip: 'Annual visit to clean, recalibrate, and replace IAQ components for 3 years.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Sealed duct + airflow test', tooltip: 'Diagnostic test to identify duct leaks and airflow imbalances after the clean.' },
      { text: 'Allergen reduction guarantee', tooltip: 'Verified airflow particle reduction post-install or your filter upgrade is on us.' },
      { text: 'Carbon monoxide detector setup', tooltip: 'CO detector calibration and placement check for combustion-fueled equipment.' },
      { text: 'Quarterly filter delivery', tooltip: 'Replacement filters mailed to you on schedule, sized to your system.' },
    ],

    project_duration: '1 day - 5 days',
    duration_min: 1,
    duration_max: 5,
    duration_unit: 'days',

    price_range: '$500-$2,800',
    price_starter: 500,
    price_growth: 1200,
    price_premium: 2800,

    pricing_availability: 'onetime',
    pricing_label_onetime: 'project',
    pricing_button_label_onetime: 'One-time',

    currentDesign: 0,

    package_names: {
      onetime: { starter: 'Clean', growth: 'Pure', premium: 'Pristine' },
      retainer: { starter: 'Clean', growth: 'Pure', premium: 'Pristine' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For homeowners who want the basics: cleaner ducts and better filtration.',
        growth: 'For families with allergies, pets, or kids who need cleaner air consistently.',
        premium: 'For homes that need the highest level of air quality and ongoing monitoring.',
      },
      retainer: {
        starter: 'For homeowners who want the basics: cleaner ducts and better filtration.',
        growth: 'For families with allergies, pets, or kids who need cleaner air consistently.',
        premium: 'For homes that need the highest level of air quality and ongoing monitoring.',
      },
    },

    guarantee: 'If you don\'t notice cleaner air in 30 days, we refund your visit.',
    urgency: 'Schedule before allergy season starts.',
    brand_color: '#22c55e',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-dehumidifier', name: 'Whole-home dehumidifier', price: 1200, quantity: 1, tooltip: 'Whole-home dehumidifier integrated with the HVAC for balanced indoor humidity.' },
      { id: 'addon-mold', name: 'Mold remediation visit', price: 800, quantity: 1, tooltip: 'Targeted mold remediation if visible mold is found during inspection.' },
      { id: 'addon-co-smoke', name: 'CO + smoke alarm install', price: 250, quantity: 1, tooltip: 'Hardwired CO and smoke alarm install with code-compliant placement.' },
    ],
    addons_label: 'Add-ons',

    button_links: {
      onetime: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Get a free estimate',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Get a free estimate',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Get a free estimate',
      },
      retainer: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Get a free estimate',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Get a free estimate',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Get a free estimate',
      },
    },
  },
};

const MSP_MANAGED_IT = {
  id: 'msp-managed-it',
  industry: 'msp',
  name: 'Managed IT Services',
  icon: '🛡️',
  brand_color: '#1e40af',
  price_range_display: '$79 to $349 / user / month',
  packageConfig: {
    business_name: 'Your Company',
    niches: ['msp-managed-it'],
    video_types: [],
    desired_results: ['Increase sales'],

    headline: 'Your IT, fully managed',
    sub_headline: 'Predictable monthly pricing that scales with your team.',

    core_deliverables: [
      { type: '24/7 system monitoring', tooltip: 'Round-the-clock monitoring of servers, endpoints, network, and cloud infrastructure with automated alerts and response.' },
      { type: 'Patch + vuln management', tooltip: 'Continuous patching of OS, firmware, and third-party software with vulnerability scanning and remediation.' },
      { type: 'Endpoint protection (EDR)', tooltip: 'Next-gen endpoint detection and response across all user devices and servers.' },
      { type: 'Email + M365 management', tooltip: 'Microsoft 365 license management, email security, MFA enforcement, and tenant hardening.' },
      { type: 'MDR / SOC coverage', tooltip: '24/7 managed detection and response with a dedicated security operations center investigating threats in real time.' },
      { type: 'vCIO + quarterly reviews', tooltip: 'Strategic IT advisor partner. Quarterly reviews covering roadmap, budget, risks, and recommendations.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Onboarding + asset audit',
      'Security awareness training',
      'Annual IT roadmap',
      'NIST / CIS compliance docs',
    ],

    starter_deliverables: [
      { type: 'Business-hours monitoring', tooltip: 'Server, endpoint, and network monitoring during business hours with proactive alerts.' },
      { type: 'Patch management', tooltip: 'OS and third-party software patching on a managed schedule.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Onboarding + asset audit', tooltip: 'Initial IT inventory, documentation, and onboarding included at no extra fee.' },
    ],

    growth_deliverables: [
      { type: '24/7 system monitoring', tooltip: 'Round-the-clock monitoring of servers, endpoints, network, and cloud infrastructure with automated alerts and response.' },
      { type: 'Patch + vuln management', tooltip: 'Continuous patching of OS, firmware, and third-party software with vulnerability scanning and remediation.' },
      { type: 'Endpoint protection (EDR)', tooltip: 'Next-gen endpoint detection and response across all user devices and servers.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Onboarding + asset audit', tooltip: 'Initial IT inventory, documentation, and onboarding included at no extra fee.' },
      { text: 'Security awareness training', tooltip: 'Quarterly phishing simulations and security training for every user.' },
      { text: 'Annual IT roadmap', tooltip: 'A documented IT roadmap aligned to your business goals, refreshed annually.' },
    ],

    premium_deliverables: [
      { type: '24/7 system monitoring', tooltip: 'Round-the-clock monitoring of servers, endpoints, network, and cloud infrastructure with automated alerts and response.' },
      { type: 'Patch + vuln management', tooltip: 'Continuous patching of OS, firmware, and third-party software with vulnerability scanning and remediation.' },
      { type: 'Endpoint protection (EDR)', tooltip: 'Next-gen endpoint detection and response across all user devices and servers.' },
      { type: 'Email + M365 management', tooltip: 'Microsoft 365 license management, email security, MFA enforcement, and tenant hardening.' },
      { type: 'MDR / SOC coverage', tooltip: '24/7 managed detection and response with a dedicated security operations center investigating threats in real time.' },
      { type: 'vCIO + quarterly reviews', tooltip: 'Strategic IT advisor partner. Quarterly reviews covering roadmap, budget, risks, and recommendations.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Onboarding + asset audit', tooltip: 'Initial IT inventory, documentation, and onboarding included at no extra fee.' },
      { text: 'Security awareness training', tooltip: 'Quarterly phishing simulations and security training for every user.' },
      { text: 'Annual IT roadmap', tooltip: 'A documented IT roadmap aligned to your business goals, refreshed annually.' },
      { text: 'NIST / CIS compliance docs', tooltip: 'Documented controls and evidence packages aligned to NIST CSF or CIS controls for audits.' },
    ],

    project_duration: '7 days - 30 days',
    duration_min: 7,
    duration_max: 30,
    duration_unit: 'days',

    price_range: '$79-$349 / user / month',
    price_starter: 79,
    price_growth: 179,
    price_premium: 349,
    price_starter_retainer: 79,
    price_growth_retainer: 179,
    price_premium_retainer: 349,

    pricing_availability: 'retainer',
    pricing_label_onetime: 'user / month',
    pricing_label_retainer: 'user / month',
    pricing_button_label_onetime: 'Monthly',
    pricing_button_label_retainer: 'Monthly',
    retainer_discount_text: '',

    currentDesign: 1,

    active_packages: {
      onetime: ['starter', 'growth', 'premium', 'elite'],
      retainer: ['starter', 'growth', 'premium', 'elite'],
    },

    custom_offer_tiers: { elite: true },

    package_names: {
      onetime: { starter: 'Essential', growth: 'Professional', premium: 'Premier', elite: 'Custom' },
      retainer: { starter: 'Essential', growth: 'Professional', premium: 'Premier', elite: 'Custom' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For small teams that need core IT support and patching.',
        growth: 'For growing teams that need 24/7 coverage and modern endpoint security.',
        premium: 'For organizations that need full security operations, strategic IT, and compliance.',
        elite: 'For complex environments, multi-site, or industry-specific compliance requirements.',
      },
      retainer: {
        starter: 'For small teams that need core IT support and patching.',
        growth: 'For growing teams that need 24/7 coverage and modern endpoint security.',
        premium: 'For organizations that need full security operations, strategic IT, and compliance.',
        elite: 'For complex environments, multi-site, or industry-specific compliance requirements.',
      },
    },

    guarantee: 'If we miss our SLA response time, your next month is on us.',
    urgency: 'Q2 onboarding slots filling. Book your IT assessment.',
    brand_color: '#1e40af',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-bdr', name: 'Backup + disaster recovery', price: 25, quantity: 1, tooltip: 'Image-based backups with off-site replication and tested recovery. Priced per user / month.' },
      { id: 'addon-compliance', name: 'Compliance package (HIPAA / SOC 2)', price: 1500, quantity: 1, tooltip: 'Quarterly attestation work, evidence collection, and audit prep. Flat monthly fee.' },
      { id: 'addon-after-hours', name: 'Dedicated after-hours technician', price: 500, quantity: 1, tooltip: 'Named technician on-call for evenings and weekends. Flat monthly fee.' },
    ],
    addons_label: 'Add-ons',

    button_links: {
      onetime: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Book IT assessment',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Book IT assessment',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Book IT assessment',
        elite: 'https://your-calendar-link.com',
        elite_type: 'book_a_call',
        elite_label: 'Schedule discovery call',
      },
      retainer: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Book IT assessment',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Book IT assessment',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Book IT assessment',
        elite: 'https://your-calendar-link.com',
        elite_type: 'book_a_call',
        elite_label: 'Schedule discovery call',
      },
    },
  },
};

const MSP_CYBERSECURITY = {
  id: 'msp-cybersecurity',
  industry: 'msp',
  name: 'Cybersecurity Services',
  icon: '🔒',
  brand_color: '#7c3aed',
  price_range_display: '$49 to $179 / user / month',
  packageConfig: {
    business_name: 'Your Company',
    niches: ['msp-cybersecurity'],
    video_types: [],
    desired_results: ['Increase sales'],

    headline: 'Security that never sleeps',
    sub_headline: '24/7 protection for every endpoint, email, and identity.',

    core_deliverables: [
      { type: 'Endpoint detection (EDR)', tooltip: 'Next-gen endpoint protection across all user devices and servers with automated containment.' },
      { type: 'Email + phishing protection', tooltip: 'Inbound mail filtering, anti-phishing, MFA enforcement, and impersonation detection.' },
      { type: 'Vulnerability management', tooltip: 'Continuous vulnerability scanning across endpoints, servers, and cloud with prioritized remediation.' },
      { type: 'Managed detection (MDR/SOC)', tooltip: '24/7 SOC analysts triaging alerts, hunting threats, and responding to incidents in real time.' },
      { type: 'Security awareness training', tooltip: 'Quarterly phishing simulations and microlearning modules for every user.' },
      { type: 'Incident response retainer', tooltip: 'Dedicated IR team on standby with a guaranteed response time when an incident is declared.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Annual penetration test',
      'Dark web monitoring',
      'vCISO advisory hours',
      'Compliance attestation prep',
    ],

    starter_deliverables: [
      { type: 'Endpoint detection (EDR)', tooltip: 'Next-gen endpoint protection across all user devices and servers with automated containment.' },
      { type: 'Email + phishing protection', tooltip: 'Inbound mail filtering, anti-phishing, MFA enforcement, and impersonation detection.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Dark web monitoring', tooltip: 'Continuous monitoring of dark web for leaked credentials tied to your domain.' },
    ],

    growth_deliverables: [
      { type: 'Endpoint detection (EDR)', tooltip: 'Next-gen endpoint protection across all user devices and servers with automated containment.' },
      { type: 'Email + phishing protection', tooltip: 'Inbound mail filtering, anti-phishing, MFA enforcement, and impersonation detection.' },
      { type: 'Vulnerability management', tooltip: 'Continuous vulnerability scanning across endpoints, servers, and cloud with prioritized remediation.' },
      { type: 'Managed detection (MDR/SOC)', tooltip: '24/7 SOC analysts triaging alerts, hunting threats, and responding to incidents in real time.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Dark web monitoring', tooltip: 'Continuous monitoring of dark web for leaked credentials tied to your domain.' },
      { text: 'Annual penetration test', tooltip: 'External penetration test performed annually with a remediation report.' },
      { text: 'Security awareness microlearning', tooltip: 'Self-paced security training library available to all users year-round.' },
    ],

    premium_deliverables: [
      { type: 'Endpoint detection (EDR)', tooltip: 'Next-gen endpoint protection across all user devices and servers with automated containment.' },
      { type: 'Email + phishing protection', tooltip: 'Inbound mail filtering, anti-phishing, MFA enforcement, and impersonation detection.' },
      { type: 'Vulnerability management', tooltip: 'Continuous vulnerability scanning across endpoints, servers, and cloud with prioritized remediation.' },
      { type: 'Managed detection (MDR/SOC)', tooltip: '24/7 SOC analysts triaging alerts, hunting threats, and responding to incidents in real time.' },
      { type: 'Security awareness training', tooltip: 'Quarterly phishing simulations and microlearning modules for every user.' },
      { type: 'Incident response retainer', tooltip: 'Dedicated IR team on standby with a guaranteed response time when an incident is declared.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Dark web monitoring', tooltip: 'Continuous monitoring of dark web for leaked credentials tied to your domain.' },
      { text: 'Annual penetration test', tooltip: 'External penetration test performed annually with a remediation report.' },
      { text: 'vCISO advisory hours', tooltip: 'Monthly hours with a virtual CISO for strategy, board reporting, and program design.' },
      { text: 'Compliance attestation prep', tooltip: 'SOC 2, HIPAA, or PCI evidence collection and audit prep support.' },
    ],

    project_duration: '7 days - 21 days',
    duration_min: 7,
    duration_max: 21,
    duration_unit: 'days',

    price_range: '$49-$179 / user / month',
    price_starter: 49,
    price_growth: 99,
    price_premium: 179,
    price_starter_retainer: 49,
    price_growth_retainer: 99,
    price_premium_retainer: 179,

    pricing_availability: 'retainer',
    pricing_label_onetime: 'user / month',
    pricing_label_retainer: 'user / month',
    pricing_button_label_onetime: 'Monthly',
    pricing_button_label_retainer: 'Monthly',
    retainer_discount_text: '',

    currentDesign: 0,

    package_names: {
      onetime: { starter: 'Shield', growth: 'Guard', premium: 'Vault' },
      retainer: { starter: 'Shield', growth: 'Guard', premium: 'Vault' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For teams that need foundational endpoint and email protection.',
        growth: 'For teams that need 24/7 threat detection and continuous vulnerability management.',
        premium: 'For organizations that need full security operations, IR readiness, and compliance support.',
      },
      retainer: {
        starter: 'For teams that need foundational endpoint and email protection.',
        growth: 'For teams that need 24/7 threat detection and continuous vulnerability management.',
        premium: 'For organizations that need full security operations, IR readiness, and compliance support.',
      },
    },

    guarantee: 'If we miss our incident response SLA, your next month is on us.',
    urgency: 'New onboarding cohort opens monthly. Reserve your assessment.',
    brand_color: '#7c3aed',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-phish-sim', name: 'Phishing simulation campaigns', price: 200, quantity: 1, tooltip: 'Custom monthly phishing campaigns with reporting on user click rates and risky behavior.' },
      { id: 'addon-tabletop', name: 'Tabletop exercise + IR plan', price: 1500, quantity: 1, tooltip: 'Facilitated incident response tabletop exercise plus a documented IR plan tailored to your business.' },
      { id: 'addon-cspm', name: 'Cloud security posture (CSPM)', price: 800, quantity: 1, tooltip: 'Continuous cloud config monitoring and misconfiguration remediation across AWS, Azure, GCP, M365.' },
    ],
    addons_label: 'Add-ons',

    button_links: {
      onetime: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Book security assessment',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Book security assessment',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Book security assessment',
      },
      retainer: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Book security assessment',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Book security assessment',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Book security assessment',
      },
    },
  },
};

const MSP_CLOUD_MIGRATION = {
  id: 'msp-cloud-migration',
  industry: 'msp',
  name: 'Cloud Migration',
  icon: '☁️',
  brand_color: '#e11d48',
  price_range_display: '$5,000 to $45,000',
  packageConfig: {
    business_name: 'Your Company',
    niches: ['msp-cloud-migration'],
    video_types: [],
    desired_results: ['Increase sales'],

    headline: 'Move to the cloud, the right way',
    sub_headline: 'From quick lift-and-shift to full modernization.',

    core_deliverables: [
      { type: 'Multi-workload cloud migration', tooltip: 'Full migration of multiple workloads (apps, databases, file shares) to AWS, Azure, or GCP.' },
      { type: 'Network re-architecture', tooltip: 'Redesigned cloud-native network with VPCs, subnets, security groups, and hybrid connectivity.' },
      { type: 'Identity + SSO consolidation', tooltip: 'Consolidated identity provider (Entra ID, Okta) with SSO, MFA, and conditional access.' },
      { type: 'Cost optimization analysis', tooltip: 'Right-sizing review, reserved instance plan, and cost monitoring dashboard.' },
      { type: 'Custom automation + IaC', tooltip: 'Infrastructure-as-Code (Terraform / Bicep) and CI/CD pipelines for repeatable deployments.' },
      { type: '90-day post-migration support', tooltip: 'Dedicated post-migration support window for fixes, tuning, and stabilization.' },
    ],
    additional_assets: [],
    extras_bonuses: [
      'Pre-migration discovery + roadmap',
      'Documentation + runbooks',
      'Knowledge transfer sessions',
      '30-day rollback insurance',
    ],

    starter_deliverables: [
      { type: 'Cloud migration assessment', tooltip: 'Full discovery and assessment of your current environment with a migration plan.' },
      { type: 'Single-workload migration', tooltip: 'Migrate one workload (app, database, or file share) to the cloud.' },
    ],
    starter_assets: [],
    starter_bonuses: [
      { text: 'Pre-migration discovery + roadmap', tooltip: 'Discovery session and documented migration roadmap before any cutover.' },
    ],

    growth_deliverables: [
      { type: 'Cloud migration assessment', tooltip: 'Full discovery and assessment of your current environment with a migration plan.' },
      { type: 'Multi-workload cloud migration', tooltip: 'Full migration of multiple workloads (apps, databases, file shares) to AWS, Azure, or GCP.' },
      { type: 'Network configuration', tooltip: 'Cloud network setup with VPCs, subnets, and basic security groups.' },
      { type: 'Identity + SSO setup', tooltip: 'Identity provider setup with SSO and MFA across migrated workloads.' },
    ],
    growth_assets: [],
    growth_bonuses: [
      { text: 'Pre-migration discovery + roadmap', tooltip: 'Discovery session and documented migration roadmap before any cutover.' },
      { text: 'Documentation + runbooks', tooltip: 'Operational documentation and incident runbooks for the migrated environment.' },
      { text: 'Knowledge transfer sessions', tooltip: 'Live sessions with your team to hand off operational knowledge.' },
    ],

    premium_deliverables: [
      { type: 'Multi-workload cloud migration', tooltip: 'Full migration of multiple workloads (apps, databases, file shares) to AWS, Azure, or GCP.' },
      { type: 'Network re-architecture', tooltip: 'Redesigned cloud-native network with VPCs, subnets, security groups, and hybrid connectivity.' },
      { type: 'Identity + SSO consolidation', tooltip: 'Consolidated identity provider (Entra ID, Okta) with SSO, MFA, and conditional access.' },
      { type: 'Cost optimization analysis', tooltip: 'Right-sizing review, reserved instance plan, and cost monitoring dashboard.' },
      { type: 'Custom automation + IaC', tooltip: 'Infrastructure-as-Code (Terraform / Bicep) and CI/CD pipelines for repeatable deployments.' },
      { type: '90-day post-migration support', tooltip: 'Dedicated post-migration support window for fixes, tuning, and stabilization.' },
    ],
    premium_assets: [],
    premium_bonuses: [
      { text: 'Pre-migration discovery + roadmap', tooltip: 'Discovery session and documented migration roadmap before any cutover.' },
      { text: 'Documentation + runbooks', tooltip: 'Operational documentation and incident runbooks for the migrated environment.' },
      { text: 'Knowledge transfer sessions', tooltip: 'Live sessions with your team to hand off operational knowledge.' },
      { text: '30-day rollback insurance', tooltip: 'Full rollback to your prior environment within 30 days if business impact is detected.' },
    ],

    project_duration: '2 weeks - 12 weeks',
    duration_min: 2,
    duration_max: 12,
    duration_unit: 'weeks',

    price_range: '$5,000-$45,000',
    price_starter: 5000,
    price_growth: 15000,
    price_premium: 45000,

    pricing_availability: 'onetime',
    pricing_label_onetime: 'project',
    pricing_button_label_onetime: 'One-time',

    currentDesign: 1,

    active_packages: {
      onetime: ['starter', 'growth', 'premium', 'elite'],
      retainer: ['starter', 'growth', 'premium', 'elite'],
    },

    custom_offer_tiers: { elite: true },

    package_names: {
      onetime: { starter: 'Lift', growth: 'Shift', premium: 'Modernize', elite: 'Custom' },
      retainer: { starter: 'Lift', growth: 'Shift', premium: 'Modernize', elite: 'Custom' },
    },

    package_descriptions: {
      onetime: {
        starter: 'For teams ready to move a single workload to the cloud quickly.',
        growth: 'For teams migrating multiple workloads with proper network and identity setup.',
        premium: 'For organizations re-architecting for cloud-native scale, automation, and cost control.',
        elite: 'For complex multi-region, regulated, or hybrid migrations with custom requirements.',
      },
      retainer: {
        starter: 'For teams ready to move a single workload to the cloud quickly.',
        growth: 'For teams migrating multiple workloads with proper network and identity setup.',
        premium: 'For organizations re-architecting for cloud-native scale, automation, and cost control.',
        elite: 'For complex multi-region, regulated, or hybrid migrations with custom requirements.',
      },
    },

    guarantee: 'Migration completed on schedule or your discovery fee is refunded.',
    urgency: 'Q2 migration slots filling fast.',
    brand_color: '#e11d48',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 1, retainer: 1 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-dr', name: 'Disaster recovery setup', price: 5000, quantity: 1, tooltip: 'Cross-region or cross-cloud DR setup with documented runbook and tested failover.' },
      { id: 'addon-cost-audit', name: 'Annual cost optimization audit', price: 3500, quantity: 1, tooltip: 'Yearly review of cloud spend with recommendations and reserved instance planning.' },
      { id: 'addon-sec-review', name: 'Cloud security review', price: 4000, quantity: 1, tooltip: 'Independent security review of your cloud environment with prioritized findings.' },
    ],
    addons_label: 'Add-ons',

    button_links: {
      onetime: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Book consultation',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Book consultation',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Book consultation',
        elite: 'https://your-calendar-link.com',
        elite_type: 'book_a_call',
        elite_label: 'Talk to an architect',
      },
      retainer: {
        starter: 'https://your-calendar-link.com',
        starter_type: 'book_a_call',
        starter_label: 'Book consultation',
        growth: 'https://your-calendar-link.com',
        growth_type: 'book_a_call',
        growth_label: 'Book consultation',
        premium: 'https://your-calendar-link.com',
        premium_type: 'book_a_call',
        premium_label: 'Book consultation',
        elite: 'https://your-calendar-link.com',
        elite_type: 'book_a_call',
        elite_label: 'Talk to an architect',
      },
    },
  },
};

export const TEMPLATES_BY_INDUSTRY = {
  photography: [PHOTO_WEDDING, PHOTO_NEWBORN, PHOTO_EVENT, PHOTO_PORTRAIT_FAMILY, PHOTO_REAL_ESTATE],
  videography: [VIDEO_BRAND_COMMERCIAL, VIDEO_REAL_ESTATE, VIDEO_WEDDING, VIDEO_CORPORATE],
  hvac: [HVAC_MAINTENANCE, HVAC_INSTALLATION, HVAC_AIR_QUALITY],
  msp: [MSP_MANAGED_IT, MSP_CYBERSECURITY, MSP_CLOUD_MIGRATION],
};

export function getTemplateById(id) {
  for (const list of Object.values(TEMPLATES_BY_INDUSTRY)) {
    const found = list.find((t) => t.id === id);
    if (found) return found;
  }
  return null;
}
