import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Check, ExternalLink, Trash2, Edit, ChevronDown, ChevronRight, X } from 'lucide-react';
import supabaseClient from '@/lib/supabaseClient';
import UnsavedChangesGuard from '@/lib/UnsavedChangesGuard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50);
}

// Convert simplified UI state → DB schema (runs on save)
function buildDraftPayload(uiDraft) {
    const deliverables = {};
    const questions = (uiDraft.questions || []).map((q, i) => {
        const id = q.id || `q${i}`;

        if (q.ui_type === 'choose_one') {
            const key = slugify(q.label) || `q_${i}`;
            deliverables[key] = { label: q.label, unit_price: 1, unit_label: 'option' };
            return {
                id,
                type: 'single_select',
                label: q.label,
                required: !!q.required,
                deliverable_key: key,
                options: (q.choices || []).map(c => c.label),
                option_values: (q.choices || []).map(c => Number(c.price) || 0),
            };
        }

        if (q.ui_type === 'addons') {
            const key = slugify(q.label) || `q_${i}`;
            deliverables[key] = { label: q.label, unit_price: 1, unit_label: 'item' };
            return {
                id,
                type: 'multi_select',
                label: q.label,
                required: !!q.required,
                deliverable_key: key,
                options: (q.addons || []).map(a => a.label),
                option_values: (q.addons || []).map(a => Number(a.price) || 0),
            };
        }

        if (q.ui_type === 'pick_a_number') {
            const key = slugify(q.label) || `q_${i}`;
            deliverables[key] = { label: q.label, unit_price: Number(q.unit_price) || 0, unit_label: q.unit_label || 'unit' };
            return {
                id,
                type: 'number',
                label: q.label,
                required: !!q.required,
                deliverable_key: key,
                min: q.min ?? 1,
                max: q.max ?? 10,
                default: q.default ?? 1,
            };
        }
        return null;
    }).filter(Boolean);

    return {
        quiz_name: uiDraft.quiz_name,
        business_name: uiDraft.business_name,
        welcome_title: uiDraft.welcome_title,
        welcome_subtitle: uiDraft.welcome_subtitle,
        welcome_button_text: uiDraft.welcome_button_text,
        brand_color: uiDraft.brand_color,
        cta_type: uiDraft.cta_type,
        cta_link: uiDraft.cta_link,
        currency: uiDraft.currency,
        tier_config: {
            starter_multiplier: Number(uiDraft.starter_multiplier) || 0.5,
            premium_multiplier: Number(uiDraft.premium_multiplier) || 1.2,
            popular_tier: 'growth',
        },
        questions,
        pricing_config: {
            base_price: Number(uiDraft.base_price) || 0,
            deliverables,
        },
        is_active: true,
    };
}

