"use client";

import { useEffect, useCallback } from "react";
import type { DesignDocument } from "@/lib/canvas-layers";
import { deleteLayer, duplicateLayer, reorderLayer } from "@/lib/canvas-layers";

/**
 * Canvas keyboard shortcuts hook — attach to any canvas-based workspace.
 * Handles: Delete, Undo/Redo, Duplicate, Select All, Deselect, Copy/Paste,
 * Bring Forward/Back, Zoom, Nudge, Layer panel toggle, Fullscreen preview, etc.
 */
export function useCanvasShortcuts(
  doc: DesignDocument,
  setDocument: (fn: (prev: DesignDocument) => DesignDocument) => void,
  options?: {
    onExport?: () => void;
    onToggleLayerPanel?: () => void;
    onToggleFullscreen?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onZoomFit?: () => void;
    onZoom100?: () => void;
  }
) {
  const selectedId = doc.selectedLayers[0] ?? null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // Delete / Backspace — delete selected layer
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        setDocument((prev) => deleteLayer(prev, selectedId));
        return;
      }

      // Ctrl+Z — Undo
      if (ctrl && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        setDocument((prev) => {
          if (prev.historyIndex <= 0) return prev;
          const newIndex = prev.historyIndex - 1;
          const snapshot = prev.history[newIndex];
          return {
            ...prev,
            layers: snapshot.layers,
            layerOrder: snapshot.layerOrder,
            selectedLayers: snapshot.selectedLayers,
            historyIndex: newIndex,
          };
        });
        return;
      }

      // Ctrl+Shift+Z — Redo
      if (ctrl && e.shiftKey && e.key === "z") {
        e.preventDefault();
        setDocument((prev) => {
          if (prev.historyIndex >= prev.history.length - 1) return prev;
          const newIndex = prev.historyIndex + 1;
          const snapshot = prev.history[newIndex];
          return {
            ...prev,
            layers: snapshot.layers,
            layerOrder: snapshot.layerOrder,
            selectedLayers: snapshot.selectedLayers,
            historyIndex: newIndex,
          };
        });
        return;
      }

      // Ctrl+D — Duplicate
      if (ctrl && e.key === "d" && selectedId) {
        e.preventDefault();
        setDocument((prev) => duplicateLayer(prev, selectedId));
        return;
      }

      // Ctrl+A — Select all
      if (ctrl && !e.shiftKey && e.key === "a") {
        e.preventDefault();
        setDocument((prev) => ({
          ...prev,
          selectedLayers: prev.layers.filter((l) => l.visible && !l.locked).map((l) => l.id),
        }));
        return;
      }

      // Ctrl+Shift+A — Deselect all
      if (ctrl && e.shiftKey && e.key === "a") {
        e.preventDefault();
        setDocument((prev) => ({ ...prev, selectedLayers: [] }));
        return;
      }

      // Ctrl+] — Bring forward
      if (ctrl && !e.shiftKey && e.key === "]" && selectedId) {
        e.preventDefault();
        setDocument((prev) => reorderLayer(prev, selectedId, "up"));
        return;
      }

      // Ctrl+[ — Send backward
      if (ctrl && !e.shiftKey && e.key === "[" && selectedId) {
        e.preventDefault();
        setDocument((prev) => reorderLayer(prev, selectedId, "down"));
        return;
      }

      // Ctrl+E — Quick export
      if (ctrl && e.key === "e") {
        e.preventDefault();
        options?.onExport?.();
        return;
      }

      // Ctrl+L — Toggle layer panel
      if (ctrl && e.key === "l") {
        e.preventDefault();
        options?.onToggleLayerPanel?.();
        return;
      }

      // F — Toggle fullscreen preview
      if (e.key === "f" && !ctrl) {
        e.preventDefault();
        options?.onToggleFullscreen?.();
        return;
      }

      // + / = — Zoom in
      if ((e.key === "+" || e.key === "=") && !ctrl) {
        e.preventDefault();
        options?.onZoomIn?.();
        return;
      }

      // - — Zoom out
      if (e.key === "-" && !ctrl) {
        e.preventDefault();
        options?.onZoomOut?.();
        return;
      }

      // Ctrl+0 — Zoom to fit
      if (ctrl && e.key === "0") {
        e.preventDefault();
        options?.onZoomFit?.();
        return;
      }

      // Ctrl+1 — Zoom to 100%
      if (ctrl && e.key === "1") {
        e.preventDefault();
        options?.onZoom100?.();
        return;
      }

      // Arrow keys — Nudge layer
      if (selectedId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const amount = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -amount : e.key === "ArrowRight" ? amount : 0;
        const dy = e.key === "ArrowUp" ? -amount : e.key === "ArrowDown" ? amount : 0;
        setDocument((prev) => ({
          ...prev,
          layers: prev.layers.map((l) =>
            prev.selectedLayers.includes(l.id)
              ? { ...l, x: l.x + dx, y: l.y + dy }
              : l
          ),
        }));
        return;
      }

      // Escape — Deselect
      if (e.key === "Escape") {
        setDocument((prev) => ({ ...prev, selectedLayers: [] }));
        return;
      }

      // Tab — Cycle through layers
      if (e.key === "Tab" && !ctrl) {
        e.preventDefault();
        setDocument((prev) => {
          const visibleLayers = prev.layers.filter((l) => l.visible && !l.locked);
          if (visibleLayers.length === 0) return prev;
          const currentIdx = visibleLayers.findIndex((l) => prev.selectedLayers.includes(l.id));
          const nextIdx = e.shiftKey
            ? (currentIdx - 1 + visibleLayers.length) % visibleLayers.length
            : (currentIdx + 1) % visibleLayers.length;
          return { ...prev, selectedLayers: [visibleLayers[nextIdx].id] };
        });
        return;
      }
    },
    [selectedId, setDocument, options]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
