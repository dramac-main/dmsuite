// =============================================================================
// DMSuite — Worksheet & Form Designer Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo.
// Follows the exact architecture as business-plan-editor.ts.
// =============================================================================

"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";
import type {
  WorksheetFormData,
  DocumentType,
  WorksheetStyleConfig,
  WorksheetPrintConfig,
  AnswerKeyConfig,
  WorksheetBranding,
  FormSection,
  FormElement,
  ElementType,
} from "@/lib/worksheet/schema";
import {
  createDefaultWorksheetForm,
  createDefaultSections,
  createDefaultElement,
  WORKSHEET_TEMPLATES,
  uid,
} from "@/lib/worksheet/schema";

// ---------------------------------------------------------------------------
// State Interface
// ---------------------------------------------------------------------------

export interface WorksheetEditorState {
  form: WorksheetFormData;

  // Accent color lock
  accentColorLocked: boolean;
  setAccentColorLocked: (locked: boolean) => void;

  // Document type
  setDocumentType: (type: DocumentType) => void;

  // Top-level
  setForm: (form: WorksheetFormData) => void;
  resetForm: (docType?: DocumentType) => void;

  // Metadata
  updateMeta: (patch: Partial<Pick<WorksheetFormData,
    "title" | "instructions" | "subject" | "gradeLevel" |
    "studentNameField" | "dateField" | "scoreField"
  >>) => void;

  // Branding
  updateBranding: (patch: Partial<WorksheetBranding>) => void;

