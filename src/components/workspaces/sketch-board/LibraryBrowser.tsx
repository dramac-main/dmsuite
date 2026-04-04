"use client";

import React, { useCallback, useEffect, useState } from "react";

/* ── Catalog types ─────────────────────────────────────────── */

interface CatalogLibrary {
  name: string;
  itemCount: number;
  downloads: number;
}

interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  libraryCount: number;
  totalItems: number;
  libraries: CatalogLibrary[];
}

interface Catalog {
  version: number;
  generated: string;
  categories: CatalogCategory[];
}

interface CategoryBundle {
  id: string;
  name: string;
  libraries: {
    name: string;
    itemCount: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
  }[];
}

/* ── Category icons (inline SVG for clean look) ──────────── */

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  shapes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  icons: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  layout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  architecture: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="8" y="14" width="8" height="8" rx="1" /><line x1="6" y1="10" x2="12" y2="14" /><line x1="18" y1="10" x2="12" y2="14" />
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  science: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M9 3v6l-4 8h14l-4-8V3" /><line x1="8" y1="3" x2="16" y2="3" />
    </svg>
  ),
};

/* ── Props ────────────────────────────────────────────────── */

interface LibraryBrowserProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLoadCategory: (categoryId: string, items: any[]) => void;
  loadedCategories: Set<string>;
}

/* ── Component ───────────────────────────────────────────── */

export default function LibraryBrowser({
  open,
  onClose,
  onLoadCategory,
  loadedCategories,
}: LibraryBrowserProps) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch catalog on first open
  useEffect(() => {
    if (!open || catalog) return;
    fetch("/libraries/excalidraw/catalog.json")
      .then((res) => res.json())
      .then((data) => setCatalog(data))
      .catch(() => setError("Failed to load library catalog"));
  }, [open, catalog]);

  const handleLoadCategory = useCallback(
    async (categoryId: string) => {
      if (loadedCategories.has(categoryId) || loading) return;
      setLoading(categoryId);
      setError(null);

      try {
        const res = await fetch(
          `/libraries/excalidraw/categories/${categoryId}.json`
        );
        const bundle: CategoryBundle = await res.json();

        // Flatten all items from all libraries in this category
        const allItems = bundle.libraries.flatMap((lib) => lib.items);
        onLoadCategory(categoryId, allItems);
      } catch {
        setError(`Failed to load category`);
      } finally {
        setLoading(null);
      }
    },
    [loading, loadedCategories, onLoadCategory]
  );

  const handleLoadAll = useCallback(async () => {
    if (!catalog || loading) return;
    setLoading("__all__");
    setError(null);

    try {
      const unloaded = catalog.categories.filter(
        (c) => !loadedCategories.has(c.id)
      );
      for (const cat of unloaded) {
        const res = await fetch(
          `/libraries/excalidraw/categories/${cat.id}.json`
        );
        const bundle: CategoryBundle = await res.json();
        const allItems = bundle.libraries.flatMap((lib) => lib.items);
        onLoadCategory(cat.id, allItems);
      }
    } catch {
      setError("Failed to load some categories");
    } finally {
      setLoading(null);
    }
  }, [catalog, loading, loadedCategories, onLoadCategory]);

  if (!open) return null;

  const totalLoaded = catalog
    ? catalog.categories
        .filter((c) => loadedCategories.has(c.id))
        .reduce((s, c) => s + c.totalItems, 0)
    : 0;
  const totalAvailable = catalog
    ? catalog.categories.reduce((s, c) => s + c.totalItems, 0)
    : 0;

  return (
    <div className="absolute right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Library Browser
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {totalLoaded}/{totalAvailable} items loaded
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Load All */}
      {catalog && loadedCategories.size < catalog.categories.length && (
        <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
          <button
            onClick={handleLoadAll}
            disabled={loading !== null}
            className="w-full rounded-md bg-primary-500 px-3 py-1.5 text-xs font-medium text-gray-950 transition-colors hover:bg-primary-400 disabled:opacity-50"
          >
            {loading === "__all__"
              ? "Loading all…"
              : `Load All Categories (${totalAvailable} items)`}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-4 mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Category list */}
      <div className="flex-1 overflow-y-auto">
        {!catalog ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : (
          catalog.categories.map((cat) => {
            const isLoaded = loadedCategories.has(cat.id);
            const isLoading = loading === cat.id;
            const isExpanded = expanded === cat.id;

            return (
              <div
                key={cat.id}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                {/* Category header */}
                <button
                  onClick={() =>
                    setExpanded(isExpanded ? null : cat.id)
                  }
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <span className="text-gray-500 dark:text-gray-400">
                    {CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS.shapes}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {cat.name}
                      </span>
                      {isLoaded && (
                        <span className="rounded-full bg-primary-500/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-600 dark:text-primary-400">
                          Loaded
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {cat.libraryCount} libraries · {cat.totalItems} items
                    </span>
                  </div>
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded: library list */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 dark:border-gray-800 dark:bg-gray-800/30">
                    <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      {cat.description}
                    </p>
                    {cat.libraries.map((lib, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {lib.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {lib.itemCount} items
                        </span>
                      </div>
                    ))}

                    {/* Load button */}
                    {!isLoaded && (
                      <button
                        onClick={() => handleLoadCategory(cat.id)}
                        disabled={isLoading}
                        className="mt-2 w-full rounded-md border border-primary-500/30 bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-500/20 disabled:opacity-50 dark:text-primary-400"
                      >
                        {isLoading
                          ? "Loading…"
                          : `Add ${cat.totalItems} items to canvas`}
                      </button>
                    )}
                    {isLoaded && (
                      <p className="mt-2 text-center text-xs text-primary-600 dark:text-primary-400">
                        ✓ Already loaded
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
        <p className="text-[10px] text-gray-400">
          50 community libraries · MIT Licensed
        </p>
      </div>
    </div>
  );
}
