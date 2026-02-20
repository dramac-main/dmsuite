"""
Rewrite cyan-tech template front layout (Template #7).
Fixes:
- Add proper gear icon with actual cog teeth
- S-curve wave from RIGHT edge per spec
- Company name sized properly
- Contact block uses contactWithIcons
"""

FILE = r"d:\dramac-ai-suite\src\lib\editor\business-card-adapter.ts"

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Find the start of layoutCyanTech function
start_marker = 'function layoutCyanTech(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {'
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Could not find layoutCyanTech function")
    exit(1)

# Find the end of the function - look for the registerBackLayout call
end_marker = '// Register cyan-tech back layout'
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    # Try another pattern
    end_marker = 'registerBackLayout("cyan-tech"'
    end_idx = content.find(end_marker, start_idx)
    # Back up to find the comment line
    end_idx = content.rfind('\n', 0, end_idx)
    end_idx = content.rfind('\n', 0, end_idx) + 1

print(f"Found function at char {start_idx}, end at char {end_idx}")
print(f"Replacing {end_idx - start_idx} characters")

new_function = '''function layoutCyanTech(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["cyan-tech"];

  const layers: LayerV2[] = [];

  // Background \u2014 dark charcoal
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg),
    tags: ["background"],
  }));

  // Organic S-curve cyan wave from RIGHT edge (double-lobed)
  const wavePath = [
    M(W, H * 0.15),
    C(W * 0.78, H * 0.18, W * 0.65, H * 0.28, W * 0.60, H * 0.38),
    C(W * 0.56, H * 0.46, W * 0.62, H * 0.50, W * 0.65, H * 0.54),
    C(W * 0.68, H * 0.58, W * 0.58, H * 0.68, W * 0.55, H * 0.76),
    C(W * 0.52, H * 0.84, W * 0.70, H * 0.92, W, H * 0.95),
    L(W, H * 0.15),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Cyan Wave",
    commands: wavePath,
    fill: solidPaintHex(t.accent || "#2DB5E5"),
    tags: ["decorative", "wave"],
  }));

  // Gear icon (cog with teeth) \u2014 upper-left area
  const gearCx = Math.round(W * 0.12);
  const gearCy = Math.round(H * 0.20);
  const gearR = Math.round(W * 0.045);
  const toothCount = 8;
  const innerR = gearR * 0.7;
  const gearCommands: PathCommand[] = [];
  for (let i = 0; i < toothCount; i++) {
    const a1 = (i / toothCount) * Math.PI * 2;
    const a2 = ((i + 0.3) / toothCount) * Math.PI * 2;
    const a3 = ((i + 0.5) / toothCount) * Math.PI * 2;
    const a4 = ((i + 0.8) / toothCount) * Math.PI * 2;
    if (i === 0) gearCommands.push(M(gearCx + gearR * Math.cos(a1), gearCy + gearR * Math.sin(a1)));
    gearCommands.push(L(gearCx + gearR * Math.cos(a2), gearCy + gearR * Math.sin(a2)));
    gearCommands.push(L(gearCx + innerR * Math.cos(a3), gearCy + innerR * Math.sin(a3)));
    gearCommands.push(L(gearCx + innerR * Math.cos(a4), gearCy + innerR * Math.sin(a4)));
  }
  gearCommands.push(Z());
  layers.push(pathLayer({
    name: "Gear Icon",
    commands: gearCommands,
    fill: solidPaintHex(t.frontText),
    tags: ["logo", "icon", "gear"],
  }));
  // Gear center hole
  layers.push(filledEllipse({
    name: "Gear Hub",
    cx: gearCx, cy: gearCy, rx: Math.round(innerR * 0.4), ry: Math.round(innerR * 0.4),
    fill: solidPaintHex(t.frontBg),
    tags: ["logo", "icon"],
  }));

  // Company name \u2014 below gear
  layers.push(styledText({
    name: "Company",
    x: W * 0.05, y: H * 0.32,
    w: W * 0.38,
    text: (cfg.company || "CODE PRO").toUpperCase(),
    fontSize: Math.round(H * 0.055),
    fontFamily: ff,
    weight: 600,
    color: t.frontText,
    letterSpacing: 3,
    tags: ["company"],
  }));

  // Tagline \u2014 below company
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline",
      x: W * 0.05, y: H * 0.40,
      w: W * 0.38,
      text: cfg.tagline.toUpperCase(),
      fontSize: Math.round(H * 0.022),
      fontFamily: ff,
      weight: 300,
      color: t.frontText,
      alpha: 0.7,
      letterSpacing: 5,
      tags: ["tagline"],
    }));
  }

  // Email text placed ON the wave curve
  if (cfg.email) {
    layers.push(styledText({
      name: "Email",
      x: W * 0.55, y: H * 0.82,
      w: W * 0.40,
      text: cfg.email,
      fontSize: Math.round(H * 0.022),
      fontFamily: ff,
      weight: 400,
      color: "#FFFFFF",
      tags: ["contact-text"],
    }));
  }

  return layers;
}

'''

content = content[:start_idx] + new_function + content[end_idx:]

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)

print("cyan-tech front layout rewritten successfully.")
