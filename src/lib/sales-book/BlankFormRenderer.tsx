// =============================================================================
// DMSuite â€” Blank Form Renderer (v4 â€” 20-Template Visual Overhaul)
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
// - Min font: 7pt body (â‰ˆ9.3px @96dpi), 6pt fine print (â‰ˆ8px)
// - Binding gutter: 12mm (46px) for stapled booklets
// - Safe margin: 8mm (30px) from trim edge all sides
// - Proper density scaling for multi-form-per-page layouts
// - A4 (210Ã—297mm), A5 (148Ã—210mm), Letter (8.5Ã—11in), Legal (8.5Ã—14in)
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
import type { SalesBookTemplate, FieldStyle } from "@/lib/sales-book/schema";
import { CustomBlocksRegion } from "@/lib/sales-book/CustomBlockRenderer";

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

/** Safe margin from page edge in px (â‰ˆ8mm at 96 DPI) */
const SAFE_MARGIN = 30;

/** Binding gutter for booklet stapling in px (â‰ˆ12mm at 96 DPI) */
const BINDING_GUTTER = 46;

/** Min font size to guarantee print legibility (â8pt) */
const MIN_FONT_PX = 11;

/** Min label / caption font (≈7pt) */
const MIN_LABEL_PX = 9;

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

/** Perceived luminance in [0,1] — returns > 0.5 for light colours */
function luminance(hex: string): number {
  const c = hex.replace("#", "").slice(0, 6);
  if (c.length < 6) return 0;
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const srgb = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** Return white or dark text colour depending on background lightness */
function contrastText(bgHex: string): string {
  // Strip alpha suffixes and rgba() — extract first 7 chars (#RRGGBB)
  const clean = bgHex.startsWith("rgba") ? "#888888" : bgHex.slice(0, 7);
  return luminance(clean) > 0.35 ? "#1a1a1a" : "#ffffff";
}

/** Map table border weight to pixel value */
function getBorderPx(weight: "light" | "medium" | "heavy"): number {
  return weight === "heavy" ? 3 : weight === "medium" ? 1.5 : 1;
}

// ---------------------------------------------------------------------------
// Decorative Overlays â€” Watermarks, corners, page borders, footer bars
// ---------------------------------------------------------------------------

function WatermarkOverlay({ tpl, density, title, watermarkImage, watermarkOpacity }: { tpl: SalesBookTemplate; density: number; title: string; watermarkImage?: string; watermarkOpacity?: number }) {
  const hasImage = !!watermarkImage;
  const hasTemplate = tpl.watermark !== "none";
  if (!hasImage && !hasTemplate) return null;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* User-uploaded watermark image (logo etc.) */}
      {hasImage && (
        <img
          src={watermarkImage}
          alt=""
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: `${Math.round(220 * density)}px`,
            maxHeight: `${Math.round(220 * density)}px`,
            objectFit: "contain",
            opacity: watermarkOpacity ?? 0.06,
          }}
        />
      )}
      {/* Template watermarks â€” suppressed when user uploads their own image */}
      {hasTemplate && !hasImage && tpl.watermark === "text" && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-30deg)", fontSize: `${Math.round(60 * density)}px`, fontWeight: 900, color: tpl.accent, opacity: 0.04, whiteSpace: "nowrap", letterSpacing: "8px", textTransform: "uppercase" }}>
          {title}
        </div>
      )}
      {hasTemplate && !hasImage && tpl.watermark === "logo" && (
        <>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: `${Math.round(200 * density)}px`, height: `${Math.round(200 * density)}px`, borderRadius: "50%", border: `${Math.round(6 * density)}px solid ${tpl.accent}`, opacity: 0.05 }} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: `${Math.round(160 * density)}px`, height: `${Math.round(160 * density)}px`, borderRadius: "50%", border: `${Math.round(3 * density)}px solid ${tpl.accent}`, opacity: 0.04 }} />
        </>
      )}
      {hasTemplate && !hasImage && tpl.watermark === "faded-title" && (
        <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%)", fontSize: `${Math.round(90 * density)}px`, fontWeight: 900, color: tpl.accent, opacity: 0.03, whiteSpace: "nowrap", letterSpacing: "4px", textTransform: "uppercase" }}>
          {title}
        </div>
      )}
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

/** Colored strip along an edge â€” visible structural accent */
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

/** Background tint â€” subtle accent wash */
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

/** Header divider â€” the separator below the header section (non-band headers only) */
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

function FooterBar({ tpl, density, branding, bleedL, bleedR, bleedB }: { tpl: SalesBookTemplate; density: number; branding: SalesBookFormData["companyBranding"]; bleedL?: number; bleedR?: number; bleedB?: number }) {
  if (tpl.footerStyle === "none") return null;
  const fontSize = clampFont(Math.round(8 * density), MIN_LABEL_PX);
  const contactParts = [branding.phone, branding.email, branding.website].filter(Boolean);

  if (tpl.footerStyle === "bar") {
    return (
      <div style={{ backgroundColor: tpl.accent, color: contrastText(tpl.accent), padding: `${Math.round(6 * density)}px ${(bleedR ?? 0) + Math.round(12 * density)}px ${Math.round(6 * density)}px ${(bleedL ?? 0) + Math.round(12 * density)}px`, fontSize: `${fontSize}px`, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", marginLeft: bleedL ? `-${bleedL}px` : undefined, marginRight: bleedR ? `-${bleedR}px` : undefined, marginBottom: bleedB ? `-${bleedB}px` : undefined }}>
        <span style={{ fontWeight: 600 }}>{branding.name || "\u00A0"}</span>
        {contactParts.length > 0 && <span style={{ opacity: 0.8 }}>{contactParts.join(" \u00B7 ")}</span>}
      </div>
    );
  }

  if (tpl.footerStyle === "contact-bar") {
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: `${Math.round(16 * density)}px`, padding: `${Math.round(6 * density)}px 0`, borderTop: `1.5px solid ${tpl.accent}30`, marginTop: "auto", fontSize: `${fontSize}px`, color: "#6b7280" }}>
        {branding.phone && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: `${Math.round(14 * density)}px`, height: `${Math.round(14 * density)}px`, borderRadius: "50%", backgroundColor: tpl.accent, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><PhoneIcon size={Math.round(8 * density)} color="#fff" /></span>
            {branding.phone}
          </span>
        )}
        {branding.email && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: `${Math.round(14 * density)}px`, height: `${Math.round(14 * density)}px`, borderRadius: "50%", backgroundColor: tpl.accent, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><EmailIcon size={Math.round(8 * density)} color="#fff" /></span>
            {branding.email}
          </span>
        )}
        {branding.website && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: `${Math.round(14 * density)}px`, height: `${Math.round(14 * density)}px`, borderRadius: "50%", backgroundColor: tpl.accent, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><GlobeIcon size={Math.round(8 * density)} color="#fff" /></span>
            {branding.website}
          </span>
        )}
      </div>
    );
  }

  // line footer
  return (
    <div style={{ borderTop: `1px solid ${tpl.accent}30`, paddingTop: `${Math.round(4 * density)}px`, marginTop: "auto", fontSize: `${fontSize}px`, color: "#9ca3af", textAlign: "center" }}>
      {contactParts.length > 0 ? contactParts.join(" \u00b7 ") : " "}
    </div>
  );
}

