# DMSuite — Open-Source Tool Matching Guide

> **Last updated:** 2026-04-04
> **Purpose:** Map every DMSuite tool to the best open-source GitHub project that can replace the current implementation.
> **Approved method:** NPM Package Wrapper ONLY (Excalidraw pattern — see GITHUB-TOOL-PORTING-GUIDE.md)
> **Already approved:** `sketch-board` → Excalidraw ✅

---

## How This Document Works

Each tool is mapped to a **Core Engine** — an npm package that provides the primary functionality. Some engines cover many tools (e.g., Plate covers 30+ writing/document tools). The table also lists the **Strategy** for how the tool maps to the engine.

### Engine Tiers

| Tier | Meaning |
|------|---------|
| 🟢 **DIRECT** | A specific npm package exists that IS this tool. Install & wrap. |
| 🔵 **ENGINE** | A powerful multi-purpose engine covers this tool as one of its modes/features. |
| 🟡 **COMPOSE** | Requires combining 2+ npm packages (e.g., editor + PDF export). |
| 🔴 **NO MATCH** | No suitable open-source React npm package exists. Needs custom build or API integration. |

### License Key

| Badge | License |
|-------|---------|
| ✅ MIT | Fully permissive |
| ✅ Apache-2.0 | Permissive (must state changes) |
| ✅ BSD | Permissive |
| ✅ ISC | Equivalent to MIT |
| ⚠️ Custom | Conditional — read before using |
| ❌ GPL/AGPL | Cannot use |

---

## Core Engines (npm Packages)

These are the foundational packages that power most tools. Install once, reuse across many workspaces.

| # | Engine | npm Package | GitHub | Stars | License | Weekly DL | Covers |
|---|--------|-------------|--------|-------|---------|-----------|--------|
| E1 | **Plate** (Rich text + AI) | `@udecode/plate` / `@platejs/*` | udecode/plate | 16.1K | ✅ MIT | 180K+ | 30+ writing/document tools |
| E2 | **Novel** (Notion-style + AI) | `novel` | steven-tey/novel | 16.1K | ✅ Apache-2.0 | 15K+ | Alternative to Plate for simpler editors |
| E3 | **GrapeJS** (Visual builder) | `grapesjs` + `@grapesjs/react` | GrapeJS/grapesjs | 23K+ | ✅ BSD-3 | 100K+ | Web builder, email template, landing page |
| E4 | **Fabric.js** (Canvas) | `fabric` | fabricjs/fabric.js | 31K+ | ✅ MIT | 740K+ | Visual design tools (cards, posters, etc.) |
| E5 | **Remotion** (React video) | `remotion` | remotion-dev/remotion | 41.8K | ⚠️ Custom¹ | 50K+ | 15+ video/motion tools |
| E6 | **Reveal.js** (Presentations) | `reveal.js` | hakimel/reveal.js | 68K+ | ✅ MIT | 44K+ | Presentations, slideshows |
| E7 | **wavesurfer.js** (Audio) | `wavesurfer.js` | katspaugh/wavesurfer.js | 9K+ | ✅ BSD-3 | 300K+ | Audio editing, podcast, voice tools |
| E8 | **@react-pdf/renderer** (PDF) | `@react-pdf/renderer` | diegomura/react-pdf | 15K+ | ✅ MIT | 2.2M+ | PDF generation for all print tools |
| E9 | **Reactive Resume** | `reactive-resume` (source port) | AmruthPillworked/Reactive-Resume | 36.1K | ✅ MIT | N/A | Resume, CV, cover letter |
| E10 | **React Email** | `@react-email/components` | resend/react-email | 15K+ | ✅ MIT | 500K+ | Email templates, campaigns |
| E11 | **FFmpeg WASM** (Video processing) | `@ffmpeg/ffmpeg` | ffmpegwasm/ffmpeg.wasm | 15K+ | ✅ MIT | 200K+ | Video conversion, trimming, compression |
| E12 | **Lottie React** (Animations) | `lottie-react` | Gamote/lottie-react | 1K+ | ✅ MIT | 500K+ | Logo animations, motion graphics |
| E13 | **QRCode React** | `qrcode.react` | zpao/qrcode.react | 4K+ | ✅ ISC | 2M+ | QR codes |
| E14 | **react-barcode** | `react-barcode` | kciter/react-barcode | 600+ | ✅ MIT | 100K+ | Barcodes |
| E15 | **react-colorful** | `react-colorful` | omgovich/react-colorful | 3.3K | ✅ MIT | 17M+ | Color picker/palette |
| E16 | **Framer Motion** (Animations) | `motion` | motiondivision/motion | 23K | ✅ MIT | 40M+ | UI animations, transitions |

> ¹ **Remotion license:** Free for companies with <$1M annual revenue. Company license required above that. Read their LICENSE.md before using.

---

## DESIGN STUDIO (44 tools)

