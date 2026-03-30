/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Presentation Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Presentation Designer.
 *  Default canvas: 16:9 widescreen — 960 × 540 px.
 *
 *  Named objects for quick-edit targeting:
 *    pres-title, pres-subtitle, pres-body, pres-author, pres-date,
 *    pres-bullet-1, pres-bullet-2, pres-bullet-3, pres-bullet-4,
 *    pres-heading-left, pres-body-left, pres-heading-right, pres-body-right,
 *    pres-quote-text, pres-quote-author, pres-section-title,
 *    pres-slide-number, pres-company
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 960;
const H = 540;

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
    styles: [],
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
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1) || 0,
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

// ═══════════════════════════════════════════════════════════════════════════
// Template Builders — Each creates a different slide layout
// ═══════════════════════════════════════════════════════════════════════════

// ── 1. Title Slide — Midnight ────────────────────────────────────────────

function buildMidnightTitle(): string {
  return buildJson("#0f172a", [
    // Large accent bar at top
    rect("pres-accent-bar", {
      left: 0, top: 0, width: W, height: 6,
      fill: "#3b82f6", selectable: false,
    }),
    // Decorative circle (top right)
    circle("pres-deco-circle", {
      left: 720, top: -60, radius: 180,
      fill: "#1e3a5f", opacity: 0.4,
    }),
    // Company name
    txt("pres-company", "DMSUITE", {
      left: 60, top: 40, width: 300, fontSize: 12,
      fontFamily: "Inter", fontWeight: "600", fill: "#60a5fa",
      charSpacing: 400, opacity: 0.8,
    }),
    // Main title
    txt("pres-title", "Quarterly Business\nReview 2026", {
      left: 60, top: 160, width: 600, fontSize: 48,
      fontFamily: "Inter", fontWeight: "800", fill: "#f1f5f9",
      lineHeight: 1.15,
    }),
    // Subtitle
    txt("pres-subtitle", "A comprehensive overview of our growth,\nchallenges, and strategic direction.", {
      left: 60, top: 330, width: 550, fontSize: 18,
      fontFamily: "Inter", fontWeight: "400", fill: "#94a3b8",
      lineHeight: 1.5,
    }),
    // Author + Date
    txt("pres-author", "Presented by John Doe", {
      left: 60, top: 460, width: 300, fontSize: 13,
      fontFamily: "Inter", fontWeight: "500", fill: "#64748b",
    }),
    txt("pres-date", "March 2026", {
      left: 60, top: 485, width: 200, fontSize: 12,
      fontFamily: "Inter", fontWeight: "400", fill: "#475569",
    }),
    // Slide number
    txt("pres-slide-number", "01", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#475569",
      textAlign: "right",
    }),
  ]);
}

// ── 2. Content Slide — Midnight ──────────────────────────────────────────

function buildMidnightContent(): string {
  return buildJson("#0f172a", [
    // Left accent bar
    rect("pres-side-accent", {
      left: 0, top: 0, width: 4, height: H,
      fill: "#3b82f6", selectable: false,
    }),
    // Heading
    txt("pres-title", "Key Highlights", {
      left: 60, top: 50, width: 840, fontSize: 32,
      fontFamily: "Inter", fontWeight: "700", fill: "#f1f5f9",
    }),
    // Separator line
    line("pres-sep", 60, 100, 200, 100, {
      stroke: "#3b82f6", strokeWidth: 3,
    }),
    // Body text
    txt("pres-body", "Our team has achieved significant milestones across all departments this quarter. Revenue increased by 34% compared to the same period last year, driven by new product launches and expanded market reach.\n\nCustomer satisfaction scores hit an all-time high of 94%, while our employee retention rate improved to 97%. These numbers reflect our commitment to excellence in every area of the business.", {
      left: 60, top: 120, width: 840, fontSize: 16,
      fontFamily: "Inter", fontWeight: "400", fill: "#cbd5e1",
      lineHeight: 1.7,
    }),
    // Company watermark
    txt("pres-company", "DMSUITE", {
      left: 60, top: 500, width: 200, fontSize: 10,
      fontFamily: "Inter", fontWeight: "600", fill: "#334155",
      charSpacing: 300,
    }),
    txt("pres-slide-number", "02", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#475569",
      textAlign: "right",
    }),
  ]);
}

// ── 3. Bullets Slide — Midnight ──────────────────────────────────────────

