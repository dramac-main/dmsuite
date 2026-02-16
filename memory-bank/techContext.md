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
│   │   ├── api/chat/route.ts      # Streaming Claude API proxy
│   │   ├── dashboard/page.tsx     # Hub dashboard
│   │   └── tools/[categoryId]/[toolId]/page.tsx  # Tool workspace router
│   ├── components/
│   │   ├── ThemeProvider.tsx       # Dark/light context
│   │   ├── ThemeSwitch.tsx         # Toggle button
│   │   ├── icons.tsx               # 81 SVG icons + iconMap (69 mapped)
│   │   ├── dashboard/             # Hub components (7 files)
│   │   └── workspaces/            # Tool workspace components
│   │       └── AIChatWorkspace.tsx # AI Chat with streaming
│   ├── stores/                     # Zustand state management
│   │   ├── sidebar.ts             # Sidebar state (persisted)
│   │   ├── chat.ts                # Chat conversations (persisted)
│   │   ├── preferences.ts         # User preferences (persisted)
│   │   └── index.ts               # Barrel export
│   ├── lib/
│   │   ├── utils.ts               # cn() class merge utility
│   │   ├── tokens.ts              # TypeScript design tokens
│   │   ├── jsonld.ts              # JSON-LD structured data helpers
│   │   └── colors.ts              # Safe color class lookup maps
│   └── data/
│       ├── config/colors.ts        # JS color config
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
- ✅ Custom colors: `--color-primary-500: #8ae600` in `@theme inline`
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
Primary:    #8ae600 (electric-lime green) — brand accent
Secondary:  #06b6d4 (cyan/teal) — secondary accent
Gray:       Slate scale #f8fafc → #0a0f1a
Semantic:   success (#22c55e), error (#ef4444), warning (#f59e0b), info (#3b82f6)
```

## Dependencies (Production)
- `next` 16.1.6
- `react` 19.2.3
- `react-dom` 19.2.3
- `framer-motion` ^12.34.0
- `zustand` ^5.0.11
- `clsx` + `tailwind-merge` (cn utility)
- `class-variance-authority` ^0.7.1

Dev dependencies: TypeScript types, ESLint, PostCSS, Tailwind.

## Known Technical Gotchas
1. **ThemeProvider** uses lazy initializer (`getInitialTheme()`) to avoid hydration mismatch — do NOT use `useEffect` for initial state
2. **Sidebar state** must be lifted to the dashboard page to avoid duplicate hamburger buttons
3. **Tailwind v4** requires PostCSS config with `@tailwindcss/postcss` plugin
4. **Dev server port 6006** — configured in package.json, not default 3000

## APIs (Active & Planned)
- **Anthropic Claude** — Text/creative intelligence (API route built, streaming, key required in `.env.local`)
- **LumaAI** — Video generation (planned)
- **Stable Diffusion / FLUX** — Image generation (planned)
- **ElevenLabs** — Voice/audio generation (planned)
