"use client";

/* ─────────────────────────────────────────────────────────────
   Sketch Board Workspace — Infinite Canvas Whiteboard
   Inspired by tldraw: freehand drawing, shapes, text, arrows,
   sticky notes, infinite pan/zoom, undo/redo, export.
   ───────────────────────────────────────────────────────────── */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createSketchBoardManifest } from "@/lib/chiko/manifests/sketch-board";
import {
  useSketchBoardEditor,
  STROKE_COLORS,
  FILL_COLORS,
  STICKY_COLORS,
  BACKGROUND_PRESETS,
} from "@/stores/sketch-board-editor";
import type {
  SketchTool,
  SketchElement,
  Point,
  DrawElement,
  EraserElement,
  LineElement,
  ArrowElement,
  TextElement,
  StickyElement,
  ShapeElement,
} from "@/types/sketch-board";
import { IconDownload, IconPlus, IconTrash, IconUndo, IconRedo, IconZoomIn, IconZoomOut } from "@/components/icons";

// ── Constants ─────────────────────────────────────────────────

const TOOL_DEFS: { id: SketchTool; label: string; icon: string }[] = [
  { id: "select", label: "Select", icon: "⇲" },
  { id: "hand", label: "Pan", icon: "✋" },
  { id: "draw", label: "Draw", icon: "✏️" },
  { id: "eraser", label: "Eraser", icon: "🧹" },
  { id: "rectangle", label: "Rectangle", icon: "▭" },
  { id: "ellipse", label: "Ellipse", icon: "◯" },
  { id: "diamond", label: "Diamond", icon: "◇" },
  { id: "triangle", label: "Triangle", icon: "△" },
  { id: "line", label: "Line", icon: "╱" },
  { id: "arrow", label: "Arrow", icon: "→" },
  { id: "text", label: "Text", icon: "T" },
  { id: "sticky", label: "Sticky Note", icon: "📝" },
];

// ── Helper: get SVG path for freehand drawing ─────────────────

function getDrawPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const mx = (prev.x + curr.x) / 2;
    const my = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

// ── Helper: get arrow head marker path ────────────────────────

function ArrowHeadMarker({ id }: { id: string }) {
  return (
    <marker
      id={id}
      markerWidth="12"
      markerHeight="8"
      refX="10"
      refY="4"
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <path d="M 0 0 L 12 4 L 0 8 Z" fill="currentColor" />
    </marker>
  );
}

// ── Element Renderer ──────────────────────────────────────────

