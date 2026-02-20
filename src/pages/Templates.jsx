import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Assuming Input component is located here
import { Heart, Users, Building2, Camera, Sparkles, Baby, Package as PackageIcon, GripVertical, Video } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const templates = [
  {
    id: 'wedding-elegant',
    name: 'Elegant Wedding',
    icon: Heart,
    niche: 'wedding',
    photographer_name: 'Your Studio Name',
    gradient: 'from-rose-500 to-pink-500',
    brand_color: '#F43F5E',
    project_duration: '2-4 weeks',
    duration_min: 2,
    duration_max: 4,
    duration_unit: 'weeks',
    base_services: [
      'Pre-wedding consultation',
      'Full day coverage',
      'Professional editing',
      'Online gallery',
      'High-resolution images',
      'Print release',
      'Engagement session',
      'Second photographer'
    ],
    extras: [
      'Wedding album',
      'Parent albums',
      'Canvas prints',
      'Video highlights',
      'Same-day preview'
    ],
    starter_price: 2500,
    professional_price: 5000,
    premium_price: 6000, // Updated premium price
    description: 'Perfect for couples seeking timeless elegance'
  },
  {
    id: 'portrait-modern',
    name: 'Modern Portrait',
    icon: Users,
    niche: 'portrait',
    photographer_name: 'Your Studio Name',
    gradient: 'from-blue-500 to-cyan-500',
    brand_color: '#3B82F6',
    project_duration: '1-2 weeks',
    duration_min: 1,
    duration_max: 2,
    duration_unit: 'weeks',
    base_services: [
      'Pre-session consultation',
      'Professional editing',
      'Online gallery',
      'High-resolution images',
      'Print release',
      'Wardrobe consultation',
      'Location scouting'
    ],
    extras: [
      'Additional outfit changes',
      'Rush delivery',
      'Extended session time',
      'Makeup artist',
      'Prints & frames'
    ],
    starter_price: 350,
    professional_price: 700,
    premium_price: 850, // Updated premium price
    description: 'Contemporary style for individuals and families'
  },
  {
    id: 'commercial-professional',
    name: 'Professional Commercial',
    icon: Building2,
    niche: 'commercial',
    photographer_name: 'Your Studio Name',
    gradient: 'from-slate-600 to-slate-800',
    brand_color: '#475569',
    project_duration: '3-4 weeks',
    duration_min: 3,
    duration_max: 4,
    duration_unit: 'weeks',
    base_services: [
      'Brand consultation',
      'Professional editing',
      'High-resolution images',
      'Commercial usage rights',
      'Online delivery',
      'Styling assistance',
      'Location flexibility'
    ],
    extras: [
      'Video content',
      'Social media package',
      'Rush delivery',
      'Additional shoot days',
      'Behind-the-scenes'
    ],
    starter_price: 1500,
    professional_price: 3000,
    premium_price: 3600, // Updated premium price
    description: 'Enterprise-grade commercial photography'
  },
  {
    id: 'family-warm',
    name: 'Warm Family',
    icon: Users,
    niche: 'family',
    photographer_name: 'Your Studio Name',
    gradient: 'from-amber-500 to-orange-500',
    brand_color: '#F59E0B',
    project_duration: '1-2 weeks',
    duration_min: 1,
    duration_max: 2,
    duration_unit: 'weeks',
    base_services: [
      'Family consultation',
      'Professional editing',
      'Online gallery',
      'High-resolution images',
      'Print release',
      'Location guidance',
      'Wardrobe tips'
    ],
    extras: [
      'Extended family session',
      'Individual portraits',
      'Holiday cards',
      'Wall art',
      'Mini sessions'
    ],
    starter_price: 400,
    professional_price: 800,
    premium_price: 1000, // Updated premium price
    description: 'Capture precious family moments with warmth'
  },
  {
    id: 'newborn-gentle',
    name: 'Gentle Newborn',
    icon: Baby,
    niche: 'newborn',
    photographer_name: 'Your Studio Name',
    gradient: 'from-pink-400 to-rose-400',
    brand_color: '#F472B6',
    project_duration: '2-3 weeks',
    duration_min: 2,
    duration_max: 3,
    duration_unit: 'weeks',
    base_services: [
      'Newborn consultation',
      'Professional editing',
      'Online gallery',
      'High-resolution images',
      'Print release',
      'Props & accessories',
      'Flexible timing'
    ],
    extras: [
      'Parent portraits',
      'Sibling photos',
      'Birth announcement cards',
      'Canvas prints',
      'Growth milestone package'
    ],
    starter_price: 450,
    professional_price: 900,
    premium_price: 1100, // Updated premium price
    description: 'Gentle and safe newborn photography'
  },
  {
    id: 'product-clean',
    name: 'Clean Product',
    icon: PackageIcon,
    niche: 'product',
    photographer_name: 'Your Studio Name',
    gradient: 'from-emerald-500 to-teal-500',
    brand_color: '#10B981',
    project_duration: '1 week',
    duration_min: 1,
    duration_max: 1,
    duration_unit: 'weeks',
    base_services: [
      'Product consultation',
      'Professional editing',
      'High-resolution images',
      'White background',
      'Multiple angles',
      'Online delivery',
      'Commercial rights'
    ],
    extras: [
      '360° photography', // Moved from last to first as per typical usage, and outline just shows this example
      'Lifestyle shots',
      'Video content',
      'Rush delivery',
      'Additional products'
    ],
    starter_price: 500,
    professional_price: 1000,
    premium_price: 1200, // Updated premium price
    description: 'Professional product photography for e-commerce'
  },
  {
    id: 'real-estate-video',
    name: 'Real-Estate Video Package',
    icon: Video,
    niche: 'real-estate',
    photographer_name: 'Your Studio Name',
    gradient: 'from-blue-600 to-indigo-600',
    brand_color: '#2563EB',
    project_duration: '1-2 weeks',
    duration_min: 1,
    duration_max: 2,
    duration_unit: 'weeks',
    base_services: [
      'Main property video (2–3 min)',
      '10 social-media short clips',
      'Cinematic 4K drone footage',
      '25 high-res exterior photos',
      '25 high-res interior photos',
      'On-brand graphics and titles',
      'Upload-ready files for all platforms'
    ],
    extras: [
      'Property launch strategy call',
      'Agent or owner mini-video',
      'Map overlay of nearby highlights',
      'Custom logo intro animation'
    ],
    starter_price: 1500,
    professional_price: 2500,
    premium_price: 3800,
    description: 'Attract more views and inquiries with professional real estate video'
  }
];

