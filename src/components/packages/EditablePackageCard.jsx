import React, { useState } from 'react';
import { Check, GripVertical, Plus, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const EditableText = ({ value, onChange, className, multiline, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    if (multiline) {
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className={cn("min-h-[60px]", className)}
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
        className={className}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn("cursor-pointer hover:bg-neutral-50 rounded px-2 py-1 transition-colors", className)}
    >
      {value || <span className="text-neutral-400">{placeholder}</span>}
    </div>
  );
};

export default function EditablePackageCard({ 
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

  const addFeature = () => {
    handleUpdate('features', [...packageData.features, 'New feature']);
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

  const addHighlight = () => {
    handleUpdate('highlights', [...(packageData.highlights || []), 'New highlight']);
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

  return (
    <div 
      className={cn(
        "relative flex flex-col bg-white rounded-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-lg h-full",
        isPopular ? "border-2 shadow-lg" : "border-neutral-200"
      )}
      style={{
        borderColor: isPopular ? primaryColor : undefined
      }}
    >
      {isPopular && (
        <div 
          className="py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
          style={{ backgroundColor: primaryColor }}
        >
          Most Popular
        </div>
      )}
      
      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="text-center pb-6 border-b border-neutral-100">
          <EditableText
            value={packageData.title}
            onChange={(val) => handleUpdate('title', val)}
            className="text-2xl font-bold mb-2"
            placeholder="Package Title"
          />
          
          <EditableText
            value={packageData.description}
            onChange={(val) => handleUpdate('description', val)}
            className="text-sm text-neutral-600 mb-4 leading-relaxed"
            multiline
            placeholder="Package description"
          />

          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold" style={{ color: primaryColor }}>$</span>
            <EditableText
              value={packageData.price?.toString()}
              onChange={(val) => handleUpdate('price', parseFloat(val))}
              className="text-5xl font-bold"
              placeholder="999"
            />
          </div>
          <p className="text-sm text-neutral-500 mt-1">starting price</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 py-4 border-b border-neutral-100">
          <div className="text-center">
            <EditableText
              value={packageData.photo_count}
              onChange={(val) => handleUpdate('photo_count', val)}
              className="font-bold text-lg"
              placeholder="200"
            />
            <p className="text-xs text-neutral-500 mt-0.5">Photos</p>
          </div>
          <div className="text-center">
            <EditableText
              value={packageData.session_length}
              onChange={(val) => handleUpdate('session_length', val)}
              className="font-bold text-lg"
              style={{ color: primaryColor }}
              placeholder="4 hours"
            />
            <p className="text-xs text-neutral-500 mt-0.5">Duration</p>
          </div>
          <div className="text-center">
            <EditableText
              value={packageData.turnaround}
              onChange={(val) => handleUpdate('turnaround', val)}
              className="font-bold text-lg"
              placeholder="2 weeks"
            />
            <p className="text-xs text-neutral-500 mt-0.5">Delivery</p>
          </div>
        </div>

        {/* Features */}
        <div className="py-4 flex-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              What's Included
            </p>
            <Button
              onClick={addFeature}
              size="sm"
              variant="ghost"
              className="h-6 px-2"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <DragDropContext onDragEnd={handleFeatureDragEnd}>
            <Droppable droppableId="features">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {packageData.features.map((feature, index) => (
                    <Draggable key={index} draggableId={`feature-${index}`} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-start gap-2 py-1 group",
                            snapshot.isDragging && "bg-neutral-50 rounded"
                          )}
                        >
                          <div {...provided.dragHandleProps} className="pt-0.5">
                            <GripVertical className="w-3 h-3 text-neutral-300" />
                          </div>
                          <div 
                            className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `${primaryColor}15` }}
                          >
                            <Check className="w-2.5 h-2.5" style={{ color: primaryColor }} />
                          </div>
                          <EditableText
                            value={feature}
                            onChange={(val) => updateFeature(index, val)}
                            className="flex-1 text-sm text-neutral-700"
                            placeholder="Feature name"
                          />
                          <button
                            onClick={() => removeFeature(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
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
          <div className="pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: secondaryColor }}>
                Special Features
              </p>
              <Button
                onClick={addHighlight}
                size="sm"
                variant="ghost"
                className="h-6 px-2"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            <DragDropContext onDragEnd={handleHighlightDragEnd}>
              <Droppable droppableId="highlights" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-wrap gap-2"
                  >
                    {packageData.highlights.map((highlight, index) => (
                      <Draggable key={index} draggableId={`highlight-${index}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                              snapshot.isDragging && "shadow-lg"
                            )}
                            style={{
                              backgroundColor: `${secondaryColor}10`,
                              borderColor: `${secondaryColor}30`,
                              color: secondaryColor
                            }}
                          >
                            <EditableText
                              value={highlight}
                              onChange={(val) => updateHighlight(index, val)}
                              className="text-xs"
                              placeholder="Highlight"
                            />
                            <button
                              onClick={() => removeHighlight(index)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" />
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

        {/* Ideal For */}
        <div className="pt-4 mt-4 border-t border-neutral-100">
          <EditableText
            value={packageData.ideal_for}
            onChange={(val) => handleUpdate('ideal_for', val)}
            className="text-xs italic text-neutral-600 text-center"
            placeholder="Perfect for..."
          />
        </div>

        {/* CTA */}
        <Button
          className="w-full mt-6 h-11 font-semibold"
          style={{ 
            backgroundColor: primaryColor,
            color: 'white'
          }}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}