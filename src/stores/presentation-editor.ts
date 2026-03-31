"use client";

// =============================================================================
// DMSuite — Presentation Designer Zustand Store
// Middleware: temporal(persist(immer(...)))
// =============================================================================

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";

import type {
  Slide,
  SlideLayout,
  PresentationTheme,
  AspectRatio,
  WorkspacePhase,
} from "@/components/workspaces/presentation-designer/types";
import { createBlankSlide } from "@/components/workspaces/presentation-designer/types";
import { DEFAULT_THEME } from "@/components/workspaces/presentation-designer/themes";

// ── Form data persisted via store adapter ───────────────────────────────────

export interface PresentationFormData {
  title: string;
  author: string;
  company: string;
  date: string;
  themeId: string;
  aspectRatio: AspectRatio;
  slides: Slide[];
}

// ── Store state + actions ───────────────────────────────────────────────────

export interface PresentationEditorState {
  form: PresentationFormData;
  phase: WorkspacePhase;
  activeSlideIndex: number;

  // ── Form-level ─────────────────────────────
  setForm: (form: PresentationFormData) => void;
  resetForm: () => void;
  setTitle: (title: string) => void;
  setAuthor: (author: string) => void;
  setCompany: (company: string) => void;
  setDate: (date: string) => void;
  setThemeId: (id: string) => void;
  setAspectRatio: (ar: AspectRatio) => void;

  // ── Phase ──────────────────────────────────
  setPhase: (phase: WorkspacePhase) => void;
  setActiveSlideIndex: (index: number) => void;

  // ── Slide CRUD ─────────────────────────────
  addSlide: (layout?: SlideLayout, afterIndex?: number) => void;
  deleteSlide: (index: number) => void;
  duplicateSlide: (index: number) => void;
  moveSlide: (from: number, to: number) => void;
  updateSlide: (index: number, patch: Partial<Slide>) => void;
  setSlides: (slides: Slide[]) => void;
  updateSlideBullets: (index: number, bullets: string[]) => void;

  // ── Batch generation ───────────────────────
  generateFromTopic: (topic: string) => void;
}

// ── Default form ────────────────────────────────────────────────────────────

function defaultForm(): PresentationFormData {
  const now = new Date();
  return {
    title: "",
    author: "",
    company: "",
    date: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    themeId: DEFAULT_THEME.id,
    aspectRatio: "16:9",
    slides: [],
  };
}

// ── Smart topic → slides generator ──────────────────────────────────────────

