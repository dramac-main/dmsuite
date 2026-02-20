#!/usr/bin/env python3
"""Replace the 6 Minimal template layout functions with pixel-perfect versions."""

import os

ADAPTER = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "editor", "business-card-adapter.ts")

with open(ADAPTER, "r", encoding="utf-8") as f:
    content = f.read()

# Find the start: the JSDoc comment for layoutUltraMinimal
start_marker = "// ===================== MINIMAL TEMPLATES ====================="
end_marker = "// ===================== MODERN TEMPLATES ====================="

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx < 0:
    raise RuntimeError("Cannot find MINIMAL TEMPLATES marker")
if end_idx < 0:
    raise RuntimeError("Cannot find MODERN TEMPLATES marker")

# We want to replace everything between (inclusive of start_marker, exclusive of end_marker)
# But keep the end_marker

NEW_MINIMAL = r'''// ===================== MINIMAL TEMPLATES =====================
// Pixel-perfect rewrites based on TEMPLATE-SPECIFICATIONS.md reference images.
// Each function uses TEMPLATE_FIXED_THEMES colors and card-template-helpers.

/**
 * Template #1 — Ultra Minimal (M.U.N reference)
 * FRONT: Off-white #f8f9fa bg, centered tiny accent line + brand initials only.
 * Zero decoration — the emptiness IS the design.
 */
function layoutUltraMinimal(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["ultra-minimal"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: very light gray / off-white
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg), tags: ["background"],
  }));

  // Accent line: thin horizontal, centered, 44% down, 4% card width
  const lineW = Math.round(W * 0.04);
  const lineY = Math.round(H * 0.44);
  layers.push(filledRect({
    name: "Accent Line", x: Math.round((W - lineW) / 2), y: lineY, w: lineW, h: 1,
    fill: solidPaintHex(t.frontText), tags: ["decorative", "accent"],
  }));

  // Brand initials: ≤4 chars = full name, else initials
  const companyRaw = cfg.company || cfg.name || "DM";
  const brandText = companyRaw.length <= 4
    ? companyRaw.toUpperCase()
    : companyRaw.split(/\s+/).map(w => w[0]).join("").toUpperCase();
  const brandSize = Math.round(H * 0.08); // 48px at 600H
  layers.push(styledText({
    name: "Brand Initials",
    x: 0, y: Math.round(H * 0.47), w: W,
    text: brandText,
    fontSize: brandSize,
    fontFamily: font,
    weight: 500,
    color: t.frontText,
    align: "center",
    uppercase: true,
    letterSpacing: 7, // ~0.15em
    tags: ["company", "branding", "primary-text"],
  }));

  return layers;
}

// Register ultra-minimal back layout
registerBackLayout("ultra-minimal", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: pure white
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#ffffff"), tags: ["background", "back-element"],
  }));

  // Content block starts at 52% W, creating asymmetric right-of-center layout
  const contentLeft = Math.round(W * 0.52);
  let y = Math.round(H * 0.20);

  // Tier 1: Name (semibold, darkest gray #2c2c2c)
  const nameSize = Math.round(H * 0.035); // 21px
  layers.push(styledText({
    name: "Name",
    x: contentLeft, y, w: Math.round(W * 0.40),
    text: (cfg.name || "PERSON NAME").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 600,
    color: "#2c2c2c",
    uppercase: true,
    letterSpacing: 4, // ~0.10em
    tags: ["name", "primary-text", "back-element"],
  }));
  y += nameSize + Math.round(H * 0.015);

  // Tier 5: Divider line
  layers.push(filledRect({
    name: "Back Divider",
    x: contentLeft, y, w: Math.round(W * 0.08), h: 1,
    fill: solidPaintHex("#e0e0e0"), tags: ["decorative", "divider", "back-element"],
  }));
  y += 1 + Math.round(H * 0.02);

  // Tier 2: Title (light weight, mid-gray #6a6a6a, wide spacing)
  const titleSize = Math.round(H * 0.025); // 15px
  layers.push(styledText({
    name: "Title",
    x: contentLeft, y, w: Math.round(W * 0.40),
    text: (cfg.company ? `${cfg.title || "Title"} / ${cfg.company}` : cfg.title || "TITLE / POSITION").toUpperCase(),
    fontSize: titleSize,
    fontFamily: font,
    weight: 300,
    color: "#6a6a6a",
    uppercase: true,
    letterSpacing: 6, // ~0.20em
    tags: ["title", "back-element"],
  }));
  y += titleSize + Math.round(H * 0.03);

  // Tier 3: Contact lines (light weight, light gray #8a8a8a)
  const contactSize = Math.round(H * 0.02); // 12px
  const contactLineH = Math.round(contactSize * 1.6);
  const contactLines = [cfg.contacts.phone, cfg.contacts.email, cfg.contacts.website, cfg.contacts.address].filter(Boolean);
  for (const line of contactLines) {
    layers.push(styledText({
      name: `Contact`,
      x: contentLeft, y, w: Math.round(W * 0.40),
      text: line!,
      fontSize: contactSize,
      fontFamily: font,
      weight: 300,
      color: "#8a8a8a",
      tags: ["contact-text", "back-element"],
    }));
    y += contactLineH;
  }

  // Tier 4: Watermark logo/initials in lower-left
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company,
    Math.round(W * 0.14), Math.round(H * 0.70),
    Math.round(H * 0.15),
    "#b0b0b0", 1.0, font,
  ));

  return layers;
});

/**
 * Template #2 — Monogram Luxe (Samira Hadid reference)
 * FRONT: Warm lavender-gray #eae8eb bg, massive Didone serif monogram LEFT,
 * name/title/contact RIGHT starting at 48%.
 */
function layoutMonogramLuxe(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["monogram-luxe"];
  const sansFont = FONT_STACKS.geometric;
  const serifFont = FONT_STACKS.serif; // Didone/Modern serif for monogram
  const layers: LayerV2[] = [];

  // Background: warm lavender-gray
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg), tags: ["background"],
  }));

  // Massive monogram letter — first letter of person's name
  const personInitial = ((cfg.name || "S")[0] || "S").toUpperCase();
  const monoSize = Math.round(H * 0.55); // 330px at 600H
  layers.push(styledText({
    name: "Monogram",
    x: Math.round(W * 0.08), y: Math.round(H * 0.50 - monoSize * 0.55),
    w: Math.round(W * 0.38), h: monoSize,
    text: personInitial,
    fontSize: monoSize,
    fontFamily: serifFont,
    weight: 400,
    color: t.frontText, // #2c2c2c
    align: "left",
    tags: ["decorative", "monogram", "branding"],
  }));

  // Right content column starts at 48% W
  const nameX = Math.round(W * 0.48);
  const rightW = Math.round(W * 0.44); // ~8% right margin
  let y = Math.round(H * 0.35);

  // Name — semibold, dark
  const nameSize = Math.round(H * 0.03); // 18px
  layers.push(styledText({
    name: "Name",
    x: nameX, y, w: rightW,
    text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: nameSize,
    fontFamily: sansFont,
    weight: 600,
    color: t.frontText,
    uppercase: true,
    letterSpacing: 4, // ~0.12em
    tags: ["name", "primary-text"],
  }));
  y += nameSize + Math.round(H * 0.01);

  // Title — light, mid-gray
  const titleSize = Math.round(H * 0.02); // 12px
  layers.push(styledText({
    name: "Title",
    x: nameX, y, w: rightW,
    text: cfg.title || "Job Title",
    fontSize: titleSize,
    fontFamily: sansFont,
    weight: 300,
    color: "#6a6a6a",
    letterSpacing: 2, // ~0.08em
    tags: ["title"],
  }));
  y += titleSize + Math.round(H * 0.025);

  // Divider
  layers.push(filledRect({
    name: "Divider",
    x: nameX, y, w: Math.round(W * 0.06), h: 1,
    fill: solidPaintHex("#d0d0d0"), tags: ["decorative", "divider"],
  }));
  y += 1 + Math.round(H * 0.02);

  // Contact lines — light, light gray
  const contactSize = Math.round(H * 0.018); // 11px
  const contactLineH = Math.round(contactSize * 1.7);
  const contactEntries = getContactEntries(cfg);
  for (let i = 0; i < Math.min(contactEntries.length, 4); i++) {
    layers.push(styledText({
      name: contactEntries[i].type,
      x: nameX, y, w: rightW,
      text: contactEntries[i].value,
      fontSize: contactSize,
      fontFamily: sansFont,
      weight: 300,
      color: "#8a8a8a",
      tags: [`contact-${contactEntries[i].type}`, "contact-text"],
    }));
    y += contactLineH;
  }

  return layers;
}

// Register monogram-luxe back layout
registerBackLayout("monogram-luxe", (W, H, cfg, theme) => {
  const sansFont = FONT_STACKS.geometric;
  const serifFont = FONT_STACKS.serif;
  const layers: LayerV2[] = [];

  // Background: dark charcoal (inverted from front)
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg), // #2c2c2c
    tags: ["background", "back-element"],
  }));

  // Centered monogram — same initial, lighter color, slightly smaller
  const personInitial = ((cfg.name || "S")[0] || "S").toUpperCase();
  const monoSize = Math.round(H * 0.35); // 210px
  layers.push(styledText({
    name: "Back Monogram",
    x: 0, y: Math.round(H * 0.40 - monoSize * 0.5), w: W, h: monoSize,
    text: personInitial,
    fontSize: monoSize,
    fontFamily: serifFont,
    weight: 400,
    color: theme.backText, // #d8d6d9
    align: "center",
    tags: ["decorative", "monogram", "branding", "back-element"],
  }));

  // Name split into words, each on own line, wide letter-spacing, centered
  const nameWords = (cfg.name || "SAMIRA HADID").toUpperCase().split(/\s+/);
  const nameSize = Math.round(H * 0.035); // 21px
  let nameY = Math.round(H * 0.40 + monoSize * 0.35);
  for (const word of nameWords) {
    layers.push(styledText({
      name: `Name Word`,
      x: 0, y: nameY, w: W,
      text: word,
      fontSize: nameSize,
      fontFamily: sansFont,
      weight: 600,
      color: theme.backText,
      align: "center",
      uppercase: true,
      letterSpacing: 8, // ~0.25em — very wide
      tags: ["name", "back-element"],
    }));
    nameY += nameSize + Math.round(H * 0.01);
  }

  return layers;
});

/**
 * Template #3 — Geometric Mark (Rob Simax / AV reference)
 * FRONT: Dark horizontal gradient bg, centered interlocking AV monogram
 * with 45° white hatching. NO text on front.
 * Note: The hatching effect is approximated with diagonal line paths since
 * we can't do true Canvas2D clipping in the layer system.
 */
function layoutGeometricMark(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["geometric-mark"];
  const layers: LayerV2[] = [];

  // Background: dark horizontal gradient with cool-blue tint
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(0, [
      { color: "#252628", offset: 0 },
      { color: "#3b3c3e", offset: 0.50 },
      { color: "#4b4c4e", offset: 0.65 },
      { color: "#3e3f41", offset: 1.0 },
    ]),
    tags: ["background"],
  }));

  // Interlocking monogram — build as a compound path representing the
  // AV ribbon bands. We use the simplified silhouette approach:
  // two overlapping V-shapes that create the interlocking illusion.
  const cx = W * 0.50;
  const cy = H * 0.505;
  const mW = W * 0.308; // 30.8% of W
  const mH = H * 0.33;  // 33% of H

  // Band A (left-leaning "A" shape)
  const bandA: import("./schema").PathCommand[] = [
    M(cx - mW * 0.05, cy - mH * 0.50),  // top center-left
    L(cx - mW * 0.50, cy + mH * 0.50),  // bottom left
    L(cx - mW * 0.30, cy + mH * 0.50),  // bottom inner-left
    L(cx + mW * 0.05, cy - mH * 0.20),  // mid right
    L(cx + mW * 0.15, cy - mH * 0.50),  // top right
    Z(),
  ];

  // Band B (right-leaning "V" shape)
  const bandB: import("./schema").PathCommand[] = [
    M(cx + mW * 0.05, cy - mH * 0.50),  // top center-right
    L(cx + mW * 0.50, cy + mH * 0.50),  // bottom right
    L(cx + mW * 0.30, cy + mH * 0.50),  // bottom inner-right
    L(cx - mW * 0.05, cy - mH * 0.20),  // mid left
    L(cx - mW * 0.15, cy - mH * 0.50),  // top left
    Z(),
  ];

  // Render bands as white paths to approximate the hatched monogram
  layers.push(pathLayer({
    name: "Monogram Band A",
    commands: bandA,
    fill: solidPaintHex("#ffffff", 0.85),
    tags: ["decorative", "monogram", "branding"],
    opacity: 0.85,
  }));
  layers.push(pathLayer({
    name: "Monogram Band B",
    commands: bandB,
    fill: solidPaintHex("#ffffff", 0.85),
    tags: ["decorative", "monogram", "branding"],
    opacity: 0.85,
  }));

  // Hatching lines overlay (45° diagonal pattern across monogram area)
  // We create several parallel diagonal lines covering the monogram bounds
  const hatchCmds: import("./schema").PathCommand[] = [];
  const hatchSpacing = Math.round(W * 0.015); // ~16px
  const hatchW = mW * 1.2;
  const hatchH = mH * 1.2;
  const startX = cx - hatchW / 2;
  const startY = cy - hatchH / 2;

  for (let offset = -hatchW; offset < hatchW + hatchH; offset += hatchSpacing) {
    hatchCmds.push(
      M(startX + offset, startY),
      L(startX + offset - hatchH, startY + hatchH),
    );
  }

  if (hatchCmds.length > 0) {
    layers.push(pathLayer({
      name: "Hatching Pattern",
      commands: hatchCmds,
      stroke: makeStroke("#ffffff", Math.round(W * 0.003), 0.4),
      fill: solidPaintHex("#000000", 0),
      closed: false,
      tags: ["decorative", "hatching", "monogram"],
      opacity: 0.4,
    }));
  }

  return layers;
}

// Register geometric-mark back layout
registerBackLayout("geometric-mark", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: cool pale white
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#f8f9fb"), tags: ["background", "back-element"],
  }));

  // Watermark monogram (ghosted, shifted right, large)
  // Simplified as a large semi-transparent AV mark
  const wmCx = W * 0.64;
  const wmCy = H * 0.48;
  const wmW = W * 0.40;
  const wmH = H * 0.70;

  const wmBandA: import("./schema").PathCommand[] = [
    M(wmCx - wmW * 0.05, wmCy - wmH * 0.50),
    L(wmCx - wmW * 0.50, wmCy + wmH * 0.50),
    L(wmCx - wmW * 0.30, wmCy + wmH * 0.50),
    L(wmCx + wmW * 0.05, wmCy - wmH * 0.20),
    L(wmCx + wmW * 0.15, wmCy - wmH * 0.50),
    Z(),
  ];
  const wmBandB: import("./schema").PathCommand[] = [
    M(wmCx + wmW * 0.05, wmCy - wmH * 0.50),
    L(wmCx + wmW * 0.50, wmCy + wmH * 0.50),
    L(wmCx + wmW * 0.30, wmCy + wmH * 0.50),
    L(wmCx - wmW * 0.05, wmCy - wmH * 0.20),
    L(wmCx - wmW * 0.15, wmCy - wmH * 0.50),
    Z(),
  ];

  layers.push(pathLayer({
    name: "Watermark Band A",
    commands: wmBandA,
    fill: solidPaintHex("#b8b8ba", 0.25),
    tags: ["decorative", "watermark", "back-element"],
    opacity: 0.25,
  }));
  layers.push(pathLayer({
    name: "Watermark Band B",
    commands: wmBandB,
    fill: solidPaintHex("#b8b8ba", 0.25),
    tags: ["decorative", "watermark", "back-element"],
    opacity: 0.25,
  }));

  // Name (bold, near-black, top-left)
  const nameSize = Math.round(H * 0.033); // 20px
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.088), y: Math.round(H * 0.126), w: Math.round(W * 0.50),
    text: (cfg.name || "ROB SIMAX").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 700,
    color: "#1c1d1e",
    uppercase: true,
    letterSpacing: 4, // ~0.12em
    tags: ["name", "primary-text", "back-element"],
  }));

  // Title (light, mid-gray, very wide spacing)
  const titleSize = Math.round(H * 0.020); // 12px
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.090), y: Math.round(H * 0.210), w: Math.round(W * 0.50),
    text: (cfg.company || cfg.title || "ARTIST").toUpperCase(),
    fontSize: titleSize,
    fontFamily: font,
    weight: 300,
    color: "#838587",
    uppercase: true,
    letterSpacing: 6, // ~0.25em
    tags: ["title", "back-element"],
  }));

  // Address (light, medium gray, bottom-left)
  const contactSize = Math.round(H * 0.020);
  layers.push(styledText({
    name: "Address",
    x: Math.round(W * 0.090), y: Math.round(H * 0.772), w: Math.round(W * 0.55),
    text: (cfg.contacts.address || "BOULEVARD 01234").toUpperCase(),
    fontSize: contactSize,
    fontFamily: font,
    weight: 300,
    color: "#8a8b8d",
    uppercase: true,
    letterSpacing: 2,
    tags: ["contact-address", "back-element"],
  }));

  // Contact line 1: phone (right-aligned)
  if (cfg.contacts.phone) {
    layers.push(styledText({
      name: "Phone",
      x: Math.round(W * 0.09), y: Math.round(H * 0.825), w: Math.round(W * 0.64),
      text: cfg.contacts.phone,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#939495",
      align: "right",
      tags: ["contact-phone", "back-element"],
    }));
  }

  // Contact line 2: email + website
  if (cfg.contacts.email) {
    layers.push(styledText({
      name: "Email",
      x: Math.round(W * 0.09), y: Math.round(H * 0.878), w: Math.round(W * 0.35),
      text: cfg.contacts.email,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#7c7d7f",
      tags: ["contact-email", "back-element"],
    }));
  }
  if (cfg.contacts.website) {
    layers.push(styledText({
      name: "Website",
      x: Math.round(W * 0.09), y: Math.round(H * 0.878), w: Math.round(W * 0.67),
      text: cfg.contacts.website,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#7c7d7f",
      align: "right",
      tags: ["contact-website", "back-element"],
    }));
  }

  return layers;
});

/**
 * Template #4 — Frame Minimal (Adika Saputra reference)
 * FRONT: Pure white bg, 2 diagonal L-brackets (TL + BR only),
 * 5-level gray text hierarchy, color-coded contact dots, QR code.
 */
function layoutFrameMinimal(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["frame-minimal"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: pure white
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#FFFFFF"), tags: ["background"],
  }));

  // L-Bracket: top-left corner
  const bracketArmH = Math.round(W * 0.076); // 7.6% W horizontal arm
  const bracketArmV = Math.round(H * 0.10);  // 10% H vertical arm
  const bracketThick = 1.5;
  const tlX = Math.round(W * 0.10);
  const tlY = Math.round(H * 0.16);

  layers.push(pathLayer({
    name: "TL Bracket",
    commands: cornerBracketPath("tl", tlX, tlY, Math.max(bracketArmH, bracketArmV), bracketThick),
    fill: solidPaintHex("#CCCCCC"),
    tags: ["decorative", "corner", "corner-bracket"],
  }));

  // L-Bracket: bottom-right corner (mirror)
  const brX = Math.round(W * 0.90);
  const brY = Math.round(H * 0.84);
  layers.push(pathLayer({
    name: "BR Bracket",
    commands: cornerBracketPath("br", brX, brY, Math.max(bracketArmH, bracketArmV), bracketThick),
    fill: solidPaintHex("#CCCCCC"),
    tags: ["decorative", "corner", "corner-bracket"],
  }));

  // Name — semibold, dark
  const textLeft = Math.round(W * 0.143);
  let y = Math.round(H * 0.24);
  const nameSize = Math.round(H * 0.045); // 27px
  layers.push(styledText({
    name: "Name",
    x: textLeft, y, w: Math.round(W * 0.55),
    text: (cfg.name || "ADIKA SAPUTRA").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 600,
    color: "#2D2D2D",
    uppercase: true,
    letterSpacing: 5, // ~0.18em
    tags: ["name", "primary-text"],
  }));
  y += nameSize + Math.round(H * 0.06);

  // Title — light, mid-gray, Title Case
  const titleSize = Math.round(H * 0.025); // 15px
  layers.push(styledText({
    name: "Title",
    x: textLeft, y, w: Math.round(W * 0.50),
    text: cfg.title || "Graphic Designer",
    fontSize: titleSize,
    fontFamily: font,
    weight: 300,
    color: "#888888",
    letterSpacing: 1,
    tags: ["title"],
  }));
  y += titleSize + Math.round(H * 0.16); // big breathing room before contacts

  // Color-coded contact dots + text
  const dotRadius = 3;
  const dotColors = ["#FF6B35", "#4CAF50", "#2196F3"]; // orange, green, blue
  const contactTypes = [
    { field: cfg.phone, type: "phone" },
    { field: cfg.email, type: "email" },
    { field: cfg.address, type: "address" },
  ];
  const contactSize = Math.round(H * 0.020); // 12px
  const contactGap = Math.round(H * 0.06);

  for (let i = 0; i < contactTypes.length; i++) {
    const entry = contactTypes[i];
    if (!entry.field) continue;
    const lineY = y + i * contactGap;

    // Colored dot
    layers.push(filledEllipse({
      name: `${entry.type} Dot`,
      cx: textLeft + dotRadius, cy: lineY + contactSize / 2,
      rx: dotRadius, ry: dotRadius,
      fill: solidPaintHex(dotColors[i]),
      tags: ["decorative", "contact-dot"],
    }));

    // Contact text
    layers.push(styledText({
      name: entry.type,
      x: textLeft + 25, y: lineY, w: Math.round(W * 0.50),
      text: entry.field,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#999999",
      tags: [`contact-${entry.type}`, "contact-text"],
    }));
  }

  // Website (lighter gray)
  if (cfg.website) {
    const webY = y + contactTypes.length * contactGap;
    layers.push(styledText({
      name: "Website",
      x: textLeft + 25, y: webY, w: Math.round(W * 0.50),
      text: cfg.website,
      fontSize: Math.round(H * 0.018), // 11px
      fontFamily: font,
      weight: 400,
      color: "#AAAAAA",
      tags: ["contact-website", "contact-text"],
    }));
  }

  // QR Code placeholder (top-right)
  if (cfg.qrCodeUrl) {
    const qrSize = Math.round(W * 0.13); // 137px
    layers.push(filledRect({
      name: "QR Code Area",
      x: Math.round(W * 0.80), y: Math.round(H * 0.20), w: qrSize, h: qrSize,
      fill: solidPaintHex("#000000", 0.05),
      tags: ["qr-code", "branding"],
    }));
  }

  return layers;
}

// Register frame-minimal back layout
registerBackLayout("frame-minimal", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: near-black
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#1A1A1A"), tags: ["background", "back-element"],
  }));

  // Closed rectangular frame (58% W × 30% H, centered)
  const frameW = Math.round(W * 0.58);
  const frameH = Math.round(H * 0.30);
  const frameX = Math.round((W - frameW) / 2);
  const frameY = Math.round(H * 0.47 - frameH / 2);
  layers.push(strokeRect({
    name: "Back Frame",
    x: frameX, y: frameY, w: frameW, h: frameH,
    color: "#FFFFFF", alpha: 0.6, width: 1,
    tags: ["decorative", "border", "back-element"],
  }));

  // "MINIMAL" text — bold, extremely wide tracking
  layers.push(styledText({
    name: "Main Title",
    x: frameX, y: frameY + Math.round(frameH * 0.33), w: frameW,
    text: (cfg.company || "MINIMAL").toUpperCase(),
    fontSize: Math.round(H * 0.085), // 51px
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    align: "center",
    uppercase: true,
    letterSpacing: 12, // ~0.35em
    tags: ["company", "back-element"],
  }));

  // Subtitle — light, muted
  layers.push(styledText({
    name: "Subtitle",
    x: frameX, y: frameY + Math.round(frameH * 0.70), w: frameW,
    text: cfg.tagline || "Business Card",
    fontSize: Math.round(H * 0.030), // 18px
    fontFamily: font,
    weight: 300,
    color: "#AAAAAA",
    align: "center",
    letterSpacing: 3,
    tags: ["tagline", "back-element"],
  }));

  // White QR code (top-right corner)
  if (cfg.qrCodeUrl) {
    const qrSize = Math.round(W * 0.09);
    layers.push(filledRect({
      name: "QR Code Area",
      x: Math.round(W * 0.85), y: Math.round(H * 0.08), w: qrSize, h: qrSize,
      fill: solidPaintHex("#FFFFFF", 0.08),
      tags: ["qr-code", "back-element"],
    }));
  }

  return layers;
});

/**
 * Template #5 — Split Vertical (Pathetic Studio reference)
 * FRONT: Diagonal trapezoid split (58% top → 38% bottom), dark left + warm
 * off-white right. 5 geometric logo bars, company name, tagline — ALL on dark.
 * Light zone is EMPTY.
 */
function layoutSplitVertical(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["split-vertical"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: warm off-white #F5F5F0
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg), tags: ["background"],
  }));

  // Dark diagonal trapezoid: (0,0) → (58%W, 0) → (38%W, H) → (0, H)
  layers.push(pathLayer({
    name: "Dark Trapezoid",
    commands: [
      M(0, 0),
      L(Math.round(W * 0.58), 0),
      L(Math.round(W * 0.38), H),
      L(0, H),
      Z(),
    ],
    fill: solidPaintHex(t.frontBgAlt!), // #2C2C2C
    tags: ["decorative", "accent", "panel"],
  }));

  // 5 geometric logo bars (white, varying widths)
  const barWidths = [0.022, 0.018, 0.027, 0.015, 0.020]; // % of W
  const barH = Math.round(H * 0.015);
  const barGap = Math.round(H * 0.01);
  const barX = Math.round(W * 0.22);
  let barY = Math.round(H * 0.30);

  for (let i = 0; i < barWidths.length; i++) {
    layers.push(filledRect({
      name: `Logo Bar ${i + 1}`,
      x: barX, y: barY, w: Math.round(W * barWidths[i]), h: barH,
      fill: solidPaintHex("#FFFFFF"),
      tags: ["decorative", "logo-mark", "branding"],
    }));
    barY += barH + barGap;
  }

  // Studio name (white, semibold, wide tracking)
  const nameSize = Math.round(H * 0.055); // 33px
  layers.push(styledText({
    name: "Company",
    x: Math.round(W * 0.22), y: Math.round(H * 0.42), w: Math.round(W * 0.30),
    text: (cfg.company || "PATHETIC STUDIO").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 600,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 7, // ~0.20em
    tags: ["company", "branding", "primary-text"],
  }));

  // Tagline (white @ 65% alpha, light, very wide tracking)
  layers.push(styledText({
    name: "Tagline",
    x: Math.round(W * 0.22), y: Math.round(H * 0.52), w: Math.round(W * 0.30),
    text: (cfg.tagline || "YOUR DESIGN STUDIO").toUpperCase(),
    fontSize: Math.round(H * 0.022), // 13px
    fontFamily: font,
    weight: 300,
    color: "#FFFFFF",
    alpha: 0.65,
    uppercase: true,
    letterSpacing: 8, // ~0.30em
    tags: ["tagline"],
  }));

  return layers;
}

// Register split-vertical back layout
registerBackLayout("split-vertical", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: warm off-white
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#F5F5F0"), tags: ["background", "back-element"],
  }));

  // Dark trapezoid mirrored: (42%W, 0) → (W, 0) → (W, H) → (62%W, H)
  layers.push(pathLayer({
    name: "Back Dark Trapezoid",
    commands: [
      M(Math.round(W * 0.42), 0),
      L(W, 0),
      L(W, H),
      L(Math.round(W * 0.62), H),
      Z(),
    ],
    fill: solidPaintHex("#2C2C2C"),
    tags: ["decorative", "accent", "panel", "back-element"],
  }));

  // Contact details in light zone (left side)
  const iconR = Math.round(H * 0.0175);
  const iconCX = Math.round(W * 0.08);
  const contactTextX = Math.round(W * 0.14);
  const contactSize = Math.round(H * 0.025); // 15px
  const contactFields = [
    cfg.contacts.address || "Your Address",
    cfg.contacts.phone || "+012 345 678",
    cfg.contacts.email || "email@mail.com",
    cfg.contacts.website || "www.website.com",
  ];
  const contactYs = [0.22, 0.30, 0.38, 0.46];

  for (let i = 0; i < contactFields.length; i++) {
    if (!contactFields[i]) continue;
    const cY = Math.round(H * contactYs[i]);

    // Circle icon outline
    layers.push(strokeEllipse({
      name: `Contact Icon ${i + 1}`,
      cx: iconCX, cy: cY,
      rx: iconR, ry: iconR,
      color: "#888888", width: 1,
      tags: ["contact-icon", "back-element"],
    }));

    // Contact text
    layers.push(styledText({
      name: `Contact ${i + 1}`,
      x: contactTextX, y: cY - contactSize / 2, w: Math.round(W * 0.28),
      text: contactFields[i],
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#444444",
      letterSpacing: 1,
      tags: ["contact-text", "back-element"],
    }));
  }

  // Separator line
  layers.push(filledRect({
    name: "Separator",
    x: Math.round(W * 0.08), y: Math.round(H * 0.63),
    w: Math.round(W * 0.25), h: 1,
    fill: solidPaintHex("#CCCCCC", 0.6),
    tags: ["decorative", "divider", "back-element"],
  }));

  // Name (bold, dark — ties visually to dark zone)
  const nameSize = Math.round(H * 0.05); // 30px
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.08), y: Math.round(H * 0.68), w: Math.round(W * 0.35),
    text: cfg.name || "Person Name",
    fontSize: nameSize,
    fontFamily: font,
    weight: 700,
    color: "#2C2C2C",
    letterSpacing: 1,
    tags: ["name", "primary-text", "back-element"],
  }));

  // Title (light, medium gray, moderate tracking)
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.08), y: Math.round(H * 0.75), w: Math.round(W * 0.35),
    text: cfg.title || "Graphic Designer",
    fontSize: Math.round(H * 0.025),
    fontFamily: font,
    weight: 300,
    color: "#888888",
    letterSpacing: 3,
    tags: ["title", "back-element"],
  }));

  // Social icons on dark zone (right side) — white circle outlines
  const socialX = Math.round(W * 0.85);
  const socialR = Math.round(H * 0.018);
  const socialYs = [0.25, 0.33, 0.41, 0.49, 0.57];

  for (let i = 0; i < socialYs.length; i++) {
    layers.push(strokeEllipse({
      name: `Social Icon ${i + 1}`,
      cx: socialX, cy: Math.round(H * socialYs[i]),
      rx: socialR, ry: socialR,
      color: "#FFFFFF", width: 1,
      tags: ["decorative", "social-icon", "back-element"],
    }));
  }

  return layers;
});

/**
 * Template #6 — Diagonal Mono (Henry Soaz reference)
 * FRONT: Multi-angle 7-segment zigzag polygon dividing charcoal and warm off-white,
 * white accent triangle on Segment 1, large rotated decorative name on light side,
 * name + title in chevron notch on dark side, contact info on light side.
 */
function layoutDiagonalMono(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["diagonal-mono"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: warm off-white #E2E2E2
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg), tags: ["background"],
  }));

  // Dark polygon: 7-segment zigzag with chevron notch
  layers.push(pathLayer({
    name: "Dark Zigzag Polygon",
    commands: [
      M(0, 0),
      L(Math.round(W * 0.43), 0),                   // top edge to boundary start
      L(Math.round(W * 0.46), Math.round(H * 0.20)), // Seg 1: gentle lean right
      L(Math.round(W * 0.29), Math.round(H * 0.30)), // Seg 2: sharp chevron cut
      L(Math.round(W * 0.30), Math.round(H * 0.38)), // Seg 3: narrow hold
      L(Math.round(W * 0.49), Math.round(H * 0.39)), // Seg 4: step right
      L(Math.round(W * 0.15), Math.round(H * 0.63)), // Seg 5: steep diagonal sweep
      L(Math.round(W * 0.47), Math.round(H * 0.64)), // Seg 6: step right
      L(Math.round(W * 0.57), H),                    // Seg 7: gentle lean to bottom
      L(0, H),                                        // bottom-left corner
      Z(),
    ],
    fill: solidPaintHex(t.frontBgAlt!), // #232323
    tags: ["decorative", "accent", "panel"],
  }));

  // White accent triangle along Segment 1
  layers.push(pathLayer({
    name: "Accent Triangle",
    commands: [
      M(Math.round(W * 0.43), 0),
      L(Math.round(W * 0.475), 0),
      L(Math.round(W * 0.46), Math.round(H * 0.20)),
      Z(),
    ],
    fill: solidPaintHex("#FFFFFF"),
    tags: ["decorative", "accent"],
  }));

  // Name in chevron notch (white on dark)
  const nameSize = Math.round(H * 0.10); // 60px
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.08), y: Math.round(H * 0.22), w: Math.round(W * 0.34),
    text: (cfg.name || "HENRY SOAZ").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 4, // ~0.12em
    lineHeight: 1.1,
    tags: ["name", "primary-text"],
  }));

  // Title below name (white on dark, lowercase)
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.10), y: Math.round(H * 0.36), w: Math.round(W * 0.28),
    text: cfg.title || "title / position",
    fontSize: Math.round(H * 0.04), // 24px
    fontFamily: font,
    weight: 300,
    color: "#FFFFFF",
    tags: ["title"],
  }));

  // Large rotated decorative name on light side (~32° CW)
  // Note: rotation is applied via the layer's transform property
  const rotatedSize = Math.round(H * 0.16); // 96px
  const rotatedLayer = styledText({
    name: "Decorative Name",
    x: Math.round(W * 0.50), y: Math.round(H * 0.10), w: Math.round(W * 0.50),
    text: (cfg.name || "HENRY SOAZ").toUpperCase(),
    fontSize: rotatedSize,
    fontFamily: font,
    weight: 700,
    color: "#232323",
    uppercase: true,
    tags: ["decorative", "name-decorative"],
  });
  // Apply rotation transform: ~32° clockwise
  const rotRad = (32 * Math.PI) / 180;
  rotatedLayer.transform = [
    Math.cos(rotRad), Math.sin(rotRad),
    -Math.sin(rotRad), Math.cos(rotRad),
    0, 0,
  ] as Matrix2D;
  layers.push(rotatedLayer);

  // Contact information on light side (right of boundary)
  const contactX = Math.round(W * 0.50);
  const contactSize = Math.round(H * 0.025); // 15px
  const contactLines = [
    { text: cfg.address || "Main Street, Your Location", y: 0.40 },
    { text: cfg.address ? "" : "Number 123A, 56478", y: 0.44 },
    { text: cfg.email || "hr@email.com", y: 0.54 },
    { text: cfg.phone || "+92 94 56 789", y: 0.59 },
    { text: cfg.website || "www.company.com", y: 0.64 },
  ];

  for (const cl of contactLines) {
    if (!cl.text) continue;
    layers.push(styledText({
      name: "Contact",
      x: contactX, y: Math.round(H * cl.y), w: Math.round(W * 0.40),
      text: cl.text,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#232323",
      tags: ["contact-text"],
    }));
  }

  return layers;
}

// Register diagonal-mono back layout
registerBackLayout("diagonal-mono", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: warm off-white
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#E2E2E2"), tags: ["background", "back-element"],
  }));

  // Complex 5-zone dark polygon
  layers.push(pathLayer({
    name: "Back Dark Polygon",
    commands: [
      M(Math.round(W * 0.35), 0),
      L(W, 0),
      L(W, Math.round(H * 0.65)),
      L(Math.round(W * 0.62), Math.round(H * 0.72)),
      L(Math.round(W * 0.65), H),
      L(0, H),
      L(0, Math.round(H * 0.46)),
      L(Math.round(W * 0.38), Math.round(H * 0.28)),
      Z(),
    ],
    fill: solidPaintHex("#232323"),
    tags: ["decorative", "accent", "panel", "back-element"],
  }));

  // Geometric logo: 2 crossing white lines forming X
  const logoStroke = makeStroke("#FFFFFF", Math.round(W * 0.01));

  // Line A
  layers.push(pathLayer({
    name: "Logo Line A",
    commands: [
      M(Math.round(W * 0.50), Math.round(H * 0.48)),
      L(Math.round(W * 0.35), Math.round(H * 0.61)),
    ],
    fill: solidPaintHex("#000000", 0),
    stroke: logoStroke,
    closed: false,
    tags: ["logo-mark", "branding", "back-element"],
  }));

  // Line B
  layers.push(pathLayer({
    name: "Logo Line B",
    commands: [
      M(Math.round(W * 0.67), Math.round(H * 0.50)),
      L(Math.round(W * 0.46), Math.round(H * 0.65)),
    ],
    fill: solidPaintHex("#000000", 0),
    stroke: logoStroke,
    closed: false,
    tags: ["logo-mark", "branding", "back-element"],
  }));

  // Satellite dots
  const dotR = Math.round(W * 0.004);
  layers.push(filledEllipse({
    name: "Satellite Dot 1",
    cx: Math.round(W * 0.505), cy: Math.round(H * 0.53), rx: dotR, ry: dotR,
    fill: solidPaintHex("#FFFFFF"),
    tags: ["decorative", "back-element"],
  }));
  layers.push(filledEllipse({
    name: "Satellite Dot 2",
    cx: Math.round(W * 0.595), cy: Math.round(H * 0.535), rx: dotR, ry: dotR,
    fill: solidPaintHex("#FFFFFF"),
    tags: ["decorative", "back-element"],
  }));

  // "COMPANY" text (white, bold, wide tracking)
  layers.push(styledText({
    name: "Company",
    x: Math.round(W * 0.55), y: Math.round(H * 0.55), w: Math.round(W * 0.35),
    text: (cfg.company || "COMPANY").toUpperCase(),
    fontSize: Math.round(H * 0.04), // 24px
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 5, // ~0.15em
    tags: ["company", "branding", "back-element"],
  }));

  return layers;
});

'''

content = content[:start_idx] + NEW_MINIMAL + content[end_idx:]

with open(ADAPTER, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Replaced Minimal templates section successfully")
print(f"Total file size: {len(content)} chars")