function buildMidnightBullets(): string {
  return buildJson("#0f172a", [
    rect("pres-side-accent", {
      left: 0, top: 0, width: 4, height: H,
      fill: "#3b82f6", selectable: false,
    }),
    txt("pres-title", "Strategic Priorities", {
      left: 60, top: 50, width: 840, fontSize: 32,
      fontFamily: "Inter", fontWeight: "700", fill: "#f1f5f9",
    }),
    line("pres-sep", 60, 100, 200, 100, {
      stroke: "#3b82f6", strokeWidth: 3,
    }),
    // Bullet items with number accents
    rect("pres-bullet-bg-1", {
      left: 60, top: 130, width: 840, height: 70,
      fill: "#1e293b", rx: 8, ry: 8,
    }),
    txt("pres-bullet-1", "Expand into 3 new African markets — Kenya, Tanzania, and Nigeria — by Q3 2026 with localized content and partnerships.", {
      left: 90, top: 145, width: 790, fontSize: 14,
      fontFamily: "Inter", fontWeight: "400", fill: "#e2e8f0",
      lineHeight: 1.5,
    }),
    rect("pres-bullet-bg-2", {
      left: 60, top: 215, width: 840, height: 70,
      fill: "#1e293b", rx: 8, ry: 8,
    }),
    txt("pres-bullet-2", "Launch the DMSuite Enterprise plan with team collaboration features, SSO authentication, and dedicated account management support.", {
      left: 90, top: 230, width: 790, fontSize: 14,
      fontFamily: "Inter", fontWeight: "400", fill: "#e2e8f0",
      lineHeight: 1.5,
    }),
    rect("pres-bullet-bg-3", {
      left: 60, top: 300, width: 840, height: 70,
      fill: "#1e293b", rx: 8, ry: 8,
    }),
    txt("pres-bullet-3", "Achieve 10,000 active monthly users with a 15% conversion rate from free to paid subscriptions through improved onboarding.", {
      left: 90, top: 315, width: 790, fontSize: 14,
      fontFamily: "Inter", fontWeight: "400", fill: "#e2e8f0",
      lineHeight: 1.5,
    }),
    rect("pres-bullet-bg-4", {
      left: 60, top: 385, width: 840, height: 70,
      fill: "#1e293b", rx: 8, ry: 8,
    }),
    txt("pres-bullet-4", "Reduce customer churn to below 3% through proactive support, feature upgrades, and a comprehensive loyalty rewards program.", {
      left: 90, top: 400, width: 790, fontSize: 14,
      fontFamily: "Inter", fontWeight: "400", fill: "#e2e8f0",
      lineHeight: 1.5,
    }),
    txt("pres-company", "DMSUITE", {
      left: 60, top: 500, width: 200, fontSize: 10,
      fontFamily: "Inter", fontWeight: "600", fill: "#334155",
      charSpacing: 300,
    }),
    txt("pres-slide-number", "03", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#475569",
      textAlign: "right",
    }),
  ]);
}

// ── 4. Two-Column Slide — Midnight ───────────────────────────────────────

function buildMidnightTwoColumn(): string {
  const colW = 400;
  return buildJson("#0f172a", [
    rect("pres-side-accent", {
      left: 0, top: 0, width: 4, height: H,
      fill: "#3b82f6", selectable: false,
    }),
    txt("pres-title", "Revenue vs. Expenses", {
      left: 60, top: 50, width: 840, fontSize: 32,
      fontFamily: "Inter", fontWeight: "700", fill: "#f1f5f9",
    }),
    line("pres-sep", 60, 100, 200, 100, {
      stroke: "#3b82f6", strokeWidth: 3,
    }),
    // Left column
    rect("pres-col-left-bg", {
      left: 60, top: 120, width: colW, height: 350,
      fill: "#1e293b", rx: 10, ry: 10,
    }),
    txt("pres-heading-left", "Revenue Growth", {
      left: 85, top: 140, width: colW - 50, fontSize: 20,
      fontFamily: "Inter", fontWeight: "700", fill: "#3b82f6",
    }),
    txt("pres-body-left", "Total revenue for Q1 reached $2.4M, representing a 34% year-over-year increase. Our SaaS subscriptions grew 45% while enterprise deals contributed $800K in new contracts.", {
      left: 85, top: 180, width: colW - 50, fontSize: 13,
      fontFamily: "Inter", fontWeight: "400", fill: "#cbd5e1",
      lineHeight: 1.7,
    }),
    // Divider
    line("pres-col-div", W / 2, 140, W / 2, 440, {
      stroke: "#334155", strokeWidth: 1, strokeDashArray: [4, 4],
    }),
    // Right column
    rect("pres-col-right-bg", {
      left: 500, top: 120, width: colW, height: 350,
      fill: "#1e293b", rx: 10, ry: 10,
    }),
    txt("pres-heading-right", "Cost Optimization", {
      left: 525, top: 140, width: colW - 50, fontSize: 20,
      fontFamily: "Inter", fontWeight: "700", fill: "#10b981",
    }),
    txt("pres-body-right", "Operating expenses decreased by 12% through strategic automation and vendor renegotiation. Cloud infrastructure costs were reduced by $120K annually through autoscaling.", {
      left: 525, top: 180, width: colW - 50, fontSize: 13,
      fontFamily: "Inter", fontWeight: "400", fill: "#cbd5e1",
      lineHeight: 1.7,
    }),
    txt("pres-company", "DMSUITE", {
      left: 60, top: 500, width: 200, fontSize: 10,
      fontFamily: "Inter", fontWeight: "600", fill: "#334155",
      charSpacing: 300,
    }),
    txt("pres-slide-number", "04", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#475569",
      textAlign: "right",
    }),
  ]);
}

