// =============================================================================
// DMSuite — Resume Editor Right Panel: Design Controls
// Single-purpose design panel with accordion sections, visual template
// thumbnails, accent colors, compact font dropdown, page format, and spacing.
// Only one section open at a time for a clean, compact UI.
// =============================================================================

"use client";

import { useRef, useState, useCallback, useEffect } from "react";
// useEffect used by TemplateStrip scroll state
import { motion, AnimatePresence } from "framer-motion";
import { useResumeEditor } from "@/stores/resume-editor";
import { ACCENT_COLORS, FONT_PAIRINGS, PAGE_FORMAT_LABELS, type PageFormat } from "@/lib/resume/schema";
import { TEMPLATES } from "@/lib/resume/templates/templates";
import { TemplateThumbnail } from "./TemplateCarousel";
import type { TemplateId } from "@/lib/resume/schema";

// ── Inline SVG Icons ──

function IconPalette({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" />
      <circle cx="6.5" cy="13.5" r="2.5" />
      <circle cx="17.5" cy="13.5" r="2.5" />
      <circle cx="13.5" cy="20.5" r="2.5" />
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
    </svg>
  );
}

function IconPanelRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

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

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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

// ---------------------------------------------------------------------------
// Accordion Section — shared by all design control groups
// ---------------------------------------------------------------------------

type DesignSectionId = "template" | "accent" | "fonts" | "fontsize" | "format" | "spacing";

