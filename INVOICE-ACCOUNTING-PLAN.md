# DMSuite — Invoice & Accounting Hub: Comprehensive Build Plan

> **Tool Name:** Invoice & Accounting Hub
> **Tool ID:** `invoice-tracker` (upgrading existing coming-soon entry)
> **Category:** Utilities & Workflow
> **Inspired By:** Invoice Ninja (9.6k+ stars, battle-tested invoicing platform)
> **Localization:** Zambia-first (ZRA, NAPSA, ZMW currency, local tax rates)
> **Pattern:** Pattern A (Multi-Tab Editor with Preview + Layers)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Map (Invoice Ninja → DMSuite)](#2-feature-map)
3. [Zambian Localization & Compliance](#3-zambian-localization)
4. [Data Architecture](#4-data-architecture)
5. [Store Design (Zustand)](#5-store-design)
6. [UI Architecture](#6-ui-architecture)
7. [Chiko AI Manifest](#7-chiko-ai-manifest)
8. [File Structure](#8-file-structure)
9. [Implementation Phases](#9-implementation-phases)
10. [Tax Engine Specifications](#10-tax-engine)
11. [Export & PDF Generation](#11-export-pdf)
12. [Testing Checklist](#12-testing-checklist)

---

## 1. Executive Summary

Build a complete **Invoice & Accounting Hub** inside DMSuite that replicates Invoice Ninja's core feature set — invoicing, quoting, payments, expenses, time tracking, clients, products, reports — all tailored for **Zambian businesses** with ZRA VAT compliance, NAPSA contribution calculations, PAYE tax tables, and ZMW currency formatting.

This is NOT just a design tool. It is a **full business management workspace** where users can:
- Create, send, and track invoices/quotes/credits
- Manage clients, products, and vendors
- Track expenses and time spent on projects
- See financial dashboards with revenue, outstanding, and overdue amounts
- Generate ZRA-compliant tax reports
- Calculate PAYE, NAPSA, and turnover tax automatically

---

## 2. Feature Map (Invoice Ninja → DMSuite)

### Core Modules

| Invoice Ninja Feature | DMSuite Implementation | Priority |
|---|---|---|
| **Invoices** | Full CRUD, line items, tax, discounts, notes, terms, due dates, partial payments | P0 |
| **Quotes/Estimates** | Full CRUD, convert-to-invoice, approval workflow | P0 |
| **Recurring Invoices** | Frequency config, auto-generation, auto-send | P0 |
| **Clients** | Contact database, multiple contacts per client, client history | P0 |
| **Products/Services** | Product library, item descriptions, prices, tax rates, inventory | P0 |
| **Payments** | Payment recording, partial payments, overpayments, refunds | P0 |
| **Expenses** | Expense tracking, categories, vendor linkage, receipt uploads | P0 |
| **Credit Notes** | Issue credits, apply to invoices, track balances | P0 |
| **Purchase Orders** | Vendor POs, approval, convert-to-expense | P1 |
| **Time Tracking** | Project-based time logging, hourly rates, convert to invoice | P1 |
| **Projects** | Group tasks/expenses under projects, per-project P&L | P1 |
| **Reports** | Revenue, profit/loss, tax summary, aging, client statements | P0 |
| **Dashboard** | Revenue overview, outstanding, overdue, recent activity | P0 |
| **Templates** | Multiple invoice/quote design templates | P0 |
| **Client Portal** | (Placeholder/Coming Soon — needs server side) | P2 |
| **Payment Gateways** | (Placeholder — already have Flutterwave) | P2 |
| **Tax Settings** | Per-invoice/per-line-item taxes, inclusive/exclusive, multiple rates | P0 |
| **Custom Fields** | User-defined fields on invoices, clients, products | P1 |
| **Bulk Operations** | Multi-select, bulk email, bulk status change | P1 |
| **Import/Export** | CSV import/export, JSON backup | P1 |
| **Number Sequencing** | Custom invoice/quote number formats (INV-{YYYY}-{####}) | P0 |
| **Late Fees** | Auto-calculate late fees on overdue invoices | P1 |
| **Deposits/Partial Payments** | Accept deposits, track partial payment schedules | P0 |
| **Multi-Currency** | ZMW default, USD, EUR, GBP, ZAR support | P0 |
| **Discounts** | Per-line-item and per-invoice discounts (% or fixed) | P0 |

### What We Skip (Not Applicable to Client-Side Tool)
- Server-side email sending (users can export PDF and email manually)
- Webhook integrations (Zapier, Make)
- API endpoints (this is a client-side tool)
- Multi-user permissions (single user per workspace)
- Real banking integration (Yodlee, GoCardless)

---

## 3. Zambian Localization & Compliance

### ZRA (Zambia Revenue Authority) Compliance

| Tax Type | Rate | Implementation |
|---|---|---|
| **VAT (Standard)** | 16% | Default tax rate, configurable per item |
| **VAT (Zero-Rated)** | 0% | Exports, basic foods, agricultural inputs |
| **VAT (Exempt)** | N/A | Financial services, education, health |
| **Turnover Tax** | 4% (from Jan 2025) | For businesses < K800,000/year turnover |
| **Withholding Tax** | 15-20% | Configurable on payments to contractors |
| **Corporate Income Tax** | 30% | For report calculations |

### PAYE (Pay As You Earn) Tax Tables — 2024/2025

| Monthly Income Band (ZMW) | Tax Rate |
|---|---|
| 0 - 5,100 | 0% |
| 5,101 - 7,100 | 20% |
| 7,101 - 9,200 | 30% |
| Above 9,200 | 37% |

### NAPSA (National Pension Scheme Authority)

| Component | Rate | Cap |
|---|---|---|
| Employee Contribution | 5% of gross salary | Max ZMW 1,221.80/month |
| Employer Contribution | 5% of gross salary | Max ZMW 1,221.80/month |
| Total | 10% | Max ZMW 2,443.60/month |

### Currency Formatting
- Symbol: **K** (before amount)
- Thousands separator: **,**
- Decimal separator: **.**
- Format: **K 1,250.00** or **ZMW 1,250.00**
- ISO Code: **ZMW**

### Supported Currencies

| Code | Symbol | Name |
|---|---|---|
| ZMW | K | Zambian Kwacha (default) |
| USD | $ | US Dollar |
| EUR | € | Euro |
| GBP | £ | British Pound |
| ZAR | R | South African Rand |
| BWP | P | Botswana Pula |

### Pre-Built Tax Presets (ZRA-Compliant)

1. **Standard VAT (16%)** — Most goods and services
2. **Zero-Rated VAT (0%)** — Exports, basic foods
3. **VAT Exempt** — Financial, education, health
4. **Turnover Tax (4%)** — Small businesses under K800,000
5. **Withholding Tax – Services (15%)** — Contract services
6. **Withholding Tax – Rent (10%)** — Rental income
7. **Withholding Tax – Dividends (20%)** — Dividend payments
8. **Custom Rate** — User-defined

---

## 4. Data Architecture

### Core Entities

```typescript
// ── Client ──
interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;          // TPIN for Zambia
  currency: CurrencyCode;
  notes: string;
  createdAt: string;
  balance: number;        // Outstanding balance
}

// ── Product/Service ──
interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  taxRate: number;
  unit: string;           // "each", "hour", "day", "kg", etc.
  sku: string;
  inStock: number;
  trackInventory: boolean;
  category: string;
}

// ── Invoice ──
interface Invoice {
  id: string;
  number: string;         // INV-2026-0001
  clientId: string;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  lineItems: LineItem[];
  taxMode: "inclusive" | "exclusive";
  discount: { type: "percent" | "fixed"; value: number };
  notes: string;
  terms: string;
  footer: string;
  subtotal: number;       // Computed
  taxTotal: number;       // Computed
  discountTotal: number;  // Computed
  total: number;          // Computed
  amountPaid: number;
  balance: number;
  currency: CurrencyCode;
  isRecurring: boolean;
  recurringConfig?: RecurringConfig;
  paidAt?: string;
  sentAt?: string;
}

// ── Line Item ──
interface LineItem {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxName: string;
  discount: number;       // Per-line discount %
  amount: number;         // Computed: qty * price - discount + tax
}

// ── Payment ──
interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
}

// ── Expense ──
interface Expense {
  id: string;
  vendorId?: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  reference: string;
  taxRate: number;
  taxAmount: number;
  isDeductible: boolean;
  receiptUrl?: string;
  invoiceId?: string;     // Re-billable expense linked to invoice
  projectId?: string;
}

// ── Quote ──
interface Quote {
  id: string;
  number: string;         // QTE-2026-0001
  clientId: string;
  status: QuoteStatus;
  date: string;
  validUntil: string;
  lineItems: LineItem[];
  // Same fields as Invoice...
  convertedToInvoiceId?: string;
}

// ── Credit Note ──
interface CreditNote {
  id: string;
  number: string;
  clientId: string;
  invoiceId?: string;
  date: string;
  lineItems: LineItem[];
  total: number;
  appliedAmount: number;
  balance: number;
}

// ── Vendor ──
interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  notes: string;
}

// ── Project ──
interface Project {
  id: string;
  name: string;
  clientId: string;
  budgetHours: number;
  budgetAmount: number;
  hourlyRate: number;
  status: "active" | "completed" | "on-hold";
  notes: string;
}

// ── Time Entry ──
interface TimeEntry {
  id: string;
  projectId: string;
  description: string;
  date: string;
  duration: number;       // Minutes
  hourlyRate: number;
  isBillable: boolean;
  invoiced: boolean;
  invoiceId?: string;
}

// ── Recurring Config ──
interface RecurringConfig {
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "semi-annual" | "annual";
  startDate: string;
  endDate?: string;
  autoSend: boolean;
  nextDate: string;
  occurrences: number;
}

// ── Enums ──
type InvoiceStatus = "draft" | "sent" | "viewed" | "partial" | "paid" | "overdue" | "cancelled";
type QuoteStatus = "draft" | "sent" | "approved" | "declined" | "expired" | "converted";
type PaymentMethod = "cash" | "bank-transfer" | "mobile-money" | "card" | "cheque" | "other";
type ExpenseCategory = "office" | "travel" | "supplies" | "utilities" | "marketing" | "payroll" | "rent" | "insurance" | "professional-services" | "equipment" | "other";
type CurrencyCode = "ZMW" | "USD" | "EUR" | "GBP" | "ZAR" | "BWP";
```

---

## 5. Store Design (Zustand)

### Store: `useInvoiceAccountingEditor`
**Persist Key:** `dmsuite-invoice-tracker`
**Middleware:** `temporal(persist(immer(...)))`

### State Shape

```typescript
interface InvoiceAccountingForm {
  // ── Business Settings ──
  business: {
    name: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    taxId: string;            // TPIN
    logoUrl: string;
    currency: CurrencyCode;
    taxMode: "inclusive" | "exclusive";
    defaultPaymentTerms: number;  // Days
    invoicePrefix: string;    // "INV"
    quotePrefix: string;      // "QTE"
    creditPrefix: string;     // "CN"
    poPrefix: string;         // "PO"
    nextInvoiceNumber: number;
    nextQuoteNumber: number;
    nextCreditNumber: number;
    invoiceNotes: string;     // Default invoice notes
    invoiceTerms: string;     // Default invoice terms
    invoiceFooter: string;
  };

  // ── Tax Settings ──
  taxes: TaxRate[];           // Custom tax rates

  // ── Data Collections ──
  clients: Client[];
  products: Product[];
  vendors: Vendor[];
  invoices: Invoice[];
  quotes: Quote[];
  creditNotes: CreditNote[];
  payments: Payment[];
  expenses: Expense[];
  projects: Project[];
  timeEntries: TimeEntry[];

  // ── UI State ──
  activeView: ViewType;       // "dashboard" | "invoices" | "quotes" | etc.
  activeRecordId: string | null;  // Currently editing record
  selectedIds: string[];      // For bulk operations

  // ── Style ──
  style: {
    template: string;
    accentColor: string;
    fontFamily: string;
    fontSize: number;
    showLogo: boolean;
    showPaymentInfo: boolean;
    showSignatureLine: boolean;
  };
}
```

---

## 6. UI Architecture

### Navigation Structure (Invoice Ninja-Inspired)

The workspace uses an **app-within-an-app** layout. Instead of the standard 3-panel document editor, this tool has a **navigation sidebar + content area** pattern that mirrors Invoice Ninja's UX.

However, to fit within DMSuite's Pattern A workspace shell, we adapt:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Tool Page Shell (h-12 compact header)                                    │
├───────────────┬──────────────────────────────────────────────────────────┤
│ Navigation    │ Content Area                                             │
│ Panel (w-80)  │                                                          │
│               │ Views:                                                   │
│ ◆ Dashboard   │  - Dashboard (charts, stats, recent activity)            │
│ ◆ Invoices    │  - List View (table with search, filters, bulk)          │
│ ◆ Quotes      │  - Detail/Edit View (form + live preview)                │
│ ◆ Payments    │  - Report View (charts, tables, export)                  │
│ ◆ Clients     │                                                          │
│ ◆ Products    │                                                          │
│ ◆ Expenses    │                                                          │
│ ◆ Projects    │                                                          │
│ ◆ Time Track  │                                                          │
│ ◆ Vendors     │                                                          │
│ ◆ Credit Notes│                                                          │
│ ◆ Reports     │                                                          │
│ ◆ Settings    │                                                          │
│               │                                                          │
├───────────────┴──────────────────────────────────────────────────────────┤
│ Mobile BottomBar: [≡ Menu] [+ New] [📊 Dashboard]                       │
└──────────────────────────────────────────────────────────────────────────┘
```

### View Types

1. **Dashboard** — Revenue chart, outstanding/overdue amounts, recent invoices, quick actions
2. **List Views** — Invoices, Quotes, Payments, Clients, Products, Expenses, etc. (table with search/filter/sort)
3. **Detail/Edit Views** — Invoice editor, Client editor, etc. (form with live preview for documents)
4. **Report Views** — Revenue report, P&L, Tax summary, Aging report, Client statements
5. **Settings** — Business info, tax config, templates, number sequences

### Invoice Editor Sub-View (Detail View)

When editing an invoice/quote, show a split view:
```
┌─────────────────────────┬────────────────────────────────┐
│ Invoice Form (flex-1)    │ Live PDF Preview (w-[420px])   │
│                          │                                │
│ Client selector          │ ┌──────────────────────┐      │
│ Invoice #, Date, Due     │ │                      │      │
│ Line items table         │ │   INVOICE PREVIEW    │      │
│ + Add Line Item          │ │   (rendered HTML)    │      │
│ Subtotal / Tax / Total   │ │                      │      │
│ Notes & Terms            │ └──────────────────────┘      │
│ [Save Draft] [Send]      │                                │
└─────────────────────────┴────────────────────────────────┘
```

---

## 7. Chiko AI Manifest

### Actions (40+ planned)

**Dashboard:**
- `readDashboardSummary` — Get revenue, outstanding, overdue stats
- `readRecentActivity` — Get latest invoices, payments, expenses

**Invoices:**
- `createInvoice` — Create new invoice for client
- `updateInvoice` — Update invoice details
- `addLineItem` — Add line item to active invoice
- `removeLineItem` — Remove line item
- `setInvoiceStatus` — Change status (draft → sent → paid)
- `applyDiscount` — Apply discount to invoice
- `duplicateInvoice` — Clone an existing invoice
- `convertQuoteToInvoice` — Convert approved quote to invoice
- `recordPayment` — Record a payment against invoice

**Quotes:**
- `createQuote` — Create new quote
- `updateQuote` — Update quote details
- `approveQuote` — Mark quote as approved
- `convertToInvoice` — Convert to invoice

**Clients:**
- `createClient` — Add new client
- `updateClient` — Update client details
- `findClient` — Search clients by name/email
- `getClientStatement` — Generate client statement

**Products:**
- `createProduct` — Add new product/service
- `updateProduct` — Update product details
- `findProduct` — Search products

**Expenses:**
- `createExpense` — Record new expense
- `categorizeExpense` — Set expense category
- `linkExpenseToInvoice` — Make expense re-billable

**Time Tracking:**
- `startTimer` — Start time tracking on project
- `stopTimer` — Stop timer and log entry
- `logTime` — Manual time entry
- `convertTimeToInvoice` — Bill tracked time

**Reports:**
- `generateReport` — Create specific report type
- `getRevenueReport` — Revenue summary
- `getProfitLoss` — P&L statement
- `getTaxSummary` — ZRA tax report
- `getAgingReport` — Outstanding invoices aging
- `getClientStatement` — Per-client statement

**Settings:**
- `updateBusinessInfo` — Update company details
- `addTaxRate` — Create custom tax rate
- `updateInvoiceTemplate` — Change template design
- `updateNumberSequence` — Change numbering format

**Zambian-Specific:**
- `calculatePAYE` — Calculate PAYE for salary
- `calculateNAPSA` — Calculate NAPSA contributions
- `generateZRATaxReport` — ZRA-compliant VAT report

---

## 8. File Structure

```
src/
├── components/workspaces/invoice-accounting/
│   ├── InvoiceAccountingWorkspace.tsx          # Main workspace shell (nav + content)
│   ├── InvoiceAccountingRenderer.tsx           # Invoice/quote HTML renderer for preview & print
│   │
│   ├── views/
│   │   ├── DashboardView.tsx                   # Revenue charts, stats, recent activity
│   │   ├── InvoiceListView.tsx                 # Invoice list with search, filters, bulk ops
│   │   ├── InvoiceEditView.tsx                 # Invoice editor form + live preview
│   │   ├── QuoteListView.tsx                   # Quote list view
│   │   ├── QuoteEditView.tsx                   # Quote editor (shared with invoice editor)
│   │   ├── ClientListView.tsx                  # Client directory
│   │   ├── ClientEditView.tsx                  # Client details form
│   │   ├── ProductListView.tsx                 # Product/service catalog
│   │   ├── ProductEditView.tsx                 # Product editor
│   │   ├── PaymentListView.tsx                 # Payment history
│   │   ├── ExpenseListView.tsx                 # Expense tracker
│   │   ├── ExpenseEditView.tsx                 # Expense editor
│   │   ├── VendorListView.tsx                  # Vendor directory
│   │   ├── ProjectListView.tsx                 # Projects with time tracking
│   │   ├── TimeTrackingView.tsx                # Time entry + timer
│   │   ├── CreditNoteListView.tsx              # Credit notes
│   │   ├── ReportView.tsx                      # Reports (revenue, P&L, tax, aging)
│   │   └── SettingsView.tsx                    # Business info, taxes, templates, numbering
│   │
│   └── shared/
│       ├── DataTable.tsx                       # Reusable sortable/filterable table
│       ├── RecordHeader.tsx                    # Header bar for list/edit views
│       ├── StatusBadge.tsx                     # Status pill (paid, overdue, draft, etc.)
│       ├── CurrencyInput.tsx                   # Currency-formatted number input
│       ├── LineItemEditor.tsx                  # Line items table editor
│       ├── TaxCalculator.tsx                   # Tax calculation display
│       └── QuickStats.tsx                      # Stat cards for dashboards & lists
│
├── stores/invoice-accounting-editor.ts         # Zustand store
├── lib/chiko/manifests/invoice-accounting.ts   # Chiko manifest (40+ actions)
└── lib/invoice-accounting/
    ├── tax-engine.ts                           # Zambian tax calculations
    ├── number-format.ts                        # Currency & number formatting
    └── report-engine.ts                        # Report generation logic
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Store + Tax Engine + Settings)
- [ ] Zustand store with all interfaces and default state
- [ ] Tax engine with ZRA rates, PAYE, NAPSA calculations
- [ ] Currency/number formatting utilities
- [ ] Store adapter registration

### Phase 2: Core Workspace Shell
- [ ] Main workspace component with navigation sidebar
- [ ] Dashboard view with stats
- [ ] Settings view (business info, taxes)
- [ ] Mobile responsive layout

### Phase 3: Client & Product Management
- [ ] Client list + edit views
- [ ] Product/service catalog views
- [ ] Search and filter

### Phase 4: Invoice Engine
- [ ] Invoice list view
- [ ] Invoice editor with line items
- [ ] Invoice HTML renderer (3 templates)
- [ ] Tax calculations (inclusive/exclusive)
- [ ] PDF/print export

### Phase 5: Quotes & Credit Notes
- [ ] Quote CRUD
- [ ] Quote-to-invoice conversion
- [ ] Credit note management

### Phase 6: Payments & Expenses
- [ ] Payment recording
- [ ] Expense tracking
- [ ] Vendor management

### Phase 7: Time Tracking & Projects
- [ ] Project CRUD
- [ ] Time entry system
- [ ] Billable time → invoice conversion

### Phase 8: Reports
- [ ] Revenue report
- [ ] Profit & Loss
- [ ] Tax summary (ZRA-compliant)
- [ ] Aging report
- [ ] Client statements

### Phase 9: Chiko AI Integration
- [ ] Full manifest (40+ actions)
- [ ] Activity logging
- [ ] AI-powered invoice creation from description

### Phase 10: Polish & Registration
- [ ] Tool registration in tools.ts
- [ ] Page router registration
- [ ] Credit cost mapping
- [ ] TOOL-STATUS.md update
- [ ] TypeScript 0 errors

---

## 10. Tax Engine Specifications

### ZRA VAT Calculation

```typescript
// Exclusive: tax added on top
// Price: K100, VAT 16% → Tax: K16, Total: K116

// Inclusive: tax included in price
// Price: K116 (inclusive), VAT 16% → Base: K100, Tax: K16

function calculateVAT(amount: number, rate: number, mode: "inclusive" | "exclusive") {
  if (mode === "exclusive") {
    const tax = amount * (rate / 100);
    return { base: amount, tax, total: amount + tax };
  } else {
    const base = amount / (1 + rate / 100);
    const tax = amount - base;
    return { base, tax, total: amount };
  }
}
```

### PAYE Calculation (Monthly)

```typescript
function calculatePAYE(grossMonthly: number): number {
  if (grossMonthly <= 5100) return 0;
  let tax = 0;
  let remaining = grossMonthly;

  // Band 1: 0 - 5,100 = 0%
  remaining -= 5100;
  if (remaining <= 0) return 0;

  // Band 2: 5,101 - 7,100 = 20%
  const band2 = Math.min(remaining, 2000);
  tax += band2 * 0.20;
  remaining -= band2;
  if (remaining <= 0) return tax;

  // Band 3: 7,101 - 9,200 = 30%
  const band3 = Math.min(remaining, 2100);
  tax += band3 * 0.30;
  remaining -= band3;
  if (remaining <= 0) return tax;

  // Band 4: Above 9,200 = 37%
  tax += remaining * 0.37;
  return tax;
}
```

### NAPSA Calculation

```typescript
function calculateNAPSA(grossMonthly: number) {
  const NAPSA_RATE = 0.05;
  const NAPSA_CEILING = 24436; // Annual ceiling / 12
  const monthlyceiling = 1221.80;

  const employeeContrib = Math.min(grossMonthly * NAPSA_RATE, monthlyceiling);
  const employerContrib = Math.min(grossMonthly * NAPSA_RATE, monthlyceiling);

  return { employee: employeeContrib, employer: employerContrib, total: employeeContrib + employerContrib };
}
```

---

## 11. Export & PDF Generation

### Invoice/Quote Print via HTML

Use the existing `printHTML()` utility. Render invoice as HTML with:
- Company logo & branding
- Client info block
- Line items table
- Tax breakdown
- Payment terms & bank details
- Footer with ZRA TPIN

### 3 Invoice Templates

1. **Professional** — Clean corporate layout, blue accent
2. **Modern** — Minimalist with bold typography
3. **Classic** — Traditional business letterhead style

All templates include:
- ZRA-compliant fields (TPIN, VAT #)
- Zambian Kwacha formatting
- QR code placeholder for e-invoicing
- "Payment Instructions" section with bank details / mobile money

---

## 12. Testing Checklist

- [ ] Store initializes with correct defaults
- [ ] Client CRUD works end-to-end
- [ ] Product CRUD works end-to-end
- [ ] Invoice creation with line items calculates correctly
- [ ] VAT calculations (both inclusive & exclusive) are accurate
- [ ] PAYE tax calculations match ZRA tables
- [ ] NAPSA contributions calculate correctly
- [ ] Quote-to-invoice conversion preserves data
- [ ] Payment recording updates invoice balance
- [ ] Expense tracking with categories works
- [ ] Time tracking → invoice billing works
- [ ] Credit notes adjust client balances
- [ ] Reports generate correct totals
- [ ] Dashboard stats match underlying data
- [ ] Invoice PDF/print renders correctly
- [ ] Mobile responsive layout works
- [ ] All Chiko actions execute correctly
- [ ] TypeScript: 0 errors
- [ ] Build passes

---

*Created: 2026-03-31*
*Inspired by: Invoice Ninja (invoiceninja.com)*
*Localized for: Zambia (ZRA, NAPSA, PAYE, ZMW)*
