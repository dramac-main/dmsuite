# DMSuite — Active Context

## Current Focus
**Phase:** Session 90 — Chiko Layer 4 Business Memory System Built ✅

### Session 90: Chiko Layer 4 Business Memory System Build

**Context:** Layer 4 spec was written in Session 89. This session implemented the full Business Memory System — persistent business profile store, cross-tool field mapping, global Chiko manifest, API route enhancement, and client-side registration. Zero tsc errors on first pass.

**Completed Work:**

1. **Created `src/stores/business-memory.ts`** (~280 lines):
   - `BusinessProfile` interface with 30 canonical fields across 5 groups (company, banking, social, design, team)
   - `BusinessMemoryState` with all mutations and helpers
   - Zustand persist middleware (key: `dmsuite-business-memory`), partializes only `profile` + `hasProfile`
   - `updateProfile(patch)` auto-generates `profileId` via `crypto.randomUUID()` on first save
   - `importFromFields()` maps Layer 2 detected fields to canonical names via `DETECTED_FIELD_MAP`
   - `getProfileSummary()` returns "CompanyName — email — phone"
   - `getBusinessProfile()` synchronous snapshot reader export

2. **Created `src/lib/chiko/field-mapper.ts`** (~210 lines):
   - 6 mapper functions: Sales Book branding (19 fields), Invoice business info (7), Invoice payment (5), Business Card details (11), Resume basics (7), Detected fields → profile (9)
   - `filterPopulated()` helper excludes empty strings from all outputs
   - `describeProfileForAI()` multi-line summary with masked bankAccountNumber + taxId (****last4)
   - `getPopulatedFieldCount()` counts non-empty non-metadata fields

3. **Created `src/lib/chiko/manifests/business-memory.ts`** (~260 lines):
   - toolId: "business-memory", toolName: "Business Memory"
   - 8 actions: saveProfile, saveBanking, saveLogo, readProfile, clearProfile, prefillCurrentTool, addTeamMember, removeTeamMember
   - `getState()` returns summary (never raw data): hasProfile, profileName, populatedFieldCount, company fields, hasLogo, hasBanking, teamMemberCount, designPreferences
   - `prefillCurrentTool` iterates registry.manifests to find active tool, maps profile fields via field-mapper, calls tool's update actions

4. **Modified `src/lib/chiko/manifests/index.ts`** — Added barrel export for `createBusinessMemoryManifest`

5. **Modified `src/lib/chiko/manifests/sales-book.ts`** — Added `prefillFromMemory` action + executeAction case (reads memory, maps 19 fields, calls `updateBranding`)

6. **Modified `src/lib/chiko/manifests/invoice.ts`** — Added `prefillFromMemory` action + executeAction case (reads memory, maps business info + payment info, calls both update methods)

7. **Modified `src/app/api/chiko/route.ts`** — Added `businessProfile` to request body, injects profile summary + 7 memory management instructions into system prompt

8. **Modified `src/components/Chiko/ChikoAssistant.tsx`** — Imports, global manifest registration via useEffect (no cleanup), `businessProfile` summary in fetch payload via `describeProfileForAI()`

**Build Status: ✅ Zero TypeScript errors on first pass (tsc --noEmit)**

**Key Technical Decisions:**
- No immer/temporal — simple key-value store doesn't need it
- Privacy: `maskValue()` shows only `****last4` for bank account and tax ID in AI context
- Global manifest: useEffect with no cleanup (always available, unlike tool manifests)
- businessProfile sent as text summary string, never raw data or logo URIs
- All mappers use `filterPopulated()` to exclude empty strings from output

**Next Steps:**
- Layer 5 (Full Agent Workflows) spec
- Invoice renderer custom blocks integration (deferred from Layer 3)
- Remaining business tools: Cover Letter Writer, Proposal & Pitch Deck, Certificate Designer, Contract Creator
   - **Basic (always visible):** Bank name, Account holder, Account number, Branch
   - **Advanced (behind toggle):** Branch code, Sort/routing code, SWIFT/BIC, IBAN, Reference, Custom field pair
   - Toggle label: "More banking fields"

4. **Form Layout Restructured** (SBSectionFormLayout):
   - **Header Fields — Basic:** Date, Due Date, Recipient, Sender, P.O. Number
   - **Header Fields — Advanced:** Custom Field 1/2 toggles + label inputs
   - **Totals & Footer — Basic:** Subtotal, Total, Tax/VAT, Discount, Amount in Words, Signatures, Payment Info
   - **Totals & Footer — Advanced:** Notes Area, Terms toggle + textarea, Custom Footer Text

5. **Build Status: ✅ Zero TypeScript errors**

**Completed Work (Session 83):**

1. **Currency Position Fix** — Totals section completely rewritten:
   - Changed from `display: "inline-block", textAlign: "right"` (currency at end)
   - To `display: "inline-flex"` with currency `<span>` FIRST + flexible blank space
   - All 4 totals rows fixed: subtotal, discount, tax/VAT, total
   - Receipt amount box updated to use `getCurrencyLabel()`

2. **Currency Display Options** — Symbol vs Code toggle:
   - Schema: Added `currencyCode` (default "ZMW") and `currencyDisplay` ("symbol"|"code")
   - `getCurrencyLabel()` helper respects display preference
   - UI: Symbol/Code toggle buttons in SBSectionFormLayout
   - Currency picker now shows ALL 16 currencies in 4-column grid
   - Each selection sets both `currencySymbol` and `currencyCode`

3. **Banking Fields Expanded** — 3 → 11 fields:
   - `bankName`, `bankAccount`, `bankAccountName`, `bankBranch`, `bankBranchCode`
   - `bankSwiftBic`, `bankIban`, `bankSortCode`, `bankReference`
   - `bankCustomLabel`, `bankCustomValue` (user-defined custom pair)
   - All fields render conditionally in Payment Info section
   - All input fields added to SBSectionBranding UI

4. **Footer Placeholder Fix** — Changed `branding.name || "Company Name"` to `branding.name || "\u00A0"` (non-breaking space — no visible placeholder)

5. **Custom Fields** — Added to schema and UI:
   - `showCustomField1`/`customField1Label` and `showCustomField2`/`customField2Label` in formLayout
   - Render as blank fields in header area with user-defined labels
   - `customFooterText` — pre-printed text below terms on every form
   - Toggle + label inputs in SBSectionFormLayout

6. **Quality Scan** — Full audit passed:
   - Removed hardcoded "$" fallback from receipt amount box
   - All banking fields verified in renderer and UI
   - Currency positioning verified correct in all locations
   - Zero TypeScript errors — clean build

**Build Status: ✅ Zero TypeScript errors (tsc --noEmit passes clean)**

**Active File Inventory:**
- `src/lib/sales-book/BlankFormRenderer.tsx` — v5 with currency fix, banking expansion, custom fields
- `src/lib/sales-book/schema.ts` — 11 banking fields, currency display options, custom fields
- `src/components/workspaces/sales-book-designer/SBSectionBranding.tsx` — 11 banking input fields
- `src/components/workspaces/sales-book-designer/SBSectionFormLayout.tsx` — Currency picker with all 16 currencies + symbol/code toggle + custom field toggles + custom footer text

### Next Steps — Remaining Business Tools
User approved building 5 business tools to Resume Builder production standard:
1. ~~Invoice Designer~~ ✅ COMPLETE → Sales Book Blank Form Designer (split-screen)
2. **Cover Letter Writer** — Next to build
3. **Proposal & Pitch Deck Designer** — After Cover Letter
4. **Certificate Designer** — After Proposal
5. **Contract & Agreement Creator** — After Certificate

