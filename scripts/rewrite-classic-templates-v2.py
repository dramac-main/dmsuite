#!/usr/bin/env python3
"""Rewrite the CLASSIC / CORPORATE section of business-card-adapter.ts
with pixel-perfect template implementations matching reference images.
v2 — Fixed all API signatures."""

import pathlib

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
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg) }));

  // ── circular logo placeholder (upper-left) ──
  const logoDia = W * 0.12;  // ~126 px
  const logoCx = W * 0.15;
  const logoCy = H * 0.25;
  layers.push(filledEllipse({
    name: "Logo Circle", cx: logoCx, cy: logoCy,
    rx: logoDia / 2, ry: logoDia / 2, fill: solidPaintHex(t.accent),
    tags: ["logo", "decorative"],
  }));
  // white icon placeholder inside circle
  const iconS = logoDia * 0.45;
  layers.push(filledRect({
    name: "Logo Icon",
    x: logoCx - iconS / 2, y: logoCy - iconS / 2,
    w: iconS, h: iconS, fill: solidPaintHex("#FFFFFF"),
    tags: ["logo"],
  }));
  // user logo overlay
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoCx - logoDia * 0.3), Math.round(logoCy - logoDia * 0.3),
    Math.round(logoDia * 0.6), "#FFFFFF", 1.0, ff));

  // ── company name — hero text, centered ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.42,
    w: W * 0.80, text: cfg.company || "Company",
    fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 500, color: t.accent, align: "center",
    tags: ["company"],
  }));

  // ── name (left) ──
  layers.push(styledText({
    name: "Name", x: W * 0.15, y: H * 0.62,
    w: W * 0.40, text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.035), fontFamily: ff,
    weight: 600, color: t.accent,
    tags: ["name", "primary-text"],
  }));

  // ── title (left, below name) ──
  layers.push(styledText({
    name: "Title", x: W * 0.15, y: H * 0.68,
    w: W * 0.40, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: t.frontTextAlt || "#666666",
    tags: ["title"],
  }));

  // ── contact info — left column ──
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons({
    contacts,
    x: W * 0.15, startY: H * 0.78,
    lineGap: Math.round(H * 0.04),
    fontSize: Math.round(H * 0.022), fontFamily: ff,
    textColor: t.contactText || "#333333",
    iconColor: t.contactIcon || t.accent,
    tags: ["contact-text"],
  });
  layers.push(...cLines);

  // ── address — right-aligned ──
  if (cfg.address) {
    const addrParts = cfg.address.split(",").map((s: string) => s.trim());
    addrParts.forEach((addrLine: string, i: number) => {
      layers.push(styledText({
        name: `Address ${i + 1}`,
        x: W * 0.50, y: H * 0.74 + i * Math.round(H * 0.04),
        w: W * 0.38, text: addrLine,
        fontSize: Math.round(H * 0.022), fontFamily: ff,
        weight: 400, color: t.contactText || "#333333", align: "right",
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
      { color: t.accent, offset: 0 },
      { color: t.accentAlt || t.backBg, offset: 1 },
    ]),
    tags: ["decorative"],
  }));

  // ── large centered logo ──
  const logoS = W * 0.18;
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.50 - logoS / 2), Math.round(H * 0.12),
    Math.round(logoS), "#FFFFFF", 1.0, ff));

  // ── company name ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.38,
    w: W * 0.80, text: cfg.company || "Company",
    fontSize: Math.round(H * 0.07), fontFamily: ff,
    weight: 500, color: "#FFFFFF", align: "center",
    tags: ["company"],
  }));

  // ── tagline / license text ──
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
    layers.push(styledText({
      name: `Check ${i + 1}`, x: W * 0.12, y: yy,
      w: Math.round(W * 0.04), text: "✓",
      fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: "#FFFFFF",
      tags: ["decorative"],
    }));
    layers.push(styledText({
      name: `Service ${i + 1}`, x: W * 0.16, y: yy,
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
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex("#FFFFFF") }));

  // ── name — top left, hero text ──
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.19,
    w: W * 0.55, text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 700, color: t.accent,
    tags: ["name", "primary-text"],
  }));

  // ── title ──
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.28,
    w: W * 0.50, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.035), fontFamily: ff,
    weight: 400, color: t.frontTextAlt || "#666666",
    tags: ["title"],
  }));

  // ── company ──
  layers.push(styledText({
    name: "Company", x: W * 0.08, y: H * 0.42,
    w: W * 0.50, text: cfg.company || "Company",
    fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 500, color: t.accent,
    tags: ["company"],
  }));

  // ── address ──
  if (cfg.address) {
    const addrParts = cfg.address.split(",").map((s: string) => s.trim());
    addrParts.forEach((addrLine: string, i: number) => {
      layers.push(styledText({
        name: `Address ${i + 1}`,
        x: W * 0.08, y: H * 0.53 + i * Math.round(H * 0.04),
        w: W * 0.50, text: addrLine,
        fontSize: Math.round(H * 0.028), fontFamily: ff,
        weight: 400, color: t.frontTextAlt || "#666666",
        tags: ["contact-text"],
      }));
    });
  }

  // ── contact details ──
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons({
    contacts,
    x: W * 0.08, startY: H * 0.72,
    lineGap: Math.round(H * 0.045),
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    textColor: t.contactText || "#666666",
    iconColor: t.contactIcon || t.accent,
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
    fill: solidPaintHex(t.accent),
    tags: ["logo", "decorative"],
  }));
  // user logo overlay
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoX + logoW * 0.2), Math.round(logoY + logoH * 0.15),
    Math.round(Math.min(logoW, logoH) * 0.6), t.accent, 1.0, ff));

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
      { color: t.accentAlt || t.backBg, offset: 0 },
      { color: t.accent, offset: 1 },
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
    const wmLayer = pathLayer({
      name: `Watermark ${i + 1}`,
      commands: [
        M(wm.x + wm.s / 2, wm.y),
        L(wm.x + wm.s, wm.y + wm.s / 2),
        L(wm.x + wm.s / 2, wm.y + wm.s),
        L(wm.x, wm.y + wm.s / 2),
        Z(),
      ],
      fill: solidPaintHex("#FFFFFF"),
      opacity: 0.05,
      tags: ["decorative", "watermark"],
    });
    layers.push(wmLayer);
  });

  // ── centered logo ──
  const logoS = W * 0.18;
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.50 - logoS / 2), Math.round(H * 0.15),
    Math.round(logoS), "#FFFFFF", 1.0, ff));

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
  const web = cfg.contacts.website;
  if (web) {
    layers.push(styledText({
      name: "Website", x: W * 0.10, y: H * 0.68,
      w: W * 0.80, text: web,
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
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg) }));

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
    fill: solidPaintHex(t.accent),    // #5DADE2
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoX), Math.round(logoY), Math.round(logoS), t.accent, 1.0, ff));

  // ── "HOLDFAST" company name ──
  layers.push(styledText({
    name: "Company", x: logoX + logoS + W * 0.02, y: H * 0.13,
    w: W * 0.50, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.06), fontFamily: ff,
    weight: 700, color: t.frontText,     // #2C3E50
    letterSpacing: 4,
    tags: ["company"],
  }));

  // ── "ENGINEERING" tagline ──
  layers.push(styledText({
    name: "Tagline", x: logoX + logoS + W * 0.02, y: H * 0.22,
    w: W * 0.50, text: (cfg.tagline || "Engineering").toUpperCase(),
    fontSize: Math.round(H * 0.025), fontFamily: ff,
    weight: 400, color: t.accent,        // #5DADE2
    letterSpacing: 8,
    tags: ["tagline"],
  }));

  // ── name ──
  layers.push(styledText({
    name: "Name", x: W * 0.12, y: H * 0.45,
    w: W * 0.55, text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 500, color: t.frontText,
    tags: ["name", "primary-text"],
  }));

  // ── title (accent blue) ──
  layers.push(styledText({
    name: "Title", x: W * 0.12, y: H * 0.55,
    w: W * 0.50, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: t.accent,
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
  const cLines = contactWithIcons({
    contacts,
    x: W * 0.12, startY: H * 0.73,
    lineGap: Math.round(H * 0.04),
    fontSize: Math.round(H * 0.022), fontFamily: ff,
    textColor: t.contactText || "#34495E",
    iconColor: t.contactIcon || t.accent,
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
  layers.push(filledRect({ name: "Back BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg) }));

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
    fill: solidPaintHex(t.backAccent || "#2980B9"),
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoCx - logoS * 0.3), Math.round(logoCy - logoS * 0.3),
    Math.round(logoS * 0.6), t.backAccent || "#2980B9", 1.0, ff));

  // ── "HOLDFAST" tonal text ──
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.50,
    w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.12), fontFamily: ff,
    weight: 700, color: t.backText,    // #1B4F72
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
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex("#FFFFFF") }));

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
    fill: solidPaintHex(t.accent),
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoX), Math.round(logoY), Math.round(logoS), t.accent, 1.0, ff));

  // ── company name (left, next to logo) ──
  layers.push(styledText({
    name: "Company", x: logoX + logoS + W * 0.03, y: H * 0.22,
    w: W * 0.35, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.035), fontFamily: ff,
    weight: 700, color: t.accent, letterSpacing: 3,
    tags: ["company"],
  }));

  // ── name (right-aligned, upper area) ──
  layers.push(styledText({
    name: "Name", x: W * 0.40, y: H * 0.06,
    w: W * 0.55, text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 700, color: t.accent, align: "right",
    tags: ["name", "primary-text"],
  }));

  // ── title (right-aligned) ──
  layers.push(styledText({
    name: "Title", x: W * 0.40, y: H * 0.11,
    w: W * 0.55, text: (cfg.title || "Job Title").toUpperCase(),
    fontSize: Math.round(H * 0.02), fontFamily: ff,
    weight: 400, color: t.accent, align: "right",
    letterSpacing: 2,
    tags: ["title"],
  }));

  // ── contact details (right-aligned) ──
  const contacts = extractContacts(cfg);
  const contactEntries: Array<{ label: string; val: string }> = [];
  if (contacts.phone) contactEntries.push({ label: "phone", val: contacts.phone });
  if (contacts.email) contactEntries.push({ label: "email", val: contacts.email });
  if (contacts.website) contactEntries.push({ label: "website", val: contacts.website });
  let contactY = H * 0.18;
  const contactFs = Math.round(H * 0.018);
  const contactGap = Math.round(H * 0.035);
  contactEntries.forEach((c) => {
    layers.push(styledText({
      name: `Contact ${c.label}`,
      x: W * 0.40, y: contactY,
      w: W * 0.55, text: c.val,
      fontSize: contactFs, fontFamily: ff,
      weight: 400, color: t.contactText || "#666666", align: "right",
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
    fill: solidPaintHex("#E0E0E0"),
    tags: ["qr-code", "decorative"],
  }));

  // ── city skyline silhouette (bottom 35%) ──
  // Build deterministic building-like rectangles using seeded values
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
        { color: t.accentAlt || "#DDDDDD", offset: 0 },
        { color: "#999999", offset: 1 },
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
  layers.push(filledRect({ name: "Back BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg) }));

  // ── centered logo ──
  const logoS = W * 0.15;
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.50 - logoS / 2), Math.round(H * 0.25),
    Math.round(logoS), "#FFFFFF", 1.0, ff));

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
  const web = cfg.contacts.website;
  if (web) {
    layers.push(styledText({
      name: "Website", x: W * 0.10, y: H * 0.68,
      w: W * 0.80, text: web,
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
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg) }));

  // ── QR code placeholder (upper-left) ──
  const qrW = W * 0.18;
  const qrH = H * 0.30;
  layers.push(filledRect({
    name: "QR Placeholder",
    x: W * 0.08, y: H * 0.12,
    w: qrW, h: qrH,
    fill: solidPaintHex("#E0E0E0"),
    tags: ["qr-code", "decorative"],
  }));

  // ── contact info (center-right, with icons) ──
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons({
    contacts,
    x: W * 0.50, startY: H * 0.13,
    lineGap: Math.round(H * 0.06),
    fontSize: Math.round(H * 0.025), fontFamily: ff,
    textColor: t.accent,     // #6B8E7A sage green
    iconColor: t.accent,
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
    fill: solidPaintHex(t.accent),    // #6B8E7A sage green
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
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoX), Math.round(logoY), Math.round(logoS), t.accent, 1.0, ff));

  // ── company text in white area ──
  layers.push(styledText({
    name: "Company", x: logoX + logoS + W * 0.02, y: H * 0.76,
    w: W * 0.25, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 700, color: t.frontText,    // #2C2C2C
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
  layers.push(filledRect({ name: "Back BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg) }));

  // ── large centered logo icon ──
  const logoS = W * 0.12;
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.50 - logoS / 2), Math.round(H * 0.25),
    Math.round(logoS), "#FFFFFF", 1.0, ff));

  // ── company name ──
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
    fill: solidPaintHex(t.frontBg),     // #2E7D32 forest green
    tags: ["decorative"],
  }));
  // bottom band (78-100%)
  layers.push(filledRect({
    name: "BG Bottom", x: 0, y: H * 0.78, w: W, h: H * 0.22,
    fill: solidPaintHex(t.frontBgAlt || "#1B5E20"),
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
    fill: solidPaintHex("#FFFFFF"),
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(triCx - triW / 2), Math.round(triCy - triH),
    Math.round(triW), "#FFFFFF", 1.0, ff));

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
    fill: solidPaintHex(t.accent),   // #4CAF50
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
    fill: solidPaintHex(t.backBg),     // #2E7D32
    tags: ["decorative"],
  }));

  // ── white right section (40%) ──
  layers.push(filledRect({
    name: "Right Panel", x: W * 0.60, y: 0, w: W * 0.40, h: H,
    fill: solidPaintHex("#FFFFFF"),
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
    fill: solidPaintHex("#FFFFFF"),
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(triCx - triS / 2), Math.round(triCy - triS * 0.4),
    Math.round(triS), "#FFFFFF", 1.0, ff));

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
    weight: 700, color: t.contactText || "#2E2E2E",
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
  const iconColors = [t.accent, "#757575", t.backBg];  // phone: green, location: gray, email: dark green
  const contactEntries: Array<{ label: string; val: string }> = [];
  if (cfg.contacts.phone) contactEntries.push({ label: "phone", val: cfg.contacts.phone });
  if (cfg.contacts.address) contactEntries.push({ label: "address", val: cfg.contacts.address });
  if (cfg.contacts.email) contactEntries.push({ label: "email", val: cfg.contacts.email });

  let cY = H * 0.60;
  const cGap = Math.round(H * 0.10);
  contactEntries.slice(0, 3).forEach((c, i) => {
    const circR = W * 0.012;
    // colored circle
    layers.push(filledEllipse({
      name: `Contact Icon ${i + 1}`,
      cx: W * 0.66, cy: cY + circR,
      rx: circR, ry: circR,
      fill: solidPaintHex(iconColors[i % iconColors.length]),
      tags: ["contact-icon"],
    }));
    // contact text
    layers.push(styledText({
      name: `Contact ${c.label}`,
      x: W * 0.70, y: cY,
      w: W * 0.27, text: c.val,
      fontSize: Math.round(H * 0.022), fontFamily: ff,
      weight: 400, color: t.contactText || "#2E2E2E",
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
