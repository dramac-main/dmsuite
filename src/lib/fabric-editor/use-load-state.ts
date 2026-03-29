import { fabric } from "fabric";
import { useEffect, useRef } from "react";
import { JSON_KEYS } from "./types";

interface UseLoadStateProps {
  canvas: fabric.Canvas | null;
  autoZoom: () => void;
  initialState: React.MutableRefObject<string | undefined>;
  initialWidth: React.MutableRefObject<number | undefined>;
  initialHeight: React.MutableRefObject<number | undefined>;
  canvasHistory: React.MutableRefObject<string[]>;
  setHistoryIndex: (index: number) => void;
}

export function useLoadState({
  canvas,
  autoZoom,
  initialState,
  initialWidth,
  initialHeight,
  canvasHistory,
  setHistoryIndex,
}: UseLoadStateProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!canvas) return;
    if (initialized.current) return;
    if (!initialState.current) return;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(initialState.current);
    } catch {
      console.warn("[useLoadState] Failed to parse initial state JSON");
      initialized.current = true;
      return;
    }

    const wsWidth = initialWidth.current || 1200;
    const wsHeight = initialHeight.current || 900;
    const templateBg = (data.background as string) || "white";

    canvas.loadFromJSON(data, () => {
      // loadFromJSON replaces ALL objects — the "clip" workspace may be lost.
      // Re-create it if missing so autoZoom, clipPath, and clipping work.
      let workspace = canvas.getObjects().find((o) => o.name === "clip");
      if (!workspace) {
        workspace = new fabric.Rect({
          width: wsWidth,
          height: wsHeight,
          name: "clip",
          fill: templateBg,
          selectable: false,
          hasControls: false,
          shadow: new fabric.Shadow({
            color: "rgba(0,0,0,0.8)",
            blur: 5,
          }),
        });
        canvas.add(workspace);
        canvas.centerObject(workspace);
        workspace.sendToBack();
      }
      canvas.clipPath = workspace;
      canvas.backgroundColor = "";

      const currentState = JSON.stringify(
        canvas.toJSON(JSON_KEYS as unknown as string[])
      );
      canvasHistory.current = [currentState];
      setHistoryIndex(0);
      autoZoom();
    });

    initialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, autoZoom]);
}
