import React from 'react';
import { Input } from '@/components/ui/input';
import { Package } from 'lucide-react';

export default function Step1PackageName({ data, onChange, onNext }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Name your package set</h2>
        <p className="text-gray-600 mb-2">Give this package set a name so you can find it easily later (clients won't see it)</p>
        <p className="text-sm text-gray-500 italic"></p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={data.package_set_name || ''}
            onChange={(e) => onChange({ package_set_name: e.target.value })}
            className="h-14 pl-12 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Wedding Package 2025, Corporate Video Prices, etc."
            autoFocus />

        </div>
      </div>
    </div>);

}