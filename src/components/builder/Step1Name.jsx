import React from 'react';
import { Package, Link } from 'lucide-react';

const slugify = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export default function Step1Name({ data, onChange, onNext }) {
  const name = data.package_set_name || '';
  const slug = slugify(name);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-3 text-gray-900">Name your package set</h2>
        <p className="text-gray-500 text-base">This will show in the link you send clients.</p>
      </div>

      <div>
        <div className="flex items-center gap-3 h-16 px-6 bg-gray-100 rounded-full focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            value={name}
            onChange={(e) => onChange({ package_set_name: e.target.value })}
            className="flex-1 text-lg bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            placeholder="e.g., Luxury Home Staging, HVAC Service Plan, Brand Video Package"
            autoFocus
          />
        </div>

        {slug && (
          <div className="flex items-center gap-2 mt-3 pl-6">
            <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-400">launch-box.io/yourbrand/</span>
            <span className="text-sm font-medium text-gray-700">{slug}</span>
          </div>
        )}
      </div>
    </div>
  );
}
