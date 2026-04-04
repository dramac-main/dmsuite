// =============================================================================
// DMSuite -- Reveal.js Presenter Workspace
// Full-featured presentation designer powered by reveal.js (68K+, MIT).
//
// Originally based on reveal.js -- MIT License
// Copyright (c) 2011-2026 Hakim El Hattab, https://hakim.se
// See: https://github.com/hakimel/reveal.js/blob/master/LICENSE
// =============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  useRevealPresenterEditor,
  useRevealUndo,
  REVEAL_THEMES,
  REVEAL_TRANSITIONS,
  type RevealThemeId,
  type RevealTransition,
  type RevealSlide,
} from "@/stores/reveal-presenter-editor";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createRevealPresenterManifest } from "@/lib/chiko/manifests/reveal-presenter";

import type { RevealApi } from "reveal.js";

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STARTER_TOPICS = [
  { label: "Startup Pitch", prompt: "A compelling startup pitch deck for a SaaS product" },
  { label: "Product Launch", prompt: "A product launch presentation for a new mobile app" },
  { label: "Quarterly Review", prompt: "A quarterly business review with KPIs and metrics" },
  { label: "Research Talk", prompt: "An academic research presentation with methodology and findings" },
  { label: "Workshop", prompt: "An interactive workshop presentation with exercises and breakout activities" },
  { label: "Team Onboarding", prompt: "A new employee onboarding presentation for a tech company" },
];

// â”€â”€ Inline SVG Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" /></svg>
);
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);
const ArrowUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
);
const ArrowDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
);
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);
const UndoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
);
const RedoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
);
const NotesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
);
const ChevronLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
);
const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74z" /><path d="M18 14l1.05 3.15L22.2 18.2l-3.15 1.05L18 22.4l-1.05-3.15L13.8 18.2l3.15-1.05z" /></svg>
);

// â”€â”€ Slide Thumbnail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SlideThumbnail({
  slide,
  index,
  isActive,
  onClick,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  total,
}: {
  slide: RevealSlide;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  total: number;
}) {
  return (
    <div
      className={`group relative flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? "bg-primary-500/20 ring-1 ring-primary-500/50"
          : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
      }`}
      onClick={onClick}
    >
      {/* Slide number */}
      <span className="shrink-0 w-6 text-xs font-mono text-gray-400 text-right pt-1">
        {index + 1}
      </span>

      {/* Mini preview */}
      <div className="flex-1 min-w-0">
        <div
          className="w-full aspect-video bg-gray-800 rounded border border-gray-700/50 p-2 text-[6px] text-gray-300 overflow-hidden leading-tight"
          dangerouslySetInnerHTML={{
            __html: slide.content.replace(/<h1/g, '<h1 style="font-size:10px;margin:0"')
              .replace(/<h2/g, '<h2 style="font-size:8px;margin:0"')
              .replace(/<h3/g, '<h3 style="font-size:7px;margin:0"')
              .replace(/<p/g, '<p style="font-size:6px;margin:2px 0"')
              .replace(/<li/g, '<li style="font-size:6px;margin:1px 0"'),
          }}
        />
        {slide.notes && (
          <p className="mt-1 text-[10px] text-gray-500 truncate">
            <NotesIcon /> {slide.notes.slice(0, 40)}
          </p>
        )}
      </div>

      {/* Actions (visible on hover) */}
      <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            className="p-0.5 rounded bg-gray-700/80 hover:bg-gray-600 text-gray-300"
            title="Move up"
          >
            <ArrowUpIcon />
          </button>
        )}
        {index < total - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            className="p-0.5 rounded bg-gray-700/80 hover:bg-gray-600 text-gray-300"
            title="Move down"
          >
            <ArrowDownIcon />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-0.5 rounded bg-gray-700/80 hover:bg-gray-600 text-gray-300"
          title="Duplicate"
        >
          <CopyIcon />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 rounded bg-gray-700/80 hover:bg-red-600 text-gray-300"
          title="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

// â”€â”€ Prompt Phase â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PromptPhase() {
  const [topic, setTopic] = useState("");
  const setPhase = useRevealPresenterEditor((s) => s.setPhase);

  const handleStart = useCallback(() => {
    setPhase("editor");
  }, [setPhase]);

  const handleTopicStart = useCallback(
    (prompt: string) => {
      setTopic(prompt);
      setPhase("editor");
    },
    [setPhase]
  );

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/10 text-primary-400 mb-2">
            <SparklesIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reveal.js Presentation Designer
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create stunning HTML presentations with 14 themes, 6 transitions, speaker notes, and full keyboard navigation.
          </p>
        </div>

        {/* Quick start input */}
        <div className="space-y-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStart()}
            placeholder="What's your presentation about?"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <button
            onClick={handleStart}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-gray-900 font-semibold transition-colors"
          >
            Start Building
          </button>
        </div>

        {/* Starter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {STARTER_TOPICS.map((t) => (
            <button
              key={t.label}
              onClick={() => handleTopicStart(t.prompt)}
              className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-left hover:border-primary-500/50 hover:bg-primary-500/5 transition-colors"
            >
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t.label}
              </span>
            </button>
          ))}
        </div>

        {/* Skip to blank */}
        <p className="text-center text-xs text-gray-400">
          Or press{" "}
          <button
            onClick={handleStart}
            className="text-primary-400 underline hover:text-primary-300"
          >
            Start Building
          </button>{" "}
          to begin with a blank deck.
        </p>
      </div>
    </div>
  );
}

