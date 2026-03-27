// =============================================================================
// DMSuite — Business Plan Document Renderer (Paginated)
// Measurement-based pagination. Each page is a discrete <div> with exact
// dimensions for print-perfect output. Content blocks are measured in a hidden
// container, bin-packed into pages, and rendered with per-page decorations &
// footers showing "Page X of N".
// =============================================================================

"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import type { BusinessPlanFormData, SectionKey } from "@/lib/business-plan/schema";
import {
  FONT_PAIRINGS,
  SECTION_CONFIGS,
} from "@/lib/business-plan/schema";
import {
  scaledFontSize,
  scaledSectionGap,
} from "@/stores/advanced-helpers";

// ---------------------------------------------------------------------------
// Constants — exported for workspace scroll calculations
// ---------------------------------------------------------------------------

export const PAGE_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
  legal: { w: 816, h: 1344 },
  a5: { w: 559, h: 794 },
};

const MARGIN_MAP = { narrow: 36, standard: 50, wide: 64 };
const LINE_HEIGHT_MAP = { tight: 1.4, normal: 1.6, loose: 1.9 };
const FOOTER_H = 40;
export const PAGE_GAP = 16;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFonts(fontPairingId: string) {
  const fp = FONT_PAIRINGS.find((f) => f.id === fontPairingId) ?? FONT_PAIRINGS[0];
  return { heading: fp.heading, body: fp.body };
}

