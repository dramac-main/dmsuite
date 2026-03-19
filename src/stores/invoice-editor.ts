// =============================================================================
// DMSuite — Invoice Designer Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo.
// Mirrors resume-editor.ts pattern.
// =============================================================================

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import equal from "fast-deep-equal";
import type {
  InvoiceData,
  LineItem,
  InvoiceMetadata,
  CurrencyConfig,
  TaxConfig,
  PaymentInfo,
  BusinessInfo,
  ClientInfo,
  Signature,
  AdditionalCharge,
  SalesDocumentType,
} from "@/lib/invoice/schema";
import {
  createDefaultInvoiceData,
  createDefaultLineItem,
  calcDueDate,
  convertDocumentType,
  DOCUMENT_TYPE_CONFIGS,
} from "@/lib/invoice/schema";
import { getInvoiceTemplate } from "@/lib/invoice/templates/template-defs";
import type { CustomBlock, CustomBlockType } from "@/lib/sales-book/custom-blocks";
import { createDefaultBlock } from "@/lib/sales-book/custom-blocks";

// ---------------------------------------------------------------------------
// Accent Color Lock — once user/Chiko explicitly sets a color, preserve it
// across template switches. Reset only on full form reset or data load.
// ---------------------------------------------------------------------------

let _accentLocked = false;

/** Check if accent color is locked (user has explicitly customized it) */
export function isInvoiceAccentLocked(): boolean { return _accentLocked; }

