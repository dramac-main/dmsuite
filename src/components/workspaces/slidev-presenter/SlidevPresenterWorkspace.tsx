"use client";

// =============================================================================
// DMSuite — Slidev Presenter Workspace
// Markdown-powered slide deck creator inspired by Slidev.
// Features: 17 layouts, 10 themes, code highlighting, KaTeX math, Mermaid
// diagrams, click animations, presenter mode, drawing, keyboard navigation.
// =============================================================================

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";

import { useSlidevEditor, useSlidevUndo } from "@/stores/slidev-editor";
import { parseSlidevMarkdown, countClicks } from "@/lib/slidev/parser";
import type { LayoutType } from "@/lib/slidev/parser";
import { getThemeById } from "@/lib/slidev/themes";
import SlidevSlideRenderer from "./SlidevSlideRenderer";
import SlidevNavigatorPanel from "./SlidevNavigatorPanel";
import SlidevEditorTab from "./tabs/SlidevEditorTab";
import SlidevThemeTab from "./tabs/SlidevThemeTab";
import SlidevSettingsTab from "./tabs/SlidevSettingsTab";

import {
  WorkspaceHeader,
  IconButton,
  ActionButton,
  BottomBar,
  EditorTabNav,
  Icons,
  ConfirmDialog,
  FormInput,
  type EditorTab,
} from "@/components/workspaces/shared/WorkspaceUIKit";

import { useChikoActions } from "@/hooks/useChikoActions";
import { createSlidevPresenterManifest } from "@/lib/chiko/manifests/slidev-presenter";

// ── Tab definitions ─────────────────────────────────────────────────────────

const EDITOR_TABS: EditorTab[] = [
  { key: "editor", label: "Slides", icon: Icons.edit },
  { key: "theme", label: "Theme", icon: Icons.preview },
  { key: "settings", label: "Settings", icon: Icons.convert },
];

// ── Inline SVG icons not in WorkspaceUIKit ──────────────────────────────────

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
);
const MonitorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
);
const PenIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
);
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
);
const ResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

// ── Sub-views ───────────────────────────────────────────────────────────────

type SubView = "none" | "overview" | "presenter";

// ═══════════════════════════════════════════════════════════════════════════════
// PromptPhase — Entry point with topic input + template selection
// ═══════════════════════════════════════════════════════════════════════════════

