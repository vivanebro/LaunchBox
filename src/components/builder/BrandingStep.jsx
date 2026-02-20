import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette } from 'lucide-react';

const presetColors = [
  { primary: '#1a1a1a', secondary: '#6b7280', name: 'Classic Charcoal' },
  { primary: '#0f172a', secondary: '#3b82f6', name: 'Midnight Blue' },
  { primary: '#065f46', secondary: '#10b981', name: 'Forest Green' },
  { primary: '#7c2d12', secondary: '#f97316', name: 'Autumn Orange' },
  { primary: '#4c1d95', secondary: '#a78bfa', name: 'Royal Purple' },
  { primary: '#be123c', secondary: '#fb7185', name: 'Rose Red' },
];

export default function BrandingStep({ data, onChange, onNext, onBack }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-light mb-3 text-neutral-900">Your brand colors</h2>
        <p className="text-neutral-500 text-lg">Choose colors that represent your style</p>
      </div>

      <div className="space-y-8 mb-12">
        <div>
          <Label className="text-sm font-medium text-neutral-700 mb-4 block flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Quick Presets
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {presetColors.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onChange({ primary_color: preset.primary, secondary_color: preset.secondary })}
                className="group p-4 rounded-xl border-2 transition-all hover:shadow-md"
                style={{
                  borderColor: data.primary_color === preset.primary ? preset.primary : '#e5e5e5'
                }}
              >
                <div className="flex gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: preset.primary }} />
                  <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: preset.secondary }} />
                </div>
                <p className="text-xs font-medium text-neutral-600">{preset.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-3 block">Primary Color</Label>
            <div className="flex gap-3 items-center">
              <Input
                type="color"
                value={data.primary_color || '#1a1a1a'}
                onChange={(e) => onChange({ primary_color: e.target.value })}
                className="h-14 w-20 cursor-pointer"
              />
              <Input
                type="text"
                value={data.primary_color || '#1a1a1a'}
                onChange={(e) => onChange({ primary_color: e.target.value })}
                placeholder="#1a1a1a"
                className="h-14 flex-1 border-neutral-200"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-neutral-700 mb-3 block">Secondary Color</Label>
            <div className="flex gap-3 items-center">
              <Input
                type="color"
                value={data.secondary_color || '#6b7280'}
                onChange={(e) => onChange({ secondary_color: e.target.value })}
                className="h-14 w-20 cursor-pointer"
              />
              <Input
                type="text"
                value={data.secondary_color || '#6b7280'}
                onChange={(e) => onChange({ secondary_color: e.target.value })}
                placeholder="#6b7280"
                className="h-14 flex-1 border-neutral-200"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-medium text-neutral-700 mb-3 block">Contact Information</Label>
          <Input
            value={data.contact_email || ''}
            onChange={(e) => onChange({ contact_email: e.target.value })}
            placeholder="hello@yourphoto.com"
            type="email"
            className="h-12 border-neutral-200"
          />
          <Input
            value={data.phone || ''}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            className="h-12 border-neutral-200"
          />
          <Input
            value={data.website || ''}
            onChange={(e) => onChange({ website: e.target.value })}
            placeholder="www.yourphoto.com"
            className="h-12 border-neutral-200"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" className="h-12 px-8 text-base">
          Back
        </Button>
        <Button
          onClick={onNext}
          className="h-12 px-8 text-base bg-neutral-900 hover:bg-neutral-800"
        >
          Preview & Download
        </Button>
      </div>
    </div>
  );
}