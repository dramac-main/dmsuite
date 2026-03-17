// =============================================================================
// DMSuite — Premium Icon Theme System
// Universal icon component with 4 variants (stroke, solid, duotone, soft),
// 6 size presets, and a comprehensive 150+ icon registry.
// =============================================================================

"use client";

import { type SVGProps, type ReactNode, createContext, useContext, useMemo } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PremiumIconVariant = "stroke" | "solid" | "duotone" | "soft";
export type PremiumIconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_MAP: Record<PremiumIconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 48,
};

export interface PremiumIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  name: string;
  size?: PremiumIconSize;
  variant?: PremiumIconVariant;
  color?: string;
  animated?: boolean;
}

// ---------------------------------------------------------------------------
// Theme Context
// ---------------------------------------------------------------------------

interface PremiumIconTheme {
  defaultVariant: PremiumIconVariant;
  defaultSize: PremiumIconSize;
}

const PremiumIconThemeContext = createContext<PremiumIconTheme>({
  defaultVariant: "stroke",
  defaultSize: "md",
});

export function PremiumIconThemeProvider({
  variant = "stroke",
  size = "md",
  children,
}: {
  variant?: PremiumIconVariant;
  size?: PremiumIconSize;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ defaultVariant: variant, defaultSize: size }), [variant, size]);
  return (
    <PremiumIconThemeContext.Provider value={value}>
      {children}
    </PremiumIconThemeContext.Provider>
  );
}

export function usePremiumIconTheme() {
  return useContext(PremiumIconThemeContext);
}

// ---------------------------------------------------------------------------
// Icon Path Definitions
// Each icon defines stroke paths. Solid/duotone/soft are derived variants.
// ---------------------------------------------------------------------------

interface IconDef {
  /** Primary paths (full opacity in all variants) */
  paths: string[];
  /** Secondary paths (reduced opacity in duotone, hidden in stroke/solid) */
  secondaryPaths?: string[];
  /** Optional fill-based paths for the solid variant */
  solidPaths?: string[];
}

