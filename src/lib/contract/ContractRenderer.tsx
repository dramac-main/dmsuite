// =============================================================================
// DMSuite — Contract Document Renderer (Paginated)
// Real measurement-based pagination. Each page is a discrete <div> with exact
// dimensions for print-perfect output. Content blocks are measured in a hidden
// container, bin-packed into pages, and rendered with per-page decorations &
// footers showing "Page X of N".
// =============================================================================

"use client";

import React, { useMemo, useLayoutEffect, useRef, useState, useEffect } from "react";
import type { ContractFormData, ContractTemplate, ContractTypeConfig, CoverDesignId } from "@/lib/contract/schema";
import {
  getContractTemplate,
  CONTRACT_TYPE_CONFIGS,
  FONT_PAIRINGS,
} from "@/lib/contract/schema";

// ---------------------------------------------------------------------------
// Constants — exported for workspace scroll calculations
// ---------------------------------------------------------------------------

export const PAGE_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },
  letter: { w: 816, h: 1056 },
  legal: { w: 816, h: 1344 },
};

const MARGIN = 50;
const FOOTER_H = 56; // generous reserve for all footer styles + disclaimer
const SAFETY_PX = 2; // per-block buffer for sub-pixel rounding
export const PAGE_GAP = 16; // visual gap between pages in preview

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
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800;900`)
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

// ---------------------------------------------------------------------------
// Fillable Line — renders a dotted line for pen fill-in when fields are empty
// ---------------------------------------------------------------------------

function FillableLine({ width = "200px", label }: { width?: string; label?: string }) {
  return (
    <span style={{ display: "inline-block", width, position: "relative" }}>
      <span style={{ display: "block", borderBottom: "1.5px dotted #94a3b8", width: "100%", height: "1px", marginBottom: "2px" }} />
      {label && (
        <span style={{ fontSize: "9px", color: "#94a3b8", fontStyle: "italic" }}>{label}</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Cover Page — Multiple design variants
// ---------------------------------------------------------------------------

function formatCoverDate(dateStr: string): React.ReactNode {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const day = d.getDate();
  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const ordinal = (n: number) => {
    if (n >= 11 && n <= 13) return "TH";
    switch (n % 10) {
      case 1: return "ST";
      case 2: return "ND";
      case 3: return "RD";
      default: return "TH";
    }
  };
  return (
    <>
      DATED THIS {day}
      <sup style={{ fontSize: "0.6em" }}>{ordinal(day)}</sup>
      {" "}DAY OF {month} {year}
    </>
  );
}

interface CoverProps {
  form: ContractFormData;
  config: ContractTypeConfig;
  fonts: { heading: string; body: string };
  tpl: ContractTemplate;
  accent: string;
  pageW: number;
  pageH: number;
  fontStyles: React.CSSProperties;
}

// ── Classic Legal (Zambian standard: title + parties + date) ────────────────
function CoverClassic({ form, config, fonts, tpl, accent, pageW, pageH, fontStyles }: CoverProps) {
  const lineW = "260px";
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", ...fontStyles, pageBreakAfter: "always" }}>
      <PageBorder tpl={tpl} accent={accent} />
      <div style={{ position: "absolute", top: `${MARGIN}px`, left: `${MARGIN}px`, right: `${MARGIN}px`, bottom: `${MARGIN}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: "60px", zIndex: 1 }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, fontFamily: `'${fonts.heading}', serif`, letterSpacing: "2px", textTransform: "uppercase", color: "#1a1a1a", margin: "0 0 48px 0", textAlign: "center", lineHeight: 1.3 }}>
          {form.documentInfo.title || config.defaultTitle}
        </h1>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "2px", marginBottom: "36px" }}>BETWEEN</div>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div style={{ width: lineW, borderBottom: "2px solid #1a1a1a", marginBottom: "6px", paddingBottom: "4px", fontSize: "16px", fontWeight: 600, color: "#1a1a1a", textAlign: "center", minHeight: "24px" }}>{form.partyA.name || ""}</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "1px" }}>({(form.partyA.role || config.partyARole).toUpperCase()})</div>
        </div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "2px", margin: "28px 0" }}>AND</div>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <div style={{ width: lineW, borderBottom: "2px solid #1a1a1a", marginBottom: "6px", paddingBottom: "4px", fontSize: "16px", fontWeight: 600, color: "#1a1a1a", textAlign: "center", minHeight: "24px" }}>{form.partyB.name || ""}</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "1px" }}>({(form.partyB.role || config.partyBRole).toUpperCase()})</div>
        </div>
        <div style={{ flex: "1 1 auto" }} />
        {form.documentInfo.effectiveDate && (
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "1px", marginBottom: "80px" }}>{formatCoverDate(form.documentInfo.effectiveDate)}</div>
        )}
        {form.documentInfo.referenceNumber && (
          <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "1px" }}>Ref: {form.documentInfo.referenceNumber}</div>
        )}
      </div>
    </div>
  );
}

