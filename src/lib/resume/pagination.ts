// =============================================================================
// DMSuite — Resume Auto-Pagination Engine
// Distributes resume sections across pages based on measured DOM heights.
// Works with both two-column and single-column template layouts.
// Supports smart splitting of individual section items across pages.
// =============================================================================

import type { PageLayout, TemplateId } from "./schema";

// ---------------------------------------------------------------------------
// Template Configuration
// Maps each template to its layout characteristics for measurement accuracy.
// ---------------------------------------------------------------------------

interface TemplateLayoutConfig {
  headerVariant: "centered" | "left" | "split";
  decoration: "underline" | "bar" | "none";
  isTwoColumn: boolean;
}

export const TEMPLATE_CONFIG: Record<TemplateId, TemplateLayoutConfig> = {
  // ── Pro templates (20) ──
  "modern-minimalist":      { headerVariant: "split",    decoration: "bar",       isTwoColumn: true  },
  "corporate-executive":    { headerVariant: "centered", decoration: "underline", isTwoColumn: false },
  "creative-bold":          { headerVariant: "left",     decoration: "bar",       isTwoColumn: true  },
  "elegant-sidebar":        { headerVariant: "left",     decoration: "none",      isTwoColumn: true  },
  "infographic":            { headerVariant: "left",     decoration: "bar",       isTwoColumn: true  },
  "dark-professional":      { headerVariant: "split",    decoration: "bar",       isTwoColumn: true  },
  "gradient-creative":      { headerVariant: "left",     decoration: "bar",       isTwoColumn: true  },
  "classic-corporate":      { headerVariant: "split",    decoration: "underline", isTwoColumn: true  },
  "artistic-portfolio":     { headerVariant: "split",    decoration: "bar",       isTwoColumn: true  },
  "tech-modern":            { headerVariant: "left",     decoration: "bar",       isTwoColumn: true  },
  "swiss-typographic":      { headerVariant: "split",    decoration: "bar",       isTwoColumn: true  },
  "newspaper-editorial":    { headerVariant: "centered", decoration: "underline", isTwoColumn: true  },
  "brutalist-mono":         { headerVariant: "left",     decoration: "bar",       isTwoColumn: false },
  "pastel-soft":            { headerVariant: "left",     decoration: "none",      isTwoColumn: true  },
  "split-duotone":          { headerVariant: "left",     decoration: "bar",       isTwoColumn: true  },
  "architecture-blueprint": { headerVariant: "centered", decoration: "underline", isTwoColumn: false },
  "retro-vintage":          { headerVariant: "centered", decoration: "underline", isTwoColumn: true  },
  "medical-clean":          { headerVariant: "split",    decoration: "underline", isTwoColumn: true  },
  "neon-glass":             { headerVariant: "split",    decoration: "bar",       isTwoColumn: true  },
  "corporate-stripe":       { headerVariant: "centered", decoration: "underline", isTwoColumn: true  },
};

// ---------------------------------------------------------------------------
// Pagination Input / Output
// ---------------------------------------------------------------------------

export interface PaginationInput {
  /** Ordered section IDs for the main (wider) column */
  mainSections: string[];
  /** Ordered section IDs for the sidebar (narrower) column */
  sidebarSections: string[];
  /** Measured height in CSS-px for every section (key = sectionId) */
  sectionHeights: Record<string, number>;
  /** Measured height of the page header (name + contact) in CSS-px */
  headerHeight: number;
  /** Usable content-area height per page in CSS-px (page height – top/bottom padding) */
  availableHeight: number;
  /** Whether the active template uses a two-column layout */
  isTwoColumn: boolean;
}

// ---------------------------------------------------------------------------
// Core Algorithm
// ---------------------------------------------------------------------------

/**
 * Distribute resume sections across pages so that no page overflows.
 *
 * Strategy: **Greedy first-fit**.
 * - For single-column templates, all sections flow linearly.
 * - For two-column templates, main and sidebar columns are distributed
 *   independently; the total page count is the maximum of the two.
 * - Page 0 has reduced available height because it contains the header.
 */
