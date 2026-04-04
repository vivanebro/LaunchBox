import React from 'react';
import { Input } from '@/components/ui/input';
import { Package } from 'lucide-react';

export default function Step1Name({ data, onChange, onNext }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Name your package set</h2>
        <p className="text-gray-600">This is just for you to find it later. Clients won't see this name.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={data.package_set_name || ''}
            onChange={(e) => onChange({ package_set_name: e.target.value })}
            className="h-14 pl-12 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g., Website Redesign, Monthly Retainer, Event Coverage..."
            autoFocus />
        </div>
      </div>
    </div>);
}
