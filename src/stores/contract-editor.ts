// =============================================================================
// DMSuite — Contract Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo of contract config.
// Follows the exact same architecture as sales-book-editor.ts.
// =============================================================================

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";
import type {
  ContractFormData,
  ContractType,
  DocumentInfo,
  PartyInfo,
  SignatureConfig,
  StyleConfig,
  PrintConfig,
  ContractClause,
  ClauseCategory,
} from "@/lib/contract/schema";
import {
  createDefaultContractForm,
  convertContractType,
  getContractTemplate,
  getDefaultClauses,
} from "@/lib/contract/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface ContractEditorState {
  form: ContractFormData;

  // Accent Color Lock — when user explicitly sets accent, preserve across template switches
  accentColorLocked: boolean;
  setAccentColorLocked: (locked: boolean) => void;

  // Document type
  setContractType: (type: ContractType) => void;
  convertToType: (type: ContractType) => void;

  // Top-level
  setForm: (form: ContractFormData) => void;
  resetForm: (contractType?: ContractType) => void;

  // Document info
  updateDocumentInfo: (patch: Partial<DocumentInfo>) => void;

  // Parties
  updatePartyA: (patch: Partial<PartyInfo>) => void;
  updatePartyB: (patch: Partial<PartyInfo>) => void;

  // Clauses
  updateClause: (id: string, patch: Partial<ContractClause>) => void;
  toggleClause: (id: string) => void;
  addClause: (title: string, content: string, category: ClauseCategory) => string;
  removeClause: (id: string) => void;
  reorderClauses: (fromIndex: number, toIndex: number) => void;
  resetClauses: () => void;

  // Signature config
  updateSignatureConfig: (patch: Partial<SignatureConfig>) => void;

  // Style
  updateStyle: (patch: Partial<StyleConfig>) => void;

  // Print
  updatePrint: (patch: Partial<PrintConfig>) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useContractEditor = create<ContractEditorState>()(
  temporal(
    persist(
      immer<ContractEditorState>((set) => ({
        form: createDefaultContractForm(),
        accentColorLocked: false,
        setAccentColorLocked: (locked) => set((s) => { s.accentColorLocked = locked; }),

        // ── Contract Type ──
        setContractType: (type) =>
          set((s) => {
            s.form = createDefaultContractForm(type);
            s.accentColorLocked = false;
          }),

        convertToType: (type) =>
          set((s) => {
            s.form = convertContractType(s.form, type);
          }),

        // ── Top-level ──
        setForm: (form) =>
          set((s) => {
            s.form = form;
          }),

        resetForm: (contractType) =>
          set((s) => {
            s.form = createDefaultContractForm(contractType ?? s.form.contractType);
            s.accentColorLocked = false;
          }),

        // ── Document Info ──
        updateDocumentInfo: (patch) =>
          set((s) => {
            Object.assign(s.form.documentInfo, patch);
          }),

        // ── Parties ──
        updatePartyA: (patch) =>
          set((s) => {
            Object.assign(s.form.partyA, patch);
          }),

        updatePartyB: (patch) =>
          set((s) => {
            Object.assign(s.form.partyB, patch);
          }),

        // ── Clauses ──
        updateClause: (id, patch) =>
          set((s) => {
            const clause = s.form.clauses.find((c) => c.id === id);
            if (clause) Object.assign(clause, patch);
          }),

        toggleClause: (id) =>
          set((s) => {
            const clause = s.form.clauses.find((c) => c.id === id);
            if (clause) clause.enabled = !clause.enabled;
          }),

        addClause: (title, content, category) => {
          const newId = uid();
          set((s) => {
            s.form.clauses.push({
              id: newId,
              title,
              content,
              enabled: true,
              category,
            });
          });
          return newId;
        },

        removeClause: (id) =>
          set((s) => {
            s.form.clauses = s.form.clauses.filter((c) => c.id !== id);
          }),

        reorderClauses: (fromIndex, toIndex) =>
          set((s) => {
            const clauses = s.form.clauses;
            const [item] = clauses.splice(fromIndex, 1);
            if (item) clauses.splice(toIndex, 0, item);
          }),

        resetClauses: () =>
          set((s) => {
            s.form.clauses = getDefaultClauses(s.form.contractType);
          }),

        // ── Signature Config ──
        updateSignatureConfig: (patch) =>
          set((s) => {
            Object.assign(s.form.signatureConfig, patch);
          }),

        // ── Style ──
        updateStyle: (patch) =>
          set((s) => {
            // If user sets accentColor explicitly, lock it
            if (patch.accentColor) s.accentColorLocked = true;

            // If switching template, auto-sync accent unless locked
            if (patch.template && !s.accentColorLocked) {
              const tpl = getContractTemplate(patch.template);
              patch.accentColor = tpl.accent;
              patch.headerStyle = tpl.headerStyle;
            }

            Object.assign(s.form.style, patch);
          }),

        // ── Print ──
        updatePrint: (patch) =>
          set((s) => {
            Object.assign(s.form.printConfig, patch);
          }),
      })),
      {
        name: "dmsuite-contract",
        version: 1,
      },
    ),
    {
      partialize: (state) => ({ form: state.form }),
      equality: (a, b) => equal(a, b),
      limit: 50,
    },
  ),
);

// ---------------------------------------------------------------------------
// Undo hook (mirrors useSalesBookUndo)
// ---------------------------------------------------------------------------

export function useContractUndo() {
  const { undo, redo, pastStates, futureStates } = useContractEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
