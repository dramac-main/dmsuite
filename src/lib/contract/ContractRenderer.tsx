// =============================================================================
// DMSuite â€” Contract Document Renderer (Paginated)
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
// Constants â€” exported for workspace scroll calculations
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
// Fillable Line â€” renders a dotted line for pen fill-in when fields are empty
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
// Cover Page â€” Multiple design variants
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


// â”€â”€ Classic Legal (Ref: Tenancy Agreement â€” pure formal legal standard) â”€â”€â”€â”€â”€
function CoverClassic({ form, config, fonts, pageW, pageH, fontStyles }: CoverProps) {
  const title = form.documentInfo.title || config.defaultTitle;
  const lineW = "280px";
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", ...fontStyles, pageBreakAfter: "always" }}>
      <div style={{ position: "absolute", top: `${MARGIN + 30}px`, left: `${MARGIN + 20}px`, right: `${MARGIN + 20}px`, bottom: `${MARGIN}px`, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {/* Title â€” top, bold, left-aligned, all caps */}
        <h1 style={{ fontSize: "22px", fontWeight: 700, fontFamily: `'${fonts.heading}', serif`, letterSpacing: "3px", textTransform: "uppercase", color: "#000000", margin: "0 0 56px 0", textAlign: "left", width: "100%", lineHeight: 1.6 }}>
          {title}
        </h1>
        {/* BETWEEN */}
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#000000", letterSpacing: "3px", marginBottom: "36px", textAlign: "center", width: "100%" }}>BETWEEN</div>
        {/* Party A underline + role */}
        <div style={{ textAlign: "center", width: "100%", marginBottom: "6px" }}>
          <div style={{ width: lineW, borderBottom: "2px solid #000000", paddingBottom: "6px", fontSize: "15px", fontWeight: 500, color: "#000000", textAlign: "center", minHeight: "22px", margin: "0 auto" }}>{form.partyA.name || ""}</div>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", letterSpacing: "1px", marginBottom: "32px", textAlign: "center", width: "100%" }}>
          ({(form.partyA.role || config.partyARole).toUpperCase()})
        </div>
        {/* AND */}
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#000000", letterSpacing: "3px", marginBottom: "36px", textAlign: "center", width: "100%" }}>AND</div>
        {/* Party B underline + role */}
        <div style={{ textAlign: "center", width: "100%", marginBottom: "6px" }}>
          <div style={{ width: lineW, borderBottom: "2px solid #000000", paddingBottom: "6px", fontSize: "15px", fontWeight: 500, color: "#000000", textAlign: "center", minHeight: "22px", margin: "0 auto" }}>{form.partyB.name || ""}</div>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#000000", letterSpacing: "1px", textAlign: "center", width: "100%" }}>
          ({(form.partyB.role || config.partyBRole).toUpperCase()})
        </div>
        {/* Flexible spacer pushes date to bottom */}
        <div style={{ flex: "1 1 auto" }} />
        {/* Date at bottom-left â€” formal legal style */}
        {form.documentInfo.effectiveDate && (
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#000000", letterSpacing: "1px", marginBottom: "80px" }}>
            {formatCoverDate(form.documentInfo.effectiveDate)}
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Corporate (Ref: Vendor Agreement â€” gray bg, border, footer bar) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CoverCorporate({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  const title = form.documentInfo.title || config.defaultTitle;
  const footerH = Math.round(pageH * 0.068);
  const inset = 18;
  const onAccent = contrastText(accent);
  // Split title: first word bold, rest lighter weight
  const words = title.split(/\s+/);
  const firstWord = words[0] || title;
  const restWords = words.slice(1).join(" ");
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#ededed", ...fontStyles, pageBreakAfter: "always" }}>
      {/* Inner thin border frame */}
      <div style={{ position: "absolute", top: `${inset}px`, left: `${inset}px`, right: `${inset}px`, bottom: `${inset}px`, border: "1px solid #c0c0c0", pointerEvents: "none", zIndex: 1 }} />
      {/* Logo box â€” top center */}
      <div style={{ position: "absolute", top: `${Math.round(pageH * 0.055)}px`, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}>
        <div style={{ width: "64px", height: "64px", border: "1.5px solid #999999", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "11px", color: "#666666", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", lineHeight: 1.3, fontWeight: 700, whiteSpace: "pre" }}>{"YOUR\nLOGO"}</span>
        </div>
      </div>
      {/* Title block â€” centered vertically */}
      <div style={{ position: "absolute", top: "50%", left: `${MARGIN}px`, right: `${MARGIN}px`, transform: "translateY(-55%)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "34px", fontWeight: 900, fontFamily: `'${fonts.heading}', serif`, color: "#1a1a1a", letterSpacing: "2px", textTransform: "uppercase", lineHeight: 1.25 }}>
            {firstWord}
          </div>
          {restWords && (
            <div style={{ fontSize: "30px", fontWeight: 400, fontFamily: `'${fonts.heading}', serif`, color: "#1a1a1a", letterSpacing: "3px", textTransform: "uppercase", lineHeight: 1.4 }}>
              {restWords}
            </div>
          )}
        </div>
        {/* Horizontal rule under title */}
        <div style={{ width: "260px", height: "1.5px", backgroundColor: "#333333" }} />
      </div>
      {/* Dark footer bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${footerH}px`, backgroundColor: "#333333", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <span style={{ fontSize: "11px", color: "#d4d4d4", letterSpacing: "1px", textAlign: "center" }}>
          {[form.partyA.name, form.partyB.name, form.documentInfo.referenceNumber ? `Ref: ${form.documentInfo.referenceNumber}` : null].filter(Boolean).join("  |  ")}
        </span>
      </div>
      {/* Corner accent squares */}
      <div style={{ position: "absolute", bottom: `${footerH + 8}px`, left: `${inset + 8}px`, width: "10px", height: "10px", backgroundColor: "#888888", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: `${footerH + 8}px`, right: `${inset + 8}px`, width: "10px", height: "10px", backgroundColor: "#888888", zIndex: 2 }} />
    </div>
  );
}

// â”€â”€ Dark Executive (Ref: LLC Membership â€” navy bg, accent title, edge stripes) â”€
function CoverDarkExecutive({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  const title = form.documentInfo.title || config.defaultTitle;
  const bg = "#1b2a4a";
  const onAccent = contrastText(accent);
  const stripeR = 24;
  const stripeW = 2.5;
  const stripeGap = 7;
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: bg, ...fontStyles, pageBreakAfter: "always" }}>
      {/* Logo box â€” top left with accent border */}
      <div style={{ position: "absolute", top: `${MARGIN + 10}px`, left: `${MARGIN}px`, zIndex: 2 }}>
        <div style={{ width: "56px", height: "56px", border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "10px", color: accent, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", lineHeight: 1.3, fontWeight: 700, whiteSpace: "pre" }}>{"YOUR\nLOGO"}</span>
        </div>
      </div>
      {/* Title â€” large, left-aligned, accent-colored, positioned at ~38% */}
      <div style={{ position: "absolute", top: `${Math.round(pageH * 0.38)}px`, left: `${MARGIN}px`, right: `${MARGIN + 60}px`, zIndex: 2 }}>
        <h1 style={{ fontSize: "42px", fontWeight: 800, fontFamily: `'${fonts.heading}', serif`, color: accent, margin: "0 0 24px 0", lineHeight: 1.12, textTransform: "uppercase", letterSpacing: "1px" }}>
          {title}
        </h1>
        {/* Two-part rule: short solid accent + longer faded */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ height: "3px", width: "48px", backgroundColor: accent }} />
          <div style={{ height: "1.5px", width: "180px", backgroundColor: "#ffffff25" }} />
        </div>
      </div>
      {/* Bottom-left: party/contact info */}
      <div style={{ position: "absolute", bottom: `${MARGIN + 20}px`, left: `${MARGIN}px`, zIndex: 2, display: "flex", flexDirection: "column", gap: "4px" }}>
        {form.partyA.name && <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>{form.partyA.name}</div>}
        {form.partyB.name && <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>{form.partyB.name}</div>}
        {form.documentInfo.effectiveDate && (
          <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>
            {new Date(form.documentInfo.effectiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        )}
        {form.documentInfo.referenceNumber && <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>Ref: {form.documentInfo.referenceNumber}</div>}
      </div>
      {/* Right edge: 3 thin vertical accent stripes */}
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", top: `${MARGIN}px`, bottom: `${MARGIN}px`, right: `${stripeR + i * (stripeW + stripeGap)}px`, width: `${stripeW}px`, backgroundColor: accent, zIndex: 1 }} />
      ))}
    </div>
  );
}

// â”€â”€ Accent Split (Ref: Office Lease â€” white left, navy right, highlight bar) â”€â”€
function CoverAccentSplit({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  const title = form.documentInfo.title || config.defaultTitle;
  const panelW = Math.round(pageW * 0.32);
  const navy = "#1b2a4a";
  const onAccent = contrastText(accent);
  // Split title: extract trailing keyword for highlight bar
  const titleWords = title.split(/\s+/);
  const lastWord = titleWords[titleWords.length - 1]?.toLowerCase() ?? "";
  const isKeyword = ["agreement", "contract", "nda", "mou"].includes(lastWord);
  const mainTitle = isKeyword && titleWords.length > 1 ? titleWords.slice(0, -1).join(" ") : title;
  const highlightWord = isKeyword ? titleWords[titleWords.length - 1].toUpperCase() : "AGREEMENT";
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", ...fontStyles, pageBreakAfter: "always" }}>
      {/* Left white panel */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${panelW}px`, backgroundColor: "#ffffff", zIndex: 0 }} />
      {/* Right dark navy panel */}
      <div style={{ position: "absolute", top: 0, left: `${panelW}px`, right: 0, bottom: 0, backgroundColor: navy, zIndex: 0 }} />
      {/* Logo box â€” top-left of the navy section */}
      <div style={{ position: "absolute", top: `${MARGIN + 10}px`, left: `${panelW + Math.round(MARGIN * 0.6)}px`, zIndex: 2 }}>
        <div style={{ width: "50px", height: "50px", backgroundColor: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "10px", color: "#ffffff", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center", lineHeight: 1.3, fontWeight: 700, whiteSpace: "pre" }}>{"YOUR\nLOGO"}</span>
        </div>
      </div>
      {/* Contact info below logo */}
      <div style={{ position: "absolute", top: `${MARGIN + 70}px`, left: `${panelW + Math.round(MARGIN * 0.6)}px`, zIndex: 2, display: "flex", flexDirection: "column", gap: "3px" }}>
        {form.partyA.name && <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "0.5px" }}>{form.partyA.name}</div>}
        {form.partyB.name && <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "0.5px" }}>{form.partyB.name}</div>}
        {form.documentInfo.referenceNumber && <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "0.5px" }}>Ref: {form.documentInfo.referenceNumber}</div>}
      </div>
      {/* Title area â€” mid-page, across both panels */}
      <div style={{ position: "absolute", top: `${Math.round(pageH * 0.45)}px`, left: `${MARGIN}px`, right: `${MARGIN}px`, zIndex: 3 }}>
        {/* Main title text */}
        <div style={{ fontSize: "36px", fontWeight: 700, fontFamily: `'${fonts.heading}', serif`, color: "#ffffff", lineHeight: 1.15, marginBottom: "6px", fontStyle: "italic" }}>
          {mainTitle}
        </div>
        {/* Highlight bar behind keyword */}
        <div style={{ display: "inline-block", backgroundColor: accent, padding: "8px 20px" }}>
          <span style={{ fontSize: "26px", fontWeight: 800, fontFamily: `'${fonts.heading}', serif`, color: onAccent, letterSpacing: "5px", textTransform: "uppercase" }}>
            {highlightWord}
          </span>
        </div>
      </div>
      {/* Date at bottom-left â€” across white area */}
      {form.documentInfo.effectiveDate && (
        <div style={{ position: "absolute", bottom: `${MARGIN + 20}px`, left: `${MARGIN}px`, zIndex: 3 }}>
          <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>{formatCoverDate(form.documentInfo.effectiveDate)}</div>
        </div>
      )}
    </div>
  );
}

// â”€â”€ Bold Frame (Ref: Consulting Agreement â€” thick accent frame, logo top-right)
function CoverBoldFrame({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  const title = form.documentInfo.title || config.defaultTitle;
  const onAccent = contrastText(accent);
  const frameInset = 26;
  const frameW = 5;
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", ...fontStyles, pageBreakAfter: "always" }}>
      {/* Thick accent-colored frame border */}
      <div style={{ position: "absolute", top: `${frameInset}px`, left: `${frameInset}px`, right: `${frameInset}px`, bottom: `${frameInset}px`, border: `${frameW}px solid ${accent}`, pointerEvents: "none", zIndex: 1 }} />
      {/* Logo box â€” top right inside frame, accent-colored */}
      <div style={{ position: "absolute", top: `${frameInset + 30}px`, right: `${frameInset + 30}px`, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
        <div style={{ width: "48px", height: "48px", backgroundColor: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "10px", color: onAccent, fontWeight: 700, textAlign: "center", lineHeight: 1.3, whiteSpace: "pre" }}>{"YOUR\nLOGO"}</span>
        </div>
        {form.partyA.name && (
          <div style={{ fontSize: "10px", color: "#6b7280", letterSpacing: "1.5px" }}>{form.partyA.name}</div>
        )}
      </div>
      {/* Title â€” left-aligned in accent color, positioned ~40% down */}
      <div style={{ position: "absolute", top: `${Math.round(pageH * 0.38)}px`, left: `${frameInset + MARGIN}px`, right: `${frameInset + MARGIN}px`, zIndex: 2 }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, fontFamily: `'${fonts.heading}', serif`, color: accent, margin: "0 0 36px 0", lineHeight: 1.2, textTransform: "uppercase", letterSpacing: "1px" }}>
          {title}
        </h1>
      </div>
      {/* Contact/party info â€” centered below title */}
      <div style={{ position: "absolute", top: `${Math.round(pageH * 0.56)}px`, left: `${frameInset + MARGIN}px`, right: `${frameInset + MARGIN}px`, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
        {form.partyB.name && <div style={{ fontSize: "12px", color: "#6b7280", letterSpacing: "2px" }}>{form.partyB.name}</div>}
        {form.documentInfo.effectiveDate && (
          <div style={{ fontSize: "12px", color: "#6b7280", letterSpacing: "2px" }}>
            {new Date(form.documentInfo.effectiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        )}
        {form.documentInfo.referenceNumber && <div style={{ fontSize: "12px", color: "#6b7280", letterSpacing: "2px" }}>Ref: {form.documentInfo.referenceNumber}</div>}
      </div>
    </div>
  );
}

// â”€â”€ Minimal Line (Ref: Contract Agreement â€” left strip, logo right, bold title)
function CoverMinimalLine({ form, config, fonts, accent, pageW, pageH, fontStyles }: CoverProps) {
  const title = form.documentInfo.title || config.defaultTitle;
  return (
    <div data-contract-page="cover" style={{ width: `${pageW}px`, height: `${pageH}px`, position: "relative", overflow: "hidden", backgroundColor: "#ffffff", ...fontStyles, pageBreakAfter: "always" }}>
      {/* Left accent strip â€” dual-tone: accent top, dark bottom */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: `${Math.round(pageH * 0.30)}px`, width: "10px", backgroundColor: accent, opacity: 0.75, zIndex: 1 }} />
      <div style={{ position: "absolute", top: `${Math.round(pageH * 0.70)}px`, left: 0, bottom: 0, width: "10px", backgroundColor: "#1e2d4f", zIndex: 1 }} />
      {/* Logo box â€” top right, dark square */}
      <div style={{ position: "absolute", top: `${MARGIN + 10}px`, right: `${MARGIN}px`, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
        <div style={{ width: "48px", height: "48px", backgroundColor: "#1e2d4f", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "10px", color: "#ffffff", fontWeight: 700, textAlign: "center", lineHeight: 1.3, whiteSpace: "pre" }}>{"YOUR\nLOGO"}</span>
        </div>
      </div>
      {/* Thin horizontal rule â€” upper area */}
      <div style={{ position: "absolute", top: `${MARGIN + 80}px`, left: `${MARGIN + 24}px`, right: `${MARGIN + 140}px`, height: "1.5px", backgroundColor: "#333333", zIndex: 2 }} />
      {/* Title â€” large bold dark text, left-aligned */}
      <div style={{ position: "absolute", top: `${Math.round(pageH * 0.40)}px`, left: `${MARGIN + 24}px`, right: `${MARGIN}px`, zIndex: 2 }}>
        <h1 style={{ fontSize: "38px", fontWeight: 800, fontFamily: `'${fonts.heading}', serif`, color: "#1e2d4f", margin: 0, lineHeight: 1.15, textTransform: "uppercase", letterSpacing: "1px" }}>
          {title}
        </h1>
      </div>
      {/* Bottom-left: party info with accent underlines */}
      <div style={{ position: "absolute", bottom: `${MARGIN + 20}px`, left: `${MARGIN + 24}px`, zIndex: 2, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#4b5563", fontWeight: 500 }}>
            {[form.partyA.name, form.partyB.name].filter(Boolean).join("  |  ")}
          </span>
          <div style={{ height: "1.5px", width: "60px", backgroundColor: accent }} />
        </div>
        {(form.documentInfo.effectiveDate || form.documentInfo.referenceNumber) && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#4b5563", fontWeight: 500 }}>
              {[
                form.documentInfo.effectiveDate
                  ? new Date(form.documentInfo.effectiveDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                  : null,
                form.documentInfo.referenceNumber ? `Ref: ${form.documentInfo.referenceNumber}` : null,
              ].filter(Boolean).join("  |  ")}
            </span>
            <div style={{ height: "1.5px", width: "40px", backgroundColor: accent }} />
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Cover Page dispatcher â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      {/* Legal disclaimer â€” last page only */}
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

  // â”€â”€â”€ CONFIDENTIAL BANNER â”€â”€â”€
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

  // â”€â”€â”€ HEADER â”€â”€â”€
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

  // â”€â”€â”€ PARTIES â”€â”€â”€
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

  // â”€â”€â”€ DIVIDER â”€â”€â”€
  blocks.push({
    id: "divider",
    section: "parties",
    element: <div style={{ height: "1px", backgroundColor: `${accent}20`, marginBottom: "16px" }} />,
  });

  // â”€â”€â”€ PREAMBLE â”€â”€â”€
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

  // â”€â”€â”€ TABLE OF CONTENTS â”€â”€â”€
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

  // â”€â”€â”€ CLAUSES (one block per clause) â”€â”€â”€
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

  // â”€â”€â”€ SIGNATURES (new page only when clauses precede) â”€â”€â”€
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

  // â”€â”€â”€ WITNESSES â”€â”€â”€
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
// Pagination algorithm â€” greedy bin-packing of blocks into pages
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

    // Zero-height blocks (decorative dividers etc.) â€” always add to current page
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
      // Block taller than a full page â€” give it its own page
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

      {/* Hidden measurement container â€” exact content width, BFC-isolated blocks */}
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
              {/* Block content â€” no overflow:hidden so slight mismatch bleeds gracefully */}
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
