import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  /** Recently used tool IDs */
  recentTools: string[];
  /** Favorite / pinned tool IDs */
  favoriteTools: string[];
  /** Whether to show tool descriptions in cards */
  showDescriptions: boolean;
  /** Default category expansion on dashboard */
  expandedCategories: string[];

  /** Add a tool to recent history (max 20) */
  addRecentTool: (toolId: string) => void;
  /** Toggle a tool as favorite */
  toggleFavorite: (toolId: string) => void;
  /** Check if a tool is favorite */
  isFavorite: (toolId: string) => boolean;
  /** Toggle description visibility */
  toggleDescriptions: () => void;
  /** Toggle a category expansion */
  toggleCategory: (categoryId: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      recentTools: [],
      favoriteTools: [],
      showDescriptions: true,
      expandedCategories: [],

      addRecentTool: (toolId) =>
        set((s) => ({
          recentTools: [toolId, ...s.recentTools.filter((id) => id !== toolId)].slice(0, 20),
        })),

      toggleFavorite: (toolId) =>
        set((s) => ({
          favoriteTools: s.favoriteTools.includes(toolId)
            ? s.favoriteTools.filter((id) => id !== toolId)
            : [...s.favoriteTools, toolId],
        })),

      isFavorite: (toolId) => get().favoriteTools.includes(toolId),

      toggleDescriptions: () => set((s) => ({ showDescriptions: !s.showDescriptions })),

      toggleCategory: (categoryId) =>
        set((s) => ({
          expandedCategories: s.expandedCategories.includes(categoryId)
            ? s.expandedCategories.filter((id) => id !== categoryId)
            : [...s.expandedCategories, categoryId],
        })),
    }),
    { name: "dmsuite-preferences" }
  )
);
