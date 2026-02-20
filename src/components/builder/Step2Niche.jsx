
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const NICHES = [
  'E-commerce',
  'Real estate',
  'Fitness/Coaching',
  'SaaS/Startups',
  'Beauty/Fashion',
  'Food & Hospitality',
  'Education',
  'Events',
  'Agencies/Production companies',
  'Nonprofit',
  'Local services',
  'General / No specific niche'
];

export default function Step2Niche({ data, onChange, onNext }) {
  const [customNiche, setCustomNiche] = React.useState('');
  const selectedNiches = data.niches || [];

  const toggleNiche = (niche) => {
    let newNiches;
    if (niche === 'General / No specific niche') {
      newNiches = [niche];
    } else {
      newNiches = selectedNiches.includes(niche)
        ? selectedNiches.filter(n => n !== niche && n !== 'General / No specific niche')
        : [...selectedNiches.filter(n => n !== 'General / No specific niche'), niche];
    }
    onChange({ niches: newNiches });
  };

  const addCustomNiche = () => {
    if (customNiche.trim() && !selectedNiches.includes(customNiche.trim())) {
      onChange({ niches: [...selectedNiches.filter(n => n !== 'General / No specific niche'), customNiche.trim()] });
      setCustomNiche('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Pick a niche.</h2>
        <p className="text-gray-600">Select all that apply (or choose "General")</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {NICHES.map((niche) => (
          <Badge
            key={niche}
            onClick={() => toggleNiche(niche)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              selectedNiches.includes(niche)
                ? "bg-blue-500 text-white border-blue-500 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            )}
          >
            {niche}
          </Badge>
        ))}
      </div>

      <div className="flex gap-3">
        <Input
          value={customNiche}
          onChange={(e) => setCustomNiche(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomNiche()}
          placeholder="Other (type and press Enter)"
          className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