| # | Tool ID | Tool Name | Engine | Strategy | Notes |
|---|---------|-----------|--------|----------|-------|
| 1 | `logo-generator` | Logo Generator | E4 Fabric.js | 🔵 ENGINE | Canvas-based logo composition. AI generates SVG elements. |
| 2 | `logo-animation` | Logo Reveal & Animation | E12 Lottie + E16 Motion | 🟡 COMPOSE | Lottie for pre-built animations, Motion for custom transitions. |
| 3 | `brand-identity` | Brand Identity Kit | E4 Fabric.js + E8 PDF | 🟡 COMPOSE | Multi-page brand document: logo placement, colors, typography. |
| 4 | `brand-guidelines` | Brand Guidelines Document | E1 Plate + E8 PDF | 🟡 COMPOSE | Rich-text document editor with PDF export. |
| 5 | `business-card` | Business Card Designer | E4 Fabric.js | 🔵 ENGINE | Fixed-size canvas (1050×600), templates, print-ready export. |
| 6 | `letterhead` | Letterhead Designer | E4 Fabric.js | 🔵 ENGINE | A4 canvas, header/footer templates. |
| 7 | `envelope` | Envelope Designer | E4 Fabric.js | 🔵 ENGINE | DL/C5 canvas sizes. |
| 8 | `compliment-slip` | Compliment Slip Designer | E4 Fabric.js | 🔵 ENGINE | Fixed-size print template. |
| 9 | `stamp-seal` | Stamp & Seal Designer | E4 Fabric.js | 🔵 ENGINE | Circular/oval canvas with path text. |
| 10 | `social-media-post` | Social Media Post Designer | E4 Fabric.js | 🔵 ENGINE | Multiple preset sizes (1080×1080, 1200×630, etc.). |
| 11 | `social-media-story` | Story & Reel Cover Designer | E4 Fabric.js | 🔵 ENGINE | Vertical 1080×1920 canvas. |
| 12 | `social-media-carousel` | Carousel Post Designer | E4 Fabric.js | 🔵 ENGINE | Multi-page 1080×1080 canvas. |
| 13 | `social-profile-kit` | Social Profile Kit | E4 Fabric.js | 🔵 ENGINE | Multi-canvas (avatar, cover, banner). |
| 14 | `pinterest-pin` | Pinterest Pin Designer | E4 Fabric.js | 🔵 ENGINE | 1000×1500 canvas. |
| 15 | `banner-ad` | Banner & Display Ad Creator | E4 Fabric.js | 🔵 ENGINE | IAB standard sizes (728×90, 300×250, etc.). |
| 16 | `poster` | Poster Designer | E4 Fabric.js | 🔵 ENGINE | A3/A2 canvas, templates. |
| 17 | `flyer` | Flyer & Leaflet Designer | E4 Fabric.js | 🔵 ENGINE | A4/A5/Letter canvas. |
| 18 | `brochure` | Brochure Designer | E4 Fabric.js | 🔵 ENGINE | Multi-panel (bi-fold, tri-fold) canvas. |
| 19 | `rack-card` | Rack Card Designer | E4 Fabric.js | 🔵 ENGINE | 4×9" canvas. |
| 20 | `door-hanger` | Door Hanger Designer | E4 Fabric.js | 🔵 ENGINE | Custom die-cut shape canvas. |
| 21 | `infographic` | Infographic Maker | E4 Fabric.js | 🔵 ENGINE | Tall vertical canvas (800×2400+). |
| 22 | `magazine-layout` | Magazine Layout Designer | E4 Fabric.js | 🔵 ENGINE | Multi-page spread canvas. |
| 23 | `book-cover` | Book Cover Designer | E4 Fabric.js | 🔵 ENGINE | Standard book sizes (6×9", 5.5×8.5"). |
| 24 | `newspaper-ad` | Newspaper & Magazine Ad | E4 Fabric.js | 🔵 ENGINE | Column-width templates. |
| 25 | `icon-illustration` | Icon & Illustration Generator | 🔴 NO MATCH | 🔴 | Needs AI image gen API (Stability AI, DALL-E). No React npm wrapper. |
| 26 | `background-remover` | Background Remover | `@imgly/background-removal` | 🟢 DIRECT | IMG.LY, MIT, ~7K★, runs ONNX model in browser. npm: `@imgly/background-removal` |
| 27 | `image-enhancer` | Image Enhancer & Upscaler | `upscaler` | 🟢 DIRECT | TensorFlow.js super-resolution, MIT. npm: `upscaler` |
| 28 | `photo-retoucher` | Photo Retoucher | E4 Fabric.js + filters | 🔵 ENGINE | Fabric.js built-in image filters (brightness, contrast, saturation, blur). |
| 29 | `ai-image-generator` | AI Image Generator | 🔴 NO MATCH | 🔴 | Needs external API (Stability AI, OpenAI DALL-E, Replicate). Build custom UI. |
| 30 | `image-inpainting` | AI Image Editor (Inpainting) | 🔴 NO MATCH | 🔴 | Needs ML model + API. No browser-ready React package. |
| 31 | `mockup-generator` | Mockup Generator | E4 Fabric.js | 🔵 ENGINE | Perspective transform + image placement on device frames. |
| 32 | `packaging-design` | Packaging Designer | E4 Fabric.js | 🔵 ENGINE | Box unfold template canvas. |
| 33 | `label-designer` | Product Label Designer | E4 Fabric.js | 🔵 ENGINE | Small-format canvas with bleed marks. |
| 34 | `sticker-designer` | Sticker & Decal Designer | E4 Fabric.js | 🔵 ENGINE | Die-cut shape canvas with transparent export. |
| 35 | `signage` | Signage & Large Format | E4 Fabric.js | 🔵 ENGINE | Large-format canvas (banner stands, billboards). |
| 36 | `vehicle-wrap` | Vehicle Wrap Designer | E4 Fabric.js | 🔵 ENGINE | Vehicle template overlay canvas (custom mockup). |
| 37 | `window-graphics` | Window & Wall Graphics | E4 Fabric.js | 🔵 ENGINE | Custom dimension canvas. |
| 38 | `exhibition-stand` | Exhibition Stand & Booth | E4 Fabric.js | 🔵 ENGINE | Multi-panel stand template. |
| 39 | `tshirt-merch` | T-Shirt & Apparel Designer | E4 Fabric.js | 🔵 ENGINE | Apparel mockup + design area canvas. |
| 40 | `uniform-designer` | Uniform & Workwear Designer | E4 Fabric.js | 🔵 ENGINE | Clothing template canvas. |
| 41 | `pattern-texture` | Pattern & Texture Generator | E4 Fabric.js | 🔵 ENGINE | Tile-repeat pattern canvas. |
| 42 | `color-palette` | Color Palette Generator | E15 react-colorful | 🟢 DIRECT | react-colorful (17M DL/week, 2.8KB). Generate color schemes. |
| 43 | `typography-pairing` | Typography Pairing Tool | 🔴 NO MATCH | 🔴 | Needs Google Fonts API integration. Custom UI. |
| 44 | `mood-board` | Mood Board Creator | Excalidraw ✅ | 🔵 ENGINE | Freeform canvas — same engine as Sketch Board. Create as 2nd Excalidraw workspace with mood board templates. |

**Design Studio summary:** 30 tools → Fabric.js | 3 tools → 🔴 NO MATCH | rest → specific packages

---

## DOCUMENT & PRINT STUDIO (45 tools)

