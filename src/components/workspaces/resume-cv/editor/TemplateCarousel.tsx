// =============================================================================
// DMSuite — Visual Template Carousel
// Horizontal scrollable carousel showing live mini-previews of each template.
// Users can instantly switch templates — content is preserved, only layout changes.
// =============================================================================

"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeEditor } from "@/stores/resume-editor";
import type { TemplateId } from "@/lib/resume/schema";
import { TEMPLATES, type TemplateMetadata } from "@/lib/resume/templates/templates";

// ── Inline SVG Icons ──

function IconChevronLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconChevronRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mini template preview thumbnail — shows a simplified visual of each template
// ---------------------------------------------------------------------------

const THUMB_WIDTH = 120;
const THUMB_HEIGHT = 160;

interface TemplateThumbnailProps {
  template: TemplateMetadata;
  isActive: boolean;
  accentColor: string;
  onClick: () => void;
  /** Override thumbnail width (default 120) */
  thumbWidth?: number;
  /** Override thumbnail height (default 160) */
  thumbHeight?: number;
}

export function TemplateThumbnail({ template, isActive, accentColor, onClick, thumbWidth = THUMB_WIDTH, thumbHeight = THUMB_HEIGHT }: TemplateThumbnailProps) {
  // Build a schematic representation based on template structure
  const hasSidebar = template.sidebarPosition !== "none";
  const sidebarOnLeft = template.sidebarPosition === "left";
  const sidebarW = hasSidebar ? template.defaultSidebarWidth : 0;
  const isPro = template.isPro;
  const accent = template.accentPreview ?? accentColor;
  const isDark = template.isDark ?? false;

  // Background colors for the thumbnail schematic
  const thumbBg = isDark ? "#0F0F0F" : "#FFFFFF";
  const lineLight = isDark ? "#2A2A2A" : "#e5e7eb";
  const lineMedium = isDark ? "#3A3A3A" : "#d1d5db";
  const lineDark = isDark ? "#CCCCCC" : "#1a1a2e";
  const lineSubtle = isDark ? "#222222" : "#374151";

  return (
    <button
      onClick={onClick}
      className={`group relative shrink-0 rounded-lg border-2 transition-all duration-200 overflow-hidden ${
        isActive
          ? "border-primary-500 ring-2 ring-primary-500/30 scale-105"
          : "border-gray-700/60 hover:border-gray-500 hover:scale-[1.02]"
      }`}
      style={{ width: thumbWidth, height: thumbHeight }}
      title={`${template.name} — ${template.description}`}
    >
      {/* Mini schematic preview */}
      <div className="absolute inset-0 p-2 flex flex-col" style={{ backgroundColor: thumbBg }}>
        {/* Header area */}
        <div
          className={`mb-1.5 ${
            isPro && template.sidebarPosition === "none"
              ? "text-center"
              : ""
          }`}
        >
          {/* Name line */}
          <div
            className="rounded-sm"
            style={{
              height: 6,
              width: template.sidebarPosition === "none" ? "60%" : "55%",
              backgroundColor: lineDark,
              margin: template.sidebarPosition === "none" ? "0 auto" : undefined,
            }}
          />
          {/* Subtitle line */}
          <div
            className="rounded-sm mt-0.5"
            style={{
              height: 3,
              width: template.sidebarPosition === "none" ? "40%" : "35%",
              backgroundColor: accent,
              margin: template.sidebarPosition === "none" ? "0 auto" : undefined,
            }}
          />
          {/* Contact dots */}
          <div
            className={`flex gap-0.5 mt-1 ${
              template.sidebarPosition === "none" ? "justify-center" : ""
            }`}
          >
            {[20, 18, 22].map((w, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{ height: 2, width: w, backgroundColor: lineMedium }}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="mb-1.5"
          style={{ height: 1, backgroundColor: accent, opacity: 0.3 }}
        />

        {/* Body content */}
        <div className="flex-1 flex" style={{ gap: 4 }}>
          {/* Sidebar (left) */}
          {hasSidebar && sidebarOnLeft && (
            <div
              className="flex flex-col gap-1.5"
              style={{
                width: `${sidebarW}%`,
                flexShrink: 0,
                borderRight: `1px solid ${accent}`,
                paddingRight: 3,
                opacity: 0.9,
              }}
            >
              <SidebarLines accent={accent} lineColor={lineLight} />
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col gap-1.5">
            <ContentLines
              accent={accent}
              decoration={hasSidebar ? "bar" : "underline"}
              lineLight={lineLight}
              lineMedium={lineMedium}
              lineDark={lineSubtle}
            />
          </div>

          {/* Sidebar (right) */}
          {hasSidebar && !sidebarOnLeft && (
            <div
              className="flex flex-col gap-1.5"
              style={{
                width: `${sidebarW}%`,
                flexShrink: 0,
                borderLeft: `1px solid ${accent}`,
                paddingLeft: 3,
                opacity: 0.9,
              }}
            >
              <SidebarLines accent={accent} lineColor={lineLight} />
            </div>
          )}
        </div>
      </div>

      {/* Pro badge */}
      {isPro && (
        <div className="absolute top-1 left-1 px-1 py-0.5 rounded text-[7px] font-bold tracking-wide uppercase"
          style={{ backgroundColor: accent, color: isDark ? "#000" : "#FFF" }}
        >
          PRO
        </div>
      )}

      {/* Active indicator badge */}
      {isActive && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center shadow-lg">
          <IconCheck className="text-gray-950" />
        </div>
      )}

      {/* Hover overlay with template name */}
      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-gray-950/90 via-gray-950/60 to-transparent pt-6 pb-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-medium text-white text-center truncate">
          {template.name}
        </p>
      </div>
    </button>
  );
}

// Helper: schematic sidebar lines
export function SidebarLines({ accent, lineColor = "#e5e7eb" }: { accent: string; lineColor?: string }) {
  return (
    <>
      {/* Section heading */}
      <div>
        <div className="rounded-sm" style={{ height: 3, width: "70%", backgroundColor: accent, opacity: 0.7 }} />
        <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "90%", backgroundColor: lineColor }} />
        <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "80%", backgroundColor: lineColor }} />
        <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "60%", backgroundColor: lineColor }} />
      </div>
      <div>
        <div className="rounded-sm" style={{ height: 3, width: "60%", backgroundColor: accent, opacity: 0.7 }} />
        <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "85%", backgroundColor: lineColor }} />
        <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "70%", backgroundColor: lineColor }} />
      </div>
      <div>
        <div className="rounded-sm" style={{ height: 3, width: "55%", backgroundColor: accent, opacity: 0.7 }} />
        <div className="flex flex-wrap gap-0.5 mt-0.5">
          {[16, 20, 14, 18].map((w, i) => (
            <div key={i} className="rounded-sm" style={{ height: 5, width: w, backgroundColor: lineColor }} />
          ))}
        </div>
      </div>
    </>
  );
}

