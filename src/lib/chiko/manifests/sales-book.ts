// =============================================================================
// DMSuite — Sales Book Editor Action Manifest for Chiko
// Describes all actions available on the Sales Book Designer for AI control.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useSalesBookEditor } from "@/stores/sales-book-editor";

/** Build the sales book action manifest. Call from the workspace component. */
export function createSalesBookManifest(): ChikoActionManifest {
  return {
    toolId: "sales-book-editor",
    toolName: "Sales Book Designer",
    actions: [
      {
        name: "updateBranding",
        description:
          "Update company branding fields: name, tagline, address, phone, email, website, taxId (TPIN), and banking details (bankName, bankAccount, bankAccountName, bankBranch, bankBranchCode, bankSwiftBic, bankIban, bankSortCode, bankReference, bankCustomLabel, bankCustomValue)",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Company name" },
            tagline: { type: "string", description: "Company tagline/slogan" },
            address: { type: "string", description: "Company address" },
            phone: { type: "string", description: "Phone number" },
            email: { type: "string", description: "Email address" },
            website: { type: "string", description: "Website URL" },
            taxId: { type: "string", description: "TPIN / Tax ID" },
            bankName: { type: "string", description: "Bank name" },
            bankAccount: { type: "string", description: "Bank account number" },
            bankAccountName: { type: "string", description: "Account holder name" },
            bankBranch: { type: "string", description: "Bank branch" },
            bankBranchCode: { type: "string", description: "Branch code" },
            bankSwiftBic: { type: "string", description: "SWIFT/BIC code" },
            bankIban: { type: "string", description: "IBAN" },
            bankSortCode: { type: "string", description: "Sort/routing code" },
            bankReference: { type: "string", description: "Payment reference" },
            bankCustomLabel: { type: "string", description: "Custom field label" },
            bankCustomValue: { type: "string", description: "Custom field value" },
            logoUrl: { type: "string", description: "Company logo as a data URI (base64 encoded image)" },
          },
        },
        category: "Branding",
      },
      {
        name: "updateSerial",
        description:
          "Change serial numbering: prefix, startNumber, endNumber, digitCount, showSerial",
        parameters: {
          type: "object",
          properties: {
            prefix: { type: "string", description: "Serial prefix (e.g. INV)" },
            startNumber: { type: "number", description: "Starting serial number" },
            endNumber: { type: "number", description: "Ending serial number" },
            digitCount: { type: "number", description: "Number of digits (zero-padded)" },
            showSerial: { type: "boolean", description: "Show serial numbers on forms" },
          },
        },
        category: "Numbering",
      },
      {
        name: "updateLayout",
        description:
          "Change form layout: itemRowCount, currency (currencySymbol, currencyCode, currencyDisplay), toggle fields (showDate, showDueDate, showPoNumber, showRecipient, showSender, showSubtotal, showDiscount, showTax, showTotal, showAmountInWords, showPaymentInfo, showSignature, showNotes, showTerms, termsText, notesLabel), custom fields (showCustomField1, customField1Label, showCustomField2, customField2Label, customFooterText)",
        parameters: {
          type: "object",
          properties: {
            itemRowCount: { type: "number", description: "Number of item rows" },
            currencySymbol: { type: "string", description: "Currency symbol (e.g. $, K, €)" },
            currencyCode: { type: "string", description: "Currency code (e.g. USD, ZMW)" },
            currencyDisplay: { type: "string", enum: ["symbol", "code"], description: "Show symbol or code" },
            showDate: { type: "boolean" },
            showDueDate: { type: "boolean" },
            showPoNumber: { type: "boolean" },
            showRecipient: { type: "boolean" },
            showSender: { type: "boolean" },
            showSubtotal: { type: "boolean" },
            showDiscount: { type: "boolean" },
            showTax: { type: "boolean" },
            showTotal: { type: "boolean" },
            showAmountInWords: { type: "boolean" },
            showPaymentInfo: { type: "boolean" },
            showSignature: { type: "boolean" },
            showNotes: { type: "boolean" },
            showTerms: { type: "boolean" },
            termsText: { type: "string", description: "Terms and conditions text" },
            notesLabel: { type: "string", description: "Notes section label" },
            showCustomField1: { type: "boolean" },
            customField1Label: { type: "string" },
            showCustomField2: { type: "boolean" },
            customField2Label: { type: "string" },
            customFooterText: { type: "string", description: "Pre-printed footer text" },
          },
        },
        category: "Layout",
      },
      {
        name: "toggleColumn",
        description: "Toggle a table column on or off",
        parameters: {
          type: "object",
          properties: {
            columnId: {
              type: "string",
              enum: ["index", "description", "quantity", "unit", "unitPrice", "discount", "tax", "amount"],
              description: "Column to toggle",
            },
          },
          required: ["columnId"],
        },
        category: "Layout",
      },
      {
        name: "updatePrint",
        description:
          "Change print settings: formsPerPage, pageSize (a4/a5/letter/legal), pageCount, showCutLines, showPageNumbers, bindingPosition (left/top)",
        parameters: {
          type: "object",
          properties: {
            formsPerPage: { type: "number", description: "Forms per page (1, 2, or 3)" },
            pageSize: { type: "string", enum: ["a4", "a5", "letter", "legal"] },
            pageCount: { type: "number", description: "Total pages to generate" },
            showCutLines: { type: "boolean" },
            showPageNumbers: { type: "boolean" },
            bindingPosition: { type: "string", enum: ["left", "top"] },
          },
        },
        category: "Print",
      },
      {
        name: "updateStyle",
        description:
          "Change visual style: template name, accentColor (hex), fontPairing, fieldStyle (underline/box/dotted), borderStyle (none/solid/double)",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string", description: "Template name" },
            accentColor: { type: "string", description: "Accent color hex (e.g. #2563eb)" },
            fontPairing: { type: "string", description: "Font pairing ID" },
            fieldStyle: { type: "string", enum: ["underline", "box", "dotted"] },
            borderStyle: { type: "string", enum: ["none", "solid", "double"] },
          },
        },
        category: "Style",
      },
      {
        name: "convertToType",
        description:
          "Switch to a different document type: invoice, quotation, receipt, delivery-note, credit-note, proforma-invoice, purchase-order",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["invoice", "quotation", "receipt", "delivery-note", "credit-note", "proforma-invoice", "purchase-order"],
              description: "Target document type",
            },
          },
          required: ["type"],
        },
        category: "Document",
      },
      {
        name: "resetForm",
        description: "Reset the form to defaults for the current (or specified) document type. WARNING: This erases all current settings.",
        parameters: {
          type: "object",
          properties: {
            docType: {
              type: "string",
              enum: ["invoice", "quotation", "receipt", "delivery-note", "credit-note", "proforma-invoice", "purchase-order"],
              description: "Document type to reset to (optional, defaults to current)",
            },
          },
        },
        category: "Document",
        destructive: true,
      },
      {
        name: "readCurrentState",
        description: "Get the current form configuration (read-only, no changes made)",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
    ],

    getState: () => {
      const { form } = useSalesBookEditor.getState();
      return {
        documentType: form.documentType,
        companyBranding: { ...form.companyBranding },
        serialConfig: { ...form.serialConfig },
        formLayout: { ...form.formLayout },
        printConfig: { ...form.printConfig },
        style: { ...form.style },
        brandLogos: {
          enabled: form.brandLogos.enabled,
          position: form.brandLogos.position,
          logoCount: form.brandLogos.logos.length,
        },
      };
    },

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useSalesBookEditor.getState();
      try {
        switch (actionName) {
          case "updateBranding":
            store.updateBranding(params as Parameters<typeof store.updateBranding>[0]);
            return { success: true, message: "Branding updated" };

          case "updateSerial":
            store.updateSerial(params as Parameters<typeof store.updateSerial>[0]);
            return { success: true, message: "Serial config updated" };

          case "updateLayout":
            store.updateLayout(params as Parameters<typeof store.updateLayout>[0]);
            return { success: true, message: "Layout updated" };

          case "toggleColumn":
            store.toggleColumn(params.columnId as string);
            return { success: true, message: `Column "${params.columnId}" toggled` };

          case "updatePrint":
            store.updatePrint(params as Parameters<typeof store.updatePrint>[0]);
            return { success: true, message: "Print settings updated" };

          case "updateStyle":
            store.updateStyle(params as Parameters<typeof store.updateStyle>[0]);
            return { success: true, message: "Style updated" };

          case "convertToType":
            store.convertToType(params.type as Parameters<typeof store.convertToType>[0]);
            return { success: true, message: `Converted to ${params.type}` };

          case "resetForm":
            store.resetForm(params.docType as Parameters<typeof store.resetForm>[0]);
            return { success: true, message: "Form reset to defaults" };

          case "readCurrentState":
            return {
              success: true,
              message: "Current state read",
              newState: readSalesBookState(),
            };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };
}

/** Helper — reads current state from the store (non-hook, uses getState) */
function readSalesBookState(): Record<string, unknown> {
  const { form } = useSalesBookEditor.getState();
  return {
    documentType: form.documentType,
    companyBranding: { ...form.companyBranding },
    serialConfig: { ...form.serialConfig },
    formLayout: { ...form.formLayout },
    printConfig: { ...form.printConfig },
    style: { ...form.style },
  };
}