| # | Tool ID | Tool Name | Engine | Strategy | Notes |
|---|---------|-----------|--------|----------|-------|
| 1 | `product-catalog` | Product Catalog Designer | E4 Fabric.js | 🔵 ENGINE | Multi-page canvas with data merge. |
| 2 | `lookbook` | Lookbook Creator | E4 Fabric.js | 🔵 ENGINE | Fashion-style multi-page layout. |
| 3 | `price-list` | Price List & Rate Card | E1 Plate + E8 PDF | 🟡 COMPOSE | Rich table editor → PDF export. |
| 4 | `line-sheet` | Wholesale Line Sheet | E4 Fabric.js | 🔵 ENGINE | Grid layout canvas with product images. |
| 5 | `company-profile` | Company Profile Designer | E1 Plate + E8 PDF | 🟡 COMPOSE | Long-form rich text → styled PDF. |
| 6 | `proposal-generator` | Proposal & Pitch Deck | E1 Plate + E8 PDF | 🟡 COMPOSE | AI-assisted document writing → PDF export. |
| 7 | `presentation` | Presentation Designer | E6 Reveal.js | 🟢 DIRECT | reveal.js — 68K★, MIT, HTML presentations. Needs React wrapper (`react-reveal-slides` or custom). |
| 8 | `report-generator` | Report Generator | E1 Plate + E8 PDF | 🟡 COMPOSE | Structured document editor → PDF. |
| 9 | `newsletter-print` | Printed Newsletter Designer | E4 Fabric.js | 🔵 ENGINE | Multi-column print layout canvas. |
| 10 | `invoice-designer` | Invoice Book Designer | E4 Fabric.js | 🔵 ENGINE | Template-based canvas, already Fabric. |
| 11 | `quote-estimate` | Quotation Book Designer | E4 Fabric.js | 🔵 ENGINE | Shares SalesBook engine. |
| 12 | `receipt-designer` | Receipt Book Designer | E4 Fabric.js | 🔵 ENGINE | Shares SalesBook engine. |
| 13 | `purchase-order` | Purchase Order Book Designer | E4 Fabric.js | 🔵 ENGINE | Shares SalesBook engine. |
| 14 | `delivery-note` | Delivery Note Book Designer | E4 Fabric.js | 🔵 ENGINE | Shares SalesBook engine. |
| 15 | `credit-note` | Credit Note Book Designer | E4 Fabric.js | 🔵 ENGINE | Shares SalesBook engine. |
| 16 | `proforma-invoice` | Proforma Invoice Book Designer | E4 Fabric.js | 🔵 ENGINE | Shares SalesBook engine. |
| 17 | `statement-of-account` | Statement of Account | E1 Plate + E8 PDF | 🟡 COMPOSE | Table-heavy document → PDF. |
| 18 | `contract-template` | Contract & Agreement Creator | E1 Plate + E8 PDF | 🟡 COMPOSE | Legal document editor with clause library. AI-generated. |
| 19 | `document-signer` | Document Signer & Form Filler | **DocuSeal** ⚠️ | 🟢 DIRECT | docuseal/docuseal — 10K+★. **License: AGPL-3.0** ❌ Cannot use directly. Alternative: `react-signature-canvas` (MIT) for signature capture only. |
| 20 | `business-plan` | Business Plan Writer | E1 Plate + E8 PDF | 🟡 COMPOSE | AI-driven long-form writing → PDF. |
| 21 | `employee-handbook` | Employee Handbook Creator | E1 Plate + E8 PDF | 🟡 COMPOSE | Template-driven document. |
| 22 | `job-description` | Job Description Generator | E1 Plate | 🔵 ENGINE | AI-generated structured text. |
| 23 | `certificate` | Certificate Designer | E4 Fabric.js | 🔵 ENGINE | Template canvas with text fields. Already Fabric-based. |
| 24 | `diploma-designer` | Diploma & Accreditation | E4 Fabric.js | 🔵 ENGINE | Template canvas. Already Fabric-based. |
| 25 | `gift-voucher` | Gift Voucher & Coupon | E4 Fabric.js | 🔵 ENGINE | Template canvas. Already Fabric-based. |
| 26 | `menu-designer` | Menu Designer | E4 Fabric.js | 🔵 ENGINE | Template canvas. Already Fabric-based. |
| 27 | `real-estate-listing` | Real Estate Feature Sheet | E4 Fabric.js + E8 PDF | 🟡 COMPOSE | Photo layout canvas → PDF. |
| 28 | `event-program` | Event Program & Agenda | E1 Plate + E8 PDF | 🟡 COMPOSE | Structured schedule document. |
| 29 | `ticket-designer` | Ticket & Pass Designer | E4 Fabric.js | 🔵 ENGINE | Template canvas. Already Fabric-based. |
| 30 | `id-badge` | ID Badge & Lanyard Designer | E4 Fabric.js | 🔵 ENGINE | CR80 canvas. Already Fabric-based. |
| 31 | `calendar-designer` | Calendar Designer | E4 Fabric.js | 🔵 ENGINE | Grid layout canvas with date logic. |
| 32 | `training-manual` | Training Manual Creator | E1 Plate + E8 PDF | 🟡 COMPOSE | Long-form structured document. |
| 33 | `user-guide` | User Guide & Documentation | E1 Plate + E8 PDF | 🟡 COMPOSE | Documentation with TOC + sections. |
| 34 | `worksheet-designer` | Worksheet & Form Designer | E1 Plate + E8 PDF | 🟡 COMPOSE | Form elements + layout → PDF. |
| 35 | `white-paper` | White Paper Generator | E1 Plate + E8 PDF | 🟡 COMPOSE | AI-assisted long-form writing. |
| 36 | `case-study` | Case Study Creator | E1 Plate + E8 PDF | 🟡 COMPOSE | Template-driven narrative document. |
| 37 | `media-kit` | Media Kit & Press Kit | E4 Fabric.js + E8 PDF | 🟡 COMPOSE | Visual layout + data export. |
| 38 | `ebook-creator` | eBook & Digital Publication | E1 Plate + E8 PDF | 🟡 COMPOSE | Multi-chapter document editor. |
| 39 | `resume-cv` | Resume & CV Builder | E9 Reactive Resume | 🟢 DIRECT | reactive-resume — 36.1K★, MIT. Full-featured resume builder. |
| 40 | `resume-cv-v2` | Resume Builder V2 | E9 Reactive Resume | 🟢 DIRECT | Already a Reactive Resume port. |
| 41 | `cover-letter` | Cover Letter Writer | E1 Plate | 🔵 ENGINE | AI writing + template formatting. |
| 42 | `portfolio-builder` | Portfolio Builder | E4 Fabric.js | 🔵 ENGINE | Multi-page visual layout canvas. |
| 43 | `invitation-designer` | Invitation Designer | E4 Fabric.js | 🔵 ENGINE | Template canvas with decorative elements. |
| 44 | `greeting-card` | Greeting Card Designer | E4 Fabric.js | 🔵 ENGINE | Folded card canvas (front/inside/back). |
| 45 | `sketch-board` | Sketch Board | Excalidraw ✅ | ✅ APPROVED | Already complete and approved. |

---

## VIDEO & MOTION STUDIO (30 tools)

| # | Tool ID | Tool Name | Engine | Strategy | Notes |
|---|---------|-----------|--------|----------|-------|
| 1 | `video-editor` | AI Video Editor | E5 Remotion ⚠️ | 🔵 ENGINE | Remotion — 41.8K★. Programmatic video with React. **License: conditional (free <$1M revenue)**. |
| 2 | `video-trimmer` | Smart Video Trimmer | E11 FFmpeg WASM | 🟢 DIRECT | @ffmpeg/ffmpeg — browser-based video trimming. MIT. |
| 3 | `video-merger` | Video Merger & Joiner | E11 FFmpeg WASM | 🟢 DIRECT | FFmpeg concat demuxer in browser. |
| 4 | `motion-graphics` | Motion Graphics Creator | E5 Remotion ⚠️ | 🔵 ENGINE | React component → video frames. |
| 5 | `logo-reveal` | Logo Reveal Maker | E12 Lottie + E16 Motion | 🟡 COMPOSE | Pre-built Lottie templates + custom Motion animations. |
| 6 | `intro-outro` | Intro & Outro Creator | E5 Remotion ⚠️ | 🔵 ENGINE | Template-driven video sequences. |
| 7 | `text-animation` | Text & Title Animation | E16 Motion | 🟢 DIRECT | Framer Motion spring/keyframe text animations. |
| 8 | `kinetic-typography` | Kinetic Typography | E5 Remotion ⚠️ | 🔵 ENGINE | Timed text sequences → video. |
| 9 | `transition-effects` | Transition & Effects Library | E5 Remotion ⚠️ | 🔵 ENGINE | Composable transition components. |
| 10 | `particle-effects` | Particle & VFX Creator | `tsparticles` + E16 Motion | 🟡 COMPOSE | tsparticles (MIT, 8K★) for particle systems. |
| 11 | `3d-text` | 3D Text & Object Animator | `@react-three/fiber` | 🟢 DIRECT | react-three-fiber — 28K★, MIT. 3D rendering in React. |
| 12 | `text-to-video` | Text-to-Video Generator | 🔴 NO MATCH | 🔴 | Needs AI video gen API (Runway, Pika, Synthesia). No browser package. |
| 13 | `image-to-video` | Image-to-Video Animator | E5 Remotion ⚠️ | 🔵 ENGINE | Image sequence → video via Remotion. |
| 14 | `ai-b-roll` | AI B-Roll Generator | 🔴 NO MATCH | 🔴 | Needs AI video API. |
| 15 | `social-video` | Social Media Video | E5 Remotion ⚠️ | 🔵 ENGINE | Platform-sized video templates (9:16, 1:1, 16:9). |
| 16 | `product-demo` | Product Demo Video | E5 Remotion ⚠️ | 🔵 ENGINE | Screen recording + overlay composition. |
| 17 | `explainer-video` | Explainer Video Creator | E5 Remotion ⚠️ | 🔵 ENGINE | Scene-based animated video. |
| 18 | `testimonial-video` | Testimonial Video Maker | E5 Remotion ⚠️ | 🔵 ENGINE | Text overlay + video composition. |
| 19 | `promo-video` | Promotional Video Creator | E5 Remotion ⚠️ | 🔵 ENGINE | Template-driven promo sequences. |
| 20 | `countdown-timer` | Countdown & Timer Video | E5 Remotion ⚠️ | 🔵 ENGINE | Animated countdown component. |
| 21 | `thumbnail-generator` | Thumbnail Generator | E4 Fabric.js | 🔵 ENGINE | 1280×720 canvas with text overlays. |
| 22 | `slideshow-video` | Slideshow Video Maker | E5 Remotion ⚠️ | 🔵 ENGINE | Image sequence with transitions. |
| 23 | `subtitle-caption` | Subtitle & Caption Generator | E11 FFmpeg WASM | 🟢 DIRECT | SRT/VTT parsing + burn-in via FFmpeg. |
| 24 | `video-script` | Video Script Writer | E1 Plate | 🔵 ENGINE | AI-assisted script writing (same as content tools). |
| 25 | `gif-converter` | Video-to-GIF Converter | E11 FFmpeg WASM | 🟢 DIRECT | FFmpeg video → GIF conversion in browser. |
| 26 | `color-grading` | Video Color Grading | E11 FFmpeg WASM | 🔵 ENGINE | FFmpeg color filter chains. |
| 27 | `audio-sync` | Audio & Music Sync | E7 wavesurfer.js | 🔵 ENGINE | Waveform visualization + timeline sync. |
| 28 | `screen-recorder` | Screen Recording Editor | 🔴 NO MATCH | 🔴 | Browser `getDisplayMedia()` API + custom recorder. No ready npm wrapper. |
| 29 | `video-background-remover` | Video Background Remover | 🔴 NO MATCH | 🔴 | Needs ML segmentation model (Mediapipe). Heavy compute. |
| 30 | `video-compressor` | Video Compressor & Converter | E11 FFmpeg WASM | 🟢 DIRECT | FFmpeg re-encode with reduced bitrate/resolution. |

