/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Infographic Maker Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Infographic Maker.
 *  Default canvas: 800 × 1200 px (standard infographic).
 *
 *  Named objects for quick-edit targeting:
 *    inf-title, inf-subtitle, inf-stat-1-value, inf-stat-1-label,
 *    inf-stat-2-value, inf-stat-2-label, inf-stat-3-value, inf-stat-3-label,
 *    inf-step-1, inf-step-2, inf-step-3, inf-footer
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 800;
const H = 1200;

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

function buildJson(bg: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Template builder ────────────────────────────────────────────────────────

function buildInfographic(opts: {
  bg: string;
  primary: string;
  secondary: string;
  textColor: string;
  subColor: string;
  headingFont: string;
  bodyFont: string;
}): string {
  const { bg, primary, secondary, textColor, subColor, headingFont, bodyFont } = opts;

  const colW = (W - 120) / 3;

  const objects: Record<string, unknown>[] = [
    // Header band
    rect("inf-header-band", {
      left: 0, top: 0, width: W, height: 200,
      fill: primary,
    }),
    // Accent line in header
    rect("inf-header-accent", {
      left: 60, top: 170, width: 80, height: 4,
      fill: secondary,
    }),
    // Title
    txt("inf-title", "Data-Driven Insights", {
      left: 60, top: 50, width: W - 120, fontSize: 42,
      fontFamily: headingFont, fontWeight: "800", fill: "#ffffff",
      lineHeight: 1.15,
    }),
    // Subtitle
    txt("inf-subtitle", "Key findings from our 2025 research report", {
      left: 60, top: 120, width: W - 120, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "400", fill: "#ffffffcc",
    }),
    // Section: Statistics
    txt("inf-stats-heading", "Key Statistics", {
      left: 60, top: 230, width: 300, fontSize: 22,
      fontFamily: headingFont, fontWeight: "700", fill: textColor,
    }),
    // Stat 1
    rect("inf-stat-1-card", {
      left: 40, top: 270, width: colW, height: 100,
      fill: primary, rx: 8, ry: 8, opacity: 0.1,
    }),
    txt("inf-stat-1-value", "85%", {
      left: 40, top: 282, width: colW, fontSize: 36,
      fontFamily: headingFont, fontWeight: "800", fill: primary,
      textAlign: "center",
    }),
    txt("inf-stat-1-label", "Success Rate", {
      left: 40, top: 330, width: colW, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "500", fill: subColor,
      textAlign: "center",
    }),
    // Stat 2
    rect("inf-stat-2-card", {
      left: 40 + colW + 20, top: 270, width: colW, height: 100,
      fill: primary, rx: 8, ry: 8, opacity: 0.1,
    }),
    txt("inf-stat-2-value", "2.4M", {
      left: 40 + colW + 20, top: 282, width: colW, fontSize: 36,
      fontFamily: headingFont, fontWeight: "800", fill: primary,
      textAlign: "center",
    }),
    txt("inf-stat-2-label", "Users Reached", {
      left: 40 + colW + 20, top: 330, width: colW, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "500", fill: subColor,
      textAlign: "center",
    }),
    // Stat 3
    rect("inf-stat-3-card", {
      left: 40 + (colW + 20) * 2, top: 270, width: colW, height: 100,
      fill: primary, rx: 8, ry: 8, opacity: 0.1,
    }),
    txt("inf-stat-3-value", "150+", {
      left: 40 + (colW + 20) * 2, top: 282, width: colW, fontSize: 36,
      fontFamily: headingFont, fontWeight: "800", fill: primary,
      textAlign: "center",
    }),
    txt("inf-stat-3-label", "Countries", {
      left: 40 + (colW + 20) * 2, top: 330, width: colW, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "500", fill: subColor,
      textAlign: "center",
    }),
    // Divider
    line("inf-divider-1", 60, 400, W - 60, 400, {
      left: 60, top: 400, stroke: primary, strokeWidth: 1, opacity: 0.2,
    }),
    // Section: Process
    txt("inf-process-heading", "Our Process", {
      left: 60, top: 420, width: 300, fontSize: 22,
      fontFamily: headingFont, fontWeight: "700", fill: textColor,
    }),
    // Step 1
    circle("inf-step-1-circle", {
      left: 80, top: 470, radius: 20,
      fill: primary,
    }),
    txt("inf-step-1-num", "1", {
      left: 80, top: 478, width: 40, fontSize: 18,
      fontFamily: headingFont, fontWeight: "700", fill: "#ffffff",
      textAlign: "center",
    }),
    txt("inf-step-1", "Research & Discovery", {
      left: 140, top: 478, width: 400, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "600", fill: textColor,
    }),
    // Step 2
    circle("inf-step-2-circle", {
      left: 80, top: 530, radius: 20,
      fill: secondary,
    }),
    txt("inf-step-2-num", "2", {
      left: 80, top: 538, width: 40, fontSize: 18,
      fontFamily: headingFont, fontWeight: "700", fill: "#ffffff",
      textAlign: "center",
    }),
    txt("inf-step-2", "Design & Develop", {
      left: 140, top: 538, width: 400, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "600", fill: textColor,
    }),
    // Step 3
    circle("inf-step-3-circle", {
      left: 80, top: 590, radius: 20,
      fill: primary,
    }),
    txt("inf-step-3-num", "3", {
      left: 80, top: 598, width: 40, fontSize: 18,
      fontFamily: headingFont, fontWeight: "700", fill: "#ffffff",
      textAlign: "center",
    }),
    txt("inf-step-3", "Test & Deploy", {
      left: 140, top: 598, width: 400, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "600", fill: textColor,
    }),
    // Footer band
    rect("inf-footer-band", {
      left: 0, top: H - 80, width: W, height: 80,
      fill: primary, opacity: 0.1,
    }),
    // Footer
    txt("inf-footer", "www.dmsuite.com — Lusaka, Zambia", {
      left: 60, top: H - 55, width: W - 120, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "500", fill: subColor,
      textAlign: "center",
    }),
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const INFOGRAPHIC_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "infographic-electric",
    name: "Electric Lime",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInfographic({
      bg: "#0f172a",
      primary: "#84cc16",
      secondary: "#06b6d4",
      textColor: "#e2e8f0",
      subColor: "#94a3b8",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "infographic-corporate",
    name: "Corporate Blue",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInfographic({
      bg: "#ffffff",
      primary: "#1e40af",
      secondary: "#3b82f6",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "infographic-sunset",
    name: "Sunset Orange",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInfographic({
      bg: "#1c1917",
      primary: "#ea580c",
      secondary: "#facc15",
      textColor: "#e2e8f0",
      subColor: "#a8a29e",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "infographic-ocean",
    name: "Ocean Blue",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInfographic({
      bg: "#082f49",
      primary: "#0284c7",
      secondary: "#67e8f9",
      textColor: "#e2e8f0",
      subColor: "#94a3b8",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "infographic-forest",
    name: "Forest Green",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInfographic({
      bg: "#052e16",
      primary: "#16a34a",
      secondary: "#86efac",
      textColor: "#e2e8f0",
      subColor: "#94a3b8",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "infographic-monochrome",
    name: "Monochrome",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildInfographic({
      bg: "#fafafa",
      primary: "#18181b",
      secondary: "#71717a",
      textColor: "#18181b",
      subColor: "#71717a",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "infographic-berry",
    name: "Berry Purple",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInfographic({
      bg: "#1e1b4b",
      primary: "#9333ea",
      secondary: "#c084fc",
      textColor: "#e2e8f0",
      subColor: "#94a3b8",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "infographic-coral",
    name: "Coral Rose",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInfographic({
      bg: "#18181b",
      primary: "#f43f5e",
      secondary: "#fda4af",
      textColor: "#e2e8f0",
      subColor: "#a1a1aa",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "infographic-teal-clean",
    name: "Teal Clean",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildInfographic({
      bg: "#ffffff",
      primary: "#0f766e",
      secondary: "#2dd4bf",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "infographic-amber-warm",
    name: "Amber Warm",
    category: "infographic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInfographic({
      bg: "#1c1917",
      primary: "#f59e0b",
      secondary: "#fbbf24",
      textColor: "#e2e8f0",
      subColor: "#a8a29e",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
];
