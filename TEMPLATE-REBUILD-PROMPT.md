# Business Card Template System — Complete Rebuild Directive

## Purpose of This Document

This document is a comprehensive, word-only instruction set for an AI developer to completely audit and fix the business card template rendering system in DMSuite. Every problem has been diagnosed, every file is mapped, every rule is specified. Your job is to follow this document precisely, fix every issue described, and produce a system where all 30 templates render perfectly with zero overlaps, proper logo handling, correct font usage, and professional-quality output.

Read this entire document before writing a single line of code. Understand the full scope, then work template by template.

---

## Table of Contents

1. Project Context and File Map
2. How the Template System Works (Architecture)
3. Critical Systemic Problems (Fix These First)
4. Logo and Company Name Rules (The Professional Standard)
5. Typography and Font System Rules
6. Contact Layout Rules
7. Overlap Prevention Rules
8. Decorative Element Quality Standards
9. Color Theme System Rules
10. Back Side Layout Rules
11. Template-by-Template Audit and Fix Instructions
12. Testing and Verification Checklist
13. API Reference (Available Functions and Their Correct Usage)

---

## 1. Project Context and File Map

### Technology
- Next.js with TypeScript in strict mode (zero errors required at all times)
- Canvas2D rendering via a DesignDocumentV2 scene graph (layers, not direct drawing)
- Standard business card dimensions: 1050 pixels wide by 600 pixels tall (3.5 by 2 inches at 300 DPI)

### Files You Will Modify

**Primary file — Template layouts:**
`src/lib/editor/business-card-adapter.ts` (approximately 6400 lines)
This file contains all 30 front layout functions, back layout registrations, the layout dispatch map, and the main conversion function. Every template layout lives here.

**Secondary file — Helper functions and color themes:**
`src/lib/editor/card-template-helpers.ts` (approximately 1582 lines)
This file contains the shape builder functions (filledRect, styledText, pathLayer, etc.), the TEMPLATE_FIXED_THEMES color registry, the contactWithIcons function, the buildWatermarkLogo function, font stacks, and gradient helpers.

**Reference file — Do not modify:**
`src/lib/editor/schema.ts` (1085 lines)
Contains the DesignDocumentV2 type definitions, layer types, paint types, and creation functions. Read this to understand the data model but do not change it.

### Files You Must Read First

Before making any changes, read these files to understand the system:

1. `TEMPLATE-SPECIFICATIONS.md` — Contains the exact reference specifications for all 30 templates, including pixel coordinates, colors, typography, and Canvas2D render recipes. This is your ground truth for what each template should look like.

2. `LOGO-TREATMENT-SYSTEM.md` — Contains the 12 logo techniques and how logos should be handled per template.

3. `src/lib/editor/card-template-helpers.ts` — Understand every exported function before using them in templates.

4. `src/lib/editor/business-card-adapter.ts` — Understand the current code before fixing it.

### Build Verification Command
After every batch of changes, run: `npx tsc --noEmit`
This must produce zero errors. If it fails, fix the errors before proceeding.

---

## 2. How the Template System Works (Architecture)

### The Rendering Pipeline

When a user selects a template, this is what happens:

1. The user's settings (name, company, contact info, colors, font, template ID, logo URL) are stored in a CardConfig object.

2. The `cardConfigToDocument` function in the adapter file receives this CardConfig.

3. It looks up the template ID in LAYOUT_MAP to find the correct front layout function (for example, "cyan-tech" maps to `layoutCyanTech`).

4. The layout function receives the card width (W), height (H), CardConfig, font sizes object, and font family string. It returns an array of LayerV2 objects representing everything visible on the card.

5. For the back side, the system first checks for a template-specific back layout registered via `registerBackLayout`. If found, it uses that. Otherwise, it falls back to one of five generic back layout functions.

6. The layer array is added to a DesignDocumentV2, which the renderer paints to a Canvas2D context.

### The Two Layout Systems

There are TWO different layout systems coexisting. This is important to understand:

**System A — The 30 pixel-perfect template layout functions** (in the adapter file)
These are individual functions like `layoutCyanTech`, `layoutDiagonalMono`, etc. Each one creates layers with hardcoded positions. They use the helper functions from card-template-helpers.ts (styledText, filledRect, pathLayer, contactWithIcons, buildWatermarkLogo, etc.) and reference TEMPLATE_FIXED_THEMES for their color values.

**System B — The recipe-based generator** (in template-generator.ts)
This is a separate parametric system that generates cards from recipe/theme/accent combinations. It has its own overlap prevention and is NOT what you are fixing. Leave it alone.

You are fixing System A only — the 30 pixel-perfect templates.

### The Color Theme System

Each template has a fixed color theme in the TEMPLATE_FIXED_THEMES registry (in card-template-helpers.ts). The theme object has these fields:

- frontBg: Background color for the front side
- frontBgAlt: Optional secondary background color (for split layouts)
- frontText: Primary text color on the front
- frontTextAlt: Secondary/lighter text color on the front
- accent: Primary accent color
- accentAlt: Optional secondary accent color
- backBg: Background color for the back side
- backText: Primary text color on the back
- backAccent: Optional accent color on the back
- divider: Color for divider lines
- contactText: Color for contact information text
- contactIcon: Color for contact icons

