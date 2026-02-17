/**
 * DMSuite — Color Configuration
 * Re-exports from the canonical token source.
 * The single source of truth for all TS color values is `src/lib/tokens.ts`.
 * CSS/Tailwind tokens are defined in `globals.css` `@theme inline`.
 */

import { tokens } from "@/lib/tokens";

export const colors = {
  primary: tokens.colors.primary,
  secondary: tokens.colors.secondary,
  gray: tokens.colors.gray,
  accents: {
    success: tokens.colors.semantic.success,
    error: tokens.colors.semantic.error,
    warning: tokens.colors.semantic.warning,
    info: tokens.colors.semantic.info,
    wireTransfer: "#7c3aed",
    bankTransfer: "#2563eb",
  },
} as const;

export type ColorScale = typeof colors;