/** Inline SVG contact icons — render cleanly at any size, no font dependency */
function PhoneIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function EmailIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}
function GlobeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function ContactIconRow({ branding, accent, density }: { branding: SalesBookFormData["companyBranding"]; accent: string; density: number }) {
  const iconSize = Math.round(14 * density);
  const svgSize = Math.round(8 * density);
  const fontSize = clampFont(Math.round(9 * density), MIN_LABEL_PX);
  const items: { icon: React.ReactNode; value: string }[] = [];
  if (branding.phone) items.push({ icon: <PhoneIcon size={svgSize} color="#fff" />, value: branding.phone });
  if (branding.email) items.push({ icon: <EmailIcon size={svgSize} color="#fff" />, value: branding.email });
  if (branding.website) items.push({ icon: <GlobeIcon size={svgSize} color="#fff" />, value: branding.website });
  if (items.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "3px" }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: `${fontSize}px`, color: "#6b7280" }}>
          <span style={{ width: `${iconSize}px`, height: `${iconSize}px`, borderRadius: "50%", backgroundColor: accent, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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

/** Date grid â€” DAY / MONTH / YEAR boxes (common on African/Asian print forms) */
function DateGrid({ accentColor, density = 1 }: { accentColor: string; density?: number }) {
  const cellW = Math.round(48 * density);
  const cellH = Math.round(22 * density);
  const labelFS = clampFont(Math.round(7 * density), MIN_LABEL_PX);
  const textCol = contrastText(accentColor);
  return (
    <div style={{ display: "inline-flex", gap: "1px", border: `1.5px solid ${accentColor}`, borderRadius: "3px", overflow: "hidden" }}>
      {["DAY", "MONTH", "YEAR"].map((lbl) => (
        <div key={lbl} style={{ width: `${cellW}px`, textAlign: "center" }}>
          <div style={{ fontSize: `${labelFS}px`, fontWeight: 700, color: textCol, backgroundColor: accentColor, padding: "3px 6px", letterSpacing: "0.3px", lineHeight: 1.2, textShadow: textCol === "#ffffff" ? "0 0 2px rgba(0,0,0,0.4)" : "none" }}>
            {lbl}
          </div>
          <div style={{ height: `${cellH}px`, backgroundColor: "#ffffff" }} />
        </div>
      ))}
    </div>
  );
}

/** Date line â€” simple "Date: ___________" underline style */
function DateLine({ accentColor, density = 1, fieldStyle = "underline" as FieldStyle }: { accentColor: string; density?: number; fieldStyle?: FieldStyle }) {
  const w = Math.round(140 * density);
  const h = Math.round(20 * density);
  const fs = clampFont(Math.round(11 * density));
  return (
    <div style={{ display: "inline-flex", alignItems: "baseline", gap: `${Math.round(6 * density)}px` }}>
      <span style={{ fontSize: `${fs}px`, fontWeight: 600, color: accentColor, letterSpacing: "0.5px" }}>Date:</span>
      <span style={{ display: "inline-block", width: `${w}px`, height: `${h}px`, borderBottom: fieldStyle === "dotted" ? `1.5px dotted ${accentColor}60` : `1.5px solid ${accentColor}60` }}>&nbsp;</span>
    </div>
  );
}

/** Date slashed â€” DD / MM / YYYY with individual cells and slash separators */
function DateSlashed({ accentColor, density = 1 }: { accentColor: string; density?: number }) {
  const cellW = Math.round(28 * density);
  const yearW = Math.round(48 * density);
  const cellH = Math.round(22 * density);
  const fs = clampFont(Math.round(9 * density), MIN_LABEL_PX);
  const slashFS = clampFont(Math.round(14 * density));
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: `${Math.round(4 * density)}px` }}>
      {/* DD */}
      <div style={{ width: `${cellW}px`, height: `${cellH}px`, borderBottom: `1.5px solid ${accentColor}`, textAlign: "center" }}>
        <div style={{ fontSize: `${fs}px`, fontWeight: 600, color: `${accentColor}80`, letterSpacing: "0.5px", lineHeight: 1 }}>DD</div>
      </div>
      <span style={{ fontSize: `${slashFS}px`, color: `${accentColor}90`, fontWeight: 300 }}>/</span>
      {/* MM */}
      <div style={{ width: `${cellW}px`, height: `${cellH}px`, borderBottom: `1.5px solid ${accentColor}`, textAlign: "center" }}>
        <div style={{ fontSize: `${fs}px`, fontWeight: 600, color: `${accentColor}80`, letterSpacing: "0.5px", lineHeight: 1 }}>MM</div>
      </div>
      <span style={{ fontSize: `${slashFS}px`, color: `${accentColor}90`, fontWeight: 300 }}>/</span>
      {/* YYYY */}
      <div style={{ width: `${yearW}px`, height: `${cellH}px`, borderBottom: `1.5px solid ${accentColor}`, textAlign: "center" }}>
        <div style={{ fontSize: `${fs}px`, fontWeight: 600, color: `${accentColor}80`, letterSpacing: "0.5px", lineHeight: 1 }}>YYYY</div>
      </div>
    </div>
  );
}

/** Dispatcher: render date field based on template dateStyle */
function DateDisplay({ dateStyle, accentColor, density, fieldStyle }: { dateStyle: "grid" | "line" | "slashed"; accentColor: string; density?: number; fieldStyle?: FieldStyle }) {
  if (dateStyle === "line") return <DateLine accentColor={accentColor} density={density} fieldStyle={fieldStyle} />;
  if (dateStyle === "slashed") return <DateSlashed accentColor={accentColor} density={density} />;
  return <DateGrid accentColor={accentColor} density={density} />;
}

