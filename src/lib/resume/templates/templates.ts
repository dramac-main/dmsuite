// =============================================================================
// DMSuite — Resume Templates Registry
// Template metadata and selection helpers.
// All 20 pro templates.
// =============================================================================

import type { TemplateId } from "@/lib/resume/schema";
import { PRO_TEMPLATES } from "./template-defs";

// ---------------------------------------------------------------------------
// Template metadata
// ---------------------------------------------------------------------------

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  description: string;
  sidebarPosition: "none" | "left" | "right";
  /** Default sidebar width (%) — only used for templates with sidebar */
  defaultSidebarWidth: number;
  /** Whether the template uses full-width layout by default */
  defaultFullWidth: boolean;
  /** Whether this is a v2 pro template */
  isPro?: boolean;
  /** Accent color preview for template thumbnails */
  accentPreview?: string;
  /** Whether template has dark background */
  isDark?: boolean;
}

// ── Pro templates (generated from template-defs) ──
const PRO_TEMPLATE_METADATA: TemplateMetadata[] = PRO_TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  sidebarPosition: t.sidebarPosition,
  defaultSidebarWidth:
    t.sidebarWidthPx > 0 ? Math.round((t.sidebarWidthPx / 794) * 100) : 0,
  defaultFullWidth: !t.isTwoColumn,
  isPro: true,
  accentPreview: t.accent,
  isDark: t.isDark,
}));

// ── Combined registry — all pro templates ──
export const TEMPLATES: TemplateMetadata[] = PRO_TEMPLATE_METADATA;

export function getTemplateMetadata(id: TemplateId): TemplateMetadata {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function getTemplateById(id: TemplateId): TemplateMetadata | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
