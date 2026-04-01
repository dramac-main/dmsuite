// =============================================================================
// DMSuite — Resume & CV Builder Editor Store (V2 — Reactive Resume Aligned)
// Zustand + temporal(immer(persist(...))) pattern with full undo/redo.
// =============================================================================

import { create, type StoreApi, useStore } from "zustand";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import type { WritableDraft } from "immer";
import isDeepEqual from "fast-deep-equal";
import type {
  ResumeData, SectionKey, TemplateId,
  LevelType, TypographyItem, Picture, Basics,
} from "@/lib/resume/schema";
import { createDefaultResumeData, createBlankItem } from "@/lib/resume/schema";

// ---------------------------------------------------------------------------
// Deep-merge helper: recursively fills in missing keys from defaults
// ---------------------------------------------------------------------------

function deepMerge<T extends Record<string, unknown>>(target: T, defaults: T): T {
  const result = { ...defaults };
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      const tVal = target[key];
      const dVal = defaults[key];
      if (
        tVal !== null && tVal !== undefined &&
        typeof tVal === "object" && !Array.isArray(tVal) &&
        dVal !== null && dVal !== undefined &&
        typeof dVal === "object" && !Array.isArray(dVal)
      ) {
        result[key] = deepMerge(
          tVal as Record<string, unknown>,
          dVal as Record<string, unknown>,
        ) as T[Extract<keyof T, string>];
      } else if (tVal !== undefined) {
        result[key] = tVal;
      }
    }
  }
  return result;
}

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
  resume: ResumeData;
  pendingRevision: PendingRevision | null;
  isRevisionPending: boolean;

  // Full state
  setResume: (data: ResumeData) => void;
  updateResume: (recipe: (draft: WritableDraft<ResumeData>) => void) => void;
  resetResume: () => void;

  // Template
  changeTemplate: (templateId: TemplateId) => void;

  // Basics
  updateBasics: (data: Partial<Basics>) => void;

  // Picture
  updatePicture: (data: Partial<Picture>) => void;

  // Summary
  updateSummary: (data: Partial<{ title: string; content: string; hidden: boolean; columns: number }>) => void;

  // Section CRUD
  addSectionItem: (sectionKey: SectionKey, item?: Record<string, unknown>) => void;
  updateSectionItem: (sectionKey: SectionKey, itemIndex: number, data: Record<string, unknown>) => void;
  removeSectionItem: (sectionKey: SectionKey, itemIndex: number) => void;
  reorderSectionItems: (sectionKey: SectionKey, fromIndex: number, toIndex: number) => void;
  toggleSectionVisibility: (sectionKey: SectionKey) => void;
  renameSectionTitle: (sectionKey: SectionKey, title: string) => void;
  setSectionColumns: (sectionKey: SectionKey, columns: number) => void;

  // Custom sections
  addCustomSection: (title: string, type?: string) => void;
  removeCustomSection: (sectionId: string) => void;
  updateCustomSectionItem: (sectionId: string, itemIndex: number, data: Record<string, unknown>) => void;
  addCustomSectionItem: (sectionId: string) => void;
  removeCustomSectionItem: (sectionId: string, itemIndex: number) => void;

  // Layout
  moveSectionToColumn: (sectionId: string, column: "main" | "sidebar", pageIndex: number) => void;
  addPage: () => void;
  removePage: (pageIndex: number) => void;
  reorderSectionsOnPage: (pageIndex: number, column: "main" | "sidebar", fromIndex: number, toIndex: number) => void;

  // Metadata
  setPrimaryColor: (color: string) => void;
  setTextColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setSidebarWidth: (width: number) => void;
  setPageFormat: (format: "a4" | "letter") => void;
  setPageMargins: (marginX: number, marginY: number) => void;
  setPageGaps: (gapX: number, gapY: number) => void;
  setBodyTypography: (data: Partial<TypographyItem>) => void;
  setHeadingTypography: (data: Partial<TypographyItem>) => void;
  setLevelDesign: (type: LevelType) => void;
  setHideIcons: (hide: boolean) => void;
  setCustomCSS: (enabled: boolean, value?: string) => void;
  setNotes: (notes: string) => void;

  // AI Revision
  setPendingRevision: (revision: PendingRevision | null) => void;
  acceptRevision: () => void;
  rejectRevision: () => void;
}

