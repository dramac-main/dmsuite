# Logo Treatment Analysis — 10 Reference Business Cards

> **Purpose:** Analyze HOW logos are used as design elements across 10 reference templates. This analysis drives the logo rendering engine architecture.

---

## Template #1 — `ultra-minimal` (MUN card)
**File:** `6ed0ec5d9a915d54a12b7bd525d0a382.jpg`

### Logo Treatment Type: `text-logo-with-watermark-echo`

| Question | Answer |
|----------|--------|
| **Logo visible?** | Yes — text-based "MUN" logotype (not a graphical mark). Front: centered. Back: lower-left. |
| **Full or reduced opacity?** | **Front:** Full opacity (`#4a4a4a` medium gray on `#f8f9fa` background). **Back:** Reduced opacity (`#b0b0b0` very light gray on `#ffffff` — ~30% perceived contrast). |
| **Cropped/partial?** | No — fully contained on both sides. |
| **Enlarged beyond normal?** | Front: ~8% of card height — normal logo size. Back: ~6% — slightly smaller than front, NOT enlarged. |
| **Background element (watermark)?** | **Yes on back.** The `#b0b0b0` color on white creates a subtle watermark/ghost effect. It's clearly secondary to the contact info above it. |
| **Primary visual?** | **Yes on front.** The MUN text + thin accent line are the ONLY elements — making the logo the sole visual. |
| **Repeated/patterned?** | No pattern. But logo appears on BOTH sides — front as hero, back as watermark. |
| **Tinted/recolored?** | Yes — same logotype rendered in two different grays: `#4a4a4a` (front, mid-gray) and `#b0b0b0` (back, light gray). Neither is the "original" — both are contextual. |
| **Integrated with geometry?** | Minimal — a thin horizontal line accent sits above the logo on front. No geometric merge. |
| **Different front vs back?** | **Yes.** Front: centered, mid-gray, with accent line, primary element. Back: lower-left corner, very light gray, watermark role, behind contact hierarchy. |
| **Card surface %?** | Front: ~5% (tiny text in massive whitespace). Back: ~4% (small watermark). |
| **Bleeds off edge?** | No — generously padded from all edges. |

### Key Insight for Engine
The logo is a **text logotype** (not an image/graphic). It appears twice across the card with **two different opacity treatments**: full-weight hero on front, ghosted watermark on back. The engine needs to support **dual-instance logo rendering** with per-instance opacity control.

---

## Template #2 — `monogram-luxe` (SH card)
**File:** `89fb07c3dc093631d699d53a56173205.jpg`

### Logo Treatment Type: `monogram-as-primary-graphic`

| Question | Answer |
|----------|--------|
| **Logo visible?** | Yes — oversized typographic monogram "SH". No separate graphical logo exists. The monogram IS the brand identity. |
| **Full or reduced opacity?** | Full opacity on both sides. Front: `#2d2d2d` (charcoal). Back: `#ffffff` (white on dark background). |
| **Cropped/partial?** | No — fully visible on both sides. |
| **Enlarged beyond normal?** | **Yes, massively.** Front: ~25% of card height. Back: ~30% of card height. This is 5-8x larger than a typical "corner logo" placement. |
| **Background element?** | No — it's the foreground hero element on BOTH sides. Never recedes. |
| **Primary visual?** | **Yes, absolutely.** The monogram dominates both sides. It occupies the most visual weight on every surface. |
| **Repeated/patterned?** | Not patterned, but appears on both sides as the dominant visual. |
| **Tinted/recolored?** | **Yes — inverted.** Front: dark monogram on light background. Back: white monogram on dark background. The monogram changes color to match the inverted scheme. |
| **Integrated with geometry?** | No — pure typography. The monogram stands alone with no geometric integration. |
| **Different front vs back?** | **Yes.** Front: left-positioned (15%, 25%), charcoal, 25% height, shares space with name/contact. Back: centered (50%, 35%), white on dark, 30% height, sole element with name below. |
| **Card surface %?** | Front: ~15% (large monogram). Back: ~20% (even larger, centered). |
| **Bleeds off edge?** | No — padded from edges, though the monogram is massive. |

