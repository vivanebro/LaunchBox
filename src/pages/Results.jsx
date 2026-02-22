import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check, ChevronLeft, ChevronRight, Sparkles, Loader2, Edit2, Save, X, ArrowLeft, Link as LinkIcon, GripVertical } from 'lucide-react';
import { createPageUrl } from '@/utils';
import supabaseClient from '@/lib/supabaseClient';
import { logPackageView, startTimeTracking, logButtonClick } from '@/lib/packageAnalytics';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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

export default function Results() {
  const [config, setConfig] = useState(null);
  const [pricingMode, setPricingMode] = useState('one-time');
  const [currentDesign, setCurrentDesign] = useState(1);
  const [saving, setSaving] = useState(false);
  const [popularPackageIndex, setPopularPackageIndex] = useState({ onetime: 2, retainer: 2 });
  const [popularBadgeText, setPopularBadgeText] = useState('Most Popular');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [packageId, setPackageId] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [editingToggleLabels, setEditingToggleLabels] = useState(false);
  const [tempLabelOnetime, setTempLabelOnetime] = useState('');
  const [tempLabelRetainer, setTempLabelRetainer] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const toggleEditRef = useRef(null);

  const brandColor = config?.brand_color || '#ff0044';
  const darkerBrandColor = getDarkerBrandColor(brandColor);
  const currencySymbol = getCurrencySymbol(config?.currency || 'USD');

  useEffect(() => {
    // Load Sour Gummy font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Sour+Gummy:wght@400&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === 'true';
    let idFromUrl = urlParams.get('packageId');
    setIsPreviewMode(isPreview);
    if (isPreview && idFromUrl) {
      window.__analyticsViewId = null;
      window.__analyticsPending = logPackageView(idFromUrl).then(viewId => {
        window.__analyticsViewId = viewId;
        const cleanup = startTimeTracking(viewId);
        window.__analyticsCleanup = cleanup;
        return viewId;
      });
    }
    if (idFromUrl) {
      setPackageId(idFromUrl);
    }

    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const loadPackageConfig = async () => {
      // Set initial pricing mode based on pricing_availability
      let loadedConfig = null;

      if (idFromUrl) {
        try {
          // Try loading with user auth first
          loadedConfig = await supabaseClient.asServiceRole.entities.PackageConfig.get(idFromUrl);
          if (loadedConfig) {
            loadedConfig.id = idFromUrl;
          }
        } catch (error) {
          console.error('Error loading package by ID:', error);
          // If in preview mode and we can't load (e.g. not authenticated), try filter
          if (isPreview) {
            try {
              const results = await supabaseClient.asServiceRole.entities.PackageConfig.filter({ id: idFromUrl });
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
      
      if (!loadedConfig) {
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
        if (loadedConfig.starter_duration === undefined) loadedConfig.starter_duration = null;
        if (loadedConfig.growth_duration === undefined) loadedConfig.growth_duration = null;
        if (loadedConfig.premium_duration === undefined) loadedConfig.premium_duration = null;
        if (loadedConfig.currency === undefined) loadedConfig.currency = 'USD';
        if (loadedConfig.pricing_availability === undefined) loadedConfig.pricing_availability = 'both';
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
            starter_duration: null,
            growth_duration: null,
            premium_duration: null,
            currency: 'USD',
            pricing_availability: 'both',
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
  }, []);

  // Use a ref to always have the latest config available (avoids stale closures)
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const updateConfig = (field, value) => {
    const currentConfig = configRef.current || config;
    const updatedConfig = { ...currentConfig, [field]: value };
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
      const previewUrl = baseUrl + createPageUrl('Results') + `?preview=true&packageId=${savedPackageId}`;
      window.open(previewUrl, '_blank');

      window.location.href = createPageUrl('MyPackages');

    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package: ' + (error?.message || 'Unknown error'));
      setSaving(false);
    }
  };

  const nextDesign = () => {
    setCurrentDesign((prev) => (prev + 1) % 2);
  };

  const prevDesign = () => {
    setCurrentDesign((prev) => (prev - 1 + 2) % 2);
  };

  if (!config) {
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

  const packages = activePackages.map((tier, index) => {
    const tierData = {
      starter: {
        name: config.package_names?.[modeKey]?.starter || 'Starter',
        price: pricingMode === 'one-time' ? config.price_starter : config.price_starter_retainer,
        description: config.package_descriptions?.[modeKey]?.starter || 'For individuals just starting out who need essential features',
        duration: config.package_durations?.[modeKey]?.starter || getDurationForTier('starter')
      },
      growth: {
        name: config.package_names?.[modeKey]?.growth || 'Growth',
        price: pricingMode === 'one-time' ? config.price_growth : config.price_growth_retainer,
        description: config.package_descriptions?.[modeKey]?.growth || 'For growing businesses that want to scale their content',
        duration: config.package_durations?.[modeKey]?.growth || getDurationForTier('growth')
      },
      premium: {
        name: config.package_names?.[modeKey]?.premium || 'Premium',
        price: pricingMode === 'one-time' ? config.price_premium : config.price_premium_retainer,
        description: config.package_descriptions?.[modeKey]?.premium || 'For established brands that need complete solutions',
        duration: config.package_durations?.[modeKey]?.premium || getDurationForTier('premium')
      },
      elite: {
        name: config.package_names?.[modeKey]?.elite || 'Elite',
        price: pricingMode === 'one-time' ? (config.price_elite || 0) : (config.price_elite_retainer || 0),
        description: config.package_descriptions?.[modeKey]?.elite || 'For enterprise clients that need the ultimate solution',
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

    if (currentActive.length <= 2) {
      setShowDeleteModal(false);
      setPackageToDelete(null);
      return;
    }

    const updatedActive = currentActive.filter(t => t !== tierToDelete);

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

    setPopularPackageIndex(updatedPopularIndex);
    updateConfigMultiple({
      active_packages: updatedActivePackages,
      popularPackageIndex: updatedPopularIndex
    });
    
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
    const nextTier = availableTiers.find(t => !currentActive.includes(t));

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

  const EditableText = ({ value, onSave, className, multiline, placeholder, darkMode, brandColor }) => {
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

    if (isEditing) {
      return multiline ? (
        <Textarea
          ref={editRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className={`${className || ''} min-h-[60px] ${darkMode ? 'bg-white text-gray-900 border-gray-300' : ''}`}
          autoFocus
          placeholder={placeholder}
          style={{ borderColor: brandColor }}
        />
      ) : (
        <Input
          ref={editRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className={`${className || ''} ${darkMode ? 'bg-white text-gray-900 border-gray-300' : ''}`}
          autoFocus
          placeholder={placeholder}
          style={{ borderColor: brandColor }}
        />
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
        className={`${className || ''} cursor-pointer group relative min-w-[50px] inline-block rounded px-2 py-1 transition-all`}
        style={{
          backgroundColor: (isEditing || isHovered) ? (darkMode ? 'rgba(255,255,255,0.1)' : `${brandColor}1A`) : undefined,
          outline: (isEditing || isHovered) ? `2px solid ${brandColor}` : undefined,
          outlineOffset: '-1px',
        }}
      >
        {value || <span className="text-gray-400 italic">{placeholder}</span>}
        <Edit2 className={`w-3 h-3 absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 ${darkMode ? 'text-white/70' : ''}`} style={!darkMode ? { color: brandColor } : {}} />
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

  const EditableDeliverableItem = ({ deliverable, onSave, onDelete, darkMode, brandColor, dragHandleProps }) => {
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

  const EditableButton = ({ tier, brandColor, darkerBrandColor, darkMode, customLabel, isCustomOffer }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingLabel, setIsEditingLabel] = useState(false);
    const modeKey = getCurrentModeKey();
    const [linkValue, setLinkValue] = useState(config.button_links?.[modeKey]?.[tier] || '');
    const [labelValue, setLabelValue] = useState(customLabel);
    const inputRef = useRef(null);
    const labelInputRef = useRef(null);

    useEffect(() => {
      setLinkValue(config.button_links?.[modeKey]?.[tier] || '');
      setLabelValue(customLabel);
    }, [config.button_links, tier, modeKey, customLabel]);

    useEffect(() => {
      if (isEditing) {
        const handleClickOutside = (event) => {
          if (inputRef.current && !inputRef.current.contains(event.target)) {
            handleSave();
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isEditing, linkValue]);

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

    const handleSave = () => {
      updateButtonLink(tier, linkValue);
      setIsEditing(false);
    };

    const handleSaveLabel = () => {
      if (isCustomOffer && labelValue.trim()) {
        updateButtonLink(tier + '_label', labelValue.trim());
      }
      setIsEditingLabel(false);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleSave();
      }
      if (e.key === 'Escape') {
        setLinkValue(config.button_links?.[tier] || '');
        setIsEditing(false);
      }
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

    if (isEditing && !isCustomOffer) {
      return (
        <div ref={inputRef} className="space-y-2">
          <Input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com"
            className={`w-full text-sm ${darkMode ? 'bg-white text-gray-900' : ''}`}
            autoFocus
            style={{ borderColor: brandColor }}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="flex-1 text-white"
              style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
            >
              <Save className="w-3 h-3 mr-1" />
              Save Link
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setLinkValue(config.button_links?.[modeKey]?.[tier] || '');
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    const buttonLink = config.button_links?.[modeKey]?.[tier];

    const ensureHttps = (url) => {
      if (!url) return '';
      const trimmed = url.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      return `https://${trimmed}`;
    };

    return (
      <div
        className="relative group/button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Button
          onClick={(e) => e.preventDefault()}
          className={`w-full h-12 font-semibold rounded-full shadow-lg transition-all ${
            darkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'text-white'
          }`}
          style={!darkMode ? { background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` } : {}}
        >
          {customLabel || 'Get Started'}
        </Button>
        {buttonLink && (
          <div className="absolute -bottom-6 left-0 right-0 text-center">
            <span className="text-xs text-gray-400 truncate block px-2" title={ensureHttps(buttonLink)}>
              🔗 {buttonLink}
            </span>
          </div>
        )}
        {isHovered && !isCustomOffer && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-1/2 right-3 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all z-10"
            title="Edit button link"
          >
            <LinkIcon className="w-4 h-4" style={{ color: brandColor }} />
          </button>
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
    // Calculate max deliverables to align bonus sections
    const maxDeliverables = Math.max(...packages.filter(p => !p.isCustomOffer).map(p => p.deliverables.length));
    const deliverablesMinHeight = packages.length === 4 ? maxDeliverables * 28 : maxDeliverables * 32;
    
    return (
    <DragDropContext onDragEnd={handleDragEnd}>
    <div className={`grid gap-6 ${packages.length === 4 ? 'md:grid-cols-4' : packages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
      {packages.map((pkg, index) => {
        const tierName = pkg.tier;
        
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
            {packages.length > 2 && (
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
              <div className={packages.length === 4 ? 'min-h-[520px] flex flex-col' : ''}>
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
                
                <div className="mb-2">
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
                      className={`font-bold inline-block ${packages.length === 4 ? 'text-3xl' : 'text-4xl'}`}
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
                </div>
                {pricingMode === 'one-time' && (
                  <p className={`text-gray-900 font-bold mb-6 text-center ${packages.length === 4 ? 'text-xl' : 'text-2xl'}`}>
                    <EditableText
                      value={pkg.duration || '2-4 weeks to delivery'}
                      onSave={(newValue) => updatePackageDuration(tierName, newValue)}
                      className={`inline font-bold ${packages.length === 4 ? 'text-xl' : 'text-2xl'}`}
                      placeholder="2-4 weeks to delivery"
                      brandColor={brandColor}
                    />
                  </p>
                )}

                <div 
                  className="mb-6 p-4 rounded-xl"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <EditableText
                    value={pkg.description}
                    onSave={(newValue) => updatePackageDescription(tierName, newValue)}
                    className="text-sm text-gray-700"
                    multiline={true}
                    placeholder="Describe who this package is best for"
                    brandColor={brandColor}
                  />
                </div>

                <div className={`space-y-3 mb-6`}>
                  <p className="text-sm font-semibold text-gray-500 uppercase">Deliverables</p>

                  <Droppable droppableId={`deliverables-${tierName}`} type="deliverable">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3" style={{ minHeight: `${deliverablesMinHeight}px` }}>
                       {pkg.deliverables.map((d, idx) => (
                         <Draggable key={`deliv-${tierName}-${idx}`} draggableId={`deliv-${tierName}-${idx}`} index={idx}>
                           {(provided) => (
                             <div ref={provided.innerRef} {...provided.draggableProps}>
                               <EditableDeliverableItem
                                 deliverable={d}
                                 onSave={(newVal) => updateDeliverable(tierName, idx, newVal)}
                                 onDelete={() => deleteDeliverable(tierName, idx)}
                                 darkMode={false}
                                 brandColor={brandColor}
                                 dragHandleProps={provided.dragHandleProps}
                               />
                             </div>
                           )}
                         </Draggable>
                       ))}
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

              <div className="space-y-3 mb-10 pt-6 border-t border-gray-200">
                <p className="text-sm font-semibold text-gray-500 uppercase">Bonuses</p>

                <Droppable droppableId={`bonuses-${tierName}`} type="bonus">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                      {pkg.bonuses.map((bonus, idx) => (
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
                      ))}
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

            <div className="relative">
              <EditableButton
                tier={tierName}
                brandColor={brandColor}
                darkerBrandColor={darkerBrandColor}
                darkMode={false}
              />

              {!isPreviewMode && index === 0 && (
                <div className="absolute -top-12 left-6 pointer-events-none" style={{ transform: 'rotate(-8deg)' }}>
                  <div 
                    className="text-gray-500 text-sm leading-tight"
                    style={{ fontFamily: '"Sour Gummy", cursive', fontWeight: 400 }}
                  >
                    Add link :)
                  </div>
                  <svg width="40" height="40" viewBox="0 0 375 375" className="absolute top-4 left-10 text-gray-500" style={{ transform: 'rotate(20deg)' }}>
                    <path fill="currentColor" d="M 224.339844 260.644531 C 224.886719 244.621094 223.992188 228.351562 227.515625 212.601562 C 228.203125 209.511719 235.894531 188.441406 233.585938 187.402344 C 230.769531 188.617188 226.753906 188.640625 225.441406 191.765625 C 222.289062 203.566406 217.433594 215.648438 216.53125 227.898438 C 216.464844 228.777344 217.882812 237.042969 215.039062 234.339844 C 213.527344 232.914062 210.949219 225.867188 209.335938 223.242188 C 197.03125 203.203125 181.867188 179.925781 167.101562 161.738281 C 134.816406 121.980469 64.929688 64.773438 13.214844 57.34375 C 9.722656 56.847656 0.820312 55.742188 2.257812 61.90625 C 3.1875 65.882812 6.824219 64.128906 9.59375 64.765625 C 89.363281 83.25 156.222656 153.132812 197.8125 220.796875 C 200.417969 225.042969 203.191406 229.925781 204.96875 234.578125 C 204.492188 235.90625 181.160156 223.957031 179.148438 223.242188 C 174.644531 221.625 162.3125 218.652344 158.609375 221.140625 C 155.941406 222.929688 156.597656 232.648438 158.28125 235.003906 C 159.628906 236.890625 171.019531 238.742188 174.222656 239.855469 C 180.863281 242.15625 197.734375 249.234375 203.433594 253.207031 C 206.195312 255.132812 215.4375 264.65625 217.84375 265.125 C 220.246094 265.59375 223.082031 262.609375 224.308594 260.652344 Z M 224.339844 260.644531 " fillOpacity="0.5" />
                  </svg>
                </div>
              )}
            </div>
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
    // Calculate max deliverables to align bonus sections
    const maxDeliverables = Math.max(...packages.filter(p => !p.isCustomOffer).map(p => p.deliverables.length));
    const deliverablesMinHeight = packages.length === 4 ? maxDeliverables * 28 : maxDeliverables * 32;
    
    return (
    <DragDropContext onDragEnd={handleDragEnd}>
    <div className={`grid gap-6 ${packages.length === 4 ? 'md:grid-cols-4' : packages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
      {packages.map((pkg, index) => {
        const tierName = pkg.tier;

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
            {packages.length > 2 && (
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
              <div className={packages.length === 4 ? 'min-h-[520px] flex flex-col' : ''}>
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
                
                <div className="mb-6">
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
                      className={`font-bold text-white inline-block ${packages.length === 4 ? 'text-4xl' : 'text-5xl'}`}
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
                </div>
                {pricingMode === 'one-time' && (
                  <p className={`text-white font-bold mb-6 text-center ${packages.length === 4 ? 'text-xl' : 'text-2xl'}`}>
                    <EditableText
                      value={pkg.duration || '2-4 weeks to delivery'}
                      onSave={(newValue) => updatePackageDuration(tierName, newValue)}
                      className={`inline font-bold ${packages.length === 4 ? 'text-xl' : 'text-2xl'}`}
                      placeholder="2-4 weeks to delivery"
                      darkMode={true}
                      brandColor={brandColor}
                    />
                  </p>
                )}

                <div 
                  className="mb-6 p-4 rounded-xl"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                >
                  <EditableText
                    value={pkg.description}
                    onSave={(newValue) => updatePackageDescription(tierName, newValue)}
                    className="text-sm text-white"
                    multiline={true}
                    placeholder="Describe who this package is best for"
                    darkMode={true}
                    brandColor={brandColor}
                  />
                </div>

                <div className={`space-y-3 mb-6`}>
                  <p className="text-sm font-semibold text-white/70 uppercase">Deliverables</p>

                  <Droppable droppableId={`deliverables-${tierName}`} type="deliverable">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3" style={{ minHeight: `${deliverablesMinHeight}px` }}>
                       {pkg.deliverables.map((d, idx) => (
                         <Draggable key={`deliv-${tierName}-${idx}`} draggableId={`deliv-${tierName}-${idx}`} index={idx}>
                           {(provided) => (
                             <div ref={provided.innerRef} {...provided.draggableProps}>
                               <EditableDeliverableItem
                                 deliverable={d}
                                 onSave={(newVal) => updateDeliverable(tierName, idx, newVal)}
                                 onDelete={() => deleteDeliverable(tierName, idx)}
                                 darkMode={true}
                                 brandColor={brandColor}
                                 dragHandleProps={provided.dragHandleProps}
                               />
                             </div>
                           )}
                         </Draggable>
                       ))}
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

              <div className="space-y-3 mb-10 pt-6 border-t border-white/20">
                <p className="text-xs font-bold uppercase tracking-wider">Bonuses</p>

                <Droppable droppableId={`bonuses-${tierName}`} type="bonus">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                      {pkg.bonuses.map((bonus, idx) => (
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
                      ))}
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

            <div className="relative">
              <EditableButton
                tier={tierName}
                brandColor={brandColor}
                darkerBrandColor={darkerBrandColor}
                darkMode={true}
              />

              {!isPreviewMode && index === 0 && (
                <div className="absolute -top-12 left-6 pointer-events-none" style={{ transform: 'rotate(-8deg)' }}>
                  <div 
                    className="text-gray-400 text-sm leading-tight"
                    style={{ fontFamily: '"Sour Gummy", cursive', fontWeight: 400 }}
                  >
                    Add link :)
                  </div>
                  <svg width="40" height="40" viewBox="0 0 375 375" className="absolute top-4 left-10 text-gray-400" style={{ transform: 'rotate(20deg)' }}>
                    <path fill="currentColor" d="M 224.339844 260.644531 C 224.886719 244.621094 223.992188 228.351562 227.515625 212.601562 C 228.203125 209.511719 235.894531 188.441406 233.585938 187.402344 C 230.769531 188.617188 226.753906 188.640625 225.441406 191.765625 C 222.289062 203.566406 217.433594 215.648438 216.53125 227.898438 C 216.464844 228.777344 217.882812 237.042969 215.039062 234.339844 C 213.527344 232.914062 210.949219 225.867188 209.335938 223.242188 C 197.03125 203.203125 181.867188 179.925781 167.101562 161.738281 C 134.816406 121.980469 64.929688 64.773438 13.214844 57.34375 C 9.722656 56.847656 0.820312 55.742188 2.257812 61.90625 C 3.1875 65.882812 6.824219 64.128906 9.59375 64.765625 C 89.363281 83.25 156.222656 153.132812 197.8125 220.796875 C 200.417969 225.042969 203.191406 229.925781 204.96875 234.578125 C 204.492188 235.90625 181.160156 223.957031 179.148438 223.242188 C 174.644531 221.625 162.3125 218.652344 158.609375 221.140625 C 155.941406 222.929688 156.597656 232.648438 158.28125 235.003906 C 159.628906 236.890625 171.019531 238.742188 174.222656 239.855469 C 180.863281 242.15625 197.734375 249.234375 203.433594 253.207031 C 206.195312 255.132812 215.4375 264.65625 217.84375 265.125 C 220.246094 265.59375 223.082031 262.609375 224.308594 260.652344 Z M 224.339844 260.644531 " fillOpacity="0.5" />
                  </svg>
                </div>
              )}
            </div>
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
    const maxDeliverables = Math.max(...previewPackages.filter(p => !p.isCustomOffer).map(p => p.deliverables.length));
    const deliverablesMinHeight = previewPackages.length === 4 ? maxDeliverables * 24 : maxDeliverables * 28;

    return (
              <div className={`grid gap-4 ${previewPackages.length === 4 ? 'md:grid-cols-4' : previewPackages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
                {previewPackages.map((pkg, index) => {
        const modeKey = getCurrentModeKey();
        const buttonLink = config.button_links?.[modeKey]?.[pkg.tier];
        const trimmedLink = buttonLink?.trim() || '';
        const hasValidLink = trimmedLink !== '';
        const finalLink = hasValidLink ? (
          trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://') 
            ? trimmedLink 
            : `https://${trimmedLink}`
        ) : null;

        if (pkg.isCustomOffer) {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-3xl border-2 border-gray-200 shadow-lg flex flex-col ${previewPackages.length === 4 ? 'p-4' : 'p-8'}`}
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
                    const tierLabel = pkg.name || pkg.tier;
                    const modeLabel = pricingMode === 'one-time' ? (config.pricing_label_onetime || 'One-Time') : (config.pricing_label_retainer || 'Monthly');
                    const doClick = (viewId) => { if (viewId) logButtonClick(viewId, pkg.tier, tierLabel, modeLabel); };
                    if (window.__analyticsViewId) { doClick(window.__analyticsViewId); }
                    else if (window.__analyticsPending) { window.__analyticsPending.then(doClick); }
                  }}
                >
                  {config.button_links?.[modeKey]?.[pkg.tier + '_label'] || "Get Custom Offer"}
                </a>
              </div>
            </motion.div>
          );
        }

        return (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative bg-white rounded-3xl border-2 flex flex-col ${
            pkg.popular ? 'shadow-xl' : 'border-gray-200 shadow-lg'
          } ${previewPackages.length === 4 ? 'p-4' : 'p-8'}`}
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
                <div className="flex items-baseline gap-1 justify-center">
                  <div className={`font-bold text-gray-900 ${previewPackages.length === 4 ? 'text-2xl' : 'text-4xl'}`}>
                    {currencySymbol}{(pkg.price || 0).toLocaleString()}
                  </div>
                  <span className={`text-gray-500 ${previewPackages.length === 4 ? 'text-xs' : 'text-base'}`}>
                    / {pricingMode === 'one-time' ? (config.pricing_label_onetime || 'one-time') : (config.pricing_label_retainer || 'monthly')}
                  </span>
                </div>
              </div>
              {pricingMode === 'one-time' && (
                <p className={`text-gray-900 font-bold mb-4 text-center ${previewPackages.length === 4 ? 'text-base' : 'text-2xl'}`}>
                  {pkg.duration ? pkg.duration : '2-4 weeks to delivery'}
                </p>
              )}

              <div 
                className={`p-3 rounded-xl mb-4 ${previewPackages.length === 4 ? 'p-2' : 'p-4'}`}
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <p className={`text-gray-700 ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>{pkg.description}</p>
              </div>

              <div className={`mb-4 ${previewPackages.length === 4 ? 'space-y-1' : 'space-y-3'}`}>
                <p className={`font-semibold text-gray-500 uppercase ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>Deliverables</p>
                <div style={{ minHeight: `${deliverablesMinHeight}px` }}>
                  {pkg.deliverables.map((d, i) => (
                    <div key={i} className="flex items-start gap-1.5 mb-1">
                      <Check className={`flex-shrink-0 mt-0.5 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} style={{ color: brandColor }} />
                      <span className={`text-gray-700 ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>
                        {typeof d === 'string' ? d : d.type || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            {pkg.bonuses.length > 0 && (
              <div className={`pt-4 border-t border-gray-200 mb-10 ${previewPackages.length === 4 ? 'space-y-1' : 'space-y-3'}`}>
                <p className={`font-semibold text-gray-500 uppercase ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>Bonuses</p>
                {pkg.bonuses.map((bonus, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1">
                    <Plus className={`flex-shrink-0 mt-0.5 text-green-500 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                    <span className={`text-gray-700 ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>{bonus}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              const tierLabel = pkg.name || pkg.tier;
              const modeLabel = pricingMode === 'one-time' ? (config.pricing_label_onetime || 'One-Time') : (config.pricing_label_retainer || 'Monthly');
              const doClick = (viewId) => { if (viewId) logButtonClick(viewId, pkg.tier, tierLabel, modeLabel); };
                    if (window.__analyticsViewId) { doClick(window.__analyticsViewId); }
                    else if (window.__analyticsPending) { window.__analyticsPending.then(doClick); }
            }}
          >
            Get Started
          </a>
        </motion.div>
        );
      })}
    </div>
    );
  };

  const renderPreviewDesign2 = () => {
    const maxDeliverables = Math.max(...previewPackages.filter(p => !p.isCustomOffer).map(p => p.deliverables.length));
    const deliverablesMinHeight = previewPackages.length === 4 ? maxDeliverables * 24 : maxDeliverables * 28;

    return (
    <div className={`grid gap-4 ${previewPackages.length === 4 ? 'md:grid-cols-4' : previewPackages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'md:grid-cols-3'}`}>
      {previewPackages.map((pkg, index) => {
        const modeKey = getCurrentModeKey();
        const buttonLink = config.button_links?.[modeKey]?.[pkg.tier];
        const trimmedLink = buttonLink?.trim() || '';
        const hasValidLink = trimmedLink !== '';
        const finalLink = hasValidLink ? (
          trimmedLink.startsWith('http://') || trimmedLink.startsWith('https://') 
            ? trimmedLink 
            : `https://${trimmedLink}`
        ) : null;

        if (pkg.isCustomOffer) {
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-3xl text-white shadow-2xl flex flex-col bg-gradient-to-br from-gray-800 to-gray-900 ${previewPackages.length === 4 ? 'p-4' : 'p-8'}`}
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
                    const tierLabel = pkg.name || pkg.tier;
                    const modeLabel = pricingMode === 'one-time' ? (config.pricing_label_onetime || 'One-Time') : (config.pricing_label_retainer || 'Monthly');
                    const doClick = (viewId) => { if (viewId) logButtonClick(viewId, pkg.tier, tierLabel, modeLabel); };
                    if (window.__analyticsViewId) { doClick(window.__analyticsViewId); }
                    else if (window.__analyticsPending) { window.__analyticsPending.then(doClick); }
                  }}
                >
                  {config.button_links?.[modeKey]?.[pkg.tier + '_label'] || "Get Custom Offer"}
                </a>
              </div>
            </motion.div>
          );
        }

        return (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative rounded-3xl text-white shadow-2xl flex flex-col ${
            pkg.popular
              ? ''
              : 'bg-gradient-to-br from-gray-800 to-gray-900'
          } ${previewPackages.length === 4 ? 'p-4' : 'p-8'}`}
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
                <div className="flex items-baseline gap-1 justify-center">
                  <div className={`font-bold ${previewPackages.length === 4 ? 'text-3xl' : 'text-5xl'}`}>{currencySymbol}{(pkg.price || 0).toLocaleString()}</div>
                  <span className={`text-white/70 ${previewPackages.length === 4 ? 'text-xs' : 'text-base'}`}>
                    / {pricingMode === 'one-time' ? (config.pricing_label_onetime || 'one-time') : (config.pricing_label_retainer || 'monthly')}
                  </span>
                </div>
              </div>
              {pricingMode === 'one-time' && (
                <p className={`text-white font-bold mb-4 text-center ${previewPackages.length === 4 ? 'text-base' : 'text-2xl'}`}>
                  {pkg.duration ? pkg.duration : '2-4 weeks to delivery'}
                </p>
              )}

              <div 
                className={`rounded-xl mb-4 ${previewPackages.length === 4 ? 'p-2' : 'p-4'}`}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <p className={`text-white ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>{pkg.description}</p>
              </div>

              <div className={`mb-4 ${previewPackages.length === 4 ? 'space-y-1' : 'space-y-3'}`}>
                <p className={`font-semibold text-white/70 uppercase ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>Deliverables</p>
                <div style={{ minHeight: `${deliverablesMinHeight}px` }} className="space-y-2">
                  {pkg.deliverables.map((d, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Check className={`flex-shrink-0 mt-0.5 text-white ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                      <span className={`text-white ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>
                        {typeof d === 'string' ? d : d.type || ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            {pkg.bonuses.length > 0 && (
              <div className={`pt-4 border-t border-white/20 mb-10 ${previewPackages.length === 4 ? 'space-y-1' : 'space-y-3'}`}>
                <p className={`font-bold uppercase tracking-wider ${previewPackages.length === 4 ? 'text-[10px]' : 'text-xs'}`}>Bonuses</p>
                {pkg.bonuses.map((bonus, i) => (
                  <div key={i} className="flex items-start gap-1.5 mb-1">
                    <Plus className={`flex-shrink-0 mt-0.5 text-yellow-400 ${previewPackages.length === 4 ? 'w-3.5 h-3.5' : 'w-5 h-5'}`} />
                    <span className={`text-white ${previewPackages.length === 4 ? 'text-xs' : 'text-sm'}`}>{bonus}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              const tierLabel = pkg.name || pkg.tier;
              const modeLabel = pricingMode === 'one-time' ? (config.pricing_label_onetime || 'One-Time') : (config.pricing_label_retainer || 'Monthly');
              const doClick = (viewId) => { if (viewId) logButtonClick(viewId, pkg.tier, tierLabel, modeLabel); };
                    if (window.__analyticsViewId) { doClick(window.__analyticsViewId); }
                    else if (window.__analyticsPending) { window.__analyticsPending.then(doClick); }
            }}
          >
            Get Started
          </a>
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



  if (isPreviewMode) {
    return (
      <div className="min-h-screen py-6 md:py-12" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center">
            {config.logo_url && (
              <img 
                src={config.logo_url} 
                alt="Logo" 
                className="w-auto mx-auto object-contain"
                style={{ height: `${config.logo_height || 80}px` }}
              />
            )}
            <h1 className="text-3xl md:text-6xl font-bold mb-3 md:mb-4 text-gray-900 px-2">
              {config.headline || 'Simple, transparent pricing'}
            </h1>
            <p className="text-lg md:text-2xl text-gray-600 px-2">
              {config.sub_headline || 'No surprise fees.'}
            </p>
          </div>

          {(config.pricing_availability === 'both') && (
            <div className="flex justify-center mb-8 md:mb-12 mt-8 md:mt-12">
              <div className="inline-flex rounded-full bg-white p-1 md:p-1.5 shadow-lg border border-gray-200">
                <button
                  onClick={() => setPricingMode('one-time')}
                  className={`px-4 md:px-8 py-2 md:py-3 rounded-full font-semibold text-xs md:text-sm transition-all ${
                    pricingMode === 'one-time' ? 'text-white shadow-lg' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={pricingMode === 'one-time' ? { background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` } : {}}
                >
                  {config.pricing_button_label_onetime || 'One-time Project'}
                </button>
                <button
                  onClick={() => setPricingMode('retainer')}
                  className={`px-4 md:px-8 py-2 md:py-3 rounded-full font-semibold text-xs md:text-sm transition-all ${
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
              <div className="bg-white rounded-xl p-6 shadow-md max-w-3xl mx-auto border-2 border-gray-200">
                <p className="text-lg text-gray-900">
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

  const goBackToWizard = () => {
    const latestConfig = configRef.current || config;
    localStorage.setItem('packageConfig', JSON.stringify(latestConfig));
    localStorage.setItem('editingFromResults', 'true');
    if (packageId) {
      localStorage.setItem('editingPackageId', packageId);
    }
    window.location.href = createPageUrl('PackageBuilder');
  };

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          {config?.from_template && (
            <Button
              onClick={() => { window.location.href = createPageUrl('Templates'); }}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900 hover:bg-white rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          )}
          <Button
            onClick={goBackToWizard}
            variant="outline"
            className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Wizard
          </Button>
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
          <h1 className="text-6xl font-bold mb-4 text-gray-900">
            <EditableText
              value={config.headline}
              onSave={(newValue) => updateConfig('headline', newValue)}
              className="inline"
              placeholder="Simple, transparent pricing"
              brandColor={brandColor}
            />
          </h1>
          <p className="text-2xl text-gray-600">
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
          >
            {renderCurrentDesign()}

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

        <div className="text-center space-y-4 mb-12">
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
              onClick={() => {
                const baseUrl = window.location.origin;
                const previewUrl = baseUrl + createPageUrl('Results') + `?preview=true&packageId=${packageId}`;
                const embedCode = `<iframe src="${previewUrl}" width="100%" height="800px" frameborder="0" style="border-radius: 12px;"></iframe>`;
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
                  Your packages look great! Want to add links to your "Get Started" buttons?
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
                        const previewUrl = baseUrl + createPageUrl('Results') + `?preview=true&packageId=${savedPackageId}`;
                        window.open(previewUrl, '_blank');
                        
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
    </div>
  );
}