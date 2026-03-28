import { fabric } from "fabric";
import { useCallback, useRef, useState } from "react";
import { JSON_KEYS } from "./types";

interface UseHistoryProps {
  canvas: fabric.Canvas | null;
  saveCallback?: (values: { json: string; height: number; width: number }) => void;
}

export function useHistory({ canvas, saveCallback }: UseHistoryProps) {
  const canvasHistory = useRef<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const skipSaveRef = useRef(false);

  const canUndo = useCallback(() => {
    return historyIndex > 0;
  }, [historyIndex]);

  const canRedo = useCallback(() => {
    return historyIndex < canvasHistory.current.length - 1;
  }, [historyIndex]);

  const save = useCallback(
    (skip = false) => {
      if (!canvas) return;
      if (skipSaveRef.current) return;

      const currentState = JSON.stringify(canvas.toJSON(JSON_KEYS as unknown as string[]));
      const workspace = canvas.getObjects().find((o) => o.name === "clip");

      if (!skip && !skipSaveRef.current) {
        // Trim any future states (we branched)
        canvasHistory.current = canvasHistory.current.slice(0, historyIndex + 1);
        canvasHistory.current.push(currentState);
        setHistoryIndex(canvasHistory.current.length - 1);
      }

      const canvasWidth = (workspace?.width as number) || canvas.getWidth();
      const canvasHeight = (workspace?.height as number) || canvas.getHeight();

      saveCallback?.({
        json: currentState,
        width: canvasWidth,
        height: canvasHeight,
      });
    },
    [canvas, historyIndex, saveCallback]
  );

  const undo = useCallback(() => {
    if (!canvas) return;
    if (historyIndex <= 0) return;

    skipSaveRef.current = true;
    const prevIndex = historyIndex - 1;
    const prevState = canvasHistory.current[prevIndex];

    canvas.loadFromJSON(JSON.parse(prevState), () => {
      canvas.renderAll();
      setHistoryIndex(prevIndex);
      skipSaveRef.current = false;
    });
  }, [canvas, historyIndex]);

  const redo = useCallback(() => {
    if (!canvas) return;
    if (historyIndex >= canvasHistory.current.length - 1) return;

    skipSaveRef.current = true;
    const nextIndex = historyIndex + 1;
    const nextState = canvasHistory.current[nextIndex];

    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll();
      setHistoryIndex(nextIndex);
      skipSaveRef.current = false;
    });
  }, [canvas, historyIndex]);

  return {
    save,
    canUndo,
    canRedo,
    undo,
    redo,
    canvasHistory,
    setHistoryIndex,
  };
}
