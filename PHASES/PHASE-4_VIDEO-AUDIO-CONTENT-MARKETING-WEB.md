# DMSuite — PHASE 4: Video, Audio, Content, Marketing & Web Studios

> **Codename:** "Full Spectrum"
> **Duration:** 8–10 Weeks
> **Goal:** Implement all remaining studio categories — Video & Motion, Audio & Voice, Content Creation, Marketing & Sales, and Web & UI Design — to full industry standard.

---

## Global Standards (Same as Phase 3)
All workspaces MUST follow Phase 3 Global Standards (shared shells, shortcuts, responsive, AI, exports, UI primitives, save/load, no hardcoded strings).

---

## Wave 4.1 — Video & Motion Studio

> **Required Dependencies:** `@ffmpeg/ffmpeg` (client-side video processing), Web Audio API
> Install: `npm install @ffmpeg/ffmpeg @ffmpeg/util`

### Task 4.1.1 — Video Editor (Core)
**File:** New `src/components/workspaces/VideoEditorWorkspace.tsx`
**Tool ID:** `video-editor`
**Features:**
- Timeline editor (horizontal track with clips, audio, text overlays)
- Video preview player with play/pause/scrub
- Cut/trim/split operations
- Text overlay system (title cards, lower thirds, subtitles)
- Transitions between clips (fade, dissolve, slide, wipe)
- Audio track management (mute, volume, add music)
- Multi-track support (video + audio + text layers)
- Keyboard shortcuts: `Space` (play/pause), `J/K/L` (rewind/pause/forward), `I/O` (set in/out points), `Ctrl+Z` (undo), `S` (split at playhead)
- Export: MP4, WebM, GIF
- Resolution options: 1080p, 720p, 480p, Custom
- Aspect ratios: 16:9, 9:16, 1:1, 4:5

