import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Sparkles, Loader2, Edit2, Save, X, ArrowLeft, Link as LinkIcon, GripVertical, Download, Trash2, Undo2, Copy, Settings, FileSignature, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { toPng } from 'html-to-image';
import { exportPackageAsImages } from '@/lib/exportPackageImage';
import { createPageUrl } from '@/utils';
import supabaseClient from '@/lib/supabaseClient';
import { logPackageView, startTimeTracking, logButtonClick } from '@/lib/packageAnalytics';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicPreviewPath } from '@/lib/publicPackageUrl';
import { CostCalculatorPanel } from '@/components/CostCalculator/CostCalculatorPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CostCalculatorTrigger,
  getCostCalculatorDisplay,
  hasOpenedCalculatorOnce,
  setOpenedCalculatorOnce,
  hasNudgeBeenDismissed,
  setNudgeDismissed,
} from '@/components/CostCalculator/CostCalculatorTrigger';
import { extractMergeFieldKeys } from '@/components/contracts/MergeFieldExtension';
import { toast } from '@/components/ui/use-toast';
import AssignFolderMenu from '@/components/folders/AssignFolderMenu';
import CopyLinkFolderPrompt from '@/components/folders/CopyLinkFolderPrompt';
import { takePendingFolderId } from '@/lib/folderUtils';

const getBrandColor = (config) => config?.brand_color || '#ff0044';

const getDarkerBrandColor = (color) => {
  if (!color || typeof color !== 'string' || !color.startsWith('#')) return '#cc0033';
  const hex = color.slice(1);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const darkenFactor = 0.8;
  const dr = Math.floor(r * darkenFactor);
  const dg = Math.floor(g * darkenFactor);
  const db = Math.floor(b * darkenFactor);

  return `#${(1 << 24 | dr << 16 | dg << 8 | db).toString(16).slice(1)}`;
};

const roundToNearest50 = (price) => {
  return Math.ceil(price / 50) * 50;
};

const roundToNearest50IfNeeded = (price) => {
  const remainder = price % 50;
  if (remainder === 0) {
    return price;
  }
  return Math.ceil(price / 50) * 50;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Currency symbol helper
const getCurrencySymbol = (currency) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AUD': 'A$',
    'ILS': '₪'
  };
  return symbols[currency] || '$';
};

// Currency data
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' }
];

// Button configuration options for Get Started
const BUTTON_OPTIONS = [
  { id: 'book_a_call', label: 'Book a Call', placeholder: 'Paste your calendar link', hint: 'best if you haven\'t presented the offer live yet' },
  { id: 'lock_your_spot', label: 'Lock Your Spot', placeholder: 'Paste your payment link', hint: 'best after presenting, or if you want them to buy straight away' },
  { id: 'sign_contract', label: 'Sign Contract', placeholder: 'Paste your e-signature link', hint: 'best if you want them to sign before paying' },
  { id: 'apply', label: 'Apply', placeholder: 'Paste your form link', hint: 'best if you want to qualify them first' },
  { id: 'custom', label: 'Custom', placeholder: 'Paste the link here', hint: '' }
];

const getCTAOptionEmoji = (optionId) => {
  const emojis = { book_a_call: '📅', lock_your_spot: '🔒', sign_contract: '✍️', apply: '📋', custom: '✏️' };
  return emojis[optionId] || '✏️';
};

const buildContractSignUrl = (shareableLink) => {
  if (!shareableLink) return '';
  return `${typeof window !== 'undefined' ? window.location.origin : ''}${createPageUrl('ContractSign')}?shareId=${shareableLink}`;
};