**Video summary:** 15 tools → Remotion ⚠️ | 6 tools → FFmpeg WASM | 4 tools → 🔴 NO MATCH

---

## AUDIO & VOICE STUDIO (10 tools)

| # | Tool ID | Tool Name | Engine | Strategy | Notes |
|---|---------|-----------|--------|----------|-------|
| 1 | `text-to-speech` | Text-to-Speech Generator | `@lobehub/tts` | 🟢 DIRECT | LobeHub TTS — MIT, React hooks, multiple providers (Edge, OpenAI, Azure). |
| 2 | `voice-cloning` | Voice Cloning Studio | 🔴 NO MATCH | 🔴 | Needs AI API (ElevenLabs, PlayHT). No browser-side package. |
| 3 | `voiceover-studio` | Voiceover Studio | E7 wavesurfer.js + `@lobehub/tts` | 🟡 COMPOSE | TTS generation + waveform editing + export. |
| 4 | `podcast-editor` | Podcast Editor | E7 wavesurfer.js | 🟢 DIRECT | wavesurfer.js — 9K★, BSD-3. Multi-track waveform editor with plugins (regions, timeline, spectrogram). |
| 5 | `audio-transcription` | Audio Transcription | `whisper-turbo` / API | 🟡 COMPOSE | Whisper WASM for local or API for cloud. No standalone React npm yet. |
| 6 | `music-generator` | AI Music Generator | 🔴 NO MATCH | 🔴 | Needs AI API (Suno, Udio). No browser package. |
| 7 | `sound-effects` | Sound Effects Generator | 🔴 NO MATCH | 🔴 | Needs AI audio gen API. |
| 8 | `audio-enhancer` | Audio Enhancer & Denoiser | E11 FFmpeg WASM | 🔵 ENGINE | FFmpeg audio filters (noise reduction, normalize, EQ). |
| 9 | `audio-converter` | Audio Format Converter | E11 FFmpeg WASM | 🟢 DIRECT | FFmpeg transcode between MP3/WAV/OGG/FLAC/AAC. |
| 10 | `voice-flow` | VoiceFlow AI Dictation | Web Speech API + E1 Plate | 🟡 COMPOSE | Browser SpeechRecognition API + rich text editor for output. |

---

## CONTENT CREATION (23 tools)

All writing/content tools map to the same core: **Plate** (rich text editor with AI) or **Novel** (simpler Notion-style).

| # | Tool ID | Tool Name | Engine | Strategy | Notes |
|---|---------|-----------|--------|----------|-------|
| 1 | `blog-writer` | Blog & Article Writer | E1 Plate | 🔵 ENGINE | AI autocompletion + markdown. Plate has built-in AI plugin. |
| 2 | `website-copy` | Website Copywriter | E1 Plate | 🔵 ENGINE | Template-driven copy sections. |
| 3 | `landing-page-copy` | Landing Page Copy | E1 Plate | 🔵 ENGINE | Structured copy sections (hero, features, CTA). |
| 4 | `ebook-writer` | eBook Writer | E1 Plate + E8 PDF | 🟡 COMPOSE | Multi-chapter editor → eBook export. |
| 5 | `social-caption` | Social Media Caption Generator | E1 Plate | 🔵 ENGINE | AI-generated short-form copy. |
| 6 | `thread-writer` | Thread & Carousel Writer | E1 Plate | 🔵 ENGINE | Multi-panel text editor. |
| 7 | `hashtag-generator` | Hashtag Generator | E1 Plate | 🔵 ENGINE | AI-powered tag suggestions. |
| 8 | `email-campaign` | Email Campaign Writer | E10 React Email | 🟢 DIRECT | react-email — 15K★, MIT. Email template components → HTML. |
| 9 | `cold-outreach` | Cold Outreach Writer | E1 Plate | 🔵 ENGINE | AI-generated personalized emails. |
| 10 | `seo-optimizer` | SEO Content Optimizer | E1 Plate | 🔵 ENGINE | Content analysis + AI suggestions overlay. |
| 11 | `meta-description` | Meta Description Generator | E1 Plate | 🔵 ENGINE | Short-form AI writing with char counter. |
| 12 | `ad-copy` | Ad Copy Generator | E1 Plate | 🔵 ENGINE | AI-generated ad variants. |
| 13 | `product-description` | Product Description Writer | E1 Plate | 🔵 ENGINE | Template-driven product copy. |
| 14 | `tagline-slogan` | Tagline & Slogan Generator | E1 Plate | 🔵 ENGINE | AI brainstorming interface. |
| 15 | `content-calendar` | Content Calendar Planner | `@schedule-x/react` | 🟢 DIRECT | Schedule-X — MIT, React calendar. Or react-big-calendar (8.7K★, MIT). |
| 16 | `content-repurposer` | Content Repurposer | E1 Plate | 🔵 ENGINE | AI content transformation (blog → tweets → email). |
| 17 | `press-release` | Press Release Writer | E1 Plate + E8 PDF | 🟡 COMPOSE | Structured template → formatted PDF. |
| 18 | `speech-writer` | Speech & Script Writer | E1 Plate | 🔵 ENGINE | AI long-form writing with teleprompter mode. |
| 19 | `podcast-notes` | Podcast Show Notes | E1 Plate | 🔵 ENGINE | AI-generated show notes from transcript. |
| 20 | `youtube-description` | YouTube Description Generator | E1 Plate | 🔵 ENGINE | AI-generated with timestamp and link formatting. |
| 21 | `testimonial-generator` | Testimonial Request Generator | E1 Plate | 🔵 ENGINE | Email template generation. |
| 22 | `ai-translator` | AI Content Translator | E1 Plate | 🔵 ENGINE | Source/target panels with AI translation. |
| 23 | `grammar-checker` | Grammar & Style Checker | `languagetool` API + E1 Plate | 🟡 COMPOSE | LanguageTool (open source, 13K★) API integration. Or use Plate's AI for inline corrections. |

**Content summary:** 19 tools → Plate | 1 → React Email | 1 → Calendar | 2 → COMPOSE

---

## MARKETING & SALES (18 tools)

Most marketing tools are structured documents/frameworks — they map to **Plate** for editing with AI-powered generation.

