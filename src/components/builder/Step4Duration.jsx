import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DURATIONS = [
  { label: '3-5 days', unit: 'days' },
  { label: '1-3 weeks', unit: 'weeks' },
  { label: '1-3 months', unit: 'months' },
];

// Simple rule: Growth = midpoint (or the value itself for single input).
// Premium = Growth - 1. Starter = Growth + 1. Same unit always.
// For ranges: Premium = min, Growth = middle, Starter = max.
const calculateTierDurations = (min, max, unit) => {
  if (min === max) {
    // Single value: shift around it
    const premium = Math.max(1, min - 1);
    const growth = premium === min ? min + 1 : min;
    const starter = growth + 1;
    return { premium, growth, starter, unit };
  }

  // Range: Premium = min, Starter = max, Growth = midpoint
  let premium = min;
  let starter = max;
  let growth = Math.round((min + max) / 2);

  // Ensure all three are different
  if (growth <= premium) growth = premium + 1;
  if (growth >= starter) starter = growth + 1;

  return { premium, growth, starter, unit };
};

const formatDuration = (value, unit) => {
  if (value === 1) return `${value} ${unit.replace(/s$/, '')}`;
  return `${value} ${unit}`;
};

export default function Step4Duration({ data, onChange, onNext }) {
  const [customMin, setCustomMin] = React.useState('');
  const [customMax, setCustomMax] = React.useState('');
  const [customUnit, setCustomUnit] = React.useState('weeks');

  const selectedDuration = data.project_duration;

  const applyDuration = (label, min, max, unit) => {
    const tiers = calculateTierDurations(min, max, unit);
    onChange({
      project_duration: label,
      duration_min: min,
      duration_max: max,
      duration_unit: unit,
      duration_starter: { value: tiers.starter, unit: tiers.unit },
      duration_growth: { value: tiers.growth, unit: tiers.unit },
      duration_premium: { value: tiers.premium, unit: tiers.unit },
    });
  };

  const selectDuration = (duration) => {
    // Parse min/max from label like "3-5 days" or "1-3 weeks"
    const match = duration.label.match(/^(\d+)-(\d+)/);
    if (match) {
      applyDuration(duration.label, parseInt(match[1]), parseInt(match[2]), duration.unit);
    }
  };

  const selectOngoing = () => {
    onChange({
      project_duration: 'Ongoing',
      duration_min: null,
      duration_max: null,
      duration_unit: 'ongoing',
      duration_starter: null,
      duration_growth: null,
      duration_premium: null,
      pricing_availability: 'retainer'
    });
  };

  const applyCustom = () => {
    const min = parseInt(customMin);
    const max = parseInt(customMax);

    if (!isNaN(min) && min > 0) {
      const maxValue = !isNaN(max) && max > min ? max : min;
      const label = min === maxValue
        ? `${min} ${customUnit}`
        : `${min}-${maxValue} ${customUnit}`;

      applyDuration(label, min, maxValue, customUnit);
      setCustomMin('');
      setCustomMax('');
    }
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
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Duration</h2>
        <p className="text-gray-500 text-base">How long does this take to deliver?</p>
        <p className="text-sm text-gray-400 mt-2">Higher-paying clients value speed. Your premium package will get the fastest turnaround, starter gets the longest. You can always adjust this later.</p>
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
          Ongoing / Retainer
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-400">Or set your own:</p>
        <div className="flex gap-3 items-center">
          <Input
            type="number"
            min="1"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Min"
            className="h-12 bg-gray-100 border-0 text-gray-900 rounded-full px-5 w-24 focus:bg-white focus:ring-1 focus:ring-gray-300"
          />
          <span className="text-gray-400">to</span>
          <Input
            type="number"
            min="1"
            value={customMax}
            onChange={(e) => setCustomMax(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Max"
            className="h-12 bg-gray-100 border-0 text-gray-900 rounded-full px-5 w-24 focus:bg-white focus:ring-1 focus:ring-gray-300"
          />
          <select
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
            className="h-12 px-4 bg-gray-100 border-0 rounded-full text-gray-900 focus:ring-1 focus:ring-gray-300"
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
          <button
            onClick={applyCustom}
            disabled={!customMin}
            className="h-12 px-6 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 font-medium disabled:opacity-50 transition-colors"
          >
            Set
          </button>
        </div>
      </div>

      {/* Tier preview */}
      {data.duration_premium && data.duration_growth && data.duration_starter && selectedDuration !== 'Ongoing' && (
        <div className="p-5 bg-gray-50 rounded-xl">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-400 mb-1">Starter</div>
              <div className="text-lg font-bold text-gray-900">
                {formatDuration(data.duration_starter.value, data.duration_starter.unit)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Standard pace</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Growth</div>
              <div className="text-lg font-bold text-indigo-600">
                {formatDuration(data.duration_growth.value, data.duration_growth.unit)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Faster</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Premium</div>
              <div className="text-lg font-bold text-gray-900">
                {formatDuration(data.duration_premium.value, data.duration_premium.unit)}
              </div>
              <div className="text-xs text-gray-400 mt-1">Priority speed</div>
            </div>
          </div>
        </div>
      )}

      {selectedDuration === 'Ongoing' && (
        <div className="p-5 bg-gray-50 rounded-xl text-center">
          <div className="text-lg font-bold text-indigo-600">Ongoing Monthly Retainer</div>
          <p className="text-sm text-gray-400 mt-1">Continuous service with monthly billing</p>
        </div>
      )}
    </div>
  );
}
