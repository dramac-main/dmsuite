// =============================================================================
// DMSuite — Banner Ad Fabric.js Templates
// IAB-standard banner ad designs as Fabric.js JSON.
// Default canvas: 300 × 250 px (Medium Rectangle — most common IAB size)
// =============================================================================

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 300;
const H = 250;

// ── Helpers ─────────────────────────────────────────────────────────────────

function bg(fill: string) {
  return { type: "rect", left: 0, top: 0, width: W, height: H, fill, selectable: false, evented: false, name: "background" };
}

function headline(text: string, opts: Record<string, unknown> = {}) {
  return {
    type: "textbox", name: "ban-headline", text, styles: [], width: W - 40,
    left: 20, top: 30, fontSize: 24, fontWeight: "bold", fontFamily: "Inter",
    fill: "#ffffff", textAlign: "left", ...opts,
  };
}

function subtext(text: string, opts: Record<string, unknown> = {}) {
  return {
    type: "textbox", name: "ban-subtext", text, styles: [], width: W - 40,
    left: 20, top: 80, fontSize: 13, fontFamily: "Inter",
    fill: "#ffffffcc", textAlign: "left", ...opts,
  };
}

function ctaButton(text: string, btnFill: string, textFill: string, opts: Record<string, unknown> = {}) {
  const btnLeft = opts.btnLeft as number ?? 20;
  const btnTop = opts.btnTop as number ?? 190;
  const btnW = opts.btnW as number ?? 120;
  const btnH = opts.btnH as number ?? 36;
  delete opts.btnLeft; delete opts.btnTop; delete opts.btnW; delete opts.btnH;
  return [
    { type: "rect", name: "ban-cta-bg", left: btnLeft, top: btnTop, width: btnW, height: btnH, fill: btnFill, rx: 4, ry: 4, ...opts },
    { type: "textbox", name: "ban-cta-text", text, styles: [], left: btnLeft + 10, top: btnTop + 9, width: btnW - 20, fontSize: 13, fontWeight: "bold", fontFamily: "Inter", fill: textFill, textAlign: "center" },
  ];
}

function brand(text: string, opts: Record<string, unknown> = {}) {
  return {
    type: "textbox", name: "ban-brand-name", text, styles: [], width: W - 40,
    left: 20, top: H - 30, fontSize: 10, fontFamily: "Inter",
    fill: "#ffffff88", textAlign: "left", ...opts,
  };
}

function buildJson(background: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background });
}

// ── Templates ───────────────────────────────────────────────────────────────

