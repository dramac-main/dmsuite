# Logo Treatment Analysis — Templates #11–#20

> **Purpose:** Understand HOW logos are used as design elements — the creative treatment, not just placement.  
> **Scope:** 10 business card reference images analyzed for logo rendering engine architecture.

---

## Template #11 — `be3ec37adcb83cf6053dafb019cd363a.jpg` (dot-circle / ELD Creatives)

### Logo Treatment Type: `contained-badge-dual-scale`

### Detailed Analysis

1. **Logo visible?** Yes — "ELD CREATIVES" text inside a dark rectangular badge. Front: upper-right area (~75% from left, 20% from top). Back: large circle, left-center.
2. **Opacity?** FULL OPACITY (100%) on both sides. Solid dark background (#333333) with white text.
3. **Cropped?** No — fully contained within card boundaries on both sides. No bleed.
4. **Enlarged?** Front: moderate size (~20% card width, ~15% card height) — standard corporate placement. Back: SIGNIFICANTLY enlarged — circular version at ~35% of card width diameter. This is 2–3× the front logo size.
5. **Background element?** No — it's a contained badge element, not a watermark. Fully opaque, not transparent.
6. **Primary visual?** FRONT: No, the text content is primary. BACK: YES — the large circle logo IS the primary and essentially only visual element.
7. **Repeated?** No repetition or pattern.
8. **Tinted/colored differently?** Same dark (#333333) background with white text on both sides. Consistent treatment. The shape changes (rectangle → circle) but the color scheme is identical.
9. **Integrated with geometry?** The logo is CONTAINED within geometric shapes (rectangle on front, circle on back) — the shape IS part of the logo identity. On the back, the circle creates a strong geometric presence.
10. **Different front vs back?** YES, dramatically:
    - **Front:** Small rectangular badge, upper-right, ~6% of card area
    - **Back:** Large circle, left-center, ~25% of card area — ~4× larger
    - Shape morphs from rectangle to circle
11. **Surface coverage:** Front: ~6%. Back: ~25%. Combined average: ~15%.
12. **Edge interaction?** No — both versions maintain clear margins from all edges.

### Key Insight for Engine
The logo uses a **dual-scale identity system** — a compact badge for information-dense contexts and an enlarged geometric container (circle) for brand-statement contexts. The renderer needs to support shape-morphing containers (rect↔circle) with consistent internal content.

---

## Template #12 — `81f24f098f21c9e9dc954663ffab50f5.jpg` (wave-gradient / MTAC)

### Logo Treatment Type: `icon-wordmark-combo-with-gradient-back`

### Detailed Analysis

1. **Logo visible?** Yes — two-part logo: (a) a stylized arrow/chevron icon mark in orange+purple, (b) "MTAC" wordmark text. Front: icon at 12% left, 26% top; wordmark at 15% left, 25% top. Back: centered, enlarged white version.
2. **Opacity?** FULL OPACITY on both sides. Front: colored version (orange #FF8C42 + purple #2D1B69). Back: solid white (#FFFFFF).
3. **Cropped?** No — fully visible on both sides.
4. **Enlarged?** Front: standard corporate logo size (~8% card height for wordmark, ~3% card width for icon). Back: enlarged to ~12% card height for wordmark, ~4% icon — approximately 1.5× front size. Moderate enlargement, not dramatic.
5. **Background element?** No — the logo sits ON TOP of the gradient background. The gradient is the background element, not the logo.
6. **Primary visual?** FRONT: The bottom wave gradient element is the primary visual. Logo is secondary. BACK: The logo IS the primary visual — centered on the full-bleed gradient background, it's the only content element.
7. **Repeated?** No repetition.
8. **Tinted/colored differently?** YES — significant color shift:
    - **Front:** Multi-color (orange icon + purple wordmark) on white background
    - **Back:** Monochrome white on gradient background — complete color inversion
9. **Integrated with geometry?** The wave element on the front creates a visual bridge between the white card and the gradient, but the logo itself is NOT merged with it. On the back, the logo floats independently on the gradient.
10. **Different front vs back?** YES:
    - **Front:** Small, multi-color, upper-left, with bilingual text and contact info
    - **Back:** Centered, enlarged, white monochrome, minimal — pure brand statement
    - Color treatment completely inverts
11. **Surface coverage:** Front: ~5% (icon + wordmark combined). Back: ~8%. Both modest.
12. **Edge interaction?** No bleed — both versions are well within card boundaries.

### Key Insight for Engine
Logo color must be **context-adaptive** — switching from multi-color (on light) to monochrome white (on dark/gradient). The gradient background on the back is NOT part of the logo — it's a separate background treatment. Engine needs to support color-mode switching for logo rendering.

---

## Template #13 — `582ae880318d9bae33ad96ea6beea07f.jpg` (circle-brand / Close Financial)

### Logo Treatment Type: `icon-lockup-with-enlarged-back`

### Detailed Analysis

1. **Logo visible?** Yes — geometric icon (house/mountain shape inside a circle) + "CloseFinancial" wordmark. Front: icon at 15% left, 25% top; company name centered at 50%, 45%. Back: enlarged centered icon at 50%, 25%.
2. **Opacity?** FULL OPACITY on both sides. Front: solid blue (#4A6FA5) icon on light gray. Back: white icon on blue gradient background.
3. **Cropped?** No — fully visible on both sides.
4. **Enlarged?** Front: standard size (~12% card width for icon). Back: significantly enlarged (~20% card width) — approximately 1.7× the front size.
5. **Background element?** No — solid, full-opacity element on both sides.
6. **Primary visual?** FRONT: No — the company name text is visually dominant. BACK: YES — the enlarged icon is the primary visual element, centered with brand name below.
7. **Repeated?** No.
8. **Tinted/colored differently?** YES — color inversion:
    - **Front:** Blue icon (#4A6FA5) on light gray background
    - **Back:** White icon (#FFFFFF) on blue gradient background — inverse of front
9. **Integrated with geometry?** The icon is self-contained within its circle. It doesn't merge with external geometry. The circular shape IS the logo container.
10. **Different front vs back?** YES:
    - **Front:** Small icon (12% width), blue on light, positioned upper-left with separate company name text
    - **Back:** Enlarged icon (20% width), white on blue gradient, centered as hero element
    - Color fully inverts; size increases ~70%
11. **Surface coverage:** Front: ~3% (icon only). Back: ~10% (enlarged icon). Company name text adds visual weight but is text, not logo graphic.
12. **Edge interaction?** No bleed — clean margins maintained.

### Key Insight for Engine
Classic **icon + wordmark lockup** system where the icon and text name can appear together or separately. The back uses icon-only at enlarged scale. Engine needs to support logo components (icon, wordmark) independently and as a lockup, with color inversion capability.

---

## Template #14 — `53142c0af99e85dd58a973f2f4707ca7.jpg` (full-color-back / Gordon Law)

### Logo Treatment Type: `geometric-icon-watermark-pattern`

### Detailed Analysis

1. **Logo visible?** Yes — geometric diamond/interlocking squares icon + "GORDON LAW" text. Front: upper-right at 75% left, 15% top, large (~25% card width, ~35% card height). Back: centered at 50% left, 30% top.
2. **Opacity?** Front: FULL OPACITY, solid dark blue. Back: the centered logo is full opacity white, BUT there are also **subtle background diamond shapes scattered at ~5% opacity** creating a watermark pattern.
3. **Cropped?** No — main logos are fully visible. However, the background pattern diamonds may partially extend beyond visible area.
4. **Enlarged?** Front: LARGE — the logo occupies ~25% × 35% of the card. This is unusually large for a front side, making it a significant visual element, not just a corner stamp. Back: centered at ~20% × 25%.
5. **Background element?** PARTIALLY YES — the back side has scattered diamond shapes at ~5% opacity functioning as a subtle geometric watermark/texture. These are derived from the logo's diamond motif. The main logo itself is NOT a background element.
6. **Primary visual?** FRONT: The logo is a CO-PRIMARY element — it's large enough to compete with the text content for visual attention. BACK: The centered white logo IS the primary visual. The watermark diamonds are secondary atmospheric elements.
7. **Repeated?** YES — on the back, the diamond motif is **repeated at various sizes** scattered across the background as a pattern. This is a direct derivation of the main logo geometry.
8. **Tinted/colored differently?** YES:
    - **Front:** Dark blue (#2B5B84) on white
    - **Back main logo:** White on blue gradient
    - **Back watermark diamonds:** White at 5% opacity — extremely subtle
9. **Integrated with geometry?** YES — the logo IS geometry (interlocking diamond pattern). On the back, the logo's geometric DNA is extracted and used as ambient background texture. The diamond motif becomes both logo AND environmental design element.
10. **Different front vs back?** YES, significantly:
    - **Front:** Large dark blue logo on white, positioned upper-right, includes text below icon
    - **Back:** White logo on blue gradient, centered, PLUS scattered diamond shapes as watermark pattern
    - The back EXPANDS the logo's geometric vocabulary into environmental design
11. **Surface coverage:** Front: ~12% (icon + text combined). Back: main logo ~8%, scattered diamonds cover ~30-40% of background at very low opacity. Total visual impact: ~40%.
12. **Edge interaction?** The scattered background diamonds may partially bleed off edges. Main logos stay within margins.

### Key Insight for Engine
This is the most complex logo treatment so far. The engine needs to support: (a) standard logo rendering, (b) **logo-derived pattern generation** — extracting a geometric motif from the logo and scattering it at low opacity as background texture. This is a KEY capability: logo → pattern derivation.

---

## Template #15 — `ce766a1fcd777090860a8a8413b2d2f3.jpg` (engineering-pro / Holdfast Engineering)

### Logo Treatment Type: `tonal-emboss-back-enlarged`

### Detailed Analysis

1. **Logo visible?** Yes — abstract angular geometric icon + "HOLDFAST ENGINEERING" wordmark. Front: icon at 12% left, 15% top, small. Back: enlarged icon + wordmark, centered.
2. **Opacity?** Front: FULL OPACITY — icon in light blue (#5DADE2), wordmark in dark blue-gray + light blue. Back: rendered in TONAL variation — icon in medium blue (#2980B9, ~80% of background brightness) on blue background (#3498DB). This creates a subtle embossed/debossed appearance — visible but not high-contrast.
3. **Cropped?** No — fully visible on both sides.
4. **Enlarged?** Front: small icon (~8% card width, ~12% height) — standard placement. Back: SIGNIFICANTLY enlarged — icon at ~15% width, ~20% height, plus enlarged wordmark at ~12% card height. Approximately 2× front scale.
5. **Background element?** BACK: PARTIALLY — the tonal treatment (similar-but-slightly-different blue on blue background) creates a subtle, almost-watermark effect. It's not true transparency, but rather a **tonal/emboss approach** where the logo is rendered in a slightly different shade of the same color as the background.
6. **Primary visual?** Front: No — text hierarchy dominates. Back: YES — the enlarged tonal logo is the ONLY element.
7. **Repeated?** No.
8. **Tinted/colored differently?** YES — dramatically:
    - **Front:** Light blue icon (#5DADE2) on off-white background — high contrast
    - **Back:** Medium blue icon (#2980B9) on blue background (#3498DB) — LOW contrast, tonal
    - The wordmark shifts from two-tone (dark/light) to two-tone (dark blue/medium blue)
9. **Integrated with geometry?** The angular logo inherently suggests precision/engineering. It doesn't merge with external elements.
10. **Different front vs back?** YES:
    - **Front:** Small, high-contrast, light blue on off-white, upper-left
    - **Back:** Large, LOW-contrast, tonal blue-on-blue, centered — "embossed" feel
    - Completely different visual weight and contrast approach
11. **Surface coverage:** Front: ~3%. Back: ~15% (icon + enlarged wordmark). The tonal treatment means the back logo coverage FEELS lower than it actually is due to low contrast.
12. **Edge interaction?** No bleed.

### Key Insight for Engine
The **tonal/emboss treatment** is a distinct rendering mode: logo rendered in a color only slightly different from the background, creating subtle depth without strong contrast. This is NOT the same as opacity reduction — it's COLOR SIMILARITY with full opacity. Engine needs: `{ mode: 'tonal', contrastRatio: 0.15 }` or similar to achieve this debossed look.

---

## Template #16 — `57b97d3a5ac18ce74b1b324fbf05803c.jpg` (clean-accent / Real Estate Orange)

### Logo Treatment Type: `standard-small-with-thematic-illustration`

### Detailed Analysis

1. **Logo visible?** Yes — geometric house/roof icon with lines. Positioned at 5% from left, 25% from top. Small.
2. **Opacity?** FULL OPACITY. Solid orange-red (#E85A2B).
3. **Cropped?** No — fully visible.
4. **Enlarged?** No — standard small icon size (~8% card width, ~12% card height). This is a standard "logo in corner" treatment.
5. **Background element?** No — the logo is a standard placement element. HOWEVER, the city skyline graphic (bottom 35% of card, ~60% opacity, gray gradient) functions as a thematic illustration that is conceptually related to the logo/brand (real estate → buildings) but is NOT the logo itself.
6. **Primary visual?** No — the city skyline illustration is the primary visual element. The logo is secondary. The skyline occupies ~35% of the card vs logo's ~3%.
7. **Repeated?** No.
8. **Tinted/colored differently?** No — the logo maintains its brand orange color consistently.
9. **Integrated with geometry?** No — the logo is standalone. The skyline is a separate decorative element.
10. **Different front vs back?** Only front side visible in this image. Cannot assess back.
11. **Surface coverage:** Logo: ~3%. The skyline graphic (NOT the logo) covers ~35% at reduced opacity.
12. **Edge interaction?** Logo: No bleed. The skyline graphic DOES bleed to the bottom edge.

### Key Insight for Engine
This is a **standard-placement logo** — the simplest treatment. The interesting design element is the thematic illustration (skyline), but that's NOT a logo treatment — it's supplementary graphics. This template shows the minimum logo complexity the engine must support. Also notable: the QR code and skyline have more visual prominence than the logo itself.

---

## Template #17 — `c6ab56c63a6ce1de681aae5201b028cb.jpg` (nature-clean / BlueBat sage green)

### Logo Treatment Type: `icon-wordmark-banner-integration`

### Detailed Analysis

1. **Logo visible?** Yes — abstract geometric bird/wing shape icon + "BLUEBAT" wordmark text. Front: icon at 67% left, 75% top (~8% width); wordmark nearby. Back: enlarged icon at 45% left, 40% top (~12% width) + enlarged wordmark.
2. **Opacity?** FULL OPACITY on both sides. Front: sage green (#6B8E7A) icon on light gray. Back: white (#FFFFFF) icon on sage green background.
3. **Cropped?** No — fully visible on both sides.
4. **Enlarged?** Front: small to moderate icon (8% width, 12% height). Back: enlarged to 12% width, 18% height — approximately 1.5× scale increase.
5. **Background element?** No — solid, full-opacity on both sides.
6. **Primary visual?** Front: The diagonal sage-green name banner is the primary visual element; the logo is positioned WITHIN the banner area as a secondary brand mark. Back: The logo IS the primary visual — centered, enlarged, with tagline.
7. **Repeated?** No.
8. **Tinted/colored differently?** YES — color inversion:
    - **Front:** Sage green on light gray
    - **Back:** White on sage green — simple dark/light swap
9. **Integrated with geometry?** YES, partially — on the front, the logo icon sits adjacent to the diagonal name banner strip. The banner's angled edge creates a geometric context for the logo. The logo doesn't MERGE with the banner but is compositionally tied to it.
10. **Different front vs back?** YES:
    - **Front:** Small, sage green, positioned within banner zone, secondary element
    - **Back:** Enlarged, white, centered as hero, primary element
    - Clean color swap
11. **Surface coverage:** Front: ~3% (icon only). Back: ~8% (enlarged icon + wordmark).
12. **Edge interaction?** The front name banner extends to the left card edge (0% margin), but the logo itself does NOT bleed. Clean containment.

### Key Insight for Engine
The logo's front treatment is notable for its **integration with a geometric banner** — the logo is compositionally anchored to a colored diagonal stripe. The engine needs to understand logo-to-shape proximity relationships where the logo is placed in visual relationship with (but not merged into) a geometric element.

---

## Template #18 — `cc8c90b37ef37d0a0b695b1d2a3cb7f0.jpg` (diamond-brand / Forest Green)

### Logo Treatment Type: `geometric-primary-front-split-back`

### Detailed Analysis

1. **Logo visible?** Yes — a simple geometric triangle (upward-pointing) + "COMPANY" wordmark. Front: triangle at 50% left, 35% top; wordmark at 50%, 50%. Back: smaller triangle at 20% left, 75% top (within the green section of a split layout).
2. **Opacity?** FULL OPACITY on both sides. Front: white triangle on forest green. Back: white triangle on forest green (left section).
3. **Cropped?** No — fully visible on both sides.
4. **Enlarged?** Front: moderate size (~8% card width for triangle). This is notable because the triangle is the CENTERPIECE of the front — centered, with all other elements organized around it. Back: SMALLER (~4% card width) — the logo shrinks on the back, opposite of most templates.
5. **Background element?** No — full opacity, prominent placement.
6. **Primary visual?** FRONT: YES — the centered triangle IS the primary visual. The entire front composition radiates from it: logo → company name → tagline → dark footer band. It's the focal point. BACK: No — the name and contact info on the white side are primary. The small triangle in the green zone is tertiary.
7. **Repeated?** No direct repetition, but the bottom section uses a circular icon element that echoes the geometric simplicity.
8. **Tinted/colored differently?** No — consistently white on green across both sides.
9. **Integrated with geometry?** On the front, the logo sits above the dark footer band, and the small circular element at the band transition creates visual continuity. On the back, the split layout (60% green / 40% white) provides a color-block context for the logo.
10. **Different front vs back?** YES — INVERTED importance:
    - **Front:** Logo is LARGE, CENTERED, PRIMARY — the hero element
    - **Back:** Logo is SMALL, off-center in left panel, TERTIARY
    - This is unusual — most templates enlarge the logo on the back. This one does the opposite.
11. **Surface coverage:** Front: ~3% (small triangle, but it's the focal point due to centering). Back: ~1%.
12. **Edge interaction?** No bleed.

### Key Insight for Engine
This demonstrates **compositional primacy without size dominance** — a small geometric logo becomes the primary visual purely through CENTERING and spatial hierarchy (everything else orbits it). The logo's small pixel footprint (~3%) belies its visual importance. The engine needs to understand that logo prominence ≠ logo size. Also unique: the logo SHRINKS on the back instead of enlarging.

---

## Template #19 — `41e064a8234880e65ba26f63b0be5b13.jpg` (flowing-lines / Curve Studio)

### Logo Treatment Type: `text-logo-with-decorative-pattern`

### Detailed Analysis

1. **Logo visible?** Yes — "Curve STUDIO" is a TEXT-ONLY logo (no icon/symbol). Front: positioned at 65% left, 25% top on dark green background. Back: there is NO separate logo on the back — the decorative flowing lines serve as brand identity.
2. **Opacity?** FULL OPACITY — white text on dark green.
3. **Cropped?** No — fully visible.
4. **Enlarged?** Standard text logo size (~8% of card height). Not enlarged beyond normal header proportions.
5. **Background element?** The logo text itself: No. HOWEVER, the flowing curved line pattern (8–10 parallel green lines in S-curve pattern) covers ~55% × 80% of the front card and ~35% × 70% of the back card. These flowing lines are NOT the logo, but they ARE the brand's primary visual identity. They function as a brand pattern/motif.
6. **Primary visual?** The FLOWING LINE PATTERN is the primary visual on BOTH sides. The text logo is secondary to this pattern. The lines create dynamic movement that dominates the visual experience.
7. **Repeated?** The flowing lines themselves are a PARALLEL REPETITION — 8-10 lines repeating the same curve at regular intervals, creating a rhythmic pattern. But the logo text is not repeated.
8. **Tinted/colored differently?** Text logo: no (white on both appearances). Flowing lines: consistent bright green (#00B050) on both sides.
9. **Integrated with geometry?** The text logo is compositionally ADJACENT to the flowing lines but not merged. The lines occupy the left 60% of the front and right 40% of the back, creating a visual frame around the text content.
10. **Different front vs back?** YES:
    - **Front:** Text logo on right side, flowing lines on left side (dark green card)
    - **Back:** Person's name/info on left side, flowing lines MIRRORED on right side (light card)
    - The flowing lines switch sides, creating visual continuity across the card
    - The text logo only appears on the front
11. **Surface coverage:** Text logo: ~4%. Flowing line pattern: ~40% of front, ~30% of back. The brand PATTERN has far more coverage than the brand TEXT.
12. **Edge interaction?** The flowing lines originate from and bleed off the card edges — they start at the card boundary and flow inward, then some curves flow back out to the edge. This is a deliberate bleed treatment for the pattern (not the logo text).

### Key Insight for Engine
This is a **text-only logo with brand pattern as primary identity**. The actual "logo" is simple text, but the brand's visual identity is carried by the decorative flowing line pattern. The engine needs to distinguish between: (a) a text logo (simple to render), and (b) a brand pattern/motif that ISN'T the logo but IS the visual identity. The mirroring of the pattern across front/back is also notable — pattern placement flips while maintaining visual continuity.

---

## Template #20 — `d470b54b4667bbb67204e858d6f0a01f.jpg` (neon-watermark / Dark Modern)

### Logo Treatment Type: `placeholder-hexagon-with-geometric-overlay`

### Detailed Analysis

1. **Logo visible?** Yes — a hexagonal OUTLINE shape (logo placeholder) + "COMPANY LOGO" text. Front: NOT visible (front focuses on name, contact, QR code, diagonal geometric elements). Back: centered hexagon at 50% left, 35% top, with text below.
2. **Opacity?** Back logo: FULL OPACITY — white hexagonal outline on dark teal. The geometric overlay elements on both sides are at 60-70% opacity, but these are NOT the logo.
3. **Cropped?** No — fully visible.
4. **Enlarged?** The hexagonal placeholder is moderate size (~12% of card height). Not dramatically enlarged.
5. **Background element?** The geometric angular shapes on both sides (at 60% opacity, darker teal #1A4A63) function as background/atmospheric elements. These are NOT the logo but create a layered geometric environment. The actual logo is NOT used as a background element.
6. **Primary visual?** FRONT: The diagonal geometric cut (dark teal slice across upper-right) is the primary visual. No logo present on front. BACK: The hexagonal logo placeholder IS the primary visual, centered.
7. **Repeated?** No.
8. **Tinted/colored differently?** N/A for this template — the logo only appears once (back side).
9. **Integrated with geometry?** The hexagonal outline shares the geometric LANGUAGE of the angular overlay shapes — they're all angular/geometric. But the logo doesn't MERGE with the overlays. There's a visual family resemblance (geometric vocabulary) without literal integration.
10. **Different front vs back?** YES — dramatically:
    - **Front:** NO LOGO AT ALL — name and contact info with geometric diagonal design
    - **Back:** Logo is centered, hexagonal outline + company text, clean and prominent
    - One of the few templates where the logo is COMPLETELY ABSENT from the front
11. **Surface coverage:** Front: 0% (no logo). Back: ~5% (hexagonal outline + text).
12. **Edge interaction?** The diagonal geometric cut on the front bleeds off the top and right edges, but this is NOT the logo. The actual logo has no edge interaction.

### Key Insight for Engine
This template demonstrates the **back-only logo** pattern — the front is pure information design with geometric atmosphere, and the logo is reserved entirely for the back as a clean brand statement. The geometric overlay shapes on both sides create visual identity through angular vocabulary WITHOUT using the actual logo. Engine implication: templates can legitimately have NO logo on one side, and the engine should NOT force logo placement on both sides.

---

## Summary: Logo Treatment Types Catalog

| # | Template | Treatment Type | Front Logo | Back Logo | Key Technique |
|---|----------|---------------|------------|-----------|---------------|
| 11 | dot-circle | `contained-badge-dual-scale` | Rect badge, small, 6% | Circle badge, large, 25% | Shape morphing (rect→circle), 4× scale jump |
| 12 | wave-gradient | `icon-wordmark-color-inversion` | Multi-color, upper-left, 5% | White monochrome, centered, 8% | Color mode switching (multi→mono) |
| 13 | circle-brand | `icon-lockup-enlarged-back` | Blue icon, upper-left, 3% | White icon on gradient, centered, 10% | Icon/wordmark separation, color inversion |
| 14 | full-color-back | `geometric-icon-watermark-pattern` | Large dark blue, upper-right, 12% | White centered + scattered diamonds at 5% opacity | **Logo→pattern derivation** |
| 15 | engineering-pro | `tonal-emboss-enlarged` | Small, high-contrast, 3% | Large, blue-on-blue tonal, 15% | **Tonal/emboss effect** (low-contrast same-hue) |
| 16 | clean-accent | `standard-small-placement` | Small icon, upper-left, 3% | N/A (only front shown) | Minimal treatment, thematic illustration separate |
| 17 | nature-clean | `icon-wordmark-banner-integration` | Small, in banner zone, 3% | Enlarged, centered, white, 8% | Logo→banner compositional anchoring |
| 18 | diamond-brand | `centered-primary-shrink-back` | Small but CENTERED as hero, 3% | Even smaller, in split panel, 1% | Compositional primacy without size; **logo shrinks on back** |
| 19 | flowing-lines | `text-logo-brand-pattern` | Text-only logo, 4% | No logo on back | Brand identity carried by pattern, not logo |
| 20 | neon-watermark | `back-only-placement` | NO LOGO on front | Hexagonal outline, centered, 5% | **Front has no logo at all** |

---

## Critical Findings for Logo Rendering Engine

### 1. Logo Treatment Modes (must support all)
```
standard-placement    → Small, full opacity, corner/header position
enlarged-back         → Logo scales up 1.5–4× on back side  
tonal-emboss          → Same-hue low-contrast rendering (NOT opacity)
pattern-derivation    → Extract logo geometry → scatter as background pattern
color-inversion       → Multi-color → monochrome, or dark → light swap
contained-badge       → Logo inside shape container (rect, circle, etc.)
centered-primary      → Small logo made primary via centering/hierarchy
text-only             → No icon, text IS the logo
back-only             → Logo intentionally absent from front
```

### 2. Key Architecture Implications

| Capability | Why Needed | Templates Using It |
|-----------|-----------|-------------------|
| Independent icon + wordmark rendering | Some templates show icon alone, text alone, or both | #12, #13, #17 |
| Color mode switching | Logo must render in original colors OR monochrome white OR tonal | #12, #13, #14, #15 |
| Shape container morphing | Logo inside rectangle vs circle vs hexagon | #11, #20 |
| Scale independence | Same logo from 1% to 25% of card area | #11, #14, #18 |
| Tonal/emboss rendering | Render in slightly-different shade of background color | #15 |
| Pattern derivation from logo | Extract geometric motif → scatter as low-opacity background | #14 |
| Per-side configuration | Front and back can have completely different logo treatments | ALL except #16 |
| Optional logo placement | Some sides legitimately have NO logo | #19 (back), #20 (front) |
| Logo-to-geometry proximity | Logo positioned relative to banner/stripe/shape elements | #17 |

### 3. Logo Scale Distribution
- **< 3% of card surface:** Templates #13, #15, #16, #17, #18 (front sides) — minimum viable
- **3–8%:** Templates #11 (front), #12, #19, #20 — moderate 
- **8–15%:** Templates #14, #15 (back), #13 (back) — large
- **15–25%:** Template #11 (back) — hero-scale
- **30%+ (as pattern):** Template #14 (back, scattered diamonds) — environmental

### 4. Front-vs-Back Logo Behavior Patterns
- **Enlarge on back** (most common): #11, #12, #13, #14, #15, #17
- **Shrink on back** (unusual): #18
- **Logo on front only:** #19
- **Logo on back only:** #20
- **Same treatment both sides:** None — every template treats front/back differently
