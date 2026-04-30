import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import supabaseClient from '@/lib/supabaseClient';

import StepIndicator from '../components/builder/StepIndicator';
import Step1Name from '../components/builder/Step1Name';
import Step2PricingMode from '../components/builder/Step2PricingMode';
import Step3Deliverables from '../components/builder/Step2Deliverables';
import Step4Bonuses from '../components/builder/Step3Bonuses';
import Step5Duration from '../components/builder/Step4Duration';
import Step6Pricing from '../components/builder/Step5Pricing';
import Step7Urgency from '../components/builder/Step6Urgency';
import Step8Guarantee from '../components/builder/Step7Guarantee';

// Steps: 1-Name, 2-PricingMode, 3-Deliverables, 4-Bonuses, 5-Duration, 6-Pricing, 7-Urgency, 8-Guarantee
// Duration (step 5) is skipped when pricing_availability === 'retainer'
const BASE_TOTAL_STEPS = 8;

export default function PackageBuilder() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState(() => {
    // Check if we're editing from Results page
    const editingFromResults = localStorage.getItem('editingFromResults');
    if (editingFromResults === 'true') {
      const savedConfig = localStorage.getItem('packageConfig');
      localStorage.removeItem('editingFromResults'); // Clean up flag
      if (savedConfig) {
        const loadedConfig = JSON.parse(savedConfig);
        
        // Extract deliverables and bonuses from package_data back to wizard format
        if (loadedConfig.package_data) {
          const modeKey = loadedConfig.pricingMode === 'retainer' ? 'retainer' : 'onetime';
          const premiumData = loadedConfig.package_data[modeKey]?.premium;
          
          if (premiumData) {
            // Get all unique deliverables from premium tier
            loadedConfig.core_deliverables = premiumData.deliverables || [];
            // Get all bonuses from premium tier
            loadedConfig.extras_bonuses = premiumData.bonuses || [];
          }
        }
        
        return loadedConfig;
      }
    }
    // Default config
    return {
      brand_color: '#6366F1',
      from_template: false,
      popularPackageIndex: { onetime: 2, retainer: 2 },
      popularBadgeText: 'Most Popular',
      business_name: 'My Studio',
      package_set_name: ''
    };
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const brandColor = config?.brand_color || '#ff0044';

  // Load user's default currency for new packages
  useEffect(() => {
    if (config.currency) return; // Already has currency (editing existing)
    supabaseClient.auth.me()
      .then((u) => {
        setConfig((prev) => ({ ...prev, currency: u?.default_currency || 'USD' }));
      })
      .catch(() => {
        setConfig((prev) => ({ ...prev, currency: 'USD' }));
      });
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && canProceed()) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, config]);

  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const skipDuration = config.pricing_availability === 'retainer';
  const totalSteps = skipDuration ? BASE_TOTAL_STEPS - 1 : BASE_TOTAL_STEPS;

  // Map visual step number to actual step number (accounting for skipped Duration)
  const visualToActual = (vis) => {
    if (!skipDuration) return vis;
    // When Duration (actual 5) is skipped, visual 5+ maps to actual 6+
    return vis >= 5 ? vis + 1 : vis;
  };
  const actualToVisual = (act) => {
    if (!skipDuration) return act;
    return act > 5 ? act - 1 : act;
  };

  const handleNext = async () => {
    const visualStep = actualToVisual(step);
    if (visualStep < totalSteps) {
      let nextActual = step + 1;
      // Skip Duration step (actual 5) when ongoing-only
      if (skipDuration && nextActual === 5) {
        // Set ongoing defaults for duration fields
        updateConfig({
          project_duration: 'Ongoing',
          duration_min: null,
          duration_max: null,
          duration_unit: 'ongoing',
          duration_starter: null,
          duration_growth: null,
          duration_premium: null,
        });
        nextActual = 6;
      }
      setStep(nextActual);
    } else {
      // Final step - show generating animation, then save and go to results
      setIsProcessing(true);

      // Show the "building" animation for 2 seconds before navigating
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const editingPackageId = localStorage.getItem('editingPackageId');

        // Strip system fields
        const { id, created_date, updated_date, created_by, created_by_id, entity_name, app_id, is_sample, is_deleted, deleted_date, environment, ...cleanConfig } = config;

        // Ensure popularPackageIndex is always an object
        if (typeof cleanConfig.popularPackageIndex === 'number' || !cleanConfig.popularPackageIndex) {
          const val = typeof cleanConfig.popularPackageIndex === 'number' ? cleanConfig.popularPackageIndex : 2;
          cleanConfig.popularPackageIndex = { onetime: val, retainer: val };
        }

        // Flag that this is a fresh build so Results lands in preview-first mode
        if (!editingPackageId) {
          localStorage.setItem('freshFromWizard', 'true');
        }

        if (editingPackageId) {
          try {
            await supabaseClient.entities.PackageConfig.update(editingPackageId, cleanConfig);
            localStorage.setItem('packageConfig', JSON.stringify(cleanConfig));
            localStorage.removeItem('editingPackageId');
            window.location.href = createPageUrl('Results') + `?packageId=${editingPackageId}`;
          } catch (updateError) {
            // Package no longer exists — create new instead
            console.warn('Package not found, creating new:', updateError);
            localStorage.removeItem('editingPackageId');
            localStorage.setItem('packageConfig', JSON.stringify(cleanConfig));
            window.location.href = createPageUrl('Results');
          }
        } else {
          // New package — also clean any stale id from localStorage
          localStorage.setItem('packageConfig', JSON.stringify(cleanConfig));
          window.location.href = createPageUrl('Results');
        }
      } catch (error) {
        console.error('Error updating package:', error);
        alert('Failed to save changes: ' + (error?.message || 'Unknown error'));
        setIsProcessing(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      let prevActual = step - 1;
      // Skip Duration step (actual 5) when going back too
      if (skipDuration && prevActual === 5) prevActual = 4;
      setStep(prevActual);
    }
  };

  const canProceed = () => {
    switch(step) {
      case 1: return config.package_set_name?.trim().length > 0;
      case 2: return !!config.pricing_availability;
      case 3: return config.core_deliverables?.length > 0;
      case 5: return config.project_duration;
      case 6: return config.typical_price > 0;
      default: return true;
    }
  };

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

  const darkerBrandColor = getDarkerBrandColor(brandColor);

  if (isMobileView) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F5F5F7' }}>
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-sm mx-auto border-2 border-gray-200 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${darkerBrandColor} 100%)` }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Mobile Not Supported</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            LaunchBox's Package Builder is optimized for desktop. Please switch to a laptop or desktop computer for the best experience.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Desktop Required</span>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-6" style={{ backgroundColor: '#F5F5F7' }}>
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-1">Building your packages...</h2>
          <p className="text-gray-400 text-sm">This will just take a moment.</p>
        </motion.div>

        {/* Skeleton wireframe of 3 package cards */}
        <motion.div
          className="flex gap-4 w-full max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-1 bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <div className="h-6 w-20 bg-gray-200 rounded-full mx-auto animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded mx-auto animate-pulse" />
              <div className="h-4 w-28 bg-gray-100 rounded mx-auto animate-pulse" />
              <div className="space-y-2 pt-2">
                {[0, 1, 2].map(j => (
                  <div key={j} className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${85 - j * 15}%` }} />
                ))}
              </div>
              <div className="h-9 bg-gray-200 rounded-lg animate-pulse mt-3" />
            </div>
          ))}
        </motion.div>

        {/* Progress bar */}
        <div className="w-full max-w-md">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: brandColor }}
              initial={{ width: '0%' }}
              animate={{ width: '92%' }}
              transition={{ duration: 2, ease: [0.4, 0.0, 0.2, 1] }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Step Indicator */}
        <StepIndicator currentStep={actualToVisual(step)} totalSteps={totalSteps} onStepClick={(vis) => setStep(visualToActual(vis))} />

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200"
          >
            {step === 1 && <Step1Name data={config} onChange={updateConfig} onNext={handleNext} />}
            {step === 2 && <Step2PricingMode data={config} onChange={updateConfig} />}
            {step === 3 && <Step3Deliverables data={config} onChange={updateConfig} onNext={handleNext} />}
            {step === 4 && <Step4Bonuses data={config} onChange={updateConfig} onNext={handleNext} />}
            {step === 5 && <Step5Duration data={config} onChange={updateConfig} onNext={handleNext} />}
            {step === 6 && <Step6Pricing data={config} onChange={updateConfig} onNext={handleNext} />}
            {step === 7 && <Step7Urgency data={config} onChange={updateConfig} onNext={handleNext} />}
            {step === 8 && <Step8Guarantee data={config} onChange={updateConfig} onNext={handleNext} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {step > 1 && (
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900 hover:bg-white rounded-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="h-14 px-10 text-base font-semibold rounded-full shadow-lg hover:shadow-xl transition-all text-white border-0 disabled:from-gray-300 disabled:to-gray-400"
            style={{ background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' }}
          >
            {actualToVisual(step) === totalSteps ? 'Generate Packages' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}