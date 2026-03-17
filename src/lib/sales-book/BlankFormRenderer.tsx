// =============================================================================
// DMSuite — Blank Form Renderer (v4 — 20-Template Visual Overhaul)
// Renders blank sales book forms (invoices, receipts, quotations, etc.)
// for physical printing. All fields are empty slots designed to be
// filled in with a pen after printing.
//
// v4 enhancements:
// - 20 visually distinct templates with watermarks, footer bars,
//   contact icons, decorative corners, page borders, gradient headers
// - Receipt slips render as horizontal landscape cards (3-up on A4)
// - Heavy/medium/light border weights
// - Totals rendered as stacked, boxed, or badge styles
//
// Print Standards:
// - Min font: 7pt body (≈9.3px @96dpi), 6pt fine print (≈8px)
// - Binding gutter: 12mm (46px) for stapled booklets
// - Safe margin: 8mm (30px) from trim edge all sides
// - Proper density scaling for multi-form-per-page layouts
// - A4 (210×297mm), A5 (148×210mm), Letter (8.5×11in), Legal (8.5×14in)
// =============================================================================

"use client";

import React, { useMemo } from "react";
import type { SalesBookFormData } from "@/lib/sales-book/schema";
import {
  DOCUMENT_TYPE_CONFIGS,
  FONT_PAIRINGS,
  ITEM_COLUMNS,
  getTemplateConfig,
} from "@/lib/sales-book/schema";
import type { SalesDocumentType, PageFormat } from "@/lib/invoice/schema";
import type { SalesBookTemplate } from "@/lib/sales-book/schema";

// ---------------------------------------------------------------------------
// Pixel dimensions at 96 CSS PPI for each page format
// ---------------------------------------------------------------------------

const PAGE_PX: Record<PageFormat, { w: number; h: number }> = {
  a4:     { w: 794, h: 1123 },
  a5:     { w: 559, h: 794 },
  letter: { w: 816, h: 1056 },
  legal:  { w: 816, h: 1344 },
};

// ---------------------------------------------------------------------------
// Print-quality constants
// ---------------------------------------------------------------------------

/** Safe margin from page edge in px (≈8mm at 96 DPI) */
const SAFE_MARGIN = 30;

/** Binding gutter for booklet stapling in px (≈12mm at 96 DPI) */
const BINDING_GUTTER = 46;

/** Min font size to guarantee print legibility (≈7pt) */
const MIN_FONT_PX = 10;

/** Min label / caption font (≈6pt) */
const MIN_LABEL_PX = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFonts(fontPairingId: string) {
  const fp = FONT_PAIRINGS.find((f) => f.id === fontPairingId) ?? FONT_PAIRINGS[0];
  return { heading: fp.heading, body: fp.body };
}

function getGoogleFontUrl(fontPairingId: string): string {
  const fp = FONT_PAIRINGS.find((f) => f.id === fontPairingId) ?? FONT_PAIRINGS[0];
  const families = new Set([fp.heading, fp.body]);
  const params = [...families].map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800;900`).join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** Ensure a font size never drops below print minimum */
function clampFont(size: number, min = MIN_FONT_PX): number {
  return Math.max(min, Math.round(size));
}

/** Map table border weight to pixel value */
function getBorderPx(weight: "light" | "medium" | "heavy"): number {
  return weight === "heavy" ? 3 : weight === "medium" ? 1.5 : 1;
}

// ---------------------------------------------------------------------------
// Decorative Overlays — Watermarks, corners, page borders, footer bars
// ---------------------------------------------------------------------------

function WatermarkOverlay({ tpl, density, title }: { tpl: SalesBookTemplate; density: number; title: string }) {
  if (tpl.watermark === "none") return null;

  if (tpl.watermark === "text") {
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-30deg)", fontSize: `${Math.round(60 * density)}px`, fontWeight: 900, color: tpl.accent, opacity: 0.04, whiteSpace: "nowrap", letterSpacing: "8px", textTransform: "uppercase" }}>
          {title}
        </div>
      </div>
    );
  }

  if (tpl.watermark === "logo") {
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: `${Math.round(200 * density)}px`, height: `${Math.round(200 * density)}px`, borderRadius: "50%", border: `${Math.round(6 * density)}px solid ${tpl.accent}`, opacity: 0.05 }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: `${Math.round(160 * density)}px`, height: `${Math.round(160 * density)}px`, borderRadius: "50%", border: `${Math.round(3 * density)}px solid ${tpl.accent}`, opacity: 0.04 }} />
      </div>
    );
  }

  // faded-title
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%)", fontSize: `${Math.round(90 * density)}px`, fontWeight: 900, color: tpl.accent, opacity: 0.03, whiteSpace: "nowrap", letterSpacing: "4px", textTransform: "uppercase" }}>
        {title}
      </div>
    </div>
  );
}

function DecorativeOverlay({ tpl, density }: { tpl: SalesBookTemplate; density: number }) {
  if (tpl.decorative === "none") return null;

  if (tpl.decorative === "corner-gradient") {
    const accent2 = tpl.accentSecondary ?? tpl.accent;
    return (
      <div style={{ position: "absolute", bottom: 0, right: 0, width: `${Math.round(120 * density)}px`, height: `${Math.round(120 * density)}px`, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", bottom: `${Math.round(-20 * density)}px`, right: `${Math.round(-20 * density)}px`, width: `${Math.round(140 * density)}px`, height: `${Math.round(140 * density)}px`, background: `linear-gradient(135deg, ${tpl.accent}40, ${accent2}30)`, borderRadius: `${Math.round(20 * density)}px`, transform: "rotate(15deg)" }} />
        <div style={{ position: "absolute", bottom: `${Math.round(-10 * density)}px`, right: `${Math.round(20 * density)}px`, width: `${Math.round(80 * density)}px`, height: `${Math.round(80 * density)}px`, background: `linear-gradient(135deg, ${accent2}30, ${tpl.accent}20)`, borderRadius: `${Math.round(12 * density)}px`, transform: "rotate(30deg)" }} />
      </div>
    );
  }

  if (tpl.decorative === "top-circles") {
    const accent2 = tpl.accentSecondary ?? tpl.accent;
    return (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${Math.round(30 * density)}px`, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: `${Math.round(-40 * density)}px`, left: `${Math.round(20 * density)}px`, width: `${Math.round(80 * density)}px`, height: `${Math.round(80 * density)}px`, borderRadius: "50%", backgroundColor: accent2, opacity: 0.12 }} />
        <div style={{ position: "absolute", top: `${Math.round(-30 * density)}px`, left: `${Math.round(50 * density)}px`, width: `${Math.round(60 * density)}px`, height: `${Math.round(60 * density)}px`, borderRadius: "50%", backgroundColor: tpl.accent, opacity: 0.1 }} />
      </div>
    );
  }

  // page-border
  return (
    <div style={{ position: "absolute", inset: `${Math.round(4 * density)}px`, border: `${Math.round(3 * density)}px solid ${tpl.accent}`, pointerEvents: "none", zIndex: 0, borderRadius: "2px" }} />
  );
}

function PageBorderOverlay({ tpl, density }: { tpl: SalesBookTemplate; density: number }) {
  if (tpl.pageBorderWeight === "none") return null;
  const w = tpl.pageBorderWeight === "thick" ? Math.round(3 * density) : Math.round(1.5 * density);
  return (
    <div style={{ position: "absolute", inset: `${Math.round(3 * density)}px`, border: `${w}px solid ${tpl.accent}`, pointerEvents: "none", zIndex: 0, borderRadius: "1px" }} />
  );
}

