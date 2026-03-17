/**
 * DMSuite — Central Design System Configuration
 * ============================================================
 * ONE file to rule them all. Every layout constant, sidebar dimension,
 * transition timing, surface color token, and reusable class pattern
 * lives here. Components import from this file — never hardcode values.
 *
 * Mirrors: globals.css (@theme inline)  for Tailwind tokens
 *          tokens.ts                     for JS color/font values
 *          z-index.ts                    for stacking contexts
 *
 * This file owns: layout dimensions, sidebar config, common class
 * patterns, animation tokens, and surface/elevation recipes.
 * ============================================================ */

// ── Sidebar ───────────────────────────────────────────────────
/** Sidebar widths, hover timing, and overlay config.
 *
 *  Desktop behaviour:
 *  • Default state — collapsed (icons only, w-18).
 *  • Hover — expands to w-60 as an **overlay** (shadow, no layout shift).
 *  • Pinned — expanded & pushes content (main uses mainMarginExpanded).
 *
 *  Mobile — unchanged: overlay drawer with swipe-to-close. */
export const sidebar = {
  /** Expanded sidebar Tailwind width */
  expandedWidth: "w-60", // 15rem = 240px
  /** Collapsed sidebar Tailwind width */
  collapsedWidth: "w-18", // 4.5rem = 72px
  /** Main content margin when sidebar is pinned open */
  mainMarginExpanded: "lg:ml-60",
  /** Main content margin when sidebar is in hover/collapsed mode */
  mainMarginCollapsed: "lg:ml-18",
  /** Numeric widths for calculations (px) */
  expandedPx: 240,
  collapsedPx: 72,
  /** Shared transition for sidebar width + main content margin */
  transition: "transition-all duration-200 ease-in-out",
  /** Delay before expanding on mouse-enter (ms) */
  hoverExpandDelay: 100,
  /** Delay before collapsing on mouse-leave (ms) — longer to prevent flicker */
  hoverCollapseDelay: 300,
  /** Shadow applied in overlay mode (hover-expanded, not pinned) */
  overlayShadow: "shadow-2xl shadow-black/20 dark:shadow-black/50",
} as const;

// ── Layout ────────────────────────────────────────────────────
export const layout = {
  /** Maximum content width */
  maxWidth: "max-w-screen-2xl",
  /** Standard page padding */
  pagePadding: "px-4 py-4 sm:px-6 sm:py-6",
  /** TopBar height */
  topBarHeight: "h-16",
  /** Standard content container */
  container: "px-4 py-4 sm:px-6 sm:py-6 max-w-screen-2xl mx-auto",
} as const;

// ── Surfaces & Elevations ─────────────────────────────────────
/** Consistent surface colors for cards, panels, overlays */
export const surfaces = {
  /** Page background */
  page: "bg-gray-50 dark:bg-gray-950",
  /** Sidebar / top-level panels */
  sidebar: "bg-white dark:bg-gray-900",
  /** Cards and secondary panels */
  card: "bg-white dark:bg-gray-900",
  /** Glassmorphic card */
  glass: "bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl",
  /** Elevated card (modals, popovers) */
  elevated: "bg-white dark:bg-gray-800",
  /** Input / form fields */
  input: "bg-gray-100 dark:bg-gray-800/50",
  /** Hover states on list items */
  hoverItem: "hover:bg-gray-100 dark:hover:bg-gray-800/70",
  /** Active / selected state */
  activeItem: "bg-primary-500 text-gray-950 font-semibold shadow-sm shadow-primary-500/20",
  /** Muted / disabled state */
  muted: "bg-gray-100 dark:bg-gray-800",
} as const;

// ── Borders ───────────────────────────────────────────────────
export const borders = {
  /** Default border */
  default: "border border-gray-200 dark:border-gray-800",
  /** Subtle / lighter border */
  subtle: "border border-gray-200 dark:border-gray-700",
  /** Sidebar border */
  sidebar: "border-r border-gray-200 dark:border-gray-700",
  /** Card border */
  card: "border border-gray-200 dark:border-gray-800",
  /** Focus ring */
  focusRing: "focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50",
  /** Dashed placeholder */
  dashed: "border-2 border-dashed border-gray-200 dark:border-gray-800",
  /** Primary accent border */
  accent: "border border-primary-500/20",
} as const;

// ── Typography ────────────────────────────────────────────────
export const typography = {
  /** Page titles */
  pageTitle: "text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight",
  /** Section headings */
  sectionTitle: "text-lg font-bold text-gray-900 dark:text-white tracking-tight",
  /** Card titles */
  cardTitle: "text-base font-semibold text-gray-900 dark:text-white",
  /** Body text */
  body: "text-sm text-gray-600 dark:text-gray-400",
  /** Muted / helper text */
  muted: "text-xs text-gray-400 dark:text-gray-500",
  /** Label text (small uppercase) */
  label: "text-[0.625rem] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500",
  /** Breadcrumb text */
  breadcrumb: "text-sm text-gray-400 hover:text-primary-500 transition-colors",
  /** Logo text */
  logo: "text-base font-bold text-gray-900 dark:text-white tracking-tight",
} as const;

