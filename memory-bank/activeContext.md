# DMSuite — Active Context

## Current Focus
**Phase:** M3.11 Complete + Full AI Connectivity Audit Complete

### Actual State (Session 37 Updated)
- **194 total tools** defined in tools.ts
- **96 tools** have dedicated workspace routes in page.tsx → status: "ready"  
- **~90 tools** have NO workspace → status: "coming-soon"
- **8 tools** have NO workspace → status: "beta"
- **93 workspace component files** exist in `src/components/workspaces/`
- Build passes with zero TypeScript errors
- All workspaces now use global Accordion component (no more local Section+Set<string>)
- AI Design Engine v2.0 — massively upgraded with 13 sections, 60+ exports
- **vNext Editor Infrastructure** — 14+ files, 6,207+ lines (Session 28)
- **M2 BusinessCard Adapter** — layer-based rendering via DesignDocumentV2 (Session 29)
- **M3 BusinessCard Interactive Editor** — editorMode toggle, CanvasEditor, AI revision via ai-patch (Session 30)
- **M5 Multi-Workspace Migration** — PosterFlyer, BannerAd, SocialMediaPost all wired with vNext editor (Session 30)
- **M3.5 Pro Editor + AI Full Control** — 8 new pro UI components, rewritten LayerPropertiesPanel, 15 new AI intent types, smart snapping, align/distribute (Session 31)
- **M3.6 AI Pipeline Deep Fix** — critical `opToCommand` nested-path bug fixed, AI prompt with full path schema (Session 32)
- **M3.7 Business Card Full AI Sync** — QR code layer, back-side pattern, Gold Foil cfg colors, expanded syncColorsToDocument, expanded legacy AI prompt, expanded Quick Edit panel (Session 33)
- **M3.8 Infinite Designs Generator** — 40 recipes × 60 themes × 12 accent kits = 28,800 base designs; template-generator.ts (~1376 lines); InfiniteDesigns AccordionSection wired into BusinessCardWorkspace (Session 33/34 previous)
- **M3.9 UX Polish & Power Features** — overlap-safe generator, AI Director full designs, CSV batch import, 300 DPI default, logo scale fix, front-only mode (Session 34)
- **M3.10 Abstract Asset Library** — 90 decorative abstract assets across 9 categories; abstract-library.ts (~2400 lines); full integration into adapter, AI patch, generator, quick edit, workspace UI (Session 35)
- **M3.11 Business Card Deep Enhancement** — 11 improvements: social media contacts, auto-fit text, 12 AI intents, 32 color presets, registry-aware AI, expanded batch with 11 fields, ZIP batch export, CSV 11-column parser (Session 36)
- **Full AI Connectivity Audit** — every card tool asset/field now wired into both AI engines (Session 37)

## Recent Changes (Session 37 — Full AI Connectivity Audit)

### All Card Tool Assets Wired to AI Engines

**Modified: `src/lib/editor/ai-patch.ts`** (8 changes, all applied)
1. **Import `getIconListForAICompact`** — icon library (115+ icons) now visible to AI engine
2. **`swap-icon` IntentType** — AI can now change which icon appears on any icon layer
3. **`swap-icon` handler** in `intentToPatchOps` — pushes `/iconId` replace op on icon layers
4. **`iconCatalog` variable** — compact icon list built at prompt-generation time
5. **`## ICON LIBRARY` section** — injected into buildAIPatchPrompt after ABSTRACT ASSET CATALOG
6. **Social media semantic tags** — added `contact-linkedin`, `contact-twitter`, `contact-instagram` rows to semantic tag map
7. **`/iconId` editable path** — added to ICON layer paths table so AI knows it can swap icons
8. **`swap-icon` in intent list + table** — documented in Available Intent Types and Card Design Intents

**Modified: `src/components/workspaces/BusinessCardWorkspace.tsx`** (9 changes applied)
1. **`isElementSpecificRequest` keywords expanded** — added: linkedin, twitter, instagram, social media, social, logo, brand mark, icon, contact icon, qr, qr code, pattern, texture, overlay, abstract, decorative, decoration
2. **`generateWithAI` prompt expanded** — added Website, LinkedIn, Twitter, Instagram, Show Contact Icons context to PERSON & COMPANY section
3. **`generateWithAI` new response keys** — CARD_FORMAT, SHOW_ICONS, QR_CODE, ABSTRACT with top-18 abstract asset options
4. **`generateWithAI` new parsers** — cardFormatMatch, showIconsMatch, qrCodeMatch, abstractAssetMatch regex parsers
5. **`generateWithAI` applies new values** — cardStyle from CARD_FORMAT, showContactIcons from SHOW_ICONS, qrCodeUrl from QR_CODE, abstractAssets from ABSTRACT
6. **`handleRevision` currentDesign** — added linkedin, twitter, instagram fields so AI has full context
7. **`handleRevision` SCOPE_ALLOWED_FIELDS** — added linkedin, twitter, instagram to text-only, element-specific, full-redesign scopes
8. **`handleRevision` validation** — added typeof checks for linkedin, twitter, instagram string passthroughs
9. **`handleRevision` prompt** — documents linkedin, twitter, instagram as settable fields with removal instructions

## Recent Changes (Session 36 — M3.11)

### Business Card Deep Enhancement — 11 Improvements

**Modified: `src/components/workspaces/BusinessCardWorkspace.tsx`** (~3900 lines after edits)
1. **ContactEntry expanded** — added website, address, linkedin, twitter, instagram, department, qrUrl, logoOverride fields (all optional)
2. **CardConfig extended** — linkedin, twitter, instagram string fields
3. **Social media contact fields in UI** — LinkedIn, Twitter/X, Instagram inputs in Contact Details sidebar section
4. **32 color presets** (was 12) — added Rose Gold, Copper, Platinum, Emerald, Royal Blue, Sunset, Lavender, Teal Pro, Carbon, Ice Blue, Mauve, Olive, Terracotta, Mint Fresh, Electric, Blush, Mahogany, Steel, Violet Ink, Warm Sand
5. **Registry-aware AI generation** — prompt now includes full LAYOUT_RECIPES/CARD_THEMES/ACCENT_KITS listings; AI can pick specific recipe/theme/accent by ID; response parsed with regex + validated against registries; fallback to suggestCombination()
6. **Expanded batch UI** — collapsible "More fields" `<details>` section with website, address, linkedin, twitter, instagram, department, QR URL inputs per person
7. **CSV parser upgraded** — 11 columns: Name, Title, Email, Phone, Website, Address, LinkedIn, Twitter, Instagram, Department, QR URL
8. **CSV template upgraded** — 11-column template with example data
9. **ZIP batch export** — JSZip-based export renders each person's front+back card as 300 DPI PNGs, bundles into a ZIP with `{name}-front.png`/`{name}-back.png` naming; progress bar shared with PDF export
10. **Batch `renderBatchCard()`** — passes extended fields (website, address, linkedin, twitter, instagram) and per-person QR override

