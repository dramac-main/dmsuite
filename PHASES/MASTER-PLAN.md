# DMSuite — Master Phase Plan: Road to Production

> **Created:** February 16, 2026
> **Total Phases:** 5
> **Total Waves:** 33
> **Total Tasks:** 150+
> **Estimated Timeline:** 24–34 Weeks (6–8 Months)

---

## 📊 Platform Audit Summary (Pre-Phase)

| Metric | Current State |
|--------|--------------|
| Total tools in registry | 193 |
| Tools with working workspaces | 12 (6.2%) |
| Tools showing placeholder | ~181 (93.8%) |
| Total codebase lines (scanned) | ~15,000+ |
| Code duplication (critical) | ~5,600 lines (3 workspaces share 85%) |
| Utility duplication | 5+ files duplicate `hexToRgba`, `roundRect`, etc. |
| PDF export capability | 0 tools (CRITICAL gap) |
| HTML export for emails | 0 tools (CRITICAL gap) |
| Keyboard shortcuts | 4 global + 4 canvas = 8 total |
| Mobile bottom navigation | None |
| PWA status | Manifest only, no service worker |
| Authentication | None |
| Database | None (localStorage only) |
| Workspaces using UI primitives | 0 of 12 |
| `<a href>` instead of `<Link>` | 6 files |

---

## 🗺️ Phase Overview

### [PHASE 1: Foundation Fortification](./PHASE-1_FOUNDATION-FORTIFICATION.md) — "Bedrock"
**Duration:** 2–3 Weeks | **Waves:** 6 | **Tasks:** ~35

| Wave | Focus | Key Deliverables |
|------|-------|-------------------|
| 1.1 | Critical Bug Fixes | Fix `<a href>`, `min-h-dvh`, theme bugs, search UX, tool status accuracy |
| 1.2 | Code Deduplication (DRY) | Shared shells, utility consolidation, color maps |
| 1.3 | Performance | Lazy loading, Suspense, debounce, z-index scale |
| 1.4 | PWA & Mobile | Icons, manifest, service worker, mobile bottom nav, responsive workspaces |
| 1.5 | Keyboard Shortcuts | 30+ platform-wide shortcuts, shortcuts registry, help modal |
| 1.6 | Accessibility | ARIA labels, focus management, color contrast |

---

### [PHASE 2: Existing Tools — Full Industry-Standard Rebuild](./PHASE-2_EXISTING-TOOLS-REBUILD.md) — "Forged in Fire"
**Duration:** 4–6 Weeks | **Waves:** 9 | **Tasks:** ~45

| Wave | Focus | Key Deliverables |
|------|-------|-------------------|
| 2.1 | Canvas Engine Upgrade | Serialization, multi-select, snap/guides, zoom/pan, inline text editing, rulers, alignment |
| 2.2 | AI Revision Engine | Surgical revisions, style locking, revision history, diff preview |
| 2.3 | AI Chat Rebuild | Full markdown, code highlighting, editing, export, search, stop button |
| 2.4 | Logo Generator Rebuild | SVG sanitization, transparent PNG, mockups, PDF export |
| 2.5 | Social/Poster/Banner Shared Rebuild | Shared engine, deduplication, per-tool features (HTML5 for banners, bleed for posters) |
| 2.6 | Brand Identity & Business Card → Layer-based | Full interactive editing, QR codes, PDF export |
| 2.7 | Presentation Rebuild | Layer-based, PPTX export, slideshow mode, slide management |
| 2.8 | Resume/Invoice/Email Rebuild | PDF export, HTML export, payment terms, ATS scoring |
| 2.9 | Stock Image Browser Enhancement | Collections, color search, filters, inline editing |

---

### [PHASE 3: New Tools — Design & Document Studio](./PHASE-3_NEW-TOOLS-DESIGN-DOCUMENTS.md) — "Arsenal"
**Duration:** 6–8 Weeks | **Waves:** 6 | **Tasks:** ~25

| Wave | Focus | Key Deliverables |
|------|-------|-------------------|
| 3.1 | Print & Stationery | Brochure, Letterhead, Envelope, Certificate, Infographic, Menu, Packaging, Sticker |
| 3.2 | Apparel & Merchandise | T-shirt/Apparel, ID Card/Badge |
| 3.3 | Marketing Collateral | Coupon/Voucher, Calendar, Physical Signage |
| 3.4 | Business Documents | Proposal, Contract, Quotation, Report, Receipt, Catalog |
| 3.5 | Sales Materials | Sales Book A4/A5, Price List |
| 3.6 | Mockup Generator | Device, Product, Scene mockups |

---

### [PHASE 4: Video, Audio, Content, Marketing & Web Studios](./PHASE-4_VIDEO-AUDIO-CONTENT-MARKETING-WEB.md) — "Full Spectrum"
**Duration:** 8–10 Weeks | **Waves:** 6 | **Tasks:** ~35

