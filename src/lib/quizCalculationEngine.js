// Pure calculation engine — no side effects, no imports, fully testable.
// Matches Results.jsx rounding behavior (Math.ceil to nearest 50).

const roundToNearest50 = (num) => Math.ceil(num / 50) * 50;

/**
 * @param {Object} answers       - { questionId: value }
 * @param {Array}  questions     - quiz config questions array
 * @param {Object} pricingConfig - { base_price, deliverables: { key: { label, unit_price, unit_label } } }
 * @param {Object} tierConfig    - { starter_multiplier, premium_multiplier, popular_tier }
 * @returns {{ starter, growth, premium }} — each: { name, price, deliverables[], tier }
 */
export function calculatePackages(answers, questions, pricingConfig, tierConfig) {
    let growthPrice = Number(pricingConfig.base_price) || 0;
    const growthDeliverables = [];

    (questions || []).forEach(question => {
        if (!question.deliverable_key) return;
        const answer = answers[question.id];
        if (answer === undefined || answer === null) return;
        const deliverable = pricingConfig.deliverables?.[question.deliverable_key];
        if (!deliverable) return;

        let quantity = 0;
        if (question.type === 'number') {
            quantity = Math.max(0, Number(answer) || 0);
        } else if (question.type === 'single_select' && question.option_values) {
            const idx = (question.options || []).indexOf(answer);
            quantity = idx >= 0 ? (Number(question.option_values[idx]) || 0) : 0;
        } else if (question.type === 'multi_select') {
            if (question.option_values && Array.isArray(answer)) {
                // Sum per-option amounts (each selected label → its option_value)
                quantity = answer.reduce((sum, selectedLabel) => {
                    const idx = (question.options || []).indexOf(selectedLabel);
                    return sum + (idx >= 0 ? (Number(question.option_values[idx]) || 0) : 0);
                }, 0);
            } else {
                quantity = Array.isArray(answer) ? answer.length : 0;
            }
        }

        if (quantity > 0) {
            const unitPrice = Number(deliverable.unit_price) || 0;
            growthPrice += quantity * unitPrice;
            growthDeliverables.push({
                label: deliverable.label || question.deliverable_key,
                quantity,
                unit_label: deliverable.unit_label || '',
            });
        }
    });

    const starterMult = Number(tierConfig?.starter_multiplier ?? 0.5);
    const premiumMult = Number(tierConfig?.premium_multiplier ?? 1.2);
    const baseFloor = Number(pricingConfig.base_price) || 0;

    // Never go below base_price for growth
    const safeGrowth = Math.max(growthPrice, baseFloor);

    const starterPrice = roundToNearest50(Math.max(0, safeGrowth * starterMult));
    const premiumPrice = roundToNearest50(Math.max(0, safeGrowth * premiumMult));

    // Scale deliverables per tier — starter always has at least 1 of each
    const starterDeliverables = growthDeliverables
        .map(d => ({ ...d, quantity: Math.max(1, Math.floor(d.quantity * starterMult)) }))
        .filter(d => d.quantity > 0);

    const premiumDeliverables = growthDeliverables
        .map(d => ({ ...d, quantity: Math.ceil(d.quantity * premiumMult) }));

    const fmt = (items) =>
        items.map(d => (d.quantity === 1 ? d.label : `${d.quantity}x ${d.label}`));

    return {
        starter: {
            name: 'Starter',
            price: starterPrice,
            deliverables: fmt(starterDeliverables),
            tier: 'starter',
        },
        growth: {
            name: 'Growth',
            price: roundToNearest50(safeGrowth),
            deliverables: fmt(growthDeliverables),
            tier: 'growth',
        },
        premium: {
            name: 'Premium',
            price: premiumPrice,
            deliverables: fmt(premiumDeliverables),
            tier: 'premium',
        },
    };
}