**Modified: `src/lib/editor/business-card-adapter.ts`** (~2340 lines after edits)
1. **CardConfig extended** — linkedin, twitter, instagram string fields
2. **ContactEntry type expanded** — includes "linkedin" | "twitter" | "instagram" contact types
3. **`getContactEntries()`** — adds linkedin (iconId:"linkedin"), twitter (iconId:"twitter-x"), instagram (iconId:"instagram")
4. **Auto-fit text overflow prevention**:
   - `autoFitFontSize()` — char-width heuristic (0.55 sans-serif, 0.50 serif), scales proportionally, min 60% or 14px
   - `fitContactBlock()` — calculates max visible contact lines, adjusts gap
   - `textLayer()` helper — optional `autoFit` boolean parameter
   - Post-processing in `cardConfigToDocument()` — auto-fits all "name" and "company" tagged TextLayerV2 layers

**Modified: `src/lib/editor/ai-patch.ts`** (~1804 lines after edits)
1. **12 new card-specific AI intents**: make-luxurious, make-minimalist, make-corporate, make-creative, apply-typographic-scale, balance-visual-weight, improve-name-hierarchy, add-visual-accent, refine-contact-layout, modernize-design, add-brand-consistency, improve-whitespace
2. **Full intent handlers** — each generates appropriate PatchOps targeting tags/transforms/styles
3. **buildAIPatchPrompt expanded** — new "Card Design Intents (M3.11)" table documenting all 12 intents with params
4. **Type fix** — Paint union narrowed properly with intermediate variable for SolidPaint access

### Abstract Asset Library — Full Implementation

**New File: `src/lib/editor/abstract-library.ts`** (~2,400 lines)
- **90 abstract decorative assets** across 9 categories:
  - Modern (10): shard, floating-dots, gradient-orb, edge-glow, parallel-lines, split-plane, corner-radius, noise-field, stacked-bars, intersect
  - Minimalist (10): thin-frame, rule-set, dot-grid, negative-space, circle-accent, baseline-rule, l-bracket, margin-lines, fine-cross, silent-bar
  - Vintage (10): sunburst, ornamental-corner, art-deco-fan, filigree-line, halftone-fade, decorative-border, typographic-rule, laurel-arc, aged-texture, cameo-frame
  - Corporate (10): header-bar, block-accent, sidebar-band, power-band, pinstripe, corner-mark, rule-pair, diagonal-slice, grid-watermark, data-bar
  - Luxury (10): gold-vine, foil-shimmer, pearl-border, silk-wave, monogram-frame, diamond-dust, ribbon-accent, crystal-edge, emboss-line, filigree-panel
  - Organic (10): wave-form, leaf-motif, petal-scatter, root-tendril, stone-texture, water-ripple, moss-patch, branch-line, seed-pod, cloud-drift
  - Tech (10): circuit-node, binary-rain, hex-grid, data-stream, glitch-bar, scan-line, pixel-cluster, fiber-optic, hologram-strip, signal-wave
  - Bold (10): color-block, diagonal-slash, pop-circle, halftone-dots, drip-edge, zigzag-border, spray-scatter, brush-stroke, tape-strip, explosion-burst
  - Geometric (10): golden-spiral, tessellation, penrose-tile, fractal-branch, voronoi-cell, isometric-cube, moiré-ring, star-polygon, concentric-squares, radial-burst
- **Types**: AbstractCategory, AbstractAssetType (8 types), AbstractMood, AbstractCustomizable, AbstractColorRoles, AbstractBuildParams, AbstractAsset, AbstractLayerConfig
- **Registry**: O(1) lookup via ABSTRACT_REGISTRY, category/mood/type filters, search function
- **AI helpers**: getAbstractListForAI(), searchAbstractAssets(), getAbstractCountByCategory()
- **Builder**: buildAbstractAsset() — resolves asset by ID, calls its build() function with full params (W, H, colors, opacity, scale, rotation, offsets, blendMode, colorOverride)
- **Tags**: Every layer tagged with ["abstract-asset", "abstract-{id}", color-role-tags, "decorative"]

**Modified: `src/lib/editor/business-card-adapter.ts`**
- CardConfig extended with `abstractAssets?: AbstractLayerConfig[]`
- `cardConfigToDocument()` builds and inserts abstract layers with z-ordering: Pattern → Abstract behind-content → Template → Abstract above-content → QR Code
- `syncColorsToDocument()` handles abstract layers tagged "color-primary"/"color-secondary" with fingerprint-safe previous-color checking and alpha preservation

**Modified: `src/lib/editor/ai-patch.ts`**
- 4 new IntentTypes: add-abstract-asset, remove-abstract-asset, swap-abstract-asset, configure-abstract-asset
- 3 new semantic tag map entries: abstract → ["abstract-asset"], abstract shard → ["abstract-modern-shard"], decorative element → ["decorative"]

**Modified: `src/lib/editor/template-generator.ts`**
- AccentLayer interface extended with optional `abstractId?: string` — allows AccentKits to reference abstract assets by ID

**Modified: `src/components/editor/BusinessCardLayerQuickEdit.tsx`**
- New semantic element entry: { tag: "abstract-asset", label: "Abstract", description: "Abstract decorative assets" }

**Modified: `src/components/workspaces/BusinessCardWorkspace.tsx`**
- Abstract library imports added
- Local CardConfig extended with `abstractAssets` field
- New "Abstract Assets" AccordionSection between "Style & Colors" and "Card Size & Print":
  - Category filter buttons (9 categories)
  - Active asset manager with swap/z-position toggle/remove
  - Quick-add grid with 6 popular assets

