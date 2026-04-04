/**
 * Resume V2 Editor Store — Adapted from Reactive Resume v5
 * Zustand + Immer + Temporal (undo/redo) + Persist
 */
"use client";

import type { WritableDraft } from "immer";
import { temporal } from "zundo";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import {
  type ResumeData,
  type SectionType,
  type SectionItem,
  type CustomSection,
  type Template,
  defaultResumeData,
} from "@/lib/resume-v2/schema";

type ResumeV2State = {
  resume: ResumeData;
  isReady: boolean;
};

type ResumeV2Actions = {
  initialize: (data: ResumeData | null) => void;
  updateResumeData: (fn: (draft: WritableDraft<ResumeData>) => void) => void;
  resetResume: () => void;
  // Convenience actions
  setTemplate: (template: Template) => void;
  updateBasics: (field: string, value: string) => void;
  updateSummary: (field: string, value: string | number | boolean) => void;
  addSectionItem: <T extends SectionType>(type: T, item: SectionItem<T>) => void;
  updateSectionItem: <T extends SectionType>(type: T, id: string, data: Partial<SectionItem<T>>) => void;
  removeSectionItem: (type: SectionType, id: string) => void;
  toggleSectionVisibility: (type: SectionType) => void;
  renameSectionTitle: (type: SectionType, title: string) => void;
  setSectionColumns: (type: SectionType, columns: number) => void;
  addCustomSection: (section: CustomSection) => void;
  removeCustomSection: (id: string) => void;
  setPrimaryColor: (color: string) => void;
  setFontFamily: (target: "body" | "heading", fontFamily: string) => void;
  setFontSize: (target: "body" | "heading", size: number) => void;
  setLineHeight: (target: "body" | "heading", lh: number) => void;
  setPageMargins: (marginX: number, marginY: number) => void;
  setPageGaps: (gapX: number, gapY: number) => void;
  setPageFormat: (format: "a4" | "letter" | "free-form") => void;
  setSidebarWidth: (width: number) => void;
  setCustomCSS: (enabled: boolean, value: string) => void;
  setNotes: (notes: string) => void;
  setHideIcons: (hide: boolean) => void;
  setLevelDesign: (type: string) => void;
  setTextColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  updatePicture: (field: string, value: string | number | boolean) => void;
  moveSectionToColumn: (sectionId: string, pageIndex: number, column: "main" | "sidebar", position?: number) => void;
  reorderSectionInColumn: (pageIndex: number, column: "main" | "sidebar", fromIndex: number, toIndex: number) => void;
  addPage: () => void;
  removePage: (pageIndex: number) => void;
};

export type ResumeV2Store = ResumeV2State & ResumeV2Actions;

