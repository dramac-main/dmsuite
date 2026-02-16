/* ============================================================
   DMSuite — Design System Tokens (TypeScript)
   Mirrors the Tailwind @theme tokens for use in JS/TS code.
   ============================================================ */

export const tokens = {
  colors: {
    primary: {
      50: "#f4ffe6",
      100: "#e4ffbf",
      200: "#ccff80",
      300: "#b3ff40",
      400: "#9dff1a",
      500: "#8ae600",
      600: "#6fbf00",
      700: "#558c00",
      800: "#3d6600",
      900: "#264000",
      950: "#132600",
    },
    secondary: {
      50: "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4",
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
      950: "#083344",
    },
    gray: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      850: "#172032",
      900: "#0f172a",
      950: "#0a0f1a",
    },
    semantic: {
      success: "#22c55e",
      error: "#ef4444",
      warning: "#f59e0b",
      info: "#3b82f6",
    },
  },
  fonts: {
    sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  radii: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
} as const;

/** Spacing scale (in rem) — matches Tailwind 4 */
export const spacing = {
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  18: "4.5rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
} as const;

/** Z-index scale */
export const zIndex = {
  dropdown: 50,
  sticky: 100,
  overlay: 200,
  modal: 300,
  popover: 400,
  toast: 500,
  tooltip: 600,
} as const;

/** Animation durations */
export const durations = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
} as const;

/** Animation easings */
export const easings = {
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as const;
