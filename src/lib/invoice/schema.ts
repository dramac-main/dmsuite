// =============================================================================
// DMSuite — Sales Document Schema
// Zod-validated schema for invoices, quotations, receipts, delivery notes,
// credit notes, proforma invoices, and purchase orders.
// Single source of truth for the entire Sales Document Suite.
// =============================================================================

import { z } from "zod";
import type { CustomBlock } from "@/lib/sales-book/custom-blocks";

// ---------------------------------------------------------------------------
// Sales Document Types
// ---------------------------------------------------------------------------

export const SALES_DOCUMENT_TYPES = [
  "invoice",
  "quotation",
  "receipt",
  "delivery-note",
  "credit-note",
  "proforma-invoice",
  "purchase-order",
] as const;

export type SalesDocumentType = (typeof SALES_DOCUMENT_TYPES)[number];

/** Configuration for each document type — titles, prefixes, statuses, labels */
export interface DocumentTypeConfig {
  id: SalesDocumentType;
  label: string;
  title: string;
  description: string;
  numberPrefix: string;
  icon: string;
  /** Labels specific to this document type */
  recipientLabel: string;   // "Bill To" / "Quote For" / "Deliver To" / etc.
  senderLabel: string;      // "Bill From" / "Vendor" / etc.
  numberLabel: string;      // "Invoice #" / "Quote #" / "Receipt #" / etc.
  amountLabel: string;      // "Amount Due" / "Estimated Total" / "Amount Paid" / etc.
  /** Available status options */
  statuses: readonly string[];
  /** Default terms text */
  defaultTerms: string;
  /** Whether this type supports due date */
  hasDueDate: boolean;
  /** Whether this type shows payment info */
  showPaymentInfo: boolean;
  /** Whether receipt layout (3-per-page) */
  receiptLayout: boolean;
}

export const DOCUMENT_TYPE_CONFIGS: Record<SalesDocumentType, DocumentTypeConfig> = {
  invoice: {
    id: "invoice",
    label: "Invoice",
    title: "INVOICE",
    description: "Bill for goods or services rendered",
    numberPrefix: "INV",
    icon: "receipt",
    recipientLabel: "Bill To",
    senderLabel: "Bill From",
    numberLabel: "Invoice #",
    amountLabel: "Amount Due",
    statuses: ["draft", "sent", "paid", "overdue", "cancelled"] as const,
    defaultTerms: "Payment is due within the specified terms. Late payments may incur a fee of 1.5% per month.",
    hasDueDate: true,
    showPaymentInfo: true,
    receiptLayout: false,
  },
  quotation: {
    id: "quotation",
    label: "Quotation",
    title: "QUOTATION",
    description: "Price estimate for goods or services",
    numberPrefix: "QUO",
    icon: "clipboardList",
    recipientLabel: "Quote For",
    senderLabel: "From",
    numberLabel: "Quote #",
    amountLabel: "Estimated Total",
    statuses: ["draft", "sent", "accepted", "rejected", "expired"] as const,
    defaultTerms: "This quotation is valid for 30 days from the date of issue. Prices are subject to change after the validity period.",
    hasDueDate: false,
    showPaymentInfo: false,
    receiptLayout: false,
  },
  receipt: {
    id: "receipt",
    label: "Receipt",
    title: "RECEIPT",
    description: "Proof of payment received",
    numberPrefix: "RCT",
    icon: "checkCircle",
    recipientLabel: "Received From",
    senderLabel: "Issued By",
    numberLabel: "Receipt #",
    amountLabel: "Amount Paid",
    statuses: ["issued", "void"] as const,
    defaultTerms: "This receipt confirms payment received. No refunds unless stated otherwise.",
    hasDueDate: false,
    showPaymentInfo: false,
    receiptLayout: true,
  },
  "delivery-note": {
    id: "delivery-note",
    label: "Delivery Note",
    title: "DELIVERY NOTE",
    description: "Accompanies goods during delivery",
    numberPrefix: "DN",
    icon: "truck",
    recipientLabel: "Deliver To",
    senderLabel: "Ship From",
    numberLabel: "Delivery Note #",
    amountLabel: "Total Items",
    statuses: ["draft", "dispatched", "delivered", "returned"] as const,
    defaultTerms: "Please inspect goods upon delivery. Report any damage or discrepancy within 48 hours.",
    hasDueDate: false,
    showPaymentInfo: false,
    receiptLayout: false,
  },
  "credit-note": {
    id: "credit-note",
    label: "Credit Note",
    title: "CREDIT NOTE",
    description: "Refund or adjustment to a previous invoice",
    numberPrefix: "CN",
    icon: "arrowDownCircle",
    recipientLabel: "Credit To",
    senderLabel: "Issued By",
    numberLabel: "Credit Note #",
    amountLabel: "Credit Amount",
    statuses: ["draft", "issued", "applied", "void"] as const,
    defaultTerms: "This credit note can be applied against future invoices or refunded upon request.",
    hasDueDate: false,
    showPaymentInfo: true,
    receiptLayout: false,
  },
  "proforma-invoice": {
    id: "proforma-invoice",
    label: "Proforma Invoice",
    title: "PROFORMA INVOICE",
    description: "Preliminary invoice before final sale",
    numberPrefix: "PI",
    icon: "fileText",
    recipientLabel: "Bill To",
    senderLabel: "From",
    numberLabel: "Proforma #",
    amountLabel: "Estimated Amount",
    statuses: ["draft", "sent", "confirmed", "expired"] as const,
    defaultTerms: "This is a proforma invoice for your reference. Final invoice will be issued upon confirmation of order.",
    hasDueDate: true,
    showPaymentInfo: true,
    receiptLayout: false,
  },
  "purchase-order": {
    id: "purchase-order",
    label: "Purchase Order",
    title: "PURCHASE ORDER",
    description: "Official order request to a vendor/supplier",
    numberPrefix: "PO",
    icon: "shoppingCart",
    recipientLabel: "Vendor / Supplier",
    senderLabel: "Ordered By",
    numberLabel: "P.O. #",
    amountLabel: "Order Total",
    statuses: ["draft", "sent", "confirmed", "received", "cancelled"] as const,
    defaultTerms: "This purchase order is subject to the terms and conditions agreed upon with the supplier.",
    hasDueDate: true,
    showPaymentInfo: false,
    receiptLayout: false,
  },
};

