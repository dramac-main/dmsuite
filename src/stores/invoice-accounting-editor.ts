"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";

// =============================================================================
// DMSuite — Invoice & Accounting Hub — Zustand Store
// Full invoicing, quoting, payments, expenses, time tracking, clients, products,
// reports — tailored for Zambian businesses with ZRA/NAPSA compliance.
// Inspired by Invoice Ninja (invoiceninja.com)
// =============================================================================

// ━━━ Enums & Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type CurrencyCode = "ZMW" | "USD" | "EUR" | "GBP" | "ZAR" | "BWP";
export type TaxMode = "inclusive" | "exclusive";
export type InvoiceStatus = "draft" | "sent" | "viewed" | "partial" | "paid" | "overdue" | "cancelled";
export type QuoteStatus = "draft" | "sent" | "approved" | "declined" | "expired" | "converted";
export type CreditNoteStatus = "draft" | "sent" | "applied" | "void";
export type PaymentMethod = "cash" | "bank-transfer" | "mobile-money" | "card" | "cheque" | "other";
export type ExpenseCategory = "office" | "travel" | "supplies" | "utilities" | "marketing" | "payroll" | "rent" | "insurance" | "professional-services" | "equipment" | "other";
export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "semi-annual" | "annual";
export type ProjectStatus = "active" | "completed" | "on-hold";
export type PurchaseOrderStatus = "draft" | "sent" | "accepted" | "received" | "cancelled";

export type ViewType =
  | "dashboard"
  | "invoices" | "invoice-edit"
  | "quotes" | "quote-edit"
  | "payments"
  | "clients" | "client-edit"
  | "products" | "product-edit"
  | "expenses" | "expense-edit"
  | "vendors" | "vendor-edit"
  | "projects" | "project-edit"
  | "time-tracking"
  | "credit-notes" | "credit-note-edit"
  | "purchase-orders" | "purchase-order-edit"
  | "reports"
  | "settings"
  | "zra-smart-invoice"
  | "napsa-returns" | "napsa-employees";

export type ReportType = "revenue" | "profit-loss" | "tax-summary" | "aging" | "client-statement" | "expense-summary" | "paye-report" | "napsa-report";

// ━━━ Core Interfaces ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
  isCompound: boolean;  // Applied on top of other taxes
  description: string;
}

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  country: string;
  taxId: string;        // TPIN for Zambia
  currency: CurrencyCode;
  paymentTerms: number; // Days
  notes: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  cost: number;         // Cost price for profit calculations
  taxRateId: string;
  unit: string;
  sku: string;
  inStock: number;
  trackInventory: boolean;
  category: string;
  isService: boolean;
}

export interface LineItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId: string;
  taxRate: number;
  taxName: string;
  discount: number;     // Per-line discount %
}

export interface RecurringConfig {
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;
  autoSend: boolean;
  nextDate: string;
  remainingCycles: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  lineItems: LineItem[];
  taxMode: TaxMode;
  discount: { type: "percent" | "fixed"; value: number };
  notes: string;
  terms: string;
  footer: string;
  currency: CurrencyCode;
  isRecurring: boolean;
  recurringConfig: RecurringConfig | null;
  paidAt: string;
  sentAt: string;
  createdAt: string;
  depositAmount: number;      // Required deposit
  depositPaid: boolean;
  poNumber: string;           // Client's PO reference
  customFields: Record<string, string>;
  // ZRA Smart Invoice tracking
  zraStatus: "not-submitted" | "pending" | "submitted" | "verified" | "error";
  zraReceiptNo: string;
  zraSubmittedAt: string;
  zraErrorMessage: string;
}

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  status: QuoteStatus;
  date: string;
  validUntil: string;
  lineItems: LineItem[];
  taxMode: TaxMode;
  discount: { type: "percent" | "fixed"; value: number };
  notes: string;
  terms: string;
  footer: string;
  currency: CurrencyCode;
  convertedToInvoiceId: string;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  number: string;
  clientId: string;
  invoiceId: string;
  status: CreditNoteStatus;
  date: string;
  lineItems: LineItem[];
  reason: string;
  appliedToInvoices: Array<{ invoiceId: string; amount: number }>;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
  currency: CurrencyCode;
  createdAt: string;
}

export interface Expense {
  id: string;
  vendorId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  reference: string;
  taxRateId: string;
  taxRate: number;
  isDeductible: boolean;
  isBillable: boolean;
  invoiceId: string;
  projectId: string;
  currency: CurrencyCode;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  notes: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  vendorId: string;
  status: PurchaseOrderStatus;
  date: string;
  expectedDate: string;
  lineItems: LineItem[];
  taxMode: TaxMode;
  discount: { type: "percent" | "fixed"; value: number };
  notes: string;
  terms: string;
  currency: CurrencyCode;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  budgetHours: number;
  budgetAmount: number;
  hourlyRate: number;
  status: ProjectStatus;
  notes: string;
  color: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;     // Minutes
  hourlyRate: number;
  isBillable: boolean;
  invoiced: boolean;
  invoiceId: string;
  createdAt: string;
}

// ━━━ NAPSA Employee Management ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface NAPSAEmployee {
  id: string;
  name: string;
  nrcNumber: string;          // National Registration Card number
  napsaMemberNo: string;      // NAPSA membership number
  grossSalary: number;        // Monthly gross salary
  department: string;
  position: string;
  startDate: string;
  isActive: boolean;
}

export interface NAPSAReturn {
  id: string;
  month: string;              // YYYY-MM format
  employeeContributions: Array<{
    employeeId: string;
    grossSalary: number;
    employeeAmount: number;   // 5% capped at K1,221.80
    employerAmount: number;   // 5% capped at K1,221.80
    totalAmount: number;
  }>;
  totalEmployeeContrib: number;
  totalEmployerContrib: number;
  grandTotal: number;
  status: "draft" | "submitted" | "paid";
  submittedAt: string;
  paidAt: string;
  createdAt: string;
}

// ━━━ Style ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type InvoiceTemplate = "professional" | "modern" | "classic" | "minimal" | "bold";

export interface InvoiceStyle {
  template: InvoiceTemplate;
  accentColor: string;
  fontFamily: string;
  showLogo: boolean;
  showPaymentInfo: boolean;
  showSignatureLine: boolean;
  showQRCode: boolean;
  showWatermark: boolean;
  watermarkText: string;
}

// ━━━ Business Settings ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BusinessSettings {
  name: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;              // TPIN
  napsaNumber: string;        // NAPSA employer number
  logoUrl: string;
  currency: CurrencyCode;
  taxMode: TaxMode;
  defaultPaymentTerms: number;
  invoicePrefix: string;
  quotePrefix: string;
  creditPrefix: string;
  poPrefix: string;
  nextInvoiceNumber: number;
  nextQuoteNumber: number;
  nextCreditNumber: number;
  nextPONumber: number;
  defaultNotes: string;
  defaultTerms: string;
  defaultFooter: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankSwiftCode: string;
  mobileMoneyName: string;
  mobileMoneyNumber: string;
  mobileMoneyProvider: string;
  // ZRA Smart Invoice VSDC Configuration
  zraEnabled: boolean;
  zraVsdcUrl: string;         // Local VSDC device URL (e.g. http://localhost:8080)
  zraBranchId: string;        // Branch ID (e.g. "000")
  zraDeviceSerialNo: string;  // Device serial number
  zraAutoSubmit: boolean;     // Auto-submit invoices to ZRA on approval
}

