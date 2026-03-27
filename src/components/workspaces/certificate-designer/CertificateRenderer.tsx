// =============================================================================
// DMSuite — Certificate Designer Renderer
// Pure HTML/CSS renderer with 8 high-fidelity templates matching reference SVGs.
// Each template has unique decorative borders, backgrounds, and typography.
// Optimized for print at 300 DPI. Fully editable — all text from form data.
// =============================================================================

"use client";

import { useEffect, useMemo } from "react";
import type {
  CertificateFormData,
  CertificateTemplate,
  SealStyle,
  PageOrientation,
} from "@/stores/certificate-editor";
import { CERTIFICATE_FONT_PAIRINGS } from "@/stores/certificate-editor";
import { scaledFontSize } from "@/stores/advanced-helpers";

// ━━━ Page Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PAGE_PX: Record<string, { w: number; h: number }> = {
  a4: { w: 1123, h: 794 },         // A4 landscape
  letter: { w: 1056, h: 816 },     // Letter landscape
  a5: { w: 794, h: 559 },          // A5 landscape
  "a4-portrait": { w: 794, h: 1123 },
  "letter-portrait": { w: 816, h: 1056 },
  "a5-portrait": { w: 559, h: 794 },
};

export const PAGE_GAP = 16;

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getGoogleFontUrl(fontPairingId: string): string | null {
  const pair = CERTIFICATE_FONT_PAIRINGS[fontPairingId];
  if (!pair) return null;
  return `https://fonts.googleapis.com/css2?family=${pair.google}&display=swap`;
}

function getFontFamily(fontPairingId: string, role: "heading" | "body"): string {
  const pair = CERTIFICATE_FONT_PAIRINGS[fontPairingId];
  if (!pair) return role === "heading" ? "Playfair Display, serif" : "Lato, sans-serif";
  return role === "heading" ? `"${pair.heading}", serif` : `"${pair.body}", sans-serif`;
}

function getPageKey(pageSize: string, orientation: PageOrientation): string {
  if (orientation === "portrait") return `${pageSize}-portrait`;
  return pageSize;
}

/** Darken/lighten hex color */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return dateStr;
  }
}

// ━━━ Background Patterns ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getBgCSS(template: CertificateTemplate, accent: string): React.CSSProperties {
  switch (template) {
    case "classic-blue":
      return {
        background: `repeating-linear-gradient(-45deg, #f5f5f5, #f5f5f5 2px, #eeeeee 2px, #eeeeee 4px)`,
      };
    case "burgundy-ornate":
      return { background: "#ffffff" };
    case "antique-parchment":
      return { background: `linear-gradient(180deg, #d8cdb8 0%, #cec3ab 50%, #d8cdb8 100%)` };
    case "golden-appreciation":
      return {
        background: `radial-gradient(circle at 50% 50%, rgba(184,134,11,0.04) 0%, transparent 70%), #faf6ef`,
      };
    case "silver-weave":
      return {
        background: `repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(0,0,0,0.02) 8px, rgba(0,0,0,0.02) 9px), #ffffff`,
      };
    case "vintage-warm":
      return {
        background: `repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(93,58,26,0.04) 5px, rgba(93,58,26,0.04) 6px), linear-gradient(180deg, #f5ead0 0%, #efe2c4 100%)`,
      };
    case "teal-regal":
      return { background: "#ffffff" };
    case "botanical-modern":
      return { background: "#ffffff" };
    default:
      return { background: "#ffffff" };
  }
}

