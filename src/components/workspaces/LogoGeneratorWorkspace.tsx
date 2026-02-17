"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { jsPDF } from "jspdf";
import {
  IconSparkles,
  IconDownload,
  IconLoader,
  IconCheck,
  IconCopy,
  IconLayers,
  IconDroplet,
  IconType,
  IconWand,
  IconRefresh,
  IconFileText,
  IconChevronLeft,
  IconChevronRight,
} from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */

type LogoStyle = "wordmark" | "lettermark" | "icon-mark" | "emblem" | "combo" | "abstract";
type FontCategory = "sans-serif" | "serif" | "display" | "handwritten" | "monospace";

interface LogoVariant {
  id: string;
  svg: string;
  label: string;
}

interface LogoConfig {
  brandName: string;
  tagline: string;
  style: LogoStyle;
  fontCategory: FontCategory;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

/* ── Preset Data ─────────────────────────────────────────── */

const logoStyles: { id: LogoStyle; label: string; desc: string }[] = [
  { id: "wordmark", label: "Wordmark", desc: "Styled typography" },
  { id: "lettermark", label: "Lettermark", desc: "Monogram initials" },
  { id: "icon-mark", label: "Icon Mark", desc: "Symbolic icon" },
  { id: "emblem", label: "Emblem", desc: "Badge enclosure" },
  { id: "combo", label: "Combination", desc: "Icon + typography" },
  { id: "abstract", label: "Abstract", desc: "Geometric form" },
];

const fontCategories: { id: FontCategory; label: string }[] = [
  { id: "sans-serif", label: "Sans Serif" },
  { id: "serif", label: "Serif" },
  { id: "display", label: "Display" },
  { id: "handwritten", label: "Script" },
  { id: "monospace", label: "Mono" },
];

const colorPresets = [
  { name: "Electric", primary: "#8ae600", secondary: "#06b6d4" },
  { name: "Corporate", primary: "#2563eb", secondary: "#1e40af" },
  { name: "Sunset", primary: "#f59e0b", secondary: "#ef4444" },
  { name: "Luxury", primary: "#7c3aed", secondary: "#c084fc" },
  { name: "Nature", primary: "#16a34a", secondary: "#15803d" },
  { name: "Mono", primary: "#18181b", secondary: "#71717a" },
  { name: "Rose", primary: "#e11d48", secondary: "#fb7185" },
  { name: "Ocean", primary: "#0284c7", secondary: "#6366f1" },
  { name: "Copper", primary: "#c2410c", secondary: "#ea580c" },
  { name: "Slate", primary: "#334155", secondary: "#94a3b8" },
];

/* ── Typography ──────────────────────────────────────────── */

function getFontFamily(cat: FontCategory): string {
  switch (cat) {
    case "serif": return "'Georgia', 'Times New Roman', serif";
    case "monospace": return "'SF Mono', 'Courier New', monospace";
    case "handwritten": return "'Segoe Script', 'Brush Script MT', cursive";
    case "display": return "'Impact', 'Anton', sans-serif";
    default: return "'Inter', 'Helvetica Neue', Arial, sans-serif";
  }
}

function getFontWeight(cat: FontCategory): number {
  return cat === "display" ? 900 : cat === "handwritten" ? 400 : cat === "serif" ? 600 : 700;
}

function getLetterSpacing(cat: FontCategory, tight = false): number {
  if (tight) return cat === "monospace" ? 0 : -0.5;
  switch (cat) { case "monospace": return 3; case "display": return 1; case "serif": return 0.5; default: return 0; }
}

function getTrackingWide(cat: FontCategory): number {
  switch (cat) { case "monospace": return 6; case "display": return 4; default: return 3; }
}

/* ── Color helpers ───────────────────────────────────────── */

import { getContrastColor } from "@/lib/canvas-utils";

/* ── XML escape ──────────────────────────────────────────── */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/* ── SVG Sanitizer ───────────────────────────────────────── */

const ALLOWED_SVG_ELEMENTS = new Set([
  "svg", "g", "defs", "linearGradient", "radialGradient", "stop",
  "path", "circle", "ellipse", "rect", "line", "polyline", "polygon",
  "text", "tspan", "textPath", "use", "clipPath", "mask", "filter",
  "feGaussianBlur", "feOffset", "feMerge", "feMergeNode", "feColorMatrix",
  "feBlend", "feComposite", "pattern", "image", "symbol", "marker",
]);

const ALLOWED_SVG_ATTRS = new Set([
  "viewBox", "xmlns", "width", "height", "x", "y", "cx", "cy", "r",
  "rx", "ry", "d", "fill", "stroke", "stroke-width", "stroke-linecap",
  "stroke-linejoin", "stroke-dasharray", "opacity", "transform",
  "font-family", "font-size", "font-weight", "letter-spacing",
  "text-anchor", "dominant-baseline", "id", "class", "offset",
  "stop-color", "stop-opacity", "x1", "y1", "x2", "y2",
  "gradientUnits", "gradientTransform", "spreadMethod", "fx", "fy",
  "points", "dx", "dy", "rotate",
]);

function sanitizeSvg(raw: string): string {
  if (typeof window === "undefined") return raw;
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "image/svg+xml");
  const errorNode = doc.querySelector("parsererror");
  if (errorNode) return "";

