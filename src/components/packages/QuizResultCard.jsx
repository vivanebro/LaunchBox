import React from 'react';
import { Check } from 'lucide-react';

const getCurrencySymbol = (currency) => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', AUD: 'A$', ILS: '₪' };
    return symbols[currency] || '$';
};

const getDarkerColor = (color) => {
    if (!color || !color.startsWith('#')) return '#cc0033';
    const hex = color.slice(1);
    const r = Math.floor(parseInt(hex.substring(0, 2), 16) * 0.8);
    const g = Math.floor(parseInt(hex.substring(2, 4), 16) * 0.8);
    const b = Math.floor(parseInt(hex.substring(4, 6), 16) * 0.8);
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
};

/**
 * Read-only package card for the quiz results screen.
 *
 * Props:
 *   name        string     — "Starter" | "Growth" | "Premium"
 *   price       number
 *   currency    string     — e.g. "USD"
 *   deliverables string[]  — formatted strings e.g. ["3x Short-form video", "Long-form highlight video"]
 *   isPopular   boolean    — shows "Recommended" badge, scales card up
 *   brandColor  string     — hex accent color
 *   ctaLabel    string     — button text
 *   ctaLink     string     — button href (hidden when empty)
 */
export default function QuizResultCard({
    name,
    price,
    currency = 'USD',
    deliverables = [],
    isPopular = false,
    brandColor = '#ff0044',
    ctaLabel = 'Get Started',
    ctaLink = '',
}) {
    const symbol = getCurrencySymbol(currency);
    const darker = getDarkerColor(brandColor);
    const visibleDeliverables = deliverables.slice(0, 8);
    const hiddenCount = deliverables.length - visibleDeliverables.length;

    return (
        <div
            className="relative flex flex-col bg-white rounded-3xl shadow-lg border-2 overflow-hidden transition-all duration-300"
            style={{
                borderColor: isPopular ? brandColor : '#e5e7eb',
                transform: isPopular ? 'scale(1.03)' : 'scale(1)',
                zIndex: isPopular ? 1 : 0,
            }}
        >
            {/* Recommended badge */}
            {isPopular && (
                <div
                    className="text-white text-xs font-bold tracking-widest uppercase text-center py-2 px-4"
                    style={{ background: `linear-gradient(135deg, ${brandColor}, ${darker})` }}
                >
                    ★ Recommended
                </div>
            )}

            <div className="flex flex-col flex-1 p-7">
                {/* Package name */}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>

                {/* Price */}
                <div className="mb-6">
                    <span className="text-5xl font-extrabold text-gray-900">
                        {symbol}{(price || 0).toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-sm ml-1">one-time</span>
                </div>

                {/* Deliverables */}
                <ul className="flex flex-col gap-2 flex-1 mb-6">
                    {visibleDeliverables.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span
                                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                                style={{ background: brandColor + '22' }}
                            >
                                <Check size={11} style={{ color: brandColor }} strokeWidth={3} />
                            </span>
                            <span className="text-gray-700 text-sm leading-snug">{item}</span>
                        </li>
                    ))}
                    {hiddenCount > 0 && (
                        <li className="text-xs text-gray-400 pl-8">+ {hiddenCount} more</li>
                    )}
                </ul>

                {/* CTA button */}
                {ctaLink && (
                    <a
                        href={ctaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center text-white font-semibold py-3.5 px-6 rounded-2xl transition-opacity duration-200 hover:opacity-90 active:opacity-80"
                        style={{ background: `linear-gradient(135deg, ${brandColor}, ${darker})` }}
                    >
                        {ctaLabel}
                    </a>
                )}
            </div>
        </div>
    );
}