// ---------------------------------------------------------------------------
// Receipt Slip â€” Horizontal card layout (3-up on portrait A4)
// Each receipt is a landscape-oriented card stacked vertically.
// ~794Ã—374px per card. Properly sized fonts â€” NO density shrinking.
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
  const rawTpl = getTemplateConfig(form.style.template);
  // Override template accent with user's chosen color so ALL elements are consistent
  const tpl = { ...rawTpl, accent, accentSecondary: rawTpl.accentSecondary ?? accent };

  // Receipt cards use FULL-SIZE fonts â€” each card is ~794Ã—374px which is plenty
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
      <WatermarkOverlay tpl={tpl} density={1} title={layout.columnLabels?.["doc_title"] || config.title} watermarkImage={form.style.watermarkImage} watermarkOpacity={form.style.watermarkOpacity} />
      <DecorativeOverlay tpl={tpl} density={1} />
      <PageBorderOverlay tpl={tpl} density={1} />
      <AccentStripOverlay tpl={tpl} density={1} />
      <BackgroundTint tpl={tpl} />

      {/* Form Border */}
      {form.style.borderStyle !== "none" && (
        <div style={{ position: "absolute", inset: "4px", border: form.style.borderStyle === "double" ? `3px double ${accent}` : `1.5px solid ${accent}50`, pointerEvents: "none", borderRadius: "2px", zIndex: 1 }} />
      )}

      {/* MAIN CONTENT â€” horizontal card layout */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 2 }}>

        {/* Header band â€” full-width, content-aware height, stretches to edges */}
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
            <div data-sb-section="branding" style={{ flex: "0 0 auto", maxWidth: "38%", cursor: "pointer" }}>
              {form.companyBranding.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.companyBranding.logoUrl} alt="" style={{ height: "34px", marginBottom: "3px", objectFit: "contain", display: "block" }} />
              )}
              {form.companyBranding.name && (
                <div style={{ fontSize: `${headingSize}px`, fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, color: contrastText(accent), lineHeight: 1.2 }}>
                  {form.companyBranding.name}
                </div>
              )}
              {!form.companyBranding.name && !form.companyBranding.logoUrl && (
                <BlankField width="160px" height="18px" fieldStyle={fieldStyle} label="Company" accentColor="rgba(255,255,255,0.7)" fontSize={9} />
              )}
              {form.companyBranding.address && (
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.8)", marginTop: "2px", whiteSpace: "pre-line", lineHeight: 1.4 }}>{form.companyBranding.address}</div>
              )}
              {tpl.contactIcons && <ContactIconRow branding={form.companyBranding} accent="rgba(255,255,255,0.5)" density={1} />}
              {!tpl.contactIcons && (form.companyBranding.phone || form.companyBranding.email) && (
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>
                  {[form.companyBranding.phone, form.companyBranding.email].filter(Boolean).join(" \u00b7 ")}
                </div>
              )}
            </div>

            {/* Center: Receipt title */}
            <div data-sb-section="document-type" style={{ textAlign: "center", flex: "0 0 auto", cursor: "pointer" }}>
              <div style={{ fontSize: `${titleSize}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "3px", fontFamily: `'${fonts.heading}', sans-serif`, color: contrastText(accent) }}>
                {layout.columnLabels?.["doc_title"] || config.title}
              </div>
            </div>

            {/* Right: serial + date */}
            <div data-sb-section="print" style={{ textAlign: "right", flex: "0 0 auto", cursor: "pointer" }}>
              {serial.showSerial && (
                <div style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#ffffff", borderRadius: "3px", padding: "2px 6px", gap: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#374151" }}>{config.numberLabel}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "'Courier New', monospace", color: "#374151", letterSpacing: "1px" }}>{serial.prefix}</span>
                  <span style={{ display: "inline-block", width: "90px", height: "20px" }}>&nbsp;</span>
                </div>
              )}
              {layout.showDate && (
                <div style={{ marginTop: "6px" }}>
                  <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={0.92} fieldStyle={fieldStyle} />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Non-band header: company | title | serial/date with bottom border */
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: `${pad}px ${pad}px 0`, marginBottom: "4px", paddingBottom: "10px", ...getHeaderDividerStyle(tpl, 1) }}>
            <div data-sb-section="branding" style={{ flex: "0 0 auto", maxWidth: "38%", cursor: "pointer" }}>
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
                <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px", whiteSpace: "pre-line", lineHeight: 1.4 }}>{form.companyBranding.address}</div>
              )}
              {tpl.contactIcons && <ContactIconRow branding={form.companyBranding} accent={accent} density={1} />}
              {!tpl.contactIcons && (form.companyBranding.phone || form.companyBranding.email) && (
                <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "1px" }}>
                  {[form.companyBranding.phone, form.companyBranding.email].filter(Boolean).join(" \u00B7 ")}
                </div>
              )}
            </div>

            <div data-sb-section="document-type" style={{ textAlign: "center", flex: "0 0 auto", cursor: "pointer" }}>
              <div style={{ fontSize: `${titleSize}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "3px", fontFamily: `'${fonts.heading}', sans-serif`, color: accent }}>
                {layout.columnLabels?.["doc_title"] || config.title}
              </div>
            </div>

            <div data-sb-section="print" style={{ textAlign: "right", flex: "0 0 auto", cursor: "pointer" }}>
              {serial.showSerial && (
                <div style={{ display: "inline-flex", alignItems: "center", padding: "2px 6px", gap: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: accent }}>{config.numberLabel}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "'Courier New', monospace", color: accent, letterSpacing: "1px" }}>{serial.prefix}</span>
                  <span style={{ display: "inline-block", width: "90px", height: "20px" }}>&nbsp;</span>
                </div>
              )}
              {layout.showDate && (
                <div style={{ marginTop: "6px" }}>
                  <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={0.92} fieldStyle={fieldStyle} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom blocks â€” after-header */}
        {form.customBlocks && form.customBlocks.length > 0 && (
          <div style={{ padding: `0 ${pad}px` }}>
            <CustomBlocksRegion blocks={form.customBlocks} position="after-header" accentColor={accent} density={1} />
          </div>
        )}

        {/* BODY â€” two-column: fields left, amount right */}
        <div data-sb-section="layout" style={{ flex: 1, display: "flex", gap: "18px", padding: tpl.headerBand ? `12px ${pad}px 0` : `8px ${pad}px 0`, minHeight: 0, cursor: "pointer" }}>
          {/* Left column: form fields */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            {layout.showRecipient && (
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>{layout.columnLabels?.["receipt_receivedFrom"] || "Received from:"}</span>
                <div style={{ flex: 1, height: `${rowHeight}px`, borderBottom: lineBottom }}>&nbsp;</div>
              </div>
            )}
            {layout.showAmountInWords && (
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>{layout.columnLabels?.["receipt_sumOf"] || "The sum of:"}</span>
                <div style={{ flex: 1, height: `${rowHeight}px`, borderBottom: lineBottom }}>&nbsp;</div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>{layout.columnLabels?.["receipt_paymentFor"] || "Being payment for:"}</span>
              <div style={{ flex: 1, height: `${rowHeight}px`, borderBottom: lineBottom }}>&nbsp;</div>
            </div>
            {/* Payment checkboxes */}
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "14px", marginTop: "4px" }}>
              <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>{layout.columnLabels?.["receipt_payment"] || "Payment:"}</span>
              <BlankCheckbox label={layout.columnLabels?.["receipt_cashLabel"] || "Cash"} size={13} fontSize={11} />
              <BlankCheckbox label={layout.columnLabels?.["receipt_chequeLabel"] || "Cheque"} size={13} fontSize={11} />
              <BlankCheckbox label={layout.columnLabels?.["receipt_transferLabel"] || "Transfer"} size={13} fontSize={11} />
              <BlankCheckbox label={layout.columnLabels?.["receipt_mobileLabel"] || "Mobile"} size={13} fontSize={11} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, color: accent, whiteSpace: "nowrap" }}>{layout.columnLabels?.["receipt_chequeRef"] || "Cheque/Ref No:"}</span>
              <div style={{ flex: 1, height: `${rowHeight}px`, borderBottom: lineBottom }}>&nbsp;</div>
            </div>
          </div>

          {/* Right column: amount box */}
          <div style={{ flex: "0 0 auto", width: "155px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: "100%", border: `2.5px solid ${accent}`, borderRadius: "5px", padding: "14px", textAlign: "center", backgroundColor: `${accent}08` }}>
              <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: accent, marginBottom: "8px" }}>{layout.columnLabels?.["receipt_amount"] || "Amount"}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ fontSize: "20px", fontWeight: 800, color: accent }}>{getCurrencyLabel(layout)}</span>
                <div style={{ flex: 1, height: "24px", borderBottom: `2px solid ${accent}40` }}>&nbsp;</div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom blocks â€” after-items */}
        {form.customBlocks && form.customBlocks.length > 0 && (
          <div style={{ padding: `0 ${pad}px` }}>
            <CustomBlocksRegion blocks={form.customBlocks} position="after-items" accentColor={accent} density={1} />
          </div>
        )}

        {/* Custom blocks â€” before-signature */}
        {form.customBlocks && form.customBlocks.length > 0 && (
          <div style={{ padding: `0 ${pad}px` }}>
            <CustomBlocksRegion blocks={form.customBlocks} position="before-signature" accentColor={accent} density={1} />
          </div>
        )}

        {/* SIGNATURES */}
        {layout.showSignature && (
          <div data-sb-section="layout" style={{ display: "flex", justifyContent: "space-between", padding: `0 ${pad}px`, paddingTop: "10px", marginTop: "auto", cursor: "pointer" }}>
            <div>
              <div style={{ width: "150px", borderBottom: `1.5px solid ${accent}50`, height: "24px" }}>&nbsp;</div>
              <div style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginTop: "3px" }}>{layout.columnLabels?.["sig_left"] || "Cashier / Received By"}</div>
            </div>
            <div>
              <div style={{ width: "150px", borderBottom: `1.5px solid ${accent}50`, height: "24px" }}>&nbsp;</div>
              <div style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginTop: "3px" }}>{layout.columnLabels?.["sig_right"] || "Authorized Signature"}</div>
            </div>
          </div>
        )}

        {layout.showTerms && layout.termsText && (
          <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "5px", padding: `0 ${pad}px`, lineHeight: 1.35 }}>{layout.termsText}</div>
        )}
        {layout.customFooterText && (
          <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "3px", padding: `0 ${pad}px`, lineHeight: 1.35 }}>{layout.customFooterText}</div>
        )}

        {/* Footer bar */}
        <div style={{ padding: `0 ${tpl.footerStyle === "bar" ? 0 : pad}px` }}>
          <FooterBar tpl={tpl} density={1} branding={form.companyBranding} bleedL={padL} bleedR={padR} bleedB={padB} />
        </div>

        {/* Brand logos */}
        {form.brandLogos.enabled && form.brandLogos.logos.length > 0 && form.brandLogos.position === "bottom" && (
          <div data-sb-section="logos" style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center", paddingTop: "5px", borderTop: "1px solid #e5e7eb", margin: `5px ${pad}px 0`, cursor: "pointer" }}>
            {form.brandLogos.logos.map((logo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={logo.url} alt={logo.name} style={{ height: "18px", objectFit: "contain", opacity: 0.7 }} />
            ))}
          </div>
        )}

        {/* Custom blocks â€” after-footer */}
        {form.customBlocks && form.customBlocks.length > 0 && (
          <div style={{ padding: `0 ${pad}px` }}>
            <CustomBlocksRegion blocks={form.customBlocks} position="after-footer" accentColor={accent} density={1} />
          </div>
        )}

        {/* Bottom padding */}
        <div style={{ height: `${pad - 6}px`, flexShrink: 0 }} />
      </div>

      {/* RIGHT SIDEBAR â€” colored strip with vertical text */}
      {tpl.receiptSidebar && (
        <div data-sb-section="style" style={{ width: `${sidebarW}px`, backgroundColor: sidebarColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
          <div style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)", color: contrastText(sidebarColor), fontSize: "18px", fontWeight: 900, letterSpacing: "5px", textTransform: "uppercase" }}>
            {layout.columnLabels?.["doc_title"] || config.title}
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
// Layout Archetype System â€” 6 structural layouts for the header + field area
//
// Each layout function renders the header (company branding, doc title,
// serial, contacts) and field rows (date, customer, etc.) differently.
// The items table, totals, signatures, footer remain shared below.
//
// standard:       Company LEFT | Title RIGHT, 2-col fields below
// centered:       Everything center-stacked, minimal whitespace
// dual-column:    From/To split boxes, structured sections  
// compact-header: 3-zone (brand LEFT | title CENTER | date RIGHT)
// bold-header:    Oversized name, services text, DAY/MONTH/YEAR
// grid-info:      Company info in bordered grid cells
// ---------------------------------------------------------------------------

interface LayoutCtx {
  form: SalesBookFormData;
  tpl: SalesBookTemplate;
  config: (typeof DOCUMENT_TYPE_CONFIGS)[SalesDocumentType];
  fonts: { heading: string; body: string };
  accent: string;
  density: number;
  spacingMultiplier: number;
  headingSize: number;
  fontSize: number;
  labelSize: number;
  rowHeight: number;
  fieldStyle: FieldStyle;
  formsPerPage: number;
  isBand: boolean;
  padV: number;
  padL: number;
  padR: number;
}

/** Shared: company branding block (logo + name + tagline + address + contacts) */
function BrandingBlock({ ctx, color, contactColor }: { ctx: LayoutCtx; color: string; contactColor: string }) {
  const { form, tpl, density, headingSize, fonts, fieldStyle } = ctx;
  const b = form.companyBranding;
  return (
    <div data-sb-section="branding" style={{ cursor: "pointer" }}>
      {b.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.logoUrl} alt="" style={{ height: `${Math.round(40 * density)}px`, marginBottom: "5px", objectFit: "contain", display: "inline-block" }} />
      )}
      {b.name && (
        <div style={{ fontSize: `${headingSize}px`, fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, color, lineHeight: 1.2 }}>{b.name}</div>
      )}
      {!b.name && !b.logoUrl && (
        <BlankField width="200px" height={`${Math.round(22 * density)}px`} fieldStyle={fieldStyle} label={ctx.form.formLayout.columnLabels?.["grid_company"] || "Company Name"} accentColor={color} />
      )}
      {b.tagline && (
        <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: contactColor, marginTop: "2px", fontStyle: "italic" }}>{b.tagline}</div>
      )}
      {b.address && (
        <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: contactColor, marginTop: "3px", whiteSpace: "pre-line", lineHeight: 1.4 }}>{b.address}</div>
      )}
      {(b.phone || b.email) && !tpl.contactIcons && (
        <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: contactColor, marginTop: "2px" }}>{[b.phone, b.email].filter(Boolean).join(" \u00b7 ")}</div>
      )}
      {b.website && !tpl.contactIcons && (
        <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: contactColor, marginTop: "1px", opacity: 0.8 }}>{b.website}</div>
      )}
      {tpl.contactIcons && <ContactIconRow branding={b} accent={ctx.isBand ? "rgba(255,255,255,0.5)" : ctx.accent} density={density} />}
      {b.taxId && (
        <div style={{ fontSize: `${clampFont(Math.round(9 * density))}px`, color: contactColor, marginTop: "1px", opacity: 0.8 }}>{ctx.form.formLayout.columnLabels?.["field_tpinLabel"] || "TPIN"}: {b.taxId}</div>
      )}
    </div>
  );
}

