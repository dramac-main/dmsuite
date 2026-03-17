// =============================================================================
// DMSuite — Invoice Template Registry
// Maps template IDs to metadata. Mirrors resume templates.ts pattern.
// =============================================================================

import { INVOICE_TEMPLATES, type InvoiceTemplateDef } from "./template-defs";

export interface InvoiceTemplateMetadata {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  isDark: boolean;
  accent: string;
  backgroundColor: string;
}

export const TEMPLATES: InvoiceTemplateMetadata[] = INVOICE_TEMPLATES.map((t) => ({
  id: t.id,
  name: t.name,
  description: t.description,
  headingFont: t.headingFont,
  bodyFont: t.bodyFont,
  isDark: t.isDark,
  accent: t.accent,
  backgroundColor: t.backgroundColor,
}));

export function getTemplateMetadata(id: string): InvoiceTemplateMetadata | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function getTemplateDef(id: string): InvoiceTemplateDef | undefined {
  return INVOICE_TEMPLATES.find((t) => t.id === id);
}

export { INVOICE_TEMPLATES } from "./template-defs";
