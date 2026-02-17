/**
 * DMSuite — Z-Index Scale
 * Centralized stacking context scale. All z-index values across the app
 * should reference these constants to prevent stacking bugs.
 *
 * Hierarchy (low → high):
 *   base → dropdown → sticky → sidebar → overlay → modal → popover → toast → tooltip → commandPalette
 *
 * The Tailwind classes corresponding to these are defined as plain numbers:
 *   z-0, z-10, z-20, z-30, z-200, z-300, z-400, z-500, z-600, z-700
 */

export const Z = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  sidebar: 30,
  overlay: 200,
  modal: 300,
  popover: 400,
  toast: 500,
  tooltip: 600,
  commandPalette: 700,
} as const;

/** Tailwind class for each z-index level */
export const zClass = {
  base: "z-0",
  dropdown: "z-10",
  sticky: "z-20",
  sidebar: "z-30",
  overlay: "z-200",
  modal: "z-300",
  popover: "z-400",
  toast: "z-500",
  tooltip: "z-600",
  commandPalette: "z-700",
} as const;

export type ZLevel = keyof typeof Z;
