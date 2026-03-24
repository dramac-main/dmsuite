/**
 * DMSuite — Central Design System Configuration
 * ============================================================
 * ONE file to rule them all. Every layout constant, sidebar dimension,
 * transition timing, surface color token, and reusable class pattern
 * lives here. Components import from this file — never hardcode values.
 *
 * 🎨 BRAND PALETTE: Violet #8b5cf6 + Cyan #06b6d4 + Cosmic Slate neutral
 * 📄 Full spec: /BRANDING-SPEC.md
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
 *  • Default state — collapsed (icons only, w-16).
 *  • Hover — expands to w-64 as an **overlay** (shadow, no layout shift).
 *  • Pinned — expanded & pushes content (main uses mainMarginExpanded).
 *
 *  Mobile — unchanged: overlay drawer with swipe-to-close. */
export const sidebar = {
  /** Expanded sidebar Tailwind width */
  expandedWidth: "w-64", // 16rem = 256px
  /** Collapsed sidebar Tailwind width */
  collapsedWidth: "w-16", // 4rem = 64px
  /** Main content margin when sidebar is pinned open */
  mainMarginExpanded: "lg:ml-64",
  /** Main content margin when sidebar is in hover/collapsed mode */
  mainMarginCollapsed: "lg:ml-16",
  /** Numeric widths for calculations (px) */
  expandedPx: 256,
  collapsedPx: 64,
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
  /** Mobile bottom nav height */
  bottomNavHeight: "h-14",
  /** Standard content container */
  container: "px-4 py-4 sm:px-6 sm:py-6 max-w-screen-2xl mx-auto",
  /** Bottom padding to clear mobile nav + safe area */
  mobileBottomPad: "pb-20 lg:pb-0",
  /** Settings panel width (desktop) */
  settingsPanel: "w-80", // 320px
  /** Details/right panel width (desktop) */
  detailsPanel: "w-72", // 288px
} as const;

// ── Mobile Workspace ──────────────────────────────────────────
/** Shared mobile workspace tab classes & patterns */
export const mobileWorkspace = {
  /** Tab bar container (hidden on md+) */
  tabBar: "flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden",
  /** Active tab */
  tabActive: "flex-1 py-3 text-xs font-semibold capitalize text-primary-500 border-b-2 border-primary-500 transition-colors",
  /** Inactive tab */
  tabInactive: "flex-1 py-3 text-xs font-semibold capitalize text-gray-400 hover:text-gray-300 transition-colors",
  /** Panel hidden on wrong tab (mobile), always visible on md+ */
  panelHidden: "hidden md:block",
  /** Workspace main flex direction */
  container: "flex flex-col lg:flex-row gap-4",
  /** Minimum workspace height using dvh */
  minHeight: "min-h-[calc(100dvh-260px)]",
} as const;

// ── Touch Targets ─────────────────────────────────────────────
export const touch = {
  /** Minimum touch target (44×44 = size-11) per WCAG */
  min: "min-h-11 min-w-11",
  /** Standard interactive element size */
  standard: "size-10", // 40px
  /** Small interactive element (only desktop) */
  sm: "size-8",
  /** Large touch target (primary FABs) */
  lg: "size-12", // 48px
} as const;

// ── Surfaces & Elevations ─────────────────────────────────────
/** Consistent surface colors for cards, panels, overlays */
export const surfaces = {
  /** Page background */
  page: "bg-gray-50 dark:bg-gray-950",
  /** Sidebar / top-level panels */
  sidebar: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
  /** Cards and secondary panels */
  card: "bg-white/60 dark:bg-gray-900/40 backdrop-blur-lg",
  /** Glassmorphic card */
  glass: "bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl",
  /** Elevated card (modals, popovers) */
  elevated: "bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl",
  /** Input / form fields */
  input: "bg-gray-100/80 dark:bg-gray-800/50",
  /** Hover states on list items */
  hoverItem: "hover:bg-gray-100/80 dark:hover:bg-gray-800/50",
  /** Active / selected state */
  activeItem: "bg-primary-500/15 text-primary-500 dark:text-primary-400 font-semibold",
  /** Muted / disabled state */
  muted: "bg-gray-100/80 dark:bg-gray-800/50",
} as const;

