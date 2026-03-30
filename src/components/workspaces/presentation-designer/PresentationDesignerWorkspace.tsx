// =============================================================================
// DMSuite — Presentation Designer Workspace (Fabric.js Editor)
//
// Multi-slide presentation editor built on the universal FabricEditor.
// Supports slide deck management, multiple aspect ratios, slide thumbnails,
// and PPTX/PDF export of the full deck.
// =============================================================================

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FabricEditor } from "@/components/fabric-editor";
import { useFabricProjectStore } from "@/stores/fabric-project";
import { PRESENTATION_FABRIC_TEMPLATES } from "@/data/presentation-fabric-templates";
import type { FabricEditorConfig, QuickEditField, FabricTemplate } from "@/lib/fabric-editor";
import { createPresentationFabricManifest } from "@/lib/chiko/manifests/presentation-fabric";
import { motion, AnimatePresence } from "framer-motion";

// ── Slide Types ─────────────────────────────────────────────────────────────

interface SlideData {
  id: string;
  name: string;
  fabricJson: string | null;
}

interface AspectRatioOption {
  id: string;
  label: string;
  width: number;
  height: number;
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: "16:9", label: "Widescreen (16:9)", width: 960, height: 540 },
  { id: "4:3", label: "Standard (4:3)", width: 720, height: 540 },
  { id: "16:10", label: "Wide (16:10)", width: 900, height: 562 },
  { id: "A4-L", label: "A4 Landscape", width: 842, height: 595 },
  { id: "A4-P", label: "A4 Portrait", width: 595, height: 842 },
  { id: "Letter-L", label: "Letter Landscape", width: 816, height: 630 },
];

const DEFAULT_ASPECT = ASPECT_RATIOS[0]; // 16:9

// ── Quick-edit fields matching named objects in templates ────────────────────