/** Shared: document title + serial number block */
function DocTitleBlock({ ctx, color, align }: { ctx: LayoutCtx; color: string; align: "left" | "center" | "right" }) {
  const { config, fonts, density, tpl } = ctx;
  const layout = ctx.form.formLayout;
  const docTitle = layout.columnLabels?.["doc_title"] || config.title;
  const serial = ctx.form.serialConfig;
  const serialStyle = tpl.serialStyle ?? "inline";
  const numFS = clampFont(Math.round(12 * density));
  const stampW = Math.round(100 * density);
  const stampH = Math.round(22 * density);
  const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const onBand = color !== ctx.accent; // true when rendered on accent-colored background

  /* Serial number stamp area — white bg only when on a colored band, otherwise transparent */
  const serialStampArea = (
    <div style={{ display: "inline-flex", alignItems: "center", ...(onBand ? { backgroundColor: "#ffffff", borderRadius: "3px" } : {}), padding: `${Math.round(3 * density)}px ${Math.round(6 * density)}px`, gap: "3px" }}>
      <span style={{ fontSize: `${numFS}px`, fontWeight: 700, color: onBand ? "#374151" : ctx.accent }}>{config.numberLabel}</span>
      <span style={{ fontSize: `${numFS}px`, fontWeight: 700, fontFamily: "'Courier New', monospace", color: onBand ? "#374151" : ctx.accent, letterSpacing: "1px" }}>{serial.prefix}</span>
      <span style={{ display: "inline-block", width: `${stampW}px`, height: `${stampH}px` }}>&nbsp;</span>
    </div>
  );

  return (
    <div data-sb-section="document-type" style={{ textAlign: align, cursor: "pointer" }}>
      <div style={{ fontSize: `${clampFont(Math.round(28 * density), 18)}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "3px", fontFamily: `'${fonts.heading}', sans-serif`, color }}>
        {docTitle}
      </div>
      {serial.showSerial && serialStyle === "inline" && (
        <div style={{ display: "flex", justifyContent: justify, marginTop: "6px" }}>
          {serialStampArea}
        </div>
      )}
      {serial.showSerial && serialStyle === "boxed" && (
        <div style={{ display: "flex", justifyContent: justify, marginTop: "6px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", border: `1.5px solid ${onBand ? (color === "#ffffff" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.25)") : "#d1d5db"}`, borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ padding: `${Math.round(4 * density)}px ${Math.round(8 * density)}px`, backgroundColor: onBand ? (color === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)") : `${ctx.accent}12`, borderRight: `1.5px solid ${onBand ? (color === "#ffffff" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.25)") : "#d1d5db"}` }}>
              <span style={{ fontSize: `${numFS}px`, fontWeight: 700, color: onBand ? color : "#374151", letterSpacing: "0.5px" }}>{config.numberLabel}</span>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", ...(onBand ? { backgroundColor: "#ffffff" } : {}), padding: `${Math.round(3 * density)}px ${Math.round(6 * density)}px`, gap: "2px" }}>
              <span style={{ fontSize: `${numFS}px`, fontWeight: 700, fontFamily: "'Courier New', monospace", color: onBand ? "#374151" : ctx.accent, letterSpacing: "1px" }}>{serial.prefix}</span>
              <span style={{ display: "inline-block", width: `${stampW}px`, height: `${stampH}px` }}>&nbsp;</span>
            </div>
          </div>
        </div>
      )}
      {serial.showSerial && serialStyle === "stacked" && (
        <div style={{ display: "flex", justifyContent: justify, marginTop: "6px" }}>
          <div style={{ textAlign: align }}>
            <div style={{ fontSize: `${clampFont(Math.round(9 * density), MIN_LABEL_PX)}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: onBand ? color : "#374151", marginBottom: "3px" }}>{config.numberLabel}</div>
            {serialStampArea}
          </div>
        </div>
      )}
    </div>
  );
}

/** Shared: standard 2-column field grid (date, recipient, PO#, customs) */
function StandardFieldGrid({ ctx }: { ctx: LayoutCtx }) {
  const { form, tpl, config, accent, density, labelSize, rowHeight, fieldStyle, formsPerPage } = ctx;
  const layout = form.formLayout;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(10 * density)}px` }}>
      {layout.showDate && (
        <div>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_date"] || "Date"}</span>
          <div style={{ marginTop: "3px" }}>{formsPerPage <= 2 ? <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={density} fieldStyle={fieldStyle} /> : <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} />}</div>
        </div>
      )}
      {layout.showDueDate && (
        <div>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_dueDate"] || "Due Date"}</span>
          <div style={{ marginTop: "3px" }}>{formsPerPage <= 2 ? <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={density} fieldStyle={fieldStyle} /> : <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} />}</div>
        </div>
      )}
      {layout.showRecipient && (
        <div>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_recipient"] || config.recipientLabel}</span>
          <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
        </div>
      )}
      {layout.showSender && !form.companyBranding.name && !form.companyBranding.logoUrl && (
        <div>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_sender"] || config.senderLabel}</span>
          <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
        </div>
      )}
      {layout.showPoNumber && (
        <div>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_poNumber"] || "P.O. Number"}</span>
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
  );
}

// â”€â”€ Layout 1: STANDARD â€” Company LEFT | Title RIGHT, 2-col fields below â”€â”€

function LayoutStandard({ ctx }: { ctx: LayoutCtx }) {
  const { tpl, accent, density, form, padV, padL, padR } = ctx;
  const isBand = ctx.isBand;
  const textColor = isBand ? contrastText(accent) : accent;
  const contactColor = isBand ? (contrastText(accent) === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)") : "#6b7280";

  return (
    <>
      {/* Header */}
      {isBand ? (
        <div style={{ background: tpl.headerGradient ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : accent, marginLeft: `-${padL}px`, marginRight: `-${padR}px`, marginTop: `-${padV}px`, padding: `${Math.round(14 * density)}px ${padR}px ${Math.round(12 * density)}px ${padL}px`, marginBottom: `${Math.round(14 * density)}px`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}><BrandingBlock ctx={ctx} color={textColor} contactColor={contactColor} /></div>
            <div style={{ flexShrink: 0, marginLeft: "12px" }}><DocTitleBlock ctx={ctx} color={textColor} align="right" /></div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: `${Math.round(14 * density)}px`, paddingBottom: `${Math.round(10 * density)}px`, ...getHeaderDividerStyle(tpl, density), position: "relative", zIndex: 1, ...(tpl.headerStyle === "boxed" ? { border: `1.5px solid ${accent}60`, padding: `${Math.round(12 * density)}px`, borderRadius: "3px", marginBottom: `${Math.round(16 * density)}px` } : {}) }}>
          <div style={{ flex: 1, minWidth: 0 }}><BrandingBlock ctx={ctx} color={textColor} contactColor={contactColor} /></div>
          <div style={{ flexShrink: 0, marginLeft: "12px" }}><DocTitleBlock ctx={ctx} color={textColor} align="right" /></div>
        </div>
      )}
      <StandardFieldGrid ctx={ctx} />
    </>
  );
}

// â”€â”€ Layout 2: CENTERED â€” Everything center-stacked, clean minimal â”€â”€

function LayoutCentered({ ctx }: { ctx: LayoutCtx }) {
  const { tpl, accent, density, form, fonts, headingSize, labelSize, rowHeight, fieldStyle, formsPerPage, config } = ctx;
  const b = form.companyBranding;
  const serial = form.serialConfig;
  const layout = form.formLayout;

  return (
    <>
      {/* Center-stacked header */}
      <div style={{ textAlign: "center", marginBottom: `${Math.round(14 * density)}px`, paddingBottom: `${Math.round(10 * density)}px`, ...getHeaderDividerStyle(tpl, density), position: "relative", zIndex: 1 }}>
        {b.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.logoUrl} alt="" style={{ height: `${Math.round(44 * density)}px`, margin: "0 auto 6px", objectFit: "contain", display: "block" }} />
        )}
        {b.name && (
          <div style={{ fontSize: `${headingSize}px`, fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, color: accent, lineHeight: 1.2 }}>{b.name}</div>
        )}
        {b.tagline && (
          <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#6b7280", marginTop: "2px", fontStyle: "italic" }}>{b.tagline}</div>
        )}
        {b.address && (
          <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#6b7280", marginTop: "3px" }}>{b.address}</div>
        )}
        {(b.phone || b.email || b.website) && (
          <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#9ca3af", marginTop: "2px" }}>{[b.phone, b.email, b.website].filter(Boolean).join(" \u00b7 ")}</div>
        )}
        {b.taxId && (
          <div style={{ fontSize: `${clampFont(Math.round(9 * density))}px`, color: "#9ca3af", marginTop: "1px" }}>{layout.columnLabels?.["field_tpinLabel"] || "TPIN"}: {b.taxId}</div>
        )}
        {/* Title below branding */}
        <div style={{ marginTop: `${Math.round(12 * density)}px` }}>
          <div style={{ fontSize: `${clampFont(Math.round(28 * density), 18)}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "3px", fontFamily: `'${fonts.heading}', sans-serif`, color: accent }}>{layout.columnLabels?.["doc_title"] || config.title}</div>
          {serial.showSerial && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "6px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", padding: `${Math.round(3 * density)}px ${Math.round(6 * density)}px`, gap: "3px" }}>
                <span style={{ fontSize: `${clampFont(Math.round(12 * density))}px`, fontWeight: 700, color: accent }}>{config.numberLabel}</span>
                <span style={{ fontSize: `${clampFont(Math.round(12 * density))}px`, fontWeight: 700, fontFamily: "'Courier New', monospace", color: accent, letterSpacing: "1px" }}>{serial.prefix}</span>
                <span style={{ display: "inline-block", width: `${Math.round(100 * density)}px`, height: `${Math.round(22 * density)}px` }}>&nbsp;</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Centered 2-col fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(10 * density)}px` }}>
        {layout.showDate && (
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_date"] || "Date"}</span>
            <div style={{ marginTop: "3px", display: "flex", justifyContent: "center" }}>{formsPerPage <= 2 ? <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={density} fieldStyle={fieldStyle} /> : <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} />}</div>
          </div>
        )}
        {layout.showRecipient && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_recipient"] || config.recipientLabel}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
      </div>
    </>
  );
}

