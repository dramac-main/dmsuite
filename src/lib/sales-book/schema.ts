// =============================================================================
// DMSuite — Sales Book Schema
// Configuration schema for designing blank sales book forms (invoice pads,
// receipt books, quotation booklets) intended for physical printing.
// Forms have empty slots (lines/boxes) filled in by pen after printing.
// =============================================================================

import { z } from "zod";

// Re-export custom block types for consumers
export type {
  CustomBlock,
  CustomBlockType,
  BlockPosition,
  QRCodeBlock,
  TextBlock,
  DividerBlock,
  SpacerBlock,
  ImageBlock,
  SignatureBoxBlock,
} from "./custom-blocks";
export { createDefaultBlock, BLOCK_TYPES, BLOCK_POSITIONS, getBlockSummary } from "./custom-blocks";

import type { CustomBlock } from "./custom-blocks";

// Re-export document types from invoice schema (shared across systems)
export {
  SALES_DOCUMENT_TYPES,
  DOCUMENT_TYPE_CONFIGS,
  FONT_PAIRINGS,
  ACCENT_COLORS,
  PAGE_FORMATS,
  PAGE_DIMENSIONS,
  CURRENCIES,
  computeCSSVariables,
  getDocumentTypeConfig,
} from "@/lib/invoice/schema";

export type {
  SalesDocumentType,
  FontPairingId,
  PageFormat,
  DocumentTypeConfig,
  CurrencyCode,
} from "@/lib/invoice/schema";

import type { SalesDocumentType, PageFormat } from "@/lib/invoice/schema";
import { DOCUMENT_TYPE_CONFIGS, PAGE_FORMATS, FONT_PAIRINGS, ACCENT_COLORS } from "@/lib/invoice/schema";

// ---------------------------------------------------------------------------
// Field Style — how blank fields are rendered
// ---------------------------------------------------------------------------

export const FIELD_STYLES = ["underline", "box", "dotted"] as const;
export type FieldStyle = (typeof FIELD_STYLES)[number];

export const FIELD_STYLE_LABELS: Record<FieldStyle, string> = {
  underline: "Underline",
  box: "Box / Cell",
  dotted: "Dotted Line",
};

// ---------------------------------------------------------------------------
// Border Style — form border treatment
// ---------------------------------------------------------------------------

export const BORDER_STYLES = ["none", "solid", "double"] as const;
export type BorderStyle = (typeof BORDER_STYLES)[number];

// ---------------------------------------------------------------------------
// Forms Per Page configurations
// ---------------------------------------------------------------------------

export const FORMS_PER_PAGE_OPTIONS = [
  { value: 1, label: "1 per page (Full-page form)" },
  { value: 2, label: "2 per page (Half-page forms)" },
  { value: 3, label: "3 per page (Receipt book style)" },
] as const;

// ---------------------------------------------------------------------------
// Column configuration for item table
// ---------------------------------------------------------------------------

export const ITEM_COLUMNS = [
  { id: "index", label: "#", alwaysOn: true },
  { id: "description", label: "Description", alwaysOn: true },
  { id: "quantity", label: "Qty", alwaysOn: false },
  { id: "unit", label: "Unit", alwaysOn: false },
  { id: "unitPrice", label: "Unit Price", alwaysOn: false },
  { id: "discount", label: "Discount", alwaysOn: false },
  { id: "tax", label: "Tax", alwaysOn: false },
  { id: "amount", label: "Amount", alwaysOn: false },
] as const;

export type ItemColumnId = (typeof ITEM_COLUMNS)[number]["id"];

/** Default columns per document type */
export const DEFAULT_COLUMNS: Record<SalesDocumentType, ItemColumnId[]> = {
  "invoice":          ["index", "description", "quantity", "unitPrice", "amount"],
  "quotation":        ["index", "description", "quantity", "unitPrice", "amount"],
  "receipt":          ["index", "description", "quantity", "amount"],
  "delivery-note":    ["index", "description", "quantity", "unit"],
  "credit-note":      ["index", "description", "quantity", "unitPrice", "amount"],
  "proforma-invoice": ["index", "description", "quantity", "unitPrice", "amount"],
  "purchase-order":   ["index", "description", "quantity", "unit", "unitPrice", "amount"],
};

