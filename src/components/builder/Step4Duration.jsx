import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const DURATIONS = [
  { label: '3-5 days', min: 3, max: 5, unit: 'days' },
  { label: '1 week', min: 1, max: 1, unit: 'weeks' },
  { label: '2 weeks', min: 2, max: 2, unit: 'weeks' },
  { label: '2-4 weeks', min: 2, max: 4, unit: 'weeks' },
  { label: '3-4 weeks', min: 3, max: 4, unit: 'weeks' },
  { label: '1-2 months', min: 1, max: 2, unit: 'months' },
];

export default function Step4Duration({ data, onChange, onNext }) {
  const [customValue, setCustomValue] = React.useState('');

  const selectedDuration = data.project_duration;

  const selectDuration = (duration) => {
    onChange({
      project_duration: duration.label,
      duration_min: duration.min,
      duration_max: duration.max,
      duration_unit: duration.unit
    });
  };

  const selectOngoing = () => {
    onChange({
      project_duration: 'Ongoing',
      duration_min: null,
      duration_max: null,
      duration_unit: 'ongoing',
      pricing_availability: 'retainer'
    });
  };

  const applyCustom = () => {
    const val = customValue.trim();
    if (!val) return;

    // Try to parse "2-3 months", "6 weeks", "10 days" etc.
    const rangeMatch = val.match(/^(\d+)\s*-\s*(\d+)\s*(days?|weeks?|months?)?$/i);
    const singleMatch = val.match(/^(\d+)\s*(days?|weeks?|months?)?$/i);

    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      const unit = rangeMatch[3] ? rangeMatch[3].replace(/s$/, '') + 's' : 'weeks';
      onChange({
        project_duration: `${min}-${max} ${unit}`,
        duration_min: min,
        duration_max: max,
        duration_unit: unit
      });
    } else if (singleMatch) {
      const num = parseInt(singleMatch[1]);
      const unit = singleMatch[2] ? singleMatch[2].replace(/s$/, '') + 's' : 'weeks';
      onChange({
        project_duration: `${num} ${unit}`,
        duration_min: num,
        duration_max: num,
        duration_unit: unit
      });
    } else {
      // Freeform text fallback
      onChange({
        project_duration: val,
        duration_min: null,
        duration_max: null,
        duration_unit: null
      });
    }
    setCustomValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustom();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-gray-900">How long does this take to deliver?</h2>
        <p className="text-gray-500 text-base">From start to finish, what should a client expect?</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {DURATIONS.map((duration) => (
          <Badge
            key={duration.label}
            onClick={() => selectDuration(duration)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              selectedDuration === duration.label
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
            )}
          >
            {duration.label}
          </Badge>
        ))}
        <Badge
          onClick={selectOngoing}
          className={cn(
            "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
            selectedDuration === 'Ongoing'
              ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
              : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
          )}
        >
          Ongoing / monthly
        </Badge>
      </div>

      <div className="flex gap-2">
        <Input
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Or type your own (e.g., 6 weeks, 2-3 months)"
          className="flex-1 h-12 bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-full px-5"
        />
        <button
          onClick={applyCustom}
          disabled={!customValue.trim()}
          className="h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 flex-shrink-0 flex items-center justify-center transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