**Modified: `src/lib/editor/index.ts`**
- Full barrel exports: 8 types + 10 functions/constants from abstract-library.ts
   - Replaced `gold1`/`gold2` constants with `cfg.primaryColor`/`cfg.secondaryColor`
   - AI color changes now properly propagate to borders, corners, dividers, titles
   - Corner marks now tagged `"accent"` so they're targetable by color sync

4. **`syncColorsToDocument` only covered name+accent** (`business-card-adapter.ts`)
   - Now covers ALL text tags: `title` → primaryColor, `company` → textColor/primaryColor,
     `contact-text` → textColor, `tagline` → textColor
   - Now syncs `contact-icon` (icon layers) → primaryColor
   - Now syncs `corner` (shape layers) → secondaryColor
   - Now syncs `border` (shape strokes) → primaryColor
   - Added `prevSecondaryColor` fingerprinting for manual override preservation
   - Workspace sync ref updated to track `secondaryColor`

5. **Legacy AI revision prompt was missing 11 CardConfig fields**
   - Added: `name`, `title`, `company`, `email`, `phone`, `website`, `address`, `cardStyle`, `side`, `qrCodeUrl`
   - All scopes updated: "text-only" can now edit contact text fields, "layout-only" can change cardStyle/side
   - Validation added for all new fields (string passthrough, enum checks)
   - Prompt instructions expanded with cardStyle options, side toggle, qrCodeUrl control

### AI Prompt Enhanced: Expanded Semantic Tag Map (`ai-patch.ts`)
The `buildAIPatchPrompt` semantic element map now includes 14 entries (was 8):
Added: `contact-icon`, `logo`, `qr-code`, `pattern`, `border`, `corner`

### BusinessCardLayerQuickEdit Expanded (`BusinessCardLayerQuickEdit.tsx`)
Quick-edit color picker panel now shows 11 semantic entries (was 6):
Added: Icons, Border, Corners, Logo, QR Code
Also: icon layers now supported in `getLayerColor` and `handleColorChange`

**Icon layers**: `/color`, `/strokeWidth`, `/opacity`

**All layers**: `/opacity`, `/blendMode`, `/effects`, `/transform/position/x`, `/transform/position/y`, 
`/transform/size/x`, `/transform/size/y`, `/transform/rotation`

**Effect schema** documented inline (drop-shadow, inner-shadow, blur, glow, outline)



### New Library Modules

1. **`src/lib/editor/align-distribute.ts`** (~220 lines)
   - `createAlignCommand(doc, layerIds, axis)` — align to artboard (1 layer) or selection bounds (multi)
   - `createDistributeCommand(doc, layerIds, axis)` — redistribute 3+ layers evenly
   - `createSpaceEvenlyCommand(doc, layerIds, axis, customGap?)` — equal gap spacing
   - `createFlipCommand(doc, layerIds, axis)` — horizontal/vertical flip

2. **`src/lib/editor/snapping.ts`** (~310 lines)
   - `snapLayer(doc, movingId, proposedX, proposedY, config)` → SnapResult with adjusted position + visual guides
   - `snapResize(doc, resizingId, handle, x, y, w, h, config)` — resize edge snapping
   - `drawSnapGuides(ctx, guides, zoom)` — overlay renderer for snap guide lines
   - `SnapConfig` with tolerance, snapToLayers, snapToArtboard, snapToGrid, gridSize, showSpacing
   - Wired into CanvasEditor: snap guides appear during drag when snap enabled

### New UI Components (src/components/editor/)

3. **`ColorPickerPopover.tsx`** (~290 lines)
   - Full HSV color picker: SV pad + hue bar + hex input + RGB fields + opacity slider
   - 24 preset color swatches
   - Drag interaction on SV pad and hue bar
   - Outside-click-to-close behavior
   - Also exports `ColorSwatch` for inline color display

4. **`FillStrokeEditor.tsx`** (~380 lines)
   - `FillEditor({ fills, onChange, label? })` — multi-fill editor with add/remove/reorder
   - Supports solid, gradient (4 types: linear/radial/angular/diamond), and pattern (12 types) paints
   - `GradientControls` — type selector, angle control, multi-stop editor
   - `PatternControls` — 12 pattern types, opacity/scale/spacing sliders
   - `StrokeEditor({ strokes, onChange })` — width, align (center/inside/outside), cap, join, dash pattern

5. **`TextStyleEditor.tsx`** (~270 lines)
   - Text content textarea, font family dropdown (12 families), font size, weight (100-900)
   - Text color via ColorPickerPopover
   - Style toggles: italic, underline, strikethrough, uppercase
   - Alignment: left/center/right/justify, vertical: top/middle/bottom
   - Letter spacing slider (-5 to 20), line height slider (0.5 to 3)
   - Overflow mode: clip/ellipsis/expand

6. **`TransformEditor.tsx`** (~210 lines)
   - X/Y position, W/H with lock aspect ratio toggle
   - Rotation with quick preset buttons (0°/90°/180°/270°)
   - Skew X/Y, opacity slider
   - Flip H/V buttons, reset rotation/skew
   - Exports reusable `NumField` component

7. **`EffectsEditor.tsx`** (~280 lines)
   - Stackable non-destructive effects: add/remove/reorder/enable/disable
   - 7 effect types with per-type controls:
     - Drop Shadow (color, blur, offset, spread)
     - Inner Shadow (color, blur, offset, spread)
     - Blur (gaussian/motion, radius, angle)
     - Glow (color, inner toggle, radius, intensity)
     - Outline (color, width)
     - Color Adjust (brightness/contrast/saturation/temperature/hueRotate)
     - Noise (intensity, monochrome)

8. **`AlignDistributeBar.tsx`** (~120 lines)
   - Horizontal toolbar with 6 align buttons (left/center-h/right/top/center-v/bottom)
   - Conditional distribute buttons (horizontal/vertical) for 3+ selections
   - SVG icons for each action
   - Integrated into EditorToolbar (shows when layers selected)

### Modified Files

9. **`LayerPropertiesPanel.tsx`** — REWRITTEN (was 546 lines → ~420 lines)
   - Replaced all basic inline controls with new sub-editors
   - TransformEditor for all layers
   - TextStyleEditor for text layers
   - FillEditor + StrokeEditor for shapes/frames/paths
   - EffectsEditor for all layers
   - ColorPickerPopover replacing native `<input type="color">`
   - New: CornerRadiiEditor (linked/unlinked per-corner radius)
   - New: ImagePropertiesV2 with focal point, filter sliders, fill overlays
   - New: Constraint editor (horizontal + vertical)
   - Collapsible PanelSection for each group