| # | Tool ID | Tool Name | Engine | Strategy | Notes |
|---|---------|-----------|--------|----------|-------|
| 1 | `marketing-strategy` | Marketing Strategy Planner | E1 Plate | 🔵 ENGINE | AI-generated framework document. |
| 2 | `campaign-builder` | Campaign Builder | E1 Plate | 🔵 ENGINE | Multi-step campaign planner. |
| 3 | `social-strategy` | Social Media Strategy | E1 Plate | 🔵 ENGINE | Platform-specific strategy doc. |
| 4 | `brand-positioning` | Brand Positioning Framework | E1 Plate | 🔵 ENGINE | Framework template with AI fill. |
| 5 | `go-to-market` | Go-to-Market Plan | E1 Plate + E8 PDF | 🟡 COMPOSE | Structured plan document → PDF. |
| 6 | `customer-persona` | Customer Persona Builder | E1 Plate + E4 Fabric.js | 🟡 COMPOSE | Persona card (visual) + description (text). |
| 7 | `competitor-analysis` | Competitor Analysis Tool | E1 Plate | 🔵 ENGINE | Table-driven comparison document. |
| 8 | `market-research` | Market Research Brief | E1 Plate + E8 PDF | 🟡 COMPOSE | AI-assisted research framework. |
| 9 | `swot-analysis` | SWOT Analysis Generator | E1 Plate | 🔵 ENGINE | 4-quadrant structured template. |
| 10 | `sales-funnel` | Sales Funnel Designer | E1 Plate + E4 Fabric.js | 🟡 COMPOSE | Visual funnel diagram + strategy text. |
| 11 | `lead-magnet` | Lead Magnet Creator | E1 Plate + E8 PDF | 🟡 COMPOSE | Content creation → downloadable PDF. |
| 12 | `sales-deck` | Sales Deck Builder | E6 Reveal.js | 🔵 ENGINE | Presentation-style sales pitch slides. |
| 13 | `proposal-writer` | Sales Proposal Writer | E1 Plate + E8 PDF | 🟡 COMPOSE | AI-generated proposal document. |
| 14 | `ab-test-copy` | A/B Test Copy Generator | E1 Plate | 🔵 ENGINE | AI generates variant copy pairs. |
| 15 | `email-sequence` | Email Sequence Builder | E10 React Email + E1 Plate | 🟡 COMPOSE | Multi-step email templates. |
| 16 | `pricing-calculator` | Pricing Strategy Calculator | 🔴 NO MATCH | 🔴 | Custom interactive calculator UI. No npm package needed — just React + math. |
| 17 | `roi-calculator` | ROI Calculator & Reporter | 🔴 NO MATCH | 🔴 | Custom calculator UI + chart library (recharts, MIT, 25K★). |
| 18 | `analytics-dashboard` | Analytics Report Builder | `recharts` | 🟢 DIRECT | recharts — 25K★, MIT. React charting library. |

---

## WEB & UI DESIGN (10 tools)

| # | Tool ID | Tool Name | Engine | Strategy | Notes |
|---|---------|-----------|--------|----------|-------|
| 1 | `website-builder` | AI Website Builder | E3 GrapeJS | 🟢 DIRECT | GrapeJS — 23K★, BSD-3. `@grapesjs/react` wrapper. Full drag-drop web page builder. **Best match in this whole document.** |
| 2 | `wireframe-generator` | Wireframe Generator | Excalidraw ✅ | 🔵 ENGINE | Excalidraw's sketchy style is PERFECT for wireframes. 2nd Excalidraw workspace with UI component library. |
| 3 | `ui-component-designer` | UI Component Designer | E3 GrapeJS | 🔵 ENGINE | Component-level visual builder. |
| 4 | `app-screen-designer` | App Screen Designer | E4 Fabric.js | 🔵 ENGINE | Mobile screen canvas (375×812 etc.) with UI kit templates. |
| 5 | `email-template` | Email Template Designer | E3 GrapeJS + `@grapesjs/preset-newsletter` | 🟢 DIRECT | GrapeJS email preset — built-in email builder. BSD-3. |
| 6 | `favicon-generator` | Favicon & App Icon Generator | E4 Fabric.js | 🔵 ENGINE | Multi-size canvas (16, 32, 48, 192, 512px) with export. |
| 7 | `og-image-generator` | Open Graph Image Generator | `@vercel/og` or E4 Fabric.js | 🟡 COMPOSE | 1200×630 canvas for social preview images. |
| 8 | `screenshot-beautifier` | Screenshot Beautifier | E4 Fabric.js | 🔵 ENGINE | Browser/device frame overlay + gradient background. |
| 9 | `css-gradient` | CSS Gradient Generator | E15 react-colorful | 🟡 COMPOSE | Color pickers + gradient preview + CSS output. |
| 10 | `svg-animator` | SVG Animation Studio | E16 Motion + `lottie-react` | 🟡 COMPOSE | SVG keyframe animation with Motion. |

---

## UTILITIES & WORKFLOW (21 tools)

| # | Tool ID | Tool Name | Engine | Strategy | Notes |
|---|---------|-----------|--------|----------|-------|
| 1 | `ai-chat` | AI Chat Assistant | **LobeHub** ⚠️ | 🟢 DIRECT | lobehub/lobehub — 74.7K★. **License: "LobeHub Community License"** — NOT standard MIT. Read before using. Alternative: build custom with Vercel AI SDK (`ai` npm package, Apache-2.0). |
| 2 | `ai-chat-v2` | AI Chat V2 (Lobe) | **LobeHub** ⚠️ or `@lobehub/ui` | 🟢 DIRECT | `@lobehub/ui` components are MIT. Use UI components, build chat logic with Vercel AI SDK. |
| 3 | `ai-image-chat` | AI Vision Analyzer | Vercel AI SDK (`ai`) | 🟡 COMPOSE | `ai` npm package (Apache-2.0, ~3M DL/week) + vision model API. |
| 4 | `file-converter` | File Format Converter | E11 FFmpeg WASM + `mammoth` | 🟡 COMPOSE | FFmpeg for media. mammoth (MIT) for DOCX→HTML. pdf-lib (MIT) for PDF ops. |
| 5 | `batch-processor` | Batch Image Processor | `sharp` (server) or `browser-image-compression` | 🟡 COMPOSE | browser-image-compression (MIT, 2K★). Batch resize/convert in browser. |
| 6 | `image-compression` | Image Compressor | `browser-image-compression` | 🟢 DIRECT | browser-image-compression — MIT. Client-side JPEG/PNG/WebP compression. |
| 7 | `pdf-tools` | PDF Tools Suite | `pdf-lib` + `react-pdf` | 🟡 COMPOSE | pdf-lib (MIT, 8K★) for manipulation. react-pdf (MIT) for viewing. |
| 8 | `brand-kit-manager` | Brand Kit Manager | 🔴 NO MATCH | 🔴 | Custom organizational UI. No matching npm package. |
| 9 | `asset-library` | Asset Library | 🔴 NO MATCH | 🔴 | Custom digital asset manager. |
| 10 | `style-guide` | Style Guide Generator | E1 Plate + E8 PDF | 🟡 COMPOSE | Document editor → PDF output. |
| 11 | `project-manager` | Project Manager | 🔴 NO MATCH | 🔴 | Custom Kanban/timeline UI. Consider `react-beautiful-dnd` (MIT) for drag-drop. |
| 12 | `client-brief` | Client Brief Generator | E1 Plate | 🔵 ENGINE | AI-generated structured document. |
| 13 | `feedback-collector` | Feedback & Review Collector | 🔴 NO MATCH | 🔴 | Custom form builder. |
| 14 | `invoice-tracker` | Invoice & Accounting Hub | 🔴 NO MATCH | 🔴 | Custom accounting dashboard. Already has custom build. |
| 15 | `ai-flow-builder` | AI Flow Builder | `@xyflow/react` | 🟢 DIRECT | React Flow — 30K+★, MIT. Node-based flow canvas. Already using this. |
| 16 | `qr-code` | QR Code Generator | E13 qrcode.react | 🟢 DIRECT | qrcode.react — 4K★, ISC, 2M DL/week. |
| 17 | `barcode-generator` | Barcode Generator | E14 react-barcode | 🟢 DIRECT | react-barcode — MIT. All standard barcode formats. |
| 18 | `watermark-tool` | Watermark Tool | E4 Fabric.js | 🔵 ENGINE | Image + text overlay on canvas. |
| 19 | `color-converter` | Color Code Converter | E15 react-colorful + `colord` | 🟡 COMPOSE | colord (MIT, 2K★) — color conversion library. HEX/RGB/HSL/CMYK. |
| 20 | `unit-converter` | Design Unit Converter | 🔴 NO MATCH | 🔴 | Pure math — doesn't need an npm package. Custom React UI. |
| 21 | `contrast-checker` | Contrast & Accessibility Checker | E15 react-colorful + `colord` | 🟡 COMPOSE | WCAG contrast ratio calculation with color pickers. |

