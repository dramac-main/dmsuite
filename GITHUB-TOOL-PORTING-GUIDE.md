# DMSuite — GitHub Open-Source Tool Porting Guide

> **Purpose:** Step-by-step playbook for cloning any open-source GitHub project and integrating it as a first-class tool inside DMSuite. The goal is to preserve 100% of the original functionality, features, and UX — only changing what is structurally required to run inside our platform. After integration, all references to the original project's branding, external links, and GitHub repo are removed so it presents as a native DMSuite tool.

> **CRITICAL RULE:** Do NOT rewrite, simplify, or "improve" the original code. Use it as-is. Only modify what breaks inside our Next.js 16 / React 19 / Tailwind v4 shell.

---

## Table of Contents

1. [Pre-Port Checklist](#1-pre-port-checklist)
2. [Phase 1 — Clone & Evaluate](#2-phase-1--clone--evaluate)
3. [Phase 2 — Install Dependencies](#3-phase-2--install-dependencies)
4. [Phase 3 — File Placement & Structure](#4-phase-3--file-placement--structure)
5. [Phase 4 — Workspace Wrapper](#5-phase-4--workspace-wrapper)
6. [Phase 5 — CSS Isolation](#6-phase-5--css-isolation)
7. [Phase 6 — State Management & Persistence](#7-phase-6--state-management--persistence)
8. [Phase 7 — Platform Integration Points](#8-phase-7--platform-integration-points)
9. [Phase 8 — Supabase / Backend Setup](#9-phase-8--supabase--backend-setup)
10. [Phase 9 — Branding & Link Cleanup](#10-phase-9--branding--link-cleanup)
11. [Phase 10 — Verification & QA](#11-phase-10--verification--qa)
12. [Phase 11 — Tracker Updates](#12-phase-11--tracker-updates)
13. [Integration Patterns Reference](#13-integration-patterns-reference)
14. [Proven Examples](#14-proven-examples)

---

## 1. Pre-Port Checklist

Before starting, confirm ALL of the following:

| # | Check | Why |
|---|-------|-----|
| 1 | License is permissive (MIT, Apache 2.0, BSD, ISC, MPL-2.0) | Legal requirement — no GPL/AGPL unless entire app is compatible |
| 2 | The project uses React (or has a React wrapper/SDK) | DMSuite is React 19 — non-React projects need a wrapper package or iframe |
| 3 | The project runs in the browser (not server-only like a CLI) | We embed tools as client components |
| 4 | Dependencies don't conflict with our stack | Check for React version conflicts, duplicate packages, native modules |
| 5 | Has a clear entry point component | We need one top-level `<Component />` to render inside our workspace |
| 6 | Feature scope fits one DMSuite tool slot | One tool = one workspace. Don't merge multiple tools into one |
| 7 | Read ALL memory bank files first | `/memory-bank/*.md` — understand current state before touching anything |

### Integration Strategy: NPM Package Wrapper (ONLY Approved Approach)

The **only** approved method for porting open-source tools is the **NPM Package Wrapper** pattern — the same approach used for Excalidraw → Sketch Board. This means:

1. Install the project's published npm package
2. Wrap their React component in a thin workspace shell
3. Keep 100% of the original code, UI, and features intact
4. Only add DMSuite integration hooks (theme sync, state persistence, CSS isolation)
5. Clean up branding/external links after everything works

**The original tool's code IS the tool.** We do NOT rewrite schemas, rebuild UIs, create custom parsers, or re-implement features in our design system. If the tool looks different from the original after porting — it's wrong.

| Requirement | Rule |
|-------------|------|
| npm package available? | **Required.** If no npm package exists, the project must be packaged first or is not a candidate. |
| Has a React component? | **Required.** Must export a usable React component (or have a React wrapper SDK). |
| Original UI intact? | **Required.** The ported tool must look and behave identically to the original. |

> **Reference implementation:** Excalidraw → Sketch Board (`@excalidraw/excalidraw` npm package, ~400-line workspace wrapper, 170-line CSS isolation)

---

## 2. Phase 1 — Clone & Evaluate

### 2.1 Clone the Repo

```bash
# Clone into a temporary evaluation directory (NOT into our project)
cd ~/temp
git clone https://github.com/<org>/<repo>.git
cd <repo>
```

### 2.2 Audit the Codebase

Create a brief evaluation document answering:

```markdown
## Port Evaluation: <Tool Name>

- **Repo:** github.com/<org>/<repo>
- **Stars:** X | **License:** MIT/Apache/etc.
- **Framework:** React / Vue / Svelte / Vanilla / Other
- **Build System:** Vite / Webpack / Turbopack / Rollup / Other
- **Language:** TypeScript / JavaScript
- **State Management:** Zustand / Redux / MobX / Context / Other
- **CSS Strategy:** Tailwind / CSS Modules / Styled Components / Emotion / Plain CSS
- **External Services:** (list any APIs, databases, auth providers)
- **npm Package Available?** Yes → `@scope/package` | No → will vendor
- **Entry Component:** `<ComponentName />` from `package-or-path`
- **Key Dependencies:** (list major ones we'd need to add)
- **Conflicts with DMSuite:** (React version, Tailwind version, etc.)
- **Estimated Effort:** S / M / L / XL
```

### 2.3 Run It Locally

```bash
npm install  # or pnpm/yarn
npm run dev  # Verify it works standalone
```

Walk through every feature. Take notes on:
- All external API calls (these need proxying or replacing)
- Authentication flows (replace with our Supabase auth)
- Database calls (replace with our Supabase tables)
- File storage (replace with our storage strategy)
- Payment/subscription checks (remove or replace with our credit system)
- External links (will be removed in cleanup phase)

---

## 3. Phase 2 — Install Dependencies

### 3.1 Add the Package (NPM Wrapper Strategy)

```bash
cd d:\dramac-ai-suite
npm install <package-name> --legacy-peer-deps
```

> **Always use `--legacy-peer-deps`** — our React 19 causes peer dependency conflicts with most packages targeting React 18. This flag is safe; the packages work fine.

### 3.2 Add Peer Dependencies

Check the package's `peerDependencies` and install any missing ones:

```bash
npm install <peer1> <peer2> --legacy-peer-deps
```

### 3.3 Verify No Conflicts

```bash
npx tsc --noEmit 2>&1 | Select-String "<package-name>" | Select-Object -First 20
```

Fix any type conflicts before proceeding. Common fixes:
- Add to `tsconfig.json` → `compilerOptions.paths` if module resolution fails
- Add to `next.config.ts` → `serverExternalPackages` if it has Node.js dependencies
- Add to `next.config.ts` → `transpilePackages` if it ships untranspiled ESM

---

## 4. Phase 3 — File Placement & Structure

### 4.1 Directory Layout

Every ported tool follows this structure:

```
src/
├── components/workspaces/<tool-id>/
│   ├── <ToolName>Workspace.tsx        # Main workspace wrapper (entry point)
│   ├── [SubComponent1].tsx            # Any additional UI panels/components
│   └── [SubComponent2].tsx
├── stores/<tool-id>-editor.ts         # Zustand store (if tool has state)
├── lib/<tool-id>/                     # Schemas, parsers, helpers (if complex)
│   ├── schema.ts
│   └── hooks.ts
├── lib/chiko/manifests/<tool-id>.ts   # Chiko AI actions manifest
├── data/<tool-id>-templates.ts        # Template data (if applicable)
└── app/api/chat/<tool-id>/route.ts    # API route (if tool needs AI backend)
```

### 4.2 File Naming Rules

- **Tool ID** = kebab-case, matches the `id` field in `tools.ts` (e.g., `sketch-board`, `resume-cv-v2`)
- **Workspace component** = PascalCase + `Workspace` suffix (e.g., `SketchBoardWorkspace.tsx`)
- **Store** = `<tool-id>-editor.ts` (e.g., `sketch-board-editor.ts`)
- **Manifest** = `<tool-id>.ts` in `src/lib/chiko/manifests/`

---

## 5. Phase 4 — Workspace Wrapper

This is the core integration file. It wraps the open-source component inside DMSuite's workspace shell.

### 5.1 Template: NPM Package Wrapper

```tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
// Dynamic import to prevent SSR issues (most canvas/editor libraries are browser-only)
import dynamic from "next/dynamic";

// ── DMSuite Integration ──
// Theme sync (dark/light mode)
// import { useTheme } from "@/components/ThemeProvider";
// State persistence events
// import { useProjectData } from "@/hooks/useProjectData";

// ── The Open-Source Component ──
// Option A: Dynamic import (preferred for heavy libraries)
// const OriginalComponent = dynamic(
//   () => import("<package>").then((m) => m.ComponentName),
//   { ssr: false, loading: () => <LoadingSkeleton /> }
// );

// Option B: Direct import (for lighter packages)
// import { ComponentName } from "<package>";

export default function <ToolName>Workspace() {
  // 1. Mount the original component at FULL workspace size
  // 2. Pass through ALL original props — don't strip features
  // 3. Only inject DMSuite hooks:
  //    - Theme sync (dark/light)
  //    - State persistence (onChange → save to project)
  //    - Workspace events (dirty flag, milestones)

  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* CSS isolation wrapper — class name used in globals.css */}
      <div className="<tool-id>-wrapper h-full w-full">
        {/* <OriginalComponent
          // Pass original props
          // theme={resolvedTheme === "dark" ? "dark" : "light"}
          // onChange={handleChange}
        /> */}
      </div>
    </div>
  );
}
```

### 5.2 Key Wrapper Responsibilities

| Responsibility | How | Required? |
|---------------|-----|-----------|
| **SSR Prevention** | `dynamic(() => import(...), { ssr: false })` or lazy import in useEffect | YES — most editors crash on server |
| **Theme Sync** | Read `useTheme()` → pass `theme` prop to component | YES |
| **Full Size** | `h-full w-full overflow-hidden` on wrapper div | YES |
| **State Save** | Listen to component's `onChange` → emit `workspace:dirty` event | YES |
| **CSS Isolation** | Wrap in a named div class (e.g., `.sketch-board-wrapper`) | YES if library has its own CSS |
| **Library Loading** | Load bundled assets/libraries on mount | ONLY if applicable |
| **Imperative API** | Capture ref for programmatic control (export, zoom, etc.) | OPTIONAL but recommended |

### 5.3 Anti-Patterns to Avoid

- ❌ **Don't rebuild the UI** — use the original component as-is
- ❌ **Don't strip features** — if it has collaboration, keep it (just hide the button if needed)
- ❌ **Don't wrap in a DMSuite card/panel** — the workspace IS the full content area
- ❌ **Don't add DMSuite-style headers inside** — TopBar is already above the workspace
- ❌ **Don't intercept keyboard shortcuts** — let the original tool handle its own shortcuts

---

## 6. Phase 5 — CSS Isolation

**This is the hardest part.** DMSuite uses Tailwind CSS v4 which applies aggressive resets (preflight) to all elements. Open-source tools expect browser defaults. Without isolation, buttons break, SVGs vanish, inputs lose styling, dialogs collapse.

### 6.1 Import the Library's CSS

In `src/app/globals.css`, add the library's stylesheet. If Turbopack can't resolve the package's CSS export, use a direct filesystem path:

```css
/* ── <Tool Name> CSS ── */
/* Option A: Normal import (try first) */
@import "<package>/dist/style.css";

/* Option B: Direct path (if Option A fails with Turbopack) */
@import "../../../../node_modules/<package>/dist/style.css";
```

### 6.2 CSS Reset Combat (Revert Layer)

Add a scoped reset block that restores browser defaults inside the tool's wrapper:

```css
/* ══════════════════════════════════════════════════════════════
   <Tool Name> — CSS isolation (prevents Tailwind v4 preflight
   from breaking the library's internal UI)
   ══════════════════════════════════════════════════════════════ */

.<tool-id>-wrapper .<library-root-class> *,
.<tool-id>-wrapper .<library-root-class> *::before,
.<tool-id>-wrapper .<library-root-class> *::after {
  border-style: revert-layer;
  border-width: revert-layer;
  border-color: revert-layer;
  box-sizing: revert-layer;
}

/* Buttons */
.<tool-id>-wrapper .<library-root-class> button {
  background-color: revert-layer;
  color: revert-layer;
  cursor: revert-layer;
  padding: revert-layer;
  font: revert-layer;
  appearance: revert-layer;
  line-height: revert-layer;
}

/* SVG icons */
.<tool-id>-wrapper .<library-root-class> svg {
  display: revert-layer;
  vertical-align: revert-layer;
  width: revert-layer;
  height: revert-layer;
  fill: revert-layer;
  stroke: revert-layer;
}

/* Inputs */
.<tool-id>-wrapper .<library-root-class> input,
.<tool-id>-wrapper .<library-root-class> select,
.<tool-id>-wrapper .<library-root-class> textarea {
  appearance: revert-layer;
  background-color: revert-layer;
  border: revert-layer;
  color: revert-layer;
  font: revert-layer;
  padding: revert-layer;
  margin: revert-layer;
}

/* Anchors */
.<tool-id>-wrapper .<library-root-class> a {
  color: revert-layer;
  text-decoration: revert-layer;
}

/* Images */
.<tool-id>-wrapper .<library-root-class> img {
  display: revert-layer;
  max-width: revert-layer;
  height: revert-layer;
}

/* Headings */
.<tool-id>-wrapper .<library-root-class> h1,
.<tool-id>-wrapper .<library-root-class> h2,
.<tool-id>-wrapper .<library-root-class> h3,
.<tool-id>-wrapper .<library-root-class> h4,
.<tool-id>-wrapper .<library-root-class> h5,
.<tool-id>-wrapper .<library-root-class> h6 {
  font-size: revert-layer;
  font-weight: revert-layer;
  margin: revert-layer;
}

/* Lists */
.<tool-id>-wrapper .<library-root-class> ul,
.<tool-id>-wrapper .<library-root-class> ol {
  list-style: revert-layer;
  padding: revert-layer;
  margin: revert-layer;
}

/* Dialogs & Modals */
.<tool-id>-wrapper .<library-root-class> dialog {
  position: revert-layer;
  padding: revert-layer;
  margin: revert-layer;
  inset: revert-layer;
  background: revert-layer;
  border: revert-layer;
}

/* Tables */
.<tool-id>-wrapper .<library-root-class> table {
  border-collapse: revert-layer;
  border-spacing: revert-layer;
}
.<tool-id>-wrapper .<library-root-class> th,
.<tool-id>-wrapper .<library-root-class> td {
  padding: revert-layer;
  text-align: revert-layer;
  border: revert-layer;
}

/* Color pickers & range inputs */
.<tool-id>-wrapper .<library-root-class> input[type="color"],
.<tool-id>-wrapper .<library-root-class> input[type="range"] {
  appearance: revert-layer;
  -webkit-appearance: revert-layer;
  padding: revert-layer;
  border: revert-layer;
  background: revert-layer;
}

/* Checkboxes & Radios */
.<tool-id>-wrapper .<library-root-class> input[type="checkbox"],
.<tool-id>-wrapper .<library-root-class> input[type="radio"] {
  appearance: revert-layer;
  -webkit-appearance: revert-layer;
  width: revert-layer;
  height: revert-layer;
  margin: revert-layer;
}
```

### 6.3 Testing CSS Isolation

After adding isolation CSS, verify:
1. All buttons are visible and clickable
2. Icons (SVGs) render correctly
3. Dropdowns/selects open and display options
4. Color pickers work
5. Modals/dialogs appear properly
6. Text inputs accept input and show cursors
7. Scrolling works in scrollable areas
8. Tooltips/popovers appear

---

## 7. Phase 6 — State Management & Persistence

### 7.1 Strategy Decision

| Scenario | Approach |
|----------|----------|
| Library has built-in persistence (localStorage) | Use as-is. Create a thin adapter that reads/writes the same localStorage key. |
| Library exposes onChange/state API | Create a Zustand store, wire onChange to store updates |
| Library has no persistence | Use the library's imperative API (ref) to snapshot state on save |

### 7.2 Store Adapter (Required)

Every tool needs a `StoreAdapter` registered in `src/lib/store-adapters.ts`:

```typescript
function get<ToolName>Adapter(): StoreAdapter {
  return {
    getSnapshot: () => {
      // Read the tool's current state
      // For localStorage-based tools:
      const data = localStorage.getItem("dmsuite-<tool-id>");
      return data ? JSON.parse(data) : {};
      // For Zustand stores:
      // const { field1, field2 } = use<ToolStore>.getState();
      // return { field1, field2 };
    },
    restoreSnapshot: (data) => {
      // Write state back
      // For localStorage-based tools:
      localStorage.setItem("dmsuite-<tool-id>", JSON.stringify(data));
      // For Zustand stores:
      // use<ToolStore>.getState().restore(data);
    },
    resetStore: () => {
      // Clear all tool state
      localStorage.removeItem("dmsuite-<tool-id>");
      // For Zustand stores:
      // use<ToolStore>.getState().reset();
      // nukePersistStorage("dmsuite-<tool-id>");
    },
    subscribe: (cb) => {
      // For Zustand stores:
      // return use<ToolStore>.subscribe(cb);
      // For localStorage-based: use a custom event or interval
      const handler = () => cb();
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
  };
}
```

Then register it in the `ADAPTER_FACTORIES` map:

```typescript
const ADAPTER_FACTORIES: Record<string, () => StoreAdapter> = {
  // ... existing entries
  "<tool-id>": get<ToolName>Adapter,
};
```

### 7.3 Persistence Keys

- **localStorage key format:** `dmsuite-<tool-id>` (e.g., `dmsuite-sketch-board`)
- **Zustand persist name:** same key
- **Supabase user_data key:** add to `UserDataKey` type in `src/lib/supabase/user-data.ts` if tool has user-level (not project-level) settings

---

## 8. Phase 7 — Platform Integration Points

**Every ported tool must be wired into exactly these files:**

### 8.1 `src/data/tools.ts` — Tool Registry Entry

Add the tool object inside the correct category in `toolCategories`:

```typescript
{
  id: "<tool-id>",
  name: "<Display Name>",
  description: "<One-line description>",
  icon: "<icon-key>",       // From iconMap in icons.tsx
  status: "ready",           // "ready" | "coming-soon" | "beta"
  devStatus: "scaffold",     // "scaffold" → "complete" once verified
  category: "<category-id>",
  tags: ["tag1", "tag2"],
  aiProviders: ["anthropic"], // If uses AI
  outputs: ["pdf", "png"],   // Output formats supported
  supportsPartEdit: false,    // true if Chiko can edit parts
  printReady: false,          // true if produces print-quality output
},
```

### 8.2 `src/app/tools/[categoryId]/[toolId]/page.tsx` — Dynamic Import

Add to the `workspaceComponents` map:

```typescript
const workspaceComponents: Record<string, React.ComponentType> = {
  // ... existing entries
  "<tool-id>": dynamic(() => import("@/components/workspaces/<tool-id>/<ToolName>Workspace")),
};
```

### 8.3 `src/lib/store-adapters.ts` — Store Adapter

(See Phase 6 above)

### 8.4 `src/lib/chiko/manifests/<tool-id>.ts` — Chiko AI Manifest

Create a manifest so Chiko (our AI assistant) can interact with the tool:

```typescript
import type { ChikoManifest, ChikoAction } from "@/lib/chiko/types";

const actions: ChikoAction[] = [
  {
    id: "read_state",
    label: "Read current state",
    description: "Get a snapshot of the current tool state",
    category: "query",
    handler: "read_state",
  },
  // Add tool-specific actions that Chiko can perform
];

export function create<ToolName>Manifest(): ChikoManifest {
  return {
    toolId: "<tool-id>",
    actions,
  };
}
```

Then add the barrel export in `src/lib/chiko/manifests/index.ts`:

```typescript
export { create<ToolName>Manifest } from "./<tool-id>";
```

### 8.5 `src/data/credit-costs.ts` — Credit Mapping

If the tool uses any AI/API credits:

```typescript
// In TOOL_CREDIT_MAP:
"<tool-id>": "<operation-key>",

// In CREDIT_COSTS (if new operation):
"<operation-key>": <cost-in-credits>,
```

### 8.6 `src/middleware.ts` — Static Asset Exclusions

If the tool serves static files from `/public/` (libraries, templates, etc.), add them to the middleware matcher exclusion:

```typescript
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|...|<new-folder>/).*)",
  ],
};
```

### 8.7 `next.config.ts` — Build Configuration

If needed:
```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp", "<package-with-node-deps>"],
  transpilePackages: ["<package-needing-transpile>"],
};
```

---

## 9. Phase 8 — Supabase / Backend Setup

### 9.1 Determine What's Needed

Review the original project's backend requirements:

| Original Feature | DMSuite Replacement |
|------------------|---------------------|
| User auth (OAuth, email/password) | Already handled — Supabase auth via our middleware |
| PostgreSQL database | Supabase — create migration in `supabase/migrations/` |
| File storage (S3, etc.) | Supabase Storage buckets |
| Redis/cache | Not needed — use localStorage/IndexedDB |
| Email sending | Supabase Edge Functions or skip |
| Payment/subscription | Replace with our credit system |
| Real-time/WebSocket | Supabase Realtime |

### 9.2 Create Supabase Migration (if needed)

File: `supabase/migrations/NNN_<tool_id>.sql`

```sql
-- =============================================
-- DMSuite: <Tool Name> tables
-- =============================================

CREATE TABLE IF NOT EXISTS <tool_id>_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Add tool-specific columns
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Row-Level Security
ALTER TABLE <tool_id>_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<tool_id>_select_own"
  ON <tool_id>_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "<tool_id>_insert_own"
  ON <tool_id>_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "<tool_id>_update_own"
  ON <tool_id>_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "<tool_id>_delete_own"
  ON <tool_id>_data FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE TRIGGER set_updated_at_<tool_id>
  BEFORE UPDATE ON <tool_id>_data
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

### 9.3 Apply Migration

```bash
# Via Supabase MCP or CLI:
# Apply the migration to the database
```

### 9.4 Create API Route (if tool needs server-side logic)

File: `src/app/api/<tool-id>/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits } from "@/lib/supabase/credits";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Credit check (if operation costs credits)
  const hasCredits = await checkCredits(user.id, "<operation-key>");
  if (!hasCredits) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // ... tool logic ...

  await deductCredits(user.id, cost, "<operation-key>", "Description");
  return NextResponse.json({ result });
}
```

---

## 10. Phase 9 — Branding & Link Cleanup

**This phase makes the tool appear as a native DMSuite tool.** Only run this AFTER everything is fully working.

### 10.1 CSS-Based Link Hiding

Add to `globals.css` inside the tool's isolation section:

```css
/* ── Hide external platform links ── */
.<tool-id>-wrapper a[href*="github.com/<original-org>"],
.<tool-id>-wrapper a[href*="<original-domain>.com"],
.<tool-id>-wrapper a[href*="<original-domain>.io"],
.<tool-id>-wrapper a[href*="discord.gg"],
.<tool-id>-wrapper a[href*="twitter.com/<original-handle>"],
.<tool-id>-wrapper a[href*="x.com/<original-handle>"] {
  display: none !important;
}

/* Hide "Powered by X" or branding footers */
.<tool-id>-wrapper [class*="brand"],
.<tool-id>-wrapper [class*="footer-link"],
.<tool-id>-wrapper [data-testid="branding"] {
  display: none !important;
}
```

### 10.2 Component-Level Overrides

If the library accepts props for customization:

```tsx
<OriginalComponent
  // Override branding props
  appName="DMSuite"
  logoUrl="/chiko/chiko-icon.png"  // Our mascot
  helpUrl="/dashboard"
  feedbackUrl={undefined}          // Suppress feedback links
  // Remove social/share features pointing externally
  shareEnabled={false}
/>
```

If the library uses custom menu components (like Excalidraw's MainMenu):

```tsx
import { MainMenu } from "<package>";

// Render custom menu WITHOUT external links
<MainMenu>
  <MainMenu.DefaultItems.SaveAsImage />
  <MainMenu.DefaultItems.Export />
  {/* OMIT: MainMenu.DefaultItems.Socials */}
  {/* OMIT: MainMenu.DefaultItems.LiveCollaboration */}
</MainMenu>
```

### 10.3 What to Remove vs. Keep

| REMOVE | KEEP |
|--------|------|
| GitHub repo links | All functional features |
| "Star us on GitHub" banners | Settings/preferences UI |
| Social media links to the original project | Keyboard shortcuts |
| "Powered by X" footers | Export/import functionality |
| Bug report links to their GitHub issues | Undo/redo |
| External documentation links | Theme switching capability |
| Collaboration invite links (to their servers) | Accessibility features |
| Analytics/telemetry (if sending to their servers) | Localization/i18n |
| Update/changelog notifications | All toolbar/panel features |

### 10.4 Telemetry & Analytics Removal

Many open-source tools have telemetry. Disable it:

```tsx
<OriginalComponent
  // Common telemetry disable props
  telemetry={false}
  analytics={false}
  trackEvents={false}
/>
```

Or via environment variables (check the project's docs):
```env
NEXT_PUBLIC_DISABLE_TELEMETRY=true
```

Or in CSS (hide opt-in banners):
```css
.<tool-id>-wrapper [class*="telemetry"],
.<tool-id>-wrapper [class*="analytics-consent"] {
  display: none !important;
}
```

---

## 11. Phase 10 — Verification & QA

### 11.1 TypeScript Check

```bash
npx tsc --noEmit 2>&1 | Select-String "<tool-id>" | Select-Object -First 30
```

**Target: 0 errors** in tool-related files. Pre-existing errors in other files are acceptable.

### 11.2 Build Check

```bash
$env:NODE_ENV='production'; npx next build 2>&1 | Select-Object -Last 40
```

Build must pass. Watch for:
- Dynamic import failures
- CSS import resolution errors
- Bundle size warnings (acceptable for large libraries)

### 11.3 Feature Parity Verification

Open both the original tool (standalone) and the DMSuite version side-by-side. Verify:

- [ ] All menus/toolbars present and functional
- [ ] All keyboard shortcuts work
- [ ] Create, edit, delete operations work
- [ ] Export/download works (PDF, PNG, SVG, etc.)
- [ ] Import/load works
- [ ] Undo/redo works
- [ ] Theme switching works (dark ↔ light)
- [ ] Responsiveness (resize window)
- [ ] No console errors
- [ ] No external network requests to original project's servers
- [ ] State persists across page refreshes
- [ ] State saves to project (via store adapter)

### 11.4 Branding Check

- [ ] No visible references to original project name
- [ ] No clickable links to original repo/website
- [ ] No "Powered by" or "Built with" labels
- [ ] No social media links to the original project
- [ ] No analytics/telemetry being sent externally

---

## 12. Phase 11 — Tracker Updates

### 12.1 Update `TOOL-STATUS.md`

Move the tool to the appropriate section:

If fully verified:
```markdown
### <Tool Name>

| # | Tool ID | Tool Name | Workspace | Notes |
|---|---------|-----------|-----------|-------|
| N | `<tool-id>` | <Display Name> | <Workspace Component> | Ported from <Original Name>, <key features>, X templates, print-ready |
```

### 12.2 Add Change Log Entry

```markdown
| YYYY-MM-DD | <tool-id> (<Display Name>) | Ported from <Original> — <summary> | Drake |
```

### 12.3 Update `devStatus` in `tools.ts`

```typescript
devStatus: "complete",  // Changed from "scaffold"
```

### 12.4 Update Counters

Update the header counts in TOOL-STATUS.md:
- **Tools with workspace UI:** increment
- **Tools fully complete:** increment (if verified)

---

## 13. Integration Patterns Reference

### Quick Reference: All Files That Need Changes

| # | File | Change |
|---|------|--------|
| 1 | `src/data/tools.ts` | Add tool entry to category |
| 2 | `src/app/tools/[categoryId]/[toolId]/page.tsx` | Add dynamic import |
| 3 | `src/lib/store-adapters.ts` | Add store adapter + factory entry |
| 4 | `src/components/workspaces/<tool-id>/` | Create workspace component(s) |
| 5 | `src/app/globals.css` | Add CSS import + isolation rules |
| 6 | `src/lib/chiko/manifests/<tool-id>.ts` | Create Chiko manifest |
| 7 | `src/lib/chiko/manifests/index.ts` | Add barrel export |
| 8 | `src/data/credit-costs.ts` | Add credit mapping (if AI-powered) |
| 9 | `TOOL-STATUS.md` | Add tracker entry + changelog |
| 10 | `supabase/migrations/NNN_*.sql` | Create tables (if needed) |
| 11 | `src/app/api/<tool-id>/route.ts` | Create API route (if needed) |
| 12 | `src/middleware.ts` | Exclude static assets (if needed) |
| 13 | `next.config.ts` | Package config (if needed) |
| 14 | `package.json` | New dependencies |

### Workspace Checklist

```
[ ] Workspace component created at src/components/workspaces/<tool-id>/
[ ] Dynamic import added to page.tsx
[ ] Tool entry added to tools.ts
[ ] Store adapter registered in store-adapters.ts
[ ] CSS imported and isolation rules added to globals.css
[ ] Chiko manifest created and exported
[ ] Credit costs mapped (if applicable)
[ ] Middleware updated (if static assets)
[ ] Supabase migration created (if backend needed)
[ ] TOOL-STATUS.md updated
[ ] 0 TypeScript errors
[ ] Build passes
[ ] All features verified
[ ] Branding cleaned up
```

---

## 14. Approved Reference: Sketch Board (Excalidraw)

The **Sketch Board** is the gold-standard example of a correctly ported tool. Every future port must follow this exact pattern.

| Aspect | Detail |
|--------|--------|
| **Original Project** | Excalidraw (36K★, MIT license) |
| **npm Package** | `@excalidraw/excalidraw` |
| **Strategy** | NPM Package Wrapper — original UI completely untouched |
| **Workspace Wrapper** | ~400 lines — thin shell that mounts the original component |
| **CSS Isolation** | ~170 lines `revert-layer` rules in globals.css |
| **Asset Bundling** | 1,006 library items bundled to `/public/libraries/excalidraw/` |
| **Branding Cleanup** | CSS hides GitHub/Discord/Twitter links + custom MainMenu omits Socials/LiveCollaboration |
| **State Persistence** | localStorage + Supabase user_data (per-user library sync) |
| **Theme Sync** | `useTheme()` → Excalidraw `theme` prop |

### The Porting Flow (Follow Exactly)

```
1. npm install @excalidraw/excalidraw --legacy-peer-deps
↓
2. Create SketchBoardWorkspace.tsx (dynamic import, theme sync, onChange)
↓
3. Add CSS import + 170 lines revert-layer isolation in globals.css
↓
4. Hide external links via CSS selectors
↓
5. Override MainMenu to remove Socials/LiveCollaboration
↓
6. Wire into page.tsx, tools.ts, store-adapters.ts
↓
Bundle library assets to /public/libraries/
↓
TypeScript check → Build → Feature verify → Branding verify
```

---

## Appendix A: Troubleshooting

### CSS Not Loading
- Try direct `node_modules` path import (bypasses export maps)
- Check for `@layer` conflicts with Tailwind v4
- Use browser DevTools to inspect which styles are winning

### SSR Crash
- Wrap with `dynamic(() => import(...), { ssr: false })`
- Check for `window`, `document`, `navigator` references
- Add to `next.config.ts`: `serverExternalPackages`

### React Version Conflict
- Use `--legacy-peer-deps` when installing
- If severe, check if the library has a React 19 compatible version

### TypeScript Errors
- Create local `.d.ts` declaration file for missing types
- Use `// @ts-expect-error` sparingly for known-safe mismatches
- Check `tsconfig.json` paths and module resolution

### Bundle Too Large
- Library-specific: use tree-shaking (`import { specific } from "pkg"`)
- Use `next/dynamic` with `loading` component
- Move heavy assets to `/public/` and load at runtime

### Turbopack Issues
- Some packages don't work with Turbopack — try `next dev --no-turbopack` to isolate
- CSS conditional exports may not resolve — use direct filesystem paths

---

## Appendix B: License Compatibility Quick Reference

| License | Can We Port? | Notes |
|---------|-------------|-------|
| MIT | ✅ YES | Most permissive. Must keep copyright notice. |
| Apache 2.0 | ✅ YES | Must keep NOTICE file. Must state changes. |
| BSD 2/3 | ✅ YES | Must keep copyright. BSD-3 has no-endorsement clause. |
| ISC | ✅ YES | Equivalent to MIT. |
| MPL-2.0 | ⚠️ CAREFUL | Modified files must stay MPL. New files can be proprietary. |
| LGPL | ⚠️ CAREFUL | Library must be dynamically linked (npm package is fine). |
| GPL-2.0/3.0 | ❌ NO | Would force our entire codebase to be GPL. |
| AGPL-3.0 | ❌ NO | Same as GPL + network use clause. Absolutely not. |
| No License | ❌ NO | Default copyright — no permission to use. |

**Always keep a copy of the original LICENSE file** in a comment at the top of the workspace component:

```typescript
// Originally based on <Project Name> — <License>
// Copyright (c) <Year> <Author>
// See: https://github.com/<org>/<repo>/blob/main/LICENSE
```

---

*Last updated: 2026-04-04*
*Guide version: 1.0*
