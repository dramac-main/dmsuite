"""
Rewrite the LUXURY TEMPLATES section (Templates #25-30) in business-card-adapter.ts.
Replaces the block between the LUXURY marker and the LAYOUT_MAP.
Also injects registerBackLayout calls for all 6 templates right before the LUXURY front section marker.
"""

import re, pathlib, sys

FILE = pathlib.Path(r"src/lib/editor/business-card-adapter.ts")
text = FILE.read_text(encoding="utf-8")

# ─── markers ────────────────────────────────────────────────────────────────
LUXURY_MARKER  = "// ===================== LUXURY TEMPLATES ====================="
LAYOUT_MAP_MARKER = "// --- Template dispatcher ---"

start = text.find(LUXURY_MARKER)
end   = text.find(LAYOUT_MAP_MARKER)
if start < 0 or end < 0:
    print("ERROR: Could not find section markers"); sys.exit(1)

old_section = text[start:end]
print(f"Old Luxury section: {len(old_section):,} chars  (lines {text[:start].count(chr(10))+1}"
      f"–{text[:end].count(chr(10))+1})")

# ─── Also find where to insert back layouts ─────────────────────────────────
# We insert them right before the LUXURY_MARKER
# Find last registerBackLayout before luxury marker
last_register = text.rfind("registerBackLayout(", 0, start)
if last_register < 0:
    print("ERROR: could not find last registerBackLayout"); sys.exit(1)
# Find end of that registerBackLayout block (closing });)
register_block_end = text.find("\n});", last_register)
if register_block_end < 0:
    print("ERROR: could not find end of last registerBackLayout block"); sys.exit(1)
register_block_end += len("\n});")

