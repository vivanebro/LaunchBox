import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import supabaseClient from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import TipTapEditor from '@/components/contracts/TipTapEditor';
import { takePendingContractFolderId } from '@/lib/folderUtils';
import {
  ArrowLeft, Save, Share2, AlertTriangle, Upload, Eye,
  LayoutTemplate, Info, X, CheckCircle2, Loader2, CalendarDays
} from 'lucide-react';

export default function ContractEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('contractId');
  const templateEditId = searchParams.get('templateEditId');
  const isTemplate = searchParams.get('mode') === 'template';
  const fromTemplateId = searchParams.get('templateId');

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  const [name, setName] = useState('Untitled Contract');
  const [body, setBody] = useState('');
  const [accentColor, setAccentColor] = useState('#ff0044');
  const [logoUrl, setLogoUrl] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [consentText, setConsentText] = useState('By clicking "Sign Document", you agree that your signature is the legal equivalent of your handwritten signature.');
  const [mergeFieldDefs, setMergeFieldDefs] = useState([]);
  const [shareableLink, setShareableLink] = useState('');
  const [status, setStatus] = useState('draft');
  const [expiresAt, setExpiresAt] = useState('');
  const [isExpiryCalendarOpen, setIsExpiryCalendarOpen] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [mergeFieldError, setMergeFieldError] = useState('');

  const autoSaveTimer = useRef(null);
  const isNewRef = useRef(!contractId && !templateEditId);
  const savedIdRef = useRef(contractId || templateEditId || null);

  useEffect(() => {
    const load = async () => {
      try {
        if (contractId) {
          const c = await supabaseClient.entities.Contract.get(contractId);
          populateFromContract(c);
        } else if (templateEditId) {
          const t = await supabaseClient.entities.ContractTemplate.get(templateEditId);
          populateFromTemplate(t);
        } else if (fromTemplateId) {
          const t = await supabaseClient.entities.ContractTemplate.get(fromTemplateId);
          populateFromTemplate(t, true);
        }
      } catch (e) {
        console.error('Failed to load contract/template:', e);
      }
      setLoading(false);
    };
    load();
  }, [contractId, templateEditId, fromTemplateId]);

  const populateFromContract = (c) => {
    setContract(c);
    setName(c.name || '');
    setBody(c.body || '');
    setAccentColor(c.accent_color || '#ff0044');
    setLogoUrl(c.logo_url || '');
    setConfirmationMessage(c.custom_confirmation_message || '');
    setButtonLabel(c.custom_button_label || '');
    setButtonLink(c.custom_button_link || '');
    setConsentText(c.consent_text ?? 'By clicking "Sign Document", you agree that your signature is the legal equivalent of your handwritten signature.');
    setMergeFieldDefs(c.merge_field_definitions || []);
    setShareableLink(c.shareable_link || '');
    setStatus(c.status || 'draft');
    setExpiresAt(c.expires_at ? c.expires_at.slice(0, 16) : '');
    savedIdRef.current = c.id;
    isNewRef.current = false;
  };

  const populateFromTemplate = (t, createNew = false) => {
    setName(createNew ? t.name : t.name);
    setBody(t.body || '');
    setAccentColor(t.accent_color || '#ff0044');
    setLogoUrl(t.logo_url || '');
    setConfirmationMessage(t.custom_confirmation_message || '');
    setButtonLabel(t.custom_button_label || '');
    setButtonLink(t.custom_button_link || '');
    setMergeFieldDefs(t.merge_field_definitions || []);
    if (!createNew) {
      savedIdRef.current = t.id;
      isNewRef.current = false;
      setContract(t);
    }
  };

  const buildTemplatePayload = () => ({
    name,
    body,
    accent_color: accentColor,
    logo_url: logoUrl,
    custom_confirmation_message: confirmationMessage,
    custom_button_label: buttonLabel,
    custom_button_link: buttonLink,
    updated_at: new Date().toISOString(),
  });

  const buildPayload = () => ({
    name,
    body,
    accent_color: accentColor,
    logo_url: logoUrl,
    custom_confirmation_message: confirmationMessage,
    custom_button_label: buttonLabel,
    custom_button_link: buttonLink,
    consent_text: consentText,
    merge_field_definitions: mergeFieldDefs,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    updated_at: new Date().toISOString(),
  });

  const save = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isTemplate) {
        if (isNewRef.current) {
          const created = await supabaseClient.entities.ContractTemplate.create(buildTemplatePayload());
          savedIdRef.current = created.id;
          isNewRef.current = false;
        } else {
          await supabaseClient.entities.ContractTemplate.update(savedIdRef.current, buildTemplatePayload());
        }
      } else {
        if (isNewRef.current) {
          const link = crypto.randomUUID();
          setShareableLink(link);
          const pendingFolderId = takePendingContractFolderId();
          const created = await supabaseClient.entities.Contract.create({
            ...buildPayload(),
            shareable_link: link,
            status: 'draft',
            folder_id: pendingFolderId || null,
          });
          savedIdRef.current = created.id;
          isNewRef.current = false;
          setContract(created);
        } else {
          await supabaseClient.entities.Contract.update(savedIdRef.current, buildPayload());
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Save failed:', e);
    }
    setSaving(false);
  }, [name, body, accentColor, logoUrl, confirmationMessage, buttonLabel, buttonLink, mergeFieldDefs, expiresAt, isTemplate]);

  const triggerAutoSave = useCallback(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (name.trim()) save();
    }, 2000);
  }, [save, name]);

  const handleBodyChange = (newBody) => {
    setBody(newBody);
    triggerAutoSave();
  };

  const handleMergeFieldsChange = (detectedFields) => {
    setMergeFieldDefs(prev => {
      const existingMap = new Map(prev.map(f => [f.key, f]));
      return detectedFields.map(f => existingMap.get(f.key) || { key: f.key, label: f.label, value: '' });
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `logos/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('contract-assets')
        .upload(fileName, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('contract-assets').getPublicUrl(fileName);
      setLogoUrl(urlData.publicUrl);
      triggerAutoSave();
    } catch (err) {
      console.error('Logo upload failed:', err);
    }
    setUploadingLogo(false);
  };

  const handleShare = async () => {
    const unfilled = mergeFieldDefs.filter(f => !f.value?.trim());
    if (unfilled.length > 0) {
      setMergeFieldError(`Fill in all merge fields before sharing: ${unfilled.map(f => `{${f.key}}`).join(', ')}`);
      return;
    }
    setMergeFieldError('');
    await save();
    const link = shareableLink || crypto.randomUUID();
    if (savedIdRef.current) {
      await supabaseClient.entities.Contract.update(savedIdRef.current, {
        status: 'shared',
        shareable_link: link,
        merge_field_definitions: mergeFieldDefs,
      });
      setStatus('shared');
      setShareableLink(link);
    }
    const url = `${window.location.origin}${createPageUrl('ContractSign')}?shareId=${link}`;
    setShareLink(url);
    setShowShareModal(true);
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const openSaveAsTemplate = () => {
    setTemplateName(name ? name + ' (Template)' : '');
    setShowTemplateModal(true);
  };

  const confirmSaveAsTemplate = async () => {
    if (!templateName.trim()) return;
    setSavingTemplate(true);
    try {
      await supabaseClient.entities.ContractTemplate.create({ name: templateName.trim(), body });
      setShowTemplateModal(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('Failed to save as template:', e);
    }
    setSavingTemplate(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="w-8 h-8 border-4 border-[#ff0044] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSigned = status === 'signed';
  const isSharedOrSigned = status === 'shared' || status === 'signed';
  const selectedExpiryDate = expiresAt ? new Date(expiresAt) : undefined;

  const formatDateTimeLocal = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const updateExpiryDate = (date) => {
    if (!date) return;
    const base = expiresAt ? new Date(expiresAt) : new Date();
    base.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    base.setHours(23, 59, 0, 0);
    setExpiresAt(formatDateTimeLocal(base));
    triggerAutoSave();
    setIsExpiryCalendarOpen(false);
  };

  const clearExpiry = () => {
    setExpiresAt('');
    triggerAutoSave();
  };

  if (isSigned && !isTemplate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="bg-white rounded-3xl p-12 max-w-md text-center shadow-sm">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Contract Signed</h2>
          <p className="text-gray-500 mb-6">This contract has been signed and can no longer be edited.</p>
          <Button onClick={() => navigate(createPageUrl('Contracts'))} className="bg-[#ff0044] hover:bg-[#cc0033] text-white">
            Back to My Contracts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(isTemplate ? createPageUrl('ContractTemplates') : createPageUrl('Contracts'))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); triggerAutoSave(); }}
          placeholder={isTemplate ? 'Template name…' : 'Contract name…'}
          className="max-w-xs font-semibold border-0 bg-transparent text-gray-900 px-0 focus-visible:ring-0 text-base"
        />

        <div className="ml-auto flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
          {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}

          {!isTemplate && contract && (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={openSaveAsTemplate}>
              <LayoutTemplate className="w-4 h-4" />
              Save as Template
            </Button>
          )}

          <Button variant="outline" size="sm" className="gap-1.5" onClick={save} disabled={saving || !name.trim()}>
            <Save className="w-4 h-4" />
            Save
          </Button>

          {!isTemplate && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={async () => {
                await save();
                const link = shareableLink || savedIdRef.current;
                if (link) {
                  window.open(`${window.location.origin}${createPageUrl('ContractSign')}?shareId=${shareableLink}&preview=true`, '_blank');
                }
              }}
              disabled={!name.trim() || saving}
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          )}

          {!isTemplate && (
            <Button size="sm" className="gap-1.5 bg-[#ff0044] hover:bg-[#cc0033] text-white" onClick={handleShare} disabled={!name.trim()}>
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          )}
        </div>
      </div>

      {isSharedOrSigned && (
        <div className="px-4 sm:px-6 pt-4">
          <Alert className="border-yellow-200 bg-yellow-50 max-w-5xl mx-auto">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Any changes will update the live version of this contract.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 flex gap-0 overflow-hidden">
        <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 p-5 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Branding</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Logo</label>
              {logoUrl ? (
                <div className="relative group">
                  <img src={logoUrl} alt="Logo" className="max-h-16 object-contain rounded-lg border border-gray-200 p-2" />
                  <button onClick={() => setLogoUrl('')} className="absolute top-1 right-1 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-center hover:border-[#ff0044] hover:bg-red-50 transition-colors"
                >
                  {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" /> : <><Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" /><span className="text-xs text-gray-500">Upload logo</span></>}
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={accentColor} onChange={(e) => { setAccentColor(e.target.value); triggerAutoSave(); }} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                <span className="text-sm text-gray-500 font-mono">{accentColor}</span>
              </div>
            </div>
          </div>

          {!isTemplate && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Expiration</h3>
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 space-y-3">
                <label className="text-xs font-medium text-gray-600 block">Expires on (optional)</label>
                <Popover open={isExpiryCalendarOpen} onOpenChange={setIsExpiryCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start rounded-xl border-gray-200 bg-white text-sm font-normal"
                    >
                      <CalendarDays className="w-4 h-4 text-gray-500" />
                      {selectedExpiryDate
                        ? selectedExpiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'Pick expiration date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0 rounded-xl border border-gray-200 shadow-xl">
                    <Calendar
                      mode="single"
                      selected={selectedExpiryDate}
                      onSelect={updateExpiryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">After this date, clients cannot sign.</p>
                  {expiresAt && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-500" onClick={clearExpiry}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Post-Signature</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-xs font-medium text-gray-600">Confirmation Message</label>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Confirmation message info">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
                        This is the message your client sees immediately after signing.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea value={confirmationMessage} onChange={(e) => { setConfirmationMessage(e.target.value); triggerAutoSave(); }} placeholder="Congrats, you're all set! We'll be in touch shortly." rows={3} className="text-sm resize-none" />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-xs font-medium text-gray-600">Next Step Button Label</label>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Next step button label info">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
                        This is the text shown on the action button after your client signs.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input value={buttonLabel} onChange={(e) => { setButtonLabel(e.target.value); triggerAutoSave(); }} placeholder="Book Your Kickoff Call" className="text-sm" />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-xs font-medium text-gray-600">Next Step Button Link</label>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Next step button link info">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
                        This is where clients go when they click the next-step button after signing.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input value={buttonLink} onChange={(e) => { setButtonLink(e.target.value); triggerAutoSave(); }} placeholder="https://calendly.com/…" className="text-sm" />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="text-xs font-medium text-gray-600">Consent Text</label>
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Consent text info">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
                        Shown above the Sign button. Leave empty to hide it.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea value={consentText} onChange={(e) => { setConsentText(e.target.value); triggerAutoSave(); }} placeholder="Leave empty to hide" rows={2} className="text-sm resize-none" />
              </div>
            </div>
          </div>

          {!isTemplate && mergeFieldDefs.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Merge Field Values</h3>
              <p className="text-xs text-gray-400 mb-3 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                Fill these in before sharing. Clients will see the values, not the placeholders.
              </p>
              {mergeFieldError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {mergeFieldError}
                </p>
              )}
              <div className="space-y-2">
                {mergeFieldDefs.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-gray-600 block mb-1">{field.label || field.key} <span className="text-gray-400 font-normal ml-1">{`{${field.key}}`}</span></label>
                    <Input value={field.value || ''} onChange={(e) => setMergeFieldDefs(prev => prev.map(f => f.key === field.key ? { ...f, value: e.target.value } : f))} placeholder={`Value for {${field.key}}`} className="text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <TipTapEditor value={body} onChange={handleBodyChange} onMergeFieldsChange={handleMergeFieldsChange} accentColor={accentColor} />
          </div>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contract ready to share!</h2>
            <p className="text-gray-500 text-sm mb-5">Share this link with your client. They can read and sign without creating an account.</p>
            <div className="flex gap-2 mb-6">
              <input readOnly value={shareLink} className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 outline-none truncate" />
              <Button onClick={copyShareLink} className="bg-[#ff0044] hover:bg-[#cc0033] text-white shrink-0">
                {linkCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setShowShareModal(false)}>Done</Button>
          </div>
        </div>
      )}

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Save as Template</h2>
            <p className="text-gray-500 text-sm mb-5">Give your template a name so you can reuse it later.</p>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
              className="mb-4"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') confirmSaveAsTemplate(); }}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowTemplateModal(false)}>Cancel</Button>
              <Button
                className="flex-1 bg-[#ff0044] hover:bg-[#cc0033] text-white"
                onClick={confirmSaveAsTemplate}
                disabled={!templateName.trim() || savingTemplate}
              >
                {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
