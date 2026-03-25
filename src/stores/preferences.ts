import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  /** Recently used tool IDs */
  recentTools: string[];
  /** Favorite / pinned tool IDs */
  favoriteTools: string[];
  /** Recent search queries (max 8) */
  recentSearches: string[];
  /** Last visited tool per category for breadcrumb return */
  lastVisitedPerCategory: Record<string, string>;
  /** Dashboard sections the user has hidden */
  hiddenSections: string[];
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
  /** Add a search query to recent searches */
  addRecentSearch: (query: string) => void;
  /** Clear recent searches */
  clearRecentSearches: () => void;
  /** Track last visited tool for a category */
  setLastVisited: (categoryId: string, toolId: string) => void;
  /** Toggle a dashboard section's visibility */
  toggleSection: (sectionId: string) => void;
  /** Toggle description visibility */
  toggleDescriptions: () => void;
  /** Toggle a category expansion */
  toggleCategory: (categoryId: string) => void;
  /** Clear all preferences (used on sign out) */
  clearAll: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      recentTools: [],
      favoriteTools: [],
      recentSearches: [],
      lastVisitedPerCategory: {},
      hiddenSections: [],
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

      addRecentSearch: (query) => {
        const q = query.trim();
        if (!q || q.length < 2) return;
        set((s) => ({
          recentSearches: [q, ...s.recentSearches.filter((s) => s !== q)].slice(0, 8),
        }));
      },
      clearRecentSearches: () => set({ recentSearches: [] }),

      setLastVisited: (categoryId, toolId) =>
        set((s) => ({
          lastVisitedPerCategory: { ...s.lastVisitedPerCategory, [categoryId]: toolId },
        })),

      toggleSection: (sectionId) =>
        set((s) => ({
          hiddenSections: s.hiddenSections.includes(sectionId)
            ? s.hiddenSections.filter((id) => id !== sectionId)
            : [...s.hiddenSections, sectionId],
        })),

      toggleDescriptions: () => set((s) => ({ showDescriptions: !s.showDescriptions })),

      toggleCategory: (categoryId) =>
        set((s) => ({
          expandedCategories: s.expandedCategories.includes(categoryId)
            ? s.expandedCategories.filter((id) => id !== categoryId)
            : [...s.expandedCategories, categoryId],
        })),

      clearAll: () =>
        set({
          recentTools: [],
          favoriteTools: [],
          recentSearches: [],
          lastVisitedPerCategory: {},
          hiddenSections: [],
          showDescriptions: true,
          expandedCategories: [],
        }),
    }),
    { name: "dmsuite-preferences" }
  )
);
