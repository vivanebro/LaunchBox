import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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

// Real templates per industry — to be filled in next pass.
const TEMPLATES_BY_INDUSTRY = {
  photography: [],
  videography: [],
};

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
          {/* My Templates always first */}
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
            <p className="text-xs text-gray-500">
              {isMine
                ? 'Templates you have saved.'
                : 'Pick a niche to start. Customize from there.'}
            </p>
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
            {/* Template cards rendered here once data exists */}
          </div>
        )}
      </div>
    </div>
  );
}
