import { fabric } from "fabric";
import { useCallback, useMemo, useRef, useState } from "react";
import type { ITextboxOptions } from "fabric/fabric-impl";

import { ensureFontReady } from "./font-loader";
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

/* ─── Font loading helper ─────────────────────────────────────────────────── */

/** Extract unique font families from canvas objects and load them via Google Fonts. */
function loadCanvasFonts(canvas: fabric.Canvas): void {
  const families = new Set<string>();
  for (const obj of canvas.getObjects()) {
    if (isTextType(obj.type)) {
      const ff = (obj as fabric.Textbox).fontFamily;
      if (ff) families.add(ff);
    }
  }
  for (const family of families) {
    ensureFontReady(family).then(() => canvas.requestRenderAll());
  }
}

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
      const prevTransform = canvas.viewportTransform?.slice() ?? [1, 0, 0, 1, 0, 0];
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL(opts);
      downloadFile(dataUrl, "png");
      canvas.setViewportTransform(prevTransform as number[]);
    },
    saveJpg: () => {
      const opts = generateSaveOptions();
      const prevTransform = canvas.viewportTransform?.slice() ?? [1, 0, 0, 1, 0, 0];
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const dataUrl = canvas.toDataURL({ ...opts, format: "jpeg" });
      downloadFile(dataUrl, "jpg");
      canvas.setViewportTransform(prevTransform as number[]);
    },
    saveSvg: () => {
      const ws = getWorkspace() as fabric.Rect;
      const prevTransform = canvas.viewportTransform?.slice() ?? [1, 0, 0, 1, 0, 0];
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      const svgString = canvas.toSVG({
        viewBox: {
          x: ws?.left ?? 0,
          y: ws?.top ?? 0,
          width: ws?.width ?? canvas.getWidth(),
          height: ws?.height ?? canvas.getHeight(),
        },
        width: `${ws?.width ?? canvas.getWidth()}px`,
        height: `${ws?.height ?? canvas.getHeight()}px`,
      });
      canvas.setViewportTransform(prevTransform as number[]);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      downloadFile(url, "svg");
      URL.revokeObjectURL(url);
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
      console.log("[FabricEditor] loadJson called, json length:", json?.length ?? 0);
      if (!json || json.length === 0) {
        console.warn("[FabricEditor] loadJson: empty JSON string, aborting");
        return;
      }
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(json);
      } catch (e) {
        console.warn("[FabricEditor] loadJson: failed to parse JSON", e);
        return;
      }
      console.log("[FabricEditor] loadJson parsed OK, objects:", (data.objects as unknown[])?.length ?? 0);

      // Capture workspace dimensions before loadFromJSON blows them away
      const currentWs = getWorkspace() as fabric.Rect | undefined;
      const wsWidth = (currentWs?.width as number) || canvas.getWidth();
      const wsHeight = (currentWs?.height as number) || canvas.getHeight();
      const templateBg = (typeof data.background === "string" ? data.background : null) || (typeof currentWs?.fill === "string" ? currentWs.fill : "white");

      console.log("[FabricEditor] calling canvas.loadFromJSON...");
      try {
        canvas.loadFromJSON(data, () => {
          console.log("[FabricEditor] loadFromJSON callback fired, objects on canvas:", canvas.getObjects().length);
          // loadFromJSON replaces ALL objects — the "clip" workspace is lost.
          // Re-create it so autoZoom, clipPath, and the visible workspace work.
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
          // Clear canvas.backgroundColor — our workspace clip fill IS the background.
          // Without this, the entire canvas area shows the template bg color instead of
          // just the workspace rect (the dark editor background around it is lost).
          canvas.backgroundColor = "";
          canvas.renderAll();
          autoZoom();
          // Load any Google Fonts used in the template
          loadCanvasFonts(canvas);
        });
      } catch (err) {
        console.error("[FabricEditor] loadFromJSON threw error:", err);
      }
    },
    loadSvg: (svgString: string) => {
      console.log("[FabricEditor] loadSvg called, string length:", svgString?.length ?? 0);
      fabric.loadSVGFromString(svgString, (objects, options) => {
        console.log("[FabricEditor] loadSVGFromString callback:", objects?.length ?? 0, "objects parsed");
        if (!objects || objects.length === 0) {
          console.warn("[FabricEditor] loadSvg: no objects parsed from SVG");
          return;
        }

        // Determine SVG dimensions from the parsed options
        const svgW = options.width ? parseFloat(String(options.width)) : 0;
        const svgH = options.height ? parseFloat(String(options.height)) : 0;

        // Get workspace dimensions
        const currentWs = getWorkspace() as fabric.Rect | undefined;
        const wsWidth = (currentWs?.width as number) || canvas.getWidth();
        const wsHeight = (currentWs?.height as number) || canvas.getHeight();

        // Remove everything except workspace clip
        const toRemove = canvas.getObjects().filter((o) => o.name !== "clip");
        toRemove.forEach((o) => canvas.remove(o));

        // Ensure workspace clip exists
        let workspace = canvas.getObjects().find((o) => o.name === "clip") as fabric.Rect | undefined;
        if (!workspace) {
          workspace = new fabric.Rect({
            width: wsWidth,
            height: wsHeight,
            name: "clip",
            fill: "white",
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

        // Calculate scale to fit SVG within workspace
        let scale = 1;
        if (svgW > 0 && svgH > 0) {
          const scaleX = wsWidth / svgW;
          const scaleY = wsHeight / svgH;
          scale = Math.min(scaleX, scaleY);
        }

        // Add each SVG element as an individual Fabric object (editable)
        const wsLeft = (workspace.left as number) || 0;
        const wsTop = (workspace.top as number) || 0;

        // Calculate offset to center the SVG content within the workspace
        const scaledW = svgW * scale;
        const scaledH = svgH * scale;
        const offsetX = wsLeft + (wsWidth - scaledW) / 2;
        const offsetY = wsTop + (wsHeight - scaledH) / 2;

        for (const obj of objects) {
          if (!obj) continue;
          // Scale and reposition each object relative to workspace
          const objLeft = ((obj.left as number) || 0) * scale + offsetX;
          const objTop = ((obj.top as number) || 0) * scale + offsetY;
          const objScaleX = ((obj.scaleX as number) || 1) * scale;
          const objScaleY = ((obj.scaleY as number) || 1) * scale;

          obj.set({
            left: objLeft,
            top: objTop,
            scaleX: objScaleX,
            scaleY: objScaleY,
            name: obj.name || generateObjectName(obj.type || "svg-element"),
          });
          canvas.add(obj);
        }

        canvas.backgroundColor = "";
        canvas.renderAll();
        autoZoom();
        loadCanvasFonts(canvas);
      });
    },
    addSvgElements: (svgString: string) => {
      fabric.loadSVGFromString(svgString, (objects, options) => {
        if (!objects || objects.length === 0) {
          console.warn("[FabricEditor] addSvgElements: no objects parsed");
          return;
        }
        const ws = getWorkspace();
        const wsW = (ws?.width as number) || canvas.getWidth();

        // Group SVG objects and add to canvas center
        const group = fabric.util.groupSVGElements(objects, options);
        group.set({ name: generateObjectName("svg-group") });
        group.scaleToWidth(wsW * 0.5);
        addToCanvas(group);
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
      // Load the font first, then apply and re-render
      ensureFontReady(value).then(() => {
        canvas.getActiveObjects().forEach((o) => {
          if (isTextType(o.type)) {
            (o as fabric.Textbox).set({ fontFamily: value });
          }
        });
        canvas.renderAll();
      });
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
    initialWidth,
    initialHeight,
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

      // Expose for e2e testing / Chiko bridge debugging
      if (typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).__fabricCanvas = initialCanvas;
      }

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