// ── Borders ───────────────────────────────────────────────────
export const borders = {
  /** Default border */
  default: "border border-white/10 dark:border-white/[0.06]",
  /** Subtle / lighter border */
  subtle: "border border-gray-200/60 dark:border-gray-700/50",
  /** Sidebar border */
  sidebar: "border-r border-gray-200/60 dark:border-white/[0.06]",
  /** Card border */
  card: "border border-white/10 dark:border-white/[0.06]",
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
  brand: "bg-linear-to-br from-primary-500 via-primary-600 to-secondary-500",
  /** Brand gradient with opacity */
  brandSubtle: "bg-linear-to-br from-primary-500/10 via-primary-500/5 to-secondary-500/10",
  /** Card gradient (dark mode) */
  cardDark: "bg-linear-to-br from-card-gradient-from via-card-gradient-via to-card-gradient-to",
  /** Hero mesh gradient */
  heroMesh: "bg-linear-to-br from-primary-500/15 via-transparent to-secondary-500/15",
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
  card: `rounded-2xl border border-white/10 dark:border-white/[0.06] bg-white/60 dark:bg-gray-900/40 backdrop-blur-lg`,
  /** Interactive card (tool cards, clickable) */
  cardInteractive: `rounded-2xl border border-white/10 dark:border-white/[0.06] bg-white/60 dark:bg-gray-900/40 backdrop-blur-lg
    hover:border-primary-500/30 dark:hover:border-primary-500/20
    hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/5
    transition-all duration-300 cursor-pointer`,
  /** Glass card (hero, overlays) */
  cardGlass: `rounded-2xl border border-white/15 dark:border-white/[0.08]
    bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl`,
  /** Highlighted card (selected / active) */
  cardActive: `rounded-2xl border-2 border-primary-500/30 bg-primary-500/5 backdrop-blur-lg`,
  /** Tool tag chip */
  tag: "px-2 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  /** Pro / AI badge */
  aiBadge: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-xs font-medium",
  /** Credit badge */
  creditBadge: "px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 text-xs font-mono font-medium",
  /** Notification dot */
  notifDot: "absolute top-2 right-2 size-2 rounded-full bg-primary-500 ring-2 ring-white dark:ring-gray-900",
  /** Logo mark */
  logoMark: "size-8 rounded-xl bg-linear-to-br from-primary-500 to-secondary-500 shrink-0 flex items-center justify-center shadow-lg shadow-primary-500/20",
  /** User avatar */
  avatar: `size-8 rounded-lg bg-linear-to-br from-primary-400 to-secondary-500
    flex items-center justify-center text-xs font-bold text-gray-950 cursor-pointer
    ring-2 ring-transparent hover:ring-primary-500/30 transition-all`,
  /** Placeholder / coming soon box */
  placeholder: "rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50",
  /** Primary button */
  btnPrimary: `h-10 px-4 rounded-lg font-semibold text-sm
    bg-primary-500 text-gray-950
    hover:bg-primary-400 active:bg-primary-600
    transition-colors shadow-sm shadow-primary-500/20`,
  /** Secondary button */
  btnSecondary: `h-10 px-4 rounded-lg font-medium text-sm
    bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
    hover:bg-gray-200 dark:hover:bg-gray-700
    border border-gray-200 dark:border-gray-700
    transition-colors`,
  /** Ghost button */
  btnGhost: `h-10 px-4 rounded-lg font-medium text-sm
    text-gray-600 dark:text-gray-400
    hover:text-gray-900 dark:hover:text-gray-200
    hover:bg-gray-100 dark:hover:bg-gray-800
    transition-colors`,
  /** Text input */
  input: `w-full h-10 rounded-lg px-3 text-sm
    bg-gray-100 dark:bg-gray-800/50
    border border-gray-200 dark:border-gray-700
    text-gray-900 dark:text-gray-200
    placeholder:text-gray-400
    focus:outline-none focus:ring-2 focus:ring-primary-500/40
    focus:border-primary-500/50 transition-all`,
} as const;

// ── Chiko Mascot Animation Presets ────────────────────────────
/** Pre-defined Framer Motion values for Chiko's physics-based animations */
export const chiko = {
  /** Idle floating bob (always on) */
  idleBob: {
    animate: { y: [0, -3, 0] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
  /** Breathing glow ring */
  breatheGlow: {
    animate: { opacity: [0.3, 0.6, 0.3], scale: [0.97, 1.03, 0.97] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
  /** Eye blink (random interval) */
  eyeBlink: {
    animate: { scaleY: [1, 0.1, 1] },
    transition: { duration: 0.15, ease: "easeInOut" as const },
  },
  /** Happy bounce (on task complete) */
  happyBounce: {
    animate: { y: [0, -8, 0], scale: [1, 1.05, 1] },
    transition: { type: "spring" as const, damping: 12, stiffness: 400 },
  },
  /** Thinking sway */
  thinkingSway: {
    animate: { rotate: [-3, 3, -3] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
  },
  /** FAB entrance spring */
  fabEntrance: {
    initial: { opacity: 0, scale: 0.3, y: 30 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { type: "spring" as const, damping: 20, stiffness: 300 },
  },
  /** Panel entrance */
  panelEntrance: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { type: "spring" as const, damping: 25, stiffness: 300 },
  },
  /** Expression change tween (smooth 200ms between states) */
  expressionTween: {
    transition: { duration: 0.2, ease: "easeInOut" as const },
  },
  /** Sizes */
  sizes: {
    xs: 24, sm: 32, md: 48, lg: 80, xl: 120, hero: 200,
  },
} as const;

// ── Brand Constants ───────────────────────────────────────────
/** Hardcoded brand values for non-Tailwind contexts (canvas, PWA, meta tags) */
export const brand = {
  /** Primary color hex (for canvas, meta, PWA) */
  primary: "#8b5cf6",
  /** Secondary color hex */
  secondary: "#06b6d4",
  /** Dark background hex */
  bgDark: "#0a0f1a",
  /** Light background hex */
  bgLight: "#f8fafc",
  /** App name */
  name: "DMSuite",
  /** Full title */
  title: "DMSuite — AI Design & Business Suite",
} as const;