  // Sections
  addSection: (title?: string) => string;
  removeSection: (id: string) => void;
  updateSection: (id: string, patch: Partial<Omit<FormSection, "id" | "elements">>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  toggleSectionVisibility: (id: string) => void;

  // Elements within sections
  addElement: (sectionId: string, type: ElementType) => string;
  removeElement: (sectionId: string, elementId: string) => void;
  updateElement: (sectionId: string, elementId: string, patch: Partial<FormElement>) => void;
  moveElement: (fromSectionId: string, toSectionId: string, elementId: string, toIndex: number) => void;
  reorderElement: (sectionId: string, fromIndex: number, toIndex: number) => void;
  duplicateElement: (sectionId: string, elementId: string) => string;

  // Style
  updateStyle: (patch: Partial<WorksheetStyleConfig>) => void;
  setTemplate: (template: string) => void;
  setAccentColor: (color: string) => void;

  // Print
  updatePrintConfig: (patch: Partial<WorksheetPrintConfig>) => void;

  // Answer key
  updateAnswerKey: (patch: Partial<AnswerKeyConfig>) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useWorksheetEditor = create<WorksheetEditorState>()(
  temporal(
    persist(
      immer<WorksheetEditorState>((set) => ({
        form: createDefaultWorksheetForm(),
        accentColorLocked: false,

        setAccentColorLocked: (locked) =>
          set((state) => {
            state.accentColorLocked = locked;
          }),

        setDocumentType: (type) =>
          set((state) => {
            state.form.documentType = type;
            state.form.sections = createDefaultSections(type);
            // Auto-enable educational features
            if (type === "educational-worksheet") {
              state.form.studentNameField = true;
              state.form.dateField = true;
              state.form.scoreField = true;
              state.form.style.showPointValues = true;
              state.form.style.numberedElements = true;
              state.form.answerKey.enabled = true;
            } else {
              state.form.scoreField = false;
              state.form.style.showPointValues = false;
              state.form.answerKey.enabled = false;
            }
          }),

        setForm: (form) =>
          set((state) => {
            state.form = form;
          }),

        resetForm: (docType) =>
          set((state) => {
            state.form = createDefaultWorksheetForm();
            if (docType) {
              state.form.documentType = docType;
              state.form.sections = createDefaultSections(docType);
            }
            state.accentColorLocked = false;
          }),

        updateMeta: (patch) =>
          set((state) => {
            Object.assign(state.form, patch);
          }),

        updateBranding: (patch) =>
          set((state) => {
            Object.assign(state.form.branding, patch);
          }),

        // ── Section CRUD ──

        addSection: (title) => {
          const newId = uid();
          set((state) => {
            state.form.sections.push({
              id: newId,
              title: title ?? `Section ${state.form.sections.length + 1}`,
              visible: true,
              elements: [],
            });
          });
          return newId;
        },

        removeSection: (id) =>
          set((state) => {
            state.form.sections = state.form.sections.filter((s) => s.id !== id);
          }),

        updateSection: (id, patch) =>
          set((state) => {
            const section = state.form.sections.find((s) => s.id === id);
            if (section) Object.assign(section, patch);
          }),

        reorderSections: (fromIndex, toIndex) =>
          set((state) => {
            const arr = state.form.sections;
            if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) return;
            const [item] = arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, item);
          }),

        toggleSectionVisibility: (id) =>
          set((state) => {
            const section = state.form.sections.find((s) => s.id === id);
            if (section) section.visible = !section.visible;
          }),

        // ── Element CRUD ──

        addElement: (sectionId, type) => {
          const newId = uid();
          set((state) => {
            const section = state.form.sections.find((s) => s.id === sectionId);
            if (section) {
              const element = createDefaultElement(type);
              element.id = newId;
              section.elements.push(element);
            }
          });
          return newId;
        },

        removeElement: (sectionId, elementId) =>
          set((state) => {
            const section = state.form.sections.find((s) => s.id === sectionId);
            if (section) {
              section.elements = section.elements.filter((e) => e.id !== elementId);
            }
          }),

        updateElement: (sectionId, elementId, patch) =>
          set((state) => {
            const section = state.form.sections.find((s) => s.id === sectionId);
            if (section) {
              const element = section.elements.find((e) => e.id === elementId);
              if (element) Object.assign(element, patch);
            }
          }),

        moveElement: (fromSectionId, toSectionId, elementId, toIndex) =>
          set((state) => {
            const fromSection = state.form.sections.find((s) => s.id === fromSectionId);
            const toSection = state.form.sections.find((s) => s.id === toSectionId);
            if (!fromSection || !toSection) return;
            const elementIndex = fromSection.elements.findIndex((e) => e.id === elementId);
            if (elementIndex === -1) return;
            const [element] = fromSection.elements.splice(elementIndex, 1);
            toSection.elements.splice(toIndex, 0, element);
          }),

        reorderElement: (sectionId, fromIndex, toIndex) =>
          set((state) => {
            const section = state.form.sections.find((s) => s.id === sectionId);
            if (!section) return;
            const arr = section.elements;
            if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length) return;
            const [item] = arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, item);
          }),

        duplicateElement: (sectionId, elementId) => {
          const newId = uid();
          set((state) => {
            const section = state.form.sections.find((s) => s.id === sectionId);
            if (section) {
              const element = section.elements.find((e) => e.id === elementId);
              if (element) {
                const copy = JSON.parse(JSON.stringify(element)) as FormElement;
                copy.id = newId;
                copy.label = `${copy.label} (Copy)`;
                const index = section.elements.findIndex((e) => e.id === elementId);
                section.elements.splice(index + 1, 0, copy);
              }
            }
          });
          return newId;
        },

        // ── Style ──

        updateStyle: (patch) =>
          set((state) => {
            Object.assign(state.form.style, patch);
          }),

        setTemplate: (template) =>
          set((state) => {
            state.form.style.template = template as WorksheetStyleConfig["template"];
            if (!state.accentColorLocked) {
              const tpl = WORKSHEET_TEMPLATES.find((t) => t.id === template);
              if (tpl) {
                state.form.style.accentColor = tpl.accent;
                state.form.style.headerStyle = tpl.headerStyle;
              }
            }
          }),

        setAccentColor: (color) =>
          set((state) => {
            state.form.style.accentColor = color;
            state.accentColorLocked = true;
          }),

        // ── Print ──

        updatePrintConfig: (patch) =>
          set((state) => {
            Object.assign(state.form.printConfig, patch);
          }),

        // ── Answer Key ──

        updateAnswerKey: (patch) =>
          set((state) => {
            Object.assign(state.form.answerKey, patch);
          }),
      })),
      {
        name: "dmsuite-worksheet-designer",
        partialize: (s) => ({
          form: s.form,
          accentColorLocked: s.accentColorLocked,
        }),
      }
    ),
    {
      equality: (a, b) => equal(a, b),
      partialize: (s) => ({ form: s.form }) as WorksheetEditorState,
    }
  )
);

// ---------------------------------------------------------------------------
// Undo/Redo Hook
// ---------------------------------------------------------------------------

export function useWorksheetUndo() {
  const store = useWorksheetEditor.temporal.getState();
  return {
    undo: store.undo,
    redo: store.redo,
    canUndo: store.pastStates.length > 0,
    canRedo: store.futureStates.length > 0,
  };
}
