// =============================================================================
// DMSuite — Sales Book Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo of blank form config.
// =============================================================================

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import equal from "fast-deep-equal";
import type {
  SalesBookFormData,
  CompanyBranding,
  SerialConfig,
  FormLayout,
  PrintConfig,
  FormStyle,
  BrandLogosConfig,
  BrandLogo,
} from "@/lib/sales-book/schema";
import type { SalesDocumentType } from "@/lib/invoice/schema";
import {
  createDefaultSalesBookForm,
  convertSalesBookType,
} from "@/lib/sales-book/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SalesBookEditorState {
  form: SalesBookFormData;

  // ── Document Type ──
  setDocumentType: (type: SalesDocumentType) => void;
  convertToType: (type: SalesDocumentType) => void;

  // ── Top-level ──
  setForm: (form: SalesBookFormData) => void;
  resetForm: (docType?: SalesDocumentType) => void;

  // ── Company Branding ──
  updateBranding: (patch: Partial<CompanyBranding>) => void;

  // ── Serial Config ──
  updateSerial: (patch: Partial<SerialConfig>) => void;

  // ── Form Layout ──
  updateLayout: (patch: Partial<FormLayout>) => void;
  toggleColumn: (columnId: string) => void;

  // ── Print Config ──
  updatePrint: (patch: Partial<PrintConfig>) => void;

  // ── Style ──
  updateStyle: (patch: Partial<FormStyle>) => void;

  // ── Brand Logos ──
  updateBrandLogos: (patch: Partial<BrandLogosConfig>) => void;
  addBrandLogo: (logo: BrandLogo) => void;
  removeBrandLogo: (index: number) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSalesBookEditor = create<SalesBookEditorState>()(
  temporal(
    immer((set) => ({
      form: createDefaultSalesBookForm(),

      // ── Document Type ──
      setDocumentType: (type) =>
        set((s) => {
          s.form = createDefaultSalesBookForm(type);
        }),

      convertToType: (type) =>
        set((s) => {
          s.form = convertSalesBookType(s.form, type);
        }),

      // ── Top-level ──
      setForm: (form) =>
        set((s) => {
          s.form = form;
        }),

      resetForm: (docType) =>
        set((s) => {
          s.form = createDefaultSalesBookForm(docType ?? (s.form.documentType as SalesDocumentType));
        }),

      // ── Company Branding ──
      updateBranding: (patch) =>
        set((s) => {
          Object.assign(s.form.companyBranding, patch);
        }),

      // ── Serial Config ──
      updateSerial: (patch) =>
        set((s) => {
          Object.assign(s.form.serialConfig, patch);
        }),

      // ── Form Layout ──
      updateLayout: (patch) =>
        set((s) => {
          Object.assign(s.form.formLayout, patch);
        }),

      toggleColumn: (columnId) =>
        set((s) => {
          const cols = s.form.formLayout.columns;
          const idx = cols.indexOf(columnId);
          if (idx >= 0) {
            cols.splice(idx, 1);
          } else {
            cols.push(columnId);
          }
        }),

      // ── Print Config ──
      updatePrint: (patch) =>
        set((s) => {
          Object.assign(s.form.printConfig, patch);
        }),

      // ── Style ──
      updateStyle: (patch) =>
        set((s) => {
          Object.assign(s.form.style, patch);
        }),

      // ── Brand Logos ──
      updateBrandLogos: (patch) =>
        set((s) => {
          Object.assign(s.form.brandLogos, patch);
        }),

      addBrandLogo: (logo) =>
        set((s) => {
          s.form.brandLogos.logos.push(logo);
        }),

      removeBrandLogo: (index) =>
        set((s) => {
          s.form.brandLogos.logos.splice(index, 1);
        }),
    })),
    {
      limit: 100,
      equality: (a, b) => equal(a, b),
    },
  ),
);

// ---------------------------------------------------------------------------
// Undo / Redo hook
// ---------------------------------------------------------------------------

export function useSalesBookUndo() {
  const { undo, redo, pastStates, futureStates } = useSalesBookEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
