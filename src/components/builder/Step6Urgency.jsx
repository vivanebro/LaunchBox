import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const URGENCY_OPTIONS = [
  'Only 2 new clients per month',
  'Only 3 spots available this quarter',
  'Pricing valid until end of month',
  'Bonuses included only this month',
  'Schedule fills up fast during peak season',
  'Currently booking 4-6 weeks out',
];

export default function Step6Urgency({ data, onChange, onNext }) {
  const [customUrgency, setCustomUrgency] = React.useState('');
  const selectedUrgency = data.urgency;

  const selectUrgency = (urgency) => {
    onChange({ urgency });
  };

  const setCustom = () => {
    if (customUrgency.trim()) {
      onChange({ urgency: customUrgency.trim() });
      setCustomUrgency('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Any reason to act now?</h2>
        <p className="text-gray-600">Urgency and scarcity encourage clients to decide faster. Optional but effective.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {URGENCY_OPTIONS.map((urgency) => (
          <Badge
            key={urgency}
            onClick={() => selectUrgency(urgency)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              selectedUrgency === urgency
                ? "bg-blue-500 text-white border-blue-500 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            )}
          >
            {urgency}
          </Badge>
        ))}
      </div>

      <div>
        <Input
          value={customUrgency}
          onChange={(e) => setCustomUrgency(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setCustom()}
          placeholder="Or write your own (press Enter)"
          className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
