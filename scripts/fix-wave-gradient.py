"""
Rewrite wave-gradient front layout (Template #12).
Fixes:
- Logo uses buildWatermarkLogo
- Name at proper 6% H
- Title readable
- Contact uses contactWithIcons
- Better visual flow
"""

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = 'function layoutWaveGradient(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {'
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Could not find layoutWaveGradient")
    exit(1)

end_marker = 'registerBackLayout("wave-gradient"'
end_idx = content.find(end_marker, start_idx)
search_back = content.rfind('\n// Register', start_idx, end_idx)
if search_back == -1:
    search_back = content.rfind('\n\n', start_idx, end_idx) + 1
end_idx = search_back + 1

print(f"Found at char {start_idx}, end at char {end_idx}")

new_function = '''function layoutWaveGradient(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["wave-gradient"];
  const layers: LayerV2[] = [];

  // Background \u2014 pure white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg),
    tags: ["background"],
  }));

  // Organic wave with purple\u2192orange gradient (bottom 20-25%)
  const wavePath = [
    M(0, H * 0.78),
    C(W * 0.15, H * 0.72, W * 0.30, H * 0.82, W * 0.50, H * 0.76),
    C(W * 0.70, H * 0.70, W * 0.85, H * 0.80, W, H * 0.75),
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

  // Logo + brand \u2014 upper-left
  const logoS = Math.round(W * 0.08);
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.05), Math.round(H * 0.08),
    logoS, theme.accent || "#2D1B69", 1.0, ff));

  // Company name \u2014 right of logo
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company",
      x: W * 0.05 + logoS + W * 0.02, y: H * 0.10,
      w: W * 0.35,
      text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.05),
      fontFamily: ff,
      weight: 700,
      color: theme.frontText,
      tags: ["company"],
    }));
  }

  // Tagline below logo/company
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline",
      x: W * 0.05, y: H * 0.22,
      w: W * 0.50,
      text: cfg.tagline,
      fontSize: Math.round(H * 0.022),
      fontFamily: ff,
      weight: 400,
      color: theme.frontTextAlt || "#666666",
      tags: ["tagline"],
    }));
  }

  // Name \u2014 prominent, left-aligned
  layers.push(styledText({
    name: "Name",
    x: W * 0.05, y: H * 0.36,
    w: W * 0.55,
    text: cfg.name || "Name and Surname",
    fontSize: Math.round(H * 0.06),
    fontFamily: ff,
    weight: 600,
    color: theme.frontText,
    tags: ["name", "primary-text"],
  }));

  // Title below name
  layers.push(styledText({
    name: "Title",
    x: W * 0.05, y: H * 0.44,
    w: W * 0.50,
    text: cfg.title || "Position",
    fontSize: Math.round(H * 0.028),
    fontFamily: ff,
    weight: 400,
    color: theme.frontTextAlt || "#666666",
    tags: ["title"],
  }));

  // Contact block \u2014 left side below title
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.05, startY: H * 0.54,
    lineGap: Math.round(H * 0.05),
    fontSize: Math.round(H * 0.022),
    fontFamily: ff,
    textColor: theme.contactText || "#333333",
    iconColor: theme.accent || "#2D1B69",
    maxY: H * 0.74,
    tags: ["contact-text"],
  }));

  return layers;
}

'''

content = content[:start_idx] + new_function + content[end_idx:]

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print("wave-gradient front layout rewritten successfully.")
