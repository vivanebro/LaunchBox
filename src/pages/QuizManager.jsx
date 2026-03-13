import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ExternalLink, ClipboardList, Code2, Eye, Users } from 'lucide-react';
import supabaseClient from '@/lib/supabaseClient';

const BASE_URL = window.location.origin;

function CopyButton({ text, label }) {
    const [copied, setCopied] = useState(false);
    const handle = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
    };
    return (
        <button
            onClick={handle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all"
            style={copied
                ? { background: '#f0fdf4', borderColor: '#86efac', color: '#16a34a' }
                : { background: 'white', borderColor: '#e5e7eb', color: '#6b7280' }
            }
        >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : label}
        </button>
    );
}

function QuizCard({ quiz, submissions }) {
    const quizUrl = `${BASE_URL}/quiz/${quiz.id}`;
    const embedCode = `<iframe src="${quizUrl}?embed=true" width="100%" style="border:0;border-radius:12px;min-height:600px;" scrolling="no" id="launchbox-quiz-${quiz.id}"></iframe>\n<script>(function(){var f=document.getElementById('launchbox-quiz-${quiz.id}');window.addEventListener('message',function(e){if(e.data&&e.data.type==='launchbox:embedHeight'&&typeof e.data.height==='number')f.style.height=Math.max(600,e.data.height)+'px';});})();<\/script>`;

    return (
        <motion.div
            className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
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
                </div>
            </div>

            {/* Stats */}
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

            {/* Quiz link */}
            <div className="p-6 space-y-4">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <ExternalLink size={11} /> Shareable link
                    </p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <span className="flex-1 text-sm text-gray-600 truncate font-mono">{quizUrl}</span>
                        <div className="flex gap-2 flex-shrink-0">
                            <CopyButton text={quizUrl} label="Copy link" />
                            <a
                                href={quizUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all"
                            >
                                <Eye size={13} /> Preview
                            </a>
                        </div>
                    </div>
                </div>

                {/* Embed code */}
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Code2 size={11} /> Embed on your website
                    </p>
                    <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <pre className="flex-1 text-xs text-gray-500 whitespace-pre-wrap break-all font-mono leading-relaxed" style={{ maxHeight: 80, overflow: 'hidden' }}>
                            {embedCode.slice(0, 180)}…
                        </pre>
                        <CopyButton text={embedCode} label="Copy embed" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function QuizManager() {
    const [quizzes, setQuizzes] = useState([]);
    const [submissionCounts, setSubmissionCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Load all active quizzes via service role
                const configs = await supabaseClient.asServiceRole.entities.QuizConfig.list('-created_date');
                setQuizzes(configs || []);

                // Load submission counts per quiz
                if (configs?.length) {
                    const counts = {};
                    await Promise.all(
                        configs.map(async (q) => {
                            try {
                                const subs = await supabaseClient.asServiceRole.entities.QuizSubmission.filter({ quiz_id: q.id }, null);
                                counts[q.id] = (subs || []).length;
                            } catch {
                                counts[q.id] = 0;
                            }
                        })
                    );
                    setSubmissionCounts(counts);
                }
            } catch (err) {
                console.error('QuizManager load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
                <div className="w-8 h-8 border-4 border-gray-200 border-t-[#ff0044] rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F5F7' }}>
            <div className="max-w-3xl mx-auto">
                {/* Page header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Client Quiz</h1>
                    <p className="text-gray-500">
                        Share your quiz link with clients — they answer a few questions and get a tailored package set, without you being there.
                    </p>
                </motion.div>

                {quizzes.length === 0 ? (
                    <motion.div
                        className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <ClipboardList size={40} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="font-semibold text-gray-700 mb-1">No quizzes yet</h3>
                        <p className="text-sm text-gray-400">Quiz configuration is set up in the database. Contact support to get started.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {quizzes.map((quiz) => (
                            <QuizCard
                                key={quiz.id}
                                quiz={quiz}
                                submissions={submissionCounts[quiz.id] ?? 0}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
