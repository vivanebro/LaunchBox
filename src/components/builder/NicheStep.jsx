import React from 'react';
import { Camera, Users, Building2, PartyPopper, Package, Home, Baby, Heart, Sparkles, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const niches = [
  { value: 'wedding', label: 'Wedding', icon: Heart, gradient: 'from-rose-500 to-pink-500' },
  { value: 'portrait', label: 'Portrait', icon: Users, gradient: 'from-blue-500 to-cyan-500' },
  { value: 'commercial', label: 'Commercial', icon: Building2, gradient: 'from-slate-600 to-slate-800' },
  { value: 'event', label: 'Event', icon: PartyPopper, gradient: 'from-purple-500 to-pink-500' },
  { value: 'product', label: 'Product', icon: Package, gradient: 'from-amber-500 to-orange-500' },
  { value: 'real_estate', label: 'Real Estate', icon: Home, gradient: 'from-emerald-500 to-teal-500' },
  { value: 'family', label: 'Family', icon: Users, gradient: 'from-indigo-500 to-purple-500' },
  { value: 'newborn', label: 'Newborn', icon: Baby, gradient: 'from-pink-400 to-rose-400' },
  { value: 'fashion', label: 'Fashion', icon: Sparkles, gradient: 'from-violet-500 to-purple-500' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, gradient: 'from-gray-500 to-gray-600' },
];

export default function NicheStep({ data, onChange, onNext }) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with gradient */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-violet-200 to-purple-200 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full mb-6">
          <Camera className="w-5 h-5 text-violet-600" />
          <span className="text-sm font-semibold text-violet-900 uppercase tracking-wider">Step 1 of 3</span>
        </div>
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Tell us about yourself
        </h2>
        <p className="text-neutral-600 text-xl">Let's personalize your pricing packages</p>
      </div>

      <div className="space-y-10 mb-12">
        {/* Name input with gradient border */}
        <div>
          <Label className="text-base font-semibold text-neutral-800 mb-4 block flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            Your Name or Studio
          </Label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl opacity-20 group-focus-within:opacity-40 blur transition-opacity" />
            <Input
              value={data.photographer_name || ''}
              onChange={(e) => onChange({ photographer_name: e.target.value })}
              placeholder="e.g., Sarah Johnson Photography"
              className="relative h-16 text-lg border-2 border-violet-200 focus:border-violet-400 rounded-xl bg-white shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Niche selection with colorful cards */}
        <div>
          <Label className="text-base font-semibold text-neutral-800 mb-5 block flex items-center gap-2">
            <Heart className="w-5 h-5 text-violet-600" />
            What's your specialty?
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {niches.map(({ value, label, icon: Icon, gradient }) => (
              <button
                key={value}
                onClick={() => onChange({ niche: value })}
                className={cn(
                  "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden group",
                  "hover:scale-105 hover:shadow-xl",
                  data.niche === value
                    ? "border-transparent shadow-xl scale-105"
                    : "border-neutral-200 bg-white hover:border-violet-200"
                )}
              >
                {data.niche === value && (
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-100", gradient)} />
                )}
                {data.niche !== value && (
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity", gradient)} />
                )}
                <Icon className={cn(
                  "w-7 h-7 relative z-10 transition-colors",
                  data.niche === value ? "text-white" : "text-neutral-600 group-hover:text-violet-600"
                )} />
                <span className={cn(
                  "text-sm font-semibold relative z-10 transition-colors",
                  data.niche === value ? "text-white" : "text-neutral-700"
                )}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Continue button with gradient */}
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!data.photographer_name || !data.niche}
          className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Services
        </Button>
      </div>
    </div>
  );
}