// =============================================================================
// DMSuite — Slidev Parser: Markdown → Slides
// Handles frontmatter extraction, slide splitting, note parsing, click counting.
// =============================================================================

// ── Layout types (17 Slidev-compatible layouts) ─────────────────────────────

export type LayoutType =
  | "default"
  | "center"
  | "cover"
  | "intro"
  | "end"
  | "section"
  | "statement"
  | "fact"
  | "quote"
  | "two-cols"
  | "two-cols-header"
  | "image"
  | "image-left"
  | "image-right"
  | "full"
  | "iframe"
  | "none";

export type TransitionType =
  | "none"
  | "fade"
  | "fade-out"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down";

// ── Slide shape ─────────────────────────────────────────────────────────────

export interface SlideFrontmatter {
  layout?: LayoutType;
  class?: string;
  background?: string;
  transition?: TransitionType;
  clicks?: number;
  image?: string;
  url?: string;
  [key: string]: unknown;
}

export interface SlidevSlide {
  id: string;
  index: number;
  rawContent: string;
  frontmatter: SlideFrontmatter;
  content: string;
  notes: string;
  layout: LayoutType;
}

// ── Headmatter (deck-level config) ──────────────────────────────────────────

export interface SlidevHeadmatter {
  theme?: string;
  title?: string;
  author?: string;
  date?: string;
  transition?: TransitionType;
  aspectRatio?: string;
  highlightTheme?: string;
  [key: string]: unknown;
}

export interface ParsedDeck {
  headmatter: SlidevHeadmatter;
  slides: SlidevSlide[];
}

// ── Simple YAML parser (key: value lines only) ─────────────────────────────