// Convert DB schema → simplified UI state (runs when editing)
function parseDraftToUi(dbDraft) {
    const deliverables = dbDraft.pricing_config?.deliverables || {};

    const questions = (dbDraft.questions || []).map(q => {
        if (q.type === 'single_select') {
            return {
                id: q.id,
                ui_type: 'choose_one',
                label: q.label || '',
                required: !!q.required,
                choices: (q.options || []).map((label, i) => ({
                    label,
                    price: q.option_values?.[i] ?? 0,
                })),
            };
        }
        if (q.type === 'multi_select') {
            return {
                id: q.id,
                ui_type: 'addons',
                label: q.label || '',
                required: !!q.required,
                addons: (q.options || []).map((label, i) => ({
                    label,
                    price: q.option_values?.[i] ?? 0,
                })),
            };
        }
        if (q.type === 'number') {
            const del = deliverables[q.deliverable_key] || {};
            return {
                id: q.id,
                ui_type: 'pick_a_number',
                label: q.label || '',
                required: !!q.required,
                unit_price: del.unit_price ?? 0,
                unit_label: del.unit_label || '',
                min: q.min ?? 1,
                max: q.max ?? 10,
                default: q.default ?? 1,
            };
        }
        return null;
    }).filter(Boolean);

    return {
        quiz_name: dbDraft.quiz_name || '',
        business_name: dbDraft.business_name || '',
        welcome_title: dbDraft.welcome_title || "Let's build your perfect package",
        welcome_subtitle: dbDraft.welcome_subtitle || "Answer a few quick questions and we'll put together exactly what you need.",
        welcome_button_text: dbDraft.welcome_button_text || "Let's go",
        brand_color: dbDraft.brand_color || '#ff0044',
        cta_type: dbDraft.cta_type || 'lock_your_spot',
        cta_link: dbDraft.cta_link || '',
        currency: dbDraft.currency || 'USD',
        base_price: dbDraft.pricing_config?.base_price ?? 0,
        starter_multiplier: dbDraft.tier_config?.starter_multiplier ?? 0.5,
        premium_multiplier: dbDraft.tier_config?.premium_multiplier ?? 1.2,
        questions,
    };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLANK_UI_DRAFT = {
    quiz_name: '',
    business_name: '',
    welcome_title: "Let's build your perfect package",
    welcome_subtitle: "Answer a few quick questions and we'll put together exactly what you need.",
    welcome_button_text: "Let's go",
    brand_color: '#ff0044',
    cta_type: 'lock_your_spot',
    cta_link: '',
    currency: 'USD',
    base_price: 0,
    starter_multiplier: 0.5,
    premium_multiplier: 1.2,
    questions: [],
};

const QUIZ_TEMPLATES = [
    {
        _name: 'Wedding Photo/Video', _emoji: '💍',
        quiz_name: 'Wedding Media Package', business_name: '',
        welcome_title: "Let's build your wedding media package",
        welcome_subtitle: "Answer a few quick questions and we'll put together a package that fits your day perfectly.",
        welcome_button_text: "Let's go",
        brand_color: '#ff0044', cta_type: 'lock_your_spot', cta_link: '', currency: 'USD',
        base_price: 1500, starter_multiplier: 0.5, premium_multiplier: 1.2,
        questions: [
            { id: 'q1', ui_type: 'choose_one', label: 'How many hours of coverage?', required: true, choices: [{ label: '4 hours', price: 0 }, { label: '6 hours', price: 400 }, { label: '8 hours', price: 800 }, { label: '10+ hours', price: 1200 }] },
            { id: 'q2', ui_type: 'pick_a_number', label: 'Short-form highlight videos', required: false, unit_price: 300, unit_label: 'video', min: 0, max: 10, default: 2 },
            { id: 'q3', ui_type: 'addons', label: 'What extras would you like?', required: false, addons: [{ label: 'Long-form highlight film', price: 800 }, { label: 'Raw footage', price: 500 }, { label: 'Photo package (100 edited photos)', price: 800 }] },
        ],
    },
    {
        _name: 'Corporate Video', _emoji: '🎬',
        quiz_name: 'Corporate Video Production', business_name: '',
        welcome_title: "Let's scope your video project",
        welcome_subtitle: "Tell us about your production needs and we'll build the right package.",
        welcome_button_text: 'Get started',
        brand_color: '#ff0044', cta_type: 'book_a_call', cta_link: '', currency: 'USD',
        base_price: 2000, starter_multiplier: 0.5, premium_multiplier: 1.2,
        questions: [
            { id: 'q1', ui_type: 'choose_one', label: 'What video length do you need?', required: true, choices: [{ label: '1–3 minutes', price: 0 }, { label: '3–8 minutes', price: 600 }, { label: '8+ minutes', price: 1200 }] },
            { id: 'q2', ui_type: 'choose_one', label: 'How many shoot days?', required: true, choices: [{ label: '1 day', price: 0 }, { label: '2 days', price: 800 }, { label: '3+ days', price: 1600 }] },
            { id: 'q3', ui_type: 'addons', label: 'Add-ons', required: false, addons: [{ label: 'Interview subjects', price: 400 }, { label: 'Motion graphics', price: 700 }] },
        ],
    },
    {
        _name: 'Real Estate', _emoji: '🏠',
        quiz_name: 'Real Estate Photography', business_name: '',
        welcome_title: "Let's create your listing package",
        welcome_subtitle: "A few quick questions and we'll have the right package ready for you.",
        welcome_button_text: "Let's go",
        brand_color: '#ff0044', cta_type: 'lock_your_spot', cta_link: '', currency: 'USD',
        base_price: 300, starter_multiplier: 0.5, premium_multiplier: 1.2,
        questions: [
            { id: 'q1', ui_type: 'choose_one', label: 'What is the property size?', required: true, choices: [{ label: 'Under 1,000 sqft', price: 0 }, { label: '1,000–2,500 sqft', price: 100 }, { label: '2,500+ sqft', price: 200 }] },
            { id: 'q2', ui_type: 'addons', label: 'Additional services', required: false, addons: [{ label: 'Drone aerial shots', price: 250 }, { label: 'Virtual tour', price: 400 }, { label: 'Video walkthrough', price: 600 }] },
        ],
    },
    {
        _name: 'Brand / Headshots', _emoji: '📸',
        quiz_name: 'Brand & Headshot Session', business_name: '',
        welcome_title: "Let's plan your photo session",
        welcome_subtitle: "Tell us what you need and we'll put together your perfect package.",
        welcome_button_text: "Let's go",
        brand_color: '#ff0044', cta_type: 'lock_your_spot', cta_link: '', currency: 'USD',
        base_price: 500, starter_multiplier: 0.5, premium_multiplier: 1.2,
        questions: [
            { id: 'q1', ui_type: 'choose_one', label: 'How many looks/outfits?', required: true, choices: [{ label: '1 look', price: 0 }, { label: '2 looks', price: 100 }, { label: '3 looks', price: 200 }, { label: '4+ looks', price: 300 }] },
            { id: 'q2', ui_type: 'choose_one', label: 'How many edited photos?', required: true, choices: [{ label: '10 photos', price: 0 }, { label: '25 photos', price: 80 }, { label: '50 photos', price: 240 }, { label: '100+ photos', price: 480 }] },
            { id: 'q3', ui_type: 'addons', label: 'Add-ons', required: false, addons: [{ label: 'Hair & makeup', price: 250 }, { label: 'Same-day delivery', price: 300 }] },
        ],
    },
    {
        _name: 'Social Media', _emoji: '📱',
        quiz_name: 'Social Media Content Retainer', business_name: '',
        welcome_title: "Let's build your content plan",
        welcome_subtitle: "Tell us what you need monthly and we'll set up the right retainer.",
        welcome_button_text: 'Get started',
        brand_color: '#ff0044', cta_type: 'book_a_call', cta_link: '', currency: 'USD',
        base_price: 500, starter_multiplier: 0.5, premium_multiplier: 1.2,
        questions: [
            { id: 'q1', ui_type: 'choose_one', label: 'Short-form videos per month', required: true, choices: [{ label: '2 videos', price: 240 }, { label: '4 videos', price: 480 }, { label: '8 videos', price: 960 }, { label: '12 videos', price: 1440 }] },
            { id: 'q2', ui_type: 'choose_one', label: 'Static posts per month', required: true, choices: [{ label: '4 posts', price: 160 }, { label: '8 posts', price: 320 }, { label: '12 posts', price: 480 }] },
            { id: 'q3', ui_type: 'addons', label: 'Add-ons', required: false, addons: [{ label: 'Caption writing', price: 200 }, { label: 'Monthly strategy call', price: 150 }] },
        ],
    },
    {
        _name: 'Event Photography', _emoji: '🎉',
        quiz_name: 'Event Photography Package', business_name: '',
        welcome_title: "Let's cover your event",
        welcome_subtitle: "Answer a few questions and we'll build the perfect photography package.",
        welcome_button_text: "Let's go",
        brand_color: '#ff0044', cta_type: 'lock_your_spot', cta_link: '', currency: 'USD',
        base_price: 800, starter_multiplier: 0.5, premium_multiplier: 1.2,
        questions: [
            { id: 'q1', ui_type: 'choose_one', label: 'How many hours of coverage?', required: true, choices: [{ label: '2 hours', price: 300 }, { label: '4 hours', price: 600 }, { label: '6 hours', price: 900 }, { label: '8+ hours', price: 1200 }] },
            { id: 'q2', ui_type: 'addons', label: 'Add-ons', required: false, addons: [{ label: 'Second photographer', price: 600 }, { label: 'Same-day slideshow', price: 400 }, { label: 'Print package', price: 300 }] },
        ],
    },
];

const CTA_OPTIONS = [
    { value: 'lock_your_spot', label: 'Lock Your Spot' },
    { value: 'book_a_call', label: 'Book a Call' },
    { value: 'sign_contract', label: 'Sign Contract' },
    { value: 'apply_now', label: 'Apply Now' },
];

const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'AUD', label: 'AUD (A$)' },
    { value: 'ILS', label: 'ILS (₪)' },
];

