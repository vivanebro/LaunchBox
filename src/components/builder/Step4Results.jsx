
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const RESULTS = [
  'Increase sales',
  'Generate leads',
  'Grow brand awareness',
  'Build trust & credibility',
  'Get more content for social',
  'Boost engagement',
  'Attract investors',
  'Retain customers',
  'Launch a new product',
  'Fill events / workshops'
];

export default function Step4Results({ data, onChange, onNext }) {
  const [customResult, setCustomResult] = React.useState('');
  const selectedResults = data.desired_results || [];

  const toggleResult = (result) => {
    const newResults = selectedResults.includes(result)
      ? selectedResults.filter(r => r !== result)
      : [...selectedResults, result];
    onChange({ desired_results: newResults });
  };

  const addCustomResult = () => {
    if (customResult.trim() && !selectedResults.includes(customResult.trim())) {
      onChange({ desired_results: [...selectedResults, customResult.trim()] });
      setCustomResult('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">What results are we aiming for?</h2>
        <p className="text-gray-600">Select the outcomes your videos help achieve</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {RESULTS.map((result) => (
          <Badge
            key={result}
            onClick={() => toggleResult(result)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              selectedResults.includes(result)
                ? "bg-blue-500 text-white border-blue-500 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            )}
          >
            {result}
          </Badge>
        ))}
      </div>

      <div className="flex gap-3">
        <Input
          value={customResult}
          onChange={(e) => setCustomResult(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomResult()}
          placeholder="Other (type and press Enter)"
          className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
