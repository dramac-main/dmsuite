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

type SubView = "none" | "overview" | "presenter" | "fullscreen";

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
// Presenter Mode — Slidev-exact CSS Grid layout with 3 responsive modes,
// resizable panels, timer controls, editable notes, goto, click slider
// ═══════════════════════════════════════════════════════════════════════════════

type PresenterLayout = 1 | 2 | 3;

function PresenterOverlay({
  slides,
  currentIndex,
  theme,
  aspectRatio,
  onClose,
  onNavigate,
  onGoto,
}: {
  slides: ReturnType<typeof parseSlidevMarkdown>["slides"];
  currentIndex: number;
  theme: ReturnType<typeof getThemeById>;
  aspectRatio: "16:9" | "4:3" | "16:10";
  onClose: () => void;
  onNavigate: (dir: "prev" | "next") => void;
  onGoto: (index: number) => void;
}) {
  // ── Timer ──
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = sec.toString().padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  // ── Click steps ──
  const current = slides[currentIndex];
  const next = slides[currentIndex + 1];
  const totalClicks = countClicks(current.content);
  const [clickStep, setClickStep] = useState(0);
  const prevIndexRef = useRef(currentIndex);
  if (prevIndexRef.current !== currentIndex) {
    prevIndexRef.current = currentIndex;
    if (clickStep !== 0) setClickStep(0);
  }

  // ── Resizable panels (Slidev pattern: pointer events + localStorage) ──
  const [notesWidth, setNotesWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dmsuite-presenter-notes-width");
      return saved ? Number(saved) : 320;
    }
    return 320;
  });
  const [notesRowPercent, setNotesRowPercent] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dmsuite-presenter-notes-row");
      return saved ? Number(saved) : 40;
    }
    return 40;
  });

  const isResizingH = useRef(false);
  const isResizingV = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist on change
  useEffect(() => {
    localStorage.setItem("dmsuite-presenter-notes-width", String(notesWidth));
  }, [notesWidth]);
  useEffect(() => {
    localStorage.setItem("dmsuite-presenter-notes-row", String(notesRowPercent));
  }, [notesRowPercent]);

  // Pointer move handler for resizing
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (isResizingH.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = rect.right - e.clientX;
        setNotesWidth(Math.max(240, Math.min(x, 720)));
      }
      if (isResizingV.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((e.clientY - rect.top) / rect.height) * 100;
        setNotesRowPercent(Math.max(20, Math.min(pct, 80)));
      }
    };
    const handlePointerUp = () => {
      isResizingH.current = false;
      isResizingV.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  // ── Layout mode (responsive like Slidev's 3 breakpoints) ──
  const [layout, setLayout] = useState<PresenterLayout>(1);

  // ── Goto dialog ──
  const [showGoto, setShowGoto] = useState(false);
  const [gotoInput, setGotoInput] = useState("");

  // ── Editable notes ──
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(current.notes || "");
  const prevNoteIdxRef = useRef(currentIndex);
  const prevNoteTextRef = useRef(current.notes);
  if (prevNoteIdxRef.current !== currentIndex || prevNoteTextRef.current !== current.notes) {
    prevNoteIdxRef.current = currentIndex;
    prevNoteTextRef.current = current.notes;
    if (notesText !== (current.notes || "")) setNotesText(current.notes || "");
    if (editingNotes) setEditingNotes(false);
  }

  // ── Keyboard ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (showGoto) {
        if (e.key === "Escape") setShowGoto(false);
        if (e.key === "Enter") {
          const n = parseInt(gotoInput, 10);
          if (n >= 1 && n <= slides.length) {
            onGoto(n - 1);
            setShowGoto(false);
            setGotoInput("");
          }
        }
        return;
      }
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (clickStep < totalClicks) setClickStep((c) => c + 1);
        else onNavigate("next");
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        if (clickStep > 0) setClickStep((c) => c - 1);
        else onNavigate("prev");
      } else if (e.key === "g") {
        setShowGoto(true);
        setGotoInput("");
      } else if (e.key === "Home") {
        e.preventDefault();
        onGoto(0);
      } else if (e.key === "End") {
        e.preventDefault();
        onGoto(slides.length - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onNavigate, onGoto, clickStep, totalClicks, slides.length, showGoto, gotoInput]);

  // ── CSS Grid styles for 3 layouts ──
  const gridStyle: React.CSSProperties =
    layout === 1
      ? {
          display: "grid",
          gridTemplateColumns: `1fr ${notesWidth}px`,
          gridTemplateRows: `${notesRowPercent}% 1fr`,
          gridTemplateAreas: `"main next" "main note"`,
          height: "100%",
        }
      : layout === 2
        ? {
            display: "grid",
            gridTemplateColumns: `1fr ${notesWidth}px`,
            gridTemplateRows: "1fr auto",
            gridTemplateAreas: `"main note" "bottom bottom"`,
            height: "100%",
          }
        : {
            display: "grid",
            gridTemplateColumns: "1fr",
            gridTemplateRows: `${notesRowPercent}% 1fr auto`,
            gridTemplateAreas: `"main" "note" "bottom"`,
            height: "100%",
          };

  // Timer progress bar width
  const timerBarStyle = timerRunning
    ? { transition: "width 1s linear" }
    : {};

  return (
    <div ref={containerRef} className="fixed inset-0 z-999 bg-gray-950 flex flex-col select-none">
      {/* ── Top bar ── */}
      <div className="h-10 flex items-center justify-between px-4 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400">
            Slide {currentIndex + 1} / {slides.length}
          </span>
          {totalClicks > 0 && (
            <span className="text-xs text-gray-500">
              Click {clickStep}/{totalClicks}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          <button
            onClick={() => setTimerRunning((r) => !r)}
            className="text-xs px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono"
            title={timerRunning ? "Pause timer" : "Resume timer"}
          >
            {timerRunning ? "⏸" : "▶"} {formatTime(elapsed)}
          </button>
          <button
            onClick={() => { setElapsed(0); setTimerRunning(true); }}
            className="text-xs px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-400"
            title="Reset timer"
          >↻</button>

          {/* Layout switcher */}
          <div className="flex items-center border-l border-gray-700 ml-2 pl-2 gap-1">
            {([1, 2, 3] as PresenterLayout[]).map((l) => (
              <button
                key={l}
                onClick={() => setLayout(l)}
                className={`w-6 h-5 rounded text-[10px] font-bold ${
                  layout === l
                    ? "bg-primary-500 text-black"
                    : "bg-gray-800 text-gray-500 hover:text-gray-300"
                }`}
              >{l}</button>
            ))}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="ml-2 text-gray-400 hover:text-white text-sm px-2 py-0.5 rounded hover:bg-gray-800"
          >✕</button>
        </div>
      </div>

      {/* ── Timer progress bar (Slidev-style) ── */}
      <div className="h-0.5 bg-gray-800 shrink-0 relative">
        <div
          className="h-full bg-primary-500/60"
          style={{
            width: `${((currentIndex + 1) / slides.length) * 100}%`,
            ...timerBarStyle,
          }}
        />
      </div>

      {/* ── Grid content ── */}
      <div className="flex-1 overflow-hidden" style={gridStyle}>
        {/* Main slide (current) */}
        <div
          style={{ gridArea: "main" }}
          className="flex items-center justify-center p-3 overflow-hidden"
        >
          <div className="relative rounded-lg overflow-hidden shadow-2xl">
            <SlidevSlideRenderer
              slide={current}
              theme={theme}
              scale={0.65}
              clickStep={clickStep}
              aspectRatio={aspectRatio}
            />
          </div>
        </div>

        {/* Next slide preview (layout 1 only) */}
        {layout === 1 && (
          <div
            style={{ gridArea: "next" }}
            className="flex items-center justify-center p-3 border-b border-gray-800"
          >
            {next ? (
              <div className="rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                <SlidevSlideRenderer
                  slide={next}
                  theme={theme}
                  scale={0.28}
                  isThumbnail
                  aspectRatio={aspectRatio}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center text-gray-600 text-xs italic">
                End of presentation
              </div>
            )}
          </div>
        )}

        {/* Notes panel */}
        <div
          style={{ gridArea: "note" }}
          className="flex flex-col p-3 overflow-hidden bg-gray-900/50"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Speaker Notes</span>
            <button
              onClick={() => setEditingNotes((e) => !e)}
              className="text-[10px] text-gray-500 hover:text-gray-300 px-1.5 py-0.5 rounded hover:bg-gray-800"
            >
              {editingNotes ? "Done" : "Edit"}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {editingNotes ? (
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full h-full bg-gray-800 text-gray-300 text-sm p-2 rounded-lg border border-gray-700 resize-none focus:outline-none focus:border-primary-500"
                placeholder="Type speaker notes..."
              />
            ) : notesText ? (
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {notesText}
              </p>
            ) : (
              <p className="text-xs text-gray-600 italic">No notes for this slide</p>
            )}
          </div>
        </div>

        {/* Bottom controls (layouts 2 & 3) */}
        {(layout === 2 || layout === 3) && (
          <div
            style={{ gridArea: "bottom" }}
            className="flex items-center justify-between px-4 py-2 bg-gray-900 border-t border-gray-800"
          >
            {next && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Next:</span>
                <div className="w-24 rounded overflow-hidden border border-gray-700">
                  <SlidevSlideRenderer
                    slide={next}
                    theme={theme}
                    scale={0.1}
                    isThumbnail
                    aspectRatio={aspectRatio}
                  />
                </div>
              </div>
            )}
            <span className="text-xs text-gray-500 font-mono">{formatTime(elapsed)}</span>
          </div>
        )}

        {/* ── Horizontal resize handle ── */}
        {layout !== 3 && (
          <div
            className="absolute top-10 cursor-col-resize z-50 w-1 hover:bg-primary-500/40 active:bg-primary-500/60 transition-colors"
            style={{
              right: notesWidth - 2,
              height: "calc(100% - 2.5rem)",
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              isResizingH.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
          />
        )}

        {/* ── Vertical resize handle ── */}
        {(layout === 1 || layout === 3) && (
          <div
            className="absolute cursor-row-resize z-50 h-1 hover:bg-primary-500/40 active:bg-primary-500/60 transition-colors"
            style={{
              top: `calc(2.5rem + ${notesRowPercent}%)`,
              right: 0,
              width: layout === 1 ? notesWidth : "100%",
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              isResizingV.current = true;
              document.body.style.cursor = "row-resize";
              document.body.style.userSelect = "none";
            }}
          />
        )}
      </div>

      {/* ── Navigation bar (Slidev-style bottom bar) ── */}
      <div className="h-10 flex items-center justify-center gap-1 bg-gray-900 border-t border-gray-800 shrink-0">
        <button
          onClick={() => onGoto(0)}
          disabled={currentIndex <= 0}
          className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30"
          title="First slide (Home)"
        >⏮</button>
        <button
          onClick={() => {
            if (clickStep > 0) setClickStep((c) => c - 1);
            else onNavigate("prev");
          }}
          disabled={currentIndex <= 0 && clickStep <= 0}
          className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30"
          title="Previous (←)"
        >◀</button>

        {/* Goto button */}
        <button
          onClick={() => { setShowGoto(true); setGotoInput(""); }}
          className="px-3 py-1 text-xs font-mono text-gray-300 bg-gray-800 hover:bg-gray-700 rounded min-w-15 text-center"
          title="Go to slide (G)"
        >
          {currentIndex + 1} / {slides.length}
        </button>

        <button
          onClick={() => {
            if (clickStep < totalClicks) setClickStep((c) => c + 1);
            else onNavigate("next");
          }}
          disabled={currentIndex >= slides.length - 1 && clickStep >= totalClicks}
          className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30"
          title="Next (→)"
        >▶</button>
        <button
          onClick={() => onGoto(slides.length - 1)}
          disabled={currentIndex >= slides.length - 1}
          className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded disabled:opacity-30"
          title="Last slide (End)"
        >⏭</button>

        {/* Click slider */}
        {totalClicks > 0 && (
          <div className="flex items-center gap-2 ml-4 border-l border-gray-700 pl-4">
            <span className="text-[10px] text-gray-500">Clicks</span>
            <input
              type="range"
              min={0}
              max={totalClicks}
              value={clickStep}
              onChange={(e) => setClickStep(Number(e.target.value))}
              className="w-20 h-1 accent-primary-500"
            />
            <span className="text-[10px] text-gray-400 font-mono w-6 text-center">{clickStep}</span>
          </div>
        )}
      </div>

      {/* ── Goto Dialog ── */}
      {showGoto && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl w-64">
            <div className="text-sm text-gray-300 mb-2">Go to slide</div>
            <input
              autoFocus
              type="number"
              min={1}
              max={slides.length}
              value={gotoInput}
              onChange={(e) => setGotoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = parseInt(gotoInput, 10);
                  if (n >= 1 && n <= slides.length) {
                    onGoto(n - 1);
                    setShowGoto(false);
                  }
                }
                if (e.key === "Escape") setShowGoto(false);
              }}
              placeholder={`1 — ${slides.length}`}
              className="w-full px-3 py-2 bg-gray-800 text-gray-100 border border-gray-600 rounded-lg text-center text-lg font-mono focus:outline-none focus:border-primary-500"
            />
            <div className="text-[10px] text-gray-500 mt-2 text-center">Enter to go · Esc to cancel</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Fullscreen Present Mode — Slidev-exact play view with click regions,
// bottom nav controls, and CSS filter support
// ═══════════════════════════════════════════════════════════════════════════════

function FullscreenPresent({
  slides,
  currentIndex,
  theme,
  aspectRatio,
  transition,
  onClose,
  onNavigate,
  onGoto,
}: {
  slides: ReturnType<typeof parseSlidevMarkdown>["slides"];
  currentIndex: number;
  theme: ReturnType<typeof getThemeById>;
  aspectRatio: "16:9" | "4:3" | "16:10";
  transition: string;
  onClose: () => void;
  onNavigate: (dir: "prev" | "next") => void;
  onGoto: (index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [clickStep, setClickStep] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const current = slides[currentIndex];
  const totalClicks = countClicks(current.content);

  // Scale to fit viewport
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
      setScale(Math.min(vw / slideW, vh / slideH));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [aspectRatio]);

  // Reset clicks on slide change
  const prevFsIdxRef = useRef(currentIndex);
  if (prevFsIdxRef.current !== currentIndex) {
    prevFsIdxRef.current = currentIndex;
    if (clickStep !== 0) setClickStep(0);
  }

  // Auto-hide cursor
  useEffect(() => {
    const handleMove = () => {
      setCursorHidden(false);
      setShowControls(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => {
        setCursorHidden(true);
        setShowControls(false);
      }, 3000);
    };
    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      clearTimeout(hideTimer.current);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (showOverview) return;
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
        case " ":
        case "Enter":
          e.preventDefault();
          if (clickStep < totalClicks) setClickStep((c) => c + 1);
          else onNavigate("next");
          break;
        case "ArrowLeft":
        case "Backspace":
          e.preventDefault();
          if (clickStep > 0) setClickStep((c) => c - 1);
          else onNavigate("prev");
          break;
        case "Home":
          e.preventDefault();
          onGoto(0);
          break;
        case "End":
          e.preventDefault();
          onGoto(slides.length - 1);
          break;
        case "o":
          setShowOverview(true);
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onNavigate, onGoto, clickStep, totalClicks, slides.length, showOverview]);

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
      ? { transition: "transform 0.4s ease, opacity 0.4s ease" }
      : {};

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-1000 bg-black flex items-center justify-center ${cursorHidden ? "cursor-none" : ""}`}
    >
      {/* ── Click regions (Slidev-style: left half = prev, right half = next) ── */}
      <div
        className="absolute inset-0 z-10 flex"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button, a, input")) return;
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const midpoint = rect.width / 2;
          if (x > midpoint) {
            // Right half → advance
            if (clickStep < totalClicks) setClickStep((c) => c + 1);
            else onNavigate("next");
          } else {
            // Left half → go back
            if (clickStep > 0) setClickStep((c) => c - 1);
            else onNavigate("prev");
          }
        }}
      />

      {/* ── Slide content ── */}
      <div style={transitionStyle} className="relative z-0">
        <SlidevSlideRenderer
          slide={current}
          theme={theme}
          scale={scale}
          clickStep={clickStep}
          aspectRatio={aspectRatio}
        />
      </div>

      {/* ── Bottom controls bar (Slidev-style, auto-hide) ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 py-2 px-4 bg-linear-to-t from-black/80 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={() => onGoto(0)}
          disabled={currentIndex <= 0}
          className="p-1.5 text-white/60 hover:text-white rounded hover:bg-white/10 disabled:opacity-30 text-xs"
        >⏮</button>
        <button
          onClick={() => {
            if (clickStep > 0) setClickStep((c) => c - 1);
            else onNavigate("prev");
          }}
          disabled={currentIndex <= 0 && clickStep <= 0}
          className="p-1.5 text-white/60 hover:text-white rounded hover:bg-white/10 disabled:opacity-30 text-xs"
        >◀</button>

        <span className="text-xs text-white/50 font-mono min-w-12.5 text-center">
          {currentIndex + 1} / {slides.length}
        </span>

        <button
          onClick={() => {
            if (clickStep < totalClicks) setClickStep((c) => c + 1);
            else onNavigate("next");
          }}
          disabled={currentIndex >= slides.length - 1 && clickStep >= totalClicks}
          className="p-1.5 text-white/60 hover:text-white rounded hover:bg-white/10 disabled:opacity-30 text-xs"
        >▶</button>
        <button
          onClick={() => onGoto(slides.length - 1)}
          disabled={currentIndex >= slides.length - 1}
          className="p-1.5 text-white/60 hover:text-white rounded hover:bg-white/10 disabled:opacity-30 text-xs"
        >⏭</button>

        <div className="w-px h-4 bg-white/20 mx-1" />

        <button
          onClick={() => setShowOverview(true)}
          className="p-1.5 text-white/60 hover:text-white rounded hover:bg-white/10 text-xs"
          title="Overview (O)"
        >
          <GridIcon />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 text-white/60 hover:text-white rounded hover:bg-white/10 text-xs"
          title="Exit (Esc)"
        >✕</button>
      </div>

      {/* ── Slide progress bar (Slidev-style) ── */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-white/10">
        <div
          className="h-full bg-primary-500/70 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* ── Quick overview overlay ── */}
      {showOverview && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-6 py-3">
            <span className="text-sm text-white/80 font-medium">Slide Overview</span>
            <button
              onClick={() => setShowOverview(false)}
              className="text-white/60 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10"
            >Close (Esc / O)</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-w-7xl mx-auto">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => {
                    onGoto(i);
                    setShowOverview(false);
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentIndex
                      ? "border-primary-500 ring-2 ring-primary-500/30"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <SlidevSlideRenderer
                    slide={slide}
                    theme={theme}
                    scale={0.18}
                    isThumbnail
                    aspectRatio={aspectRatio}
                  />
                  <div className={`absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    i === currentIndex ? "bg-primary-500 text-black" : "bg-black/70 text-white/80"
                  }`}>
                    {i + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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
          setSubView("fullscreen");
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

            {/* Present mode buttons */}
            <div className="ml-4 border-l border-gray-700 pl-4 flex gap-2">
              <ActionButton
                onClick={() => setSubView("fullscreen")}
                variant="primary"
              >Present</ActionButton>
              <ActionButton
                onClick={() => setSubView("presenter")}
                variant="secondary"
              >Presenter</ActionButton>
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
          onGoto={setActiveSlideIndex}
        />
      )}

      {subView === "fullscreen" && (
        <FullscreenPresent
          slides={slides}
          currentIndex={activeSlideIndex}
          theme={theme}
          aspectRatio={form.aspectRatio}
          transition={form.transition}
          onClose={() => setSubView("none")}
          onNavigate={handlePresentNavigate}
          onGoto={setActiveSlideIndex}
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
