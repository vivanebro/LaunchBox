import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { MergeField, extractMergeFieldKeys } from './MergeFieldExtension';
import TipTapToolbar from './TipTapToolbar';

const CONTRACT_STYLES = `
  .contract-editor .tiptap {
    outline: none;
    min-height: 1120px;
    padding: 24px;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1a1a1a;
  }
  .contract-editor .tiptap h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 1em 0 0.5em;
    color: var(--accent-color, #ff0044);
  }
  .contract-editor .tiptap h2 {
    font-size: 18px;
    font-weight: 700;
    margin: 0.75em 0 0.4em;
    color: var(--accent-color, #ff0044);
  }
  .contract-editor .tiptap p {
    margin: 0.5em 0;
  }
  .contract-editor .tiptap ul,
  .contract-editor .tiptap ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
    list-style-position: outside;
  }
  .contract-editor .tiptap ul { list-style-type: disc; }
  .contract-editor .tiptap ol { list-style-type: decimal; }
  .contract-editor .tiptap li {
    margin: 0.25em 0;
  }
  .contract-editor .tiptap li > p {
    margin: 0;
  }
  .contract-editor .tiptap hr {
    border: none;
    border-top: 2px solid var(--accent-color, #ff0044);
    margin: 1.5em 0;
    opacity: 0.3;
  }
`;

export default function TipTapEditor({ value, onChange, onMergeFieldsChange, accentColor = '#ff0044' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      MergeField,
    ],
    content: (() => {
      if (!value) return '';
      try { return JSON.parse(value); } catch { return value; }
    })(),
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON());
      onChange?.(json);
      const fields = extractMergeFieldKeys(editor.getJSON());
      onMergeFieldsChange?.(fields);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const fields = extractMergeFieldKeys(editor.getJSON());
    onMergeFieldsChange?.(fields);
  }, [editor, value, onMergeFieldsChange]);

  const [isEmpty, setIsEmpty] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  useEffect(() => {
    if (!editor) return;
    const sync = () => setIsEmpty(editor.isEmpty);
    sync();
    editor.on('update', sync);
    editor.on('focus', () => setIsFocused(true));
    editor.on('blur', () => setIsFocused(false));
    return () => {
      editor.off('update', sync);
    };
  }, [editor]);

  const handleInsertMergeField = (field) => {
    if (!editor) return;
    editor.chain().focus().insertMergeField({ key: field.key, label: field.label }).run();
    const fields = extractMergeFieldKeys(editor.getJSON());
    onMergeFieldsChange?.(fields);
  };

  return (
    <>
      <style>{CONTRACT_STYLES}</style>
      <div
        className="contract-editor border border-gray-200 rounded-xl overflow-hidden bg-white relative"
        style={{ '--accent-color': accentColor }}
      >
        <TipTapToolbar editor={editor} onInsertMergeField={handleInsertMergeField} />
        <div className="relative">
          <EditorContent editor={editor} />
          {isEmpty && !isFocused && (
            <div className="absolute inset-0 px-6 pt-6 pointer-events-none select-none" aria-hidden="true">
              <p className="text-[11px] uppercase tracking-wider text-gray-300 mb-3">Example — start typing to replace · use <span className="font-semibold text-gray-400">Insert Field</span> to add {'{client_name}'}, {'{date}'}, etc.</p>
              <h1 style={{ color: accentColor, opacity: 0.25 }} className="text-2xl font-bold mb-2">Service Agreement</h1>
              <p className="text-sm text-gray-300 mb-6">Between {'{client_name}'} and your business, dated {'{start_date}'}.</p>
              <h2 style={{ color: accentColor, opacity: 0.25 }} className="text-lg font-bold mb-1">Scope of Work</h2>
              <p className="text-sm text-gray-300 mb-1">A short description of what you will deliver…</p>
              <p className="text-sm text-gray-300 mb-5">…</p>
              <h2 style={{ color: accentColor, opacity: 0.25 }} className="text-lg font-bold mb-1">Payment</h2>
              <p className="text-sm text-gray-300 mb-1">Total: {'{total_price}'}, paid in {'{payment_terms}'}…</p>
              <p className="text-sm text-gray-300 mb-5">…</p>
              <h2 style={{ color: accentColor, opacity: 0.25 }} className="text-lg font-bold mb-1">Terms</h2>
              <p className="text-sm text-gray-300">Cancellation, revisions, ownership rights…</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Render TipTap JSON to HTML string (for signing page).
 */
export function renderContractToHtml(body, accentColor = '#ff0044') {
  if (!body) return '';
  let doc;
  try { doc = JSON.parse(body); } catch { return body; }

  const renderNode = (node) => {
    if (!node) return '';
    if (node.type === 'text') {
      let text = escapeHtml(node.text || '');
      if (node.marks) {
        node.marks.forEach(mark => {
          if (mark.type === 'bold') text = `<strong>${text}</strong>`;
          if (mark.type === 'italic') text = `<em>${text}</em>`;
          if (mark.type === 'underline') text = `<u>${text}</u>`;
        });
      }
      return text;
    }
    if (node.type === 'mergeField') {
      return `<span data-merge-field="${node.attrs?.key}" style="background:#fff0f3;border:1px solid ${accentColor};border-radius:4px;padding:1px 6px;color:${accentColor};font-size:0.875em;">{${node.attrs?.key}}</span>`;
    }
    const children = (node.content || []).map(renderNode).join('');
    switch (node.type) {
      case 'doc': return children;
      case 'paragraph': return `<p style="margin:0.5em 0;">${children || '&nbsp;'}</p>`;
      case 'heading': {
        const level = node.attrs?.level || 1;
        return `<h${level} style="font-size:${level === 1 ? '24px' : '18px'};font-weight:700;color:${accentColor};margin:1em 0 0.5em;">${children}</h${level}>`;
      }
      case 'bulletList': return `<ul style="padding-left:1.5em;margin:0.5em 0;list-style-type:disc;list-style-position:outside;">${children}</ul>`;
      case 'orderedList': return `<ol style="padding-left:1.5em;margin:0.5em 0;list-style-type:decimal;list-style-position:outside;">${children}</ol>`;
      case 'listItem': {
        const inner = (node.content || []).map((child) => {
          if (child.type === 'paragraph') {
            const para = (child.content || []).map(renderNode).join('');
            return `<p style="margin:0;">${para || '&nbsp;'}</p>`;
          }
          return renderNode(child);
        }).join('');
        return `<li style="margin:0.25em 0;">${inner}</li>`;
      }
      case 'horizontalRule': return `<hr style="border:none;border-top:2px solid ${accentColor};margin:1.5em 0;opacity:0.3;" />`;
      case 'hardBreak': return '<br />';
      default: return children;
    }
  };

  return renderNode(doc);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Replace {key} placeholders in rendered HTML with stored values.
 */
export function replaceMergeFields(html, mergeFieldDefinitions = []) {
  let result = html;
  mergeFieldDefinitions.forEach(({ key, value }) => {
    if (!key) return;
    const safeValue = escapeHtml(String(value || ''));
    result = result.replace(
      new RegExp(`<span[^>]*data-merge-field="${key}"[^>]*>\\{${key}\\}</span>`, 'g'),
      safeValue
    );
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), safeValue);
  });
  return result;
}
