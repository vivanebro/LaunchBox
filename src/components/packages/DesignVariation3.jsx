import React from 'react';
import { Check } from 'lucide-react';

export default function DesignVariation3({ packages, colorScheme, photographerName, onUpdate, editable = false }) {
  const handleEdit = (packageIndex, field, value) => {
    if (!editable || !onUpdate) return;
    
    const updatedPackages = packages.map((pkg, idx) => {
      if (idx === packageIndex) {
        if (field.startsWith('feature-')) {
          const featureIndex = parseInt(field.split('-')[1]);
          const newFeatures = [...pkg.features];
          newFeatures[featureIndex] = value;
          return { ...pkg, features: newFeatures };
        }
        return { ...pkg, [field]: value };
      }
      return pkg;
    });
    onUpdate(updatedPackages);
  };

  const EditableText = ({ value, packageIndex, field, className, multiline = false }) => {
    if (!editable) {
      return <span className={className}>{value}</span>;
    }

    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={(e) => handleEdit(packageIndex, field, e.target.value)}
          className={`${className} bg-transparent border-none outline-none resize-none w-full focus:ring-1 focus:ring-white/30 rounded px-1`}
          rows={2}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleEdit(packageIndex, field, e.target.value)}
        className={`${className} bg-transparent border-none outline-none w-full focus:ring-1 focus:ring-white/30 rounded px-1`}
      />
    );
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {packages.map((pkg, index) => {
        const isPopular = pkg.isPopular;
        
        return (
          <div 
            key={index}
            className="rounded-3xl shadow-2xl overflow-hidden text-white transform transition-all duration-300 hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%)` }}
          >
            <div className="p-10 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-bold">
                  <EditableText value={pkg.title} packageIndex={index} field="title" className="block" />
                </h3>
                {isPopular && (
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                    Popular
                  </div>
                )}
              </div>

              <div className="py-6">
                <div className="text-6xl font-bold">
                  $<EditableText value={pkg.price} packageIndex={index} field="price" className="inline-block" />
                </div>
                <p className="text-sm mt-2 opacity-90">starting price</p>
              </div>

              <p className="text-sm leading-relaxed opacity-95">
                <EditableText value={pkg.description} packageIndex={index} field="description" className="block" multiline={editable} />
              </p>

              {/* Stats in white boxes */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="font-bold">
                    <EditableText value={pkg.photo_count} packageIndex={index} field="photo_count" className="block" />
                  </div>
                  <div className="text-xs opacity-80 mt-1">Photos</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="font-bold">
                    <EditableText value={pkg.session_length} packageIndex={index} field="session_length" className="block" />
                  </div>
                  <div className="text-xs opacity-80 mt-1">Time</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="font-bold">
                    <EditableText value={pkg.turnaround} packageIndex={index} field="turnaround" className="block" />
                  </div>
                  <div className="text-xs opacity-80 mt-1">Delivery</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 pt-4">
                {pkg.features.slice(0, 5).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm flex-1">
                      <EditableText value={feature} packageIndex={index} field={`feature-${idx}`} className="block" />
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="w-full h-12 rounded-lg font-semibold bg-white hover:bg-white/90 transition-colors"
                style={{ color: colorScheme.primary }}
              >
                Book Now
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}