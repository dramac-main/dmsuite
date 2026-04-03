"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createSketchBoardV2Manifest } from "@/lib/chiko/manifests/sketch-board-v2";

// tldraw types imported for snapshot/editor access
import type { Editor, TLEditorSnapshot } from "tldraw";

// Lazily import tldraw to avoid SSR issues with Next.js
let TldrawComponent: typeof import("tldraw").Tldraw | null = null;
let getSnapshotFn: typeof import("tldraw").getSnapshot | null = null;
let loadSnapshotFn: typeof import("tldraw").loadSnapshot | null = null;

/**
 * SketchBoardV2Workspace — tldraw-powered infinite canvas whiteboard.
 *
 * This is the Fast-Path port: the full tldraw SDK is embedded as a
 * React component. We only wire DMSuite integration points on top:
 *   - Dark/light theme sync
 *   - Workspace events (dirty, progress, save)
 *   - Chiko AI manifest
 *   - Project persistence via snapshot API
 */
export default function SketchBoardV2Workspace() {
  const { theme } = useTheme();
  const editorRef = useRef<Editor | null>(null);
  const dirtyCountRef = useRef(0);
  const hasDispatchedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [TldrawLoaded, setTldrawLoaded] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  // ── Chiko AI integration ──
  useChikoActions(
    useCallback(() => createSketchBoardV2Manifest(editorRef), [])
  );

  // ── Dynamically import tldraw (client-only) ──
  useEffect(() => {
    let cancelled = false;
    import("tldraw").then((mod) => {
      if (cancelled) return;
      TldrawComponent = mod.Tldraw as unknown as typeof import("tldraw").Tldraw;
      getSnapshotFn = mod.getSnapshot;
      loadSnapshotFn = mod.loadSnapshot;
      setTldrawLoaded(() => mod.Tldraw as unknown as React.ComponentType<Record<string, unknown>>);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Sync DMSuite theme → tldraw editor ──
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const tldrawTheme = theme === "dark" ? "dark" : "light";
    editor.user.updateUserPreferences({ colorScheme: tldrawTheme });
  }, [theme, ready]);

  // ── Fire workspace events ──
  const dispatchDirty = useCallback(() => {
    dirtyCountRef.current++;
    window.dispatchEvent(new CustomEvent("workspace:dirty"));

    if (dirtyCountRef.current === 1) {
      window.dispatchEvent(
        new CustomEvent("workspace:progress", { detail: { milestone: "input" } })
      );
    }
    if (dirtyCountRef.current === 5) {
      window.dispatchEvent(
        new CustomEvent("workspace:progress", { detail: { milestone: "content" } })
      );
    }
  }, []);

  // ── onMount: capture editor instance and wire change listener ──
  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;

      // Sync initial theme
      const tldrawTheme = theme === "dark" ? "dark" : "light";
      editor.user.updateUserPreferences({ colorScheme: tldrawTheme });

      // Listen for store changes to dispatch workspace:dirty
      editor.store.listen(() => {
        dispatchDirty();
      }, { scope: "document", source: "user" });

      setReady(true);

      // Initial progress signal
      if (!hasDispatchedRef.current) {
        hasDispatchedRef.current = true;
        window.dispatchEvent(
          new CustomEvent("workspace:progress", { detail: { progress: 70 } })
        );
      }
    },
    [theme, dispatchDirty]
  );

  // ── Loading state ──
  if (!TldrawLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Loading whiteboard…
          </span>
        </div>
      </div>
    );
  }

  const Tldraw = TldrawLoaded;

  return (
    <div className="h-full w-full" style={{ position: "relative" }}>
      <Tldraw
        persistenceKey="dmsuite-sketch-board-v2"
        onMount={handleMount}
        inferDarkMode={false}
      />
    </div>
  );
}

// ── Public helpers for store adapter & Chiko manifest ──

/** Get the tldraw editor snapshot for project persistence */
export function getTldrawSnapshot(editor: Editor | null): TLEditorSnapshot | null {
  if (!editor || !getSnapshotFn) return null;
  return getSnapshotFn(editor.store);
}

/** Load a tldraw snapshot into the editor */
export function setTldrawSnapshot(
  editor: Editor | null,
  snapshot: TLEditorSnapshot
): void {
  if (!editor || !loadSnapshotFn) return;
  loadSnapshotFn(editor.store, snapshot);
}