  function walkNode(node: Element): void {
    const children = Array.from(node.children);
    for (const child of children) {
      const tag = child.localName.toLowerCase();
      // Strip <script> and any disallowed elements
      if (!ALLOWED_SVG_ELEMENTS.has(tag)) {
        child.remove();
        continue;
      }
      // Remove disallowed attributes
      const attrs = Array.from(child.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        // Strip event handlers (on*)
        if (name.startsWith("on")) {
          child.removeAttribute(attr.name);
          continue;
        }
        // Strip xlink:href with javascript:
        if (
          (name === "xlink:href" || name === "href") &&
          attr.value.trim().toLowerCase().startsWith("javascript:")
        ) {
          child.removeAttribute(attr.name);
          continue;
        }
        if (!ALLOWED_SVG_ATTRS.has(attr.name)) {
          child.removeAttribute(attr.name);
        }
      }
      walkNode(child);
    }
  }

  const svgEl = doc.documentElement;
  // Sanitize root svg element attributes
  const rootAttrs = Array.from(svgEl.attributes);
  for (const attr of rootAttrs) {
    if (attr.name.toLowerCase().startsWith("on")) {
      svgEl.removeAttribute(attr.name);
    } else if (!ALLOWED_SVG_ATTRS.has(attr.name)) {
      svgEl.removeAttribute(attr.name);
    }
  }
  walkNode(svgEl);

  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgEl);
}

type PngBgOption = "white" | "black" | "transparent" | "custom";

/* ── SVG Logo Generator ─────────────────────────────────── */

