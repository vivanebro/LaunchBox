import React from 'react';
import { cn } from '@/lib/utils';

const NUDGE_DISMISS_KEY = 'launchbox_cost_nudge_dismissed';
const OPENED_ONCE_KEY = 'launchbox_cost_calculator_opened_once';

export function CostCalculatorTrigger({
  state, // 'first_visit' | 'opened_incomplete' | 'profitable' | 'low_margin' | 'losing'
  profit,
  marginPercent,
  currencySymbol = '$',
  onClick,
  darkMode = false,
  packagePrice,
}) {
  const hasData = state === 'profitable' || state === 'low_margin' || state === 'losing';

  // Calculate bar proportions
  // profitPct = what portion of the price is profit (green)
  // costPct = what portion is cost (gray, or red if losing)
  const price = parseFloat(packagePrice) || 0;
  const profitVal = profit || 0;
  const isLosing = state === 'losing';

  let costPct = 100;
  let profitPct = 0;

  if (hasData && price > 0) {
    if (isLosing) {
      costPct = 100;
      profitPct = 0;
    } else {
      profitPct = Math.max(0, Math.min(100, (profitVal / price) * 100));
      costPct = 100 - profitPct;
    }
  }

  if (!hasData) {
    // Empty state: subtle prompt
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-full flex flex-col items-center gap-1 py-0.5 transition-all hover:brightness-125',
        )}
      >
        <div className="w-3/4 h-1.5 rounded-full bg-gray-200 overflow-hidden" />
        <span className={cn(
          'text-[10px]',
          darkMode ? 'text-white/40' : 'text-gray-400'
        )}>
          Calculate costs
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex flex-col items-center gap-1 py-0.5 transition-all hover:brightness-125"
    >
      <div className="w-3/4 h-1.5 rounded-full overflow-hidden flex">
        <div
          className={cn(
            'h-full transition-all',
            isLosing ? 'bg-red-400' : 'bg-gray-300'
          )}
          style={{ width: `${costPct}%` }}
        />
        {profitPct > 0 && (
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${profitPct}%` }}
          />
        )}
      </div>
      <span className={cn(
        'text-[10px]',
        isLosing
          ? (darkMode ? 'text-red-300' : 'text-red-400')
          : state === 'profitable'
            ? (darkMode ? 'text-green-300' : 'text-green-500')
            : (darkMode ? 'text-amber-300' : 'text-amber-500')
      )}>
        {isLosing ? 'Over budget' : `${Math.round(profitPct)}% margin`}
      </span>
    </button>
  );
}

export function getCostCalculatorState(costData, packagePrice) {
  if (!costData) return 'first_visit';

  const { categories = [], hasOpened, marginPercent: targetMargin = 30 } = costData;
  const totalCost = categories.reduce((sum, cat) => {
    if (cat.type === 'time') {
      const qty = parseFloat(String(cat.qty || 0).replace(/,/g, '')) || 0;
      const rate = parseFloat(String(cat.rate || 0).replace(/,/g, '')) || 0;
      return sum + qty * rate;
    }
    return sum + (parseFloat(String(cat.amount || 0).replace(/,/g, '')) || 0);
  }, 0);

  const price = parseFloat(packagePrice) || 0;
  const profit = price - totalCost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  if (totalCost <= 0) {
    return hasOpened ? 'opened_incomplete' : 'first_visit';
  }

  if (profit < 0) return 'losing';
  if (margin >= targetMargin) return 'profitable';
  return 'low_margin';
}

export function getCostCalculatorDisplay(costData, packagePrice, currencySymbol = '$') {
  const state = getCostCalculatorState(costData, packagePrice);
  if (state !== 'profitable' && state !== 'low_margin' && state !== 'losing') {
    return { state, profit: null, marginPercent: null, packagePrice };
  }

  const { categories = [] } = costData || {};
  const totalCost = categories.reduce((sum, cat) => {
    if (cat.type === 'time') {
      const qty = parseFloat(String(cat.qty || 0).replace(/,/g, '')) || 0;
      const rate = parseFloat(String(cat.rate || 0).replace(/,/g, '')) || 0;
      return sum + qty * rate;
    }
    return sum + (parseFloat(String(cat.amount || 0).replace(/,/g, '')) || 0);
  }, 0);
  const price = parseFloat(packagePrice) || 0;
  const profit = price - totalCost;
  const margin = price > 0 ? (profit / price) * 100 : 0;

  return { state, profit, marginPercent: margin, packagePrice };
}

export function hasOpenedCalculatorOnce() {
  try {
    return !!localStorage.getItem(OPENED_ONCE_KEY);
  } catch {
    return false;
  }
}

export function setOpenedCalculatorOnce() {
  try {
    localStorage.setItem(OPENED_ONCE_KEY, '1');
  } catch {}
}

export function hasNudgeBeenDismissed() {
  try {
    return !!localStorage.getItem(NUDGE_DISMISS_KEY);
  } catch {
    return false;
  }
}

export function setNudgeDismissed() {
  try {
    localStorage.setItem(NUDGE_DISMISS_KEY, '1');
  } catch {}
}
