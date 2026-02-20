"""
Rewrite the CREATIVE TEMPLATES section (templates #19-24) in business-card-adapter.ts
with pixel-perfect implementations matching the reference images.

Templates:
  #19  flowing-lines       – Curve Studio flowing S-curve lines
  #20  neon-watermark       – Corporate diagonal teal + geometric overlays
  #21  blueprint-tech       – Architect gray + blueprint floor plan
  #22  skyline-silhouette   – Layered cityscape silhouette + gradient
  #23  world-map            – Blue/orange web.gurus corporate
  #24  diagonal-gold        – Dark teal + white diagonal band + gold accents
"""

import re, sys, os

ADAPTER = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "editor", "business-card-adapter.ts")

START_MARKER = "// ===================== CREATIVE TEMPLATES ====================="
END_MARKER   = "// ===================== LUXURY TEMPLATES ====================="

NEW_SECTION = r'''// ===================== CREATIVE TEMPLATES =====================

// ---------------------------------------------------------------------------
// #19  Flowing Lines – Deep forest green bg, 8-10 flowing S-curve bezier lines
// ---------------------------------------------------------------------------

function layoutFlowingLines(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["flowing-lines"];
  const layers: LayerV2[] = [];

  // ── Background: deep forest green ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── Flowing curved lines – 9 parallel bezier S-curves, left 60% ──
  const lineW = W * 0.015;          // ~16px stroke width
  const lineSpacing = W * 0.035;    // gap between parallel lines
  for (let i = 0; i < 9; i++) {
    const ox = i * lineSpacing;
    const cmds: PathCommand[] = [
      M(W * 0.05 + ox, H * 0.10),
      C(W * 0.15 + ox, H * 0.25, W * 0.05 + ox, H * 0.50, W * 0.20 + ox, H * 0.65),
      C(W * 0.30 + ox, H * 0.75, W * 0.25 + ox, H * 0.85, W * 0.15 + ox, H * 0.90),
    ];
    layers.push(pathLayer({
      name: `Flow Line ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: cmds, closed: false,
      stroke: makeStroke(t.accent, lineW),
      tags: ["decorative", "accent"],
    }));
  }

  // ── Company: "Curve STUDIO" – right 40%, mixed weight ──
  layers.push(styledText({
    name: "Company", x: W * 0.62, y: H * 0.22, w: W * 0.34,
    text: cfg.company || "Curve STUDIO", fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 700, color: t.frontText, align: "left",
    tags: ["company"],
  }));

  // ── Tagline ──
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.62, y: H * 0.33, w: W * 0.34,
      text: cfg.tagline, fontSize: Math.round(H * 0.03), fontFamily: ff,
      weight: 300, color: t.frontText, align: "left",
      tags: ["tagline"],
    }));
  }

  // ── Website – bottom right ──
  if (cfg.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.62, y: H * 0.83, w: W * 0.34,
      text: cfg.website, fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: t.frontText, align: "left",
      tags: ["contact-website", "contact-text"],
    }));
  }

  // ── Logo watermark ──
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.62, H * 0.12, H * 0.08, t.frontText, 0.7, ff));

  return layers;
}

registerBackLayout("flowing-lines", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: off-white ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── Mirrored flowing lines – right 40% ──
  const lineW = W * 0.015;
  const lineSpacing = W * 0.035;
  for (let i = 0; i < 7; i++) {
    const ox = i * lineSpacing;
    const baseX = W * 0.60;
    const cmds: PathCommand[] = [
      M(baseX + ox, H * 0.15),
      C(baseX + W * 0.10 + ox, H * 0.30, baseX + ox, H * 0.55, baseX + W * 0.15 + ox, H * 0.70),
      C(baseX + W * 0.20 + ox, H * 0.80, baseX + W * 0.15 + ox, H * 0.85, baseX + W * 0.10 + ox, H * 0.90),
    ];
    layers.push(pathLayer({
      name: `Back Flow ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: cmds, closed: false,
      stroke: makeStroke(t.backAccent ?? t.accent, lineW),
      tags: ["decorative", "accent"],
    }));
  }

  // ── Name ──
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.22, w: W * 0.45,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.06), fontFamily: cfg.fontFamily,
    weight: 700, color: t.backText ?? t.frontBg, uppercase: true,
    tags: ["name", "primary-text"],
  }));

  // ── Title ──
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.33, w: W * 0.45,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.03), fontFamily: cfg.fontFamily,
    weight: 400, color: "#666666",
    tags: ["title"],
  }));

  // ── Contact with icons ──
  if (cfg.showContactIcons) {
    layers.push(...contactWithIcons({
      contacts: cfg.contacts,
      x: W * 0.08, startY: H * 0.48,
      lineGap: Math.round(H * 0.08),
      textColor: t.contactText ?? "#333333",
      iconColor: t.contactIcon ?? t.accent,
      fontSize: Math.round(H * 0.025),
      fontFamily: cfg.fontFamily,
      tags: ["back"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #20  Neon Watermark – Dark teal diagonal + geometric overlays
// ---------------------------------------------------------------------------

function layoutNeonWatermark(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["neon-watermark"];
  const layers: LayerV2[] = [];

  // ── Background: warm off-white ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── Diagonal teal section – upper-right trapezoid ──
  layers.push(pathLayer({
    name: "Diagonal Teal", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.45, 0), L(W, 0), L(W, H * 0.45), L(W * 0.15, H * 0.45), Z(),
    ],
    fill: solidPaintHex(t.frontBgAlt ?? t.accent),
    tags: ["decorative", "accent"],
  }));

  // ── Geometric overlay A – large angular polygon at 70% opacity ──
  layers.push(pathLayer({
    name: "Overlay A", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.60, H * 0.40), L(W, H * 0.40), L(W, H), L(W * 0.40, H), Z(),
    ],
    fill: solidPaintHex(t.accentAlt ?? "#B8C5D1"),
    opacity: 0.7,
    tags: ["decorative"],
  }));

  // ── Geometric overlay B – smaller accent polygon at 50% opacity ──
  layers.push(pathLayer({
    name: "Overlay B", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.70, H * 0.58), L(W, H * 0.58), L(W, H), L(W * 0.55, H), Z(),
    ],
    fill: solidPaintHex("#A0B0C0"),
    opacity: 0.5,
    tags: ["decorative"],
  }));

  // ── QR code placeholder ──
  const qrSize = W * 0.10;
  layers.push(filledRect({
    name: "QR Background", x: W * 0.08, y: H * 0.25, w: qrSize, h: qrSize,
    fill: solidPaintHex("#FFFFFF"), radii: [2, 2, 2, 2],
    tags: ["qr-code"],
  }));

  // ── Name – inside diagonal section, right-aligned, white ──
  layers.push(styledText({
    name: "Name", x: W * 0.40, y: H * 0.15, w: W * 0.52,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.06), fontFamily: ff,
    weight: 400, color: t.frontTextAlt ?? "#FFFFFF", align: "right",
    tags: ["name", "primary-text"],
  }));

  // ── Designation – below name in diagonal ──
  layers.push(styledText({
    name: "Title", x: W * 0.40, y: H * 0.24, w: W * 0.52,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025), fontFamily: ff,
    weight: 300, color: t.frontTextAlt ?? "#FFFFFF", align: "right",
    letterSpacing: 1, uppercase: true,
    tags: ["title"],
  }));

  // ── Separator line ──
  layers.push(divider({
    name: "Separator", x: W * 0.08, y: H * 0.58,
    length: W * 0.30, thickness: 1, color: t.accentAlt ?? "#B8C5D1", alpha: 1.0,
    direction: "horizontal",
    tags: ["decorative", "divider"],
  }));

  // ── Contact with icons – left side below separator ──
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.08, startY: H * 0.65,
    lineGap: Math.round(H * 0.03),
    textColor: t.contactText ?? t.accent,
    iconColor: t.contactIcon ?? t.accent,
    fontSize: Math.round(H * 0.03),
    fontFamily: ff,
    tags: ["front"],
  }));

  return layers;
}

registerBackLayout("neon-watermark", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: dark teal ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── Geometric background polygon A ──
  layers.push(pathLayer({
    name: "Back Geo A", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.20, H * 0.60), L(W * 0.80, H * 0.60), L(W * 0.70, H), L(W * 0.10, H), Z(),
    ],
    fill: solidPaintHex("#1A4A63"),
    opacity: 0.6,
    tags: ["decorative"],
  }));

  // ── Geometric background polygon B ──
  layers.push(pathLayer({
    name: "Back Geo B", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.30, H * 0.70), L(W * 0.90, H * 0.70), L(W * 0.80, H), L(W * 0.20, H), Z(),
    ],
    fill: solidPaintHex("#15405A"),
    opacity: 0.4,
    tags: ["decorative"],
  }));

  // ── Hexagonal logo outline ──
  const hR = 36;
  const hCx = W * 0.50;
  const hCy = H * 0.35;
  const hexCmds: PathCommand[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3 - Math.PI / 6;
    const px = hCx + hR * Math.cos(angle);
    const py = hCy + hR * Math.sin(angle);
    hexCmds.push(i === 0 ? M(px, py) : L(px, py));
  }
  hexCmds.push(Z());
  layers.push(pathLayer({
    name: "Hexagon Logo", x: 0, y: 0, w: W, h: H,
    commands: hexCmds,
    stroke: makeStroke("#FFFFFF", 2),
    tags: ["logo", "branding"],
  }));

  // ── Logo watermark ──
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", hCx - 18, hCy - 18, 36, "#FFFFFF", 0.9, cfg.fontFamily));

  // ── Company name ──
  layers.push(styledText({
    name: "Company", x: W * 0.15, y: H * 0.53, w: W * 0.70,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.08), fontFamily: cfg.fontFamily,
    weight: 700, color: t.backText, align: "center", uppercase: true, letterSpacing: 3,
    tags: ["company"],
  }));

  // ── Slogan ──
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Slogan", x: W * 0.15, y: H * 0.64, w: W * 0.70,
      text: cfg.tagline, fontSize: Math.round(H * 0.028), fontFamily: cfg.fontFamily,
      weight: 300, color: t.backText, align: "center", uppercase: true, letterSpacing: 4,
      tags: ["tagline"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #21  Blueprint Tech – Gray front, architect floor plan on back
// ---------------------------------------------------------------------------

function layoutBlueprintTech(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["blueprint-tech"];
  const layers: LayerV2[] = [];

  // ── Background: medium gray ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── Logo symbol – small geometric mark ──
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.18, H * 0.21, H * 0.04, t.frontText, 1.0, ff));

  // ── Logo text: company name in light weight, lowercase style ──
  layers.push(styledText({
    name: "Company", x: W * 0.21, y: H * 0.21, w: W * 0.40,
    text: cfg.company || "crearquitectura", fontSize: Math.round(H * 0.06), fontFamily: ff,
    weight: 300, color: t.frontText,
    tags: ["company"],
  }));

  // ── QR code placeholder – right side ──
  const qrSize = W * 0.12;
  layers.push(filledRect({
    name: "QR Background", x: W * 0.75, y: H * 0.60, w: qrSize, h: qrSize,
    fill: solidPaintHex("#FFFFFF"), radii: [2, 2, 2, 2],
    tags: ["qr-code"],
  }));

  // ── Orange-red corner accent on QR ──
  layers.push(pathLayer({
    name: "QR Accent", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.75 + qrSize, H * 0.60),
      L(W * 0.75 + qrSize, H * 0.60 + 15),
      L(W * 0.75 + qrSize - 15, H * 0.60),
      Z(),
    ],
    fill: solidPaintHex(t.accent),
    tags: ["decorative", "accent"],
  }));

  // ── Website URL – below QR ──
  if (cfg.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.75, y: H * 0.60 + qrSize + 10, w: qrSize,
      text: cfg.website, fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: t.frontText,
      tags: ["contact-website", "contact-text"],
    }));
  }

  return layers;
}

registerBackLayout("blueprint-tech", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: white ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── Architectural floor plan – right 50% ──
  const planColor = t.backAccent ?? "#BDC3C7";
  // Outer walls
  layers.push(strokeRect({
    name: "Floor Plan Outer", x: W * 0.50, y: H * 0.05, w: W * 0.47, h: H * 0.90,
    color: planColor, width: 1, tags: ["decorative", "blueprint"],
  }));
  // Room divider lines
  const roomLines: Array<[number, number, number, number]> = [
    [W * 0.50, H * 0.33, W * 0.97, H * 0.33],   // horizontal
    [W * 0.50, H * 0.63, W * 0.81, H * 0.63],   // horizontal
    [W * 0.667, H * 0.05, W * 0.667, H * 0.33],  // vertical
    [W * 0.81, H * 0.33, W * 0.81, H * 0.95],    // vertical
  ];
  for (let i = 0; i < roomLines.length; i++) {
    const [x1, y1, x2, y2] = roomLines[i];
    layers.push(pathLayer({
      name: `Room Line ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: [M(x1, y1), L(x2, y2)],
      stroke: makeStroke(planColor, 1), closed: false,
      tags: ["decorative", "blueprint"],
    }));
  }
  // Inner subdivisions
  const innerLines: Array<[number, number, number, number]> = [
    [W * 0.667, H * 0.33, W * 0.667, H * 0.63],
    [W * 0.571, H * 0.63, W * 0.571, H * 0.95],
  ];
  for (let i = 0; i < innerLines.length; i++) {
    const [x1, y1, x2, y2] = innerLines[i];
    layers.push(pathLayer({
      name: `Inner Line ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: [M(x1, y1), L(x2, y2)],
      stroke: makeStroke(planColor, 0.5), closed: false,
      tags: ["decorative", "blueprint"],
    }));
  }

  // ── Name ──
  layers.push(styledText({
    name: "Name", x: W * 0.15, y: H * 0.22, w: W * 0.32,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.05), fontFamily: cfg.fontFamily,
    weight: 500, color: t.backText,
    tags: ["name", "primary-text"],
  }));

  // ── Title ──
  layers.push(styledText({
    name: "Title", x: W * 0.15, y: H * 0.33, w: W * 0.32,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
    weight: 300, color: "#7F8C8D", uppercase: true, letterSpacing: 2,
    tags: ["title"],
  }));

  // ── Contact with icons – generous spacing ──
  if (cfg.showContactIcons) {
    layers.push(...contactWithIcons({
      contacts: cfg.contacts,
      x: W * 0.13, startY: H * 0.53,
      lineGap: Math.round(H * 0.10),
      textColor: t.backText,
      iconColor: t.contactIcon ?? t.backText,
      fontSize: Math.round(H * 0.025),
      fontFamily: cfg.fontFamily,
      tags: ["back"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #22  Skyline Silhouette – Layered cityscape + gradient background
// ---------------------------------------------------------------------------

function layoutSkylineSilhouette(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["skyline-silhouette"];
  const layers: LayerV2[] = [];

  // ── Background: gradient #F5F5F5 → #E0E0E0 → #1A1A1A ──
  layers.push(filledRect({
    name: "BG", x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(180, [
      { color: "#F5F5F5", offset: 0 },
      { color: "#E0E0E0", offset: 0.50 },
      { color: "#1A1A1A", offset: 0.70 },
      { color: "#1A1A1A", offset: 1.0 },
    ]),
    tags: ["background"],
  }));

  // ── Building icon (3 rectangles) ──
  layers.push(filledRect({ name: "Bldg Left", x: W * 0.42, y: H * 0.227, w: 12, h: 32, fill: solidPaintHex(t.frontText), tags: ["decorative", "branding"] }));
  layers.push(filledRect({ name: "Bldg Center", x: W * 0.42 + 14, y: H * 0.20, w: 14, h: 48, fill: solidPaintHex(t.frontText), tags: ["decorative", "branding"] }));
  layers.push(filledRect({ name: "Bldg Right", x: W * 0.42 + 30, y: H * 0.217, w: 12, h: 38, fill: solidPaintHex(t.frontText), tags: ["decorative", "branding"] }));

  // ── Company text beside icon ──
  layers.push(styledText({
    name: "Company", x: W * 0.47, y: H * 0.19, w: W * 0.40,
    text: cfg.company || "REAL ESTATE", fontSize: Math.round(H * 0.06), fontFamily: ff,
    weight: 700, color: t.frontText, uppercase: true,
    tags: ["company"],
  }));

  // ── Tagline ──
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.47, y: H * 0.26, w: W * 0.40,
      text: cfg.tagline, fontSize: Math.round(H * 0.02), fontFamily: ff,
      weight: 400, color: t.frontTextAlt ?? "#666666", uppercase: true, letterSpacing: 2,
      tags: ["tagline"],
    }));
  }

  // ── Logo ──
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.42, H * 0.20, 42, t.frontText, 0.9, ff));

  // ── 4-layer city skyline silhouette – bottom 35% ──
  // Layer 1 (lightest, farthest)
  layers.push(pathLayer({
    name: "Skyline Layer 1", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.72),
      L(W * 0.05, H * 0.70), L(W * 0.10, H * 0.68), L(W * 0.18, H * 0.71),
      L(W * 0.25, H * 0.67), L(W * 0.30, H * 0.69), L(W * 0.38, H * 0.72),
      L(W * 0.45, H * 0.66), L(W * 0.52, H * 0.70), L(W * 0.60, H * 0.68),
      L(W * 0.68, H * 0.71), L(W * 0.75, H * 0.67), L(W * 0.82, H * 0.70),
      L(W * 0.90, H * 0.69), L(W, H * 0.73),
      L(W, H), L(0, H), Z(),
    ],
    fill: solidPaintHex("#E0E0E0"),
    tags: ["decorative", "skyline"],
  }));

  // Layer 2
  layers.push(pathLayer({
    name: "Skyline Layer 2", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.78),
      L(W * 0.04, H * 0.73), L(W * 0.08, H * 0.75), L(W * 0.12, H * 0.71),
      L(W * 0.16, H * 0.74), L(W * 0.22, H * 0.68), L(W * 0.26, H * 0.72),
      L(W * 0.32, H * 0.70), L(W * 0.38, H * 0.75), L(W * 0.44, H * 0.66),
      L(W * 0.48, H * 0.69), L(W * 0.54, H * 0.73), L(W * 0.60, H * 0.67),
      L(W * 0.66, H * 0.72), L(W * 0.72, H * 0.69), L(W * 0.78, H * 0.74),
      L(W * 0.84, H * 0.70), L(W * 0.90, H * 0.73), L(W * 0.96, H * 0.71),
      L(W, H * 0.76),
      L(W, H), L(0, H), Z(),
    ],
    fill: solidPaintHex("#AAAAAA"),
    tags: ["decorative", "skyline"],
  }));

  // Layer 3
  layers.push(pathLayer({
    name: "Skyline Layer 3", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.82),
      L(W * 0.06, H * 0.78), L(W * 0.10, H * 0.74), L(W * 0.14, H * 0.78),
      L(W * 0.20, H * 0.72), L(W * 0.24, H * 0.76), L(W * 0.30, H * 0.73),
      L(W * 0.36, H * 0.78), L(W * 0.42, H * 0.70), L(W * 0.46, H * 0.74),
      L(W * 0.52, H * 0.76), L(W * 0.58, H * 0.72), L(W * 0.64, H * 0.77),
      L(W * 0.70, H * 0.73), L(W * 0.76, H * 0.78), L(W * 0.82, H * 0.74),
      L(W * 0.88, H * 0.77), L(W * 0.94, H * 0.75),
      L(W, H * 0.80),
      L(W, H), L(0, H), Z(),
    ],
    fill: solidPaintHex("#666666"),
    tags: ["decorative", "skyline"],
  }));

  // Layer 4 (darkest, nearest)
  layers.push(pathLayer({
    name: "Skyline Layer 4", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.88),
      L(W * 0.05, H * 0.83), L(W * 0.10, H * 0.80), L(W * 0.15, H * 0.84),
      L(W * 0.20, H * 0.78), L(W * 0.25, H * 0.82), L(W * 0.32, H * 0.79),
      L(W * 0.38, H * 0.84), L(W * 0.44, H * 0.76), L(W * 0.50, H * 0.80),
      L(W * 0.56, H * 0.78), L(W * 0.62, H * 0.83), L(W * 0.68, H * 0.79),
      L(W * 0.74, H * 0.84), L(W * 0.80, H * 0.80), L(W * 0.86, H * 0.83),
      L(W * 0.92, H * 0.81),
      L(W, H * 0.85),
      L(W, H), L(0, H), Z(),
    ],
    fill: solidPaintHex("#1A1A1A"),
    tags: ["decorative", "skyline"],
  }));

  // ── Website at bottom ──
  if (cfg.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.25, y: H * 0.91, w: W * 0.50,
      text: cfg.website, fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: "#FFFFFF", align: "center",
      tags: ["contact-website", "contact-text"],
    }));
  }

  return layers;
}

registerBackLayout("skyline-silhouette", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── LEFT PANEL – gradient with skyline (clipped to left 50%) ──
  layers.push(filledRect({
    name: "Left Panel BG", x: 0, y: 0, w: W * 0.50, h: H,
    fill: multiStopGradient(180, [
      { color: "#F5F5F5", offset: 0 },
      { color: "#E0E0E0", offset: 0.50 },
      { color: "#1A1A1A", offset: 0.70 },
      { color: "#1A1A1A", offset: 1.0 },
    ]),
    tags: ["background"],
  }));

  // Simplified skyline for left panel
  layers.push(pathLayer({
    name: "Left Skyline", x: 0, y: 0, w: W * 0.50, h: H,
    commands: [
      M(0, H * 0.78),
      L(W * 0.05, H * 0.73), L(W * 0.10, H * 0.70), L(W * 0.15, H * 0.74),
      L(W * 0.20, H * 0.68), L(W * 0.25, H * 0.72), L(W * 0.30, H * 0.69),
      L(W * 0.35, H * 0.74), L(W * 0.40, H * 0.66), L(W * 0.45, H * 0.70),
      L(W * 0.50, H * 0.73),
      L(W * 0.50, H), L(0, H), Z(),
    ],
    fill: solidPaintHex("#1A1A1A"),
    tags: ["decorative", "skyline"],
  }));

  // Left panel branding
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.10, H * 0.28, 32, t.frontText ?? "#2C2C2C", 0.9, cfg.fontFamily));
  layers.push(styledText({
    name: "Left Company", x: W * 0.10 + 40, y: H * 0.28, w: W * 0.30,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.04), fontFamily: cfg.fontFamily,
    weight: 700, color: t.frontText ?? "#2C2C2C",
    tags: ["company"],
  }));

  // ── RIGHT PANEL – solid dark ──
  layers.push(filledRect({
    name: "Right Panel", x: W * 0.50, y: 0, w: W * 0.50, h: H,
    fill: solidPaintHex(t.backBg),
    tags: ["background"],
  }));

  // ── Name ──
  layers.push(styledText({
    name: "Name", x: W * 0.55, y: H * 0.22, w: W * 0.40,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.05), fontFamily: cfg.fontFamily,
    weight: 700, color: t.backText, uppercase: true,
    tags: ["name", "primary-text"],
  }));

  // ── Title ──
  layers.push(styledText({
    name: "Title", x: W * 0.55, y: H * 0.30, w: W * 0.40,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
    weight: 400, color: "#CCCCCC", uppercase: true, letterSpacing: 1,
    tags: ["title"],
  }));

  // ── Contact with icons ──
  if (cfg.showContactIcons) {
    layers.push(...contactWithIcons({
      contacts: cfg.contacts,
      x: W * 0.55, startY: H * 0.43,
      lineGap: Math.round(H * 0.08),
      textColor: t.backText,
      iconColor: t.backText,
      fontSize: Math.round(H * 0.025),
      fontFamily: cfg.fontFamily,
      maxWidth: Math.round(W * 0.38),
      tags: ["back"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #23  World Map – Blue/orange corporate, web.gurus style
// ---------------------------------------------------------------------------

function layoutWorldMap(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["world-map"];
  const layers: LayerV2[] = [];

  // ── Background: white ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── Company logo text – left zone, split weight "web.gurus" ──
  layers.push(styledText({
    name: "Company", x: W * 0.15, y: H * 0.33, w: W * 0.30,
    text: cfg.company || "web.gurus", fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 700, color: t.frontText,
    tags: ["company"],
  }));

  // ── Tagline badge – orange rounded rect with white text ──
  if (cfg.tagline) {
    layers.push(filledRect({
      name: "Tagline Badge BG", x: W * 0.15, y: H * 0.44, w: W * 0.18, h: H * 0.038,
      fill: solidPaintHex(t.accent), radii: [3, 3, 3, 3],
      tags: ["decorative", "accent"],
    }));
    layers.push(styledText({
      name: "Tagline", x: W * 0.155, y: H * 0.445, w: W * 0.17,
      text: cfg.tagline, fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: "#FFFFFF",
      tags: ["tagline"],
    }));
  }

  // ── Logo watermark ──
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.15, H * 0.26, H * 0.06, t.frontText, 0.9, ff));

  // ── Name – right zone ──
  layers.push(styledText({
    name: "Name", x: W * 0.55, y: H * 0.18, w: W * 0.40,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.045), fontFamily: ff,
    weight: 700, color: t.frontText,
    tags: ["name", "primary-text"],
  }));

  // ── Title ──
  layers.push(styledText({
    name: "Title", x: W * 0.55, y: H * 0.24, w: W * 0.40,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.03), fontFamily: ff,
    weight: 400, color: t.frontTextAlt ?? "#7B8A8B",
    tags: ["title"],
  }));

  // ── Address lines ──
  if (cfg.address) {
    layers.push(styledText({
      name: "Address", x: W * 0.55, y: H * 0.33, w: W * 0.40,
      text: cfg.address, fontSize: Math.round(H * 0.028), fontFamily: ff,
      weight: 400, color: t.contactText ?? "#34495E",
      tags: ["contact-address", "contact-text"],
    }));
  }

  // ── Contact with orange icons – right zone ──
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.55, startY: H * 0.63,
    lineGap: Math.round(H * 0.03),
    textColor: t.contactText ?? "#34495E",
    iconColor: t.contactIcon ?? t.accent,
    fontSize: Math.round(H * 0.028),
    fontFamily: ff,
    tags: ["front"],
  }));

  return layers;
}

registerBackLayout("world-map", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: deep blue ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── Tagline badge (centered above logo) ──
  if (cfg.tagline) {
    layers.push(filledRect({
      name: "Back Badge BG", x: W * 0.38, y: H * 0.32, w: W * 0.24, h: H * 0.04,
      fill: solidPaintHex(t.backAccent ?? t.accent), radii: [3, 3, 3, 3],
      tags: ["decorative", "accent"],
    }));
    layers.push(styledText({
      name: "Back Badge", x: W * 0.385, y: H * 0.325, w: W * 0.23,
      text: cfg.tagline, fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 400, color: t.backText, align: "center",
      tags: ["tagline"],
    }));
  }

  // ── Company logo (centered, large) ──
  layers.push(styledText({
    name: "Company", x: W * 0.15, y: H * 0.42, w: W * 0.70,
    text: cfg.company || "web.gurus", fontSize: Math.round(H * 0.12), fontFamily: cfg.fontFamily,
    weight: 700, color: t.backText, align: "center",
    tags: ["company"],
  }));

  // ── Logo watermark ──
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.46, H * 0.22, H * 0.08, t.backText, 0.8, cfg.fontFamily));

  // ── Social handles at bottom ──
  layers.push(styledText({
    name: "Social Info", x: W * 0.15, y: H * 0.83, w: W * 0.70,
    text: cfg.website || "www.company.com", fontSize: Math.round(H * 0.03), fontFamily: cfg.fontFamily,
    weight: 400, color: t.backText, align: "center",
    tags: ["contact-website", "contact-text"],
  }));

  // ── Orange social icon accents ──
  const iconS = 12;
  layers.push(filledEllipse({
    name: "Social Icon 1", cx: W * 0.42, cy: H * 0.84, rx: iconS / 2, ry: iconS / 2,
    fill: solidPaintHex(t.backAccent ?? t.accent),
    tags: ["decorative", "contact-icon"],
  }));
  layers.push(filledEllipse({
    name: "Social Icon 2", cx: W * 0.58, cy: H * 0.84, rx: iconS / 2, ry: iconS / 2,
    fill: solidPaintHex(t.backAccent ?? t.accent),
    tags: ["decorative", "contact-icon"],
  }));

  return layers;
});


// ---------------------------------------------------------------------------
// #24  Diagonal Gold – Dark teal + white diagonal band + gold accents
// ---------------------------------------------------------------------------

function layoutDiagonalGold(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["diagonal-gold"];
  const layers: LayerV2[] = [];

  // ── Background: dark teal ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── White diagonal band – parallelogram ~15° slant ──
  layers.push(pathLayer({
    name: "White Band", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.35), L(W, H * 0.15), L(W, H * 0.70), L(0, H * 0.90), Z(),
    ],
    fill: solidPaintHex("#FFFFFF"),
    tags: ["decorative"],
  }));

  // ── Gold accent strip – thin parallelogram along bottom of white band ──
  layers.push(pathLayer({
    name: "Gold Strip", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.87), L(W, H * 0.67), L(W, H * 0.70), L(0, H * 0.90), Z(),
    ],
    fill: solidPaintHex(t.accent),
    tags: ["decorative", "accent"],
  }));

  // ── Name – on white band, dark teal ──
  layers.push(styledText({
    name: "Name", x: W * 0.20, y: H * 0.42, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 700, color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // ── Title – on white band, gray ──
  layers.push(styledText({
    name: "Title", x: W * 0.20, y: H * 0.53, w: W * 0.55,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025), fontFamily: ff,
    weight: 400, color: t.frontTextAlt ?? "#8B8B8B", uppercase: true, letterSpacing: 4,
    tags: ["title"],
  }));

  // ── Contact with gold icons – below band on dark teal ──
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.05, startY: H * 0.65,
    lineGap: Math.round(H * 0.025),
    textColor: t.contactText ?? "#FFFFFF",
    iconColor: t.contactIcon ?? t.accent,
    fontSize: Math.round(H * 0.022),
    fontFamily: ff,
    tags: ["front"],
  }));

  // ── QR code placeholder – right side ──
  const qrSize = W * 0.12;
  layers.push(filledRect({
    name: "QR Background", x: W * 0.75, y: H * 0.75, w: qrSize, h: qrSize,
    fill: solidPaintHex("#FFFFFF"), radii: [2, 2, 2, 2],
    tags: ["qr-code"],
  }));

  return layers;
}

registerBackLayout("diagonal-gold", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: dark teal ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── Logo – geometric mark, gold ──
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.71, H * 0.18, H * 0.14, t.backText ?? t.accent, 1.0, cfg.fontFamily));

  // ── Company name ──
  layers.push(styledText({
    name: "Company", x: W * 0.60, y: H * 0.35, w: W * 0.35,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.04), fontFamily: cfg.fontFamily,
    weight: 700, color: t.backText ?? t.accent, uppercase: true, letterSpacing: 2,
    tags: ["company"],
  }));

  // ── Tagline ──
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.60, y: H * 0.42, w: W * 0.35,
      text: cfg.tagline, fontSize: Math.round(H * 0.02), fontFamily: cfg.fontFamily,
      weight: 300, color: t.backText ?? t.accent, uppercase: true, letterSpacing: 5,
      tags: ["tagline"],
    }));
  }

  // ── Service categories ──
  const services = ["CONSTRUCTION", "HOME DESIGN", "INVESTMENT", "CONSULTING"];
  for (let i = 0; i < services.length; i++) {
    layers.push(styledText({
      name: `Service ${i + 1}`, x: W * 0.68, y: H * 0.50 + i * Math.round(H * 0.04), w: W * 0.28,
      text: services[i], fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 300, color: t.backText ?? t.accent, uppercase: true, letterSpacing: 3,
      tags: ["tagline"],
    }));
  }

  // ── Gold bottom bar ──
  layers.push(filledRect({
    name: "Gold Bar", x: 0, y: H * 0.92, w: W, h: H * 0.08,
    fill: solidPaintHex(t.accent),
    tags: ["decorative", "accent"],
  }));

  return layers;
});

'''