### Task 4.1.2 — AI Video Generator
**File:** New `src/components/workspaces/AIVideoGeneratorWorkspace.tsx`
**Tool ID:** `ai-video-generator`
**Features:**
- Text-to-video: describe scene → AI generates video (LumaAI/Runway API placeholder)
- Image-to-video: upload still → animate it
- Style presets: cinematic, animated, documentary, commercial, social media
- Duration control: 3s, 5s, 10s, 15s, 30s
- Resolution options
- Prompt enhancement (AI improves user's prompt)
- Generation queue with progress indicator
- Preview before download
- Export: MP4

### Task 4.1.3 — Logo Reveal / Animation Generator
**File:** New `src/components/workspaces/LogoRevealWorkspace.tsx`
**Tool ID:** `logo-animation`
**Features:**
- Upload logo (SVG/PNG) → choose reveal animation
- Animation styles: Fade in, Particle assemble, Draw on (stroke reveal), Glitch, 3D flip, Bounce, Scale up, Liquid morph
- Duration: 2–8 seconds
- Background options: solid color, gradient, transparent
- Sound effects library (whoosh, impact, sparkle, none)
- Preview player with loop
- Export: MP4, GIF, WebM, transparent WebM

### Task 4.1.4 — Subtitle / Caption Generator
**File:** New `src/components/workspaces/SubtitleGeneratorWorkspace.tsx`
**Tool ID:** `subtitle-generator`
**Features:**
- Upload video → AI transcription (Whisper API placeholder)
- Manual subtitle editor (timestamp + text per entry)
- Style options: font, size, color, background, position (top/center/bottom)
- Burn-in subtitles (render on video) or export as file
- Auto-timing from audio analysis
- Multi-language support (translation placeholder)
- Export: SRT, VTT, ASS, burned-in MP4

### Task 4.1.5 — GIF Maker
**File:** New `src/components/workspaces/GifMakerWorkspace.tsx`
**Tool ID:** `gif-maker`
**Features:**
- Video-to-GIF: upload video → select range → convert
- Image sequence to GIF: upload frames → set timing
- Text overlay on GIF frames
- Speed control (0.5x to 3x)
- Size optimization (quality vs file size slider)
- Crop and resize
- Looping options: infinite, 1x, 3x
- Export: GIF, APNG, WebP animated

### Task 4.1.6 — Thumbnail Generator
**File:** New `src/components/workspaces/ThumbnailWorkspace.tsx`
**Tool ID:** `thumbnail-generator`
**Features:**
- Platform presets: YouTube (1280×720), Twitch, Podcast cover, Blog header, Course thumbnail
- Layer-based editor (like Social Media Post but optimized for thumbnails)
- Face detection for smart positioning (AI analysis)
- Text with outline/shadow for readability
- Click-bait score (AI rates engagement potential)
- A/B variant generator
- Templates: 8+ (tech, gaming, education, vlog, business, cooking, fitness, review)
- Export: PNG, JPEG

### Task 4.1.7 — Motion Graphics Templates
**File:** New `src/components/workspaces/MotionGraphicsWorkspace.tsx`
**Tool ID:** `motion-graphics`
**Features:**
- Preset animation templates: Lower thirds, Title cards, Transitions, Intros/Outros, Social bumpers
- Customizable text, colors, timing
- Preview player with loop
- Duration adjustment
- Templates: 10+ per category
- Export: MP4, GIF, WebM

### Task 4.1.8 — Video Compressor
**File:** New `src/components/workspaces/VideoCompressorWorkspace.tsx`
**Tool ID:** `video-compressor`
**Features:**
- Upload video → compress with quality settings
- Format conversion: MP4 ↔ WebM ↔ MOV ↔ AVI
- Resolution downscaling
- Bitrate control
- Before/after size comparison
- Batch processing (multiple files)
- Export: Selected format

---

## Wave 4.2 — Audio & Voice Studio

> **Required Dependencies:** Web Audio API (native), future ElevenLabs API integration

### Task 4.2.1 — Text-to-Speech Generator
**File:** New `src/components/workspaces/TextToSpeechWorkspace.tsx`
**Tool ID:** `text-to-speech`
**Features:**
- Text input with paragraph splitting
- Voice selection (Web Speech API voices + future ElevenLabs)
- Speed control (0.5x to 2x)
- Pitch control
- Emphasis markers in text (bold = emphasis)
- SSML support for advanced users
- Preview playback with waveform
- Export: MP3, WAV, OGG

### Task 4.2.2 — Voice Cloner
**File:** New `src/components/workspaces/VoiceClonerWorkspace.tsx`
**Tool ID:** `voice-cloner`
**Features:**
- Upload voice sample (30s minimum) → create voice profile
- Generate speech with cloned voice (ElevenLabs API placeholder)
- Voice profile management (save, name, delete)
- A/B comparison (original vs cloned)
- Language/accent support
- Export: MP3, WAV

### Task 4.2.3 — Podcast Tools
**File:** New `src/components/workspaces/PodcastToolsWorkspace.tsx`
**Tool ID:** `podcast-tools`
**Features:**
- Cover art generator (square 3000×3000 — layer-based)
- Episode card generator (with guest photo, title, episode number)
- Audio waveform visualizer (audiogram for social media)
- Show notes generator (AI from transcript)
- RSS feed metadata editor
- Templates: 6+ cover art styles
- Export: PNG (cover), MP4 (audiogram), Markdown (show notes)

### Task 4.2.4 — Music Generator
**File:** New `src/components/workspaces/MusicGeneratorWorkspace.tsx`
**Tool ID:** `music-generator`
**Features:**
- Genre selection: ambient, corporate, upbeat, dramatic, chill, electronic
- Mood: happy, sad, energetic, calm, mysterious, epic
- Duration: 15s, 30s, 60s, 2min, 5min
- Instrument focus: piano, guitar, strings, synth, drums, full orchestra
- AI generation (Suno/Udio API placeholder)
- Preview player with waveform
- Looping option
- Export: MP3, WAV, MIDI

### Task 4.2.5 — Transcription Tool
**File:** New `src/components/workspaces/TranscriptionWorkspace.tsx`
**Tool ID:** `transcription`
**Features:**
- Upload audio/video → AI transcription (Whisper API)
- Speaker identification (Speaker 1, Speaker 2, etc.)
- Timestamp toggles
- Edit transcription text inline
- Search within transcript
- Language detection
- Export: TXT, SRT, VTT, DOCX, PDF

---

## Wave 4.3 — Content Creation Studio

### Task 4.3.1 — Blog Post Writer
**File:** New `src/components/workspaces/BlogWriterWorkspace.tsx`
**Tool ID:** `blog-writer`
**Features:**
- Rich text editor (TipTap/ProseMirror integration)
- SEO: Title tag, meta description, focus keyword, readability score
- Heading structure (H1-H6) with outline panel
- Image insertion with alt text
- Internal linking suggestions
- Word count, reading time, Flesch-Kincaid readability
- AI: Generate from topic + keywords, expand section, rewrite paragraph, summarize
- Tone selector: professional, casual, academic, conversational
- Export: HTML, Markdown, DOCX, PDF
- Keyboard: `Ctrl+B/I/U`, `Ctrl+Shift+1-6` for headings

### Task 4.3.2 — Social Media Copy Generator
**File:** New `src/components/workspaces/SocialCopyWorkspace.tsx`
**Tool ID:** `social-media-copy`
**Features:**
- Platform tabs: Instagram, Facebook, Twitter/X, LinkedIn, TikTok, Pinterest
- Character count per platform (with limit warnings)
- Hashtag generator (relevant hashtags by topic)
- Emoji suggestions
- A/B variant generator (multiple copy versions)
- Tone: professional, casual, humorous, inspiring, urgent
- CTA templates
- AI: Generate from topic, regenerate variations
- Export: Copy to clipboard, CSV (bulk), Markdown

### Task 4.3.3 — Email Copywriter
**File:** New `src/components/workspaces/EmailCopyWorkspace.tsx`
**Tool ID:** `email-copywriter`
**Features:**
- Types: Cold outreach, Newsletter, Follow-up, Promotion, Welcome, Re-engagement
- Subject line generator (A/B variants with engagement scoring)
- Preview text (preheader)
- Body editor with personalization tokens
- CTA builder
- Spam score checker (word analysis)
- AI: Generate from goal + audience
- Export: Plain text, HTML, Copy to clipboard

### Task 4.3.4 — Product Description Writer
**File:** New `src/components/workspaces/ProductDescriptionWorkspace.tsx`
**Tool ID:** `product-description`
**Features:**
- Product info input: name, features, benefits, specifications, target audience
- Description formats: Short (50 words), Medium (150 words), Long (300+ words)
- Platform optimization: Amazon, Shopify, eBay, General e-commerce
- SEO keywords integration
- Bullet points generator
- Tone: luxury, budget-friendly, technical, lifestyle
- AI: Generate from product name + features
- Export: Copy to clipboard, HTML, Markdown

### Task 4.3.5 — Content Calendar
**File:** New `src/components/workspaces/ContentCalendarWorkspace.tsx`
**Tool ID:** `content-calendar`
**Features:**
- Monthly calendar view with draggable content items
- Weekly and daily views
- Content types: Blog, Social, Email, Video, Podcast (color-coded)
- Platform tags per item
- Status: Draft, Scheduled, Published, Archived
- Bulk scheduling (fill week with AI suggestions)
- AI: Generate content plan from business goals
- Export: CSV, PDF, iCal

### Task 4.3.6 — SEO Optimizer
**File:** New `src/components/workspaces/SEOOptimizerWorkspace.tsx`
**Tool ID:** `seo-optimizer`
**Features:**
- URL input → analyze page (placeholder for real crawl)
- On-page SEO checklist: title, meta, headings, images, links, content length
- Keyword density analyzer
- Competitor keyword analysis (placeholder)
- Schema markup generator (JSON-LD)
- Meta tag preview (Google, Facebook, Twitter)
- Readability scoring
- AI: Suggest improvements
- Export: PDF report, JSON (schema), Copy tags

---

## Wave 4.4 — Marketing & Sales Studio

### Task 4.4.1 — Landing Page Builder
**File:** New `src/components/workspaces/LandingPageWorkspace.tsx`
**Tool ID:** `landing-page`
**Features:**
- Block-based page builder: Hero, Features, Testimonials, Pricing, FAQ, CTA, Footer
- Drag-drop block reordering
- Block configuration (text, images, layout options)
- Responsive preview (desktop, tablet, mobile side-by-side)
- Color theme system (brand colors)
- Templates: 8+ (SaaS, e-commerce, event, portfolio, agency, course, app, service)
- AI: Generate page content from business description
- Export: HTML + CSS (standalone), Screenshot PNG

### Task 4.4.2 — Sales Funnel Designer
**File:** New `src/components/workspaces/SalesFunnelWorkspace.tsx`
**Tool ID:** `sales-funnel`
**Features:**
- Visual funnel builder (drag-drop stages)
- Stages: Awareness, Interest, Consideration, Decision, Action
- Each stage: page mockup, conversion metrics (placeholder), content suggestions
- Funnel flow connections (arrows between stages)
- A/B split paths
- AI: Generate funnel strategy from product/service
- Export: PDF (strategy doc), PNG (visual diagram)

### Task 4.4.3 — Lead Magnet Creator
**File:** New `src/components/workspaces/LeadMagnetWorkspace.tsx`
**Tool ID:** `lead-magnet`
**Features:**
- Types: PDF Guide, Checklist, Infographic, Template, Cheat Sheet, Workbook
- Multi-page PDF builder (cover + content pages)
- Section-based editing
- Download gate preview (mockup of landing page)
- Templates: 6+ per type
- AI: Generate lead magnet content from topic
- Export: PDF (printable + digital versions)

### Task 4.4.4 — Email Sequence Builder
**File:** New `src/components/workspaces/EmailSequenceWorkspace.tsx`
**Tool ID:** `email-sequence`
**Features:**
- Visual sequence builder (flowchart-style)
- Email nodes with: delay (1 day, 3 days, 1 week), content, subject line
- Conditional branches (opened/not opened, clicked/not clicked)
- Sequence types: Welcome, Nurture, Onboarding, Re-engagement, Sales
- Email preview at each node
- AI: Generate full sequence from goal
- Export: CSV (for import to Mailchimp/ConvertKit), PDF (strategy doc), JSON

### Task 4.4.5 — QR Code Generator
**File:** New `src/components/workspaces/QRCodeWorkspace.tsx`
**Tool ID:** `qr-code`
**Features:**
- Data types: URL, Text, Email, Phone, WiFi, vCard, Location, SMS
- Visual customization: color, background, corner style, dot style
- Logo insertion in center (with background area)
- Error correction levels (L/M/Q/H)
- Size control (100px to 4000px)
- Batch generation (CSV → multiple QR codes)
- Templates: 6+ styles (rounded, dots, classic, branded, minimal, artistic)
- Export: PNG, SVG, PDF, EPS

### Task 4.4.6 — Analytics Dashboard (Marketing)
**File:** New `src/components/workspaces/AnalyticsDashboardWorkspace.tsx`
**Tool ID:** `analytics-dashboard`
**Features:**
- Widget-based dashboard builder
- Widget types: Line chart, Bar chart, Pie chart, Number card, Table, Funnel
- Data input: manual entry or CSV upload
- Time period selectors
- Comparison modes (period over period)
- Drag-drop widget arrangement
- AI: Generate insights from data
- Export: PDF report, PNG, CSV data

---

## Wave 4.5 — Web & UI Design Studio

### Task 4.5.1 — Wireframe Builder
**File:** New `src/components/workspaces/WireframeWorkspace.tsx`
**Tool ID:** `wireframe`
**Features:**
- Component library: Header, Nav, Hero, Card, Form, Table, List, Footer, Button, Input, Image placeholder, Text block
- Drag-drop component placement
- Grid system (12-column responsive grid)
- Annotation system (numbered notes)
- Page flow connections (link between wireframe pages)
- Fidelity toggle: low-fi (boxes/lines) vs mid-fi (styled components)
- Templates: 8+ page types (home, about, product, blog, contact, login, dashboard, e-commerce)
- AI: Generate wireframe from description
- Export: PNG, PDF, SVG

### Task 4.5.2 — UI Component Designer
**File:** New `src/components/workspaces/UIComponentWorkspace.tsx`
**Tool ID:** `ui-components`
**Features:**
- Component editor: Button, Input, Card, Modal, Dropdown, Tab, Badge, Avatar, Switch, Checkbox
- Live customization: colors, sizes, border radius, shadows, typography
- State variants: default, hover, active, disabled, focus
- Code export: React/TSX, HTML/CSS, Tailwind classes
- Component preview grid (all states side-by-side)
- Design token export (CSS variables, JSON)
- Templates: 4 design system starters (Material, iOS, Tailwind, Custom)
- Export: React code, CSS, PNG previews, Figma-compatible JSON

### Task 4.5.3 — Color Palette Generator
**File:** New `src/components/workspaces/ColorPaletteWorkspace.tsx`
**Tool ID:** `color-palette`
**Features:**
- Generation methods: Complementary, Analogous, Triadic, Split-complementary, Monochromatic, Custom
- Base color picker (hex, RGB, HSL)
- Accessibility checker (WCAG contrast ratios for text/bg combinations)
- Palette visualization: swatches, gradient, context mockup
- Color blindness simulation (Deuteranopia, Protanopia, Tritanopia)
- Name generation for colors
- AI: Generate palette from mood/brand description
- Export: CSS variables, JSON, Tailwind config, PNG, ASE (Adobe)

### Task 4.5.4 — Icon Generator
**File:** New `src/components/workspaces/IconGeneratorWorkspace.tsx`
**Tool ID:** `icon-generator`
**Features:**
- AI-powered icon generation from description
- Style options: Line, Filled, Duotone, Flat, 3D, Pixel
- Size grid: 16×16, 24×24, 32×32, 48×48, 64×64, 128×128
- Color customization
- Batch generation (multiple icons from comma-separated terms)
- Icon set consistency (generate matching style across set)
- Export: SVG, PNG (all sizes), ICO, PDF sprite sheet

---

## Wave 4.6 — Utilities & Workflow Studio

### Task 4.6.1 — File Converter
**File:** New `src/components/workspaces/FileConverterWorkspace.tsx`
**Tool ID:** `file-converter`
**Features:**
- Image conversions: PNG ↔ JPG ↔ WebP ↔ SVG ↔ GIF ↔ BMP ↔ TIFF
- Document conversions: Markdown → HTML, HTML → Markdown
- Batch conversion (multiple files at once)
- Quality/compression settings
- Resize during conversion
- Drag-and-drop file upload zone
- Progress indicator per file
- Export: Converted files (download all as zip if multiple)

### Task 4.6.2 — Batch Processing Tool
**File:** New `src/components/workspaces/BatchProcessorWorkspace.tsx`
**Tool ID:** `batch-processor`
**Features:**
- Operations: Resize, Crop, Watermark, Format convert, Compress, Rename
- Upload multiple files (drag-and-drop zone)
- Configuration per operation
- Preview before/after for first file
- Progress bar with file count
- Error handling per file (skip failures, continue)
- Export: Zip download of all processed files

### Task 4.6.3 — Image Background Remover
**File:** New `src/components/workspaces/BackgroundRemoverWorkspace.tsx`
**Tool ID:** `background-remover`
**Features:**
- Upload image → AI removes background (ONNX model or API)
- Manual refinement brush (add/remove mask areas)
- Background replacement: solid color, gradient, image, transparent
- Edge refinement (feather, smooth)
- Batch processing
- Export: PNG (transparent), JPEG (with new background)

### Task 4.6.4 — Image Enhancer / Upscaler
**File:** New `src/components/workspaces/ImageEnhancerWorkspace.tsx`
**Tool ID:** `image-enhancer`
**Features:**
- Upload image → AI enhance (brightness, contrast, sharpness, noise reduction)
- Upscale: 2x, 4x resolution (AI super-resolution API placeholder)
- Before/after comparison slider
- Manual adjustment sliders: brightness, contrast, saturation, sharpness, temperature
- Filters: Vintage, Cool, Warm, B&W, High contrast, Soft, Cinematic
- Batch enhance
- Export: PNG, JPEG (with quality slider)

### Task 4.6.5 — PDF Tools
**File:** New `src/components/workspaces/PDFToolsWorkspace.tsx`
**Tool ID:** `pdf-tools`
**Features:**
- Merge PDFs (reorder pages from multiple files)
- Split PDF (extract pages by range)
- Compress PDF (reduce file size)
- PDF to Image (per-page PNG export)
- Image to PDF (multiple images → single PDF)
- Rotate pages
- Add watermark to PDF
- Password protect (placeholder for encryption)
- Page number insertion
- Client-side processing (`pdf-lib` library)

---

## Deliverables Checklist — Phase 4
- [ ] All Video tools: editor, AI generator, logo reveal, subtitles, GIF, thumbnail, motion graphics, compressor
- [ ] All Audio tools: TTS, voice clone, podcast, music, transcription
- [ ] All Content tools: blog writer, social copy, email copy, product description, calendar, SEO
- [ ] All Marketing tools: landing page, funnel, lead magnet, email sequence, QR code, analytics
- [ ] All Web/UI tools: wireframe, components, color palette, icon generator
- [ ] All Utility tools: file converter, batch processor, background remover, enhancer, PDF tools
- [ ] Video editor has full timeline with keyboard shortcuts
- [ ] Rich text editor (TipTap) integrated for content tools
- [ ] All tools responsive, shortcut-enabled, AI-powered
- [ ] All tools export to proper industry formats
- [ ] 40+ new workspace components built
- [ ] Dependencies installed: `@ffmpeg/ffmpeg`, `pptxgenjs`, `jspdf`, `pdf-lib`, TipTap, etc.
