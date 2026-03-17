// =============================================================================
// DMSuite — Invoice Template Renderer (Pagination Orchestrator)
// Smart page-break engine adapted from the Resume TemplateRenderer.
// Invoices are single-column — breaks target line-item / section boundaries.
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
import type { InvoiceData, InvoiceTemplateId } from "@/lib/invoice/schema";
import { PAGE_DIMENSIONS } from "@/lib/invoice/schema";
import { getInvoiceTemplate } from "./template-defs";
import { createInvoiceTemplateComponent } from "./UniversalInvoiceTemplate";

// ---------------------------------------------------------------------------
// Template component cache
// ---------------------------------------------------------------------------

type InvoiceTemplateComponentType = React.ComponentType<{ invoice: InvoiceData }>;

const templateComponentCache = new Map<string, InvoiceTemplateComponentType>();

function getTemplateComponent(id: string): InvoiceTemplateComponentType {
  let cached = templateComponentCache.get(id);
  if (cached) return cached;
  cached = createInvoiceTemplateComponent(id);
  templateComponentCache.set(id, cached);
  return cached;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_MARGIN_PX = { top: 0, bottom: 36 };
const CONT_PAGE_TOP = 36;
const MIN_PAGE_CONTENT_PX = 120;
const MAX_PAGES = 8;

/** DOM selectors for invoice breakable boundaries */
const BREAKABLE_SELECTORS = [
  ".inv-table tbody tr",
  ".inv-totals-row",
  ".inv-footer-section",
  ".inv-signature-area",
].join(",");

const SECTION_SELECTORS = ".inv-header, .inv-body, .inv-meta-grid, .inv-detail-row, .inv-table, .inv-totals, .inv-footer-sections, .inv-signature-area";

// ---------------------------------------------------------------------------
// Smart Page-Break Analysis
// ---------------------------------------------------------------------------

interface BreakCandidate {
  y: number;
  priority: number;
}

interface ProtectedZone {
  top: number;
  bottom: number;
}

function collectBreakCandidates(measureEl: HTMLElement): BreakCandidate[] {
  const templateEl = measureEl.querySelector("[data-invoice-template]") as HTMLElement | null;
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

  // Level 0 — Major section boundaries (header, body, totals)
  const sections = templateEl.querySelectorAll(SECTION_SELECTORS);
  for (const el of sections) {
    const rect = el.getBoundingClientRect();
    add(rect.top - containerRect.top, 0);
    add(rect.bottom - containerRect.top, 0);
  }

  // Level 1 — Row boundaries (table rows, totals rows, footer sections)
  const items = templateEl.querySelectorAll(BREAKABLE_SELECTORS);
  for (const el of items) {
    const rect = el.getBoundingClientRect();
    add(rect.top - containerRect.top, 1);
    add(rect.bottom - containerRect.top, 1);
  }

  // Level 2 — Generic fallback: direct children of body
  if (candidates.length < 5) {
    const fallback = templateEl.querySelectorAll("[data-invoice-template] > .inv-body > *");
    for (const el of fallback) {
      const rect = el.getBoundingClientRect();
      if (rect.height > 20) {
        add(rect.top - containerRect.top, 2);
        add(rect.bottom - containerRect.top, 2);
      }
    }
  }

  candidates.sort((a, b) => a.y - b.y || a.priority - b.priority);
  return candidates;
}

function collectProtectedZones(measureEl: HTMLElement): ProtectedZone[] {
  const templateEl = measureEl.querySelector("[data-invoice-template]") as HTMLElement | null;
  if (!templateEl) return [];

  const containerRect = templateEl.getBoundingClientRect();
  const zones: ProtectedZone[] = [];

  const relY = (el: Element) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top - containerRect.top), bottom: Math.round(r.bottom - containerRect.top) };
  };

  // Protect the header + meta grid from splitting
  const header = templateEl.querySelector(".inv-header");
  if (header) {
    const pos = relY(header);
    zones.push(pos);
  }

  // Protect totals block
  const totals = templateEl.querySelector(".inv-totals");
  if (totals) {
    const pos = relY(totals);
    zones.push(pos);
  }

  // Protect table header row with first body row
  const thead = templateEl.querySelector(".inv-table thead");
  const firstTr = templateEl.querySelector(".inv-table tbody tr:first-child");
  if (thead && firstTr) {
    zones.push({
      top: relY(thead).top,
      bottom: relY(firstTr).bottom,
    });
  }

  // Protect signature area
  const sig = templateEl.querySelector(".inv-signature-area");
  if (sig) zones.push(relY(sig));

  return zones;
}