function PromptPhase({
  onGenerate,
  onBlank,
}: {
  onGenerate: (topic: string) => void;
  onBlank: () => void;
}) {
  const [topic, setTopic] = useState("");

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 text-primary-400 rounded-full text-xs font-medium mb-2">
            <span>✦</span> Markdown-Powered
          </div>
          <h1 className="text-3xl font-bold text-gray-100">
            Slide Deck Presenter
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Create stunning presentations with Markdown. Code highlighting,
            math formulas, diagrams, 17 layouts, and 10 themes.
          </p>
        </div>

        {/* Topic → Generate */}
        <div className="space-y-3">
          <FormInput
            label="Presentation Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Quarterly Business Review, React Architecture, Machine Learning 101..."
          />
          <div className="flex gap-2">
            <ActionButton
              onClick={() => {
                if (topic.trim()) onGenerate(topic.trim());
              }}
              variant="primary"
              disabled={!topic.trim()}
              className="flex-1"
            >Generate Deck</ActionButton>
            <ActionButton
              onClick={onBlank}
              variant="secondary"
              className="flex-1"
            >Blank Deck</ActionButton>
          </div>
        </div>

        {/* Quick-start templates */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 text-center">Quick Start</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Project Pitch", topic: "Project Pitch Deck" },
              { label: "Tech Talk", topic: "Technology Deep Dive" },
              { label: "Team Update", topic: "Team Weekly Update" },
              { label: "Tutorial", topic: "Step-by-Step Tutorial" },
            ].map((t) => (
              <button
                key={t.label}
                className="px-3 py-2 text-xs bg-gray-800/60 hover:bg-gray-700/80 text-gray-300 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all text-left"
                onClick={() => onGenerate(t.topic)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Presenter Mode Overlay
// ═══════════════════════════════════════════════════════════════════════════════

function PresenterOverlay({
  slides,
  currentIndex,
  theme,
  aspectRatio,
  onClose,
  onNavigate,
}: {
  slides: ReturnType<typeof parseSlidevMarkdown>["slides"];
  currentIndex: number;
  theme: ReturnType<typeof getThemeById>;
  aspectRatio: "16:9" | "4:3" | "16:10";
  onClose: () => void;
  onNavigate: (dir: "prev" | "next") => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const current = slides[currentIndex];
  const next = slides[currentIndex + 1];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === " ") onNavigate("next");
      else if (e.key === "ArrowLeft" || e.key === "Backspace")
        onNavigate("prev");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-[999] bg-gray-950 flex">
      {/* Left: Current slide (large) */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className="relative overflow-hidden rounded-xl shadow-2xl"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        >
          <SlidevSlideRenderer
            slide={current}
            theme={theme}
            scale={0.7}
            aspectRatio={aspectRatio}
          />
        </div>
      </div>

      {/* Right: Next slide + notes + timer */}
      <div className="w-80 flex flex-col border-l border-gray-800 bg-gray-900 p-4 gap-4">
        {/* Timer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Slide {currentIndex + 1} / {slides.length}
          </span>
          <span className="text-lg font-mono text-primary-400">
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Next slide preview */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Next</div>
          {next ? (
            <div className="rounded-lg overflow-hidden border border-gray-700">
              <SlidevSlideRenderer
                slide={next}
                theme={theme}
                scale={0.29}
                isThumbnail
                aspectRatio={aspectRatio}
              />
            </div>
          ) : (
            <div className="h-20 rounded-lg bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
              End of presentation
            </div>
          )}
        </div>

        {/* Speaker notes */}
        <div className="flex-1 overflow-y-auto">
          <div className="text-xs text-gray-500 mb-1">Speaker Notes</div>
          {current.notes ? (
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {current.notes}
            </p>
          ) : (
            <p className="text-xs text-gray-600 italic">
              No notes for this slide
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <ActionButton
            onClick={() => onNavigate("prev")}
            variant="secondary"
            className="flex-1"
            disabled={currentIndex <= 0}
          >← Prev</ActionButton>
          <ActionButton
            onClick={() => onNavigate("next")}
            variant="primary"
            className="flex-1"
            disabled={currentIndex >= slides.length - 1}
          >Next →</ActionButton>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Press Esc to exit presenter mode
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Fullscreen Present Mode
// ═══════════════════════════════════════════════════════════════════════════════

function FullscreenPresent({
  slides,
  currentIndex,
  theme,
  aspectRatio,
  transition,
  onClose,
  onNavigate,
}: {
  slides: ReturnType<typeof parseSlidevMarkdown>["slides"];
  currentIndex: number;
  theme: ReturnType<typeof getThemeById>;
  aspectRatio: "16:9" | "4:3" | "16:10";
  transition: string;
  onClose: () => void;
  onNavigate: (dir: "prev" | "next") => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [clickStep, setClickStep] = useState(0);

  const current = slides[currentIndex];
  const totalClicks = countClicks(current.content);

  // Compute scale to fit viewport
  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const ar =
        aspectRatio === "4:3"
          ? 4 / 3
          : aspectRatio === "16:10"
            ? 16 / 10
            : 16 / 9;
      const slideW = 960;
      const slideH = slideW / ar;
      const s = Math.min(vw / slideW, vh / slideH);
      setScale(s);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [aspectRatio]);

  // Reset click step on slide change
  useEffect(() => {
    setClickStep(0);
  }, [currentIndex]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (
        e.key === "ArrowRight" ||
        e.key === " " ||
        e.key === "Enter"
      ) {
        e.preventDefault();
        if (clickStep < totalClicks) {
          setClickStep((c) => c + 1);
        } else {
          onNavigate("next");
        }
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        if (clickStep > 0) {
          setClickStep((c) => c - 1);
        } else {
          onNavigate("prev");
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onNavigate, clickStep, totalClicks]);

  // Request fullscreen
  useEffect(() => {
    const el = containerRef.current;
    if (el && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Transition CSS
  const transitionStyle: React.CSSProperties =
    transition !== "none"
      ? {
          transition: "transform 0.4s ease, opacity 0.4s ease",
        }
      : {};

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1000] bg-black flex items-center justify-center cursor-none"
      onClick={(e) => {
        // Click to advance (unless clicking a link)
        if ((e.target as HTMLElement).tagName !== "A") {
          if (clickStep < totalClicks) {
            setClickStep((c) => c + 1);
          } else {
            onNavigate("next");
          }
        }
      }}
    >
      <div style={transitionStyle}>
        <SlidevSlideRenderer
          slide={current}
          theme={theme}
          scale={scale}
          clickStep={clickStep}
          aspectRatio={aspectRatio}
        />
      </div>

      {/* Slide counter (bottom right, subtle) */}
      <div className="absolute bottom-4 right-6 text-xs text-white/30 font-mono">
        {currentIndex + 1} / {slides.length}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Slide Overview Grid
// ═══════════════════════════════════════════════════════════════════════════════

function SlideOverview({
  slides,
  theme,
  aspectRatio,
  activeIndex,
  onSelect,
  onClose,
}: {
  slides: ReturnType<typeof parseSlidevMarkdown>["slides"];
  theme: ReturnType<typeof getThemeById>;
  aspectRatio: "16:9" | "4:3" | "16:10";
  activeIndex: number;
  onSelect: (i: number) => void;
  onClose: () => void;
}) {
  const thumbW = 240;
  const ar =
    aspectRatio === "4:3" ? 4 / 3 : aspectRatio === "16:10" ? 16 / 10 : 16 / 9;
  const thumbH = thumbW / ar;
  const thumbScale = thumbW / 960;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "o") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[998] bg-gray-950/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-200">
          Slide Overview ({slides.length} slides)
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white px-3 py-1 rounded-lg hover:bg-gray-800 transition-colors text-sm"
        >
          Close (Esc)
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => {
                onSelect(i);
                onClose();
              }}
              className={`group relative rounded-xl overflow-hidden transition-all border-2 ${
                i === activeIndex
                  ? "border-primary-500 ring-2 ring-primary-500/20"
                  : "border-gray-700 hover:border-gray-500"
              }`}
            >
              <div style={{ width: thumbW, height: thumbH }} className="overflow-hidden">
                <SlidevSlideRenderer
                  slide={slide}
                  theme={theme}
                  scale={thumbScale}
                  isThumbnail
                  aspectRatio={aspectRatio}
                />
              </div>
              <div
                className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded ${
                  i === activeIndex
                    ? "bg-primary-500 text-black"
                    : "bg-black/60 text-white"
                }`}
              >
                {i + 1}
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 bg-black/50 px-1 rounded">
                {slide.layout}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Drawing Overlay
// ═══════════════════════════════════════════════════════════════════════════════

function DrawingOverlay({
  width,
  height,
  paths,
  isDrawing,
  drawColor,
  drawWidth,
  onAddPath,
}: {
  width: number;
  height: number;
  paths: { points: [number, number][]; color: string; width: number }[];
  isDrawing: boolean;
  drawColor: string;
  drawWidth: number;
  onAddPath: (path: {
    points: [number, number][];
    color: string;
    width: number;
  }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentPath = useRef<[number, number][]>([]);
  const isDown = useRef(false);

  // Redraw existing paths
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const path of paths) {
      if (path.points.length < 2) continue;
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(path.points[0][0], path.points[0][1]);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i][0], path.points[i][1]);
      }
      ctx.stroke();
    }
  }, [paths, width, height]);

  if (!isDrawing) return null;

  const getPos = (
    e: React.MouseEvent<HTMLCanvasElement>,
  ): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 z-20 cursor-crosshair"
      onMouseDown={(e) => {
        isDown.current = true;
        currentPath.current = [getPos(e)];
      }}
      onMouseMove={(e) => {
        if (!isDown.current) return;
        const pos = getPos(e);
        currentPath.current.push(pos);
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx && currentPath.current.length >= 2) {
          const pts = currentPath.current;
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = drawWidth;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(pts[pts.length - 2][0], pts[pts.length - 2][1]);
          ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
          ctx.stroke();
        }
      }}
      onMouseUp={() => {
        isDown.current = false;
        if (currentPath.current.length >= 2) {
          onAddPath({
            points: [...currentPath.current],
            color: drawColor,
            width: drawWidth,
          });
        }
        currentPath.current = [];
      }}
      onMouseLeave={() => {
        if (isDown.current) {
          isDown.current = false;
          if (currentPath.current.length >= 2) {
            onAddPath({
              points: [...currentPath.current],
              color: drawColor,
              width: drawWidth,
            });
          }
          currentPath.current = [];
        }
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Workspace
// ═══════════════════════════════════════════════════════════════════════════════

export default function SlidevPresenterWorkspace() {
  // ── Store ──────────────────────────────
  const form = useSlidevEditor((s) => s.form);
  const phase = useSlidevEditor((s) => s.phase);
  const activeSlideIndex = useSlidevEditor((s) => s.activeSlideIndex);
  const setMarkdown = useSlidevEditor((s) => s.setMarkdown);
  const setThemeId = useSlidevEditor((s) => s.setThemeId);
  const setAspectRatio = useSlidevEditor((s) => s.setAspectRatio);
  const setTransition = useSlidevEditor((s) => s.setTransition);
  const setPhase = useSlidevEditor((s) => s.setPhase);
  const setActiveSlideIndex = useSlidevEditor((s) => s.setActiveSlideIndex);
  const updateSlideContent = useSlidevEditor((s) => s.updateSlideContent);
  const updateSlideNotes = useSlidevEditor((s) => s.updateSlideNotes);
  const setSlideLayout = useSlidevEditor((s) => s.setSlideLayout);
  const addSlide = useSlidevEditor((s) => s.addSlide);
  const deleteSlide = useSlidevEditor((s) => s.deleteSlide);
  const duplicateSlide = useSlidevEditor((s) => s.duplicateSlide);
  const moveSlide = useSlidevEditor((s) => s.moveSlide);
  const setTitle = useSlidevEditor((s) => s.setTitle);
  const setAuthor = useSlidevEditor((s) => s.setAuthor);
  const addDrawingPath = useSlidevEditor((s) => s.addDrawingPath);
  const clearDrawings = useSlidevEditor((s) => s.clearDrawings);
  const generateFromTopic = useSlidevEditor((s) => s.generateFromTopic);
  const resetForm = useSlidevEditor((s) => s.resetForm);

  const { undo, redo, canUndo, canRedo } = useSlidevUndo();

  // ── Derived ────────────────────────────
  const deck = useMemo(
    () => parseSlidevMarkdown(form.markdown),
    [form.markdown],
  );
  const slides = deck.slides;
  const headmatter = deck.headmatter;
  const theme = getThemeById(form.themeId);
  const activeSlide = slides[activeSlideIndex] || slides[0];

  // Clamp active index
  useEffect(() => {
    if (activeSlideIndex >= slides.length) {
      setActiveSlideIndex(Math.max(0, slides.length - 1));
    }
  }, [slides.length, activeSlideIndex, setActiveSlideIndex]);

  // ── Local state ────────────────────────
  const [activeTab, setActiveTab] = useState("editor");
  const [subView, setSubView] = useState<SubView>("none");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [drawWidth, setDrawWidth] = useState(3);
  const [confirmReset, setConfirmReset] = useState(false);
  const printRef = useRef<(() => void) | null>(null);

  // Preview scale
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.6);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const cw = el.clientWidth - 32;
      const ch = el.clientHeight - 80;
      const ar =
        form.aspectRatio === "4:3"
          ? 4 / 3
          : form.aspectRatio === "16:10"
            ? 16 / 10
            : 16 / 9;
      const slideW = 960;
      const slideH = slideW / ar;
      setPreviewScale(Math.min(cw / slideW, ch / slideH, 1));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [form.aspectRatio]);

  // ── Chiko ──────────────────────────────
  const manifestOptions = useMemo(
    () => ({ onPrintRef: { current: printRef.current } }),
    [],
  );
  useChikoActions(
    () => createSlidevPresenterManifest(manifestOptions)
  );

  // ── Keyboard navigation ────────────────
  useEffect(() => {
    if (phase !== "editor" || subView !== "none") return;
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          if (activeSlideIndex < slides.length - 1) {
            setActiveSlideIndex(activeSlideIndex + 1);
          }
          break;
        case "ArrowLeft":
        case "Backspace":
          e.preventDefault();
          if (activeSlideIndex > 0) {
            setActiveSlideIndex(activeSlideIndex - 1);
          }
          break;
        case "f":
          e.preventDefault();
          setSubView("none");
          setTimeout(() => setSubView("presenter"), 0); // trigger fullscreen
          break;
        case "p":
          e.preventDefault();
          setSubView((v) => (v === "presenter" ? "none" : "presenter"));
          break;
        case "o":
          e.preventDefault();
          setSubView((v) => (v === "overview" ? "none" : "overview"));
          break;
        case "d":
          e.preventDefault();
          setIsDrawing((d) => !d);
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, subView, activeSlideIndex, slides.length, setActiveSlideIndex]);

  // ── Print / Export ─────────────────────
  const handlePrint = useCallback(() => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const slideHtmls = slides
      .map(() => "")
      .join(""); // placeholder; full implementation below

    // Build print document with all slides
    const body = slides
      .map(
        (slide, i) => `
      <div style="page-break-after: always; width: 960px; height: ${
        form.aspectRatio === "4:3"
          ? 720
          : form.aspectRatio === "16:10"
            ? 600
            : 540
      }px; overflow: hidden; margin: 0 auto;">
        <div id="print-slide-${i}"></div>
      </div>
    `,
      )
      .join("");

    printWin.document.write(`
      <html>
        <head>
          <title>${headmatter.title || "Presentation"}</title>
          <style>
            @page { size: landscape; margin: 0; }
            body { margin: 0; padding: 0; }
            @media print { div { page-break-inside: avoid; } }
          </style>
        </head>
        <body>${body}</body>
      </html>
    `);
    printWin.document.close();
    setTimeout(() => {
      printWin.print();
    }, 500);
  }, [slides, form.aspectRatio, headmatter.title]);

  printRef.current = handlePrint;

  // ── Navigate in present modes ──────────
  const handlePresentNavigate = useCallback(
    (dir: "prev" | "next") => {
      if (dir === "next" && activeSlideIndex < slides.length - 1) {
        setActiveSlideIndex(activeSlideIndex + 1);
      } else if (dir === "prev" && activeSlideIndex > 0) {
        setActiveSlideIndex(activeSlideIndex - 1);
      }
    },
    [activeSlideIndex, slides.length, setActiveSlideIndex],
  );

  // ── Drawing paths for current slide ────
  const drawingPaths = form.drawings[activeSlideIndex] || [];

  // ═════════════════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════════════════

  // Prompt phase
  if (phase === "prompt") {
    return (
      <div className="h-full flex flex-col bg-gray-950">
        <WorkspaceHeader
          title="Slide Deck Presenter"
          subtitle="Markdown-powered presentations"
        />
        <PromptPhase
          onGenerate={(topic) => generateFromTopic(topic)}
          onBlank={() => {
            setMarkdown(
              `---\ntheme: default\ntitle: Untitled\n---\n\n# Untitled\n\nStart writing...\n`,
            );
            setPhase("editor");
          }}
        />
      </div>
    );
  }

  // Editor phase
  const slideSize = {
    w: 960,
    h:
      form.aspectRatio === "4:3"
        ? 720
        : form.aspectRatio === "16:10"
          ? 600
          : 540,
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 overflow-hidden">
      {/* ── Header ────────────────────────── */}
      <WorkspaceHeader
        title={
          (headmatter.title as string) || "Untitled Presentation"
        }
        subtitle={`${slides.length} slides · ${theme.name} theme`}
      >
        <div className="flex items-center gap-1">
          <IconButton icon={Icons.undo} tooltip="Undo" onClick={() => undo()} disabled={!canUndo} />
          <IconButton icon={Icons.redo} tooltip="Redo" onClick={() => redo()} disabled={!canRedo} />
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <IconButton icon={<GridIcon />} tooltip="Overview (O)" onClick={() => setSubView("overview")} />
          <IconButton icon={<MonitorIcon />} tooltip="Presenter (P)" onClick={() => setSubView("presenter")} />
          <IconButton icon={<PenIcon />} tooltip="Draw (D)" onClick={() => setIsDrawing((d) => !d)} />
          <IconButton icon={Icons.print} tooltip="Export PDF" onClick={handlePrint} />
          <IconButton icon={<ResetIcon />} tooltip="Reset" onClick={() => setConfirmReset(true)} />
        </div>
      </WorkspaceHeader>

      {/* ── Main content ──────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Panel: Tabs ────────────── */}
        <div className="w-72 xl:w-80 border-r border-gray-800 flex flex-col bg-gray-900/50 hidden md:flex">
          <EditorTabNav
            tabs={EDITOR_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="flex-1 overflow-hidden p-3">
            {activeTab === "editor" && (
              <SlidevEditorTab
                markdown={form.markdown}
                slides={slides}
                activeSlideIndex={activeSlideIndex}
                onMarkdownChange={setMarkdown}
                onSlideContentChange={updateSlideContent}
                onSlideNotesChange={updateSlideNotes}
              />
            )}
            {activeTab === "theme" && (
              <SlidevThemeTab
                currentThemeId={form.themeId}
                onThemeChange={setThemeId}
              />
            )}
            {activeTab === "settings" && (
              <SlidevSettingsTab
                title={(headmatter.title as string) || ""}
                author={(headmatter.author as string) || ""}
                aspectRatio={form.aspectRatio}
                transition={form.transition}
                activeSlideLayout={activeSlide.layout}
                onTitleChange={setTitle}
                onAuthorChange={setAuthor}
                onAspectRatioChange={setAspectRatio}
                onTransitionChange={setTransition}
                onSlideLayoutChange={(layout) =>
                  setSlideLayout(activeSlideIndex, layout)
                }
              />
            )}
          </div>
        </div>

        {/* ── Center: Preview ─────────────── */}
        <div
          ref={previewContainerRef}
          className="flex-1 flex flex-col items-center justify-center bg-gray-950 relative overflow-hidden"
        >
          {/* Slide preview */}
          <div className="relative">
            <div
              className="shadow-2xl rounded-lg overflow-hidden"
              style={{
                width: slideSize.w * previewScale,
                height: slideSize.h * previewScale,
              }}
            >
              <SlidevSlideRenderer
                slide={activeSlide}
                theme={theme}
                scale={previewScale}
                aspectRatio={form.aspectRatio}
              />
              <DrawingOverlay
                width={slideSize.w * previewScale}
                height={slideSize.h * previewScale}
                paths={drawingPaths}
                isDrawing={isDrawing}
                drawColor={drawColor}
                drawWidth={drawWidth}
                onAddPath={(p) => addDrawingPath(activeSlideIndex, p)}
              />
            </div>
          </div>

          {/* Navigation bar */}
          <div className="mt-4 flex items-center gap-3">
            <button
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
              onClick={() =>
                setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))
              }
              disabled={activeSlideIndex <= 0}
            >
              <ChevronLeftIcon />
            </button>
            <span className="text-sm text-gray-400 font-mono min-w-[60px] text-center">
              {activeSlideIndex + 1} / {slides.length}
            </span>
            <button
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
              onClick={() =>
                setActiveSlideIndex(
                  Math.min(slides.length - 1, activeSlideIndex + 1),
                )
              }
              disabled={activeSlideIndex >= slides.length - 1}
            >
              <ChevronRightIcon />
            </button>

            {/* Fullscreen present button */}
            <div className="ml-4 border-l border-gray-700 pl-4">
              <ActionButton
                onClick={() => setSubView("presenter")}
                variant="primary"
              >Present</ActionButton>
            </div>
          </div>

          {/* Drawing toolbar */}
          {isDrawing && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700 shadow-xl">
              <span className="text-xs text-gray-400 mr-1">Draw</span>
              {["#ef4444", "#22c55e", "#3b82f6", "#eab308", "#ffffff"].map(
                (c) => (
                  <button
                    key={c}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      drawColor === c
                        ? "border-white scale-110"
                        : "border-gray-600"
                    }`}
                    style={{ background: c }}
                    onClick={() => setDrawColor(c)}
                  />
                ),
              )}
              <select
                value={drawWidth}
                onChange={(e) => setDrawWidth(Number(e.target.value))}
                className="bg-gray-700 text-gray-300 text-xs rounded px-1 py-0.5 ml-1"
              >
                <option value={2}>Thin</option>
                <option value={3}>Medium</option>
                <option value={5}>Thick</option>
              </select>
              <button
                className="text-xs text-red-400 hover:text-red-300 ml-1"
                onClick={() => clearDrawings(activeSlideIndex)}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* ── Right Panel: Navigator ──────── */}
        <div className="w-56 xl:w-64 border-l border-gray-800 bg-gray-900/50 p-3 hidden lg:flex flex-col">
          <SlidevNavigatorPanel
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            theme={theme}
            aspectRatio={form.aspectRatio}
            onSelectSlide={setActiveSlideIndex}
            onAddSlide={() => addSlide("default", activeSlideIndex)}
            onDeleteSlide={deleteSlide}
            onDuplicateSlide={duplicateSlide}
            onMoveSlide={(i, dir) =>
              moveSlide(i, dir === "up" ? i - 1 : i + 1)
            }
            notes={activeSlide.notes}
            onNotesChange={(n) => updateSlideNotes(activeSlideIndex, n)}
          />
        </div>
      </div>

      {/* ── Mobile bottom bar ─────────────── */}
      <div className="md:hidden">
        <BottomBar
          actions={[
            { key: "editor", label: "Slides", icon: Icons.edit },
            { key: "theme", label: "Theme", icon: Icons.preview },
            { key: "settings", label: "Settings", icon: Icons.convert },
          ]}
          activeKey={activeTab}
          onAction={setActiveTab}
        />
      </div>

      {/* ── Overlays ──────────────────────── */}
      {subView === "overview" && (
        <SlideOverview
          slides={slides}
          theme={theme}
          aspectRatio={form.aspectRatio}
          activeIndex={activeSlideIndex}
          onSelect={setActiveSlideIndex}
          onClose={() => setSubView("none")}
        />
      )}

      {subView === "presenter" && (
        <PresenterOverlay
          slides={slides}
          currentIndex={activeSlideIndex}
          theme={theme}
          aspectRatio={form.aspectRatio}
          onClose={() => setSubView("none")}
          onNavigate={handlePresentNavigate}
        />
      )}

      {/* ── Confirm reset dialog ──────────── */}
      <ConfirmDialog
        open={confirmReset}
        title="Reset Presentation"
        description="This will discard all slides and return to the start screen. This cannot be undone."
        confirmLabel="Reset"
        variant="danger"
        onConfirm={() => {
          resetForm();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
