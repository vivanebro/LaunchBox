import React from 'react';
import { Check, Star } from 'lucide-react';

export default function DesignVariation2({ packages, colorScheme, photographerName, onUpdate, editable = false }) {
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
          className={`${className} bg-transparent border-none outline-none resize-none w-full focus:ring-1 focus:ring-gray-300 rounded px-1`}
          rows={2}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleEdit(packageIndex, field, e.target.value)}
        className={`${className} bg-transparent border-none outline-none w-full focus:ring-1 focus:ring-gray-300 rounded px-1`}
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
            className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 transform transition-all duration-300 hover:scale-105" 
            style={{ borderColor: isPopular ? colorScheme.primary : '#e5e7eb' }}
          >
            {/* Badge */}
            {isPopular && (
              <div 
                className="py-2 text-center text-xs font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: colorScheme.primary }}
              >
                <Star className="w-3 h-3 inline mr-1 fill-current" />
                Best Value
              </div>
            )}

            <div className="p-10 text-center space-y-6">
              <h3 className="text-2xl font-light text-gray-800">
                <EditableText value={pkg.title} packageIndex={index} field="title" className="block" />
              </h3>

              <div>
                <span className="text-6xl font-bold" style={{ color: colorScheme.primary }}>
                  $<EditableText value={pkg.price} packageIndex={index} field="price" className="inline-block" />
                </span>
                <p className="text-sm text-gray-500 mt-2">per session</p>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed px-4">
                <EditableText value={pkg.description} packageIndex={index} field="description" className="block" multiline={editable} />
              </p>

              {/* Minimal stats */}
              <div className="flex justify-center gap-6 text-sm">
                <div>
                  <div className="font-semibold text-gray-900">
                    <EditableText value={pkg.photo_count} packageIndex={index} field="photo_count" className="block" />
                  </div>
                  <div className="text-xs text-gray-500">Photos</div>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div>
                  <div className="font-semibold text-gray-900">
                    <EditableText value={pkg.session_length} packageIndex={index} field="session_length" className="block" />
                  </div>
                  <div className="text-xs text-gray-500">Duration</div>
                </div>
                <div className="w-px bg-gray-200"></div>
                <div>
                  <div className="font-semibold text-gray-900">
                    <EditableText value={pkg.turnaround} packageIndex={index} field="turnaround" className="block" />
                  </div>
                  <div className="text-xs text-gray-500">Delivery</div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-3">
                {pkg.features.slice(0, 5).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-left">
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: colorScheme.secondary }} />
                    <span className="text-sm text-gray-700 flex-1">
                      <EditableText value={feature} packageIndex={index} field={`feature-${idx}`} className="block" />
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="w-full h-11 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
                style={{ backgroundColor: colorScheme.primary }}
              >
                Choose Plan
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}