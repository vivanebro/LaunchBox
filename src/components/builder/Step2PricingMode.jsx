import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, RefreshCw, ArrowLeftRight, Check } from 'lucide-react';

const OPTIONS = [
  {
    value: 'onetime',
    label: 'One-Time',
    description: 'A single project with a fixed scope and price.',
    icon: Clock,
  },
  {
    value: 'retainer',
    label: 'Ongoing',
    description: 'Recurring service with ongoing billing.',
    icon: RefreshCw,
  },
  {
    value: 'both',
    label: 'Both',
    description: 'Offer one-time and ongoing options side by side.',
    icon: ArrowLeftRight,
  },
];

function TogglePreview() {
  const [active, setActive] = React.useState('one-time');

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm text-gray-500 text-center">
        Your clients will see a toggle to switch between one-time and ongoing pricing.
      </p>
      <div className="flex justify-center">
        <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActive('one-time')}
            className={cn(
              'px-5 py-1.5 rounded-full font-semibold text-xs transition-all',
              active === 'one-time'
                ? 'text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            )}
            style={active === 'one-time' ? { background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' } : {}}
          >
            One-time
          </button>
          <button
            type="button"
            onClick={() => setActive('retainer')}
            className={cn(
              'px-5 py-1.5 rounded-full font-semibold text-xs transition-all',
              active === 'retainer'
                ? 'text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            )}
            style={active === 'retainer' ? { background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' } : {}}
          >
            Ongoing
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Step2PricingMode({ data, onChange }) {
  const selected = data.pricing_availability || '';

  const select = (value) => {
    onChange({ pricing_availability: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Pricing type</h2>
        <p className="text-gray-500 text-base">
          How do you charge for this service?
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
              className={cn(
                'relative flex flex-col items-center text-center p-6 rounded-2xl border-0 transition-all hover:scale-[1.02] cursor-pointer',
                isSelected
                  ? 'shadow-lg bg-sky-50'
                  : 'shadow-md bg-white hover:shadow-lg'
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' }}>
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-4',
                  isSelected ? 'text-white' : 'bg-gray-100 text-gray-500'
                )}
                style={isSelected ? { background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)' } : {}}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-base font-semibold text-gray-900 mb-1">{opt.label}</div>
              <div className="text-sm text-gray-500 leading-snug">{opt.description}</div>
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-400 text-center">You can rename these labels later to match your business.</p>

      {selected === 'both' && <TogglePreview />}
    </div>
  );
}
