/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Letterhead Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Letterhead Designer.
 *  Default canvas: A4 portrait 595 × 842 px.
 *
 *  Named objects for quick-edit targeting:
 *    lh-company-name, lh-tagline, lh-address, lh-phone, lh-email,
 *    lh-website, lh-footer-info
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 595;
const H = 842;

// ── Helpers ─────────────────────────────────────────────────────────────────

function txt(
  name: string,
  text: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    text,
    selectable: true,
    hasControls: true,
    editable: true,
    ...opts,
  };
}

function rect(
  name: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function line(
  name: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "line",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    x1, y1, x2, y2,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function circle(
  name: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "circle",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function buildJson(bg: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Template builder ────────────────────────────────────────────────────────

function buildLetterhead(opts: {
  bg: string;
  primary: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  style: "corporate" | "minimal" | "elegant" | "modern" | "bold" | "creative";
  extraObjects?: Record<string, unknown>[];
}): string {
  const { bg, primary, textColor, headingFont, bodyFont, style, extraObjects = [] } = opts;
  const mx = 50;

  const objects: Record<string, unknown>[] = [];

  // Style-specific header decoration
  if (style === "corporate" || style === "bold") {
    objects.push(
      rect("lh-header-bar", {
        left: 0, top: 0, width: W, height: style === "bold" ? 80 : 65,
        fill: primary,
      }),
    );
    objects.push(
      txt("lh-company-name", "DMSuite Solutions", {
        left: mx, top: style === "bold" ? 18 : 14, width: W - mx * 2,
        fontSize: style === "bold" ? 28 : 22, fontFamily: headingFont,
        fontWeight: "bold", fill: "#ffffff",
      }),
    );
    objects.push(
      txt("lh-tagline", "AI-Powered Design Excellence", {
        left: mx, top: style === "bold" ? 50 : 40, width: W - mx * 2,
        fontSize: 11, fontFamily: bodyFont, fontWeight: "400",
        fill: "#ffffff", opacity: 0.8,
      }),
    );
    objects.push(
      rect("lh-footer-bar", {
        left: 0, top: H - 6, width: W, height: 6,
        fill: primary, selectable: false,
      }),
    );
  } else if (style === "modern") {
    objects.push(
      rect("lh-sidebar", {
        left: 0, top: 0, width: 6, height: H,
        fill: primary,
      }),
    );
    objects.push(
      txt("lh-company-name", "DMSuite Solutions", {
        left: mx, top: 30, width: W - mx * 2,
        fontSize: 22, fontFamily: headingFont,
        fontWeight: "bold", fill: primary,
      }),
    );
    objects.push(
      txt("lh-tagline", "AI-Powered Design Excellence", {
        left: mx, top: 56, width: W - mx * 2, fontSize: 11,
        fontFamily: bodyFont, fontWeight: "400", fill: textColor, opacity: 0.6,
      }),
    );
  } else if (style === "elegant") {
    objects.push(
      rect("lh-page-border", {
        left: mx - 8, top: mx - 8, width: W - (mx - 8) * 2, height: H - (mx - 8) * 2,
        fill: "transparent", stroke: primary, strokeWidth: 1,
      }),
    );
    objects.push(
      txt("lh-company-name", "DMSuite Solutions", {
        left: mx, top: 30, width: W - mx * 2,
        fontSize: 22, fontFamily: headingFont,
        fontWeight: "bold", fill: primary, textAlign: "center",
      }),
    );
    objects.push(
      txt("lh-tagline", "AI-Powered Design Excellence", {
        left: mx, top: 56, width: W - mx * 2, fontSize: 11,
        fontFamily: bodyFont, fontWeight: "400", fill: textColor,
        textAlign: "center", opacity: 0.6,
      }),
    );
  } else if (style === "creative") {
    objects.push(
      circle("lh-deco-top", {
        left: W - 160, top: -60, radius: 120,
        fill: primary, opacity: 0.15,
      }),
    );
    objects.push(
      circle("lh-deco-bottom", {
        left: -40, top: H - 120, radius: 80,
        fill: primary, opacity: 0.1,
      }),
    );
    objects.push(
      txt("lh-company-name", "DMSuite Solutions", {
        left: mx, top: 30, width: W - mx * 2,
        fontSize: 22, fontFamily: headingFont,
        fontWeight: "bold", fill: primary,
      }),
    );
    objects.push(
      txt("lh-tagline", "AI-Powered Design Excellence", {
        left: mx, top: 56, width: W - mx * 2, fontSize: 11,
        fontFamily: bodyFont, fontWeight: "400", fill: textColor, opacity: 0.6,
      }),
    );
  } else {
    // minimal
    objects.push(
      line("lh-top-rule", mx, 0, W - mx, 0, {
        left: mx, top: 80, stroke: primary, strokeWidth: 1, opacity: 0.4,
      }),
    );
    objects.push(
      txt("lh-company-name", "DMSuite Solutions", {
        left: mx, top: 30, width: W - mx * 2,
        fontSize: 22, fontFamily: headingFont,
        fontWeight: "bold", fill: primary, textAlign: "center",
      }),
    );
    objects.push(
      txt("lh-tagline", "AI-Powered Design Excellence", {
        left: mx, top: 56, width: W - mx * 2, fontSize: 11,
        fontFamily: bodyFont, fontWeight: "400", fill: textColor,
        textAlign: "center", opacity: 0.6,
      }),
    );
  }

  // Contact fields (all styles)
  objects.push(
    txt("lh-address", "Plot 1234, Cairo Road, Lusaka, Zambia", {
      left: mx, top: (style === "corporate" || style === "bold") ? 80 : 90,
      width: W - mx * 2, fontSize: 9, fontFamily: bodyFont,
      fontWeight: "400", fill: textColor, opacity: 0.5,
    }),
  );
  objects.push(
    txt("lh-phone", "+260 97 1234567", {
      left: mx, top: (style === "corporate" || style === "bold") ? 95 : 105,
      width: 200, fontSize: 9, fontFamily: bodyFont,
      fontWeight: "400", fill: textColor, opacity: 0.5,
    }),
  );
  objects.push(
    txt("lh-email", "info@dmsuite.com", {
      left: mx + 200, top: (style === "corporate" || style === "bold") ? 95 : 105,
      width: 200, fontSize: 9, fontFamily: bodyFont,
      fontWeight: "400", fill: textColor, opacity: 0.5,
    }),
  );
  objects.push(
    txt("lh-website", "www.dmsuite.com", {
      left: W - mx - 120, top: (style === "corporate" || style === "bold") ? 95 : 105,
      width: 120, fontSize: 9, fontFamily: bodyFont,
      fontWeight: "400", fill: primary, opacity: 0.6, textAlign: "right",
    }),
  );

  // Body ruled lines (for writing space)
  const lineStart = (style === "corporate" || style === "bold") ? 150 : 140;
  for (let y = lineStart; y < H - 100; y += 28) {
    objects.push(
      line(`lh-rule-${y}`, mx, 0, W - mx, 0, {
        left: mx, top: y, stroke: "#e2e8f0", strokeWidth: 0.5,
        selectable: false, opacity: 0.6,
      }),
    );
  }

  // Footer info
  objects.push(
    txt("lh-footer-info", "Plot 1234, Cairo Road, Lusaka  |  +260 97 1234567  |  info@dmsuite.com  |  www.dmsuite.com", {
      left: mx, top: H - 40, width: W - mx * 2, fontSize: 8,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.35,
    }),
  );

  objects.push(...extraObjects);
  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const LETTERHEAD_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "lh-corporate-blue",
    name: "Corporate Blue",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#1e40af",
      textColor: "#334155",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "corporate",
    }),
  },
  {
    id: "lh-minimal-dark",
    name: "Minimal Dark",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#18181b",
      textColor: "#334155",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "minimal",
    }),
  },
  {
    id: "lh-elegant-teal",
    name: "Elegant Teal",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#0f766e",
      textColor: "#334155",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      style: "elegant",
    }),
  },
  {
    id: "lh-modern-purple",
    name: "Modern Purple",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#7c3aed",
      textColor: "#334155",
      headingFont: "Poppins",
      bodyFont: "Inter",
      style: "modern",
    }),
  },
  {
    id: "lh-bold-red",
    name: "Bold Red",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#dc2626",
      textColor: "#334155",
      headingFont: "Oswald",
      bodyFont: "Inter",
      style: "bold",
    }),
  },
  {
    id: "lh-creative-orange",
    name: "Creative Orange",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#ea580c",
      textColor: "#334155",
      headingFont: "Poppins",
      bodyFont: "Inter",
      style: "creative",
    }),
  },
  {
    id: "lh-corporate-cyan",
    name: "Corporate Cyan",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#0284c7",
      textColor: "#334155",
      headingFont: "Inter",
      bodyFont: "Inter",
      style: "corporate",
    }),
  },
  {
    id: "lh-elegant-indigo",
    name: "Elegant Indigo",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#4f46e5",
      textColor: "#334155",
      headingFont: "Cormorant Garamond",
      bodyFont: "Inter",
      style: "elegant",
    }),
  },
  {
    id: "lh-modern-green",
    name: "Modern Green",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#059669",
      textColor: "#334155",
      headingFont: "DM Serif Display",
      bodyFont: "Inter",
      style: "modern",
    }),
  },
  {
    id: "lh-bold-navy",
    name: "Bold Navy",
    category: "letterhead",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildLetterhead({
      bg: "#ffffff",
      primary: "#1e3a5f",
      textColor: "#334155",
      headingFont: "Merriweather",
      bodyFont: "Inter",
      style: "bold",
    }),
  },
];
