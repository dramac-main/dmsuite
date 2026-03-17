# AI Prompt: Build the Resume & CV Builder for DMSuite

> **Purpose:** This is a comprehensive, word-only AI development prompt. Give this entire document to an AI coding assistant to build the Resume & CV Builder tool inside the DMSuite platform. The AI should read the existing codebase (the Business Card Wizard for wizard flow patterns, the icons system, and the UI primitives) and build this new tool following the architectural patterns defined in this document — which combines DMSuite conventions with production-proven infrastructure from Reactive Resume. The Resume Builder is fundamentally different from the Business Card tool (documents, not design canvases) and uses a different editor architecture.

> **Competitive Intelligence & Architectural Foundation:** This prompt was written after deeply studying **Reactive Resume** (https://github.com/amruthpillai/reactive-resume), the most popular open-source resume builder (26K+ GitHub stars, 13 templates, AI chat integration, multi-locale). We adopt their **production-proven editor infrastructure wholesale**: `react-resizable-panels` for the three-panel layout, `react-zoom-pan-pinch` for the artboard zoom/pan, `@dnd-kit/core` + `@dnd-kit/sortable` for section drag-and-drop, `fast-json-patch` for RFC 6902 patch operations, Zustand + `immer` middleware + `zundo` (temporal) for state management with undo/redo, parameterized templates with CSS custom properties, Zod-validated resume schemas, custom CSS via code editor, and ResizeObserver-based page overflow detection. These are solved engineering problems — we use their proven solutions. **Where we differentiate** is the AI layer on top: an AI-first guided wizard that generates complete resumes from minimal input, a dual-mode AI revision engine with validation pipeline and diff preview (RR only has a simple chat popover that fires JSON Patch blindly with no review), ATS scoring with actionable recommendations, job description matching, content fidelity toggle, proactive AI suggestions, and a premium visual experience. Their editor shell + our superior AI intelligence = a tool that works end-to-end.

---

## Part 1 — Context: What DMSuite Is

DMSuite is an AI-powered design and business creative suite built with Next.js 16+ (App Router, Turbopack), React 19, TypeScript in strict mode, Tailwind CSS v4 (using @theme inline in globals.css — never hardcoded hex values), Zustand 5 for state management, and Framer Motion for animations. The project uses a dark-first theme with light mode support. All interactive components are marked "use client". The design system uses custom color tokens (primary is electric-lime green, secondary is cyan/teal, gray is a slate scale), Inter for sans-serif, and JetBrains Mono for monospace. Icons are custom inline SVG components defined in src/components/icons.tsx with an iconMap registry — never use emoji in the UI, always use SVG icon components.

The app lives at src/app/ with tools loaded via dynamic imports at src/app/tools/[categoryId]/[toolId]/page.tsx. Each tool has a workspace component in src/components/workspaces/. Tool metadata is defined in src/data/tools.ts. The existing Resume & CV Builder entry has id "resume-cv" and already maps to a ResumeCVWorkspace component that will be completely replaced.

---

## Part 2 — The Existing Business Card Wizard (Wizard Flow Reference)

The Business Card Wizard is the first tool built in DMSuite. Skim the files in src/components/workspaces/business-card/ and the store at src/stores/business-card-wizard.ts to understand the WIZARD FLOW pattern (multi-step navigation, Zustand persistence, auto-generation on mount). The wizard UX pattern is what you should replicate. However, the Resume Builder's EDITOR (Step 7) uses a completely different architecture based on Reactive Resume's production-proven infrastructure — see Part 4 for the specific libraries and patterns. Here is the wizard philosophy:

It is a six-step full-screen wizard flow. Step one collects the company logo with drag-and-drop upload and automatically extracts dominant brand colors from the logo pixels. Step two collects user details — name, title, company, tagline, email, phone, website, address, and social media handles — organized into collapsible sections (Identity, Contact, Social). Step three is the creative brief — a single free-text textarea where the user describes their vision, plus quick-start suggestion chips, and compact toggles for card size and front-only mode. Step four auto-triggers AI generation on mount, showing a sophisticated loading animation (see below). Step five is a full-screen canvas editor for fine-tuning the generated design. Step six is export (PNG, PDF, clipboard).

The wizard state is managed by a dedicated Zustand store with sessionStorage persistence. The store tracks the current step number, the highest completed step (so users can navigate back), step direction for animations (forward or backward), and all collected data. The persistence is intelligent — it serializes only the user-input data (logo, details, brief, style) but does NOT persist generated designs or documents (those are regenerated if the user returns to the generation step).

The wizard UI has a header with a horizontal step indicator showing dots with icons, clickable for completed steps, with connector lines between them. Step transitions use Framer Motion's AnimatePresence with slide-up and slide-down animations depending on direction. The editor step (step five) breaks out of the wizard into a fixed full-screen overlay.

The loading animation during AI generation (GenerationLoadingAnimation component) shows eleven sequential status steps at two-point-two-second intervals: "Reading your brand details", "Studying your logo", "Understanding your industry", "Selecting the color palette", "Choosing typography", "Composing the layout", "Placing contact details", "Designing the back side", "Adding finishing touches", "Polishing for print", "Almost there". Each step has a main text and detail subtitle. The active step shows a pulsing green dot and a shimmer gradient overlay that sweeps across the text. Completed steps fade to lower opacity with a green checkmark. A progress bar at the bottom with shimmer effect shows percentage and step count. The header reads "AI Designer is working" with animated dots.

This pattern — wizard with persistent state, AI generation with rich loading UX, and a polished result view — is what you must replicate for the Resume Builder, adapted for the different content type.

---

## Part 3 — What You Are Building: The AI Resume & CV Builder

### Core Philosophy

This tool is NOT a traditional form-based resume builder where the user fills out twenty fields and picks a template. It is an AI-first experience where the user provides minimal structured input through a conversational, guided wizard, and the AI does the heavy lifting — writing professional bullet points, optimizing for ATS systems, choosing the right layout, and producing a beautiful, print-ready, ATS-compliant resume as an HTML document that exports to PDF with selectable text.

The target user is someone who might not be tech-savvy. They might be a first-time job seeker, a career changer, or someone who just hates writing about themselves. The wizard must feel effortless — like talking to a career coach, not filling out a government form. Every step should collect the minimum necessary information while making the user feel guided and supported.

The output is fundamentally different from the Business Card tool. Resumes are DOCUMENTS, not design canvases. The rendering pipeline should be HTML/CSS-based (not Canvas2D) because resumes need selectable text, must be ATS-parseable, and need to produce clean PDF output. The preview should be a live-rendered HTML document displayed in the workspace, and the export should use a headless HTML-to-PDF pipeline (or jsPDF with structured text rendering — not canvas-to-image).

### The Wizard Flow: Seven Steps

#### Step 1 — "Let's get started" (Who are you?)

This is the warmest, most welcoming step. Full-screen with a large friendly heading like "Let's build your resume" and a subtitle like "We'll guide you through it — just answer a few questions." The vibe should feel like a modern onboarding flow (think Notion, Linear, or Duolingo's setup) — not a job application form.

Collect ONLY the essentials on this screen:
- Full name (required — single text input, placeholder "Your full name")
- Email address (required — validated format)
- Phone number (optional — with country code hint)
- Location (optional — city and state or country, NOT full address — a simple text input like "San Francisco, CA" or "London, UK")
- LinkedIn URL (optional)
- Portfolio or personal website URL (optional)

Layout: Use a clean centered card layout on a subtle gradient background. Fields should be large, well-spaced, with clear labels. Group them visually — name and email as the primary pair, then phone and location as a secondary pair, then LinkedIn and website as an optional pair (maybe in a collapsible "Add more" section so the initial view is ultra-clean). A "Continue" button at the bottom, enabled as soon as name and email are filled.

Do NOT ask for a headshot photo. Do NOT ask for date of birth, nationality, gender, or any other protected-class information — this is a modern resume builder and those fields are inappropriate in most Western job markets and many others globally.

#### Step 2 — "What do you do?" (Target role)

This step establishes what kind of resume to generate. It should feel like a conversation.

Collect:
- Target job title (required — what role are they applying for? Example: "Senior Product Designer", "Marketing Manager", "Full-Stack Developer"). This should be a prominent single text input with autocomplete suggestions if possible, or at minimum smart placeholder text that cycles through examples.
- Experience level — a simple segmented toggle or pill selector with four options: "Entry Level (0-2 years)", "Mid Level (3-5 years)", "Senior (6-10 years)", "Executive (10+ years)". This dramatically changes how the AI writes the resume — entry level emphasizes education, projects, and potential; executive emphasizes leadership, strategy, and impact metrics.
- Industry or field (optional but helpful) — a searchable dropdown or free text input. Examples: Technology, Healthcare, Finance, Education, Marketing, Design, Engineering, Legal, Consulting, Retail, Hospitality, Government, Non-profit, Other. This helps the AI choose the right tone, keywords, and section ordering.

Optional: A small text area (three hundred characters max) for "Anything specific about the role?" — like "I'm transitioning from teaching to UX design" or "Applying to FAANG companies" or "This is for a government position that requires a specific format." This gives the AI crucial context without requiring the user to know what to do with it.

This step should also show a subtle preview of what the AI will do with this information — maybe a small animated hint like "We'll tailor your summary, keywords, and section order for this exact role."

#### Step 3 — "Your experience" (Work history)

This is where most resume builders lose people because they demand too much detail upfront. Our approach: ask for the MINIMUM and let AI enhance it.

For each work experience entry, collect:
- Company name (required)
- Job title at that company (required)
- Start date and end date (month/year pickers, with a "Current" toggle for the end date)
- A single text area for what they did there (optional — three to five hundred characters max). The placeholder should say something like "Briefly describe what you did — the AI will turn this into professional bullet points" or "e.g., Led a team of 5, increased sales by 30%, managed client accounts". The user can write in casual, incomplete sentences — the AI will professionalize them.

Start with one empty experience entry. A subtle "Add another position" button below it. Allow reordering with drag handles. Allow deleting entries. Cap at maybe eight entries — if someone has more than eight jobs, the AI should help them decide which to include based on relevance.

For the experience level of "Entry Level", if the user has zero work experience, show an encouraging message like "No work experience yet? No problem — we'll highlight your education, projects, and skills instead" and make this step skippable.

The key UX principle: do NOT ask the user to write bullet points. Do NOT show three separate "achievement" text fields per job. One free-text area per job where they dump whatever they remember, and the AI transforms it into polished, quantified, action-verb-led bullet points.

#### Step 4 — "Your education & skills" (The rest)

This step collects everything else, organized into clearly separated sections on one screen (not sub-steps — that would feel like too many clicks):

Education section:
- Institution name
- Degree type (dropdown: High School Diploma, Associate's, Bachelor's, Master's, Doctorate/PhD, Professional Certification, Bootcamp/Course, Other)
- Field of study (free text — "Computer Science", "Business Administration", etc.)
- Graduation year (or "Expected 2027")
- Start with one entry, "Add another" button, allow delete. Make this section skippable if the user has extensive work experience.

Skills section:
- A tag-input field where the user types skills and presses Enter or comma to add them as chips/tags. Placeholder: "Type a skill and press Enter — e.g., Python, Project Management, Adobe Photoshop"
- An "AI Suggest Skills" button that, based on the target job title from step two, instantly suggests ten to fifteen relevant skills as clickable chips that the user can tap to add. This is a small AI call (or even a local lookup table) that makes the user feel like the tool "gets" them.
- Maximum twenty to twenty-five skills displayed as a wrapped tag cloud.

Optional sections (presented as expandable/collapsible cards — collapsed by default so the screen isn't overwhelming):
- Certifications (name, issuing organization, year — simple repeating entries)
- Languages (language name, proficiency level as a dropdown: Native, Fluent, Intermediate, Basic)
- Volunteer experience (organization, role, brief description)
- Projects (project name, brief description, optional URL — great for entry-level candidates)

The principle: the main screen shows Education and Skills prominently. The optional sections are discoverable but tucked away. Users who need them can expand them; users who don't aren't overwhelmed.

#### Step 5 — "Your vision" (Creative brief + preferences)

This is the equivalent of the Business Card wizard's "Brief" step. It bridges the structured data and the AI generation.

A single, prominent text area (six hundred characters max) with the heading "Any special instructions?" and placeholder text like "Tell us anything else — career gaps to address, tone you prefer, specific achievements to highlight, or just 'make it great'". Beneath the text area, show six to eight quick-start chips (clickable to populate the textarea) such as:
- "Keep it clean and professional"
- "I'm changing careers — emphasize transferable skills"
- "Highlight leadership and management"
- "Make it creative and stand out visually"
- "Optimize for ATS — maximum keyword matching"
- "I have career gaps — help me frame them positively"
- "Entry-level — focus on potential, not experience"
- "Executive tone — strategic and high-level"

Below the text area, show a compact options row (similar to the Business Card brief step):
- Resume style toggle: "Professional" (default, clean, ATS-optimized), "Modern" (more visual flair, subtle color), "Creative" (bolder design, for creative industries), "Executive" (formal, traditional)
- Page count preference: "One Page" (default for most), "Two Pages" (for senior/executive), "Auto (AI decides)"
- Color accent: a row of eight to ten preset accent color swatches (deep blue, teal, burgundy, forest green, slate, navy, dark purple, charcoal — professional, muted tones appropriate for resumes, NOT bright neons) plus a custom color picker. This accent color will be used for headings, lines, sidebar backgrounds, and other design elements.

#### Content Fidelity Toggle — AI Enhancement Mode

This is a CRITICAL user preference that fundamentally changes how the AI processes their content. It must be prominently displayed on this step — not buried in settings — because it represents a major philosophical choice.

Show a clearly labeled toggle section with a heading like "How should AI handle your content?" and two options presented as selectable cards (not a tiny checkbox):

**Option A — "Keep My Exact Words"** (icon: shield-check or lock)
When selected, the AI will ONLY format, arrange, and visually design the resume. It will NOT rewrite any text the user provided. The user's exact job descriptions, exact skill names, exact summary (if they wrote one in the brief) are preserved word-for-word. The AI's job is purely structural and visual — choosing the right template, arranging sections optimally, applying typography and spacing, and calculating an ATS score. This is for users who are confident writers, have already had their content reviewed by a career coach, or work in fields where exact phrasing matters (legal, medical, academic).

Show a subtle explanation beneath: "Your words, your way. AI will design and arrange your resume but won't change what you wrote."

**Option B — "AI Enhanced" (Recommended)** (icon: sparkles or wand) — this is the DEFAULT
When selected, the AI has full creative license to rewrite, improve, expand, and polish all content. It will transform casual descriptions into professional bullet points with strong action verbs. It will quantify achievements where possible (inferring metrics from context). It will write a professional summary from scratch. It will reorganize and prioritize skills. It will optimize keyword density for ATS. This is the magic mode — the whole reason this tool exists.

Show a subtle explanation beneath: "Let AI work its magic. Your content will be professionally rewritten with action verbs, metrics, and ATS-optimized keywords."

The toggle state must be stored in the Zustand store and passed to the AI generation prompt in step six, where it FUNDAMENTALLY changes the system prompt. In "Keep My Exact Words" mode, the system prompt explicitly instructs: "Do NOT rewrite, rephrase, or alter any user-provided text. Use their exact words. Your job is layout, design, section ordering, and ATS scoring only." In "AI Enhanced" mode, the system prompt says: "You are a world-class resume writer. Rewrite all content to be professional, impactful, and ATS-optimized."

Between the two cards, show a brief animated comparison — when the user hovers over or selects "AI Enhanced", show a mini before/after example:
- Before: "I managed people and did sales stuff for 3 years"
- After: "Led a cross-functional team of 12, driving $2.4M in annual revenue growth through strategic account management and pipeline optimization"

This makes the value proposition of AI Enhancement viscerally clear.

#### Job Description Paste (Optional Power Feature)

Below the content fidelity toggle, show a collapsible card labeled "Have a specific job posting? Paste it here" with a sparkles icon. When expanded, it reveals a large text area where the user can paste an entire job description or job posting URL. This is a GAME-CHANGER feature:

When a job description is provided, the AI will:
- Extract the key requirements, skills, and qualifications from the posting
- Tailor the entire resume to match — emphasizing relevant experience, surfacing matching skills, using the same terminology the employer used
- Optimize keyword density specifically for THAT job's ATS filters
- Adjust the professional summary to directly address the role's core requirements
- In the ATS score breakdown (visible in step seven), show a "Job Match Score" alongside the general ATS score — how well does this resume match THIS specific posting?

The placeholder text should say: "Paste the full job description here and we'll tailor your resume specifically for this role. This dramatically improves your chances of getting past ATS filters."

Store the pasted job description in the Zustand store. Pass it to the AI prompt as a critical context section.

At the bottom of the step, show a "What the AI knows" preview card — a compact read-only summary of everything collected so far: "John Smith — Senior Product Designer — 3 positions at Google, Meta, Startup — MS in HCI from Stanford — 12 skills — Professional style, one page — AI Enhanced mode — Job posting provided." This reassures the user that their data is captured and gives them a chance to go back and edit before generating.

#### Step 6 — "Generating your resume" (AI generation + loading experience)

This step auto-triggers on mount, exactly like the Business Card generation step. The user does NOT click a "Generate" button — entering this step IS the generation trigger.

The loading experience must be world-class. Show a full-screen loading state with sequential shimmering status messages that update every two to two-and-a-half seconds, creating the feeling that real work is happening behind the scenes. The status steps should be:

1. "Analyzing your career profile" (detail: "Understanding your experience and goals")
2. "Researching industry keywords" (detail: "Finding the terms recruiters search for")
3. "Writing your professional summary" (detail: "Crafting a compelling opening statement")
4. "Polishing your work experience" (detail: "Turning your notes into achievement bullets")
5. "Organizing your skills and education" (detail: "Prioritizing what matters most")
6. "Optimizing for ATS systems" (detail: "Ensuring your resume passes automated screening")
7. "Selecting the perfect layout" (detail: "Choosing a design that matches your industry")
8. "Applying typography and styling" (detail: "Fine-tuning fonts, spacing, and visual hierarchy")
9. "Running a final quality check" (detail: "Reviewing everything for consistency")
10. "Almost ready" (detail: "Your resume is looking great")

Use the exact same visual pattern as the Business Card loading animation: pulsing green dot on the active step, shimmer gradient sweep across active text, completed steps fade with green checkmark, progress bar at bottom with shimmer effect and percentage. Header says "AI Resume Writer is working" with animated dots. Look at GenerationLoadingAnimation.tsx in the business card folder and replicate its visual design language exactly, but with the resume-specific status messages.

What the AI actually does during generation: It calls the design API endpoint (the same /api/chat/design route used by the business card tool) with a carefully crafted system prompt and user message. The system prompt instructs Claude to act as an expert resume writer and document designer. The user message passes all the collected wizard data. The AI returns a structured JSON response containing: the complete resume content (professional summary, reformulated experience bullet points with quantified achievements, organized skills, optimized section ordering), the visual design specification (which template layout to use, typography, colors, spacing), and an ATS optimization score with specific recommendations. The response format and the prompt engineering are critical — study how the business card tool's ai-design-generator.ts builds its prompts (the buildDesignGenerationPrompt function) for the pattern of system prompt plus user message yielding structured JSON.

After generation succeeds, transition to step seven with the result.

If generation fails (API down, network error), show a friendly error state with a "Try Again" button and a "Use a basic template instead" fallback option that generates a clean resume from the structured data alone without AI enhancement. Never leave the user stranded.

#### Step 7 — "Your resume" (The AI-Powered Document Studio)

This is the crown jewel of the entire tool — an INDUSTRY-STANDARD document editing studio that rivals Canva, Zety, Kickresume, and Notion's document editor. It is NOT a simple preview with a few edit buttons. It is a full-screen, immersive workspace that makes the user feel like they are using a world-class document design application. Study how Canva's resume editor, Google Docs, Notion, and Linear's interfaces work — this step should feel that premium.

**CRITICAL DESIGN PHILOSOPHY: AI-FIRST EDITING.** The primary way users edit their resume in this step is through AI prompts — NOT manual text editing. Manual editing exists as a secondary option for fine-tuning, but the AI prompt interface is the MOST PROMINENT, most accessible, most encouraged interaction pattern. Think of it like this: the AI is the user's personal career coach sitting right next to them, and the user just tells the coach what they want changed. The coach does the work.

##### Full-Screen Takeover

When the user enters step seven, the workspace breaks out of the wizard into a `fixed inset-0 z-50` full-screen overlay (exactly like the Business Card editor in step five). The wizard step indicator collapses into a minimal top bar with just the DMSuite logo, a "Back to wizard" button, and essential controls. The entire viewport becomes the document studio. There is NO visible wizard chrome — this is a standalone editing environment.

##### Three-Panel Layout (Desktop)

The desktop layout is a three-panel design with a floating AI command bar:

**THE THREE-PANEL LAYOUT — Built with `react-resizable-panels`**

The Step 7 editor uses `react-resizable-panels` (the same library Reactive Resume uses) for its three-panel layout. This gives us drag-to-resize separators, collapsible panels with imperative handles, and persisted layout sizes — all production-tested. The structure:

```
<ResizableGroup direction="horizontal" style={{ height: 'calc(100svh - 3.5rem)' }}>
  <ResizablePanel
    ref={leftPanelRef}
    defaultSize={25}
    minSize={15}
    collapsible
    collapsedSize={0}
    onCollapse={() => setLeftCollapsed(true)}
    onExpand={() => setLeftCollapsed(false)}
  >
    <AIRevisionPanel />
  </ResizablePanel>

  <ResizableSeparator />

  <ResizablePanel defaultSize={50} minSize={30}>
    {/* Artboard with zoom/pan — see TransformWrapper below */}
    <DocumentCanvas />
    <BuilderDock />
  </ResizablePanel>

  <ResizableSeparator />

  <ResizablePanel
    ref={rightPanelRef}
    defaultSize={25}
    minSize={15}
    collapsible
    collapsedSize={0}
    onCollapse={() => setRightCollapsed(true)}
    onExpand={() => setRightCollapsed(false)}
  >
    <DesignControlsPanel />
  </ResizablePanel>
</ResizableGroup>
```

Store the panel refs in the editor UI store so other components can programmatically collapse/expand panels (e.g., clicking the ATS mini-badge in the dock expands the right panel and scrolls to the ATS section). On mobile (below `lg`), hide both sidebars entirely and use a tabbed interface instead.

**LEFT PANEL — AI Revision & Navigation (roughly twenty-five percent width, collapsible)**

This panel is the AI-first control center. It has two tabs or sections:

Section 1 — "AI Assistant" (primary, shown by default):
- A prominent AI prompt input at the top — a tall, multi-line textarea with a glowing border animation (subtle pulse in primary-500 green) and placeholder text that cycles through examples every three seconds: "Make my summary more impactful...", "Add keywords for product management...", "Fit everything on one page...", "Rewrite experience at Google to focus on leadership...", "Make it more formal and executive-level...", "Remove the volunteer section..."
- A "Send to AI" button (or Enter to submit) with a sparkles icon
- Below the input, a grid of contextual AI quick-action chips organized into categories:
  - **Content**: "Shorten this", "Expand this", "More formal", "More creative", "Stronger action verbs", "Quantify achievements", "Add metrics"
  - **Optimization**: "Fit to one page", "Add ATS keywords", "Optimize for [job title]", "Remove filler words", "Strengthen summary"
  - **Structure**: "Reorder sections", "Merge similar roles", "Remove oldest position", "Add a skills section", "Split into two pages"
  - **Tailoring**: "Tailor for this job posting" (only visible if they pasted a job description in step five), "Emphasize leadership", "Emphasize technical skills", "Career change framing"
- Each chip click instantly sends that instruction to the AI. While the AI processes, show a subtle thinking animation in the prompt area (three pulsing dots with shimmer, like an AI chat interface).
- Below the chips, show an "AI Revision History" — a scrollable timeline of every AI change made in this session. Each entry shows: the instruction ("Shortened summary"), a timestamp, and an "Undo" button. This is the VERSION HISTORY system — users can step backward through any AI revision. Clicking "Undo" on a revision reverts the resume to its state before that change. Show a diff preview (highlighted additions in green, removals in red with strikethrough) when hovering over a history entry, so the user can see exactly what changed.

Section 2 — "Sections" (secondary tab):
- A navigable list of all resume sections in their current order, organized by their layout position: "Main Area" and "Sidebar" (for two-column templates). This follows Reactive Resume's per-page layout model where sections can be assigned to main or sidebar areas.
- Each section has a drag handle for reordering (both within a column AND between main/sidebar — dragging a section from "Main" to "Sidebar" moves it to the sidebar area and vice versa), a visibility toggle (eye icon to hide/show a section without deleting it), and a three-dot menu with options: "AI Rewrite this section", "Delete", "Duplicate", "Move to Main" / "Move to Sidebar"
- For single-column templates (Classic, Minimal, Executive), all sections are in "Main" and the sidebar area is hidden
- Clicking a section name smooth-scrolls the center canvas to that section
- An "Add Section" button at the bottom with a dropdown of available section types (Volunteer Experience, Projects, Publications, Awards, References, Custom Section — where "Custom Section" prompts for a name)
- Section reordering via drag-and-drop updates the live preview instantly
- For multi-page resumes, show page dividers in the section list so users can see which sections land on which page

**CENTER PANEL — The Document Canvas (remaining width, the hero element)**

This is the main event. Built with `react-zoom-pan-pinch` (the same library Reactive Resume uses for its artboard). The canvas area uses fixed positioning (`inset-0` within the panel) with the resume pages rendered inside a `TransformWrapper` + `TransformComponent`:

```
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

<TransformWrapper
  centerOnInit
  limitToBounds={false}
  minScale={0.3}
  initialScale={0.6}  // Start zoomed out to see the full page
  maxScale={6}
>
  <TransformComponent wrapperClass="!w-full !h-full" contentClass="flex flex-col items-center gap-8 p-16">
    <ResumePreview />
  </TransformComponent>
</TransformWrapper>
```

The `useControls()` hook (from react-zoom-pan-pinch) provides `zoomIn()`, `zoomOut()`, and `centerView()` functions — wire these to the bottom dock's zoom buttons. Pinch-to-zoom works on mobile. Ctrl+scroll zooms on desktop.

This is the heart of the studio — a gorgeous, pixel-perfect rendering of the resume as a real document. It must look and feel like you are staring at a beautifully printed piece of paper.

Visual presentation:
- Dark gray workspace background (gray-900) with the resume pages rendered as crisp white (or template-colored) rectangles with a realistic paper shadow (soft, multi-layered box-shadow — `shadow-2xl` is a starting point but consider a custom `0 4px 6px -1px rgba(0,0,0,0.1), 0 25px 50px -12px rgba(0,0,0,0.25)` for a premium floated-paper look), floating on the dark workspace
- The page should be rendered at proper A4 or US Letter aspect ratio (the user can toggle between these in the right panel)
- The page content is rendered as live HTML/CSS — NOT as an image or canvas. This means text is selectable, copyable, and real.
- Zoom is handled entirely by `react-zoom-pan-pinch` — the `TransformWrapper` controls scale/pan, and the dock's zoom buttons use the `useControls()` hook. No custom zoom implementation needed.
- For multi-page resumes, show pages stacked vertically with a gap between them (inside the `TransformComponent`'s `contentClass`), and a subtle page break indicator line with "Page 1 of 2" labels. Scrolling is vertical within the pan area.
- Optional premium touches: subtle grid lines or ruler marks along the top and left edges of the canvas (like InDesign or Figma), toggleable in the right panel settings.

Inline editing (SECONDARY to AI editing, but still available):
- When the user clicks directly on any text element in the rendered resume, that text becomes editable in-place. A subtle blue outline appears around the editable area. The user can type directly into the resume preview.
- When inline editing is active, a small floating toolbar appears above the selection with basic formatting: bold, italic, and a "Revert" button (to undo manual edits to that field).
- Changes from inline editing update the Zustand store immediately and the document re-renders in real-time.
- The inline editing is intentionally MINIMAL — we do NOT want a full rich-text editor here because the AI is the primary editor. Inline editing is for quick typo fixes, not rewriting paragraphs. If the user starts typing more than a sentence or two, show a subtle hint: "Tip: Try telling the AI what you want changed — it's faster!"

AI revision preview overlay:
- When the AI returns a revision (from any AI action — the prompt bar, a quick chip, or a section-level rewrite), do NOT immediately apply it. Instead, show a beautiful diff overlay on the canvas: changed text is highlighted with a subtle green background glow for additions and a red strikethrough with faded opacity for removals. An overlay bar appears at the top of the canvas: "AI made changes — [Accept All] [Reject All] [Review Changes]". "Review Changes" opens a modal or slide-over with a side-by-side or inline diff of the full resume content changes. Only after the user clicks "Accept" do the changes commit to the Zustand store. This gives the user complete control and builds trust with the AI.

**RIGHT PANEL — Design Controls (roughly twenty-five percent width, collapsible)**

This panel handles the visual design of the resume — template, fonts, colors, spacing — everything that does NOT involve content. It has several collapsible sections:

Section 1 — "Template" (expanded by default):
- A grid of template thumbnails (three columns, scrollable). Each thumbnail is a tiny but recognizable preview of the resume rendered in that template — generated using the actual TemplateRenderer at a tiny scale with the user's real data. The currently selected template has a glowing green border. Clicking a template re-renders the resume INSTANTLY — the content stays the same, only the layout structure changes. This is the core power of the parameterized template architecture.
- Templates: Classic (single column, serif name heading, clean horizontal dividers), Modern (left sidebar with contact and skills, main area for experience, sans-serif, accent color bars), Two-Column (balanced two-column layout — skills/education on one side, experience on the other), Minimal (extreme whitespace, typographic hierarchy only, no decorative elements, no color), Executive (formal, traditional, serif fonts, conservative spacing, subtle navy or charcoal accents), Creative (bold accent color blocks, unique section styling, asymmetric layout — for design, marketing, and creative roles)
- Below the grid, a "More templates coming soon" placeholder with a sparkles icon

Section 2 — "Typography":
- Font family selector: a dropdown with curated professional font pairings. Each option shows a preview of how the fonts look. Pairings like: "Inter + Georgia" (modern sans with classic serif), "Playfair Display + Source Sans" (elegant heading with clean body), "Roboto + Roboto Slab" (geometric consistency), "Merriweather + Open Sans" (warm readable), "Lato + Lora" (friendly professional). Limit to eight to ten pairings — do not overwhelm with a font picker that has two hundred options.
- Font size scale: a slider or segmented control with "Compact", "Standard", "Spacious" — adjusting the overall type scale (not individual fonts but the ratio — compact reduces everything by about ten percent, spacious increases by about ten percent)

Section 3 — "Colors":
- Accent color: the same row of eight to ten professional color swatches from step five, plus a custom picker. Changing the accent color updates the template rendering instantly.
- Color intensity: a subtle slider from "Subtle" to "Bold" controlling how prominently the accent color is used (subtle might only use it for thin lines and heading text, bold might use it for sidebar backgrounds and section bars)

Section 4 — "Layout & Spacing":
- Page size toggle: "US Letter" vs "A4"
- Margin adjustment: "Narrow", "Standard", "Wide" — affecting the page margins (mapped to CSS custom properties --page-margin-x and --page-margin-y)
- Section spacing: "Compact", "Standard", "Relaxed" — controlling the vertical space between resume sections (mapped to --page-gap-y)
- Line spacing: "Tight", "Normal", "Loose" — controlling within-paragraph line height
- Sidebar width slider (only visible for two-column templates): 25% to 45% range — controlling how wide the sidebar area is (mapped to --page-sidebar-width). This is inspired by Reactive Resume's sidebar width control.

Section 5 — "Custom CSS" (collapsed by default, advanced feature):
- A toggle to enable/disable custom CSS
- When enabled, a monospace code textarea where users can write CSS to override any template styling
- A warning banner: "Custom CSS may affect ATS compatibility and print rendering"
- Three to four example snippets as clickable chips: "Colored section headings", "Custom sidebar background", "Thin separator lines", "Compact bullet spacing"
- This is a proven power-user feature from Reactive Resume that adds unlimited customization without complicating the main UI

Section 6 — "ATS Score Breakdown" (always visible, not collapsible):
- A large, animated score number at the top (e.g., "87" with a circular progress ring around it that fills to eighty-seven percent, color-coded: green for eighty-plus, amber for sixty to eighty, red below sixty)
- Below the score, a detailed breakdown of scoring categories, each as a mini progress bar:
  - Contact completeness: "10/10" with green bar
  - Professional summary: "13/15" with green bar
  - Work experience quality: "16/20" with green bar, with a note "Add metrics to 2 more bullet points"
  - Skills relevance: "12/15" with amber bar, with a note "Add 3 more keywords matching target role"
  - Education: "10/10" with green bar
  - Section headings: "8/10" with green bar, note "Consider renaming 'What I Know' to 'Skills'"
  - Resume length: "10/10" with green bar
  - No red flags: "8/10" with amber bar, note "Career gap between 2019-2020 not addressed"
- Each recommendation is ACTIONABLE — clicking on a recommendation text triggers the corresponding AI fix. For example, clicking "Add metrics to 2 more bullet points" sends that instruction to the AI revision system and the user sees the diff overlay on the canvas. This creates a virtuous feedback loop: see the issue, click to fix it, watch the score update in real-time.
- If the user provided a job description in step five, show a second score: "Job Match: 74%" with similar breakdown showing which requirements from the posting are met vs. missing, and clickable fixes for each gap.

##### The AI Command Palette (Keyboard-First Power Feature)

In addition to the left panel's AI prompt bar, implement a command-palette-style AI interface triggered by Cmd+K (Mac) or Ctrl+K (Windows). This is for power users. When triggered:
- A centered modal overlay appears (like VS Code's command palette or Raycast) with a text input
- The placeholder says "Ask AI anything about your resume..."
- The user types a natural language instruction and presses Enter
- The palette closes, the AI processes, and the diff overlay appears on the canvas
- This is the fastest way to make AI edits — no need to look at the left panel at all
- Show a subtle keyboard shortcut hint in the top-right corner of the editor: "⌘K for AI"

##### Fixed Bottom Toolbar (The "Dock" — Inspired by Reactive Resume)

A sleek, floating toolbar at the bottom-center of the full-screen editor (like Reactive Resume's BuilderDock). This uses `react-zoom-pan-pinch`'s `useControls()` hook for zoom and `zundo`'s temporal store for undo/redo:

```
const { zoomIn, zoomOut, centerView } = useControls();  // from react-zoom-pan-pinch
const { undo, redo, pastStates, futureStates } = useTemporalStore((state) => ({
  undo: state.undo, redo: state.redo,
  pastStates: state.pastStates, futureStates: state.futureStates,
}));
const canUndo = pastStates.length > 1;
const canRedo = futureStates.length > 0;
```

Hotkeys: `Ctrl+Z` → undo, `Ctrl+Y` / `Ctrl+Shift+Z` → redo (register with a hotkey library or manual event listeners).

Left section:
- Undo / Redo buttons (disabled when stack is empty, using zundo temporal state)
- Zoom controls (zoom percentage display, zoom in/out buttons, fit-to-width — using useControls())
- Page size indicator ("US Letter" or "A4")
- Page count ("1 page" or "2 pages")

Center section:
- Template quick-switcher — small horizontal scrollable strip of template mini-thumbnails for fast switching without opening the right panel

Right section:
- ATS Score mini-badge (the score number in a colored pill — clicking it opens/focuses the right panel's ATS breakdown)
- Export button (primary green CTA) — clicking opens a dropdown menu:
  - "Download PDF" (primary — must produce text-selectable PDF using jsPDF or html2pdf pipeline, NOT a rasterized image)
  - "Download DOCX" (Word-compatible format — essential because many employers and ATS systems require Word)
  - "Download Plain Text" (stripped of all formatting — for pasting into online application text boxes)
  - "Copy to Clipboard" (copies the full resume text, formatted)
  - "Print" (opens the browser print dialog with CSS print styles applied)
  - Each export option shows a tiny icon and a one-line description
- A "Share" button (secondary, outline style) for future implementation — disabled for now with a "Coming soon" tooltip

##### Mobile Layout for Step 7

On mobile (below the `lg` breakpoint), the three-panel layout collapses into a single-panel view with a sticky bottom tab bar to switch between views:
- **"Preview"** tab: The document canvas, full-width, scrollable, with pinch-to-zoom
- **"AI Edit"** tab: The AI prompt bar, quick-action chips, and revision history — full-width, scrollable
- **"Design"** tab: The template switcher, typography, colors, spacing controls — full-width, scrollable
- **"Score"** tab: The ATS score breakdown — full-width
- **"Export"** tab: Export options as full-width buttons

The AI Command Palette (Cmd+K / Ctrl+K) works on both mobile and desktop.

At the top of the mobile view, show a compact sticky header with: back button, "Resume Editor" title, and the ATS score mini-badge.

##### Section-Level AI Interactions

Every section in the rendered resume (when hovered on desktop, or long-pressed on mobile) shows a subtle floating action bar to its right with small icon buttons:
- Sparkles icon: "AI Rewrite" — sends just this section to the AI for targeted rewriting
- Shrink icon: "AI Shorten" — asks the AI to make this section more concise
- Expand icon: "AI Expand" — asks the AI to add more detail to this section
- Refresh icon: "AI Regenerate" — completely regenerates this section from the original user input
- Eye-off icon: "Hide section" — toggles section visibility
- Drag handle: for reordering (on the left side)

These section-level actions make the editing experience feel surgical and precise — the user can work on individual sections without affecting the rest of the document.

##### Real-Time Collaboration with AI (The Vision)

The entire step seven experience should feel like a real-time collaboration between the user and the AI. The AI is not a tool they use — it is a PARTNER they work with. Every interaction should reinforce this:
- When the AI is processing a revision, show a subtle thinking indicator in the canvas area (a small animated sparkle near the section being worked on)
- When changes arrive, they appear with a gentle animation — text smoothly transitions from old to new (not a jarring replacement)
- Toast notifications for completed actions: "✓ Summary rewritten — 40% shorter" with an Undo button
- The AI should occasionally offer proactive suggestions (shown as subtle hint cards in the left panel): "Your experience at Meta doesn't mention any metrics — want me to add some?" or "This resume is 1.2 pages — want me to tighten it to exactly one page?" These proactive hints appear based on the ATS score analysis and disappear when addressed.

---

## Part 4 — Technical Architecture

### File Structure

Create the following file structure, mirroring the Business Card wizard pattern:

- src/components/workspaces/ResumeCVWorkspace.tsx — The main workspace component (the orchestrator that renders the wizard step indicator and mounts the current step component)
- src/components/workspaces/resume-cv/StepPersonal.tsx — Step 1
- src/components/workspaces/resume-cv/StepTargetRole.tsx — Step 2
- src/components/workspaces/resume-cv/StepExperience.tsx — Step 3
- src/components/workspaces/resume-cv/StepEducationSkills.tsx — Step 4
- src/components/workspaces/resume-cv/StepBrief.tsx — Step 5 (includes content fidelity toggle and job description paste)
- src/components/workspaces/resume-cv/StepGeneration.tsx — Step 6
- src/components/workspaces/resume-cv/StepEditor.tsx — Step 7 (the full-screen AI document studio orchestrator — mounts all editor sub-components)
- src/components/workspaces/resume-cv/GenerationLoadingAnimation.tsx — The loading animation
- src/components/workspaces/resume-cv/WizardStepIndicator.tsx — Step indicator with icons
- src/components/workspaces/resume-cv/editor/DocumentCanvas.tsx — The center panel: live HTML resume rendering with zoom, page shadows, inline editing, diff overlay
- src/components/workspaces/resume-cv/editor/AIRevisionPanel.tsx — The left panel: AI prompt bar, quick-action chips, revision history with undo
- src/components/workspaces/resume-cv/editor/DesignControlsPanel.tsx — The right panel: template grid, typography, colors, spacing, custom CSS, ATS breakdown
- src/components/workspaces/resume-cv/editor/AICommandPalette.tsx — The Cmd+K / Ctrl+K floating command palette modal
- src/components/workspaces/resume-cv/editor/EditorBottomToolbar.tsx — The fixed bottom bar: zoom, template quick-switch, ATS mini-badge, export dropdown
- src/components/workspaces/resume-cv/editor/SectionActionBar.tsx — The floating per-section action bar (AI rewrite, shorten, expand, hide, drag)
- src/components/workspaces/resume-cv/editor/DiffOverlay.tsx — The revision preview overlay showing additions/removals before committing, plus any rejected ops and warnings from the validation pipeline
- src/components/workspaces/resume-cv/editor/ExportDropdown.tsx — Export menu: PDF, DOCX, plain text, clipboard, print
- src/components/workspaces/resume-cv/templates/TemplateRenderer.tsx — The HTML/CSS template rendering engine with CSS custom properties
- src/components/workspaces/resume-cv/templates/ClassicTemplate.tsx — Classic single-column template component
- src/components/workspaces/resume-cv/templates/ModernTemplate.tsx — Modern two-column sidebar template component
- src/components/workspaces/resume-cv/templates/TwoColumnTemplate.tsx — Balanced two-column template component
- src/components/workspaces/resume-cv/templates/MinimalTemplate.tsx — Ultra-minimal typography-only template component
- src/components/workspaces/resume-cv/templates/ExecutiveTemplate.tsx — Formal executive template component
- src/components/workspaces/resume-cv/templates/CreativeTemplate.tsx — Bold creative template component
- src/components/workspaces/resume-cv/shared/SectionRenderer.tsx — Universal section renderer used by ALL templates
- src/components/workspaces/resume-cv/shared/SectionHeading.tsx — Section heading with consistent styling
- src/components/workspaces/resume-cv/shared/SectionItem.tsx — Individual item within a section (experience entry, education entry, etc.)
- src/components/workspaces/resume-cv/shared/PageHeader.tsx — Resume header (name, contact info, links) used by all templates
- src/components/workspaces/resume-cv/ResumePreview.tsx — Reusable HTML resume preview component (used in both the canvas and template thumbnails)
- src/components/workspaces/resume-cv/ATSScoreBadge.tsx — ATS score calculation and display (mini badge and full breakdown variants)
- src/stores/resume-cv-wizard.ts — The Zustand store (with sessionStorage persistence)
- src/lib/resume/schema.ts — Zod schemas for ALL resume data types (resumeDataSchema, basicsSchema, sectionsSchema, metadataSchema, pageLayoutSchema, etc.)
- src/lib/resume/ai-resume-generator.ts — The AI prompt builder and response parser (equivalent of ai-design-generator.ts)
- src/lib/resume/ai-revision-engine.ts — The dual-mode AI revision pipeline adapted from ai-patch.ts: deterministic intents for structure/design changes + scoped patch operations for content changes, with a full validation pipeline (scope check, content fidelity enforcement, schema validation, section boundary check, change size limit)
- src/lib/resume/templates.ts — Template definitions, CSS custom property defaults, and template metadata
- src/lib/resume/ats-scorer.ts — ATS scoring algorithm (category-level breakdown with actionable recommendations)
- src/lib/resume/export.ts — PDF, DOCX, plain text export utilities
- src/lib/resume/diff-utils.ts — Utility functions for computing content diffs from JSON Patch operations and rendering them in the UI
- src/lib/resume/patch-utils.ts — JSON Patch (RFC 6902) utilities built on `fast-json-patch`. Follow Reactive Resume's `applyResumePatches()` pattern exactly: (1) validate operations structurally with `jsonpatch.validate(operations, data)`, (2) apply with `jsonpatch.applyPatch(data, operations, false, false)`, (3) validate the RESULT against `resumeDataSchema` with `safeParse()` — if the patched data doesn't conform to the Zod schema, REJECT the entire operation. Also define a `jsonPatchOperationSchema` (Zod discriminated union on `op`) for validating patch operations at the request boundary. Include a `ResumePatchError` class with structured error info (code, index, operation) for clean error reporting.

### Required NPM Packages (Install Before Coding)

These packages are the foundation of the editor. They are the SAME libraries used by Reactive Resume (26K+ stars, production-proven) and are directly compatible with our Next.js + React 19 + Zustand 5 stack:

```
npm install react-resizable-panels react-zoom-pan-pinch @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities fast-json-patch immer zundo
```

| Package | Purpose | Why This One |
|---|---|---|
| `react-resizable-panels` | Three-panel editor layout (left sidebar, artboard, right sidebar) with drag-to-resize separators and collapsible panels | Production-tested in RR. Supports imperative panel refs for programmatic collapse/expand, persisted layout sizes, and mobile-responsive panel hiding. |
| `react-zoom-pan-pinch` | Artboard zoom, pan, and pinch-to-zoom for the center document canvas | RR uses this with: `centerOnInit`, `limitToBounds={false}`, `minScale={0.3}`, `initialScale={0.6}`, `maxScale={6}`. Provides `useControls()` hook for the dock's zoom buttons. |
| `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | Drag-and-drop for reordering sections within a page and dragging sections between main/sidebar columns and between pages | RR uses `PointerSensor` with `distance: 6` activation constraint. Supports `SortableContext` with `verticalListSortingStrategy`. |
| `fast-json-patch` | RFC 6902 JSON Patch operations — apply, validate, generate diffs | RR uses this for ALL resume mutations (both AI and manual). `applyPatch()` + `validate()` + schema validation after patching = bulletproof. |
| `immer` | Immutable state updates via Zustand's `immer` middleware | Enables `updateResumeData((draft) => { draft.basics.name = 'New Name'; })` — write mutable-style code, get immutable updates. Already used in our project but ensure the Zustand middleware is configured. |
| `zundo` | Temporal (undo/redo) middleware for Zustand | Wraps the Zustand store with `temporal()` — gives you `undo()`, `redo()`, `pastStates`, `futureStates` for free. Replaces our manual snapshot-based undo/redo with a proven library. Uses `isDeepEqual` from `fast-deep-equal` for efficient equality checks. |

Also install (if not already present):
```
npm install fast-deep-equal
```

These packages are lightweight, well-maintained, and TypeScript-first. They eliminate entire categories of custom code we'd otherwise have to write and debug.

### State Management

#### Resume Data Schema (Zod-Validated)

Following Reactive Resume's proven pattern, define a comprehensive Zod schema for ALL resume data. This ensures type safety, enables validation, and makes the data structure self-documenting. Create this in src/lib/resume/schema.ts:

```
// Core schemas
basicsSchema = z.object({
  name, headline, email, phone, location,
  website: z.object({ url, label }),
  customFields: z.array(z.object({ id, icon, name, value }))
})

summarySchema = z.object({
  title, content (HTML string), hidden
})

experienceItemSchema = z.object({
  id, hidden, company, position, location, period, website, description (HTML)
})

educationItemSchema = z.object({
  id, hidden, institution, degree, field, graduationYear, description
})

skillItemSchema = z.object({
  id, hidden, name, keywords: string[], proficiency (optional)
})

// Built-in section types
sectionsSchema = z.object({
  summary, experience, education, skills,
  certifications, languages, volunteer, projects,
  awards, publications, references
})

// Custom section support (like Reactive Resume)
customSectionSchema = z.object({
  id, title, type: enum("basic", "detailed"), items: array, hidden
})

// Layout per page (adopted from Reactive Resume)
pageLayoutSchema = z.object({
  fullWidth: boolean,
  main: string[] (section IDs in order),
  sidebar: string[] (section IDs in order)
})

layoutSchema = z.object({
  sidebarWidth: number (20-45, percentage),
  pages: pageLayoutSchema[]
})

// Design metadata (driven by CSS custom properties)
metadataSchema = z.object({
  template: enum("classic", "modern", "two-column", "minimal", "executive", "creative"),
  layout: layoutSchema,
  css: z.object({ enabled: boolean, value: string }),
  page: z.object({ marginX, marginY, gapX, gapY, format: enum("a4", "letter") }),
  design: z.object({
    colors: { primary, background, text },
    colorIntensity: enum("subtle", "standard", "bold")
  }),
  typography: z.object({
    body: { fontFamily, fontSize },
    heading: { fontFamily, fontSize }
  })
})

// Complete resume data
resumeDataSchema = z.object({
  basics, summary, sections, customSections, metadata
})
```

This schema is the single source of truth for resume data. ALL components read from it, the AI generates data conforming to it, and the template renderer consumes it. When the AI revision engine makes changes, it operates on this schema-validated data using JSON Patch operations.

#### Zustand Store — Two Stores, Following Reactive Resume's Pattern

Create TWO Zustand stores, following Reactive Resume's proven architecture:

**Store 1: Wizard Store** (`src/stores/resume-cv-wizard.ts`) — Manages wizard navigation and user-input data (Steps 1-6). Uses `persist` middleware with `sessionStorage`. This is similar to the business card wizard store pattern. Define a WizardStep type (one through seven). Track currentStep, highestCompletedStep, stepDirection. Create typed state slices for each data domain: PersonalInfo, TargetRole, ExperienceEntry array, EducationEntry array, SkillEntry array, OptionalSections (certifications, languages, volunteer, projects), BriefPreferences (description text, style, page count, accent color, contentFidelityMode as "keep-exact" or "ai-enhanced" defaulting to "ai-enhanced", jobDescription optional string for the pasted job posting), GenerationState (isGenerating, error, abort controller). Partialize persist to only serialize user-input data — not generation state. On rehydrate, clamp step back to step six if it was on step seven.

**Store 2: Resume Editor Store** (`src/stores/resume-editor.ts`) — Manages the live resume document in the Step 7 editor. This is the store that uses the Zustand + immer + zundo pattern from Reactive Resume. Here is the exact structure:

```
import { debounce } from 'es-toolkit';
import isDeepEqual from 'fast-deep-equal';
import type { WritableDraft } from 'immer';
import type { TemporalState } from 'zundo';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';
import { create } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import type { ResumeData } from '@/lib/resume/schema';

type ResumeEditorState = {
  resumeData: ResumeData;       // The live resume document
  isReady: boolean;              // True after generation populates it
};

type ResumeEditorActions = {
  initialize: (data: ResumeData | null) => void;
  updateResumeData: (fn: (draft: WritableDraft<ResumeData>) => void) => void;
};

type ResumeEditorStore = ResumeEditorState & ResumeEditorActions;

// Partialize for undo/redo — only track resumeData changes
type PartializedState = { resumeData: ResumeData | null };

export const useResumeEditorStore = create<ResumeEditorStore>()(
  temporal(
    immer((set) => ({
      resumeData: null as unknown as ResumeData,
      isReady: false,

      initialize: (data) => {
        set((state) => {
          state.resumeData = data as ResumeData;
          state.isReady = data !== null;
          // Clear undo/redo history on initialize
          useResumeEditorStore.temporal.getState().clear();
        });
      },

      updateResumeData: (fn) => {
        set((state) => {
          if (!state.resumeData) return state;
          fn(state.resumeData);
        });
      },
    })),
    {
      // Only track resumeData for undo/redo, not isReady
      partialize: (state) => ({ resumeData: state.resumeData }),
      // Deep equality check prevents duplicate history entries
      equality: (pastState, currentState) => isDeepEqual(pastState, currentState),
      // Keep up to 100 undo steps
      limit: 100,
    },
  ),
);

// Hook for accessing temporal (undo/redo) state
export function useTemporalStore<T>(selector: (state: TemporalState<PartializedState>) => T): T {
  return useStoreWithEqualityFn(useResumeEditorStore.temporal, selector);
}
```

This gives you:
- `updateResumeData((draft) => { draft.basics.name = 'New Name'; })` — write mutable code, get immutable updates (immer)
- `useTemporalStore(s => s.undo)` / `useTemporalStore(s => s.redo)` — free undo/redo (zundo)
- `useTemporalStore(s => s.pastStates.length > 0)` — check if undo is available
- Deep equality checks prevent duplicate undo entries when nothing actually changed

The editor store does NOT use sessionStorage persistence — the resume data lives only in memory during the editing session (populated from the generation step or from a future import). This matches Reactive Resume's approach where the store is initialized from server data and synced back.

Define additional editor UI state in a separate lightweight store or extend the wizard store: activePanel ("left" | "center" | "right"), zoomLevel, sidebar collapsed states, etc. Keep the editor UI state separate from the resume document data — the document store must stay clean for undo/redo to work correctly.

### AI Generation Pipeline

Create src/lib/resume/ai-resume-generator.ts following the same architecture as src/lib/editor/ai-design-generator.ts. Study that file to understand the pattern: it exports a function that builds a system prompt and user message, calls the /api/chat/design endpoint, parses the JSON response, validates and repairs it, and returns the structured result.

The system prompt should instruct Claude to act as a world-class resume writer with expertise in career coaching, ATS optimization, and document design. It should specify the exact JSON response format. The response should contain: a professional summary paragraph (written from scratch based on the user's experience and target role), reformulated experience entries (each job gets three to six bullet points starting with strong action verbs, quantified where possible), organized and prioritized skills (grouped into categories like "Technical Skills", "Soft Skills", "Tools & Software" if appropriate), an ATS keywords list (terms from the target role that should appear in the resume), a recommended section order, and a visual design specification (template choice, accent color usage, font pairing suggestion).

The user message should pass ALL collected wizard data in a structured format — personal info, target role and level, all experience entries with their raw descriptions, education entries, skills, optional sections, and the user's creative brief and style preferences.

Include the same kind of robust error handling the business card generator has: try/catch around the API call, abort controller support, truncated JSON repair, response validation, and a local fallback mode that uses the raw user data without AI enhancement if the API is unavailable.

### AI Revision Engine — Dual-Mode Architecture (CRITICAL: Study src/lib/editor/ai-patch.ts First)

Create src/lib/resume/ai-revision-engine.ts — this is the brain behind the step seven AI-first editing experience. It is a separate module from the initial generation because revisions have different requirements.

**CRITICAL PREREQUISITE:** Before writing this file, you MUST deeply study src/lib/editor/ai-patch.ts (1,900 lines). This is DMSuite's existing AI revision system for the Business Card tool. It is battle-tested, architecturally sophisticated, and the resume revision engine MUST adopt its dual-mode architecture — not the simpler raw JSON Patch approach used by Reactive Resume. The Business Card system is the gold standard; the resume engine adapts it for document content instead of Canvas2D layers.

#### Why Not Raw JSON Patch Alone

Reactive Resume's approach — having the AI generate raw RFC 6902 JSON Patch operations — is elegant but fragile:
- The AI must guess the correct JSON pointer paths — it can get them wrong
- There is no scope constraint — the AI can touch anything in the document
- There is no value validation — the AI can set nonsensical values
- There is no locking — the user cannot protect specific sections from AI changes
- Every mutation depends entirely on AI accuracy — nothing is deterministic

Our existing ai-patch.ts solves ALL of these problems with a dual-mode system. The resume engine must follow the same pattern.

#### The Two Modes

**Mode 1 — Deterministic Intents (for structure, design, and common operations):**
The AI picks an intent TYPE and PARAMETERS. Our code executes the actual mutation deterministically — the AI never touches the data directly. This is where most user requests land.

Resume-specific intent types (these are the equivalent of ai-patch.ts's IntentType system):
- "rewrite-section" — Rewrites a specific section's content (summary, experience item, etc.). The AI generates new text, but the engine validates it against the schema and ensures only the targeted section changes.
- "shorten-section" — Makes a section more concise. The engine enforces that ONLY that section is modified and the character count actually decreases.
- "expand-section" — Adds more detail. Same constraint enforcement.
- "add-keywords" — Adds ATS keywords. The engine validates that added keywords are relevant to the target role and only appear in appropriate sections.
- "fit-to-pages" — Adjusts content to fit a target page count. The engine controls which sections are shortened and by how much, using a priority hierarchy.
- "reorder-sections" — Moves sections. Pure data rearrangement — zero AI text generation needed.
- "hide-section" / "show-section" — Toggles section visibility. Pure boolean flip — zero AI needed.
- "move-to-sidebar" / "move-to-main" — Moves a section between layout areas. Pure data rearrangement.
- "change-template" — Switches template. Pure metadata change.
- "change-font" / "change-color" / "change-spacing" — Design adjustments. Pure CSS custom property changes — zero AI needed.
- "add-section" / "remove-section" — Structural changes. Schema-validated.
- "regenerate-section" — Regenerates a section from the original wizard input data. The AI generates new text, but the engine ensures only that section is replaced.
- "tailor-for-job" — Re-optimizes the resume for a specific job description. The engine tracks which sections the AI modifies and creates per-section diffs.
- "improve-ats-score" — Applies specific ATS recommendations. The engine maps each recommendation to a targeted intent.

For design/structure intents, the execution is 100% deterministic code — the AI only selects which intent and provides parameters. For content intents (rewrite, shorten, expand, add-keywords, regenerate, tailor), the AI generates new text, but the engine wraps it with validation and constraint enforcement.

**Mode 2 — Scoped Patch Operations (for targeted changes the intent system doesn't cover):**
For edge cases where no intent fits (e.g., "Change 'Led a team of 5' to 'Led a cross-functional team of 12'"), the AI generates RFC 6902 JSON Patch operations. These are validated and applied using `fast-json-patch` (the same library Reactive Resume uses) with our additional validation layers on top. The patches pass through a strict validation pipeline before applying:

#### The Validation Pipeline (Adapted from ai-patch.ts)

Every AI revision — whether intent-based or patch-based — passes through these checks BEFORE any diff is shown to the user:

1. **Revision Scope Check** — Define scopes for resume revisions:
   - "content-only": AI can modify text content in sections but NOT template, design, or layout settings
   - "design-only": AI can modify template, colors, fonts, spacing but NOT text content
   - "section-specific": AI can ONLY modify the one section the user targeted (e.g., section-level "AI Rewrite" button)
   - "full": AI can modify both content and design (for broad requests like "make this more professional")
   Each scope has a whitelist of allowed JSON pointer path prefixes. Patches touching disallowed paths are REJECTED with a reason.

2. **Content Fidelity Enforcement** — If the mode is "keep-exact", the engine categorically BLOCKS any patch that modifies user-provided text content (paths matching `/sections/*/items/*/description`, `/summary/content`, etc.). The AI is only allowed to modify design, layout, and section ordering. If the user's instruction requires content changes in "keep-exact" mode, return a friendly message explaining the constraint and offer to switch modes — do NOT silently modify their text.

3. **Schema Validation** — After tentatively applying patches, validate the resulting data against the Zod resumeDataSchema. If validation fails, the revision is REJECTED. This prevents the AI from producing malformed data (missing required fields, wrong types, invalid enum values).

4. **Section Boundary Check** — When the revision targets a specific section (e.g., user clicked "AI Rewrite" on their Google experience), verify that ONLY that section's data was modified. If the AI also changed the Meta experience or the summary, those extra changes are STRIPPED and reported as rejected ops.

5. **Change Size Limit** — For "shorten-section" intents, verify the result is actually shorter. For "expand-section" intents, verify it's actually longer. For general revisions, if the AI changed more than 40% of the document when the user asked for a small tweak, flag it with a warning shown in the diff preview: "AI made extensive changes — review carefully."

6. **No Silent Additions** — The AI should not add new sections or items the user didn't ask for. If the intent is "rewrite-section" and the AI response includes new experience items that weren't there before, those additions are stripped.

The validation pipeline is the CONTRACT that ensures the AI stays in its lane. It cannot guarantee 100% accuracy on text quality (the AI might write mediocre bullet points), but it CAN guarantee that the AI only touches what it was asked to touch and produces structurally valid data.

#### The performAIRevision Function

```
performAIRevision(
  instruction: string,
  currentResumeData: ResumeData,       // Full current state, Zod-validated
  context: RevisionContext              // See below
): Promise<RevisionResult>

RevisionContext = {
  scope: "content-only" | "design-only" | "section-specific" | "full",
  contentFidelityMode: "keep-exact" | "ai-enhanced",
  targetSectionId?: string,            // For section-level actions
  targetItemId?: string,               // For item-level actions
  wizardData: WizardData,              // Original user input (for regeneration)
  targetRole: string,
  jobDescription?: string,
}

RevisionResult = {
  success: boolean,
  patches: PatchOp[],                  // Applied patches (for diff display)
  rejectedPatches: Array<{ op: PatchOp, reason: string }>,  // Rejected ops with reasons
  warnings: string[],                  // Non-blocking warnings
  updatedResumeData: ResumeData,       // New state (only committed on user Accept)
  summary: string,                     // Human-readable change description
  newATSScore: number,                 // Recalculated ATS score
}
```

The function: (1) classifies the instruction into an intent type, (2) for deterministic intents, executes directly; for content intents, calls the AI with a scoped prompt, (3) runs all patches through the validation pipeline, (4) returns the result for diff preview — NEVER auto-applies.

#### AI Prompt for Revisions

The revision prompt (sent to /api/chat/design) follows the same structure as ai-patch.ts's `buildAIPatchPrompt`: it gives the AI complete visibility into the current resume data, explicitly lists what it is and is not allowed to change (based on scope), provides the user's instruction, and demands a structured JSON response. Study `buildAIPatchPrompt` in ai-patch.ts for the exact pattern — it includes a semantic element map, path documentation per field type, targeting rules, and strict formatting requirements.

#### Revision History and Undo/Redo

Undo/redo is handled by TWO complementary systems:

**1. zundo temporal middleware (automatic, low-level):** Every call to `updateResumeData()` on the editor store is automatically tracked by zundo. This gives you `undo()` and `redo()` for free — the dock's undo/redo buttons and Ctrl+Z/Ctrl+Y hotkeys wire directly to `useTemporalStore(s => s.undo)` and `useTemporalStore(s => s.redo)`. zundo handles the linear stack semantics (if you undo step 5 and make a new change, future states are discarded). Deep equality checks (`fast-deep-equal`) prevent duplicate entries when nothing actually changed. This covers ALL changes — manual inline edits, design changes, template switches, AND AI revisions.

**2. AI Revision Timeline (high-level, stored separately):** In addition to zundo's automatic tracking, maintain a separate `RevisionEntry[]` array in the wizard or editor UI store for the revision timeline UI in the left panel. Each entry stores: the instruction text ("Shortened summary"), a timestamp, a human-readable change summary, the validation result (rejected ops, warnings), and a count of changes. This is for DISPLAY purposes — the actual undo mechanics use zundo.
- The revision timeline displays in the left panel as a scrollable list, most recent at top
- Each entry shows: the instruction, the number of changes, any warnings, and an "Undo" action
- Hovering over a history entry shows a diff preview (green for additions, red for removals)
- The diff preview is computed by comparing the resume data snapshots from zundo's `pastStates` array

#### What This Architecture Guarantees vs. What It Cannot

**Guaranteed (by code, not AI):**
- The AI cannot modify sections it wasn't asked to touch (scope + boundary checks in the validation pipeline)
- The AI cannot produce structurally invalid data (`fast-json-patch` validates structurally, then `resumeDataSchema.safeParse()` validates semantically — the same two-layer pattern Reactive Resume uses)
- The AI cannot modify user text in "keep-exact" mode (content fidelity enforcement blocks patches on content paths)
- Design changes (template, colors, fonts, spacing) are 100% deterministic — no AI text generation involved
- Section reordering, hiding, moving to sidebar — all 100% deterministic (handled by `@dnd-kit` drag events → direct store updates)
- Every change shows a diff preview before committing
- Every change is undoable (`zundo` temporal middleware tracks all state mutations automatically)

**NOT guaranteed (inherent AI limitations):**
- Quality of rewritten text — the AI might produce generic or mediocre bullet points
- Interpretation of ambiguous instructions — "make it better" means different things to different people
- Keyword relevance — the AI's ATS keyword suggestions might not match what a specific employer's ATS actually scans for
- Perfect page fitting — "fit to one page" involves judgment calls about what to cut

These inherent limitations are why the diff preview + accept/reject pattern is essential. The user is always the final judge of content quality.

### Resume Template Rendering — Parameterized Layout Shells (Critical Architecture)

This is the key architectural difference from the Business Card tool. Instead of Canvas2D rendering, resumes should be rendered as structured HTML and CSS. Our template system is inspired by Reactive Resume's proven architecture (13 templates, 26K+ GitHub stars) but extended with our AI-first approach.

**CRITICAL DESIGN PHILOSOPHY: Templates are NOT rigid designs — they are parameterized layout shells.** A template defines ONLY the structural skeleton (single-column vs. two-column, sidebar position, header arrangement). Everything else is controlled by CSS custom properties that the AI selects and the user can override. This means one template can produce hundreds of visually distinct resumes. The AI picks the right template AND dials in all the parameters. The user can switch templates instantly without losing content, and every design knob is independently tunable.

#### Why Templates + Parameters (Not Pure AI-Generated HTML)

We studied the alternative — having the AI generate raw HTML/CSS layouts from scratch for every resume — and rejected it:
- **Slower**: AI must design a layout on every generation (adds seconds)
- **Inconsistent**: AI produces subtly different layouts each run
- **Can't switch**: No "try a different look" without regenerating everything
- **Fragile**: AI might produce broken layouts, bad page breaks, non-ATS-compliant HTML
- **Uneditable**: Design parameters can't be tweaked independently

Templates give us the best of both worlds: the AI's intelligence in CHOOSING the right template and parameters, plus instant switching, reliable rendering, and granular user control.

#### CSS Custom Properties System

Every template reads from these CSS custom properties (set by the TemplateRenderer based on Zustand state). These names are aligned with Reactive Resume's exact CSS custom property naming convention for maximum compatibility with their proven template rendering approach:

```
/* Page dimensions and spacing */
--page-width: 210mm                              /* A4 width (or 8.5in for Letter) */
--page-height: 297mm                             /* A4 height (or 11in for Letter) */
--page-margin-x: 40pt                           /* Horizontal page margins */
--page-margin-y: 40pt                           /* Vertical page margins */
--page-gap-x: 20pt                              /* Horizontal gap between columns */
--page-gap-y: 12pt                              /* Vertical gap between sections */
--page-sidebar-width: 35%                       /* Sidebar width for two-column templates */

/* Colors */
--page-primary-color: rgba(37, 99, 235, 1)    /* Accent color for headings, lines, sidebar backgrounds */
--page-background-color: rgba(255, 255, 255, 1) /* Page background (usually white) */
--page-text-color: rgba(0, 0, 0, 1)            /* Primary text color */

/* Typography — body */
--page-body-font-family: 'Inter', sans-serif    /* Body font family */
--page-body-font-size: 10pt                     /* Body font size */
--page-body-font-weight: 400                    /* Body font weight */
--page-body-line-height: 1.5                    /* Body line height */

/* Typography — headings (with multiplier hierarchy) */
--page-heading-font-family: 'Inter', sans-serif /* Heading font family */
--page-heading-font-size: 14pt                  /* Base heading font size (H3) */
--page-heading-font-weight: 700                 /* Heading font weight */
/* H1 = heading-font-size * 2.0, H2 = * 1.5, H3 = * 1.0, H4 = * 0.85 */

/* Section decoration */
--section-border-width: 1px                      /* Section divider thickness */
--section-border-color: var(--page-primary-color) /* Section divider color */
```

The AI generation response specifies values for ALL these properties. The user can override any of them in the right panel's Design Controls. The `--page-width` and `--page-height` properties enable page overflow detection by comparing the rendered content height against the specified page height.

#### Template Architecture

Create a template rendering engine in src/lib/resume/templates.ts (and the ResumePreview/TemplateRenderer components) that:

- Takes the structured resume data (content), a template identifier, and a page layout specification as inputs
- Each template is a React component that receives `{ pageIndex, pageLayout }` props — following Reactive Resume's proven pattern
- The `pageLayout` object specifies which sections go in `main`, which go in `sidebar`, and whether the page is `fullWidth` — this means sections can be dragged between main and sidebar areas, and each page can have a different layout
- Templates consume CSS custom properties for ALL visual styling — they do NOT hardcode colors, fonts, or spacing
- Shared section-rendering components (SectionRenderer, SectionHeading, SectionItem) live in a `shared/` subfolder — templates only define LAYOUT STRUCTURE, not content rendering
- The preview renders this HTML inside a scaled container that looks like a real paper page (white background, subtle shadow, proper A4 or US Letter aspect ratio)
- Switching templates re-renders the same content with a different layout INSTANTLY — the content is completely decoupled from the design
- **Page overflow detection** (adopted from Reactive Resume): Each page container uses a `ResizeObserver` to monitor its actual rendered height. If the content height exceeds the page dimensions (e.g., `pageDimensionsAsPixels['a4'].height`), show a visual warning — a subtle amber border or banner at the bottom of the page saying "Content exceeds page — consider shortening or adding a second page." This is critical for ensuring the PDF output actually fits on the specified page format. Reactive Resume tracks this per-page with a ref + ResizeObserver pattern:
  ```
  const pageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pageRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const maxHeight = pageDimensionsAsPixels[format].height;
      setIsOverflowing(entry.contentRect.height > maxHeight);
    });
    observer.observe(pageRef.current);
    return () => observer.disconnect();
  }, [format]);
  ```
- For non-first pages, use `content-visibility: auto` CSS property for rendering performance (adopted from RR's preview.module.css)
- Each template must produce clean, semantic HTML that an ATS can parse (proper heading tags, paragraph tags, unordered lists — no tables for layout, no images for text, no complex CSS that would confuse an ATS)

#### The Six Templates

Each template is a layout archetype — the CSS variables make them infinitely customizable within their structural form:

1. **Classic** — Single column, serif name heading, clean horizontal dividers between sections, centered header. The "safe choice" for traditional industries. Sidebar position: none.
2. **Modern** — Left sidebar (thirty to thirty-five percent width) with contact info, skills, and languages. Main area for experience and education. Sans-serif throughout, accent color bars for section headings. The most popular layout for tech/business roles. Sidebar position: left.
3. **Two-Column** — Balanced two-column layout (no sidebar per se — both columns carry equal-weight content). Skills and education on one side, experience on the other. Visual hierarchy through typography and spacing. Sidebar position: right.
4. **Minimal** — Maximum whitespace, typographic hierarchy only, NO decorative elements, NO color (accent color is ignored or used only for hyperlinks). For when the content speaks entirely for itself. Sidebar position: none.
5. **Executive** — Formal, traditional, serif fonts (Georgia or Merriweather for headings), conservative spacing, subtle navy or charcoal accents. For senior and C-level professionals. Sidebar position: none.
6. **Creative** — Bolder accent color usage (colored sidebar background, section blocks with fills), unique section styling, asymmetric layout. For design, marketing, creative, and startup roles where visual personality matters. Sidebar position: left.

Each template component follows this structure (pseudocode):
```
function ModernTemplate({ pageIndex, pageLayout }) {
  const { main, sidebar, fullWidth } = pageLayout;
  return (
    <div className="template-modern" style={cssCustomProperties}>
      {pageIndex === 0 && <Header />}
      <div className="flex">
        {!fullWidth && (
          <aside style={{ width: 'var(--page-sidebar-width)' }}>
            {sidebar.map(section => <SectionRenderer key={section} id={section} />)}
          </aside>
        )}
        <main>
          {main.map(section => <SectionRenderer key={section} id={section} />)}
        </main>
      </div>
    </div>
  );
}
```

Below the template grid in the right panel, show a "More templates coming soon" placeholder with a sparkles icon.

#### Custom CSS (Power User Feature)

Add a "Custom CSS" collapsible section at the bottom of the right panel's Design Controls. When expanded, it shows a code editor textarea (monospace font, syntax highlighting if feasible) where users can write custom CSS to override any template styling. This is a proven feature from Reactive Resume that power users love. Include a toggle to enable/disable the custom CSS. Show a warning: "Custom CSS may affect ATS compatibility."

#### Custom Sections

In addition to the built-in section types (Professional Summary, Work Experience, Education, Skills, Certifications, Languages, Volunteer, Projects), allow users to create **custom sections** with a user-defined title and content type. This is inspired by Reactive Resume's customSections support. In the left panel's "Sections" tab, the "Add Section" button should include a "Custom Section" option that lets the user name their own section (e.g., "Publications", "Awards", "Speaking Engagements", "Hobbies") and add items to it. Custom sections use the standard section renderer with a user-defined heading.

### ATS Score Calculation

Create src/lib/resume/ats-scorer.ts — a pure function that takes the resume data and target role and returns a score from zero to one hundred plus an array of specific recommendations. Score based on:
- Contact information completeness (name, email, phone — ten points)
- Professional summary present and substantive (fifteen points)
- Work experience with quantified achievements — action verbs, numbers, metrics (twenty points)
- Skills section present with relevant keywords matching the target role (fifteen points)
- Education section present (ten points)
- Proper section headings using standard names that ATS systems recognize (ten points)
- Appropriate resume length for experience level (ten points)
- No red flags: career gaps acknowledged, consistent date formatting, no first-person pronouns (ten points)

Display this as a prominent badge that updates in real-time as the user edits their resume.

### PDF Export

The PDF export is CRITICAL and must produce a professional, text-selectable PDF — not a rasterized canvas screenshot. Use jsPDF (already installed in the project) to programmatically render the resume content with proper text positioning, font embedding, and page breaks. Alternatively, investigate using the browser's print-to-PDF capability with CSS print styles, or a library like html2pdf.js that wraps HTML rendering. The output must have: selectable and searchable text (so ATS systems can parse it), proper fonts (not bitmap text), clean margins, consistent spacing, and correct page breaks that never split a section heading from its content. Note: Reactive Resume uses Browserless/Chromium for server-side PDF rendering, which produces the highest quality output. For our client-side approach, html2pdf.js wrapping the live HTML template rendering is likely the most faithful approach — it renders exactly what the user sees.

### Future Features (Plan For But Don't Build Now)

These features are NOT part of the initial build, but the architecture should accommodate them without rewrites:

1. **Resume Import (PDF/DOCX)** — Reactive Resume uses AI (OpenAI/Anthropic/Gemini) to parse uploaded PDF or DOCX resumes into their Zod schema. We should plan for this by ensuring our resumeDataSchema can represent imported data. The import flow would be: Upload file → AI extracts structured data → Populate wizard → User reviews/edits → Generate enhanced version. Design the schema and store to accept pre-populated data from an import source.

2. **Cover Letter Builder** — Reactive Resume includes cover letters as a section type in their resume data. We should plan for a companion Cover Letter builder that shares the same data model (user's experience, target role, company) and generates a matching cover letter. The cover letter could be a section in the resume data or a separate document.

3. **Multiple Resume Versions** — Users may want to maintain different resume versions for different roles. The architecture should support this (multiple resume data objects per user, tagging, comparison).

4. **Share via Link** — Reactive Resume allows sharing resumes via public URLs. We could add this later with a simple viewer page.

5. **JSON Resume Import/Export** — Interoperability with the JSON Resume standard (jsonresume.org). Our Zod schema should be mappable to/from this format.

### Removing the Old Workspace

The existing ResumeCVWorkspace.tsx is a monolithic eighteen-hundred-line legacy file. Delete it entirely and replace it with the new wizard-based workspace. The dynamic import in src/app/tools/[categoryId]/[toolId]/page.tsx already maps "resume-cv" to this file path, so the routing will work automatically.

---

## Part 5 — UI/UX Design Specifications

### Visual Language

The wizard should feel premium, modern, and AI-native. Think of how Notion's setup wizard, Linear's onboarding, or Vercel's project creation flow feels — clean, spacious, confident, with subtle animations that make the experience feel alive.

- Full-screen wizard steps (not crammed into a sidebar)
- Large, well-spaced typography for headings and instructions
- Centered content column (maximum width of about six hundred to seven hundred pixels for form steps, wider for the result step)
- Subtle gradient or soft pattern on the background (using the project's gray-900 to gray-950 tokens — this is a dark-mode-first app)
- Smooth Framer Motion transitions between steps (slide up on forward, slide down on backward, with opacity and scale — exactly like the Business Card wizard)
- All form inputs should use the project's Input component (src/components/ui/Input.tsx) or follow its styling conventions
- All buttons should use the project's Button component (src/components/ui/Button.tsx) with appropriate variants (primary for main actions, ghost for secondary)
- Green primary-brand color (the electric-lime green from the theme) for active states, progress indicators, and CTAs
- NEVER use hardcoded hex colors — always use Tailwind tokens like bg-primary-500, text-gray-400, etc.
- NEVER use pixel values for spacing — always use Tailwind spacing like p-5, gap-6, h-9, etc.

### AI-Native Aesthetic — Making It Feel Like the Future

This is NOT a traditional form-based web app. It should feel like an AI-powered creative tool from 2026. Every surface, every interaction, every transition should whisper "there is intelligence behind this." Here is the specific design language to achieve this:

#### Glassmorphism and Layered Surfaces
- Panels in the step seven editor (left, center, right) should use a frosted-glass effect: `bg-gray-900/80 backdrop-blur-xl border border-white/5`. This creates visual depth where the panels feel like floating glass sheets over the dark workspace background.
- Modal overlays (like the AI Command Palette) should use `backdrop-blur-2xl bg-gray-950/70` for a dramatic frosted effect.
- Cards within panels should have a very subtle glass effect: `bg-white/[0.03] border border-white/[0.06]` — barely visible but creating just enough layering to separate content groups.
- The document canvas frame in step seven should have the sharpest, most solid look in contrast (pure white with crisp shadows) — making it "pop" against the glassmorphic surroundings as the hero element.

#### Ambient Glow and Gradient Meshes
- The background of wizard steps (one through six) should use a subtle gradient mesh — not a flat color. Think: gray-950 as the base with barely-visible radial gradients of primary-500 at about three percent opacity in the top-right corner and secondary-500 at about two percent opacity in the bottom-left. This gives the background life without being distracting.
- Active or focused elements should emit a subtle glow: inputs on focus get `ring-2 ring-primary-500/30 shadow-[0_0_15px_rgba(138,230,0,0.1)]`. Buttons on hover get a similar outer glow.
- The AI prompt input in step seven's left panel should have a perpetual subtle glow animation — a very slow breathing pulse of the primary green glow around its border, signaling "I'm ready for your instructions."
- The ATS score ring in the right panel should glow in its score color — green ring emits a subtle green ambient glow.

#### Micro-Interactions Everywhere
- **Hover states**: Every interactive element (buttons, chips, cards, template thumbnails, section items) should have a smooth hover transition. For cards and thumbnails: `transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary-500/20`. For buttons: subtle background shift plus transform.
- **Click feedback**: Buttons should have a micro press animation — `active:scale-[0.97]` with a fast spring transition. This makes clicks feel tactile and responsive.
- **Focus rings**: All focusable elements get a primary-green focus ring with glow (not the browser default blue outline).
- **Tag/chip animations**: When skill tags are added, they should animate in with `scale(0) -> scale(1.1) -> scale(1)` spring animation. When removed, they shrink and fade out. Use Framer Motion's `layout` prop for smooth reflow.
- **Section collapse/expand**: Use Framer Motion's AnimatePresence with height animation — sections don't just appear/disappear, they smoothly expand and contract.
- **Form field entry**: When the user starts typing in a field, the label should animate from placeholder position to a floating position above the field (floating label pattern) with a color shift to primary-500.

#### AI Thinking Indicators
Whenever the AI is processing (generating the resume, performing a revision, calculating suggestions), the UI must make this visible and delightful:
- **Sparkle trail animation**: Small animated sparkle particles that drift across the active area (like magic fairy dust). Use Framer Motion to animate three to five small star-shaped SVG elements with randomized float paths and fading opacity. This plays during AI generation and during AI revision processing.
- **Gradient pulse on AI elements**: The AI prompt bar and any "AI thinking" states should show a slow-moving gradient animation — a shimmer that sweeps from left to right across the element (similar to skeleton loading states but more colorful, using primary-to-secondary gradient).
- **Typing indicator for AI**: When the AI is "writing" a revision, show a chat-style typing indicator (three dots bouncing in sequence) in the left panel with a label like "AI is revising your resume..."
- **Progress transparency**: For longer operations (initial generation in step six, or complex revisions), show estimated time or a micro progress indicator. Users should never wonder "is it still working?"
- **Completion celebration**: When AI generation completes (step six to seven transition), show a brief, elegant celebration micro-animation — the resume page "materializes" onto the canvas with a subtle scale-up and fade-in, perhaps with a quick particle burst at the center. Not over-the-top confetti — a refined, professional "ta-da" moment.

#### Toast Notifications
Use toast notifications (bottom-right corner, stacked) for all AI actions and system events:
- AI revision applied: "✓ Summary rewritten — 40% shorter" with green accent and "Undo" button
- AI revision rejected: "↩ Changes discarded" with neutral styling
- Export complete: "📄 PDF downloaded successfully" with primary accent
- ATS score improved: "↑ ATS Score improved from 72 to 87" with green accent
- Error states: "⚠ AI revision failed — try again" with amber accent and "Retry" button

Each toast should animate in from the right with a slide + fade, auto-dismiss after four seconds, be manually dismissable, and support the "Undo" action for reversible operations. Stack up to three toasts max — older ones dismiss to make room.

#### Premium Empty States
Every section that can be empty (experience list before adding entries, skills before adding tags, optional sections) should have a beautiful, encouraging empty state:
- A large PremiumIcon in "soft" variant at 2xl size (e.g., a briefcase for empty experience)
- A friendly heading: "No work experience yet? No problem."
- A supportive subtitle: "Add your first position and the AI will help you shine."
- A primary action button: "Add your first position"
- The empty state should use the ambient glow background to feel warm, not cold and empty.

#### Keyboard Shortcuts (Power User Features)
Implement these keyboard shortcuts in the step seven editor and show them in a discoverable "Keyboard Shortcuts" panel (accessible from the top-right corner or via Cmd+/ or Ctrl+/):
- Cmd/Ctrl + K: Open AI Command Palette
- Cmd/Ctrl + S: Quick export to PDF (or save draft — visual feedback even if auto-saved)
- Cmd/Ctrl + Z: Undo last AI revision (not just text undo, but full revision undo)
- Cmd/Ctrl + Shift + Z: Redo last undone revision
- Cmd/Ctrl + P: Print preview / print
- Cmd/Ctrl + 1/2/3: Switch between left/center/right panel focus
- Escape: Close any open modal, palette, or overlay
- Tab: Move through sections in the editor

### Step Indicator

Create a WizardStepIndicator similar to the Business Card one. Seven steps with small icons: Step 1 (user icon), Step 2 (briefcase icon), Step 3 (building/work icon), Step 4 (book-open/education icon), Step 5 (sparkles icon), Step 6 (loader/wand icon), Step 7 (file-text icon). Completed steps are clickable to navigate back. Current step highlighted. Future steps dimmed. Connector lines between dots.

### Responsive Design

- Mobile first — the default styles target mobile
- On mobile (below the lg breakpoint), the wizard steps stack vertically, inputs go full-width, and the result step (step seven) uses a tabbed interface to switch between Preview, Edit, and Export views
- On desktop (lg and above), the result step shows the two-panel layout (editor left, preview right)
- The step indicator should be horizontal on desktop and either horizontal-scrollable or a compact progress bar on mobile

### Animation Details

- Step transitions: AnimatePresence with Framer Motion. Forward = slide up with fade in (y starts at 30, opacity starts at 0). Backward = slide down. Duration around zero-point-four seconds with ease-out.
- Loading animation: exactly match the Business Card GenerationLoadingAnimation visual pattern — study that component and replicate its shimmer gradient, pulsing dots, progress bar, and timing.
- Template switching in the result step: crossfade transition (the preview fades between templates smoothly, not a jarring hard cut)
- Form interactions: subtle scale or color transitions on focus states for inputs
- Tag inputs (skills): tags should animate in when added (scale from zero) and animate out when removed (scale to zero with fade)

---

## Part 6 — What NOT to Do

- Do NOT use the old StickyCanvasLayout component from the existing codebase. The Resume Builder uses a wizard (Steps 1-6) that transitions into a three-panel editor (Step 7) built with `react-resizable-panels` — NOT the legacy StickyCanvasLayout.
- Do NOT render the resume on a Canvas2D element. Use HTML/CSS rendering for proper text selection and ATS compatibility.
- Do NOT keep any code from the existing ResumeCVWorkspace.tsx — it is a legacy monolith that must be completely replaced.
- Do NOT put all the code in one file. Follow the component-per-step pattern established by the Business Card wizard. The step seven editor alone has EIGHT sub-components — keep them properly separated.
- Do NOT use emoji anywhere in the UI — use SVG icon components from the PremiumIcon system.
- Do NOT use hardcoded hex colors or pixel values — use Tailwind tokens exclusively.
- Do NOT ask the user to write their own bullet points or professional summary — that is the AI's job.
- Do NOT make the user upload an existing resume to get started — this tool creates resumes from scratch (an import/upload feature can be added later).
- Do NOT include a headshot/photo upload — professional resumes in most markets do not include photos, and it creates discrimination concerns.
- Do NOT overwhelm the user on any single step — if a step feels like it has too many fields, split it or hide optional fields behind expandable sections.
- Do NOT make the generation step require a manual button click — it should auto-trigger on mount, exactly like the Business Card wizard.
- Do NOT make manual text editing the primary editing interface in step seven. The AI prompt bar, quick chips, section-level AI actions, and command palette are the PRIMARY editing tools. Manual inline editing is a secondary, supplementary option for quick typo fixes.
- Do NOT apply AI revisions immediately — ALWAYS show a diff preview first with Accept/Reject options. The user must feel in control.
- Do NOT skip the glassmorphism, ambient glow, micro-interactions, and AI thinking indicators. These are NOT nice-to-haves — they are REQUIRED for the premium AI-native feel. A functional but visually flat tool is a failure.
- Do NOT use a traditional rich text editor library (like Tiptap, Slate, ProseMirror, Lexical) for the resume content. The resume is rendered as HTML/CSS templates — the "editor" is the AI revision system plus minimal inline text editing. A full rich-text editor would fight the template system and create a maintenance nightmare.
- Do NOT forget the mobile experience. Step seven on mobile must have a tabbed interface (Preview, AI Edit, Design, Score, Export) — not a cramped three-panel layout.

---

## Part 7 — Quality Bar and Definition of Done

The tool is "done" when:

1. The PremiumIcon system exists at src/components/premium-icons.tsx with at least one hundred and fifty icons, four variants (stroke, solid, duotone, soft), six size presets, and the premiumIconMap registry
2. The Zod resume data schema (src/lib/resume/schema.ts) validates all resume data types and exports TypeScript types used throughout
3. All seven wizard steps work correctly with data flowing through the Zustand store
4. Navigation works forward and backward with step indicator clickability for completed steps
5. Session persistence works — refreshing the page mid-wizard returns to where you were
6. AI generation produces a complete, well-written resume from minimal user input, conforming to the Zod schema
7. The loading animation is polished with shimmer text, progress bar, and sequential status updates
8. All six resume templates are individual React components consuming CSS custom properties, rendering correctly and instantly switchable
9. Templates use shared section renderers (SectionRenderer, SectionHeading, SectionItem, PageHeader) — templates only define layout
10. The ATS score calculates in real-time and provides category-level breakdown with actionable, clickable recommendations
11. PDF export produces a professional, text-selectable document
12. The preview looks like a real printed page with proper proportions, paper shadow, and zoom controls
13. Inline editing on the document canvas works for all text fields (as a secondary editing mode)
14. The AI revision system follows the dual-mode architecture from ai-patch.ts: deterministic intents for structure/design changes (100% reliable) + scoped patch operations for content changes (AI-dependent but validated). The validation pipeline enforces: scope constraints, content fidelity mode, Zod schema validation, section boundary checks, and change size limits. The left panel prompt bar, quick chips, section-level actions, AND the Cmd+K command palette all work correctly and produce diff previews before applying changes. NO revision is ever auto-applied — the user ALWAYS sees a diff and clicks Accept/Reject.
15. The content fidelity toggle ("Keep My Exact Words" vs "AI Enhanced") is enforced at the engine level — in exact mode, patches that modify user-provided text content are categorically BLOCKED by the validation pipeline (not just suggested by prompt engineering)
16. The job description paste feature correctly tailors the resume and produces a Job Match Score
17. Undo/redo works via `zundo` temporal middleware on the Zustand store — `useTemporalStore(s => s.undo)`, `useTemporalStore(s => s.redo)`, with up to 100 history entries and deep equality checks. The AI revision overlay additionally stores: instruction text, validation results (rejected ops, warnings), and a human-readable summary for the revision timeline UI
18. The three-panel editor layout uses `react-resizable-panels` with `ResizableGroup`, `ResizablePanel` (collapsible with imperative refs), and `ResizableSeparator` — drag-to-resize, programmatic collapse/expand, mobile-responsive
19. The AI Command Palette (Cmd+K / Ctrl+K) opens, accepts instructions, processes via AI, and shows diff overlay
20. Toast notifications appear for all AI actions and support undo
21. The entire flow works responsively on mobile with tab-based navigation in step seven
22. Glassmorphism, ambient glow, and micro-interactions are implemented throughout (not just functional — visually premium)
23. AI thinking indicators (sparkle trails, gradient pulse, typing dots) play during all AI operations
24. Section drag-and-drop using `@dnd-kit/core` + `@dnd-kit/sortable` works within and between main/sidebar `SortableContext` areas (for two-column templates)
25. Custom sections can be created with user-defined names and added to the resume
26. Custom CSS editor in the right panel works correctly with enable/disable toggle
27. Sidebar width slider controls the --page-sidebar-width CSS property in real-time for two-column templates
28. TypeScript compiles with zero errors (run npx tsc --noEmit)
29. No hardcoded colors or pixel values — all Tailwind tokens
30. All icons in the Resume Builder use PremiumIcon — no legacy IconXxx components, no emoji
31. The PremiumIcon "soft" variant is used in the wizard step indicator
32. The PremiumIcon "duotone" variant is used in section headers and loading animation
33. Keyboard shortcuts (Cmd+K, Cmd+Z, Cmd+Shift+Z, Cmd+S, Cmd+P, Escape) all function correctly
34. The section-level floating action bar (AI rewrite, shorten, expand, regenerate, hide, drag) appears on hover for each resume section
35. The ATS score breakdown in the right panel has clickable recommendations that trigger AI fixes
36. Export dropdown offers PDF, DOCX, plain text, clipboard, and print — all functional
37. The experience is smooth enough that a non-technical user could produce a professional resume in under five minutes, primarily by talking to the AI rather than manually editing text

---

## Part 8 — Reference Files to Study Before Writing Any Code

Read these files in order before writing a single line of code:

1. src/components/icons.tsx — The EXISTING icon system (one hundred and five icons, the iconMap registry, the IconProps type, the SVG conventions). Study its structure because the PremiumIcon system must follow the same SVG conventions (viewBox="0 0 24 24", fill="none", stroke="currentColor", strokeWidth={2}, strokeLinecap="round", strokeLinejoin="round") while adding the variant/size/theme layer on top.
2. src/stores/business-card-wizard.ts — The Zustand store pattern for wizard navigation + sessionStorage persistence (the WIZARD part of our two-store architecture)
3. src/components/workspaces/BusinessCardWorkspace.tsx — The wizard orchestrator pattern
4. src/components/workspaces/business-card/WizardStepIndicator.tsx — Step indicator UI
5. src/components/workspaces/business-card/StepBrief.tsx — Example of a minimal-input step
6. src/components/workspaces/business-card/StepGeneration.tsx — How auto-generation is triggered
7. src/components/workspaces/business-card/GenerationLoadingAnimation.tsx — The loading animation to replicate
8. src/lib/editor/ai-patch.ts — DMSuite's existing 1,900-line AI revision system for the Business Card tool. Study the dual-mode architecture (deterministic intents + scoped patch operations), the validation pipeline (scope check, lock check, layer existence, value range clamping), the semantic tag targeting system, and the AI prompt builder. The resume revision engine adapts this CONCEPT — but uses `fast-json-patch` + Zod validation as the foundation layer (like Reactive Resume does), with our intent system and validation pipeline layered on top. Study: RevisionScope, IntentType, EditIntent, intentToPatchOps, processIntent, buildAIPatchPrompt for the intent classification pattern.
9. src/lib/editor/ai-design-generator.ts — The AI prompt building pattern (buildDesignGenerationPrompt, parseDesignResponse, validateAndFixDocument)
10. src/app/api/chat/design/route.ts — The API endpoint that calls Claude
11. src/app/globals.css — Theme tokens and design system
12. src/components/ui/ — All UI primitives (Button, Input, Card, Badge, Modal, Tooltip, Dropdown, Accordion)
13. src/app/tools/[categoryId]/[toolId]/page.tsx — How tools are loaded (the dynamic import is already there for "resume-cv")

**Additionally, study these Reactive Resume patterns** (you can view the source at https://github.com/amruthpillai/reactive-resume):
- `src/components/resume/store/resume.ts` — The Zustand + immer + zundo store pattern we're adopting
- `src/routes/builder/$resumeId/route.tsx` — The three-panel `react-resizable-panels` layout we're adopting
- `src/routes/builder/$resumeId/index.tsx` — The `react-zoom-pan-pinch` artboard configuration we're adopting
- `src/components/resume/preview.tsx` — The ResumePreview component with CSS custom properties, ResizeObserver page overflow detection, and template selection via pattern matching
- `src/routes/builder/$resumeId/-sidebar/right/sections/layout/pages.tsx` — The `@dnd-kit` section drag-and-drop between main/sidebar columns
- `src/routes/builder/$resumeId/-components/dock.tsx` — The floating dock with undo/redo (zundo) + zoom controls (react-zoom-pan-pinch useControls)
- `src/utils/resume/patch.ts` — The `fast-json-patch` + Zod validation pattern (`applyResumePatches`)
- `src/schema/resume/data.ts` — The comprehensive Zod resume data schema with all section types

After reading all of these (especially ai-patch.ts — the most architecturally important file), you will understand every convention, pattern, and architectural decision. Then build in this order:

1. FIRST — the PremiumIcon system (src/components/premium-icons.tsx) with the full icon registry, all four variants, size presets, and the premiumIconMap. Verify TypeScript compiles.
2. The Zod resume data schema (src/lib/resume/schema.ts) — define ALL data types: basicsSchema, sectionsSchema, metadataSchema, pageLayoutSchema, resumeDataSchema, and their TypeScript types. This is the foundation everything else depends on.
3. TWO Zustand stores: (a) the wizard store (`src/stores/resume-cv-wizard.ts`) with persist+sessionStorage for Steps 1-6 user-input data, and (b) the resume editor store (`src/stores/resume-editor.ts`) using Zustand + `immer` middleware + `zundo` temporal for the live resume document with built-in undo/redo. Also create a lightweight editor UI store for panel states, zoom level, and active panel tracking. Follow the exact `temporal(immer(...))` pattern from Reactive Resume.
4. The main workspace component (ResumeCVWorkspace.tsx)
5. Each wizard step component one by one (StepPersonal through StepGeneration), using PremiumIcon throughout. Pay special attention to StepBrief which includes the content fidelity toggle and job description paste feature.
6. The JSON Patch utilities (`src/lib/resume/patch-utils.ts`) — built on `fast-json-patch`: `applyResumePatches()` following RR's pattern (validate → apply → Zod safeParse result), `jsonPatchOperationSchema` (Zod discriminated union), `ResumePatchError` class
7. The AI resume generator (src/lib/resume/ai-resume-generator.ts) — builds the generation prompt that respects the content fidelity mode, returns data conforming to resumeDataSchema
8. The shared section rendering components (shared/SectionRenderer.tsx, SectionHeading.tsx, SectionItem.tsx, PageHeader.tsx) — these are used by ALL templates
9. The template components (templates/ClassicTemplate.tsx through templates/CreativeTemplate.tsx) — each consuming CSS custom properties and shared section renderers. Plus templates.ts for template metadata and CSS variable defaults.
10. The template renderer orchestrator (templates/TemplateRenderer.tsx) — maps template ID to component, applies CSS custom properties, handles page layout
11. The ATS scorer (src/lib/resume/ats-scorer.ts) — category-level breakdown with actionable clickable recommendations
12. The AI revision engine (src/lib/resume/ai-revision-engine.ts) — the JSON Patch-based surgical revision pipeline with diff generation
13. The diff utilities (src/lib/resume/diff-utils.ts) — computing and rendering content differences from JSON Patch operations
14. The Step 7 editor orchestrator (StepEditor.tsx) and ALL editor sub-components: DocumentCanvas, AIRevisionPanel, DesignControlsPanel (including custom CSS editor and sidebar width control), AICommandPalette, EditorBottomToolbar, SectionActionBar, DiffOverlay, ExportDropdown
15. Export utilities (src/lib/resume/export.ts) — PDF, DOCX, plain text, clipboard, print

Verify TypeScript compiles after each major component. The final result should be indistinguishable in quality and polish from the Business Card wizard — but for resumes, with a premium visual identity elevated by the new icon system, and a fundamentally AI-first editing experience that makes users feel like they have a career coach working alongside them.

---

## Part 9 — Global Premium Icon Theme System (IMPORTANT — Build This First)

### Why This Matters

The current icon system at src/components/icons.tsx is functional but basic — it is a flat list of one hundred and five Lucide-style stroke icons with no theming capability, no variant system, no size presets, and no visual identity beyond the generic thin-stroke look. Every tool in DMSuite shares these same icons. As we scale from one polished tool (business cards) to many (resumes, invoices, presentations, and dozens more), we need a premium, cohesive icon design language that feels intentional, branded, and unmistakably "DMSuite" — not like a random open-source icon pack.

This is a GLOBAL platform enhancement. Build it as a reusable system that the Resume Builder uses first, but every future tool will benefit from.

### What to Build

Create a new file at src/components/premium-icons.tsx (keeping the existing icons.tsx untouched for backward compatibility). This new file introduces a premium icon component system with the following capabilities:

#### 1. The PremiumIcon Wrapper Component

Create a single universal wrapper component called PremiumIcon that takes these props:

- name (string, required) — the icon identifier, looked up from a premium icon registry
- size ("xs" | "sm" | "md" | "lg" | "xl" | "2xl" — defaulting to "md") — maps to pixel values: xs is twelve pixels, sm is sixteen, md is twenty, lg is twenty-four, xl is thirty-two, 2xl is forty-eight. This replaces the ad-hoc className="size-4" pattern with semantic sizing.
- variant ("stroke" | "solid" | "duotone" | "soft" — defaulting to "stroke") — the visual treatment of the icon:
  - "stroke" is the classic outlined look (what we have now) — thin strokes, no fills
  - "solid" is fully filled shapes — bolder, more prominent, good for active/selected states
  - "duotone" uses two tones — the primary shape in full opacity and secondary shapes at around thirty percent opacity, creating depth. This is the premium differentiator that makes icons feel designed, not just functional.
  - "soft" renders the icon inside a subtle rounded-square background tint (like iOS-style app icons or Notion's colored icon badges) — the icon stroke or solid shape sits on a softly tinted background using the current color at about ten to fifteen percent opacity. Great for dashboard cards, step indicators, and feature highlights.
- color (string, optional) — a Tailwind color class override like "text-primary-500" or "text-cyan-400". If not provided, the icon inherits the current text color (currentColor), which is the standard SVG behavior.
- className (string, optional) — for additional Tailwind utility classes, merged using the project's cn() utility function.
- animated (boolean, optional, defaults to false) — when true, applies a subtle CSS animation appropriate to the context. For example, a sparkles icon might gently pulse, a loader icon spins, a check icon might pop in with a scale animation.
- All standard SVG props should be passed through (onClick, aria-label, role, etc.)

The wrapper renders the appropriate SVG based on the variant prop. For stroke and solid variants, this means different SVG paths or fill attributes. For duotone, specific path elements get a reduced opacity class. For the soft variant, the wrapper renders a rounded-rectangle background element behind the icon SVG.

#### 2. The Premium Icon Registry

Create a premiumIconMap (similar to the existing iconMap but richer) that maps string names to icon definitions. Each entry should contain at minimum the stroke-variant SVG paths. For the initial launch, every icon does NOT need all four variants hand-drawn — the system should gracefully fall back: if "solid" is requested but only "stroke" paths exist for that icon, render the stroke version (do not crash or show nothing). Over time, more variants get added.

#### 3. Icon Categories for Organization

Organize the registry with category comments so the file stays maintainable as it grows. Categories should include:

- Navigation and UI — arrows, chevrons, menu, close, search, filter, sort, expand, collapse, drag handle, external link, home, back
- Actions — plus, minus, edit, delete, save, copy, paste, cut, undo, redo, refresh, download, upload, send, share, print, export
- Status and Feedback — check, check-circle, x-circle, alert-triangle, alert-circle, info-circle, loading, clock, hourglass, ban, shield-check
- Content and Documents — file, file-text, file-pdf, file-image, folder, folder-open, clipboard, document, page, notebook, book, bookmark, newspaper, receipt, invoice
- Communication — mail, inbox, message, chat, phone, video-call, at-sign, link, globe, send
- People and Identity — user, user-plus, user-check, users, team, avatar, badge, id-card, handshake
- Business and Career (critical for the Resume Builder) — briefcase, building, company, graduation-cap, certificate, award, trophy, target, chart-up, chart-bar, pie-chart, presentation, strategy, lightbulb, rocket, milestone
- Creative and Design — palette, pen-tool, brush, color-swatch, layers, grid, layout, frame, crop, wand, sparkles, eye, eyedropper, ruler, shapes, image
- Technology — code, terminal, database, server, cloud, cpu, smartphone, monitor, tablet, wifi, lock, key, api, git-branch
- Finance — dollar, credit-card, wallet, bank, invoice, calculator, percentage, coins, receipt
- Time and Calendar — calendar, clock, alarm, timer, hourglass, schedule, date-range
- Media — play, pause, stop, record, volume, music, headphones, mic, camera, film, gallery
- Maps and Location — map-pin, compass, globe, location, flag, route, navigate
- Nature and Misc — star, heart, sun, moon, cloud, fire, leaf, diamond, crown, gem, tag, hashtag, lightning

This gives us a comprehensive vocabulary of roughly one hundred and fifty to two hundred icons that covers every tool DMSuite will ever build — resumes, invoices, presentations, social media, branding, and beyond.

#### 4. Utility Functions

- getPremiumIcon(name: string): returns the icon definition or undefined (for safe lookups)
- premiumIconNames: a typed union or array of all available icon string keys, enabling autocomplete in the IDE
- a React hook called usePremiumIconTheme() that reads from a global theme context or Zustand setting to provide default variant and size preferences across the app (so a tool workspace can say "in this context, all icons should be duotone and medium" without passing props to every single icon instance)

#### 5. Integration Pattern

The PremiumIcon component should work seamlessly alongside the existing icon system. Do NOT delete or modify src/components/icons.tsx — it has one hundred and five icons used across the entire app and touching it risks breaking everything. Instead:

- The new premium-icons.tsx file is additive
- New components and tools (starting with the Resume Builder) should use PremiumIcon exclusively
- Old components continue using the legacy IconXxx components
- Over time, tools can be migrated one by one from legacy icons to PremiumIcon, but this is NOT required now
- The premium icon registry can internally reuse existing SVG paths from icons.tsx where they overlap — wrapping them with the variant/size/theme system — to avoid duplicating SVG code for icons that already exist

#### 6. Visual Design Language

The premium icons should feel cohesive with DMSuite's brand:
- Stroke weight: one-point-five to two pixels (matching the existing icons and the Lucide/Feather aesthetic)
- Corner radius: subtly rounded line caps and joins (strokeLinecap="round" strokeLinejoin="round" — already the convention)
- Optical consistency: all icons should feel like they occupy the same visual weight within their bounding box, whether they are simple (a plus sign) or complex (a building with windows)
- The duotone variant is the signature look — when the AI loads, when steps complete, when features are highlighted, duotone icons should be the default because they convey premium quality
- The soft variant with its tinted background is perfect for wizard step indicators, dashboard stat cards, and feature callouts — it makes icons feel like first-class UI elements, not afterthoughts

#### 7. Usage in the Resume Builder

Once the PremiumIcon system exists, the Resume Builder wizard should use it throughout:
- Step indicator: each of the seven steps gets a PremiumIcon in "soft" variant (user, briefcase, building, graduation-cap, sparkles, wand, file-text) with the primary green color for the active step, gray for future steps, and a success green for completed steps
- Form sections: each collapsible section header gets a "duotone" icon (mail for contact, briefcase for experience, graduation-cap for education, code for skills, certificate for certifications, globe for languages)
- Action buttons: "stroke" variant for most buttons, "solid" variant for primary CTAs
- Loading animation: "duotone" icons at larger sizes for the generation status steps
- Empty states: "soft" variant at 2xl size for empty experience/education lists, with encouraging text underneath
- The ATS score badge: a shield-check icon in "duotone" that shifts from gray to yellow to green based on the score

This system transforms the entire feel of every wizard and workspace from "generic tool with generic icons" to "premium branded experience with intentional visual design." It is worth building first because every subsequent tool inherits the benefit automatically.
