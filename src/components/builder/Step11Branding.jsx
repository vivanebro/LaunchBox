import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Red', color: '#ff0044' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Purple', color: '#A855F7' },
  { name: 'Green', color: '#10B981' },
  { name: 'Orange', color: '#F59E0B' },
  { name: 'Pink', color: '#F472B6' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Indigo', color: '#6366F1' }
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' }
];

export default function Step11Branding({ data, onChange, onNext }) {
  const [uploading, setUploading] = useState(false);
  const [customColor, setCustomColor] = useState('');

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const file_url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      onChange({ logo_url: file_url });
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Failed to upload logo. Please try again.');
    }
    setUploading(false);
  };

  const applyCustomColor = () => {
    if (!customColor) return;
    
    let cleanColor = customColor.trim().replace('#', '');
    
    if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanColor)) {
      if (cleanColor.length === 3) {
        cleanColor = cleanColor.split('').map(c => c + c).join('');
      }
      onChange({ brand_color: `#${cleanColor}` });
      setCustomColor('');
    } else {
      alert('Please enter a valid hex color (e.g., FF0044 or F04)');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Make it yours</h2>
        <p className="text-gray-600">Add your logo and choose your brand colors</p>
      </div>

      {/* Logo Upload */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700 block">Logo (Optional)</label>
        {data.logo_url ? (
          <div className="flex items-center gap-4">
            <img 
              src={data.logo_url} 
              alt="Logo preview" 
              className="h-16 w-auto object-contain border border-gray-200 rounded-lg p-2 bg-white"
            />
            <Button
              variant="outline"
              onClick={() => onChange({ logo_url: '' })}
              className="text-sm"
            >
              Remove Logo
            </Button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="logo-upload"
              className={`flex items-center justify-center gap-2 h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-sm text-gray-600">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Click to upload logo</span>
                </>
              )}
            </label>
          </div>
        )}
      </div>

      {/* Brand Color */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700 block">Brand Color</label>
        <div className="flex flex-wrap gap-3">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.color}
              onClick={() => onChange({ brand_color: preset.color })}
              className={`w-14 h-14 rounded-xl border-2 transition-all hover:scale-105 ${
                data.brand_color === preset.color ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900' : 'border-gray-300'
              }`}
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}
        </div>
        
        <div className="flex gap-3 items-center">
          <Input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && applyCustomColor()}
            placeholder="Custom hex (e.g., 3B82F6)"
            className="h-12 bg-white border-gray-300 text-gray-900 font-mono"
          />
          <Button
            onClick={applyCustomColor}
            variant="outline"
            className="h-12 px-6"
          >
            Apply
          </Button>
        </div>

        {data.brand_color && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div 
              className="w-10 h-10 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: data.brand_color }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Current Brand Color</p>
              <p className="text-xs text-gray-500 font-mono">{data.brand_color}</p>
            </div>
          </div>
        )}
      </div>

      {/* Currency Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700 block">Currency</label>
        <p className="text-xs text-gray-500 mb-3">Choose the currency for your pricing</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              onClick={() => onChange({ currency: currency.code })}
              className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                (data.currency || 'USD') === currency.code
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <div className="text-2xl mb-1">{currency.symbol}</div>
              <div className="text-xs font-semibold text-gray-900">{currency.code}</div>
              <div className="text-xs text-gray-500">{currency.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}