// ---------------------------------------------------------------------------
// Helper: uid generator
// ---------------------------------------------------------------------------
let _counter = 0;
function uid(): string {
  return `${Date.now().toString(36)}-${(++_counter).toString(36)}`;
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

const useResumeEditorBase = create<ResumeEditorState>()(
  temporal(
    immer(
      persist(
        (set) => ({
          resume: createDefaultResumeData(),
          pendingRevision: null,
          isRevisionPending: false,

          // ---- Full state ----
          setResume: (data) => set((s) => { s.resume = data; s.pendingRevision = null; s.isRevisionPending = false; }),
          updateResume: (recipe) => set((s) => { recipe(s.resume as WritableDraft<ResumeData>); }),
          resetResume: () => set((s) => { Object.assign(s, { resume: createDefaultResumeData(), pendingRevision: null, isRevisionPending: false }); }),

          // ---- Template ----
          changeTemplate: (templateId) => set((s) => { s.resume.metadata.template = templateId; }),

          // ---- Basics ----
          updateBasics: (data) => set((s) => { Object.assign(s.resume.basics, data); }),

          // ---- Picture ----
          updatePicture: (data) => set((s) => { Object.assign(s.resume.picture, data); }),

          // ---- Summary ----
          updateSummary: (data) => set((s) => { Object.assign(s.resume.summary, data); }),

          // ---- Section CRUD ----
          addSectionItem: (sectionKey, item) => set((s) => {
            const section = s.resume.sections[sectionKey];
            if (section) {
              (section.items as unknown[]).push(item ?? createBlankItem(sectionKey));
            }
          }),

          updateSectionItem: (sectionKey, itemIndex, data) => set((s) => {
            const section = s.resume.sections[sectionKey];
            if (section && section.items[itemIndex]) {
              Object.assign(section.items[itemIndex] as Record<string, unknown>, data);
            }
          }),

          removeSectionItem: (sectionKey, itemIndex) => set((s) => {
            const section = s.resume.sections[sectionKey];
            if (section) {
              (section.items as unknown[]).splice(itemIndex, 1);
            }
          }),

          reorderSectionItems: (sectionKey, fromIndex, toIndex) => set((s) => {
            const section = s.resume.sections[sectionKey];
            if (section) {
              const items = section.items as unknown[];
              const [removed] = items.splice(fromIndex, 1);
              items.splice(toIndex, 0, removed);
            }
          }),

          toggleSectionVisibility: (sectionKey) => set((s) => {
            const section = s.resume.sections[sectionKey];
            if (section) section.hidden = !section.hidden;
          }),

          renameSectionTitle: (sectionKey, title) => set((s) => {
            const section = s.resume.sections[sectionKey];
            if (section) section.title = title;
          }),

          setSectionColumns: (sectionKey, columns) => set((s) => {
            const section = s.resume.sections[sectionKey];
            if (section) section.columns = columns;
          }),

          // ---- Custom sections ----
          addCustomSection: (title, type = "summary") => set((s) => {
            const id = uid();
            s.resume.customSections.push({ id, title, type, columns: 1, hidden: false, items: [] });
            if (s.resume.metadata.layout.pages.length > 0) {
              s.resume.metadata.layout.pages[0].main.push(id);
            }
          }),

          removeCustomSection: (sectionId) => set((s) => {
            s.resume.customSections = s.resume.customSections.filter((cs) => cs.id !== sectionId);
            for (const page of s.resume.metadata.layout.pages) {
              page.main = page.main.filter((id) => id !== sectionId);
              page.sidebar = page.sidebar.filter((id) => id !== sectionId);
            }
          }),

          updateCustomSectionItem: (sectionId, itemIndex, data) => set((s) => {
            const cs = s.resume.customSections.find((c) => c.id === sectionId);
            if (cs && cs.items[itemIndex]) {
              Object.assign(cs.items[itemIndex] as Record<string, unknown>, data);
            }
          }),

          addCustomSectionItem: (sectionId) => set((s) => {
            const cs = s.resume.customSections.find((c) => c.id === sectionId);
            if (cs) {
              cs.items.push({ id: uid(), hidden: false, content: "" });
            }
          }),

          removeCustomSectionItem: (sectionId, itemIndex) => set((s) => {
            const cs = s.resume.customSections.find((c) => c.id === sectionId);
            if (cs) {
              cs.items.splice(itemIndex, 1);
            }
          }),

          // ---- Layout ----
          moveSectionToColumn: (sectionId, column, pageIndex) => set((s) => {
            const layout = s.resume.metadata.layout;
            for (const page of layout.pages) {
              page.main = page.main.filter((id) => id !== sectionId);
              page.sidebar = page.sidebar.filter((id) => id !== sectionId);
            }
            while (layout.pages.length <= pageIndex) {
              layout.pages.push({ fullWidth: false, main: [], sidebar: [] });
            }
            layout.pages[pageIndex][column].push(sectionId);
          }),

          addPage: () => set((s) => {
            s.resume.metadata.layout.pages.push({ fullWidth: false, main: [], sidebar: [] });
          }),

          removePage: (pageIndex) => set((s) => {
            const pages = s.resume.metadata.layout.pages;
            if (pages.length > 1 && pages[pageIndex]) {
              const page = pages[pageIndex];
              pages[0].main.push(...page.main);
              pages[0].sidebar.push(...page.sidebar);
              pages.splice(pageIndex, 1);
            }
          }),

          reorderSectionsOnPage: (pageIndex, column, fromIndex, toIndex) => set((s) => {
            const page = s.resume.metadata.layout.pages[pageIndex];
            if (page) {
              const arr = page[column];
              const [removed] = arr.splice(fromIndex, 1);
              arr.splice(toIndex, 0, removed);
            }
          }),

          // ---- Metadata ----
          setPrimaryColor: (color) => set((s) => { s.resume.metadata.design.colors.primary = color; }),
          setTextColor: (color) => set((s) => { s.resume.metadata.design.colors.text = color; }),
          setBackgroundColor: (color) => set((s) => { s.resume.metadata.design.colors.background = color; }),
          setSidebarWidth: (width) => set((s) => { s.resume.metadata.layout.sidebarWidth = width; }),
          setPageFormat: (format) => set((s) => { s.resume.metadata.page.format = format; }),
          setPageMargins: (marginX, marginY) => set((s) => { s.resume.metadata.page.marginX = marginX; s.resume.metadata.page.marginY = marginY; }),
          setPageGaps: (gapX, gapY) => set((s) => { s.resume.metadata.page.gapX = gapX; s.resume.metadata.page.gapY = gapY; }),
          setBodyTypography: (data) => set((s) => { Object.assign(s.resume.metadata.typography.body, data); }),
          setHeadingTypography: (data) => set((s) => { Object.assign(s.resume.metadata.typography.heading, data); }),
          setLevelDesign: (type) => set((s) => { s.resume.metadata.design.level.type = type; }),
          setHideIcons: (hide) => set((s) => { s.resume.metadata.page.hideIcons = hide; }),
          setCustomCSS: (enabled, value) => set((s) => { s.resume.metadata.css.enabled = enabled; if (value !== undefined) s.resume.metadata.css.value = value; }),
          setNotes: (notes) => set((s) => { s.resume.metadata.notes = notes; }),

          // ---- AI Revision ----
          setPendingRevision: (revision) => set((s) => { s.pendingRevision = revision; s.isRevisionPending = !!revision; }),
          acceptRevision: () => set((s) => {
            if (s.pendingRevision) {
              for (const hunk of s.pendingRevision.hunks) {
                const parts = hunk.path.split(".");
                let target: unknown = s.resume;
                for (let i = 0; i < parts.length - 1; i++) {
                  target = (target as Record<string, unknown>)[parts[i]];
                  if (!target) break;
                }
                if (target) {
                  (target as Record<string, unknown>)[parts[parts.length - 1]] = hunk.after;
                }
              }
              s.pendingRevision = null;
              s.isRevisionPending = false;
            }
          }),
          rejectRevision: () => set((s) => { s.pendingRevision = null; s.isRevisionPending = false; }),
        }),
        {
          name: "dmsuite-resume",
          version: 2,
          partialize: (state) => ({ resume: state.resume }),
          migrate: () => {
            // Any pre-V2 data is incompatible — return fresh defaults
            return { resume: createDefaultResumeData(), pendingRevision: null, isRevisionPending: false };
          },
          merge: (persisted, current) => {
            const p = persisted as Partial<ResumeEditorState> | undefined;
            if (!p?.resume || typeof p.resume !== "object") {
              return current;
            }
            // Deep-merge persisted resume with fresh defaults so every nested
            // key is guaranteed to exist even if localStorage has partial/old data
            const defaults = createDefaultResumeData();
            const merged = deepMerge(
              p.resume as unknown as Record<string, unknown>,
              defaults as unknown as Record<string, unknown>,
            ) as ResumeData;
            return { ...current, resume: merged };
          },
        },
      ),
    ),
    {
      equality: (a, b) => isDeepEqual(a, b),
      limit: 100,
    },
  ),
);

// ---------------------------------------------------------------------------
// Hook + temporal selectors
// ---------------------------------------------------------------------------

export function useResumeEditor<T>(selector: (s: ResumeEditorState) => T): T {
  return useStore(useResumeEditorBase as unknown as StoreApi<ResumeEditorState>, selector);
}

// Expose getState/subscribe for store adapters and Chiko manifests
useResumeEditor.getState = () => (useResumeEditorBase as unknown as StoreApi<ResumeEditorState>).getState();
useResumeEditor.subscribe = (cb: (state: ResumeEditorState) => void) =>
  (useResumeEditorBase as unknown as StoreApi<ResumeEditorState>).subscribe(cb);

export function useResumeTemporalStore<T>(
  selector: (s: {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    pastStates: ResumeEditorState[];
    futureStates: ResumeEditorState[];
  }) => T,
): T {
  return useStore(
    (useResumeEditorBase as unknown as { temporal: StoreApi<unknown> }).temporal as StoreApi<{
      undo: () => void;
      redo: () => void;
      clear: () => void;
      pastStates: ResumeEditorState[];
      futureStates: ResumeEditorState[];
    }>,
    selector,
  );
}
