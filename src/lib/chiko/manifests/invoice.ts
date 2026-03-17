// =============================================================================
// DMSuite — Invoice Editor Action Manifest for Chiko
// Describes all actions available on the Invoice Designer for AI control.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import type {
  CurrencyConfig,
  SalesDocumentType,
} from "@/lib/invoice/schema";

/** Build the invoice action manifest. Call from the workspace component. */
export function createInvoiceManifest(): ChikoActionManifest {
  return {
    toolId: "invoice-editor",
    toolName: "Invoice Designer",
    actions: [
      {
        name: "updateBusinessInfo",
        description:
          "Update the sender's business information: name, address, email, phone, website, taxId, logoUrl",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Business name" },
            address: { type: "string", description: "Business address" },
            email: { type: "string", description: "Business email" },
            phone: { type: "string", description: "Business phone" },
            website: { type: "string", description: "Business website" },
            taxId: { type: "string", description: "TPIN / Tax ID" },
            logoUrl: { type: "string", description: "Logo URL or data URI" },
          },
        },
        category: "Business",
      },
      {
        name: "updateClientInfo",
        description:
          "Update the recipient/client information: name, company, address, email, phone, taxId",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Client name" },
            company: { type: "string", description: "Client company name" },
            address: { type: "string", description: "Client address" },
            email: { type: "string", description: "Client email" },
            phone: { type: "string", description: "Client phone" },
            taxId: { type: "string", description: "Client TPIN / Tax ID" },
          },
        },
        category: "Client",
      },
      {
        name: "setInvoiceNumber",
        description: "Set the invoice number",
        parameters: {
          type: "object",
          properties: {
            num: { type: "string", description: "Invoice number (e.g. INV-001)" },
          },
          required: ["num"],
        },
        category: "Details",
      },
      {
        name: "setIssueDate",
        description: "Set the issue/creation date (also auto-updates due date based on payment terms)",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date in ISO format (YYYY-MM-DD)" },
          },
          required: ["date"],
        },
        category: "Details",
      },
      {
        name: "setDueDate",
        description: "Set the payment due date",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date in ISO format (YYYY-MM-DD)" },
          },
          required: ["date"],
        },
        category: "Details",
      },
      {
        name: "addLineItem",
        description: "Add a new blank line item to the invoice",
        parameters: { type: "object", properties: {} },
        category: "Items",
      },
      {
        name: "updateLineItem",
        description:
          "Update an existing line item: description, quantity, unitPrice, discountType (percent/fixed), discountValue, taxRate",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Line item ID" },
            description: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
            discountType: { type: "string", enum: ["percent", "fixed"] },
            discountValue: { type: "number" },
            taxRate: { type: "number" },
          },
          required: ["id"],
        },
        category: "Items",
      },
      {
        name: "removeLineItem",
        description: "Remove a line item by ID",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Line item ID to remove" },
          },
          required: ["id"],
        },
        category: "Items",
      },
      {
        name: "setCurrency",
        description: "Change the currency configuration: code (e.g. USD), symbol (e.g. $), locale (e.g. en-US)",
        parameters: {
          type: "object",
          properties: {
            code: { type: "string", description: "Currency code (e.g. USD, EUR, ZMW)" },
            symbol: { type: "string", description: "Currency symbol (e.g. $, €, K)" },
            locale: { type: "string", description: "Locale string (e.g. en-US)" },
          },
          required: ["code", "symbol", "locale"],
        },
        category: "Finance",
      },
      {
        name: "updateTax",
        description: "Update tax configuration: rate, label, isInclusive, secondaryRate, secondaryLabel",
        parameters: {
          type: "object",
          properties: {
            rate: { type: "number", description: "Tax rate percentage" },
            label: { type: "string", description: "Tax label (e.g. VAT, GST)" },
            isInclusive: { type: "boolean", description: "Whether tax is inclusive" },
            secondaryRate: { type: "number" },
            secondaryLabel: { type: "string" },
          },
        },
        category: "Finance",
      },
      {
        name: "updatePaymentInfo",
        description:
          "Update payment information: bankName, accountName, accountNumber, routingNumber, swiftCode, paypalEmail, notes",
        parameters: {
          type: "object",
          properties: {
            bankName: { type: "string" },
            accountName: { type: "string" },
            accountNumber: { type: "string" },
            routingNumber: { type: "string" },
            swiftCode: { type: "string" },
            paypalEmail: { type: "string" },
            notes: { type: "string", description: "Payment notes" },
          },
        },
        category: "Finance",
      },
      {
        name: "setNotes",
        description: "Set the notes text on the invoice",
        parameters: {
          type: "object",
          properties: {
            notes: { type: "string", description: "Notes text" },
          },
          required: ["notes"],
        },
        category: "Content",
      },
      {
        name: "setTerms",
        description: "Set the terms and conditions text",
        parameters: {
          type: "object",
          properties: {
            terms: { type: "string", description: "Terms and conditions text" },
          },
          required: ["terms"],
        },
        category: "Content",
      },
      {
        name: "setTemplate",
        description: "Change the visual template",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string", description: "Template name" },
          },
          required: ["template"],
        },
        category: "Design",
      },
      {
        name: "setAccentColor",
        description: "Change the accent color",
        parameters: {
          type: "object",
          properties: {
            color: { type: "string", description: "Hex color (e.g. #2563eb)" },
          },
          required: ["color"],
        },
        category: "Design",
      },
      {
        name: "setFontPairing",
        description: "Change the font pairing",
        parameters: {
          type: "object",
          properties: {
            fp: { type: "string", description: "Font pairing ID" },
          },
          required: ["fp"],
        },
        category: "Design",
      },
      {
        name: "resetInvoice",
        description: "Reset to defaults for the current (or specified) document type. WARNING: This erases all current data.",
        parameters: {
          type: "object",
          properties: {
            docType: {
              type: "string",
              enum: ["invoice", "quotation", "receipt", "delivery-note", "credit-note", "proforma-invoice", "purchase-order"],
              description: "Document type to reset to (optional)",
            },
          },
        },
        category: "Document",
        destructive: true,
      },
      {
        name: "readCurrentState",
        description: "Get the current invoice data (read-only, no changes made)",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
    ],

    getState: () => {
      const { invoice } = useInvoiceEditor.getState();
      return {
        documentType: invoice.documentType,
        businessInfo: { ...invoice.businessInfo },
        clientInfo: { ...invoice.clientInfo },
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        poNumber: invoice.poNumber,
        paymentTerms: invoice.paymentTerms,
        status: invoice.status,
        lineItemCount: invoice.lineItems.length,
        lineItems: invoice.lineItems.map((li) => ({
          id: li.id,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
        currency: { ...invoice.currency },
        tax: { ...invoice.tax },
        paymentInfo: { ...invoice.paymentInfo },
        notes: invoice.notes,
        terms: invoice.terms,
        metadata: { ...invoice.metadata },
      };
    },

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useInvoiceEditor.getState();
      try {
        switch (actionName) {
          case "updateBusinessInfo":
            store.updateBusinessInfo(params as Parameters<typeof store.updateBusinessInfo>[0]);
            return { success: true, message: "Business info updated" };

          case "updateClientInfo":
            store.updateClientInfo(params as Parameters<typeof store.updateClientInfo>[0]);
            return { success: true, message: "Client info updated" };

          case "setInvoiceNumber":
            store.setInvoiceNumber(params.num as string);
            return { success: true, message: `Invoice number set to ${params.num}` };

          case "setIssueDate":
            store.setIssueDate(params.date as string);
            return { success: true, message: `Issue date set to ${params.date}` };

          case "setDueDate":
            store.setDueDate(params.date as string);
            return { success: true, message: `Due date set to ${params.date}` };

          case "addLineItem":
            store.addLineItem();
            return { success: true, message: "New line item added" };

          case "updateLineItem": {
            const { id, ...patch } = params;
            store.updateLineItem(id as string, patch as Parameters<typeof store.updateLineItem>[1]);
            return { success: true, message: `Line item updated` };
          }

          case "removeLineItem":
            store.removeLineItem(params.id as string);
            return { success: true, message: "Line item removed" };

          case "setCurrency":
            store.setCurrency(params as CurrencyConfig);
            return { success: true, message: `Currency set to ${params.code}` };

          case "updateTax":
            store.updateTax(params as Parameters<typeof store.updateTax>[0]);
            return { success: true, message: "Tax config updated" };

          case "updatePaymentInfo":
            store.updatePaymentInfo(params as Parameters<typeof store.updatePaymentInfo>[0]);
            return { success: true, message: "Payment info updated" };

          case "setNotes":
            store.setNotes(params.notes as string);
            return { success: true, message: "Notes updated" };

          case "setTerms":
            store.setTerms(params.terms as string);
            return { success: true, message: "Terms updated" };

          case "setTemplate":
            store.setTemplate(params.template as string);
            return { success: true, message: `Template changed to ${params.template}` };

          case "setAccentColor":
            store.setAccentColor(params.color as string);
            return { success: true, message: `Accent color set to ${params.color}` };

          case "setFontPairing":
            store.setFontPairing(params.fp as string);
            return { success: true, message: `Font pairing changed` };

          case "resetInvoice":
            store.resetInvoice(params.docType as SalesDocumentType | undefined);
            return { success: true, message: "Invoice reset to defaults" };

          case "readCurrentState": {
            const { invoice } = useInvoiceEditor.getState();
            return {
              success: true,
              message: "Current state read",
              newState: {
                documentType: invoice.documentType,
                businessInfo: { ...invoice.businessInfo },
                clientInfo: { ...invoice.clientInfo },
                invoiceNumber: invoice.invoiceNumber,
                lineItemCount: invoice.lineItems.length,
                currency: { ...invoice.currency },
                metadata: { ...invoice.metadata },
              },
            };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };
}