# ─── NEW BACK LAYOUTS ────────────────────────────────────────────────────────
NEW_BACK_LAYOUTS = r'''

// ---------------------------------------------------------------------------
// #25  Luxury Divider – BACK: teal bg, gold company + accent line + website
// ---------------------------------------------------------------------------

registerBackLayout("luxury-divider", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: dark teal (color-inverted from front) ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── Geometric logo element – angular triangle ──
  layers.push(pathLayer({
    name: "Geometric Logo", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.15, H * 0.49),
      L(W * 0.19, H * 0.35),
      L(W * 0.23, H * 0.49),
      Z(),
    ],
    fill: solidPaintHex(t.backText ?? "#F4D58D"),
    tags: ["decorative", "logo"],
  }));

  // ── Watermark logo ──
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company, W * 0.15, H * 0.35, Math.round(H * 0.14),
    t.backText ?? "#F4D58D", 1.0, cfg.fontFamily
  ));

  // ── Company ──
  layers.push(styledText({
    name: "Company", x: 0, y: H * 0.45, w: W,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.08),
    fontFamily: cfg.fontFamily, weight: 700,
    color: t.backText ?? "#F4D58D", align: "center",
    uppercase: true, letterSpacing: 4,
    tags: ["company", "primary-text"],
  }));

  // ── Horizontal accent line ──
  layers.push(divider({
    name: "Accent Line", x: W * 0.20, y: H * 0.65,
    length: W * 0.60, thickness: 3,
    color: t.backText ?? "#F4D58D",
    tags: ["decorative", "accent"],
  }));

  // ── Website ──
  if (cfg.contacts.website) {
    layers.push(styledText({
      name: "Website", x: 0, y: H * 0.75, w: W,
      text: cfg.contacts.website, fontSize: Math.round(H * 0.025),
      fontFamily: cfg.fontFamily, weight: 400,
      color: t.backText ?? "#F4D58D", align: "center",
      tags: ["contact-website", "back"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #26  Social Band – BACK: full green, script watermark, centered brand
// ---------------------------------------------------------------------------

registerBackLayout("social-band", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: full forest green ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── Script monogram watermark ──
  const initial = (cfg.company || "V").charAt(0).toUpperCase();
  layers.push(styledText({
    name: "Watermark", x: 0, y: H * 0.20, w: W,
    text: initial, fontSize: Math.round(H * 0.35),
    fontFamily: "Georgia, serif", weight: 400,
    color: t.accent ?? "#4A6B5A", alpha: 0.3,
    align: "center", italic: true,
    tags: ["decorative", "watermark"],
  }));

  // ── Company / Brand ──
  layers.push(styledText({
    name: "Company", x: 0, y: H * 0.50, w: W,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.08),
    fontFamily: cfg.fontFamily, weight: 300,
    color: t.backText ?? "#FFFFFF", align: "center",
    uppercase: true, letterSpacing: 6,
    tags: ["company", "primary-text"],
  }));

  // ── Subtitle / Title ──
  layers.push(styledText({
    name: "Subtitle", x: 0, y: H * 0.58, w: W,
    text: cfg.title || "Title", fontSize: Math.round(H * 0.025),
    fontFamily: cfg.fontFamily, weight: 300,
    color: t.backText ?? "#FFFFFF", alpha: 0.7,
    align: "center", uppercase: true, letterSpacing: 4,
    tags: ["title"],
  }));

  return layers;
});


// ---------------------------------------------------------------------------
// #27  Organic Pattern – BACK: full green, topographic contours, gold logo
// ---------------------------------------------------------------------------

registerBackLayout("organic-pattern", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: forest green ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── Topographic contour lines – 6 organic bezier paths ──
  const topoColor = t.accentAlt ?? "#3A4A42";
  const contours: Array<{ cx: number; cy: number; rx: number; ry: number }> = [
    { cx: W * 0.50, cy: H * 0.50, rx: W * 0.42, ry: H * 0.38 },
    { cx: W * 0.48, cy: H * 0.48, rx: W * 0.36, ry: H * 0.32 },
    { cx: W * 0.52, cy: H * 0.52, rx: W * 0.30, ry: H * 0.26 },
    { cx: W * 0.50, cy: H * 0.46, rx: W * 0.24, ry: H * 0.20 },
    { cx: W * 0.48, cy: H * 0.50, rx: W * 0.18, ry: H * 0.14 },
    { cx: W * 0.52, cy: H * 0.54, rx: W * 0.12, ry: H * 0.10 },
  ];
  contours.forEach((c, i) => {
    // Approximate each contour as an ellipse using bezier curves
    const kx = c.rx * 0.5523;
    const ky = c.ry * 0.5523;
    layers.push(pathLayer({
      name: `Contour ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: [
        M(c.cx, c.cy - c.ry),
        C(c.cx + kx, c.cy - c.ry,  c.cx + c.rx, c.cy - ky,  c.cx + c.rx, c.cy),
        C(c.cx + c.rx, c.cy + ky,  c.cx + kx, c.cy + c.ry,  c.cx, c.cy + c.ry),
        C(c.cx - kx, c.cy + c.ry,  c.cx - c.rx, c.cy + ky,  c.cx - c.rx, c.cy),
        C(c.cx - c.rx, c.cy - ky,  c.cx - kx, c.cy - c.ry,  c.cx, c.cy - c.ry),
        Z(),
      ],
      closed: true,
      stroke: makeStroke(topoColor, 1.5),
      opacity: 0.20,
      tags: ["decorative", "pattern"],
    }));
  });

  // ── Logo – centered large ──
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company, W * 0.50 - Math.round(W * 0.075), H * 0.40 - Math.round(W * 0.075),
    Math.round(W * 0.15), t.backText ?? "#B8A882", 1.0, cfg.fontFamily
  ));

  // ── Company ──
  layers.push(styledText({
    name: "Company", x: 0, y: H * 0.55, w: W,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.04),
    fontFamily: cfg.fontFamily, weight: 500,
    color: t.backText ?? "#B8A882", align: "center",
    uppercase: true, letterSpacing: 3,
    tags: ["company", "primary-text"],
  }));

  // ── Tagline ──
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: 0, y: H * 0.62, w: W,
      text: cfg.tagline, fontSize: Math.round(H * 0.02),
      fontFamily: cfg.fontFamily, weight: 300,
      color: t.backText ?? "#B8A882", alpha: 0.7,
      align: "center", uppercase: true, letterSpacing: 5,
      tags: ["tagline"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #28  Celtic Stripe – BACK: dark bg, pattern strip on RIGHT, white company
// ---------------------------------------------------------------------------

registerBackLayout("celtic-stripe", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: dark charcoal ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── Pattern strip background – RIGHT 25% ──
  const stripX = W * 0.75;
  const stripW = W * 0.25;
  const stripCx = stripX + stripW / 2;
  layers.push(filledRect({ name: "Strip BG", x: stripX, y: 0, w: stripW, h: H, fill: solidPaintHex("#FFFFFF"), tags: ["decorative", "panel"] }));

  // ── Interlaced pattern on right strip ──
  const unitH = 75;
  for (let y = 0; y < H; y += unitH) {
    // Horizontal ovals
    layers.push(strokeEllipse({
      name: `Oval A y${y}`, cx: stripCx, cy: y + 18, rx: 50, ry: 18,
      color: t.accent ?? "#2C2C2C", width: 2,
    }));
    layers.push(strokeEllipse({
      name: `Oval B y${y}`, cx: stripCx, cy: y + 56, rx: 50, ry: 18,
      color: t.accent ?? "#2C2C2C", width: 2,
    }));
    // Diamond connector
    layers.push(pathLayer({
      name: `Diamond y${y}`, x: 0, y: 0, w: W, h: H,
      commands: [
        M(stripCx - 50, y + 37),
        L(stripCx, y + 22),
        L(stripCx + 50, y + 37),
        L(stripCx, y + 52),
        Z(),
      ],
      stroke: makeStroke(t.accent ?? "#2C2C2C", 2),
      tags: ["decorative", "pattern"],
    }));
  }

  // ── Company name – left side ──
  layers.push(styledText({
    name: "Company", x: W * 0.08, y: H * 0.65, w: W * 0.55,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.05),
    fontFamily: cfg.fontFamily, weight: 700,
    color: t.backText ?? "#FFFFFF",
    uppercase: true, letterSpacing: 3,
    tags: ["company", "primary-text"],
  }));

  return layers;
});


// ---------------------------------------------------------------------------
// #29  Premium Crest – BACK: cream bg, full-width skyline, name + contact
// ---------------------------------------------------------------------------

registerBackLayout("premium-crest", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: cream ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── City skyline silhouette – full width, top 50% ──
  layers.push(pathLayer({
    name: "Skyline", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, 0), L(W, 0), L(W, H * 0.33),
      // Roofline right to left – 12+ buildings
      L(W * 0.96, H * 0.33), L(W * 0.96, H * 0.22), L(W * 0.92, H * 0.22),
      L(W * 0.92, H * 0.38), L(W * 0.87, H * 0.38),
      L(W * 0.87, H * 0.15), L(W * 0.84, H * 0.12), L(W * 0.81, H * 0.15),
      L(W * 0.81, H * 0.42), L(W * 0.76, H * 0.42),
      L(W * 0.76, H * 0.28), L(W * 0.72, H * 0.28),
      L(W * 0.72, H * 0.45), L(W * 0.66, H * 0.45),
      L(W * 0.66, H * 0.18), L(W * 0.63, H * 0.14), L(W * 0.60, H * 0.18),
      L(W * 0.60, H * 0.40), L(W * 0.55, H * 0.40),
      L(W * 0.55, H * 0.30), L(W * 0.50, H * 0.30),
      L(W * 0.50, H * 0.48), L(W * 0.45, H * 0.48),
      L(W * 0.45, H * 0.20), L(W * 0.42, H * 0.16), L(W * 0.39, H * 0.20),
      L(W * 0.39, H * 0.35), L(W * 0.34, H * 0.35),
      L(W * 0.34, H * 0.42), L(W * 0.28, H * 0.42),
      L(W * 0.28, H * 0.25), L(W * 0.24, H * 0.25),
      L(W * 0.24, H * 0.38), L(W * 0.18, H * 0.38),
      L(W * 0.18, H * 0.30), L(W * 0.14, H * 0.30),
      L(W * 0.14, H * 0.45), L(W * 0.08, H * 0.45),
      L(W * 0.08, H * 0.35), L(W * 0.04, H * 0.35),
      L(W * 0.04, H * 0.42), L(0, H * 0.42),
      Z(),
    ],
    fill: solidPaintHex(t.backAccent ?? "#1A1A1A"),
    tags: ["decorative", "skyline"],
  }));

  // ── Name ──
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.58, w: W * 0.50,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.08),
    fontFamily: cfg.fontFamily, weight: 700,
    color: t.backText ?? "#2A2A2A",
    uppercase: true, letterSpacing: 4,
    tags: ["name", "primary-text"],
  }));

  // ── Contact with icons ──
  if (cfg.showContactIcons) {
    layers.push(...contactWithIcons({
      contacts: cfg.contacts,
      x: W * 0.50, startY: H * 0.72,
      lineGap: Math.round(H * 0.06),
      textColor: t.contactText ?? "#4A4A4A",
      iconColor: t.contactIcon ?? "#4A4A4A",
      fontSize: Math.round(H * 0.025),
      fontFamily: cfg.fontFamily,
      tags: ["back"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #30  Gold Construct – BACK: dark bg, world map dots, corner accents, company
// ---------------------------------------------------------------------------

registerBackLayout("gold-construct", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // ── Background: dark charcoal ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // ── World map dot pattern (simplified continental outlines) ──
  const mapColor = t.accentAlt ?? "#1A1A1A";
  // Simplified dot grid representing major landmasses
  const dotR = 2;
  const continents: Array<[number, number]> = [
    // North America
    [0.18, 0.22], [0.20, 0.20], [0.22, 0.18], [0.24, 0.20], [0.16, 0.28],
    [0.18, 0.30], [0.20, 0.28], [0.22, 0.26], [0.24, 0.28], [0.26, 0.30],
    [0.14, 0.34], [0.16, 0.36], [0.18, 0.34], [0.20, 0.36], [0.22, 0.34],
    // South America
    [0.26, 0.50], [0.28, 0.48], [0.30, 0.52], [0.28, 0.56], [0.26, 0.60],
    [0.28, 0.62], [0.30, 0.58], [0.28, 0.66], [0.26, 0.70],
    // Europe
    [0.46, 0.18], [0.48, 0.16], [0.50, 0.18], [0.48, 0.22], [0.50, 0.24],
    [0.46, 0.26], [0.48, 0.28], [0.44, 0.24],
    // Africa
    [0.48, 0.36], [0.50, 0.34], [0.52, 0.38], [0.50, 0.42], [0.48, 0.46],
    [0.50, 0.50], [0.52, 0.48], [0.50, 0.54], [0.48, 0.58], [0.50, 0.62],
    // Asia
    [0.56, 0.18], [0.58, 0.16], [0.60, 0.18], [0.62, 0.20], [0.64, 0.18],
    [0.66, 0.22], [0.68, 0.24], [0.70, 0.22], [0.72, 0.26], [0.74, 0.28],
    [0.56, 0.26], [0.58, 0.28], [0.60, 0.30], [0.62, 0.32], [0.64, 0.30],
    [0.66, 0.34], [0.68, 0.32], [0.70, 0.36], [0.72, 0.34],
    [0.60, 0.38], [0.62, 0.40], [0.64, 0.42], [0.66, 0.38],
    // Australia
    [0.76, 0.54], [0.78, 0.52], [0.80, 0.54], [0.82, 0.56],
    [0.78, 0.58], [0.80, 0.60], [0.82, 0.58],
  ];
  continents.forEach(([px, py], i) => {
    layers.push(filledEllipse({
      name: `Map Dot ${i}`, cx: W * px, cy: H * py,
      rx: dotR, ry: dotR,
      fill: solidPaintHex(mapColor, 0.3),
      tags: ["decorative", "pattern"],
    }));
  });

  // ── Corner accent triangles ──
  const cs = 21; // corner triangle size
  const ci = 32; // corner inset
  // Top-left
  layers.push(pathLayer({
    name: "Corner TL", x: 0, y: 0, w: W, h: H,
    commands: [M(ci, ci), L(ci + cs, ci), L(ci, ci + cs), Z()],
    fill: solidPaintHex(t.backText ?? "#FFFFFF"),
    tags: ["decorative", "corner"],
  }));
  // Top-right
  layers.push(pathLayer({
    name: "Corner TR", x: 0, y: 0, w: W, h: H,
    commands: [M(W - ci, ci), L(W - ci - cs, ci), L(W - ci, ci + cs), Z()],
    fill: solidPaintHex(t.backText ?? "#FFFFFF"),
    tags: ["decorative", "corner"],
  }));
  // Bottom-left
  layers.push(pathLayer({
    name: "Corner BL", x: 0, y: 0, w: W, h: H,
    commands: [M(ci, H - ci), L(ci + cs, H - ci), L(ci, H - ci - cs), Z()],
    fill: solidPaintHex(t.backText ?? "#FFFFFF"),
    tags: ["decorative", "corner"],
  }));
  // Bottom-right
  layers.push(pathLayer({
    name: "Corner BR", x: 0, y: 0, w: W, h: H,
    commands: [M(W - ci, H - ci), L(W - ci - cs, H - ci), L(W - ci, H - ci - cs), Z()],
    fill: solidPaintHex(t.backText ?? "#FFFFFF"),
    tags: ["decorative", "corner"],
  }));

  // ── Logo placeholder ──
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company, W * 0.35, H * 0.25, Math.round(W * 0.08),
    t.backText ?? "#FFFFFF", 1.0, cfg.fontFamily
  ));

  // ── Company ──
  layers.push(styledText({
    name: "Company", x: 0, y: H * 0.55, w: W,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.06),
    fontFamily: cfg.fontFamily, weight: 700,
    color: t.backText ?? "#FFFFFF", align: "center",
    uppercase: true, letterSpacing: 2,
    tags: ["company", "primary-text"],
  }));

  // ── Tagline ──
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: 0, y: H * 0.625, w: W,
      text: cfg.tagline, fontSize: Math.round(H * 0.022),
      fontFamily: cfg.fontFamily, weight: 300,
      color: t.backAccent ?? "#CCCCCC", align: "center",
      uppercase: true, letterSpacing: 3,
      tags: ["tagline"],
    }));
  }

  return layers;
});
'''

