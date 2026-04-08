import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown, CircleHelp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const DEFAULT_CATEGORIES = [
  { id: 'time', name: 'Your Time', type: 'time', placeholder: 'e.g., filming, editing, meetings', qty: '', unit: 'days', rate: '', amount: 0 },
  { id: 'team', name: 'Team / Subcontractors', type: 'amount', placeholder: 'e.g., second shooter, editor', amount: '' },
  { id: 'equipment', name: 'Equipment / Rentals', type: 'amount', placeholder: 'e.g., camera, lights, gimbal', amount: '' },
  { id: 'travel', name: 'Travel / Location', type: 'amount', placeholder: 'e.g., flights, accommodation', amount: '' },
  { id: 'materials', name: 'Materials & Licenses', type: 'amount', placeholder: 'e.g., stock footage, music, fonts, prints', amount: '' },
  { id: 'software', name: 'Software', type: 'amount', placeholder: 'e.g., editing tools, subscriptions', amount: '' },
  { id: 'other', name: 'Other', type: 'amount', placeholder: 'e.g., insurance, permits', amount: '' },
];

const PRIVACY_DISMISS_KEY = 'launchbox_cost_privacy_dismissed';

const parseNum = (v) => {
  if (v === '' || v == null) return 0;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

const formatCurrency = (n, symbol = '$') => {
  if (n == null || isNaN(n)) return `${symbol}0`;
  return `${symbol}${Math.round(n).toLocaleString()}`;
};

const FieldHelp = ({ text }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Field help"
      >
        <CircleHelp className="w-4 h-4" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
      {text} This is private and only visible to you, not your client.
    </TooltipContent>
  </Tooltip>
);

export function CostCalculatorPanel({
  isOpen,
  onClose,
  packageName,
  packagePrice,
  currencySymbol = '$',
  costData,
  onSave,
  onApplySuggestedPrice,
  isMobile,
  tiers = [],
  currentTier,
  onTierChange,
  /** 'sheet' = right drawer (default); 'embedded' = inline page block */
  variant = 'sheet',
  /** Template editor: hide tier switching; relabel price line */
  templateMode = false,
  showCloseButton = true,
  /** Optional: apply a saved template from library (Results page) */
  templateLibrary = [],
  onApplyTemplate,
  /** Embedded: after Save, pass payload to parent (e.g. persist to server) */
  onEmbeddedSave = undefined,
  /** Template builder: allow typing reference price when no package is linked */
  templateReferenceEditable = false,
  referencePriceInputValue = '',
  onReferencePriceChange,
}) {
  const initCategories = useCallback((data) => {
    const raw = data?.categories?.length ? data.categories : DEFAULT_CATEGORIES.map((c) => ({ ...c }));
    return raw.map((c, i) => ({
      ...c,
      _id: c._id || c.id || `cat-${i}-${Date.now()}`,
    }));
  }, []);

  const [categories, setCategories] = useState(() => initCategories(costData));
  const [marginPercent, setMarginPercent] = useState(costData?.marginPercent ?? 30);
  const [marginInputValue, setMarginInputValue] = useState(String(costData?.marginPercent ?? 30));

  const [showPrivacyNotice, setShowPrivacyNotice] = useState(() => {
    try {
      return !localStorage.getItem(PRIVACY_DISMISS_KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!currentTier) return;
    setCategories(initCategories(costData));
    const val = costData?.marginPercent ?? 30;
    setMarginPercent(val);
    setMarginInputValue(String(val));
  }, [currentTier, costData, initCategories]);

  useEffect(() => {
    if (isOpen) setIsVisible(true);
  }, [isOpen]);

  useEffect(() => {
    if (!templateMode) setTemplateSelectValue('none');
  }, [currentTier, templateMode]);

  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [templateSelectValue, setTemplateSelectValue] = useState('none');

  const saveDebounceRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const isClosingRef = React.useRef(false);

  const totalCost = useMemo(() => {
    let sum = 0;
    for (const cat of categories) {
      if (cat.type === 'time') {
        const qty = parseNum(cat.qty);
        const rate = parseNum(cat.rate);
        const mult = cat.unit === 'hours' ? 1 : 1;
        sum += qty * rate * mult;
      } else {
        sum += parseNum(cat.amount);
      }
    }
    return sum;
  }, [categories]);

  const price = parseNum(packagePrice);
  const profit = price - totalCost;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  const targetMarginNum = parseNum(marginInputValue) || 0;
  const suggestedMinPrice = targetMarginNum > 0 && targetMarginNum < 100
    ? totalCost / (1 - targetMarginNum / 100)
    : totalCost;
  const suggestedPriceRoundedUp = Math.ceil(suggestedMinPrice / 100) * 100;

  const filledCount = useMemo(() => {
    return categories.filter((c) => {
      if (c.type === 'time') {
        const qty = parseNum(c.qty);
        const rate = parseNum(c.rate);
        return qty > 0 || rate > 0;
      }
      return parseNum(c.amount) > 0;
    }).length;
  }, [categories]);

  const hasAnyCosts = totalCost > 0;

  const persist = useCallback(() => {
    const data = {
      categories: categories.map(({ _id, ...c }) => c),
      marginPercent: parseNum(marginInputValue) || 0,
      hasOpened: true,
    };
    onSave?.(data);
    return data;
  }, [categories, marginInputValue, onSave]);

  const switchTier = useCallback((newTier) => {
    if (newTier === currentTier) return;
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null;
    }
    persist();
    onTierChange?.(newTier);
  }, [currentTier, persist, onTierChange]);

  useEffect(() => {
    if (!isOpen) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(persist, 1000);
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    };
  }, [categories, marginInputValue, isOpen, persist]);

  const updateCategory = (idx, updates) => {
    setCategories((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  };

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        _id: `custom-${Date.now()}`,
        name: 'New Category',
        type: 'amount',
        placeholder: 'Enter amount',
        amount: '',
      },
    ]);
  };

  const deleteCategory = (idx) => {
    setCategories((prev) => prev.filter((_, i) => i !== idx));
    setEditingCategoryId(null);
  };

  const startEditName = (cat) => {
    setEditingCategoryId(cat._id);
    setEditingCategoryName(cat.name);
  };

  const commitEditName = () => {
    if (editingCategoryId == null) return;
    const idx = categories.findIndex((c) => c._id === editingCategoryId);
    if (idx >= 0 && editingCategoryName.trim()) {
      updateCategory(idx, { name: editingCategoryName.trim() });
    }
    setEditingCategoryId(null);
  };

  const handleReset = () => {
    setCategories(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, _id: `reset-${i}-${Date.now()}` })));
    setMarginPercent(30);
    setShowResetConfirm(false);
  };

  const dismissPrivacy = () => {
    setShowPrivacyNotice(false);
    try {
      localStorage.setItem(PRIVACY_DISMISS_KEY, '1');
    } catch {}
  };

  const requestClose = useCallback(() => {
    isClosingRef.current = true;
    setIsVisible(false);
  }, []);

  useEffect(() => {
    if (!isOpen || variant === 'embedded') return;

    const handlePointerDownOutside = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      // Keep panel open when clicking inside panel or Radix dropdown content.
      if (panelRef.current?.contains(target)) return;
      if (target.closest('[data-radix-popper-content-wrapper], [role="menu"]')) return;

      // Defer so click reaches editable fields first, then animate out
      setTimeout(() => requestClose(), 0);
    };

    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [isOpen, requestClose, variant]);

  const panelClass =
    variant === 'embedded'
      ? 'relative z-0 w-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden min-h-[520px]'
      : isMobile
        ? 'fixed inset-0 z-50 bg-white flex flex-col md:hidden'
        : 'fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-200';

  return (
    <TooltipProvider delayDuration={200}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
          key="cost-calculator-panel"
          ref={panelRef}
          initial={{ opacity: 0, x: 40 }}
          animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          onAnimationComplete={() => {
            if (isClosingRef.current) {
              isClosingRef.current = false;
              onClose?.();
            }
          }}
          className={panelClass}
          onWheelCapture={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 md:p-6 border-b border-gray-200 space-y-3">
            {templateLibrary.length > 0 && typeof onApplyTemplate === 'function' && !templateMode && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="cost-template-select" className="text-sm font-medium text-gray-800">
                    Apply template
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="About templates"
                      >
                        <CircleHelp className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
                      Replaces this tier&apos;s cost categories and margin with a saved template. Your package price
                      stays the same; only your internal cost breakdown updates.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={templateSelectValue}
                  onValueChange={(v) => {
                    if (v === 'none') return;
                    Promise.resolve(onApplyTemplate(v))
                      .then(() => setTemplateSelectValue('none'))
                      .catch(() => {});
                  }}
                >
                  <SelectTrigger
                    id="cost-template-select"
                    className="h-11 w-full rounded-xl border-gray-200 bg-gray-50/80 text-left font-normal shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-[#ff0044]/20"
                  >
                    <SelectValue placeholder="Choose a saved template…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-lg max-h-[min(280px,50vh)]">
                    <SelectItem value="none" className="rounded-lg text-gray-500">
                      None — keep current costs
                    </SelectItem>
                    {templateLibrary.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="rounded-lg cursor-pointer">
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              {!templateMode && tiers.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const idx = tiers.findIndex((t) => t.tier === currentTier);
                      if (idx > 0) switchTier(tiers[idx - 1].tier);
                    }}
                    className="flex-shrink-0 w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Previous tier"
                    disabled={tiers.findIndex((t) => t.tier === currentTier) <= 0}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      >
                        <span className="text-lg font-bold text-gray-900 truncate w-full text-center">
                          {packageName}
                        </span>
                        <span className="text-xl font-bold text-gray-700">
                          {formatCurrency(price, currencySymbol)}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-500 mt-0.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="min-w-[180px]">
                      {tiers.map((t) => (
                        <DropdownMenuItem
                          key={t.tier}
                          onClick={() => switchTier(t.tier)}
                          className={cn(
                            'flex justify-between items-center py-2.5',
                            t.tier === currentTier && 'bg-gray-100 font-medium'
                          )}
                        >
                          <span>{t.name}</span>
                          <span className="text-gray-500 text-sm">
                            {formatCurrency(t.price ?? 0, currencySymbol)}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    onClick={() => {
                      const idx = tiers.findIndex((t) => t.tier === currentTier);
                      if (idx >= 0 && idx < tiers.length - 1) switchTier(tiers[idx + 1].tier);
                    }}
                    className="flex-shrink-0 w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    aria-label="Next tier"
                    disabled={tiers.findIndex((t) => t.tier === currentTier) >= tiers.length - 1}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {!templateMode && tiers.length <= 1 && (
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{packageName}</h2>
                  <p className="text-2xl font-bold mt-1 text-gray-900">
                    {formatCurrency(price, currencySymbol)}
                  </p>
                </div>
              )}
              {templateMode && (
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Cost template</p>
                  <h2 className="text-lg font-bold text-gray-900 truncate">{packageName}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-sm text-gray-500">Reference price (for margin math)</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                          aria-label="What is reference price?"
                        >
                          <CircleHelp className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                        This is the selling price used to compute profit and margin against your costs. Link a package
                        to pull its price, or enter a number manually.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {templateReferenceEditable && typeof onReferencePriceChange === 'function' ? (
                    <div className="relative mt-2 max-w-[200px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        placeholder="0"
                        className="h-11 pl-7 rounded-xl border-gray-200 bg-white"
                        value={referencePriceInputValue}
                        onChange={(e) => onReferencePriceChange(e.target.value)}
                      />
                    </div>
                  ) : (
                    <p className="text-2xl font-bold mt-1 text-gray-900">
                      {formatCurrency(price, currencySymbol)}
                    </p>
                  )}
                </div>
              )}
              {showCloseButton && (
              <button
                onClick={requestClose}
                className="flex-shrink-0 w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              )}
            </div>

            {showPrivacyNotice && (
              <div className="mt-4 flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-blue-800">
                    Only you can see this. Your client will never see your costs.
                  </p>
                  <button
                    onClick={dismissPrivacy}
                    className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 overscroll-contain">
            <div className="space-y-4">
              {categories.map((cat, idx) => (
                <div key={cat._id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {editingCategoryId === cat._id ? (
                      <div className="flex-1 flex items-center justify-start gap-1.5">
                        <Input
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onBlur={commitEditName}
                          onKeyDown={(e) => e.key === 'Enter' && commitEditName()}
                          className="h-11 min-h-[44px] w-[230px] max-w-full"
                          autoFocus
                        />
                        <FieldHelp
                          text={cat.type === 'time'
                            ? 'Name this time-based cost item, then enter quantity, unit, and your rate.'
                            : 'Enter the total amount for this cost category.'}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-start gap-1.5">
                        <button
                          onClick={() => startEditName(cat)}
                          className="text-left text-sm font-medium text-gray-700 hover:text-gray-900 min-h-[44px] inline-flex items-center px-1 rounded"
                        >
                          {cat.name}
                        </button>
                        <FieldHelp
                          text={cat.type === 'time'
                            ? 'Name this time-based cost item, then enter quantity, unit, and your rate.'
                            : 'Enter the total amount for this cost category.'}
                        />
                      </div>
                    )}
                    {categories.length > 1 && (
                      <button
                        onClick={() => deleteCategory(idx)}
                        className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {cat.type === 'time' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={cat.qty}
                        onChange={(e) => updateCategory(idx, { qty: e.target.value })}
                        className="w-20 h-11 min-h-[44px]"
                      />
                      <select
                        value={cat.unit}
                        onChange={(e) => updateCategory(idx, { unit: e.target.value })}
                        className="h-11 min-h-[44px] px-3 rounded-md border border-gray-200 bg-white text-sm"
                      >
                        <option value="days">days</option>
                        <option value="hours">hours</option>
                      </select>
                      <span className="text-gray-500">×</span>
                      <div className="relative w-28">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                          {currencySymbol}
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="Rate"
                          value={cat.rate}
                          onChange={(e) => updateCategory(idx, { rate: e.target.value })}
                          className="w-full h-11 min-h-[44px] pl-7"
                        />
                      </div>
                      <span className="text-gray-500">=</span>
                      <span className="font-medium text-gray-700 min-h-[44px] flex items-center">
                        {formatCurrency(
                          parseNum(cat.qty) * parseNum(cat.rate),
                          currencySymbol
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder={cat.placeholder}
                        value={cat.amount}
                        onChange={(e) => updateCategory(idx, { amount: e.target.value })}
                        className="h-11 min-h-[44px] pl-7"
                      />
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={addCategory}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Add category
              </button>

              <div className="pt-2">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  {templateMode ? 'Reset all costs in this template' : 'Reset all costs for this package'}
                </button>
              </div>

              <p className="text-xs text-gray-400">
                {filledCount} of {categories.length} categories filled
              </p>
            </div>
          </div>

          {/* Fixed summary footer */}
          <div className="flex-shrink-0 p-4 md:p-6 border-t border-gray-200 bg-gray-50 space-y-3">
            {!hasAnyCosts ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 text-center py-2">
                  Add your costs to see if this package is profitable.
                </p>
                <Button
                  onClick={() => {
                    if (saveDebounceRef.current) {
                      clearTimeout(saveDebounceRef.current);
                      saveDebounceRef.current = null;
                    }
                    const data = persist();
                    if (variant === 'embedded') {
                      onEmbeddedSave?.(data);
                    } else {
                      requestClose();
                    }
                  }}
                  className="w-full h-11 font-semibold"
                >
                  {templateMode ? 'Save template' : 'Save'}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total cost</span>
                  <span className="font-medium text-red-600">{formatCurrency(totalCost, currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{templateMode ? 'Reference price' : 'Package price'}</span>
                  <span className="font-medium">{formatCurrency(price, currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{profit >= 0 ? 'Profit' : 'Loss'}</span>
                  <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {profit >= 0 ? '+' : ''}{formatCurrency(profit, currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center gap-2">
                  <span className="text-gray-600">Margin</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        profit < 0 && 'bg-red-500',
                        profit >= 0 && margin >= targetMarginNum && 'bg-green-500',
                        profit >= 0 && margin < targetMarginNum && 'bg-amber-500'
                      )}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        'font-medium',
                        profit < 0 && 'text-red-600',
                        profit >= 0 && margin >= targetMarginNum && 'text-green-600',
                        profit >= 0 && margin < targetMarginNum && 'text-amber-600'
                      )}
                    >
                      {margin.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600">Target margin</span>
                  <FieldHelp
                    text={
                      templateMode
                        ? 'Set your target margin to see what selling price would cover your costs for this template.'
                        : 'Set your desired profit margin percentage to get a suggested minimum package price.'
                    }
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={marginInputValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMarginInputValue(v);
                      const n = parseNum(v) || 0;
                      setMarginPercent(n);
                    }}
                    onBlur={() => {
                      const n = parseNum(marginInputValue) || 0;
                      setMarginPercent(n);
                      if (marginInputValue !== '' && marginInputValue !== String(n)) {
                        setMarginInputValue(String(n));
                      }
                    }}
                    className="w-16 h-9 text-sm"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm text-gray-600">
                      Suggested min. price{' '}
                      <span className="font-semibold text-gray-900">{formatCurrency(suggestedMinPrice, currencySymbol)}</span>
                    </span>
                    {templateMode && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex shrink-0 text-gray-400 hover:text-gray-600"
                            aria-label="About suggested price"
                          >
                            <CircleHelp className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                          For templates this is illustrative only. In the package editor you can apply a suggested
                          price to the real package tier.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {onApplySuggestedPrice && (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (saveDebounceRef.current) {
                          clearTimeout(saveDebounceRef.current);
                          saveDebounceRef.current = null;
                        }
                        const data = {
                          categories: categories.map(({ _id, ...c }) => c),
                          marginPercent: parseNum(marginInputValue) || 0,
                          hasOpened: true,
                        };
                        onApplySuggestedPrice(suggestedPriceRoundedUp, data);
                      }}
                      className="flex-shrink-0 h-9 px-4 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      Apply {formatCurrency(suggestedPriceRoundedUp, currencySymbol)}
                    </Button>
                  )}
                </div>
                {profit < 0 && (
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    Your costs exceed your price by {formatCurrency(-profit, currencySymbol)}. Consider
                    adjusting your price or reducing scope.
                  </p>
                )}
                <Button
                  onClick={() => {
                    if (saveDebounceRef.current) {
                      clearTimeout(saveDebounceRef.current);
                      saveDebounceRef.current = null;
                    }
                    const data = persist();
                    if (variant === 'embedded') {
                      onEmbeddedSave?.(data);
                    } else {
                      requestClose();
                    }
                  }}
                  className="w-full h-11 font-semibold"
                >
                  {templateMode ? 'Save template' : 'Save'}
                </Button>
              </>
            )}
          </div>

          {/* Reset confirmation */}
          <AnimatePresence>
            {showResetConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
                onClick={() => setShowResetConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
                >
                  <p className="text-gray-700 mb-4">
                    {templateMode ? 'Reset all costs in this template?' : 'Reset all costs for this package?'}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowResetConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
