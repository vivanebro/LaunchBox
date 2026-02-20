
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const VIDEO_TYPES = [
  'Product videos',
  'UGC / Social ads',
  'Brand films',
  'Corporate videos',
  'Event videos',
  'Testimonials / Case studies',
  'YouTube / Long-form',
  'Short-form Reels / TikToks',
  'Music videos',
  'Real-estate videos',
  'Documentary / Storytelling',
  'Animation / Motion graphics',
  'Wedding videos',
  'Educational / Course',
  'Food / Restaurant',
  'Fitness / Coaching',
  'Fashion / Beauty'
];

export default function Step3VideoTypes({ data, onChange, onNext }) {
  const [customType, setCustomType] = React.useState('');
  const selectedTypes = data.video_types || [];

  const toggleType = (type) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onChange({ video_types: newTypes });
  };

  const addCustomType = () => {
    if (customType.trim() && !selectedTypes.includes(customType.trim())) {
      onChange({ video_types: [...selectedTypes, customType.trim()] });
      setCustomType('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">What type of videos do you offer?</h2>
        <p className="text-gray-600">Select all that apply</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {VIDEO_TYPES.map((type) => (
          <Badge
            key={type}
            onClick={() => toggleType(type)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              selectedTypes.includes(type)
                ? "bg-blue-500 text-white border-blue-500 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            )}
          >
            {type}
          </Badge>
        ))}
      </div>

      <div className="flex gap-3">
        <Input
          value={customType}
          onChange={(e) => setCustomType(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomType()}
          placeholder="Other (type and press Enter)"
          className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}