Templates should read their colors from the theme, not from cfg.primaryColor or cfg.textColor (those are the user's custom colors, which are only relevant when the user explicitly changes colors).

---

## 3. Critical Systemic Problems (Fix These First)

These are cross-cutting issues that affect ALL templates. Fix these before doing template-by-template work.

### Problem 1: Font Family Is Completely Ignored

**What is broken:** Every single layout function accepts a font family parameter (called ff or _ff) but ignores it. Instead, every template hardcodes `FONT_STACKS.geometric` (which resolves to Inter). This means the font style dropdown in the workspace UI does absolutely nothing — every card renders in Inter regardless of what the user selects.

**What the user sees:** They select "Elegant" (expects Playfair Display serif) but get Inter sans-serif. They select "Bold" (expects Montserrat) but get Inter. The UI control is completely non-functional.

**How to fix:** Every layout function must use the `ff` parameter that is passed to it, not a hardcoded font stack. The `ff` parameter already contains the correct font family string resolved from the user's selection via `getFontFamily(cfg.fontStyle)`. Simply use `ff` everywhere instead of `FONT_STACKS.geometric`.

There is one nuance: some templates have design-specific font requirements (for example, a blueprint template might need a monospace font for certain labels). In those cases, you may hardcode a specific font for that one element only, but the primary name, company, title, and contact text must respect the user's font choice via the `ff` parameter.

**Exception for the registered back layouts:** The back layout functions receive a `cfg` parameter (of type TemplateBackLayoutCfg) that includes `cfg.fontFamily`. Use `cfg.fontFamily` for all text in back layouts.

### Problem 2: Logo and Company Name Duplication

**What is broken:** When a user does NOT upload a logo, the `buildWatermarkLogo` function renders the company's initials (like "DM" for "Dramac Marketing") as a fallback. But every template that calls buildWatermarkLogo ALSO adds a separate text layer showing the full company name right next to it. So the user sees "DM" initials AND "DRAMAC MARKETING AGENCY" side by side — which is redundant and unprofessional.

When a user DOES upload a logo, the logo image appears alongside the company name text. This is also wrong in many cases — many logos already contain the company name as part of the logo design (called a "wordmark" or "lockup"). Showing "Company Logo Image" plus "COMPANY NAME" text creates visual duplication.

**How to fix:** This is detailed in Section 4 below.

### Problem 3: contactWithIcons Has No Overflow Prevention

**What is broken:** The `contactWithIcons` function in card-template-helpers.ts lays out contact entries at fixed intervals (startY plus index times lineGap) with zero bounds checking. If a user has phone, email, website, address, LinkedIn, Twitter, and Instagram all filled in (seven entries), the contact block can easily overflow past the bottom edge of the card. There is no clamping, gap compression, or entry dropping.

**How to fix:** Before rendering, calculate the total height needed: numberOfEntries multiplied by lineGap. Compare against available space (cardHeight minus startY minus bottomMargin). If the contact block does not fit, reduce lineGap proportionally. If it still does not fit after reducing lineGap to a minimum of fontSize times 1.2, drop the least important entries (Instagram, Twitter, LinkedIn first — social media is expendable; phone, email, address are essential).

The existing `buildContactLayers` function in the adapter file already has this overflow prevention via `fitContactBlock`. Either enhance `contactWithIcons` similarly, or create a new wrapper function that applies the same logic.

### Problem 4: Text Overlap From Hardcoded Positions

**What is broken:** Every template uses hardcoded Y-positions expressed as percentages of card height (like y = H times 0.85). These positions were calculated assuming short text strings. But real users enter long names ("Dr. Alexander Bartholomew-Richardson III"), long titles ("Senior Vice President of Digital Transformation and Innovation"), and long company names ("Dramac International Marketing and Communications Agency"). When text is longer than expected, elements collide.

**How to fix:** After placing all text elements, perform a basic vertical overlap check. For each text element, calculate its bottom edge (y plus fontSize times lineHeight). If any subsequent element's top Y is above this bottom edge, push it down with a minimum gap of 8 pixels. This post-processing step should run at the end of every layout function before returning the layers array.

Alternatively, build each section (header zone, contact zone, footer zone) relative to the previous section's bottom edge rather than using absolute Y positions. This makes layouts naturally adaptive.

### Problem 5: Missing or Inadequate Decorative Elements

**What is broken:** Several templates have oversimplified decorative elements that do not match their reference designs. Examples:
- The "gear icon" in cyan-tech is just two concentric circles with "< >" text — not a real gear.
- The "skyline bars" in clean-accent are random-height gray rectangles that look like a broken bar chart, not a city skyline.
- The celtic-stripe pattern uses simple ellipses and diamonds without true interlacing (no over-under weaving effect).
- Wave shapes use only two bezier control points where the reference shows more complex undulation.

**How to fix:** For each template, consult TEMPLATE-SPECIFICATIONS.md to see the intended visual. Every decorative element should match the specification's description. If the spec calls for a skyline with 12-15 buildings, draw 12-15 building shapes at varying heights as described. If it calls for interlaced patterns, simulate the weaving effect with overlapping strokes. If it calls for a gear, draw actual gear teeth.

Use the pathLayer function with arrays of M, L, C, Q, and Z path commands to create complex shapes. These are vector path commands: M is moveTo, L is lineTo, C is cubic bezier, Q is quadratic bezier, Z is closePath.

---

## 4. Logo and Company Name Rules (The Professional Standard)

This is the most important design rule in the entire system. Professional business card designers follow a clear hierarchy for brand identity:

### Rule 1: Logo Replaces Company Name in the Logo Area

When a user uploads a logo, the company name text should NOT appear adjacent to or paired with the logo image. The logo IS the brand identity. Showing "Company Logo" plus "COMPANY NAME" in text is redundant and looks amateurish.

**If logo is present:** Show the logo image. Do NOT show the company name as a text layer next to it. The company name may still appear elsewhere on the card (for example, as a standalone text element in a different zone), but never directly paired with the logo.

**If logo is absent:** Show the company name as styled text in the logo zone. This is the fallback — the text replaces the logo, it does not accompany it.

### Rule 2: The buildWatermarkLogo Function Behavior

The `buildWatermarkLogo` function already handles this partially — when a logo URL exists, it renders the image; when absent, it renders initials. But the problem is that templates add BOTH a buildWatermarkLogo call AND a separate company name text layer.

**The fix pattern for every template:**

Instead of:
- Always call buildWatermarkLogo (renders image OR initials)
- Always add a company name text layer next to it

Do this:
- Call buildWatermarkLogo (renders image OR initials)
- Conditionally add the company name text layer: only if cfg.logoUrl is NOT present
- When cfg.logoUrl IS present, the company name text layer in the logo area should be omitted

In code terms, the company name text layer that sits adjacent to the logo should be wrapped in a condition checking whether cfg.logoUrl is falsy.

### Rule 3: Where Company Name CAN Still Appear

Even when a logo is present, the company name may appear on the card in these situations:
- As a standalone brand text in a separate zone (not adjacent to the logo)
- On the back side as centered company identification
- As a watermark behind other content
- As part of a footer or header bar that is visually separated from the logo zone

The key principle: the company name should never appear to be a "caption" or "label" for the logo. They should either be in completely different zones, or the company name should be omitted when the logo is present in that zone.

### Rule 4: Initials Fallback Quality

When no logo is provided and the system falls back to initials, make the initials visually impactful:
- Use the first letter of each word in the company name, maximum 2-3 letters
- If there is no company name, use the person's name initials
- Style the initials with appropriate size, weight, and color for the template's design language
- Do NOT render a tiny, barely visible initial — make it a proper brand mark

### Rule 5: Logo Sizing

The logo should be sized appropriately for its zone:
- Primary logo placement (front or back hero): 8-15 percent of card width
- Secondary/watermark placement: 15-35 percent of card width at reduced opacity
- Never make the logo so small that it becomes unrecognizable (minimum 40 pixels)
- Never make the logo so large that it overwhelms the card (maximum 40 percent of card width)

---

## 5. Typography and Font System Rules

### Font Family Resolution

The system has a font selection dropdown with five options: Modern, Classic, Bold, Elegant, and Minimal. These map to font family stacks as follows:

- Modern: Inter, SF Pro Display, Segoe UI, sans-serif
- Classic: Georgia, Garamond, Times New Roman, serif
- Bold: Montserrat, Arial Black, Impact, sans-serif
- Elegant: Playfair Display, Didot, Bodoni MT, serif
- Minimal: Helvetica Neue, Helvetica, Arial, sans-serif

The resolved font family string is passed to every layout function as the `ff` parameter. Every text element on the card MUST use this parameter as its fontFamily value. This is non-negotiable.

### Font Size Hierarchy

Every business card must maintain a clear visual hierarchy. Font sizes are relative to card height (H = 600 pixels for standard cards):

- **Name (hero text):** 5-8 percent of H (30-48 pixels). This is the most prominent text on the front side. It must be immediately readable and never smaller than 24 pixels.
- **Company name:** 3-6 percent of H (18-36 pixels). Should be clearly readable but secondary to the name on most templates.
- **Title/position:** 2.5-4 percent of H (15-24 pixels). Smaller than the name, often in a lighter weight or secondary color.
- **Contact information:** 2-3 percent of H (12-18 pixels). Readable but compact. Never smaller than 11 pixels.
- **Tagline/slogan:** 2-3 percent of H (12-18 pixels). Can be lighter weight or reduced opacity.
- **Labels and fine print:** 1.5-2.5 percent of H (9-15 pixels). Minimum readable size.

### Font Weight Rules

- Name: 600-700 weight (bold to heavy). Names must feel authoritative.
- Company: 500-700 weight. Match the template's overall tone.
- Title: 300-500 weight. Lighter than the name to create contrast.
- Contact: 400 weight (regular). Clean and legible.
- Tagline: 300-400 weight. Understated.

### Text Must Be Readable

No text element should ever be smaller than 11 pixels on the standard card size. If your layout calculations produce a font size below 11 pixels, clamp it to 11. Text that cannot be read serves no purpose.

### Letter Spacing

Letter spacing (tracking) is used sparingly for uppercase labels and brand names. Values are in pixels and typically range from 1 to 8. Excessive letter spacing (above 10 pixels) makes text hard to read and should be avoided. Use letter spacing of 2-5 for uppercase labels and 0-2 for regular text.

---

## 6. Contact Layout Rules

### Essential vs Optional Contact Fields

The system supports seven contact fields. They are ordered by importance:

1. **Phone** — Essential. Always show if provided.
2. **Email** — Essential. Always show if provided.
3. **Website** — Important. Show if space allows.
4. **Address** — Important. Show if space allows.
5. **LinkedIn** — Optional. Show only if space allows.
6. **Twitter** — Optional. Show only if space allows.
7. **Instagram** — Optional. Show only if space allows.

If space is limited, drop fields from the bottom of this list (Instagram first, then Twitter, then LinkedIn). Never drop phone or email.

### Contact Block Sizing

A contact block with N entries at lineGap spacing requires N times lineGap pixels of vertical space. Before placing a contact block, verify this calculation:

- Available vertical space = card bottom edge minus contact startY minus bottom margin (typically 5-8 percent of H)
- Required space = number of contact entries times lineGap
- If required exceeds available: reduce lineGap to (available divided by number of entries)
- If reduced lineGap falls below (fontSize times 1.2): start dropping optional fields
- Repeat until the block fits

### Contact Icon Standards

When using contact icons (via contactWithIcons), each icon should be:
- Sized to approximately 90 percent of the contact font size
- Colored with the template's contactIcon theme color
- Vertically centered with its corresponding text line
- Spaced from the text by approximately 50 percent of the font size

### Contact Text Alignment

Contact text should align consistently within its block:
- If left-aligned: all entries share the same X position
- If center-aligned: all entries center on the same X axis
- If right-aligned: all entries share the same right edge
- Mix of alignments within a single contact block looks unprofessional and should never happen

---

## 7. Overlap Prevention Rules

### The Overlap Problem

Business cards have very limited space (1050 by 600 pixels). When text strings are longer than expected, elements that were positioned assuming short text will collide. This must be prevented.

### Rule 1: Vertical Zone Budgeting

Divide the card into vertical zones with explicit boundaries:
- Header zone: top 0 to Y1 (name, company, logo)
- Content zone: Y1 to Y2 (title, tagline)
- Contact zone: Y2 to Y3 (contact information)
- Footer zone: Y3 to bottom (decorative elements, secondary info)

Each zone has a maximum height budget. Elements within a zone must fit within that budget. If they do not fit, apply adaptive sizing (reduce font size or spacing).

### Rule 2: Bottom-Up Available Space Check

Before placing the contact block, calculate:
- Where does the contact block start? (its top Y)
- Where must it end by? (card bottom minus bottom margin)
- How many entries are there?
- What line gap is needed?

Adjust the line gap to fit. If it still does not fit, drop optional entries.

### Rule 3: No Element Below Y = H minus 15

The absolute bottom 15 pixels of the card (Y > 585 on a 600-pixel-tall card) is the bleed danger zone. No text or essential element should be placed there. Decorative background elements that extend to the edge are fine, but text and icons must stay above Y = H times 0.975.

### Rule 4: No Element Above Y = 15

Same rule for the top edge. Essential content must be at least 15 pixels from the top.

### Rule 5: Horizontal Safe Area

No text should extend closer than 30 pixels (approximately 3 percent of W) from the left or right card edge. This is the print trim safety margin.

### Rule 6: Post-Layout Collision Check

After generating all layers, perform a simple collision check for text layers:
- Sort all text layers by their Y position
- For each pair of adjacent text layers, verify that the bottom of the upper layer (its Y plus its height) does not exceed the top of the lower layer (its Y)
- If collision is detected, push the lower element down by the overlap amount plus an 8-pixel gap
- This is a safety net — good layout design should prevent most collisions, but this catches edge cases

---

## 8. Decorative Element Quality Standards

### What Decorative Elements Must Achieve

Decorative elements (shapes, patterns, gradients, geometric forms) give each template its visual identity. They must:

1. **Match the template's reference specification.** Consult TEMPLATE-SPECIFICATIONS.md for the exact description of each decorative element.

2. **Be visually complete.** A "gear icon" must look like a gear with teeth, not two concentric circles. A "city skyline" must look like buildings with varying heights and architectural detail, not random-height rectangles. A "wave" must have natural undulation with proper bezier curves, not a simple arc.

3. **Not interfere with readability.** Decorative elements should be behind text, use reduced opacity when overlapping text zones, and never obscure contact information or the person's name.

4. **Be proportional.** Decorative elements should be sized relative to the card and maintain their intended visual weight. A pattern strip that should be 25 percent of the card width must not be 6 percent.

### Specific Decorative Element Guidelines

**Gradients:** Use multiStopGradient for gradients with more than two colors. Use linearGradient for simple two-color gradients. Specify the angle in degrees (0 is left-to-right, 90 is top-to-bottom, 135 is diagonal).

**Bezier curves:** Organic shapes (waves, flowing lines) require cubic bezier curves (the C path command). Use at least two to three bezier segments per curve for natural-looking undulation. Straight-line approximations of curves look mechanical and wrong.

**Patterns:** Repeating patterns (celtic interlace, topographic contours, dot patterns) should tile properly with consistent spacing. Use a loop to generate repeating units at regular intervals.

**Opacity:** Background decorative elements that sit behind text should use reduced opacity (10-30 percent) so text remains readable. Foreground decorative elements (accent bars, dividers, frames) should be at full opacity or 50-80 percent.

**Stroked vs filled shapes:** Some elements should be stroked (outlines only) and others filled (solid). A topographic contour map uses stroked paths. A solid color block uses filled rectangles. A frame uses stroked rectangles. Make sure the rendering method matches the design intent.

---

## 9. Color Theme System Rules

### How Themes Work

Each template has an entry in TEMPLATE_FIXED_THEMES (in card-template-helpers.ts). This is a dictionary mapping template IDs to TemplateColorTheme objects. A theme defines every color used in the template.

### Rule 1: Templates Must Use Their Theme Colors

Every color used in a template layout function must come from the template's theme object. Do not hardcode hex colors directly in layout functions. Instead, read the theme at the top of the function:

At the start of each layout function, read the theme: `const t = TEMPLATE_FIXED_THEMES["template-id"]`

Then use theme properties: t.frontBg for background, t.frontText for primary text, t.accent for accent color, and so on.

### Rule 2: When Hardcoded Colors Are Acceptable

The only exceptions where you may use hardcoded colors:
- Pure white (#FFFFFF) or pure black (#000000) for universal contrast
- Decorative element colors that are specific to a template's unique design and already documented in the specification (in which case, define them as additional theme properties or as documented constants)

### Rule 3: Theme Completeness

Every theme must define at minimum: frontBg, frontText, accent, backBg, and backText. The optional fields (frontBgAlt, frontTextAlt, accentAlt, backAccent, divider, contactText, contactIcon) should be defined for any template that uses them. Do not leave a template referencing a theme field that is undefined — this produces undefined colors that render as invisible or wrong.

### Rule 4: Contrast

Text must have sufficient contrast against its background. Dark text on dark backgrounds is invisible. Light text on light backgrounds is invisible. Every text element must be readable. If the theme specifies frontText as dark gray and frontBg as dark charcoal, the text will not be readable — fix the theme.

---

## 10. Back Side Layout Rules

### How Back Layouts Work

Back layouts are registered via `registerBackLayout("template-id", layoutFunction)` in the adapter file. The layout function receives:
- W: card width
- H: card height
- cfg: an object with name, company, title, tagline, contacts (ContactInfo), logoUrl, fontFamily, showContactIcons, and qrCodeUrl
- theme: the TemplateColorTheme object

Important: The cfg object for back layouts is NOT the same as CardConfig. It is a reduced TemplateBackLayoutCfg type. Access contact fields via `cfg.contacts.phone`, `cfg.contacts.email`, etc. Do NOT use `cfg.phone` or `cfg.email` directly — those properties do not exist on this type. Access the website via `cfg.contacts.website`, not `cfg.website`.

### Back Side Design Principles

1. **Simpler than the front.** Back sides should be cleaner with fewer elements.
2. **Brand reinforcement.** The back typically features the company logo or name prominently, with secondary information like a website URL or tagline.
3. **Color inversion or complement.** Many templates invert their color scheme on the back (dark front becomes light back, or vice versa). Follow the template's specification.
4. **Contact information on back is optional.** Some templates place detailed contact info on the back; others keep it minimal (just logo and website). Follow the specification.

### Back Side Logo Rule

The same logo-vs-company-name rule applies: if the user has uploaded a logo, show the logo; if not, show the company name or initials. Do not show both the logo and the company name text in the same visual zone on the back side.

---

## 11. Template-by-Template Audit and Fix Instructions

For each template below, I describe what is currently wrong and what the correct layout should be. Refer to TEMPLATE-SPECIFICATIONS.md for the exact pixel coordinates, colors, and rendering recipes. The information below tells you WHAT to fix; the specification tells you WHERE things go.

### Category: Minimal (Templates 1-6)

#### Template 1: ultra-minimal
- Verify the layout matches the specification: centered name as hero text, minimal decorative elements, back side with logo-or-name centered
- Apply the logo/company conditional rule
- Ensure the ff font parameter is used, not hardcoded

#### Template 2: monogram-luxe
- The monogram element (large letter) should be visually prominent and use the company initial
- Apply the logo/company conditional rule
- Ensure proper spacing between the monogram and text elements

#### Template 3: geometric-mark
- The geometric shape (the brand mark) should be crisp and properly sized
- Apply the logo/company conditional rule
- Ensure text does not overlap the geometric element

#### Template 4: frame-minimal
- The frame border should be properly inset from the card edge (per specification)
- Content should be centered within the frame
- Apply the logo/company conditional rule

#### Template 5: split-vertical
- The vertical split must be at the exact percentage specified (not approximate)
- Left and right panel content must be properly aligned within their respective panels
- Apply the logo/company conditional rule

#### Template 6: diagonal-mono
- The diagonal split shape must use proper path commands
- Text on the dark section and text on the light section must use appropriate contrast colors
- The rotated large text element must not clip outside the card boundaries
- Apply the logo/company conditional rule

### Category: Modern (Templates 7-12)

#### Template 7: cyan-tech
**MAJOR ISSUES:**
- The front side is missing the person's name entirely — there is no name element on the front. This is a business card — the name must appear.
- Only the email is shown for contact info. Phone, website, and address are missing from the front layout.
- The "gear icon" is just two concentric circles with "< >" text. It should be a proper gear or tech icon as described in the specification.
- Company text is too small at 3.5 percent of H (21 pixels).

**Fix requirements:**
- Add the person's name prominently (left side, below company)
- Add title below name
- Add full contact block (not just email) using contactWithIcons
- Fix the gear icon to match the specification or replace with a proper tech icon
- Size company text appropriately per the specification

#### Template 8: corporate-chevron
**MAJOR ISSUES:**
- The front side is missing the person's name entirely. A business card without a name is not a business card.
- Only shows company name and website — no phone, email, or address
- Company text at 68 pixels (11.4 percent of H) is excessively large — it dominates the card
- Only a website is shown for contact information

**Fix requirements:**
- Add the person's name on the front side per the specification
- Add the title
- Add contact information (phone, email, website at minimum)
- Reduce company font size to match the specification
- Ensure the chevron shapes do not obstruct text readability

#### Template 9: zigzag-overlay
**MAJOR ISSUES:**
- The name text is microscopic at 2.5 percent of H (approximately 15 pixels) on a mostly blank white card
- There is no title element on the front
- Contact text at 2.2 percent of H (approximately 13 pixels) is barely readable
- Company text at 1.8 percent of H (approximately 11 pixels) is at the absolute minimum and positioned at 96 percent of H (the very bottom edge, likely clipped)
- The gradient bar at top-left is very small (29 percent W by 13 percent H) and isolated
- The card is dominated by empty white space with no visual anchor

**Fix requirements:**
- Complete rewrite of this layout following the specification exactly
- Name should be at least 5-6 percent of H
- Contact info must be readable (at least 2.5 percent of H)
- The gradient bar, dark triangle, and white content strip must match the specification proportions
- Company name must not be at 96 percent of H — it will be clipped

#### Template 10: hex-split
- Verify the hexagonal shape is properly rendered with all six vertices
- The split between the dark and light sections should match the specification
- Apply the logo/company conditional rule
- Ensure all contact info is present and readable

#### Template 11: dot-circle
- The dot pattern should be properly distributed and sized
- The central content area should be clearly defined
- Apply the logo/company conditional rule
- Ensure contact info is present

#### Template 12: wave-gradient
**ISSUES:**
- The triangle "logo" at 3 percent of W (31 pixels) is too small to function as a brand mark
- Name text at 2.8 percent of H (17 pixels) and title at 2.2 percent of H (13 pixels) are too small
- Contact text at 2 percent of H (12 pixels) is near minimum readability
- The layout feels scattered — company text upper-left, name center-right, contact lower-left — elements are in all four quadrants with no visual flow

**Fix requirements:**
- Follow the specification for proper element placement
- Use buildWatermarkLogo for the logo area (not a hardcoded triangle)
- Increase name and title font sizes to match the specification
- Create visual flow — elements should relate to each other, not be scattered

### Category: Classic (Templates 13-18)

#### Template 13: circle-brand
- Apply the logo/company conditional rule — currently shows both logo and company name
- Verify the circle shape is properly centered and sized
- Ensure all text elements are readable

#### Template 14: full-color-back
- Apply the logo/company conditional rule
- The back side should have a full-color background as specified
- Verify contact layout on front side

#### Template 15: engineering-pro
- Apply the logo/company conditional rule — currently shows "DM" initials AND "DRAMAC MARKETING AGENCY" text right next to each other
- The layout looks clean in the screenshot but the logo/company duplication must be fixed
- Verify the engineering/professional grid lines match the specification

#### Template 16: clean-accent
**MAJOR ISSUES:**
- The bottom section has a "city skyline" made of random-height gray rectangles that looks like a broken bar chart. This does NOT match a "clean accent" design — a clean accent should have a subtle accent line, gradient bar, or minimal geometric element.
- The QR code placeholder is a gray rectangle sitting in the middle of the card, disconnected from everything
- Name at 2.8 percent of H (17 pixels) in the top-right corner is too small
- Contact text at 1.8 percent of H (11 pixels) is at absolute minimum readability

**Fix requirements:**
- Complete redesign of the bottom decorative element to match the specification (should be a clean accent bar or gradient, not a skyline)
- Remove or redesign the QR placeholder — if the user has not provided a QR URL, do not show a gray rectangle
- Increase name and contact font sizes to match the specification
- Apply the logo/company conditional rule

#### Template 17: nature-clean
- Apply the logo/company conditional rule
- Verify the nature/organic decorative elements match the specification
- Ensure proper text hierarchy

#### Template 18: diamond-brand
- Apply the logo/company conditional rule
- Verify the diamond shape is properly rendered
- Ensure all text is readable and properly positioned

### Category: Creative (Templates 19-24)

#### Template 19: flowing-lines
- The flowing bezier lines should have proper curvature (verify against specification)
- Apply the logo/company conditional rule
- Verify contact block does not overlap the decorative lines

#### Template 20: neon-watermark
- The diagonal section and geometric overlays should match the specification
- Apply the logo/company conditional rule
- The watermark on the back should be properly transparent

#### Template 21: blueprint-tech
- The architectural floor plan should be detailed enough to read as a floor plan (not just a few lines)
- Apply the logo/company conditional rule
- The blueprint grid lines should be visible and proportional

#### Template 22: skyline-silhouette
- The multi-layer skyline should have depth (4 layers from light to dark)
- Buildings should have varying heights and proper architectural proportions
- Apply the logo/company conditional rule

#### Template 23: world-map
- The world map element should be recognizable as a world map
- Apply the logo/company conditional rule
- Verify the dot pattern is visible but not overwhelming

#### Template 24: diagonal-gold
- The diagonal split should be at the correct angle per the specification
- The gold accent elements should be properly positioned
- Apply the logo/company conditional rule

### Category: Luxury (Templates 25-30)

#### Template 25: luxury-divider
- This is a two-color inversion design: gold front, teal back
- The front should NOT have vertical dividers (the old code had them but the specification does not)
- Apply the logo/company conditional rule
- QR code placement on the front upper-right per specification

#### Template 26: social-band
- The 70/30 horizontal split must be exact (green top 70 percent, cream bottom 30 percent)
- The vertical divider in the cream section should be at 55 percent from left
- Brand text should be Light weight (300) with very wide tracking
- Apply the logo/company conditional rule
- Back side features a script monogram watermark at 30 percent opacity

#### Template 27: organic-pattern
- The 60/40 vertical split must be exact (green left 60 percent, white right 40 percent)
- The gold icon strip at the divider is a crucial design element — it must be visible
- Text on the green section must be in the muted gold color
- The back side topographic contour pattern needs proper bezier curves
- Apply the logo/company conditional rule

#### Template 28: celtic-stripe
- The pattern strip must be 25 percent of card width (currently many implementations use only 6 percent — this is way too narrow)
- The interlaced oval-diamond pattern should tile properly across the full strip height
- The back side mirrors the strip to the RIGHT side (opposite side from front)
- Monochrome palette only — no accent colors
- Apply the logo/company conditional rule

#### Template 29: premium-crest
- The key-skyline composite logo is the defining element — it must be properly rendered
- The key shaft, key head circle, building silhouettes in the key head, and key hole must all be visible
- The back side city skyline silhouette should span full width
- Apply the logo/company conditional rule

#### Template 30: gold-construct
- The 60/40 horizontal split (dark top, light bottom) must be exact
- The 3-column contact strip in the bottom section needs proper column dividers
- Circular icon placeholders should be properly stroked (not filled)
- The back side world map dot pattern must be visible
- Corner accent triangles on the back must be in all four corners
- Apply the logo/company conditional rule

---

## 12. Testing and Verification Checklist

After completing all fixes, verify every template against this checklist:

### For Every Template (All 30):

1. **Build passes:** `npx tsc --noEmit` produces zero errors
2. **Name is visible:** The person's name appears on the front side and is readable (minimum 24 pixels)
3. **Title is visible:** The job title appears on the front side
4. **Company is visible:** The company name appears somewhere on the card (either as text or implied by the logo)
5. **Contact info works:** At minimum, phone and email appear when provided
6. **No text overlap:** No two text elements visually collide
7. **No text clipping:** No text element extends beyond the card boundaries
8. **Logo rule works:** When logoUrl is provided, the company name does not appear as a caption next to the logo image in the same zone. When logoUrl is absent, the company name or initials appear instead.
9. **Font family works:** The text uses the font specified by the ff parameter, not hardcoded Inter/geometric
10. **Colors are from theme:** All colors reference TEMPLATE_FIXED_THEMES, not hardcoded hex values
11. **Decorative elements render:** The template's signature decorative element (wave, chevron, pattern, etc.) is visible and matches the specification
12. **Back side works:** The registered back layout renders properly with appropriate content
13. **Back side contacts:** Back layout uses cfg.contacts.property (not cfg.property) for contact fields
14. **Minimum readability:** No text element is smaller than 11 pixels
15. **Safe margins:** No essential content within 15 pixels of any card edge

### Visual Quality Checks:

1. Does the card look professional? Would you put this card in your wallet?
2. Is there a clear visual hierarchy? Can you immediately tell who the card belongs to?
3. Are decorative elements enhancing the design, not creating noise?
4. Is the back side a proper complement to the front — not a repeat and not a blank space?
5. Do the colors work together? Is there sufficient contrast?

---

## 13. API Reference (Available Functions and Their Correct Usage)

This section describes every helper function available for building template layouts. Use ONLY these functions — do not create new utility functions unless absolutely necessary.

### Layer Creation Functions (from card-template-helpers.ts)

**filledRect** — Creates a filled rectangle shape layer.
Parameters: name, x, y, w, h, fill (must be a Paint type — use solidPaintHex to create), tags (string array), optional radii (array of four numbers for corner rounding).
Use for: solid color backgrounds, panels, accent bars, color blocks.

**filledEllipse** — Creates a filled ellipse shape layer.
Parameters: name, x, y (these are the center point, not top-left), rx, ry (radii), fill (Paint type), tags.
Use for: circular brand marks, decorative circles, dot elements.

**strokeRect** — Creates a stroke-only rectangle (no fill).
Parameters: name, x, y, w, h, color (hex string), optional width (stroke width), optional alpha, optional radii, optional tags.
Use for: frames, borders, outline boxes.

**strokeEllipse** — Creates a stroke-only ellipse (no fill).
Parameters: name, cx, cy, rx, ry, color (hex string), optional width (stroke width).
Use for: circular outlines, icon containers.

**styledText** — Creates a text layer with comprehensive styling.
Parameters: name, x, y, w, text, fontSize, fontFamily, optional weight (default 400), color (hex string), optional alpha (default 1.0), optional align ("left"/"center"/"right"), optional uppercase (boolean), optional italic (boolean), optional letterSpacing (number), optional lineHeight (number), tags (string array), optional h (height), optional autoFit (boolean — note: declared but not implemented in styledText; it IS implemented in the textLayer function inside the adapter).
Use for: ALL text elements (names, titles, companies, contact text, labels).

**pathLayer** — Creates a vector path layer from path commands.
Parameters: name, x, y, w, h, commands (array of PathCommand objects), optional fill (Paint type), optional stroke (StrokeSpec — create via makeStroke), optional opacity (number 0-1), optional closed (boolean), tags.
Use for: complex shapes (waves, chevrons, triangles, custom geometry, skylines).

**divider** — Creates a horizontal or vertical divider line.
Parameters: optional name, x, y, length, optional thickness (default 1), color (hex string), optional alpha, optional direction ("horizontal" or "vertical"), tags.
Use for: separator lines between sections.

### Paint and Gradient Functions

**solidPaintHex** — Creates a solid color Paint object from a hex color string.
Parameters: color (hex string), optional alpha (number 0-1).
Returns: a Paint object suitable for the fill parameter of shape functions.

**linearGradient** — Creates a simple two-color gradient Paint.
Parameters: angle (degrees — 0 is left-to-right, 90 is top-to-bottom), color1 (hex string), color2 (hex string).
Returns: a Paint object.

**multiStopGradient** — Creates a multi-stop gradient Paint.
Parameters: angleDeg (degrees), stops (array of objects with color (hex string), offset (0-1), and optional alpha).
Returns: a Paint object.

**makeStroke** — Creates a StrokeSpec for path layer strokes.
Parameters: color (hex string), width (number).
Returns: a StrokeSpec object suitable for the stroke parameter of pathLayer.

### Path Commands

**M(x, y)** — Move to (start a new subpath at this point).
**L(x, y)** — Line to (draw a straight line from current point to this point).
**C(cp1x, cp1y, cp2x, cp2y, x, y)** — Cubic bezier curve (two control points and endpoint).
**Q(cpx, cpy, x, y)** — Quadratic bezier curve (one control point and endpoint).
**Z()** — Close path (draw a line back to the most recent M point).

Use these to build path command arrays for the pathLayer function.

### Logo Functions

**buildWatermarkLogo** — Creates a logo layer (image if available, initials if not).
Parameters (8 positional): logoUrl (string or undefined), companyName (string), x (number), y (number), size (number — makes a square), color (hex string — used for initials fallback), opacity (number 0-1), fontFamily (string).
Returns: array of LayerV2.
Use for: placing the brand logo or company initials on the card.

**Important:** After calling this function, apply the logo/company conditional rule (see Section 4). Only add a separate company name text layer if cfg.logoUrl is falsy.

### Contact Functions

**contactWithIcons** — Creates a vertical list of contact entries with icons.
Parameters (single object): contacts (ContactInfo object), x, startY, lineGap, textColor (hex string), iconColor (hex string), fontSize, fontFamily, optional align ("left" or "right"), optional maxWidth, optional tags (string array).
Returns: array of LayerV2.
Use for: contact information blocks on both front and back sides.

**Important:** This function has NO overflow prevention. Before calling it, calculate whether the contact block will fit in the available space. If not, reduce lineGap or filter out optional contact fields from the ContactInfo object.

**extractContacts** — Extracts a ContactInfo object from a config object.
Parameters: an object with optional phone, email, website, address, linkedin, twitter, instagram fields.
Returns: ContactInfo object.
Use for: converting CardConfig fields into a ContactInfo for contactWithIcons.

### Geometry Helper Functions

**circlePath(cx, cy, r)** — Returns an array of PathCommand objects forming a circle. Use with pathLayer.

**cornerBracketPath(x, y, size, corner)** — Returns path commands for a corner bracket decorative element. The corner parameter specifies which corner ("tl", "tr", "bl", "br").

**diagonalSplitPath(W, H, splitRatio, direction)** — Returns path commands for a diagonal split shape across the card.

### Utility Functions

**hexToRGBA(hex, alpha)** — Converts a hex color string to an RGBA object. Used internally by many functions.

### The textLayer Function (inside business-card-adapter.ts)

This is an internal helper in the adapter (NOT exported from card-template-helpers). It wraps createTextLayerV2 with additional features:
- autoFit: if true, applies autoFitFontSize to prevent horizontal text overflow
- Tags, weight, alignment, uppercase, letter spacing support
- Calculates height automatically from fontSize

This function is available within the adapter file. Use it for text layers that need autoFit.

---

## Final Notes

### Working Order

Fix the systemic issues first (font family, logo/company conditional, contact overflow). Then work through templates one by one, in order: Minimal, Modern, Classic, Creative, Luxury. For each template:

1. Read the template's specification in TEMPLATE-SPECIFICATIONS.md
2. Read the current layout function code
3. Identify discrepancies between the specification and the code
4. Fix the layout function
5. Verify the back layout function works correctly
6. Run the build check

### What Success Looks Like

When you are done, every one of the 30 templates should:
- Render a professional business card that a user would be proud to hand out
- Have all essential information visible and readable (name, title, company or logo, contact info)
- Have decorative elements that match the template's design concept
- Use the correct colors from its theme
- Respect the user's font selection
- Handle the logo/company relationship professionally
- Have a complementary back side
- Produce zero TypeScript errors

### What to Avoid

- Do not restructure the file architecture — keep the same file organization
- Do not change the DesignDocumentV2 schema types
- Do not modify the recipe-based generator system (template-generator.ts)
- Do not change the CardConfig interface
- Do not delete any exported functions or types that other files depend on
- Do not remove the TEMPLATE_FIXED_THEMES entries — update them if needed
- Do not change the registerBackLayout function signature
- Do not change the TemplateBackLayoutCfg type

Focus exclusively on making the 30 template layouts render correctly and professionally.
