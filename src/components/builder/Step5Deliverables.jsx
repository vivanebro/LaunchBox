import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, GripVertical, Plus, ArrowRight, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const COMMON_DELIVERABLES = [
  'Short-form video (15-60s)',
  'Long-form video (2-10min)',
  'Social media reel',
  'Instagram Story',
  'TikTok video',
  'YouTube video',
  'YouTube Short',
  'Product ad',
  'Brand story video',
  'Testimonial video',
  'Event highlight video',
  'Corporate video',
  'Training video',
  'Explainer video',
  'Animation video',
  'UGC-style ad',
  'Video editing',
  'Color grading',
  'Sound design',
  'Motion graphics',
  'Creative strategy',
  'Ad strategy plan',
  'Scriptwriting',
  'Storyboarding',
  'Location scouting',
  'Casting support',
  'Photography session',
  'Product photography',
  'Lifestyle photography',
  'Headshot session',
  'Event photography',
  'Thumbnail design',
  'Video thumbnail set',
  'Social media graphics',
  'Brand assets package',
];

export default function Step5Deliverables({ data, onChange, onNext }) {
  const [deliverables, setDeliverables] = React.useState(() => {
    const existing = data.core_deliverables || [];
    return existing.map(d => ({ ...d, id: d.id || `${Date.now()}-${Math.random()}` }));
  });
  const [inputValue, setInputValue] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [editValue, setEditValue] = React.useState('');
  const inputRef = React.useRef(null);

  const updateParentConfig = (newDeliverables) => {
    const filteredDeliverables = newDeliverables.filter(d => d.type.trim());
    
    const deliverablesWithIds = filteredDeliverables.map(d => ({
      ...d,
      id: d.id || `${Date.now()}-${Math.random()}`
    }));

    if (deliverablesWithIds.length > 0) {
      const starter_deliverables = deliverablesWithIds.slice(0, 1);
      const growth_deliverables = deliverablesWithIds.slice(0, 2);
      const premium_deliverables = deliverablesWithIds;
      
      onChange({
        core_deliverables: deliverablesWithIds,
        starter_deliverables,
        growth_deliverables,
        premium_deliverables
      });
    } else {
      onChange({
        core_deliverables: [],
        starter_deliverables: [],
        growth_deliverables: [],
        premium_deliverables: []
      });
    }
  };

  const addDeliverable = (type) => {
    if (!type.trim()) return;
    
    const newDeliverables = [...deliverables, { 
      id: `${Date.now()}-${Math.random()}`, 
      type: type.trim()
    }];
    setDeliverables(newDeliverables);
    updateParentConfig(newDeliverables);
    setInputValue('');
    setOpen(false);
    
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeDeliverable = (id) => {
    const newDeliverables = deliverables.filter(d => d.id !== id);
    setDeliverables(newDeliverables);
    updateParentConfig(newDeliverables);
  };

  const startEdit = (deliverable) => {
    setEditingId(deliverable.id);
    setEditValue(deliverable.type);
  };

  const saveEdit = (id) => {
    if (!editValue.trim()) return;
    
    const updated = deliverables.map(d => 
      d.id === id ? { ...d, type: editValue.trim() } : d
    );
    setDeliverables(updated);
    updateParentConfig(updated);
    setEditingId(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      e.stopPropagation();
      addDeliverable(inputValue);
    }
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      saveEdit(id);
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(deliverables);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setDeliverables(reorderedItems);
    updateParentConfig(reorderedItems);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">What are your core deliverables?</h2>
        <p className="text-gray-600">Add the main items/services you'll provide</p>
      </div>

      {/* Added Deliverables List */}
      {deliverables.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="deliverables">
            {(provided) => (
              <div
                className="space-y-3 mb-6"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {deliverables.map((deliverable, index) => (
                  <Draggable key={deliverable.id} draggableId={deliverable.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex gap-3 items-center rounded-xl p-4 border-2 transition-all ${
                          snapshot.isDragging 
                            ? 'bg-blue-50 border-blue-300 shadow-lg scale-105' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div 
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing p-2 -ml-1 -my-1 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-5 h-5 text-gray-400" />
                        </div>
                        
                        {editingId === deliverable.id ? (
                          <>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, deliverable.id)}
                              className="flex-1 h-10 bg-white border-gray-300 text-gray-900"
                              autoFocus
                            />
                            <Button
                              onClick={() => saveEdit(deliverable.id)}
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full flex-shrink-0"
                              title="Save"
                            >
                              <Check className="w-5 h-5" />
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full flex-shrink-0"
                              title="Cancel"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <div 
                              className="flex-1 font-medium text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => startEdit(deliverable)}
                              title="Click to edit"
                            >
                              {deliverable.type}
                            </div>
                            
                            <Button
                              onClick={() => removeDeliverable(deliverable.id)}
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex-shrink-0"
                              title="Remove"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Add Deliverable */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border-2 border-indigo-200">
        <div className="space-y-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 border-2 border-indigo-300 hover:border-indigo-400 bg-white justify-start text-left font-normal"
              >
                <Plus className="w-4 h-4 mr-2 text-indigo-600" />
                <span className="text-gray-600">Choose from list...</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search deliverables..." />
                <CommandList>
                  <CommandEmpty>No deliverable found.</CommandEmpty>
                  <CommandGroup>
                    {COMMON_DELIVERABLES.map((item) => (
                      <CommandItem
                        key={item}
                        value={item}
                        onSelect={() => addDeliverable(item)}
                        className="cursor-pointer"
                      >
                        {item}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-12 bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-indigo-400"
              placeholder="Or type a custom deliverable..."
            />
            <Button
              onClick={() => addDeliverable(inputValue)}
              disabled={!inputValue.trim()}
              className="h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 flex-shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}