---

## Summary: Coverage by Engine

| Engine | npm Package | Tools Covered | Tier |
|--------|-------------|---------------|------|
| 🔵 **Fabric.js** | `fabric` | **~55 tools** | Already in project. Covers ALL visual design tools (cards, posters, social media, certificates, etc.). The FabricEditor pattern is solid — needs better templates. |
| 🔵 **Plate** | `@udecode/plate` / `@platejs/*` | **~35 tools** | Rich text + AI. Covers ALL writing, content, marketing, and document tools. Has built-in AI plugin. **BEST NEW ADDITION.** |
| 🔵 **Remotion** ⚠️ | `remotion` | **~15 tools** | Video creation. Covers most video/motion tools. **LICENSE WARNING:** Free only for <$1M revenue. |
| 🔵 **FFmpeg WASM** | `@ffmpeg/ffmpeg` | **~8 tools** | Video/audio processing. Trimming, conversion, compression, subtitles. |
| 🔵 **wavesurfer.js** | `wavesurfer.js` | **~4 tools** | Audio editing. Podcast, voiceover, audio sync. |
| 🔵 **GrapeJS** | `grapesjs` | **~3 tools** | Web/email builder. Website builder, UI designer, email template. |
| 🔵 **Reveal.js** | `reveal.js` | **~2 tools** | Presentations. Presentation designer, sales deck. |
| 🔵 **React Email** | `@react-email/components` | **~2 tools** | Email templates and campaigns. |
| 🔵 **Reactive Resume** | source port | **~2 tools** | Resume and CV. Already ported. |
| 🟢 Various | specific packages | **~15 tools** | Direct 1:1 matches (QR code, barcode, color picker, etc.). |
| 🔴 **NO MATCH** | — | **~18 tools** | Need custom build or API integration. |

---

## Priority Installation Order

If rebuilding tools from scratch using this guide, install engines in this order:

### Phase 1: Highest Impact (covers ~90 tools)
```bash
# Plate — covers 35+ writing/document tools
npm install @udecode/plate @platejs/ai @platejs/basic @platejs/list @platejs/table @platejs/heading --legacy-peer-deps

# Fabric.js — already installed, covers 55+ visual tools
# (Already in package.json as "fabric")

# @react-pdf/renderer — PDF export for all document tools
npm install @react-pdf/renderer --legacy-peer-deps
```

### Phase 2: Media Tools (~25 tools)
```bash
# FFmpeg WASM — covers 8 video/audio processing tools
npm install @ffmpeg/ffmpeg @ffmpeg/util --legacy-peer-deps

# wavesurfer.js — covers 4 audio tools
npm install wavesurfer.js --legacy-peer-deps

# Remotion — covers 15 video tools (CHECK LICENSE FIRST)
npm install remotion @remotion/player @remotion/cli --legacy-peer-deps
```

### Phase 3: Specialized Tools (~15 tools)
```bash
# GrapeJS — website builder + email template
npm install grapesjs @grapesjs/react --legacy-peer-deps

# QR & Barcode
npm install qrcode.react react-barcode --legacy-peer-deps

# Image processing
npm install @imgly/background-removal browser-image-compression --legacy-peer-deps

# TTS
npm install @lobehub/tts --legacy-peer-deps

# 3D
npm install @react-three/fiber @react-three/drei --legacy-peer-deps
```

---

## 🔴 NO MATCH Tools (18 total — Need Custom Build or API)

These tools have no suitable open-source React npm replacement:

| Tool ID | Tool Name | Reason | Recommendation |
|---------|-----------|--------|----------------|
| `icon-illustration` | Icon & Illustration Generator | Needs AI image gen | Use Stability AI / DALL-E API + custom gallery UI |
| `ai-image-generator` | AI Image Generator | Needs AI image gen | Use Stability AI / DALL-E / Replicate API |
| `image-inpainting` | AI Image Editor (Inpainting) | Needs ML model | Use Replicate API + canvas mask editor |
| `typography-pairing` | Typography Pairing Tool | Too niche | Custom UI + Google Fonts API |
| `text-to-video` | Text-to-Video Generator | Needs AI video gen | Use Runway / Pika / Synthesia API |
| `ai-b-roll` | AI B-Roll Generator | Needs AI video gen | Use Runway API |
| `screen-recorder` | Screen Recording Editor | Browser API | Custom using `getDisplayMedia()` + MediaRecorder |
| `video-background-remover` | Video Background Remover | Needs ML segmentation | Mediapipe selfie segmentation + canvas |
| `voice-cloning` | Voice Cloning Studio | Needs AI voice API | ElevenLabs / PlayHT API |
| `music-generator` | AI Music Generator | Needs AI music API | Suno / Udio API |
| `sound-effects` | Sound Effects Generator | Needs AI audio gen | ElevenLabs SFX API |
| `pricing-calculator` | Pricing Strategy Calculator | Pure custom UI | Just React + math logic |
| `roi-calculator` | ROI Calculator & Reporter | Pure custom UI | React + recharts |
| `brand-kit-manager` | Brand Kit Manager | Organizational tool | Custom CRUD UI |
| `asset-library` | Asset Library | Asset management | Custom file browser UI |
| `project-manager` | Project Manager | PM tool | Custom Kanban + react-beautiful-dnd |
| `feedback-collector` | Feedback & Review Collector | Form tool | Custom form builder |
| `unit-converter` | Design Unit Converter | Pure math | Simple React component |

---

## AGENT EXECUTION PLAYBOOK — How to Replace a Tool

> **This section is the step-by-step instructions an AI agent MUST follow** to completely tear down an existing tool and replace it with the open-source package recommended in this document. Every file path, every format, every pattern is documented here. **Read GITHUB-TOOL-PORTING-GUIDE.md first** for the full process — this section is the quick-reference checklist.

### Prerequisites

Before starting, the agent MUST:
1. Read ALL memory bank files (`/memory-bank/*.md`) to understand the project state
2. Read `GITHUB-TOOL-PORTING-GUIDE.md` for the full porting process (CSS isolation, branding cleanup, etc.)
3. Read `TOOL-STATUS.md` for current tool status
4. Identify the tool's `<tool-id>` (kebab-case, e.g., `blog-writer`, `video-editor`)
5. Identify the recommended engine from the matching tables above
6. Verify the npm package's license is MIT/Apache/BSD/ISC (visit the GitHub repo, check LICENSE file)

---

### STEP 1: Audit Current Integration (Read-Only)

Find every file that references the tool. Run these searches:

```powershell
# Find all references to the tool ID
Select-String -Path "src/**/*.ts","src/**/*.tsx","src/**/*.css" -Pattern "<tool-id>" -Recurse | Select-Object Path, LineNumber, Line
```

Check each of these files (may or may not exist — check all):

| # | File | What to Look For |
|---|------|-----------------|
| 1 | `src/data/tools.ts` | Tool object in `toolCategories` array (id, name, icon, devStatus, etc.) |
| 2 | `src/app/tools/[categoryId]/[toolId]/page.tsx` | Entry in `workspaceComponents` map |
| 3 | `src/lib/store-adapters.ts` | Adapter factory function + entry in `ADAPTER_FACTORIES` |
| 4 | `src/components/workspaces/<tool-id>/` | Workspace component folder/file |
| 5 | `src/stores/<tool-id>-editor.ts` | Zustand store file |
| 6 | `src/lib/chiko/manifests/<tool-id>.ts` | Chiko AI manifest |
| 7 | `src/lib/chiko/manifests/index.ts` | Barrel export for the manifest |
| 8 | `src/data/credit-costs.ts` | Entry in `TOOL_CREDIT_MAP` |
| 9 | `src/app/globals.css` | CSS isolation rules (e.g., `.<tool-id>-wrapper`) |
| 10 | `src/middleware.ts` | Static asset exclusions |
| 11 | `src/app/api/chat/<tool-id>/route.ts` | API route |
| 12 | `src/data/<tool-id>-templates.ts` | Template data file |
| 13 | `public/templates/<tool-id>/` | Static template assets |
| 14 | `TOOL-STATUS.md` | Status row in tracker |
| 15 | `package.json` | Dependencies only used by this tool |

