import { fabric } from "fabric";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ITextboxOptions } from "fabric/fabric-impl";

import {
  type Editor,
  type BuildEditorProps,
  type EditorHookProps,
  FILL_COLOR,
  STROKE_COLOR,
  STROKE_WIDTH,
  STROKE_DASH_ARRAY,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  CIRCLE_OPTIONS,
  RECTANGLE_OPTIONS,
  DIAMOND_OPTIONS,
  TRIANGLE_OPTIONS,
  TEXT_OPTIONS,
  JSON_KEYS,
} from "./types";
import { useAutoResize } from "./use-auto-resize";
import { useCanvasEvents } from "./use-canvas-events";
import { useClipboard } from "./use-clipboard";
import { useHistory } from "./use-history";
import { useHotkeys } from "./use-hotkeys";
import { useWindowEvents } from "./use-window-events";
import { useLoadState } from "./use-load-state";
import {
  createFilter,
  downloadFile,
  isTextType,
  transformText,
  generateObjectName,
} from "./utils";

/* ─── Build the editor API from a live canvas ─────────────────────────────── */
function buildEditor({
  save,
  undo,
  redo,
  canRedo,
  canUndo,
  autoZoom,
  copy,
  paste,
  canvas,
  fillColor,
  fontFamily,
  setFontFamily,
  setFillColor,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  selectedObjects,
  strokeDashArray,
  setStrokeDashArray,
}: BuildEditorProps): Editor {
  const getWorkspace = () =>
    canvas.getObjects().find((o) => o.name === "clip");

  const generateSaveOptions = () => {
    const ws = getWorkspace() as fabric.Rect;
    return {
      name: "Image",
      format: "png" as const,
      quality: 1,
      width: ws?.width ?? canvas.getWidth(),
      height: ws?.height ?? canvas.getHeight(),
      left: ws?.left ?? 0,
      top: ws?.top ?? 0,
    };
  };

  const center = (object: fabric.Object) => {
    const ws = getWorkspace();
    const c = ws?.getCenterPoint();
    if (!c) return;
    // @ts-expect-error — fabric internal
    canvas._centerObject(object, c);
  };

  const addToCanvas = (object: fabric.Object) => {
    center(object);
    canvas.add(object);
    canvas.setActiveObject(object);
  };

  return {
    // ── Export ──────────────────────────────────────────────────────────
    savePng: () => {
      const opts = generateSaveOptions();
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL(opts);
      downloadFile(dataUrl, "png");
      autoZoom();
    },
    saveJpg: () => {
      const opts = generateSaveOptions();
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL({ ...opts, format: "jpeg" });
      downloadFile(dataUrl, "jpg");
      autoZoom();
    },
    saveSvg: () => {
      const opts = generateSaveOptions();
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL(opts);
      downloadFile(dataUrl, "svg");
      autoZoom();
    },
    saveJson: async () => {
      const data = canvas.toJSON(JSON_KEYS as unknown as string[]);
      await transformText(data.objects);
      const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, "\t")
      )}`;
      downloadFile(fileString, "json");
    },
    loadJson: (json: string) => {
      const data = JSON.parse(json);
      canvas.loadFromJSON(data, () => {
        autoZoom();
      });
    },

    // ── History ────────────────────────────────────────────────────────
    onUndo: () => undo(),
    onRedo: () => redo(),
    canUndo,
    canRedo,

    // ── Viewport ───────────────────────────────────────────────────────
    autoZoom,
    zoomIn: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio += 0.05;
      const c = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(c.left, c.top),
        Math.min(zoomRatio, 1)
      );
    },
    zoomOut: () => {
      let zoomRatio = canvas.getZoom();
      zoomRatio -= 0.05;
      const c = canvas.getCenter();
      canvas.zoomToPoint(
        new fabric.Point(c.left, c.top),
        Math.max(zoomRatio, 0.2)
      );
    },

    // ── Canvas settings ────────────────────────────────────────────────
    getWorkspace,
    changeBackground: (value: string) => {
      const ws = getWorkspace();
      ws?.set({ fill: value });
      canvas.renderAll();
      save();
    },
    changeSize: (value: { width: number; height: number }) => {
      const ws = getWorkspace();
      ws?.set(value);
      autoZoom();
      save();
    },

    // ── Drawing ────────────────────────────────────────────────────────
    enableDrawingMode: () => {
      canvas.discardActiveObject();
      canvas.renderAll();
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = strokeColor;
    },
    disableDrawingMode: () => {
      canvas.isDrawingMode = false;
    },

    // ── Clipboard ──────────────────────────────────────────────────────
    onCopy: () => copy(),
    onPaste: () => paste(),

    // ── Images ─────────────────────────────────────────────────────────
    changeImageFilter: (value: string) => {
      canvas.getActiveObjects().forEach((object) => {
        if (object.type === "image") {
          const img = object as fabric.Image;
          const effect = createFilter(value);
          img.filters = effect ? [effect] : [];
          img.applyFilters();
          canvas.renderAll();
        }
      });
    },
    addImage: (value: string) => {
      fabric.Image.fromURL(
        value,
        (image) => {
          const ws = getWorkspace();
          image.scaleToWidth(ws?.width ? (ws.width as number) * 0.5 : 400);
          image.set({ name: generateObjectName("image") });
          addToCanvas(image);
        },
        { crossOrigin: "anonymous" }
      );
    },

    // ── Object management ──────────────────────────────────────────────
    delete: () => {
      canvas.getActiveObjects().forEach((o) => {
        if (o.name !== "clip") canvas.remove(o);
      });
      canvas.discardActiveObject();
      canvas.renderAll();
    },
    bringForward: () => {
      canvas.getActiveObjects().forEach((o) => canvas.bringForward(o));
      canvas.renderAll();
      getWorkspace()?.sendToBack();
    },
    sendBackwards: () => {
      canvas.getActiveObjects().forEach((o) => canvas.sendBackwards(o));
      canvas.renderAll();
      getWorkspace()?.sendToBack();
    },

    // ── Text ───────────────────────────────────────────────────────────
    addText: (value: string, options?: ITextboxOptions) => {
      const object = new fabric.Textbox(value, {
        ...TEXT_OPTIONS,
        fill: fillColor,
        name: generateObjectName("text"),
        ...options,
      });
      addToCanvas(object);
    },
    changeFontSize: (value: number) => {
      canvas.getActiveObjects().forEach((o) => {
        if (isTextType(o.type)) {
          (o as fabric.Textbox).set({ fontSize: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontSize: () => {
      const sel = selectedObjects[0];
      if (!sel) return FONT_SIZE;
      return (sel as fabric.Textbox).fontSize || FONT_SIZE;
    },
    changeTextAlign: (value: string) => {
      canvas.getActiveObjects().forEach((o) => {
        if (isTextType(o.type)) {
          (o as fabric.Textbox).set({ textAlign: value });
        }
      });
      canvas.renderAll();
    },
    getActiveTextAlign: () => {
      const sel = selectedObjects[0];
      if (!sel) return "left";
      return (sel as fabric.Textbox).textAlign || "left";
    },
    changeFontUnderline: (value: boolean) => {
      canvas.getActiveObjects().forEach((o) => {
        if (isTextType(o.type)) {
          (o as fabric.Textbox).set({ underline: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontUnderline: () => {
      const sel = selectedObjects[0];
      if (!sel) return false;
      return (sel as fabric.Textbox).underline || false;
    },
    changeFontLinethrough: (value: boolean) => {
      canvas.getActiveObjects().forEach((o) => {
        if (isTextType(o.type)) {
          (o as fabric.Textbox).set({ linethrough: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontLinethrough: () => {
      const sel = selectedObjects[0];
      if (!sel) return false;
      return (sel as fabric.Textbox).linethrough || false;
    },
    changeFontStyle: (value: string) => {
      canvas.getActiveObjects().forEach((o) => {
        if (isTextType(o.type)) {
          (o as fabric.Textbox).set({ fontStyle: value as "" | "normal" | "italic" | "oblique" });
        }
      });
      canvas.renderAll();
    },
    getActiveFontStyle: () => {
      const sel = selectedObjects[0];
      if (!sel) return "normal";
      return (sel as fabric.Textbox).fontStyle || "normal";
    },
    changeFontWeight: (value: number) => {
      canvas.getActiveObjects().forEach((o) => {
        if (isTextType(o.type)) {
          (o as fabric.Textbox).set({ fontWeight: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontWeight: () => {
      const sel = selectedObjects[0];
      if (!sel) return FONT_WEIGHT;
      return ((sel as fabric.Textbox).fontWeight as number) || FONT_WEIGHT;
    },
    changeFontFamily: (value: string) => {
      setFontFamily(value);
      canvas.getActiveObjects().forEach((o) => {
        if (isTextType(o.type)) {
          (o as fabric.Textbox).set({ fontFamily: value });
        }
      });
      canvas.renderAll();
    },
    getActiveFontFamily: () => {
      const sel = selectedObjects[0];
      if (!sel) return fontFamily;
      return (sel as fabric.Textbox).fontFamily || fontFamily;
    },

    // ── Opacity ────────────────────────────────────────────────────────
    changeOpacity: (value: number) => {
      canvas.getActiveObjects().forEach((o) => o.set({ opacity: value }));
      canvas.renderAll();
    },
    getActiveOpacity: () => {
      const sel = selectedObjects[0];
      return sel?.opacity ?? 1;
    },

    // ── Fill ───────────────────────────────────────────────────────────
    changeFillColor: (value: string) => {
      setFillColor(value);
      canvas.getActiveObjects().forEach((o) => o.set({ fill: value }));
      canvas.renderAll();
    },
    getActiveFillColor: () => {
      const sel = selectedObjects[0];
      if (!sel) return fillColor;
      const v = sel.get("fill");
      return (typeof v === "string" ? v : fillColor);
    },

    // ── Stroke ─────────────────────────────────────────────────────────
    changeStrokeColor: (value: string) => {
      setStrokeColor(value);
      canvas.getActiveObjects().forEach((o) => {
        if (isTextType(o.type)) {
          o.set({ fill: value });
        } else {
          o.set({ stroke: value });
        }
      });
      if (canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = value;
      canvas.renderAll();
    },
    getActiveStrokeColor: () => {
      const sel = selectedObjects[0];
      if (!sel) return strokeColor;
      return (sel.get("stroke") as string) || strokeColor;
    },
    changeStrokeWidth: (value: number) => {
      setStrokeWidth(value);
      canvas.getActiveObjects().forEach((o) => o.set({ strokeWidth: value }));
      if (canvas.freeDrawingBrush) canvas.freeDrawingBrush.width = value;
      canvas.renderAll();
    },
    getActiveStrokeWidth: () => {
      const sel = selectedObjects[0];
      if (!sel) return strokeWidth;
      return sel.get("strokeWidth") || strokeWidth;
    },
    changeStrokeDashArray: (value: number[]) => {
      setStrokeDashArray(value);
      canvas
        .getActiveObjects()
        .forEach((o) => o.set({ strokeDashArray: value }));
      canvas.renderAll();
    },
    getActiveStrokeDashArray: () => {
      const sel = selectedObjects[0];
      if (!sel) return strokeDashArray;
      return (sel.get("strokeDashArray") as number[]) || strokeDashArray;
    },

    // ── Shapes ─────────────────────────────────────────────────────────
    addCircle: () => {
      addToCanvas(
        new fabric.Circle({
          ...CIRCLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          strokeDashArray,
          name: generateObjectName("circle"),
        })
      );
    },
    addSoftRectangle: () => {
      addToCanvas(
        new fabric.Rect({
          ...RECTANGLE_OPTIONS,
          rx: 50,
          ry: 50,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          strokeDashArray,
          name: generateObjectName("soft-rect"),
        })
      );
    },
    addRectangle: () => {
      addToCanvas(
        new fabric.Rect({
          ...RECTANGLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          strokeDashArray,
          name: generateObjectName("rect"),
        })
      );
    },
    addTriangle: () => {
      addToCanvas(
        new fabric.Triangle({
          ...TRIANGLE_OPTIONS,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth,
          strokeDashArray,
          name: generateObjectName("triangle"),
        })
      );
    },
    addInverseTriangle: () => {
      const H = TRIANGLE_OPTIONS.height || 400;
      const W = TRIANGLE_OPTIONS.width || 400;
      addToCanvas(
        new fabric.Polygon(
          [
            { x: 0, y: 0 },
            { x: W, y: 0 },
            { x: W / 2, y: H },
          ],
          {
            ...TRIANGLE_OPTIONS,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
            strokeDashArray,
            name: generateObjectName("inv-triangle"),
          }
        )
      );
    },
    addDiamond: () => {
      const H = DIAMOND_OPTIONS.height || 600;
      const W = DIAMOND_OPTIONS.width || 600;
      addToCanvas(
        new fabric.Polygon(
          [
            { x: W / 2, y: 0 },
            { x: W, y: H / 2 },
            { x: W / 2, y: H },
            { x: 0, y: H / 2 },
          ],
          {
            ...DIAMOND_OPTIONS,
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth,
            strokeDashArray,
            name: generateObjectName("diamond"),
          }
        )
      );
    },

    // ── Direct access ──────────────────────────────────────────────────
    canvas,
    selectedObjects,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* useEditor — the main hook                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
export function useEditor({
  defaultState,
  defaultWidth,
  defaultHeight,
  clearSelectionCallback,
  saveCallback,
}: EditorHookProps) {
  const initialState = useRef(defaultState);
  const initialWidth = useRef(defaultWidth);
  const initialHeight = useRef(defaultHeight);

  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);

  const [fontFamily, setFontFamily] = useState(FONT_FAMILY);
  const [fillColor, setFillColor] = useState(FILL_COLOR);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);
  const [strokeDashArray, setStrokeDashArray] =
    useState<number[]>(STROKE_DASH_ARRAY);

  useWindowEvents();

  const { save, canRedo, canUndo, undo, redo, canvasHistory, setHistoryIndex } =
    useHistory({ canvas, saveCallback });

  const { copy, paste } = useClipboard({ canvas });

  const { autoZoom } = useAutoResize({ canvas, container });

  useCanvasEvents({
    save,
    canvas,
    setSelectedObjects,
    clearSelectionCallback,
  });

  useHotkeys({ canvas, undo, redo, copy, paste, save });

  useLoadState({
    canvas,
    autoZoom,
    initialState,
    canvasHistory,
    setHistoryIndex,
  });

  const editor = useMemo(() => {
    if (canvas) {
      return buildEditor({
        save,
        undo,
        redo,
        canUndo,
        canRedo,
        autoZoom,
        copy,
        paste,
        canvas,
        fillColor,
        strokeWidth,
        strokeColor,
        setFillColor,
        setStrokeColor,
        setStrokeWidth,
        strokeDashArray,
        selectedObjects,
        setStrokeDashArray,
        fontFamily,
        setFontFamily,
      });
    }
    return undefined;
  }, [
    canRedo,
    canUndo,
    undo,
    redo,
    save,
    autoZoom,
    copy,
    paste,
    canvas,
    fillColor,
    strokeWidth,
    strokeColor,
    selectedObjects,
    strokeDashArray,
    fontFamily,
  ]);

  /* ── init — called once from the Editor component ──────────────────────── */
  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      // Global Fabric object styling (selection handles)
      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#8b5cf6",       // primary – Electric Violet
        borderScaleFactor: 1.5,
        transparentCorners: false,
        borderOpacityWhenMoving: 1,
        cornerStrokeColor: "#8b5cf6",
      });

      const initialWorkspace = new fabric.Rect({
        width: initialWidth.current || 1200,
        height: initialHeight.current || 900,
        name: "clip",
        fill: "white",
        selectable: false,
        hasControls: false,
        shadow: new fabric.Shadow({
          color: "rgba(0,0,0,0.8)",
          blur: 5,
        }),
      });

      initialCanvas.setWidth(initialContainer.offsetWidth);
      initialCanvas.setHeight(initialContainer.offsetHeight);

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);
      initialCanvas.clipPath = initialWorkspace;

      setCanvas(initialCanvas);
      setContainer(initialContainer);

      const currentState = JSON.stringify(
        initialCanvas.toJSON(JSON_KEYS as unknown as string[])
      );
      canvasHistory.current = [currentState];
      setHistoryIndex(0);
    },
    [canvasHistory, setHistoryIndex]
  );

  return { init, editor };
}
