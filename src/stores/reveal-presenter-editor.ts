// =============================================================================
// DMSuite — Reveal.js Presenter Store
// Zustand + Immer + Persist + Temporal store for the Reveal.js presentation tool
//
// Originally based on reveal.js — MIT License
// Copyright (c) 2011-2026 Hakim El Hattab, https://hakim.se
// See: https://github.com/hakimel/reveal.js/blob/master/LICENSE
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";

// ── Types ───────────────────────────────────────────────────────────────────

export type RevealThemeId =
  | "black"
  | "white"
  | "league"
  | "beige"
  | "night"
  | "serif"
  | "simple"
  | "solarized"
  | "moon"
  | "dracula"
  | "sky"
  | "blood"
  | "black-contrast"
  | "white-contrast";

export type RevealTransition = "none" | "fade" | "slide" | "convex" | "concave" | "zoom";
export type RevealTransitionSpeed = "default" | "fast" | "slow";

export interface RevealSlide {
  id: string;
  content: string; // HTML content
  notes: string;   // Speaker notes
  background?: string; // CSS color / image URL / gradient
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundOpacity?: string;
  transition?: RevealTransition;
  transitionSpeed?: RevealTransitionSpeed;
  fragmentSteps?: number;
  dataAttributes?: Record<string, string>;
  children?: RevealSlide[]; // Vertical slides
}

export interface RevealFormData {
  title: string;
  author: string;
  date: string;
  themeId: RevealThemeId;
  transition: RevealTransition;
  transitionSpeed: RevealTransitionSpeed;
  controls: boolean;
  progress: boolean;
  slideNumber: boolean;
  hash: boolean;
  loop: boolean;
  autoSlide: number; // milliseconds, 0 = disabled
  width: number;
  height: number;
  margin: number;
  slides: RevealSlide[];
}

export type RevealPhase = "prompt" | "editor";

export interface RevealPresenterState {
  form: RevealFormData;
  phase: RevealPhase;
  activeSlideIndex: number;
  activeVerticalIndex: number;
  isPresenting: boolean;
  isOverview: boolean;
  isSpeakerView: boolean;
}

export interface RevealPresenterActions {
  // ── Phase ──
  setPhase: (phase: RevealPhase) => void;

  // ── Navigation ──
  setActiveSlide: (h: number, v?: number) => void;
  setPresenting: (value: boolean) => void;
  setOverview: (value: boolean) => void;
  setSpeakerView: (value: boolean) => void;

  // ── Metadata ──
  setTitle: (title: string) => void;
  setAuthor: (author: string) => void;
  setDate: (date: string) => void;

  // ── Theme & Style ──
  setTheme: (themeId: RevealThemeId) => void;
  setTransition: (transition: RevealTransition) => void;
  setTransitionSpeed: (speed: RevealTransitionSpeed) => void;
  setControls: (value: boolean) => void;
  setProgress: (value: boolean) => void;
  setSlideNumber: (value: boolean) => void;
  setLoop: (value: boolean) => void;
  setAutoSlide: (ms: number) => void;
  setSize: (width: number, height: number) => void;
  setMargin: (margin: number) => void;

  // ── Slide CRUD ──
  addSlide: (content?: string, notes?: string, afterIndex?: number) => void;
  updateSlideContent: (index: number, content: string) => void;
  updateSlideNotes: (index: number, notes: string) => void;
  updateSlideBackground: (index: number, bg: string) => void;
  deleteSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  moveSlide: (fromIndex: number, toIndex: number) => void;
  updateSlideTransition: (index: number, transition: RevealTransition) => void;

  // ── Vertical Slides ──
  addVerticalSlide: (parentIndex: number, content?: string) => void;
  deleteVerticalSlide: (parentIndex: number, childIndex: number) => void;

  // ── Bulk ──
  setForm: (form: RevealFormData) => void;
  setSlides: (slides: RevealSlide[]) => void;
  resetForm: () => void;