// â”€â”€ Layout 3: DUAL-COLUMN â€” From/To split info boxes â”€â”€

function LayoutDualColumn({ ctx }: { ctx: LayoutCtx }) {
  const { tpl, accent, density, form, fonts, headingSize, labelSize, rowHeight, fieldStyle, formsPerPage, config, padV, padL, padR } = ctx;
  const b = form.companyBranding;
  const serial = form.serialConfig;
  const layout = form.formLayout;
  const isBand = ctx.isBand;

  return (
    <>
      {/* Top row: branding LEFT, title+serial+date RIGHT */}
      {isBand ? (
        <div style={{ background: tpl.headerGradient ? `linear-gradient(135deg, ${accent}, ${accent}cc)` : accent, marginLeft: `-${padL}px`, marginRight: `-${padR}px`, marginTop: `-${padV}px`, padding: `${Math.round(14 * density)}px ${padR}px ${Math.round(12 * density)}px ${padL}px`, marginBottom: `${Math.round(14 * density)}px`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}><BrandingBlock ctx={ctx} color={contrastText(accent)} contactColor={contrastText(accent) === "#ffffff" ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)"} /></div>
            <div style={{ flexShrink: 0, marginLeft: "12px" }}><DocTitleBlock ctx={ctx} color={contrastText(accent)} align="right" /></div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: `${Math.round(10 * density)}px`, paddingBottom: `${Math.round(8 * density)}px`, ...getHeaderDividerStyle(tpl, density), position: "relative", zIndex: 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}><BrandingBlock ctx={ctx} color={accent} contactColor="#6b7280" /></div>
          <div style={{ flexShrink: 0, marginLeft: "12px" }}>
            <DocTitleBlock ctx={ctx} color={accent} align="right" />
            {layout.showDate && (
              <div style={{ marginTop: `${Math.round(8 * density)}px`, textAlign: "right" }}>
                <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>Date: </span>
                {formsPerPage <= 2 ? <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={density} fieldStyle={fieldStyle} /> : <BlankField width="120px" height={`${rowHeight}px`} fieldStyle={fieldStyle} />}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dual-column: FROM (sender) | TO (recipient) boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(12 * density)}px`, marginBottom: `${Math.round(10 * density)}px` }}>
        {/* FROM box */}
        <div style={{ border: `1.5px solid ${accent}30`, borderRadius: "4px", padding: `${Math.round(8 * density)}px`, backgroundColor: `${accent}05` }}>
          <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: accent, marginBottom: `${Math.round(6 * density)}px`, borderBottom: `1.5px solid ${accent}20`, paddingBottom: "4px" }}>{layout.columnLabels?.["field_sender"] || config.senderLabel || "From"}</div>
          {b.name ? (
            <div style={{ fontSize: `${clampFont(Math.round(11 * density))}px`, color: "#374151", lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700 }}>{b.name}</div>
              {b.address && <div style={{ color: "#6b7280", whiteSpace: "pre-line" }}>{b.address}</div>}
              {b.phone && <div style={{ color: "#6b7280" }}>Tel: {b.phone}</div>}
              {b.email && <div style={{ color: "#6b7280" }}>{b.email}</div>}
            </div>
          ) : (
            <>
              <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} label="Name" accentColor="#9ca3af" fontSize={Math.round(9 * density)} />
              <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} label="Address" accentColor="#9ca3af" fontSize={Math.round(9 * density)} />
            </>
          )}
        </div>
        {/* TO box */}
        <div style={{ border: `1.5px solid ${accent}30`, borderRadius: "4px", padding: `${Math.round(8 * density)}px`, backgroundColor: `${accent}05` }}>
          <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: accent, marginBottom: `${Math.round(6 * density)}px`, borderBottom: `1.5px solid ${accent}20`, paddingBottom: "4px" }}>{layout.columnLabels?.["field_recipient"] || config.recipientLabel || "To"}</div>
          <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} label="Name" accentColor="#9ca3af" fontSize={Math.round(9 * density)} />
          <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} label="Address" accentColor="#9ca3af" fontSize={Math.round(9 * density)} />
          <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} label="Phone / Email" accentColor="#9ca3af" fontSize={Math.round(9 * density)} />
        </div>
      </div>

      {/* Remaining fields (due date, PO#, customs) in compact row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(10 * density)}px` }}>
        {layout.showDueDate && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_dueDate"] || "Due Date"}</span>
            <div style={{ marginTop: "3px" }}>{formsPerPage <= 2 ? <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={density} fieldStyle={fieldStyle} /> : <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} />}</div>
          </div>
        )}
        {layout.showPoNumber && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_poNumber"] || "P.O. Number"}</span>
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
    </>
  );
}

// â”€â”€ Layout 4: COMPACT-HEADER â€” 3-zone (brand LEFT | title CENTER | date+serial RIGHT) â”€â”€

