
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const commonServices = [
  'Pre-session consultation',
  'Professional editing',
  'Online gallery',
  'High-resolution images',
  'USB drive delivery',
  'Print release',
  'Location scouting',
  'Wardrobe consultation',
];

const commonExtras = [
  'Additional editing',
  'Rush delivery',
  'Extended session time',
  'Second photographer',
  'Prints & albums',
  'Video highlights',
  'Drone footage',
  'Makeup artist',
];

export default function ServicesStep({ data, onChange, onNext, onBack }) {
  const [newService, setNewService] = useState('');
  const [newExtra, setNewExtra] = useState('');

  const toggleService = (service) => {
    const services = data.base_services || [];
    if (services.includes(service)) {
      onChange({ base_services: services.filter(s => s !== service) });
    } else {
      onChange({ base_services: [...services, service] });
    }
  };

  const toggleExtra = (extra) => {
    const extras = data.extras || [];
    if (extras.includes(extra)) {
      onChange({ extras: extras.filter(e => e !== extra) });
    } else {
      onChange({ extras: [...extras, extra] });
    }
  };

  const addCustomService = () => {
    if (newService.trim()) {
      onChange({ base_services: [...(data.base_services || []), newService.trim()] });
      setNewService('');
    }
  };

  const addCustomExtra = () => {
    if (newExtra.trim()) {
      onChange({ extras: [...(data.extras || []), newExtra.trim()] });
      setNewExtra('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with gradient */}
      <div className="text-center mb-12 relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full mb-6">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900 uppercase tracking-wider">Step 2 of 3</span>
        </div>
        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          What do you offer?
        </h2>
        <p className="text-neutral-600 text-xl">Select your core services and extras</p>
      </div>

      <div className="space-y-12 mb-12">
        {/* Core Services */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 border-2 border-blue-100">
          <Label className="text-lg font-bold text-blue-900 mb-6 block flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            Core Services
          </Label>
          <div className="flex flex-wrap gap-3 mb-6">
            {commonServices.map((service) => (
              <Badge
                key={service}
                onClick={() => toggleService(service)}
                variant={data.base_services?.includes(service) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-5 py-3 text-sm font-medium transition-all hover:scale-105",
                  data.base_services?.includes(service)
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                    : "border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                )}
              >
                {service}
              </Badge>
            ))}
          </div>
          <div className="flex gap-3">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomService()}
              placeholder="Add custom service..."
              className="h-12 border-2 border-blue-200 focus:border-blue-400 bg-white"
            />
            <Button
              onClick={addCustomService}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Optional Extras */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-purple-100">
          <Label className="text-lg font-bold text-purple-900 mb-6 block flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Optional Extras
          </Label>
          <div className="flex flex-wrap gap-3 mb-6">
            {commonExtras.map((extra) => (
              <Badge
                key={extra}
                onClick={() => toggleExtra(extra)}
                variant={data.extras?.includes(extra) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-5 py-3 text-sm font-medium transition-all hover:scale-105",
                  data.extras?.includes(extra)
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                )}
              >
                {extra}
              </Badge>
            ))}
          </div>
          <div className="flex gap-3">
            <Input
              value={newExtra}
              onChange={(e) => setNewExtra(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomExtra()}
              placeholder="Add custom extra..."
              className="h-12 border-2 border-purple-200 focus:border-purple-400 bg-white"
            />
            <Button
              onClick={addCustomExtra}
              className="h-12 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-5 h-5" />
            </Button>
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
          disabled={!data.base_services?.length}
          className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          Continue to Pricing
        </Button>
      </div>
    </div>
  );
}