  // ── HTML Generation ──
  generateHTML: () => string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

let _nextId = 1;
function makeId(): string {
  return `slide-${Date.now()}-${_nextId++}`;
}

function createEmptySlide(content?: string, notes?: string): RevealSlide {
  return {
    id: makeId(),
    content: content ?? "<h2>New Slide</h2>\n<p>Add your content here</p>",
    notes: notes ?? "",
  };
}

// ── Default Form ────────────────────────────────────────────────────────────

const DEFAULT_FORM: RevealFormData = {
  title: "Untitled Presentation",
  author: "",
  date: new Date().toISOString().split("T")[0],
  themeId: "black",
  transition: "slide",
  transitionSpeed: "default",
  controls: true,
  progress: true,
  slideNumber: true,
  hash: false,
  loop: false,
  autoSlide: 0,
  width: 960,
  height: 700,
  margin: 0.04,
  slides: [
    {
      id: makeId(),
      content: "<h1>Welcome</h1>\n<h3>Your presentation title here</h3>",
      notes: "Opening slide — introduce yourself and the topic.",
    },
    {
      id: makeId(),
      content: "<h2>Agenda</h2>\n<ul>\n  <li>Topic One</li>\n  <li>Topic Two</li>\n  <li>Topic Three</li>\n</ul>",
      notes: "Walk through the agenda items.",
    },
    {
      id: makeId(),
      content: "<h2>Topic One</h2>\n<p>Explain the first topic in detail.</p>\n<aside class=\"notes\">Speaker notes go here</aside>",
      notes: "Detailed explanation of topic one.",
    },
    {
      id: makeId(),
      content: "<h2>Thank You!</h2>\n<p>Questions?</p>",
      notes: "Wrap up and take questions.",
    },
  ],
};

// ── Store ────────────────────────────────────────────────────────────────────

export const useRevealPresenterEditor = create<
  RevealPresenterState & RevealPresenterActions
>()(
  temporal(
    persist(
      immer((set, get) => ({
        // ── Initial State ──
        form: { ...DEFAULT_FORM },
        phase: "prompt" as RevealPhase,
        activeSlideIndex: 0,
        activeVerticalIndex: 0,
        isPresenting: false,
        isOverview: false,
        isSpeakerView: false,

        // ── Phase ──
        setPhase: (phase) => set((s) => { s.phase = phase; }),

        // ── Navigation ──
        setActiveSlide: (h, v = 0) => set((s) => {
          s.activeSlideIndex = Math.max(0, Math.min(h, s.form.slides.length - 1));
          s.activeVerticalIndex = v;
        }),
        setPresenting: (value) => set((s) => { s.isPresenting = value; }),
        setOverview: (value) => set((s) => { s.isOverview = value; }),
        setSpeakerView: (value) => set((s) => { s.isSpeakerView = value; }),

        // ── Metadata ──
        setTitle: (title) => set((s) => { s.form.title = title; }),
        setAuthor: (author) => set((s) => { s.form.author = author; }),
        setDate: (date) => set((s) => { s.form.date = date; }),

        // ── Theme & Style ──
        setTheme: (themeId) => set((s) => { s.form.themeId = themeId; }),
        setTransition: (transition) => set((s) => { s.form.transition = transition; }),
        setTransitionSpeed: (speed) => set((s) => { s.form.transitionSpeed = speed; }),
        setControls: (value) => set((s) => { s.form.controls = value; }),
        setProgress: (value) => set((s) => { s.form.progress = value; }),
        setSlideNumber: (value) => set((s) => { s.form.slideNumber = value; }),
        setLoop: (value) => set((s) => { s.form.loop = value; }),
        setAutoSlide: (ms) => set((s) => { s.form.autoSlide = Math.max(0, ms); }),
        setSize: (width, height) => set((s) => { s.form.width = width; s.form.height = height; }),
        setMargin: (margin) => set((s) => { s.form.margin = margin; }),

        // ── Slide CRUD ──
        addSlide: (content, notes, afterIndex) => set((s) => {
          const slide = createEmptySlide(content, notes);
          const insertAt = afterIndex !== undefined ? afterIndex + 1 : s.form.slides.length;
          s.form.slides.splice(insertAt, 0, slide);
          s.activeSlideIndex = insertAt;
          s.activeVerticalIndex = 0;
        }),

        updateSlideContent: (index, content) => set((s) => {
          if (s.form.slides[index]) s.form.slides[index].content = content;
        }),

        updateSlideNotes: (index, notes) => set((s) => {
          if (s.form.slides[index]) s.form.slides[index].notes = notes;
        }),

        updateSlideBackground: (index, bg) => set((s) => {
          if (s.form.slides[index]) s.form.slides[index].background = bg;
        }),

        deleteSlide: (index) => set((s) => {
          if (s.form.slides.length <= 1) return; // keep at least 1
          s.form.slides.splice(index, 1);
          if (s.activeSlideIndex >= s.form.slides.length) {
            s.activeSlideIndex = s.form.slides.length - 1;
          }
        }),

        duplicateSlide: (index) => set((s) => {
          const source = s.form.slides[index];
          if (!source) return;
          const dupe: RevealSlide = {
            ...JSON.parse(JSON.stringify(source)),
            id: makeId(),
          };
          s.form.slides.splice(index + 1, 0, dupe);
          s.activeSlideIndex = index + 1;
        }),

        moveSlide: (fromIndex, toIndex) => set((s) => {
          const slides = s.form.slides;
          if (fromIndex < 0 || fromIndex >= slides.length) return;
          if (toIndex < 0 || toIndex >= slides.length) return;
          const [removed] = slides.splice(fromIndex, 1);
          slides.splice(toIndex, 0, removed);
          s.activeSlideIndex = toIndex;
        }),

        updateSlideTransition: (index, transition) => set((s) => {
          if (s.form.slides[index]) s.form.slides[index].transition = transition;
        }),

        // ── Vertical Slides ──
        addVerticalSlide: (parentIndex, content) => set((s) => {
          const parent = s.form.slides[parentIndex];
          if (!parent) return;
          if (!parent.children) parent.children = [];
          parent.children.push(createEmptySlide(content));
        }),

        deleteVerticalSlide: (parentIndex, childIndex) => set((s) => {
          const parent = s.form.slides[parentIndex];
          if (!parent?.children) return;
          parent.children.splice(childIndex, 1);
          if (parent.children.length === 0) delete parent.children;
        }),

        // ── Bulk ──
        setForm: (form) => set((s) => { s.form = form; }),
        setSlides: (slides) => set((s) => { s.form.slides = slides; }),

        resetForm: () => set((s) => {
          Object.assign(s, {
            form: { ...DEFAULT_FORM, slides: DEFAULT_FORM.slides.map((sl) => ({ ...sl, id: makeId() })) },
            phase: "prompt" as RevealPhase,
            activeSlideIndex: 0,
            activeVerticalIndex: 0,
            isPresenting: false,
            isOverview: false,
            isSpeakerView: false,
          });
        }),

        // ── HTML Generation ──
        generateHTML: () => {
          const { form } = get();
          const slidesSections = form.slides
            .map((slide) => {
              const attrs: string[] = [];
              if (slide.background) attrs.push(`data-background-color="${slide.background}"`);
              if (slide.backgroundImage) attrs.push(`data-background-image="${slide.backgroundImage}"`);
              if (slide.backgroundSize) attrs.push(`data-background-size="${slide.backgroundSize}"`);
              if (slide.backgroundOpacity) attrs.push(`data-background-opacity="${slide.backgroundOpacity}"`);
              if (slide.transition) attrs.push(`data-transition="${slide.transition}"`);
              if (slide.transitionSpeed) attrs.push(`data-transition-speed="${slide.transitionSpeed}"`);
              if (slide.dataAttributes) {
                for (const [k, v] of Object.entries(slide.dataAttributes)) {
                  attrs.push(`data-${k}="${v}"`);
                }
              }

              const notesEl = slide.notes ? `<aside class="notes">${slide.notes}</aside>` : "";

              if (slide.children && slide.children.length > 0) {
                const childSections = slide.children
                  .map((child) => {
                    const cAttrs: string[] = [];
                    if (child.background) cAttrs.push(`data-background-color="${child.background}"`);
                    if (child.transition) cAttrs.push(`data-transition="${child.transition}"`);
                    const cNotes = child.notes ? `<aside class="notes">${child.notes}</aside>` : "";
                    return `        <section${cAttrs.length ? " " + cAttrs.join(" ") : ""}>\n          ${child.content}\n          ${cNotes}\n        </section>`;
                  })
                  .join("\n");
                return `      <section${attrs.length ? " " + attrs.join(" ") : ""}>\n        <section>\n          ${slide.content}\n          ${notesEl}\n        </section>\n${childSections}\n      </section>`;
              }

              return `      <section${attrs.length ? " " + attrs.join(" ") : ""}>\n        ${slide.content}\n        ${notesEl}\n      </section>`;
            })
            .join("\n");

          return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${form.title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@6/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@6/dist/theme/${form.themeId}.css">
</head>
<body>
  <div class="reveal">
    <div class="slides">
${slidesSections}
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@6/dist/reveal.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@6/plugin/notes/notes.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@6/plugin/highlight/highlight.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@6/plugin/math/math.js"><\/script>
  <script>
    Reveal.initialize({
      hash: ${form.hash},
      controls: ${form.controls},
      progress: ${form.progress},
      slideNumber: ${form.slideNumber},
      transition: '${form.transition}',
      transitionSpeed: '${form.transitionSpeed}',
      loop: ${form.loop},
      autoSlide: ${form.autoSlide},
      width: ${form.width},
      height: ${form.height},
      margin: ${form.margin},
      plugins: [RevealNotes, RevealHighlight, RevealMath.KaTeX]
    });
  <\/script>
</body>
</html>`;
        },
      })),
      {
        name: "dmsuite-reveal-presenter",
        version: 1,
      }
    ),
    { limit: 50 }
  )
);

// ── Undo/Redo hooks ─────────────────────────────────────────────────────────

export function useRevealUndo() {
  return useRevealPresenterEditor.temporal.getState();
}

// ── Theme metadata ──────────────────────────────────────────────────────────

export interface RevealThemeMeta {
  id: RevealThemeId;
  name: string;
  description: string;
}

export const REVEAL_THEMES: RevealThemeMeta[] = [
  { id: "black", name: "Black", description: "Black background, white text, blue links" },
  { id: "white", name: "White", description: "White background, black text, blue links" },
  { id: "league", name: "League", description: "Gray background, white text, blue links" },
  { id: "beige", name: "Beige", description: "Beige background, dark text, brown links" },
  { id: "night", name: "Night", description: "Black background, thick white text, orange links" },
  { id: "serif", name: "Serif", description: "Cappuccino background, gray text, brown links" },
  { id: "simple", name: "Simple", description: "White background, black text, blue links" },
  { id: "solarized", name: "Solarized", description: "Cream-colored background, dark green text, blue links" },
  { id: "moon", name: "Moon", description: "Dark blue background, thick grey text, blue links" },
  { id: "dracula", name: "Dracula", description: "Dracula color scheme — dark purple background" },
  { id: "sky", name: "Sky", description: "Blue background, thin dark text, blue links" },
  { id: "blood", name: "Blood", description: "Dark background, thick white text, red links" },
  { id: "black-contrast", name: "Black (High Contrast)", description: "High contrast version of Black theme" },
  { id: "white-contrast", name: "White (High Contrast)", description: "High contrast version of White theme" },
];

export const REVEAL_TRANSITIONS: { id: RevealTransition; name: string }[] = [
  { id: "none", name: "None" },
  { id: "fade", name: "Fade" },
  { id: "slide", name: "Slide" },
  { id: "convex", name: "Convex" },
  { id: "concave", name: "Concave" },
  { id: "zoom", name: "Zoom" },
];
