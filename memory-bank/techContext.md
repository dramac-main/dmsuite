# DMSuite — Tech Context

## Core Stack
| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS v4 | `@theme inline` |
| Fonts | Inter (sans), JetBrains Mono (mono) | via next/font/google |

## Development Setup
- **Package Manager:** npm
- **Dev Server:** `npm run dev` → `next dev -p 6006`
- **Build:** `npm run build` → `next build`
- **Lint:** `npm run lint` → `eslint`
- **Dev URL:** http://localhost:6006

## Project Structure
```
d:\dramac-ai-suite\
├── .github/
│   └── copilot-instructions.md   # AI dev rules + memory bank system
├── memory-bank/                   # Context persistence (this system)
├── src/
│   ├── app/
│   │   ├── globals.css            # Tailwind v4 theme tokens
│   │   ├── layout.tsx             # Root layout (fonts, ThemeProvider, SEO)
│   │   ├── page.tsx               # Redirect → /dashboard
│   │   ├── api/chat/route.ts      # Streaming Claude API proxy (5 credits)
│   │   ├── api/chiko/route.ts     # Chiko AI assistant (8 credits)
│   │   ├── api/chat/resume/       # Resume AI routes (10-15 credits)
│   │   ├── dashboard/page.tsx     # Hub dashboard
│   │   └── tools/[categoryId]/[toolId]/page.tsx  # Tool workspace router
│   ├── components/
│   │   ├── ThemeProvider.tsx       # Dark/light context
│   │   ├── ThemeSwitch.tsx         # Toggle button
│   │   ├── icons.tsx               # 81 SVG icons + iconMap (69 mapped)
│   │   ├── dashboard/             # Hub components (7 files)
│   │   ├── editor/                # vNext canvas editor components
│   │   └── workspaces/            # Tool workspace components
│   │       ├── resume-cv/         # Resume builder (wizard + editor)
│   │       │   ├── StepEditor.tsx  # 3-panel editor (20/60/20)
│   │       │   └── editor/         # Design/Sections/Preview panels
│   │       └── ...                 # Other workspace components
│   ├── stores/                     # Zustand state management
│   │   ├── sidebar.ts             # Sidebar state (persisted)
│   │   ├── chat.ts                # Chat conversations (persisted)
│   │   ├── preferences.ts         # User preferences (persisted)
│   │   ├── resume-editor.ts       # Resume editor (temporal + immer + zundo)
│   │   ├── editor.ts              # vNext canvas editor store
│   │   └── index.ts               # Barrel export
│   ├── lib/
│   │   ├── utils.ts               # cn() class merge utility
│   │   ├── tokens.ts              # TypeScript design tokens
│   │   ├── jsonld.ts              # JSON-LD structured data helpers
│   │   ├── colors.ts              # Safe color class lookup maps
│   │   ├── resume/                # Resume builder system
│   │   │   ├── schema.ts          # Zod schema (26 templates, 28 fonts)
│   │   │   ├── pagination.ts      # Pagination engine (26 configs)
│   │   │   ├── export.ts          # PDF/DOCX/text/JSON export
│   │   │   └── templates/
│   │   │       ├── template-defs.ts    # 20 ProTemplateDefinition configs
│   │   │       ├── UniversalTemplate.tsx # Config-driven universal renderer
│   │   │       ├── templates.ts        # Registry (26 total)
│   │   │       ├── TemplateRenderer.tsx # Renderer + pagination + fonts
│   │   │       └── [6 legacy templates]
│   │   └── editor/                # vNext editor infrastructure
│   └── data/
│       ├── config/colors.ts        # JS color config
│       ├── credit-costs.ts         # Credit pricing: costs, packs, tool mapping
│       └── tools.ts                # 250+ tools, 8 categories, enhanced types
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

## Key Technical Constraints

### Tailwind CSS v4 Differences (from v3)
- ❌ No `tailwind.config.js` — use `@theme inline {}` in CSS
- ❌ No `bg-gradient-to-br` — use `bg-linear-to-br`
- ❌ No arbitrary `w-[4.5rem]` when tokens exist — use `w-18`
- ✅ Custom colors: `--color-primary-500: #8b5cf6` in `@theme inline`
- ✅ All standard utilities still work as expected

### React 19
- No breaking changes affecting our code currently
- Using standard hooks: `useState`, `useMemo`, `useEffect`

### Next.js 16 (App Router)
- File-based routing in `src/app/`
- Client components marked with `"use client"`
- Dynamic routes: `[categoryId]` and `[toolId]` params via `useParams()`
- Turbopack for fast dev compilation

