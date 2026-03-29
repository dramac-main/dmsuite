import { fabric } from "fabric";
import { useCallback, useEffect, useRef } from "react";
import { JSON_KEYS } from "./types";

interface UseLoadStateProps {
  canvas: fabric.Canvas | null;
  autoZoom: () => void;
  initialState: React.MutableRefObject<string | undefined>;
  canvasHistory: React.MutableRefObject<string[]>;
  setHistoryIndex: (index: number) => void;
}

export function useLoadState({
  canvas,
  autoZoom,
  initialState,
  canvasHistory,
  setHistoryIndex,
}: UseLoadStateProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!canvas) return;
    if (initialized.current) return;
    if (!initialState.current) return;

    const data = JSON.parse(initialState.current);

    canvas.loadFromJSON(data, () => {
      // Ensure the workspace clip exists and clipPath is set after load
      const workspace = canvas.getObjects().find((o) => o.name === "clip");
      if (workspace) {
        canvas.clipPath = workspace;
      }

      const currentState = JSON.stringify(
        canvas.toJSON(JSON_KEYS as unknown as string[])
      );
      canvasHistory.current = [currentState];
      setHistoryIndex(0);
      autoZoom();
    });

    initialized.current = true;
  }, [canvas, autoZoom, initialState, canvasHistory, setHistoryIndex]);
}
