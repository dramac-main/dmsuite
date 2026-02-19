# Business Card Template Specifications

> **Purpose:** Pixel-perfect recreation specifications for all 30 business card templates.
> Each spec is derived from deep analysis of the reference images and defines EXACTLY
> what must be built — layout, typography, colors, spacing, logo treatment, and Canvas2D
> rendering instructions.
>
> **Companion Document:** [LOGO-TREATMENT-SYSTEM.md](LOGO-TREATMENT-SYSTEM.md) — logo
> treatment techniques, fallback chains, and per-template logo config.
>
> **Standard Card Dimensions:** 1050×600 (3.5:2 ratio, standard business card at 300dpi)
> All percentages are relative to these dimensions unless noted otherwise.

---

## Table of Contents

1. [Template #1 — ultra-minimal](#template-1--ultra-minimal)
2. [Template #2 — monogram-luxe](#template-2--monogram-luxe)
3. [Template #3 — geometric-mark](#template-3--geometric-mark)
4. *Templates #4–30 — pending*

---

## Template #1 — ultra-minimal

### Reference Image
- **File:** `6ed0ec5d9a915d54a12b7bd525d0a382.jpg`
- **Card Name in Reference:** MUN
- **Style:** Ultra-minimalist luxury — premium through omission, not addition

### Overview
Two completely different sides. The FRONT is radically minimal — just a tiny accent line
and brand initials centered in vast whitespace. The BACK is an asymmetric diagonal
composition with contact info upper-right and a watermark brand text lower-left.
The design achieves luxury status through extreme restraint.

---

### FRONT SIDE

#### Layout Diagram
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│                                             │
│                    ─── ←──── accent line     │
│                    MUN ←──── brand initials  │
│                                             │
│                                             │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

#### Elements

| Element | Content | Position | Size |
|---------|---------|----------|------|
| Background | Solid fill | Full card | — |
| Accent Line | Thin horizontal line | center-x: 50%, center-y: 44% | width: 4% of card W (≈42px), height: 1px |
| Brand Initials | Company initials or short name | center-x: 50%, top: 47% | font-size: 8% of card H (≈48px) |

#### Typography — Front

| Element | Font | Weight | Size | Case | Letter-Spacing | Color | Align |
|---------|------|--------|------|------|----------------|-------|-------|
| Brand Initials | Geometric sans-serif (Montserrat, Inter, Futura) | 500 (Medium) | 48px (8% H) | UPPERCASE | 0.15em (wide) | `#4a4a4a` | center |

#### Colors — Front

| Element | Hex | RGB | Notes |
|---------|-----|-----|-------|
| Background | `#f8f9fa` | (248, 249, 250) | Very light gray / off-white |
| Accent Line | `#4a4a4a` | (74, 74, 74) | Same as text — monochromatic |
| Brand Initials | `#4a4a4a` | (74, 74, 74) | Medium gray |

#### Logo Treatment — Front
- **Technique:** T12 (No Logo Treatment)
- **Reasoning:** The front side does NOT use the uploaded logo at all. Instead, it renders
  the company initials (derived from company name) in the template's own geometric sans-serif.
  This is a deliberate design choice — the brand is expressed purely through typography.
- **Source:** `initials` — generated from company name (e.g., "Dramac" → "D", "MUN Studios" → "MUN")
- **Note:** If the company name is ≤ 4 characters, use the full name. If longer, use initials.

#### Decorative Elements — Front
- **Accent Line:** Centered above the brand text, same color as the text.
  Width = 4% of card width. Stroke = 1px. No rounded caps.
  Gap between line bottom and text top = 2% of card height (≈12px).

#### Canvas2D Rendering — Front
```
// Background
ctx.fillStyle = '#f8f9fa';
ctx.fillRect(0, 0, W, H);

// Accent line
const lineW = W * 0.04;
const lineY = H * 0.44;
ctx.fillStyle = '#4a4a4a';
ctx.fillRect((W - lineW) / 2, lineY, lineW, 1);

// Brand initials
const brandText = getInitials(company); // ≤4 chars: full name, else initials
ctx.font = '500 48px "Inter", "Montserrat", sans-serif';
ctx.fillStyle = '#4a4a4a';
ctx.textAlign = 'center';
ctx.textBaseline = 'top';
ctx.letterSpacing = '0.15em'; // or manual tracking
ctx.fillText(brandText, W / 2, H * 0.47);
```

---

### BACK SIDE

#### Layout Diagram
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                    PERSON NAME ←──── name    │
│                    ──────────── ←── divider  │
│                    TITLE / POSITION ← title  │
│                                             │
│                    +1 234 567 890 ← phone    │
│                    email@company.com ← email │
│                    www.company.com ← website │
│                                             │
│   MUN ←──── watermark                       │
│                                             │
└─────────────────────────────────────────────┘
```

#### Elements

| Element | Content | Position | Size |
|---------|---------|----------|------|
| Background | Solid fill | Full card | — |
| Name | Person's full name | right-block: left-edge at 52% W, top: 20% H | font-size: 3.5% H (≈21px) |
| Divider | Thin horizontal line | same left-edge as name, top: name-bottom + 1.5% H | width: 8% W (≈84px), height: 1px |
| Title | Job title / position | same left-edge, top: divider + 2% H | font-size: 2.5% H (≈15px) |
| Contact Block | 3-4 lines (phone, email, website, address) | same left-edge, top: title + 3% H | font-size: 2% H (≈12px), line-height: 1.6 |
| Watermark Logo | Brand initials or uploaded logo | left: 20% W, top: 72% H | font-size: 6% H (≈36px) if text; or logo at 15% H |

**Content Zone:** The name/title/contact block is right-of-center, starting at ~52% of card
width (NOT hard right — it has a ~15% right margin). This creates the asymmetric diagonal
balance with the watermark in the lower-left.

#### Typography — Back (5-Tier Hierarchy)

| Tier | Element | Font | Weight | Size | Case | Letter-Spacing | Color | Opacity |
|------|---------|------|--------|------|------|----------------|-------|---------|
| 1 | Name | Geometric sans | 600 (Semibold) | 21px (3.5% H) | UPPERCASE | 0.10em | `#2c2c2c` | 100% |
| 2 | Title | Geometric sans | 300 (Light) | 15px (2.5% H) | UPPERCASE | 0.20em | `#6a6a6a` | 100% |
| 3 | Contact | Geometric sans | 300 (Light) | 12px (2% H) | Sentence | 0 (normal) | `#8a8a8a` | 100% |
| 4 | Watermark | Geometric sans | 500 (Medium) | 36px (6% H) | UPPERCASE | 0.15em | `#b0b0b0` | 100% |
| 5 | Divider Line | — | — | 1px height | — | — | `#e0e0e0` | 100% |

**Key Insight:** The hierarchy is achieved through COLOR VARIATION within a grayscale
palette, NOT through opacity. Each tier has its own distinct gray value:
`#2c2c2c` → `#6a6a6a` → `#8a8a8a` → `#b0b0b0` → `#e0e0e0`

#### Colors — Back

| Element | Hex | RGB | Notes |
|---------|-----|-----|-------|
| Background | `#ffffff` | (255, 255, 255) | Pure white |
| Name text | `#2c2c2c` | (44, 44, 44) | Darkest — anchors the hierarchy |
| Divider line | `#e0e0e0` | (224, 224, 224) | Very subtle |
| Title text | `#6a6a6a` | (106, 106, 106) | Mid-gray |
| Contact text | `#8a8a8a` | (138, 138, 138) | Light gray |
| Watermark | `#b0b0b0` | (176, 176, 176) | Ghost text — barely there |

#### Logo Treatment — Back
- **Technique:** T2 (Enlarged Watermark)
- **Source:** `auto` — uses uploaded logo if available, otherwise renders brand initials
- **Placement:** lower-left quadrant, anchor at (20% W, 72% H)
- **Size:** If logo image: 15% of card height, aspect-preserved. If text: 6% of card height.
- **Opacity:** 100% but using color `#b0b0b0` (effectively 31% of black = very subtle)
- **Color Mode:** `monotone` tinted to `#b0b0b0`
- **Z-Order:** `behind-text` — behind the contact content but above background
- **Overflow:** `clip` — stays within card bounds
- **Blend Mode:** `normal`

**When logo image is uploaded:**
The user's logo is rendered at ~15% card height, tinted to `#b0b0b0` (monotone), placed
at (20% W, 72% H). This creates the same watermark effect as the text initials in the
reference, but using their actual brand mark.

**When no logo image:**
Brand initials rendered as text at 36px, weight 500, letter-spacing 0.15em, color `#b0b0b0`.

#### Spacing — Back

| Gap | Value | Pixels (at 1050×600) |
|-----|-------|---------------------|
| Top edge → Name | 20% H | 120px |
| Name → Divider | 1.5% H | 9px |
| Divider → Title | 2% H | 12px |
| Title → Contact block | 3% H | 18px |
| Contact line-height | 1.6 × font-size | 19.2px |
| Content left-edge → right edge | 52% W → 85% W | 546px → 893px (347px content width) |
| Watermark left | 20% W | 210px |
| Watermark top | 72% H | 432px |

#### Canvas2D Rendering — Back
```
// Background
ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, W, H);

// Content positioning
const contentLeft = W * 0.52;
let y = H * 0.20;

// Name (Tier 1)
ctx.font = '600 21px "Inter", sans-serif';
ctx.fillStyle = '#2c2c2c';
ctx.textAlign = 'left';
ctx.textBaseline = 'top';
ctx.letterSpacing = '0.10em';
ctx.fillText((name || 'PERSON NAME').toUpperCase(), contentLeft, y);
y += 21 + H * 0.015; // name height + gap

// Divider
ctx.fillStyle = '#e0e0e0';
ctx.fillRect(contentLeft, y, W * 0.08, 1);
y += 1 + H * 0.02; // line + gap

// Title (Tier 2)
ctx.font = '300 15px "Inter", sans-serif';
ctx.fillStyle = '#6a6a6a';
ctx.letterSpacing = '0.20em';
ctx.fillText((title || 'TITLE / POSITION').toUpperCase(), contentLeft, y);
y += 15 + H * 0.03; // title height + section gap

// Contact lines (Tier 3)
ctx.font = '300 12px "Inter", sans-serif';
ctx.fillStyle = '#8a8a8a';
ctx.letterSpacing = '0';
const lineH = Math.round(12 * 1.6);
for (const line of [phone, email, website]) {
  if (line) { ctx.fillText(line, contentLeft, y); y += lineH; }
}

// Watermark logo (Tier 4) — lower-left
if (logoImage) {
  // Tint logo to #b0b0b0 monotone
  const logoH = H * 0.15;
  const logoW = logoH * (logoImage.width / logoImage.height);
  drawTintedLogo(ctx, logoImage, W * 0.20, H * 0.72, logoW, logoH, '#b0b0b0');
} else {
  ctx.font = '500 36px "Inter", sans-serif';
  ctx.fillStyle = '#b0b0b0';
  ctx.letterSpacing = '0.15em';
  ctx.fillText(getInitials(company).toUpperCase(), W * 0.20, H * 0.72);
}
```

---

### GAP ANALYSIS: Current Code vs Reference

| Aspect | Current Code | Reference Image | Gap |
|--------|-------------|-----------------|-----|
| **Sides** | Single layout (one side) | Two completely different sides (front/back) | 🔴 Missing front side entirely |
| **Front design** | Name/title/divider/contact on left + logo on right | ONLY centered initials + tiny accent line | 🔴 Completely wrong layout |
| **Back design** | N/A (no back side) | Asymmetric diagonal: content upper-right, watermark lower-left | 🔴 Doesn't exist |
| **Color scheme** | `bg: #f8f8f8, text: #2a2a2a` (adapter) or `bg: #faf8f5, text: #2c3e50` (workspace) | 5-tier grayscale: `#2c2c2c → #6a6a6a → #8a8a8a → #b0b0b0 → #e0e0e0` | 🟡 Close but wrong — needs 5 distinct grays |
| **Typography** | 2 weights (300, 600) | 3 weights (300, 500, 600) + 5 colors + varying letter-spacing | 🔴 Missing weight 500, missing per-tier colors |
| **Logo usage** | Standard small logo on right side | NO logo on front; watermark text/logo lower-left on back | 🔴 Completely wrong treatment |
| **Whitespace** | ~12% margins, content fills card | ~40% effective margins on front; huge intentional emptiness | 🔴 Insufficient whitespace |
| **Brand initials** | Uses `buildLogoLayer()` which loads a logo image | Renders company initials as styled text in template font | 🔴 Wrong approach |
| **Visual hierarchy** | Flat — name and title with opacity differences | 5-tier color hierarchy with distinct gray values per element | 🔴 Missing |

**Verdict:** The current implementation must be **completely rewritten** for both the layout
function and the canvas renderer. Nothing from the current code can be reused except the
basic text rendering utilities.

---

### AI DESIGN DIRECTOR CONSTRAINTS

When the AI modifies this template, it must respect these rules:

| Constraint | Rule |
|------------|------|
| **Front elements** | ONLY accent line + brand initials. NEVER add icons, graphics, or additional text to the front. |
| **Whitespace** | Front must maintain ≥35% margin on all sides. The emptiness IS the design. |
| **Typography** | Single font family throughout. No mixing serif/sans-serif. |
| **Color palette** | Strictly monochromatic grayscale. No hues, no saturation. |
| **Weight range** | Only 300 (Light), 500 (Medium), 600 (Semibold). No bold 700+. |
| **Accent line** | Must remain subtle — max 4% card width on front, max 8% on back. |
| **Logo on front** | NEVER place a logo image on the front side. |
| **Back layout** | Content stays in upper-right quadrant. Watermark stays in lower-left. Never center-align the back. |
| **Decorative elements** | ZERO decorative elements allowed — no borders, no shapes, no patterns. |

### AI Intent Types Applicable
- `change-text` — can update name, title, contact, company
- `change-font` — can change the geometric sans-serif family
- `change-colors` — can shift the grayscale palette (but must maintain 5-tier hierarchy)
- `change-layout` — RESTRICTED: cannot add elements to front; cannot change asymmetric back
- `add-element` — BLOCKED for front side; limited to back side (additional contact line)
- `change-logo` — updates the watermark on back; no effect on front

---

### Logo Treatment Config (for architecture)

```typescript
const ultraMinimalLogoConfig: TemplateLogoConfig = {
  front: {
    technique: 'no-logo',
    source: 'initials',
    placement: { anchor: 'center', offsetX: 50, offsetY: 47 },
    size: { mode: 'height-percent', value: 8 },
    opacity: 1.0,
    overflow: 'clip',
    blendMode: 'normal',
    colorMode: 'monotone',
    tintColor: '#4a4a4a',
    zOrder: 'above-all',
  },
  back: {
    technique: 'enlarged-watermark',
    source: 'auto',
    placement: { anchor: 'bottom-left', offsetX: 20, offsetY: 72 },
    size: { mode: 'height-percent', value: 15 },
    opacity: 1.0,
    overflow: 'clip',
    colorMode: 'monotone',
    tintColor: '#b0b0b0',
    zOrder: 'behind-text',
    blendMode: 'normal',
  },
};
```

---
---

## Template #2 — monogram-luxe

### Reference Image
- **File:** `89fb07c396d55ae38e9e7e3e77f4e33a.jpg`
- **Card Name in Reference:** SH (Samira Hadid)
- **Style:** Oversized monogram luxury — the letterform IS the design

### Overview
A striking composition where a massive Didone/Modern serif letter dominates the left
portion of the front, with text content right-aligned beside it. The back inverts the
color scheme — dark background with light text and a centered monogram. The card uses
a warm neutral palette with only two "colors" — the off-white/warm gray background and
dark charcoal text, with the SIZES and WEIGHTS creating all the drama.

---

### FRONT SIDE

#### Layout Diagram
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│    S        SAMIRA HADID                    │
│    ↑ huge   Creative Director               │
│    monogram                                 │
│             +1 234 567 890                  │
│             email@company.com               │
│             www.company.com                 │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

#### Elements

| Element | Content | Position | Size |
|---------|---------|----------|------|
| Background | Solid fill | Full card | — |
| Monogram Letter | First initial of name | left: 8% W, vertical-center: 50% H | font-size: 55% H (≈330px) — MASSIVE |
| Name | Person's full name | left: 48% W, top: 35% H | font-size: 3% H (≈18px) |
| Title | Job title | left: 48% W, top: name-bottom + 1% H | font-size: 2% H (≈12px) |
| Divider | Very thin line | left: 48% W, below title + 2.5% H | width: 6% W, 1px |
| Contact Block | 2-3 lines | left: 48% W, below divider + 2% H | font-size: 1.8% H (≈11px), line-height: 1.7 |

**Key Layout Feature:** The monogram occupies the LEFT 45% of the card. All text content
is in the RIGHT 48% (starting at 48% W with ~8% right margin). The monogram's baseline
sits at approximately 72% of card height, and the top of the letter reaches approximately 18%.

#### Typography — Front

| Element | Font | Weight | Size | Case | Letter-Spacing | Color |
|---------|------|--------|------|------|----------------|-------|
| Monogram | Didone/Modern serif (Playfair Display, Didot, Bodoni) | 400 (Regular) | 330px (55% H) | UPPERCASE | 0 | `#2c2c2c` |
| Name | Geometric sans-serif | 600 (Semibold) | 18px (3% H) | UPPERCASE | 0.12em | `#2c2c2c` |
| Title | Sans-serif | 300 (Light) | 12px (2% H) | Title Case or Uppercase | 0.08em | `#6a6a6a` |
| Contact | Sans-serif | 300 (Light) | 11px (1.8% H) | Sentence | 0 | `#8a8a8a` |

**Font Pairing:** The monogram uses a high-contrast SERIF (Didone classification —
characterized by extreme thick/thin stroke contrast, unbracketed serifs). All other text
uses a clean geometric sans-serif. This serif/sans pairing is the signature of the design.

#### Colors — Front

| Element | Hex | RGB | Notes |
|---------|-----|-----|-------|
| Background | `#eae8eb` | (234, 232, 235) | Warm light gray with subtle lavender undertone |
| Monogram | `#2c2c2c` | (44, 44, 44) | Dark charcoal |
| Name | `#2c2c2c` | (44, 44, 44) | Same as monogram |
| Title | `#6a6a6a` | (106, 106, 106) | Mid gray |
| Contact | `#8a8a8a` | (138, 138, 138) | Light gray |
| Divider | `#d0d0d0` | (208, 208, 208) | Subtle line |

**Important:** The background is NOT pure white and NOT pure gray — it has a very subtle
warm/lavender tint (`#eae8eb`). This warmth is intentional and distinguishes it from
Template #1's cooler `#f8f9fa`.

#### Logo Treatment — Front
- **Technique:** T3 (Monogram as Primary Graphic)
- **Source:** `initials` — first letter of the person's name (NOT the company name)
  - If person name = "Samira Hadid" → monogram = "S"
  - If person name = "John Smith" → monogram = "J"
  - If user has a single-letter icon logo → can use that instead
- **Rendering:** The monogram is rendered as TEXT in a Didone serif font, not as an image.
  Even if the user uploads a logo, the front monogram is always a serif letter.
- **The uploaded logo is NOT used on the front.**

#### Decorative Elements — Front
- **Divider line:** Between title and contact, at 48% W, width 6% W, 1px, color `#d0d0d0`
- No other decorative elements.

---

### BACK SIDE

#### Layout Diagram
```
┌─────────────────────────────────────────────┐
│             ███████████████████████████████  │
│             ███████████████████████████████  │
│             ███████████████████████████████  │
│             ████████ (dark bg) ████████████  │
│             ████████           ████████████  │
│             ████████    S      ████████████  │
│             ████████  SAMIRA   ████████████  │
│             ████████  HADID    ████████████  │
│             ████████           ████████████  │
│             ███████████████████████████████  │
│             ███████████████████████████████  │
│             ███████████████████████████████  │
└─────────────────────────────────────────────┘
```

#### Elements

| Element | Content | Position | Size |
|---------|---------|----------|------|
| Background | Dark solid fill | Full card | — |
| Monogram | Same initial as front | center-x: 50%, center-y: 40% | font-size: 35% H (≈210px) |
| Name Line 1 | First name | center-x: 50%, below monogram + 2% H | font-size: 3.5% H (≈21px) |
| Name Line 2 | Last name | center-x: 50%, below line 1 + 1% H | font-size: 3.5% H (≈21px) |

**Key Feature — Color Inversion:** The back uses the INVERSE of the front color scheme.
Where the front is light bg + dark text, the back is dark bg + light text. The monogram
that was dark charcoal on front becomes light/off-white on back.

#### Typography — Back

| Element | Font | Weight | Size | Case | Letter-Spacing | Color |
|---------|------|--------|------|------|----------------|-------|
| Monogram | Didone serif (same as front) | 400 | 210px (35% H) | UPPERCASE | 0 | `#d8d6d9` (light warm gray) |
| Name words | Geometric sans-serif (same as front) | 600 | 21px (3.5% H) | UPPERCASE | 0.25em (very wide) | `#d8d6d9` |

**Wide letter-spacing on the name** is critical — the name words are spaced very openly
(0.25em) on the back, more than on the front (0.12em). This is a deliberate design choice
for the inverted composition.

#### Colors — Back

| Element | Hex | RGB | Notes |
|---------|-----|-----|-------|
| Background | `#2c2c2c` | (44, 44, 44) | Dark charcoal (was the text color on front) |
| Monogram | `#d8d6d9` | (216, 214, 217) | Light warm gray (similar to front bg, slightly warmer) |
| Name text | `#d8d6d9` | (216, 214, 217) | Same as monogram |

#### Logo Treatment — Back
- **Technique:** T3 (Monogram as Primary Graphic) + T7 (Color Inversion)
- **Source:** `initials` — same letter as front
- **Color Mode:** `inverted` — the monogram color flips from dark-on-light to light-on-dark
- **The uploaded logo is NOT used on the back either.** Both sides use typography.

---

### GAP ANALYSIS: Current Code vs Reference

| Aspect | Current Code | Reference Image | Gap |
|--------|-------------|-----------------|-----|
| **Monogram** | No monogram — uses standard name/title layout | Massive 55% H serif letter dominates the left | 🔴 Core design element missing |
| **Serif font** | No serif font in the system | Didone serif (Playfair Display / Bodoni) for monogram | 🔴 Need serif font support |
| **Front layout** | Left-aligned name/title/contact/logo | LEFT: huge monogram, RIGHT: text content at 48% | 🔴 Completely wrong composition |
| **Back side** | N/A (no back) | Dark bg, centered monogram + wide-spaced name | 🔴 Doesn't exist |
| **Color inversion** | Not supported | Front and back use inverted color schemes | 🔴 New feature needed |
| **Background color** | `#f8f8f8` or `#faf8f5` | `#eae8eb` (warm lavender tint) | 🟡 Wrong shade |
| **Letter spacing** | Fixed/default | Varies per element: 0, 0.08em, 0.12em, 0.25em | 🔴 Need per-element tracking |
| **Font pairing** | Single sans-serif throughout | Serif monogram + sans-serif body text | 🔴 Need dual-font system |

---

### AI DESIGN DIRECTOR CONSTRAINTS

| Constraint | Rule |
|------------|------|
| **Monogram** | ALWAYS present on both sides. It IS the design. Never remove or shrink below 40% H. |
| **Serif font** | Monogram MUST use a Didone/Modern serif — NEVER sans-serif for the monogram. |
| **Font pairing** | Monogram = serif; all other text = sans-serif. Never mix. |
| **Front layout** | Monogram LEFT, text RIGHT. Never center or reverse. |
| **Back layout** | Everything centered vertically. Never asymmetric. |
| **Color inversion** | Back MUST use inverted colors from front. They are a matched pair. |
| **Decorative elements** | ZERO allowed — no borders, no shapes, no patterns, no icons. |
| **Logo image** | NEVER used on either side. This template is pure typography. |
| **Name on back** | Each word on its own line, wide letter-spacing. Never single-line. |

### Logo Treatment Config

```typescript
const monogramLuxeLogoConfig: TemplateLogoConfig = {
  front: {
    technique: 'monogram-primary',
    source: 'initials', // Always uses generated initial, never uploaded logo
    placement: { anchor: 'center-left', offsetX: 8, offsetY: 50 },
    size: { mode: 'height-percent', value: 55 },
    opacity: 1.0,
    overflow: 'clip',
    colorMode: 'monotone',
    tintColor: '#2c2c2c',
    zOrder: 'behind-text',
    blendMode: 'normal',
  },
  back: {
    technique: 'monogram-primary',
    source: 'initials',
    placement: { anchor: 'center', offsetX: 50, offsetY: 40 },
    size: { mode: 'height-percent', value: 35 },
    opacity: 1.0,
    overflow: 'clip',
    colorMode: 'inverted',
    tintColor: '#d8d6d9',
    zOrder: 'behind-text',
    blendMode: 'normal',
  },
};
```

---
---

## Template #3 — geometric-mark

### Reference Image
- **File:** `71f407bd7e2cfba4a2fc10159b108582.jpg`
- **Card Name in Reference:** AV (Rob Simax, Artist)
- **Style:** Interlocking geometric monogram with engraving-style hatching — architectural precision meets traditional craftsmanship

### Overview
The most technically complex template in the set. The FRONT is a dark card with a
single centered interlocking monogram constructed from two ribbon-like bands that
weave over/under each other (Penrose-triangle effect), filled with 45° diagonal
hatching lines in pure white. The BACK is light, with bold name + light title at
top-left, contact info at bottom-left, and the same monogram rendered as a large
ghosted watermark shifted to the right. No colors — pure monochromatic gray scale.
No decorative elements — the monogram IS the entire design.

---

### FRONT SIDE

#### Layout Diagram
```
┌─────────────────────────────────────────────┐
│ ████████████ dark gradient ████████████████ │
│ █████████████████████████████████████████  │
│ ██████████████                  ██████████ │
│ ████████████   ╱╲    ╲╱        █████████  │
│ ███████████   ╱  ╲    ╲       ██████████  │
│ ███████████  ╱ A  ╲  V ╲     ██████████  │
│ ███████████  ╲    ╱  ╱  ╱    ██████████  │
│ ████████████  ╲  ╱  ╱  ╱   ███████████  │
│ █████████████  ╲╱  ╱╲╱   ████████████  │
│ ██████████████████████████████████████████ │
│ ██████████████████████████████████████████ │
└─────────────────────────────────────────────┘
       (interlocking hatched AV monogram)
```

#### Elements

| Element | Content | Position | Size |
|---------|---------|----------|------|
| Background | Horizontal gradient (dark) | Full card | See gradient stops below |
| Interlocking Monogram | Two ribbon bands forming AV | center: (50%, 50.5%) | width: 30.8% W, height: 33% H |

**No text on the front.** The monogram is the sole visual element.

#### Background Gradient — Front

| Stop | Position | Hex | RGB | Brightness |
|------|----------|-----|-----|------------|
| 1 | 0% (left edge) | `#252628` | (37, 38, 40) | 38 |
| 2 | 50% (center) | `#3b3c3e` | (59, 60, 62) | 60 |
| 3 | 65% (peak) | `#4b4c4e` | (75, 76, 78) | 76 |
| 4 | 100% (right edge) | `#3e3f41` | (62, 63, 65) | 63 |

**Character:** Cool-blue tint — Blue channel is consistently 2-3 points higher than Red.
The gradient creates a subtle left-to-right dimensional sweep with a gentle highlight
at the 65% mark. NOT flat — this dimensionality is important.

#### The Interlocking Monogram — Detailed Construction

This is the signature element. Two flat ribbon-like bands weave through each other,
creating a Penrose-triangle / Celtic-knot impossibility.

**Band A (forms the "A" shape):**
- Descends from top-center toward the LOWER-LEFT, creating the two diverging legs of "A"
- Ribbon width: ~8-12% of card width (uniform)

**Band B (forms the "V" shape):**
- Shares the same top apex as Band A
- Descends toward the LOWER-RIGHT, forming the converging arms of "V"
- Same ribbon width as Band A

**Two Crossing Points (the magic):**
1. **Upper crossing (y ≈ 42-47% of card):** Band B (V) passes BEHIND Band A (A)
   — the left arm is continuous, the right arm is occluded
2. **Lower crossing (y ≈ 54-58% of card):** Band A passes BEHIND Band B (V)
   — the left arm splits, the right arm is continuous, creating the swap

**Vertex Coordinates (% of card):**

Band A outer edge:
```
(43%, 34%) → (41%, 40%) → (39%, 48%) → (35%, 59%) → bottom converge (48-54%, 67%)
```

Band A inner edge:
```
(53%, 34%) → (54%, 40%) → (60%, 48%) → (52%, 59%) → bottom converge (48-54%, 67%)
```

Band B outer edge:
```
Shared top (43-53%, 34%) → (65%, 42%) → (63%, 48%) → (61%, 54%) → (59%, 59%) → bottom
```

Band B inner edge:
```
Shared top → (60%, 42%) → (57%, 48%) → (53%, 54%) → (52%, 59%) → bottom
```

**Hatching Pattern (fills the ribbon bands):**
- **Angle:** 45° (top-left to bottom-right)
- **Line color:** `#ffffff` (pure white)
- **Line width:** ~0.5% of card width (≈5px at 1050w)
- **Line spacing:** ~1.5% of card width center-to-center (≈16px at 1050w)
- **Gap shows through:** Card background color is visible between hatching lines
- **Uniform:** Same angle, spacing, and weight across ALL parts of both bands
- **No solid fill** — the entire monogram is rendered purely through hatching

**Drawing Order (z-order for over/under illusion):**
```
1. Draw Band A bottom-left section (BEHIND at crossing #2) — clip + hatch
2. Draw Band A top-left section (FRONT at crossing #1) — clip + hatch
3. Draw Band B top section — clip + hatch
4. Draw Band B bottom-right section (FRONT at crossing #2) — clip + hatch
```

**Monogram Silhouette Profile:**
```
y=34%: x=43-52%   width= 9%  ← narrow top (shared apex)
y=40%: x=41-54%   width=13%  ← V spreading
y=42%: x=41-65%   width=25%  ← right arm appears
y=50%: x=38-63%   width=25%  ← widest point (both arms fully deployed)
y=60%: x=46-59%   width=13%  ← left arm gone, converging
y=67%: x=48-54%   width= 6%  ← narrow bottom (A point)
```

#### Canvas2D Rendering — Front
```
// 1. Background gradient
const grad = ctx.createLinearGradient(0, 0, W, 0);
grad.addColorStop(0.0,  '#252628');
grad.addColorStop(0.50, '#3b3c3e');
grad.addColorStop(0.65, '#4b4c4e');
grad.addColorStop(1.0,  '#3e3f41');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// 2. Construct monogram band paths (see vertex coords above)
// Each band is defined as a closed polygon path

// 3. For each band section (in z-order):
//    ctx.save();
//    ctx.beginPath();
//    // trace the polygon for this section
//    ctx.clip();
//    // Draw 45° hatching lines
//    ctx.strokeStyle = '#ffffff';
//    ctx.lineWidth = W * 0.005;
//    const spacing = W * 0.015;
//    ctx.rotate(Math.PI / 4);
//    // draw parallel lines covering clipped area
//    ctx.restore();
```

---

### BACK SIDE

#### Layout Diagram
```
┌─────────────────────────────────────────────┐
│                                             │
│   ROB SIMAX ←── name (bold)                 │
│                                             │
│   ARTIST ←── title (light, wide spacing)    │
│                           ╱╲     ╲╱         │
│                          ╱  ╲     ╲         │
│                         ╱ watermark ╲       │
│                         ╲    ╱  ╱  ╱        │
│                          ╲  ╱  ╱  ╱         │
│                           ╲╱  ╱╲╱           │
│   BOULEVARD 01234 ←── address               │
│   LONDON...        +01 234... ←── contact   │
│   email@...        www.rob... ←── contact   │
└─────────────────────────────────────────────┘
```

#### Elements

| Element | Content | Position | Size |
|---------|---------|----------|------|
| Background | Solid cool white | Full card | — |
| Watermark Monogram | Same AV as front, ghosted | center: (64%, 48%), spans ~60% W × 99% H | hatching in `#b8b8ba` |
| Name | Person's full name | left: 8.8% W, top: 12.6% H | font-size: 3.3% H (≈20px) |
| Title | Job title | left: 9.0% W, top: 21.0% H | font-size: 2.0% H (≈12px) |
| Address | Short address line | left: 9.0% W, top: 77.2% H | font-size: 2.0% H (≈12px) |
| Contact Line 1 | Location (left) + Phone (right) | left: 10% W, top: 82.5% H | font-size: 2.0% H |
| Contact Line 2 | Email (left) + Website (right) | left: 9% W, top: 87.8% H | font-size: 2.0% H |

**Key Layout Feature:** Name and title are TOP-LEFT. Contact info is BOTTOM-LEFT. A massive
54% vertical gap between title (23% H) and address (77.2% H) creates dramatic breathing
space. The watermark fills this space from behind.

**Contact lines use split alignment:** Left portion (location/email) is left-aligned at ~9% W.
Right portion (phone/website) is right-aligned, extending to ~73-76% W. This creates a
two-column contact layout within each line.

#### Typography — Back (4-Tier Weight Hierarchy)

| Tier | Element | Weight | Size (% H) | Case | Letter-Spacing | Color |
|------|---------|--------|------------|------|----------------|-------|
| T1 | Name | 700 (Bold) | 3.3% | UPPERCASE | 0.12em | `#1c1d1e` (near-black) |
| T2 | Title | 300 (Light) | 2.0% | UPPERCASE | 0.25-0.30em (very wide) | `#838587` (mid-gray) |
| T3 | Address | 300 (Light) | 2.0% | UPPERCASE | 0.05em | `#8a8b8d` (medium gray) |
| T4 | Contact | 400 (Regular) | 2.0% | Mixed (CAPS addr, lower email) | 0.03em | `#939495` / `#7c7d7f` |

**Key Typography Insight:** T2/T3/T4 all share the SAME font size (2.0% H). Differentiation
comes from weight (300→300→400) and especially COLOR (`#838587` → `#8a8b8d` → `#939495`).
The title's extreme letter-spacing (0.25em+) is the luxury signal.

**Font family:** Single geometric sans-serif throughout (Futura, Montserrat, Gotham, Century
Gothic). Same family as front monogram hatching context — NO serif anywhere.

#### Colors — Back

| Element | Hex | RGB | Notes |
|---------|-----|-----|-------|
| Background | `#f8f9fb` | (248, 249, 251) | Cool pale white (blue tint, B > R by 3) |
| Name text | `#1c1d1e` | (28, 29, 30) | Near-black — maximum contrast |
| Title text | `#838587` | (131, 133, 135) | ~50% brightness — deliberately subdued |
| Address text | `#8a8b8d` | (138, 139, 141) | Slightly lighter than title |
| Contact text | `#939495` | (147, 148, 149) | Lightest text — supporting role |
| Contact alt | `#7c7d7f` | (124, 125, 127) | Email/website — slightly darker |
| Watermark hatching | `#b8b8ba` | (184, 184, 186) | ~25-30% perceived opacity against bg |

#### Logo Treatment — Back
- **Technique:** T2 (Enlarged Watermark)
- **Source:** `auto` — uses the same interlocking monogram from front, rendered as watermark
- **Placement:** center at (64% W, 48% H) — shifted RIGHT of card center
- **Size:** Spans ~60% of card width × ~99% of card height — nearly fills entire card
- **Hatching color:** `#b8b8ba` (NOT white — gray hatching to create ghosted effect)
- **Same 45° angle and spacing** as front monogram
- **Z-Order:** `behind-text` — text overlaps watermark in name/title zone and contact zone
- **No additional opacity** — the gray hatching color itself provides the watermark subtlety

**When user uploads a logo:**
The uploaded logo replaces the monogram for BOTH front and back. The logo is rendered:
- FRONT: As the centered hero graphic with white hatching effect applied via clipping + pattern
- BACK: As the enlarged watermark with gray hatching at same proportions

**When no logo uploaded:**
Generate interlocking initials from company/person name using the geometric ribbon
construction technique described above.

#### Logo Treatment — Front
- **Technique:** T8 (Primary Hero Graphic) + T3 (Monogram as Primary Graphic)
- **Source:** `auto`
  - If user has uploaded a logo → render the logo as the centered hero element with
    hatching overlay effect (clip to logo silhouette, fill with 45° white lines)
  - If no logo → generate interlocking monogram initials from name
- **Placement:** center at (50%, 50.5%)
- **Size:** 30.8% W × 33% H
- **Color:** White `#ffffff` hatching lines on dark background
- **Z-Order:** `above-all` (only element on front)
- **Blend Mode:** `normal`

#### Spacing — Back

| Gap | Value | Pixels (at 1050×600) |
|-----|-------|---------------------|
| Top edge → Name | 12.6% H | 76px |
| Name height | 3.3% H | 20px |
| Name → Title | 5.1% H | 31px |
| Title height | 2.0% H | 12px |
| Title → Address (BREATHING SPACE) | 54.2% H | 325px |
| Address height | 2.0% H | 12px |
| Address → Contact 1 | 3.3% H | 20px |
| Contact 1 height | 2.0% H | 12px |
| Contact 1 → Contact 2 | 3.3% H | 20px |
| Contact 2 height | 2.0% H | 12px |
| Contact 2 → Bottom | 10.2% H | 61px |

#### Canvas2D Rendering — Back
```
// 1. Background
ctx.fillStyle = '#f8f9fb';
ctx.fillRect(0, 0, W, H);

// 2. Watermark monogram (same geometry as front, scaled 2.2x, gray hatching)
// Center at (64%W, 48%H), spans ~60%W × ~99%H
// Use same band paths, scaled and repositioned
// Hatching: strokeStyle = '#b8b8ba', same proportional lineWidth and spacing

// 3. Name (over watermark)
ctx.font = '700 ' + (H*0.033) + 'px "Montserrat", sans-serif';
ctx.fillStyle = '#1c1d1e';
ctx.textAlign = 'left';
ctx.textBaseline = 'top';
// letter-spacing 0.12em
ctx.fillText('ROB SIMAX', W*0.088, H*0.126);

// 4. Title
ctx.font = '300 ' + (H*0.020) + 'px "Montserrat", sans-serif';
ctx.fillStyle = '#838587';
// letter-spacing 0.25em
ctx.fillText('ARTIST', W*0.090, H*0.210);

// 5. Address
ctx.font = '300 ' + (H*0.020) + 'px "Montserrat", sans-serif';
ctx.fillStyle = '#8a8b8d';
ctx.fillText('BOULEVARD 01234', W*0.090, H*0.772);

// 6. Contact line 1 (split: left location + right phone)
ctx.font = '400 ' + (H*0.020) + 'px "Montserrat", sans-serif';
ctx.fillStyle = '#939495';
ctx.textAlign = 'left';
ctx.fillText('LONDON, MAIN STREET, BIG BUILDING A/21', W*0.10, H*0.825);
ctx.textAlign = 'right';
ctx.fillText('+ 01 (0) 234 567 890', W*0.73, H*0.825);

// 7. Contact line 2 (split: left email + right website)
ctx.fillStyle = '#7c7d7f';
ctx.textAlign = 'left';
ctx.fillText('contact@info.com', W*0.09, H*0.878);
ctx.textAlign = 'right';
ctx.fillText('www.rob_simax.com', W*0.76, H*0.878);
```

---

### GAP ANALYSIS: Current Code vs Reference

| Aspect | Current Code | Reference Image | Gap |
|--------|-------------|-----------------|-----|
| **Front design** | Generic: centered logo + name + title + divider + contact | Dark gradient + single centered interlocking hatched monogram ONLY | 🔴 Completely wrong — needs total rewrite |
| **Back design** | N/A (single-side) | Asymmetric text layout + giant watermark monogram | 🔴 Doesn't exist |
| **Monogram** | Uses `buildLogoLayer()` (simple image placement) | Complex interlocking ribbon geometry with 45° hatching + over/under crossings | 🔴 Core feature missing — requires custom path construction |
| **Hatching effect** | Not supported anywhere in codebase | 45° parallel white lines clipped to monogram paths | 🔴 New rendering technique needed |
| **Background** | `#f5f5f5` flat or slight gradient wash | Dark horizontal gradient `#252628` → `#4b4c4e` → `#3e3f41` | 🔴 Wrong color AND wrong direction |
| **Text on front** | Name, title, contact all on front | ZERO text on front | 🔴 Must remove all text from front |
| **Watermark** | Not supported | 60%W × 99%H ghosted hatched monogram shifted right on back | 🔴 New feature needed |
| **Typography** | 2 weights (300, 500) | 3 weights (300, 400, 700) | 🔴 Missing Bold 700 |
| **Colors** | `primary: "#2d2d2d", bg: "#f5f5f5"` | 14-swatch monochrome palette with cool blue tint | 🔴 Wrong palette |
| **Contact layout** | Centered single column | Split left/right alignment within each line | 🔴 Different layout pattern |
| **Theme sync** | Adapter uses grays, Workspace uses greens — OUT OF SYNC | Should be identical monochrome | 🟡 Theme mismatch between files |

**Verdict:** Complete rewrite required. The interlocking monogram with hatching is the most
complex rendering challenge in the entire 30-template set — it requires custom polygon path
construction, clipping, and line pattern rendering that doesn't exist in the current codebase.

---

### AI DESIGN DIRECTOR CONSTRAINTS

| Constraint | Rule |
|------------|------|
| **Front content** | ONLY the interlocking monogram. ZERO text, ZERO additional elements. |
| **Hatching** | Must maintain 45° angle. Line weight and spacing must be uniform. |
| **Over/under crossings** | The two crossing points must alternate correctly — NEVER draw both bands on top. |
| **Color palette** | Strictly monochromatic achromatic grayscale with cool (blue) tint. ZERO accent colors. |
| **Typography** | Single geometric sans-serif family. NEVER serif. NEVER decorative. |
| **Back layout** | Name+title TOP-LEFT, contact BOTTOM-LEFT, watermark fills the middle-right. Never rearrange. |
| **Breathing space** | The 54% vertical gap between title and address is MANDATORY. Never fill it with content. |
| **Contact split** | Contact lines use left+right split alignment. Never single-column centered. |
| **Decorative elements** | ZERO — no borders, no icons, no dividers, no ornaments. |
| **Monogram source** | Uses person's initials (not company name) for the interlocking letters. |

### Logo Treatment Config

```typescript
const geometricMarkLogoConfig: TemplateLogoConfig = {
  front: {
    technique: 'primary-hero', // T8 — also functions as T3 monogram
    source: 'auto', // logo image → hatched hero; no logo → generated interlocking initials
    placement: { anchor: 'center', offsetX: 50, offsetY: 50.5 },
    size: { mode: 'contain', value: 33 }, // 33% of card height
    opacity: 1.0,
    overflow: 'clip',
    colorMode: 'monotone',
    tintColor: '#ffffff', // white hatching on dark background
    zOrder: 'above-all',
    blendMode: 'normal',
    // Special: hatching overlay effect applied via clipping + 45° lines
  },
  back: {
    technique: 'enlarged-watermark', // T2
    source: 'auto',
    placement: { anchor: 'center', offsetX: 64, offsetY: 48 },
    size: { mode: 'cover', value: 99 }, // nearly fills entire card height
    opacity: 1.0,
    overflow: 'clip',
    colorMode: 'monotone',
    tintColor: '#b8b8ba', // gray hatching for watermark effect
    zOrder: 'behind-text',
    blendMode: 'normal',
  },
};
```

---
---

## Template #4 — frame-minimal

### Reference Image
- **File:** `eadf9c42a44f5e6e23b9f9a56dbb7e91.jpg`
- **Card Name in Reference:** Adika Saputra, Graphic Designer
- **Style:** Ultra-minimalist with diagonal L-bracket pair framing — design through restraint

### Overview
The defining feature is a pair of L-shaped corner brackets at TOP-LEFT and BOTTOM-RIGHT
only (NOT four corners) creating an implied diagonal frame axis. The front is pure white
with a 5-level gray text hierarchy, color-coded contact dots replacing icons, and a QR code.
The back inverts: dark background, centered full rectangular frame (counterpoint to the
open brackets), with bold wide-tracked title text inside. 65% whitespace on front — every
element feels precious through scarcity.

---

### FRONT SIDE

#### Layout Diagram
```
┌─────────────────────────────────────────────┐
│   ┌────                              ┌───┐ │
│   │                                  │QR │ │
│   │                                  │   │ │
│                                      └───┘ │
│   ADIKA SAPUTRA ←── name                   │
│   Graphic Designer ←── title               │
│                                            │
│   🟠 +123-456-7890 ←── phone               │
│   🟢 hello@reallygreatsite.com ←── email   │
│   🔵 123 Anywhere St., Any City ←── addr   │
│                                            │
│                                   ────┐    │
│                                       │    │
└─────────────────────────────────────────────┘
```

#### Elements

| Element | Content | Position | Size |
|---------|---------|----------|------|
| Background | Solid pure white | Full card | — |
| TL Bracket | L-shaped bracket (horiz + vert arms) | corner: (10% W, 16% H) | horiz: 7.6% W, vert: 10% H |
| BR Bracket | L-shaped bracket (mirror of TL) | corner: (90% W, 84% H) | same arms |
| Name | Person's full name | left: 14.3% W, top: 24% H | 4.5% H (27px) |
| Title | Job title | left: 14.3% W, top: 30% H | 2.5% H (15px) |
| Dot + Phone | Orange dot + phone number | dot: (14.3% W, 46% H), text: (16.7% W, 46% H) | dot: 3px radius |
| Dot + Email | Green dot + email | dot: (14.3% W, 52% H), text: (16.7% W, 52% H) | dot: 3px radius |
| Dot + Address | Blue dot + address | dot: (14.3% W, 58% H), text: (16.7% W, 58% H) | dot: 3px radius |
| Website | URL text | left: 16.7% W, top: 64% H | 1.8% H (11px) |
| QR Code | Generated QR | left: 80% W, top: 20% H | 13% W (137px square) |

#### The L-Bracket System — Front

**Only TWO brackets** at diagonal corners (top-left + bottom-right). This is NOT a
four-corner frame — the asymmetric placement creates visual tension and movement.

| Bracket | Corner Position | Horizontal Arm | Vertical Arm |
|---------|----------------|----------------|--------------|
| Top-Left | (10% W, 16% H) = (105px, 96px) | Rightward 7.6% W (80px) | Downward 10% H (60px) |
| Bottom-Right | (90% W, 84% H) = (945px, 504px) | Leftward 7.6% W (80px) | Upward 10% H (60px) |

**Line properties:** 1.5px weight, `#CCCCCC` color, butt line-cap, exact 90° corner (no
rounding, no overlap). Arms meet at the corner point.

#### Color-Coded Contact Dots

Replace traditional phone/email/pin icons with tiny colored circles:

| Dot | Contact Type | Color | Hex | Psychological Association |
|-----|-------------|-------|-----|--------------------------|
| 1 | Phone | Orange-Red | `#FF6B35` | Warm, personal, urgent |
| 2 | Email | Green | `#4CAF50` | Digital, go, action |
| 3 | Address | Blue | `#2196F3` | Location, trust, stable |

Dot radius: 3px. Dot-to-text horizontal gap: 25px (2.4% W). Dots are vertically centered
with their corresponding text line.

**These are the ONLY color accents on the entire card.** Everything else is grayscale.

#### Typography — Front

| Tier | Element | Weight | Size | Case | Letter-Spacing | Color |
|------|---------|--------|------|------|----------------|-------|
| T1 | Name | 600 (SemiBold) | 27px (4.5% H) | UPPERCASE | 0.18em | `#2D2D2D` |
| T2 | Title | 300 (Light) | 15px (2.5% H) | Title Case | 0.02em | `#888888` |
| T3 | Contact lines | 400 (Regular) | 12px (2.0% H) | Mixed | 0.01em | `#999999` |
| T4 | Website | 400 (Regular) | 11px (1.8% H) | lowercase | 0.01em | `#AAAAAA` |

**Font family:** Single geometric sans-serif throughout (Montserrat / Poppins).

#### Colors — Front

| Element | Hex | RGB |
|---------|-----|-----|
| Background | `#FFFFFF` | (255, 255, 255) |
| Name | `#2D2D2D` | (45, 45, 45) |
| Title | `#888888` | (136, 136, 136) |
| Contact text | `#999999` | (153, 153, 153) |
| Website | `#AAAAAA` | (170, 170, 170) |
| Brackets | `#CCCCCC` | (204, 204, 204) |
| QR modules | `#000000` | (0, 0, 0) |

#### Logo Treatment — Front
- **Technique:** T12 (No Logo Treatment)
- **Reasoning:** The front has NO logo. The design relies entirely on typography, the
  bracket motif, and the color dots. The QR code functions as the "brand mark" — the
  scannable link IS the identity element.

#### Spacing — Front

| Gap | Value | Pixels |
|-----|-------|--------|
| Bracket corner → Name | 8% H | 48px |
| Name → Title | 6% H | 36px |
| Title → First contact line | 16% H | 96px (significant breathing room) |
| Between contact lines | 6% H | 36px (consistent rhythm) |
| Contact → Website | 6% H | 36px |
| Left margin (bracket zone) | 10% W | 105px |
| Text left margin | 14.3% W | 150px |
| Right margin | 10% W | 105px |

---

### BACK SIDE

#### Layout Diagram
```
┌─────────────────────────────────────────────┐
│ ████████████ dark bg █████████████████ ┌──┐ │
│ ████████████████████████████████████  │QR│ │
│ ████  ┌───────────────────────────┐  └──┘ │
│ ████  │                           │  █████ │
│ ████  │     M I N I M A L         │  █████ │
│ ████  │                           │  █████ │
│ ████  │     Business Card         │  █████ │
│ ████  │                           │  █████ │
│ ████  └───────────────────────────┘  █████ │
│ ██████████████████████████████████████████ │
│ ██████████████████████████████████████████ │
└─────────────────────────────────────────────┘
```

#### Elements

| Element | Content | Position | Size |
|---------|---------|----------|------|
| Background | Solid dark fill | Full card | — |
| Rectangular Frame | Continuous closed rectangle outline | center: (50% W, 47% H) | 58% W × 30% H (609×180px) |
| "MINIMAL" | Template/brand name | center: (50% W, 42% H) | 8.5% H (51px) |
| "Business Card" | Subtitle | center: (50% W, 53% H) | 3.0% H (18px) |
| QR Code | White QR | left: 85% W, top: 8% H | 9% W (95px square) |

**Front/Back Frame Duality:** The front uses OPEN L-brackets (implying a frame). The back
uses a CLOSED rectangle (completing the frame). This yin-yang relationship is the design's
conceptual core.

#### Typography — Back

| Element | Weight | Size | Case | Letter-Spacing | Color |
|---------|--------|------|------|----------------|-------|
| Main title | 700 (Bold) | 51px (8.5% H) | UPPERCASE | 0.35em (extremely wide) | `#FFFFFF` |
| Subtitle | 300 (Light) | 18px (3.0% H) | Title Case | 0.12em | `#AAAAAA` |

#### Colors — Back

| Element | Hex | Notes |
|---------|-----|-------|
| Background | `#1A1A1A` | Near-black |
| Frame stroke | `rgba(255,255,255,0.6)` | 60% white — ghostly outline |
| Main title | `#FFFFFF` | Pure white |
| Subtitle | `#AAAAAA` | Muted silver-gray |
| QR modules | `#FFFFFF` | White on dark (inverted from front) |

#### Logo Treatment — Back
- **Technique:** T1 (Standard Small Placement) — optional
- **Source:** `auto` — if user has a logo, it COULD appear as a small mark inside the
  rectangle frame, below the subtitle. But the reference shows no logo on back either.
- **Alternative:** The QR code functions as the brand mark on both sides. The user's logo
  can be embedded IN the QR code using a QR-with-logo generation technique.
- **Size if used:** ~8% H, centered inside frame below subtitle
- **Default behavior:** No logo rendered (following reference image exactly)

#### Frame Properties — Back

| Property | Value |
|----------|-------|
| Stroke width | 1px (thinner than front brackets) |
| Color | `rgba(255,255,255,0.6)` |
| Corner radius | 0px (sharp 90° corners) |
| Position | centered at (50% W, 47% H) |
| Dimensions | 58% W × 30% H = 609px × 180px |
| Inner padding | "MINIMAL" at 33% of frame height, "Business Card" at 70% |

---

### GAP ANALYSIS: Current Code vs Reference

| Aspect | Current Code | Reference Image | Gap |
|--------|-------------|-----------------|-----|
| **Bracket motif** | Not implemented — generic logo-centered layout | 2 diagonal L-brackets at TL/BR corners | 🔴 Signature element missing |
| **Color dots** | Not implemented | 3 color-coded contact dots replacing icons | 🔴 New feature needed |
| **Front layout** | Generic centered: logo → name → title → divider → contact | Left-aligned text + dots + QR top-right + brackets | 🔴 Wrong composition |
| **Back side** | Doesn't exist | Dark bg + centered frame + wide-tracked title | 🔴 Missing |
| **QR code** | Not implemented in any template | Black QR on white (front), white QR on dark (back) | 🔴 New feature needed |
| **Whitespace** | Standard margins ~12% | 65% whitespace — radical emptiness | 🔴 Insufficient space |
| **Typography** | 2 weights (300, 500) | 5-level gray hierarchy (300, 400, 600, 700) | 🔴 Missing tiers |
| **Colors** | Greens (#2d4a3e) or grays (#2d2d2d) | Pure white front, near-black back, 3 accent colors for dots | 🔴 Wrong palette |
| **Frame duality** | Not implemented | Open brackets (front) ↔ closed rectangle (back) | 🔴 Conceptual feature missing |

---

### AI DESIGN DIRECTOR CONSTRAINTS

| Constraint | Rule |
|------------|------|
| **Brackets** | Exactly TWO L-brackets — top-left and bottom-right ONLY. Never add 4 corners. |
| **Color dots** | Exactly 3 dots with distinct colors. Never replace with icons. |
| **QR code** | Always present on front. Must maintain quiet zone spacing. |
| **Front palette** | Grayscale only — the dots are the ONLY color accents allowed. |
| **Back frame** | Continuous closed rectangle. Never break into open brackets like the front. |
| **Whitespace** | Maintain 60%+ whitespace on front. Never fill dead space with decoration. |
| **Logo on front** | NEVER place a logo image on the front. The design is logo-free. |
| **Typography** | Single font family. Title Case for job title (not UPPERCASE). |
| **Bracket weight** | Hairline (1.5px). Never increase beyond 2px. |
| **Contact layout** | Dots + text only. Never add icons alongside or replacing dots. |

### Logo Treatment Config

```typescript
const frameMinimalLogoConfig: TemplateLogoConfig = {
  front: {
    technique: 'no-logo',
    source: 'initials', // Not used — front has no logo
    placement: { anchor: 'center', offsetX: 50, offsetY: 50 },
    size: { mode: 'height-percent', value: 0 },
    opacity: 0,
    overflow: 'clip',
    colorMode: 'original',
    zOrder: 'behind-all',
    blendMode: 'normal',
  },
  back: {
    technique: 'standard-small', // Optional — user CAN add logo inside frame
    source: 'auto',
    placement: { anchor: 'center', offsetX: 50, offsetY: 62 }, // below subtitle inside frame
    size: { mode: 'height-percent', value: 8 },
    opacity: 0.6,
    overflow: 'clip',
    colorMode: 'monotone',
    tintColor: '#FFFFFF',
    zOrder: 'above-all',
    blendMode: 'normal',
  },
};
```

---
---

## Template #5 — split-vertical

**Reference:** `2098fa67096a4995f92f5afb0327b376.jpg` (Pathetic Studio — Jannatten Naysen)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Architectural monochrome, bold diagonal geometry, deliberate negative space
**Font Family:** Geometric sans-serif (Montserrat / Gotham / Futura family)

### Design DNA

The defining element is a **diagonal split** — NOT a true vertical split despite the template name. A trapezoid of dark charcoal fills the left portion (front) or right portion (back), creating two asymmetric zones with a consistent ~18° diagonal. Front and back are **mirror images** — when laid flat side-by-side, the diagonals form an hourglass/X pattern. The design is **pure monochrome** (pixel-confirmed: R = G = B at every sampled point). Only 2 fill colors exist across the entire card; text uses graduated grays.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Dark charcoal | `#2C2C2C` | Diagonal trapezoid fill, back name text |
| Warm off-white | `#F5F5F0` | Light zone fill (NOT pure white — critical) |
| Pure white | `#FFFFFF` | Front text on dark zone, social icons |
| White 65% | `rgba(255,255,255,0.65)` | Front tagline |
| Dark gray | `#444444` | Back contact text |
| Medium gray | `#888888` | Back title, contact icon circles |
| Light gray 60% | `rgba(204,204,204,0.6)` | Back separator line |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░│                         │
│░░░░░░ DARK ZONE ░░░░░░░░░░│     LIGHT ZONE          │
│░░░░░░░░░░░░░░░░░░░░░░░░░│                           │
│░░░░ ▂▂▂▂▂▂ ░░░░░░░░░░░░│      (EMPTY — confirmed)  │
│░░░░ ▂▂▂▂▂ ░░░░░░░░░░░░│                            │
│░░░░ ▂▂▂▂▂▂▂ ░░░░░░░░░│  ← Logo bars (22%, 30%)    │
│░░░░ ▂▂▂▂ ░░░░░░░░░░░│                              │
│░░░░ ▂▂▂▂▂ ░░░░░░░░░│                               │
│░░░░░░░░░░░░░░░░░░░│                                 │
│░░ PATHETIC ░░░░░░│       ← Name (22%, 42%)          │
│░░ STUDIO ░░░░░░│                                    │
│░░░░░░░░░░░░░░│                                      │
│░░ your design│studio  ← Tagline (22%, 52%)          │
│░░░░░░░░░░░░│                                        │
│░░░░░░░░░░│                                          │
│░░░░░░░░│                                            │
└──────────────────────────────────────────────────────┘
 0%   10%  20%  30%  40%  50%  60%  70%  80%  90% 100%

 Diagonal: top-edge 58% → bottom-edge 38%
```

#### Background
- Fill entire canvas with `#F5F5F0` (warm off-white)

#### Dark Trapezoid
```
Path (pixel-verified):
  moveTo(0, 0)              // top-left corner
  lineTo(W × 0.58, 0)       // top edge — 58% from left
  lineTo(W × 0.38, H)       // bottom edge — 38% from left
  lineTo(0, H)              // bottom-left corner
  closePath()
Fill: #2C2C2C
```
- **Diagonal angle:** ~18° from vertical (slope 0.634 px/px, pixel-verified consistent across full height)
- The diagonal moves **leftward** as it descends — the dark zone narrows toward the bottom
- **Sharp edges only** — no rounded corners, no anti-alias blur effects, no shadows

#### Geometric Logo Mark (5 Horizontal Bars)
```
Position:    x = W × 0.22, y = H × 0.30
Orientation: Left-aligned, stacked vertically
Color:       #FFFFFF (white on dark)
Bar height:  ~1.5% of H each (≈9px at 600H), equal for all bars
Bar gap:     ~1% of H between bars (≈6px at 600H)
```

| Bar # | Width (% of W) | Width (px @ 1050W) |
|---|---|---|
| 1 (top) | 2.2% | ~23px |
| 2 | 1.8% | ~19px |
| 3 | 2.7% | ~28px |
| 4 | 1.5% | ~16px |
| 5 (bottom) | 2.0% | ~21px |

**Canvas2D:**
```js
const barWidths = [0.022, 0.018, 0.027, 0.015, 0.020];
const barH = H * 0.015;
const barGap = H * 0.01;
const bx = W * 0.22;
let by = H * 0.30;
ctx.fillStyle = "#FFFFFF";
barWidths.forEach(bw => {
  ctx.fillRect(bx, by, W * bw, barH);
  by += barH + barGap;
});
```

**Logo Treatment:** `T12` (no-logo / abstract mark replaces logo). The 5 horizontal bars ARE the logo mark — they function as a geometric brand symbol. When user has an actual logo: use `T1` (standard-small) placed at the same position, or `T2` (enlarged-watermark) as an alternative.

#### Typography — Front

| Element | Position | Font | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|---|
| Studio name | (22%, 42%) | Montserrat | 600 | 5.5% H (~33px) | 0.20em | `#FFFFFF` | UPPERCASE |
| Tagline | (22%, 52%) | Montserrat | 300 | 2.2% H (~13px) | 0.30em | `rgba(255,255,255,0.65)` | UPPERCASE |

- **All text is left-aligned** and lives entirely within the dark zone
- **Light zone is EMPTY** — pixel-confirmed: zero elements detected in the right triangle
- **Letter-spacing is critical** — without it, the text loses its architectural quality
- Text `textBaseline = "top"` for consistent positioning

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Left content margin | 22% of W |
| Logo mark Y | 30% of H |
| Logo-to-name gap | ~12% of H |
| Name Y | 42% of H |
| Tagline Y | 52% of H |
| Name-to-tagline gap | ~10% of H |
| Right side (light zone) | EMPTY |
| Bottom margin | ~25% of H (content clustered upper-middle) |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                           │░░░░░░░░░░░░░░░░░░░░░░░░░│
│   LIGHT ZONE              │░░░░ DARK ZONE ░░░░░░░░░░│
│                             │░░░░░░░░░░░░░░░░░░░░░░░│
│  ⊙ Your Address...          │░░░ Ⓕ ░░░░░░░░░░░░░░░░│
│                               │░░░░░░░░░░░░░░░░░░░░│
│  ⊙ +012 345 678              │░░░ Ⓣ ░░░░░░░░░░░░░│
│                                │░░░░░░░░░░░░░░░░░░│
│  ⊙ email@your...               │░░ Ⓘ ░░░░░░░░░░░│
│                                  │░░░░░░░░░░░░░░░│
│  ⊙ www.yourweb...                │░ Ⓓ ░░░░░░░░░│
│                                    │░░░░░░░░░░░░│
│  ⊙ Your Skype                      │░ Ⓑ ░░░░░░│
│  ─────────────                       │░░░░░░░░░│
│  Jannatten Naysen                     │░░░░░░░│
│  Graphic Designer                      │░░░░░│
│                                         │░░░│
└──────────────────────────────────────────────────────┘
 0%   10%  20%  30%  40%  50%  60%  70%  80%  90% 100%

 Diagonal: top-edge 42% → bottom-edge 62%
```

#### Background
- Fill entire canvas with `#F5F5F0` (warm off-white)

#### Dark Trapezoid (Mirror of Front)
```
Path (pixel-verified):
  moveTo(W × 0.42, 0)       // top edge — 42% from left
  lineTo(W, 0)              // top-right corner
  lineTo(W, H)              // bottom-right corner
  lineTo(W × 0.62, H)       // bottom edge — 62% from left
  closePath()
Fill: #2C2C2C
```
- **Mirror of front:** dark zone is now on the RIGHT
- **Same diagonal angle** (~18° from vertical) but flipped horizontally
- **Light zone is now on the LEFT** — functional contact information goes here

#### Contact Details — Light Zone (5 Lines)

Each contact line follows the pattern: **circle icon + text**

**Icon specification:**
```
X position:    W × 0.08 (icon center)
Diameter:      3.5% of H (≈21px at 600H)
Stroke:        #888888, 1px line width
Fill:          none (stroked outline only)
```

**Text specification:**
```
X position:    W × 0.14 (after icon + gap)
Font:          Montserrat
Weight:        400 (Regular)
Size:          2.5% of H (≈15px at 600H)
Color:         #444444 (dark gray — NOT pure black)
Letter-spacing: 0.02em
Align:         Left
textBaseline:  middle (vertically centered with icon)
```

| Line # | Icon | Placeholder Text | Y Position |
|---|---|---|---|
| 1 | Location pin | "Your Address Goes Here, Street" | 22% of H |
| 2 | Phone | "+012 345 678 910" | 30% of H |
| 3 | Email | "email@youremail.com" | 38% of H |
| 4 | Globe/Link | "www.yourwebsite.com" | 46% of H |
| 5 | Chat/Skype | "Your Skype Name" | 54% of H |

**Canvas2D for contact icons:**
```js
const iconR = H * 0.0175;
const iconCX = W * 0.08;
ctx.strokeStyle = "#888888";
ctx.lineWidth = 1;

contactYPositions.forEach(yPct => {
  ctx.beginPath();
  ctx.arc(iconCX, H * yPct, iconR, 0, Math.PI * 2);
  ctx.stroke();
  // Glyph inside circle (simplified line-art versions)
});
```

#### Separator Line
```
Position:    x = W × 0.08, y = H × 0.63
Width:       25% of W (to W × 0.33)
Height:      1px
Color:       rgba(204, 204, 204, 0.6)
```

#### Name — Below Separator
```
Position:       (8%, 68%)
Font:           Montserrat
Weight:         700 (Bold)
Size:           5% of H (≈30px at 600H)
Color:          #2C2C2C (matches dark zone — creates visual tie)
Case:           Title Case
Letter-spacing: 0.02em
Align:          Left
```

#### Title — Below Name
```
Position:       (8%, 75%)
Font:           Montserrat
Weight:         300 (Light)
Size:           2.5% of H (≈15px at 600H)
Color:          #888888 (medium gray)
Case:           Title Case
Letter-spacing: 0.12em (moderately wide)
Align:          Left
```

#### Social Media Icons — Dark Zone (5 Icons, Vertical Column)

```
X position:    W × 0.85 (centered within dark trapezoid)
Diameter:      3.5% of H (≈21px at 600H)
Stroke:        #FFFFFF, 1px line width
Fill:          none (stroked outline only)
```

| Icon # | Platform | Y Position |
|---|---|---|
| 1 | Facebook | 25% of H |
| 2 | Twitter | 33% of H |
| 3 | Instagram | 41% of H |
| 4 | Dribbble | 49% of H |
| 5 | Behance | 57% of H |

**Canvas2D:**
```js
const socialX = W * 0.85;
const socialR = H * 0.018;
ctx.strokeStyle = "#FFFFFF";
ctx.lineWidth = 1;

[0.25, 0.33, 0.41, 0.49, 0.57].forEach(yPct => {
  ctx.beginPath();
  ctx.arc(socialX, H * yPct, socialR, 0, Math.PI * 2);
  ctx.stroke();
  // Glyph inside circle (simplified line-art social icon)
});
```

#### Spacing Map — Back

| Measurement | Value |
|---|---|
| Left content margin | 8% of W |
| Contact icon center X | 8% of W |
| Contact text X | 14% of W |
| Contact start Y | 22% of H |
| Contact line spacing | 8% of H between rows |
| Separator line Y | 63% of H |
| Name Y | 68% of H |
| Title Y | 75% of H |
| Social icons X | 85% of W |
| Social icons start Y | 25% of H |
| Social icon spacing | 8% of H between icons |
| Bottom margin | ~15% of H |

---

### Logo Treatment Config

```typescript
const splitVerticalLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T12",              // no-logo — abstract geometric bars replace logo
    position: { x: 0.22, y: 0.30 },
    abstractMark: {
      type: "horizontal-bars",
      barWidths: [0.022, 0.018, 0.027, 0.015, 0.020], // % of W
      barHeight: 0.015,            // % of H
      barGap: 0.01,                // % of H
      color: "#FFFFFF",
    },
    // Fallback when user provides actual logo:
    fallbackTechnique: "T1",       // standard-small at same position
    fallbackScale: 0.08,           // 8% of W
  },
  back: {
    technique: "T12",              // no logo on back
    // Social icons column takes the back dark zone instead
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#F5F5F0"; ctx.fillRect(0, 0, W, H);
2. Dark trapezoid: beginPath → moveTo(0,0) → lineTo(W*0.58,0) →
   lineTo(W*0.38,H) → lineTo(0,H) → closePath → fill #2C2C2C
3. Logo mark: 5 white horizontal bars at (W*0.22, H*0.30), varying widths
4. "PATHETIC STUDIO": white, 600wt, 5.5%H, 0.20em tracking, at (W*0.22, H*0.42)
5. "YOUR DESIGN STUDIO HERE": rgba(255,255,255,0.65), 300wt, 2.2%H,
   0.30em tracking, at (W*0.22, H*0.52)
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#F5F5F0"; ctx.fillRect(0, 0, W, H);
2. Dark trapezoid: beginPath → moveTo(W*0.42,0) → lineTo(W,0) →
   lineTo(W,H) → lineTo(W*0.62,H) → closePath → fill #2C2C2C
3. Contact icons: 5× gray circle outlines (#888888, 1px) at x=W*0.08,
   y=[22%, 30%, 38%, 46%, 54%] of H
4. Contact text: 5× dark gray text (#444444, 400wt, 2.5%H) at x=W*0.14
5. Separator line: rgba(204,204,204,0.6), 1px, from (W*0.08, H*0.63)
   to (W*0.33, H*0.63)
6. Name "Jannatten Naysen": #2C2C2C, 700wt, 5%H at (W*0.08, H*0.68)
7. Title "Graphic Designer": #888888, 300wt, 2.5%H, 0.12em tracking
   at (W*0.08, H*0.75)
8. Social icons: 5× white circle outlines (#FFFFFF, 1px) at x=W*0.85,
   y=[25%, 33%, 41%, 49%, 57%] of H
```

#### Critical Rendering Notes
- **The diagonal MUST be a polygon path** — not a rotated rectangle or clipped element
- **Letter-spacing** is essential — 0.20em and 0.30em are defining characteristics
- **No rounded corners** anywhere — all geometry is sharp/angular
- **No shadows, no blur, no glow** — pure flat rendering
- **Icon circles are stroked only** (not filled) — 1px line weight
- **Warm off-white `#F5F5F0`** is critical — pure `#FFFFFF` changes the feel entirely
- **All front content lives in the dark zone** — light zone is CONFIRMED EMPTY
- **Front + back mirror:** together they form an X/hourglass when laid side-by-side

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutSplitVertical`, line ~790)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Split geometry | Vertical rectangle at `x = W × 0.42` | Diagonal trapezoid (58% top → 38% bottom) | Replace `fillRect` with polygon path |
| Dark zone | Straight vertical edge | ~18° diagonal slash | Completely different geometry |
| Colors | `cfg.primaryColor` (user-chosen) | Fixed `#2C2C2C` charcoal | Hard-code default theme |
| Background | None (transparent right side) | `#F5F5F0` warm off-white | Add full-canvas fill |
| Logo | `buildLogoLayer` centered on panel | 5 abstract horizontal bars at (22%, 30%) | Custom bar generation |
| Company text | Centered on left panel, below logo | "PATHETIC STUDIO" left-aligned at (22%, 42%) | Reposition, left-align, 0.20em tracking |
| Tagline | Italic, centered, 45% alpha | Uppercase, left-aligned, 65% alpha, 0.30em tracking | Complete restyle |
| Name | Right side at (48%, 18%) | BACK SIDE ONLY at (8%, 68%) | Move to back side |
| Title | Right side below name | BACK SIDE ONLY at (8%, 75%) | Move to back side |
| Contact | Right side, generic block | BACK SIDE with circle icons at (8%, 22%+) | Move to back, add icons |
| Light zone | Has name/title/contact content | COMPLETELY EMPTY | Remove all right-side content |
| Back side | Not implemented | Full mirror layout with contacts + social | Build entirely new |

**Verdict: 0% reusable — complete rewrite required for BOTH front and back.**

#### Workspace Renderer (`split-vertical`, line ~744)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Split | `fillRect(0, 0, splitX, H)` — vertical | Diagonal polygon path | Replace with `beginPath` polygon |
| Theme | `primaryColor: "#1a2332"`, `secondary: "#3d5a80"` | `#2C2C2C` + `#F5F5F0` only | Fix theme values |
| Content | Name/title/contact on RIGHT side | Right side is empty; content on FRONT dark zone only | Complete restructure |
| Logo | `drawLogo` centered | 5 horizontal bars or user logo small | Custom rendering |
| Back | None | Mirror-inverted diagonal with contacts + social | Build new |

**Verdict: 0% reusable — complete rewrite required.**

---

### AI Design Director Constraints

```yaml
template: split-vertical
constraints:
  - MUST use diagonal polygon path, NOT vertical rectangle
  - Diagonal angle MUST be ~18° from vertical (58% top → 38% bottom)
  - ONLY 2 fill colors: #2C2C2C + #F5F5F0
  - NO accent colors, NO gradients, NO patterns (pixel-verified monochrome)
  - Front light zone MUST be empty — zero elements
  - Back MUST mirror front diagonal (42% top → 62% bottom)
  - Letter-spacing on front name: exactly 0.20em
  - Letter-spacing on front tagline: exactly 0.30em
  - Contact icons: stroked circles only (1px, no fill)
  - Social icons: white stroked circles on dark zone
  - Contact/social vertical rhythm: 8% of H between rows
  - Back separator line: 25% width, 60% alpha gray
  - Name on back uses dark zone color #2C2C2C (visual tie)
  - NO shadows, NO blur, NO glow, NO rounded corners
  - Warm off-white #F5F5F0 is mandatory — NOT pure white
```

---
---

## Template #6 — diagonal-mono

**Reference:** `5ba8709cd23f697b94e7e0606be948ca.jpg` (Henry Soaz — multi-angle zigzag)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Architectural precision, angular energy, extreme monochromatic minimalism
**Font Family:** Geometric sans-serif (Montserrat / Poppins family)

### Design DNA

This is NOT a simple diagonal split — it's a **multi-angle zigzag path with 7 segments and 6 angle changes** creating a dramatic chevron/notch boundary between dark and light zones. The signature element is a chevron notch at ~20–30% height that frames the name text. The front has a large rotated name (~30–35°) as a decorative typographic element on the light side. The back features a **full-width dark band** at center housing the geometric logo, with mirror-complement light/dark zones above and below. Only 3 tonal values exist — geometry does ALL the visual heavy-lifting.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Charcoal | `#232323` | Dark polygon fills, text on light bg |
| Warm off-white | `#E2E2E2` | Light zone fills |
| Pure white | `#FFFFFF` | Text on dark bg, accent triangle, logo lines |

**Contrast ratios:**
- `#FFFFFF` on `#232323`: ~13.5:1 (exceeds WCAG AAA)
- `#232323` on `#E2E2E2`: ~8.5:1 (exceeds WCAG AAA)

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░▽│  H                               │
│░░░░░░░░░░░░░░░░░│ E  E N                            │
│░░░░░░░░░░░░░░░│  N  R Z                             │
│░░░ HENRY ░░╱│   R  Y O                              │
│░░░ SOAZ ░╱░░│   Y     A  (rotated ~30°)             │
│░░ title ╱░░░░│                                       │
│░░░░░░░░░░░░░│    ⊙ Main Street...                   │
│░░░░░░░░░░░░░│    ⊙ Number 123A...                   │
│░░░░░░░│░░░░░░│                                      │
│░░░░░░░░░░░░░░│   ⊙ hr@email.com                     │
│░░░░░░░░░░░░░░│   ⊙ +92 94 56 789                   │
│░░░░░░░░░░░░░░│   ⊙ www.company.com                  │
│░░░░░░░░░░░░░░░│                                     │
│░░░░░░░░░░░░░░░░│                                    │
│░░░░░░░░░░░░░░░░░░│                                  │
│░░░░░░░░░░░░░░░░░░░░│                                │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#E2E2E2` (warm off-white)

#### Dark Polygon — Multi-Angle Zigzag Path (7 Segments)

| Seg | From | To | Angle | Description |
|---|---|---|---|---|
| 1 | (43%, 0%) | (46%, 20%) | ~82° from horizontal | Nearly vertical, slight rightward lean |
| 2 | (46%, 20%) | (29%, 30%) | ~30° from horizontal | **Sharp chevron cut** leftward — signature element |
| 3 | (29%, 30%) | (30%, 38%) | ~83° from horizontal | Nearly vertical, narrow hold |
| 4 | (30%, 38%) | (49%, 39%) | ~5° from horizontal | Horizontal step/jump right |
| 5 | (49%, 39%) | (15%, 63%) | ~55° from horizontal | **Dramatic steep sweep** leftward |
| 6 | (15%, 63%) | (47%, 64%) | ~3° from horizontal | Sharp horizontal step right |
| 7 | (47%, 64%) | (57%, 100%) | ~74° from horizontal | Gentle rightward lean to bottom |

**Canvas2D:**
```js
ctx.beginPath();
ctx.moveTo(0, 0);                           // top-left corner
ctx.lineTo(W * 0.43, 0);                    // along top to boundary start
ctx.lineTo(W * 0.46, H * 0.20);             // Seg 1: gentle lean right
ctx.lineTo(W * 0.29, H * 0.30);             // Seg 2: sharp chevron cut left
ctx.lineTo(W * 0.30, H * 0.38);             // Seg 3: narrow hold
ctx.lineTo(W * 0.49, H * 0.39);             // Seg 4: step right
ctx.lineTo(W * 0.15, H * 0.63);             // Seg 5: steep diagonal sweep
ctx.lineTo(W * 0.47, H * 0.64);             // Seg 6: step right
ctx.lineTo(W * 0.57, H);                    // Seg 7: gentle lean to bottom
ctx.lineTo(0, H);                            // bottom-left corner
ctx.closePath();
ctx.fillStyle = "#232323";
ctx.fill();
```

#### White Accent Triangle (Top Boundary Highlight)
A thin white triangular strip (~4.5% width) runs along Segment 1, creating a luminous edge/bevel:
```
Vertices: (43%, 0%), (47.5%, 0%), (46%, 20%)
Fill: #FFFFFF at 100% opacity
```
```js
ctx.beginPath();
ctx.moveTo(W * 0.43, 0);
ctx.lineTo(W * 0.475, 0);
ctx.lineTo(W * 0.46, H * 0.20);
ctx.closePath();
ctx.fillStyle = "#FFFFFF";
ctx.fill();
```

#### Typography — Front

**Element 1: Name "HENRY SOAZ" (White on Dark)**
```
Position:       x = 29%, y = 27% (center of text block)
Bounds:         x: 29–42%, y: 22–32%
Font:           Geometric sans-serif
Weight:         700 (Bold)
Size:           10% of H (~60px at 600H)
Case:           UPPERCASE
Letter-spacing: 0.12–0.15em (wide)
Color:          #FFFFFF
Align:          Left
Context:        Precisely placed in the chevron notch where dark zone widens —
                geometry literally frames and presents the name
```

**Element 2: Title "title / position" (White on Dark)**
```
Position:       x = 31%, y = 36% (center)
Bounds:         x: 31–42%, y: 33.5–37.5%
Font:           Same geometric sans-serif
Weight:         300 (Light)
Size:           4% of H (~24px at 600H)
Case:           lowercase
Letter-spacing: Normal (0)
Color:          #FFFFFF
Align:          Left, slightly indented from name
```

**Element 3: Large Angled Name (Dark on Light — DECORATIVE)**
```
Position:       x: 48–82%, y: 10–26% (diagonal spread across light section)
Font:           Same geometric sans-serif, very large
Weight:         700 (Bold)
Size:           16% of H (~96px at 600H)
Case:           UPPERCASE
Color:          #232323 (dark on light background)
Rotation:       ~30–35° clockwise from horizontal
Context:        Decorative typographic impact — echoes the card's angular theme
```
**Canvas2D:**
```js
ctx.save();
ctx.translate(W * 0.50, H * 0.26);
ctx.rotate((32 * Math.PI) / 180);          // ~32° clockwise
ctx.font = "700 " + Math.round(H * 0.16) + "px 'Montserrat', sans-serif";
ctx.fillStyle = "#232323";
ctx.textBaseline = "bottom";
ctx.fillText("HENRY SOAZ", 0, 0);
ctx.restore();
```

**Element 4: Contact Information Block (Dark on Light)**
```
Start X:        50% from left
Y positions:    40%, 44%, 54%, 59%, 64% of H
Font:           Same geometric sans-serif
Weight:         400 (Regular)
Size:           2.5% of H (~15px at 600H)
Color:          #232323
Case:           Mixed (Title Case addresses, lowercase email/web)
Align:          Left
Line spacing:   ~4–5% of H between lines
```

| Line | Content | Y Position |
|---|---|---|
| Address 1 | "Main Street, Your Loc." | 40% |
| Address 2 | "Number 123A, 56478" | 44% |
| Email | "hr@email.com" | 54% |
| Phone | "+92 94 56 789" | 59% |
| Website | "www.company.com" | 64% |

**Element 5: Contact Icons (Along Boundary Zone)**
```
Position X:     45–48% of W (on light side near boundary)
Y positions:    Aligned with each contact line (40%, 54%, 59%, 64%)
Size:           3% of H each (~18px)
Color:          #232323
Style:          1px thin-line stroke icons (location pin, envelope, phone, globe)
```

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Left margin (dark section) | ~8% from card left |
| Name text left edge | 29% from left (aligns with chevron notch) |
| Title text left edge | 31% from left (slightly indented) |
| Contact text left edge | 50% from left |
| Name-to-title gap | ~2% of H |
| Title-to-contact gap | ~3% of H |
| Inter-contact-line gap | ~4–5% of H |
| Right margin (light section) | ~18% from right edge |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│ LIGHT ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ DARK ░░░│
│  zone  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│   (35%) ╲░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│          ╲░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│           ╲░ DARK COLLAPSES TO FULL WIDTH ░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░ FULL DARK BAND ░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░  ╳ GEOMETRIC LOGO  COMPANY ░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░╱           │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░╱  LIGHT       │
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░╱     zone         │
│░░░░ DARK ░░░░░░░░░░░░░░░░░░░╱        (35%)          │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#E2E2E2` (warm off-white base)

#### Dark Polygon — Complex 5-Zone Structure

**Zone 1 — Top split (y: 0–28%):** Light-left (~35%), Dark-right (~65%)
**Zone 2 — Steep diagonal collapse (y: 28–46%):** Light rapidly shrinks to 0%
**Zone 3 — Full dark band (y: 46–72%):** ENTIRE width is dark — logo lives here
**Zone 4 — Steep diagonal emergence (y: 65–72%):** Light reappears on RIGHT
**Zone 5 — Bottom split (y: 72–100%):** Dark-left (~62–65%), Light-right (~35–38%)

**Canvas2D (fill light first, then dark polygon on top):**
```js
// Light base already drawn
ctx.beginPath();
ctx.moveTo(W * 0.35, 0);                    // top split boundary
ctx.lineTo(W, 0);                            // top-right corner
ctx.lineTo(W, H * 0.65);                    // right edge to emergence point
ctx.lineTo(W * 0.62, H * 0.72);             // diagonal in to bottom split
ctx.lineTo(W * 0.65, H);                    // gentle lean to bottom
ctx.lineTo(0, H);                            // bottom-left corner
ctx.lineTo(0, H * 0.46);                    // left edge up to collapse end
ctx.lineTo(W * 0.38, H * 0.28);             // steep diagonal to top split
ctx.closePath();
ctx.fillStyle = "#232323";
ctx.fill();
```

#### Geometric Logo — Abstract X/Cross Mark
Located centered in the full-dark band:
```
Overall bounds:  x: 35–67%, y: 48–65%
Center point:    ~(50%, 57%)
Footprint:       ~32% of W × ~17% of H
```

**Line A:** From ~(50%, 48%) diagonally to ~(35%, 61%) — white, ~1% W stroke width
**Line B:** From ~(67%, 50%) diagonally to ~(46%, 65%) — white, ~1% W stroke width
**Intersection:** ~(50%, 55%)
**Satellite marks:** Small accent dots at ~(50–51%, 53%) and ~(59–60%, 53–54%)

```js
ctx.strokeStyle = "#FFFFFF";
ctx.lineWidth = W * 0.01;
ctx.lineCap = "round";

// Line A
ctx.beginPath();
ctx.moveTo(W * 0.50, H * 0.48);
ctx.lineTo(W * 0.35, H * 0.61);
ctx.stroke();

// Line B
ctx.beginPath();
ctx.moveTo(W * 0.67, H * 0.50);
ctx.lineTo(W * 0.46, H * 0.65);
ctx.stroke();

// Satellite marks
ctx.fillStyle = "#FFFFFF";
ctx.beginPath();
ctx.arc(W * 0.505, H * 0.53, W * 0.004, 0, Math.PI * 2);
ctx.fill();
ctx.beginPath();
ctx.arc(W * 0.595, H * 0.535, W * 0.004, 0, Math.PI * 2);
ctx.fill();
```

**Logo Treatment:** `T8` (primary-hero) — the geometric X/cross mark IS the brand identity, rendered large in the full-dark band. When user has an actual logo: use `T2` (enlarged-watermark) at same position, scaled to ~17% H, white on dark.

#### Typography — Back

**"COMPANY" text:**
```
Position:       x: 55–65%, y: 55–60% (right of logo center)
Font:           Same geometric sans-serif
Weight:         700 (Bold)
Size:           4% of H (~24px at 600H)
Case:           UPPERCASE
Letter-spacing: 0.15em (wide)
Color:          #FFFFFF
Align:          Left, horizontally aligned with right portion of logo
```

#### Spacing Map — Back

| Measurement | Value |
|---|---|
| Top light panel | 0–35% width, 0–28% height |
| Collapse diagonal | 38% → 0% over y: 28–46% |
| Full dark band | 0–100% width, y: 46–72% |
| Logo center | (50%, 57%) |
| "COMPANY" text | x: 55%, y: 57% |
| Emergence diagonal | 100% → 62% over y: 65–72% |
| Bottom light panel | 62–100% width, 72–100% height |

---

### Logo Treatment Config

```typescript
const diagonalMonoLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T12",              // no logo on front — name IS the identity
    // The large rotated name serves as the visual focal point
  },
  back: {
    technique: "T8",               // primary-hero — logo dominates dark band
    position: { x: 0.35, y: 0.48 },
    size: { w: 0.32, h: 0.17 },
    color: "#FFFFFF",
    abstractMark: {
      type: "geometric-x",         // abstract cross/X from two intersecting lines
      lineWidth: 0.01,             // 1% of W
      satelliteMarks: true,
    },
    // Fallback when user provides actual logo:
    fallbackTechnique: "T2",       // enlarged-watermark centered in dark band
    fallbackScale: 0.17,           // 17% of H
    fallbackColor: "#FFFFFF",
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#E2E2E2"; ctx.fillRect(0, 0, W, H);
2. Dark zigzag polygon: 10-vertex path with 7 segments → fill #232323
3. White accent triangle: (43%,0%), (47.5%,0%), (46%,20%) → fill #FFFFFF
4. Large rotated name: save → translate(50%,26%) → rotate(32°) →
   "HENRY SOAZ" #232323 700wt 16%H → restore
5. Name "HENRY SOAZ": white, 700wt, 10%H, 0.12em tracking, at (29%, 27%)
6. Title "title / position": white, 300wt, 4%H, at (31%, 36%)
7. Contact icons: 4× dark thin-line icons at x=45–48%, aligned with text
8. Contact text: 5 lines dark #232323, 400wt, 2.5%H, starting at x=50%
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#E2E2E2"; ctx.fillRect(0, 0, W, H);
2. Dark polygon: 8-vertex path (top-split → collapse → full-band →
   emergence → bottom-split) → fill #232323
3. Geometric logo: 2× white lines (1%W stroke) forming X/cross
   at center (50%, 57%), plus 2 satellite dots
4. "COMPANY": white, 700wt, 4%H, 0.15em tracking, at (55%, 57%)
```

#### Critical Rendering Notes
- **All diagonal edges MUST be razor-sharp** — no rounded corners, no blur
- **7-segment zigzag** is the card's identity — each angle change is precise
- **White accent triangle** along Segment 1 is subtle but critical for depth
- **Large rotated name** requires `ctx.save()/rotate()/restore()` — ~32° CW
- **Geometric logo** is thin-line work (~1% W strokes) — precision critical
- **Contact icons** are simple path-based line-art, not font glyphs
- **Use `textBaseline = 'top'`** for consistent positioning
- **Pure monochromatic** — only `#232323`, `#E2E2E2`, `#FFFFFF`
- **Front dark zone varies wildly** — from ~15% to ~57% width across the card

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutDiagonalMono`, line ~837)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Dark zone | Simple `fillRect(0, 0, W*0.55, H)` — vertical rectangle | 7-segment zigzag polygon with chevron notch | Complete path rewrite |
| Separator | `line()` at W*0.3 — simple horizontal | No straight separator — zigzag IS the boundary | Remove separator |
| Colors | `cfg.primaryColor` (user-chosen) | Fixed `#232323` charcoal | Hard-code default theme |
| Background | None specified | `#E2E2E2` warm off-white | Add canvas fill |
| Name | At (10%, 15%) left-aligned | At (29%, 27%) in chevron notch | Reposition to notch |
| Title | Below name, weight 300 | At (31%, 36%), lowercase | Adjust position |
| Large rotated name | **Not implemented** | 16%H bold, ~32° CW rotation on light side | Add entirely new element |
| White accent triangle | **Not implemented** | (43%,0%) → (47.5%,0%) → (46%,20%) | Add new element |
| Contact | Right side generic block | 5 lines at x=50%, y=40–64% with icons | Restyle completely |
| Company | Bottom-right, small | Not on front — "COMPANY" is on back dark band | Move to back |
| Logo | Bottom-left, generic `buildLogoLayer` | Not on front — geometric X/cross on back | Move to back, redesign |
| Back side | **Not implemented** | Complex 5-zone dark polygon + geometric logo | Build entirely new |

**Verdict: 0% reusable — complete rewrite required.**

#### Workspace Renderer (`diagonal-mono`, line ~780)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Dark zone | `fillRect(0, 0, W*0.55, H)` — vertical | 7-segment zigzag polygon | Replace with `beginPath` |
| Content layout | Name/title/contact spread | Name in notch, rotated name, contacts in light | Complete restructure |
| Rotated text | Not implemented | 32° CW rotated name on light background | Add `save/rotate/restore` |
| Accent triangle | Not implemented | White triangle on Segment 1 | Add new drawing |
| Back | Not implemented | 5-zone polygon + X logo + "COMPANY" | Build new |

**Verdict: 0% reusable — complete rewrite required.**

---

### AI Design Director Constraints

```yaml
template: diagonal-mono
constraints:
  - MUST use 7-segment zigzag polygon, NOT a simple rectangle or single diagonal
  - Chevron notch at y=20-30% is the SIGNATURE element — name MUST sit in it
  - White accent triangle along Segment 1 is required for depth
  - Large rotated name (~32° CW) on light side is required decorative element
  - ONLY 3 colors: #232323, #E2E2E2, #FFFFFF — zero accent colors
  - Back has 5-zone structure: split → collapse → full-dark → emergence → split
  - Full-dark band (y: 46-72%) houses geometric logo — SOLE focus area
  - Geometric logo is thin-line X/cross (~1% W strokes), NOT solid shapes
  - All angles (~30° and ~55°) repeat across front chevron, steep sweep, back diagonals
  - NO shadows, NO blur, NO gradients, NO rounded corners
  - Contact icons: thin-line stroke art, NOT font glyphs
  - Contact text left edge at exactly 50% from left
  - Name positioned precisely in chevron notch (29%, 27%)
```

---

---

## Template #7 — cyan-tech

**Reference:** `0ee9d22976cfb37b987ad0682db26ed8.jpg` (Code Pro Development — Michal Johns)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Tech-modern, professional development, bold cyan accent on dark
**Font Family:** Geometric sans-serif (Montserrat / Poppins / DIN family)

### Design DNA

Dark charcoal base (`#1E1E1E`) with a dramatic **organic double-lobe S-curve wave** in cyan (`#2DB5E5`) sweeping from the right edge across ~30–35% of the front card surface. The wave is NOT a simple arc — it has two distinct lobes with a sharp inflection/pinch at ~57–58% height. Front features a gear/code icon + brand name in the dark "safe zone" left of the wave. Back mirrors the wave from the LEFT side, with contact info, QR code, and triangle logo mark in the right dark zone. Single accent hue (cyan) on monochromatic dark creates maximum visual impact.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Dark charcoal | `#1E1E1E` | Card background both sides |
| Primary cyan | `#2DB5E5` | Wave fill (single flat, or subtle gradient center) |
| Cyan bright | `#2FBBEC` | Optional gradient highlight center |
| Cyan dark edge | `#22A8DD` | Optional gradient edge/boundary |
| Off-white | `#D6D6D6` | Text on dark bg, gear icon, front text |
| Pure white | `#FFFFFF` | Text on cyan bg, back side text, QR bg, triangle mark |
| Black | `#000000` | QR code modules |

**Simplified Canvas2D palette (5 colors):**
1. `#1E1E1E` — Card background
2. `#2DB5E5` — Cyan wave fill
3. `#FFFFFF` — Primary text (on cyan + back side)
4. `#D6D6D6` — Secondary text (on dark bg + icon)
5. `#000000` — QR modules

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ⚙ GEAR ICON  (31%, 30%)                            │
│  CODE PRO     (31%, 35%)           ╭── cyan #2DB5E5──│ 36%
│  DEVELOPMENT  (31%, 38%)       ╭───╯                 │
│                            ╭───╯                     │
│                        ╭───╯                         │ 54% apex
│                        │   ╭──── 2nd lobe ───────────│ 58%
│                        ╰───╯                         │ 64%
│                            ╰────────────────────────-│
│  info@codepro.com (on cyan)                          │ 85%
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#1E1E1E` (dark charcoal, uniform, no gradient)

#### Cyan Wave — Organic Double-Lobe S-Curve

The wave enters from the **right edge** at ~36% height, sweeps left to its deepest reach at ~41% from left (at 54% height), kicks back right sharply, forms a second shallower lobe reaching ~53% from left (at 64% height), then exits back out the right edge at ~88% height. The wave fills from its left boundary to the right card edge.

**Key boundary points (left edge of wave):**

| Y (% of H) | X (% of W) | Note |
|---|---|---|
| 36% | 98% | Wave enters from right edge |
| 40% | 76% | Curving inward |
| 46% | 62% | First inflection approach |
| 50% | 53% | Sharp leftward dive |
| **54%** | **41%** | **LEFTMOST REACH — wave apex** |
| 56% | 41% | Holding left |
| **58%** | **75%** | **SHARP KICKBACK RIGHT — pinch point** |
| 62% | 56% | Second lobe deepening |
| **64%** | **53%** | **Second lobe leftmost** |
| 68% | 55% | Retreating right |
| 74% | 66% | Approaching edge |
| 82% | 81% | Nearly off card |
| 88% | 91% | Wave exits right edge |

**Canvas2D Bezier Path:**
```js
ctx.beginPath();
ctx.moveTo(W, H * 0.36);                            // Start: right edge, 36% down

// Lobe 1: sweep left to leftmost point
ctx.bezierCurveTo(
  W * 0.70, H * 0.40,                               // CP1
  W * 0.50, H * 0.46,                               // CP2
  W * 0.41, H * 0.54                                // End: leftmost point
);

// Lobe 2: sharp right kick then sweep left again
ctx.bezierCurveTo(
  W * 0.60, H * 0.58,                               // CP1: sharp right kick
  W * 0.50, H * 0.62,                               // CP2
  W * 0.53, H * 0.64                                // End: second lobe apex
);

// Exit: sweep back right off card
ctx.bezierCurveTo(
  W * 0.60, H * 0.68,                               // CP1
  W * 0.80, H * 0.80,                               // CP2
  W, H * 0.88                                       // End: exit right edge
);

// Close along right and top edges
ctx.lineTo(W, H * 0.36);
ctx.closePath();
ctx.fillStyle = "#2DB5E5";
ctx.fill();
```

#### Gear Logo Icon
```
Type:       Stylized gear/cog with code brackets (< >) inside
Position:   centered at x = 31%, y = 30%
Size:       ~10% of W
Color:      #D6D6D6 (off-white, line art / outline style)
Style:      Stroke, not filled — circular core with 6–8 teeth
```

#### Typography — Front

| Element | Position | Font | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|---|
| Company "CODE PRO" | (31%, 35%) | Montserrat | 500 (Medium) | 3.5% H (~21px) | 0.10em | `#D6D6D6` | UPPERCASE |
| Tagline "DEVELOPMENT" | (31%, 38%) | Montserrat | 300 (Light) | 2.0% H (~12px) | 0.20–0.30em | `#D6D6D6` | UPPERCASE |
| Email | (15%, 85%) | Montserrat | 400 (Regular) | 2.2% H (~13px) | Normal | `#FFFFFF` | lowercase |

- Company name positioned directly below gear icon
- Email sits **ON the cyan wave area** (at 85% height, wave covers this region)
- All text left-aligned at x = 31% (icon, company, tagline)

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Left margin | 15% from card edge |
| Top margin | 28% to first element |
| Gear icon center | (31%, 30%) |
| Icon-to-company gap | ~3% of H |
| Company-to-tagline gap | ~2% of H |
| All text left edge | 31% from left |
| Email position | (15%, 85%) — on cyan |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│ CYAN WAVE ─╮                                         │
│            │                                         │
│        ╭───╯                                         │
│    ╭───╯                                             │
│   ╰──╮              MICHAL JOHNS (55%, 45%)          │
│      │                                               │
│      ╰───╮           ⊙ phone      (55%, 50%)        │
│          │           ⊙ email      (55%, 53%)        │
│      ╭───╯           ⊙ website    (55%, 56%)        │
│   ╭──╯               ⊙ address   (55%, 59%)        │
│   │                                                  │
│   ╰──╮          ▽ TRIANGLE   ▦ QR CODE              │
│      │          (48%, 72%)   (55%, 72%)              │
│      ╰───                                            │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#1E1E1E` (same as front)

#### Cyan Wave — Mirrored (Enters from LEFT)
The back wave is a **mirror complement**: enters from the LEFT edge, sweeps right, creating visual pairing with the front. Same cyan `#2DB5E5`.

**Key boundary points (right edge of wave, back side):**

| Y (% of H) | Right Edge X (% of W) | Note |
|---|---|---|
| 33% | 31% | Wave enters from left |
| 40% | 25% | ~25% band width |
| 44% | 5% | Nearly exits — very narrow |
| 52% | 24% | Small reappearance |
| 58% | 18% | Second lobe growing |
| **70%** | **34%** | **Widest reach** |
| 80% | 20% | Shrinking |
| 86% | 2% | Wave exits left edge |

**Canvas2D (mirror of front Bezier, entering from left):**
```js
ctx.beginPath();
ctx.moveTo(0, H * 0.33);                            // Start: left edge

// Lobe 1: sweep right, narrow, retreat
ctx.bezierCurveTo(
  W * 0.20, H * 0.36,
  W * 0.32, H * 0.38,
  W * 0.31, H * 0.40
);
ctx.bezierCurveTo(
  W * 0.20, H * 0.42,
  W * 0.05, H * 0.44,
  W * 0.05, H * 0.48
);

// Pinch and second lobe
ctx.bezierCurveTo(
  W * 0.15, H * 0.52,
  W * 0.18, H * 0.58,
  W * 0.25, H * 0.62
);
ctx.bezierCurveTo(
  W * 0.34, H * 0.68,
  W * 0.34, H * 0.70,
  W * 0.30, H * 0.75
);

// Exit back to left edge
ctx.bezierCurveTo(
  W * 0.20, H * 0.80,
  W * 0.02, H * 0.86,
  0, H * 0.88
);

ctx.lineTo(0, H * 0.33);
ctx.closePath();
ctx.fillStyle = "#2DB5E5";
ctx.fill();
```

#### Typography — Back

**Name "MICHAL JOHNS":**
```
Position:       x = 55%, y = 45%
Font:           Montserrat
Weight:         700 (Bold)
Size:           4% of H (~24px at 600H)
Case:           UPPERCASE
Letter-spacing: Normal (0)
Color:          #FFFFFF
Align:          Left
```

**Contact Information (4 lines):**
```
Start X:        55% from left
Icon X:         52% from left
Font:           Montserrat, 400 (Regular)
Size:           2.5% of H (~15px at 600H)
Color:          #FFFFFF
Case:           Mixed (lowercase email/web, normal phone)
Line spacing:   ~3% of H between items
```

| Line | Content | Y Position |
|---|---|---|
| Phone | "+92 94 56 789" | 50% |
| Email | "info@codepro.com" | 53% |
| Website | "www.company.com" | 56% |
| Address | "Main Street, Your Location" | 59% |

**Contact Icons:**
```
Position X:     52% from left
Size:           ~2% of W each
Color:          #FFFFFF
Style:          Small circular/minimal line-art (phone, envelope, globe, location pin)
Vertically aligned with each contact line
```

#### White Triangle Logo Mark
```
Shape:      Isosceles triangle pointing DOWNWARD (▽)
Position:   x = 48%, y = 72–80%
Width:      ~18% of W at top edge
Height:     ~8% of H
Color:      #FFFFFF (solid fill)
Function:   Stylized brand icon / "CODE PRO" mark
```
```js
ctx.beginPath();
ctx.moveTo(W * 0.39, H * 0.72);             // top-left
ctx.lineTo(W * 0.57, H * 0.72);             // top-right
ctx.lineTo(W * 0.48, H * 0.80);             // bottom point
ctx.closePath();
ctx.fillStyle = "#FFFFFF";
ctx.fill();
```

#### QR Code
```
Position:   x = 55%, y = 72%
Size:       ~15% of W × 15% of H
Background: #FFFFFF (white pad)
Modules:    #000000 (black)
Adjacent to triangle mark (right side)
```

#### Spacing Map — Back

| Measurement | Value |
|---|---|
| Left margin (content) | 48% from card edge |
| Name Y | 45% from top |
| Name-to-contacts gap | ~5% of H |
| Contact start Y | 50% |
| Contact line spacing | ~3% of H |
| QR + Triangle Y | 72% from top |
| Content icons X | 52% from left |
| Content text X | 55% from left |

---

### Logo Treatment Config

```typescript
const cyanTechLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T1",               // standard-small — gear icon at (31%, 30%)
    position: { x: 0.31, y: 0.30 },
    size: 0.10,                    // 10% of W
    color: "#D6D6D6",
    style: "outline",              // line-art stroke, not filled
    abstractMark: {
      type: "gear-code",           // gear/cog with code brackets
      teeth: 8,
      innerSymbol: "< >",
    },
    // When user has logo: replace gear with actual logo at same position
    fallbackTechnique: "T1",
  },
  back: {
    technique: "T9",               // icon-wordmark-separated — triangle mark + "CODE PRO"
    position: { x: 0.48, y: 0.72 },
    size: { w: 0.18, h: 0.08 },
    color: "#FFFFFF",
    shape: "triangle-down",
    // When user has logo: use actual logo at same position
    fallbackTechnique: "T1",
    fallbackScale: 0.08,
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#1E1E1E"; ctx.fillRect(0, 0, W, H);
2. Cyan wave: bezier S-curve path (3 bezier segments + close) → fill #2DB5E5
3. Gear icon: line art at (31%, 30%) → stroke #D6D6D6
4. "CODE PRO": #D6D6D6, 500wt, 3.5%H, 0.10em tracking, at (31%, 35%)
5. "DEVELOPMENT": #D6D6D6, 300wt, 2.0%H, 0.20–0.30em tracking, at (31%, 38%)
6. "info@codepro.com": #FFFFFF, 400wt, 2.2%H, at (15%, 85%) — sits on cyan
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#1E1E1E"; ctx.fillRect(0, 0, W, H);
2. Mirrored cyan wave: bezier path entering from LEFT → fill #2DB5E5
3. "MICHAL JOHNS": #FFFFFF, 700wt, 4%H, at (55%, 45%)
4. Contact icons: 4× white icons at x=52%, y=[50%, 53%, 56%, 59%]
5. Contact text: 4× white text at x=55%, y=[50%, 53%, 56%, 59%]
6. White triangle: downward-pointing at (48%, 72%) → fill #FFFFFF
7. QR code: black modules on white pad at (55%, 72%)
```

#### Critical Rendering Notes
- **Wave is a double-lobe S-curve** — NOT a simple arc or sine wave
- **Sharp inflection at y=57–58%** is critical — wave kicks right then sweeps left again
- **Wave fills from left boundary to right card edge** (not a stroke — a filled shape)
- **Dark background is uniform `#1E1E1E`** — no gradient
- **Off-white text `#D6D6D6`** on dark bg — NOT pure white (subtly warmer)
- **Pure white `#FFFFFF`** only used on cyan bg and on back side
- **Front–back mirroring**: wave enters RIGHT on front, LEFT on back
- **Gear icon is line-art** (stroked, not filled) — precise thin-line work
- **Wave occupies ~30–35% of front surface** — enough to dominate without overwhelming text

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutCyanTech`, line ~880)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Accent shape | `fillRect` — simple rectangle panel at right 38% | Organic double-lobe S-curve wave | Replace with bezier path |
| Wave curve | `ellipse` cutout overlay — single oval | 7-point bezier with 2 lobes + sharp inflection | Complete wave rebuild |
| Background | `cfg.bgColor` (user-chosen) | Fixed `#1E1E1E` dark charcoal | Hard-code default theme |
| Wave color | `cfg.primaryColor` → `cfg.secondaryColor` gradient | Flat `#2DB5E5` cyan (or subtle radial) | Simplify to single color |
| Logo | `buildLogoLayer` generic left side | Gear/cog line-art icon at (31%, 30%) | Custom gear drawing |
| Company | Right of logo, weight 700 | Below icon, weight 500, 0.10em tracking | Reposition, adjust style |
| Tagline | Below company, italic | Below company, NOT italic, 0.20–0.30em tracking | Restyle |
| Name | On right panel | BACK SIDE ONLY at (55%, 45%) | Move to back |
| Title | On right panel below name | Not on front — back side only | Move to back |
| Contact | On right panel block | BACK SIDE at (55%, 50%+) with icons | Move to back |
| Email on front | Website at bottom-left | Email at (15%, 85%) ON the cyan wave | Reposition to wave zone |
| Triangle mark | **Not implemented** | White downward triangle at (48%, 72%) on back | Add new element |
| QR code | **Not implemented** | At (55%, 72%) on back | Add QR rendering |
| Back side | **Not implemented** | Mirrored wave + name + contacts + QR + triangle | Build entirely new |

**Verdict: ~5% reusable (dark bg concept only) — near-complete rewrite required.**

#### Workspace Renderer (`cyan-tech`, line ~811)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Accent panel | `fillRect(px, 0, pw, H)` + linear gradient | Organic bezier wave | Replace with bezier path |
| Theme | `primary: "#00bcd4"`, `bg: "#0d1117"` | `#2DB5E5` wave, `#1E1E1E` bg | Update theme values |
| Content layout | Split: logo/company left, name/contact on panel | Icon/company/tagline left of wave, email on wave | Complete restructure |
| Back | Not implemented | Mirror wave + contacts + QR + triangle | Build new |

**Verdict: ~5% reusable — near-complete rewrite required.**

---

### AI Design Director Constraints

```yaml
template: cyan-tech
constraints:
  - MUST use organic double-lobe S-curve wave, NOT a simple rectangle or single arc
  - Wave has sharp inflection/pinch at y=57-58% — defining characteristic
  - Wave fills from left boundary to right card edge (filled shape, not stroke)
  - Dark background is uniform #1E1E1E — no gradient
  - Off-white text #D6D6D6 on dark bg — NOT pure white
  - Pure white #FFFFFF only on cyan bg and back side
  - Front: gear icon + company + tagline LEFT of wave, email ON the wave
  - Back: mirrored wave from LEFT, content in RIGHT dark zone
  - Back includes downward triangle mark + QR code at y=72%
  - Single accent hue (cyan #2DB5E5) — no additional accent colors
  - Contact icons: small white circles/minimal line-art
  - Wave occupies ~30-35% of front card surface
  - Front-back wave mirroring creates bilateral symmetry when viewed together
```

---

---

## Template #8 — corporate-chevron

**Reference:** `1cf439f4c957d449e8af25f30a7942dd.jpg` (Company — Jonathan Doe)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Corporate sophistication, structured angular minimalism, bas-relief depth
**Font Family:** Geometric sans-serif (Montserrat / Poppins / Raleway family)

### Design DNA

The signature element is a **triple-layer chevron/V-shape system** on the front left ~50%, creating a bas-relief depth effect through 3 brightness zones (base → dark overlay → light overlay). Two stacked V-shapes point RIGHT ("›"), funneling the eye toward the company name on the right. The back mirrors this with subtle chevrons on the RIGHT pointing LEFT ("‹"). The palette is monochromatic navy-gray (hue 210–220°, saturation 10–20%) — zero accent colors. Front is dark-on-dark with white text; back is light with dark text — complementary inversion.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Dark base | `#1E2633` | 30, 37, 51 | Front card background |
| Light chevron | `#324154` | 50, 65, 84 | Front chevron highlight bands (~30% white overlay feel) |
| Dark chevron | `#1A202A` | 26, 32, 42 | Front chevron shadow bands (~15% black overlay feel) |
| Text white | `#C8CBD0` | 200, 203, 208 | Front company name (soft off-white, blue-gray cast) |
| Text muted | `#8090A0` | 128, 144, 160 | Front tagline (~40% contrast) |
| Text gray | `#888E99` | 136, 142, 153 | Front website URL |
| Light base | `#EFEFEF` | 239, 239, 239 | Back card background |
| Back chevron | `#DDDDDD` | 221, 221, 221 | Back chevron bands (~8% gray overlay, whisper-level) |
| Text dark | `#444648` | 68, 70, 72 | Back name, logo mark |
| Text mid-gray | `#8C8C8C` | 140, 140, 140 | Back job title |
| Text blue-gray | `#727780` | 114, 119, 128 | Back contact info |
| Text near-black | `#1C1C1E` | 28, 28, 30 | Back company branding |
| Icon color | `#4D5562` | 77, 85, 98 | Contact icons (monochromatic navy-gray) |

---

### FRONT SIDE

#### Layout Diagram
```
 0%          22%          50%    56%               89% 100%
 ┌───────────┬────────────┬──────┬─────────────────┬───┐
 │╲ LIGHT     │            │      │                 │   │ 5%
 │ ╲ CHEVRON  │ DARK       │      │                 │   │
 │  ╲ V1      │ CHEVRON    │      │                 │   │
 │   ╲(12%w)  │ (~10%w)    │      │                 │   │
 │    ╲ vtx   │    ╱       │      │                 │   │ 40%
 │     ╲──────│──╱─────────│      │                 │   │
 │ vtx  ╲     │ ╱          │      │ COMPANY         │   │ 46%
 │       ╲    │╱           │      │ Your tagline    │   │ 53%
 │  ╱─────╲───╱            │      │                 │   │
 │ ╱ LIGHT ╲               │      │                 │   │
 │╱ CHEVRON ╲              │      │                 │   │ 70%
 │  V2(12%w) ╲             │      │                 │   │ 78%
 │            ╲            │      │ yourwebsite.com │   │ 88%
 └─────────────╲───────────┴──────┴─────────────────┴───┘ 100%
```

#### Background
- Fill entire canvas with `#1E2633` (dark desaturated navy, flat, no gradient)

#### Chevron System — Three Layers (Bottom to Top)

**Layer 1 — Dark Chevron Bands (`#1A202A`)**
Band width: ~10% of W, angle ~43° from horizontal

*Dark V1 (upper):*
```
Top arm: starts ~(46%, 10%), vertex ~(23%, 54%)
Bottom arm mirrors from vertex
```

*Dark V2 (lower):*
```
Traces from ~(46%, 54%) to ~(23%, 92%)
```

**Layer 2 — Light Chevron Bands (`#324154`)**
Band width: ~12% of W, angle ~43° from horizontal

*Light V1 (upper):*
```
Top arm: starts at (0%, 5%)
Vertex: at (22%, 40%)
Bottom arm: returns to (0%, 43%)
Band width maintained at 12% throughout
```

*Light V2 (lower):*
```
Top arm: starts at (0%, 43%)
Vertex: at (22%, 78%)
Bottom arm: to (18%, 95%)
```

**Canvas2D — Chevron Drawing Helper:**
```js
function drawChevronV(ctx, W, H, tipX, tipY, vtxX, vtxY, bandW, color) {
  ctx.fillStyle = color;
  // Top arm
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX + bandW, tipY);
  ctx.lineTo(vtxX + bandW, vtxY);
  ctx.lineTo(vtxX, vtxY);
  ctx.closePath();
  ctx.fill();
  // Bottom arm (mirror)
  ctx.beginPath();
  ctx.moveTo(vtxX, vtxY);
  ctx.lineTo(vtxX + bandW, vtxY);
  ctx.lineTo(tipX + bandW, tipY + 2 * (vtxY - tipY));
  ctx.lineTo(tipX, tipY + 2 * (vtxY - tipY));
  ctx.closePath();
  ctx.fill();
}

// Light V1
drawChevronV(ctx, W, H, 0, H*0.05, W*0.22, H*0.40, W*0.12, "#324154");
// Light V2
drawChevronV(ctx, W, H, 0, H*0.43, W*0.22, H*0.78, W*0.12, "#324154");
// Dark V1 (offset right)
drawChevronV(ctx, W, H, W*0.46, H*0.10, W*0.23, H*0.54, -W*0.10, "#1A202A");
```

**Layering order:**
1. `#1E2633` base fill (entire card)
2. `#1A202A` dark chevron bands
3. `#324154` light chevron bands
4. Text elements on top

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Company "COMPANY" | (56%, 46%) | 700 (Bold) | 11.4% H (~68px) | 0.15em | `#C8CBD0` | UPPERCASE |
| Tagline | (56%, 53%) | 300 (Light) | 4.3% H (~26px) | 0.02em | `#8090A0` | Sentence case |
| Website | (60%, 88%) | 400 (Regular) | 2.7% H (~16px) | 0.05em | `#888E99` | lowercase |

- All text left-aligned in right half zone (56%–89%)
- Generous gap between chevron zone (0–22%) and text zone (56%+) — **~34% breathing room**
- Company name at ~46% from top (slightly above optical center)

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Chevron zone | left 0%–22% of W |
| Text zone | right 56%–89% of W |
| Dead zone (gap) | 22%–56% — pure base color |
| Company Y | 46% |
| Tagline Y | 53% |
| Company-to-tagline gap | ~7% of H |
| Website Y | 88% (pushed to bottom) |

---

### BACK SIDE

#### Layout Diagram
```
 0%  7%                    40%         60%              77%   95% 100%
 ┌──┬──────────────────────┬───────────┬────────────────┬──────┬───┐
 │  │ JONATHAN DOE         │           │                │  ╱ C │   │ 23%
 │  │ Graphic Designer     │           │                │ ╱  H │   │ 30%
 │  │                      │           │               ╱ E   │   │
 │  │                      │           │              ╱  V1  │   │ 46%
 │  │ ▲ (logo mark)        │           │             ╲      │   │ 51%
 │  │ [i] phone            │           │ COMPANY      ╲     │   │ 57%
 │  │ [i] email            │           │               ╲    │   │ 67%
 │  │ [i] address          │           │                ╲V2 │   │ 77%
 │  │ [i] website          │           │                 ╲  │   │ 87%
 └──┴──────────────────────┴───────────┴────────────────┴─────┴───┘
```

#### Background
- Fill entire canvas with `#EFEFEF` (warm near-white, flat, no gradient)

#### Chevron — Mirrored (Right Side, Pointing Left)
```
Color:      #DDDDDD (~8% gray overlay on white — whisper-level subtle)
Band width: ~12% of W (matching front exactly)
Position:   Right 23% of card (from x=77% to x=100%)
Angle:      Same ~43° but mirrored — pointing LEFT

Back V1: tip ~(95%, 10%), vertex ~(77%, 46%), bottom ~(95%, 51%)
Back V2: tip ~(93%, 51%), vertex ~(77%, 87%), bottom ~(77%, 92%)
```

#### Logo Mark
```
Type:       Geometric triangle/chevron mark (matching the V motif)
Position:   (7%, 47%)
Size:       ~5% of W
Color:      #444648 (dark charcoal, matching name text)
Shape:      Stylized "V" or mountain/triangle mark
```

#### Typography — Back

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Name "JONATHAN DOE" | (7%, 23%) | 700 (Bold) | 5.1% H (~31px) | 0.10em | `#444648` | UPPERCASE |
| Title "Graphic Designer" | (7%, 30%) | 400 (Regular) | 4.1% H (~25px) | 0em | `#8C8C8C` | Title Case |
| Contact lines (4–5) | (7%, 57%+) | 400 (Regular) | 2.5% H (~15px) | 0em | `#727780` | Mixed |
| Company "COMPANY" | (60%, 67%) | 700 (Bold) | 11% H (~66px) | 0.15em | `#1C1C1E` | UPPERCASE |

**Contact lines:**

| Line | Content | Y Position |
|---|---|---|
| Phone | "+123 456 789" | 57% |
| Email | "email@company.com" | 62% |
| Address | "123 Main Street" | 67% |
| Website | "www.company.com" | 77% |

**Contact Icons:**
```
Position X: 7%, left-aligned with text
Size:       ~2% of H each
Color:      #4D5562 (dark blue-gray, monochromatic)
Style:      Minimal line icons (phone, mail, pin, globe)
```

#### Spacing Map — Back

| Measurement | Value |
|---|---|
| Left margin | 7% from card edge |
| Name Y | 23% |
| Title Y | 30% |
| Name-to-title gap | 7% of H |
| Title-to-contact gap | 27% of H (generous whitespace) |
| Contact start Y | 57% |
| Contact line spacing | ~5% of H |
| Company branding X | 60% |
| Company branding Y | 67% |
| Chevron zone | right 77%–100% |

---

### Logo Treatment Config

```typescript
const corporateChevronLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T12",              // no logo on front
    // Company name IS the front identity element
  },
  back: {
    technique: "T1",               // standard-small — chevron/triangle mark
    position: { x: 0.07, y: 0.47 },
    size: 0.05,                    // 5% of W
    color: "#444648",
    style: "geometric-triangle",   // V/mountain mark matching chevron motif
    // When user has logo: replace triangle with actual logo at same position
    fallbackTechnique: "T1",
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#1E2633"; ctx.fillRect(0, 0, W, H);
2. Dark chevron V-shapes: #1A202A bands at ~10% width, 43° angle
3. Light chevron V-shapes: #324154 bands at ~12% width, 43° angle
4. "COMPANY": #C8CBD0, 700wt, 11.4%H, 0.15em tracking, at (56%, 46%)
5. "Your tagline here": #8090A0, 300wt, 4.3%H, 0.02em, at (56%, 53%)
6. "yourwebsite.com": #888E99, 400wt, 2.7%H, 0.05em, at (60%, 88%)
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#EFEFEF"; ctx.fillRect(0, 0, W, H);
2. Subtle chevron V-shapes (right side): #DDDDDD, mirrored, pointing LEFT
3. Logo mark: geometric triangle at (7%, 47%) → fill #444648
4. "JONATHAN DOE": #444648, 700wt, 5.1%H, 0.10em, at (7%, 23%)
5. "Graphic Designer": #8C8C8C, 400wt, 4.1%H, at (7%, 30%)
6. Contact icons: #4D5562 minimal line icons at x=7%
7. Contact text: #727780, 400wt, 2.5%H, at x=7%, y=[57%, 62%, 67%, 77%]
8. "COMPANY": #1C1C1E, 700wt, 11%H, 0.15em, at (60%, 67%)
```

#### Critical Rendering Notes
- **Chevrons are parallelogram bands** — each arm of the V is a parallelogram, NOT a stroke line
- **Three-tone bas-relief** on front creates depth: base → dark → light layers
- **~43° angle** is consistent for all chevron bands front and back
- **V-shapes point RIGHT (">") on front, LEFT ("<") on back** — directional mirroring
- **Back chevrons are whisper-subtle** (~8% opacity feel) — barely visible texture
- **~34% dead zone** between chevrons and text on front is essential for premium feel
- **No accent colors** — pure monochromatic navy-gray throughout
- **Company name appears on BOTH sides** — large white on dark (front), large near-black on light (back)
- **Contact icons are monochromatic** — NOT colored squares, matching overall palette

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutCorporateChevron`, line ~946)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Chevrons | 2× `fillRect` rectangles at top-right | 3-layer V-shape parallelogram system at left | Complete geometry rewrite |
| Chevron direction | Squares (no direction) | V-shapes pointing RIGHT, ~43° angle | Draw as parallelogram paths |
| Chevron layers | 2 semi-transparent rectangles | 3 layers: dark + light + base | Add proper layering |
| Background | `cfg.bgColor` | Fixed `#1E2633` dark navy | Hard-code |
| Logo | Centered, large `buildLogoLayer` | Small geometric triangle mark at (7%, 47%) on BACK | Move to back, resize |
| Company | Centered below logo, large | Right side at (56%, 46%), left-aligned | Reposition |
| Tagline | Centered below company | At (56%, 53%), left-aligned, sentence case | Restyle |
| Name | **Not on front** | BACK SIDE ONLY at (7%, 23%) | Move to back |
| Contact | **Not on front** | BACK SIDE ONLY with icons at (7%, 57%+) | Move to back |
| Back side | **Not implemented** | Light bg + mirrored subtle chevrons + full contact layout | Build new |

**Verdict: ~5% reusable — near-complete rewrite required.**

#### Workspace Renderer (`corporate-chevron`, line ~844)
Same issues as adapter. Uses `fillRect` for chevrons instead of V-shape parallelograms. Content layout completely wrong (centered vs. split zones). No back side.

**Verdict: ~5% reusable — near-complete rewrite required.**

---

### AI Design Director Constraints

```yaml
template: corporate-chevron
constraints:
  - MUST use parallelogram V-shape chevrons, NOT rectangles
  - Front has 3-layer system: base #1E2633 → dark #1A202A → light #324154
  - V-shapes point RIGHT on front, LEFT on back — directional mirroring
  - Chevron angle is exactly ~43° from horizontal throughout
  - Front chevron zone: left 0–22%, text zone: right 56–89%
  - ~34% breathing gap between chevrons and text is MANDATORY
  - Back chevrons are whisper-level (#DDDDDD on #EFEFEF — ~8% contrast)
  - Monochromatic navy-gray palette — ZERO accent colors
  - Hue range: 210–220° (desaturated blue), saturation 10–20%
  - Company name "COMPANY" appears on BOTH sides — different scales/colors
  - Contact icons: monochromatic navy-gray, NOT colored
  - Logo mark: small geometric triangle matching V motif, on BACK only
  - Front = brand/identity face, Back = contact/info face
```

---

---

## Template #9 — zigzag-overlay

**Reference:** `dd0acc18c0824cdca8a1969e711c4e4e.jpg` (angular lime/charcoal converging shapes)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Bold modern angular, converging geometry, lime energy meets charcoal authority
**Font Family:** Geometric sans-serif (same family throughout)

### Design DNA

NOT a traditional zigzag — two large converging angular shapes (charcoal + lime green) create dynamic downward-pointing energy. The front features a white base with a small orange→magenta gradient bar at top-left and a dark charcoal diagonal triangle filling the bottom-right (~40% of card). The back features two overlapping angular shapes (charcoal from upper-left, lime from upper-right) that converge to points, with the charcoal shape having a **zigzag right edge** (3 major direction changes). An olive overlap zone (`#7E8D37`) where the shapes intersect creates natural depth. The bottom ~40% of the back is clean white for text content.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Pure white | `#FFFFFF` | 255, 255, 255 | Card backgrounds, text areas |
| Dark charcoal | `#303030` | 48, 48, 48 | Primary dark shape (both sides) |
| Charcoal text | `#343434` | 52, 52, 52 | Front text on white, slight variation |
| Lime green | `#D0E85C` | 208, 232, 92 | Primary accent shape (back) |
| Lime calibrated | `#CAE15C` | 202, 225, 92 | Pure lime center |
| Dark olive | `#7E8D37` | 126, 141, 55 | Overlap zone (dark + lime blend) |
| Warm orange | `#FB6C2B` | 251, 108, 43 | Gradient bar top |
| Coral red | `#FD3F3F` | 253, 63, 63 | Gradient bar middle |
| Hot magenta | `#FC1154` | 252, 17, 84 | Gradient bar bottom |
| Off-white text | `#E0E0E0` | 224, 224, 224 | Text on dark bg |
| Lime-tint text | `#CAD592` | — | Small logo/text at bottom of front |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓│                                           │ 1%
│▓ORANGE▓▓│         PURE WHITE                        │
│▓▓TO▓▓▓▓│         BACKGROUND                        │
│▓MAGENTA▓│                                            │ 14%
│▓GRADIENT│                                            │
│          │                                           │
│          │                                           │
│          │                    ╱ small text            │ 54%
│          │                 ╱╱╱╱╱╱╱╱╱╱╱╱              │
│          │              ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱              │
│          │           ╱╱╱ DARK CHARCOAL ╱╱╱           │ 70%
│          │        ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱            │
│          │     ╱╱╱╱ contact text ╱╱╱╱╱╱╱╱╱╱           │ 85%
│          │  ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱           │
│          │╱╱╱╱╱╱╱╱╱╱╱ lime text ╱╱╱╱╱╱╱╱╱╱╱           │ 97%
└──────────────────────────────────────────────────────┘
0%        29%                              72%      100%
```

#### Background
- Fill entire canvas with `#FFFFFF` (pure white)

#### Orange-to-Magenta Gradient Bar (Top-Left)
```
Position:   x = 0%, y = 1%
Size:       29% of W × 13% of H
Shape:      Tall rectangle/trapezoid, slightly wider in middle
Gradient:   Top-to-bottom vertical
  Stop 0.0: #FB6C2B (warm orange)
  Stop 0.4: #FA3048 → #FD3F3F (coral red)
  Stop 1.0: #FC1154 (hot magenta)
```
```js
const grad = ctx.createLinearGradient(0, H * 0.01, 0, H * 0.14);
grad.addColorStop(0, "#FB6C2B");
grad.addColorStop(0.4, "#FA3048");
grad.addColorStop(1, "#FC1154");
ctx.fillStyle = grad;
ctx.fillRect(0, H * 0.01, W * 0.29, H * 0.13);
```

#### Dark Charcoal Triangle (Bottom-Right)
```
Diagonal: from ~(72%, 54%) at top to ~(15%, 99%) at bottom-left
Angle:    ~60° from horizontal (steep)
Coverage: ~40% of card area
Fill:     #303030 (dark charcoal)
```
```js
ctx.beginPath();
ctx.moveTo(W * 0.72, H * 0.54);     // Top of diagonal
ctx.lineTo(W, H * 0.54);             // Top-right area
ctx.lineTo(W, H);                     // Bottom-right corner
ctx.lineTo(W * 0.15, H);             // Bottom-left of triangle
ctx.closePath();
ctx.fillStyle = "#303030";
ctx.fill();
```

#### Typography — Front

**Small text at diagonal edge:**
```
Position:       ~(72%, 54%) — at the top edge of the dark triangle
Color:          #343434 (charcoal, on white bg)
Size:           ~2–3% of H
Weight:         400 (Regular)
Content:        Name or label text
```

**Contact text on dark triangle:**
```
Position:       y = 88–98%, x = 20–44% (centered within dark area)
Color:          #E0E0E0 (off-white, NOT pure white)
Size:           ~2–3% of H per line
Weight:         400 (Regular)
Lines:          Multiple contact lines stacked vertically
```

**Lime-tinted text/logo at bottom:**
```
Position:       y = 97–98%, x = 20–44%
Color:          #CAD592 (lime-green tint)
Content:        Small logo mark or brand accent
```

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Gradient bar | 0–29% W, 1–14% H |
| White zone | ~upper-left 60% of card |
| Dark triangle | bottom-right ~40% of card |
| Diagonal start | ~(72%, 54%) |
| Diagonal end | ~(15%, 99%) |
| Contact text zone | y: 88–98%, x: 20–44% |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│    ░░DARK CHARCOAL░░░░░░░░░░░░░░░░░░░░░░▓▓LIME▓▓    │ 0%
│     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓    │
│      ░░░░░░░░░░░░░ zig ░░░░░░▓▓▓▓LIME▓▓▓▓▓▓▓▓▓▓▓   │ 10%
│       ░░░░░░░░░░░░░ zag ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│        ░░░░░░░░░BIG ZIG░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │ 25%
│         ░░░░░░░░░░ peak ░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │ 33%
│          ░░░OLIVE░░░ zag ░▓▓▓▓LIME▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │ 37%
│       ▓▓▓▓▓▓▓▓░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓    │ 40%
│       ▓▓▓▓▓▓▓▓▓▓▓░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓             │ 45%
│       ▓▓▓▓LIME▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                   │ 50%
│          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                           │ 55%
│                                                      │
│           PURE WHITE — TEXT AREA                     │ 60–100%
│                                                      │
│ ─────────── faint text line ──────────────────────── │ 98%
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#FFFFFF` (pure white)

#### Dark Charcoal Shape (with Zigzag Right Edge)
Widest at top (~75% width), converges to point at ~(45%, 47%):

```js
ctx.beginPath();
ctx.moveTo(W * 0.10, 0);                // Top-left start
ctx.lineTo(W * 0.85, 0);                // Top-right start

// Zigzag right boundary:
ctx.lineTo(W * 0.71, H * 0.10);         // Narrowing
ctx.lineTo(W * 0.61, H * 0.17);         // First zig
ctx.lineTo(W * 0.64, H * 0.22);         // Zag out
ctx.lineTo(W * 0.62, H * 0.25);         // Zig in
ctx.lineTo(W * 0.72, H * 0.29);         // Big zag out
ctx.lineTo(W * 0.76, H * 0.33);         // Peak
ctx.lineTo(W * 0.71, H * 0.35);         // Zig in
ctx.lineTo(W * 0.66, H * 0.40);         // Continue narrowing
ctx.lineTo(W * 0.53, H * 0.45);         // Near convergence
ctx.lineTo(W * 0.45, H * 0.47);         // Convergence point

// Left boundary (smooth diagonal):
ctx.lineTo(W * 0.28, H * 0.30);
ctx.lineTo(W * 0.22, H * 0.20);
ctx.lineTo(W * 0.15, H * 0.10);
ctx.lineTo(W * 0.10, 0);
ctx.closePath();
ctx.fillStyle = "#303030";
ctx.fill();
```

**Zigzag key vertices on right edge:**
1. **(61%, 17%)** — first narrowing point
2. **(64%, 22%)** — widens (zig)
3. **(62%, 25%)** — narrows (zag)
4. **(72%, 29%)** — big expansion (zig)
5. **(76%, 33%)** — widest secondary peak
6. **(71%, 35%)** — narrows (zag)
7. **(45%, 47%)** — convergence point

#### Lime Green Shape
Wraps around from right side, converges to point at ~(32%, 59%):

```js
ctx.beginPath();
ctx.moveTo(W * 0.85, 0);                // Top start (right of dark)
ctx.lineTo(W * 0.90, 0);                // Top-right

// Right boundary (follows card edge, expanding):
ctx.lineTo(W * 0.92, H * 0.10);
ctx.lineTo(W * 0.95, H * 0.20);
ctx.lineTo(W * 0.99, H * 0.30);
ctx.lineTo(W * 0.99, H * 0.35);
ctx.lineTo(W * 0.98, H * 0.37);

// Wraps left:
ctx.lineTo(W * 0.91, H * 0.40);
ctx.lineTo(W * 0.76, H * 0.45);
ctx.lineTo(W * 0.61, H * 0.50);
ctx.lineTo(W * 0.45, H * 0.55);
ctx.lineTo(W * 0.32, H * 0.59);         // Convergence point

// Left boundary (inner edge near dark):
ctx.lineTo(W * 0.21, H * 0.37);
ctx.lineTo(W * 0.19, H * 0.25);
ctx.lineTo(W * 0.16, H * 0.15);
ctx.lineTo(W * 0.16, 0);

ctx.closePath();
ctx.fillStyle = "#D0E85C";
ctx.fill();
```

#### Olive Overlap Zone (Optional Depth Enhancement)
Where dark and lime shapes overlap: `#7E8D37`, runs along the left boundary of both shapes, ~5–8% of W wide. Can be achieved by drawing lime with slight transparency or an explicit olive strip.

#### Typography — Back
Minimal text detected: faint text line at y=98%, x spanning full width.
- **Position:** Bottom of white zone (y: 98%)
- **Color:** `#3A3A3A` to `#454545` (dark gray)
- **Content:** URL, tagline, or contact strip

#### Spacing Map — Back

| Measurement | Value |
|---|---|
| Dark shape | top 0–47%, x: 10–85% narrowing |
| Lime shape | top 0–59%, x: 16–99% wrapping right |
| Overlap zone | left boundary, ~5–8% W wide |
| White text area | bottom 40% of card (60–100% height) |
| Left margin for shapes | ~10% |
| Text at bottom | y: 98% |

---

### Logo Treatment Config

```typescript
const zigzagOverlayLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T12",              // no explicit logo — gradient bar is brand marker
    // The gradient bar serves as the brand color accent
  },
  back: {
    technique: "T12",              // no logo — shapes ARE the visual identity
    // The converging angular shapes serve as the brand graphic
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
2. Orange→Magenta gradient bar: left edge, 29%W × 13%H, linear gradient
3. Dark charcoal triangle: polygon from (72%, 54%) to bottom-right area
4. Small text at diagonal edge: #343434 on white
5. Contact text on dark: #E0E0E0, 400wt, stacked lines y=88–98%
6. Lime-tinted text/mark: #CAD592 at y=97%
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
2. Dark charcoal shape: complex polygon with zigzag right edge → fill #303030
3. Lime green shape: wrapping polygon from right → fill #D0E85C
4. (Optional) Olive overlap strip: #7E8D37 along shared boundary
5. Faint text at bottom: #3A3A3A at y=98%
```

#### Critical Rendering Notes
- **Zigzag right edge** on back dark shape has 7 vertices — each one is precise
- **Shapes converge to points**: dark at (45%, 47%), lime at (32%, 59%)
- **Front diagonal is steep** (~60° from horizontal) — not a gentle slope
- **Gradient bar is small but vivid** — orange→red→magenta chromatic tension
- **All edges are sharp** — no rounded corners, no anti-alias blur effects
- **Lime is yellow-green (chartreuse)** — NOT blue-green/teal
- **Olive overlap** adds realistic depth between shapes
- **Bottom 40% of back is pure white** — generous text space
- **Off-white text `#E0E0E0`** on dark bg — not pure white

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutZigzagOverlay`, line ~985)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Front layout | Logo centered + white strip at bottom | White bg + gradient bar + diagonal dark triangle | Complete geometry rewrite |
| Gradient bar | **Not implemented** | Orange→magenta bar at top-left | Add new element |
| Dark triangle | **Not implemented** | Steep diagonal from (72%, 54%) to (15%, 99%) | Add polygon path |
| White strip | `fillRect` at bottom 38% | No white strip — dark triangle at bottom | Remove strip |
| Back layout | **Not implemented** | Two converging angular shapes with zigzag | Build entirely new |
| Lime shape | **Not implemented** | `#D0E85C` wrapping polygon | Add new element |
| Zigzag edge | **Not implemented** | 7-vertex zigzag on dark shape's right edge | Add complex path |
| Olive zone | **Not implemented** | `#7E8D37` overlap between shapes | Add optional depth |
| Content | Name/title on white strip + contact right | Text within dark triangle + bottom text | Completely restructure |

**Verdict: 0% reusable — complete rewrite required.**

---

### AI Design Director Constraints

```yaml
template: zigzag-overlay
constraints:
  - Front: white bg + orange-magenta gradient bar (top-left) + dark diagonal triangle (bottom-right)
  - Front gradient bar: vertical, orange #FB6C2B → magenta #FC1154
  - Front dark triangle: steep ~60° diagonal, ~40% of card area
  - Back: two converging angular shapes — charcoal from upper-left, lime from upper-right
  - Back dark shape has ZIGZAG right edge with 7 vertices
  - Back shapes converge to points: dark at ~(45%, 47%), lime at ~(32%, 59%)
  - Lime is YELLOW-GREEN (#D0E85C) — NOT blue-green
  - Olive overlap zone #7E8D37 adds depth between shapes
  - Bottom 40% of back is clean white for text content
  - All edges razor-sharp — no rounded corners
  - Off-white text #E0E0E0 on dark bg — not pure white
  - Only 3 core hues: charcoal, lime, warm red/gradient
```

---

---

## Template #10 — hex-split

**Reference:** `af959c2c59ddb44eac21147cb3cab7c4.jpg` (Company Name — Dwayne John, hexagonal blue)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Professional corporate, geometric precision, navy trust-building, clean hierarchy
**Font Family:** Geometric sans-serif (same family throughout)

### Design DNA

Front is a **dark navy base** (`#2C4F6B`) with a subtle repeating wave/chevron pattern at ~20% opacity, centered hexagonal line-art logo above centered company name and tagline. Back features a **horizontal color split** — light gray top (~40%) with name/title, dark navy bottom (~60%) with contact info in a 2×2 grid layout. The palette is monochromatic blue with neutral whites/grays. The hexagonal logo is the brand anchor. Typography uses wide letter-spacing throughout for a premium corporate feel.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Dark navy | `#2C4F6B` | 44, 79, 107 | Front bg, back bottom section, front text on back |
| Darker navy | `#1E3A4F` | 30, 58, 79 | Wave pattern overlay (~20% opacity) |
| Light blue-gray | `#8BB4D1` | 139, 180, 209 | Tagline, back title (secondary text) |
| Pure white | `#FFFFFF` | 255, 255, 255 | Primary text on dark, logo, contact text |
| Light gray | `#F8F9FA` | 248, 249, 250 | Back top section bg |
| Divider | `#2C4F6B` | — | Back horizontal split line |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│ ~ ~ ~ ~ wave pattern ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ │
│                                                      │
│                   ⬡ HEXAGON LOGO                     │ 30%
│                   (centered, 50%)                    │
│                                                      │
│                COMPANY NAME                          │ 52%
│              TAGLINE GOES HERE                       │ 58%
│                                                      │
│ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#2C4F6B` (dark navy blue, flat solid)

#### Wave Pattern Overlay
```
Type:       Subtle repeating wave/chevron pattern
Coverage:   Full background
Element H:  ~2% of card height per wave
Color:      #1E3A4F
Opacity:    ~20% (globalAlpha = 0.20)
Flow:       Horizontal, across entire card
```
**Canvas2D:**
```js
ctx.globalAlpha = 0.20;
ctx.fillStyle = "#1E3A4F";
// Draw repeating wave/chevron pattern across full card
// Each wave ~12px tall (2% H), horizontal repetition
for (let y = 0; y < H; y += H * 0.04) {
  ctx.beginPath();
  for (let x = 0; x < W; x += W * 0.08) {
    ctx.moveTo(x, y + H * 0.02);
    ctx.lineTo(x + W * 0.04, y);
    ctx.lineTo(x + W * 0.08, y + H * 0.02);
  }
  ctx.lineTo(W, y + H * 0.04);
  ctx.lineTo(0, y + H * 0.04);
  ctx.closePath();
  ctx.fill();
}
ctx.globalAlpha = 1.0;
```

#### Hexagonal Logo
```
Type:       Geometric line-art hexagon with internal cube/box shape
Position:   centered at (50%, 30%)
Size:       ~8% of W × ~12% of H
Color:      #FFFFFF
Stroke:     2–3px equivalent
Corners:    Sharp angles (no rounding)
Rotation:   None (flat-top hexagon)
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Company Name | (50%, 52%) centered | 700 (Bold) | 6% H (~36px) | 0.15em | `#FFFFFF` | UPPERCASE |
| Tagline | (50%, 58%) centered | 300 (Light) | 2.5% H (~15px) | 0.25em | `#8BB4D1` | UPPERCASE |

- All elements center-aligned horizontally
- Text effects: None

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Top margin to logo | ~25% from top |
| Logo center Y | 30% |
| Logo to company name | ~8% of H |
| Company name Y | 52% |
| Company to tagline | ~3% of H |
| Tagline Y | 58% |
| Side margins | ~15% from left/right |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                  DWAYNE JOHN                         │ 25%
│                GENERAL MANAGER                       │ 32%
│                                                      │
│══════════════════════════════════════════════════════│ 40%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓ ✉ email@comp.com  │  📍 123 Street ▓▓▓▓▓▓▓▓▓▓▓▓▓│ 50%
│▓▓                    │                  ▓▓▓▓▓▓▓▓▓▓▓│
│▓▓ 📞 +123 456 789   │  🌐 company.com  ▓▓▓▓▓▓▓▓▓▓▓│ 65%
│▓▓                    │                  ▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────────────────────┘
```

#### Background — Horizontal Color Split
```
Top section (0–40%):    #F8F9FA (light gray/white)
Bottom section (40–100%): #2C4F6B (dark navy, same as front)
Division:               Sharp line at y = 40%, no gradient
```

#### Typography — Back

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Name "DWAYNE JOHN" | (50%, 25%) centered | 700 (Bold) | 7% H (~42px) | 0.10em | `#2C4F6B` | UPPERCASE |
| Title "GENERAL MANAGER" | (50%, 32%) centered | 300 (Light) | 3% H (~18px) | 0.20em | `#8BB4D1` | UPPERCASE |

#### Contact Grid — 2×2 Layout (Dark Section)
Starting at ~50% from top, in a 2×2 grid:

```
Contact font:    Sans-serif, 400 (Regular)
Contact size:    2.8% of H (~17px)
Contact color:   #FFFFFF
Contact case:    Sentence case
Contact spacing: Normal (0)
```

| Position | Icon | Content |
|---|---|---|
| Top-left (25%, 50%) | ✉ Envelope | email@company.com |
| Top-right (55%, 50%) | 📍 Location | 123 Main Street |
| Bottom-left (25%, 65%) | 📞 Phone | +123 456 789 |
| Bottom-right (55%, 65%) | 🌐 Globe | www.company.com |

**Contact Icons:**
```
Size:       ~3% of W each
Color:      #FFFFFF
Style:      Minimalist outline icons (envelope, phone, globe, pin)
Position:   Left of each contact item
Icon-text gap: 3% of W
```

**Vertical Divider:**
```
Position:   x = 50%, spanning contact section height
Width:      1px
Color:      #FFFFFF at 30% opacity
Height:     ~20% of H
```

#### Spacing Map — Back

| Measurement | Value |
|---|---|
| Top section | 0–40% (light gray) |
| Bottom section | 40–100% (dark navy) |
| Name Y | 25% |
| Title Y | 32% |
| Name-to-title gap | ~4% of H |
| Title-to-contact gap | ~8% of H |
| Contact grid start | ~50% |
| Grid columns | 2 columns, divider at 50% |
| Grid rows | 2 rows, ~15% apart |
| Side margins | 15% from sides |
| Bottom margin | 15% from bottom |

---

### Logo Treatment Config

```typescript
const hexSplitLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T8",               // primary-hero — hex logo is the hero element
    position: { x: 0.50, y: 0.30 },
    size: { w: 0.08, h: 0.12 },
    color: "#FFFFFF",
    style: "hexagon-cube",         // line-art hexagon with internal cube
    strokeWidth: 2.5,
    // When user has logo: replace hex with actual logo centered
    fallbackTechnique: "T1",       // standard-small centered
    fallbackScale: 0.12,
  },
  back: {
    technique: "T12",              // no logo on back
    // Name + title + contact grid fill the back
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#2C4F6B"; ctx.fillRect(0, 0, W, H);
2. Wave pattern overlay: #1E3A4F at 20% opacity, repeating chevrons
3. Hexagonal logo: white line-art at (50%, 30%), 8%W × 12%H
4. "COMPANY NAME": #FFFFFF, 700wt, 6%H, 0.15em, centered at (50%, 52%)
5. "TAGLINE GOES HERE": #8BB4D1, 300wt, 2.5%H, 0.25em, centered at (50%, 58%)
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#F8F9FA"; ctx.fillRect(0, 0, W, H * 0.40);
   ctx.fillStyle = "#2C4F6B"; ctx.fillRect(0, H * 0.40, W, H * 0.60);
2. "DWAYNE JOHN": #2C4F6B, 700wt, 7%H, 0.10em, centered at (50%, 25%)
3. "GENERAL MANAGER": #8BB4D1, 300wt, 3%H, 0.20em, centered at (50%, 32%)
4. Vertical divider: #FFFFFF at 30%, 1px at x=50%, y=45–70%
5. Contact icons: 4× white outline icons in 2×2 grid
6. Contact text: 4× white text #FFFFFF, 400wt, 2.8%H in 2×2 grid
```

#### Critical Rendering Notes
- **Wave pattern is subtle** — only 20% opacity, should NOT overpower
- **Hexagonal logo is line-art** — stroked, not filled
- **Horizontal split on back is SHARP** — no gradient, no feathering
- **2×2 contact grid** with vertical divider is the distinctive back layout
- **All text center-aligned** on front, mixed on back (grid items left-aligned within cells)
- **Navy `#2C4F6B`** is the dominant brand color — appears on both sides
- **Light blue-gray `#8BB4D1`** is the secondary text color — used for tagline + title

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutHexSplit`, line ~1025)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Background | Top accent bar + white base | Full dark navy #2C4F6B + wave pattern | Replace entirely |
| Wave pattern | **Not implemented** | Subtle chevron pattern at 20% opacity | Add repeating pattern |
| Hex logo | **Not on front** | Centered hex line-art at (50%, 30%) | Add to front |
| Company name | **Not on front** | Centered white UPPERCASE at (50%, 52%) | Add to front |
| Tagline | **Not on front** | Centered #8BB4D1 at (50%, 58%) | Add to front |
| Name | Top-right, 600wt | BACK at (50%, 25%), 700wt, centered | Move to back |
| Title | Below name on right | BACK at (50%, 32%), 300wt | Move to back |
| Contact layout | Bottom-left generic block | BACK in 2×2 grid with vertical divider | Complete redesign |
| Color split (back) | **Not implemented** | Light top 40% + dark bottom 60% | Build new |
| Vertical divider | **Not implemented** | 1px white at 30% in contact section | Add new |
| Logo placement | Bottom-right small | Front-centered hero hexagon | Move and resize |

**Verdict: ~10% reusable (dark navy concept) — near-complete rewrite required.**

---

### AI Design Director Constraints

```yaml
template: hex-split
constraints:
  - Front is FULL dark navy #2C4F6B background — NOT split or light
  - Subtle wave/chevron pattern at 20% opacity covers entire front
  - Hexagonal line-art logo centered at (50%, 30%) — hero element
  - Company name + tagline centered below logo, wide letter-spacing
  - Back has SHARP horizontal split at 40% — light top, dark bottom
  - Name/title on light section (dark navy text), contact on dark section (white text)
  - Contact in 2×2 grid layout with vertical divider at center
  - Vertical divider: 1px white at 30% opacity
  - Monochromatic blue palette — #2C4F6B + #8BB4D1 + white/gray
  - ZERO accent colors outside blue family
  - Contact icons: white outline style
  - All front elements CENTER-aligned
  - Wide letter-spacing throughout: 0.10em → 0.15em → 0.20em → 0.25em
```

---

---

## Template #11 — dot-circle

**Reference:** `be3ec37adcb83cf6053dafb019cd363a.jpg` (ELD Creatives — Jason Martin, minimalist circle)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Minimalist corporate, monochromatic sophistication, creative professional, generous whitespace
**Font Family:** Geometric sans-serif (same family throughout)

### Design DNA

Front has a **near-white background** (`#F8F8F8`) with left-aligned content — name, title, then stacked contact details with tiny circular icons. A **rectangular dark logo block** sits at top-right (75%, 20%). Back is the same off-white background with a single **large dark circle** (~35% card width) positioned left-of-center at (15%, 50%) containing the logo in white, plus a website URL floating in the lower-right quadrant. The entire card is monochromatic gray — no color accents. The asymmetric back design (heavy left, light right) creates visual tension.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Off-white bg | `#F8F8F8` | 248, 248, 248 | Background (both sides) |
| Primary text | `#2C2C2C` | 44, 44, 44 | Name text |
| Secondary text | `#666666` | 102, 102, 102 | Title, icons, URL, labels |
| Tertiary text | `#444444` | 68, 68, 68 | Contact details (phone/email/web) |
| Logo block bg | `#333333` | 51, 51, 51 | Rectangular logo (front), circle (back) |
| Logo text | `#FFFFFF` | 255, 255, 255 | Text/logo inside dark elements |
| Divider lines | `#E0E0E0` | 224, 224, 224 | Subtle horizontal separators (50% opacity) |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                                    ┌─────────────┐   │
│  JASON MARTIN                     │ ELD CREATIVES │  │ 20-25%
│                                    └─────────────┘   │
│  Creative Director                                   │ 35%
│                                                      │
│  ──────────────────────────────                      │
│  📞  514-xxx-xxxx (Office)                           │ 50%
│  📞  xxx-xxx-xxxx (Mobile)                           │ 56%
│  ──────────────────────────────                      │
│  ✉   jason@eldcreatives.com                          │ 64%
│  🌐  www.eldcreatives.com                            │ 70%
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#F8F8F8` (light off-white, flat solid)

#### Rectangular Logo Element (Front)
```
Type:       Rectangular block with text logo inside
Position:   (75%, 20%) — upper-right area
Size:       ~20% of W × ~15% of H (210 × 90)
Background: #333333 (dark charcoal)
Corner:     2px radius
Logo text:  "ELD CREATIVES" (or user company) in #FFFFFF
```
**Canvas2D:**
```js
const lx = W * 0.65, ly = H * 0.13;
const lw = W * 0.20, lh = H * 0.15;
roundRect(ctx, lx, ly, lw, lh, 2);
ctx.fillStyle = "#333333";
ctx.fill();
// Logo text centered inside
ctx.fillStyle = "#FFFFFF";
ctx.font = `700 ${H * 0.03}px sans-serif`;
ctx.textAlign = "center";
ctx.fillText("COMPANY", lx + lw / 2, ly + lh / 2);
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Name "JASON MARTIN" | (8%, 25%) left-aligned | 700 (Bold) | 6% H (~36px) | 0.15em | `#2C2C2C` | UPPERCASE |
| Title "Creative Director" | (8%, 35%) left-aligned | 300 (Light) | 3% H (~18px) | 0 | `#666666` | Title Case |
| Contact labels "(Office)/(Mobile)" | After phone numbers | 400 (Regular) | 2.2% H (~13px) | 0 | `#666666` | Sentence |
| Contact values (phone/email/web) | (8%+icon gap, 50%+) left-aligned | 400 (Regular) | 2.5% H (~15px) | 0 | `#444444` | As-is |

#### Contact Icons (Front)
```
Type:       Small filled circles with icon symbol
Position:   6% from left, vertically aligned with each contact line
Size:       ~1.5% of card height (~9px diameter)
Color:      #666666
Style:      Minimal — phone, envelope, globe symbols
```

#### Horizontal Dividers (Front)
```
Position:   Between name/title section and contact section
            Between phone group and email/web group
Width:      ~60% of card width
Height:     1px
Color:      #E0E0E0 at 50% opacity
```

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Left margin | 8% from left edge |
| Top margin (to name) | 25% from top |
| Name to title gap | ~4% of H |
| Title to first divider | ~8% of H |
| Contact line spacing | ~6% of H per line |
| Right margin (logo) | 5% from right edge |
| Logo top | ~13% from top |
| Contact icon to text | ~4% of W |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                                                      │
│    ┌─────────┐                                       │
│    │         │                                       │
│    │  LOGO   │                                       │ 50%
│    │  (circle)                                       │
│    │         │                                       │
│    └─────────┘                                       │
│                                                      │
│                        www.eldcreatives.com           │ 75%
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Background
- Same as front: `#F8F8F8` (flat solid)

#### Large Circle with Logo
```
Type:       Perfect filled circle
Center:     (15%, 50%) — left-of-center, vertically centered
Diameter:   ~35% of card width (D ≈ 368px → r ≈ 184px)
Fill:       #333333 (dark charcoal)
Logo:       White (#FFFFFF) centered inside circle
```
**Canvas2D:**
```js
const cx = W * 0.15, cy = H * 0.50;
const r = W * 0.175;
ctx.beginPath();
ctx.arc(cx, cy, r, 0, Math.PI * 2);
ctx.fillStyle = "#333333";
ctx.fill();
// White logo centered in circle
ctx.fillStyle = "#FFFFFF";
ctx.font = `700 ${H * 0.05}px sans-serif`;
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("LOGO", cx, cy);
```

#### Website URL (Back)
```
Text:       www.eldcreatives.com (or user website)
Position:   (65%, 75%) — lower-right quadrant
Weight:     300 (Light)
Size:       3.5% of H (~21px)
Color:      #666666
Case:       lowercase
Spacing:    Normal
```

#### Spacing Map — Back

| Measurement | Value |
|---|---|
| Circle center X | 15% from left |
| Circle center Y | 50% (vertically centered) |
| Circle diameter | ~35% of W |
| URL position | (65%, 75%) |
| Generous whitespace | Asymmetric balance — heavy left, light right |

---

### Logo Treatment Config

```typescript
const dotCircleLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T6",               // panel-enclosed — rectangular dark block
    position: { x: 0.75, y: 0.20 },
    size: { w: 0.20, h: 0.15 },
    panelColor: "#333333",
    textColor: "#FFFFFF",
    cornerRadius: 2,
    fallbackTechnique: "T1",       // standard-small if no logo
  },
  back: {
    technique: "T5",               // circle-enclosed — large dark circle
    position: { x: 0.15, y: 0.50 },
    size: { w: 0.35, h: 0.58 },   // diameter relative to W / H
    circleColor: "#333333",
    logoColor: "#FFFFFF",
    isHeroElement: true,
    fallbackTechnique: "T1",
    fallbackScale: 0.15,
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#F8F8F8"; ctx.fillRect(0, 0, W, H);
2. Rectangular logo block: #333333 rounded rect at (65%, 13%), 20%W × 15%H
3. "JASON MARTIN": #2C2C2C, 700wt, 6%H, 0.15em, UPPER, left at (8%, 25%)
4. "Creative Director": #666666, 300wt, 3%H, left at (8%, 35%)
5. Divider line: #E0E0E0 at 50%, 1px, 60%W, at y ≈ 44%
6. Phone icon (circle 9px) + "514-xxx-xxxx (Office)": icons #666666, text #444444
7. Phone icon + "xxx-xxx-xxxx (Mobile)"
8. Divider line at y ≈ 60%
9. Email icon + "jason@eldcreatives.com": #444444
10. Globe icon + "www.eldcreatives.com": #444444
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#F8F8F8"; ctx.fillRect(0, 0, W, H);
2. Large circle: #333333, centered at (15%, 50%), radius ~17.5% of W
3. Logo inside circle: #FFFFFF, centered
4. "www.eldcreatives.com": #666666, 300wt, 3.5%H, at (65%, 75%)
```

#### Critical Rendering Notes
- **Entirely monochromatic** — NO color accents, only grays/charcoals/whites
- **Rectangular logo (front)** vs **circular logo (back)** — same brand, different containers
- **Left-aligned text** on front (not centered)
- **Asymmetric back** — circle left-of-center, URL lower-right
- **Contact icons** are tiny filled circles with symbols inside
- **Generous whitespace** throughout — minimalist aesthetic
- **Subtle divider lines** at 50% opacity — barely visible

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutDotCircle`, line ~1070)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Circle | Bottom-right at (85%, 70%) | BACK SIDE at (15%, 50%) | Move to back, reposition |
| Circle size | `H * 0.42` radius | ~17.5% of W radius | Resize |
| Circle color | `cfg.primaryColor` (user) | Fixed `#333333` | Use fixed theme |
| Background | Default (white?) | `#F8F8F8` off-white | Set explicitly |
| Name position | (8%, 15%) | (8%, 25%) | Move down |
| Name weight | 700 | 700 | ✅ OK |
| Title color | `cfg.primaryColor` | Fixed `#666666` | Use fixed |
| Rectangular logo | **Missing** | Dark rect at (75%, 20%) on front | Add new |
| Contact position | Below name+title | Below dividers at ~50% | Adjust spacing |
| Contact icons | Generic `buildContactLayers` | Tiny circle icons at 6% left | Customize |
| Divider lines | **Missing** | Two subtle #E0E0E0 at 50% | Add |
| Back side | **Not implemented** | Circle + URL layout | Build new |
| Logo inside circle | In front circle | In BACK circle | Move |
| Company in circle | Text below logo | Not visible separately | Remove |
| Website on back | **Missing** | Lower-right at (65%, 75%) | Add |

**Verdict: ~15% reusable (name left-aligned concept, contact left-aligned concept) — major rewrite required.**

---

### AI Design Director Constraints

```yaml
template: dot-circle
constraints:
  - MONOCHROMATIC ONLY — no accent colors outside gray family
  - Background is #F8F8F8 off-white on BOTH sides
  - Front: left-aligned text at 8% margin, rectangular dark logo at top-right
  - Logo on front is rectangular #333333 block with white text — NOT circular
  - Logo on back is large #333333 circle at (15%, 50%) with white logo
  - Circle is ~35% of card width diameter — it's the hero back element
  - Name is UPPERCASE bold 700, title is Title Case light 300
  - Contact details use tiny circular icons at 6% from left
  - Subtle horizontal dividers (#E0E0E0 at 50%) separate content groups
  - Back is asymmetric — heavy circle left, light URL lower-right
  - Website URL on back at (65%, 75%) in light 300 weight
  - ZERO decorative patterns — pure minimalism
  - Typography hierarchy: 6% → 3.5% → 3% → 2.5% → 2.2%
```

---

## Template #12 — wave-gradient

**Reference:** `81f24f098f21c9e9dc954663ffab50f5.jpg` (MTAC — Mastering Tasks and Coaching, purple-orange gradient)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Modern corporate, dynamic energy, professional coaching, international/bilingual
**Font Family:** Geometric sans-serif (same family throughout)

### Design DNA

Front has a **white background** with content distributed asymmetrically — logo/brand upper-left, name/title center-right, contact details lower-left, QR code lower-right. An **organic curved wave shape** spans the bottom ~20–25% of the card, filled with a diagonal gradient (deep purple → warm orange). Back is a **full-bleed diagonal gradient** (135°, purple → orange) with a large white logo centered with company name and tagline below. The purple-orange complementary palette creates visual energy. Note: reference is bilingual (Arabic+English) but our template uses English only as user-configurable.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Deep purple | `#2D1B69` | 45, 27, 105 | Primary brand, text, wave start |
| Warm orange | `#FF8C42` | 255, 140, 66 | Wave gradient end, accent |
| White | `#FFFFFF` | 255, 255, 255 | Front bg, back text |
| Medium gray | `#666666` | 102, 102, 102 | Secondary text (tagline) |
| Dark gray | `#333333` | 51, 51, 51 | Tertiary text (contact details) |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│  ┌──┐                                               │
│  │▲ │ MTAC                                           │ 15-25%
│  └──┘ Mastering Tasks & Coaching                     │
│                                                      │
│                           Name and Surname           │ 55%
│  📍 Address line           Title/Position            │ 60%
│  📞 Phone number                        ┌────┐       │
│  ✉  Email                               │ QR │       │ 70-80%
│  🌐 Website                             └────┘       │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓ WAVE GRADIENT (purple → orange) ▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#FFFFFF` (pure white, flat)

#### Logo Icon + Brand Text (Upper-Left)
```
Logo icon:    Stylized arrow/chevron mark
Position:     (12%, 26%) — upper-left area
Size:         ~3% of W
Colors:       #FF8C42 (orange) and #2D1B69 (purple)

"MTAC" text:  Bold 700, ~8% H (~48px), UPPERCASE, #2D1B69
Position:     Right of icon, at (15%, 25%)
Spacing:      Normal

Tagline:      "Mastering Tasks and Coaching"
Weight:       400 (Regular), ~2.5% H (~15px)
Color:        #666666
Position:     Below logo text, ~3% gap
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Logo "MTAC" | (15%, 25%) left | 700 (Bold) | 8% H (~48px) | 0 | `#2D1B69` | UPPERCASE |
| Tagline | below logo, 3% gap | 400 (Regular) | 2.5% H (~15px) | 0 | `#666666` | Sentence |
| Name | (60%, 55%) right area | 400 (Regular) | 2.5% H (~15px) | 0 | `#2D1B69` | Title Case |
| Contact details | (8%, 60%+) left | 400 (Regular) | 2% H (~12px) | 0 | `#333333` | As-is |

#### Bottom Wave Element
```
Type:       Organic curved shape (NOT a rectangle)
Span:       Full width (0 → 100%), bottom 20–25% of card
Top edge:   Bezier curve — concave dip center-left, convex rise center-right
Fill:       Linear gradient 135° — #2D1B69 (0%) → #FF8C42 (100%)
```
**Canvas2D:**
```js
ctx.beginPath();
ctx.moveTo(0, H * 0.80);
// Organic wave curve across top edge
ctx.bezierCurveTo(W * 0.25, H * 0.85, W * 0.50, H * 0.75, W * 0.75, H * 0.82);
ctx.bezierCurveTo(W * 0.90, H * 0.86, W, H * 0.78, W, H * 0.80);
ctx.lineTo(W, H);
ctx.lineTo(0, H);
ctx.closePath();
const waveGrad = ctx.createLinearGradient(0, 0, W, H);
waveGrad.addColorStop(0, "#2D1B69");
waveGrad.addColorStop(1, "#FF8C42");
ctx.fillStyle = waveGrad;
ctx.fill();
```

#### QR Code
```
Position:   (78%, 68%) — lower-right
Size:       ~12% of W × ~20% of H
Color:      #000000 on white
```

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Left margin | 8% |
| Right margin | 8% |
| Top margin | 12% |
| Logo icon position | (12%, 26%) |
| Logo text position | (15%, 25%) |
| Logo-to-tagline gap | ~3% of H |
| Name position | (60%, 55%) |
| Contact start | (8%, 60%) |
| Contact line spacing | ~2.5% per line |
| QR code | (78%, 68%) |
| Wave start | ~75-80% from top |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓ ┌──┐                    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓ │▲ │ MTAC               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 45%
│▓▓▓▓▓▓▓▓▓▓▓▓ └──┘                    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓ Mastering Tasks & Coach ▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 55%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓ FULL GRADIENT (purple → orange) ▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────────────────────┘
```

#### Background — Full Gradient
```
Type:       Full-bleed diagonal linear gradient
Direction:  135° (top-left to bottom-right)
Stop 0%:    #2D1B69 (deep purple)
Stop 100%:  #FF8C42 (warm orange)
```
**Canvas2D:**
```js
const bgGrad = ctx.createLinearGradient(0, 0, W, H);
bgGrad.addColorStop(0, "#2D1B69");
bgGrad.addColorStop(1, "#FF8C42");
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, W, H);
```

#### Typography — Back

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Logo icon | (47%, 46%) centered | — | ~4% W | — | `#FFFFFF` | — |
| "MTAC" | (50%, 45%) centered | 700 (Bold) | 12% H (~72px) | 0.10em | `#FFFFFF` | UPPERCASE |
| Tagline | (50%, 55%) centered | 300 (Light) | 2.5% H (~15px) | 0 | `#FFFFFF` at 90% | Sentence |

#### Spacing Map — Back

| Measurement | Value |
|---|---|
| Logo icon | (47%, 46%) |
| Logo text center | (50%, 45%) |
| Tagline center | ~8% below logo text |
| All elements centered | Horizontal + slight upward vertical bias |

---

### Logo Treatment Config

```typescript
const waveGradientLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T1",               // standard-small with brand text
    position: { x: 0.12, y: 0.26 },
    size: { w: 0.03, h: 0.05 },
    color: "#2D1B69",
    companionText: true,           // "MTAC" text next to icon
    companionTextSize: 0.08,       // 8% of H
    companionColor: "#2D1B69",
    fallbackTechnique: "T1",
  },
  back: {
    technique: "T8",               // primary-hero — large centered logo
    position: { x: 0.50, y: 0.45 },
    size: { w: 0.15, h: 0.20 },
    color: "#FFFFFF",
    companionText: true,
    companionTextSize: 0.12,
    companionColor: "#FFFFFF",
    isHeroElement: true,
    fallbackTechnique: "T1",
    fallbackScale: 0.15,
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
2. Logo icon: orange+purple arrow/chevron at (12%, 26%), 3%W
3. "MTAC": #2D1B69, 700wt, 8%H, UPPER, at (15%, 25%)
4. "Mastering Tasks and Coaching": #666666, 400wt, 2.5%H, below logo
5. Name: #2D1B69, 400wt, 2.5%H, at (60%, 55%)
6. Contact details: #333333, 400wt, 2%H, stacked at (8%, 60%+)
7. QR code: black on white, at (78%, 68%), ~12%W
8. Bottom wave: bezier curve path, gradient fill #2D1B69 → #FF8C42
```

#### Back — Draw Order
```
1. Full diagonal gradient: 135°, #2D1B69 → #FF8C42
2. Logo icon (white): centered at (47%, 46%), 4%W
3. "MTAC": #FFFFFF, 700wt, 12%H, 0.10em, UPPER, centered at (50%, 45%)
4. Tagline: #FFFFFF at 90%, 300wt, 2.5%H, centered at (50%, 55%)
```

#### Critical Rendering Notes
- **Wave element is ORGANIC CURVE** — not a simple rectangle with rounded corner
- **Gradient direction is 135°** (top-left purple → bottom-right orange) on both wave and back
- **Front is white** with purple/gray text — clean corporate
- **Back is FULL gradient** — no white elements except text
- **Logo appears on BOTH sides** — small on front, hero on back
- **QR code** present on front lower-right
- **Bilingual reference** — our version uses English-only but maintains the layout structure

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutWaveGradient`, line ~1109)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Wave shape | `rect` with rounded corner at y=60% | Organic bezier wave at y≈80% | Replace with bezier path |
| Wave height | 40% of card | ~20–25% of card | Reduce |
| Wave fill | `lg(135, primaryColor → secondaryColor)` | Fixed `#2D1B69` → `#FF8C42` | Use fixed colors |
| Logo position | Top-left at (10%, 15%) | (12%, 26%) | Adjust |
| Company text | Next to logo | "MTAC" as bold brand | Restyle |
| Name position | On gradient band at (10%, 65%) | Center-right at (60%, 55%) | Reposition |
| Name weight | 600 | 400 | Reduce |
| Contact position | Right side on band at (55%, 66%) | Left side at (8%, 60%) | Move to left |
| QR code | **Missing** | Lower-right at (78%, 68%) | Add |
| Back side | **Not implemented** | Full gradient with centered white logo | Build new |
| Back logo | — | Large white centered at (50%, 45%) | Add |
| Tagline (back) | — | White at 90% at (50%, 55%) | Add |

**Verdict: ~10% reusable (gradient concept, logo top-left concept) — major rewrite required.**

---

### AI Design Director Constraints

```yaml
template: wave-gradient
constraints:
  - Front background is PURE WHITE #FFFFFF — clean corporate
  - Bottom wave is ORGANIC BEZIER CURVE — NOT a rectangle
  - Wave spans bottom 20-25% only — NOT 40%
  - Gradient is 135° from #2D1B69 (purple) to #FF8C42 (orange) — FIXED colors
  - Logo+brand text upper-left area, contact details lower-left
  - Name/title center-right area — NOT on the wave
  - QR code in lower-right corner
  - Back is FULL-BLEED diagonal gradient (same colors as wave)
  - Back has large centered white logo and tagline
  - Purple-orange palette ONLY — no other accent colors
  - Text hierarchy uses #2D1B69 → #666666 → #333333
  - Wave curve must feel organic, not geometric/hard-edged
```

---

## Template #13 — circle-brand

**Reference:** `582ae880318d9bae33ad96ea6beea07f.jpg` (CloseFinancial — Steven Close, blue corporate)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Corporate professional, trustworthy, modern financial services, clean hierarchy
**Font Family:** Modern geometric sans-serif (same family throughout)

### Design DNA

Front has a **light gray/off-white background** (`#F8F8F8`) with a circular geometric logo (house/mountain icon) at upper-left, large centered company name, and split-aligned contact info — personal details left, address right. Back is a **diagonal blue gradient** (medium to dark blue) with a large white logo centered at top, company name below, license text, and a left-aligned services list with checkmark bullet points. The monochromatic blue palette conveys trust and professionalism. The circular icon logo is the brand anchor appearing on both sides.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Medium blue | `#4A6FA5` | 74, 111, 165 | Primary brand, company name, personal name, logo, gradient start |
| Dark blue | `#2D4A7A` | 45, 74, 122 | Gradient end (back) |
| Light blue | `#B8D4F0` | 184, 212, 240 | Secondary text on back (license, subtitle) |
| Off-white bg | `#F8F8F8` | 248, 248, 248 | Front background |
| Medium gray | `#666666` | 102, 102, 102 | Title text |
| Dark gray | `#333333` | 51, 51, 51 | Contact/address text |
| White | `#FFFFFF` | 255, 255, 255 | Back text, logo on back |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌───┐                                             │
│   │ ◉ │  (circular logo)                            │ 25%
│   └───┘                                             │
│                                                      │
│              CloseFinancial                          │ 45%
│                                                      │
│   Steven Close                                       │ 65%
│   Director                                           │ 70%
│                                                      │
│   📞 phone             123 Address St               │ 80%
│   ✉  email              City, State                 │ 85%
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#F8F8F8` (light off-white, flat solid)

#### Circular Logo (Front)
```
Type:       Circle with geometric house/mountain icon inside
Position:   (15%, 25%) — upper-left
Size:       ~12% of card width (diameter ≈ 126px)
Circle bg:  #4A6FA5 (medium blue)
Icon:       White (#FFFFFF) geometric shape
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Company "CloseFinancial" | (50%, 45%) centered | 500 (Medium) | 8% H (~48px) | 0 | `#4A6FA5` | Title Case |
| Name "Steven Close" | (15%, 65%) left | 600 (Semibold) | 3.5% H (~21px) | 0 | `#4A6FA5` | Title Case |
| Title "Director" | (15%, 70%) left | 400 (Regular) | 2.8% H (~17px) | 0 | `#666666` | Title Case |
| Contact info | (15%, 80%) left | 400 (Regular) | 2.2% H (~13px) | 0 | `#333333` | lowercase |
| Address | (85%, 75%) right-aligned | 400 (Regular) | 2.2% H (~13px) | 0 | `#333333` | Title Case |

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Left margin | 15% |
| Right margin | 15% |
| Top margin | 20% |
| Bottom margin | 15% |
| Logo position | (15%, 25%) |
| Company name | centered at (50%, 45%) |
| Name | left at (15%, 65%) |
| Name-to-title gap | ~2% of H |
| Title | left at (15%, 70%) |
| Contact start | (15%, 80%) |
| Address | right-aligned at (85%, 75%) |
| Contact line spacing | ~1.5% per line |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ┌──────┐ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 25%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  ◉   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ └──────┘ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓ CloseFinancial  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 40%
│▓▓▓▓▓▓▓▓ Credit License #123456  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 55%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓ ✓ Service One           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 75%
│▓▓ ✓ Service Two           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 80%
│▓▓ ✓ Service Three         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 85%
└──────────────────────────────────────────────────────┘
```

#### Background — Blue Gradient
```
Type:       Diagonal linear gradient
Direction:  135° (top-left to bottom-right)
Stop 0%:    #4A6FA5 (medium blue)
Stop 100%:  #2D4A7A (dark blue)
```

#### Typography — Back

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Company "CloseFinancial" | (50%, 40%) centered | 500 (Medium) | 7% H (~42px) | 0 | `#FFFFFF` | Title Case |
| License text | (50%, 55%) centered | 300 (Light) | 2% H (~12px) | 0 | `#B8D4F0` | Sentence |
| Service items | (15%, 75%+) left | 400 (Regular) | 2.5% H (~15px) | 0 | `#FFFFFF` | Title Case |

#### Logo (Back) — Large Centered
```
Type:       Same geometric icon, outlined/inverse version
Position:   (50%, 25%) centered
Size:       ~20% of card width
Color:      #FFFFFF (white)
Style:      Transparent background, white outline
```

#### Service List Checkmarks
```
Position:   Preceding each service item
Size:       ~2% of card width
Color:      #FFFFFF
Style:      Small checkmark symbols
Spacing:    ~1% of H between items
Left margin: 15% from left edge
```

---

### Logo Treatment Config

```typescript
const circleBrandLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T5",               // circle-enclosed — blue circle with white icon
    position: { x: 0.15, y: 0.25 },
    size: { w: 0.12, h: 0.20 },
    circleColor: "#4A6FA5",
    logoColor: "#FFFFFF",
    fallbackTechnique: "T1",
    fallbackScale: 0.10,
  },
  back: {
    technique: "T8",               // primary-hero — large centered white logo
    position: { x: 0.50, y: 0.25 },
    size: { w: 0.20, h: 0.30 },
    color: "#FFFFFF",
    isHeroElement: true,
    fallbackTechnique: "T1",
    fallbackScale: 0.15,
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#F8F8F8"; ctx.fillRect(0, 0, W, H);
2. Circular logo: #4A6FA5 circle at (15%, 25%), 12%W diameter, white icon inside
3. "CloseFinancial": #4A6FA5, 500wt, 8%H, centered at (50%, 45%)
4. "Steven Close": #4A6FA5, 600wt, 3.5%H, left at (15%, 65%)
5. "Director": #666666, 400wt, 2.8%H, left at (15%, 70%)
6. Contact details: #333333, 400wt, 2.2%H, left at (15%, 80%+)
7. Address: #333333, 400wt, 2.2%H, right-aligned at (85%, 75%+)
```

#### Back — Draw Order
```
1. Diagonal gradient: 135°, #4A6FA5 → #2D4A7A
2. Large logo: white icon at (50%, 25%), 20%W
3. "CloseFinancial": #FFFFFF, 500wt, 7%H, centered at (50%, 40%)
4. License text: #B8D4F0, 300wt, 2%H, centered at (50%, 55%)
5. Checkmark + service items: #FFFFFF, 400wt, 2.5%H, left at (15%, 75%+)
```

#### Critical Rendering Notes
- **Monochromatic blue** — `#4A6FA5` / `#2D4A7A` / `#B8D4F0` only
- **Front is light**, back is dark gradient — strong contrast between sides
- **Logo appears on both sides** — small circle on front, large white on back
- **Company name is the LARGEST text** on front (8%H) — the brand hero
- **Split contact layout** — personal info left, address right
- **Services list on back** uses checkmark bullet points
- **Title Case** for most text elements (not UPPERCASE)

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutCircleBrand`, line ~1158)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Company position | Next to logo, top-left | CENTERED at (50%, 45%), hero element | Reposition, enlarge |
| Company size | `fs.companyLg` | 8% H (~48px) | Increase |
| Logo position | Top-left at (8%, 15%) | (15%, 25%) | Adjust |
| Name position | Left at (8%, 53%) | Left at (15%, 65%) | Move down |
| Title position | Below name | (15%, 70%) | Adjust |
| Contact layout | Right side at (55%, 55%) | Split: left (15%, 80%) + right (85%, 75%) | Redesign |
| Divider | At 48% | Not present in reference | Remove |
| Color palette | `cfg.primaryColor` (user) | Fixed `#4A6FA5` theme | Use fixed |
| Back side | **Not implemented** | Blue gradient with large logo, services list | Build new |
| Back gradient | — | 135°, `#4A6FA5` → `#2D4A7A` | Add |
| Services list | **Missing** | Checkmark items on back | Add |
| License text | **Missing** | Light blue at (50%, 55%) | Add |

**Verdict: ~15% reusable (logo top-left, name left-aligned concepts) — major rewrite required.**

---

### AI Design Director Constraints

```yaml
template: circle-brand
constraints:
  - Front background is #F8F8F8 off-white — clean corporate
  - Circular logo at upper-left (15%, 25%) — blue circle, white icon
  - Company name is the HERO TEXT — centered at (50%, 45%), 8%H
  - Name/title left-aligned in lower half (15%, 65-70%)
  - Contact info split: personal left (15%), address right (85%)
  - Back is diagonal gradient #4A6FA5 → #2D4A7A
  - Large white logo centered at (50%, 25%) on back
  - Services list with checkmark bullets on back
  - Monochromatic blue palette ONLY — #4A6FA5 family + grays
  - Title Case for most text — NOT UPPERCASE
  - Contact text uses #333333 dark gray, NOT blue
  - Secondary text on back uses #B8D4F0 light blue
```

---

## Template #14 — full-color-back

**Reference:** `53142c0af99e85dd58a973f2f4707ca7.jpg` (Gordon Law Group — John Smith, professional legal)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Professional corporate/legal, trustworthy, clean geometric, modern yet timeless
**Font Family:** Sans-serif (Helvetica-like geometric)

### Design DNA

Front is **pure white** with a two-column asymmetric layout — left column has all text (name → title → company → address → contact) stacked at 8% left margin, while a large **geometric diamond/interlocking squares logo** occupies the upper-right quadrant at (75%, 15%). Back is a **full-bleed diagonal blue gradient** (`#4A7BA7` → `#2B5B84`) with the white logo centered, "GORDON LAW" text below, website at bottom, and subtle geometric diamond shapes scattered as watermark at ~5% opacity. The monochromatic blue palette conveys trust and legal professionalism.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Dark blue | `#2B5B84` | 43, 91, 132 | Primary brand, name, company, logo, gradient end |
| Light blue | `#4A7BA7` | 74, 123, 167 | Gradient start (back) |
| Medium gray | `#666666` | 102, 102, 102 | Title, address, contact text |
| White | `#FFFFFF` | 255, 255, 255 | Front bg, back text/logo |
| Watermark white | `#FFFFFF` at 5% | — | Subtle diamond pattern on back |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                    ┌────────────┐    │
│   John Smith                       │  ◆ GORDON  │   │ 15-25%
│   President                        │    LAW     │   │ 30%
│                                    └────────────┘    │
│   Gordon Law Group                                   │ 45%
│                                                      │
│   400 Central Ave, Suite 340                         │ 55%
│   Northfield, IL 60093                               │ 60%
│                                                      │
│   📞 phone  📠 fax                                   │ 75%
│   ✉  email  🌐 web                                   │ 80%
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#FFFFFF` (pure white, flat)

#### Logo — Geometric Diamond (Front, Upper-Right)
```
Type:       Interlocked geometric squares forming diamond pattern
            + "GORDON LAW" text below icon in spaced letterforms
Position:   (75%, 15%) — upper-right quadrant
Size:       ~25% of W × ~35% of H (263 × 210)
Color:      #2B5B84 (dark blue)
Style:      Clean geometric, interlocking squares
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Name "John Smith" | (8%, 22%) left | 700 (Bold) | 8% H (~48px) | 0 | `#2B5B84` | Title Case |
| Title "President" | (8%, 30%) left | 400 (Regular) | 3.5% H (~21px) | 0 | `#666666` | Title Case |
| Company "Gordon Law Group" | (8%, 45%) left | 500 (Medium) | 4% H (~24px) | 0 | `#2B5B84` | Title Case |
| Address lines | (8%, 55%) left | 400 (Regular) | 2.8% H (~17px) | 0 | `#666666` | Title Case |
| Contact info | (8%, 75%) left | 400 (Regular) | 2.8% H (~17px) | 0 | `#666666` | lowercase (email/web) |

#### Contact Icons
```
Type:       Simple line icons (phone, fax, email, web)
Position:   Left-aligned with contact text at 8% from left
Size:       ~1.5% of card height (~9px)
Color:      #2B5B84 (dark blue)
```

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Left margin | 8% |
| Right margin | 5% (logo area) |
| Top margin | 18% |
| Bottom margin | 10% |
| Name Y | 22% |
| Title Y | 30% |
| Name-to-title gap | ~8% of H |
| Company Y | 45% |
| Address Y | 55% |
| Contact Y | 75% |
| Group spacing | ~8% of H between text groups |
| Logo position | (75%, 15%) |
| Logo size | 25%W × 35%H |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓ ◇ ◆ ◇ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓ ┌──────┐ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 30%
│▓▓▓▓▓▓▓▓▓▓▓▓ │ LOGO │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓ └──────┘ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓ G O R D O N   L A W ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 40%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓ www.gordonlawltd.com ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 70%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────────────────────┘
```

#### Background — Blue Gradient + Diamond Watermark
```
Gradient:
  Type:       Diagonal linear gradient
  Direction:  135° (top-left to bottom-right)
  Stop 0%:    #4A7BA7 (lighter blue)
  Stop 100%:  #2B5B84 (darker blue)

Watermark pattern:
  Type:       Scattered geometric diamond shapes
  Size:       Various, largest ~15% of W
  Color:      #FFFFFF at ~5% opacity
  Effect:     Subtle embossed/watermark appearance
```

#### Typography — Back

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| "GORDON LAW" | (50%, 40%) centered | 300 (Light) | 6% H (~36px) | 0.20em | `#FFFFFF` | UPPERCASE |
| Website | (50%, 70%) centered | 400 (Regular) | 2.5% H (~15px) | 0 | `#FFFFFF` | lowercase |

#### Logo — Large Centered (Back)
```
Type:       Same geometric diamond/squares icon as front
Position:   (50%, 30%) centered
Size:       ~20% of W × ~25% of H
Color:      #FFFFFF (white)
Style:      Clean line art version
```

#### Spacing Map — Back

| Measurement | Value |
|---|---|
| Logo center | (50%, 30%) |
| Company text | (50%, 40%) |
| Logo-to-text gap | ~5% of H |
| Website | (50%, 70%) |
| All elements centered | Equal margins ~15% minimum |

---

### Logo Treatment Config

```typescript
const fullColorBackLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T8",               // primary-hero — large geometric logo
    position: { x: 0.75, y: 0.15 },
    size: { w: 0.25, h: 0.35 },
    color: "#2B5B84",
    companionText: true,           // "GORDON LAW" below icon
    companionTextSize: 0.04,
    companionColor: "#2B5B84",
    style: "geometric-diamond",
    isHeroElement: true,
    fallbackTechnique: "T1",
    fallbackScale: 0.18,
  },
  back: {
    technique: "T8",               // primary-hero — centered white logo
    position: { x: 0.50, y: 0.30 },
    size: { w: 0.20, h: 0.25 },
    color: "#FFFFFF",
    companionText: true,
    companionTextSize: 0.06,
    companionColor: "#FFFFFF",
    companionSpacing: "0.20em",
    isHeroElement: true,
    fallbackTechnique: "T1",
    fallbackScale: 0.15,
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
2. Geometric diamond logo: #2B5B84 at (75%, 15%), 25%W × 35%H
3. "John Smith": #2B5B84, 700wt, 8%H, left at (8%, 22%)
4. "President": #666666, 400wt, 3.5%H, left at (8%, 30%)
5. "Gordon Law Group": #2B5B84, 500wt, 4%H, left at (8%, 45%)
6. Address: #666666, 400wt, 2.8%H, left at (8%, 55%)
7. Contact icons: #2B5B84, 1.5%H, left at 8%
8. Contact text: #666666, 400wt, 2.8%H, left at (8%, 75%+)
```

#### Back — Draw Order
```
1. Diagonal gradient: 135°, #4A7BA7 → #2B5B84
2. Diamond watermark shapes: #FFFFFF at 5% opacity, scattered
3. Logo icon: #FFFFFF at (50%, 30%), 20%W × 25%H
4. "GORDON LAW": #FFFFFF, 300wt, 6%H, 0.20em, UPPER, centered at (50%, 40%)
5. "www.gordonlawltd.com": #FFFFFF, 400wt, 2.5%H, centered at (50%, 70%)
```

#### Critical Rendering Notes
- **White front, full-color back** — the defining characteristic
- **Geometric diamond logo** is LARGE on front right (~25%W × 35%H) — hero element
- **All text left-aligned** on front at 8% margin
- **Name is the largest front text** at 8%H — matches company name in prominence
- **Monochromatic blue** — `#2B5B84` / `#4A7BA7` only, plus grays
- **Diamond watermark on back** at 5% opacity — very subtle
- **"GORDON LAW"** on back uses wide 0.20em letter-spacing
- **Contact icons are blue** `#2B5B84`, not gray

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutFullColorBack`, line ~1198)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Background | White (implicit) | White ✅ | OK |
| Side accent bar | 5px left bar, `cfg.primaryColor` | **Not in reference** | Remove |
| Name position | (8%+8, 15%) | (8%, 22%) | Adjust Y |
| Name weight | 600 | 700 | Increase |
| Name color | `cfg.textColor` | Fixed `#2B5B84` | Use fixed |
| Title position | Below name | (8%, 30%) | Adjust |
| Company position | Below title | (8%, 45%) — separate group | Add spacing |
| Address | **Missing** | (8%, 55%) | Add |
| Contact position | (8%, 56%) | (8%, 75%) | Move down |
| Contact icons | Generic `buildContactLayers` | Small blue line icons | Customize |
| Logo position | Right, `H * 0.22` size | (75%, 15%), 25%W × 35%H — MUCH larger | Enlarge, reposition |
| Logo has text | No | "GORDON LAW" below icon | Add companion text |
| Back side | **Not implemented** | Full gradient + watermark + centered logo | Build new |
| Watermark | **Missing** | Diamond shapes at 5% opacity | Add |

**Verdict: ~15% reusable (white bg, left-aligned text, logo right concepts) — major rewrite required.**

---

### AI Design Director Constraints

```yaml
template: full-color-back
constraints:
  - Front is PURE WHITE background — clean corporate
  - NO side accent bar — remove the 5px left bar
  - Left column text at 8% margin: name → title → company → address → contact
  - Groups separated by ~8%H vertical gaps — clear hierarchy
  - Logo at upper-right (75%, 15%) is LARGE — 25%W × 35%H, geometric diamond
  - Logo is the hero element on front — NOT small
  - Name and company in #2B5B84 dark blue, title/address/contact in #666666
  - Contact icons are small blue line icons — NOT gray
  - Back is FULL-BLEED diagonal gradient #4A7BA7 → #2B5B84
  - Back has subtle diamond watermark shapes at 5% opacity
  - Centered white logo and "GORDON LAW" text on back
  - "GORDON LAW" uses 0.20em letter-spacing, 300 weight, UPPERCASE
  - Website URL centered below, plain white
  - Monochromatic blue palette — ZERO other accent colors
```

---

## Template #15 — engineering-pro

**Reference:** `ce766a1fcd777090860a8a8413b2d2f3.jpg` (Holdfast Engineering — Jane Peterson, corporate blue)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Corporate engineering, precision, reliable, modern professional
**Font Family:** Geometric sans-serif (same family throughout)

### Design DNA

Front has an **off-white background** (`#F8F9FA`) with all content left-aligned at 12% margin. Three clear zones: logo/brand (top 40%), name/title (middle), contact (bottom) separated by a thin gray divider line. The palette is monochromatic blue — dark blue-gray for primary text, light blue for accent text/logo icon. Back is **solid bright blue** (`#3498DB`) with a large centered tonal logo and wordmark creating a subtle embossed effect (darker blue on blue). The contrast between light front and bold blue back creates memorable brand recall.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Dark blue-gray | `#2C3E50` | 44, 62, 80 | Primary text (company name, personal name) |
| Light blue | `#5DADE2` | 93, 173, 226 | Accent text (engineering, title), logo icon |
| Medium gray-blue | `#34495E` | 52, 73, 94 | Contact text |
| Light gray divider | `#BDC3C7` | 189, 195, 199 | Divider line |
| Off-white bg | `#F8F9FA` | 248, 249, 250 | Front background |
| Bright blue | `#3498DB` | 52, 152, 219 | Back background |
| Dark blue | `#1B4F72` | 27, 79, 114 | Back logo text (tonal contrast) |
| Medium blue | `#2980B9` | 41, 128, 185 | Back accent text/icon (tonal) |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌──┐                                              │
│   │▲▲│  HOLDFAST                                     │ 15-25%
│   └──┘  E N G I N E E R I N G                       │
│                                                      │
│                                                      │
│   Jane Peterson                                      │ 48%
│   Founder                                            │ 58%
│                                                      │
│   ──────────────────────────────────────────         │ 68%
│                                                      │
│   📍 address  📞 phone  ✉ email  🌐 web              │ 75%
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#F8F9FA` (off-white, flat solid)

#### Logo Icon + Brand Text (Upper-Left)
```
Logo icon:    Abstract angular/interlocking geometric shapes
Position:     (12%, 15%)
Size:         ~8% W × ~12% H
Color:        #5DADE2 (light blue)
Style:        Angular, suggesting engineering/construction

"HOLDFAST":   Bold 700, 6%H, UPPERCASE, 0.15em, #2C3E50
Position:     Right of icon, vertically aligned

"ENGINEERING": Regular 400, 2.5%H, UPPERCASE, 0.25em (very wide), #5DADE2
Position:     Below "HOLDFAST"
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| "HOLDFAST" | near logo (12%, 15%) | 700 (Bold) | 6% H (~36px) | 0.15em | `#2C3E50` | UPPERCASE |
| "ENGINEERING" | below HOLDFAST | 400 (Regular) | 2.5% H (~15px) | 0.25em | `#5DADE2` | UPPERCASE |
| Name "Jane Peterson" | (12%, 48%) left | 500 (Medium) | 4% H (~24px) | 0 | `#2C3E50` | Title Case |
| Title "Founder" | (12%, 58%) left | 400 (Regular) | 2.8% H (~17px) | 0 | `#5DADE2` | Title Case |
| Contact info | (12%, 75%) left | 300 (Light) | 2.2% H (~13px) | 0 | `#34495E` | Sentence |

#### Horizontal Divider
```
Position:   (12%, 68%) to 88% of card width
Width:      76% of card
Height:     1px
Color:      #BDC3C7
```

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Left margin | 12% |
| Right margin | 12% |
| Logo icon position | (12%, 15%) |
| Logo zone | 0–40% of height |
| Name Y | 48% |
| Title Y | 58% |
| Name-to-title gap | ~10% of H |
| Divider Y | 68% |
| Title-to-divider gap | ~10% of H |
| Divider-to-contact gap | ~7% of H |
| Contact Y | 75% |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ┌──────┐ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ LOGO │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 35%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ └──────┘ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓ H O L D F A S T ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 50%
│▓▓▓▓▓▓▓ E N G I N E E R I N G ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 58%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓ (solid #3498DB blue background) ▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#3498DB` (bright blue, flat solid)

#### Tonal Logo + Wordmark (Centered)
```
Logo icon:    Same angular shapes as front, enlarged
Position:     Centered above text
Size:         ~15% W × ~20% H
Color:        #2980B9 (medium blue — tonal contrast on #3498DB)
Effect:       Subtle embossed appearance (darker on blue)

"HOLDFAST":   Bold 700, 12%H, UPPERCASE, 0.15em
Color:        #1B4F72 (darker blue — tonal emboss)
Position:     Centered at (50%, ~50%)

"ENGINEERING": Regular 400, 4%H, UPPERCASE, 0.25em
Color:        #2980B9 (medium blue)
Position:     Centered below HOLDFAST at (50%, ~58%)
```

---

### Logo Treatment Config

```typescript
const engineeringProLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T1",               // standard-small with companion text
    position: { x: 0.12, y: 0.15 },
    size: { w: 0.08, h: 0.12 },
    color: "#5DADE2",
    companionText: true,
    companionTextSize: 0.06,
    companionColor: "#2C3E50",
    fallbackTechnique: "T1",
  },
  back: {
    technique: "T11",              // tonal-watermark — tonal blue-on-blue
    position: { x: 0.50, y: 0.35 },
    size: { w: 0.15, h: 0.20 },
    color: "#2980B9",              // tonal contrast on #3498DB bg
    companionText: true,
    companionTextSize: 0.12,
    companionColor: "#1B4F72",
    isHeroElement: true,
    effect: "embossed",
    fallbackTechnique: "T11",
    fallbackScale: 0.15,
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#F8F9FA"; ctx.fillRect(0, 0, W, H);
2. Logo icon: #5DADE2 angular shapes at (12%, 15%), 8%W × 12%H
3. "HOLDFAST": #2C3E50, 700wt, 6%H, 0.15em, UPPER, right of icon
4. "ENGINEERING": #5DADE2, 400wt, 2.5%H, 0.25em, UPPER, below
5. "Jane Peterson": #2C3E50, 500wt, 4%H, left at (12%, 48%)
6. "Founder": #5DADE2, 400wt, 2.8%H, left at (12%, 58%)
7. Divider: #BDC3C7, 1px, 12%–88% at y=68%
8. Contact: #34495E, 300wt, 2.2%H, left at (12%, 75%)
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#3498DB"; ctx.fillRect(0, 0, W, H);
2. Logo icon: #2980B9 (tonal) at center, 15%W × 20%H, above text
3. "HOLDFAST": #1B4F72 (dark tonal), 700wt, 12%H, 0.15em, centered
4. "ENGINEERING": #2980B9 (tonal), 400wt, 4%H, 0.25em, centered below
```

#### Critical Rendering Notes
- **Tonal back design** — all elements are blue-on-blue shades, creating embossed effect
- **"ENGINEERING" always uses 0.25em letter-spacing** — very wide, distinct from HOLDFAST
- **Title uses accent blue `#5DADE2`** — NOT gray, unlike most templates
- **Three clear zones on front** — logo/brand, name/title, contact — with divider separating lower two
- **No decorative patterns** — pure minimalism with clean lines
- **Left-aligned throughout** at 12% margin (not 8% like most templates)
- **Contact text uses `#34495E`** — distinct from both primary and accent blue

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutEngineeringPro`, line ~1237)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Background | Default (white?) | `#F8F9FA` off-white | Set explicitly |
| Logo position | (8%, 15%) | (12%, 15%) | Adjust margins |
| Company position | Next to logo at (8%+logoS+8) | "HOLDFAST" near logo, "ENGINEERING" below | Restructure |
| Company weight | 700 | "HOLDFAST" 700 + "ENGINEERING" 400 | Split into 2 elements |
| Name position | Below separator | (12%, 48%) | Adjust |
| Name weight | 600 | 500 (Medium) | Reduce |
| Title color | `cfg.primaryColor` | Fixed `#5DADE2` | Use fixed |
| Contact position | Below name+title | (12%, 75%) | Adjust spacing |
| Divider position | After logo | 68% of H (between title and contact) | Move |
| Left margin | 8% | 12% | Increase |
| Color palette | User colors | Fixed blue palette | Use fixed theme |
| Back side | **Not implemented** | Solid `#3498DB` with tonal logo | Build new |

**Verdict: ~20% reusable (logo top, left-aligned, separator concepts) — significant rewrite required.**

---

### AI Design Director Constraints

```yaml
template: engineering-pro
constraints:
  - Front background is #F8F9FA off-white
  - Left margin is 12% (NOT 8%) — all content left-aligned
  - Three zones: logo/brand (top 40%), name/title (middle), contact (bottom)
  - "HOLDFAST" in #2C3E50 dark blue-gray, Bold 700, 0.15em spacing
  - "ENGINEERING" in #5DADE2 light blue, Regular 400, 0.25em very wide spacing
  - Title uses ACCENT blue #5DADE2 — not gray
  - Thin divider #BDC3C7 at 68% — between title and contact zones
  - Contact text in #34495E medium gray-blue
  - Back is SOLID #3498DB blue — flat, no gradient
  - Back logo/text uses TONAL blues — #1B4F72 and #2980B9 ON #3498DB
  - Creates subtle embossed effect — NOT high contrast
  - Monochromatic blue palette throughout — ZERO warm colors
```

---

## Template #16 — clean-accent

**Reference:** `57b97d3a5ac18ce74b1b324fbf05803c.jpg` (Real Estate Corporation — Jonathan Doe, orange accent)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Corporate real estate, architectural, professional, modern with bold accent
**Font Family:** Geometric sans-serif (same family throughout)
**Note:** Reference shows FRONT SIDE ONLY. Back side designed as complementary inverse.

### Design DNA

Front is **pure white** with an asymmetric layout — logo + company name upper-left, person name + title upper-right (right-aligned), QR code lower-left, and a **city skyline silhouette** spanning the bottom ~35% of the card. The bold orange-red `#E85A2B` is used as the single accent color against a monochromatic gray base. Back side (inferred): solid orange-red background with centered white logo and company name for brand recall.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| White | `#FFFFFF` | 255, 255, 255 | Front background |
| Orange-red | `#E85A2B` | 232, 90, 43 | Brand color, company name, person name, title, logo |
| Medium gray | `#666666` | 102, 102, 102 | Contact text |
| Skyline light | `#DDDDDD` | 221, 221, 221 | Skyline gradient top |
| Skyline dark | `#999999` | 153, 153, 153 | Skyline gradient bottom |
| Black | `#000000` | 0, 0, 0 | QR code |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                              JONATHAN DOE            │ 8%
│                              BROKER DESIGNER         │ 12%
│  ┌──┐ REAL ESTATE            📞 phone               │ 18%
│  │🏠│ CORPORATION            ✉  email               │ 25%
│  └──┘                        🌐 website              │ 30%
│                                                      │
│  ┌────┐                                             │
│  │ QR │                                             │ 45-55%
│  └────┘                                             │
│  ░░░▓▓▓░░▓▓░░░▓▓▓▓▓░░▓▓░░░▓▓░▓▓▓░░░▓▓▓░░░▓▓▓▓▓░░│ 65%
│  ░▓▓▓▓▓░▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓░▓▓▓▓▓▓▓▓░▓▓▓▓▓░▓▓▓▓▓▓▓░│
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#FFFFFF` (pure white, flat)

#### Logo Icon (Upper-Left)
```
Type:       Geometric house/roof icon with architectural lines
Position:   (5%, 25%)
Size:       ~8% W × ~12% H
Color:      #E85A2B (orange-red)
Style:      Linear, architectural
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case | Align |
|---|---|---|---|---|---|---|---|
| Company "REAL ESTATE CORPORATION" | (25%, 25%) | 700 (Bold) | 3.5% H (~21px) | 0.15em | `#E85A2B` | UPPERCASE | left |
| Name "JONATHAN DOE" | (95%, 8%) | 700 (Bold) | 2.8% H (~17px) | 0 | `#E85A2B` | UPPERCASE | right |
| Title "BROKER DESIGNER" | (95%, 12%) | 400 (Regular) | 2% H (~12px) | 0.10em | `#E85A2B` | UPPERCASE | right |
| Contact info | (95%, 18%+) | 400 (Regular) | 1.8% H (~11px) | 0 | `#666666` | Sentence | right |

#### City Skyline Graphic
```
Type:       Architectural silhouette pattern (vertical lines = buildings)
Span:       Full width, bottom 35% of card (y = 65% → 100%)
Style:      Random building heights creating urban skyline effect
Color:      Gradient from #DDDDDD (top) → #999999 (bottom)
Opacity:    ~60%
```
**Canvas2D:**
```js
ctx.globalAlpha = 0.60;
const skyY = H * 0.65;
const grad = ctx.createLinearGradient(0, skyY, 0, H);
grad.addColorStop(0, "#DDDDDD");
grad.addColorStop(1, "#999999");
ctx.fillStyle = grad;
// Draw random-height vertical bars (buildings)
const barW = W * 0.02; // ~21px wide
for (let x = 0; x < W; x += barW + 2) {
  const bH = H * (0.05 + Math.random() * 0.30); // random height
  ctx.fillRect(x, H - bH, barW, bH);
}
ctx.globalAlpha = 1.0;
```
*Note: Use seeded random for consistent rendering.*

#### QR Code
```
Position:   (8%, 45%) — lower-left area
Size:       ~15% W × ~25% H
Color:      #000000 on white
```

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Left margin | 5% (logo, QR) |
| Right margin | 5% (contact, right-aligned) |
| Top margin | 8% (person name) |
| Logo position | (5%, 25%) |
| Company text | (25%, 25%) — right of logo |
| Name | right-aligned at (95%, 8%) |
| Title | right-aligned at (95%, 12%) |
| Contact start | right-aligned at (95%, 18%) |
| Contact line spacing | ~2% per line |
| QR code | (8%, 45%) |
| Skyline start | 65% from top |
| Skyline extends to | bottom edge |

---

### BACK SIDE (Inferred — Not in Reference)

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ┌──────┐ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ LOGO │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 35%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ └──────┘ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓ REAL ESTATE CORPORATION ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 55%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓ www.realestate.com ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 70%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓ (solid #E85A2B orange-red background) ▓▓▓▓▓▓▓│
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#E85A2B` (solid orange-red)

#### Typography — Back

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Company name | (50%, 55%) centered | 700 (Bold) | 5% H | 0.15em | `#FFFFFF` | UPPERCASE |
| Website | (50%, 70%) centered | 400 (Regular) | 2.5% H | 0 | `#FFFFFF` at 80% | lowercase |

#### Logo — Centered White
```
Position:   (50%, 35%) centered
Size:       ~15% W × 20% H
Color:      #FFFFFF
```

---

### Logo Treatment Config

```typescript
const cleanAccentLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T1",               // standard-small with companion text
    position: { x: 0.05, y: 0.25 },
    size: { w: 0.08, h: 0.12 },
    color: "#E85A2B",
    companionText: true,
    companionTextSize: 0.035,
    companionColor: "#E85A2B",
    style: "architectural",
    fallbackTechnique: "T1",
  },
  back: {
    technique: "T8",               // primary-hero centered white
    position: { x: 0.50, y: 0.35 },
    size: { w: 0.15, h: 0.20 },
    color: "#FFFFFF",
    isHeroElement: true,
    fallbackTechnique: "T1",
    fallbackScale: 0.12,
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
2. Logo icon: #E85A2B at (5%, 25%), 8%W × 12%H
3. "REAL ESTATE CORPORATION": #E85A2B, 700wt, 3.5%H, 0.15em, left at (25%, 25%)
4. "JONATHAN DOE": #E85A2B, 700wt, 2.8%H, right-aligned at (95%, 8%)
5. "BROKER DESIGNER": #E85A2B, 400wt, 2%H, 0.10em, right at (95%, 12%)
6. Contact details: #666666, 400wt, 1.8%H, right-aligned at (95%, 18%+)
7. QR code: black, at (8%, 45%), 15%W
8. City skyline: gradient #DDDDDD→#999999, 60% opacity, bottom 35%, seeded random bars
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#E85A2B"; ctx.fillRect(0, 0, W, H);
2. Logo icon: #FFFFFF at (50%, 35%), 15%W
3. "REAL ESTATE CORPORATION": #FFFFFF, 700wt, 5%H, 0.15em, centered at (50%, 55%)
4. Website: #FFFFFF at 80%, 400wt, 2.5%H, centered at (50%, 70%)
```

#### Critical Rendering Notes
- **Single accent color** — `#E85A2B` orange-red is used for ALL brand elements
- **Asymmetric layout** — logo+company LEFT, name+contact RIGHT
- **City skyline** is seeded random vertical bars — must be deterministic
- **Skyline at 60% opacity** — subtle architectural background motif
- **Name and title are RIGHT-ALIGNED** — unusual for business cards
- **QR code** in lower-left area
- **Contact text is GRAY** `#666666` — only non-brand element
- **Front-only reference** — back is inferred complementary design

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutCleanAccent`, line ~1270)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Layout | Logo + name left, contact left, company bottom-right | Logo+company LEFT, name+contact RIGHT | Restructure |
| Bottom bar | Gradient accent bar at bottom 6% | **Not in reference** — skyline instead | Replace with skyline |
| City skyline | **Missing** | Architectural silhouette bottom 35% | Build new |
| Name position | Right of logo, left-aligned | RIGHT-ALIGNED at (95%, 8%) | Reposition |
| Name color | `cfg.textColor` | Fixed `#E85A2B` | Use fixed |
| Title color | `cfg.primaryColor` | `#E85A2B` (same as name) | Consistent |
| Contact alignment | Left-aligned | RIGHT-ALIGNED | Flip |
| QR code | **Missing** | Lower-left at (8%, 45%) | Add |
| Company position | Bottom-right small | Left next to logo at (25%, 25%) | Reposition |
| Separator | At 48% | Not in reference | Remove |
| Back side | **Not implemented** | Solid orange with centered white logo | Build new |

**Verdict: ~10% reusable (logo top-left concept) — near-complete rewrite required.**

---

### AI Design Director Constraints

```yaml
template: clean-accent
constraints:
  - Front background is PURE WHITE
  - Single accent color #E85A2B orange-red — used for ALL brand elements
  - Asymmetric layout: logo+company LEFT, name+title+contact RIGHT-ALIGNED
  - NO gradient accent bar at bottom — has city skyline silhouette instead
  - City skyline spans bottom 35%, vertical bars at 60% opacity
  - Skyline uses seeded random for deterministic rendering
  - QR code in lower-left at (8%, 45%)
  - Contact text is GRAY #666666 — NOT orange
  - Name and title are RIGHT-ALIGNED — unusual layout
  - Company name is UPPERCASE with 0.15em spacing
  - Back is solid #E85A2B with centered white logo and company name
  - NO separator lines
```

---

## Template #17 — nature-clean

**Reference:** `c6ab56c63a6ce1de681aae5201b028cb.jpg` (Bluebat — Razib P. Ferguson, sage green minimalist)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Modern minimalist, professional, design-conscious, digitally forward
**Font Family:** Geometric sans-serif (same family throughout)

### Design DNA

Front has a **light gray background** (`#F5F5F5`) with an asymmetric split: QR code upper-left, contact info center-right with small icons, and a **diagonal sage green banner** spanning the bottom-left (~60% width, angled right edge) containing the name in white. The BLUEBAT logo + icon sits in the white space to the right of the banner. Back is **solid sage green** (`#6B8E7A`) with a large white bird/wing logo icon centered above the company name and tagline. The monochromatic sage green palette creates a nature-forward, trustworthy impression.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Sage green | `#6B8E7A` | 107, 142, 122 | Brand color, banner, contact text, icons, back bg |
| Light gray bg | `#F5F5F5` | 245, 245, 245 | Front background |
| White | `#FFFFFF` | 255, 255, 255 | Name on banner, back text/logo |
| Dark gray | `#2C2C2C` | 44, 44, 44 | BLUEBAT logo text on front |
| Black | `#000000` | 0, 0, 0 | QR code |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌────┐         📍 Address line                    │ 15-25%
│   │ QR │         📞 Phone number                    │
│   │CODE│         🌐 Website                          │ 35%
│   └────┘         ✉  Email                            │
│                                                      │
│  ╔═══════════════════════╗                           │
│  ║ RAZIB P. FERGUSON    ╱    ┌──┐ BLUEBAT           │ 70-80%
│  ║ Web Developer       ╱     │🦇│                    │
│  ╚════════════════════╱      └──┘                    │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#F5F5F5` (light gray, flat solid)

#### QR Code (Upper-Left)
```
Position:   (15%, 25%)
Size:       18% W × 30% H
Color:      #000000 on white
```

#### Contact Info (Center-Right)
```
Position:   (55%, 15%) — right of QR code
Icons:      Small square icons at (52%, aligned), 2%W each, #6B8E7A
Text:       Regular 400, 2.5%H, #6B8E7A, left-aligned
Line gap:   3% of H between lines
Items:      Address, phone, website, email
```

#### Name Banner (Diagonal Stripe)
```
Type:       Geometric diagonal stripe/banner
Position:   (0%, 70%) — extends from left edge
Width:      ~60% of card width
Height:     ~30% of card height
Color:      #6B8E7A (solid sage green)
Right edge: Angled/diagonal cut (not vertical)
```
**Canvas2D:**
```js
ctx.beginPath();
ctx.moveTo(0, H * 0.70);
ctx.lineTo(W * 0.60, H * 0.70);
ctx.lineTo(W * 0.52, H);            // angled right edge
ctx.lineTo(0, H);
ctx.closePath();
ctx.fillStyle = "#6B8E7A";
ctx.fill();
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Name "RAZIB P. FERGUSON" | on banner, left at (8%, 75%) | 700 (Bold) | 4.5% H (~27px) | 0.10em | `#FFFFFF` | UPPERCASE |
| Title "Web Developer" | on banner below name | 400 (Regular) | 2.8% H (~17px) | 0 | `#FFFFFF` | Title Case |
| "BLUEBAT" logo text | (70%, 75%) | 700 (Bold) | 4% H (~24px) | 0.15em | `#2C2C2C` | UPPERCASE |
| Contact text | (55%, 15%+) | 400 (Regular) | 2.5% H (~15px) | 0 | `#6B8E7A` | As-is |

#### BLUEBAT Logo Icon (Front)
```
Type:       Abstract geometric bird/wing shape
Position:   (67%, 75%)
Size:       8% W × 12% H
Color:      #6B8E7A
```

#### Spacing Map — Front

| Measurement | Value |
|---|---|
| Margins | 8% top/bottom, 10% left/right |
| QR code | (15%, 25%), 18%W × 30%H |
| Contact start | (55%, 15%) |
| Contact line gap | 3% of H |
| Banner Y start | 70% |
| Banner width | ~60% of W (with angled edge) |
| Name on banner | left at (8%, 75%) |
| Logo text | right zone at (70%, 75%) |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ┌──────┐ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ 🦇   │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 40%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓ └──────┘ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓ B L U E B A T ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 55%
│▓▓▓▓▓▓ OFFICE INTERIOR DESIGN ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 62%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓ (solid #6B8E7A sage green bg) ▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#6B8E7A` (solid sage green)

#### Typography — Back

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| "BLUEBAT" | (50%, 55%) centered | 700 (Bold) | 8% H (~48px) | 0.20em | `#FFFFFF` | UPPERCASE |
| Tagline "OFFICE INTERIOR DESIGN" | (50%, 62%) centered | 300 (Light) | 2.5% H (~15px) | 0.30em | `#FFFFFF` at 80% | UPPERCASE |

#### Logo Icon (Back) — Large Centered
```
Type:       Abstract geometric bird/wing shape (larger version)
Position:   (45%, 40%) — centered, above text
Size:       12% W × 18% H
Color:      #FFFFFF
```

---

### Logo Treatment Config

```typescript
const natureCleanLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T1",               // standard-small in white space
    position: { x: 0.67, y: 0.75 },
    size: { w: 0.08, h: 0.12 },
    color: "#6B8E7A",
    companionText: true,
    companionTextSize: 0.04,
    companionColor: "#2C2C2C",
    companionSpacing: "0.15em",
    fallbackTechnique: "T1",
  },
  back: {
    technique: "T8",               // primary-hero centered white
    position: { x: 0.50, y: 0.40 },
    size: { w: 0.12, h: 0.18 },
    color: "#FFFFFF",
    companionText: true,
    companionTextSize: 0.08,
    companionColor: "#FFFFFF",
    companionSpacing: "0.20em",
    isHeroElement: true,
    fallbackTechnique: "T1",
    fallbackScale: 0.12,
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#F5F5F5"; ctx.fillRect(0, 0, W, H);
2. QR code: black at (15%, 25%), 18%W × 30%H
3. Contact icons: #6B8E7A squares at (52%, 15%+), 2%W each
4. Contact text: #6B8E7A, 400wt, 2.5%H at (55%, 15%+)
5. Name banner: #6B8E7A diagonal stripe at (0%, 70%), 60%W, angled right
6. "RAZIB P. FERGUSON": #FFFFFF, 700wt, 4.5%H, 0.10em, on banner
7. "Web Developer": #FFFFFF, 400wt, 2.8%H, on banner
8. Bird logo icon: #6B8E7A at (67%, 75%), 8%W
9. "BLUEBAT": #2C2C2C, 700wt, 4%H, 0.15em, right of icon
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#6B8E7A"; ctx.fillRect(0, 0, W, H);
2. Bird logo icon: #FFFFFF at center, 12%W × 18%H
3. "BLUEBAT": #FFFFFF, 700wt, 8%H, 0.20em, centered at (50%, 55%)
4. "OFFICE INTERIOR DESIGN": #FFFFFF at 80%, 300wt, 2.5%H, 0.30em, centered at (50%, 62%)
```

#### Critical Rendering Notes
- **Diagonal banner** has angled right edge — NOT a simple rectangle
- **QR code is prominent** — 18%W × 30%H, upper-left
- **Contact text uses sage green** `#6B8E7A` — NOT gray
- **Name is ON the banner** in white — contrast from green surface
- **BLUEBAT text uses dark gray** `#2C2C2C` on front (in white space area)
- **Back is solid sage green** — no gradient, no pattern
- **Wide letter-spacing on back** — "BLUEBAT" 0.20em, tagline 0.30em (very wide)
- **Monochromatic sage green** throughout — single accent color

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutNatureClean`, line ~1308)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Banner shape | Simple rect at (0, H*0.55), W*0.52 width | Diagonal stripe at (0, H*0.70), angled right edge | Redraw as polygon |
| Banner position | y=55%, 52% wide | y=70%, 60% wide with angle | Adjust |
| Name position | On band at (8%, 55%) | On banner at (8%, 75%) | Move down |
| Title position | Below band | On banner below name | Move onto banner |
| QR code | **Missing** | Upper-left at (15%, 25%), large | Add |
| Contact position | Top-right at (55%, 15%) | (55%, 15%) | ✅ Similar |
| Logo position | Right at (W-mx-logoS, 55%) | (67%, 75%) in white space | Adjust |
| Company text | Right-aligned, near logo | "BLUEBAT" bold text near icon | Restyle |
| Color palette | `cfg.primaryColor` (user) | Fixed `#6B8E7A` | Use fixed |
| Back side | **Not implemented** | Solid sage green, centered white logo | Build |
| Contact icons | Generic `buildContactLayers` | Small square icons, `#6B8E7A` | Customize |

**Verdict: ~15% reusable (banner concept, contact right-side concept) — major rewrite required.**

---

### AI Design Director Constraints

```yaml
template: nature-clean
constraints:
  - Front background is #F5F5F5 light gray
  - Asymmetric layout: QR upper-left, contact center-right, banner bottom-left
  - Name banner is DIAGONAL STRIPE — angled right edge, NOT rectangle
  - Banner spans bottom-left ~60% width, starting at 70% from top
  - Name and title are WHITE ON the sage green banner
  - QR code is LARGE — 18%W × 30%H in upper-left
  - Contact text uses sage green #6B8E7A — NOT gray
  - BLUEBAT logo text uses dark gray #2C2C2C in white space area
  - Back is SOLID #6B8E7A sage green — no gradient
  - Back has white bird/wing icon + "BLUEBAT" centered
  - Tagline uses VERY WIDE 0.30em letter-spacing
  - Monochromatic sage green palette — single accent color
```

---

## Template #18 — diamond-brand

**Reference:** `cc8c90b37ef37d0a0b695b1d2a3cb7f0.jpg` (Company — Jonathan Doe, forest green corporate)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Professional, trustworthy, modern, environmentally conscious
**Font Family:** Geometric sans-serif (same family throughout)

### Design DNA

Front is **solid forest green** (`#2E7D32`) with centered vertical stacking — triangle logo, company name, tagline — plus a **darker green bottom band** (`#1B5E20`, bottom 22%) containing a small circle icon and website URL. All text is white. Back has a **60/40 vertical split** — green left section, white right section. The green left has a small triangle logo at bottom. The white right has name, title, and contact details with color-coded circular contact icons. The monochromatic green palette conveys eco-consciousness and trust.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Forest green | `#2E7D32` | 46, 125, 50 | Front bg, back left section, icon |
| Dark green | `#1B5E20` | 27, 94, 32 | Front bottom band |
| Medium green | `#4CAF50` | 76, 175, 80 | Circle icon, contact icon |
| White | `#FFFFFF` | 255, 255, 255 | Front text, back right bg, logo, company on green |
| Dark gray | `#2E2E2E` | 46, 46, 46 | Back name, contact text |
| Medium gray | `#757575` | 117, 117, 117 | Back title, some icons |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ▲ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 35%
│▓▓▓▓▓▓▓▓▓▓▓▓▓ COMPANY ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 50%
│▓▓▓▓▓▓▓▓▓▓ Your tagline here ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 58%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│████████████████████████████████████████████████████████│ 78%
│██████████████████ ◉ █████████████████████████████████│ 82%
│█████████████ yourwebsite.com ████████████████████████│ 88%
│████████████████████████████████████████████████████████│
└──────────────────────────────────────────────────────┘
```

#### Background — Two-Tone Green
```
Top section (0–78%):    #2E7D32 (forest green)
Bottom band (78–100%):  #1B5E20 (darker green)
Division:               Sharp horizontal line at y = 78%
```

#### Triangle Logo (Front)
```
Type:       Solid upward-pointing triangle
Position:   Centered at (50%, 35%)
Size:       ~8% W × ~5% H
Color:      #FFFFFF
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| "COMPANY" | (50%, 50%) centered | 700 (Bold) | 8% H (~48px) | 0.15em | `#FFFFFF` | UPPERCASE |
| Tagline | (50%, 58%) centered | 300 (Light) | 2.5% H (~15px) | 0 | `#FFFFFF` | Sentence |
| Website | (50%, 88%) centered | 400 (Regular) | 2.8% H (~17px) | 0 | `#FFFFFF` | lowercase |

#### Small Circle Icon (Bottom Band)
```
Type:       Circle with interior element
Position:   (50%, 82%) centered
Size:       ~3% of W
Color:      #4CAF50 (medium green)
```

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────┬───────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│               │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  JONATHAN DOE  │ 45%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  Graphic Design│ 52%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│               │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ◉ phone      │ 62%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ◉ address    │ 72%
│▓▓▓▓▓▓▓▓▓▓ ▲ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ◉ email      │ 82%
│▓▓▓▓▓▓ COMPANY ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│               │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│               │
└──────────────────────────────────────┴───────────────┘
```

#### Background — 60/40 Vertical Split
```
Left section (0–60%):   #2E7D32 (forest green)
Right section (60–100%): #FFFFFF (white)
Division:               Sharp vertical line at x = 60%
```

#### Typography — Back

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Name "JONATHAN DOE" | (75%, 45%) left | 700 (Bold) | 4.5% H (~27px) | 0.10em | `#2E2E2E` | UPPERCASE |
| Title "Graphic Designer" | (75%, 52%) left | 300 (Light) | 2.8% H (~17px) | 0 | `#757575` | Title Case |
| Contact info | (78%, 62%+) left | 400 (Regular) | 2.2% H (~13px) | 0 | `#2E2E2E` | Mixed |
| Company (on green) | (20%, 82%) left | 700 (Bold) | 3% H (~18px) | 0 | `#FFFFFF` | UPPERCASE |

#### Contact Icons (Back — Color-Coded)
```
Type:       Circular icons with symbols (phone, location, email)
Position:   Vertically stacked at (65%, 62/72/82%)
Size:       ~2.5% of W each
Colors:     Phone #4CAF50, Location #757575, Email #2E7D32
Icon-text gap: 3% of W
Vertical gap: 10% of H between icons
```

#### Triangle Logo (Back — Small on Green)
```
Position:   (20%, 75%) — lower-left on green section
Size:       ~4% of W
Color:      #FFFFFF
```

---

### Logo Treatment Config

```typescript
const diamondBrandLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T8",               // primary-hero — centered triangle
    position: { x: 0.50, y: 0.35 },
    size: { w: 0.08, h: 0.05 },
    color: "#FFFFFF",
    style: "triangle",
    isHeroElement: true,
    fallbackTechnique: "T1",
    fallbackScale: 0.08,
  },
  back: {
    technique: "T1",               // standard-small on green section
    position: { x: 0.20, y: 0.75 },
    size: { w: 0.04, h: 0.06 },
    color: "#FFFFFF",
    companionText: true,
    companionTextSize: 0.03,
    companionColor: "#FFFFFF",
    fallbackTechnique: "T1",
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#2E7D32"; ctx.fillRect(0, 0, W, H * 0.78);
   ctx.fillStyle = "#1B5E20"; ctx.fillRect(0, H * 0.78, W, H * 0.22);
2. Triangle: white solid at (50%, 35%), 8%W × 5%H
3. "COMPANY": #FFFFFF, 700wt, 8%H, 0.15em, UPPER, centered at (50%, 50%)
4. Tagline: #FFFFFF, 300wt, 2.5%H, centered at (50%, 58%)
5. Circle icon: #4CAF50 at (50%, 82%), 3%W
6. Website: #FFFFFF, 400wt, 2.8%H, centered at (50%, 88%)
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#2E7D32"; ctx.fillRect(0, 0, W * 0.60, H);
   ctx.fillStyle = "#FFFFFF"; ctx.fillRect(W * 0.60, 0, W * 0.40, H);
2. Small triangle: #FFFFFF at (20%, 75%), 4%W
3. Company name: #FFFFFF, 700wt, 3%H, on green at (20%, 82%)
4. "JONATHAN DOE": #2E2E2E, 700wt, 4.5%H, 0.10em, on white at (75%, 45%)
5. "Graphic Designer": #757575, 300wt, 2.8%H, at (75%, 52%)
6. Contact icons: colored circles at (65%, 62/72/82%), stacked vertically
7. Contact text: #2E2E2E, 400wt, 2.2%H at (78%, 62/72/82%)
```

#### Critical Rendering Notes
- **Two-tone green front** — forest green top, darker bottom band
- **Centered vertical layout** on front — logo → company → tagline
- **60/40 vertical split** on back — green left, white right
- **Color-coded contact icons** — each icon has different green/gray shade
- **Triangle logo** is the brand mark — simple geometric shape
- **Small company text on green section** of back
- **Name/contact on white section** of back — dark text on white

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutDiamondBrand`, line ~1348)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Front background | Default (white?) | Solid `#2E7D32` forest green | Set green |
| Front layout | Logo left, company right, name middle | CENTERED vertical: logo → company → tagline | Restructure |
| Bottom band | **Missing** | `#1B5E20` bottom 22% | Add |
| Triangle logo | Generic `buildLogoLayer` left | White triangle centered at (50%, 35%) | Replace |
| Company position | Right of logo | CENTERED at (50%, 50%), hero text | Reposition |
| Name on front | At (8%, 45%) | **Not on front** — only on back | Move to back |
| Contact on front | Below name | **Not on front** — only on back | Move to back |
| Website | Bottom, left-aligned | Centered at (50%, 88%) on front bottom band | Reposition |
| Back layout | **Not implemented** | 60/40 green/white vertical split | Build new |
| Back contact icons | — | Color-coded circles at 65% from left | Add |
| Circle icon | **Missing** | Small #4CAF50 circle at (50%, 82%) on front | Add |

**Verdict: ~5% reusable (company name concept) — near-complete rewrite required.**

---

### AI Design Director Constraints

```yaml
template: diamond-brand
constraints:
  - Front is SOLID FOREST GREEN #2E7D32 — NOT white
  - Front has DARKER bottom band #1B5E20 at 78% from top (22% height)
  - ALL front text is white #FFFFFF
  - Front layout is CENTERED VERTICAL: triangle → company → tagline
  - Website in bottom dark band, centered
  - Small circle icon #4CAF50 centered above website
  - Back has 60/40 VERTICAL SPLIT — green left, white right
  - Name/title/contact on WHITE section (right)
  - Small triangle logo + company name on GREEN section (left, bottom)
  - Contact icons are COLOR-CODED circles — different green/gray shades
  - Monochromatic green palette: #1B5E20 → #2E7D32 → #4CAF50
  - Triangle is the brand mark — simple solid geometric shape
```

---

## Template #19 — flowing-lines

**Reference:** `41e064a8234880e65ba26f63b0be5b13.jpg` (Curve Studio — Kris Subandi, flowing green lines)
**Canvas:** 1050 × 600 px (standard 3.5:2 @ 300 dpi)
**Mood:** Modern creative, dynamic, professional design studio
**Font Family:** Modern sans-serif (same family throughout)

### Design DNA

Front is **deep forest green** (`#1B4D3E`) with 8–10 **flowing parallel curved bright green lines** (`#00B050`) covering the left 60%, creating an organic S-curve pattern. Brand text (Curve STUDIO + tagline + website) sits in the clear right 40%. Back is **light gray/off-white** (`#F8F8F8`) with name, title, and contact info on the left 60%, while a mirrored continuation of the flowing lines covers the right 40%. The flowing lines create visual continuity across both sides. Strong dark/light contrast between front and back.

### Color Palette

| Token | Hex | RGB | Usage |
|---|---|---|---|
| Deep forest green | `#1B4D3E` | 27, 77, 62 | Front bg, back primary text |
| Bright green | `#00B050` | 0, 176, 80 | Flowing lines, contact icons |
| White | `#FFFFFF` | 255, 255, 255 | Front text |
| Off-white bg | `#F8F8F8` | 248, 248, 248 | Back bg |
| Medium gray | `#666666` | 102, 102, 102 | Back title text |
| Dark gray | `#333333` | 51, 51, 51 | Back contact text |

---

### FRONT SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓ ╭───────╮ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓ │ flowing│ ▓▓▓▓▓▓▓▓▓▓  Curve STUDIO  ▓▓▓▓▓▓▓▓▓▓▓│ 25%
│▓▓ │ curved │ ▓▓▓▓▓▓▓▓▓▓  Your Tagline  ▓▓▓▓▓▓▓▓▓▓▓│ 35%
│▓▓ │ parallel▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓ │ lines  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓ ╰───────╯ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ www.curvestd.com ▓▓▓▓▓▓▓▓▓│ 85%
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#1B4D3E` (deep forest green, flat solid)

#### Flowing Line Pattern (Left 60%)
```
Type:       8-10 parallel curved lines in flowing S-curve pattern
Position:   Left 60% of card, 5% left margin
Color:      #00B050 (bright green)
Stroke:     ~1.5% of card width per line (~16px)
Height:     ~80% of card height
Pattern:    Organic S-curves creating dynamic movement
```
**Canvas2D:**
```js
ctx.strokeStyle = "#00B050";
ctx.lineWidth = W * 0.015;
ctx.lineCap = "round";
for (let i = 0; i < 9; i++) {
  const offsetX = i * W * 0.035;
  ctx.beginPath();
  ctx.moveTo(W * 0.05 + offsetX, H * 0.10);
  ctx.bezierCurveTo(
    W * 0.15 + offsetX, H * 0.25,
    W * 0.05 + offsetX, H * 0.50,
    W * 0.20 + offsetX, H * 0.65
  );
  ctx.bezierCurveTo(
    W * 0.30 + offsetX, H * 0.75,
    W * 0.25 + offsetX, H * 0.85,
    W * 0.15 + offsetX, H * 0.90
  );
  ctx.stroke();
}
```

#### Typography — Front

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| "Curve" | (65%, 25%) right area | 400 (Regular) | 8% H (~48px) | 0 | `#FFFFFF` | Title Case |
| "STUDIO" | right of "Curve" | 700 (Bold) | 8% H (~48px) | 0 | `#FFFFFF` | UPPERCASE |
| Tagline | (65%, 35%) | 300 (Light) | 3% H (~18px) | 0 | `#FFFFFF` | Title Case |
| Website | (65%, 85%) | 400 (Regular) | 2.5% H (~15px) | 0 | `#FFFFFF` | lowercase |

---

### BACK SIDE

#### Layout Diagram
```
┌──────────────────────────────────────────────────────┐
│                                   ╭───────╮          │
│   KRIS SUBANDI                    │ flowing│         │ 25%
│   Director of Creative            │ curved │         │ 35%
│                                   │ parallel         │
│   ◉ phone number                  │ lines  │         │ 50%
│   ◉ email@address.com             │  (mirror)        │ 58%
│   ◉ location address              │       │          │ 66%
│                                   ╰───────╯          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### Background
- Fill entire canvas with `#F8F8F8` (off-white, flat solid)

#### Flowing Lines (Right 40% — Mirror)
```
Type:       6-8 parallel curved lines, mirror/continuation of front
Position:   Right 40% of card, 5% right margin
Color:      #00B050 (bright green)
Stroke:     ~1.5% of card width per line
Height:     ~70% of card height
```

#### Typography — Back

| Element | Position | Weight | Size | Spacing | Color | Case |
|---|---|---|---|---|---|---|
| Name "KRIS SUBANDI" | (15%, 25%) left | 700 (Bold) | 6% H (~36px) | 0 | `#1B4D3E` | UPPERCASE |
| Title "Director of Creative" | (15%, 35%) left | 400 (Regular) | 3% H (~18px) | 0 | `#666666` | Title Case |
| Contact info | (15%, 50%+) left | 400 (Regular) | 2.5% H (~15px) | 0 | `#333333` | Mixed |

#### Contact Icons (Back)
```
Type:       Solid filled circles with symbols
Position:   (12%, 50/58/66%) — left of each contact item
Size:       ~3% of H each
Color:      #00B050 (bright green)
```

---

### Logo Treatment Config

```typescript
const flowingLinesLogoConfig: PerSideLogoTreatment = {
  front: {
    technique: "T3",               // text-wordmark — "Curve STUDIO"
    position: { x: 0.65, y: 0.25 },
    size: { w: 0.30, h: 0.10 },
    color: "#FFFFFF",
    isWordmark: true,
    fallbackTechnique: "T1",
    fallbackScale: 0.10,
  },
  back: {
    technique: "T12",              // no logo on back
    // Name + title + contact fill the back
  },
};
```

---

### Canvas2D Render Recipe

#### Front — Draw Order
```
1. ctx.fillStyle = "#1B4D3E"; ctx.fillRect(0, 0, W, H);
2. Flowing lines: 8-10 parallel bezier curves, #00B050, left 60%
3. "Curve STUDIO": #FFFFFF, 400/700wt, 8%H, at (65%, 25%)
4. "Your Tagline Here": #FFFFFF, 300wt, 3%H, at (65%, 35%)
5. "www.curvestd.com": #FFFFFF, 400wt, 2.5%H, at (65%, 85%)
```

#### Back — Draw Order
```
1. ctx.fillStyle = "#F8F8F8"; ctx.fillRect(0, 0, W, H);
2. Flowing lines: 6-8 mirrored bezier curves, #00B050, right 40%
3. "KRIS SUBANDI": #1B4D3E, 700wt, 6%H, left at (15%, 25%)
4. "Director of Creative": #666666, 400wt, 3%H, left at (15%, 35%)
5. Contact icons: #00B050 circles at (12%, 50/58/66%)
6. Contact text: #333333, 400wt, 2.5%H at (15%, 50/58/66%)
```

#### Critical Rendering Notes
- **Flowing parallel lines** are the signature element — 8-10 smooth bezier S-curves
- **Lines MUST be stroked** (not filled) — parallel with consistent width
- **Lines continue/mirror** between front (left) and back (right)
- **Front is DARK** (`#1B4D3E`), back is LIGHT (`#F8F8F8`) — strong contrast
- **"Curve" in Regular + "STUDIO" in Bold** — mixed weight logo
- **Contact icons are BRIGHT GREEN** (`#00B050`) filled circles
- **Left/right content split** — decorative left on front, text left on back

---

### Gap Analysis — Current Code vs Reference

#### Adapter (`layoutFlowingLines`, line ~1387)
| Aspect | Current Code | Reference Image | Fix |
|---|---|---|---|
| Background | Default (probably white) | `#1B4D3E` deep forest green | Set dark green |
| Flowing lines | Concentric ellipses at (15%, 30%) | 8-10 parallel bezier S-curves | Replace with bezier strokes |
| Lines stroke | Fill ellipses with alpha | Stroked lines, `#00B050`, ~16px | Change to stroke |
| Company position | Right side at (48%, 15%) | (65%, 25%) | Adjust |
| Company weight | 700 | Mixed: "Curve" 400 + "STUDIO" 700 | Split |
| Name position | Bottom left at (10%, 58%) | BACK at (15%, 25%) | Move to back |
| Contact | Below name on front | BACK left side at (15%, 50%+) | Move to back |
| Back side | **Not implemented** | Off-white with mirrored lines + name/contact | Build |
| Back lines | — | 6-8 mirrored curves on right 40% | Add |
| Back contact icons | — | Bright green circles | Add |

**Verdict: ~5% reusable (company right concept) — near-complete rewrite required.**

---

### AI Design Director Constraints

```yaml
template: flowing-lines
constraints:
  - Front background is DEEP FOREST GREEN #1B4D3E — NOT white
  - Flowing lines are 8-10 PARALLEL BEZIER CURVES — NOT concentric ellipses
  - Lines are STROKED (not filled) with #00B050, ~1.5% card width stroke
  - Lines cover left 60% of front card
  - Brand text ("Curve STUDIO") in clear right 40% zone
  - Back is OFF-WHITE #F8F8F8 — light/dark contrast with front
  - Lines MIRROR on back — right 40%, visual continuity
  - Name/title/contact on back LEFT side
  - Contact icons are bright green #00B050 filled circles
  - Front text is ALL WHITE on dark green
  - Back text uses dark green #1B4D3E for name, grays for title/contact
  - "Curve" Regular + "STUDIO" Bold — mixed weight in logo text
```

---

## 20. Neon Watermark (`neon-watermark`)

**Reference image:** `d470b54b4667bbb67204e858d6f0a01f.jpg`
**Style:** Modern corporate with geometric diagonal elements
**Mood:** Trustworthy, professional, modern, sophisticated
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                                  ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱│
│   ┌─────┐                     ╱ ╱ DIAGONAL TEAL SECTION ╱ ╱ ╱ ╱ ╱│
│   │ QR  │                   ╱ ╱    ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱ │
│   │CODE │                 ╱ ╱   John Smith      ╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱  │
│   └─────┘               ╱ ╱    Designation here╱ ╱ ╱ ╱ ╱ ╱ ╱ ╱   │
│                        ╱ ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱    │
│   ────────────────                                                 │
│   📍 Address line                       ╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲     │
│   📞 Phone number                     GEOMETRIC OVERLAY SHAPES     │
│   ✉️  Email address                      70% opacity #B8C5D1       │
│   🌐 Website                            ╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#F5F3F0` (warm off-white) |
| Full coverage | 0, 0, 1050, 600 |

#### Diagonal Teal Section (Main Geometric Element)
| Property | Value |
|----------|-------|
| Shape | Polygon — diagonal cut from upper-center to full right |
| Vertices | `(472, 0)`, `(1050, 0)`, `(1050, 270)`, `(157, 270)` (approx — forms parallelogram/trapezoid occupying upper-right ~55% W × 45% H) |
| Fill | Solid `#2B5F7F` (dark teal blue) |
| Opacity | 100% |
| Canvas2D | `ctx.beginPath(); ctx.moveTo(472,0); ctx.lineTo(1050,0); ctx.lineTo(1050,270); ctx.lineTo(157,270); ctx.closePath(); ctx.fill();` |

#### Geometric Overlay Shapes
| Property | Value |
|----------|-------|
| Shape | 2–3 angular polygons overlapping diagonal section and extending below |
| Region | 60%–100% W, 40%–100% H |
| Fill | `#B8C5D1` (light blue-gray) |
| Opacity | 70% |
| Purpose | Subtle dimensional depth behind contact area |
| Canvas2D | Multiple `beginPath()` polygon fills with `globalAlpha = 0.7` |

*Overlay polygon A (large):*
| Property | Value |
|----------|-------|
| Vertices | `(630, 240)`, `(1050, 240)`, `(1050, 600)`, `(420, 600)` |
| Fill | `#B8C5D1` at 70% |

*Overlay polygon B (smaller accent):*
| Property | Value |
|----------|-------|
| Vertices | `(735, 350)`, `(1050, 350)`, `(1050, 600)`, `(580, 600)` |
| Fill | `#A0B0C0` at 50% |

#### QR Code Placeholder
| Property | Value |
|----------|-------|
| Position | x: 84 (8%), y: 150 (25%) |
| Size | 105 × 105 px (~10% W) |
| Fill | `#2B5F7F` inner pattern, white cells |
| Border | None |
| Tag | `qr-code` |

#### Horizontal Separator Line
| Property | Value |
|----------|-------|
| Position | x: 84 (8%), y: 348 (58%) |
| Size | 315 × 1 px (30% W) |
| Color | `#B8C5D1` (light blue-gray) |
| Opacity | 100% |

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Name | Sans-serif | 400 | 36px (6%H) | Title Case | 0 | `#FFFFFF` | x: 682 (65%), y: 108 (18%) — inside diagonal | Right |
| Designation | Sans-serif | 300 | 15px (2.5%H) | lowercase | 0.1em | `#FFFFFF` | x: 682, y: 150 — below name inside diagonal | Right |
| Address | Sans-serif | 400 | 18px (3%H) | Sentence | 0 | `#2B5F7F` | x: 231 (22%), y: 390 (65%) | Left |
| Phone | Sans-serif | 400 | 18px (3%H) | Sentence | 0 | `#2B5F7F` | x: 231, y: 408 (+18) | Left |
| Email | Sans-serif | 400 | 18px (3%H) | lowercase | 0 | `#2B5F7F` | x: 231, y: 426 (+18) | Left |
| Website | Sans-serif | 400 | 18px (3%H) | lowercase | 0 | `#2B5F7F` | x: 231, y: 444 (+18) | Left |

#### Contact Icons
| Property | Value |
|----------|-------|
| Type | Small circular icons (pin, phone, mail, globe) |
| Size | 12 × 12 px (2% H) each |
| Color | `#2B5F7F` |
| Position | x: 189 (18%), vertically aligned with each contact line |
| Gap from text | 42px (4% W) right of icon center |

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Content margins | 8% (84px) from all edges |
| Name → Designation gap | 6px (1% H) |
| QR top offset | 150px (25% from top) |
| Separator → Contact | 42px (7% H) |
| Contact line spacing | 18px (3% H) between baselines |
| Diagonal section height | 270px (45% H) |

---

### Back Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                         ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱                           │
│                       ╱╱  GEOMETRIC  ╱╱                             │
│                         ╱╱  SHAPES ╱╱    60% opacity                │
│                           ╱╱╱╱╱╱╱╱                                  │
│                                                                     │
│                          ⬡ (hexagon)                                │
│                                                                     │
│                       COMPANY LOGO                                  │
│                                                                     │
│                      YOUR SLOGAN HERE                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#2B5F7F` (dark teal blue) |
| Full coverage | 0, 0, 1050, 600 |

#### Geometric Background Shapes
| Property | Value |
|----------|-------|
| Shape | 2–3 angular polygon shapes |
| Region | 20%–80% W, 60%–100% H |
| Fill | `#1A4A63` (darker teal blue) |
| Opacity | 60% |
| Purpose | Subtle depth / dimensionality on solid background |

*Background polygon A:*
| Property | Value |
|----------|-------|
| Vertices | `(210, 360)`, `(840, 360)`, `(735, 600)`, `(105, 600)` |
| Fill | `#1A4A63` at 60% |

*Background polygon B:*
| Property | Value |
|----------|-------|
| Vertices | `(315, 420)`, `(945, 420)`, `(840, 600)`, `(210, 600)` |
| Fill | `#15405A` at 40% |

#### Hexagonal Logo Placeholder
| Property | Value |
|----------|-------|
| Shape | Regular hexagon outline |
| Center | 525 (50% W), 210 (35% H) |
| Radius | 36px (6% H) — tip-to-tip 72px |
| Stroke | `#FFFFFF`, 2px |
| Fill | None (outline only) |
| Canvas2D | 6-point polygon: `for(i=0;i<6;i++) { angle = i*PI/3 - PI/6; x = cx + r*cos(angle); y = cy + r*sin(angle); }` |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Company Logo | Sans-serif | 700 | 48px (8%H) | UPPERCASE | 0.15em | `#FFFFFF` | x: 525 (50%), y: 330 (55%) | Center |
| Slogan | Sans-serif | 300 | 17px (2.8%H) | UPPERCASE | 0.25em | `#FFFFFF` | x: 525 (50%), y: 390 (65%) | Center |

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Hexagon center from top | 210px (35% H) |
| Hexagon → Company text gap | 48px (8% H) from hexagon bottom |
| Company → Slogan gap | 12px (2% H) |
| All elements centered horizontally at 525px |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Warm Off-White | `#F5F3F0` | Front background |
| Dark Teal Blue | `#2B5F7F` | Diagonal section, back background, contact text, icons |
| Light Blue-Gray | `#B8C5D1` | Geometric overlays (front), separator line |
| Accent Blue-Gray | `#A0B0C0` | Secondary overlay polygon (front) |
| Darker Teal | `#1A4A63` | Back geometric shapes |
| Deep Teal | `#15405A` | Back secondary geometric shape |
| White | `#FFFFFF` | Name/designation text (front), all back text, hexagon stroke |

### Logo Treatment
```typescript
logoConfig: {
  technique: "T3",           // Silhouette / monochrome fill
  placement: "qr-adjacent",  // QR code area on front; hexagon placeholder on back
  frontBehavior: {
    // Front: Logo can replace or sit beside QR code
    position: { x: 84, y: 150 },
    maxSize: { w: 105, h: 105 },
    color: "#2B5F7F",
    opacity: 1.0
  },
  backBehavior: {
    // Back: Logo replaces hexagon placeholder, centered
    position: { x: 489, y: 174 },   // centered at 525 - 36
    maxSize: { w: 72, h: 72 },
    color: "#FFFFFF",
    opacity: 1.0,
    fallback: "hexagon-outline"      // If no logo, show hexagon outline
  },
  compositionAdaptations: {
    "separable": { front: "icon-only-teal", back: "icon-centered-white" },
    "wordmark-only": { front: "wordmark-small-teal", back: "wordmark-centered-white" },
    "lockup-inseparable": { front: "lockup-scaled-teal", back: "lockup-centered-white" },
    "icon-only": { front: "icon-qr-area", back: "icon-centered-white" },
    "emblem": { front: "emblem-scaled-teal", back: "emblem-centered-white" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill background #F5F3F0 (full card)
2. Draw diagonal teal section polygon:
   ctx.fillStyle = '#2B5F7F';
   ctx.beginPath();
   ctx.moveTo(472, 0);
   ctx.lineTo(1050, 0);
   ctx.lineTo(1050, 270);
   ctx.lineTo(157, 270);
   ctx.closePath();
   ctx.fill();
3. Draw geometric overlay A (70% opacity):
   ctx.globalAlpha = 0.7;
   ctx.fillStyle = '#B8C5D1';
   ctx.beginPath();
   ctx.moveTo(630, 240);
   ctx.lineTo(1050, 240);
   ctx.lineTo(1050, 600);
   ctx.lineTo(420, 600);
   ctx.closePath();
   ctx.fill();
4. Draw geometric overlay B (50% opacity):
   ctx.globalAlpha = 0.5;
   ctx.fillStyle = '#A0B0C0';
   ctx.beginPath();
   ctx.moveTo(735, 350);
   ctx.lineTo(1050, 350);
   ctx.lineTo(1050, 600);
   ctx.lineTo(580, 600);
   ctx.closePath();
   ctx.fill();
   ctx.globalAlpha = 1.0;
5. Draw QR code placeholder (105×105 at 84,150)
6. Draw name "John Smith" — white, 36px, 400w, right-aligned inside diagonal
7. Draw designation — white, 15px, 300w, 0.1em spacing, right-aligned below name
8. Draw separator line (315×1 at 84,348) in #B8C5D1
9. Draw contact icons (12×12 circles) at x:189, vertically spaced
10. Draw contact text lines — #2B5F7F, 18px, left-aligned at x:231
```

### Canvas2D Render Recipe — Back
```
1. Fill background #2B5F7F (full card)
2. Draw geometric polygon A (60% opacity):
   ctx.globalAlpha = 0.6;
   ctx.fillStyle = '#1A4A63';
   ctx.beginPath();
   ctx.moveTo(210, 360);
   ctx.lineTo(840, 360);
   ctx.lineTo(735, 600);
   ctx.lineTo(105, 600);
   ctx.closePath();
   ctx.fill();
3. Draw geometric polygon B (40% opacity):
   ctx.globalAlpha = 0.4;
   ctx.fillStyle = '#15405A';
   ctx.beginPath();
   ctx.moveTo(315, 420);
   ctx.lineTo(945, 420);
   ctx.lineTo(840, 600);
   ctx.lineTo(210, 600);
   ctx.closePath();
   ctx.fill();
   ctx.globalAlpha = 1.0;
4. Draw hexagonal logo outline:
   ctx.strokeStyle = '#FFFFFF';
   ctx.lineWidth = 2;
   ctx.beginPath();
   for (let i = 0; i < 6; i++) {
     const angle = i * Math.PI / 3 - Math.PI / 6;
     const px = 525 + 36 * Math.cos(angle);
     const py = 210 + 36 * Math.sin(angle);
     i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
   }
   ctx.closePath();
   ctx.stroke();
5. Draw "COMPANY LOGO" — white, 48px, 700w, 0.15em, centered at y:330
6. Draw "YOUR SLOGAN HERE" — white, 17px, 300w, 0.25em, centered at y:390
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Front background | Warm off-white `#F5F3F0` | Uses `cfg.primaryColor` | ❌ No |
| Diagonal teal section | Polygon with diagonal vertices | Missing entirely — uses ellipse "Watermark Circle" | ❌ No |
| Geometric overlay shapes | 2–3 angular polygons at 70%/50% opacity | Missing entirely | ❌ No |
| QR code | 105×105 at upper-left | Missing entirely | ❌ No |
| Name position | Inside diagonal section, right-aligned, white | Left-aligned at 48%H, italic, uses cfg.textColor | ❌ No |
| Designation | Light 300w, lowercase, white, inside diagonal | Uses "Job Title" label style, uppercase | ❌ No |
| Contact info | Left-aligned at 22%W, 65%H, with icons | Left-aligned but at wrong position | 🟡 ~15% |
| Contact icons | Small circles with pin/phone/mail/globe | Missing | ❌ No |
| Separator line | Horizontal 30%W at 58%H | Missing | ❌ No |
| Back side | Full teal, hexagon, geometric shapes, centered text | No back side implementation | ❌ No |
| Color scheme | Monochromatic teal `#2B5F7F` + warm off-white | Uses cfg.primaryColor throughout | ❌ No |

**Reusability: ~5%** — Only `buildContactLayers` call structure is partially reusable. The entire layout is fundamentally wrong: current code uses a giant translucent circle ("watermark") approach with left-aligned content, whereas the reference has diagonal geometric cuts with asymmetric layout. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: neon-watermark
constraints:
  - background_front: must be solid #F5F3F0 warm off-white
  - background_back: must be solid #2B5F7F dark teal blue
  - diagonal_section: polygon must cut from ~45% left at top to ~15% left at 45% height
  - diagonal_color: must be #2B5F7F teal, 100% opacity
  - geometric_overlays_front: 2 angular polygons in #B8C5D1 and #A0B0C0 at 70%/50%
  - geometric_overlays_back: 2 angular polygons in #1A4A63 and #15405A at 60%/40%
  - name_in_diagonal: positioned inside diagonal section, right-aligned, white
  - designation_style: Light 300 weight, lowercase, white, wide tracking
  - contact_text_color: #2B5F7F teal, not black
  - contact_icons: circular, teal-colored, left of each contact line
  - separator_line: 30% card width, #B8C5D1, at 58% from top
  - qr_code: upper-left at 8%W, 25%H, 10% card width
  - hexagon_back: outlined white hexagon, 2px stroke, centered at 35% from top
  - back_text: centered company + slogan, white, bold + light weights
  - font_hierarchy: name 36px > company-back 48px > contact 18px > slogan 17px > designation 15px
```

---

## 21. Blueprint Tech (`blueprint-tech`)

**Reference image:** `100fa47c63934c79564dc6afa93f3ac0.jpg`
**Style:** Modern minimalist architectural with technical drawing elements
**Mood:** Professional, technical expertise, clean, sophisticated
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                                                                     │
│     ◇ crearquitectura                                              │
│                                                                     │
│                                                                     │
│                                          ┌──────────┐ ◄─orange     │
│                                          │  QR CODE  │   corner    │
│                                          │           │              │
│                                          └──────────┘              │
│                                      crearquitectura.com           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
     Solid gray #6B6B6B background
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#6B6B6B` (medium gray) |
| Full coverage | 0, 0, 1050, 600 |

#### Logo Symbol
| Property | Value |
|----------|-------|
| Type | Geometric abstract architectural mark |
| Position | x: 189 (18%), y: 138 (23%) — left of text logo |
| Size | 24 × 24 px (~4% H) |
| Color | `#FFFFFF` (white) |
| Style | Angular/architectural icon |

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Logo text | Sans-serif | 300 | 36px (6%H) | lowercase | 0 | `#FFFFFF` | x: 220 (21%), y: 150 (25%) | Left |
| Website URL | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#FFFFFF` | x: 788 (75%), y: 510 (85%) | Left |

#### QR Code
| Property | Value |
|----------|-------|
| Position | x: 788 (75%), y: 360 (60%) |
| Size | 126 × 126 px (~12% W, ~21% H) |
| Pattern | Black `#000000` modules on white `#FFFFFF` background |
| Corner accent | Small orange-red triangle at top-right corner |
| Accent color | `#E74C3C` |
| Accent size | ~15×15 px triangle at (914, 360) |

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Left margin | ~20% (210px) from left edge |
| Right margin | ~10% (105px) from right edge |
| Top margin | ~25% (150px) from top |
| Bottom margin | ~15% (90px) from bottom |
| Logo icon → logo text gap | 8px |
| QR code → URL gap | 24px (4% H) |
| QR code and URL right-aligned vertically |

---

### Back Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Ahmad Atef                    ┌────────────────────────────────┐  │
│                                 │                                │  │
│   ARCHITECT                     │    ARCHITECTURAL FLOOR PLAN    │  │
│                                 │    (technical line drawing)    │  │
│                                 │    Light gray #BDC3C7          │  │
│   ● +20 123 456 789             │    ~0.5px thin lines           │  │
│   ● info@crearquitectura.com    │    Rooms, dimensions,          │  │
│   ● crearquitectura.com         │    annotations                 │  │
│                                 │                                │  │
│                                 └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
     White #FFFFFF background
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#FFFFFF` (white) |
| Full coverage | 0, 0, 1050, 600 |

#### Architectural Floor Plan Drawing
| Property | Value |
|----------|-------|
| Type | Technical line drawing — simplified architectural floor plan |
| Region | Right 50% of card (x: 525 → 1050), full height (0 → 600) |
| Line color | `#BDC3C7` (light gray) |
| Line width | 0.5–1px thin strokes |
| Style | Rectangular room outlines, dimension lines, small annotation marks |
| Opacity | 100% (but light color provides subtlety) |
| Bleed | Extends to right edge (no right margin) |
| Canvas2D | Series of `strokeRect()`, thin `lineTo()` calls forming room grid pattern |

*Floor plan rendering — simplified geometric approximation:*
```
Outer wall: strokeRect(525, 30, 495, 540) — 1px #BDC3C7
Room dividers: 
  horizontal: (525, 200) → (1020, 200)
  horizontal: (525, 380) → (850, 380)
  vertical: (700, 30) → (700, 200)
  vertical: (850, 200) → (850, 570)
Inner rooms: additional subdivisions with 0.5px lines
Dimension lines: short tick marks with thin extension lines
Door arcs: small quarter-circle arcs at room entries (~15px radius)
```

#### Contact Icons
| Property | Value |
|----------|-------|
| Type | Small filled circles |
| Size | 9 × 9 px (~1.5% H) each |
| Color | `#2C3E50` (matching text) |
| Position | x: 137 (13%), vertically aligned with each contact line |
| Gap from text | 20px right of icon center |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Name | Sans-serif | 500 | 30px (5%H) | Title Case | 0 | `#2C3E50` | x: 158 (15%), y: 150 (25%) | Left |
| Title | Sans-serif | 300 | 15px (2.5%H) | UPPERCASE | 0.15em | `#7F8C8D` | x: 158, y: 210 (35%) | Left |
| Phone | Sans-serif | 400 | 15px (2.5%H) | Sentence | 0 | `#2C3E50` | x: 158, y: 330 (55%) | Left |
| Email | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#2C3E50` | x: 158, y: 390 (65%) | Left |
| Website | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#2C3E50` | x: 158, y: 450 (75%) | Left |

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Left margin | 15% (158px) from left edge |
| Name → Title gap | 30px (5% H) |
| Title → Phone gap | 120px (20% H) — generous whitespace |
| Contact line spacing | 60px (10% H) between baselines |
| Floor plan starts at 50% W (525px) |
| Floor plan full height with ~30px internal margin |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Medium Gray | `#6B6B6B` | Front background |
| White | `#FFFFFF` | Back background, front text, QR cells |
| Dark Blue-Gray | `#2C3E50` | Back name, contact text, icons |
| Medium Gray Text | `#7F8C8D` | Back title text |
| Light Gray | `#BDC3C7` | Architectural drawing lines |
| Black | `#000000` | QR code modules |
| Orange-Red | `#E74C3C` | QR corner accent triangle |

### Logo Treatment
```typescript
logoConfig: {
  technique: "T3",              // Silhouette / monochrome fill
  placement: "left-branding",   // Front: beside logo text; Back: N/A (name replaces)
  frontBehavior: {
    position: { x: 189, y: 130 },
    maxSize: { w: 24, h: 24 },
    color: "#FFFFFF",
    opacity: 1.0,
    // Logo sits left of "crearquitectura" text
  },
  backBehavior: {
    // Back side has no explicit logo — the name IS the brand
    position: null,
    display: "none"
  },
  compositionAdaptations: {
    "separable": { front: "icon-only-white-small", back: "none" },
    "wordmark-only": { front: "wordmark-as-logo-text", back: "none" },
    "lockup-inseparable": { front: "lockup-scaled-small-white", back: "none" },
    "icon-only": { front: "icon-beside-text-white", back: "none" },
    "emblem": { front: "emblem-small-white", back: "none" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill background #6B6B6B (full card)
2. Draw logo symbol — white geometric mark at (189, 138), 24×24
3. Draw "crearquitectura" — white, 36px, 300w, lowercase, left-aligned at (220, 150)
4. Draw QR code:
   a. White background rect (126×126) at (788, 360)
   b. Black QR module pattern
   c. Orange-red triangle accent at top-right corner:
      ctx.fillStyle = '#E74C3C';
      ctx.beginPath();
      ctx.moveTo(914, 360);
      ctx.lineTo(914, 375);
      ctx.lineTo(899, 360);
      ctx.closePath();
      ctx.fill();
5. Draw "crearquitectura.com" — white, 15px, 400w, at (788, 510)
```

### Canvas2D Render Recipe — Back
```
1. Fill background #FFFFFF (full card)
2. Draw architectural floor plan (right 50%):
   ctx.strokeStyle = '#BDC3C7';
   ctx.lineWidth = 1;
   // Outer walls
   ctx.strokeRect(525, 30, 495, 540);
   // Room dividers
   ctx.beginPath();
   ctx.moveTo(525, 200); ctx.lineTo(1020, 200);
   ctx.moveTo(525, 380); ctx.lineTo(850, 380);
   ctx.moveTo(700, 30); ctx.lineTo(700, 200);
   ctx.moveTo(850, 200); ctx.lineTo(850, 570);
   ctx.stroke();
   // Inner subdivisions (0.5px)
   ctx.lineWidth = 0.5;
   // Additional room lines, dimension marks, door arcs
   ctx.beginPath();
   ctx.moveTo(700, 200); ctx.lineTo(700, 380);
   ctx.moveTo(600, 380); ctx.lineTo(600, 570);
   ctx.stroke();
   // Door arcs (quarter circles)
   ctx.beginPath();
   ctx.arc(700, 200, 15, 0, Math.PI/2);
   ctx.stroke();
3. Draw name "Ahmad Atef" — #2C3E50, 30px, 500w, at (158, 150)
4. Draw "ARCHITECT" — #7F8C8D, 15px, 300w, UPPERCASE, 0.15em, at (158, 210)
5. Draw contact icons — small #2C3E50 filled circles at x:137, y: 330/390/450
6. Draw contact text — #2C3E50, 15px, 400w, at x:158, y: 330/390/450
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Front background | Solid gray `#6B6B6B` | Uses `cfg.secondaryColor` at 8% opacity top bar | ❌ No |
| Logo placement | Small icon + text at left 20%, 25% | Logo at top-left with company beside, wrong position | 🟡 ~10% |
| QR code | Right side 75%, with orange corner accent | Has "QR Accent" rect but wrong style/position | ❌ No |
| Orange accent | `#E74C3C` triangle on QR corner | Missing entirely | ❌ No |
| Website URL | Below QR, white, lowercase | Missing entirely | ❌ No |
| Back side layout | Left text + right floor plan drawing | No back side implementation | ❌ No |
| Floor plan drawing | Technical line art, right 50% | Missing entirely | ❌ No |
| Name styling | 500w, Title Case, `#2C3E50` | 700w bold, uses cfg.textColor | ❌ No |
| Title styling | 300w Light, UPPERCASE, gray `#7F8C8D`, wide tracking | 400w, no uppercase, no tracking | ❌ No |
| Contact spacing | 10% H between items, generous whitespace | Compact spacing | ❌ No |
| Color scheme | Gray front / white back, monochrome + orange | Uses cfg.primaryColor throughout | ❌ No |

**Reusability: ~5%** — The basic structure of having a company label and contact layers exists, but ALL positions, colors, weights, and the entire front/back concept are wrong. The defining features — gray solid front, architectural floor plan drawing, QR with orange accent corner — are completely missing. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: blueprint-tech
constraints:
  - background_front: must be solid #6B6B6B medium gray
  - background_back: must be solid #FFFFFF white
  - logo_text: lowercase "crearquitectura" style, Light 300 weight, white
  - logo_icon: small geometric architectural mark left of text, white
  - qr_code_position: right side at 75% from left, 60% from top
  - qr_accent: orange-red #E74C3C triangle at QR top-right corner
  - website_below_qr: lowercase URL below QR code, white
  - back_name: Title Case, 500 weight, #2C3E50, left-aligned at 15%
  - back_title: UPPERCASE, 300 weight, #7F8C8D, 0.15em tracking
  - architectural_drawing: right 50% of back, light gray #BDC3C7 thin lines
  - drawing_bleeds_right: floor plan extends to right edge
  - contact_icons: small filled circles, #2C3E50
  - generous_contact_spacing: 10% H between contact lines
  - no_logo_on_back: name serves as branding on back side
  - font_hierarchy: logo-front 36px > name-back 30px > title/contact/url 15px
```

---

## 22. Skyline Silhouette (`skyline-silhouette`)

**Reference image:** `f7aaa659853a816e36f98a2513b16387.jpg`
**Style:** Modern corporate real estate with layered cityscape
**Mood:** Professional, urban, established, trustworthy
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                 light #F5F5F5                                       │
│                                                                     │
│               🏢 REAL ESTATE                                        │
│            YOUR TAGLINE GOES HERE                                   │
│                                                                     │
│    ░░░░░                                                            │
│  ░░░░░░░░░░   ░░░   ░░░░░░  ░░  ░░░░░  ░░░░   ░░░   ░░░░  ░░░░   │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ████████████████████████████████████████████████████████████████████ │
│ ████████████ LAYERED CITYSCAPE SILHOUETTE ██████████████████████████ │
│ ████████████████ dark #1A1A1A ██████████████████████████████████████ │
│                   www.yourwebsite.com                                │
└─────────────────────────────────────────────────────────────────────┘
     Gradient: #F5F5F5 (top) → #1A1A1A (bottom ~70%)
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Linear gradient top → bottom |
| Gradient | `#F5F5F5` (0%) → `#E0E0E0` (50%) → `#1A1A1A` (70%) → `#1A1A1A` (100%) |
| The skyline area merges into the dark gradient seamlessly |

#### Building Icon (Logo Mark)
| Property | Value |
|----------|-------|
| Type | Geometric building silhouette — 3 rectangular buildings of varying heights |
| Position | x: 441 (42%), y: 120 (20%) |
| Size | ~42 × 48 px (4%W × 8%H) |
| Color | `#2C2C2C` |
| Style | Clean rectangular outlines, tallest center, shorter flanking |
| Canvas2D | 3 `fillRect()` calls: left short, center tall, right medium |

#### City Skyline Silhouette (Multi-layer)
| Property | Value |
|----------|-------|
| Region | Full width (0–1050), bottom 35% (y: 390 → 600) |
| Layers | 4–5 depth layers creating parallax effect |
| Colors | Back layer: `#E0E0E0` → Mid layers: `#999999`, `#666666` → Front: `#1A1A1A` |

*Layer 1 (farthest — lightest):*
| Property | Value |
|----------|-------|
| Y start | 390 (65% H) |
| Color | `#E0E0E0` |
| Shape | Irregular polygon — shorter, wider building forms |

*Layer 2:*
| Property | Value |
|----------|-------|
| Y start | 420 (70% H) |
| Color | `#AAAAAA` |
| Shape | Medium-height varied buildings |

*Layer 3:*
| Property | Value |
|----------|-------|
| Y start | 450 (75% H) |
| Color | `#666666` |
| Shape | Taller prominent buildings |

*Layer 4 (nearest — darkest):*
| Property | Value |
|----------|-------|
| Y start | 480 (80% H) |
| Color | `#1A1A1A` |
| Shape | Largest foreground buildings, merges with dark background |
| Bottom fill | Solid `#1A1A1A` from base of layer to card bottom |

*Skyline rendering approach:*
Each layer is a polygon with irregular top edge (building roofline) and flat bottom:
```
ctx.beginPath();
ctx.moveTo(0, layerBaseY);
// Series of lineTo() calls tracing building rooflines
// Varying widths (30-80px) and heights (20-120px above baseY)
ctx.lineTo(1050, layerBaseY);
ctx.lineTo(1050, 600);
ctx.lineTo(0, 600);
ctx.closePath();
ctx.fill();
```

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Company "REAL ESTATE" | Sans-serif geometric | 700 | 36px (6%H) | UPPERCASE | 0 | `#2C2C2C` | x: 651 (62%), y: 132 (22%) | Left (beside icon) |
| Tagline | Sans-serif | 400 | 12px (2%H) | UPPERCASE | 0.15em | `#666666` | x: 651 (62%), y: 168 (28%) | Left |
| Website | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#FFFFFF` | x: 525 (50%), y: 552 (92%) | Center |

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Top margin | 15% (90px) |
| Logo icon → text gap | 10px |
| Company → Tagline gap | 18px (3% H) |
| Skyline starts at | 65% H (390px) |
| Website from bottom | 8% (48px) |
| All branding centered horizontally as a group |

---

### Back Side

```
┌────────────────────────────┬────────────────────────────────────────┐
│    light gradient           │         solid #2C2C2C                 │
│                             │                                       │
│    🏢 REAL ESTATE           │    STEWART CLARK                      │
│    YOUR TAGLINE             │    REAL ESTATE AGENT                  │
│                             │                                       │
│                             │    📞 +61 123 456 789                 │
│   ░░░░░                     │    📞 +61 123 456 789                 │
│  ░░░░░░░░  ░░░  ░░░░       │                                       │
│ ░░░░░░░░░░░░░░░░░░░░       │    🌐 www.reallygreatsite.com         │
│ ██████████████████████      │    ✉️  hello@reallygreatsite.com       │
│ ██████████████████████      │                                       │
│                             │    📍 123 Anywhere St, City           │
└────────────────────────────┴────────────────────────────────────────┘
     50/50 vertical split
```

#### Left Panel — Gradient with Skyline
| Property | Value |
|----------|-------|
| Region | 0–525 W, 0–600 H (left 50%) |
| Background | Same gradient as front: `#F5F5F5` → `#1A1A1A` |
| Logo icon | Building silhouette at x: 105 (20% of panel), y: 180 (30%) |
| Logo icon size | ~32 × 36 px |
| Logo icon color | `#2C2C2C` |
| Company text | "REAL ESTATE" — `#2C2C2C`, 24px, 700w, beside icon |
| Tagline | Below company, small text, `#666666` |
| Skyline | Same layered cityscape, bottom 35%, clipped to left 50% |

#### Right Panel — Dark Contact
| Property | Value |
|----------|-------|
| Region | 525–1050 W, 0–600 H (right 50%) |
| Background | Solid `#2C2C2C` |

#### Contact Icons
| Property | Value |
|----------|-------|
| Type | Minimalist line icons (phone, globe, pin) |
| Size | ~12 × 12 px (2% W) |
| Color | `#FFFFFF` at 80% opacity |
| Position | x: 651 (62% W), vertically aligned with each contact group |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Name | Sans-serif | 700 | 30px (5%H) | UPPERCASE | 0 | `#FFFFFF` | x: 735 (70%), y: 150 (25%) | Left |
| Title | Sans-serif | 400 | 15px (2.5%H) | UPPERCASE | 0.1em | `#CCCCCC` | x: 735, y: 192 (32%) | Left |
| Phone 1 | Sans-serif | 400 | 15px (2.5%H) | Sentence | 0 | `#FFFFFF` | x: 735, y: 270 (45%) | Left |
| Phone 2 | Sans-serif | 400 | 15px (2.5%H) | Sentence | 0 | `#FFFFFF` | x: 735, y: 318 (53%) | Left |
| Website | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#FFFFFF` | x: 735, y: 390 (65%) | Left |
| Email | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#FFFFFF` | x: 735, y: 420 (70%) | Left |
| Address | Sans-serif | 400 | 15px (2.5%H) | Sentence | 0 | `#FFFFFF` | x: 735, y: 480 (80%) | Left |

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Left/right split | Exact 50% (525px) |
| Right panel margins | 15% from panel edges |
| Name → Title gap | 12px |
| Title → Phone gap | 78px (13% H) |
| Contact group spacing | 48px (8% H) between sections |
| Icons at 62% W, text at 70% W |
| Left panel: same gradient + skyline as front, clipped |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Light Gray | `#F5F5F5` | Gradient start (top) |
| Mid Light Gray | `#E0E0E0` | Skyline back layer |
| Mid Gray | `#AAAAAA` | Skyline mid layer |
| Dark Gray | `#666666` | Tagline text, skyline layer |
| Near Black | `#2C2C2C` | Company text, right panel background, building icon |
| Black | `#1A1A1A` | Gradient end, foreground skyline |
| White | `#FFFFFF` | Website (front), all contact text (back) |
| Light Gray Text | `#CCCCCC` | Title text (back) |

### Logo Treatment
```typescript
logoConfig: {
  technique: "T3",              // Silhouette / monochrome fill
  placement: "centered-branding", // Front: centered above skyline; Back: left panel
  frontBehavior: {
    // Logo replaces building icon, sits left of "REAL ESTATE" text
    position: { x: 441, y: 120 },
    maxSize: { w: 42, h: 48 },
    color: "#2C2C2C",
    opacity: 1.0
  },
  backBehavior: {
    // Logo in left panel at 20% width, 30% height
    position: { x: 105, y: 168 },
    maxSize: { w: 32, h: 36 },
    color: "#2C2C2C",
    opacity: 1.0
  },
  compositionAdaptations: {
    "separable": { front: "icon-beside-text", back: "icon-left-panel" },
    "wordmark-only": { front: "wordmark-replaces-company", back: "wordmark-left-panel" },
    "lockup-inseparable": { front: "lockup-centered-above-skyline", back: "lockup-left-panel" },
    "icon-only": { front: "icon-above-company", back: "icon-left-panel" },
    "emblem": { front: "emblem-centered", back: "emblem-left-panel" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Draw gradient background:
   const grad = ctx.createLinearGradient(0, 0, 0, 600);
   grad.addColorStop(0, '#F5F5F5');
   grad.addColorStop(0.5, '#E0E0E0');
   grad.addColorStop(0.7, '#1A1A1A');
   grad.addColorStop(1, '#1A1A1A');
   ctx.fillStyle = grad;
   ctx.fillRect(0, 0, 1050, 600);
2. Draw building icon (3 rectangles):
   ctx.fillStyle = '#2C2C2C';
   ctx.fillRect(441, 136, 12, 32);  // left building (short)
   ctx.fillRect(455, 120, 14, 48);  // center building (tall)
   ctx.fillRect(471, 130, 12, 38);  // right building (medium)
3. Draw "REAL ESTATE" — #2C2C2C, 36px, 700w, UPPERCASE at (651, 132)
4. Draw tagline — #666666, 12px, 400w, UPPERCASE, 0.15em at (651, 168)
5. Draw skyline layers (back to front):
   // Layer 1 (lightest)
   ctx.fillStyle = '#E0E0E0';
   ctx.beginPath();
   ctx.moveTo(0, 430);
   // Building roofline path...
   ctx.lineTo(1050, 440); ctx.lineTo(1050, 600); ctx.lineTo(0, 600);
   ctx.closePath(); ctx.fill();
   // Layer 2
   ctx.fillStyle = '#AAAAAA';
   // Similar polygon with taller buildings...
   // Layer 3
   ctx.fillStyle = '#666666';
   // ...
   // Layer 4 (darkest, foreground)
   ctx.fillStyle = '#1A1A1A';
   // Tallest buildings, solid fill to bottom
6. Draw "www.yourwebsite.com" — #FFFFFF, 15px, 400w, centered at (525, 552)
```

### Canvas2D Render Recipe — Back
```
1. Draw left panel gradient (0–525):
   ctx.save();
   ctx.beginPath();
   ctx.rect(0, 0, 525, 600);
   ctx.clip();
   // Same gradient as front
   const grad = ctx.createLinearGradient(0, 0, 0, 600);
   grad.addColorStop(0, '#F5F5F5');
   grad.addColorStop(0.5, '#E0E0E0');
   grad.addColorStop(0.7, '#1A1A1A');
   grad.addColorStop(1, '#1A1A1A');
   ctx.fillStyle = grad;
   ctx.fillRect(0, 0, 525, 600);
   // Draw skyline layers (same as front, clipped to left half)
   // ... layer polygons ...
   ctx.restore();
2. Draw right panel:
   ctx.fillStyle = '#2C2C2C';
   ctx.fillRect(525, 0, 525, 600);
3. Draw logo icon in left panel — #2C2C2C, 3 rects at (105, 180)
4. Draw company text in left panel — #2C2C2C, small
5. Draw name "STEWART CLARK" — #FFFFFF, 30px, 700w, UPPERCASE at (735, 150)
6. Draw title "REAL ESTATE AGENT" — #CCCCCC, 15px, 400w, UPPERCASE, 0.1em at (735, 192)
7. Draw contact icons — #FFFFFF 80% opacity, 12×12 at x:651
8. Draw contact text lines — #FFFFFF, 15px, 400w at x:735
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Background | Gradient `#F5F5F5` → `#1A1A1A` | No gradient — relies on default card bg | ❌ No |
| Skyline | 4–5 layered silhouette polygons with depth/parallax | 14 simple `fillRect` buildings, single opacity, single color | 🟡 ~15% (concept only) |
| Building icon | 3-rect geometric mark centered above skyline | Missing — uses generic buildLogoLayer | ❌ No |
| Front layout | Centered branding, skyline bottom 35%, website at bottom | Left-aligned logo/company at top, contact at middle | ❌ No |
| Back side | 50/50 split — gradient+skyline left, dark panel right | No back side implementation | ❌ No |
| Company text | "REAL ESTATE", 700w, UPPERCASE, centered above skyline | Left-aligned, beside logo, non-uppercase | ❌ No |
| Name position | Back only, right panel, UPPERCASE, white | Front side, non-uppercase | ❌ No |
| Color scheme | Monochromatic grayscale gradient | Uses cfg.primaryColor throughout | ❌ No |
| Layered depth | Multi-layer parallax skyline (4+ depth layers) | Flat rectangles, no depth effect | ❌ No |
| Website URL | White, centered at bottom over dark area | Missing entirely | ❌ No |
| Tagline | UPPERCASE, wide tracking, `#666666` | Optional, different styling | ❌ No |

**Reusability: ~10%** — The concept of building rectangles at the bottom exists, but the execution is completely wrong (flat rects vs. layered polygon silhouettes). No gradient, no depth layers, no split back, no centered branding. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: skyline-silhouette
constraints:
  - background_front: linear gradient #F5F5F5 → #E0E0E0 → #1A1A1A (top to ~70%)
  - skyline_layers: 4-5 depth layers from #E0E0E0 (back) to #1A1A1A (front)
  - skyline_region: bottom 35% of card (y: 390 → 600)
  - skyline_polygon: each layer is irregular polygon tracing building rooflines
  - building_icon: 3-rectangle geometric mark, #2C2C2C, centered
  - company_text: UPPERCASE "REAL ESTATE" beside icon, 700w, #2C2C2C
  - tagline: UPPERCASE, 0.15em tracking, #666666
  - branding_centered: logo+company group horizontally centered on front
  - website_bottom: white text over dark gradient, centered at 92% from top
  - back_split: exact 50/50 vertical split
  - back_left: same gradient + skyline as front, clipped to 50% width
  - back_right: solid #2C2C2C with white contact info
  - name_back_only: name appears on back right panel, not on front
  - contact_icons: white line icons at 80% opacity
  - contact_spacing: 8% H between contact groups
  - font_hierarchy: company-front 36px > name-back 30px > contact/title/tagline 15px > tagline-front 12px
```

---

## 23. World Map (`world-map`)

**Reference image:** `Digital Marketing Agency Visiting Card.jpg`
**Style:** Modern corporate tech, clean minimalist with blue-orange branding
**Mood:** Professional, innovative, approachable, trustworthy
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                                                                     │
│     ● web.gurus             James Millner                           │
│    ┌──────────────┐         President/CEO                           │
│    │web redefined │                                                 │
│    └──────────────┘         5200 Willson Road                       │
│                             Minneapolis, MN 55424                   │
│                                                                     │
│                             🟠 P: (123) 456-7890                    │
│                             🟠 F: (123) 456-7891                    │
│                             🟠 info@webgurus.com                    │
│                             🟠 www.webgurus.com                     │
└─────────────────────────────────────────────────────────────────────┘
     White #FFFFFF background     Split: Left 45% branding | Right 55% contact
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#FFFFFF` (pure white) |
| Full coverage | 0, 0, 1050, 600 |

#### Logo / Company Name ("web.gurus")
| Property | Value |
|----------|-------|
| Position | x: 158 (15%), y: 210 (35%) |
| Text | "web.gurus" |
| "web." portion | Weight 400, color `#2B5A9E` |
| ".gurus" portion | Weight 700, color `#2B5A9E` |
| Size | 48px (8% H) |
| Case | lowercase |
| Note | Two-part rendering: regular "web." + bold "gurus" |

#### Tagline Badge ("web redefined")
| Property | Value |
|----------|-------|
| Position | x: 158 (15%), y: 268 (28% below company) |
| Text | "web redefined" |
| Font | Sans-serif, 400w, 15px (2.5%H), lowercase |
| Text color | `#FFFFFF` |
| Background | Rounded rectangle `#E67E22` (orange) |
| Padding | 4px all sides |
| Corner radius | 3px |
| Size | ~width auto × 23px height |

#### Orange Contact Icons
| Property | Value |
|----------|-------|
| Type | Filled circles with white icon glyphs inside |
| Size | 12 × 12 px (~2% H diameter) |
| Color | `#E67E22` (orange) |
| Position | x: 578 (55%), vertically aligned at y: 390, 408, 426, 444 (65–80% H) |
| Icons | Phone, fax, email, globe |

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Company "web." | Sans-serif geometric | 400 | 48px (8%H) | lowercase | 0 | `#2B5A9E` | x: 158 (15%), y: 210 (35%) | Left |
| Company "gurus" | Sans-serif geometric | 700 | 48px (8%H) | lowercase | 0 | `#2B5A9E` | Immediately after "web." | Left |
| Tagline | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#FFFFFF` | x: 158, y: 268 (on orange bg) | Left |
| Name | Sans-serif | 700 | 27px (4.5%H) | Title Case | 0 | `#2B5A9E` | x: 578 (55%), y: 120 (20%) | Left |
| Title | Sans-serif | 400 | 18px (3%H) | Title Case | 0 | `#7B8A8B` | x: 578, y: 156 | Left |
| Address L1 | Sans-serif | 400 | 17px (2.8%H) | Sentence | 0 | `#34495E` | x: 578, y: 210 | Left |
| Address L2 | Sans-serif | 400 | 17px (2.8%H) | Sentence | 0 | `#34495E` | x: 578, y: 234 | Left |
| Phone | Sans-serif | 400 | 17px (2.8%H) | Sentence | 0 | `#34495E` | x: 600 (after icon), y: 390 | Left |
| Fax | Sans-serif | 400 | 17px (2.8%H) | Sentence | 0 | `#34495E` | x: 600, y: 408 | Left |
| Email | Sans-serif | 400 | 17px (2.8%H) | lowercase | 0 | `#34495E` | x: 600, y: 426 | Left |
| Website | Sans-serif | 400 | 17px (2.8%H) | lowercase | 0 | `#34495E` | x: 600, y: 444 | Left |

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Left margin | 15% (158px) |
| Right margin | 10% (105px) |
| Top margin | 20% (120px) |
| Left zone | 0–45% W (branding: logo + tagline) |
| Right zone | 55–100% W (contact: name, title, address, contact) |
| Gap between zones | 10% W (~105px) |
| Contact icon → text gap | 22px |
| Contact line spacing | 18px (3% H) between baselines |
| Logo → tagline gap | 10px |
| Name → title gap | 9px |

---

### Back Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Deep Blue #2B5A9E                          │
│                                                                     │
│                                                                     │
│                    ┌──────────────┐                                 │
│                    │web redefined │  orange badge                    │
│                    └──────────────┘                                 │
│                                                                     │
│                     ● web.gurus                                     │
│                       (large, white)                                │
│                                                                     │
│                                                                     │
│             🟠 f webredefined    🟠 @webgurusuk                    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#2B5A9E` (deep blue) |
| Full coverage | 0, 0, 1050, 600 |

#### Company Logo (Centered, Large)
| Property | Value |
|----------|-------|
| Position | Centered at x: 525 (50%), y: 270 (45%) |
| Text | "web.gurus" |
| "web." portion | Weight 400, color `#FFFFFF` |
| ".gurus" portion | Weight 700, color `#FFFFFF` |
| Size | 72px (12% H) |
| Case | lowercase |
| Align | Center |

#### Tagline Badge (Centered, Above Logo)
| Property | Value |
|----------|-------|
| Position | Centered at x: 525, y: 210 (35%) — above company text |
| Text | "web redefined" |
| Font | 15px, 400w, lowercase, `#FFFFFF` on `#E67E22` background |
| Background | Rounded rectangle, 3px radius |

#### Social Media Handles
| Property | Value |
|----------|-------|
| Position | Centered at x: 525, y: 510 (85%) |
| Items | Facebook handle + Twitter handle |
| Font | 18px (3%H), 400w, `#FFFFFF` |
| Icons | Orange circles `#E67E22` with white social media glyphs |
| Layout | Horizontal, centered, ~40px gap between items |

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Top/bottom margins | 15% (90px) |
| Left/right margins | 10% (105px) |
| Tagline badge → Company gap | 30px |
| All elements centered horizontally |
| Social handles at 85% from top |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Deep Blue | `#2B5A9E` | Primary brand, front text, back background |
| Orange | `#E67E22` | Accent — icons, tagline badge bg, social icons |
| Dark Gray | `#34495E` | Contact text, address |
| Medium Gray | `#7B8A8B` | Job title |
| White | `#FFFFFF` | Front background, back text, tagline text |

### Logo Treatment
```typescript
logoConfig: {
  technique: "T1",              // Original / full-color
  placement: "left-branding",   // Front: left zone; Back: centered large
  frontBehavior: {
    // Logo sits above or beside "web.gurus" text in left zone
    position: { x: 158, y: 168 },
    maxSize: { w: 60, h: 36 },
    color: "#2B5A9E",
    opacity: 1.0,
    // When user uploads logo, it replaces the "web." icon/dot
  },
  backBehavior: {
    // Logo centered, larger, above "web.gurus" text
    position: { x: 495, y: 232 },
    maxSize: { w: 60, h: 60 },
    color: "#FFFFFF",
    opacity: 1.0
  },
  compositionAdaptations: {
    "separable": { front: "icon-left-blue", back: "icon-centered-white" },
    "wordmark-only": { front: "wordmark-as-company", back: "wordmark-centered-white" },
    "lockup-inseparable": { front: "lockup-left-zone", back: "lockup-centered-white" },
    "icon-only": { front: "icon-above-company", back: "icon-centered-white-large" },
    "emblem": { front: "emblem-left-blue", back: "emblem-centered-white" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill background #FFFFFF (full card)
2. Draw company logo mark (if any) at (158, 168)
3. Draw "web." — #2B5A9E, 48px, 400w, lowercase at (158, 210)
4. Draw "gurus" — #2B5A9E, 48px, 700w, lowercase (appended after "web.")
5. Draw tagline badge:
   a. Measure text "web redefined" width
   b. ctx.fillStyle = '#E67E22';
   c. roundRect(158, 260, textWidth+8, 23, 3);
   d. ctx.fillStyle = '#FFFFFF';
   e. fillText("web redefined", 162, 277);
6. Draw "James Millner" — #2B5A9E, 27px, 700w at (578, 120)
7. Draw "President/CEO" — #7B8A8B, 18px, 400w at (578, 156)
8. Draw address lines — #34495E, 17px, 400w at (578, 210) and (578, 234)
9. Draw orange contact icons (filled circles 12×12) at x:578, y: 390/408/426/444
10. Draw contact text — #34495E, 17px, 400w at x:600, y: 390/408/426/444
```

### Canvas2D Render Recipe — Back
```
1. Fill background #2B5A9E (full card)
2. Draw tagline badge (centered):
   a. Measure "web redefined", center horizontally
   b. Orange rounded rect + white text
3. Draw "web." — #FFFFFF, 72px, 400w, centered at y:270
4. Draw "gurus" — #FFFFFF, 72px, 700w (appended)
5. Draw social media section at y:510:
   a. Orange circle icons (12×12) for Facebook, Twitter
   b. White text: "f webredefined" and "@webgurusuk"
   c. Horizontally centered with 40px gap
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Front background | White `#FFFFFF` | No explicit background | 🟡 ~20% |
| Company styling | "web.gurus" split weight (400/700), blue, lowercase | Single weight, UPPERCASE, different positioning | ❌ No |
| Tagline badge | Orange rounded rect with white text | Missing entirely | ❌ No |
| Layout | Left/right split (45/55) with clear zones | Large map watermark rect, name top-left, contact boxed | ❌ No |
| Contact icons | Orange filled circles with glyphs | Uses generic buildContactLayers | ❌ No |
| Name position | Right zone at 55% W, 20% H | Top left at margins, UPPERCASE, XL size | ❌ No |
| Title color | Gray `#7B8A8B` | Uses cfg.textColor with 0.5 alpha | ❌ No |
| Back side | Deep blue, centered large logo, social handles | No back side implementation | ❌ No |
| Color scheme | Blue `#2B5A9E` + Orange `#E67E22` complementary | Uses cfg.primaryColor | ❌ No |
| Social media | Orange icon circles + white handles at bottom | Missing entirely | ❌ No |
| Contact box | No box — inline contact with icons | Has "Contact Box" rect at 55%H | ❌ No |

**Reusability: ~5%** — The basic text layer structure is reusable but ALL positions, colors, weights, and layout concepts are wrong. The defining features — split-weight company name, orange tagline badge, orange icon circles, blue/orange complementary palette, social media section — are completely missing. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: world-map
constraints:
  - background_front: solid #FFFFFF white
  - background_back: solid #2B5A9E deep blue
  - split_layout: left 45% branding, right 55% contact info
  - company_split_weight: "web." at 400w + "gurus" at 700w, both #2B5A9E
  - company_lowercase: must be lowercase, no uppercase
  - tagline_badge: "web redefined" in white text on #E67E22 orange rounded rect
  - name_right_zone: Title Case, 700w, #2B5A9E, at 55% from left
  - title_gray: #7B8A8B, not black
  - contact_icons: orange #E67E22 filled circles, left of each contact line
  - contact_text: #34495E dark gray
  - back_logo_centered: larger "web.gurus" in white, centered
  - back_tagline: same orange badge, centered above logo
  - social_handles: bottom center, orange icons + white text
  - color_palette: complementary blue-orange scheme
  - font_hierarchy: back-logo 72px > front-logo 48px > name 27px > contact 17-18px > tagline 15px
```

---

## 24. Diagonal Gold (`diagonal-gold`)

**Reference image:** `cb46462df8438908f1a51e56bb563ef6.jpg`
**Style:** Luxury corporate with diagonal white band and gold accents
**Mood:** Premium, trustworthy, established, exclusive
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌─────────────────────────────────────────────────────────────────────┐
│    Dark Teal #1A4A47                                                │
│                                                                     │
│              ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱   │
│            ╱  WHITE DIAGONAL BAND (~15° clockwise)         ╱╱╱     │
│     CHARLES JONES          ═══ gold strip ═══            ╱╱╱       │
│     CONSTRUCTION CONSULTANT                            ╱╱╱         │
│            ╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱╱            │
│   🟡📞 +1 (555) 123 4567                                           │
│   🟡✉️  charlesj@email.com                     ┌──────┐            │
│   🟡🌐 www.charlessite.com                     │  QR  │            │
│   🟡📍 123 Main St, City                       └──────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#1A4A47` (dark teal) |
| Full coverage | 0, 0, 1050, 600 |

#### White Diagonal Band
| Property | Value |
|----------|-------|
| Shape | Polygon — parallelogram rotated ~15° clockwise |
| Vertices | `(0, 210)`, `(1050, 90)`, `(1050, 420)`, `(0, 540)` — approximately spanning 35–70% height with diagonal slant |
| Fill | `#FFFFFF` (white) |
| Opacity | 100% |
| Height | ~210px (35% H) of vertical span |
| Canvas2D | Polygon path with 4 vertices |

#### Gold Accent Strip (within white band)
| Property | Value |
|----------|-------|
| Shape | Thin parallelogram strip aligned with white band |
| Vertices | Runs along bottom edge of white band, ~18px tall |
| Fill | `#C9A961` (champagne gold) |
| Opacity | 100% |
| Position | Bottom ~3% of the white band height |

#### Contact Icons
| Property | Value |
|----------|-------|
| Type | Circular outlines with line-art symbols (phone, email, web, pin) |
| Size | ~20 × 20 px (3% W) each |
| Color | `#C9A961` (champagne gold) |
| Position | x: 53 (5%), vertically spaced starting at y: 390 (65%) |
| Spacing | 15px (2.5% H) between centers |

#### QR Code
| Property | Value |
|----------|-------|
| Position | x: 788 (75%), y: 450 (75%) |
| Size | ~126 × 126 px (12% W) |
| Pattern color | `#1A4A47` (dark teal) modules on white |
| Background | White |

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Name | Sans-serif geometric | 700 | 48px (8%H) | UPPERCASE | 0.15em | `#1A4A47` | x: 210 (20%), y: 270 (45%) — on white band | Left |
| Title | Sans-serif | 400 | 15px (2.5%H) | UPPERCASE | 0.25em | `#8B8B8B` | x: 210, y: 330 (55%) — on white band | Left |
| Phone | Sans-serif | 400 | 13px (2.2%H) | Sentence | 0 | `#FFFFFF` | x: 84 (8%), y: 390 (65%) | Left |
| Email | Sans-serif | 400 | 13px (2.2%H) | lowercase | 0 | `#FFFFFF` | x: 84, y: 420 (70%) | Left |
| Website | Sans-serif | 400 | 13px (2.2%H) | lowercase | 0 | `#FFFFFF` | x: 84, y: 450 (75%) | Left |
| Address | Sans-serif | 400 | 13px (2.2%H) | Sentence | 0 | `#FFFFFF` | x: 84, y: 480 (80%) | Left |

*Note:* Contact text position is after icon (icon at 5% + gap → text at ~8%)

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Left margin | 8% (84px) for contact, 20% (210px) for name/title |
| Top margin | 10% (60px) |
| Name → Title gap | 18px (3% H) |
| Contact line spacing | 15px (2.5% H) |
| Diagonal band vertical span | ~210px (35%–70% H with slant) |
| QR at 75% left, 75% top |

---

### Back Side

```
┌─────────────────────────────────────────────────────────────────────┐
│    Dark Teal #1A4A47                                                │
│                                                                     │
│                                ◆◆ (geometric logo)                 │
│                                                                     │
│                                NEWS BUSINESS                        │
│                                INFINITY COMPANY                     │
│                                                                     │
│                                     CONSTRUCTION                    │
│                                     HOME DESIGN                     │
│                                     INVESTMENT                      │
│                                     CONSULTING                      │
│ ═══════════════════════════════════════════ gold bar ═══════════════ │
└─────────────────────────────────────────────────────────────────────┘
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#1A4A47` (dark teal) |
| Full coverage | 0, 0, 1050, 600 |

#### Logo (Geometric Interlocked Shape)
| Property | Value |
|----------|-------|
| Type | Geometric interlocked squares/rectangles — modern minimalist line art |
| Position | x: 788 (75%), y: 150 (25%) |
| Size | ~84 × 84 px (8% W) |
| Color | `#C9A961` (champagne gold) |
| Style | Overlapping rectangles, line art |

#### Gold Accent Bar (Bottom)
| Property | Value |
|----------|-------|
| Position | x: 0, y: 552 (bottom) |
| Size | 1050 × 48 px (full width × 8% H) |
| Fill | `#C9A961` (champagne gold) |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Company name | Sans-serif | 700 | 24px (4%H) | UPPERCASE | 0.1em | `#C9A961` | x: 788 (75%), y: 210 (35%) | Left |
| Tagline | Sans-serif | 300 | 12px (2%H) | UPPERCASE | 0.3em | `#C9A961` | x: 788, y: 246 | Left |
| Service 1 | Sans-serif | 300 | 15px (2.5%H) | UPPERCASE | 0.2em | `#C9A961` | x: 893 (85%), y: 300 (50%) | Left |
| Service 2 | Sans-serif | 300 | 15px (2.5%H) | UPPERCASE | 0.2em | `#C9A961` | x: 893, y: 324 (+24) | Left |
| Service 3 | Sans-serif | 300 | 15px (2.5%H) | UPPERCASE | 0.2em | `#C9A961` | x: 893, y: 348 (+24) | Left |
| Service 4 | Sans-serif | 300 | 15px (2.5%H) | UPPERCASE | 0.2em | `#C9A961` | x: 893, y: 372 (+24) | Left |

*All back text is `#C9A961` (champagne gold) on dark teal background*

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Right margin | 10% (105px) from right edge |
| Logo at 75% left, 25% top |
| Logo → Company name gap | 24px |
| Company → Tagline gap | 12px |
| Tagline → Services gap | 54px |
| Service line spacing | 24px (4% H, line-height ~2.0) |
| Gold bar at bottom: 48px tall, full width |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Dark Teal | `#1A4A47` | Background (both sides), name text, QR modules |
| White | `#FFFFFF` | Diagonal band, contact text |
| Champagne Gold | `#C9A961` | Accent strip, icons, all back text/elements, bottom bar |
| Medium Gray | `#8B8B8B` | Front title text |

### Logo Treatment
```typescript
logoConfig: {
  technique: "T3",              // Silhouette — monochrome gold
  placement: "back-right",      // Front: N/A (name on white band); Back: right side above company
  frontBehavior: {
    // No logo on front — name/title dominate the white diagonal band
    position: null,
    display: "none"
  },
  backBehavior: {
    // Gold logo at right side, above company name
    position: { x: 746, y: 108 },
    maxSize: { w: 84, h: 84 },
    color: "#C9A961",
    opacity: 1.0
  },
  compositionAdaptations: {
    "separable": { front: "none", back: "icon-right-gold" },
    "wordmark-only": { front: "none", back: "wordmark-right-gold" },
    "lockup-inseparable": { front: "none", back: "lockup-right-gold" },
    "icon-only": { front: "none", back: "icon-right-gold" },
    "emblem": { front: "none", back: "emblem-right-gold" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill background #1A4A47 (full card)
2. Draw white diagonal band:
   ctx.fillStyle = '#FFFFFF';
   ctx.beginPath();
   ctx.moveTo(0, 210);
   ctx.lineTo(1050, 90);
   ctx.lineTo(1050, 420);
   ctx.lineTo(0, 540);
   ctx.closePath();
   ctx.fill();
3. Draw gold accent strip (bottom edge of white band):
   ctx.fillStyle = '#C9A961';
   ctx.beginPath();
   ctx.moveTo(0, 522);
   ctx.lineTo(1050, 402);
   ctx.lineTo(1050, 420);
   ctx.lineTo(0, 540);
   ctx.closePath();
   ctx.fill();
4. Draw "CHARLES JONES" — #1A4A47, 48px, 700w, UPPERCASE, 0.15em at (210, 270)
5. Draw "CONSTRUCTION CONSULTANT" — #8B8B8B, 15px, 400w, UPPERCASE, 0.25em at (210, 330)
6. Draw contact icons — gold #C9A961 circles (20×20) at x:53, y: 390/405/420/435
7. Draw contact text — #FFFFFF, 13px, 400w at x:84, y: 390/420/450/480
8. Draw QR code — teal on white, 126×126 at (788, 450)
```

### Canvas2D Render Recipe — Back
```
1. Fill background #1A4A47 (full card)
2. Draw logo — gold #C9A961 geometric shape at (788, 150), 84×84
3. Draw "NEWS BUSINESS" — #C9A961, 24px, 700w, UPPERCASE, 0.1em at (788, 210)
4. Draw "INFINITY COMPANY" — #C9A961, 12px, 300w, UPPERCASE, 0.3em at (788, 246)
5. Draw service categories — #C9A961, 15px, 300w, UPPERCASE, 0.2em:
   "CONSTRUCTION" at (893, 300)
   "HOME DESIGN" at (893, 324)
   "INVESTMENT" at (893, 348)
   "CONSULTING" at (893, 372)
6. Draw gold bottom bar:
   ctx.fillStyle = '#C9A961';
   ctx.fillRect(0, 552, 1050, 48);
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Background | Dark teal `#1A4A47` solid | No explicit background | ❌ No |
| White diagonal band | Polygon parallelogram ~15° with gold strip | Horizontal "Diagonal Stripe" rect (not diagonal at all) | ❌ No |
| Gold accent | `#C9A961` strip within band + icons + back text | Uses cfg.primaryColor/secondaryColor gradient | ❌ No |
| Name position | On white band at 45% H, dark teal color | Below stripe at 52% H, uses cfg.textColor | ❌ No |
| Name styling | UPPERCASE, 0.15em tracking, 700w, `#1A4A47` | Not uppercase, no tracking | ❌ No |
| Title styling | UPPERCASE, 0.25em tracking, gray `#8B8B8B` | Uses cfg.primaryColor | ❌ No |
| Contact text | White `#FFFFFF` on dark teal, with gold icons | Uses cfg.textColor | ❌ No |
| QR code | At 75%, 75%, teal on white | Missing entirely | ❌ No |
| Back side | Teal bg, gold logo/text/services, gold bottom bar | No back side implementation | ❌ No |
| Gold icons | Circular gold icons for contact methods | Uses generic buildContactLayers | ❌ No |

**Reusability: ~3%** — Essentially nothing is correct. The defining feature — the diagonal white band with gold strip — is rendered as a simple horizontal rectangle. No actual diagonal geometry, no gold accent, no QR code, no back side. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: diagonal-gold
constraints:
  - background: solid #1A4A47 dark teal (both sides)
  - white_diagonal_band: polygon at ~15° angle, spanning 35-70% height
  - gold_accent_strip: thin #C9A961 strip along bottom edge of white band
  - name_on_white: UPPERCASE, 700w, #1A4A47, 0.15em tracking, positioned ON white band
  - title_gray: UPPERCASE, 0.25em tracking, #8B8B8B
  - contact_white: white text on dark teal, with gold circular icons
  - qr_code: teal modules, right side at 75%
  - back_all_gold: all back text and elements in #C9A961 champagne gold
  - back_logo: geometric gold shape, right-aligned at 75%
  - back_services: vertical list of UPPERCASE service categories in gold
  - gold_bottom_bar: full-width #C9A961 bar, 8% height, at bottom of back
  - no_logo_front: front has no explicit logo, name dominates
  - font_hierarchy: name 48px > company-back 24px > service/title 15px > contact 13px > tagline 12px
```

---

## 25. Luxury Divider (`luxury-divider`)

**Reference image:** `d1758d1d96db4e9a71d7bb56472629ee.jpg`
**Style:** Luxury corporate with color-inversion design (gold front / teal back)
**Mood:** Sophisticated, trustworthy, modern, premium
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌─────────────────────────────────────────────────────────────────────┐
│    Warm Cream/Gold #F4D58D                                         │
│                                            ┌──────────┐            │
│                                            │  QR CODE  │            │
│                                            │  (teal)   │            │
│     MARTIN SAENZ                           └──────────┘            │
│     ASSISTANT                                                       │
│                                                                     │
│     +1 (555) 123 4567                                              │
│     hello@assistant.com                                             │
│     123 Anywhere Street                                             │
│                                                                     │
│     f  🐦  in                                                       │
└─────────────────────────────────────────────────────────────────────┘
     Left-aligned content (20% margin) | QR upper-right
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#F4D58D` (warm cream/gold) |
| Full coverage | 0, 0, 1050, 600 |

#### QR Code
| Property | Value |
|----------|-------|
| Position | x: 788 (75%), y: 90 (15%) |
| Size | 189 × 180 px (18%W × 30%H) |
| Pattern color | `#1A4A5C` (dark teal) modules |
| Background | `#F4D58D` (matching card bg) |

#### Social Media Icons
| Property | Value |
|----------|-------|
| Type | Platform icons (Facebook, Twitter, LinkedIn) |
| Position | x: 210 (20%), y: 510 (85%) |
| Size | ~32 × 32 px each (3% W) |
| Color | `#1A4A5C` (dark teal) |
| Spacing | 21px (2% W) gaps between icons |

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Name | Sans-serif geometric | 700 | 36px (6%H) | UPPERCASE | 0.15em | `#1A4A5C` | x: 210 (20%), y: 270 (45%) | Left |
| Title | Sans-serif | 500 | 18px (3%H) | UPPERCASE | 0 | `#1A4A5C` | x: 210, y: 330 (55%) | Left |
| Phone | Sans-serif | 400 | 15px (2.5%H) | Sentence | 0 | `#1A4A5C` | x: 210, y: 390 (65%) | Left |
| Email | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#1A4A5C` | x: 210, y: 420 | Left |
| Address | Sans-serif | 400 | 15px (2.5%H) | Sentence | 0 | `#1A4A5C` | x: 210, y: 450 | Left |

*All front text is `#1A4A5C` (dark teal) on gold background — single-color text system*

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Left margin | 20% (210px) |
| Right margin for QR | 7% (74px) from right edge |
| Name → Title gap | 24px (~4% H) |
| Title → Contact gap | 60px (10% H) |
| Contact line spacing | 30px (5% H, relaxed line-height 1.6) |
| Contact → Social gap | 30px |
| All text left-aligned at 210px |
| QR at 75% left, 15% top |

---

### Back Side

```
┌─────────────────────────────────────────────────────────────────────┐
│    Dark Teal #1A4A5C                                                │
│                                                                     │
│                                                                     │
│          ◆ (geometric logo element)                                 │
│                                                                     │
│                       ASSISTANT                                     │
│                                                                     │
│               ─────────────────────────                             │
│                                                                     │
│                   www.assistant.com                                  │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
     Color-inverted: teal bg, gold text — mirror of front palette
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#1A4A5C` (dark teal) |
| Full coverage | 0, 0, 1050, 600 |
| Note | Perfect color inversion of front side |

#### Geometric Logo Element
| Property | Value |
|----------|-------|
| Type | Abstract angular/triangular geometric shape |
| Position | x: 158 (15%), y: 210 (35%) |
| Size | ~84 × 84 px (8% W) |
| Color | `#F4D58D` (gold/cream) |
| Style | Angular line art, architectural feel |

#### Horizontal Accent Line
| Property | Value |
|----------|-------|
| Position | x: 210 (20%), y: 390 (65%) |
| Size | 630 × 3 px (60% W × 0.5% H) |
| Color | `#F4D58D` (gold/cream) |
| Centered horizontally at 525 |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Company | Sans-serif geometric | 700 | 48px (8%H) | UPPERCASE | 0.2em | `#F4D58D` | x: 525 (50%), y: 270 (45%) | Center |
| Website | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#F4D58D` | x: 525 (50%), y: 450 (75%) | Center |

*All back text is `#F4D58D` (gold/cream) on teal background — perfect inversion of front*

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Margins | ~20% (210px) all sides |
| Logo at 15% left, 35% top |
| Company text centered at 45% from top |
| Accent line at 65% from top, 60% width centered |
| Website at 75% from top |
| Vertical spacing between elements | ~15% (90px) |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Warm Cream/Gold | `#F4D58D` | Front background, all back text/elements |
| Dark Teal | `#1A4A5C` | All front text/elements, back background |

*Two-color system with perfect inversion between sides*

### Logo Treatment
```typescript
logoConfig: {
  technique: "T3",              // Silhouette / monochrome fill
  placement: "back-centered",   // Front: no explicit logo; Back: geometric element
  frontBehavior: {
    // Front has no logo area — name IS the brand
    // If user has logo, place small above name
    position: { x: 210, y: 210 },
    maxSize: { w: 48, h: 48 },
    color: "#1A4A5C",
    opacity: 1.0,
    optional: true
  },
  backBehavior: {
    // Logo replaces geometric element, left-of-center
    position: { x: 116, y: 168 },
    maxSize: { w: 84, h: 84 },
    color: "#F4D58D",
    opacity: 1.0,
    fallback: "geometric-triangle"  // If no logo, show angular geometric shape
  },
  compositionAdaptations: {
    "separable": { front: "icon-above-name-teal", back: "icon-left-gold" },
    "wordmark-only": { front: "wordmark-above-name", back: "wordmark-replaces-company" },
    "lockup-inseparable": { front: "lockup-above-name", back: "lockup-centered-gold" },
    "icon-only": { front: "icon-above-name-teal", back: "icon-left-gold" },
    "emblem": { front: "emblem-above-name", back: "emblem-left-gold" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill background #F4D58D (full card)
2. Draw QR code — teal #1A4A5C modules, 189×180, at (788, 90)
3. Draw "MARTIN SAENZ" — #1A4A5C, 36px, 700w, UPPERCASE, 0.15em at (210, 270)
4. Draw "ASSISTANT" — #1A4A5C, 18px, 500w, UPPERCASE at (210, 330)
5. Draw contact info — #1A4A5C, 15px, 400w:
   Phone at (210, 390)
   Email at (210, 420)
   Address at (210, 450)
6. Draw social media icons — #1A4A5C, 32×32 each at y:510:
   Facebook at (210, 510)
   Twitter at (262, 510)
   LinkedIn at (314, 510)
```

### Canvas2D Render Recipe — Back
```
1. Fill background #1A4A5C (full card)
2. Draw geometric logo element — #F4D58D angular shape at (158, 210):
   ctx.fillStyle = '#F4D58D';
   ctx.beginPath();
   // Angular/triangular geometric shape
   ctx.moveTo(158, 294);
   ctx.lineTo(200, 210);
   ctx.lineTo(242, 294);
   ctx.closePath();
   ctx.fill();
3. Draw "ASSISTANT" — #F4D58D, 48px, 700w, UPPERCASE, 0.2em, centered at (525, 270)
4. Draw horizontal accent line:
   ctx.strokeStyle = '#F4D58D';
   ctx.lineWidth = 3;
   ctx.beginPath();
   ctx.moveTo(210, 390);
   ctx.lineTo(840, 390);
   ctx.stroke();
5. Draw "www.assistant.com" — #F4D58D, 15px, 400w, lowercase, centered at (525, 450)
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Front background | Warm cream/gold `#F4D58D` | No explicit background | ❌ No |
| Color system | Two-color inversion (gold↔teal) | Uses cfg.primaryColor/textColor | ❌ No |
| Name styling | 700w, UPPERCASE, 0.15em, teal on gold bg | 700w but nameXl size, no uppercase | 🟡 ~10% |
| Layout | Left-aligned at 20% margin, clean | Has vertical dividers splitting card | ❌ No |
| QR code | Large at upper-right, 18%W × 30%H | Missing entirely | ❌ No |
| Social icons | Facebook, Twitter, LinkedIn at bottom-left | Missing entirely | ❌ No |
| Vertical dividers | None — clean layout | Has two vertical gold dividers | ❌ No (wrong concept) |
| Back side | Teal bg, centered gold company + accent line + URL | No back side implementation | ❌ No |
| Geometric logo | Angular/triangular on back | Uses generic buildLogoLayer | ❌ No |
| Accent line | Horizontal gold line at 65% on back | No accent line | ❌ No |

**Reusability: ~5%** — The current code's defining feature (vertical dividers) doesn't exist in the reference at all. The reference is a clean two-color inversion design. The name text layer structure is vaguely similar but all positions and styling are wrong. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: luxury-divider
constraints:
  - color_inversion: front is gold #F4D58D bg with teal #1A4A5C text; back is exact inverse
  - two_color_only: entire card uses ONLY #F4D58D and #1A4A5C
  - front_background: solid #F4D58D warm cream/gold
  - back_background: solid #1A4A5C dark teal
  - name_uppercase: 700w, UPPERCASE, 0.15em tracking, teal
  - left_aligned_content: all front text at 20% left margin
  - qr_upper_right: large QR code (18%W × 30%H) at 75% left, 15% top
  - social_icons: teal platform icons at bottom-left, 85% from top
  - back_centered: company name + accent line + website all centered
  - accent_line: horizontal gold line, 60% card width, centered at 65% height
  - geometric_logo: angular/triangular shape on back, gold color
  - no_vertical_dividers: NO divider lines in the design
  - font_hierarchy: back-company 48px > name 36px > title 18px > contact/url 15px
```

---

## 26. Social Band (`social-band`)

**Reference image:** `80987e388dd2023cd6d527b999783fa4.jpg`
**Style:** Luxury minimalist with sophisticated color blocking (green/cream)
**Mood:** Professional elegance, organic luxury, understated confidence
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│               Deep Forest Green #3A5A4A                             │
│                                                                     │
│                    VISIONARY VOGUE                                   │
│                                                                     │
│                        TITLE                                        │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Warm Cream #E8E6E1                        │                        │
│  🔵🔵🔵🔵 social icons   @SOCIAL...       │  WWW.WEBSITE.COM       │
│                                            │  MYWORK@MAIL.COM       │
│                                            │  123 · 456 · 789       │
└─────────────────────────────────────────────────────────────────────┘
     70/30 horizontal split — green top, cream bottom
```

#### Green Section (Top 70%)
| Property | Value |
|----------|-------|
| Region | 0, 0, 1050, 420 (70% H) |
| Fill | Solid `#3A5A4A` (deep forest/sage green) |

#### Cream Section (Bottom 30%)
| Property | Value |
|----------|-------|
| Region | 0, 420, 1050, 180 (30% H) |
| Fill | Solid `#E8E6E1` (warm light gray/cream) |

#### Vertical Divider Line (Bottom Section)
| Property | Value |
|----------|-------|
| Position | x: 578 (55%), y: 450 (75%) to y: 582 (97%) |
| Size | 1px wide, 132px tall |
| Color | `#2C2C2C` (charcoal) |
| Spans within cream section only |

#### Social Media Icons
| Property | Value |
|----------|-------|
| Type | 4 circular line icons (Pinterest, Instagram, camera, globe) |
| Position | x: 126 (12%), y: 468 (78%) |
| Size | ~18 × 18 px each (3% H) |
| Color | `#2C2C2C` (charcoal) |
| Spacing | ~16px (1.5% W) gaps between icons |
| Style | Minimal line icons inside circles |

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Brand name | Sans-serif geometric | 300 | 48px (8%H) | UPPERCASE | 0.25em+ | `#FFFFFF` | x: 525 (50%), y: 240 (40%) | Center |
| Subtitle | Sans-serif | 300 | 15px (2.5%H) | UPPERCASE | 0.2em | `#FFFFFF` | x: 525, y: 312 (52%) | Center |
| Social handle | Sans-serif | 400 | 12px (2%H) | UPPERCASE | 0 | `#2C2C2C` | x: 126 (12%), y: 492 (82%) | Left |
| Website | Sans-serif | 400 | 12px (2%H) | UPPERCASE | 0 | `#2C2C2C` | x: 651 (62%), y: 492 (82%) | Left |
| Email | Sans-serif | 400 | 12px (2%H) | UPPERCASE | 0 | `#2C2C2C` | x: 651, y: 528 (88%) | Left |
| Phone | Sans-serif | 400 | 12px (2%H) | Numbers + dots | 0 | `#2C2C2C` | x: 651, y: 564 (94%) | Left |

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Top margin to brand | ~25% (150px) from top |
| Brand → Subtitle gap | 48px (~8% H) |
| Green/cream split | At 70% (420px) |
| Bottom section margins | ~5% (30px) from edges |
| Social icons at 78% from top, left at 12% |
| Right column text at 62% from left |
| Vertical divider at 55%, spanning 75%–97% from top |

---

### Back Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│               Deep Forest Green #3A5A4A                             │
│                                                                     │
│                       𝒱  (script watermark)                         │
│                    VISIONARY VOGUE                                   │
│                                                                     │
│                        TITLE                                        │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
     Full green background with subtle script monogram watermark
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#3A5A4A` (deep forest/sage green) |
| Full coverage | 0, 0, 1050, 600 |

#### Script Monogram Watermark
| Property | Value |
|----------|-------|
| Character | Large "V" in elegant script/calligraphy |
| Position | Centered at 525 (50% W), 270 (45% H) |
| Size | ~210px (35% H) tall |
| Color | `#4A6B5A` (slightly lighter green) |
| Opacity | 30% (subtle watermark effect) |
| Font style | Script/calligraphy, elegant |
| Z-order | Behind all text (background element) |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Brand name | Sans-serif geometric | 300 | 48px (8%H) | UPPERCASE | 0.25em+ | `#FFFFFF` | x: 525 (50%), y: 300 (50%) | Center |
| Subtitle | Sans-serif | 300 | 15px (2.5%H) | UPPERCASE | 0.2em | `#FFFFFF` | x: 525, y: 348 (58%) | Center |

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| All elements centered horizontally |
| Brand name at 50% from top |
| Subtitle at 58% from top |
| Generous whitespace around text |
| Watermark positioned behind text, centered at 45% from top |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Deep Forest Green | `#3A5A4A` | Green section (front top + full back) |
| Warm Cream | `#E8E6E1` | Bottom section (front) |
| White | `#FFFFFF` | Text on green |
| Charcoal | `#2C2C2C` | Text on cream, social icons, divider |
| Light Green | `#4A6B5A` | Script watermark monogram (back) |

### Logo Treatment
```typescript
logoConfig: {
  technique: "T6",              // Watermark / emboss (back monogram)
  placement: "centered-both",   // Front: none; Back: watermark behind text
  frontBehavior: {
    // Front has no logo — brand name IS the logo
    position: null,
    display: "none"
  },
  backBehavior: {
    // Logo as large watermark behind centered text
    position: { x: 420, y: 165 },
    maxSize: { w: 210, h: 210 },
    color: "#4A6B5A",
    opacity: 0.3,
    // If user has logo, render as large watermark at 30% opacity
    fallback: "script-V-monogram"   // Default: script "V" letter
  },
  compositionAdaptations: {
    "separable": { front: "none", back: "icon-watermark-30pct" },
    "wordmark-only": { front: "none", back: "wordmark-watermark-30pct" },
    "lockup-inseparable": { front: "none", back: "lockup-watermark-30pct" },
    "icon-only": { front: "none", back: "icon-watermark-large-30pct" },
    "emblem": { front: "none", back: "emblem-watermark-30pct" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill green section:
   ctx.fillStyle = '#3A5A4A';
   ctx.fillRect(0, 0, 1050, 420);
2. Fill cream section:
   ctx.fillStyle = '#E8E6E1';
   ctx.fillRect(0, 420, 1050, 180);
3. Draw "VISIONARY VOGUE" — white, 48px, 300w, UPPERCASE, 0.25em+, centered at (525, 240)
4. Draw "TITLE" — white, 15px, 300w, UPPERCASE, 0.2em, centered at (525, 312)
5. Draw vertical divider:
   ctx.strokeStyle = '#2C2C2C';
   ctx.lineWidth = 1;
   ctx.beginPath();
   ctx.moveTo(578, 450);
   ctx.lineTo(578, 582);
   ctx.stroke();
6. Draw social media icons — charcoal circles, 18×18 at x:126, y:468
7. Draw "@SOCIALMEDIAHANDLES" — #2C2C2C, 12px, 400w at (126, 492)
8. Draw contact text (right of divider) — #2C2C2C, 12px, 400w:
   Website at (651, 492)
   Email at (651, 528)
   Phone at (651, 564)
```

### Canvas2D Render Recipe — Back
```
1. Fill background #3A5A4A (full card)
2. Draw script "V" watermark:
   ctx.globalAlpha = 0.3;
   ctx.fillStyle = '#4A6B5A';
   ctx.font = '210px "Georgia", serif';  // Or italic script font
   ctx.textAlign = 'center';
   ctx.fillText('V', 525, 360);
   ctx.globalAlpha = 1.0;
3. Draw "VISIONARY VOGUE" — white, 48px, 300w, UPPERCASE, 0.25em+, centered at (525, 300)
4. Draw "TITLE" — white, 15px, 300w, UPPERCASE, 0.2em, centered at (525, 348)
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Layout | 70/30 horizontal split (green/cream) | Has bottom band (20% height), not 30% | 🟡 ~20% (concept) |
| Green background | `#3A5A4A` deep forest green, 70% height | No explicit background color | ❌ No |
| Cream section | `#E8E6E1` warm cream, 30% height | Uses cfg.secondaryColor at 50% opacity | ❌ No |
| Brand text | Light 300w, 0.25em+ tracking, centered on green | Uses companyLg at 400w, letterSpacing: 5 | 🟡 ~15% |
| Social icons | 4 platform icons in cream section | Missing entirely | ❌ No |
| Vertical divider | 1px charcoal line in cream section | Has a centered divider but wrong position/style | ❌ No |
| Contact layout | Split in cream section: social left, contact right of divider | Uses buildContactLayers centered on band | ❌ No |
| Back side | Full green, script monogram watermark, centered text | No back side implementation | ❌ No |
| Script watermark | Large "V" at 30% opacity, elegant script | Missing entirely | ❌ No |
| Name element | No name on front — brand name dominates | Has name centered at 48% | ❌ No |

**Reusability: ~10%** — The concept of a bottom band and centered company text exists, but the proportions, colors, and content layout are completely different. Missing social icons, script watermark, proper color blocking, and the two-column contact layout in the cream section. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: social-band
constraints:
  - horizontal_split: 70% green top, 30% cream bottom, sharp edge
  - green_section: solid #3A5A4A, centered brand + subtitle in white
  - cream_section: solid #E8E6E1, social left + contact right
  - brand_typography: Light 300w, UPPERCASE, very wide tracking (0.25em+), white
  - subtitle_typography: Light 300w, UPPERCASE, wide tracking (0.2em), white
  - vertical_divider: 1px #2C2C2C line in cream section at 55% from left
  - social_icons: 4 circular platform icons, charcoal, left side of cream
  - contact_right: website/email/phone right of divider, charcoal text
  - contact_text_uppercase: all contact text UPPERCASE
  - back_full_green: solid #3A5A4A, same as front top
  - script_watermark: large elegant "V" in #4A6B5A at 30% opacity, behind text
  - back_centered: brand name + subtitle centered, white, same styling as front
  - no_name_on_front: brand name replaces personal name on front
  - font_hierarchy: brand 48px > subtitle 15px > contact 12px
```

---

## 27. Organic Pattern (`organic-pattern`)

**Reference image:** `ed5aed70cf66b85baf0a7a9af5b80f2c.jpg`
**Style:** Modern minimalist corporate with green/gold earth-tone color blocking
**Mood:** Reliable, environmentally conscious, modern professional
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌──────────────────────────────┬──┬───────────────────────────────────┐
│                               │  │                                   │
│  Dark Forest Green #4A5D52    │🔸│  White #FFFFFF                    │
│                               │📍│                                   │
│   YOUR NAME                   │📞│   ◆ COMPANY LOGO                  │
│   Your Position               │✉️│                                   │
│                               │  │                                   │
│   12345 street your city      │  │                                   │
│   051-123-4567 ext 432        │  │          ┌──────┐                 │
│   johndoe@company.com         │  │          │  QR  │                 │
│                               │  │          └──────┘                 │
│                               │  │                                   │
└──────────────────────────────┴──┴───────────────────────────────────┘
     60/40 vertical split — green left, white right
     Gold icon strip at divider
```

#### Green Section (Left 60%)
| Property | Value |
|----------|-------|
| Region | 0, 0, 630, 600 (60% W) |
| Fill | Solid `#4A5D52` (dark forest green) |

#### White Section (Right 40%)
| Property | Value |
|----------|-------|
| Region | 630, 0, 420, 600 (40% W) |
| Fill | Solid `#FFFFFF` (white) |

#### Vertical Icon Strip
| Property | Value |
|----------|-------|
| Type | Rounded rectangle with contact icons inside |
| Position | x: 609 (58%), y: ~195 (32.5%) |
| Size | ~42 × 210 px (4%W × 35%H) |
| Fill | `#B8A882` (muted gold/beige) |
| Corner radius | 8px |
| Icons | White location pin, phone, email glyphs vertically stacked |
| Icon size | ~18 × 18 px each |
| Icon color | `#FFFFFF` |
| Icon spacing | Evenly distributed within strip |

#### Company Logo Symbol
| Property | Value |
|----------|-------|
| Type | Geometric "L" shaped logo mark |
| Position | x: 788 (75%), y: 120 (20%) |
| Size | ~84 × 84 px (8% W) |
| Color | `#6B7B73` (muted green-gray) |

#### QR Code
| Property | Value |
|----------|-------|
| Position | x: 861 (82%), y: 420 (70%) |
| Size | ~126 × 126 px (12% W) |
| Pattern color | `#333333` (dark gray) |
| Background | White |

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Name | Sans-serif | 700 | 30px (5%H) | UPPERCASE | 0.15em | `#B8A882` | x: 84 (8%), y: 210 (35%) | Left |
| Position | Sans-serif | 300 | 15px (2.5%H) | Title Case | 0 | `#B8A882` | x: 84, y: 252 (42%) | Left |
| Address | Sans-serif | 400 | 12px (2%H) | lowercase | 0 | `#B8A882` | x: 84, y: 312 (52%) | Left |
| Phone | Sans-serif | 400 | 12px (2%H) | lowercase | 0 | `#B8A882` | x: 84, y: 348 (58%) | Left |
| Email | Sans-serif | 400 | 12px (2%H) | lowercase | 0 | `#B8A882` | x: 84, y: 384 (64%) | Left |
| Company | Sans-serif | 500 | 17px (2.8%H) | UPPERCASE | 0.1em | `#6B7B73` | x: 788 (75%), y: 192 (32%) | Left |

*All left-section text is muted gold `#B8A882` on green background*

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Left margin | 8% (84px) |
| Right margin | 8% (84px) |
| Green/white split | At 60% (630px) |
| Icon strip at divider | 58%–62% W |
| Name at 35% from top |
| Contact text spacing | 6% H between lines (36px) |
| Logo at 75% left, 20% top |
| QR at 82% left, 70% top |

---

### Back Side

```
┌─────────────────────────────────────────────────────────────────────┐
│ ╭───╮  ╭────────╮  ╭──────────╮  ╭───────╮                        │
│ │    ╰──╯        ╰──╯          ╰──╯       │    Topographic         │
│ │  ╭──╮  ╭────╮  ╭──────╮  ╭────╮  ╭──╮  │    contour pattern     │
│ ╰──╯  ╰──╯    ╰──╯      ╰──╯    ╰──╯  ╰─│    20% opacity         │
│                                            │                        │
│                     ◆ (logo large)         │    Dark Forest Green   │
│                                            │    #4A5D52             │
│                   COMPANY LOGO             │                        │
│                  MODERN COMPANY            │                        │
│                                            │                        │
│ ╭──╮  ╭────╮  ╭──────╮  ╭────╮  ╭──╮     │                        │
│ ╰──╯  ╰────╯  ╰──────╯  ╰────╯  ╰──╯     │                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#4A5D52` (dark forest green) |
| Full coverage | 0, 0, 1050, 600 |

#### Topographic Pattern Overlay
| Property | Value |
|----------|-------|
| Type | Contour/topographic lines — organic flowing curves |
| Coverage | Full background |
| Color | `#3A4A42` (darker green) |
| Opacity | 20% |
| Style | 6–8 nested organic contour shapes, rounded, irregular |
| Line width | 1–2px strokes |
| Canvas2D | Series of bezier curves forming nested contour shapes |

*Topographic line rendering:*
Each contour is a closed bezier path:
```
ctx.strokeStyle = '#3A4A42';
ctx.globalAlpha = 0.2;
ctx.lineWidth = 1.5;
for (each contour level) {
  ctx.beginPath();
  ctx.moveTo(...);
  ctx.bezierCurveTo(...); // Organic flowing curves
  ctx.closePath();
  ctx.stroke();
}
ctx.globalAlpha = 1.0;
```

#### Logo Symbol (Centered, Large)
| Property | Value |
|----------|-------|
| Type | Same geometric "L" mark as front, larger |
| Position | Centered at 525 (50% W), 240 (40% H) |
| Size | ~158 × 158 px (15% W) |
| Color | `#B8A882` (muted gold/beige) |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Company | Sans-serif | 500 | 24px (4%H) | UPPERCASE | 0.15em | `#B8A882` | x: 525 (50%), y: 330 (55%) | Center |
| Tagline | Sans-serif | 300 | 12px (2%H) | UPPERCASE | 0.3em | `#B8A882` | x: 525, y: 372 (62%) | Center |

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Logo centered at 40% from top |
| Logo → Company text gap | 48px |
| Company → Tagline gap | 18px |
| All elements centered horizontally |
| Topographic pattern fills entire background |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Dark Forest Green | `#4A5D52` | Green sections (front left + full back) |
| Darker Green | `#3A4A42` | Topographic pattern lines (back) |
| White | `#FFFFFF` | Right section (front), icon strip icons |
| Muted Gold/Beige | `#B8A882` | All text on green, icon strip bg, back text |
| Muted Green-Gray | `#6B7B73` | Company logo mark, company text on white |
| Dark Gray | `#333333` | QR code modules |

### Logo Treatment
```typescript
logoConfig: {
  technique: "T3",              // Silhouette / monochrome fill
  placement: "right-panel",     // Front: right panel; Back: centered large
  frontBehavior: {
    position: { x: 746, y: 78 },
    maxSize: { w: 84, h: 84 },
    color: "#6B7B73",            // Muted green-gray on white bg
    opacity: 1.0
  },
  backBehavior: {
    position: { x: 446, y: 161 },
    maxSize: { w: 158, h: 158 },
    color: "#B8A882",            // Gold/beige on green bg
    opacity: 1.0
  },
  compositionAdaptations: {
    "separable": { front: "icon-right-panel-gray", back: "icon-centered-gold" },
    "wordmark-only": { front: "wordmark-right-gray", back: "wordmark-centered-gold" },
    "lockup-inseparable": { front: "lockup-right-gray", back: "lockup-centered-gold" },
    "icon-only": { front: "icon-right-gray", back: "icon-centered-large-gold" },
    "emblem": { front: "emblem-right-gray", back: "emblem-centered-gold" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill green section:
   ctx.fillStyle = '#4A5D52';
   ctx.fillRect(0, 0, 630, 600);
2. Fill white section:
   ctx.fillStyle = '#FFFFFF';
   ctx.fillRect(630, 0, 420, 600);
3. Draw icon strip:
   ctx.fillStyle = '#B8A882';
   roundRect(609, 195, 42, 210, 8);
   // Draw white icons inside strip
4. Draw name "YOUR NAME" — #B8A882, 30px, 700w, UPPERCASE, 0.15em at (84, 210)
5. Draw position — #B8A882, 15px, 300w at (84, 252)
6. Draw contact info — #B8A882, 12px, 400w at (84, 312/348/384)
7. Draw company logo mark — #6B7B73, geometric at (788, 120)
8. Draw "COMPANY LOGO" — #6B7B73, 17px, 500w, UPPERCASE at (788, 192)
9. Draw QR code — #333333 modules at (861, 420), 126×126
```

### Canvas2D Render Recipe — Back
```
1. Fill background #4A5D52 (full card)
2. Draw topographic contour pattern:
   ctx.strokeStyle = '#3A4A42';
   ctx.globalAlpha = 0.2;
   ctx.lineWidth = 1.5;
   // 6-8 nested organic bezier contour lines
   // Each is a closed path with bezierCurveTo calls
   ctx.globalAlpha = 1.0;
3. Draw logo mark — #B8A882, 158×158, centered at (525, 240)
4. Draw "COMPANY LOGO" — #B8A882, 24px, 500w, UPPERCASE, 0.15em, centered at (525, 330)
5. Draw "MODERN COMPANY" — #B8A882, 12px, 300w, UPPERCASE, 0.3em, centered at (525, 372)
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Layout | 60/40 vertical split (green/white) | Has left panel 42%, different proportions | 🟡 ~15% |
| Green section | `#4A5D52` dark forest green | Uses cfg.bgColor at 85% opacity | ❌ No |
| White section | Pure white right panel | No white panel | ❌ No |
| Icon strip | Gold rounded rect with white icons at divider | Missing entirely | ❌ No |
| Text color | Muted gold `#B8A882` on green | Uses cfg.textColor | ❌ No |
| Company on white | Green-gray `#6B7B73` text on white panel | Company at bottom, different color | ❌ No |
| QR code | Right panel at 82%, 70% | Missing entirely | ❌ No |
| Back topographic | Full-coverage contour lines at 20% opacity | Has 6 concentric rounded rects (simplified) | 🟡 ~20% |
| Back pattern color | `#3A4A42` at 20% opacity | Uses cfg.primaryColor with strokes | 🟡 ~15% |
| Back layout | Centered gold logo + company text | Logo right side, company bottom-right | ❌ No |
| Name styling | 700w, UPPERCASE, 0.15em, gold color | 700w but no uppercase, no tracking | 🟡 ~10% |

**Reusability: ~12%** — The topographic pattern concept exists (as concentric rounded rects) and could be adapted, but needs bezier contour curves instead. The split layout concept is partially there but with wrong proportions and missing the distinctive gold icon strip. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: organic-pattern
constraints:
  - vertical_split: 60% green left, 40% white right
  - green_section: solid #4A5D52 dark forest green
  - white_section: solid #FFFFFF pure white
  - icon_strip: gold #B8A882 rounded rect at divider, white contact icons inside
  - text_on_green: muted gold #B8A882 for all text on green background
  - text_on_white: muted green-gray #6B7B73 for company on white
  - name_gold: UPPERCASE, 700w, 0.15em tracking, gold on green
  - company_right: logo mark + company name on white section
  - qr_right: QR code on white section at 82% left, 70% top
  - back_full_green: solid #4A5D52 background
  - topographic_pattern: organic contour lines in #3A4A42 at 20% opacity, full coverage
  - back_centered: gold logo (large) + company text centered
  - tagline_wide: UPPERCASE, 300w, 0.3em tracking
  - font_hierarchy: name 30px > company-back 24px > company-front 17px > position 15px > contact 12px
```

---

## 28. Celtic Stripe (`celtic-stripe`)

**Reference image:** `f8d2061b39a68b3adb11ece796042007.jpg`
**Style:** Modern minimalist with geometric interlaced pattern accent strip
**Mood:** Clean, trustworthy, sophisticated, connected
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌──────────────┬──────────────────────────────────────────────────────┐
│  ╳╳╳╳╳╳╳╳╳╳  │                                                     │
│  ╳ INTERLACED │                  White #FFFFFF                      │
│  ╳  PATTERN  ╳│                                                     │
│  ╳╳╳╳╳╳╳╳╳╳  │                                                     │
│  ╳          ╳ │            NAME SURNAME                             │
│  ╳ GEOMETRIC ╳│                                                     │
│  ╳  STRIP   ╳ │            ● john@smith.com                         │
│  ╳╳╳╳╳╳╳╳╳╳  │            ● 111-222-3394                           │
│  ╳          ╳ │            ● www.johnsmith.com                       │
│  ╳  #F8F8F8 ╳ │                                                     │
│  ╳  pattern ╳ │                                                     │
│  ╳╳╳╳╳╳╳╳╳╳  │                                                     │
└──────────────┴──────────────────────────────────────────────────────┘
     Left 25% pattern strip (light gray bg) | Right 75% white content
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#FFFFFF` (pure white) |
| Full coverage | 0, 0, 1050, 600 |

#### Geometric Pattern Strip (Left)
| Property | Value |
|----------|-------|
| Region | 0, 0, 263, 600 (25% W, full height) |
| Strip background | `#F8F8F8` (very light gray) |
| Pattern color | `#2C2C2C` (dark charcoal) |
| Pattern type | Repeating interlaced/interlocking oval-diamond motif |
| Vertical repeat | Pattern tiles vertically throughout full height |
| Pattern unit height | ~75px per repeat |

*Interlaced pattern rendering:*
The pattern consists of interlocking oval/diamond shapes. Each unit:
```
ctx.fillStyle = '#F8F8F8';
ctx.fillRect(0, 0, 263, 600);  // Strip background

ctx.strokeStyle = '#2C2C2C';
ctx.lineWidth = 2;
// For each vertical repeat unit:
for (let y = 0; y < 600; y += 75) {
  // Draw interlocking oval pairs
  ctx.beginPath();
  ctx.ellipse(131, y + 18, 50, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(131, y + 56, 50, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Diamond connecting shapes between ovals
  ctx.beginPath();
  ctx.moveTo(81, y + 37);
  ctx.lineTo(131, y + 22);
  ctx.lineTo(181, y + 37);
  ctx.lineTo(131, y + 52);
  ctx.closePath();
  ctx.stroke();
}
```

#### Contact Icons
| Property | Value |
|----------|-------|
| Type | Small circular icons (email, phone, web) |
| Size | ~9 × 9 px (1.5% H) each |
| Color | `#666666` (medium gray) |
| Position | x: 609 (58%), vertically aligned with each contact line |
| Gap to text | 5% left of contact text |

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Name | Sans-serif geometric | 700 | 36px (6%H) | UPPERCASE | 0.15em | `#2C2C2C` | x: 683 (65%), y: 330 (55%) | Left |
| Email | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#666666` | x: 683, y: 450 (75%) | Left |
| Phone | Sans-serif | 400 | 15px (2.5%H) | Numbers | 0 | `#666666` | x: 683, y: 468 (+18) | Left |
| Website | Sans-serif | 400 | 15px (2.5%H) | lowercase | 0 | `#666666` | x: 683, y: 486 (+18) | Left |

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Pattern strip | 0–25% W (0–263px), full height |
| Content left margin | 35% (368px) from left edge |
| Name at 55% from top (centered vertically in content area) |
| Name → Contact gap | 90px (15% H) |
| Contact line spacing | 18px (3% H) |
| Icons at 58% W, text at 65% W |

---

### Back Side

```
┌──────────────────────────────────────────────────────┬──────────────┐
│                                                       │  ╳╳╳╳╳╳╳╳╳╳ │
│    Dark Charcoal #2C2C2C                              │  ╳ INTERLACED│
│                                                       │  ╳  PATTERN ╳│
│                                                       │  ╳╳╳╳╳╳╳╳╳╳ │
│                                                       │  ╳          ╳│
│            COMPANY NAME                               │  ╳ SAME     ╳│
│              (white)                                  │  ╳ PATTERN  ╳│
│                                                       │  ╳╳╳╳╳╳╳╳╳╳ │
│                                                       │  ╳  WHITE   ╳│
│                                                       │  ╳  on dark ╳│
│                                                       │  ╳╳╳╳╳╳╳╳╳╳ │
└──────────────────────────────────────────────────────┴──────────────┘
     Color-inverted: dark bg, white text, pattern strip on RIGHT
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#2C2C2C` (dark charcoal) |
| Full coverage | 0, 0, 1050, 600 |

#### Geometric Pattern Strip (Right) — Color Inverted
| Property | Value |
|----------|-------|
| Region | 788, 0, 262, 600 (right 25%, full height) |
| Strip background | `#FFFFFF` (white) |
| Pattern color | `#2C2C2C` (dark charcoal) — same pattern as front |
| Position | Mirrored to RIGHT side (75%–100% W) |
| Pattern | Same interlocking oval-diamond motif |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Company | Sans-serif geometric | 700 | 30px (5%H) | UPPERCASE | 0.15em | `#FFFFFF` | x: 368 (35%), y: 390 (65%) | Left |

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Pattern strip | 75%–100% W (788–1050px), full height |
| Company name at 35% left, 65% from top (vertically centered in content area) |
| Right margin for content | 40% from right edge |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| White | `#FFFFFF` | Front background, back pattern strip bg, back text |
| Very Light Gray | `#F8F8F8` | Front pattern strip background |
| Dark Charcoal | `#2C2C2C` | Front name, pattern color, back background |
| Medium Gray | `#666666` | Contact text, contact icons |

*Monochromatic palette — only grays/blacks/whites*

### Logo Treatment
```typescript
logoConfig: {
  technique: "T3",              // Silhouette / monochrome
  placement: "none-explicit",   // No logo in reference — brand name only
  frontBehavior: {
    // No explicit logo on front — name serves as identity
    // If user has logo, place small above name
    position: { x: 683, y: 270 },
    maxSize: { w: 48, h: 48 },
    color: "#2C2C2C",
    opacity: 1.0,
    optional: true
  },
  backBehavior: {
    // Logo above company name on dark background
    position: { x: 368, y: 300 },
    maxSize: { w: 60, h: 60 },
    color: "#FFFFFF",
    opacity: 1.0,
    optional: true
  },
  compositionAdaptations: {
    "separable": { front: "icon-above-name-charcoal", back: "icon-above-company-white" },
    "wordmark-only": { front: "wordmark-above-name", back: "wordmark-replaces-company" },
    "lockup-inseparable": { front: "lockup-above-name", back: "lockup-above-company" },
    "icon-only": { front: "icon-above-name", back: "icon-above-company-white" },
    "emblem": { front: "emblem-above-name", back: "emblem-above-company" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill background #FFFFFF (full card)
2. Draw pattern strip background:
   ctx.fillStyle = '#F8F8F8';
   ctx.fillRect(0, 0, 263, 600);
3. Draw interlaced pattern:
   ctx.strokeStyle = '#2C2C2C';
   ctx.lineWidth = 2;
   for (let y = 0; y < 600; y += 75) {
     // Oval pair
     ctx.beginPath();
     ctx.ellipse(131, y + 18, 50, 18, 0, 0, Math.PI * 2);
     ctx.stroke();
     ctx.beginPath();
     ctx.ellipse(131, y + 56, 50, 18, 0, 0, Math.PI * 2);
     ctx.stroke();
     // Diamond
     ctx.beginPath();
     ctx.moveTo(81, y + 37);
     ctx.lineTo(131, y + 22);
     ctx.lineTo(181, y + 37);
     ctx.lineTo(131, y + 52);
     ctx.closePath();
     ctx.stroke();
   }
4. Draw "NAME SURNAME" — #2C2C2C, 36px, 700w, UPPERCASE, 0.15em at (683, 330)
5. Draw contact icons — #666666, 9×9 at x:609, y: 450/468/486
6. Draw contact text — #666666, 15px, 400w at x:683, y: 450/468/486
```

### Canvas2D Render Recipe — Back
```
1. Fill background #2C2C2C (full card)
2. Draw pattern strip (RIGHT side):
   ctx.fillStyle = '#FFFFFF';
   ctx.fillRect(788, 0, 262, 600);
3. Draw same interlaced pattern on right strip:
   ctx.strokeStyle = '#2C2C2C';
   ctx.lineWidth = 2;
   // Same pattern, offset to x center at 788 + 131 = 919
   for (let y = 0; y < 600; y += 75) {
     ctx.beginPath();
     ctx.ellipse(919, y + 18, 50, 18, 0, 0, Math.PI * 2);
     ctx.stroke();
     // ... same pattern logic
   }
4. Draw "COMPANY NAME" — #FFFFFF, 30px, 700w, UPPERCASE, 0.15em at (368, 390)
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Front background | White `#FFFFFF` | No explicit background | ❌ No |
| Pattern strip (front) | 25% width, left side, interlaced oval-diamond pattern | Has a thin stripe (6%W) with gradient fill + dots | ❌ No |
| Pattern width | 25% of card width | 6% of card width (way too narrow) | ❌ No |
| Pattern type | Interlocking oval/diamond repeating motif | Simple gradient rect + dots | ❌ No |
| Name position | 65% from left, 55% from top | Right of stripe, at top margin | ❌ No |
| Contact styling | Gray `#666666`, lowercase, with small icons | Uses buildContactLayers generic | ❌ No |
| Back side | Dark charcoal bg, pattern on RIGHT, white company name | No back side implementation | ❌ No |
| Color inversion | White front ↔ dark back, pattern strip switches sides | Not implemented | ❌ No |
| Company on back | White, UPPERCASE, centered-left at 35% | Bottom right on front, low opacity | ❌ No |
| Monochrome | Pure grayscale palette | Uses cfg.primaryColor/secondaryColor | ❌ No |

**Reusability: ~5%** — The concept of a stripe exists but at completely wrong proportions (6% vs 25% width) and with the wrong pattern (dots vs interlaced ovals). The color-inverted back side with switched stripe position is entirely missing. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: celtic-stripe
constraints:
  - front_background: pure white #FFFFFF
  - back_background: dark charcoal #2C2C2C
  - pattern_strip_width: exactly 25% of card width, full height
  - pattern_front: LEFT side (0-25% W) on light gray #F8F8F8 bg
  - pattern_back: RIGHT side (75-100% W) on white #FFFFFF bg — mirrored position
  - pattern_type: interlocking oval/diamond repeating motif, NOT simple shapes
  - pattern_color: #2C2C2C charcoal on both sides
  - color_inversion: front white bg → back dark bg; pattern switches sides
  - name_right: UPPERCASE, 700w, 0.15em, #2C2C2C, at 65% left, 55% top
  - contact_gray: lowercase, 400w, #666666, with small gray icons
  - company_back: UPPERCASE, 700w, 0.15em, white, at 35% left, 65% top
  - monochrome: entire card uses ONLY grayscale (#FFFFFF, #F8F8F8, #666666, #2C2C2C)
  - no_logo_explicit: brand identity through pattern + typography only
  - font_hierarchy: name 36px > company 30px > contact 15px
```

---

## 29. Premium Crest (`premium-crest`)

**Reference image:** `9eeddf73c7d746b173ddb28c3c9e8c0d.jpg`
**Style:** Corporate real estate with key-skyline logo and architectural elements
**Mood:** Trustworthy, established, urban-focused, premium
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│    Dark Charcoal #1A1A1A (with subtle grunge texture ~15%)         │
│                                                                     │
│                                          ┌──────────┐              │
│                                          │ 🏙️ KEY   │ cream        │
│   REAL ESTATE                            │ SKYLINE  │ #F5F1E8     │
│   L O R E M  I P S U M                  │  LOGO    │              │
│                                          │    🔑    │              │
│                                          │          │              │
│                                          └──────────┘              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
     Left 60% text zone | Right 40% key-skyline logo
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#1A1A1A` (dark charcoal) |
| Full coverage | 0, 0, 1050, 600 |
| Texture overlay | Subtle grunge/concrete texture at ~15% opacity |
| Texture color | Slightly lighter variations of `#1A1A1A` |

#### Key-Skyline Logo Element
| Property | Value |
|----------|-------|
| Type | Stylized key shape with city skyline integrated into key head |
| Position | x: 683 (65%), y: 300 (50%) — centered in right zone |
| Size | ~368 × 360 px (35%W × 60%H) |
| Color | `#F5F1E8` (cream/beige) |
| Key shaft | Rectangular with rounded bottom end |
| Key head | Circular with 5–6 building silhouettes of varying heights cut into it |
| Key hole | Circle ~8% of key head diameter, filled with `#1A1A1A` (background shows through) |

*Key rendering approach:*
```
// Key shaft
ctx.fillStyle = '#F5F1E8';
ctx.fillRect(810, 320, 50, 220);
roundedBottomRect(810, 500, 50, 40, 10);

// Key head circle
ctx.beginPath();
ctx.arc(835, 250, 90, 0, Math.PI * 2);
ctx.fill();

// Cut skyline silhouette from key head (composite operation)
ctx.globalCompositeOperation = 'destination-out';
// Draw building shapes inside circle
ctx.fillStyle = 'black';
// 5-6 buildings of varying heights
ctx.globalCompositeOperation = 'source-over';

// Key hole
ctx.fillStyle = '#1A1A1A';
ctx.beginPath();
ctx.arc(835, 280, 7, 0, Math.PI * 2);
ctx.fill();
```

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Company | Sans-serif condensed | 700 | 36px (6%H) | UPPERCASE | 0.15em | `#2A2A2A` | x: 263 (25%), y: 270 (45%) | Left |
| Subtitle | Sans-serif | 400 | 18px (3%H) | UPPERCASE | 0.3em | `#2A2A2A` | x: 263, y: 330 (55%) | Left |

*Note: Front text is dark #2A2A2A — it will read on the cream key element or be very subtle on the dark bg. The reference places text in the zone where the key element provides contrast.*

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Left margin | 8% (84px) |
| Right margin | 5% (53px) |
| Text zone | Left 60% (0–630px) |
| Key logo zone | Right 40% (630–1050px), centered at 65% W |
| Company at 45% from top |
| Subtitle at 55% from top |
| Company → Subtitle gap | 18px (3% H) |

---

### Back Side

```
┌─────────────────────────────────────────────────────────────────────┐
│  Cream #F5F1E8                                                      │
│                                                                     │
│ ██████████████████████████████████████████████████████████████████  │
│ ██ CITY SKYLINE SILHOUETTE — dark charcoal #1A1A1A ██████████████  │
│ ██████ 12-15 buildings, full width, top 50% ████████████████████   │
│ ██████████████████████████████████████████████████████████████████  │
│                                                                     │
│   JOHN SMITH                                                        │
│                                                                     │
│                        🌐 WWW.BUSINESSNAME.COM                      │
│                        ✉️  MAIL@YOURNAME.COM                         │
│                        📞 000 12-34-567-89                           │
└─────────────────────────────────────────────────────────────────────┘
```

#### Background
| Property | Value |
|----------|-------|
| Fill | Solid `#F5F1E8` (cream/beige) |
| Full coverage | 0, 0, 1050, 600 |

#### City Skyline Silhouette
| Property | Value |
|----------|-------|
| Type | Architectural skyline — 12–15 buildings of varying heights |
| Region | Full width (0–1050), top 50% (0–300) |
| Color | `#1A1A1A` (dark charcoal) |
| Opacity | 100% |
| Style | Clean geometric rectangular buildings, tallest ~90% of skyline height |
| Features | Mix of towers, some with antennas/architectural details |
| Canvas2D | Polygon path tracing building rooflines, filled solid |

*Skyline rendering:*
```
ctx.fillStyle = '#1A1A1A';
ctx.beginPath();
ctx.moveTo(0, 300);
// Building rooflines (left to right):
ctx.lineTo(0, 250); ctx.lineTo(50, 250);
ctx.lineTo(50, 180); ctx.lineTo(90, 180);   // Short building
ctx.lineTo(90, 100); ctx.lineTo(120, 100);   // Medium building
ctx.lineTo(120, 50); ctx.lineTo(140, 50);    // Tall tower
ctx.lineTo(140, 150); ctx.lineTo(180, 150);  // Step down
// ... continue across full width with varying heights
ctx.lineTo(1050, 200); ctx.lineTo(1050, 0);
ctx.lineTo(0, 0);
ctx.closePath();
ctx.fill();
```

#### Contact Icons
| Property | Value |
|----------|-------|
| Type | Simple line icons (globe, envelope, phone) |
| Size | ~18 × 18 px (3% H) each |
| Color | `#4A4A4A` (medium gray) |
| Position | Left of each contact line |
| Style | Minimalist line art |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Name | Sans-serif condensed | 700 | 48px (8%H) | UPPERCASE | 0.2em | `#2A2A2A` | x: 158 (15%), y: 450 (75%) | Left |
| Website | Sans-serif | 400 | 15px (2.5%H) | UPPERCASE | 0 | `#4A4A4A` | x: 525 (50%), y: 480 (80%) | Left |
| Email | Sans-serif | 400 | 15px (2.5%H) | UPPERCASE | 0 | `#4A4A4A` | x: 525, y: 510 (+12) | Left |
| Phone | Sans-serif | 400 | 15px (2.5%H) | Numbers | 0 | `#4A4A4A` | x: 525, y: 540 (+12) | Left |

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Skyline | Full width, top 50% (0–300px) |
| Name at 15% left, 75% from top |
| Contact at 50% left, 80–90% from top |
| Contact line spacing | 12px (2% H) |
| Bottom margin | 8% (48px) |
| Contact icons left of text, right-aligned group |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Dark Charcoal | `#1A1A1A` | Front background, skyline silhouette, key hole |
| Dark Gray | `#2A2A2A` | Front company text, back name |
| Medium Gray | `#4A4A4A` | Back contact text, icons |
| Cream/Beige | `#F5F1E8` | Key logo, back background |

*Monochromatic: charcoal + cream palette*

### Logo Treatment
```typescript
logoConfig: {
  technique: "T10",             // Custom complex shape (key-skyline)
  placement: "right-zone",      // Front: key-skyline logo; Back: N/A (skyline decorative)
  frontBehavior: {
    // The key-skyline IS the logo — if user uploads logo, embed within key head
    position: { x: 683, y: 120 },
    maxSize: { w: 368, h: 360 },
    color: "#F5F1E8",
    opacity: 1.0,
    // User logo integrates into or replaces key-head skyline
  },
  backBehavior: {
    // No explicit logo on back — skyline is decorative
    position: null,
    display: "none"
  },
  compositionAdaptations: {
    "separable": { front: "icon-in-key-head", back: "none" },
    "wordmark-only": { front: "wordmark-below-key", back: "none" },
    "lockup-inseparable": { front: "lockup-in-key-area", back: "none" },
    "icon-only": { front: "icon-in-key-head-cream", back: "none" },
    "emblem": { front: "emblem-replaces-key-head", back: "none" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill background #1A1A1A (full card)
2. Apply subtle grunge texture (optional noise pattern at 15% opacity)
3. Draw key-skyline logo:
   a. Key shaft: cream #F5F1E8 rectangle + rounded bottom
   b. Key head: cream circle with skyline building cutouts
   c. Key hole: small #1A1A1A circle
4. Draw "REAL ESTATE" — #2A2A2A, 36px, 700w, UPPERCASE, 0.15em at (263, 270)
5. Draw "LOREM IPSUM" — #2A2A2A, 18px, 400w, UPPERCASE, 0.3em at (263, 330)
```

### Canvas2D Render Recipe — Back
```
1. Fill background #F5F1E8 (full card)
2. Draw city skyline silhouette:
   ctx.fillStyle = '#1A1A1A';
   ctx.beginPath();
   // Full-width polygon of building rooflines, top 50%
   // 12-15 buildings of varying heights
   ctx.closePath();
   ctx.fill();
3. Draw "JOHN SMITH" — #2A2A2A, 48px, 700w, UPPERCASE, 0.2em at (158, 450)
4. Draw contact icons — #4A4A4A, 18×18 at x:~500
5. Draw contact text — #4A4A4A, 15px, 400w, UPPERCASE at x:525, y: 480/510/540
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Front background | Dark charcoal `#1A1A1A` with grunge texture | No explicit background | ❌ No |
| Key-skyline logo | Complex combined key+skyline shape in cream | Missing entirely — uses generic buildLogoLayer | ❌ No |
| Front text position | Left zone at 25%, 45%/55% from top | Centered layout, logo at top, company below | ❌ No |
| Front layout | Asymmetric — text left, big logo right | Centered symmetrical layout | ❌ No |
| Subtitle tracking | Very wide 0.3em tracking | Uses letterSpacing: 2 | ❌ No |
| Back side | Cream bg with dark skyline top 50%, name + contact bottom | No back side implementation | ❌ No |
| City skyline | 12–15 geometric buildings, full width, dark on cream | Missing entirely | ❌ No |
| Name on back | Large 48px, UPPERCASE, 0.2em, at 75% from top | Name on front, centered | ❌ No |
| Color scheme | Charcoal `#1A1A1A` + Cream `#F5F1E8` | Uses cfg.primaryColor/textColor | ❌ No |
| Grunge texture | Subtle concrete/grunge at 15% opacity | Missing entirely | ❌ No |
| Right accent bar | Has 3px bar at W-6%, 20-80% height | Wrong element for reference | ❌ No |

**Reusability: ~2%** — Essentially nothing matches. The current code has a centered crest-style layout with logo at top, company below, divider, name, contact — which is a completely different concept from the asymmetric key-skyline design. The defining features (key-with-skyline logo, grunge texture, full-width skyline on back) are entirely missing. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: premium-crest
constraints:
  - front_background: dark charcoal #1A1A1A with subtle grunge texture
  - key_logo: stylized key shape with city skyline in key head, cream #F5F1E8
  - key_position: right 40% zone, centered at 65% W, 50% H
  - key_skyline: 5-6 building silhouettes cut into key head circle
  - key_hole: small circle showing #1A1A1A background through
  - front_text: left 60% zone, company + subtitle
  - company_text: condensed 700w, UPPERCASE, 0.15em, #2A2A2A
  - subtitle_text: 400w, UPPERCASE, 0.3em very wide tracking
  - back_background: cream #F5F1E8
  - back_skyline: full-width 12-15 building silhouette, dark charcoal, top 50%
  - back_name: large 48px, 700w, UPPERCASE, 0.2em, #2A2A2A at 75% from top
  - back_contact: UPPERCASE, gray #4A4A4A, with line icons, right side
  - monochrome_palette: only #1A1A1A, #2A2A2A, #4A4A4A, #F5F1E8
  - font_hierarchy: name-back 48px > company-front 36px > subtitle 18px > contact 15px
```

---

## 30. Gold Construct (`gold-construct`)

**Reference image:** `d528f0b618c11009c08bd2a93beb890e.jpg`
**Style:** Modern minimalist corporate with clean geometric sectioning
**Mood:** Sophisticated, trustworthy, modern, clean
**Card dimensions:** 1050 × 600 px (3.5 × 2 in @ 300 dpi)

### Front Side

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│    Dark Gray #404040                                                │
│                                                                     │
│       JONATHAN DOE                                                  │
│       WEB AND GRAPHIC CONSULTANT                                    │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Light Gray #F5F5F5                                                 │
│  📞 +123-456-789  │  ✉️ info@mail.com  │  📍 123 Street Name        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
     Top 60% dark gray | Bottom 40% light gray contact strip
```

#### Background — Front
| Property | Value |
|----------|-------|
| Top zone | `#404040` (dark gray), 0, 0, 1050, 360 (60% H) |
| Bottom zone | `#F5F5F5` (light gray), 0, 360, 1050, 240 (40% H) |
| Transition | Hard horizontal edge at y: 360 (60%) |

#### Typography — Front

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Name | Sans-serif geometric | 700 | 48px (8%H) | UPPERCASE | 0.15em | `#FFFFFF` | x: 158 (15%), y: 150 (25%) | Left |
| Title | Sans-serif geometric | 300 | 15px (2.5%H) | UPPERCASE | 0.25em | `#CCCCCC` | x: 158, y: 210 (35%) | Left |
| Contact (phone) | Sans-serif | 400 | 12px (2%H) | Sentence | 0 | `#333333` | x: 88 (8%), y: 492 (82%) | Left |
| Contact (email) | Sans-serif | 400 | 12px (2%H) | Sentence | 0 | `#333333` | x: 397 (38%), y: 492 | Left |
| Contact (address) | Sans-serif | 400 | 12px (2%H) | Sentence | 0 | `#333333` | x: 714 (68%), y: 492 | Left |

#### Contact Icon Row
| Property | Value |
|----------|-------|
| Type | Circular icons with symbols (phone, envelope, map-pin) |
| Position | Left of each contact text in bottom section |
| Size | ~32 × 32 px (3%W) each |
| Color | `#333333` |
| Shape | Circle border with icon inside |
| Stroke width | 1px |
| Icon positions | x: 63 (6%), 372 (35.5%), 689 (65.5%), all at y: 488 |

#### Section Dividers — Front
| Property | Value |
|----------|-------|
| Type | Vertical thin lines between contact columns |
| Position 1 | x: 347 (33%), y: 384 → 552, height: 168 (bottom section height × 70%) |
| Position 2 | x: 693 (66%), same vertical span |
| Color | `#DDDDDD` |
| Width | 1px |
| Opacity | 80% |

#### Spacing Map — Front
| Measurement | Value |
|-------------|-------|
| Top margin | 20% (120px) to name |
| Left margin | 15% (158px) for name/title text |
| Dark zone | 0–360px (60% H) |
| Light zone | 360–600px (40% H) |
| Contact row vertical center | ~82% from top (492px) |
| 3 contact columns | ~33% each of width |
| Column dividers at | 33%, 66% from left |
| Name → Title gap | 12px (2% H) |

---

### Back Side

```
┌─────────────────────────────────────────────────────────────────────┐
│ △                                                           △      │
│                                                                     │
│    Dark Gray #2B2B2B with world map dotted overlay                  │
│                                                                     │
│          🔘 (logo placeholder)                                      │
│                                                                     │
│              YOUR COMPANY NAME                                      │
│           YOUR STYLISH SLOGAN HERE                                  │
│                                                                     │
│                                                                     │
│ △                                                           △      │
└─────────────────────────────────────────────────────────────────────┘
     Centered layout with world map overlay + corner accents
```

#### Background — Back
| Property | Value |
|----------|-------|
| Fill | Solid `#2B2B2B` (dark gray-charcoal) |
| Full coverage | 0, 0, 1050, 600 |

#### World Map Pattern Overlay
| Property | Value |
|----------|-------|
| Type | Dotted/stippled world map silhouette |
| Position | Full background coverage |
| Color | `#1A1A1A` |
| Opacity | 30% |
| Style | Small dots forming continental outlines — subtle texture |
| Rendering | Canvas pattern or pre-drawn dot grid following map shape |

*World map rendering approach:*
```
// Option A: Create dot pattern simulating world map
ctx.fillStyle = '#1A1A1A';
ctx.globalAlpha = 0.3;
// Draw dots in continental shapes
// Use a simplified coordinate set for major landmasses
ctx.globalAlpha = 1.0;

// Option B: Draw as a very light subtle texture pattern
// Use noise pattern that suggests continental shapes
```

#### Logo Placeholder
| Property | Value |
|----------|-------|
| Type | Circular aperture/camera icon (placeholder for user logo) |
| Position | x: 368 (35%), y: 210 (35%) |
| Size | ~84 × 84 px (8%W) |
| Color | `#FFFFFF` |
| Stroke width | 2px |
| Style | Thin circle outline with icon symbol inside |

#### Corner Accent Elements
| Property | Value |
|----------|-------|
| Type | Small triangular/bracket corner marks |
| Size | ~21 × 21 px (2% card dimension) |
| Color | `#FFFFFF` |
| Rotation | 45° angles, pointing inward |
| Positions | All four corners, inset ~3% from edges |
| Top-left | x: 32, y: 32 |
| Top-right | x: 1018, y: 32 |
| Bottom-left | x: 32, y: 568 |
| Bottom-right | x: 1018, y: 568 |

#### Typography — Back

| Element | Font | Weight | Size | Case | Tracking | Color | Position | Align |
|---------|------|--------|------|------|----------|-------|----------|-------|
| Company | Sans-serif bold | 700 | 36px (6%H) | UPPERCASE | 0.1em | `#FFFFFF` | x: 525 (50%), y: 330 (55%) | Center |
| Tagline | Sans-serif | 300 | 13px (2.2%H) | UPPERCASE | 0.2em | `#CCCCCC` | x: 525, y: 375 (62%) | Center |

#### Spacing Map — Back
| Measurement | Value |
|-------------|-------|
| Corner accents | ~3% inset from all edges |
| Logo placeholder | 35% left, 35% top |
| Company text | 50% H centered, 55% from top |
| Tagline | Below company, 62% from top |
| Company → Tagline gap | 15px (2.5% H) |
| All text centered horizontally |
| Edge margin for text safety | 10% (105px) from sides |

---

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Dark Gray | `#404040` | Front top background |
| Light Gray | `#F5F5F5` | Front bottom contact strip |
| Dark Charcoal | `#2B2B2B` | Back background |
| Map Overlay | `#1A1A1A` | Back world map pattern |
| White | `#FFFFFF` | Front name, back company/logo/corners |
| Light Gray Text | `#CCCCCC` | Front title, back tagline |
| Dark Text | `#333333` | Front contact text/icons |
| Divider Gray | `#DDDDDD` | Contact column dividers |

*Monochromatic gray scale — no accent colors*

### Logo Treatment
```typescript
logoConfig: {
  technique: "T1",              // Direct placement — clean centered logo
  placement: "back-centered",   // Back: circular logo placeholder; Front: no logo
  frontBehavior: {
    // No explicit logo on front — name IS the brand
    position: null,
    display: "none"
  },
  backBehavior: {
    position: { x: 368, y: 210 },
    maxSize: { w: 84, h: 84 },
    color: "#FFFFFF",
    opacity: 1.0,
    containMode: "fit-circle",
    // Replace aperture placeholder with user logo
  },
  compositionAdaptations: {
    "separable": { front: "none", back: "icon-centered-above-company" },
    "wordmark-only": { front: "none", back: "wordmark-replaces-company-text" },
    "lockup-inseparable": { front: "none", back: "lockup-centered-replaces-placeholder" },
    "icon-only": { front: "none", back: "icon-in-circle-above-company" },
    "emblem": { front: "none", back: "emblem-centered-above-company" }
  }
}
```

### Canvas2D Render Recipe — Front
```
1. Fill top section: ctx.fillStyle = '#404040'; ctx.fillRect(0, 0, 1050, 360);
2. Fill bottom section: ctx.fillStyle = '#F5F5F5'; ctx.fillRect(0, 360, 1050, 240);
3. Draw name "JONATHAN DOE" — #FFFFFF, 48px, 700w, UPPERCASE, 0.15em at (158, 150)
4. Draw title — #CCCCCC, 15px, 300w, UPPERCASE, 0.25em at (158, 210)
5. Draw contact icon circles — #333333, 32px diameter at (63, 488), (372, 488), (689, 488)
   - Phone icon inside first circle
   - Envelope icon inside second circle
   - Map-pin icon inside third circle
6. Draw contact text — #333333, 12px, 400w at (88, 492), (397, 492), (714, 492)
7. Draw vertical dividers — #DDDDDD, 1px at x:347 and x:693, y:384→552, 80% opacity
```

### Canvas2D Render Recipe — Back
```
1. Fill background: ctx.fillStyle = '#2B2B2B'; ctx.fillRect(0, 0, 1050, 600);
2. Draw world map dot pattern:
   ctx.fillStyle = '#1A1A1A';
   ctx.globalAlpha = 0.3;
   // Simplified continental shapes using dot arrays
   ctx.globalAlpha = 1.0;
3. Draw corner accent triangles:
   ctx.fillStyle = '#FFFFFF';
   // 4 small triangles at corners, 45° rotation, ~21px size
   // Top-left: triangle at (32, 32)
   // Top-right: triangle at (1018, 32) mirrored
   // Bottom-left: triangle at (32, 568) mirrored
   // Bottom-right: triangle at (1018, 568) mirrored
4. Draw logo placeholder:
   ctx.strokeStyle = '#FFFFFF';
   ctx.lineWidth = 2;
   ctx.beginPath();
   ctx.arc(410, 252, 42, 0, Math.PI * 2);
   ctx.stroke();
   // Draw aperture icon inside (or replace with user logo)
5. Draw company name — #FFFFFF, 36px, 700w, UPPERCASE, 0.1em at center x:525, y:330
6. Draw tagline — #CCCCCC, 13px, 300w, UPPERCASE, 0.2em at center x:525, y:375
```

### Gap Analysis vs. Current Code

| Aspect | Reference | Current Code | Reusable? |
|--------|-----------|--------------|-----------|
| Front layout | 60/40 horizontal split (dark top / light bottom) | Gold accent bars + vertical divider at 35% | ❌ No |
| Front background | `#404040` top 60%, `#F5F5F5` bottom 40% | No background, uses cfg.primaryColor | ❌ No |
| Name position | Left-aligned at 15%, 25% from top | Left at 42% Y, 8% X margin | ❌ No |
| Name style | White #FFFFFF on dark, 48px, 700w, 0.15em | Uses cfg.textColor, different position | ❌ Partially |
| Title style | Light 300w, 0.25em tracking, #CCCCCC | 400w, in gold primaryColor, different concept | ❌ No |
| Contact layout | 3-column bottom strip with circular icons + dividers | Right of vertical divider, no columns | ❌ No |
| Contact icons | Circular icons (phone, envelope, map-pin) | buildContactLayers (different format) | ❌ No |
| Column dividers | 1px vertical at 33%, 66% in bottom section | Single V-divider at 35% full-height | ❌ No |
| Gold accent bars | None — pure gray monochrome | Top/bottom gold bars at 60% opacity | ❌ No |
| Back side | Dark #2B2B2B with world map dots, corner accents | No back side implementation | ❌ No |
| World map pattern | Dotted continental overlay at 30% opacity | Missing entirely | ❌ No |
| Corner accents | Small white triangles in all 4 corners | Missing entirely | ❌ No |
| Back logo | Circular aperture placeholder, centered | Missing entirely | ❌ No |
| Back company | Centered 36px 700w white on dark | Missing entirely | ❌ No |
| Color scheme | Pure monochrome grays | Uses cfg.primaryColor (gold-toned) | ❌ No |

**Reusability: ~5%** — Only the basic text layer creation pattern is partially reusable. The current code implements a "gold construct" concept with gold accent bars, a vertical divider, and a split layout — which is an entirely different design from the reference's clean 60/40 horizontal split with a 3-column contact strip. The back side (world map pattern, corner accents, centered logo+company) is completely absent. The monochrome gray palette clashes with the current gold-accent approach. Complete rewrite required.

### AI Design Director Constraints
```yaml
template: gold-construct
constraints:
  - front_layout: 60/40 horizontal split — dark gray top, light gray bottom
  - front_top_bg: #404040 solid, covers 0-60% height
  - front_bottom_bg: #F5F5F5 solid, covers 60-100% height
  - name_style: white #FFFFFF, 48px, 700w, UPPERCASE, 0.15em, left-aligned at 15%, 25%
  - title_style: #CCCCCC, 15px, 300w (light), UPPERCASE, 0.25em very wide tracking
  - contact_strip: bottom 40% in light gray, 3 equal columns
  - contact_icons: circular outlined icons (phone, envelope, map-pin), #333333
  - column_dividers: 1px #DDDDDD at 33% and 66%, 80% opacity
  - contact_text: #333333, 12px, sentence case
  - back_bg: #2B2B2B dark charcoal
  - back_world_map: dotted continental pattern at 30% opacity #1A1A1A
  - back_corners: small white triangle accents in all 4 corners
  - back_logo: circular placeholder, white #FFFFFF, 2px stroke, at 35% left, 35% top
  - back_company: centered white 36px 700w UPPERCASE 0.1em
  - back_tagline: centered #CCCCCC 13px 300w UPPERCASE 0.2em
  - monochrome_palette: no accent colors — pure grayscale
  - font_hierarchy: name 48px > company-back 36px > title-front 15px > tagline 13px > contact 12px
```

---

## SPECIFICATIONS COMPLETE

All 30 template specifications have been documented with pixel-perfect measurements, Canvas2D render recipes, logo treatment configurations, gap analyses, and AI design director constraints. Each template is ready for implementation.

### Summary of Reusability Scores
| # | Template | Reusable % |
|---|----------|-----------|
| 1 | ultra-minimal | ~5% |
| 2 | monogram-luxe | ~5% |
| 3 | geometric-mark | ~3% |
| 4 | frame-minimal | ~5% |
| 5 | split-vertical | ~10% |
| 6 | diagonal-mono | ~3% |
| 7 | cyan-tech | ~10% |
| 8 | corporate-chevron | ~5% |
| 9 | zigzag-overlay | ~3% |
| 10 | hex-split | ~5% |
| 11 | dot-circle | ~3% |
| 12 | wave-gradient | ~5% |
| 13 | paper-layered | ~5% |
| 14 | circle-portrait | ~5% |
| 15 | duotone-blocks | ~8% |
| 16 | mosaic-grid | ~3% |
| 17 | corner-cascade | ~5% |
| 18 | arrow-dynamic | ~3% |
| 19 | grid-overlay | ~5% |
| 20 | neon-watermark | ~5% |
| 21 | blueprint-tech | ~5% |
| 22 | skyline-silhouette | ~10% |
| 23 | world-map | ~5% |
| 24 | diagonal-gold | ~3% |
| 25 | luxury-divider | ~5% |
| 26 | social-band | ~10% |
| 27 | organic-pattern | ~12% |
| 28 | celtic-stripe | ~5% |
| 29 | premium-crest | ~2% |
| 30 | gold-construct | ~5% |

**Average reusability: ~5.3%** — All 30 templates require near-complete rewrites.

---

*Last Updated: 2026-02-19*
*Status: All 30 template specifications COMPLETE ✅*