### Color Token System
```
Primary:    #8b5cf6 (violet-500) — brand accent (Electric Violet)
Secondary:  #06b6d4 (cyan/teal) — secondary accent (Neon Cyan)
Gray:       Cosmic Slate scale #f8fafc → #070b14
Semantic:   success (#22c55e), error (#ef4444), warning (#f59e0b), info (#3b82f6)
Design:     Glassmorphism — backdrop-blur + white/opacity borders + translucent surfaces
```

## Dependencies (Production)
- `next` 16.1.6
- `react` 19.2.3
- `react-dom` 19.2.3
- `@supabase/supabase-js` + `@supabase/ssr` — Auth + DB
- `framer-motion` ^12.34.0
- `zustand` ^5.0.11
- `clsx` + `tailwind-merge` (cn utility)
- `class-variance-authority` ^0.7.1

Dev dependencies: TypeScript types, ESLint, PostCSS, Tailwind.

## Auth / Payments / Credits Infrastructure
| Component | Location | Notes |
|-----------|----------|-------|
| Supabase browser client | `src/lib/supabase/client.ts` | `createBrowserClient` + `isSupabaseConfigured()` |
| Supabase server client | `src/lib/supabase/server.ts` | Cookie-based session via `next/headers` |
| Middleware helpers | `src/lib/supabase/middleware.ts` | Session refresh + route protection |
| Auth helper | `src/lib/supabase/auth.ts` | `getAuthUser()` — dev-mode mock user |
| Credit system | `src/lib/supabase/credits.ts` | check/deduct/add/refund + 10 operation costs |
| useUser hook | `src/hooks/useUser.ts` | Client auth state + dev-mode passthrough |
| Root middleware | `src/middleware.ts` | Protects all routes except `/auth/*`, webhooks |
| DB migration | `supabase/migrations/001_initial_schema.sql` | profiles + credit_transactions + payments + RLS |
| Auth pages | `src/app/auth/` | login, signup, reset-password, callback, verify |
| Payment routes | `src/app/api/payments/` | initiate, webhook, status (Flutterwave) |
| Dashboard auth UI | `src/components/dashboard/` | UserMenu, CreditBalance, CreditPurchaseModal |

### Environment Variables Required (Production)
```
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role (server-only)
FLUTTERWAVE_SECRET_KEY=         # Flutterwave secret key
FLUTTERWAVE_WEBHOOK_SECRET=     # Flutterwave webhook hash
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY= # Flutterwave public key
ANTHROPIC_API_KEY=              # Claude AI
```

### Dev-Mode Behavior
When Supabase env vars are not set:
- Middleware passes all requests through
- `getAuthUser()` returns mock user `{id: "dev-user"}`
- Credit checks always return `{allowed: true, balance: 9999}`
- `useUser()` returns dev profile with 9999 credits, "pro" plan
- All AI routes work without auth in development

## Known Technical Gotchas
1. **ThemeProvider** uses lazy initializer (`getInitialTheme()`) to avoid hydration mismatch — do NOT use `useEffect` for initial state
2. **Sidebar state** must be lifted to the dashboard page to avoid duplicate hamburger buttons
3. **react-resizable-panels** v4.6.5: numeric size = pixels, string size = percentages; Group `defaultLayout` treats numbers as %
4. **Resume Pro Templates** use `require()` in store `changeTemplate` action — may need dynamic import in Next.js client context
5. **Google Fonts `<link>` injection** in TemplateRenderer — potential hydration warnings in Next.js SSR
6. **Pro template measurement** in hidden container uses legacy PageHeader + SectionRenderer — pro templates may need their own measurement approach
3. **Tailwind v4** requires PostCSS config with `@tailwindcss/postcss` plugin
4. **Dev server port 6006** — configured in package.json, not default 3000

## APIs (Active & Planned)
- **Anthropic Claude** — Text/creative intelligence (streaming, 7 AI routes with auth + credits)
- **Supabase** — Auth (JWT via HTTP-only cookies), PostgreSQL (profiles, credits, payments), RLS
- **Flutterwave** — Mobile money payments (Airtel Money + MTN MoMo, Zambia, STK push)
- **Unsplash / Pexels / Pixabay** — Stock image search (api/images route, no credits)
- **LumaAI** — Video generation (planned)
- **Stable Diffusion / FLUX** — Image generation (planned)
- **ElevenLabs** — Voice/audio generation (planned)
