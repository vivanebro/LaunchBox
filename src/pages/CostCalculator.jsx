import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calculator,
  Plus,
  ArrowLeft,
  Loader2,
  Link2,
  Pencil,
  Trash2,
  CircleHelp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CostCalculatorPanel } from '@/components/CostCalculator/CostCalculatorPanel';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import supabaseClient from '@/lib/supabaseClient';

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'AUD', 'ILS'];

function getReferencePriceFromPackage(pkg) {
  if (!pkg) return 0;
  const retainer = pkg.pricingMode === 'retainer';
  const key = retainer ? 'price_premium_retainer' : 'price_premium';
  const fallback = retainer ? 'price_premium' : 'price_premium_retainer';
  const n = Number(pkg[key] ?? pkg[fallback] ?? pkg.price_growth ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function currencySymbol(c) {
  return { USD: '$', EUR: '€', GBP: '£', AUD: 'A$', ILS: '₪' }[c] || '$';
}

function parseMoneyInput(v) {
  if (v === '' || v == null) return 0;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function CostCalculator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const editParam = searchParams.get('edit');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [packages, setPackages] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const [templateName, setTemplateName] = useState('');
  const [linkedPackageId, setLinkedPackageId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [costBody, setCostBody] = useState(null);
  const [manualRefPrice, setManualRefPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const isEditing = editParam === 'new' || (editParam && editParam.length > 10);

  const linkedPkg = useMemo(
    () => packages.find((p) => p.id === linkedPackageId) || null,
    [packages, linkedPackageId]
  );

  const effectiveReferencePrice = useMemo(() => {
    if (linkedPkg) return getReferencePriceFromPackage(linkedPkg);
    return parseMoneyInput(manualRefPrice);
  }, [linkedPkg, manualRefPrice]);

  const displayCurrency = linkedPkg?.currency || currency;

  const loadList = useCallback(async () => {
    const u = await supabaseClient.auth.me();
    setUser(u);
    if (!u?.id) {
      setLoading(false);
      return;
    }
    try {
      const [tplList, pkgList] = await Promise.all([
        supabaseClient.entities.CostCalculatorTemplate.filter({ created_by: u.id }, '-created_at'),
        supabaseClient.entities.PackageConfig.filter({ created_by: u.id }, '-created_date'),
      ]);
      setTemplates(tplList || []);
      setPackages(pkgList || []);
    } catch (e) {
      console.error(e);
      setLoadError('Could not load templates. If this is new, run the database migration for cost_calculator_templates.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const loadEditor = useCallback(async () => {
    if (!user?.id || !isEditing) return;
    setLoading(true);
    setLoadError(null);
    try {
      if (editParam === 'new') {
        setTemplateName('');
        setLinkedPackageId('');
        setCurrency('USD');
        setCostBody(null);
        setManualRefPrice('');
        setLoading(false);
        return;
      }
      const row = await supabaseClient.entities.CostCalculatorTemplate.get(editParam);
      if (row.created_by !== user.id) {
        setLoadError('Not found');
        setLoading(false);
        return;
      }
      setTemplateName(row.name || '');
      setLinkedPackageId(row.linked_package_id || '');
      setCurrency(row.currency || 'USD');
      const body = row.body && typeof row.body === 'object' ? row.body : null;
      setCostBody(body);
      if (!row.linked_package_id && body?.referencePrice != null && body.referencePrice !== '') {
        setManualRefPrice(String(body.referencePrice));
      } else {
        setManualRefPrice('');
      }
    } catch (e) {
      console.error(e);
      setLoadError('Template not found.');
    }
    setLoading(false);
  }, [user?.id, editParam, isEditing]);

  useEffect(() => {
    if (user?.id && isEditing) {
      loadEditor();
    }
  }, [user?.id, isEditing, loadEditor]);

  const handleSaveTemplate = async (dataFromPanel) => {
    const name = templateName.trim();
    if (!name) {
      alert('Please enter a template name.');
      return;
    }
    setSaving(true);
    try {
      const bodyPayload =
        dataFromPanel && typeof dataFromPanel === 'object'
          ? { ...dataFromPanel }
          : costBody && typeof costBody === 'object'
            ? { ...costBody }
            : { categories: [], marginPercent: 30, hasOpened: true };
      if (linkedPackageId) {
        delete bodyPayload.referencePrice;
      } else {
        bodyPayload.referencePrice = effectiveReferencePrice;
      }
      const payload = {
        name,
        body: bodyPayload,
        linked_package_id: linkedPackageId || null,
        currency: displayCurrency,
        updated_at: new Date().toISOString(),
      };
      if (editParam === 'new') {
        await supabaseClient.entities.CostCalculatorTemplate.create(payload);
      } else {
        await supabaseClient.entities.CostCalculatorTemplate.update(editParam, payload);
      }
      setSearchParams({});
      await loadList();
    } catch (e) {
      console.error(e);
      alert('Could not save template.');
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await supabaseClient.entities.CostCalculatorTemplate.delete(deleteId);
      setDeleteId(null);
      await loadList();
    } catch (e) {
      console.error(e);
      alert('Could not delete.');
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#F5F5F7' }}>
        <p className="text-gray-600">Sign in to manage cost templates.</p>
      </div>
    );
  }

  if (loading && !isEditing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <Loader2 className="w-10 h-10 animate-spin text-[#ff0044]" />
      </div>
    );
  }

  if (isEditing) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
          <Loader2 className="w-10 h-10 animate-spin text-[#ff0044]" />
        </div>
      );
    }
    if (loadError) {
      return (
        <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F5F7' }}>
          <Button variant="outline" className="mb-4 rounded-full" onClick={() => setSearchParams({})}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <p className="text-red-600">{loadError}</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen pb-16" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="max-w-3xl mx-auto px-6 py-10">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All templates
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-gray-200/80 bg-gradient-to-br from-white via-white to-rose-50/40 p-8 shadow-sm mb-8"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
                style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
              >
                <Calculator className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  {editParam === 'new' ? 'New template' : 'Edit template'}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Budget &amp; cost calculator
                </h1>
                <p className="text-gray-600 text-sm leading-relaxed max-w-xl">
                  Build a reusable cost structure. Link a package for reference pricing, then apply this template
                  from any package in the editor.
                </p>
              </div>
            </div>
          </motion.div>

          <TooltipProvider delayDuration={200}>
          <div className="space-y-5 mb-8">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Template name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Wedding film — full day"
                className="rounded-xl h-11 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-gray-400" />
                    Link package (optional)
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="About linking">
                        <CircleHelp className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[270px] text-xs leading-relaxed">
                      When linked, the calculator uses that package&apos;s premium tier price as the reference for
                      profit and margin. Clear the link to type any reference price yourself.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={linkedPackageId || 'none'}
                  onValueChange={(v) => {
                    const next = v === 'none' ? '' : v;
                    setLinkedPackageId(next);
                    if (!next && costBody?.referencePrice != null && costBody.referencePrice !== '') {
                      setManualRefPrice(String(costBody.referencePrice));
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl h-11 bg-white border-gray-200 shadow-sm">
                    <SelectValue placeholder="No package linked" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">None — enter reference price in calculator</SelectItem>
                    {packages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.package_set_name || p.business_name || 'Untitled'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1.5">
                  Optional shortcut: pull price from a real package instead of typing it.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="text-sm font-medium text-gray-700 block">Currency</label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="About currency">
                        <CircleHelp className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] text-xs leading-relaxed">
                      With a linked package, currency matches that package. Otherwise choose the currency for this
                      template&apos;s reference price and cost lines.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={displayCurrency} onValueChange={setCurrency} disabled={!!linkedPkg}>
                  <SelectTrigger className="rounded-xl h-11 bg-white border-gray-200 shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CURRENCY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {linkedPkg && (
                  <p className="text-xs text-gray-400 mt-1.5">Matches the linked package.</p>
                )}
              </div>
            </div>
          </div>
          </TooltipProvider>

          <CostCalculatorPanel
            isOpen
            variant="embedded"
            templateMode
            showCloseButton={false}
            onClose={() => {}}
            packageName={templateName.trim() || 'Untitled template'}
            packagePrice={effectiveReferencePrice}
            currencySymbol={currencySymbol(displayCurrency)}
            costData={costBody}
            onSave={setCostBody}
            onEmbeddedSave={handleSaveTemplate}
            templateReferenceEditable={!linkedPkg}
            referencePriceInputValue={manualRefPrice}
            onReferencePriceChange={setManualRefPrice}
            isMobile={false}
            tiers={[]}
            currentTier={null}
          />

          <p className="text-center text-sm text-gray-500 mt-6">
            Use <strong className="text-gray-700">Save template</strong> in the calculator above when you&apos;re done.
            {saving && (
              <span className="inline-flex items-center gap-1 ml-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving…
              </span>
            )}
          </p>
          <div className="flex justify-center mt-4">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => setSearchParams({})}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Cost calculator</h1>
            <p className="text-gray-600">
              Reusable cost &amp; margin templates. Apply them while editing any package.
            </p>
          </div>
          <Button
            onClick={() => setSearchParams({ edit: 'new' })}
            className="rounded-full bg-[#ff0044] hover:bg-[#cc0033] shrink-0 gap-2"
          >
            <Plus className="w-4 h-4" />
            New template
          </Button>
        </div>

        {loadError && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
            {loadError}
          </div>
        )}

        {templates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-sm"
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
            >
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No templates yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first template to standardize how you estimate costs and margins across packages.
            </p>
            <Button
              onClick={() => setSearchParams({ edit: 'new' })}
              className="rounded-full bg-[#ff0044] hover:bg-[#cc0033]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create template
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <motion.div
                key={t.id}
                layout
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-[#ff0044]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{t.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.linked_package_id ? 'Linked package · ' : ''}
                    Updated {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setSearchParams({ edit: t.id })}
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setDeleteId(t.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-10">
          Tip: open any package in the editor and use <strong className="text-gray-600">Use template</strong> in the
          cost calculator sidebar.
        </p>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This won&apos;t affect packages that already applied it — only removes the saved template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
