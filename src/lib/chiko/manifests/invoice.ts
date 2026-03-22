// =============================================================================
// DMSuite — Invoice Editor Action Manifest for Chiko
// Describes all actions available on the Invoice Designer for AI control.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useInvoiceEditor } from "@/stores/invoice-editor";
import { withActivityLogging } from "@/stores/activity-log";
import type {
  InvoiceData,
  CurrencyConfig,
  SalesDocumentType,
} from "@/lib/invoice/schema";
import type { CustomBlockType, BlockPosition } from "@/lib/sales-book/custom-blocks";
import { useBusinessMemory } from "@/stores/business-memory";
import { mapProfileToInvoiceBusinessInfo, mapProfileToInvoicePaymentInfo } from "@/lib/chiko/field-mapper";

/** Options for the invoice manifest factory */
export interface InvoiceManifestOptions {
  /** Ref to the export handler — called by exportDocument action */
  onExportRef?: React.RefObject<((format: string) => Promise<void>) | null>;
}

/** Build the invoice action manifest. Call from the workspace component. */
export function createInvoiceManifest(options?: InvoiceManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
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
        description: "Change the visual template. Options: modern-clean, classic-professional, minimal-white, bold-corporate, elegant-line, tech-startup, creative-studio, executive-premium, freelancer-simple, international",
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
        description: "Change the accent color used for headers, labels, and highlights",
        parameters: {
          type: "object",
          properties: {
            color: { type: "string", description: "Hex color (e.g. #2563eb, #0f766e, #7c3aed)" },
          },
          required: ["color"],
        },
        category: "Design",
      },
      {
        name: "setFontPairing",
        description: "Change the font pairing. Options: inter-inter, poppins-inter, playfair-source, montserrat-opensans, raleway-lato, dmserif-dmsans, bitter-inter, ibmplex-ibmplex, jetbrains-inter, cormorant-proza, spacegrotesk-inter, crimsonpro-worksans",
        parameters: {
          type: "object",
          properties: {
            fp: { type: "string", description: "Font pairing ID (e.g. playfair-source)" },
          },
          required: ["fp"],
        },
        category: "Design",
      },
      {
        name: "setPageFormat",
        description: "Change the page format / paper size",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["a4", "a5", "letter", "legal"], description: "Page format" },
          },
          required: ["format"],
        },
        category: "Design",
      },
      {
        name: "setHeaderStyle",
        description: "Change the header layout style independently from the template",
        parameters: {
          type: "object",
          properties: {
            style: { type: "string", enum: ["full", "compact", "minimal"], description: "Header layout" },
          },
          required: ["style"],
        },
        category: "Design",
      },
      {
        name: "setTableStyle",
        description: "Change the line-items table style independently from the template",
        parameters: {
          type: "object",
          properties: {
            style: { type: "string", enum: ["striped", "bordered", "clean", "minimal"], description: "Table style" },
          },
          required: ["style"],
        },
        category: "Design",
      },
      {
        name: "setWatermark",
        description: "Add or remove a watermark text overlay (e.g. DRAFT, PAID, CONFIDENTIAL). Pass empty string to remove.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Watermark text (empty to remove)" },
          },
          required: ["text"],
        },
        category: "Design",
      },
      {
        name: "setFooterText",
        description: "Set a custom footer line at the bottom of the invoice. Pass empty string to remove.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Footer text" },
          },
          required: ["text"],
        },
        category: "Design",
      },
      {
        name: "toggleSection",
        description: "Show or hide an invoice section: logo, paymentInfo, signature, notes, taxBreakdown",
        parameters: {
          type: "object",
          properties: {
            section: { type: "string", enum: ["logo", "paymentInfo", "signature", "notes", "taxBreakdown"], description: "Section name" },
            visible: { type: "boolean", description: "true to show, false to hide" },
          },
          required: ["section", "visible"],
        },
        category: "Design",
      },
      {
        name: "updateStyling",
        description: "Batch-update multiple design/styling properties at once. Accepts any combination of: template, accentColor, fontPairing, pageFormat, headerStyle, tableStyle, watermark, footerText, showLogo, showPaymentInfo, showSignature, showNotes, showTaxBreakdown",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string", description: "Template name" },
            accentColor: { type: "string", description: "Hex color" },
            fontPairing: { type: "string", description: "Font pairing ID" },
            pageFormat: { type: "string", enum: ["a4", "a5", "letter", "legal"] },
            headerStyle: { type: "string", enum: ["full", "compact", "minimal"] },
            tableStyle: { type: "string", enum: ["striped", "bordered", "clean", "minimal"] },
            watermark: { type: "string" },
            footerText: { type: "string" },
            showLogo: { type: "boolean" },
            showPaymentInfo: { type: "boolean" },
            showSignature: { type: "boolean" },
            showNotes: { type: "boolean" },
            showTaxBreakdown: { type: "boolean" },
          },
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
      {
        name: "prefillFromMemory",
        description: "Pre-fill the Invoice with the user's saved business profile (company info, banking/payment details, logo). Only call this after the user confirms.",
        parameters: { type: "object", properties: {} },
        category: "Business Info",
      },
      {
        name: "addCustomBlock",
        description: "Add a custom block to the invoice. Types: qr-code, text, divider, spacer, image, signature-box",
        parameters: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["qr-code", "text", "divider", "spacer", "image", "signature-box"], description: "Block type" },
            position: { type: "string", enum: ["after-header", "after-items", "before-signature", "after-footer"], description: "Where to place the block" },
            data: { type: "object", description: "Type-specific configuration" },
          },
          required: ["type"],
        },
        category: "Customization",
      },
      {
        name: "updateCustomBlock",
        description: "Modify an existing custom block's settings",
        parameters: {
          type: "object",
          properties: {
            blockId: { type: "string", description: "Block ID to update" },
            data: { type: "object", description: "Partial update of block-specific data" },
            position: { type: "string", enum: ["after-header", "after-items", "before-signature", "after-footer"] },
            alignment: { type: "string", enum: ["left", "center", "right"] },
            enabled: { type: "boolean" },
          },
          required: ["blockId"],
        },
        category: "Customization",
      },
      {
        name: "removeCustomBlock",
        description: "Remove a custom block from the invoice",
        parameters: {
          type: "object",
          properties: {
            blockId: { type: "string", description: "Block ID to remove" },
          },
          required: ["blockId"],
        },
        category: "Customization",
        destructive: true,
      },
      {
        name: "reorderCustomBlocks",
        description: "Reorder custom blocks by changing a block's position in the list",
        parameters: {
          type: "object",
          properties: {
            fromIndex: { type: "number", description: "Current index" },
            toIndex: { type: "number", description: "New index" },
          },
          required: ["fromIndex", "toIndex"],
        },
        category: "Customization",
      },
      {
        name: "exportDocument",
        description:
          "Export the current invoice/document as the specified format: pdf, csv, txt, json, clipboard, or print",
        parameters: {
          type: "object",
          properties: {
            format: {
              type: "string",
              enum: ["pdf", "csv", "txt", "json", "clipboard", "print"],
              description: "Export format",
            },
          },
          required: ["format"],
        },
        category: "Export",
      },
    ],

    getState: () => {
      const { invoice } = useInvoiceEditor.getState();
      // Strip logoUrl data URI to prevent state bloat — color extraction happens client-side
      const { logoUrl, ...bizWithoutLogo } = invoice.businessInfo;
      return {
        documentType: invoice.documentType,
        businessInfo: { ...bizWithoutLogo, hasLogo: !!logoUrl },
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
        customBlocks: ((invoice.customBlocks ?? []) as import("@/lib/sales-book/custom-blocks").CustomBlock[]).map(b => ({ id: b.id, type: b.type, position: b.position, enabled: b.enabled })),
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

          case "setPageFormat":
            store.setPageFormat(params.format as "a4" | "a5" | "letter" | "legal");
            return { success: true, message: `Page format set to ${params.format}` };

          case "setHeaderStyle":
            store.updateMetadata({ headerStyle: params.style as "full" | "compact" | "minimal" });
            return { success: true, message: `Header style set to ${params.style}` };

          case "setTableStyle":
            store.updateMetadata({ tableStyle: params.style as "striped" | "bordered" | "clean" | "minimal" });
            return { success: true, message: `Table style set to ${params.style}` };

          case "setWatermark":
            store.updateMetadata({ watermark: params.text as string });
            return { success: true, message: params.text ? `Watermark set to "${params.text}"` : "Watermark removed" };

          case "setFooterText":
            store.updateMetadata({ footerText: params.text as string });
            return { success: true, message: params.text ? `Footer text updated` : "Footer text removed" };

          case "toggleSection": {
            const sectionMap: Record<string, string> = {
              logo: "showLogo",
              paymentInfo: "showPaymentInfo",
              signature: "showSignature",
              notes: "showNotes",
              taxBreakdown: "showTaxBreakdown",
            };
            const key = sectionMap[params.section as string];
            if (!key) return { success: false, message: `Unknown section: ${params.section}` };
            store.updateMetadata({ [key]: params.visible as boolean });
            return { success: true, message: `${params.section} ${params.visible ? "shown" : "hidden"}` };
          }

          case "updateStyling": {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { ...styling } = params;
            store.updateMetadata(styling as Parameters<typeof store.updateMetadata>[0]);
            const fields = Object.keys(styling).join(", ");
            return { success: true, message: `Updated styling: ${fields}` };
          }

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

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved yet." };
            }
            const bizMapped = mapProfileToInvoiceBusinessInfo(memory.profile);
            const payMapped = mapProfileToInvoicePaymentInfo(memory.profile);
            let count = 0;
            if (Object.keys(bizMapped).length > 0) {
              store.updateBusinessInfo(bizMapped as Parameters<typeof store.updateBusinessInfo>[0]);
              count += Object.keys(bizMapped).length;
            }
            if (Object.keys(payMapped).length > 0) {
              store.updatePaymentInfo(payMapped as Parameters<typeof store.updatePaymentInfo>[0]);
              count += Object.keys(payMapped).length;
            }
            // Also apply preferred styling if set
            const profile = memory.profile;
            const styleParams: Record<string, unknown> = {};
            if (profile.preferredAccentColor) { styleParams.accentColor = profile.preferredAccentColor; count++; }
            if (profile.preferredFontPairing) { styleParams.fontPairing = profile.preferredFontPairing; count++; }
            if (Object.keys(styleParams).length > 0) {
              store.updateMetadata(styleParams as Parameters<typeof store.updateMetadata>[0]);
            }
            if (count === 0) {
              return { success: false, message: "Business profile has no fields to pre-fill." };
            }
            return { success: true, message: `Pre-filled ${count} fields from Business Memory.` };
          }

          case "addCustomBlock": {
            const blockId = store.addCustomBlock(
              params.type as CustomBlockType,
              {
                ...(params.position ? { position: params.position as BlockPosition } : {}),
                ...(params.data ? { data: params.data as Record<string, unknown> } : {}),
              } as Partial<import("@/lib/sales-book/custom-blocks").CustomBlock>,
            );
            return { success: true, message: `Added ${params.type} block (${blockId})` };
          }

          case "updateCustomBlock":
            store.updateCustomBlock(
              params.blockId as string,
              params as Partial<import("@/lib/sales-book/custom-blocks").CustomBlock>,
            );
            return { success: true, message: `Updated block ${params.blockId}` };

          case "removeCustomBlock":
            store.removeCustomBlock(params.blockId as string);
            return { success: true, message: `Removed block ${params.blockId}` };

          case "reorderCustomBlocks":
            store.reorderCustomBlocks(params.fromIndex as number, params.toIndex as number);
            return { success: true, message: "Blocks reordered" };

          case "exportDocument": {
            const format = params.format as string;
            if (!format) return { success: false, message: "Missing format parameter" };
            const handler = options?.onExportRef?.current;
            if (!handler) {
              return { success: false, message: "Export not ready yet — please wait a moment and try again." };
            }
            handler(format);
            return { success: true, message: `Exported invoice as ${format}.` };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useInvoiceEditor.getState().invoice,
    (snapshot) => useInvoiceEditor.getState().setInvoice(snapshot as InvoiceData),
  );
}
