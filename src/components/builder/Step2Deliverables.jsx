import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, GripVertical, Plus, ArrowRight, Check, Minus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const CATEGORIZED_DELIVERABLES = {
  'Home Services': [
    'Complete system installation with warranty',
    'Full property inspection and assessment',
    'Custom design tailored to your property',
    'Professional photo documentation (before/after)',
    '30-day post-project quality check',
  ],
  'Marketing & Creative': [
    'High-converting ad creatives',
    '3x Hook variations',
    'Strategic content plan with posting calendar',
    'Full content management across platforms',
    'Monthly performance report',
    'On-trend social media shorts (ready to post)',
  ],
  'Tech & IT': [
    'Zero-downtime guarantee',
    'Bulletproof security setup',
    'Same-day issue resolution',
    'Monthly peace-of-mind health report',
    'Dedicated tech team on standby',
  ],
  'Finance & Operations': [
    'Stress-free monthly bookkeeping',
    'Tax-ready financial statements',
    'Clear cash flow visibility',
    'Monthly strategy call',
    '24/7 account manager',
  ],
  'Automotive': [
    'Showroom-level finish inside and out',
    'Paint correction and scratch removal',
    'Long-lasting ceramic protection',
    'Interior deep clean and sanitization',
    'Detailed before/after photo report',
  ],
  'Pest Control': [
    'Full property pest-free guarantee',
    'Comprehensive interior and exterior treatment',
    'Seasonal prevention program',
    'Same-day emergency response',
    'Detailed inspection report with photos',
  ],
};

export default function Step2Deliverables({ data, onChange, onNext }) {
  const [deliverables, setDeliverables] = React.useState(() => {
    const existing = data.core_deliverables || [];
    return existing.map(d => ({
      ...d,
      id: d.id || `${Date.now()}-${Math.random()}`,
      quantity: d.quantity || 1
    }));
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

    // Parse quantity if the text starts with a number like "3x "
    let quantity = 1;
    let cleanType = type.trim();
    const qtyMatch = cleanType.match(/^(\d+)\s*x\s+(.+)$/i);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1]);
      cleanType = qtyMatch[2];
    }

    const newDeliverables = [...deliverables, {
      id: `${Date.now()}-${Math.random()}`,
      type: cleanType,
      quantity
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

  const updateQuantity = (id, delta) => {
    const updated = deliverables.map(d => {
      if (d.id === id) {
        const newQty = Math.max(1, (d.quantity || 1) + delta);
        return { ...d, quantity: newQty };
      }
      return d;
    });
    setDeliverables(updated);
    updateParentConfig(updated);
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
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Deliverables</h2>
        <p className="text-gray-500 text-base">Think outcomes, not process. What will your client walk away with?</p>
        <p className="text-sm text-gray-400 mt-2">"Complete kitchen renovation" not "80 hours of labor + materials"</p>
      </div>

      {/* Input area - ABOVE the list */}
      <div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-12 bg-gray-100 border-0 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-1 focus:ring-gray-300 rounded-full px-5"
              placeholder={deliverables.length === 0
                ? "Your core service (e.g., full home renovation, brand video, monthly bookkeeping)"
                : "Add another deliverable..."
              }
              autoFocus
            />
            <Button
              onClick={() => addDeliverable(inputValue)}
              disabled={!inputValue.trim()}
              className="h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 flex-shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium pl-1">
                <Plus className="w-4 h-4" />
                Browse ideas for inspiration
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search deliverables..." />
                <CommandList>
                  <CommandEmpty>No match found. Type your own above.</CommandEmpty>
                  {Object.entries(CATEGORIZED_DELIVERABLES).map(([category, items]) => (
                    <CommandGroup key={category} heading={category}>
                      {items.map((item) => (
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
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Deliverables list - BELOW the input */}
      {deliverables.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="deliverables">
            {(provided) => (
              <div
                className="space-y-2"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {deliverables.map((deliverable, index) => (
                  <Draggable key={deliverable.id} draggableId={deliverable.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex gap-3 items-center rounded-xl p-3 transition-all ${
                          snapshot.isDragging
                            ? 'bg-blue-50 shadow-lg scale-105'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>

                        {editingId === deliverable.id ? (
                          <>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, deliverable.id)}
                              className="flex-1 h-9 bg-white border-gray-300 text-gray-900 text-sm"
                              autoFocus
                            />
                            <Button
                              onClick={() => saveEdit(deliverable.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full flex-shrink-0"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={cancelEdit}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {/* Quantity controls */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {(deliverable.quantity || 1) > 1 && (
                                <button
                                  onClick={() => updateQuantity(deliverable.id, -1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              )}
                              {(deliverable.quantity || 1) > 1 && (
                                <span className="text-sm font-semibold text-indigo-600 w-6 text-center">
                                  {deliverable.quantity}x
                                </span>
                              )}
                              <button
                                onClick={() => updateQuantity(deliverable.id, 1)}
                                className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div
                              className="flex-1 text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => startEdit(deliverable)}
                              title="Click to edit"
                            >
                              {deliverable.type}
                            </div>

                            <Button
                              onClick={() => removeDeliverable(deliverable.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
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
    </div>
  );
}