// ── 5. Quote Slide — Midnight ────────────────────────────────────────────

function buildMidnightQuote(): string {
  return buildJson("#0f172a", [
    // Large decorative quote mark
    txt("pres-quote-deco", "\u201C", {
      left: 60, top: 80, width: 200, fontSize: 160,
      fontFamily: "Georgia", fontWeight: "700", fill: "#3b82f6",
      opacity: 0.2, selectable: false,
    }),
    // Quote text
    txt("pres-quote-text", "The best way to predict the future is to create it. Every tool we build is a step toward making African businesses world-class.", {
      left: 120, top: 180, width: 720, fontSize: 24,
      fontFamily: "Georgia", fontWeight: "400", fill: "#f1f5f9",
      fontStyle: "italic", lineHeight: 1.6, textAlign: "center",
    }),
    // Quote attribution line
    line("pres-quote-line", 420, 360, 540, 360, {
      stroke: "#3b82f6", strokeWidth: 2,
    }),
    // Quote author
    txt("pres-quote-author", "— Drake Mumba, Founder & CEO", {
      left: 120, top: 380, width: 720, fontSize: 14,
      fontFamily: "Inter", fontWeight: "600", fill: "#64748b",
      textAlign: "center",
    }),
    txt("pres-company", "DMSUITE", {
      left: 60, top: 500, width: 200, fontSize: 10,
      fontFamily: "Inter", fontWeight: "600", fill: "#334155",
      charSpacing: 300,
    }),
    txt("pres-slide-number", "05", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#475569",
      textAlign: "right",
    }),
  ]);
}

// ── 6. Corporate White Title ─────────────────────────────────────────────

function buildCorporateTitle(): string {
  return buildJson("#ffffff", [
    // Top accent stripe
    rect("pres-accent-bar", {
      left: 0, top: 0, width: W, height: 8,
      fill: "#1e40af", selectable: false,
    }),
    // Left color block
    rect("pres-side-panel", {
      left: 0, top: 8, width: 320, height: H - 8,
      fill: "#1e3a5f",
    }),
    // Company name (over blue panel)
    txt("pres-company", "DMSUITE", {
      left: 40, top: 50, width: 240, fontSize: 13,
      fontFamily: "Inter", fontWeight: "700", fill: "#93c5fd",
      charSpacing: 400,
    }),
    // Title (over blue panel)
    txt("pres-title", "Annual\nReport\n2026", {
      left: 40, top: 150, width: 250, fontSize: 42,
      fontFamily: "Inter", fontWeight: "800", fill: "#ffffff",
      lineHeight: 1.2,
    }),
    // Date
    txt("pres-date", "March 30, 2026", {
      left: 40, top: 420, width: 240, fontSize: 12,
      fontFamily: "Inter", fontWeight: "500", fill: "#93c5fd",
    }),
    // Right side content
    txt("pres-subtitle", "A comprehensive review of our yearly performance, strategic initiatives, and the roadmap for the year ahead.", {
      left: 370, top: 180, width: 540, fontSize: 18,
      fontFamily: "Inter", fontWeight: "400", fill: "#475569",
      lineHeight: 1.6,
    }),
    txt("pres-author", "Presented by the Executive Team", {
      left: 370, top: 350, width: 400, fontSize: 14,
      fontFamily: "Inter", fontWeight: "600", fill: "#1e40af",
    }),
    // Decorative line
    line("pres-deco-line", 370, 160, 560, 160, {
      stroke: "#1e40af", strokeWidth: 2,
    }),
    txt("pres-slide-number", "01", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#94a3b8",
      textAlign: "right",
    }),
  ]);
}

