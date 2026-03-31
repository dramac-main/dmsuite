# DMSuite — Open Source Platforms Research

> **Purpose:** Map every DMSuite tool category to **fully working open-source platforms** — complete applications you can run, use, and study. NOT libraries or frameworks.
>
> **Philosophy:** Find existing products that already do what we need. Study their UX, feature set, architecture, and workflows. Replicate the best ideas inside DMSuite.
>
> **Rule:** Every entry here is a **complete, deployable application** with a working UI — not a library, SDK, or framework.

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

---

## 1. Design & Graphics Platforms

These are fully working design applications — Canva/Figma/Photoshop alternatives you can run today.

### Full Design Editors (Canva/Figma Alternatives)

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Penpot** | 45k+ | MPL-2.0 | [penpot.app](https://design.penpot.app) | [penpot/penpot](https://github.com/penpot/penpot) | Full Figma alternative. Design tool with components, prototyping, design tokens, CSS Grid, inspect mode, plugins. Self-hostable. 233+ contributors. |
| 2 | **Excalidraw** | 120k+ | MIT | [excalidraw.com](https://excalidraw.com) | [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | Full whiteboard & diagramming app. Hand-drawn style, real-time collaboration, E2E encryption, PWA, shape libraries, export PNG/SVG. Used by Google Cloud, Meta, Notion. |
| 3 | **tldraw** | 46k+ | Custom | [tldraw.com](https://www.tldraw.com) | [tldraw/tldraw](https://github.com/tldraw/tldraw) | Infinite canvas whiteboard app. Drawing, diagramming, multiplayer, AI integrations. Full working app at tldraw.com. React-based. |
| 4 | **Graphite** | 10k+ | MPL-2.0 | [graphite.rs](https://editor.graphite.rs) | [GraphiteEditor/Graphite](https://github.com/GraphiteEditor/Graphite) | Full 2D vector design editor. Node-based procedural editing, raster & vector graphics, animation timeline. Runs in browser via WASM. |
| 5 | **Polotno Studio** | 2k+ | MIT | [studio.polotno.com](https://studio.polotno.com) | [lavrton/polotno-studio](https://github.com/lavrton/polotno-studio) | Full working Canva-like design editor. Templates, text, images, shapes, export. React-based, runs in browser. |
| 6 | **vue-fabric-editor** | 6k+ | MIT | [Live Demo](https://nihaojob.github.io/vue-fabric-editor/) | [ikuaitu/vue-fabric-editor](https://github.com/ikuaitu/vue-fabric-editor) | Complete poster/image design editor. Templates, layers, custom fonts, materials panel, drag-and-drop. Fabric.js-based. |
| 7 | **yft-design** | 4k+ | MIT | [yft.design](https://yft.design) | [dromara/yft-design](https://github.com/dromara/yft-design) | Full online design platform. Posters, product images, covers. PSD parser, SVG support, template system. Fabric.js + Vue3. |

### Image Editing (Photoshop Alternatives)

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **GIMP** | 5k+ | GPL-2.0+ | Desktop app | [GNOME/gimp](https://github.com/GNOME/gimp) | The original open-source Photoshop alternative. Full image editor: layers, masks, brushes, filters, plug-ins. 40+ year history. |
| 2 | **Krita** | 8k+ | GPL-2.0+ | Desktop app | [KDE/krita](https://github.com/KDE/krita) | Professional digital painting & illustration app. Brushes, layers, animation, HDR, PSD import, pen tablet support. |
| 3 | **Inkscape** | 4k+ | GPL-2.0 | Desktop app | [inkscape/inkscape](https://github.com/nicofrand/inkscape) | Full SVG vector graphics editor. Illustrator alternative. Paths, text, clones, gradients, extensions. |
| 4 | **darktable** | 10k+ | GPL-3.0 | Desktop app | [darktable-org/darktable](https://github.com/darktable-org/darktable) | Full photo editing & darkroom platform. Lightroom alternative. RAW processing, non-destructive editing, tethered shooting. |
| 5 | **miniPaint** | 3k+ | MIT | [miniPaint](https://viliusle.github.io/miniPaint/) | [viliusle/miniPaint](https://github.com/viliusle/miniPaint) | Online image editor in the browser. Layers, effects, filters, drawing tools, crop, text, color picker. No install needed. |
| 6 | **IOPaint** (lama-cleaner) | 20k+ | Apache-2.0 | Self-hosted | [Sanster/IOPaint](https://github.com/Sanster/IOPaint) | Full AI image inpainting app. Remove objects, fix photos, upscale images. Working web UI. Multiple AI models. |

### Color & Typography Tools

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Realtime Colors** | 2k+ | MIT | [realtimecolors.com](https://www.realtimecolors.com) | [juxtopposed/realtimecolors](https://github.com/juxtopposed/realtimecolors) | Full color palette generator app. Visualize colors on a real website in real time. Export to CSS, Tailwind, Figma. |
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
| 1 | **Reactive Resume** | 30k+ | MIT | [rxresu.me](https://rxresu.me) | [AmruthPillworza/Reactive-Resume](https://github.com/AmruthPillworza/Reactive-Resume) | Full resume builder platform. WYSIWYG editor, 10+ templates, multi-language, PDF export, AI integration, OpenID auth. Self-hostable. |
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
| 1 | **BookStack** | 16k+ | MIT | [bookstackapp.com](https://demo.bookstackapp.com) | [BookStackApp/BookStack](https://github.com/BookStackApp/BookStack) | Full documentation/wiki platform. Books → chapters → pages structure. WYSIWYG + Markdown editor, diagrams, templates, multi-language. |
| 2 | **Wiki.js** | 25k+ | AGPL-3.0 | [wiki.js.org](https://wiki.js.org) | [requarks/wiki](https://github.com/requarks/wiki) | Full wiki platform. Multiple editors (visual, markdown, code), Git sync, search, access control, page history, 50+ languages. |
| 3 | **Outline** | 30k+ | BSL-1.1 | [getoutline.com](https://www.getoutline.com) | [outline/outline](https://github.com/outline/outline) | Full knowledge base/wiki. Notion-like editing, real-time collaboration, API, slash commands, nested documents. Beautiful UI. |

---

## 3. Video & Motion Platforms

Complete video editing applications and motion graphics tools.

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
| 1 | **react-video-editor** | 3k+ | MIT | Demo included | [designcombo/react-video-editor](https://github.com/designcombo/react-video-editor) | Full browser-based video editor. React + Remotion. Multi-track timeline, text, audio, transitions. Canva/CapCut style. |
| 2 | **fabric-video-editor** | 800+ | MIT | Demo included | [AmitDigga/fabric-video-editor](https://github.com/AmitDigga/fabric-video-editor) | Browser video editor with Next.js + Fabric.js. Timeline, layers, text overlay, export. Directly matches our stack! |

---

## 4. Audio & Music Platforms

Complete audio editing and music production applications.

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Audacity** | 16.7k+ | GPL-2.0+ | Desktop app | [audacity/audacity](https://github.com/audacity/audacity) | **The original open-source audio editor.** Multi-track recording & editing, effects, noise reduction, spectral analysis, plug-ins. 240+ contributors. |
| 2 | **Ardour** | 4k+ | GPL-2.0 | Desktop app | [Ardour/ardour](https://github.com/Ardour/ardour) | Full digital audio workstation (DAW). Multi-track recording, mixing, routing, MIDI, plugins (VST/AU/LV2), automation. Pro-audio quality. |
| 3 | **LMMS** | 8k+ | GPL-2.0 | Desktop app | [LMMS/lmms](https://github.com/LMMS/lmms) | Full music production platform. Beat/melody editor, synthesizers, piano roll, FX mixer, song editor, VST support. FL Studio alternative. |
| 4 | **Tenacity** | 4k+ | GPL-2.0+ | Desktop app | [tenacity-team/tenacity](https://github.com/tenacity-team/tenacity) | Audacity fork with privacy improvements. Same feature set: multi-track editing, effects, recording, analysis. |
| 5 | **AudioMass** | 2k+ | MIT | [audiomass.co](https://audiomass.co) | [pkalogiros/AudioMass](https://github.com/pkalogiros/AudioMass) | Full audio editor **in the browser**. Waveform editing, effects (reverb, delay, EQ), recording, export. No install needed. |
| 6 | **Sonic Visualiser** | 600+ | GPL-2.0 | Desktop app | [sonic-visualiser/sonic-visualiser](https://github.com/sonic-visualiser/sonic-visualiser) | Audio analysis & visualization app. Spectrogram, waveform, annotation, plugins, beat tracking. Study for audio visualization UI. |

---

## 5. Content & Publishing Platforms

Complete CMS, blogging, newsletter, and knowledge-base applications.

### Publishing & CMS

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Ghost** | 49k+ | MIT | [ghost.org](https://ghost.org) | [TryGhost/Ghost](https://github.com/TryGhost/Ghost) | Full publishing platform. Rich editor, newsletters, membership/subscriptions, SEO, custom themes, analytics. Used by major publications. |
| 2 | **WordPress** | 20k+ | GPL-2.0 | [wordpress.org](https://wordpress.org) | [WordPress/WordPress](https://github.com/WordPress/WordPress) | The world's most popular CMS. Powers 40%+ of the web. Gutenberg block editor, themes, plugins, multisite, REST API. |
| 3 | **Strapi** | 65k+ | MIT | [strapi.io](https://strapi.io) | [strapi/strapi](https://github.com/strapi/strapi) | Full headless CMS platform. Content types builder, REST/GraphQL API, media library, roles, i18n, plugins. Node.js. |
| 4 | **Directus** | 30k+ | GPL-3.0 | [directus.io](https://directus.io) | [directus/directus](https://github.com/directus/directus) | Full data platform with instant REST+GraphQL API. Admin dashboard, roles/permissions, file management, flows automation. |
| 5 | **Payload CMS** | 35k+ | MIT | [payloadcms.com](https://payloadcms.com) | [payloadcms/payload](https://github.com/payloadcms/payload) | Next.js-native headless CMS. Full admin panel, rich text editor, access control, localization, versions, live preview. TypeScript. |

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
| 2 | **AFFiNE** | 45k+ | MIT | [affine.pro](https://app.affine.pro) | [toeverything/AFFiNE](https://github.com/toeverything/AFFiNE) | Full Notion + Miro alternative. Docs, whiteboards, databases all in one. Block editor, kanban, real-time collab, local-first. |
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

### Marketing Automation

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Mautic** | 9.4k+ | GPL-3.0 | [mautic.org](https://mautic.org) | [mautic/mautic](https://github.com/mautic/mautic) | **#1 open-source marketing automation.** Email campaigns, landing pages, forms, lead scoring, A/B testing, segments, analytics, multi-channel. 393+ contributors. |
| 2 | **Chatwoot** | 22k+ | MIT | [chatwoot.com](https://app.chatwoot.com/auth/sign_in) | [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | Full customer engagement platform. Live chat, email, social media, WhatsApp, SMS — all in one inbox. CRM features, reports, automations. |
| 3 | **Postiz** | 16k+ | AGPL-3.0 | [postiz.com](https://postiz.com) | [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) | Full social media management platform. Schedule posts, AI content generation, analytics, team collaboration, multi-platform. Buffer/Later alternative. |

### CRM & Sales

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Twenty** | 25k+ | AGPL-3.0 | [twenty.com](https://twenty.com) | [twentyhq/twenty](https://github.com/twentyhq/twenty) | Full CRM platform (Salesforce alternative). Contacts, deals, tasks, emails, calendars, API, workflows. Beautiful modern UI. |
| 2 | **ERPNext** | 22k+ | GPL-3.0 | [erpnext.com](https://erpnext.com) | [frappe/erpnext](https://github.com/frappe/erpnext) | Full ERP + CRM. Accounting, HR, inventory, manufacturing, projects, point-of-sale, website builder. Complete business operations. |

### Analytics Platforms

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Umami** | 24k+ | MIT | [umami.is](https://analytics.umami.is/share/LGazGOecbDtaIwDr/umami.is) | [umami-software/umami](https://github.com/umami-software/umami) | Full web analytics platform. **Built with Next.js!** Real-time dashboard, visitor stats, events, goals, funnels. Google Analytics alternative. |
| 2 | **Plausible** | 22k+ | AGPL-3.0 | [plausible.io](https://plausible.io) | [plausible/analytics](https://github.com/plausible/analytics) | Full lightweight analytics platform. Privacy-friendly, real-time dashboard, goals, funnels, custom events. No cookies needed. |
| 3 | **PostHog** | 25k+ | MIT | [posthog.com](https://app.posthog.com) | [PostHog/posthog](https://github.com/PostHog/posthog) | Full product analytics suite. Session replay, feature flags, A/B testing, surveys, data pipelines, dashboards. |
| 4 | **OpenReplay** | 12k+ | Custom | [openreplay.com](https://openreplay.com) | [openreplay/openreplay](https://github.com/openreplay/openreplay) | Full session replay & analytics platform. Session recording, DevTools, performance metrics, assist (live co-browsing). Self-hostable. |

### Scheduling & Booking

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Cal.com** | 39k+ | AGPL-3.0 | [cal.com](https://cal.com) | [calcom/cal.com](https://github.com/calcom/cal.com) | Full scheduling & booking platform. Calendar integrations, round-robin, team scheduling, workflows, payments, embeddable widget. Calendly alternative. |

---

## 7. Website & Page Builder Platforms

Complete website builders and email template editors.

### Website Builders

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **GrapesJS** | 25.7k+ | BSD-3 | [grapesjs.com/demo](https://grapesjs.com/demo.html) | [GrapesJS/grapesjs](https://github.com/GrapesJS/grapesjs) | Full web page builder. Drag-and-drop, style manager, layer manager, asset manager, code viewer. Working demos for webpage + newsletter builder. |
| 2 | **Webstudio** | 6k+ | AGPL-3.0 | [webstudio.is](https://apps.webstudio.is) | [webstudio-is/webstudio](https://github.com/webstudio-is/webstudio) | Full visual website builder. Webflow alternative. Drag-and-drop, CSS variables, CMS, forms, responsive design. Generates clean code. |
| 3 | **Silex** | 1k+ | GPL-3.0 | [editor.silex.me](https://editor.silex.me) | [silexlabs/Silex](https://github.com/silexlabs/Silex) | Full visual website builder. Drag-and-drop, responsive design, publish anywhere, no code. Built on GrapesJS. |
| 4 | **Microweber** | 3k+ | MIT | [microweber.com](https://microweber.com) | [microweber/microweber](https://github.com/microweber/microweber) | Full CMS + website builder. Drag-and-drop, e-commerce, blog, shop, templates. Wix/Squarespace alternative. |

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
| 1 | **Squoosh** | 22k+ | Apache-2.0 | [squoosh.app](https://squoosh.app) | [GoogleChromeLabs/squoosh](https://github.com/GoogleChromeLabs/squoosh) | Full image compression app by Google. Side-by-side compare, multiple codecs (WebP, AVIF, MozJPEG), resize, reduce palette. Browser-based. |
| 2 | **Carbon** | 36k+ | MIT | [carbon.now.sh](https://carbon.now.sh) | [carbon-app/carbon](https://github.com/carbon-app/carbon) | Full code screenshot beautifier. Syntax highlighting, themes, export PNG/SVG, adjustable padding/fonts. Study for screenshot-beautifier tool. |
| 3 | **Upscayl** | 35k+ | AGPL-3.0 | Desktop app | [upscayl/upscayl](https://github.com/upscayl/upscayl) | Full AI image upscaling/enhancing app. Multiple AI models, batch processing, custom models. Working desktop app. |

### QR & Barcode

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **QRCode.react** + many web apps | — | — | Various | Multiple repos | QR code generation is well-served by libraries, but few full "platforms" exist. Study Stirling-PDF's QR module for UX patterns. |

### Project Management

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Plane** | 35k+ | AGPL-3.0 | [plane.so](https://app.plane.so) | [makeplane/plane](https://github.com/makeplane/plane) | Full project management platform (Jira alternative). Issues, sprints, cycles, modules, pages, analytics, custom views. |
| 2 | **Leantime** | 5k+ | AGPL-3.0 | [leantime.io](https://leantime.io) | [Leantime/leantime](https://github.com/Leantime/leantime) | Full project management for non-project-managers. Tasks, timesheets, ideas, retrospectives, goal tracking. |
| 3 | **Focalboard** | 22k+ | MIT | Self-hosted | [mattermost-community/focalboard](https://github.com/mattermost-community/focalboard) | Full project management app. Kanban boards, table views, calendar, gallery. Trello/Notion/Asana alternative. By Mattermost. |

### Workflow Automation

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **n8n** | 68k+ | Custom | [n8n.io](https://n8n.io) | [n8n-io/n8n](https://github.com/n8n-io/n8n) | Full workflow automation platform. 400+ integrations, visual node editor, conditional logic, webhooks. Zapier/Make alternative. |
| 2 | **Activepieces** | 14k+ | MIT | [activepieces.com](https://www.activepieces.com) | [activepieces/activepieces](https://github.com/activepieces/activepieces) | Full no-code automation platform. 200+ integrations, visual flow builder, AI pieces, webhook triggers. |

### File & Conversion

| # | Platform | Stars | License | Live Demo | GitHub | What It Does |
|---|----------|-------|---------|-----------|--------|--------------|
| 1 | **Stirling-PDF** | 76k+ | AGPL-3.0 | Self-hosted | [Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) | (See above) Full PDF manipulation & conversion platform. 50+ tools in one app. |
| 2 | **Paperless-ngx** | 25k+ | GPL-3.0 | Self-hosted | [paperless-ngx/paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) | Full document management system. Scan, OCR, tag, search, organize physical documents. Auto-classify, full-text search, mobile-friendly. |

---

## 9. Top 25 Most Important Platforms

The most relevant fully working platforms for DMSuite — ranked by relevance and quality.

| # | Platform | Stars | What It Replaces | Study For |
|---|----------|-------|-----------------|-----------|
| 1 | **Penpot** | 45k | Figma/Canva design | Design editor UX, components, prototyping, SVG workflow |
| 2 | **Stirling-PDF** | 76k | Adobe PDF tools | PDF manipulation UI, 50+ tool patterns, self-hosted architecture |
| 3 | **Excalidraw** | 120k | Wireframing/whiteboard | Canvas UX, collaboration, export, PWA, shape libraries |
| 4 | **Ghost** | 49k | WordPress/Medium | Publishing, editor UX, newsletter, membership, SEO |
| 5 | **n8n** | 68k | Zapier/Make | Workflow automation, visual node editor, integration patterns |
| 6 | **Blender** | 18k | After Effects/3ds Max | Video editing, 3D, animation, compositing, motion graphics |
| 7 | **OBS Studio** | 65k | Screen recording tools | Recording, streaming, scene composition |
| 8 | **Audacity** | 16.7k | Professional audio editors | Audio editing UX, effects, multi-track, waveform display |
| 9 | **Reactive Resume** | 30k | Resume builders | Resume builder UX, templates, PDF export, AI integration |
| 10 | **Invoice Ninja** | 9k | QuickBooks/FreshBooks | Invoice/quote/receipt UI, PDF generation, payment tracking |
| 11 | **GrapesJS** | 25.7k | Webflow/Wix | Drag-and-drop page building, style editing, code output |
| 12 | **Mautic** | 9.4k | HubSpot/Mailchimp | Email campaigns, marketing automation, segments, lead scoring |
| 13 | **DocuSeal** | 11.7k | DocuSign | Document signing, PDF form builder, field types, workflow |
| 14 | **Umami** | 24k | Google Analytics | Analytics dashboard UI, real-time stats (**built with Next.js!**) |
| 15 | **LosslessCut** | 39k | Video trimming tools | Video cutting UX, timeline, waveform, format handling |
| 16 | **AFFiNE** | 45k | Notion | Block editor, knowledge base, whiteboard, local-first |
| 17 | **tldraw** | 46k | Miro/FigJam | Whiteboard, infinite canvas, multiplayer, AI integrations |
| 18 | **Polotno Studio** | 2k | Canva | Template-based design editor, closest to DMSuite's pattern |
| 19 | **Shotcut** | 11k | Premiere/DaVinci | Full video editor timeline, effects, transitions, multi-track |
| 20 | **Twenty** | 25k | Salesforce | CRM, contacts, deals, pipelines, modern UI |
| 21 | **reveal.js** | 68k | PowerPoint/Google Slides | Presentation creation, slides, transitions, speaker notes |
| 22 | **Postiz** | 16k | Buffer/Later | Social media scheduling, AI content, analytics |
| 23 | **IOPaint** | 20k | Photoshop AI tools | AI image editing, inpainting, upscaling, object removal |
| 24 | **Plane** | 35k | Jira/Asana | Project management UI, sprints, boards, analytics |
| 25 | **Upscayl** | 35k | Topaz AI | AI image upscaling, enhancement, batch processing |

---

## 10. Implementation Priority

### Phase 1: Core Design & Documents (Highest Impact)
Study these platforms to build the remaining Design Studio and Document tools:
- **Polotno Studio / vue-fabric-editor** → Template-based Fabric.js design UX (closest to DMSuite pattern)
- **Penpot** → Advanced design features: components, design tokens, inspect mode
- **Stirling-PDF** → PDF tools suite architecture and UX
- **Invoice Ninja / Crater** → Invoicing, quoting, receipt patterns
- **Reactive Resume** → Resume builder UX → already built, study for improvements

### Phase 2: Video & Audio (Biggest New Capability)
- **react-video-editor** → Browser-based video editor (React + Remotion, closest match)
- **Shotcut / LosslessCut** → Video editing UX patterns and feature set
- **AudioMass** → Browser-based audio editing (no install, perfect reference)
- **Audacity** → Full audio editor feature set to replicate

### Phase 3: Content & Marketing
- **Ghost** → Publishing platform patterns, newsletter UX
- **Mautic** → Marketing automation, email campaigns, lead tracking
- **Postiz** → Social media management and scheduling
- **LanguageTool** → Grammar checking UX

### Phase 4: Web Building & Utilities
- **GrapesJS / Webstudio** → Website builder with drag-and-drop
- **Umami** → Analytics dashboard (Next.js, directly applicable)
- **n8n** → Workflow automation patterns
- **Squoosh** → Image compression UX (browser-based)

---

*Updated: Fully working open-source platforms only — no libraries or frameworks.*
*All projects verified on GitHub. Star counts approximate as of research date.*
