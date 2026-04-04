import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const GUARANTEES = [
  'Unlimited revisions until you\'re happy',
  'On-time delivery or it\'s on us',
  'We handle everything, you just show up',
  '100% satisfaction or we redo it free',
  'If you don\'t see results, we keep working until you do',
  'Money-back guarantee if not delivered as promised',
  'We\'re not done until you\'re done',
];

export default function Step7Guarantee({ data, onChange, onNext }) {
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
        <h2 className="text-4xl font-bold mb-4 text-gray-900">What guarantee can you stand behind?</h2>
        <p className="text-gray-600">A strong guarantee removes risk and builds trust. This shows under all packages.</p>
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
          onKeyDown={(e) => e.key === 'Enter' && setCustom()}
          placeholder="Or write your own (press Enter)"
          className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
