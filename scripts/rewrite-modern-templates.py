#!/usr/bin/env python3
"""
Rewrite the MODERN TEMPLATES section in business-card-adapter.ts
with pixel-perfect implementations matching the reference images.

Templates #7–#12:
  - cyan-tech
  - corporate-chevron
  - zigzag-overlay
  - hex-split
  - dot-circle
  - wave-gradient
"""

import re

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

# Markers
START_MARKER = "// ===================== MODERN TEMPLATES ====================="
END_MARKER = "// ===================== CLASSIC / CORPORATE TEMPLATES ====================="

NEW_SECTION = r'''// ===================== MODERN TEMPLATES =====================

// ─────────────────────────────────────────────────────────────
// Template #7 — cyan-tech
// Reference: Code Pro Development — Michal Johns
// Dark charcoal bg + organic double-lobe S-curve cyan wave
// ─────────────────────────────────────────────────────────────

function layoutCyanTech(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["cyan-tech"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — dark charcoal
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg),
    tags: ["background"],
  }));

  // Cyan wave — organic double-lobe S-curve from right edge
  // Wave fills from left boundary to right card edge
  const wavePath = [
    M(W, H * 0.36),
    // Lobe 1: sweep left to leftmost point
    C(W * 0.70, H * 0.40, W * 0.50, H * 0.46, W * 0.41, H * 0.54),
    // Lobe 2: sharp right kick then sweep left again
    C(W * 0.60, H * 0.58, W * 0.50, H * 0.62, W * 0.53, H * 0.64),
    // Exit: sweep back right off card
    C(W * 0.60, H * 0.68, W * 0.80, H * 0.80, W, H * 0.88),
    L(W, H * 0.36),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Cyan Wave",
    commands: wavePath,
    fill: solidPaintHex(theme.accent!),
    tags: ["decorative", "wave", "accent"],
  }));

  // Gear/cog icon placeholder (line-art at 31%, 30%)
  // Simplified as a stroked circle with teeth indicators
  const gearCx = Math.round(W * 0.31);
  const gearCy = Math.round(H * 0.30);
  const gearR = Math.round(W * 0.04);
  // Outer gear ring
  layers.push(strokeEllipse({
    name: "Gear Icon",
    cx: gearCx, cy: gearCy, rx: gearR, ry: gearR,
    stroke: makeStroke(theme.frontText, 2.5),
    tags: ["logo", "icon", "gear"],
  }));
  // Inner circle for gear hub
  layers.push(strokeEllipse({
    name: "Gear Hub",
    cx: gearCx, cy: gearCy, rx: Math.round(gearR * 0.4), ry: Math.round(gearR * 0.4),
    stroke: makeStroke(theme.frontText, 2),
    tags: ["logo", "icon"],
  }));
  // Code brackets "< >" text inside gear
  layers.push(styledText({
    name: "Code Brackets",
    x: gearCx - gearR, y: gearCy - Math.round(H * 0.015),
    w: gearR * 2,
    text: "< >",
    fontSize: Math.round(H * 0.028),
    fontFamily: font,
    weight: 700,
    color: theme.frontText,
    align: "center",
    tags: ["logo", "icon"],
  }));

  // Company "CODE PRO" — below gear icon
  layers.push(styledText({
    name: "Company",
    x: Math.round(W * 0.31) - Math.round(W * 0.15), y: Math.round(H * 0.35),
    w: Math.round(W * 0.30),
    text: cfg.company || "CODE PRO",
    fontSize: Math.round(H * 0.035), // 3.5% H ~21px
    fontFamily: font,
    weight: 500,
    color: theme.frontText, // #D6D6D6
    uppercase: true,
    letterSpacing: 3, // ~0.10em
    tags: ["company"],
  }));

  // Tagline "DEVELOPMENT" — below company
  layers.push(styledText({
    name: "Tagline",
    x: Math.round(W * 0.31) - Math.round(W * 0.15), y: Math.round(H * 0.38),
    w: Math.round(W * 0.30),
    text: cfg.tagline || "DEVELOPMENT",
    fontSize: Math.round(H * 0.020), // 2.0% H ~12px
    fontFamily: font,
    weight: 300,
    color: theme.frontText, // #D6D6D6
    uppercase: true,
    letterSpacing: 6, // ~0.20-0.30em
    tags: ["tagline"],
  }));

  // Email — sits ON the cyan wave area at bottom
  layers.push(styledText({
    name: "Email",
    x: Math.round(W * 0.15), y: Math.round(H * 0.85),
    w: Math.round(W * 0.40),
    text: cfg.email || "info@codepro.com",
    fontSize: Math.round(H * 0.022), // 2.2% H ~13px
    fontFamily: font,
    weight: 400,
    color: "#FFFFFF", // Pure white on cyan
    tags: ["contact-email", "contact-text"],
  }));

  return layers;
}

// Register cyan-tech back layout
registerBackLayout("cyan-tech", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — same dark charcoal
  layers.push(filledRect({
    name: "Back Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg),
    tags: ["background", "back-element"],
  }));

  // Mirrored cyan wave — enters from LEFT edge
  const backWavePath = [
    M(0, H * 0.33),
    // Lobe 1: sweep right, narrow, retreat
    C(W * 0.20, H * 0.36, W * 0.32, H * 0.38, W * 0.31, H * 0.40),
    C(W * 0.20, H * 0.42, W * 0.05, H * 0.44, W * 0.05, H * 0.48),
    // Pinch and second lobe
    C(W * 0.15, H * 0.52, W * 0.18, H * 0.58, W * 0.25, H * 0.62),
    C(W * 0.34, H * 0.68, W * 0.34, H * 0.70, W * 0.30, H * 0.75),
    // Exit back to left edge
    C(W * 0.20, H * 0.80, W * 0.02, H * 0.86, 0, H * 0.88),
    L(0, H * 0.33),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Back Cyan Wave",
    commands: backWavePath,
    fill: solidPaintHex(theme.backAccent || "#2DB5E5"),
    tags: ["decorative", "wave", "back-element"],
  }));

  // Name "MICHAL JOHNS" — right zone
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.55), y: Math.round(H * 0.45),
    w: Math.round(W * 0.40),
    text: (cfg.name || "MICHAL JOHNS").toUpperCase(),
    fontSize: Math.round(H * 0.04), // 4% H ~24px
    fontFamily: font,
    weight: 700,
    color: theme.backText,
    uppercase: true,
    tags: ["name", "primary-text", "back-element"],
  }));

  // Contact lines with icons
  const contactItems = [
    { icon: "phone", text: cfg.contacts.phone || "+92 94 56 789", yPct: 0.50 },
    { icon: "email", text: cfg.contacts.email || "info@codepro.com", yPct: 0.53 },
    { icon: "website", text: cfg.contacts.website || "www.company.com", yPct: 0.56 },
    { icon: "address", text: cfg.contacts.address || "Main Street, Your Location", yPct: 0.59 },
  ];

  for (const item of contactItems) {
    if (!item.text) continue;
    // Contact icon placeholder (small circle)
    layers.push(filledEllipse({
      name: `${item.icon} Icon`,
      cx: Math.round(W * 0.53), cy: Math.round(H * item.yPct + H * 0.008),
      rx: Math.round(W * 0.006), ry: Math.round(W * 0.006),
      fill: solidPaintHex(theme.backText),
      tags: ["contact-icon", "back-element"],
    }));
    // Contact text
    layers.push(styledText({
      name: `Contact ${item.icon}`,
      x: Math.round(W * 0.55), y: Math.round(H * item.yPct),
      w: Math.round(W * 0.40),
      text: item.text,
      fontSize: Math.round(H * 0.025), // 2.5% H ~15px
      fontFamily: font,
      weight: 400,
      color: theme.backText,
      tags: ["contact-text", "back-element"],
    }));
  }

  // White triangle logo mark (downward-pointing)
  const triPath = [
    M(W * 0.39, H * 0.72),
    L(W * 0.57, H * 0.72),
    L(W * 0.48, H * 0.80),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Triangle Mark",
    commands: triPath,
    fill: solidPaintHex(theme.backText),
    tags: ["logo", "brand-mark", "back-element"],
  }));

  return layers;
});


// ─────────────────────────────────────────────────────────────
// Template #8 — corporate-chevron
// Reference: Company — Jonathan Doe
// Dark navy base + triple-layer chevron V-shapes
// ─────────────────────────────────────────────────────────────

function layoutCorporateChevron(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["corporate-chevron"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — dark desaturated navy
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg), // #1E2633
    tags: ["background"],
  }));

  // Helper: draw a V-shaped chevron as two parallelogram arms
  // tipX/tipY = starting edge, vtxX/vtxY = vertex point, bandW = arm width
  function chevronVPaths(tipX: number, tipY: number, vtxX: number, vtxY: number, bandW: number): PathCommand[][] {
    const topArm = [
      M(tipX, tipY),
      L(tipX + bandW, tipY),
      L(vtxX + bandW, vtxY),
      L(vtxX, vtxY),
      Z(),
    ];
    const bottomArm = [
      M(vtxX, vtxY),
      L(vtxX + bandW, vtxY),
      L(tipX + bandW, tipY + 2 * (vtxY - tipY)),
      L(tipX, tipY + 2 * (vtxY - tipY)),
      Z(),
    ];
    return [topArm, bottomArm];
  }

  // Dark chevron bands (#1A202A) — behind light chevrons
  const darkBandW = -W * 0.10; // negative = extending left from tip
  const [dV1top, dV1bot] = chevronVPaths(W * 0.46, H * 0.10, W * 0.23, H * 0.54, darkBandW);
  layers.push(pathLayer({
    name: "Dark Chevron V1 Top",
    commands: dV1top,
    fill: solidPaintHex(theme.frontBgAlt || "#1A202A"),
    tags: ["decorative", "chevron"],
  }));
  layers.push(pathLayer({
    name: "Dark Chevron V1 Bot",
    commands: dV1bot,
    fill: solidPaintHex(theme.frontBgAlt || "#1A202A"),
    tags: ["decorative", "chevron"],
  }));

  // Light chevron bands (#324154) — on top
  const lightBandW = W * 0.12;
  const [lV1top, lV1bot] = chevronVPaths(0, H * 0.05, W * 0.22, H * 0.40, lightBandW);
  layers.push(pathLayer({
    name: "Light Chevron V1 Top",
    commands: lV1top,
    fill: solidPaintHex(theme.accent || "#324154"),
    tags: ["decorative", "chevron"],
  }));
  layers.push(pathLayer({
    name: "Light Chevron V1 Bot",
    commands: lV1bot,
    fill: solidPaintHex(theme.accent || "#324154"),
    tags: ["decorative", "chevron"],
  }));

  const [lV2top, lV2bot] = chevronVPaths(0, H * 0.43, W * 0.22, H * 0.78, lightBandW);
  layers.push(pathLayer({
    name: "Light Chevron V2 Top",
    commands: lV2top,
    fill: solidPaintHex(theme.accent || "#324154"),
    tags: ["decorative", "chevron"],
  }));
  layers.push(pathLayer({
    name: "Light Chevron V2 Bot",
    commands: lV2bot,
    fill: solidPaintHex(theme.accent || "#324154"),
    tags: ["decorative", "chevron"],
  }));

  // Company "COMPANY" — right zone at (56%, 46%)
  layers.push(styledText({
    name: "Company",
    x: Math.round(W * 0.56), y: Math.round(H * 0.46),
    w: Math.round(W * 0.33),
    text: (cfg.company || "COMPANY").toUpperCase(),
    fontSize: Math.round(H * 0.114), // 11.4% H ~68px
    fontFamily: font,
    weight: 700,
    color: theme.frontText, // #C8CBD0
    uppercase: true,
    letterSpacing: 5, // ~0.15em
    tags: ["company", "primary-text"],
  }));

  // Tagline — below company
  layers.push(styledText({
    name: "Tagline",
    x: Math.round(W * 0.56), y: Math.round(H * 0.53),
    w: Math.round(W * 0.33),
    text: cfg.tagline || "Your tagline here",
    fontSize: Math.round(H * 0.043), // 4.3% H ~26px
    fontFamily: font,
    weight: 300,
    color: theme.frontTextAlt || "#8090A0",
    letterSpacing: 1, // ~0.02em
    tags: ["tagline"],
  }));

  // Website — bottom right
  layers.push(styledText({
    name: "Website",
    x: Math.round(W * 0.60), y: Math.round(H * 0.88),
    w: Math.round(W * 0.29),
    text: cfg.website || "yourwebsite.com",
    fontSize: Math.round(H * 0.027), // 2.7% H ~16px
    fontFamily: font,
    weight: 400,
    color: "#888E99",
    letterSpacing: 2, // ~0.05em
    tags: ["contact-website", "contact-text"],
  }));

  return layers;
}

// Register corporate-chevron back layout
registerBackLayout("corporate-chevron", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — light warm near-white
  layers.push(filledRect({
    name: "Back Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg), // #EFEFEF
    tags: ["background", "back-element"],
  }));

  // Subtle back chevrons — right side, pointing LEFT, whisper-level
  const backBandW = -W * 0.12; // negative = pointing LEFT
  // Back V1
  const [bV1top, bV1bot] = (function() {
    const tipX = W * 0.95, tipY = H * 0.10;
    const vtxX = W * 0.77, vtxY = H * 0.46;
    const topArm = [M(tipX, tipY), L(tipX + backBandW, tipY), L(vtxX + backBandW, vtxY), L(vtxX, vtxY), Z()];
    const botArm = [M(vtxX, vtxY), L(vtxX + backBandW, vtxY), L(tipX + backBandW, tipY + 2 * (vtxY - tipY)), L(tipX, tipY + 2 * (vtxY - tipY)), Z()];
    return [topArm, botArm];
  })();
  layers.push(pathLayer({
    name: "Back Chevron V1 Top",
    commands: bV1top,
    fill: solidPaintHex(theme.divider || "#DDDDDD"),
    tags: ["decorative", "chevron", "back-element"],
  }));
  layers.push(pathLayer({
    name: "Back Chevron V1 Bot",
    commands: bV1bot,
    fill: solidPaintHex(theme.divider || "#DDDDDD"),
    tags: ["decorative", "chevron", "back-element"],
  }));

  // Back V2
  const [bV2top, bV2bot] = (function() {
    const tipX = W * 0.93, tipY = H * 0.51;
    const vtxX = W * 0.77, vtxY = H * 0.87;
    const topArm = [M(tipX, tipY), L(tipX + backBandW, tipY), L(vtxX + backBandW, vtxY), L(vtxX, vtxY), Z()];
    const botArm = [M(vtxX, vtxY), L(vtxX + backBandW, vtxY), L(tipX + backBandW, tipY + 2 * (vtxY - tipY)), L(tipX, tipY + 2 * (vtxY - tipY)), Z()];
    return [topArm, botArm];
  })();
  layers.push(pathLayer({
    name: "Back Chevron V2 Top",
    commands: bV2top,
    fill: solidPaintHex(theme.divider || "#DDDDDD"),
    tags: ["decorative", "chevron", "back-element"],
  }));
  layers.push(pathLayer({
    name: "Back Chevron V2 Bot",
    commands: bV2bot,
    fill: solidPaintHex(theme.divider || "#DDDDDD"),
    tags: ["decorative", "chevron", "back-element"],
  }));

  // Name "JONATHAN DOE" — upper left
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.07), y: Math.round(H * 0.23),
    w: Math.round(W * 0.40),
    text: (cfg.name || "JONATHAN DOE").toUpperCase(),
    fontSize: Math.round(H * 0.051), // 5.1% H ~31px
    fontFamily: font,
    weight: 700,
    color: theme.backText, // #444648
    uppercase: true,
    letterSpacing: 3, // ~0.10em
    tags: ["name", "primary-text", "back-element"],
  }));

  // Title "Graphic Designer"
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.07), y: Math.round(H * 0.30),
    w: Math.round(W * 0.35),
    text: cfg.title || "Graphic Designer",
    fontSize: Math.round(H * 0.041), // 4.1% H ~25px
    fontFamily: font,
    weight: 400,
    color: "#8C8C8C",
    tags: ["title", "back-element"],
  }));

  // Logo mark — geometric triangle at (7%, 47%)
  const logoSize = Math.round(W * 0.05);
  const logoX = Math.round(W * 0.07);
  const logoY = Math.round(H * 0.47);
  const markPath = [
    M(logoX, logoY + logoSize),
    L(logoX + logoSize / 2, logoY),
    L(logoX + logoSize, logoY + logoSize),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Logo Mark",
    commands: markPath,
    fill: solidPaintHex(theme.backText), // #444648
    tags: ["logo", "brand-mark", "back-element"],
  }));

  // Contact lines with icons
  const contactItems = [
    { text: cfg.contacts.phone || "+123 456 789", yPct: 0.57 },
    { text: cfg.contacts.email || "email@company.com", yPct: 0.62 },
    { text: cfg.contacts.address || "123 Main Street", yPct: 0.67 },
    { text: cfg.contacts.website || "www.company.com", yPct: 0.77 },
  ];

  for (const item of contactItems) {
    if (!item.text) continue;
    // Contact icon (small circle)
    layers.push(filledEllipse({
      name: "Contact Icon",
      cx: Math.round(W * 0.07 + 4), cy: Math.round(H * item.yPct + H * 0.008),
      rx: Math.round(H * 0.008), ry: Math.round(H * 0.008),
      fill: solidPaintHex(theme.contactIcon || "#4D5562"),
      tags: ["contact-icon", "back-element"],
    }));
    layers.push(styledText({
      name: "Contact",
      x: Math.round(W * 0.07 + 20), y: Math.round(H * item.yPct),
      w: Math.round(W * 0.30),
      text: item.text,
      fontSize: Math.round(H * 0.025), // 2.5% H ~15px
      fontFamily: font,
      weight: 400,
      color: theme.contactText || "#727780",
      tags: ["contact-text", "back-element"],
    }));
  }

  // Company "COMPANY" — large branding on right
  layers.push(styledText({
    name: "Company Branding",
    x: Math.round(W * 0.60), y: Math.round(H * 0.67),
    w: Math.round(W * 0.30),
    text: (cfg.company || "COMPANY").toUpperCase(),
    fontSize: Math.round(H * 0.11), // 11% H ~66px
    fontFamily: font,
    weight: 700,
    color: theme.backAccent || "#1C1C1E",
    uppercase: true,
    letterSpacing: 5, // ~0.15em
    tags: ["company", "branding", "back-element"],
  }));

  return layers;
});


// ─────────────────────────────────────────────────────────────
// Template #9 — zigzag-overlay
// Reference: Angular lime/charcoal converging shapes
// White bg + gradient bar + dark triangle (front)
// Converging shapes with zigzag edge (back)
// ─────────────────────────────────────────────────────────────

function layoutZigzagOverlay(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["zigzag-overlay"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — pure white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg), // #FFFFFF
    tags: ["background"],
  }));

  // Orange-to-Magenta gradient bar (top-left)
  layers.push(filledRect({
    name: "Gradient Bar",
    x: 0, y: Math.round(H * 0.01), w: Math.round(W * 0.29), h: Math.round(H * 0.13),
    fill: multiStopGradient(180, [
      { offset: 0, color: "#FB6C2B" },
      { offset: 0.4, color: "#FA3048" },
      { offset: 1.0, color: "#FC1154" },
    ]),
    tags: ["decorative", "accent", "gradient-bar"],
  }));

  // Dark charcoal triangle (bottom-right ~40% of card)
  const triPath = [
    M(W * 0.72, H * 0.54),
    L(W, H * 0.54),
    L(W, H),
    L(W * 0.15, H),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Dark Triangle",
    commands: triPath,
    fill: solidPaintHex(theme.accent || "#303030"),
    tags: ["decorative", "accent"],
  }));

  // Small text at diagonal edge (on white bg)
  layers.push(styledText({
    name: "Name Label",
    x: Math.round(W * 0.55), y: Math.round(H * 0.50),
    w: Math.round(W * 0.20),
    text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.025),
    fontFamily: font,
    weight: 400,
    color: theme.frontText, // #343434
    tags: ["name", "primary-text"],
  }));

  // Contact text on dark triangle (off-white)
  const contactLines = [
    cfg.phone || "+92 94 56 789",
    cfg.email || "email@company.com",
    cfg.website || "www.company.com",
    cfg.address || "Main Street, Location",
  ];

  let contactY = 0.84;
  for (const line of contactLines) {
    if (!line) continue;
    layers.push(styledText({
      name: "Contact",
      x: Math.round(W * 0.22), y: Math.round(H * contactY),
      w: Math.round(W * 0.30),
      text: line,
      fontSize: Math.round(H * 0.022),
      fontFamily: font,
      weight: 400,
      color: theme.frontTextAlt || "#E0E0E0", // off-white on dark
      tags: ["contact-text"],
    }));
    contactY += 0.035;
  }

  // Lime-tinted company text at bottom
  layers.push(styledText({
    name: "Company",
    x: Math.round(W * 0.22), y: Math.round(H * 0.96),
    w: Math.round(W * 0.30),
    text: cfg.company || "Company",
    fontSize: Math.round(H * 0.018),
    fontFamily: font,
    weight: 400,
    color: "#CAD592",
    tags: ["company"],
  }));

  return layers;
}

// Register zigzag-overlay back layout
registerBackLayout("zigzag-overlay", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — white
  layers.push(filledRect({
    name: "Back Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg), // #FFFFFF
    tags: ["background", "back-element"],
  }));

  // Dark charcoal shape with zigzag right edge
  const darkPath = [
    M(W * 0.10, 0),
    L(W * 0.85, 0),
    // Zigzag right boundary (7 vertices):
    L(W * 0.71, H * 0.10),
    L(W * 0.61, H * 0.17),
    L(W * 0.64, H * 0.22),
    L(W * 0.62, H * 0.25),
    L(W * 0.72, H * 0.29),
    L(W * 0.76, H * 0.33),
    L(W * 0.71, H * 0.35),
    L(W * 0.66, H * 0.40),
    L(W * 0.53, H * 0.45),
    L(W * 0.45, H * 0.47), // Convergence point
    // Left boundary (smooth diagonal):
    L(W * 0.28, H * 0.30),
    L(W * 0.22, H * 0.20),
    L(W * 0.15, H * 0.10),
    L(W * 0.10, 0),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Dark Shape",
    commands: darkPath,
    fill: solidPaintHex("#303030"),
    tags: ["decorative", "shape", "back-element"],
  }));

  // Lime green shape — wraps from right side
  const limePath = [
    M(W * 0.85, 0),
    L(W * 0.90, 0),
    L(W * 0.92, H * 0.10),
    L(W * 0.95, H * 0.20),
    L(W * 0.99, H * 0.30),
    L(W * 0.99, H * 0.35),
    L(W * 0.98, H * 0.37),
    L(W * 0.91, H * 0.40),
    L(W * 0.76, H * 0.45),
    L(W * 0.61, H * 0.50),
    L(W * 0.45, H * 0.55),
    L(W * 0.32, H * 0.59), // Convergence point
    // Left boundary:
    L(W * 0.21, H * 0.37),
    L(W * 0.19, H * 0.25),
    L(W * 0.16, H * 0.15),
    L(W * 0.16, 0),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Lime Shape",
    commands: limePath,
    fill: solidPaintHex(theme.accentAlt || "#D0E85C"),
    tags: ["decorative", "shape", "back-element"],
  }));

  // Olive overlap strip (optional depth enhancement)
  const olivePath = [
    M(W * 0.16, 0),
    L(W * 0.22, 0),
    L(W * 0.28, H * 0.30),
    L(W * 0.32, H * 0.59),
    L(W * 0.21, H * 0.37),
    L(W * 0.16, H * 0.15),
    L(W * 0.16, 0),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Olive Overlap",
    commands: olivePath,
    fill: solidPaintHex(theme.backAccent || "#7E8D37"),
    tags: ["decorative", "overlap", "back-element"],
  }));

  // Faint text at bottom
  layers.push(styledText({
    name: "Bottom Text",
    x: Math.round(W * 0.10), y: Math.round(H * 0.92),
    w: Math.round(W * 0.80),
    text: cfg.contacts.website || cfg.company || "www.company.com",
    fontSize: Math.round(H * 0.020),
    fontFamily: font,
    weight: 400,
    color: theme.backText || "#3A3A3A",
    align: "center",
    tags: ["contact-website", "back-element"],
  }));

  return layers;
});


// ─────────────────────────────────────────────────────────────
// Template #10 — hex-split
// Reference: Company Name — Dwayne John, hexagonal blue
// Dark navy + wave pattern + hex logo (front)
// Light/dark horizontal split + 2×2 contact grid (back)
// ─────────────────────────────────────────────────────────────

function layoutHexSplit(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["hex-split"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — dark navy blue
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg), // #2C4F6B
    tags: ["background"],
  }));

  // Wave pattern overlay — subtle repeating chevrons at 20% opacity
  // Create chevron rows across the entire card
  const patternColor = theme.frontBgAlt || "#1E3A4F";
  const chevronH = Math.round(H * 0.04); // 4% H per chevron row
  const chevronW = Math.round(W * 0.08); // 8% W per chevron unit
  for (let rowY = 0; rowY < H; rowY += chevronH) {
    const rowCommands: PathCommand[] = [M(0, rowY + chevronH)];
    for (let colX = 0; colX < W; colX += chevronW) {
      rowCommands.push(
        L(colX + chevronW / 2, rowY),
        L(colX + chevronW, rowY + chevronH / 2),
      );
    }
    rowCommands.push(L(W, rowY + chevronH), L(0, rowY + chevronH), Z());
    layers.push(pathLayer({
      name: "Wave Pattern Row",
      commands: rowCommands,
      fill: solidPaintHex(patternColor, 0.20),
      tags: ["decorative", "pattern"],
    }));
  }

  // Hexagonal logo — line-art at center (50%, 30%)
  const hexCx = Math.round(W * 0.50);
  const hexCy = Math.round(H * 0.30);
  const hexW = Math.round(W * 0.08);
  const hexH = Math.round(H * 0.12);
  // Flat-top hexagon
  const hexPath = [
    M(hexCx - hexW / 2, hexCy - hexH / 4),
    L(hexCx, hexCy - hexH / 2),
    L(hexCx + hexW / 2, hexCy - hexH / 4),
    L(hexCx + hexW / 2, hexCy + hexH / 4),
    L(hexCx, hexCy + hexH / 2),
    L(hexCx - hexW / 2, hexCy + hexH / 4),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Hex Logo",
    commands: hexPath,
    stroke: makeStroke("#FFFFFF", 2.5),
    tags: ["logo", "hexagon"],
  }));

  // Internal cube shape inside hex (3D cube illusion)
  const cubeSize = Math.round(hexW * 0.3);
  const cubePath = [
    // Top face
    M(hexCx, hexCy - cubeSize),
    L(hexCx + cubeSize, hexCy - cubeSize / 2),
    L(hexCx, hexCy),
    L(hexCx - cubeSize, hexCy - cubeSize / 2),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Hex Cube",
    commands: cubePath,
    stroke: makeStroke("#FFFFFF", 1.5),
    tags: ["logo", "hexagon"],
  }));

  // Company Name — centered below logo
  layers.push(styledText({
    name: "Company",
    x: 0, y: Math.round(H * 0.52),
    w: W,
    text: (cfg.company || "COMPANY NAME").toUpperCase(),
    fontSize: Math.round(H * 0.06), // 6% H ~36px
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 5, // ~0.15em
    align: "center",
    tags: ["company", "primary-text"],
  }));

  // Tagline — below company
  layers.push(styledText({
    name: "Tagline",
    x: 0, y: Math.round(H * 0.58),
    w: W,
    text: (cfg.tagline || "TAGLINE GOES HERE").toUpperCase(),
    fontSize: Math.round(H * 0.025), // 2.5% H ~15px
    fontFamily: font,
    weight: 300,
    color: theme.frontTextAlt || "#8BB4D1",
    uppercase: true,
    letterSpacing: 7, // ~0.25em
    align: "center",
    tags: ["tagline"],
  }));

  return layers;
}

// Register hex-split back layout
registerBackLayout("hex-split", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];
  const splitY = Math.round(H * 0.40);

  // Top section — light gray
  layers.push(filledRect({
    name: "Back Top Section",
    x: 0, y: 0, w: W, h: splitY,
    fill: solidPaintHex(theme.backBg || "#F8F9FA"),
    tags: ["background", "back-element"],
  }));

  // Bottom section — dark navy
  layers.push(filledRect({
    name: "Back Bottom Section",
    x: 0, y: splitY, w: W, h: H - splitY,
    fill: solidPaintHex(theme.accent || "#2C4F6B"),
    tags: ["background", "back-element"],
  }));

  // Name — centered on light section
  layers.push(styledText({
    name: "Name",
    x: 0, y: Math.round(H * 0.25),
    w: W,
    text: (cfg.name || "DWAYNE JOHN").toUpperCase(),
    fontSize: Math.round(H * 0.07), // 7% H ~42px
    fontFamily: font,
    weight: 700,
    color: theme.backText || "#2C4F6B",
    uppercase: true,
    letterSpacing: 3, // ~0.10em
    align: "center",
    tags: ["name", "primary-text", "back-element"],
  }));

  // Title — below name
  layers.push(styledText({
    name: "Title",
    x: 0, y: Math.round(H * 0.32),
    w: W,
    text: (cfg.title || "GENERAL MANAGER").toUpperCase(),
    fontSize: Math.round(H * 0.03), // 3% H ~18px
    fontFamily: font,
    weight: 300,
    color: "#8BB4D1",
    uppercase: true,
    letterSpacing: 6, // ~0.20em
    align: "center",
    tags: ["title", "back-element"],
  }));

  // Vertical divider in contact section
  layers.push(divider({
    name: "Contact Divider",
    x: Math.round(W * 0.50), y: Math.round(H * 0.45),
    length: Math.round(H * 0.20),
    vertical: true,
    color: "#FFFFFF",
    alpha: 0.30,
    tags: ["divider", "back-element"],
  }));

  // 2×2 Contact grid
  const contactGrid = [
    { text: cfg.contacts.email || "email@company.com", col: 0, row: 0 },
    { text: cfg.contacts.address || "123 Main Street", col: 1, row: 0 },
    { text: cfg.contacts.phone || "+123 456 789", col: 0, row: 1 },
    { text: cfg.contacts.website || "www.company.com", col: 1, row: 1 },
  ];

  const gridStartY = H * 0.50;
  const rowGap = H * 0.15;
  const colOffset = [W * 0.15, W * 0.55];

  for (const item of contactGrid) {
    if (!item.text) continue;
    const x = Math.round(colOffset[item.col]);
    const y = Math.round(gridStartY + item.row * rowGap);

    // Contact icon (small outline circle)
    layers.push(strokeEllipse({
      name: "Grid Icon",
      cx: x, cy: y + Math.round(H * 0.01),
      rx: Math.round(W * 0.012), ry: Math.round(W * 0.012),
      stroke: makeStroke("#FFFFFF", 1.5),
      tags: ["contact-icon", "back-element"],
    }));

    // Contact text
    layers.push(styledText({
      name: "Grid Contact",
      x: x + Math.round(W * 0.03), y: y,
      w: Math.round(W * 0.30),
      text: item.text,
      fontSize: Math.round(H * 0.028), // 2.8% H ~17px
      fontFamily: font,
      weight: 400,
      color: theme.contactText || "#FFFFFF",
      tags: ["contact-text", "back-element"],
    }));
  }

  return layers;
});


// ─────────────────────────────────────────────────────────────
// Template #11 — dot-circle
// Reference: ELD Creatives — Jason Martin, minimalist circle
// Off-white bg + left-aligned content + dark logo block (front)
// Large dark circle with logo + website (back)
// ─────────────────────────────────────────────────────────────

function layoutDotCircle(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["dot-circle"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — off-white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg), // #F8F8F8
    tags: ["background"],
  }));

  // Rectangular logo element (top-right)
  const lx = Math.round(W * 0.65);
  const ly = Math.round(H * 0.13);
  const lw = Math.round(W * 0.20);
  const lh = Math.round(H * 0.15);
  layers.push(filledRect({
    name: "Logo Block",
    x: lx, y: ly, w: lw, h: lh,
    fill: solidPaintHex(theme.accent || "#333333"),
    radii: [2, 2, 2, 2],
    tags: ["logo", "panel"],
  }));

  // Logo text inside block
  layers.push(styledText({
    name: "Logo Text",
    x: lx, y: ly + Math.round(lh * 0.30),
    w: lw,
    text: (cfg.company || "ELD CREATIVES").toUpperCase(),
    fontSize: Math.round(H * 0.025),
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    align: "center",
    tags: ["company", "logo"],
  }));

  // Name — left-aligned
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.08), y: Math.round(H * 0.25),
    w: Math.round(W * 0.50),
    text: (cfg.name || "JASON MARTIN").toUpperCase(),
    fontSize: Math.round(H * 0.06), // 6% H ~36px
    fontFamily: font,
    weight: 700,
    color: theme.frontText, // #2C2C2C
    uppercase: true,
    letterSpacing: 5, // ~0.15em
    tags: ["name", "primary-text"],
  }));

  // Title — below name
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.08), y: Math.round(H * 0.35),
    w: Math.round(W * 0.45),
    text: cfg.title || "Creative Director",
    fontSize: Math.round(H * 0.03), // 3% H ~18px
    fontFamily: font,
    weight: 300,
    color: theme.frontTextAlt || "#666666",
    tags: ["title"],
  }));

  // Divider line 1 (between title and contacts)
  layers.push(divider({
    name: "Divider 1",
    x: Math.round(W * 0.08), y: Math.round(H * 0.44),
    length: Math.round(W * 0.60),
    vertical: false,
    color: theme.divider || "#E0E0E0",
    alpha: 0.50,
    tags: ["divider"],
  }));

  // Phone contacts with icons
  const contactStartY = H * 0.50;
  const iconX = Math.round(W * 0.06);
  const textX = Math.round(W * 0.06 + W * 0.04);
  const contactFontSize = Math.round(H * 0.025); // 2.5% H ~15px
  const iconR = Math.round(H * 0.0075); // tiny filled circle

  const phoneLines = [
    { text: cfg.phone || "514-xxx-xxxx", label: " (Office)", yPct: 0.50 },
    { text: cfg.phone ? "" : "xxx-xxx-xxxx", label: " (Mobile)", yPct: 0.56 },
  ];

  for (const pl of phoneLines) {
    if (!pl.text) continue;
    layers.push(filledEllipse({
      name: "Phone Icon",
      cx: iconX, cy: Math.round(H * pl.yPct + H * 0.01),
      rx: iconR, ry: iconR,
      fill: solidPaintHex(theme.contactIcon || "#666666"),
      tags: ["contact-icon"],
    }));
    layers.push(styledText({
      name: "Phone",
      x: textX, y: Math.round(H * pl.yPct),
      w: Math.round(W * 0.40),
      text: pl.text + pl.label,
      fontSize: contactFontSize,
      fontFamily: font,
      weight: 400,
      color: theme.contactText || "#444444",
      tags: ["contact-text"],
    }));
  }

  // Divider line 2 (between phone and email/web)
  layers.push(divider({
    name: "Divider 2",
    x: Math.round(W * 0.08), y: Math.round(H * 0.62),
    length: Math.round(W * 0.60),
    vertical: false,
    color: theme.divider || "#E0E0E0",
    alpha: 0.50,
    tags: ["divider"],
  }));

  // Email + website
  const emailWebLines = [
    { text: cfg.email || "jason@eldcreatives.com", yPct: 0.66 },
    { text: cfg.website || "www.eldcreatives.com", yPct: 0.72 },
  ];

  for (const ew of emailWebLines) {
    if (!ew.text) continue;
    layers.push(filledEllipse({
      name: "Contact Icon",
      cx: iconX, cy: Math.round(H * ew.yPct + H * 0.01),
      rx: iconR, ry: iconR,
      fill: solidPaintHex(theme.contactIcon || "#666666"),
      tags: ["contact-icon"],
    }));
    layers.push(styledText({
      name: "Contact",
      x: textX, y: Math.round(H * ew.yPct),
      w: Math.round(W * 0.50),
      text: ew.text,
      fontSize: contactFontSize,
      fontFamily: font,
      weight: 400,
      color: theme.contactText || "#444444",
      tags: ["contact-text"],
    }));
  }

  return layers;
}

// Register dot-circle back layout
registerBackLayout("dot-circle", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — same off-white
  layers.push(filledRect({
    name: "Back Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg || "#F8F8F8"),
    tags: ["background", "back-element"],
  }));

  // Large dark circle — left-of-center
  const cx = Math.round(W * 0.15);
  const cy = Math.round(H * 0.50);
  const r = Math.round(W * 0.175); // ~35% diameter
  layers.push(filledEllipse({
    name: "Logo Circle",
    cx: cx, cy: cy, rx: r, ry: r,
    fill: solidPaintHex(theme.accent || "#333333"),
    tags: ["logo", "circle", "back-element"],
  }));

  // Logo/company text inside circle
  layers.push(styledText({
    name: "Circle Logo",
    x: cx - r, y: cy - Math.round(H * 0.02),
    w: r * 2,
    text: (cfg.company || "LOGO").toUpperCase(),
    fontSize: Math.round(H * 0.05),
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    align: "center",
    tags: ["company", "logo", "back-element"],
  }));

  // Website URL — lower-right quadrant
  layers.push(styledText({
    name: "Website",
    x: Math.round(W * 0.50), y: Math.round(H * 0.75),
    w: Math.round(W * 0.40),
    text: cfg.contacts.website || "www.eldcreatives.com",
    fontSize: Math.round(H * 0.035), // 3.5% H ~21px
    fontFamily: font,
    weight: 300,
    color: theme.backText || "#666666",
    tags: ["contact-website", "back-element"],
  }));

  return layers;
});


// ─────────────────────────────────────────────────────────────
// Template #12 — wave-gradient
// Reference: MTAC — Mastering Tasks and Coaching
// White bg + purple-orange wave + logo/contact (front)
// Full-bleed diagonal gradient + centered white logo (back)
// ─────────────────────────────────────────────────────────────

function layoutWaveGradient(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["wave-gradient"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background — pure white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg), // #FFFFFF
    tags: ["background"],
  }));

  // Bottom wave — organic curved shape with gradient fill
  const wavePath = [
    M(0, H * 0.80),
    // Organic wave curve across top edge
    C(W * 0.25, H * 0.85, W * 0.50, H * 0.75, W * 0.75, H * 0.82),
    C(W * 0.90, H * 0.86, W, H * 0.78, W, H * 0.80),
    L(W, H),
    L(0, H),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Gradient Wave",
    commands: wavePath,
    fill: multiStopGradient(135, [
      { offset: 0, color: theme.accent || "#2D1B69" },
      { offset: 1, color: theme.accentAlt || "#FF8C42" },
    ]),
    tags: ["decorative", "wave", "gradient"],
  }));

  // Logo icon placeholder (small mark at upper-left)
  const logoX = Math.round(W * 0.12);
  const logoY = Math.round(H * 0.22);
  const logoSize = Math.round(W * 0.03);
  // Small arrow/chevron mark in two colors
  const arrowPath = [
    M(logoX, logoY + logoSize),
    L(logoX + logoSize / 2, logoY),
    L(logoX + logoSize, logoY + logoSize),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Logo Arrow",
    commands: arrowPath,
    fill: solidPaintHex(theme.accentAlt || "#FF8C42"),
    tags: ["logo", "icon"],
  }));

  // Company "MTAC" — bold brand text right of icon
  layers.push(styledText({
    name: "Company",
    x: Math.round(W * 0.15), y: Math.round(H * 0.20),
    w: Math.round(W * 0.30),
    text: (cfg.company || "MTAC").toUpperCase(),
    fontSize: Math.round(H * 0.08), // 8% H ~48px
    fontFamily: font,
    weight: 700,
    color: theme.frontText, // #2D1B69
    uppercase: true,
    tags: ["company", "primary-text"],
  }));

  // Tagline below company
  layers.push(styledText({
    name: "Tagline",
    x: Math.round(W * 0.15), y: Math.round(H * 0.30),
    w: Math.round(W * 0.40),
    text: cfg.tagline || "Mastering Tasks and Coaching",
    fontSize: Math.round(H * 0.025), // 2.5% H ~15px
    fontFamily: font,
    weight: 400,
    color: theme.frontTextAlt || "#666666",
    tags: ["tagline"],
  }));

  // Name — center-right
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.55), y: Math.round(H * 0.50),
    w: Math.round(W * 0.35),
    text: cfg.name || "Name and Surname",
    fontSize: Math.round(H * 0.028),
    fontFamily: font,
    weight: 400,
    color: theme.frontText, // #2D1B69
    tags: ["name"],
  }));

  // Title below name
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.55), y: Math.round(H * 0.55),
    w: Math.round(W * 0.35),
    text: cfg.title || "Title/Position",
    fontSize: Math.round(H * 0.022),
    fontFamily: font,
    weight: 400,
    color: theme.frontTextAlt || "#666666",
    tags: ["title"],
  }));

  // Contact details — left side below tagline
  const contactLines = [
    { text: cfg.address || "Address line", yPct: 0.58 },
    { text: cfg.phone || "+123 456 789", yPct: 0.62 },
    { text: cfg.email || "email@company.com", yPct: 0.66 },
    { text: cfg.website || "www.company.com", yPct: 0.70 },
  ];

  for (const cl of contactLines) {
    if (!cl.text) continue;
    // Small icon dot
    layers.push(filledEllipse({
      name: "Contact Icon",
      cx: Math.round(W * 0.08 - 6), cy: Math.round(H * cl.yPct + H * 0.008),
      rx: 3, ry: 3,
      fill: solidPaintHex(theme.frontText),
      tags: ["contact-icon"],
    }));
    layers.push(styledText({
      name: "Contact",
      x: Math.round(W * 0.08), y: Math.round(H * cl.yPct),
      w: Math.round(W * 0.35),
      text: cl.text,
      fontSize: Math.round(H * 0.020), // 2% H ~12px
      fontFamily: font,
      weight: 400,
      color: theme.contactText || "#333333",
      tags: ["contact-text"],
    }));
  }

  return layers;
}

// Register wave-gradient back layout
registerBackLayout("wave-gradient", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Full-bleed diagonal gradient background
  layers.push(filledRect({
    name: "Gradient Background",
    x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(135, [
      { offset: 0, color: theme.backBg || "#2D1B69" },
      { offset: 1, color: theme.backAccent || "#FF8C42" },
    ]),
    tags: ["background", "back-element"],
  }));

  // Logo icon (white, centered)
  const logoSize = Math.round(W * 0.04);
  const logoCx = Math.round(W * 0.47);
  const logoCy = Math.round(H * 0.40);
  const arrowPath = [
    M(logoCx, logoCy + logoSize),
    L(logoCx + logoSize / 2, logoCy),
    L(logoCx + logoSize, logoCy + logoSize),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Back Logo Arrow",
    commands: arrowPath,
    fill: solidPaintHex("#FFFFFF"),
    tags: ["logo", "icon", "back-element"],
  }));

  // Company "MTAC" — large centered white
  layers.push(styledText({
    name: "Company",
    x: 0, y: Math.round(H * 0.45),
    w: W,
    text: (cfg.company || "MTAC").toUpperCase(),
    fontSize: Math.round(H * 0.12), // 12% H ~72px
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 3, // ~0.10em
    align: "center",
    tags: ["company", "primary-text", "back-element"],
  }));

  // Tagline below
  layers.push(styledText({
    name: "Tagline",
    x: 0, y: Math.round(H * 0.58),
    w: W,
    text: cfg.tagline || "Mastering Tasks and Coaching",
    fontSize: Math.round(H * 0.025), // 2.5% H ~15px
    fontFamily: font,
    weight: 300,
    color: "#FFFFFF",
    alpha: 0.90,
    align: "center",
    tags: ["tagline", "back-element"],
  }));

  return layers;
});

'''

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find(START_MARKER)
end_idx = content.find(END_MARKER)

if start_idx == -1:
    print(f"ERROR: Could not find start marker: {START_MARKER}")
    exit(1)
if end_idx == -1:
    print(f"ERROR: Could not find end marker: {END_MARKER}")
    exit(1)

print(f"Found MODERN section: chars {start_idx}–{end_idx}")
print(f"Old section length: {end_idx - start_idx} chars")

new_content = content[:start_idx] + NEW_SECTION + content[end_idx:]

with open(FILE, "w", encoding="utf-8") as f:
    f.write(new_content)

print(f"New section length: {len(NEW_SECTION)} chars")
print(f"Total file size: {len(new_content)} chars")
print("SUCCESS: Modern templates rewritten!")