export function getGoogleFontUrl(fontPairingId: string): string {
  const fp = FONT_PAIRINGS.find((f) => f.id === fontPairingId) ?? FONT_PAIRINGS[0];
  const families = new Set([fp.heading, fp.body]);
  const params = [...families]
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function luminance(hex: string): number {
  const c = hex.replace("#", "").slice(0, 6);
  if (c.length < 6) return 0;
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const srgb = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastText(bgHex: string): string {
  return luminance(bgHex) > 0.35 ? "#1a1a1a" : "#ffffff";
}

function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "").slice(0, 6);
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function formatParagraphs(text: string): React.ReactNode[] {
  if (!text) return [];
  return text.split("\n").filter(Boolean).map((p, i) => (
    <p key={i} style={{ margin: "0 0 8px 0" }}>{p}</p>
  ));
}

// ---------------------------------------------------------------------------
// Cover Page Variants
// ---------------------------------------------------------------------------

interface CoverProps {
  form: BusinessPlanFormData;
  fonts: { heading: string; body: string };
  accent: string;
  pageW: number;
  pageH: number;
  margin: number;
}

function CoverExecutive({ form, fonts, accent, pageW, pageH, margin }: CoverProps) {
  return (
    <div data-bp-page="cover" data-bp-section="cover" style={{ width: pageW, height: pageH, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", pageBreakAfter: "always" }}>
      {/* Top accent band */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "8px", background: accent }} />

      {/* Side accent stripe */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: accent }} />

      <div style={{ position: "absolute", top: margin + 40, left: margin + 20, right: margin + 20, bottom: margin }}>
        {/* Company name */}
        {form.companyName && (
          <div style={{ fontSize: scaledFontSize(13, "label"), fontFamily: `'${fonts.body}', sans-serif`, fontWeight: 600, color: accent, letterSpacing: "3px", textTransform: "uppercase", marginBottom: 50 }}>
            {form.companyName}
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontSize: scaledFontSize(36, "heading"), fontFamily: `'${fonts.heading}', serif`, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.15, margin: "0 0 16px 0", maxWidth: "85%" }}>
          {form.title || "Business Plan"}
        </h1>

        {form.subtitle && (
          <p style={{ fontSize: scaledFontSize(16, "body"), fontFamily: `'${fonts.body}', sans-serif`, color: "#64748b", margin: "0 0 40px 0", lineHeight: 1.5 }}>
            {form.subtitle}
          </p>
        )}

        {/* Accent divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
          <div style={{ height: 3, width: 60, backgroundColor: accent }} />
          <div style={{ height: 1, width: 200, backgroundColor: "#e2e8f0" }} />
        </div>

        {/* Meta info */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 20px", fontSize: scaledFontSize(12, "body"), fontFamily: `'${fonts.body}', sans-serif`, color: "#475569" }}>
          {form.preparedFor && <><span style={{ fontWeight: 600, color: "#1e293b" }}>Prepared For</span><span>{form.preparedFor}</span></>}
          {form.preparedBy && <><span style={{ fontWeight: 600, color: "#1e293b" }}>Prepared By</span><span>{form.preparedBy}</span></>}
          {form.date && <><span style={{ fontWeight: 600, color: "#1e293b" }}>Date</span><span>{form.date}</span></>}
          {form.version && <><span style={{ fontWeight: 600, color: "#1e293b" }}>Version</span><span>{form.version}</span></>}
        </div>

        <div style={{ flex: 1 }} />

        {/* Confidential badge */}
        {form.confidential && (
          <div style={{ position: "absolute", bottom: 40, left: 0, fontSize: 10, fontWeight: 700, color: accent, letterSpacing: "2px", textTransform: "uppercase", borderTop: `2px solid ${accent}`, paddingTop: 8 }}>
            CONFIDENTIAL
          </div>
        )}
      </div>
    </div>
  );
}

function CoverModern({ form, fonts, accent, pageW, pageH, margin }: CoverProps) {
  return (
    <div data-bp-page="cover" data-bp-section="cover" style={{ width: pageW, height: pageH, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", pageBreakAfter: "always" }}>
      {/* Large accent circle decoration */}
      <div style={{ position: "absolute", top: -120, right: -120, width: 400, height: 400, borderRadius: "50%", background: hexToRgba(accent, 0.08) }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: hexToRgba(accent, 0.05) }} />

      <div style={{ position: "absolute", top: margin + 60, left: margin + 30, right: margin + 30, bottom: margin + 20, display: "flex", flexDirection: "column" }}>
        {form.companyName && (
          <div style={{ fontSize: scaledFontSize(14, "label"), fontFamily: `'${fonts.heading}', sans-serif`, fontWeight: 700, color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 60 }}>
            {form.companyName}
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: scaledFontSize(42, "heading"), fontFamily: `'${fonts.heading}', serif`, fontWeight: 800, color: "#0f172a", lineHeight: 1.1, margin: "0 0 20px 0" }}>
            {form.title || "Business Plan"}
          </h1>
          {form.subtitle && (
            <p style={{ fontSize: scaledFontSize(16, "body"), fontFamily: `'${fonts.body}', sans-serif`, color: "#64748b", margin: "0 0 40px 0", maxWidth: "80%" }}>
              {form.subtitle}
            </p>
          )}
          <div style={{ width: 80, height: 4, backgroundColor: accent, borderRadius: 2 }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: scaledFontSize(11, "body"), fontFamily: `'${fonts.body}', sans-serif`, color: "#64748b" }}>
          <div>
            {form.preparedBy && <div>Prepared by <strong style={{ color: "#1e293b" }}>{form.preparedBy}</strong></div>}
            {form.preparedFor && <div style={{ marginTop: 4 }}>For <strong style={{ color: "#1e293b" }}>{form.preparedFor}</strong></div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {form.date && <div>{form.date}</div>}
            {form.version && <div>v{form.version}</div>}
            {form.confidential && <div style={{ color: accent, fontWeight: 700, marginTop: 4, letterSpacing: "1px", textTransform: "uppercase", fontSize: 9 }}>Confidential</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CoverMinimal({ form, fonts, accent, pageW, pageH, margin }: CoverProps) {
  return (
    <div data-bp-page="cover" data-bp-section="cover" style={{ width: pageW, height: pageH, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", pageBreakAfter: "always" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: margin + 40 }}>
        {form.companyName && (
          <div style={{ fontSize: scaledFontSize(12, "label"), fontFamily: `'${fonts.body}', sans-serif`, color: "#94a3b8", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 30 }}>
            {form.companyName}
          </div>
        )}
        <h1 style={{ fontSize: scaledFontSize(32, "heading"), fontFamily: `'${fonts.heading}', serif`, fontWeight: 700, color: "#1e293b", textAlign: "center", lineHeight: 1.2, margin: "0 0 12px 0" }}>
          {form.title || "Business Plan"}
        </h1>
        {form.subtitle && (
          <p style={{ fontSize: scaledFontSize(14, "body"), color: "#64748b", textAlign: "center", margin: "0 0 30px 0" }}>
            {form.subtitle}
          </p>
        )}
        <div style={{ width: 40, height: 2, backgroundColor: accent, marginBottom: 30 }} />
        <div style={{ textAlign: "center", fontSize: scaledFontSize(11, "body"), fontFamily: `'${fonts.body}', sans-serif`, color: "#94a3b8", lineHeight: 1.8 }}>
          {form.preparedBy && <div>{form.preparedBy}</div>}
          {form.date && <div>{form.date}</div>}
          {form.confidential && <div style={{ color: accent, fontWeight: 600, marginTop: 8, letterSpacing: "2px", textTransform: "uppercase", fontSize: 9 }}>Confidential</div>}
        </div>
      </div>
    </div>
  );
}

function CoverBold({ form, fonts, accent, pageW, pageH }: CoverProps) {
  const textCol = contrastText(accent);
  return (
    <div data-bp-page="cover" data-bp-section="cover" style={{ width: pageW, height: pageH, position: "relative", overflow: "hidden", backgroundColor: accent, pageBreakAfter: "always" }}>
      {/* Decorative shapes */}
      <div style={{ position: "absolute", top: -50, right: -50, width: 250, height: 250, borderRadius: "50%", border: `2px solid ${hexToRgba(textCol, 0.1)}` }} />
      <div style={{ position: "absolute", bottom: 100, left: -40, width: 180, height: 180, borderRadius: "50%", border: `2px solid ${hexToRgba(textCol, 0.08)}` }} />

      <div style={{ position: "absolute", top: 60, left: 60, right: 60, bottom: 60, display: "flex", flexDirection: "column" }}>
        {form.companyName && (
          <div style={{ fontSize: scaledFontSize(13, "label"), fontFamily: `'${fonts.body}', sans-serif`, fontWeight: 700, color: hexToRgba(textCol, 0.7), letterSpacing: "3px", textTransform: "uppercase" }}>
            {form.companyName}
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h1 style={{ fontSize: scaledFontSize(48, "heading"), fontFamily: `'${fonts.heading}', serif`, fontWeight: 900, color: textCol, lineHeight: 1.05, margin: "0 0 20px 0", textTransform: "uppercase" }}>
            {form.title || "Business Plan"}
          </h1>
          {form.subtitle && (
            <p style={{ fontSize: scaledFontSize(16, "body"), fontFamily: `'${fonts.body}', sans-serif`, color: hexToRgba(textCol, 0.8), margin: "0 0 30px 0" }}>
              {form.subtitle}
            </p>
          )}
          <div style={{ width: 60, height: 4, backgroundColor: textCol, opacity: 0.4, borderRadius: 2 }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: scaledFontSize(11, "body"), fontFamily: `'${fonts.body}', sans-serif`, color: hexToRgba(textCol, 0.7) }}>
          <div>
            {form.preparedFor && <div>Prepared for {form.preparedFor}</div>}
            {form.preparedBy && <div style={{ marginTop: 2 }}>By {form.preparedBy}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {form.date && <div>{form.date}</div>}
            {form.confidential && <div style={{ fontWeight: 700, marginTop: 2, letterSpacing: "1px", textTransform: "uppercase", fontSize: 9 }}>Confidential</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

const COVER_MAP: Record<string, React.FC<CoverProps>> = {
  executive: CoverExecutive,
  modern: CoverModern,
  minimal: CoverMinimal,
  bold: CoverBold,
};

// ---------------------------------------------------------------------------
// Section Header Styles
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  title: string;
  number: number;
  accent: string;
  fonts: { heading: string; body: string };
  headerStyle: string;
}

function SectionHeader({ title, number, accent, fonts, headerStyle }: SectionHeaderProps) {
  const numStr = String(number).padStart(2, "0");

  if (headerStyle === "banner") {
    return (
      <div style={{ background: accent, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: scaledFontSize(11, "label"), fontWeight: 700, color: hexToRgba(contrastText(accent), 0.5), fontFamily: `'${fonts.body}', sans-serif` }}>{numStr}</span>
        <h2 style={{ fontSize: scaledFontSize(16, "heading"), fontWeight: 700, color: contrastText(accent), fontFamily: `'${fonts.heading}', serif`, margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>{title}</h2>
      </div>
    );
  }

  if (headerStyle === "underline") {
    return (
      <div style={{ marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${accent}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: scaledFontSize(24, "heading"), fontWeight: 800, color: accent, fontFamily: `'${fonts.heading}', serif` }}>{numStr}</span>
          <h2 style={{ fontSize: scaledFontSize(18, "heading"), fontWeight: 700, color: "#1e293b", fontFamily: `'${fonts.heading}', serif`, margin: 0 }}>{title}</h2>
        </div>
      </div>
    );
  }

  if (headerStyle === "sidebar") {
    return (
      <div style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
        <div style={{ width: 4, minHeight: 40, backgroundColor: accent, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: scaledFontSize(10, "label"), fontWeight: 600, color: accent, fontFamily: `'${fonts.body}', sans-serif`, letterSpacing: "2px", textTransform: "uppercase" }}>Section {numStr}</span>
          <h2 style={{ fontSize: scaledFontSize(18, "heading"), fontWeight: 700, color: "#1e293b", fontFamily: `'${fonts.heading}', serif`, margin: "2px 0 0 0" }}>{title}</h2>
        </div>
      </div>
    );
  }

  if (headerStyle === "boxed") {
    return (
      <div style={{ border: `2px solid ${accent}`, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 32, height: 32, backgroundColor: accent, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: scaledFontSize(12, "label"), fontWeight: 800, color: contrastText(accent), fontFamily: `'${fonts.body}', monospace` }}>{numStr}</span>
        </div>
        <h2 style={{ fontSize: scaledFontSize(16, "heading"), fontWeight: 700, color: "#1e293b", fontFamily: `'${fonts.heading}', serif`, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{title}</h2>
      </div>
    );
  }

  // minimal
  return (
    <div style={{ marginBottom: 14 }}>
      <span style={{ fontSize: scaledFontSize(10, "label"), fontWeight: 600, color: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase", fontFamily: `'${fonts.body}', sans-serif` }}>Section {numStr}</span>
      <h2 style={{ fontSize: scaledFontSize(18, "heading"), fontWeight: 700, color: "#1e293b", fontFamily: `'${fonts.heading}', serif`, margin: "4px 0 0 0" }}>{title}</h2>
      <div style={{ width: 30, height: 2, backgroundColor: accent, marginTop: 6, borderRadius: 1 }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SWOT Grid
// ---------------------------------------------------------------------------

function SwotGrid({ swot, fonts }: { swot: BusinessPlanFormData["swot"]; fonts: { heading: string; body: string } }) {
  const quads: { label: string; items: { id: string; text: string }[]; color: string }[] = [
    { label: "Strengths", items: swot.strengths, color: "#059669" },
    { label: "Weaknesses", items: swot.weaknesses, color: "#b91c1c" },
    { label: "Opportunities", items: swot.opportunities, color: "#2563eb" },
    { label: "Threats", items: swot.threats, color: "#d97706" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
      {quads.map((q) => (
        <div key={q.label} style={{ border: `1px solid ${hexToRgba(q.color, 0.2)}`, borderRadius: 4, padding: 12, backgroundColor: hexToRgba(q.color, 0.03) }}>
          <div style={{ fontSize: scaledFontSize(11, "label"), fontWeight: 700, color: q.color, textTransform: "uppercase", letterSpacing: "1px", fontFamily: `'${fonts.heading}', sans-serif`, marginBottom: 8 }}>
            {q.label}
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: scaledFontSize(11, "body"), color: "#334155", lineHeight: 1.6 }}>
            {q.items.filter((i) => i.text.trim()).map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
            {q.items.every((i) => !i.text.trim()) && (
              <li style={{ color: "#94a3b8", fontStyle: "italic" }}>Not specified</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Financial Table
// ---------------------------------------------------------------------------

function FinancialTable({ projections, currency, accent, fonts }: {
  projections: BusinessPlanFormData["financialProjections"];
  currency: string;
  accent: string;
  fonts: { heading: string; body: string };
}) {
  if (projections.length === 0) return null;
  const sym = currency === "ZMW" ? "K" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: scaledFontSize(11, "body"), fontFamily: `'${fonts.body}', sans-serif`, marginBottom: 16 }}>
      <thead>
        <tr style={{ backgroundColor: hexToRgba(accent, 0.08) }}>
          <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>Year</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>Revenue</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>COGS</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>OpEx</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>Net Income</th>
        </tr>
      </thead>
      <tbody>
        {projections.map((row, i) => (
          <tr key={row.id} style={{ backgroundColor: i % 2 === 0 ? "transparent" : hexToRgba(accent, 0.03) }}>
            <td style={{ padding: "6px 10px", fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>{row.year}</td>
            <td style={{ padding: "6px 10px", textAlign: "right", color: "#334155", borderBottom: "1px solid #e2e8f0" }}>{row.revenue ? `${sym}${row.revenue}` : "—"}</td>
            <td style={{ padding: "6px 10px", textAlign: "right", color: "#334155", borderBottom: "1px solid #e2e8f0" }}>{row.cogs ? `${sym}${row.cogs}` : "—"}</td>
            <td style={{ padding: "6px 10px", textAlign: "right", color: "#334155", borderBottom: "1px solid #e2e8f0" }}>{row.operatingExpenses ? `${sym}${row.operatingExpenses}` : "—"}</td>
            <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>{row.netIncome ? `${sym}${row.netIncome}` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Use of Funds Table
// ---------------------------------------------------------------------------

function UseOfFundsTable({ items, currency, accent, fonts }: {
  items: BusinessPlanFormData["useOfFunds"];
  currency: string;
  accent: string;
  fonts: { heading: string; body: string };
}) {
  if (items.length === 0 || items.every((i) => !i.category.trim())) return null;
  const sym = currency === "ZMW" ? "K" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "";
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: scaledFontSize(11, "body"), fontFamily: `'${fonts.body}', sans-serif`, marginBottom: 16 }}>
      <thead>
        <tr>
          <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>Category</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>Amount</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>%</th>
        </tr>
      </thead>
      <tbody>
        {items.filter((i) => i.category.trim()).map((item, i) => (
          <tr key={item.id} style={{ backgroundColor: i % 2 === 0 ? "transparent" : hexToRgba(accent, 0.03) }}>
            <td style={{ padding: "6px 10px", color: "#334155", borderBottom: "1px solid #e2e8f0" }}>{item.category}</td>
            <td style={{ padding: "6px 10px", textAlign: "right", color: "#334155", borderBottom: "1px solid #e2e8f0" }}>{item.amount ? `${sym}${item.amount}` : "—"}</td>
            <td style={{ padding: "6px 10px", textAlign: "right", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{item.percentage ? `${item.percentage}%` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Competitors Table
// ---------------------------------------------------------------------------

function CompetitorsTable({ competitors, accent, fonts }: {
  competitors: BusinessPlanFormData["competitors"];
  accent: string;
  fonts: { heading: string; body: string };
}) {
  const filled = competitors.filter((c) => c.name.trim());
  if (filled.length === 0) return null;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: scaledFontSize(11, "body"), fontFamily: `'${fonts.body}', sans-serif`, marginBottom: 16 }}>
      <thead>
        <tr>
          <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>Competitor</th>
          <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>Strengths</th>
          <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>Weaknesses</th>
          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#1e293b", borderBottom: `2px solid ${accent}` }}>Market Share</th>
        </tr>
      </thead>
      <tbody>
        {filled.map((comp, i) => (
          <tr key={comp.id} style={{ backgroundColor: i % 2 === 0 ? "transparent" : hexToRgba(accent, 0.03) }}>
            <td style={{ padding: "6px 10px", fontWeight: 600, color: "#1e293b", borderBottom: "1px solid #e2e8f0" }}>{comp.name}</td>
            <td style={{ padding: "6px 10px", color: "#334155", borderBottom: "1px solid #e2e8f0" }}>{comp.strengths || "—"}</td>
            <td style={{ padding: "6px 10px", color: "#334155", borderBottom: "1px solid #e2e8f0" }}>{comp.weaknesses || "—"}</td>
            <td style={{ padding: "6px 10px", textAlign: "right", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>{comp.marketShare || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Team Cards
// ---------------------------------------------------------------------------

function TeamCards({ members, accent, fonts }: {
  members: BusinessPlanFormData["teamMembers"];
  accent: string;
  fonts: { heading: string; body: string };
}) {
  const filled = members.filter((m) => m.name.trim());
  if (filled.length === 0) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
      {filled.map((m) => (
        <div key={m.id} style={{ border: `1px solid ${hexToRgba(accent, 0.15)}`, borderRadius: 6, padding: 14, backgroundColor: hexToRgba(accent, 0.02) }}>
          <div style={{ fontSize: scaledFontSize(13, "body"), fontWeight: 700, color: "#1e293b", fontFamily: `'${fonts.heading}', sans-serif` }}>{m.name}</div>
          {m.role && <div style={{ fontSize: scaledFontSize(11, "label"), color: accent, fontWeight: 600, marginTop: 2 }}>{m.role}</div>}
          {m.bio && <div style={{ fontSize: scaledFontSize(10, "body"), color: "#64748b", marginTop: 6, lineHeight: 1.5 }}>{m.bio}</div>}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Market Size (TAM/SAM/SOM) Visual
// ---------------------------------------------------------------------------

function MarketSizeVisual({ data, accent }: {
  data: BusinessPlanFormData["marketAnalysis"];
  accent: string;
}) {
  if (!data.tam && !data.sam && !data.som) return null;
  const circles = [
    { label: "TAM", value: data.tam, size: 140, opacity: 0.08 },
    { label: "SAM", value: data.sam, size: 100, opacity: 0.15 },
    { label: "SOM", value: data.som, size: 60, opacity: 0.25 },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, position: "relative", height: 160 }}>
      {circles.map((c) => (
        <div key={c.label} style={{
          position: "absolute", width: c.size, height: c.size, borderRadius: "50%",
          backgroundColor: hexToRgba(accent, c.opacity), border: `1.5px solid ${hexToRgba(accent, 0.3)}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontSize: scaledFontSize(9, "label"), fontWeight: 700, color: accent, letterSpacing: "1px" }}>{c.label}</div>
          {c.value && <div style={{ fontSize: scaledFontSize(11, "body"), fontWeight: 600, color: "#1e293b", marginTop: 2 }}>{c.value}</div>}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content Block Builder per Section
// ---------------------------------------------------------------------------

function buildSectionContent(
  sectionKey: SectionKey,
  form: BusinessPlanFormData,
  accent: string,
  fonts: { heading: string; body: string },
  bodySize: number,
  lineHeight: number,
): React.ReactNode {
  const baseStyle: React.CSSProperties = {
    fontSize: bodySize,
    fontFamily: `'${fonts.body}', sans-serif`,
    color: "#334155",
    lineHeight,
  };

  const subHeading: React.CSSProperties = {
    fontSize: scaledFontSize(13, "body"),
    fontWeight: 700,
    color: "#1e293b",
    fontFamily: `'${fonts.heading}', sans-serif`,
    margin: "14px 0 6px 0",
  };

  const section = form.sections.find((s) => s.key === sectionKey);
  const customContent = section?.content;

  switch (sectionKey) {
    case "executive-summary": {
      const es = form.executiveSummary;
      return (
        <div style={baseStyle}>
          {es.overview && <>{formatParagraphs(es.overview)}</>}
          {es.problem && <><h3 style={subHeading}>The Problem</h3>{formatParagraphs(es.problem)}</>}
          {es.solution && <><h3 style={subHeading}>Our Solution</h3>{formatParagraphs(es.solution)}</>}
          {es.targetMarket && <><h3 style={subHeading}>Target Market</h3>{formatParagraphs(es.targetMarket)}</>}
          {es.competitiveAdvantage && <><h3 style={subHeading}>Competitive Advantage</h3>{formatParagraphs(es.competitiveAdvantage)}</>}
          {es.financialHighlights && <><h3 style={subHeading}>Financial Highlights</h3>{formatParagraphs(es.financialHighlights)}</>}
          {es.fundingNeeded && <><h3 style={subHeading}>Funding Required</h3>{formatParagraphs(es.fundingNeeded)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );
    }

    case "company-description":
      return (
        <div style={baseStyle}>
          {form.mission && <><h3 style={subHeading}>Mission Statement</h3>{formatParagraphs(form.mission)}</>}
          {form.vision && <><h3 style={subHeading}>Vision</h3>{formatParagraphs(form.vision)}</>}
          {form.industry && <><h3 style={subHeading}>Industry</h3><p style={{ margin: "0 0 8px 0" }}>{form.industry}</p></>}
          {form.legalStructure && <><h3 style={subHeading}>Legal Structure</h3><p style={{ margin: "0 0 8px 0" }}>{form.legalStructure}</p></>}
          {form.location && <><h3 style={subHeading}>Location</h3><p style={{ margin: "0 0 8px 0" }}>{form.location}</p></>}
          {form.foundedDate && <><h3 style={subHeading}>Founded</h3><p style={{ margin: "0 0 8px 0" }}>{form.foundedDate}</p></>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );

    case "market-analysis": {
      const ma = form.marketAnalysis;
      return (
        <div style={baseStyle}>
          {ma.industryOverview && <><h3 style={subHeading}>Industry Overview</h3>{formatParagraphs(ma.industryOverview)}</>}
          {ma.targetMarket && <><h3 style={subHeading}>Target Market</h3>{formatParagraphs(ma.targetMarket)}</>}
          <MarketSizeVisual data={ma} accent={accent} />
          {ma.marketSize && <><h3 style={subHeading}>Market Size</h3>{formatParagraphs(ma.marketSize)}</>}
          {ma.marketTrends && <><h3 style={subHeading}>Market Trends</h3>{formatParagraphs(ma.marketTrends)}</>}
          {ma.customerSegments && <><h3 style={subHeading}>Customer Segments</h3>{formatParagraphs(ma.customerSegments)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );
    }

    case "competitive-analysis":
      return (
        <div style={baseStyle}>
          <CompetitorsTable competitors={form.competitors} accent={accent} fonts={fonts} />
          <SwotGrid swot={form.swot} fonts={fonts} />
          {form.competitiveAdvantage && <><h3 style={subHeading}>Our Competitive Advantage</h3>{formatParagraphs(form.competitiveAdvantage)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );

    case "products-services": {
      const ps = form.productsServices;
      return (
        <div style={baseStyle}>
          {ps.overview && <>{formatParagraphs(ps.overview)}</>}
          {ps.valueProposition && <><h3 style={subHeading}>Value Proposition</h3>{formatParagraphs(ps.valueProposition)}</>}
          {ps.pricingStrategy && <><h3 style={subHeading}>Pricing Strategy</h3>{formatParagraphs(ps.pricingStrategy)}</>}
          {ps.intellectualProperty && <><h3 style={subHeading}>Intellectual Property</h3>{formatParagraphs(ps.intellectualProperty)}</>}
          {ps.roadmap && <><h3 style={subHeading}>Product Roadmap</h3>{formatParagraphs(ps.roadmap)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );
    }

    case "marketing-strategy": {
      const ms = form.marketingStrategy;
      return (
        <div style={baseStyle}>
          {ms.overview && <>{formatParagraphs(ms.overview)}</>}
          {ms.channels && <><h3 style={subHeading}>Marketing Channels</h3>{formatParagraphs(ms.channels)}</>}
          {ms.salesStrategy && <><h3 style={subHeading}>Sales Strategy</h3>{formatParagraphs(ms.salesStrategy)}</>}
          {ms.partnerships && <><h3 style={subHeading}>Strategic Partnerships</h3>{formatParagraphs(ms.partnerships)}</>}
          {ms.customerRetention && <><h3 style={subHeading}>Customer Retention</h3>{formatParagraphs(ms.customerRetention)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );
    }

    case "operations-plan": {
      const op = form.operationsPlan;
      return (
        <div style={baseStyle}>
          {op.overview && <>{formatParagraphs(op.overview)}</>}
          {op.facilities && <><h3 style={subHeading}>Facilities & Location</h3>{formatParagraphs(op.facilities)}</>}
          {op.technology && <><h3 style={subHeading}>Technology</h3>{formatParagraphs(op.technology)}</>}
          {op.supplyChain && <><h3 style={subHeading}>Supply Chain</h3>{formatParagraphs(op.supplyChain)}</>}
          {op.milestones && <><h3 style={subHeading}>Key Milestones</h3>{formatParagraphs(op.milestones)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );
    }

    case "management-team":
      return (
        <div style={baseStyle}>
          <TeamCards members={form.teamMembers} accent={accent} fonts={fonts} />
          {form.advisors && <><h3 style={subHeading}>Advisory Board</h3>{formatParagraphs(form.advisors)}</>}
          {form.organizationalStructure && <><h3 style={subHeading}>Organizational Structure</h3>{formatParagraphs(form.organizationalStructure)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );

    case "financial-projections":
      return (
        <div style={baseStyle}>
          <FinancialTable projections={form.financialProjections} currency={form.currency} accent={accent} fonts={fonts} />
          {form.breakEvenAnalysis && <><h3 style={subHeading}>Break-Even Analysis</h3>{formatParagraphs(form.breakEvenAnalysis)}</>}
          {form.keyAssumptions && <><h3 style={subHeading}>Key Assumptions</h3>{formatParagraphs(form.keyAssumptions)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );

    case "revenue-model":
      return (
        <div style={baseStyle}>
          {form.revenueModel && <>{formatParagraphs(form.revenueModel)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );

    case "funding-requirements": {
      const sym = form.currency === "ZMW" ? "K" : form.currency === "USD" ? "$" : form.currency === "EUR" ? "€" : form.currency === "GBP" ? "£" : "";
      return (
        <div style={baseStyle}>
          {form.totalFundingNeeded && (
            <div style={{ backgroundColor: hexToRgba(accent, 0.06), border: `1px solid ${hexToRgba(accent, 0.15)}`, borderRadius: 6, padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "#1e293b" }}>Total Funding Required</span>
              <span style={{ fontSize: scaledFontSize(18, "heading"), fontWeight: 800, color: accent, fontFamily: `'${fonts.heading}', sans-serif` }}>{sym}{form.totalFundingNeeded}</span>
            </div>
          )}
          <UseOfFundsTable items={form.useOfFunds} currency={form.currency} accent={accent} fonts={fonts} />
          {form.exitStrategy && <><h3 style={subHeading}>Exit Strategy</h3>{formatParagraphs(form.exitStrategy)}</>}
          {form.investorReturns && <><h3 style={subHeading}>Projected Investor Returns</h3>{formatParagraphs(form.investorReturns)}</>}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );
    }

    case "appendix":
      return (
        <div style={baseStyle}>
          {form.appendixNotes ? formatParagraphs(form.appendixNotes) : (
            <p style={{ color: "#94a3b8", fontStyle: "italic" }}>Supporting documents and references will be added here.</p>
          )}
          {customContent && <>{formatParagraphs(customContent)}</>}
        </div>
      );

    default:
      return customContent ? <div style={baseStyle}>{formatParagraphs(customContent)}</div> : null;
  }
}

// ---------------------------------------------------------------------------
// Table of Contents
// ---------------------------------------------------------------------------

function TableOfContents({ sections, fonts, accent }: {
  sections: { number: number; title: string }[];
  fonts: { heading: string; body: string };
  accent: string;
}) {
  return (
    <div data-bp-section="toc" style={{ marginBottom: 0 }}>
      <h2 style={{ fontSize: scaledFontSize(18, "heading"), fontWeight: 700, color: "#1e293b", fontFamily: `'${fonts.heading}', serif`, marginBottom: 16 }}>
        Table of Contents
      </h2>
      <div style={{ borderTop: `2px solid ${accent}`, paddingTop: 12 }}>
        {sections.map((s) => (
          <div key={s.number} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "6px 0", borderBottom: "1px dotted #e2e8f0" }}>
            <span style={{ fontSize: scaledFontSize(12, "body"), fontWeight: 700, color: accent, fontFamily: `'${fonts.body}', sans-serif`, width: 24, flexShrink: 0 }}>
              {String(s.number).padStart(2, "0")}
            </span>
            <span style={{ fontSize: scaledFontSize(12, "body"), color: "#334155", fontFamily: `'${fonts.body}', sans-serif` }}>
              {s.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Renderer — Measurement-based Pagination
// ---------------------------------------------------------------------------

interface BusinessPlanRendererProps {
  form: BusinessPlanFormData;
  onPageCount?: (count: number) => void;
  pageGap?: number;
}

export default function BusinessPlanRenderer({ form, onPageCount, pageGap = PAGE_GAP }: BusinessPlanRendererProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const pageDim = PAGE_PX[form.printConfig.pageSize] || PAGE_PX.a4;
  const margin = MARGIN_MAP[form.printConfig.margins] || MARGIN_MAP.standard;
  const lineHeight = LINE_HEIGHT_MAP[form.printConfig.lineSpacing] || LINE_HEIGHT_MAP.normal;
  const sectionGap = scaledSectionGap(form.printConfig.sectionSpacing);
  const fonts = useMemo(() => getFonts(form.style.fontPairing), [form.style.fontPairing]);
  const accent = form.style.accentColor;
  const bodySize = scaledFontSize(12, "body");

  const contentH = pageDim.h - margin * 2 - FOOTER_H;

  // Build enabled sections
  const enabledSections = useMemo(() => {
    let num = 0;
    return form.sections
      .filter((s) => s.enabled)
      .map((s) => {
        num++;
        const cfg = SECTION_CONFIGS[s.key];
        return { ...s, number: num, title: cfg.label };
      });
  }, [form.sections]);

  // Build section content blocks
  const sectionBlocks = useMemo(() => {
    return enabledSections.map((s) => ({
      key: s.key,
      number: s.number,
      title: s.title,
      content: buildSectionContent(s.key, form, accent, fonts, bodySize, lineHeight),
    }));
  }, [enabledSections, form, accent, fonts, bodySize, lineHeight]);

  // Flow-based content blocks for rendering and page counting
  const allContent = useMemo(() => {
    const blocks: React.ReactNode[] = [];

    if (form.style.showTableOfContents && enabledSections.length > 0) {
      blocks.push(
        <div key="toc" data-bp-section="toc" style={{ marginBottom: sectionGap }}>
          <TableOfContents sections={enabledSections} fonts={fonts} accent={accent} />
        </div>
      );
    }

    sectionBlocks.forEach((sb) => {
      blocks.push(
        <div key={`section-${sb.key}`} data-bp-section={sb.key} style={{ marginBottom: sectionGap }}>
          <SectionHeader title={sb.title} number={sb.number} accent={accent} fonts={fonts} headerStyle={form.style.headerStyle} />
          {sb.content}
        </div>
      );
    });

    return blocks;
  }, [sectionBlocks, enabledSections, form.style.showTableOfContents, form.style.headerStyle, fonts, accent, sectionGap]);

  // Overflow-based page counting
  const pagesRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const onPageCountRef = useRef(onPageCount);
  onPageCountRef.current = onPageCount;
  const lastReportedCount = useRef(0);

  useEffect(() => {
    const el = pagesRef.current;
    if (!el) return;
    const totalH = el.scrollHeight;
    const count = Math.max(1, Math.ceil(totalH / contentH));
    const total = count + (form.style.showCoverPage ? 1 : 0);
    setPageCount(count);
    if (total !== lastReportedCount.current) {
      lastReportedCount.current = total;
      onPageCountRef.current?.(total);
    }
  }, [allContent, contentH, form.style.showCoverPage]);

  // Build cover
  const CoverComponent = COVER_MAP[form.style.coverStyle] || CoverExecutive;
  const coverProps: CoverProps = { form, fonts, accent, pageW: pageDim.w, pageH: pageDim.h, margin };

  const fontUrl = getGoogleFontUrl(form.style.fontPairing);

  const pageStyle: React.CSSProperties = {
    width: pageDim.w,
    minHeight: pageDim.h,
    backgroundColor: "#ffffff",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 4px 32px rgba(0, 0, 0, 0.45)",
    fontFamily: `'${fonts.body}', sans-serif`,
  };

  return (
    <>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}
      <div data-bp-measure ref={measureRef} style={{ position: "absolute", visibility: "hidden", left: -9999 }} />

      <div data-bp-pages style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: pageGap }}>
        {/* Cover Page */}
        {form.style.showCoverPage && <CoverComponent {...coverProps} />}

        {/* Content Pages */}
        {Array.from({ length: pageCount }, (_, pageIdx) => (
          <div key={`page-${pageIdx}`} data-bp-page={pageIdx + (form.style.showCoverPage ? 2 : 1)} style={pageStyle}>
            {/* Page content area with clipping */}
            <div
              ref={pageIdx === 0 ? pagesRef : undefined}
              style={{
                position: pageIdx === 0 ? "relative" : "absolute",
                top: pageIdx === 0 ? 0 : undefined,
                padding: `${margin}px ${margin}px ${margin + FOOTER_H}px`,
                width: pageDim.w,
                ...(pageIdx === 0
                  ? {}
                  : { visibility: "hidden", height: 0, overflow: "hidden" }),
              }}
            >
              {pageIdx === 0 && allContent}
            </div>

            {/* For pages > 0, show overflow from previous page using clip */}
            {pageIdx > 0 && (
              <div style={{
                padding: `${margin}px ${margin}px ${margin + FOOTER_H}px`,
                width: pageDim.w,
                height: pageDim.h - FOOTER_H,
                overflow: "hidden",
              }}>
                <div style={{ marginTop: -(pageIdx * contentH) }}>
                  {allContent}
                </div>
              </div>
            )}

            {/* Footer */}
            {form.style.showPageNumbers && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: FOOTER_H,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: `0 ${margin}px`, borderTop: "1px solid #e2e8f0",
              }}>
                <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: `'${fonts.body}', sans-serif` }}>
                  {form.companyName || form.title || "Business Plan"}
                </span>
                <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: `'${fonts.body}', sans-serif` }}>
                  Page {pageIdx + (form.style.showCoverPage ? 2 : 1)} of {pageCount + (form.style.showCoverPage ? 1 : 0)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
