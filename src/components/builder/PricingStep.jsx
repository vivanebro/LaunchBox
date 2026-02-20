import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Zap, Award, Crown } from 'lucide-react';

export default function PricingStep({ data, onChange, onNext, onBack }) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with gradient */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full mb-6">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-900 uppercase tracking-wider">Step 3 of 3</span>
        </div>
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Set your pricing
        </h2>
        <p className="text-neutral-600 text-xl">Define prices for your three package tiers</p>
      </div>

      <div className="space-y-6 mb-12">
        {/* Starter Package */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl opacity-20 group-hover:opacity-30 blur transition-opacity" />
          <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl border-2 border-amber-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <Label className="text-xl font-bold text-amber-900 block">Starter Package</Label>
                <p className="text-sm text-amber-700">Entry-level package for budget-conscious clients</p>
              </div>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-600" />
              <Input
                type="number"
                value={data.starter_price || ''}
                onChange={(e) => onChange({ starter_price: parseFloat(e.target.value) })}
                placeholder="299"
                className="h-16 pl-14 text-2xl font-bold border-2 border-amber-300 bg-white focus:border-amber-500 rounded-xl shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Professional Package */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-3xl opacity-20 group-hover:opacity-30 blur transition-opacity" />
          <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-3xl border-2 border-blue-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <Label className="text-xl font-bold text-blue-900 block">Professional Package</Label>
                <p className="text-sm text-blue-700">Most popular mid-tier option with great value</p>
              </div>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
              <Input
                type="number"
                value={data.professional_price || ''}
                onChange={(e) => onChange({ professional_price: parseFloat(e.target.value) })}
                placeholder="599"
                className="h-16 pl-14 text-2xl font-bold border-2 border-blue-300 bg-white focus:border-blue-500 rounded-xl shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Premium Package */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl opacity-20 group-hover:opacity-30 blur transition-opacity" />
          <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl border-2 border-purple-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <Label className="text-xl font-bold text-purple-900 block">Premium Package</Label>
                <p className="text-sm text-purple-700">Full-service premium experience for demanding clients</p>
              </div>
            </div>
            <div className="relative">
              <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-purple-600" />
              <Input
                type="number"
                value={data.premium_price || ''}
                onChange={(e) => onChange({ premium_price: parseFloat(e.target.value) })}
                placeholder="999"
                className="h-16 pl-14 text-2xl font-bold border-2 border-purple-300 bg-white focus:border-purple-500 rounded-xl shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" className="h-14 px-8 text-base font-semibold border-2">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!data.starter_price || !data.professional_price || !data.premium_price}
          className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          Generate Designs
        </Button>
      </div>
    </div>
  );
}