/** Default item row count per document type (more rows for full-page, fewer for receipt) */
export const DEFAULT_ROW_COUNTS: Record<number, number> = {
  1: 10,  // Full page: 10 item rows
  2: 6,   // Half page: 6 item rows
  3: 3,   // Receipt: 3 item rows
};

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const companyBrandingSchema = z.object({
  name:     z.string().default(""),
  tagline:  z.string().default(""),
  address:  z.string().default(""),
  phone:    z.string().default(""),
  email:    z.string().default(""),
  website:  z.string().default(""),
  taxId:    z.string().default(""),
  logoUrl:  z.string().optional(),
  // Banking details — pre-printed on forms (not handwritten)
  bankName:      z.string().default(""),
  bankAccount:   z.string().default(""),
  bankAccountName: z.string().default(""),
  bankBranch:    z.string().default(""),
  bankBranchCode: z.string().default(""),
  bankSwiftBic:  z.string().default(""),
  bankIban:      z.string().default(""),
  bankSortCode:  z.string().default(""),
  bankReference: z.string().default(""),
  bankCustomLabel: z.string().default(""),
  bankCustomValue: z.string().default(""),
});

export const serialConfigSchema = z.object({
  prefix:      z.string().default("INV-"),
  startNumber: z.number().int().min(1).default(1),
  endNumber:   z.number().int().min(1).default(100),
  digitCount:  z.number().int().min(3).max(6).default(4),
  showSerial:  z.boolean().default(true),
});

export const formLayoutSchema = z.object({
  // Item table
  itemRowCount:     z.number().int().min(1).max(20).default(10),
  columns:          z.array(z.string()).default(["index", "description", "quantity", "unitPrice", "amount"]),

  // Header fields
  showDate:         z.boolean().default(true),
  showDueDate:      z.boolean().default(false),
  showPoNumber:     z.boolean().default(false),
  showRecipient:    z.boolean().default(true),
  showSender:       z.boolean().default(true),

  // Footer fields
  showSubtotal:     z.boolean().default(true),
  showDiscount:     z.boolean().default(false),
  showTax:          z.boolean().default(true),
  showTotal:        z.boolean().default(true),
  showAmountInWords: z.boolean().default(true),
  showPaymentInfo:  z.boolean().default(false),
  showSignature:    z.boolean().default(true),
  showNotes:        z.boolean().default(false),
  showTerms:        z.boolean().default(false),
  termsText:        z.string().default(""),
  notesLabel:       z.string().default("Notes"),

  // Type-specific field toggles
  showTypeFields:   z.boolean().default(true),  // Master toggle for type-specific fields  
  showVehicleNo:    z.boolean().default(true),   // Delivery note
  showDriverName:   z.boolean().default(true),   // Delivery note
  showValidFor:     z.boolean().default(true),   // Quotation
  showValidUntil:   z.boolean().default(true),   // Proforma invoice
  showOriginalInvoice: z.boolean().default(true), // Credit note
  showReasonForCredit: z.boolean().default(true), // Credit note
  showShipTo:       z.boolean().default(true),   // Purchase order
  showDeliveryBy:   z.boolean().default(true),   // Purchase order

  // Currency shown on blank amount fields
  currencySymbol:   z.string().default("K"),
  currencyCode:     z.string().default("ZMW"),
  currencyDisplay:  z.enum(["symbol", "code"]).default("symbol"),

  // Custom header fields — user-defined blank fields in the header area
  showCustomField1: z.boolean().default(false),
  customField1Label: z.string().default(""),
  showCustomField2: z.boolean().default(false),
  customField2Label: z.string().default(""),

  // Custom footer text — pre-printed below everything
  customFooterText: z.string().default(""),
});

export const BINDING_POSITIONS = ["left", "top"] as const;
export type BindingPosition = (typeof BINDING_POSITIONS)[number];

export const printConfigSchema = z.object({
  formsPerPage:    z.number().int().min(1).max(3).default(1),
  pageSize:        z.enum(PAGE_FORMATS).default("a4"),
  pageCount:       z.number().int().min(1).max(500).default(1),
  showCutLines:    z.boolean().default(true),
  showPageNumbers: z.boolean().default(true),
  bindingPosition: z.enum(BINDING_POSITIONS).default("left"),
});

