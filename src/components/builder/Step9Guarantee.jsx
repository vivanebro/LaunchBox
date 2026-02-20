import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const GUARANTEES = [
  'Unlimited revisions until you\'re happy',
  'Get your first cut within 48 hours or it\'s free',
  'On-time or it\'s on us',
  'We deliver in 7 days or it\'s free.',
  'We handle everything - you just show up',
  'If our ad doesn\'t outperform your last one, we fix it until it does.',
  'If we\'re late, we pay you $100 per day.'
];

export default function Step9Guarantee({ data, onChange, onNext }) {
  const [customGuarantee, setCustomGuarantee] = React.useState('');
  const selectedGuarantee = data.guarantee;

  const selectGuarantee = (guarantee) => {
    onChange({ guarantee });
  };

  const setCustom = () => {
    if (customGuarantee.trim()) {
      onChange({ guarantee: customGuarantee.trim() });
      setCustomGuarantee('');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">What guarantee do you offer?</h2>
        <p className="text-gray-600">This will be shown under all packages to build trust</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {GUARANTEES.map((guarantee) => (
          <Badge
            key={guarantee}
            onClick={() => selectGuarantee(guarantee)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              selectedGuarantee === guarantee
                ? "bg-blue-500 text-white border-blue-500 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            )}
          >
            {guarantee}
          </Badge>
        ))}
      </div>

      <div>
        <Input
          value={customGuarantee}
          onChange={(e) => setCustomGuarantee(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && setCustom()}
          placeholder="Custom guarantee (type and press Enter)"
          className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}