// ━━━ Main Form ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface InvoiceAccountingForm {
  business: BusinessSettings;
  taxes: TaxRate[];
  clients: Client[];
  products: Product[];
  vendors: Vendor[];
  invoices: Invoice[];
  quotes: Quote[];
  creditNotes: CreditNote[];
  purchaseOrders: PurchaseOrder[];
  payments: Payment[];
  expenses: Expense[];
  projects: Project[];
  timeEntries: TimeEntry[];
  // NAPSA
  napsaEmployees: NAPSAEmployee[];
  napsaReturns: NAPSAReturn[];
  style: InvoiceStyle;
  activeView: ViewType;
  activeRecordId: string | null;
  selectedIds: string[];
  reportType: ReportType;
  reportDateRange: { start: string; end: string };
  activeTimerProjectId: string | null;
  activeTimerStart: string | null;
}

// ━━━ Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; name: string; locale: string }> = {
  ZMW: { symbol: "K", name: "Zambian Kwacha", locale: "en-ZM" },
  USD: { symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { symbol: "€", name: "Euro", locale: "de-DE" },
  GBP: { symbol: "£", name: "British Pound", locale: "en-GB" },
  ZAR: { symbol: "R", name: "South African Rand", locale: "en-ZA" },
  BWP: { symbol: "P", name: "Botswana Pula", locale: "en-BW" },
};

export const DEFAULT_TAX_RATES: TaxRate[] = [
  { id: "vat-standard", name: "VAT (Standard)", rate: 16, isDefault: true, isCompound: false, description: "Standard ZRA VAT rate — most goods & services" },
  { id: "vat-zero", name: "VAT (Zero-Rated)", rate: 0, isDefault: false, isCompound: false, description: "Zero-rated — exports, basic foods, agricultural inputs" },
  { id: "vat-exempt", name: "VAT Exempt", rate: 0, isDefault: false, isCompound: false, description: "Exempt — financial services, education, health" },
  { id: "turnover-tax", name: "Turnover Tax", rate: 4, isDefault: false, isCompound: false, description: "Turnover tax for businesses under K800,000/year" },
  { id: "wht-services", name: "WHT – Services", rate: 15, isDefault: false, isCompound: false, description: "Withholding tax on contract services" },
  { id: "wht-rent", name: "WHT – Rent", rate: 10, isDefault: false, isCompound: false, description: "Withholding tax on rental income" },
  { id: "wht-dividends", name: "WHT – Dividends", rate: 20, isDefault: false, isCompound: false, description: "Withholding tax on dividend payments" },
  { id: "no-tax", name: "No Tax", rate: 0, isDefault: false, isCompound: false, description: "No tax applied" },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank-transfer", label: "Bank Transfer" },
  { value: "mobile-money", label: "Mobile Money (Airtel/MTN)" },
  { value: "card", label: "Card Payment" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "office", label: "Office Supplies" },
  { value: "travel", label: "Travel & Transport" },
  { value: "supplies", label: "Materials & Supplies" },
  { value: "utilities", label: "Utilities (Power, Water, Internet)" },
  { value: "marketing", label: "Marketing & Advertising" },
  { value: "payroll", label: "Payroll & Wages" },
  { value: "rent", label: "Rent & Lease" },
  { value: "insurance", label: "Insurance" },
  { value: "professional-services", label: "Professional Services" },
  { value: "equipment", label: "Equipment & Machinery" },
  { value: "other", label: "Other" },
];

export const INVOICE_TEMPLATES: { value: InvoiceTemplate; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Clean corporate layout with blue accent" },
  { value: "modern", label: "Modern", description: "Minimalist with bold typography" },
  { value: "classic", label: "Classic", description: "Traditional business letterhead style" },
  { value: "minimal", label: "Minimal", description: "Ultra-clean with maximum whitespace" },
  { value: "bold", label: "Bold", description: "Eye-catching with strong color blocks" },
];

// ━━━ Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let _nextId = Date.now();
function uid(): string {
  return (++_nextId).toString(36) + Math.random().toString(36).slice(2, 7);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function padNumber(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

// ━━━ Calculation Engine ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function calculateLineItemAmount(item: LineItem, taxMode: TaxMode): { subtotal: number; tax: number; total: number } {
  const gross = item.quantity * item.unitPrice;
  const discounted = gross * (1 - item.discount / 100);

  if (taxMode === "exclusive") {
    const tax = discounted * (item.taxRate / 100);
    return { subtotal: discounted, tax, total: discounted + tax };
  } else {
    const base = discounted / (1 + item.taxRate / 100);
    const tax = discounted - base;
    return { subtotal: base, tax, total: discounted };
  }
}

export function calculateInvoiceTotals(
  lineItems: LineItem[],
  taxMode: TaxMode,
  discount: { type: "percent" | "fixed"; value: number }
): { subtotal: number; lineItemTax: number; discountAmount: number; taxTotal: number; total: number } {
  let subtotal = 0;
  let lineItemTax = 0;

  for (const item of lineItems) {
    const calc = calculateLineItemAmount(item, taxMode);
    subtotal += calc.subtotal;
    lineItemTax += calc.tax;
  }

  const discountAmount = discount.type === "percent"
    ? subtotal * (discount.value / 100)
    : discount.value;

  const afterDiscount = subtotal - discountAmount;
  const taxTotal = taxMode === "exclusive"
    ? lineItemTax * (afterDiscount / (subtotal || 1))
    : lineItemTax;

  const total = afterDiscount + (taxMode === "exclusive" ? taxTotal : 0);

  return { subtotal, lineItemTax, discountAmount, taxTotal, total: taxMode === "inclusive" ? subtotal + lineItemTax - discountAmount : total };
}

export function getInvoiceBalance(invoice: Invoice, payments: Payment[]): number {
  const totals = calculateInvoiceTotals(invoice.lineItems, invoice.taxMode, invoice.discount);
  const paid = payments
    .filter((p) => p.invoiceId === invoice.id)
    .reduce((sum, p) => sum + p.amount, 0);
  return totals.total - paid;
}

export function getClientBalance(clientId: string, invoices: Invoice[], payments: Payment[]): number {
  return invoices
    .filter((inv) => inv.clientId === clientId && inv.status !== "cancelled" && inv.status !== "draft")
    .reduce((sum, inv) => sum + getInvoiceBalance(inv, payments), 0);
}

// ━━━ PAYE Calculation (Zambia 2024/2025) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PAYE_BANDS = [
  { min: 0, max: 5100, rate: 0 },
  { min: 5100, max: 7100, rate: 20 },
  { min: 7100, max: 9200, rate: 30 },
  { min: 9200, max: Infinity, rate: 37 },
];