export const formStyleSchema = z.object({
  template:    z.string().default("classic"),
  accentColor: z.string().default("#1e40af"),
  fontPairing: z.string().default("inter-inter"),
  fieldStyle:  z.enum(FIELD_STYLES).default("underline"),
  borderStyle: z.enum(BORDER_STYLES).default("none"),
});

export const brandLogoSchema = z.object({
  url:  z.string(),
  name: z.string().default(""),
});

export const brandLogosConfigSchema = z.object({
  enabled:  z.boolean().default(false),
  position: z.enum(["top", "bottom"]).default("bottom"),
  logos:    z.array(brandLogoSchema).default([]),
});

// ---------------------------------------------------------------------------
// Main Sales Book Form Data
// ---------------------------------------------------------------------------

export const salesBookFormSchema = z.object({
  documentType:    z.string().default("invoice"),
  companyBranding: companyBrandingSchema,
  serialConfig:    serialConfigSchema,
  formLayout:      formLayoutSchema,
  printConfig:     printConfigSchema,
  style:           formStyleSchema,
  brandLogos:      brandLogosConfigSchema,
  customBlocks:    z.array(z.any()).default([]) as unknown as z.ZodType<CustomBlock[]>,
});

// ---------------------------------------------------------------------------
// TypeScript Types (inferred from Zod)
// ---------------------------------------------------------------------------

export type CompanyBranding   = z.infer<typeof companyBrandingSchema>;
export type SerialConfig      = z.infer<typeof serialConfigSchema>;
export type FormLayout        = z.infer<typeof formLayoutSchema>;
export type PrintConfig       = z.infer<typeof printConfigSchema>;
export type FormStyle         = z.infer<typeof formStyleSchema>;
export type BrandLogo         = z.infer<typeof brandLogoSchema>;
export type BrandLogosConfig  = z.infer<typeof brandLogosConfigSchema>;
export type SalesBookFormData = z.infer<typeof salesBookFormSchema>;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDefaultSalesBookForm(
  docType: SalesDocumentType = "invoice",
): SalesBookFormData {
  const config = DOCUMENT_TYPE_CONFIGS[docType];
  const defaultCols = DEFAULT_COLUMNS[docType] ?? DEFAULT_COLUMNS.invoice;

  return {
    documentType: docType,
    companyBranding: {
      name: "",
      tagline: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      taxId: "",
      bankName: "",
      bankAccount: "",
      bankAccountName: "",
      bankBranch: "",
      bankBranchCode: "",
      bankSwiftBic: "",
      bankIban: "",
      bankSortCode: "",
      bankReference: "",
      bankCustomLabel: "",
      bankCustomValue: "",
    },
    serialConfig: {
      prefix: `${config.numberPrefix}-`,
      startNumber: 1,
      endNumber: 100,
      digitCount: 4,
      showSerial: true,
    },
    formLayout: {
      itemRowCount: 10,
      columns: [...defaultCols],
      showDate: true,
      showDueDate: config.hasDueDate,
      showPoNumber: docType === "purchase-order",
      showRecipient: true,
      showSender: true,
      showSubtotal: true,
      showDiscount: false,
      showTax: docType !== "delivery-note",
      showTotal: true,
      showAmountInWords: true,
      showPaymentInfo: config.showPaymentInfo,
      showSignature: true,
      showNotes: false,
      showTerms: false,
      termsText: "",
      notesLabel: "Notes",
      showTypeFields: true,
      showVehicleNo: true,
      showDriverName: true,
      showValidFor: true,
      showValidUntil: true,
      showOriginalInvoice: true,
      showReasonForCredit: true,
      showShipTo: true,
      showDeliveryBy: true,
      currencySymbol: "K",
      currencyCode: "ZMW",
      currencyDisplay: "symbol",
      showCustomField1: false,
      customField1Label: "",
      showCustomField2: false,
      customField2Label: "",
      customFooterText: "",
    },
    printConfig: {
      formsPerPage: config.receiptLayout ? 3 : 1,
      pageSize: "a4",
      pageCount: 1,
      showCutLines: config.receiptLayout,
      showPageNumbers: true,
      bindingPosition: "left",
    },
    style: {
      template: "classic",
      accentColor: "#1e40af",
      fontPairing: "inter-inter",
      fieldStyle: "underline",
      borderStyle: "none",
    },
    brandLogos: {
      enabled: false,
      position: "bottom",
      logos: [],
    },
    customBlocks: [],
  };
}

