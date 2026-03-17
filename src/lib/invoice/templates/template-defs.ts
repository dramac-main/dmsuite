// =============================================================================
// DMSuite — Invoice Template Definitions
// 10 pro template metadata configs. Mirrors resume template-defs.ts pattern.
// =============================================================================

import type { InvoiceTemplateId } from "../schema";

export interface InvoiceTemplateDef {
  id: InvoiceTemplateId;
  name: string;
  description: string;
  googleFontUrl: string;
  headingFont: string;
  bodyFont: string;
  defaultFontPairing: string;
  isDark: boolean;
  backgroundColor: string;
  accent: string;
  headerStyle: "banner" | "split" | "minimal" | "sidebar" | "centered";
  tableStyle: "striped" | "bordered" | "clean" | "minimal";
}

export const INVOICE_TEMPLATES: InvoiceTemplateDef[] = [
  {
    id: "modern-clean",
    name: "Modern Clean",
    description: "Clean gradient header with contemporary layout",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    headingFont: "Inter",
    bodyFont: "Inter",
    defaultFontPairing: "inter-inter",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#1e40af",
    headerStyle: "banner",
    tableStyle: "striped",
  },
  {
    id: "classic-professional",
    name: "Classic Professional",
    description: "Traditional serif typography with formal borders",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@400;600&display=swap",
    headingFont: "Playfair Display",
    bodyFont: "Source Sans 3",
    defaultFontPairing: "playfair-source",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#0f172a",
    headerStyle: "split",
    tableStyle: "bordered",
  },
  {
    id: "minimal-white",
    name: "Minimal White",
    description: "Maximum whitespace with elegant typography",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&family=Lato:wght@400;700&display=swap",
    headingFont: "Raleway",
    bodyFont: "Lato",
    defaultFontPairing: "raleway-lato",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#475569",
    headerStyle: "minimal",
    tableStyle: "minimal",
  },
  {
    id: "bold-corporate",
    name: "Bold Corporate",
    description: "Strong color blocks with enterprise styling",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;600&display=swap",
    headingFont: "Montserrat",
    bodyFont: "Open Sans",
    defaultFontPairing: "montserrat-opensans",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#4338ca",
    headerStyle: "banner",
    tableStyle: "striped",
  },
  {
    id: "elegant-line",
    name: "Elegant Line",
    description: "Thin rules and serif headers for sophistication",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Proza+Libre:wght@400;600&display=swap",
    headingFont: "Cormorant Garamond",
    bodyFont: "Proza Libre",
    defaultFontPairing: "cormorant-proza",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#b45309",
    headerStyle: "split",
    tableStyle: "clean",
  },
  {
    id: "tech-startup",
    name: "Tech Startup",
    description: "Dark header with monospace numbers and modern feel",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
    defaultFontPairing: "spacegrotesk-inter",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#059669",
    headerStyle: "banner",
    tableStyle: "clean",
  },
  {
    id: "creative-studio",
    name: "Creative Studio",
    description: "Colorful and design-forward for creative businesses",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
    headingFont: "Poppins",
    bodyFont: "Inter",
    defaultFontPairing: "poppins-inter",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#7c3aed",
    headerStyle: "sidebar",
    tableStyle: "striped",
  },
  {
    id: "executive-premium",
    name: "Executive Premium",
    description: "Double borders and gold accents for prestige",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600&display=swap",
    headingFont: "DM Serif Display",
    bodyFont: "DM Sans",
    defaultFontPairing: "dmserif-dmsans",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#b45309",
    headerStyle: "centered",
    tableStyle: "bordered",
  },
  {
    id: "freelancer-simple",
    name: "Freelancer Simple",
    description: "One-page compact layout for quick invoicing",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap",
    headingFont: "IBM Plex Sans",
    bodyFont: "IBM Plex Sans",
    defaultFontPairing: "ibmplex-ibmplex",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#0e7490",
    headerStyle: "minimal",
    tableStyle: "minimal",
  },
  {
    id: "international",
    name: "International",
    description: "Multi-currency ready with bilingual support",
    googleFontUrl: "https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
    headingFont: "Bitter",
    bodyFont: "Inter",
    defaultFontPairing: "bitter-inter",
    isDark: false,
    backgroundColor: "#ffffff",
    accent: "#0f766e",
    headerStyle: "split",
    tableStyle: "bordered",
  },
];

export function getInvoiceTemplate(id: string): InvoiceTemplateDef | undefined {
  return INVOICE_TEMPLATES.find((t) => t.id === id);
}

export function isInvoiceTemplate(id: string): boolean {
  return INVOICE_TEMPLATES.some((t) => t.id === id);
}
