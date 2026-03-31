"use client";

// =============================================================================
// DMSuite — Slidev Navigator Panel (slide thumbnails + notes)
// =============================================================================

import React from "react";
import type { SlidevSlide } from "@/lib/slidev/parser";
import type { SlidevTheme } from "@/lib/slidev/themes";
import SlidevSlideRenderer from "./SlidevSlideRenderer";
import {
  IconButton,
  SectionLabel,
} from "@/components/workspaces/shared/WorkspaceUIKit";

const PlusIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

interface SlidevNavigatorPanelProps {
  slides: SlidevSlide[];
  activeSlideIndex: number;
  theme: SlidevTheme;
  aspectRatio: "16:9" | "4:3" | "16:10";
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
  onDuplicateSlide: (index: number) => void;
  onMoveSlide: (from: number, direction: "up" | "down") => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function SlidevNavigatorPanel({
  slides,
  activeSlideIndex,
  theme,
  aspectRatio,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
  onMoveSlide,
  notes,
  onNotesChange,
}: SlidevNavigatorPanelProps) {
  const thumbWidth = 180;
  const arNum =
    aspectRatio === "4:3" ? 4 / 3 : aspectRatio === "16:10" ? 16 / 10 : 16 / 9;
  const thumbHeight = thumbWidth / arNum;
  const slideW = aspectRatio === "4:3" ? 960 : 960;
  const thumbScale = thumbWidth / slideW;

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* ── Slides label ───────────────────── */}
      <div className="flex items-center justify-between px-1">
        <SectionLabel>Slides ({slides.length})</SectionLabel>
        <IconButton
          icon={PlusIcon}
          tooltip="Add Slide"
          onClick={onAddSlide}
        />
      </div>

      {/* ── Thumbnails scroll ─────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 pr-1 custom-scrollbar">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`group relative rounded-lg cursor-pointer transition-all border-2 ${
              i === activeSlideIndex
                ? "border-primary-500 ring-1 ring-primary-500/30"
                : "border-transparent hover:border-gray-600"
            }`}
            onClick={() => onSelectSlide(i)}
          >
            {/* Slide number */}
            <div
              className="absolute top-1 left-1 z-10 text-[10px] font-bold rounded px-1.5 py-0.5"
              style={{
                background: i === activeSlideIndex ? theme.accent : "rgba(0,0,0,0.5)",
                color: i === activeSlideIndex ? (theme.isDark ? "#000" : "#fff") : "#fff",
              }}
            >
              {i + 1}
            </div>

            {/* Thumbnail actions */}
            <div className="absolute top-1 right-1 z-10 hidden group-hover:flex gap-0.5">
              {i > 0 && (
                <button
                  className="p-0.5 rounded bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSlide(i, "up");
                  }}
                  title="Move up"
                >
                  ↑
                </button>
              )}
              {i < slides.length - 1 && (
                <button
                  className="p-0.5 rounded bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveSlide(i, "down");
                  }}
                  title="Move down"
                >
                  ↓
                </button>
              )}
              <button
                className="p-0.5 rounded bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateSlide(i);
                }}
                title="Duplicate"
              >
                ⊕
              </button>
              {slides.length > 1 && (
                <button
                  className="p-0.5 rounded bg-gray-800/80 hover:bg-red-700 text-gray-300 hover:text-white text-[10px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSlide(i);
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Layout badge */}
            <div className="absolute bottom-1 right-1 z-10 text-[9px] text-gray-400 bg-gray-900/70 px-1 rounded">
              {slide.layout}
            </div>

            {/* Thumbnail render */}
            <div
              className="overflow-hidden rounded-md"
              style={{
                width: thumbWidth,
                height: thumbHeight,
              }}
            >
              <SlidevSlideRenderer
                slide={slide}
                theme={theme}
                scale={thumbScale}
                isThumbnail
                aspectRatio={aspectRatio}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Speaker notes ─────────────────── */}
      <div className="border-t border-gray-700 pt-2">
        <SectionLabel>Speaker Notes</SectionLabel>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add speaker notes for this slide..."
          className="w-full mt-1 p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs resize-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder-gray-500"
          rows={4}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