function RenderElement({
  el,
  isSelected,
  onPointerDown,
}: {
  el: SketchElement;
  isSelected: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}) {
  const commonProps = {
    onPointerDown: (e: React.PointerEvent) => onPointerDown(e, el.id),
    style: {
      cursor: el.locked ? "not-allowed" : "move",
      opacity: el.style.opacity,
    } as React.CSSProperties,
  };

  const strokeDash =
    el.style.dashStyle === "dashed"
      ? "8 4"
      : el.style.dashStyle === "dotted"
        ? "2 4"
        : undefined;

  switch (el.type) {
    case "draw": {
      const d = el as DrawElement;
      return (
        <g {...commonProps}>
          <path
            d={getDrawPath(d.points)}
            fill="none"
            stroke={d.style.strokeColor}
            strokeWidth={d.style.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={strokeDash}
          />
          {isSelected && (
            <rect
              x={d.x - 4}
              y={d.y - 4}
              width={d.width + 8}
              height={d.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              rx={4}
            />
          )}
        </g>
      );
    }
    case "eraser": {
      const d = el as EraserElement;
      return (
        <path
          d={getDrawPath(d.points)}
          fill="none"
          stroke="white"
          strokeWidth={d.style.strokeWidth * 5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    case "rectangle": {
      const s = el as ShapeElement;
      return (
        <g
          {...commonProps}
          transform={`translate(${s.x}, ${s.y}) rotate(${s.rotation} ${s.width / 2} ${s.height / 2})`}
        >
          <rect
            width={s.width}
            height={s.height}
            fill={s.style.fillColor}
            stroke={s.style.strokeColor}
            strokeWidth={s.style.strokeWidth}
            strokeDasharray={strokeDash}
            rx={4}
          />
          {isSelected && (
            <rect
              x={-4}
              y={-4}
              width={s.width + 8}
              height={s.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              rx={6}
            />
          )}
        </g>
      );
    }
    case "ellipse": {
      const s = el as ShapeElement;
      return (
        <g
          {...commonProps}
          transform={`translate(${s.x}, ${s.y}) rotate(${s.rotation} ${s.width / 2} ${s.height / 2})`}
        >
          <ellipse
            cx={s.width / 2}
            cy={s.height / 2}
            rx={s.width / 2}
            ry={s.height / 2}
            fill={s.style.fillColor}
            stroke={s.style.strokeColor}
            strokeWidth={s.style.strokeWidth}
            strokeDasharray={strokeDash}
          />
          {isSelected && (
            <rect
              x={-4}
              y={-4}
              width={s.width + 8}
              height={s.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              rx={6}
            />
          )}
        </g>
      );
    }
    case "diamond": {
      const s = el as ShapeElement;
      const cx = s.width / 2;
      const cy = s.height / 2;
      const pts = `${cx},0 ${s.width},${cy} ${cx},${s.height} 0,${cy}`;
      return (
        <g
          {...commonProps}
          transform={`translate(${s.x}, ${s.y}) rotate(${s.rotation} ${cx} ${cy})`}
        >
          <polygon
            points={pts}
            fill={s.style.fillColor}
            stroke={s.style.strokeColor}
            strokeWidth={s.style.strokeWidth}
            strokeDasharray={strokeDash}
          />
          {isSelected && (
            <rect
              x={-4}
              y={-4}
              width={s.width + 8}
              height={s.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              rx={6}
            />
          )}
        </g>
      );
    }
    case "triangle": {
      const s = el as ShapeElement;
      const cx = s.width / 2;
      const pts = `${cx},0 ${s.width},${s.height} 0,${s.height}`;
      return (
        <g
          {...commonProps}
          transform={`translate(${s.x}, ${s.y}) rotate(${s.rotation} ${cx} ${s.height / 2})`}
        >
          <polygon
            points={pts}
            fill={s.style.fillColor}
            stroke={s.style.strokeColor}
            strokeWidth={s.style.strokeWidth}
            strokeDasharray={strokeDash}
          />
          {isSelected && (
            <rect
              x={-4}
              y={-4}
              width={s.width + 8}
              height={s.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              rx={6}
            />
          )}
        </g>
      );
    }
    case "line": {
      const l = el as LineElement;
      return (
        <g {...commonProps}>
          <line
            x1={l.start.x}
            y1={l.start.y}
            x2={l.end.x}
            y2={l.end.y}
            stroke={l.style.strokeColor}
            strokeWidth={l.style.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDash}
          />
          {isSelected && (
            <rect
              x={l.x - 4}
              y={l.y - 4}
              width={l.width + 8}
              height={l.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              rx={4}
            />
          )}
        </g>
      );
    }
    case "arrow": {
      const a = el as ArrowElement;
      const markerId = `arrowhead-${a.id}`;
      return (
        <g {...commonProps}>
          <defs>
            <marker
              id={markerId}
              markerWidth="12"
              markerHeight="8"
              refX="10"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d={`M 0 0 L 12 4 L 0 8 Z`} fill={a.style.strokeColor} />
            </marker>
          </defs>
          <line
            x1={a.start.x}
            y1={a.start.y}
            x2={a.end.x}
            y2={a.end.y}
            stroke={a.style.strokeColor}
            strokeWidth={a.style.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDash}
            markerEnd={a.endHead !== "none" ? `url(#${markerId})` : undefined}
          />
          {isSelected && (
            <rect
              x={a.x - 4}
              y={a.y - 4}
              width={a.width + 8}
              height={a.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              rx={4}
            />
          )}
        </g>
      );
    }
    case "text": {
      const t = el as TextElement;
      return (
        <g
          {...commonProps}
          transform={`translate(${t.x}, ${t.y}) rotate(${t.rotation} ${t.width / 2} ${t.height / 2})`}
        >
          <text
            x={t.style.textAlign === "center" ? t.width / 2 : t.style.textAlign === "right" ? t.width : 0}
            y={t.style.fontSize}
            fill={t.style.strokeColor}
            fontSize={t.style.fontSize}
            fontFamily={
              t.style.fontFamily === "hand"
                ? "'Segoe UI', system-ui, sans-serif"
                : t.style.fontFamily === "mono"
                  ? "'JetBrains Mono', monospace"
                  : t.style.fontFamily === "serif"
                    ? "Georgia, serif"
                    : "'Inter', sans-serif"
            }
            textAnchor={
              t.style.textAlign === "center"
                ? "middle"
                : t.style.textAlign === "right"
                  ? "end"
                  : "start"
            }
          >
            {t.text}
          </text>
          {isSelected && (
            <rect
              x={-4}
              y={-4}
              width={t.width + 8}
              height={t.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              rx={4}
            />
          )}
        </g>
      );
    }
    case "sticky": {
      const st = el as StickyElement;
      return (
        <g
          {...commonProps}
          transform={`translate(${st.x}, ${st.y}) rotate(${st.rotation} ${st.width / 2} ${st.height / 2})`}
        >
          <rect
            width={st.width}
            height={st.height}
            fill={st.stickyColor}
            rx={4}
            filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.15))"
          />
          <foreignObject x={8} y={8} width={st.width - 16} height={st.height - 16}>
            <div
              style={{
                fontSize: st.style.fontSize,
                fontFamily: "'Inter', sans-serif",
                color: "#1a1a1a",
                wordWrap: "break-word",
                overflow: "hidden",
                height: "100%",
              }}
            >
              {st.text}
            </div>
          </foreignObject>
          {isSelected && (
            <rect
              x={-4}
              y={-4}
              width={st.width + 8}
              height={st.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              rx={6}
            />
          )}
        </g>
      );
    }
    default:
      return null;
  }
}

// ── Style Panel ───────────────────────────────────────────────

function StylePanel() {
  const currentStyle = useSketchBoardEditor((s) => s.currentStyle);
  const setCurrentStyle = useSketchBoardEditor((s) => s.setCurrentStyle);
  const selectedIds = useSketchBoardEditor((s) => s.selectedIds);
  const setElementStyle = useSketchBoardEditor((s) => s.setElementStyle);

  const updateStyle = useCallback(
    (patch: Partial<typeof currentStyle>) => {
      setCurrentStyle(patch);
      for (const id of selectedIds) {
        setElementStyle(id, patch);
      }
    },
    [setCurrentStyle, selectedIds, setElementStyle]
  );

  return (
    <div className="flex flex-col gap-3 p-3 w-56 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
        Style
      </h3>

      {/* Stroke color */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Stroke</p>
        <div className="flex flex-wrap gap-1">
          {STROKE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateStyle({ strokeColor: c })}
              className={`w-6 h-6 rounded-full border-2 ${
                currentStyle.strokeColor === c
                  ? "border-primary-500"
                  : "border-gray-200 dark:border-gray-600"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Fill color */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Fill</p>
        <div className="flex flex-wrap gap-1">
          {FILL_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => updateStyle({ fillColor: c })}
              className={`w-6 h-6 rounded-full border-2 ${
                currentStyle.fillColor === c
                  ? "border-primary-500"
                  : "border-gray-200 dark:border-gray-600"
              } ${c === "transparent" ? "bg-gray-100 dark:bg-gray-800" : ""}`}
              style={c !== "transparent" ? { backgroundColor: c } : undefined}
              title={c === "transparent" ? "No fill" : c}
            >
              {c === "transparent" && (
                <span className="text-xs text-gray-400">∅</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke width */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          Stroke Width: {currentStyle.strokeWidth}px
        </p>
        <input
          type="range"
          min={1}
          max={12}
          value={currentStyle.strokeWidth}
          onChange={(e) =>
            updateStyle({ strokeWidth: Number(e.target.value) })
          }
          className="w-full accent-primary-500"
        />
      </div>

      {/* Dash style */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Dash</p>
        <div className="flex gap-1">
          {(["solid", "dashed", "dotted"] as const).map((ds) => (
            <button
              key={ds}
              onClick={() => updateStyle({ dashStyle: ds })}
              className={`px-2 py-1 text-xs rounded ${
                currentStyle.dashStyle === ds
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {ds}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          Opacity: {Math.round(currentStyle.opacity * 100)}%
        </p>
        <input
          type="range"
          min={10}
          max={100}
          value={currentStyle.opacity * 100}
          onChange={(e) =>
            updateStyle({ opacity: Number(e.target.value) / 100 })
          }
          className="w-full accent-primary-500"
        />
      </div>

      {/* Font size */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
          Font Size: {currentStyle.fontSize}px
        </p>
        <input
          type="range"
          min={12}
          max={72}
          value={currentStyle.fontSize}
          onChange={(e) =>
            updateStyle({ fontSize: Number(e.target.value) })
          }
          className="w-full accent-primary-500"
        />
      </div>

      {/* Font family */}
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Font</p>
        <div className="flex flex-wrap gap-1">
          {(["hand", "sans", "serif", "mono"] as const).map((ff) => (
            <button
              key={ff}
              onClick={() => updateStyle({ fontFamily: ff })}
              className={`px-2 py-1 text-xs rounded ${
                currentStyle.fontFamily === ff
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {ff}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Canvas Component ─────────────────────────────────────

function SketchCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doc = useSketchBoardEditor((s) => s.doc);
  const activeTool = useSketchBoardEditor((s) => s.activeTool);
  const selectedIds = useSketchBoardEditor((s) => s.selectedIds);
  const isDrawing = useSketchBoardEditor((s) => s.isDrawing);

  const setCamera = useSketchBoardEditor((s) => s.setCamera);
  const setSelectedIds = useSketchBoardEditor((s) => s.setSelectedIds);
  const deselectAll = useSketchBoardEditor((s) => s.deselectAll);
  const setIsDrawing = useSketchBoardEditor((s) => s.setIsDrawing);
  const addFreehand = useSketchBoardEditor((s) => s.addFreehand);
  const addRectangle = useSketchBoardEditor((s) => s.addRectangle);
  const addEllipse = useSketchBoardEditor((s) => s.addEllipse);
  const addDiamond = useSketchBoardEditor((s) => s.addDiamond);
  const addTriangle = useSketchBoardEditor((s) => s.addTriangle);
  const addLine = useSketchBoardEditor((s) => s.addLine);
  const addArrow = useSketchBoardEditor((s) => s.addArrow);
  const addText = useSketchBoardEditor((s) => s.addText);
  const addSticky = useSketchBoardEditor((s) => s.addSticky);
  const moveElement = useSketchBoardEditor((s) => s.moveElement);
  const removeElements = useSketchBoardEditor((s) => s.removeElements);
  const setActiveTool = useSketchBoardEditor((s) => s.setActiveTool);

  const drawPointsRef = useRef<Point[]>([]);
  const shapeStartRef = useRef<Point | null>(null);
  const dragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const panStartRef = useRef<{ cx: number; cy: number; mx: number; my: number } | null>(null);
  const [previewShape, setPreviewShape] = useState<{
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [drawPreview, setDrawPreview] = useState<Point[]>([]);

  const bgColor = useMemo(() => {
    const preset = BACKGROUND_PRESETS.find((b) => b.id === doc.background);
    return preset?.value ?? "#ffffff";
  }, [doc.background]);

  // Convert screen coords to canvas coords
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: clientX, y: clientY };
      return {
        x: (clientX - rect.left - doc.camera.x) / doc.camera.zoom,
        y: (clientY - rect.top - doc.camera.y) / doc.camera.zoom,
      };
    },
    [doc.camera]
  );

  // ── Pointer Handlers ──

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const pt = screenToCanvas(e.clientX, e.clientY);

      // Hand/pan tool
      if (activeTool === "hand") {
        panStartRef.current = {
          cx: doc.camera.x,
          cy: doc.camera.y,
          mx: e.clientX,
          my: e.clientY,
        };
        setIsDrawing(true);
        return;
      }

      // Select tool (clicking on empty space)
      if (activeTool === "select") {
        deselectAll();
        return;
      }

      // Drawing tools
      if (activeTool === "draw" || activeTool === "eraser") {
        drawPointsRef.current = [pt];
        setDrawPreview([pt]);
        setIsDrawing(true);
        return;
      }

      // Shape tools
      if (
        ["rectangle", "ellipse", "diamond", "triangle", "line", "arrow"].includes(
          activeTool
        )
      ) {
        shapeStartRef.current = pt;
        setIsDrawing(true);
        return;
      }

      // Text tool
      if (activeTool === "text") {
        addText(pt.x, pt.y, "Text");
        setActiveTool("select");
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
        return;
      }

      // Sticky note tool
      if (activeTool === "sticky") {
        addSticky(pt.x, pt.y, "Note");
        setActiveTool("select");
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
        return;
      }
    },
    [activeTool, doc.camera, screenToCanvas, deselectAll, setIsDrawing, addText, addSticky, setActiveTool]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing) return;

      // Pan
      if (activeTool === "hand" && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.mx;
        const dy = e.clientY - panStartRef.current.my;
        setCamera({
          x: panStartRef.current.cx + dx,
          y: panStartRef.current.cy + dy,
          zoom: doc.camera.zoom,
        });
        return;
      }

      const pt = screenToCanvas(e.clientX, e.clientY);

      // Freehand
      if (activeTool === "draw" || activeTool === "eraser") {
        drawPointsRef.current.push(pt);
        setDrawPreview([...drawPointsRef.current]);
        return;
      }

      // Shape preview
      if (shapeStartRef.current) {
        const sx = shapeStartRef.current.x;
        const sy = shapeStartRef.current.y;
        setPreviewShape({
          type: activeTool,
          x: Math.min(sx, pt.x),
          y: Math.min(sy, pt.y),
          w: Math.abs(pt.x - sx),
          h: Math.abs(pt.y - sy),
        });
      }

      // Drag element
      if (dragStartRef.current) {
        const dx = pt.x - dragStartRef.current.x;
        const dy = pt.y - dragStartRef.current.y;
        moveElement(dragStartRef.current.id, dx, dy);
        dragStartRef.current.x = pt.x;
        dragStartRef.current.y = pt.y;
      }
    },
    [isDrawing, activeTool, doc.camera, screenToCanvas, setCamera, moveElement]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;

    // Pan end
    if (activeTool === "hand") {
      panStartRef.current = null;
      setIsDrawing(false);
      return;
    }

    // Freehand end
    if (activeTool === "draw" || activeTool === "eraser") {
      if (drawPointsRef.current.length > 1) {
        addFreehand(drawPointsRef.current);
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
      }
      drawPointsRef.current = [];
      setDrawPreview([]);
      setIsDrawing(false);
      return;
    }

    // Shape creation
    if (shapeStartRef.current && previewShape) {
      const { x, y, w, h } = previewShape;
      if (w > 2 || h > 2) {
        const pt = shapeStartRef.current;
        const endPt = screenToCanvas(0, 0); // We use previewShape directly
        switch (activeTool) {
          case "rectangle":
            addRectangle(x, y, w, h);
            break;
          case "ellipse":
            addEllipse(x, y, w, h);
            break;
          case "diamond":
            addDiamond(x, y, w, h);
            break;
          case "triangle":
            addTriangle(x, y, w, h);
            break;
          case "line":
            addLine(pt.x, pt.y, pt.x + w, pt.y + h);
            break;
          case "arrow":
            addArrow(pt.x, pt.y, pt.x + w, pt.y + h);
            break;
        }
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
      }
    }

    shapeStartRef.current = null;
    setPreviewShape(null);
    dragStartRef.current = null;
    setIsDrawing(false);
  }, [
    isDrawing,
    activeTool,
    previewShape,
    screenToCanvas,
    setIsDrawing,
    addFreehand,
    addRectangle,
    addEllipse,
    addDiamond,
    addTriangle,
    addLine,
    addArrow,
  ]);

  // Element click handler (for select mode)
  const handleElementPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.stopPropagation();

      if (activeTool === "eraser") {
        removeElements([id]);
        window.dispatchEvent(new CustomEvent("workspace:dirty"));
        return;
      }

      if (activeTool !== "select") return;

      if (e.shiftKey) {
        // Multi-select toggle
        setSelectedIds(
          selectedIds.includes(id)
            ? selectedIds.filter((sid) => sid !== id)
            : [...selectedIds, id]
        );
      } else {
        setSelectedIds([id]);
      }

      // Start drag
      const pt = screenToCanvas(e.clientX, e.clientY);
      dragStartRef.current = { id, x: pt.x, y: pt.y };
      setIsDrawing(true);
    },
    [activeTool, selectedIds, screenToCanvas, setSelectedIds, removeElements, setIsDrawing]
  );

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(8, doc.camera.zoom * factor));

      // Zoom toward cursor
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const newX = mx - (mx - doc.camera.x) * (newZoom / doc.camera.zoom);
        const newY = my - (my - doc.camera.y) * (newZoom / doc.camera.zoom);
        setCamera({ x: newX, y: newY, zoom: newZoom });
      } else {
        setCamera({ ...doc.camera, zoom: newZoom });
      }
    },
    [doc.camera, setCamera]
  );

  // Sort elements by z-index
  const sortedElements = useMemo(
    () => [...doc.elements].sort((a, b) => a.zIndex - b.zIndex),
    [doc.elements]
  );

  // Grid pattern
  const gridSize = doc.grid.size * doc.camera.zoom;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{
          cursor:
            activeTool === "hand"
              ? "grab"
              : activeTool === "draw"
                ? "crosshair"
                : activeTool === "eraser"
                  ? "crosshair"
                  : activeTool === "text"
                    ? "text"
                    : activeTool === "select"
                      ? "default"
                      : "crosshair",
          touchAction: "none",
        }}
      >
        {/* Grid */}
        {doc.grid.enabled && (
          <>
            <defs>
              <pattern
                id="grid-pattern"
                width={gridSize}
                height={gridSize}
                patternUnits="userSpaceOnUse"
                x={doc.camera.x % gridSize}
                y={doc.camera.y % gridSize}
              >
                <circle
                  cx={gridSize / 2}
                  cy={gridSize / 2}
                  r={1}
                  fill="#9ca3af"
                  fillOpacity={0.3}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </>
        )}

        {/* Canvas transform group */}
        <g
          transform={`translate(${doc.camera.x}, ${doc.camera.y}) scale(${doc.camera.zoom})`}
        >
          {/* Rendered elements */}
          {sortedElements.map((el) => (
            <RenderElement
              key={el.id}
              el={el}
              isSelected={selectedIds.includes(el.id)}
              onPointerDown={handleElementPointerDown}
            />
          ))}

          {/* Draw preview (live freehand) */}
          {drawPreview.length > 1 && (
            <path
              d={getDrawPath(drawPreview)}
              fill="none"
              stroke={
                activeTool === "eraser"
                  ? "#ef4444"
                  : useSketchBoardEditor.getState().currentStyle.strokeColor
              }
              strokeWidth={useSketchBoardEditor.getState().currentStyle.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.6}
            />
          )}

          {/* Shape preview */}
          {previewShape && (
            <>
              {previewShape.type === "rectangle" && (
                <rect
                  x={previewShape.x}
                  y={previewShape.y}
                  width={previewShape.w}
                  height={previewShape.h}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  rx={4}
                />
              )}
              {previewShape.type === "ellipse" && (
                <ellipse
                  cx={previewShape.x + previewShape.w / 2}
                  cy={previewShape.y + previewShape.h / 2}
                  rx={previewShape.w / 2}
                  ry={previewShape.h / 2}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
              )}
              {previewShape.type === "diamond" && (
                <polygon
                  points={`${previewShape.x + previewShape.w / 2},${previewShape.y} ${previewShape.x + previewShape.w},${previewShape.y + previewShape.h / 2} ${previewShape.x + previewShape.w / 2},${previewShape.y + previewShape.h} ${previewShape.x},${previewShape.y + previewShape.h / 2}`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
              )}
              {previewShape.type === "triangle" && (
                <polygon
                  points={`${previewShape.x + previewShape.w / 2},${previewShape.y} ${previewShape.x + previewShape.w},${previewShape.y + previewShape.h} ${previewShape.x},${previewShape.y + previewShape.h}`}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
              )}
              {(previewShape.type === "line" || previewShape.type === "arrow") && (
                <line
                  x1={previewShape.x}
                  y1={previewShape.y}
                  x2={previewShape.x + previewShape.w}
                  y2={previewShape.y + previewShape.h}
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
              )}
            </>
          )}
        </g>
      </svg>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
        {Math.round(doc.camera.zoom * 100)}%
      </div>
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────

function Toolbar() {
  const activeTool = useSketchBoardEditor((s) => s.activeTool);
  const setActiveTool = useSketchBoardEditor((s) => s.setActiveTool);

  return (
    <div className="flex items-center gap-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-1 py-1 shadow-lg">
      {TOOL_DEFS.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTool(t.id)}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
            activeTool === t.id
              ? "bg-primary-500 text-white"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────

function TopBar() {
  const title = useSketchBoardEditor((s) => s.doc.title);
  const setTitle = useSketchBoardEditor((s) => s.setTitle);
  const doc = useSketchBoardEditor((s) => s.doc);
  const selectedIds = useSketchBoardEditor((s) => s.selectedIds);
  const removeElements = useSketchBoardEditor((s) => s.removeElements);
  const clearAll = useSketchBoardEditor((s) => s.clearAll);
  const zoomIn = useSketchBoardEditor((s) => s.zoomIn);
  const zoomOut = useSketchBoardEditor((s) => s.zoomOut);
  const resetZoom = useSketchBoardEditor((s) => s.resetZoom);
  const toggleGrid = useSketchBoardEditor((s) => s.toggleGrid);
  const fitToContent = useSketchBoardEditor((s) => s.fitToContent);
  const setBackground = useSketchBoardEditor((s) => s.setBackground);
  const bringToFront = useSketchBoardEditor((s) => s.bringToFront);
  const sendToBack = useSketchBoardEditor((s) => s.sendToBack);
  const duplicateSelected = useSketchBoardEditor((s) => s.duplicateSelected);

  const [showBg, setShowBg] = useState(false);

  const handleExportPNG = useCallback(() => {
    const svgEl = document.querySelector(".sketch-canvas-svg") as SVGSVGElement;
    if (!svgEl) {
      // Fallback: export from the main SVG
      const mainSvg = document.querySelector("svg");
      if (!mainSvg) return;
    }

    // Create a canvas from the SVG
    const svgData = new XMLSerializer().serializeToString(
      document.querySelector("svg")!
    );
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = BACKGROUND_PRESETS.find((b) => b.id === doc.background)?.value ?? "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        window.dispatchEvent(new CustomEvent("workspace:save"));
        window.dispatchEvent(
          new CustomEvent("workspace:progress", {
            detail: { milestone: "exported" },
          })
        );
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [doc]);

  const handleExportSVG = useCallback(() => {
    const svgEl = document.querySelector("svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, "_")}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
    window.dispatchEvent(new CustomEvent("workspace:save"));
    window.dispatchEvent(
      new CustomEvent("workspace:progress", {
        detail: { milestone: "exported" },
      })
    );
  }, [doc.title]);

  const handleUndo = useCallback(() => {
    useSketchBoardEditor.temporal.getState().undo();
  }, []);

  const handleRedo = useCallback(() => {
    useSketchBoardEditor.temporal.getState().redo();
  }, []);

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 gap-2">
      {/* Left: Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          window.dispatchEvent(new CustomEvent("workspace:dirty"));
        }}
        className="bg-transparent text-sm font-medium text-gray-900 dark:text-gray-100 border-none outline-none w-48 truncate"
        placeholder="Board title..."
      />

      {/* Center: Tool bar */}
      <Toolbar />

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Undo / Redo */}
        <button
          onClick={handleUndo}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Undo (Ctrl+Z)"
        >
          <IconUndo className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Redo (Ctrl+Y)"
        >
          <IconRedo className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Zoom */}
        <button
          onClick={zoomOut}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Zoom out"
        >
          <IconZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetZoom}
          className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          title="Reset zoom"
        >
          {Math.round(doc.camera.zoom * 100)}%
        </button>
        <button
          onClick={zoomIn}
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Zoom in"
        >
          <IconZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Grid toggle */}
        <button
          onClick={toggleGrid}
          className={`px-2 py-1 text-xs rounded-lg ${
            doc.grid.enabled
              ? "bg-primary-500/20 text-primary-600 dark:text-primary-400"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          title="Toggle grid"
        >
          Grid
        </button>

        {/* Fit to content */}
        <button
          onClick={fitToContent}
          className="px-2 py-1 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Fit to content"
        >
          Fit
        </button>

        {/* Background */}
        <div className="relative">
          <button
            onClick={() => setShowBg(!showBg)}
            className="px-2 py-1 text-xs rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Background"
          >
            BG
          </button>
          {showBg && (
            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 flex flex-col gap-1">
              {BACKGROUND_PRESETS.map((bp) => (
                <button
                  key={bp.id}
                  onClick={() => {
                    setBackground(bp.id);
                    setShowBg(false);
                    window.dispatchEvent(new CustomEvent("workspace:dirty"));
                  }}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs text-left ${
                    doc.background === bp.id
                      ? "bg-primary-500/20 text-primary-600"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: bp.value }}
                  />
                  {bp.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Selection actions */}
        {selectedIds.length > 0 && (
          <>
            <button
              onClick={() => duplicateSelected()}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Duplicate"
            >
              <IconPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (selectedIds[0]) bringToFront(selectedIds[0]);
              }}
              className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Bring to front"
            >
              ↑
            </button>
            <button
              onClick={() => {
                if (selectedIds[0]) sendToBack(selectedIds[0]);
              }}
              className="px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title="Send to back"
            >
              ↓
            </button>
            <button
              onClick={() => {
                removeElements(selectedIds);
                window.dispatchEvent(new CustomEvent("workspace:dirty"));
              }}
              className="p-1.5 rounded-lg text-error hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Delete selected"
            >
              <IconTrash className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
          </>
        )}

        {/* Export */}
        <button
          onClick={handleExportPNG}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-primary-500 text-white hover:bg-primary-600"
          title="Export PNG"
        >
          <IconDownload className="w-3.5 h-3.5" />
          PNG
        </button>
        <button
          onClick={handleExportSVG}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          title="Export SVG"
        >
          <IconDownload className="w-3.5 h-3.5" />
          SVG
        </button>
      </div>
    </div>
  );
}

// ── Main Workspace ────────────────────────────────────────────

export default function SketchBoardWorkspace() {
  // ── Chiko Integration ──
  useChikoActions(
    useCallback(() => createSketchBoardManifest(useSketchBoardEditor), [])
  );

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const state = useSketchBoardEditor.getState();

      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useSketchBoardEditor.temporal.getState().undo();
        return;
      }
      // Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        useSketchBoardEditor.temporal.getState().redo();
        return;
      }
      // Delete selected
      if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedIds.length > 0) {
          e.preventDefault();
          state.removeElements(state.selectedIds);
          window.dispatchEvent(new CustomEvent("workspace:dirty"));
        }
        return;
      }
      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        state.selectAll();
        return;
      }
      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        if (state.selectedIds.length > 0) {
          e.preventDefault();
          state.duplicateSelected();
        }
        return;
      }
      // Escape
      if (e.key === "Escape") {
        state.deselectAll();
        state.setActiveTool("select");
        return;
      }
      // Tool shortcuts (single key)
      const toolMap: Record<string, SketchTool> = {
        v: "select",
        h: "hand",
        p: "draw",
        e: "eraser",
        r: "rectangle",
        o: "ellipse",
        d: "diamond",
        t: "text",
        l: "line",
        a: "arrow",
        s: "sticky",
      };
      if (!e.ctrlKey && !e.metaKey && !e.altKey && toolMap[e.key]) {
        state.setActiveTool(toolMap[e.key]);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Workspace events on mount ──
  const hasDispatchedRef = useRef(false);
  useEffect(() => {
    if (hasDispatchedRef.current) return;
    hasDispatchedRef.current = true;
    const state = useSketchBoardEditor.getState();
    if (state.doc.elements.length > 0) {
      window.dispatchEvent(
        new CustomEvent("workspace:progress", {
          detail: { progress: 50, milestone: "content" },
        })
      );
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <SketchCanvas />
        <StylePanel />
      </div>
    </div>
  );
}