# ─── Main ───
with open(ADAPTER, "r", encoding="utf-8") as f:
    src = f.read()

start_i = src.index(START_MARKER)
end_i   = src.index(END_MARKER)

old_section = src[start_i:end_i]
print(f"Old section: {len(old_section):,} chars")

new_src = src[:start_i] + NEW_SECTION + src[end_i:]
print(f"New section: {len(NEW_SECTION):,} chars")
print(f"Total file:  {len(new_src):,} chars")

with open(ADAPTER, "w", encoding="utf-8") as f:
    f.write(new_src)

# Verify all expected functions are present
expected = [
    "function layoutFlowingLines",
    "function layoutNeonWatermark",
    "function layoutBlueprintTech",
    "function layoutSkylineSilhouette",
    "function layoutWorldMap",
    "function layoutDiagonalGold",
    'registerBackLayout("flowing-lines"',
    'registerBackLayout("neon-watermark"',
    'registerBackLayout("blueprint-tech"',
    'registerBackLayout("skyline-silhouette"',
    'registerBackLayout("world-map"',
    'registerBackLayout("diagonal-gold"',
]
for fn in expected:
    if fn in new_src:
        print(f"  ✅ {fn}")
    else:
        print(f"  ❌ MISSING: {fn}")
        sys.exit(1)

print("\n✅ All 6 Creative front layouts + 6 back layouts written successfully!")
