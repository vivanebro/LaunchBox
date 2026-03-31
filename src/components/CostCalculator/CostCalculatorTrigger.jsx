import React from 'react';
import { Lock, CircleHelp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// TooltipContent is a JS forwardRef export; some TS setups infer it too narrowly in .jsx consumers.
// Casting here keeps this component type-safe enough while avoiding false-positive TS errors.
const TooltipContentAny = /** @type {any} */ (TooltipContent);

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
  const darkStateStyles =
    state === 'profitable'
      ? {
          bg: 'bg-emerald-500/20',
          hoverBg: 'hover:bg-emerald-500/28',
          border: 'border-emerald-400/40',
          hoverBorder: 'hover:border-emerald-300/55',
          ring: 'focus-visible:ring-2 focus-visible:ring-emerald-400/40',
        }
      : state === 'low_margin'
      ? {
          bg: 'bg-amber-500/20',
          hoverBg: 'hover:bg-amber-500/28',
          border: 'border-amber-400/45',
          hoverBorder: 'hover:border-amber-300/60',
          ring: 'focus-visible:ring-2 focus-visible:ring-amber-400/40',
        }
      : state === 'losing'
      ? {
          bg: 'bg-rose-500/20',
          hoverBg: 'hover:bg-rose-500/28',
          border: 'border-rose-400/40',
          hoverBorder: 'hover:border-rose-300/55',
          ring: 'focus-visible:ring-2 focus-visible:ring-rose-400/40',
        }
      : state === 'opened_incomplete'
      ? {
          bg: 'bg-yellow-500/15',
          hoverBg: 'hover:bg-yellow-500/22',
          border: 'border-yellow-300/40',
          hoverBorder: 'hover:border-yellow-200/55',
          ring: 'focus-visible:ring-2 focus-visible:ring-yellow-300/35',
        }
      : state === 'first_visit'
      ? {
          bg: 'bg-purple-500/18',
          hoverBg: 'hover:bg-purple-500/26',
          border: 'border-purple-300/40',
          hoverBorder: 'hover:border-purple-200/55',
          ring: 'focus-visible:ring-2 focus-visible:ring-purple-300/35',
        }
      : {
          bg: 'bg-white/10',
          hoverBg: 'hover:bg-white/14',
          border: 'border-white/25',
          hoverBorder: 'hover:border-white/35',
          ring: 'focus-visible:ring-2 focus-visible:ring-white/20',
        };

  const bgColor = darkMode
    ? cn(darkStateStyles.bg, darkStateStyles.hoverBg)
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
  const isCalculateYourCostState = label === 'Calculate Your Cost';

  const content = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed transition-all min-h-[44px]',
        darkMode ? cn(darkStateStyles.border, darkStateStyles.hoverBorder) : 'border-gray-300/80',
        darkMode ? 'hover:opacity-100' : 'hover:opacity-90',
        'focus:outline-none focus-visible:outline-none focus-visible:ring-0',
        darkMode && darkStateStyles.ring,
        bgColor,
        isBlinking && 'animate-cost-aura'
      )}
    >
      <span
        className={cn(
          'text-sm font-medium',
          state === 'profitable' && (darkMode ? 'text-emerald-100' : 'text-green-700'),
          state === 'low_margin' && (darkMode ? 'text-amber-100' : 'text-amber-800'),
          state === 'losing' && (darkMode ? 'text-rose-100' : 'text-red-700'),
          (state === 'first_visit' || state === 'opened_incomplete') && (darkMode ? 'text-white/85' : 'text-gray-700')
        )}
      >
        {label}
      </span>
      {state === 'profitable' && marginPercent != null && !isNaN(marginPercent) && (
        <span className={cn('text-xs', darkMode ? 'text-emerald-200/90' : 'text-green-600')}>
          ({marginPercent.toFixed(0)}%)
        </span>
      )}
      {state === 'low_margin' && marginPercent != null && !isNaN(marginPercent) && (
        <span className={cn('text-xs', darkMode ? 'text-amber-200/90' : 'text-amber-600')}>
          ({marginPercent.toFixed(0)}%)
        </span>
      )}
      {state === 'losing' && marginPercent != null && !isNaN(marginPercent) && (
        <span className={cn('text-xs', darkMode ? 'text-rose-200/90' : 'text-red-600')}>
          ({marginPercent.toFixed(0)}%)
        </span>
      )}
      {showNewBadge && state === 'first_visit' && (
        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-purple-500 text-white rounded">
          New
        </span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-full',
              'w-4 h-4',
              darkMode ? 'text-white/65 hover:text-white/85' : 'text-gray-500 hover:text-gray-700'
            )}
            aria-label="Cost calculator help"
          >
            <CircleHelp className="w-3.5 h-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContentAny side="top" className="max-w-[240px]">
          {isCalculateYourCostState ? (
            <p>Clients won't see this. Please click to calculate your costs and profit margins.</p>
          ) : showNudgeTooltip ? (
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
        </TooltipContentAny>
      </Tooltip>
      {isMobile && (state === 'first_visit' || state === 'opened_incomplete') && (
        <span className={cn('flex items-center gap-1 text-xs', darkMode ? 'text-white/60' : 'text-gray-500')}>
          <Lock className="w-3 h-3" />
          Only you
        </span>
      )}
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="my-3">{content}</div>
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