/** Colored strip along an edge — visible structural accent */
function AccentStripOverlay({ tpl, density }: { tpl: SalesBookTemplate; density: number }) {
  if (tpl.accentStrip === "none") return null;
  const stripW = Math.round(6 * density);
  const accent2 = tpl.accentSecondary ?? tpl.accent;

  if (tpl.accentStrip === "left") {
    return (
      <div style={{
        position: "absolute", top: 0, left: 0, bottom: 0, width: `${stripW}px`,
        background: `linear-gradient(180deg, ${tpl.accent}, ${accent2})`,
        pointerEvents: "none", zIndex: 0,
      }} />
    );
  }

  // top
  return (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: `${stripW}px`,
      background: `linear-gradient(90deg, ${tpl.accent}, ${accent2})`,
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

/** Background tint — subtle accent wash */
function BackgroundTint({ tpl }: { tpl: SalesBookTemplate }) {
  if (!tpl.backgroundTint) return null;
  const accent2 = tpl.accentSecondary ?? tpl.accent;
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(180deg, ${accent2}08, transparent 60%)`,
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

/** Header divider — the separator below the header section (non-band headers only) */
function getHeaderDividerStyle(tpl: SalesBookTemplate, density: number): React.CSSProperties {
  const accent = tpl.accent;
  switch (tpl.headerDividerStyle) {
    case "thick-line":
      return { borderBottom: `${Math.round(2.5 * density)}px solid ${accent}` };
    case "double-line":
      return { borderBottom: `${Math.round(4 * density)}px double ${accent}` };
    case "accent-bar":
      return {
        borderBottom: "none",
        paddingBottom: `${Math.round(12 * density)}px`,
        backgroundImage: `linear-gradient(to right, ${accent}, ${accent}40)`,
        backgroundSize: `100% ${Math.round(4 * density)}px`,
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
      };
    case "fade":
      return {
        borderBottom: "none",
        paddingBottom: `${Math.round(12 * density)}px`,
        backgroundImage: `linear-gradient(to right, ${accent}50, transparent)`,
        backgroundSize: `100% ${Math.round(1.5 * density)}px`,
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
      };
    case "thin-line":
    default:
      return { borderBottom: `${Math.round(1 * density)}px solid ${accent}40` };
  }
}

function FooterBar({ tpl, density, branding }: { tpl: SalesBookTemplate; density: number; branding: SalesBookFormData["companyBranding"] }) {
  if (tpl.footerStyle === "none") return null;
  const fontSize = clampFont(Math.round(8 * density), MIN_LABEL_PX);
  const contactParts = [branding.phone, branding.email, branding.website].filter(Boolean);

  if (tpl.footerStyle === "bar") {
    return (
      <div style={{ backgroundColor: tpl.accent, color: "#ffffff", padding: `${Math.round(6 * density)}px ${Math.round(12 * density)}px`, fontSize: `${fontSize}px`, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
        <span style={{ fontWeight: 600 }}>{branding.name || "\u00A0"}</span>
        {contactParts.length > 0 && <span style={{ opacity: 0.8 }}>{contactParts.join(" · ")}</span>}
      </div>
    );
  }

  if (tpl.footerStyle === "contact-bar") {
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: `${Math.round(16 * density)}px`, padding: `${Math.round(6 * density)}px 0`, borderTop: `1.5px solid ${tpl.accent}30`, marginTop: "auto", fontSize: `${fontSize}px`, color: "#6b7280" }}>
        {branding.phone && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: `${Math.round(14 * density)}px`, height: `${Math.round(14 * density)}px`, borderRadius: "50%", backgroundColor: tpl.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: `${clampFont(Math.round(7 * density), 7)}px` }}>✆</span>
            {branding.phone}
          </span>
        )}
        {branding.email && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: `${Math.round(14 * density)}px`, height: `${Math.round(14 * density)}px`, borderRadius: "50%", backgroundColor: tpl.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: `${clampFont(Math.round(7 * density), 7)}px` }}>✉</span>
            {branding.email}
          </span>
        )}
        {branding.website && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: `${Math.round(14 * density)}px`, height: `${Math.round(14 * density)}px`, borderRadius: "50%", backgroundColor: tpl.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: `${clampFont(Math.round(7 * density), 7)}px` }}>⊕</span>
            {branding.website}
          </span>
        )}
      </div>
    );
  }

  // line footer
  return (
    <div style={{ borderTop: `1px solid ${tpl.accent}30`, paddingTop: `${Math.round(4 * density)}px`, marginTop: "auto", fontSize: `${fontSize}px`, color: "#9ca3af", textAlign: "center" }}>
      {contactParts.length > 0 ? contactParts.join(" · ") : " "}
    </div>
  );
}

function ContactIconRow({ branding, accent, density }: { branding: SalesBookFormData["companyBranding"]; accent: string; density: number }) {
  const iconSize = Math.round(14 * density);
  const fontSize = clampFont(Math.round(9 * density), MIN_LABEL_PX);
  const items: { icon: string; value: string }[] = [];
  if (branding.phone) items.push({ icon: "✆", value: branding.phone });
  if (branding.email) items.push({ icon: "✉", value: branding.email });
  if (branding.website) items.push({ icon: "⊕", value: branding.website });
  if (items.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "3px" }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: `${fontSize}px`, color: "#6b7280" }}>
          <span style={{ width: `${iconSize}px`, height: `${iconSize}px`, borderRadius: "50%", backgroundColor: accent, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: `${clampFont(Math.round(7 * density), 7)}px`, flexShrink: 0 }}>
            {item.icon}
          </span>
          {item.value}
        </span>
      ))}
    </div>
  );
}

/** Get the display label for currency based on format preference */
function getCurrencyLabel(layout: { currencySymbol: string; currencyCode?: string; currencyDisplay?: string }): string {
  if (layout.currencyDisplay === "code" && layout.currencyCode) return layout.currencyCode;
  return layout.currencySymbol || "";
}

/** Render a blank field (underline, box, or dotted) */
function BlankField({
  width = "100%",
  height = "24px",
  fieldStyle = "underline",
  label,
  accentColor,
  fontSize,
}: {
  width?: string;
  height?: string;
  fieldStyle?: "underline" | "box" | "dotted";
  label?: string;
  accentColor?: string;
  fontSize?: number;
}) {
  const border =
    fieldStyle === "box"
      ? "1px solid #c5c9d0"
      : "none";

  const borderBottom =
    fieldStyle === "underline"
      ? "1.5px solid #9ca3af"
      : fieldStyle === "dotted"
        ? "1.5px dotted #9ca3af"
        : "none";

  return (
    <div style={{ marginBottom: "4px" }}>
      {label && (
        <div
          style={{
            fontSize: `${clampFont(fontSize ?? 10, MIN_LABEL_PX)}px`,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: accentColor ?? "#6b7280",
            marginBottom: "3px",
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          width,
          height,
          border,
          borderBottom: fieldStyle === "box" ? undefined : borderBottom,
          backgroundColor: fieldStyle === "box" ? "#fafbfc" : "transparent",
          borderRadius: fieldStyle === "box" ? "2px" : 0,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Blank Form
// ---------------------------------------------------------------------------

interface BlankFormSlipProps {
  form: SalesBookFormData;
  serialIndex: number;
  slipHeight: number;
  slipWidth: number;
  isLastOnPage?: boolean;
}

/** Checkbox */
function BlankCheckbox({ label, size = 13, fontSize = 10 }: { label: string; size?: number; fontSize?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: `${clampFont(fontSize)}px`, color: "#4b5563" }}>
      <span style={{ display: "inline-block", width: `${size}px`, height: `${size}px`, border: "1.5px solid #9ca3af", borderRadius: "2px", flexShrink: 0 }} />
      {label}
    </span>
  );
}

/** Date grid — DAY / MONTH / YEAR boxes (common on African/Asian print forms) */
function DateGrid({ accentColor, density = 1 }: { accentColor: string; density?: number }) {
  const cellW = Math.round(38 * density);
  const cellH = Math.round(22 * density);
  const labelFS = clampFont(Math.round(7 * density), MIN_LABEL_PX);
  return (
    <div style={{ display: "inline-flex", gap: "1px", border: `1.5px solid ${accentColor}`, borderRadius: "3px", overflow: "hidden" }}>
      {["DAY", "MONTH", "YEAR"].map((lbl) => (
        <div key={lbl} style={{ width: `${cellW}px`, textAlign: "center" }}>
          <div style={{ fontSize: `${labelFS}px`, fontWeight: 700, color: "#ffffff", backgroundColor: accentColor, padding: "1px 0", letterSpacing: "0.5px" }}>
            {lbl}
          </div>
          <div style={{ height: `${cellH}px` }} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Receipt Slip — Horizontal card layout (3-up on portrait A4)
// Each receipt is a landscape-oriented card stacked vertically.
// ~794×374px per card. Properly sized fonts — NO density shrinking.
// Content flows: [Main Fields | Amount Box] with optional colored sidebar.
// ---------------------------------------------------------------------------

function BlankReceiptSlip({ form, slipHeight, slipWidth, isLastOnPage }: BlankFormSlipProps) {
  const docType = form.documentType as SalesDocumentType;
  const config = DOCUMENT_TYPE_CONFIGS[docType];
  const fonts = getFonts(form.style.fontPairing);
  const accent = form.style.accentColor;
  const layout = form.formLayout;
  const serial = form.serialConfig;
  const fieldStyle = form.style.fieldStyle;
  const tpl = getTemplateConfig(form.style.template);

  // Receipt cards use FULL-SIZE fonts — each card is ~794×374px which is plenty
  // No density shrinking. These sizes produce readable 8-10pt printed text.
  const bindTop = form.printConfig.bindingPosition === "top";
  const gutterPx = BINDING_GUTTER;  // ~12mm binding gutter
  const padT = bindTop ? gutterPx : 18;
  const padB = 14;
  const padL = bindTop ? 24 : gutterPx;  // binding left when side-bound
  const padR = 24;
  const pad = 24; // general spacing reference
  const fontSize = 12;
  const headingSize = 20;
  const titleSize = 26;
  const rowHeight = 28;
  const labelSize = 10;
  const lineBottom =
    fieldStyle === "underline" ? "1.5px solid #9ca3af"
    : fieldStyle === "dotted" ? "1.5px dotted #9ca3af"
    : "1px solid #d1d5db";

  const sidebarW = tpl.receiptSidebar ? 44 : 0;
  const sidebarColor = tpl.receiptSidebarColor ?? accent;
  const borderInset = form.style.borderStyle !== "none" ? 5 : 0;

  return (
    <div
      style={{
        width: `${slipWidth}px`,
        height: `${slipHeight}px`,
        boxSizing: "border-box",
        paddingTop: `${padT}px`,
        paddingBottom: `${padB}px`,
        paddingLeft: `${padL}px`,
        paddingRight: `${padR}px`,
        position: "relative",
        fontFamily: `'${fonts.body}', sans-serif`,
        fontSize: `${fontSize}px`,
        lineHeight: 1.5,
        color: "#1a1a1a",
        overflow: "hidden",
        borderBottom: form.printConfig.showCutLines && !isLastOnPage ? "2px dashed #ccc" : "none",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {/* Decorative overlays */}
      <WatermarkOverlay tpl={tpl} density={1} title={config.title} />
      <DecorativeOverlay tpl={tpl} density={1} />
      <PageBorderOverlay tpl={tpl} density={1} />
      <AccentStripOverlay tpl={tpl} density={1} />
      <BackgroundTint tpl={tpl} />

      {/* Form Border */}
      {form.style.borderStyle !== "none" && (
        <div style={{ position: "absolute", inset: "4px", border: form.style.borderStyle === "double" ? `3px double ${accent}` : `1.5px solid ${accent}50`, pointerEvents: "none", borderRadius: "2px", zIndex: 1 }} />
      )}

      {/* MAIN CONTENT — horizontal card layout */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 2, overflow: "hidden" }}>

        {/* Header band — full-width, content-aware height, stretches to edges */}
        {tpl.headerBand ? (
          <div style={{
            background: tpl.headerGradient ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : accent,
            padding: `14px ${padR}px 12px ${padL}px`,
            marginTop: `-${padT}px`,
            marginLeft: `-${padL}px`,
            marginRight: `-${padR}px`,
            marginBottom: "10px",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            {/* Left: logo + company */}
            <div style={{ flex: "0 0 auto", maxWidth: "38%" }}>
              {form.companyBranding.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.companyBranding.logoUrl} alt="" style={{ height: "34px", marginBottom: "3px", objectFit: "contain", display: "block" }} />
              )}
              {form.companyBranding.name && (
                <div style={{ fontSize: `${headingSize}px`, fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, color: "#fff", lineHeight: 1.2 }}>
                  {form.companyBranding.name}
                </div>
              )}
              {!form.companyBranding.name && !form.companyBranding.logoUrl && (
                <BlankField width="160px" height="18px" fieldStyle={fieldStyle} label="Company" accentColor="rgba(255,255,255,0.7)" fontSize={9} />
              )}
              {form.companyBranding.address && (
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)", marginTop: "2px", whiteSpace: "pre-line", lineHeight: 1.4 }}>{form.companyBranding.address}</div>
              )}
              {tpl.contactIcons && <ContactIconRow branding={form.companyBranding} accent="rgba(255,255,255,0.5)" density={1} />}
              {!tpl.contactIcons && (form.companyBranding.phone || form.companyBranding.email) && (
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>
                  {[form.companyBranding.phone, form.companyBranding.email].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>

            {/* Center: Receipt title */}
            <div style={{ textAlign: "center", flex: "0 0 auto" }}>
              <div style={{ fontSize: `${titleSize}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "3px", fontFamily: `'${fonts.heading}', sans-serif`, color: "#fff" }}>
                {config.title}
              </div>
            </div>

            {/* Right: serial + date */}
            <div style={{ textAlign: "right", flex: "0 0 auto" }}>
              {serial.showSerial && (
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>No.</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "'Courier New', monospace", color: "rgba(255,255,255,0.85)", letterSpacing: "1px" }}>{serial.prefix}</span>
                  <span style={{ display: "inline-block", width: "65px", borderBottom: "2px solid rgba(255,255,255,0.5)", height: "16px" }}>&nbsp;</span>
                </div>
              )}
              {layout.showDate && (
                <div style={{ marginTop: "6px" }}>
                  <DateGrid accentColor={accent} density={0.92} />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Non-band header: company | title | serial/date with bottom border */
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: `${pad}px ${pad}px 0`, marginBottom: "4px", paddingBottom: "10px", ...getHeaderDividerStyle(tpl, 1) }}>
            <div style={{ flex: "0 0 auto", maxWidth: "38%" }}>
              {form.companyBranding.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.companyBranding.logoUrl} alt="" style={{ height: "34px", marginBottom: "3px", objectFit: "contain", display: "block" }} />
              )}
              {form.companyBranding.name && (
                <div style={{ fontSize: `${headingSize}px`, fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, color: accent, lineHeight: 1.2 }}>
                  {form.companyBranding.name}
                </div>
              )}
              {!form.companyBranding.name && !form.companyBranding.logoUrl && (
                <BlankField width="160px" height="18px" fieldStyle={fieldStyle} label="Company" accentColor={accent} fontSize={9} />
              )}
              {form.companyBranding.address && (
                <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "2px", whiteSpace: "pre-line", lineHeight: 1.4 }}>{form.companyBranding.address}</div>
              )}
              {tpl.contactIcons && <ContactIconRow branding={form.companyBranding} accent={accent} density={1} />}
              {!tpl.contactIcons && (form.companyBranding.phone || form.companyBranding.email) && (
                <div style={{ fontSize: "9px", color: "#9ca3af", marginTop: "1px" }}>
                  {[form.companyBranding.phone, form.companyBranding.email].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", flex: "0 0 auto" }}>
              <div style={{ fontSize: `${titleSize}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "3px", fontFamily: `'${fonts.heading}', sans-serif`, color: accent }}>
                {config.title}
              </div>
            </div>

            <div style={{ textAlign: "right", flex: "0 0 auto" }}>
              {serial.showSerial && (
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "flex-end", gap: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#374151" }}>No.</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "'Courier New', monospace", color: "#374151", letterSpacing: "1px" }}>{serial.prefix}</span>
                  <span style={{ display: "inline-block", width: "65px", borderBottom: fieldStyle === "dotted" ? "2px dotted #9ca3af" : "2px solid #9ca3af", height: "16px" }}>&nbsp;</span>
                </div>
              )}
              {layout.showDate && (
                <div style={{ marginTop: "6px" }}>
                  <DateGrid accentColor={accent} density={0.92} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* BODY — two-column: fields left, amount right */}
        <div style={{ flex: 1, display: "flex", gap: "18px", padding: tpl.headerBand ? `12px ${pad}px 0` : `8px ${pad}px 0`, minHeight: 0 }}>
          {/* Left column: form fields */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            {layout.showRecipient && (
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>Received from:</span>
                <div style={{ flex: 1, height: `${rowHeight}px`, borderBottom: lineBottom }}>&nbsp;</div>
              </div>
            )}
            {layout.showAmountInWords && (
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>The sum of:</span>
                <div style={{ flex: 1, height: `${rowHeight}px`, borderBottom: lineBottom }}>&nbsp;</div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>Being payment for:</span>
              <div style={{ flex: 1, height: `${rowHeight}px`, borderBottom: lineBottom }}>&nbsp;</div>
            </div>
            {/* Payment checkboxes */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "14px", marginTop: "4px" }}>
              <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>Payment:</span>
              <BlankCheckbox label="Cash" size={13} fontSize={11} />
              <BlankCheckbox label="Cheque" size={13} fontSize={11} />
              <BlankCheckbox label="Transfer" size={13} fontSize={11} />
              <BlankCheckbox label="Mobile" size={13} fontSize={11} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>Cheque/Ref No:</span>
              <div style={{ flex: 1, height: `${rowHeight}px`, borderBottom: lineBottom }}>&nbsp;</div>
            </div>
          </div>

          {/* Right column: amount box */}
          <div style={{ flex: "0 0 auto", width: "155px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: "100%", border: `2.5px solid ${accent}`, borderRadius: "5px", padding: "14px", textAlign: "center", backgroundColor: `${accent}08` }}>
              <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent, marginBottom: "8px" }}>Amount</div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: accent }}>{getCurrencyLabel(layout)}</span>
                <div style={{ flex: 1, height: "24px", borderBottom: `2px solid ${accent}40` }}>&nbsp;</div>
              </div>
            </div>
          </div>
        </div>

        {/* SIGNATURES */}
        {layout.showSignature && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: `0 ${pad}px`, paddingTop: "10px", marginTop: "auto" }}>
            <div>
              <div style={{ width: "150px", borderBottom: `1.5px solid ${accent}50`, height: "24px" }}>&nbsp;</div>
              <div style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginTop: "3px" }}>Cashier / Received By</div>
            </div>
            <div>
              <div style={{ width: "150px", borderBottom: `1.5px solid ${accent}50`, height: "24px" }}>&nbsp;</div>
              <div style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginTop: "3px" }}>Authorized Signature</div>
            </div>
          </div>
        )}

        {layout.showTerms && layout.termsText && (
          <div style={{ fontSize: "9px", color: "#9ca3af", marginTop: "5px", padding: `0 ${pad}px`, lineHeight: 1.35 }}>{layout.termsText}</div>
        )}
        {layout.customFooterText && (
          <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "3px", padding: `0 ${pad}px`, lineHeight: 1.35 }}>{layout.customFooterText}</div>
        )}

        {/* Footer bar */}
        <div style={{ padding: `0 ${tpl.footerStyle === "bar" ? 0 : pad}px` }}>
          <FooterBar tpl={tpl} density={1} branding={form.companyBranding} />
        </div>

        {/* Brand logos */}
        {form.brandLogos.enabled && form.brandLogos.logos.length > 0 && form.brandLogos.position === "bottom" && (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center", paddingTop: "5px", borderTop: "1px solid #e5e7eb", margin: `5px ${pad}px 0` }}>
            {form.brandLogos.logos.map((logo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={logo.url} alt={logo.name} style={{ height: "18px", objectFit: "contain", opacity: 0.7 }} />
            ))}
          </div>
        )}

        {/* Bottom padding */}
        <div style={{ height: `${pad - 6}px`, flexShrink: 0 }} />
      </div>

      {/* RIGHT SIDEBAR — colored strip with vertical text */}
      {tpl.receiptSidebar && (
        <div style={{ width: `${sidebarW}px`, backgroundColor: sidebarColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", color: "#ffffff", fontSize: "18px", fontWeight: 900, letterSpacing: "5px", textTransform: "uppercase" }}>
            {config.title}
          </div>
        </div>
      )}

      {/* Cut line */}
      {form.printConfig.showCutLines && !isLastOnPage && (
        <div style={{ position: "absolute", bottom: 0, left: "16px", right: "16px", display: "flex", alignItems: "center", gap: "6px", zIndex: 5 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
          <div style={{ flex: 1, borderTop: "2px dashed #ccc" }} />
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table-based Form Slip (Invoice, Quotation, Delivery Note, etc.)
// ---------------------------------------------------------------------------

function BlankFormSlip({ form, slipHeight, slipWidth, isLastOnPage }: BlankFormSlipProps) {
  const docType = form.documentType as SalesDocumentType;
  const config = DOCUMENT_TYPE_CONFIGS[docType];
  const fonts = getFonts(form.style.fontPairing);
  const accent = form.style.accentColor;
  const layout = form.formLayout;
  const serial = form.serialConfig;
  const fieldStyle = form.style.fieldStyle;
  const formsPerPage = form.printConfig.formsPerPage;
  const tpl = getTemplateConfig(form.style.template);

  const activeColumns = ITEM_COLUMNS.filter(
    (col) => col.alwaysOn || layout.columns.includes(col.id),
  );

  const density = formsPerPage === 1 ? 1 : formsPerPage === 2 ? 0.88 : 0.75;
  const spacingMultiplier = tpl.compactSpacing ? 0.88 : 1;
  const bindTop = form.printConfig.bindingPosition === "top";
  const padV = Math.round((bindTop ? (SAFE_MARGIN + BINDING_GUTTER) : SAFE_MARGIN) * density * spacingMultiplier);
  const padL = Math.round((bindTop ? SAFE_MARGIN : (SAFE_MARGIN + BINDING_GUTTER)) * density * spacingMultiplier);
  const padR = Math.round(SAFE_MARGIN * density * spacingMultiplier);
  const fontSize = clampFont(Math.round(13 * density));
  const headingSize = clampFont(Math.round(24 * density), 16);
  const rowHeight = Math.round(28 * density * spacingMultiplier);
  const labelSize = clampFont(Math.round(11 * density), MIN_LABEL_PX);
  const tableRowH = Math.round(28 * density * spacingMultiplier);
  const borderPx = getBorderPx(tpl.tableBorderWeight);

  const getColumnWidth = (colId: string): string => {
    if (colId === "index") return "38px";
    if (colId === "description") return "1fr";
    if (colId === "quantity" || colId === "unit") return "66px";
    return "82px";
  };

  return (
    <div
      style={{
        width: `${slipWidth}px`,
        height: `${slipHeight}px`,
        boxSizing: "border-box",
        padding: `${padV}px ${padR}px ${padV}px ${padL}px`,
        position: "relative",
        fontFamily: `'${fonts.body}', sans-serif`,
        fontSize: `${fontSize}px`,
        lineHeight: 1.4,
        color: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderBottom: form.printConfig.showCutLines && !isLastOnPage ? "2px dashed #ccc" : "none",
      }}
    >
      {/* Form Border */}
      {form.style.borderStyle !== "none" && (
        <div
          style={{
            position: "absolute",
            inset: `${Math.round(6 * density)}px`,
            border: form.style.borderStyle === "double" ? `3px double ${accent}` : `1.5px solid ${accent}50`,
            pointerEvents: "none",
            borderRadius: "2px",
          }}
        />
      )}

      {/* Decorative overlays */}
      <WatermarkOverlay tpl={tpl} density={density} title={config.title} />
      <DecorativeOverlay tpl={tpl} density={density} />
      <PageBorderOverlay tpl={tpl} density={density} />
      <AccentStripOverlay tpl={tpl} density={density} />
      <BackgroundTint tpl={tpl} />

      {/* HEADER — Content-aware band (stretches to fit content) */}
      {tpl.headerBand ? (
        <div
          style={{
            background: tpl.headerGradient ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : accent,
            marginLeft: form.style.borderStyle !== "none" ? `${Math.round(6 * density) - padL}px` : `-${padL}px`,
            marginRight: form.style.borderStyle !== "none" ? `${Math.round(6 * density) - padR}px` : `-${padR}px`,
            marginTop: form.style.borderStyle !== "none" ? `${Math.round(6 * density) - padV}px` : `-${padV}px`,
            padding: `${Math.round(14 * density)}px ${padR}px ${Math.round(12 * density)}px ${padL}px`,
            marginBottom: `${Math.round(14 * density)}px`,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{
            display: tpl.headerStyle === "centered" ? "flex" : "flex",
            flexDirection: tpl.headerStyle === "centered" ? "column" : "row",
            justifyContent: tpl.headerStyle === "centered" ? "center" : "space-between",
            alignItems: tpl.headerStyle === "centered" ? "center" : "flex-start",
          }}>
            {/* Left: Company branding */}
            <div style={{ flex: tpl.headerStyle === "centered" ? undefined : 1, textAlign: tpl.headerStyle === "centered" ? "center" : "left", minWidth: 0 }}>
              {form.companyBranding.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.companyBranding.logoUrl}
                  alt=""
                  style={{
                    height: `${Math.round(40 * density)}px`,
                    marginBottom: "5px",
                    objectFit: "contain",
                    display: tpl.headerStyle === "centered" ? "block" : "inline-block",
                    ...(tpl.headerStyle === "centered" ? { margin: "0 auto 5px" } : {}),
                  }}
                />
              )}
              {form.companyBranding.name && (
                <div style={{ fontSize: `${headingSize}px`, fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, color: "#ffffff", lineHeight: 1.2 }}>
                  {form.companyBranding.name}
                </div>
              )}
              {!form.companyBranding.name && !form.companyBranding.logoUrl && (
                <BlankField width="200px" height={`${Math.round(22 * density)}px`} fieldStyle={fieldStyle} label="Company Name" accentColor="rgba(255,255,255,0.7)" />
              )}
              {form.companyBranding.tagline && (
                <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "rgba(255,255,255,0.8)", marginTop: "2px", fontStyle: "italic" }}>{form.companyBranding.tagline}</div>
              )}
              {form.companyBranding.address && (
                <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "rgba(255,255,255,0.75)", marginTop: "3px", whiteSpace: "pre-line", lineHeight: 1.4 }}>{form.companyBranding.address}</div>
              )}
              {(form.companyBranding.phone || form.companyBranding.email) && !tpl.contactIcons && (
                <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "rgba(255,255,255,0.7)", marginTop: "2px" }}>{[form.companyBranding.phone, form.companyBranding.email].filter(Boolean).join(" · ")}</div>
              )}
              {form.companyBranding.website && !tpl.contactIcons && (
                <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "rgba(255,255,255,0.6)", marginTop: "1px" }}>{form.companyBranding.website}</div>
              )}
              {tpl.contactIcons && <ContactIconRow branding={form.companyBranding} accent="rgba(255,255,255,0.5)" density={density} />}
              {form.companyBranding.taxId && (
                <div style={{ fontSize: `${clampFont(Math.round(9 * density))}px`, color: "rgba(255,255,255,0.6)", marginTop: "1px" }}>TPIN: {form.companyBranding.taxId}</div>
              )}
            </div>

            {/* Right: Document title + serial */}
            <div style={{ textAlign: tpl.headerStyle === "centered" ? "center" : "right", flexShrink: 0, marginLeft: tpl.headerStyle === "centered" ? 0 : "12px", ...(tpl.headerStyle === "centered" ? { marginTop: `${Math.round(6 * density)}px` } : {}) }}>
              <div style={{ fontSize: `${clampFont(Math.round(28 * density), 18)}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "3px", fontFamily: `'${fonts.heading}', sans-serif`, color: "#ffffff" }}>
                {config.title}
              </div>
              {serial.showSerial && (
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: tpl.headerStyle === "centered" ? "center" : "flex-end", gap: "3px", marginTop: "6px" }}>
                  <span style={{ fontSize: `${clampFont(Math.round(12 * density))}px`, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{config.numberLabel}</span>
                  <span style={{ fontSize: `${clampFont(Math.round(12 * density))}px`, fontWeight: 700, fontFamily: "'Courier New', monospace", color: "rgba(255,255,255,0.85)", letterSpacing: "1px" }}>{serial.prefix}</span>
                  <span style={{ display: "inline-block", width: `${Math.round(75 * density)}px`, borderBottom: "2px solid rgba(255,255,255,0.5)", height: `${Math.round(18 * density)}px` }}>&nbsp;</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
        {/* Non-band HEADER */}
        <div
          style={{
            display: tpl.headerStyle === "centered" ? "flex" : "flex",
            flexDirection: tpl.headerStyle === "centered" ? "column" : "row",
            justifyContent: tpl.headerStyle === "centered" ? "center" : "space-between",
            alignItems: tpl.headerStyle === "centered" ? "center" : "flex-start",
            marginBottom: `${Math.round(14 * density)}px`,
            paddingBottom: `${Math.round(10 * density)}px`,
            ...getHeaderDividerStyle(tpl, density),
            position: "relative",
            zIndex: 1,
            ...(tpl.headerStyle === "boxed" ? {
              border: `1.5px solid ${accent}60`,
              padding: `${Math.round(12 * density)}px`,
              borderRadius: "3px",
              marginBottom: `${Math.round(16 * density)}px`,
            } : {}),
          }}
        >
          {/* Left: Company branding */}
          <div style={{ flex: tpl.headerStyle === "centered" ? undefined : 1, textAlign: tpl.headerStyle === "centered" ? "center" : "left", minWidth: 0 }}>
            {form.companyBranding.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.companyBranding.logoUrl}
                alt=""
                style={{
                  height: `${Math.round(40 * density)}px`,
                  marginBottom: "5px",
                  objectFit: "contain",
                  display: tpl.headerStyle === "centered" ? "block" : "inline-block",
                  ...(tpl.headerStyle === "centered" ? { margin: "0 auto 5px" } : {}),
                }}
              />
            )}
            {form.companyBranding.name && (
              <div style={{ fontSize: `${headingSize}px`, fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, color: accent, lineHeight: 1.2 }}>
                {form.companyBranding.name}
              </div>
            )}
            {!form.companyBranding.name && !form.companyBranding.logoUrl && (
              <BlankField width="200px" height={`${Math.round(22 * density)}px`} fieldStyle={fieldStyle} label="Company Name" accentColor={accent} />
            )}
            {form.companyBranding.tagline && (
              <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#6b7280", marginTop: "2px", fontStyle: "italic" }}>{form.companyBranding.tagline}</div>
            )}
            {form.companyBranding.address && (
              <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#6b7280", marginTop: "3px", whiteSpace: "pre-line", lineHeight: 1.4 }}>{form.companyBranding.address}</div>
            )}
            {(form.companyBranding.phone || form.companyBranding.email) && !tpl.contactIcons && (
              <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#6b7280", marginTop: "2px" }}>{[form.companyBranding.phone, form.companyBranding.email].filter(Boolean).join(" · ")}</div>
            )}
            {form.companyBranding.website && !tpl.contactIcons && (
              <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#9ca3af", marginTop: "1px" }}>{form.companyBranding.website}</div>
            )}
            {tpl.contactIcons && <ContactIconRow branding={form.companyBranding} accent={accent} density={density} />}
            {form.companyBranding.taxId && (
              <div style={{ fontSize: `${clampFont(Math.round(9 * density))}px`, color: "#9ca3af", marginTop: "1px" }}>TPIN: {form.companyBranding.taxId}</div>
            )}
          </div>

        {/* Right: Document title + serial */}
          <div style={{ textAlign: tpl.headerStyle === "centered" ? "center" : "right", flexShrink: 0, marginLeft: tpl.headerStyle === "centered" ? 0 : "12px", ...(tpl.headerStyle === "centered" ? { marginTop: `${Math.round(6 * density)}px` } : {}) }}>
            <div style={{ fontSize: `${clampFont(Math.round(28 * density), 18)}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "3px", fontFamily: `'${fonts.heading}', sans-serif`, color: accent }}>
              {config.title}
            </div>
            {serial.showSerial && (
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: tpl.headerStyle === "centered" ? "center" : "flex-end", gap: "3px", marginTop: "6px" }}>
                <span style={{ fontSize: `${clampFont(Math.round(12 * density))}px`, fontWeight: 700, color: "#374151" }}>{config.numberLabel}</span>
                <span style={{ fontSize: `${clampFont(Math.round(12 * density))}px`, fontWeight: 700, fontFamily: "'Courier New', monospace", color: "#374151", letterSpacing: "1px" }}>{serial.prefix}</span>
                <span style={{ display: "inline-block", width: `${Math.round(75 * density)}px`, borderBottom: fieldStyle === "dotted" ? "2px dotted #9ca3af" : "2px solid #9ca3af", height: `${Math.round(20 * density)}px` }}>&nbsp;</span>
              </div>
            )}
          </div>
        </div>
        </>
      )}

      {/* FIELD ROWS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`,
          marginBottom: `${Math.round(10 * density)}px`,
        }}
      >
        {layout.showDate && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Date</span>
            <div style={{ marginTop: "3px" }}>
              {formsPerPage <= 2 ? <DateGrid accentColor={accent} density={density} /> : <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} />}
            </div>
          </div>
        )}
        {layout.showDueDate && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Due Date</span>
            <div style={{ marginTop: "3px" }}>
              {formsPerPage <= 2 ? <DateGrid accentColor={accent} density={density} /> : <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} />}
            </div>
          </div>
        )}
        {layout.showRecipient && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{config.recipientLabel}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
        {layout.showSender && !form.companyBranding.name && !form.companyBranding.logoUrl && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{config.senderLabel}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
        {layout.showPoNumber && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>P.O. Number</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
        {layout.showCustomField1 && layout.customField1Label && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.customField1Label}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
        {layout.showCustomField2 && layout.customField2Label && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.customField2Label}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
      </div>

      {/* TYPE-SPECIFIC FIELDS */}
      {docType === "quotation" && layout.showValidFor !== false && (
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: `${Math.round(8 * density)}px` }}>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, whiteSpace: "nowrap" }}>Valid For</span>
          <div style={{ width: "65px", height: `${rowHeight}px`, borderBottom: fieldStyle === "dotted" ? "1.5px dotted #9ca3af" : "1.5px solid #9ca3af" }}>&nbsp;</div>
          <span style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#6b7280" }}>Days from date of issue</span>
        </div>
      )}
      {docType === "proforma-invoice" && layout.showValidUntil !== false && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(8 * density)}px` }}>
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Valid Until</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        </div>
      )}
      {docType === "credit-note" && (layout.showOriginalInvoice !== false || layout.showReasonForCredit !== false) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(8 * density)}px` }}>
          {layout.showOriginalInvoice !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Original Invoice #</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
          {layout.showOriginalInvoice !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Original Invoice Date</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
          {layout.showReasonForCredit !== false && (
            <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Reason for Credit</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
        </div>
      )}
      {docType === "purchase-order" && (layout.showShipTo !== false || layout.showDeliveryBy !== false) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(8 * density)}px` }}>
          {layout.showShipTo !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Ship To</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${Math.round(rowHeight * 1.5)}px`} fieldStyle={fieldStyle === "underline" ? "box" : fieldStyle} /></div></div>
          )}
          {layout.showDeliveryBy !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Delivery Required By</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
        </div>
      )}
      {docType === "delivery-note" && (layout.showVehicleNo !== false || layout.showDriverName !== false) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(8 * density)}px` }}>
          {layout.showVehicleNo !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Vehicle No.</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
          {layout.showDriverName !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Driver Name</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
        </div>
      )}

      {/* ITEM TABLE */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: `${Math.round(10 * density)}px`, minHeight: 0 }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: activeColumns.map((col) => getColumnWidth(col.id)).join(" "),
            gap: "0",
            backgroundColor: tpl.tableHeaderFill ? accent : "transparent",
            color: tpl.tableHeaderFill ? "#ffffff" : accent,
            border: `${borderPx}px solid ${accent}`,
            borderBottom: `${borderPx}px solid ${accent}`,
            fontSize: `${labelSize}px`,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: `${Math.round(8 * density)}px 0`,
            borderRadius: tpl.tableHeaderFill ? "3px 3px 0 0" : "0",
          }}
        >
          {activeColumns.map((col) => (
            <div
              key={col.id}
              style={{
                padding: `0 ${Math.round(5 * density)}px`,
                textAlign: col.id === "index" || col.id === "description" ? "left" : "right",
                borderRight: tpl.fieldSeparators && col.id !== activeColumns[activeColumns.length - 1].id
                  ? `1px solid ${tpl.tableHeaderFill ? "rgba(255,255,255,0.3)" : `${accent}30`}` : "none",
              }}
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: layout.itemRowCount }, (_, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              display: "grid",
              gridTemplateColumns: activeColumns.map((col) => getColumnWidth(col.id)).join(" "),
              gap: "0",
              borderBottom: tpl.tableStyle === "bordered" ? `${borderPx}px solid #d1d5db` : tpl.tableStyle === "minimal" ? "1px solid #f0f1f3" : "1px solid #e5e7eb",
              borderLeft: tpl.tableStyle === "bordered" ? `${borderPx}px solid #d1d5db` : "none",
              borderRight: tpl.tableStyle === "bordered" ? `${borderPx}px solid #d1d5db` : "none",
              backgroundColor: tpl.tableStyle === "striped" && rowIdx % 2 === 1 ? (tpl.accentSecondary ? `${tpl.accentSecondary}20` : "#f8f9fb") : "transparent",
              height: `${tableRowH}px`,
              alignItems: "end",
            }}
          >
            {activeColumns.map((col) => (
              <div
                key={col.id}
                style={{
                  padding: `0 ${Math.round(5 * density)}px`,
                  textAlign: col.id === "index" || col.id === "description" ? "left" : "right",
                  fontSize: `${clampFont(Math.round(10 * density))}px`,
                  color: "#b0b5bd",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: col.id === "index" || col.id === "description" ? "flex-start" : "flex-end",
                  borderRight: (tpl.tableStyle === "bordered" || tpl.fieldSeparators) && col.id !== activeColumns[activeColumns.length - 1].id ? `${borderPx}px solid #e5e7eb` : "none",
                }}
              >
                {col.id === "index" ? `${rowIdx + 1}` : ""}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* TOTALS */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: `${Math.round(10 * density)}px` }}>
        <div style={{ width: formsPerPage >= 3 ? "55%" : "44%", minWidth: "210px" }}>
          {layout.showSubtotal && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${Math.round(5 * density)}px ${tpl.totalsStyle === "boxed" ? `${Math.round(8 * density)}px` : "0"}`, borderBottom: "1px solid #e5e7eb", fontSize: `${clampFont(Math.round(12 * density))}px`, ...(tpl.totalsStyle === "boxed" ? { border: "1px solid #e5e7eb" } : {}) }}>
              <span style={{ fontWeight: 600, color: "#4b5563" }}>Subtotal</span>
              <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: "95px", borderBottom: fieldStyle === "dotted" ? "1px dotted #9ca3af" : "1px solid #d1d5db" }}>
                {getCurrencyLabel(layout) && <span style={{ color: "#b0b5bd", marginRight: "3px", fontSize: `${clampFont(Math.round(11 * density))}px`, flexShrink: 0 }}>{getCurrencyLabel(layout)}</span>}
                <span style={{ flex: 1 }}>&nbsp;</span>
              </span>
            </div>
          )}
          {layout.showDiscount && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${Math.round(5 * density)}px ${tpl.totalsStyle === "boxed" ? `${Math.round(8 * density)}px` : "0"}`, borderBottom: "1px solid #e5e7eb", fontSize: `${clampFont(Math.round(12 * density))}px`, ...(tpl.totalsStyle === "boxed" ? { borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb" } : {}) }}>
              <span style={{ fontWeight: 600, color: "#4b5563" }}>Discount</span>
              <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: "95px", borderBottom: fieldStyle === "dotted" ? "1px dotted #9ca3af" : "1px solid #d1d5db" }}>
                {getCurrencyLabel(layout) && <span style={{ color: "#b0b5bd", marginRight: "3px", fontSize: `${clampFont(Math.round(11 * density))}px`, flexShrink: 0 }}>{getCurrencyLabel(layout)}</span>}
                <span style={{ flex: 1 }}>&nbsp;</span>
              </span>
            </div>
          )}
          {layout.showTax && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${Math.round(5 * density)}px ${tpl.totalsStyle === "boxed" ? `${Math.round(8 * density)}px` : "0"}`, borderBottom: "1px solid #e5e7eb", fontSize: `${clampFont(Math.round(12 * density))}px`, ...(tpl.totalsStyle === "boxed" ? { borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb" } : {}) }}>
              <span style={{ fontWeight: 600, color: "#4b5563" }}>Tax / VAT</span>
              <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: "95px", borderBottom: fieldStyle === "dotted" ? "1px dotted #9ca3af" : "1px solid #d1d5db" }}>
                {getCurrencyLabel(layout) && <span style={{ color: "#b0b5bd", marginRight: "3px", fontSize: `${clampFont(Math.round(11 * density))}px`, flexShrink: 0 }}>{getCurrencyLabel(layout)}</span>}
                <span style={{ flex: 1 }}>&nbsp;</span>
              </span>
            </div>
          )}
          {layout.showTotal && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: `${Math.round(7 * density)}px ${Math.round(8 * density)}px`,
              fontSize: `${clampFont(Math.round(15 * density), 13)}px`, fontWeight: 800,
              marginTop: `${Math.round(4 * density)}px`, borderRadius: "3px",
              ...(tpl.totalsStyle === "badge" ? {
                backgroundColor: accent, color: "#ffffff",
              } : {
                backgroundColor: `${accent}10`,
                borderTop: `3px solid ${accent}`, borderBottom: tpl.totalsBorder ? `3px solid ${accent}` : "none",
                color: accent,
              }),
            }}>
              <span style={{ color: tpl.totalsStyle === "badge" ? "#ffffff" : accent, letterSpacing: "0.5px" }}>{config.amountLabel}</span>
              <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: "95px", borderBottom: tpl.totalsStyle === "badge" ? "2px solid rgba(255,255,255,0.4)" : (fieldStyle === "dotted" ? "2px dotted #9ca3af" : "2px solid #d1d5db") }}>
                {getCurrencyLabel(layout) && <span style={{ color: tpl.totalsStyle === "badge" ? "rgba(255,255,255,0.7)" : `${accent}80`, marginRight: "3px", flexShrink: 0 }}>{getCurrencyLabel(layout)}</span>}
                <span style={{ flex: 1 }}>&nbsp;</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* AMOUNT IN WORDS */}
      {layout.showAmountInWords && docType !== "delivery-note" && (
        <div style={{ marginBottom: `${Math.round(10 * density)}px` }}>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Amount in Words</span>
          <div style={{ marginTop: "4px" }}><BlankField width="100%" height={`${Math.round(30 * density)}px`} fieldStyle={fieldStyle} /></div>
        </div>
      )}

      {/* PAYMENT INFO — pre-printed when banking details are provided */}
      {layout.showPaymentInfo && (
        <div style={{ marginBottom: `${Math.round(10 * density)}px` }}>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Payment Details</span>
          {(form.companyBranding.bankName || form.companyBranding.bankAccount) ? (
            <div style={{ marginTop: "4px", fontSize: `${clampFont(Math.round(11 * density))}px`, color: "#374151", lineHeight: 1.6, padding: `${Math.round(6 * density)}px`, border: `1px solid ${accent}20`, borderRadius: "3px", backgroundColor: `${accent}05` }}>
              {form.companyBranding.bankName && (
                <div><span style={{ fontWeight: 600, color: accent }}>Bank:</span> {form.companyBranding.bankName}</div>
              )}
              {form.companyBranding.bankAccountName && (
                <div><span style={{ fontWeight: 600, color: accent }}>Account Name:</span> {form.companyBranding.bankAccountName}</div>
              )}
              {form.companyBranding.bankAccount && (
                <div><span style={{ fontWeight: 600, color: accent }}>Account No:</span> {form.companyBranding.bankAccount}</div>
              )}
              {form.companyBranding.bankBranch && (
                <div><span style={{ fontWeight: 600, color: accent }}>Branch:</span> {form.companyBranding.bankBranch}</div>
              )}
              {form.companyBranding.bankBranchCode && (
                <div><span style={{ fontWeight: 600, color: accent }}>Branch Code:</span> {form.companyBranding.bankBranchCode}</div>
              )}
              {form.companyBranding.bankSwiftBic && (
                <div><span style={{ fontWeight: 600, color: accent }}>SWIFT/BIC:</span> {form.companyBranding.bankSwiftBic}</div>
              )}
              {form.companyBranding.bankIban && (
                <div><span style={{ fontWeight: 600, color: accent }}>IBAN:</span> {form.companyBranding.bankIban}</div>
              )}
              {form.companyBranding.bankSortCode && (
                <div><span style={{ fontWeight: 600, color: accent }}>Sort/Routing Code:</span> {form.companyBranding.bankSortCode}</div>
              )}
              {form.companyBranding.bankReference && (
                <div><span style={{ fontWeight: 600, color: accent }}>Reference:</span> {form.companyBranding.bankReference}</div>
              )}
              {form.companyBranding.bankCustomLabel && form.companyBranding.bankCustomValue && (
                <div><span style={{ fontWeight: 600, color: accent }}>{form.companyBranding.bankCustomLabel}:</span> {form.companyBranding.bankCustomValue}</div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px`, marginTop: "4px" }}>
              <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} label="Bank" accentColor="#9ca3af" fontSize={Math.round(10 * density)} />
              <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} label="Account #" accentColor="#9ca3af" fontSize={Math.round(10 * density)} />
            </div>
          )}
        </div>
      )}

      {/* NOTES / TERMS */}
      {layout.showNotes && (
        <div style={{ marginBottom: `${Math.round(8 * density)}px` }}>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.notesLabel}</span>
          <div style={{ marginTop: "4px" }}><BlankField width="100%" height={`${Math.round(28 * density)}px`} fieldStyle={fieldStyle} /></div>
        </div>
      )}
      {layout.showTerms && layout.termsText && (
        <div style={{ fontSize: `${clampFont(Math.round(9 * density))}px`, color: "#9ca3af", marginBottom: `${Math.round(6 * density)}px`, lineHeight: 1.4 }}>{layout.termsText}</div>
      )}
      {layout.customFooterText && (
        <div style={{ fontSize: `${clampFont(Math.round(9 * density))}px`, color: "#6b7280", marginBottom: `${Math.round(6 * density)}px`, lineHeight: 1.4 }}>{layout.customFooterText}</div>
      )}

      {/* SIGNATURE */}
      {layout.showSignature && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: `${Math.round(14 * density)}px` }}>
          {docType === "delivery-note" ? (
            <>
              <div>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>Delivered By</div>
                <div style={{ width: `${Math.round(155 * density)}px`, borderBottom: `2px solid ${accent}50`, height: `${Math.round(28 * density)}px` }}>&nbsp;</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>Goods Condition</div>
                <div style={{ display: "flex", gap: `${Math.round(12 * density)}px`, justifyContent: "center" }}>
                  <BlankCheckbox label="Good" size={Math.round(14 * density)} fontSize={Math.round(11 * density)} />
                  <BlankCheckbox label="Damaged" size={Math.round(14 * density)} fontSize={Math.round(11 * density)} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>Received By</div>
                <div style={{ width: `${Math.round(155 * density)}px`, borderBottom: `2px solid ${accent}50`, height: `${Math.round(28 * density)}px` }}>&nbsp;</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>{docType === "purchase-order" ? "Authorized By" : "Prepared By"}</div>
                <div style={{ width: `${Math.round(155 * density)}px`, borderBottom: `2px solid ${accent}50`, height: `${Math.round(28 * density)}px` }}>&nbsp;</div>
              </div>
              <div>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>{docType === "purchase-order" ? "Approved By" : "Customer Signature"}</div>
                <div style={{ width: `${Math.round(155 * density)}px`, borderBottom: `2px solid ${accent}50`, height: `${Math.round(28 * density)}px` }}>&nbsp;</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* FOOTER BAR */}
      <FooterBar tpl={tpl} density={density} branding={form.companyBranding} />

      {/* BRAND LOGOS */}
      {form.brandLogos.enabled && form.brandLogos.logos.length > 0 && form.brandLogos.position === "bottom" && (
        <div style={{ display: "flex", gap: `${Math.round(10 * density)}px`, justifyContent: "center", alignItems: "center", paddingTop: `${Math.round(8 * density)}px`, borderTop: "1px solid #e5e7eb", marginTop: `${Math.round(6 * density)}px` }}>
          {form.brandLogos.logos.map((logo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={logo.url} alt={logo.name} style={{ height: `${Math.round(20 * density)}px`, objectFit: "contain", opacity: 0.7 }} />
          ))}
        </div>
      )}

      {/* CUT LINE */}
      {form.printConfig.showCutLines && !isLastOnPage && (
        <div style={{ position: "absolute", bottom: 0, left: "16px", right: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
          <div style={{ flex: 1, borderTop: "2px dashed #ccc" }} />
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" /></svg>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Page — contains N forms
// ---------------------------------------------------------------------------

interface BlankFormPageProps {
  form: SalesBookFormData;
  pageIndex: number;
  totalPages: number;
  startSerialIndex: number;
}

function BlankFormPage({ form, pageIndex, totalPages, startSerialIndex }: BlankFormPageProps) {
  const pageDim = PAGE_PX[form.printConfig.pageSize as PageFormat] ?? PAGE_PX.a4;
  const formsOnPage = form.printConfig.formsPerPage;
  const slipHeight = Math.floor(pageDim.h / formsOnPage);
  const isReceipt = DOCUMENT_TYPE_CONFIGS[form.documentType as SalesDocumentType]?.receiptLayout;
  const SlipComponent = isReceipt ? BlankReceiptSlip : BlankFormSlip;

  return (
    <div className="relative mb-8">
      <div
        data-sales-book-page
        style={{
          width: `${pageDim.w}px`,
          height: `${pageDim.h}px`,
          backgroundColor: "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
        className="shadow-lg"
      >
        {Array.from({ length: formsOnPage }, (_, slipIdx) => (
          <SlipComponent
            key={slipIdx}
            form={form}
            serialIndex={startSerialIndex + slipIdx}
            slipHeight={slipHeight}
            slipWidth={pageDim.w}
            isLastOnPage={slipIdx === formsOnPage - 1}
          />
        ))}
      </div>
      {form.printConfig.showPageNumbers && totalPages > 1 && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500">
          Page {pageIndex + 1} of {totalPages}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

interface BlankFormRendererProps {
  form: SalesBookFormData;
  previewPageCount?: number;
  className?: string;
  id?: string;
}

export default function BlankFormRenderer({
  form,
  previewPageCount = 1,
  className,
  id,
}: BlankFormRendererProps) {
  const fontUrl = useMemo(() => getGoogleFontUrl(form.style.fontPairing), [form.style.fontPairing]);
  const formsPerPage = form.printConfig.formsPerPage;

  return (
    <div id={id} className={className}>
      <link rel="stylesheet" href={fontUrl} />
      {Array.from({ length: previewPageCount }, (_, pageIdx) => (
        <BlankFormPage
          key={pageIdx}
          form={form}
          pageIndex={pageIdx}
          totalPages={previewPageCount}
          startSerialIndex={pageIdx * formsPerPage}
        />
      ))}
    </div>
  );
}