// Helper: schematic main content lines
export function ContentLines({
  accent,
  decoration,
  lineLight = "#e5e7eb",
  lineMedium = "#d1d5db",
  lineDark = "#374151",
}: {
  accent: string;
  decoration: "underline" | "bar" | "none";
  lineLight?: string;
  lineMedium?: string;
  lineDark?: string;
}) {
  return (
    <>
      {/* Section 1 — Experience-like */}
      <div>
        <div className="flex items-center gap-0.5">
          <div className="rounded-sm" style={{ height: 3, width: "45%", backgroundColor: lineDark }} />
          {decoration === "bar" && (
            <div className="rounded-sm" style={{ height: 2, width: 12, backgroundColor: accent }} />
          )}
        </div>
        {decoration === "underline" && (
          <div className="mt-0.5 rounded-sm" style={{ height: 1, width: "100%", backgroundColor: accent, opacity: 0.3 }} />
        )}
        <div className="mt-1">
          <div className="flex justify-between">
            <div className="rounded-sm" style={{ height: 3, width: "50%", backgroundColor: lineDark }} />
            <div className="rounded-sm" style={{ height: 2, width: "18%", backgroundColor: lineMedium }} />
          </div>
          <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "100%", backgroundColor: lineLight }} />
          <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "90%", backgroundColor: lineLight }} />
          <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "75%", backgroundColor: lineLight }} />
        </div>
        {/* Second entry */}
        <div className="mt-1.5">
          <div className="flex justify-between">
            <div className="rounded-sm" style={{ height: 3, width: "45%", backgroundColor: lineDark }} />
            <div className="rounded-sm" style={{ height: 2, width: "18%", backgroundColor: lineMedium }} />
          </div>
          <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "95%", backgroundColor: lineLight }} />
          <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "80%", backgroundColor: lineLight }} />
        </div>
      </div>

      {/* Section 2 — Education-like */}
      <div>
        <div className="flex items-center gap-0.5">
          <div className="rounded-sm" style={{ height: 3, width: "35%", backgroundColor: lineDark }} />
          {decoration === "bar" && (
            <div className="rounded-sm" style={{ height: 2, width: 12, backgroundColor: accent }} />
          )}
        </div>
        {decoration === "underline" && (
          <div className="mt-0.5 rounded-sm" style={{ height: 1, width: "100%", backgroundColor: accent, opacity: 0.3 }} />
        )}
        <div className="mt-1">
          <div className="rounded-sm" style={{ height: 3, width: "55%", backgroundColor: lineDark }} />
          <div className="mt-0.5 rounded-sm" style={{ height: 2, width: "40%", backgroundColor: lineMedium }} />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main TemplateCarousel Component
