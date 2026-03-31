// =============================================================================
// Chiko AI Manifest — Invoice & Accounting Hub
// 40+ actions for full invoice/accounting AI automation
// Zambia-specific: ZRA VAT, PAYE, NAPSA compliance
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import {
  useInvoiceAccountingEditor,
  calculateInvoiceTotals,
  calculatePAYE,
  calculateNAPSA,
  getInvoiceBalance,
  getClientBalance,
  formatCurrency,
  type InvoiceStatus,
  type QuoteStatus,
  type PurchaseOrderStatus,
  type PaymentMethod,
  type ExpenseCategory,
  type ViewType,
} from "@/stores/invoice-accounting-editor";

export interface InvoiceAccountingManifestOptions {
  onPrintRef?: React.RefObject<((docType: string, docId: string) => void) | null>;
}

function ok(message: string): ChikoActionResult {
  return { success: true, message };
}

function fail(message: string): ChikoActionResult {
  return { success: false, message };
}

export function createInvoiceAccountingManifest(
  options?: InvoiceAccountingManifestOptions
): ChikoActionManifest {
  const store = () => useInvoiceAccountingEditor.getState();
  const form = () => store().form;

  return {
    toolId: "invoice-tracker",
    toolName: "Invoice & Accounting Hub",

    actions: [
      // ── Navigation ──
      {
        name: "navigate",
        description: "Navigate to a specific view/section in the accounting hub",
        parameters: {
          type: "object",
          properties: {
            view: {
              type: "string",
              enum: ["dashboard", "invoices", "invoice-edit", "quotes", "quote-edit", "payments", "clients", "client-edit", "products", "product-edit", "expenses", "expense-edit", "vendors", "vendor-edit", "projects", "project-edit", "time-tracking", "credit-notes", "credit-note-edit", "purchase-orders", "purchase-order-edit", "reports", "settings"],
              description: "The view to navigate to",
            },
            recordId: { type: "string", description: "Optional record ID to edit" },
          },
          required: ["view"],
        },
        category: "Navigation",
      },

      // ── Client Management ──
      {
        name: "create_client",
        description: "Create a new client/customer with contact details, TPIN, and billing info",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Client/company name" },
            email: { type: "string" },
            phone: { type: "string" },
            contactPerson: { type: "string" },
            address: { type: "string" },
            city: { type: "string" },
            province: { type: "string" },
            country: { type: "string" },
            taxId: { type: "string", description: "TPIN for Zambian clients" },
            paymentTerms: { type: "number", description: "Payment terms in days (default 30)" },
          },
          required: ["name"],
        },
        category: "Clients",
      },
      {
        name: "update_client",
        description: "Update an existing client's details",
        parameters: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            updates: { type: "object", description: "Fields to update: name, email, phone, address, etc." },
          },
          required: ["clientId", "updates"],
        },
        category: "Clients",
      },
      {
        name: "list_clients",
        description: "List all clients with their outstanding balances",
        parameters: { type: "object", properties: {} },
        category: "Clients",
      },

      // ── Product/Service Management ──
      {
        name: "create_product",
        description: "Create a product or service with pricing, tax rate, and inventory",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            unitPrice: { type: "number" },
            cost: { type: "number", description: "Cost price for profit calculation" },
            isService: { type: "boolean" },
            taxRateId: { type: "string", description: "Tax rate ID (e.g. vat-standard)" },
            unit: { type: "string", description: "e.g. hours, pieces, kg" },
            sku: { type: "string" },
            category: { type: "string" },
          },
          required: ["name", "unitPrice"],
        },
        category: "Products",
      },

      // ── Invoice Operations ──
      {
        name: "create_invoice",
        description: "Create a new invoice for a client. Returns the new invoice ID.",
        parameters: {
          type: "object",
          properties: {
            clientId: { type: "string", description: "Client ID to invoice" },
          },
          required: ["clientId"],
        },
        category: "Invoices",
      },
      {
        name: "add_invoice_line",
        description: "Add a line item to an existing invoice",
        parameters: {
          type: "object",
          properties: {
            invoiceId: { type: "string" },
            description: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
            taxRateId: { type: "string", description: "e.g. vat-standard, vat-zero, no-tax" },
            discount: { type: "number", description: "Per-line discount %" },
            productId: { type: "string", description: "Optional product ID to auto-fill" },
          },
          required: ["invoiceId", "description", "quantity", "unitPrice"],
        },
        category: "Invoices",
      },
      {
        name: "update_invoice",
        description: "Update invoice fields like notes, terms, due date, discount",
        parameters: {
          type: "object",
          properties: {
            invoiceId: { type: "string" },
            updates: { type: "object", description: "Fields: notes, terms, dueDate, discount({type,value}), poNumber" },
          },
          required: ["invoiceId", "updates"],
        },
        category: "Invoices",
      },
      {
        name: "set_invoice_status",
        description: "Change the status of an invoice (draft, sent, paid, cancelled, overdue)",
        parameters: {
          type: "object",
          properties: {
            invoiceId: { type: "string" },
            status: { type: "string", enum: ["draft", "sent", "viewed", "partial", "paid", "overdue", "cancelled"] },
          },
          required: ["invoiceId", "status"],
        },
        category: "Invoices",
      },
      {
        name: "duplicate_invoice",
        description: "Duplicate an existing invoice as a new draft",
        parameters: {
          type: "object",
          properties: { invoiceId: { type: "string" } },
          required: ["invoiceId"],
        },
        category: "Invoices",
      },
      {
        name: "get_invoice_summary",
        description: "Get a summary of a specific invoice: totals, payments, balance, status",
        parameters: {
          type: "object",
          properties: { invoiceId: { type: "string" } },
          required: ["invoiceId"],
        },
        category: "Invoices",
      },
      {
        name: "print_invoice",
        description: "Print/export an invoice, quote, credit note, or purchase order",
        parameters: {
          type: "object",
          properties: {
            docType: { type: "string", enum: ["invoice", "quote", "credit-note", "purchase-order"] },
            docId: { type: "string" },
          },
          required: ["docType", "docId"],
        },
        category: "Invoices",
      },

      // ── Quote Operations ──
      {
        name: "create_quote",
        description: "Create a new quotation/estimate for a client",
        parameters: {
          type: "object",
          properties: { clientId: { type: "string" } },
          required: ["clientId"],
        },
        category: "Quotes",
      },
      {
        name: "add_quote_line",
        description: "Add a line item to a quote",
        parameters: {
          type: "object",
          properties: {
            quoteId: { type: "string" },
            description: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
            taxRateId: { type: "string" },
          },
          required: ["quoteId", "description", "quantity", "unitPrice"],
        },
        category: "Quotes",
      },
      {
        name: "convert_quote_to_invoice",
        description: "Convert an approved quote into an invoice",
        parameters: {
          type: "object",
          properties: { quoteId: { type: "string" } },
          required: ["quoteId"],
        },
        category: "Quotes",
      },

      // ── Payment Operations ──
      {
        name: "record_payment",
        description: "Record a payment against an invoice. Automatically updates invoice status.",
        parameters: {
          type: "object",
          properties: {
            invoiceId: { type: "string" },
            amount: { type: "number" },
            method: { type: "string", enum: ["cash", "bank-transfer", "mobile-money", "card", "cheque", "other"] },
            date: { type: "string", description: "YYYY-MM-DD" },
            reference: { type: "string" },
            notes: { type: "string" },
          },
          required: ["invoiceId", "amount", "method"],
        },
        category: "Payments",
      },

      // ── Expense Operations ──
      {
        name: "add_expense",
        description: "Record a business expense",
        parameters: {
          type: "object",
          properties: {
            amount: { type: "number" },
            category: { type: "string", enum: ["office", "travel", "supplies", "utilities", "marketing", "payroll", "rent", "insurance", "professional-services", "equipment", "other"] },
            description: { type: "string" },
            date: { type: "string" },
            vendorId: { type: "string" },
            isDeductible: { type: "boolean" },
            isBillable: { type: "boolean" },
          },
          required: ["amount", "category", "description"],
        },
        category: "Expenses",
      },

      // ── Vendor Operations ──
      {
        name: "create_vendor",
        description: "Create a new vendor/supplier",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            address: { type: "string" },
            taxId: { type: "string", description: "Vendor TPIN" },
          },
          required: ["name"],
        },
        category: "Vendors",
      },

      // ── Project & Time ──
      {
        name: "create_project",
        description: "Create a new project for time tracking",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            clientId: { type: "string" },
            hourlyRate: { type: "number" },
            budgetHours: { type: "number" },
            budgetAmount: { type: "number" },
          },
          required: ["name", "clientId"],
        },
        category: "Projects",
      },
      {
        name: "start_timer",
        description: "Start the time tracker for a project",
        parameters: {
          type: "object",
          properties: { projectId: { type: "string" } },
          required: ["projectId"],
        },
        category: "Time Tracking",
      },
      {
        name: "stop_timer",
        description: "Stop the running timer and create a time entry",
        parameters: { type: "object", properties: {} },
        category: "Time Tracking",
      },
      {
        name: "convert_time_to_invoice",
        description: "Convert billable time entries to an invoice",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            entryIds: { type: "array", items: { type: "string" } },
          },
          required: ["projectId", "entryIds"],
        },
        category: "Time Tracking",
      },

      // ── Credit Notes ──
      {
        name: "create_credit_note",
        description: "Create a credit note for a client (optionally linked to an invoice)",
        parameters: {
          type: "object",
          properties: {
            clientId: { type: "string" },
            invoiceId: { type: "string" },
          },
          required: ["clientId"],
        },
        category: "Credit Notes",
      },

      // ── Purchase Orders ──
      {
        name: "create_purchase_order",
        description: "Create a purchase order for a vendor",
        parameters: {
          type: "object",
          properties: { vendorId: { type: "string" } },
          required: ["vendorId"],
        },
        category: "Purchase Orders",
      },

      // ── Tax & Compliance ──
      {
        name: "calculate_paye",
        description: "Calculate Zambian PAYE tax for a given monthly gross salary",
        parameters: {
          type: "object",
          properties: { grossMonthly: { type: "number", description: "Monthly gross salary in ZMW" } },
          required: ["grossMonthly"],
        },
        category: "Tax & Compliance",
      },
      {
        name: "calculate_napsa",
        description: "Calculate Zambian NAPSA contributions (employee + employer)",
        parameters: {
          type: "object",
          properties: { grossMonthly: { type: "number" } },
          required: ["grossMonthly"],
        },
        category: "Tax & Compliance",
      },
      {
        name: "add_tax_rate",
        description: "Add a custom tax rate to the system",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            rate: { type: "number" },
            isCompound: { type: "boolean" },
            description: { type: "string" },
          },
          required: ["name", "rate"],
        },
        category: "Tax & Compliance",
      },

      // ── Reports ──
      {
        name: "get_financial_summary",
        description: "Get a financial summary: revenue, expenses, profit, outstanding invoices, aging",
        parameters: {
          type: "object",
          properties: {
            startDate: { type: "string", description: "YYYY-MM-DD" },
            endDate: { type: "string", description: "YYYY-MM-DD" },
          },
        },
        category: "Reports",
      },
      {
        name: "get_client_statement",
        description: "Get a statement of account for a specific client",
        parameters: {
          type: "object",
          properties: { clientId: { type: "string" } },
          required: ["clientId"],
        },
        category: "Reports",
      },

      // ── Business Settings ──
      {
        name: "update_business_settings",
        description: "Update business information: name, address, TPIN, NAPSA, bank details, mobile money",
        parameters: {
          type: "object",
          properties: {
            updates: {
              type: "object",
              description: "Fields: name, address, city, phone, email, taxId (TPIN), napsaNumber, bankName, bankAccountName, bankAccountNumber, bankSwiftCode, mobileMoneyProvider, mobileMoneyNumber, mobileMoneyName, currency, defaultPaymentTerms, invoicePrefix",
            },
          },
          required: ["updates"],
        },
        category: "Settings",
      },
      {
        name: "update_invoice_style",
        description: "Update invoice template and styling: template, accent color, font, logo, watermark",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string", enum: ["professional", "modern", "classic", "minimal", "bold"] },
            accentColor: { type: "string" },
            fontFamily: { type: "string" },
            showLogo: { type: "boolean" },
            showPaymentInfo: { type: "boolean" },
            showSignatureLine: { type: "boolean" },
            showWatermark: { type: "boolean" },
            watermarkText: { type: "string" },
          },
        },
        category: "Settings",
      },

      // ── Bulk Operations ──
      {
        name: "bulk_set_invoice_status",
        description: "Set status for multiple invoices at once",
        parameters: {
          type: "object",
          properties: {
            invoiceIds: { type: "array", items: { type: "string" } },
            status: { type: "string", enum: ["draft", "sent", "paid", "cancelled"] },
          },
          required: ["invoiceIds", "status"],
        },
        category: "Bulk Operations",
      },

      // ── Reset ──
      {
        name: "reset_all_data",
        description: "Reset all accounting data to defaults. THIS IS DESTRUCTIVE!",
        parameters: { type: "object", properties: {} },
        category: "Settings",
        destructive: true,
      },
    ],

    getState: () => {
      const f = form();
      const payments = f.payments;
      return {
        businessName: f.business.name,
        currency: f.business.currency,
        taxMode: f.business.taxMode,
        clientCount: f.clients.length,
        productCount: f.products.length,
        invoiceCount: f.invoices.length,
        quoteCount: f.quotes.length,
        paymentCount: f.payments.length,
        expenseCount: f.expenses.length,
        vendorCount: f.vendors.length,
        projectCount: f.projects.length,
        timeEntryCount: f.timeEntries.length,
        creditNoteCount: f.creditNotes.length,
        purchaseOrderCount: f.purchaseOrders.length,
        activeView: f.activeView,
        activeRecordId: f.activeRecordId,
        timerRunning: !!f.activeTimerStart,
        timerProject: f.activeTimerProjectId,
        recentInvoices: f.invoices.slice(-5).map((inv) => ({
          id: inv.id,
          number: inv.number,
          client: f.clients.find((c) => c.id === inv.clientId)?.name || "",
          status: inv.status,
          total: calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount).total,
          balance: getInvoiceBalance(inv, payments),
        })),
        clients: f.clients.map((c) => ({
          id: c.id,
          name: c.name,
          balance: getClientBalance(c.id, f.invoices, f.payments),
        })),
        products: f.products.map((p) => ({ id: p.id, name: p.name, price: p.unitPrice })),
        taxRates: f.taxes.map((t) => ({ id: t.id, name: t.name, rate: t.rate })),
        projects: f.projects.map((p) => ({ id: p.id, name: p.name, status: p.status })),
        template: f.style.template,
        accentColor: f.style.accentColor,
      };
    },

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const s = store();
      const f = form();

      switch (actionName) {
        case "navigate": {
          s.setView(params.view as ViewType, params.recordId as string | undefined);
          return ok(`Navigated to ${params.view}`);
        }

        case "create_client": {
          const id = s.addClient({
            name: (params.name as string) || "",
            contactPerson: (params.contactPerson as string) || "",
            email: (params.email as string) || "",
            phone: (params.phone as string) || "",
            address: (params.address as string) || "",
            city: (params.city as string) || "",
            province: (params.province as string) || "",
            country: (params.country as string) || "Zambia",
            taxId: (params.taxId as string) || "",
            currency: f.business.currency,
            paymentTerms: (params.paymentTerms as number) || f.business.defaultPaymentTerms,
            notes: "",
          });
          return ok(`Created client "${params.name}" (ID: ${id})`);
        }

        case "update_client": {
          s.updateClient(params.clientId as string, params.updates as any);
          return ok(`Updated client ${params.clientId}`);
        }

        case "list_clients": {
          const list = f.clients.map((c) => `${c.name}: ${formatCurrency(getClientBalance(c.id, f.invoices, f.payments))} outstanding`);
          return ok(`${f.clients.length} clients:\n${list.join("\n")}`);
        }

        case "create_product": {
          const id = s.addProduct({
            name: (params.name as string) || "",
            description: (params.description as string) || "",
            unitPrice: (params.unitPrice as number) || 0,
            cost: (params.cost as number) || 0,
            taxRateId: (params.taxRateId as string) || "vat-standard",
            unit: (params.unit as string) || "each",
            sku: (params.sku as string) || "",
            inStock: 0,
            trackInventory: false,
            category: (params.category as string) || "",
            isService: (params.isService as boolean) || false,
          });
          return ok(`Created product "${params.name}" (ID: ${id})`);
        }

        case "create_invoice": {
          const id = s.createInvoice(params.clientId as string);
          s.setView("invoice-edit", id);
          return ok(`Created invoice (ID: ${id})`);
        }

        case "add_invoice_line": {
          const taxRate = params.taxRateId ? f.taxes.find((t) => t.id === params.taxRateId) : f.taxes.find((t) => t.isDefault);
          const lineId = s.addInvoiceLineItem(params.invoiceId as string, {
            description: (params.description as string) || "",
            quantity: (params.quantity as number) || 1,
            unitPrice: (params.unitPrice as number) || 0,
            taxRateId: taxRate?.id || "no-tax",
            taxRate: taxRate?.rate ?? 0,
            taxName: taxRate?.name ?? "No Tax",
            discount: (params.discount as number) || 0,
            productId: (params.productId as string) || "",
          });
          return ok(`Added line item to invoice (line ID: ${lineId})`);
        }

        case "update_invoice": {
          s.updateInvoice(params.invoiceId as string, params.updates as any);
          return ok(`Updated invoice ${params.invoiceId}`);
        }

        case "set_invoice_status": {
          s.setInvoiceStatus(params.invoiceId as string, params.status as InvoiceStatus);
          return ok(`Invoice status set to ${params.status}`);
        }

        case "duplicate_invoice": {
          const id = s.duplicateInvoice(params.invoiceId as string);
          return ok(`Duplicated invoice (new ID: ${id})`);
        }

        case "get_invoice_summary": {
          const inv = f.invoices.find((i) => i.id === params.invoiceId);
          if (!inv) return fail("Invoice not found");
          const totals = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
          const balance = getInvoiceBalance(inv, f.payments);
          const client = f.clients.find((c) => c.id === inv.clientId);
          return ok(`Invoice ${inv.number}\nClient: ${client?.name || "—"}\nStatus: ${inv.status}\nSubtotal: ${formatCurrency(totals.subtotal)}\nTax: ${formatCurrency(totals.taxTotal)}\nTotal: ${formatCurrency(totals.total)}\nPaid: ${formatCurrency(totals.total - balance)}\nBalance: ${formatCurrency(balance)}`);
        }

        case "print_invoice": {
          if (options?.onPrintRef?.current) {
            options.onPrintRef.current(params.docType as string, params.docId as string);
            return ok(`Printing ${params.docType} ${params.docId}`);
          }
          return fail("Print not available in this context");
        }

        case "create_quote": {
          const id = s.createQuote(params.clientId as string);
          s.setView("quote-edit", id);
          return ok(`Created quote (ID: ${id})`);
        }

        case "add_quote_line": {
          const taxRate = params.taxRateId ? f.taxes.find((t) => t.id === params.taxRateId) : f.taxes.find((t) => t.isDefault);
          s.addQuoteLineItem(params.quoteId as string, {
            description: (params.description as string) || "",
            quantity: (params.quantity as number) || 1,
            unitPrice: (params.unitPrice as number) || 0,
            taxRateId: taxRate?.id || "no-tax",
            taxRate: taxRate?.rate ?? 0,
            taxName: taxRate?.name ?? "No Tax",
          });
          return ok("Added line item to quote");
        }

        case "convert_quote_to_invoice": {
          const invId = s.convertQuoteToInvoice(params.quoteId as string);
          s.setView("invoice-edit", invId);
          return ok(`Converted quote to invoice (ID: ${invId})`);
        }

        case "record_payment": {
          const id = s.recordPayment(params.invoiceId as string, {
            amount: (params.amount as number) || 0,
            date: (params.date as string) || new Date().toISOString().slice(0, 10),
            method: (params.method as PaymentMethod) || "bank-transfer",
            reference: (params.reference as string) || "",
            notes: (params.notes as string) || "",
            currency: f.business.currency,
          });
          return ok(`Payment recorded (ID: ${id})`);
        }

        case "add_expense": {
          const id = s.addExpense({
            vendorId: (params.vendorId as string) || "",
            category: (params.category as ExpenseCategory) || "other",
            amount: (params.amount as number) || 0,
            date: (params.date as string) || new Date().toISOString().slice(0, 10),
            description: (params.description as string) || "",
            reference: "",
            taxRateId: "",
            taxRate: 0,
            isDeductible: (params.isDeductible as boolean) ?? true,
            isBillable: (params.isBillable as boolean) ?? false,
            invoiceId: "",
            projectId: "",
            currency: f.business.currency,
          });
          return ok(`Expense recorded: ${formatCurrency(params.amount as number)} (ID: ${id})`);
        }

        case "create_vendor": {
          const id = s.addVendor({
            name: (params.name as string) || "",
            contactPerson: "",
            email: (params.email as string) || "",
            phone: (params.phone as string) || "",
            address: (params.address as string) || "",
            city: "",
            country: "Zambia",
            taxId: (params.taxId as string) || "",
            notes: "",
          });
          return ok(`Created vendor "${params.name}" (ID: ${id})`);
        }

        case "create_project": {
          const id = s.addProject({
            name: (params.name as string) || "",
            clientId: (params.clientId as string) || "",
            hourlyRate: (params.hourlyRate as number) || 0,
            budgetHours: (params.budgetHours as number) || 0,
            budgetAmount: (params.budgetAmount as number) || 0,
            status: "active",
            notes: "",
            color: "#8b5cf6",
          });
          return ok(`Created project "${params.name}" (ID: ${id})`);
        }

        case "start_timer": {
          s.startTimer(params.projectId as string);
          return ok("Timer started");
        }

        case "stop_timer": {
          const entryId = s.stopTimer();
          return entryId ? ok(`Timer stopped. Time entry created (ID: ${entryId})`) : fail("No timer running");
        }

        case "convert_time_to_invoice": {
          const invId = s.convertTimeToInvoice(params.projectId as string, params.entryIds as string[]);
          if (invId) {
            s.setView("invoice-edit", invId);
            return ok(`Created invoice from time entries (ID: ${invId})`);
          }
          return fail("Failed to create invoice from time entries");
        }

        case "create_credit_note": {
          const id = s.createCreditNote(params.clientId as string, params.invoiceId as string | undefined);
          s.setView("credit-note-edit", id);
          return ok(`Created credit note (ID: ${id})`);
        }

        case "create_purchase_order": {
          const id = s.createPurchaseOrder(params.vendorId as string);
          s.setView("purchase-order-edit", id);
          return ok(`Created purchase order (ID: ${id})`);
        }

        case "calculate_paye": {
          const gross = (params.grossMonthly as number) || 0;
          const paye = calculatePAYE(gross);
          const net = gross - paye;
          return ok(`PAYE for K${gross.toLocaleString()}/month:\nTax: ${formatCurrency(paye)}\nNet Pay: ${formatCurrency(net)}\nEffective Rate: ${gross > 0 ? ((paye / gross) * 100).toFixed(1) : "0"}%`);
        }

        case "calculate_napsa": {
          const gross = (params.grossMonthly as number) || 0;
          const napsa = calculateNAPSA(gross);
          return ok(`NAPSA for K${gross.toLocaleString()}/month:\nEmployee (5%): ${formatCurrency(napsa.employee)}\nEmployer (5%): ${formatCurrency(napsa.employer)}\nTotal: ${formatCurrency(napsa.total)}`);
        }

        case "add_tax_rate": {
          const id = s.addTaxRate({
            name: (params.name as string) || "",
            rate: (params.rate as number) || 0,
            isDefault: false,
            isCompound: (params.isCompound as boolean) || false,
            description: (params.description as string) || "",
          });
          return ok(`Added tax rate "${params.name}" at ${params.rate}% (ID: ${id})`);
        }

        case "get_financial_summary": {
          const start = (params.startDate as string) || "";
          const end = (params.endDate as string) || "";
          const invoices = start ? f.invoices.filter((i) => i.date >= start && i.date <= end) : f.invoices;
          const expenses = start ? f.expenses.filter((e) => e.date >= start && e.date <= end) : f.expenses;
          const payments = start ? f.payments.filter((p) => p.date >= start && p.date <= end) : f.payments;

          const totalInvoiced = invoices.reduce((s, inv) => s + calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount).total, 0);
          const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
          const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
          const overdue = f.invoices.filter((i) => i.status === "overdue").length;

          return ok(`Financial Summary${start ? ` (${start} to ${end})` : ""}:\nInvoiced: ${formatCurrency(totalInvoiced)}\nReceived: ${formatCurrency(totalPaid)}\nExpenses: ${formatCurrency(totalExpenses)}\nProfit: ${formatCurrency(totalPaid - totalExpenses)}\nOverdue Invoices: ${overdue}`);
        }

        case "get_client_statement": {
          const client = f.clients.find((c) => c.id === params.clientId);
          if (!client) return fail("Client not found");
          const clientInvoices = f.invoices.filter((i) => i.clientId === client.id);
          const balance = getClientBalance(client.id, f.invoices, f.payments);
          const lines = clientInvoices.map((inv) => {
            const t = calculateInvoiceTotals(inv.lineItems, inv.taxMode, inv.discount);
            const b = getInvoiceBalance(inv, f.payments);
            return `  ${inv.number} | ${inv.date} | ${inv.status} | Total: ${formatCurrency(t.total)} | Balance: ${formatCurrency(b)}`;
          });
          return ok(`Statement for ${client.name}:\nOutstanding: ${formatCurrency(balance)}\nInvoices:\n${lines.join("\n")}`);
        }

        case "update_business_settings": {
          s.updateBusiness(params.updates as any);
          return ok("Business settings updated");
        }

        case "update_invoice_style": {
          const styleUpdates: Record<string, unknown> = {};
          if (params.template) styleUpdates.template = params.template;
          if (params.accentColor) styleUpdates.accentColor = params.accentColor;
          if (params.fontFamily) styleUpdates.fontFamily = params.fontFamily;
          if (params.showLogo !== undefined) styleUpdates.showLogo = params.showLogo;
          if (params.showPaymentInfo !== undefined) styleUpdates.showPaymentInfo = params.showPaymentInfo;
          if (params.showSignatureLine !== undefined) styleUpdates.showSignatureLine = params.showSignatureLine;
          if (params.showWatermark !== undefined) styleUpdates.showWatermark = params.showWatermark;
          if (params.watermarkText) styleUpdates.watermarkText = params.watermarkText;
          s.updateStyle(styleUpdates as any);
          if (params.template) s.setTemplate(params.template as any);
          if (params.accentColor) s.setAccentColor(params.accentColor as string);
          return ok("Invoice style updated");
        }

        case "bulk_set_invoice_status": {
          s.bulkSetInvoiceStatus(params.invoiceIds as string[], params.status as InvoiceStatus);
          return ok(`Updated ${(params.invoiceIds as string[]).length} invoices to ${params.status}`);
        }

        case "reset_all_data": {
          s.resetForm();
          return ok("All accounting data has been reset to defaults");
        }

        default:
          return fail(`Unknown action: ${actionName}`);
      }
    },
  };
}