/** Convert form to a different document type, preserving layout choices */
export function convertSalesBookType(
  form: SalesBookFormData,
  targetType: SalesDocumentType,
): SalesBookFormData {
  const config = DOCUMENT_TYPE_CONFIGS[targetType];
  const defaultCols = DEFAULT_COLUMNS[targetType] ?? DEFAULT_COLUMNS.invoice;

  return {
    ...form,
    customBlocks: form.customBlocks,
    documentType: targetType,
    serialConfig: {
      ...form.serialConfig,
      prefix: `${config.numberPrefix}-`,
    },
    formLayout: {
      ...form.formLayout,
      columns: [...defaultCols],
      showDueDate: config.hasDueDate,
      showPoNumber: targetType === "purchase-order",
      showTax: targetType !== "delivery-note",
      showPaymentInfo: config.showPaymentInfo,
    },
    printConfig: {
      ...form.printConfig,
      formsPerPage: config.receiptLayout ? 3 : form.printConfig.formsPerPage,
      showCutLines: config.receiptLayout || form.printConfig.formsPerPage > 1,
    },
  };
}

/** Get the full template config by id */
export function getTemplateConfig(templateId: string): SalesBookTemplate {
  return SALES_BOOK_TEMPLATES.find((t) => t.id === templateId) ?? SALES_BOOK_TEMPLATES[0];
}

/** Format a serial number with prefix and zero-padding */
export function formatSerialNumber(
  config: SerialConfig,
  index: number,
): string {
  const num = config.startNumber + index;
  return `${config.prefix}${String(num).padStart(config.digitCount, "0")}`;
}

/** Total forms to print */
export function totalFormCount(config: SerialConfig): number {
  return Math.max(1, config.endNumber - config.startNumber + 1);
}

/** Total pages needed */
export function totalPageCount(serial: SerialConfig, print: PrintConfig): number {
  const forms = totalFormCount(serial);
  return Math.ceil(forms / print.formsPerPage);
}

// ---------------------------------------------------------------------------
// Sales Book Template Definitions
// Each template defines a distinct visual layout with rich visual features
// inspired by real-world business forms from around the world.
// ---------------------------------------------------------------------------

export const TEMPLATE_HEADER_STYLES = ["banner", "minimal", "centered", "left-heavy", "split", "boxed"] as const;
export type TemplateHeaderStyle = (typeof TEMPLATE_HEADER_STYLES)[number];

export const TEMPLATE_TABLE_STYLES = ["bordered", "striped", "clean", "minimal"] as const;
export type TemplateTableStyle = (typeof TEMPLATE_TABLE_STYLES)[number];

export const TEMPLATE_WATERMARK_STYLES = ["none", "text", "logo", "faded-title"] as const;
export type TemplateWatermarkStyle = (typeof TEMPLATE_WATERMARK_STYLES)[number];

export const TEMPLATE_FOOTER_STYLES = ["none", "bar", "line", "contact-bar"] as const;
export type TemplateFooterStyle = (typeof TEMPLATE_FOOTER_STYLES)[number];

export const TEMPLATE_DECORATIVE_STYLES = ["none", "corner-gradient", "top-circles", "page-border"] as const;
export type TemplateDecorativeStyle = (typeof TEMPLATE_DECORATIVE_STYLES)[number];

export const TEMPLATE_HEADER_DIVIDER_STYLES = ["thick-line", "double-line", "accent-bar", "fade", "thin-line"] as const;
export type TemplateHeaderDividerStyle = (typeof TEMPLATE_HEADER_DIVIDER_STYLES)[number];

export const TEMPLATE_ACCENT_STRIP_POSITIONS = ["none", "left", "top"] as const;
export type TemplateAccentStripPosition = (typeof TEMPLATE_ACCENT_STRIP_POSITIONS)[number];