# ─── NEW FRONT LAYOUTS (replaces old section) ──────────────────────────────
NEW_FRONT_LAYOUTS = r'''// ===================== LUXURY TEMPLATES =====================

// ---------------------------------------------------------------------------
// #25  Luxury Divider – Gold front / teal text, two-color inversion design
// ---------------------------------------------------------------------------

function layoutLuxuryDivider(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["luxury-divider"];
  const layers: LayerV2[] = [];

  // ── Background: warm cream/gold ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── QR Code placeholder – upper right (teal on gold) ──
  // QR is rendered externally; we create a placeholder area
  if (cfg.qrCodeUrl) {
    layers.push(filledRect({
      name: "QR Area", x: W * 0.75, y: H * 0.15,
      w: W * 0.18, h: H * 0.30,
      fill: solidPaintHex(t.frontBg), // same as bg
      tags: ["qr-placeholder"],
    }));
  }

  // ── Name ──
  layers.push(styledText({
    name: "Name", x: W * 0.20, y: H * 0.38, w: W * 0.50,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.06),
    fontFamily: ff, weight: 700,
    color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // ── Title ──
  layers.push(styledText({
    name: "Title", x: W * 0.20, y: H * 0.48, w: W * 0.40,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.03),
    fontFamily: ff, weight: 500,
    color: t.frontText, uppercase: true,
    tags: ["title"],
  }));

  // ── Contact with icons ──
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts, x: W * 0.20, startY: H * 0.60,
    lineGap: Math.round(H * 0.05),
    textColor: t.contactText ?? t.frontText,
    iconColor: t.contactIcon ?? t.frontText,
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    tags: ["front"],
  }));

  return layers;
}


// ---------------------------------------------------------------------------
// #26  Social Band – 70/30 green/cream split, brand-focused
// ---------------------------------------------------------------------------

function layoutSocialBand(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["social-band"];
  const layers: LayerV2[] = [];

  // ── Green top section (70%) ──
  layers.push(filledRect({ name: "Green Zone", x: 0, y: 0, w: W, h: H * 0.70, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── Cream bottom section (30%) ──
  layers.push(filledRect({ name: "Cream Zone", x: 0, y: H * 0.70, w: W, h: H * 0.30, fill: solidPaintHex(t.frontBgAlt ?? "#E8E6E1"), tags: ["background", "panel"] }));

  // ── Brand name – centered on green, Light weight, very wide tracking ──
  layers.push(styledText({
    name: "Brand", x: 0, y: H * 0.32, w: W,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.08),
    fontFamily: ff, weight: 300,
    color: t.frontText, align: "center",
    uppercase: true, letterSpacing: 6,
    tags: ["company", "primary-text"],
  }));

  // ── Subtitle / Title – centered, light ──
  layers.push(styledText({
    name: "Subtitle", x: 0, y: H * 0.45, w: W,
    text: cfg.title || "Title", fontSize: Math.round(H * 0.025),
    fontFamily: ff, weight: 300,
    color: t.frontText, alpha: 0.7,
    align: "center", uppercase: true, letterSpacing: 4,
    tags: ["title"],
  }));

  // ── Vertical divider in cream section ──
  layers.push(divider({
    name: "V-Divider", x: W * 0.55, y: H * 0.75,
    length: H * 0.22, thickness: 1,
    color: t.divider ?? "#2C2C2C",
    direction: "vertical",
    tags: ["decorative", "divider"],
  }));

  // ── Social handle text – left of divider in cream ──
  layers.push(styledText({
    name: "Social Handle", x: W * 0.08, y: H * 0.82, w: W * 0.40,
    text: "@" + (cfg.company || "social").toLowerCase().replace(/\s+/g, ""),
    fontSize: Math.round(H * 0.02), fontFamily: ff, weight: 400,
    color: t.frontTextAlt ?? "#2C2C2C",
    uppercase: true, tags: ["contact-social"],
  }));

  // ── Contact text – right of divider in cream ──
  const contacts = extractContacts(cfg);
  if (contacts.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.62, y: H * 0.78, w: W * 0.32,
      text: contacts.website, fontSize: Math.round(H * 0.02),
      fontFamily: ff, weight: 400,
      color: t.frontTextAlt ?? "#2C2C2C", uppercase: true,
      tags: ["contact-website"],
    }));
  }
  if (contacts.email) {
    layers.push(styledText({
      name: "Email", x: W * 0.62, y: H * 0.86, w: W * 0.32,
      text: contacts.email, fontSize: Math.round(H * 0.02),
      fontFamily: ff, weight: 400,
      color: t.frontTextAlt ?? "#2C2C2C", uppercase: true,
      tags: ["contact-email"],
    }));
  }
  if (contacts.phone) {
    layers.push(styledText({
      name: "Phone", x: W * 0.62, y: H * 0.94, w: W * 0.32,
      text: contacts.phone, fontSize: Math.round(H * 0.02),
      fontFamily: ff, weight: 400,
      color: t.frontTextAlt ?? "#2C2C2C", uppercase: true,
      tags: ["contact-phone"],
    }));
  }

  return layers;
}


// ---------------------------------------------------------------------------
// #27  Organic Pattern – 60/40 vertical split, green/white, gold icon strip
// ---------------------------------------------------------------------------

function layoutOrganicPattern(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["organic-pattern"];
  const layers: LayerV2[] = [];

  // ── Green left section (60%) ──
  layers.push(filledRect({ name: "Green Zone", x: 0, y: 0, w: W * 0.60, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── White right section (40%) ──
  layers.push(filledRect({ name: "White Zone", x: W * 0.60, y: 0, w: W * 0.40, h: H, fill: solidPaintHex(t.frontBgAlt ?? "#FFFFFF"), tags: ["background", "panel"] }));

  // ── Vertical gold icon strip at divider ──
  layers.push(filledRect({
    name: "Icon Strip", x: W * 0.58, y: H * 0.325,
    w: W * 0.04, h: H * 0.35,
    fill: solidPaintHex(t.accent ?? "#B8A882"),
    tags: ["decorative", "accent"],
  }));

  // ── Name – on green ──
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.30, w: W * 0.45,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.05),
    fontFamily: ff, weight: 700,
    color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // ── Position/Title – on green ──
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.38, w: W * 0.45,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025),
    fontFamily: ff, weight: 300,
    color: t.frontText, alpha: 0.8,
    tags: ["title"],
  }));

  // ── Contact – on green, gold text ──
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts, x: W * 0.08, startY: H * 0.52,
    lineGap: Math.round(H * 0.06),
    textColor: t.contactText ?? t.frontText,
    iconColor: t.contactIcon ?? t.accent ?? "#B8A882",
    fontSize: Math.round(H * 0.02),
    fontFamily: ff,
    tags: ["front"],
  }));

  // ── Company logo – on white section ──
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company, W * 0.72, H * 0.15, Math.round(W * 0.08),
    t.frontTextAlt ?? "#6B7B73", 1.0, ff
  ));

  // ── Company text – on white section ──
  layers.push(styledText({
    name: "Company", x: W * 0.65, y: H * 0.32, w: W * 0.30,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.028),
    fontFamily: ff, weight: 500,
    color: t.frontTextAlt ?? "#6B7B73",
    uppercase: true, letterSpacing: 2,
    tags: ["company"],
  }));

  return layers;
}


// ---------------------------------------------------------------------------
// #28  Celtic Stripe – White front, 25% interlaced pattern strip on left
// ---------------------------------------------------------------------------

function layoutCelticStripe(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["celtic-stripe"];
  const layers: LayerV2[] = [];

  // ── Background: white ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── Pattern strip background – LEFT 25% ──
  const stripW = W * 0.25;
  const stripCx = stripW / 2;
  layers.push(filledRect({ name: "Strip BG", x: 0, y: 0, w: stripW, h: H, fill: solidPaintHex(t.frontBgAlt ?? "#F8F8F8"), tags: ["decorative", "panel"] }));

  // ── Interlaced oval-diamond pattern ──
  const unitH = 75;
  for (let y = 0; y < H; y += unitH) {
    // Horizontal ovals
    layers.push(strokeEllipse({
      name: `Oval A y${y}`, cx: stripCx, cy: y + 18, rx: 50, ry: 18,
      color: t.accent ?? "#2C2C2C", width: 2,
    }));
    layers.push(strokeEllipse({
      name: `Oval B y${y}`, cx: stripCx, cy: y + 56, rx: 50, ry: 18,
      color: t.accent ?? "#2C2C2C", width: 2,
    }));
    // Diamond connector
    layers.push(pathLayer({
      name: `Diamond y${y}`, x: 0, y: 0, w: W, h: H,
      commands: [
        M(stripCx - 50, y + 37),
        L(stripCx, y + 22),
        L(stripCx + 50, y + 37),
        L(stripCx, y + 52),
        Z(),
      ],
      stroke: makeStroke(t.accent ?? "#2C2C2C", 2),
      tags: ["decorative", "pattern"],
    }));
  }

  // ── Name – right of stripe ──
  layers.push(styledText({
    name: "Name", x: W * 0.35, y: H * 0.48, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.06),
    fontFamily: ff, weight: 700,
    color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // ── Contact with icons ──
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts, x: W * 0.38, startY: H * 0.68,
    lineGap: Math.round(H * 0.03),
    textColor: t.contactText ?? "#666666",
    iconColor: t.contactIcon ?? "#666666",
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    tags: ["front"],
  }));

  return layers;
}


// ---------------------------------------------------------------------------
// #29  Premium Crest – Dark front with key-skyline logo, cream text
// ---------------------------------------------------------------------------

function layoutPremiumCrest(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["premium-crest"];
  const layers: LayerV2[] = [];

  // ── Background: dark charcoal ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── Key-skyline composite logo – right 40% zone ──
  const keyColor = t.accent ?? "#F5F1E8";

  // Key shaft
  layers.push(filledRect({
    name: "Key Shaft", x: W * 0.77, y: H * 0.53,
    w: W * 0.048, h: H * 0.37,
    fill: solidPaintHex(keyColor),
    tags: ["decorative", "logo"],
  }));

  // Key head circle
  layers.push(filledEllipse({
    name: "Key Head", cx: W * 0.794, cy: H * 0.42,
    rx: W * 0.086, ry: W * 0.086,
    fill: solidPaintHex(keyColor),
    tags: ["decorative", "logo"],
  }));

  // Skyline buildings cut into key head (dark circles/rects to simulate cutouts)
  const bldgColor = t.frontBg ?? "#1A1A1A";
  const bldgs: Array<{ x: number; y: number; w: number; h: number }> = [
    { x: W * 0.735, y: H * 0.36, w: W * 0.018, h: H * 0.12 },
    { x: W * 0.755, y: H * 0.32, w: W * 0.015, h: H * 0.16 },
    { x: W * 0.775, y: H * 0.28, w: W * 0.012, h: H * 0.20 },
    { x: W * 0.790, y: H * 0.34, w: W * 0.018, h: H * 0.14 },
    { x: W * 0.812, y: H * 0.30, w: W * 0.015, h: H * 0.18 },
    { x: W * 0.830, y: H * 0.38, w: W * 0.018, h: H * 0.10 },
  ];
  bldgs.forEach((b, i) => {
    layers.push(filledRect({
      name: `Bldg ${i + 1}`, x: b.x, y: b.y, w: b.w, h: b.h,
      fill: solidPaintHex(bldgColor),
      tags: ["decorative", "logo"],
    }));
  });

  // Key hole
  layers.push(filledEllipse({
    name: "Key Hole", cx: W * 0.794, cy: H * 0.47,
    rx: W * 0.007, ry: W * 0.007,
    fill: solidPaintHex(bldgColor),
    tags: ["decorative", "logo"],
  }));

  // ── Company text – left zone ──
  layers.push(styledText({
    name: "Company", x: W * 0.08, y: H * 0.40, w: W * 0.50,
    text: cfg.company || "Real Estate", fontSize: Math.round(H * 0.06),
    fontFamily: ff, weight: 700,
    color: t.frontTextAlt ?? "#F5F1E8",
    uppercase: true, letterSpacing: 3,
    tags: ["company", "primary-text"],
  }));

  // ── Subtitle ──
  layers.push(styledText({
    name: "Subtitle", x: W * 0.08, y: H * 0.50, w: W * 0.50,
    text: cfg.tagline || cfg.title || "Lorem Ipsum", fontSize: Math.round(H * 0.03),
    fontFamily: ff, weight: 400,
    color: t.frontTextAlt ?? "#F5F1E8", alpha: 0.6,
    uppercase: true, letterSpacing: 5,
    tags: ["tagline"],
  }));

  return layers;
}


// ---------------------------------------------------------------------------
// #30  Gold Construct – 60/40 horizontal split, 3-column contact strip
// ---------------------------------------------------------------------------

function layoutGoldConstruct(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["gold-construct"];
  const layers: LayerV2[] = [];

  // ── Top section: dark gray (60%) ──
  layers.push(filledRect({ name: "Dark Zone", x: 0, y: 0, w: W, h: H * 0.60, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // ── Bottom section: light gray (40%) ──
  layers.push(filledRect({ name: "Light Zone", x: 0, y: H * 0.60, w: W, h: H * 0.40, fill: solidPaintHex(t.frontBgAlt ?? "#F5F5F5"), tags: ["background", "panel"] }));

  // ── Name – white on dark, left-aligned ──
  layers.push(styledText({
    name: "Name", x: W * 0.15, y: H * 0.20, w: W * 0.65,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.08),
    fontFamily: ff, weight: 700,
    color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // ── Title – light gray, very wide tracking ──
  layers.push(styledText({
    name: "Title", x: W * 0.15, y: H * 0.30, w: W * 0.65,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025),
    fontFamily: ff, weight: 300,
    color: t.frontTextAlt ?? "#CCCCCC",
    uppercase: true, letterSpacing: 5,
    tags: ["title"],
  }));

  // ── 3-column contact strip in bottom section ──
  const contacts = extractContacts(cfg);
  const colW = W / 3;
  const contactY = H * 0.78;
  const iconR = 16;
  const iconY = H * 0.76;
  const textY = H * 0.84;
  const contactFontSize = Math.round(H * 0.02);

  // Column 1: Phone
  if (contacts.phone) {
    layers.push(strokeEllipse({
      name: "Phone Icon Circle", cx: W * 0.08, cy: iconY,
      rx: iconR, ry: iconR,
      color: t.accent ?? "#333333", width: 1,
    }));
    layers.push(styledText({
      name: "Phone", x: W * 0.04, y: textY, w: colW * 0.85,
      text: contacts.phone, fontSize: contactFontSize,
      fontFamily: ff, weight: 400,
      color: t.contactText ?? "#333333",
      tags: ["contact-phone"],
    }));
  }

  // Column divider 1
  layers.push(divider({
    name: "Col Div 1", x: colW, y: H * 0.64,
    length: H * 0.28, thickness: 1,
    color: t.divider ?? "#DDDDDD", alpha: 0.8,
    direction: "vertical",
    tags: ["decorative", "divider"],
  }));

  // Column 2: Email
  if (contacts.email) {
    layers.push(strokeEllipse({
      name: "Email Icon Circle", cx: colW + W * 0.04, cy: iconY,
      rx: iconR, ry: iconR,
      color: t.accent ?? "#333333", width: 1,
    }));
    layers.push(styledText({
      name: "Email", x: colW + W * 0.02, y: textY, w: colW * 0.85,
      text: contacts.email, fontSize: contactFontSize,
      fontFamily: ff, weight: 400,
      color: t.contactText ?? "#333333",
      tags: ["contact-email"],
    }));
  }

  // Column divider 2
  layers.push(divider({
    name: "Col Div 2", x: colW * 2, y: H * 0.64,
    length: H * 0.28, thickness: 1,
    color: t.divider ?? "#DDDDDD", alpha: 0.8,
    direction: "vertical",
    tags: ["decorative", "divider"],
  }));

  // Column 3: Address
  if (contacts.address) {
    layers.push(strokeEllipse({
      name: "Address Icon Circle", cx: colW * 2 + W * 0.04, cy: iconY,
      rx: iconR, ry: iconR,
      color: t.accent ?? "#333333", width: 1,
    }));
    layers.push(styledText({
      name: "Address", x: colW * 2 + W * 0.02, y: textY, w: colW * 0.85,
      text: contacts.address, fontSize: contactFontSize,
      fontFamily: ff, weight: 400,
      color: t.contactText ?? "#333333",
      tags: ["contact-address"],
    }));
  }

  return layers;
}


'''