// ---------------------------------------------------------------------------

interface TemplateCarouselProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateCarousel({ isOpen, onClose }: TemplateCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const resume = useResumeEditor((s) => s.resume);
  const changeTemplate = useResumeEditor((s) => s.changeTemplate);
  const activeTemplateId = resume.metadata.template;
  const accentColor = resume.metadata.design.primaryColor;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Update scroll state
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
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState, isOpen]);

  // Scroll active template into view when opening
  useEffect(() => {
    if (!isOpen) return;
    const el = scrollRef.current;
    if (!el) return;
    const activeIdx = TEMPLATES.findIndex((t) => t.id === activeTemplateId);
    if (activeIdx >= 0) {
      const scrollTo = activeIdx * (THUMB_WIDTH + 12) - el.clientWidth / 2 + THUMB_WIDTH / 2;
      el.scrollTo({ left: Math.max(0, scrollTo), behavior: "smooth" });
    }
  }, [isOpen, activeTemplateId]);

  const scrollBy = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -(THUMB_WIDTH + 12) * 2 : (THUMB_WIDTH + 12) * 2;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  const handleTemplateClick = useCallback((id: TemplateId) => {
    changeTemplate(id);
  }, [changeTemplate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 350 }}
          className="absolute bottom-12 inset-x-0 z-30 bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/60 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
              <span className="text-xs font-medium text-gray-200">Choose Template</span>
              <span className="text-xs text-gray-500">
                — your content stays, only the design changes
              </span>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 transition-colors"
            >
              <IconX />
            </button>
          </div>

          {/* Carousel */}
          <div className="relative px-4 py-4">
            {/* Left arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scrollBy("left")}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-gray-800/90 border border-gray-700/60 p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 shadow-lg transition-all"
              >
                <IconChevronLeft />
              </button>
            )}

            {/* Scrollable area */}
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scrollbar-none scroll-smooth px-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {TEMPLATES.map((tmpl) => (
                <TemplateThumbnail
                  key={tmpl.id}
                  template={tmpl}
                  isActive={activeTemplateId === tmpl.id}
                  accentColor={accentColor}
                  onClick={() => handleTemplateClick(tmpl.id)}
                />
              ))}
            </div>

            {/* Right arrow */}
            {canScrollRight && (
              <button
                onClick={() => scrollBy("right")}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-gray-800/90 border border-gray-700/60 p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 shadow-lg transition-all"
              >
                <IconChevronRight />
              </button>
            )}
          </div>

          {/* Active template info */}
          <div className="px-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500" />
              <span className="text-xs font-medium text-gray-300">
                {TEMPLATES.find((t) => t.id === activeTemplateId)?.name ?? "Modern"}
              </span>
              <span className="text-xs text-gray-600">
                {TEMPLATES.find((t) => t.id === activeTemplateId)?.description ?? ""}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