export const TEMPLATE_TOTALS_STYLES = ["stacked", "boxed", "badge"] as const;
export type TemplateTotalsStyle = (typeof TEMPLATE_TOTALS_STYLES)[number];

export interface SalesBookTemplate {
  id: string;
  name: string;
  description: string;
  accent: string;
  accentSecondary?: string;  // Optional second color for gradients/decorations
  font: string;
  headerStyle: TemplateHeaderStyle;
  tableStyle: TemplateTableStyle;
  borderStyle: BorderStyle;
  compactSpacing: boolean;
  // Header features
  headerBand: boolean;        // Full-width accent band behind header
  headerGradient: boolean;    // Use gradient on header band
  contactIcons: boolean;      // Show phone/email/web icons beside company info
  // Table features
  tableHeaderFill: boolean;   // Solid fill on table header row
  tableBorderWeight: "light" | "medium" | "heavy"; // Border thickness for table
  // Totals/footer features
  totalsBorder: boolean;      // Double-line treatment on totals
  totalsStyle: TemplateTotalsStyle; // How total box is rendered
  fieldSeparators: boolean;   // Vertical separators between header fields
  // Visual decorations
  watermark: TemplateWatermarkStyle;    // Background watermark treatment
  footerStyle: TemplateFooterStyle;     // Footer bar/contact section
  decorative: TemplateDecorativeStyle;  // Decorative graphic elements
  pageBorderWeight: "none" | "thin" | "thick"; // Colored page border
  // Structural differentiators  
  headerDividerStyle: TemplateHeaderDividerStyle; // How header separates from content
  accentStrip: TemplateAccentStripPosition;       // Colored strip along an edge
  backgroundTint: boolean;                         // Subtle accent-tinted background
  // Receipt-specific
  receiptSidebar: boolean;    // Colored sidebar on receipt cards (vertical text)
  receiptSidebarColor?: string; // Override accent for sidebar
}

