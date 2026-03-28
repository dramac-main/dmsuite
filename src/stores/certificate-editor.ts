// =============================================================================
// DMSuite — Certificate Designer Editor Store (V2 — Canvas-Based)
// Zustand store with certificate metadata + EditorV2 bridge.
// sessionStorage persistence for metadata; document recreated from template.
// =============================================================================

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DesignDocumentV2 } from "@/lib/editor/schema";
import type { CertificateType } from "@/data/certificate-templates";
import { getDefaultTitleForType } from "@/data/certificate-templates";
import type { CertificateConfig, SealStyle, Signatory } from "@/lib/editor/certificate-adapter";
import { createDefaultCertificateConfig } from "@/lib/editor/certificate-adapter";

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

export interface CertificateEditorState {
  // Metadata (persisted)
  meta: CertificateConfig;
  selectedTemplateId: string;

  // Document snapshot (NOT persisted — too large for sessionStorage)
  documentSnapshot: DesignDocumentV2 | null;

  // Generation state
  isGenerating: boolean;
  generationError: string | null;

  // Font loading state
  fontsReady: boolean;

  // Actions
  setMeta: (patch: Partial<CertificateConfig>) => void;
  setTemplateId: (id: string) => void;
  setDocumentSnapshot: (doc: DesignDocumentV2 | null) => void;
  setCertificateType: (type: CertificateType) => void;
  updateSignatory: (id: string, patch: Partial<Signatory>) => void;
  addSignatory: () => string;
  removeSignatory: (id: string) => void;
  setGenerating: (val: boolean) => void;
  setGenerationError: (err: string | null) => void;
  setFontsReady: (val: boolean) => void;
  resetToDefaults: (type?: CertificateType) => void;
}

// Re-export types used by other files
export type { CertificateType, CertificateConfig, SealStyle, Signatory };
export { getDefaultTitleForType, createDefaultCertificateConfig };
export { CERTIFICATE_TYPES } from "@/data/certificate-templates";

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCertificateEditor = create<CertificateEditorState>()(
  persist(
    (set, get) => ({
      // Initial state
      meta: createDefaultCertificateConfig(),
      selectedTemplateId: "classic-gold",
      documentSnapshot: null,
      isGenerating: false,
      generationError: null,
      fontsReady: false,

      // --- Actions ---

      setMeta: (patch) =>
        set((state) => ({
          meta: { ...state.meta, ...patch },
        })),

      setTemplateId: (id) =>
        set({
          selectedTemplateId: id,
          fontsReady: false,
        }),

      setDocumentSnapshot: (doc) =>
        set({ documentSnapshot: doc }),

      setCertificateType: (type) =>
        set((state) => ({
          meta: {
            ...state.meta,
            certificateType: type,
            title: getDefaultTitleForType(type),
          },
        })),

      updateSignatory: (id, patch) =>
        set((state) => ({
          meta: {
            ...state.meta,
            signatories: state.meta.signatories.map((s) =>
              s.id === id ? { ...s, ...patch } : s,
            ),
          },
        })),

      addSignatory: () => {
        const newId = crypto.randomUUID();
        set((state) => {
          if (state.meta.signatories.length >= 3) return state;
          return {
            meta: {
              ...state.meta,
              signatories: [
                ...state.meta.signatories,
                { id: newId, name: "", title: "", organization: "" },
              ],
            },
          };
        });
        return newId;
      },

      removeSignatory: (id) =>
        set((state) => ({
          meta: {
            ...state.meta,
            signatories: state.meta.signatories.filter((s) => s.id !== id),
          },
        })),

      setGenerating: (val) => set({ isGenerating: val }),

      setGenerationError: (err) => set({ generationError: err }),

      setFontsReady: (val) => set({ fontsReady: val }),

      resetToDefaults: (type) => {
        const defaults = createDefaultCertificateConfig();
        if (type) {
          defaults.certificateType = type;
          defaults.title = getDefaultTitleForType(type);
        }
        set({
          meta: defaults,
          documentSnapshot: null,
          isGenerating: false,
          generationError: null,
          fontsReady: false,
        });
      },
    }),
    {
      name: "dmsuite-certificate-v2",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        meta: state.meta,
        selectedTemplateId: state.selectedTemplateId,
      }),
    },
  ),
);
