// =============================================================================
// DMSuite — Resume & CV Builder Editor Store
// Live resume document editing state with temporal undo/redo via zundo.
// Uses temporal(immer(...)) pattern.
// =============================================================================

import { create, type StoreApi, useStore } from "zustand";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";
import type { WritableDraft } from "immer";
import isDeepEqual from "fast-deep-equal";
import type { ResumeData, TemplateId } from "@/lib/resume/schema";
import { createDefaultResumeData } from "@/lib/resume/schema";

// ---------------------------------------------------------------------------
// AI Revision Types
// ---------------------------------------------------------------------------

export interface DiffHunk {
  path: string;
  before: unknown;
  after: unknown;
}

export interface PendingRevision {
  id: string;
  description: string;
  hunks: DiffHunk[];
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Editor Store Interface
// ---------------------------------------------------------------------------

interface ResumeEditorState {
  // ---- Resume document ----
  resume: ResumeData;

  // ---- AI revision diff preview ----
  pendingRevision: PendingRevision | null;
  isRevisionPending: boolean;

  // ---- Actions: document mutations ----
  setResume: (data: ResumeData) => void;
  updateResume: (recipe: (draft: WritableDraft<ResumeData>) => void) => void;
  resetResume: () => void;
  changeTemplate: (templateId: TemplateId) => void;

  // ---- Section item mutations ----
  addSectionItem: (sectionKey: string, item: Record<string, unknown>) => void;
  updateSectionItem: (
    sectionKey: string,
    itemIndex: number,
    data: Record<string, unknown>
  ) => void;
  removeSectionItem: (sectionKey: string, itemIndex: number) => void;
  reorderSectionItems: (sectionKey: string, fromIndex: number, toIndex: number) => void;
  toggleSectionVisibility: (sectionKey: string) => void;
  renameSectionTitle: (sectionKey: string, title: string) => void;

  // ---- Custom sections ----
  addCustomSection: (title: string) => void;
  removeCustomSection: (sectionId: string) => void;

  // ---- Layout mutations ----
  moveSectionToColumn: (sectionKey: string, column: "main" | "sidebar", pageIndex: number) => void;

  // ---- Metadata shortcuts ----
  setAccentColor: (color: string) => void;
  setFontPairing: (pairingId: string) => void;
  setFontScale: (scale: "compact" | "standard" | "spacious") => void;