# ─── Apply replacements ──────────────────────────────────────────────────────

# 1. Replace front layouts section
new_text = text[:start] + NEW_FRONT_LAYOUTS + text[end:]

# 2. Insert back layouts after the last existing registerBackLayout block
# Need to recalculate positions after first replacement
new_register_end = new_text.find("\n});", new_text.rfind("registerBackLayout(", 0, new_text.find(LUXURY_MARKER)))
if new_register_end < 0:
    # Fallback: find the last registerBackLayout before the new luxury section
    luxury_pos = new_text.find(LUXURY_MARKER)
    search_region = new_text[:luxury_pos]
    last_reg = search_region.rfind("registerBackLayout(")
    new_register_end = new_text.find("\n});", last_reg)
    if new_register_end < 0:
        print("ERROR: Could not find insertion point for back layouts"); sys.exit(1)

new_register_end += len("\n});")
new_text = new_text[:new_register_end] + NEW_BACK_LAYOUTS + new_text[new_register_end:]

FILE.write_text(new_text, encoding="utf-8")

# ─── Verify ──────────────────────────────────────────────────────────────────
final = FILE.read_text(encoding="utf-8")
print(f"\nFinal file size: {len(final):,} chars")

expected_fns = [
    "layoutLuxuryDivider", "layoutSocialBand", "layoutOrganicPattern",
    "layoutCelticStripe", "layoutPremiumCrest", "layoutGoldConstruct",
]
expected_backs = [
    '"luxury-divider"', '"social-band"', '"organic-pattern"',
    '"celtic-stripe"', '"premium-crest"', '"gold-construct"',
]

for fn in expected_fns:
    count = final.count(fn)
    status = "✓" if count >= 2 else "✗"  # def + LAYOUT_MAP ref
    print(f"  {status} {fn}: {count} occurrences")

for bk in expected_backs:
    pattern = f"registerBackLayout({bk}"
    count = final.count(pattern)
    status = "✓" if count == 1 else "✗"
    print(f"  {status} registerBackLayout({bk}): {count}")

print("\nDone!")