function LayoutCompactHeader({ ctx }: { ctx: LayoutCtx }) {
  const { tpl, accent, density, form, fonts, headingSize, labelSize, rowHeight, fieldStyle, formsPerPage, config } = ctx;
  const b = form.companyBranding;
  const serial = form.serialConfig;
  const layout = form.formLayout;

  return (
    <>
      {/* 3-zone header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: `${Math.round(12 * density)}px`, paddingBottom: `${Math.round(8 * density)}px`, ...getHeaderDividerStyle(tpl, density), position: "relative", zIndex: 1 }}>
        {/* LEFT: Logo + company (compact) */}
        <div style={{ flex: "0 0 38%", minWidth: 0 }}>
          {b.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt="" style={{ height: `${Math.round(34 * density)}px`, marginBottom: "3px", objectFit: "contain" }} />
          )}
          {b.name && (
            <div style={{ fontSize: `${clampFont(Math.round(16 * density), 12)}px`, fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, color: accent, lineHeight: 1.2 }}>{b.name}</div>
          )}
          {b.address && (
            <div style={{ fontSize: `${clampFont(Math.round(9 * density))}px`, color: "#6b7280", marginTop: "2px", whiteSpace: "pre-line", lineHeight: 1.3 }}>{b.address}</div>
          )}
          {(b.phone || b.email) && (
            <div style={{ fontSize: `${clampFont(Math.round(9 * density))}px`, color: "#9ca3af", marginTop: "1px" }}>{[b.phone, b.email].filter(Boolean).join(" \u00b7 ")}</div>
          )}
        </div>

        {/* CENTER: Title */}
        <div style={{ flex: "0 0 auto", textAlign: "center" }}>
          <div style={{ fontSize: `${clampFont(Math.round(22 * density), 16)}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px", fontFamily: `'${fonts.heading}', sans-serif`, color: accent }}>{layout.columnLabels?.["doc_title"] || config.title}</div>
          {serial.showSerial && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "4px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", padding: `${Math.round(2 * density)}px ${Math.round(5 * density)}px`, gap: "2px" }}>
                <span style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, fontWeight: 700, color: accent }}>{config.numberLabel}</span>
                <span style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, fontWeight: 700, fontFamily: "'Courier New', monospace", color: accent, letterSpacing: "1px" }}>{serial.prefix}</span>
                <span style={{ display: "inline-block", width: `${Math.round(90 * density)}px`, height: `${Math.round(20 * density)}px` }}>&nbsp;</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Date + reference */}
        <div style={{ flex: "0 0 auto", textAlign: "right" }}>
          {layout.showDate && (
            <div>
              <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_date"] || "Date"}</span>
              <div style={{ marginTop: "3px" }}>{formsPerPage <= 2 ? <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={density} fieldStyle={fieldStyle} /> : <BlankField width="120px" height={`${rowHeight}px`} fieldStyle={fieldStyle} />}</div>
            </div>
          )}
        </div>
      </div>

      {/* Compact field rows â€” single row where possible */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(12 * density)}px`, marginBottom: `${Math.round(10 * density)}px` }}>
        {layout.showRecipient && (
          <div style={{ gridColumn: "1 / 3" }}>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_recipient"] || config.recipientLabel}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
        {layout.showDueDate && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_dueDate"] || "Due Date"}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
        {layout.showPoNumber && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_poNumber"] || "P.O. Number"}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
        {layout.showCustomField1 && layout.customField1Label && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.customField1Label}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
      </div>
    </>
  );
}

// â”€â”€ Layout 5: BOLD-HEADER â€” Oversized company name, services text, big contacts â”€â”€

function LayoutBoldHeader({ ctx }: { ctx: LayoutCtx }) {
  const { tpl, accent, density, form, fonts, labelSize, rowHeight, fieldStyle, formsPerPage, config } = ctx;
  const b = form.companyBranding;
  const serial = form.serialConfig;
  const layout = form.formLayout;

  return (
    <>
      {/* OVERSIZED company branding â€” dominates top section */}
      <div style={{ textAlign: "center", marginBottom: `${Math.round(8 * density)}px`, position: "relative", zIndex: 1 }}>
        {b.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.logoUrl} alt="" style={{ height: `${Math.round(52 * density)}px`, margin: "0 auto 4px", objectFit: "contain", display: "block" }} />
        )}
        {b.name && (
          <div style={{ fontSize: `${clampFont(Math.round(32 * density), 22)}px`, fontWeight: 900, fontFamily: `'${fonts.heading}', sans-serif`, color: accent, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "1px" }}>{b.name}</div>
        )}
        {b.tagline && (
          <div style={{ fontSize: `${clampFont(Math.round(12 * density))}px`, color: accent, marginTop: "2px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>{b.tagline}</div>
        )}
        {b.address && (
          <div style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#4b5563", marginTop: "4px", fontWeight: 500 }}>{b.address}</div>
        )}
        {/* Contact row â€” prominent horizontal display */}
        {(b.phone || b.email || b.website) && (
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: `${Math.round(14 * density)}px`, marginTop: `${Math.round(6 * density)}px`, fontSize: `${clampFont(Math.round(11 * density))}px`, fontWeight: 600, color: "#374151" }}>
            {b.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><PhoneIcon size={Math.round(11 * density)} color="#374151" /> {b.phone}</span>}
            {b.email && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><EmailIcon size={Math.round(11 * density)} color="#374151" /> {b.email}</span>}
            {b.website && <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><GlobeIcon size={Math.round(11 * density)} color="#374151" /> {b.website}</span>}
          </div>
        )}
        {b.taxId && (
          <div style={{ fontSize: `${clampFont(Math.round(9 * density))}px`, color: "#9ca3af", marginTop: "2px" }}>{layout.columnLabels?.["field_tpinLabel"] || "TPIN"}: {b.taxId}</div>
        )}
      </div>

      {/* Title banner â€” full width accent bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: accent, color: contrastText(accent), padding: `${Math.round(8 * density)}px ${Math.round(12 * density)}px`, borderRadius: "4px", marginBottom: `${Math.round(10 * density)}px`, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: `${clampFont(Math.round(18 * density), 14)}px`, fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px", fontFamily: `'${fonts.heading}', sans-serif` }}>{layout.columnLabels?.["doc_title"] || config.title}</div>
        <div style={{ display: "flex", alignItems: "stretch", gap: `${Math.round(8 * density)}px` }}>
          {serial.showSerial && (
            <div style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#ffffff", borderRadius: "3px", padding: `${Math.round(2 * density)}px ${Math.round(8 * density)}px`, gap: "3px" }}>
              <span style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, fontWeight: 700, color: "#374151" }}>{config.numberLabel}</span>
              <span style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, fontWeight: 700, fontFamily: "'Courier New', monospace", color: "#374151", letterSpacing: "1px" }}>{serial.prefix}</span>
              <span style={{ display: "inline-block", width: `${Math.round(90 * density)}px` }}>&nbsp;</span>
            </div>
          )}
          {layout.showDate && formsPerPage <= 2 && <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={density} />}
        </div>
      </div>

      {/* Customer info fields â€” prominent labels */}
      <div style={{ marginBottom: `${Math.round(10 * density)}px` }}>
        {layout.showRecipient && (
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: `${Math.round(6 * density)}px` }}>
            <span style={{ fontSize: `${clampFont(Math.round(12 * density))}px`, fontWeight: 800, color: accent, whiteSpace: "nowrap" }}>{layout.columnLabels?.["field_recipient"] || config.recipientLabel}:</span>
            <div style={{ flex: 1 }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(4 * density)}px ${Math.round(14 * density)}px` }}>
          {layout.showDueDate && (
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: `${labelSize}px`, fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>{layout.columnLabels?.["field_dueDate"] || "Due"}:</span>
              <div style={{ flex: 1 }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
            </div>
          )}
          {layout.showPoNumber && (
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: `${labelSize}px`, fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>{layout.columnLabels?.["field_poNumber"] || "P.O.#"}:</span>
              <div style={{ flex: 1 }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
            </div>
          )}
          {layout.showCustomField1 && layout.customField1Label && (
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: `${labelSize}px`, fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>{layout.customField1Label}:</span>
              <div style={{ flex: 1 }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
            </div>
          )}
          {layout.showCustomField2 && layout.customField2Label && (
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: `${labelSize}px`, fontWeight: 700, color: accent, whiteSpace: "nowrap" }}>{layout.customField2Label}:</span>
              <div style={{ flex: 1 }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// â”€â”€ Layout 6: GRID-INFO â€” Company details in bordered grid cells â”€â”€

function LayoutGridInfo({ ctx }: { ctx: LayoutCtx }) {
  const { tpl, accent, density, form, fonts, headingSize, labelSize, rowHeight, fieldStyle, formsPerPage, config } = ctx;
  const b = form.companyBranding;
  const serial = form.serialConfig;
  const layout = form.formLayout;

  const cellStyle: React.CSSProperties = {
    border: `1px solid ${accent}30`,
    padding: `${Math.round(5 * density)}px ${Math.round(7 * density)}px`,
    fontSize: `${clampFont(Math.round(10 * density))}px`,
  };
  const cellLabel: React.CSSProperties = {
    fontSize: `${clampFont(Math.round(8 * density), MIN_LABEL_PX)}px`,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: accent,
    marginBottom: "2px",
  };

  return (
    <>
      {/* Logo + Title row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: `${Math.round(10 * density)}px`, position: "relative", zIndex: 1 }}>
        <div>
          {b.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.logoUrl} alt="" style={{ height: `${Math.round(40 * density)}px`, marginBottom: "4px", objectFit: "contain" }} />
          )}
          {b.name && (
            <div style={{ fontSize: `${headingSize}px`, fontWeight: 800, fontFamily: `'${fonts.heading}', sans-serif`, color: accent, lineHeight: 1.2 }}>{b.name}</div>
          )}
        </div>
        <DocTitleBlock ctx={ctx} color={accent} align="right" />
      </div>

      {/* Info grid â€” company + document fields in bordered cells */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", marginBottom: `${Math.round(10 * density)}px`, border: `1px solid ${accent}30`, borderRadius: "3px", overflow: "hidden" }}>
        {/* Row 1: Company/Address | Date */}
        <div style={{ ...cellStyle, borderRight: `1px solid ${accent}30` }}>
          <div style={cellLabel}>{layout.columnLabels?.["grid_company"] || (b.name ? "Company" : "Company Name")}</div>
          {b.name ? <div style={{ fontWeight: 600, color: "#374151" }}>{b.name}</div> : <BlankField width="100%" height={`${Math.round(18 * density)}px`} fieldStyle={fieldStyle} />}
        </div>
        <div style={cellStyle}>
          <div style={cellLabel}>{layout.columnLabels?.["field_date"] || "Date"}</div>
          {layout.showDate && formsPerPage <= 2 ? <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={density} fieldStyle={fieldStyle} /> : <BlankField width="100%" height={`${Math.round(18 * density)}px`} fieldStyle={fieldStyle} />}
        </div>
        {/* Row 2: Phone/Fax | Address */}
        <div style={{ ...cellStyle, borderRight: `1px solid ${accent}30`, borderTop: "none" }}>
          <div style={cellLabel}>{layout.columnLabels?.["grid_phone"] || "Tel / Phone"}</div>
          {b.phone ? <div style={{ color: "#374151" }}>{b.phone}</div> : <BlankField width="100%" height={`${Math.round(18 * density)}px`} fieldStyle={fieldStyle} />}
        </div>
        <div style={{ ...cellStyle, borderTop: "none" }}>
          <div style={cellLabel}>{layout.columnLabels?.["grid_address"] || "Address"}</div>
          {b.address ? <div style={{ color: "#374151", fontSize: `${clampFont(Math.round(9 * density))}px` }}>{b.address}</div> : <BlankField width="100%" height={`${Math.round(18 * density)}px`} fieldStyle={fieldStyle} />}
        </div>
        {/* Row 3: Email | Website */}
        <div style={{ ...cellStyle, borderRight: `1px solid ${accent}30`, borderTop: "none" }}>
          <div style={cellLabel}>{layout.columnLabels?.["grid_email"] || "Email"}</div>
          {b.email ? <div style={{ color: "#374151" }}>{b.email}</div> : <BlankField width="100%" height={`${Math.round(18 * density)}px`} fieldStyle={fieldStyle} />}
        </div>
        <div style={{ ...cellStyle, borderTop: "none" }}>
          <div style={cellLabel}>{layout.columnLabels?.["field_recipient"] || config.recipientLabel}</div>
          <BlankField width="100%" height={`${Math.round(18 * density)}px`} fieldStyle={fieldStyle} />
        </div>
      </div>

      {/* Extra fields if needed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(10 * density)}px` }}>
        {layout.showDueDate && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_dueDate"] || "Due Date"}</span>
            <div style={{ marginTop: "3px" }}>{formsPerPage <= 2 ? <DateDisplay dateStyle={tpl.dateStyle ?? "grid"} accentColor={accent} density={density} fieldStyle={fieldStyle} /> : <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} />}</div>
          </div>
        )}
        {layout.showPoNumber && (
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_poNumber"] || "P.O. Number"}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        )}
      </div>
    </>
  );
}

