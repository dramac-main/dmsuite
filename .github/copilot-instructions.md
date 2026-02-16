# DMSuite — AI Development Rules

## Memory Bank System

This project uses a Memory Bank located in `/memory-bank/` to maintain context across sessions. Your context resets between sessions, so you MUST rely on these files to understand the project.

### Start of Every Task
**REQUIRED:** Read ALL memory bank files before starting any task:
1. `/memory-bank/projectbrief.md` - Core requirements and project scope
2. `/memory-bank/productContext.md` - Purpose, problems solved, UX goals
3. `/memory-bank/systemPatterns.md` - Architecture, patterns, key decisions
4. `/memory-bank/techContext.md` - Tech stack, setup, constraints
5. `/memory-bank/activeContext.md` - Current focus, recent changes, next steps
6. `/memory-bank/progress.md` - Status, what works, what's left, known issues

### File Hierarchy
```
projectbrief.md (foundation)
    ├── productContext.md
    ├── systemPatterns.md
    └── techContext.md
            └── activeContext.md (current state)
                    └── progress.md (tracking)
```

### When to Update Memory Bank
Automatically update when:
- Discovering new architectural patterns or technical decisions
- Implementing significant features or changes
- User explicitly requests "update memory bank" (review ALL files)
- Context needs clarification for future sessions

When updating:
1. Review ALL memory bank files (even if no changes needed)
2. Focus on `activeContext.md` and `progress.md` for current state
3. Document insights, patterns, and learnings
4. Update next steps and considerations

### Project Context
- **Project:** DMSuite — AI-powered design & business creative suite
- **Stack:** Next.js 16+, React 19, TypeScript, Tailwind CSS v4
- **Location:** App in `src/app/`, components in `src/components/`, data in `src/data/`
- **Tools Registry:** 116 AI tools across 6 categories in `src/data/tools.ts`
- **Icons Library:** 60+ inline SVG icon components in `src/components/icons.tsx`

### Key Patterns
- Always check memory bank before making assumptions
- Document patterns as they emerge
- Keep activeContext.md current with latest decisions
- Track progress consistently
- Memory bank is your only link to previous work - maintain it with precision

### Working with This Project
1. Start every session by reading the memory bank files
2. When implementing changes, refer to systemPatterns.md for consistency
3. Check activeContext.md for recent decisions and current focus
4. Update memory bank after significant work
5. Use progress.md to understand what's completed vs. what's pending

**Remember:** After every reset, you start fresh. The Memory Bank is your only source of truth about this project's history, decisions, and current state.

---

## Project Overview
DMSuite is an AI-powered design & business suite dashboard built with Next.js 16+, React 19, TypeScript, and Tailwind CSS v4.

## Tech Stack
- **Framework**: Next.js 16+ (App Router, Turbopack)
- **UI**: React 19, Tailwind CSS v4 (`@theme inline` in globals.css)
- **Language**: TypeScript (strict mode)
- **Fonts**: Inter (sans), JetBrains Mono (monospace)
- **Icons**: Custom inline SVG components (`src/components/icons.tsx`) with `iconMap` registry
- **Theme**: Dark-first with light mode support via `dark:` Tailwind classes

## Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css         # Tailwind v4 theme tokens
│   ├── layout.tsx          # Root layout with ThemeProvider
│   ├── page.tsx            # Redirects to /dashboard
│   ├── dashboard/
│   │   └── page.tsx        # AI Suite hub dashboard
│   └── tools/
│       └── [categoryId]/
│           └── [toolId]/
│               └── page.tsx  # Individual tool workspace
├── components/
│   ├── ThemeProvider.tsx    # Theme context (dark/light toggle)
│   ├── ThemeSwitch.tsx     # Sun/Moon toggle button
│   ├── icons.tsx           # 60+ SVG icon components + iconMap
│   └── dashboard/          # Dashboard-specific components
│       ├── Sidebar.tsx       # AI suite sidebar navigation
│       ├── TopBar.tsx        # Header with theme/notifications
│       ├── HeroBanner.tsx    # Welcome banner + live search
│       ├── StatsBar.tsx      # Hub statistics cards
│       ├── QuickAccess.tsx   # Featured tools strip
│       ├── CategorySection.tsx  # Collapsible category + tool grid
│       └── ToolCard.tsx      # Individual tool card
└── data/
    ├── config/
    │   └── colors.ts       # Color palette definitions
    └── tools.ts            # 116 AI tools registry (6 categories)
```

## Design Token Rules
- **NEVER** use hardcoded hex colors — use Tailwind tokens: `bg-primary-500`, `text-gray-400`, etc.
- **NEVER** use pixel values — use Tailwind spacing: `p-5`, `gap-6`, `h-9`, etc.
- Custom tokens are defined in `globals.css` under `@theme inline`.
- Dark mode uses `dark:` prefix. The `<html>` element gets `.dark` class.

## Color System
- **Primary**: Electric-lime green (`primary-50` → `primary-950`)
- **Secondary**: Cyan/teal (`secondary-50` → `secondary-950`)
- **Gray**: Slate scale (`gray-50` → `gray-950`)
- **Semantic**: `success`, `error`, `warning`, `info`
- **Accents**: `wire-transfer` (purple), `bank-transfer` (blue)

## Component Conventions
- All interactive components are `"use client"`.
- Data/config lives in `src/data/` — never inline mock data in components.
- Icons are in `src/components/icons.tsx` — add new ones there, register in `iconMap`.
- Each dashboard section is a separate component for maintainability.
- Tool data references icons by string key via `iconMap` lookup.

## Responsive Rules
- **Mobile-first**: Default styles are for mobile
- **`sm`**: 640px+ — minor layout adjustments
- **`md`**: 768px+ — 2-column grids
- **`lg`**: 1024px+ — Sidebar visible, 3–4 column grids
- **`xl`**: 1280px+ — Extra spacing

## Theme Rules
- Dark mode is the default (class `dark` on `<html>`)
- All surfaces must have both light and dark variants
- Dark: `gray-950` body → `gray-900` sidebar → `gray-800` cards → `gray-700` borders
- Light: `gray-50` body → `white` sidebar/cards → `gray-200` borders

## Tailwind CSS v4 Notes
- Gradient syntax: `bg-linear-to-br` (NOT `bg-gradient-to-br`)
- Use standard spacing tokens: `w-18` (NOT `w-[4.5rem]`)
- Theme defined via `@theme inline {}` in CSS (NOT `tailwind.config.js`)