10. **`EditorToolbar.tsx`** — Enhanced
    - Imports and renders AlignDistributeBar when layers are selected
    - Selection count tracked from store

11. **`CanvasEditor.tsx`** — Enhanced with smart snapping
    - Imports snapLayer, drawSnapGuides from snapping.ts
    - snapGuidesRef stores current snap guides
    - During drag: calls snapLayer() to get adjusted position + guides
    - Draws snap guide lines in world space during render
    - Clears guides on mouse up

12. **`ai-patch.ts`** — 15 new AI intent types (was 20 → now 35)
    - `add-effect` / `remove-effect` / `update-effect` — 7 effect types with defaults
    - `set-fill` / `add-gradient-fill` / `add-pattern-fill` — full paint control
    - `set-stroke` / `remove-stroke` — stroke management
    - `set-blend-mode` — any of 16 blend modes
    - `set-corner-radius` — uniform or per-corner
    - `flip` / `rotate` — transform operations
    - `set-font` / `set-text-style` — typography control
    - `set-image-filters` — brightness/contrast/saturation/temperature/blur/grayscale/sepia
    - `reorder-layer` — up/down/top/bottom
    - AI prompt updated with new intent types, effect types, gradient types

13. **Barrel exports updated**
    - `src/lib/editor/index.ts` — added align-distribute + snapping exports
    - `src/components/editor/index.ts` — added all 6 new component exports

2. **`commands.ts`** (~300 lines): Command-based undo/redo with coalescing
   - Command interface: label, category, coalesceKey, execute, undo
   - CommandStack with snapshot-based undo (reliable)
   - Pre-built: move (delta), resize (9-param), update (generic), add, delete, reorder, duplicate, batch

3. **`renderer.ts`** (~500 lines): Full Canvas2D renderer for DesignDocumentV2
   - renderDocumentV2() with RenderOptions (selection, guides, bleed/safe)
   - Type-specific: renderFrame (recursive), renderText, renderShape (6 shapes + per-corner radii), renderImage (filters), renderIcon, renderPath, renderGroup
   - Paint helpers: applyPaint, applyStroke, createCanvasGradient
   - Effects: applyPreEffects (drop shadow), applyPostEffects (placeholder)
   - Selection handles with rotation handle
   - Export: renderToCanvas for off-screen rendering

4. **`hit-test.ts`** (~250 lines): Rotation-aware hit detection
   - hitTestDocument: top-level recursive through frames/groups
   - hitTestHandles: priority check for resize/rotation handles
   - isPointInLayer: rotation-aware local-space point transform
   - SpatialIndex: grid-based (64px cells) with rebuild/query

5. **`interaction.ts`** (~450 lines): Pointer state machine
   - States: idle → down → dragging
   - Actions: move, resize, rotate, draw-shape, marquee, pan
   - screenToWorld/worldToScreen coordinate conversion
   - handlePointerDown/Move/Up with snap-to-grid support
   - handleKeyAction for arrow nudge (1px or 10px with Shift)
   - Cursor management per handle direction

6. **`design-rules.ts`** (~400 lines): Professional design knowledge
   - Color science: WCAG contrast (AA/AA-Large/AAA), readable color, harmony (6 types), clash detection, tint ladder
   - Typography: 8 modular scales, type scale generator, min font sizes, line height ranges, letter spacing
   - Spacing: 8px grid, golden ratio splits, print margins, rule of thirds, safe area
   - Hierarchy: 4 levels with visual weight scoring (0-100)
   - Composition: balance calculation (horizontal/vertical)
   - Print: 8 standard sizes, mm↔px conversion
   - Validation: validateDesign() → RuleViolation[] (contrast, typography, bounds, print, composition)
   - AI ranges: 13 property categories with min/max/step, clampToRange()

7. **`ai-patch.ts`** (~870 lines): AI revision protocol
   - RevisionScope: text-only, colors-only, layout-only, element-specific, full-redesign
   - SCOPE_ALLOWED_PATHS: prefix-based path validation per scope
   - PatchOp: replace, add, remove, reorder, add-layer, remove-layer (RFC 6902 subset)
   - validateAndApplyPatch: scope + lock enforcement, value clamping, post-patch WCAG check
   - 20 intent types: make-bigger/smaller, center, change-color, make-warmer/cooler, fix-contrast, change-font-size, change-opacity, make-bold/lighter, add/remove-shadow, add-spacing, move-to
   - LayerTarget: by IDs, tags, nameContains, layerType, special (all/selected/largest-text/primary-image/background)
   - resolveTarget: deterministic layer resolution
   - intentToPatchOps: deterministic intent → patch compiler (no AI needed)
   - processIntent: full pipeline (resolve → plan → validate → command)
   - parseAIRevisionResponse: JSON extractor from LLM output
   - buildAIPatchPrompt: full layer description + protocol documentation for AI

8. **`index.ts`**: Barrel export for all editor modules

**4 new React components in `src/components/editor/`:**

1. **`CanvasEditor.tsx`** (~490 lines): Universal editor kernel
   - Wraps renderer, hit-test, interaction engine, command stack, viewport
   - ResizeObserver for auto-sizing, auto-fit on first load
   - requestAnimationFrame render loop
   - Grid drawing, marquee overlay, zoom/mode/AI-processing indicators
   - Props: document, onDocumentChange, showGrid, showBleedSafe, readOnly, onSelectionChange, onLayerDoubleClick, renderOverlay, workspaceBg

2. **`EditorToolbar.tsx`**: Mode selector + undo/redo + zoom + view toggles

3. **`LayerPropertiesPanel.tsx`** (~440 lines): Right-side inspector
   - Transform (X/Y/W/H/Rotation/Opacity), text properties (content/font/size/weight/color/style/align)
   - Shape properties (type/fill/stroke/corner-radius), icon properties (iconId/color)
   - Image properties (fit/brightness/contrast/saturation), blend mode, tags

4. **`LayersListPanel.tsx`**: Layer list with visibility/lock toggles

**1 new Zustand store:**

