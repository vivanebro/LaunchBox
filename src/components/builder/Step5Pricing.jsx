import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">What do you usually charge for something like this?</h2>
        <p className="text-gray-600">Just the number you already have in your head. We'll build the package pricing around it.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {QUICK_PRICES.map(({ label, value }) => (
          <Badge
            key={value}
            onClick={() => selectPrice(value)}
            className={cn(
              "cursor-pointer px-6 py-3 text-sm font-medium transition-all hover:scale-105 border-2",
              typicalPrice === value
                ? "bg-blue-500 text-white border-blue-500 shadow-md"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50"
            )}
          >
            {label}
          </Badge>
        ))}
      </div>

      <div className="flex gap-3">
        <Input
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
          placeholder="Or type your price (e.g., 3500)"
          className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
        <Button
          onClick={applyCustom}
          disabled={!customPrice.trim()}
          className="h-12 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
        >
          Apply <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {typicalPrice > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Starter</div>
              <div className="text-2xl font-bold text-gray-900">${data.price_starter?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Entry option</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Growth</div>
              <div className="text-2xl font-bold text-blue-600">${data.price_growth?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Your typical price</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Premium</div>
              <div className="text-2xl font-bold text-gray-900">${data.price_premium?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Best value</div>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Your price becomes the Growth package. Premium is just 20% more with everything included. You can adjust all prices on the next page.
          </p>

          {data.price_starter_retainer && (
            <div className="grid grid-cols-3 gap-4 p-6 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Starter /mo</div>
                <div className="text-2xl font-bold text-gray-900">${data.price_starter_retainer?.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">15% off</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Growth /mo</div>
                <div className="text-2xl font-bold text-green-600">${data.price_growth_retainer?.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">15% off</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Premium /mo</div>
                <div className="text-2xl font-bold text-gray-900">${data.price_premium_retainer?.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">15% off</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
