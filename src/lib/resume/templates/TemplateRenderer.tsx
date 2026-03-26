// =============================================================================
// DMSuite — Template Renderer (Orchestrator) — v8 Smart Page-Break Engine
//
// Industry-standard approach (Reactive Resume / FlowCV style):
// 1. Render ALL content in a hidden off-screen container with NO height limit
// 2. Measure the total natural height of that content
// 3. Scan the DOM for section/item boundaries to find safe break points
// 4. Calculate optimal page breaks that NEVER split:
//    - A section title from its first item (no orphan headings)
//    - An experience/education/project item mid-text
//    - A skill group or certification entry
// 5. For each page, render the full content but use CSS transform + overflow:hidden
//    to show only the correct vertical "slice", aligned to clean break points
//
// v8 improvements over v7:
// - Content-aware page breaks (no more mid-text splitting)
// - DOM scanning for section/item boundaries
// - Variable per-page Y offsets aligned to clean break points
// - "Protected zones" prevent orphan titles and split items
// - Graceful fallback to uniform stride if no breakable elements found
// - ALL sections with data auto-included (volunteer, awards, references, projects)
// - Max 8 pages safety cap
// =============================================================================

"use client";

import React, {
  useRef,
  useLayoutEffect,
  useEffect,
  useState,
  useMemo,
  useCallback,
  type CSSProperties,
} from "react";
import type { ResumeData, TemplateId, PageLayout, MarginPreset } from "@/lib/resume/schema";
import { computeCSSVariables, PAGE_DIMENSIONS } from "@/lib/resume/schema";
import { getProTemplate } from "./template-defs";
import { createProTemplateComponent } from "./UniversalTemplate";

// ---------------------------------------------------------------------------
// Template component cache
// ---------------------------------------------------------------------------

type TemplateComponentType = React.ComponentType<{
  resume: ResumeData;
  pageIndex: number;
  pageLayout: PageLayout;
}>;

const templateComponentCache = new Map<TemplateId, TemplateComponentType>();

