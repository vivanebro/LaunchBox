import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PackageCard({ 
  title, 
  price, 
  services, 
  extras, 
  primaryColor, 
  secondaryColor,
  isPopular 
}) {
  return (
    <div className={cn(
      "relative flex flex-col h-full bg-white rounded-3xl border-2 overflow-hidden transition-all duration-300",
      isPopular ? "shadow-2xl scale-105 border-neutral-900" : "shadow-lg border-neutral-200 hover:shadow-xl"
    )}>
      {isPopular && (
        <div 
          className="absolute top-0 left-0 right-0 py-2 text-center text-sm font-medium text-white"
          style={{ backgroundColor: primaryColor }}
        >
          Most Popular
        </div>
      )}
      
      <div className={cn("p-8", isPopular && "pt-14")}>
        <h3 className="text-2xl font-light mb-2" style={{ color: primaryColor }}>
          {title}
        </h3>
        <div className="mb-8">
          <span className="text-5xl font-light" style={{ color: primaryColor }}>
            ${price}
          </span>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Included Services</p>
          {services.map((service, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div 
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
              >
                <Check className="w-3 h-3" />
              </div>
              <span className="text-sm text-neutral-700">{service}</span>
            </div>
          ))}
        </div>

        {extras?.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-neutral-100">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Optional Extras</p>
            {extras.map((extra, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                >
                  <span className="text-xs">+</span>
                </div>
                <span className="text-sm text-neutral-600">{extra}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}