const QUICK_EDIT_FIELDS: QuickEditField[] = [
  { key: "title", label: "Slide Title", type: "text", targetLayer: "pres-title", placeholder: "Slide Title" },
  { key: "subtitle", label: "Subtitle", type: "text", targetLayer: "pres-subtitle", placeholder: "Subtitle text" },
  { key: "body", label: "Body Text", type: "textarea", targetLayer: "pres-body", placeholder: "Main content..." },
  { key: "company", label: "Company Name", type: "text", targetLayer: "pres-company", placeholder: "DMSUITE" },
  { key: "author", label: "Author", type: "text", targetLayer: "pres-author", placeholder: "Presented by..." },
  { key: "date", label: "Date", type: "text", targetLayer: "pres-date", placeholder: "March 2026" },
  { key: "bullet-1", label: "Point 1", type: "text", targetLayer: "pres-bullet-1", placeholder: "First point..." },
  { key: "bullet-2", label: "Point 2", type: "text", targetLayer: "pres-bullet-2", placeholder: "Second point..." },
  { key: "bullet-3", label: "Point 3", type: "text", targetLayer: "pres-bullet-3", placeholder: "Third point..." },
  { key: "bullet-4", label: "Point 4", type: "text", targetLayer: "pres-bullet-4", placeholder: "Fourth point..." },
  { key: "heading-left", label: "Left Heading", type: "text", targetLayer: "pres-heading-left", placeholder: "Left column" },
  { key: "body-left", label: "Left Body", type: "textarea", targetLayer: "pres-body-left", placeholder: "Left content..." },
  { key: "heading-right", label: "Right Heading", type: "text", targetLayer: "pres-heading-right", placeholder: "Right column" },
  { key: "body-right", label: "Right Body", type: "textarea", targetLayer: "pres-body-right", placeholder: "Right content..." },
  { key: "quote-text", label: "Quote", type: "textarea", targetLayer: "pres-quote-text", placeholder: "Your quote here..." },
  { key: "quote-author", label: "Quote Author", type: "text", targetLayer: "pres-quote-author", placeholder: "— Author Name" },
  { key: "section-title", label: "Section Number", type: "text", targetLayer: "pres-section-title", placeholder: "02" },
  { key: "slide-number", label: "Slide Number", type: "text", targetLayer: "pres-slide-number", placeholder: "01" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultSlide(index: number): SlideData {
  return {
    id: generateId(),
    name: `Slide ${index + 1}`,
    fabricJson: null,
  };
}

// ── Slide Thumbnail ─────────────────────────────────────────────────────────

function SlideThumbnail({
  slide,
  index,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
  slideCount,
}: {
  slide: SlideData;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  slideCount: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative"
    >
      <button
        onClick={onSelect}
        className={`relative flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
          isActive
            ? "border-primary-500/50 bg-primary-500/10 shadow-sm shadow-primary-500/10"
            : "border-gray-800/40 bg-gray-900/30 hover:border-gray-700/60 hover:bg-gray-800/40"
        }`}
      >
        {/* Slide number */}
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
          isActive
            ? "bg-primary-500 text-gray-950"
            : "bg-gray-800 text-gray-400"
        }`}>
          {index + 1}
        </span>

        {/* Slide name + preview */}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[12px] font-medium ${
            isActive ? "text-primary-300" : "text-gray-300"
          }`}>
            {slide.name}
          </p>
          <p className="truncate text-[10px] text-gray-600">
            {slide.fabricJson ? "Edited" : "Empty"}
          </p>
        </div>
      </button>

      {/* Hover actions */}
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
          title="Duplicate slide"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
        {slideCount > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded p-1 text-gray-500 hover:bg-error/20 hover:text-error"
            title="Delete slide"
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

// ── Aspect Ratio Picker ─────────────────────────────────────────────────────

function AspectRatioPicker({
  current,
  onChange,
}: {
  current: AspectRatioOption;
  onChange: (ar: AspectRatioOption) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-gray-800/40 bg-gray-900/30 px-2.5 py-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:border-gray-700/60 hover:text-gray-300"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        {current.label}
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-800/60 bg-gray-900 py-1 shadow-xl"
          >
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                onClick={() => { onChange(ar); setOpen(false); }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[12px] transition-colors ${
                  ar.id === current.id
                    ? "bg-primary-500/10 text-primary-400"
                    : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"
                }`}
              >
                <span className="font-medium">{ar.label}</span>
                <span className="font-mono text-[10px] text-gray-600">{ar.width}×{ar.height}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Workspace Component
// ═══════════════════════════════════════════════════════════════════════════

export default function PresentationDesignerWorkspace() {
  const { fabricJson, setFabricState } = useFabricProjectStore();
  const hasDispatchedRef = useRef(false);

  // ── Multi-slide state ───────────────────────────────────────────────────
  const [slides, setSlides] = useState<SlideData[]>(() => [createDefaultSlide(0)]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>(DEFAULT_ASPECT);
  const [slidesPanelOpen, setSlidesPanelOpen] = useState(true);

  // Track the last saved JSON per slide so we can switch between slides
  const slideJsonCache = useRef<Record<string, string | null>>({});

  // ── Initialize progress ────────────────────────────────────────────────
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { progress: 70 } }));
    window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
  }, []);

  // ── Fabric editor config (updates when aspect ratio or active slide changes) ──
  const editorConfig: FabricEditorConfig = useMemo(
    () => ({
      toolId: "presentation",
      defaultWidth: aspectRatio.width,
      defaultHeight: aspectRatio.height,
      templates: PRESENTATION_FABRIC_TEMPLATES,
      quickEditFields: QUICK_EDIT_FIELDS,
      exportOptions: ["png", "jpg", "pdf", "json"],
    }),
    [aspectRatio],
  );

  // ── Save handler — stores canvas JSON for active slide ─────────────────
  const handleSave = useCallback(
    (json: string, width: number, height: number) => {
      setFabricState(json, width, height);

      // Cache the JSON for the active slide
      const activeSlide = slides[activeSlideIndex];
      if (activeSlide) {
        slideJsonCache.current[activeSlide.id] = json;
        setSlides((prev) =>
          prev.map((s, i) =>
            i === activeSlideIndex ? { ...s, fabricJson: json } : s,
          ),
        );
      }

      window.dispatchEvent(new CustomEvent("workspace:dirty"));
    },
    [setFabricState, slides, activeSlideIndex],
  );

  // ── Slide management ──────────────────────────────────────────────────

  const addSlide = useCallback(() => {
    const newSlide = createDefaultSlide(slides.length);
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
  }, [slides.length]);

  const duplicateSlide = useCallback(
    (index: number) => {
      const source = slides[index];
      const newSlide: SlideData = {
        id: generateId(),
        name: `${source.name} (Copy)`,
        fabricJson: slideJsonCache.current[source.id] ?? source.fabricJson,
      };
      setSlides((prev) => {
        const next = [...prev];
        next.splice(index + 1, 0, newSlide);
        return next;
      });
      setActiveSlideIndex(index + 1);
    },
    [slides],
  );

  const deleteSlide = useCallback(
    (index: number) => {
      if (slides.length <= 1) return;
      const slideId = slides[index].id;
      delete slideJsonCache.current[slideId];
      setSlides((prev) => prev.filter((_, i) => i !== index));
      setActiveSlideIndex((prev) =>
        prev >= index ? Math.max(0, prev - 1) : prev,
      );
    },
    [slides.length, slides],
  );

  const selectSlide = useCallback(
    (index: number) => {
      if (index === activeSlideIndex) return;
      setActiveSlideIndex(index);
    },
    [activeSlideIndex],
  );

  const moveSlide = useCallback(
    (fromIndex: number, direction: "up" | "down") => {
      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= slides.length) return;
      setSlides((prev) => {
        const next = [...prev];
        [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
        return next;
      });
      setActiveSlideIndex(toIndex);
    },
    [slides.length],
  );

  // ── Aspect ratio change ────────────────────────────────────────────────
  const handleAspectRatioChange = useCallback((ar: AspectRatioOption) => {
    setAspectRatio(ar);
    // Note: The FabricEditor will re-initialize with new dimensions
    // because the config changes. Existing slide content will need to be
    // re-laid-out by the user (or future AI assist).
  }, []);

  // ── Resolve the default state for the active slide ─────────────────────
  const activeSlide = slides[activeSlideIndex];
  const defaultState = activeSlide
    ? slideJsonCache.current[activeSlide.id] ?? activeSlide.fabricJson ?? fabricJson ?? undefined
    : undefined;

  // ── Key forces FabricEditor remount on slide switch ────────────────────
  const editorKey = `${activeSlide?.id ?? "none"}-${aspectRatio.id}`;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Slides Panel (Left) ─────────────────────────────────────────── */}
      <div
        className={`flex shrink-0 flex-col border-r border-gray-800/40 bg-gray-900/20 transition-all duration-200 ${
          slidesPanelOpen ? "w-56 xl:w-64" : "w-10"
        }`}
      >
        {/* Panel header */}
        <div className="flex h-11 items-center justify-between border-b border-gray-800/40 bg-gray-900/30 px-3">
          {slidesPanelOpen && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Slides ({slides.length})
            </span>
          )}
          <button
            onClick={() => setSlidesPanelOpen(!slidesPanelOpen)}
            className="rounded p-1 text-gray-500 hover:bg-gray-800/60 hover:text-gray-300"
            title={slidesPanelOpen ? "Collapse slides panel" : "Expand slides panel"}
          >
            <svg className={`h-4 w-4 transition-transform ${slidesPanelOpen ? "" : "rotate-180"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {slidesPanelOpen && (
          <>
            {/* Aspect ratio + Add slot */}
            <div className="flex items-center justify-between border-b border-gray-800/30 px-3 py-2">
              <AspectRatioPicker
                current={aspectRatio}
                onChange={handleAspectRatioChange}
              />
            </div>

            {/* Slide list */}
            <div className="flex-1 space-y-1.5 overflow-y-auto p-2 scrollbar-thin">
              <AnimatePresence initial={false}>
                {slides.map((slide, i) => (
                  <SlideThumbnail
                    key={slide.id}
                    slide={slide}
                    index={i}
                    isActive={i === activeSlideIndex}
                    onSelect={() => selectSlide(i)}
                    onDelete={() => deleteSlide(i)}
                    onDuplicate={() => duplicateSlide(i)}
                    slideCount={slides.length}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Add slide button */}
            <div className="border-t border-gray-800/40 p-2">
              <button
                onClick={addSlide}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-700/60 bg-gray-900/30 px-3 py-2.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-primary-500/40 hover:bg-primary-500/5 hover:text-primary-400"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Slide
              </button>
            </div>
          </>
        )}

        {/* Collapsed state — just show slide index */}
        {!slidesPanelOpen && (
          <div className="flex flex-1 flex-col items-center gap-1 pt-2">
            {slides.map((_, i) => (
              <button
                key={slides[i].id}
                onClick={() => { selectSlide(i); setSlidesPanelOpen(true); }}
                className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold transition-colors ${
                  i === activeSlideIndex
                    ? "bg-primary-500 text-gray-950"
                    : "bg-gray-800/60 text-gray-500 hover:bg-gray-700/60 hover:text-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={addSlide}
              className="mt-1 flex h-6 w-6 items-center justify-center rounded bg-gray-800/40 text-[12px] text-gray-600 hover:bg-primary-500/10 hover:text-primary-400"
              title="Add slide"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* ── Fabric Canvas Editor (Main) ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <FabricEditor
          key={editorKey}
          config={editorConfig}
          defaultState={defaultState ?? undefined}
          onSave={handleSave}
          chikoManifestFactory={createPresentationFabricManifest}
        />
      </div>
    </div>
  );
}
