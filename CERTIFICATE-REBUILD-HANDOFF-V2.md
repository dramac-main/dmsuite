# Certificate Designer — Canvas Editor Rebuild Handoff (V2)

> **Purpose:** Complete, self-contained specification for an AI agent to **delete the existing form-based certificate tool** and **rebuild it as a full canvas-based editor** powered by DMSuite's EditorV2 engine. Every architectural decision, file path, data structure, integration contract, and implementation detail is specified here.
>
> **Key Directive:** This tool must be a **fully editable canvas** — like Adobe Illustrator or Canva — using the production-grade EditorV2 system already in this codebase. Users primarily prompt **Chiko AI** to design certificates, while the canvas provides full manual editing for refinement. The architecture must be **reusable** — this is tool #1 of ~200 tools that will follow this same pattern.
>
> **Reference Implementation:** The Business Card Designer (`BusinessCardWorkspace.tsx` + `StepEditor.tsx`) is the production reference for EditorV2-based tools. The certificate tool follows this exact pattern.

---

## TABLE OF CONTENTS

1. [Platform Context & Vision](#1-platform-context--vision)
2. [Architecture Decision: EditorV2 Canvas](#2-architecture-decision-editorv2-canvas)
3. [What to Delete](#3-what-to-delete)
4. [What to Create](#4-what-to-create)
5. [Certificate Template System](#5-certificate-template-system)
6. [Template → DesignDocumentV2 Adapter](#6-template--designdocumentv2-adapter)
7. [Certificate Store (Zustand)](#7-certificate-store-zustand)
8. [Workspace Component](#8-workspace-component)
9. [Chiko AI Manifest (Canvas-Aware)](#9-chiko-ai-manifest-canvas-aware)
10. [AI Design Generation](#10-ai-design-generation)
11. [Store Adapter (Project System)](#11-store-adapter-project-system)
12. [Export / Print System](#12-export--print-system)
13. [Workspace Events & Milestones](#13-workspace-events--milestones)
14. [Admin Template Management (Future Phase)](#14-admin-template-management-future-phase)
15. [User Asset Upload (Future Phase)](#15-user-asset-upload-future-phase)
16. [Responsive & Mobile Rules](#16-responsive--mobile-rules)
17. [Styling & Token Rules](#17-styling--token-rules)
18. [Integration Touchpoints (External Files)](#18-integration-touchpoints-external-files)
19. [Validation & Testing Checklist](#19-validation--testing-checklist)
20. [Template Expansion Guide (For Drake)](#20-template-expansion-guide-for-drake)

---

## 1. PLATFORM CONTEXT & VISION

### What is DMSuite?

DMSuite is an AI-powered design & business creative suite — a full graphic design platform with **~280+ tools** across 8 categories. It is NOT just a document editor. Think Canva meets Adobe Illustrator, powered by an AI assistant named **Chiko**.

### The User Model

Users are primarily **prompters**. They talk to Chiko AI, which does the actual design work:

1. User opens the Certificate Designer
2. User prompts Chiko: *"Create a gold certificate of achievement for Jane Smith from Drake Academy"*
3. Chiko generates a `DesignDocumentV2` with layers: ornamental border, title text, recipient name, organization, seal, etc.
4. The canvas renders the certificate in real-time
5. User can either prompt Chiko for revisions (*"Make the border more ornate"*) or manually edit layers on the canvas
6. User exports as PDF/PNG

### Canvas-First, Not Form-First

The previous certificate tool (v1) was a **form-based Pattern A** editor — tabbed forms (Content/Details/Style/Format) driving an HTML/CSS renderer. That is now **obsolete**.

The new certificate tool must be a **canvas-based editor** using the existing **EditorV2** engine. This gives:
- Multi-layer selection, dragging, resizing, rotation
- 8-point resize handles with aspect-ratio locking
- Blend modes, effects (shadows, blur, glow, outline)
- Undo/redo with intelligent command coalescing
- AI revision pipeline (patch prompts + intent processing)
- Shape, text, image, icon, path layer types
- Snap guides, grid overlay, viewport zoom/pan
- Full keyboard shortcuts

### Why EditorV2 (Not Canvas-Layers)?

DMSuite has TWO canvas systems. The comparison:

| Feature | Canvas-Layers (System 1) | EditorV2 (System 2) |
|---------|--------------------------|----------------------|
| Complexity | Lightweight | Illustrator-grade |
| Layer Types | 6 basic | 10+ (text, shape, image, icon, path, frame, group, boolean) |
| Effects | Shadow, opacity | 7 stackable effects (shadow, blur, glow, outline, color adjust, noise) |
| Blend Modes | None | 16 modes |
| Selection | Single | Multi + marquee |
| Undo/Redo | Manual history | Command stack with coalescing |
| AI Integration | None | applyAIPatch() + applyAIIntent() |
| Text | Basic | Rich text with runs |
| Vector Paths | No | Yes |
| Used By | Social media, posters | Business cards, resumes, certificates |

**Decision: Use EditorV2.** Certificates are professional documents requiring effects, rich text, AI revision, and precise layout. EditorV2 already has all of this in production.

### Reusability Requirement

This certificate tool is **tool #1** of a pattern that will be replicated for ~200 tools. Every architectural choice must be extractable:
- Template adapter pattern (template → DesignDocumentV2)
- AI generation prompt pattern (tool-specific → structured layers)
- Chiko manifest pattern (canvas-aware actions)
- Workspace layout pattern (toolbar + canvas + panels)
- Export pipeline (canvas → PNG/PDF)

---

## 2. ARCHITECTURE DECISION: EditorV2 CANVAS

### The Stack

```
┌─────────────────────────────────────────────────────────────────┐
│  CertificateDesignerWorkspace.tsx                               │
│  ┌───────────┬──────────────────────────┬────────────────────┐  │
│  │ Left Panel│     CanvasEditor.tsx      │  Right Panel       │  │
│  │ (Quick    │  (EditorV2 rendering)     │  LayersListPanel   │  │
│  │  Edit /   │  ┌──────────────────────┐ │  LayerProperties   │  │
│  │  Template │  │  DesignDocumentV2    │ │  Panel             │  │
│  │  Picker)  │  │  ┌────────────────┐  │ │                    │  │
│  │           │  │  │ Root Frame     │  │ │                    │  │
│  │           │  │  │ ├─ BG Layer    │  │ │                    │  │
│  │           │  │  │ ├─ Border SVG  │  │ │                    │  │
│  │           │  │  │ ├─ Title Text  │  │ │                    │  │
│  │           │  │  │ ├─ Subtitle    │  │ │                    │  │
│  │           │  │  │ ├─ Recipient   │  │ │                    │  │
│  │           │  │  │ ├─ Description │  │ │                    │  │
│  │           │  │  │ ├─ Org Name    │  │ │                    │  │
│  │           │  │  │ ├─ Date        │  │ │                    │  │
│  │           │  │  │ ├─ Signatories │  │ │                    │  │
│  │           │  │  │ ├─ Seal        │  │ │                    │  │
│  │           │  │  │ └─ Decorative  │  │ │                    │  │
│  │           │  │  └────────────────┘  │ │                    │  │
│  │           │  └──────────────────────┘ │                    │  │
│  └───────────┴──────────────────────────┴────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  AI Revision Bar (prompt input + contextual chips)           ││
│  └──────────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  EditorToolbar (modes, undo/redo, zoom, grid, snap, align)   ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Prompt → Chiko AI → DesignDocumentV2 layers → useEditorStore → CanvasEditor renders
                             ↑                              ↓
Template Adapter ────────────┘                   ↓ manual edits
                                          command stack (undo/redo)
                                                 ↓
                                          Export (PNG / PDF)
```

### Key Imports (All Existing, DO NOT Recreate)

```typescript
// Canvas engine
import { CanvasEditor } from "@/components/editor/CanvasEditor";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { LayersListPanel } from "@/components/editor/LayersListPanel";
import { LayerPropertiesPanel } from "@/components/editor/LayerPropertiesPanel";

// Store + commands
import { useEditorStore } from "@/stores/editor";
import { createMoveCommand, createResizeCommand, createUpdateCommand, createAddLayerCommand, createDeleteCommand } from "@/lib/editor/commands";

// Schema + factories
import { createTextLayerV2, createShapeLayerV2, createImageLayerV2, createIconLayerV2, addLayer, removeLayer, updateLayer } from "@/lib/editor/schema";
import type { DesignDocumentV2, LayerV2, TextLayerV2, ShapeLayerV2, ImageLayerV2 } from "@/lib/editor/schema";

// AI revision
import { buildAIPatchPrompt, parseAIRevisionResponse, processIntent } from "@/lib/editor/ai-patch";

// Rendering
import { renderDocumentV2 } from "@/lib/editor/renderer";
import { renderDocumentToPdf } from "@/lib/editor/pdf-renderer";

// Abstract assets
import { AbstractAssetLibrary } from "@/lib/editor/abstract-library";
```

---

## 3. WHAT TO DELETE

Delete these 10 files (the entire old form-based certificate system):

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `src/stores/certificate-editor.ts` | ~412 | Form-based Zustand store |
| 2 | `src/components/workspaces/certificate-designer/CertificateDesignerWorkspace.tsx` | ~349 | Form-based workspace shell |
| 3 | `src/components/workspaces/certificate-designer/CertificateRenderer.tsx` | ~1085 | HTML/CSS renderer with Canvas2D decorations |
| 4 | `src/components/workspaces/certificate-designer/CertificateLayersPanel.tsx` | ~430 | Fake layers panel (non-interactive) |
| 5 | `src/components/workspaces/certificate-designer/tabs/CertificateContentTab.tsx` | ~200 | Content form tab |
| 6 | `src/components/workspaces/certificate-designer/tabs/CertificateDetailsTab.tsx` | ~168 | Details form tab |
| 7 | `src/components/workspaces/certificate-designer/tabs/CertificateStyleTab.tsx` | ~170 | Style form tab |
| 8 | `src/components/workspaces/certificate-designer/tabs/CertificateFormatTab.tsx` | ~108 | Format form tab |
| 9 | `src/lib/chiko/manifests/certificate.ts` | ~470 | Form-field-based Chiko manifest |
| 10 | `src/lib/store-adapters.ts` → `getCertificateAdapter` function | N/A | Remove only the certificate adapter function |

**Total: ~3,392 lines of obsolete code.**

---

## 4. WHAT TO CREATE

| # | File | Purpose |
|---|------|---------|
| 1 | `src/stores/certificate-editor.ts` | New canvas-based store (wraps EditorV2 + certificate metadata) |
| 2 | `src/data/certificate-templates.ts` | Template registry (metadata, defaults, thumbnail, layout hints) |
| 3 | `src/lib/editor/certificate-adapter.ts` | Template → DesignDocumentV2 conversion (like `business-card-adapter.ts`) |
| 4 | `src/lib/editor/certificate-design-generator.ts` | AI prompt builder + response parser for certificate generation |
| 5 | `src/components/workspaces/certificate-designer/CertificateDesignerWorkspace.tsx` | New canvas workspace (like `BusinessCardWorkspace.tsx`) |
| 6 | `src/components/workspaces/certificate-designer/CertificateEditor.tsx` | Canvas editor step with AI revision bar (like `StepEditor.tsx`) |
| 7 | `src/components/workspaces/certificate-designer/CertificateQuickEdit.tsx` | Left panel: quick-edit for certificate fields |
| 8 | `src/components/workspaces/certificate-designer/CertificateTemplatePicker.tsx` | Template gallery/picker panel |
| 9 | `src/lib/chiko/manifests/certificate.ts` | New canvas-aware Chiko manifest |
| 10 | `src/lib/store-adapters.ts` → `getCertificateAdapter` | Updated adapter for project system |

**Directories to keep:** `src/components/workspaces/certificate-designer/` (reuse existing folder, delete old files first).

**Delete** the `tabs/` subdirectory entirely — no more tabbed forms.

---

## 5. CERTIFICATE TEMPLATE SYSTEM

### Template Registry

**File:** `src/data/certificate-templates.ts`

Templates define the visual foundation (border, layout, color scheme) that gets converted to a `DesignDocumentV2` with editable text layers.

```typescript
// src/data/certificate-templates.ts

export interface CertificateTemplate {
  id: string;                       // e.g., "classic-gold"
  name: string;                     // e.g., "Classic Gold"
  category: "formal" | "modern" | "artistic" | "minimal";
  description: string;              // One-line description
  thumbnail: string;                // Path to preview image (PNG)
  
  // Canvas dimensions (pixels at 300 DPI)
  width: number;                    // e.g., 3508 (A4 landscape)
  height: number;                   // e.g., 2480
  
  // Design DNA
  colors: {
    background: string;             // e.g., "#faf6ef"
    primary: string;                // e.g., "#b8860b" (gold)
    secondary: string;              // e.g., "#4a4a4a"
    text: string;                   // e.g., "#1a1a1a"
    accent: string;                 // e.g., "#d4af37"
  };
  
  fontPairing: {
    heading: string;                // e.g., "Playfair Display"
    body: string;                   // e.g., "Lato"
    accent: string;                 // e.g., "Great Vibes" (script)
  };
  
  // Layout hints for the adapter
  layout: {
    borderStyle: "ornate" | "simple" | "double-line" | "corner-only" | "none";
    headerPosition: "top-center" | "top-left";
    sealPosition: "bottom-right" | "bottom-center" | "none";
    signatoryPosition: "bottom-spread" | "bottom-left" | "bottom-center";
    orientation: "landscape" | "portrait";
  };
  
  // SVG asset path (optional — for templates with SVG border decorations)  
  svgBorderPath?: string;           // e.g., "/templates/certificates/classic-gold-border.svg"
  
  // Tags for search/filtering
  tags: string[];
}

export type CertificateType =
  | "achievement" | "completion" | "appreciation" | "participation"
  | "training" | "recognition" | "award" | "excellence"
  | "honorary" | "membership";

export const CERTIFICATE_TYPES: { id: CertificateType; label: string; defaultTitle: string }[] = [
  { id: "achievement", label: "Achievement", defaultTitle: "Certificate of Achievement" },
  { id: "completion", label: "Completion", defaultTitle: "Certificate of Completion" },
  { id: "appreciation", label: "Appreciation", defaultTitle: "Certificate of Appreciation" },
  { id: "participation", label: "Participation", defaultTitle: "Certificate of Participation" },
  { id: "training", label: "Training", defaultTitle: "Certificate of Training" },
  { id: "recognition", label: "Recognition", defaultTitle: "Certificate of Recognition" },
  { id: "award", label: "Award", defaultTitle: "Certificate of Award" },
  { id: "excellence", label: "Excellence", defaultTitle: "Certificate of Excellence" },
  { id: "honorary", label: "Honorary", defaultTitle: "Honorary Certificate" },
  { id: "membership", label: "Membership", defaultTitle: "Certificate of Membership" },
];

// ---------------------------------------------------------------------------
// Template Definitions
// ---------------------------------------------------------------------------
// These 8 templates match the existing SVG assets and provide a strong starting set.
// Drake will add more templates over time — see Section 20 for the expansion guide.
// ---------------------------------------------------------------------------

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: "classic-gold",
    name: "Classic Gold",
    category: "formal",
    description: "Warm gold and parchment with classic ornamental borders",
    thumbnail: "/templates/certificates/thumbs/classic-gold.png",
    width: 3508,   // A4 landscape at 300 DPI
    height: 2480,
    colors: {
      background: "#faf6ef",
      primary: "#b8860b",
      secondary: "#4a4a4a",
      text: "#1a1a1a",
      accent: "#d4af37",
    },
    fontPairing: {
      heading: "Playfair Display",
      body: "Lato",
      accent: "Great Vibes",
    },
    layout: {
      borderStyle: "ornate",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/classic-gold-border.svg",
    tags: ["gold", "formal", "traditional", "warm"],
  },
  {
    id: "classic-blue",
    name: "Classic Blue",
    category: "formal",
    description: "Deep navy blue with refined silver-gray accents",
    thumbnail: "/templates/certificates/thumbs/classic-blue.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#f5f5f5",
      primary: "#35517D",
      secondary: "#6b7280",
      text: "#1a1a1a",
      accent: "#4a6fa5",
    },
    fontPairing: {
      heading: "Playfair Display",
      body: "Lato",
      accent: "Dancing Script",
    },
    layout: {
      borderStyle: "ornate",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/classic-blue-border.svg",
    tags: ["blue", "formal", "corporate", "professional"],
  },
  {
    id: "burgundy-ornate",
    name: "Burgundy Ornate",
    category: "formal",
    description: "Rich burgundy with ornate flourish borders",
    thumbnail: "/templates/certificates/thumbs/burgundy-ornate.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#ffffff",
      primary: "#4C0C1E",
      secondary: "#8b5e3c",
      text: "#1a1a1a",
      accent: "#7a1f3a",
    },
    fontPairing: {
      heading: "Crimson Text",
      body: "Source Sans 3",
      accent: "Parisienne",
    },
    layout: {
      borderStyle: "ornate",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/burgundy-ornate-border.svg",
    tags: ["burgundy", "ornate", "elegant", "formal"],
  },
  {
    id: "teal-modern",
    name: "Teal Modern",
    category: "modern",
    description: "Clean teal with contemporary geometric accents",
    thumbnail: "/templates/certificates/thumbs/teal-modern.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#e8f4f6",
      primary: "#1a7f8f",
      secondary: "#4a4a4a",
      text: "#1a1a1a",
      accent: "#20b2aa",
    },
    fontPairing: {
      heading: "Poppins",
      body: "Inter",
      accent: "Caveat",
    },
    layout: {
      borderStyle: "simple",
      headerPosition: "top-center",
      sealPosition: "bottom-center",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    tags: ["teal", "modern", "clean", "contemporary"],
  },
  {
    id: "silver-minimal",
    name: "Silver Minimal",
    category: "minimal",
    description: "Subtle silver-gray with clean lines",
    thumbnail: "/templates/certificates/thumbs/silver-minimal.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#ffffff",
      primary: "#4a4a4a",
      secondary: "#9ca3af",
      text: "#1a1a1a",
      accent: "#c0c0c0",
    },
    fontPairing: {
      heading: "Cormorant Garamond",
      body: "Montserrat",
      accent: "Satisfy",
    },
    layout: {
      borderStyle: "double-line",
      headerPosition: "top-center",
      sealPosition: "none",
      signatoryPosition: "bottom-center",
      orientation: "landscape",
    },
    tags: ["silver", "minimal", "clean", "simple"],
  },
  {
    id: "antique-parchment",
    name: "Antique Parchment",
    category: "formal",
    description: "Vintage warm parchment with classic typography",
    thumbnail: "/templates/certificates/thumbs/antique-parchment.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#d8cdb8",
      primary: "#3F3F41",
      secondary: "#5D3A1A",
      text: "#2c2c2c",
      accent: "#8b7355",
    },
    fontPairing: {
      heading: "Cormorant Garamond",
      body: "Montserrat",
      accent: "Pinyon Script",
    },
    layout: {
      borderStyle: "ornate",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/antique-parchment-border.svg",
    tags: ["antique", "parchment", "vintage", "warm"],
  },
  {
    id: "botanical-modern",
    name: "Botanical Modern",
    category: "artistic",
    description: "Modern layout with botanical accent illustrations",
    thumbnail: "/templates/certificates/thumbs/botanical-modern.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#ffffff",
      primary: "#1B2650",
      secondary: "#4a7c59",
      text: "#1a1a1a",
      accent: "#6b8e5b",
    },
    fontPairing: {
      heading: "Cormorant Garamond",
      body: "Montserrat",
      accent: "Sacramento",
    },
    layout: {
      borderStyle: "corner-only",
      headerPosition: "top-center",
      sealPosition: "none",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/botanical-modern-corners.svg",
    tags: ["botanical", "artistic", "nature", "modern"],
  },
  {
    id: "dark-prestige",
    name: "Dark Prestige",
    category: "modern",
    description: "Dark background with metallic gold accents for premium feel",
    thumbnail: "/templates/certificates/thumbs/dark-prestige.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#1a1a2e",
      primary: "#d4af37",
      secondary: "#c0c0c0",
      text: "#f0f0f0",
      accent: "#e6c76e",
    },
    fontPairing: {
      heading: "Playfair Display",
      body: "Inter",
      accent: "Alex Brush",
    },
    layout: {
      borderStyle: "simple",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    tags: ["dark", "prestige", "premium", "gold"],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getCertificateTemplate(id: string): CertificateTemplate {
  return CERTIFICATE_TEMPLATES.find((t) => t.id === id) ?? CERTIFICATE_TEMPLATES[0];
}

export function getCertificateTemplatesByCategory(category: string): CertificateTemplate[] {
  return CERTIFICATE_TEMPLATES.filter((t) => t.category === category);
}
```

---

## 6. TEMPLATE → DesignDocumentV2 ADAPTER

### File: `src/lib/editor/certificate-adapter.ts`

This is the critical bridge — it converts a `CertificateTemplate` + user content into a `DesignDocumentV2` with properly positioned, styled layers. This follows the exact same pattern as `business-card-adapter.ts`.

### CertificateConfig Interface

```typescript
export interface CertificateConfig {
  // Template
  templateId: string;
  
  // Content
  certificateType: CertificateType;
  title: string;                    // e.g., "Certificate of Achievement"
  subtitle: string;                 // e.g., "This is proudly presented to"
  recipientName: string;
  description: string;              // Main body text
  additionalText: string;           // Extra text below description
  
  // Organization
  organizationName: string;
  organizationSubtitle: string;
  
  // Event / Program
  eventName: string;
  courseName: string;
  
  // Dates
  dateIssued: string;
  validUntil: string;
  referenceNumber: string;
  
  // Signatories (1-4)
  signatories: Array<{
    name: string;
    title: string;
    organization: string;
  }>;
  
  // Seal
  showSeal: boolean;
  sealText: string;
  sealStyle: "gold" | "silver" | "embossed" | "stamp" | "none";
  
  // Custom logo (optional — user-uploaded)
  logoUrl?: string;
}
```

### Key Conversion Function

```typescript
export function certificateConfigToDocument(
  cfg: CertificateConfig, 
  template: CertificateTemplate
): DesignDocumentV2 {
  const { width: W, height: H } = template;
  
  // 1. Create root frame with background
  // 2. Add SVG border layer (ImageLayerV2 from template.svgBorderPath) or shape border
  // 3. Add title text layer (tagged: "title", "heading")
  // 4. Add subtitle text layer (tagged: "subtitle")
  // 5. Add recipient name layer (tagged: "recipient-name", "primary-text") — large, prominent
  // 6. Add description layer (tagged: "description", "body-text")
  // 7. Add organization layer (tagged: "organization", "heading")
  // 8. Add date layer (tagged: "date", "meta")
  // 9. Add signatory layers (tagged: "signatory-N", "signatory")
  // 10. Add seal shape + text (tagged: "seal")
  // 11. Add decorative elements (tagged: "decorative")
  
  // Returns complete DesignDocumentV2
}
```

### Semantic Layer Tags (CRITICAL for AI)

Every layer MUST have semantic tags so Chiko and the AI revision system can target specific elements:

```typescript
const TAG_MAP = {
  background:    ["background", "bg"],
  border:        ["border", "frame", "decorative"],
  title:         ["title", "heading", "certificate-title"],
  subtitle:      ["subtitle", "subheading"],
  recipientName: ["recipient-name", "primary-text", "name"],
  description:   ["description", "body-text"],
  organization:  ["organization", "org-name", "heading"],
  orgSubtitle:   ["org-subtitle", "subheading"],
  date:          ["date", "meta", "date-issued"],
  reference:     ["reference", "meta", "ref-number"],
  signatory:     ["signatory", "signature"],
  sealShape:     ["seal", "seal-shape", "decorative"],
  sealText:      ["seal", "seal-text"],
  decorative:    ["decorative", "ornament"],
  logo:          ["logo", "branding", "user-uploaded"],
};
```

### Sync Functions (Like Business Card Adapter)

```typescript
// Update only text content, preserve positions/styles
export function syncTextToDocument(
  doc: DesignDocumentV2, 
  cfg: CertificateConfig
): DesignDocumentV2;

// Update only colors, preserve layout
export function syncColorsToDocument(
  doc: DesignDocumentV2, 
  cfg: CertificateConfig, 
  template: CertificateTemplate
): DesignDocumentV2;

// Full regeneration from template
export function regenerateFromTemplate(
  cfg: CertificateConfig, 
  template: CertificateTemplate
): DesignDocumentV2;
```

### Layout Blueprint (Default Layer Positions)

```
A4 Landscape at 300 DPI: 3508 × 2480 px
Safe margin: 150px all sides (≈12.7mm)

┌──────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐ │
│ │  BORDER / FRAME (full bleed or with inset margin)    │ │
│ │                                                      │ │
│ │          [Organization Logo] (optional)               │ │
│ │                                                      │ │
│ │       ═══ CERTIFICATE OF ACHIEVEMENT ═══             │ │
│ │              (title, 72-96px)                         │ │
│ │                                                      │ │
│ │         This is proudly presented to                  │ │
│ │              (subtitle, 24-28px)                      │ │
│ │                                                      │ │
│ │           ★ JANE SMITH ★                              │ │
│ │         (recipient, 48-64px, accent font)             │ │
│ │                                                      │ │
│ │   In recognition of outstanding performance and      │ │
│ │   dedication to excellence in the field of...        │ │
│ │            (description, 20-24px)                     │ │
│ │                                                      │ │
│ │   Date: January 1, 2025        Ref: CERT-2025-001   │ │
│ │              (meta, 16-18px)                          │ │
│ │                                                      │ │
│ │   _______________    _______________                  │ │
│ │   John Director      Sarah Manager     [SEAL]        │ │
│ │   CEO, Drake Academy CTO, Drake Academy              │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 7. CERTIFICATE STORE (Zustand)

### File: `src/stores/certificate-editor.ts`

The store wraps the shared `useEditorStore` with certificate-specific metadata. The canvas document lives in `useEditorStore.doc` — the certificate store holds only the metadata that doesn't live on the canvas.

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { DesignDocumentV2 } from "@/lib/editor/schema";
import type { CertificateType, CertificateTemplate } from "@/data/certificate-templates";

// ---------------------------------------------------------------------------
// Certificate Metadata (stuff NOT on the canvas)
// ---------------------------------------------------------------------------

export interface CertificateMetadata {
  certificateType: CertificateType;
  templateId: string;
  
  // Content fields (mirrored for Chiko state reading + quick-edit sync)
  recipientName: string;
  title: string;
  subtitle: string;
  description: string;
  additionalText: string;
  organizationName: string;
  organizationSubtitle: string;
  eventName: string;
  courseName: string;
  dateIssued: string;
  validUntil: string;
  referenceNumber: string;
  
  // Signatories
  signatories: Array<{
    id: string;
    name: string;
    title: string;
    organization: string;
  }>;
  
  // Seal
  showSeal: boolean;
  sealText: string;
  sealStyle: "gold" | "silver" | "embossed" | "stamp" | "none";
  
  // User-uploaded logo
  logoUrl: string | null;
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface CertificateEditorState {
  // Metadata
  meta: CertificateMetadata;
  
  // Current document snapshot (for project save — actual editing via useEditorStore)
  documentSnapshot: DesignDocumentV2 | null;
  
  // Template selection
  selectedTemplateId: string;
  
  // Generation state
  isGenerating: boolean;
  generationError: string | null;
  
  // Actions
  setMeta: (patch: Partial<CertificateMetadata>) => void;
  setTemplateId: (id: string) => void;
  setDocumentSnapshot: (doc: DesignDocumentV2 | null) => void;
  setCertificateType: (type: CertificateType) => void;
  updateSignatory: (id: string, patch: Partial<CertificateMetadata["signatories"][0]>) => void;
  addSignatory: () => string;
  removeSignatory: (id: string) => void;
  setGenerating: (v: boolean) => void;
  setGenerationError: (err: string | null) => void;
  resetToDefaults: (type?: CertificateType) => void;
}
```

### Persistence Strategy

```typescript
export const useCertificateEditor = create<CertificateEditorState>()(
  persist(
    immer<CertificateEditorState>((set) => ({
      // ... implementation
    })),
    {
      name: "dmsuite-certificate-v2",
      version: 1,
      storage: createJSONStorage(() => sessionStorage), // Like business card wizard
      partialize: (s) => ({
        meta: s.meta,
        selectedTemplateId: s.selectedTemplateId,
        // Do NOT persist documentSnapshot (too large, recreated from template)
      }),
    },
  ),
);
```

### Two-Store Architecture

```
┌────────────────────────────┐     ┌──────────────────────────┐
│  useCertificateEditor      │     │  useEditorStore           │
│  (certificate metadata)    │     │  (canvas state)           │
│                            │     │                           │
│  • certificateType         │     │  • doc: DesignDocumentV2  │
│  • templateId              │◄───►│  • commandStack           │
│  • recipientName           │sync │  • selection              │
│  • signatories[]           │     │  • viewport               │
│  • sealSettings            │     │  • interaction mode       │
│  • isGenerating            │     │  • AI revision state      │
│  • documentSnapshot        │     │  • clipboard              │
└────────────────────────────┘     └──────────────────────────┘
```

### Bidirectional Sync (Following Business Card Pattern)

When the user edits metadata (via quick-edit panel or Chiko), the workspace component:
1. Updates `useCertificateEditor` metadata
2. Calls `syncTextToDocument()` to patch the canvas document
3. Pushes updated doc to `useEditorStore.setDoc()`

When the user edits directly on canvas:
1. `useEditorStore` updates via command stack
2. Workspace detects doc change
3. Extracts text from tagged layers back to `useCertificateEditor` metadata
4. Uses `isSyncingRef` guard to prevent circular loops (exactly like business card)

---

## 8. WORKSPACE COMPONENT

### File: `src/components/workspaces/certificate-designer/CertificateDesignerWorkspace.tsx`

### Flow (Simpler Than Business Card — No Multi-Step Wizard)

Certificates don't need a multi-step wizard like business cards. The flow is:

1. **Initial State:** Template picker shown (grid of 8+ templates)
2. **User picks template OR prompts Chiko:** Document created from template + defaults
3. **Editor State:** Full canvas editor with panels, toolbar, AI revision bar
4. **Export:** PNG/PDF export

```typescript
export default function CertificateDesignerWorkspace() {
  const { meta, selectedTemplateId, documentSnapshot, setDocumentSnapshot } = useCertificateEditor();
  const { doc, setDoc, resetDoc } = useEditorStore();
  const [showTemplatePicker, setShowTemplatePicker] = useState(!documentSnapshot);
  
  // Chiko integration
  const printRef = useRef<(() => void) | null>(null);
  useChikoActions(() => createCertificateManifest({ printRef }));
  
  // On template select: generate document
  const handleTemplateSelect = (templateId: string) => {
    const template = getCertificateTemplate(templateId);
    const doc = certificateConfigToDocument(getConfigFromMeta(meta), template);
    setDoc(doc);
    setDocumentSnapshot(doc);
    setShowTemplatePicker(false);
  };
  
  // ... sync logic, revision bar, export handlers

  if (showTemplatePicker) {
    return <CertificateTemplatePicker onSelect={handleTemplateSelect} />;
  }

  return (
    <div className="flex flex-col h-full">
      <EditorToolbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Quick-edit panel */}
        <CertificateQuickEdit className="hidden lg:block w-72 border-r border-gray-700" />
        
        {/* Center: Canvas */}
        <CanvasEditor
          showGrid={false}
          showBleedSafe={true}
          onRequestAIFocus={() => revisionInputRef.current?.focus()}
        />
        
        {/* Right: Layers + Properties */}
        <div className="hidden lg:flex flex-col w-72 border-l border-gray-700">
          <LayersListPanel />
          <LayerPropertiesPanel />
        </div>
      </div>
      
      {/* Bottom: AI Revision Bar */}
      <CertificateRevisionBar />
    </div>
  );
}
```

### Template Picker Component

**File:** `src/components/workspaces/certificate-designer/CertificateTemplatePicker.tsx`

Shows a grid of template thumbnails. User clicks to select. Also has a "Start blank" option and a Chiko prompt input.

```
┌─────────────────────────────────────────────────────────┐
│  Choose a Certificate Template                          │
│                                                         │
│  [🔍 Search templates...]                               │
│                                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │
│  │Classic│  │Classic│  │Burgun│  │ Teal │               │
│  │ Gold  │  │ Blue  │  │ Ornate│  │Modern│               │
│  └──────┘  └──────┘  └──────┘  └──────┘               │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │
│  │Silver│  │Antique│  │Botan.│  │ Dark │               │
│  │Minimal│  │Parchm│  │Modern│  │Prestige│              │
│  └──────┘  └──────┘  └──────┘  └──────┘               │
│                                                         │
│  ─── OR ───                                             │
│                                                         │
│  [Start Blank Canvas]    [Ask Chiko to Design ✨]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Quick-Edit Panel

**File:** `src/components/workspaces/certificate-designer/CertificateQuickEdit.tsx`

This provides form fields that sync bidirectionally with canvas layers. It's NOT the primary editing method (canvas + Chiko are) — it's a convenience panel for quick edits without selecting layers.

Sections:
- **Template** — Dropdown to change template (regenerates layout, preserves text)
- **Certificate Type** — Dropdown (achievement, completion, etc.)
- **Content** — Title, subtitle, recipient name, description (text inputs)
- **Organization** — Name, subtitle
- **Date & Reference** — Date picker, reference number
- **Signatories** — Add/remove/edit (max 4)
- **Seal** — Toggle, text, style

When any field changes → `syncTextToDocument()` → push to editor store.

---

## 9. CHIKO AI MANIFEST (Canvas-Aware)

### File: `src/lib/chiko/manifests/certificate.ts`

The manifest must expose **canvas-level operations** so Chiko can add, modify, and remove layers. This replaces the old form-field-based manifest entirely.

### Action Categories

```
Content:   updateContent, updateOrganization, updateEvent, updateDates, setCertificateType
Canvas:    addTextLayer, addShapeLayer, addImageLayer, updateLayer, removeLayer, 
           moveLayer, resizeLayer, reorderLayer, duplicateLayer
Style:     changeTemplate, updateColors, updateFonts
Seal:      updateSeal
Format:    setCanvasSize, setOrientation
AI:        generateDesign, reviseDesign
Export:    exportDocument, validateBeforeExport
Read:      readCurrentState
System:    resetAll, prefillFromMemory
```

### Manifest Structure

```typescript
export function createCertificateManifest(options?: CertificateManifestOptions): ChikoActionManifest {
  return {
    toolId: "certificate",
    toolName: "Certificate Designer",
    actions: [
      // ── Content (updates metadata + syncs to canvas) ──
      {
        name: "updateContent",
        description: "Update certificate text: title, subtitle, recipientName, description, additionalText. Updates both metadata and canvas layers.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            recipientName: { type: "string" },
            description: { type: "string" },
            additionalText: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Canvas Layer Operations ──
      {
        name: "addTextLayer",
        description: "Add a new text layer to the canvas.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Text content" },
            x: { type: "number", description: "X position in pixels" },
            y: { type: "number", description: "Y position in pixels" },
            fontSize: { type: "number", description: "Font size in pixels" },
            fontFamily: { type: "string", description: "Font family name" },
            color: { type: "string", description: "Hex color" },
            fontWeight: { type: "number", description: "Font weight (100-900)" },
            tags: { type: "array", items: { type: "string" }, description: "Semantic tags" },
          },
          required: ["text"],
        },
        category: "Canvas",
      },
      {
        name: "addShapeLayer",
        description: "Add a shape (rectangle, circle, line) to the canvas.",
        parameters: {
          type: "object",
          properties: {
            shape: { type: "string", enum: ["rectangle", "ellipse", "line"], description: "Shape type" },
            x: { type: "number" },
            y: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
            fillColor: { type: "string", description: "Hex fill color" },
            strokeColor: { type: "string", description: "Hex stroke color" },
            strokeWidth: { type: "number" },
            cornerRadius: { type: "number" },
          },
          required: ["shape"],
        },
        category: "Canvas",
      },
      {
        name: "updateLayer",
        description: "Update any property of an existing layer by tag or ID.",
        parameters: {
          type: "object",
          properties: {
            layerTag: { type: "string", description: "Semantic tag to find the layer (e.g., 'recipient-name', 'title', 'seal')" },
            layerId: { type: "string", description: "Layer ID (if known)" },
            // Any layer property
            text: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
            fontSize: { type: "number" },
            fontFamily: { type: "string" },
            color: { type: "string" },
            fillColor: { type: "string" },
            opacity: { type: "number" },
            rotation: { type: "number" },
            visible: { type: "boolean" },
            fontWeight: { type: "number" },
          },
        },
        category: "Canvas",
      },
      {
        name: "removeLayer",
        description: "Remove a layer by tag or ID.",
        parameters: {
          type: "object",
          properties: {
            layerTag: { type: "string" },
            layerId: { type: "string" },
          },
        },
        category: "Canvas",
        destructive: true,
      },
      {
        name: "moveLayer",
        description: "Move a layer to a new position.",
        parameters: {
          type: "object",
          properties: {
            layerTag: { type: "string" },
            layerId: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
          },
        },
        category: "Canvas",
      },
      {
        name: "reorderLayer",
        description: "Change layer z-order (bring forward, send back).",
        parameters: {
          type: "object",
          properties: {
            layerTag: { type: "string" },
            layerId: { type: "string" },
            direction: { type: "string", enum: ["up", "down", "top", "bottom"] },
          },
        },
        category: "Canvas",
      },

      // ── Style ──
      {
        name: "changeTemplate",
        description: "Switch to a different certificate template. Preserves text content.",
        parameters: {
          type: "object",
          properties: {
            templateId: { type: "string", description: "Template ID" },
          },
          required: ["templateId"],
        },
        category: "Style",
      },
      {
        name: "updateColors",
        description: "Change the certificate color scheme.",
        parameters: {
          type: "object",
          properties: {
            background: { type: "string" },
            primary: { type: "string" },
            secondary: { type: "string" },
            text: { type: "string" },
            accent: { type: "string" },
          },
        },
        category: "Style",
      },

      // ── AI ──
      {
        name: "generateDesign",
        description: "Generate a complete certificate design using AI. Provide content details and Chiko creates a professional layout.",
        parameters: {
          type: "object",
          properties: {
            recipientName: { type: "string" },
            certificateType: { type: "string", enum: ["achievement", "completion", "appreciation", "participation", "training", "recognition", "award", "excellence", "honorary", "membership"] },
            organizationName: { type: "string" },
            description: { type: "string" },
            style: { type: "string", description: "Style hint: formal, modern, minimal, artistic, dark-premium" },
          },
        },
        category: "AI",
      },
      {
        name: "reviseDesign",
        description: "Revise the current design with a natural-language instruction. E.g., 'Make the title bigger', 'Add a gold border', 'Make it more festive'.",
        parameters: {
          type: "object",
          properties: {
            instruction: { type: "string", description: "Natural-language revision instruction" },
          },
          required: ["instruction"],
        },
        category: "AI",
      },

      // ── Seal ──
      {
        name: "updateSeal",
        description: "Update seal settings.",
        parameters: {
          type: "object",
          properties: {
            showSeal: { type: "boolean" },
            sealText: { type: "string" },
            sealStyle: { type: "string", enum: ["gold", "silver", "embossed", "stamp", "none"] },
          },
        },
        category: "Seal",
      },

      // ── Export ──
      {
        name: "exportDocument",
        description: "Export the certificate as PNG or PDF.",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["png", "pdf", "print"] },
            scale: { type: "number", description: "Resolution multiplier (1, 2, or 3)" },
          },
        },
        category: "Export",
      },

      // ── Read ──
      {
        name: "readCurrentState",
        description: "Read all current certificate settings and canvas state. No changes made.",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },

      // ── System ──
      {
        name: "resetAll",
        description: "Reset certificate to blank state. WARNING: Erases everything.",
        parameters: { type: "object", properties: {} },
        category: "System",
        destructive: true,
      },
      {
        name: "prefillFromMemory",
        description: "Pre-fill organization from saved business profile.",
        parameters: { type: "object", properties: {} },
        category: "System",
      },
    ],

    getState: () => readCertificateState(),
    executeAction: (actionName, params) => executeCertificateAction(actionName, params, options),
  };
}
```

### executeAction Implementation Strategy

For **content actions** (updateContent, updateOrganization, etc.):
1. Update `useCertificateEditor` metadata
2. Call `syncTextToDocument()` to update canvas layers by tag
3. Push updated doc to `useEditorStore.setDoc()`

For **canvas actions** (addTextLayer, updateLayer, removeLayer, moveLayer, etc.):
1. Build a command from `@/lib/editor/commands`
2. `useEditorStore.getState().execute(command)` — goes through command stack
3. Update `useCertificateEditor` metadata from canvas layer tags

For **AI actions** (generateDesign, reviseDesign):
1. Build prompt via `certificate-design-generator.ts`
2. Call `/api/chat/design` API
3. Parse response into `DesignDocumentV2`
4. `useEditorStore.getState().setDoc(newDoc)`

For **template actions** (changeTemplate):
1. Extract current text content from canvas (by tags)
2. Call `certificateConfigToDocument()` with new template + preserved content
3. Push new doc to editor store

### Finding Layers by Tag

```typescript
function findLayerByTag(doc: DesignDocumentV2, tag: string): LayerV2 | undefined {
  return Object.values(doc.layersById).find(
    (layer) => layer.tags?.includes(tag)
  );
}

function findLayersByTag(doc: DesignDocumentV2, tag: string): LayerV2[] {
  return Object.values(doc.layersById).filter(
    (layer) => layer.tags?.includes(tag)
  );
}
```

---

## 10. AI DESIGN GENERATION

### File: `src/lib/editor/certificate-design-generator.ts`

Follows the same pattern as `ai-design-generator.ts` (business cards).

### Generation Input

```typescript
export interface CertificateGenerationInput {
  // Content
  certificateType: CertificateType;
  recipientName: string;
  title: string;
  description: string;
  organizationName: string;
  signatories: Array<{ name: string; title: string }>;
  dateIssued?: string;
  
  // Style hints
  styleHint?: string;           // "formal", "modern", "minimal", "artistic", "dark-premium"
  colorHint?: string;           // e.g., "gold", "blue", "dark with metallic"
  templateId?: string;          // Use specific template as starting point
  
  // Canvas
  width: number;
  height: number;
  
  // Branding (from business memory)
  brandColors?: string[];
  brandFonts?: string[];
  logoUrl?: string;
}
```

### Prompt Building

`buildCertificateGenerationPrompt(input)` returns:

**System Prompt** (~4000 chars):
- Canvas specs (W×H px @ 300 DPI, safe areas)
- Certificate design philosophy (formal, hierarchical typography, balanced layout)
- Available fonts (Playfair Display, Cormorant Garamond, Poppins, Inter, Crimson Text, etc.)
- Element sizing guide:
  - Title: 72-96px (most prominent)
  - Subtitle: 24-28px
  - Recipient name: 48-64px (accent/script font allowed)
  - Description: 20-24px
  - Organization: 28-36px
  - Date/reference: 16-18px
  - Signatory names: 18-22px
- Design techniques (ornamental borders, gold/metallic accents, symmetrical layout, seal/emblem)
- Semantic tag requirements (MUST tag every layer)
- Full JSON schema for `DesignDocumentV2` response

**User Message:**
- Certificate type + title
- Recipient name + description
- Organization details
- Signatory info
- Style/color hints
- Brand colors if available
- Date information

### Response Parsing

```typescript
export function parseCertificateResponse(raw: string): {
  doc: DesignDocumentV2 | null;
  error: string | null;
} {
  // 1. Extract JSON from AI response (may be wrapped in markdown)
  // 2. Validate layer structure
  // 3. Fix common AI mistakes (0-sized text, off-canvas positioning)
  // 4. Ensure all required tags present
  // 5. Return validated document
}
```

### Fallback Generation (No AI)

If the API call fails (no credits, network error), fall back to `certificateConfigToDocument()` with the template adapter. This ensures the user ALWAYS gets a document, even without AI.

---

## 11. STORE ADAPTER (Project System)

### File: `src/lib/store-adapters.ts`

Update the existing `getCertificateAdapter` function to work with the new canvas-based store.

```typescript
export function getCertificateAdapter(): StoreAdapter {
  return {
    readFields: () => {
      const { meta, documentSnapshot } = useCertificateEditor.getState();
      return {
        ...meta,
        documentSnapshot: documentSnapshot ? JSON.stringify(documentSnapshot) : null,
      };
    },
    writeFields: (data) => {
      const store = useCertificateEditor.getState();
      
      // Restore metadata
      const { documentSnapshot: docJson, ...metaFields } = data;
      store.setMeta(metaFields);
      
      // Restore canvas document
      if (docJson) {
        const doc = JSON.parse(docJson) as DesignDocumentV2;
        store.setDocumentSnapshot(doc);
        useEditorStore.getState().setDoc(doc);
      }
    },
    toolId: "certificate",
    toolName: "Certificate Designer",
  };
}
```

---

## 12. EXPORT / PRINT SYSTEM

### Export Formats

| Format | Method | Notes |
|--------|--------|-------|
| **PNG** | `renderDocumentV2()` to canvas → `canvas.toDataURL("image/png")` | Support 1x/2x/3x scale |
| **PDF** | `renderDocumentToPdf()` from `@/lib/editor/pdf-renderer` | Vector PDF when possible, raster fallback |
| **Print** | Browser print dialog via `window.print()` with print stylesheet | Uses hidden canvas render |

### Export Handler Pattern (From Business Card)

```typescript
async function handleExport(format: "png" | "pdf" | "print", scale = 2) {
  const doc = useEditorStore.getState().doc;
  
  if (format === "png") {
    const canvas = document.createElement("canvas");
    canvas.width = doc.rootFrame.width * scale;
    canvas.height = doc.rootFrame.height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);
    renderDocumentV2(ctx, doc, { showSelection: false, showGuides: false, scaleFactor: scale });
    
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob(resolve!, "image/png"));
    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.recipientName || "certificate"}.png`;
    a.click();
  }

  if (format === "pdf") {
    const pdfBytes = await renderDocumentToPdf(doc, { scale });
    // Trigger download
  }

  if (format === "print") {
    window.print();
  }
}
```

---

## 13. WORKSPACE EVENTS & MILESTONES

### Events to Dispatch

Following the existing workspace event contracts:

```typescript
// Dirty state (unsaved changes)
dispatchDirty(true);  // When document changes
dispatchDirty(false); // After save/export

// Progress milestones
dispatchProgress(10);  // Template picker shown
dispatchProgress(40);  // Template selected, document created
dispatchProgress(70);  // Editing in progress
dispatchProgress(90);  // Ready for export
dispatchProgress(100); // Exported successfully
```

### Chiko Registration

```typescript
// In CertificateDesignerWorkspace.tsx
const printRef = useRef<(() => void) | null>(null);
useChikoActions(() => createCertificateManifest({ printRef }));
```

### Activity Logging

The manifest is wrapped with `withActivityLogging()` — exactly like the old version. This enables Chiko's undo/revert for AI actions.

---

## 14. ADMIN TEMPLATE MANAGEMENT (Future Phase)

> **Note:** This system does NOT exist yet. Specifying it here for future implementation.

### Vision

The admin panel should eventually allow:
1. **Upload SVG assets** — Ornamental borders, decorative elements, seals (upload to `/public/templates/certificates/`)
2. **Create templates** — Combine SVG assets + color scheme + fonts → saved as `CertificateTemplate` entries
3. **Preview templates** — Render a sample certificate with test data
4. **Publish to categories** — Make templates available in the Certificate Designer picker
5. **Manage templates** — Enable/disable, reorder, set as featured

### Proposed Admin Route

```
/admin/templates/certificates
```

### Required API Endpoints

```
POST   /api/admin/templates/upload     — Upload SVG asset file
GET    /api/admin/templates/assets     — List uploaded assets
POST   /api/admin/templates/create     — Create new template
PUT    /api/admin/templates/:id        — Update template
DELETE /api/admin/templates/:id        — Delete template
POST   /api/admin/templates/:id/publish — Publish template
```

### Storage

SVG assets stored in Supabase Storage bucket or `/public/templates/certificates/`.
Template metadata stored in Supabase `certificate_templates` table or in `src/data/certificate-templates.ts` (code-level for now).

### FOR NOW: Templates are code-level only

Templates are defined in `src/data/certificate-templates.ts`. Drake adds templates by:
1. Uploading SVG border files to `public/templates/certificates/`
2. Adding a `CertificateTemplate` entry to the registry
3. Rebuilding the app

The admin UI to do this dynamically comes later.

---

## 15. USER ASSET UPLOAD (Future Phase)

> **Note:** This system is partially built via Chiko's file upload. Specifying the extension for certificates.

### Vision

Users should be able to upload:
1. **Organization logos** — Added as `ImageLayerV2` on the canvas
2. **Custom borders/frames** — SVG files added as background layers
3. **Signature images** — Scanned signatures placed at signatory positions
4. **Custom seal/badge images** — Replace procedural seal with uploaded image

### Current Infrastructure

The Chiko upload system (`/api/chiko/upload`) already supports:
- Image extraction (logo, colors, fonts)
- File type detection
- Brand color extraction

### Extension for Certificates

When a user uploads a file to the certificate tool:
1. Chiko receives the file via existing upload flow
2. Chiko determines the file type (logo, border, signature, seal)
3. Chiko creates an appropriate layer:
   - Logo → `ImageLayerV2` at top-center, tagged `["logo", "user-uploaded"]`
   - Border → `ImageLayerV2` at full canvas size, tagged `["border", "user-uploaded"]`, z-ordered behind text
   - Signature → `ImageLayerV2` at signatory position, tagged `["signature", "user-uploaded"]`
   - Seal → `ImageLayerV2` replacing procedural seal, tagged `["seal", "user-uploaded"]`
4. Chiko can also extract brand colors from the upload and offer to apply them

This requires NO new infrastructure — it works through existing Chiko actions (addImageLayer) and upload flow.

---

## 16. RESPONSIVE & MOBILE RULES

### Breakpoints (Matching Business Card Editor)

```
Mobile (< 768px):
  - Template picker: 2 columns
  - Editor: Full-width canvas, panels hidden
  - Floating buttons for layers/properties toggle
  - AI revision bar at bottom

Tablet (768px - 1023px):
  - Template picker: 3 columns
  - Editor: Canvas + collapsible right panel
  - Left quick-edit panel hidden

Desktop (≥ 1024px):
  - Template picker: 4 columns
  - Editor: Left panel + Canvas + Right panel
  - AI revision bar at bottom
  - Full toolbar visible

XL (≥ 1280px):
  - Extra padding and spacing
```

### Mobile Canvas Controls

- Pinch-to-zoom on touch devices
- Two-finger drag to pan
- Tap to select layer
- Long-press for context menu
- Bottom sheet for layer properties (instead of right panel)

---

## 17. STYLING & TOKEN RULES

### MUST Follow DMSuite Design Tokens

```
NEVER use hardcoded hex colors — use Tailwind tokens:
  bg-gray-950, bg-gray-900, bg-gray-800, border-gray-700
  text-gray-100, text-gray-300, text-gray-400
  bg-primary-500, text-primary-400, ring-primary-500
```

### Dark-First Theme

```
Surfaces (dark mode):
  gray-950  — body background
  gray-900  — sidebar / main panels
  gray-800  — cards / elevated surfaces
  gray-700  — borders

Surfaces (light mode):
  gray-50   — body background
  white     — sidebar / cards
  gray-200  — borders
```

### Certificate-Specific Colors

The certificate canvas itself has its own colors (from the template), separate from the DMSuite UI theme. The template colors are rendered ON the canvas only — the workspace chrome uses DMSuite tokens.

---

## 18. INTEGRATION TOUCHPOINTS (External Files)

### Files to Modify (NOT Delete/Recreate)

| # | File | Change |
|---|------|--------|
| 1 | `src/app/tools/[categoryId]/[toolId]/page.tsx` | Dynamic import already exists: `"certificate": dynamic(() => import("@/components/workspaces/certificate-designer/CertificateDesignerWorkspace"))` — **no change needed** |
| 2 | `src/data/tools.ts` | Update `devStatus` to `"scaffold"` during development, then `"complete"` when done |
| 3 | `src/lib/store-adapters.ts` | Replace the `getCertificateAdapter()` function with new canvas-based version |
| 4 | `src/lib/chiko/manifests/index.ts` | Re-export updated certificate manifest (likely already correct) |
| 5 | `TOOL-STATUS.md` | Update certificate entry status |

### Files NOT to Touch

- `src/stores/editor.ts` — Shared store, do not modify
- `src/components/editor/*` — Shared editor components, do not modify
- `src/lib/editor/schema.ts` — Shared schema, do not modify
- `src/lib/editor/commands.ts` — Shared commands, do not modify
- `src/lib/editor/renderer.ts` — Shared renderer, do not modify

---

## 19. VALIDATION & TESTING CHECKLIST

### Phase 1: Infrastructure ✅

- [ ] Old files deleted (10 files)
- [ ] `certificate-templates.ts` created with 8 templates
- [ ] `certificate-adapter.ts` creates valid `DesignDocumentV2` from any template
- [ ] `certificate-editor.ts` store created with metadata + persistence
- [ ] TypeScript compiles with 0 errors

### Phase 2: Canvas Editor ✅

- [ ] Template picker shows 8 templates in grid
- [ ] Selecting template creates document visible on canvas
- [ ] Canvas renders all certificate layers (border, title, recipient, etc.)
- [ ] Layers panel shows correct layer hierarchy
- [ ] Clicking a layer selects it on canvas
- [ ] Selected layer shows 8-point resize handles
- [ ] Drag to move layers works
- [ ] Resize handles work with aspect-ratio locking
- [ ] Undo/Redo works (Ctrl+Z / Ctrl+Shift+Z)
- [ ] Zoom in/out works (scroll wheel, toolbar buttons)
- [ ] Grid toggle works
- [ ] Snap guides appear when dragging near edges

### Phase 3: Quick-Edit Panel ✅

- [ ] Quick-edit shows all certificate fields
- [ ] Changing recipient name updates canvas layer
- [ ] Changing title updates canvas layer
- [ ] Adding/removing signatories updates canvas
- [ ] Template dropdown changes template (preserves text)
- [ ] Canvas edits reflect back to quick-edit fields

### Phase 4: Chiko Integration ✅

- [ ] Chiko manifest registers on workspace mount
- [ ] Chiko can read current state (`readCurrentState`)
- [ ] Chiko `updateContent` updates canvas layers
- [ ] Chiko `addTextLayer` creates visible layer on canvas
- [ ] Chiko `updateLayer` modifies layer by tag
- [ ] Chiko `removeLayer` removes layer from canvas
- [ ] Chiko `changeTemplate` switches template preserving content
- [ ] Chiko `generateDesign` calls AI and creates full document
- [ ] Chiko `reviseDesign` patches current document
- [ ] Chiko `exportDocument` triggers download

### Phase 5: AI Revision ✅

- [ ] AI revision bar visible at bottom
- [ ] Contextual chips appear based on document state
- [ ] Typing instruction + Enter sends to AI
- [ ] AI response applies changes to canvas
- [ ] Revision history shows last 5 attempts
- [ ] Toast feedback (success/error)

### Phase 6: Export ✅

- [ ] PNG export at 1x, 2x, 3x resolutions
- [ ] PDF export creates downloadable PDF
- [ ] Print triggers browser print dialog
- [ ] Exported PNG matches canvas appearance
- [ ] Export validation warns about empty fields

### Phase 7: Project System ✅

- [ ] Saving project stores certificate data
- [ ] Loading project restores certificate + canvas
- [ ] Dirty state dispatches correctly
- [ ] Progress milestones dispatch correctly

### Phase 8: Responsive ✅

- [ ] Mobile: Template picker 2 columns, canvas full-width
- [ ] Tablet: Canvas + collapsible right panel
- [ ] Desktop: 3-panel layout
- [ ] Touch: Pinch-to-zoom, two-finger pan

---

## 20. TEMPLATE EXPANSION GUIDE (For Drake)

### Adding a New Certificate Template

**Step 1: Prepare Assets**

If the template has an SVG border/frame:
1. Create or acquire the SVG file
2. Ensure it's clean (no embedded fonts, no external references)
3. Set the viewBox to match the canvas dimensions (e.g., `viewBox="0 0 3508 2480"`)
4. Save to `public/templates/certificates/your-template-border.svg`

If the template has a preview thumbnail:
1. Create a 600×424 PNG preview showing a sample certificate with the template
2. Save to `public/templates/certificates/thumbs/your-template.png`

**Step 2: Add Template Definition**

Open `src/data/certificate-templates.ts` and add to the `CERTIFICATE_TEMPLATES` array:

```typescript
{
  id: "your-template",
  name: "Your Template Name",
  category: "formal",  // or "modern", "artistic", "minimal"
  description: "One-line description of the visual style",
  thumbnail: "/templates/certificates/thumbs/your-template.png",
  width: 3508,
  height: 2480,
  colors: {
    background: "#ffffff",
    primary: "#your-primary-hex",
    secondary: "#your-secondary-hex",
    text: "#1a1a1a",
    accent: "#your-accent-hex",
  },
  fontPairing: {
    heading: "Font Name",       // Must be a Google Font
    body: "Font Name",
    accent: "Script Font Name",
  },
  layout: {
    borderStyle: "ornate",
    headerPosition: "top-center",
    sealPosition: "bottom-right",
    signatoryPosition: "bottom-spread",
    orientation: "landscape",
  },
  svgBorderPath: "/templates/certificates/your-template-border.svg",
  tags: ["your", "relevant", "tags"],
},
```

**Step 3: Add Layout Function (Optional)**

If the template has a unique layout that's different from the default, add a custom layout function in `certificate-adapter.ts`:

```typescript
function layoutYourTemplate(W: number, H: number, cfg: CertificateConfig, colors: TemplateColors): LayerV2[] {
  // Return array of layers with custom positions
}

// Register in LAYOUT_MAP
LAYOUT_MAP["your-template"] = layoutYourTemplate;
```

If the template follows the default layout pattern (centered title, centered recipient, spread signatories), no custom layout function is needed — the default adapter handles it.

**Step 4: Rebuild & Test**

```bash
npm run build
# Navigate to Certificate Designer, see new template in picker
# Select it, verify all text layers are correctly positioned
# Test with Chiko (prompt to fill in content)
# Test export (PNG + PDF)
```

### Template Asset Guidelines

| Aspect | Guideline |
|--------|-----------|
| Format | SVG (borders), PNG (thumbnails) |
| Border SVG Dimensions | Match canvas: 3508×2480 (A4 landscape) or custom |
| Thumbnail Size | 600×424 PNG |
| Colors | Use named colors or hex — no CSS variables |
| Fonts | Must be available as Google Fonts |
| Content Zones | Leave center 60-70% for text content |
| File Naming | kebab-case: `royal-crest-border.svg` |

---

## APPENDIX: REFERENCE FILES

These existing files are the production reference. Study them when implementing:

### Canvas Engine (DO NOT MODIFY)
- `src/stores/editor.ts` — EditorV2 Zustand store
- `src/lib/editor/schema.ts` — DesignDocumentV2 types + layer factories
- `src/lib/editor/commands.ts` — Command stack + factory functions
- `src/lib/editor/renderer.ts` — Canvas2D rendering
- `src/lib/editor/interaction.ts` — Pointer state machine
- `src/lib/editor/hit-test.ts` — Spatial queries
- `src/lib/editor/snapping.ts` — Snap guides
- `src/lib/editor/ai-patch.ts` — AI revision pipeline
- `src/lib/editor/pdf-renderer.ts` — PDF export

### Editor Components (DO NOT MODIFY)
- `src/components/editor/CanvasEditor.tsx` — Universal canvas component
- `src/components/editor/EditorToolbar.tsx` — Toolbar
- `src/components/editor/LayersListPanel.tsx` — Layer tree
- `src/components/editor/LayerPropertiesPanel.tsx` — Property inspector
- `src/components/editor/TextStyleEditor.tsx` — Text properties
- `src/components/editor/FillStrokeEditor.tsx` — Color/gradient
- `src/components/editor/EffectsEditor.tsx` — Effects pipeline

### Business Card (REFERENCE PATTERN)
- `src/components/workspaces/BusinessCardWorkspace.tsx` — Main workspace
- `src/components/workspaces/business-card/StepEditor.tsx` — Canvas editor step
- `src/stores/business-card-wizard.ts` — Wizard store
- `src/lib/editor/business-card-adapter.ts` — Template → DesignDocumentV2
- `src/lib/editor/ai-design-generator.ts` — AI generation
- `src/lib/chiko/manifests/business-card.ts` — Chiko manifest

### Chiko System
- `src/stores/chiko-actions.ts` — Action registry
- `src/hooks/useChikoActions.ts` — Registration hook
- `src/stores/activity-log.ts` — Activity logging + withActivityLogging
- `src/stores/business-memory.ts` — Business profile

---

## APPENDIX: KEY ARCHITECTURAL DECISIONS LOG

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canvas system | EditorV2 | Illustrator-grade features needed for professional certificates |
| Store pattern | Metadata store + shared editor store | Mirrors business card pattern; separates certificate-specific data from canvas state |
| Template storage | Code-level (`src/data/`) | Simplest for now; admin UI comes later |
| AI generation | Prompt → DesignDocumentV2 JSON | Same pattern as business card; proven in production |
| Fallback generation | Template adapter | Always works without AI; uses `certificateConfigToDocument()` |
| Workspace flow | Template picker → editor (no wizard) | Certificates are simpler than business cards; don't need multi-step |
| Quick-edit panel | Bidirectional sync with canvas | Convenience for common edits; canvas is primary interface |
| Chiko manifest | Canvas-aware actions | Replaces form-field actions with layer operations |
| Export | Canvas → PNG/PDF | Uses existing `renderDocumentV2` + `renderDocumentToPdf` |
| Persistence | `sessionStorage` | Like business card wizard; documents too large for `localStorage` |
| Sync guards | `isSyncingRef` pattern | Prevents circular update loops (proven in business card) |
