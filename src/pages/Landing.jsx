import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createPageUrl } from '@/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const BRAND = '#ff0044';
const IG_URL = 'https://instagram.com/avivbenor';

const NICHES = {
  Photographer: { variants: ['Wedding', 'Newborn', 'Portrait', 'Real Estate'] },
  Videographer: { variants: ['Brand', 'Real Estate', 'Wedding', 'Corporate'] },
  MSP: { variants: ['Managed IT', 'Cybersecurity', 'Cloud Migration'] },
  HVAC: { variants: ['Maintenance Plan', 'System Install', 'Air Quality'] },
  Coach: { variants: ['1-on-1 Coaching', 'Group Program', 'Mastermind'] },
};

const VARIANT_DATA = {
  Wedding: {
    base: 3500,
    tiers: [
      { name: 'Essential', mult: 0.6, items: ['6 hours coverage', '300 edited photos', 'Online gallery'] },
      { name: 'Signature', mult: 1.0, items: ['8 hours coverage', '500 edited photos', 'Online gallery', 'Engagement session', 'Print release'] },
      { name: 'Heirloom', mult: 1.8, items: ['10 hours coverage', '700+ edited photos', 'Premium album', '2 photographers', 'Wall art print'] },
    ],
  },
  Newborn: {
    base: 600,
    tiers: [
      { name: 'Mini', mult: 0.6, items: ['1 hour session', '15 edited photos', 'Online gallery'] },
      { name: 'Classic', mult: 1.0, items: ['2 hour session', '30 edited photos', 'Online gallery', '5 prints'] },
      { name: 'Heirloom', mult: 1.8, items: ['3 hour session', '50+ edited photos', 'Keepsake album', 'Wall art', 'Family portraits'] },
    ],
  },
  Portrait: {
    base: 500,
    tiers: [
      { name: 'Solo', mult: 0.6, items: ['45 min session', '15 edited photos', 'Online gallery'] },
      { name: 'Family', mult: 1.0, items: ['90 min session', '30 edited photos', 'Online gallery', '2 outfits'] },
      { name: 'Premium', mult: 1.8, items: ['2 hour session', '50+ edited photos', 'Multiple locations', 'Wall art', 'Print release'] },
    ],
  },
  'Real Estate': {
    base: 400,
    tiers: [
      { name: 'Listing', mult: 0.6, items: ['Up to 25 photos', 'Same-day delivery', 'MLS-ready'] },
      { name: 'Premium', mult: 1.0, items: ['40+ photos', 'Drone shots', 'Twilight exterior', '24h turnaround'] },
      { name: 'Luxury', mult: 1.8, items: ['60+ photos', 'Drone + video tour', '3D walkthrough', 'Same-day delivery', 'Brochure-ready'] },
    ],
  },
  Brand: {
    base: 5000,
    tiers: [
      { name: 'Reel', mult: 0.6, items: ['1 short-form video', 'Half-day shoot', '1 round revisions'] },
      { name: 'Campaign', mult: 1.0, items: ['3 short-form videos', 'Full-day shoot', '2 rounds revisions', 'Social cutdowns'] },
      { name: 'Signature', mult: 1.8, items: ['Hero + 5 cutdowns', '2-day shoot', 'Unlimited revisions', 'Stills bundle', 'Strategy call'] },
    ],
  },
  Corporate: {
    base: 4000,
    tiers: [
      { name: 'Single', mult: 0.6, items: ['1 testimonial video', 'Half-day shoot', '1 round revisions'] },
      { name: 'Team', mult: 1.0, items: ['3 testimonials', 'Full-day shoot', '2 rounds revisions', 'Subtitles'] },
      { name: 'Suite', mult: 1.8, items: ['5+ testimonials', '2-day shoot', 'Unlimited revisions', 'B-roll library', 'Reels package'] },
    ],
  },
  'Managed IT': {
    base: 1200,
    tiers: [
      { name: 'Core', mult: 0.6, items: ['24/7 monitoring', 'Patch management', 'Email support'] },
      { name: 'Pro', mult: 1.0, items: ['Everything in Core', 'Help desk', 'Backup + recovery', 'Quarterly review'] },
      { name: 'Enterprise', mult: 1.8, items: ['Everything in Pro', 'On-site support', 'vCIO strategy', 'Compliance reporting', 'Priority response'] },
    ],
  },
  Cybersecurity: {
    base: 1500,
    tiers: [
      { name: 'Shield', mult: 0.6, items: ['Endpoint protection', 'Email security', 'Monthly scan'] },
      { name: 'Fortress', mult: 1.0, items: ['Everything in Shield', 'SIEM monitoring', 'Phishing simulations', 'Quarterly audit'] },
      { name: 'Bunker', mult: 1.8, items: ['Everything in Fortress', '24/7 SOC', 'Incident response', 'Compliance reporting', 'Annual pen test'] },
    ],
  },
  'Cloud Migration': {
    base: 8000,
    tiers: [
      { name: 'Lift', mult: 0.6, items: ['Discovery + plan', '1 workload migration', '30-day support'] },
      { name: 'Shift', mult: 1.0, items: ['Everything in Lift', 'Up to 5 workloads', '90-day support', 'Cost optimization'] },
      { name: 'Transform', mult: 1.8, items: ['Full environment migration', 'Re-architecture', '6-month support', 'Training + handoff'] },
    ],
  },
  'Maintenance Plan': {
    base: 200,
    tiers: [
      { name: 'Basic', mult: 0.6, items: ['1 tune-up/year', 'Filter replacement', '10% repair discount'] },
      { name: 'Comfort', mult: 1.0, items: ['2 tune-ups/year', 'Filter replacement', '15% repair discount', 'Priority scheduling'] },
      { name: 'Premier', mult: 1.8, items: ['2 tune-ups/year', 'Filters included', '20% repair discount', 'No overtime fees', 'Free service calls'] },
    ],
  },
  'System Install': {
    base: 6000,
    tiers: [
      { name: 'Standard', mult: 0.6, items: ['Single-stage system', '5-year warranty', 'Standard install'] },
      { name: 'High-Efficiency', mult: 1.0, items: ['Two-stage system', '10-year warranty', 'Smart thermostat'] },
      { name: 'Premium', mult: 1.8, items: ['Variable-speed system', 'Lifetime warranty', 'Smart thermostat', 'Air purifier', 'Maintenance plan'] },
    ],
  },
  'Air Quality': {
    base: 800,
    tiers: [
      { name: 'Check', mult: 0.6, items: ['Air quality test', 'Filter upgrade', 'Recommendations report'] },
      { name: 'Improve', mult: 1.0, items: ['Air quality test', 'UV light install', 'HEPA upgrade', 'Duct cleaning'] },
      { name: 'Restore', mult: 1.8, items: ['Full duct cleaning', 'UV + HEPA system', 'Whole-home purifier', 'Humidifier', '1-year follow-up'] },
    ],
  },
  '1-on-1 Coaching': {
    base: 1000,
    tiers: [
      { name: 'Spark', mult: 0.6, items: ['4 sessions', 'Email support', 'Goal-setting workbook'] },
      { name: 'Momentum', mult: 1.0, items: ['8 sessions', 'WhatsApp access', 'Custom action plan', 'Mid-point review'] },
      { name: 'Transform', mult: 1.8, items: ['12 sessions', 'Daily WhatsApp', 'Custom curriculum', 'Resource library', '6-month follow-up'] },
    ],
  },
  'Group Program': {
    base: 600,
    tiers: [
      { name: 'Self-Study', mult: 0.6, items: ['Course access', 'Community forum', 'Worksheets'] },
      { name: 'Cohort', mult: 1.0, items: ['Course + live calls', '8-week cohort', 'Q&A sessions', 'Workbook'] },
      { name: 'VIP', mult: 1.8, items: ['Cohort + 1-on-1s', '3 private sessions', 'Voxer access', 'Bonus modules', 'Lifetime access'] },
    ],
  },
  Mastermind: {
    base: 5000,
    tiers: [
      { name: 'Member', mult: 0.6, items: ['Monthly group calls', 'Private community', 'Resource library'] },
      { name: 'Inner Circle', mult: 1.0, items: ['Monthly calls + 1-on-1', '2 in-person events', 'Hot seats', 'Voxer access'] },
      { name: 'Founder', mult: 1.8, items: ['Weekly access', '4 in-person retreats', 'Personal advisory', 'Done-with-you projects', 'Network introductions'] },
    ],
  },
};

