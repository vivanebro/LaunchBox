import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const QUICK_PRICES = [
  { label: '$500', value: 500 },
  { label: '$1,000', value: 1000 },
  { label: '$2,000', value: 2000 },
  { label: '$3,500', value: 3500 },
  { label: '$5,000', value: 5000 },
  { label: '$7,500', value: 7500 },
  { label: '$10,000', value: 10000 },
  { label: '$15,000', value: 15000 },
];

const roundToNearest50IfNeeded = (price) => {
  const remainder = price % 50;
  if (remainder === 0) return price;
  return Math.ceil(price / 50) * 50;
};

// Strategy B (default): Sell the Premium
// typical_price becomes the Growth price
// Premium is Growth + 20% (small gap = obvious best value)
// Starter is half of Growth
const calculateStrategyB = (typicalPrice) => {
  const growth = typicalPrice;
  const premium = roundToNearest50IfNeeded(Math.round(growth * 1.20));
  const starter = roundToNearest50IfNeeded(Math.round(growth * 0.50));

  const starterRetainer = roundToNearest50IfNeeded(Math.round(starter * 0.85));
  const growthRetainer = roundToNearest50IfNeeded(Math.round(growth * 0.85));
  const premiumRetainer = roundToNearest50IfNeeded(Math.round(premium * 0.85));

  return {
    price_starter: starter,
    price_growth: growth,
    price_premium: premium,
    price_starter_retainer: starterRetainer,
    price_growth_retainer: growthRetainer,
    price_premium_retainer: premiumRetainer,
    pricing_strategy: 'B',
  };
};

export default function Step5Pricing({ data, onChange, onNext }) {
  const [customPrice, setCustomPrice] = React.useState('');
  const typicalPrice = data.typical_price;

  const selectPrice = (value) => {
    const rounded = roundToNearest50IfNeeded(value);
    const prices = calculateStrategyB(rounded);
    onChange({
      typical_price: rounded,
      price_range: `$${rounded.toLocaleString()}`,
      ...prices,
    });
  };

  const applyCustom = () => {
    if (customPrice.trim()) {
      const parsed = parseInt(customPrice.replace(/[^0-9]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        selectPrice(parsed);
        setCustomPrice('');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Pricing</h2>
        <p className="text-gray-500 text-base">What do you usually charge for something like this? We'll build the tiers around it.</p>
        <p className="text-sm text-gray-400 mt-2">Just the number in your head. You can adjust everything on the results page.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {QUICK_PRICES.map(({ label, value }) => (
          <Badge
            key={value}
            onClick={() => selectPrice(value)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              typicalPrice === value
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
            )}
          >
            {label}
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
          placeholder="Or type your price (e.g., 3500)"
          className="flex-1 h-12 bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-full px-5"
        />
        <button
          onClick={applyCustom}
          disabled={!customPrice.trim()}
          className="h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 flex-shrink-0 flex items-center justify-center transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {typicalPrice > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 p-5 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">Starter</div>
              <div className="text-2xl font-bold text-gray-900">${data.price_starter?.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">Entry option</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">Growth</div>
              <div className="text-2xl font-bold text-indigo-600">${data.price_growth?.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">Your typical price</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">Premium</div>
              <div className="text-2xl font-bold text-gray-900">${data.price_premium?.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">Best value</div>
            </div>
          </div>

          <p className="text-sm text-gray-400">
            Your price becomes Growth. Premium is just 20% more with everything included. Adjust on the results page.
          </p>

          {data.price_starter_retainer && (
            <div className="grid grid-cols-3 gap-4 p-5 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-2">Starter /mo</div>
                <div className="text-2xl font-bold text-gray-900">${data.price_starter_retainer?.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">15% off</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-2">Growth /mo</div>
                <div className="text-2xl font-bold text-indigo-600">${data.price_growth_retainer?.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">15% off</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-2">Premium /mo</div>
                <div className="text-2xl font-bold text-gray-900">${data.price_premium_retainer?.toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">15% off</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