// ━━━ Seal Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CertificateSeal({ text, style, accent, size = 90 }: { text: string; style: SealStyle; accent: string; size?: number }) {
  if (style === "none") return null;

  const sealColors: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
    gold: { bg: "linear-gradient(135deg, #d4a843 0%, #b8860b 50%, #d4a843 100%)", border: "#92710a", text: "#ffffff", shadow: "0 2px 8px rgba(184, 134, 11, 0.3)" },
    silver: { bg: "linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #c0c0c0 100%)", border: "#606060", text: "#ffffff", shadow: "0 2px 8px rgba(128, 128, 128, 0.3)" },
    embossed: { bg: `linear-gradient(135deg, ${hexToRgba(accent, 0.15)} 0%, ${hexToRgba(accent, 0.08)} 100%)`, border: accent, text: accent, shadow: `inset 0 1px 2px ${hexToRgba(accent, 0.2)}` },
    stamp: { bg: "transparent", border: "#c0392b", text: "#c0392b", shadow: "none" },
  };

  const c = sealColors[style] || sealColors.gold;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: c.bg,
        border: `2px solid ${c.border}`,
        boxShadow: c.shadow,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Outer ring for stamp style */}
      {style === "stamp" && (
        <div
          style={{
            position: "absolute",
            inset: 3,
            borderRadius: "50%",
            border: `1.5px solid ${c.border}`,
          }}
        />
      )}
      {/* Inner ring */}
      <div
        style={{
          position: "absolute",
          inset: style === "stamp" ? 7 : 5,
          borderRadius: "50%",
          border: `1px solid ${style === "stamp" ? c.border : hexToRgba("#ffffff", 0.4)}`,
        }}
      />
      {/* Text */}
      <span
        style={{
          fontSize: Math.max(8, size * 0.12),
          fontWeight: 700,
          color: c.text,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          textAlign: "center",
          lineHeight: 1.2,
          padding: "0 8px",
          zIndex: 1,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ━━━ SVG Decorative Elements ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Ornate corner flourish – mirrored for all 4 corners */
function CornerFlourish({ color, size = 90, position }: {
  color: string;
  size?: number;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const transforms: Record<string, string> = {
    "top-left": "none",
    "top-right": "scaleX(-1)",
    "bottom-left": "scaleY(-1)",
    "bottom-right": "scale(-1)",
  };
  const positions: Record<string, React.CSSProperties> = {
    "top-left": { top: 0, left: 0 },
    "top-right": { top: 0, right: 0 },
    "bottom-left": { bottom: 0, left: 0 },
    "bottom-right": { bottom: 0, right: 0 },
  };

  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ position: "absolute", ...positions[position], transform: transforms[position], pointerEvents: "none" }}
    >
      {/* Main swirl */}
      <path d="M5,5 C5,5 15,5 20,10 C25,15 20,25 15,20 C10,15 25,10 30,15 C35,20 25,30 20,25" stroke={color} strokeWidth="2" fill="none" />
      <path d="M5,5 C5,25 25,25 25,5" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Leaf/petal shapes */}
      <path d="M30,8 C35,3 45,5 40,12 C35,19 28,12 30,8Z" fill={color} opacity="0.7" />
      <path d="M8,30 C3,35 5,45 12,40 C19,35 12,28 8,30Z" fill={color} opacity="0.7" />
      {/* Spiral detail */}
      <path d="M15,15 C20,10 30,12 28,20 C26,28 18,25 20,18 C22,14 26,16 24,20" stroke={color} strokeWidth="1.2" fill="none" opacity="0.5" />
      {/* Dot accents */}
      <circle cx="38" cy="5" r="2" fill={color} opacity="0.5" />
      <circle cx="5" cy="38" r="2" fill={color} opacity="0.5" />
      <circle cx="45" cy="12" r="1.5" fill={color} opacity="0.4" />
      <circle cx="12" cy="45" r="1.5" fill={color} opacity="0.4" />
    </svg>
  );
}