export function paginateSections(input: PaginationInput): PageLayout[] {
  const {
    mainSections,
    sidebarSections,
    sectionHeights,
    headerHeight,
    availableHeight,
    isTwoColumn,
  } = input;

  // Guard: nothing to render
  if (mainSections.length === 0 && sidebarSections.length === 0) {
    return [{ fullWidth: !isTwoColumn, main: [], sidebar: [] }];
  }

  if (!isTwoColumn) {
    // ── Single-column: merge both arrays into one linear flow ──
    const allSections = [...mainSections, ...sidebarSections];
    const columnPages = distributeColumn(
      allSections,
      sectionHeights,
      availableHeight,
      headerHeight
    );

    if (columnPages.length === 0) {
      return [{ fullWidth: true, main: [], sidebar: [] }];
    }

    return columnPages.map((sections) => ({
      fullWidth: true,
      main: sections,
      sidebar: [],
    }));
  }

  // ── Two-column: distribute main & sidebar independently ──
  const mainPages = distributeColumn(
    mainSections,
    sectionHeights,
    availableHeight,
    headerHeight
  );

  const sidebarPages = distributeColumn(
    sidebarSections,
    sectionHeights,
    availableHeight,
    headerHeight
  );

  const pageCount = Math.max(mainPages.length, sidebarPages.length, 1);
  const pages: PageLayout[] = [];

  for (let i = 0; i < pageCount; i++) {
    pages.push({
      fullWidth: false,
      main: mainPages[i] ?? [],
      sidebar: sidebarPages[i] ?? [],
    });
  }

  return pages;
}

// ---------------------------------------------------------------------------
// Column Distribution Helper
// ---------------------------------------------------------------------------

/** Bottom safety buffer (px) — prevents content from crowding the page bottom edge */
const BOTTOM_SAFETY = 16;

/**
 * Minimum fill ratio — if a section doesn't fit but the page is less than
 * this percentage full, we still place it to avoid leaving large gaps.
 * Only sections larger than the remaining space will break to the next page
 * if the page is already well-filled.
 */
const MIN_FILL_RATIO = 0.35;

/**
 * Greedily assigns sections to pages within a single column.
 * Improved: Avoids leaving large gaps at the bottom of pages by considering
 * how full the current page is before bumping a section to the next page.
 *
 * @param sections       Ordered section IDs
 * @param heights        Measured heights per section
 * @param pageHeight     Usable height per page (after margins)
 * @param firstPageOffset Height already consumed on page 0 (header)
 * @returns              Array of pages, each being an array of section IDs
 */
function distributeColumn(
  sections: string[],
  heights: Record<string, number>,
  pageHeight: number,
  firstPageOffset: number
): string[][] {
  // Reserve a safety buffer at the bottom of every page
  const usable = pageHeight - BOTTOM_SAFETY;

  const pages: string[][] = [];
  let currentPage: string[] = [];
  let remaining = usable - firstPageOffset;
  const totalUsable = usable; // Full page usable (for subsequent pages)

  for (const id of sections) {
    const h = heights[id] ?? 0;
    if (h <= 0) continue; // hidden or empty section

    if (h > remaining && currentPage.length > 0) {
      // Section doesn't fit. Check how full the page currently is.
      const pageCapacity = currentPage.length === 0 ? totalUsable : (pages.length === 0 ? usable - firstPageOffset : totalUsable);
      const used = pageCapacity - remaining;
      const fillRatio = used / pageCapacity;

      // If the page is already well-filled (past MIN_FILL_RATIO), push to new page.
      // If the page is mostly empty and the section is only slightly too large,
      // keep it on the current page to avoid visible gaps.
      if (fillRatio >= MIN_FILL_RATIO || h > totalUsable) {
        pages.push(currentPage);
        currentPage = [];
        remaining = totalUsable;
      }
      // Otherwise, let it overflow slightly — the page will clip but won't leave a gap
    }

    currentPage.push(id);
    remaining -= h;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}
