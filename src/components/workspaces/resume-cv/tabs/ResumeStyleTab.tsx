// =============================================================================
// DMSuite — Resume Style Tab
// Visual design controls. Mirrors Contract's Style tab pattern:
// cover design, templates, accent color, font pairings, header style.
// All controls flat (no accordion), matching the direct control layout.
// =============================================================================

"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import {
  ACCENT_COLORS,
  FONT_PAIRINGS,
} from "@/lib/resume/schema";
import { TEMPLATES } from "@/lib/resume/templates/templates";
import { TemplateThumbnail } from "../editor/TemplateCarousel";
import type { TemplateId } from "@/lib/resume/schema";

// ── Inline SVG Icons ──

function IconChevronLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ── Section heading ──

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-800/60 pb-1.5 mb-3">
      {children}
    </h3>
  );
}

// =============================================================================
// Template Strip
// =============================================================================

function TemplateStrip() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const resume = useResumeEditor((s) => s.resume);
  const changeTemplate = useResumeEditor((s) => s.changeTemplate);
  const activeTemplateId = resume.metadata.template;
  const accentColor = resume.metadata.design.primaryColor;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const THUMB_W = 96;
  const THUMB_H = 128;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeIdx = TEMPLATES.findIndex((t) => t.id === activeTemplateId);
    if (activeIdx >= 0) {
      const scrollTo = activeIdx * (THUMB_W + 8) - el.clientWidth / 2 + THUMB_W / 2;
      el.scrollTo({ left: Math.max(0, scrollTo), behavior: "smooth" });
    }
  }, [activeTemplateId]);

  const scrollBy = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -(THUMB_W + 8) * 2 : (THUMB_W + 8) * 2,
      behavior: "smooth",
    });
  }, []);

  const handleClick = useCallback(
    (id: TemplateId) => {
      changeTemplate(id);
    },
    [changeTemplate]
  );

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scrollBy("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-gray-800/90 border border-gray-700/50 p-1 text-gray-300 hover:text-white hover:bg-gray-700 shadow-md transition-all"
        >
          <IconChevronLeft />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scrollBy("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full bg-gray-800/90 border border-gray-700/50 p-1 text-gray-300 hover:text-white hover:bg-gray-700 shadow-md transition-all"
        >
          <IconChevronRight />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-1 py-1 scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {TEMPLATES.map((tmpl) => (
          <TemplateThumbnail
            key={tmpl.id}
            template={tmpl}
            isActive={activeTemplateId === tmpl.id}
            accentColor={accentColor}
            onClick={() => handleClick(tmpl.id)}
            thumbWidth={THUMB_W}
            thumbHeight={THUMB_H}
          />
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
        <span className="text-[10px] font-medium text-gray-400">
          {TEMPLATES.find((t) => t.id === activeTemplateId)?.name ?? "Modern"}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function ResumeStyleTab() {
  const resume = useResumeEditor((s) => s.resume);
  const setAccentColor = useResumeEditor((s) => s.setAccentColor);
  const setFontPairing = useResumeEditor((s) => s.setFontPairing);
  const activePairing = resume.metadata.typography.fontPairing;

  return (
    <div className="space-y-5 p-4">
      {/* ── Templates ── */}
      <div>
        <SectionHeading>Template</SectionHeading>
        <TemplateStrip />
      </div>

      {/* ── Accent Color ── */}
      <div>
        <SectionHeading>Accent Color</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map(({ name, value }) => (
            <button
              key={name}
              onClick={() => setAccentColor(value)}
              title={name}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                resume.metadata.design.primaryColor === value
                  ? "border-white scale-110 shadow-lg"
                  : "border-transparent hover:border-gray-500 hover:scale-105"
              }`}
              style={{ backgroundColor: value }}
            />
          ))}
        </div>
      </div>

      {/* ── Font Pairing ── */}
      <div>
        <SectionHeading>Font Pairing</SectionHeading>
        <div className="space-y-1.5">
          {Object.entries(FONT_PAIRINGS).map(
            ([id, { heading, body, label }]) => {
              const isActive = activePairing === id;
              return (
                <button
                  key={id}
                  onClick={() => setFontPairing(id)}
                  className={`flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-left transition-all ${
                    isActive
                      ? "border-primary-500/60 bg-primary-500/10 ring-1 ring-primary-500/20"
                      : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span
                      className="block text-xs font-semibold text-gray-200 leading-tight truncate"
                      style={{ fontFamily: heading }}
                    >
                      {label}
                    </span>
                    <span
                      className="block text-[10px] text-gray-500 mt-0.5 leading-tight truncate"
                      style={{ fontFamily: body }}
                    >
                      Heading &amp; Body preview
                    </span>
                  </div>
                  {isActive && (
                    <IconCheck className="shrink-0 text-primary-400" />
                  )}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* ── Font Size ── */}
      <div>
        <SectionHeading>Font Size</SectionHeading>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Global scale</span>
            <span className="text-xs font-mono text-gray-300">
              {resume.metadata.typography.fontScale === "compact"
                ? "-1"
                : resume.metadata.typography.fontScale === "spacious"
                  ? "+1"
                  : "0"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["compact", "standard", "spacious"] as const).map((scale) => (
              <ResumeScaleButton
                key={scale}
                label={
                  scale === "compact"
                    ? "Smaller"
                    : scale === "spacious"
                      ? "Larger"
                      : "Default"
                }
                isActive={resume.metadata.typography.fontScale === scale}
                onClick={() =>
                  useResumeEditor
                    .getState()
                    .updateResume((d) => {
                      d.metadata.typography.fontScale = scale;
                    })
                }
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-600">
            Scales all heading and body text uniformly
          </p>
        </div>
      </div>
    </div>
  );
}

function ResumeScaleButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border py-1.5 text-xs font-medium transition-all ${
        isActive
          ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
          : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
      }`}
    >
      {label}
    </button>
  );
}
