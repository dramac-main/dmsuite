"use client";

// Excalidraw CSS — loaded via a local wrapper that uses a direct filesystem
// path to bypass the package exports map (which only has "development" /
// "production" conditions that Turbopack can't resolve for CSS).
import "./excalidraw-theme.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createSketchBoardManifest } from "@/lib/chiko/manifests/sketch-board";
import {
  fetchUserData,
  debouncedSaveUserData,
} from "@/lib/supabase/user-data";
import LibraryBrowser from "./LibraryBrowser";

// Excalidraw types — imported separately for type-checking
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

/**
 * SketchBoardWorkspace — Excalidraw-powered infinite canvas.
 *
 * DMSuite integration points:
 *   - Dark/light theme sync via `theme` prop
 *   - Workspace events (dirty, progress, save)
 *   - Chiko AI manifest for 20+ actions
 *   - localStorage-based scene persistence
 *   - 965 categorized library items across 11 categories (50 libraries)
 *   - Server-side library storage — survives cache resets
 *   - Per-user personal library persistence
 *   - Custom menu (no external Excalidraw platform links)
 */

const PERSISTENCE_KEY = "dmsuite-sketch-board";
const USER_LIBRARY_KEY = "dmsuite-sketch-library-user";
const CATALOG_URL = "/libraries/excalidraw/catalog.json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawMod = { Excalidraw: React.ComponentType<any>; MainMenu: any };

