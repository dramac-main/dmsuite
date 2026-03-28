import { fabric } from "fabric";
import { useEffect } from "react";

interface UseHotkeysProps {
  canvas: fabric.Canvas | null;
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
  save: (skip?: boolean) => void;
}

export function useHotkeys({ canvas, undo, redo, copy, paste, save }: UseHotkeysProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl+Z — Undo
      if (isCtrlOrMeta && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z — Redo
      if (
        (isCtrlOrMeta && e.key === "y") ||
        (isCtrlOrMeta && e.key === "z" && e.shiftKey)
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+C — Copy
      if (isCtrlOrMeta && e.key === "c") {
        e.preventDefault();
        copy();
        return;
      }

      // Ctrl+V — Paste
      if (isCtrlOrMeta && e.key === "v") {
        e.preventDefault();
        paste();
        return;
      }

      // Ctrl+S — Save
      if (isCtrlOrMeta && e.key === "s") {
        e.preventDefault();
        save();
        return;
      }

      // Ctrl+A — Select all
      if (isCtrlOrMeta && e.key === "a") {
        if (!canvas) return;
        e.preventDefault();
        canvas.discardActiveObject();
        const allObjects = canvas
          .getObjects()
          .filter((o) => o.name !== "clip" && o.selectable !== false);
        canvas.setActiveObject(
          new fabric.ActiveSelection(allObjects, { canvas })
        );
        canvas.renderAll();
        return;
      }

      // Delete / Backspace — Delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!canvas) return;
        const activeObj = canvas.getActiveObject();
        // Don't delete if we're editing text inline
        if (activeObj && (activeObj as fabric.Textbox).isEditing) return;

        canvas.getActiveObjects().forEach((obj) => {
          if (obj.name !== "clip") {
            canvas.remove(obj);
          }
        });
        canvas.discardActiveObject();
        canvas.renderAll();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canvas, undo, redo, copy, paste, save]);
}