// ── 7. Corporate Content Slide ───────────────────────────────────────────

function buildCorporateContent(): string {
  return buildJson("#ffffff", [
    rect("pres-accent-bar", {
      left: 0, top: 0, width: W, height: 4,
      fill: "#1e40af", selectable: false,
    }),
    txt("pres-title", "Market Expansion Strategy", {
      left: 60, top: 50, width: 600, fontSize: 30,
      fontFamily: "Inter", fontWeight: "700", fill: "#1e293b",
    }),
    line("pres-sep", 60, 95, 180, 95, {
      stroke: "#1e40af", strokeWidth: 3,
    }),
    txt("pres-body", "Our market expansion strategy focuses on three key pillars: geographic diversification across the African continent, vertical deepening within existing markets, and strategic partnerships with local enterprises.\n\nBy leveraging our technology platform and understanding of local business needs, we are positioned to capture significant market share in the rapidly growing African SaaS sector. Our goal is to establish a presence in 10 countries by end of 2027.", {
      left: 60, top: 115, width: 840, fontSize: 15,
      fontFamily: "Inter", fontWeight: "400", fill: "#475569",
      lineHeight: 1.7,
    }),
    // Key metrics bar
    rect("pres-metrics-bg", {
      left: 60, top: 380, width: 840, height: 80,
      fill: "#f1f5f9", rx: 8, ry: 8,
    }),
    txt("pres-bullet-1", "$2.4M Revenue", {
      left: 100, top: 395, width: 180, fontSize: 16,
      fontFamily: "Inter", fontWeight: "700", fill: "#1e40af",
      textAlign: "center",
    }),
    txt("pres-bullet-2", "34% Growth", {
      left: 320, top: 395, width: 180, fontSize: 16,
      fontFamily: "Inter", fontWeight: "700", fill: "#1e40af",
      textAlign: "center",
    }),
    txt("pres-bullet-3", "10K Users", {
      left: 540, top: 395, width: 180, fontSize: 16,
      fontFamily: "Inter", fontWeight: "700", fill: "#1e40af",
      textAlign: "center",
    }),
    txt("pres-bullet-4", "94% CSAT", {
      left: 760, top: 395, width: 100, fontSize: 16,
      fontFamily: "Inter", fontWeight: "700", fill: "#1e40af",
      textAlign: "center",
    }),
    txt("pres-company", "DMSUITE", {
      left: 60, top: 500, width: 200, fontSize: 10,
      fontFamily: "Inter", fontWeight: "600", fill: "#94a3b8",
      charSpacing: 300,
    }),
    txt("pres-slide-number", "02", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#94a3b8",
      textAlign: "right",
    }),
  ]);
}

// ── 8. Gradient Title — Sunset ───────────────────────────────────────────

function buildSunsetTitle(): string {
  return buildJson("#1a0a2e", [
    // Gradient overlay simulation (layered rects)
    rect("pres-gradient-1", {
      left: 0, top: 0, width: W, height: H,
      fill: "#2d1b4e", opacity: 0.6, selectable: false,
    }),
    rect("pres-gradient-2", {
      left: W * 0.4, top: 0, width: W * 0.6, height: H,
      fill: "#4a1942", opacity: 0.4, selectable: false,
    }),
    // Accent orb
    circle("pres-orb", {
      left: 650, top: 50, radius: 200,
      fill: "#e11d48", opacity: 0.12,
    }),
    // Company
    txt("pres-company", "DMSUITE", {
      left: 60, top: 40, width: 200, fontSize: 12,
      fontFamily: "Inter", fontWeight: "700", fill: "#f472b6",
      charSpacing: 400,
    }),
    // Title
    txt("pres-title", "Product Launch\n2026", {
      left: 60, top: 140, width: 550, fontSize: 52,
      fontFamily: "Inter", fontWeight: "800", fill: "#fdf2f8",
      lineHeight: 1.1,
    }),
    // Subtitle
    txt("pres-subtitle", "Introducing our next generation of AI-powered\ncreative tools for African businesses.", {
      left: 60, top: 320, width: 500, fontSize: 17,
      fontFamily: "Inter", fontWeight: "400", fill: "#f9a8d4",
      lineHeight: 1.5,
    }),
    txt("pres-author", "Drake Mumba", {
      left: 60, top: 460, width: 200, fontSize: 14,
      fontFamily: "Inter", fontWeight: "600", fill: "#f472b6",
    }),
    txt("pres-date", "March 2026", {
      left: 60, top: 485, width: 200, fontSize: 12,
      fontFamily: "Inter", fontWeight: "400", fill: "#9d174d",
    }),
    txt("pres-slide-number", "01", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#9d174d",
      textAlign: "right",
    }),
  ]);
}