function computeSmartPageBreaks(
  candidates: BreakCandidate[],
  protectedZones: ProtectedZone[],
  totalHeight: number,
  pageHeight: number,
  bottomMargin: number,
): number[] {
  const page0Visible = pageHeight - bottomMargin;
  const contVisible = pageHeight - CONT_PAGE_TOP - bottomMargin;

  if (totalHeight <= page0Visible) return [0];

  if (candidates.length === 0) {
    return uniformBreaks(totalHeight, page0Visible, contVisible);
  }

  const breaks: number[] = [0];

  function findBest(targetY: number, minY: number): number {
    const validMin = minY + MIN_PAGE_CONTENT_PX;
    let bestY = -1;

    for (const c of candidates) {
      if (c.y <= validMin) continue;
      if (c.y > targetY) break;
      bestY = c.y;
    }

    if (bestY <= minY) return targetY;

    const split = protectedZones.find((z) => z.top < bestY && z.bottom > bestY);
    if (split) {
      const adj = split.top;
      if (adj > validMin) {
        const dbl = protectedZones.find((z) => z.top < adj && z.bottom > adj);
        if (!dbl) return adj;
        if (dbl.top > validMin) return dbl.top;
      }
    }

    return bestY;
  }

  let lastY = findBest(page0Visible, 0);
  breaks.push(lastY);

  let safety = 0;
  while (lastY + contVisible < totalHeight && safety < MAX_PAGES) {
    const target = lastY + contVisible;
    const nextY = findBest(target, lastY);
    if (nextY <= lastY) {
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
// InvoiceTemplateRenderer — Main Component
// ---------------------------------------------------------------------------

interface InvoiceTemplateRendererProps {
  invoice: InvoiceData;
  className?: string;
  showOverflowWarning?: boolean;
  id?: string;
}

export default function InvoiceTemplateRenderer({
  invoice,
  className,
  showOverflowWarning = true,
  id,
}: InvoiceTemplateRendererProps) {
  const templateId = invoice.metadata.template as InvoiceTemplateId;
  const TemplateComponent = useMemo(() => getTemplateComponent(templateId), [templateId]);
  const dims = PAGE_DIMENSIONS[invoice.metadata.pageFormat];
  const tplDef = useMemo(() => getInvoiceTemplate(templateId), [templateId]);

  const proFontLink = tplDef?.googleFontUrl ?? null;

  // ── Measurement state ──
  const measureRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([0]);
  const pageCount = pageBreaks.length;

  // Re-measure after fonts load
  const [fontGen, setFontGen] = useState(0);
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setFontGen((g) => g + 1);
    });
    return () => { cancelled = true; };
  }, [invoice.metadata.fontPairing]);

  const measure = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;

    const templateEl = el.querySelector("[data-invoice-template]") as HTMLElement | null;
    const totalHeight = templateEl ? templateEl.scrollHeight : el.scrollHeight;
    if (totalHeight <= 0) return;

    const candidates = collectBreakCandidates(el);
    const protectedZones = collectProtectedZones(el);

    const newBreaks = computeSmartPageBreaks(
      candidates,
      protectedZones,
      totalHeight,
      dims.h,
      PAGE_MARGIN_PX.bottom,
    );

    setPageBreaks((prev) => {
      if (prev.length === newBreaks.length && prev.every((v, i) => v === newBreaks[i])) {
        return prev;
      }
      return newBreaks;
    });
  }, [dims.h]);

  // Triple-rAF measurement
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
  }, [invoice, dims.h, dims.w, fontGen, measure]);

  // Delayed re-measure for late font loads
  useEffect(() => {
    const timer = setTimeout(() => measure(), 500);
    return () => clearTimeout(timer);
  }, [invoice, fontGen, measure]);

  const measureStyle: CSSProperties = useMemo(() => ({
    position: "fixed" as const,
    left: "-9999px",
    top: 0,
    width: `${dims.w}px`,
    visibility: "hidden" as const,
    pointerEvents: "none" as const,
    zIndex: -9999,
  }), [dims.w]);

  return (
    <div id={id} className={className}>
      {proFontLink && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={proFontLink} />
      )}

      <style>{`
        [data-measure-container] [data-invoice-template],
        [data-content-inner] [data-invoice-template] {
          overflow: visible !important;
        }
        [data-invoice-template] .inv-table {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        [data-invoice-template] .inv-totals {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        [data-invoice-template] .inv-signature-area {
          break-inside: avoid;
          page-break-inside: avoid;
        }
      `}</style>

      {/* Hidden measurement container */}
      <div
        ref={measureRef}
        style={measureStyle}
        aria-hidden="true"
        data-measure-container=""
      >
        <TemplateComponent invoice={invoice} />
      </div>

      {/* Visible pages */}
      {Array.from({ length: pageCount }, (_, i) => (
        <InvoicePage
          key={i}
          invoice={invoice}
          pageIndex={i}
          pageCount={pageCount}
          TemplateComponent={TemplateComponent}
          pageWidth={dims.w}
          pageHeight={dims.h}
          pageStartY={pageBreaks[i]}
          nextPageStartY={i < pageCount - 1 ? pageBreaks[i + 1] : undefined}
          showOverflowWarning={showOverflowWarning && i === pageCount - 1}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// InvoicePage — viewport-clipped page slice
// ---------------------------------------------------------------------------

interface InvoicePageProps {
  invoice: InvoiceData;
  pageIndex: number;
  pageCount: number;
  TemplateComponent: InvoiceTemplateComponentType;
  pageWidth: number;
  pageHeight: number;
  pageStartY: number;
  nextPageStartY?: number;
  showOverflowWarning: boolean;
}

function InvoicePage({
  invoice,
  pageIndex,
  pageCount,
  TemplateComponent,
  pageWidth,
  pageHeight,
  pageStartY,
  nextPageStartY,
  showOverflowWarning,
}: InvoicePageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const bgColor = "#ffffff";
  const topM = pageIndex === 0 ? 0 : CONT_PAGE_TOP;
  const botM = PAGE_MARGIN_PX.bottom;

  const translateYValue = pageIndex === 0 ? 0 : -(pageStartY - topM);

  const bottomOverlayHeight = (() => {
    if (nextPageStartY === undefined) return botM;
    const nextBreakPagePos = pageIndex === 0
      ? nextPageStartY
      : (nextPageStartY - pageStartY + topM);
    return Math.max(botM, pageHeight - nextBreakPagePos);
  })();

  // Overflow detection
  useEffect(() => {
    if (!showOverflowWarning || !pageRef.current) return;
    const inner = pageRef.current.querySelector("[data-content-inner]") as HTMLElement | null;
    if (!inner) return;
    const p0 = pageHeight - botM;
    const cont = pageHeight - CONT_PAGE_TOP - botM;
    const totalVisible = p0 + Math.max(0, pageCount - 1) * cont;
    setIsOverflowing(inner.scrollHeight > totalVisible + 5);
  }, [invoice, pageHeight, botM, pageCount, showOverflowWarning]);

  const pageStyle: CSSProperties = {
    width: `${pageWidth}px`,
    height: `${pageHeight}px`,
    backgroundColor: bgColor,
    position: "relative",
    overflow: "hidden",
  };

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
    <div className="relative mb-8">
      <div
        ref={pageRef}
        data-invoice-page={pageIndex}
        style={pageStyle}
        className={`shadow-lg ${isOverflowing && showOverflowWarning ? "ring-2 ring-amber-400/50" : ""}`}
      >
        <div style={contentStyle} data-content-inner="">
          <TemplateComponent invoice={invoice} />
        </div>

        {/* Top margin overlay — continuation pages */}
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

        {/* Bottom margin overlay */}
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

      {/* Page indicator */}
      {pageCount > 1 && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
          Page {pageIndex + 1} of {pageCount}
        </div>
      )}

      {/* Overflow warning */}
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
          Content exceeds page — consider removing some line items
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { getTemplateComponent };