| Wave | Focus | Key Deliverables |
|------|-------|-------------------|
| 4.1 | Video & Motion Studio | Video editor, AI video, logo reveal, subtitles, GIF, thumbnail, motion graphics, compressor |
| 4.2 | Audio & Voice Studio | TTS, voice cloner, podcast tools, music generator, transcription |
| 4.3 | Content Creation Studio | Blog writer, social copy, email copy, product description, calendar, SEO |
| 4.4 | Marketing & Sales Studio | Landing page, sales funnel, lead magnet, email sequence, QR code, analytics |
| 4.5 | Web & UI Design Studio | Wireframe, UI components, color palette, icon generator |
| 4.6 | Utilities & Workflow | File converter, batch processor, background remover, image enhancer, PDF tools |

---

### [PHASE 5: Platform Maturity & Launch](./PHASE-5_PLATFORM-MATURITY-LAUNCH.md) — "Launchpad"
**Duration:** 4–6 Weeks | **Waves:** 9 | **Tasks:** ~35

| Wave | Focus | Key Deliverables |
|------|-------|-------------------|
| 5.1 | Backend (Supabase) | Auth, database, project save/load, asset library, data migration |
| 5.2 | Brand Kit & Consistency | Brand kit manager, part-edit engine, template system |
| 5.3 | Collaboration | Teams, commenting, version history, sharing |
| 5.4 | Performance | Code splitting, image optimization, caching, canvas performance |
| 5.5 | Accessibility | WCAG 2.1 AA, screen reader, reduced motion, high contrast |
| 5.6 | Full PWA | Offline mode, push notifications, app-like experience |
| 5.7 | Production Deployment | Vercel, monitoring, analytics, documentation |
| 5.8 | Payment & Subscription | Stripe, feature gating, usage quotas |
| 5.9 | Security | Input sanitization, API security, data privacy, GDPR |

---

## 🎯 Critical Path Dependencies

```
Phase 1 (Foundation) ──────────────┐
                                    ├── Phase 2 (Rebuild Existing)
                                    │         │
                                    │         ├── Phase 3 (New Design/Doc Tools)
                                    │         │         │
                                    │         │         ├── Phase 4 (Video/Audio/Content/etc.)
                                    │         │         │
                                    │         │         └───────────────┐
                                    │         │                         │
                                    │         └─────────────────────────┤
                                    │                                   │
                                    └───────────────────────────────────┴── Phase 5 (Launch)
```

- **Phase 1 MUST complete first** — all other phases depend on shared shells, shortcuts, and mobile infrastructure
- **Phase 2 before Phase 3** — canvas engine upgrades needed before building new canvas tools
- **Phase 3 and 4 can partially overlap** — different studios, different developers
- **Phase 5 can start Wave 5.1 (Supabase) during Phase 3** — backend is independent

---

## 📋 Standards Enforced Across ALL Phases

| Standard | Rule |
|----------|------|
| **No hardcoded colors** | All colors from Tailwind tokens or `tokens.ts` |
| **No hardcoded pixels** | All spacing from Tailwind scale |
| **No `<a href>`** | Always `<Link>` from Next.js for internal routes |
| **Mobile-first** | Default styles = mobile, `sm:` `md:` `lg:` `xl:` for larger |
| **Keyboard shortcuts** | Every tool has shortcuts, registered in global registry |
| **AI revision preserves design** | Surgical changes, not full regeneration |
| **Export to proper formats** | PDF for print, HTML for web, PNG/SVG for images |
| **Use UI primitives** | `Button`, `Input`, `Card`, `Badge`, `Modal` from `@/components/ui` |
| **Use shared utilities** | `canvas-utils.ts`, `canvas-layers.ts` — no local duplicates |
| **Undo/redo everywhere** | Every workspace has undo/redo capability |
| **Save/load projects** | All state persisted (localStorage → Supabase) |
| **Zambian locale defaults** | ZMW, +260, Lusaka, 16% VAT where applicable |
| **WCAG 2.1 AA** | All content accessible |
| **PWA compliant** | Offline capable, installable, push notifications |
| **Canvas interactivity** | Click to select, drag to move, handles to resize, zoom, pan |
| **Touch gestures** | Pinch-to-zoom, swipe, tap targets ≥ 44px |
| **Dark-first** | Dark mode default, light mode available |
| **No code duplication** | Shared shells, hooks, utilities — DRY everywhere |

---

## 🏗️ New Dependencies to Install (By Phase)

### Phase 1
```
(no new npm dependencies — all infrastructure)
```

### Phase 2
```bash
npm install react-markdown remark-gfm rehype-highlight jspdf pptxgenjs
```

### Phase 3
```bash
npm install qrcode  # QR code generation
```

### Phase 4
```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util  # Video processing
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link  # Rich text editor
npm install pdf-lib  # PDF manipulation
```

### Phase 5
```bash
npm install @supabase/supabase-js @supabase/ssr  # Backend
npm install stripe @stripe/stripe-js  # Payments
npm install @sentry/nextjs  # Error monitoring
```

---

## 📈 Success Metrics (Post-Launch)

| Metric | Target |
|--------|--------|
| Lighthouse Performance Score | ≥ 90 |
| Lighthouse Accessibility Score | ≥ 95 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| Largest Contentful Paint (LCP) | < 2.5s |
| Interaction to Next Paint (INP) | < 200ms |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Initial JS Bundle | < 200KB |
| Time to Interactive | < 3s |
| Tools with working workspaces | 100% |
| WCAG 2.1 AA violations | 0 |
| PWA Installable | ✅ |
| Offline Functional | ✅ |
