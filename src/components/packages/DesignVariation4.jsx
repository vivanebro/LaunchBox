import React from 'react';
import { Check, Award } from 'lucide-react';

export default function DesignVariation4({ packages, colorScheme, photographerName, onUpdate, editable = false }) {
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
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden text-white transform transition-all duration-300 hover:scale-105"
          >
            <div className="p-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  {isPopular && (
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5" style={{ color: colorScheme.accent }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colorScheme.accent }}>
                        Recommended
                      </span>
                    </div>
                  )}
                  <h3 className="text-3xl font-light">
                    <EditableText value={pkg.title} packageIndex={index} field="title" className="block" />
                  </h3>
                </div>
              </div>

              <div className="border-l-4 pl-6 py-4" style={{ borderColor: colorScheme.primary }}>
                <div className="text-5xl font-bold">
                  $<EditableText value={pkg.price} packageIndex={index} field="price" className="inline-block" />
                </div>
                <p className="text-sm mt-1 text-gray-400">starting investment</p>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                <EditableText value={pkg.description} packageIndex={index} field="description" className="block" multiline={editable} />
              </p>

              {/* Horizontal stats */}
              <div className="flex gap-4 py-4">
                <div className="flex-1 bg-white/5 rounded-lg p-3 text-center">
                  <div className="font-semibold">
                    <EditableText value={pkg.photo_count} packageIndex={index} field="photo_count" className="block" />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Images</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-lg p-3 text-center">
                  <div className="font-semibold">
                    <EditableText value={pkg.session_length} packageIndex={index} field="session_length" className="block" />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Coverage</div>
                </div>
                <div className="flex-1 bg-white/5 rounded-lg p-3 text-center">
                  <div className="font-semibold">
                    <EditableText value={pkg.turnaround} packageIndex={index} field="turnaround" className="block" />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Ready</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2.5">
                {pkg.features.slice(0, 5).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: colorScheme.primary }} />
                    <span className="text-sm text-gray-200 flex-1">
                      <EditableText value={feature} packageIndex={index} field={`feature-${idx}`} className="block" />
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="w-full h-12 rounded-lg font-semibold text-white"
                style={{ backgroundColor: colorScheme.primary }}
              >
                Select Package
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}