// ─── CopyButton ───────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : label}
        </button>
    );
}

// ─── QuizCard ─────────────────────────────────────────────────────────────────

function QuizCard({ quiz, submissions, onEdit, onDelete }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const quizUrl = `${window.location.origin}/quiz/${quiz.id}`;
    const embedCode = `<iframe src="${quizUrl}?embed=true" width="100%" height="700" frameborder="0" style="border-radius:16px;"></iframe>`;
    const submissionCount = submissions?.[quiz.id] ?? 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{quiz.quiz_name}</h3>
                    {quiz.business_name && <p className="text-sm text-gray-500 mt-0.5">{quiz.business_name}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(quiz)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Edit className="w-3 h-3" /> Edit
                    </button>
                    {confirmDelete ? (
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => onDelete(quiz.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">Confirm</button>
                            <button onClick={() => setConfirmDelete(false)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3 h-3" /> Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{quiz.questions?.length || 0} questions</span>
                <span>·</span>
                <span>{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <CopyButton text={quizUrl} label="Copy link" />
                <CopyButton text={embedCode} label="Copy embed" />
                <a
                    href={quizUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    <ExternalLink className="w-3 h-3" /> Preview
                </a>
            </div>
        </div>
    );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────

function QuestionCard({ question, index, onChange, onRemove }) {
    const set = (field, value) => onChange({ ...question, [field]: value });

    const addChoice = () => set('choices', [...(question.choices || []), { label: '', price: 0 }]);
    const updateChoice = (i, field, value) => {
        const choices = [...(question.choices || [])];
        choices[i] = { ...choices[i], [field]: value };
        set('choices', choices);
    };
    const removeChoice = (i) => set('choices', (question.choices || []).filter((_, idx) => idx !== i));

    const addAddon = () => set('addons', [...(question.addons || []), { label: '', price: 0 }]);
    const updateAddon = (i, field, value) => {
        const addons = [...(question.addons || [])];
        addons[i] = { ...addons[i], [field]: value };
        set('addons', addons);
    };
    const removeAddon = (i) => set('addons', (question.addons || []).filter((_, idx) => idx !== i));

    const handleTypeChange = (newType) => {
        const base = { id: question.id, label: question.label, required: question.required, ui_type: newType };
        if (newType === 'choose_one') onChange({ ...base, choices: [{ label: '', price: 0 }, { label: '', price: 0 }] });
        else if (newType === 'addons') onChange({ ...base, addons: [{ label: '', price: 0 }, { label: '', price: 0 }] });
        else onChange({ ...base, unit_price: 0, unit_label: '', min: 1, max: 10, default: 1 });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
            {/* Top row */}
            <div className="flex items-start gap-3">
                <div className="flex-1 flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder={`Question ${index + 1} — e.g. "How many hours of coverage?"`}
                        value={question.label}
                        onChange={e => set('label', e.target.value)}
                        className="w-full text-sm font-medium border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white placeholder-gray-400"
                    />
                    <div className="flex items-center gap-3">
                        <select
                            value={question.ui_type}
                            onChange={e => handleTypeChange(e.target.value)}
                            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white"
                        >
                            <option value="choose_one">Choose one</option>
                            <option value="addons">Add-ons (pick multiple)</option>
                            <option value="pick_a_number">Pick a number</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={!!question.required}
                                onChange={e => set('required', e.target.checked)}
                                className="rounded"
                            />
                            Required
                        </label>
                    </div>
                </div>
                <button onClick={onRemove} className="text-gray-300 hover:text-red-400 transition-colors p-1 mt-1 flex-shrink-0">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Choose one */}
            {question.ui_type === 'choose_one' && (
                <div className="flex flex-col gap-2 pl-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Options</p>
                    {(question.choices || []).map((choice, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-gray-300 text-base leading-none flex-shrink-0">○</span>
                            <input
                                type="text"
                                placeholder="Option label"
                                value={choice.label}
                                onChange={e => updateChoice(i, 'label', e.target.value)}
                                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white"
                            />
                            <span className="text-xs text-gray-400 whitespace-nowrap">adds $</span>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={choice.price === 0 ? '' : choice.price}
                                onChange={e => updateChoice(i, 'price', Number(e.target.value))}
                                className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white"
                            />
                            {(question.choices || []).length > 1 && (
                                <button onClick={() => removeChoice(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={addChoice} className="flex items-center gap-1.5 text-xs text-[#ff0044] hover:text-[#cc0033] transition-colors mt-1 w-fit">
                        <Plus className="w-3.5 h-3.5" /> Add option
                    </button>
                </div>
            )}

            {/* Add-ons */}
            {question.ui_type === 'addons' && (
                <div className="flex flex-col gap-2 pl-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Add-on options — client can pick any combination</p>
                    {(question.addons || []).map((addon, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-gray-300 text-base leading-none flex-shrink-0">☐</span>
                            <input
                                type="text"
                                placeholder="Add-on name"
                                value={addon.label}
                                onChange={e => updateAddon(i, 'label', e.target.value)}
                                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white"
                            />
                            <span className="text-xs text-gray-400 whitespace-nowrap">+ $</span>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={addon.price === 0 ? '' : addon.price}
                                onChange={e => updateAddon(i, 'price', Number(e.target.value))}
                                className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white"
                            />
                            {(question.addons || []).length > 1 && (
                                <button onClick={() => removeAddon(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={addAddon} className="flex items-center gap-1.5 text-xs text-[#ff0044] hover:text-[#cc0033] transition-colors mt-1 w-fit">
                        <Plus className="w-3.5 h-3.5" /> Add option
                    </button>
                </div>
            )}

            {/* Pick a number */}
            {question.ui_type === 'pick_a_number' && (
                <div className="flex flex-col gap-3 pl-1">
                    <div className="flex items-end gap-3 flex-wrap">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Price per unit ($)</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={question.unit_price === 0 ? '' : question.unit_price}
                                onChange={e => set('unit_price', Number(e.target.value))}
                                className="w-32 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Unit label</label>
                            <input
                                type="text"
                                placeholder="e.g. hour, video"
                                value={question.unit_label || ''}
                                onChange={e => set('unit_label', e.target.value)}
                                className="w-36 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex items-end gap-3 flex-wrap">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Min</label>
                            <input type="number" min="0" value={question.min ?? 1} onChange={e => set('min', Number(e.target.value))} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Max</label>
                            <input type="number" min="1" value={question.max ?? 10} onChange={e => set('max', Number(e.target.value))} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-400">Default</label>
                            <input type="number" min="0" value={question.default ?? 1} onChange={e => set('default', Number(e.target.value))} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── QuizBuilder ──────────────────────────────────────────────────────────────

function QuizBuilder({ initialDraft, editingId, onSave, onCancel }) {
    const [draft, setDraft] = useState(initialDraft || BLANK_UI_DRAFT);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showCustomize, setShowCustomize] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const initialSnapshotRef = useRef(JSON.stringify(initialDraft || BLANK_UI_DRAFT));
    const isDirty = !saving && JSON.stringify(draft) !== initialSnapshotRef.current;

    const set = (field, value) => setDraft(d => ({ ...d, [field]: value }));

    const addQuestion = (ui_type) => {
        const id = `q${Date.now()}`;
        let q;
        if (ui_type === 'choose_one') q = { id, ui_type, label: '', required: false, choices: [{ label: '', price: 0 }, { label: '', price: 0 }] };
        else if (ui_type === 'addons') q = { id, ui_type, label: '', required: false, addons: [{ label: '', price: 0 }, { label: '', price: 0 }] };
        else q = { id, ui_type: 'pick_a_number', label: '', required: false, unit_price: 0, unit_label: '', min: 1, max: 10, default: 1 };
        setDraft(d => ({ ...d, questions: [...d.questions, q] }));
    };

    const updateQuestion = (index, updated) => {
        setDraft(d => {
            const questions = [...d.questions];
            questions[index] = updated;
            return { ...d, questions };
        });
    };

    const removeQuestion = (index) => {
        setDraft(d => ({ ...d, questions: d.questions.filter((_, i) => i !== index) }));
    };

    const applyTemplate = (template) => {
        const { _name, _emoji, ...rest } = template;
        setDraft(rest);
    };

    const handleSave = async () => {
        if (!draft.quiz_name.trim()) { setError('Quiz name is required.'); return; }
        if (!draft.base_price || Number(draft.base_price) <= 0) { setError('Base price must be greater than 0.'); return; }
        if ((draft.questions || []).length === 0) { setError('Add at least one question.'); return; }
        setError('');
        setSaving(true);
        try {
            const payload = buildDraftPayload(draft);
            if (editingId) {
                await supabaseClient.entities.QuizConfig.update(editingId, payload);
            } else {
                await supabaseClient.entities.QuizConfig.create(payload);
            }
            onSave();
        } catch (e) {
            setError(e.message || 'Failed to save quiz.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-8">
            <UnsavedChangesGuard isDirty={isDirty} brandColor={draft.brand_color || '#ff0044'} />
            {/* Back */}
            <button onClick={onCancel} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit">
                <ChevronRight className="w-4 h-4 rotate-180" /> My Quizzes
            </button>

            {/* Quiz name */}
            <input
                type="text"
                placeholder="Quiz name — e.g. Wedding Media Package"
                value={draft.quiz_name}
                onChange={e => set('quiz_name', e.target.value)}
                className="w-full text-2xl font-bold border-0 border-b-2 border-gray-200 focus:border-[#ff0044] focus:outline-none pb-2 bg-transparent placeholder-gray-300 transition-colors"
            />

            {/* Templates */}
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">Start from a template</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {QUIZ_TEMPLATES.map(t => (
                        <button
                            key={t._name}
                            onClick={() => applyTemplate(t)}
                            className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-[#ff0044]/30 rounded-xl transition-all"
                        >
                            <span className="text-xl">{t._emoji}</span>
                            <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{t._name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Setup */}
            <div className="flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Setup</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Business name <span className="text-gray-300">(optional)</span></label>
                        <input
                            type="text"
                            placeholder="Your business name"
                            value={draft.business_name}
                            onChange={e => set('business_name', e.target.value)}
                            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Brand color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={draft.brand_color}
                                onChange={e => set('brand_color', e.target.value)}
                                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                            />
                            <input
                                type="text"
                                value={draft.brand_color}
                                onChange={e => set('brand_color', e.target.value)}
                                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white font-mono"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setShowCustomize(v => !v)}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit"
                >
                    {showCustomize ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Customize welcome screen & CTA
                </button>
                {showCustomize && (
                    <div className="flex flex-col gap-4 pl-4 border-l-2 border-gray-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Welcome title</label>
                                <input type="text" value={draft.welcome_title} onChange={e => set('welcome_title', e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">Button text</label>
                                <input type="text" value={draft.welcome_button_text} onChange={e => set('welcome_button_text', e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Welcome subtitle</label>
                            <input type="text" value={draft.welcome_subtitle} onChange={e => set('welcome_subtitle', e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">CTA button type</label>
                                <select value={draft.cta_type} onChange={e => set('cta_type', e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white">
                                    {CTA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-500">CTA link <span className="text-gray-300">(optional)</span></label>
                                <input type="url" placeholder="https://" value={draft.cta_link} onChange={e => set('cta_link', e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Questions */}
            <div className="flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Questions</h2>

                {(draft.questions || []).length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-sm text-gray-400">No questions yet. Add one below.</p>
                    </div>
                )}

                {(draft.questions || []).map((q, i) => (
                    <QuestionCard
                        key={q.id}
                        question={q}
                        index={i}
                        onChange={updated => updateQuestion(i, updated)}
                        onRemove={() => removeQuestion(i)}
                    />
                ))}

                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">Add question:</span>
                    <button onClick={() => addQuestion('choose_one')} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Choose one
                    </button>
                    <button onClick={() => addQuestion('addons')} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Add-ons
                    </button>
                    <button onClick={() => addQuestion('pick_a_number')} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Pick a number
                    </button>
                </div>
            </div>

            {/* Pricing */}
            <div className="flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pricing</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Base price ($) *</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={draft.base_price === 0 ? '' : draft.base_price}
                            onChange={e => set('base_price', e.target.value)}
                            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white"
                        />
                        <p className="text-xs text-gray-400">Starting price before any add-ons</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Currency</label>
                        <select value={draft.currency} onChange={e => set('currency', e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white">
                            {CURRENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => setShowAdvanced(v => !v)}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors w-fit"
                >
                    {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Advanced settings
                </button>
                {showAdvanced && (
                    <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-gray-100">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Starter multiplier</label>
                            <input type="number" min="0.1" max="1" step="0.05" value={draft.starter_multiplier} onChange={e => set('starter_multiplier', e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white" />
                            <p className="text-xs text-gray-400">Starter = Growth × {draft.starter_multiplier}x</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Premium multiplier</label>
                            <input type="number" min="1" max="3" step="0.05" value={draft.premium_multiplier} onChange={e => set('premium_multiplier', e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff0044]/20 bg-white" />
                            <p className="text-xs text-gray-400">Premium = Growth × {draft.premium_multiplier}x</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

            {/* Save */}
            <div className="flex items-center gap-3 pb-8">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-[#ff0044] text-white rounded-xl font-semibold hover:bg-[#cc0033] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    ) : (
                        editingId ? 'Update Quiz' : 'Create Quiz'
                    )}
                </button>
                <button onClick={onCancel} className="px-6 py-3 text-gray-600 hover:text-gray-900 transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── QuizManager (main page) ──────────────────────────────────────────────────

export default function QuizManager() {
    return <AutoPackagesComingSoon />;
}

function AutoPackagesComingSoon() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-16" style={{ backgroundColor: '#F5F5F7' }}>
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-lg border border-gray-100 p-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#ff0044] text-xs font-semibold tracking-wide uppercase mb-6">
                    Coming Soon
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Auto Packages</h1>
                <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                    Your client builds their own package. You close while you sleep.
                </p>
                <ul className="text-left space-y-3 max-w-md mx-auto">
                    <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-[#ff0044] mt-0.5 flex-shrink-0" />
                        <span>No more discovery calls for small jobs</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-[#ff0044] mt-0.5 flex-shrink-0" />
                        <span>Qualify leads 24/7</span>
                    </li>
                    <li className="flex items-start gap-3 text-gray-700">
                        <Check className="w-5 h-5 text-[#ff0044] mt-0.5 flex-shrink-0" />
                        <span>Clients book themselves</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

function QuizManagerOriginal() {
    const [quizzes, setQuizzes] = useState([]);
    const [submissionCounts, setSubmissionCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [builderOpen, setBuilderOpen] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);

    const loadQuizzes = async () => {
        setLoading(true);
        try {
            const data = await supabaseClient.entities.QuizConfig.list('-created_date');
            setQuizzes(data || []);
        } catch (e) {
            console.error('Failed to load quizzes:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadQuizzes(); }, []);

    const handleEdit = (quiz) => { setEditingQuiz(quiz); setBuilderOpen(true); };
    const handleNew = () => { setEditingQuiz(null); setBuilderOpen(true); };
    const handleDelete = async (id) => {
        try { await supabaseClient.entities.QuizConfig.delete(id); loadQuizzes(); }
        catch (e) { console.error('Failed to delete quiz:', e); }
    };
    const handleSave = () => { setBuilderOpen(false); setEditingQuiz(null); loadQuizzes(); };
    const handleCancel = () => { setBuilderOpen(false); setEditingQuiz(null); };

    if (builderOpen) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="builder"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-screen bg-[#F5F5F7] overflow-y-auto"
                >
                    <QuizBuilder
                        initialDraft={editingQuiz ? parseDraftToUi(editingQuiz) : BLANK_UI_DRAFT}
                        editingId={editingQuiz?.id || null}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Client Quiz</h1>
                    <p className="text-gray-500 mt-1">Send clients a quiz — they answer a few questions and get their perfect package automatically.</p>
                </div>
                <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-[#ff0044] text-white rounded-xl font-semibold hover:bg-[#cc0033] transition-colors">
                    <Plus className="w-4 h-4" /> New Quiz
                </button>
            </div>

            {loading ? (
                <div className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-[#ff0044] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
            ) : quizzes.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <p className="text-gray-400 mb-4">No quizzes yet.</p>
                    <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-[#ff0044] text-white rounded-xl font-semibold hover:bg-[#cc0033] transition-colors mx-auto">
                        <Plus className="w-4 h-4" /> Create your first quiz
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 max-w-2xl">
                    {quizzes.map(quiz => (
                        <QuizCard
                            key={quiz.id}
                            quiz={quiz}
                            submissions={submissionCounts}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