export const useResumeV2Editor = create<ResumeV2Store>()(
  temporal(
    persist(
      immer((set) => ({
        resume: structuredClone(defaultResumeData),
        isReady: true,

        initialize: (data) => {
          set((state) => {
            if (data) {
              state.resume = data as WritableDraft<ResumeData>;
            } else {
              state.resume = structuredClone(defaultResumeData) as WritableDraft<ResumeData>;
            }
            state.isReady = true;
          });
        },

        updateResumeData: (fn) => {
          set((state) => {
            fn(state.resume);
          });
        },

        resetResume: () => {
          set((state) => {
            state.resume = structuredClone(defaultResumeData) as WritableDraft<ResumeData>;
          });
        },

        setTemplate: (template) => {
          set((state) => { state.resume.metadata.template = template; });
        },

        updateBasics: (field, value) => {
          set((state) => {
            if (field === "website.url") {
              state.resume.basics.website.url = value;
            } else if (field === "website.label") {
              state.resume.basics.website.label = value;
            } else {
              (state.resume.basics as Record<string, unknown>)[field] = value;
            }
          });
        },

        updateSummary: (field, value) => {
          set((state) => {
            (state.resume.summary as Record<string, unknown>)[field] = value;
          });
        },

        addSectionItem: (type, item) => {
          set((state) => {
            const section = state.resume.sections[type] as { items: unknown[] };
            section.items.push(item);
          });
        },

        updateSectionItem: (type, id, data) => {
          set((state) => {
            const section = state.resume.sections[type] as { items: Array<{ id: string }> };
            const idx = section.items.findIndex((i) => i.id === id);
            if (idx !== -1) Object.assign(section.items[idx], data);
          });
        },

        removeSectionItem: (type, id) => {
          set((state) => {
            const section = state.resume.sections[type] as { items: Array<{ id: string }> };
            section.items = section.items.filter((i) => i.id !== id);
          });
        },

        toggleSectionVisibility: (type) => {
          set((state) => { (state.resume.sections[type] as { hidden: boolean }).hidden = !(state.resume.sections[type] as { hidden: boolean }).hidden; });
        },

        renameSectionTitle: (type, title) => {
          set((state) => { (state.resume.sections[type] as { title: string }).title = title; });
        },

        setSectionColumns: (type, columns) => {
          set((state) => { (state.resume.sections[type] as { columns: number }).columns = columns; });
        },

        addCustomSection: (section) => {
          set((state) => { state.resume.customSections.push(section as WritableDraft<CustomSection>); });
        },

        removeCustomSection: (id) => {
          set((state) => {
            state.resume.customSections = state.resume.customSections.filter((s) => s.id !== id);
          });
        },

        setPrimaryColor: (color) => {
          set((state) => { state.resume.metadata.design.colors.primary = color; });
        },

        setTextColor: (color) => {
          set((state) => { state.resume.metadata.design.colors.text = color; });
        },

        setBackgroundColor: (color) => {
          set((state) => { state.resume.metadata.design.colors.background = color; });
        },

        setFontFamily: (target, fontFamily) => {
          set((state) => { state.resume.metadata.typography[target].fontFamily = fontFamily; });
        },

        setFontSize: (target, size) => {
          set((state) => { state.resume.metadata.typography[target].fontSize = size; });
        },

        setLineHeight: (target, lh) => {
          set((state) => { state.resume.metadata.typography[target].lineHeight = lh; });
        },

        setPageMargins: (marginX, marginY) => {
          set((state) => {
            state.resume.metadata.page.marginX = marginX;
            state.resume.metadata.page.marginY = marginY;
          });
        },

        setPageGaps: (gapX, gapY) => {
          set((state) => {
            state.resume.metadata.page.gapX = gapX;
            state.resume.metadata.page.gapY = gapY;
          });
        },

        setPageFormat: (format) => {
          set((state) => { state.resume.metadata.page.format = format; });
        },

        setSidebarWidth: (width) => {
          set((state) => { state.resume.metadata.layout.sidebarWidth = width; });
        },

        setCustomCSS: (enabled, value) => {
          set((state) => {
            state.resume.metadata.css.enabled = enabled;
            state.resume.metadata.css.value = value;
          });
        },

        setNotes: (notes) => {
          set((state) => { state.resume.metadata.notes = notes; });
        },

        setHideIcons: (hide) => {
          set((state) => { state.resume.metadata.page.hideIcons = hide; });
        },

        setLevelDesign: (type) => {
          set((state) => {
            state.resume.metadata.design.level.type = type as ResumeData["metadata"]["design"]["level"]["type"];
          });
        },

        updatePicture: (field, value) => {
          set((state) => {
            (state.resume.picture as Record<string, unknown>)[field] = value;
          });
        },

        moveSectionToColumn: (sectionId, pageIndex, column, position) => {
          set((state) => {
            const pages = state.resume.metadata.layout.pages;
            if (!pages[pageIndex]) return;
            // Remove from all pages/columns
            for (const page of pages) {
              page.main = page.main.filter((s) => s !== sectionId);
              page.sidebar = page.sidebar.filter((s) => s !== sectionId);
            }
            // Add to target
            const target = pages[pageIndex][column];
            if (position !== undefined) {
              target.splice(position, 0, sectionId);
            } else {
              target.push(sectionId);
            }
          });
        },

        reorderSectionInColumn: (pageIndex, column, fromIndex, toIndex) => {
          set((state) => {
            const pages = state.resume.metadata.layout.pages;
            if (!pages[pageIndex]) return;
            const arr = pages[pageIndex][column];
            const [item] = arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, item);
          });
        },

        addPage: () => {
          set((state) => {
            state.resume.metadata.layout.pages.push({ fullWidth: false, main: [], sidebar: [] });
          });
        },

        removePage: (pageIndex) => {
          set((state) => {
            const pages = state.resume.metadata.layout.pages;
            if (pages.length <= 1) return;
            pages.splice(pageIndex, 1);
          });
        },
      })),
      {
        name: "dmsuite-resume-v2",
        version: 1,
      },
    ),
    {
      limit: 100,
      equality: (a, b) => JSON.stringify(a) === JSON.stringify(b),
    },
  ),
);
