import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const URGENCY_OPTIONS = [
  'Limited to X spots per month',
  'Currently booked X weeks in advance',
  'Prices increase next month',
  'Bonus offer ends this month',
];

export default function Step6Urgency({ data, onChange, onNext }) {
  const [customUrgency, setCustomUrgency] = React.useState('');
  const selectedUrgency = data.urgency;

  const selectUrgency = (urgency) => {
    onChange({ urgency });
  };

  const applyCustom = () => {
    if (customUrgency.trim()) {
      onChange({ urgency: customUrgency.trim() });
      setCustomUrgency('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Urgency</h2>
        <p className="text-gray-500 text-base">Any reason for the client to act now instead of "thinking about it"?</p>
        <p className="text-sm text-gray-400 mt-2">This shows as a note on your package page. Scarcity and deadlines help clients decide faster. Optional -- skip if it doesn't apply. You can always add or change this later.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {URGENCY_OPTIONS.map((urgency) => (
          <Badge
            key={urgency}
            onClick={() => selectUrgency(urgency)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              selectedUrgency === urgency
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
            )}
          >
            {urgency}
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={customUrgency}
          onChange={(e) => setCustomUrgency(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
          placeholder="Or write your own..."
          className="flex-1 h-12 bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-full px-5"
        />
        <button
          onClick={applyCustom}
          disabled={!customUrgency.trim()}
          className="h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 flex-shrink-0 flex items-center justify-center transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {selectedUrgency && (
        <div className="p-5 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-400 mb-2">Preview</p>
          <p className="text-base font-medium text-gray-900">{selectedUrgency}</p>
        </div>
      )}
    </div>
  );
}