export function calculatePAYE(grossMonthly: number): number {
  let tax = 0;
  let remaining = grossMonthly;

  for (const band of PAYE_BANDS) {
    if (remaining <= 0) break;
    const bandWidth = band.max - band.min;
    const taxable = Math.min(remaining, bandWidth);
    tax += taxable * (band.rate / 100);
    remaining -= taxable;
  }
  return Math.round(tax * 100) / 100;
}

// ━━━ NAPSA Calculation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const NAPSA_RATE = 0.05;
export const NAPSA_MONTHLY_CEILING = 1221.80;

export function calculateNAPSA(grossMonthly: number): { employee: number; employer: number; total: number } {
  const employee = Math.min(grossMonthly * NAPSA_RATE, NAPSA_MONTHLY_CEILING);
  const employer = Math.min(grossMonthly * NAPSA_RATE, NAPSA_MONTHLY_CEILING);
  return {
    employee: Math.round(employee * 100) / 100,
    employer: Math.round(employer * 100) / 100,
    total: Math.round((employee + employer) * 100) / 100,
  };
}

// ━━━ Currency Formatting ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function formatCurrency(amount: number, currency: CurrencyCode = "ZMW"): string {
  const config = CURRENCY_CONFIG[currency];
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? "-" : "";
  return `${sign}${config.symbol} ${formatted}`;
}

// ━━━ Defaults ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createDefaultForm(): InvoiceAccountingForm {
  const d = today();
  return {
    business: {
      name: "",
      address: "",
      city: "Lusaka",
      province: "Lusaka",
      country: "Zambia",
      phone: "",
      email: "",
      website: "",
      taxId: "",
      napsaNumber: "",
      logoUrl: "",
      currency: "ZMW",
      taxMode: "exclusive",
      defaultPaymentTerms: 30,
      invoicePrefix: "INV",
      quotePrefix: "QTE",
      creditPrefix: "CN",
      poPrefix: "PO",
      nextInvoiceNumber: 1,
      nextQuoteNumber: 1,
      nextCreditNumber: 1,
      nextPONumber: 1,
      defaultNotes: "Thank you for your business!",
      defaultTerms: "Payment is due within 30 days of invoice date. Late payments may incur a 2% monthly interest charge.",
      defaultFooter: "",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankBranch: "",
      bankSwiftCode: "",
      mobileMoneyName: "",
      mobileMoneyNumber: "",
      mobileMoneyProvider: "Airtel Money",
      // ZRA Smart Invoice defaults
      zraEnabled: false,
      zraVsdcUrl: "http://localhost:8080",
      zraBranchId: "000",
      zraDeviceSerialNo: "",
      zraAutoSubmit: false,
    },
    taxes: [...DEFAULT_TAX_RATES],
    clients: [],
    products: [],
    vendors: [],
    invoices: [],
    quotes: [],
    creditNotes: [],
    purchaseOrders: [],
    payments: [],
    expenses: [],
    projects: [],
    timeEntries: [],
    napsaEmployees: [],
    napsaReturns: [],
    style: {
      template: "professional",
      accentColor: "#8b5cf6",
      fontFamily: "Inter",
      showLogo: true,
      showPaymentInfo: true,
      showSignatureLine: true,
      showQRCode: false,
      showWatermark: false,
      watermarkText: "DRAFT",
    },
    activeView: "dashboard",
    activeRecordId: null,
    selectedIds: [],
    reportType: "revenue",
    reportDateRange: { start: d.slice(0, 7) + "-01", end: d },
    activeTimerProjectId: null,
    activeTimerStart: null,
  };
}

// ━━━ Store ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface InvoiceAccountingEditorState {
  form: InvoiceAccountingForm;
  accentColorLocked: boolean;

  // ── Navigation ──
  setView: (view: ViewType, recordId?: string | null) => void;
  setReportType: (type: ReportType) => void;
  setReportDateRange: (range: { start: string; end: string }) => void;
  setSelectedIds: (ids: string[]) => void;

  // ── Business Settings ──
  updateBusiness: (data: Partial<BusinessSettings>) => void;

  // ── Style ──
  updateStyle: (data: Partial<InvoiceStyle>) => void;
  setAccentColor: (color: string) => void;
  setTemplate: (template: InvoiceTemplate) => void;

  // ── Tax Rates ──
  addTaxRate: (rate: Omit<TaxRate, "id">) => string;
  updateTaxRate: (id: string, data: Partial<TaxRate>) => void;
  removeTaxRate: (id: string) => void;

  // ── Clients ──
  addClient: (data: Omit<Client, "id" | "createdAt">) => string;
  updateClient: (id: string, data: Partial<Client>) => void;
  removeClient: (id: string) => void;

  // ── Products ──
  addProduct: (data: Omit<Product, "id">) => string;
  updateProduct: (id: string, data: Partial<Product>) => void;
  removeProduct: (id: string) => void;

  // ── Invoices ──
  createInvoice: (clientId: string) => string;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  addInvoiceLineItem: (invoiceId: string, item?: Partial<LineItem>) => string;
  updateInvoiceLineItem: (invoiceId: string, itemId: string, data: Partial<LineItem>) => void;
  removeInvoiceLineItem: (invoiceId: string, itemId: string) => void;
  setInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  duplicateInvoice: (id: string) => string;
  removeInvoice: (id: string) => void;

  // ── Quotes ──
  createQuote: (clientId: string) => string;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  addQuoteLineItem: (quoteId: string, item?: Partial<LineItem>) => string;
  updateQuoteLineItem: (quoteId: string, itemId: string, data: Partial<LineItem>) => void;
  removeQuoteLineItem: (quoteId: string, itemId: string) => void;
  setQuoteStatus: (id: string, status: QuoteStatus) => void;
  convertQuoteToInvoice: (quoteId: string) => string;
  removeQuote: (id: string) => void;

  // ── Credit Notes ──
  createCreditNote: (clientId: string, invoiceId?: string) => string;
  updateCreditNote: (id: string, data: Partial<CreditNote>) => void;
  addCreditNoteLineItem: (cnId: string, item?: Partial<LineItem>) => string;
  updateCreditNoteLineItem: (cnId: string, itemId: string, data: Partial<LineItem>) => void;
  removeCreditNoteLineItem: (cnId: string, itemId: string) => void;
  applyCreditToInvoice: (cnId: string, invoiceId: string, amount: number) => void;
  removeCreditNote: (id: string) => void;

  // ── Purchase Orders ──
  createPurchaseOrder: (vendorId: string) => string;
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrder>) => void;
  addPOLineItem: (poId: string, item?: Partial<LineItem>) => string;
  updatePOLineItem: (poId: string, itemId: string, data: Partial<LineItem>) => void;
  removePOLineItem: (poId: string, itemId: string) => void;
  setPOStatus: (id: string, status: PurchaseOrderStatus) => void;
  removePurchaseOrder: (id: string) => void;

  // ── Payments ──
  recordPayment: (invoiceId: string, data: Omit<Payment, "id" | "invoiceId" | "clientId" | "createdAt">) => string;
  removePayment: (id: string) => void;

  // ── Expenses ──
  addExpense: (data: Omit<Expense, "id" | "createdAt">) => string;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  removeExpense: (id: string) => void;

  // ── Vendors ──
  addVendor: (data: Omit<Vendor, "id" | "createdAt">) => string;
  updateVendor: (id: string, data: Partial<Vendor>) => void;
  removeVendor: (id: string) => void;

  // ── Projects ──
  addProject: (data: Omit<Project, "id" | "createdAt">) => string;
  updateProject: (id: string, data: Partial<Project>) => void;
  removeProject: (id: string) => void;

  // ── Time Tracking ──
  addTimeEntry: (data: Omit<TimeEntry, "id" | "createdAt">) => string;
  updateTimeEntry: (id: string, data: Partial<TimeEntry>) => void;
  removeTimeEntry: (id: string) => void;
  startTimer: (projectId: string) => void;
  stopTimer: () => string | null;
  convertTimeToInvoice: (projectId: string, entryIds: string[]) => string;

  // ── Bulk Operations ──
  bulkSetInvoiceStatus: (ids: string[], status: InvoiceStatus) => void;
  bulkDeleteInvoices: (ids: string[]) => void;

  // ── Global ──
  resetForm: () => void;
  setForm: (data: InvoiceAccountingForm) => void;

  // ── ZRA Smart Invoice ──
  submitInvoiceToZRA: (invoiceId: string) => Promise<void>;
  updateInvoiceZRAStatus: (invoiceId: string, status: Invoice["zraStatus"], receiptNo?: string, error?: string) => void;

  // ── NAPSA Employee Management ──
  addNAPSAEmployee: (data: Omit<NAPSAEmployee, "id">) => string;
  updateNAPSAEmployee: (id: string, data: Partial<NAPSAEmployee>) => void;
  removeNAPSAEmployee: (id: string) => void;
  generateNAPSAReturn: (month: string) => string;
  updateNAPSAReturnStatus: (id: string, status: NAPSAReturn["status"]) => void;
}

