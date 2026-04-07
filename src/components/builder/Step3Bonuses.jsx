import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, GripVertical, Plus, ArrowRight, Check, Minus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const CATEGORIZED_BONUSES = {
  'Support & Access': [
    'Priority support (same-day response)',
    'Direct phone/video access to your team',
    'Dedicated account manager',
    'Weekend and after-hours availability',
  ],
  'Speed & Delivery': [
    'Rush delivery option included',
    'Same-week turnaround guarantee',
    'Expedited review and approval process',
  ],
  'Revisions & Files': [
    'Unlimited revisions',
    'Extra revision round',
    'Raw files / source files access',
    'Lifetime access to all project files',
  ],
  'Strategy & Consulting': [
    'Free strategy session',
    'Monthly strategy call',
    'Quarterly business review',
    'Competitor analysis report',
    'Custom recommendations document',
  ],
  'Training & Education': [
    'Team training session included',
    'How-to documentation',
    'Video walkthrough of deliverables',
    'Team onboarding session',
  ],
  'Perks & Extras': [
    'Future project discount (10-15%)',
    'Content calendar template',
    'Brand style guide included',
    'Print-ready file versions',
  ],
};

export default function Step3Bonuses({ data, onChange, onNext }) {
  const [bonuses, setBonuses] = React.useState(() => {
    const existing = data.extras_bonuses || [];
    return existing.map(b => {
      if (typeof b === 'string') {
        return { id: `${Date.now()}-${Math.random()}`, type: b, quantity: 1 };
      }
      return {
        id: b.id || `${Date.now()}-${Math.random()}`,
        type: b.type,
        quantity: b.quantity || 1
      };
    });
  });
  const [inputValue, setInputValue] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [editValue, setEditValue] = React.useState('');
  const inputRef = React.useRef(null);

  const updateConfig = (updatedBonuses) => {
    const filtered = updatedBonuses.filter(b => b.type.trim());

    const starter_bonuses = filtered.slice(0, 1).map(b => b.type);
    const growth_bonuses = filtered.slice(0, 3).map(b => b.type);
    const premium_bonuses = filtered.map(b => b.type);

    onChange({
      extras_bonuses: filtered,
      starter_bonuses,
      growth_bonuses,
      premium_bonuses
    });
  };

  const addBonus = (type) => {
    if (!type.trim()) return;

    let quantity = 1;
    let cleanType = type.trim();
    const qtyMatch = cleanType.match(/^(\d+)\s*x\s+(.+)$/i);
    if (qtyMatch) {
      quantity = parseInt(qtyMatch[1]);
      cleanType = qtyMatch[2];
    }

    const updated = [...bonuses, {
      id: `${Date.now()}-${Math.random()}`,
      type: cleanType,
      quantity
    }];
    setBonuses(updated);
    updateConfig(updated);
    setInputValue('');
    setOpen(false);

    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeBonus = (id) => {
    const updated = bonuses.filter(b => b.id !== id);
    setBonuses(updated);
    updateConfig(updated);
  };

  const updateQuantity = (id, delta) => {
    const updated = bonuses.map(b => {
      if (b.id === id) {
        const newQty = Math.max(1, (b.quantity || 1) + delta);
        return { ...b, quantity: newQty };
      }
      return b;
    });
    setBonuses(updated);
    updateConfig(updated);
  };

  const startEdit = (bonus) => {
    setEditingId(bonus.id);
    setEditValue(bonus.type);
  };

  const saveEdit = (id) => {
    if (!editValue.trim()) return;

    const updated = bonuses.map(b =>
      b.id === id ? { ...b, type: editValue.trim() } : b
    );
    setBonuses(updated);
    updateConfig(updated);
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
      addBonus(inputValue);
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

    const reorderedItems = Array.from(bonuses);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setBonuses(reorderedItems);
    updateConfig(reorderedItems);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-3 text-gray-900">Bonuses</h2>
        <p className="text-gray-500 text-base">Add extras that feel valuable to the client, even if they cost you nothing extra to deliver.</p>
        <p className="text-sm text-gray-400 mt-2">"Priority support" not "we answer emails" -- make it sound like a perk</p>
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
              placeholder={bonuses.length === 0
                ? "Your top bonus (e.g., unlimited revisions, dedicated account manager)"
                : "Add another bonus..."
              }
              autoFocus
            />
            <Button
              onClick={() => addBonus(inputValue)}
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
                Browse bonus ideas for inspiration
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search bonuses..." />
                <CommandList>
                  <CommandEmpty>No match found. Type your own above.</CommandEmpty>
                  {Object.entries(CATEGORIZED_BONUSES).map(([category, items]) => (
                    <CommandGroup key={category} heading={category}>
                      {items.map((item) => (
                        <CommandItem
                          key={item}
                          value={item}
                          onSelect={() => addBonus(item)}
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

      {/* Bonuses list - BELOW the input */}
      {bonuses.length > 0 && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="bonuses">
            {(provided) => (
              <div
                className="space-y-2"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {bonuses.map((bonus, index) => (
                  <Draggable key={bonus.id} draggableId={bonus.id} index={index}>
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

                        {editingId === bonus.id ? (
                          <>
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleEditKeyDown(e, bonus.id)}
                              className="flex-1 h-9 bg-white border-gray-300 text-gray-900 text-sm"
                              autoFocus
                            />
                            <Button
                              onClick={() => saveEdit(bonus.id)}
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
                              {(bonus.quantity || 1) > 1 && (
                                <button
                                  onClick={() => updateQuantity(bonus.id, -1)}
                                  className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              )}
                              {(bonus.quantity || 1) > 1 && (
                                <span className="text-sm font-semibold text-indigo-600 w-6 text-center">
                                  {bonus.quantity}x
                                </span>
                              )}
                              <button
                                onClick={() => updateQuantity(bonus.id, 1)}
                                className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div
                              className="flex-1 text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                              onClick={() => startEdit(bonus)}
                              title="Click to edit"
                            >
                              {bonus.type}
                            </div>

                            <Button
                              onClick={() => removeBonus(bonus.id)}
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
