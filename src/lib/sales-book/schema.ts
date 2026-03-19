// =============================================================================
// DMSuite â€” Sales Book Schema
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
// Field Style â€” how blank fields are rendered
// ---------------------------------------------------------------------------

export const FIELD_STYLES = ["underline", "box", "dotted"] as const;
export type FieldStyle = (typeof FIELD_STYLES)[number];

export const FIELD_STYLE_LABELS: Record<FieldStyle, string> = {
  underline: "Underline",
  box: "Box / Cell",
  dotted: "Dotted Line",
};

// ---------------------------------------------------------------------------
// Border Style â€” form border treatment
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
  // Banking details â€” pre-printed on forms (not handwritten)
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

  // Custom header fields â€” user-defined blank fields in the header area
  showCustomField1: z.boolean().default(false),
  customField1Label: z.string().default(""),
  showCustomField2: z.boolean().default(false),
  customField2Label: z.string().default(""),

  // Custom footer text â€” pre-printed below everything
  customFooterText: z.string().default(""),

  // Editable field title overrides — empty string means use default
  columnLabels:     z.record(z.string(), z.string()).default({}),
  subtotalLabel:    z.string().default(""),
  discountLabel:    z.string().default(""),
  taxLabel:         z.string().default(""),
  totalLabel:       z.string().default(""),
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
  accentColor: z.string().default("#0f172a"),
  fontPairing: z.string().default("inter-inter"),
  fieldStyle:  z.enum(FIELD_STYLES).default("underline"),
  borderStyle: z.enum(BORDER_STYLES).default("none"),
  /** Data-URL or URL of an image to show as a faded watermark behind the form */
  watermarkImage: z.string().optional(),
  /** Opacity for watermark image (0â€“1, default 0.06) */
  watermarkOpacity: z.number().min(0).max(1).default(0.06),
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
      columnLabels: {},
      subtotalLabel: "",
      discountLabel: "",
      taxLabel: "",
      totalLabel: "",
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
      accentColor: "#0f172a",
      fontPairing: "inter-inter",
      fieldStyle: "underline",
      borderStyle: "none",
      watermarkOpacity: 0.06,
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
      formsPerPage: config.receiptLayout ? 3 : 1,
      showCutLines: config.receiptLayout,
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

export const TEMPLATE_LAYOUT_TYPES = ["standard", "centered", "dual-column", "compact-header", "bold-header", "grid-info"] as const;
export type TemplateLayoutType = (typeof TEMPLATE_LAYOUT_TYPES)[number];

export const TEMPLATE_CATEGORIES = ["professional", "commerce", "minimal", "classic"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_DATE_STYLES = ["grid", "line", "slashed"] as const;
export type TemplateDateStyle = (typeof TEMPLATE_DATE_STYLES)[number];

export const TEMPLATE_SERIAL_STYLES = ["inline", "boxed", "stacked"] as const;
export type TemplateSerialStyle = (typeof TEMPLATE_SERIAL_STYLES)[number];

export interface SalesBookTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;          // UI grouping for template picker
  layout: TemplateLayoutType;           // Structural layout archetype
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
  // Date & serial number formatting (adds variety across templates)
  dateStyle: TemplateDateStyle;    // "grid" = DAY/MONTH/YEAR boxes, "line" = simple underline, "slashed" = DD / MM / YYYY
  serialStyle: TemplateSerialStyle; // "inline" = prefix + line, "boxed" = framed box, "stacked" = label above line
  // Receipt-specific
  receiptSidebar: boolean;    // Colored sidebar on receipt cards (vertical text)
  receiptSidebarColor?: string; // Override accent for sidebar
}

