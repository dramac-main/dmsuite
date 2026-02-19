# Logo Treatment System — Complete Reference

> **Purpose:** This document is the single source of truth for how user-uploaded logos are
> used creatively across all 30 business card templates. Every template specification
> and implementation MUST reference this document for logo treatment decisions.

---

## Table of Contents

1. [Core Principle](#1-core-principle)
2. [Logo Composition Types](#2-logo-composition-types)
3. [The 12 Logo Treatment Techniques](#3-the-12-logo-treatment-techniques)
4. [Per-Template Logo Treatment Map](#4-per-template-logo-treatment-map)
5. [Fallback Chains (Technique × Logo Type)](#5-fallback-chains)
6. [Architecture & Interfaces](#6-architecture--interfaces)
7. [AI Auto-Detection](#7-ai-auto-detection)
8. [Rendering Implementation Notes](#8-rendering-implementation-notes)

---

## 1. Core Principle

**The user's actual logo is the star.** Every creative treatment takes the user's uploaded
logo and applies the same technique shown in the reference image — just with their brand
instead of the example brand.

- The user uploads their logo → the template applies its specific creative technique to it.
- We are NOT replacing the logo with generic shapes. The logo IS the design element.
- Fallbacks only activate when there's a mismatch between what a treatment needs and what
  the user provided (edge cases, ~10% of logos).

---

## 2. Logo Composition Types

Every uploaded logo falls into one of five categories:

### 2.1 Separable (Icon + Wordmark)
- **Examples:** Spotify, Adidas, Pepsi, Slack
- **Characteristics:** Distinct icon/symbol and text that can be used independently
- **System Behavior:** Can use icon alone OR wordmark alone OR full lockup
- **Upload:** User provides full lockup; optionally provides icon-only version separately

### 2.2 Wordmark-Only
- **Examples:** Google, Coca-Cola, FedEx, Canon, Supreme
- **Characteristics:** The entire logo IS styled text. No separable symbol.
- **System Behavior:** All treatments apply to the wordmark itself (rotation, scaling, opacity)
- **Upload:** Single file — the wordmark is the only asset

### 2.3 Lockup-Inseparable (Icon Fused to Wordmark)
- **Examples:** Amazon (arrow is part of text), FedEx (arrow in negative space), Chick-fil-A
- **Characteristics:** Icon/symbol is woven into the text — cropping would look broken
- **System Behavior:** Treat as a single atomic unit; never attempt to isolate the icon
- **Upload:** Single file — the full lockup is the only usable asset

### 2.4 Icon-Only
- **Examples:** Apple, Nike swoosh, Twitter bird, Target bullseye
- **Characteristics:** Pure symbol with no text
- **System Behavior:** Perfect for all icon-based treatments; for wordmark-needing placements,
  pair with the company name set in the template's font
- **Upload:** Single file — the icon

### 2.5 Emblem / Badge
- **Examples:** Starbucks, Harley-Davidson, BMW, NFL teams
- **Characteristics:** Text enclosed inside a symbol — one atomic visual unit
- **System Behavior:** Similar to icon-only for scaling/watermark; never try to separate components
- **Upload:** Single file — the emblem

---

## 3. The 12 Logo Treatment Techniques

These are the distinct ways logos are used across the 30 reference images.

### T1: Standard Small Placement
- **What:** Logo at normal/small size in an expected position (top-left, centered above name, etc.)
- **Canvas:** Simple `drawImage()` with optional circle/rounded-rect clip
- **Works With All Logo Types:** ✅ Yes — just scale to fit the placement area
- **Reference Examples:** Templates #7, #8, #10, #16, #21, #22

### T2: Enlarged Watermark
- **What:** Logo blown up to 200-400% of the card width, dropped to 5-15% opacity, used as
  a background texture element. Often partially off-canvas (cropped by card edges).
- **Canvas:** `globalAlpha = 0.08–0.15`, `drawImage()` at massive scale, often with
  `globalCompositeOperation = 'multiply'` or `'overlay'`
- **Works With All Logo Types:** ✅ Yes
  - Icon/Emblem: Scale huge, center or offset
  - Wordmark: Scale huge, optionally rotate 15-30° for diagonal sweep
  - Lockup: Scale huge, low opacity — the full shape works as abstract texture
- **Reference Examples:** Templates #1 (back), #3 (back), #14 (back), #20 (back)

### T3: Monogram as Primary Graphic
- **What:** A single large letter or interlocking initials used as the dominant visual element,
  taking up 40-60% of the card face. This IS the design — not a subtle accent.
- **Canvas:** Large text rendering with specific serif/display font, or icon if the logo itself
  is a single letterform
- **Works With All Logo Types:**
  - Separable: Use the icon if it's a letterform; otherwise generate initials
  - Wordmark-only: Extract first letter, or generate initials from company name
  - Icon-only: Use the icon directly as the "monogram" shape
  - Emblem: Use the emblem directly
- **Reference Examples:** Templates #2, #3 (front)

### T4: Tonal Emboss
- **What:** Logo rendered as a subtle same-color-family silhouette — slightly lighter or darker
  than the background, creating an embossed/debossed effect. Barely visible, adds texture.
- **Canvas:** Draw logo in a color 5-10% lighter/darker than the background, or use
  `globalCompositeOperation` with `'overlay'` at very low alpha
- **Works With All Logo Types:** ✅ Yes — any shape works as a silhouette
  - Wordmarks create elegant horizontal emboss effects
  - Compact icons create centered medallion effects
- **Reference Examples:** Template #15

### T5: Cropped Bleed
- **What:** Logo positioned so it extends beyond the card edge — only a portion is visible.
  Creates a bold, confident "bigger than the canvas" effect.
- **Canvas:** Position the logo so 30-70% extends past card boundary; canvas naturally clips it
- **Works With All Logo Types:** ✅ Yes
  - Wordmark cropped so only 2-3 letters are visible = very sophisticated
  - Icon half-visible at edge = dynamic and bold
  - Emblem partially clipped at corner = heraldic feel
- **Reference Examples:** Templates #13 (back), #27 (back), #29

### T6: Pattern Derivation
- **What:** The logo shape (or a simplified version) is repeated/tiled to create an all-over
  pattern used as background texture. Similar to how luxury brands repeat their monograms.
- **Canvas:** Create an offscreen canvas with the logo, use `createPattern()` with
  `'repeat'`, apply at low opacity
- **Works With All Logo Types:** ✅ Yes
  - Icon: Tile the icon shape at regular intervals
  - Wordmark: Tile the wordmark, or extract a distinctive letter
  - Emblem: Tile the emblem at small scale
  - Best results with simpler shapes (complex logos may look cluttered)
- **Reference Examples:** Templates #14, #19, #28 (uses geometric pattern as identity)

### T7: Color Inversion
- **What:** The logo appears in one color mode on the front (e.g., dark on light) and the
  inverse on the back (light on dark). Not a separate technique per se — it's about the logo
  adapting its color treatment to the background it sits on.
- **Canvas:** Render logo with different fill colors per side, or use `'difference'` compositing
- **Works With All Logo Types:** ✅ Yes — any logo shape can change color
- **Reference Examples:** Templates #2, #12, #23

### T8: Primary Hero Graphic
- **What:** The logo IS the main visual element at full or near-full opacity, occupying a
  commanding position. Not a watermark — it's the star of the composition.
- **Canvas:** `drawImage()` at prominent scale (30-50% of card area), full opacity or near-full
- **Works With All Logo Types:** ✅ Yes
  - This is the most straightforward treatment — the logo is displayed prominently
  - Wordmarks may need scaling consideration for very wide logos
- **Reference Examples:** Templates #3, #11, #13 (front), #29

### T9: Icon-Wordmark Separation
- **What:** The icon portion and wordmark portion of the logo are used in DIFFERENT locations
  on the card — icon in one spot, company name text in another.
- **Canvas:** Two separate `drawImage()` calls with different positions/scales
- **Works With Logo Types:**
  - Separable: ✅ Perfect — use icon file for one spot, render company name for other
  - Wordmark-only: Render full wordmark in one spot; no icon to separate
  - Lockup: Cannot separate — use full lockup in primary position only
  - Icon-only: Use icon in one spot; render company name as text in other
  - Emblem: Use emblem in one spot; render company name as text in other
- **Reference Examples:** Templates #12, #17, #21, #22

### T10: Badge / Contained
- **What:** Logo placed inside a geometric container — circle, shield, rounded rectangle,
  hexagon, etc. The container becomes part of the visual identity.
- **Canvas:** Draw the container shape first, clip, then draw logo inside
- **Works With All Logo Types:** ✅ Yes
  - Icon-only: Looks clean inside a circle/shield
  - Wordmark: May need horizontal container (pill shape, rectangle)
  - Emblem: Already self-contained — add subtle outer ring or shadow only
- **Reference Examples:** Templates #11, #13

### T11: Atmospheric / Layered
- **What:** Logo integrated into a complex background composition — combined with gradients,
  shapes, overlays, or photographic elements. The logo is one layer in a multi-layer scene.
- **Canvas:** Multiple compositing operations, gradient overlays, the logo as one layer among
  several decorative elements
- **Works With All Logo Types:** ✅ Yes — the logo is just one layer in the composition
- **Reference Examples:** Templates #29, #30

### T12: No Logo Treatment
- **What:** The template doesn't use the logo as a creative design element. It relies entirely
  on typography, geometry, or abstract shapes for visual identity. The logo may appear in a
  standard small placement on the back, or not at all.
- **Canvas:** No special logo rendering needed; focus on typographic and geometric elements
- **When Logo Is Used:** May appear on the back side in a small standard placement (T1)
- **Reference Examples:** Templates #4, #6, #9, #28

---

## 4. Per-Template Logo Treatment Map

This maps each template to its EXACT logo treatment on both front and back sides,
based on analysis of the 30 reference images.

### Key
- **Technique** = which of the 12 treatments (T1-T12) from Section 3
- **Source** = which logo asset the treatment needs ('full' = full lockup, 'icon' = icon-only
  file, 'initials' = generated from company name, 'auto' = system decides based on logoType)

---

### Template #1 — ultra-minimal
- **Reference:** `6ed0ec5d` (MUN card)
- **FRONT:** T12 (No Logo Treatment)
  - No logo on front — only a thin accent line and brand initials in the template's font
  - Source: initials (from company name)
- **BACK:** T2 (Enlarged Watermark)
  - Logo at ~250% scale, 8-10% opacity, lower-left quadrant, partially off-canvas
  - Source: auto (full lockup or icon, whichever the user has)

### Template #2 — monogram-luxe
- **Reference:** `89fb07c3` (SH Samira Hadid card)
- **FRONT:** T3 (Monogram as Primary Graphic)
  - Massive Didone serif letter(s) at left side, ~48% of card width
  - Source: icon (if icon is a letterform) or initials (from company name)
- **BACK:** T3 (Monogram as Primary Graphic) + T7 (Color Inversion)
  - Same monogram, centered, with inverted color scheme
  - Source: same as front

### Template #3 — geometric-mark
- **Reference:** `71f407bd` (AV interlocking monogram card)
- **FRONT:** T8 (Primary Hero Graphic) + T3 (Monogram)
  - Large interlocking geometric letterforms as the dominant visual
  - Source: icon (if geometric/letterform) or initials rendered in geometric style
- **BACK:** T2 (Enlarged Watermark)
  - Logo enlarged as subtle background watermark, content overlaid
  - Source: auto

### Template #4 — frame-minimal
- **Reference:** `eadf9c42` (corner bracket card)
- **FRONT:** T12 (No Logo Treatment)
  - No logo — design relies on corner bracket frames and typography
- **BACK:** T1 (Standard Small Placement) — optional
  - Small logo placement if available, or no logo at all
  - Source: auto

### Template #5 — split-vertical
- **Reference:** `2098fa67` (Pathetic Studio card)
- **FRONT:** T1 (Standard Small Placement)
  - Small logo mark in the dark half of the vertical split
  - Source: icon preferred, full lockup acceptable
- **BACK:** T8 (Primary Hero Graphic)
  - Logo centered in a horizontal band/strip
  - Source: full lockup

### Template #6 — diagonal-mono
- **Reference:** `5ba8709c` (geometric diagonal card)
- **FRONT:** T12 (No Logo Treatment)
  - No logo on front — geometric diagonal composition only
- **BACK:** T1 (Standard Small Placement)
  - Small geometric mark in standard position
  - Source: icon preferred

### Template #7 — cyan-tech
- **Reference:** `0ee9d229` (Code Pro Dev card)
- **FRONT:** T1 (Standard Small Placement)
  - Icon placed above the person's name, standard centered position
  - Source: icon preferred, auto fallback
- **BACK:** T1 (Standard Small Placement)
  - Same or similar placement
  - Source: auto

### Template #8 — corporate-chevron
- **Reference:** `1cf439f4` (chevron card)
- **FRONT:** T1 (Standard Small Placement)
  - Tiny geometric logo used as an anchor point in the composition
  - Source: icon preferred (small scale)
- **BACK:** T1 (Standard Small Placement)
  - Small logo, standard position
  - Source: auto

### Template #9 — zigzag-overlay
- **Reference:** `dd0acc18` (lime/charcoal card)
- **FRONT:** T12 (No Logo Treatment)
  - No logo visible — the zigzag geometric pattern IS the visual identity
- **BACK:** T12 (No Logo Treatment)
  - Typography-driven, no logo element
  - Note: Logo could optionally appear as subtle watermark if user insists

### Template #10 — hex-split
- **Reference:** `af959c2c` (hexagonal blue card)
- **FRONT:** T1 (Standard Small Placement)
  - Logo centered above the name in standard position
  - Source: auto
- **BACK:** T1 (Standard Small Placement)
  - Standard placement
  - Source: auto

### Template #11 — dot-circle
- **Reference:** `be3ec37a` (minimalist circle card)
- **FRONT:** T10 (Badge/Contained) + T8 (Primary Hero Graphic)
  - Logo contained within the dotted circle, used as dual-scale element
  - Source: icon preferred (for clean containment inside circle)
- **BACK:** T1 (Standard Small Placement)
  - Smaller version of the contained badge
  - Source: auto

### Template #12 — wave-gradient
- **Reference:** `81f24f09` (purple-orange wave card)
- **FRONT:** T9 (Icon-Wordmark Separation) + T7 (Color Inversion)
  - Icon and company name used as separate elements, color adapts to gradient
  - Source: icon + text rendered separately
- **BACK:** T7 (Color Inversion)
  - Logo in inverted color treatment against different gradient
  - Source: auto

### Template #13 — circle-brand
- **Reference:** `582ae880` (Close Financial card)
- **FRONT:** T8 (Primary Hero Graphic) + T10 (Badge/Contained)
  - Logo prominently centered, contained in the circle motif
  - Source: full lockup or icon
- **BACK:** T5 (Cropped Bleed) + T2 (Enlarged Watermark)
  - Logo enlarged, partially bleeding off the card edge
  - Source: auto

### Template #14 — full-color-back
- **Reference:** `53142c0a` (Gordon Law card)
- **FRONT:** T1 (Standard Small Placement)
  - Small logo in clean position on white/light front
  - Source: auto
- **BACK:** T6 (Pattern Derivation) + T2 (Enlarged Watermark)
  - Logo used as geometric pattern element on the full-color back
  - Source: icon preferred for pattern, full for watermark

### Template #15 — engineering-pro
- **Reference:** `ce766a1f` (engineering card)
- **FRONT:** T4 (Tonal Emboss)
  - Logo as enlarged tonal emboss effect — barely visible, same-color-family silhouette
  - Source: auto (any shape works as silhouette)
- **BACK:** T1 (Standard Small Placement)
  - Standard small logo placement
  - Source: auto

### Template #16 — clean-accent
- **Reference:** `57b97d3a` (real estate orange card)
- **FRONT:** T1 (Standard Small Placement)
  - Small logo in standard position, clean and unobtrusive
  - Source: auto
- **BACK:** T1 (Standard Small Placement)
  - Standard placement
  - Source: auto

### Template #17 — nature-clean
- **Reference:** `c6ab56c6` (sage green bird card)
- **FRONT:** T9 (Icon-Wordmark Separation)
  - Icon and wordmark integrated into the layout as separate elements,
    icon may be part of a banner or decorative element
  - Source: icon + text separately
- **BACK:** T1 (Standard Small Placement)
  - Standard small placement
  - Source: auto

### Template #18 — diamond-brand
- **Reference:** `cc8c90b3` (forest green diamond card)
- **FRONT:** T8 (Primary Hero Graphic)
  - Logo as primary centered graphic element
  - Source: full lockup or icon
- **BACK:** T1 (Standard Small Placement)
  - Shrunk version in standard position
  - Source: auto

### Template #19 — flowing-lines
- **Reference:** `41e064a8` (Curve Studio card)
- **FRONT:** T8 (Primary Hero Graphic)
  - Text logo or full lockup used as a primary brand element
  - Source: full lockup preferred
- **BACK:** T6 (Pattern Derivation)
  - Logo or brand element repeated/flowed as a decorative pattern
  - Source: icon or simplified logo shape

### Template #20 — neon-watermark
- **Reference:** `d470b54b` (dark modern card)
- **FRONT:** T12 (No Logo Treatment) or T1 (Standard Small Placement)
  - Minimal or no logo on the dark, modern front
  - Source: auto
- **BACK:** T2 (Enlarged Watermark)
  - Logo enlarged as dramatic watermark behind content on dark background
  - Source: auto

### Template #21 — blueprint-tech
- **Reference:** `100fa47c` (crearquitectura card)
- **FRONT:** T9 (Icon-Wordmark Separation)
  - Icon and logotype used as separate standard elements
  - Source: icon + company name
- **BACK:** T12 (No Logo Treatment) or T1 (Standard Small Placement)
  - Clean back, optional small logo
  - Source: auto

### Template #22 — skyline-silhouette
- **Reference:** `f7aaa659` (real estate skyline card)
- **FRONT:** T9 (Icon-Wordmark Separation)
  - Small icon + wordmark used in dual-side layout
  - Source: icon preferred
- **BACK:** T1 (Standard Small Placement)
  - Small logo in standard position
  - Source: auto

### Template #23 — world-map
- **Reference:** `Digital Marketing.jpg`
- **FRONT:** T8 (Primary Hero Graphic) + T7 (Color Inversion)
  - Text logotype as primary element, adapts color to the world-map background
  - Source: full lockup
- **BACK:** T7 (Color Inversion)
  - Logo in alternate color mode
  - Source: auto

### Template #24 — diagonal-gold
- **Reference:** `cb46462d` (teal/gold diagonal card)
- **FRONT:** T12 (No Logo Treatment)
  - No logo on front — relies on the teal/gold diagonal composition
- **BACK:** T1 (Standard Small Placement)
  - Geometric mark in standard position on back
  - Source: icon preferred

### Template #25 — luxury-divider
- **Reference:** `d1758d1d` (gold/teal card)
- **FRONT:** T12 (No Logo Treatment)
  - No logo on front — elegant divider line and typography only
- **BACK:** T1 (Standard Small Placement)
  - Geometric mark, inverted color scheme
  - Source: icon preferred

### Template #26 — social-band
- **Reference:** `80987e38` (green/cream card)
- **FRONT:** T3 (Monogram) or T2 (Enlarged Watermark)
  - Script-style watermark monogram as background element
  - Source: icon or initials
- **BACK:** T1 (Standard Small Placement)
  - Standard small placement
  - Source: auto

### Template #27 — organic-pattern
- **Reference:** `ed5aed70` (forest green topographic card)
- **FRONT:** T1 (Standard Small Placement)
  - Standard logo placement on front with organic pattern background
  - Source: auto
- **BACK:** T5 (Cropped Bleed) + T2 (Enlarged Watermark)
  - Logo enlarged, bleeding off edge, integrated with organic pattern
  - Source: auto

### Template #28 — celtic-stripe
- **Reference:** `f8d2061b` (interlaced geometric card)
- **FRONT:** T12 (No Logo Treatment) + T6 (Pattern Derivation)
  - No explicit logo — the interlaced geometric pattern IS the identity element
  - The pattern itself may be derived from or inspired by the brand
- **BACK:** T12 (No Logo Treatment)
  - Typography-focused, no logo
  - Note: For users who want a logo, small standard placement can be added

### Template #29 — premium-crest
- **Reference:** `9eeddf73` (key/skyline card)
- **FRONT:** T8 (Primary Hero Graphic) + T11 (Atmospheric/Layered)
  - Logo used as a primary graphic composited with decorative elements (skyline, key, etc.)
  - Complex multi-layer composition
  - Source: full lockup or icon
- **BACK:** T1 (Standard Small Placement)
  - Standard small placement
  - Source: auto

### Template #30 — gold-construct
- **Reference:** `d528f0b6` (professional split card)
- **FRONT:** T12 (No Logo Treatment) or T1 (Standard Small Placement)
  - Clean professional front, minimal or no logo
  - Source: auto
- **BACK:** T11 (Atmospheric/Layered)
  - Logo integrated as atmospheric background element
  - Source: auto

---

## 5. Fallback Chains

When a technique requires an asset the user hasn't provided, the system uses these fallbacks.
**Remember: fallbacks are edge cases (~10% of logos). Most logos work directly.**

### Fallback Matrix: Technique × Logo Type

| Technique | Separable | Wordmark-Only | Lockup-Inseparable | Icon-Only | Emblem |
|---|---|---|---|---|---|
| **T1: Standard Small** | Use full lockup | Use wordmark | Use lockup | Use icon + render company name as text | Use emblem |
| **T2: Enlarged Watermark** | Use icon at 300%+, 8-12% opacity | Use wordmark at 300%+, rotate 15-30°, 8-12% opacity | Use lockup at 300%+, 8-12% opacity | Use icon at 300%+ | Use emblem at 300%+ |
| **T3: Monogram** | Use icon if letterform; else generate initials | Generate initials from company name | Generate initials from company name | Use icon directly as monogram shape | Use emblem (if compact enough); else initials |
| **T4: Tonal Emboss** | Use icon silhouette | Use wordmark silhouette (horizontal emboss) | Use lockup silhouette | Use icon silhouette | Use emblem silhouette |
| **T5: Cropped Bleed** | Use icon, position so 30-70% is off-canvas | Use wordmark, crop so 2-3 letters visible | Use lockup, crop at edge | Use icon, half-visible at edge | Use emblem, partially clipped at corner |
| **T6: Pattern Derivation** | Tile the icon shape | Tile the wordmark OR extract a distinctive letter | Tile the lockup at small scale | Tile the icon shape | Tile the emblem at small scale |
| **T7: Color Inversion** | Change fill colors per side | Change fill colors per side | Change fill colors per side | Change fill colors per side | Change fill colors per side |
| **T8: Primary Hero** | Use full lockup or icon prominently | Use wordmark at commanding scale | Use lockup at commanding scale | Use icon prominently | Use emblem prominently |
| **T9: Icon-Wordmark Sep.** | ✅ Use icon file + render name as text | Render full wordmark in one spot; render company name as text elsewhere | Use lockup in primary spot; render name as text elsewhere | Use icon + render name as text | Use emblem + render name as text |
| **T10: Badge/Contained** | Use icon inside container shape | Use wordmark in horizontal container (pill/rectangle) | Use lockup in container | Use icon inside container | Emblem is already contained — add outer ring/shadow only |
| **T11: Atmospheric** | Use icon as one layer in composition | Use wordmark as one layer | Use lockup as one layer | Use icon as one layer | Use emblem as one layer |
| **T12: No Logo** | N/A — no logo rendered | N/A | N/A | N/A | N/A |

### Fallback Priority Order

When `source: 'auto'` is set, the system resolves the logo asset in this order:

1. **Icon-only file** (if uploaded as secondary asset AND technique benefits from isolated icon)
2. **Primary logo file** (the main upload — works for all techniques)
3. **Generated initials** (from company name — only for T3 monogram when no suitable icon exists)

---

## 6. Architecture & Interfaces

### 6.1 Logo Configuration (User Input)

```typescript
interface LogoConfig {
  /** Full logo file — always required when user has a logo */
  primaryLogoUrl: string;

  /** Separate icon-only file — optional secondary upload */
  iconOnlyLogoUrl?: string;

  /**
   * Logo composition type — set by user or AI auto-detection
   * Determines which fallback chain to use when needed
   */
  logoType: 'separable' | 'wordmark-only' | 'lockup-inseparable' | 'icon-only' | 'emblem';

  /** Generated from company name — always available as fallback */
  companyInitials: string;

  /** Company name — for rendering text when icon-wordmark separation is needed */
  companyName: string;
}
```

### 6.2 Per-Side Logo Treatment (Template Definition)

```typescript
interface PerSideLogoTreatment {
  /** Which of the 12 techniques to apply */
  technique: LogoTechnique;

  /**
   * Which logo asset this treatment prefers
   * 'auto' = system picks best source based on logoType + technique (DEFAULT)
   * 'full' = always use the primary (full lockup) logo
   * 'icon' = prefer icon-only file; fallback to primary if not available
   * 'initials' = generate monogram from company name (ignores uploaded logo)
   */
  source: 'auto' | 'full' | 'icon' | 'initials';

  /** Position on the card face */
  placement: {
    anchor: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
           | 'center-left' | 'center-right' | 'top-center' | 'bottom-center';
    offsetX?: number; // percentage of card width (0-100)
    offsetY?: number; // percentage of card height (0-100)
  };

  /** Size relative to card dimensions */
  size: {
    mode: 'width-percent' | 'height-percent' | 'contain' | 'cover';
    value: number; // percentage (e.g., 300 for enlarged watermark)
  };

  /** Opacity: 1.0 = full, 0.08 = subtle watermark */
  opacity: number;

  /** Whether the logo extends beyond card edges */
  overflow: 'clip' | 'visible'; // 'visible' = bleeds off edge

  /** Rotation in degrees */
  rotation?: number;

  /** Canvas composite operation */
  blendMode?: GlobalCompositeOperation; // 'multiply', 'overlay', 'normal', etc.

  /** Color treatment for the logo on this side */
  colorMode: 'original' | 'monotone' | 'inverted' | 'tinted';

  /** Tint color (used when colorMode is 'monotone' or 'tinted') */
  tintColor?: string;

  /** Z-order relative to other card elements */
  zOrder: 'behind-all' | 'behind-text' | 'above-all';

  /** Container shape (for T10 Badge/Contained) */
  container?: {
    shape: 'circle' | 'rounded-rect' | 'hexagon' | 'shield' | 'pill' | 'none';
    padding: number; // percentage of container size
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
  };
}
```

### 6.3 Logo Technique Enum

```typescript
type LogoTechnique =
  | 'standard-small'          // T1
  | 'enlarged-watermark'      // T2
  | 'monogram-primary'        // T3
  | 'tonal-emboss'            // T4
  | 'cropped-bleed'           // T5
  | 'pattern-derivation'      // T6
  | 'color-inversion'         // T7
  | 'primary-hero'            // T8
  | 'icon-wordmark-separated' // T9
  | 'badge-contained'         // T10
  | 'atmospheric-layered'     // T11
  | 'no-logo';                // T12
```

### 6.4 Template Logo Config (Per Template)

```typescript
interface TemplatLogoConfig {
  front: PerSideLogoTreatment;
  back: PerSideLogoTreatment;
}
```

Each of the 30 templates defines its own `TemplatLogoConfig` with the exact treatment
parameters matching the reference image.

---

## 7. AI Auto-Detection

When a user uploads a logo, the AI design director can analyze it and suggest the logo type:

### Detection Heuristics

| Signal | Likely Type |
|---|---|
| Aspect ratio > 3:1 (very wide) | wordmark-only or lockup-inseparable |
| Aspect ratio ≈ 1:1 (square) | icon-only or emblem |
| Aspect ratio 1.5:1 to 3:1 | separable or lockup-inseparable |
| Text detected in image | wordmark-only, lockup-inseparable, or separable |
| Single solid shape, no text | icon-only |
| Circular/badge composition | emblem |
| Clear visual separation between symbol and text | separable |

### User Override

The AI suggests, the user confirms or corrects. The user can always:
- Change the detected logo type
- Upload a separate icon-only version
- Specify that their logo is inseparable when the AI thinks it's separable

---

## 8. Rendering Implementation Notes

### 8.1 Current Code (Needs Upgrading)

**`business-card-adapter.ts` — `buildLogoLayer()`**
- Currently: Only creates an ImageLayerV2 with `fit:'contain'` or text initials fallback
- Needs: Support for all 12 techniques — different layer configurations per technique

**`BusinessCardWorkspace.tsx` — `drawLogo()`**
- Currently: Only `ctx.drawImage()` with optional circle/square clip, or initials in circle
- Needs: 12 distinct rendering paths, compositing operations, patterns, emboss effects

### 8.2 Canvas2D Operations by Technique

| Technique | Key Canvas2D APIs |
|---|---|
| T1: Standard Small | `drawImage()`, optional `clip()` |
| T2: Enlarged Watermark | `globalAlpha`, `drawImage()` at large scale, optional `globalCompositeOperation` |
| T3: Monogram | `fillText()` with large font, or `drawImage()` if icon is letterform |
| T4: Tonal Emboss | `globalCompositeOperation = 'overlay'` or color-shifted `drawImage()` |
| T5: Cropped Bleed | `drawImage()` with position extending beyond canvas (natural clip) |
| T6: Pattern Derivation | `createPattern()` with offscreen canvas, `fillRect()` with pattern |
| T7: Color Inversion | `globalCompositeOperation = 'source-in'` after drawing color rect |
| T8: Primary Hero | `drawImage()` at large scale, full opacity |
| T9: Separation | Two separate `drawImage()`/`fillText()` calls at different positions |
| T10: Badge/Contained | `beginPath()` → shape → `clip()` → `drawImage()` |
| T11: Atmospheric | Multiple layers with different `globalAlpha` and `globalCompositeOperation` |
| T12: No Logo | No logo rendering calls |

### 8.3 Logo Tinting (for monotone/tinted colorMode)

To render a logo in a specific color (e.g., white logo on dark background):
1. Draw logo on offscreen canvas
2. Set `globalCompositeOperation = 'source-in'`
3. Fill with desired tint color
4. Draw the offscreen canvas onto the main canvas

### 8.4 Logo as Pattern

To create a tileable pattern from a logo:
1. Create small offscreen canvas (pattern tile size)
2. Draw logo centered in the tile, with padding
3. `const pattern = ctx.createPattern(offscreenCanvas, 'repeat')`
4. `ctx.fillStyle = pattern`
5. `ctx.globalAlpha = 0.05–0.15`
6. `ctx.fillRect(0, 0, cardWidth, cardHeight)`

---

## Appendix: Quick Reference — Template → Technique Lookup

| # | Template | Front Technique | Back Technique |
|---|---|---|---|
| 1 | ultra-minimal | T12 (No Logo) | T2 (Enlarged Watermark) |
| 2 | monogram-luxe | T3 (Monogram) | T3+T7 (Monogram + Inversion) |
| 3 | geometric-mark | T8+T3 (Hero + Monogram) | T2 (Enlarged Watermark) |
| 4 | frame-minimal | T12 (No Logo) | T1 (Standard Small) |
| 5 | split-vertical | T1 (Standard Small) | T8 (Primary Hero) |
| 6 | diagonal-mono | T12 (No Logo) | T1 (Standard Small) |
| 7 | cyan-tech | T1 (Standard Small) | T1 (Standard Small) |
| 8 | corporate-chevron | T1 (Standard Small) | T1 (Standard Small) |
| 9 | zigzag-overlay | T12 (No Logo) | T12 (No Logo) |
| 10 | hex-split | T1 (Standard Small) | T1 (Standard Small) |
| 11 | dot-circle | T10+T8 (Badge + Hero) | T1 (Standard Small) |
| 12 | wave-gradient | T9+T7 (Separation + Inversion) | T7 (Color Inversion) |
| 13 | circle-brand | T8+T10 (Hero + Badge) | T5+T2 (Bleed + Watermark) |
| 14 | full-color-back | T1 (Standard Small) | T6+T2 (Pattern + Watermark) |
| 15 | engineering-pro | T4 (Tonal Emboss) | T1 (Standard Small) |
| 16 | clean-accent | T1 (Standard Small) | T1 (Standard Small) |
| 17 | nature-clean | T9 (Separation) | T1 (Standard Small) |
| 18 | diamond-brand | T8 (Primary Hero) | T1 (Standard Small) |
| 19 | flowing-lines | T8 (Primary Hero) | T6 (Pattern Derivation) |
| 20 | neon-watermark | T12/T1 (No Logo/Small) | T2 (Enlarged Watermark) |
| 21 | blueprint-tech | T9 (Separation) | T12/T1 (No Logo/Small) |
| 22 | skyline-silhouette | T9 (Separation) | T1 (Standard Small) |
| 23 | world-map | T8+T7 (Hero + Inversion) | T7 (Color Inversion) |
| 24 | diagonal-gold | T12 (No Logo) | T1 (Standard Small) |
| 25 | luxury-divider | T12 (No Logo) | T1 (Standard Small) |
| 26 | social-band | T3/T2 (Monogram/Watermark) | T1 (Standard Small) |
| 27 | organic-pattern | T1 (Standard Small) | T5+T2 (Bleed + Watermark) |
| 28 | celtic-stripe | T12+T6 (No Logo + Pattern) | T12 (No Logo) |
| 29 | premium-crest | T8+T11 (Hero + Atmospheric) | T1 (Standard Small) |
| 30 | gold-construct | T12/T1 (No Logo/Small) | T11 (Atmospheric) |

---

*Last Updated: 2026-02-19*
*Status: Complete reference — ready for template specification and implementation*
