"use client";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 * DMSuite â€” Presentation Designer Workspace (Genspark-style AI-first)
 *
 * Phase 1: Prompt â€” describe topic, pick theme & ratio â†’ generate deck
 * Phase 2: Editor â€” visual slide strip + inline-editable large preview
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  usePresentationEditor,
  usePresentationUndo,
} from "@/stores/presentation-editor";
import type { AspectRatio, PresentationTheme, Slide, SlideLayout } from "./types";
import { SLIDE_LAYOUTS } from "./types";
import { PRESENTATION_THEMES } from "./themes";
import SlideRenderer from "./SlideRenderer";

import { useChikoActions } from "@/hooks/useChikoActions";
import { createPresentationManifest } from "@/lib/chiko/manifests/presentation-chiko";

import {
  ConfirmDialog,
  Icons,
  IconButton,
} from "../shared/WorkspaceUIKit";

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const dispatchDirty = () =>
  window.dispatchEvent(new CustomEvent("workspace:dirty"));
const dispatchProgress = (d: Record<string, unknown>) =>
  window.dispatchEvent(new CustomEvent("workspace:progress", { detail: d }));

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PromptPhase â€” clean, centred "What's your presentation about?"
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function PromptPhase() {
  const {
    generateFromTopic,
    setThemeId,
    setAspectRatio,
    setAuthor,
    setCompany,
    form,
  } = usePresentationEditor();

  const [topic, setTopic] = useState("");
  const [author, setAuthorLocal] = useState("");
  const [company, setCompanyLocal] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    if (author) setAuthor(author);
    if (company) setCompany(company);
    generateFromTopic(topic.trim());
    dispatchProgress({ progress: 70 });
    dispatchProgress({ milestone: "content" });
  };

  const handleBlankDeck = () => {
    generateFromTopic("Untitled Presentation");
    dispatchProgress({ progress: 50 });
  };

  return (
    <div className="flex h-full items-center justify-center bg-gray-950 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10">
          <svg className="h-7 w-7 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>

        <h1 className="text-center text-2xl font-bold text-gray-100">
          Create a Presentation
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Describe your topic and we&apos;ll generate a professional slide deck
        </p>

        {/* Topic input */}
        <textarea
          ref={inputRef}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
          }}
          placeholder="e.g. Q4 2026 Sales Strategy for a SaaS startup..."
          rows={3}
          className="mt-6 w-full resize-none rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
        />

        {/* Theme picker */}
        <div className="mt-5">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Theme
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESENTATION_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`group relative h-8 w-8 rounded-lg transition-all ${
                  form.themeId === t.id
                    ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-950"
                    : "ring-1 ring-gray-700 hover:ring-gray-500"
                }`}
                style={{ background: t.bgGradient }}
                title={t.name}
              >
                {form.themeId === t.id && (
                  <motion.div
                    layoutId="theme-check"
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg
                      className="h-4 w-4"
                      style={{ color: t.textOnAccent }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect ratio */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Ratio
          </span>
          {(["16:9", "4:3"] as AspectRatio[]).map((ar) => (
            <button
              key={ar}
              onClick={() => setAspectRatio(ar)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                form.aspectRatio === ar
                  ? "border-primary-500/50 bg-primary-500/10 text-primary-400"
                  : "border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-400"
              }`}
            >
              {ar}
            </button>
          ))}
        </div>

        {/* Optional author/company */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <input
            value={author}
            onChange={(e) => setAuthorLocal(e.target.value)}
            placeholder="Your name (optional)"
            className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300 placeholder:text-gray-600 focus:border-primary-500/50 focus:outline-none"
          />
          <input
            value={company}
            onChange={(e) => setCompanyLocal(e.target.value)}
            placeholder="Company (optional)"
            className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300 placeholder:text-gray-600 focus:border-primary-500/50 focus:outline-none"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!topic.trim()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-gray-950 transition-all hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          Generate Presentation
          <span className="text-[10px] opacity-60">Ctrl+Enter</span>
        </button>

        {/* Or blank */}
        <button
          onClick={handleBlankDeck}
          className="mt-3 w-full text-center text-xs text-gray-600 transition-colors hover:text-gray-400"
        >
          or start with a blank deck
        </button>
      </motion.div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SlideThumbnail â€” visual mini-slide in the left strip
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function SlideThumbnail({
  slide,
  index,
  isActive,
  theme,
  aspectRatio,
  onSelect,
  onDelete,
  onDuplicate,
  canDelete,
}: {
  slide: Slide;
  index: number;
  isActive: boolean;
  theme: PresentationTheme;
  aspectRatio: AspectRatio;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  canDelete: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="group"
    >
      <button
        onClick={onSelect}
        className={`relative w-full overflow-hidden rounded-lg border transition-all ${
          isActive
            ? "border-primary-500/60 shadow-lg shadow-primary-500/10"
            : "border-gray-800/50 hover:border-gray-700/60"
        }`}
      >
        {/* Slide number badge */}
        <span
          className={`absolute left-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${
            isActive
              ? "bg-primary-500 text-gray-950"
              : "bg-gray-800/80 text-gray-400"
          }`}
        >
          {index + 1}
        </span>

        {/* Mini slide render */}
        <SlideRenderer
          slide={slide}
          theme={theme}
          aspectRatio={aspectRatio}
          editable={false}
          className="pointer-events-none w-full text-[3px]"
        />
      </button>

      {/* Hover actions */}
      <div className="mt-0.5 flex justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onDuplicate}
          className="rounded p-0.5 text-gray-600 hover:text-gray-400"
          title="Duplicate"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className="rounded p-0.5 text-gray-600 hover:text-red-400"
            title="Delete"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ThemePicker dropdown (toolbar)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function ThemePicker({
  currentId,
  onChange,
}: {
  currentId: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current =
    PRESENTATION_THEMES.find((t) => t.id === currentId) ??
    PRESENTATION_THEMES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-gray-800/50 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-300"
      >
        <div
          className="h-4 w-4 rounded"
          style={{ background: current.bgGradient }}
        />
        {current.name}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-800/60 bg-gray-900 py-1 shadow-xl"
            >
              {PRESENTATION_THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onChange(t.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                    t.id === currentId
                      ? "bg-primary-500/10 text-primary-400"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                  }`}
                >
                  <div
                    className="h-5 w-5 rounded"
                    style={{ background: t.bgGradient }}
                  />
                  {t.name}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LayoutPicker â€” compact popup grid to swap slide layout
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function LayoutPicker({
  current,
  onChange,
}: {
  current: SlideLayout;
  onChange: (layout: SlideLayout) => void;
}) {
  const [open, setOpen] = useState(false);
  const label =
    SLIDE_LAYOUTS.find((l) => l.id === current)?.label ?? "Layout";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-800/50 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-300"
      >
        Layout: {label}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-0 z-50 mb-1 grid w-64 grid-cols-3 gap-1 rounded-lg border border-gray-800/60 bg-gray-900 p-2 shadow-xl"
            >
              {SLIDE_LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    onChange(l.id);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-center rounded-md px-2 py-2 text-center transition-colors ${
                    l.id === current
                      ? "bg-primary-500/15 text-primary-400"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                  }`}
                >
                  <span className="text-lg leading-none">{l.icon}</span>
                  <span className="mt-1 text-[9px]">{l.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EditorPhase â€” slide thumbnails + inline-editable large preview
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function EditorPhase() {
  const {
    form,
    activeSlideIndex,
    setActiveSlideIndex,
    addSlide,
    deleteSlide,
    duplicateSlide,
    updateSlide,
    setThemeId,
    setAspectRatio,
    resetForm,
  } = usePresentationEditor();

  const { undo, redo, canUndo, canRedo } = usePresentationUndo();
  const [showStartOver, setShowStartOver] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [mobileView, setMobileView] = useState<"slides" | "preview">("preview");

  const theme = useMemo(
    () =>
      PRESENTATION_THEMES.find((t) => t.id === form.themeId) ??
      PRESENTATION_THEMES[0],
    [form.themeId],
  );

  const activeSlide = form.slides[activeSlideIndex];
  const totalSlides = form.slides.length;

  // â”€â”€ Slide update (with dirty dispatch) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSlideUpdate = useCallback(
    (patch: Partial<Slide>) => {
      updateSlide(activeSlideIndex, patch);
      dispatchDirty();
    },
    [activeSlideIndex, updateSlide],
  );

  const handleAddSlide = useCallback(
    (layout: SlideLayout = "blank") => {
      addSlide(layout, activeSlideIndex);
      dispatchDirty();
    },
    [addSlide, activeSlideIndex],
  );

  const handleDeleteSlide = useCallback(
    (index: number) => {
      deleteSlide(index);
      dispatchDirty();
    },
    [deleteSlide],
  );

  // â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const goPrev = useCallback(() => {
    if (activeSlideIndex > 0) setActiveSlideIndex(activeSlideIndex - 1);
  }, [activeSlideIndex, setActiveSlideIndex]);

  const goNext = useCallback(() => {
    if (activeSlideIndex < totalSlides - 1)
      setActiveSlideIndex(activeSlideIndex + 1);
  }, [activeSlideIndex, totalSlides, setActiveSlideIndex]);

  // â”€â”€ Keyboard shortcuts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      )
        return;
      if ((e.target as HTMLElement).isContentEditable) return;

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goPrev, goNext, undo, redo]);

  if (!activeSlide) return null;

  return (
    <div className="flex h-full flex-col bg-gray-950">
      {/* â”€â”€ Top Toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-gray-800/50 bg-gray-900/50 px-3">
        {/* Back / Start over */}
        <button
          onClick={() => setShowStartOver(true)}
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          title="Start over"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="hidden truncate text-xs font-semibold text-gray-300 sm:block">
          {form.title || "Untitled Presentation"}
        </span>

        <div className="flex-1" />

        {/* Theme */}
        <ThemePicker currentId={form.themeId} onChange={setThemeId} />

        {/* Aspect ratio */}
        <div className="hidden items-center rounded-lg border border-gray-800/50 sm:flex">
          {(["16:9", "4:3"] as AspectRatio[]).map((ar) => (
            <button
              key={ar}
              onClick={() => setAspectRatio(ar)}
              className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                form.aspectRatio === ar
                  ? "bg-primary-500/15 text-primary-400"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              {ar}
            </button>
          ))}
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <IconButton onClick={() => undo()} disabled={!canUndo} tooltip="Undo (Ctrl+Z)" icon={Icons.undo} />
          <IconButton onClick={() => redo()} disabled={!canRedo} tooltip="Redo (Ctrl+Shift+Z)" icon={Icons.redo} />
        </div>

        {/* Export */}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-400 transition-colors hover:bg-primary-500/20"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* â”€â”€ Mobile tab bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex h-9 items-center border-b border-gray-800/40 bg-gray-900/20 lg:hidden">
        {(["slides", "preview"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileView(tab)}
            className={`flex-1 text-center text-[11px] font-medium capitalize transition-colors ${
              mobileView === tab
                ? "border-b-2 border-primary-500 text-primary-400"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* â”€â”€ Main area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-1 overflow-hidden">
        {/* â”€â”€ Left: Slide thumbnails â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div
          className={`w-44 shrink-0 flex-col border-r border-gray-800/40 bg-gray-900/20 xl:w-48 ${
            mobileView === "slides" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin">
            <AnimatePresence initial={false}>
              {form.slides.map((slide, i) => (
                <SlideThumbnail
                  key={slide.id}
                  slide={slide}
                  index={i}
                  isActive={i === activeSlideIndex}
                  theme={theme}
                  aspectRatio={form.aspectRatio}
                  onSelect={() => {
                    setActiveSlideIndex(i);
                    setMobileView("preview");
                  }}
                  onDelete={() => handleDeleteSlide(i)}
                  onDuplicate={() => {
                    duplicateSlide(i);
                    dispatchDirty();
                  }}
                  canDelete={totalSlides > 1}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Add slide */}
          <div className="border-t border-gray-800/40 p-2">
            <button
              onClick={() => handleAddSlide("blank")}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-700/50 py-2 text-xs text-gray-500 transition-colors hover:border-primary-500/30 hover:text-primary-400"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Slide
            </button>
          </div>
        </div>

        {/* â”€â”€ Centre: Slide preview + controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div
          className={`flex flex-1 flex-col ${
            mobileView === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Canvas area */}
          <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-950/50 p-4 lg:p-8">
            <div className="w-full max-w-4xl">
              <SlideRenderer
                slide={activeSlide}
                theme={theme}
                aspectRatio={form.aspectRatio}
                editable
                onUpdate={handleSlideUpdate}
                className="w-full rounded-lg shadow-2xl shadow-black/40 ring-1 ring-gray-800/50"
              />
            </div>
          </div>

          {/* â”€â”€ Bottom bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex h-10 shrink-0 items-center gap-3 border-t border-gray-800/40 bg-gray-900/30 px-3">
            <LayoutPicker
              current={activeSlide.layout}
              onChange={(layout) => handleSlideUpdate({ layout })}
            />

            <div className="flex-1" />

            {/* Slide navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={activeSlideIndex === 0}
                className="rounded p-1 text-gray-500 transition-colors hover:text-gray-300 disabled:opacity-30"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-xs tabular-nums text-gray-500">
                {activeSlideIndex + 1} / {totalSlides}
              </span>
              <button
                onClick={goNext}
                disabled={activeSlideIndex === totalSlides - 1}
                className="rounded p-1 text-gray-500 transition-colors hover:text-gray-300 disabled:opacity-30"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div className="flex-1" />

            {/* Notes toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-colors ${
                showNotes
                  ? "bg-primary-500/10 text-primary-400"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              Notes
            </button>

            {/* Mobile: Add slide */}
            <button
              onClick={() => handleAddSlide("blank")}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300 lg:hidden"
              title="Add slide"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {/* â”€â”€ Speaker notes panel (collapsible) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-gray-800/40 bg-gray-900/30"
              >
                <textarea
                  value={activeSlide.notes}
                  onChange={(e) =>
                    handleSlideUpdate({ notes: e.target.value })
                  }
                  placeholder="Speaker notes..."
                  rows={3}
                  className="w-full resize-none bg-transparent px-4 py-2 text-xs text-gray-400 placeholder:text-gray-700 focus:outline-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Start Over confirmation */}
      <ConfirmDialog
        open={showStartOver}
        onCancel={() => setShowStartOver(false)}
        onConfirm={() => {
          resetForm();
          setShowStartOver(false);
        }}
        title="Start Over"
        description="This will discard all slides. Are you sure?"
        confirmLabel="Start Over"
        variant="danger"
      />
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Main Workspace Export
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export default function PresentationDesignerWorkspace() {
  const { phase } = usePresentationEditor();
  const chikoOnPrintRef = useRef<(() => void) | null>(null);

  // Workspace progress events
  useEffect(() => {
    dispatchProgress({ progress: phase === "prompt" ? 20 : 70 });
    if (phase === "editor") {
      dispatchProgress({ milestone: "content" });
    }
  }, [phase]);

  // Chiko AI integration
  useChikoActions(
    useCallback(
      () => createPresentationManifest({ onPrintRef: chikoOnPrintRef }),
      [],
    ),
  );

  return phase === "prompt" ? <PromptPhase /> : <EditorPhase />;
}