### Key Insight for Engine
The monogram serves as both **logo AND primary visual**. There's no separate "logo image" — the monogram is generated from initials using a display serif font at extreme scale. Engine needs: **monogram generator** that creates oversized typographic initials with configurable font, weight, size-as-percentage, and **color inversion** between front/back.

---

## Template #3 — `geometric-mark` (AV card)
**File:** `71f407bd7e2cfba4a2fc10159b108582.jpg`

### Logo Treatment Type: `primary-graphic-front` + `enlarged-watermark-back`

| Question | Answer |
|----------|--------|
| **Logo visible?** | Yes — geometric interlocking "AV" monogram with hatching fill. |
| **Full or reduced opacity?** | **Front:** Full opacity (white `#ffffff` hatching on dark `#292a2c`). **Back:** ~25-30% perceived opacity (`#b9baba` hatching on `#fafbfd`). |
| **Cropped/partial?** | **Back: YES — partially cropped.** The watermark extends to card edges: x=35%–100%, y=0%–90%. The right side and bottom portions bleed to the card boundary. |
| **Enlarged beyond normal?** | **Massively.** Front: 28% width × 31% height — already huge. Back: **~65% width × 90% height** — occupies nearly the ENTIRE card surface. ~2.3x scale-up from front. |
| **Background element?** | **Back: YES.** The watermark sits behind ALL text elements. Text renders on top of the faint hatching. |
| **Primary visual?** | **Front: YES — the ONLY element.** No text whatsoever on front. The hatched monogram is the sole visual. |
| **Repeated/patterned?** | The monogram uses internal 45° diagonal hatching lines (~1% card width spacing). The hatching IS a pattern, but the logo itself is not repeated as a pattern. |
| **Tinted/recolored?** | Yes — `#ffffff` hatching (front) vs `#b9baba` hatching (back). Same geometry, different color/opacity. |
| **Integrated with geometry?** | **Yes, deeply.** The monogram is constructed as two interlocking parallelogram ribbons creating an impossible/Penrose-like over-under weave. The hatching fill mimics engraving technique. The overall silhouette is a diamond/rhombus. |
| **Different front vs back?** | **Dramatically different.** Front: 28%×31%, centered, white, sole element, full opacity. Back: 65%×90%, shifted right to (67%, 45%), light gray, watermark, behind text. |
| **Card surface %?** | Front: ~20% (the hatched area within bounding box, accounting for negative space). Back: **~55-60%** of card surface covered by watermark bounding box. |
| **Bleeds off edge?** | **Back: YES.** Watermark extends to x=100% (right edge) and y=0% (top edge) and y=90% (near bottom). Front: No bleed. |

### Key Insight for Engine
This is the most complex logo treatment. The engine must support:
1. **Same logo at two radically different scales** (1x vs 2.3x)
2. **Opacity variation** (full white vs faded gray)
3. **Edge bleed/cropping** on back (logo extends beyond card boundaries)
4. **Z-ordering** (behind text on back, sole element on front)
5. **Hatching/engraving fill** pattern within logo shape (not solid fill)
6. The logo on front is **the sole visual with no text** — the engine must handle "logo-only front" mode.

---

## Template #4 — `frame-minimal` (Corner brackets card)
**File:** `eadf9c427d539e35f32ac013c0d85254.jpg`

### Logo Treatment Type: `no-logo-visible`

| Question | Answer |
|----------|--------|
| **Logo visible?** | **No.** There is no company logo, brand mark, or monogram anywhere on the card. |
| **Full or reduced opacity?** | N/A |
| **Cropped/partial?** | N/A |
| **Enlarged beyond normal?** | N/A |
| **Background element?** | N/A |
| **Primary visual?** | The **L-shaped corner brackets** (top-left + bottom-right) serve as the primary decorative motif, but they are geometric elements, not a logo. |
| **Repeated/patterned?** | N/A |
| **Tinted/recolored?** | N/A |
| **Integrated with geometry?** | N/A |
| **Different front vs back?** | N/A — no logo on either side. |
| **Card surface %?** | 0% — no logo. |
| **Bleeds off edge?** | N/A |