// ── Navigation & UI ─────────────────────────────────────────
const ICON_DEFS: Record<string, IconDef> = {
  // Navigation & UI
  "arrow-left": { paths: ["M19 12H5", "M12 19l-7-7 7-7"] },
  "arrow-right": { paths: ["M5 12h14", "M12 5l7 7-7 7"] },
  "arrow-up": { paths: ["M12 19V5", "M5 12l7-7 7 7"] },
  "arrow-down": { paths: ["M12 5v14", "M19 12l-7 7-7-7"] },
  "chevron-left": { paths: ["M15 18l-6-6 6-6"] },
  "chevron-right": { paths: ["M9 18l6-6-6-6"] },
  "chevron-down": { paths: ["M6 9l6 6 6-6"] },
  "chevron-up": { paths: ["M18 15l-6-6-6 6"] },
  "menu": { paths: ["M3 12h18", "M3 6h18", "M3 18h18"] },
  "close": { paths: ["M18 6L6 18", "M6 6l12 12"] },
  "search": { paths: ["M21 21l-4.35-4.35"], secondaryPaths: ["M11 19a8 8 0 100-16 8 8 0 000 16z"] },
  "filter": { paths: ["M22 3H2l8 9.46V19l4 2v-8.54L22 3"] },
  "sort": { paths: ["M3 6h18", "M6 12h12", "M9 18h6"] },
  "expand": { paths: ["M15 3h6v6", "M9 21H3v-6", "M21 3l-7 7", "M3 21l7-7"] },
  "collapse": { paths: ["M4 14h6v6", "M20 10h-6V4", "M14 10l7-7", "M3 21l7-7"] },
  "drag-handle": { paths: ["M9 4v1", "M9 8v1", "M9 12v1", "M9 16v1", "M9 20v1", "M15 4v1", "M15 8v1", "M15 12v1", "M15 16v1", "M15 20v1"] },
  "external-link": { paths: ["M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6", "M15 3h6v6", "M10 14L21 3"] },
  "home": { paths: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"], secondaryPaths: ["M9 22V12h6v10"] },
  "back": { paths: ["M19 12H5", "M12 19l-7-7 7-7"] },

  // Actions
  "plus": { paths: ["M12 5v14", "M5 12h14"] },
  "minus": { paths: ["M5 12h14"] },
  "edit": { paths: ["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"], secondaryPaths: ["M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"] },
  "delete": { paths: ["M3 6h18", "M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"], secondaryPaths: ["M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"] },
  "save": { paths: ["M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"], secondaryPaths: ["M17 21v-8H7v8", "M7 3v5h8"] },
  "copy": { paths: ["M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z"], secondaryPaths: ["M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"] },
  "paste": { paths: ["M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"], secondaryPaths: ["M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z"] },
  "cut": { paths: ["M6 9a3 3 0 100-6 3 3 0 000 6z", "M6 21a3 3 0 100-6 3 3 0 000 6z", "M20 4L8.12 15.88", "M14.47 14.48L20 20", "M8.12 8.12L12 12"] },
  "undo": { paths: ["M3 7v6h6", "M21 17a9 9 0 00-9-9 9 9 0 00-6.69 2.97L3 13"] },
  "redo": { paths: ["M21 7v6h-6", "M3 17a9 9 0 019-9 9 9 0 016.69 2.97L21 13"] },
  "refresh": { paths: ["M23 4v6h-6", "M1 20v-6h6"], secondaryPaths: ["M3.51 9a9 9 0 0114.85-3.36L23 10", "M20.49 15a9 9 0 01-14.85 3.36L1 14"] },
  "download": { paths: ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"] },
  "upload": { paths: ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"] },
  "send": { paths: ["M22 2L11 13", "M22 2l-7 20-4-9-9-4 20-7z"] },
  "share": { paths: ["M18 8a3 3 0 100-6 3 3 0 000 6z", "M6 15a3 3 0 100-6 3 3 0 000 6z", "M18 22a3 3 0 100-6 3 3 0 000 6z", "M8.59 13.51l6.83 3.98", "M15.41 6.51l-6.82 3.98"] },
  "print": { paths: ["M6 9V2h12v7", "M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"], secondaryPaths: ["M6 14h12v8H6z"] },
  "export": { paths: ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"] },

  // Status & Feedback
  "check": { paths: ["M20 6L9 17l-5-5"] },
  "check-circle": { paths: ["M9 12l2 2 4-4"], secondaryPaths: ["M22 12a10 10 0 11-20 0 10 10 0 0120 0z"] },
  "x-circle": { paths: ["M15 9l-6 6", "M9 9l6 6"], secondaryPaths: ["M22 12a10 10 0 11-20 0 10 10 0 0120 0z"] },
  "alert-triangle": { paths: ["M12 9v4", "M12 17h.01"], secondaryPaths: ["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"] },
  "alert-circle": { paths: ["M12 8v4", "M12 16h.01"], secondaryPaths: ["M22 12a10 10 0 11-20 0 10 10 0 0120 0z"] },
  "info-circle": { paths: ["M12 16v-4", "M12 8h.01"], secondaryPaths: ["M22 12a10 10 0 11-20 0 10 10 0 0120 0z"] },
  "loading": { paths: ["M12 2v4", "M12 18v4", "M4.93 4.93l2.83 2.83", "M16.24 16.24l2.83 2.83", "M2 12h4", "M18 12h4", "M4.93 19.07l2.83-2.83", "M16.24 7.76l2.83-2.83"] },
  "clock": { paths: ["M12 6v6l4 2"], secondaryPaths: ["M22 12a10 10 0 11-20 0 10 10 0 0120 0z"] },
  "hourglass": { paths: ["M5 22h14", "M5 2h14", "M17 22v-3.87a3.37 3.37 0 00-.94-2.61c-1.14-1.26-2.79-1.52-4.06-1.52s-2.92.26-4.06 1.52A3.37 3.37 0 007 18.13V22", "M7 2v3.87c0 .97.36 1.9.94 2.61 1.14 1.26 2.79 1.52 4.06 1.52s2.92-.26 4.06-1.52A3.37 3.37 0 0017 5.87V2"] },
  "ban": { paths: ["M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"] },
  "shield-check": { paths: ["M9 12l2 2 4-4"], secondaryPaths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"] },

  // Content & Documents
  "file": { paths: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6"] },
  "file-text": { paths: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6", "M16 13H8", "M16 17H8", "M10 9H8"] },
  "file-pdf": { paths: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6"], secondaryPaths: ["M10 12v5", "M10 14h1.5a1.5 1.5 0 000-3H10"] },
  "file-image": { paths: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6"], secondaryPaths: ["M8 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "M20 18l-3.5-5L12 18"] },
  "folder": { paths: ["M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"] },
  "folder-open": { paths: ["M4 20h16a2 2 0 002-2l-2-8H4l-2 8a2 2 0 002 2z"], secondaryPaths: ["M4 10V5a2 2 0 012-2h4l2 3h6a2 2 0 012 2v2"] },
  "clipboard": { paths: ["M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"], secondaryPaths: ["M9 2h6a1 1 0 011 1v2a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z"] },
  "document": { paths: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6"] },
  "page": { paths: ["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "M14 2v6h6"] },
  "notebook": { paths: ["M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z", "M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"] },
  "book": { paths: ["M4 19.5A2.5 2.5 0 016.5 17H20", "M4 19.5V5a2 2 0 012-2h14v14H6.5a2.5 2.5 0 00-2.5 2.5z"] },
  "bookmark": { paths: ["M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"] },
  "newspaper": { paths: ["M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2", "M18 14h-8", "M15 18h-5", "M10 6h8v4h-8z"] },
  "receipt": { paths: ["M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z", "M16 8H8", "M16 12H8", "M12 16H8"] },
  "invoice": { paths: ["M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z", "M16 8H8", "M12 12H8", "M16 16H8"] },

  // Communication
  "mail": { paths: ["M22 7l-10 7L2 7"], secondaryPaths: ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"] },
  "inbox": { paths: ["M22 12h-6l-2 3H10l-2-3H2"], secondaryPaths: ["M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"] },
  "message": { paths: ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"] },
  "chat": { paths: ["M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"] },
  "phone": { paths: ["M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"] },
  "video-call": { paths: ["M23 7l-7 5 7 5V7z"], secondaryPaths: ["M14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z"] },
  "at-sign": { paths: ["M16 12a4 4 0 11-8 0 4 4 0 018 0z", "M16 12v1.5a2.5 2.5 0 005 0V12a10 10 0 10-4 8"] },
  "link": { paths: ["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"] },
  "globe": { paths: ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M2 12h20", "M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"] },

  // People & Identity
  "user": { paths: ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"], secondaryPaths: ["M12 11a4 4 0 100-8 4 4 0 000 8z"] },
  "user-plus": { paths: ["M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M20 8v6", "M23 11h-6"], secondaryPaths: ["M8.5 11a4 4 0 100-8 4 4 0 000 8z"] },
  "user-check": { paths: ["M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M17 11l2 2 4-4"], secondaryPaths: ["M8.5 11a4 4 0 100-8 4 4 0 000 8z"] },
  "users": { paths: ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"], secondaryPaths: ["M9 11a4 4 0 100-8 4 4 0 000 8z", "M23 21v-2a4 4 0 00-3-3.87", "M16 3.13a4 4 0 010 7.75"] },
  "team": { paths: ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"], secondaryPaths: ["M9 11a4 4 0 100-8 4 4 0 000 8z", "M23 21v-2a4 4 0 00-3-3.87", "M16 3.13a4 4 0 010 7.75"] },
  "badge": { paths: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"] },
  "id-card": { paths: ["M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z", "M8 12a2 2 0 100-4 2 2 0 000 4z", "M6 16c0-1.1.9-2 2-2h0c1.1 0 2 .9 2 2", "M14 9h4", "M14 13h3"] },
  "handshake": { paths: ["M11 17l-1.5 1.5a2.12 2.12 0 01-3 0l-1-1a2.12 2.12 0 010-3L11 9", "M13 7l1.5-1.5a2.12 2.12 0 013 0l1 1a2.12 2.12 0 010 3L13 15", "M2 9l4-4", "M22 15l-4 4"] },

  // Business & Career
  "briefcase": { paths: ["M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z", "M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"] },
  "building": { paths: ["M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z", "M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2", "M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2", "M10 6h4", "M10 10h4", "M10 14h4", "M10 18h4"] },
  "company": { paths: ["M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18z", "M10 6h4", "M10 10h4", "M10 14h4", "M10 18h4"] },
  "graduation-cap": { paths: ["M22 10l-10-6L2 10l10 6 10-6z", "M6 12v5c0 2 3 4 6 4s6-2 6-4v-5"], secondaryPaths: ["M22 10v6"] },
  "certificate": { paths: ["M4 3h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z", "M8 21l4-2 4 2v-5H8z", "M8 9h8", "M8 13h4"] },
  "award": { paths: ["M12 15l-3.09 1.636.59-3.448L7 10.828l3.455-.504L12 7.2l1.545 3.125 3.455.503-2.5 2.36.59 3.447z"], secondaryPaths: ["M12 15v7", "M8.21 13.89L7 23l5-3 5 3-1.21-9.12"] },
  "trophy": { paths: ["M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2", "M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2"], secondaryPaths: ["M6 3h12v6a6 6 0 11-12 0V3z", "M9 21h6", "M12 15v6"] },
  "target": { paths: ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M12 18a6 6 0 100-12 6 6 0 000 12z", "M12 14a2 2 0 100-4 2 2 0 000 4z"] },
  "chart-up": { paths: ["M23 6l-9.5 9.5-5-5L1 18"], secondaryPaths: ["M17 6h6v6"] },
  "chart-bar": { paths: ["M12 20V10", "M18 20V4", "M6 20v-4"] },
  "pie-chart": { paths: ["M21.21 15.89A10 10 0 118 2.83", "M22 12A10 10 0 0012 2v10z"] },
  "presentation": { paths: ["M2 3h20", "M10 21l2-2 2 2"], secondaryPaths: ["M4 3v12a2 2 0 002 2h12a2 2 0 002-2V3"] },
  "strategy": { paths: ["M2 3h6v6H2z", "M16 3h6v6h-6z", "M5 9v6", "M19 9v6", "M2 15h6v6H2z", "M16 15h6v6h-6z", "M8 6h8", "M8 18h8"] },
  "lightbulb": { paths: ["M9 18h6", "M10 22h4"], secondaryPaths: ["M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"] },
  "rocket": { paths: ["M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"], secondaryPaths: ["M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z", "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0", "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"] },
  "milestone": { paths: ["M12 2v20", "M18 5H8.5c-.83 0-1.5.67-1.5 1.5S7.67 8 8.5 8H18l-2 3 2 3H8.5"] },

  // Creative & Design
  "palette": { paths: ["M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a2 2 0 002-2v-.09a1.65 1.65 0 013 0v.09a2 2 0 002 2c5.51 0 10-4.49 10-10S17.51 2 12 2z"], secondaryPaths: ["M8 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "M12 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "M16 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"] },
  "pen-tool": { paths: ["M12 19l7-7 3 3-7 7-3-3z", "M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z", "M2 2l7.586 7.586", "M11 11a2 2 0 11-4 0 2 2 0 014 0z"] },
  "brush": { paths: ["M9.06 11.9c.94-1.54 2.03-3.08 2.34-3.44a10.05 10.05 0 014.37-3.22c1.7-.54 3.6-.26 4.59.72.98.98 1.26 2.89.72 4.59a10.05 10.05 0 01-3.22 4.37c-.36.31-1.9 1.4-3.44 2.34"], secondaryPaths: ["M9.06 11.9L3 21l9.1-6.06"] },
  "color-swatch": { paths: ["M12 2a10 10 0 100 20 10 10 0 000-20z", "M12 2v20", "M2 12h20"] },
  "layers": { paths: ["M12 2l10 6-10 6L2 8l10-6z"], secondaryPaths: ["M2 12l10 6 10-6", "M2 17l10 6 10-6"] },
  "grid": { paths: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M14 14h7v7h-7z", "M3 14h7v7H3z"] },
  "layout": { paths: ["M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z", "M3 9h18", "M9 21V9"] },
  "frame": { paths: ["M5 3h14", "M5 21h14", "M3 5v14", "M21 5v14"] },
  "crop": { paths: ["M6.13 1L6 16a2 2 0 002 2h15", "M1 6.13L16 6a2 2 0 012 2v15"] },
  "wand": { paths: ["M15 4V2", "M15 16v-2", "M8 9h2", "M20 9h2", "M17.8 11.8l1.4 1.4", "M11.4 5.4l1.4 1.4", "M17.8 6.2l1.4-1.4"], secondaryPaths: ["M9.5 14.5l-7 7"] },
  "sparkles": { paths: ["M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"], secondaryPaths: ["M5 3l.8 2.4L8 6l-2.2.8L5 9l-.8-2.2L2 6l2.2-.8z"] },
  "eye": { paths: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"], secondaryPaths: ["M12 15a3 3 0 100-6 3 3 0 000 6z"] },
  "eye-off": { paths: ["M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24", "M1 1l22 22"] },
  "eyedropper": { paths: ["M2 22l1-1h3l9-9", "M21.5 6.5a2.121 2.121 0 010-3l-.5-.5a2.121 2.121 0 00-3 0L15 6l3 3 3-3.5z", "M15 6l3 3"] },
  "ruler": { paths: ["M1.39 11.09l10.32-10.32a2 2 0 012.83 0l8.29 8.29a2 2 0 010 2.83L12.51 22.21a2 2 0 01-2.83 0l-8.29-8.29a2 2 0 010-2.83z", "M7.5 7.5l3 3", "M10.5 4.5l3 3", "M13.5 7.5l3 3", "M16.5 10.5l3 3"] },
  "shapes": { paths: ["M12 2L2 19.5h20L12 2z"], secondaryPaths: ["M12 22a5 5 0 100-10 5 5 0 000 10z"] },
  "image": { paths: ["M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z", "M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "M21 15l-5-5L5 21"] },

  // Technology
  "code": { paths: ["M16 18l6-6-6-6", "M8 6l-6 6 6 6"] },
  "terminal": { paths: ["M4 17l6-6-6-6", "M12 19h8"] },
  "database": { paths: ["M12 2c5.52 0 10 1.79 10 4s-4.48 4-10 4S2 8.21 2 6s4.48-4 10-4z", "M2 6v6c0 2.21 4.48 4 10 4s10-1.79 10-4V6", "M2 12v6c0 2.21 4.48 4 10 4s10-1.79 10-4v-6"] },
  "server": { paths: ["M2 4h20v6H2z", "M2 14h20v6H2z", "M6 8h.01", "M6 18h.01"] },
  "cloud": { paths: ["M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"] },
  "cpu": { paths: ["M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z", "M9 9h6v6H9z", "M9 1v3", "M15 1v3", "M9 20v3", "M15 20v3", "M20 9h3", "M20 14h3", "M1 9h3", "M1 14h3"] },
  "smartphone": { paths: ["M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z", "M12 18h.01"] },
  "monitor": { paths: ["M4 3h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z", "M8 21h8", "M12 17v4"] },
  "lock": { paths: ["M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"], secondaryPaths: ["M7 11V7a5 5 0 0110 0v4"] },
  "key": { paths: ["M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"] },
  "api": { paths: ["M10 20H4a2 2 0 01-2-2V6a2 2 0 012-2h6", "M14 4h6a2 2 0 012 2v12a2 2 0 01-2 2h-6", "M15 12h.01", "M9 12h.01", "M12 9v6"] },
  "git-branch": { paths: ["M6 3v12", "M18 9a3 3 0 100-6 3 3 0 000 6z", "M6 21a3 3 0 100-6 3 3 0 000 6z", "M18 9a9 9 0 01-9 9"] },

  // Finance
  "dollar": { paths: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"] },
  "credit-card": { paths: ["M3 5h18a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z", "M1 10h22"] },
  "wallet": { paths: ["M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z", "M16 14h.01"], secondaryPaths: ["M4 7V5a2 2 0 012-2h10a2 2 0 012 2v2"] },
  "bank": { paths: ["M3 21h18", "M3 10h18", "M5 6l7-3 7 3", "M4 10v11", "M20 10v11", "M8 14v3", "M12 14v3", "M16 14v3"] },
  "calculator": { paths: ["M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z", "M6 6h12v4H6z", "M8 14h.01", "M12 14h.01", "M16 14h.01", "M8 18h.01", "M12 18h.01", "M16 18h.01"] },
  "percentage": { paths: ["M19 5L5 19", "M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5z", "M17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"] },
  "coins": { paths: ["M12 6a6 6 0 100 12 6 6 0 000-12z"], secondaryPaths: ["M15.2 3.8a6 6 0 110 12.4"] },

  // Time & Calendar
  "calendar": { paths: ["M4 5h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z", "M16 3v4", "M8 3v4", "M2 11h20"] },
  "alarm": { paths: ["M12 6v6l4 2"], secondaryPaths: ["M12 20a8 8 0 100-16 8 8 0 000 16z", "M5 3L2 6", "M22 6l-3-3"] },
  "timer": { paths: ["M12 6v6l4 2"], secondaryPaths: ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M10 2h4"] },
  "schedule": { paths: ["M4 5h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z", "M16 3v4", "M8 3v4", "M2 11h20", "M9 16l2 2 4-4"] },

  // Media
  "play": { paths: ["M5 3l14 9-14 9V3z"] },
  "pause": { paths: ["M6 4h4v16H6z", "M14 4h4v16h-4z"] },
  "stop": { paths: ["M6 4h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2z"] },
  "volume": { paths: ["M11 5L6 9H2v6h4l5 4V5z"], secondaryPaths: ["M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"] },
  "music": { paths: ["M9 18V5l12-2v13"], secondaryPaths: ["M9 18a3 3 0 11-6 0 3 3 0 016 0z", "M21 16a3 3 0 11-6 0 3 3 0 016 0z"] },
  "headphones": { paths: ["M3 18v-6a9 9 0 0118 0v6"], secondaryPaths: ["M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"] },
  "mic": { paths: ["M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z", "M19 10v2a7 7 0 01-14 0v-2", "M12 19v4", "M8 23h8"] },
  "camera": { paths: ["M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"], secondaryPaths: ["M12 17a4 4 0 100-8 4 4 0 000 8z"] },

  // Maps & Location
  "map-pin": { paths: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"], secondaryPaths: ["M12 13a3 3 0 100-6 3 3 0 000 6z"] },
  "compass": { paths: ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"] },
  "location": { paths: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"], secondaryPaths: ["M12 13a3 3 0 100-6 3 3 0 000 6z"] },
  "flag": { paths: ["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z", "M4 22V15"] },
  "navigate": { paths: ["M3 11l19-9-9 19-2-8-8-2z"] },

  // Nature & Misc
  "star": { paths: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"] },
  "heart": { paths: ["M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"] },
  "sun": { paths: ["M12 17a5 5 0 100-10 5 5 0 000 10z", "M12 1v2", "M12 21v2", "M4.22 4.22l1.42 1.42", "M18.36 18.36l1.42 1.42", "M1 12h2", "M21 12h2", "M4.22 19.78l1.42-1.42", "M18.36 5.64l1.42-1.42"] },
  "moon": { paths: ["M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"] },
  "fire": { paths: ["M12 22c4.97 0 9-2.69 9-6 0-4-5-4-5-8 0-2 1-4 1-4s-5 2-5 6c-2 0-4-1-4-1s0 3 0 5c0 2.69 1.03 8 4 8z"] },
  "leaf": { paths: ["M11 20A7 7 0 009.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 1 8-1 3.5-3 5.5-5.5 7.5", "M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"] },
  "diamond": { paths: ["M2.7 10.3a2.41 2.41 0 000 3.41l7.59 7.59a2.41 2.41 0 003.41 0l7.59-7.59a2.41 2.41 0 000-3.41L13.7 2.71a2.41 2.41 0 00-3.41 0z"] },
  "crown": { paths: ["M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"], secondaryPaths: ["M2 17h20v2H2z"] },
  "gem": { paths: ["M6 3h12l4 6-10 13L2 9z", "M12 22L2 9h20L12 22z", "M12 2v7"] },
  "tag": { paths: ["M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z", "M7 7h.01"] },
  "hashtag": { paths: ["M4 9h16", "M4 15h16", "M10 3l-2 18", "M16 3l-2 18"] },
  "lightning": { paths: ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"] },
  "shrink": { paths: ["M4 14h6v6", "M20 10h-6V4", "M14 10l7-7", "M3 21l7-7"] },
  "move": { paths: ["M5 9l-3 3 3 3", "M9 5l3-3 3 3", "M15 19l-3 3-3-3", "M19 9l3 3-3 3", "M2 12h20", "M12 2v20"] },
  "settings": { paths: ["M12 15a3 3 0 100-6 3 3 0 000 6z"], secondaryPaths: ["M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"] },
  "sliders": { paths: ["M4 21V14", "M4 10V3", "M12 21V12", "M12 8V3", "M20 21V16", "M20 12V3", "M1 14h6", "M9 8h6", "M17 16h6"] },
  "maximize": { paths: ["M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"] },
  "minimize": { paths: ["M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"] },
  "type": { paths: ["M4 7V4h16v3", "M9 20h6", "M12 4v16"] },
  "align-left": { paths: ["M17 10H3", "M21 6H3", "M21 14H3", "M17 18H3"] },
  "align-center": { paths: ["M18 10H6", "M21 6H3", "M21 14H3", "M18 18H6"] },
  "list": { paths: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"] },
  "columns": { paths: ["M12 3v18", "M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2z"] },
  "sidebar": { paths: ["M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2z", "M9 3v18"] },
  "zap": { paths: ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"] },
  "linkedin": { paths: ["M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z", "M2 9h4v12H2z", "M4 6a2 2 0 100-4 2 2 0 000 4z"] },
  "website": { paths: ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M2 12h20", "M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"] },
  "help": { paths: ["M12 22a10 10 0 100-20 10 10 0 000 20z", "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3", "M12 17h.01"] },
  "keyboard": { paths: ["M2 6h20a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V8a2 2 0 012-2z", "M6 10h.01", "M10 10h.01", "M14 10h.01", "M18 10h.01", "M8 14h8"] },
  "command": { paths: ["M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z"] },
  "thumbs-up": { paths: ["M14 9V5a3 3 0 00-6 0v0l-2 8h14a2 2 0 002-2v-1a2 2 0 00-2-2h-5z", "M2 10h2v10H2z"] },
  "more-horizontal": { paths: ["M12 13a1 1 0 100-2 1 1 0 000 2z", "M19 13a1 1 0 100-2 1 1 0 000 2z", "M5 13a1 1 0 100-2 1 1 0 000 2z"] },
  "more-vertical": { paths: ["M12 13a1 1 0 100-2 1 1 0 000 2z", "M12 6a1 1 0 100-2 1 1 0 000 2z", "M12 20a1 1 0 100-2 1 1 0 000 2z"] },
  "text-cursor": { paths: ["M12 2v20", "M7 2h10", "M7 22h10"] },
  "bold": { paths: ["M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z", "M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"] },
  "italic": { paths: ["M19 4h-9", "M14 20H5", "M15 4L9 20"] },
};

// ---------------------------------------------------------------------------
// Registry utilities
// ---------------------------------------------------------------------------

export const premiumIconNames = Object.keys(ICON_DEFS) as PremiumIconName[];

export type PremiumIconName = keyof typeof ICON_DEFS;

export function getPremiumIcon(name: string): IconDef | undefined {
  return ICON_DEFS[name];
}

export const premiumIconMap: Record<string, IconDef> = ICON_DEFS;

// ---------------------------------------------------------------------------
// The PremiumIcon Component
// ---------------------------------------------------------------------------

export function PremiumIcon({
  name,
  size: sizeProp,
  variant: variantProp,
  color,
  animated = false,
  className,
  ...svgProps
}: PremiumIconProps) {
  const theme = usePremiumIconTheme();
  const variant = variantProp ?? theme.defaultVariant;
  const size = sizeProp ?? theme.defaultSize;
  const px = SIZE_MAP[size];
  const def = ICON_DEFS[name];

  if (!def) {
    // Fallback: render a small placeholder square
    return (
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className={cn(color, className)}
        {...svgProps}
      >
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth={2} strokeDasharray="4 2" />
      </svg>
    );
  }

  const animationClass = animated
    ? name === "loading"
      ? "animate-spin"
      : name === "sparkles"
        ? "animate-pulse"
        : ""
    : "";

  // Build paths based on variant
  const renderPaths = () => {
    const primaryPaths = def.paths;
    const secondaryPaths = def.secondaryPaths ?? [];

    switch (variant) {
      case "stroke":
        return (
          <>
            {primaryPaths.map((d, i) => (
              <path key={`p-${i}`} d={d} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
            {secondaryPaths.map((d, i) => (
              <path key={`s-${i}`} d={d} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
          </>
        );

      case "solid":
        return (
          <>
            {secondaryPaths.map((d, i) => (
              <path key={`s-${i}`} d={d} fill="currentColor" stroke="none" />
            ))}
            {primaryPaths.map((d, i) => (
              <path key={`p-${i}`} d={d} fill="currentColor" stroke="none" />
            ))}
          </>
        );

      case "duotone":
        return (
          <>
            {secondaryPaths.map((d, i) => (
              <path key={`s-${i}`} d={d} fill="currentColor" fillOpacity={0.2} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {primaryPaths.map((d, i) => (
              <path key={`p-${i}`} d={d} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
          </>
        );

      case "soft":
        // Render with tinted background
        return (
          <>
            <rect x="1" y="1" width="22" height="22" rx="7" fill="currentColor" fillOpacity={0.12} stroke="none" />
            {secondaryPaths.map((d, i) => (
              <path key={`s-${i}`} d={d} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
            {primaryPaths.map((d, i) => (
              <path key={`p-${i}`} d={d} stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            ))}
          </>
        );
    }
  };

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={cn(color, animationClass, className)}
      aria-hidden="true"
      {...svgProps}
    >
      {renderPaths()}
    </svg>
  );
}