/** Dispatch to the right layout component based on template layout type */
function LayoutHeader({ ctx }: { ctx: LayoutCtx }) {
  switch (ctx.tpl.layout) {
    case "centered":       return <LayoutCentered ctx={ctx} />;
    case "dual-column":    return <LayoutDualColumn ctx={ctx} />;
    case "compact-header": return <LayoutCompactHeader ctx={ctx} />;
    case "bold-header":    return <LayoutBoldHeader ctx={ctx} />;
    case "grid-info":      return <LayoutGridInfo ctx={ctx} />;
    default:               return <LayoutStandard ctx={ctx} />;
  }
}

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
  const rawTpl = getTemplateConfig(form.style.template);
  // Override template accent with user's chosen color so ALL elements are consistent
  const tpl = { ...rawTpl, accent, accentSecondary: rawTpl.accentSecondary ?? accent };

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
    return "100px"; // min ~10 figures (10,000,000.00)
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
      <WatermarkOverlay tpl={tpl} density={density} title={layout.columnLabels?.["doc_title"] || config.title} watermarkImage={form.style.watermarkImage} watermarkOpacity={form.style.watermarkOpacity} />
      <DecorativeOverlay tpl={tpl} density={density} />
      <PageBorderOverlay tpl={tpl} density={density} />
      <AccentStripOverlay tpl={tpl} density={density} />
      <BackgroundTint tpl={tpl} />

      {/* HEADER + FIELD ROWS â€” dispatched by template layout archetype */}
      <LayoutHeader ctx={{
        form, tpl, config, fonts, accent, density, spacingMultiplier,
        headingSize, fontSize, labelSize, rowHeight, fieldStyle,
        formsPerPage, isBand: !!tpl.headerBand,
        padV, padL, padR,
      }} />

      {/* TYPE-SPECIFIC FIELDS */}
      {docType === "quotation" && layout.showValidFor !== false && (
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: `${Math.round(8 * density)}px` }}>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, whiteSpace: "nowrap" }}>{layout.columnLabels?.["field_validFor"] || "Valid For"}</span>
          <div style={{ width: "65px", height: `${rowHeight}px`, borderBottom: fieldStyle === "dotted" ? "1.5px dotted #9ca3af" : "1.5px solid #9ca3af" }}>&nbsp;</div>
          <span style={{ fontSize: `${clampFont(Math.round(10 * density))}px`, color: "#6b7280" }}>{layout.columnLabels?.["field_validForSuffix"] || "Days from date of issue"}</span>
        </div>
      )}
      {docType === "proforma-invoice" && layout.showValidUntil !== false && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(8 * density)}px` }}>
          <div>
            <span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_validUntil"] || "Valid Until"}</span>
            <div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div>
          </div>
        </div>
      )}
      {docType === "credit-note" && (layout.showOriginalInvoice !== false || layout.showReasonForCredit !== false) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(8 * density)}px` }}>
          {layout.showOriginalInvoice !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_originalInvoiceNum"] || "Original Invoice #"}</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
          {layout.showOriginalInvoice !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_originalInvoiceDate"] || "Original Invoice Date"}</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
          {layout.showReasonForCredit !== false && (
            <div style={{ gridColumn: "1 / -1" }}><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_reasonForCredit"] || "Reason for Credit"}</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
        </div>
      )}
      {docType === "purchase-order" && (layout.showShipTo !== false || layout.showDeliveryBy !== false) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(8 * density)}px` }}>
          {layout.showShipTo !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_shipTo"] || "Ship To"}</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${Math.round(rowHeight * 1.5)}px`} fieldStyle={fieldStyle === "underline" ? "box" : fieldStyle} /></div></div>
          )}
          {layout.showDeliveryBy !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_deliveryReqBy"] || "Delivery Required By"}</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
        </div>
      )}
      {docType === "delivery-note" && (layout.showVehicleNo !== false || layout.showDriverName !== false) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px ${Math.round(18 * density)}px`, marginBottom: `${Math.round(8 * density)}px` }}>
          {layout.showVehicleNo !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_vehicleNo"] || "Vehicle No."}</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
          {layout.showDriverName !== false && (
            <div><span style={{ fontSize: `${labelSize}px`, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_driverName"] || "Driver Name"}</span><div style={{ marginTop: "3px" }}><BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} /></div></div>
          )}
        </div>
      )}

      {/* Custom blocks â€” after-header */}
      {form.customBlocks && form.customBlocks.length > 0 && (
        <CustomBlocksRegion blocks={form.customBlocks} position="after-header" accentColor={accent} density={density} />
      )}

      {/* ITEM TABLE + TOTALS (connected) */}
      <div data-sb-section="layout" style={{ flex: 1, display: "flex", flexDirection: "column", marginBottom: `${Math.round(6 * density)}px`, minHeight: 0, cursor: "pointer" }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: activeColumns.map((col) => getColumnWidth(col.id)).join(" "),
            gap: "0",
            backgroundColor: tpl.tableHeaderFill ? accent : "transparent",
            color: tpl.tableHeaderFill ? contrastText(accent) : accent,
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
                  ? `1px solid ${tpl.tableHeaderFill ? (contrastText(accent) === "#ffffff" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)") : `${accent}30`}` : "none",
              }}
            >
              {layout.columnLabels?.[col.id] || col.label}
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
                {""}
              </div>
            ))}
          </div>
        ))}

        {/* TOTALS â€” attached directly to item table */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: formsPerPage >= 3 ? "55%" : "44%", minWidth: "210px" }}>
          {layout.showSubtotal && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${Math.round(5 * density)}px ${tpl.totalsStyle === "boxed" ? `${Math.round(8 * density)}px` : "0"}`, borderBottom: "1px solid #e5e7eb", fontSize: `${clampFont(Math.round(12 * density))}px`, ...(tpl.totalsStyle === "boxed" ? { border: "1px solid #e5e7eb" } : {}) }}>
              <span style={{ fontWeight: 600, color: "#4b5563" }}>{layout.subtotalLabel || "Subtotal"}</span>
              <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: "120px", borderBottom: fieldStyle === "dotted" ? "1px dotted #9ca3af" : "1px solid #d1d5db" }}>
                {getCurrencyLabel(layout) && <span style={{ color: "#b0b5bd", marginRight: "3px", fontSize: `${clampFont(Math.round(11 * density))}px`, flexShrink: 0 }}>{getCurrencyLabel(layout)}</span>}
                <span style={{ flex: 1 }}>&nbsp;</span>
              </span>
            </div>
          )}
          {layout.showDiscount && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${Math.round(5 * density)}px ${tpl.totalsStyle === "boxed" ? `${Math.round(8 * density)}px` : "0"}`, borderBottom: "1px solid #e5e7eb", fontSize: `${clampFont(Math.round(12 * density))}px`, ...(tpl.totalsStyle === "boxed" ? { borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb" } : {}) }}>
              <span style={{ fontWeight: 600, color: "#4b5563" }}>{layout.discountLabel || "Discount"}</span>
              <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: "120px", borderBottom: fieldStyle === "dotted" ? "1px dotted #9ca3af" : "1px solid #d1d5db" }}>
                {getCurrencyLabel(layout) && <span style={{ color: "#b0b5bd", marginRight: "3px", fontSize: `${clampFont(Math.round(11 * density))}px`, flexShrink: 0 }}>{getCurrencyLabel(layout)}</span>}
                <span style={{ flex: 1 }}>&nbsp;</span>
              </span>
            </div>
          )}
          {layout.showTax && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${Math.round(5 * density)}px ${tpl.totalsStyle === "boxed" ? `${Math.round(8 * density)}px` : "0"}`, borderBottom: "1px solid #e5e7eb", fontSize: `${clampFont(Math.round(12 * density))}px`, ...(tpl.totalsStyle === "boxed" ? { borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb" } : {}) }}>
              <span style={{ fontWeight: 600, color: "#4b5563" }}>{layout.taxLabel || "Tax / VAT"}</span>
              <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: "120px", borderBottom: fieldStyle === "dotted" ? "1px dotted #9ca3af" : "1px solid #d1d5db" }}>
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
                backgroundColor: accent, color: contrastText(accent),
              } : {
                backgroundColor: `${accent}10`,
                borderTop: `3px solid ${accent}`, borderBottom: tpl.totalsBorder ? `3px solid ${accent}` : "none",
                color: accent,
              }),
            }}>
              <span style={{ color: tpl.totalsStyle === "badge" ? contrastText(accent) : accent, letterSpacing: "0.5px" }}>{layout.totalLabel || config.amountLabel}</span>
              {tpl.totalsStyle === "badge" ? (
                <span style={{ display: "inline-flex", alignItems: "center", minWidth: "130px", backgroundColor: "#ffffff", borderRadius: "2px", padding: `${Math.round(3 * density)}px ${Math.round(6 * density)}px` }}>
                  {getCurrencyLabel(layout) && <span style={{ color: `${accent}90`, marginRight: "3px", flexShrink: 0, fontWeight: 700 }}>{getCurrencyLabel(layout)}</span>}
                  <span style={{ flex: 1, minHeight: `${Math.round(18 * density)}px` }}>&nbsp;</span>
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "baseline", minWidth: "120px", borderBottom: fieldStyle === "dotted" ? "2px dotted #9ca3af" : "2px solid #d1d5db" }}>
                  {getCurrencyLabel(layout) && <span style={{ color: `${accent}80`, marginRight: "3px", flexShrink: 0 }}>{getCurrencyLabel(layout)}</span>}
                  <span style={{ flex: 1 }}>&nbsp;</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      </div>
      {/* Custom blocks â€” after-items */}
      {form.customBlocks && form.customBlocks.length > 0 && (
        <CustomBlocksRegion blocks={form.customBlocks} position="after-items" accentColor={accent} density={density} />
      )}

      {/* AMOUNT IN WORDS */}
      {layout.showAmountInWords && docType !== "delivery-note" && (
        <div style={{ marginBottom: `${Math.round(10 * density)}px` }}>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["field_amountWords"] || "Amount in Words"}</span>
          <div style={{ marginTop: "4px" }}><BlankField width="100%" height={`${Math.round(30 * density)}px`} fieldStyle={fieldStyle} /></div>
        </div>
      )}

      {/* PAYMENT INFO â€” pre-printed when banking details are provided */}
      {layout.showPaymentInfo && (
        <div style={{ marginBottom: `${Math.round(10 * density)}px` }}>
          <span style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent }}>{layout.columnLabels?.["bank_sectionTitle"] || "Payment Details"}</span>
          {(form.companyBranding.bankName || form.companyBranding.bankAccount) ? (
            <div style={{ marginTop: "4px", fontSize: `${clampFont(Math.round(11 * density))}px`, color: "#374151", lineHeight: 1.6, padding: `${Math.round(6 * density)}px`, border: `1px solid ${accent}20`, borderRadius: "3px", backgroundColor: `${accent}05` }}>
              {form.companyBranding.bankName && (
                <div><span style={{ fontWeight: 600, color: accent }}>{layout.columnLabels?.["bank_bankName"] || "Bank:"}</span> {form.companyBranding.bankName}</div>
              )}
              {form.companyBranding.bankAccountName && (
                <div><span style={{ fontWeight: 600, color: accent }}>{layout.columnLabels?.["bank_accountName"] || "Account Name:"}</span> {form.companyBranding.bankAccountName}</div>
              )}
              {form.companyBranding.bankAccount && (
                <div><span style={{ fontWeight: 600, color: accent }}>{layout.columnLabels?.["bank_accountNo"] || "Account No:"}</span> {form.companyBranding.bankAccount}</div>
              )}
              {form.companyBranding.bankBranch && (
                <div><span style={{ fontWeight: 600, color: accent }}>{layout.columnLabels?.["bank_branch"] || "Branch:"}</span> {form.companyBranding.bankBranch}</div>
              )}
              {form.companyBranding.bankBranchCode && (
                <div><span style={{ fontWeight: 600, color: accent }}>{layout.columnLabels?.["bank_branchCode"] || "Branch Code:"}</span> {form.companyBranding.bankBranchCode}</div>
              )}
              {form.companyBranding.bankSwiftBic && (
                <div><span style={{ fontWeight: 600, color: accent }}>{layout.columnLabels?.["bank_swiftBic"] || "SWIFT/BIC:"}</span> {form.companyBranding.bankSwiftBic}</div>
              )}
              {form.companyBranding.bankIban && (
                <div><span style={{ fontWeight: 600, color: accent }}>{layout.columnLabels?.["bank_iban"] || "IBAN:"}</span> {form.companyBranding.bankIban}</div>
              )}
              {form.companyBranding.bankSortCode && (
                <div><span style={{ fontWeight: 600, color: accent }}>{layout.columnLabels?.["bank_sortCode"] || "Sort/Routing Code:"}</span> {form.companyBranding.bankSortCode}</div>
              )}
              {form.companyBranding.bankReference && (
                <div><span style={{ fontWeight: 600, color: accent }}>{layout.columnLabels?.["bank_reference"] || "Reference:"}</span> {form.companyBranding.bankReference}</div>
              )}
              {form.companyBranding.bankCustomLabel && form.companyBranding.bankCustomValue && (
                <div><span style={{ fontWeight: 600, color: accent }}>{form.companyBranding.bankCustomLabel}:</span> {form.companyBranding.bankCustomValue}</div>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${Math.round(6 * density)}px`, marginTop: "4px" }}>
              <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} label={layout.columnLabels?.["bank_bankName"] || "Bank"} accentColor="#9ca3af" fontSize={Math.round(10 * density)} />
              <BlankField width="100%" height={`${rowHeight}px`} fieldStyle={fieldStyle} label={layout.columnLabels?.["bank_accountNo"] || "Account #"} accentColor="#9ca3af" fontSize={Math.round(10 * density)} />
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

      {/* Custom blocks â€” before-signature */}
      {form.customBlocks && form.customBlocks.length > 0 && (
        <CustomBlocksRegion blocks={form.customBlocks} position="before-signature" accentColor={accent} density={density} />
      )}

      {/* SIGNATURE */}
      {layout.showSignature && (
        <div data-sb-section="layout" style={{ display: "flex", justifyContent: "space-between", marginTop: "auto", paddingTop: `${Math.round(14 * density)}px`, cursor: "pointer" }}>
          {docType === "delivery-note" ? (
            <>
              <div>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>{layout.columnLabels?.["sig_left"] || "Delivered By"}</div>
                <div style={{ width: `${Math.round(155 * density)}px`, borderBottom: `2px solid ${accent}50`, height: `${Math.round(28 * density)}px` }}>&nbsp;</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>{layout.columnLabels?.["field_goodsCondition"] || "Goods Condition"}</div>
                <div style={{ display: "flex", gap: `${Math.round(12 * density)}px`, justifyContent: "center" }}>
                  <BlankCheckbox label={layout.columnLabels?.["field_goodLabel"] || "Good"} size={Math.round(14 * density)} fontSize={Math.round(11 * density)} />
                  <BlankCheckbox label={layout.columnLabels?.["field_damagedLabel"] || "Damaged"} size={Math.round(14 * density)} fontSize={Math.round(11 * density)} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>{layout.columnLabels?.["sig_right"] || "Received By"}</div>
                <div style={{ width: `${Math.round(155 * density)}px`, borderBottom: `2px solid ${accent}50`, height: `${Math.round(28 * density)}px` }}>&nbsp;</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>{layout.columnLabels?.["sig_left"] || (docType === "purchase-order" ? "Authorized By" : "Prepared By")}</div>
                <div style={{ width: `${Math.round(155 * density)}px`, borderBottom: `2px solid ${accent}50`, height: `${Math.round(28 * density)}px` }}>&nbsp;</div>
              </div>
              <div>
                <div style={{ fontSize: `${labelSize}px`, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: accent, marginBottom: "6px" }}>{layout.columnLabels?.["sig_right"] || (docType === "purchase-order" ? "Approved By" : "Customer Signature")}</div>
                <div style={{ width: `${Math.round(155 * density)}px`, borderBottom: `2px solid ${accent}50`, height: `${Math.round(28 * density)}px` }}>&nbsp;</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* FOOTER BAR */}
      <FooterBar tpl={tpl} density={density} branding={form.companyBranding} bleedL={padL} bleedR={padR} bleedB={padV} />

      {/* BRAND LOGOS */}
      {form.brandLogos.enabled && form.brandLogos.logos.length > 0 && form.brandLogos.position === "bottom" && (
        <div data-sb-section="logos" style={{ display: "flex", gap: `${Math.round(10 * density)}px`, justifyContent: "center", alignItems: "center", paddingTop: `${Math.round(8 * density)}px`, borderTop: "1px solid #e5e7eb", marginTop: `${Math.round(6 * density)}px`, cursor: "pointer" }}>
          {form.brandLogos.logos.map((logo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={logo.url} alt={logo.name} style={{ height: `${Math.round(20 * density)}px`, objectFit: "contain", opacity: 0.7 }} />
          ))}
        </div>
      )}

      {/* Custom blocks â€” after-footer */}
      {form.customBlocks && form.customBlocks.length > 0 && (
        <CustomBlocksRegion blocks={form.customBlocks} position="after-footer" accentColor={accent} density={density} />
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
// Single Page â€” contains N forms
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
