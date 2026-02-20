import React, { useState } from 'react';
import { Check, GripVertical, Trash2, Star } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
          className={cn("min-h-[80px]", className)}
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
      className={cn("cursor-pointer hover:bg-gray-50/50 rounded px-2 py-1 transition-colors", className)}
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
    </div>
  );
};

export default function EditablePackageCardStyle1({ 
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

  const removeFeature = (index) => {
    const features = packageData.features.filter((_, i) => i !== index);
    handleUpdate('features', features);
  };

  const updateFeature = (index, value) => {
    const features = [...packageData.features];
    features[index] = value;
    handleUpdate('features', features);
  };

  return (
    <div 
      className={cn(
        "relative flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border",
        isPopular ? "shadow-xl" : "shadow-lg"
      )}
      style={{
        borderColor: isPopular ? primaryColor : '#e5e7eb'
      }}
    >
      {/* Minimal popular badge */}
      {isPopular && (
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white z-10 shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <Star className="w-3 h-3 inline mr-1 fill-current" />
          Most Popular
        </div>
      )}
      
      <div className={cn("p-10", isPopular && "pt-12")}>
        {/* Title */}
        <EditableText
          value={packageData.title}
          onChange={(val) => handleUpdate('title', val)}
          className="text-3xl font-light mb-6 text-center text-gray-800"
          placeholder="Package Title"
        />

        {/* Price */}
        <div className="text-center mb-8">
          <span className="text-2xl font-light" style={{ color: primaryColor }}>$</span>
          <EditableText
            value={packageData.price?.toString()}
            onChange={(val) => handleUpdate('price', parseFloat(val))}
            className="text-6xl font-bold inline-block"
            style={{ color: primaryColor }}
            placeholder="999"
          />
          <p className="text-sm text-gray-500 mt-2">starting price</p>
        </div>

        {/* Description */}
        <EditableText
          value={packageData.description}
          onChange={(val) => handleUpdate('description', val)}
          className="text-sm text-gray-600 text-center leading-relaxed mb-10"
          multiline
          placeholder="Package description"
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <EditableText
              value={packageData.photo_count}
              onChange={(val) => handleUpdate('photo_count', val)}
              className="font-semibold text-gray-800"
              placeholder="200"
            />
            <p className="text-xs text-gray-500 mt-1">Photos</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <EditableText
              value={packageData.session_length}
              onChange={(val) => handleUpdate('session_length', val)}
              className="font-semibold text-gray-800"
              placeholder="4 hours"
            />
            <p className="text-xs text-gray-500 mt-1">Time</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <EditableText
              value={packageData.turnaround}
              onChange={(val) => handleUpdate('turnaround', val)}
              className="font-semibold text-gray-800"
              placeholder="2 weeks"
            />
            <p className="text-xs text-gray-500 mt-1">Delivery</p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <p 
            className="text-xs font-bold uppercase tracking-wider text-center mb-6"
            style={{ color: primaryColor }}
          >
            What's Included
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
                            snapshot.isDragging && "bg-gray-50 rounded-lg p-2"
                          )}
                        >
                          <div {...provided.dragHandleProps} className="pt-1 opacity-0 group-hover:opacity-100">
                            <GripVertical className="w-4 h-4 text-gray-300" />
                          </div>
                          <div 
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <EditableText
                            value={feature}
                            onChange={(val) => updateFeature(index, val)}
                            className="flex-1 text-sm text-gray-700 leading-relaxed"
                            placeholder="Feature name"
                          />
                          <button
                            onClick={() => removeFeature(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity pt-1"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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

        {/* CTA Button */}
        <button
          className="w-full font-semibold text-white h-12 rounded-lg shadow-md hover:shadow-lg transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          Get Started
        </button>

        {/* Ideal for */}
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <EditableText
            value={packageData.ideal_for}
            onChange={(val) => handleUpdate('ideal_for', val)}
            className="text-xs italic text-gray-500"
            placeholder="Perfect for..."
          />
        </div>
      </div>
    </div>
  );
}