**Record what exists.** Not all tools have all files. Scaffold tools may only have entries in `tools.ts` and `page.tsx`.

---

### STEP 2: Remove Old Implementation (Write Operations)

Delete/modify in **this exact order** to avoid broken imports:

#### 2.1 — Delete Workspace Component
```powershell
# If it's a folder:
Remove-Item -Recurse -Force "src/components/workspaces/<tool-id>/"
# If it's a single file:
Remove-Item -Force "src/components/workspaces/<ToolName>Workspace.tsx"
```

#### 2.2 — Delete Zustand Store (if exists)
```powershell
Remove-Item -Force "src/stores/<tool-id>-editor.ts"
```

#### 2.3 — Remove Dynamic Import from page.tsx
In `src/app/tools/[categoryId]/[toolId]/page.tsx`, delete the line:
```typescript
"<tool-id>": dynamic(() => import("@/components/workspaces/...")),
```

#### 2.4 — Remove Store Adapter from store-adapters.ts
In `src/lib/store-adapters.ts`:
1. Delete the adapter factory function (e.g., `function get<ToolName>Adapter(): StoreAdapter { ... }`)
2. Delete the entry from `ADAPTER_FACTORIES`: `"<tool-id>": get<ToolName>Adapter,`

#### 2.5 — Remove Chiko Manifest (if exists)
```powershell
Remove-Item -Force "src/lib/chiko/manifests/<tool-id>.ts"
```
Then remove the barrel export from `src/lib/chiko/manifests/index.ts`:
```typescript
export { create<ToolName>Manifest } from "./<tool-id>";  // DELETE THIS LINE
```

#### 2.6 — Remove Credit Mapping (if exists)
In `src/data/credit-costs.ts`, delete the entry:
```typescript
"<tool-id>": "<operation-key>",  // DELETE FROM TOOL_CREDIT_MAP
```

#### 2.7 — Remove CSS Isolation (if exists)
In `src/app/globals.css`, delete the entire block:
```css
/* ══════ <Tool Name> — CSS isolation ══════ */
.<tool-id>-wrapper ... { ... }
/* ... all rules until the next section comment */
```

#### 2.8 — Remove API Route (if exists)
```powershell
Remove-Item -Recurse -Force "src/app/api/chat/<tool-id>/"
```

#### 2.9 — Remove Template Data (if exists)
```powershell
Remove-Item -Force "src/data/<tool-id>-templates.ts"
Remove-Item -Recurse -Force "public/templates/<tool-id>/"
```

#### 2.10 — Remove Middleware Exclusion (if applicable)
If the tool had a path exclusion in `src/middleware.ts`, remove it from the matcher regex.

#### 2.11 — Remove Dependencies (only if NOT shared)
Check if the package is used by other tools before removing:
```powershell
Select-String -Path "src/**/*.ts","src/**/*.tsx" -Pattern "<package-name>" -Recurse
# If 0 results (excluding the deleted files), safe to remove:
npm uninstall <package-name>
```

#### 2.12 — DO NOT touch tools.ts yet
Keep the tool entry in `tools.ts` — we'll update it in Step 4 after the new implementation is wired in.

---

### STEP 3: Install & Create New Implementation

#### 3.1 — Install the npm Package
```powershell
cd d:\dramac-ai-suite
npm install <package-name> --legacy-peer-deps
# Install peer dependencies if any:
npm install <peer1> <peer2> --legacy-peer-deps
```

#### 3.2 — Create Workspace Component
Create the workspace folder and main component:

**File:** `src/components/workspaces/<tool-id>/<ToolName>Workspace.tsx`

```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/components/ThemeProvider";

// Dynamic import — prevents SSR crash for browser-only library
const LibraryComponent = dynamic(
  () => import("<package>").then((m) => m.ComponentName),
  { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center text-gray-400">Loading...</div> }
);

export default function <ToolName>Workspace() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="h-full w-full overflow-hidden relative">
      <div className="<tool-id>-wrapper h-full w-full">
        <LibraryComponent
          // Pass ALL original props — don't strip features
          // theme={resolvedTheme === "dark" ? "dark" : "light"}
        />
      </div>
    </div>
  );
}
```

**CRITICAL RULES:**
- `"use client"` directive is REQUIRED
- Use `dynamic(() => import(...), { ssr: false })` for heavy libraries
- Wrapper div MUST be `h-full w-full overflow-hidden relative`
- CSS isolation class: `<tool-id>-wrapper`
- Pass the original component's theme prop if it has one
- DO NOT add DMSuite headers/panels inside — TopBar already exists above
- DO NOT strip features — keep 100% of original UI

#### 3.3 — Create Zustand Store (if tool has state)
**File:** `src/stores/<tool-id>-editor.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface <ToolName>State {
  // Tool-specific state fields
  data: Record<string, unknown>;
  // Actions
  setData: (data: Record<string, unknown>) => void;
  reset: () => void;
}

export const use<ToolName>Store = create<<ToolName>State>()(
  persist(
    (set) => ({
      data: {},
      setData: (data) => set({ data }),
      reset: () => set({ data: {} }),
    }),
    { name: "dmsuite-<tool-id>" }
  )
);
```

#### 3.4 — Create Store Adapter
In `src/lib/store-adapters.ts`, add the adapter factory function **before** the `ADAPTER_FACTORIES` map:

```typescript
function get<ToolName>Adapter(): StoreAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { use<ToolName>Store } = require("@/stores/<tool-id>-editor");
  return {
    getSnapshot: () => {
      const s = use<ToolName>Store.getState();
      return { data: s.data };
    },
    restoreSnapshot: (data: Record<string, unknown>) => {
      if (data.data) {
        use<ToolName>Store.getState().setData(data.data as Record<string, unknown>);
      }
    },
    resetStore: () => {
      use<ToolName>Store.getState().reset();
      nukePersistStorage("dmsuite-<tool-id>");
    },
    subscribe: (cb) => use<ToolName>Store.subscribe(cb),
  };
}
```

Then add to the `ADAPTER_FACTORIES` map:
```typescript
const ADAPTER_FACTORIES: Record<string, () => StoreAdapter> = {
  // ... existing entries
  "<tool-id>": get<ToolName>Adapter,
};
```

**For Fabric.js-based tools:** Use `useFabricProjectStore` instead of a custom store. The adapter maps to `fabricJson`, `canvasWidth`, `canvasHeight`. Copy an existing Fabric adapter as a template.

#### 3.5 — Add CSS Isolation (if external library has its own CSS)
In `src/app/globals.css`, add:

1. **Import the library's CSS** (try normal import first, fall back to filesystem path):
```css
@import "<package>/dist/style.css";
```

2. **Add revert-layer rules** (see Phase 5 in GITHUB-TOOL-PORTING-GUIDE.md for full template):
```css
/* ══════ <Tool Name> — CSS isolation ══════ */
.<tool-id>-wrapper .<library-root-class> * {
  border-width: revert-layer;
  border-style: revert-layer;
  border-color: revert-layer;
}
/* ... buttons, SVGs, inputs, selects, anchors, images, headings, lists, dialogs, tables ... */
```

3. **Hide external branding** (after everything works):
```css
.<tool-id>-wrapper a[href*="github.com/<original-org>"],
.<tool-id>-wrapper a[href*="<original-domain>.com"] {
  display: none !important;
}
```

