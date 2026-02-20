"""
Fix corporate-chevron front layout:
1. Reduce company branding font from 11% to 5.5% H
2. Replace inline contact rendering with contactWithIcons
"""

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Find the front function
start_marker = 'function layoutCorporateChevron(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {'
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Could not find layoutCorporateChevron")
    exit(1)

# Find end - the registerBackLayout
end_marker = 'registerBackLayout("corporate-chevron"'
end_idx = content.find(end_marker, start_idx)
# Back up to find the comment/blank before it
search_back = content.rfind('\n// Register', start_idx, end_idx)
if search_back == -1:
    search_back = content.rfind('\n\n', start_idx, end_idx) + 1
end_idx = search_back + 1

print(f"Found at char {start_idx}, end at char {end_idx}")

new_function = '''function layoutCorporateChevron(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["corporate-chevron"];

  const layers: LayerV2[] = [];

  // Background \u2014 light warm near-white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg),
    tags: ["background"],
  }));

  // Subtle whisper-level chevrons on right side, pointing LEFT
  const backBandW = -W * 0.12;
  const makeChevron = (tipX: number, tipY: number, vtxX: number, vtxY: number, bw: number) => {
    const topArm = [M(tipX, tipY), L(tipX + bw, tipY), L(vtxX + bw, vtxY), L(vtxX, vtxY), Z()];
    const botArm = [M(vtxX, vtxY), L(vtxX + bw, vtxY), L(tipX + bw, tipY + 2 * (vtxY - tipY)), L(tipX, tipY + 2 * (vtxY - tipY)), Z()];
    return [topArm, botArm];
  };

  const [bV1top, bV1bot] = makeChevron(W * 0.95, H * 0.10, W * 0.77, H * 0.46, backBandW);
  layers.push(pathLayer({ name: "Chevron V1 Top", commands: bV1top, fill: solidPaintHex(t.divider || "#DDDDDD"), tags: ["decorative", "chevron"] }));
  layers.push(pathLayer({ name: "Chevron V1 Bot", commands: bV1bot, fill: solidPaintHex(t.divider || "#DDDDDD"), tags: ["decorative", "chevron"] }));

  const [bV2top, bV2bot] = makeChevron(W * 0.93, H * 0.51, W * 0.77, H * 0.87, backBandW);
  layers.push(pathLayer({ name: "Chevron V2 Top", commands: bV2top, fill: solidPaintHex(t.divider || "#DDDDDD"), tags: ["decorative", "chevron"] }));
  layers.push(pathLayer({ name: "Chevron V2 Bot", commands: bV2bot, fill: solidPaintHex(t.divider || "#DDDDDD"), tags: ["decorative", "chevron"] }));

  // Name \u2014 upper left, prominent
  layers.push(styledText({
    name: "Name",
    x: W * 0.07, y: H * 0.20,
    w: W * 0.42,
    text: (cfg.name || "Jonathan Doe").toUpperCase(),
    fontSize: Math.round(H * 0.06),
    fontFamily: ff,
    weight: 700,
    color: t.frontText,
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // Title \u2014 below name
  layers.push(styledText({
    name: "Title",
    x: W * 0.07, y: H * 0.30,
    w: W * 0.38,
    text: cfg.title || "Graphic Designer",
    fontSize: Math.round(H * 0.035),
    fontFamily: ff,
    weight: 400,
    color: "#8C8C8C",
    tags: ["title"],
  }));

  // Logo mark \u2014 small triangle
  const logoSize = Math.round(W * 0.04);
  const logoX = Math.round(W * 0.07);
  const logoY = Math.round(H * 0.44);
  layers.push(pathLayer({
    name: "Logo Mark",
    commands: [
      M(logoX, logoY + logoSize),
      L(logoX + logoSize / 2, logoY),
      L(logoX + logoSize, logoY + logoSize),
      Z(),
    ],
    fill: solidPaintHex(t.frontText),
    tags: ["logo", "brand-mark"],
  }));

  // Contact block with proper icons
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.07, startY: H * 0.55,
    lineGap: Math.round(H * 0.055),
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    textColor: t.contactText || "#727780",
    iconColor: t.contactIcon || "#4D5562",
    maxY: H * 0.85,
    tags: ["contact-text"],
  }));

  // Company branding \u2014 right zone, moderate size
  layers.push(styledText({
    name: "Company Branding",
    x: W * 0.56, y: H * 0.70,
    w: W * 0.38,
    text: (cfg.company || "COMPANY").toUpperCase(),
    fontSize: Math.round(H * 0.055),
    fontFamily: ff,
    weight: 700,
    color: t.accent || "#1C1C1E",
    letterSpacing: 4,
    tags: ["company", "branding"],
  }));

  return layers;
}

'''

content = content[:start_idx] + new_function + content[end_idx:]

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print("corporate-chevron front layout rewritten successfully.")