const buildContractPreviewUrl = (contractUrl) => {
  if (!contractUrl) return '';
  try {
    const u = new URL(contractUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    u.searchParams.set('preview', 'true');
    return u.toString();
  } catch {
    const hasQuery = String(contractUrl).includes('?');
    return `${contractUrl}${hasQuery ? '&' : '?'}preview=true`;
  }
};

const PRICE_MERGE_KEYS = new Set(['price', 'total_price', 'amount', 'total']);
const DATE_MERGE_KEYS = new Set(['date', 'contract_date', 'today']);

/** Build merge_field_definitions from template body + current package tier (only package name auto-filled). */
const buildMergeFieldDefinitionsFromTemplateBody = (bodyJson, cfg, tier, modeKey) => {
  if (bodyJson == null || bodyJson === '') return [];
  let doc;
  try {
    doc = typeof bodyJson === 'string' ? JSON.parse(bodyJson) : bodyJson;
  } catch {
    return [];
  }
  const fields = extractMergeFieldKeys(doc);
  const packageName = cfg?.package_names?.[modeKey]?.[tier] ?? '';

  return fields.map(({ key, label }) => {
    const k = (key || '').toLowerCase();
    let value = '';
    if (k === 'package_name' || k === 'project_name' || k === 'package') value = packageName;
    else if (PRICE_MERGE_KEYS.has(k)) value = '';
    else if (DATE_MERGE_KEYS.has(k)) value = '';
    return { key, label: label || key, value };
  });
};

const TIER_SCOPED_MERGE_KEYS = new Set([
  'package_name', 'project_name', 'package', 'price', 'total_price', 'amount', 'total',
]);

const getTodayMergeDate = () =>
  new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const getMergeFieldValue = (defs, keys = []) => {
  const byKey = new Map((defs || []).map((d) => [String(d?.key || '').toLowerCase(), String(d?.value || '').trim()]));
  for (const key of keys) {
    const v = byKey.get(String(key || '').toLowerCase());
    if (v) return v;
  }
  return '';
};

const formatBundleNameFromTier = (tier) => {
  const raw = String(tier || '').trim();
  if (!raw) return '';
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const buildDefaultContractName = (mergeDefs, tier, fallbackName = 'Contract') => {
  const clientName = getMergeFieldValue(mergeDefs, ['client_name', 'client']);
  const packageName = getMergeFieldValue(mergeDefs, ['package_name', 'project_name', 'package']);
  const bundleName = getMergeFieldValue(mergeDefs, ['bundle_name', 'bundle']) || formatBundleNameFromTier(tier);
  const today = getTodayMergeDate();
  const isSameLabel = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  const finalBundleName = isSameLabel(packageName, bundleName) ? '' : bundleName;
  const name = [clientName, packageName, finalBundleName, today].filter(Boolean).join(' - ');
  return name || fallbackName;
};

const contractBodyHasTierScopedMergeFields = (bodyJson) => {
  if (bodyJson == null || bodyJson === '') return false;
  let doc;
  try {
    doc = typeof bodyJson === 'string' ? JSON.parse(bodyJson) : bodyJson;
  } catch {
    return false;
  }
  const fields = extractMergeFieldKeys(doc);
  return fields.some(({ key }) => TIER_SCOPED_MERGE_KEYS.has((key || '').toLowerCase()));
};

const extractShareIdFromContractSignUrl = (url) => {
  if (!url) return '';
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const id = u.searchParams.get('shareId');
    if (id) return id;
  } catch {
    /* relative URL */
  }
  const m = String(url).match(/shareId=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : '';
};

/** Tier-specific merge keys from package config; other keys inherit from the base contract (e.g. client name). */
const buildMergeDefsForTierClone = (baseContract, cfg, tier, modeKey) => {
  const fresh = buildMergeFieldDefinitionsFromTemplateBody(baseContract.body, cfg, tier, modeKey);
  const baseDefs = baseContract.merge_field_definitions || [];
  const baseByKey = Object.fromEntries(baseDefs.map((d) => [d.key, d]));
  return fresh.map((f) => {
    const k = (f.key || '').toLowerCase();
    if (TIER_SCOPED_MERGE_KEYS.has(k)) return f;
    const b = baseByKey[f.key];
    if (b && String(b.value || '').trim()) return { ...f, value: b.value };
    return f;
  });
};

export default function Results() {
  const { creator, slug } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [pricingMode, setPricingMode] = useState('one-time');
  const [currentDesign, setCurrentDesign] = useState(1);
  const [saving, setSaving] = useState(false);
  const [popularPackageIndex, setPopularPackageIndex] = useState({ onetime: 2, retainer: 2 });
  const [popularBadgeText, setPopularBadgeText] = useState('Most Popular');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFreshReveal, setIsFreshReveal] = useState(false);
  const [isEmbedMode, setIsEmbedMode] = useState(false);
  const [previewNotFound, setPreviewNotFound] = useState(false);
  const [packageId, setPackageId] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [showCopyLinkFolderPrompt, setShowCopyLinkFolderPrompt] = useState(false);
  const [configureModalTier, setConfigureModalTier] = useState(null);
  const [configureModalStep, setConfigureModalStep] = useState(1);
  const [configureModalOption, setConfigureModalOption] = useState('lock_your_spot');
  const [configureModalLink, setConfigureModalLink] = useState('');
  const [configureModalCustomLabel, setConfigureModalCustomLabel] = useState('');
  const [configureModalCopyToAll, setConfigureModalCopyToAll] = useState(false);
  const [configureModalSignSource, setConfigureModalSignSource] = useState('launchbox'); // 'launchbox' | 'external'
  const [userContracts, setUserContracts] = useState([]);
  const [userContractTemplates, setUserContractTemplates] = useState([]);
  const [isLoadingUserContracts, setIsLoadingUserContracts] = useState(false);
  /** After picking a contract template: unfilled merge fields can be filled in-modal before save. */
  const [templateMergeFieldsModal, setTemplateMergeFieldsModal] = useState(null);
  const [templateContractPreviewModal, setTemplateContractPreviewModal] = useState(null);
  const [savingTemplateMerge, setSavingTemplateMerge] = useState(false);
  const [editingToggleLabels, setEditingToggleLabels] = useState(false);
  const [tempLabelOnetime, setTempLabelOnetime] = useState('');
  const [tempLabelRetainer, setTempLabelRetainer] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExitEditModeModal, setShowExitEditModeModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [lastDeletedTier, setLastDeletedTier] = useState(null);
  const pendingNavigationRef = useRef(null);
  const bypassExitWarningRef = useRef(false);
  const toggleEditRef = useRef(null);
  const undoHistoryRef = useRef([]);
  const exportRef = React.useRef(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportingPdf, setExportingPdf] = React.useState(false);
  const [showExportDropdown, setShowExportDropdown] = React.useState(false);
  const [showPdfSubmenu, setShowPdfSubmenu] = React.useState(false);
  const exportDropdownRef = React.useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [costCalculatorTier, setCostCalculatorTier] = useState(null);
  const [costTemplates, setCostTemplates] = useState([]);

  const brandColor = config?.brand_color || '#ff0044';
  const darkerBrandColor = getDarkerBrandColor(brandColor);
  const currencySymbol = getCurrencySymbol(config?.currency || 'USD');
  const selectableLaunchBoxContracts = (userContracts || []).filter(
    (contract) => contract?.status === 'draft' && !!contract?.shareable_link
  );
  const linkedContractShareId = extractShareIdFromContractSignUrl(configureModalLink);
  const linkedLaunchBoxContract = linkedContractShareId
    ? (userContracts || []).find((contract) => contract?.shareable_link === linkedContractShareId)
    : null;
  const launchboxContractsForDropdown =
    linkedLaunchBoxContract && !selectableLaunchBoxContracts.some((contract) => contract.id === linkedLaunchBoxContract.id)
      ? [linkedLaunchBoxContract, ...selectableLaunchBoxContracts]
      : selectableLaunchBoxContracts;
  const showExcludedDeliverables = config?.show_excluded_deliverables !== false;
  const showPackageButtonsInEditMode = true;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('launchbox:toggleHelpButton', {
      detail: { hidden: Boolean(costCalculatorTier) }
    }));

    return () => {
      window.dispatchEvent(new CustomEvent('launchbox:toggleHelpButton', {
        detail: { hidden: false }
      }));
    };
  }, [costCalculatorTier]);

  useEffect(() => {
    let cancelled = false;
    supabaseClient.auth
      .me()
      .then((u) => {
        if (!cancelled) setProfileUser(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!profileUser?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const list = await supabaseClient.entities.CostCalculatorTemplate.filter(
          { created_by: profileUser.id },
          '-created_at'
        );
        if (!cancelled) {
          setCostTemplates((list || []).map((t) => ({ id: t.id, name: t.name })));
        }
      } catch (e) {
        console.warn('Cost calculator templates:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileUser?.id]);

  useEffect(() => {
    // Load Sour Gummy font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Sour+Gummy:wght@400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const urlParams = new URLSearchParams(window.location.search);
    const isPrettyPreviewPath = Boolean(creator && slug);
    const isPreview = urlParams.get('preview') === 'true' || isPrettyPreviewPath;
    const isEmbed = urlParams.get('embed') === 'true';
    let idFromUrl = urlParams.get('packageId');
    // Fresh from wizard: show packages in preview-first mode with a "Customize" button
    const isFreshBuild = localStorage.getItem('freshFromWizard') === 'true';
    if (isFreshBuild) {
      localStorage.removeItem('freshFromWizard');
      setIsFreshReveal(true);
    }
    setIsPreviewMode(isPreview);
    setIsEmbedMode(isEmbed);

    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const loadPackageConfig = async () => {
      // Set initial pricing mode based on pricing_availability
      let loadedConfig = null;
      setPreviewNotFound(false);
      if (!idFromUrl && isPrettyPreviewPath) {
        try {
          const matchingPackages = await supabaseClient.entities.PackageConfig.filter({
            creator_slug: creator,
            public_slug: slug
          });
          if (matchingPackages.length > 0) {
            loadedConfig = matchingPackages[0];
            idFromUrl = loadedConfig.id;
          }
        } catch (publicPathError) {
          console.error('Error loading package by public URL:', publicPathError);
        }
      }

      if (isPreview && idFromUrl) {
        // Only track if viewer is NOT the owner (not logged in)
        supabaseClient.auth.me().then(() => {
          // logged in = owner, don't track
        }).catch(() => {
          // not logged in = real client, track it
          window.__analyticsViewId = null;
          window.__analyticsPending = logPackageView(idFromUrl).then(viewId => {
            window.__analyticsViewId = viewId;
            const cleanup = startTimeTracking(viewId);
            window.__analyticsCleanup = cleanup;
            return viewId;
          });
        });
      }

      if (idFromUrl) {
        setPackageId(idFromUrl);
      }

      if (idFromUrl) {
        try {
          // Try loading with user auth first
          loadedConfig = await supabaseClient.entities.PackageConfig.get(idFromUrl);
          if (loadedConfig) {
            loadedConfig.id = idFromUrl;
          }
        } catch (error) {
          console.error('Error loading package by ID:', error);
          // If in preview mode and we can't load (e.g. not authenticated), try filter
          if (isPreview) {
            try {
              const results = await supabaseClient.entities.PackageConfig.filter({ id: idFromUrl });
              if (results && results.length > 0) {
                loadedConfig = results[0];
                loadedConfig.id = idFromUrl;
              }
            } catch (filterError) {
              console.error('Fallback filter also failed:', filterError);
            }
          }
          if (!loadedConfig) {
            setPackageId(null);
            idFromUrl = null;
          }
        }
      }
      
      if (!loadedConfig && !isPreview) {
        const savedConfig = localStorage.getItem('packageConfig');
        if (savedConfig) {
          loadedConfig = JSON.parse(savedConfig);
          // If loaded from localStorage and has an id but no URL packageId,
          // DON'T use the stale id — it may refer to a deleted package
          if (loadedConfig.id && !idFromUrl) {
            delete loadedConfig.id;
          }
        }
      }

      if (!loadedConfig && isPreview) {
        setPreviewNotFound(true);
        return;
      }

      if (loadedConfig) {
        // Initialize package_data structure if it doesn't exist
        if (!loadedConfig.package_data) {
          loadedConfig.package_data = {
            onetime: {
              starter: {
                deliverables: loadedConfig.starter_deliverables || [],
                bonuses: loadedConfig.starter_bonuses || []
              },
              growth: {
                deliverables: loadedConfig.growth_deliverables || [],
                bonuses: loadedConfig.growth_bonuses || []
              },
              premium: {
                deliverables: loadedConfig.premium_deliverables || [],
                bonuses: loadedConfig.premium_bonuses || []
              }
            },
            retainer: {
              starter: {
                deliverables: loadedConfig.starter_deliverables || [],
                bonuses: loadedConfig.starter_bonuses || []
              },
              growth: {
                deliverables: loadedConfig.growth_deliverables || [],
                bonuses: loadedConfig.growth_bonuses || []
              },
              premium: {
                deliverables: loadedConfig.premium_deliverables || [],
                bonuses: loadedConfig.premium_bonuses || []
              }
            }
          };
        }

        if (!loadedConfig.price_starter_retainer && loadedConfig.price_starter) {
          loadedConfig.price_starter_retainer = roundToNearest50(Math.round(loadedConfig.price_starter * 0.85));
        }
        if (!loadedConfig.price_growth_retainer && loadedConfig.price_growth) {
          loadedConfig.price_growth_retainer = roundToNearest50(Math.round(loadedConfig.price_growth * 0.85));
        }
        if (!loadedConfig.price_premium_retainer && loadedConfig.price_premium) {
          loadedConfig.price_premium_retainer = roundToNearest50(Math.round(loadedConfig.price_premium * 0.85));
        }

        // Migrate old package_descriptions to new structure
        if (!loadedConfig.package_descriptions || loadedConfig.package_descriptions === null || !loadedConfig.package_descriptions.onetime) {
          const oldDescriptions = (loadedConfig.package_descriptions && loadedConfig.package_descriptions !== null && typeof loadedConfig.package_descriptions === 'object') ? loadedConfig.package_descriptions : {};
          loadedConfig.package_descriptions = {
            onetime: {
              starter: oldDescriptions.starter || 'For individuals just starting out who need essential features',
              growth: oldDescriptions.growth || 'For growing businesses that want to scale their content',
              premium: oldDescriptions.premium || 'For established brands that need complete solutions'
            },
            retainer: {
              starter: oldDescriptions.starter || 'For individuals just starting out who need essential features',
              growth: oldDescriptions.growth || 'For growing businesses that want to scale their content',
              premium: oldDescriptions.premium || 'For established brands that need complete solutions'
            }
          };
        }
        if (!loadedConfig.headline) {
          loadedConfig.headline = 'Simple, transparent pricing';
        }
        if (!loadedConfig.sub_headline) {
          loadedConfig.sub_headline = 'No surprise fees.';
        }
        if ((!loadedConfig.duration_min || !loadedConfig.duration_max || !loadedConfig.duration_unit) && loadedConfig.project_duration) {
          const match = loadedConfig.project_duration.match(/(\d+)(?:-(\d+))?\s*(\w+)/);
          if (match) {
            loadedConfig.duration_min = parseInt(match[1]);
            loadedConfig.duration_max = match[2] ? parseInt(match[2]) : parseInt(match[1]);
            loadedConfig.duration_unit = match[3];
          }
        } else if (!loadedConfig.duration_min && !loadedConfig.project_duration) {
          loadedConfig.duration_min = 2;
          loadedConfig.duration_max = 4;
          loadedConfig.duration_unit = 'weeks';
        }
        
        // Initialize new fields for existing configs if they don't exist
        if (loadedConfig.pricing_label_onetime === undefined) loadedConfig.pricing_label_onetime = 'one-time';
        if (loadedConfig.pricing_label_retainer === undefined) loadedConfig.pricing_label_retainer = 'monthly';
        if (loadedConfig.pricing_button_label_onetime === undefined) loadedConfig.pricing_button_label_onetime = 'One-time Project';
        if (loadedConfig.pricing_button_label_retainer === undefined) loadedConfig.pricing_button_label_retainer = 'Monthly Retainer';
        if (loadedConfig.retainer_discount_text === undefined) loadedConfig.retainer_discount_text = '15% off one-time price';
        if (loadedConfig.starter_duration === undefined) loadedConfig.starter_duration = null;
        if (loadedConfig.growth_duration === undefined) loadedConfig.growth_duration = null;
        if (loadedConfig.premium_duration === undefined) loadedConfig.premium_duration = null;
        if (loadedConfig.currency === undefined) {
          try {
            const me = await supabaseClient.auth.me();
            loadedConfig.currency = me?.default_currency || 'USD';
          } catch (_) {
            loadedConfig.currency = 'USD';
          }
        }
        if (loadedConfig.pricing_availability === undefined) loadedConfig.pricing_availability = 'both';
        if (loadedConfig.show_excluded_deliverables === undefined) loadedConfig.show_excluded_deliverables = true;
        if (loadedConfig.show_package_buttons_in_edit_mode === undefined) loadedConfig.show_package_buttons_in_edit_mode = true;
        // Migrate old button_links to new structure
        if (!loadedConfig.button_links || loadedConfig.button_links === null || !loadedConfig.button_links.onetime) {
          const oldLinks = (loadedConfig.button_links && loadedConfig.button_links !== null && typeof loadedConfig.button_links === 'object') ? loadedConfig.button_links : {};
          loadedConfig.button_links = {
            onetime: {
              starter: oldLinks.starter || '',
              growth: oldLinks.growth || '',
              premium: oldLinks.premium || ''
            },
            retainer: {
              starter: oldLinks.starter || '',
              growth: oldLinks.growth || '',
              premium: oldLinks.premium || ''
            }
          };
        }

        // Migrate old duration fields to new structure
        if (!loadedConfig.package_durations || loadedConfig.package_durations === null) {
          loadedConfig.package_durations = {
            onetime: {
              starter: loadedConfig.starter_duration || null,
              growth: loadedConfig.growth_duration || null,
              premium: loadedConfig.premium_duration || null
            },
            retainer: {
              starter: loadedConfig.starter_duration || null,
              growth: loadedConfig.growth_duration || null,
              premium: loadedConfig.premium_duration || null
            }
          };
        }


        console.log('Loaded config button_links:', loadedConfig.button_links);

        // Migrate old popularPackageIndex to new structure
        if (typeof loadedConfig.popularPackageIndex === 'number') {
          loadedConfig.popularPackageIndex = {
            onetime: loadedConfig.popularPackageIndex,
            retainer: loadedConfig.popularPackageIndex
          };
        } else if (!loadedConfig.popularPackageIndex) {
          loadedConfig.popularPackageIndex = { onetime: 2, retainer: 2 };
        }

        // Ensure package_names exists and has proper structure
        if (!loadedConfig.package_names || !loadedConfig.package_names.onetime) {
          const oldNames = (loadedConfig.package_names && typeof loadedConfig.package_names === 'object' && loadedConfig.package_names !== null) ? loadedConfig.package_names : {};
          loadedConfig.package_names = {
            onetime: {
              starter: oldNames.starter || 'Starter',
              growth: oldNames.growth || 'Growth',
              premium: oldNames.premium || 'Premium',
              elite: oldNames.elite || 'Elite'
            },
            retainer: {
              starter: oldNames.starter || 'Starter',
              growth: oldNames.growth || 'Growth',
              premium: oldNames.premium || 'Premium',
              elite: oldNames.elite || 'Elite'
            }
          };
        }

        // Initialize active packages if not set
        if (!loadedConfig.active_packages || loadedConfig.active_packages === null) {
          loadedConfig.active_packages = {
            onetime: ['starter', 'growth', 'premium'],
            retainer: ['starter', 'growth', 'premium']
          };
        }

        // Initialize elite tier data structures if not present or null
        if (!loadedConfig.package_data.onetime) loadedConfig.package_data.onetime = {};
        if (!loadedConfig.package_data.retainer) loadedConfig.package_data.retainer = {};
        if (!loadedConfig.package_data.onetime.elite) {
          loadedConfig.package_data.onetime.elite = { deliverables: [], bonuses: [] };
        }
        if (!loadedConfig.package_data.retainer.elite) {
          loadedConfig.package_data.retainer.elite = { deliverables: [], bonuses: [] };
        }
        // Ensure all tiers have valid objects (not null)
        ['starter', 'growth', 'premium', 'elite'].forEach(tier => {
          if (!loadedConfig.package_data.onetime[tier]) {
            loadedConfig.package_data.onetime[tier] = { deliverables: [], bonuses: [] };
          }
          if (!loadedConfig.package_data.retainer[tier]) {
            loadedConfig.package_data.retainer[tier] = { deliverables: [], bonuses: [] };
          }
        });

        // Initialize elite package names
        if (loadedConfig.package_names) {
          if (!loadedConfig.package_names.onetime) loadedConfig.package_names.onetime = {};
          if (!loadedConfig.package_names.retainer) loadedConfig.package_names.retainer = {};
          if (!loadedConfig.package_names.onetime.elite) loadedConfig.package_names.onetime.elite = 'Elite';
          if (!loadedConfig.package_names.retainer.elite) loadedConfig.package_names.retainer.elite = 'Elite';
        }

        // Initialize elite descriptions
        if (loadedConfig.package_descriptions) {
          if (!loadedConfig.package_descriptions.onetime) loadedConfig.package_descriptions.onetime = {};
          if (!loadedConfig.package_descriptions.retainer) loadedConfig.package_descriptions.retainer = {};
          // Replace null values with defaults for all tiers
          ['starter', 'growth', 'premium', 'elite'].forEach(tier => {
            if (loadedConfig.package_descriptions.onetime[tier] === null || loadedConfig.package_descriptions.onetime[tier] === undefined) {
              loadedConfig.package_descriptions.onetime[tier] = tier === 'elite' ? 'For enterprise clients that need the ultimate solution' : '';
            }
            if (loadedConfig.package_descriptions.retainer[tier] === null || loadedConfig.package_descriptions.retainer[tier] === undefined) {
              loadedConfig.package_descriptions.retainer[tier] = tier === 'elite' ? 'For enterprise clients that need the ultimate solution' : '';
            }
          });
        }

        // Initialize elite durations
        if (!loadedConfig.package_durations || loadedConfig.package_durations === null) {
          loadedConfig.package_durations = {
            onetime: { starter: null, growth: null, premium: null, elite: null },
            retainer: { starter: null, growth: null, premium: null, elite: null }
          };
        } else {
          if (!loadedConfig.package_durations.onetime || loadedConfig.package_durations.onetime === null) {
            loadedConfig.package_durations.onetime = { starter: null, growth: null, premium: null, elite: null };
          }
          if (!loadedConfig.package_durations.retainer || loadedConfig.package_durations.retainer === null) {
            loadedConfig.package_durations.retainer = { starter: null, growth: null, premium: null, elite: null };
          }
        }

        // Initialize button links structure
        if (!loadedConfig.button_links || loadedConfig.button_links === null) loadedConfig.button_links = {};
        if (!loadedConfig.button_links.onetime || loadedConfig.button_links.onetime === null) loadedConfig.button_links.onetime = {};
        if (!loadedConfig.button_links.retainer || loadedConfig.button_links.retainer === null) loadedConfig.button_links.retainer = {};
        // Replace null values with empty strings for all tiers
        ['starter', 'growth', 'premium', 'elite'].forEach(tier => {
          if (loadedConfig.button_links.onetime[tier] === null || loadedConfig.button_links.onetime[tier] === undefined) {
            loadedConfig.button_links.onetime[tier] = '';
          }
          if (loadedConfig.button_links.retainer[tier] === null || loadedConfig.button_links.retainer[tier] === undefined) {
            loadedConfig.button_links.retainer[tier] = '';
          }
        });

        // Sync the packageId state with what we actually loaded
        if (loadedConfig.id) {
          setPackageId(loadedConfig.id);
        }

        setConfig(loadedConfig);
        setPopularPackageIndex(loadedConfig.popularPackageIndex);
        
        if (loadedConfig.popularBadgeText) {
          setPopularBadgeText(loadedConfig.popularBadgeText);
        }
        if (loadedConfig.currentDesign === 0 || loadedConfig.currentDesign === 1) {
          setCurrentDesign(loadedConfig.currentDesign);
        } else {
          setCurrentDesign(1);
        }
        if (loadedConfig.pricingMode) {
          setPricingMode(loadedConfig.pricingMode);
        }
        // Auto-set pricing mode based on availability
        if (loadedConfig.pricing_availability === 'onetime') {
          setPricingMode('one-time');
        } else if (loadedConfig.pricing_availability === 'retainer') {
          setPricingMode('retainer');
        }
        
        // Migrate old package_names to new structure (duplicate safety check)
        if (!loadedConfig.package_names || loadedConfig.package_names === null || !loadedConfig.package_names.onetime) {
          const oldNames = (loadedConfig.package_names && loadedConfig.package_names !== null && typeof loadedConfig.package_names === 'object') ? loadedConfig.package_names : {};
          loadedConfig.package_names = {
            onetime: {
              starter: oldNames.starter || 'Starter',
              growth: oldNames.growth || 'Growth',
              premium: oldNames.premium || 'Premium'
            },
            retainer: {
              starter: oldNames.starter || 'Starter',
              growth: oldNames.growth || 'Growth',
              premium: oldNames.premium || 'Premium'
            }
          };
        }
      } else {
        // Fetch user's default currency for new packages
        let userCurrency = 'USD';
        try {
          const me = await supabaseClient.auth.me();
          if (me?.default_currency) userCurrency = me.default_currency;
        } catch (_) {}
        setConfig({
            business_name: 'My Studio',
            headline: 'Simple, transparent pricing',
            sub_headline: 'No surprise fees.',
            package_descriptions: {
              onetime: {
                starter: 'For individuals just starting out who need essential features',
                growth: 'For growing businesses that want to scale their content',
                premium: 'For established brands that need complete solutions',
                elite: 'For enterprise clients that need the ultimate solution'
              },
              retainer: {
                starter: 'For individuals just starting out who need essential features',
                growth: 'For growing businesses that want to scale their content',
                premium: 'For established brands that need complete solutions',
                elite: 'For enterprise clients that need the ultimate solution'
              }
            },
            price_starter: 1000,
            price_growth: 3000,
            price_premium: 5000,
            price_starter_retainer: 850,
            price_growth_retainer: 2550,
            price_premium_retainer: 4250,
            package_data: {
              onetime: {
                starter: {
                  deliverables: [{ type: 'Deliverable 1', quantity: 1, length: '' }],
                  bonuses: ['Bonus 1']
                },
                growth: {
                  deliverables: [{ type: 'Deliverable 1', quantity: 1, length: '' }, { type: 'Deliverable 2', quantity: 1, length: '' }],
                  bonuses: ['Bonus 1', 'Bonus 2']
                },
                premium: {
                  deliverables: [{ type: 'Deliverable 1', quantity: 1, length: '' }, { type: 'Deliverable 2', quantity: 1, length: '' }, { type: 'Deliverable 3', quantity: 1, length: '' }],
                  bonuses: ['Bonus 1', 'Bonus 2', 'Bonus 3']
                },
                elite: {
                  deliverables: [],
                  bonuses: []
                }
              },
              retainer: {
                starter: {
                  deliverables: [{ type: 'Deliverable 1', quantity: 1, length: '' }],
                  bonuses: ['Bonus 1']
                },
                growth: {
                  deliverables: [{ type: 'Deliverable 1', quantity: 1, length: '' }, { type: 'Deliverable 2', quantity: 1, length: '' }],
                  bonuses: ['Bonus 1', 'Bonus 2']
                },
                premium: {
                  deliverables: [{ type: 'Deliverable 1', quantity: 1, length: '' }, { type: 'Deliverable 2', quantity: 1, length: '' }, { type: 'Deliverable 3', quantity: 1, length: '' }],
                  bonuses: ['Bonus 1', 'Bonus 2', 'Bonus 3']
                },
                elite: {
                  deliverables: [],
                  bonuses: []
                }
              }
            },
            popularPackageIndex: { onetime: 2, retainer: 2 },
            popularBadgeText: 'Most Popular',
            guarantee: '30-day money-back guarantee',
            urgency: 'Offer valid until end of month!',
            duration_min: 2,
            duration_max: 4,
            duration_unit: 'weeks',
            currentDesign: 0,
            pricingMode: 'one-time',
            brand_color: '#ff0044',
            pricing_label_onetime: 'one-time',
            pricing_label_retainer: 'monthly',
            pricing_button_label_onetime: 'One-time Project',
            pricing_button_label_retainer: 'Monthly Retainer',
            retainer_discount_text: '15% off one-time price',
            starter_duration: null,
            growth_duration: null,
            premium_duration: null,
            currency: userCurrency,
            pricing_availability: 'both',
            show_excluded_deliverables: true,
            show_package_buttons_in_edit_mode: true,
            package_names: {
              onetime: {
                starter: 'Starter',
                growth: 'Growth',
                premium: 'Premium',
                elite: 'Elite'
              },
              retainer: {
                starter: 'Starter',
                growth: 'Growth',
                premium: 'Premium',
                elite: 'Elite'
              }
            },
            button_links: {
              onetime: { starter: '', growth: '', premium: '', elite: '' },
              retainer: { starter: '', growth: '', premium: '', elite: '' }
            },
            package_durations: {
              onetime: { starter: null, growth: null, premium: null, elite: null },
              retainer: { starter: null, growth: null, premium: null, elite: null }
            },
            active_packages: {
              onetime: ['starter', 'growth', 'premium'],
              retainer: ['starter', 'growth', 'premium']
            },
        });
      }
    };

    loadPackageConfig();

    return () => window.removeEventListener('resize', checkMobile);
  }, [creator, slug]);

  useEffect(() => {
    if (!isPreviewMode || !isEmbedMode) return;

    const sendEmbedHeight = () => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      window.parent.postMessage(
        { type: 'launchbox:embedHeight', height },
        '*'
      );
    };

    const resizeObserver = new ResizeObserver(() => sendEmbedHeight());
    resizeObserver.observe(document.body);
    sendEmbedHeight();
    window.addEventListener('load', sendEmbedHeight);
    window.addEventListener('resize', sendEmbedHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('load', sendEmbedHeight);
      window.removeEventListener('resize', sendEmbedHeight);
    };
  }, [isPreviewMode, isEmbedMode, pricingMode, config]);

  // Use a ref to always have the latest config available (avoids stale closures)
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const cloneForUndo = (obj) => (typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)));

  const pushUndoSnapshot = () => {
    if (!config) return;
    const c = configRef.current || config;
    undoHistoryRef.current.push({
      config: cloneForUndo(c),
      popularPackageIndex: cloneForUndo(popularPackageIndex),
      popularBadgeText
    });
    setCanUndo(true);
  };

  const handleUndo = () => {
    const prev = undoHistoryRef.current.pop();
    if (!prev) return;
    setConfig(prev.config);
    configRef.current = prev.config;
    setPopularPackageIndex(prev.popularPackageIndex);
    setPopularBadgeText(prev.popularBadgeText);
    localStorage.setItem('packageConfig', JSON.stringify(prev.config));
    setCanUndo(undoHistoryRef.current.length > 0);
  };

  const updateConfig = (field, value) => {
    const currentConfig = configRef.current || config;
    const updatedConfig = { ...currentConfig, [field]: value };
    if (!isPreviewMode && currentConfig[field] !== value) {
      pushUndoSnapshot();
    }
    setConfig(updatedConfig);
    configRef.current = updatedConfig;
    localStorage.setItem('packageConfig', JSON.stringify(updatedConfig));
    console.log(`Updated ${field}:`, value);

    // Auto-update pricing mode when availability changes
    if (field === 'pricing_availability') {
      if (value === 'onetime') {
        setPricingMode('one-time');
      } else if (value === 'retainer') {
        setPricingMode('retainer');
      }
    }
  };

  // Helper to update multiple fields at once (avoids stale state issues)
  const updateConfigMultiple = (updates) => {
    const currentConfig = configRef.current || config;
    const hasChanges = Object.keys(updates).some((k) => currentConfig[k] !== updates[k]);
    if (!isPreviewMode && hasChanges) {
      pushUndoSnapshot();
    }
    const updatedConfig = { ...currentConfig, ...updates };
    setConfig(updatedConfig);
    configRef.current = updatedConfig;
    localStorage.setItem('packageConfig', JSON.stringify(updatedConfig));
    console.log('Updated multiple fields:', Object.keys(updates));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const file_url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      updateConfigMultiple({ logo_url: file_url, logo_height: (configRef.current || config).logo_height || 80 });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo');
    }
    setUploadingLogo(false);
  };

  // Safe nested config updater - prevents all null spread errors
  const safeUpdateNestedConfig = (field, tier, value) => {
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;
    const fieldData = c[field];
    const topLevel = (fieldData && typeof fieldData === 'object') ? fieldData : {};
    const modeLevel = (topLevel[modeKey] && typeof topLevel[modeKey] === 'object') ? topLevel[modeKey] : {};
    updateConfig(field, {
      ...topLevel,
      [modeKey]: {
        ...modeLevel,
        [tier]: value
      }
    });
  };

  const updateButtonLink = (tier, link) => safeUpdateNestedConfig('button_links', tier, link);

  const updateCostData = (tier, data) => {
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;
    const costData = (c.cost_data && typeof c.cost_data === 'object') ? c.cost_data : {};
    const modeData = (costData[modeKey] && typeof costData[modeKey] === 'object') ? costData[modeKey] : {};
    // Skip if data is identical to what's already stored (e.g. debounce re-firing after undo restores config)
    if (modeData[tier] && JSON.stringify(modeData[tier]) === JSON.stringify(data)) return;
    updateConfig('cost_data', {
      ...costData,
      [modeKey]: { ...modeData, [tier]: data }
    });
  };

  const openCostCalculator = (tier) => {
    setCostCalculatorTier(tier);
    setOpenedCalculatorOnce();
  };

  const openConfigureModal = (tier) => {
    const modeKey = getCurrentModeKey();
    const existingType = config.button_links?.[modeKey]?.[tier + '_type'];
    const existingLink = config.button_links?.[modeKey]?.[tier] || '';
    const existingLabel = config.button_links?.[modeKey]?.[tier + '_label'] || '';
    setConfigureModalTier(tier);
    setConfigureModalStep(1);
    setConfigureModalOption(existingType || 'lock_your_spot');
    setConfigureModalLink(existingLink);
    setConfigureModalCustomLabel(existingType === 'custom' ? existingLabel : '');
    // Detect sign source for sign_contract
    const isLaunchBoxContract = existingType === 'sign_contract' && existingLink && (
      existingLink.includes('shareId=') || existingLink.includes('/contractsign')
    );
    setConfigureModalSignSource(isLaunchBoxContract ? 'launchbox' : 'external');
  };

  const closeConfigureModal = () => {
    setConfigureModalTier(null);
    setConfigureModalStep(1);
    setConfigureModalOption('lock_your_spot');
    setConfigureModalLink('');
    setConfigureModalCustomLabel('');
    setConfigureModalCopyToAll(false);
    setConfigureModalSignSource('launchbox');
  };

  const saveConfigureModal = async () => {
    if (!configureModalTier) return;
    const modeKey = getCurrentModeKey();
    const selectedOption = BUTTON_OPTIONS.find(o => o.id === configureModalOption);
    const label = configureModalOption === 'custom'
      ? (configureModalCustomLabel.trim() || 'Custom')
      : (selectedOption?.label || 'Lock Your Spot');
    const linkValue = configureModalLink.trim();

    const currentLinks = config?.button_links || {};
    const currentModeLinks = (currentLinks[modeKey] && typeof currentLinks[modeKey] === 'object') ? { ...currentLinks[modeKey] } : {};

    const cfg = configRef.current || config;
    const tiersForMode = cfg?.active_packages?.[modeKey] || ['starter', 'growth', 'premium'];

    const isLaunchBoxSign =
      configureModalOption === 'sign_contract' &&
      configureModalSignSource === 'launchbox' &&
      linkValue &&
      (linkValue.includes('shareId=') || linkValue.toLowerCase().includes('contractsign'));

    const shareId = extractShareIdFromContractSignUrl(linkValue);
    let baseContract = shareId ? userContracts.find((c) => c.shareable_link === shareId) : null;
    if (!baseContract && shareId && isLaunchBoxSign) {
      try {
        const found = await supabaseClient.entities.Contract.filter({ shareable_link: shareId }, '-created_at');
        baseContract = found?.[0] || null;
      } catch (e) {
        console.error('Could not load contract by share link:', e);
      }
    }

    const usePerTierLaunchBoxContracts =
      configureModalCopyToAll &&
      isLaunchBoxSign &&
      baseContract &&
      contractBodyHasTierScopedMergeFields(baseContract.body);

    const contractsToMarkShared = [];
    if (isLaunchBoxSign && baseContract?.id) {
      contractsToMarkShared.push(baseContract.id);
    }

    if (configureModalCopyToAll) {
      if (usePerTierLaunchBoxContracts) {
        const createdContracts = [];
        for (const tier of tiersForMode) {
          if (tier === configureModalTier) {
            currentModeLinks[tier] = linkValue;
          } else {
            const mergeDefs = buildMergeDefsForTierClone(baseContract, cfg, tier, modeKey);
            const contractName = buildDefaultContractName(mergeDefs, tier, baseContract.name || 'Contract');
            try {
              const created = await supabaseClient.entities.Contract.create({
                name: contractName,
                body: baseContract.body,
                shareable_link: crypto.randomUUID(),
                accent_color: baseContract.accent_color || '#ff0044',
                merge_field_definitions: mergeDefs,
                status: 'shared',
                linked_package_id: packageId || null,
                logo_url: baseContract.logo_url || null,
                custom_confirmation_message: baseContract.custom_confirmation_message ?? null,
                custom_button_label: baseContract.custom_button_label ?? null,
                custom_button_link: baseContract.custom_button_link ?? null,
                ...(baseContract.expires_at ? { expires_at: baseContract.expires_at } : {}),
              });
              createdContracts.push(created);
              if (created?.id) {
                contractsToMarkShared.push(created.id);
              }
              currentModeLinks[tier] = buildContractSignUrl(created.shareable_link);
            } catch (e) {
              console.error('Failed to clone contract for tier', tier, e);
              currentModeLinks[tier] = linkValue;
            }
          }
          currentModeLinks[tier + '_label'] = label;
          currentModeLinks[tier + '_type'] = configureModalOption;
          currentModeLinks[tier + '_removed'] = false;
        }
        if (createdContracts.length > 0) {
          setUserContracts((prev) => [...createdContracts, ...(prev || [])]);
        }
      } else {
        tiersForMode.forEach((tier) => {
          currentModeLinks[tier] = linkValue;
          currentModeLinks[tier + '_label'] = label;
          currentModeLinks[tier + '_type'] = configureModalOption;
          currentModeLinks[tier + '_removed'] = false;
        });
      }
    } else {
      currentModeLinks[configureModalTier] = linkValue;
      currentModeLinks[configureModalTier + '_label'] = label;
      currentModeLinks[configureModalTier + '_type'] = configureModalOption;
      currentModeLinks[configureModalTier + '_removed'] = false;
    }

    updateConfig('button_links', {
      ...currentLinks,
      [modeKey]: currentModeLinks
    });

    if (contractsToMarkShared.length > 0) {
      try {
        const uniqueIds = [...new Set(contractsToMarkShared)];
        await Promise.all(uniqueIds.map((id) => supabaseClient.entities.Contract.update(id, { status: 'shared' })));
        setUserContracts((prev) =>
          (prev || []).map((c) => (uniqueIds.includes(c.id) ? { ...c, status: 'shared' } : c))
        );
      } catch (e) {
        console.error('Failed to mark contracts as shared:', e);
      }
    }

    closeConfigureModal();
  };

  const removeButtonCTA = (tier) => {
    const modeKey = getCurrentModeKey();
    updateButtonLink(tier, '');
    updateButtonLink(tier + '_label', '');
    updateButtonLink(tier + '_type', '');
    updateButtonLink(tier + '_removed', true);
  };
  const updatePackageDescription = (tier, value) => safeUpdateNestedConfig('package_descriptions', tier, value);
  const updatePackageDuration = (tier, value) => safeUpdateNestedConfig('package_durations', tier, value);
  const updatePackageName = (tier, value) => safeUpdateNestedConfig('package_names', tier, value);

  const togglePopularPackage = (index) => {
    const modeKey = getCurrentModeKey();
    const currentModeIndex = popularPackageIndex[modeKey];
    const newIndex = currentModeIndex === index ? -1 : index;
    const updatedPopularIndex = {
      ...popularPackageIndex,
      [modeKey]: newIndex
    };
    setPopularPackageIndex(updatedPopularIndex);
    updateConfig('popularPackageIndex', updatedPopularIndex);
  };

  const updatePopularBadgeText = (text) => {
    setPopularBadgeText(text);
    updateConfig('popularBadgeText', text);
  };

  // Also update all nested config operations that spread from config directly
  

  const handleStartEditingToggleLabels = () => {
    setTempLabelOnetime(config.pricing_button_label_onetime || 'One-time Project');
    setTempLabelRetainer(config.pricing_button_label_retainer || 'Monthly Retainer');
    setEditingToggleLabels(true);
  };

  const handleSaveToggleLabels = () => {
    if (tempLabelOnetime.trim()) {
      updateConfig('pricing_button_label_onetime', tempLabelOnetime.trim());
    }
    if (tempLabelRetainer.trim()) {
      updateConfig('pricing_button_label_retainer', tempLabelRetainer.trim());
    }
    setEditingToggleLabels(false);
  };

  useEffect(() => {
    if (editingToggleLabels) {
      const handleClickOutside = (event) => {
        if (toggleEditRef.current && !toggleEditRef.current.contains(event.target)) {
          handleSaveToggleLabels();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [editingToggleLabels, tempLabelOnetime, tempLabelRetainer]);

  const getCurrentModeKey = () => {
    return pricingMode === 'one-time' ? 'onetime' : 'retainer';
  };

  // Load user contracts when configuring Sign Contract CTA
  useEffect(() => {
    if (configureModalOption !== 'sign_contract' || !config?.created_by) return;
    const loadContracts = async () => {
      setIsLoadingUserContracts(true);
      try {
        const [list, templates] = await Promise.all([
          supabaseClient.entities.Contract.filter(
            { created_by: config.created_by },
            '-created_at'
          ),
          supabaseClient.entities.ContractTemplate.filter(
            { created_by: config.created_by },
            '-created_at'
          ),
        ]);
        const allContracts = (list || []).filter(
          (contract) => !!contract?.shareable_link
        );
        setUserContracts(allContracts);
        setUserContractTemplates(templates || []);
      } catch (e) {
        console.error('Failed to load contracts:', e);
        setUserContracts([]);
        setUserContractTemplates([]);
      } finally {
        setIsLoadingUserContracts(false);
      }
    };
    loadContracts();
  }, [configureModalOption, config?.created_by]);

  const handleLaunchboxContractSelect = async (value) => {
    if (!value || value.startsWith('section_')) return;

    if (!value?.startsWith('template::')) {
      setConfigureModalLink(value);
      return;
    }

    const templateId = value.replace('template::', '');
    const selectedTemplate = userContractTemplates.find((t) => t.id === templateId);
    if (!selectedTemplate) return;

    const cfg = configRef.current || config;
    const tier = configureModalTier || 'starter';
    const modeKey = getCurrentModeKey();
    const mergeDefs = buildMergeFieldDefinitionsFromTemplateBody(
      selectedTemplate.body,
      cfg,
      tier,
      modeKey
    );
    const contractName = buildDefaultContractName(mergeDefs, tier, selectedTemplate.name || 'Contract');

    try {
      const newContract = await supabaseClient.entities.Contract.create({
        name: contractName,
        body: selectedTemplate.body,
        shareable_link: crypto.randomUUID(),
        accent_color: selectedTemplate.accent_color || cfg?.brand_color || '#ff0044',
        logo_url: selectedTemplate.logo_url || cfg?.logo_url || null,
        custom_confirmation_message: selectedTemplate.custom_confirmation_message ?? null,
        custom_button_label: selectedTemplate.custom_button_label ?? null,
        custom_button_link: selectedTemplate.custom_button_link ?? null,
        merge_field_definitions: mergeDefs,
        status: 'shared',
        linked_package_id: packageId || null,
      });
      const newContractUrl = buildContractSignUrl(newContract.shareable_link);
      if (newContractUrl) {
        setConfigureModalLink(newContractUrl);
      }
      const merged = { ...newContract, merge_field_definitions: mergeDefs };
      setUserContracts((prev) => [merged, ...(prev || [])]);

      const unfilled = mergeDefs.filter((f) => !String(f.value ?? '').trim());
      const requiredFields = unfilled.filter((f) => !DATE_MERGE_KEYS.has(String(f.key || '').toLowerCase()));
      const optionalFields = unfilled.filter((f) => DATE_MERGE_KEYS.has(String(f.key || '').toLowerCase()));
      const fieldsToPrompt = [...requiredFields, ...optionalFields];
      if (fieldsToPrompt.length > 0) {
        setTemplateMergeFieldsModal({
          contractId: newContract.id,
          contractUrl: newContractUrl || '',
          templateName: selectedTemplate.name,
          fullMergeDefs: mergeDefs,
          unfilledFields: fieldsToPrompt.map(({ key, label }) => ({ key, label: label || key })),
          requiredFieldKeys: requiredFields.map((f) => f.key),
          optionalFieldKeys: optionalFields.map((f) => f.key),
          draftValues: Object.fromEntries(fieldsToPrompt.map((f) => [f.key, ''])),
          contractNameDraft: '',
          tier,
        });
      } else {
        setTemplateMergeFieldsModal(null);
      }
    } catch (e) {
      console.error('Failed to create contract from template:', e);
    }
  };

  const updateTemplateMergeFieldDraft = (key, value) => {
    setTemplateMergeFieldsModal((prev) => {
      if (!prev) return null;
      return { ...prev, draftValues: { ...prev.draftValues, [key]: value } };
    });
  };

  const updateTemplateMergeContractName = (value) => {
    setTemplateMergeFieldsModal((prev) => (prev ? { ...prev, contractNameDraft: value } : null));
  };

  const saveTemplateMergeFieldsModal = async () => {
    const m = templateMergeFieldsModal;
    if (!m?.contractId || savingTemplateMerge) return;
    const requiredKeys = m.requiredFieldKeys || [];
    const optionalKeys = m.optionalFieldKeys || [];
    const allFilled = requiredKeys.every((key) => String(m.draftValues[key] ?? '').trim());
    if (!allFilled) return;

    setSavingTemplateMerge(true);
    try {
      const newMergeDefs = m.fullMergeDefs.map((f) => {
        const isUnfilled = m.unfilledFields.some((uf) => uf.key === f.key);
        if (isUnfilled) {
          const userValue = String(m.draftValues[f.key] ?? '').trim();
          const isOptionalDate = optionalKeys.includes(f.key);
          if (isOptionalDate && !userValue) {
            return { ...f, value: getTodayMergeDate() };
          }
          return { ...f, value: userValue };
        }
        return f;
      });
      const explicitName = (m.contractNameDraft || '').trim();
      const name = explicitName || buildDefaultContractName(newMergeDefs, m.tier, m.templateName || 'Contract');
      await supabaseClient.entities.Contract.update(m.contractId, {
        name,
        merge_field_definitions: newMergeDefs,
        updated_at: new Date().toISOString(),
      });
      setUserContracts((prev) =>
        (prev || []).map((c) =>
          c.id === m.contractId ? { ...c, name, merge_field_definitions: newMergeDefs } : c
        )
      );
      setTemplateMergeFieldsModal(null);
      setTemplateContractPreviewModal({
        name,
        contractUrl: buildContractPreviewUrl(m.contractUrl || ''),
        showDisclaimer: true,
      });
    } catch (e) {
      console.error('Failed to save contract merge fields:', e);
    } finally {
      setSavingTemplateMerge(false);
    }
  };

  const addDeliverable = (tier) => {
    const newDeliverable = 'New deliverable';
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;
    const updatedPackageData = {
      ...c.package_data,
      [modeKey]: {
        ...c.package_data[modeKey],
        [tier]: {
          ...c.package_data[modeKey][tier],
          deliverables: [...c.package_data[modeKey][tier].deliverables, newDeliverable]
        }
      }
    };
    updateConfig('package_data', updatedPackageData);
  };

  const updateDeliverable = (tier, index, newValue) => {
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;
    const currentDeliverables = c.package_data[modeKey][tier].deliverables;
    if (index < currentDeliverables.length) {
      const updatedDeliverables = [...currentDeliverables];
      updatedDeliverables[index] = newValue;
      const updatedPackageData = {
        ...c.package_data,
        [modeKey]: {
          ...c.package_data[modeKey],
          [tier]: {
            ...c.package_data[modeKey][tier],
            deliverables: updatedDeliverables
          }
        }
      };
      updateConfig('package_data', updatedPackageData);
    }
  };

  const deleteDeliverable = (tier, index) => {
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;
    const updatedDeliverables = c.package_data[modeKey][tier].deliverables.filter((_, idx) => idx !== index);
    const updatedPackageData = {
      ...c.package_data,
      [modeKey]: {
        ...c.package_data[modeKey],
        [tier]: {
          ...c.package_data[modeKey][tier],
          deliverables: updatedDeliverables
        }
      }
    };
    updateConfig('package_data', updatedPackageData);
  };

  const duplicateDeliverable = (tier, index) => {
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;
    const currentDeliverables = c.package_data[modeKey][tier].deliverables || [];
    if (index < 0 || index >= currentDeliverables.length) return;

    const updatedDeliverables = [...currentDeliverables];
    updatedDeliverables.splice(index + 1, 0, currentDeliverables[index]);

    const updatedPackageData = {
      ...c.package_data,
      [modeKey]: {
        ...c.package_data[modeKey],
        [tier]: {
          ...c.package_data[modeKey][tier],
          deliverables: updatedDeliverables
        }
      }
    };
    updateConfig('package_data', updatedPackageData);
  };

  const addBonus = (tier) => {
    const newBonus = 'New bonus';
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;
    const updatedPackageData = {
      ...c.package_data,
      [modeKey]: {
        ...c.package_data[modeKey],
        [tier]: {
          ...c.package_data[modeKey][tier],
          bonuses: [...c.package_data[modeKey][tier].bonuses, newBonus]
        }
      }
    };
    updateConfig('package_data', updatedPackageData);
  };

  const updateBonus = (tier, index, value) => {
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;
    const currentBonuses = c.package_data[modeKey][tier].bonuses;
    if (index < currentBonuses.length) {
      const updatedBonuses = [...currentBonuses];
      updatedBonuses[index] = value;
      const updatedPackageData = {
        ...c.package_data,
        [modeKey]: {
          ...c.package_data[modeKey],
          [tier]: {
            ...c.package_data[modeKey][tier],
            bonuses: updatedBonuses
          }
        }
      };
      updateConfig('package_data', updatedPackageData);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, type } = result;
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;

    // Parse droppableId to get tier and item type
    const [sourceType, sourceTier] = source.droppableId.split('-');
    const [destType, destTier] = destination.droppableId.split('-');

    if (type === 'deliverable') {
      // Get source and destination arrays
      const sourceDeliverables = [...c.package_data[modeKey][sourceTier].deliverables];
      const destDeliverables = sourceTier === destTier ? sourceDeliverables : [...c.package_data[modeKey][destTier].deliverables];

      // Remove from source
      const [movedItem] = sourceDeliverables.splice(source.index, 1);

      // Add to destination
      if (sourceTier === destTier) {
        sourceDeliverables.splice(destination.index, 0, movedItem);
      } else {
        destDeliverables.splice(destination.index, 0, movedItem);
      }

      // Update config
      const updatedPackageData = {
        ...c.package_data,
        [modeKey]: {
          ...c.package_data[modeKey],
          [sourceTier]: {
            ...c.package_data[modeKey][sourceTier],
            deliverables: sourceDeliverables
          }
        }
      };

      if (sourceTier !== destTier) {
        updatedPackageData[modeKey][destTier] = {
          ...c.package_data[modeKey][destTier],
          deliverables: destDeliverables
        };
      }

      updateConfig('package_data', updatedPackageData);
    } else if (type === 'bonus') {
      // Get source and destination arrays
      const sourceBonuses = [...c.package_data[modeKey][sourceTier].bonuses];
      const destBonuses = sourceTier === destTier ? sourceBonuses : [...c.package_data[modeKey][destTier].bonuses];

      // Remove from source
      const [movedItem] = sourceBonuses.splice(source.index, 1);

      // Add to destination
      if (sourceTier === destTier) {
        sourceBonuses.splice(destination.index, 0, movedItem);
      } else {
        destBonuses.splice(destination.index, 0, movedItem);
      }

      // Update config
      const updatedPackageData = {
        ...c.package_data,
        [modeKey]: {
          ...c.package_data[modeKey],
          [sourceTier]: {
            ...c.package_data[modeKey][sourceTier],
            bonuses: sourceBonuses
          }
        }
      };

      if (sourceTier !== destTier) {
        updatedPackageData[modeKey][destTier] = {
          ...c.package_data[modeKey][destTier],
          bonuses: destBonuses
        };
      }

      updateConfig('package_data', updatedPackageData);
    }
  };

  const deleteBonus = (tier, index) => {
    const modeKey = getCurrentModeKey();
    const c = configRef.current || config;
    const updatedBonuses = c.package_data[modeKey][tier].bonuses.filter((_, idx) => idx !== index);
    const updatedPackageData = {
      ...c.package_data,
      [modeKey]: {
        ...c.package_data[modeKey],
        [tier]: {
          ...c.package_data[modeKey][tier],
          bonuses: updatedBonuses
        }
      }
    };
    updateConfig('package_data', updatedPackageData);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const latestConfig = configRef.current || config;

      const buttonLinks = latestConfig.button_links || {};
      const hasAnyLinks = Object.values(buttonLinks).some(modeLinks => {
        if (!modeLinks || typeof modeLinks !== 'object') return false;
        return Object.values(modeLinks).some(link => link && typeof link === 'string' && link.trim() !== '');
      });

      if (!hasAnyLinks) {
        setSaving(false);
        setShowLinksModal(true);
        return;
      }

      const ensuredPackageNames = {
        onetime: {
          starter: latestConfig.package_names?.onetime?.starter || 'Starter',
          growth: latestConfig.package_names?.onetime?.growth || 'Growth',
          premium: latestConfig.package_names?.onetime?.premium || 'Premium',
          elite: latestConfig.package_names?.onetime?.elite || 'Elite'
        },
        retainer: {
          starter: latestConfig.package_names?.retainer?.starter || 'Starter',
          growth: latestConfig.package_names?.retainer?.growth || 'Growth',
          premium: latestConfig.package_names?.retainer?.premium || 'Premium',
          elite: latestConfig.package_names?.retainer?.elite || 'Elite'
        }
      };

      const { id: _ignoreId, created_date, updated_date, created_by, created_by_id, entity_name, app_id, is_sample, is_deleted, deleted_date, environment, ...configToSave } = latestConfig;

      // Persist current design and pricing mode
      configToSave.currentDesign = currentDesign;
      configToSave.pricingMode = pricingMode;
      configToSave.popularPackageIndex = popularPackageIndex;
      configToSave.popularBadgeText = popularBadgeText;

      // Ensure popularPackageIndex is always an object before saving
      if (typeof configToSave.popularPackageIndex === 'number' || !configToSave.popularPackageIndex) {
      const val = typeof configToSave.popularPackageIndex === 'number' ? configToSave.popularPackageIndex : 2;
      configToSave.popularPackageIndex = { onetime: val, retainer: val };
      }

      const pendingFolder = takePendingFolderId();
      if (pendingFolder) {
        configToSave.folder_id = pendingFolder;
      }

      // Use the packageId from state (which is kept in sync and validated)
      let savedPackageId = packageId;

      if (savedPackageId) {
        try {
          await supabaseClient.entities.PackageConfig.update(savedPackageId, configToSave);
        } catch (updateError) {
          // If update fails (e.g. package was deleted), create a new one
          console.warn('Update failed, creating new package:', updateError);
          const newPackage = await supabaseClient.entities.PackageConfig.create(configToSave);
          savedPackageId = newPackage.id;
          setPackageId(savedPackageId);
        }
      } else {
        const newPackage = await supabaseClient.entities.PackageConfig.create(configToSave);
        savedPackageId = newPackage.id;
        setPackageId(savedPackageId);
      }

      localStorage.setItem('packageConfig', JSON.stringify(configToSave));

      const baseUrl = window.location.origin;
      const currentUser = await supabaseClient.auth.me();
      const previewPath = await getPublicPreviewPath(
        { ...latestConfig, id: savedPackageId },
        currentUser
      );
      const previewUrl = baseUrl + previewPath;
      window.open(previewUrl, '_blank');

      bypassExitWarningRef.current = true;
      window.location.href = createPageUrl('MyPackages');

    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package: ' + (error?.message || 'Unknown error'));
      setSaving(false);
    }
  };

  const silentSave = async () => {
    try {
      if (!packageId) return;
      const latestConfig = configRef.current || config;
      const {
        id: _id,
        created_date,
        updated_date,
        created_by,
        created_by_id,
        entity_name,
        app_id,
        is_sample,
        is_deleted,
        deleted_date,
        environment,
        ...configToSave
      } = latestConfig;
      configToSave.currentDesign = currentDesign;
      configToSave.pricingMode = pricingMode;
      configToSave.popularPackageIndex = popularPackageIndex;
      configToSave.popularBadgeText = popularBadgeText;
      await supabaseClient.entities.PackageConfig.update(packageId, configToSave);
      console.log('Silent save success');
    } catch (e) {
      console.error('Silent save failed', e);
    }
  };

  const handleApplyCostTemplate = async (templateId) => {
    if (!costCalculatorTier || !templateId) return;
    try {
      const t = await supabaseClient.entities.CostCalculatorTemplate.get(templateId);
      if (t?.body && typeof t.body === 'object') {
        updateCostData(costCalculatorTier, t.body);
        setTimeout(() => silentSave(), 500);
      }
    } catch (e) {
      console.error('Apply cost template:', e);
    }
  };

  const nextDesign = () => {
    setCurrentDesign((prev) => (prev + 1) % 2);
  };

  const prevDesign = () => {
    setCurrentDesign((prev) => (prev - 1 + 2) % 2);
  };

  useEffect(() => {
    if (!config || isPreviewMode) return;

    const shouldWarnOnExit = () => !bypassExitWarningRef.current;

    const handleBeforeUnload = (event) => {
      if (!shouldWarnOnExit()) return;
      event.preventDefault();
      event.returnValue = '';
    };

    const handleDocumentClick = (event) => {
      if (!shouldWarnOnExit()) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const link = event.target.closest('a[href]');
      if (!link) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;

      const nextUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const isSamePage = nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search && nextUrl.hash === currentUrl.hash;

      if (isSamePage) return;
      if (nextUrl.origin !== currentUrl.origin) return;

      event.preventDefault();
      pendingNavigationRef.current = nextUrl.toString();
      setShowExitEditModeModal(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [config, isPreviewMode]);

  useEffect(() => {
    if (isPreviewMode) return;
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && undoHistoryRef.current.length > 0) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPreviewMode]);

  useEffect(() => {
    if (!showExportDropdown) return;
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setShowExportDropdown(false);
        setShowPdfSubmenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportDropdown]);

  if (!config) {
    if (previewNotFound) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
          <div className="text-center max-w-md px-6">
            <p className="text-2xl font-bold text-gray-900 mb-2">Preview Not Found</p>
            <p className="text-gray-600">This package preview link is invalid or no longer available.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: brandColor }} />
          <p className="text-gray-900">Loading your packages...</p>
        </div>
      </div>
    );
  }

  const getDurationForTier = (tier) => {
    if (!config.duration_min || !config.duration_max || !config.duration_unit) {
      return config.project_duration ? `${config.project_duration} to delivery` : '';
    }

    const min = config.duration_min;
    const max = config.duration_max;
    const unit = config.duration_unit;

    if (tier === 'starter') {
      return max === min ? `${max} ${unit} to delivery` : `${max} ${unit} to delivery`;
    } else if (tier === 'growth') {
      const middle = min === max ? max : Math.ceil((min + max) / 2);
      return `${middle} ${unit} to delivery`;
    } else if (tier === 'elite') {
      return min === min ? `${Math.max(1, min - 1)} ${unit} to delivery` : `${Math.max(1, min - 1)} ${unit} to delivery`;
    } else {
      return min === min ? `${min} ${unit} to delivery` : `${min} ${unit} to delivery`;
    }
  };

  const modeKey = getCurrentModeKey();
  const currentModePopularIndex = typeof popularPackageIndex === 'object' ? popularPackageIndex[modeKey] : popularPackageIndex;

  // Available package tiers
  const availableTiers = ['starter', 'growth', 'premium', 'elite'];
  const activePackages = config.active_packages?.[modeKey] || ['starter', 'growth', 'premium'];
  const getPackageDescription = (tier, fallback) => {
    const descriptions = config.package_descriptions?.[modeKey];
    if (!descriptions || typeof descriptions !== 'object') return fallback;

    if (Object.prototype.hasOwnProperty.call(descriptions, tier)) {
      return descriptions[tier] === null ? null : (descriptions[tier] ?? fallback);
    }

    return fallback;
  };

  const packages = activePackages.map((tier, index) => {
    const tierData = {
      starter: {
        name: config.package_names?.[modeKey]?.starter || 'Starter',
        price: pricingMode === 'one-time' ? config.price_starter : config.price_starter_retainer,
        description: getPackageDescription('starter', 'For individuals just starting out who need essential features'),
        duration: config.package_durations?.[modeKey]?.starter || getDurationForTier('starter')
      },
      growth: {
        name: config.package_names?.[modeKey]?.growth || 'Growth',
        price: pricingMode === 'one-time' ? config.price_growth : config.price_growth_retainer,
        description: getPackageDescription('growth', 'For growing businesses that want to scale their content'),
        duration: config.package_durations?.[modeKey]?.growth || getDurationForTier('growth')
      },
      premium: {
        name: config.package_names?.[modeKey]?.premium || 'Premium',
        price: pricingMode === 'one-time' ? config.price_premium : config.price_premium_retainer,
        description: getPackageDescription('premium', 'For established brands that need complete solutions'),
        duration: config.package_durations?.[modeKey]?.premium || getDurationForTier('premium')
      },
      elite: {
        name: config.package_names?.[modeKey]?.elite || 'Elite',
        price: pricingMode === 'one-time' ? (config.price_elite || 0) : (config.price_elite_retainer || 0),
        description: getPackageDescription('elite', 'For enterprise clients that need the ultimate solution'),
        duration: config.package_durations?.[modeKey]?.elite || getDurationForTier('elite')
      }
    }[tier];

    return {
      ...tierData,
      tier,
      deliverables: config.package_data?.[modeKey]?.[tier]?.deliverables || [],
      bonuses: config.package_data?.[modeKey]?.[tier]?.bonuses || [],
      popular: currentModePopularIndex === index,
      isCustomOffer: tier === 'elite'
    };
    });

  const confirmDeletePackage = (tierToDelete) => {
    setPackageToDelete(tierToDelete);
    setShowDeleteModal(true);
  };

  const handleDeletePackage = async () => {
    if (!packageToDelete) return;

    const tierToDelete = packageToDelete;
    const modeKey = getCurrentModeKey();
    const currentConfig = configRef.current || config;
    const currentActive = currentConfig.active_packages?.[modeKey] || ['starter', 'growth', 'premium'];

    if (currentActive.length <= 1) {
      setShowDeleteModal(false);
      setPackageToDelete(null);
      return;
    }

    const updatedActive = currentActive.filter(t => t !== tierToDelete);
    setLastDeletedTier(tierToDelete);

    const updatedActivePackages = {
      onetime: modeKey === 'onetime' ? updatedActive : (currentConfig.active_packages?.onetime || ['starter', 'growth', 'premium']),
      retainer: modeKey === 'retainer' ? updatedActive : (currentConfig.active_packages?.retainer || ['starter', 'growth', 'premium'])
    };

    const deletedIndex = currentActive.indexOf(tierToDelete);
    let newPopularIndex = popularPackageIndex[modeKey];
    if (newPopularIndex === deletedIndex) {
      newPopularIndex = -1;
    } else if (newPopularIndex > deletedIndex) {
      newPopularIndex -= 1;
    }

    const updatedPopularIndex = {
      onetime: modeKey === 'onetime' ? newPopularIndex : (popularPackageIndex?.onetime ?? 2),
      retainer: modeKey === 'retainer' ? newPopularIndex : (popularPackageIndex?.retainer ?? 2)
    };

    const updates = {
      active_packages: updatedActivePackages,
      popularPackageIndex: updatedPopularIndex
    };

    // Remove cost data for deleted package
    const costData = currentConfig.cost_data;
    if (costData && typeof costData === 'object') {
      const newCostData = { ...costData };
      for (const key of ['onetime', 'retainer']) {
        if (newCostData[key] && newCostData[key][tierToDelete]) {
          const modeCopy = { ...newCostData[key] };
          delete modeCopy[tierToDelete];
          newCostData[key] = modeCopy;
        }
      }
      updates.cost_data = newCostData;
    }

    updateConfigMultiple(updates);

    if (costCalculatorTier === tierToDelete) {
      setCostCalculatorTier(null);
    }

    setShowDeleteModal(false);
    setPackageToDelete(null);
  };

  const handleAddPackage = async () => {
    const modeKey = getCurrentModeKey();
    const currentConfig = configRef.current || config;
    const currentActive = currentConfig.active_packages?.[modeKey] || ['starter', 'growth', 'premium'];

    if (currentActive.length >= 4) {
      alert('You can have a maximum of 4 packages');
      return;
    }

    const availableTiers = ['starter', 'growth', 'premium', 'elite'];
    const nextTier = (lastDeletedTier && !currentActive.includes(lastDeletedTier))
      ? lastDeletedTier
      : availableTiers.find(t => !currentActive.includes(t));

    if (nextTier) {
      const updatedActive = [...currentActive, nextTier];
      
      const updatedActivePackages = {
        onetime: modeKey === 'onetime' ? updatedActive : (currentConfig.active_packages?.onetime || ['starter', 'growth', 'premium']),
        retainer: modeKey === 'retainer' ? updatedActive : (currentConfig.active_packages?.retainer || ['starter', 'growth', 'premium'])
      };

      const updates = { active_packages: updatedActivePackages };

      if (nextTier === 'elite' && !currentConfig.price_elite) {
        const elitePrice = Math.round(currentConfig.price_premium * 1.5);
        const eliteRetainerPrice = Math.round(elitePrice * 0.85);
        updates.price_elite = elitePrice;
        updates.price_elite_retainer = eliteRetainerPrice;
      }

      updateConfigMultiple(updates);
    }
  };

  const previewPackages = packages;
  const retainerDiscountText = config.retainer_discount_text ?? '15% off one-time price';
  const disablePreviewAnimations = isPreviewMode || exporting || exportingPdf;
  const getPreviewMotionProps = (index) => (
    disablePreviewAnimations
      ? { initial: false, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } }
      : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: index * 0.1 } }
  );

  const EditableText = ({
    value,
    onSave,
    className,
    multiline = false,
    multilineCompact = false,
    placeholder,
    darkMode = false,
    brandColor,
    maxLength = undefined
  }) => {
    const safeValue = value || '';
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(safeValue);
    const [isHovered, setIsHovered] = useState(false);
    const editRef = useRef(null);

    useEffect(() => {
      setEditValue(value || '');
    }, [value]);

    useEffect(() => {
      if (isEditing) {
        const handleClickOutside = (event) => {
          if (editRef.current && !editRef.current.contains(event.target)) {
            handleSave();
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isEditing, editValue]);

    const handleSave = () => {
      if (editValue.trim() !== safeValue) {
        onSave(editValue.trim());
      } else if (editValue.trim() === '') {
        setEditValue(safeValue);
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Enter' && e.ctrlKey && multiline) {
        handleSave();
      }
      if (e.key === 'Escape') {
        setEditValue(value);
        setIsEditing(false);
      }
    };

    const hasReachedMaxLength = typeof maxLength === 'number' && editValue.length >= maxLength;

    if (isEditing) {
      return multiline ? (
        <>
          <Textarea
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            rows={multilineCompact ? 2 : 3}
            className={`${className || ''} ${multilineCompact ? 'h-[2.5rem] min-h-[2.5rem] max-h-[2.5rem] leading-4 py-1' : 'min-h-[60px]'} resize-none overflow-hidden ${darkMode ? 'bg-white text-gray-900 border-gray-300' : ''}`}
            autoFocus
            maxLength={maxLength}
            placeholder={placeholder}
            style={{ borderColor: brandColor }}
          />
          {hasReachedMaxLength && (
            <p className={`mt-1 text-xs ${darkMode ? 'text-red-100' : 'text-red-600'}`}>
              Character limit reached ({maxLength})
            </p>
          )}
        </>
      ) : (
        <>
          <Input
            ref={editRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={`${className || ''} ${darkMode ? 'bg-white text-gray-900 border-gray-300' : ''}`}
            autoFocus
            maxLength={maxLength}
            placeholder={placeholder}
            style={{ borderColor: brandColor }}
          />
          {hasReachedMaxLength && (
            <p className={`mt-1 text-xs ${darkMode ? 'text-red-100' : 'text-red-600'}`}>
              Character limit reached ({maxLength})
            </p>
          )}
        </>
      );
    }

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${className || ''} cursor-pointer group relative min-w-[50px] inline-block rounded ${multiline && multilineCompact ? 'px-1.5 py-0.5 leading-4' : 'px-2 py-1'} transition-all`}
        style={{
          backgroundColor: (isEditing || isHovered) ? (darkMode ? 'rgba(255,255,255,0.1)' : `${brandColor}1A`) : undefined,
          outline: (isEditing || isHovered) ? `2px solid ${brandColor}` : undefined,
          outlineOffset: '-1px',
        }}
      >
        {(multiline && multilineCompact) ? (
          <span
            className="block overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {value || <span className="text-gray-400 italic">{placeholder}</span>}
          </span>
        ) : (
          value || <span className="text-gray-400 italic">{placeholder}</span>
        )}
        <Edit2 className={`w-4 h-4 absolute right-3 -top-1 opacity-0 group-hover:opacity-100 ${darkMode ? 'text-white/70' : ''}`} style={!darkMode ? { color: brandColor } : {}} />
      </div>
    );
  };

  const EditablePrice = ({ value, onSave, className, darkMode, brandColor }) => {
    const safeValue = value || 0;
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(safeValue.toString());
    const [initialValue, setInitialValue] = useState(safeValue);
    const [isHovered, setIsHovered] = useState(false);
    const editRef = useRef(null);

    useEffect(() => {
      const sv = value || 0;
      setEditValue(sv.toString());
      setInitialValue(sv);
    }, [value]);

    useEffect(() => {
      if (isEditing) {
        const handleClickOutside = (event) => {
          if (editRef.current && !editRef.current.contains(event.target)) {
            handleSave();
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isEditing, editValue]);

    const handleSave = () => {
      const numValue = parseFloat(editValue);
      if (!isNaN(numValue) && numValue >= 0) {
        if (numValue !== initialValue) {
          onSave(numValue);
        }
      } else {
        setEditValue(value.toString());
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSave();
      }
      if (e.key === 'Escape') {
        setEditValue(value.toString());
        setIsEditing(false);
      }
    };

    if (isEditing) {
      return (
        <Input
          ref={editRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className={`${className || ''} w-32 ${darkMode ? 'bg-white text-gray-900 border-gray-300' : ''}`}
          autoFocus
          placeholder="0"
          style={{ borderColor: brandColor }}
        />
      );
    };

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${className || ''} cursor-pointer group relative inline-block rounded px-2 py-1 transition-all`}
        style={{
          backgroundColor: (isEditing || isHovered) ? (darkMode ? 'rgba(255,255,255,0.1)' : `${brandColor}1A`) : undefined,
          outline: (isEditing || isHovered) ? `2px solid ${brandColor}` : undefined,
          outlineOffset: '-1px',
        }}
      >
        {currencySymbol}{(value || 0).toLocaleString()}
        <Edit2 className={`w-3 h-3 absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 ${darkMode ? 'text-white/70' : ''}`} style={!darkMode ? { color: brandColor } : {}} />
      </div>
    );
  };

  const EditableDeliverableItem = ({ deliverable, onSave, onDuplicate, onDelete, darkMode, brandColor, dragHandleProps }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(typeof deliverable === 'string' ? deliverable : deliverable.type || '');
    const [isHovered, setIsHovered] = useState(false);
    const editRef = React.useRef(null);

    const displayText = typeof deliverable === 'string' ? deliverable : deliverable.type || '';

    useEffect(() => {
      setEditValue(displayText);
    }, [displayText]);

    useEffect(() => {
      if (isEditing) {
        const handleClickOutside = (event) => {
          if (editRef.current && !editRef.current.contains(event.target)) {
            handleSave();
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isEditing, editValue]);

    const handleSave = () => {
      if (editValue.trim()) {
        onSave(editValue.trim());
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        setEditValue(displayText);
        setIsEditing(false);
      }
    };

    const getIconInlineStyle = () => {
      return darkMode ? {} : { color: brandColor };
    };
    
    const getIconClasses = () => {
      return darkMode ? 'text-white' : '';
    };

    if (isEditing) {
      return (
        <div ref={editRef} className="flex items-start gap-2">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 mt-0.5">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getIconClasses()}`} style={getIconInlineStyle()} />
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={`text-sm flex-1 ${darkMode ? 'bg-white text-gray-900 border-gray-300' : ''}`}
            autoFocus
            placeholder="Deliverable name"
            style={{ borderColor: brandColor }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className="flex items-start gap-2 group cursor-pointer rounded px-2 py-1 transition-all relative"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: (isEditing || isHovered) ? (darkMode ? 'rgba(255,255,255,0.1)' : `${brandColor}1A`) : undefined,
        }}
      >
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getIconClasses()}`} style={getIconInlineStyle()} />
        <span className={`text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}>{displayText}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            title="Duplicate deliverable"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-red-400 hover:text-red-300 hover:bg-white/10' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  const EditableListItem = ({ value, onSave, onDelete, icon: Icon, iconClassName, darkMode, brandColor, dragHandleProps }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const [isHovered, setIsHovered] = useState(false);
    const editRef = useRef(null);

    useEffect(() => {
      setEditValue(value);
    }, [value]);

    useEffect(() => {
      if (isEditing) {
        const handleClickOutside = (event) => {
          if (editRef.current && !editRef.current.contains(event.target)) {
            handleSave();
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isEditing, editValue]);

    const handleSave = () => {
      if (editValue.trim() !== value) {
        onSave(editValue.trim());
      } else if (editValue.trim() === '') {
        setEditValue(value); 
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        setEditValue(value);
        setIsEditing(false);
      }
    };

    const getIconInlineStyle = () => {
      if (iconClassName) return {};
      return darkMode ? {} : { color: brandColor };
    };
    
    const getIconClasses = () => {
      if (iconClassName) return iconClassName;
      return darkMode ? 'text-white' : '';
    };

    if (isEditing) {
      return (
        <div ref={editRef} className="flex items-start gap-2">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 mt-0.5">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getIconClasses()}`} style={getIconInlineStyle()} />
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={`text-sm flex-1 ${darkMode ? 'bg-white text-gray-900 border-gray-300' : ''}`}
            autoFocus
            style={{ borderColor: brandColor }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className="flex items-start gap-2 group cursor-pointer rounded px-2 py-1 transition-all relative"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: (isEditing || isHovered) ? (darkMode ? 'rgba(255,255,255,0.1)' : `${brandColor}1A`) : undefined,
        }}
      >
        <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getIconClasses()}`} style={getIconInlineStyle()} />
        <span className={`text-sm flex-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}>{value}</span>
        <div className="flex items-center gap-1">
          <Edit2 className={`w-3 h-3 opacity-0 group-hover:opacity-100 mt-0.5 transition-opacity ${darkMode ? 'text-white/70' : ''}`} style={!darkMode ? { color: brandColor } : {}} />
          <Button
            variant="ghost"
            size="icon"
            className={`h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ${darkMode ? 'text-red-400 hover:text-red-300 hover:bg-white/10' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  const EditableButton = ({ tier, brandColor, darkerBrandColor, darkMode, customLabel, isCustomOffer = false, onConfigureClick, isRemoved = false, onRemoveClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const [labelValue, setLabelValue] = useState(customLabel);
    const modeKey = getCurrentModeKey();
    const labelInputRef = useRef(null);
    const showConfigOnHover = !isMobileView && isHovered;
    const showConfigAlways = isMobileView;

    useEffect(() => {
      setLabelValue(customLabel);
    }, [customLabel]);

    useEffect(() => {
      if (isEditingLabel) {
        const handleClickOutside = (event) => {
          if (labelInputRef.current && !labelInputRef.current.contains(event.target)) {
            handleSaveLabel();
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isEditingLabel, labelValue]);

    const handleSaveLabel = () => {
      if (isCustomOffer && labelValue.trim()) {
        updateButtonLink(tier + '_label', labelValue.trim());
      }
      setIsEditingLabel(false);
    };

    const handleLabelKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSaveLabel();
      }
      if (e.key === 'Escape') {
        setLabelValue(customLabel);
        setIsEditingLabel(false);
      }
    };

    if (isRemoved && !isCustomOffer && onConfigureClick) {
      return (
        <div className="space-y-2">
          <button
            onClick={() => onConfigureClick(tier)}
            className={`w-full h-12 font-semibold rounded-full border-2 border-dashed flex items-center justify-center gap-2 transition-all ${
              darkMode ? 'border-white/40 text-white/80 hover:border-white/60 hover:bg-white/10' : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add CTA
          </button>
        </div>
      );
    }

    if (isEditingLabel && isCustomOffer) {
      return (
        <div ref={labelInputRef} className="space-y-2">
          <Input
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onKeyDown={handleLabelKeyDown}
            placeholder="Get Custom Offer"
            className={`w-full text-sm ${darkMode ? 'bg-white text-gray-900' : ''}`}
            autoFocus
            style={{ borderColor: brandColor }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveLabel}
              className="flex-1 text-white"
              style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
            >
              <Save className="w-3 h-3 mr-1" />
              Save Label
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLabelValue(customLabel);
                setIsEditingLabel(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    const buttonLink = config.button_links?.[modeKey]?.[tier];
    const displayLabel = customLabel || (isCustomOffer ? 'Get Custom Offer' : 'Lock Your Spot');

    const ensureHttps = (url) => {
      if (!url) return '';
      const trimmed = url.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      return `https://${trimmed}`;
    };

    const buttonClasses = `w-full h-12 font-semibold rounded-full shadow-lg transition-all flex items-center justify-center ${
      darkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'text-white'
    }`;
    const buttonStyle = !darkMode ? { background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` } : {};

    return (
      <div
        className="relative group/button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {buttonLink ? (
          <a
            href={ensureHttps(buttonLink)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses}
            style={{ ...buttonStyle, textDecoration: 'none' }}
          >
            {displayLabel}
          </a>
        ) : (
          <Button
            onClick={(e) => e.preventDefault()}
            className={buttonClasses}
            style={buttonStyle}
          >
            {displayLabel}
          </Button>
        )}
        {buttonLink && (
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <span className="text-xs text-gray-400 truncate block px-2" title={ensureHttps(buttonLink)}>
              🔗 {buttonLink}
            </span>
          </div>
        )}
        {!buttonLink && !isCustomOffer && onConfigureClick && (
          <div className="absolute -bottom-6 left-0 right-0 text-center px-2">
            <span className="text-xs text-gray-500">
              Using a different strategy for this offer? (
              <button
                type="button"
                onClick={() => onConfigureClick(tier)}
                className="text-xs font-medium underline hover:no-underline inline"
                style={{ color: brandColor }}
              >
                Change
              </button>
              )
            </span>
          </div>
        )}
        {!isCustomOffer && onConfigureClick && (showConfigOnHover || showConfigAlways) && (
          <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1 z-10">
            {isMobileView ? (
              <button
                onClick={() => onConfigureClick(tier)}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/90 hover:bg-white shadow-md transition-all"
                style={{ color: brandColor }}
              >
                Change
              </button>
            ) : (
              <button
                onClick={() => onConfigureClick(tier)}
                className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
                title="Configure button"
              >
                <Settings className="w-4 h-4" style={{ color: brandColor }} />
              </button>
            )}
            {onRemoveClick && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveClick(tier); }}
                className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all text-red-500 hover:text-red-600"
                title="Remove CTA"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        {isHovered && isCustomOffer && (
          <button
            onClick={() => setIsEditingLabel(true)}
            className="absolute top-1/2 right-3 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
            title="Edit button label"
          >
            <Edit2 className="w-4 h-4" style={{ color: brandColor }} />
          </button>
        )}
      </div>
    );
  };


  const renderDesign1 = () => {
    // Calculate max deliverables and bonuses to align sections across tiers
    const maxDeliverables = Math.max(...packages.filter(p => !p.isCustomOffer).map(p => p.deliverables.length), 1);
    const maxBonuses = Math.max(...packages.filter(p => !p.isCustomOffer).map(p => p.bonuses.length), 0);
    const deliverableTemplate = Array.from({ length: maxDeliverables }, (_, idx) =>
      packages.find(p => !p.isCustomOffer && p.deliverables[idx])?.deliverables[idx] || null
    );
    const bonusTemplate = Array.from({ length: maxBonuses }, (_, idx) =>
      packages.find(p => !p.isCustomOffer && p.bonuses[idx])?.bonuses[idx] || ''
    );
    const deliverablesMinHeight = packages.length === 4 ? maxDeliverables * 28 : maxDeliverables * 32;
    const bonusesMinHeight = packages.length === 4 ? maxBonuses * 28 : maxBonuses * 32;
    
    return (
    <DragDropContext onDragEnd={handleDragEnd}>
    <div className={`grid gap-4 ${packages.length === 4 ? 'md:grid-cols-4' : packages.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : packages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
      {packages.map((pkg, index) => {
        const tierName = pkg.tier;
        const originalPriceKey = `original_price_${tierName}${pricingMode === 'one-time' ? '' : '_retainer'}`;
        const originalPrice = config[originalPriceKey];

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative bg-white rounded-3xl ${packages.length === 4 ? 'p-6' : 'p-8'} border-2 flex flex-col group/package ${
              pkg.popular ? 'shadow-xl' : 'border-gray-200 shadow-lg'
            }`}
            style={pkg.popular ? { borderColor: brandColor } : {}}
          >
            {packages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDeletePackage(pkg.tier);
                }}
                className="absolute top-3 left-3 w-7 h-7 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover/package:opacity-100 transition-opacity z-50 cursor-pointer shadow-md hover:shadow-lg"
                title="Delete package"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {pkg.isCustomOffer ? (
              <div className="flex-grow flex flex-col items-center justify-center py-12">
                <div className="text-center mb-8">
                  <div 
                    className={`inline-block px-8 py-3 rounded-full text-white font-bold shadow-md mb-6 ${packages.length === 4 ? 'text-xl' : 'text-2xl'}`}
                    style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                  >
                    <EditableText
                      value={pkg.name}
                      onSave={(newValue) => updatePackageName(tierName, newValue)}
                      className={`inline font-bold ${packages.length === 4 ? 'text-xl' : 'text-2xl'}`}
                      placeholder="Custom Offer"
                      darkMode={true}
                      brandColor="#fff"
                    />
                  </div>
                  <h3 className={`font-bold text-gray-900 mb-4 ${packages.length === 4 ? 'text-2xl' : 'text-3xl'}`}>
                    <EditableText
                      value={config.package_descriptions?.[modeKey]?.[tierName] || 'Need Something Different?'}
                      onSave={(newValue) => updatePackageDescription(tierName, newValue)}
                      className={`inline font-bold ${packages.length === 4 ? 'text-2xl' : 'text-3xl'}`}
                      placeholder="Need Something Different?"
                      brandColor={brandColor}
                    />
                  </h3>
                  <p className="text-gray-600 text-base mb-8 max-w-xs mx-auto">
                    <EditableText
                      value={config.package_descriptions?.[modeKey]?.[tierName + '_subtitle'] || "Let's create a custom package tailored specifically to your needs"}
                      onSave={(newValue) => updatePackageDescription(tierName + '_subtitle', newValue)}
                      className="inline text-base"
                      multiline={true}
                      placeholder="Let's create a custom package tailored specifically to your needs"
                      brandColor={brandColor}
                    />
                  </p>
                </div>
                {showPackageButtonsInEditMode && (
                  <div className="w-full">
                    <EditableButton
                      tier={tierName}
                      brandColor={brandColor}
                      darkerBrandColor={darkerBrandColor}
                      darkMode={false}
                      customLabel={config.button_links?.[modeKey]?.[tierName + '_label'] || "Get Custom Offer"}
                      isCustomOffer={true}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
            {pkg.popular ? (
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold text-white group/badge whitespace-nowrap"
                style={{ backgroundColor: brandColor }}
              >
                <EditableText
                  value={popularBadgeText}
                  onSave={(newValue) => updatePopularBadgeText(newValue)}
                  className="inline text-sm font-bold"
                  placeholder="Most Popular"
                  darkMode={true}
                  brandColor={brandColor}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePopularPackage(index);
                  }}
                  className="ml-2 opacity-0 group-hover/badge:opacity-100 transition-opacity hover:text-white/70"
                  title="Remove popular badge"
                >
                  <X className="w-3 h-3 inline" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => togglePopularPackage(index)}
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium text-gray-400 bg-gray-100 hover:text-white transition-all opacity-0 group-hover/package:opacity-100"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = brandColor; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
              >
                Mark as Popular
              </button>
            )}

            <div className="flex-grow flex flex-col">
              <div className={packages.length === 4 ? 'min-h-[390px] flex flex-col' : ''}>
                <div className="text-center mb-4">
                  <div
                    className={`inline-block px-6 py-2 rounded-full text-white font-bold shadow-md ${packages.length === 4 ? 'text-base' : 'text-lg'}`}
                    style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                  >
                    <EditableText
                      value={pkg.name}
                      onSave={(newValue) => updatePackageName(tierName, newValue)}
                      className="inline text-lg font-bold"
                      placeholder={tierName.charAt(0).toUpperCase() + tierName.slice(1)}
                      darkMode={true}
                      brandColor="#fff"
                    />
                  </div>
                </div>

                <div className="mb-0 group/origprice">
                  {/* Original/strikethrough price */}
                  <div className="h-8 flex items-center justify-center mb-1">
                    {originalPrice > 0 ? (
                      <div className="flex items-center gap-2">
                        <EditablePrice
                          value={originalPrice}
                          onSave={(newPrice) => { updateConfig(originalPriceKey, newPrice); setTimeout(() => silentSave(), 300); }}
                          className="text-lg text-gray-400 line-through cursor-pointer"
                          brandColor={brandColor}
                        />
                        <button
                          onClick={() => { updateConfig(originalPriceKey, null); setTimeout(() => silentSave(), 300); }}
                          className="opacity-0 group-hover/origprice:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ) : !isPreviewMode ? (
                      <button
                        onClick={() => { updateConfig(originalPriceKey, Math.round(pkg.price * 1.2)); setTimeout(() => silentSave(), 300); }}
                        className="opacity-0 group-hover/origprice:opacity-100 text-xs text-gray-400 hover:text-gray-600 underline transition-opacity"
                      >
                        + Add original price
                      </button>
                    ) : <div />}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 justify-center">
                      <EditablePrice
                        value={pkg.price}
                        onSave={(newPrice) => {
                          if (pricingMode === 'one-time') {
                            const retainerPrice = roundToNearest50IfNeeded(Math.round(newPrice * 0.85));
                            updateConfigMultiple({
                              [`price_${tierName}`]: newPrice,
                              [`price_${tierName}_retainer`]: retainerPrice
                            });
                          } else {
                            updateConfig(`price_${tierName}_retainer`, newPrice);
                          }
                        }}
                        className={`font-bold inline-block ${packages.length === 4 ? 'text-2xl' : 'text-3xl'}`}
                        style={{ color: brandColor }}
                        brandColor={brandColor}
                      />
                      <span className="text-base text-gray-500">
                        / <EditableText
                          value={pricingMode === 'one-time' ? (config.pricing_label_onetime || 'one-time') : (config.pricing_label_retainer || 'monthly')}
                          onSave={(newValue) => {
                            const field = pricingMode === 'one-time' ? 'pricing_label_onetime' : 'pricing_label_retainer';
                            updateConfig(field, newValue);
                          }}
                          className="inline text-base"
                          placeholder={pricingMode === 'one-time' ? 'one-time' : 'monthly'}
                          brandColor={brandColor}
                        />
                      </span>
                    </div>
                    {pricingMode === 'retainer' && (
                      <div className="mt-1 flex justify-center">
                        {retainerDiscountText?.trim() ? (
                          <div className="relative group/discount inline-block">
                            <EditableText
                              value={retainerDiscountText}
                              onSave={(newValue) => updateConfig('retainer_discount_text', newValue)}
                              className="text-xs text-gray-500 text-center"
                              placeholder="15% off one-time price"
                              multiline={false}
                              darkMode={false}
                              brandColor={brandColor}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateConfig('retainer_discount_text', '');
                              }}
                              className="absolute -right-1 -top-1 opacity-0 group-hover/discount:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                              title="Delete discount text"
                              aria-label="Delete discount text"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateConfig('retainer_discount_text', '15% off one-time price')}
                            className="text-xs text-gray-400 hover:text-gray-600 underline"
                          >
                            + Add discount text
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {!isPreviewMode && (
                  <CostCalculatorTrigger
                    {...getCostCalculatorDisplay(config.cost_data?.[modeKey]?.[tierName], pkg.price, currencySymbol)}
                    onClick={() => openCostCalculator(tierName)}
                  />
                )}
                {pricingMode === 'one-time' && (
                  <p className={`text-gray-900 font-bold mb-6 text-center ${packages.length === 4 ? 'text-lg' : 'text-xl'}`}>
                    <EditableText
                      value={pkg.duration || '2-4 weeks to delivery'}
                      onSave={(newValue) => updatePackageDuration(tierName, newValue)}
                      className={`inline font-bold ${packages.length === 4 ? 'text-lg' : 'text-xl'}`}
                      placeholder="2-4 weeks to delivery"
                      brandColor={brandColor}
                    />
                  </p>
                )}

                {pkg.description !== null ? (
                  <div
                    className={`mb-6 rounded-xl relative group/desc overflow-hidden ${
                      packages.length === 4 ? 'p-2 min-h-[48px] max-h-[48px]' : 'p-4 min-h-[64px] max-h-[64px]'
                    }`}
                    style={{ backgroundColor: `${brandColor}15` }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePackageDescription(tierName, null);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover/desc:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                      title="Delete description"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <EditableText
                      value={pkg.description}
                      onSave={(newValue) => updatePackageDescription(tierName, newValue)}
                      className="block w-full text-sm text-gray-700"
                      multiline={true}
                      multilineCompact={true}
                      maxLength={120}
                      placeholder="Describe who this package is best for"
                      brandColor={brandColor}
                    />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePackageDescription(tierName, '');
                    }}
                    className="mb-6 text-sm font-medium underline"
                    style={{ color: brandColor }}
                  >
                    + Add description
                  </button>
                )}

                <div className={`space-y-2 mb-4`}>
                  <p className="text-sm font-semibold text-gray-500 uppercase">Deliverables</p>

                  <Droppable droppableId={`deliverables-${tierName}`} type="deliverable">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2" style={{ minHeight: `${deliverablesMinHeight}px` }}>
                       {deliverableTemplate.map((templateDeliverable, idx) => {
                         const deliverable = pkg.deliverables[idx];
                         const isIncluded = idx < pkg.deliverables.length;
                         const placeholderText = typeof templateDeliverable === 'string'
                           ? templateDeliverable
                           : templateDeliverable?.type || '';

                         if (!isIncluded) {
                           if (!showExcludedDeliverables) {
                             return <div key={`deliv-missing-${tierName}-${idx}`} className="min-h-[24px]" aria-hidden />;
                           }
                           return (
                             <div
                               key={`deliv-missing-${tierName}-${idx}`}
                               className="flex items-start gap-2 rounded px-2 py-1"
                             >
                               <div className="p-1 mt-0.5">
                                 <GripVertical className="w-4 h-4 text-transparent" />
                               </div>
                               <X className="w-5 h-5 mt-0.5 text-gray-300 flex-shrink-0" />
                               <span className="text-sm text-gray-400 flex-1">
                                 {placeholderText}
                               </span>
                             </div>
                           );
                         }

                         return (
                           <Draggable key={`deliv-${tierName}-${idx}`} draggableId={`deliv-${tierName}-${idx}`} index={idx}>
                             {(provided) => (
                               <div ref={provided.innerRef} {...provided.draggableProps}>
                                 <EditableDeliverableItem
                                   deliverable={deliverable}
                                   onSave={(newVal) => updateDeliverable(tierName, idx, newVal)}
                                   onDuplicate={() => duplicateDeliverable(tierName, idx)}
                                   onDelete={() => deleteDeliverable(tierName, idx)}
                                   darkMode={false}
                                   brandColor={brandColor}
                                   dragHandleProps={provided.dragHandleProps}
                                 />
                               </div>
                             )}
                           </Draggable>
                         );
                       })}
                       {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addDeliverable(tierName);
                    }}
                    className="flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: brandColor }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = darkerBrandColor; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = brandColor; }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Deliverable
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-8 pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-500 uppercase">Bonuses</p>

                <Droppable droppableId={`bonuses-${tierName}`} type="bonus">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2" style={{ minHeight: `${bonusesMinHeight}px` }}>
                      {bonusTemplate.map((templateBonus, idx) => {
                        const bonus = pkg.bonuses[idx];
                        const hasBonus = idx < pkg.bonuses.length;

                        if (!hasBonus) {
                          if (!showExcludedDeliverables) {
                            return <div key={`bonus-missing-${tierName}-${idx}`} className="min-h-[24px]" aria-hidden />;
                          }
                          return (
                            <div
                              key={`bonus-missing-${tierName}-${idx}`}
                              className="flex items-start gap-2 rounded px-2 py-1"
                            >
                              <div className="p-1 mt-0.5">
                                <GripVertical className="w-4 h-4 text-transparent" />
                              </div>
                              <X className="w-5 h-5 mt-0.5 text-gray-300 flex-shrink-0" />
                              <span className="text-sm text-gray-400 flex-1">
                                {templateBonus}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <Draggable key={`bonus-${tierName}-${idx}`} draggableId={`bonus-${tierName}-${idx}`} index={idx}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}>
                                <EditableListItem
                                  value={bonus}
                                  onSave={(newValue) => updateBonus(tierName, idx, newValue)}
                                  onDelete={() => deleteBonus(tierName, idx)}
                                  icon={Plus}
                                  iconClassName="text-green-500"
                                  brandColor={brandColor}
                                  dragHandleProps={provided.dragHandleProps}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addBonus(tierName);
                  }}
                  className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Bonus
                </button>
              </div>
            </div>

            {showPackageButtonsInEditMode && (
              <div className="relative">
                <EditableButton
                  tier={tierName}
                  brandColor={brandColor}
                  darkerBrandColor={darkerBrandColor}
                  darkMode={false}
                  customLabel={config.button_links?.[modeKey]?.[tierName + '_label'] || 'Lock Your Spot'}
                  isCustomOffer={false}
                  onConfigureClick={openConfigureModal}
                  isRemoved={config.button_links?.[modeKey]?.[tierName + '_removed'] === true}
                  onRemoveClick={removeButtonCTA}
                />
              </div>
            )}
            </>
            )}
            </motion.div>
            );
            })}
            </div>
            </DragDropContext>
            );
  };

  const renderDesign2 = () => {
    // Calculate max deliverables and bonuses to align sections across tiers
    const maxDeliverables = Math.max(...packages.filter(p => !p.isCustomOffer).map(p => p.deliverables.length), 1);
    const maxBonuses = Math.max(...packages.filter(p => !p.isCustomOffer).map(p => p.bonuses.length), 0);
    const deliverableTemplate = Array.from({ length: maxDeliverables }, (_, idx) =>
      packages.find(p => !p.isCustomOffer && p.deliverables[idx])?.deliverables[idx] || null
    );
    const bonusTemplate = Array.from({ length: maxBonuses }, (_, idx) =>
      packages.find(p => !p.isCustomOffer && p.bonuses[idx])?.bonuses[idx] || ''
    );
    const deliverablesMinHeight = packages.length === 4 ? maxDeliverables * 28 : maxDeliverables * 32;
    const bonusesMinHeight = packages.length === 4 ? maxBonuses * 28 : maxBonuses * 32;
    
    return (
    <DragDropContext onDragEnd={handleDragEnd}>
    <div className={`grid gap-4 ${packages.length === 4 ? 'md:grid-cols-4' : packages.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : packages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
      {packages.map((pkg, index) => {
        const tierName = pkg.tier;
        const originalPriceKey = `original_price_${tierName}${pricingMode === 'one-time' ? '' : '_retainer'}`;
        const originalPrice = config[originalPriceKey];

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative rounded-3xl ${packages.length === 4 ? 'p-6' : 'p-8'} text-white shadow-2xl flex flex-col group/package ${
              pkg.popular
                ? ''
                : 'bg-gradient-to-br from-gray-800 to-gray-900'
            }`}
            style={pkg.popular ? { background: `linear-gradient(to bottom right, ${brandColor}, ${darkerBrandColor})` } : {}}
          >
            {packages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDeletePackage(pkg.tier);
                }}
                className="absolute top-3 left-3 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/package:opacity-100 transition-opacity z-50 cursor-pointer shadow-md hover:shadow-lg"
                title="Delete package"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {pkg.isCustomOffer ? (
              <div className="flex-grow flex flex-col items-center justify-center py-12">
                <div className="text-center mb-8">
                  <div 
                    className={`inline-block px-8 py-3 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold shadow-md mb-6 ${packages.length === 4 ? 'text-xl' : 'text-2xl'}`}
                  >
                    <EditableText
                      value={pkg.name}
                      onSave={(newValue) => updatePackageName(tierName, newValue)}
                      className={`inline font-bold ${packages.length === 4 ? 'text-xl' : 'text-2xl'}`}
                      placeholder="Custom Offer"
                      darkMode={true}
                      brandColor="#fff"
                    />
                  </div>
                  <h3 className={`font-bold text-white mb-4 ${packages.length === 4 ? 'text-2xl' : 'text-3xl'}`}>
                    <EditableText
                      value={config.package_descriptions?.[modeKey]?.[tierName] || 'Need Something Different?'}
                      onSave={(newValue) => updatePackageDescription(tierName, newValue)}
                      className={`inline font-bold ${packages.length === 4 ? 'text-2xl' : 'text-3xl'}`}
                      placeholder="Need Something Different?"
                      darkMode={true}
                      brandColor={brandColor}
                    />
                  </h3>
                  <p className="text-white/80 text-base mb-8 max-w-xs mx-auto">
                    <EditableText
                      value={config.package_descriptions?.[modeKey]?.[tierName + '_subtitle'] || "Let's create a custom package tailored specifically to your needs"}
                      onSave={(newValue) => updatePackageDescription(tierName + '_subtitle', newValue)}
                      className="inline text-base"
                      multiline={true}
                      placeholder="Let's create a custom package tailored specifically to your needs"
                      darkMode={true}
                      brandColor={brandColor}
                    />
                  </p>
                </div>
                {showPackageButtonsInEditMode && (
                  <div className="w-full">
                    <EditableButton
                      tier={tierName}
                      brandColor={brandColor}
                      darkerBrandColor={darkerBrandColor}
                      darkMode={true}
                      customLabel={config.button_links?.[modeKey]?.[tierName + '_label'] || "Get Custom Offer"}
                      isCustomOffer={true}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
            {pkg.popular ? (
              <div
                className="absolute -top-3 right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold text-xs shadow-lg group/badge"
              >
                <EditableText
                  value={popularBadgeText}
                  onSave={(newValue) => updatePopularBadgeText(newValue)}
                  className="text-center leading-tight text-xs"
                  placeholder="Most Popular"
                  darkMode={false}
                  brandColor="#000"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePopularPackage(index);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover/badge:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove popular badge"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => togglePopularPackage(index)}
                className="absolute -top-2 right-4 w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white/40 font-bold text-xs hover:bg-yellow-400 hover:text-gray-900 transition-all opacity-0 group-hover/package:opacity-100"
              >
                MARK
              </button>
            )}

            <div className="flex-grow flex flex-col">
              <div className={packages.length === 4 ? 'min-h-[390px] flex flex-col' : ''}>
                <div className="text-center mb-4">
                  <div className={`inline-block px-6 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold shadow-md ${packages.length === 4 ? 'text-base' : 'text-lg'}`}>
                    <EditableText
                      value={pkg.name}
                      onSave={(newValue) => updatePackageName(tierName, newValue)}
                      className="inline text-lg font-bold"
                      placeholder={tierName.charAt(0).toUpperCase() + tierName.slice(1)}
                      darkMode={true}
                      brandColor="#fff"
                    />
                  </div>
                </div>

                <div className="mb-0 group/origprice">
                  {/* Original/strikethrough price */}
                  <div className="h-8 flex items-center justify-center mb-1">
                    {originalPrice > 0 ? (
                      <div className="flex items-center gap-2">
                        <EditablePrice
                          value={originalPrice}
                          onSave={(newPrice) => { updateConfig(originalPriceKey, newPrice); setTimeout(() => silentSave(), 300); }}
                          className="text-lg text-white/50 line-through cursor-pointer"
                          darkMode={true}
                          brandColor="#fff"
                        />
                        <button
                          onClick={() => { updateConfig(originalPriceKey, null); setTimeout(() => silentSave(), 300); }}
                          className="opacity-0 group-hover/origprice:opacity-100 text-xs text-red-300 hover:text-red-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ) : !isPreviewMode ? (
                      <button
                        onClick={() => { updateConfig(originalPriceKey, Math.round(pkg.price * 1.2)); setTimeout(() => silentSave(), 300); }}
                        className="opacity-0 group-hover/origprice:opacity-100 text-xs text-white/40 hover:text-white/70 underline transition-opacity"
                      >
                        + Add original price
                      </button>
                    ) : <div />}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1 justify-center">
                      <EditablePrice
                        value={pkg.price}
                        onSave={(newPrice) => {
                          if (pricingMode === 'one-time') {
                            const retainerPrice = roundToNearest50IfNeeded(Math.round(newPrice * 0.85));
                            updateConfigMultiple({
                              [`price_${tierName}`]: newPrice,
                              [`price_${tierName}_retainer`]: retainerPrice
                            });
                          } else {
                            updateConfig(`price_${tierName}_retainer`, newPrice);
                          }
                        }}
                        className={`font-bold text-white inline-block ${packages.length === 4 ? 'text-2xl' : 'text-3xl'}`}
                        darkMode={true}
                        brandColor={brandColor}
                      />
                      <span className="text-base text-white/70">
                        / <EditableText
                          value={pricingMode === 'one-time' ? (config.pricing_label_onetime || 'one-time') : (config.pricing_label_retainer || 'monthly')}
                          onSave={(newValue) => {
                            const field = pricingMode === 'one-time' ? 'pricing_label_onetime' : 'pricing_label_retainer';
                            updateConfig(field, newValue);
                          }}
                          className="inline text-base"
                          placeholder={pricingMode === 'one-time' ? 'one-time' : 'monthly'}
                          darkMode={true}
                          brandColor={brandColor}
                        />
                      </span>
                    </div>
                    {pricingMode === 'retainer' && (
                      <div className="mt-1 flex justify-center">
                        {retainerDiscountText?.trim() ? (
                          <div className="relative group/discount inline-block">
                            <EditableText
                              value={retainerDiscountText}
                              onSave={(newValue) => updateConfig('retainer_discount_text', newValue)}
                              className="text-xs text-white/70 text-center"
                              placeholder="15% off one-time price"
                              multiline={false}
                              darkMode={true}
                              brandColor={brandColor}
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateConfig('retainer_discount_text', '');
                              }}
                              className="absolute -right-1 -top-1 opacity-0 group-hover/discount:opacity-100 text-white/50 hover:text-red-300 transition-opacity"
                              title="Delete discount text"
                              aria-label="Delete discount text"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateConfig('retainer_discount_text', '15% off one-time price')}
                            className="text-xs text-white/50 hover:text-white/70 underline"
                          >
                            + Add discount text
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {!isPreviewMode && (
                  <CostCalculatorTrigger
                    {...getCostCalculatorDisplay(config.cost_data?.[modeKey]?.[tierName], pkg.price, currencySymbol)}
                    onClick={() => openCostCalculator(tierName)}
                    darkMode
                  />
                )}
                {pricingMode === 'one-time' && (
                  <p className={`text-white font-bold mb-6 text-center ${packages.length === 4 ? 'text-lg' : 'text-xl'}`}>
                    <EditableText
                      value={pkg.duration || '2-4 weeks to delivery'}
                      onSave={(newValue) => updatePackageDuration(tierName, newValue)}
                      className={`inline font-bold ${packages.length === 4 ? 'text-lg' : 'text-xl'}`}
                      placeholder="2-4 weeks to delivery"
                      darkMode={true}
                      brandColor={brandColor}
                    />
                  </p>
                )}

                {pkg.description !== null ? (
                  <div
                    className={`mb-6 rounded-xl relative group/desc overflow-hidden ${
                      packages.length === 4 ? 'p-2 min-h-[48px] max-h-[48px]' : 'p-4 min-h-[64px] max-h-[64px]'
                    }`}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updatePackageDescription(tierName, null);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover/desc:opacity-100 transition-opacity text-red-200 hover:text-red-100"
                      title="Delete description"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <EditableText
                      value={pkg.description}
                      onSave={(newValue) => updatePackageDescription(tierName, newValue)}
                      className="block w-full text-sm text-white"
                      multiline={true}
                      multilineCompact={true}
                      maxLength={120}
                      placeholder="Describe who this package is best for"
                      darkMode={true}
                      brandColor={brandColor}
                    />
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePackageDescription(tierName, '');
                    }}
                    className="mb-6 text-sm font-medium underline text-white/80 hover:text-white"
                  >
                    + Add description
                  </button>
                )}

                <div className={`space-y-2 mb-4`}>
                  <p className="text-sm font-semibold text-white/70 uppercase">Deliverables</p>

                  <Droppable droppableId={`deliverables-${tierName}`} type="deliverable">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2" style={{ minHeight: `${deliverablesMinHeight}px` }}>
                       {deliverableTemplate.map((templateDeliverable, idx) => {
                         const deliverable = pkg.deliverables[idx];
                         const isIncluded = idx < pkg.deliverables.length;
                         const placeholderText = typeof templateDeliverable === 'string'
                           ? templateDeliverable
                           : templateDeliverable?.type || '';

                         if (!isIncluded) {
                           if (!showExcludedDeliverables) {
                             return <div key={`deliv-missing-${tierName}-${idx}`} className="min-h-[24px]" aria-hidden />;
                           }
                           return (
                             <div
                               key={`deliv-missing-${tierName}-${idx}`}
                               className="flex items-start gap-2 rounded px-2 py-1"
                             >
                               <div className="p-1 mt-0.5">
                                 <GripVertical className="w-4 h-4 text-transparent" />
                               </div>
                               <X className="w-5 h-5 mt-0.5 text-white/30 flex-shrink-0" />
                               <span className="text-sm text-white/40 flex-1">
                                 {placeholderText}
                               </span>
                             </div>
                           );
                         }

                         return (
                           <Draggable key={`deliv-${tierName}-${idx}`} draggableId={`deliv-${tierName}-${idx}`} index={idx}>
                             {(provided) => (
                               <div ref={provided.innerRef} {...provided.draggableProps}>
                                 <EditableDeliverableItem
                                   deliverable={deliverable}
                                   onSave={(newVal) => updateDeliverable(tierName, idx, newVal)}
                                   onDuplicate={() => duplicateDeliverable(tierName, idx)}
                                   onDelete={() => deleteDeliverable(tierName, idx)}
                                   darkMode={true}
                                   brandColor={brandColor}
                                   dragHandleProps={provided.dragHandleProps}
                                 />
                               </div>
                             )}
                           </Draggable>
                         );
                       })}
                       {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addDeliverable(tierName);
                    }}
                    className="flex items-center gap-2 text-sm text-white/80 hover:text-white font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Deliverable
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-8 pt-4 border-t border-white/20">
                <p className="text-xs font-bold uppercase tracking-wider">Bonuses</p>

                <Droppable droppableId={`bonuses-${tierName}`} type="bonus">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2" style={{ minHeight: `${bonusesMinHeight}px` }}>
                      {bonusTemplate.map((templateBonus, idx) => {
                        const bonus = pkg.bonuses[idx];
                        const hasBonus = idx < pkg.bonuses.length;

                        if (!hasBonus) {
                          if (!showExcludedDeliverables) {
                            return <div key={`bonus-missing-${tierName}-${idx}`} className="min-h-[24px]" aria-hidden />;
                          }
                          return (
                            <div
                              key={`bonus-missing-${tierName}-${idx}`}
                              className="flex items-start gap-2 rounded px-2 py-1"
                            >
                              <div className="p-1 mt-0.5">
                                <GripVertical className="w-4 h-4 text-transparent" />
                              </div>
                              <X className="w-5 h-5 mt-0.5 text-white/30 flex-shrink-0" />
                              <span className="text-sm text-white/40 flex-1">
                                {templateBonus}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <Draggable key={`bonus-${tierName}-${idx}`} draggableId={`bonus-${tierName}-${idx}`} index={idx}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps}>
                                <EditableListItem
                                  value={bonus}
                                  onSave={(newValue) => updateBonus(tierName, idx, newValue)}
                                  onDelete={() => deleteBonus(tierName, idx)}
                                  icon={Plus}
                                  iconClassName="text-yellow-400"
                                  darkMode={true}
                                  brandColor={brandColor}
                                  dragHandleProps={provided.dragHandleProps}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addBonus(tierName);
                  }}
                  className="flex items-center gap-2 text-sm text-yellow-300 hover:text-yellow-200 font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Bonus
                </button>
              </div>
            </div>

            {showPackageButtonsInEditMode && (
              <div className="relative">
                <EditableButton
                  tier={tierName}
                  brandColor={brandColor}
                  darkerBrandColor={darkerBrandColor}
                  darkMode={true}
                  customLabel={config.button_links?.[modeKey]?.[tierName + '_label'] || 'Lock Your Spot'}
                  isCustomOffer={false}
                  onConfigureClick={openConfigureModal}
                  isRemoved={config.button_links?.[modeKey]?.[tierName + '_removed'] === true}
                  onRemoveClick={removeButtonCTA}
                />
              </div>
            )}
            </>
            )}
            </motion.div>
            );
            })}
            </div>
            </DragDropContext>
            );
  };

            const renderPreviewDesign1 = () => {
    const maxDeliverables = Math.max(...previewPackages.filter(p => !p.isCustomOffer).map(p => p.deliverables.length), 1);
    const maxBonuses = Math.max(...previewPackages.filter(p => !p.isCustomOffer).map(p => p.bonuses.length), 0);
    const deliverableTemplate = Array.from({ length: maxDeliverables }, (_, idx) =>
      previewPackages.find(p => !p.isCustomOffer && p.deliverables[idx])?.deliverables[idx] || null
    );
    const rowGap = previewPackages.length === 4 ? 4 : 12;
    const deliverablesMinHeight = previewPackages.length === 4 ? maxDeliverables * 24 : maxDeliverables * 28;
    const deliverablesHeight = deliverablesMinHeight + Math.max(0, maxDeliverables - 1) * rowGap;
    const bonusesHeight = maxBonuses > 0 ? (previewPackages.length === 4 ? maxBonuses * 24 : maxBonuses * 28) + Math.max(0, maxBonuses - 1) * rowGap : 0;
    const descHeight = previewPackages.length === 4 ? 48 : 64;
    const hasAnyOriginalPrice = previewPackages.some(p =>
      config[`original_price_${p.tier}${pricingMode === 'one-time' ? '' : '_retainer'}`] > 0
    );

    return (
              <div className={`grid gap-4 ${previewPackages.length === 4 ? 'md:grid-cols-4' : previewPackages.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : previewPackages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
                {previewPackages.map((pkg, index) => {
        const modeKey = getCurrentModeKey();
        const buttonLink = config.button_links?.[modeKey]?.[pkg.tier];
        const isRemoved = config.button_links?.[modeKey]?.[pkg.tier + '_removed'] === true;
        const trimmedLink = buttonLink?.trim() || '';
        const hasValidLink = trimmedLink !== '';
        const showCTA = hasValidLink && !isRemoved;
        const finalLink = hasValidLink ? (
          trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://')
            ? trimmedLink
            : `https://${trimmedLink}`
        ) : null;

        if (pkg.isCustomOffer) {
          return (
            <motion.div
              key={index}
              {...getPreviewMotionProps(index)}
              className={`relative bg-white rounded-3xl border-2 border-gray-200 shadow-lg flex flex-col ${previewPackages.length === 4 ? 'p-4' : 'p-6'}`}
            >
              <div className={`flex-grow flex flex-col items-center justify-center ${previewPackages.length === 4 ? 'py-6' : 'py-12'}`}>
                <div className="text-center mb-4">
                  <div 
                    className={`inline-block px-4 py-2 rounded-full text-white font-bold shadow-md mb-3 ${previewPackages.length === 4 ? 'text-base' : 'text-2xl'}`}
                    style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                  >
                    {pkg.name}
                  </div>
                  <h3 className={`font-bold text-gray-900 mb-2 ${previewPackages.length === 4 ? 'text-lg' : 'text-3xl'}`}>
                    {config.package_descriptions?.[modeKey]?.[pkg.tier] || 'Need Something Different?'}
                  </h3>
                  <p className={`text-gray-600 mb-4 mx-auto ${previewPackages.length === 4 ? 'text-xs max-w-[180px]' : 'text-base max-w-xs'}`}>
                    {config.package_descriptions?.[modeKey]?.[pkg.tier + '_subtitle'] || "Let's create a custom package tailored specifically to your needs"}
                  </p>
                </div>
                {showCTA && (
                <a
                  href={finalLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full font-semibold rounded-full text-white shadow-lg flex items-center justify-center transition-all hover:opacity-90 ${previewPackages.length === 4 ? 'h-10 text-sm' : 'h-12'}`}
                  style={{
                    background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)`,
                    textDecoration: 'none'
                  }}
                  onClick={(e) => {
                    if (!finalLink) {
                      e.preventDefault();
                    }
                    const currentMode = getCurrentModeKey();
                    const uniqueTierKey = `${pkg.tier}_${currentMode}`;
                    const tierLabel = pkg.name || pkg.tier;
                    const modeLabel = pricingMode === 'one-time' ? (config.pricing_label_onetime || 'One-Time') : (config.pricing_label_retainer || 'Monthly');
                    console.log('CLICK DEBUG:', { tier: pkg.tier, tierLabel, modeLabel, packageId });
                    const packageIdForClick = packageId;
                    const doClick = (viewId) => { if (viewId) logButtonClick(viewId, uniqueTierKey, tierLabel, modeLabel, packageIdForClick); };
                    if (window.__analyticsViewId) { doClick(window.__analyticsViewId); }
                    else if (window.__analyticsPending) { window.__analyticsPending.then(doClick); }
                  }}
                >
                  {config.button_links?.[modeKey]?.[pkg.tier + '_label'] || "Get Custom Offer"}
                </a>
                )}
              </div>
            </motion.div>
          );
        }

        return (
        <motion.div
          key={index}
          {...getPreviewMotionProps(index)}
          className={`relative bg-white rounded-3xl border-2 flex flex-col ${
            pkg.popular ? 'shadow-xl' : 'border-gray-200 shadow-lg'
          } ${previewPackages.length === 4 ? 'p-4' : 'p-6'}`}
          style={pkg.popular ? { borderColor: brandColor } : {}}
        >
          {pkg.popular && (
            <div
              className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-bold text-white whitespace-nowrap ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}
              style={{ backgroundColor: brandColor }}
            >
              {popularBadgeText}
            </div>
          )}

          <div className="flex-grow flex flex-col">
              <div className="text-center mb-3">
                <div 
                  className={`inline-block px-4 py-1.5 rounded-full text-white font-bold shadow-md ${previewPackages.length === 4 ? 'text-sm' : 'text-lg'}`}
                  style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                >
                  {pkg.name}
                </div>
              </div>

              <div className="mb-2">
                {hasAnyOriginalPrice && (
                  <div className="h-7 flex items-center justify-center mb-1">
                    {config[`original_price_${pkg.tier}${pricingMode === 'one-time' ? '' : '_retainer'}`] > 0 && (
                      <span className="text-lg text-gray-400 line-through">
                        {currencySymbol}{config[`original_price_${pkg.tier}${pricingMode === 'one-time' ? '' : '_retainer'}`].toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
                <div>
                  <div className="flex items-baseline gap-1 justify-center">
                    <div className={`font-bold text-gray-900 ${previewPackages.length === 4 ? 'text-xl' : 'text-3xl'}`}>
                      {currencySymbol}{(pkg.price || 0).toLocaleString()}
                    </div>
                    <span className={`text-gray-500 ${previewPackages.length === 4 ? 'text-xs' : 'text-base'}`}>
                      / {pricingMode === 'one-time' ? (config.pricing_label_onetime || 'one-time') : (config.pricing_label_retainer || 'monthly')}
                    </span>
                  </div>
                  {pricingMode === 'retainer' && retainerDiscountText?.trim() && (
                    <p className="text-xs text-gray-500 text-center mt-1">{retainerDiscountText}</p>
                  )}
                </div>
              </div>
              {pricingMode === 'one-time' && (
                <p className={`text-gray-900 font-bold mb-4 text-center ${previewPackages.length === 4 ? 'text-base' : 'text-2xl'}`}>
                  {pkg.duration ? pkg.duration : '2-4 weeks to delivery'}
                </p>
              )}

              <div
                className={`rounded-xl mb-4 overflow-hidden ${
                  previewPackages.length === 4 ? 'p-2' : 'p-4'
                }`}
                style={{ height: `${descHeight}px`, minHeight: `${descHeight}px`, backgroundColor: pkg.description != null ? `${brandColor}15` : 'transparent' }}
              >
                {pkg.description != null && (
                  <p
                    className={`text-gray-700 ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {pkg.description}
                  </p>
                )}
              </div>

              <div className={`mb-4 ${previewPackages.length === 4 ? 'space-y-1' : 'space-y-2'}`}>
                <p className={`font-semibold text-gray-500 uppercase ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>Deliverables</p>
                <div style={{ height: `${deliverablesHeight}px`, minHeight: `${deliverablesHeight}px`, overflowY: 'auto' }} className={previewPackages.length === 4 ? 'space-y-1' : 'space-y-2'}>
                  {deliverableTemplate.map((templateDeliverable, i) => {
                    const deliverable = pkg.deliverables[i];
                    const isIncluded = i < pkg.deliverables.length;
                    const label = showExcludedDeliverables
                      ? (typeof (deliverable || templateDeliverable) === 'string'
                          ? (deliverable || templateDeliverable)
                          : (deliverable || templateDeliverable)?.type || '')
                      : (isIncluded ? (typeof deliverable === 'string' ? deliverable : deliverable?.type || '') : '');

                    if (!isIncluded && !showExcludedDeliverables) {
                      return <div key={i} className={`flex items-start gap-1.5 ${previewPackages.length === 4 ? 'min-h-[24px]' : 'min-h-[28px]'}`} aria-hidden />;
                    }

                    return (
                      <div key={i} className="flex items-start gap-1.5">
                        {isIncluded ? (
                          <Check
                            className={`flex-shrink-0 mt-0.5 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`}
                            style={{ color: brandColor }}
                          />
                        ) : (
                          <X className={`flex-shrink-0 mt-0.5 text-gray-300 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                        )}
                        <span className={`${isIncluded ? 'text-gray-700' : 'text-gray-400'} ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            {(maxBonuses > 0 || pkg.bonuses.length > 0) && (
              <div className={`pt-4 border-t border-gray-200 mb-10 ${previewPackages.length === 4 ? 'space-y-1' : 'space-y-2'}`}>
                <p className={`font-semibold text-gray-500 uppercase ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>Bonuses</p>
                <div style={{ height: `${bonusesHeight}px`, minHeight: `${bonusesHeight}px`, overflowY: 'auto' }} className={previewPackages.length === 4 ? 'space-y-1' : 'space-y-2'}>
                  {Array.from({ length: maxBonuses }, (_, i) => {
                    const bonus = pkg.bonuses[i];
                    const hasBonus = i < pkg.bonuses.length;
                    const bonusLabel = hasBonus ? bonus : (previewPackages.find(p => !p.isCustomOffer && p.bonuses[i])?.bonuses[i] || '');
                    if (!hasBonus && !showExcludedDeliverables) {
                      return <div key={i} className={`flex items-start gap-1.5 ${previewPackages.length === 4 ? 'min-h-[24px]' : 'min-h-[28px]'}`} aria-hidden />;
                    }
                    return (
                      <div key={i} className="flex items-start gap-1.5">
                        {hasBonus ? (
                          <Plus className={`flex-shrink-0 mt-0.5 text-green-500 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                        ) : (
                          <X className={`flex-shrink-0 mt-0.5 text-gray-300 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                        )}
                        <span className={`${hasBonus ? 'text-gray-700' : 'text-gray-400'} ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>{bonusLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {showCTA && (
          <a
            href={finalLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full font-semibold rounded-full text-white shadow-lg flex items-center justify-center transition-all hover:opacity-90 ${previewPackages.length === 4 ? 'h-10 text-sm' : 'h-12'}`}
            style={{
              background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)`,
              textDecoration: 'none'
            }}
            onClick={(e) => {
              if (!finalLink) {
                e.preventDefault();
              }
              const currentMode = getCurrentModeKey();
              const uniqueTierKey = `${pkg.tier}_${currentMode}`;
              const tierLabel = pkg.name || pkg.tier;
              const modeLabel = pricingMode === 'one-time' ? (config.pricing_label_onetime || 'One-Time') : (config.pricing_label_retainer || 'Monthly');
              console.log('CLICK DEBUG:', { tier: pkg.tier, tierLabel, modeLabel, packageId });
              const packageIdForClick = packageId;
              const doClick = (viewId) => { if (viewId) logButtonClick(viewId, uniqueTierKey, tierLabel, modeLabel, packageIdForClick); };
                    if (window.__analyticsViewId) { doClick(window.__analyticsViewId); }
                    else if (window.__analyticsPending) { window.__analyticsPending.then(doClick); }
            }}
          >
            {config.button_links?.[modeKey]?.[pkg.tier + '_label'] || 'Lock Your Spot'}
          </a>
          )}
        </motion.div>
        );
      })}
    </div>
    );
  };

  const renderPreviewDesign2 = () => {
    const maxDeliverables = Math.max(...previewPackages.filter(p => !p.isCustomOffer).map(p => p.deliverables.length), 1);
    const maxBonuses = Math.max(...previewPackages.filter(p => !p.isCustomOffer).map(p => p.bonuses.length), 0);
    const deliverableTemplate = Array.from({ length: maxDeliverables }, (_, idx) =>
      previewPackages.find(p => !p.isCustomOffer && p.deliverables[idx])?.deliverables[idx] || null
    );
    const rowGap = previewPackages.length === 4 ? 4 : 12;
    const deliverablesMinHeight = previewPackages.length === 4 ? maxDeliverables * 24 : maxDeliverables * 28;
    const deliverablesHeight = deliverablesMinHeight + Math.max(0, maxDeliverables - 1) * rowGap;
    const bonusesHeight = maxBonuses > 0 ? (previewPackages.length === 4 ? maxBonuses * 24 : maxBonuses * 28) + Math.max(0, maxBonuses - 1) * rowGap : 0;
    const descHeight = previewPackages.length === 4 ? 48 : 64;
    const hasAnyOriginalPrice = previewPackages.some(p =>
      config[`original_price_${p.tier}${pricingMode === 'one-time' ? '' : '_retainer'}`] > 0
    );

    return (
    <div className={`grid gap-4 ${previewPackages.length === 4 ? 'md:grid-cols-4' : previewPackages.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : previewPackages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
      {previewPackages.map((pkg, index) => {
        const modeKey = getCurrentModeKey();
        const buttonLink = config.button_links?.[modeKey]?.[pkg.tier];
        const isRemoved = config.button_links?.[modeKey]?.[pkg.tier + '_removed'] === true;
        const trimmedLink = buttonLink?.trim() || '';
        const hasValidLink = trimmedLink !== '';
        const showCTA = hasValidLink && !isRemoved;
        const finalLink = hasValidLink ? (
          trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://') 
            ? trimmedLink 
            : `https://${trimmedLink}`
        ) : null;

        if (pkg.isCustomOffer) {
          return (
            <motion.div
              key={index}
              {...getPreviewMotionProps(index)}
              className={`relative rounded-3xl text-white shadow-2xl flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 ${previewPackages.length === 4 ? 'p-4' : 'p-6'}`}
            >
              <div className={`flex-grow flex flex-col items-center justify-center ${previewPackages.length === 4 ? 'py-6' : 'py-12'}`}>
                <div className="text-center mb-4">
                  <div 
                    className={`inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold shadow-md mb-3 ${previewPackages.length === 4 ? 'text-base' : 'text-2xl'}`}
                  >
                    {pkg.name}
                  </div>
                  <h3 className={`font-bold text-white mb-2 ${previewPackages.length === 4 ? 'text-lg' : 'text-3xl'}`}>
                    {config.package_descriptions?.[modeKey]?.[pkg.tier] || 'Need Something Different?'}
                  </h3>
                  <p className={`text-white/80 mb-4 mx-auto ${previewPackages.length === 4 ? 'text-xs max-w-[180px]' : 'text-base max-w-xs'}`}>
                    {config.package_descriptions?.[modeKey]?.[pkg.tier + '_subtitle'] || "Let's create a custom package tailored specifically to your needs"}
                  </p>
                </div>
                {showCTA && (
                <a
                  href={finalLink || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full font-semibold rounded-full bg-white text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-all ${previewPackages.length === 4 ? 'h-10 text-sm' : 'h-12'}`}
                  style={{ textDecoration: 'none' }}
                  onClick={(e) => {
                    if (!finalLink) {
                      e.preventDefault();
                    }
                    const currentMode = getCurrentModeKey();
                    const uniqueTierKey = `${pkg.tier}_${currentMode}`;
                    const tierLabel = pkg.name || pkg.tier;
                    const modeLabel = pricingMode === 'one-time' ? (config.pricing_label_onetime || 'One-Time') : (config.pricing_label_retainer || 'Monthly');
                    console.log('CLICK DEBUG:', { tier: pkg.tier, tierLabel, modeLabel, packageId });
                    const packageIdForClick = packageId;
                    const doClick = (viewId) => { if (viewId) logButtonClick(viewId, uniqueTierKey, tierLabel, modeLabel, packageIdForClick); };
                    if (window.__analyticsViewId) { doClick(window.__analyticsViewId); }
                    else if (window.__analyticsPending) { window.__analyticsPending.then(doClick); }
                  }}
                >
                  {config.button_links?.[modeKey]?.[pkg.tier + '_label'] || "Get Custom Offer"}
                </a>
                )}
              </div>
            </motion.div>
          );
        }

        return (
        <motion.div
          key={index}
          {...getPreviewMotionProps(index)}
          className={`relative rounded-3xl text-white shadow-2xl flex flex-col ${
            pkg.popular
              ? ''
              : 'bg-gradient-to-br from-gray-800 to-gray-900'
          } ${previewPackages.length === 4 ? 'p-4' : 'p-6'}`}
          style={pkg.popular ? { background: `linear-gradient(to bottom right, ${brandColor}, ${darkerBrandColor})` } : {}}
        >
          {pkg.popular && (
            <div className={`absolute -top-2 right-3 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold shadow-lg ${previewPackages.length === 4 ? 'w-12 h-12 text-[10px]' : 'w-16 h-16 text-xs'}`}>
              <span className="text-center leading-tight">{popularBadgeText}</span>
            </div>
          )}

          <div className="flex-grow flex flex-col">
              <div className="text-center mb-3">
                <div className={`inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold shadow-md ${previewPackages.length === 4 ? 'text-sm' : 'text-lg'}`}>
                  {pkg.name}
                </div>
              </div>

              <div className="mb-4">
                {hasAnyOriginalPrice && (
                  <div className="h-7 flex items-center justify-center mb-1">
                    {config[`original_price_${pkg.tier}${pricingMode === 'one-time' ? '' : '_retainer'}`] > 0 && (
                      <span className="text-lg text-white/50 line-through">
                        {currencySymbol}{config[`original_price_${pkg.tier}${pricingMode === 'one-time' ? '' : '_retainer'}`].toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
                <div>
                  <div className="flex items-baseline gap-1 justify-center">
                    <div className={`font-bold ${previewPackages.length === 4 ? 'text-xl' : 'text-3xl'}`}>{currencySymbol}{(pkg.price || 0).toLocaleString()}</div>
                    <span className={`text-white/70 ${previewPackages.length === 4 ? 'text-xs' : 'text-base'}`}>
                      / {pricingMode === 'one-time' ? (config.pricing_label_onetime || 'one-time') : (config.pricing_label_retainer || 'monthly')}
                    </span>
                  </div>
                  {pricingMode === 'retainer' && retainerDiscountText?.trim() && (
                    <p className="text-xs text-white/70 text-center mt-1">{retainerDiscountText}</p>
                  )}
                </div>
              </div>
              {pricingMode === 'one-time' && (
                <p className={`text-white font-bold mb-4 text-center ${previewPackages.length === 4 ? 'text-base' : 'text-2xl'}`}>
                  {pkg.duration ? pkg.duration : '2-4 weeks to delivery'}
                </p>
              )}

              <div
                className={`rounded-xl mb-4 overflow-hidden ${
                  previewPackages.length === 4 ? 'p-2' : 'p-4'
                }`}
                style={{ height: `${descHeight}px`, minHeight: `${descHeight}px`, backgroundColor: pkg.description != null ? 'rgba(255, 255, 255, 0.15)' : 'transparent' }}
              >
                {pkg.description != null && (
                  <p
                    className={`text-white ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {pkg.description}
                  </p>
                )}
              </div>

              <div className={`mb-4 ${previewPackages.length === 4 ? 'space-y-1' : 'space-y-2'}`}>
                <p className={`font-semibold text-white/70 uppercase ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>Deliverables</p>
                <div style={{ height: `${deliverablesHeight}px`, minHeight: `${deliverablesHeight}px`, overflowY: 'auto' }} className={previewPackages.length === 4 ? 'space-y-1' : 'space-y-2'}>
                  {deliverableTemplate.map((templateDeliverable, i) => {
                    const deliverable = pkg.deliverables[i];
                    const isIncluded = i < pkg.deliverables.length;
                    const label = showExcludedDeliverables
                      ? (typeof (deliverable || templateDeliverable) === 'string'
                          ? (deliverable || templateDeliverable)
                          : (deliverable || templateDeliverable)?.type || '')
                      : (isIncluded ? (typeof deliverable === 'string' ? deliverable : deliverable?.type || '') : '');

                    if (!isIncluded && !showExcludedDeliverables) {
                      return <div key={i} className={`flex items-start gap-1.5 ${previewPackages.length === 4 ? 'min-h-[24px]' : 'min-h-[28px]'}`} aria-hidden />;
                    }

                    return (
                      <div key={i} className="flex items-start gap-1.5">
                        {isIncluded ? (
                          <Check className={`flex-shrink-0 mt-0.5 text-white ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                        ) : (
                          <X className={`flex-shrink-0 mt-0.5 text-white/30 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                        )}
                        <span className={`${isIncluded ? 'text-white' : 'text-white/40'} ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            {(maxBonuses > 0 || pkg.bonuses.length > 0) && (
              <div className={`pt-4 border-t border-white/20 mb-10 ${previewPackages.length === 4 ? 'space-y-1' : 'space-y-2'}`}>
                <p className={`font-bold uppercase tracking-wider ${previewPackages.length === 4 ? 'text-[10px]' : 'text-xs'}`}>Bonuses</p>
                <div style={{ height: `${bonusesHeight}px`, minHeight: `${bonusesHeight}px`, overflowY: 'auto' }} className={previewPackages.length === 4 ? 'space-y-1' : 'space-y-2'}>
                  {Array.from({ length: maxBonuses }, (_, i) => {
                    const bonus = pkg.bonuses[i];
                    const hasBonus = i < pkg.bonuses.length;
                    const bonusLabel = hasBonus ? bonus : (previewPackages.find(p => !p.isCustomOffer && p.bonuses[i])?.bonuses[i] || '');
                    if (!hasBonus && !showExcludedDeliverables) {
                      return <div key={i} className={`flex items-start gap-1.5 ${previewPackages.length === 4 ? 'min-h-[24px]' : 'min-h-[28px]'}`} aria-hidden />;
                    }
                    return (
                      <div key={i} className="flex items-start gap-1.5">
                        {hasBonus ? (
                          <Plus className={`flex-shrink-0 mt-0.5 text-yellow-400 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                        ) : (
                          <X className={`flex-shrink-0 mt-0.5 text-white/30 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                        )}
                        <span className={`${hasBonus ? 'text-white' : 'text-white/40'} ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>{bonusLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {showCTA && (
          <a
            href={finalLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full font-semibold rounded-full bg-white text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-all ${previewPackages.length === 4 ? 'h-10 text-sm' : 'h-12'}`}
            style={{ textDecoration: 'none' }}
            onClick={(e) => {
              if (!finalLink) {
                e.preventDefault();
              }
              const currentMode = getCurrentModeKey();
              const uniqueTierKey = `${pkg.tier}_${currentMode}`;
              const tierLabel = pkg.name || pkg.tier;
              const modeLabel = pricingMode === 'one-time' ? (config.pricing_label_onetime || 'One-Time') : (config.pricing_label_retainer || 'Monthly');
              console.log('CLICK DEBUG:', { tier: pkg.tier, tierLabel, modeLabel, packageId });
              const packageIdForClick = packageId;
              const doClick = (viewId) => { if (viewId) logButtonClick(viewId, uniqueTierKey, tierLabel, modeLabel, packageIdForClick); };
                    if (window.__analyticsViewId) { doClick(window.__analyticsViewId); }
                    else if (window.__analyticsPending) { window.__analyticsPending.then(doClick); }
            }}
          >
            {config.button_links?.[modeKey]?.[pkg.tier + '_label'] || 'Lock Your Spot'}
          </a>
          )}
        </motion.div>
        );
      })}
    </div>
    );
  };

  const designs = [renderDesign1, renderDesign2];
  const previewDesigns = [renderPreviewDesign1, renderPreviewDesign2];
  const safeDesignIndex = (Number.isFinite(currentDesign) && currentDesign >= 0 && currentDesign < designs.length) ? currentDesign : 0;

  const renderCurrentDesign = () => {
    const fn = designs[safeDesignIndex];
    if (typeof fn === 'function') return fn();
    return designs[0]();
  };

  const renderCurrentPreviewDesign = () => {
    const fn = previewDesigns[safeDesignIndex];
    if (typeof fn === 'function') return fn();
    return previewDesigns[0]();
  };

  const persistWizardDraft = () => {
    const latestConfig = configRef.current || config;
    localStorage.setItem('packageConfig', JSON.stringify(latestConfig));
    localStorage.setItem('editingFromResults', 'true');
    if (packageId) {
      localStorage.setItem('editingPackageId', packageId);
    }
  };

  const exitEditMode = async ({ saveBeforeExit }) => {
    const pendingUrl = pendingNavigationRef.current || createPageUrl('PackageBuilder');
    const isWizardExit = (() => {
      const destination = new URL(pendingUrl, window.location.href);
      const wizard = new URL(createPageUrl('PackageBuilder'), window.location.href);
      return destination.origin === wizard.origin && destination.pathname === wizard.pathname;
    })();

    setShowExitEditModeModal(false);
    pendingNavigationRef.current = null;

    if (saveBeforeExit) {
      try {
        if (isWizardExit) {
          persistWizardDraft();
        }
        await silentSave();
      } catch (error) {
        console.error('Failed to save before exiting:', error);
        alert('Failed to save changes before exiting.');
        return;
      }
    }

    bypassExitWarningRef.current = true;
    window.location.href = pendingUrl;
  };

  const LAUNCHBOX_LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e6df240580e3bf55058574/655c15688_LaunchBoxlogo_E3copy.png';

  if (isPreviewMode) {
    return (
      <div className="min-h-screen py-6 md:py-12 relative" style={{ backgroundColor: '#F5F5F7' }}>
        {/* Export loading overlay */}
        {(exporting || exportingPdf) && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md">
            <div className="flex flex-col items-center gap-6">
              <img
                src={LAUNCHBOX_LOGO_URL}
                alt="LaunchBox"
                className="h-16 w-auto object-contain"
              />
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-600 animate-dots-blink" />
                <span className="w-2 h-2 rounded-full bg-gray-600 animate-dots-blink-2" />
                <span className="w-2 h-2 rounded-full bg-gray-600 animate-dots-blink-3" />
              </div>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div ref={exportRef}>
          <div className="text-center">
            {config.logo_url && (
              <img 
                src={config.logo_url} 
                alt="Logo" 
                className="w-auto mx-auto object-contain"
                style={{ height: `${config.logo_height || 80}px` }}
              />
            )}
            <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 text-gray-900 px-2">
              {config.headline || 'Simple, transparent pricing'}
            </h1>
            <p className="text-base md:text-xl text-gray-600 px-2">
              {config.sub_headline || 'No surprise fees.'}
            </p>
          </div>

          {(config.pricing_availability === 'both') && (
            <div className="flex justify-center mb-8 md:mb-12 mt-8 md:mt-12">
              <div className="inline-flex rounded-full bg-white p-1 md:p-1.5 shadow-lg border border-gray-200">
                <button
                  onClick={() => setPricingMode('one-time')}
                  className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full font-semibold text-xs md:text-sm transition-all ${
                    pricingMode === 'one-time' ? 'text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={pricingMode === 'one-time' ? { background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` } : {}}
                >
                  {config.pricing_button_label_onetime || 'One-time Project'}
                </button>
                <button
                  onClick={() => setPricingMode('retainer')}
                  className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full font-semibold text-xs md:text-sm transition-all ${
                    pricingMode === 'retainer' ? 'text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={pricingMode === 'retainer' ? { background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` } : {}}
                >
                  {config.pricing_button_label_retainer || 'Monthly Retainer'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 md:mt-12">
            {renderCurrentPreviewDesign()}
          </div>

          <div className="text-center space-y-4 mt-8 md:mt-12">
            {config.guarantee && (
              <div className="bg-white rounded-xl p-4 shadow-md max-w-3xl mx-auto border-2 border-gray-200">
                <p className="text-base text-gray-900">
                  <span className="font-semibold" style={{ color: brandColor }}>Guarantee:</span> {config.guarantee}
                </p>
              </div>
            )}
            {config.urgency && (
              <p className="text-sm text-gray-700 italic">{config.urgency}</p>
            )}
          </div>
          </div>
        </div>
      </div>
    );
  }

  const COLOR_PRESETS = [
    { name: 'Red', color: '#ff0044' },
    { name: 'Blue', color: '#3B82F6' },
    { name: 'Purple', color: '#A855F7' },
    { name: 'Green', color: '#10B981' },
    { name: 'Orange', color: '#F59E0B' },
    { name: 'Pink', color: '#F472B6' },
    { name: 'Teal', color: '#14B8A6' },
    { name: 'Indigo', color: '#6366F1' }
  ];

  const downloadAsPdf = async (orientation = 'portrait') => {
    if (!exportRef?.current) return;

    const safeName = (config?.package_set_name || config?.business_name || 'package')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const originalPreviewMode = isPreviewMode;

    setExportingPdf(true);
    try {
      // Match PNG export behavior exactly by capturing preview-mode UI.
      if (!originalPreviewMode) {
        setIsPreviewMode(true);
        await wait(300);
      }

      const imgData = await toPng(exportRef.current, { pixelRatio: 2 });
      const [{ jsPDF }] = await Promise.all([import('jspdf')]);

      const image = new Image();
      const imageLoaded = new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      image.src = imgData;
      await imageLoaded;

      const pdfOrientation = orientation === 'landscape' ? 'l' : 'p';
      const pdf = new jsPDF(pdfOrientation, 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidthMm = pageWidth - margin * 2;
      const contentHeightMm = pageHeight - margin * 2;

      if (orientation === 'landscape') {
        // Always keep landscape export on a single page without cropping.
        const scale = Math.min(contentWidthMm / image.width, contentHeightMm / image.height);
        const renderWidth = image.width * scale;
        const renderHeight = image.height * scale;
        const x = margin + (contentWidthMm - renderWidth) / 2;
        const y = margin + (contentHeightMm - renderHeight) / 2;
        pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
        pdf.save(`${safeName}_${orientation}.pdf`);
        return;
      }

      const fullRenderHeightMm = (image.height * contentWidthMm) / image.width;

      // If it fits on one page, render once with original proportions.
      if (fullRenderHeightMm <= contentHeightMm) {
        const y = margin + (contentHeightMm - fullRenderHeightMm) / 2;
        pdf.addImage(imgData, 'PNG', margin, y, contentWidthMm, fullRenderHeightMm);
      } else {
        // Slice into multiple pages instead of squeezing vertically.
        const pxPerMm = image.width / contentWidthMm;
        const pageSliceHeightPx = Math.floor(contentHeightMm * pxPerMm);
        let renderedHeightPx = 0;
        let pageIndex = 0;

        while (renderedHeightPx < image.height) {
          const remainingPx = image.height - renderedHeightPx;
          const sliceHeightPx = Math.min(pageSliceHeightPx, remainingPx);

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = image.width;
          sliceCanvas.height = sliceHeightPx;
          const sliceCtx = sliceCanvas.getContext('2d');

          if (!sliceCtx) break;

          sliceCtx.drawImage(
            image,
            0,
            renderedHeightPx,
            image.width,
            sliceHeightPx,
            0,
            0,
            image.width,
            sliceHeightPx
          );

          const sliceData = sliceCanvas.toDataURL('image/png');
          const sliceHeightMm = sliceHeightPx / pxPerMm;

          if (pageIndex > 0) {
            pdf.addPage();
          }

          pdf.addImage(sliceData, 'PNG', margin, margin, contentWidthMm, sliceHeightMm);
          renderedHeightPx += sliceHeightPx;
          pageIndex += 1;
        }
      }

      pdf.save(`${safeName}_${orientation}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF.');
    } finally {
      setIsPreviewMode(originalPreviewMode);
      setExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen py-12 relative" style={{ backgroundColor: '#F5F5F7' }}>
      {/* Export loading overlay */}
      {(exporting || exportingPdf) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6">
            <img
              src={LAUNCHBOX_LOGO_URL}
              alt="LaunchBox"
              className="h-16 w-auto object-contain"
            />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-600 animate-dots-blink" />
              <span className="w-2 h-2 rounded-full bg-gray-600 animate-dots-blink-2" />
              <span className="w-2 h-2 rounded-full bg-gray-600 animate-dots-blink-3" />
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          {config?.from_template && (
            <Button
              onClick={() => {
                pendingNavigationRef.current = createPageUrl('Templates');
                setShowExitEditModeModal(true);
              }}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 hover:bg-white rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          )}
          <Button
            onClick={() => {
              pendingNavigationRef.current = null;
              setShowExitEditModeModal(true);
            }}
            variant="outline"
            className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wizard
          </Button>
          <Button
            onClick={handleUndo}
            disabled={!canUndo}
            variant="outline"
            className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4 mr-2" />
            Undo
          </Button>
          {/* Hidden for launch — folder system parked
          {!isPreviewMode && packageId && profileUser?.id && (
            <AssignFolderMenu
              packageId={packageId}
              userId={profileUser.id}
              initialFolderId={config?.folder_id}
              onFolderChange={(fid) => {
                setConfig((c) => (c ? { ...c, folder_id: fid } : c));
              }}
            />
          )}
          */}
        </div>

        <div className="text-center">
          {config.logo_url && (
            <img 
              src={config.logo_url} 
              alt="Logo" 
              className="w-auto mx-auto object-contain"
              style={{ height: `${config.logo_height || 80}px` }}
            />
          )}
          <h1 className="text-4xl font-bold mb-3 text-gray-900">
            <EditableText
              value={config.headline}
              onSave={(newValue) => updateConfig('headline', newValue)}
              className="inline"
              placeholder="Simple, transparent pricing"
              brandColor={brandColor}
            />
          </h1>
          <p className="text-xl text-gray-600">
            <EditableText
              value={config.sub_headline}
              onSave={(newValue) => updateConfig('sub_headline', newValue)}
              className="inline"
              placeholder="No surprise fees."
              brandColor={brandColor}
            />
          </p>
        </div>

        {/* Logo, Brand Color & Currency Settings */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-8 max-w-2xl mx-auto mt-6">
          {/* Logo Upload Section */}
          <div className="pb-4 border-b border-gray-100 mb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-gray-700">Logo</span>
                <div className="flex items-center gap-3">
                  {config.logo_url && (
                    <img 
                      src={config.logo_url} 
                      alt="Logo" 
                      className="w-auto object-contain"
                      style={{ height: `${config.logo_height || 80}px` }}
                    />
                  )}
                  <label className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingLogo}
                      className="cursor-pointer"
                      onClick={(e) => e.currentTarget.previousElementSibling.click()}
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>{config.logo_url ? 'Change Logo' : 'Upload Logo'}</>
                      )}
                    </Button>
                  </label>
                  {config.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateConfig('logo_url', '')}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              {config.logo_url && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">Size</span>
                  <input
                    type="range"
                    min="100"
                    max="250"
                    value={config.logo_height || 80}
                    onChange={(e) => updateConfig('logo_height', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      accentColor: brandColor
                    }}
                  />
                  <span className="text-xs text-gray-500 w-12">{config.logo_height || 80}px</span>
                </div>
              )}
            </div>
          </div>

          {/* Brand Color Section */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">Brand Color</span>
              <div className="flex gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => updateConfig('brand_color', preset.color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                      config.brand_color === preset.color ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-900' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={config.brand_color || '#ff0044'}
                onChange={(e) => updateConfig('brand_color', e.target.value)}
                className="w-10 h-8 cursor-pointer border-gray-200 p-0"
              />
              <Input
                type="text"
                value={config.brand_color || '#ff0044'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.startsWith('#') && /^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                    updateConfig('brand_color', value);
                  }
                }}
                placeholder="#FF0044"
                className="w-24 h-8 font-mono text-xs"
              />
            </div>
          </div>

          {/* Currency Section */}
          <div className="pt-4 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-gray-700">Currency</span>
              <div className="flex gap-2">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => updateConfig('currency', currency.code)}
                    className={`px-3 py-1.5 rounded-lg border-2 transition-all hover:scale-105 ${
                      (config.currency || 'USD') === currency.code
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="text-lg leading-none">{currency.symbol}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Availability Section */}
          <div className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-gray-700">Show Pricing For</span>
              <div className="flex gap-2">
                <button
                  onClick={() => updateConfig('pricing_availability', 'both')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    (config.pricing_availability || 'both') === 'both'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  Both
                </button>
                <button
                  onClick={() => updateConfig('pricing_availability', 'onetime')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    config.pricing_availability === 'onetime'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  One-time Only
                </button>
                <button
                  onClick={() => updateConfig('pricing_availability', 'retainer')}
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    config.pricing_availability === 'retainer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  Retainer Only
                </button>
              </div>
            </div>
          </div>
          <div className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-gray-700">Show Excluded Items</span>
              <button
                type="button"
                role="switch"
                aria-checked={showExcludedDeliverables}
                onClick={() => updateConfig('show_excluded_deliverables', !showExcludedDeliverables)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  showExcludedDeliverables ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                title={showExcludedDeliverables ? 'On' : 'Off'}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    showExcludedDeliverables ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            onClick={prevDesign}
            variant="outline"
            size="icon"
            className="rounded-full bg-white hover:bg-gray-100 border-2 border-gray-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            {[0, 1].map((idx) => (
              <button
                key={idx}
                onClick={() => setCurrentDesign(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentDesign === idx ? 'w-8' : 'bg-gray-300'
                }`}
                style={currentDesign === idx ? { backgroundColor: brandColor } : {}}
              />
            ))}
          </div>

          <Button
            onClick={nextDesign}
            variant="outline"
            size="icon"
            className="rounded-full bg-white hover:bg-gray-100 border-2 border-gray-300"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-center text-gray-600 mb-8">{currentDesign === 0 ? 'Light Mode' : 'Dark Mode'}</p>

        {(config.pricing_availability === 'both') && (
          <div className="flex justify-center mb-8">
            <div ref={toggleEditRef} className="relative inline-flex rounded-full bg-white p-1.5 shadow-lg border border-gray-200 group/toggle">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (editingToggleLabels) {
                    handleSaveToggleLabels();
                  } else {
                    handleStartEditingToggleLabels();
                  }
                }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 flex items-center justify-center shadow-md hover:shadow-lg transition-all opacity-0 group-hover/toggle:opacity-100 z-10"
                style={{ borderColor: brandColor }}
                title="Edit labels"
              >
                <Edit2 className="w-3 h-3" style={{ color: brandColor }} />
              </button>

              {editingToggleLabels ? (
                <>
                  <div className="px-8 py-3 rounded-full">
                    <Input
                      value={tempLabelOnetime}
                      onChange={(e) => setTempLabelOnetime(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveToggleLabels();
                        if (e.key === 'Escape') setEditingToggleLabels(false);
                      }}
                      className="h-8 text-sm font-semibold text-center"
                      style={{ borderColor: brandColor }}
                      placeholder="One-time Project"
                    />
                  </div>
                  <div className="px-8 py-3 rounded-full">
                    <Input
                      value={tempLabelRetainer}
                      onChange={(e) => setTempLabelRetainer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveToggleLabels();
                        if (e.key === 'Escape') setEditingToggleLabels(false);
                      }}
                      className="h-8 text-sm font-semibold text-center"
                      style={{ borderColor: brandColor }}
                      placeholder="Monthly Retainer"
                    />
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setPricingMode('one-time')}
                    className={`px-8 py-3 rounded-full font-semibold text-sm transition-all ${
                      pricingMode === 'one-time' ? 'text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={pricingMode === 'one-time' ? { background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` } : {}}
                  >
                    {config.pricing_button_label_onetime || 'One-time Project'}
                  </button>
                  <button
                    onClick={() => setPricingMode('retainer')}
                    className={`px-8 py-3 rounded-full font-semibold text-sm transition-all ${
                      pricingMode === 'retainer' ? 'text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={pricingMode === 'retainer' ? { background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` } : {}}
                  >
                    {config.pricing_button_label_retainer || 'Monthly Retainer'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentDesign}-${pricingMode}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-12"
            style={costCalculatorTier ? { pointerEvents: 'none' } : undefined}
          >
            <div ref={exportRef}>{renderCurrentDesign()}</div>

            {packages.length < 4 && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleAddPackage}
                  variant="outline"
                  className="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-2xl px-8 py-6 font-medium"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Another Package
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div
          className="text-center space-y-4 mb-12"
          style={costCalculatorTier ? { pointerEvents: 'none' } : undefined}
        >
          {config.guarantee && (
            <div className="bg-white rounded-xl p-6 shadow-md max-w-3xl mx-auto border-2 border-gray-200 relative group">
              <button
                onClick={() => updateConfig('guarantee', '')}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove guarantee"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-lg text-gray-900">
                <span className="font-semibold" style={{ color: brandColor }}>Guarantee:</span>{' '}
                <EditableText
                  value={config.guarantee}
                  onSave={(newValue) => updateConfig('guarantee', newValue)}
                  className="inline"
                  multiline={true}
                  placeholder="e.g., 30-day money-back guarantee"
                  brandColor={brandColor}
                />
              </p>
            </div>
          )}
          {!config.guarantee && (
            <button
              onClick={() => updateConfig('guarantee', '100% satisfaction guarantee')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Guarantee
            </button>
          )}
          
          {config.urgency && (
            <div className="relative inline-block group">
              <button
                onClick={() => updateConfig('urgency', '')}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Remove urgency message"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-sm text-gray-700 italic">
                <EditableText
                  value={config.urgency}
                  onSave={(newValue) => updateConfig('urgency', newValue)}
                  className="inline"
                  placeholder="e.g., Offer valid until end of month!"
                  brandColor={brandColor}
                />
              </p>
            </div>
          )}
          {!config.urgency && (
            <button
              onClick={() => updateConfig('urgency', 'Limited spots available this month')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Urgency Message
            </button>
          )}
        </div>

        <div className="flex justify-center gap-4 flex-wrap">
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!exporting && !exportingPdf) setShowExportDropdown((prev) => !prev);
              }}
              disabled={exporting || exportingPdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : exportingPdf ? 'Exporting PDF...' : 'Export'}
              {showExportDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showExportDropdown && !exporting && !exportingPdf && (
              <div className="absolute bottom-full mb-2 left-0 z-20 min-w-[180px]">
                <div className="relative">
                  <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
                    <button
                      onClick={async () => {
                        setShowExportDropdown(false);
                        setShowPdfSubmenu(false);
                        await exportPackageAsImages({ exportRef, packageName: config.package_set_name || config.business_name || 'package', config, pricingMode, setExporting, setIsPreviewMode, isPreviewMode, setPricingMode });
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
                    >
                      Image
                    </button>
                    <button
                      onClick={() => setShowPdfSubmenu((prev) => !prev)}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between border-t border-gray-100 rounded-b-xl"
                    >
                      PDF
                      <ChevronRight className={`w-4 h-4 transition-transform ${showPdfSubmenu ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  {showPdfSubmenu && (
                    <div className="absolute left-full top-10 ml-1 bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden z-30 min-w-[120px]">
                      <button
                        onClick={async () => {
                          setShowExportDropdown(false);
                          setShowPdfSubmenu(false);
                          await downloadAsPdf('portrait');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-xl"
                      >
                        Portrait
                      </button>
                      <button
                        onClick={async () => {
                          setShowExportDropdown(false);
                          setShowPdfSubmenu(false);
                          await downloadAsPdf('landscape');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 rounded-b-xl"
                      >
                        Landscape
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            className="h-12 px-8 font-semibold rounded-full bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" style={{ color: brandColor }} />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save & Preview
              </>
            )}
          </Button>
          {packageId && (
            <Button
              onClick={async () => {
                const baseUrl = window.location.origin;
                const currentUser = await supabaseClient.auth.me();
                const previewPath = await getPublicPreviewPath(
                  { ...(configRef.current || config || {}), id: packageId },
                  currentUser
                );
                await navigator.clipboard.writeText(baseUrl + previewPath);
                toast({ title: 'Link copied!' });
                const u = await supabaseClient.auth.me();
                setProfileUser(u);
                /* Hidden for launch — folder system parked
                if (!isPreviewMode && !u?.hide_copy_link_folder_prompt) {
                  setShowCopyLinkFolderPrompt(true);
                }
                */
              }}
              variant="outline"
              className="h-12 px-8 font-semibold rounded-full bg-white border-2 text-blue-600 hover:bg-blue-50"
              style={{ borderColor: `${brandColor}40` }}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          )}
          {packageId && (
            <Button
              onClick={async () => {
                const baseUrl = window.location.origin;
                const currentUser = await supabaseClient.auth.me();
                const previewPath = await getPublicPreviewPath(
                  { ...(configRef.current || config || {}), id: packageId },
                  currentUser
                );
                const previewUrl = new URL(baseUrl + previewPath);
                previewUrl.searchParams.set('embed', 'true');
                const iframeId = `launchbox-embed-${packageId}`;
                const embedCode = `<iframe id="${iframeId}" src="${previewUrl.toString()}" width="100%" style="border:0;border-radius:12px;min-height:800px;" scrolling="no"></iframe>
<script>
(function() {
  var iframe = document.getElementById('${iframeId}');
  if (!iframe) return;
  function onMessage(event) {
    if (!event.data || event.data.type !== 'launchbox:embedHeight') return;
    if (typeof event.data.height !== 'number') return;
    iframe.style.height = Math.max(800, event.data.height) + 'px';
  }
  window.addEventListener('message', onMessage);
})();
</script>`;
                navigator.clipboard.writeText(embedCode);
                alert('Embed code copied to clipboard!');
              }}
              variant="outline"
              className="h-12 px-8 font-semibold rounded-full bg-white border-2 text-purple-600 hover:bg-purple-50"
              style={{ borderColor: `${brandColor}40` }}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Embed Code
            </Button>
          )}
        </div>
      </div>

      {/* Cost Calculator Panel */}
      {!isPreviewMode && costCalculatorTier && packages.find((p) => p.tier === costCalculatorTier) && (
        <CostCalculatorPanel
          isOpen={!!costCalculatorTier}
          onClose={() => setCostCalculatorTier(null)}
          packageName={packages.find((p) => p.tier === costCalculatorTier)?.name || costCalculatorTier}
          packagePrice={packages.find((p) => p.tier === costCalculatorTier)?.price ?? 0}
          currencySymbol={currencySymbol}
          costData={config.cost_data?.[getCurrentModeKey()]?.[costCalculatorTier]}
          onSave={(data) => {
            updateCostData(costCalculatorTier, data);
            setTimeout(() => silentSave(), 500);
          }}
          templateLibrary={costTemplates}
          onApplyTemplate={handleApplyCostTemplate}
          onApplySuggestedPrice={(newPrice, calculatorData) => {
            const tierName = costCalculatorTier;
            const modeKey = getCurrentModeKey();
            const c = configRef.current || config;
            const existingCostData = (c.cost_data && typeof c.cost_data === 'object') ? c.cost_data : {};
            const modeData = (existingCostData[modeKey] && typeof existingCostData[modeKey] === 'object') ? existingCostData[modeKey] : {};
            const updates = {
              cost_data: { ...existingCostData, [modeKey]: { ...modeData, [tierName]: calculatorData } }
            };
            if (pricingMode === 'one-time') {
              const retainerPrice = roundToNearest50IfNeeded(Math.round(newPrice * 0.85));
              updates[`price_${tierName}`] = newPrice;
              updates[`price_${tierName}_retainer`] = retainerPrice;
            } else {
              updates[`price_${tierName}_retainer`] = newPrice;
            }
            updateConfigMultiple(updates);
            setTimeout(() => silentSave(), 500);
          }}
          onSaveAsTemplate={async (costBody) => {
            const name = costBody?._templateName;
            const overwriteId = costBody?._overwriteId;
            if (!name?.trim() && !overwriteId) return;
            const { _templateName, _overwriteId, ...body } = costBody;
            try {
              if (overwriteId) {
                await supabaseClient.entities.CostCalculatorTemplate.update(overwriteId, {
                  body,
                  currency: config?.currency || 'USD',
                  updated_at: new Date().toISOString(),
                });
              } else {
                await supabaseClient.entities.CostCalculatorTemplate.create({
                  name: name.trim(),
                  body,
                  linked_package_id: null,
                  currency: config?.currency || 'USD',
                });
              }
              const list = await supabaseClient.entities.CostCalculatorTemplate.filter({ created_by: profileUser?.id }, '-created_at');
              setCostTemplates((list || []).map((t) => ({ id: t.id, name: t.name })));
            } catch (e) {
              console.error('Save as template:', e);
            }
          }}
          onDeleteTemplate={async (templateId) => {
            try {
              await supabaseClient.entities.CostCalculatorTemplate.delete(templateId);
              const list = await supabaseClient.entities.CostCalculatorTemplate.filter({ created_by: profileUser?.id }, '-created_at');
              setCostTemplates((list || []).map((t) => ({ id: t.id, name: t.name })));
            } catch (e) {
              console.error('Delete template:', e);
            }
          }}
          onRenameTemplate={async (templateId, newName) => {
            try {
              await supabaseClient.entities.CostCalculatorTemplate.update(templateId, { name: newName, updated_at: new Date().toISOString() });
              const list = await supabaseClient.entities.CostCalculatorTemplate.filter({ created_by: profileUser?.id }, '-created_at');
              setCostTemplates((list || []).map((t) => ({ id: t.id, name: t.name })));
            } catch (e) {
              console.error('Rename template:', e);
            }
          }}
          isMobile={isMobileView}
          tiers={packages.filter((p) => !p.isCustomOffer).map((p) => ({ tier: p.tier, name: p.name, price: p.price }))}
          currentTier={costCalculatorTier}
          onTierChange={setCostCalculatorTier}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowDeleteModal(false);
              setPackageToDelete(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: '#FEE2E2' }}
                >
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Package?</h3>
                <p className="text-gray-600 leading-relaxed">
                  Are you sure you want to delete this package? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPackageToDelete(null);
                  }}
                  variant="outline"
                  className="flex-1 h-12 rounded-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeletePackage}
                  className="flex-1 h-12 rounded-full text-white font-semibold shadow-lg hover:shadow-xl bg-red-500 hover:bg-red-600"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Edit Mode Warning Modal */}
      <AnimatePresence>
        {showExitEditModeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowExitEditModeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: '#FEF3C7' }}
                >
                  <X className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Exit Edit Mode?</h3>
                <p className="text-gray-600 leading-relaxed">
                  You are about to leave this page. Any unsaved edits may be lost.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-2xl border-2 border-gray-300 hover:bg-gray-50 font-semibold"
                  onClick={() => exitEditMode({ saveBeforeExit: false })}
                >
                  Exit Without Save
                </Button>
                <Button
                  className="flex-1 h-12 rounded-2xl text-white font-semibold"
                  style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                  onClick={() => exitEditMode({ saveBeforeExit: true })}
                >
                  Save and Exit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template merge fields (after creating a contract from a template with blank merge fields) */}
      <AnimatePresence>
        {templateMergeFieldsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => !savingTemplateMerge && setTemplateMergeFieldsModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="px-8 pt-8 pb-4 text-center shrink-0"
                style={{
                  background: `linear-gradient(180deg, ${brandColor}12 0%, transparent 55%)`,
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: `${brandColor}18` }}
                >
                  <Sparkles className="w-8 h-8" style={{ color: brandColor }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">This template has blank fields</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Complete the required fields below before you send the link to your client. Date is optional; if left blank, today&apos;s date will be used.
                </p>
              </div>
              <div className="px-8 pb-6 overflow-y-auto flex-1 min-h-0 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Contract name <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <Input
                    value={templateMergeFieldsModal.contractNameDraft}
                    onChange={(e) => updateTemplateMergeContractName(e.target.value)}
                    placeholder="e.g. Agreemental Contract - Growth for Lucia"
                    className="h-11 rounded-xl border-gray-200"
                    disabled={savingTemplateMerge}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Leave blank to auto-name as client, package, bundle, and today&apos;s date.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fill in required fields</p>
                  <div className="space-y-3">
                    {templateMergeFieldsModal.unfilledFields.map((f) => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-800 mb-1">
                          {f.label}
                          <span className="text-gray-400 font-mono text-xs font-normal ml-1.5">{`{${f.key}}`}</span>
                          {(templateMergeFieldsModal.optionalFieldKeys || []).includes(f.key) ? (
                            <span className="text-gray-400 text-xs font-normal ml-1.5">(optional)</span>
                          ) : (
                            <span className="text-rose-500 text-xs font-medium ml-1.5">(required)</span>
                          )}
                        </label>
                        <Input
                          value={templateMergeFieldsModal.draftValues[f.key] ?? ''}
                          onChange={(e) => updateTemplateMergeFieldDraft(f.key, e.target.value)}
                          placeholder={`Enter ${f.label.toLowerCase()}`}
                          className="h-11 rounded-xl border-gray-200"
                          disabled={savingTemplateMerge}
                        />
                        {(templateMergeFieldsModal.optionalFieldKeys || []).includes(f.key) && (
                          <p className="text-xs text-gray-400 mt-1">
                            Leave blank to use today&apos;s date automatically.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 rounded-2xl border-gray-200 font-semibold"
                    onClick={() => setTemplateMergeFieldsModal(null)}
                    disabled={savingTemplateMerge}
                  >
                    I&apos;ll do it later
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 h-12 rounded-2xl text-white font-semibold shadow-md disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                    onClick={saveTemplateMergeFieldsModal}
                    disabled={
                      savingTemplateMerge
                      || !(templateMergeFieldsModal.requiredFieldKeys || []).every((key) =>
                        String(templateMergeFieldsModal.draftValues[key] ?? '').trim()
                      )
                    }
                  >
                    {savingTemplateMerge ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        Saving…
                      </>
                    ) : (
                      'Save and Preview'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template contract preview modal (shown right after save) */}
      <AnimatePresence>
        {templateContractPreviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
            onClick={() => setTemplateContractPreviewModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', duration: 0.35 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[82vh] border border-gray-100 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">Contract Preview</h3>
                  <p className="text-xs text-gray-500 truncate">{templateContractPreviewModal.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!!templateContractPreviewModal.contractUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl border-gray-200"
                      onClick={() => {
                        window.open(templateContractPreviewModal.contractUrl, '_blank');
                      }}
                    >
                      Open Full Preview
                    </Button>
                  )}
                  <Button
                    type="button"
                    className="h-9 rounded-xl text-white"
                    style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                    onClick={() => setTemplateContractPreviewModal(null)}
                  >
                    Looks Good
                  </Button>
                </div>
              </div>
              {templateContractPreviewModal.showDisclaimer !== false && (
                <div className="px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 via-amber-50/70 to-orange-50/60">
                  <div className="rounded-2xl border border-amber-200/80 bg-white/70 backdrop-blur-sm p-3.5 flex items-start gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-amber-900">Before you share</p>
                      <p className="text-xs text-amber-900/90 leading-relaxed mt-1">
                        Template fields are auto-filled, and this is the exact contract your client will receive.
                        You can still edit it in Contracts while it is shared, until the client signs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setTemplateContractPreviewModal((prev) => (prev ? { ...prev, showDisclaimer: false } : null))
                      }
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-100/70 transition-colors shrink-0"
                      aria-label="Dismiss disclaimer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex-1 bg-gray-50">
                {templateContractPreviewModal.contractUrl ? (
                  <iframe
                    title="Contract Preview"
                    src={templateContractPreviewModal.contractUrl}
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">
                    Preview link is unavailable for this contract.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configure Button Modal - bottom sheet on mobile, centered modal on desktop */}
      {configureModalTier && isMobileView ? (
        <Sheet open={!!configureModalTier} onOpenChange={(open) => !open && closeConfigureModal()}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <SheetHeader className="text-left pb-4">
              <SheetTitle>
                {configureModalStep === 1 ? 'Configure Button' : 'Add Your Link'}
              </SheetTitle>
            </SheetHeader>
            <div className="pb-8">
              {configureModalStep === 1 ? (
                <>
                  <p className="text-gray-600 text-sm mb-4">What should this button do?</p>
                  <div className="space-y-3 mb-6">
                    {BUTTON_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setConfigureModalOption(opt.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 shadow-sm hover:shadow-md ${
                          configureModalOption === opt.id
                            ? 'bg-white'
                            : 'bg-white/80'
                        }`}
                        style={configureModalOption === opt.id ? { boxShadow: `0 0 0 2px ${brandColor}20, 0 8px 24px -16px ${brandColor}80` } : {}}
                      >
                        <span className="text-lg flex-shrink-0">{getCTAOptionEmoji(opt.id)}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-gray-900 block">{opt.label}</span>
                          {opt.hint && (
                            <span className="text-xs text-gray-500 block mt-0.5">({opt.hint})</span>
                          )}
                        </div>
                        {configureModalOption === opt.id && (
                          <Check className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
                        )}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setConfigureModalStep(2)}
                    className="w-full h-12 rounded-full text-white font-semibold"
                    style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                  >
                    Next
                  </Button>
                </>
              ) : configureModalOption === 'sign_contract' ? (
                <>
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Sign Contract</span>
                  </div>
                  <div className="space-y-3 mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setConfigureModalSignSource('launchbox');
                        const keep = (configureModalLink || '').startsWith('template::')
                          ? userContractTemplates.some((t) => `template::${t.id}` === configureModalLink)
                          : (userContracts || []).some((c) => buildContractSignUrl(c.shareable_link) === configureModalLink);
                        const firstTemplateValue = userContractTemplates[0] ? `template::${userContractTemplates[0].id}` : '';
                        const fallback = selectableLaunchBoxContracts[0] ? buildContractSignUrl(selectableLaunchBoxContracts[0].shareable_link) : firstTemplateValue;
                        setConfigureModalLink(keep ? configureModalLink : fallback);
                      }}
                      className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 shadow-sm hover:shadow-md ${configureModalSignSource === 'launchbox' ? 'bg-white' : 'bg-white/80'}`}
                      style={configureModalSignSource === 'launchbox' ? { boxShadow: `0 0 0 2px ${brandColor}20, 0 8px 24px -16px ${brandColor}80` } : {}}
                    >
                      <FileSignature className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
                      <span className="font-medium">Use a LaunchBox contract</span>
                      {configureModalSignSource === 'launchbox' && <Check className="w-5 h-5 flex-shrink-0 ml-auto" style={{ color: brandColor }} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfigureModalSignSource('external'); setConfigureModalLink(configureModalSignSource === 'launchbox' ? '' : configureModalLink); }}
                      className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 shadow-sm hover:shadow-md ${configureModalSignSource === 'external' ? 'bg-white' : 'bg-white/80'}`}
                      style={configureModalSignSource === 'external' ? { boxShadow: `0 0 0 2px ${brandColor}20, 0 8px 24px -16px ${brandColor}80` } : {}}
                    >
                      <LinkIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">Use an external link</span>
                      {configureModalSignSource === 'external' && <Check className="w-5 h-5 flex-shrink-0 ml-auto" style={{ color: brandColor }} />}
                    </button>
                  </div>
                  {configureModalSignSource === 'launchbox' ? (
                    isLoadingUserContracts ? (
                      <div className="mb-4 p-4 rounded-2xl bg-white text-center shadow-sm">
                        <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading contracts...
                        </div>
                      </div>
                    ) : (userContractTemplates.length > 0 || launchboxContractsForDropdown.length > 0) ? (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select contract</label>
                        <Select value={configureModalLink || ''} onValueChange={handleLaunchboxContractSelect}>
                          <SelectTrigger
                            className="w-full h-12 rounded-xl border-0 bg-white px-4 text-base shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-0"
                            style={{ boxShadow: configureModalLink ? `0 0 0 2px ${brandColor}25, 0 10px 30px -18px ${brandColor}80` : undefined }}
                          >
                            <SelectValue placeholder="Choose from templates or contracts…" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-0 shadow-xl">
                            {userContractTemplates.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Use From Templates:</div>
                                {userContractTemplates.map((t) => (
                                  <SelectItem key={`template-${t.id}`} value={`template::${t.id}`}>
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {userContractTemplates.length > 0 && launchboxContractsForDropdown.length > 0 && (
                              <div className="my-1 h-px bg-gray-100" />
                            )}
                            {launchboxContractsForDropdown.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Use From Your Contracts:</div>
                                {launchboxContractsForDropdown.map((c) => {
                                  const url = buildContractSignUrl(c.shareable_link);
                                  if (!url) return null;
                                  const isConnectedSharedContract = linkedLaunchBoxContract?.id === c.id && c.status !== 'draft';
                                  return (
                                    <SelectItem key={c.id} value={url} disabled={isConnectedSharedContract}>
                                      {c.name}{isConnectedSharedContract ? ' (Connected - shared)' : ''}
                                    </SelectItem>
                                  );
                                })}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="mb-4 p-4 rounded-2xl bg-white text-center shadow-sm">
                        <p className="text-sm text-gray-600 mb-3">You don&apos;t have any contracts yet.</p>
                        <Button
                          type="button"
                          onClick={() => { closeConfigureModal(); navigate(createPageUrl('Contracts')); }}
                          className="gap-2 bg-[#ff0044] hover:bg-[#cc0033] text-white"
                        >
                          <Plus className="w-4 h-4" />
                          Create your first contract
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Paste your e-signature link</label>
                      <Input
                        value={configureModalLink}
                        onChange={(e) => setConfigureModalLink(e.target.value)}
                        placeholder="https://docu.sign/… or your signing tool link"
                        className="w-full h-12 text-base rounded-xl border-0 shadow-sm focus:shadow-md"
                        style={{ boxShadow: `0 0 0 2px ${brandColor}20, 0 10px 30px -18px ${brandColor}80` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mb-4">
                    If no link is attached, this button won&apos;t be visible to clients.
                  </p>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white mb-6 shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Apply to all packages</p>
                      <p className="text-xs text-gray-500 mt-0.5">Use this link for every CTA button</p>
                    </div>
                    <Switch checked={configureModalCopyToAll} onCheckedChange={setConfigureModalCopyToAll} />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setConfigureModalStep(1)} className="flex-1 h-12 rounded-full border-0 shadow-sm hover:shadow-md text-gray-700 hover:bg-white font-semibold">Back</Button>
                    <Button onClick={saveConfigureModal} className="flex-1 h-12 rounded-full text-white font-semibold" style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}>Save</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">
                      {configureModalOption === 'custom' ? 'Custom' : (BUTTON_OPTIONS.find(o => o.id === configureModalOption)?.label || 'Lock Your Spot')}
                    </span>
                  </div>
                  {configureModalOption === 'custom' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button name</label>
                      <Input
                        value={configureModalCustomLabel}
                        onChange={(e) => setConfigureModalCustomLabel(e.target.value)}
                        placeholder="Whatever you want :)"
                        className="w-full h-12 text-base rounded-xl"
                        style={{ borderColor: brandColor }}
                        autoFocus
                      />
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {configureModalOption === 'custom' ? 'Link' : 'Paste your link'}
                    </label>
                    <Input
                      value={configureModalLink}
                      onChange={(e) => setConfigureModalLink(e.target.value)}
                      placeholder={BUTTON_OPTIONS.find(o => o.id === configureModalOption)?.placeholder || 'Paste your payment link'}
                      className="w-full h-12 text-base rounded-xl"
                      style={{ borderColor: brandColor }}
                      autoFocus={configureModalOption !== 'custom'}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    If no link is attached, this button won't be visible to clients.
                  </p>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Apply to all packages</p>
                      <p className="text-xs text-gray-500 mt-0.5">Use this link for every CTA button</p>
                    </div>
                    <Switch
                      checked={configureModalCopyToAll}
                      onCheckedChange={setConfigureModalCopyToAll}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setConfigureModalStep(1)}
                      className="flex-1 h-12 rounded-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={saveConfigureModal}
                      className="flex-1 h-12 rounded-full text-white font-semibold"
                      style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                    >
                      Save
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      ) : configureModalTier ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeConfigureModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {configureModalStep === 1 ? 'Configure Button' : 'Add Your Link'}
                </h3>
                <button
                  onClick={closeConfigureModal}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {configureModalStep === 1 ? (
                <>
                  <p className="text-gray-600 text-sm mb-4">What should this button do?</p>
                  <div className="space-y-3 mb-6">
                    {BUTTON_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setConfigureModalOption(opt.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 shadow-sm hover:shadow-md ${
                          configureModalOption === opt.id
                            ? 'bg-white'
                            : 'bg-white/80'
                        }`}
                        style={configureModalOption === opt.id ? { boxShadow: `0 0 0 2px ${brandColor}20, 0 8px 24px -16px ${brandColor}80` } : {}}
                      >
                        <span className="text-lg flex-shrink-0">{getCTAOptionEmoji(opt.id)}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-gray-900 block">{opt.label}</span>
                          {opt.hint && (
                            <span className="text-xs text-gray-500 block mt-0.5">({opt.hint})</span>
                          )}
                        </div>
                        {configureModalOption === opt.id && (
                          <Check className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
                        )}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setConfigureModalStep(2)}
                    className="w-full h-12 rounded-full text-white font-semibold"
                    style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                  >
                    Next
                  </Button>
                </>
              ) : configureModalOption === 'sign_contract' ? (
                <>
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Sign Contract</span>
                  </div>
                  <div className="space-y-3 mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setConfigureModalSignSource('launchbox');
                        const keep = (configureModalLink || '').startsWith('template::')
                          ? userContractTemplates.some((t) => `template::${t.id}` === configureModalLink)
                          : (userContracts || []).some((c) => buildContractSignUrl(c.shareable_link) === configureModalLink);
                        const firstTemplateValue = userContractTemplates[0] ? `template::${userContractTemplates[0].id}` : '';
                        const fallback = selectableLaunchBoxContracts[0] ? buildContractSignUrl(selectableLaunchBoxContracts[0].shareable_link) : firstTemplateValue;
                        setConfigureModalLink(keep ? configureModalLink : fallback);
                      }}
                      className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 shadow-sm hover:shadow-md ${configureModalSignSource === 'launchbox' ? 'bg-white' : 'bg-white/80'}`}
                      style={configureModalSignSource === 'launchbox' ? { boxShadow: `0 0 0 2px ${brandColor}20, 0 8px 24px -16px ${brandColor}80` } : {}}
                    >
                      <FileSignature className="w-5 h-5 flex-shrink-0" style={{ color: brandColor }} />
                      <span className="font-medium">Use a LaunchBox contract</span>
                      {configureModalSignSource === 'launchbox' && <Check className="w-5 h-5 flex-shrink-0 ml-auto" style={{ color: brandColor }} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfigureModalSignSource('external'); setConfigureModalLink(configureModalSignSource === 'launchbox' ? '' : configureModalLink); }}
                      className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-3 shadow-sm hover:shadow-md ${configureModalSignSource === 'external' ? 'bg-white' : 'bg-white/80'}`}
                      style={configureModalSignSource === 'external' ? { boxShadow: `0 0 0 2px ${brandColor}20, 0 8px 24px -16px ${brandColor}80` } : {}}
                    >
                      <LinkIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium">Use an external link</span>
                      {configureModalSignSource === 'external' && <Check className="w-5 h-5 flex-shrink-0 ml-auto" style={{ color: brandColor }} />}
                    </button>
                  </div>
                  {configureModalSignSource === 'launchbox' ? (
                    isLoadingUserContracts ? (
                      <div className="mb-4 p-4 rounded-2xl bg-white text-center shadow-sm">
                        <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading contracts...
                        </div>
                      </div>
                    ) : (userContractTemplates.length > 0 || launchboxContractsForDropdown.length > 0) ? (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select contract</label>
                        <Select value={configureModalLink || ''} onValueChange={handleLaunchboxContractSelect}>
                          <SelectTrigger
                            className="w-full h-12 rounded-xl border-0 bg-white px-4 text-base shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-0"
                            style={{ boxShadow: configureModalLink ? `0 0 0 2px ${brandColor}25, 0 10px 30px -18px ${brandColor}80` : undefined }}
                          >
                            <SelectValue placeholder="Choose from templates or contracts…" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-0 shadow-xl">
                            {userContractTemplates.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Use From Templates:</div>
                                {userContractTemplates.map((t) => (
                                  <SelectItem key={`template-mobile-${t.id}`} value={`template::${t.id}`}>
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            {userContractTemplates.length > 0 && launchboxContractsForDropdown.length > 0 && (
                              <div className="my-1 h-px bg-gray-100" />
                            )}
                            {launchboxContractsForDropdown.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Use From Your Contracts:</div>
                                {launchboxContractsForDropdown.map((c) => {
                                  const url = buildContractSignUrl(c.shareable_link);
                                  if (!url) return null;
                                  const isConnectedSharedContract = linkedLaunchBoxContract?.id === c.id && c.status !== 'draft';
                                  return (
                                    <SelectItem key={c.id} value={url} disabled={isConnectedSharedContract}>
                                      {c.name}{isConnectedSharedContract ? ' (Connected - shared)' : ''}
                                    </SelectItem>
                                  );
                                })}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="mb-4 p-4 rounded-2xl bg-white text-center shadow-sm">
                        <p className="text-sm text-gray-600 mb-3">You don&apos;t have any contracts yet.</p>
                        <Button
                          type="button"
                          onClick={() => { closeConfigureModal(); navigate(createPageUrl('Contracts')); }}
                          className="gap-2 bg-[#ff0044] hover:bg-[#cc0033] text-white"
                        >
                          <Plus className="w-4 h-4" />
                          Create your first contract
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Paste your e-signature link</label>
                      <Input
                        value={configureModalLink}
                        onChange={(e) => setConfigureModalLink(e.target.value)}
                        placeholder="https://docu.sign/… or your signing tool link"
                        className="w-full h-12 text-base rounded-xl border-0 shadow-sm focus:shadow-md"
                        style={{ boxShadow: `0 0 0 2px ${brandColor}20, 0 10px 30px -18px ${brandColor}80` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mb-4">
                    If no link is attached, this button won&apos;t be visible to clients.
                  </p>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white mb-6 shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Apply to all packages</p>
                      <p className="text-xs text-gray-500 mt-0.5">Use this link for every CTA button</p>
                    </div>
                    <Switch checked={configureModalCopyToAll} onCheckedChange={setConfigureModalCopyToAll} />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setConfigureModalStep(1)} className="flex-1 h-12 rounded-full border-0 shadow-sm hover:shadow-md text-gray-700 hover:bg-white font-semibold">Back</Button>
                    <Button onClick={saveConfigureModal} className="flex-1 h-12 rounded-full text-white font-semibold" style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}>Save</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">
                      {configureModalOption === 'custom' ? 'Custom' : (BUTTON_OPTIONS.find(o => o.id === configureModalOption)?.label || 'Lock Your Spot')}
                    </span>
                  </div>
                  {configureModalOption === 'custom' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Button name</label>
                      <Input
                        value={configureModalCustomLabel}
                        onChange={(e) => setConfigureModalCustomLabel(e.target.value)}
                        placeholder="Whatever you want :)"
                        className="w-full h-12 text-base rounded-xl"
                        style={{ borderColor: brandColor }}
                        autoFocus
                      />
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {configureModalOption === 'custom' ? 'Link' : 'Paste your link'}
                    </label>
                    <Input
                      value={configureModalLink}
                      onChange={(e) => setConfigureModalLink(e.target.value)}
                      placeholder={BUTTON_OPTIONS.find(o => o.id === configureModalOption)?.placeholder || 'Paste your payment link'}
                      className="w-full h-12 text-base rounded-xl"
                      style={{ borderColor: brandColor }}
                      autoFocus={configureModalOption !== 'custom'}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    If no link is attached, this button won't be visible to clients.
                  </p>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50/50 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Apply to all packages</p>
                      <p className="text-xs text-gray-500 mt-0.5">Use this link for every CTA button</p>
                    </div>
                    <Switch
                      checked={configureModalCopyToAll}
                      onCheckedChange={setConfigureModalCopyToAll}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setConfigureModalStep(1)}
                      className="flex-1 h-12 rounded-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={saveConfigureModal}
                      className="flex-1 h-12 rounded-full text-white font-semibold"
                      style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                    >
                      Save
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ) : null}

      {/* Custom Links Modal */}
      <AnimatePresence>
        {showLinksModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLinksModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <LinkIcon className="w-8 h-8" style={{ color: brandColor }} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">🤔 Add Button Links?</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your packages look great! Want to add links to your "CTA" buttons?
                </p>
              </div>

              <div 
                className="p-4 rounded-xl mb-6"
                style={{ backgroundColor: `${brandColor}08` }}
              >
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold" style={{ color: brandColor }}>💡 Tip:</span> Adding payment links, calendar booking, or contact forms helps clients take action right away - and can improve your close rates!
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowLinksModal(false);
                    setSaving(true);
                    // Continue with save
                    const continueWithSave = async () => {
                      try {
                        const latestConfig = configRef.current || config;
                        const ensuredPackageNames = {
                          onetime: {
                            starter: latestConfig.package_names?.onetime?.starter || 'Starter',
                            growth: latestConfig.package_names?.onetime?.growth || 'Growth',
                            premium: latestConfig.package_names?.onetime?.premium || 'Premium',
                            elite: latestConfig.package_names?.onetime?.elite || 'Elite'
                          },
                          retainer: {
                            starter: latestConfig.package_names?.retainer?.starter || 'Starter',
                            growth: latestConfig.package_names?.retainer?.growth || 'Growth',
                            premium: latestConfig.package_names?.retainer?.premium || 'Premium',
                            elite: latestConfig.package_names?.retainer?.elite || 'Elite'
                          }
                        };

                        // Ensure popularPackageIndex is an object
                        const safePopularIndex = (typeof popularPackageIndex === 'number' || !popularPackageIndex) 
                          ? { onetime: typeof popularPackageIndex === 'number' ? popularPackageIndex : 2, retainer: typeof popularPackageIndex === 'number' ? popularPackageIndex : 2 }
                          : popularPackageIndex;

                        const { id: _id, created_date: _cd, updated_date: _ud, created_by: _cb, created_by_id: _cbi, entity_name: _en, app_id: _ai, is_sample: _is, is_deleted: _idl, deleted_date: _dd, environment: _env, ...cleanConfig } = latestConfig;
                        const configToSave = {
                          ...cleanConfig,
                          currentDesign,
                          pricingMode,
                          popularPackageIndex: safePopularIndex,
                          popularBadgeText,
                          button_links: latestConfig.button_links || {},
                          package_names: ensuredPackageNames,
                          active_packages: latestConfig.active_packages,
                          price_starter: latestConfig.price_starter,
                          price_growth: latestConfig.price_growth,
                          price_premium: latestConfig.price_premium,
                          price_elite: latestConfig.price_elite,
                          price_starter_retainer: latestConfig.price_starter_retainer,
                          price_growth_retainer: latestConfig.price_growth_retainer,
                          price_premium_retainer: latestConfig.price_premium_retainer,
                          price_elite_retainer: latestConfig.price_elite_retainer
                        };

                        const pendingFolder = takePendingFolderId();
                        if (pendingFolder) {
                          configToSave.folder_id = pendingFolder;
                        }

                        let savedPackageId = packageId;

                        if (packageId) {
                          try {
                            await supabaseClient.entities.PackageConfig.update(packageId, configToSave);
                          } catch (updateError) {
                            console.warn('Update failed, creating new package:', updateError);
                            const newPackage = await supabaseClient.entities.PackageConfig.create(configToSave);
                            savedPackageId = newPackage.id;
                            setPackageId(savedPackageId);
                          }
                        } else {
                          const newPackage = await supabaseClient.entities.PackageConfig.create(configToSave);
                          savedPackageId = newPackage.id;
                          setPackageId(savedPackageId);
                        }

                        localStorage.setItem('packageConfig', JSON.stringify(configToSave));
                        
                        const baseUrl = window.location.origin;
                        const currentUser = await supabaseClient.auth.me();
                        const previewPath = await getPublicPreviewPath(
                          { ...latestConfig, id: savedPackageId },
                          currentUser
                        );
                        const previewUrl = baseUrl + previewPath;
                        window.open(previewUrl, '_blank');
                        
                        bypassExitWarningRef.current = true;
                        window.location.href = createPageUrl('MyPackages');
                      } catch (error) {
                        console.error('Error saving package:', error);
                        alert('Failed to save package.');
                        setSaving(false);
                      }
                    };
                    continueWithSave();
                  }}
                  variant="outline"
                  className="flex-1 h-12 rounded-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                >
                  Publish As Is
                </Button>
                <Button
                  onClick={() => setShowLinksModal(false)}
                  className="flex-1 h-12 rounded-full text-white font-semibold shadow-lg hover:shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                >
                  Add Links
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden for launch — folder system parked
      {!isPreviewMode && (
        <CopyLinkFolderPrompt
          open={showCopyLinkFolderPrompt}
          onOpenChange={(o) => {
            setShowCopyLinkFolderPrompt(o);
            if (!o) {
              supabaseClient.auth.me().then(setProfileUser).catch(() => {});
            }
          }}
          packageId={packageId}
          userId={profileUser?.id}
          onAssigned={async () => {
            if (!packageId) return;
            try {
              const p = await supabaseClient.entities.PackageConfig.get(packageId);
              setConfig((c) => (c ? { ...c, folder_id: p.folder_id } : c));
            } catch (e) {
              console.error(e);
            }
          }}
        />
      )}
      */}

      {/* Fresh-from-wizard preview modal */}
      <AnimatePresence>
        {isFreshReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6"
            onClick={() => setIsFreshReveal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Here's how your packages will look</h2>
                <p className="text-gray-500 text-sm">This is the client view. Let's finalize it to your liking.</p>
              </div>

              {/* Compact preview of packages */}
              <div className="pointer-events-none">
                <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                  {renderCurrentPreviewDesign()}
                </div>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => setIsFreshReveal(false)}
                  className="px-6 py-3 rounded-full text-white font-semibold shadow-lg hover:scale-105 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
                >
                  Customize Your Packages
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}