### Key Insight for Engine
**Not every template uses a logo.** The engine must gracefully handle `logo: none` or `logo: hidden` state. The visual identity is carried entirely by typography, corner brackets, and colored dots. When user has no logo, the template should still look complete and intentional — not "missing something."

---

## Template #5 — `split-vertical` (Pathetic Studio)
**File:** `2098fa67096a4995f92f5afb0327b376.jpg`

### Logo Treatment Type: `small-mark-front` + `centered-feature-back`

| Question | Answer |
|----------|--------|
| **Logo visible?** | Yes — abstract geometric mark (5 horizontal bars of varying widths). |
| **Full or reduced opacity?** | Full opacity on both sides. Front: `#ffffff` (white on charcoal). Back: `#ffffff` (white on charcoal). |
| **Cropped/partial?** | No — fully visible on both sides. |
| **Enlarged beyond normal?** | Front: Small (~2.7% width × 4% height) — standard mark size. Back: **Significantly enlarged** (~32% width × 17% height) — the geometric X/cross mark dominates the center band. |
| **Background element?** | No — it's a foreground element on both sides. |
| **Primary visual?** | Front: No — the diagonal split IS the primary visual. The mark is a secondary accent. **Back: Yes** — the geometric mark is centered in a full-width dark band that occupies 26% of card height, creating a dedicated "logo showcase" zone. |
| **Repeated/patterned?** | No. Different marks on front vs back (5-bar abstract on front, geometric X/cross on back). |
| **Tinted/recolored?** | No — white on dark on both sides. |
| **Integrated with geometry?** | **Front: Yes** — the mark is positioned within the dark zone of the diagonal split, using the geometry as its container. **Back: Yes** — the mark sits in a dedicated full-dark band (y=46-72%), and the surrounding diagonal zones frame it. |
| **Different front vs back?** | **Yes, significantly.** Front: small abstract bar mark, upper-left of dark zone, accent role. Back: large geometric cross/X mark, dead-center in dedicated dark band, hero role. |
| **Card surface %?** | Front: ~1-2%. Back: ~5-6% (mark itself within the 26% dark band). |
| **Bleeds off edge?** | No. |

### Key Insight for Engine
Front and back use **different logo representations** — a small abstract mark (front) and a larger geometric mark (back). The engine needs to support **dedicated logo zones** — a reserved area where the layout creates a "stage" for the logo (the full-dark band on back). The logo size can shift dramatically between sides (tiny accent → centered feature).

---

## Template #6 — `diagonal-mono` (Geometric diagonal)
**File:** `5ba8709cd23f697b94e7e0606be948ca.jpg`

### Logo Treatment Type: `no-logo-front` + `geometric-mark-back`

| Question | Answer |
|----------|--------|
| **Logo visible?** | **Front: No explicit logo.** The angular zigzag boundary IS the visual identity. **Back: Yes** — abstract geometric cross/X mark centered in full-dark band. |
| **Full or reduced opacity?** | Back mark: Full opacity (`#ffffff` white on `#232323` dark). |
| **Cropped/partial?** | No. |
| **Enlarged beyond normal?** | Back mark: ~32% width × 17% height — large, but proportional to the dedicated dark band. |
| **Background element?** | No — foreground on back. |
| **Primary visual?** | **Front: The zigzag geometry IS the visual** — no logo needed. **Back: Yes** — the mark is the focal point of the full-dark band. |
| **Repeated/patterned?** | No. The large angled name "HENRY SOAZ" on the front's light zone acts as decorative text (rotated ~30-35°), but it's typography, not a logo. |
| **Tinted/recolored?** | N/A. |
| **Integrated with geometry?** | **Back: Yes.** The mark sits in a full-width dark band (y=46-72%) created by the converging diagonal zones. The geometry literally creates a "stage" for the logo. |
| **Different front vs back?** | Yes — no logo on front at all. Logo only on back, centered in dedicated zone. |
| **Card surface %?** | Front: 0%. Back: ~5-6%. |
| **Bleeds off edge?** | No. |

### Key Insight for Engine
Some templates don't use the logo on the front AT ALL. The front's visual identity comes entirely from **structural geometry** (the zigzag boundary) and typography. The engine must support a `logoSide: 'back-only'` mode where the front deliberately omits the logo in favor of geometric patterns.