export const BANNER_AD_FABRIC_TEMPLATES: FabricTemplate[] = [
  // 1 — Corporate Blue
  {
    id: "ban-corporate-blue",
    name: "Corporate Blue",
    category: "standard",
    isPro: false,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#1e40af", [
      bg("#1e40af"),
      { type: "rect", left: 0, top: 0, width: 6, height: H, fill: "#3b82f6", selectable: false, evented: false },
      headline("Boost Your\nBusiness", { fill: "#ffffff" }),
      subtext("Professional solutions for growth.", { fill: "#cbd5e1" }),
      ...ctaButton("Learn More", "#3b82f6", "#ffffff"),
      brand("DMSuite", { fill: "#ffffff66" }),
    ]),
  },

  // 2 — Dark Lime
  {
    id: "ban-dark-lime",
    name: "Dark Lime",
    category: "standard",
    isPro: false,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#0a0a0a", [
      bg("#0a0a0a"),
      { type: "rect", left: 0, top: H - 4, width: W, height: 4, fill: "#84cc16", selectable: false, evented: false },
      headline("SPECIAL\nOFFER", { fill: "#84cc16", fontSize: 28, fontWeight: "900" }),
      subtext("Get started with our premium plan.", { fill: "#a3a3a3" }),
      ...ctaButton("Get Started", "#84cc16", "#0a0a0a"),
      brand("DMSuite", { fill: "#52525288" }),
    ]),
  },

  // 3 — Gradient Sunset
  {
    id: "ban-gradient-sunset",
    name: "Gradient Sunset",
    category: "premium",
    isPro: false,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#1a0005", [
      bg("#1a0005"),
      { type: "rect", left: 0, top: 0, width: W, height: H, fill: "", selectable: false, evented: false,
        gradientFill: { type: "linear", coords: { x1: 0, y1: 0, x2: W, y2: H }, colorStops: [
          { offset: 0, color: "#ef4444" }, { offset: 1, color: "#f97316" },
        ]},
      },
      headline("Transform\nYour Reach", { fill: "#ffffff", fontSize: 26 }),
      subtext("Digital advertising that works.", { fill: "#ffffffbb", top: 90 }),
      ...ctaButton("Start Now", "#ffffff", "#ef4444"),
      brand("DMSuite", { fill: "#ffffff55" }),
    ]),
  },

  // 4 — Clean White
  {
    id: "ban-clean-white",
    name: "Clean White",
    category: "standard",
    isPro: false,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#ffffff", [
      bg("#ffffff"),
      { type: "rect", left: 0, top: 0, width: W, height: 3, fill: "#3b82f6", selectable: false, evented: false },
      headline("Smart Ad\nSolutions", { fill: "#1e293b" }),
      subtext("Reach the right audience, every time.", { fill: "#64748b" }),
      ...ctaButton("Learn More", "#3b82f6", "#ffffff"),
      brand("DMSuite", { fill: "#94a3b833" }),
    ]),
  },

  // 5 — Indigo Elegant
  {
    id: "ban-indigo-elegant",
    name: "Indigo Elegant",
    category: "premium",
    isPro: false,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#1e1b4b", [
      bg("#1e1b4b"),
      { type: "rect", left: W - 80, top: 0, width: 80, height: H, fill: "#4f46e5", opacity: 0.3, selectable: false, evented: false },
      headline("Premium\nBranding", { fill: "#e0e7ff", fontSize: 26 }),
      subtext("Elevate your digital presence.", { fill: "#a5b4fc" }),
      ...ctaButton("Discover", "#6366f1", "#ffffff"),
      brand("DMSuite", { fill: "#6366f155" }),
    ]),
  },

  // 6 — Amber Bold (Pro)
  {
    id: "ban-amber-bold",
    name: "Amber Bold",
    category: "premium",
    isPro: true,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#1a1400", [
      bg("#1a1400"),
      { type: "rect", left: 0, top: 0, width: W, height: 60, fill: "#f59e0b", selectable: false, evented: false },
      headline("LIMITED\nTIME DEAL", { fill: "#f59e0b", top: 80, fontSize: 28, fontWeight: "900" }),
      subtext("Don't miss this opportunity.", { fill: "#fbbf2488", top: 140 }),
      ...ctaButton("Shop Now", "#f59e0b", "#1a1400", { btnTop: 186 }),
      brand("DMSuite", { fill: "#f59e0b33", top: H - 22 }),
    ]),
  },

  // 7 — Teal Modern
  {
    id: "ban-teal-modern",
    name: "Teal Modern",
    category: "standard",
    isPro: false,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#042f2e", [
      bg("#042f2e"),
      { type: "rect", left: 20, top: 20, width: W - 40, height: H - 40, fill: "", stroke: "#14b8a6", strokeWidth: 1.5, rx: 8, ry: 8, selectable: false, evented: false },
      headline("Grow Your\nAudience", { fill: "#5eead4", left: 30, top: 35, fontSize: 22 }),
      subtext("Data-driven advertising solutions.", { fill: "#99f6e488", left: 30, top: 90 }),
      ...ctaButton("Get Started", "#14b8a6", "#042f2e", { btnLeft: 30, btnTop: 170, btnW: 100 }),
      brand("DMSuite", { fill: "#14b8a644", left: W - 90, top: H - 35, textAlign: "right" as const }),
    ]),
  },

  // 8 — Red Impact
  {
    id: "ban-red-impact",
    name: "Red Impact",
    category: "standard",
    isPro: false,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#dc2626", [
      bg("#dc2626"),
      headline("BIG SALE\nNOW ON", { fill: "#ffffff", fontSize: 30, fontWeight: "900" }),
      subtext("Up to 50% off everything.", { fill: "#fecaca", top: 100 }),
      ...ctaButton("Shop Now", "#ffffff", "#dc2626", { btnTop: 185 }),
      brand("DMSuite", { fill: "#ffffff44" }),
    ]),
  },

  // 9 — Purple Luxe (Pro)
  {
    id: "ban-purple-luxe",
    name: "Purple Luxe",
    category: "premium",
    isPro: true,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#2e1065", [
      bg("#2e1065"),
      { type: "rect", left: W / 2 - 60, top: 10, width: 120, height: 2, fill: "#c084fc", selectable: false, evented: false },
      headline("Luxury\nExperience", { fill: "#e9d5ff", textAlign: "center" as const, left: (W - (W - 40)) / 2, top: 30 }),
      subtext("Redefine your brand identity.", { fill: "#c084fc99", textAlign: "center" as const, top: 95 }),
      ...ctaButton("Explore", "#a855f7", "#ffffff", { btnLeft: (W - 120) / 2 }),
      brand("DMSuite", { fill: "#a855f744", textAlign: "center" as const }),
    ]),
  },

  // 10 — Emerald Fresh
  {
    id: "ban-emerald-fresh",
    name: "Emerald Fresh",
    category: "standard",
    isPro: false,
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildJson("#064e3b", [
      bg("#064e3b"),
      { type: "rect", left: 0, top: 0, width: 4, height: H, fill: "#10b981", selectable: false, evented: false },
      { type: "rect", left: W - 4, top: 0, width: 4, height: H, fill: "#10b981", selectable: false, evented: false },
      headline("Eco-Friendly\nSolutions", { fill: "#a7f3d0", fontSize: 22 }),
      subtext("Sustainable advertising for modern brands.", { fill: "#6ee7b799" }),
      ...ctaButton("Learn More", "#10b981", "#064e3b", { btnTop: 185 }),
      brand("DMSuite", { fill: "#10b98144" }),
    ]),
  },
];
