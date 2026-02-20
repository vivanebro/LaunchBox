import React from 'react';
import { Check, Sparkles } from 'lucide-react';

export default function DesignVariation5({ packages, colorScheme, photographerName, onUpdate, editable = false }) {
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
            className="bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105"
          >
            <div className="p-8 space-y-6">
              {/* Minimal header */}
              <div className="flex items-center justify-between border-b pb-6" style={{ borderColor: `${colorScheme.primary}20` }}>
                <h3 className="text-2xl font-light text-gray-900">
                  <EditableText value={pkg.title} packageIndex={index} field="title" className="block" />
                </h3>
                {isPopular && <Sparkles className="w-6 h-6" style={{ color: colorScheme.primary }} />}
              </div>

              {/* Price with background */}
              <div 
                className="rounded-2xl p-6 text-center"
                style={{ backgroundColor: `${colorScheme.primary}10` }}
              >
                <div className="text-5xl font-bold" style={{ color: colorScheme.primary }}>
                  $<EditableText value={pkg.price} packageIndex={index} field="price" className="inline-block" />
                </div>
                <p className="text-sm text-gray-600 mt-2">starting at</p>
              </div>

              <p className="text-sm text-gray-600 text-center leading-relaxed px-2">
                <EditableText value={pkg.description} packageIndex={index} field="description" className="block" multiline={editable} />
              </p>

              {/* Stats in colored boxes */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Photos', value: pkg.photo_count, field: 'photo_count' },
                  { label: 'Duration', value: pkg.session_length, field: 'session_length' },
                  { label: 'Delivery', value: pkg.turnaround, field: 'turnaround' }
                ].map((stat, idx) => (
                  <div 
                    key={idx}
                    className="rounded-xl p-3 text-center text-white"
                    style={{ backgroundColor: colorScheme.secondary }}
                  >
                    <div className="text-xs opacity-90">{stat.label}</div>
                    <div className="font-semibold text-sm mt-1">
                      <EditableText value={stat.value} packageIndex={index} field={stat.field} className="block" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Features with alternating background */}
              <div className="space-y-2">
                {pkg.features.slice(0, 5).map((feature, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 p-2 rounded-lg"
                    style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : `${colorScheme.primary}05` }}
                  >
                    <div 
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: colorScheme.primary }}
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 flex-1">
                      <EditableText value={feature} packageIndex={index} field={`feature-${idx}`} className="block" />
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="w-full h-11 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
                style={{ backgroundColor: colorScheme.primary }}
              >
                I'm Interested
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}