export default function SketchBoardWorkspace() {
  const { theme } = useTheme();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const dirtyCountRef = useRef(0);
  const hasDispatchedRef = useRef(false);
  const libraryLoadedRef = useRef(false);
  const readyRef = useRef(false);
  const [mod, setMod] = useState<ExcalidrawMod | null>(null);
  const [libraryBrowserOpen, setLibraryBrowserOpen] = useState(false);
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(
    new Set()
  );

  // ── Chiko AI integration ──
  useChikoActions(
    useCallback(() => createSketchBoardManifest(apiRef), [])
  );

  // ── Dynamically import Excalidraw (client-only, avoid SSR) ──
  useEffect(() => {
    let cancelled = false;
    import("@excalidraw/excalidraw").then((m) => {
      if (cancelled) return;
      setMod({ Excalidraw: m.Excalidraw, MainMenu: m.MainMenu });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Compute initialData once (stable reference — never re-created) ──
  const initialData = useMemo(() => {
    try {
      const raw = localStorage.getItem(PERSISTENCE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          elements: parsed.elements || [],
          appState: { ...parsed.appState },
        };
      }
    } catch {
      // Corrupted data — start fresh
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only compute once on mount

  // ── onChange: persist scene to localStorage + dispatch dirty ──
  // Uses a ref-based debounce to avoid overwhelming React with synchronous
  // DOM events on every single Excalidraw change callback.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elements: readonly any[], appState: Record<string, unknown>) => {
      // Don't process changes until the canvas is fully ready
      // (prevents onChange storms during library injection or initialization)
      if (!readyRef.current) return;

      dirtyCountRef.current++;

      // Debounce localStorage writes + workspace events (100ms)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        window.dispatchEvent(new CustomEvent("workspace:dirty"));

        if (dirtyCountRef.current === 1) {
          window.dispatchEvent(
            new CustomEvent("workspace:progress", {
              detail: { milestone: "input" },
            })
          );
        }
        if (dirtyCountRef.current === 5) {
          window.dispatchEvent(
            new CustomEvent("workspace:progress", {
              detail: { milestone: "content" },
            })
          );
        }

        try {
          const sceneData = {
            elements,
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
              gridSize: appState.gridSize,
            },
          };
          localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(sceneData));
        } catch {
          // localStorage full or unavailable — silently skip
        }
      }, 100);
    },
    []
  );

  // ── Capture the Excalidraw API ref ──
  const handleExcalidrawAPI = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      apiRef.current = api;

      // Fire initial progress signal
      if (!hasDispatchedRef.current) {
        hasDispatchedRef.current = true;
        window.dispatchEvent(
          new CustomEvent("workspace:progress", {
            detail: { progress: 70 },
          })
        );
      }

      // Mark canvas as ready after a short delay — this ensures
      // onChange events from initial render + library injection are skipped.
      // Library loading happens separately in a useEffect below.
      setTimeout(() => {
        readyRef.current = true;
      }, 500);
    },
    []
  );

  // ── Load default library categories on mount ──
  // Loads the 3 most popular categories automatically (People, Icons, Shapes).
  // User can load more via the Library Browser panel.
  useEffect(() => {
    const api = apiRef.current;
    if (!mod || !api || libraryLoadedRef.current) return;
    libraryLoadedRef.current = true;

    const DEFAULT_CATEGORIES = [
      "people-characters",
      "icons-symbols",
      "shapes-basics",
    ];

    const timer = setTimeout(async () => {
      const loaded = new Set<string>();

      // First, restore user personal library items.
      // Priority: Supabase (durable) > localStorage (fallback).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let userItems: any[] = [];

      try {
        const remote = await fetchUserData("sketch-library");
        if (remote && Array.isArray(remote.items) && remote.items.length > 0) {
          userItems = remote.items;
          // Sync remote → localStorage for offline access
          localStorage.setItem(USER_LIBRARY_KEY, JSON.stringify(userItems));
        }
      } catch {
        // Supabase unavailable — fall through to localStorage
      }

      if (userItems.length === 0) {
        try {
          const userLib = localStorage.getItem(USER_LIBRARY_KEY);
          if (userLib) {
            const parsed = JSON.parse(userLib);
            if (Array.isArray(parsed)) userItems = parsed;
          }
        } catch {
          // Corrupted user library — skip
        }
      }

      if (userItems.length > 0 && apiRef.current) {
        apiRef.current.updateLibrary({
          libraryItems: userItems,
          merge: true,
          openLibraryMenu: false,
        });
      }

      // Load default platform categories
      for (const catId of DEFAULT_CATEGORIES) {
        try {
          const res = await fetch(
            `/libraries/excalidraw/categories/${catId}.json`
          );
          const bundle = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allItems = bundle.libraries.flatMap((lib: any) => lib.items);

          if (allItems.length > 0 && apiRef.current) {
            apiRef.current.updateLibrary({
              libraryItems: allItems,
              merge: true,
              openLibraryMenu: false,
            });
            loaded.add(catId);
          }
        } catch {
          // Category load failed — non-critical
        }
      }

      setLoadedCategories(loaded);
    }, 1000);

    return () => clearTimeout(timer);
  }, [mod]); // Run when Excalidraw module loads

  // ── Library browser: inject items from a category ──
  const handleLoadCategory = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (categoryId: string, items: any[]) => {
      if (!apiRef.current || items.length === 0) return;

      apiRef.current.updateLibrary({
        libraryItems: items,
        merge: true,
        openLibraryMenu: false,
      });

      setLoadedCategories((prev) => new Set([...prev, categoryId]));
    },
    []
  );

  // ── Persist user library changes ──
  // When user adds/removes items in the Excalidraw library UI,
  // persist their personal items to localStorage + Supabase.
  const handleLibraryChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (libraryItems: any[]) => {
      // Only persist items that don't come from platform libraries
      // (platform items have "published" status and known IDs).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userItems = libraryItems.filter(
        (item: any) => item.status === "unpublished"
      );

      try {
        if (userItems.length > 0) {
          localStorage.setItem(USER_LIBRARY_KEY, JSON.stringify(userItems));
        } else {
          localStorage.removeItem(USER_LIBRARY_KEY);
        }
      } catch {
        // localStorage full — silently skip
      }

      // Debounced save to Supabase (3s batching)
      debouncedSaveUserData("sketch-library", { items: userItems });
    },
    []
  );

  // ── Loading state ──
  if (!mod) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Loading canvas…
          </span>
        </div>
      </div>
    );
  }

  const { Excalidraw, MainMenu } = mod;
  const excalidrawTheme = theme === "dark" ? "dark" : "light";

  return (
    <div className="excalidraw-wrapper h-full w-full" style={{ position: "relative" }}>
      <Excalidraw
        theme={excalidrawTheme}
        initialData={initialData}
        excalidrawAPI={handleExcalidrawAPI}
        onChange={handleChange}
        onLibraryChange={handleLibraryChange}
        name="DMSuite Sketch Board"
        autoFocus
        UIOptions={{
          canvasActions: {
            toggleTheme: false,
            export: { saveFileToDisk: true },
          },
        }}
      >
        {/* Custom main menu — removes external Excalidraw platform links */}
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.DefaultItems.Help />
          <MainMenu.Separator />
          <MainMenu.Item
            onSelect={() => setLibraryBrowserOpen(true)}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
          >
            Browse Libraries
          </MainMenu.Item>
        </MainMenu>
      </Excalidraw>

      {/* Library Browser Panel — floating side panel */}
      <LibraryBrowser
        open={libraryBrowserOpen}
        onClose={() => setLibraryBrowserOpen(false)}
        onLoadCategory={handleLoadCategory}
        loadedCategories={loadedCategories}
      />

      {/* Floating library button — always visible */}
      {!libraryBrowserOpen && (
        <button
          onClick={() => setLibraryBrowserOpen(true)}
          className="absolute bottom-4 right-4 z-40 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750"
          title="Browse 950+ library items across 11 categories"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Libraries
        </button>
      )}
    </div>
  );
}
