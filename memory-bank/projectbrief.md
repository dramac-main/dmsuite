# DMSuite — Project Brief

## Project Name
DMSuite (DRAMAC AI Suite)

## Elevator Pitch
An all-in-one AI-powered creative studio that puts 250+ professional tools — spanning design, documents, video, audio, content, marketing, web/UI, and utilities — into a single, beautifully crafted dashboard. One hub, every tool a creative professional needs, all producing jaw-dropping results.

## Core Requirements

### 1. Hub-and-Spoke Dashboard
- Central dashboard (`/dashboard`) displays all tool categories and tools
- Clicking any tool opens its dedicated workspace (`/tools/[categoryId]/[toolId]`)
- Live search across the entire tool registry from the hero banner
- Quick-access strip for featured/recent tools

### 2. Comprehensive Tool Registry
8 categories, 250+ tools total:
| Category | Tools | Focus |
|---|---|---|
| Design Studio | ~46 | Logos, branding, social media, print, packaging, signage, apparel, stationery |
| Document & Print Studio | ~41 | Sales books (A4/A5), catalogs, proposals, invoices, contracts, certificates |
| Video & Motion Studio | ~32 | Video editor, motion graphics, logo reveals, AI generation, subtitles |
| Audio & Voice Studio | ~9 | TTS, voice cloning, podcast, music generation, transcription |
| Content Creation | ~24 | Blog writer, social copy, podcast tools, SEO, email campaigns |
| Marketing & Sales | ~18 | Strategy, research, funnels, lead magnets, analytics |
| Web & UI Design | ~10 | Website builder, wireframes, UI components, email templates |
| Utilities & Workflow | ~20 | AI chat, file converter, batch processing, QR codes, PDFs |

### 3. Design & UX Standards
- **Dark-first** with light mode toggle
- **Mobile-first** responsive (mobile → sm → md → lg → xl)
- Modern minimalistic UI with electric-lime green primary accent
- Industry-grade dashboard quality — no cheap template feel
- Smooth hover effects, transitions, and micro-interactions
- Glassmorphic cards with subtle backdrop blur

### 4. AI Integration
- Anthropic Claude API for text/creative intelligence
- Extensible to LumaAI, Stable Diffusion, and other AI APIs
- Every tool delivers professional, client-ready output

### 5. Technical Constraints
- Next.js 16+ with App Router (Turbopack)
- React 19, TypeScript strict
- Tailwind CSS v4 (`@theme inline`, NOT config file)
- No hardcoded colors or pixel values — tokens only
- All data in `src/data/` — never inline mock data in components
- Custom SVG icon library with `iconMap` string-key lookup

## Target Users
- Professional designers & creative agencies
- Freelancers who design everything from logos to sales books
- Small businesses needing comprehensive marketing materials
- Anyone who wants AI-powered creative tools in one place

## Success Criteria
- Every tool category is exhaustive — covers every format a designer could need
- Output quality drops any client's jaw
- Dashboard feels like a premium product, not a generic template
- Partial edit support — consistent design language across all components
- PWA-ready architecture