---

## Template #7 — `cyan-tech` (Code Pro)
**File:** `0ee9d22976cfb37b987ad0682db26ed8.jpg`

### Logo Treatment Type: `standard-icon-above-name`

| Question | Answer |
|----------|--------|
| **Logo visible?** | Yes — gear/cog icon with code brackets (line-art style). Front: above company name. Back: white triangle/arrow mark near QR code. |
| **Full or reduced opacity?** | Full opacity on both sides. Front: `#D6D6D6` (off-white). Back: `#FFFFFF`/`#D6D6D6` (white/off-white). |
| **Cropped/partial?** | No — fully visible. |
| **Enlarged beyond normal?** | **No.** Front icon: ~10% of card width — standard logo/icon size. Back triangle: ~18% width — slightly larger but still within normal range. |
| **Background element?** | No — foreground on both sides. |
| **Primary visual?** | **No.** The cyan wave is the primary visual. The gear icon is secondary, positioned above the company name as a brand identifier. |
| **Repeated/patterned?** | No. Front uses a gear icon; back uses a different triangle/arrow mark. Two different brand elements. |
| **Tinted/recolored?** | Both rendered in off-white/white to match the dark background context. |
| **Integrated with geometry?** | **Minimal.** The icon sits in the dark zone, spatially separated from the cyan wave. The back triangle mark is positioned near the QR code at card bottom. No geometric merging. |
| **Different front vs back?** | **Yes.** Front: gear icon at (31%, 30%), line-art, above company name. Back: triangle mark at (48%, 72-80%), solid fill, near QR code area. Different visual forms. |
| **Card surface %?** | Front: ~3-4%. Back: ~3-4%. |
| **Bleeds off edge?** | No. |

### Key Insight for Engine
This is the most **conventional** logo treatment — small icon positioned above the company name, acting as a brand identifier. The dominant visual is the decorative wave, not the logo. Engine needs standard `standard-placement` mode: small logo → company name → tagline, vertically stacked, left-aligned. The back uses a **different brand mark** than the front — engine should support `frontLogo` vs `backLogo` differentiation.

---

## Template #8 — `corporate-chevron` (Chevrons)
**File:** `1cf439f4c957d449e8af25f30a7942dd.jpg`

### Logo Treatment Type: `tiny-geometric-anchor` (back only)

| Question | Answer |
|----------|--------|
| **Logo visible?** | **Front: No.** The layered chevron V-shapes are decorative pattern, not a logo. Company name is text-only. **Back: Barely.** A tiny geometric triangle/chevron mark at (7%, 57%), ~5% of card width. |
| **Full or reduced opacity?** | Back mark: Full opacity (`#444648` dark charcoal on `#EFEFEF` light background). |
| **Cropped/partial?** | No. |
| **Enlarged beyond normal?** | **No — opposite.** The back mark is tiny (~5% width). Understated. |
| **Background element?** | No. But the chevron V-shapes on the front (at ~30% and ~8% perceived opacity) act as decorative background patterns. These are NOT the logo — they're structural decoration. |
| **Primary visual?** | **No.** The chevron patterns are the primary visual (front). The company name text "COMPANY" is the primary identifier. |
| **Repeated/patterned?** | The chevron motif repeats (2 V-shapes on front, 1-2 on back), but this is decorative pattern, not logo repetition. |
| **Tinted/recolored?** | The chevrons use multiple tonal values (`#324154` lighter, `#1A202A` darker) creating depth layers. |
| **Integrated with geometry?** | **The tiny back mark echoes the chevron motif** — it's a miniature triangle/V matching the card's overall angular design language. The mark and the decorative pattern share visual DNA. |
| **Different front vs back?** | Front: no logo. Back: tiny geometric anchor mark. |
| **Card surface %?** | Front: 0%. Back: <1% (tiny mark). |
| **Bleeds off edge?** | No. |

### Key Insight for Engine
The logo mark is **almost invisible** — a tiny geometric accent that echoes the card's overall pattern language. The visual identity is carried by the **decorative pattern system** (chevrons), not by the logo. Engine needs to understand that some templates use **pattern-as-identity** with the logo reduced to a micro-accent or eliminated entirely.