// ── 9. Minimal Green — Section Divider ───────────────────────────────────

function buildGreenSection(): string {
  return buildJson("#f0fdf4", [
    // Side accent
    rect("pres-side-accent", {
      left: 0, top: 0, width: 8, height: H,
      fill: "#16a34a", selectable: false,
    }),
    // Section number
    txt("pres-section-title", "02", {
      left: 80, top: 120, width: 200, fontSize: 96,
      fontFamily: "JetBrains Mono", fontWeight: "800", fill: "#bbf7d0",
    }),
    // Section heading
    txt("pres-title", "Growth\nMetrics", {
      left: 80, top: 240, width: 500, fontSize: 48,
      fontFamily: "Inter", fontWeight: "800", fill: "#14532d",
      lineHeight: 1.15,
    }),
    // Subtitle
    txt("pres-subtitle", "Tracking our progress across key business indicators", {
      left: 80, top: 380, width: 500, fontSize: 16,
      fontFamily: "Inter", fontWeight: "400", fill: "#4ade80",
    }),
    // Decorative line
    line("pres-deco-line", 80, 420, 280, 420, {
      stroke: "#16a34a", strokeWidth: 3,
    }),
    txt("pres-company", "DMSUITE", {
      left: 60, top: 500, width: 200, fontSize: 10,
      fontFamily: "Inter", fontWeight: "600", fill: "#86efac",
      charSpacing: 300,
    }),
    txt("pres-slide-number", "06", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#86efac",
      textAlign: "right",
    }),
  ]);
}

// ── 10. Blank Slide ──────────────────────────────────────────────────────

function buildBlankSlide(): string {
  return buildJson("#0f172a", [
    txt("pres-title", "Untitled Slide", {
      left: 60, top: 50, width: 840, fontSize: 32,
      fontFamily: "Inter", fontWeight: "700", fill: "#f1f5f9",
    }),
    txt("pres-body", "Start typing your content here...", {
      left: 60, top: 120, width: 840, fontSize: 16,
      fontFamily: "Inter", fontWeight: "400", fill: "#94a3b8",
      lineHeight: 1.7,
    }),
    txt("pres-company", "DMSUITE", {
      left: 60, top: 500, width: 200, fontSize: 10,
      fontFamily: "Inter", fontWeight: "600", fill: "#334155",
      charSpacing: 300,
    }),
    txt("pres-slide-number", "", {
      left: 890, top: 500, width: 50, fontSize: 11,
      fontFamily: "JetBrains Mono", fontWeight: "600", fill: "#475569",
      textAlign: "right",
    }),
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════
// Exported Templates
// ═══════════════════════════════════════════════════════════════════════════

export const PRESENTATION_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "pres-midnight-title",
    name: "Midnight Title",
    category: "Title Slides",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMidnightTitle(),
  },
  {
    id: "pres-midnight-content",
    name: "Midnight Content",
    category: "Content Slides",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMidnightContent(),
  },
  {
    id: "pres-midnight-bullets",
    name: "Midnight Bullets",
    category: "Content Slides",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMidnightBullets(),
  },
  {
    id: "pres-midnight-two-column",
    name: "Midnight Two-Column",
    category: "Content Slides",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMidnightTwoColumn(),
  },
  {
    id: "pres-midnight-quote",
    name: "Midnight Quote",
    category: "Quote Slides",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMidnightQuote(),
  },
  {
    id: "pres-corporate-title",
    name: "Corporate Title",
    category: "Title Slides",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCorporateTitle(),
  },
  {
    id: "pres-corporate-content",
    name: "Corporate Content",
    category: "Content Slides",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCorporateContent(),
  },
  {
    id: "pres-sunset-title",
    name: "Sunset Title",
    category: "Title Slides",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSunsetTitle(),
  },
  {
    id: "pres-green-section",
    name: "Green Section Divider",
    category: "Section Slides",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildGreenSection(),
  },
  {
    id: "pres-blank",
    name: "Blank Slide",
    category: "Basic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBlankSlide(),
  },
];
