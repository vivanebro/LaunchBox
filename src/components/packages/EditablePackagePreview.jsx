import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EditablePackagePreview({ packages, colorScheme, photographerName, DesignComponent, onUpdate }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedPackage, setEditedPackage] = useState(null);

  const startEditing = (index) => {
    setEditingIndex(index);
    setEditedPackage({ ...packages[index] });
  };

  const saveEdits = () => {
    if (editingIndex !== null && editedPackage) {
      const newPackages = [...packages];
      newPackages[editingIndex] = editedPackage;
      onUpdate(newPackages);
      setEditingIndex(null);
      setEditedPackage(null);
    }
  };

  const cancelEdits = () => {
    setEditingIndex(null);
    setEditedPackage(null);
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...editedPackage.features];
    newFeatures[index] = value;
    setEditedPackage({ ...editedPackage, features: newFeatures });
  };

  const addFeature = () => {
    setEditedPackage({
      ...editedPackage,
      features: [...editedPackage.features, '']
    });
  };

  const removeFeature = (index) => {
    const newFeatures = editedPackage.features.filter((_, i) => i !== index);
    setEditedPackage({ ...editedPackage, features: newFeatures });
  };

  if (editingIndex !== null && editedPackage) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-xl border-2" style={{ borderColor: `${colorScheme.primary}50` }}>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold" style={{ color: colorScheme.primary }}>
            Edit {packages[editingIndex].title}
          </h3>
          <div className="flex gap-2">
            <Button onClick={saveEdits} size="sm" className="gap-2" style={{ backgroundColor: colorScheme.primary }}>
              <Check className="w-4 h-4" />
              Save
            </Button>
            <Button onClick={cancelEdits} size="sm" variant="outline" className="gap-2">
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-2 block">Package Title</label>
            <Input
              value={editedPackage.title}
              onChange={(e) => setEditedPackage({ ...editedPackage, title: e.target.value })}
              className="h-12 text-lg border-2"
              style={{ borderColor: `${colorScheme.primary}30` }}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-2 block">Price ($)</label>
            <Input
              type="number"
              value={editedPackage.price}
              onChange={(e) => setEditedPackage({ ...editedPackage, price: parseFloat(e.target.value) })}
              className="h-12 text-lg border-2"
              style={{ borderColor: `${colorScheme.primary}30` }}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-700 mb-2 block">Description</label>
            <Textarea
              value={editedPackage.description}
              onChange={(e) => setEditedPackage({ ...editedPackage, description: e.target.value })}
              className="h-24 border-2"
              style={{ borderColor: `${colorScheme.primary}30` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-2 block">Photo Count</label>
              <Input
                value={editedPackage.photo_count}
                onChange={(e) => setEditedPackage({ ...editedPackage, photo_count: e.target.value })}
                className="h-12 border-2"
                style={{ borderColor: `${colorScheme.primary}30` }}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-2 block">Session Length</label>
              <Input
                value={editedPackage.session_length}
                onChange={(e) => setEditedPackage({ ...editedPackage, session_length: e.target.value })}
                className="h-12 border-2"
                style={{ borderColor: `${colorScheme.primary}30` }}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-2 block">Turnaround</label>
              <Input
                value={editedPackage.turnaround}
                onChange={(e) => setEditedPackage({ ...editedPackage, turnaround: e.target.value })}
                className="h-12 border-2"
                style={{ borderColor: `${colorScheme.primary}30` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-neutral-700">Features</label>
              <Button onClick={addFeature} size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Feature
              </Button>
            </div>
            <div className="space-y-2">
              {editedPackage.features.map((feature, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(idx, e.target.value)}
                    className="h-10 border-2"
                    style={{ borderColor: `${colorScheme.primary}30` }}
                    placeholder="Feature description"
                  />
                  <Button
                    onClick={() => removeFeature(idx)}
                    size="sm"
                    variant="outline"
                    className="px-3"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <DesignComponent
        packages={packages}
        colorScheme={colorScheme}
        photographerName={photographerName}
      />
      
      {/* Edit buttons overlay */}
      <div className="absolute top-4 right-4 flex gap-2">
        {packages.map((_, index) => (
          <Button
            key={index}
            onClick={() => startEditing(index)}
            size="sm"
            className="gap-2 shadow-lg"
            style={{ backgroundColor: colorScheme.primary }}
          >
            <Pencil className="w-4 h-4" />
            Edit {['Starter', 'Professional', 'Premium'][index]}
          </Button>
        ))}
      </div>
    </div>
  );
}