// ── Interactive / Hover Patterns ──────────────────────────────
export const interactive = {
  /** Standard hover lift for cards */
  hoverLift: "hover:-translate-y-0.5 hover:shadow-lg transition-all",
  /** Subtle button hover */
  buttonHover: "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
  /** Icon button base */
  iconButton: `flex items-center justify-center size-9 rounded-lg
    text-gray-500 hover:text-gray-700 dark:hover:text-gray-200
    hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`,
  /** Small icon button (sidebar toggle etc.) */
  iconButtonSm: `flex items-center justify-center size-7 rounded-md
    text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
    hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`,
  /** Nav item (inactive) */
  navItem: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-200",
  /** Search input */
  searchInput: `w-full h-9 rounded-lg pl-9 pr-3
    bg-gray-100 dark:bg-gray-800/50
    border border-gray-200 dark:border-gray-700/50
    text-sm text-gray-900 dark:text-gray-200
    placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/50
    transition-all`,
} as const;

// ── Status Badges ─────────────────────────────────────────────
export const statusBadge = {
  ready: {
    bg: "bg-success/15",
    text: "text-success",
    dot: "bg-success",
    label: "Ready",
  },
  beta: {
    bg: "bg-warning/15",
    text: "text-warning",
    dot: "bg-warning",
    label: "Beta",
  },
  "coming-soon": {
    bg: "bg-info/15",
    text: "text-info",
    dot: "bg-info",
    label: "Coming Soon",
  },
} as const;

// ── Animations ────────────────────────────────────────────────
export const animations = {
  /** Standard transition for interactive elements */
  fast: "transition-all duration-150",
  /** Normal transition */
  normal: "transition-all duration-200",
  /** Slow transition for layout shifts */
  slow: "transition-all duration-300",
  /** Color-only transition */
  colors: "transition-colors duration-200",
  /** Spring-like sidebar animation */
  sidebarSpring: { type: "spring" as const, damping: 25, stiffness: 300 },
  /** Fade in/out */
  fade: { duration: 0.2 },
} as const;

// ── Gradients ─────────────────────────────────────────────────
export const gradients = {
  /** Brand gradient (primary → secondary) */
  brand: "bg-linear-to-br from-primary-500 to-secondary-500",
  /** Brand gradient with opacity */
  brandSubtle: "bg-linear-to-br from-primary-500/10 to-secondary-500/10",
  /** Card gradient (dark mode) */
  cardDark: "bg-linear-to-br from-card-gradient-from via-card-gradient-via to-card-gradient-to",
} as const;

// ── Shadows ───────────────────────────────────────────────────
export const shadows = {
  /** Logo / brand element shadow */
  brand: "shadow-lg shadow-primary-500/20",
  /** Card hover shadow */
  cardHover: "shadow-lg",
  /** Subtle shadow */
  sm: "shadow-sm",
} as const;

// ── Radii ─────────────────────────────────────────────────────
export const radii = {
  /** Small elements (badges, toggles) */
  sm: "rounded-md",
  /** Standard (buttons, inputs) */
  md: "rounded-lg",
  /** Cards, panels */
  lg: "rounded-xl",
  /** Large cards, sections */
  xl: "rounded-2xl",
  /** Pill shape (badges, tags) */
  full: "rounded-full",
} as const;

// ── Composite Recipes ─────────────────────────────────────────
/** Pre-composed class combinations for common UI elements */
export const recipes = {
  /** Standard card */
  card: `rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900`,
  /** Tool tag chip */
  tag: "px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  /** Pro / AI badge */
  aiBadge: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500/10",
  /** Notification dot */
  notifDot: "absolute top-2 right-2 size-2 rounded-full bg-primary-500 ring-2 ring-white dark:ring-gray-900",
  /** Logo mark */
  logoMark: "size-8 rounded-lg bg-linear-to-br from-primary-500 to-secondary-500 shrink-0 flex items-center justify-center shadow-lg shadow-primary-500/20",
  /** User avatar */
  avatar: `size-8 rounded-lg bg-linear-to-br from-primary-400 to-secondary-500
    flex items-center justify-center text-xs font-bold text-gray-950 cursor-pointer
    ring-2 ring-transparent hover:ring-primary-500/30 transition-all`,
  /** Placeholder / coming soon box */
  placeholder: "rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50",
} as const;
