import React from 'react';
import { Check, Clock, Image, Zap, Star, Sparkles, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function EnhancedPackageCard({ 
  packageData,
  primaryColor, 
  secondaryColor,
  isPopular 
}) {
  return (
    <div className={cn(
      "relative flex flex-col bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden transition-all duration-700 hover:scale-[1.03] group border-2",
      isPopular ? "shadow-2xl" : "shadow-xl hover:shadow-2xl"
    )}
    style={{
      borderColor: isPopular ? primaryColor : `${primaryColor}20`,
      boxShadow: isPopular ? `0 25px 50px -12px ${primaryColor}40` : undefined
    }}
    >
      {/* Layered decorative background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all duration-700"
          style={{ 
            background: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)` 
          }}
        />
        <div 
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all duration-700"
          style={{ 
            background: `radial-gradient(circle, ${secondaryColor} 0%, transparent 70%)` 
          }}
        />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(${primaryColor} 1px, transparent 1px), linear-gradient(90deg, ${primaryColor} 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
      </div>
      
      {isPopular && (
        <div 
          className="relative py-4 text-center text-sm font-bold text-white backdrop-blur-sm overflow-hidden shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` 
          }}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
          <div className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`
            }}
          />
          <div className="relative flex items-center justify-center gap-2">
            <Star className="w-5 h-5 animate-pulse" />
            <span className="tracking-wider">MOST POPULAR CHOICE</span>
            <Sparkles className="w-5 h-5 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      )}
      
      <div className={cn("relative p-8", isPopular && "pt-6")}>
        {/* Premium header with enhanced styling */}
        <div 
          className="mb-8 p-8 rounded-2xl relative overflow-hidden shadow-lg border-2 backdrop-blur-sm"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}12 0%, ${secondaryColor}12 100%)`,
            borderColor: `${primaryColor}30`
          }}
        >
          <div className="absolute top-4 right-4">
            <Award className="w-8 h-8 opacity-20" style={{ color: primaryColor }} />
          </div>
          
          <h3 className="text-4xl font-bold mb-4 tracking-tight" style={{ color: primaryColor }}>
            {packageData.title}
          </h3>
          <p className="text-neutral-700 text-base leading-relaxed mb-6 font-medium">
            {packageData.description}
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-bold tracking-tight" style={{ color: primaryColor }}>
              ${packageData.price}
            </span>
            <div className="flex flex-col">
              <span className="text-neutral-500 text-sm font-semibold">starting</span>
              <span className="text-neutral-400 text-xs">price</span>
            </div>
          </div>
        </div>

        {/* Enhanced metrics grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div 
            className="p-5 rounded-2xl text-center transition-all duration-500 hover:scale-110 hover:shadow-lg border-2 backdrop-blur-sm"
            style={{ 
              backgroundColor: `${primaryColor}15`,
              borderColor: `${primaryColor}30`
            }}
          >
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}25` }}
            >
              <Image className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <p className="font-bold text-xl mb-1" style={{ color: primaryColor }}>
              {packageData.photo_count}
            </p>
            <p className="text-xs text-neutral-600 font-medium">Photos</p>
          </div>

          <div 
            className="p-5 rounded-2xl text-center transition-all duration-500 hover:scale-110 hover:shadow-lg border-2 backdrop-blur-sm"
            style={{ 
              backgroundColor: `${secondaryColor}15`,
              borderColor: `${secondaryColor}30`
            }}
          >
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${secondaryColor}25` }}
            >
              <Clock className="w-6 h-6" style={{ color: secondaryColor }} />
            </div>
            <p className="font-bold text-xl mb-1" style={{ color: secondaryColor }}>
              {packageData.session_length}
            </p>
            <p className="text-xs text-neutral-600 font-medium">Duration</p>
          </div>

          <div 
            className="p-5 rounded-2xl text-center transition-all duration-500 hover:scale-110 hover:shadow-lg border-2 backdrop-blur-sm"
            style={{ 
              backgroundColor: `${primaryColor}15`,
              borderColor: `${primaryColor}30`
            }}
          >
            <div 
              className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}25` }}
            >
              <Zap className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <p className="font-bold text-xl mb-1" style={{ color: primaryColor }}>
              {packageData.turnaround}
            </p>
            <p className="text-xs text-neutral-600 font-medium">Delivery</p>
          </div>
        </div>

        {/* Enhanced features list */}
        <div 
          className="pt-8 mb-8 border-t-2"
          style={{ borderColor: `${primaryColor}20` }}
        >
          <div 
            className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl backdrop-blur-sm border"
            style={{ 
              backgroundColor: `${secondaryColor}10`,
              borderColor: `${secondaryColor}30`
            }}
          >
            <Check className="w-5 h-5 flex-shrink-0" style={{ color: secondaryColor }} />
            <p className="text-sm font-bold uppercase tracking-wider" style={{ color: secondaryColor }}>
              Complete Package Includes
            </p>
          </div>
          <div className="space-y-4">
            {packageData.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4 group/feature">
                <div 
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 group-hover/feature:scale-125 border-2 shadow-sm"
                  style={{ 
                    backgroundColor: `${primaryColor}20`,
                    borderColor: `${primaryColor}50`
                  }}
                >
                  <Check className="w-4 h-4" style={{ color: primaryColor }} />
                </div>
                <span className="text-sm text-neutral-700 leading-relaxed font-medium pt-0.5">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Premium highlights section */}
        {packageData.highlights && packageData.highlights.length > 0 && (
          <div 
            className="pt-8 mb-8 border-t-2"
            style={{ borderColor: `${secondaryColor}20` }}
          >
            <div 
              className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: `${primaryColor}10`,
                borderColor: `${primaryColor}30`
              }}
            >
              <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: primaryColor }} />
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                Exclusive Features
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {packageData.highlights.map((highlight, idx) => (
                <Badge 
                  key={idx} 
                  className="px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:scale-105 border-2 shadow-md backdrop-blur-sm"
                  style={{ 
                    backgroundColor: `${secondaryColor}20`,
                    color: secondaryColor,
                    borderColor: `${secondaryColor}50`
                  }}
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Premium footer */}
      <div 
        className="relative p-8 text-center overflow-hidden border-t-2 backdrop-blur-sm"
        style={{ 
          background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}15 100%)`,
          borderColor: `${primaryColor}25`
        }}
      >
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, ${primaryColor}15 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${secondaryColor}15 0%, transparent 50%)`
          }}
        />
        <p className="text-base font-semibold italic relative z-10 leading-relaxed" style={{ color: primaryColor }}>
          <span className="opacity-70 font-normal">Perfect for: </span>
          {packageData.ideal_for}
        </p>
      </div>
    </div>
  );
}