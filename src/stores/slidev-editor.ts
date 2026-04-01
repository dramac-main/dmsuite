"use client";

// =============================================================================
// DMSuite — Slidev Presenter: Zustand Store
// Middleware: temporal(persist(immer(...)))
// The single `markdown` field is the source of truth; slides are derived.
// =============================================================================

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";

import {
  parseSlidevMarkdown,
  reconstructMarkdown,
  DEFAULT_MARKDOWN,
} from "@/lib/slidev/parser";
import type {
  LayoutType,
  TransitionType,
  SlidevSlide,
  SlidevHeadmatter,
} from "@/lib/slidev/parser";

// ── Drawing path ────────────────────────────────────────────────────────────

export interface DrawingPath {
  points: [number, number][];
  color: string;
  width: number;
}

// ── Form data (persisted via store adapter) ─────────────────────────────────

export interface SlidevFormData {
  markdown: string;
  themeId: string;
  aspectRatio: "16:9" | "4:3" | "16:10";
  transition: TransitionType;
  drawings: Record<number, DrawingPath[]>;
}

// ── Store state ─────────────────────────────────────────────────────────────

export type SlidevPhase = "prompt" | "editor";

export interface SlidevEditorState {
  form: SlidevFormData;
  phase: SlidevPhase;
  activeSlideIndex: number;

  // ── Form-level ─────────────────────────────────
  setForm: (form: SlidevFormData) => void;
  resetForm: () => void;
  setMarkdown: (md: string) => void;
  setThemeId: (id: string) => void;
  setAspectRatio: (ar: "16:9" | "4:3" | "16:10") => void;
  setTransition: (t: TransitionType) => void;

  // ── Phase / navigation ─────────────────────────
  setPhase: (p: SlidevPhase) => void;
  setActiveSlideIndex: (i: number) => void;

  // ── Slide manipulation (all modify form.markdown) ─
  updateSlideContent: (index: number, content: string) => void;
  updateSlideNotes: (index: number, notes: string) => void;
  updateSlideFrontmatter: (
    index: number,
    fm: Record<string, unknown>,
  ) => void;
  setSlideLayout: (index: number, layout: LayoutType) => void;
  addSlide: (layout?: LayoutType, afterIndex?: number) => void;
  deleteSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  moveSlide: (from: number, to: number) => void;

  // ── Headmatter helpers ─────────────────────────
  setTitle: (title: string) => void;
  setAuthor: (author: string) => void;

  // ── Drawing ────────────────────────────────────
  addDrawingPath: (slideIndex: number, path: DrawingPath) => void;
  clearDrawings: (slideIndex: number) => void;

