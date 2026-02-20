"""
Rewrite zigzag-overlay front layout (Template #9).
Fixes:
- Name text from 2.5% to 6% H
- Larger gradient bar
- Proper contact block using contactWithIcons
- Company text in safe zone (not at 96% Y)
- Title added
"""

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = 'function layoutZigzagOverlay(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {'
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Could not find layoutZigzagOverlay")
    exit(1)

end_marker = 'registerBackLayout("zigzag-overlay"'
end_idx = content.find(end_marker, start_idx)
search_back = content.rfind('\n// Register', start_idx, end_idx)
if search_back == -1:
    search_back = content.rfind('\n\n', start_idx, end_idx) + 1
end_idx = search_back + 1

print(f"Found at char {start_idx}, end at char {end_idx}")

new_function = '''function layoutZigzagOverlay(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["zigzag-overlay"];
  const layers: LayerV2[] = [];

  // Background \u2014 pure white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg),
    tags: ["background"],
  }));

  // Orange-to-Magenta gradient bar (top-left, larger)
  layers.push(filledRect({
    name: "Gradient Bar",
    x: 0, y: 0, w: Math.round(W * 0.40), h: Math.round(H * 0.18),
    fill: multiStopGradient(135, [
      { offset: 0, color: "#FB6C2B" },
      { offset: 0.5, color: "#FA3048" },
      { offset: 1.0, color: "#FC1154" },
    ]),
    tags: ["decorative", "accent", "gradient-bar"],
  }));

  // Dark charcoal angular shape (bottom-right ~45% of card)
  const triPath = [
    M(W * 0.65, H * 0.50),
    L(W, H * 0.40),
    L(W, H),
    L(W * 0.12, H),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Dark Shape",
    commands: triPath,
    fill: solidPaintHex(theme.accent || "#303030"),
    tags: ["decorative", "accent"],
  }));

  // Name \u2014 prominent on white content area
  layers.push(styledText({
    name: "Name",
    x: W * 0.05, y: H * 0.28,
    w: W * 0.50,
    text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.065),
    fontFamily: ff,
    weight: 700,
    color: theme.frontText,
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // Title \u2014 below name
  layers.push(styledText({
    name: "Title",
    x: W * 0.05, y: H * 0.37,
    w: W * 0.50,
    text: cfg.title || "Position",
    fontSize: Math.round(H * 0.030),
    fontFamily: ff,
    weight: 400,
    color: theme.frontText,
    alpha: 0.6,
    tags: ["title"],
  }));

  // Company \u2014 on the gradient bar (white text)
  layers.push(styledText({
    name: "Company",
    x: W * 0.03, y: H * 0.05,
    w: W * 0.35,
    text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.030),
    fontFamily: ff,
    weight: 600,
    color: "#FFFFFF",
    letterSpacing: 3,
    tags: ["company"],
  }));

  // Contact block on the dark triangle area (light text)
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.15, startY: H * 0.72,
    lineGap: Math.round(H * 0.05),
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    textColor: theme.frontTextAlt || "#E0E0E0",
    iconColor: "#D0E85C",
    maxY: H * 0.95,
    tags: ["contact-text"],
  }));

  return layers;
}

'''

content = content[:start_idx] + new_function + content[end_idx:]

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print("zigzag-overlay front layout rewritten successfully.")