function getTemplateComponent(id: TemplateId): TemplateComponentType {
  let cached = templateComponentCache.get(id);
  if (cached) return cached;
  cached = createProTemplateComponent(id);
  templateComponentCache.set(id, cached);
  return cached;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Page top/bottom margins (px) per margin preset — creates breathing room */
const PAGE_MARGIN_PX: Record<MarginPreset, { top: number; bottom: number }> = {
  narrow:   { top: 24, bottom: 24 },
  standard: { top: 40, bottom: 40 },
  wide:     { top: 56, bottom: 56 },
};

/** Minimum content height per page (prevents nearly-empty pages) */
const MIN_PAGE_CONTENT_PX = 150;

/** Maximum number of pages (prevents runaway rendering) */
const MAX_PAGES = 8;

/** CSS selectors for individual content items that should NOT be split */
const BREAKABLE_ITEM_SELECTORS = [
  ".exp-item", ".edu-item", ".project-item", ".cert-item",
  ".lang-item", ".skill-group", ".award-item",
  ".volunteer-item", ".reference-item", ".custom-item",
].join(",");

/** CSS selectors for section-level containers (includes sidebar sections for 2-col templates) */
const SECTION_SELECTORS = ".section, .resume-section, .sidebar-section";

/** Check if a section has at least one visible (non-hidden) item */
function hasVisibleItems(
  section: { hidden?: boolean; items?: Array<{ hidden?: boolean }> } | undefined
): boolean {
  if (!section || section.hidden) return false;
  return (section.items ?? []).some((item) => !item.hidden);
}

// ---------------------------------------------------------------------------
// Smart Page-Break Analysis
// ---------------------------------------------------------------------------

interface BreakCandidate {
  /** Y position (relative to template container top) */
  y: number;
  /** Priority: 0 = between sections (best), 1 = between items, 2 = fallback */
  priority: number;
}

/** Y-range that must not be split across pages */
interface ProtectedZone {
  top: number;
  bottom: number;
}

/**
 * Scans the measurement container's DOM to collect safe page-break positions.
 * Returns sorted array of Y positions where it is safe to break.
 */
function collectBreakCandidates(measureEl: HTMLElement): BreakCandidate[] {
  const templateEl = measureEl.querySelector("[data-template]") as HTMLElement | null;
  if (!templateEl) return [];

  const containerRect = templateEl.getBoundingClientRect();
  const candidates: BreakCandidate[] = [];
  const seen = new Set<number>();

  const add = (y: number, priority: number) => {
    const rounded = Math.round(y);
    if (rounded > 5 && !seen.has(rounded)) {
      seen.add(rounded);
      candidates.push({ y: rounded, priority });
    }
  };

  // Level 0 — Section boundaries (ideal break points)
  const sections = templateEl.querySelectorAll(SECTION_SELECTORS);
  for (const el of sections) {
    const rect = el.getBoundingClientRect();
    add(rect.top - containerRect.top, 0);
    add(rect.bottom - containerRect.top, 0);
  }

  // Level 1 — Item boundaries (acceptable break points)
  const items = templateEl.querySelectorAll(BREAKABLE_ITEM_SELECTORS);
  for (const el of items) {
    const rect = el.getBoundingClientRect();
    add(rect.top - containerRect.top, 1);
    add(rect.bottom - containerRect.top, 1);
  }

  // Level 2 — Generic children of content containers (fallback)
  if (candidates.length < 5) {
    const genericSel = [
      "[data-template] > .content > *",
      "[data-template] > .resume-body > *",
      "[data-template] > div > .main-col > *",
      "[data-template] > div > .side-col > *",
      "[data-template] > div > .sidebar > *",
      "[data-template] > div > .main > *",
      "[data-template] > * > .main-col > *",
      "[data-template] > * > .side-col > *",
    ].join(",");
    try {
      const genericEls = templateEl.querySelectorAll(genericSel);
      for (const el of genericEls) {
        const rect = el.getBoundingClientRect();
        if (rect.height > 20) {
          add(rect.top - containerRect.top, 2);
          add(rect.bottom - containerRect.top, 2);
        }
      }
    } catch { /* ignore selector errors */ }
  }

  candidates.sort((a, b) => a.y - b.y || a.priority - b.priority);
  return candidates;
}

/**
 * Collects DOM regions that should NEVER be split across pages:
 * - Each individual item (exp-item, edu-item, etc.)
 * - Section title + its first child item (prevents orphan headings)
 */
function collectProtectedZones(measureEl: HTMLElement): ProtectedZone[] {
  const templateEl = measureEl.querySelector("[data-template]") as HTMLElement | null;
  if (!templateEl) return [];

  const containerRect = templateEl.getBoundingClientRect();
  const zones: ProtectedZone[] = [];

  const relY = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top - containerRect.top), bottom: Math.round(r.bottom - containerRect.top) };
  };

  // Each individual item is protected
  const items = templateEl.querySelectorAll(BREAKABLE_ITEM_SELECTORS);
  for (const el of items) {
    const pos = relY(el);
    zones.push({ top: pos.top, bottom: pos.bottom });
  }

  // Section title + first item = protected (prevents orphan titles)
  const sections = templateEl.querySelectorAll(SECTION_SELECTORS);
  for (const section of sections) {
    const title = section.querySelector(".section-title, .section-heading, h2, h3");
    const firstItem = section.querySelector(BREAKABLE_ITEM_SELECTORS);
    if (title) {
      const tPos = relY(title);
      if (firstItem) {
        const iPos = relY(firstItem);
        zones.push({ top: tPos.top, bottom: iPos.bottom });
      } else {
        // Title with some padding for following inline content
        zones.push({ top: tPos.top, bottom: tPos.bottom + 40 });
      }
    }
  }

  return zones;
}

/**
 * Computes optimal page-break Y positions based on content analysis.
 * Returns breaks[i] = Y offset where page i starts.  breaks[0] = 0.
 */
