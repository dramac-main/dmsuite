"use client";

// Excalidraw CSS — loaded via a local wrapper that uses a direct filesystem
// path to bypass the package exports map (which only has "development" /
// "production" conditions that Turbopack can't resolve for CSS).
import "./excalidraw-theme.css";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createSketchBoardV2Manifest } from "@/lib/chiko/manifests/sketch-board-v2";

// Excalidraw types — imported separately for type-checking
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

/**
 * SketchBoardV2Workspace — Excalidraw-powered infinite canvas.
 *
 * DMSuite integration points:
 *   - Dark/light theme sync via `theme` prop
 *   - Workspace events (dirty, progress, save)
 *   - Chiko AI manifest for 20+ actions
 *   - localStorage-based scene persistence
 */

const PERSISTENCE_KEY = "dmsuite-sketch-board-v2";

export default function SketchBoardV2Workspace() {
  const { theme } = useTheme();
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const dirtyCountRef = useRef(0);
  const hasDispatchedRef = useRef(false);
  const [ExcalidrawComp, setExcalidrawComp] = useState<React.ComponentType<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  > | null>(null);

  // ── Chiko AI integration ──
  useChikoActions(
    useCallback(() => createSketchBoardV2Manifest(apiRef), [])
  );

  // ── Dynamically import Excalidraw (client-only, avoid SSR) ──
  useEffect(() => {
    let cancelled = false;
    import("@excalidraw/excalidraw").then((mod) => {
      if (cancelled) return;
      setExcalidrawComp(() => mod.Excalidraw);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Fire workspace events ──
  const dispatchDirty = useCallback(() => {
    dirtyCountRef.current++;
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
  }, []);

  // ── onChange: persist scene to localStorage + dispatch dirty ──
  const handleChange = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (elements: readonly any[], appState: Record<string, unknown>) => {
      dispatchDirty();

      // Persist scene (debounced via React batching)
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
    },
    [dispatchDirty]
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
    },
    []
  );

  // ── Load initial data from localStorage ──
  const getInitialData = useCallback(() => {
    try {
      const raw = localStorage.getItem(PERSISTENCE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          elements: parsed.elements || [],
          appState: {
            ...parsed.appState,
          },
        };
      }
    } catch {
      // Corrupted data — start fresh
    }
    return undefined;
  }, []);

  // ── Loading state ──
  if (!ExcalidrawComp) {
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

  const Excalidraw = ExcalidrawComp;
  const excalidrawTheme = theme === "dark" ? "dark" : "light";

  return (
    <div className="excalidraw-wrapper h-full w-full" style={{ position: "relative" }}>
      <Excalidraw
        theme={excalidrawTheme}
        initialData={getInitialData()}
        excalidrawAPI={handleExcalidrawAPI}
        onChange={handleChange}
        name="DMSuite Sketch Board"
        autoFocus
        UIOptions={{
          canvasActions: {
            toggleTheme: false,
            export: { saveFileToDisk: true },
          },
        }}
      />
    </div>
  );
}