#### 3.6 — Create Chiko AI Manifest
**File:** `src/lib/chiko/manifests/<tool-id>.ts`

```typescript
import type { ChikoActionManifest, ChikoActionDescriptor } from "../types";

const ACTIONS: ChikoActionDescriptor[] = [
  {
    name: "read_state",
    description: "Get the current state of the <Tool Name>",
    parameters: {},
  },
  // Add tool-specific AI actions
];

export function create<ToolName>Manifest(): ChikoActionManifest {
  return {
    toolId: "<tool-id>",
    toolName: "<Display Name>",
    description: "<What Chiko can do with this tool>",
    actions: ACTIONS,
  };
}
```

Then add to `src/lib/chiko/manifests/index.ts`:
```typescript
export { create<ToolName>Manifest } from "./<tool-id>";
```

---

### STEP 4: Wire Into Platform (Integration Points)

#### 4.1 — Add Dynamic Import to page.tsx
In `src/app/tools/[categoryId]/[toolId]/page.tsx`, add to the `workspaceComponents` map:

```typescript
"<tool-id>": dynamic(() => import("@/components/workspaces/<tool-id>/<ToolName>Workspace")),
```

#### 4.2 — Update tools.ts Entry
In `src/data/tools.ts`, find the tool entry and update:

```typescript
{
  id: "<tool-id>",
  name: "<Display Name>",
  description: "<Updated description>",
  icon: "<icon-key>",
  status: "ready",
  devStatus: "scaffold",           // → "complete" after full verification
  tags: ["tag1", "tag2"],
  aiProviders: ["claude"],         // If AI-powered
  outputs: ["pdf", "png"],         // Update based on new capabilities
  supportsPartEdit: false,         // true if Chiko can edit individual elements
  printReady: false,               // true if print-quality output
}
```

#### 4.3 — Add Credit Mapping (if AI-powered)
In `src/data/credit-costs.ts`:

```typescript
// In TOOL_CREDIT_MAP:
"<tool-id>": "<operation-key>",

// In CREDIT_COSTS (only if new operation type):
"<new-operation>": <cost>,
```

#### 4.4 — Add Middleware Exclusion (if public assets needed)
If the tool serves files from `/public/<folder>/`, add to `src/middleware.ts`:

```typescript
matcher: [
  "/((?!_next/static|...|<new-folder>/).*)",
],
```

#### 4.5 — Update next.config.ts (if needed)
```typescript
// For packages with Node.js deps:
serverExternalPackages: ["<package>"],
// For packages shipping untranspiled ESM:
transpilePackages: ["<package>"],
```

---

### STEP 5: Verify

Run these checks in order. **ALL must pass:**

```powershell
# 1. TypeScript — 0 errors related to the tool
npx tsc --noEmit 2>&1 | Select-String "<tool-id>" | Select-Object -First 30

# 2. Full TypeScript check — no NEW errors introduced
npx tsc --noEmit 2>&1 | Measure-Object -Line | Select-Object -ExpandProperty Lines

# 3. Production build — must succeed
$env:NODE_ENV='production'; npx next build 2>&1 | Select-Object -Last 40

# 4. Dev server — tool loads without console errors
npm run dev
# Navigate to: http://localhost:6006/tools/<category-id>/<tool-id>
```

**Feature parity checklist:**
- [ ] All menus/toolbars present and functional
- [ ] All keyboard shortcuts work
- [ ] Create, edit, delete operations work
- [ ] Export/download works
- [ ] Undo/redo works
- [ ] Theme switching works (dark ↔ light)
- [ ] No console errors
- [ ] No external network requests to original project's servers
- [ ] State persists across page refreshes

---

### STEP 6: Update Tracker

#### 6.1 — Update TOOL-STATUS.md
Move the tool to the correct section (SCAFFOLD or COMPLETE) and add a changelog entry:

```markdown
## Change Log
| Date | Tool | Summary | Drake |
|------|------|---------|-------|
| YYYY-MM-DD | <tool-id> (<Display Name>) | Replaced with <package-name> — <summary> | Drake |
```

#### 6.2 — Update devStatus in tools.ts
Once fully verified:
```typescript
devStatus: "complete",  // Was "scaffold"
```

#### 6.3 — Update Memory Bank
Update `memory-bank/activeContext.md` and `memory-bank/progress.md` with:
- What was replaced
- Which engine/package was used
- Any issues encountered
- Next steps

---

### Engine-Specific Notes

#### For Fabric.js-based tools (E4 — ~55 tools)
Most design tools **already use Fabric.js** — they share the `useFabricProjectStore` and the `FabricEditor` component. Replacing these means replacing the **workspace wrapper** and **templates**, NOT the engine. The agent should:
1. Keep `fabric` as the dependency (already installed)
2. Look at existing Fabric workspaces as reference (e.g., `certificate-designer/`, `ticket-designer/`)
3. Focus on creating better **templates** rather than reimplementing the editor
4. Use the shared Fabric adapter pattern from `store-adapters.ts`

#### For Plate-based tools (E1 — ~35 tools)
Plate is a NEW engine not yet installed. The agent should:
1. Install: `npm install @udecode/plate @platejs/ai @platejs/basic @platejs/list @platejs/table @platejs/heading --legacy-peer-deps`
2. Create ONE shared Plate workspace component that all writing tools can extend
3. Each writing tool differs by: initial template, AI prompt context, and output format
4. Add CSS isolation for Plate (uses its own CSS classes)
5. The Plate AI plugin connects to our existing AI API routes

#### For Remotion-based tools (E5 — ~15 tools) ⚠️
**LICENSE WARNING:** Remotion is free for companies with <$1M annual revenue. Company license required above that.
1. Install: `npm install remotion @remotion/player @remotion/cli --legacy-peer-deps`
2. Use `@remotion/player` for in-browser preview (NOT the full Remotion Studio)
3. Video rendering happens server-side via `@remotion/renderer` or serverless functions
4. Each video tool is a different Remotion **composition** (React component that renders frames)

#### For FFmpeg WASM tools (E11 — ~8 tools)
1. Install: `npm install @ffmpeg/ffmpeg @ffmpeg/util --legacy-peer-deps`
2. FFmpeg WASM requires SharedArrayBuffer — needs `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers
3. Add to `next.config.ts`:
```typescript
headers: async () => [
  { source: "/tools/:path*", headers: [
    { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ]}
]
```

#### For GrapeJS tools (E3 — ~3 tools)
1. Install: `npm install grapesjs @grapesjs/react --legacy-peer-deps`
2. For email builder: `npm install @grapesjs/preset-newsletter --legacy-peer-deps`
3. GrapeJS has extensive CSS that WILL conflict with Tailwind — needs full revert-layer isolation
4. Use `@grapesjs/react` wrapper (official React component)

---

### Quick Decision Tree for Agents

```
Is the tool already built and working?
├── YES → Don't touch it unless explicitly asked
├── NO → Continue ↓

Does the tool have a DIRECT engine match (🟢) in this document?
├── YES → Install the npm package, create workspace wrapper, wire in
├── NO → Continue ↓

Does the tool map to an ENGINE (🔵)?
├── YES, Fabric.js → Copy an existing Fabric workspace, change templates
├── YES, Plate → Use shared Plate workspace, change AI prompt + template
├── YES, Remotion → Create Remotion composition, use @remotion/player
├── YES, Other → Follow standard installation + wrapper pattern
├── NO → Continue ↓

Is it a COMPOSE (🟡) tool?
├── YES → Install all required packages, build integration layer
├── NO → Continue ↓

Is it NO MATCH (🔴)?
├── YES → Build custom React UI + API integration
│         DO NOT pretend there's an npm package — there isn't
└── NO → Something is wrong — re-check the matching table
```

---

*Last updated: 2026-04-04*