function topicToSlides(topic: string): Slide[] {
  const titleSlide: Slide = {
    ...createBlankSlide("title"),
    title: topic,
    subtitle: "A comprehensive overview",
  };

  const agendaSlide: Slide = {
    ...createBlankSlide("bullets"),
    title: "Agenda",
    bullets: [
      "Introduction & Background",
      "Key Insights",
      "Analysis & Findings",
      "Recommendations",
      "Next Steps",
    ],
  };

  const introSlide: Slide = {
    ...createBlankSlide("content"),
    title: "Introduction",
    body: `This presentation provides an in-depth look at ${topic.toLowerCase()}. We'll explore the key aspects, analyse the current landscape, and outline actionable recommendations.`,
  };

  const sectionSlide: Slide = {
    ...createBlankSlide("section"),
    title: "Key Insights",
    sectionNumber: "01",
  };

  const insightsSlide: Slide = {
    ...createBlankSlide("bullets"),
    title: "Key Insights",
    bullets: [
      "Current trends and market dynamics",
      "Opportunities for growth and innovation",
      "Challenges and risk factors to consider",
      "Competitive landscape overview",
    ],
  };

  const dataSlide: Slide = {
    ...createBlankSlide("big-number"),
    title: "Impact at a Glance",
    bigNumber: "73%",
    bigNumberLabel: "of organisations are investing in this area",
  };

  const twoColSlide: Slide = {
    ...createBlankSlide("two-column"),
    title: "Analysis",
    leftHeading: "Strengths",
    leftBody: "Strong foundation, growing demand, proven track record, and scalable approach.",
    rightHeading: "Opportunities",
    rightBody: "Emerging markets, technology adoption, strategic partnerships, and new channels.",
  };

  const quoteSlide: Slide = {
    ...createBlankSlide("quote"),
    quoteText: "The best way to predict the future is to create it.",
    quoteAuthor: "Peter Drucker",
  };

  const nextStepsSlide: Slide = {
    ...createBlankSlide("bullets"),
    title: "Next Steps",
    bullets: [
      "Finalise strategy and timeline",
      "Assign ownership and resources",
      "Begin Phase 1 implementation",
      "Schedule follow-up review",
    ],
  };

  const closingSlide: Slide = {
    ...createBlankSlide("title"),
    title: "Thank You",
    subtitle: "Questions & Discussion",
  };

  return [
    titleSlide,
    agendaSlide,
    introSlide,
    sectionSlide,
    insightsSlide,
    dataSlide,
    twoColSlide,
    quoteSlide,
    nextStepsSlide,
    closingSlide,
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════════════════════

export const usePresentationEditor = create<PresentationEditorState>()(
  temporal(
    persist(
      immer<PresentationEditorState>((set) => ({
        form: defaultForm(),
        phase: "prompt" as WorkspacePhase,
        activeSlideIndex: 0,

        // ── Form-level ───────────────────────────
        setForm: (form) => set((s) => { s.form = form; }),
        resetForm: () => set((s) => {
          s.form = defaultForm();
          s.phase = "prompt";
          s.activeSlideIndex = 0;
        }),

        setTitle: (title) => set((s) => { s.form.title = title; }),
        setAuthor: (author) => set((s) => { s.form.author = author; }),
        setCompany: (company) => set((s) => { s.form.company = company; }),
        setDate: (date) => set((s) => { s.form.date = date; }),
        setThemeId: (id) => set((s) => { s.form.themeId = id; }),
        setAspectRatio: (ar) => set((s) => { s.form.aspectRatio = ar; }),

        // ── Phase ────────────────────────────────
        setPhase: (phase) => set((s) => { s.phase = phase; }),
        setActiveSlideIndex: (index) => set((s) => { s.activeSlideIndex = index; }),

        // ── Slide CRUD ───────────────────────────
        addSlide: (layout = "blank", afterIndex) =>
          set((s) => {
            const newSlide = createBlankSlide(layout);
            const idx = afterIndex !== undefined ? afterIndex + 1 : s.form.slides.length;
            s.form.slides.splice(idx, 0, newSlide);
            s.activeSlideIndex = idx;
          }),

        deleteSlide: (index) =>
          set((s) => {
            if (s.form.slides.length <= 1) return;
            s.form.slides.splice(index, 1);
            if (s.activeSlideIndex >= s.form.slides.length) {
              s.activeSlideIndex = s.form.slides.length - 1;
            }
          }),

        duplicateSlide: (index) =>
          set((s) => {
            const src = s.form.slides[index];
            if (!src) return;
            const dup: Slide = {
              ...JSON.parse(JSON.stringify(src)),
              id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            };
            s.form.slides.splice(index + 1, 0, dup);
            s.activeSlideIndex = index + 1;
          }),

        moveSlide: (from, to) =>
          set((s) => {
            if (to < 0 || to >= s.form.slides.length) return;
            const [moved] = s.form.slides.splice(from, 1);
            s.form.slides.splice(to, 0, moved);
            s.activeSlideIndex = to;
          }),

        updateSlide: (index, patch) =>
          set((s) => {
            const slide = s.form.slides[index];
            if (!slide) return;
            Object.assign(slide, patch);
          }),

        setSlides: (slides) => set((s) => { s.form.slides = slides; }),

        updateSlideBullets: (index, bullets) =>
          set((s) => {
            const slide = s.form.slides[index];
            if (slide) slide.bullets = bullets;
          }),

        // ── Batch generation ─────────────────────
        generateFromTopic: (topic) =>
          set((s) => {
            s.form.title = topic;
            s.form.slides = topicToSlides(topic);
            s.phase = "editor";
            s.activeSlideIndex = 0;
          }),
      })),
      {
        name: "dmsuite-presentation",
        partialize: (state) => ({ form: state.form, phase: state.phase }),
      },
    ),
    { equality: (a, b) => equal(a, b), limit: 50 },
  ),
);

// ── Undo / Redo helpers ─────────────────────────────────────────────────────

export function usePresentationUndo() {
  const { undo, redo, pastStates, futureStates } =
    usePresentationEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