const fmtPrice = (n) => '$' + Math.round(n / 5) * 5;

const goToWelcome = () => {
  window.location.href = createPageUrl('Welcome');
};

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="font-black text-xl tracking-tight text-slate-900">
          Launch<span style={{ color: BRAND }}>Box</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToWelcome}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Log in
          </button>
          <button
            onClick={goToWelcome}
            className="text-sm font-semibold text-white px-4 py-2 rounded-lg"
            style={{ backgroundColor: BRAND }}
          >
            Start free trial
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div
          className="inline-block text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full mb-6"
          style={{ backgroundColor: '#FFF0F4', color: BRAND }}
        >
          Early adopter pricing — locked for 12 months
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.05] max-w-4xl mx-auto">
          Turn your services into packages.
          <br />
          <span style={{ color: BRAND }}>Charge more. Close more.</span> In half the time.
        </h1>
        <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          THE package builder for service businesses. Drag, drop, send, get paid.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => scrollToId('demo')}
            className="text-base font-semibold text-white px-7 py-4 rounded-xl shadow-lg hover:shadow-xl transition"
            style={{ backgroundColor: BRAND }}
          >
            Build my first package free →
          </button>
          <button
            onClick={() => scrollToId('pricing')}
            className="text-base font-semibold text-slate-700 px-7 py-4 rounded-xl border border-slate-300 hover:border-slate-400 transition"
          >
            See pricing
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-500">7-day free trial · No credit card required</p>
      </div>
    </section>
  );
}

