import { Node, mergeAttributes } from '@tiptap/core';

export const MergeField = Node.create({
  name: 'mergeField',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      key: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-merge-field]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-merge-field': HTMLAttributes.key,
        'contenteditable': 'false',
        style:
          'background:#fff0f3;border:1px solid #ff0044;border-radius:4px;padding:1px 6px;color:#ff0044;font-size:0.875em;cursor:default;user-select:none;',
      }),
      `{${HTMLAttributes.key}}`,
    ];
  },

  addCommands() {
    return {
      insertMergeField:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});

/**
 * Scan a TipTap JSON document and collect all unique merge field keys.
 */
export const extractMergeFieldKeys = (doc) => {
  const keys = new Map();

  const traverse = (node) => {
    if (!node) return;
    if (node.type === 'mergeField' && node.attrs?.key) {
      keys.set(node.attrs.key, node.attrs.label || node.attrs.key);
    }
    if (node.content) {
      node.content.forEach(traverse);
    }
  };

  if (doc) traverse(doc);
  return Array.from(keys.entries()).map(([key, label]) => ({ key, label }));
};

export const STANDARD_MERGE_FIELDS = [
  { key: 'client_name', label: 'Client Name' },
  { key: 'package_name', label: 'Package Name' },
  { key: 'price', label: 'Price' },
  { key: 'date', label: 'Date' },
];