function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const line of yaml.split("\n")) {
    const match = line.match(/^([\w][\w-]*):\s*(.*)/);
    if (!match) continue;
    const key = match[1];
    const raw = match[2].trim();
    if (raw === "true") result[key] = true;
    else if (raw === "false") result[key] = false;
    else if (/^\d+(\.\d+)?$/.test(raw)) result[key] = Number(raw);
    else result[key] = raw.replace(/^['"]|['"]$/g, "");
  }
  return result;
}

// ── Main parser ─────────────────────────────────────────────────────────────

export function parseSlidevMarkdown(markdown: string): ParsedDeck {
  if (!markdown) {
    return {
      headmatter: {},
      slides: [{
        id: "slide-empty-0",
        index: 0,
        rawContent: "",
        frontmatter: {},
        content: "\n# Untitled\n\nStart writing...\n",
        notes: "",
        layout: "cover" as LayoutType,
      }],
    };
  }
  const text = markdown.replace(/\r\n/g, "\n").trim();

  let headmatter: SlidevHeadmatter = {};
  let body = text;

  // Extract headmatter (document starts with ---)
  const hmMatch = text.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (hmMatch) {
    headmatter = parseSimpleYaml(hmMatch[1]) as SlidevHeadmatter;
    body = text.slice(hmMatch[0].length);
  }

  // Split remaining body by --- slide separators (--- on its own line)
  const rawParts = body.split(/\n---\s*\n/);

  const slides: SlidevSlide[] = [];

  for (let i = 0; i < rawParts.length; i++) {
    const raw = rawParts[i];
    if (!raw.trim() && i > 0 && rawParts.length > 1) continue;

    let frontmatter: SlideFrontmatter = {};
    let content = raw;

    // Check for per-slide frontmatter: key-value lines followed by ---
    const fmMatch = raw.match(
      /^((?:\s*[\w][\w-]*:\s*.*\n)+)\s*---\s*\n?([\s\S]*)/,
    );
    if (fmMatch && fmMatch[1].trim()) {
      frontmatter = parseSimpleYaml(fmMatch[1]) as SlideFrontmatter;
      content = fmMatch[2] || "";
    }

    // Extract speaker notes from <!-- --> comments at end of slide
    let notes = "";
    const notesMatch = content.match(/\n?<!--\s*([\s\S]*?)\s*-->\s*$/);
    if (notesMatch) {
      notes = notesMatch[1].trim();
      content = content.slice(0, notesMatch.index!).trimEnd();
    }

    // Determine layout
    const layout: LayoutType =
      (frontmatter.layout as LayoutType) ||
      (slides.length === 0 ? "cover" : "default");

    slides.push({
      id: `slide-${i}-${Math.random().toString(36).slice(2, 6)}`,
      index: i,
      rawContent: raw,
      frontmatter,
      content: content.trim(),
      notes,
      layout,
    });
  }

  // Ensure at least one slide
  if (slides.length === 0) {
    slides.push({
      id: `slide-0-${Math.random().toString(36).slice(2, 6)}`,
      index: 0,
      rawContent: "",
      frontmatter: {},
      content: "",
      notes: "",
      layout: "cover",
    });
  }

  // Re-index
  slides.forEach((s, idx) => {
    s.index = idx;
  });

  return { headmatter, slides };
}

// ── Reconstruct markdown from headmatter + slides ──────────────────────────

export function reconstructMarkdown(
  headmatter: SlidevHeadmatter,
  slides: SlidevSlide[],
): string {
  const parts: string[] = [];

  // Headmatter block
  const hmEntries = Object.entries(headmatter).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (hmEntries.length > 0) {
    parts.push("---");
    for (const [k, v] of hmEntries) {
      parts.push(`${k}: ${v}`);
    }
    parts.push("---");
    parts.push("");
  }

  // Slides
  for (let i = 0; i < slides.length; i++) {
    if (i > 0) {
      parts.push("");
      parts.push("---");
      parts.push("");
    }

    const slide = slides[i];

    // Per-slide frontmatter (only if non-empty and not just "default" layout)
    const fmEntries = Object.entries(slide.frontmatter).filter(
      ([k, v]) => {
        if (v === undefined || v === "") return false;
        if (k === "layout" && v === "default" && i > 0) return false;
        if (k === "layout" && v === "cover" && i === 0) return false;
        return true;
      },
    );

    if (fmEntries.length > 0) {
      for (const [k, v] of fmEntries) {
        parts.push(`${k}: ${v}`);
      }
      parts.push("---");
      parts.push("");
    }

    // Content
    if (slide.content) {
      parts.push(slide.content);
    }

    // Notes
    if (slide.notes) {
      parts.push("");
      parts.push(`<!-- ${slide.notes} -->`);
    }
  }

  return parts.join("\n");
}

// ── Count v-click markers ───────────────────────────────────────────────────

export function countClicks(content: string): number {
  const markers = content.match(/<!--\s*v-click\s*-->/g);
  return markers ? markers.length : 0;
}

// ── Layout metadata ─────────────────────────────────────────────────────────

export const LAYOUT_INFO: {
  id: LayoutType;
  label: string;
  description: string;
}[] = [
  { id: "default", label: "Default", description: "Standard content with heading" },
  { id: "center", label: "Center", description: "Vertically & horizontally centered" },
  { id: "cover", label: "Cover", description: "Title/cover slide" },
  { id: "intro", label: "Intro", description: "Introduction with author info" },
  { id: "end", label: "End", description: "Closing/thank-you slide" },
  { id: "section", label: "Section", description: "Section divider" },
  { id: "statement", label: "Statement", description: "Large centered statement" },
  { id: "fact", label: "Fact", description: "Big number or key fact" },
  { id: "quote", label: "Quote", description: "Blockquote with attribution" },
  { id: "two-cols", label: "Two Columns", description: "Content split into two columns" },
  { id: "two-cols-header", label: "Two Cols + Header", description: "Full-width header with two columns" },
  { id: "image", label: "Image", description: "Full background image" },
  { id: "image-left", label: "Image Left", description: "Image on left, content on right" },
  { id: "image-right", label: "Image Right", description: "Image on right, content on left" },
  { id: "full", label: "Full", description: "Full page, no padding" },
  { id: "iframe", label: "iFrame", description: "Embedded web page" },
  { id: "none", label: "None", description: "No layout styling applied" },
];

export const ALL_LAYOUTS: LayoutType[] = LAYOUT_INFO.map((l) => l.id);

// ── Default starter markdown ────────────────────────────────────────────────

const y = new Date().getFullYear();

export const DEFAULT_MARKDOWN = `---
theme: default
title: My Presentation
author: Your Name
date: ${y}
---

# Welcome to Presentations

Create stunning slide decks with **Markdown**

Powered by Chiko AI

---
layout: center
---

## Write Markdown, Get Slides

Separate your slides with \`---\` and start presenting

Use **layouts**, **themes**, and **animations** for beautiful results

---

## Code Highlighting

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to DMSuite!\`;
}

greet('World');
\`\`\`

Supports **50+ languages** with syntax highlighting

---
layout: two-cols
---

## Features

Content on the left side

- Markdown-powered slides
- Code highlighting
- Math formulas (KaTeX)
- Mermaid diagrams

::right::

## And More

Content on the right side

- 17 slide layouts
- 10 built-in themes
- Click animations
- Presenter mode

---
layout: quote
---

> "The best way to predict the future is to create it."

> — Peter Drucker

<!-- These are speaker notes visible only in presenter mode. -->

---
layout: fact
---

## 50+

Languages supported for code highlighting

---
layout: center
---

# Thank You!

Start creating your own presentations now
`;