/** Heavy scrollwork corner for teal-regal template */
function ScrollworkCorner({ color, size = 100, position }: {
  color: string;
  size?: number;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const transforms: Record<string, string> = {
    "top-left": "none",
    "top-right": "scaleX(-1)",
    "bottom-left": "scaleY(-1)",
    "bottom-right": "scale(-1)",
  };
  const positions: Record<string, React.CSSProperties> = {
    "top-left": { top: 12, left: 12 },
    "top-right": { top: 12, right: 12 },
    "bottom-left": { bottom: 12, left: 12 },
    "bottom-right": { bottom: 12, right: 12 },
  };

  return (
    <svg
      width={size} height={size} viewBox="0 0 120 120" fill="none"
      style={{ position: "absolute", ...positions[position], transform: transforms[position], pointerEvents: "none" }}
    >
      {/* Main bold scrollwork */}
      <path d="M0,0 C0,40 30,50 50,40 C70,30 40,60 60,60 C80,60 60,30 80,20 C100,10 100,0 120,0" stroke={color} strokeWidth="3" fill="none" />
      <path d="M0,0 C10,30 40,40 45,25 C50,10 30,5 20,15 C10,25 25,35 35,28" stroke={color} strokeWidth="2.5" fill="none" />
      <path d="M0,0 C0,15 10,25 25,20 C40,15 30,0 15,5" stroke={color} strokeWidth="2" fill="none" opacity="0.7" />
      {/* Fill shapes: leaves and petals */}
      <path d="M20,5 C30,0 40,5 35,15 C30,25 15,15 20,5Z" fill={color} opacity="0.5" />
      <path d="M5,20 C0,30 5,40 15,35 C25,30 15,15 5,20Z" fill={color} opacity="0.5" />
      <path d="M50,15 C55,8 65,10 62,18 C59,26 45,22 50,15Z" fill={color} opacity="0.4" />
      <path d="M15,50 C8,55 10,65 18,62 C26,59 22,45 15,50Z" fill={color} opacity="0.4" />
      {/* Crown / fleur-de-lis hint */}
      <path d="M3,3 L3,12 L7,8 L12,12 L12,3Z" fill={color} opacity="0.6" />
    </svg>
  );
}

/** Elegant ornamental side border piece */
function SideOrnament({ color, height, position }: {
  color: string;
  height: number;
  position: "left" | "right";
}) {
  const posStyle: React.CSSProperties = position === "left"
    ? { position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }
    : { position: "absolute", right: 18, top: "50%", transform: "translateY(-50%) scaleX(-1)" };

  return (
    <svg width="20" height={Math.min(height * 0.4, 200)} viewBox="0 0 20 200" style={{ ...posStyle, pointerEvents: "none" }}>
      {/* Vertical vine with curls */}
      <line x1="10" y1="0" x2="10" y2="200" stroke={color} strokeWidth="1" opacity="0.3" />
      <path d="M10,30 C20,25 20,15 10,20" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M10,60 C0,55 0,45 10,50" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M10,100 C20,95 20,85 10,90" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M10,140 C0,135 0,125 10,130" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M10,170 C20,165 20,155 10,160" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
    </svg>
  );
}

/** Ribbon banner shape for title */
function RibbonBanner({ text, color, textColor = "#ffffff", width = 340, height = 55, headingFont }: {
  text: string;
  color: string;
  textColor?: string;
  width?: number;
  height?: number;
  headingFont: string;
}) {
  const foldW = 20;
  const foldH = 14;
  return (
    <div style={{ position: "relative", width: width + foldW * 2, height: height + foldH, display: "flex", justifyContent: "center" }}>
      {/* Left fold */}
      <div style={{
        position: "absolute", left: 0, top: foldH, width: 0, height: 0,
        borderTop: `${height / 2}px solid ${adjustColor(color, -40)}`,
        borderBottom: `${height / 2}px solid ${adjustColor(color, -40)}`,
        borderLeft: `${foldW}px solid transparent`,
      }} />
      {/* Right fold */}
      <div style={{
        position: "absolute", right: 0, top: foldH, width: 0, height: 0,
        borderTop: `${height / 2}px solid ${adjustColor(color, -40)}`,
        borderBottom: `${height / 2}px solid ${adjustColor(color, -40)}`,
        borderRight: `${foldW}px solid transparent`,
      }} />
      {/* Main ribbon */}
      <div style={{
        position: "absolute", left: foldW, top: 0, width, height,
        background: `linear-gradient(180deg, ${adjustColor(color, 15)} 0%, ${color} 50%, ${adjustColor(color, -15)} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 3px 8px ${hexToRgba(color, 0.3)}`,
      }}>
        <span style={{
          fontSize: 26,
          fontWeight: 700,
          color: textColor,
          fontFamily: headingFont,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}>
          {text}
        </span>
      </div>
      {/* Shadow folds */}
      <div style={{
        position: "absolute", left: foldW, top: height, width: 0, height: 0,
        borderTop: `${foldH}px solid ${adjustColor(color, -60)}`,
        borderLeft: `${foldW / 2}px solid transparent`,
      }} />
      <div style={{
        position: "absolute", right: foldW, top: height, width: 0, height: 0,
        borderTop: `${foldH}px solid ${adjustColor(color, -60)}`,
        borderRight: `${foldW / 2}px solid transparent`,
      }} />
    </div>
  );
}

/** Gold/Silver medal ribbon */
function MedalRibbon({ color, size = 70 }: { color: string; size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size + 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Ribbon tails */}
      <div style={{ position: "absolute", bottom: 0, left: size * 0.15, width: size * 0.25, height: size * 0.4, background: `linear-gradient(180deg, ${color}, ${adjustColor(color, -30)})`, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)" }} />
      <div style={{ position: "absolute", bottom: 0, right: size * 0.15, width: size * 0.25, height: size * 0.4, background: `linear-gradient(180deg, ${color}, ${adjustColor(color, -30)})`, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)" }} />
      {/* Medal circle */}
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${adjustColor(color, 50)} 0%, ${color} 50%, ${adjustColor(color, -40)} 100%)`,
        border: `3px solid ${adjustColor(color, -30)}`,
        boxShadow: `0 3px 10px ${hexToRgba(color, 0.4)}, inset 0 1px 3px ${hexToRgba("#ffffff", 0.3)}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          width: size * 0.7, height: size * 0.7, borderRadius: "50%",
          border: `1.5px solid ${hexToRgba("#ffffff", 0.4)}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
        }}>
          <span style={{ fontSize: size * 0.14, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: 1.2 }}>BEST</span>
          <span style={{ fontSize: size * 0.18, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1.2 }}>AWARD</span>
        </div>
      </div>
    </div>
  );
}

/** Decorative line divider with diamond */
function OrnamentDivider({ accent, width = 200 }: { accent: string; width?: number }) {
  return (
    <svg width={width} height="12" viewBox={`0 0 ${width} 12`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="6" x2={width * 0.35} y2="6" stroke={accent} strokeWidth="1" opacity="0.4" />
      <circle cx={width * 0.38} cy="6" r="2" fill={accent} opacity="0.5" />
      <path d={`M${width * 0.42},6 L${width * 0.5},2 L${width * 0.58},6 L${width * 0.5},10 Z`} fill={accent} opacity="0.3" />
      <circle cx={width * 0.62} cy="6" r="2" fill={accent} opacity="0.5" />
      <line x1={width * 0.65} y1="6" x2={width} y2="6" stroke={accent} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/** Scroll divider with curls */
function ScrollDivider({ color, width = 200 }: { color: string; width?: number }) {
  return (
    <svg width={width} height="16" viewBox={`0 0 ${width} 16`} fill="none">
      <line x1={width * 0.1} y1="8" x2={width * 0.9} y2="8" stroke={color} strokeWidth="1" opacity="0.4" />
      {/* Left curl */}
      <path d={`M${width * 0.12},8 C${width * 0.08},8 ${width * 0.08},2 ${width * 0.14},2 C${width * 0.18},2 ${width * 0.18},8 ${width * 0.14},8`} stroke={color} strokeWidth="1.2" fill="none" opacity="0.6" />
      <circle cx={width * 0.06} cy="8" r="2.5" fill={color} opacity="0.3" />
      {/* Diamond center */}
      <path d={`M${width * 0.47},8 L${width * 0.5},3 L${width * 0.53},8 L${width * 0.5},13 Z`} fill={color} opacity="0.35" />
      {/* Right curl */}
      <path d={`M${width * 0.88},8 C${width * 0.92},8 ${width * 0.92},2 ${width * 0.86},2 C${width * 0.82},2 ${width * 0.82},8 ${width * 0.86},8`} stroke={color} strokeWidth="1.2" fill="none" opacity="0.6" />
      <circle cx={width * 0.94} cy="8" r="2.5" fill={color} opacity="0.3" />
    </svg>
  );
}

/** Dotted line separator */
function DottedSeparator({ color, width = 300 }: { color: string; width?: number }) {
  return (
    <div style={{ width, borderBottom: `3px dotted ${hexToRgba(color, 0.4)}`, margin: "2px 0" }} />
  );
}

/** Fleur-de-lis / Crown top center decoration */
function CrownMotif({ color, width = 60 }: { color: string; width?: number }) {
  return (
    <svg width={width} height={width * 0.8} viewBox="0 0 60 48" fill="none" style={{ pointerEvents: "none" }}>
      <path d="M30,2 C30,2 20,15 15,18 C10,21 8,16 8,12 C8,8 12,6 14,10 C16,14 10,20 6,16" stroke={color} strokeWidth="2" fill="none" />
      <path d="M30,2 C30,2 40,15 45,18 C50,21 52,16 52,12 C52,8 48,6 46,10 C44,14 50,20 54,16" stroke={color} strokeWidth="2" fill="none" />
      <path d="M30,2 L30,22" stroke={color} strokeWidth="2" />
      <path d="M22,24 L38,24 L36,28 L24,28 Z" fill={color} opacity="0.6" />
      <circle cx="30" cy="6" r="3" fill={color} opacity="0.5" />
    </svg>
  );
}

// ━━━ Template-Specific Border Layers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function TemplateBorderLayer({ template, accent, w, h }: {
  template: CertificateTemplate; accent: string; w: number; h: number;
}) {
  switch (template) {
    // ── Template 1: Classic Blue ──────────────────────────────────────────
    case "classic-blue":
      return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Outer border */}
          <div style={{ position: "absolute", inset: 30, border: `2.5px solid ${accent}` }} />
          {/* Inner border */}
          <div style={{ position: "absolute", inset: 38, border: `1px solid ${hexToRgba(accent, 0.5)}` }} />
        </div>
      );

    // ── Template 2: Burgundy Ornate ────────────────────────────────────────
    case "burgundy-ornate":
      return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Corner flourishes */}
          <CornerFlourish color={accent} size={100} position="top-left" />
          <CornerFlourish color={accent} size={100} position="top-right" />
          <CornerFlourish color={accent} size={100} position="bottom-left" />
          <CornerFlourish color={accent} size={100} position="bottom-right" />
          {/* Side ornaments */}
          <SideOrnament color={accent} height={h} position="left" />
          <SideOrnament color={accent} height={h} position="right" />
        </div>
      );

    // ── Template 3: Antique Parchment ──────────────────────────────────────
    case "antique-parchment":
      return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Outer thick border */}
          <div style={{ position: "absolute", inset: 20, border: `2px solid ${accent}` }} />
          {/* Inner thin border */}
          <div style={{ position: "absolute", inset: 28, border: `1px solid ${hexToRgba(accent, 0.4)}` }} />
          {/* Decorative top/bottom double rules */}
          <div style={{ position: "absolute", top: 36, left: 80, right: 80, height: 1, borderTop: `2px double ${accent}`, opacity: 0.3 }} />
          <div style={{ position: "absolute", bottom: 36, left: 80, right: 80, height: 1, borderTop: `2px double ${accent}`, opacity: 0.3 }} />
          {/* Corner flourishes */}
          <CornerFlourish color={accent} size={80} position="top-left" />
          <CornerFlourish color={accent} size={80} position="top-right" />
          <CornerFlourish color={accent} size={80} position="bottom-left" />
          <CornerFlourish color={accent} size={80} position="bottom-right" />
        </div>
      );

    // ── Template 4: Golden Appreciation ────────────────────────────────────
    case "golden-appreciation":
      return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Outer gold border */}
          <div style={{ position: "absolute", inset: 24, border: `3px solid ${accent}`, boxShadow: `inset 0 0 0 6px ${hexToRgba(accent, 0.06)}` }} />
          {/* Inner thin gold border */}
          <div style={{ position: "absolute", inset: 36, border: `1px solid ${hexToRgba(accent, 0.4)}` }} />
          {/* Corner L-shapes (geometric) */}
          {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((pos) => {
            const style: React.CSSProperties = pos === "top-left" ? { top: 28, left: 28 }
              : pos === "top-right" ? { top: 28, right: 28, transform: "scaleX(-1)" }
              : pos === "bottom-left" ? { bottom: 28, left: 28, transform: "scaleY(-1)" }
              : { bottom: 28, right: 28, transform: "scale(-1)" };
            return (
              <div key={pos} style={{ position: "absolute", width: 40, height: 40, ...style }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 40, height: 3, background: accent }} />
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: 40, background: accent }} />
                <div style={{ position: "absolute", top: 8, left: 8, width: 24, height: 2, background: accent, opacity: 0.5 }} />
                <div style={{ position: "absolute", top: 8, left: 8, width: 2, height: 24, background: accent, opacity: 0.5 }} />
              </div>
            );
          })}
          {/* Honeycomb pattern overlay */}
          <div style={{
            position: "absolute", inset: 40,
            backgroundImage: `radial-gradient(circle, ${hexToRgba(accent, 0.04)} 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }} />
        </div>
      );

    // ── Template 5: Silver Weave ────────────────────────────────────────────
    case "silver-weave":
      return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Outer solid border */}
          <div style={{ position: "absolute", inset: 22, border: `2px solid ${accent}` }} />
          {/* Woven chain pattern border (CSS approximation) */}
          <div style={{
            position: "absolute", inset: 26,
            border: `8px solid transparent`,
            backgroundImage: `repeating-linear-gradient(0deg, ${accent} 0px, ${accent} 4px, transparent 4px, transparent 8px),
              repeating-linear-gradient(90deg, ${accent} 0px, ${accent} 4px, transparent 4px, transparent 8px)`,
            backgroundSize: "8px 8px",
            backgroundClip: "padding-box",
            opacity: 0.15,
          }} />
          {/* Inner solid border */}
          <div style={{ position: "absolute", inset: 40, border: `1px solid ${hexToRgba(accent, 0.3)}` }} />
          {/* Logo circle placeholder top center */}
          <div style={{
            position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)",
            width: 50, height: 50, borderRadius: "50%",
            border: `2px solid ${accent}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(135deg, ${hexToRgba(accent, 0.05)}, transparent)`,
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em" }}>LOGO</span>
          </div>
        </div>
      );

    // ── Template 6: Vintage Warm ────────────────────────────────────────────
    case "vintage-warm":
      return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Outer warm border */}
          <div style={{ position: "absolute", inset: 16, border: `1px solid ${hexToRgba(accent, 0.3)}` }} />
          {/* Inner ornate border */}
          <div style={{ position: "absolute", inset: 28, border: `2px solid ${accent}`, boxShadow: `inset 0 0 0 4px ${hexToRgba(accent, 0.06)}` }} />
          {/* Decorative top & bottom bars */}
          {(["top", "bottom"] as const).map((pos) => (
            <div key={pos} style={{ position: "absolute", [pos]: 34, left: 80, right: 80 }}>
              <svg width="100%" height="12" viewBox="0 0 800 12" preserveAspectRatio="none">
                <line x1="0" y1="6" x2="800" y2="6" stroke={accent} strokeWidth="0.5" opacity="0.3" />
                <line x1="0" y1="3" x2="800" y2="3" stroke={accent} strokeWidth="0.5" opacity="0.15" />
                <line x1="0" y1="9" x2="800" y2="9" stroke={accent} strokeWidth="0.5" opacity="0.15" />
              </svg>
            </div>
          ))}
          {/* Corner flourishes */}
          <CornerFlourish color={accent} size={95} position="top-left" />
          <CornerFlourish color={accent} size={95} position="top-right" />
          <CornerFlourish color={accent} size={95} position="bottom-left" />
          <CornerFlourish color={accent} size={95} position="bottom-right" />
        </div>
      );

    // ── Template 7: Teal Regal ──────────────────────────────────────────────
    case "teal-regal":
      return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Outer teal background band */}
          <div style={{ position: "absolute", inset: 0, background: accent, opacity: 0.08 }} />
          {/* White inner area */}
          <div style={{ position: "absolute", inset: 30, background: "#ffffff" }} />
          {/* Ornate teal outer border */}
          <div style={{ position: "absolute", inset: 30, border: `3px solid ${accent}`, boxShadow: `0 0 0 4px ${hexToRgba(accent, 0.15)}` }} />
          {/* Dashed inner border */}
          <div style={{ position: "absolute", inset: 42, border: `1.5px dashed ${hexToRgba(accent, 0.4)}` }} />
          {/* Scrollwork corners */}
          <ScrollworkCorner color={accent} size={110} position="top-left" />
          <ScrollworkCorner color={accent} size={110} position="top-right" />
          <ScrollworkCorner color={accent} size={110} position="bottom-left" />
          <ScrollworkCorner color={accent} size={110} position="bottom-right" />
          {/* Crown top center */}
          <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)" }}>
            <CrownMotif color={accent} width={50} />
          </div>
          {/* Bottom dashed ornament line */}
          <div style={{ position: "absolute", bottom: 24, left: 60, right: 60, borderBottom: `1.5px dashed ${hexToRgba(accent, 0.25)}` }} />
        </div>
      );

    // ── Template 8: Botanical Modern ───────────────────────────────────────
    case "botanical-modern":
      return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          {/* Left botanical panel */}
          <div style={{
            position: "absolute", top: 0, left: 0, bottom: 0, width: w * 0.38,
            background: `linear-gradient(135deg, ${accent} 0%, ${adjustColor(accent, 20)} 100%)`,
            overflow: "hidden",
          }}>
            {/* Botanical SVG pattern overlay */}
            <svg width="100%" height="100%" viewBox="0 0 400 600" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
              {/* Large leaf shapes */}
              <path d="M200,0 C250,80 300,120 350,100 C400,80 380,180 320,200 C260,220 200,160 200,100Z" fill="#ffffff" />
              <path d="M0,100 C80,60 120,100 100,180 C80,260 160,300 180,240 C200,180 120,120 60,140Z" fill="#ffffff" />
              <path d="M100,300 C150,260 220,280 200,360 C180,440 260,480 300,420 C340,360 280,280 200,300Z" fill="#ffffff" />
              <path d="M0,400 C60,360 120,380 100,460 C80,540 160,570 200,520 C240,470 180,400 120,420Z" fill="#ffffff" />
              {/* Flower shapes */}
              <circle cx="80" cy="200" r="20" fill="#ffffff" opacity="0.3" />
              <circle cx="160" cy="440" r="15" fill="#ffffff" opacity="0.3" />
              <circle cx="280" cy="320" r="18" fill="#ffffff" opacity="0.3" />
              {/* Stems */}
              <path d="M200,0 C200,200 100,300 0,400" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.2" />
              <path d="M300,0 C280,150 200,250 100,350" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.15" />
              {/* Small leaves */}
              <path d="M120,80 C140,60 160,70 150,90 C140,110 110,100 120,80Z" fill="#ffffff" opacity="0.25" />
              <path d="M60,320 C80,300 100,310 90,330 C80,350 50,340 60,320Z" fill="#ffffff" opacity="0.25" />
              <path d="M250,500 C270,480 290,490 280,510 C270,530 240,520 250,500Z" fill="#ffffff" opacity="0.25" />
            </svg>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ━━━ Signature Block ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SignatureBlock({ name, title, organization, accent, bodyFont }: {
  name: string;
  title: string;
  organization: string;
  accent: string;
  bodyFont: string;
}) {
  return (
    <div style={{ textAlign: "center", minWidth: 160, maxWidth: 220 }}>
      {/* Signature line */}
      <div
        style={{
          width: "100%",
          borderBottom: `1.5px solid ${hexToRgba("#333333", 0.4)}`,
          marginBottom: 6,
          height: 40,
        }}
      />
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", fontFamily: bodyFont, lineHeight: 1.4 }}>
        {name || "_______________"}
      </div>
      {title && (
        <div style={{ fontSize: 10, color: "#666666", fontFamily: bodyFont, lineHeight: 1.4, marginTop: 2 }}>
          {title}
        </div>
      )}
      {organization && (
        <div style={{ fontSize: 9, color: "#888888", fontFamily: bodyFont, lineHeight: 1.4, marginTop: 1 }}>
          {organization}
        </div>
      )}
    </div>
  );
}