export const SALES_BOOK_TEMPLATES: SalesBookTemplate[] = [
  // ── 1. Classic — Traditional bordered form ──
  {
    id: "classic",
    name: "Classic",
    description: "Traditional bordered form with clean typography",
    accent: "#0f172a",
    font: "inter-inter",
    headerStyle: "left-heavy",
    tableStyle: "bordered",
    borderStyle: "solid",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "medium",
    totalsBorder: true,
    totalsStyle: "stacked",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "none",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thick-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 2. Modern Blue — Clean contemporary (DNG Suppliers inspired) ──
  {
    id: "modern-blue",
    name: "Modern Blue",
    description: "Professional navy blue with contact icons and watermark",
    accent: "#004a80",
    font: "poppins-inter",
    headerStyle: "left-heavy",
    tableStyle: "striped",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: true,
    tableHeaderFill: true,
    tableBorderWeight: "light",
    totalsBorder: true,
    totalsStyle: "badge",
    fieldSeparators: false,
    watermark: "logo",
    footerStyle: "contact-bar",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "accent-bar",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 3. Corporate — Enterprise header band (inspired by template 5) ──
  {
    id: "corporate",
    name: "Corporate",
    description: "Bold header band with enterprise sections",
    accent: "#2980b9",
    font: "montserrat-opensans",
    headerStyle: "banner",
    tableStyle: "striped",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: true,
    headerGradient: true,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "medium",
    totalsBorder: true,
    totalsStyle: "boxed",
    fieldSeparators: true,
    watermark: "none",
    footerStyle: "bar",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thick-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 4. Elegant Minimal — Sophisticated light design (template 15) ──
  {
    id: "elegant",
    name: "Elegant",
    description: "Sophisticated minimal design with serif touches",
    accent: "#444444",
    font: "cormorant-proza",
    headerStyle: "split",
    tableStyle: "clean",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: false,
    tableBorderWeight: "light",
    totalsBorder: true,
    totalsStyle: "stacked",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "contact-bar",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thin-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 5. Bold Red — Strong red accent (BrandText inspired, template 9) ──
  {
    id: "bold-red",
    name: "Bold Red",
    description: "Eye-catching red accents with decorative circles",
    accent: "#c0392b",
    accentSecondary: "#1a1a2e",
    font: "montserrat-opensans",
    headerStyle: "left-heavy",
    tableStyle: "clean",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: true,
    tableHeaderFill: true,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "stacked",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "contact-bar",
    decorative: "top-circles",
    pageBorderWeight: "none",
    headerDividerStyle: "accent-bar",
    accentStrip: "left",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 6. Olive Quotation — Pastel green (template 3 inspired) ──
  {
    id: "olive-green",
    name: "Olive Green",
    description: "Soft olive tones with pastel accents for quotations",
    accent: "#6b7a2b",
    accentSecondary: "#e8edc7",
    font: "bitter-inter",
    headerStyle: "centered",
    tableStyle: "striped",
    borderStyle: "solid",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "medium",
    totalsBorder: true,
    totalsStyle: "stacked",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "line",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "double-line",
    accentStrip: "none",
    backgroundTint: true,
    receiptSidebar: false,
  },
  // ── 7. Stationery PO — Purchase order style (template 13) ──
  {
    id: "stationery",
    name: "Stationery",
    description: "Dark red purchase order with large header and footer bar",
    accent: "#8b1a1a",
    font: "inter-inter",
    headerStyle: "banner",
    tableStyle: "bordered",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: true,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "medium",
    totalsBorder: true,
    totalsStyle: "boxed",
    fieldSeparators: true,
    watermark: "none",
    footerStyle: "bar",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thick-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 8. African Heritage — Warm tones, thick borders (template 8) ──
  {
    id: "african-heritage",
    name: "Heritage",
    description: "Warm earthy tones with bold thick borders",
    accent: "#5c1a1a",
    accentSecondary: "#d4a574",
    font: "bitter-inter",
    headerStyle: "centered",
    tableStyle: "bordered",
    borderStyle: "solid",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "heavy",
    totalsBorder: true,
    totalsStyle: "boxed",
    fieldSeparators: true,
    watermark: "faded-title",
    footerStyle: "line",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "double-line",
    accentStrip: "top",
    backgroundTint: true,
    receiptSidebar: false,
  },
  // ── 9. Compact — Tight spacing, max items (utility) ──
  {
    id: "compact",
    name: "Compact",
    description: "Maximizes items per form with tight spacing",
    accent: "#475569",
    font: "ibmplex-ibmplex",
    headerStyle: "split",
    tableStyle: "bordered",
    borderStyle: "solid",
    compactSpacing: true,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "medium",
    totalsBorder: false,
    totalsStyle: "stacked",
    fieldSeparators: true,
    watermark: "none",
    footerStyle: "none",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thin-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 10. Vintage Ledger — Old-school accounting ──
  {
    id: "vintage",
    name: "Vintage",
    description: "Old-school accounting ledger aesthetic",
    accent: "#1f2937",
    font: "bitter-inter",
    headerStyle: "boxed",
    tableStyle: "bordered",
    borderStyle: "double",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: false,
    tableBorderWeight: "medium",
    totalsBorder: true,
    totalsStyle: "stacked",
    fieldSeparators: true,
    watermark: "none",
    footerStyle: "none",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "double-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 11. Orange Commerce — Bright orange for sales (template 12) ──
  {
    id: "orange-commerce",
    name: "Orange",
    description: "Vibrant orange accents for sales and commerce",
    accent: "#f39c12",
    accentSecondary: "#1a237e",
    font: "poppins-inter",
    headerStyle: "left-heavy",
    tableStyle: "striped",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "medium",
    totalsBorder: false,
    totalsStyle: "badge",
    fieldSeparators: false,
    watermark: "text",
    footerStyle: "line",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "accent-bar",
    accentStrip: "left",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 12. Navy Bold — Dark navy with thick borders (template 10) ──
  {
    id: "navy-bold",
    name: "Navy Bold",
    description: "Deep navy with strong borders and watermark text",
    accent: "#1a237e",
    accentSecondary: "#c0392b",
    font: "montserrat-opensans",
    headerStyle: "banner",
    tableStyle: "bordered",
    borderStyle: "solid",
    compactSpacing: false,
    headerBand: true,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "heavy",
    totalsBorder: true,
    totalsStyle: "boxed",
    fieldSeparators: true,
    watermark: "text",
    footerStyle: "none",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thick-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 13. Pink Pop — Hot pink border accent (template 16) ──
  {
    id: "pink-pop",
    name: "Pink Pop",
    description: "Bold pink page border with centered layout",
    accent: "#e91e90",
    font: "poppins-inter",
    headerStyle: "centered",
    tableStyle: "striped",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "medium",
    totalsBorder: false,
    totalsStyle: "stacked",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "line",
    decorative: "none",
    pageBorderWeight: "thick",
    headerDividerStyle: "fade",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 14. Medical Blue — Clean blue with gradient bg (template 18) ──
  {
    id: "medical-blue",
    name: "Medical",
    description: "Clean blue medical/professional style",
    accent: "#0277bd",
    accentSecondary: "#e3f2fd",
    font: "inter-inter",
    headerStyle: "split",
    tableStyle: "clean",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: true,
    tableHeaderFill: true,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "boxed",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "contact-bar",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "fade",
    accentStrip: "top",
    backgroundTint: true,
    receiptSidebar: false,
  },
  // ── 15. Green Receipt — Bright green sidebar (template 4) ──
  {
    id: "green-receipt",
    name: "Green Card",
    description: "Bright green sidebar for receipt card format",
    accent: "#2ecc71",
    font: "inter-inter",
    headerStyle: "left-heavy",
    tableStyle: "clean",
    borderStyle: "solid",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: true,
    tableHeaderFill: false,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "boxed",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "none",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thick-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: true,
    receiptSidebarColor: "#2ecc71",
  },
  // ── 16. Blue Bar — Contact top bar (template 17 — Asomani) ──
  {
    id: "blue-bar",
    name: "Blue Bar",
    description: "Bold blue header bar with contact strip",
    accent: "#003087",
    accentSecondary: "#c0392b",
    font: "inter-inter",
    headerStyle: "banner",
    tableStyle: "clean",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: true,
    headerGradient: false,
    contactIcons: true,
    tableHeaderFill: false,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "boxed",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "none",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thick-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 17. Cash Simple — Minimal black receipt (template 7) ──
  {
    id: "cash-simple",
    name: "Simple",
    description: "Minimal black-on-white clean receipt",
    accent: "#333333",
    font: "inter-inter",
    headerStyle: "centered",
    tableStyle: "minimal",
    borderStyle: "none",
    compactSpacing: true,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: false,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "stacked",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "none",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thin-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 18. Corner Deco — Decorative corner gradient (template 6) ──
  {
    id: "corner-deco",
    name: "Corner Deco",
    description: "Decorative gradient corner with clean form",
    accent: "#2196F3",
    accentSecondary: "#4CAF50",
    font: "poppins-inter",
    headerStyle: "centered",
    tableStyle: "clean",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: false,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "stacked",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "contact-bar",
    decorative: "corner-gradient",
    pageBorderWeight: "none",
    headerDividerStyle: "fade",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
  // ── 19. Red Seal — Watermark stamp with red branding (template 19) ──
  {
    id: "red-seal",
    name: "Red Seal",
    description: "Red watermark seal with colored footer bar",
    accent: "#c0392b",
    font: "inter-inter",
    headerStyle: "left-heavy",
    tableStyle: "clean",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: false,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "boxed",
    fieldSeparators: false,
    watermark: "logo",
    footerStyle: "bar",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "accent-bar",
    accentStrip: "none",
    backgroundTint: true,
    receiptSidebar: false,
  },
  // ── 20. Serif Classic — Times New Roman serif (template 20) ──
  {
    id: "serif-classic",
    name: "Serif Classic",
    description: "Classic serif typography with dotted fields",
    accent: "#111111",
    font: "cormorant-proza",
    headerStyle: "split",
    tableStyle: "minimal",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: false,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "stacked",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "line",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thin-line",
    accentStrip: "none",
    backgroundTint: false,
    receiptSidebar: false,
  },
];

export type SalesBookTemplateId = (typeof SALES_BOOK_TEMPLATES)[number]["id"];
