# DMSuite — Open Source Platforms Research

> **Purpose:** Map every DMSuite tool category to **fully working open-source platforms** — complete applications you can run, use, and study. NOT libraries or frameworks.
>
> **Philosophy:** Find existing products that already do what we need. Study their UX, feature set, architecture, and workflows. Replicate the best ideas inside DMSuite.
>
> **AI-First Priority:** Within each category, **AI-native platforms appear first** — these are applications where AI generation, processing, or intelligence is the core function, not a bolt-on. DMSuite is an AI-first platform, so we prioritize studying systems already built around AI.
>
> **Rule:** Every entry here is a **complete, deployable application** with a working UI — not a library, SDK, or framework.
>
> **🟢 Fork & Rebrand Ready:** Platforms marked with 🟢 have a **permissive license** (MIT / Apache-2.0 / BSD / MPL-2.0), a production-ready custom web UI, Docker/self-host support, and active maintenance. You can fork these today, apply DMSuite branding, deploy, and they will work out of the box — because they're already running in production.

---

## Table of Contents

1. [Design & Graphics Platforms](#1-design--graphics-platforms)
2. [Document & Business Platforms](#2-document--business-platforms)
3. [Video & Motion Platforms](#3-video--motion-platforms)
4. [Audio & Music Platforms](#4-audio--music-platforms)
5. [Content & Publishing Platforms](#5-content--publishing-platforms)
6. [Marketing & CRM Platforms](#6-marketing--crm-platforms)
7. [Website & Page Builder Platforms](#7-website--page-builder-platforms)
8. [Utilities & Productivity Platforms](#8-utilities--productivity-platforms)
9. [Top 25 Most Important Platforms (Quick Reference)](#9-top-25-most-important-platforms)
10. [Implementation Priority](#10-implementation-priority)
11. [AI-First & AI-Native Platforms (Detailed Reference)](#11-ai-first--ai-native-platforms)
12. [AI-First Top 20 Quick Reference](#12-ai-first-platforms--top-20-quick-reference)
13. [DMSuite AI Integration Priorities](#13-dmsuite-ai-integration-priorities)

---

## 1. Design & Graphics Platforms

These are fully working design applications — Canva/Figma/Photoshop alternatives you can run today.

### 🤖 AI-First Image Generation & Editing Platforms

> These platforms are **built around AI** — AI generation/editing is the primary function, not an add-on. Study for: AI image generation UX, model management, workflow builders, canvas integration, prompt engineering UI.

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **AUTOMATIC1111 SD WebUI** | 162k+ | AGPL-3.0 | Self-hosted | [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) | **Most starred AI image app.** Full Stable Diffusion web UI. txt2img, img2img, inpainting, outpainting, upscaling (ESRGAN, GFPGAN, CodeFormer), ControlNet, LoRA, textual inversion, training. Gradio-based. 586 contributors. In maintenance mode (v1.10.1, Feb 2025). |
| 2 | **ComfyUI** | 108k+ | GPL-3.0 | Self-hosted + Desktop | [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | **Most powerful modular AI engine.** Node-based visual workflow for AI image (SD, SDXL, Flux, HiDream), video (Wan 2.1/2.2, HunyuanVideo, LTX-Video), audio (Stable Audio, ACE Step), and 3D (Hunyuan3D). Desktop app + web. 297 contributors. Actively maintained (weekly releases). |
| 3 | **Fooocus** | 48k+ | GPL-3.0 | Self-hosted | [lllyasviel/Fooocus](https://github.com/lllyasviel/Fooocus) | Midjourney-like simplified AI image generator. SDXL-based, offline GPT-2 prompt processing, inpainting, image prompt, face swap, describe, upscale/variation. Clean UX that hides complexity. **Now in LTS/bug-fix mode.** 61 contributors. |
| 4 | **InvokeAI** 🟢 | 26.9k+ | Apache-2.0 | Self-hosted | [invoke-ai/InvokeAI](https://github.com/invoke-ai/InvokeAI) | Professional creative AI tools. Unified Canvas for in/outpainting, node-based workflows, gallery management, model manager. SD1.5/SD2/SDXL/FLUX support. React frontend + Python backend. 351 contributors. **Actively maintained** (v6.12.0, June 2025). |
| 5 | **IOPaint** (lama-cleaner) | 20k+ | Apache-2.0 | Self-hosted | [Sanster/IOPaint](https://github.com/Sanster/IOPaint) | Full AI image inpainting app. Remove objects, fix photos, upscale images. Working web UI. Multiple AI models (LaMa, Stable Diffusion, SDXL). |
| 6 | **Upscayl** | 44k+ | AGPL-3.0 | Desktop app | [upscayl/upscayl](https://github.com/upscayl/upscayl) | **#1 AI image upscaler.** Free desktop app using Real-ESRGAN + Vulkan. Multiple AI models, batch processing, custom models. Linux/macOS/Windows. 48 contributors. |
| 7 | **SwarmUI** | 3.9k+ | MIT | Self-hosted | [mcmonkeyprojects/SwarmUI](https://github.com/mcmonkeyprojects/SwarmUI) | Modular AI image/video generation web UI. Supports SD, Flux, Z-Image, Qwen Image, Wan video, HunyuanVideo. Built on ComfyUI backend. C#/JavaScript. Beta v0.9.8. 75 contributors. |

### Full Design Editors (Canva/Figma Alternatives)

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Penpot** 🟢 | 45k+ | MPL-2.0 | [penpot.app](https://design.penpot.app) | [penpot/penpot](https://github.com/penpot/penpot) | Full Figma alternative. Design tool with components, prototyping, design tokens, CSS Grid, inspect mode, plugins. Self-hostable. 233+ contributors. |
| 2 | **Excalidraw** 🟢 | 120k+ | MIT | [excalidraw.com](https://excalidraw.com) | [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | Full whiteboard & diagramming app. Hand-drawn style, real-time collaboration, E2E encryption, PWA, shape libraries, export PNG/SVG. Used by Google Cloud, Meta, Notion. |
| 3 | **tldraw** | 46k+ | Custom | [tldraw.com](https://www.tldraw.com) | [tldraw/tldraw](https://github.com/tldraw/tldraw) | Infinite canvas whiteboard app. Drawing, diagramming, multiplayer, AI integrations. Full working app at tldraw.com. React-based. |
| 4 | **Graphite** | 10k+ | MPL-2.0 | [graphite.rs](https://editor.graphite.rs) | [GraphiteEditor/Graphite](https://github.com/GraphiteEditor/Graphite) | Full 2D vector design editor. Node-based procedural editing, raster & vector graphics, animation timeline. Runs in browser via WASM. |
| 5 | **Polotno Studio** 🟢 | 2k+ | MIT | [studio.polotno.com](https://studio.polotno.com) | [lavrton/polotno-studio](https://github.com/lavrton/polotno-studio) | Full working Canva-like design editor. Templates, text, images, shapes, export. React-based, runs in browser. |
| 6 | **vue-fabric-editor** 🟢 | 6k+ | MIT | [Live Demo](https://nihaojob.github.io/vue-fabric-editor/) | [ikuaitu/vue-fabric-editor](https://github.com/ikuaitu/vue-fabric-editor) | Complete poster/image design editor. Templates, layers, custom fonts, materials panel, drag-and-drop. Fabric.js-based. |
| 7 | **yft-design** 🟢 | 4k+ | MIT | [yft.design](https://yft.design) | [dromara/yft-design](https://github.com/dromara/yft-design) | Full online design platform. Posters, product images, covers. PSD parser, SVG support, template system. Fabric.js + Vue3. |

### Image Editing (Photoshop Alternatives)

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **GIMP** | 5k+ | GPL-2.0+ | Desktop app | [GNOME/gimp](https://github.com/GNOME/gimp) | The original open-source Photoshop alternative. Full image editor: layers, masks, brushes, filters, plug-ins. 40+ year history. |
| 2 | **Krita** | 8k+ | GPL-2.0+ | Desktop app | [KDE/krita](https://github.com/KDE/krita) | Professional digital painting & illustration app. Brushes, layers, animation, HDR, PSD import, pen tablet support. |
| 3 | **Inkscape** | 4k+ | GPL-2.0 | Desktop app | [inkscape/inkscape](https://github.com/nicofrand/inkscape) | Full SVG vector graphics editor. Illustrator alternative. Paths, text, clones, gradients, extensions. |
| 4 | **darktable** | 10k+ | GPL-3.0 | Desktop app | [darktable-org/darktable](https://github.com/darktable-org/darktable) | Full photo editing & darkroom platform. Lightroom alternative. RAW processing, non-destructive editing, tethered shooting. |
| 5 | **miniPaint** 🟢 | 3k+ | MIT | [miniPaint](https://viliusle.github.io/miniPaint/) | [viliusle/miniPaint](https://github.com/viliusle/miniPaint) | Online image editor in the browser. Layers, effects, filters, drawing tools, crop, text, color picker. No install needed. |

### Color & Typography Tools

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Realtime Colors** 🟢 | 2k+ | MIT | [realtimecolors.com](https://www.realtimecolors.com) | [juxtopposed/realtimecolors](https://github.com/juxtopposed/realtimecolors) | Full color palette generator app. Visualize colors on a real website in real time. Export to CSS, Tailwind, Figma. |
| 2 | **Color Hunt** (concept) | — | — | [colorhunt.co](https://colorhunt.co) | Study curated palette approach | Community-curated color palettes platform. Study the UX pattern for DMSuite color palette tool. |

---

## 2. Document & Business Platforms

Complete platforms for creating, signing, and managing business documents.

### PDF & Document Platforms

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Stirling-PDF** | 76k+ | AGPL-3.0 | Self-hosted | [Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) | **#1 PDF platform on GitHub.** 50+ PDF tools: merge, split, compress, convert, sign, redact, OCR, watermark. Desktop + web + API. Self-hosted. |
| 2 | **DocuSeal** | 11.7k+ | AGPL-3.0 | [demo.docuseal.tech](https://demo.docuseal.tech) | [docusealco/docuseal](https://github.com/docusealco/docuseal) | Full document filling & signing platform (DocuSign alternative). PDF form builder, 12 field types, automated emails, mobile-optimized. |
| 3 | **OpenSign** | 5k+ | AGPL-3.0 | [opensign.me](https://www.opensign.me) | [OpenSignLabs/OpenSign](https://github.com/OpenSignLabs/OpenSign) | Full e-signature platform. Upload PDFs, add fields, collect signatures. Multi-signer, audit trails, templates. |

### Office Suites (Word/Excel/PowerPoint Alternatives)

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **OnlyOffice** | 5k+ | AGPL-3.0 | [onlyoffice.com](https://www.onlyoffice.com/docs-registration.aspx) | [ONLYOFFICE/DocumentServer](https://github.com/ONLYOFFICE/DocumentServer) | Full office suite. Document editor, spreadsheet, presentation builder. Real-time collaboration, MS Office file formats, plugins. |
| 2 | **CryptPad** | 6k+ | AGPL-3.0 | [cryptpad.fr](https://cryptpad.fr) | [cryptpad/cryptpad](https://github.com/cryptpad/cryptpad) | Encrypted collaborative office suite. Rich text docs, spreadsheets, presentations, kanban, whiteboard, forms. Zero-knowledge. |
| 3 | **Collabora Online** | 2k+ | MPL-2.0 | Demo available | [CollaboraOnline/online](https://github.com/CollaboraOnline/online) | Full LibreOffice in the browser. Documents, spreadsheets, presentations. Real-time collaboration. Enterprise-ready. |

### Invoice & Accounting Platforms

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Invoice Ninja** | 9k+ | AGPL-3.0 | [invoiceninja.com](https://app.invoiceninja.com) | [invoiceninja/invoiceninja](https://github.com/invoiceninja/invoiceninja) | Full invoicing & accounting platform. Invoices, quotes, payments, expense tracking, time tracking, client portal, reporting. 45+ languages. |
| 2 | **Crater** | 8k+ | AGPL-3.0 | Self-hosted | [crater-invoice/crater](https://github.com/crater-invoice/crater) | Full invoice & expense management app. Invoices, estimates, payments, reports, tax handling. Clean modern UI. |
| 3 | **SolidInvoice** | 600+ | MIT | Self-hosted | [SolidInvoice/SolidInvoice](https://github.com/SolidInvoice/SolidInvoice) | Open-source invoicing platform. Invoices, quotes, clients, recurring billing, payment gateways. |
| 4 | **ERPNext** | 22k+ | GPL-3.0 | [erpnext.com](https://erpnext.com) | [frappe/erpnext](https://github.com/frappe/erpnext) | Full ERP platform. Accounting, inventory, HR, CRM, manufacturing, project management. Complete business operations suite. |

### Resume & CV Builders

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Reactive Resume** 🟢 | 30k+ | MIT | [rxresu.me](https://rxresu.me) | [AmruthPillworza/Reactive-Resume](https://github.com/AmruthPillworza/Reactive-Resume) | Full resume builder platform. WYSIWYG editor, 10+ templates, multi-language, PDF export, AI integration, OpenID auth. Self-hostable. |
| 2 | **OpenResume** | 7k+ | AGPL-3.0 | [open-resume.com](https://www.open-resume.com) | [xitanggg/open-resume](https://github.com/xitanggg/open-resume) | Full resume builder & parser app. Import existing PDF resumes, clean form UI, real-time preview, ATS-friendly output. |

### Presentation Platforms

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Slidev** | 34k+ | MIT | [sli.dev](https://sli.dev) | [slidevjs/slidev](https://github.com/slidevjs/slidev) | Full presentation platform. Markdown-powered, code highlighting, LaTeX, diagrams, recording, presenter mode, export PDF. |
| 2 | **reveal.js** | 68k+ | MIT | [revealjs.com](https://revealjs.com) | [hakimel/reveal.js](https://github.com/hakimel/reveal.js) | Full HTML presentation framework. Nested slides, speaker notes, PDF export, auto-animate, plugins ecosystem. Industry standard. |
| 3 | **Impress.js** | 38k+ | MIT | Demo included | [impress/impress.js](https://github.com/impress/impress.js) | Full presentation app with 3D CSS transforms. Zooming, panning, rotating transitions. Prezi-like. |

### Wiki & Documentation Platforms

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **BookStack** 🟢 | 16k+ | MIT | [bookstackapp.com](https://demo.bookstackapp.com) | [BookStackApp/BookStack](https://github.com/BookStackApp/BookStack) | Full documentation/wiki platform. Books → chapters → pages structure. WYSIWYG + Markdown editor, diagrams, templates, multi-language. |
| 2 | **Wiki.js** | 25k+ | AGPL-3.0 | [wiki.js.org](https://wiki.js.org) | [requarks/wiki](https://github.com/requarks/wiki) | Full wiki platform. Multiple editors (visual, markdown, code), Git sync, search, access control, page history, 50+ languages. |
| 3 | **Outline** | 30k+ | BSL-1.1 | [getoutline.com](https://www.getoutline.com) | [outline/outline](https://github.com/outline/outline) | Full knowledge base/wiki. Notion-like editing, real-time collaboration, API, slash commands, nested documents. Beautiful UI. |

---

## 3. Video & Motion Platforms

Complete video editing applications and motion graphics tools.

### 🤖 AI-First Video Generation Platforms

> These platforms are **built around AI video generation** — creating video from text/images using AI models. Study for: AI video generation UX, prompt engineering, model pipelines, progress/preview UI.

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Open-Sora** | 28.8k+ | Apache-2.0 | HF Spaces demo | [hpcaitech/Open-Sora](https://github.com/hpcaitech/Open-Sora) | **Open-source Sora alternative.** Text-to-video & image-to-video generation. 11B model on par with HunyuanVideo. Supports 256px–768px, multiple aspect ratios, up to 129 frames. Multi-GPU inference. Trained for ~$200K. 57 contributors. |
| 2 | **ComfyUI** (Video workflows) | 108k+ | GPL-3.0 | Self-hosted + Desktop | [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | **(Also in Design section.)** Node-based AI engine supports video generation: Wan 2.1/2.2, HunyuanVideo, LTX-Video, Mochi, CogVideoX. The most flexible AI video workflow platform. |

### Video Editors

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Shotcut** | 11k+ | GPL-3.0 | Desktop app | [mltframework/shotcut](https://github.com/mltframework/shotcut) | Full cross-platform video editor. Multi-track timeline, filters, transitions, keyframes, hardware encoding, wide format support. |
| 2 | **Kdenlive** | 4k+ | GPL-2.0 | Desktop app | [KDE/kdenlive](https://github.com/KDE/kdenlive) | Full professional video editor. Multi-track, effects, transitions, titler, audio mixing, proxy editing. KDE project. |
| 3 | **OpenShot** | 4k+ | GPL-3.0 | Desktop app | [OpenShot/openshot-qt](https://github.com/OpenShot/openshot-qt) | Full video editor with simple UX. Trimming, slicing, animation, 3D titles, slow motion, time effects. Great for studying approachable UX. |
| 4 | **LosslessCut** | 39k+ | GPL-2.0 | Desktop app | [mifi/lossless-cut](https://github.com/mifi/lossless-cut) | Full video/audio cutting & trimming app. Lossless operations, multi-track editing, format conversion, batch processing, thumbnails, waveform. Swiss army knife. |
| 5 | **Olive** | 4k+ | GPL-3.0 | Desktop app | [olive-editor/olive](https://github.com/olive-editor/olive) | Non-linear video editor aiming for professional quality. Node-based compositing, GPU acceleration. |

### 3D, VFX & Animation

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Blender** | 18k+ | GPL-2.0+ | Desktop app | [blender/blender](https://github.com/blender/blender) | **Industry-standard 3D suite.** 3D modeling, animation, VFX compositing, video editing, motion graphics, rendering, sculpting. Used by studios worldwide. |
| 2 | **Natron** | 5k+ | GPL-2.0 | Desktop app | [NatronGitHub/Natron](https://github.com/NatronGitHub/Natron) | Full compositing/VFX application. Nuke/After Effects alternative. Node-based, 2D tracking, keying, rotoscoping, 1000+ effects. |
| 3 | **Synfig** | 2k+ | GPL-3.0 | Desktop app | [synfig/synfig](https://github.com/synfig/synfig) | Full 2D animation studio. Vector tweening, bones system, advanced effects. Produces broadcast-quality animation. |
| 4 | **Pencil2D** | 1k+ | GPL-2.0 | Desktop app | [pencil2d/pencil](https://github.com/pencil2d/pencil) | Full 2D hand-drawn animation app. Bitmap and vector drawing, onion skinning, timeline, camera layer. |
| 5 | **Glaxnimate** | 1k+ | GPL-3.0 | Desktop app | [glaxnimate/glaxnimate](https://github.com/glaxnimate/glaxnimate) | Full vector animation app. Creates Lottie/SVG/GIF animations. Visual keyframe editor, shape tools, asset library. |

### Recording & Streaming

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **OBS Studio** | 65k+ | GPL-2.0 | Desktop app | [obsproject/obs-studio](https://github.com/obsproject/obs-studio) | **Industry standard** for recording & streaming. Scenes, sources, filters, virtual camera, multi-track audio, plugin ecosystem. |
| 2 | **ScreenStudio** (reference) | 4k+ | — | Desktop app | Study the UX | Beautiful screen recording tool. Study for screen-recorder tool UI/UX patterns. |

### Browser-Based Video Editors

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **react-video-editor** 🟢 | 3k+ | MIT | Demo included | [designcombo/react-video-editor](https://github.com/designcombo/react-video-editor) | Full browser-based video editor. React + Remotion. Multi-track timeline, text, audio, transitions. Canva/CapCut style. |
| 2 | **fabric-video-editor** 🟢 | 800+ | MIT | Demo included | [AmitDigga/fabric-video-editor](https://github.com/AmitDigga/fabric-video-editor) | Browser video editor with Next.js + Fabric.js. Timeline, layers, text overlay, export. Directly matches our stack! |

---

## 4. Audio & Music Platforms

Complete audio editing and music production applications.

### 🤖 AI-First Audio & Speech Platforms

> These platforms are **built around AI audio generation** — creating speech, music, or sound effects from text/prompts. Study for: TTS UX, voice cloning interfaces, music generation prompting, audio preview/playback.

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Coqui TTS** | 45k+ | MPL-2.0 | Self-hosted | [coqui-ai/TTS](https://github.com/coqui-ai/TTS) | **Most complete open-source TTS library.** 1100+ pretrained models across languages. XTTS v2 for multi-lingual voice cloning with <200ms latency. Tacotron, VITS, Bark, Tortoise models. Python API + CLI + web server. 145 contributors. |
| 2 | **Bark** | 39.1k+ | MIT | HF Spaces demo | [suno-ai/bark](https://github.com/suno-ai/bark) | **AI text-to-audio model** by Suno. Generates speech, music, sound effects, laughter, sighing. 13+ languages, 100+ voice presets. GPT-style generative architecture. Commercial use OK. Works on CPU (2GB) to GPU (12GB). |
| 3 | **AudioCraft (MusicGen)** | 23.1k+ | MIT (code) | Notebooks | [facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft) | **Meta's AI audio generation suite.** MusicGen (text-to-music), AudioGen (text-to-sound), EnCodec (audio codec), MAGNeT (non-autoregressive generation), JASCO (text+chords+drums conditioning). Training + inference code. 34 contributors. |
| 4 | **ComfyUI** (Audio workflows) | 108k+ | GPL-3.0 | Self-hosted | [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | **(Also in Design/Video.)** Node-based AI engine supports Stable Audio, ACE Step audio generation models. The most flexible multi-modal AI workflow platform. |

### Traditional Audio Editors & DAWs

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Audacity** | 16.7k+ | GPL-2.0+ | Desktop app | [audacity/audacity](https://github.com/audacity/audacity) | **The original open-source audio editor.** Multi-track recording & editing, effects, noise reduction, spectral analysis, plug-ins. 240+ contributors. |
| 2 | **Ardour** | 4k+ | GPL-2.0 | Desktop app | [Ardour/ardour](https://github.com/Ardour/ardour) | Full digital audio workstation (DAW). Multi-track recording, mixing, routing, MIDI, plugins (VST/AU/LV2), automation. Pro-audio quality. |
| 3 | **LMMS** | 8k+ | GPL-2.0 | Desktop app | [LMMS/lmms](https://github.com/LMMS/lmms) | Full music production platform. Beat/melody editor, synthesizers, piano roll, FX mixer, song editor, VST support. FL Studio alternative. |
| 4 | **Tenacity** | 4k+ | GPL-2.0+ | Desktop app | [tenacity-team/tenacity](https://github.com/tenacity-team/tenacity) | Audacity fork with privacy improvements. Same feature set: multi-track editing, effects, recording, analysis. |
| 5 | **AudioMass** 🟢 | 2k+ | MIT | [audiomass.co](https://audiomass.co) | [pkalogiros/AudioMass](https://github.com/pkalogiros/AudioMass) | Full audio editor **in the browser**. Waveform editing, effects (reverb, delay, EQ), recording, export. No install needed. |
| 6 | **Sonic Visualiser** | 600+ | GPL-2.0 | Desktop app | [sonic-visualiser/sonic-visualiser](https://github.com/sonic-visualiser/sonic-visualiser) | Audio analysis & visualization app. Spectrogram, waveform, annotation, plugins, beat tracking. Study for audio visualization UI. |

---

## 5. Content & Publishing Platforms

Complete CMS, blogging, newsletter, and knowledge-base applications.

### 🤖 AI-First Content & Chat Platforms

> These platforms are **built around AI** — LLM chat, AI writing, agent workflows, and content generation as their core function. Study for: AI chat UX, agent building interfaces, RAG integration, multi-model switching, tool/plugin ecosystems.

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Langflow** 🟢 | 147k+ | MIT | [langflow.org](https://www.langflow.org) | [langflow-ai/langflow](https://github.com/langflow-ai/langflow) | **Most starred AI workflow platform.** Visual builder for AI agents & workflows. Drag-and-drop, Python customization, MCP server deployment, multi-agent orchestration. Desktop app available. 344 contributors. Python + TypeScript. |
| 2 | **Dify** | 136k+ | Dify OSL (Apache-based) | [dify.ai](https://dify.ai) | [langgenius/dify](https://github.com/langgenius/dify) | **Production-ready LLM app platform.** Visual workflow builder, RAG pipeline, agent capabilities, Prompt IDE, 50+ built-in tools (DALL·E, Stable Diffusion, Google Search). Hundreds of model providers. 1,223 contributors. TypeScript + Python. |
| 3 | **Open WebUI** | 130k+ | Custom | [openwebui.com](https://openwebui.com) | [open-webui/open-webui](https://github.com/open-webui/open-webui) | **#1 self-hosted AI chat UI.** Supports Ollama + OpenAI-compatible APIs. RAG with 9 vector databases, web search (15+ providers), image generation (DALL-E, ComfyUI, AUTOMATIC1111), voice/video call, model builder, Python function calling, plugin framework. 758 contributors. Python + Svelte. |
| 4 | **LobeHub** | 74.6k+ | LobeHub Community | [lobehub.com](https://lobehub.com) | [lobehub/lobehub](https://github.com/lobehub/lobehub) | **Agent workspace platform.** Agent-as-unit-of-work paradigm, multi-agent collaboration (Agent Groups), personal memory, 10,000+ skills/MCP plugins, TTS/STT, pages/schedules/projects, Vercel/Docker deploy. 331 contributors. TypeScript 98.7%. |
| 5 | **LibreChat** 🟢 | 35.2k+ | MIT | [librechat.ai](https://librechat.ai) | [danny-avila/LibreChat](https://github.com/danny-avila/LibreChat) | **All-in-one AI chat.** Agents, MCP support, Code Interpreter (Python/Node/Go/Rust/Java), Artifacts, image generation (DALL-E, SD, Flux), web search, resumable streams, multi-provider (Anthropic, AWS, OpenAI, Azure, Google). 365 contributors. TypeScript 75.9%. |

### Publishing & CMS

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Ghost** 🟢 | 49k+ | MIT | [ghost.org](https://ghost.org) | [TryGhost/Ghost](https://github.com/TryGhost/Ghost) | Full publishing platform. Rich editor, newsletters, membership/subscriptions, SEO, custom themes, analytics. Used by major publications. |
| 2 | **WordPress** | 20k+ | GPL-2.0 | [wordpress.org](https://wordpress.org) | [WordPress/WordPress](https://github.com/WordPress/WordPress) | The world's most popular CMS. Powers 40%+ of the web. Gutenberg block editor, themes, plugins, multisite, REST API. |
| 3 | **Strapi** 🟢 | 65k+ | MIT | [strapi.io](https://strapi.io) | [strapi/strapi](https://github.com/strapi/strapi) | Full headless CMS platform. Content types builder, REST/GraphQL API, media library, roles, i18n, plugins. Node.js. |
| 4 | **Directus** | 30k+ | GPL-3.0 | [directus.io](https://directus.io) | [directus/directus](https://github.com/directus/directus) | Full data platform with instant REST+GraphQL API. Admin dashboard, roles/permissions, file management, flows automation. |
| 5 | **Payload CMS** 🟢 | 35k+ | MIT | [payloadcms.com](https://payloadcms.com) | [payloadcms/payload](https://github.com/payloadcms/payload) | Next.js-native headless CMS. Full admin panel, rich text editor, access control, localization, versions, live preview. TypeScript. |

### Newsletter & Email Platforms

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Listmonk** | 16k+ | AGPL-3.0 | [listmonk.app](https://listmonk.app) | [knadh/listmonk](https://github.com/knadh/listmonk) | Full newsletter & mailing list manager. Campaign editor, subscriber management, analytics, templating, multi-list, bounce processing. |
| 2 | **Mautic** | 9.4k+ | GPL-3.0 | Self-hosted | [mautic/mautic](https://github.com/mautic/mautic) | Full marketing automation platform (also covers newsletters). Email campaigns, landing pages, forms, segments, lead scoring, A/B testing. |
| 3 | **Keila** | 1.5k+ | AGPL-3.0 | Self-hosted | [pentacent/keila](https://github.com/pentacent/keila) | Full email newsletter platform. WYSIWYG + Markdown editors, forms, segments, analytics. Mailchimp alternative. |

### Knowledge Base & Wiki

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Outline** | 30k+ | BSL-1.1 | [getoutline.com](https://www.getoutline.com) | [outline/outline](https://github.com/outline/outline) | Full Notion-like knowledge base. Slash commands, markdown, nested docs, real-time collab, search, public sharing. |
| 2 | **AFFiNE** 🟢 | 45k+ | MIT | [affine.pro](https://app.affine.pro) | [toeverything/AFFiNE](https://github.com/toeverything/AFFiNE) | Full Notion + Miro alternative. Docs, whiteboards, databases all in one. Block editor, kanban, real-time collab, local-first. |
| 3 | **Documize** | 2k+ | AGPL-3.0 | Self-hosted | [documize/community](https://github.com/documize/community) | Full documentation platform for teams. Content library, approval workflows, templates, permissions. |

### Translation Platforms

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **LibreTranslate** | 10k+ | AGPL-3.0 | [libretranslate.com](https://libretranslate.com) | [LibreTranslate/LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) | Full self-hosted machine translation platform. Web UI + API, 30+ languages, auto-detection, batch translation. No external API needed. |
| 2 | **Weblate** | 5k+ | GPL-3.0 | [weblate.org](https://hosted.weblate.org) | [WeblateOrg/weblate](https://github.com/WeblateOrg/weblate) | Full translation management platform. Version control integration, quality checks, glossary, machine translation, collaboration. |

### Grammar & Writing

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **LanguageTool** | 13k+ | LGPL-2.1 | [languagetool.org](https://languagetool.org) | [languagetool-org/languagetool](https://github.com/languagetool-org/languagetool) | Full grammar & spell checker platform. Web UI + API, 30+ languages, style checking, browser extension. Grammarly alternative. |

---

## 6. Marketing & CRM Platforms

Complete marketing automation, analytics, and CRM applications.

### 🤖 AI-First Marketing & Automation Platforms

> These platforms incorporate **AI agents and workflow builders** as their core function — visual AI pipeline builders, chatbot creators, and AI-powered automation. Study for: visual workflow builders, AI chatbot UX, no-code AI interfaces.

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Langflow** 🟢 | 147k+ | MIT | [langflow.org](https://www.langflow.org) | [langflow-ai/langflow](https://github.com/langflow-ai/langflow) | **(Also in Content section.)** Visual AI agent/workflow builder that can be deployed as MCP server. Build chatbots, automation, RAG pipelines visually. Directly applicable to building AI-powered marketing automation. |
| 2 | **Dify** | 136k+ | Dify OSL | [dify.ai](https://dify.ai) | [langgenius/dify](https://github.com/langgenius/dify) | **(Also in Content section.)** Build AI chatbots, customer service agents, content generators. 50+ built-in tools for AI agents. Visual workflow, RAG, backend-as-a-service API. |

### Marketing Automation

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Mautic** | 9.4k+ | GPL-3.0 | [mautic.org](https://mautic.org) | [mautic/mautic](https://github.com/mautic/mautic) | **#1 open-source marketing automation.** Email campaigns, landing pages, forms, lead scoring, A/B testing, segments, analytics, multi-channel. 393+ contributors. |
| 2 | **Chatwoot** 🟢 | 22k+ | MIT | [chatwoot.com](https://app.chatwoot.com/auth/sign_in) | [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | Full customer engagement platform. Live chat, email, social media, WhatsApp, SMS — all in one inbox. CRM features, reports, automations. |
| 3 | **Postiz** | 16k+ | AGPL-3.0 | [postiz.com](https://postiz.com) | [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) | Full social media management platform. Schedule posts, AI content generation, analytics, team collaboration, multi-platform. Buffer/Later alternative. |

### CRM & Sales

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Twenty** | 25k+ | AGPL-3.0 | [twenty.com](https://twenty.com) | [twentyhq/twenty](https://github.com/twentyhq/twenty) | Full CRM platform (Salesforce alternative). Contacts, deals, tasks, emails, calendars, API, workflows. Beautiful modern UI. |
| 2 | **ERPNext** | 22k+ | GPL-3.0 | [erpnext.com](https://erpnext.com) | [frappe/erpnext](https://github.com/frappe/erpnext) | Full ERP + CRM. Accounting, HR, inventory, manufacturing, projects, point-of-sale, website builder. Complete business operations. |

### Analytics Platforms

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Umami** 🟢 | 24k+ | MIT | [umami.is](https://analytics.umami.is/share/LGazGOecbDtaIwDr/umami.is) | [umami-software/umami](https://github.com/umami-software/umami) | Full web analytics platform. **Built with Next.js!** Real-time dashboard, visitor stats, events, goals, funnels. Google Analytics alternative. |
| 2 | **Plausible** | 22k+ | AGPL-3.0 | [plausible.io](https://plausible.io) | [plausible/analytics](https://github.com/plausible/analytics) | Full lightweight analytics platform. Privacy-friendly, real-time dashboard, goals, funnels, custom events. No cookies needed. |
| 3 | **PostHog** 🟢 | 25k+ | MIT | [posthog.com](https://app.posthog.com) | [PostHog/posthog](https://github.com/PostHog/posthog) | Full product analytics suite. Session replay, feature flags, A/B testing, surveys, data pipelines, dashboards. |
| 4 | **OpenReplay** | 12k+ | Custom | [openreplay.com](https://openreplay.com) | [openreplay/openreplay](https://github.com/openreplay/openreplay) | Full session replay & analytics platform. Session recording, DevTools, performance metrics, assist (live co-browsing). Self-hostable. |

### Scheduling & Booking

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Cal.com** | 39k+ | AGPL-3.0 | [cal.com](https://cal.com) | [calcom/cal.com](https://github.com/calcom/cal.com) | Full scheduling & booking platform. Calendar integrations, round-robin, team scheduling, workflows, payments, embeddable widget. Calendly alternative. |

---

## 7. Website & Page Builder Platforms

Complete website builders and email template editors.

### 🤖 AI-First Web Development Platforms

> These platforms use **AI as the primary builder** — describe what you want and AI generates full web applications. Study for: AI code generation UX, prompt-to-app workflows, live preview, deployment integration.

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Bolt.diy** 🟢 | 19.2k+ | MIT | [bolt.new](https://bolt.new) | [stackblitz-labs/bolt.diy](https://github.com/stackblitz-labs/bolt.diy) | **AI-powered full-stack web builder.** Describe an app → AI builds it in the browser. 19+ LLM providers, deploy to Netlify/Vercel/GitHub Pages, Supabase integration, MCP support, diff view, git integration, Electron desktop app, voice prompting. |

### Website Builders

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **GrapesJS** 🟢 | 25.7k+ | BSD-3 | [grapesjs.com/demo](https://grapesjs.com/demo.html) | [GrapesJS/grapesjs](https://github.com/GrapesJS/grapesjs) | Full web page builder. Drag-and-drop, style manager, layer manager, asset manager, code viewer. Working demos for webpage + newsletter builder. |
| 2 | **Webstudio** | 6k+ | AGPL-3.0 | [webstudio.is](https://apps.webstudio.is) | [webstudio-is/webstudio](https://github.com/webstudio-is/webstudio) | Full visual website builder. Webflow alternative. Drag-and-drop, CSS variables, CMS, forms, responsive design. Generates clean code. |
| 3 | **Silex** | 1k+ | GPL-3.0 | [editor.silex.me](https://editor.silex.me) | [silexlabs/Silex](https://github.com/silexlabs/Silex) | Full visual website builder. Drag-and-drop, responsive design, publish anywhere, no code. Built on GrapesJS. |
| 4 | **Microweber** 🟢 | 3k+ | MIT | [microweber.com](https://microweber.com) | [microweber/microweber](https://github.com/microweber/microweber) | Full CMS + website builder. Drag-and-drop, e-commerce, blog, shop, templates. Wix/Squarespace alternative. |

### Email Template Builders

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Mosaico** | 1.7k+ | GPL-3.0 | Demo included | [voidlabs/mosaico](https://github.com/voidlabs/mosaico) | Full email template editor. Drag-and-drop blocks, responsive, multiple template themes. Working visual editor. |
| 2 | **Unlayer** (reference) | — | — | [unlayer.com](https://unlayer.com) | Study UX pattern | Email + page builder. Study the drag-and-drop block pattern for DMSuite email template tool. |

---

## 8. Utilities & Productivity Platforms

Complete utility applications and workflow tools.

### Image Utilities

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Squoosh** 🟢 | 22k+ | Apache-2.0 | [squoosh.app](https://squoosh.app) | [GoogleChromeLabs/squoosh](https://github.com/GoogleChromeLabs/squoosh) | Full image compression app by Google. Side-by-side compare, multiple codecs (WebP, AVIF, MozJPEG), resize, reduce palette. Browser-based. |
| 2 | **Carbon** 🟢 | 36k+ | MIT | [carbon.now.sh](https://carbon.now.sh) | [carbon-app/carbon](https://github.com/carbon-app/carbon) | Full code screenshot beautifier. Syntax highlighting, themes, export PNG/SVG, adjustable padding/fonts. Study for screenshot-beautifier tool. |
| 3 | **Upscayl** | 44k+ | AGPL-3.0 | Desktop app | [upscayl/upscayl](https://github.com/upscayl/upscayl) | Full AI image upscaling/enhancing app. Multiple AI models, batch processing, custom models. *(See also Section 1 — AI-First Design.)* |

### QR & Barcode

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **QRCode.react** + many web apps | — | — | Various | Multiple repos | QR code generation is well-served by libraries, but few full "platforms" exist. Study Stirling-PDF's QR module for UX patterns. |

### Project Management

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Plane** | 35k+ | AGPL-3.0 | [plane.so](https://app.plane.so) | [makeplane/plane](https://github.com/makeplane/plane) | Full project management platform (Jira alternative). Issues, sprints, cycles, modules, pages, analytics, custom views. |
| 2 | **Leantime** | 5k+ | AGPL-3.0 | [leantime.io](https://leantime.io) | [Leantime/leantime](https://github.com/Leantime/leantime) | Full project management for non-project-managers. Tasks, timesheets, ideas, retrospectives, goal tracking. |
| 3 | **Focalboard** 🟢 | 22k+ | MIT | Self-hosted | [mattermost-community/focalboard](https://github.com/mattermost-community/focalboard) | Full project management app. Kanban boards, table views, calendar, gallery. Trello/Notion/Asana alternative. By Mattermost. |

### Workflow Automation

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **n8n** | 68k+ | Custom | [n8n.io](https://n8n.io) | [n8n-io/n8n](https://github.com/n8n-io/n8n) | Full workflow automation platform. 400+ integrations, visual node editor, conditional logic, webhooks. Zapier/Make alternative. |
| 2 | **Activepieces** 🟢 | 14k+ | MIT | [activepieces.com](https://www.activepieces.com) | [activepieces/activepieces](https://github.com/activepieces/activepieces) | Full no-code automation platform. 200+ integrations, visual flow builder, AI pieces, webhook triggers. |

### File & Conversion

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Stirling-PDF** | 76k+ | AGPL-3.0 | Self-hosted | [Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) | (See above) Full PDF manipulation & conversion platform. 50+ tools in one app. |
| 2 | **Paperless-ngx** | 25k+ | GPL-3.0 | Self-hosted | [paperless-ngx/paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) | Full document management system. Scan, OCR, tag, search, organize physical documents. Auto-classify, full-text search, mobile-friendly. |

---

## 9. Top 25 Most Important Platforms

The most relevant fully working platforms for DMSuite — **AI-first platforms listed first**, ranked by relevance and quality.

### 🤖 AI-First Platforms (Study First)

| # | Platform | Stars | What It Does | Study For |
|---|----------|-------|-------------|-----------|
| 1 | **AUTOMATIC1111 SD WebUI** | 162k | Full AI image generation web UI | AI image generation UX, txt2img/img2img, inpainting, model management |
| 2 | **Langflow** 🟢 | 147k | Visual AI agent/workflow builder | Visual AI pipeline builder, drag-and-drop agent design, MCP deployment |
| 3 | **Dify** | 136k | LLM app development platform | AI workflow builder, RAG, prompt IDE, agent tools, backend-as-a-service |
| 4 | **Open WebUI** | 130k | Self-hosted AI chat platform | AI chat UX, RAG integration, plugin framework, multi-provider support |
| 5 | **ComfyUI** | 108k | Node-based multi-modal AI engine | Node-based AI workflows, image/video/audio generation, extensibility |
| 6 | **LobeHub** | 74.6k | AI agent workspace | Multi-agent collaboration, agent builder, memory, TTS/STT, MCP plugins |
| 7 | **Fooocus** | 48k | Simplified AI image generator | Clean AI generation UX that hides complexity, Midjourney-like simplicity |
| 8 | **Coqui TTS** | 45k | AI text-to-speech suite | TTS UX, voice cloning, multilingual speech synthesis, model management |
| 9 | **Upscayl** | 44k | AI image upscaler | AI image enhancement UX, batch processing, custom models |
| 10 | **Bark** | 39k | AI text-to-audio model | AI audio generation, speech + music + SFX from text, voice presets |
| 11 | **LibreChat** 🟢 | 35k | All-in-one AI chat | AI agent building, MCP support, code interpreter, image gen, artifacts |
| 12 | **Open-Sora** | 28.8k | AI video generation | Text-to-video UX, image-to-video, multi-GPU inference, model pipelines |
| 13 | **InvokeAI** 🟢 | 26.9k | Professional AI creative tools | Unified canvas, workflow nodes, gallery, professional AI image workflow |
| 14 | **AudioCraft** | 23.1k | AI music & audio generation | Text-to-music UX, audio conditioning, training pipelines |

### Traditional Platforms (Still Essential)

| # | Platform | Stars | What It Replaces | Study For |
|---|----------|-------|-----------------|-----------|
| 15 | **Excalidraw** 🟢 | 120k | Wireframing/whiteboard | Canvas UX, collaboration, export, PWA |
| 16 | **Stirling-PDF** | 76k | Adobe PDF tools | 50+ PDF tool patterns, self-hosted architecture |
| 17 | **n8n** | 68k | Zapier/Make | Workflow automation, visual node editor |
| 18 | **reveal.js** 🟢 | 68k | PowerPoint/Google Slides | Presentation creation, slides, transitions |
| 19 | **Ghost** 🟢 | 49k | WordPress/Medium | Publishing, newsletter, membership |
| 20 | **tldraw** | 46k | Miro/FigJam | Whiteboard, infinite canvas, AI integrations |
| 21 | **Penpot** 🟢 | 45k | Figma/Canva | Design editor UX, components, prototyping |
| 22 | **LosslessCut** | 39k | Video trimming tools | Video cutting UX, timeline, waveform |
| 23 | **Cal.com** | 39k | Calendly | Scheduling UX, booking, payments |
| 24 | **Reactive Resume** 🟢 | 30k | Resume builders | Resume builder UX, templates, AI integration |
| 25 | **GrapesJS** 🟢 | 25.7k | Webflow/Wix | Drag-and-drop page building, style editor |

---

## 10. Implementation Priority

> **Strategy:** AI-first in every phase. Study AI-native platforms before traditional ones. Every new DMSuite tool should launch with AI capabilities from day one.

### Phase 1: AI Foundation (Critical Path)
Build the AI infrastructure that powers everything else:
- **Open WebUI / LibreChat** → Study AI chat architecture, RAG, plugin systems → Enhance Chiko
- **Dify / Langflow** → Study visual workflow builders → Build AI pipeline UI for Chiko's backend
- **ComfyUI** → Study node-based AI workflows → Could power DMSuite's AI image/video/audio generation
- **rembg / GFPGAN / Real-ESRGAN** → AI image processing (background removal, face restore, upscale) → Integrate across all design tools

### Phase 2: AI Creative Tools (Highest User Impact)
- **AUTOMATIC1111 / InvokeAI / Fooocus** → AI image generation UX → Build "AI Image Studio" tool
- **Fish Speech / Coqui TTS / Bark** → AI voice generation → Voiceover for presentations, video tools
- **MoneyPrinterTurbo** → AI video creation pipeline → Build "AI Video Maker" tool
- **Docling / Marker** → AI document processing → Enhance PDF tools with AI parsing/conversion

### Phase 3: Core Design & Documents
Study these **alongside** AI integration:
- **Polotno Studio / vue-fabric-editor** → Template-based Fabric.js design UX (closest to DMSuite pattern)
- **Penpot** → Advanced design features: components, design tokens, inspect mode
- **Stirling-PDF** → PDF tools suite architecture and UX
- **Invoice Ninja / Crater** → Invoicing, quoting, receipt patterns
- **react-video-editor / fabric-video-editor** → Browser-based video editor (React + Fabric.js)
- **AudioMass** → Browser-based audio editing

### Phase 4: Content, Marketing & Utilities
- **Ghost / Payload CMS** → Publishing platform patterns
- **Mautic / Postiz** → Marketing automation, social media scheduling
- **GrapesJS / Webstudio** → Website builder with drag-and-drop
- **Bolt.diy** → AI-powered web development in browser
- **n8n / Activepieces** → Workflow automation patterns
- **Umami** → Analytics dashboard (Next.js, directly applicable)

---

---

## 11. AI-First & AI-Native Platforms

> **What makes a platform "AI-first"?** AI is the **core feature**, not a bolt-on. These are fully working, deployable applications where AI generation, processing, or intelligence is the primary function. All have working web UIs or desktop apps, 1,000+ GitHub stars, and are actively maintained.

### AI Image Generation Platforms

| # | Platform | Stars | License | Web UI | GitHub | AI Features |
|---|----------|-------|---------|--------|--------|-------------|
| 1 | **AUTOMATIC1111 SD WebUI** | 162k | AGPL-3.0 | Yes (Gradio) | [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) | Full Stable Diffusion web UI: txt2img, img2img, inpainting, outpainting, upscaling, ControlNet, LoRA, prompt matrix, face restoration, tiling, CLIP interrogator, extensions ecosystem |
| 2 | **ComfyUI** | 108k | GPL-3.0 | Yes | [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | Node-based visual AI generation engine: image, video, audio, 3D. Modular workflows, any model support (SD, SDXL, Flux, Wan, HunyuanVideo), custom node ecosystem, API mode, queue system |
| 3 | **Fooocus** | 48k | GPL-3.0 | Yes (Gradio) | [lllyasviel/Fooocus](https://github.com/lllyasviel/Fooocus) | Midjourney-like simplified image generation. Offline, open source. Automatic prompt enhancement, style presets, inpainting, image prompt, advanced settings hidden by default. LTS-only maintenance |
| 4 | **InvokeAI** 🟢 | 26.9k | Apache-2.0 | Yes | [invoke-ai/InvokeAI](https://github.com/invoke-ai/InvokeAI) | Professional creative AI studio: unified canvas for inpainting/outpainting, node-based workflows, model manager (SD 1.5/SDXL/Flux), ControlNet, IP-Adapter, LoRA, textual inversion, batch generation |
| 5 | **SD.Next** 🟢 | 7k | Apache-2.0 | Yes | [vladmandic/sdnext](https://github.com/vladmandic/sdnext) | All-in-one AI image/video generation WebUI. Supports SD, SDXL, SD3, Flux, Kandinsky, DeepFloyd, PixArt, Stable Cascade, video models. Very actively maintained with frequent updates |
| 6 | **SwarmUI** 🟢 | 3.9k | MIT | Yes | [mcmonkeyprojects/SwarmUI](https://github.com/mcmonkeyprojects/SwarmUI) | Modular AI image/video generation web UI. Clean interface, workflow system, ComfyUI backend integration, model browser, prompt tools. Active development |

### AI Video Generation Platforms

| # | Platform | Stars | License | Web UI | GitHub | AI Features |
|---|----------|-------|---------|--------|--------|-------------|
| 1 | **MoneyPrinterTurbo** 🟢 | 54.8k | MIT | Yes (Streamlit) | [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | One-click AI short video generator: provide a topic → AI writes script, finds stock footage, generates voiceover (Edge/Azure TTS), adds subtitles (Whisper), background music. Supports 10+ LLM providers (OpenAI, DeepSeek, Gemini, Ollama). Batch generation, 9:16 and 16:9, API + Web UI. Very active (commits hours ago) |
| 2 | **Open-Sora** | 28.8k | Apache-2.0 | Yes (Gradio) | [hpcaitech/Open-Sora](https://github.com/hpcaitech/Open-Sora) | Open reproduction of OpenAI's Sora: text-to-video, image-to-video generation. Up to 16s/720p video, variable resolution/duration/aspect ratio, multi-GPU training |
| 3 | **Wan2.1** | 15.7k | Apache-2.0 | Yes (Gradio) | [Wan-Video/Wan2.1](https://github.com/Wan-Video/Wan2.1) | State-of-the-art text-to-video & image-to-video. 1.3B and 14B param models, runs on consumer GPUs (12GB+ VRAM for 1.3B), multilingual prompts, high motion quality |
| 4 | **SadTalker** | 13.7k | Apache-2.0 | Yes (Gradio) | [OpenTalker/SadTalker](https://github.com/OpenTalker/SadTalker) | Audio-driven talking face animation: input a photo + audio → generates realistic talking head video. 3DMM motion generation, face reenactment, expression control. Last commit ~3 years ago |
| 5 | **CogVideo/CogVideoX** | 12.6k | Apache-2.0 (code) | Yes (Gradio) | [zai-org/CogVideo](https://github.com/zai-org/CogVideo) | Text-to-video & image-to-video generation by Zhipu AI. CogVideoX models (2B/5B), 6s video generation, supports multiple resolutions, diffusers integration |

### AI Audio & Text-to-Speech Platforms

| # | Platform | Stars | License | Web UI | GitHub | AI Features |
|---|----------|-------|---------|--------|--------|-------------|
| 1 | **Coqui TTS** | 45k | MPL-2.0 | Yes (built-in server port 5002) | [coqui-ai/TTS](https://github.com/coqui-ai/TTS) | Advanced TTS with 1,100+ languages. XTTS v2 multilingual voice cloning from 6s of audio, Bark integration, Tortoise, voice conversion (FreeVC), speaker encoder, Docker server with web demo. Last commit ~2 years ago |
| 2 | **Bark** (Suno) | 39.1k | MIT | HuggingFace demo | [suno-ai/bark](https://github.com/suno-ai/bark) | Transformer-based text-to-audio: speech, music, sound effects all from text. 13 languages, 100+ voice presets, nonverbal sounds ([laughter], [sighs], [music]). ~12GB VRAM full / ~2GB small models. Last commit ~2 years ago |
| 3 | **RVC WebUI** 🟢 | 35.1k | MIT | Yes (Gradio) | [RVC-Project/Retrieval-based-Voice-Conversion-WebUI](https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI) | Voice conversion using retrieval + VITS: train with ≤10min data, real-time VC with 90ms latency, RMVPE pitch extraction, UVR5 vocal/instrument separation. Last release Jun 2024 |
| 4 | **Fish Speech** | 29k | Fish Audio Research License | Yes (Gradio + awesome_webui) | [fishaudio/fish-speech](https://github.com/fishaudio/fish-speech) | State-of-the-art multilingual TTS (80+ languages). 4B Dual-AR architecture, fine-grained emotion/prosody control via tags, multi-speaker, voice cloning from 10-30s samples, streaming with <100ms TTFA, SGLang support. Very active (commits days ago) |
| 5 | **AudioCraft** (Meta) | ~21k | MIT | Yes (Gradio demos) | [facebookresearch/audiocraft](https://github.com/facebookresearch/audiocraft) | Meta's audio generation library: MusicGen (text-to-music), AudioGen (text-to-sound-effects), EnCodec (neural audio codec), Multi Band Diffusion. Multiple model sizes (small/medium/large/melody) |

### AI Document Processing Platforms

| # | Platform | Stars | License | Web UI | GitHub | AI Features |
|---|----------|-------|---------|--------|--------|-------------|
| 1 | **Docling** (IBM) 🟢 | 56.9k | MIT | CLI + API | [docling-project/docling](https://github.com/docling-project/docling) | AI-powered document parsing: advanced PDF layout detection, OCR, table structure recognition, Vision Language Model integration, exports to Markdown/JSON/HTML. Used for RAG pipelines and knowledge extraction |
| 2 | **Marker** | 33.3k | GPL-3.0 | Yes (Gradio) | [datalab-to/marker](https://github.com/datalab-to/marker) | AI PDF/EPUB/MOBI to Markdown/JSON converter. Deep learning layout detection, OCR, table recognition, equation detection. 10x faster than nougat with higher accuracy. Batch processing support |

### AI Chat & Agent Platforms

| # | Platform | Stars | License | Web UI | GitHub | AI Features |
|---|----------|-------|---------|--------|--------|-------------|
| 1 | **AutoGPT** | 183k | Polyform Shield + MIT | Yes | [Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | Build, deploy, and run autonomous AI agents. Visual low-code agent builder, workflow management with connected blocks, agent marketplace, monitoring/analytics. Self-hostable platform. 797 contributors |
| 2 | **Langflow** 🟢 | 147k | MIT | Yes | [langflow-ai/langflow](https://github.com/langflow-ai/langflow) | Visual AI workflow builder: drag-and-drop components for all major LLMs, vector DBs, tools. MCP server export, agent orchestration, Python customization, desktop app. Very active |
| 3 | **Dify** | 136k | Dify Open Source License (Apache 2.0 based) | Yes | [langgenius/dify](https://github.com/langgenius/dify) | LLM app development platform: visual workflow builder, RAG pipeline builder, agent capabilities, 50+ built-in tools, model management across hundreds of providers, LLMOps, Backend-as-a-Service API. Extremely active |
| 4 | **Open WebUI** | 130k | Open WebUI License | Yes | [open-webui/open-webui](https://github.com/open-webui/open-webui) | Self-hosted AI platform supporting Ollama + OpenAI-compatible APIs. RAG with 9 vector DBs, web search (15+ providers), image generation (DALL-E, ComfyUI, AUTOMATIC1111), voice/video calls, plugins, RBAC, LDAP/SSO, Redis horizontal scaling |
| 5 | **LobeHub** | 74.6k | LobeHub Community License | Yes | [lobehub/lobehub](https://github.com/lobehub/lobehub) | Agent-based AI workspace: 10,000+ skills/MCP plugins, multi-agent collaboration, personal memory system, TTS/STT, file upload, Docker/Vercel deploy. Very active |
| 6 | **Flowise** 🟢 | 51.4k | Apache-2.0 | Yes | [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise) | Visual AI agent builder: no-code/low-code, LangChain-based drag-and-drop, chatflows + agentflows, credentials management, Docker self-host. AgentFlow v2 for multi-agent. Very active |
| 7 | **LibreChat** 🟢 | 35.2k | MIT | Yes | [danny-avila/LibreChat](https://github.com/danny-avila/LibreChat) | All-in-one AI chat: Anthropic, OpenAI, AWS, Google, Azure + many more. Agents with MCP, Code Interpreter (Python/Node/Go), Artifacts, web search, DALL-E/SD/Flux image gen, multi-user auth, Helm charts. Very active |

### AI Image Processing & Enhancement

| # | Platform | Stars | License | Web UI | GitHub | AI Features |
|---|----------|-------|---------|--------|--------|-------------|
| 1 | **GFPGAN** (Tencent ARC) | 37.4k | Apache-2.0 | HuggingFace/Replicate demos | [TencentARC/GFPGAN](https://github.com/TencentARC/GFPGAN) | Real-world blind face restoration using generative facial prior (StyleGAN2). V1.3/V1.4 models, background enhancement via Real-ESRGAN integration. Last commit ~2 years ago |
| 2 | **Real-ESRGAN** | 34.9k | BSD-3-Clause | HuggingFace Gradio demo | [xinntao/Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN) | Practical image/video super-resolution with pure synthetic training data. Anime-specific models, portable NCNN executables (Win/Linux/Mac), GFPGAN face enhancement integration. Last commit ~2 years ago |
| 3 | **IOPaint** (lama-cleaner) | 22.9k | Apache-2.0 | Yes (port 8080) | [Sanster/IOPaint](https://github.com/Sanster/IOPaint) | AI inpainting & outpainting: LaMa, SD inpainting, BrushNet, PowerPaint models. Plugins: SAM segmentation, RemoveBG, RealESRGAN, GFPGAN. Batch processing, file manager. **ARCHIVED Aug 2025** |
| 4 | **rembg** 🟢 | 22.4k | MIT | Yes (Gradio built-in) | [danielgatis/rembg](https://github.com/danielgatis/rembg) | AI background removal: CLI, library, HTTP server, Docker. 15+ models (u2net, SAM, BiRefNet, BRIA RMBG), GPU support (CUDA/ROCm). Active (commits last week) |
| 5 | **CodeFormer** | 17.9k | NTU S-Lab License 1.0 | HuggingFace/Replicate demos | [sczhou/CodeFormer](https://github.com/sczhou/CodeFormer) | Blind face restoration with codebook lookup transformer (NeurIPS 2022). Face colorization, face inpainting, video enhancement. Widely integrated into SD WebUI/ComfyUI |

### AI Code & Development Platforms

| # | Platform | Stars | License | Interface | GitHub | AI Features |
|---|----------|-------|---------|-----------|--------|-------------|
| 1 | **OpenHands** (ex-OpenDevin) 🟢 | 70.4k | MIT | GUI + CLI + SDK | [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) | AI-driven development platform. Local GUI (React), CLI (like Claude Code/Codex), Software Agent SDK, Cloud hosted option. Trusted by TikTok, Amazon, Netflix, Apple, Google, NVIDIA. 493 contributors. Very active (commits hourly) |
| 2 | **Aider** | 42.7k | Apache-2.0 | Terminal | [Aider-AI/aider](https://github.com/Aider-AI/aider) | AI pair programming in terminal. Codebase mapping, 100+ languages, git integration (auto-commits), IDE watch mode, voice-to-code, image/web context, linting/testing integration. Works with Claude, GPT, DeepSeek, local models |
| 3 | **Goose** (Block/Square) | 33.9k | Apache-2.0 | Desktop App + CLI + TUI | [block/goose](https://github.com/block/goose) | On-machine AI agent: builds projects, writes/executes code, debugs, orchestrates workflows, interacts with APIs. Multi-model support, MCP integration, Electron desktop app. Rust-based. Custom distros supported. 436 contributors. Very active |
| 4 | **Continue** | 32.2k | Apache-2.0 | VS Code + JetBrains + CLI | [continuedev/continue](https://github.com/continuedev/continue) | Source-controlled AI checks enforceable in CI. VS Code & JetBrains extensions for autocomplete + chat. CLI tool (`cn`) for AI-powered PR checks as GitHub status checks. 474 contributors |
| 5 | **Bolt.diy** 🟢 | 19.2k | MIT | Yes (Web, port 5173) + Desktop | [stackblitz-labs/bolt.diy](https://github.com/stackblitz-labs/bolt.diy) | AI-powered full-stack web development in the browser. 19+ LLM providers, deploy to Netlify/Vercel/GitHub Pages, Supabase integration, MCP support, diff view, git integration, Electron desktop app, voice prompting, file locking during AI generation |

---

## 12. AI-First Platforms — Top 20 Quick Reference

| # | Platform | Stars | Category | Why It Matters |
|---|----------|-------|----------|---------------|
| 1 | **AutoGPT** | 183k | AI Agents | Visual agent builder + autonomous AI execution |
| 2 | **AUTOMATIC1111 SD WebUI** | 162k | AI Image Gen | De facto standard for Stable Diffusion generation |
| 3 | **Langflow** 🟢 | 147k | AI Workflows | Visual drag-and-drop AI workflow builder (MIT!) |
| 4 | **Dify** | 136k | AI Workflows | LLM app platform with RAG, agents, visual workflows |
| 5 | **Open WebUI** | 130k | AI Chat | Self-hosted AI chat with RAG, image gen, voice |
| 6 | **ComfyUI** | 108k | AI Image Gen | Node-based AI generation engine (image/video/audio/3D) |
| 7 | **LobeHub** | 74.6k | AI Chat | Agent workspace with 10,000+ MCP plugins |
| 8 | **OpenHands** 🟢 | 70.4k | AI Code | Full AI development platform (GUI+CLI+SDK) |
| 9 | **Docling** 🟢 | 56.9k | AI Document | IBM's AI document parser (layout, OCR, VLM) |
| 10 | **MoneyPrinterTurbo** 🟢 | 54.8k | AI Video | One-click AI short video generator |
| 11 | **Flowise** 🟢 | 51.4k | AI Workflows | Visual AI agent builder, LangChain-based |
| 12 | **Fooocus** | 48k | AI Image Gen | Simplified Midjourney-like generation |
| 13 | **Coqui TTS** | 45k | AI Audio | 1,100+ language TTS with voice cloning |
| 14 | **Aider** | 42.7k | AI Code | AI pair programming in terminal |
| 15 | **Bark** 🟢 | 39.1k | AI Audio | Text-to-audio (speech, music, sound effects) |
| 16 | **GFPGAN** | 37.4k | AI Enhancement | Face restoration with generative facial prior |
| 17 | **LibreChat** 🟢 | 35.2k | AI Chat | All-in-one AI chat with MCP, code interpreter |
| 18 | **RVC WebUI** 🟢 | 35.1k | AI Audio | Voice conversion with real-time inference |
| 19 | **Real-ESRGAN** | 34.9k | AI Enhancement | Image/video super-resolution |
| 20 | **Goose** 🟢 | 33.9k | AI Code | On-machine AI agent by Block (desktop+CLI) |

---

## 13. DMSuite AI Integration Priorities

### Phase A: Immediate AI Enhancements (Highest ROI)
Integrate AI capabilities into existing DMSuite tools:
- **AI Image Generation** → Study **ComfyUI** node system + **Fooocus** simplicity for a DMSuite "AI Image Studio" tool
- **AI Background Removal** → Study **rembg** (MIT, 15+ models) — can integrate into Certificate Designer, ID Badge, etc.
- **AI Face Restoration** → Study **GFPGAN** + **CodeFormer** for photo enhancement in ID Badge, profile tools
- **AI Upscaling** → Study **Real-ESRGAN** for image enhancement across all design tools

### Phase B: AI Content Generation
- **AI Video Creation** → Study **MoneyPrinterTurbo** architecture for a "Video Maker" tool (script→footage→voiceover→subtitles→export)
- **AI Voice/TTS** → Study **Fish Speech** (most active, 80+ languages) or **Coqui TTS** for voiceover in presentations, videos
- **AI Document Processing** → Study **Docling** for PDF parsing, **Marker** for document conversion

### Phase C: AI Chat & Workflow Integration
- **Chiko AI Enhancement** → Study **Open WebUI** (RAG, plugins, web search) and **LibreChat** (MCP, code interpreter) to enhance Chiko
- **AI Workflow Builder** → Study **Dify** or **Flowise** visual workflow patterns for a DMSuite automation tool

### Phase D: AI Code & Development Tools
- **AI Code Review** → Study **Continue** CI checks pattern for a code review tool
- **AI Coding Agent** → Study **Bolt.diy** browser-based AI coding — could inspire a DMSuite code playground tool

---

*Updated: Includes both general open-source platforms AND AI-first/AI-native platforms.*
*All projects verified on GitHub. Star counts approximate as of research date (August 2025).*
*Platforms marked "Very active" have commits within the past week.*