#### New File: Chiko3DAvatar.tsx
- Pure CSS 3D + SVG robot character (no WebGL/Three.js dependencies)
- Matches reference images: white rounded body, dark glass visor, cyan glow eyes, cyan accent lines
- 6 sizes: xs (32px), sm (44px), md (64px), lg (96px), xl (140px), hero (220px)
- 7 expression states: idle, thinking, speaking, happy, waving, greeting, listening
- Auto-blink system (every 3-5 seconds, 150ms blink duration)
- Radial gradient body for 3D sheen/highlight effect
- Animated arms that wave on waving/greeting expressions
- Glowing eye auras with radial gradient + specular highlights
- Ear pieces with cyan accent line animations
- Animated shadow that responds to floating movement
- Cyan accent lines across head, body, ears (all animated with pulsing glow)
- Dark visor with glass reflection highlight
- Interactive mode: hover sparkle particles (primary + secondary colors)
- Ambient glow aura behind character (radial gradient)
- Drop shadow filter for depth
- Thinking expression: animated dots above head
- Happy expression: squint arc lines under eyes
- Global branding: secondary-500 (#06b6d4) cyan for accents, primary-500 (#8ae600) for interaction sparkles

#### ChikoFAB Updated
- Uses Chiko3DAvatar instead of flat ChikoAvatar
- Size increased to 64px (h-16 w-16) for better character visibility
- Spinning conic-gradient ring (cyan + primary) always visible, brightens on hover
- Ambient pulsing glow behind FAB (radial gradient, cyan + primary)
- Expression changes: idle normally, happy on hover, greeting when minimized
- Tooltip improved with kbd element for shortcut
- Notification badge now has "!" text inside

#### ChikoAssistant Updated
- Header uses Chiko3DAvatar with dynamic expressions
- Expression tracking via useEffect: thinking → happy → listening → greeting → idle
- isGenerating triggers "thinking" expression with animated cyan dot indicator
- Message bubbles show xs-size 3D avatar for assistant messages
- "AI Assistant" badge uses secondary-500 (cyan) to match character theme

#### ChikoOnboarding Updated
- Welcome step shows xl-size 3D avatar with greeting expression + glow
- Tool count fixed from 178 → 194

#### Barrel Export (index.ts)
- Added Chiko3DAvatar to exports

#### Build Status: ✅ Zero errors, compiled in 14.0s
- **/tools** — Full category overview with tool counts
- **/search [query]** — Search tools by keyword (shows up to 8 results)
- **/details [tool]** — Full tool info (AI providers, exports, status, features)
- **/category [name]** — List all tools in a category
- **/create [type]** — Quick-launch with smart mapping (logo→logo-generator, resume→resume-cv, etc.)
- **/shortcuts**, **/theme**, **/help**, **/dashboard** — Utility commands
- **Natural language navigation**: "take me to logo generator", "open video editor", etc.
- Live autocomplete for /navigate, /go, /open commands
- Imports `searchTools`, `toolCategories`, `getAllToolsFlat` from tools.ts
- `findToolByQuery()` helper: exact ID → exact name → fuzzy search
- `getToolDetails()`: shows category, status, AI providers, exports, part-edit, print-ready
- `getCategoryTools()`: lists all tools with status indicators

#### Mobile Responsiveness Overhaul
- **Full-screen on mobile**: `inset-0 rounded-none` → `sm:inset-auto sm:bottom-6 sm:right-6 sm:rounded-2xl`
- **Mobile backdrop overlay**: Semi-transparent overlay + tap-to-close on mobile only
- **Virtual keyboard detection**: `visualViewport.resize` listener adjusts layout
- **Body scroll lock**: Prevents background scrolling when Chiko is open on mobile
- **Safe-area insets**: `env(safe-area-inset-bottom)` for iOS notch devices
- **Touch-friendly targets**: All buttons are 36-44px minimum, suggestion chips are 44px on mobile
- **16px font-size on input**: Prevents iOS auto-zoom on focus
- **enterKeyHint="send"**: Shows "Send" on mobile keyboards
- **Quick suggestions grid**: 2-column grid on mobile, flex-wrap on desktop
- **overscroll-contain**: Prevents pull-to-refresh on message scroll

#### ChikoFAB Mobile-Safe Positioning
- Mobile: `bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+0.75rem)]` — sits above MobileBottomNav (h-14)
- Desktop: `sm:bottom-6 sm:right-6` — normal positioning
- Tooltip hidden on mobile (only desktop hover)
- `active:scale-95` for touch feedback

#### Deepened Platform Knowledge (API)
- System prompt now has COMPLETE 194-tool registry organized by category/subcategory
- Every tool ID, name, and status (✅/🧪/🔜) included
- Accurate count: 194 total | 88 ready | 8 beta | 98 coming-soon
- All slash commands documented in system prompt
- 10+ fallback response patterns (tools, navigate, help, hello, shortcuts, resume, logo, video, design, default)
- Fallback responses now show correct tool counts and categories

#### Files Modified
1. `src/components/Chiko/ChikoAssistant.tsx` — Complete rewrite (mobile-first, auto-launcher)
2. `src/components/Chiko/ChikoFAB.tsx` — Mobile-safe positioning above MobileBottomNav
3. `src/components/Chiko/index.ts` — Added ChikoOnboarding export
4. `src/components/ClientShell.tsx` — Added ChikoOnboarding dynamic import
5. `src/app/api/chiko/route.ts` — Complete tool registry + expanded fallbacks

#### Files Created
1. `src/components/Chiko/ChikoOnboarding.tsx` — Interactive 5-step onboarding tour

#### Build Status: ✅ Zero errors, compiled in 18.6s

---

### Previous Session: Session 68 — Chiko AI Personal Assistant (COMPLETE ✅)

#### Architecture
```
ChikoFAB (floating button, always visible)
  └── onClick/Ctrl+. → toggle ChikoAssistant
ChikoAssistant (sliding panel, bottom-right)
  ├── Header: avatar + name + status
  ├── Messages: scrollable chat with markdown rendering
  ├── Suggestions: context-aware quick-action chips
  ├── Slash Results: /navigate autocomplete from tools registry
  └── Input: auto-resize textarea + send button
ChikoStore (Zustand + persist)
  ├── messages, isOpen, isGenerating, context
  └── hasNotification, hasGreeted, isMinimized
/api/chiko (streaming API)
  ├── CHIKO_SYSTEM_PROMPT (personality + platform knowledge)
  ├── Context injection (current page/tool)
  └── Fallback responses (no API key needed)
```

#### Files Created
1. `src/stores/chiko.ts` — Zustand store with persistence
2. `src/app/api/chiko/route.ts` — Dedicated AI API with personality
3. `src/components/Chiko/ChikoAvatar.tsx` — Animated SVG avatar
4. `src/components/Chiko/ChikoAssistant.tsx` — Main chat panel
5. `src/components/Chiko/ChikoFAB.tsx` — Floating action button
6. `src/components/Chiko/index.ts` — Barrel export

#### Files Modified
1. `src/components/ClientShell.tsx` — Added ChikoFAB + ChikoAssistant
2. `src/stores/index.ts` — Added Chiko store exports
3. `src/lib/shortcuts.ts` — Added Ctrl+. shortcut registration

---

### Previous Session: Session 66–67 — Skills Rendering Fix + AI Resume Parsing Fix (COMPLETE ✅)

#### Root Cause Analysis

**Issue: AI response fails schema validation**
- `repairResumeData()` only fixed top-level structure (sections exist, metadata exists)
- Never repaired item-level fields — language proficiency enums, missing IDs, field name mismatches
- AI prompt used `[...]` placeholders for certifications, languages, volunteer, projects — AI guessed wrong field names
- Language proficiency: schema requires `"native"|"fluent"|"intermediate"|"basic"` but AI returned "Advanced", "C2", "Professional"
- Skill proficiency: AI returned capitalized or non-enum values
- Items missing `id` fields (required by schema with `z.string().min(1)`)
- Common field name mismatches: AI used `title` instead of `position` for experience, `school` instead of `institution` for education

#### Fixes Applied

**1. Deep item-level repair in `repairResumeData()` (ai-resume-generator.ts)**
- Language proficiency normalization map (native/C2/bilingual → "native", Advanced/C1 → "fluent", etc.)
- Skill proficiency normalization map with delete for unmappable values (field is optional)
- Auto-generate `id` fields for any item missing one
- Field name fixups: `title→position`, `role→position`, `school→institution`, `year→graduationYear`, `language→name`, `position→role` (volunteer), `name→title` (awards)
- Default empty strings for all required string fields
- Ensure `keywords: []` default for skills/projects
- Ensure `customFields: []` on basics, `website` object not string

**2. Full item schemas in AI prompt**
- Certifications: full schema with `name`, `issuer`, `year`, `url`
- Languages: full schema with exact proficiency enum values
- Volunteer: full schema with `organization`, `role`, `description`, `startDate`, `endDate`
- Projects: full schema with `name`, `description`, `url`, `keywords`
- Awards: full schema with `title`, `issuer`, `date`, `description`

**3. Metadata enum validation**
- Template ID validated against complete list of 20 valid IDs
- Page format, margin preset, section spacing, line spacing, color intensity, font scale all validated
- Layout pages array fixed if missing/malformed, sidebarWidth clamped to 20-45 range

**4. Error logging for debugging**
- Initial Zod errors logged before repair attempt
- Post-repair Zod errors logged if repair still fails
- Added `normalizedResume` memoized computation that flattens grouped skill items
- Each keyword in `skill.keywords` becomes its own `SkillItem` (inherits parent's proficiency)
- Applied to BOTH measurement container and visible pages
- Handles both AI-generated grouped skills and individual skills correctly
- One fix in one place covers ALL 20 templates — no need to modify each template

**2. Fallback Resume Skill Generation Fixed (ai-resume-generator.ts)**
- `buildFallbackResume()` now creates individual skill items: `skills.map(s => ({ name: s }))`
- Previously created one grouped item: `[{ name: "Skills", keywords: [all_skills] }]`
- Belt-and-suspenders: even without normalization, fallback now works correctly

**3. Dynamic Bottom Overlay (TemplateRenderer.tsx)**
- Added `nextPageStartY` prop to ResumePage component
- Bottom overlay height now calculated dynamically: `pageHeight - nextBreakPagePos`
- Ensures content between break point and page edge is hidden (no page overlap)
- Last page still uses standard margin (botM) for bottom overlay

**4. Neon-glass Template Fix (UniversalTemplate.tsx)**
- Fixed certifications section label from "Awards" to "Certifications"
- Enhanced volunteer rendering to show role and organization (was only organization)

#### Verified
- All ExtraSections sets CORRECTLY match native template rendering (5/5 verified)
- All 20 templates render summary, experience, education, skills natively
- TypeScript compiles clean (zero errors)
- Section coverage matrix confirmed accurate (see progress.md)
- `onclone` now copies `fontSize`, `lineHeight`, and `letterSpacing` in addition to `fontFamily`
- Prevents text reflow during html2canvas capture → exact visual match

#### Files Modified in Session 65
1. **`src/lib/resume/templates/TemplateRenderer.tsx`** — Complete rewrite from v7 to v8 (smart page-break engine)
2. **`src/lib/resume/templates/UniversalTemplate.tsx`** — ExtraSections expanded from 3 to 7 section types + custom sections
3. **`src/lib/resume/export.ts`** — Enhanced onclone font property copying

**2. ExtraSections Component (UniversalTemplate.tsx)**
- New `ExtraSections` component renders volunteer, awards, references at bottom of template content
- Uses template-compatible CSS classes (`.section`, `.section-title`, `.exp-item`, etc.)
- Deduplication: `TEMPLATES_WITH_VOLUNTEER` (7 templates) and `TEMPLATES_WITH_AWARDS` (6 templates) sets prevent double-rendering
- References rendered for ALL templates (no template natively handles references)

**3. Professional Page Margins (TemplateRenderer v7)**
- `PAGE_MARGIN_PX` constants per margin preset: narrow(24), standard(40), wide(56)
- Page 0: only bottom margin overlay (template header provides natural top)
- Pages 1+: both top and bottom margin overlays
- Overlays are absolute-positioned divs with template background color, z-index:10
- Content hidden under overlays re-appears on the next page

**4. Margin-Aware Page Count Calculation**
- `page0Visible = pageHeight - bottomMargin` (first page: only bottom margin)
- `contVisible = pageHeight - topMargin - bottomMargin` (continuation: both margins)
- `pageCount = 1 + ceil((totalHeight - page0Visible) / contVisible)` with max 8 pages cap
- Correct translateY offsets ensure content continuity across page boundaries

#### Architecture: V7 Padded Viewport-Clipping

```
Page 0 (1056px):
  ┌─────────────────────────┐
  │ Template header/content  │ ← Template's own CSS padding
  │ ...content...            │
  │ ...content...            │
  │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ ← Bottom margin overlay (40px)
  └─────────────────────────┘

Page 1 (1056px):
  ┌─────────────────────────┐
  │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ ← Top margin overlay (40px)
  │ ...continuation content..│
  │ ...content...            │
  │▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│ ← Bottom margin overlay (40px)
  └─────────────────────────┘
```

#### Files Modified in Session 64
1. **`src/lib/resume/templates/TemplateRenderer.tsx`** — V7 rewrite: margins, auto-sections, safety cap
2. **`src/lib/resume/templates/UniversalTemplate.tsx`** — ExtraSections component, TEMPLATES_WITH_* sets
   [data-measure-container] [data-template],
   [data-content-inner] [data-template] {
     overflow: visible !important;
   }
   ```

#### Architecture: Viewport-Clipping Pagination (v6)

```
TemplateRenderer
├── <link> Google Fonts
├── <style> overflow:visible !important safety override
├── [data-measure-container] (hidden, off-screen, no height constraint)
│   └── <TemplateComponent> (ALL sections, full content)
│       └── <div data-template="..."> (minHeight: 100%, overflow: visible)
├── ResumePage[0] (data-resume-page="0")
│   └── viewport: 816×1056px, overflow:hidden
│       └── content-inner: transform:translateY(0px)
│           └── <TemplateComponent> (ALL sections)
├── ResumePage[1] (data-resume-page="1")
│   └── viewport: 816×1056px, overflow:hidden  
│       └── content-inner: transform:translateY(-1056px)
│           └── <TemplateComponent> (ALL sections)
└── ...
```

**Measurement Strategy:**
- Triple `requestAnimationFrame` for CSS/font readiness
- `document.fonts.ready` listener with `fontGen` state
- 500ms delayed re-measurement for late font loads
- Queries `[data-template]` element's `scrollHeight` inside measure container

**Export Compatibility:**
- Export system (`export.ts`) queries `[data-resume-page]` elements ✅
- Removes `[data-measure-container]` from clone ✅
- Sets `overflow: hidden` on each page for capture ✅
- Fully compatible with viewport-clipping approach ✅

#### Files Modified in Session 63
1. **`src/lib/resume/templates/TemplateRenderer.tsx`** — Complete rewrite from v5 to v6 (viewport-clipping)
2. **`src/lib/resume/templates/UniversalTemplate.tsx`** — `height: "100%"` → `minHeight: "100%"` on wrapper
3. **`src/data/template-css.ts`** — Removed `overflow: hidden` from neon-glass root, `overflow: clip` from artistic-portfolio root

#### CSS Audit Results (All 20 Templates)
| Template | Root Overflow | Status |
|----------|--------------|--------|
| 01-08 | None/safe | ✅ |
| 09 artistic-portfolio | `overflow: clip` → REMOVED | ✅ Fixed |
| 10-18 | None/safe | ✅ |
| 19 neon-glass | `overflow: hidden` → REMOVED | ✅ Fixed |
| 20 corporate-stripe | None/safe | ✅ |

All 20 templates now have safe root CSS for multi-page rendering.

---

### Previous Session 60 — Template CSS Injection & AI Fix (COMPLETE ✅)
User raised 9 major issues. All addressed with a massive template system overhaul.

#### What Was Done

**1. Fixed Nested Dropdown ("Something Silly")**
- **Problem:** Font pairing dropdown nested inside an accordion section.
- **Fix:** Replaced `FontPairingDropdown` with `FontPairingList` — direct button list inside accordion, no nesting.

**2. Fixed Export Text Overlap**
- **Problem:** PDF export had overlapping letters/words.
- **Fix:** Triple-frame font wait (2× rAF + 100ms setTimeout), dynamic `backgroundColor` detection via `getComputedStyle()`, `onclone` callback forcing explicit `fontFamily` on all elements.

**3. Smaller Default Panel Sizes**
- **Problem:** 25/50/25 default too large for side panels.
- **Fix:** Changed to 20/60/20 in both `StepEditor.tsx` and default layout.

**4. Smarter Pagination**
- **Problem:** Large gaps on pages when sections barely overflow.
- **Fix:** Added `MIN_FILL_RATIO = 0.35` — sections won't be bumped to next page if current page is less than 35% full. `BOTTOM_SAFETY` increased from 12 to 16px.

**5. Integrated 20 Professional HTML Templates**
- User provided 20 HTML template files at `D:\dramac-ai-suite\templates\`
- All 20 analyzed (layout, colors, fonts, structure) via comprehensive subagent analysis
- Created `template-defs.ts` with 20 `ProTemplateDefinition` configs
- Created `UniversalTemplate.tsx` — config-driven universal template component (~600 lines)
- Registry expanded from 6 legacy to 26 total templates (6 legacy + 20 pro)

**6. Color Palette System**
- Each pro template has a 12-property `ColorPalette`: background, cardBg, sidebarBg, headerBg, accent, accentLight, accentSecondary, accentTertiary, textDark, textMedium, textLight, border
- Palettes defined per template in `template-defs.ts`
- ⚠️ UI for user to customize individual palette colors not yet built

**7. Font Size Controls**
- Added "Font Size" accordion section in EditorDesignPanel
- Three options: Smaller (compact 0.9×), Default (standard 1.0×), Larger (spacious 1.1×)

**8. Page Size Responsiveness**
- Pro templates use px-based layouts that scale with page dimensions
- TemplateRenderer reads PAGE_DIMENSIONS for scaling

**9. Multi-Page Support Improved**
- `TEMPLATE_CONFIG` entries for all 26 templates in `pagination.ts`
- `MIN_FILL_RATIO` prevents wasteful page breaks

#### New Files Created
- **`src/lib/resume/templates/template-defs.ts`** (~500 lines) — 20 ProTemplateDefinition configs with layout, palette, fonts, header/section styles, skill display types
- **`src/lib/resume/templates/UniversalTemplate.tsx`** (~600 lines) — Config-driven universal template with CSS generator, section renderers, layout components, `createProTemplateComponent()` factory

#### Files Modified (8 total)
- `src/lib/resume/schema.ts` — 26 template IDs, 28 font pairings, `FONT_SCALE_MULTIPLIER`
- `src/lib/resume/templates/templates.ts` — Combined registry (pro first + legacy = 26), `isPro`/`accentPreview`/`isDark` metadata
- `src/lib/resume/templates/TemplateRenderer.tsx` — Dynamic component resolution, Google Fonts `<link>` injection, pro template background/font/padding support
- `src/lib/resume/pagination.ts` — 26 TEMPLATE_CONFIG entries, MIN_FILL_RATIO algorithm improvement
- `src/lib/resume/export.ts` — Multi-frame font wait, dynamic backgroundColor, onclone font fix
- `src/stores/resume-editor.ts` — `changeTemplate` sets font pairing + layout for pro templates
- `src/components/workspaces/resume-cv/editor/EditorDesignPanel.tsx` — FontPairingList, Font Size section
- `src/components/workspaces/resume-cv/editor/TemplateCarousel.tsx` — Pro template thumbnails (dark/accent/PRO badge)
- `src/components/workspaces/resume-cv/StepEditor.tsx` — 20/60/20 default layout

#### 20 Pro Template IDs
`modern-minimalist`, `corporate-executive`, `creative-bold`, `elegant-sidebar`, `infographic`, `dark-professional`, `gradient-creative`, `classic-corporate`, `artistic-portfolio`, `tech-modern`, `swiss-typographic`, `newspaper-editorial`, `brutalist-mono`, `pastel-soft`, `split-duotone`, `architecture-blueprint`, `retro-vintage`, `medical-clean`, `neon-glass`, `corporate-stripe`

#### Template Layouts
- 12 sidebar-right, 3 sidebar-left, 3 single/hybrid, 1 equal two-column, 1 single-column
- 5 dark templates, 4 with avatars
- Each has unique Google Font URL, header style, section title style, skill display type

#### Build Status
- `next build`: ✅ Compiled successfully (Turbopack, 16.1s)
- Zero TypeScript errors
- All routes generate correctly

### Previous Session 58 — Editor UX Polish (COMPLETE ✅)
- Export dropdown z-index fix (toolbar `relative z-50`)
- Pagination bottom safety buffer (12px)
- AI chat hint visibility fix
- Font pairing → compact dropdown
- Design panel accordion (exclusive open)
- Left panel exclusive accordion

### Session 55 — Editor Panel Layout Fix (COMPLETE ✅)
User reported editor panels were "super super narrow" and dragging made things worse. Deep audit revealed the root cause and all panels were fixed.

#### Root Cause
`react-resizable-panels` v4.6.5 treats **numeric size values as pixels** and **string values as percentages**. Our code used numeric values (`defaultSize={25}`, `minSize={0}`, `maxSize={35}`) which were interpreted as 25px, 0px, 35px — not percentages. This made panels start at ~25px wide instead of 25% of the viewport.

Additionally:
- `minSize={0}` (0px) allowed panels to be dragged to near-zero without snapping to collapsed state
- No imperative panel refs — collapse/expand was done via broken store state that didn't sync with actual panel sizes
- Content was conditionally rendered (`{!collapsed && <Component />}`) instead of always present

#### What Was Fixed

**1. StepEditor.tsx — Panel Layout Rewritten**
- Added `usePanelRef` from `react-resizable-panels` for imperative panel control (Reactive Resume pattern)
- Used `defaultLayout={{ "sections": 25, "preview": 50, "design": 25 }}` on Group (Layout type uses numbers as percentages)
- All Panel size constraints use strings for explicit percentages: `minSize="15"`, `maxSize="40"`, `collapsedSize="0"`
- Imperative `toggleLeftPanel`/`toggleRightPanel` callbacks use `.collapse()` / `.expand()` / `.isCollapsed()`
- Panel content always rendered (no conditional rendering)
- Removed store-based `leftPanelCollapsed`/`rightPanelCollapsed` reads

**2. EditorSectionsPanel.tsx — Accepts `onCollapse` Prop**
- Removed `useResumeEditorUI` dependency for `toggleLeftPanel`
- Collapse button now uses prop callback from StepEditor's imperative API

**3. EditorDesignPanel.tsx — Accepts `onCollapse` Prop**
- Removed `toggleRightPanel` store read
- Collapse button now uses prop callback from StepEditor's imperative API

**4. Build Verified**
- `tsc --noEmit`: zero errors
- `next build`: compiled successfully

#### Key Technical Learning
- `react-resizable-panels` v4.6.5 size props: **numeric = pixels**, **string = percentages**
- Group `defaultLayout` uses `Layout = { [id: string]: number }` where numbers ARE percentages (0-100)
- Panel-level props (`minSize`, `maxSize`, `collapsedSize`, `defaultSize`) use the numeric=px, string=% convention
- Reactive Resume uses `usePanelRef()` + Zustand store for imperative panel control — we now follow the same pattern

### Session 54 — Resume Editor UX Overhaul (COMPLETE ✅)
User showed screenshot of generated resume in editor — it works end-to-end but the editor UX was broken: side panels not visible, template designs not impressive, no visual template switching, only A4/Letter page sizes. Major overhaul completed.

#### What Was Done:

**1. Visual Template Carousel** — `src/components/workspaces/resume-cv/editor/TemplateCarousel.tsx`
- New component with horizontal scrollable carousel of 6 template thumbnails
- Each thumbnail is a schematic mini-preview showing the template's actual layout structure (sidebar position, header style, decoration type)
- Accent-color aware — thumbnails reflect the user's chosen primary color
- Slide-up animation from bottom toolbar via Framer Motion spring
- Active template shows check badge, hover reveals template name
- Scroll arrows appear when content overflows
- Active template auto-scrolls into view on open

**2. Bottom Toolbar v2** — `EditorBottomToolbar.tsx` rewritten
- Replaced old plain text template quick-switch buttons with carousel trigger
- Center button shows: Layout icon + current template name + expand/collapse chevron
- When clicked, the TemplateCarousel slides up from the bottom
- All undo/redo, AI, zoom controls preserved

**3. Expanded Page Dimensions** — `src/lib/resume/schema.ts`
- `pageFormatSchema` now includes: a4, letter, a5, b5, linkedin-banner, instagram-square
- `PAGE_DIMENSIONS` expanded: A5 (559×794), B5 (665×945), LinkedIn Banner (1584×396), Instagram Square (1080×1080)
- New `PAGE_FORMAT_LABELS` export: human-readable labels with "print"/"web" group for UI grouping
- `computeCSSVariables` automatically handles all new formats since it reads from `PAGE_DIMENSIONS[format]`

**4. Page Format Picker Updated** — `EditorDesignPanel.tsx`
- Design tab now shows two sections: "Print" (A4, US Letter, A5, B5) and "Web & Social" (LinkedIn Banner, Instagram Square)
- Uses `PAGE_FORMAT_LABELS` for rendering with proper grouping

**5. Preview Panel Auto-Scale** — `EditorPreviewPanel.tsx` rewritten
- Computes fit-to-width scale using ResizeObserver on container
- Combined scale = autoScale × (zoom/100) — artboard always fits within container
- Subtle dot-grid background to indicate artboard area
- Format label badge in bottom-left corner
- Better TransformWrapper config: velocityDisabled panning, maxScale=3

**6. Fixed Panel Layout** — `StepEditor.tsx`
- Panels now always rendered with `collapsible` and `collapsedSize={0}` props
- Previously, conditional rendering (`{!collapsed && <Panel>}`) broke react-resizable-panels Group when panels were toggled
- Separators always present — consistent 3-panel structure
- Removed unused `ResizeHandle` component (inlined Separators)

**7. Fixed TwoColumn Template** — `TwoColumnTemplate.tsx`
- Removed broken `opacity: 0.2` on sidebar aside element
- Removed broken `opacity: 5` on inner div wrapper (was making sidebar invisible)
- Sidebar now renders at full opacity with proper border

**8. Improved Template Designs**:
- **Classic**: Added 3px accent top border stripe (full-bleed), centered header with subtle color-mix bottom border
- **Modern**: Added 3px accent bottom border under header, sidebar divider now uses `color-mix(in srgb, accent 25%, transparent)` for softer look
- **Creative**: Increased header padding (1.2× margin-y) for bolder full-bleed feel, added 2px accent border on sidebar
- **Executive**: Distinguished double-line header border (1px thin + 2px thick with 3px gap) for elegant formal look
- **Minimal**: Unchanged — already clean and appropriate

**9. Build Verified**:
- `tsc --noEmit`: zero errors
- `next build`: compiled successfully, all routes generated

### Previous Session (Session 52) — Resume & CV Builder Prompt Rewrite (COMPLETE ✅)
User made a critical pivot: explicitly dismissed all previously built code as "not so good," confirmed that the Resume Builder's editor should wholesale adopt Reactive Resume's production-proven infrastructure. The RESUME-CV-BUILDER-PROMPT.md was comprehensively rewritten (now ~1,276 lines) to incorporate specific library choices, exact code patterns, and architectural details from RR.

**User's Directive:** "I highly suggest you really forget about everything else we did aside from what we're doing now, because I'm not impressed with anything that we built earlier. Everything will change as I'm building these things, the tools one by one."

#### What Changed in the Prompt Rewrite:

**1. Competitive Intelligence Header** — Rewritten to honestly state we're adopting RR's infrastructure wholesale, not just "studying" it. Names every specific library.

**2. Business Card References Softened** — Removed "gold-standard reference" language. Part 2 header changed to "(Wizard Flow Reference)" — the business card code is a pattern for the wizard UX only, NOT for the editor architecture.

**3. Required NPM Packages Section (NEW)** — Added a full table of 7 packages with install commands:
- `react-resizable-panels` — three-panel layout
- `react-zoom-pan-pinch` — artboard zoom/pan/pinch
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` — drag-and-drop
- `fast-json-patch` — RFC 6902 patch operations
- `immer` — Zustand immutable state middleware
- `zundo` — temporal undo/redo for Zustand
- `fast-deep-equal` — deep equality for zundo

**4. Two-Store Architecture** — Replaced single monolithic store with:
- Store 1: Wizard Store (`resume-cv-wizard.ts`) — persist + sessionStorage for Steps 1-6
- Store 2: Resume Editor Store (`resume-editor.ts`) — `temporal(immer(...))` pattern from RR with full code example showing WritableDraft, partialize, isDeepEqual, limit 100, useTemporalStore hook

**5. Three-Panel Layout** — Added complete `react-resizable-panels` code showing ResizableGroup/Panel/Separator with collapsible panels, imperative refs, and default sizes (25/50/25).

**6. Artboard Canvas** — Added complete `react-zoom-pan-pinch` code with TransformWrapper (centerOnInit, limitToBounds=false, minScale=0.3, initialScale=0.6, maxScale=6) and TransformComponent. useControls() hook for dock zoom buttons.

**7. Section DnD** — Replaced generic DnD with explicit `@dnd-kit` code: DndContext, PointerSensor with distance:6, two SortableContext zones (main/sidebar), verticalListSortingStrategy, onDragEnd handler.

**8. JSON Patch** — Updated all references to explicitly use `fast-json-patch` with RR's `applyResumePatches()` pattern (validate → apply → Zod safeParse). Added `jsonPatchOperationSchema` (Zod discriminated union) and `ResumePatchError` class.

**9. Bottom Dock** — Rewritten to use `useControls()` from react-zoom-pan-pinch and `useTemporalStore()` from zundo. Added Ctrl+Z/Y hotkey spec.

**10. Page Overflow Detection (NEW)** — Added ResizeObserver pattern from RR for detecting when content exceeds page dimensions, with code example.

**11. CSS Custom Properties** — Updated to match RR's exact naming: added `--page-width`, `--page-height`, `--page-body-font-family/size/weight/line-height`, `--page-heading-font-family/size/weight`, heading hierarchy with multipliers.

**12. Revision History** — Replaced manual snapshot-based undo/redo with zundo temporal (automatic) + separate AI revision timeline (for display).

**13. Quality Criteria Updated** — Items 17, 18, 24 now reference specific libraries (zundo, react-resizable-panels, @dnd-kit).

**14. Build Order Updated** — Step 3 now describes two-store architecture with `temporal(immer(...))`. Step 6 references fast-json-patch.

**15. Reference Files** — Added 8 Reactive Resume source files to study alongside the existing 13 DMSuite files. Reframed ai-patch.ts as "adapts this CONCEPT" not "MUST follow exactly."

**16. Guarantees Section** — Updated to name the specific libraries providing each guarantee.

#### 5 Deep GitHub Searches Completed on Reactive Resume:
1. Editor layout (panels, artboard, rendering, preview CSS)
2. Editor layout continued (dock, toolbar, DnD pages)
3. AI Chat system (chat.tsx, patch-resume tool, system prompt, patch.ts, MCP server)
4. Zustand store (resume.ts with temporal+immer, sidebar store, section store, AI settings store)
5. Zod schema (data.ts ~650 lines — complete schema with all section types, layout, metadata, defaults)

### Previous Sessions Summary
- **Sessions 40-50:** Business card wizard development (12+ sessions, 30 templates, AI generation, undo/redo, etc.)
- **Session 51:** Created initial RESUME-CV-BUILDER-PROMPT.md (967 lines, 9 parts)
- **Session 52 (this):** Rewrote prompt with RR architecture (now ~1,276 lines)
- Added `## Icon-to-Contact Mapping` section with exact iconId per contact type (phone→"phone", email→"email", etc.)
- Contact entries in user message now structured as `- Phone: +1 555... → use iconId: "phone"` instead of plain text
- Contact count awareness: AI gets density guidance based on how many fields (6+ = compact layout, 4-5 = normal, ≤3 = generous)

#### Fix 10: Industry Inference Includes Brief Text (DONE)
- `inferBrandContext()` now accepts optional `briefDescription` parameter
- Keyword matching now searches `title + company + brief` combined text
- User writing "we're a boutique architecture firm" in the brief now triggers the architecture industry context

#### Fix 11: Tagline Placement Guidance (DONE)
- Added `## Tagline Placement` section with explicit sizing (10-14px), weight (300-400), and placement advice
- When no tagline: "No tagline provided — skip this element"

#### Fix 12: Font-to-Industry Pairing Recommendations (DONE)
- Replaced vague "Choose fonts that match the industry" with 5 concrete font pairings per industry type

### Session 50a — UX Polish & Functional Fixes (Previous)
User tested the app and found 4 issues: AI changes not undoable, no card size selection, wizard too cluttered, loading animation text not progressing.

#### Fix 1: AI Undo/Redo (DONE)
- `commands.ts` — added `createSnapshotCommand(newDoc, label)` that captures `snapshotBefore` on execute, restores on undo
- `StepEditor.tsx` — replaced `setDoc()` calls with `execute(createSnapshotCommand(...))` so AI revisions go through the command stack and are fully undoable/redoable

#### Fix 2: Card Size Picker (DONE)
- `business-card-wizard.ts` — added `CardSize` type (`"standard" | "eu" | "square"`), `cardSize` field to `BriefState`, `setCardSize` action
- `StepBrief.tsx` — compact inline size toggle (Standard/EU/Square)
- `StepGeneration.tsx` — uses `CARD_SIZES[brief.cardSize]` instead of hardcoded `CARD_SIZES.standard`

#### Fix 3: Simplified Wizard (DONE)
- `StepBrief.tsx` — completely rewritten: removed separate company description textarea, removed "skip/proceed" text, reduced quick prompts from 8 to 6, removed `canProceed`/disabled logic, single textarea with 600 char limit, compact options row for Size + Sides

#### Fix 4: Loading Animation Fix (DONE)
- `GenerationLoadingAnimation.tsx` — rewritten to use `setInterval` (2200ms) instead of buggy `useEffect`/`setTimeout` chain
- Root cause: `Math.min(prev + 1, STATUS_STEPS.length - 1)` returned same value at last step, so `currentIndex` never changed and timer stopped
- Removed `AnimatePresence`, `completedSteps` state, `useRef`, `StatusStep` interface with `duration`
- New: single `activeIndex` state, `useCallback` for `renderStep`, simpler markup

### Session 49 — Design Quality Overhaul (Previous)
User tested AI-generated business cards and found the designs were off-brand (purple when logo was green/red/blue), overly dark/busy, and not matching real-world professional business card aesthetics.

#### Front-Only Card Option (NEW)
- `BriefState` — added `frontOnly: boolean` field (default false)
- `StepBrief.tsx` — added "Card sides" segmented toggle (Front + Back / Front Only) with helper text
- `setFrontOnly` action added to store
- `GenerationInput` — added `frontOnly?: boolean` field
- `ai-design-generator.ts` — conditionally switches based on `frontOnly`:
  - Response format changes from `{"front":...,"back":...}` to `{"front":...}`
  - System prompt constraint #6 changes: front-only tells AI to put everything on one side
  - JSON skeleton only includes front card (no back root frame)
  - Logo instructions change: front-only uses logo as medium-sized element on front; both-sides uses logo as HERO on back
  - Back Card Direction section omitted entirely for front-only
  - User message final line changes to "design only the front side"
- `StepGeneration.tsx` — passes `frontOnly: brief.frontOnly` in generation input; hides flip button and shows "Front Only" badge when front-only
- `StepEditor.tsx` — Front/Back toggle hidden when `brief.frontOnly` is true or no back doc exists
- Parser already supports `backDoc: null` — no parser changes needed

#### Logo Color Extraction
- `LogoState` — added `logoColors: string[]` field (up to 6 hex colors extracted from logo)
- `LogoState` — added `logoColors: string[]` field (up to 6 hex colors extracted from logo)
- `StepLogoUpload.tsx` — added `extractLogoColors()` function that renders logo to a 100px canvas, samples pixels, quantizes to nearest 16, filters out near-white/near-black, returns top 6 dominant colors sorted by frequency
- `setLogoColors` action added to store, colors persisted in sessionStorage
- Colors cleared on logo removal

#### AI Prompt — Logo Colors as Brand Colors (CRITICAL FIX)
- `ai-design-generator.ts` — System prompt constraint #7 added: "LOGO COLORS ARE BRAND COLORS — if provided, you MUST use them as your primary palette"
- User message `## Logo` section: when colors exist, shows exact hex values with instruction "Do NOT invent unrelated colors"
- User message `## Color & Typography` section: when logo colors exist, instructs to use them as foundation, white/light tints for backgrounds

#### AI Prompt — Design Philosophy Rewrite
- Removed "COMPLETE creative freedom" language that led to over-designed dark cards
- Added "Design Philosophy — CRITICAL" section emphasizing:
  - Clean white/light backgrounds (80%+ of real business cards)
  - Minimal decorative elements (professional cards don't have busy geometric patterns)
  - Name as hero — large, clear, readable
  - Tasteful 1-3 brand colors used strategically
  - "Think: Apple, law firm, architect, premium agency"
- Layout inspirations A-J rewritten: all clean/professional approaches (classic centered, left-aligned modern, minimalist, bordered elegance, etc.) — removed busy layouts (diagonal energy, layered depth, organic flow)

#### Company Description Field (NEW)
- `BriefState` — added `companyDescription: string` field
- `StepBrief.tsx` — added "What does the company do?" textarea (300 char limit) above the vision brief textarea
- `setCompanyDescription` action added to store
- AI prompt `## Company Description` section: passes description to AI so it understands the niche/industry/clientele
- Helps AI design appropriate cards (children's party planner vs corporate law firm)

#### Loading Animation — Text Only with Shimmer
- `GenerationLoadingAnimation.tsx` — completely rewritten:
  - REMOVED: 3D card flip mockup, all 13 SVG icon components, card skeleton, bordered container
  - NEW: Text-only ticker — clean list of status steps with shimmer overlay on active text
  - Active step swoops in from below with blur transition
  - Completed steps show checkmark and fade to 40% opacity
  - Shimmer sweeps across active step text (green-tinted gradient)
  - Progress bar with shimmer
  - Minimal header: pulsing dot + "AI Designer is working" + animated dots
  - 11 status steps (down from 13), simpler wording

### Previous Sessions (still active)

#### Wizard Flow Simplified
- **Old flow**: Logo → Details → Style → Generate → Edit → Export (6 steps, Style step was overly complex)
- **New flow**: Logo → Details → **Brief** → Generate → Edit → Export (6 steps, Brief is a simple text area)
- `StepStyleSelect.tsx` **DELETED** — no longer imported or used
- `StepBrief.tsx` **CREATED** (~165 lines) — free-text description of brand/vision, 500 char limit, 8 quick-start prompts, context preview
- `BusinessCardWorkspace.tsx` — case 3 renders `<StepBrief />` instead of `<StepStyleSelect />`
- `business-card-wizard.ts` — added `BriefState` interface, `brief` state + `setBriefDescription`, `DEFAULT_BRIEF`, persisted in sessionStorage

#### AI Gets Full Creative Freedom
- `ai-design-generator.ts` — prompt no longer sends style/color/font constraints
- New "## Creative Brief" section uses `brief.description` (if provided) with full creative freedom language
- New "## Color & Typography" section gives AI complete creative control
- Removed unused functions: `resolveStyleDescription`, `resolveFontFamily`
- Removed unused `MOOD_STYLE_DESCRIPTIONS` constant (~90 lines)
- Removed unused `FONT_FAMILIES` import

#### All Emoji → SVG Icons
- `WizardStepIndicator.tsx` — **COMPLETELY REWRITTEN** with 7 inline SVG icon components
- `GenerationLoadingAnimation.tsx` — **COMPLETELY REWRITTEN** with 13 inline SVG icon components + card flip animation
- `StepExport.tsx` — emoji replaced with 4 inline SVG icon components
- `StepGeneration.tsx` — Regenerate button emoji replaced with inline SVG refresh icon

#### Loading Animation: Card Flip + Shimmer
- `GenerationLoadingAnimation.tsx` — 3D card flip with `perspective: 1000px`, `rotateY`, `backfaceVisibility: hidden`
- Both faces have shimmer sweep, skeleton elements, "Front"/"Back" labels
- Cycles front↔back every 3.2s
- Status ticker uses SVG icons, not emoji

#### Regeneration Diversity Fix
- Local fallback seeds now use `Math.random() * 1000000` for entropy
- Style/mood pools shuffled with `sort(() => Math.random() - 0.5)` on each call

#### Mobile Responsiveness
- Editor sidebars hidden below `lg` breakpoint (`hidden lg:flex`)
- AI revision bar uses `flex-wrap`, chips row gets responsive ordering
- Grids responsive (`grid-cols-1 sm:grid-cols-2`, `grid-cols-2 sm:grid-cols-3`)
- Touch-friendly delete buttons (`sm:opacity-0 sm:group-hover:opacity-100`)
- Card preview width responsive (`Math.min(520, window.innerWidth - 64)`)

#### Tailwind v4 Syntax Cleanup
- All `bg-gradient-to-*` → `bg-linear-to-*`
- All `flex-shrink-0` → `shrink-0`
- `sm:order-none` → `sm:order-0`
- `max-w-[380px]` → `max-w-95`

#### Build Status
- TypeScript: ZERO errors (`tsc --noEmit` clean)
- Lint: ZERO remaining warnings (all fixed)

### Previous Session 48 Fixes (Still Active)
1. **Full-Screen Editor** — `fixed inset-0 z-50` for Step 5 ✅
2. **AI Revision Bar Elevated** — horizontal bar below toolbar ✅
3. **AI Prompt Quality Overhaul** — skeleton + layout inspirations A-J + random seed ✅
- **194 total tools** defined in tools.ts
- **96 tools** have dedicated workspace routes in page.tsx → status: "ready"
- **~90 tools** have NO workspace → status: "coming-soon"
- **8 tools** have NO workspace → status: "beta"
- **93 workspace component files** exist in `src/components/workspaces/`
- Build passes with zero TypeScript errors
- **AI-First Wizard System** — 13+ new files for business card wizard fully functional
- **Offline Fallback Generator** — wizard Step 4 works even when Anthropic API credits are exhausted
- **Fallback UI Banner** — yellow notice tells user when designs are template-generated, with "Retry with AI" button
- **Model**: `claude-sonnet-4-6` (Sonnet 4.6)
- **Single-design generation**: 1 focused API call
- **max_tokens: 24576** — increased from 16384 for full front+back card JSON output
- **FRONT + BACK card generation** — AI now generates both sides in one API call
- **COMPLETE BACK CARD EXAMPLE** — prompt includes full JSON example for both front AND back (icons + contact text)
- **Renderer z-order convention UNIFIED** — children[0]=behind, children[last]=on top across ALL systems
- **Renderer crash-proof** — applyStroke, applyPaintDirect, renderPath, renderText all have defensive null guards
- **repairStroke/repairStrokes** — normalizes malformed AI stroke objects into valid StrokeSpec
- **repairEffect** — ensures `enabled: true` default for AI-generated effects (drop shadows etc.)
- **Icon alias remapping** — validateAndFixDocument maps common AI icon mistakes to valid IDs
- **Ghost icon IDs removed** — "external-link" and "share" replaced with real "camera" and "user" IDs
- **Truncation detection** — callDesignAPI reads X-Truncated header and logs warning
- **Wizard step-skipping FIXED** — goToStep validation, onRehydrateStorage clamp
- **parseDesignResponse** — handles `{"front": {...}, "back": {...}}` envelope format
- **Shimmer loading animation** — skeleton card mockup with progress bar during AI generation
- **validateAndFixDocument** — post-parse validation for text size, off-canvas, z-order, fills, contrast, icons

## Recent Changes (Session 47 — Deep Forensic Audit)

### Deep Audit Findings & Fixes (Session 47 Part 5)
1. **CRITICAL: Incomplete back card example** — Prompt had `"back":{...similar structure with contact info...}` 
   - AI had to guess entire back card JSON structure → malformed/missing backs
   - FIX: Added complete back card JSON example with root frame, accent bar, company text, 3 icon+text contact pairs
2. **BUG: Ghost icon IDs** — AVAILABLE_ICON_IDS included "external-link" and "share" which don't exist in icon library
   - AI uses them → renders as blank circles
   - FIX: Replaced with "camera" and "user" (verified in ICON_BANK)
3. **BUG: Effects `enabled` never set** — `applyPreEffects` checks `!effect.enabled` but AI never outputs `enabled: true`
   - ALL AI-generated effects (drop shadows) were silently skipped
   - FIX: Added `repairEffect()` function that defaults `enabled` to `true`, repairs shadow colors
4. **Missing icon validation** — AI could output any random icon ID string
   - FIX: Added ICON_ALIASES map (20 common mistakes → valid IDs) in validateAndFixDocument
   - Also ensures minimum icon size (10px → 16px)
5. **X-Truncated header not read** — callDesignAPI discarded response headers
   - Truncation only caught by heuristic JSON repair
   - FIX: Now reads X-Truncated header and logs warning
- `generateMultipleDesigns()` hydrates both front and back docs through `hydrateImageLayers`
- `GenerationState` in wizard store adds `generatedBackDesigns` array
- `setGeneratedDesigns()` now accepts optional `backDesigns` parameter
- `StepGeneration.tsx`: sets both `setFrontDoc()` and `setBackDoc()` on design selection
- `CardPreviewFlip` in generation step now shows flip button when back doc exists
- `max_tokens` bumped to 24576 to accommodate front+back JSON output

### 5. Wizard Step-Skipping Fix (business-card-wizard.ts)
- `goToStep()`: Added validation — can only jump to steps ≤ `highestCompletedStep + 1`
- `onRehydrateStorage`: Clamps `currentStep` to max 4 on hydration since generation/documents aren't persisted
- Prevents the scenario where page refresh restores step 5/6 but no generated docs exist
- celtic-stripe: 25% strip width (correct), oval-diamond pattern, mirrored right on back
- premium-crest: Skyline front, key-skyline composite on back (key shaft, head, building cutouts, keyhole)
- gold-construct: 60/40 split, 3-column contact with dividers, world map dots + corner triangles on back
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
- **M3.12 Deep Audit + 12 Critical Fixes** — comprehensive 50-issue audit, 12 fixes implemented across 5 files (Session 38)
- **Session 40 — Premium Template Overhaul** — complete replacement of 20 old templates with 30 premium designs inspired by professional reference images; updated in both business-card-adapter.ts (~2611 lines) and BusinessCardWorkspace.tsx (~3795 lines)
- **Session 41 — Template Infrastructure** — TEMPLATE-SPECIFICATIONS.md (all 30 specs complete), LOGO-TREATMENT-SYSTEM.md (complete), card-template-helpers.ts (~950 lines) with shape builders, path generators, gradient helpers, logo treatment system, fixed color themes, typography helpers, contact layout variants, back-side framework, decorative element builders

## Recent Changes (Session 40 — Premium Template Overhaul)

### Complete Template Replacement — 20 Old → 30 New Premium Designs

Inspired by 30+ professional business card reference images provided by user. All old templates (executive-clean, swiss-grid, mono-type, nordic-frost, bold-split, neon-edge, geometric-modern, gradient-wave, corporate-stripe, diplomat, heritage-crest, engraved, diagonal-cut, layered-card, photo-overlay, dot-matrix, gold-foil, marble-luxe, velvet-noir, art-deco) completely removed and replaced.

#### 30 New Template IDs (5 categories × 6 templates):
- **Minimal**: ultra-minimal, monogram-luxe, geometric-mark, frame-minimal, split-vertical, diagonal-mono
- **Modern**: cyan-tech, corporate-chevron, zigzag-overlay, hex-split, dot-circle, wave-gradient
- **Classic**: circle-brand, full-color-back, engineering-pro, clean-accent, nature-clean, diamond-brand
- **Creative**: flowing-lines, neon-watermark, blueprint-tech, skyline-silhouette, world-map, diagonal-gold
- **Luxury**: luxury-divider, social-band, organic-pattern, celtic-stripe, premium-crest, gold-construct

#### Modified: `src/lib/editor/business-card-adapter.ts` (~2611 lines)
1. **COLOR_PRESETS**: 12 → 32 entries (added 20 industry-inspired themes)
2. **TEMPLATE_DEFAULT_THEMES**: 20 → 30 entries (new template→theme mappings)
3. **TEMPLATE_LIST**: 20 → 30 entries (new id, label, description, category for each)
4. **30 new layout functions**: Each creates semantic LayerV2[] trees with responsive sizing, proper contact blocks, logos, gradients, decorative elements; replaces 20 old functions
5. **LAYOUT_MAP**: Updated with 30 new entries mapping template IDs to layout functions
6. **Fallback template**: Changed from "executive-clean" to "ultra-minimal"

#### Modified: `src/components/workspaces/BusinessCardWorkspace.tsx` (~3795 lines)
1. **TEMPLATES array**: 20 → 30 entries (id, label, description for each)
2. **TEMPLATE_DEFAULT_THEMES**: 20 → 30 entries
3. **TEMPLATE_RENDERERS**: 30 new canvas renderer functions for thumbnail previews (each draws a visual representation of the template)
4. **styleMap**: Updated with 30 new template IDs mapped to thumbnail rendering styles
5. **Default config template**: Changed from "executive-clean" to "ultra-minimal"
6. **Renderer fallback**: Changed from "executive-clean" to "ultra-minimal"
7. **`logoShapeFor()` helper**: New function mapping fontStyle ("modern"→"square", "classic"→"circle", "elegant"→"circle", "bold"→"square", "minimal"→"none") to fix type mismatch in drawLogo calls
8. **All 21 drawLogo calls**: Updated to use `logoShapeFor(c.fontStyle)` instead of raw `c.fontStyle`
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
1. **Resume & CV Builder V2 — COMPLETE** ✅ — All 15 steps implemented, TypeScript clean
2. **Roll vNext editor to remaining canvas workspaces** — ~50+ workspaces still use legacy canvas rendering only (no editor toggle)
3. **Pro Features** — Blend modes, masks/clipping, gradients per-layer, text-on-path (infrastructure already in schema)
4. **AI revision via ai-patch for migrated workspaces** — PosterFlyer/BannerAd/SocialMediaPost need `handleEditorRevision()` like BusinessCard
5. **Architecture: Parametric layer system** — Explore combinatorial template builder (layer pools × color themes × layout grids) for infinite unique outputs without 1,000s of static templates
6. **Spot-check remaining agent-built workspaces** — 16 of 19 still unchecked
7. **Fix Math.random() flicker** — WhitePaper + MediaKit
8. **Enhance remaining thin workspaces** — 15 needs-enhancement workspaces
9. **Build missing tools (~90)** — video, audio, content-writing, marketing, web-ui, utilities
10. **Backend integrations** — Real video/audio/PDF processing
11. **Phase 5: Platform Maturity** — Auth, DB, payments, deployment

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