  // ---- AI Revision actions ----
  setPendingRevision: (revision: PendingRevision | null) => void;
  acceptRevision: () => void;
  rejectRevision: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSectionId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// Store: temporal(immer(...))
// ---------------------------------------------------------------------------

type TemporalResumeEditorStore = StoreApi<ResumeEditorState> & {
  temporal: StoreApi<{
    pastStates: Partial<ResumeEditorState>[];
    futureStates: Partial<ResumeEditorState>[];
    undo: () => void;
    redo: () => void;
    clear: () => void;
  }>;
};

export const useResumeEditor = create<ResumeEditorState>()(
  temporal(
    immer((set) => ({
      // ---- Initial state ----
      resume: createDefaultResumeData(),
      pendingRevision: null,
      isRevisionPending: false,

      // ---- Document-level actions ----
      setResume: (data) =>
        set((state) => {
          state.resume = data as WritableDraft<ResumeData>;
        }),

      updateResume: (recipe) =>
        set((state) => {
          recipe(state.resume);
        }),

      resetResume: () =>
        set((state) => {
          state.resume = createDefaultResumeData() as WritableDraft<ResumeData>;
        }),

      changeTemplate: (templateId) =>
        set((state) => {
          state.resume.metadata.template = templateId;

          // For pro templates, also set the recommended font pairing and layout
          // This uses a dynamic import pattern — the template defs are small
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { getProTemplate } = require("@/lib/resume/templates/template-defs");
            const def = getProTemplate(templateId);
            if (def) {
              // Set the default font pairing for this template
              state.resume.metadata.typography.fontPairing = def.defaultFontPairing;

              // Update layout — set section distribution based on template defaults
              const isTwoCol = def.isTwoColumn;
              if (state.resume.metadata.layout.pages.length > 0) {
                state.resume.metadata.layout.pages[0].fullWidth = !isTwoCol;
                state.resume.metadata.layout.pages[0].main = [...def.mainSections];
                state.resume.metadata.layout.pages[0].sidebar = [...def.sidebarSections];
              }
              // Set sidebar width as percentage
              if (def.sidebarWidthPx > 0) {
                state.resume.metadata.layout.sidebarWidth = Math.round((def.sidebarWidthPx / 794) * 100);
              }
            }
          } catch {
            // Ignore — non-pro template
          }
        }),

      // ---- Section items ----
      addSectionItem: (sectionKey, item) =>
        set((state) => {
          const section = (state.resume.sections as unknown as Record<string, { items: unknown[] }>)[sectionKey];
          if (section?.items) {
            section.items.push(item);
          }
        }),

      updateSectionItem: (sectionKey, itemIndex, data) =>
        set((state) => {
          const section = (state.resume.sections as unknown as Record<string, { items: Record<string, unknown>[] }>)[sectionKey];
          if (section?.items?.[itemIndex]) {
            Object.assign(section.items[itemIndex], data);
          }
        }),

      removeSectionItem: (sectionKey, itemIndex) =>
        set((state) => {
          const section = (state.resume.sections as unknown as Record<string, { items: unknown[] }>)[sectionKey];
          if (section?.items && itemIndex >= 0 && itemIndex < section.items.length) {
            section.items.splice(itemIndex, 1);
          }
        }),

      reorderSectionItems: (sectionKey, fromIndex, toIndex) =>
        set((state) => {
          const section = (state.resume.sections as unknown as Record<string, { items: unknown[] }>)[sectionKey];
          if (!section?.items) return;
          const [item] = section.items.splice(fromIndex, 1);
          section.items.splice(toIndex, 0, item);
        }),

      toggleSectionVisibility: (sectionKey) =>
        set((state) => {
          const section = (state.resume.sections as unknown as Record<string, { hidden: boolean }>)[sectionKey];
          if (section) {
            section.hidden = !section.hidden;
          }
        }),

      renameSectionTitle: (sectionKey, title) =>
        set((state) => {
          const section = (state.resume.sections as unknown as Record<string, { title: string }>)[sectionKey];
          if (section) {
            section.title = title;
          }
        }),

      // ---- Custom sections ----
      addCustomSection: (title) =>
        set((state) => {
          const id = createSectionId();
          (state.resume.customSections as unknown as ResumeData["customSections"]).push({
            id,
            title,
            type: "basic",
            items: [],
            hidden: false,
          });
          // Add to first page main column
          if (state.resume.metadata.layout.pages.length > 0) {
            state.resume.metadata.layout.pages[0].main.push(id);
          }
        }),

      removeCustomSection: (sectionId) =>
        set((state) => {
          state.resume.customSections = state.resume.customSections.filter(
            (s) => s.id !== sectionId
          ) as WritableDraft<ResumeData["customSections"]>;
          // Remove from layout
          for (const page of state.resume.metadata.layout.pages) {
            page.main = page.main.filter((k) => k !== sectionId);
            page.sidebar = page.sidebar.filter((k) => k !== sectionId);
          }
        }),

      // ---- Layout ----
      moveSectionToColumn: (sectionKey, column, pageIndex) =>
        set((state) => {
          const pages = state.resume.metadata.layout.pages;
          // Remove from all pages/columns first
          for (const page of pages) {
            page.main = page.main.filter((k) => k !== sectionKey);
            page.sidebar = page.sidebar.filter((k) => k !== sectionKey);
          }
          // Ensure page exists
          while (pages.length <= pageIndex) {
            pages.push({ fullWidth: false, main: [], sidebar: [] });
          }
          pages[pageIndex][column].push(sectionKey);
        }),

      // ---- Metadata shortcuts ----
      setAccentColor: (color) =>
        set((state) => {
          state.resume.metadata.design.primaryColor = color;
        }),

      setFontPairing: (pairingId) =>
        set((state) => {
          state.resume.metadata.typography.fontPairing = pairingId;
        }),

      setFontScale: (scale) =>
        set((state) => {
          state.resume.metadata.typography.fontScale = scale;
        }),

      // ---- AI Revision ----
      setPendingRevision: (revision) =>
        set((state) => {
          state.pendingRevision = revision as WritableDraft<PendingRevision> | null;
          state.isRevisionPending = revision !== null;
        }),

      acceptRevision: () =>
        set((state) => {
          // When accepted, the pending revision hunks have already been applied
          // via a preview — we just clear the pending state.
          // The current resume state IS the accepted state.
          state.pendingRevision = null;
          state.isRevisionPending = false;
        }),

      rejectRevision: () =>
        set((state) => {
          // Revert will be handled by the temporal undo outside this action
          state.pendingRevision = null;
          state.isRevisionPending = false;
        }),
    })),
    {
      // Temporal (zundo) options
      partialize: (state) => ({
        resume: state.resume,
      }),
      equality: (a, b) => isDeepEqual(a, b),
      limit: 100,
    }
  )
);

// ---------------------------------------------------------------------------
// Temporal hook — convenience for accessing undo/redo
// ---------------------------------------------------------------------------

export function useResumeTemporalStore<T>(
  selector: (state: {
    pastStates: Partial<ResumeEditorState>[];
    futureStates: Partial<ResumeEditorState>[];
    undo: () => void;
    redo: () => void;
    clear: () => void;
  }) => T
): T {
  return useStore(
    (useResumeEditor as unknown as TemporalResumeEditorStore).temporal,
    selector
  );
}
