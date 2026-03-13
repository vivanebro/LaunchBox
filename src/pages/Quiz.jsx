import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Minus, Plus, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import supabaseClient, { supabase } from '@/lib/supabaseClient';
import { calculatePackages } from '@/lib/quizCalculationEngine';
import QuizResultCard from '@/components/packages/QuizResultCard';

// ─── Constants ─────────────────────────────────────────────────────────────

const CTA_LABELS = {
    book_a_call: 'Book a Call',
    lock_your_spot: 'Lock Your Spot',
    sign_contract: 'Sign Contract',
    apply: 'Apply',
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Sub-components ────────────────────────────────────────────────────────

function ProgressBar({ current, total, brandColor }) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
                className="h-full rounded-full"
                style={{ background: brandColor }}
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            />
        </div>
    );
}

function SingleSelectQuestion({ question, value, onChange, brandColor }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {(question.options || []).map((option) => {
                const selected = value === option;
                return (
                    <button
                        key={option}
                        onClick={() => onChange(option)}
                        className="relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                        style={{
                            borderColor: selected ? brandColor : '#e5e7eb',
                            background: selected ? brandColor + '12' : 'white',
                        }}
                    >
                        <span
                            className="w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all"
                            style={{
                                borderColor: selected ? brandColor : '#d1d5db',
                                background: selected ? brandColor : 'transparent',
                            }}
                        />
                        <span
                            className="font-medium text-sm"
                            style={{ color: selected ? brandColor : '#374151' }}
                        >
                            {option}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function MultiSelectQuestion({ question, value = [], onChange, brandColor }) {
    const toggle = (option) => {
        const current = Array.isArray(value) ? value : [];
        const next = current.includes(option)
            ? current.filter((v) => v !== option)
            : [...current, option];
        onChange(next);
    };
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {(question.options || []).map((option) => {
                const selected = Array.isArray(value) && value.includes(option);
                return (
                    <button
                        key={option}
                        onClick={() => toggle(option)}
                        className="relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                        style={{
                            borderColor: selected ? brandColor : '#e5e7eb',
                            background: selected ? brandColor + '12' : 'white',
                        }}
                    >
                        <span
                            className="w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all"
                            style={{
                                borderColor: selected ? brandColor : '#d1d5db',
                                background: selected ? brandColor : 'transparent',
                            }}
                        >
                            {selected && <span className="text-white text-xs font-bold">✓</span>}
                        </span>
                        <span
                            className="font-medium text-sm"
                            style={{ color: selected ? brandColor : '#374151' }}
                        >
                            {option}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function NumberQuestion({ question, value, onChange, brandColor }) {
    const min = question.min ?? 0;
    const max = question.max ?? 99;
    const current = (value !== undefined && value !== null) ? Number(value) : (question.default ?? min);

    return (
        <div className="flex items-center justify-center gap-6 mt-10">
            <button
                onClick={() => onChange(Math.max(min, current - 1))}
                disabled={current <= min}
                className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-md disabled:opacity-30"
                style={{ borderColor: brandColor, color: brandColor }}
            >
                <Minus size={20} />
            </button>
            <span className="text-7xl font-extrabold text-gray-900 w-24 text-center tabular-nums">
                {current}
            </span>
            <button
                onClick={() => onChange(Math.min(max, current + 1))}
                disabled={current >= max}
                className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-md disabled:opacity-30"
                style={{ borderColor: brandColor, color: brandColor }}
            >
                <Plus size={20} />
            </button>
        </div>
    );
}

// ─── Main Quiz Component ────────────────────────────────────────────────────

export default function Quiz() {
    const { quizId } = useParams();
    const isEmbed = useMemo(() => {
        try { return new URLSearchParams(window.location.search).get('embed') === 'true'; }
        catch { return false; }
    }, []);

    // phase: 'loading' | 'error' | 'welcome' | 'questions' | 'calculating' | 'results'
    const [phase, setPhase] = useState('loading');
    const [errorMsg, setErrorMsg] = useState('');
    const [quizConfig, setQuizConfig] = useState(null);
    const [currentQ, setCurrentQ] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
    const [answers, setAnswers] = useState({});
    const [packages, setPackages] = useState(null);

    // Use a ref to hold the latest answers so async callbacks always see current state
    const answersRef = useRef(answers);
    useEffect(() => { answersRef.current = answers; }, [answers]);

    const quizConfigRef = useRef(quizConfig);
    useEffect(() => { quizConfigRef.current = quizConfig; }, [quizConfig]);

    // ── Embed height sync
    useEffect(() => {
        if (!isEmbed) return;
        const send = () => {
            window.parent.postMessage(
                { type: 'launchbox:embedHeight', height: document.documentElement.scrollHeight },
                '*'
            );
        };
        send();
        const obs = new ResizeObserver(send);
        obs.observe(document.body);
        return () => obs.disconnect();
    }, [isEmbed, phase]);

    // ── Load quiz config
    useEffect(() => {
        if (!quizId) {
            setErrorMsg('No quiz ID provided.');
            setPhase('error');
            return;
        }
        const load = async () => {
            try {
                const config = await supabaseClient.asServiceRole.entities.QuizConfig.get(quizId);
                if (!config) {
                    setErrorMsg("This quiz doesn't exist.");
                    setPhase('error');
                    return;
                }
                if (!config.is_active) {
                    setErrorMsg('This quiz is no longer available.');
                    setPhase('error');
                    return;
                }
                // Init number question defaults
                const initAnswers = {};
                (config.questions || []).forEach(q => {
                    if (q.type === 'number' && q.default !== undefined) {
                        initAnswers[q.id] = q.default;
                    }
                });
                setAnswers(initAnswers);
                setQuizConfig(config);
                setPhase('welcome');
            } catch (err) {
                console.error('Quiz load error:', err);
                setErrorMsg('Something went wrong loading this quiz.');
                setPhase('error');
            }
        };
        load();
    }, [quizId]);

    const brandColor = quizConfig?.brand_color || '#ff0044';
    const questions = quizConfig?.questions || [];

    // ── Answer setter
    const setAnswer = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const currentQuestion = questions[currentQ];

    const isCurrentAnswered = () => {
        if (!currentQuestion) return true;
        if (!currentQuestion.required) return true;
        const val = answers[currentQuestion.id];
        if (val === undefined || val === null || val === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
    };

    // ── Calculation (uses refs to always see fresh state)
    const runCalculation = async () => {
        const cfg = quizConfigRef.current;
        const ans = answersRef.current;
        setPhase('calculating');
        try {
            const [result] = await Promise.all([
                Promise.resolve(
                    calculatePackages(
                        ans,
                        cfg.questions,
                        cfg.pricing_config,
                        cfg.tier_config
                    )
                ),
                wait(1500),
            ]);

            // Sanity check prices
            const baseFloor = Number(cfg.pricing_config?.base_price) || 0;
            ['starter', 'growth', 'premium'].forEach(tier => {
                if (!isFinite(result[tier].price) || result[tier].price < 0) {
                    console.error(`Quiz: ${tier} price invalid, falling back to base_price`);
                    result[tier].price = baseFloor;
                }
            });

            setPackages(result);

            // Fire-and-forget — never use entity helper (getCurrentUser throws for anon users)
            supabase.from('quiz_submissions').insert({
                quiz_id: cfg.id,
                answers: ans,
                generated_packages: result,
                calculated_base_price: result.growth.price,
                completed_at: new Date().toISOString(),
            }).then().catch(err => console.error('Quiz submission save failed:', err));

            setPhase('results');
        } catch (err) {
            console.error('Quiz calculation error:', err);
            setErrorMsg('Something went wrong calculating your packages.');
            setPhase('error');
        }
    };

    // ── Navigation
    const goNext = () => {
        if (currentQ < questions.length - 1) {
            setDirection(1);
            setCurrentQ(q => q + 1);
        } else {
            runCalculation();
        }
    };

    const goBack = () => {
        if (currentQ > 0) {
            setDirection(-1);
            setCurrentQ(q => q - 1);
        } else {
            setPhase('welcome');
        }
    };

    // Single-select: set answer then auto-advance after 300ms
    const handleSingleSelect = (questionId, value) => {
        setAnswer(questionId, value);
        setTimeout(() => {
            setDirection(1);
            if (currentQ < questions.length - 1) {
                setCurrentQ(q => q + 1);
            } else {
                runCalculation();
            }
        }, 300);
    };

    // ─── Render phases ──────────────────────────────────────────────────────

    if (phase === 'loading') {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-5 px-6 text-center">
                <AlertCircle size={40} className="text-gray-300" />
                <h2 className="text-xl font-semibold text-gray-700">{errorMsg}</h2>
                {errorMsg.includes('wrong') && (
                    <button
                        onClick={() => { setPhase('loading'); window.location.reload(); }}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        <RefreshCw size={14} /> Try again
                    </button>
                )}
            </div>
        );
    }

    // ── Welcome screen
    if (phase === 'welcome') {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <motion.div
                    className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center max-w-lg mx-auto w-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {quizConfig.logo_url && (
                        <img
                            src={quizConfig.logo_url}
                            alt={quizConfig.business_name || ''}
                            className="h-12 object-contain mb-8"
                        />
                    )}
                    {!quizConfig.logo_url && quizConfig.business_name && (
                        <p className="text-sm font-semibold tracking-widest uppercase mb-6" style={{ color: brandColor }}>
                            {quizConfig.business_name}
                        </p>
                    )}
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                        {quizConfig.welcome_title || "Let's build your perfect package"}
                    </h1>
                    <p className="text-gray-500 text-lg mb-10">
                        {quizConfig.welcome_subtitle || "Answer a few quick questions and we'll put together exactly what you need."}
                    </p>
                    <button
                        onClick={() => { setCurrentQ(0); setPhase('questions'); }}
                        className="text-white font-semibold px-10 py-4 rounded-2xl text-lg transition-opacity hover:opacity-90 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}
                    >
                        {quizConfig.welcome_button_text || "Let's go"} →
                    </button>
                </motion.div>
            </div>
        );
    }

    // ── Questions screen
    if (phase === 'questions') {
        const total = questions.length;
        const q = currentQuestion;
        if (!q) return null;

        return (
            <div className="min-h-screen bg-white flex flex-col">
                <div className="max-w-xl mx-auto w-full px-6 py-8 flex flex-col flex-1">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={goBack}
                                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                            <span className="text-xs text-gray-400 font-medium">
                                {currentQ + 1} / {total}
                            </span>
                        </div>
                        <ProgressBar current={currentQ + 1} total={total} brandColor={brandColor} />
                    </div>

                    {/* Question */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={currentQ}
                                initial={{ opacity: 0, x: direction * 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -30 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                            >
                                <h2 className="text-2xl font-bold text-gray-900 leading-snug">
                                    {q.label}
                                </h2>

                                {q.type === 'single_select' && (
                                    <SingleSelectQuestion
                                        question={q}
                                        value={answers[q.id]}
                                        onChange={(val) => handleSingleSelect(q.id, val)}
                                        brandColor={brandColor}
                                    />
                                )}

                                {q.type === 'multi_select' && (
                                    <MultiSelectQuestion
                                        question={q}
                                        value={answers[q.id]}
                                        onChange={(val) => setAnswer(q.id, val)}
                                        brandColor={brandColor}
                                    />
                                )}

                                {q.type === 'number' && (
                                    <NumberQuestion
                                        question={q}
                                        value={answers[q.id]}
                                        onChange={(val) => setAnswer(q.id, val)}
                                        brandColor={brandColor}
                                    />
                                )}

                                {q.type === 'info' && (
                                    <p className="mt-4 text-gray-500 text-base">{q.content}</p>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Next button — not shown for single_select (auto-advances) */}
                    {q.type !== 'single_select' && (
                        <div className="mt-8 pb-4">
                            <button
                                onClick={goNext}
                                disabled={!isCurrentAnswered()}
                                className="w-full flex items-center justify-center gap-2 text-white font-semibold py-4 rounded-2xl transition-all hover:opacity-90 disabled:opacity-40"
                                style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}
                            >
                                {currentQ === total - 1 ? 'See my packages' : 'Next'}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Calculating screen
    if (phase === 'calculating') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-8 px-6 text-center">
                <motion.div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
                    style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                    <Sparkles className="text-white w-10 h-10 animate-pulse" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Building your packages…</h2>
                    <p className="text-gray-400">This will just take a moment.</p>
                </motion.div>
                <motion.div
                    className="flex gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {[0, 1, 2].map(i => (
                        <motion.span
                            key={i}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ background: brandColor }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                        />
                    ))}
                </motion.div>
            </div>
        );
    }

    // ── Results screen
    if (phase === 'results' && packages) {
        const ctaLabel = CTA_LABELS[quizConfig.cta_type] || 'Get Started';
        const ctaLink = quizConfig.cta_link || '';

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <div className="max-w-5xl mx-auto w-full px-6 py-12">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {quizConfig.business_name && (
                            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: brandColor }}>
                                {quizConfig.business_name}
                            </p>
                        )}
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                            Here's your perfect package set
                        </h1>
                        <p className="text-gray-500">
                            Based on your answers, we've built three options tailored to your needs.
                        </p>
                    </motion.div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        {['starter', 'growth', 'premium'].map((tier, i) => (
                            <motion.div
                                key={tier}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.12 }}
                            >
                                <QuizResultCard
                                    {...packages[tier]}
                                    currency={quizConfig.currency || 'USD'}
                                    isPopular={tier === 'growth'}
                                    brandColor={brandColor}
                                    ctaLabel={ctaLabel}
                                    ctaLink={ctaLink}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {/* Footer */}
                    <motion.p
                        className="text-center text-xs text-gray-300 mt-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        Powered by LaunchBox
                    </motion.p>
                </div>
            </div>
        );
    }

    return null;
}
