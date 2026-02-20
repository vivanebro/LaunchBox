import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';

export default function DesignVariation1({ packages, colorScheme, photographerName, onUpdate, editable = false }) {
  const [editingField, setEditingField] = useState(null);

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
            className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105"
          >
            {/* Colored header */}
            <div 
              className="p-8 text-white"
              style={{ background: `linear-gradient(135deg, ${colorScheme.primary} 0%, ${colorScheme.secondary} 100%)` }}
            >
              {isPopular && (
                <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-90">Most Popular</div>
              )}
              <h3 className="text-3xl font-bold mb-4">
                <EditableText value={pkg.title} packageIndex={index} field="title" className="block" />
              </h3>
              <div className="text-5xl font-bold">
                $<EditableText value={pkg.price} packageIndex={index} field="price" className="inline-block" />
              </div>
              <p className="text-sm mt-2 opacity-90">starting price</p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <p className="text-gray-600 text-sm leading-relaxed">
                <EditableText value={pkg.description} packageIndex={index} field="description" className="block" multiline={editable} />
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-bold text-gray-900">
                    <EditableText value={pkg.photo_count} packageIndex={index} field="photo_count" className="block" />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Photos</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-bold text-gray-900">
                    <EditableText value={pkg.session_length} packageIndex={index} field="session_length" className="block" />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Time</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="font-bold text-gray-900">
                    <EditableText value={pkg.turnaround} packageIndex={index} field="turnaround" className="block" />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Delivery</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500">Included</div>
                {pkg.features.slice(0, 5).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: colorScheme.primary }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 flex-1">
                      <EditableText value={feature} packageIndex={index} field={`feature-${idx}`} className="block" />
                    </span>
                  </div>
                ))}
              </div>

              <button
                className="w-full h-12 rounded-lg text-white font-semibold"
                style={{ backgroundColor: colorScheme.primary }}
              >
                Get Started
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}