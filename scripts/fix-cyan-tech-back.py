"""
Rewrite cyan-tech back layout to match spec:
- Mirrored wave from LEFT edge
- Name/contact in right dark zone
- White downward triangle + QR code
"""

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = 'registerBackLayout("cyan-tech"'
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Could not find cyan-tech back layout")
    exit(1)

# Find the end - look for the closing });  followed by the next template
# The back layout ends with }); then a blank line and then comments for template #8
end_marker = 'function layoutCorporateChevron'
end_idx = content.find(end_marker, start_idx)
# Back up to find the comment block start
search_back = content.rfind('\n// ----', start_idx, end_idx)
if search_back == -1:
    search_back = content.rfind('\n\n', start_idx, end_idx) + 1
end_idx = search_back + 1  # Include the newline

print(f"Found back layout at char {start_idx}, end at char {end_idx}")
print(f"Replacing {end_idx - start_idx} characters")

new_back = '''registerBackLayout("cyan-tech", (W, H, cfg, theme) => {
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background \u2014 dark charcoal
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg),
    tags: ["background", "back-element"],
  }));

  // Mirrored cyan wave from LEFT edge
  const wavePath = [
    M(0, H * 0.15),
    C(W * 0.22, H * 0.18, W * 0.35, H * 0.28, W * 0.40, H * 0.38),
    C(W * 0.44, H * 0.46, W * 0.38, H * 0.50, W * 0.35, H * 0.54),
    C(W * 0.32, H * 0.58, W * 0.42, H * 0.68, W * 0.45, H * 0.76),
    C(W * 0.48, H * 0.84, W * 0.30, H * 0.92, 0, H * 0.95),
    L(0, H * 0.15),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Cyan Wave",
    commands: wavePath,
    fill: solidPaintHex(theme.accent!),
    tags: ["decorative", "wave", "back-element"],
  }));

  // Name \u2014 right zone
  layers.push(styledText({
    name: "Name",
    x: W * 0.55, y: H * 0.18,
    w: W * 0.40,
    text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.06),
    fontFamily: font,
    weight: 700,
    color: theme.backText,
    tags: ["name", "back-element"],
  }));

  // Title
  layers.push(styledText({
    name: "Title",
    x: W * 0.55, y: H * 0.28,
    w: W * 0.40,
    text: cfg.title || "Position",
    fontSize: Math.round(H * 0.025),
    fontFamily: font,
    weight: 400,
    color: theme.backText,
    alpha: 0.7,
    tags: ["title", "back-element"],
  }));

  // Contact block \u2014 right zone
  layers.push(...contactWithIcons({
    contacts: cfg.contacts,
    x: W * 0.55, startY: H * 0.42,
    lineGap: Math.round(H * 0.055),
    fontSize: Math.round(H * 0.022),
    fontFamily: font,
    textColor: theme.backText,
    iconColor: theme.backAccent || theme.accent || "#2DB5E5",
    maxY: H * 0.80,
    tags: ["back-element"],
  }));

  // White downward triangle mark
  const triPath = [
    M(W * 0.55, H * 0.85),
    L(W * 0.65, H * 0.85),
    L(W * 0.60, H * 0.93),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Triangle Mark",
    commands: triPath,
    fill: solidPaintHex("#FFFFFF"),
    tags: ["logo", "brand-mark", "back-element"],
  }));

  return layers;
});


'''

content = content[:start_idx] + new_back + content[end_idx:]

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print("cyan-tech back layout rewritten successfully.")