---

## Template #9 — `zigzag-overlay` (Lime/Charcoal)
**File:** `dd0acc18c0824cdca8a1969e711c4e4e.jpg`

### Logo Treatment Type: `no-logo-visible` (or `micro-accent`)

| Question | Answer |
|----------|--------|
| **Logo visible?** | **Barely/No.** Front: possible lime-green tinted text or tiny mark detected at y=97-98%, x=20-44% — extremely small if present. Back: No logo — the overlapping angular shapes (charcoal + lime) ARE the visual identity. |
| **Full or reduced opacity?** | If present, the front mark is at full opacity but lime-tinted (~`#D6DCB7` / `#CAD592`). |
| **Cropped/partial?** | N/A. |
| **Enlarged beyond normal?** | N/A — no standard logo placement. |
| **Background element?** | The angular shapes on the back (charcoal + lime converging triangles) occupy ~60% of the card and could be seen as "logo-scale" brand graphics, but they're structural/geometric, not a tradtional logo. |
| **Primary visual?** | **The geometric shapes ARE the primary visual.** Front: charcoal diagonal triangle + orange-to-magenta gradient bar. Back: converging charcoal + lime angular forms with zigzag edge. |
| **Repeated/patterned?** | No. |
| **Tinted/recolored?** | The faint lime-tinted text near the bottom suggests brand color integration. |
| **Integrated with geometry?** | Fully — the angular shapes and color blocks ARE the brand expression. |
| **Different front vs back?** | The geometric language is consistent (angular forms, charcoal + accent color) but uses different compositions per side. |
| **Card surface %?** | 0% (traditional logo) or <1% (micro-accent). |
| **Bleeds off edge?** | **The geometric shapes DO bleed off edges** — the gradient bar touches the left edge, the charcoal triangle extends to right and bottom edges, and the back shapes touch top/right edges. |

### Key Insight for Engine
This card has **no traditional logo** — visual identity is expressed entirely through **large geometric shapes, color blocks, and angular compositions**. The engine must handle templates where the "logo" is replaced by **structural graphic design elements** (converging triangles, gradient bars, zigzag boundaries). Consider this a `pattern-as-brand` approach.

---

## Template #10 — `hex-split` (Hexagonal blue)
**File:** `af959c2c59ddb44eac21147cb3cab7c4.jpg`

### Logo Treatment Type: `standard-centered-above-name`

| Question | Answer |
|----------|--------|
| **Logo visible?** | Yes — geometric hexagonal line-art logo with internal cube/box shape. Front only. |
| **Full or reduced opacity?** | Full opacity. `#ffffff` white stroke on `#2C4F6B` dark navy background. |
| **Cropped/partial?** | No — fully visible, well-padded. |
| **Enlarged beyond normal?** | **No.** ~8% of card width × ~12% of card height — standard centered logo size. |
| **Background element?** | **The wave pattern is a background element** (subtle repeating chevron at ~20% opacity), but the LOGO itself is foreground. |
| **Primary visual?** | **Shared.** The hexagonal logo + company name + tagline form a centered vertical stack. The wave pattern background provides texture. The logo is prominent but not oversized. |
| **Repeated/patterned?** | No. Logo appears once (front only). The background wave/chevron pattern is a separate decorative element. |
| **Tinted/recolored?** | White on dark navy — contextual color (not the "original" brand color). |
| **Integrated with geometry?** | **Slightly.** The hexagonal logo echoes the geometric/angular design language of the wave pattern. Both use sharp angles. But they don't physically merge. |
| **Different front vs back?** | **Logo appears on front ONLY.** Back side uses name + title + contact grid without any logo. |
| **Card surface %?** | Front: ~3-4%. Back: 0%. |
| **Bleeds off edge?** | No. |

### Key Insight for Engine
The most **conventional corporate** logo treatment — centered above company name, modest size, front-side only. Back side omits the logo entirely, using only text-based layout. Engine needs a clean `standard-centered` mode: logo → name → tagline (vertical stack, centered horizontally). The back side is logo-free by design.

---

## Summary: Logo Treatment Taxonomy