export const useInvoiceAccountingEditor = create<InvoiceAccountingEditorState>()(
  temporal(
    persist(
      immer<InvoiceAccountingEditorState>((set, get) => ({
        form: createDefaultForm(),
        accentColorLocked: false,

        // ── Navigation ──
        setView: (view, recordId) =>
          set((s) => {
            s.form.activeView = view;
            s.form.activeRecordId = recordId ?? null;
            s.form.selectedIds = [];
          }),

        setReportType: (type) =>
          set((s) => { s.form.reportType = type; }),

        setReportDateRange: (range) =>
          set((s) => { s.form.reportDateRange = range; }),

        setSelectedIds: (ids) =>
          set((s) => { s.form.selectedIds = ids; }),

        // ── Business Settings ──
        updateBusiness: (data) =>
          set((s) => { Object.assign(s.form.business, data); }),

        // ── Style ──
        updateStyle: (data) =>
          set((s) => { Object.assign(s.form.style, data); }),

        setAccentColor: (color) =>
          set((s) => {
            s.form.style.accentColor = color;
            s.accentColorLocked = true;
          }),

        setTemplate: (template) =>
          set((s) => {
            s.form.style.template = template;
            if (!s.accentColorLocked) {
              const templateColors: Record<InvoiceTemplate, string> = {
                professional: "#3b82f6",
                modern: "#8b5cf6",
                classic: "#1e3a5f",
                minimal: "#374151",
                bold: "#ef4444",
              };
              s.form.style.accentColor = templateColors[template] || "#8b5cf6";
            }
          }),

        // ── Tax Rates ──
        addTaxRate: (rate) => {
          const id = uid();
          set((s) => { s.form.taxes.push({ ...rate, id }); });
          return id;
        },

        updateTaxRate: (id, data) =>
          set((s) => {
            const idx = s.form.taxes.findIndex((t) => t.id === id);
            if (idx >= 0) Object.assign(s.form.taxes[idx], data);
          }),

        removeTaxRate: (id) =>
          set((s) => {
            s.form.taxes = s.form.taxes.filter((t) => t.id !== id);
          }),

        // ── Clients ──
        addClient: (data) => {
          const id = uid();
          set((s) => {
            s.form.clients.push({
              ...data,
              id,
              createdAt: new Date().toISOString(),
            } as Client);
          });
          return id;
        },

        updateClient: (id, data) =>
          set((s) => {
            const idx = s.form.clients.findIndex((c) => c.id === id);
            if (idx >= 0) Object.assign(s.form.clients[idx], data);
          }),

        removeClient: (id) =>
          set((s) => {
            s.form.clients = s.form.clients.filter((c) => c.id !== id);
          }),

        // ── Products ──
        addProduct: (data) => {
          const id = uid();
          set((s) => { s.form.products.push({ ...data, id } as Product); });
          return id;
        },

        updateProduct: (id, data) =>
          set((s) => {
            const idx = s.form.products.findIndex((p) => p.id === id);
            if (idx >= 0) Object.assign(s.form.products[idx], data);
          }),

        removeProduct: (id) =>
          set((s) => {
            s.form.products = s.form.products.filter((p) => p.id !== id);
          }),

        // ── Invoices ──
        createInvoice: (clientId) => {
          const id = uid();
          const state = get();
          const num = state.form.business.nextInvoiceNumber;
          const year = new Date().getFullYear();
          set((s) => {
            s.form.invoices.push({
              id,
              number: `${s.form.business.invoicePrefix}-${year}-${padNumber(num, 4)}`,
              clientId,
              status: "draft",
              date: today(),
              dueDate: addDays(today(), s.form.business.defaultPaymentTerms),
              lineItems: [],
              taxMode: s.form.business.taxMode,
              discount: { type: "percent", value: 0 },
              notes: s.form.business.defaultNotes,
              terms: s.form.business.defaultTerms,
              footer: s.form.business.defaultFooter,
              currency: s.form.business.currency,
              isRecurring: false,
              recurringConfig: null,
              paidAt: "",
              sentAt: "",
              createdAt: new Date().toISOString(),
              depositAmount: 0,
              depositPaid: false,
              poNumber: "",
              customFields: {},
              zraStatus: "not-submitted",
              zraReceiptNo: "",
              zraSubmittedAt: "",
              zraErrorMessage: "",
            });
            s.form.business.nextInvoiceNumber = num + 1;
          });
          return id;
        },

        updateInvoice: (id, data) =>
          set((s) => {
            const idx = s.form.invoices.findIndex((inv) => inv.id === id);
            if (idx >= 0) Object.assign(s.form.invoices[idx], data);
          }),

        addInvoiceLineItem: (invoiceId, item) => {
          const id = uid();
          set((s) => {
            const inv = s.form.invoices.find((i) => i.id === invoiceId);
            if (inv) {
              const defaultTax = s.form.taxes.find((t) => t.isDefault);
              inv.lineItems.push({
                id,
                productId: "",
                description: "",
                quantity: 1,
                unitPrice: 0,
                taxRateId: defaultTax?.id || "no-tax",
                taxRate: defaultTax?.rate ?? 0,
                taxName: defaultTax?.name ?? "No Tax",
                discount: 0,
                ...item,
              });
            }
          });
          return id;
        },

        updateInvoiceLineItem: (invoiceId, itemId, data) =>
          set((s) => {
            const inv = s.form.invoices.find((i) => i.id === invoiceId);
            if (inv) {
              const idx = inv.lineItems.findIndex((li) => li.id === itemId);
              if (idx >= 0) {
                Object.assign(inv.lineItems[idx], data);
                // If taxRateId changed, sync rate and name
                if (data.taxRateId) {
                  const tax = s.form.taxes.find((t) => t.id === data.taxRateId);
                  if (tax) {
                    inv.lineItems[idx].taxRate = tax.rate;
                    inv.lineItems[idx].taxName = tax.name;
                  }
                }
              }
            }
          }),

        removeInvoiceLineItem: (invoiceId, itemId) =>
          set((s) => {
            const inv = s.form.invoices.find((i) => i.id === invoiceId);
            if (inv) {
              inv.lineItems = inv.lineItems.filter((li) => li.id !== itemId);
            }
          }),

        setInvoiceStatus: (id, status) =>
          set((s) => {
            const inv = s.form.invoices.find((i) => i.id === id);
            if (inv) {
              inv.status = status;
              if (status === "paid" && !inv.paidAt) inv.paidAt = new Date().toISOString();
              if (status === "sent" && !inv.sentAt) inv.sentAt = new Date().toISOString();
            }
          }),

        duplicateInvoice: (id) => {
          const newId = uid();
          set((s) => {
            const orig = s.form.invoices.find((i) => i.id === id);
            if (orig) {
              const num = s.form.business.nextInvoiceNumber;
              const year = new Date().getFullYear();
              s.form.invoices.push({
                ...JSON.parse(JSON.stringify(orig)),
                id: newId,
                number: `${s.form.business.invoicePrefix}-${year}-${padNumber(num, 4)}`,
                status: "draft" as InvoiceStatus,
                date: today(),
                dueDate: addDays(today(), s.form.business.defaultPaymentTerms),
                paidAt: "",
                sentAt: "",
                createdAt: new Date().toISOString(),
                lineItems: orig.lineItems.map((li) => ({ ...li, id: uid() })),
              });
              s.form.business.nextInvoiceNumber = num + 1;
            }
          });
          return newId;
        },

        removeInvoice: (id) =>
          set((s) => {
            s.form.invoices = s.form.invoices.filter((i) => i.id !== id);
          }),

        // ── Quotes ──
        createQuote: (clientId) => {
          const id = uid();
          const state = get();
          const num = state.form.business.nextQuoteNumber;
          const year = new Date().getFullYear();
          set((s) => {
            s.form.quotes.push({
              id,
              number: `${s.form.business.quotePrefix}-${year}-${padNumber(num, 4)}`,
              clientId,
              status: "draft",
              date: today(),
              validUntil: addDays(today(), 30),
              lineItems: [],
              taxMode: s.form.business.taxMode,
              discount: { type: "percent", value: 0 },
              notes: s.form.business.defaultNotes,
              terms: s.form.business.defaultTerms,
              footer: s.form.business.defaultFooter,
              currency: s.form.business.currency,
              convertedToInvoiceId: "",
              createdAt: new Date().toISOString(),
            });
            s.form.business.nextQuoteNumber = num + 1;
          });
          return id;
        },

        updateQuote: (id, data) =>
          set((s) => {
            const idx = s.form.quotes.findIndex((q) => q.id === id);
            if (idx >= 0) Object.assign(s.form.quotes[idx], data);
          }),

        addQuoteLineItem: (quoteId, item) => {
          const id = uid();
          set((s) => {
            const q = s.form.quotes.find((q) => q.id === quoteId);
            if (q) {
              const defaultTax = s.form.taxes.find((t) => t.isDefault);
              q.lineItems.push({
                id,
                productId: "",
                description: "",
                quantity: 1,
                unitPrice: 0,
                taxRateId: defaultTax?.id || "no-tax",
                taxRate: defaultTax?.rate ?? 0,
                taxName: defaultTax?.name ?? "No Tax",
                discount: 0,
                ...item,
              });
            }
          });
          return id;
        },

        updateQuoteLineItem: (quoteId, itemId, data) =>
          set((s) => {
            const q = s.form.quotes.find((q) => q.id === quoteId);
            if (q) {
              const idx = q.lineItems.findIndex((li) => li.id === itemId);
              if (idx >= 0) {
                Object.assign(q.lineItems[idx], data);
                if (data.taxRateId) {
                  const tax = s.form.taxes.find((t) => t.id === data.taxRateId);
                  if (tax) {
                    q.lineItems[idx].taxRate = tax.rate;
                    q.lineItems[idx].taxName = tax.name;
                  }
                }
              }
            }
          }),

        removeQuoteLineItem: (quoteId, itemId) =>
          set((s) => {
            const q = s.form.quotes.find((q) => q.id === quoteId);
            if (q) {
              q.lineItems = q.lineItems.filter((li) => li.id !== itemId);
            }
          }),

        setQuoteStatus: (id, status) =>
          set((s) => {
            const q = s.form.quotes.find((q) => q.id === id);
            if (q) q.status = status;
          }),

        convertQuoteToInvoice: (quoteId) => {
          const invoiceId = uid();
          set((s) => {
            const q = s.form.quotes.find((q) => q.id === quoteId);
            if (q) {
              const num = s.form.business.nextInvoiceNumber;
              const year = new Date().getFullYear();
              s.form.invoices.push({
                id: invoiceId,
                number: `${s.form.business.invoicePrefix}-${year}-${padNumber(num, 4)}`,
                clientId: q.clientId,
                status: "draft",
                date: today(),
                dueDate: addDays(today(), s.form.business.defaultPaymentTerms),
                lineItems: q.lineItems.map((li) => ({ ...li, id: uid() })),
                taxMode: q.taxMode,
                discount: { ...q.discount },
                notes: q.notes,
                terms: q.terms,
                footer: q.footer,
                currency: q.currency,
                isRecurring: false,
                recurringConfig: null,
                paidAt: "",
                sentAt: "",
                createdAt: new Date().toISOString(),
                depositAmount: 0,
                depositPaid: false,
                poNumber: "",
                customFields: {},
                zraStatus: "not-submitted",
                zraReceiptNo: "",
                zraSubmittedAt: "",
                zraErrorMessage: "",
              });
              q.status = "converted";
              q.convertedToInvoiceId = invoiceId;
              s.form.business.nextInvoiceNumber = num + 1;
            }
          });
          return invoiceId;
        },

        removeQuote: (id) =>
          set((s) => {
            s.form.quotes = s.form.quotes.filter((q) => q.id !== id);
          }),

        // ── Credit Notes ──
        createCreditNote: (clientId, invoiceId) => {
          const id = uid();
          const state = get();
          const num = state.form.business.nextCreditNumber;
          const year = new Date().getFullYear();
          set((s) => {
            s.form.creditNotes.push({
              id,
              number: `${s.form.business.creditPrefix}-${year}-${padNumber(num, 4)}`,
              clientId,
              invoiceId: invoiceId || "",
              status: "draft",
              date: today(),
              lineItems: [],
              reason: "",
              appliedToInvoices: [],
              createdAt: new Date().toISOString(),
            });
            s.form.business.nextCreditNumber = num + 1;
          });
          return id;
        },

        updateCreditNote: (id, data) =>
          set((s) => {
            const idx = s.form.creditNotes.findIndex((cn) => cn.id === id);
            if (idx >= 0) Object.assign(s.form.creditNotes[idx], data);
          }),

        addCreditNoteLineItem: (cnId, item) => {
          const id = uid();
          set((s) => {
            const cn = s.form.creditNotes.find((c) => c.id === cnId);
            if (cn) {
              const defaultTax = s.form.taxes.find((t) => t.isDefault);
              cn.lineItems.push({
                id, productId: "", description: "", quantity: 1, unitPrice: 0,
                taxRateId: defaultTax?.id || "no-tax", taxRate: defaultTax?.rate ?? 0,
                taxName: defaultTax?.name ?? "No Tax", discount: 0, ...item,
              });
            }
          });
          return id;
        },

        updateCreditNoteLineItem: (cnId, itemId, data) =>
          set((s) => {
            const cn = s.form.creditNotes.find((c) => c.id === cnId);
            if (cn) {
              const idx = cn.lineItems.findIndex((li) => li.id === itemId);
              if (idx >= 0) Object.assign(cn.lineItems[idx], data);
            }
          }),

        removeCreditNoteLineItem: (cnId, itemId) =>
          set((s) => {
            const cn = s.form.creditNotes.find((c) => c.id === cnId);
            if (cn) cn.lineItems = cn.lineItems.filter((li) => li.id !== itemId);
          }),

        applyCreditToInvoice: (cnId, invoiceId, amount) =>
          set((s) => {
            const cn = s.form.creditNotes.find((c) => c.id === cnId);
            if (cn) {
              cn.appliedToInvoices.push({ invoiceId, amount });
              cn.status = "applied";
            }
          }),

        removeCreditNote: (id) =>
          set((s) => {
            s.form.creditNotes = s.form.creditNotes.filter((cn) => cn.id !== id);
          }),

        // ── Purchase Orders ──
        createPurchaseOrder: (vendorId) => {
          const id = uid();
          const state = get();
          const num = state.form.business.nextPONumber;
          const year = new Date().getFullYear();
          set((s) => {
            s.form.purchaseOrders.push({
              id,
              number: `${s.form.business.poPrefix}-${year}-${padNumber(num, 4)}`,
              vendorId,
              status: "draft",
              date: today(),
              expectedDate: addDays(today(), 14),
              lineItems: [],
              taxMode: s.form.business.taxMode,
              discount: { type: "percent", value: 0 },
              notes: "",
              terms: "",
              currency: s.form.business.currency,
              createdAt: new Date().toISOString(),
            });
            s.form.business.nextPONumber = num + 1;
          });
          return id;
        },

        updatePurchaseOrder: (id, data) =>
          set((s) => {
            const idx = s.form.purchaseOrders.findIndex((po) => po.id === id);
            if (idx >= 0) Object.assign(s.form.purchaseOrders[idx], data);
          }),

        addPOLineItem: (poId, item) => {
          const id = uid();
          set((s) => {
            const po = s.form.purchaseOrders.find((p) => p.id === poId);
            if (po) {
              const defaultTax = s.form.taxes.find((t) => t.isDefault);
              po.lineItems.push({
                id, productId: "", description: "", quantity: 1, unitPrice: 0,
                taxRateId: defaultTax?.id || "no-tax", taxRate: defaultTax?.rate ?? 0,
                taxName: defaultTax?.name ?? "No Tax", discount: 0, ...item,
              });
            }
          });
          return id;
        },

        updatePOLineItem: (poId, itemId, data) =>
          set((s) => {
            const po = s.form.purchaseOrders.find((p) => p.id === poId);
            if (po) {
              const idx = po.lineItems.findIndex((li) => li.id === itemId);
              if (idx >= 0) Object.assign(po.lineItems[idx], data);
            }
          }),

        removePOLineItem: (poId, itemId) =>
          set((s) => {
            const po = s.form.purchaseOrders.find((p) => p.id === poId);
            if (po) po.lineItems = po.lineItems.filter((li) => li.id !== itemId);
          }),

        setPOStatus: (id, status) =>
          set((s) => {
            const po = s.form.purchaseOrders.find((p) => p.id === id);
            if (po) po.status = status;
          }),

        removePurchaseOrder: (id) =>
          set((s) => {
            s.form.purchaseOrders = s.form.purchaseOrders.filter((po) => po.id !== id);
          }),

        // ── Payments ──
        recordPayment: (invoiceId, data) => {
          const id = uid();
          set((s) => {
            const inv = s.form.invoices.find((i) => i.id === invoiceId);
            if (inv) {
              s.form.payments.push({
                ...data,
                id,
                invoiceId,
                clientId: inv.clientId,
                createdAt: new Date().toISOString(),
              } as Payment);
              // Auto-update invoice status
              const totals = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
              const totalPaid = s.form.payments
                .filter((p) => p.invoiceId === invoiceId)
                .reduce((sum, p) => sum + p.amount, 0);
              if (totalPaid >= totals.total) {
                inv.status = "paid";
                inv.paidAt = new Date().toISOString();
              } else if (totalPaid > 0) {
                inv.status = "partial";
              }
            }
          });
          return id;
        },

        removePayment: (id) =>
          set((s) => {
            s.form.payments = s.form.payments.filter((p) => p.id !== id);
          }),

        // ── Expenses ──
        addExpense: (data) => {
          const id = uid();
          set((s) => {
            s.form.expenses.push({
              ...data,
              id,
              createdAt: new Date().toISOString(),
            } as Expense);
          });
          return id;
        },

        updateExpense: (id, data) =>
          set((s) => {
            const idx = s.form.expenses.findIndex((e) => e.id === id);
            if (idx >= 0) Object.assign(s.form.expenses[idx], data);
          }),

        removeExpense: (id) =>
          set((s) => {
            s.form.expenses = s.form.expenses.filter((e) => e.id !== id);
          }),

        // ── Vendors ──
        addVendor: (data) => {
          const id = uid();
          set((s) => {
            s.form.vendors.push({
              ...data,
              id,
              createdAt: new Date().toISOString(),
            } as Vendor);
          });
          return id;
        },

        updateVendor: (id, data) =>
          set((s) => {
            const idx = s.form.vendors.findIndex((v) => v.id === id);
            if (idx >= 0) Object.assign(s.form.vendors[idx], data);
          }),

        removeVendor: (id) =>
          set((s) => {
            s.form.vendors = s.form.vendors.filter((v) => v.id !== id);
          }),

        // ── Projects ──
        addProject: (data) => {
          const id = uid();
          set((s) => {
            s.form.projects.push({
              ...data,
              id,
              createdAt: new Date().toISOString(),
            } as Project);
          });
          return id;
        },

        updateProject: (id, data) =>
          set((s) => {
            const idx = s.form.projects.findIndex((p) => p.id === id);
            if (idx >= 0) Object.assign(s.form.projects[idx], data);
          }),

        removeProject: (id) =>
          set((s) => {
            s.form.projects = s.form.projects.filter((p) => p.id !== id);
          }),

        // ── Time Tracking ──
        addTimeEntry: (data) => {
          const id = uid();
          set((s) => {
            s.form.timeEntries.push({
              ...data,
              id,
              createdAt: new Date().toISOString(),
            } as TimeEntry);
          });
          return id;
        },

        updateTimeEntry: (id, data) =>
          set((s) => {
            const idx = s.form.timeEntries.findIndex((te) => te.id === id);
            if (idx >= 0) Object.assign(s.form.timeEntries[idx], data);
          }),

        removeTimeEntry: (id) =>
          set((s) => {
            s.form.timeEntries = s.form.timeEntries.filter((te) => te.id !== id);
          }),

        startTimer: (projectId) =>
          set((s) => {
            s.form.activeTimerProjectId = projectId;
            s.form.activeTimerStart = new Date().toISOString();
          }),

        stopTimer: () => {
          const state = get();
          if (!state.form.activeTimerProjectId || !state.form.activeTimerStart) return null;

          const id = uid();
          const start = new Date(state.form.activeTimerStart);
          const end = new Date();
          const duration = Math.round((end.getTime() - start.getTime()) / 60000);
          const project = state.form.projects.find((p) => p.id === state.form.activeTimerProjectId);

          set((s) => {
            s.form.timeEntries.push({
              id,
              projectId: s.form.activeTimerProjectId!,
              description: "",
              date: today(),
              startTime: start.toISOString(),
              endTime: end.toISOString(),
              duration,
              hourlyRate: project?.hourlyRate ?? 0,
              isBillable: true,
              invoiced: false,
              invoiceId: "",
              createdAt: new Date().toISOString(),
            });
            s.form.activeTimerProjectId = null;
            s.form.activeTimerStart = null;
          });
          return id;
        },

        convertTimeToInvoice: (projectId, entryIds) => {
          const state = get();
          const project = state.form.projects.find((p) => p.id === projectId);
          if (!project) return "";

          const invoiceId = state.createInvoice(project.clientId);
          const entries = state.form.timeEntries.filter(
            (te) => entryIds.includes(te.id) && !te.invoiced
          );

          set((s) => {
            const inv = s.form.invoices.find((i) => i.id === invoiceId);
            if (inv) {
              for (const entry of entries) {
                const hours = entry.duration / 60;
                inv.lineItems.push({
                  id: uid(),
                  productId: "",
                  description: `${project.name}: ${entry.description || "Time worked"} (${hours.toFixed(1)}h)`,
                  quantity: parseFloat(hours.toFixed(2)),
                  unitPrice: entry.hourlyRate,
                  taxRateId: "vat-standard",
                  taxRate: 16,
                  taxName: "VAT (Standard)",
                  discount: 0,
                });
              }
              // Mark entries as invoiced
              for (const entry of s.form.timeEntries) {
                if (entryIds.includes(entry.id)) {
                  entry.invoiced = true;
                  entry.invoiceId = invoiceId;
                }
              }
            }
          });
          return invoiceId;
        },

        // ── Bulk Operations ──
        bulkSetInvoiceStatus: (ids, status) =>
          set((s) => {
            for (const inv of s.form.invoices) {
              if (ids.includes(inv.id)) inv.status = status;
            }
          }),

        bulkDeleteInvoices: (ids) =>
          set((s) => {
            s.form.invoices = s.form.invoices.filter((i) => !ids.includes(i.id));
          }),

        // ── ZRA Smart Invoice ──
        submitInvoiceToZRA: async (invoiceId) => {
          const state = get();
          const inv = state.form.invoices.find((i) => i.id === invoiceId);
          if (!inv) return;
          const biz = state.form.business;
          if (!biz.zraEnabled || !biz.zraVsdcUrl) return;

          // Mark pending
          set((s) => {
            const target = s.form.invoices.find((i: Invoice) => i.id === invoiceId);
            if (target) {
              target.zraStatus = "pending";
              target.zraErrorMessage = "";
            }
          });

          try {
            // Build sales items from invoice line items
            const salesItems = inv.lineItems.map((li, idx) => ({
              itemSeq: idx + 1,
              itemCd: li.productId || `ITEM-${idx + 1}`,
              itemClsCd: "5059690000",
              itemNm: li.description,
              pkgUnitCd: "NT",
              qtyUnitCd: "U",
              qty: li.quantity,
              prc: li.unitPrice,
              splyAmt: li.quantity * li.unitPrice,
              dcRt: li.discount || 0,
              dcAmt: ((li.discount || 0) / 100) * li.quantity * li.unitPrice,
              taxblAmt: li.quantity * li.unitPrice * (1 - li.discount / 100),
              taxTyCd: li.taxRateId === "exempt" ? "D" : "A",
              taxAmt: li.quantity * li.unitPrice * (1 - li.discount / 100) * (li.taxRate / 100),
              totAmt: li.quantity * li.unitPrice * (1 - li.discount / 100) * (1 + li.taxRate / 100),
            }));

            const payload = {
              endpoint: "saveSales",
              baseUrl: biz.zraVsdcUrl,
              tpin: biz.taxId || "",
              branchId: biz.zraBranchId || "000",
              data: {
                tpin: biz.taxId,
                bhfId: biz.zraBranchId || "000",
                orgInvcNo: 0,
                cisInvcNo: inv.number,
                custTpin: "",
                custNm: inv.clientId ? (state.form.clients.find((c) => c.id === inv.clientId)?.name || "Walk-in Customer") : "Walk-in Customer",
                salesTyCd: "N",
                rcptTyCd: "S",
                pmtTyCd: "01",
                salesSttsCd: "02",
                cfmDt: new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14),
                salesDt: inv.date.replace(/-/g, ""),
                stockRlsDt: null,
                cnclReqDt: null,
                cnclDt: null,
                rfdDt: null,
                rfdRsnCd: null,
                totItemCnt: salesItems.length,
                taxblAmtA: salesItems.filter((i) => i.taxTyCd === "A").reduce((s, i) => s + i.taxblAmt, 0),
                taxblAmtB: 0,
                taxblAmtC1: 0,
                taxblAmtC2: 0,
                taxblAmtC3: 0,
                taxblAmtD: salesItems.filter((i) => i.taxTyCd === "D").reduce((s, i) => s + i.taxblAmt, 0),
                taxRtA: 16,
                taxRtB: 0,
                taxRtC1: 0,
                taxRtC2: 0,
                taxRtC3: 0,
                taxRtD: 0,
                taxAmtA: salesItems.filter((i) => i.taxTyCd === "A").reduce((s, i) => s + i.taxAmt, 0),
                taxAmtB: 0,
                taxAmtC1: 0,
                taxAmtC2: 0,
                taxAmtC3: 0,
                taxAmtD: 0,
                totTaxblAmt: salesItems.reduce((s, i) => s + i.taxblAmt, 0),
                totTaxAmt: salesItems.reduce((s, i) => s + i.taxAmt, 0),
                totAmt: salesItems.reduce((s, i) => s + i.totAmt, 0),
                prchrAcptcYn: "N",
                remark: inv.notes || "",
                regrId: "DMSuite",
                regrNm: "DMSuite",
                modrId: "DMSuite",
                modrNm: "DMSuite",
                itemList: salesItems,
              },
            };

            const resp = await fetch("/api/zra", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const result = await resp.json();

            if (resp.ok && result.resultCd === "000") {
              set((s) => {
                const target = s.form.invoices.find((i: Invoice) => i.id === invoiceId);
                if (target) {
                  target.zraStatus = "submitted";
                  target.zraReceiptNo = result.data?.rcptNo || result.data?.intrlData || "";
                  target.zraSubmittedAt = new Date().toISOString();
                }
              });
            } else {
              set((s) => {
                const target = s.form.invoices.find((i: Invoice) => i.id === invoiceId);
                if (target) {
                  target.zraStatus = "error";
                  target.zraErrorMessage = result.resultMsg || result.error || "ZRA submission failed";
                }
              });
            }
          } catch (err) {
            set((s) => {
              const target = s.form.invoices.find((i: Invoice) => i.id === invoiceId);
              if (target) {
                target.zraStatus = "error";
                target.zraErrorMessage = err instanceof Error ? err.message : "Connection to VSDC device failed";
              }
            });
          }
        },

        updateInvoiceZRAStatus: (invoiceId, status, receiptNo, error) =>
          set((s) => {
            const inv = s.form.invoices.find((i: Invoice) => i.id === invoiceId);
            if (inv) {
              inv.zraStatus = status;
              if (receiptNo !== undefined) inv.zraReceiptNo = receiptNo;
              if (error !== undefined) inv.zraErrorMessage = error;
            }
          }),

        // ── NAPSA Employee Management ──
        addNAPSAEmployee: (data) => {
          const id = `napsa-emp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          set((s) => {
            if (!s.form.napsaEmployees) s.form.napsaEmployees = [];
            s.form.napsaEmployees.push({ ...data, id });
          });
          return id;
        },

        updateNAPSAEmployee: (id, data) =>
          set((s) => {
            const emp = s.form.napsaEmployees.find((e: NAPSAEmployee) => e.id === id);
            if (emp) Object.assign(emp, data);
          }),

        removeNAPSAEmployee: (id) =>
          set((s) => {
            s.form.napsaEmployees = s.form.napsaEmployees.filter((e: NAPSAEmployee) => e.id !== id);
          }),

        generateNAPSAReturn: (month) => {
          const state = get();
          const activeEmps = (state.form.napsaEmployees ?? []).filter((e) => e.isActive);
          const contributions = activeEmps.map((emp) => {
            const napsa = calculateNAPSA(emp.grossSalary);
            return {
              employeeId: emp.id,
              grossSalary: emp.grossSalary,
              employeeAmount: napsa.employee,
              employerAmount: napsa.employer,
              totalAmount: napsa.total,
            };
          });
          const id = `napsa-ret-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const totalEmp = contributions.reduce((s, c) => s + c.employeeAmount, 0);
          const totalEr = contributions.reduce((s, c) => s + c.employerAmount, 0);
          set((s) => {
            s.form.napsaReturns.push({
              id,
              month,
              employeeContributions: contributions,
              totalEmployeeContrib: Math.round(totalEmp * 100) / 100,
              totalEmployerContrib: Math.round(totalEr * 100) / 100,
              grandTotal: Math.round((totalEmp + totalEr) * 100) / 100,
              status: "draft",
              submittedAt: "",
              paidAt: "",
              createdAt: new Date().toISOString(),
            });
          });
          return id;
        },

        updateNAPSAReturnStatus: (id, status) =>
          set((s) => {
            const ret = s.form.napsaReturns.find((r: NAPSAReturn) => r.id === id);
            if (ret) {
              ret.status = status;
              if (status === "submitted") ret.submittedAt = new Date().toISOString();
              if (status === "paid") ret.paidAt = new Date().toISOString();
            }
          }),

        // ── Global ──
        resetForm: () =>
          set((s) => {
            const fresh = createDefaultForm();
            s.form = fresh;
            s.accentColorLocked = false;
          }),

        setForm: (data) =>
          set((s) => { s.form = data; }),
      })),
      {
        name: "dmsuite-invoice-tracker",
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ form: s.form, accentColorLocked: s.accentColorLocked }),
        merge: (persisted, current) => {
          const p = persisted as Record<string, unknown> | undefined;
          if (!p) return current;
          const pForm = (p.form ?? {}) as Record<string, unknown>;
          const cForm = (current as unknown as Record<string, unknown>).form as Record<string, unknown>;
          // Deep-merge form so new fields (napsaEmployees, napsaReturns, etc.) get defaults
          const mergedForm: Record<string, unknown> = { ...cForm, ...pForm };
          // Ensure new array fields exist even if not in persisted data
          if (!Array.isArray(mergedForm.napsaEmployees)) mergedForm.napsaEmployees = [];
          if (!Array.isArray(mergedForm.napsaReturns)) mergedForm.napsaReturns = [];
          // Ensure business has ZRA fields
          const biz = mergedForm.business as Record<string, unknown> | undefined;
          if (biz) {
            if (biz.zraEnabled === undefined) biz.zraEnabled = false;
            if (!biz.zraVsdcUrl) biz.zraVsdcUrl = "http://localhost:8080";
            if (!biz.zraBranchId) biz.zraBranchId = "000";
            if (!biz.zraDeviceSerialNo) biz.zraDeviceSerialNo = "";
            if (biz.zraAutoSubmit === undefined) biz.zraAutoSubmit = false;
          }
          return { ...current, ...p, form: mergedForm as unknown as InvoiceAccountingForm };
        },
      }
    ),
    {
      partialize: (s) => ({ form: s.form }),
    }
  )
);
