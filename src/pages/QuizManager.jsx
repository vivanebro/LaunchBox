import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy, Check, ExternalLink, ClipboardList, Code2, Eye, Users,
    Plus, Trash2, ChevronLeft, Save, Loader2, Edit2, X, AlertCircle
} from 'lucide-react';
import supabaseClient from '@/lib/supabaseClient';

const BASE_URL = window.location.origin;

// ─── Pre-made Templates ───────────────────────────────────────────────────────

const QUIZ_TEMPLATES = [
    {
        _label: 'Wedding Photo/Video',
        _emoji: '💍',
        quiz_name: 'Wedding Media Package',
        welcome_title: "Let's build your perfect wedding package",
        welcome_subtitle: "Answer a few quick questions and we'll put together exactly what you need.",
        welcome_button_text: "Let's go",
        brand_color: '#ff0044',
        cta_type: 'lock_your_spot',
        currency: 'USD',
        questions: [
            { id: 'event_type', type: 'single_select', label: 'What type of event is this?', options: ['Wedding', 'Engagement Session', 'Elopement', 'Other'], required: true },
            { id: 'coverage_hours', type: 'single_select', label: 'How many hours of coverage do you need?', options: ['4 hours', '6 hours', '8 hours', '10+ hours'], required: true, deliverable_key: 'coverage_hours', option_values: [4, 6, 8, 10] },
            { id: 'short_form_videos', type: 'number', label: 'How many short-form videos do you want? (15-60 sec)', min: 0, max: 10, default: 1, deliverable_key: 'short_form_video' },
            { id: 'long_form_video', type: 'single_select', label: 'Do you want a long-form highlight video?', options: ['Yes', 'No'], required: true, deliverable_key: 'long_form_video', option_values: [1, 0] },
            { id: 'photo_count', type: 'single_select', label: 'How many edited photos do you want?', options: ['50 photos', '100 photos', '200 photos', '300+ photos'], required: true, deliverable_key: 'photo_set', option_values: [1, 2, 4, 6] },
            { id: 'raw_footage', type: 'single_select', label: 'Do you want raw footage delivered?', options: ['Yes', 'No'], required: true, deliverable_key: 'raw_footage', option_values: [1, 0] },
        ],
        pricing_config: {
            base_price: 1500,
            deliverables: {
                coverage_hours: { label: 'Hours of coverage', unit_price: 200, unit_label: 'hour' },
                short_form_video: { label: 'Short-form video (15-60s)', unit_price: 300, unit_label: 'video' },
                long_form_video: { label: 'Long-form highlight video', unit_price: 800, unit_label: 'video' },
                photo_set: { label: 'Edited photos (50 per set)', unit_price: 400, unit_label: 'set of 50' },
                raw_footage: { label: 'Raw footage delivery', unit_price: 500, unit_label: 'delivery' },
            },
        },
        tier_config: { starter_multiplier: 0.5, premium_multiplier: 1.2, popular_tier: 'growth' },
    },
    {
        _label: 'Corporate Video',
        _emoji: '🎬',
        quiz_name: 'Corporate Video Production',
        welcome_title: "Let's scope your video project",
        welcome_subtitle: "Tell us about your project and we'll build the right package for you.",
        welcome_button_text: "Get started",
        brand_color: '#2563eb',
        cta_type: 'book_a_call',
        currency: 'USD',
        questions: [
            { id: 'video_length', type: 'single_select', label: 'What length of finished video do you need?', options: ['1-3 minutes', '3-8 minutes', '8+ minutes'], required: true, deliverable_key: 'video_tier', option_values: [1, 2, 3] },
            { id: 'shoot_days', type: 'single_select', label: 'How many shooting days do you need?', options: ['1 day', '2 days', '3+ days'], required: true, deliverable_key: 'shoot_day', option_values: [1, 2, 3] },
            { id: 'interviews', type: 'single_select', label: 'How many interview subjects will there be?', options: ['None', '1-3 people', '4+ people'], required: true, deliverable_key: 'interview', option_values: [0, 2, 4] },
            { id: 'motion_graphics', type: 'single_select', label: 'Do you need motion graphics or animations?', options: ['Yes', 'No'], required: true, deliverable_key: 'motion_graphics', option_values: [1, 0] },
        ],
        pricing_config: {
            base_price: 2000,
            deliverables: {
                video_tier: { label: 'Video complexity tier', unit_price: 600, unit_label: 'tier' },
                shoot_day: { label: 'Shooting day', unit_price: 800, unit_label: 'day' },
                interview: { label: 'Interview subject', unit_price: 400, unit_label: 'person' },
                motion_graphics: { label: 'Motion graphics package', unit_price: 700, unit_label: 'package' },
            },
        },
        tier_config: { starter_multiplier: 0.5, premium_multiplier: 1.2, popular_tier: 'growth' },
    },
    {
        _label: 'Real Estate Photo',
        _emoji: '🏠',
        quiz_name: 'Real Estate Photography Package',
        welcome_title: "Let's quote your property shoot",
        welcome_subtitle: "A few quick questions and we'll have your quote ready instantly.",
        welcome_button_text: "Get my quote",
        brand_color: '#16a34a',
        cta_type: 'lock_your_spot',
        currency: 'USD',
        questions: [
            { id: 'property_size', type: 'single_select', label: 'What is the size of the property?', options: ['Under 1,000 sqft', '1,000–2,500 sqft', '2,500+ sqft'], required: true, deliverable_key: 'size_tier', option_values: [1, 2, 3] },
            { id: 'drone', type: 'single_select', label: 'Do you want aerial drone footage?', options: ['Yes', 'No'], required: true, deliverable_key: 'drone', option_values: [1, 0] },
            { id: 'virtual_tour', type: 'single_select', label: 'Do you want a virtual 3D tour?', options: ['Yes', 'No'], required: true, deliverable_key: 'virtual_tour', option_values: [1, 0] },
            { id: 'video_walkthrough', type: 'single_select', label: 'Do you want a video walkthrough?', options: ['Yes', 'No'], required: true, deliverable_key: 'video_walkthrough', option_values: [1, 0] },
        ],
        pricing_config: {
            base_price: 300,
            deliverables: {
                size_tier: { label: 'Property size tier', unit_price: 100, unit_label: 'tier' },
                drone: { label: 'Aerial drone footage', unit_price: 250, unit_label: 'session' },
                virtual_tour: { label: 'Virtual 3D tour', unit_price: 400, unit_label: 'tour' },
                video_walkthrough: { label: 'Video walkthrough', unit_price: 600, unit_label: 'video' },
            },
        },
        tier_config: { starter_multiplier: 0.5, premium_multiplier: 1.2, popular_tier: 'growth' },
    },
    {
        _label: 'Brand / Headshots',
        _emoji: '📸',
        quiz_name: 'Brand & Headshot Photography',
        welcome_title: "Let's build your brand shoot package",
        welcome_subtitle: "Tell us what you need and we'll put together the perfect session for you.",
        welcome_button_text: "Let's go",
        brand_color: '#7c3aed',
        cta_type: 'book_a_call',
        currency: 'USD',
        questions: [
            { id: 'outfits', type: 'single_select', label: 'How many outfit changes do you want?', options: ['1 look', '2 looks', '3 looks', '4+ looks'], required: true, deliverable_key: 'outfit', option_values: [1, 2, 3, 4] },
            { id: 'photo_count', type: 'single_select', label: 'How many edited photos do you need?', options: ['10 photos', '25 photos', '50 photos', '100+ photos'], required: true, deliverable_key: 'photo_set', option_values: [1, 2, 4, 8] },
            { id: 'hair_makeup', type: 'single_select', label: 'Do you want hair & makeup included?', options: ['Yes', 'No'], required: true, deliverable_key: 'hair_makeup', option_values: [1, 0] },
            { id: 'same_day', type: 'single_select', label: 'Do you need same-day delivery?', options: ['Yes', 'No'], required: true, deliverable_key: 'same_day', option_values: [1, 0] },
        ],
        pricing_config: {
            base_price: 500,
            deliverables: {
                outfit: { label: 'Outfit / look', unit_price: 100, unit_label: 'look' },
                photo_set: { label: 'Edited photos (12 per set)', unit_price: 80, unit_label: 'set of 12' },
                hair_makeup: { label: 'Hair & makeup', unit_price: 250, unit_label: 'session' },
                same_day: { label: 'Same-day delivery', unit_price: 300, unit_label: 'upgrade' },
            },
        },
        tier_config: { starter_multiplier: 0.5, premium_multiplier: 1.2, popular_tier: 'growth' },
    },
    {
        _label: 'Social Media Content',
        _emoji: '📱',
        quiz_name: 'Social Media Content Package',
        welcome_title: "Let's build your content package",
        welcome_subtitle: "Tell us what you post and we'll create the perfect monthly plan.",
        welcome_button_text: "Let's do this",
        brand_color: '#ea580c',
        cta_type: 'apply',
        currency: 'USD',
        questions: [
            { id: 'reels', type: 'single_select', label: 'How many short-form videos (Reels/TikToks) per month?', options: ['2 videos', '4 videos', '8 videos', '12 videos'], required: true, deliverable_key: 'reel', option_values: [2, 4, 8, 12] },
            { id: 'static_posts', type: 'single_select', label: 'How many static posts per month?', options: ['4 posts', '8 posts', '12 posts'], required: true, deliverable_key: 'static_post', option_values: [4, 8, 12] },
            { id: 'captions', type: 'single_select', label: 'Do you want captions written for you?', options: ['Yes', 'No'], required: true, deliverable_key: 'captions', option_values: [1, 0] },
            { id: 'strategy_call', type: 'single_select', label: 'Do you want a monthly strategy call?', options: ['Yes', 'No'], required: true, deliverable_key: 'strategy_call', option_values: [1, 0] },
        ],
        pricing_config: {
            base_price: 500,
            deliverables: {
                reel: { label: 'Short-form video', unit_price: 120, unit_label: 'video' },
                static_post: { label: 'Static post', unit_price: 40, unit_label: 'post' },
                captions: { label: 'Caption writing', unit_price: 200, unit_label: 'month' },
                strategy_call: { label: 'Monthly strategy call', unit_price: 150, unit_label: 'call' },
            },
        },
        tier_config: { starter_multiplier: 0.5, premium_multiplier: 1.2, popular_tier: 'growth' },
    },
    {
        _label: 'Event Photography',
        _emoji: '🎉',
        quiz_name: 'Event Photography Package',
        welcome_title: "Let's quote your event coverage",
        welcome_subtitle: "A couple of questions and your package will be ready instantly.",
        welcome_button_text: "Get my quote",
        brand_color: '#0891b2',
        cta_type: 'lock_your_spot',
        currency: 'USD',
        questions: [
            { id: 'event_hours', type: 'single_select', label: 'How many hours of coverage do you need?', options: ['2 hours', '4 hours', '6 hours', '8+ hours'], required: true, deliverable_key: 'coverage_hours', option_values: [2, 4, 6, 8] },
            { id: 'second_shooter', type: 'single_select', label: 'Do you want a second photographer?', options: ['Yes', 'No'], required: true, deliverable_key: 'second_shooter', option_values: [1, 0] },
            { id: 'slideshow', type: 'single_select', label: 'Do you want a same-day slideshow?', options: ['Yes', 'No'], required: true, deliverable_key: 'slideshow', option_values: [1, 0] },
            { id: 'print_package', type: 'single_select', label: 'Do you want a print package?', options: ['Yes', 'No'], required: true, deliverable_key: 'print_package', option_values: [1, 0] },
        ],
        pricing_config: {
            base_price: 800,
            deliverables: {
                coverage_hours: { label: 'Coverage hour', unit_price: 150, unit_label: 'hour' },
                second_shooter: { label: 'Second photographer', unit_price: 600, unit_label: 'booking' },
                slideshow: { label: 'Same-day slideshow', unit_price: 400, unit_label: 'slideshow' },
                print_package: { label: 'Print package', unit_price: 300, unit_label: 'package' },
            },
        },
        tier_config: { starter_multiplier: 0.5, premium_multiplier: 1.2, popular_tier: 'growth' },
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CTA_OPTIONS = [
    { value: 'lock_your_spot', label: 'Lock Your Spot' },
    { value: 'book_a_call', label: 'Book a Call' },
    { value: 'sign_contract', label: 'Sign Contract' },
    { value: 'apply', label: 'Apply' },
];

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'AUD', 'ILS'];

const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const BLANK_DRAFT = {
    quiz_name: '',
    welcome_title: "Let's build your perfect package",
    welcome_subtitle: "Answer a few quick questions and we'll put together exactly what you need.",
    welcome_button_text: "Let's go",
    business_name: '',
    brand_color: '#ff0044',
    cta_type: 'lock_your_spot',
    cta_link: '',
    currency: 'USD',
    tier_config: { starter_multiplier: 0.5, premium_multiplier: 1.2, popular_tier: 'growth' },
    questions: [],
    pricing_config: { base_price: '', deliverables: {} },
    is_active: true,
};

const BLANK_QUESTION = { id: '', type: 'single_select', label: '', required: true, options: [], deliverable_key: '', option_values: [], min: 0, max: 10, default: 0 };

function genId() { return Math.random().toString(36).slice(2, 9); }

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, label }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={async () => {
                try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
            style={copied ? { background: '#f0fdf4', borderColor: '#86efac', color: '#16a34a' } : { background: 'white', borderColor: '#e5e7eb', color: '#6b7280' }}
        >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : label}
        </button>
    );
}