| # | Template | Treatment Type | Front Logo | Back Logo | Max Size (% card) | Key Behavior |
|---|----------|---------------|------------|-----------|-------------------|--------------|
| 1 | ultra-minimal | `text-logo-with-watermark-echo` | ✅ Centered, full opacity | ✅ Lower-left, faded (~30%) | 5% / 4% | Dual-instance, opacity variation |
| 2 | monogram-luxe | `monogram-as-primary-graphic` | ✅ Left, 25% height | ✅ Centered, 30% height | 15% / 20% | Oversized monogram, color-inverted per side |
| 3 | geometric-mark | `primary-graphic` + `enlarged-watermark` | ✅ Centered, sole element | ✅ Watermark, 65%×90% | 20% / 55-60% | Logo-only front, massive bleed watermark back |
| 4 | frame-minimal | `no-logo-visible` | ❌ None | ❌ None | 0% | Typography + geometry only |
| 5 | split-vertical | `small-mark` + `centered-feature` | ✅ Small abstract mark | ✅ Large centered X mark | 2% / 6% | Tiny front → large back, dedicated dark band |
| 6 | diagonal-mono | `no-logo-front` + `geometric-back` | ❌ None | ✅ Geometric mark, dark band | 0% / 6% | Logo omitted from front entirely |
| 7 | cyan-tech | `standard-icon-above-name` | ✅ Gear icon, 10% width | ✅ Triangle mark near QR | 4% / 4% | Conventional placement, different marks per side |
| 8 | corporate-chevron | `tiny-geometric-anchor` | ❌ None | ✅ Tiny mark, <1% | 0% / <1% | Pattern IS the identity, logo micro-accent |
| 9 | zigzag-overlay | `no-logo-visible` | ❌ ~None | ❌ None | 0% | Geometric shapes ARE the brand |
| 10 | hex-split | `standard-centered-above-name` | ✅ Hex icon, 4% | ❌ None | 4% / 0% | Conventional corporate, front only |

---

## Logo Treatment Categories for Engine Architecture

Based on this analysis, the logo rendering engine must support **8 distinct treatment modes**:

### 1. `standard-placement`
- Small logo (3-10% of card width)
- Positioned above/beside company name
- Full opacity
- Front side, sometimes back
- **Templates:** #7 (cyan-tech), #10 (hex-split)

### 2. `monogram-primary`
- Oversized typographic initials (15-30% of card height)
- Generated from user's initials
- Primary visual element — dominates the card
- Color-inverts between front/back
- **Templates:** #2 (monogram-luxe)

### 3. `primary-graphic-sole-element`
- Logo is the ONLY visual on front (no text)
- Large scale (20-30% of card dimensions)
- Full opacity, high contrast
- May use special fill techniques (hatching, gradient)
- **Templates:** #3 (geometric-mark, front side)

### 4. `enlarged-watermark`
- Logo blown up to 50-90% of card surface
- Reduced opacity (20-35% perceived)
- Behind all text elements (lowest z-order)
- May bleed off card edges (cropped)
- **Templates:** #3 (geometric-mark, back side), #1 (ultra-minimal, back side)

### 5. `centered-feature-in-band`
- Logo placed in a dedicated full-width dark band
- Band is ~20-30% of card height
- Logo centered within the band
- Creates a "showcase" zone framed by geometry
- **Templates:** #5 (split-vertical, back), #6 (diagonal-mono, back)

### 6. `micro-accent`
- Tiny mark (<2% of card)
- Echoes the card's pattern language
- Functions as a visual anchor, not primary identity
- **Templates:** #8 (corporate-chevron, back side)

### 7. `no-logo`
- No logo on one or both sides
- Visual identity carried by geometry/typography/pattern
- Engine must render complete design without logo
- Card looks intentionally logo-free, not "missing"
- **Templates:** #4 (frame-minimal), #9 (zigzag-overlay), plus front sides of #6, #8

### 8. `text-logotype`
- Company name rendered in specific typography IS the logo
- No separate graphic mark
- May appear at different weights/opacities per side
- **Templates:** #1 (ultra-minimal — "MUN" as logotype)

---

## Engine Architecture Requirements

### Per-Instance Logo Properties
Each logo instance (front/back) needs independent control over:

