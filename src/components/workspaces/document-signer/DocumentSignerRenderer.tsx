// =============================================================================
// DMSuite — Document Signer & Form Filler — Preview Renderer
// Renders document pages with overlaid fields.
// Uses react-pdf (pdfjs-dist) for uploaded PDFs, HTML for templates.
// =============================================================================

"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { DocumentSignerForm, DocumentField, SignerRole } from "@/stores/document-signer-editor";

// react-pdf — Apache-2.0, renders real PDF pages in browser via pdfjs-dist
const PDFDocument = dynamic(
  () => import("react-pdf").then((m) => m.Document),
  { ssr: false }
);
const PDFPage = dynamic(
  () => import("react-pdf").then((m) => m.Page),
  { ssr: false }
);

// Configure pdfjs worker
let workerConfigured = false;
function configurePdfWorker() {
  if (workerConfigured || typeof window === "undefined") return;
  workerConfigured = true;
  import("react-pdf").then((rp) => {
    rp.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  });
}

// ── Page dimensions (Points → px at 96 DPI) ────────────────────────────────
export const PAGE_PX = {
  a4: { w: 595, h: 842 },
  letter: { w: 612, h: 792 },
  legal: { w: 612, h: 1008 },
};

export const PAGE_GAP = 24;

// ── Field type icons (inline SVG path data) ────────────────────────────────
const FIELD_ICONS: Record<string, string> = {
  signature: "M3 17l6-6 4 4 8-8M14 7h7v7",
  initials: "M4 7V4h4M20 7V4h-4M4 17v3h4M20 17v3h-4M8 12h8",
  date: "M8 7V3m8 4V3M3 11h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z",
  text: "M4 7h16M4 12h10M4 17h14",
  number: "M7 20l4-16m2 16l4-16M3 8h18M3 16h18",
  email: "M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  checkbox: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  radio: "M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0",
  select: "M8 9l4-4 4 4M16 15l-4 4-4-4",
  textarea: "M4 6h16M4 10h16M4 14h10M4 18h14",
  file: "M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z M14 2v5h5",
  stamp: "M12 8V4l8 4-8 4V8M4 16h16M4 20h16",
  image: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};

// ── Build Print HTML for PDF export ─────────────────────────────────────────
export function buildPrintHTML(form: DocumentSignerForm): string {
  const dim = PAGE_PX.a4;
  const pages = form.pages;

  const fieldsByPage = new Map<number, DocumentField[]>();
  form.fields.forEach((f) => {
    const arr = fieldsByPage.get(f.page) || [];
    arr.push(f);
    fieldsByPage.set(f.page, arr);
  });

  const signerMap = new Map<string, SignerRole>();
  form.signers.forEach((s) => signerMap.set(s.id, s));

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${form.style.fontFamily}, sans-serif; font-size: ${form.style.fontSize}px; color: #1a1a2e; }
  .page { width: ${dim.w}px; height: ${dim.h}px; position: relative; overflow: hidden; page-break-after: always; padding: 40px; }
  .page:last-child { page-break-after: auto; }
  .doc-field { position: absolute; display: flex; align-items: center; }
  .doc-field-label { font-size: 9px; color: #6b7280; position: absolute; top: -14px; left: 0; white-space: nowrap; }
  .doc-field-value { width: 100%; font-size: inherit; }
  .signature-img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .field-border { border-bottom: 1.5px solid #d1d5db; }
  .doc-title { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 6px; color: ${form.style.accentColor}; }
  .doc-subtitle { text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 24px; }
  .doc-content-area { padding: 20px 0; line-height: 1.7; }
  ${form.style.companyLogo ? `.company-logo { display: block; max-width: 120px; margin: 0 auto 12px; }` : ""}
</style></head><body>`;

  pages.forEach((page) => {
    const pageFields = fieldsByPage.get(page.number) || [];
    html += `<div class="page">`;

    // Title on first page
    if (page.number === 1) {
      if (form.style.companyLogo) {
        html += `<img src="${form.style.companyLogo}" class="company-logo" alt="Logo" />`;
      }
      if (form.style.companyName) {
        html += `<div class="doc-subtitle">${form.style.companyName}</div>`;
      }
      html += `<div class="doc-title">${form.documentName}</div>`;
      if (form.description) {
        html += `<div class="doc-subtitle">${form.description}</div>`;
      }
    }

    // Content area
    if (page.content) {
      html += `<div class="doc-content-area">${page.content}</div>`;
    }

    // Render fields
    pageFields.forEach((field) => {
      const left = (field.x / 100) * dim.w;
      const top = (field.y / 100) * dim.h;
      const width = (field.width / 100) * dim.w;
      const height = (field.height / 100) * dim.h;

      html += `<div class="doc-field" style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;font-size:${field.fontSize || 14}px;">`;

      if (field.value) {
        if (
          (field.type === "signature" || field.type === "initials" || field.type === "stamp" || field.type === "image") &&
          field.value.startsWith("data:")
        ) {
          html += `<img src="${field.value}" class="signature-img" alt="${field.label}" />`;
        } else if (field.type === "checkbox") {
          html += `<span style="font-size:18px;">${field.value === "true" ? "☑" : "☐"}</span>`;
        } else {
          html += `<span class="doc-field-value">${field.value}</span>`;
        }
      } else {
        html += `<span class="doc-field-value field-border" style="display:block;height:100%;"></span>`;
      }

      html += `</div>`;
    });

    html += `</div>`;
  });

  html += `</body></html>`;
  return html;
}

