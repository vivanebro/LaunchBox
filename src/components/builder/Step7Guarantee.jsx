import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

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

  const applyCustom = () => {
    if (customGuarantee.trim()) {
      onChange({ guarantee: customGuarantee.trim() });
      setCustomGuarantee('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Guarantee</h2>
        <p className="text-gray-500 text-base">A strong guarantee removes risk and makes it easier to say yes. This shows under all packages.</p>
        <p className="text-sm text-gray-400 mt-2">Pick the one you can actually stand behind</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {GUARANTEES.map((guarantee) => (
          <Badge
            key={guarantee}
            onClick={() => selectGuarantee(guarantee)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              selectedGuarantee === guarantee
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
            )}
          >
            {guarantee}
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={customGuarantee}
          onChange={(e) => setCustomGuarantee(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
          placeholder="Or write your own..."
          className="flex-1 h-12 bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-full px-5"
        />
        <button
          onClick={applyCustom}
          disabled={!customGuarantee.trim()}
          className="h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 flex-shrink-0 flex items-center justify-center transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {selectedGuarantee && (
        <div className="p-5 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-400 mb-2">Preview</p>
          <p className="text-base font-medium text-gray-900">{selectedGuarantee}</p>
        </div>
      )}
    </div>
  );
}