// ━━━ Props ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CertificateRendererProps {
  data: CertificateFormData;
  onPageCount?: (count: number) => void;
  pageGap?: number;
}

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CertificateRenderer({ data, onPageCount, pageGap = PAGE_GAP }: CertificateRendererProps) {
  const pageKey = getPageKey(data.format.pageSize, data.format.orientation);
  const pageDims = PAGE_PX[pageKey] || PAGE_PX.a4;
  const accent = data.style.accentColor;
  const headingFont = getFontFamily(data.style.fontPairing, "heading");
  const bodyFont = getFontFamily(data.style.fontPairing, "body");
  const fontUrl = getGoogleFontUrl(data.style.fontPairing);
  const template = data.style.template;

  const marginMap = { narrow: 40, standard: 60, wide: 80 };
  const margin = marginMap[data.format.margins] || 60;
  const isLandscape = data.format.orientation === "landscape";

  // Template 8 (botanical-modern) has an asymmetric layout
  const isBotanical = template === "botanical-modern";
  const leftPanelW = isBotanical ? Math.round(pageDims.w * 0.38) : 0;
  const contentLeft = isBotanical ? leftPanelW + 20 : margin;
  const contentW = isBotanical ? pageDims.w - leftPanelW - 20 - margin : pageDims.w - margin * 2;
  const contentH = pageDims.h - margin * 2;

  // Font sizes
  const scale = data.style.fontScale;
  const titleSize = scaledFontSize(isLandscape ? 36 : 32, "heading") * scale;
  const subtitleSize = scaledFontSize(isLandscape ? 14 : 13, "body") * scale;
  const nameSize = scaledFontSize(isLandscape ? 32 : 28, "heading") * scale;
  const descSize = scaledFontSize(isLandscape ? 13 : 12, "body") * scale;
  const orgSize = scaledFontSize(isLandscape ? 16 : 14, "heading") * scale;

  // Template-specific typography overrides
  const titleColor = template === "teal-regal" ? accent : "#1a1a1a";
  const nameColor = (() => {
    switch (template) {
      case "teal-regal": return "#c0392b"; // Red/coral italic like the SVG
      case "classic-blue":
      case "burgundy-ornate":
      case "antique-parchment":
      case "vintage-warm": return "#1a1a1a";
      default: return accent;
    }
  })();
  const nameStyle: React.CSSProperties = (
    template === "teal-regal" || template === "burgundy-ornate" || template === "classic-blue" ||
    template === "golden-appreciation" || template === "silver-weave" || template === "vintage-warm" ||
    template === "botanical-modern"
  ) ? { fontStyle: "italic" } : {};

  // Whether to show a ribbon banner instead of plain title
  const useRibbon = template === "burgundy-ornate" || template === "vintage-warm";
  // Whether to show medal
  const showMedal = template === "golden-appreciation" || template === "teal-regal";
  // Whether to show dotted separator under name
  const useDotSeparator = template === "burgundy-ornate";
  // Use scroll divider
  const useScrollDivider = template === "burgundy-ornate" || template === "vintage-warm";

  useEffect(() => { onPageCount?.(1); }, [onPageCount]);

  const bgStyle = useMemo(() => getBgCSS(template, accent), [template, accent]);

  // Subtitle text logic
  const subtitleText = data.subtitle || (template === "burgundy-ornate" || template === "teal-regal"
    ? "This certificate is proudly presented to"
    : "This certificate is presented to");

  // Certificate type label (e.g., "OF ACHIEVEMENT")
  const typeLabel = data.title
    ? data.title.replace(/^certificate\s*/i, "").trim()
    : "of Achievement";

  return (
    <>
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      <div className="flex flex-col items-center" style={{ gap: pageGap }}>
        <div
          data-cert-page={1}
          className="shadow-2xl shadow-black/20"
          style={{
            width: pageDims.w,
            height: pageDims.h,
            ...bgStyle,
            position: "relative",
            overflow: "hidden",
            fontFamily: bodyFont,
          }}
        >
          {/* ── Template Border & Decoration Layer ── */}
          <TemplateBorderLayer template={template} accent={accent} w={pageDims.w} h={pageDims.h} />

          {/* ── Content Area ── */}
          <div
            style={{
              position: "absolute",
              top: margin,
              left: contentLeft,
              width: contentW,
              height: contentH,
              display: "flex",
              flexDirection: "column",
              alignItems: data.style.headerStyle === "left-aligned" || isBotanical ? "flex-start" : "center",
              justifyContent: "center",
              textAlign: data.style.headerStyle === "left-aligned" || isBotanical ? "left" : "center",
              gap: isLandscape ? 10 : 8,
            }}
          >
            {/* ── Medal (top-right for golden/teal) ── */}
            {showMedal && (
              <div style={{ position: "absolute", top: -10, right: template === "teal-regal" ? "50%" : 0, transform: template === "teal-regal" ? "translateX(50%)" : "none" }}>
                <MedalRibbon color={template === "teal-regal" ? "#b8860b" : accent} size={isLandscape ? 70 : 60} />
              </div>
            )}

            {/* ── Badge seal for botanical-modern ── */}
            {template === "botanical-modern" && (
              <div style={{ position: "absolute", top: -10, right: 0 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  border: `2px solid ${accent}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `linear-gradient(135deg, ${hexToRgba(accent, 0.05)}, transparent)`,
                }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", border: `1px solid ${hexToRgba(accent, 0.3)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 6, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", lineHeight: 1.2 }}>
                      Certificate<br />of<br />Appreciation
                    </span>
                  </div>
                </div>
                {/* Ribbon tails */}
                <div style={{ position: "absolute", bottom: -12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2 }}>
                  <div style={{ width: 14, height: 18, background: accent, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)" }} />
                  <div style={{ width: 14, height: 18, background: accent, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)" }} />
                </div>
              </div>
            )}

            {/* ── Organization Name ── */}
            {data.organizationName && (
              <div data-cert-section="organization">
                <div style={{
                  fontSize: orgSize, fontWeight: 700, color: accent,
                  fontFamily: headingFont, letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: 1.3,
                }}>
                  {data.organizationName}
                </div>
                {data.organizationSubtitle && (
                  <div style={{ fontSize: subtitleSize * 0.85, color: "#666666", fontFamily: bodyFont, letterSpacing: "0.04em", marginTop: 2 }}>
                    {data.organizationSubtitle}
                  </div>
                )}
              </div>
            )}

            {/* ── Top Divider ── */}
            {!useRibbon && !isBotanical && (
              useScrollDivider
                ? <ScrollDivider color={accent} width={Math.min(contentW * 0.5, 250)} />
                : <OrnamentDivider accent={accent} width={Math.min(contentW * 0.5, 250)} />
            )}

            {/* ── Certificate Title ── */}
            <div data-cert-section="title" style={{ marginTop: 4, marginBottom: 4 }}>
              {useRibbon ? (
                <RibbonBanner
                  text="CERTIFICATE"
                  color={accent}
                  headingFont={headingFont}
                  width={Math.min(contentW * 0.5, 340)}
                />
              ) : (
                <h1 style={{
                  fontSize: titleSize, fontWeight: 700, color: titleColor,
                  fontFamily: headingFont, letterSpacing: template === "classic-blue" ? "0.2em" : "0.06em",
                  lineHeight: 1.15, margin: 0,
                  textTransform: "uppercase",
                }}>
                  {template === "botanical-modern"
                    ? data.title.replace(/certificate\s+of\s+/i, "") || "Certificate"
                    : data.title || "Certificate of Achievement"}
                </h1>
              )}

              {/* Type subtitle (e.g., "OF ACHIEVEMENT") */}
              {(useRibbon || template === "teal-regal" || template === "classic-blue") && (
                <div style={{
                  fontSize: subtitleSize * 1.1, fontWeight: 500, color: accent,
                  fontFamily: bodyFont, letterSpacing: "0.12em", textTransform: "uppercase",
                  marginTop: useRibbon ? 12 : 4, textAlign: "center",
                }}>
                  {typeLabel.toUpperCase().startsWith("OF ") ? typeLabel.toUpperCase() : `OF ${typeLabel.toUpperCase()}`}
                </div>
              )}

              {/* "Certificate" in script for botanical */}
              {template === "botanical-modern" && (
                <div style={{
                  fontSize: titleSize * 1.1, fontWeight: 400, color: accent,
                  fontFamily: headingFont, fontStyle: "italic", lineHeight: 1.15, margin: 0,
                }}>
                  Certificate
                </div>
              )}
            </div>

            {/* ── Scroll divider under title for relevant templates ── */}
            {useScrollDivider && (
              <ScrollDivider color={accent} width={Math.min(contentW * 0.4, 200)} />
            )}

            {/* ── Subtitle / Presented to ── */}
            <div data-cert-section="subtitle">
              <p style={{
                fontSize: subtitleSize, color: "#555555",
                fontFamily: bodyFont, letterSpacing: "0.06em", margin: 0, lineHeight: 1.4,
                textTransform: template === "teal-regal" ? "uppercase" : "none",
                fontWeight: template === "teal-regal" ? 600 : 400,
              }}>
                {subtitleText}
              </p>
            </div>

            {/* ── Recipient Name ── */}
            <div data-cert-section="recipient" style={{ margin: "4px 0" }}>
              <div style={{
                fontSize: nameSize, fontWeight: template === "antique-parchment" ? 400 : 700,
                color: nameColor, fontFamily: headingFont, lineHeight: 1.2,
                letterSpacing: template === "antique-parchment" ? "0.08em" : "0.01em",
                ...nameStyle,
                display: "inline-block",
                minWidth: Math.min(contentW * 0.5, 300),
              }}>
                {data.recipientName || "Recipient Name"}
              </div>
              {/* Underline or dots */}
              {useDotSeparator ? (
                <DottedSeparator color={accent} width={Math.min(contentW * 0.55, 350)} />
              ) : (
                <div style={{
                  borderBottom: `2px solid ${hexToRgba(accent, 0.3)}`,
                  margin: "0 auto",
                  width: Math.min(contentW * 0.5, 300),
                }} />
              )}
            </div>

            {/* ── Description ── */}
            {data.description && (
              <div data-cert-section="description" style={{ maxWidth: Math.min(contentW * 0.85, 600) }}>
                <p style={{
                  fontSize: descSize, color: "#444444",
                  fontFamily: bodyFont, lineHeight: 1.6, margin: 0,
                }}>
                  {data.description}
                </p>
              </div>
            )}

            {/* ── Event / Course Name ── */}
            {(data.eventName || data.courseName) && (
              <div data-cert-section="event">
                {data.eventName && (
                  <p style={{ fontSize: descSize, fontWeight: 600, color: "#333333", fontFamily: bodyFont, margin: "2px 0", lineHeight: 1.4 }}>
                    {data.eventName}
                  </p>
                )}
                {data.courseName && (
                  <p style={{ fontSize: descSize * 0.9, color: "#555555", fontFamily: bodyFont, margin: "2px 0", lineHeight: 1.4 }}>
                    {data.courseName}
                  </p>
                )}
              </div>
            )}

            {/* ── Additional Text ── */}
            {data.additionalText && (
              <div data-cert-section="additional">
                <p style={{ fontSize: descSize * 0.9, color: "#666666", fontFamily: bodyFont, lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
                  {data.additionalText}
                </p>
              </div>
            )}

            {/* ── Date ── */}
            {data.dateIssued && (
              <div data-cert-section="date" style={{ marginTop: 4 }}>
                <p style={{ fontSize: 11, color: "#666666", fontFamily: bodyFont, margin: 0 }}>
                  Issued on {formatDate(data.dateIssued)}
                  {data.validUntil && ` · Valid until ${formatDate(data.validUntil)}`}
                </p>
              </div>
            )}

            {/* ── Bottom Divider ── */}
            {useScrollDivider
              ? <ScrollDivider color={accent} width={Math.min(contentW * 0.35, 180)} />
              : <OrnamentDivider accent={accent} width={Math.min(contentW * 0.35, 180)} />
            }

            {/* ── Signatories & Seal Row ── */}
            <div
              data-cert-section="signatories"
              style={{
                display: "flex", alignItems: "flex-end", justifyContent: "center",
                gap: isLandscape ? 60 : 40, width: "100%", marginTop: 8, flexWrap: "wrap",
              }}
            >
              {/* Left signatories */}
              {data.signatories.slice(0, Math.ceil(data.signatories.length / 2)).map((sig) => (
                <SignatureBlock key={sig.id} name={sig.name} title={sig.title} organization={sig.organization} accent={accent} bodyFont={bodyFont} />
              ))}

              {/* Seal (centered between signatories) */}
              {data.showSeal && !showMedal && (
                <CertificateSeal
                  text={data.sealText || "OFFICIAL"}
                  style={data.sealStyle}
                  accent={accent}
                  size={isLandscape ? 85 : 75}
                />
              )}

              {/* Right signatories */}
              {data.signatories.slice(Math.ceil(data.signatories.length / 2)).map((sig) => (
                <SignatureBlock key={sig.id} name={sig.name} title={sig.title} organization={sig.organization} accent={accent} bodyFont={bodyFont} />
              ))}
            </div>

            {/* ── Reference Number ── */}
            {data.referenceNumber && (
              <div
                data-cert-section="reference"
                style={{ position: "absolute", bottom: 8, right: 0, fontSize: 8, color: "#999999", fontFamily: bodyFont, letterSpacing: "0.05em" }}
              >
                Ref: {data.referenceNumber}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