// ─── QuizCard ─────────────────────────────────────────────────────────────────

function QuizCard({ quiz, submissions, onEdit, onDelete }) {
    const quizUrl = `${BASE_URL}/quiz/${quiz.id}`;
    const embedCode = `<iframe src="${quizUrl}?embed=true" width="100%" style="border:0;border-radius:12px;min-height:600px;" scrolling="no" id="launchbox-quiz-${quiz.id}"></iframe>\n<script>(function(){var f=document.getElementById('launchbox-quiz-${quiz.id}');window.addEventListener('message',function(e){if(e.data&&e.data.type==='launchbox:embedHeight'&&typeof e.data.height==='number')f.style.height=Math.max(600,e.data.height)+'px';});})();<\/script>`;
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <motion.div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: (quiz.brand_color || '#ff0044') + '18' }}>
                        <ClipboardList size={20} style={{ color: quiz.brand_color || '#ff0044' }} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">{quiz.quiz_name}</h2>
                        {quiz.business_name && <p className="text-xs text-gray-400">{quiz.business_name}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${quiz.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {quiz.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => onEdit(quiz)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                        <Edit2 size={12} /> Edit
                    </button>
                    {!confirmDelete ? (
                        <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                            <Trash2 size={12} /> Delete
                        </button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-red-500 font-medium">Sure?</span>
                            <button onClick={() => onDelete(quiz.id)} className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600">Yes</button>
                            <button onClick={() => setConfirmDelete(false)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">No</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{submissions}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1"><Users size={11} /> Submissions</p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{(quiz.questions || []).length}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Questions</p>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><ExternalLink size={11} /> Shareable link</p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="flex-1 text-sm text-gray-600 truncate font-mono">{quizUrl}</span>
                        <div className="flex gap-2 flex-shrink-0">
                            <CopyButton text={quizUrl} label="Copy link" />
                            <a href={quizUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all">
                                <Eye size={13} /> Preview
                            </a>
                        </div>
                    </div>
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Code2 size={11} /> Embed on your website</p>
                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <pre className="flex-1 text-xs text-gray-500 whitespace-pre-wrap break-all font-mono leading-relaxed" style={{ maxHeight: 80, overflow: 'hidden' }}>{embedCode.slice(0, 180)}…</pre>
                        <CopyButton text={embedCode} label="Copy embed" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Question Editor ──────────────────────────────────────────────────────────

function QuestionEditor({ question, index, deliverableKeys, onChange, onRemove }) {
    const setField = (key, val) => onChange({ ...question, [key]: val });

    // Options as comma-separated text helper
    const optionsText = (question.options || []).join(', ');
    const setOptionsText = (text) => {
        const opts = text.split(',').map(s => s.trim()).filter(Boolean);
        // Re-sync option_values array length
        const currentVals = question.option_values || [];
        const newVals = opts.map((_, i) => currentVals[i] ?? 0);
        setField('options', opts);
        onChange({ ...question, options: opts, option_values: newVals });
    };

    return (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Question {index + 1}</span>
                <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors"><X size={16} /></button>
            </div>

            {/* Type + Required */}
            <div className="flex gap-3">
                <select
                    value={question.type}
                    onChange={e => setField('type', e.target.value)}
                    className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20"
                >
                    <option value="single_select">Single select</option>
                    <option value="multi_select">Multi select</option>
                    <option value="number">Number</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={!!question.required} onChange={e => setField('required', e.target.checked)} className="rounded" />
                    Required
                </label>
            </div>

            {/* Label */}
            <input
                type="text"
                placeholder="Question text *"
                value={question.label}
                onChange={e => setField('label', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20"
            />

            {/* Options (for select types) */}
            {(question.type === 'single_select' || question.type === 'multi_select') && (
                <div>
                    <input
                        type="text"
                        placeholder="Options (comma-separated): Yes, No, Maybe"
                        value={optionsText}
                        onChange={e => setOptionsText(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20"
                    />
                </div>
            )}

            {/* Deliverable mapping */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-1 block">Deliverable (optional)</label>
                    <select
                        value={question.deliverable_key || ''}
                        onChange={e => setField('deliverable_key', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20"
                    >
                        <option value="">— none —</option>
                        {deliverableKeys.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                </div>
            </div>

            {/* Option values (for single_select with deliverable) */}
            {question.type === 'single_select' && question.deliverable_key && (question.options || []).length > 0 && (
                <div>
                    <label className="text-xs text-gray-400 mb-2 block">Deliverable quantity per option</label>
                    <div className="flex flex-wrap gap-2">
                        {(question.options || []).map((opt, i) => (
                            <label key={i} className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2">
                                <span className="text-gray-500 max-w-[80px] truncate">{opt}:</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={(question.option_values || [])[i] ?? 0}
                                    onChange={e => {
                                        const vals = [...(question.option_values || [])];
                                        vals[i] = Number(e.target.value);
                                        setField('option_values', vals);
                                    }}
                                    className="w-14 text-center border border-gray-200 rounded-lg px-1 py-0.5 text-xs focus:outline-none"
                                />
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Number type fields */}
            {question.type === 'number' && (
                <div className="flex gap-3">
                    <label className="flex-1 text-xs text-gray-500 flex flex-col gap-1">Min<input type="number" value={question.min ?? 0} onChange={e => setField('min', Number(e.target.value))} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none" /></label>
                    <label className="flex-1 text-xs text-gray-500 flex flex-col gap-1">Max<input type="number" value={question.max ?? 10} onChange={e => setField('max', Number(e.target.value))} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none" /></label>
                    <label className="flex-1 text-xs text-gray-500 flex flex-col gap-1">Default<input type="number" value={question.default ?? 0} onChange={e => setField('default', Number(e.target.value))} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none" /></label>
                </div>
            )}
        </div>
    );
}

// ─── DeliverableRow ───────────────────────────────────────────────────────────

function DeliverableRow({ deliverableKey, data, onChange, onRemove }) {
    return (
        <div className="flex gap-2 items-start">
            <input
                type="text"
                placeholder="Key (auto)"
                value={deliverableKey}
                readOnly
                className="w-28 text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-100 text-gray-400 font-mono"
            />
            <input type="text" placeholder="Label *" value={data.label || ''} onChange={e => onChange({ ...data, label: e.target.value })} className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
            <input type="number" placeholder="Unit price" min={0} value={data.unit_price || ''} onChange={e => onChange({ ...data, unit_price: Number(e.target.value) })} className="w-28 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
            <input type="text" placeholder="Unit label" value={data.unit_label || ''} onChange={e => onChange({ ...data, unit_label: e.target.value })} className="w-28 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
            <button onClick={onRemove} className="text-gray-300 hover:text-red-400 mt-2.5 transition-colors flex-shrink-0"><X size={16} /></button>
        </div>
    );
}

// ─── QuizBuilder ──────────────────────────────────────────────────────────────

function QuizBuilder({ initialDraft, editingId, onSave, onCancel }) {
    const [draft, setDraft] = useState(() => initialDraft || BLANK_DRAFT);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    // Track deliverables as ordered array for UI, sync to pricing_config.deliverables object
    const [deliverableList, setDeliverableList] = useState(() => {
        const d = initialDraft?.pricing_config?.deliverables || {};
        return Object.entries(d).map(([key, val]) => ({ key, ...val }));
    });

    const set = (key, val) => setDraft(p => ({ ...p, [key]: val }));

    // Keep pricing_config.deliverables in sync with deliverableList
    const syncDeliverables = (list) => {
        setDeliverableList(list);
        const obj = {};
        list.forEach(({ key, ...rest }) => { if (key) obj[key] = rest; });
        setDraft(p => ({ ...p, pricing_config: { ...p.pricing_config, deliverables: obj } }));
    };

    const applyTemplate = (tpl) => {
        const { _label, _emoji, ...rest } = tpl;
        setDraft({ ...BLANK_DRAFT, ...rest, business_name: draft.business_name || rest.business_name || '', cta_link: draft.cta_link || '' });
        const d = rest.pricing_config?.deliverables || {};
        setDeliverableList(Object.entries(d).map(([key, val]) => ({ key, ...val })));
    };

    const addQuestion = () => {
        set('questions', [...(draft.questions || []), { ...BLANK_QUESTION, id: genId() }]);
    };

    const updateQuestion = (i, q) => {
        const qs = [...draft.questions];
        qs[i] = q;
        set('questions', qs);
    };

    const removeQuestion = (i) => {
        set('questions', draft.questions.filter((_, idx) => idx !== i));
    };

    const addDeliverable = () => {
        syncDeliverables([...deliverableList, { key: `deliverable_${genId()}`, label: '', unit_price: 0, unit_label: '' }]);
    };

    const updateDeliverable = (i, data) => {
        const list = [...deliverableList];
        // Auto-slug key from label if user changes label and key is still auto
        const newKey = data.label ? slugify(data.label) : list[i].key;
        list[i] = { ...data, key: newKey };
        syncDeliverables(list);
    };

    const removeDeliverable = (i) => {
        syncDeliverables(deliverableList.filter((_, idx) => idx !== i));
    };

    const deliverableKeys = deliverableList.map(d => d.key).filter(Boolean);

    const validate = () => {
        if (!draft.quiz_name?.trim()) return 'Quiz name is required.';
        if (!draft.pricing_config?.base_price || Number(draft.pricing_config.base_price) <= 0) return 'Base price must be greater than 0.';
        if (!draft.questions?.length) return 'Add at least one question.';
        return null;
    };

    const handleSave = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setError('');
        setSaving(true);
        try {
            const payload = {
                ...draft,
                pricing_config: {
                    ...draft.pricing_config,
                    base_price: Number(draft.pricing_config.base_price),
                },
            };
            if (editingId) {
                await supabaseClient.entities.QuizConfig.update(editingId, payload);
            } else {
                await supabaseClient.entities.QuizConfig.create(payload);
            }
            onSave();
        } catch (e) {
            console.error('Save quiz error:', e);
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* Back button */}
            <button onClick={onCancel} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                <ChevronLeft size={16} /> Back to quizzes
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">{editingId ? 'Edit Quiz' : 'New Quiz'}</h2>
            <p className="text-gray-500 text-sm mb-8">Configure your client intake quiz. Start from a template or build from scratch.</p>

            {/* Template picker */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Start from a template</p>
                <div className="grid grid-cols-3 gap-3">
                    {QUIZ_TEMPLATES.map((tpl) => (
                        <button
                            key={tpl._label}
                            onClick={() => applyTemplate(tpl)}
                            className="flex items-center gap-2 p-3 rounded-2xl border-2 border-gray-100 hover:border-[#ff0044] hover:bg-red-50 transition-all text-left group"
                        >
                            <span className="text-xl">{tpl._emoji}</span>
                            <span className="text-xs font-medium text-gray-700 group-hover:text-[#ff0044]">{tpl._label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Section 1: Basics */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-6 space-y-4">
                <p className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">1. Basics</p>
                <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
                        Quiz name *
                        <input type="text" value={draft.quiz_name} onChange={e => set('quiz_name', e.target.value)} placeholder="e.g. Wedding Media Package" className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
                        Business name
                        <input type="text" value={draft.business_name || ''} onChange={e => set('business_name', e.target.value)} placeholder="e.g. HEXA Cinema" className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium col-span-2">
                        Welcome title
                        <input type="text" value={draft.welcome_title || ''} onChange={e => set('welcome_title', e.target.value)} className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium col-span-2">
                        Welcome subtitle
                        <input type="text" value={draft.welcome_subtitle || ''} onChange={e => set('welcome_subtitle', e.target.value)} className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
                        Button text
                        <input type="text" value={draft.welcome_button_text || ''} onChange={e => set('welcome_button_text', e.target.value)} className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
                        Brand color
                        <div className="flex items-center gap-2">
                            <input type="color" value={draft.brand_color || '#ff0044'} onChange={e => set('brand_color', e.target.value)} className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5" />
                            <input type="text" value={draft.brand_color || ''} onChange={e => set('brand_color', e.target.value)} placeholder="#ff0044" className="flex-1 text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                        </div>
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
                        CTA button type
                        <select value={draft.cta_type || 'lock_your_spot'} onChange={e => set('cta_type', e.target.value)} className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20">
                            {CTA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
                        CTA link (URL)
                        <input type="url" value={draft.cta_link || ''} onChange={e => set('cta_link', e.target.value)} placeholder="https://calendly.com/..." className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                    </label>
                </div>
            </div>

            {/* Section 2: Questions */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <p className="text-sm font-semibold text-gray-700">2. Questions</p>
                    <button onClick={addQuestion} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all">
                        <Plus size={13} /> Add question
                    </button>
                </div>
                {(draft.questions || []).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No questions yet. Click "Add question" or pick a template above.</p>
                ) : (
                    <div className="space-y-3">
                        {(draft.questions || []).map((q, i) => (
                            <QuestionEditor
                                key={q.id || i}
                                question={q}
                                index={i}
                                deliverableKeys={deliverableKeys}
                                onChange={(updated) => updateQuestion(i, updated)}
                                onRemove={() => removeQuestion(i)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Section 3: Pricing */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-6 space-y-4">
                <p className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">3. Pricing</p>

                <div className="grid grid-cols-4 gap-4">
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium col-span-2">
                        Base price * <span className="font-normal text-gray-400">(before add-ons)</span>
                        <input type="number" min={0} value={draft.pricing_config?.base_price || ''} onChange={e => set('pricing_config', { ...draft.pricing_config, base_price: e.target.value })} placeholder="e.g. 1500" className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
                        Currency
                        <select value={draft.currency || 'USD'} onChange={e => set('currency', e.target.value)} className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20">
                            {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                    <div /> {/* spacer */}
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
                        Starter multiplier
                        <input type="number" step={0.1} min={0.1} max={1} value={draft.tier_config?.starter_multiplier ?? 0.5} onChange={e => set('tier_config', { ...draft.tier_config, starter_multiplier: Number(e.target.value) })} className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                    </label>
                    <label className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
                        Premium multiplier
                        <input type="number" step={0.1} min={1} max={3} value={draft.tier_config?.premium_multiplier ?? 1.2} onChange={e => set('tier_config', { ...draft.tier_config, premium_multiplier: Number(e.target.value) })} className="text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20" />
                    </label>
                </div>

                {/* Deliverables */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deliverables (add-ons)</p>
                        <button onClick={addDeliverable} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:bg-gray-700 transition-all">
                            <Plus size={13} /> Add deliverable
                        </button>
                    </div>

                    {deliverableList.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No deliverables yet. Each deliverable maps to a question to calculate pricing.</p>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-[112px_1fr_112px_112px_24px] gap-2 text-xs text-gray-400 font-medium px-1">
                                <span>Key</span><span>Label</span><span>Unit price</span><span>Unit label</span><span />
                            </div>
                            {deliverableList.map((d, i) => (
                                <DeliverableRow
                                    key={i}
                                    deliverableKey={d.key}
                                    data={d}
                                    onChange={(updated) => updateDeliverable(i, updated)}
                                    onRemove={() => removeDeliverable(i)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Error + Save */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
                    <AlertCircle size={16} /> {error}
                </div>
            )}
            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #ff0044, #cc0033)' }}
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving…' : editingId ? 'Update Quiz' : 'Create Quiz'}
                </button>
                <button onClick={onCancel} className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-all">
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── Main QuizManager Page ────────────────────────────────────────────────────

export default function QuizManager() {
    const [quizzes, setQuizzes] = useState([]);
    const [submissionCounts, setSubmissionCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [builderOpen, setBuilderOpen] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null); // null = new, object = editing

    const loadQuizzes = async () => {
        setLoading(true);
        try {
            const configs = await supabaseClient.asServiceRole.entities.QuizConfig.list('-created_date');
            setQuizzes(configs || []);
            if (configs?.length) {
                const counts = {};
                await Promise.all(configs.map(async (q) => {
                    try {
                        const subs = await supabaseClient.asServiceRole.entities.QuizSubmission.filter({ quiz_id: q.id }, null);
                        counts[q.id] = (subs || []).length;
                    } catch { counts[q.id] = 0; }
                }));
                setSubmissionCounts(counts);
            }
        } catch (err) {
            console.error('QuizManager load error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadQuizzes(); }, []);

    const openNew = () => { setEditingQuiz(null); setBuilderOpen(true); };
    const openEdit = (quiz) => { setEditingQuiz(quiz); setBuilderOpen(true); };
    const closeBuilder = () => { setBuilderOpen(false); setEditingQuiz(null); };

    const handleSaved = () => { closeBuilder(); loadQuizzes(); };

    const handleDelete = async (id) => {
        try {
            await supabaseClient.entities.QuizConfig.delete(id);
            setQuizzes(prev => prev.filter(q => q.id !== id));
        } catch (e) {
            console.error('Delete quiz error:', e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#ff0044] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F5F7' }}>
            <AnimatePresence mode="wait">
                {builderOpen ? (
                    <motion.div key="builder" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                        <QuizBuilder
                            initialDraft={editingQuiz ? { ...editingQuiz } : null}
                            editingId={editingQuiz?.id || null}
                            onSave={handleSaved}
                            onCancel={closeBuilder}
                        />
                    </motion.div>
                ) : (
                    <motion.div key="list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="max-w-3xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-1">Client Quiz</h1>
                                <p className="text-gray-500">Share your quiz link with clients — they get a tailored package set without you being there.</p>
                            </div>
                            <button
                                onClick={openNew}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90 shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #ff0044, #cc0033)' }}
                            >
                                <Plus size={16} /> New Quiz
                            </button>
                        </div>

                        {/* Quiz list */}
                        {quizzes.length === 0 ? (
                            <motion.div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <ClipboardList size={40} className="text-gray-300 mx-auto mb-4" />
                                <h3 className="font-semibold text-gray-700 mb-1">No quizzes yet</h3>
                                <p className="text-sm text-gray-400 mb-6">Create your first quiz to start closing clients in their sleep.</p>
                                <button onClick={openNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #ff0044, #cc0033)' }}>
                                    <Plus size={15} /> Create your first quiz
                                </button>
                            </motion.div>
                        ) : (
                            <div className="space-y-6">
                                {quizzes.map((quiz) => (
                                    <QuizCard
                                        key={quiz.id}
                                        quiz={quiz}
                                        submissions={submissionCounts[quiz.id] ?? 0}
                                        onEdit={openEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