- **`src/stores/editor.ts`** (~290 lines): EditorState store
  - Document + CommandStack management
  - Selection (additive, deselect all)
  - Layer CRUD (add/remove/update/reorder/duplicate)
  - Interaction mode + drag state
  - Viewport (zoom/pan/showGrid/showGuides/snap)
  - AI state (scope, processing flag, patch/intent application)
  - Locked paths (per-layer path locking for AI)
  - Clipboard (copy/paste/cut with offset)

- **`src/stores/index.ts`** updated with editor store exports

### Global Advanced Design Settings — Complete System

#### Architecture: 3 New Files
1. **`src/stores/advanced-settings.ts`** (~270 lines): Zustand store with `persist` middleware
   - 6 settings groups, 40 total settings, all multipliers defaulting to 1.0 (zero regression)
   - Groups: Typography (8), Color/Effects (8), Spacing/Layout (7), Icons/Graphics (7), Borders/Dividers (5), Export/Quality (5)
   - Methods: `update(section, partial)`, `resetSection(section)`, `resetAll()`, `hasCustomSettings()`
   - Persisted in localStorage as `"dmsuite-advanced"`

2. **`src/components/workspaces/AdvancedSettingsPanel.tsx`** (~330 lines): Drop-in shared UI
   - 6 collapsible AccordionSections with per-section Reset buttons
   - ~40 controls (SliderRow, ToggleRow, SelectRow helpers)
   - Props: `sections?` (filter), `standalone?` (card vs inline), `className?`
   - Master "Reset All to Defaults" button, "⚡ Custom settings active" indicator

3. **`src/stores/advanced-helpers.ts`** (~300 lines): Pure-function canvas helpers
   - `getAdvancedSettings()` — synchronous store snapshot reader (safe outside React)
   - `scaledFontSize(base, tier)`, `scaledIconSize()`, `scaledIconGap()`, `scaledElementGap()`
   - `getPatternOpacity(base)`, `getDecorativeOpacity()`, `getDividerOpacity()`
   - `scaledBorderWidth()`, `scaledDividerThickness()`, `scaledCornerOrnament()`
   - `getExportScale()`, `getJpegQuality()`, `getPdfMarginMm()`
   - `applyCanvasSettings(ctx)`, `applyTextRendering(ctx)`

#### BusinessCardWorkspace — Full Global Store Integration
- **Removed** 5 local CardConfig fields (nameFontScale, contactFontScale, patternOpacity, iconSizeScale, contactLineHeight)
- **Replaced** with global store reads via advanced-helpers
- `getFontSizes()` now uses `scaledFontSize(base, "heading"|"body"|"label")`
- `drawContactBlock()` now uses `scaledIconSize()`, `scaledIconGap()`, `scaledElementGap()`
- `renderCard()` now calls `applyCanvasSettings(ctx)` and `getPatternOpacity(0.06)`
- Export handlers use `getExportScale()` instead of hardcoded `2`
- Local Advanced Settings AccordionSection replaced with `<AdvancedSettingsPanel />`
- Canvas re-renders on `advancedSettings` change via `useAdvancedSettingsStore` subscription

#### 61 Canvas Workspaces Integrated
- All canvas/document/print workspaces now have:
  - `import AdvancedSettingsPanel` + `import { useAdvancedSettingsStore }`
  - `const advancedSettings = useAdvancedSettingsStore(s => s.settings)` subscription
  - `<AdvancedSettingsPanel />` rendered in sidebar/leftPanel
  - `advancedSettings` in render dependency arrays (where pattern detection succeeded)
- 32 non-canvas workspaces (text generators, audio, utilities) correctly excluded

#### Accordion Component Enhancement
- `badge` prop type widened from `string | number` to `ReactNode`
- Enables per-section Reset buttons in the AdvancedSettingsPanel

#### Store Barrel Export Updated
- `src/stores/index.ts` now exports `useAdvancedSettingsStore` + all 7 type definitions

## Previous Changes (Session 27a — Alignment Fix + Local Settings, commit 6427c88)

## Previous Changes (Session 26 — AI Icon Placement Pipeline)

### Icon Library Enrichment — All 115 Icons Now AI-Ready

#### 1. Rich Descriptions Added to Every Icon
- Added `description: string` field to `IconMeta` interface
- Every single icon now has a 1-2 sentence natural language description covering:
  - **Visual form**: What the icon actually looks like (e.g., "Paper airplane / send arrow pointing right")
  - **Use cases**: When to use it (e.g., "Use for send buttons, submit actions, email sending")
  - **Industries/contexts**: What domains it serves (e.g., "customer support, business messaging")

#### 2. Tags Expanded from 3-5 → 15 Per Icon
- Every icon now has 15 rich tags covering synonyms, related concepts, industry terms, and natural language phrases
- Example: "phone" went from `["call", "telephone", "dial"]` to `["call", "telephone", "dial", "ring", "mobile", "cell", "contact", "support", "hotline", "customer-service", "number", "receiver", "landline", "voicemail", "business-card"]`

#### 3. AI Icon Placement Pipeline (NEW)
- **`AIIconPlacement` interface**: `{ iconId, x, y, size, color }` — tells the system exactly WHERE to draw an icon
- **`drawIconPlacements(ctx, placements[])`**: Renders an array of AI-specified icon placements onto canvas
- **`matchIconsForContext(userText, maxResults)`**: Semantic matching — scores icons by query word overlap, returns top N
- Both `buildGraphicDesignPrompt()` and `buildRevisionPrompt()` now include `"iconPlacements"` in their JSON response schemas
- AI can now specify: which icons, at what position, what size, what color

#### 4. Enhanced Search & AI Functions
- **`searchIcons(query)`**: Now searches across id, label, tags, AND description (full-text, all-words-must-match)
- **`getIconListForAI()`**: Now includes full descriptions so the AI understands each icon's visual form and use cases
- **`getIconListForAICompact()`**: New compact version (IDs + labels only) for token-constrained prompts

### Previous Session 26 Work (Icon Library Creation)

