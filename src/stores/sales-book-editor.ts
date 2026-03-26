// =============================================================================
// DMSuite — Sales Book Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo of blank form config.
// =============================================================================

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
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
  getTemplateConfig,
} from "@/lib/sales-book/schema";
import type { CustomBlock, CustomBlockType } from "@/lib/sales-book/custom-blocks";
import { createDefaultBlock } from "@/lib/sales-book/custom-blocks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SalesBookEditorState {
  form: SalesBookFormData;

  // ── Accent Color Lock ──
  // When user/Chiko explicitly sets a color, preserve it across template
  // switches. Reset only on full form reset or data load.
  accentColorLocked: boolean;
  setAccentColorLocked: (locked: boolean) => void;

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

  // ── Custom Blocks ──
  addCustomBlock: (type: CustomBlockType, overrides?: Partial<CustomBlock>) => string;
  updateCustomBlock: (blockId: string, patch: Partial<CustomBlock>) => void;
  removeCustomBlock: (blockId: string) => void;
  reorderCustomBlocks: (fromIndex: number, toIndex: number) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSalesBookEditor = create<SalesBookEditorState>()(
  temporal(
    persist(
      immer((set) => ({
        form: createDefaultSalesBookForm(),
        accentColorLocked: false,
        setAccentColorLocked: (locked) => set((s) => { s.accentColorLocked = locked; }),

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
          s.accentColorLocked = false;
          s.form = form;
        }),

      resetForm: (docType) =>
        set((s) => {
          s.accentColorLocked = false;
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
          // If caller explicitly provides accent color, lock it
          if (patch.accentColor) s.accentColorLocked = true;
          // When template changes, sync font but only sync accent if not locked
          if (patch.template && patch.template !== s.form.style.template) {
            const tpl = getTemplateConfig(patch.template);
            if (!s.accentColorLocked && !patch.accentColor) patch.accentColor = tpl.accent;
            if (!patch.fontPairing) patch.fontPairing = tpl.font;
          }
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

      // ── Custom Blocks ──
      addCustomBlock: (type, overrides) => {
        const block = createDefaultBlock(type);
        if (overrides) {
          Object.assign(block, overrides);
          if (overrides.data) {
            Object.assign(block.data, overrides.data);
          }
        }
        set((s) => {
          s.form.customBlocks.push(block as CustomBlock);
        });
        return block.id;
      },

      updateCustomBlock: (blockId, patch) =>
        set((s) => {
          const block = s.form.customBlocks.find((b) => b.id === blockId);
          if (!block) return;
          // Apply top-level fields
          if (patch.position !== undefined) block.position = patch.position;
          if (patch.alignment !== undefined) block.alignment = patch.alignment;
          if (patch.enabled !== undefined) block.enabled = patch.enabled;
          if (patch.label !== undefined) block.label = patch.label;
          if (patch.marginTop !== undefined) block.marginTop = patch.marginTop;
          if (patch.marginBottom !== undefined) block.marginBottom = patch.marginBottom;
          // Merge data
          if ((patch as { data?: Record<string, unknown> }).data) {
            Object.assign(block.data, (patch as { data: Record<string, unknown> }).data);
          }
        }),

      removeCustomBlock: (blockId) =>
        set((s) => {
          const idx = s.form.customBlocks.findIndex((b) => b.id === blockId);
          if (idx !== -1) s.form.customBlocks.splice(idx, 1);
        }),

      reorderCustomBlocks: (fromIndex, toIndex) =>
        set((s) => {
          const blocks = s.form.customBlocks;
          if (fromIndex < 0 || fromIndex >= blocks.length) return;
          if (toIndex < 0 || toIndex >= blocks.length) return;
          const [item] = blocks.splice(fromIndex, 1);
          blocks.splice(toIndex, 0, item);
        }),
    })),
    {
      name: "dmsuite-sales-book",
      partialize: (state) => ({ form: state.form, accentColorLocked: state.accentColorLocked }),
    },
  ),
  {
    partialize: (state) => ({ form: state.form }),
    equality: (a, b) => equal(a, b),
    limit: 100,
  }),
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
