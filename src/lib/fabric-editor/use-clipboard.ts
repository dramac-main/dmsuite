import { fabric } from "fabric";
import { useCallback, useRef } from "react";

interface UseClipboardProps {
  canvas: fabric.Canvas | null;
}

export function useClipboard({ canvas }: UseClipboardProps) {
  const clipboardRef = useRef<fabric.Object | null>(null);

  const copy = useCallback(() => {
    if (!canvas) return;

    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    activeObject.clone((cloned: fabric.Object) => {
      clipboardRef.current = cloned;
    });
  }, [canvas]);

  const paste = useCallback(() => {
    if (!canvas) return;
    if (!clipboardRef.current) return;

    clipboardRef.current.clone((cloned: fabric.Object) => {
      canvas.discardActiveObject();

      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
        evented: true,
      });

      if (cloned.type === "activeSelection") {
        cloned.canvas = canvas;
        (cloned as fabric.ActiveSelection).forEachObject((obj: fabric.Object) => {
          canvas.add(obj);
        });
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }

      clipboardRef.current = cloned;
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    });
  }, [canvas]);

  return { copy, paste };
}
