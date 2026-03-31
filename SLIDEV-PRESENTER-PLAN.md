# DMSuite — Slidev-Inspired Presentation Designer — Development Plan

> **Tool ID:** `presentation`
> **Tool Name:** Presentation Designer (Slidev-inspired rebuild)
> **Status:** scaffold → complete
> **Inspiration:** [Slidev](https://sli.dev/) — 34k+ stars, MIT license

---

## 1. Vision

Rebuild the existing `presentation` workspace into a **Slidev-inspired markdown slide deck creator**. Users write slides in markdown, get beautiful rendered previews with code highlighting, LaTeX math, Mermaid diagrams, click animations, presenter mode, and drawing annotations. Chiko AI can generate entire slide decks from a topic prompt.

---

## 2. Feature Matrix

### Core Features (Must-Have)

| # | Feature | Slidev Equivalent | Implementation |
|---|---------|-------------------|----------------|
| 1 | **Markdown Editor** | `slides.md` file | Split-pane: textarea (left) + live preview (right) |
| 2 | **Slide Separation** | `---` separators | Custom parser splits markdown by `---` lines |
| 3 | **Frontmatter** | YAML frontmatter per slide | Extract layout, class, background, transition from `---`...`---` blocks |
| 4 | **17 Slide Layouts** | `layout:` frontmatter | CSS-based: default, center, cover, intro, end, section, statement, fact, quote, two-cols, two-cols-header, image, image-left, image-right, full, iframe, none |
| 5 | **Code Highlighting** | Shiki | highlight.js (dynamic import, ~80 languages) |
| 6 | **LaTeX Math** | KaTeX | KaTeX (dynamic import, inline `$...$` + block `$$...$$`) |
| 7 | **Mermaid Diagrams** | Mermaid.js | Mermaid (dynamic import, ```` ```mermaid ```` blocks) |
| 8 | **Speaker Notes** | `<!-- notes -->` | HTML comments at end of each slide |
| 9 | **10+ Themes** | Theme gallery | CSS theme objects: Seriph, Apple, Default, Dracula, Academic, Bricks, Geist, Purplin, Penguin, Mokka |
| 10 | **Click Animations** | `v-click` directives | `{v-click}` markers → step-through reveal system |
| 11 | **Slide Transitions** | `transition:` frontmatter | CSS transitions: fade, slide-left/right/up/down |
| 12 | **Presenter Mode** | Dual-screen presenter | Modal overlay: current slide + notes + next slide + timer |
| 13 | **Drawing Overlay** | Drauu | Canvas overlay with pen/eraser, color, width — persists per slide |
| 14 | **Keyboard Navigation** | Built-in shortcuts | Arrow keys, Space, F (fullscreen), O (overview), D (dark toggle), Esc |
| 15 | **Slide Overview** | Grid overview | Grid of all slide thumbnails with jump-to |
| 16 | **Export to PDF** | `slidev export` | `printHTML()` pipeline — all slides rendered and printed |
| 17 | **Slide Navigator** | Slide panel | Right panel: vertical thumbnails strip |
| 18 | **Play Mode** | Presentation mode | Full-screen slide-by-slide navigation |
| 19 | **Timer** | Presenter timer | Elapsed time, optional countdown |
| 20 | **Aspect Ratios** | Canvas size | 16:9 (default), 4:3, 16:10 |
| 21 | **Full Chiko AI** | — | 25+ actions: generate decks, add slides, set themes, write code/math/diagrams |

### Markdown Syntax Support

| Markdown Feature | Syntax | Rendering |
|-----------------|--------|-----------|
| Headings | `# H1` through `###### H6` | Styled with theme heading font |
| Bold / Italic | `**bold**` / `*italic*` | Standard styling |
| Strikethrough | `~~crossed~~` | Line-through decoration |
| Links | `[text](url)` | Clickable styled links |
| Images | `![alt](url)` | Responsive images |
| Ordered Lists | `1. Item` | Numbered lists (nested) |
| Unordered Lists | `- Item` | Bullet lists (nested) |
| Blockquotes | `> Quote` | Styled quote blocks |
| Tables | `| A | B |` | Styled HTML tables |
| Code Blocks | ` ```lang ``` ` | Syntax highlighted (highlight.js) |
| Inline Code | `` `code` `` | Monospace with background |
| Inline Math | `$E = mc^2$` | KaTeX rendered |
| Block Math | `$$\int_0^1 x dx$$` | KaTeX display mode |
| Mermaid | ` ```mermaid ``` ` | SVG diagram |
| HTML | Direct HTML | Passthrough rendering |
| Horizontal Rule | `---` | Slide separator (not rendered) |

---

## 3. Architecture

### File Structure

```
src/
├── stores/
│   └── slidev-editor.ts              # Zustand store (temporal + persist + immer)
├── lib/
│   └── slidev/
│       ├── parser.ts                  # Markdown → SlidevSlide[] parser
│       └── themes.ts                  # 10 theme definitions
├── components/
│   └── workspaces/
│       └── slidev-presenter/
│           ├── SlidevPresenterWorkspace.tsx    # Main workspace
│           ├── SlidevSlideRenderer.tsx         # Slide renderer (layouts, code, math, mermaid)
│           ├── SlidevNavigatorPanel.tsx        # Right panel (slide thumbnails)
│           └── tabs/
│               ├── SlidevEditorTab.tsx         # Markdown editor tab
│               ├── SlidevThemeTab.tsx          # Theme picker tab
│               └── SlidevSettingsTab.tsx       # Settings tab
└── lib/
    └── chiko/
        └── manifests/
            └── slidev-presenter.ts            # Chiko AI manifest (25+ actions)
```

### Store Shape

```typescript
interface SlidevForm {
  // Deck metadata
  title: string;
  author: string;
  date: string;

  // Markdown source (single document)
  markdown: string;

  // Theme & style
  themeId: string;
  aspectRatio: "16:9" | "4:3" | "16:10";
  transition: TransitionType;
  highlightTheme: string;
  fonts: { heading: string; body: string; mono: string };
  canvasWidth: number;
  canvasHeight: number;

  // Drawing annotations (per slide index)
  drawings: Record<number, DrawingPath[]>;
}
```

### Slide Parsing Flow

```
User writes markdown
       ↓
Parser splits by --- separators
       ↓
Each chunk → Extract frontmatter (YAML) + content + notes
       ↓
SlidevSlide[] array (derived, not persisted)
       ↓
Renderer applies layout + theme + renders markdown
       ↓
Live preview updates in real-time
```

### Dynamic Loading Strategy

```typescript
// Heavy libraries loaded on-demand, not bundled
const hljs = await import("highlight.js/lib/core");
const katex = await import("katex");
const mermaid = await import("mermaid");
```

---

## 4. Layout System

17 layouts matching Slidev's built-in layouts:

| Layout | Description | CSS Pattern |
|--------|-------------|-------------|
| `default` | Standard content | `p-12` padding, top-aligned |
| `center` | Centered content | `flex items-center justify-center` |
| `cover` | Title/cover page | `flex flex-col justify-center` + large text |
| `intro` | Introduction slide | `flex flex-col justify-end` |
| `end` | Final slide | `flex items-center justify-center` + "Thank You" style |
| `section` | Section divider | `flex items-center` + large heading |
| `statement` | Bold statement | `flex items-center justify-center` + huge text |
| `fact` | Big number/fact | Large centered stat |
| `quote` | Blockquote | `flex items-center justify-center` + styled quote |
| `two-cols` | Two columns | `grid grid-cols-2` with `::right::` separator |
| `two-cols-header` | Header + two cols | Header row + `grid grid-cols-2` |
| `image` | Full background | Background image cover |
| `image-left` | Left image + right content | `grid grid-cols-2` with image |
| `image-right` | Right image + left content | `grid grid-cols-2` with image |
| `full` | Full-bleed content | No padding |
| `iframe` | Embedded webpage | `<iframe>` full-size |
| `none` | Unstyled | No layout classes |

---

## 5. Theme System

10 themes inspired by Slidev's theme gallery:

| # | Theme | Background | Accent | Font |
|---|-------|-----------|--------|------|
| 1 | Default | `#121212` | `#2B90B6` | Nunito Sans |
| 2 | Seriph | `#1B1B1B` | `#4EC5D4` | Playfair Display |
| 3 | Apple Basic | `#FFFFFF` | `#0071E3` | SF Pro / Inter |
| 4 | Dracula | `#282A36` | `#BD93F9` | Fira Sans |
| 5 | Academic | `#FAFAF9` | `#1D4ED8` | Merriweather |
| 6 | Bricks | `#F5F5DC` | `#D2691E` | Lora |
| 7 | Geist | `#000000` | `#FFFFFF` | Geist / Inter |
| 8 | Purplin | `#1E1644` | `#A855F7` | DM Sans |
| 9 | Penguin | `#0F172A` | `#38BDF8` | Poppins |
| 10 | Mokka | `#2C1810` | `#D4A574` | Cormorant Garamond |

---

## 6. Click Animation System

Slidev's `v-click` mechanism adapted for our markdown-based approach:

**Syntax:**
```markdown
# My Slide

This is always visible.

{v-click} This appears on click 1.

{v-click} This appears on click 2.

{v-click} This appears on click 3.
```

**Implementation:**
- Parser counts `{v-click}` markers per slide → `slide.totalClicks`
- Renderer wraps each click group in `<div data-click="N">`
- CSS class `slidev-click-hidden` hides elements where `N > currentClick`
- Forward/backward navigation increments/decrements click counter
- When all clicks exhausted, advance to next slide

---

## 7. Presenter Mode

A modal overlay with 3 panels:

```
┌──────────────────────────────────────────────┐
│  Current Slide (large)     │  Next Slide     │
│                            │  (preview)      │
│                            │                 │
├────────────────────────────┤                 │
│  Speaker Notes             │                 │
│  (scrollable, markdown)    │                 │
├────────────────────────────┴─────────────────┤
│  ⏱ Timer: 00:05:23   │ Slide 3/15  │ [Exit] │
└──────────────────────────────────────────────┘
```

---

## 8. Drawing System

Canvas overlay for live annotation during presentations:

- Color picker (8 preset colors + custom)
- Brush width (2px, 4px, 6px, 8px)
- Eraser mode
- Clear current slide drawings
- Drawings persist per slide (stored in `form.drawings[slideIndex]`)
- Toggle show/hide

---

## 9. Chiko AI Integration

25+ actions covering every aspect of the tool:

| Category | Actions |
|----------|---------|
| **Read** | `readCurrentState` — full deck state, slides, theme, stats |
| **Deck** | `setTitle`, `setAuthor`, `setDate`, `setTheme`, `setTransition`, `setAspectRatio` |
| **Content** | `setMarkdown` (replace entire deck), `generateDeck` (from topic), `addSlide`, `updateSlideContent`, `deleteSlide`, `moveSlide`, `duplicateSlide` |
| **Slide** | `setSlideLayout`, `setSlideBackground`, `setSlideTransition`, `setSlideNotes` |
| **Code** | `addCodeBlock` (with language + code) |
| **Math** | `addMathBlock` (inline or display KaTeX) |
| **Diagram** | `addMermaidDiagram` (flowchart, sequence, gantt, etc.) |
| **Style** | `updateFonts`, `setHighlightTheme` |
| **Export** | `exportPrint` (trigger PDF export) |
| **Template** | `applyTemplate` (pre-built starter decks) |

---

## 10. Starter Templates

5 pre-built markdown decks:

| # | Template | Description | Slides |
|---|----------|-------------|--------|
| 1 | Blank | Empty single slide | 1 |
| 2 | Tech Talk | Code-heavy with code blocks + diagrams | 10 |
| 3 | Business Pitch | Cover + problem + solution + metrics + team + CTA | 8 |
| 4 | Academic Lecture | Math + diagrams + structured content | 12 |
| 5 | Product Launch | Cover + features + demo + pricing + FAQ | 10 |

---

## 11. NPM Dependencies

| Package | Purpose | Size | Loading |
|---------|---------|------|---------|
| `marked` | Markdown → HTML | ~50KB | Dynamic import in renderer |
| `highlight.js` | Code syntax highlighting | ~30KB core + languages | Dynamic import |
| `katex` | LaTeX math rendering | ~1.3MB with fonts | Dynamic import |
| `mermaid` | Text → diagrams | ~2MB | Dynamic import |

All heavy dependencies are **dynamically imported** only when the workspace loads — zero impact on main app bundle size.

---

## 12. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` / `Space` | Next click or slide |
| `←` | Previous click or slide |
| `↑` | Previous slide |
| `↓` | Next slide |
| `F` | Toggle fullscreen |
| `O` | Toggle slide overview |
| `P` | Toggle presenter mode |
| `D` | Toggle dark mode |
| `Escape` | Exit fullscreen/presenter/overview |
| `Home` | Go to first slide |
| `End` | Go to last slide |
| `1-9` | Jump to slide N |

---

## 13. Implementation Order

1. Install npm dependencies (`marked`, `highlight.js`, `katex`, `mermaid`)
2. Create `src/lib/slidev/parser.ts` — Markdown → Slides parser
3. Create `src/lib/slidev/themes.ts` — 10 theme definitions
4. Create `src/stores/slidev-editor.ts` — Zustand store
5. Create `SlidevSlideRenderer.tsx` — Slide renderer
6. Create `SlidevNavigatorPanel.tsx` — Thumbnails panel
7. Create editor/theme/settings tabs
8. Create `SlidevPresenterWorkspace.tsx` — Main workspace
9. Create Chiko manifest
10. Update registry files (page.tsx, tools.ts, store-adapters.ts, manifests/index.ts, TOOL-STATUS.md)
11. TypeScript check
12. Commit and push

---

*Plan created for DMSuite Presentation Designer — Slidev-inspired rebuild*
