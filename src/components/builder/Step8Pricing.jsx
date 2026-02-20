import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const PRICE_RANGES = [
{ label: 'Starter: $750', midpoint: 750 },
{ label: 'Starter: $2,000', midpoint: 2000 },
{ label: 'Starter: $4,000', midpoint: 4000 },
{ label: 'Starter: $7,500', midpoint: 7500 },
{ label: 'Starter: $15,000', midpoint: 15000 }];


// Helper function to round prices up to nearest 50 only if needed
const roundToNearest50IfNeeded = (price) => {
  const remainder = price % 50;
  if (remainder === 0) {
    return price; // Already divisible by 50, no rounding needed
  }
  return Math.ceil(price / 50) * 50; // Round up to nearest 50
};

export default function Step8Pricing({ data, onChange, onNext }) {
  const [customRange, setCustomRange] = React.useState('');
  const selectedRange = data.price_range;

  const selectRange = (range, starter) => {
    const growth = roundToNearest50IfNeeded(starter * 2); // Growth is 200% of starter
    const premium = roundToNearest50IfNeeded(growth * 1.20); // Premium is 120% of growth

    // Also calculate retainer prices with 15% discount
    const starterRetainer = roundToNearest50IfNeeded(Math.round(starter * 0.85));
    const growthRetainer = roundToNearest50IfNeeded(Math.round(growth * 0.85));
    const premiumRetainer = roundToNearest50IfNeeded(Math.round(premium * 0.85));

    onChange({
      price_range: range,
      price_starter: starter,
      price_growth: growth,
      price_premium: premium,
      price_starter_retainer: starterRetainer,
      price_growth_retainer: growthRetainer,
      price_premium_retainer: premiumRetainer
    });
  };

  const setCustom = () => {
    if (customRange.trim()) {
      const starter = parseInt(customRange.replace(/[^0-9]/g, ''));
      if (!isNaN(starter) && starter > 0) {
        const roundedStarter = roundToNearest50IfNeeded(starter);
        selectRange(`Starter: $${roundedStarter.toLocaleString()}`, roundedStarter);
        setCustomRange('');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">What's your typical starter price?</h2>
        <p className="text-gray-600">We'll calculate Growth (100% of Starter) and Premium (20% of Growth) automatically</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {PRICE_RANGES.map(({ label, midpoint }) =>
        <Badge
          key={label}
          onClick={() => selectRange(label, midpoint)}
          className={cn(
            "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
            selectedRange === label ?
            "bg-blue-500 text-white border-blue-500 shadow-md" :
            "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
          )}>

            {label}
          </Badge>
        )}
      </div>

      <div className="flex gap-3">
        <Input
          value={customRange}
          onChange={(e) => setCustomRange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && setCustom()}
          placeholder="Custom starter price (e.g., 3500)"
          className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500" />
        <Button
          onClick={setCustom}
          disabled={!customRange.trim()}
          className="h-12 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
        >
          Apply <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Preview Pricing */}
      {data.price_starter &&
      <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Starter</div>
              <div className="text-2xl font-bold text-gray-900">${data.price_starter.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Base price</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Growth</div>
              <div className="text-2xl font-bold text-blue-600">${data.price_growth.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">200% of Starter</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Premium</div>
              <div className="text-2xl font-bold text-gray-900">${data.price_premium.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">120% of Growth</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Starter Retainer</div>
              <div className="text-2xl font-bold text-gray-900">${data.price_starter_retainer?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">15% discount</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Growth Retainer</div>
              <div className="text-2xl font-bold text-green-600">${data.price_growth_retainer?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">15% discount</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Premium Retainer</div>
              <div className="text-2xl font-bold text-gray-900">${data.price_premium_retainer?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">15% discount</div>
            </div>
          </div>
        </div>
      }
    </div>);

}