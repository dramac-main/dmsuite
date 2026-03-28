import { fabric } from "fabric";
import { useEffect } from "react";

interface UseCanvasEventsProps {
  save: () => void;
  canvas: fabric.Canvas | null;
  setSelectedObjects: (objects: fabric.Object[]) => void;
  clearSelectionCallback?: () => void;
}

export function useCanvasEvents({
  save,
  canvas,
  setSelectedObjects,
  clearSelectionCallback,
}: UseCanvasEventsProps) {
  useEffect(() => {
    if (!canvas) return;

    const handleSelectionCreated = (e: fabric.IEvent) => {
      const selection = e.selected || [];
      setSelectedObjects(selection);
    };

    const handleSelectionUpdated = (e: fabric.IEvent) => {
      const selection = e.selected || [];
      setSelectedObjects(selection);
    };

    const handleSelectionCleared = () => {
      setSelectedObjects([]);
      clearSelectionCallback?.();
    };

    const handleObjectModified = () => {
      save();
    };

    const handleObjectAdded = () => {
      save();
    };

    canvas.on("selection:created", handleSelectionCreated);
    canvas.on("selection:updated", handleSelectionUpdated);
    canvas.on("selection:cleared", handleSelectionCleared);
    canvas.on("object:modified", handleObjectModified);
    canvas.on("object:added", handleObjectAdded);

    return () => {
      canvas.off("selection:created", handleSelectionCreated);
      canvas.off("selection:updated", handleSelectionUpdated);
      canvas.off("selection:cleared", handleSelectionCleared);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("object:added", handleObjectAdded);
    };
  }, [canvas, save, setSelectedObjects, clearSelectionCallback]);
}