// â”€â”€ Slide Editor Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SlideEditorPanel() {
  const activeSlideIndex = useRevealPresenterEditor((s) => s.activeSlideIndex);
  const slides = useRevealPresenterEditor((s) => s.form.slides);
  const updateSlideContent = useRevealPresenterEditor((s) => s.updateSlideContent);
  const updateSlideNotes = useRevealPresenterEditor((s) => s.updateSlideNotes);
  const updateSlideBackground = useRevealPresenterEditor((s) => s.updateSlideBackground);

  const slide = slides[activeSlideIndex];
  if (!slide) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Content editor */}
      <div className="flex-1 overflow-auto p-3">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Slide Content (HTML)
        </label>
        <textarea
          value={slide.content}
          onChange={(e) => updateSlideContent(activeSlideIndex, e.target.value)}
          className="w-full h-48 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary-500/50"
          spellCheck={false}
        />

        {/* Speaker Notes */}
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-4 mb-1">
          Speaker Notes
        </label>
        <textarea
          value={slide.notes}
          onChange={(e) => updateSlideNotes(activeSlideIndex, e.target.value)}
          className="w-full h-24 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary-500/50"
          placeholder="Notes visible only to the presenter..."
        />

        {/* Background */}
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-4 mb-1">
          Background (CSS color or URL)
        </label>
        <input
          type="text"
          value={slide.background ?? ""}
          onChange={(e) => updateSlideBackground(activeSlideIndex, e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50"
          placeholder="#1a1a2e or https://..."
        />

        {/* Per-slide transition */}
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mt-4 mb-1">
          Slide Transition Override
        </label>
        <select
          value={slide.transition ?? ""}
          onChange={(e) => {
            const val = e.target.value as RevealTransition;
            useRevealPresenterEditor.getState().updateSlideTransition(
              activeSlideIndex,
              val || ("" as RevealTransition)
            );
          }}
          className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50"
        >
          <option value="">Use global transition</option>
          {REVEAL_TRANSITIONS.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// â”€â”€ Theme & Settings Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ThemeSettingsPanel() {
  const form = useRevealPresenterEditor((s) => s.form);
  const setTheme = useRevealPresenterEditor((s) => s.setTheme);
  const setTransition = useRevealPresenterEditor((s) => s.setTransition);
  const setTransitionSpeed = useRevealPresenterEditor((s) => s.setTransitionSpeed);
  const setControls = useRevealPresenterEditor((s) => s.setControls);
  const setProgress = useRevealPresenterEditor((s) => s.setProgress);
  const setSlideNumber = useRevealPresenterEditor((s) => s.setSlideNumber);
  const setLoop = useRevealPresenterEditor((s) => s.setLoop);
  const setAutoSlide = useRevealPresenterEditor((s) => s.setAutoSlide);
  const setTitle = useRevealPresenterEditor((s) => s.setTitle);
  const setAuthor = useRevealPresenterEditor((s) => s.setAuthor);

  return (
    <div className="flex flex-col h-full overflow-auto p-3 space-y-5">
      {/* â”€â”€ Metadata â”€â”€ */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Metadata</h3>
        <div className="space-y-2">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50"
            placeholder="Presentation title"
          />
          <input
            type="text"
            value={form.author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/50"
            placeholder="Author name"
          />
        </div>
      </section>

      {/* â”€â”€ Theme â”€â”€ */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Theme</h3>
        <div className="grid grid-cols-2 gap-2">
          {REVEAL_THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-2 rounded-lg text-left text-xs border transition-colors ${
                form.themeId === t.id
                  ? "border-primary-500 bg-primary-500/10 text-primary-300"
                  : "border-gray-200 dark:border-gray-700/50 hover:border-primary-500/30 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="block font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* â”€â”€ Transitions â”€â”€ */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Transition</h3>
        <select
          value={form.transition}
          onChange={(e) => setTransition(e.target.value as RevealTransition)}
          className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100"
        >
          {REVEAL_TRANSITIONS.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={form.transitionSpeed}
          onChange={(e) => setTransitionSpeed(e.target.value as "default" | "fast" | "slow")}
          className="w-full mt-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value="default">Default speed</option>
          <option value="fast">Fast</option>
          <option value="slow">Slow</option>
        </select>
      </section>

      {/* â”€â”€ Controls â”€â”€ */}
      <section>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Options</h3>
        <div className="space-y-2">
          {[
            { label: "Controls", value: form.controls, set: setControls },
            { label: "Progress bar", value: form.progress, set: setProgress },
            { label: "Slide numbers", value: form.slideNumber, set: setSlideNumber },
            { label: "Loop", value: form.loop, set: setLoop },
          ].map(({ label, value, set }) => (
            <label key={label} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => set(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/50"
              />
              {label}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            Auto-slide (ms):
            <input
              type="number"
              value={form.autoSlide}
              onChange={(e) => setAutoSlide(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
              min={0}
              step={1000}
            />
          </label>
        </div>
      </section>
    </div>
  );
}

// â”€â”€ Reveal.js Live Preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RevealPreview({
  deckRef,
}: {
  deckRef: React.MutableRefObject<RevealApi | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const form = useRevealPresenterEditor((s) => s.form);
  const activeSlideIndex = useRevealPresenterEditor((s) => s.activeSlideIndex);
  const setActiveSlide = useRevealPresenterEditor((s) => s.setActiveSlide);
  const [loaded, setLoaded] = useState(false);
  const initializingRef = useRef(false);

  // Build slides HTML
  const slidesHTML = useMemo(() => {
    return form.slides
      .map((slide) => {
        const attrs: string[] = [];
        if (slide.background) attrs.push(`data-background-color="${slide.background}"`);
        if (slide.backgroundImage) attrs.push(`data-background-image="${slide.backgroundImage}"`);
        if (slide.transition) attrs.push(`data-transition="${slide.transition}"`);
        const notesEl = slide.notes ? `<aside class="notes">${slide.notes}</aside>` : "";

        if (slide.children?.length) {
          const children = slide.children
            .map((c) => `<section>${c.content}${c.notes ? `<aside class="notes">${c.notes}</aside>` : ""}</section>`)
            .join("");
          return `<section${attrs.length ? " " + attrs.join(" ") : ""}><section>${slide.content}${notesEl}</section>${children}</section>`;
        }
        return `<section${attrs.length ? " " + attrs.join(" ") : ""}>${slide.content}${notesEl}</section>`;
      })
      .join("\n");
  }, [form.slides]);

  // Initialize reveal.js
  useEffect(() => {
    if (!containerRef.current || initializingRef.current) return;
    initializingRef.current = true;

    let deck: RevealApi | null = null;

    async function init() {
      const Reveal = (await import("reveal.js")).default;
      const Notes = (await import("reveal.js/plugin/notes")).default;
      const Highlight = (await import("reveal.js/plugin/highlight")).default;
      const Markdown = (await import("reveal.js/plugin/markdown")).default;
      const Math = (await import("reveal.js/plugin/math")).default;
      const Search = (await import("reveal.js/plugin/search")).default;
      const Zoom = (await import("reveal.js/plugin/zoom")).default;

      if (!containerRef.current) return;

      // Set slides HTML
      const slidesContainer = containerRef.current.querySelector(".slides");
      if (slidesContainer) {
        slidesContainer.innerHTML = slidesHTML;
      }

      deck = new Reveal(containerRef.current, {
        plugins: [Notes, Highlight, Markdown, Math, Search, Zoom],
        embedded: true,
        keyboardCondition: "focused",
        controls: form.controls,
        progress: form.progress,
        slideNumber: form.slideNumber,
        hash: false,
        loop: form.loop,
        autoSlide: form.autoSlide,
        transition: form.transition,
        transitionSpeed: form.transitionSpeed,
        width: form.width,
        height: form.height,
        margin: form.margin,
        minScale: 0.2,
        maxScale: 1.5,
      });

      await deck.initialize();

      // Sync active slide
      deck.slide(activeSlideIndex, 0);

      // Listen for slide changes
      deck.on("slidechanged", ((event: unknown) => {
        const e = event as { indexh: number; indexv: number };
        setActiveSlide(e.indexh, e.indexv);
      }) as EventListener);

      deckRef.current = deck;
      setLoaded(true);
    }

    init();

    return () => {
      if (deck) {
        try {
          deck.destroy();
        } catch {
          // ignore
        }
      }
      deckRef.current = null;
      initializingRef.current = false;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update slides when content changes (after init)
  useEffect(() => {
    if (!loaded || !deckRef.current) return;
    const slidesContainer = containerRef.current?.querySelector(".slides");
    if (slidesContainer) {
      slidesContainer.innerHTML = slidesHTML;
      deckRef.current.sync();
      // Restore position
      const store = useRevealPresenterEditor.getState();
      deckRef.current.slide(store.activeSlideIndex, store.activeVerticalIndex);
    }
  }, [slidesHTML, loaded, deckRef]);

  // Update config when settings change
  useEffect(() => {
    if (!loaded || !deckRef.current) return;
    deckRef.current.configure({
      controls: form.controls,
      progress: form.progress,
      slideNumber: form.slideNumber,
      loop: form.loop,
      autoSlide: form.autoSlide,
      transition: form.transition,
      transitionSpeed: form.transitionSpeed,
    });
  }, [
    loaded,
    form.controls,
    form.progress,
    form.slideNumber,
    form.loop,
    form.autoSlide,
    form.transition,
    form.transitionSpeed,
    deckRef,
  ]);

  // Navigate when active slide changes from sidebar
  useEffect(() => {
    if (!loaded || !deckRef.current) return;
    const indices = deckRef.current.getIndices();
    if (indices && indices.h !== activeSlideIndex) {
      deckRef.current.slide(activeSlideIndex, 0);
    }
  }, [activeSlideIndex, loaded, deckRef]);

  return (
    <div className="reveal-presenter-wrapper h-full w-full relative overflow-hidden bg-gray-950">
      {/* Theme stylesheet -- loaded dynamically */}
      <RevealThemeLoader themeId={form.themeId} />

      <div
        ref={containerRef}
        className="reveal h-full w-full"
      >
        <div className="slides" />
      </div>

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-10">
          <div className="text-gray-400 text-sm animate-pulse">Loading reveal.js...</div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Theme CSS Loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RevealThemeLoader({ themeId }: { themeId: RevealThemeId }) {
  useEffect(() => {
    // Remove any previous reveal theme link
    const existing = document.querySelector('link[data-reveal-theme]');
    if (existing) existing.remove();

    // Create new link element
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.setAttribute("data-reveal-theme", themeId);
    // Use the npm package path directly -- Next.js resolves this
    // Fallback to CDN for reliable loading
    link.href = `https://cdn.jsdelivr.net/npm/reveal.js@6/dist/theme/${themeId}.css`;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [themeId]);

  return null;
}

// â”€â”€ Fullscreen Presenter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FullscreenPresenter({
  onExit,
}: {
  onExit: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const localDeckRef = useRef<RevealApi | null>(null);
  const form = useRevealPresenterEditor((s) => s.form);
  const activeSlideIndex = useRevealPresenterEditor((s) => s.activeSlideIndex);

  const slidesHTML = useMemo(() => {
    return form.slides
      .map((slide) => {
        const attrs: string[] = [];
        if (slide.background) attrs.push(`data-background-color="${slide.background}"`);
        if (slide.backgroundImage) attrs.push(`data-background-image="${slide.backgroundImage}"`);
        if (slide.transition) attrs.push(`data-transition="${slide.transition}"`);
        const notesEl = slide.notes ? `<aside class="notes">${slide.notes}</aside>` : "";
        if (slide.children?.length) {
          const children = slide.children
            .map((c) => `<section>${c.content}${c.notes ? `<aside class="notes">${c.notes}</aside>` : ""}</section>`)
            .join("");
          return `<section${attrs.length ? " " + attrs.join(" ") : ""}><section>${slide.content}${notesEl}</section>${children}</section>`;
        }
        return `<section${attrs.length ? " " + attrs.join(" ") : ""}>${slide.content}${notesEl}</section>`;
      })
      .join("\n");
  }, [form.slides]);

  useEffect(() => {
    if (!containerRef.current) return;

    let deck: RevealApi | null = null;

    async function init() {
      const Reveal = (await import("reveal.js")).default;
      const Notes = (await import("reveal.js/plugin/notes")).default;
      const Highlight = (await import("reveal.js/plugin/highlight")).default;
      const Math = (await import("reveal.js/plugin/math")).default;

      if (!containerRef.current) return;

      const slidesContainer = containerRef.current.querySelector(".slides");
      if (slidesContainer) {
        slidesContainer.innerHTML = slidesHTML;
      }

      deck = new Reveal(containerRef.current, {
        plugins: [Notes, Highlight, Math],
        controls: form.controls,
        progress: form.progress,
        slideNumber: form.slideNumber,
        hash: false,
        loop: form.loop,
        autoSlide: form.autoSlide,
        transition: form.transition,
        transitionSpeed: form.transitionSpeed,
        width: form.width,
        height: form.height,
        margin: form.margin,
      });

      await deck.initialize();
      deck.slide(activeSlideIndex, 0);
      localDeckRef.current = deck;

      // Try to go fullscreen
      try {
        await containerRef.current.requestFullscreen();
      } catch {
        // If fullscreen denied, still show the presentation
      }
    }

    init();

    // Escape key handler
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onExit();
      }
    }
    window.addEventListener("keydown", handleKey);

    // Fullscreen exit handler
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        onExit();
      }
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (deck) {
        try { deck.destroy(); } catch { /* ignore */ }
      }
      localDeckRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-9999 bg-black reveal-presenter-wrapper">
      <RevealThemeLoader themeId={form.themeId} />
      <div ref={containerRef} className="reveal h-full w-full">
        <div className="slides" />
      </div>
    </div>
  );
}

// â”€â”€ Overview Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OverviewGrid({ onClose }: { onClose: () => void }) {
  const slides = useRevealPresenterEditor((s) => s.form.slides);
  const activeSlideIndex = useRevealPresenterEditor((s) => s.activeSlideIndex);
  const setActiveSlide = useRevealPresenterEditor((s) => s.setActiveSlide);

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/95 overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Slide Overview</h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm"
          >
            Close (Esc)
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => {
                setActiveSlide(i);
                onClose();
              }}
              className={`relative aspect-video p-3 rounded-lg border text-left text-[8px] text-gray-300 overflow-hidden transition-all ${
                i === activeSlideIndex
                  ? "border-primary-500 bg-gray-800 ring-2 ring-primary-500/30"
                  : "border-gray-700 bg-gray-900 hover:border-gray-500"
              }`}
            >
              <span className="absolute top-1 left-2 text-[10px] text-gray-500 font-mono">
                {i + 1}
              </span>
              <div
                className="mt-3 leading-tight"
                dangerouslySetInnerHTML={{
                  __html: slide.content
                    .replace(/<h1/g, '<h1 style="font-size:12px;margin:0"')
                    .replace(/<h2/g, '<h2 style="font-size:10px;margin:0"')
                    .replace(/<h3/g, '<h3 style="font-size:9px;margin:0"')
                    .replace(/<p/g, '<p style="font-size:8px;margin:2px 0"')
                    .replace(/<li/g, '<li style="font-size:8px;margin:1px 0"'),
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN WORKSPACE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export default function RevealPresenterWorkspace() {
  const phase = useRevealPresenterEditor((s) => s.phase);
  const form = useRevealPresenterEditor((s) => s.form);
  const slides = useRevealPresenterEditor((s) => s.form.slides);
  const activeSlideIndex = useRevealPresenterEditor((s) => s.activeSlideIndex);
  const setActiveSlide = useRevealPresenterEditor((s) => s.setActiveSlide);
  const addSlide = useRevealPresenterEditor((s) => s.addSlide);
  const deleteSlide = useRevealPresenterEditor((s) => s.deleteSlide);
  const duplicateSlide = useRevealPresenterEditor((s) => s.duplicateSlide);
  const moveSlide = useRevealPresenterEditor((s) => s.moveSlide);
  const setPresenting = useRevealPresenterEditor((s) => s.setPresenting);
  const isPresenting = useRevealPresenterEditor((s) => s.isPresenting);
  const generateHTML = useRevealPresenterEditor((s) => s.generateHTML);

  const { undo, redo } = useRevealUndo();

  const deckRef = useRef<RevealApi | null>(null);
  const [leftTab, setLeftTab] = useState<"slides" | "settings">("slides");
  const [showOverview, setShowOverview] = useState(false);

  // â”€â”€ Chiko AI integration â”€â”€
  useChikoActions(
    useCallback(() => createRevealPresenterManifest(), [])
  );

  // â”€â”€ Keyboard shortcuts â”€â”€
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Only when NOT in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      if (e.key === "F5" || (e.key === "f" && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        setPresenting(true);
      }
      if (e.key === "o" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowOverview((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo, setPresenting]);

  // â”€â”€ Workspace dirty event â”€â”€
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("workspace:dirty"));
  }, [form]);

  // â”€â”€ Export HTML â”€â”€
  const handleExport = useCallback(() => {
    const html = generateHTML();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "presentation"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generateHTML, form.title]);

  // â”€â”€ Prompt phase â”€â”€
  if (phase === "prompt") {
    return (
      <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950">
        <PromptPhase />
      </div>
    );
  }

  // â”€â”€ Editor phase â”€â”€
  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* â”€â”€ Top toolbar â”€â”€ */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
        {/* Left: tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLeftTab("slides")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              leftTab === "slides"
                ? "bg-primary-500/15 text-primary-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
            }`}
          >
            Slides
          </button>
          <button
            onClick={() => setLeftTab("settings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              leftTab === "settings"
                ? "bg-primary-500/15 text-primary-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
            }`}
          >
            Theme & Settings
          </button>
        </div>

        <div className="flex-1" />

        {/* Center info */}
        <span className="text-xs text-gray-500">
          {slides.length} slide{slides.length !== 1 ? "s" : ""} Â· {form.themeId} Â· {form.transition}
        </span>

        <div className="flex-1" />

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => undo()}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon />
          </button>
          <button
            onClick={() => redo()}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            title="Redo (Ctrl+Y)"
          >
            <RedoIcon />
          </button>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <button
            onClick={() => setShowOverview(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            title="Overview (O)"
          >
            <GridIcon />
          </button>
          <button
            onClick={() => setPresenting(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-gray-900 text-xs font-semibold transition-colors"
            title="Present (F5)"
          >
            <PlayIcon /> Present
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium transition-colors"
            title="Export HTML"
          >
            <DownloadIcon /> Export
          </button>
        </div>
      </div>

      {/* â”€â”€ Main content area â”€â”€ */}
      <div className="flex-1 flex overflow-hidden">
        {/* â”€â”€ Left panel â”€â”€ */}
        <div className="w-64 xl:w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 overflow-hidden flex flex-col">
          {leftTab === "slides" ? (
            <>
              {/* Slide list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {slides.map((slide, i) => (
                  <SlideThumbnail
                    key={slide.id}
                    slide={slide}
                    index={i}
                    isActive={i === activeSlideIndex}
                    onClick={() => setActiveSlide(i)}
                    onDelete={() => deleteSlide(i)}
                    onDuplicate={() => duplicateSlide(i)}
                    onMoveUp={() => moveSlide(i, i - 1)}
                    onMoveDown={() => moveSlide(i, i + 1)}
                    total={slides.length}
                  />
                ))}
              </div>
              {/* Add slide button */}
              <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => addSlide(undefined, undefined, activeSlideIndex)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-primary-400 hover:border-primary-500/50 text-xs transition-colors"
                >
                  <PlusIcon /> Add Slide
                </button>
              </div>
            </>
          ) : (
            <ThemeSettingsPanel />
          )}
        </div>

        {/* â”€â”€ Center: Reveal.js Preview â”€â”€ */}
        <div className="flex-1 overflow-hidden">
          <RevealPreview deckRef={deckRef} />
        </div>

        {/* â”€â”€ Right panel: Slide Editor â”€â”€ */}
        <div className="w-72 xl:w-80 shrink-0 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Slide {activeSlideIndex + 1} of {slides.length}
            </h3>
          </div>
          <SlideEditorPanel />
        </div>
      </div>

      {/* â”€â”€ Bottom bar â”€â”€ */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Prev/Next */}
          <button
            onClick={() => deckRef.current?.prev()}
            disabled={activeSlideIndex === 0}
            className="p-1 rounded hover:bg-gray-800/50 disabled:opacity-30"
          >
            <ChevronLeftIcon />
          </button>
          <span>
            Slide {activeSlideIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => deckRef.current?.next()}
            disabled={activeSlideIndex === slides.length - 1}
            className="p-1 rounded hover:bg-gray-800/50 disabled:opacity-30"
          >
            <ChevronRightIcon />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span>F5 = Present Â· O = Overview Â· Ctrl+Z/Y = Undo/Redo</span>
        </div>
      </div>

      {/* â”€â”€ Fullscreen presenter overlay â”€â”€ */}
      {isPresenting && (
        <FullscreenPresenter
          onExit={() => setPresenting(false)}
        />
      )}

      {/* â”€â”€ Overview grid overlay â”€â”€ */}
      {showOverview && (
        <OverviewGrid onClose={() => setShowOverview(false)} />
      )}
    </div>
  );
}
