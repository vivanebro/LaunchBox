import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Plus, Trash2, ChevronLeft, ChevronRight, ChevronDown, CircleHelp, Pencil, Save, Settings2, Check } from 'lucide-react';
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
import { EXAMPLE_TEMPLATE, EXAMPLE_TEMPLATE_ID } from './exampleTemplate';

const DEFAULT_CATEGORIES = [
  { id: 'time', name: 'Your Time', type: 'time', placeholder: '0', qty: '', unit: 'days', rate: '', amount: 0 },
  { id: 'team', name: 'Team / Subcontractors', type: 'amount', placeholder: '0', amount: '' },
  { id: 'equipment', name: 'Equipment / Rentals', type: 'amount', placeholder: '0', amount: '' },
  { id: 'travel', name: 'Travel / Location', type: 'amount', placeholder: '0', amount: '' },
  { id: 'materials', name: 'Materials & Licenses', type: 'amount', placeholder: '0', amount: '' },
  { id: 'software', name: 'Software', type: 'amount', placeholder: '0', amount: '' },
  { id: 'other', name: 'Other', type: 'amount', placeholder: '0', amount: '' },
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
  showCloseButton = false,
  /** Optional: apply a saved template from library (Results page) */
  templateLibrary = [],
  onApplyTemplate,
  /** Embedded: after Save, pass payload to parent (e.g. persist to server) */
  onEmbeddedSave = undefined,
  /** Template builder: allow typing reference price when no package is linked */
  templateReferenceEditable = false,
  referencePriceInputValue = '',
  onReferencePriceChange,
  /** Save current costs as a new template */
  onSaveAsTemplate,
  /** Template management callbacks */
  onDeleteTemplate,
  onRenameTemplate,
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
    if (!currentTier && !templateMode) return;
    setCategories(initCategories(costData));
    const val = costData?.marginPercent ?? 30;
    setMarginPercent(val);
    setMarginInputValue(String(val));
  }, [currentTier, costData, initCategories, templateMode]);

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
  const [savingTemplateName, setSavingTemplateName] = useState(null); // null = hidden, string = showing input
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [renamingTemplateId, setRenamingTemplateId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [savingOverExisting, setSavingOverExisting] = useState(false); // show overwrite options
  const [confirmingClear, setConfirmingClear] = useState(false);
  const templateDropdownRef = React.useRef(null);

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

  // Close template dropdown when clicking outside it
  useEffect(() => {
    if (!templateDropdownOpen) return;
    const handler = (e) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(e.target)) {
        setTemplateDropdownOpen(false);
        setRenamingTemplateId(null);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [templateDropdownOpen]);

  useEffect(() => {
    if (!isOpen || variant === 'embedded') return;

    const handlePointerDownOutside = (event) => {
      if (!panelRef.current) return;

      // Use the panel's bounding box to decide -- if the click is within
      // the panel's horizontal area, keep it open regardless of DOM containment.
      // This handles Radix portals, tooltips, dropdowns, etc. that render outside the panel DOM.
      const rect = panelRef.current.getBoundingClientRect();
      if (event.clientX >= rect.left) return;

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
        : 'fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white/60 backdrop-blur-xl shadow-2xl flex flex-col border-l border-gray-200/40';

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
          <div className="flex-shrink-0 p-4 md:p-6 space-y-3">
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
                        className="flex-1 min-w-0 flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-lg font-bold text-gray-900">Cost Calculator</span>
                        <span className="text-sm text-gray-500 truncate w-full text-center">
                          {packageName} &middot; {formatCurrency(price, currencySymbol)}
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400 mt-0.5" />
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
                  <h2 className="text-lg font-bold text-gray-900">Cost Calculator</h2>
                  <p className="text-sm text-gray-500 truncate">{packageName} &middot; {formatCurrency(price, currencySymbol)}</p>
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
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50">
                <Lock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 flex-1">This won't be visible to your clients!</p>
                <button
                  onClick={dismissPrivacy}
                  className="text-xs text-blue-400 hover:text-blue-600 flex-shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 overscroll-contain">
            <div className="space-y-4">
              {/* Template selector + save as template */}
              {!templateMode && (
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1" ref={templateDropdownRef}>
                    <button
                      type="button"
                      onClick={() => { setTemplateDropdownOpen(!templateDropdownOpen); setRenamingTemplateId(null); setConfirmingClear(false); }}
                      className="w-full h-9 flex items-center justify-between px-3 rounded-lg border-0 bg-gray-50 text-sm shadow-sm hover:bg-white hover:shadow-md transition-all"
                    >
                      <span className={templateSelectValue ? 'text-gray-900' : 'text-gray-400'}>
                        {templateSelectValue === EXAMPLE_TEMPLATE_ID
                          ? EXAMPLE_TEMPLATE.name
                          : templateLibrary.find((t) => t.id === templateSelectValue)?.name
                          || 'Use a template'}
                      </span>
                      <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', templateDropdownOpen && 'rotate-180')} />
                    </button>

                    {templateDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden max-h-[280px] overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            const hasData = categories.some((c) => {
                              if (c.type === 'time') return parseNum(c.qty) > 0 || parseNum(c.rate) > 0;
                              return parseNum(c.amount) > 0;
                            });
                            if (hasData && !confirmingClear) {
                              setConfirmingClear(true);
                              return;
                            }
                            setCategories(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, _id: `reset-${i}-${Date.now()}` })));
                            setMarginInputValue('30');
                            setTemplateSelectValue('');
                            setConfirmingClear(false);
                            setTemplateDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                            confirmingClear ? 'text-red-500 font-medium' : 'text-gray-400'
                          )}
                        >
                          {confirmingClear ? 'Clear all data?' : 'None'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const initCats = EXAMPLE_TEMPLATE.body.categories.map((c, i) => ({
                              ...c, _id: `example-${i}-${Date.now()}`,
                            }));
                            setCategories(initCats);
                            setMarginInputValue(String(EXAMPLE_TEMPLATE.body.marginPercent));
                            setTemplateSelectValue(EXAMPLE_TEMPLATE_ID);
                            setTemplateDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-400 italic hover:bg-gray-50"
                        >
                          {EXAMPLE_TEMPLATE.name}
                        </button>
                        {templateLibrary.map((t) => (
                          <div key={t.id} className="flex items-center hover:bg-gray-50 group/tpl">
                            {renamingTemplateId === t.id ? (
                              <div className="flex items-center gap-1.5 flex-1 px-2 py-1">
                                <Input
                                  autoFocus
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === 'Enter' && renameValue.trim()) {
                                      onRenameTemplate?.(t.id, renameValue.trim());
                                      setRenamingTemplateId(null);
                                    }
                                    if (e.key === 'Escape') setRenamingTemplateId(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-7 text-xs flex-1 border-0 bg-gray-50 shadow-sm"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (renameValue.trim()) onRenameTemplate?.(t.id, renameValue.trim());
                                    setRenamingTemplateId(null);
                                  }}
                                  className="text-emerald-600 hover:text-emerald-700 p-0.5"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTemplateSelectValue(t.id);
                                    Promise.resolve(onApplyTemplate?.(t.id)).catch(() => {});
                                    setTemplateDropdownOpen(false);
                                  }}
                                  className="flex-1 text-left px-3 py-2 text-sm text-gray-700 truncate"
                                >
                                  {t.name}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingTemplateId(t.id);
                                    setRenameValue(t.name);
                                  }}
                                  className="opacity-0 group-hover/tpl:opacity-100 text-gray-300 hover:text-gray-500 p-1.5"
                                  title="Rename"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTemplate?.(t.id);
                                    if (templateSelectValue === t.id) setTemplateSelectValue('');
                                  }}
                                  className="opacity-0 group-hover/tpl:opacity-100 text-gray-300 hover:text-red-500 p-1.5 mr-1"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {onSaveAsTemplate && savingTemplateName === null && (
                    <button
                      onClick={() => {
                        setSavingTemplateName('');
                        setSavingOverExisting(templateLibrary.length > 0);
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 min-h-[36px] px-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save template
                    </button>
                  )}
                </div>
              )}

              {/* Save template: overwrite existing or create new */}
              {savingTemplateName !== null && (
                <div className="bg-gray-50 rounded-lg p-2 space-y-2">
                  {/* Overwrite existing templates */}
                  {templateLibrary.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide px-1">Update existing</p>
                      {templateLibrary.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            const data = {
                              categories: categories.map(({ _id, ...c }) => c),
                              marginPercent: parseNum(marginInputValue) || 0,
                              hasOpened: true,
                              _templateName: t.name,
                              _overwriteId: t.id,
                            };
                            onSaveAsTemplate(data);
                            setSavingTemplateName(null);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs text-gray-700 rounded hover:bg-white truncate"
                        >
                          {t.name}
                        </button>
                      ))}
                      <div className="border-t border-gray-200 my-1" />
                    </div>
                  )}
                  {/* Create new */}
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide px-1">Create new</p>
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      value={savingTemplateName}
                      onChange={(e) => setSavingTemplateName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && savingTemplateName.trim()) {
                          const data = {
                            categories: categories.map(({ _id, ...c }) => c),
                            marginPercent: parseNum(marginInputValue) || 0,
                            hasOpened: true,
                            _templateName: savingTemplateName.trim(),
                          };
                          onSaveAsTemplate(data);
                          setSavingTemplateName(null);
                        }
                        if (e.key === 'Escape') setSavingTemplateName(null);
                      }}
                      placeholder="Template name..."
                      className="h-8 text-xs flex-1 border-0 bg-white shadow-sm"
                    />
                    <Button
                      size="sm"
                      disabled={!savingTemplateName.trim()}
                      onClick={() => {
                        const data = {
                          categories: categories.map(({ _id, ...c }) => c),
                          marginPercent: parseNum(marginInputValue) || 0,
                          hasOpened: true,
                          _templateName: savingTemplateName.trim(),
                        };
                        onSaveAsTemplate(data);
                        setSavingTemplateName(null);
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      Save
                    </Button>
                    <button
                      onClick={() => setSavingTemplateName(null)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

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
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-start gap-1.5 group">
                        <button
                          onClick={() => startEditName(cat)}
                          className="text-left text-sm font-medium text-gray-700 hover:text-gray-900 min-h-[44px] inline-flex items-center gap-1.5 px-1 rounded"
                        >
                          {cat.name}
                          <Pencil className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </div>
                    )}
                  </div>

                  {cat.type === 'time' ? (
                    <div className="flex flex-wrap items-center gap-2 group/row">
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={cat.qty}
                        onChange={(e) => updateCategory(idx, { qty: e.target.value })}
                        className="w-20 h-11 min-h-[44px] border-0 shadow-sm bg-gray-50 focus:bg-white focus:shadow-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <select
                        value={cat.unit}
                        onChange={(e) => updateCategory(idx, { unit: e.target.value })}
                        className="h-11 min-h-[44px] px-3 rounded-md border-0 shadow-sm bg-gray-50 text-sm focus:bg-white focus:shadow-md"
                      >
                        <option value="days">days</option>
                        <option value="hours">hours</option>
                      </select>
                      <span className="text-gray-400 text-xs">x</span>
                      <div className="relative w-28">
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="0"
                          value={cat.rate}
                          onChange={(e) => updateCategory(idx, { rate: e.target.value })}
                          className="w-full h-11 min-h-[44px] border-0 shadow-sm bg-gray-50 focus:bg-white focus:shadow-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <span className="text-gray-500">=</span>
                      <span className="font-medium text-gray-700 min-h-[44px] flex items-center">
                        {formatCurrency(
                          parseNum(cat.qty) * parseNum(cat.rate),
                          currencySymbol
                        )}
                      </span>
                      {categories.length > 1 && (
                        <button
                          onClick={() => deleteCategory(idx)}
                          className="opacity-0 group-hover/row:opacity-100 transition-opacity text-red-400 hover:text-red-600 ml-1"
                          aria-label="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative group/row">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none z-10">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="0"
                        value={cat.amount}
                        onChange={(e) => updateCategory(idx, { amount: e.target.value })}
                        className="h-11 min-h-[44px] pl-7 pr-10 border-0 shadow-sm bg-gray-50 focus:bg-white focus:shadow-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {categories.length > 1 && (
                        <button
                          onClick={() => deleteCategory(idx)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                          aria-label="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  {templateMode ? 'Reset all costs in this template' : 'Reset all costs for this package'}
                </button>
              </div>

            </div>
          </div>

          {/* Fixed summary footer */}
          <div className="flex-shrink-0 p-4 md:p-6 space-y-3 bg-gray-50/80">
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
                    className="w-16 h-9 text-sm border-0 shadow-sm bg-gray-50 focus:bg-white focus:shadow-md"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm text-gray-600">
                      Suggested min. price{' '}
                      <span className="font-semibold text-gray-900">{formatCurrency(suggestedPriceRoundedUp, currencySymbol)}</span>
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
