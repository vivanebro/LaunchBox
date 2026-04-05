import React from 'react';
import { Input } from '@/components/ui/input';
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
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Name your package set</h2>
        <p className="text-gray-600">This becomes part of the link you send to clients.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={name}
            onChange={(e) => onChange({ package_set_name: e.target.value })}
            className="h-14 pl-12 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Website Redesign, Monthly Retainer, Event Coverage..."
            autoFocus
          />
        </div>

        {slug && (
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-500">launch-box.io/yourbrand/</span>
            <span className="text-sm font-medium text-gray-900">{slug}</span>
          </div>
        )}
      </div>
    </div>
  );
}