export const SALES_BOOK_TEMPLATES: SalesBookTemplate[] = [
  // â”€â”€ 1. Classic â€” Timeless bordered form, the safe universal choice â”€â”€
  {
    id: "classic",
    name: "Classic",
    description: "Traditional bordered form with clean typography",
    category: "classic",
    layout: "standard",
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
    dateStyle: "grid",
    serialStyle: "inline",
    receiptSidebar: false,
  },
  // â”€â”€ 2. Horizon Blue â€” Gradient tech-forward with cyan accents â”€â”€
  {
    id: "horizon-blue",
    name: "Horizon Blue",
    description: "Sleek gradient header with modern tech aesthetics",
    category: "professional",
    layout: "standard",
    accent: "#0066cc",
    accentSecondary: "#00b4d8",
    font: "spacegrotesk-inter",
    headerStyle: "banner",
    tableStyle: "clean",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: true,
    headerGradient: true,
    contactIcons: true,
    tableHeaderFill: true,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "badge",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "contact-bar",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "accent-bar",
    accentStrip: "none",
    backgroundTint: true,
    dateStyle: "line",
    serialStyle: "inline",
    receiptSidebar: false,
  },
  // â”€â”€ 3. Executive â€” Dark indigo enterprise with gold touches â”€â”€
  {
    id: "executive",
    name: "Executive",
    description: "Commanding corporate presence with deep indigo and gold",
    category: "professional",
    layout: "dual-column",
    accent: "#1a237e",
    accentSecondary: "#c9a84c",
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
    watermark: "none",
    footerStyle: "bar",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thick-line",
    accentStrip: "none",
    backgroundTint: false,
    dateStyle: "grid",
    serialStyle: "boxed",
    receiptSidebar: false,
  },
  // â”€â”€ 4. Ivory Serif â€” High-end luxury with champagne gold â”€â”€
  {
    id: "ivory-serif",
    name: "Ivory Serif",
    description: "High-end luxury feel with warm champagne and serif type",
    category: "minimal",
    layout: "centered",
    accent: "#8b7355",
    accentSecondary: "#f5f0e8",
    font: "playfair-source",
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
    pageBorderWeight: "thin",
    headerDividerStyle: "thin-line",
    accentStrip: "none",
    backgroundTint: true,
    dateStyle: "line",
    serialStyle: "inline",
    receiptSidebar: false,
  },
  // â”€â”€ 5. Crimson Impact â€” Bold red with dark accents and circles â”€â”€
  {
    id: "crimson-impact",
    name: "Crimson Impact",
    description: "Eye-catching crimson with decorative circles and side strip",
    category: "commerce",
    layout: "bold-header",
    accent: "#c0392b",
    accentSecondary: "#1a1a2e",
    font: "montserrat-opensans",
    headerStyle: "left-heavy",
    tableStyle: "striped",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: true,
    tableHeaderFill: true,
    tableBorderWeight: "medium",
    totalsBorder: false,
    totalsStyle: "badge",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "contact-bar",
    decorative: "top-circles",
    pageBorderWeight: "none",
    headerDividerStyle: "accent-bar",
    accentStrip: "left",
    backgroundTint: false,
    dateStyle: "grid",
    serialStyle: "stacked",
    receiptSidebar: false,
  },
  // â”€â”€ 6. Sage Garden â€” Organic olive tones with earthy warmth â”€â”€
  {
    id: "sage-garden",
    name: "Sage Garden",
    description: "Calm organic tones with serif elegance and sage tint",
    category: "classic",
    layout: "grid-info",
    accent: "#5a7247",
    accentSecondary: "#d4e2c8",
    font: "crimsonpro-worksans",
    headerStyle: "centered",
    tableStyle: "striped",
    borderStyle: "none",
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
    dateStyle: "slashed",
    serialStyle: "inline",
    receiptSidebar: false,
  },
  // â”€â”€ 7. Maroon Ledger â€” Institutional double-border formality â”€â”€
  {
    id: "maroon-ledger",
    name: "Maroon Ledger",
    description: "Official institutional form with heavy double borders",
    category: "classic",
    layout: "standard",
    accent: "#6d1a36",
    accentSecondary: "#e8d8c8",
    font: "dmserif-dmsans",
    headerStyle: "boxed",
    tableStyle: "bordered",
    borderStyle: "double",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "heavy",
    totalsBorder: true,
    totalsStyle: "boxed",
    fieldSeparators: true,
    watermark: "none",
    footerStyle: "bar",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "double-line",
    accentStrip: "none",
    backgroundTint: false,
    dateStyle: "grid",
    serialStyle: "boxed",
    receiptSidebar: false,
  },
  // â”€â”€ 8. Terracotta â€” Warm sienna with earthy artisan character â”€â”€
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Warm earthy sienna tones with artisan character",
    category: "commerce",
    layout: "bold-header",
    accent: "#a0522d",
    accentSecondary: "#d4a574",
    font: "bitter-inter",
    headerStyle: "centered",
    tableStyle: "striped",
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
    watermark: "none",
    footerStyle: "line",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thick-line",
    accentStrip: "top",
    backgroundTint: true,
    dateStyle: "grid",
    serialStyle: "stacked",
    receiptSidebar: false,
  },
  // â”€â”€ 9. Slate Compact â€” Dense data-first utility layout â”€â”€
  {
    id: "slate-compact",
    name: "Slate Compact",
    description: "Maximum data density with tight systematic layout",
    category: "professional",
    layout: "compact-header",
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
    dateStyle: "line",
    serialStyle: "boxed",
    receiptSidebar: false,
  },
  // â”€â”€ 10. Vintage Ledger â€” Old-school brown accounting aesthetic â”€â”€
  {
    id: "vintage-ledger",
    name: "Vintage Ledger",
    description: "Retro accounting ledger with aged paper warmth",
    category: "classic",
    layout: "grid-info",
    accent: "#3e2723",
    accentSecondary: "#d7ccc8",
    font: "cormorant-proza",
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
    backgroundTint: true,
    dateStyle: "slashed",
    serialStyle: "inline",
    receiptSidebar: false,
  },
  // â”€â”€ 11. Sunset Commerce â€” Vibrant orange with navy contrast â”€â”€
  {
    id: "sunset-commerce",
    name: "Sunset Commerce",
    description: "Energetic orange-to-navy gradient with bold sales appeal",
    category: "commerce",
    layout: "bold-header",
    accent: "#e65100",
    accentSecondary: "#1565c0",
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
    watermark: "none",
    footerStyle: "contact-bar",
    decorative: "top-circles",
    pageBorderWeight: "none",
    headerDividerStyle: "accent-bar",
    accentStrip: "left",
    backgroundTint: false,
    dateStyle: "grid",
    serialStyle: "inline",
    receiptSidebar: false,
  },
  // â”€â”€ 12. Midnight Authority â€” Imposing dark navy with red accent â”€â”€
  {
    id: "midnight-authority",
    name: "Midnight",
    description: "Imposing midnight palette with commanding presence",
    category: "professional",
    layout: "dual-column",
    accent: "#162447",
    accentSecondary: "#c0392b",
    font: "raleway-lato",
    headerStyle: "banner",
    tableStyle: "clean",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: true,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: false,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "boxed",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "bar",
    decorative: "none",
    pageBorderWeight: "thin",
    headerDividerStyle: "thick-line",
    accentStrip: "none",
    backgroundTint: false,
    dateStyle: "line",
    serialStyle: "boxed",
    receiptSidebar: false,
  },
  // â”€â”€ 13. Fuchsia Pop â€” Vibrant creative with purple gradient corners â”€â”€
  {
    id: "fuchsia-pop",
    name: "Fuchsia Pop",
    description: "Bold creative agency style with fuchsia-purple energy",
    category: "minimal",
    layout: "centered",
    accent: "#c2185b",
    accentSecondary: "#7c4dff",
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
    decorative: "corner-gradient",
    pageBorderWeight: "thick",
    headerDividerStyle: "fade",
    accentStrip: "left",
    backgroundTint: false,
    dateStyle: "line",
    serialStyle: "stacked",
    receiptSidebar: false,
  },
  // â”€â”€ 14. Clinical â€” Healthcare precision with calming blue tones â”€â”€
  {
    id: "clinical",
    name: "Clinical",
    description: "Clean medical-grade precision with calming blue tones",
    category: "professional",
    layout: "compact-header",
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
    dateStyle: "slashed",
    serialStyle: "stacked",
    receiptSidebar: false,
  },
  // â”€â”€ 15. Emerald Card â€” Teal receipt card with sidebar accent â”€â”€
  {
    id: "emerald-card",
    name: "Emerald Card",
    description: "Teal receipt card with sidebar accent and mono type",
    category: "commerce",
    layout: "compact-header",
    accent: "#00897b",
    font: "jetbrains-inter",
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
    dateStyle: "slashed",
    serialStyle: "stacked",
    receiptSidebar: true,
    receiptSidebarColor: "#00897b",
  },
  // â”€â”€ 16. Royal Banner â€” Deep purple with gold gradient header â”€â”€
  {
    id: "royal-banner",
    name: "Royal Banner",
    description: "Regal purple-to-gold gradient header with premium feel",
    category: "professional",
    layout: "standard",
    accent: "#4a148c",
    accentSecondary: "#ffd600",
    font: "playfair-source",
    headerStyle: "banner",
    tableStyle: "bordered",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: true,
    headerGradient: true,
    contactIcons: true,
    tableHeaderFill: true,
    tableBorderWeight: "medium",
    totalsBorder: false,
    totalsStyle: "badge",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "bar",
    decorative: "none",
    pageBorderWeight: "thick",
    headerDividerStyle: "accent-bar",
    accentStrip: "none",
    backgroundTint: false,
    dateStyle: "slashed",
    serialStyle: "boxed",
    receiptSidebar: false,
  },
  // â”€â”€ 17. Carbon Tech â€” Dark tech aesthetic with neon green accents â”€â”€
  {
    id: "carbon-tech",
    name: "Carbon Tech",
    description: "Dark tech aesthetic with neon green edge accents",
    category: "minimal",
    layout: "centered",
    accent: "#37474f",
    accentSecondary: "#00e676",
    font: "spacegrotesk-inter",
    headerStyle: "minimal",
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
    pageBorderWeight: "thin",
    headerDividerStyle: "thin-line",
    accentStrip: "left",
    backgroundTint: false,
    dateStyle: "line",
    serialStyle: "inline",
    receiptSidebar: false,
  },
  // â”€â”€ 18. Editorial â€” Magazine-inspired charcoal with amber highlights â”€â”€
  {
    id: "editorial",
    name: "Editorial",
    description: "Magazine-inspired layout with bold type and amber highlights",
    category: "minimal",
    layout: "standard",
    accent: "#212121",
    accentSecondary: "#ff6f00",
    font: "cormorant-proza",
    headerStyle: "left-heavy",
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
    footerStyle: "line",
    decorative: "page-border",
    pageBorderWeight: "none",
    headerDividerStyle: "thick-line",
    accentStrip: "top",
    backgroundTint: false,
    dateStyle: "slashed",
    serialStyle: "inline",
    receiptSidebar: false,
  },
  // â”€â”€ 19. Warm Blush â€” Soft terracotta with blush gradient corners â”€â”€
  {
    id: "warm-blush",
    name: "Warm Blush",
    description: "Soft terracotta warmth with blush gradient accents",
    category: "commerce",
    layout: "grid-info",
    accent: "#bf360c",
    accentSecondary: "#ffccbc",
    font: "bitter-inter",
    headerStyle: "split",
    tableStyle: "clean",
    borderStyle: "none",
    compactSpacing: false,
    headerBand: false,
    headerGradient: false,
    contactIcons: false,
    tableHeaderFill: true,
    tableBorderWeight: "light",
    totalsBorder: false,
    totalsStyle: "boxed",
    fieldSeparators: false,
    watermark: "none",
    footerStyle: "contact-bar",
    decorative: "corner-gradient",
    pageBorderWeight: "none",
    headerDividerStyle: "fade",
    accentStrip: "none",
    backgroundTint: true,
    dateStyle: "grid",
    serialStyle: "stacked",
    receiptSidebar: false,
  },
  // â”€â”€ 20. Redline â€” Typographic modernism with bold red accents â”€â”€
  {
    id: "redline",
    name: "Redline",
    description: "International typographic style with bold red accents",
    category: "classic",
    layout: "dual-column",
    accent: "#d32f2f",
    font: "crimsonpro-worksans",
    headerStyle: "left-heavy",
    tableStyle: "minimal",
    borderStyle: "solid",
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
    footerStyle: "none",
    decorative: "none",
    pageBorderWeight: "none",
    headerDividerStyle: "thin-line",
    accentStrip: "top",
    backgroundTint: false,
    dateStyle: "line",
    serialStyle: "boxed",
    receiptSidebar: false,
  },
];

export type SalesBookTemplateId = (typeof SALES_BOOK_TEMPLATES)[number]["id"];
