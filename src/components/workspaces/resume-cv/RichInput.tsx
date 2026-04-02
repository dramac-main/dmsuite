// =============================================================================
// DMSuite — Rich Text Input (TipTap-powered)
// A WYSIWYG editor for resume description fields, matching Reactive Resume's
// rich-input.tsx approach: StarterKit + Highlight + TextAlign + Underline + Link
// =============================================================================

"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import DOMPurify from "dompurify";

// ---------------------------------------------------------------------------
// TipTap extensions (matching RR)
// ---------------------------------------------------------------------------

const extensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  Highlight.configure({ HTMLAttributes: { class: "rounded px-0.5" } }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  Underline,
  Link.configure({
    openOnClick: false,
    defaultProtocol: "https",
    protocols: ["http", "https"],
  }),
];

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

function ToolbarButton({
  active = false,
  disabled = false,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={`p-1 rounded text-[11px] leading-none transition-colors ${
        active
          ? "bg-primary-500/20 text-primary-400"
          : "text-gray-400 hover:text-white hover:bg-gray-700"
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b border-gray-700 bg-gray-800/50 rounded-t-lg">
      {/* Bold */}
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" /><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </svg>
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
        </svg>
      </ToolbarButton>

      {/* Underline */}
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" />
        </svg>
      </ToolbarButton>

      {/* Strike */}
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4H9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H7" /><line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </ToolbarButton>

      <div className="w-px h-4 bg-gray-700 mx-0.5" />

      {/* Bullet List */}
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
        </svg>
      </ToolbarButton>

      {/* Ordered List */}
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
          <text x="2" y="8" fontSize="8" fill="currentColor" fontFamily="monospace">1</text>
          <text x="2" y="14" fontSize="8" fill="currentColor" fontFamily="monospace">2</text>
          <text x="2" y="20" fontSize="8" fill="currentColor" fontFamily="monospace">3</text>
        </svg>
      </ToolbarButton>

      <div className="w-px h-4 bg-gray-700 mx-0.5" />

      {/* Link */}
      <ToolbarButton
        active={editor.isActive("link")}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
          } else {
            const url = window.prompt("Enter URL:", "https://");
            if (url) {
              editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
            }
          }
        }}
        title="Insert Link"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </ToolbarButton>

      {/* Highlight */}
      <ToolbarButton
        active={editor.isActive("highlight")}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="Highlight"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </ToolbarButton>

      {/* Clear Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        title="Clear Formatting"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </ToolbarButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rich Input Component
// ---------------------------------------------------------------------------

interface RichInputProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichInput({ value, onChange, placeholder, className }: RichInputProps) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm prose-invert max-w-none px-3 py-2 min-h-[80px] max-h-[200px] overflow-y-auto focus:outline-none text-[12px] leading-relaxed text-gray-200",
        spellcheck: "false",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isUpdatingRef.current) return;
      const html = ed.getHTML();
      // Sanitize output before passing up
      const clean = typeof window !== "undefined" ? DOMPurify.sanitize(html) : html;
      onChange(clean);
    },
  });

  // Sync external value changes into the editor
  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.getHTML();
    // Only update if the external value differs (avoid cursor jumps)
    if (value !== currentHTML) {
      isUpdatingRef.current = true;
      editor.commands.setContent(value || "");
      isUpdatingRef.current = false;
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={`rounded-lg border border-gray-700 bg-gray-800 overflow-hidden ${className ?? ""}`}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
      {!value && placeholder && (
        <div className="pointer-events-none absolute inset-x-3 top-[calc(2rem+8px)] text-gray-500 text-[12px]">
          {placeholder}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TipTap Content Display (for template rendering — sanitized HTML output)
// ---------------------------------------------------------------------------

export function TiptapContent({
  content,
  className,
  style,
}: {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const sanitized = useMemo(
    () => (typeof window !== "undefined" ? DOMPurify.sanitize(content) : content),
    [content],
  );
  return (
    <div
      className={`resume-rich-text ${className ?? ""}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
