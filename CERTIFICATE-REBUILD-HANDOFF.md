# Certificate Designer — Complete Rebuild Handoff

> **Purpose:** This document is a complete, self-contained specification for an AI agent to **delete the entire existing certificate tool** and **rebuild it from scratch** as a professional, asset-based SVG template system. Every architectural decision, file path, data structure, integration contract, and implementation detail is specified here.  
>  
> **Key Directive:** The owner (Drake) uploads SVG graphics as templates. The system does NOT generate graphics — it uses SVG files as visual frames and composites editable text content on top. Drake will continue uploading more SVG templates over time, so the system must support easy template expansion.

---

## TABLE OF CONTENTS

1. [Project Context & Platform Overview](#1-project-context--platform-overview)
2. [What to Delete](#2-what-to-delete)
3. [The 8 SVG Template Assets](#3-the-8-svg-template-assets)
4. [Architecture: SVG-Asset-Based Template System](#4-architecture-svg-asset-based-template-system)
5. [File Structure (What to Create)](#5-file-structure-what-to-create)
6. [Zustand Store Schema](#6-zustand-store-schema)
7. [Template Registry & Asset Management](#7-template-registry--asset-management)
8. [Renderer: SVG Frame + Text Overlay](#8-renderer-svg-frame--text-overlay)
9. [Workspace Shell](#9-workspace-shell)
10. [Tab System & Editor Panel](#10-tab-system--editor-panel)
11. [Layers Panel](#11-layers-panel)
12. [Chiko AI Manifest](#12-chiko-ai-manifest)
13. [Store Adapter (Project System)](#13-store-adapter-project-system)
14. [Export / Print System](#14-export--print-system)
15. [Workspace Events & Milestones](#15-workspace-events--milestones)
16. [Responsive & Mobile Rules](#16-responsive--mobile-rules)
17. [Styling & Token Rules](#17-styling--token-rules)
18. [Shared UI Components Reference](#18-shared-ui-components-reference)
19. [Integration Touchpoints (External Files)](#19-integration-touchpoints-external-files)
20. [Validation & Testing Checklist](#20-validation--testing-checklist)
21. [Template Expansion Guide (For Drake)](#21-template-expansion-guide-for-drake)

---

## 1. PROJECT CONTEXT & PLATFORM OVERVIEW

### What is DMSuite?

DMSuite is an AI-powered design & business creative suite — a dark-first, glassmorphic web application where users create professional documents (invoices, contracts, certificates, resumes, etc.) through form-based editors with real-time HTML/CSS previews.

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16+ |
| UI | React | 19 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS v4 (`@theme inline`) | 4.x |
| State | Zustand 5 + Zundo (temporal) + Immer | Latest |
| Animation | Framer Motion | 12+ |
| Icons | Custom inline SVGs in `src/components/icons.tsx` | — |
| Fonts | Google Fonts via `<link>` tags | — |

### Architecture Pattern

The certificate tool uses **Pattern A: Multi-Tab Editor with Preview + Layers** — a 3-panel layout:

```
┌───────────────┬─────────────────────────────────────┬───────────────────┐
│ Editor Panel  │ Preview/Canvas Panel                │ Layers Panel      │
│ (w-80 fixed)  │ (flex-1)                            │ (w-56 / w-8)      │
│               │                                     │                   │
│ WorkspaceHdr  │ Toolbar: zoom, template, export     │ "Layers" header   │
│ EditorTabNav  │ ┌───────────────────────────┐       │ Layer tree        │
│               │ │   SVG Template Frame      │       │  └─ Organization  │
│ Tab Content:  │ │   + Text Overlay          │       │  └─ Title         │
│ • Scrollable  │ │   (zoom-scaled)           │       │  └─ Recipient     │
│ • AccordionSx │ │                           │       │  └─ Signatories   │
│ • Form inputs │ └───────────────────────────┘       │                   │
│               │                                     │ Legend footer     │
│ [Start Over]  │                                     │ [Collapse ▶]      │
├───────────────┴─────────────────────────────────────┴───────────────────┤
│ Mobile BottomBar (lg:hidden): [Edit] [Preview] [Print]                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Platform Contracts

1. **NEVER hardcode hex colors** — use Tailwind tokens (`bg-primary-500`, `text-gray-400`)
2. **NEVER use pixel values** in UI — use Tailwind spacing (`p-5`, `gap-6`)
3. **Tailwind v4 gradient syntax** is `bg-linear-to-br` (NOT `bg-gradient-to-br`)
4. **Dark mode is default** — all surfaces need `dark:` variants
5. **All interactive components** must have `"use client"` directive
6. **All form state** must live in Zustand stores, not component-local `useState`
7. **Import shared UI from** `@/components/workspaces/shared/WorkspaceUIKit`

---

## 2. WHAT TO DELETE

Delete these files entirely. They will all be recreated from scratch.

### Certificate Designer Workspace Files (DELETE ALL)

```
src/components/workspaces/certificate-designer/
├── CertificateDesignerWorkspace.tsx    (349 lines — workspace shell)
├── CertificateRenderer.tsx             (1085 lines — inline HTML/CSS templates)
├── CertificateLayersPanel.tsx          (430 lines — layers panel)
└── tabs/
    ├── CertificateContentTab.tsx       (126 lines)
    ├── CertificateDetailsTab.tsx       (156 lines)
    ├── CertificateStyleTab.tsx         (216 lines)
    └── CertificateFormatTab.tsx        (149 lines)
```

### Zustand Store (DELETE)

```
src/stores/certificate-editor.ts        (412 lines)
```

### Chiko Manifest (DELETE)

```
src/lib/chiko/manifests/certificate.ts  (450+ lines)
```

### Total: 10 files, ~2,373 lines — all to be deleted and rebuilt.

### Files to MODIFY (Not Delete)

These external integration files reference the certificate tool and must be updated to match the new store/API:

| File | What to Update |
|------|---------------|
| `src/lib/store-adapters.ts` | Update `getCertificateAdapter()` function (lines ~221-240) to use the new store's `setForm`/`resetForm` |
| `src/app/tools/[categoryId]/[toolId]/page.tsx` | The dynamic import case for `"certificate-designer"` — should still point to the new workspace component |
| `src/styles/workspace-canvas.css` | Update/verify the `cert-` prefixed highlighting CSS rules |

### Files to LEAVE ALONE

| File | Reason |
|------|--------|
| `src/data/tools.ts` | Certificate tool already registered, just update `devStatus` to `"complete"` when done |
| `src/data/credit-costs.ts` | Certificate credit mapping already exists |
| `TOOL-STATUS.md` | Update status when rebuild is complete |

---

## 3. THE 8 SVG TEMPLATE ASSETS

### Location

All SVG files are in `certificates/` at the project root. PNG previews are in `certificates/png/`.

### Template Inventory

| # | Filename | Dimensions | Style Family | Key Visual Elements |
|---|----------|-----------|--------------|-------------------|
| 1 | `1166971_4650.svg` | 841 × 595 | Warm Formal | Tan/cream/brown palette, path-based borders, minimal gradients, clean formal layout |
| 2 | `2477188_343489-PAOJU9-140.svg` | ~841 × 595 | Decorative Floral | Ornamental corner frames, floral/leaf decorative elements, warm palette |
| 3 | `49574882_8945599.svg` | 841 × 595 | Geometric Ribbon | Wavy ribbon borders, geometric decorative elements, warm palette |
| 4 | `vecteezy_achievement-award-certificate-design-template_5261867.svg` | 4447 × 2260 | Premium Gold | Multiple embossed seal/badge elements, gold/bronze metallic, 200+ gradient color stops, award rosette |
| 5 | `vecteezy_certificate-certificate-of-appreciation-template_14929968.svg` | 3179 × 2500 | Elegant Decorative | Decorative borders, light gray/cream, extensive clipPaths, appreciation-focused |
| 6 | `vecteezy_classic-certificate-template_23018900.svg` | 2500 × 1600 | Classic Oval | Oval/circular decorative border, sepia/brown, radial patterns |
| 7 | `vecteezy_classic-style-certificate-template_22284241.svg` | 2500 × 1600 | Star Badge | Star/seal badge, gold/bronze metallic, 100+ gradient stops |
| 8 | `vecteezy_creative-certificate-template_21835851.svg` | 2500 × 1600 | Modern Clean | Circular decorative elements, minimal/clean white palette, 200+ radial gradient stops |

### SVG Characteristics (All Files)

- **All pure vector** — no embedded raster images
- **Professional grade** — complex gradients, clip paths, pattern definitions
- **Contains text placeholders** — existing text elements that mark where content goes
- **Systematic IDs** — `clip-N`, `linear-pattern-N`, `radial-pattern-N` naming conventions
- **Two style families**: Premium/Formal (gold, brown, metallic gradients) and Modern/Clean (white, light, minimal)
- **Variable dimensions** — must be normalized to standard page sizes for rendering

### Where to Store Templates in the App

Move SVG files to the public directory for web access:

```
public/
└── templates/
    └── certificates/
        ├── warm-formal.svg
        ├── floral-decorative.svg
        ├── geometric-ribbon.svg
        ├── premium-gold.svg
        ├── elegant-appreciation.svg
        ├── classic-oval.svg
        ├── star-badge.svg
        └── modern-clean.svg
```

Rename from the original filenames to descriptive, kebab-case names. Each SVG becomes a template that the renderer loads via `<img>` or inline `<svg>` element.

---

## 4. ARCHITECTURE: SVG-ASSET-BASED TEMPLATE SYSTEM

### Core Concept

The old system hand-coded SVG decorative elements (CornerFlourish, ScrollworkCorner, etc.) and HTML/CSS borders in the renderer — 1,085 lines of fragile inline graphics. The new system uses a fundamentally different approach:

```
┌─────────────────────────────────────────────────────┐
│ SVG Template Frame (full-page background)           │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │        [Organization Name]                      │ │
│ │        ─────────────────                        │ │
│ │        CERTIFICATE OF ACHIEVEMENT               │ │
│ │        This is presented to                     │ │
│ │        ══════════════════════                    │ │
│ │        Recipient Name                           │ │
│ │        ══════════════════════                    │ │
│ │        [description text]                       │ │
│ │                                                 │ │
│ │        Signatory 1      [SEAL]    Signatory 2   │ │
│ │        ____________             ____________    │ │
│ │                                                 │ │
│ │                              Ref: CERT-2026-001 │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ (SVG provides: borders, corners, seals, badges,     │
│  ribbon elements, background patterns, decorations)  │
│                                                     │
│ (Text overlay provides: all editable content,       │
│  positioned via the template's content zone config)  │
└─────────────────────────────────────────────────────┘
```

### How It Works

1. **SVG Frame Layer** — The SVG file is rendered as a full-page background image. It provides all decorative elements: borders, corners, seals, ribbon elements, ornamental patterns, badge graphics. No hand-coded SVG paths in the renderer.

2. **Content Zone Configuration** — Each template defines a "content zone" — the rectangular area within the SVG frame where text content is placed. This is specified as `{ top, left, width, height }` percentages relative to the page dimensions.

3. **Text Overlay Layer** — All editable text (title, subtitle, recipient name, description, signatories, dates, reference) is rendered as positioned HTML elements within the content zone. The text layer sits on top of the SVG frame.

4. **Template Registry** — A TypeScript data file defines all templates with their metadata, content zone coordinates, default colors, and font recommendations. Adding a new template = adding an SVG file + one registry entry.

### Why This Is Better

| Old System | New System |
|-----------|------------|
| 1,085 lines of hand-coded SVG paths | SVG files provide all graphics |
| 8 template cases with inline border logic | Template registry with data-driven zones |
| Adding a template = writing 100+ lines of SVG JSX | Adding a template = 1 SVG file + 1 registry entry |
| Fragile color math (adjustColor, hexToRgba) | SVG has built-in colors; accent tinting is optional |
| Cannot match professional SVG quality | Uses actual professional SVG designs |

---

## 5. FILE STRUCTURE (WHAT TO CREATE)

```
src/
├── components/workspaces/certificate-designer/
│   ├── CertificateDesignerWorkspace.tsx      # Workspace shell (Pattern A 3-panel)
│   ├── CertificateRenderer.tsx               # SVG frame + text overlay renderer
│   ├── CertificateLayersPanel.tsx            # Figma-style layer tree
│   └── tabs/
│       ├── CertificateContentTab.tsx         # Title, subtitle, recipient, description
│       ├── CertificateDetailsTab.tsx         # Signatories, seal toggle, dates
│       ├── CertificateStyleTab.tsx           # Template picker, accent color, fonts
│       └── CertificateFormatTab.tsx          # Page size, orientation, margins
├── stores/
│   └── certificate-editor.ts                 # Zustand store (temporal + persist + immer)
├── lib/
│   └── chiko/manifests/
│       └── certificate.ts                    # Chiko AI action manifest
└── data/
    └── certificate-templates.ts              # Template registry (metadata + content zones)

public/
└── templates/
    └── certificates/
        ├── warm-formal.svg                   # Template 1
        ├── floral-decorative.svg             # Template 2
        ├── geometric-ribbon.svg              # Template 3
        ├── premium-gold.svg                  # Template 4
        ├── elegant-appreciation.svg          # Template 5
        ├── classic-oval.svg                  # Template 6
        ├── star-badge.svg                    # Template 7
        └── modern-clean.svg                  # Template 8
```

Total: 10 new source files + 8 SVG assets in public + 1 data registry file.

---

## 6. ZUSTAND STORE SCHEMA

File: `src/stores/certificate-editor.ts`

### Types

```typescript
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";

// ━━━ Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type CertificateType =
  | "achievement" | "completion" | "appreciation" | "participation"
  | "training" | "recognition" | "award" | "excellence"
  | "honorary" | "membership";

export type CertificateTemplate =
  | "warm-formal" | "floral-decorative" | "geometric-ribbon" | "premium-gold"
  | "elegant-appreciation" | "classic-oval" | "star-badge" | "modern-clean";

export type SealStyle = "gold" | "silver" | "embossed" | "stamp" | "none";
export type PageOrientation = "landscape" | "portrait";

export interface Signatory {
  id: string;
  name: string;
  title: string;
  organization: string;
}

export interface CertificateStyleConfig {
  template: CertificateTemplate;
  accentColor: string;
  fontPairing: string;
  fontScale: number;
  headerStyle: "centered" | "left-aligned";
  textColor: string;        // NEW: override text color per template
}

export interface CertificateFormatConfig {
  pageSize: "a4" | "letter" | "a5";
  orientation: PageOrientation;
  margins: "narrow" | "standard" | "wide";
}

export interface CertificateFormData {
  // Type
  certificateType: CertificateType;

  // Content
  title: string;
  subtitle: string;
  recipientName: string;
  description: string;
  additionalText: string;

  // Organization
  organizationName: string;
  organizationSubtitle: string;

  // Event / Program
  eventName: string;
  courseName: string;

  // Date & Reference
  dateIssued: string;
  validUntil: string;
  referenceNumber: string;

  // Signatories (max 4)
  signatories: Signatory[];

  // Seal
  showSeal: boolean;
  sealText: string;
  sealStyle: SealStyle;

  // Style
  style: CertificateStyleConfig;

  // Format
  format: CertificateFormatConfig;
}
```

### Constants

```typescript
export const CERTIFICATE_TYPES: { id: CertificateType; label: string; defaultTitle: string }[] = [
  { id: "achievement",   label: "Achievement",   defaultTitle: "Certificate of Achievement" },
  { id: "completion",    label: "Completion",     defaultTitle: "Certificate of Completion" },
  { id: "appreciation",  label: "Appreciation",   defaultTitle: "Certificate of Appreciation" },
  { id: "participation", label: "Participation",  defaultTitle: "Certificate of Participation" },
  { id: "training",      label: "Training",       defaultTitle: "Certificate of Training" },
  { id: "recognition",   label: "Recognition",    defaultTitle: "Certificate of Recognition" },
  { id: "award",         label: "Award",          defaultTitle: "Certificate of Award" },
  { id: "excellence",    label: "Excellence",     defaultTitle: "Certificate of Excellence" },
  { id: "honorary",      label: "Honorary",       defaultTitle: "Honorary Certificate" },
  { id: "membership",    label: "Membership",     defaultTitle: "Certificate of Membership" },
];

export const CERTIFICATE_FONT_PAIRINGS: Record<string, { heading: string; body: string; google: string }> = {
  "playfair-lato":          { heading: "Playfair Display", body: "Lato",           google: "Playfair+Display:wght@400;700&family=Lato:wght@300;400;700" },
  "cormorant-montserrat":   { heading: "Cormorant Garamond", body: "Montserrat",   google: "Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;600" },
  "crimson-source":         { heading: "Crimson Text", body: "Source Sans 3",      google: "Crimson+Text:wght@400;600;700&family=Source+Sans+3:wght@300;400;600" },
  "poppins-inter":          { heading: "Poppins", body: "Inter",                   google: "Poppins:wght@400;500;600;700&family=Inter:wght@300;400;500;600" },
  "merriweather-opensans":  { heading: "Merriweather", body: "Open Sans",          google: "Merriweather:wght@400;700&family=Open+Sans:wght@300;400;600" },
  "dm-serif-dm-sans":       { heading: "DM Serif Display", body: "DM Sans",        google: "DM+Serif+Display&family=DM+Sans:wght@300;400;500;700" },
  "oswald-roboto":          { heading: "Oswald", body: "Roboto",                   google: "Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500" },
  "inter-jetbrains":        { heading: "Inter", body: "Inter",                     google: "Inter:wght@300;400;500;600;700" },
};
```

### Default Form Factory

```typescript
export function createDefaultCertificateForm(): CertificateFormData {
  return {
    certificateType: "achievement",
    title: "Certificate of Achievement",
    subtitle: "This certificate is proudly presented to",
    recipientName: "",
    description: "",
    additionalText: "",
    organizationName: "",
    organizationSubtitle: "",
    eventName: "",
    courseName: "",
    dateIssued: "",
    validUntil: "",
    referenceNumber: "",
    signatories: [{ id: crypto.randomUUID(), name: "", title: "", organization: "" }],
    showSeal: true,
    sealText: "OFFICIAL",
    sealStyle: "gold",
    style: {
      template: "premium-gold",
      accentColor: "#b8860b",
      fontPairing: "playfair-lato",
      fontScale: 1,
      headerStyle: "centered",
      textColor: "#1a1a1a",
    },
    format: {
      pageSize: "a4",
      orientation: "landscape",
      margins: "standard",
    },
  };
}
```

### Store Interface & Implementation

```typescript
export interface CertificateEditorState {
  form: CertificateFormData;
  accentColorLocked: boolean;

  // Setters
  setForm: (form: CertificateFormData) => void;
  resetForm: (certType?: CertificateType) => void;
  setAccentColorLocked: (locked: boolean) => void;
  setCertificateType: (type: CertificateType) => void;

  // Content
  updateContent: (patch: Partial<Pick<CertificateFormData, "title" | "subtitle" | "recipientName" | "description" | "additionalText">>) => void;
  updateOrganization: (patch: Partial<Pick<CertificateFormData, "organizationName" | "organizationSubtitle">>) => void;
  updateEvent: (patch: Partial<Pick<CertificateFormData, "eventName" | "courseName">>) => void;
  updateDates: (patch: Partial<Pick<CertificateFormData, "dateIssued" | "validUntil" | "referenceNumber">>) => void;

  // Signatories
  addSignatory: () => string;
  removeSignatory: (id: string) => void;
  updateSignatory: (id: string, patch: Partial<Signatory>) => void;

  // Seal
  updateSeal: (patch: Partial<Pick<CertificateFormData, "showSeal" | "sealText" | "sealStyle">>) => void;

  // Style
  updateStyle: (patch: Partial<CertificateStyleConfig>) => void;
  setTemplate: (template: CertificateTemplate) => void;
  setAccentColor: (color: string) => void;

  // Format
  updateFormat: (patch: Partial<CertificateFormatConfig>) => void;
}
```

### Middleware Stack

```
temporal(persist(immer(...)))
```

- **`temporal`** (outermost) — undo/redo history, 50-state limit, NOT persisted
- **`persist`** (middle) — localStorage key `"dmsuite-certificate"`, partializes `{ form, accentColorLocked }`
- **`immer`** (innermost) — enables draft mutations (`state.form.title = "..."`)

### Template Sync Logic

When calling `setTemplate()`:
- Always update `style.template`
- If `!accentColorLocked`, update `style.accentColor` from the template registry's default accent
- Always update `style.textColor` from the template registry's default text color
- Always update `style.fontPairing` from the template registry's recommended font

When calling `setAccentColor()`:
- Set `style.accentColor` to the new color
- Auto-set `accentColorLocked = true`

### Undo/Redo Hook

```typescript
export function useCertificateUndo() {
  const { undo, redo, pastStates, futureStates } = useCertificateEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
```

---

## 7. TEMPLATE REGISTRY & ASSET MANAGEMENT

File: `src/data/certificate-templates.ts`

This is the heart of the asset-based system. Each template entry maps an SVG file to its rendering configuration.

### Template Registry Type

```typescript
export interface CertificateTemplateConfig {
  id: string;                          // Unique template ID (kebab-case)
  name: string;                        // Display name
  svgPath: string;                     // Path relative to /public (e.g., "/templates/certificates/premium-gold.svg")
  previewPath: string;                 // PNG preview path for template picker
  styleFamily: "formal" | "modern";    // Visual category
  defaultAccent: string;               // Default accent color (hex)
  defaultTextColor: string;            // Default text color for this template
  defaultFontPairing: string;          // Recommended font pairing key
  supportsAccentTint: boolean;         // Whether accent color should tint the frame via CSS filter/mix-blend
  
  // Content zone — the rectangular area within the SVG where text is placed
  // All values are PERCENTAGES of page dimensions (0-100)
  contentZone: {
    top: number;                       // % from top edge
    left: number;                      // % from left edge
    width: number;                     // % of page width
    height: number;                    // % of page height
  };

  // Per-section vertical position hints (% from top of content zone)
  // These guide the flex layout within the content zone
  sectionLayout: {
    organizationY: number;             // Organization name vertical position %
    titleY: number;                    // Certificate title position
    subtitleY: number;                 // "Presented to" text
    recipientY: number;               // Recipient name (the biggest text)
    descriptionY: number;             // Description paragraph
    signatoriesY: number;             // Signature blocks
    dateY: number;                     // Date/reference info
  };

  // Typography overrides specific to this template
  typography: {
    titleScale: number;                // Multiplier for title font size (default 1.0)
    recipientScale: number;            // Multiplier for recipient name size
    titleTransform: "uppercase" | "none";
    recipientStyle: "normal" | "italic";
    letterSpacing: "tight" | "normal" | "wide";
  };

  // Whether the SVG has a built-in seal/badge area
  hasBuiltInSeal: boolean;
  // Whether to render the HTML seal overlay (only if template lacks built-in seal)
  showOverlaySeal: boolean;
}
```

### Template Registry Data

```typescript
export const CERTIFICATE_TEMPLATES: CertificateTemplateConfig[] = [
  {
    id: "warm-formal",
    name: "Warm Formal",
    svgPath: "/templates/certificates/warm-formal.svg",
    previewPath: "/templates/certificates/previews/warm-formal.png",
    styleFamily: "formal",
    defaultAccent: "#8B6914",
    defaultTextColor: "#2C2418",
    defaultFontPairing: "playfair-lato",
    supportsAccentTint: false,
    contentZone: { top: 12, left: 15, width: 70, height: 76 },
    sectionLayout: {
      organizationY: 0,
      titleY: 15,
      subtitleY: 32,
      recipientY: 40,
      descriptionY: 55,
      signatoriesY: 75,
      dateY: 90,
    },
    typography: {
      titleScale: 1.0,
      recipientScale: 1.2,
      titleTransform: "uppercase",
      recipientStyle: "normal",
      letterSpacing: "wide",
    },
    hasBuiltInSeal: false,
    showOverlaySeal: true,
  },
  // ... Define all 8 templates following this pattern
  // Each template's contentZone and sectionLayout values must be
  // calibrated by visually inspecting the SVG and identifying
  // where the text placeholder areas are located.
];
```

### How to Calibrate Content Zones

For each SVG template:

1. **Open the SVG** in a browser at 100% zoom
2. **Identify the text area** — the region where placeholder text exists in the original design
3. **Measure the content zone** as percentages of the total SVG dimensions:
   - `top`: distance from top edge to start of text area, as % of total height
   - `left`: distance from left edge to start of text area, as % of total width
   - `width`: width of text area as % of total width
   - `height`: height of text area as % of total height
4. **Map section positions** within the content zone (0% = top of zone, 100% = bottom of zone)

**Important:** Some templates have asymmetric layouts (e.g., a decorative panel on one side). The content zone should represent only the area where text content belongs.

### Template Helper Functions

```typescript
export function getCertificateTemplate(id: string): CertificateTemplateConfig | undefined {
  return CERTIFICATE_TEMPLATES.find(t => t.id === id);
}

export function getTemplateSvgUrl(id: string): string {
  const tpl = getCertificateTemplate(id);
  return tpl?.svgPath ?? "/templates/certificates/premium-gold.svg";
}

export function getTemplatePreviewUrl(id: string): string {
  const tpl = getCertificateTemplate(id);
  return tpl?.previewPath ?? "";
}
```

---

## 8. RENDERER: SVG FRAME + TEXT OVERLAY

File: `src/components/workspaces/certificate-designer/CertificateRenderer.tsx`

This is the most critical file. The old renderer was 1,085 lines of hand-coded SVG components. The new renderer should be **significantly simpler** — an SVG background image with positioned text elements on top.

### Page Dimensions (Export for Workspace Use)

```typescript
export const PAGE_PX: Record<string, { w: number; h: number }> = {
  "a4":             { w: 1123, h: 794 },   // A4 landscape
  "a4-portrait":    { w: 794,  h: 1123 },  // A4 portrait
  "letter":         { w: 1056, h: 816 },   // Letter landscape
  "letter-portrait":{ w: 816,  h: 1056 },  // Letter portrait
  "a5":             { w: 794,  h: 559 },   // A5 landscape
  "a5-portrait":    { w: 559,  h: 794 },   // A5 portrait
};

export const PAGE_GAP = 16;
```

### Rendering Architecture

```tsx
export default function CertificateRenderer({ data, onPageCount, pageGap = PAGE_GAP }) {
  // 1. Resolve page dimensions
  const pageKey = getPageKey(data.format.pageSize, data.format.orientation);
  const pageDims = PAGE_PX[pageKey] || PAGE_PX.a4;

  // 2. Get template config
  const templateConfig = getCertificateTemplate(data.style.template);
  const svgUrl = getTemplateSvgUrl(data.style.template);

  // 3. Calculate content zone in pixels
  const cz = templateConfig.contentZone;
  const contentBox = {
    top: (cz.top / 100) * pageDims.h,
    left: (cz.left / 100) * pageDims.w,
    width: (cz.width / 100) * pageDims.w,
    height: (cz.height / 100) * pageDims.h,
  };

  // 4. Resolve fonts
  const fontPair = CERTIFICATE_FONT_PAIRINGS[data.style.fontPairing];
  const headingFont = fontPair?.heading || "serif";
  const bodyFont = fontPair?.body || "sans-serif";

  // 5. Calculate font sizes
  const scale = data.style.fontScale * (templateConfig.typography.titleScale || 1);
  // ... size calculations

  // 6. Single-page certificate
  useEffect(() => { onPageCount?.(1); }, [onPageCount]);

  return (
    <>
      {/* Google Fonts */}
      {fontPair && <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${fontPair.google}&display=swap`} />}

      <div className="flex flex-col items-center" style={{ gap: pageGap }}>
        <div
          data-cert-page={1}
          className="shadow-2xl shadow-black/20"
          style={{
            width: pageDims.w,
            height: pageDims.h,
            position: "relative",
            overflow: "hidden",
            background: "#ffffff",
          }}
        >
          {/* ═══ Layer 1: SVG Template Frame (Full-Page Background) ═══ */}
          <img
            src={svgUrl}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              pointerEvents: "none",
              // Optional: accent color tinting via CSS filter
              // filter: templateConfig.supportsAccentTint ? `hue-rotate(${hueShift}deg)` : "none",
            }}
          />

          {/* ═══ Layer 2: Text Content Overlay ═══ */}
          <div
            style={{
              position: "absolute",
              top: contentBox.top,
              left: contentBox.left,
              width: contentBox.width,
              height: contentBox.height,
              display: "flex",
              flexDirection: "column",
              alignItems: data.style.headerStyle === "left-aligned" ? "flex-start" : "center",
              justifyContent: "center",
              textAlign: data.style.headerStyle === "left-aligned" ? "left" : "center",
              gap: 8,
              fontFamily: bodyFont,
            }}
          >
            {/* Organization Name */}
            {data.organizationName && (
              <div data-cert-section="organization">
                <div style={{
                  fontSize: orgSize, fontWeight: 700,
                  color: data.style.accentColor,
                  fontFamily: headingFont,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  {data.organizationName}
                </div>
                {data.organizationSubtitle && (
                  <div style={{ fontSize: subtitleSize * 0.85, color: "#666", fontFamily: bodyFont }}>
                    {data.organizationSubtitle}
                  </div>
                )}
              </div>
            )}

            {/* Certificate Title */}
            <div data-cert-section="title">
              <h1 style={{
                fontSize: titleSize, fontWeight: 700,
                color: data.style.textColor,
                fontFamily: headingFont,
                textTransform: templateConfig.typography.titleTransform,
                letterSpacing: templateConfig.typography.letterSpacing === "wide" ? "0.15em" : "0.05em",
                margin: 0,
              }}>
                {data.title || "Certificate of Achievement"}
              </h1>
            </div>

            {/* Subtitle / Presented To */}
            <div data-cert-section="subtitle">
              <p style={{
                fontSize: subtitleSize, color: "#555555",
                fontFamily: bodyFont, letterSpacing: "0.06em",
                margin: 0,
              }}>
                {data.subtitle || "This certificate is proudly presented to"}
              </p>
            </div>

            {/* Recipient Name */}
            <div data-cert-section="recipient" style={{ margin: "8px 0" }}>
              <div style={{
                fontSize: nameSize, fontWeight: 700,
                color: data.style.accentColor,
                fontFamily: headingFont,
                fontStyle: templateConfig.typography.recipientStyle,
                minWidth: Math.min(contentBox.width * 0.5, 300),
              }}>
                {data.recipientName || "Recipient Name"}
              </div>
              {/* Underline */}
              <div style={{
                borderBottom: `2px solid ${data.style.accentColor}40`,
                width: Math.min(contentBox.width * 0.5, 300),
                margin: data.style.headerStyle === "centered" ? "0 auto" : 0,
              }} />
            </div>

            {/* Description */}
            {data.description && (
              <div data-cert-section="description" style={{ maxWidth: contentBox.width * 0.85 }}>
                <p style={{
                  fontSize: descSize, color: "#444444",
                  fontFamily: bodyFont, lineHeight: 1.6, margin: 0,
                }}>
                  {data.description}
                </p>
              </div>
            )}

            {/* Event / Course */}
            {(data.eventName || data.courseName) && (
              <div data-cert-section="event">
                {data.eventName && <p style={{ fontSize: descSize, fontWeight: 600, color: "#333" }}>{data.eventName}</p>}
                {data.courseName && <p style={{ fontSize: descSize * 0.9, color: "#555" }}>{data.courseName}</p>}
              </div>
            )}

            {/* Additional Text */}
            {data.additionalText && (
              <div data-cert-section="additional">
                <p style={{ fontSize: descSize * 0.9, color: "#666", fontStyle: "italic" }}>{data.additionalText}</p>
              </div>
            )}

            {/* Date */}
            {data.dateIssued && (
              <div data-cert-section="date">
                <p style={{ fontSize: 11, color: "#666" }}>
                  Issued on {formatDate(data.dateIssued)}
                  {data.validUntil && ` · Valid until ${formatDate(data.validUntil)}`}
                </p>
              </div>
            )}

            {/* Signatories Row */}
            <div data-cert-section="signatories" style={{
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              gap: 40, width: "100%", marginTop: 8, flexWrap: "wrap",
            }}>
              {data.signatories.slice(0, Math.ceil(data.signatories.length / 2)).map(sig => (
                <SignatureBlock key={sig.id} {...sig} accent={data.style.accentColor} bodyFont={bodyFont} />
              ))}

              {/* HTML Seal (only if template doesn't have built-in seal) */}
              {data.showSeal && templateConfig.showOverlaySeal && (
                <CertificateSeal
                  text={data.sealText || "OFFICIAL"}
                  style={data.sealStyle}
                  accent={data.style.accentColor}
                  size={75}
                />
              )}

              {data.signatories.slice(Math.ceil(data.signatories.length / 2)).map(sig => (
                <SignatureBlock key={sig.id} {...sig} accent={data.style.accentColor} bodyFont={bodyFont} />
              ))}
            </div>

            {/* Reference Number */}
            {data.referenceNumber && (
              <div data-cert-section="reference" style={{
                position: "absolute", bottom: 8, right: 0,
                fontSize: 8, color: "#999",
              }}>
                Ref: {data.referenceNumber}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
```

### Helper Components to Include

**CertificateSeal** — A pure CSS/HTML seal overlay (for templates without built-in seals):

```tsx
function CertificateSeal({ text, style, accent, size }: {
  text: string; style: SealStyle; accent: string; size: number;
}) {
  // Render a circular seal with text
  // Style variants: gold (radial gold gradient), silver, embossed (inner shadow), stamp (dashed border)
  // Size is diameter in pixels
  // This replaces the old 80-line CertificateSeal component
}
```

**SignatureBlock** — Signature line with name/title/org:

```tsx
function SignatureBlock({ name, title, organization, accent, bodyFont }: { ... }) {
  // Signature line (border-bottom) + name + title + optional org
  // Keep this simple — ~20 lines
}
```

### Important Rendering Notes

1. **SVG as `<img>`** — Use `<img src={svgUrl}>` for the template frame. This is simpler and more reliable than inline `<svg>` for complex SVGs with hundreds of gradient definitions. The SVG renders at the page dimensions via `objectFit: "fill"`.

2. **Print compatibility** — The `<img>` approach also works with the `printHTML()` function because the browser will fetch and render the SVG when printing. Make sure the `src` is an absolute URL (use `window.location.origin + svgUrl` when assembling print HTML).

3. **Content zone positioning** — The content zone is an absolutely-positioned `<div>` within the page. Text elements use flexbox column layout with `justify-content: center` to vertically center content within the zone.

4. **Data attributes** — Every text section gets `data-cert-section="..."` for layer highlighting and click-to-edit.

5. **No hand-coded SVG** — Zero inline `<svg>` elements for decorative purposes. All decoration comes from the template SVG file. The only SVG you might render is the seal overlay (and even that could be pure CSS).

---

## 9. WORKSPACE SHELL

File: `src/components/workspaces/certificate-designer/CertificateDesignerWorkspace.tsx`

### Required Imports

```typescript
import { useCallback, useEffect, useRef, useState } from "react";
import { useCertificateEditor, useCertificateUndo, CERTIFICATE_TYPES, type CertificateType } from "@/stores/certificate-editor";
import { CERTIFICATE_TEMPLATES } from "@/data/certificate-templates";
import { printHTML } from "@/lib/print";
import { dispatchDirty, dispatchProgress } from "@/lib/workspace-events";
import { ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT } from "@/lib/workspace-constants";
import "@/styles/workspace-canvas.css";
import CertificateRenderer, { PAGE_PX, PAGE_GAP } from "./CertificateRenderer";
import CertificateContentTab from "./tabs/CertificateContentTab";
import CertificateDetailsTab from "./tabs/CertificateDetailsTab";
import CertificateStyleTab from "./tabs/CertificateStyleTab";
import CertificateFormatTab from "./tabs/CertificateFormatTab";
import CertificateLayersPanel from "./CertificateLayersPanel";
import { EditorTabNav, BottomBar, WorkspaceHeader, IconButton, ActionButton, ConfirmDialog, Icons, SIcon } from "@/components/workspaces/shared/WorkspaceUIKit";
import WorkspaceErrorBoundary from "@/components/workspaces/shared/WorkspaceErrorBoundary";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createCertificateManifest } from "@/lib/chiko/manifests/certificate";
```

### State Variables

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `activeTab` | `EditorTabKey` | `"content"` | Currently active editor tab |
| `mobileView` | `"editor" \| "preview"` | `"editor"` | Mobile/tablet view mode |
| `zoom` | `number` | `ZOOM_DEFAULT` | Canvas zoom percentage |
| `layersCollapsed` | `boolean` | `false` | Layers panel collapsed state |
| `hoveredSection` | `string \| null` | `null` | Layer section being hovered |
| `showStartOverDialog` | `boolean` | `false` | Confirm dialog visibility |

### Refs

| Ref | Type | Purpose |
|-----|------|---------|
| `printAreaRef` | `HTMLDivElement` | References the cert-print-area div for HTML capture |
| `previewScrollRef` | `HTMLDivElement` | References the preview scroll container |
| `formRef` | `CertificateFormData` | Tracks form changes for dirty detection |
| `chikoOnPrintRef` | `(() => void) \| null` | Stores handlePrint for Chiko to trigger |

### Key Callbacks

**handlePrint():**
1. Get innerHTML from `printAreaRef`
2. Build full HTML document with Google Fonts `<link>`, `@page` CSS for size/orientation
3. Call `printHTML(html)` (from `@/lib/print`)
4. Dispatch `"exported"` milestone

**handleStartOver():**
1. Call `resetForm()`
2. Close dialog
3. Reset `activeTab` to `"content"`

### Tab Definition

```typescript
const EDITOR_TABS = [
  { key: "content",  label: "Content",  icon: <SIcon d="..." /> },
  { key: "details",  label: "Details",  icon: <SIcon d="..." /> },
  { key: "style",    label: "Style",    icon: <SIcon d="..." /> },
  { key: "format",   label: "Format",   icon: <SIcon d="..." /> },
] as const;
```

### Effects

1. **Form dirty tracking** — `useEffect` on `form` calls `dispatchDirty()`
2. **Milestone tracking** — dispatches `"input"` when key fields entered, `"content"` when org set
3. **Layer highlight** — adds/removes `.cert-layer-highlight` class on `[data-cert-section]` elements
4. **Chiko registration** — stores `handlePrint` in ref, calls `useChikoActions()`

### Template Quick-Switch Strip

A horizontal scrollable row of template buttons above the preview canvas. Each button shows the template preview thumbnail and name. Clicking switches the active template.

### Layout Structure

The 3-panel layout follows Pattern A exactly as defined in Section 5 of the TOOL-CREATION-GUIDE (see Section 1 of this document). Follow the guide specification precisely.

---

## 10. TAB SYSTEM & EDITOR PANEL

### Content Tab (`CertificateContentTab.tsx`)

4 accordion sections:

**1. Certificate Type** — `FormSelect` with 10 certificate types from `CERTIFICATE_TYPES`

**2. Content** — Form fields:
- `FormInput` "Certificate Title" → `updateContent({ title })`
- `FormInput` "Subtitle / Presented To" → `updateContent({ subtitle })`
- `FormInput` "Recipient Name" → `updateContent({ recipientName })`
- `FormTextarea` "Description" (3 rows) → `updateContent({ description })`
- `FormTextarea` "Additional Text" (2 rows) → `updateContent({ additionalText })`

**3. Organization** — Form fields:
- `FormInput` "Organization Name" → `updateOrganization({ organizationName })`
- `FormInput` "Organization Subtitle" → `updateOrganization({ organizationSubtitle })`

**4. Event / Program** — Form fields:
- `FormInput` "Event Name" → `updateEvent({ eventName })`
- `FormInput` "Course / Program Name" → `updateEvent({ courseName })`
- Grid (2 cols): `FormInput` "Date Issued" (type date) + `FormInput` "Valid Until" (type date) → `updateDates()`
- `FormInput` "Reference / Serial Number" → `updateDates({ referenceNumber })`

### Details Tab (`CertificateDetailsTab.tsx`)

2 accordion sections:

**1. Signatories** — Dynamic list (min 1, max 4):
- For each signatory: Name, Title/Position, Organization (optional) inputs
- Add button (dashed border) when < 4
- Delete button per signatory when > 1

**2. Seal / Stamp**:
- Checkbox "Show seal on certificate" → `updateSeal({ showSeal })`
- If shown: `FormSelect` seal style (gold/silver/embossed/stamp/none)
- If shown: `FormInput` seal text

### Style Tab (`CertificateStyleTab.tsx`)

3 accordion sections:

**1. Template** — Grid (2 cols) of template cards:
- Each card shows preview thumbnail + template name
- Selected card has `border-primary-500` and checkmark
- Clicking calls `setTemplate()`

**2. Accent Color**:
- Color input (type="color") + hex text input
- Lock/unlock toggle button
- Hint text when locked

**3. Border & Font**:
- `FormSelect` font pairing → `updateStyle({ fontPairing })`
- Font scale options (Compact/Small/Standard/Large/Extra Large) → `updateStyle({ fontScale })`
- Header style (Centered/Left-Aligned) → `updateStyle({ headerStyle })`

### Format Tab (`CertificateFormatTab.tsx`)

4 accordion sections:

**1. Page Size** — Radio buttons: A4 / Letter / A5 with dimensions

**2. Orientation** — Toggle buttons: Landscape / Portrait with preview rectangles

**3. Margins** — Radio buttons: Narrow / Standard / Wide with measurements

**4. Print Tips** — Static bulleted list of professional printing advice

---

## 11. LAYERS PANEL

File: `CertificateLayersPanel.tsx`

### Layer Tree (11 layers)

| Layer ID | Label | Section | Visible When |
|----------|-------|---------|-------------|
| `organization` | Organization name or "Organization" | `organization` | `!!form.organizationName` |
| `title` | Certificate title | `title` | Always |
| `subtitle` | Subtitle text | `subtitle` | `!!form.subtitle` |
| `recipient` | Recipient name | `recipient` | Always |
| `description` | "Description" | `description` | `!!form.description` |
| `event` | Event/course name | `event` | `!!(eventName \|\| courseName)` |
| `additional` | "Additional Text" | `additional` | `!!form.additionalText` |
| `date` | "Issued: {date}" | `date` | `!!form.dateIssued` |
| `signatories` | "Signatories ({count})" | `signatories` | `signatories.length > 0` |
| `seal` | "Seal ({style})" | `seal` | `form.showSeal && sealStyle !== "none"` |
| `reference` | Reference number | `reference` | `!!form.referenceNumber` |

### Section-to-Tab Mapping

```typescript
const SECTION_TO_TAB: Record<string, EditorTabKey> = {
  organization: "content",
  title: "content",
  subtitle: "content",
  recipient: "content",
  description: "content",
  additional: "content",
  event: "content",
  date: "content",
  reference: "content",
  signatories: "details",
  seal: "details",
};
```

### Behaviors

- **Hover** → adds `.cert-layer-highlight` to matching `[data-cert-section]` elements on canvas
- **Click** → navigates to the appropriate editor tab
- **Signatories** has children (one per signatory)
- **Seal** has a visibility toggle (eye icon) → `updateSeal({ showSeal: !showSeal })`
- **Collapsed state** — `w-8` vertical tab. **Expanded state** — `w-56` with full tree
- **Legend footer** — green dot "Visible", gray dot "Hidden"
- **Counter badge** — `{visibleCount}/{totalCount}`

---

## 12. CHIKO AI MANIFEST

File: `src/lib/chiko/manifests/certificate.ts`

### Factory Function

```typescript
export function createCertificateManifest(opts?: {
  onPrintRef?: React.MutableRefObject<(() => void) | null>;
}): ChikoActionManifest
```

### Required Actions (18 total)

| # | Action Name | Category | Description | Destructive |
|---|------------|----------|-------------|-------------|
| 1 | `readCurrentState` | Read | Get all current settings (read-only) | No |
| 2 | `updateContent` | Content | Update title, subtitle, recipientName, description, additionalText | No |
| 3 | `updateOrganization` | Content | Update organizationName, organizationSubtitle | No |
| 4 | `updateEvent` | Content | Update eventName, courseName | No |
| 5 | `updateDates` | Content | Update dateIssued, validUntil, referenceNumber | No |
| 6 | `setCertificateType` | Content | Change certificate type (enum of 10 types) | No |
| 7 | `prefillFromMemory` | Content | Fill org name from business memory | No |
| 8 | `addSignatory` | Details | Add new signatory (max 4) | No |
| 9 | `updateSignatory` | Details | Update signatory by 0-based index | No |
| 10 | `removeSignatory` | Details | Remove signatory by index | Yes |
| 11 | `updateSeal` | Details | Update showSeal, sealText, sealStyle | No |
| 12 | `updateStyle` | Style | Update template, accentColor, fontPairing, fontScale, headerStyle | No |
| 13 | `updateFormat` | Format | Update pageSize, orientation, margins | No |
| 14 | `resetForm` | Reset | Reset all fields to defaults | Yes |
| 15 | `validateBeforeExport` | Validate | Check errors/warnings pre-export | No |
| 16 | `exportDocument` | Export | Trigger print (calls onPrintRef) | No |

Plus 2 auto-added by `withActivityLogging`: `getActivityLog`, `revertToState`.

### State Reader (`getState`)

Must return all form fields, plus:
- `availableTypes` — list of all CertificateType ids
- `availableTemplates` — list of all template ids and names
- `signatoryCount` — number of signatories
- Sanitized signatory array with index, id, name, title, org

### Validation Rules

| Field | Severity | Message |
|-------|----------|---------|
| `recipientName` (empty) | error | "Recipient name is required" |
| `title` (empty) | warning | "Certificate title should be set" |
| `organizationName` (empty) | warning | "Organization name should be set" |
| `dateIssued` (empty) | warning | "Issue date should be set" |

`ready = true` only when there are zero errors.

### Activity Logging Wrap

```typescript
return withActivityLogging(
  baseManifest,
  () => useCertificateEditor.getState().form,
  (snapshot) => useCertificateEditor.getState().setForm(snapshot as CertificateFormData),
);
```

---

## 13. STORE ADAPTER (PROJECT SYSTEM)

Update in `src/lib/store-adapters.ts`:

```typescript
function getCertificateAdapter(): StoreAdapter {
  const { useCertificateEditor } = require("@/stores/certificate-editor");
  return {
    getSnapshot: () => {
      const { form, accentColorLocked } = useCertificateEditor.getState();
      return { form, accentColorLocked };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useCertificateEditor.getState().setForm(data.form as never);
      }
    },
    resetStore: () => {
      useCertificateEditor.getState().resetForm();
      nukePersistStorage("dmsuite-certificate");
    },
    subscribe: (cb) => useCertificateEditor.subscribe(cb),
  };
}
```

The adapter function is already registered in `ADAPTER_FACTORIES` under the key `"certificate"`. Just ensure the new store exports `useCertificateEditor` with the same name.

---

## 14. EXPORT / PRINT SYSTEM

### Print Flow

1. Capture `innerHTML` from the `printAreaRef` div (which wraps the `CertificateRenderer`)
2. Build a complete HTML document:
   - Google Fonts `<link>` tag
   - `@page { size: A4 landscape; margin: 0; }` (or letter/a5, portrait)
   - `body { margin: 0; padding: 0; }` 
   - The captured innerHTML
   - **Critical:** The SVG `<img src>` must use an absolute URL: `${window.location.origin}/templates/certificates/{template}.svg`
3. Call `printHTML(html)` from `@/lib/print`
4. Dispatch `"exported"` milestone

### Print HTML Assembly

```typescript
const handlePrint = useCallback(() => {
  const el = printAreaRef.current;
  if (!el) return;

  const html = el.innerHTML;
  const fontUrl = getGoogleFontUrl(form.style.fontPairing);
  const pageSize = form.format.pageSize === "a4" ? "A4" : form.format.pageSize === "letter" ? "letter" : "A5";
  const orientation = form.format.orientation;

  const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  ${fontUrl ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${fontUrl}&display=swap" />` : ""}
  <style>
    @page { size: ${pageSize} ${orientation}; margin: 0; }
    body { margin: 0; padding: 0; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>${html}</body>
</html>`;

  printHTML(fullHTML);
  dispatchProgress("exported");
}, [form]);
```

---

## 15. WORKSPACE EVENTS & MILESTONES

### Required Events

| Event | When to Dispatch |
|-------|-----------------|
| `dispatchDirty()` | On any form field change |
| `dispatchProgress("input")` | When user enters title, recipient name, or org name |
| `dispatchProgress("content")` | When organization name is set |
| `dispatchProgress("exported")` | After successful print |

### Implementation

```typescript
// Dirty tracking
useEffect(() => {
  dispatchDirty();
}, [form]);

// Milestone tracking 
useEffect(() => {
  if (form.title || form.recipientName) {
    dispatchProgress("input");
  }
  if (form.organizationName) {
    dispatchProgress("content");
  }
}, [form.title, form.recipientName, form.organizationName]);
```

---

## 16. RESPONSIVE & MOBILE RULES

| Breakpoint | Layout |
|-----------|--------|
| Default (mobile) | Single panel, bottom action bar |
| `md` (768px+) | Editor + Preview (no layers) |
| `lg` (1024px+) | Editor + Preview + Layers (3-panel) |
| `xl` (1280px+) | Wider editor (`xl:w-96`) |

### Mobile Bottom Bar

```tsx
<BottomBar
  actions={[
    { key: "editor",  label: "Edit",    icon: Icons.edit },
    { key: "preview", label: "Preview", icon: Icons.preview },
    { key: "export",  label: "Print",   icon: Icons.print, primary: true },
  ]}
  activeKey={mobileView}
  onAction={(key) => {
    if (key === "export") handlePrint();
    else setMobileView(key as "editor" | "preview");
  }}
/>
```

### Panel Visibility

```tsx
{/* Editor — visible on mobile "editor" view OR desktop always */}
<div className={cn("lg:w-80 xl:w-96 ...", mobileView !== "editor" && "hidden lg:flex")}>

{/* Preview — visible on mobile "preview" view OR desktop always */}
<div className={cn("flex-1 ...", mobileView !== "preview" && "hidden lg:flex")}>

{/* Layers — desktop only */}
<div className="hidden lg:flex">
```

---

## 17. STYLING & TOKEN RULES

### Dark Hierarchy

```
body:        bg-gray-950
sidebar:     bg-gray-900
panels:      bg-gray-900/30
inputs:      bg-gray-800/60
borders:     border-gray-800/40 or border-gray-700/60
```

### Form Input Styling

```
Input bg:     bg-gray-800/60
Input border: border-gray-700/60
Focus:        border-primary-500/50 ring-2 ring-primary-500/20
Text:         text-[13px] text-gray-200
Label:        text-[11px] font-medium text-gray-500 mb-1.5
```

### Button Variants

```
Primary:   bg-primary-500 text-gray-950 hover:bg-primary-400
Secondary: bg-gray-800 text-gray-200 border border-gray-700/60
Ghost:     text-gray-400 hover:text-gray-200 hover:bg-white/6
Danger:    bg-error/15 text-error border border-error/20
```

### Selected State (Template Cards, Radio Options)

```
Selected:   border-primary-500 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/30
Unselected: border-gray-700/50 bg-gray-800/30 text-gray-400
```

---

## 18. SHARED UI COMPONENTS REFERENCE

Import from `@/components/workspaces/shared/WorkspaceUIKit`:

| Component | Purpose |
|-----------|---------|
| `FormInput` | Text input with label |
| `FormTextarea` | Multi-line input |
| `FormSelect` | Dropdown select |
| `AccordionSection` | Collapsible section with icon, title, badge |
| `EditorTabNav` | 4-tab navigation with animated indicator |
| `WorkspaceHeader` | Panel header with title, subtitle, action slots |
| `BottomBar` | Mobile action bar |
| `ActionButton` | CTA button (primary/secondary/ghost/danger) |
| `IconButton` | Icon-only button with tooltip |
| `ConfirmDialog` | Destructive action confirmation |
| `SIcon` | Inline SVG path helper |
| `Icons` | Pre-built icons: `.undo`, `.redo`, `.print`, `.zoomIn`, `.zoomOut` |
| `SectionLabel` | Section heading (11px uppercase) |
| `InfoBadge` | Small counter badge |

Import from `@/components/workspaces/shared/WorkspaceErrorBoundary`:

| Component | Purpose |
|-----------|---------|
| `WorkspaceErrorBoundary` | Wraps tab content to catch runtime errors |

---

## 19. INTEGRATION TOUCHPOINTS (EXTERNAL FILES)

These are files the certificate tool connects to but does NOT own. Update them as needed.

### 1. Tool Page Router

**File:** `src/app/tools/[categoryId]/[toolId]/page.tsx`

The certificate tool's dynamic import case should remain:

```typescript
case "certificate-designer":
  return dynamic(() => import("@/components/workspaces/certificate-designer/CertificateDesignerWorkspace"));
```

No change needed unless the workspace component's default export name changes.

### 2. Store Adapter

**File:** `src/lib/store-adapters.ts`

Update the `getCertificateAdapter()` function to match the new store's API. The adapter key `"certificate"` in `ADAPTER_FACTORIES` stays the same.

### 3. Canvas Highlighting CSS

**File:** `src/styles/workspace-canvas.css`

Verify the `cert-` prefixed rules exist. The CSS should have:

```css
.cert-canvas-root [data-cert-section] { ... }
.cert-canvas-root [data-cert-section]:hover { ... }
.cert-canvas-root [data-cert-section].cert-layer-highlight { ... }
```

### 4. Tool Data Registry

**File:** `src/data/tools.ts`

The certificate tool is already registered. When the rebuild is complete, update:

```typescript
devStatus: "complete"
```

### 5. TOOL-STATUS.md

When rebuild is complete, move the certificate tool to the COMPLETE section and add a changelog entry.

### 6. Credit Costs

**File:** `src/data/credit-costs.ts`

Already mapped. No change needed.

---

## 20. VALIDATION & TESTING CHECKLIST

### TypeScript

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] All imports resolve correctly
- [ ] No `any` types, no `@ts-ignore`
- [ ] All store methods are typed

### Visual

- [ ] All 8 SVG templates render correctly at A4 landscape dimensions
- [ ] Text content is positioned within the content zone for all templates
- [ ] Accent color changes are visible (on text elements, underlines, seal)
- [ ] Font pairing switches load correct Google Fonts
- [ ] Font scale slider affects all text elements proportionally
- [ ] Template switching loads the correct SVG background
- [ ] Seal renders correctly when enabled (for templates with `showOverlaySeal: true`)
- [ ] All 4 signatory slots render with proper spacing

### Functional

- [ ] Undo/Redo works (Ctrl+Z / Ctrl+Y)
- [ ] Form persists to localStorage and survives page refresh
- [ ] Template quick-switch strip works
- [ ] Layer hover highlights the correct canvas section
- [ ] Layer click navigates to the correct editor tab
- [ ] Layers panel collapses/expands correctly
- [ ] Print exports a clean document with SVG background
- [ ] Start Over resets all fields and accent color lock
- [ ] Chiko AI can read state, update all fields, trigger export

### Responsive

- [ ] Mobile view: Edit/Preview/Print bottom bar works
- [ ] Tablet: 2-panel layout (no layers)
- [ ] Desktop: 3-panel layout with layers
- [ ] `xl` breakpoint: wider editor panel

### Integration

- [ ] Store adapter saves/restores correctly on project switch
- [ ] `dispatchDirty()` fires on form changes
- [ ] `dispatchProgress()` fires for milestones
- [ ] Chiko manifest registers via `useChikoActions()`
- [ ] `printHTML()` produces correct output with SVG visible

---

## 21. TEMPLATE EXPANSION GUIDE (FOR DRAKE)

When Drake wants to add a new SVG certificate template:

### Step 1: Prepare the SVG File

1. Place the SVG file in `public/templates/certificates/` with a descriptive kebab-case name (e.g., `royal-crest.svg`)
2. Optionally create a PNG preview (500×350px) in `public/templates/certificates/previews/` (for faster template picker loading)

### Step 2: Add to Template Registry

Open `src/data/certificate-templates.ts` and add a new entry to `CERTIFICATE_TEMPLATES`:

```typescript
{
  id: "royal-crest",
  name: "Royal Crest",
  svgPath: "/templates/certificates/royal-crest.svg",
  previewPath: "/templates/certificates/previews/royal-crest.png",
  styleFamily: "formal",
  defaultAccent: "#DAA520",
  defaultTextColor: "#1a1a1a",
  defaultFontPairing: "playfair-lato",
  supportsAccentTint: false,
  contentZone: { top: 15, left: 12, width: 76, height: 70 },
  sectionLayout: {
    organizationY: 0,
    titleY: 15,
    subtitleY: 30,
    recipientY: 40,
    descriptionY: 55,
    signatoriesY: 75,
    dateY: 90,
  },
  typography: {
    titleScale: 1.0,
    recipientScale: 1.2,
    titleTransform: "uppercase",
    recipientStyle: "italic",
    letterSpacing: "wide",
  },
  hasBuiltInSeal: false,
  showOverlaySeal: true,
},
```

### Step 3: Calibrate Content Zone

1. Open the SVG in a browser
2. Identify where text should go (look for text placeholder elements in the original SVG)
3. Measure the content zone as percentages and update `contentZone`
4. Test rendering and adjust until text aligns naturally with the SVG design

### Step 4: Update Template Type (if not using string)

If the store uses a union type for `CertificateTemplate`, add the new template id to the union.

That's it — no code changes needed beyond the registry entry and optional type update.

---

## END OF HANDOFF

This document contains everything an AI agent needs to:

1. **Delete** the 10 existing certificate files (~2,373 lines)
2. **Create** 10 new source files + 1 data registry file
3. **Move** 8 SVG templates to `public/templates/certificates/`
4. **Update** 2-3 external integration files
5. **Produce** a complete, working, asset-based certificate designer

The result will be a dramatically simpler codebase (estimated 60-70% less renderer code), professional SVG-quality visual output, and a template system that Drake can expand by simply uploading new SVG files.
