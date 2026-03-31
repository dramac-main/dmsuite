"use client";

// =============================================================================
// DMSuite — Slidev Settings Tab: Transitions, aspect ratio, metadata
// =============================================================================

import React from "react";
import type { TransitionType, LayoutType } from "@/lib/slidev/parser";
import { LAYOUT_INFO } from "@/lib/slidev/parser";
import {
  FormInput,
  FormSelect,
  SectionLabel,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ── Props ───────────────────────────────────────────────────────────────────

interface SlidevSettingsTabProps {
  // Metadata from headmatter
  title: string;
  author: string;
  // Settings
  aspectRatio: "16:9" | "4:3" | "16:10";
  transition: TransitionType;
  activeSlideLayout: LayoutType;
  // Callbacks
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
  onAspectRatioChange: (ar: "16:9" | "4:3" | "16:10") => void;
  onTransitionChange: (t: TransitionType) => void;
  onSlideLayoutChange: (layout: LayoutType) => void;
}

const TRANSITION_OPTIONS: { value: TransitionType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade" },
  { value: "fade-out", label: "Fade Out" },
  { value: "slide-left", label: "Slide Left" },
  { value: "slide-right", label: "Slide Right" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-down", label: "Slide Down" },
];

const ASPECT_OPTIONS: { value: string; label: string }[] = [
  { value: "16:9", label: "16:9 (Widescreen)" },
  { value: "4:3", label: "4:3 (Standard)" },
  { value: "16:10", label: "16:10 (Laptop)" },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function SlidevSettingsTab({
  title,
  author,
  aspectRatio,
  transition,
  activeSlideLayout,
  onTitleChange,
  onAuthorChange,
  onAspectRatioChange,
  onTransitionChange,
  onSlideLayoutChange,
}: SlidevSettingsTabProps) {
  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1 custom-scrollbar">
      {/* ── Presentation Metadata ─────────── */}
      <div>
        <SectionLabel>Presentation Info</SectionLabel>
        <div className="mt-2 space-y-3">
          <FormInput
            label="Title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Presentation title"
          />
          <FormInput
            label="Author"
            value={author}
            onChange={(e) => onAuthorChange(e.target.value)}
            placeholder="Presenter name"
          />
        </div>
      </div>

      {/* ── Display Settings ──────────────── */}
      <div>
        <SectionLabel>Display</SectionLabel>
        <div className="mt-2 space-y-3">
          <FormSelect
            label="Aspect Ratio"
            value={aspectRatio}
            onChange={(e) => onAspectRatioChange(e.target.value as "16:9" | "4:3" | "16:10")}
          >
            {ASPECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </FormSelect>
          <FormSelect
            label="Transition"
            value={transition}
            onChange={(e) => onTransitionChange(e.target.value as TransitionType)}
          >
            {TRANSITION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </FormSelect>
        </div>
      </div>

      {/* ── Current Slide Layout ──────────── */}
      <div>
        <SectionLabel>Slide Layout</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {LAYOUT_INFO.map((l) => (
            <button
              key={l.id}
              onClick={() => onSlideLayoutChange(l.id)}
              className={`text-left px-2 py-1.5 rounded-lg text-xs transition-all border ${
                l.id === activeSlideLayout
                  ? "bg-primary-500/15 border-primary-500/50 text-primary-400"
                  : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
              title={l.description}
            >
              <span className="font-medium">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Keyboard Shortcuts ────────────── */}
      <div>
        <SectionLabel>Keyboard Shortcuts</SectionLabel>
        <div className="mt-2 space-y-1 text-[11px]">
          {[
            ["→ / Space", "Next slide"],
            ["← / Backspace", "Previous slide"],
            ["F", "Fullscreen present"],
            ["P", "Presenter mode"],
            ["O", "Slide overview"],
            ["D", "Toggle dark mode"],
            ["Esc", "Exit mode"],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between">
              <code className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300 font-mono text-[10px]">
                {key}
              </code>
              <span className="text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Syntax Reference ──────────────── */}
      <div>
        <SectionLabel>Markdown Syntax</SectionLabel>
        <div className="mt-2 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
          <pre className="text-[10px] text-gray-400 font-mono whitespace-pre leading-relaxed">
            {`---                    # Slide separator
layout: center         # Set layout
---                    # End frontmatter

# Heading              # Slide title
**bold** *italic*      # Formatting
\`code\` ~~strike~~      # Inline styles

\`\`\`javascript          # Code block
const x = 42;
\`\`\`

$E=mc^2$               # Inline math
$$\\sum_{i=1}^n i$$     # Block math

\`\`\`mermaid              # Diagram
graph LR
  A --> B
\`\`\`

::right::              # Column split
<!-- notes -->          # Speaker notes
<!-- v-click -->        # Click animation`}
          </pre>
        </div>
      </div>
    </div>
  );
}