// ---------------------------------------------------------------------------
// Enums & Constants
// ---------------------------------------------------------------------------

export const INVOICE_TEMPLATE_IDS = [
  "modern-clean",
  "classic-professional",
  "minimal-white",
  "bold-corporate",
  "elegant-line",
  "tech-startup",
  "creative-studio",
  "executive-premium",
  "freelancer-simple",
  "international",
] as const;

export type InvoiceTemplateId = (typeof INVOICE_TEMPLATE_IDS)[number];

export const PAGE_FORMATS = ["a4", "a5", "letter", "legal"] as const;
export type PageFormat = (typeof PAGE_FORMATS)[number];

/**
 * Pixel dimensions at 96 CSS PPI (standard screen resolution).
 * A4:     210 × 297 mm  = 8.267 × 11.693 in → 794 × 1123 px
 * A5:     148 × 210 mm  = 5.827 × 8.268 in  → 559 × 794 px
 * Letter: 8.5 × 11 in   → 816 × 1056 px
 * Legal:  8.5 × 14 in   → 816 × 1344 px
 */
export const PAGE_DIMENSIONS: Record<PageFormat, { w: number; h: number; label: string }> = {
  a4:     { w: 794, h: 1123, label: "A4 (210 × 297mm)" },
  a5:     { w: 559, h: 794,  label: "A5 (148 × 210mm)" },
  letter: { w: 816, h: 1056, label: "US Letter (8.5 × 11in)" },
  legal:  { w: 816, h: 1344, label: "US Legal (8.5 × 14in)" },
};