function DesignAccordion({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: {
  id: DesignSectionId;
  title: string;
  isOpen: boolean;
  onToggle: (id: DesignSectionId) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-800/50">
      <button
        onClick={() => onToggle(id)}
        className="flex items-center justify-between w-full py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors"
      >
        <span>{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <IconChevronDown className="text-gray-600" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Strip — horizontal scrollable visual thumbnails
// ---------------------------------------------------------------------------

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
    el.scrollBy({ left: dir === "left" ? -(THUMB_W + 8) * 2 : (THUMB_W + 8) * 2, behavior: "smooth" });
  }, []);

  const handleClick = useCallback((id: TemplateId) => {
    changeTemplate(id);
  }, [changeTemplate]);

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

// ---------------------------------------------------------------------------
// Font Pairing List — shown directly inside the accordion section
// ---------------------------------------------------------------------------

function FontPairingList() {
  const resume = useResumeEditor((s) => s.resume);
  const setFontPairing = useResumeEditor((s) => s.setFontPairing);
  const activePairing = resume.metadata.typography.fontPairing;

  return (
    <div className="space-y-1.5">
      {Object.entries(FONT_PAIRINGS).map(([id, { heading, body, label }]) => {
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
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Design Controls — accordion wrapper for all sections
// ---------------------------------------------------------------------------

function DesignControls() {
  const resume = useResumeEditor((s) => s.resume);
  const setAccentColor = useResumeEditor((s) => s.setAccentColor);
  const updateResume = useResumeEditor((s) => s.updateResume);

  // ── Accordion state — only one section open at a time ──
  const [openSection, setOpenSection] = useState<DesignSectionId | null>("template");

  const handleToggle = useCallback((id: DesignSectionId) => {
    setOpenSection((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div>
      {/* ── Template ── */}
      <DesignAccordion
        id="template"
        title="Template"
        isOpen={openSection === "template"}
        onToggle={handleToggle}
      >
        <TemplateStrip />
      </DesignAccordion>

      {/* ── Accent Color ── */}
      <DesignAccordion
        id="accent"
        title="Accent Color"
        isOpen={openSection === "accent"}
        onToggle={handleToggle}
      >
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map(({ name, value }) => (
            <button
              key={name}
              onClick={() => setAccentColor(value)}
              title={name}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                resume.metadata.design.primaryColor === value
                  ? "border-white scale-110"
                  : "border-transparent hover:border-gray-500"
              }`}
              style={{ backgroundColor: value }}
            />
          ))}
        </div>
      </DesignAccordion>

      {/* ── Font Pairing ── */}
      <DesignAccordion
        id="fonts"
        title="Font Pairing"
        isOpen={openSection === "fonts"}
        onToggle={handleToggle}
      >
        <FontPairingList />
      </DesignAccordion>

      {/* ── Font Size ── */}
      <DesignAccordion
        id="fontsize"
        title="Font Size"
        isOpen={openSection === "fontsize"}
        onToggle={handleToggle}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Global scale</span>
            <span className="text-xs font-mono text-gray-300">
              {resume.metadata.typography.fontScale === "compact" ? "-1" : resume.metadata.typography.fontScale === "spacious" ? "+1" : "0"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(["compact", "standard", "spacious"] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => updateResume((d) => { d.metadata.typography.fontScale = scale; })}
                className={`rounded-md border py-1.5 text-xs transition-all capitalize ${
                  resume.metadata.typography.fontScale === scale
                    ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                    : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                }`}
              >
                {scale === "compact" ? "Smaller" : scale === "spacious" ? "Larger" : "Default"}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-600">Scales all heading and body text uniformly</p>
        </div>
      </DesignAccordion>

      {/* ── Page Format ── */}
      <DesignAccordion
        id="format"
        title="Page Format"
        isOpen={openSection === "format"}
        onToggle={handleToggle}
      >
        <div className="space-y-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide">Print</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(PAGE_FORMAT_LABELS) as [PageFormat, { label: string; group: string }][])
              .filter(([, meta]) => meta.group === "print")
              .map(([fmt, meta]) => (
                <button
                  key={fmt}
                  onClick={() => updateResume((d) => { d.metadata.page.format = fmt; })}
                  className={`rounded-md border py-1.5 text-xs font-medium transition-all ${
                    resume.metadata.page.format === fmt
                      ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                      : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
          </div>
          <p className="text-[10px] text-gray-600 uppercase tracking-wide mt-2">Web &amp; Social</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(PAGE_FORMAT_LABELS) as [PageFormat, { label: string; group: string }][])
              .filter(([, meta]) => meta.group === "web")
              .map(([fmt, meta]) => (
                <button
                  key={fmt}
                  onClick={() => updateResume((d) => { d.metadata.page.format = fmt; })}
                  className={`rounded-md border py-1.5 text-xs font-medium transition-all ${
                    resume.metadata.page.format === fmt
                      ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                      : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
          </div>
        </div>
      </DesignAccordion>

      {/* ── Spacing ── */}
      <DesignAccordion
        id="spacing"
        title="Spacing"
        isOpen={openSection === "spacing"}
        onToggle={handleToggle}
      >
        <div className="grid grid-cols-3 gap-2">
          {(["compact", "standard", "relaxed"] as const).map((sp) => (
            <button
              key={sp}
              onClick={() => updateResume((d) => { d.metadata.page.sectionSpacing = sp; })}
              className={`rounded-md border py-1.5 text-xs transition-all capitalize ${
                resume.metadata.page.sectionSpacing === sp
                  ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                  : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
              }`}
            >
              {sp}
            </button>
          ))}
        </div>
      </DesignAccordion>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel Component
// ---------------------------------------------------------------------------

export default function EditorDesignPanel({ onCollapse }: { onCollapse?: () => void }) {
  return (
    <div className="h-full flex flex-col bg-gray-900/60 border-l border-gray-800/40">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/50">
        <div className="flex items-center gap-1.5">
          <IconPalette className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-xs font-medium text-gray-300">Design</span>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="text-gray-600 hover:text-gray-400 transition-colors"
            title="Collapse panel"
          >
            <IconPanelRight />
          </button>
        )}
      </div>

      {/* Scrollable design controls */}
      <div className="flex-1 overflow-y-auto">
        <DesignControls />
      </div>
    </div>
  );
}