function computeSmartPageBreaks(
  candidates: BreakCandidate[],
  protectedZones: ProtectedZone[],
  totalHeight: number,
  pageHeight: number,
  topMargin: number,
  bottomMargin: number,
): number[] {
  const page0Visible = pageHeight - bottomMargin;
  const contVisible = pageHeight - topMargin - bottomMargin;

  if (totalHeight <= page0Visible) return [0];

  // No candidates → fall back to uniform strides
  if (candidates.length === 0) {
    return uniformBreaks(totalHeight, page0Visible, contVisible);
  }

  const breaks: number[] = [0];

  /** Find the best break point at or before targetY, after minY */
  function findBest(targetY: number, minY: number): number {
    const validMin = minY + MIN_PAGE_CONTENT_PX;
    let bestY = -1;

    // Walk candidates (sorted by Y) — last valid one wins (closest to target)
    for (const c of candidates) {
      if (c.y <= validMin) continue;
      if (c.y > targetY) break;
      bestY = c.y;
    }

    if (bestY <= minY) return targetY; // no valid candidate — force break

    // Check if bestY splits a protected zone
    const split = protectedZones.find((z) => z.top < bestY && z.bottom > bestY);
    if (split) {
      // Move break BEFORE the protected zone
      const adj = split.top;
      if (adj > validMin) {
        // Verify the adjusted position doesn't split another zone
        const dbl = protectedZones.find((z) => z.top < adj && z.bottom > adj);
        if (!dbl) return adj;
        if (dbl.top > validMin) return dbl.top;
      }
      // Zone is taller than available space — allow the split
    }

    return bestY;
  }

  // First page break
  let lastY = findBest(page0Visible, 0);
  breaks.push(lastY);

  // Subsequent page breaks
  let safety = 0;
  while (lastY + contVisible < totalHeight && safety < MAX_PAGES) {
    const target = lastY + contVisible;
    const nextY = findBest(target, lastY);
    if (nextY <= lastY) {
      // No progress — force break
      breaks.push(target);
      lastY = target;
    } else {
      breaks.push(nextY);
      lastY = nextY;
    }
    safety++;
  }

  if (breaks.length > MAX_PAGES) breaks.length = MAX_PAGES;
  return breaks;
}

/** Fallback: uniform stride breaks (same as v7) */
function uniformBreaks(total: number, page0: number, cont: number): number[] {
  const b: number[] = [0];
  if (total <= page0) return b;
  let y = page0;
  b.push(y);
  let s = 0;
  while (y + cont < total && s < MAX_PAGES) { y += cont; b.push(y); s++; }
  if (b.length > MAX_PAGES) b.length = MAX_PAGES;
  return b;
}

// ---------------------------------------------------------------------------
// TemplateRenderer — main orchestrator
// ---------------------------------------------------------------------------

/** Gap between pages in px — matches ContractRenderer convention */
export const RESUME_PAGE_GAP = 16;

interface TemplateRendererProps {
  resume: ResumeData;
  className?: string;
  showOverflowWarning?: boolean;
  id?: string;
  /** Override gap between rendered pages (default 16px) */
  pageGap?: number;
  /** Fires whenever the computed page count changes */
  onPageCount?: (count: number) => void;
}

