/* ═══════════════════════════════════════════════════════════════════════════
 * DMSuite — Presentation Designer: Shared Types
 * ═══════════════════════════════════════════════════════════════════════════ */

// ── Slide Layouts ───────────────────────────────────────────────────────────

export type SlideLayout =
  | "title"
  | "section"
  | "content"
  | "bullets"
  | "two-column"
  | "quote"
  | "image-text"
  | "big-number"
  | "blank";

export const SLIDE_LAYOUTS: { id: SlideLayout; label: string; icon: string }[] = [
  { id: "title", label: "Title Slide", icon: "T" },
  { id: "section", label: "Section Divider", icon: "§" },
  { id: "content", label: "Content", icon: "¶" },
  { id: "bullets", label: "Bullet Points", icon: "•" },
  { id: "two-column", label: "Two Columns", icon: "⫿" },
  { id: "quote", label: "Quote", icon: "\u201C" },
  { id: "image-text", label: "Image + Text", icon: "▣" },
  { id: "big-number", label: "Big Number/Stat", icon: "#" },
  { id: "blank", label: "Blank", icon: "□" },
];

// ── Single Slide ────────────────────────────────────────────────────────────

export interface Slide {
  id: string;
  layout: SlideLayout;
  title: string;
  subtitle: string;
  body: string;
  bullets: string[];
  leftHeading: string;
  leftBody: string;
  rightHeading: string;
  rightBody: string;
  quoteText: string;
  quoteAuthor: string;
  bigNumber: string;
  bigNumberLabel: string;
  sectionNumber: string;
  imageUrl: string;
  notes: string;
}

// ── Theme ───────────────────────────────────────────────────────────────────

export interface PresentationTheme {
  id: string;
  name: string;
  // Backgrounds
  bgPrimary: string;        // Title / section slides
  bgSecondary: string;      // Content slides
  bgGradient: string;       // CSS gradient for accent slides
  // Text
  textPrimary: string;
  textSecondary: string;
  textOnAccent: string;
  // Accents
  accent: string;
  accentSoft: string;
  // Decorative
  borderColor: string;
  decorShape: "circles" | "lines" | "dots" | "waves" | "none";
  // Typography
  headingFont: string;
  bodyFont: string;
}

// ── Presentation (full deck) ────────────────────────────────────────────────

export type AspectRatio = "16:9" | "4:3";

export interface Presentation {
  title: string;
  author: string;
  company: string;
  date: string;
  theme: PresentationTheme;
  aspectRatio: AspectRatio;
  slides: Slide[];
}

// ── Creation Phase ──────────────────────────────────────────────────────────

export type WorkspacePhase = "prompt" | "editor";

// ── Defaults ────────────────────────────────────────────────────────────────

export function createBlankSlide(layout: SlideLayout = "blank"): Slide {
  return {
    id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    layout,
    title: "",
    subtitle: "",
    body: "",
    bullets: [],
    leftHeading: "",
    leftBody: "",
    rightHeading: "",
    rightBody: "",
    quoteText: "",
    quoteAuthor: "",
    bigNumber: "",
    bigNumberLabel: "",
    sectionNumber: "",
    imageUrl: "",
    notes: "",
  };
}