#### 1. New File: `src/lib/icon-library.ts` (~1,200 lines)
- **115 professional vector icons** drawn with pure Canvas2D path commands (no emoji, no text)
- **8 categories**: Social Media (20), Contact & Communication (15), Business & Professional (20), Creative & Design (15), Technology & Web (15), Nature & Lifestyle (10), Arrows & UI (10), Commerce & Finance (10)
- All icons normalized to a 24×24 design grid, infinitely scalable at any DPI
- Consistent API: `drawIcon(ctx, iconId, x, y, size, color, strokeWidth?)`
- Full metadata registry: `ICON_BANK` array with id, label, category, tags per icon
- O(1) lookup: `ICON_REGISTRY` record keyed by icon id → draw function
- AI-ready helpers: `getIconListForAI()`, `searchIcons(query)`, `getAllIconIds()`, `getIconsByCategory()`
- Browsable: `ICON_CATEGORIES` constant with id, label, description, count
- Zero external dependencies — standalone module

#### 2. BusinessCardWorkspace Integration
- Replaced 4 individual icon imports (drawPhoneIcon, drawEmailIcon, drawGlobeIcon, drawLocationIcon) with single `drawIcon()` from icon library
- `drawContactIcon()` dispatcher now maps to icon library IDs: email→"email", phone→"phone", website→"globe", address→"map-pin"
- Phone icon upgraded from **emoji 📱** to professional vector handset path

#### 3. Graphics Engine Legacy Wrappers
- Old `drawPhoneIcon/drawEmailIcon/drawGlobeIcon/drawLocationIcon` in graphics-engine.ts now delegate to icon library
- Marked as `@deprecated` — new code should import from `@/lib/icon-library` directly

#### 4. AI Engine Icon Awareness
- `buildGraphicDesignPrompt()` in graphics-engine.ts now injects the full icon catalog into AI prompts
- `buildRevisionPrompt()` in ai-revision.ts now includes icon library for AI revision suggestions
- AI can now reference any of 115 icons by ID when designing or revising

### Previous Session (Session 25 — BusinessCardWorkspace Quality Overhaul)

#### 1. Per-Template Default Color Themes (TEMPLATE_DEFAULT_THEMES)
- **Each of 20 templates now has its OWN unique default color scheme**, applied automatically on selection
- Diverse palette variety: ~7 light backgrounds, ~13 dark backgrounds with completely different accents
- Minimal templates: light, airy (white/linen/cream/ice-blue backgrounds)
- Modern templates: dark, vibrant (neon green on black, purple on charcoal, coral on navy)
- Classic templates: rich, traditional (gold on cream, burgundy, navy/blue)
- Creative templates: vivid, playful (magenta/teal/coral accents)
- Luxury templates: opulent (gold on near-black, marble white, deep red)
- Template thumbnails now show each template's OWN colors (not user's current palette)
- Default initial config changed from all-dark to Executive Clean light theme

#### 2. AI Revision Engine — Deep Reasoning + Hard Scope Enforcement
- **Chain-of-thought reasoning prompt**: Requires AI to think step-by-step before answering
- **Hard scope enforcement in code**: `SCOPE_ALLOWED_FIELDS` map strips unauthorized field changes regardless of AI response
- **Diff validation**: Only applies changes where value actually differs from current design
- Prompt explicitly tells AI which fields are allowed per scope and that unauthorized fields are rejected
- 3-step post-processing pipeline: Validate → Scope-enforce → Diff-check

#### 3. High-Resolution Export (600 DPI / 2x Scale)
- Added `scale` parameter to `renderCard()` function (default=1 for display, 2 for export)
- Added `scale` parameter to `renderBatchCard()` function
- All exports now render at 2x resolution:
  - PNG download: 2100×1200px for US Standard (was 1050×600)
  - PDF export: 2x canvas embedded at exact mm dimensions
  - Clipboard copy: 2x resolution
  - Batch PDF: 2x for all cards
- QR overlay uses logical dimensions to prevent double-scaling
- Card info display updated to show "600 DPI" export quality

#### 4. Enhanced Template Visuals
- Executive Clean: warm gradient wash, refined gradient accent bar, secondary accent dot
- Bold Split: richer gradient panel (3-stop), decorative boundary lines, subtle accent circles, tagline support
- Neon Edge: triple-layer glow effect, corner glow, decorative scan lines, logo glow effect

