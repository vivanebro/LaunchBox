import React, { useState } from 'react';
import { ChevronLeft, Plus, Star } from 'lucide-react';
import { createPageUrl } from '@/utils';

// Industries shown on the folder index. `ready: true` industries have real
// templates underneath; the rest render a Coming Soon tile.
const INDUSTRIES = [
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

// Brand & Commercial videography template
const VIDEO_BRAND_COMMERCIAL = {
  id: 'video-brand-commercial',
  industry: 'videography',
  name: 'Brand & Commercial',
  icon: '🎬',
  brand_color: '#1F2937',
  price_range_display: '$2,500 — $15,000',
  packageConfig: {
    business_name: 'Your Studio',
    niches: ['brand-commercial'],
    video_types: [],
    desired_results: ['Increase sales'],

    // Full pools (Premium-level content)
    core_deliverables: [
      { type: 'Hero brand video', quantity: 4, length: '60-90s' },
      { type: 'Short-form social clips', quantity: 20, length: '15-30s' },
      { type: 'Behind-the-scenes content', quantity: 1, length: '' },
      { type: 'Royalty-free B-roll library', quantity: 1, length: '' },
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

    // Starter tier
    starter_deliverables: [
      { type: 'Hero brand video', quantity: 1, length: '60-90s' },
      { type: 'Vertical social clips', quantity: 3, length: '15-30s' },
    ],
    starter_assets: [
      'Captions + sound design',
      '1 revision round',
      'Delivered in 4 weeks',
    ],
    starter_bonuses: [
      'Brand sound pack',
    ],

    // Growth (Pro) tier
    growth_deliverables: [
      { type: 'Hero brand video', quantity: 2, length: '60-90s' },
      { type: 'Short-form clips', quantity: 8, length: '15-30s' },
    ],
    growth_assets: [
      'Captions + sound design',
      'Custom motion graphics',
      'Brand strategy session (60 min)',
      '2 revision rounds',
      'Delivered in 2 weeks',
    ],
    growth_bonuses: [
      'Brand sound pack',
      'Custom edits for every platform',
      'Brand video style guide',
    ],

    // Premium tier
    premium_deliverables: [
      { type: 'Hero brand video', quantity: 4, length: '60-90s' },
      { type: 'Short-form clips', quantity: 20, length: '15-30s' },
      { type: 'Behind-the-scenes content', quantity: 1, length: '' },
      { type: 'Royalty-free B-roll library', quantity: 1, length: '' },
    ],
    premium_assets: [
      'Captions + sound design',
      'Custom motion graphics',
      'Brand strategy session (60 min)',
      'Quarterly strategy review',
      'Unlimited revisions',
      'Priority delivery in 10 days',
    ],
    premium_bonuses: [
      'Brand sound pack',
      'Custom edits for every platform',
      'Brand video style guide',
      'Lifetime usage rights',
      'Source files',
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
    brand_color: '#1F2937',
    logo_url: '',
    from_template: true,

    popularPackageIndex: { onetime: 2, retainer: 2 },
    popularBadgeText: 'Most Recommended',

    addons: [
      { id: 'addon-same-day', name: 'Same-day social cut', price: 300 },
      { id: 'addon-localization', name: 'Voiceover and subtitles in another language', price: 600 },
      { id: 'addon-ad-cuts', name: 'Performance ad cuts', price: 400 },
      { id: 'addon-photo-day', name: 'Photography day during shoot', price: 600 },
      { id: 'addon-thumbnails', name: 'Custom thumbnail design pack', price: 200 },
    ],
    addons_label: 'Add-ons',
  },
};

const TEMPLATES_BY_INDUSTRY = {
  photography: [],
  videography: [VIDEO_BRAND_COMMERCIAL],
};

function useTemplate(template) {
  localStorage.setItem('packageConfig', JSON.stringify(template.packageConfig));
  window.location.href = createPageUrl('Results');
}

export default function Templates() {
  const [openFolder, setOpenFolder] = useState(null);

  if (openFolder) {
    return (
      <FolderDrilldown
        folder={openFolder}
        onBack={() => setOpenFolder(null)}
      />
    );
  }

  return <FolderIndex onOpen={setOpenFolder} />;
}

function FolderIndex({ onOpen }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Pick your industry. We'll show you the templates inside.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
          <button
            onClick={() => onOpen({ key: 'mine', name: 'My Templates' })}
            className="bg-white rounded-2xl p-6 hover:shadow-lg transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gray-100 text-gray-700">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">My Templates</h3>
            <p className="text-xs text-gray-500">Templates you saved</p>
          </button>

          {INDUSTRIES.map((industry) => (
            industry.ready ? (
              <button
                key={industry.key}
                onClick={() => onOpen(industry)}
                className="bg-white rounded-2xl p-6 hover:shadow-lg transition-all text-left"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl mb-4"
                  style={{ background: industry.bg }}
                >
                  <span>{industry.icon}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{industry.name}</h3>
                <p className="text-xs text-gray-500">
                  {(TEMPLATES_BY_INDUSTRY[industry.key] || []).length} templates
                </p>
              </button>
            ) : (
              <div
                key={industry.key}
                className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-6 text-left relative"
              >
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wide text-gray-500 bg-white border border-gray-300 px-2 py-0.5 rounded-full">Soon</span>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl mb-4 opacity-50"
                  style={{ background: industry.bg }}
                >
                  <span>{industry.icon}</span>
                </div>
                <h3 className="text-base font-bold text-gray-500 mb-1">{industry.name}</h3>
                <p className="text-xs text-gray-400">Coming soon</p>
              </div>
            )
          ))}

          <button
            onClick={() => alert('Coming soon: tell us which industry to build next.')}
            className="bg-white/40 rounded-2xl border-2 border-dashed border-gray-300 p-6 text-left flex flex-col items-start justify-center hover:bg-white hover:border-gray-400 transition-all"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 bg-gray-100 text-gray-400">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-700 mb-1">More coming soon</h3>
            <p className="text-xs text-gray-500">Tell us what you need →</p>
          </button>
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-gray-500">
            Don't see your industry?{' '}
            <button
              onClick={() => alert('Coming soon: tell us which industry to build next.')}
              className="font-semibold text-gray-900 underline hover:text-[#ff0044]"
            >
              Tell us what to build next →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function FolderDrilldown({ folder, onBack }) {
  const isMine = folder.key === 'mine';
  const templates = isMine ? [] : (TEMPLATES_BY_INDUSTRY[folder.key] || []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-2"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Templates
        </button>
        <div className="flex items-center gap-3 mb-8">
          {isMine ? (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 text-gray-700">
              <Star className="w-5 h-5" />
            </div>
          ) : (
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl"
              style={{ background: folder.bg }}
            >
              <span>{folder.icon}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{folder.name}</h1>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            {isMine ? (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-2">No saved templates yet</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Save any package as a template from the package menu. Reuse it in seconds.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Templates coming soon</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  We're building real, opinionated templates for {folder.name.toLowerCase()}. Check back shortly.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-2xl p-5 hover:shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl mb-3 bg-gray-100">
                  <span>{template.icon}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">{template.name}</h3>
                <p className="text-xs text-gray-700 tabular-nums mb-4">{template.price_range_display}</p>
                <button
                  onClick={() => useTemplate(template)}
                  className="w-full text-xs font-bold text-white py-2 rounded-lg shadow-sm hover:shadow-md"
                  style={{ background: '#ff0044' }}
                >
                  Use template
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
