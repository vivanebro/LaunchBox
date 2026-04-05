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
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Name your package set</h2>
        <p className="text-gray-500 text-base">This will show in the link you send clients.</p>
        <div className="flex items-center gap-1 mt-2 pl-0">
          <Link className="w-4 h-4 text-gray-400 flex-shrink-0 mr-1" />
          <span className="text-sm text-gray-400">launch-box.io/yourbrand/</span>
          {slug && <span className="text-sm font-medium text-gray-700">{slug}</span>}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 h-12 px-5 bg-gray-100 rounded-full focus-within:bg-white focus-within:shadow-sm focus-within:ring-1 focus-within:ring-gray-300 transition-all">
          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            value={name}
            onChange={(e) => onChange({ package_set_name: e.target.value })}
            className="flex-1 text-base bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            placeholder="e.g., Luxury Home Staging, HVAC Service Plan, Brand Video Package"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
