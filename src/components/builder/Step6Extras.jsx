import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, GripVertical, Plus, ArrowRight, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const COMMON_BONUSES = [
  'Free Hook variations for each video',
  'Free strategy session',
  '3 hook ideas for next ad',
  'Free thumbnail design',
  'BTS Clip',
  'BTS Photos',
  '30 Photo bundle from shoot',
  'Extra format version of your choice',
  'Raw footage access',
  '"Teaser" or trailer version',
  'Lifetime access to all project files',
  'Future project 10% discount',
  'Priority support for 30 days',
  'Rush delivery option',
  'Unlimited revisions',
  '2 rounds of revisions',
  '3 rounds of revisions',
  'Same-day delivery',
  '24-hour turnaround',
  'Weekend availability',
  'Expedited review process',
  'Direct phone/video consultation',
  'Monthly strategy call',
  'Quarterly review sessions',
  'Social media posting schedule',
  'Content calendar template',
  'Caption writing',
  'Hashtag strategy',
  'Video hosting setup',
  'Analytics dashboard',
  'Performance report',
  'Competitor analysis',
  'Brand style guide',
  'Music licensing included',
  'Stock footage access',
  'Props & wardrobe consultation',
];

export default function Step6Extras({ data, onChange, onNext }) {
  const [bonuses, setBonuses] = React.useState(() => {
    const existing = data.extras_bonuses || [];
    return existing.map(b => ({ 
      id: `${Date.now()}-${Math.random()}`, 
      type: typeof b === 'string' ? b : b.type 
    }));
  });
  const [inputValue, setInputValue] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [editValue, setEditValue] = React.useState('');
  const inputRef = React.useRef(null);

  const updateConfig = (updatedBonuses) => {
    const filteredBonuses = updatedBonuses.filter(b => b.type.trim()).map(b => b.type);
    
    const starter_bonuses = filteredBonuses.slice(0, 1);
    const growth_bonuses = filteredBonuses.slice(0, 3);
    const premium_bonuses = filteredBonuses;
    
    onChange({
      extras_bonuses: filteredBonuses,
      starter_bonuses,
      growth_bonuses,
      premium_bonuses
    });
  };

  const addBonus = (type) => {
    if (!type.trim()) return;
    
    const updated = [...bonuses, { 
      id: `${Date.now()}-${Math.random()}`, 
      type: type.trim() 
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
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-bold mb-4 text-gray-900">What bonuses do you offer?</h2>
        <p className="text-gray-600">Add extra value that makes your packages more attractive</p>
      </div>

      <div className="space-y-6">
        {/* Added Bonuses List */}
        {bonuses.length > 0 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="bonuses">
              {(provided) => (
                <div 
                  className="space-y-3 mb-6"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {bonuses.map((bonus, index) => (
                    <Draggable key={bonus.id} draggableId={bonus.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex gap-3 items-center rounded-xl p-4 border-2 transition-all ${
                            snapshot.isDragging 
                              ? 'bg-yellow-50 border-yellow-300 shadow-lg scale-105' 
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
                          
                          {editingId === bonus.id ? (
                            <>
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleEditKeyDown(e, bonus.id)}
                                className="flex-1 h-10 bg-white border-gray-300 text-gray-900"
                                autoFocus
                              />
                              <Button
                                onClick={() => saveEdit(bonus.id)}
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
                                className="flex-1 font-medium text-gray-900 cursor-pointer hover:text-yellow-600 transition-colors"
                                onClick={() => startEdit(bonus)}
                                title="Click to edit"
                              >
                                {bonus.type}
                              </div>
                              
                              <Button
                                onClick={() => removeBonus(bonus.id)}
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

        {/* Add Bonus */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200">
          <div className="space-y-3">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-yellow-300 hover:border-yellow-400 bg-white justify-start text-left font-normal"
                >
                  <Plus className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-gray-600">Choose from list...</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search bonuses..." />
                  <CommandList>
                    <CommandEmpty>No bonus found.</CommandEmpty>
                    <CommandGroup>
                      {COMMON_BONUSES.map((item) => (
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
                className="flex-1 h-12 bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-yellow-400"
                placeholder="Or type a custom bonus..."
              />
              <Button
                onClick={() => addBonus(inputValue)}
                disabled={!inputValue.trim()}
                className="h-12 w-12 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl disabled:opacity-50 flex-shrink-0"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}