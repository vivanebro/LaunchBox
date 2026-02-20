import React, { useState } from 'react';
import { Check, GripVertical, Trash2, Sparkles } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const EditableText = ({ value, onChange, className, multiline, placeholder, isDark }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    if (multiline) {
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className={cn("min-h-[80px]", isDark && "bg-white/10 text-white border-white/20", className)}
          placeholder={placeholder}
        />
      );
    }
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        autoFocus
        className={cn(isDark && "bg-white/10 text-white border-white/20", className)}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer rounded px-2 py-1 transition-colors",
        isDark ? "hover:bg-white/10" : "hover:bg-gray-50/50",
        className
      )}
    >
      {value || <span className={isDark ? "text-white/50" : "text-gray-400"}>{placeholder}</span>}
    </div>
  );
};

export default function EditablePackageCardStyle2({ 
  packageData,
  primaryColor, 
  secondaryColor,
  isPopular,
  onUpdate
}) {
  const handleUpdate = (field, value) => {
    onUpdate({ ...packageData, [field]: value });
  };

  const handleFeatureDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(packageData.features);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    handleUpdate('features', items);
  };

  const handleHighlightDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(packageData.highlights || []);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    handleUpdate('highlights', items);
  };

  const removeFeature = (index) => {
    const features = packageData.features.filter((_, i) => i !== index);
    handleUpdate('features', features);
  };

  const updateFeature = (index, value) => {
    const features = [...packageData.features];
    features[index] = value;
    handleUpdate('features', features);
  };

  const removeHighlight = (index) => {
    const highlights = (packageData.highlights || []).filter((_, i) => i !== index);
    handleUpdate('highlights', highlights);
  };

  const updateHighlight = (index, value) => {
    const highlights = [...(packageData.highlights || [])];
    highlights[index] = value;
    handleUpdate('highlights', highlights);
  };

  const isColoredCard = isPopular;

  return (
    <div 
      className={cn(
        "relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl",
        isColoredCard ? "shadow-2xl scale-105" : "shadow-lg bg-white border border-gray-200"
      )}
      style={isColoredCard ? {
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
      } : {}}
    >
      {/* Decorative elements for colored card */}
      {isColoredCard && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        </>
      )}

      {/* Header badge */}
      {isColoredCard && (
        <div className="relative py-3 text-center text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm bg-black/10 border-b border-white/10">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Most Popular Choice
        </div>
      )}
      
      <div className={cn("p-10 relative z-10", isColoredCard && "pt-8")}>
        {/* Title */}
        <EditableText
          value={packageData.title}
          onChange={(val) => handleUpdate('title', val)}
          className={cn("text-3xl font-light mb-6 text-center", isColoredCard ? "text-white" : "text-gray-800")}
          isDark={isColoredCard}
          placeholder="Package Title"
        />

        {/* Description */}
        <EditableText
          value={packageData.description}
          onChange={(val) => handleUpdate('description', val)}
          className={cn("text-sm text-center leading-relaxed mb-8", isColoredCard ? "text-white/90" : "text-gray-600")}
          isDark={isColoredCard}
          multiline
          placeholder="Package description"
        />

        {/* Price */}
        <div className="text-center mb-10">
          <span className={cn("text-2xl font-light", isColoredCard && "text-white")} style={!isColoredCard ? { color: primaryColor } : {}}>$</span>
          <EditableText
            value={packageData.price?.toString()}
            onChange={(val) => handleUpdate('price', parseFloat(val))}
            className={cn("text-6xl font-bold inline-block", isColoredCard && "text-white")}
            style={!isColoredCard ? { color: primaryColor } : {}}
            isDark={isColoredCard}
            placeholder="999"
          />
          <p className={cn("text-sm mt-2", isColoredCard ? "text-white/80" : "text-gray-500")}>starting price</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <div 
            className={cn("text-center p-4 rounded-lg", isColoredCard && "bg-white/10 backdrop-blur-sm")}
            style={!isColoredCard ? { backgroundColor: `${primaryColor}08` } : {}}
          >
            <EditableText
              value={packageData.photo_count}
              onChange={(val) => handleUpdate('photo_count', val)}
              className={cn("font-semibold", isColoredCard ? "text-white" : "text-gray-800")}
              isDark={isColoredCard}
              placeholder="200"
            />
            <p className={cn("text-xs mt-1", isColoredCard ? "text-white/70" : "text-gray-500")}>Photos</p>
          </div>
          <div 
            className={cn("text-center p-4 rounded-lg", isColoredCard && "bg-white/10 backdrop-blur-sm")}
            style={!isColoredCard ? { backgroundColor: `${secondaryColor}08` } : {}}
          >
            <EditableText
              value={packageData.session_length}
              onChange={(val) => handleUpdate('session_length', val)}
              className={cn("font-semibold", isColoredCard ? "text-white" : "text-gray-800")}
              isDark={isColoredCard}
              placeholder="4 hours"
            />
            <p className={cn("text-xs mt-1", isColoredCard ? "text-white/70" : "text-gray-500")}>Time</p>
          </div>
          <div 
            className={cn("text-center p-4 rounded-lg", isColoredCard && "bg-white/10 backdrop-blur-sm")}
            style={!isColoredCard ? { backgroundColor: `${primaryColor}08` } : {}}
          >
            <EditableText
              value={packageData.turnaround}
              onChange={(val) => handleUpdate('turnaround', val)}
              className={cn("font-semibold", isColoredCard ? "text-white" : "text-gray-800")}
              isDark={isColoredCard}
              placeholder="2 weeks"
            />
            <p className={cn("text-xs mt-1", isColoredCard ? "text-white/70" : "text-gray-500")}>Delivery</p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <p 
            className={cn("text-xs font-bold uppercase tracking-wider text-center mb-6", isColoredCard && "text-white")}
            style={!isColoredCard ? { color: primaryColor } : {}}
          >
            Complete Package Includes
          </p>

          <DragDropContext onDragEnd={handleFeatureDragEnd}>
            <Droppable droppableId="features">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {packageData.features.map((feature, index) => (
                    <Draggable key={index} draggableId={`feature-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-start gap-3 group",
                            snapshot.isDragging && (isColoredCard ? "bg-white/10" : "bg-gray-50"),
                            snapshot.isDragging && "rounded-lg p-2"
                          )}
                        >
                          <div {...provided.dragHandleProps} className="pt-1 opacity-0 group-hover:opacity-100">
                            <GripVertical className={cn("w-4 h-4", isColoredCard ? "text-white/50" : "text-gray-300")} />
                          </div>
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ 
                              backgroundColor: isColoredCard ? 'rgba(255,255,255,0.3)' : primaryColor 
                            }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <EditableText
                            value={feature}
                            onChange={(val) => updateFeature(index, val)}
                            className={cn("flex-1 text-sm leading-relaxed", isColoredCard ? "text-white" : "text-gray-700")}
                            isDark={isColoredCard}
                            placeholder="Feature name"
                          />
                          <button
                            onClick={() => removeFeature(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity pt-1"
                          >
                            <Trash2 className={cn("w-4 h-4", isColoredCard ? "text-white" : "text-red-500")} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Highlights */}
        {packageData.highlights && packageData.highlights.length > 0 && (
          <div className="mb-8">
            <p 
              className={cn("text-xs font-bold uppercase tracking-wider text-center mb-4", isColoredCard && "text-white")}
              style={!isColoredCard ? { color: secondaryColor } : {}}
            >
              Special Features
            </p>

            <DragDropContext onDragEnd={handleHighlightDragEnd}>
              <Droppable droppableId="highlights" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-wrap gap-2 justify-center"
                  >
                    {packageData.highlights.map((highlight, index) => (
                      <Draggable key={index} draggableId={`highlight-${index}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                              snapshot.isDragging && "shadow-lg"
                            )}
                            style={isColoredCard ? {
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              backdropFilter: 'blur(10px)',
                              color: 'white'
                            } : {
                              backgroundColor: `${secondaryColor}15`,
                              color: secondaryColor
                            }}
                          >
                            <EditableText
                              value={highlight}
                              onChange={(val) => updateHighlight(index, val)}
                              className="text-xs"
                              isDark={isColoredCard}
                              placeholder="Highlight"
                            />
                            <button
                              onClick={() => removeHighlight(index)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* CTA Button */}
        <button
          className={cn(
            "w-full font-semibold h-12 rounded-lg shadow-md hover:shadow-lg transition-all",
            isColoredCard && "bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
          )}
          style={!isColoredCard ? { 
            backgroundColor: primaryColor,
            color: 'white'
          } : {
            color: 'white'
          }}
        >
          Get Started
        </button>

        {/* Ideal for */}
        <div 
          className="mt-6 pt-6 text-center"
          style={isColoredCard ? { 
            borderTop: '1px solid rgba(255,255,255,0.2)'
          } : { 
            borderTop: '1px solid #e5e7eb'
          }}
        >
          <EditableText
            value={packageData.ideal_for}
            onChange={(val) => handleUpdate('ideal_for', val)}
            className={cn("text-xs italic", isColoredCard ? "text-white/90" : "text-gray-500")}
            isDark={isColoredCard}
            placeholder="Perfect for..."
          />
        </div>
      </div>
    </div>
  );
}