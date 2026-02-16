/**
 * DMSuite — Color Configuration
 * Central color definitions for the design system.
 * These match the Tailwind theme tokens defined in globals.css.
 */

export const colors = {
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
  accents: {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
    wireTransfer: "#7c3aed",
    bankTransfer: "#2563eb",
  },
} as const;

export type ColorScale = typeof colors;