function generateLogoVariants(config: LogoConfig): LogoVariant[] {
  const name = esc(config.brandName || "Brand");
  const tag = esc(config.tagline || "");
  const rawName = config.brandName || "Brand";
  const pc = config.primaryColor;
  const sc = config.secondaryColor;
  const cc = getContrastColor(pc);
  const ff = getFontFamily(config.fontCategory);
  const fw = getFontWeight(config.fontCategory);
  const lsTight = getLetterSpacing(config.fontCategory, true);
  const lsWide = getTrackingWide(config.fontCategory);
  const initials = rawName.split(/\s+/).map(w => w[0]?.toUpperCase() || "").join("").slice(0, 3) || "AB";
  const uid = `lg${Date.now()}`;
  const nameLen = rawName.length;
  const heroSize = nameLen <= 4 ? 64 : nameLen <= 8 ? 52 : nameLen <= 12 ? 42 : nameLen <= 16 ? 34 : 28;

  switch (config.style) {
    case "wordmark":
      return [
        { id: `wm1-${uid}`, label: "Precision",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 200"><defs><linearGradient id="${uid}-wg1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><rect width="560" height="200" fill="none"/><text x="280" y="96" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${heroSize}" font-weight="${fw}" letter-spacing="${lsTight}" fill="url(#${uid}-wg1)">${name}</text><rect x="${280 - nameLen * heroSize * 0.28}" y="118" width="${nameLen * heroSize * 0.56}" height="1.5" fill="${pc}" opacity="0.2"/>${tag ? `<text x="280" y="148" text-anchor="middle" font-family="${ff}" font-size="12" letter-spacing="${lsWide}" fill="${sc}" opacity="0.6" font-weight="500">${tag.toUpperCase()}</text>` : `<text x="280" y="148" text-anchor="middle" font-family="${ff}" font-size="10" letter-spacing="${lsWide + 2}" fill="${sc}" opacity="0.35">${name.toUpperCase()}</text>`}</svg>` },
        { id: `wm2-${uid}`, label: "Accent Bar",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 200"><rect width="560" height="200" fill="none"/><rect x="24" y="40" width="4" height="120" rx="2" fill="${pc}"/><text x="44" y="88" font-family="${ff}" font-size="${Math.min(heroSize, 54)}" font-weight="${fw}" letter-spacing="${lsTight}" fill="${pc}">${name}</text>${tag ? `<text x="46" y="118" font-family="${ff}" font-size="13" fill="${sc}" opacity="0.55" letter-spacing="0.5">${tag}</text>` : ""}<line x1="46" y1="140" x2="${46 + Math.min(nameLen * 14, 180)}" y2="140" stroke="${pc}" stroke-width="1" opacity="0.12"/><text x="46" y="162" font-family="${ff}" font-size="8" letter-spacing="${lsWide + 3}" fill="${sc}" opacity="0.25">EST. ${new Date().getFullYear()}</text></svg>` },
        { id: `wm3-${uid}`, label: "Contrast Weight",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 200"><rect width="560" height="200" fill="none"/><text x="280" y="72" text-anchor="middle" font-family="${ff}" font-size="${Math.max(heroSize - 12, 24)}" font-weight="300" letter-spacing="${lsWide}" fill="${pc}" opacity="0.4">${name.toUpperCase()}</text><text x="280" y="118" text-anchor="middle" font-family="${ff}" font-size="${heroSize + 4}" font-weight="900" letter-spacing="${lsTight}" fill="${pc}">${name}</text>${tag ? `<text x="280" y="156" text-anchor="middle" font-family="${ff}" font-size="11" letter-spacing="${lsWide}" fill="${sc}" opacity="0.45">${tag.toUpperCase()}</text>` : ""}</svg>` },
      ];

    case "lettermark":
      return [
        { id: `lm1-${uid}`, label: "Circular Mono",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="${uid}-lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><circle cx="120" cy="120" r="100" fill="url(#${uid}-lg1)"/><circle cx="120" cy="120" r="86" fill="none" stroke="${cc}" stroke-width="0.75" opacity="0.15"/><text x="120" y="124" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${initials.length > 2 ? 52 : 68}" font-weight="${fw}" letter-spacing="${initials.length > 2 ? 2 : 4}" fill="${cc}">${initials}</text></svg>` },
        { id: `lm2-${uid}`, label: "Squared Mono",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect x="20" y="20" width="200" height="200" rx="24" fill="${pc}"/><rect x="32" y="32" width="176" height="176" rx="16" fill="none" stroke="${cc}" stroke-width="0.75" opacity="0.1"/><text x="120" y="124" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${initials.length > 2 ? 56 : 72}" font-weight="800" letter-spacing="${initials.length > 2 ? 1 : 3}" fill="${cc}">${initials}</text></svg>` },
        { id: `lm3-${uid}`, label: "Outlined Mono",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect x="24" y="24" width="192" height="192" rx="4" fill="none" stroke="${pc}" stroke-width="3"/><rect x="36" y="36" width="168" height="168" rx="2" fill="none" stroke="${pc}" stroke-width="0.75" opacity="0.2"/><text x="120" y="124" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${initials.length > 2 ? 52 : 66}" font-weight="${fw}" letter-spacing="4" fill="${pc}">${initials}</text>${tag ? `<line x1="56" y1="176" x2="184" y2="176" stroke="${pc}" stroke-width="0.5" opacity="0.2"/><text x="120" y="198" text-anchor="middle" font-family="${ff}" font-size="8" letter-spacing="${lsWide + 1}" fill="${sc}" opacity="0.45">${tag.toUpperCase()}</text>` : ""}</svg>` },
      ];

    case "icon-mark":
      return [
        { id: `im1-${uid}`, label: "Diamond Icon",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="${uid}-ig1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><g transform="translate(120,120) rotate(45)"><rect x="-68" y="-68" width="136" height="136" rx="20" fill="url(#${uid}-ig1)"/><rect x="-56" y="-56" width="112" height="112" rx="14" fill="none" stroke="${cc}" stroke-width="0.75" opacity="0.12"/></g><text x="120" y="124" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="54" font-weight="800" fill="${cc}">${initials.charAt(0)}</text></svg>` },
        { id: `im2-${uid}`, label: "Shield Icon",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 260"><defs><linearGradient id="${uid}-ig2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><path d="M120 16 L208 56 L208 140 Q208 210 120 244 Q32 210 32 140 L32 56 Z" fill="url(#${uid}-ig2)"/><path d="M120 32 L196 66 L196 138 Q196 200 120 230 Q44 200 44 138 L44 66 Z" fill="none" stroke="${cc}" stroke-width="0.75" opacity="0.12"/><text x="120" y="126" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="58" font-weight="800" fill="${cc}">${initials.charAt(0)}</text><line x1="72" y1="162" x2="168" y2="162" stroke="${cc}" stroke-width="0.75" opacity="0.2"/><text x="120" y="186" text-anchor="middle" font-family="${ff}" font-size="9" letter-spacing="${lsWide + 2}" fill="${cc}" opacity="0.5">${nameLen <= 10 ? name.toUpperCase() : initials}</text></svg>` },
        { id: `im3-${uid}`, label: "Sphere Blend",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><radialGradient id="${uid}-rg1" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></radialGradient></defs><circle cx="120" cy="120" r="96" fill="url(#${uid}-rg1)"/><ellipse cx="92" cy="88" rx="32" ry="24" fill="${cc}" opacity="0.06"/><text x="120" y="124" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="52" font-weight="800" fill="${cc}">${initials.charAt(0)}</text></svg>` },
      ];

    case "emblem":
      return [
        { id: `em1-${uid}`, label: "Classic Badge",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 280"><defs><linearGradient id="${uid}-eg1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><circle cx="140" cy="140" r="124" fill="url(#${uid}-eg1)"/><circle cx="140" cy="140" r="110" fill="none" stroke="${cc}" stroke-width="0.75" opacity="0.15"/><circle cx="140" cy="140" r="104" fill="none" stroke="${cc}" stroke-width="0.5" opacity="0.08"/><text x="140" y="134" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${nameLen > 10 ? 28 : 36}" font-weight="800" fill="${cc}">${nameLen > 14 ? initials : name.toUpperCase()}</text><line x1="72" y1="158" x2="208" y2="158" stroke="${cc}" stroke-width="0.5" opacity="0.2"/><text x="140" y="180" text-anchor="middle" font-family="${ff}" font-size="8" letter-spacing="${lsWide + 2}" fill="${cc}" opacity="0.45">${(tag || "PREMIUM QUALITY").toUpperCase()}</text><text x="140" y="198" text-anchor="middle" font-family="${ff}" font-size="8" letter-spacing="${lsWide}" fill="${cc}" opacity="0.3">EST. ${new Date().getFullYear()}</text></svg>` },
        { id: `em2-${uid}`, label: "Horizontal Badge",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 180"><rect x="12" y="12" width="376" height="156" rx="12" fill="${pc}"/><rect x="22" y="22" width="356" height="136" rx="6" fill="none" stroke="${cc}" stroke-width="0.75" opacity="0.12"/><text x="200" y="78" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${Math.min(heroSize - 4, 38)}" font-weight="800" fill="${cc}">${name.toUpperCase()}</text><line x1="60" y1="100" x2="340" y2="100" stroke="${cc}" stroke-width="0.5" opacity="0.15"/><text x="200" y="124" text-anchor="middle" font-family="${ff}" font-size="9" letter-spacing="${lsWide + 1}" fill="${cc}" opacity="0.4">${(tag || `SINCE ${new Date().getFullYear()}`).toUpperCase()}</text></svg>` },
        { id: `em3-${uid}`, label: "Crest",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 300"><defs><linearGradient id="${uid}-eg3" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><path d="M130 12 L240 60 L240 160 Q240 250 130 288 Q20 250 20 160 L20 60 Z" fill="url(#${uid}-eg3)"/><path d="M130 28 L228 70 L228 158 Q228 238 130 272 Q32 238 32 158 L32 70 Z" fill="none" stroke="${cc}" stroke-width="0.75" opacity="0.1"/><text x="130" y="136" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="${nameLen > 8 ? 36 : 44}" font-weight="800" fill="${cc}">${nameLen > 12 ? initials : name.toUpperCase()}</text><line x1="68" y1="166" x2="192" y2="166" stroke="${cc}" stroke-width="0.5" opacity="0.15"/><text x="130" y="192" text-anchor="middle" font-family="${ff}" font-size="8" letter-spacing="${lsWide + 1}" fill="${cc}" opacity="0.4">${(tag || "ESTABLISHED").toUpperCase()}</text></svg>` },
      ];

    case "combo":
      return [
        { id: `cb1-${uid}`, label: "Icon Left",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 160"><defs><linearGradient id="${uid}-cg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><rect width="520" height="160" fill="none"/><rect x="20" y="26" width="108" height="108" rx="24" fill="url(#${uid}-cg1)"/><rect x="32" y="38" width="84" height="84" rx="14" fill="none" stroke="${cc}" stroke-width="0.75" opacity="0.1"/><text x="74" y="84" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="40" font-weight="800" fill="${cc}">${initials.charAt(0)}</text><text x="152" y="72" font-family="${ff}" font-size="${Math.min(heroSize - 6, 42)}" font-weight="${fw}" letter-spacing="${lsTight}" fill="${pc}">${name}</text>${tag ? `<text x="154" y="100" font-family="${ff}" font-size="12" fill="${sc}" opacity="0.45" letter-spacing="0.3">${tag}</text>` : `<line x1="154" y1="92" x2="${154 + Math.min(nameLen * 12, 160)}" y2="92" stroke="${pc}" stroke-width="1" opacity="0.1"/>`}<text x="154" y="128" font-family="${ff}" font-size="7" letter-spacing="${lsWide + 3}" fill="${sc}" opacity="0.2">${(tag || name).toUpperCase().slice(0, 24)}</text></svg>` },
        { id: `cb2-${uid}`, label: "Stacked Center",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300"><defs><linearGradient id="${uid}-cg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><rect width="360" height="300" fill="none"/><circle cx="180" cy="80" r="52" fill="url(#${uid}-cg2)"/><circle cx="180" cy="80" r="40" fill="none" stroke="${cc}" stroke-width="0.75" opacity="0.1"/><text x="180" y="84" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="34" font-weight="800" fill="${cc}">${initials.charAt(0)}</text><text x="180" y="172" text-anchor="middle" font-family="${ff}" font-size="${Math.min(heroSize - 8, 40)}" font-weight="${fw}" letter-spacing="${lsTight}" fill="${pc}">${name}</text><rect x="${180 - Math.min(nameLen * 6, 60)}" y="188" width="${Math.min(nameLen * 12, 120)}" height="1" fill="${pc}" opacity="0.12"/>${tag ? `<text x="180" y="216" text-anchor="middle" font-family="${ff}" font-size="11" letter-spacing="${lsWide}" fill="${sc}" opacity="0.4">${tag.toUpperCase()}</text>` : ""}</svg>` },
        { id: `cb3-${uid}`, label: "Pill Lockup",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120"><rect width="520" height="120" fill="none"/><rect x="16" y="16" width="488" height="88" rx="44" fill="none" stroke="${pc}" stroke-width="2.5"/><circle cx="64" cy="60" r="32" fill="${pc}"/><text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-family="${ff}" font-size="24" font-weight="800" fill="${cc}">${initials.charAt(0)}</text><text x="114" y="54" font-family="${ff}" font-size="${Math.min(heroSize - 12, 32)}" font-weight="${fw}" letter-spacing="${lsTight}" fill="${pc}">${name}</text>${tag ? `<text x="116" y="76" font-family="${ff}" font-size="9" letter-spacing="${lsWide}" fill="${sc}" opacity="0.4">${tag.toUpperCase()}</text>` : `<text x="116" y="76" font-family="${ff}" font-size="8" letter-spacing="${lsWide + 2}" fill="${sc}" opacity="0.25">● ${name.toUpperCase()} ●</text>`}</svg>` },
      ];

    case "abstract":
    default:
      return [
        { id: `ab1-${uid}`, label: "Orb + Type",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200"><defs><radialGradient id="${uid}-ag1" cx="40%" cy="40%" r="60%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></radialGradient></defs><rect width="480" height="200" fill="none"/><circle cx="72" cy="100" r="52" fill="url(#${uid}-ag1)" opacity="0.12"/><circle cx="72" cy="100" r="36" fill="url(#${uid}-ag1)" opacity="0.25"/><circle cx="72" cy="100" r="22" fill="url(#${uid}-ag1)"/><text x="260" y="90" font-family="${ff}" font-size="${Math.min(heroSize - 4, 44)}" font-weight="${fw}" letter-spacing="${lsTight}" fill="${pc}">${name}</text>${tag ? `<text x="262" y="118" font-family="${ff}" font-size="11" fill="${sc}" opacity="0.4" letter-spacing="0.5">${tag}</text>` : `<rect x="262" y="106" width="${Math.min(nameLen * 10, 100)}" height="1" fill="${pc}" opacity="0.1"/>`}</svg>` },
        { id: `ab2-${uid}`, label: "Gradient Bars",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200"><defs><linearGradient id="${uid}-ag2" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><rect width="480" height="200" fill="none"/><rect x="28" y="44" width="28" height="112" rx="6" fill="url(#${uid}-ag2)" opacity="0.85"/><rect x="64" y="28" width="28" height="144" rx="6" fill="url(#${uid}-ag2)" opacity="0.55"/><rect x="100" y="56" width="28" height="88" rx="6" fill="url(#${uid}-ag2)" opacity="0.3"/><text x="164" y="92" font-family="${ff}" font-size="${Math.min(heroSize - 4, 42)}" font-weight="${fw}" letter-spacing="${lsTight}" fill="${pc}">${name}</text>${tag ? `<text x="166" y="120" font-family="${ff}" font-size="11" fill="${sc}" opacity="0.4" letter-spacing="0.3">${tag}</text>` : `<rect x="166" y="108" width="${Math.min(nameLen * 10, 100)}" height="1" fill="${pc}" opacity="0.1"/>`}</svg>` },
        { id: `ab3-${uid}`, label: "Split Form",
          svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200"><defs><linearGradient id="${uid}-ag3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${pc}"/><stop offset="100%" stop-color="${sc}"/></linearGradient></defs><rect width="480" height="200" fill="none"/><circle cx="72" cy="78" r="42" fill="url(#${uid}-ag3)" opacity="0.7"/><circle cx="72" cy="78" r="42" fill="none" stroke="${pc}" stroke-width="1" opacity="0.15"/><rect x="52" y="98" width="40" height="56" rx="8" fill="url(#${uid}-ag3)" opacity="0.35"/><text x="260" y="90" font-family="${ff}" font-size="${Math.min(heroSize - 4, 42)}" font-weight="${fw}" letter-spacing="${lsTight}" fill="${pc}">${name}</text><line x1="262" y1="108" x2="${262 + Math.min(nameLen * 10, 140)}" y2="108" stroke="${sc}" stroke-width="1" opacity="0.12"/>${tag ? `<text x="262" y="130" font-family="${ff}" font-size="11" fill="${sc}" opacity="0.4" letter-spacing="0.3">${tag}</text>` : ""}</svg>` },
      ];
  }
}

/* ── Component ───────────────────────────────────────────── */

export default function LogoGeneratorWorkspace() {
  const [config, setConfig] = useState<LogoConfig>({
    brandName: "", tagline: "", style: "combo", fontCategory: "sans-serif",
    primaryColor: "#8ae600", secondaryColor: "#06b6d4", description: "",
  });
  const [aiVariants, setAiVariants] = useState<LogoVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"configure" | "gallery">("configure");
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [previewBg, setPreviewBg] = useState<"checker" | "white" | "dark" | "brand">("checker");
  const [pngBg, setPngBg] = useState<PngBgOption>("white");
  const [pngCustomColor, setPngCustomColor] = useState("#000000");

  const updateConfig = useCallback((partial: Partial<LogoConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const clientVariants = useMemo<LogoVariant[]>(() => {
    if (!config.brandName.trim()) return [];
    return generateLogoVariants(config);
  }, [config]);

  const allVariants = useMemo(() => [...clientVariants, ...aiVariants], [clientVariants, aiVariants]);
  const selectedLogo = allVariants.find((v) => v.id === selectedVariant) || clientVariants[0] || null;

  const currentFirstId = clientVariants[0]?.id;
  const [lastAutoId, setLastAutoId] = useState<string | null>(null);
  if (currentFirstId && currentFirstId !== lastAutoId && !selectedVariant) {
    setSelectedVariant(currentFirstId);
    setLastAutoId(currentFirstId);
  }

  const generateAiLogos = useCallback(async () => {
    if (!config.brandName.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `You are an elite brand identity designer. Create exactly 2 SVG logos.\n\nBrand: ${config.brandName}\n${config.tagline ? `Tagline: ${config.tagline}\n` : ""}${config.description ? `Description: ${config.description}\n` : ""}Style: ${config.style}\nPrimary: ${config.primaryColor}\nSecondary: ${config.secondaryColor}\n\nRULES:\n- Output ONLY raw <svg>...</svg> elements. No markdown, no explanation.\n- xmlns="http://www.w3.org/2000/svg"\n- viewBox: "0 0 480 200" for wordmark/combo/abstract, "0 0 240 240" for others\n- font-family="${getFontFamily(config.fontCategory)}"\n- Colors: ONLY the two given colors + "${getContrastColor(config.primaryColor)}" for text on filled shapes\n- Use subtle gradients. Design with restraint: clean lines, proper spacing.`;
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }) });
      if (!response.ok) throw new Error("Failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      let fullText = "";
      const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; fullText += decoder.decode(value, { stream: true }); }
      const svgMatches = fullText.match(/<svg[\s\S]*?<\/svg>/gi) || [];
      const newVariants: LogoVariant[] = svgMatches
        .map((raw, i) => ({ id: `ai-${Date.now()}-${i}`, svg: sanitizeSvg(raw), label: `AI Design ${aiVariants.length + i + 1}` }))
        .filter((v) => v.svg.length > 0);
      if (newVariants.length > 0) { setAiVariants((prev) => [...newVariants, ...prev]); setSelectedVariant(newVariants[0].id); }
    } catch (err) { console.error("AI logo generation error:", err); }
    finally { setIsGenerating(false); }
  }, [config, aiVariants.length]);

  const handleCopySvg = useCallback(async () => { if (!selectedLogo) return; await navigator.clipboard.writeText(selectedLogo.svg); setCopiedSvg(true); setTimeout(() => setCopiedSvg(false), 2000); }, [selectedLogo]);

  const handleDownloadSvg = useCallback(() => {
    if (!selectedLogo) return;
    const blob = new Blob([selectedLogo.svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `${config.brandName.replace(/\s+/g, "-").toLowerCase() || "logo"}-${selectedLogo.label.toLowerCase().replace(/\s+/g, "-")}.svg`;
    a.click(); URL.revokeObjectURL(url);
  }, [selectedLogo, config.brandName]);

  const handleDownloadPng = useCallback(async (scale: number = 2) => {
    if (!selectedLogo) return;
    const canvas = document.createElement("canvas"); canvas.width = 1200 * scale; canvas.height = 600 * scale;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const img = new Image();
    const svgBlob = new Blob([selectedLogo.svg], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    img.onload = () => {
      if (pngBg === "transparent") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        const bgColors: Record<string, string> = { white: "#ffffff", black: "#000000", custom: pngCustomColor };
        ctx.fillStyle = bgColors[pngBg] ?? "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const s = Math.min((canvas.width * 0.85) / img.naturalWidth, (canvas.height * 0.7) / img.naturalHeight);
      const w = img.naturalWidth * s; const h = img.naturalHeight * s;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${config.brandName.replace(/\s+/g, "-").toLowerCase() || "logo"}-${scale}x.png`; a.click(); URL.revokeObjectURL(url); }, "image/png");
    };
    img.src = svgUrl;
  }, [selectedLogo, config.brandName, pngBg, pngCustomColor]);

  /* ── PDF export ──────────────────────────────────────── */
  const handleDownloadPdf = useCallback(async () => {
    if (!selectedLogo && allVariants.length === 0) return;
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pw = pdf.internal.pageSize.getWidth();
    let yPos = 40;

    // Header
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text(config.brandName || "Logo Sheet", pw / 2, yPos, { align: "center" });
    yPos += 24;

    if (config.tagline) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120);
      pdf.text(config.tagline, pw / 2, yPos, { align: "center" });
      yPos += 20;
    }

    // Colors
    pdf.setFontSize(9);
    pdf.setTextColor(100);
    pdf.text(`Primary: ${config.primaryColor}  |  Secondary: ${config.secondaryColor}`, pw / 2, yPos, { align: "center" });
    yPos += 28;

    // Render each variant
    const variants = allVariants.length > 0 ? allVariants : (selectedLogo ? [selectedLogo] : []);
    const margin = 40;
    const colW = (pw - margin * 2 - 20) / 2;
    const rowH = colW * 0.55;

    for (let i = 0; i < variants.length; i++) {
      const col = i % 2;
      if (i > 0 && col === 0) yPos += rowH + 30;
      if (yPos + rowH + 40 > pdf.internal.pageSize.getHeight()) {
        pdf.addPage();
        yPos = 40;
      }

      const xOff = margin + col * (colW + 20);

      // Label
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(80);
      pdf.text(variants[i].label, xOff, yPos);

      // Render SVG to image
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 600; canvas.height = 330;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const img = new Image();
          const blob = new Blob([variants[i].svg], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          await new Promise<void>((resolve) => {
            img.onload = () => {
              const s = Math.min((canvas.width * 0.85) / img.naturalWidth, (canvas.height * 0.7) / img.naturalHeight);
              const w = img.naturalWidth * s;
              const h = img.naturalHeight * s;
              ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
              URL.revokeObjectURL(url);
              resolve();
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            img.src = url;
          });
          const dataUrl = canvas.toDataURL("image/png");
          pdf.addImage(dataUrl, "PNG", xOff, yPos + 10, colW, rowH);
        }
      } catch { /* skip variant on error */ }
    }

    pdf.save(`${config.brandName.replace(/\s+/g, "-").toLowerCase() || "logo"}-sheet.pdf`);
  }, [allVariants, selectedLogo, config]);

  /* ── Keyboard shortcuts ────────────────────────────────── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Ctrl+E → download SVG
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        handleDownloadSvg();
        return;
      }
      // Ctrl+G → generate AI variants
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        generateAiLogos();
        return;
      }

      if (isInput) return;

      // ←/→ → cycle through variants
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const variants = allVariants;
        if (variants.length === 0) return;
        const currentIdx = variants.findIndex((v) => v.id === selectedVariant);
        let nextIdx: number;
        if (e.key === "ArrowLeft") {
          nextIdx = currentIdx <= 0 ? variants.length - 1 : currentIdx - 1;
        } else {
          nextIdx = currentIdx >= variants.length - 1 ? 0 : currentIdx + 1;
        }
        setSelectedVariant(variants[nextIdx].id);
        return;
      }

      // 1-6 → select style by index
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 6 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const style = logoStyles[num - 1];
        if (style) updateConfig({ style: style.id });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDownloadSvg, generateAiLogos, allVariants, selectedVariant, updateConfig]);

  const previewBgClass = { checker: "bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#1f2937_0%_25%,transparent_0%_50%)] bg-size-[20px_20px]", white: "bg-white", dark: "bg-gray-950", brand: "" }[previewBg];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── Left Panel ─────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-5">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
          {(["configure", "gallery"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>
              {tab === "configure" ? "Configure" : `Gallery (${allVariants.length})`}
            </button>
          ))}
        </div>

        {activeTab === "configure" ? (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Brand Name</label>
              <input type="text" placeholder="e.g. Acme Corp" value={config.brandName} onChange={(e) => updateConfig({ brandName: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Tagline</label>
              <input type="text" placeholder="e.g. Innovation for tomorrow" value={config.tagline} onChange={(e) => updateConfig({ tagline: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Brand Brief <span className="font-normal normal-case tracking-normal text-gray-400">(for AI)</span></label>
              <textarea rows={2} placeholder="Describe your brand, industry, personality…" value={config.description} onChange={(e) => updateConfig({ description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none" />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"><IconLayers className="size-3.5" />Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {logoStyles.map((style) => (
                  <button key={style.id} onClick={() => updateConfig({ style: style.id })} className={`p-2.5 rounded-xl border text-left transition-all ${config.style === style.id ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                    <p className={`text-xs font-semibold ${config.style === style.id ? "text-primary-500" : "text-gray-900 dark:text-white"}`}>{style.label}</p>
                    <p className="text-[0.625rem] text-gray-400 mt-0.5 leading-tight">{style.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"><IconType className="size-3.5" />Typography</label>
              <div className="flex flex-wrap gap-1.5">
                {fontCategories.map((font) => (
                  <button key={font.id} onClick={() => updateConfig({ fontCategory: font.id })} className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${config.fontCategory === font.id ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`} style={{ fontFamily: getFontFamily(font.id) }}>{font.label}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2"><IconDroplet className="size-3.5" />Color Palette</label>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {colorPresets.map((preset) => (
                  <button key={preset.name} onClick={() => updateConfig({ primaryColor: preset.primary, secondaryColor: preset.secondary })} className={`group p-1.5 rounded-lg border text-center transition-all ${config.primaryColor === preset.primary && config.secondaryColor === preset.secondary ? "border-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`} title={preset.name}>
                    <div className="flex gap-0.5 justify-center"><div className="size-5 rounded-full" style={{ backgroundColor: preset.primary }} /><div className="size-5 rounded-full" style={{ backgroundColor: preset.secondary }} /></div>
                    <span className="text-[0.5625rem] text-gray-400 mt-0.5 block leading-tight">{preset.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer"><input type="color" value={config.primaryColor} onChange={(e) => updateConfig({ primaryColor: e.target.value })} className="size-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" /><span className="text-[0.6875rem] text-gray-400">Primary</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="color" value={config.secondaryColor} onChange={(e) => updateConfig({ secondaryColor: e.target.value })} className="size-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" /><span className="text-[0.6875rem] text-gray-400">Secondary</span></label>
              </div>
            </div>
            <div className="pt-1">
              <button onClick={generateAiLogos} disabled={!config.brandName.trim() || isGenerating} className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary-500 text-gray-950 text-sm font-bold hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/20">
                {isGenerating ? (<><IconLoader className="size-4 animate-spin" />Generating AI Logos…</>) : (<><IconSparkles className="size-4" />Generate AI Logos</>)}
              </button>
              <p className="text-[0.625rem] text-gray-400 text-center mt-1.5">Instant designs update live · AI generates 2 additional variants</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {allVariants.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
                <IconWand className="size-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 font-medium">Enter a brand name to generate logos</p>
              </div>
            ) : (
              <>
                {clientVariants.length > 0 && <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-gray-400 px-0.5">Instant ({clientVariants.length})</p>}
                <div className="grid grid-cols-2 gap-2">{clientVariants.map((v) => (<LogoThumb key={v.id} variant={v} selected={selectedLogo?.id === v.id} onSelect={() => setSelectedVariant(v.id)} />))}</div>
                {aiVariants.length > 0 && (<><p className="text-[0.625rem] font-semibold uppercase tracking-widest text-secondary-500 px-0.5 pt-1"><IconSparkles className="size-3 inline mr-0.5 -mt-0.5" />AI ({aiVariants.length})</p><div className="grid grid-cols-2 gap-2">{aiVariants.map((v) => (<LogoThumb key={v.id} variant={v} selected={selectedLogo?.id === v.id} onSelect={() => setSelectedVariant(v.id)} />))}</div></>)}
              </>
            )}
            {config.brandName.trim() && (
              <button onClick={generateAiLogos} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                {isGenerating ? <IconLoader className="size-3.5 animate-spin" /> : <IconRefresh className="size-3.5" />}{isGenerating ? "Generating…" : "Generate More with AI"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Right Panel ────────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Preview</span>
              {selectedLogo && <span className="text-xs text-gray-400 font-medium">{selectedLogo.label}</span>}
              {allVariants.length > 1 && (
                <div className="flex items-center gap-0.5">
                  <button onClick={() => { const idx = allVariants.findIndex((v) => v.id === selectedVariant); setSelectedVariant(allVariants[idx <= 0 ? allVariants.length - 1 : idx - 1].id); }} className="size-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Previous (←)"><IconChevronLeft className="size-3.5" /></button>
                  <button onClick={() => { const idx = allVariants.findIndex((v) => v.id === selectedVariant); setSelectedVariant(allVariants[idx >= allVariants.length - 1 ? 0 : idx + 1].id); }} className="size-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Next (→)"><IconChevronRight className="size-3.5" /></button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {(["checker", "white", "dark", "brand"] as const).map((bg) => (
                <button key={bg} onClick={() => setPreviewBg(bg)} className={`size-6 rounded-md border transition-all ${previewBg === bg ? "ring-2 ring-primary-500/40 border-primary-500" : "border-gray-200 dark:border-gray-600 hover:border-gray-400"}`} title={bg}
                  style={{ backgroundColor: bg === "white" ? "#fff" : bg === "dark" ? "#09090b" : bg === "brand" ? config.primaryColor + "18" : undefined, backgroundImage: bg === "checker" ? "repeating-conic-gradient(#d1d5db 0% 25%, transparent 0% 50%)" : undefined, backgroundSize: bg === "checker" ? "8px 8px" : undefined }} />
              ))}
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
              {selectedLogo && (<>
                <button onClick={handleCopySvg} className="flex items-center gap-1 px-2 py-1 rounded-md text-[0.6875rem] font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">{copiedSvg ? <IconCheck className="size-3 text-success" /> : <IconCopy className="size-3" />}{copiedSvg ? "Copied" : "SVG"}</button>
                <button onClick={handleDownloadSvg} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.6875rem] font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 transition-colors"><IconDownload className="size-3" />SVG</button>
              </>)}
            </div>
          </div>
          <div className={`aspect-video flex items-center justify-center p-10 ${previewBgClass}`} style={previewBg === "brand" ? { backgroundColor: config.primaryColor + "10" } : undefined}>
            {selectedLogo ? (
              <div className="max-w-lg max-h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: selectedLogo.svg }} />
            ) : (
              <div className="text-center">
                <div className="size-16 rounded-2xl bg-linear-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-4"><IconSparkles className="size-7 text-primary-500" /></div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Enter your brand name</p>
                <p className="text-xs text-gray-400 mt-1">Logos generate instantly as you type</p>
              </div>
            )}
          </div>
        </div>
        {selectedLogo && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">Context Previews</h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="aspect-video rounded-xl border border-gray-200 dark:border-gray-700 bg-white flex items-center justify-center p-5 overflow-hidden"><div className="[&>svg]:max-w-full [&>svg]:max-h-14 [&>svg]:w-auto [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: selectedLogo.svg }} /></div>
              <div className="aspect-video rounded-xl border border-gray-700 bg-gray-950 flex items-center justify-center p-5 overflow-hidden"><div className="[&>svg]:max-w-full [&>svg]:max-h-14 [&>svg]:w-auto [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: selectedLogo.svg }} /></div>
              <div className="aspect-video rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center p-5 overflow-hidden" style={{ backgroundColor: config.primaryColor + "0d" }}><div className="[&>svg]:max-w-full [&>svg]:max-h-14 [&>svg]:w-auto [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: selectedLogo.svg }} /></div>
            </div>
          </div>
        )}
        {selectedLogo && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Export</h3>
            {/* PNG Background Option */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[0.6875rem] text-gray-500 dark:text-gray-400 font-medium">PNG Background</span>
              <div className="flex items-center gap-1">
                {(["white", "black", "transparent", "custom"] as PngBgOption[]).map((opt) => (
                  <button key={opt} onClick={() => setPngBg(opt)} className={`px-2 py-1 rounded-md text-[0.625rem] font-semibold transition-all ${
                    pngBg === opt
                      ? "bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/30"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</button>
                ))}
              </div>
              {pngBg === "custom" && (
                <input type="color" value={pngCustomColor} onChange={(e) => setPngCustomColor(e.target.value)}
                  className="size-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" />
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button onClick={handleDownloadSvg} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10"><IconDownload className="size-4" /><span className="text-xs font-semibold">.svg</span><span className="text-[0.5625rem] opacity-60">Vector</span></button>
              <button onClick={() => handleDownloadPng(1)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10"><IconDownload className="size-4" /><span className="text-xs font-semibold">.png</span><span className="text-[0.5625rem] opacity-60">1200×600</span></button>
              <button onClick={() => handleDownloadPng(2)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10"><IconDownload className="size-4" /><span className="text-xs font-semibold">.png 2×</span><span className="text-[0.5625rem] opacity-60">2400×1200</span></button>
              <button onClick={() => handleDownloadPng(4)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10"><IconDownload className="size-4" /><span className="text-xs font-semibold">.png 4×</span><span className="text-[0.5625rem] opacity-60">4800×2400</span></button>
              <button onClick={handleDownloadPdf} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-warning/30 bg-warning/5 text-warning transition-colors hover:bg-warning/10"><IconFileText className="size-4" /><span className="text-xs font-semibold">.pdf</span><span className="text-[0.5625rem] opacity-60">Logo Sheet</span></button>
            </div>
            <p className="text-[0.5625rem] text-gray-400 mt-2">⌨ Ctrl+E SVG · ←→ cycle variants · 1-6 style · Ctrl+G AI generate</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LogoThumb({ variant, selected, onSelect }: { variant: LogoVariant; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`group relative aspect-3/2 rounded-xl border-2 bg-white dark:bg-gray-800 overflow-hidden transition-all ${selected ? "border-primary-500 ring-2 ring-primary-500/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
      <div className="w-full h-full flex items-center justify-center p-3 [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto" dangerouslySetInnerHTML={{ __html: variant.svg }} />
      {selected && <div className="absolute top-1.5 right-1.5"><IconCheck className="size-4 text-primary-500" /></div>}
      <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/50 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[0.5625rem] text-white font-medium">{variant.label}</span></div>
    </button>
  );
}
