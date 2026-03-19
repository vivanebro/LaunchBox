import React from 'react';
import { Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const NUDGE_DISMISS_KEY = 'launchbox_cost_nudge_dismissed';
const OPENED_ONCE_KEY = 'launchbox_cost_calculator_opened_once';

export function CostCalculatorTrigger({
  state, // 'first_visit' | 'opened_incomplete' | 'profitable' | 'losing'
  profit,
  marginPercent,
  currencySymbol = '$',
  onClick,
  isMobile,
  showNewBadge,
  showNudgeTooltip,
  onNudgeDismiss,
  darkMode = false,
}) {
  const bgColor =
    darkMode
      ? state === 'first_visit'
        ? 'bg-purple-500/15'
        : state === 'opened_incomplete'
        ? 'bg-yellow-400/15'
        : state === 'profitable'
        ? 'bg-emerald-400/20'
        : state === 'low_margin'
        ? 'bg-amber-400/20'
        : state === 'losing'
        ? 'bg-rose-400/20'
        : 'bg-white/10'
      : state === 'first_visit'
      ? 'bg-purple-100/35'
      : state === 'opened_incomplete'
      ? 'bg-yellow-100/35'
      : state === 'profitable'
      ? 'bg-green-100/35'
      : state === 'low_margin'
      ? 'bg-amber-100/35'
      : state === 'losing'
      ? 'bg-red-100/35'
      : 'bg-gray-100/35';

  const label =
    state === 'profitable'
      ? `${currencySymbol}${Math.abs(profit || 0).toLocaleString()} profit`
      : state === 'low_margin'
      ? `${currencySymbol}${Math.abs(profit || 0).toLocaleString()} profit`
      : state === 'losing'
      ? `-${currencySymbol}${Math.abs(profit || 0).toLocaleString()} loss`
      : 'Calculate Your Cost';

  const isBlinking = state === 'first_visit';

  const content = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed transition-all min-h-[44px]',
        darkMode ? 'border-white/30' : 'border-gray-300/80',
        darkMode ? 'hover:opacity-95' : 'hover:opacity-90',
        'focus:outline-none focus-visible:outline-none focus-visible:ring-0',
        bgColor,
        isBlinking && 'animate-cost-aura'
      )}
    >
      <span
        className={cn(
          'text-sm font-medium',
          state === 'profitable' && (darkMode ? 'text-emerald-200' : 'text-green-700'),
          state === 'low_margin' && (darkMode ? 'text-amber-200' : 'text-amber-800'),
          state === 'losing' && (darkMode ? 'text-rose-200' : 'text-red-700'),
          (state === 'first_visit' || state === 'opened_incomplete') && (darkMode ? 'text-white/85' : 'text-gray-700')
        )}
      >
        {label}
      </span>
      {state === 'profitable' && marginPercent != null && !isNaN(marginPercent) && (
        <span className={cn('text-xs', darkMode ? 'text-emerald-300' : 'text-green-600')}>
          ({marginPercent.toFixed(0)}%)
        </span>
      )}
      {state === 'low_margin' && marginPercent != null && !isNaN(marginPercent) && (
        <span className={cn('text-xs', darkMode ? 'text-amber-300' : 'text-amber-600')}>
          ({marginPercent.toFixed(0)}%)
        </span>
      )}
      {state === 'losing' && marginPercent != null && !isNaN(marginPercent) && (
        <span className={cn('text-xs', darkMode ? 'text-rose-300' : 'text-red-600')}>
          ({marginPercent.toFixed(0)}%)
        </span>
      )}
      {showNewBadge && state === 'first_visit' && (
        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-purple-500 text-white rounded">
          New
        </span>
      )}
      {isMobile && (state === 'first_visit' || state === 'opened_incomplete') && (
        <span className={cn('flex items-center gap-1 text-xs', darkMode ? 'text-white/60' : 'text-gray-500')}>
          <Lock className="w-3 h-3" />
          Only you
        </span>
      )}
    </button>
  );

  if (isMobile) {
    return <div className="my-3">{content}</div>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="my-3">{content}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          {showNudgeTooltip ? (
            <p>
              Check if your price covers your costs. Only visible to you.
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onNudgeDismiss?.();
                }}
                className="block mt-1 text-xs underline"
              >
                Got it
              </button>
            </p>
          ) : (
            <p>Clients won&apos;t see this. Please click to see your costs and profit margins.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
    return { state, profit: null, marginPercent: null };
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

  return { state, profit, marginPercent: margin };
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
