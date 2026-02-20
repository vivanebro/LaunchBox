import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StepIndicator({ currentStep, totalSteps, onStepClick }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-12">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <React.Fragment key={step}>
          <button
            onClick={() => onStepClick?.(step)}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 font-semibold text-sm cursor-pointer hover:scale-105",
              step < currentStep && "text-white shadow-md",
              step === currentStep && "text-white scale-110 shadow-lg",
              step > currentStep && "bg-white text-gray-400 border-2 border-gray-200"
            )}
            style={step <= currentStep ? { background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' } : {}}
          >
            {step < currentStep ? (
              <Check className="w-5 h-5" />
            ) : (
              <span>{step}</span>
            )}
          </button>
          {step < totalSteps && (
            <div
              className={cn(
                "h-1 w-12 transition-all duration-300 rounded-full",
                step < currentStep ? "" : "bg-gray-200"
              )}
              style={step < currentStep ? { background: 'linear-gradient(135deg, #ff0044 0%, #ff3366 100%)' } : {}}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}