// ── Corporate (accent header bar + logo placeholder + centered body) ─────────
function CoverCorporate({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  const onDark = contrastText(accent);
  const barH = Math.round(pageH * 0.12);
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", ...fontStyles, pageBreakAfter: "always" }}>
      {/* Top accent bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${barH}px`, backgroundColor: accent, zIndex: 1 }} />
      {/* Bottom thin accent rule */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "6px", backgroundColor: accent, opacity: 0.6, zIndex: 1 }} />
      {/* Logo placeholder inside bar */}
      <div style={{ position: "absolute", top: `${Math.round(barH * 0.18)}px`, right: `${MARGIN}px`, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
        <div style={{ width: "48px", height: "48px", border: `2px solid ${onDark}60`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "10px", color: onDark, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", lineHeight: 1.2, whiteSpace: "pre" }}>{"Your\nLogo"}</span>
        </div>
      </div>
      {/* Contract type pill in bar */}
      <div style={{ position: "absolute", top: `${Math.round(barH * 0.35)}px`, left: `${MARGIN}px`, zIndex: 2 }}>
        <span style={{ fontSize: "11px", color: onDark, opacity: 0.75, letterSpacing: "2px", textTransform: "uppercase", fontWeight: 600 }}>Official Agreement</span>
      </div>
      {/* Main body */}
      <div style={{ position: "absolute", top: `${barH + 60}px`, left: `${MARGIN}px`, right: `${MARGIN}px`, bottom: `${MARGIN + 30}px`, display: "flex", flexDirection: "column", alignItems: "flex-start", zIndex: 1 }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, fontFamily: `'${fonts.heading}', serif`, color: "#111827", margin: "0 0 12px 0", lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "1.5px" }}>
          {form.documentInfo.title || config.defaultTitle}
        </h1>
        {/* Accent rule under title */}
        <div style={{ width: "60px", height: "4px", backgroundColor: accent, borderRadius: "2px", marginBottom: "40px" }} />
        {/* Parties */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>{(form.partyA.role || config.partyARole).toUpperCase()}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827", borderBottom: `2px solid ${accent}`, paddingBottom: "6px", minWidth: "220px", display: "inline-block" }}>{form.partyA.name || "—"}</div>
          </div>
          <div style={{ fontSize: "13px", color: "#6b7280", fontWeight: 600, letterSpacing: "2px" }}>AND</div>
          <div>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>{(form.partyB.role || config.partyBRole).toUpperCase()}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827", borderBottom: `2px solid ${accent}`, paddingBottom: "6px", minWidth: "220px", display: "inline-block" }}>{form.partyB.name || "—"}</div>
          </div>
        </div>
        <div style={{ flex: "1 1 auto" }} />
        {/* Date row */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {form.documentInfo.effectiveDate && (
            <div style={{ fontSize: "13px", color: "#374151", fontWeight: 600 }}>{formatCoverDate(form.documentInfo.effectiveDate)}</div>
          )}
          {form.documentInfo.referenceNumber && (
            <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "1px", borderLeft: "1px solid #e5e7eb", paddingLeft: "16px" }}>Ref: {form.documentInfo.referenceNumber}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dark Executive (full-bleed dark + accent highlights) ────────────────────
function CoverDarkExecutive({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  const bg = "#0f172a";
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: bg, ...fontStyles, pageBreakAfter: "always" }}>
      {/* Subtle diagonal accent shape */}
      <div style={{ position: "absolute", top: 0, right: 0, width: `${Math.round(pageW * 0.35)}px`, height: `${Math.round(pageH * 0.45)}px`, backgroundColor: accent, opacity: 0.12, clipPath: "polygon(100% 0, 100% 100%, 0 0)", zIndex: 0 }} />
      {/* Top left accent pill */}
      <div style={{ position: "absolute", top: `${MARGIN}px`, left: `${MARGIN}px`, height: "4px", width: "48px", backgroundColor: accent, borderRadius: "2px", zIndex: 1 }} />
      {/* Body */}
      <div style={{ position: "absolute", top: `${MARGIN + 32}px`, left: `${MARGIN}px`, right: `${MARGIN}px`, bottom: `${MARGIN}px`, display: "flex", flexDirection: "column", zIndex: 1 }}>
        {/* Agreement label */}
        <div style={{ fontSize: "11px", color: accent, letterSpacing: "3px", textTransform: "uppercase", fontWeight: 600, marginBottom: "24px" }}>Formal Agreement</div>
        {/* Title */}
        <h1 style={{ fontSize: "34px", fontWeight: 900, fontFamily: `'${fonts.heading}', serif`, color: "#f8fafc", margin: "0 0 24px 0", lineHeight: 1.15, textTransform: "uppercase", letterSpacing: "1px" }}>
          {form.documentInfo.title || config.defaultTitle}
        </h1>
        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <div style={{ height: "1px", width: "40px", backgroundColor: accent }} />
          <div style={{ height: "1px", flex: 1, backgroundColor: "#ffffff20" }} />
        </div>
        {/* Parties */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <div style={{ fontSize: "10px", color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>{(form.partyA.role || config.partyARole).toUpperCase()}</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f1f5f9" }}>{form.partyA.name || "—"}</div>
          </div>
          <div style={{ fontSize: "12px", color: "#475569", fontWeight: 600, letterSpacing: "3px" }}>AND</div>
          <div>
            <div style={{ fontSize: "10px", color: accent, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px", fontWeight: 600 }}>{(form.partyB.role || config.partyBRole).toUpperCase()}</div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#f1f5f9" }}>{form.partyB.name || "—"}</div>
          </div>
        </div>
        <div style={{ flex: "1 1 auto" }} />
        {/* Bottom row */}
        <div style={{ borderTop: "1px solid #ffffff15", paddingTop: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {form.documentInfo.effectiveDate ? (
            <div style={{ fontSize: "12px", color: "#94a3b8" }}>{formatCoverDate(form.documentInfo.effectiveDate)}</div>
          ) : <div />}
          {form.documentInfo.referenceNumber && (
            <div style={{ fontSize: "11px", color: "#475569" }}>Ref: {form.documentInfo.referenceNumber}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Accent Split (left accent panel, right white body) ───────────────────────
function CoverAccentSplit({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  const panelW = Math.round(pageW * 0.38);
  const onAccent = contrastText(accent);
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", ...fontStyles, pageBreakAfter: "always" }}>
      {/* Left accent panel */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${panelW}px`, backgroundColor: accent, zIndex: 1 }}>
        <div style={{ position: "absolute", bottom: `${MARGIN}px`, left: `${MARGIN * 0.7}px`, right: `${MARGIN * 0.7}px` }}>
          {/* Role labels on panel */}
          <div style={{ fontSize: "10px", color: `${onAccent}80`, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px", fontWeight: 600 }}>Between</div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: onAccent, marginBottom: "4px" }}>{form.partyA.name || (form.partyA.role || config.partyARole)}</div>
          <div style={{ fontSize: "10px", color: `${onAccent}70`, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>{(form.partyA.role || config.partyARole).toUpperCase()}</div>
          <div style={{ height: "1px", backgroundColor: `${onAccent}30`, marginBottom: "12px" }} />
          <div style={{ fontSize: "10px", color: `${onAccent}80`, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px", fontWeight: 600 }}>And</div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: onAccent, marginBottom: "4px" }}>{form.partyB.name || (form.partyB.role || config.partyBRole)}</div>
          <div style={{ fontSize: "10px", color: `${onAccent}70`, letterSpacing: "1px", textTransform: "uppercase" }}>{(form.partyB.role || config.partyBRole).toUpperCase()}</div>
        </div>
      </div>
      {/* Right white area */}
      <div style={{ position: "absolute", top: 0, left: `${panelW}px`, right: 0, bottom: 0, zIndex: 1, display: "flex", flexDirection: "column", padding: `${MARGIN * 1.2}px ${MARGIN}px ${MARGIN}px ${MARGIN}px` }}>
        {/* Type label */}
        <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "20px", fontWeight: 600 }}>Legal Document</div>
        {/* Title */}
        <h1 style={{ fontSize: "26px", fontWeight: 800, fontFamily: `'${fonts.heading}', serif`, color: "#111827", margin: "0 0 20px 0", lineHeight: 1.25, textTransform: "uppercase", letterSpacing: "1px" }}>
          {form.documentInfo.title || config.defaultTitle}
        </h1>
        {/* Accent divider */}
        <div style={{ width: "40px", height: "3px", backgroundColor: accent, borderRadius: "2px", marginBottom: "0" }} />
        <div style={{ flex: "1 1 auto" }} />
        {/* Date block */}
        {form.documentInfo.effectiveDate && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px" }}>Date</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{formatCoverDate(form.documentInfo.effectiveDate)}</div>
          </div>
        )}
        {form.documentInfo.referenceNumber && (
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Ref: {form.documentInfo.referenceNumber}</div>
        )}
      </div>
    </div>
  );
}

// ── Bold Frame (thick border frame, centered, accent accents) ────────────────
function CoverBoldFrame({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  const borderW = 12;
  const innerPad = MARGIN;
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", ...fontStyles, pageBreakAfter: "always" }}>
      {/* Outer frame */}
      <div style={{ position: "absolute", inset: `${borderW}px`, border: `2px solid ${accent}`, zIndex: 1, pointerEvents: "none" }} />
      {/* Inner corner accents */}
      {[
        { top: borderW + 6, left: borderW + 6 },
        { top: borderW + 6, right: borderW + 6 },
        { bottom: borderW + 6, left: borderW + 6 },
        { bottom: borderW + 6, right: borderW + 6 },
      ].map((pos, i) => (
        <div key={i} style={{ position: "absolute", width: "16px", height: "16px", ...pos, border: `3px solid ${accent}`, zIndex: 2, pointerEvents: "none" }} />
      ))}
      {/* Content */}
      <div style={{ position: "absolute", top: `${borderW + innerPad + 20}px`, left: `${borderW + innerPad}px`, right: `${borderW + innerPad}px`, bottom: `${borderW + innerPad}px`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", zIndex: 1 }}>
        {/* Top decorative rule */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "40px", width: "100%", justifyContent: "center" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: `${accent}40` }} />
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accent }} />
          <div style={{ flex: 1, height: "1px", backgroundColor: `${accent}40` }} />
        </div>
        {/* Title */}
        <h1 style={{ fontSize: "30px", fontWeight: 900, fontFamily: `'${fonts.heading}', serif`, color: "#111827", margin: "0 0 40px 0", lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "2px" }}>
          {form.documentInfo.title || config.defaultTitle}
        </h1>
        {/* Parties */}
        <div style={{ marginBottom: "12px", width: "100%" }}>
          <div style={{ width: "240px", borderBottom: `1.5px solid ${accent}`, paddingBottom: "6px", fontSize: "15px", fontWeight: 600, color: "#111827", margin: "0 auto 4px" }}>{form.partyA.name || ""}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", letterSpacing: "1.5px", textTransform: "uppercase" }}>({(form.partyA.role || config.partyARole).toUpperCase()})</div>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#374151", letterSpacing: "2px", margin: "16px 0" }}>AND</div>
        <div style={{ marginBottom: "12px", width: "100%" }}>
          <div style={{ width: "240px", borderBottom: `1.5px solid ${accent}`, paddingBottom: "6px", fontSize: "15px", fontWeight: 600, color: "#111827", margin: "0 auto 4px" }}>{form.partyB.name || ""}</div>
          <div style={{ fontSize: "12px", color: "#6b7280", letterSpacing: "1.5px", textTransform: "uppercase" }}>({(form.partyB.role || config.partyBRole).toUpperCase()})</div>
        </div>
        <div style={{ flex: "1 1 auto" }} />
        {/* Bottom decorative rule */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", width: "100%", justifyContent: "center" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: `${accent}40` }} />
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: accent }} />
          <div style={{ flex: 1, height: "1px", backgroundColor: `${accent}40` }} />
        </div>
        {form.documentInfo.effectiveDate && (
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", letterSpacing: "1px", marginBottom: "8px" }}>{formatCoverDate(form.documentInfo.effectiveDate)}</div>
        )}
        {form.documentInfo.referenceNumber && (
          <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "1px" }}>Ref: {form.documentInfo.referenceNumber}</div>
        )}
      </div>
    </div>
  );
}

// ── Minimal Line (clean typography + single accent underline) ────────────────
function CoverMinimalLine({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#fafafa", ...fontStyles, pageBreakAfter: "always" }}>
      {/* Vertical accent strip on left */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "4px", backgroundColor: accent, zIndex: 1 }} />
      {/* Content */}
      <div style={{ position: "absolute", top: `${MARGIN * 1.5}px`, left: `${MARGIN + 24}px`, right: `${MARGIN}px`, bottom: `${MARGIN}px`, display: "flex", flexDirection: "column", zIndex: 1 }}>
        {/* Year/type label */}
        <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "32px", fontWeight: 500 }}>Legal Agreement</div>
        {/* Title */}
        <h1 style={{ fontSize: "36px", fontWeight: 300, fontFamily: `'${fonts.heading}', serif`, color: "#111827", margin: "0 0 16px 0", lineHeight: 1.15, letterSpacing: "0.5px" }}>
          {form.documentInfo.title || config.defaultTitle}
        </h1>
        {/* Accent rule */}
        <div style={{ width: "48px", height: "2px", backgroundColor: accent, marginBottom: "48px" }} />
        {/* Parties — label/value pairs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase", minWidth: "80px", flexShrink: 0 }}>{(form.partyA.role || config.partyARole).replace(/-/g, " ").toUpperCase()}</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#111827", borderBottom: "1px solid #e5e7eb", flex: 1, paddingBottom: "4px" }}>{form.partyA.name || ""}</div>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase", minWidth: "80px", flexShrink: 0 }}>{(form.partyB.role || config.partyBRole).replace(/-/g, " ").toUpperCase()}</div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#111827", borderBottom: "1px solid #e5e7eb", flex: 1, paddingBottom: "4px" }}>{form.partyB.name || ""}</div>
          </div>
        </div>
        <div style={{ flex: "1 1 auto" }} />
        {/* Date + ref */}
        {form.documentInfo.effectiveDate && (
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>{formatCoverDate(form.documentInfo.effectiveDate)}</div>
        )}
        {form.documentInfo.referenceNumber && (
          <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "1px" }}>Ref: {form.documentInfo.referenceNumber}</div>
        )}
      </div>
    </div>
  );
}

// ── Cover Page dispatcher ────────────────────────────────────────────────────
function CoverPage(props: CoverProps) {
  const design: CoverDesignId = props.form.style.coverDesign ?? "classic";
  switch (design) {
    case "none":           return null;
    case "corporate":      return <CoverCorporate {...props} />;
    case "dark-executive": return <CoverDarkExecutive {...props} />;
    case "accent-split":   return <CoverAccentSplit {...props} />;
    case "bold-frame":     return <CoverBoldFrame {...props} />;
    case "minimal-line":   return <CoverMinimalLine {...props} />;
    case "classic":        // fall through
    default:               return <CoverClassic {...props} />;
  }
}

// ---------------------------------------------------------------------------
// Decorative Overlays (rendered once per page)
// ---------------------------------------------------------------------------

function WatermarkOverlay({ form }: { form: ContractFormData }) {
  if (!form.printConfig.showWatermark || !form.printConfig.watermarkText) return null;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-30deg)",
          fontSize: "72px",
          fontWeight: 900,
          color: form.style.accentColor,
          opacity: 0.05,
          whiteSpace: "nowrap",
          letterSpacing: "8px",
          textTransform: "uppercase",
        }}
      >
        {form.printConfig.watermarkText}
      </div>
    </div>
  );
}

function PageBorder({ tpl, accent }: { tpl: ContractTemplate; accent: string }) {
  if (tpl.borderStyle === "none") return null;
  const w = tpl.borderStyle === "thick" ? 3 : 1;
  return (
    <div
      style={{
        position: "absolute",
        inset: "6px",
        border: `${w}px solid ${accent}40`,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

function DecorativeOverlay({ tpl }: { tpl: ContractTemplate }) {
  if (tpl.decorative === "none") return null;
  if (tpl.decorative === "corner-gradient") {
    const accent2 = tpl.accentSecondary ?? tpl.accent;
    return (
      <div style={{ position: "absolute", bottom: 0, right: 0, width: "120px", height: "120px", overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", bottom: "-20px", right: "-20px", width: "140px", height: "140px", background: `linear-gradient(135deg, ${tpl.accent}30, ${accent2}20)`, borderRadius: "20px", transform: "rotate(15deg)" }} />
      </div>
    );
  }
  if (tpl.decorative === "accent-strip") {
    const accent2 = tpl.accentSecondary ?? tpl.accent;
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: "6px",
          background: `linear-gradient(180deg, ${tpl.accent}, ${accent2})`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: "4px",
        border: `2px solid ${tpl.accent}30`,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

function HeaderDivider({ tpl }: { tpl: ContractTemplate }) {
  const accent = tpl.accent;
  switch (tpl.headerDivider) {
    case "thick-line":
      return <div style={{ height: "3px", backgroundColor: accent, marginTop: "12px" }} />;
    case "double-line":
      return <div style={{ borderTop: `3px double ${accent}`, marginTop: "12px" }} />;
    case "accent-bar":
      return (
        <div
          style={{
            height: "4px",
            background: `linear-gradient(to right, ${accent}, ${accent}40)`,
            marginTop: "12px",
            borderRadius: "2px",
          }}
        />
      );
    case "none":
      return null;
    default:
      return <div style={{ height: "1px", backgroundColor: `${accent}40`, marginTop: "12px" }} />;
  }
}

// ---------------------------------------------------------------------------
// Page Footer (rendered at the bottom of every page)
// ---------------------------------------------------------------------------

function PageFooter({
  form,
  tpl,
  accent,
  pageNum,
  totalPages,
  isLastPage,
}: {
  form: ContractFormData;
  tpl: ContractTemplate;
  accent: string;
  pageNum: number;
  totalPages: number;
  isLastPage: boolean;
}) {
  const pageLabel = `Page ${pageNum} of ${totalPages}`;
  return (
    <div>
      {tpl.footerStyle === "bar" && (
        <div
          style={{
            backgroundColor: accent,
            color: contrastText(accent),
            padding: "6px 16px",
            marginLeft: `-${MARGIN}px`,
            marginRight: `-${MARGIN}px`,
            fontSize: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 600 }}>{form.documentInfo.title}</span>
          {form.style.pageNumbering && <span style={{ opacity: 0.75 }}>{pageLabel}</span>}
        </div>
      )}

      {tpl.footerStyle === "line" && (
        <div
          style={{
            borderTop: `1px solid ${accent}30`,
            paddingTop: "6px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            color: "#94a3b8",
          }}
        >
          <span>{form.documentInfo.title}</span>
          <span>{form.documentInfo.referenceNumber}</span>
          {form.style.pageNumbering && <span>{pageLabel}</span>}
        </div>
      )}

      {tpl.footerStyle === "none" && form.style.pageNumbering && (
        <div
          style={{
            textAlign: form.style.pageNumberPosition === "bottom-center" ? "center" : "right",
            fontSize: "11px",
            color: "#94a3b8",
          }}
        >
          {pageLabel}
        </div>
      )}

      {/* Legal disclaimer — last page only */}
      {isLastPage && (
        <div
          style={{
            textAlign: "center",
            fontSize: "10px",
            color: "#94a3b8",
            marginTop: "6px",
            fontStyle: "italic",
          }}
        >
          This document is a template generated by DMSuite. It is not a substitute for professional
          legal advice. Consult a qualified attorney before executing any legal agreement.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content Block definition
// ---------------------------------------------------------------------------

interface ContentBlock {
  id: string;
  section: string; // maps to data-ct-section for click-to-edit
  element: React.ReactNode;
  breakBefore?: boolean; // force new page before this block
}

// ---------------------------------------------------------------------------
// Build all content blocks from form data
// ---------------------------------------------------------------------------

function buildContentBlocks(
  form: ContractFormData,
  config: ContractTypeConfig,
  fonts: { heading: string; body: string },
  accent: string,
  tpl: ContractTemplate,
): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const enabledClauses = form.clauses.filter((c) => c.enabled);

  // ─── CONFIDENTIAL BANNER ───
  if (form.documentInfo.showConfidentialBanner) {
    blocks.push({
      id: "confidential",
      section: "confidential",
      element: (
        <div
          style={{
            textAlign: "center",
            padding: "6px 16px",
            backgroundColor: `${accent}10`,
            border: `1px solid ${accent}30`,
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: accent,
            marginBottom: "20px",
          }}
        >
          CONFIDENTIAL
        </div>
      ),
    });
  }

  // ─── HEADER ───
  const headerElement = (() => {
    switch (form.style.headerStyle) {
      case "banner":
        return (
          <div
            style={{
              backgroundColor: accent,
              color: contrastText(accent),
              padding: "20px 24px",
              marginLeft: `-${MARGIN}px`,
              marginRight: `-${MARGIN}px`,
              marginBottom: "24px",
            }}
          >
            <h1 style={{ fontSize: "28px", fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, letterSpacing: "1px", textTransform: "uppercase", margin: 0 }}>
              {form.documentInfo.title || config.defaultTitle}
            </h1>
            {form.documentInfo.subtitle && (
              <p style={{ fontSize: "15px", opacity: 0.85, marginTop: "4px", margin: 0 }}>{form.documentInfo.subtitle}</p>
            )}
            <div style={{ display: "flex", gap: "20px", marginTop: "10px", fontSize: "13px", opacity: 0.75 }}>
              {form.documentInfo.referenceNumber && <span>Ref: {form.documentInfo.referenceNumber}</span>}
              {form.documentInfo.effectiveDate && <span>Date: {form.documentInfo.effectiveDate}</span>}
            </div>
          </div>
        );
      case "centered":
        return (
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "30px", fontWeight: 800, fontFamily: `'${fonts.heading}', serif`, letterSpacing: "2px", textTransform: "uppercase", color: accent, margin: 0 }}>
              {form.documentInfo.title || config.defaultTitle}
            </h1>
            {form.documentInfo.subtitle && (
              <p style={{ fontSize: "15px", color: "#64748b", margin: "6px 0 0 0" }}>{form.documentInfo.subtitle}</p>
            )}
            <HeaderDivider tpl={tpl} />
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
              {form.documentInfo.referenceNumber && <span>Ref: {form.documentInfo.referenceNumber}</span>}
              {form.documentInfo.effectiveDate && <span>Effective: {form.documentInfo.effectiveDate}</span>}
              {form.documentInfo.expiryDate && <span>Expires: {form.documentInfo.expiryDate}</span>}
            </div>
          </div>
        );
      case "left-aligned":
        return (
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 700, fontFamily: `'${fonts.heading}', sans-serif`, color: accent, margin: 0 }}>
              {form.documentInfo.title || config.defaultTitle}
            </h1>
            {form.documentInfo.subtitle && (
              <p style={{ fontSize: "15px", color: "#64748b", margin: "4px 0 0 0" }}>{form.documentInfo.subtitle}</p>
            )}
            <HeaderDivider tpl={tpl} />
            <div style={{ display: "flex", gap: "20px", marginTop: "10px", fontSize: "13px", color: "#64748b" }}>
              {form.documentInfo.referenceNumber && <span>Ref: {form.documentInfo.referenceNumber}</span>}
              {form.documentInfo.effectiveDate && <span>Effective: {form.documentInfo.effectiveDate}</span>}
            </div>
          </div>
        );
      default: // minimal
        return (
          <div style={{ marginBottom: "20px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 600, fontFamily: `'${fonts.heading}', sans-serif`, color: "#1e293b", margin: 0 }}>
              {form.documentInfo.title || config.defaultTitle}
            </h1>
            <div style={{ height: "1px", backgroundColor: "#e2e8f0", marginTop: "8px" }} />
            <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px", color: "#94a3b8" }}>
              {form.documentInfo.referenceNumber && <span>Ref: {form.documentInfo.referenceNumber}</span>}
              {form.documentInfo.effectiveDate && <span>{form.documentInfo.effectiveDate}</span>}
            </div>
          </div>
        );
    }
  })();

  blocks.push({ id: "header", section: "header", element: headerElement });

  const fillable = form.style.fillableFields;

  // ─── PARTIES ───
  blocks.push({
    id: "parties",
    section: "parties",
    element: (
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {/* Party A */}
          <div style={{ flex: "1 1 45%", minWidth: "200px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "6px" }}>
              {form.partyA.role || config.partyARole}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
              {form.partyA.name || (fillable ? <FillableLine width="220px" /> : `[${config.partyARole} Name]`)}
            </div>
            {form.partyA.address ? (
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{form.partyA.address}</div>
            ) : fillable ? (
              <div style={{ marginTop: "4px" }}><FillableLine width="200px" /></div>
            ) : null}
            {form.partyA.city && <div style={{ fontSize: "13px", color: "#64748b" }}>{form.partyA.city}, {form.partyA.country}</div>}
            {form.partyA.representative && (
              <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                Rep: {form.partyA.representative}
                {form.partyA.representativeTitle && <span style={{ color: "#94a3b8" }}> ({form.partyA.representativeTitle})</span>}
              </div>
            )}
          </div>
          {/* AND */}
          <div style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", letterSpacing: "1px" }}>AND</span>
          </div>
          {/* Party B */}
          <div style={{ flex: "1 1 45%", minWidth: "200px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "6px" }}>
              {form.partyB.role || config.partyBRole}
            </div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
              {form.partyB.name || (fillable ? <FillableLine width="220px" /> : `[${config.partyBRole} Name]`)}
            </div>
            {form.partyB.address ? (
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{form.partyB.address}</div>
            ) : fillable ? (
              <div style={{ marginTop: "4px" }}><FillableLine width="200px" /></div>
            ) : null}
            {form.partyB.city && <div style={{ fontSize: "13px", color: "#64748b" }}>{form.partyB.city}, {form.partyB.country}</div>}
            {form.partyB.representative && (
              <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                Rep: {form.partyB.representative}
                {form.partyB.representativeTitle && <span style={{ color: "#94a3b8" }}> ({form.partyB.representativeTitle})</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
  });

  // ─── DIVIDER ───
  blocks.push({
    id: "divider",
    section: "parties",
    element: <div style={{ height: "1px", backgroundColor: `${accent}20`, marginBottom: "16px" }} />,
  });

  // ─── PREAMBLE ───
  if (form.documentInfo.preambleText) {
    blocks.push({
      id: "preamble",
      section: "preamble",
      element: (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "8px" }}>
            Preamble
          </div>
          <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#475569", textAlign: "justify", margin: 0 }}>
            {form.documentInfo.preambleText}
          </p>
        </div>
      ),
    });
  }

  // ─── TABLE OF CONTENTS ───
  if (form.documentInfo.showTableOfContents && enabledClauses.length > 0) {
    blocks.push({
      id: "toc",
      section: "toc",
      element: (
        <div style={{ marginBottom: "24px", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "8px" }}>
            Table of Contents
          </div>
          {enabledClauses.map((clause, i) => (
            <div key={clause.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px 0", fontSize: "13px" }}>
              <span style={{ color: "#1e293b" }}>
                <span style={{ fontWeight: 600, color: accent, marginRight: "6px" }}>{i + 1}.</span>
                {clause.title}
              </span>
              <span style={{ flex: 1, borderBottom: "1px dotted #cbd5e1", margin: "0 8px", minWidth: "20px" }} />
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>{i + 1}</span>
            </div>
          ))}
        </div>
      ),
    });
  }

  // ─── CLAUSES (one block per clause) ───
  enabledClauses.forEach((clause, i) => {
    blocks.push({
      id: `clause-${clause.id}`,
      section: "clauses",
      element: (
        <div style={{ marginBottom: "20px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              fontFamily: `'${fonts.heading}', sans-serif`,
              color: "#1e293b",
              margin: "0 0 8px 0",
            }}
          >
            <span style={{ color: accent, marginRight: "8px" }}>{i + 1}.</span>
            {clause.title}
          </h3>
          <p style={{ fontSize: "13px", lineHeight: 1.7, color: "#475569", textAlign: "justify", margin: 0, paddingLeft: "20px" }}>
            {clause.content}
          </p>
        </div>
      ),
    });
  });

  // ─── SIGNATURES (new page only when clauses precede) ───
  blocks.push({
    id: "signatures",
    section: "signatures",
    breakBefore: enabledClauses.length > 0,
    element: (
      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: accent, marginBottom: "12px", textAlign: "center" }}>
          IN WITNESS WHEREOF
        </div>
        <p style={{ fontSize: "13px", color: "#64748b", textAlign: "center", margin: "0 0 30px 0" }}>
          The parties have executed this Agreement as of the Effective Date first written above.
        </p>
        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
          {/* Party A Signature */}
          <div style={{ flex: "1 1 45%", minWidth: "200px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginBottom: "20px" }}>
              For and on behalf of {form.partyA.name || `[${config.partyARole}]`}:
            </div>
            <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #1e293b" : "1px solid #1e293b", width: "220px", marginBottom: "4px" }} />
            <div style={{ fontSize: "12px", color: "#64748b" }}>Signature</div>
            <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "220px", marginTop: "16px", marginBottom: "4px" }} />
            <div style={{ fontSize: "12px", color: "#64748b" }}>Name & Title</div>
            {form.signatureConfig.showDate && (
              <>
                <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "140px", marginTop: "16px", marginBottom: "4px" }} />
                <div style={{ fontSize: "12px", color: "#64748b" }}>Date</div>
              </>
            )}
            {form.signatureConfig.showSeal && (
              <div style={{ width: "80px", height: "80px", border: "2px dashed #cbd5e1", borderRadius: "50%", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Seal</span>
              </div>
            )}
          </div>
          {/* Party B Signature */}
          <div style={{ flex: "1 1 45%", minWidth: "200px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", marginBottom: "20px" }}>
              For and on behalf of {form.partyB.name || `[${config.partyBRole}]`}:
            </div>
            <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #1e293b" : "1px solid #1e293b", width: "220px", marginBottom: "4px" }} />
            <div style={{ fontSize: "12px", color: "#64748b" }}>Signature</div>
            <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "220px", marginTop: "16px", marginBottom: "4px" }} />
            <div style={{ fontSize: "12px", color: "#64748b" }}>Name & Title</div>
            {form.signatureConfig.showDate && (
              <>
                <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "140px", marginTop: "16px", marginBottom: "4px" }} />
                <div style={{ fontSize: "12px", color: "#64748b" }}>Date</div>
              </>
            )}
            {form.signatureConfig.showSeal && (
              <div style={{ width: "80px", height: "80px", border: "2px dashed #cbd5e1", borderRadius: "50%", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Seal</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
  });

  // ─── WITNESSES ───
  if (form.signatureConfig.showWitness) {
    blocks.push({
      id: "witnesses",
      section: "witnesses",
      element: (
        <div style={{ marginTop: "36px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Witness{form.signatureConfig.witnessCount > 1 ? "es" : ""}
          </div>
          <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
            {Array.from({ length: form.signatureConfig.witnessCount }, (_, i) => (
              <div key={i} style={{ flex: "1 1 45%", minWidth: "200px" }}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>Witness {i + 1}</div>
                <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #1e293b" : "1px solid #1e293b", width: "200px", marginBottom: "4px" }} />
                <div style={{ fontSize: "12px", color: "#64748b" }}>Signature</div>
                <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "200px", marginTop: "12px", marginBottom: "4px" }} />
                <div style={{ fontSize: "12px", color: "#64748b" }}>Full Name</div>
                <div style={{ borderBottom: form.signatureConfig.lineStyle === "dotted" ? "2px dotted #cbd5e1" : "1px solid #cbd5e1", width: "200px", marginTop: "12px", marginBottom: "4px" }} />
                <div style={{ fontSize: "12px", color: "#64748b" }}>ID/NRC Number</div>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Pagination algorithm — greedy bin-packing of blocks into pages
// ---------------------------------------------------------------------------

function paginateBlocks(
  blocks: ContentBlock[],
  heights: Map<string, number>,
  usableH: number,
): string[][] {
  if (blocks.length === 0) return [[]];

  const pages: string[][] = [[]];
  let remaining = usableH;

  for (const block of blocks) {
    const raw = heights.get(block.id) ?? 0;
    const h = raw + SAFETY_PX; // sub-pixel safety

    // Zero-height blocks (decorative dividers etc.) — always add to current page
    if (raw <= 0) {
      pages[pages.length - 1].push(block.id);
      continue;
    }

    // Force page break
    if (block.breakBefore && pages[pages.length - 1].length > 0) {
      pages.push([]);
      remaining = usableH;
    }

    if (h <= remaining) {
      // Fits on current page
      pages[pages.length - 1].push(block.id);
      remaining -= h;
    } else if (h <= usableH) {
      // Doesn't fit here but fits on a fresh page
      pages.push([block.id]);
      remaining = usableH - h;
    } else {
      // Block taller than a full page — give it its own page
      if (pages[pages.length - 1].length > 0) {
        pages.push([]);
      }
      pages[pages.length - 1].push(block.id);
      remaining = 0; // force next block to a new page
    }
  }

  // Remove trailing empty pages
  while (pages.length > 1 && pages[pages.length - 1].length === 0) {
    pages.pop();
  }

  return pages;
}

// ---------------------------------------------------------------------------
// Main Renderer
// ---------------------------------------------------------------------------

interface ContractRendererProps {
  form: ContractFormData;
  onPageCount?: (count: number) => void;
  pageGap?: number;
}

export default function ContractRenderer({
  form,
  onPageCount,
  pageGap = PAGE_GAP,
}: ContractRendererProps) {
  const tpl = useMemo(() => getContractTemplate(form.style.template), [form.style.template]);
  const fonts = useMemo(() => getFonts(form.style.fontPairing), [form.style.fontPairing]);
  const fontUrl = useMemo(() => getGoogleFontUrl(form.style.fontPairing), [form.style.fontPairing]);
  const { w: pageW, h: pageH } = PAGE_PX[form.printConfig.pageSize] ?? PAGE_PX.a4;
  const accent = form.style.accentColor;
  const config = CONTRACT_TYPE_CONFIGS[form.contractType];
  const usableH = pageH - 2 * MARGIN - FOOTER_H;

  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<string[][]>([]);
  const [measureVer, setMeasureVer] = useState(0);

  // Build content blocks
  const blocks = useMemo(
    () => buildContentBlocks(form, config, fonts, accent, tpl),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      form.contractType,
      form.documentInfo.title,
      form.documentInfo.subtitle,
      form.documentInfo.referenceNumber,
      form.documentInfo.effectiveDate,
      form.documentInfo.expiryDate,
      form.documentInfo.preambleText,
      form.documentInfo.showConfidentialBanner,
      form.documentInfo.showTableOfContents,
      form.partyA.name,
      form.partyA.role,
      form.partyA.address,
      form.partyA.city,
      form.partyA.country,
      form.partyA.representative,
      form.partyA.representativeTitle,
      form.partyB.name,
      form.partyB.role,
      form.partyB.address,
      form.partyB.city,
      form.partyB.country,
      form.partyB.representative,
      form.partyB.representativeTitle,
      form.clauses,
      form.signatureConfig.lineStyle,
      form.signatureConfig.showDate,
      form.signatureConfig.showSeal,
      form.signatureConfig.showWitness,
      form.signatureConfig.witnessCount,
      form.style.headerStyle,
      form.style.accentColor,
      form.style.fontPairing,
      form.style.template,
      form.style.fillableFields,
      form.style.coverDesign,
    ],
  );

  // Build block lookup
  const blockMap = useMemo(() => {
    const map = new Map<string, ContentBlock>();
    for (const b of blocks) map.set(b.id, b);
    return map;
  }, [blocks]);

  // Re-measure when fonts finish loading (critical for accurate heights)
  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setMeasureVer((v) => v + 1);
    });
    return () => { cancelled = true; };
  }, [fontUrl]);

  // Measure block heights & paginate (runs before paint)
  useLayoutEffect(() => {
    const container = measureRef.current;
    if (!container || blocks.length === 0) {
      setPages([blocks.map((b) => b.id)]);
      return;
    }

    // Measure each block's actual rendered height via offsetHeight
    // Wrappers have overflow:hidden (BFC) so margins are contained
    const els = container.querySelectorAll<HTMLElement>("[data-block-id]");
    const heights = new Map<string, number>();

    for (const el of els) {
      const id = el.dataset.blockId;
      if (id) heights.set(id, el.offsetHeight);
    }

    const result = paginateBlocks(blocks, heights, usableH);
    setPages(result);
  }, [blocks, usableH, measureVer]);

  // Report page count to parent (include cover page if enabled)
  const hasCover = form.style.showCoverPage && (form.style.coverDesign ?? "classic") !== "none";
  useEffect(() => {
    const count = (pages.length || 1) + (hasCover ? 1 : 0);
    if (onPageCount) onPageCount(count);
  }, [pages.length, onPageCount, hasCover]);

  // Use measured pages if available, fallback to all-on-one-page
  const currentPages = pages.length > 0 ? pages : [blocks.map((b) => b.id)];
  const totalPages = currentPages.length; // content pages only (cover excluded from numbering)

  // Common font styles for measurement and page rendering
  const fontStyles: React.CSSProperties = {
    fontFamily: `'${fonts.body}', 'Inter', sans-serif`,
    fontSize: "13px",
    lineHeight: 1.65,
    color: "#1e293b",
  };

  return (
    <div data-contract-document>
      {/* Google Fonts */}
      <link rel="stylesheet" href={fontUrl} />

      {/* Hidden measurement container — exact content width, BFC-isolated blocks */}
      <div
        ref={measureRef}
        data-ct-measure
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          width: `${pageW - 2 * MARGIN}px`,
          visibility: "hidden",
          ...fontStyles,
        }}
      >
        {blocks.map((b) => (
          <div key={b.id} data-block-id={b.id} style={{ overflow: "hidden" }}>
            {b.element}
          </div>
        ))}
      </div>

      {/* Rendered pages */}
      <div
        data-ct-pages
        style={{
          display: "flex",
          flexDirection: "column",
          gap: `${pageGap}px`,
        }}
      >
        {/* Cover page */}
        {hasCover && (
          <CoverPage
            form={form}
            config={config}
            fonts={fonts}
            tpl={tpl}
            accent={accent}
            pageW={pageW}
            pageH={pageH}
            fontStyles={fontStyles}
          />
        )}

        {/* Content pages */}
        {currentPages.map((pageBlockIds, pageIdx) => (
          <div
            key={pageIdx}
            data-contract-page={pageIdx + 1}
            style={{
              width: `${pageW}px`,
              height: `${pageH}px`,
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              ...fontStyles,
              pageBreakAfter: pageIdx < totalPages - 1 ? "always" : "auto",
            }}
          >
            {/* Decorative overlays */}
            <WatermarkOverlay form={form} />
            <PageBorder tpl={tpl} accent={accent} />
            <DecorativeOverlay tpl={tpl} />

            {/* Content area */}
            <div
              style={{
                position: "absolute",
                top: `${MARGIN}px`,
                left: `${MARGIN}px`,
                right: `${MARGIN}px`,
                bottom: `${MARGIN}px`,
                display: "flex",
                flexDirection: "column",
                zIndex: 1,
              }}
            >
              {/* Block content — no overflow:hidden so slight mismatch bleeds gracefully */}
              <div style={{ flex: "1 1 auto", minHeight: 0 }}>
                {pageBlockIds.map((id) => {
                  const block = blockMap.get(id);
                  if (!block) {
                    if (process.env.NODE_ENV === "development") {
                      console.warn(`[ContractRenderer] Block "${id}" not found in blockMap`);
                    }
                    return null;
                  }
                  return (
                    <div key={id} data-ct-section={block.section}>
                      {block.element}
                    </div>
                  );
                })}
              </div>

              {/* Page footer */}
              <div style={{ flexShrink: 0, marginTop: "auto" }}>
                <PageFooter
                  form={form}
                  tpl={tpl}
                  accent={accent}
                  pageNum={pageIdx + 1}
                  totalPages={totalPages}
                  isLastPage={pageIdx === totalPages - 1}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
