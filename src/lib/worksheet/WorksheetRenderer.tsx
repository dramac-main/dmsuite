// =============================================================================
// DMSuite — Worksheet & Form Designer Renderer
// Pure HTML/CSS paginated renderer for worksheets and forms.
// Renders all element types: inputs, choice fields, scales, educational,
// layout, and special elements. Supports answer key generation.
// =============================================================================

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type {
  WorksheetFormData,
  FormElement,
  HeaderStyle,
} from "@/lib/worksheet/schema";
import {
  FONT_PAIRINGS,
  EDUCATIONAL_SUBJECT_LABELS,
  GRADE_LEVEL_LABELS,
} from "@/lib/worksheet/schema";

// ━━━ Page Constants (exported for workspace calculations) ━━━
export const PAGE_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
  legal: { w: 816, h: 1344 },
  a5: { w: 559, h: 794 },
};

export const PAGE_GAP = 16;

// ━━━ Google Fonts ━━━
export function getGoogleFontUrl(pairingId: string): string {
  const pair = FONT_PAIRINGS.find((f) => f.id === pairingId);
  if (!pair) return "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
  const families = [pair.heading, pair.body]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@300;400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

function getFontFamily(pairingId: string, type: "heading" | "body" = "body"): string {
  const pair = FONT_PAIRINGS.find((f) => f.id === pairingId);
  if (!pair) return "'Inter', sans-serif";
  const font = type === "heading" ? pair.heading : pair.body;
  return `'${font}', sans-serif`;
}

// ━━━ Margin Helpers ━━━
function getMarginPx(margins: string): { top: number; right: number; bottom: number; left: number } {
  switch (margins) {
    case "narrow": return { top: 36, right: 36, bottom: 36, left: 36 };
    case "wide": return { top: 72, right: 72, bottom: 72, left: 72 };
    default: return { top: 54, right: 54, bottom: 54, left: 54 };
  }
}

function getSectionGap(spacing: number): number {
  return [8, 14, 20, 28, 36][spacing] ?? 20;
}

function getLineHeight(lineSpacing: string): number {
  switch (lineSpacing) {
    case "tight": return 1.3;
    case "loose": return 1.8;
    default: return 1.55;
  }
}

function getFieldHeight(fieldSize: string): number {
  switch (fieldSize) {
    case "compact": return 24;
    case "large": return 40;
    default: return 32;
  }
}

// ━━━ Color Helpers ━━━
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ━━━ Element Counter ━━━
let elementCounter = 0;
function resetCounter() { elementCounter = 0; }
function nextNumber(): number { return ++elementCounter; }

// ━━━ Footer Height ━━━
const FOOTER_H = 36;

// ━━━ Renderer Props ━━━
interface WorksheetRendererProps {
  form: WorksheetFormData;
  onPageCount?: (count: number) => void;
  pageGap?: number;
  showAnswerKey?: boolean;
}

// ━━━ Main Renderer ━━━
export default function WorksheetRenderer({
  form,
  onPageCount,
  pageGap = PAGE_GAP,
  showAnswerKey = false,
}: WorksheetRendererProps) {
  const pageDims = PAGE_PX[form.printConfig.pageSize] ?? PAGE_PX.a4;
  const margin = getMarginPx(form.printConfig.margins);
  const contentHeight = pageDims.h - margin.top - margin.bottom - FOOTER_H;
  const sectionGap = getSectionGap(form.printConfig.sectionSpacing);
  const lineHeight = getLineHeight(form.printConfig.lineSpacing);
  const fieldHeight = getFieldHeight(form.printConfig.fieldSize);
  const accent = form.style.accentColor;
  const headingFont = getFontFamily(form.style.fontPairing, "heading");
  const bodyFont = getFontFamily(form.style.fontPairing, "body");
  const fontUrl = getGoogleFontUrl(form.style.fontPairing);
  const isEducational = form.documentType === "educational-worksheet";

  const visibleSections = form.sections.filter((s) => s.visible);

  // Reset numbering
  resetCounter();

  // Build all main document content once
  const allContent = useMemo(() => {
    resetCounter();
    return (
      <>
        {/* ── Document Header ── */}
        <div data-ws-section="header">
          <HeaderBlock
            form={form}
            accent={accent}
            headingFont={headingFont}
            margin={margin}
            isEducational={isEducational}
            fieldHeight={fieldHeight}
          />
        </div>

        {/* ── Instructions ── */}
        {form.style.showInstructions && form.instructions && (
          <div
            data-ws-section="instructions"
            style={{
              padding: `12px ${margin.right}px 12px ${margin.left}px`,
              background: hexToRgba(accent, 0.04),
              borderLeft: `3px solid ${accent}`,
              margin: `0 ${margin.right}px 16px ${margin.left}px`,
              borderRadius: 4,
              fontSize: form.style.compactMode ? 10.5 : 12,
              color: "#4b5563",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4, color: accent, fontSize: form.style.compactMode ? 10 : 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Instructions
            </div>
            {form.instructions}
          </div>
        )}

        {/* ── Sections ── */}
        <div style={{ padding: `0 ${margin.left}px ${margin.bottom}px` }}>
          {visibleSections.map((section, sIdx) => (
            <div
              key={section.id}
              data-ws-section={`section-${sIdx}`}
              style={{ marginBottom: sectionGap }}
            >
              {/* Section header */}
              <SectionHeader
                title={section.title}
                description={section.description}
                accent={accent}
                headingFont={headingFont}
                headerStyle={form.style.headerStyle}
                compact={form.style.compactMode}
              />

              {/* Elements */}
              <div style={{
                display: section.columns === 2 ? "grid" : "flex",
                gridTemplateColumns: section.columns === 2 ? "1fr 1fr" : undefined,
                gap: section.columns === 2 ? "8px 16px" : "0",
                flexDirection: section.columns === 2 ? undefined : "column",
              }}>
                {section.elements.map((element, eIdx) => (
                  <div
                    key={element.id}
                    data-ws-section={`element-${section.id}-${element.id}`}
                    style={{
                      background: form.style.alternateRowShading && eIdx % 2 === 1
                        ? hexToRgba(accent, 0.02)
                        : undefined,
                      padding: form.style.showBorders ? "8px 10px" : "6px 0",
                      borderBottom: form.style.showBorders ? "1px solid #e5e7eb" : undefined,
                    }}
                  >
                    <ElementRenderer
                      element={element}
                      accent={accent}
                      fieldHeight={fieldHeight}
                      numbered={form.style.numberedElements}
                      showPoints={form.style.showPointValues && isEducational}
                      showAnswerKey={showAnswerKey}
                      bodyFont={bodyFont}
                      compact={form.style.compactMode}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, accent, headingFont, bodyFont, margin.top, margin.right, margin.bottom, margin.left,
      sectionGap, fieldHeight, isEducational, showAnswerKey, visibleSections]);

  // ── Overflow-based page counting (same pattern as BusinessPlanRenderer) ──
  const pagesRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const onPageCountRef = useRef(onPageCount);
  onPageCountRef.current = onPageCount;
  const lastReportedCount = useRef(0);

  useEffect(() => {
    const el = pagesRef.current;
    if (!el) return;
    const totalH = el.scrollHeight;
    const count = Math.max(1, Math.ceil(totalH / contentHeight));
    const hasAnswerKey = form.answerKey.enabled && isEducational;
    const total = count + (hasAnswerKey ? 1 : 0);
    setPageCount(count);
    if (total !== lastReportedCount.current) {
      lastReportedCount.current = total;
      onPageCountRef.current?.(total);
    }
  }, [allContent, contentHeight, form.answerKey.enabled, isEducational]);

  // ── Shared page styles ──
  const pageStyle: React.CSSProperties = {
    width: pageDims.w,
    minHeight: pageDims.h,
    backgroundColor: "#ffffff",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 4px 32px rgba(0, 0, 0, 0.45)",
    fontFamily: bodyFont,
    fontSize: form.style.compactMode ? 11 : 13,
    lineHeight,
    color: "#1f2937",
  };

  return (
    <>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      <div data-ws-pages className="flex flex-col items-center" style={{ gap: pageGap }}>
        {/* ── Content Pages ── */}
        {Array.from({ length: pageCount }, (_, pageIdx) => (
          <div key={`page-${pageIdx}`} data-ws-page={pageIdx + 1} style={pageStyle}>
            {/* Page 0: render content and measure scrollHeight */}
            <div
              ref={pageIdx === 0 ? pagesRef : undefined}
              style={{
                position: pageIdx === 0 ? "relative" : "absolute",
                top: pageIdx === 0 ? 0 : undefined,
                paddingBottom: FOOTER_H,
                width: pageDims.w,
                ...(pageIdx === 0
                  ? {}
                  : { visibility: "hidden", height: 0, overflow: "hidden" }),
              }}
            >
              {pageIdx === 0 && allContent}
            </div>

            {/* Pages > 0: show overflow using negative marginTop clip */}
            {pageIdx > 0 && (
              <div style={{
                width: pageDims.w,
                height: pageDims.h - FOOTER_H,
                overflow: "hidden",
              }}>
                <div style={{ marginTop: -(pageIdx * contentHeight) }}>
                  {allContent}
                </div>
              </div>
            )}

            {/* Footer */}
            {form.style.showPageNumbers && (
              <div
                data-ws-section="footer"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: FOOTER_H,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: `0 ${margin.left}px`,
                  fontSize: 9,
                  color: "#9ca3af",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <span>{form.branding.organization || ""}</span>
                <span>{form.branding.formNumber ? `Form: ${form.branding.formNumber}` : ""}</span>
                <span>Page {pageIdx + 1} of {pageCount}</span>
              </div>
            )}
          </div>
        ))}

        {/* ── Answer Key Page (if enabled) ── */}
        {form.answerKey.enabled && isEducational && (
          <div
            data-ws-page="answer-key"
            style={pageStyle}
          >
            <AnswerKeyPage
              form={form}
              accent={accent}
              headingFont={headingFont}
              margin={margin}
            />
          </div>
        )}
      </div>
    </>
  );
}

// ━━━ Header Block ━━━
function HeaderBlock({
  form, accent, headingFont, margin, isEducational, fieldHeight,
}: {
  form: WorksheetFormData;
  accent: string;
  headingFont: string;
  margin: { top: number; right: number; bottom: number; left: number };
  isEducational: boolean;
  fieldHeight: number;
}) {
  const style = form.style;

  const headerContent = (
    <>
      <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: style.compactMode ? 20 : 26, color: style.headerStyle === "banner" ? "#fff" : "#111827", lineHeight: 1.2 }}>
        {form.title || "Untitled Document"}
      </div>
      {form.branding.subtitle && (
        <div style={{ fontSize: style.compactMode ? 11 : 13, color: style.headerStyle === "banner" ? "rgba(255,255,255,0.85)" : "#6b7280", marginTop: 4 }}>
          {form.branding.subtitle}
        </div>
      )}
      {form.branding.organization && (
        <div style={{ fontSize: style.compactMode ? 10 : 12, color: style.headerStyle === "banner" ? "rgba(255,255,255,0.7)" : "#9ca3af", marginTop: 2, fontWeight: 500 }}>
          {form.branding.organization}
        </div>
      )}

      {/* Metadata row */}
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: style.compactMode ? 9 : 10, color: style.headerStyle === "banner" ? "rgba(255,255,255,0.65)" : "#9ca3af" }}>
        {style.showFormNumber && form.branding.formNumber && <span>Form #: {form.branding.formNumber}</span>}
        {style.showDate && form.branding.date && <span>Date: {form.branding.date}</span>}
        {isEducational && form.subject && <span>Subject: {EDUCATIONAL_SUBJECT_LABELS[form.subject]}</span>}
        {isEducational && form.gradeLevel && <span>Grade: {GRADE_LEVEL_LABELS[form.gradeLevel]}</span>}
        {form.branding.confidentiality && <span>{form.branding.confidentiality}</span>}
      </div>
    </>
  );

  // Educational student info strip
  const studentStrip = isEducational && (form.studentNameField || form.dateField || form.scoreField) ? (
    <div style={{
      display: "flex",
      gap: 24,
      padding: `12px ${margin.left}px`,
      borderBottom: `1px solid ${hexToRgba(accent, 0.2)}`,
      fontSize: 12,
    }}>
      {form.studentNameField && (
        <div style={{ flex: 2, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>Name:</span>
          <div style={{ flex: 1, borderBottom: "1.5px solid #d1d5db", minHeight: fieldHeight }} />
        </div>
      )}
      {form.dateField && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>Date:</span>
          <div style={{ flex: 1, borderBottom: "1.5px solid #d1d5db", minHeight: fieldHeight }} />
        </div>
      )}
      {form.scoreField && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>Score:</span>
          <div style={{ width: 60, height: fieldHeight, border: "1.5px solid #d1d5db", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: "#9ca3af" }}>
            /
          </div>
        </div>
      )}
    </div>
  ) : null;

  switch (style.headerStyle) {
    case "banner":
      return (
        <>
          <div style={{
            background: `linear-gradient(135deg, ${accent}, ${hexToRgba(accent, 0.85)})`,
            padding: `${margin.top}px ${margin.left}px ${style.compactMode ? 20 : 28}px`,
          }}>
            {headerContent}
          </div>
          {studentStrip}
        </>
      );

    case "underline":
      return (
        <>
          <div style={{
            padding: `${margin.top}px ${margin.left}px 16px`,
            borderBottom: `3px solid ${accent}`,
          }}>
            {headerContent}
          </div>
          {studentStrip}
        </>
      );

    case "border":
      return (
        <>
          <div style={{
            padding: `${margin.top}px ${margin.left}px 16px`,
            border: `2px solid ${accent}`,
            margin: `${margin.top}px ${margin.right}px 0 ${margin.left}px`,
            borderRadius: 4,
          }}>
            <div style={{ padding: "0 12px" }}>{headerContent}</div>
          </div>
          {studentStrip}
        </>
      );

    case "boxed":
      return (
        <>
          <div style={{
            padding: `${style.compactMode ? 16 : 24}px ${margin.left}px`,
            margin: `${margin.top}px ${margin.right}px 0 ${margin.left}px`,
            background: hexToRgba(accent, 0.06),
            borderRadius: 8,
            border: `1px solid ${hexToRgba(accent, 0.15)}`,
          }}>
            {headerContent}
          </div>
          {studentStrip}
        </>
      );

    case "playful":
      return (
        <>
          <div style={{
            padding: `${margin.top}px ${margin.left}px ${style.compactMode ? 16 : 24}px`,
            background: `linear-gradient(135deg, ${hexToRgba(accent, 0.08)}, ${hexToRgba(accent, 0.02)})`,
            borderBottom: `4px solid ${accent}`,
            position: "relative",
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: 10, right: margin.right + 10, width: 40, height: 40, borderRadius: "50%", background: hexToRgba(accent, 0.1) }} />
            <div style={{ position: "absolute", top: 30, right: margin.right + 60, width: 20, height: 20, borderRadius: "50%", background: hexToRgba(accent, 0.15) }} />
            {headerContent}
          </div>
          {studentStrip}
        </>
      );

    case "minimal":
    default:
      return (
        <>
          <div style={{
            padding: `${margin.top}px ${margin.left}px 20px`,
          }}>
            {headerContent}
          </div>
          {studentStrip}
        </>
      );
  }
}

// ━━━ Section Header ━━━
function SectionHeader({
  title, description, accent, headingFont, headerStyle, compact,
}: {
  title: string;
  description?: string;
  accent: string;
  headingFont: string;
  headerStyle: HeaderStyle;
  compact: boolean;
}) {
  const titleSize = compact ? 13 : 15;
  const base = { fontFamily: headingFont, fontWeight: 700, fontSize: titleSize, marginBottom: 10 };

  switch (headerStyle) {
    case "banner":
      return (
        <div style={{ ...base, background: hexToRgba(accent, 0.08), padding: "8px 12px", borderRadius: 4, color: "#111827", borderLeft: `4px solid ${accent}` }}>
          {title}
          {description && <div style={{ fontSize: compact ? 10 : 11, fontWeight: 400, color: "#6b7280", marginTop: 2 }}>{description}</div>}
        </div>
      );
    case "underline":
      return (
        <div style={{ ...base, borderBottom: `2px solid ${accent}`, paddingBottom: 6, color: "#111827" }}>
          {title}
          {description && <div style={{ fontSize: compact ? 10 : 11, fontWeight: 400, color: "#6b7280", marginTop: 2 }}>{description}</div>}
        </div>
      );
    case "boxed":
      return (
        <div style={{ ...base, border: `1px solid ${hexToRgba(accent, 0.3)}`, background: hexToRgba(accent, 0.04), padding: "8px 12px", borderRadius: 6, color: "#111827" }}>
          {title}
          {description && <div style={{ fontSize: compact ? 10 : 11, fontWeight: 400, color: "#6b7280", marginTop: 2 }}>{description}</div>}
        </div>
      );
    case "playful":
      return (
        <div style={{ ...base, color: accent, paddingLeft: 8, borderLeft: `4px solid ${accent}`, paddingBottom: 4 }}>
          {title}
          {description && <div style={{ fontSize: compact ? 10 : 11, fontWeight: 400, color: "#6b7280", marginTop: 2 }}>{description}</div>}
        </div>
      );
    case "border":
      return (
        <div style={{ ...base, padding: "6px 10px", border: `1.5px solid ${accent}`, borderRadius: 3, color: "#111827" }}>
          {title}
          {description && <div style={{ fontSize: compact ? 10 : 11, fontWeight: 400, color: "#6b7280", marginTop: 2 }}>{description}</div>}
        </div>
      );
    case "minimal":
    default:
      return (
        <div style={{ ...base, color: "#111827" }}>
          {title}
          {description && <div style={{ fontSize: compact ? 10 : 11, fontWeight: 400, color: "#6b7280", marginTop: 2 }}>{description}</div>}
        </div>
      );
  }
}

// ━━━ Element Renderer ━━━
function ElementRenderer({
  element, accent, fieldHeight, numbered, showPoints, showAnswerKey, bodyFont, compact,
}: {
  element: FormElement;
  accent: string;
  fieldHeight: number;
  numbered: boolean;
  showPoints: boolean;
  showAnswerKey: boolean;
  bodyFont: string;
  compact: boolean;
}) {
  const num = numbered && isNumberable(element.type) ? nextNumber() : null;
  const labelSize = compact ? 11 : 12.5;
  const smallSize = compact ? 9 : 10;

  // Label row with optional numbering and points
  const labelRow = element.label && isLabelable(element.type) ? (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 5 }}>
      {num !== null && (
        <span style={{ fontWeight: 700, color: accent, fontSize: labelSize, minWidth: 18 }}>{num}.</span>
      )}
      <span style={{ fontWeight: 600, color: "#374151", fontSize: labelSize, flex: 1 }}>
        {element.label}
        {element.required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </span>
      {showPoints && element.points !== undefined && element.points > 0 && (
        <span style={{ fontSize: smallSize, color: "#9ca3af", fontWeight: 500, whiteSpace: "nowrap" }}>
          [{element.points} {element.points === 1 ? "pt" : "pts"}]
        </span>
      )}
    </div>
  ) : null;

  // Answer key indicator
  const answerIndicator = showAnswerKey ? (
    <AnswerKeyIndicator element={element} accent={accent} />
  ) : null;

  switch (element.type) {
    case "text-field":
      return (
        <div>
          {labelRow}
          <div style={{ borderBottom: "1.5px solid #d1d5db", height: fieldHeight, position: "relative" }}>
            {showAnswerKey && element.answerKeyContent && (
              <span style={{ position: "absolute", bottom: 4, left: 4, color: accent, fontWeight: 600, fontSize: labelSize }}>{element.answerKeyContent}</span>
            )}
          </div>
        </div>
      );

    case "textarea":
      return (
        <div>
          {labelRow}
          <div style={{ position: "relative" }}>
            {Array.from({ length: element.lineCount ?? 4 }).map((_, i) => (
              <div key={i} style={{ borderBottom: "1px solid #e5e7eb", height: fieldHeight * 0.85, marginTop: i === 0 ? 0 : 2 }} />
            ))}
            {showAnswerKey && element.answerKeyContent && (
              <div style={{ position: "absolute", top: 4, left: 4, color: accent, fontWeight: 500, fontSize: 11 }}>{element.answerKeyContent}</div>
            )}
          </div>
        </div>
      );

    case "checkbox":
      return (
        <div>
          {labelRow}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: num !== null ? 24 : 0 }}>
            {(element.options ?? []).map((opt) => (
              <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 14, height: 14, border: "1.5px solid #9ca3af", borderRadius: 3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: showAnswerKey && opt.isCorrect ? hexToRgba(accent, 0.15) : undefined,
                }}>
                  {showAnswerKey && opt.isCorrect && <span style={{ color: accent, fontWeight: 700, fontSize: 10 }}>✓</span>}
                </div>
                <span style={{ fontSize: compact ? 11 : 12, color: "#374151" }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "radio-group":
      return (
        <div>
          {labelRow}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: num !== null ? 24 : 0 }}>
            {(element.options ?? []).map((opt) => (
              <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 14, height: 14, border: "1.5px solid #9ca3af", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: showAnswerKey && opt.isCorrect ? hexToRgba(accent, 0.15) : undefined,
                }}>
                  {showAnswerKey && opt.isCorrect && <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />}
                </div>
                <span style={{ fontSize: compact ? 11 : 12, color: "#374151" }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "dropdown":
      return (
        <div>
          {labelRow}
          <div style={{
            height: fieldHeight, border: "1.5px solid #d1d5db", borderRadius: 4, padding: "0 10px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontSize: compact ? 10 : 11, color: "#9ca3af",
          }}>
            <span>{element.placeholder ?? "Select..."}</span>
            <span>▾</span>
          </div>
        </div>
      );

    case "date-field":
      return (
        <div>
          {labelRow}
          <div style={{
            height: fieldHeight, borderBottom: "1.5px solid #d1d5db",
            display: "flex", alignItems: "center", gap: 8,
            fontSize: compact ? 10 : 11, color: "#9ca3af",
          }}>
            <span style={{ fontSize: 12 }}>📅</span>
            <span>{element.placeholder ?? "DD / MM / YYYY"}</span>
          </div>
        </div>
      );

    case "number-field":
      return (
        <div>
          {labelRow}
          <div style={{
            width: 120, height: fieldHeight, borderBottom: "1.5px solid #d1d5db",
            display: "flex", alignItems: "center",
            fontSize: compact ? 10 : 11, color: "#9ca3af",
          }}>
            {element.placeholder ?? "0"}
          </div>
        </div>
      );

    case "signature-block":
      return (
        <div>
          {labelRow}
          <div style={{ display: "flex", gap: 32, paddingTop: 8, flexWrap: "wrap" }}>
            {(element.signatureFields ?? [{ id: "1", role: "Signature", showDate: true }]).map((sig) => (
              <div key={sig.id} style={{ flex: "1 1 200px", minWidth: 180 }}>
                <div style={{ height: 50, borderBottom: "1.5px solid #374151", marginBottom: 6 }} />
                <div style={{ fontSize: compact ? 9 : 10, color: "#6b7280", fontWeight: 500 }}>{sig.role}</div>
                {sig.showDate && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ height: 24, borderBottom: "1px solid #d1d5db", marginBottom: 4 }} />
                    <div style={{ fontSize: compact ? 8 : 9, color: "#9ca3af" }}>Date</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "rating-scale":
      return (
        <div>
          {labelRow}
          <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: num !== null ? 24 : 0 }}>
            {element.ratingLabels?.min && (
              <span style={{ fontSize: smallSize, color: "#9ca3af", marginRight: 4 }}>{element.ratingLabels.min}</span>
            )}
            {Array.from({ length: (element.ratingMax ?? 5) - (element.ratingMin ?? 1) + 1 }).map((_, i) => (
              <div key={i} style={{
                width: compact ? 24 : 28, height: compact ? 24 : 28,
                border: "1.5px solid #9ca3af", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: compact ? 9 : 10, fontWeight: 600, color: "#6b7280",
              }}>
                {(element.ratingMin ?? 1) + i}
              </div>
            ))}
            {element.ratingLabels?.max && (
              <span style={{ fontSize: smallSize, color: "#9ca3af", marginLeft: 4 }}>{element.ratingLabels.max}</span>
            )}
          </div>
          {answerIndicator}
        </div>
      );

    case "likert-scale":
      return (
        <div>
          {labelRow}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: compact ? 10 : 11 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600, color: "#374151", borderBottom: `2px solid ${accent}` }}>&nbsp;</th>
                {(element.likertLabels ?? []).map((label, i) => (
                  <th key={i} style={{ padding: "4px 4px", fontWeight: 500, color: "#6b7280", fontSize: compact ? 8 : 9, textAlign: "center", borderBottom: `2px solid ${accent}`, maxWidth: 70 }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(element.likertStatements ?? []).map((stmt, sIdx) => (
                <tr key={stmt.id} style={{ background: sIdx % 2 === 1 ? hexToRgba(accent, 0.03) : undefined }}>
                  <td style={{ padding: "6px 8px", color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{stmt.text}</td>
                  {(element.likertLabels ?? []).map((_, lIdx) => (
                    <td key={lIdx} style={{ textAlign: "center", padding: "6px 4px", borderBottom: "1px solid #f3f4f6" }}>
                      <div style={{ width: 14, height: 14, border: "1.5px solid #9ca3af", borderRadius: "50%", margin: "0 auto" }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {answerIndicator}
        </div>
      );

    case "table":
      return (
        <div>
          {labelRow}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: compact ? 10 : 11, border: "1px solid #d1d5db" }}>
            <thead>
              <tr>
                {(element.tableColumns ?? []).map((col) => (
                  <th key={col.id} style={{
                    padding: "6px 8px", fontWeight: 600, color: "#fff",
                    background: accent, borderBottom: "2px solid " + accent,
                    textAlign: "left", fontSize: compact ? 9 : 10,
                    width: col.width ? `${col.width}%` : undefined,
                  }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: element.tableRows ?? 5 }).map((_, rIdx) => (
                <tr key={rIdx} style={{ background: rIdx % 2 === 1 ? hexToRgba(accent, 0.03) : undefined }}>
                  {(element.tableColumns ?? []).map((col, cIdx) => (
                    <td key={col.id} style={{
                      padding: "6px 8px", borderBottom: "1px solid #e5e7eb",
                      height: fieldHeight, color: "#374151",
                    }}>
                      {element.tableData?.[rIdx]?.[cIdx] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "heading":
      return (
        <div style={{
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: element.headingLevel === 1 ? 18 : element.headingLevel === 3 ? 13 : 15,
          color: "#111827",
          paddingTop: 8,
          paddingBottom: 4,
        }}>
          {element.content ?? "Heading"}
        </div>
      );

    case "paragraph":
      return (
        <div style={{ fontSize: compact ? 11 : 12, color: "#4b5563", lineHeight: 1.6, padding: "4px 0" }}>
          {element.content ?? ""}
        </div>
      );

    case "divider":
      return <hr style={{ border: "none", borderTop: "1.5px solid #e5e7eb", margin: "10px 0" }} />;

    case "spacer":
      return <div style={{ height: element.spacerHeight ?? 20 }} />;

    case "image-placeholder":
      return (
        <div>
          {labelRow}
          <div style={{
            width: "100%", height: 160, border: "2px dashed #d1d5db", borderRadius: 8,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "#9ca3af", fontSize: compact ? 10 : 11,
          }}>
            <span style={{ fontSize: 24, marginBottom: 6 }}>🖼️</span>
            {element.diagramImageCaption ?? "Image or Diagram"}
          </div>
        </div>
      );

    case "fill-in-blank":
      return (
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
            {num !== null && <span style={{ fontWeight: 700, color: accent, fontSize: labelSize, minWidth: 18 }}>{num}.</span>}
            {showPoints && element.points !== undefined && element.points > 0 && (
              <span style={{ fontSize: smallSize, color: "#9ca3af", fontWeight: 500, marginLeft: "auto" }}>
                [{element.points} {element.points === 1 ? "pt" : "pts"}]
              </span>
            )}
          </div>
          <div style={{ fontSize: compact ? 11 : 13, color: "#374151", lineHeight: 1.8 }}>
            {renderFillInBlank(element.sentence ?? "", showAnswerKey ? element.answers : undefined, accent)}
          </div>
        </div>
      );

    case "multiple-choice":
      return (
        <div>
          {labelRow}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingLeft: num !== null ? 24 : 0 }}>
            {(element.options ?? []).map((opt, i) => (
              <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: compact ? 18 : 22, height: compact ? 18 : 22,
                  border: `1.5px solid ${showAnswerKey && opt.isCorrect ? accent : "#9ca3af"}`,
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: compact ? 9 : 10, fontWeight: 700,
                  color: showAnswerKey && opt.isCorrect ? "#fff" : "#6b7280",
                  background: showAnswerKey && opt.isCorrect ? accent : undefined,
                }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span style={{ fontSize: compact ? 11 : 12, color: "#374151" }}>{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "matching-columns":
      return (
        <div>
          {labelRow}
          <div style={{ display: "flex", gap: 32, paddingLeft: num !== null ? 24 : 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: smallSize, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Column A</div>
              {(element.matchingPairs ?? []).map((pair, i) => (
                <div key={pair.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: accent, fontSize: compact ? 10 : 11 }}>{i + 1}.</span>
                  <span style={{ fontSize: compact ? 11 : 12, color: "#374151" }}>{pair.left}</span>
                  <div style={{ flex: 1, borderBottom: "1px dashed #d1d5db", minWidth: 40 }} />
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: smallSize, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Column B</div>
              {shuffleForDisplay(element.matchingPairs ?? []).map((pair, i) => (
                <div key={pair.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: "#6b7280", fontSize: compact ? 10 : 11 }}>{String.fromCharCode(65 + i)}.</span>
                  <span style={{ fontSize: compact ? 11 : 12, color: "#374151" }}>
                    {showAnswerKey ? `${pair.right} → ${pair.left}` : pair.right}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case "word-bank":
      return (
        <div>
          {labelRow}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 14px",
            background: hexToRgba(accent, 0.05), border: `1.5px dashed ${hexToRgba(accent, 0.3)}`,
            borderRadius: 6,
          }}>
            {(element.words ?? []).map((word, i) => (
              <span key={i} style={{
                padding: "3px 12px", background: "#fff", borderRadius: 12,
                border: "1px solid #e5e7eb", fontSize: compact ? 10 : 12,
                fontWeight: 500, color: "#374151",
              }}>
                {word}
              </span>
            ))}
          </div>
        </div>
      );

    case "numbered-list":
      return (
        <div>
          {labelRow}
          <div style={{ paddingLeft: num !== null ? 24 : 0 }}>
            {(element.items ?? []).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, color: "#6b7280", fontSize: compact ? 10 : 11, minWidth: 18 }}>{i + 1}.</span>
                <span style={{ fontSize: compact ? 11 : 12, color: "#374151" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "lined-writing":
      return (
        <div>
          {labelRow}
          <div style={{ paddingLeft: num !== null ? 24 : 0, paddingTop: 4 }}>
            {Array.from({ length: element.lineCount ?? 8 }).map((_, i) => (
              <div key={i} style={{
                borderBottom: "1px solid #d1d5db",
                height: compact ? 28 : 34,
                position: "relative",
              }}>
                {/* Dashed midline for primary/kindergarten */}
                {!compact && (
                  <div style={{
                    position: "absolute", bottom: "50%", left: 0, right: 0,
                    borderBottom: "1px dashed #e5e7eb",
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "math-grid":
      return (
        <div>
          {labelRow}
          <div style={{ overflow: "auto", paddingLeft: num !== null ? 24 : 0 }}>
            <table style={{ borderCollapse: "collapse" }}>
              <tbody>
                {Array.from({ length: element.gridRows ?? 10 }).map((_, rIdx) => (
                  <tr key={rIdx}>
                    {Array.from({ length: element.gridCols ?? 10 }).map((_, cIdx) => (
                      <td key={cIdx} style={{
                        width: compact ? 20 : 26,
                        height: compact ? 20 : 26,
                        border: "1px solid #d1d5db",
                        textAlign: "center",
                        fontSize: 8,
                        color: element.gridType === "numbered" ? "#9ca3af" : "transparent",
                      }}>
                        {element.gridType === "numbered" ? rIdx * (element.gridCols ?? 10) + cIdx + 1 : ""}
                        {element.gridType === "coordinate" && rIdx === 0 && cIdx > 0 ? cIdx : ""}
                        {element.gridType === "coordinate" && cIdx === 0 && rIdx > 0 ? rIdx : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "diagram-label":
      return (
        <div>
          {labelRow}
          <div style={{
            width: "100%", height: 180, border: "2px dashed #d1d5db", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#9ca3af", fontSize: compact ? 10 : 12, marginBottom: 8,
            position: "relative",
          }}>
            <span>🏷️ {element.diagramImageCaption ?? "Diagram"}</span>
            {/* Label markers */}
            {(element.diagramLabels ?? []).map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                top: 10 + (i * 30) % 150,
                right: 10 + (i * 40) % 100,
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${accent}`, background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: accent,
              }}>
                {i + 1}
              </div>
            ))}
          </div>
          <div style={{ paddingLeft: num !== null ? 24 : 0 }}>
            {(element.diagramLabels ?? []).map((label, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: accent, fontSize: compact ? 10 : 11 }}>{i + 1}.</span>
                {showAnswerKey ? (
                  <span style={{ fontSize: compact ? 11 : 12, color: accent, fontWeight: 600 }}>{label}</span>
                ) : (
                  <div style={{ flex: 1, borderBottom: "1.5px solid #d1d5db", height: 20 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "true-false":
      return (
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
            {num !== null && <span style={{ fontWeight: 700, color: accent, fontSize: labelSize, minWidth: 18 }}>{num}.</span>}
            <span style={{ fontSize: compact ? 11 : 12.5, color: "#374151", flex: 1 }}>{element.statement}</span>
            {showPoints && element.points !== undefined && (
              <span style={{ fontSize: smallSize, color: "#9ca3af", fontWeight: 500, whiteSpace: "nowrap" }}>
                [{element.points} pt]
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, paddingLeft: num !== null ? 24 : 0, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 14, height: 14, border: "1.5px solid #9ca3af", borderRadius: "50%",
                background: showAnswerKey && element.correctAnswer === true ? accent : undefined,
              }}>
                {showAnswerKey && element.correctAnswer === true && (
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 8, fontWeight: 700 }}>✓</span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: compact ? 10 : 11, color: "#374151" }}>True</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 14, height: 14, border: "1.5px solid #9ca3af", borderRadius: "50%",
                background: showAnswerKey && element.correctAnswer === false ? accent : undefined,
              }}>
                {showAnswerKey && element.correctAnswer === false && (
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 8, fontWeight: 700 }}>✓</span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: compact ? 10 : 11, color: "#374151" }}>False</span>
            </div>
          </div>
        </div>
      );

    case "short-answer":
      return (
        <div>
          {labelRow}
          <div style={{ paddingLeft: num !== null ? 24 : 0 }}>
            {Array.from({ length: element.answerLines ?? 3 }).map((_, i) => (
              <div key={i} style={{ borderBottom: "1px solid #d1d5db", height: fieldHeight * 0.85, marginTop: i === 0 ? 0 : 2 }} />
            ))}
            {showAnswerKey && element.answerKeyContent && (
              <div style={{ color: accent, fontWeight: 500, fontSize: 11, marginTop: 4, fontStyle: "italic" }}>
                Answer: {element.answerKeyContent}
              </div>
            )}
          </div>
        </div>
      );

    case "reading-passage":
      return (
        <div>
          {element.passageTitle && (
            <div style={{ fontWeight: 700, fontSize: compact ? 13 : 15, color: "#111827", marginBottom: 6 }}>
              {element.passageTitle}
            </div>
          )}
          <div style={{
            padding: "12px 16px", background: hexToRgba(accent, 0.04),
            borderLeft: `3px solid ${accent}`, borderRadius: 4,
            fontSize: compact ? 11 : 12.5, color: "#374151", lineHeight: 1.7,
            fontStyle: "italic",
          }}>
            {element.passageText ?? ""}
          </div>
        </div>
      );

    default:
      return (
        <div style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>
          Unknown element type: {element.type}
        </div>
      );
  }
}

// ━━━ Answer Key Page ━━━
function AnswerKeyPage({
  form, accent, headingFont, margin,
}: {
  form: WorksheetFormData;
  accent: string;
  headingFont: string;
  margin: { top: number; right: number; bottom: number; left: number };
}) {
  const visibleSections = form.sections.filter((s) => s.visible);

  // Collect all answerable elements
  const answerable: Array<{ num: number; label: string; answer: string; points?: number }> = [];
  let counter = 0;

  for (const section of visibleSections) {
    for (const el of section.elements) {
      if (!isNumberable(el.type)) continue;
      counter++;

      let answer = "";
      if (el.type === "multiple-choice" || el.type === "radio-group") {
        const correct = el.options?.find((o) => o.isCorrect);
        answer = correct ? correct.label : "—";
      } else if (el.type === "true-false") {
        answer = el.correctAnswer === true ? "True" : el.correctAnswer === false ? "False" : "—";
      } else if (el.type === "fill-in-blank") {
        answer = el.answers?.join(", ") ?? "—";
      } else if (el.type === "matching-columns") {
        answer = (el.matchingPairs ?? []).map((p, i) => `${i + 1} → ${String.fromCharCode(65 + i)}`).join(", ");
      } else if (el.type === "diagram-label") {
        answer = (el.diagramLabels ?? []).map((l, i) => `${i + 1}. ${l}`).join("; ");
      } else if (el.answerKeyContent) {
        answer = el.answerKeyContent;
      } else {
        continue; // Skip elements without answers
      }

      answerable.push({ num: counter, label: el.label, answer, points: el.points });
    }
  }

  const totalPoints = answerable.reduce((sum, a) => sum + (a.points ?? 0), 0);

  return (
    <div style={{ padding: `${margin.top}px ${margin.left}px ${margin.bottom}px` }}>
      {/* Answer Key Header */}
      <div style={{
        textAlign: "center", marginBottom: 24,
        borderBottom: `3px solid ${accent}`, paddingBottom: 16,
      }}>
        <div style={{ fontFamily: headingFont, fontWeight: 700, fontSize: 22, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {form.answerKey.headerText || "ANSWER KEY"}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginTop: 6 }}>
          {form.title}
        </div>
        {totalPoints > 0 && form.answerKey.showPoints && (
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
            Total Points: {totalPoints}
          </div>
        )}
      </div>

      {/* Answer List */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, borderBottom: `2px solid ${accent}`, color: "#374151", width: 40 }}>#</th>
            <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, borderBottom: `2px solid ${accent}`, color: "#374151" }}>Question</th>
            <th style={{ textAlign: "left", padding: "8px 10px", fontWeight: 600, borderBottom: `2px solid ${accent}`, color: "#374151" }}>Answer</th>
            {form.answerKey.showPoints && (
              <th style={{ textAlign: "center", padding: "8px 10px", fontWeight: 600, borderBottom: `2px solid ${accent}`, color: "#374151", width: 60 }}>Points</th>
            )}
          </tr>
        </thead>
        <tbody>
          {answerable.map((item, idx) => (
            <tr key={idx} style={{ background: idx % 2 === 1 ? hexToRgba(accent, 0.03) : undefined }}>
              <td style={{ padding: "6px 10px", borderBottom: "1px solid #f3f4f6", fontWeight: 700, color: accent }}>{item.num}</td>
              <td style={{ padding: "6px 10px", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>{item.label}</td>
              <td style={{ padding: "6px 10px", borderBottom: "1px solid #f3f4f6", color: accent, fontWeight: 600 }}>{item.answer}</td>
              {form.answerKey.showPoints && (
                <td style={{ padding: "6px 10px", borderBottom: "1px solid #f3f4f6", textAlign: "center", color: "#6b7280" }}>{item.points ?? "—"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ━━━ Answer Key Indicator ━━━
function AnswerKeyIndicator({ element, accent }: { element: FormElement; accent: string }) {
  if (!element.answerKeyContent) return null;
  return (
    <div style={{ marginTop: 4, fontSize: 10, color: accent, fontStyle: "italic" }}>
      Answer: {element.answerKeyContent}
    </div>
  );
}

// ━━━ Helpers ━━━

function isNumberable(type: string): boolean {
  return [
    "text-field", "textarea", "checkbox", "radio-group", "dropdown",
    "date-field", "number-field", "rating-scale", "likert-scale",
    "fill-in-blank", "multiple-choice", "matching-columns", "true-false",
    "short-answer", "reading-passage",
  ].includes(type);
}

function isLabelable(type: string): boolean {
  return type !== "heading" && type !== "paragraph" && type !== "divider" && type !== "spacer";
}

function renderFillInBlank(sentence: string, answers: string[] | undefined, accent: string): React.JSX.Element[] {
  const parts = sentence.split(/(____+)/g);
  let answerIdx = 0;

  return parts.map((part, i) => {
    if (/^____+$/.test(part)) {
      const answer = answers?.[answerIdx];
      answerIdx++;
      if (answer) {
        return (
          <span key={i} style={{ borderBottom: `2px solid ${accent}`, padding: "0 8px", fontWeight: 600, color: accent }}>
            {answer}
          </span>
        );
      }
      return (
        <span key={i} style={{ display: "inline-block", width: 100, borderBottom: "1.5px solid #d1d5db", margin: "0 4px" }}>
          &nbsp;
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function shuffleForDisplay<T>(arr: T[]): T[] {
  // Deterministic "shuffle" — just reverse for answer key mismatch
  return [...arr].reverse();
}