// ── Renderer Component ──────────────────────────────────────────────────────
interface Props {
  form: DocumentSignerForm;
  onPageCount?: (count: number) => void;
  pageGap?: number;
  onFieldClick?: (fieldId: string) => void;
  selectedFieldId?: string | null;
  onFieldDragEnd?: (fieldId: string, x: number, y: number) => void;
}

export default function DocumentSignerRenderer({
  form,
  onPageCount,
  pageGap = PAGE_GAP,
  onFieldClick,
  selectedFieldId,
  onFieldDragEnd,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dim = PAGE_PX.a4;
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const hasPdf = !!form.uploadedPdfData;

  // Configure PDF worker on mount
  useEffect(() => {
    if (hasPdf) configurePdfWorker();
  }, [hasPdf]);

  // Determine total page count
  const totalPages = hasPdf ? pdfNumPages : form.pages.length;

  // Report page count
  useEffect(() => {
    onPageCount?.(Math.max(1, totalPages));
  }, [totalPages, onPageCount]);

  const handlePdfLoadSuccess = useCallback(
    (pdf: { numPages: number }) => {
      setPdfNumPages(pdf.numPages);
    },
    []
  );

  // Signer color map
  const signerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    form.signers.forEach((s) => map.set(s.id, s.color));
    return map;
  }, [form.signers]);

  // Group fields by page
  const fieldsByPage = useMemo(() => {
    const map = new Map<number, DocumentField[]>();
    form.fields.forEach((f) => {
      const arr = map.get(f.page) || [];
      arr.push(f);
      map.set(f.page, arr);
    });
    return map;
  }, [form.fields]);

  // Drag state
  const dragRef = useRef<{
    fieldId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    pageEl: HTMLElement;
  } | null>(null);

  const handleFieldMouseDown = useCallback(
    (e: React.MouseEvent, field: DocumentField, pageEl: HTMLDivElement) => {
      e.stopPropagation();
      e.preventDefault();
      onFieldClick?.(field.id);
      dragRef.current = {
        fieldId: field.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: field.x,
        origY: field.y,
        pageEl,
      };

      const handleMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const { startX, startY, origX, origY, pageEl: pg } = dragRef.current;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const rect = pg.getBoundingClientRect();
        const newX = origX + (dx / rect.width) * 100;
        const newY = origY + (dy / rect.height) * 100;
        const el = pg.querySelector(`[data-field-id="${dragRef.current.fieldId}"]`) as HTMLElement;
        if (el) {
          el.style.left = `${Math.max(0, Math.min(100 - field.width, newX))}%`;
          el.style.top = `${Math.max(0, Math.min(100 - field.height, newY))}%`;
        }
      };

      const handleUp = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const { startX, startY, origX, origY, pageEl: pg } = dragRef.current;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const rect = pg.getBoundingClientRect();
        const newX = Math.max(0, Math.min(100 - field.width, origX + (dx / rect.width) * 100));
        const newY = Math.max(0, Math.min(100 - field.height, origY + (dy / rect.height) * 100));
        onFieldDragEnd?.(dragRef.current.fieldId, newX, newY);
        dragRef.current = null;
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [onFieldClick, onFieldDragEnd]
  );

  // ── Field overlay (shared by both PDF and HTML modes) ──
  const renderFieldOverlay = (pageNumber: number) => {
    const pageFields = fieldsByPage.get(pageNumber) || [];
    return pageFields.map((field) => {
      const signerColor = signerColorMap.get(field.assignedTo) || "#8b5cf6";
      const isSelected = selectedFieldId === field.id;
      const hasValue = !!field.value;

      return (
        <div
          key={field.id}
          data-field-id={field.id}
          data-doc-section="field"
          className={`absolute cursor-move group transition-shadow ${
            isSelected ? "ring-2 ring-offset-1 z-20" : "hover:ring-1 hover:ring-offset-1 z-10"
          }`}
          style={{
            left: `${field.x}%`,
            top: `${field.y}%`,
            width: `${field.width}%`,
            height: `${field.height}%`,
            borderWidth: 1.5,
            borderStyle: form.style.fieldBorderStyle,
            borderColor: signerColor,
            backgroundColor: `${signerColor}${Math.round(form.style.fieldBackgroundOpacity * 255)
              .toString(16)
              .padStart(2, "0")}`,
            borderRadius: 4,
            outlineColor: signerColor,
          }}
          onMouseDown={(e) => {
            const pageEl = e.currentTarget.closest("[data-page]") as HTMLDivElement;
            if (pageEl) handleFieldMouseDown(e, field, pageEl);
          }}
          onClick={(e) => {
            e.stopPropagation();
            onFieldClick?.(field.id);
          }}
        >
          {/* Label */}
          {form.style.showFieldLabels && (
            <div
              className="absolute -top-4 left-0 text-[8px] font-medium truncate max-w-full px-1 rounded-t"
              style={{ color: signerColor }}
            >
              {field.label}
              {form.style.showRequiredIndicator && field.required && (
                <span className="text-red-500 ml-0.5">*</span>
              )}
            </div>
          )}

          {/* Field content */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden px-1">
            {hasValue ? (
              field.type === "signature" || field.type === "initials" || field.type === "stamp" || field.type === "image" ? (
                field.value.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={field.value}
                    alt={field.label}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span
                    className="text-lg italic"
                    style={{
                      fontFamily: "'Dancing Script', cursive",
                      color: field.fontColor || "#1a1a2e",
                    }}
                  >
                    {field.value}
                  </span>
                )
              ) : field.type === "checkbox" ? (
                <span className="text-base">
                  {field.value === "true" ? "☑" : "☐"}
                </span>
              ) : (
                <span
                  className="text-xs truncate w-full"
                  style={{
                    fontSize: field.fontSize || 14,
                    color: field.fontColor || "#1a1a2e",
                  }}
                >
                  {field.value}
                </span>
              )
            ) : (
              <div className="flex items-center gap-1 opacity-50">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={signerColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={FIELD_ICONS[field.type] || FIELD_ICONS.text} />
                </svg>
                <span className="text-[8px]" style={{ color: signerColor }}>
                  {field.placeholder || field.label}
                </span>
              </div>
            )}
          </div>

          {/* Resize handle */}
          {isSelected && (
            <div
              className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white cursor-se-resize"
              style={{ backgroundColor: signerColor }}
            />
          )}
        </div>
      );
    });
  };

  // ── PDF rendering mode (uploaded PDF) ──
  if (hasPdf) {
    return (
      <div ref={containerRef} className="document-signer-wrapper inline-flex flex-col items-center">
        <PDFDocument
          file={form.uploadedPdfData}
          onLoadSuccess={handlePdfLoadSuccess}
          loading={
            <div className="flex items-center justify-center bg-white shadow-xl" style={{ width: dim.w, height: dim.h }}>
              <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 019.95 9" strokeLinecap="round" />
                </svg>
                <span className="text-xs">Loading PDF...</span>
              </div>
            </div>
          }
          error={
            <div className="flex items-center justify-center bg-white shadow-xl" style={{ width: dim.w, height: dim.h }}>
              <div className="text-center text-red-400">
                <span className="text-sm">Failed to load PDF</span>
              </div>
            </div>
          }
        >
          {Array.from({ length: pdfNumPages }, (_, i) => (
            <div key={`pdf-page-${i}`} style={{ marginBottom: i < pdfNumPages - 1 ? pageGap : 0 }}>
              <div
                data-page={i + 1}
                className="relative shadow-xl"
                style={{ width: dim.w, height: dim.h, overflow: "hidden" }}
              >
                <PDFPage
                  pageNumber={i + 1}
                  width={dim.w}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                {/* Fields overlay on PDF page */}
                {renderFieldOverlay(i + 1)}
              </div>
            </div>
          ))}
        </PDFDocument>
      </div>
    );
  }

  // ── HTML template rendering mode ──
  return (
    <div ref={containerRef} className="document-signer-wrapper inline-flex flex-col items-center">
      {form.pages.map((page, pageIdx) => (
        <div key={page.id} style={{ marginBottom: pageIdx < form.pages.length - 1 ? pageGap : 0 }}>
          <div
            data-page={page.number}
            className="relative bg-white shadow-xl"
            style={{ width: dim.w, height: dim.h }}
          >
            {/* Page content */}
            <div className="absolute inset-0 p-10">
              {page.number === 1 && (
                <div data-doc-section="header" className="mb-6">
                  {form.style.companyName && (
                    <p className="text-center text-xs text-gray-500 mb-1" style={{ fontFamily: form.style.fontFamily }}>
                      {form.style.companyName}
                    </p>
                  )}
                  <h1
                    className="text-center text-xl font-bold mb-1"
                    style={{ color: form.style.accentColor, fontFamily: form.style.fontFamily }}
                  >
                    {form.documentName || "Untitled Document"}
                  </h1>
                  {form.description && (
                    <p className="text-center text-[11px] text-gray-500" style={{ fontFamily: form.style.fontFamily }}>
                      {form.description}
                    </p>
                  )}
                  <div className="mt-3 border-b border-gray-200" />
                </div>
              )}

              {page.content && (
                <div
                  className="text-sm leading-relaxed text-gray-700"
                  style={{ fontFamily: form.style.fontFamily }}
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              )}

              <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] text-gray-400">
                Page {page.number} of {form.pages.length}
              </div>
            </div>

            {/* Fields overlay on HTML page */}
            {renderFieldOverlay(page.number)}
          </div>
        </div>
      ))}
    </div>
  );
}