export default function TemplateRenderer({
  resume,
  className,
  showOverflowWarning = true,
  id,
  pageGap,
  onPageCount,
}: TemplateRendererProps) {
  const templateId = resume.metadata.template;
  const TemplateComponent = useMemo(
    () => getTemplateComponent(templateId),
    [templateId]
  );
  const dims = PAGE_DIMENSIONS[resume.metadata.page.format];
  const proDef = useMemo(() => getProTemplate(templateId), [templateId]);
  const margins = PAGE_MARGIN_PX[resume.metadata.page.marginPreset] ?? PAGE_MARGIN_PX.standard;

  const cssVars = useMemo(
    () => computeCSSVariables(resume.metadata),
    [resume.metadata]
  );

  const proFontLink = proDef?.googleFontUrl ?? null;

  // Collect ALL unique section IDs from layout — we always render everything
  const { allMain, allSidebar } = useMemo(() => {
    const pages = resume.metadata.layout.pages;
    return {
      allMain: [...new Set(pages.flatMap((p) => p.main))],
      allSidebar: [...new Set(pages.flatMap((p) => p.sidebar))],
    };
  }, [resume.metadata.layout.pages]);

  // ── Identify ALL sections that have actual content ──
  const sectionsWithData = useMemo(() => {
    const ids: string[] = [];
    const s = resume.sections;
    if (s.summary?.content && !s.summary.hidden) ids.push("summary");
    if (hasVisibleItems(s.experience)) ids.push("experience");
    if (hasVisibleItems(s.education)) ids.push("education");
    if (hasVisibleItems(s.skills)) ids.push("skills");
    if (hasVisibleItems(s.certifications)) ids.push("certifications");
    if (hasVisibleItems(s.languages)) ids.push("languages");
    if (hasVisibleItems(s.volunteer)) ids.push("volunteer");
    if (hasVisibleItems(s.projects)) ids.push("projects");
    if (hasVisibleItems(s.awards)) ids.push("awards");
    if (hasVisibleItems(s.references)) ids.push("references");
    // Custom sections
    for (const cs of resume.customSections ?? []) {
      if (!cs.hidden && cs.items?.length > 0) ids.push(cs.id);
    }
    return ids;
  }, [resume.sections, resume.customSections]);

  // Full page layout: layout sections + extra sections that have data but aren't in layout
  const allSectionsLayout: PageLayout = useMemo(() => {
    const extraMain = sectionsWithData.filter(
      (id) => !allMain.includes(id) && !allSidebar.includes(id)
    );
    return {
      fullWidth: allSidebar.length === 0,
      main: [...allMain, ...extraMain],
      sidebar: allSidebar,
    };
  }, [allMain, allSidebar, sectionsWithData]);

  // ── Normalize skills: flatten keyword-grouped items into individual items ──
  // The schema supports grouped skills (name="Frontend", keywords=["React","Vue"])
  // but ALL templates render skill.name only. This flattens groups so each keyword
  // becomes its own item, ensuring every skill actually displays.
  const normalizedResume = useMemo((): ResumeData => {
    const skills = resume.sections.skills;
    if (!skills?.items?.length) return resume;

    // Check if any visible skill items use the grouped format (keywords array)
    const hasGroups = skills.items.some(
      (item) => !item.hidden && item.keywords && item.keywords.length > 0
    );
    if (!hasGroups) return resume;

    // Flatten groups: each keyword becomes its own skill item
    const flatItems = skills.items.flatMap((item) => {
      if (item.hidden) return [item]; // Keep hidden items as-is
      if (item.keywords && item.keywords.length > 0) {
        return item.keywords.map((kw, idx) => ({
          ...item,
          id: `${item.id}-kw-${idx}`,
          name: kw,
          keywords: [] as string[],
        }));
      }
      return [item];
    });

    return {
      ...resume,
      sections: {
        ...resume.sections,
        skills: {
          ...skills,
          items: flatItems,
        },
      },
    };
  }, [resume]);

  // ── Dynamic CSS overrides: make Format/Style tab controls actually work ──
  // Template CSS uses hardcoded values, so we inject overrides based on user settings.
  const dynamicCSS = useMemo(() => {
    const parts: string[] = [];
    const accentColor = resume.metadata.design.primaryColor;

    // --- Accent color override (per-template CSS variable) ---
    // Parse accent to extract rgba components for light variant
    const rgbaMatch = accentColor.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    const accentLight = rgbaMatch
      ? `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0.12)`
      : accentColor;
    const accentGlow = rgbaMatch
      ? `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0.25)`
      : accentColor;
    const accentDim = rgbaMatch
      ? `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, 0.6)`
      : accentColor;

    parts.push(`
      [data-template="modern-minimalist"]  { --accent: ${accentColor}; --accent-light: ${accentLight}; }
      [data-template="corporate-executive"]{ --gold: ${accentColor}; --gold-light: ${accentLight}; }
      [data-template="creative-bold"]      { --hot-pink: ${accentColor}; }
      [data-template="elegant-sidebar"]    { --accent: ${accentColor}; --accent-glow: ${accentGlow}; }
      [data-template="infographic"]        { --teal: ${accentColor}; --teal-light: ${accentLight}; }
      [data-template="dark-professional"]  { --neon-cyan: ${accentColor}; }
      [data-template="gradient-creative"]  { --purple: ${accentColor}; }
      [data-template="classic-corporate"]  { --blue-accent: ${accentColor}; --blue-light: ${accentLight}; }
      [data-template="artistic-portfolio"] { --coral: ${accentColor}; --coral-light: ${accentLight}; }
      [data-template="tech-modern"]        { --green: ${accentColor}; --green-dim: ${accentDim}; }
      [data-template="pastel-soft"]        { --lavender: ${accentColor}; }
      [data-template="split-duotone"]      { --coral: ${accentColor}; }
      [data-template="architecture-blueprint"] { --blue: ${accentColor}; }
      [data-template="retro-vintage"]      { --gold: ${accentColor}; }
      [data-template="medical-clean"]      { --teal: ${accentColor}; --dark-teal: ${accentColor}; --light-teal: ${accentLight}; }
      [data-template="neon-glass"]         { --neon-blue: ${accentColor}; }
      [data-template="corporate-stripe"]   { --accent: ${accentColor}; }
    `);

    // --- Section spacing override ---
    const spacing = resume.metadata.page.sectionSpacing;
    if (spacing === "compact") {
      parts.push(`
        [data-template] .section,
        [data-template] .sidebar-section,
        [data-template] .resume-section { margin-bottom: 10px !important; }
      `);
    } else if (spacing === "relaxed") {
      parts.push(`
        [data-template] .section,
        [data-template] .sidebar-section,
        [data-template] .resume-section { margin-bottom: 28px !important; }
      `);
    }

    // --- Line spacing override ---
    const lineSpacing = resume.metadata.page.lineSpacing;
    if (lineSpacing === "tight") {
      parts.push(`
        [data-template] { line-height: 1.3; }
        [data-template] .summary,
        [data-template] .exp-desc,
        [data-template] .exp-desc li,
        [data-template] .edu-desc,
        [data-template] p { line-height: 1.3 !important; }
        [data-template] .exp-item,
        [data-template] .edu-item { margin-bottom: 8px !important; }
      `);
    } else if (lineSpacing === "loose") {
      parts.push(`
        [data-template] { line-height: 1.8; }
        [data-template] .summary,
        [data-template] .exp-desc,
        [data-template] .exp-desc li,
        [data-template] .edu-desc,
        [data-template] p { line-height: 1.8 !important; }
      `);
    }

    // --- Font scale override ---
    // Templates use hardcoded px sizes, so we use CSS zoom on content for scale
    const fontScale = resume.metadata.typography.fontScale;
    if (fontScale === "compact") {
      parts.push(`
        [data-template] .section-title,
        [data-template] .section-heading { font-size: 0.9em !important; }
        [data-template] .summary,
        [data-template] .exp-desc,
        [data-template] .exp-desc li,
        [data-template] .edu-desc,
        [data-template] .skill-tag,
        [data-template] .cert-name,
        [data-template] .cert-org,
        [data-template] .lang-name,
        [data-template] .lang-level,
        [data-template] .exp-company,
        [data-template] .exp-role,
        [data-template] .exp-date,
        [data-template] .edu-degree,
        [data-template] .edu-school,
        [data-template] .edu-year,
        [data-template] .contact-line,
        [data-template] p { font-size: 0.9em !important; }
        [data-template] .name { font-size: 0.88em !important; }
        [data-template] .title { font-size: 0.9em !important; }
      `);
    } else if (fontScale === "spacious") {
      parts.push(`
        [data-template] .section-title,
        [data-template] .section-heading { font-size: 1.1em !important; }
        [data-template] .summary,
        [data-template] .exp-desc,
        [data-template] .exp-desc li,
        [data-template] .edu-desc,
        [data-template] .skill-tag,
        [data-template] .cert-name,
        [data-template] .cert-org,
        [data-template] .lang-name,
        [data-template] .lang-level,
        [data-template] .exp-company,
        [data-template] .exp-role,
        [data-template] .exp-date,
        [data-template] .edu-degree,
        [data-template] .edu-school,
        [data-template] .edu-year,
        [data-template] .contact-line,
        [data-template] p { font-size: 1.1em !important; }
        [data-template] .name { font-size: 1.12em !important; }
        [data-template] .title { font-size: 1.1em !important; }
      `);
    }

    // --- Margin preset override (left/right internal padding) ---
    const marginPreset = resume.metadata.page.marginPreset;
    if (marginPreset === "narrow") {
      parts.push(`
        [data-template] .header { padding-left: 28px !important; padding-right: 28px !important; }
        [data-template] .content,
        [data-template] .body,
        [data-template] .body-content,
        [data-template] .resume-body { padding-left: 28px !important; padding-right: 28px !important; }
        [data-template] .header-divider { margin-left: 28px !important; margin-right: 28px !important; }
        [data-template] .banner { padding-left: 28px !important; padding-right: 28px !important; }
      `);
    } else if (marginPreset === "wide") {
      parts.push(`
        [data-template] .header { padding-left: 56px !important; padding-right: 56px !important; }
        [data-template] .content,
        [data-template] .body,
        [data-template] .body-content,
        [data-template] .resume-body { padding-left: 56px !important; padding-right: 56px !important; }
        [data-template] .header-divider { margin-left: 56px !important; margin-right: 56px !important; }
        [data-template] .banner { padding-left: 56px !important; padding-right: 56px !important; }
      `);
    }

    return parts.join("\n");
  }, [
    resume.metadata.design.primaryColor,
    resume.metadata.page.sectionSpacing,
    resume.metadata.page.lineSpacing,
    resume.metadata.page.marginPreset,
    resume.metadata.typography.fontScale,
  ]);

  // ── Measurement state ──
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([0]);
  const pageCount = pageBreaks.length;

  // Notify parent when page count changes
  useEffect(() => {
    onPageCount?.(pageCount);
  }, [pageCount, onPageCount]);

  // ── Re-measure after web fonts load ──
  const [fontGen, setFontGen] = useState(0);
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setFontGen((g) => g + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [resume.metadata.typography.fontPairing]);

  // Measure total content height and compute smart page breaks
  const measure = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;

    const templateEl = el.querySelector("[data-template]") as HTMLElement | null;
    const totalHeight = templateEl ? templateEl.scrollHeight : el.scrollHeight;
    if (totalHeight <= 0) return;

    const { top: topM, bottom: botM } = margins;

    // Collect break candidates and protected zones from the DOM
    const candidates = collectBreakCandidates(el);
    const protectedZones = collectProtectedZones(el);

    const newBreaks = computeSmartPageBreaks(
      candidates,
      protectedZones,
      totalHeight,
      dims.height,
      topM,
      botM,
    );

    setPageBreaks((prev) => {
      if (prev.length === newBreaks.length && prev.every((v, i) => v === newBreaks[i])) {
        return prev; // No change — avoid re-render
      }
      return newBreaks;
    });
  }, [dims.height, margins]);

  // ── Measure after render, fonts, and CSS are ready (triple-rAF) ──
  useLayoutEffect(() => {
    let cancelled = false;
    let id1 = 0, id2 = 0, id3 = 0;
    id1 = requestAnimationFrame(() => {
      if (cancelled) return;
      id2 = requestAnimationFrame(() => {
        if (cancelled) return;
        id3 = requestAnimationFrame(() => {
          if (!cancelled) measure();
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
      cancelAnimationFrame(id3);
    };
  }, [resume, dims.height, dims.width, fontGen, measure]);

  // Also re-measure after a short delay to catch late font loads
  useEffect(() => {
    const timer = setTimeout(() => measure(), 500);
    return () => clearTimeout(timer);
  }, [resume, fontGen, measure]);

  // ── Measurement container style: full page width, unconstrained height ──
  const measureStyle: CSSProperties = useMemo(
    () => ({
      position: "fixed" as const,
      left: "-9999px",
      top: 0,
      width: `${dims.width}px`,
      // DO NOT set height — let content flow naturally
      visibility: "hidden" as const,
      pointerEvents: "none" as const,
      zIndex: -9999,
    }),
    [dims.width]
  );

  return (
    <div id={id} className={className}>
      {/* Google Fonts for pro templates */}
      {proFontLink && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={proFontLink} />
      )}

      {/* CSS overrides: prevent template CSS from clipping content + page-break hints */}
      <style>{`
        [data-measure-container] [data-template],
        [data-content-inner] [data-template] {
          overflow: visible !important;
        }
        [data-template] .section,
        [data-template] .resume-section,
        [data-template] .sidebar-section {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        [data-template] .section-title,
        [data-template] .section-heading {
          break-after: avoid;
          page-break-after: avoid;
        }
        [data-template] .exp-item,
        [data-template] .edu-item,
        [data-template] .project-item,
        [data-template] .cert-item,
        [data-template] .skill-group,
        [data-template] .award-item,
        [data-template] .volunteer-item,
        [data-template] .reference-item,
        [data-template] .custom-item {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      `}</style>

      {/* Dynamic CSS overrides — makes Format/Style tab controls affect templates */}
      {dynamicCSS && <style>{dynamicCSS}</style>}

      {/* Hidden measurement container — renders ALL content with NO height clip */}
      <div
        ref={measureRef}
        style={measureStyle}
        aria-hidden="true"
        data-measure-container=""
      >
        <TemplateComponent
          resume={normalizedResume}
          pageIndex={0}
          pageLayout={allSectionsLayout}
        />
      </div>

      {/* Visible pages — viewport windows into the full content */}
      <div data-resume-pages="" style={{ display: 'flex', flexDirection: 'column', gap: `${pageGap ?? RESUME_PAGE_GAP}px` }}>
      {Array.from({ length: pageCount }, (_, i) => (
        <ResumePage
          key={i}
          resume={normalizedResume}
          pageIndex={i}
          pageCount={pageCount}
          pageLayout={allSectionsLayout}
          TemplateComponent={TemplateComponent}
          cssVars={cssVars}
          pageWidth={dims.width}
          pageHeight={dims.height}
          margins={margins}
          pageStartY={pageBreaks[i]}
          nextPageStartY={i < pageCount - 1 ? pageBreaks[i + 1] : undefined}
          showOverflowWarning={showOverflowWarning && i === pageCount - 1}
        />
      ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResumePage — padded viewport-clipping with smart break alignment
//
// Each page renders the FULL content, shifted via CSS transform so only the
// correct vertical "slice" is visible. The slice is aligned to a clean break
// point that never splits section titles or individual items.
//
//  • Page 0: template header provides natural top → bottom margin overlay
//  • Pages 1+: top margin overlay → content → bottom margin overlay
//  • Content under an overlay re-appears cleanly on the next page
// ---------------------------------------------------------------------------

interface ResumePageProps {
  resume: ResumeData;
  pageIndex: number;
  pageCount: number;
  pageLayout: PageLayout;
  TemplateComponent: TemplateComponentType;
  cssVars: Record<string, string>;
  pageWidth: number;
  pageHeight: number;
  margins: { top: number; bottom: number };
  /** Y offset in the content stream where this page's visible area starts */
  pageStartY: number;
  /** Y offset where the NEXT page starts (undefined for last page) */
  nextPageStartY?: number;
  showOverflowWarning: boolean;
}

function ResumePage({
  resume,
  pageIndex,
  pageCount,
  pageLayout,
  TemplateComponent,
  cssVars,
  pageWidth,
  pageHeight,
  margins,
  pageStartY,
  nextPageStartY,
  showOverflowWarning,
}: ResumePageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const proDef = useMemo(
    () => getProTemplate(resume.metadata.template),
    [resume.metadata.template]
  );

  const bgColor = proDef?.backgroundColor ?? "var(--page-background-color)";
  const textColor = proDef?.isDark ? "#F5F5F5" : "var(--page-text-color)";
  const fontFamily = proDef?.bodyFont ?? "var(--page-body-font-family)";

  const { top: topM, bottom: botM } = margins;

  // CSS transform: shift content up so the correct slice is visible
  // Page 0: no shift (template header is the natural top)
  // Page 1+: shift so content at pageStartY appears at topMargin from page top
  const translateYValue = pageIndex === 0 ? 0 : -(pageStartY - topM);

  // Bottom overlay height: clip at the next page's break point (not fixed)
  // This prevents content between break point and page bottom from showing on both pages
  const bottomOverlayHeight = (() => {
    if (nextPageStartY === undefined) return botM; // Last page: standard margin
    // Position of the next break in page coordinates
    const nextBreakPagePos = pageIndex === 0
      ? nextPageStartY                          // Page 0: no transform
      : (nextPageStartY - pageStartY + topM);   // Page 1+: shifted content
    return Math.max(botM, pageHeight - nextBreakPagePos);
  })();

  // Overflow detection on last page
  useEffect(() => {
    if (!showOverflowWarning || !pageRef.current) return;
    const inner = pageRef.current.querySelector(
      "[data-content-inner]"
    ) as HTMLElement | null;
    if (!inner) return;
    // Rough check: if total content greatly exceeds all pages
    const p0 = pageHeight - botM;
    const cont = pageHeight - topM - botM;
    const totalVisible = p0 + Math.max(0, pageCount - 1) * cont;
    setIsOverflowing(inner.scrollHeight > totalVisible + 5);
  }, [resume, pageLayout, pageHeight, topM, botM, pageCount, showOverflowWarning]);

  // Outer: fixed page dimensions, overflow hidden (the "viewport window")
  const pageStyle: CSSProperties = {
    ...Object.fromEntries(Object.entries(cssVars)),
    width: `${pageWidth}px`,
    height: `${pageHeight}px`,
    backgroundColor: bgColor,
    color: textColor,
    position: "relative",
    overflow: "hidden",
    fontFamily,
    fontSize: "var(--page-body-font-size)",
    lineHeight: "var(--page-body-line-height)",
  } as CSSProperties;

  // Inner: shifted upward to expose the correct page slice
  const contentStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    transform: `translateY(${translateYValue}px)`,
    height: "auto",
    minHeight: `${pageCount * pageHeight}px`,
  };

  return (
    <div className="relative">
      <div
        ref={pageRef}
        data-resume-page={pageIndex}
        style={pageStyle}
        className={`shadow-lg ${
          isOverflowing && showOverflowWarning ? "ring-2 ring-amber-400/50" : ""
        }`}
      >
        <div style={contentStyle} data-content-inner="">
          <TemplateComponent
            resume={resume}
            pageIndex={0}
            pageLayout={pageLayout}
          />
        </div>

        {/* Top margin overlay — continuation pages only */}
        {pageIndex > 0 && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: `${topM}px`,
              background: bgColor,
              zIndex: 10,
            }}
          />
        )}

        {/* Bottom margin overlay — clips content at break point */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${bottomOverlayHeight}px`,
            background: bgColor,
            zIndex: 10,
          }}
        />
      </div>

      {/* Page number indicator */}
      {pageCount > 1 && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
          Page {pageIndex + 1} of {pageCount}
        </div>
      )}

      {/* Overflow warning on last page */}
      {isOverflowing && showOverflowWarning && (
        <div
          className="absolute flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium"
          style={{
            bottom: `${botM}px`,
            left: 0,
            right: 0,
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            color: "rgb(245, 158, 11)",
            backdropFilter: "blur(4px)",
            zIndex: 11,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
          Content exceeds page — consider shortening some sections
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

export { getTemplateComponent };
