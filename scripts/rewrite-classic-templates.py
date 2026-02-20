#!/usr/bin/env python3
"""Rewrite the CLASSIC / CORPORATE section of business-card-adapter.ts
with pixel-perfect template implementations matching reference images."""

import pathlib, sys

ADAPTER = pathlib.Path(r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts")

START_MARKER = "// ===================== CLASSIC / CORPORATE TEMPLATES ====================="
END_MARKER   = "// ===================== CREATIVE TEMPLATES ====================="

NEW_SECTION = r'''// ===================== CLASSIC / CORPORATE TEMPLATES =====================

// ─────────────────────────────────────────────────────────────────────────────
// #13  circle-brand   —  Close Financial reference
// ─────────────────────────────────────────────────────────────────────────────

function layoutCircleBrand(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["circle-brand"];
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── background ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: t.frontBg! }));

  // ── circular logo placeholder (upper-left) ──
  const logoDia = W * 0.12;  // ~126 px
  const logoCx = W * 0.15;
  const logoCy = H * 0.25;
  layers.push(filledEllipse({
    name: "Logo Circle", cx: logoCx, cy: logoCy,
    rx: logoDia / 2, ry: logoDia / 2, fill: t.accent!,
    tags: ["logo", "decorative"],
  }));
  // white icon placeholder inside circle
  const iconS = logoDia * 0.45;
  layers.push(filledRect({
    name: "Logo Icon",
    x: logoCx - iconS / 2, y: logoCy - iconS / 2,
    w: iconS, h: iconS, fill: "#FFFFFF",
    tags: ["logo"],
  }));
  // user logo overlay
  layers.push(...buildTemplateLogoLayers(cfg, logoCx - logoDia / 2, logoCy - logoDia / 2, logoDia, logoDia, "#FFFFFF", ff, ["logo"]));

  // ── company name — hero text, centered ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.42,
    w: W * 0.80, text: cfg.company || "Company",
    fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 500, color: t.accent!, align: "center",
    tags: ["company"],
  }));

  // ── name (left) ──
  layers.push(styledText({
    name: "Name", x: W * 0.15, y: H * 0.62,
    w: W * 0.40, text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.035), fontFamily: ff,
    weight: 600, color: t.accent!,
    tags: ["name", "primary-text"],
  }));

  // ── title (left, below name) ──
  layers.push(styledText({
    name: "Title", x: W * 0.15, y: H * 0.68,
    w: W * 0.40, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: t.frontTextAlt!,
    tags: ["title"],
  }));

  // ── contact info — left column ──
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons(contacts, {
    x: W * 0.15, y: H * 0.78,
    fontSize: Math.round(H * 0.022), fontFamily: ff,
    textColor: t.contactText!, iconColor: t.contactIcon || t.accent!,
    lineHeight: Math.round(H * 0.04),
    showIcons: cfg.showContactIcons !== false,
    tags: ["contact-text"],
  });
  layers.push(...cLines);

  // ── address — right-aligned ──
  if (cfg.address) {
    const addrLines = cfg.address.split(",").map(s => s.trim());
    addrLines.forEach((line, i) => {
      layers.push(styledText({
        name: `Address ${i + 1}`,
        x: W * 0.50, y: H * 0.74 + i * Math.round(H * 0.04),
        w: W * 0.38, text: line,
        fontSize: Math.round(H * 0.022), fontFamily: ff,
        weight: 400, color: t.contactText!, align: "right",
        tags: ["contact-text"],
      }));
    });
  }

  return layers;
}

// Back layout: diagonal blue gradient + large logo + services
registerBackLayout("circle-brand", (W, H, cfg, theme) => {
  const t = theme;
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── gradient background ──
  layers.push(filledRect({
    name: "Back BG", x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(135, [
      [t.accent!, 0],
      [t.backBgAlt || t.backBg!, 1],
    ]),
    tags: ["decorative"],
  }));

  // ── large centered logo ──
  const logoS = W * 0.20;
  const logoCx = W * 0.50;
  const logoCy = H * 0.25;
  layers.push(...buildTemplateLogoLayers(cfg, logoCx - logoS / 2, logoCy - logoS / 2, logoS, logoS, "#FFFFFF", ff, ["logo"]));

  // ── company name ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.38,
    w: W * 0.80, text: cfg.company || "Company",
    fontSize: Math.round(H * 0.07), fontFamily: ff,
    weight: 500, color: "#FFFFFF", align: "center",
    tags: ["company"],
  }));

  // ── license / tagline text ──
  if (cfg.tagline) {
    layers.push(styledText({
      name: "License", x: W * 0.10, y: H * 0.50,
      w: W * 0.80, text: cfg.tagline,
      fontSize: Math.round(H * 0.02), fontFamily: ff,
      weight: 300, color: t.backAccent || "#B8D4F0", align: "center",
      tags: ["tagline"],
    }));
  }

  // ── services list with checkmarks ──
  const services = ["Consulting", "Strategy", "Advisory"];
  const serviceY = H * 0.68;
  services.forEach((svc, i) => {
    const yy = serviceY + i * Math.round(H * 0.06);
    // checkmark
    layers.push(styledText({
      name: `Check ${i + 1}`, x: W * 0.15 - Math.round(W * 0.03), y: yy,
      w: Math.round(W * 0.03), text: "✓",
      fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: "#FFFFFF",
      tags: ["decorative"],
    }));
    // service text
    layers.push(styledText({
      name: `Service ${i + 1}`, x: W * 0.15, y: yy,
      w: W * 0.60, text: svc,
      fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: "#FFFFFF",
      tags: ["contact-text"],
    }));
  });

  return layers;
});


// ─────────────────────────────────────────────────────────────────────────────
// #14  full-color-back   —  Gordon Law Group reference
// ─────────────────────────────────────────────────────────────────────────────

function layoutFullColorBack(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["full-color-back"];
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── white background ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: "#FFFFFF" }));

  // ── name — top left, hero text ──
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.19,
    w: W * 0.55, text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 700, color: t.accent!,
    tags: ["name", "primary-text"],
  }));

  // ── title ──
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.28,
    w: W * 0.50, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.035), fontFamily: ff,
    weight: 400, color: t.frontTextAlt!,
    tags: ["title"],
  }));

  // ── company ──
  layers.push(styledText({
    name: "Company", x: W * 0.08, y: H * 0.42,
    w: W * 0.50, text: cfg.company || "Company",
    fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 500, color: t.accent!,
    tags: ["company"],
  }));

  // ── address ──
  if (cfg.address) {
    const addrLines = cfg.address.split(",").map(s => s.trim());
    addrLines.forEach((line, i) => {
      layers.push(styledText({
        name: `Address ${i + 1}`,
        x: W * 0.08, y: H * 0.53 + i * Math.round(H * 0.04),
        w: W * 0.50, text: line,
        fontSize: Math.round(H * 0.028), fontFamily: ff,
        weight: 400, color: t.frontTextAlt!,
        tags: ["contact-text"],
      }));
    });
  }

  // ── contact details ──
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons(contacts, {
    x: W * 0.08, y: H * 0.72,
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    textColor: t.contactText!, iconColor: t.contactIcon || t.accent!,
    lineHeight: Math.round(H * 0.045),
    showIcons: cfg.showContactIcons !== false,
    tags: ["contact-text"],
  });
  layers.push(...cLines);

  // ── geometric diamond logo (upper-right, large) ──
  const logoW = W * 0.25;
  const logoH = H * 0.35;
  const logoX = W * 0.75 - logoW / 2;
  const logoY = H * 0.15;
  // diamond shape placeholder
  layers.push(pathLayer({
    name: "Logo Diamond",
    commands: [
      M(logoX + logoW / 2, logoY),
      L(logoX + logoW, logoY + logoH / 2),
      L(logoX + logoW / 2, logoY + logoH),
      L(logoX, logoY + logoH / 2),
      Z(),
    ],
    fill: t.accent!,
    tags: ["logo", "decorative"],
  }));
  // user logo overlay
  layers.push(...buildTemplateLogoLayers(cfg, logoX, logoY, logoW, logoH, t.accent!, ff, ["logo"]));

  return layers;
}

// Back layout: full-bleed diagonal blue gradient + diamond watermark + centered logo
registerBackLayout("full-color-back", (W, H, cfg, theme) => {
  const t = theme;
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── gradient background ──
  layers.push(filledRect({
    name: "Back BG", x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(135, [
      [t.accentAlt || t.backBg!, 0],
      [t.accent!, 1],
    ]),
    tags: ["decorative"],
  }));

  // ── diamond watermark shapes at 5% opacity ──
  const wmPositions = [
    { x: W * 0.10, y: H * 0.08, s: W * 0.12 },
    { x: W * 0.78, y: H * 0.15, s: W * 0.08 },
    { x: W * 0.85, y: H * 0.70, s: W * 0.15 },
    { x: W * 0.05, y: H * 0.75, s: W * 0.06 },
  ];
  wmPositions.forEach((wm, i) => {
    layers.push(pathLayer({
      name: `Watermark ${i + 1}`,
      commands: [
        M(wm.x + wm.s / 2, wm.y),
        L(wm.x + wm.s, wm.y + wm.s / 2),
        L(wm.x + wm.s / 2, wm.y + wm.s),
        L(wm.x, wm.y + wm.s / 2),
        Z(),
      ],
      fill: "#FFFFFF",
      tags: ["decorative", "watermark"],
    }));
    // Set low opacity on watermark
    const wmLayer = layers[layers.length - 1];
    if (wmLayer.transform) wmLayer.transform.opacity = 0.05;
  });

  // ── centered logo ──
  const logoS = W * 0.20;
  layers.push(...buildTemplateLogoLayers(cfg, W * 0.50 - logoS / 2, H * 0.18, logoS, logoS * 1.25, "#FFFFFF", ff, ["logo"]));

  // ── company name with letter spacing ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.48,
    w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.06), fontFamily: ff,
    weight: 300, color: "#FFFFFF", align: "center",
    letterSpacing: 8,
    tags: ["company"],
  }));

  // ── website ──
  if (cfg.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.10, y: H * 0.68,
      w: W * 0.80, text: cfg.website,
      fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: "#FFFFFF", align: "center",
      tags: ["contact-text"],
    }));
  }

  return layers;
});


// ─────────────────────────────────────────────────────────────────────────────
// #15  engineering-pro   —  Holdfast Engineering reference
// ─────────────────────────────────────────────────────────────────────────────

function layoutEngineeringPro(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["engineering-pro"];
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── off-white background ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: t.frontBg! }));

  // ── logo icon placeholder (upper-left) ──
  const logoS = W * 0.08;
  const logoX = W * 0.12;
  const logoY = H * 0.12;
  // angular geometric placeholder
  layers.push(pathLayer({
    name: "Logo Icon",
    commands: [
      M(logoX, logoY + logoS * 1.5),
      L(logoX + logoS * 0.5, logoY),
      L(logoX + logoS, logoY + logoS * 1.5),
      Z(),
    ],
    fill: t.accent!,    // #5DADE2
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildTemplateLogoLayers(cfg, logoX, logoY, logoS, logoS * 1.5, t.accent!, ff, ["logo"]));

  // ── "HOLDFAST" company name ──
  layers.push(styledText({
    name: "Company", x: logoX + logoS + W * 0.02, y: H * 0.13,
    w: W * 0.50, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.06), fontFamily: ff,
    weight: 700, color: t.frontText!,     // #2C3E50
    letterSpacing: 4,
    tags: ["company"],
  }));

  // ── "ENGINEERING" tagline ──
  layers.push(styledText({
    name: "Tagline", x: logoX + logoS + W * 0.02, y: H * 0.22,
    w: W * 0.50, text: (cfg.tagline || "Engineering").toUpperCase(),
    fontSize: Math.round(H * 0.025), fontFamily: ff,
    weight: 400, color: t.accent!,        // #5DADE2
    letterSpacing: 8,
    tags: ["tagline"],
  }));

  // ── name ──
  layers.push(styledText({
    name: "Name", x: W * 0.12, y: H * 0.45,
    w: W * 0.55, text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 500, color: t.frontText!,
    tags: ["name", "primary-text"],
  }));

  // ── title (accent blue) ──
  layers.push(styledText({
    name: "Title", x: W * 0.12, y: H * 0.55,
    w: W * 0.50, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: t.accent!,
    tags: ["title"],
  }));

  // ── horizontal divider ──
  layers.push(divider({
    name: "Divider",
    x: W * 0.12, y: H * 0.66,
    length: W * 0.76, thickness: 1,
    color: t.divider || "#BDC3C7",
    direction: "horizontal",
    tags: ["decorative"],
  }));

  // ── contact info ──
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons(contacts, {
    x: W * 0.12, y: H * 0.73,
    fontSize: Math.round(H * 0.022), fontFamily: ff,
    textColor: t.contactText!,   // #34495E
    iconColor: t.contactIcon || t.accent!,
    lineHeight: Math.round(H * 0.04),
    showIcons: cfg.showContactIcons !== false,
    tags: ["contact-text"],
  });
  layers.push(...cLines);

  return layers;
}

// Back layout: solid bright blue with tonal embossed logo
registerBackLayout("engineering-pro", (W, H, cfg, theme) => {
  const t = theme;
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── solid blue background ──
  layers.push(filledRect({ name: "Back BG", x: 0, y: 0, w: W, h: H, fill: t.backBg! }));

  // ── tonal logo icon (centered, larger) ──
  const logoS = W * 0.15;
  const logoCx = W * 0.50;
  const logoCy = H * 0.30;
  // angular shape in tonal blue
  layers.push(pathLayer({
    name: "Back Logo",
    commands: [
      M(logoCx, logoCy - logoS * 0.6),
      L(logoCx + logoS * 0.5, logoCy + logoS * 0.4),
      L(logoCx - logoS * 0.5, logoCy + logoS * 0.4),
      Z(),
    ],
    fill: t.backAccent || "#2980B9",
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildTemplateLogoLayers(cfg, logoCx - logoS / 2, logoCy - logoS * 0.6, logoS, logoS, t.backAccent || "#2980B9", ff, ["logo"]));

  // ── "HOLDFAST" tonal text ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.50,
    w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.12), fontFamily: ff,
    weight: 700, color: t.backText!,    // #1B4F72
    align: "center", letterSpacing: 4,
    tags: ["company"],
  }));

  // ── "ENGINEERING" tonal text ──
  layers.push(styledText({
    name: "Tagline", x: W * 0.10, y: H * 0.62,
    w: W * 0.80, text: (cfg.tagline || "Engineering").toUpperCase(),
    fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 400, color: t.backAccent || "#2980B9",
    align: "center", letterSpacing: 8,
    tags: ["tagline"],
  }));

  return layers;
});


// ─────────────────────────────────────────────────────────────────────────────
// #16  clean-accent   —  Real Estate Corporation reference
// ─────────────────────────────────────────────────────────────────────────────

function layoutCleanAccent(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["clean-accent"];
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── white background ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: "#FFFFFF" }));

  // ── logo icon (upper-left) ──
  const logoS = W * 0.08;
  const logoX = W * 0.05;
  const logoY = H * 0.20;
  // house/roof icon placeholder
  layers.push(pathLayer({
    name: "Logo Icon",
    commands: [
      M(logoX + logoS * 0.5, logoY),
      L(logoX + logoS, logoY + logoS * 0.6),
      L(logoX + logoS, logoY + logoS),
      L(logoX, logoY + logoS),
      L(logoX, logoY + logoS * 0.6),
      Z(),
    ],
    fill: t.accent!,
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildTemplateLogoLayers(cfg, logoX, logoY, logoS, logoS, t.accent!, ff, ["logo"]));

  // ── company name (left, next to logo) ──
  layers.push(styledText({
    name: "Company", x: logoX + logoS + W * 0.03, y: H * 0.22,
    w: W * 0.35, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.035), fontFamily: ff,
    weight: 700, color: t.accent!, letterSpacing: 3,
    tags: ["company"],
  }));

  // ── name (right-aligned, upper area) ──
  layers.push(styledText({
    name: "Name", x: W * 0.40, y: H * 0.06,
    w: W * 0.55, text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 700, color: t.accent!, align: "right",
    tags: ["name", "primary-text"],
  }));

  // ── title (right-aligned) ──
  layers.push(styledText({
    name: "Title", x: W * 0.40, y: H * 0.11,
    w: W * 0.55, text: (cfg.title || "Job Title").toUpperCase(),
    fontSize: Math.round(H * 0.02), fontFamily: ff,
    weight: 400, color: t.accent!, align: "right",
    letterSpacing: 2,
    tags: ["title"],
  }));

  // ── contact details (right-aligned) ──
  const contacts = extractContacts(cfg);
  let contactY = H * 0.18;
  const contactFs = Math.round(H * 0.018);
  const contactGap = Math.round(H * 0.035);
  contacts.forEach((c) => {
    layers.push(styledText({
      name: `Contact ${c.type}`,
      x: W * 0.40, y: contactY,
      w: W * 0.55, text: c.value,
      fontSize: contactFs, fontFamily: ff,
      weight: 400, color: t.contactText!, align: "right",
      tags: ["contact-text"],
    }));
    contactY += contactGap;
  });

  // ── QR code placeholder (lower-left) ──
  const qrSize = W * 0.12;
  layers.push(filledRect({
    name: "QR Placeholder",
    x: W * 0.08, y: H * 0.45,
    w: qrSize, h: qrSize,
    fill: "#E0E0E0",
    tags: ["qr-code", "decorative"],
  }));

  // ── city skyline silhouette (bottom 35%) ──
  const skyY = H * 0.65;
  // Build deterministic building-like rectangles
  const barW = W * 0.02;
  const seed = [0.72, 0.45, 0.88, 0.33, 0.61, 0.77, 0.50, 0.92, 0.38, 0.65,
                0.81, 0.29, 0.55, 0.70, 0.43, 0.86, 0.35, 0.68, 0.90, 0.48,
                0.75, 0.58, 0.82, 0.40, 0.67, 0.52, 0.79, 0.44, 0.63, 0.85,
                0.37, 0.73, 0.56, 0.69, 0.42, 0.87, 0.53, 0.71, 0.39, 0.80,
                0.46, 0.62, 0.84, 0.51, 0.76, 0.60, 0.41, 0.83];
  seed.forEach((s, i) => {
    const bx = i * (barW + 2);
    if (bx >= W) return;
    const bH = H * (0.05 + s * 0.30);
    layers.push(filledRect({
      name: `Skyline ${i}`,
      x: bx, y: H - bH, w: barW, h: bH,
      fill: multiStopGradient(180, [
        [t.accentAlt || "#DDDDDD", 0],
        ["#999999", 1],
      ]),
      opacity: 0.6,
      tags: ["decorative", "skyline"],
    }));
  });

  return layers;
}

// Back layout: solid orange-red with centered white logo
registerBackLayout("clean-accent", (W, H, cfg, theme) => {
  const t = theme;
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── solid background ──
  layers.push(filledRect({ name: "Back BG", x: 0, y: 0, w: W, h: H, fill: t.backBg! }));

  // ── centered logo ──
  const logoS = W * 0.15;
  layers.push(...buildTemplateLogoLayers(cfg, W * 0.50 - logoS / 2, H * 0.25, logoS, logoS * 1.3, "#FFFFFF", ff, ["logo"]));

  // ── company name ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.52,
    w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.05), fontFamily: ff,
    weight: 700, color: "#FFFFFF", align: "center",
    letterSpacing: 3,
    tags: ["company"],
  }));

  // ── website ──
  if (cfg.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.10, y: H * 0.68,
      w: W * 0.80, text: cfg.website,
      fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: "#FFFFFF", align: "center",
      alpha: 0.8,
      tags: ["contact-text"],
    }));
  }

  return layers;
});


// ─────────────────────────────────────────────────────────────────────────────
// #17  nature-clean   —  Bluebat reference
// ─────────────────────────────────────────────────────────────────────────────

function layoutNatureClean(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["nature-clean"];
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── light gray background ──
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: t.frontBg! }));

  // ── QR code placeholder (upper-left) ──
  const qrW = W * 0.18;
  const qrH = H * 0.30;
  layers.push(filledRect({
    name: "QR Placeholder",
    x: W * 0.08, y: H * 0.12,
    w: qrW, h: qrH,
    fill: "#E0E0E0",
    tags: ["qr-code", "decorative"],
  }));

  // ── contact info (center-right, with icons) ──
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons(contacts, {
    x: W * 0.50, y: H * 0.13,
    fontSize: Math.round(H * 0.025), fontFamily: ff,
    textColor: t.accent!,     // #6B8E7A sage green
    iconColor: t.accent!,
    lineHeight: Math.round(H * 0.06),
    showIcons: cfg.showContactIcons !== false,
    tags: ["contact-text"],
  });
  layers.push(...cLines);

  // ── diagonal name banner (bottom-left, angled right edge) ──
  layers.push(pathLayer({
    name: "Name Banner",
    commands: [
      M(0, H * 0.70),
      L(W * 0.60, H * 0.70),
      L(W * 0.52, H),
      L(0, H),
      Z(),
    ],
    fill: t.accent!,    // #6B8E7A sage green
    tags: ["decorative", "accent"],
  }));

  // ── name on banner ──
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.73,
    w: W * 0.42, text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.045), fontFamily: ff,
    weight: 700, color: "#FFFFFF",
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // ── title on banner ──
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.81,
    w: W * 0.38, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: "#FFFFFF",
    tags: ["title"],
  }));

  // ── logo icon in white space (right of banner) ──
  const logoS = W * 0.08;
  const logoX = W * 0.62;
  const logoY = H * 0.73;
  layers.push(...buildTemplateLogoLayers(cfg, logoX, logoY, logoS, logoS * 1.5, t.accent!, ff, ["logo"]));

  // ── "BLUEBAT" company text in white area ──
  layers.push(styledText({
    name: "Company", x: W * 0.62 + logoS + W * 0.02, y: H * 0.76,
    w: W * 0.25, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 700, color: t.frontText!,    // #2C2C2C
    letterSpacing: 3,
    tags: ["company"],
  }));

  return layers;
}

// Back layout: solid sage green with centered white logo
registerBackLayout("nature-clean", (W, H, cfg, theme) => {
  const t = theme;
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── solid sage green background ──
  layers.push(filledRect({ name: "Back BG", x: 0, y: 0, w: W, h: H, fill: t.backBg! }));

  // ── large centered logo icon ──
  const logoW = W * 0.12;
  const logoH = H * 0.18;
  layers.push(...buildTemplateLogoLayers(cfg, W * 0.50 - logoW / 2, H * 0.25, logoW, logoH, "#FFFFFF", ff, ["logo"]));

  // ── "BLUEBAT" company name ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.52,
    w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 700, color: "#FFFFFF", align: "center",
    letterSpacing: 8,
    tags: ["company"],
  }));

  // ── tagline ──
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.10, y: H * 0.62,
      w: W * 0.80, text: cfg.tagline.toUpperCase(),
      fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 300, color: "#FFFFFF", align: "center",
      alpha: 0.8, letterSpacing: 10,
      tags: ["tagline"],
    }));
  }

  return layers;
});


// ─────────────────────────────────────────────────────────────────────────────
// #18  diamond-brand   —  Forest green corporate reference
// ─────────────────────────────────────────────────────────────────────────────

function layoutDiamondBrand(W: number, H: number, cfg: CardConfig, _fs: FontSizes, _ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["diamond-brand"];
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── two-tone green background ──
  // top section (0-78%)
  layers.push(filledRect({
    name: "BG Top", x: 0, y: 0, w: W, h: H * 0.78,
    fill: t.frontBg!,     // #2E7D32 forest green
    tags: ["decorative"],
  }));
  // bottom band (78-100%)
  layers.push(filledRect({
    name: "BG Bottom", x: 0, y: H * 0.78, w: W, h: H * 0.22,
    fill: t.frontBgAlt || "#1B5E20",
    tags: ["decorative"],
  }));

  // ── triangle logo (centered, upper) ──
  const triW = W * 0.08;
  const triH = H * 0.05;
  const triCx = W * 0.50;
  const triCy = H * 0.32;
  layers.push(pathLayer({
    name: "Triangle Logo",
    commands: [
      M(triCx, triCy - triH),
      L(triCx + triW / 2, triCy),
      L(triCx - triW / 2, triCy),
      Z(),
    ],
    fill: "#FFFFFF",
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildTemplateLogoLayers(cfg, triCx - triW / 2, triCy - triH, triW, triH, "#FFFFFF", ff, ["logo"]));

  // ── company name — hero centered ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.45,
    w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 700, color: "#FFFFFF", align: "center",
    letterSpacing: 4,
    tags: ["company"],
  }));

  // ── tagline ──
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.15, y: H * 0.56,
      w: W * 0.70, text: cfg.tagline,
      fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 300, color: "#FFFFFF", align: "center",
      tags: ["tagline"],
    }));
  }

  // ── small circle icon (bottom band, centered) ──
  const circR = W * 0.015;
  layers.push(filledEllipse({
    name: "Circle Icon",
    cx: W * 0.50, cy: H * 0.82,
    rx: circR, ry: circR,
    fill: t.accent!,   // #4CAF50
    tags: ["decorative"],
  }));

  // ── website (bottom band) ──
  if (cfg.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.10, y: H * 0.87,
      w: W * 0.80, text: cfg.website,
      fontSize: Math.round(H * 0.028), fontFamily: ff,
      weight: 400, color: "#FFFFFF", align: "center",
      tags: ["contact-text"],
    }));
  }

  return layers;
}

// Back layout: 60/40 vertical split green/white
registerBackLayout("diamond-brand", (W, H, cfg, theme) => {
  const t = theme;
  const ff = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // ── green left section (60%) ──
  layers.push(filledRect({
    name: "Left Panel", x: 0, y: 0, w: W * 0.60, h: H,
    fill: t.backBg!,     // #2E7D32
    tags: ["decorative"],
  }));

  // ── white right section (40%) ──
  layers.push(filledRect({
    name: "Right Panel", x: W * 0.60, y: 0, w: W * 0.40, h: H,
    fill: "#FFFFFF",
    tags: ["decorative"],
  }));

  // ── small triangle logo on green (lower-left) ──
  const triS = W * 0.04;
  const triCx = W * 0.20;
  const triCy = H * 0.72;
  layers.push(pathLayer({
    name: "Back Logo",
    commands: [
      M(triCx, triCy - triS * 0.6),
      L(triCx + triS / 2, triCy + triS * 0.4),
      L(triCx - triS / 2, triCy + triS * 0.4),
      Z(),
    ],
    fill: "#FFFFFF",
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildTemplateLogoLayers(cfg, triCx - triS / 2, triCy - triS * 0.6, triS, triS, "#FFFFFF", ff, ["logo"]));

  // ── company name on green section ──
  layers.push(styledText({
    name: "Company", x: W * 0.05, y: H * 0.80,
    w: W * 0.50, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.03), fontFamily: ff,
    weight: 700, color: "#FFFFFF",
    tags: ["company"],
  }));

  // ── name on white section ──
  layers.push(styledText({
    name: "Name", x: W * 0.63, y: H * 0.40,
    w: W * 0.34, text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.045), fontFamily: ff,
    weight: 700, color: t.contactText!,   // #2E2E2E
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // ── title on white section ──
  layers.push(styledText({
    name: "Title", x: W * 0.63, y: H * 0.49,
    w: W * 0.34, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 300, color: "#757575",
    tags: ["title"],
  }));

  // ── contact with colored circle icons ──
  const contacts = extractContacts(cfg);
  const iconColors = [t.accent!, "#757575", t.backBg!];  // phone: green, location: gray, email: dark green
  let cY = H * 0.60;
  const cGap = Math.round(H * 0.10);
  contacts.slice(0, 3).forEach((c, i) => {
    const circR = W * 0.012;
    // colored circle
    layers.push(filledEllipse({
      name: `Contact Icon ${i + 1}`,
      cx: W * 0.66, cy: cY + circR,
      rx: circR, ry: circR,
      fill: iconColors[i % iconColors.length],
      tags: ["contact-icon"],
    }));
    // contact text
    layers.push(styledText({
      name: `Contact ${c.type}`,
      x: W * 0.70, y: cY,
      w: W * 0.27, text: c.value,
      fontSize: Math.round(H * 0.022), fontFamily: ff,
      weight: 400, color: t.contactText!,
      tags: ["contact-text"],
    }));
    cY += cGap;
  });

  return layers;
});

'''

# ─── Main ──────────────────────────────────────────────────────────────────────

src = ADAPTER.read_text(encoding="utf-8")

i_start = src.index(START_MARKER)
i_end   = src.index(END_MARKER)

old_section = src[i_start:i_end]
new_src = src[:i_start] + NEW_SECTION + src[i_end:]

ADAPTER.write_text(new_src, encoding="utf-8")

print(f"Old section: {len(old_section):,} chars")
print(f"New section: {len(NEW_SECTION):,} chars")
print(f"Total file:  {len(new_src):,} chars")
print("Done ✅")
