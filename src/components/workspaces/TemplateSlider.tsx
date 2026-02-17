"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";

// =============================================================================
// DMSuite — Visual Template Slider
// Horizontal scrollable visual template preview component.
// Professional-grade template selection with thumbnails, hover preview,
// and smooth scrolling navigation.
// =============================================================================

export interface TemplatePreview {
  id: string;
  label: string;
  /** Render the template thumbnail onto a canvas context */
  render: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

interface TemplateSliderProps {
  templates: TemplatePreview[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Thumbnail dimensions — default 140×100 */
  thumbWidth?: number;
  thumbHeight?: number;
  /** Label for the section */
  label?: string;
  className?: string;
}

export default function TemplateSlider({
  templates,
  activeId,
  onSelect,
  thumbWidth = 140,
  thumbHeight = 100,
  label = "Templates",
  className = "",
}: TemplateSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const [canScroll, setCanScroll] = useState({ left: false, right: false });

  // ── Render all thumbnails ─────────────────────────────
  useEffect(() => {
    templates.forEach((tpl) => {
      const canvas = canvasRefs.current.get(tpl.id);
      if (!canvas) return;
      canvas.width = thumbWidth * 2; // 2x for retina
      canvas.height = thumbHeight * 2;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.clearRect(0, 0, thumbWidth, thumbHeight);
      try {
        tpl.render(ctx, thumbWidth, thumbHeight);
      } catch {
        // Fallback: show template name
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, thumbWidth, thumbHeight);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(tpl.label, thumbWidth / 2, thumbHeight / 2 + 4);
      }
    });
  }, [templates, thumbWidth, thumbHeight]);

  // ── Scroll state check ────────────────────────────────
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScroll({
      left: el.scrollLeft > 2,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 2,
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollState, { passive: true });
      const ro = new ResizeObserver(updateScrollState);
      ro.observe(el);
      return () => {
        el.removeEventListener("scroll", updateScrollState);
        ro.disconnect();
      };
    }
  }, [updateScrollState, templates.length]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = thumbWidth * 2.5;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const setCanvasRef = useCallback((id: string, el: HTMLCanvasElement | null) => {
    if (el) canvasRefs.current.set(id, el);
    else canvasRefs.current.delete(id);
  }, []);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll("left")}
            disabled={!canScroll.left}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll templates left"
          >
            <IconChevronLeft className="size-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScroll.right}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll templates right"
          >
            <IconChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable template strip */}
      <div className="relative">
        {/* Fade edges */}
        {canScroll.left && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-gray-900 to-transparent z-10 pointer-events-none rounded-l-xl" />
        )}
        {canScroll.right && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-gray-900 to-transparent z-10 pointer-events-none rounded-r-xl" />
        )}

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl.id)}
              className={`group relative shrink-0 rounded-lg overflow-hidden transition-all duration-200 ${
                activeId === tpl.id
                  ? "ring-2 ring-primary-500 ring-offset-1 ring-offset-gray-900 scale-105"
                  : "ring-1 ring-gray-700 hover:ring-gray-500 hover:scale-102"
              }`}
              style={{ width: thumbWidth, height: thumbHeight }}
              title={tpl.label}
            >
              <canvas
                ref={(el) => setCanvasRef(tpl.id, el)}
                style={{ width: thumbWidth, height: thumbHeight }}
                className="block"
              />

              {/* Hover overlay with label */}
              <div className={`absolute inset-0 flex items-end justify-center transition-opacity ${
                activeId === tpl.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}>
                <div className="w-full bg-linear-to-t from-black/80 to-transparent px-2 py-1.5">
                  <p className="text-[10px] font-semibold text-white text-center truncate">
                    {tpl.label}
                  </p>
                </div>
              </div>

              {/* Active indicator */}
              {activeId === tpl.id && (
                <div className="absolute top-1 right-1 size-4 rounded-full bg-primary-500 flex items-center justify-center">
                  <svg className="size-2.5 text-gray-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
