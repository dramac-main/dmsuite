"""
Rewrite clean-accent front layout (Template #16).
Fixes:
- Name from 2.8% to 5.5% H
- Contact text from 1.8% to 2.5% H
- Better skyline with building shapes
- QR only shown when qrCodeUrl provided
- Proper asymmetric layout
"""

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = 'function layoutCleanAccent(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {'
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Could not find layoutCleanAccent")
    exit(1)

end_marker = 'registerBackLayout("clean-accent"'
end_idx = content.find(end_marker, start_idx)
search_back = content.rfind('\n// Back layout', start_idx, end_idx)
if search_back == -1:
    search_back = content.rfind('\n\n', start_idx, end_idx) + 1
end_idx = search_back + 1

print(f"Found at char {start_idx}, end at char {end_idx}")

new_function = '''function layoutCleanAccent(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["clean-accent"];

  const layers: LayerV2[] = [];

  // -- white background --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex("#FFFFFF") }));

  // -- logo (upper-left) --
  const logoS = Math.round(W * 0.09);
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.05), Math.round(H * 0.10),
    logoS, t.accent, 1.0, ff));

  // -- company name (left, below logo) --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.05, y: H * 0.30,
      w: W * 0.40, text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.04), fontFamily: ff,
      weight: 700, color: t.accent, letterSpacing: 3,
      tags: ["company"],
    }));
  }

  // -- name (right side, prominent) --
  layers.push(styledText({
    name: "Name", x: W * 0.40, y: H * 0.10,
    w: W * 0.55, text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.055), fontFamily: ff,
    weight: 700, color: t.accent, align: "right",
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // -- title (right-aligned, below name) --
  layers.push(styledText({
    name: "Title", x: W * 0.40, y: H * 0.20,
    w: W * 0.55, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: t.contactText || "#666666", align: "right",
    tags: ["title"],
  }));

  // -- contact details (right-aligned) --
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.92, startY: H * 0.32,
    lineGap: Math.round(H * 0.055),
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    textColor: t.contactText || "#666666",
    iconColor: t.accent,
    align: "right",
    maxY: H * 0.62,
    tags: ["contact-text"],
  }));

  // -- QR code (lower-left, only if URL provided) --
  if (cfg.qrCodeUrl) {
    const qrSize = Math.round(W * 0.12);
    layers.push(strokeRect({
      name: "QR Frame",
      x: Math.round(W * 0.05), y: Math.round(H * 0.52),
      w: qrSize, h: qrSize,
      color: t.accent, width: 1,
      tags: ["qr-code"],
    }));
  }

  // -- city skyline silhouette (bottom 30%) --
  // Build proper building shapes with varying heights and widths
  const buildings = [
    { x: 0, w: 0.035, h: 0.15 },
    { x: 0.04, w: 0.025, h: 0.25 },
    { x: 0.07, w: 0.04, h: 0.20 },
    { x: 0.12, w: 0.03, h: 0.30 },
    { x: 0.16, w: 0.05, h: 0.18 },
    { x: 0.22, w: 0.03, h: 0.28 },
    { x: 0.26, w: 0.04, h: 0.22 },
    { x: 0.31, w: 0.025, h: 0.35 },
    { x: 0.34, w: 0.045, h: 0.16 },
    { x: 0.39, w: 0.03, h: 0.26 },
    { x: 0.43, w: 0.035, h: 0.32 },
    { x: 0.47, w: 0.04, h: 0.14 },
    { x: 0.52, w: 0.03, h: 0.24 },
    { x: 0.56, w: 0.05, h: 0.19 },
    { x: 0.62, w: 0.025, h: 0.30 },
    { x: 0.65, w: 0.04, h: 0.22 },
    { x: 0.70, w: 0.035, h: 0.28 },
    { x: 0.74, w: 0.03, h: 0.17 },
    { x: 0.78, w: 0.045, h: 0.25 },
    { x: 0.83, w: 0.03, h: 0.33 },
    { x: 0.87, w: 0.04, h: 0.20 },
    { x: 0.92, w: 0.035, h: 0.27 },
    { x: 0.96, w: 0.04, h: 0.15 },
  ];
  buildings.forEach((b, i) => {
    const bx = Math.round(W * b.x);
    const bw = Math.round(W * b.w);
    const bh = Math.round(H * b.h);
    layers.push(filledRect({
      name: `Building ${i + 1}`,
      x: bx, y: H - bh, w: bw, h: bh,
      fill: solidPaintHex(t.accent),
      opacity: 0.12 + (i % 3) * 0.04,
      tags: ["decorative", "skyline"],
    }));
  });

  return layers;
}

'''

content = content[:start_idx] + new_function + content[end_idx:]

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print("clean-accent front layout rewritten successfully.")
