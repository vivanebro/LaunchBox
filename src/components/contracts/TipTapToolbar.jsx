import React, { useState } from 'react';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, ChevronDown, Plus } from 'lucide-react';
import { STANDARD_MERGE_FIELDS } from './MergeFieldExtension';

const ToolbarButton = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    className={`p-2 rounded-lg text-sm transition-colors ${
      active
        ? 'bg-[#ff0044] text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

export default function TipTapToolbar({ editor, onInsertMergeField }) {
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!editor) return null;

  const handleInsertField = (field) => {
    onInsertMergeField(field);
    setShowFieldMenu(false);
    setShowCustomInput(false);
    setCustomFieldKey('');
  };

  const handleAddCustom = () => {
    if (!customFieldKey.trim()) return;
    const key = customFieldKey.trim().toLowerCase().replace(/\s+/g, '_');
    handleInsertField({ key, label: customFieldKey.trim() });
  };

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-xl flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline"
      >
        <Underline className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <div className="relative">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setShowFieldMenu(v => !v);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#fff0f3] text-[#ff0044] border border-[#ff0044]/30 hover:bg-[#ffe0e8] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Insert Field
          <ChevronDown className="w-3 h-3" />
        </button>

        {showFieldMenu && (
          <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-2">
              <p className="text-xs font-medium text-gray-400 px-2 py-1 uppercase tracking-wide">Standard fields</p>
              {STANDARD_MERGE_FIELDS.map((field) => (
                <button
                  key={field.key}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleInsertField(field);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between group"
                >
                  <span>{field.label}</span>
                  <span className="text-xs text-[#ff0044] font-mono">{`{${field.key}}`}</span>
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <p className="text-xs font-medium text-gray-400 px-2 py-1 uppercase tracking-wide">Custom field</p>
                {showCustomInput ? (
                  <div className="px-2 py-1 flex gap-1">
                    <input
                      type="text"
                      value={customFieldKey}
                      onChange={(e) => setCustomFieldKey(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(); }}
                      placeholder="e.g. project_location"
                      className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#ff0044]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleAddCustom(); }}
                      className="px-2 py-1 bg-[#ff0044] text-white text-xs rounded hover:bg-[#cc0033]"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setShowCustomInput(true); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg"
                  >
                    + Add custom field…
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
