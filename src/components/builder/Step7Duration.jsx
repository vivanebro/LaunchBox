import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DURATIONS = [
  { label: '3-5 days', min: 3, max: 5, unit: 'days' },
  { label: '1 week', min: 1, max: 1, unit: 'weeks' },
  { label: '2 weeks', min: 2, max: 2, unit: 'weeks' },
  { label: '2-4 weeks', min: 2, max: 4, unit: 'weeks' },
  { label: '3-4 weeks', min: 3, max: 4, unit: 'weeks' },
  { label: '1-2 months', min: 1, max: 2, unit: 'months' },
];

export default function Step7Duration({ data, onChange, onNext }) {
  const [customMin, setCustomMin] = React.useState('');
  const [customMax, setCustomMax] = React.useState('');
  const [customUnit, setCustomUnit] = React.useState('weeks');

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

  const setCustom = () => {
    const min = parseInt(customMin);
    const max = parseInt(customMax);
    
    if (!isNaN(min) && min > 0) {
      const maxValue = !isNaN(max) && max > min ? max : min;
      const label = min === maxValue 
        ? `${min} ${customUnit}`
        : `${min}-${maxValue} ${customUnit}`;
      
      onChange({ 
        project_duration: label,
        duration_min: min,
        duration_max: maxValue,
        duration_unit: customUnit
      });
      setCustomMin('');
      setCustomMax('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">How long does a project usually take?</h2>
        <p className="text-gray-600">Select typical turnaround time, or choose ongoing for continuous monthly service.</p>
      </div>

      <div className="mb-4">
        <Badge
          onClick={selectOngoing}
          className={cn(
            "cursor-pointer px-8 py-4 text-base font-semibold transition-all hover:scale-105 border-2",
            selectedDuration === 'Ongoing'
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg"
              : "bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50"
          )}
        >
          ✨ Ongoing Monthly Service
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        {DURATIONS.map((duration) => (
          <Badge
            key={duration.label}
            onClick={() => selectDuration(duration)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              selectedDuration === duration.label
                ? "bg-blue-500 text-white border-blue-500 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            )}
          >
            {duration.label}
          </Badge>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Custom duration:</p>
        <div className="flex gap-3 items-center">
          <Input
            type="number"
            min="1"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            placeholder="Min"
            className="h-12 bg-white border-gray-300 text-gray-900 w-24"
          />
          <span className="text-gray-500">to</span>
          <Input
            type="number"
            min="1"
            value={customMax}
            onChange={(e) => setCustomMax(e.target.value)}
            placeholder="Max (optional)"
            className="h-12 bg-white border-gray-300 text-gray-900 w-32"
          />
          <select
            value={customUnit}
            onChange={(e) => setCustomUnit(e.target.value)}
            className="h-12 px-4 bg-white border border-gray-300 rounded-md text-gray-900"
          >
            <option value="days">days</option>
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
          <button
            onClick={setCustom}
            className="h-12 px-6 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium"
          >
            Set
          </button>
        </div>
      </div>

      {/* Preview */}
      {selectedDuration === 'Ongoing' && (
        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-900 mb-3">Service Model:</h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Ongoing Monthly Retainer
            </div>
            <p className="text-sm text-gray-600 mt-2">Continuous service with monthly billing</p>
          </div>
        </div>
      )}
      
      {data.duration_min && data.duration_max && selectedDuration !== 'Ongoing' && (
        <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Delivery Timeline Preview:</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">Starter</div>
              <div className="text-lg font-bold text-gray-900">
                {data.duration_max} {data.duration_unit}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Growth</div>
              <div className="text-lg font-bold text-blue-600">
                {data.duration_min === data.duration_max 
                  ? data.duration_max 
                  : Math.ceil((data.duration_min + data.duration_max) / 2)} {data.duration_unit}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Premium</div>
              <div className="text-lg font-bold text-gray-900">
                {data.duration_min} {data.duration_unit}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}