/** Explicitly lock/unlock accent (used by tests or programmatic reset) */
export function setInvoiceAccentLock(v: boolean): void { _accentLocked = v; }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvoiceEditorState {
  invoice: InvoiceData;

  // ── Document Type ──
  setDocumentType: (type: SalesDocumentType) => void;
  convertToType: (type: SalesDocumentType) => void;

  // ── Document mutations ──
  setInvoice: (data: InvoiceData) => void;
  updateInvoice: (recipe: (draft: InvoiceData) => void) => void;
  resetInvoice: (docType?: SalesDocumentType) => void;

  // ── Business Info ──
  updateBusinessInfo: (info: Partial<BusinessInfo>) => void;

  // ── Client Info ──
  updateClientInfo: (info: Partial<ClientInfo>) => void;

  // ── Invoice Details ──
  setInvoiceNumber: (num: string) => void;
  setIssueDate: (date: string) => void;
  setDueDate: (date: string) => void;
  setPoNumber: (po: string) => void;
  setPaymentTerms: (terms: string) => void;
  setStatus: (status: InvoiceData["status"]) => void;

  // ── Line Items ──
  addLineItem: () => void;
  updateLineItem: (id: string, patch: Partial<LineItem>) => void;
  removeLineItem: (id: string) => void;
  reorderLineItems: (fromIdx: number, toIdx: number) => void;
  duplicateLineItem: (id: string) => void;

  // ── Additional Charges ──
  addCharge: () => void;
  updateCharge: (id: string, patch: Partial<AdditionalCharge>) => void;
  removeCharge: (id: string) => void;

  // ── Currency & Tax ──
  setCurrency: (currency: CurrencyConfig) => void;
  updateTax: (tax: Partial<TaxConfig>) => void;

  // ── Payment Info ──
  updatePaymentInfo: (info: Partial<PaymentInfo>) => void;

  // ── Signature ──
  updateSignature: (sig: Partial<Signature>) => void;

  // ── Notes & Terms ──
  setNotes: (notes: string) => void;
  setTerms: (terms: string) => void;

  // ── Metadata (design) ──
  setTemplate: (template: string) => void;
  setAccentColor: (color: string) => void;
  setFontPairing: (fp: string) => void;
  setPageFormat: (pf: InvoiceMetadata["pageFormat"]) => void;
  updateMetadata: (patch: Partial<InvoiceMetadata>) => void;

  // ── Custom Blocks ──
  addCustomBlock: (type: CustomBlockType, overrides?: Partial<CustomBlock>) => string;
  updateCustomBlock: (blockId: string, patch: Partial<CustomBlock>) => void;
  removeCustomBlock: (blockId: string) => void;
  reorderCustomBlocks: (fromIndex: number, toIndex: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _chargeIdCounter = 0;
function createChargeId(): string {
  return `chg_${Date.now().toString(36)}_${(++_chargeIdCounter).toString(36)}`;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useInvoiceEditor = create<InvoiceEditorState>()(
  temporal(
    immer((set) => ({
      invoice: createDefaultInvoiceData(),

      // ── Document Type ──
      setDocumentType: (type) =>
        set((s) => {
          s.invoice.documentType = type;
        }),

      convertToType: (type) =>
        set((s) => {
          s.invoice = convertDocumentType(s.invoice, type);
        }),

      // ── Document mutations ──
      setInvoice: (data) => {
        _accentLocked = false; // fresh data load — reset lock
        set((s) => {
          s.invoice = data;
        });
      },

      updateInvoice: (recipe) =>
        set((s) => {
          recipe(s.invoice);
        }),

      resetInvoice: (docType) => {
        _accentLocked = false; // full reset — unlock
        set((s) => {
          s.invoice = createDefaultInvoiceData(docType ?? s.invoice.documentType);
        });
      },

      // ── Business Info ──
      updateBusinessInfo: (info) =>
        set((s) => {
          Object.assign(s.invoice.businessInfo, info);
        }),

      // ── Client Info ──
      updateClientInfo: (info) =>
        set((s) => {
          Object.assign(s.invoice.clientInfo, info);
        }),

      // ── Invoice Details ──
      setInvoiceNumber: (num) =>
        set((s) => {
          s.invoice.invoiceNumber = num;
        }),

      setIssueDate: (date) =>
        set((s) => {
          s.invoice.issueDate = date;
          // Auto-update due date based on payment terms
          const computed = calcDueDate(date, s.invoice.paymentTerms);
          if (computed) s.invoice.dueDate = computed;
        }),

      setDueDate: (date) =>
        set((s) => {
          s.invoice.dueDate = date;
        }),

      setPoNumber: (po) =>
        set((s) => {
          s.invoice.poNumber = po;
        }),

      setPaymentTerms: (terms) =>
        set((s) => {
          s.invoice.paymentTerms = terms;
          const computed = calcDueDate(s.invoice.issueDate, terms);
          if (computed) s.invoice.dueDate = computed;
        }),

      setStatus: (status) =>
        set((s) => {
          s.invoice.status = status;
        }),

      // ── Line Items ──
      addLineItem: () =>
        set((s) => {
          s.invoice.lineItems.push(createDefaultLineItem());
        }),

      updateLineItem: (id, patch) =>
        set((s) => {
          const item = s.invoice.lineItems.find((i) => i.id === id);
          if (item) Object.assign(item, patch);
        }),

      removeLineItem: (id) =>
        set((s) => {
          const idx = s.invoice.lineItems.findIndex((i) => i.id === id);
          if (idx !== -1 && s.invoice.lineItems.length > 1) {
            s.invoice.lineItems.splice(idx, 1);
          }
        }),

      reorderLineItems: (fromIdx, toIdx) =>
        set((s) => {
          const items = s.invoice.lineItems;
          if (fromIdx < 0 || fromIdx >= items.length) return;
          if (toIdx < 0 || toIdx >= items.length) return;
          const [item] = items.splice(fromIdx, 1);
          items.splice(toIdx, 0, item);
        }),

      duplicateLineItem: (id) =>
        set((s) => {
          const idx = s.invoice.lineItems.findIndex((i) => i.id === id);
          if (idx === -1) return;
          const orig = s.invoice.lineItems[idx];
          const copy = { ...orig, id: createDefaultLineItem().id };
          s.invoice.lineItems.splice(idx + 1, 0, copy);
        }),

      // ── Additional Charges ──
      addCharge: () =>
        set((s) => {
          s.invoice.additionalCharges.push({
            id: createChargeId(),
            label: "",
            amount: 0,
            type: "fixed",
          });
        }),

      updateCharge: (id, patch) =>
        set((s) => {
          const c = s.invoice.additionalCharges.find((c) => c.id === id);
          if (c) Object.assign(c, patch);
        }),

      removeCharge: (id) =>
        set((s) => {
          const idx = s.invoice.additionalCharges.findIndex((c) => c.id === id);
          if (idx !== -1) s.invoice.additionalCharges.splice(idx, 1);
        }),

      // ── Currency & Tax ──
      setCurrency: (currency) =>
        set((s) => {
          s.invoice.currency = currency;
        }),

      updateTax: (tax) =>
        set((s) => {
          Object.assign(s.invoice.tax, tax);
        }),

      // ── Payment Info ──
      updatePaymentInfo: (info) =>
        set((s) => {
          Object.assign(s.invoice.paymentInfo, info);
        }),

      // ── Signature ──
      updateSignature: (sig) =>
        set((s) => {
          Object.assign(s.invoice.signature, sig);
        }),

      // ── Notes & Terms ──
      setNotes: (notes) =>
        set((s) => {
          s.invoice.notes = notes;
        }),

      setTerms: (terms) =>
        set((s) => {
          s.invoice.terms = terms;
        }),

      // ── Metadata ──
      setTemplate: (template) =>
        set((s) => {
          s.invoice.metadata.template = template;
          const tpl = getInvoiceTemplate(template);
          if (tpl) {
            // Only sync accent color if user hasn't explicitly customized it
            if (!_accentLocked) {
              s.invoice.metadata.accentColor = tpl.accent;
            }
            s.invoice.metadata.fontPairing = tpl.defaultFontPairing;
          }
        }),

      setAccentColor: (color) => {
        _accentLocked = true; // user explicitly chose a color — lock it
        set((s) => {
          s.invoice.metadata.accentColor = color;
        });
      },

      setFontPairing: (fp) =>
        set((s) => {
          s.invoice.metadata.fontPairing = fp;
        }),

      setPageFormat: (pf) =>
        set((s) => {
          s.invoice.metadata.pageFormat = pf;
        }),

      updateMetadata: (patch) => {
        // If caller explicitly provides accent color, lock it
        if (patch.accentColor) _accentLocked = true;
        set((s) => {
          // Sync font to template defaults on template change
          // Only sync accent color if not locked and not explicitly provided
          if (patch.template && patch.template !== s.invoice.metadata.template) {
            const tpl = getInvoiceTemplate(patch.template);
            if (tpl) {
              if (!_accentLocked && !patch.accentColor) {
                patch.accentColor = tpl.accent;
              }
              if (!patch.fontPairing) patch.fontPairing = tpl.defaultFontPairing;
            }
          }
          Object.assign(s.invoice.metadata, patch);
        });
      },

      // ── Custom Blocks ──
      addCustomBlock: (type, overrides) => {
        const block = createDefaultBlock(type);
        if (overrides) {
          if (overrides.position) block.position = overrides.position;
          if (overrides.alignment) block.alignment = overrides.alignment;
          if (overrides.enabled !== undefined) block.enabled = overrides.enabled;
          if (overrides.label !== undefined) block.label = overrides.label;
          if ((overrides as { data?: Record<string, unknown> }).data) {
            Object.assign(block.data, (overrides as { data?: Record<string, unknown> }).data);
          }
        }
        set((s) => {
          const blocks = s.invoice.customBlocks as CustomBlock[];
          blocks.push(block as CustomBlock);
        });
        return block.id;
      },

      updateCustomBlock: (blockId, patch) =>
        set((s) => {
          const blocks = s.invoice.customBlocks as CustomBlock[];
          const block = blocks.find((b) => b.id === blockId);
          if (!block) return;
          if (patch.position) block.position = patch.position;
          if (patch.alignment) block.alignment = patch.alignment;
          if (patch.enabled !== undefined) block.enabled = patch.enabled;
          if (patch.label !== undefined) block.label = patch.label;
          if (patch.marginTop !== undefined) block.marginTop = patch.marginTop;
          if (patch.marginBottom !== undefined) block.marginBottom = patch.marginBottom;
          if ((patch as { data?: Record<string, unknown> }).data) {
            Object.assign(block.data, (patch as { data?: Record<string, unknown> }).data);
          }
        }),

      removeCustomBlock: (blockId) =>
        set((s) => {
          const blocks = s.invoice.customBlocks as CustomBlock[];
          const idx = blocks.findIndex((b) => b.id === blockId);
          if (idx !== -1) blocks.splice(idx, 1);
        }),

      reorderCustomBlocks: (fromIndex, toIndex) =>
        set((s) => {
          const blocks = s.invoice.customBlocks as CustomBlock[];
          const [item] = blocks.splice(fromIndex, 1);
          blocks.splice(toIndex, 0, item);
        }),
    })),
    {
      limit: 100,
      equality: (a, b) => equal(a, b),
    },
  ),
);

/** Temporal store accessor for undo / redo */
export const useInvoiceTemporalStore = <T>(
  selector: (state: {
    undo: () => void;
    redo: () => void;
    pastStates: InvoiceEditorState[];
    futureStates: InvoiceEditorState[];
  }) => T,
) => useInvoiceEditor.temporal.getState() as unknown as ReturnType<typeof selector>;

// Proper hook for undo/redo
export function useInvoiceUndo() {
  return {
    undo: () => useInvoiceEditor.temporal.getState().undo(),
    redo: () => useInvoiceEditor.temporal.getState().redo(),
    canUndo: () => (useInvoiceEditor.temporal.getState() as unknown as { pastStates: unknown[] }).pastStates.length > 0,
    canRedo: () => (useInvoiceEditor.temporal.getState() as unknown as { futureStates: unknown[] }).futureStates.length > 0,
  };
}
