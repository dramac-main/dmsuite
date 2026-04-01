# DMSuite Resume Builder V2 — Complete Rebuild Plan
## Inspired by Reactive Resume (rxresu.me) — MIT Licensed, 36k+ Stars

> **Goal:** Replace the current Resume & CV Builder with a battle-tested, feature-complete
> resume editor modeled after Reactive Resume's proven UI/UX. Every feature fully working
> end-to-end. DMSuite branding. Full Chiko AI integration.

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Data Schema (Complete)](#2-data-schema)
3. [Zustand Store](#3-zustand-store)
4. [UI Components Breakdown](#4-ui-components)
5. [Template System (13 Templates)](#5-template-system)
6. [Export System](#6-export-system)
7. [Chiko AI Integration (40+ Actions)](#7-chiko-ai-integration)
8. [File Inventory (Delete & Create)](#8-file-inventory)
9. [Implementation Order](#9-implementation-order)

---

## 1. Architecture Overview

### Layout: Reactive Resume's Split-Pane Pattern
```
┌─────────────────────────────────────────────────────────────────────┐
│  Header: Undo/Redo │ Design │ Export │ Share │ Settings             │
├──────────────────────┬──────────────────────────────────────────────┤
│  LEFT PANEL (35%)    │  RIGHT PANEL (65%) — Live Preview           │
│                      │                                              │
│  ┌─ Basics ─────┐   │  ┌──────────────────────────────────────┐   │
│  │ Name, Email   │   │  │                                      │   │
│  │ Phone, Photo  │   │  │         A4 Resume Page(s)            │   │
│  └──────────────┘   │  │         - Real-time render            │   │
│  ┌─ Summary ────┐   │  │         - Multi-page support          │   │
│  │ Rich text     │   │  │         - Zoom/pan controls           │   │
│  └──────────────┘   │  │                                      │   │
│  ┌─ Profiles ───┐   │  │                                      │   │
│  │ GitHub, etc.  │   │  └──────────────────────────────────────┘   │
│  └──────────────┘   │                                              │
│  ┌─ Experience ─┐   │  Zoom: [−] 75% [+]  │  Page 1 of 2         │
│  │ Drag-drop    │   │                                              │
│  │ items        │   │                                              │
│  └──────────────┘   │                                              │
│  ... more sections   │                                              │
│                      │                                              │
│  [+ Add Section]     │                                              │
├──────────────────────┴──────────────────────────────────────────────┤
│  Mobile: [Edit] [Preview] [Design] [Export] bottom tabs            │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow
```
User Input (Form)
  ↓
Zustand Store (resume-editor.ts) — temporal + immer + persist
  ↓
Live Preview (TemplateRenderer)  — Real-time, no debounce
  ↓
Export: PDF (html2canvas+jsPDF) / DOCX / TXT / JSON / Print
```

---

## 2. Data Schema

### Full ResumeData Type (Aligned with Reactive Resume)
```typescript
interface ResumeData {
  // Personal info
  basics: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    website: { url: string; label: string };
    customFields: CustomField[];  // icon + text + link
  };

  // Profile photo
  picture: {
    url: string;        // base64 or URL
    size: number;       // 32-512 pt
    aspectRatio: number; // 0.5-2.5
    borderRadius: number; // 0-100 pt
    borderColor: string;  // rgba
    borderWidth: number;
    hidden: boolean;
  };

  // Summary section
  summary: {
    title: string;
    content: string;    // HTML-formatted
    columns: number;
    hidden: boolean;
  };

  // 12 built-in sections
  sections: {
    profiles:       Section<ProfileItem>;
    experience:     Section<ExperienceItem>;
    education:      Section<EducationItem>;
    projects:       Section<ProjectItem>;
    skills:         Section<SkillItem>;
    languages:      Section<LanguageItem>;
    interests:      Section<InterestItem>;
    awards:         Section<AwardItem>;
    certifications: Section<CertificationItem>;
    publications:   Section<PublicationItem>;
    volunteer:      Section<VolunteerItem>;
    references:     Section<ReferenceItem>;
  };

  // Unlimited custom sections
  customSections: CustomSection[];

  // Design metadata
  metadata: {
    template: TemplateId;
    layout: {
      sidebarWidth: number;  // 10-50%
      pages: PageLayout[];   // per-page main/sidebar arrays
    };
    css: { enabled: boolean; value: string };
    page: {
      format: "a4" | "letter";
      marginX: number;
      marginY: number;
      gapX: number;
      gapY: number;
      locale: string;
      hideIcons: boolean;
    };
    design: {
      colors: { primary: string; text: string; background: string };
      level: { type: LevelType; icon: string };
    };
    typography: {
      body:    TypographyConfig;
      heading: TypographyConfig;
    };
    notes: string;  // private notes, not rendered
  };
}
```

### Section / Item Types
Each section has: `title`, `columns`, `hidden`, `items[]`.
Each item has: `id`, `hidden`, `options?`.

| Section | Item Fields |
|---------|------------|
| Profiles | icon, network, username, website |
| Experience | company, position, location, period, website, description (HTML), roles[] |
| Education | school, degree, area, grade, location, period, website, description |
| Projects | name, period, website, description |
| Skills | icon, name, proficiency, level (0-5), keywords[] |
| Languages | language, fluency, level (0-5) |
| Interests | icon, name, keywords[] |
| Awards | title, awarder, date, website, description |
| Certifications | title, issuer, date, website, description |
| Publications | title, publisher, date, website, description |
| Volunteer | organization, location, period, website, description |
| References | name, position, phone, website, description |

### Custom Sections
Can hold ANY item type above. Has `id`, `type` (section type), and renders using the matching section renderer.

---

## 3. Zustand Store

**File:** `src/stores/resume-editor.ts`

Features:
- `temporal(immer(persist(...)))` pattern (already in place)
- Undo/redo via zundo
- Persist to localStorage
- All section CRUD operations
- Layout mutation (move section between main/sidebar)
- Design mutations (colors, typography, template)
- AI revision diff preview (accept/reject)

Actions to support:
- `setResume(data)` — Full replace
- `updateResume(recipe)` — Immer recipe
- `resetResume()` — Reset to defaults
- `changeTemplate(id)` — Switch template + sync layout
- Section CRUD: add/update/remove/reorder items
- `moveSectionToPage(sectionId, pageIndex, column)`
- `addPage()` / `removePage(pageIndex)`
- `updatePicture(data)` — Photo settings
- `updateBasics(data)` — Personal info
- `updateSummary(data)` — Summary content
- `updateMetadata(recipe)` — Design/layout changes
- `addCustomSection(title, type)` / `removeCustomSection(id)`
- `toggleSectionVisibility(key)`
- `reorderSections(pageIndex, column, fromIndex, toIndex)`

---

## 4. UI Components

### 4.1 ResumeBuilderWorkspace.tsx (Main Shell)
- ResizablePanelGroup: left editor (35%) + right preview (65%)
- Header bar: undo/redo, design button, export dropdown
- Mobile bottom tabs: Edit / Preview / Design / Export
- Keyboard shortcuts: Ctrl+Z/Y undo/redo, Ctrl+P print, Ctrl+S save
- Chiko manifest registration

### 4.2 ResumeLeftPanel.tsx (Editor Sections)
- Scrollable accordion with all section editors
- Drag-and-drop section reordering (within the accordion)
- Each section: collapsible header with title + visibility toggle + item count
- "Add Section" button at bottom for custom sections

### 4.3 Section Editors
- **BasicsEditor** — Name, headline, email, phone, location, website, custom fields
- **PictureEditor** — Photo upload, size slider, border radius, border color/width, aspect ratio
- **SummaryEditor** — Rich text editor (contentEditable or textarea with HTML preview)
- **ProfilesEditor** — Social links: network dropdown, username, URL, icon
- **ExperienceEditor** — Company, position, period, location, description (rich text), roles
- **EducationEditor** — School, degree, area, grade, period, location, description
- **SkillsEditor** — Name, proficiency text, level (0-5 dots/bars), keywords
- **LanguagesEditor** — Language, fluency, level (0-5)
- **AwardsEditor** — Title, awarder, date, description
- **CertificationsEditor** — Title, issuer, date, description
- **ProjectsEditor** — Name, period, website, description
- **PublicationsEditor** — Title, publisher, date, description
- **InterestsEditor** — Name, keywords
- **VolunteerEditor** — Organization, period, location, description
- **ReferencesEditor** — Name, position, phone, description

**Shared patterns:**
- Each list section uses a generic `<SectionList>` component
- Items are drag-and-drop reorderable (using manual swap, no dnd-kit dependency)
- Each item has expand/collapse, visibility toggle, delete button
- "Add Item" button at bottom of each section

### 4.4 ResumeDesignPanel.tsx (Design Side Panel)
Slide-over or drawer with:
- **Template Gallery** — 13 template cards with thumbnails
- **Colors** — Primary color picker, text color, background color (rgba)
- **Typography** — Body font (Google Fonts), heading font, sizes, weights, line height
- **Page Settings** — Format (A4/Letter), margins, gaps, locale
- **Layout** — Sidebar width slider (10-50%), section assignment per page
- **Level Design** — Type (hidden/circle/square/rectangle/progress-bar), icon
- **Custom CSS** — Toggle + textarea (advanced users)
- **Notes** — Private notes textarea

### 4.5 ExportDropdown.tsx
- PDF export (html2canvas → jsPDF, multi-page)
- JSON export (download full resume data)
- DOCX export (using docx library)
- Plain text export (ATS-friendly)
- Print (browser print dialog)
- Copy to clipboard
- Share link (future: generate public URL)

### 4.6 ResumeArtboard.tsx (Preview Renderer)
- Renders resume in A4/Letter dimensions
- Real-time update on any store change
- Multi-page support
- Zoom controls (50-200%)
- Page navigation dots
- Template-specific rendering

---

## 5. Template System (13 Templates)

Based on Reactive Resume's battle-tested templates:

| # | Template | Style | Layout |
|---|----------|-------|--------|
| 1 | **Azurill** | Clean, minimal | Sidebar + main |
| 2 | **Bronzor** | Modern, professional | Sidebar with accent |
| 3 | **Chikorita** | Two-column balanced | Even split |
| 4 | **Ditgar** | Compact, dense | Single column |
| 5 | **Ditto** | Flexible, adaptable | Configurable |
| 6 | **Gengar** | Dark/modern aesthetic | Dark sidebar |
| 7 | **Glalie** | Geometric, structured | Grid-based |
| 8 | **Kakuna** | Minimal sidebars | Narrow sidebar |
| 9 | **Lapras** | Wide, spacious | Wide layout |
| 10 | **Leafish** | Organic, airy | Relaxed spacing |
| 11 | **Onyx** | Classic professional | Traditional |
| 12 | **Pikachu** | Bold, colorful | Strong accent colors |
| 13 | **Rhyhorn** | Structured, grid | Multi-column grid |

Each template is a React component that receives `ResumeData` and renders styled HTML.
Templates use CSS variables from `metadata.design.colors` and `metadata.typography`.

### Template Architecture
```
src/lib/resume/templates/
  ├── index.ts              — Template registry & types
  ├── shared/               — Shared rendering utilities
  │   ├── SectionRenderer.tsx  — Generic section block renderer
  │   ├── LevelIndicator.tsx   — Skill/language level display
  │   ├── RichText.tsx         — Sanitized HTML content renderer
  │   └── Picture.tsx          — Photo renderer with styling
  ├── azurill.tsx           — Template component
  ├── bronzor.tsx           — Template component
  ├── ... (13 template files)
  └── TemplateRenderer.tsx  — Wrapper: loads font, applies CSS vars, renders template
```

---

## 6. Export System

### PDF Export
- Render resume to DOM in hidden container
- html2canvas each page
- jsPDF to combine pages
- Multi-page support

### DOCX Export
- Map resume data to `docx` library structures
- Sections → paragraphs with proper formatting
- Download .docx file

### JSON Export
- Full `ResumeData` serialized as JSON
- Can be re-imported

### Text Export
- ATS-friendly plain text
- Section headers → ALL CAPS
- Items → bullet points
- No formatting

### Print
- Open browser print dialog with resume preview

---

## 7. Chiko AI Integration (40+ Actions)

### Action Categories

**Content Actions:**
- `updateBasics` — Update name, email, phone, etc.
- `updateSummary` — Rewrite professional summary
- `addExperience` / `updateExperience` — Add/edit work experience
- `addEducation` / `updateEducation` — Add/edit education
- `addSkill` / `removeSkill` — Manage skills
- `addProject` — Add project
- `addCertification` — Add certification
- `addAward` — Add award
- `addLanguage` — Add language
- `addVolunteer` — Add volunteer experience
- `addReference` — Add reference
- `addProfile` — Add social profile
- `addPublication` — Add publication
- `addInterest` — Add interest
- `addCustomSection` — Create custom section

**Design Actions:**
- `changeTemplate` — Switch resume template
- `setPrimaryColor` — Change primary/accent color
- `setTextColor` — Change text color
- `setBackgroundColor` — Change background color
- `setBodyFont` — Change body font family
- `setHeadingFont` — Change heading font family
- `setFontSize` — Change font size
- `setPageFormat` — Switch A4/Letter
- `setMargins` — Adjust page margins
- `setSidebarWidth` — Adjust sidebar width
- `setLevelDesign` — Change skill level visualization
- `setCustomCSS` — Apply custom CSS

**Layout Actions:**
- `moveSectionToMain` — Move section to main column
- `moveSectionToSidebar` — Move section to sidebar
- `addPage` — Add new page to layout
- `reorderSections` — Reorder sections on a page

**Utility Actions:**
- `readCurrentState` — Read full resume state for context
- `getATSScore` — Calculate ATS score
- `improveSummary` — AI rewrite of summary
- `improveExperience` — AI enhancement of work descriptions
- `generateFromScratch` — Generate complete resume from basic info
- `importJSON` — Import resume from JSON
- `exportResume` — Trigger export in specified format

---

## 8. File Inventory

### Files to DELETE (Existing Resume/CV)
```
src/components/workspaces/resume-cv/ResumeBuilderWorkspace.tsx
src/components/workspaces/resume-cv/ResumeLeftPanel.tsx
src/components/workspaces/resume-cv/ResumeDesignDrawer.tsx
src/components/workspaces/resume-cv/ExportDropdown.tsx
src/components/workspaces/resume-cv/sections/BasicsSection.tsx
src/components/workspaces/resume-cv/sections/ListSection.tsx
src/components/workspaces/resume-cv/sections/SummarySection.tsx
src/stores/resume-editor.ts
src/lib/resume/schema.ts
src/lib/resume/export.ts
src/lib/resume/pagination.ts
src/lib/resume/ai-resume-generator.ts
src/lib/resume/ai-revision-engine.ts
src/lib/resume/ats-scorer.ts
src/lib/resume/patch-utils.ts
src/lib/resume/diff-utils.ts
src/lib/resume/shared/section-renderers.tsx
src/lib/resume/templates/template-defs.ts
src/lib/resume/templates/UniversalTemplate.tsx
src/lib/resume/templates/templates.ts
src/lib/resume/templates/TemplateRenderer.tsx
src/lib/resume/templates/*.tsx (all legacy template files)
src/lib/chiko/manifests/resume.ts
src/app/api/chat/resume/generate/route.ts
src/app/api/chat/resume/revise/route.ts
src/app/api/chat/resume/parse/route.ts
```

### Files to CREATE
```
src/stores/resume-editor.ts               — Rebuilt store (expanded schema)
src/lib/resume/schema.ts                  — Full Reactive Resume-aligned schema
src/lib/resume/export.ts                  — PDF/DOCX/TXT/JSON exporters
src/lib/resume/ats-scorer.ts              — ATS scoring algorithm
src/lib/resume/ai-resume-generator.ts      — AI content generation
src/components/workspaces/resume-cv/
  ├── ResumeBuilderWorkspace.tsx           — Main shell
  ├── ResumeLeftPanel.tsx                  — Editor panel with all sections
  ├── ResumeDesignPanel.tsx                — Design configuration panel
  ├── ExportDropdown.tsx                   — Export menu
  ├── ResumeArtboard.tsx                   — Preview/artboard component
  └── sections/
      ├── BasicsEditor.tsx                 — Personal info editor
      ├── PictureEditor.tsx                — Photo settings editor
      ├── SummaryEditor.tsx                — Summary editor
      ├── SectionListEditor.tsx            — Generic list section editor
      └── CustomSectionDialog.tsx          — Add custom section dialog
src/lib/resume/templates/
  ├── index.ts                             — Registry & types
  ├── TemplateRenderer.tsx                 — Wrapper renderer
  ├── shared/
  │   ├── SectionBlock.tsx                 — Generic section renderer
  │   ├── LevelIndicator.tsx               — Skill/lang level display
  │   ├── RichText.tsx                     — HTML content renderer
  │   ├── Picture.tsx                      — Photo renderer
  │   └── Link.tsx                         — URL/link renderer
  ├── azurill.tsx
  ├── bronzor.tsx
  ├── chikorita.tsx
  ├── ditto.tsx
  ├── gengar.tsx
  ├── glalie.tsx
  ├── kakuna.tsx
  ├── leafish.tsx
  ├── onyx.tsx
  ├── pikachu.tsx
  └── rhyhorn.tsx
src/lib/chiko/manifests/resume.ts          — 40+ Chiko actions
src/app/api/chat/resume/generate/route.ts  — AI generation endpoint
src/app/api/chat/resume/revise/route.ts    — AI revision endpoint
src/app/api/chat/resume/parse/route.ts     — Resume parser endpoint
```

### Files to MODIFY
```
src/app/tools/[categoryId]/[toolId]/page.tsx — Update import
src/lib/store-adapters.ts                     — Update adapter
src/lib/chiko/manifests/index.ts             — Update barrel export
src/data/tools.ts                             — Update description
TOOL-STATUS.md                                — Update status/changelog
```

---

## 9. Implementation Order

### Phase 1: Schema & Store (Foundation)
1. Delete ALL existing resume files
2. Create new `schema.ts` with full Reactive Resume-aligned types
3. Create new `resume-editor.ts` store with all actions
4. Update `store-adapters.ts` for new store shape

### Phase 2: Template System
5. Create shared template utilities (SectionBlock, LevelIndicator, RichText, Picture)
6. Create template registry (`index.ts`)
7. Implement 13 template components (start with Onyx as default)
8. Create `TemplateRenderer.tsx` wrapper

### Phase 3: Editor UI
9. Create `ResumeBuilderWorkspace.tsx` (main shell)
10. Create `ResumeLeftPanel.tsx` (section accordion)
11. Create section editors (Basics, Picture, Summary, SectionListEditor)
12. Create `ResumeDesignPanel.tsx` (design drawer)
13. Create `ResumeArtboard.tsx` (preview with zoom)
14. Create `ExportDropdown.tsx`

### Phase 4: Export & AI
15. Create `export.ts` (PDF, DOCX, TXT, JSON)
16. Create `ats-scorer.ts`
17. Create `ai-resume-generator.ts`
18. Create API routes (generate, revise, parse)

### Phase 5: Chiko & Polish
19. Create Chiko manifest with 40+ actions
20. Update manifests barrel export
21. Update tools.ts and TOOL-STATUS.md
22. Wire routing in page.tsx
23. TypeScript check & fix errors
24. Build test

---

*This plan document serves as a comprehensive reference for the complete rebuild.*
*Every feature will be fully implemented and working end-to-end.*