function DemoAnimation() {
  return (
    <section id="demo" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 text-center">
          See it in action
        </h2>
        <p className="mt-3 text-lg text-slate-600 text-center">Branded packages your clients actually click.</p>

        <div className="mt-12 relative bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-2xl" style={{ aspectRatio: '16 / 9' }}>
          <img src="/landing-demo/01-templates.png" alt="LaunchBox Templates page" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
    </section>
  );
}

function Shift() {
  return (
    <section className="py-24 bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-xs font-semibold tracking-wider uppercase mb-4 text-center" style={{ color: BRAND }}>
          The shift
        </div>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-center leading-tight">
          When you send a <span className="line-through opacity-60">quote</span>, clients compare you to competitors.
          <br />
          When you send <span style={{ color: BRAND }}>packages</span>, they compare the options to each other.
        </h2>
        <p className="mt-8 text-lg text-slate-300 text-center max-w-2xl mx-auto">
          Higher close rate. Zero negotiation. Bigger average deal.
        </p>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {[
            { stat: 'Higher', label: 'close rate' },
            { stat: 'Bigger', label: 'avg deal size' },
            { stat: 'Less', label: 'back-and-forth' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 text-center">
              <div className="text-3xl font-black" style={{ color: BRAND }}>{s.stat}</div>
              <div className="mt-1 text-slate-300 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '1',
      title: 'Pick a template',
      body: 'Start from a battle-tested template built for your industry, or from scratch.',
    },
    {
      n: '2',
      title: 'Customize in minutes',
      body: 'Tweak deliverables, prices, and tier names. Add your brand. Done.',
    },
    {
      n: '3',
      title: 'Send + get paid',
      body: 'Share a link. Client picks a tier. You sign the contract and collect.',
    },
  ];
  return (
    <section id="how" className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 text-center">
          How it works
        </h2>
        <p className="mt-3 text-lg text-slate-600 text-center">From blank page to sent in under 10 minutes.</p>
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="bg-white rounded-2xl p-8 border border-slate-200">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white mb-4"
                style={{ backgroundColor: BRAND }}
              >
                {s.n}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ROICalc() {
  const [hours, setHours] = useState(2);
  const [price, setPrice] = useState(2500);
  const [closeRate, setCloseRate] = useState(20);
  const [quotesPerWeek, setQuotesPerWeek] = useState(5);

  const newCloseRate = Math.min(100, closeRate * 1.4);
  const weeklyQuotes = quotesPerWeek;
  const oldRevenue = weeklyQuotes * (closeRate / 100) * price * 4;
  const newRevenue = weeklyQuotes * (newCloseRate / 100) * price * 1.15 * 4;
  const lift = newRevenue - oldRevenue;
  const hoursSaved = weeklyQuotes * hours * 0.6 * 4;

  const fmtUsd = (n) => '$' + Math.round(n).toLocaleString();

  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 text-center">
          Run the numbers
        </h2>
        <p className="mt-3 text-lg text-slate-600 text-center">
          Drop in your basics. See what packages do to your month.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-8 bg-slate-50 rounded-3xl border border-slate-200 p-8 md:p-10">
          <div className="space-y-6">
            <Field label="Hours per quote" suffix="hrs">
              <input type="range" min="0.5" max="6" step="0.5" value={hours} onChange={(e) => setHours(parseFloat(e.target.value))} className="w-full" style={{ accentColor: BRAND }} />
              <div className="text-2xl font-bold text-slate-900 mt-1">{hours} hrs</div>
            </Field>
            <Field label="Average project price">
              <input type="range" min="500" max="20000" step="100" value={price} onChange={(e) => setPrice(parseInt(e.target.value))} className="w-full" style={{ accentColor: BRAND }} />
              <div className="text-2xl font-bold text-slate-900 mt-1">{fmtUsd(price)}</div>
            </Field>
            <Field label="Current close rate">
              <input type="range" min="5" max="80" step="1" value={closeRate} onChange={(e) => setCloseRate(parseInt(e.target.value))} className="w-full" style={{ accentColor: BRAND }} />
              <div className="text-2xl font-bold text-slate-900 mt-1">{closeRate}%</div>
            </Field>
            <Field label="Quotes you send per week">
              <input type="range" min="1" max="30" step="1" value={quotesPerWeek} onChange={(e) => setQuotesPerWeek(parseInt(e.target.value))} className="w-full" style={{ accentColor: BRAND }} />
              <div className="text-2xl font-bold text-slate-900 mt-1">{quotesPerWeek} per week</div>
            </Field>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-center">
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-4">
              With LaunchBox, every month
            </div>
            <div>
              <div className="text-sm text-slate-600">Extra revenue</div>
              <div className="text-5xl font-black mt-1" style={{ color: BRAND }}>+{fmtUsd(lift)}</div>
            </div>
            <div className="mt-8">
              <div className="text-sm text-slate-600">Hours saved on quoting</div>
              <div className="text-3xl font-black text-slate-900 mt-1">{Math.round(hoursSaved)} hrs</div>
            </div>
            <p className="mt-8 text-xs text-slate-500">
              Estimate based on close-rate lift from tier comparison + 15% larger avg deal from anchoring + 60% time saved per quote.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, suffix, children }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-700 mb-1">{label}</div>
      {children}
    </div>
  );
}

function Pricing() {
  const tiers = [
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      blurb: 'For solo operators just getting set up.',
      features: ['Unlimited packages', 'Branded share links', 'Email support'],
      cta: 'Start free trial',
      featured: false,
    },
    {
      name: 'Pro',
      price: '$49',
      period: '/month',
      blurb: 'For service businesses sending quotes weekly.',
      features: [
        'Everything in Starter',
        'Contracts + e-signature',
        'Pipeline analytics',
        'Priority support',
      ],
      cta: 'Start free trial',
      featured: true,
    },
    {
      name: 'Agency',
      price: '$199',
      period: '/month',
      blurb: 'For teams and agencies running multiple brands.',
      features: [
        'Everything in Pro',
        'Multi-brand workspaces',
        'Team seats',
        'Dedicated success manager',
      ],
      cta: 'Start free trial',
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 text-center">
          Simple pricing. Lock it in.
        </h2>
        <p className="mt-3 text-lg text-slate-600 text-center">
          Early adopters keep this rate for 12 months.
        </p>
        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl p-8 border transition ${
                t.featured
                  ? 'border-2 shadow-xl scale-[1.02] bg-white'
                  : 'border-slate-200 bg-white'
              }`}
              style={t.featured ? { borderColor: BRAND } : {}}
            >
              {t.featured && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-900">{t.name}</h3>
              <div className="mt-3 flex items-baseline">
                <span className="text-5xl font-black text-slate-900">{t.price}</span>
                <span className="ml-1 text-slate-500">{t.period}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{t.blurb}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span style={{ color: BRAND }} className="font-bold mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={goToWelcome}
                className={`mt-8 w-full py-3 rounded-lg font-semibold transition ${
                  t.featured
                    ? 'text-white shadow-md hover:shadow-lg'
                    : 'text-slate-900 border border-slate-300 hover:border-slate-400'
                }`}
                style={t.featured ? { backgroundColor: BRAND } : {}}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          7-day free trial · Cancel anytime · No credit card to start
        </p>
      </div>
    </section>
  );
}

function TemplateGallery() {
  const niches = [
    { emoji: '📷', name: 'Photography', count: '5 templates', samples: ['Wedding', 'Newborn', 'Real Estate'] },
    { emoji: '🎬', name: 'Videography', count: '4 templates', samples: ['Brand', 'Wedding', 'Corporate'] },
    { emoji: '🔧', name: 'HVAC', count: '3 templates', samples: ['Maintenance', 'Install', 'Air Quality'] },
    { emoji: '💻', name: 'MSP / IT', count: '3 templates', samples: ['Managed IT', 'Cybersecurity', 'Cloud'] },
  ];
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 text-center">
          Start from a template that already works
        </h2>
        <p className="mt-3 text-lg text-slate-600 text-center">
          15 templates across 4 industries. More added every month.
        </p>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {niches.map((n) => (
            <div key={n.name} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 transition">
              <div className="text-4xl">{n.emoji}</div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{n.name}</h3>
              <div className="text-sm text-slate-500">{n.count}</div>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                {n.samples.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span style={{ color: BRAND }}>·</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-500">
          Don't see your industry? Tell us — we'll build it.
        </p>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: 'Why packages instead of custom quotes?',
      a: 'When you send a quote, clients compare you to competitors. When you send packages, they compare the options to each other. Higher close rate. Zero negotiation.',
    },
    {
      q: 'How long does setup take?',
      a: 'Most users send their first package within 10 minutes. Pick a template, swap in your services and prices, share the link.',
    },
    {
      q: 'Is this for my business?',
      a: 'If you sell services and quote clients, yes. Photographers, videographers, agencies, MSPs, HVAC, bookkeepers, designers, coaches.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. One click in Settings. No call, no form, no fight.',
    },
    {
      q: 'What if I get stuck?',
      a: 'DM us on Instagram or email. Real human, fast reply.',
    },
  ];
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 text-center">
          Common questions
        </h2>
        <div className="mt-10">
          <Accordion type="single" collapsible className="space-y-3">
            {items.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="bg-white rounded-xl border border-slate-200 px-5"
              >
                <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24" style={{ backgroundColor: BRAND }}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
          Stop sending quotes. Start closing packages.
        </h2>
        <p className="mt-4 text-lg text-white/90">
          7-day free trial. Lock the early-adopter rate for 12 months.
        </p>
        <button
          onClick={goToWelcome}
          className="mt-8 text-base font-bold px-8 py-4 rounded-xl bg-white shadow-xl hover:shadow-2xl transition"
          style={{ color: BRAND }}
        >
          Start free trial →
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-10 bg-slate-900 text-slate-400 text-sm">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-bold text-white">
          Launch<span style={{ color: BRAND }}>Box</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="/terms" className="hover:text-white">Terms</a>
          <a href="/privacy" className="hover:text-white">Privacy</a>
          <a href={IG_URL} target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a>
        </div>
      </div>
    </footer>
  );
}

function FloatingIG() {
  return (
    <a
      href={IG_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Message us on Instagram"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-105 transition"
      style={{ backgroundColor: BRAND }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    </a>
  );
}

export default function Landing() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const skip = new URLSearchParams(window.location.search).has('preview');
    if (skip) {
      setCheckingAuth(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        window.location.href = createPageUrl('Dashboard');
      } else {
        setCheckingAuth(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <TopBar />
      <Hero />
      <DemoAnimation />
      <Shift />
      <HowItWorks />
      <TemplateGallery />
      <ROICalc />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
      <FloatingIG />
    </div>
  );
}
