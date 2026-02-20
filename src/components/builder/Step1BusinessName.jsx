import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Step1BusinessName({ data, onChange, onNext }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">What's your business name?</h2>
        <p className="text-gray-600">We'll use this to personalize your packages</p>
      </div>

      <Input
        value={data.business_name || ''}
        onChange={(e) => onChange({ business_name: e.target.value })}
        placeholder="e.g. BrightFrame Studio"
        className="h-16 text-lg bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
      />

      <Button
        onClick={() => {
          if (!data.business_name) {
            onChange({ business_name: 'My Studio' });
          }
          onNext();
        }}
        variant="ghost"
        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      >
        Skip this step
      </Button>
    </div>
  );
}