export const CURRENCIES = [
  { code: "USD", symbol: "$",  name: "US Dollar",        locale: "en-US" },
  { code: "EUR", symbol: "€",  name: "Euro",             locale: "de-DE" },
  { code: "GBP", symbol: "£",  name: "British Pound",    locale: "en-GB" },
  { code: "ZMW", symbol: "K",  name: "Zambian Kwacha",   locale: "en-ZM" },
  { code: "ZAR", symbol: "R",  name: "South African Rand", locale: "en-ZA" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", locale: "en-KE" },
  { code: "NGN", symbol: "₦",  name: "Nigerian Naira",   locale: "en-NG" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar",   locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "INR", symbol: "₹",  name: "Indian Rupee",     locale: "en-IN" },
  { code: "JPY", symbol: "¥",  name: "Japanese Yen",     locale: "ja-JP" },
  { code: "CNY", symbol: "¥",  name: "Chinese Yuan",     locale: "zh-CN" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real",   locale: "pt-BR" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc",     locale: "de-CH" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona",    locale: "sv-SE" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham",      locale: "ar-AE" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const PAYMENT_TERMS = [
  { id: "receipt",  label: "Due on Receipt", days: 0 },
  { id: "net7",     label: "Net 7",          days: 7 },
  { id: "net15",    label: "Net 15",         days: 15 },
  { id: "net30",    label: "Net 30",         days: 30 },
  { id: "net45",    label: "Net 45",         days: 45 },
  { id: "net60",    label: "Net 60",         days: 60 },
  { id: "net90",    label: "Net 90",         days: 90 },
  { id: "custom",   label: "Custom",         days: null },
] as const;

export type PaymentTermsId = (typeof PAYMENT_TERMS)[number]["id"];

export const DISCOUNT_TYPES = ["percent", "fixed"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const FONT_PAIRINGS = [
  { id: "inter-inter",           heading: "Inter",              body: "Inter",              label: "Inter (Clean)" },
  { id: "poppins-inter",         heading: "Poppins",            body: "Inter",              label: "Poppins + Inter" },
  { id: "playfair-source",       heading: "Playfair Display",   body: "Source Sans 3",      label: "Playfair + Source" },
  { id: "montserrat-opensans",   heading: "Montserrat",         body: "Open Sans",          label: "Montserrat + Open Sans" },
  { id: "raleway-lato",          heading: "Raleway",            body: "Lato",               label: "Raleway + Lato" },
  { id: "dmserif-dmsans",        heading: "DM Serif Display",   body: "DM Sans",            label: "DM Serif + DM Sans" },
  { id: "bitter-inter",          heading: "Bitter",             body: "Inter",              label: "Bitter + Inter" },
  { id: "ibmplex-ibmplex",       heading: "IBM Plex Sans",      body: "IBM Plex Sans",      label: "IBM Plex (Corporate)" },
  { id: "jetbrains-inter",       heading: "JetBrains Mono",     body: "Inter",              label: "JetBrains + Inter" },
  { id: "cormorant-proza",       heading: "Cormorant Garamond", body: "Proza Libre",        label: "Cormorant + Proza" },
  { id: "spacegrotesk-inter",    heading: "Space Grotesk",      body: "Inter",              label: "Space Grotesk + Inter" },
  { id: "crimsonpro-worksans",   heading: "Crimson Pro",        body: "Work Sans",          label: "Crimson + Work Sans" },
] as const;

export type FontPairingId = (typeof FONT_PAIRINGS)[number]["id"];

export const ACCENT_COLORS = [
  { id: "deep-blue",    hex: "#1e40af", label: "Deep Blue" },
  { id: "navy",         hex: "#0f172a", label: "Navy" },
  { id: "teal",         hex: "#0f766e", label: "Teal" },
  { id: "emerald",      hex: "#059669", label: "Emerald" },
  { id: "indigo",       hex: "#4338ca", label: "Indigo" },
  { id: "purple",       hex: "#7c3aed", label: "Purple" },
  { id: "crimson",      hex: "#b91c1c", label: "Crimson" },
  { id: "coral",        hex: "#c2410c", label: "Coral" },
  { id: "gold",         hex: "#b45309", label: "Gold" },
  { id: "slate",        hex: "#475569", label: "Slate" },
  { id: "charcoal",     hex: "#1f2937", label: "Charcoal" },
  { id: "ocean",        hex: "#0e7490", label: "Ocean" },
] as const;

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const businessInfoSchema = z.object({
  name:     z.string().default(""),
  address:  z.string().default(""),
  email:    z.string().default(""),
  phone:    z.string().default(""),
  website:  z.string().default(""),
  taxId:    z.string().default(""),
  logoUrl:  z.string().optional(),
});

export const clientInfoSchema = z.object({
  name:     z.string().default(""),
  company:  z.string().default(""),
  address:  z.string().default(""),
  email:    z.string().default(""),
  phone:    z.string().default(""),
  taxId:    z.string().default(""),
});

export const lineItemSchema = z.object({
  id:           z.string(),
  description:  z.string().default(""),
  quantity:     z.number().min(0).default(1),
  unitPrice:    z.number().min(0).default(0),
  discountType: z.enum(DISCOUNT_TYPES).default("percent"),
  discountValue: z.number().min(0).default(0),
  taxRate:      z.number().min(0).max(100).default(0),
});

export const additionalChargeSchema = z.object({
  id:      z.string(),
  label:   z.string().default(""),
  amount:  z.number().default(0),
  type:    z.enum(["fixed", "percent"]).default("fixed"),
});

export const currencyConfigSchema = z.object({
  code:   z.string().default("USD"),
  symbol: z.string().default("$"),
  locale: z.string().default("en-US"),
});

export const taxConfigSchema = z.object({
  rate:        z.number().min(0).max(100).default(0),
  label:       z.string().default("Tax"),
  isInclusive: z.boolean().default(false),
  secondaryRate:  z.number().min(0).max(100).default(0),
  secondaryLabel: z.string().default(""),
});

export const paymentInfoSchema = z.object({
  bankName:      z.string().default(""),
  accountName:   z.string().default(""),
  accountNumber: z.string().default(""),
  routingNumber: z.string().default(""),
  swiftCode:     z.string().default(""),
  paypalEmail:   z.string().default(""),
  notes:         z.string().default(""),
});

export const signatureSchema = z.object({
  name:  z.string().default(""),
  title: z.string().default(""),
});

export const invoiceMetadataSchema = z.object({
  template:    z.string().default("modern-clean"),
  accentColor: z.string().default("#1e40af"),
  fontPairing: z.string().default("inter-inter"),
  pageFormat:  z.enum(PAGE_FORMATS).default("a4"),
  showLogo:    z.boolean().default(true),
  showPaymentInfo: z.boolean().default(true),
  showSignature:   z.boolean().default(false),
  showNotes:       z.boolean().default(true),
  showTaxBreakdown: z.boolean().default(true),
  headerStyle:  z.enum(["full", "compact", "minimal"]).default("full"),
  tableStyle:   z.enum(["striped", "bordered", "clean", "minimal"]).default("striped"),
  footerText:   z.string().default(""),
  watermark:    z.string().default(""),
});

export const invoiceDataSchema = z.object({
  documentType:   z.enum(SALES_DOCUMENT_TYPES).default("invoice"),
  businessInfo:   businessInfoSchema,
  clientInfo:     clientInfoSchema,
  invoiceNumber:  z.string().default("INV-001"),
  issueDate:      z.string().default(""),
  dueDate:        z.string().default(""),
  poNumber:       z.string().default(""),
  paymentTerms:   z.string().default("net30"),
  status:         z.enum(INVOICE_STATUSES).default("draft"),
  lineItems:      z.array(lineItemSchema).default([]),
  additionalCharges: z.array(additionalChargeSchema).default([]),
  currency:       currencyConfigSchema,
  tax:            taxConfigSchema,
  paymentInfo:    paymentInfoSchema,
  signature:      signatureSchema,
  notes:          z.string().default(""),
  terms:          z.string().default(""),
  metadata:       invoiceMetadataSchema,
  customBlocks:   z.array(z.any()).default([]) as unknown as z.ZodType<CustomBlock[]>,
});

// ---------------------------------------------------------------------------
// TypeScript Types (inferred from Zod)
// ---------------------------------------------------------------------------

export type BusinessInfo     = z.infer<typeof businessInfoSchema>;
export type ClientInfo       = z.infer<typeof clientInfoSchema>;
export type LineItem         = z.infer<typeof lineItemSchema>;
export type AdditionalCharge = z.infer<typeof additionalChargeSchema>;
export type CurrencyConfig   = z.infer<typeof currencyConfigSchema>;
export type TaxConfig        = z.infer<typeof taxConfigSchema>;
export type PaymentInfo      = z.infer<typeof paymentInfoSchema>;
export type Signature        = z.infer<typeof signatureSchema>;
export type InvoiceMetadata  = z.infer<typeof invoiceMetadataSchema>;
export type InvoiceData      = z.infer<typeof invoiceDataSchema>;

// ---------------------------------------------------------------------------
// Calculation Helpers
// ---------------------------------------------------------------------------

/** Calculate line item total after discount */
export function calcLineItemTotal(item: LineItem): number {
  const gross = item.quantity * item.unitPrice;
  if (item.discountValue <= 0) return gross;
  if (item.discountType === "percent") {
    return gross * (1 - Math.min(item.discountValue, 100) / 100);
  }
  return Math.max(0, gross - item.discountValue);
}

/** Calculate line item discount amount */
export function calcLineItemDiscount(item: LineItem): number {
  const gross = item.quantity * item.unitPrice;
  return gross - calcLineItemTotal(item);
}

/** Calculate line item tax amount */
export function calcLineItemTax(item: LineItem): number {
  const afterDiscount = calcLineItemTotal(item);
  return afterDiscount * (item.taxRate / 100);
}

/** Calculate all invoice totals */
export function calcInvoiceTotals(data: InvoiceData): {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  additionalChargesTotal: number;
  grandTotal: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  for (const item of data.lineItems) {
    const gross = item.quantity * item.unitPrice;
    const afterDiscount = calcLineItemTotal(item);
    subtotal += afterDiscount;
    totalDiscount += gross - afterDiscount;

    // Per-item tax OR global tax
    if (item.taxRate > 0) {
      totalTax += afterDiscount * (item.taxRate / 100);
    }
  }

  // If no per-item tax, apply global tax
  if (totalTax === 0 && data.tax.rate > 0) {
    if (data.tax.isInclusive) {
      totalTax = subtotal - subtotal / (1 + data.tax.rate / 100);
    } else {
      totalTax = subtotal * (data.tax.rate / 100);
    }
  }

  // Secondary tax (e.g., state tax + federal tax)
  if (data.tax.secondaryRate > 0) {
    totalTax += subtotal * (data.tax.secondaryRate / 100);
  }

  let additionalChargesTotal = 0;
  for (const c of data.additionalCharges) {
    if (c.type === "percent") {
      additionalChargesTotal += subtotal * (c.amount / 100);
    } else {
      additionalChargesTotal += c.amount;
    }
  }

  const grandTotal = subtotal + totalTax + additionalChargesTotal;
  return { subtotal, totalDiscount, totalTax, additionalChargesTotal, grandTotal };
}

/** Format money with currency */
export function formatMoney(amount: number, currency: CurrencyConfig): string {
  try {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}

/** Calculate due date from issue date and payment terms */
export function calcDueDate(issueDate: string, termsId: string): string {
  if (!issueDate) return "";
  const term = PAYMENT_TERMS.find((t) => t.id === termsId);
  if (!term || term.days === null || term.days === 0) return "";
  const d = new Date(issueDate);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + term.days);
  return d.toISOString().slice(0, 10);
}

/** Format date for display */
export function formatDate(dateStr: string, locale = "en-US"): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Generate next invoice number */
export function nextInvoiceNumber(current: string): string {
  const match = current.match(/(\D*)(\d+)$/);
  if (!match) return current;
  const prefix = match[1];
  const num = parseInt(match[2], 10) + 1;
  const padded = String(num).padStart(match[2].length, "0");
  return `${prefix}${padded}`;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let _idCounter = 0;
export function createItemId(): string {
  return `inv_${Date.now().toString(36)}_${(++_idCounter).toString(36)}`;
}

export function createDefaultLineItem(): LineItem {
  return {
    id: createItemId(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    discountType: "percent",
    discountValue: 0,
    taxRate: 0,
  };
}

export function createDefaultInvoiceData(docType: SalesDocumentType = "invoice"): InvoiceData {
  const config = DOCUMENT_TYPE_CONFIGS[docType];
  const today = new Date().toISOString().slice(0, 10);
  return {
    documentType: docType,
    businessInfo: {
      name: "",
      address: "",
      email: "",
      phone: "",
      website: "",
      taxId: "",
    },
    clientInfo: {
      name: "",
      company: "",
      address: "",
      email: "",
      phone: "",
      taxId: "",
    },
    invoiceNumber: `${config.numberPrefix}0001`,
    issueDate: today,
    dueDate: config.hasDueDate ? calcDueDate(today, "net30") : "",
    poNumber: "",
    paymentTerms: config.hasDueDate ? "net30" : "due-on-receipt",
    status: "draft",
    lineItems: [createDefaultLineItem()],
    additionalCharges: [],
    currency: { code: "USD", symbol: "$", locale: "en-US" },
    tax: { rate: 0, label: "Tax", isInclusive: false, secondaryRate: 0, secondaryLabel: "" },
    paymentInfo: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      routingNumber: "",
      swiftCode: "",
      paypalEmail: "",
      notes: "",
    },
    signature: { name: "", title: "" },
    notes: "",
    terms: config.defaultTerms,
    metadata: {
      template: "modern-clean",
      accentColor: "#1e40af",
      fontPairing: "inter-inter",
      pageFormat: "a4",
      showLogo: true,
      showPaymentInfo: config.showPaymentInfo,
      showSignature: false,
      showNotes: true,
      showTaxBreakdown: true,
      headerStyle: "full",
      tableStyle: "striped",
      footerText: "",
      watermark: "",
    },
    customBlocks: [],
  };
}

/** Sample invoice data for template previews — shows realistic content */
export function createSampleInvoiceData(
  overrides?: Partial<InvoiceMetadata>,
  docType: SalesDocumentType = "invoice",
): InvoiceData {
  const config = DOCUMENT_TYPE_CONFIGS[docType];
  const today = new Date().toISOString().slice(0, 10);

  // Per-type sample number
  const sampleNumbers: Record<SalesDocumentType, string> = {
    "invoice":            "INV-0047",
    "quotation":          "QUO-0023",
    "receipt":            "RCT-0156",
    "delivery-note":      "DN-0089",
    "credit-note":        "CN-0012",
    "proforma-invoice":   "PI-0031",
    "purchase-order":     "PO-0064",
  };

  // Per-type sample terms
  const sampleTerms: Record<SalesDocumentType, string> = {
    "invoice":            "Payment is due within 30 days. Late payments may incur a fee of 1.5% per month on the outstanding balance.",
    "quotation":          "This quotation is valid for 30 days from the date of issue. Prices are subject to change after this period.",
    "receipt":            "This receipt confirms payment has been received in full. Please keep for your records.",
    "delivery-note":      "Please inspect all goods upon delivery. Report any discrepancies within 48 hours.",
    "credit-note":        "This credit note may be applied against future invoices or refunded as per company policy.",
    "proforma-invoice":   "This is a proforma invoice for informational purposes. It is not a demand for payment.",
    "purchase-order":     "Please confirm receipt of this purchase order and expected delivery date within 5 business days.",
  };

  // Per-type sample notes
  const sampleNotes: Record<SalesDocumentType, string> = {
    "invoice":            "Thank you for choosing Meridian Studios. We look forward to continuing our partnership.",
    "quotation":          "We are excited to propose this package. Final pricing will be confirmed upon acceptance.",
    "receipt":            "Thank you for your payment. We appreciate your continued business.",
    "delivery-note":      "All items have been inspected prior to dispatch. Signature required upon delivery.",
    "credit-note":        "Credit issued for the returned items. Adjustment reflected in your account.",
    "proforma-invoice":   "This proforma is provided for customs and budgeting purposes.",
    "purchase-order":     "Please deliver to the address above during business hours (9AM – 5PM).",
  };

  return {
    documentType: docType,
    businessInfo: {
      name: "Meridian Studios",
      address: "742 Innovation Drive\nSan Francisco, CA 94107",
      email: "hello@meridianstudios.co",
      phone: "+1 (415) 555-0132",
      website: "meridianstudios.co",
      taxId: "US-87-4402891",
    },
    clientInfo: {
      name: "Sarah Chen",
      company: "NovaTech Solutions",
      address: "1200 Park Avenue, Suite 400\nNew York, NY 10128",
      email: "sarah.chen@novatech.io",
      phone: "+1 (212) 555-0198",
      taxId: "",
    },
    invoiceNumber: sampleNumbers[docType],
    issueDate: today,
    dueDate: config.hasDueDate ? calcDueDate(today, "net30") : "",
    poNumber: docType === "purchase-order" ? "" : "PO-2024-1182",
    paymentTerms: config.hasDueDate ? "net30" : "due-on-receipt",
    status: "draft",
    lineItems: [
      { id: "s1", description: "Brand Identity Design", quantity: 1, unitPrice: 3500, discountType: "percent", discountValue: 0, taxRate: 0 },
      { id: "s2", description: "Website UI/UX Design — 12 pages", quantity: 1, unitPrice: 4800, discountType: "percent", discountValue: 0, taxRate: 0 },
      { id: "s3", description: "Frontend Development", quantity: 40, unitPrice: 125, discountType: "percent", discountValue: 0, taxRate: 0 },
      { id: "s4", description: "Project Management & QA", quantity: 16, unitPrice: 95, discountType: "percent", discountValue: 0, taxRate: 0 },
    ],
    additionalCharges: [],
    currency: { code: "USD", symbol: "$", locale: "en-US" },
    tax: { rate: 8.5, label: "Sales Tax", isInclusive: false, secondaryRate: 0, secondaryLabel: "" },
    paymentInfo: {
      bankName: "First National Bank",
      accountName: "Meridian Studios LLC",
      accountNumber: "****4821",
      routingNumber: "021000089",
      swiftCode: "FNBKUS33",
      paypalEmail: "",
      notes: "",
    },
    signature: { name: "Alex Rivera", title: "Creative Director" },
    notes: sampleNotes[docType],
    terms: sampleTerms[docType],
    metadata: {
      template: "modern-clean",
      accentColor: "#1e40af",
      fontPairing: "inter-inter",
      pageFormat: "a4",
      showLogo: true,
      showPaymentInfo: config.showPaymentInfo,
      showSignature: true,
      showNotes: true,
      showTaxBreakdown: true,
      headerStyle: "full",
      tableStyle: "striped",
      footerText: "",
      watermark: "",
      ...overrides,
    },
    customBlocks: [],
  };
}

/** Compute CSS variables from invoice metadata for template injection */
export function computeCSSVariables(metadata: InvoiceMetadata): Record<string, string> {
  const fp = FONT_PAIRINGS.find((f) => f.id === metadata.fontPairing) ?? FONT_PAIRINGS[0];
  return {
    "--inv-accent":       metadata.accentColor,
    "--inv-accent-light": metadata.accentColor + "1a",
    "--inv-accent-mid":   metadata.accentColor + "33",
    "--inv-heading-font": `'${fp.heading}', sans-serif`,
    "--inv-body-font":    `'${fp.body}', sans-serif`,
  };
}

/** Convert an existing document to a different sales document type */
export function convertDocumentType(
  data: InvoiceData,
  targetType: SalesDocumentType,
): InvoiceData {
  const config = DOCUMENT_TYPE_CONFIGS[targetType];
  const currentNum = data.invoiceNumber.replace(/^[A-Z]+-/, "");
  return {
    ...data,
    documentType: targetType,
    invoiceNumber: `${config.numberPrefix}${currentNum}`,
    dueDate: config.hasDueDate ? data.dueDate : "",
    paymentTerms: config.hasDueDate ? data.paymentTerms : "due-on-receipt",
    status: "draft",
    terms: data.terms || config.defaultTerms,
    metadata: {
      ...data.metadata,
      showPaymentInfo: config.showPaymentInfo,
    },
  };
}

/** Get the display config for a document type */
export function getDocumentTypeConfig(type: SalesDocumentType): DocumentTypeConfig {
  return DOCUMENT_TYPE_CONFIGS[type];
}