const COLOR_PRESETS = [
  { name: 'Red', color: '#ff0044' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Purple', color: '#A855F7' },
  { name: 'Green', color: '#10B981' },
  { name: 'Orange', color: '#F59E0B' },
  { name: 'Pink', color: '#F472B6' },
  { name: 'Teal', color: '#14B8A6' },
  { name: 'Indigo', color: '#6366F1' }
];

// Helper function to generate gradient from a color
const generateGradient = (color) => {
  if (!color || !color.startsWith('#')) return 'linear-gradient(135deg, #ff0044 0%, #cc0033 100%)';
  
  const hex = color.slice(1);
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const darkerR = Math.max(0, Math.floor(r * 0.8));
  const darkerG = Math.max(0, Math.floor(g * 0.8));
  const darkerB = Math.max(0, Math.floor(b * 0.8));
  
  const darkerColor = `#${((1 << 24) + (darkerR << 16) + (darkerG << 8) + darkerB).toString(16).slice(1)}`;
  
  return `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`;
};

// Helper function to round prices up to nearest 50
const roundToNearest50 = (price) => {
  return Math.ceil(price / 50) * 50;
};

export default function Templates() {
  const [templateOrder, setTemplateOrder] = useState(templates.map((_, idx) => idx));
  const [customColors, setCustomColors] = useState({});
  const [colorInputs, setColorInputs] = useState({});

  const handleUseTemplate = (template) => {
    const selectedColor = customColors[template.id] || template.brand_color;
    
    const allDeliverables = template.base_services.slice(0, 3).map((service, idx) => ({
      type: service,
      quantity: 1,
      length: idx === 0 ? '60s' : '30s'
    }));
    
    const allAssets = template.base_services.slice(3);
    const allBonuses = template.extras || [];
    
    // Calculate one-time prices rounded to nearest 50
    const starterPrice = roundToNearest50(template.starter_price);
    const professionalPrice = roundToNearest50(template.professional_price);
    const premiumPrice = roundToNearest50(template.premium_price);
    
    // Calculate retainer prices with 15% discount, rounded to nearest 50
    const starterPriceRetainer = roundToNearest50(Math.round(starterPrice * 0.85));
    const professionalPriceRetainer = roundToNearest50(Math.round(professionalPrice * 0.85));
    const premiumPriceRetainer = roundToNearest50(Math.round(premiumPrice * 0.85));
    
    const packageConfig = {
      business_name: template.photographer_name,
      niches: [template.niche],
      video_types: [],
      desired_results: ['Increase sales'],
      core_deliverables: allDeliverables, // This will be the full list
      additional_assets: allAssets,     // This will be the full list
      extras_bonuses: allBonuses,       // This will be the full list

      // Package-specific customization
      starter_deliverables: allDeliverables.slice(0, 1),
      starter_assets: allAssets.slice(0, 2),
      starter_bonuses: allBonuses.slice(0, 1),
      growth_deliverables: allDeliverables.slice(0, 2),
      growth_assets: allAssets.slice(0, 4),
      growth_bonuses: allBonuses.slice(0, 3),
      premium_deliverables: allDeliverables,
      premium_assets: allAssets,
      premium_bonuses: allBonuses,

      project_duration: template.project_duration,
      duration_min: template.duration_min,
      duration_max: template.duration_max,
      duration_unit: template.duration_unit,
      price_range: `$${starterPrice}-$${premiumPrice}`,
      price_starter: starterPrice,
      price_growth: professionalPrice,
      price_premium: premiumPrice,
      price_starter_retainer: starterPriceRetainer,
      price_growth_retainer: professionalPriceRetainer,
      price_premium_retainer: premiumPriceRetainer,
      guarantee: '100% satisfaction guarantee',
      urgency: 'Limited spots available this month',
      brand_color: selectedColor,
      logo_url: '',
      from_template: true,
      popularPackageIndex: { onetime: 2, retainer: 2 },
      popularBadgeText: 'Most Popular',
      package_descriptions: {
        onetime: {
          starter: 'For individuals just starting out who need essential features',
          growth: 'For growing businesses that want to scale their content',
          premium: 'For established brands that need complete solutions'
        },
        retainer: {
          starter: 'For individuals just starting out who need essential features',
          growth: 'For growing businesses that want to scale their content',
          premium: 'For established brands that need complete solutions'
        }
      }
    };
    
    localStorage.setItem('packageConfig', JSON.stringify(packageConfig));
    window.location.href = createPageUrl('Results');
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(templateOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTemplateOrder(items);
  };

  const resetLayout = () => {
    setTemplateOrder(templates.map((_, idx) => idx));
  };

  const updateTemplateColor = (templateId, color) => {
    setCustomColors(prev => ({ ...prev, [templateId]: color }));
  };

  const handleColorInputChange = (templateId, value) => {
    setColorInputs(prev => ({ ...prev, [templateId]: value }));
  };

  const applyColorInput = (templateId) => {
    const inputValue = colorInputs[templateId];
    if (!inputValue) return;

    let cleanColor = inputValue.trim().replace('#', '');
    
    if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanColor)) {
      if (cleanColor.length === 3) {
        cleanColor = cleanColor.split('').map(c => c + c).join('');
      }
      updateTemplateColor(templateId, `#${cleanColor}`);
      setColorInputs(prev => ({ ...prev, [templateId]: '' })); // Clear input after applying
    } else {
      alert('Please enter a valid hex color (e.g., FF0044 or F04)');
    }
  };

  const orderedTemplates = templateOrder.map(idx => templates[idx]);
  const isReordered = JSON.stringify(templateOrder) !== JSON.stringify(templates.map((_, idx) => idx));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full mb-6 shadow-sm border border-gray-200">
            <Sparkles className="w-5 h-5 text-[#ff0044]" />
            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Ready-Made Templates</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Start with a Template
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto mb-4">
            Choose a professionally designed template and customize it instantly
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700">
              <GripVertical className="w-4 h-4" />
              Drag templates to reorder
            </div>
            {isReordered && (
              <Button
                onClick={resetLayout}
                variant="outline"
                size="sm"
                className="bg-white border-2 border-gray-200 hover:border-[#ff0044] hover:bg-red-50 font-medium rounded-full"
              >
                Reset Layout
              </Button>
            )}
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="templates">
            {(provided) => (
              <div 
                className="space-y-16"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {orderedTemplates.map((template, index) => {
                  const Icon = template.icon;
                  const currentColor = customColors[template.id] || template.brand_color;
                  const currentGradient = generateGradient(currentColor);
                  
                  const packages = [
                    { title: 'Starter', price: roundToNearest50(template.starter_price), services: template.base_services.slice(0, 1), popular: false },
                    { title: 'Professional', price: roundToNearest50(template.professional_price), services: template.base_services.slice(0, 4), popular: false },
                    { title: 'Premium', price: roundToNearest50(template.premium_price), services: [...template.base_services, ...template.extras], popular: true }
                  ];

                  return (
                    <Draggable key={template.id} draggableId={template.id} index={index}>
                      {(provided, snapshot) => (
                        <motion.div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-white rounded-3xl shadow-lg p-8 border-2 border-gray-100 ${
                            snapshot.isDragging ? 'shadow-2xl scale-105 rotate-1' : ''
                          }`}
                        >
                          {/* Header Section - Split into rows for better layout */}
                          <div className="space-y-4 mb-8">
                            {/* Title Row */}
                            <div className="flex items-center gap-4">
                              <div 
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Drag to reorder"
                              >
                                <GripVertical className="w-5 h-5 text-gray-400" />
                              </div>
                              
                              <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg text-white"
                                style={{ background: currentGradient }}
                              >
                                <Icon className="w-8 h-8" />
                              </div>
                              
                              <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
                                <p className="text-sm text-gray-600">{template.description}</p>
                              </div>
                            </div>

                            {/* Color Picker and Button Row */}
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              {/* Color Picker */}
                              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                                <Sparkles className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Color</span>
                                <div className="flex gap-2 ml-2">
                                  {COLOR_PRESETS.map((preset) => (
                                    <button
                                      key={preset.color}
                                      onClick={() => updateTemplateColor(template.id, preset.color)}
                                      className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                                        currentColor === preset.color ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900' : 'border-gray-300'
                                      }`}
                                      style={{ backgroundColor: preset.color }}
                                      title={preset.name}
                                    />
                                  ))}
                                </div>
                                <Input
                                  type="text"
                                  value={colorInputs[template.id] || ''}
                                  onChange={(e) => handleColorInputChange(template.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      applyColorInput(template.id);
                                    }
                                  }}
                                  placeholder="#3B82F6"
                                  className="w-24 h-8 text-xs font-mono ml-2"
                                />
                                <Button
                                  onClick={() => applyColorInput(template.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-3 text-xs"
                                >
                                  Apply
                                </Button>
                              </div>

                              {/* Use Template Button */}
                              <Button
                                onClick={() => handleUseTemplate(template)}
                                size="lg"
                                className="h-12 px-8 text-white font-semibold rounded-full shadow-lg hover:shadow-xl"
                                style={{ background: currentGradient }}
                              >
                                Use This Template
                              </Button>
                            </div>
                          </div>

                          {/* Package Cards Grid */}
                          {/* Added responsive classes for the grid: 1 column on small, 2 on medium, 3 on large screens */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {packages.map((pkg, pkgIndex) => (
                              <div key={pkgIndex} className="relative">
                                {pkg.popular && (
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                                    <div 
                                      className="text-white text-xs font-bold px-4 py-1 rounded-full"
                                      style={{ backgroundColor: currentColor }}
                                    >
                                      MOST POPULAR
                                    </div>
                                  </div>
                                )}
                                <div 
                                  className={`bg-gray-50 rounded-2xl p-6 h-full border-2 ${pkg.popular ? 'pt-8' : ''}`}
                                  style={{ borderColor: pkg.popular ? currentColor : '#e5e7eb' }}
                                >
                                  <div className="text-center mb-4">
                                    <div 
                                      className="inline-block px-6 py-2 rounded-full text-white font-bold text-lg shadow-md"
                                      style={{ background: generateGradient(currentColor) }}
                                    >
                                      {pkg.title}
                                    </div>
                                  </div>
                                  
                                  <div className="mb-2">
                                    <div className="flex items-baseline gap-1 justify-center">
                                      <div 
                                        className="text-3xl font-bold"
                                        style={{ color: currentColor }}
                                      >
                                        ${pkg.price.toLocaleString()}
                                      </div>
                                      <span className="text-sm text-gray-500">/ one-time</span>
                                    </div>
                                  </div>
                                  <p className="text-xl font-bold text-gray-900 mb-4 text-center">{template.project_duration}</p>
                                  
                                  <p className="text-sm text-gray-700 mb-4 italic">
                                    {template.description}
                                  </p>
                                  
                                  <div className="space-y-2">
                                    {pkg.services.map((service, idx) => (
                                      <div key={idx} className="flex items-start gap-2">
                                        <div 
                                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                          style={{ backgroundColor: `${currentColor}20` }}
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: currentColor }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </div>
                                        <span className="text-sm text-gray-700">{service}</span>
                                      </div>
                                    ))}
                                    {pkg.services.length < template.base_services.length + template.extras.length && (
                                      <div className="text-sm text-gray-500 italic">
                                        + {template.base_services.length + template.extras.length - pkg.services.length} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="mt-16 text-center">
          <div className="inline-block bg-white rounded-3xl p-12 border-2 border-gray-200 shadow-lg">
            <Camera className="w-16 h-16 mx-auto mb-4 text-[#ff0044]" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Want something unique?</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start from scratch and build your perfect pricing packages with LaunchBox's AI-powered builder
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl('PackageBuilder')}
              variant="outline"
              className="h-12 px-8 border-2 border-[#ff0044] text-[#ff0044] hover:bg-red-50 font-semibold rounded-full"
            >
              Create From Scratch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}