  // ── Generation ─────────────────────────────────
  generateFromTopic: (topic: string) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function defaultForm(): SlidevFormData {
  return {
    markdown: DEFAULT_MARKDOWN,
    themeId: "default",
    aspectRatio: "16:9",
    transition: "slide-left",
    drawings: {},
  };
}

/** Parse, mutate one slide, reconstruct markdown */
function withSlideMutation(
  markdown: string,
  index: number,
  mutate: (slide: SlidevSlide, hm: SlidevHeadmatter) => void,
): string | null {
  const deck = parseSlidevMarkdown(markdown);
  if (index < 0 || index >= deck.slides.length) return null;
  mutate(deck.slides[index], deck.headmatter);
  return reconstructMarkdown(deck.headmatter, deck.slides);
}

function topicToMarkdown(topic: string): string {
  const y = new Date().getFullYear();
  return `---
theme: default
title: ${topic}
author: Your Name
date: ${y}
---

# ${topic}

A comprehensive overview

---
layout: section
---

## Agenda

---

## Introduction

This presentation provides an in-depth look at **${topic.toLowerCase()}**.

We will explore the key aspects, analyse the current landscape, and outline actionable recommendations.

---
layout: two-cols
---

## Key Insights

- Current trends and market dynamics
- Opportunities for growth
- Challenges to consider
- Competitive landscape

::right::

## Analysis

- Strong foundation
- Growing demand
- Proven track record
- Scalable approach

---
layout: fact
---

## 73%

of organisations are investing in this area

---
layout: quote
---

> "The best way to predict the future is to create it."

> — Peter Drucker

<!-- Add relevant data points and examples to strengthen this section. -->

---

## Recommendations

1. Finalise strategy and timeline
2. Assign ownership and resources
3. Begin Phase 1 implementation
4. Schedule follow-up review

---

## Next Steps

- Define measurable KPIs
- Build cross-functional team
- Set up monitoring dashboard
- Plan quarterly reviews

---
layout: end
---

# Thank You

Questions & Discussion
`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════════════════

export const useSlidevEditor = create<SlidevEditorState>()(
  temporal(
    persist(
      immer<SlidevEditorState>((set) => ({
        form: defaultForm(),
        phase: "prompt" as SlidevPhase,
        activeSlideIndex: 0,

        // ── Form-level ──────────────────────────────
        setForm: (form) =>
          set((s) => {
            s.form = form;
          }),
        resetForm: () =>
          set((s) => {
            s.form = defaultForm();
            s.phase = "prompt";
            s.activeSlideIndex = 0;
          }),

        setMarkdown: (md) =>
          set((s) => {
            s.form.markdown = md;
          }),

        setThemeId: (id) =>
          set((s) => {
            s.form.themeId = id;
            // Also update headmatter in markdown
            const deck = parseSlidevMarkdown(s.form.markdown);
            deck.headmatter.theme = id;
            s.form.markdown = reconstructMarkdown(
              deck.headmatter,
              deck.slides,
            );
          }),

        setAspectRatio: (ar) =>
          set((s) => {
            s.form.aspectRatio = ar;
          }),

        setTransition: (t) =>
          set((s) => {
            s.form.transition = t;
          }),

        // ── Phase / navigation ──────────────────────
        setPhase: (p) =>
          set((s) => {
            s.phase = p;
          }),

        setActiveSlideIndex: (i) =>
          set((s) => {
            s.activeSlideIndex = i;
          }),

        // ── Slide manipulation ──────────────────────

        updateSlideContent: (index, content) =>
          set((s) => {
            const md = withSlideMutation(s.form.markdown, index, (slide) => {
              slide.content = content;
            });
            if (md) s.form.markdown = md;
          }),

        updateSlideNotes: (index, notes) =>
          set((s) => {
            const md = withSlideMutation(s.form.markdown, index, (slide) => {
              slide.notes = notes;
            });
            if (md) s.form.markdown = md;
          }),

        updateSlideFrontmatter: (index, fm) =>
          set((s) => {
            const md = withSlideMutation(s.form.markdown, index, (slide) => {
              slide.frontmatter = { ...slide.frontmatter, ...fm };
              if (fm.layout)
                slide.layout = fm.layout as LayoutType;
            });
            if (md) s.form.markdown = md;
          }),

        setSlideLayout: (index, layout) =>
          set((s) => {
            const md = withSlideMutation(s.form.markdown, index, (slide) => {
              slide.frontmatter.layout = layout;
              slide.layout = layout;
            });
            if (md) s.form.markdown = md;
          }),

        addSlide: (layout = "default", afterIndex) =>
          set((s) => {
            const deck = parseSlidevMarkdown(s.form.markdown);
            const newSlide: SlidevSlide = {
              id: `slide-new-${Math.random().toString(36).slice(2, 6)}`,
              index: 0,
              rawContent: "",
              frontmatter:
                layout !== "default" ? { layout } : {},
              content: `\n# New Slide\n\nContent here\n`,
              notes: "",
              layout,
            };
            const idx =
              afterIndex !== undefined
                ? afterIndex + 1
                : deck.slides.length;
            deck.slides.splice(idx, 0, newSlide);
            deck.slides.forEach((sl, i) => (sl.index = i));
            s.form.markdown = reconstructMarkdown(
              deck.headmatter,
              deck.slides,
            );
            s.activeSlideIndex = idx;
          }),

        deleteSlide: (index) =>
          set((s) => {
            const deck = parseSlidevMarkdown(s.form.markdown);
            if (deck.slides.length <= 1) return;
            if (index < 0 || index >= deck.slides.length) return;
            deck.slides.splice(index, 1);
            deck.slides.forEach((sl, i) => (sl.index = i));
            s.form.markdown = reconstructMarkdown(
              deck.headmatter,
              deck.slides,
            );
            if (s.activeSlideIndex >= deck.slides.length) {
              s.activeSlideIndex = deck.slides.length - 1;
            }
          }),

        duplicateSlide: (index) =>
          set((s) => {
            const deck = parseSlidevMarkdown(s.form.markdown);
            if (index < 0 || index >= deck.slides.length) return;
            const src = deck.slides[index];
            const dup: SlidevSlide = {
              ...JSON.parse(JSON.stringify(src)),
              id: `slide-dup-${Math.random().toString(36).slice(2, 6)}`,
            };
            deck.slides.splice(index + 1, 0, dup);
            deck.slides.forEach((sl, i) => (sl.index = i));
            s.form.markdown = reconstructMarkdown(
              deck.headmatter,
              deck.slides,
            );
            s.activeSlideIndex = index + 1;
          }),

        moveSlide: (from, to) =>
          set((s) => {
            const deck = parseSlidevMarkdown(s.form.markdown);
            if (
              from < 0 ||
              from >= deck.slides.length ||
              to < 0 ||
              to >= deck.slides.length
            )
              return;
            const [moved] = deck.slides.splice(from, 1);
            deck.slides.splice(to, 0, moved);
            deck.slides.forEach((sl, i) => (sl.index = i));
            s.form.markdown = reconstructMarkdown(
              deck.headmatter,
              deck.slides,
            );
            s.activeSlideIndex = to;
          }),

        // ── Headmatter helpers ──────────────────────

        setTitle: (title) =>
          set((s) => {
            const deck = parseSlidevMarkdown(s.form.markdown);
            deck.headmatter.title = title;
            s.form.markdown = reconstructMarkdown(
              deck.headmatter,
              deck.slides,
            );
          }),

        setAuthor: (author) =>
          set((s) => {
            const deck = parseSlidevMarkdown(s.form.markdown);
            deck.headmatter.author = author;
            s.form.markdown = reconstructMarkdown(
              deck.headmatter,
              deck.slides,
            );
          }),

        // ── Drawing ─────────────────────────────────

        addDrawingPath: (slideIndex, path) =>
          set((s) => {
            if (!s.form.drawings[slideIndex])
              s.form.drawings[slideIndex] = [];
            s.form.drawings[slideIndex].push(path);
          }),

        clearDrawings: (slideIndex) =>
          set((s) => {
            delete s.form.drawings[slideIndex];
          }),

        // ── Generation ──────────────────────────────

        generateFromTopic: (topic) =>
          set((s) => {
            s.form.markdown = topicToMarkdown(topic.trim());
            s.form.themeId = "default";
            s.phase = "editor";
            s.activeSlideIndex = 0;
          }),
      })),
      {
        name: "dmsuite-slidev",
        partialize: (state) => ({
          form: state.form,
          phase: state.phase,
        }),
        merge: (persisted, current) => {
          const p = persisted as Partial<SlidevEditorState> | undefined;
          if (!p) return current;
          const merged = { ...current, ...p };
          // Ensure form.markdown is always a valid string
          if (!merged.form || typeof merged.form.markdown !== "string") {
            merged.form = defaultForm();
            merged.phase = "prompt";
          }
          return merged;
        },
      },
    ),
    { equality: (a, b) => equal(a, b), limit: 50 },
  ),
);

// ── Undo / Redo helpers ─────────────────────────────────────────────────────

export function useSlidevUndo() {
  const { undo, redo, pastStates, futureStates } =
    useSlidevEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