### Previous Session (Session 24 — BusinessCardWorkspace Complete Overhaul)
- Full 2700-line production rewrite with 20 professional templates
- AI Design Director + AI Revision Engine + Batch Processing
- 5 card back styles, 12 color presets, 9 patterns, 5 card sizes
- Logo upload, print-ready export, side-by-side preview
- US Standard (3.5×2"), EU/ISO (85×54mm), Japan (91×55mm), Square, Rounded, Custom (mm input)

#### Additional Features
- 12 color presets (Lime Pro, Navy, Charcoal, Midnight, Gold Rush, Forest, Ocean, White Linen, Burgundy, Slate, Coral, Sage)
- 9 pattern options (dots, lines, diagonal, crosshatch, waves, hexagons, chevrons, diamond)
- Logo upload (file + URL) with fallback initials (circle/square shapes)
- Side-by-side front/back preview
- Contact icons toggle
- QR code placeholder
- Template category filtering (All/Minimal/Modern/Classic/Creative/Luxury)
- TemplateSlider with visual canvas-rendered previews

## Previous Session Changes (Session 23 — Accordion Migration + AI Design Engine v2.0)

### AI Design Engine v2.0 (`src/lib/ai-design-engine.ts`)
Complete rewrite from 708 lines → 1200+ lines with 13 major sections:
1. **Color Science** — HSL conversion, WCAG contrast, accessible palettes, harmony generators (complementary/analogous/triadic/split-complementary/tetradic), color mixing
2. **Typography** — Modular-scale type ramp with configurable ratio, optimal line-height/letter-spacing
3. **Layout & Grid** — Column-based grid system, golden-ratio split, baseline snapping, safe areas
4. **Spacing & Rhythm** — Proportional spacing system (xxs→xxxl + section)
5. **Drawing Helpers** — 10 header styles (gradient/solid/diagonal/split/minimal/wave/angular/radial/duotone/stripe), pro text with underline/strikethrough/ellipsis/shadow, 8 divider styles (solid/gradient/dashed/dots/ornate/double/groove/wave), tables with rowBgFn/highlightLast, badges, cards with accent bars, pull quotes, stat callouts, icon circles, 5 bullet list styles, progress bars
6. **Decorative** — Corner flourishes (4 styles), seals/rosettes, dot patterns, stripe patterns, noise texture overlay
7. **Print Production** — Crop marks, registration marks, CMYK colour bars, slug lines
8. **Stock Images** — Search API, draw with cover-fit, gradient-fade overlays
9. **Watermarks** — Single diagonal + tiled repeating patterns
10. **Export** — 4 presets (72/150/300/600 DPI), high-res re-render
11. **Design-Decision System** — Mood-based suggestions for headers, dividers, fonts, bullets, corners, margins
12. **Visual Hierarchy** — Automatic weight computation for title/subtitle/heading/body/caption/stat
13. **Page Renderers** — Backgrounds with texture, footers with 3 styles, section headings with numbering

### Accordion Migration (7 workspaces migrated)
Replaced old `Set<string>` + local `Section` component pattern with global `Accordion` + `AccordionSection`:
- CertificateDesignerWorkspace ✅
- BusinessCardWorkspace ✅
- BrandIdentityWorkspace ✅ (2 Accordion instances — left/right panels)
- BannerAdWorkspace ✅ (2 Accordion instances — left/right panels)
- MenuDesignerWorkspace ✅ (dynamic label preserved)
- PosterFlyerWorkspace ✅ (inline SVG icon preserved)
- SocialMediaPostWorkspace ✅ (2 Accordion instances — left/right panels)

### Agent-Built Workspace Spot-Check (3/19 checked)
- CoverLetterWorkspace: Good quality ✅
- WhitePaperWorkspace: Very good quality ✅ (Math.random flicker noted)
- MediaKitWorkspace: Very good quality ✅ (Math.random flicker noted)

## Previous Session Changes (Session 22 — Document & Business Tools Mass Build)

### 24 New Workspace Files Created
Built complete, production-ready document/business tool workspaces:

**Directly Created (5 hand-built workspaces):**
1. **DiplomaDesignerWorkspace** — Formal diploma/certificate with ornate borders, seal, signature lines, corner decorations. 6 templates (classic/elegant/modern/university/ornate/executive), gold accent picker, orientation toggle.
2. **StatementOfAccountWorkspace** — Financial statement with transaction table, running balance, debit/credit columns, closing balance callout, payment status indicator. Editable transaction rows.
3. **NewsletterPrintWorkspace** — Multi-page newsletter with masthead, info bar, hero story area, article grid, 2-page support. Stock image integration for hero.
4. **EmployeeHandbookWorkspace** — Multi-page handbook with cover + chapters. Chapter management (add/remove/edit), creative/professional templates, page navigation.
5. **JobDescriptionWorkspace** — Professional JD with responsibilities, requirements, benefits lists (all editable). Employment type badge, info strip, salary display.

**Agent-Built (19 workspaces):**
6. **LookbookWorkspace** — Fashion lookbook with cover + product pages, price/item code, editorial layouts
7. **LineSheetWorkspace** — Wholesale line sheet with 2×2 product grid, wholesale/retail/MOQ pricing
8. **RealEstateListingWorkspace** — Property feature sheet with specs, agent info
9. **EventProgramWorkspace** — Multi-session event program with schedule
10. **TicketDesignerWorkspace** — Event ticket with barcode area, tear-off stub
11. **CoverLetterWorkspace** — Professional cover letter with AI body generation
12. **InvitationDesignerWorkspace** — Event invitations (wedding/corporate/party)
13. **TrainingManualWorkspace** — Multi-page training manual with chapters
14. **UserGuideWorkspace** — Documentation/user guide with TOC, numbered steps
15. **WorksheetDesignerWorkspace** — Printable worksheets/forms with fields
16. **WhitePaperWorkspace** — Professional white paper with sections
17. **CaseStudyWorkspace** — Case study with challenge/solution/results format
18. **MediaKitWorkspace** — Press/media kit with stats, contacts, brand assets
19. **EbookCreatorWorkspace** — eBook with cover + chapters, pull quotes
20. **PortfolioBuilderWorkspace** — Creative portfolio with project showcase
21. **GreetingCardWorkspace** — Cards (birthday/thankyou/holiday)
22. **CalendarDesignerWorkspace** — Already existed, verified
23. **CompanyProfileWorkspace** — Already existed, verified
24. **BusinessPlanWorkspace** — Already existed, verified

### Route Updates
- Added 24 new dynamic imports to `page.tsx` tool workspace router
- All new workspaces properly linked: `id → Component`

### Tool Status Updates
- 24 tools changed from "coming-soon" to "ready" in `tools.ts`

### Bug Fixes
- Renamed `useStockImages.ts` → `useStockImages.tsx` (file contained JSX)
- Fixed `IconDollarSign` → `IconBriefcase` (icon didn't exist)
- Fixed `StockImagePanel` prop usage (removed invalid `stockImages` prop)
- Fixed `generateColorPalette()` object indexing (was using array-style `[1]`)
- Removed unused hook imports across 4 workspaces

### Phase 1 Completed (Foundation Fortification) ✅
- Wave 1.1–1.6: Bug fixes, DRY, performance, PWA, shortcuts, accessibility

### Phase 2 Completed (Existing Tools Rebuild) ✅
- Wave 2.1–2.9: Canvas infrastructure, AI revision engine, all 12 workspace rebuilds

### Phase 3 PARTIAL (New Design & Document Workspaces)
- **Document/Business tools: COMPLETE** — All 38 document tools now have workspaces ("ready")
- Other categories still have ~90 tools with no workspace

### Phase 4 PARTIAL (Video, Audio, Content, Marketing, Web)
- Workspace files exist but many are incomplete shells
- Video/audio workspaces are mostly non-functional

## Session 22 Infrastructure Created

### Global Accordion Component (`src/components/ui/Accordion.tsx`)
- Single-open behavior enforced via React Context
- `Accordion` root + `AccordionSection` children + `useAccordion` hook
- Exported via `src/components/ui/index.ts` barrel

### AI Design Engine (`src/lib/ai-design-engine.ts`) — v2.0
Complete professional design-decision engine. 1200+ lines, 60+ exports.
- **Color Science**: `hexToHsl`, `hslToHex`, `contrastRatio`, `getContrastText`, `ensureContrast`, `generateColorPalette`, `generateHarmony`, `mixColors`
- **Typography**: `getTypographicScale`, `optimalLineHeight`, `optimalLetterSpacing`
- **Layout**: `createLayoutGrid`, `columnX`, `snapToBaseline`, `goldenSplit`
- **Spacing**: `createSpacingSystem` (xxs→xxxl)
- **Drawing**: `drawHeaderArea` (10 styles), `drawProText` (with underline/strikethrough/ellipsis), `drawProDivider` (8 styles), `drawTable`, `drawBadge`, `drawImagePlaceholder`, `drawCard`, `drawPullQuote`, `drawStatCallout`, `drawIconCircle`, `drawBulletList` (5 styles), `drawProgressBar`
- **Decorative**: `drawCornerFlourishes` (4 styles), `drawSeal`, `drawDotPattern`, `drawStripePattern`, `drawNoiseOverlay`
- **Print**: `drawCropMarks`, `drawRegistrationMark`, `drawColorBars`, `drawSlugLine`
- **Stock**: `searchStockImages`, `drawStockImage`, `drawImageWithGradientOverlay`
- **Watermarks**: `drawWatermark`, `drawTiledWatermark`
- **Export**: `EXPORT_PRESETS`, `exportHighRes`
- **Design Decisions**: `suggestHeaderStyle`, `suggestDividerStyle`, `suggestFontStyle`, `suggestBulletStyle`, `suggestCornerStyle`, `suggestMargin`, `computeHierarchy`
- **Page Renderers**: `drawPageBackground`, `drawPageFooter`, `drawSectionHeading`
- **Types**: `DesignBrief`, `DesignMood` (12 moods), `DesignElement`, `DesignComposition`, `HeaderStyle`, `DividerStyle`, `ProTextOpts`, `TableColumn`, `TableOpts`, `CardOpts`, `ExportSettings`
- **NOTE:** `generateColorPalette()` returns an OBJECT with keys: primary, primaryLight, primaryDark, primaryMuted, primarySubtle, primaryVivid, tint50→tint900, textDark, textMedium, textLight, textOnPrimary, white, offWhite, lightGray, mediumGray, borderGray, success, warning, error, info

### Stock Image Hook (`src/hooks/useStockImages.tsx`)
- `useStockImages()` hook: manages search query, results, loading state
- `StockImagePanel` component: self-contained search UI with grid thumbnails
- Props: `{ onSelect: (image: StockImage) => void; className?: string }` — NO `stockImages` prop
- `StockImage` type: `{ id, urls: { thumb, regular, full }, description, ... }`

## Previous Session Changes
- Session 21: MotionGraphics rebuilt (900+ lines), CalendarDesigner rebuilt (700+ lines)
- Session 20: VideoEditor & TextToSpeech rebuilt, full 69-workspace audit
- Session 19: Fake routes removed, LogoReveal & AIVideoGenerator rebuilt

## Workspace Quality Audit Results

### SOLID — Production Quality (~44 workspaces)
Design tools: SocialMediaPost, BannerAd, PosterFlyer, ResumeCV, BusinessCard, Invoice,
Presentation, BrandIdentity, LogoGenerator, EmailTemplate, MenuDesigner, Certificate,
Infographic, Packaging, Sticker, Brochure, Apparel, Letterhead, Envelope,
Catalog, Contract, Coupon, IDCard, MockupGenerator, PriceList, Proposal,
Quotation, Receipt, Report, SalesBookA4, SalesBookA5, Signage, Thumbnail, Wireframe

Utility/content tools: AIChatWorkspace, AnalyticsDashboard, BlogWriter, ColorPalette,
ContentCalendar, EmailCopy, EmailSequence, IconGenerator, ProductDescription,
QRCode, SEOOptimizer, SocialCopy, StockImageBrowser, UIComponent

### NEEDS ENHANCEMENT (~15 workspaces)
These are functional but simulate backend processing:
BackgroundRemover, BatchProcessor, FileConverter, GifMaker, ImageEnhancer,
LandingPage, LeadMagnet, MusicGenerator,
PDFTools, PodcastTools, SalesFunnel, SubtitleGenerator, Transcription,
VideoCompressor, VoiceCloner

### REBUILT THIS SESSION (6 workspaces total, Sessions 19-21)
VideoEditor, TextToSpeech, LogoReveal, AIVideoGenerator, MotionGraphics, CalendarDesigner

## Next Steps (Priority Order)
1. **Roll vNext editor to remaining canvas workspaces** — ~50+ workspaces still use legacy canvas rendering only (no editor toggle)
2. **Pro Features** — Blend modes, masks/clipping, gradients per-layer, text-on-path (infrastructure already in schema)
3. **AI revision via ai-patch for migrated workspaces** — PosterFlyer/BannerAd/SocialMediaPost need `handleEditorRevision()` like BusinessCard
4. **Architecture: Parametric layer system** — Explore combinatorial template builder (layer pools × color themes × layout grids) for infinite unique outputs without 1,000s of static templates
5. **Spot-check remaining agent-built workspaces** — 16 of 19 still unchecked
6. **Fix Math.random() flicker** — WhitePaper + MediaKit
7. **Enhance remaining thin workspaces** — 15 needs-enhancement workspaces
8. **Build missing tools (~90)** — video, audio, content-writing, marketing, web-ui, utilities
9. **Backend integrations** — Real video/audio/PDF processing
10. **Phase 5: Platform Maturity** — Auth, DB, payments, deployment

## Active Decisions
- **Tool-by-tool approach** — No shortcuts, no routing tools to wrong workspaces
- **Quality over speed** — Each tool must have proper functionality
- **DesignDocumentV2 is THE standard** — All new work uses vNext editor, old workspaces migrate incrementally
- **Dual AI modes** — PatchOps for precision, EditIntents for natural language ("make logo bigger")
- **Intent compiler is deterministic** — Common edits need NO AI call (make-bigger, center, change-color)
- **Backward compatible migration** — Old canvas-layers.ts kept; workspaces migrate one at a time
- **4 workspaces now have editor mode** — BusinessCard (M3), PosterFlyer, BannerAd, SocialMediaPost (M5)
- **Stock images** — Must integrate `/api/images` in design workspaces
- **Print-ready exports** — PDFs with crop marks, high-res PNGs, editable SVGs
- **AI generates real content** — Not placeholder text
- **Canvas render pipeline** — vNext: DesignDocumentV2 → Renderer → Canvas2D (replaces old 5-stage)
- **Shared infrastructure** — canvas-utils.ts (legacy), lib/editor/* (vNext)
- **Multi-provider AI** — Claude primary, OpenAI secondary, auto-fallback
- **No database yet** — Supabase planned (Phase 5)