```typescript
interface LogoInstance {
  // Visibility
  visible: boolean;
  side: 'front' | 'back' | 'both';

  // Positioning
  position: { x: number; y: number };        // % of card
  anchor: 'center' | 'top-left' | 'top-center' | 'bottom-left' | 'custom';

  // Sizing
  size: number;                               // % of card width
  scaleMode: 'standard' | 'enlarged' | 'watermark' | 'micro';

  // Opacity & Layer
  opacity: number;                            // 0-1
  zOrder: 'foreground' | 'background';        // behind text or on top

  // Edge Behavior
  bleed: boolean;                             // extends beyond card boundary?
  bleedEdges: ('top' | 'right' | 'bottom' | 'left')[];

  // Fill Treatment
  fillMode: 'solid' | 'hatching' | 'gradient' | 'outline';
  hatchingAngle?: number;                     // degrees (e.g., 45)
  hatchingSpacing?: number;                   // % of card width

  // Color
  color: string;                              // hex
  colorMode: 'original' | 'monochrome' | 'inverted' | 'tinted';
  tintColor?: string;                         // override color

  // Type
  logoType: 'image' | 'monogram' | 'text-logotype' | 'geometric-mark' | 'icon';
}
```

### Treatment Presets
Each template should declare a `logoTreatment` preset that configures the above properties:

```typescript
type LogoTreatment =
  | 'standard-placement'           // small, above name, full opacity
  | 'monogram-primary'             // oversized initials, hero element
  | 'primary-graphic-sole'         // logo-only front, no text
  | 'enlarged-watermark'           // massive, faded, behind text, may bleed
  | 'centered-feature-in-band'     // in dedicated dark showcase band
  | 'micro-accent'                 // tiny geometric echo of pattern
  | 'no-logo'                      // explicitly hidden
  | 'text-logotype'                // company name AS the logo
  | 'text-logo-with-watermark';    // text logo on front + faded echo on back
```

### Front/Back Independence
Critical: front and back logo treatments are **independent**. Common combinations observed:

| Front Treatment | Back Treatment | Example |
|----------------|----------------|---------|
| `standard-placement` | `no-logo` | #10 hex-split |
| `standard-placement` | `standard-placement` (different mark) | #7 cyan-tech |
| `primary-graphic-sole` | `enlarged-watermark` | #3 geometric-mark |
| `monogram-primary` | `monogram-primary` (inverted) | #2 monogram-luxe |
| `text-logotype` | `enlarged-watermark` (faded) | #1 ultra-minimal |
| `small-mark` | `centered-feature-in-band` | #5 split-vertical |
| `no-logo` | `centered-feature-in-band` | #6 diagonal-mono |
| `no-logo` | `micro-accent` | #8 corporate-chevron |
| `no-logo` | `no-logo` | #4, #9 |

---

## Critical Findings for Implementation

### 1. Logo is NOT Always Present
**4 out of 10** templates have NO logo on the front. **3 out of 10** have no logo on EITHER side. The engine MUST treat logo as optional and templates must look complete without one.

### 2. Size Range is Extreme
Logo size ranges from **<1%** of card surface (micro-accent) to **55-60%** (enlarged watermark). That's a ~60x size range. The engine cannot assume any fixed size — it must be fully parametric.

### 3. Dual-Instance is Common
**6 out of 10** templates show the logo on both sides, often with **completely different treatments** — different sizes, opacities, positions, and even different graphical forms.

### 4. The Logo Can BE the Entire Front
Template #3 uses the logo as the ONLY element on the front — no text, no contact info. The engine needs a `logo-only` front mode.

### 5. Watermarks Need Edge Bleed
The enlarged watermark (Template #3 back) extends beyond card boundaries. The rendering engine must support **overflow rendering** — draw the logo larger than the card and clip to card bounds.

### 6. Monograms Need Generation
Templates #1, #2, #3 don't use uploaded logo images — they generate visual marks from initials/text. The engine needs a **monogram generator** alongside an image logo renderer.

### 7. Color Inversion is a Pattern
Multiple templates flip the logo color when switching between dark/light backgrounds (dark logo on light front → white logo on dark back). This should be **automatic** based on background luminance.
