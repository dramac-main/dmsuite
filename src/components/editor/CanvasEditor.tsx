"use client";

// =============================================================================
// DMSuite — Shared Canvas Editor Component
// This is the universal editor kernel used by ALL workspace tools.
// Wraps: renderer, hit-test, interaction engine, command stack, viewport.
// =============================================================================

import React, {
  useRef, useCallback, useEffect, useState, useMemo,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useEditorStore } from "@/stores/editor";
import type { DesignDocumentV2, LayerV2, LayerId } from "@/lib/editor/schema";
import { renderDocumentV2, drawSelectionHandlesV2, type RenderOptions } from "@/lib/editor/renderer";
import {
  createInteractionState, screenToWorld,
  handlePointerDown, handlePointerMove, handlePointerUp, handleKeyAction,
  type InteractionState, type ViewportTransform,
} from "@/lib/editor/interaction";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanvasEditorProps {
  /** Override document (if not using the store) */
  document?: DesignDocumentV2;
  /** Called when document changes (if not using the store) */
  onDocumentChange?: (doc: DesignDocumentV2) => void;
  /** Canvas container className */
  className?: string;
  /** Whether to show grid overlay */
  showGrid?: boolean;
  /** Whether to show bleed/safe area */
  showBleedSafe?: boolean;
  /** Minimum zoom */
  minZoom?: number;
  /** Maximum zoom */
  maxZoom?: number;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Called when a layer is selected */
  onSelectionChange?: (ids: LayerId[]) => void;
  /** Called when a layer is double-clicked (e.g., to edit text) */
  onLayerDoubleClick?: (layer: LayerV2) => void;
  /** Custom overlay renderer (for tool-specific guides, previews) */
  renderOverlay?: (ctx: CanvasRenderingContext2D, viewport: ViewportTransform) => void;
  /** Background color behind the canvas (workspace background) */
  workspaceBg?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CanvasEditor({
  document: externalDoc,
  onDocumentChange,
  className = "",
  showGrid: showGridProp,
  showBleedSafe: showBleedSafeProp,
  minZoom = 0.1,
  maxZoom = 10,
  readOnly = false,
  onSelectionChange,
  onLayerDoubleClick,
  renderOverlay,
  workspaceBg = "#1a1a2e",
}: CanvasEditorProps) {
  // ---- Store ----
  const store = useEditorStore();
  const doc = externalDoc ?? store.doc;
  const viewport = store.viewport;
  const mode = store.mode;

  // ---- Refs ----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<InteractionState>(createInteractionState());
  const rafRef = useRef<number>(0);

  // ---- Local state ----
  const [cursor, setCursor] = useState("default");
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  // ---- Viewport transform for interaction engine ----
  const vp: ViewportTransform = useMemo(() => ({
    zoom: viewport.zoom,
    offsetX: viewport.offsetX,
    offsetY: viewport.offsetY,
  }), [viewport.zoom, viewport.offsetX, viewport.offsetY]);

  // ---- Show flags ----
  const showGrid = showGridProp ?? viewport.showGrid;
  const showBleedSafe = showBleedSafeProp ?? viewport.showBleedSafe;

  // ---- Resize observer ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ---- Auto-fit on first load ----
  useEffect(() => {
    if (canvasSize.w > 0 && canvasSize.h > 0) {
      store.fitToCanvas(canvasSize.w, canvasSize.h);
    }
    // Only on first meaningful size
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize.w > 0 && canvasSize.h > 0]);

  // ---- Render loop ----
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.w * dpr;
    canvas.height = canvasSize.h * dpr;
    ctx.scale(dpr, dpr);

    // Clear workspace background
    ctx.fillStyle = workspaceBg;
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    // Draw grid if enabled
    if (showGrid) {
      drawGrid(ctx, vp, canvasSize.w, canvasSize.h);
    }

    // Apply viewport transform
    ctx.save();
    ctx.translate(vp.offsetX, vp.offsetY);
    ctx.scale(vp.zoom, vp.zoom);

    // Render document
    const renderOpts: RenderOptions = {
      showSelection: true,
      showGuides: viewport.showGuides,
      showBleedSafe,
      scaleFactor: vp.zoom,
    };
    renderDocumentV2(ctx, doc, renderOpts);

    // Draw selection handles
    if (doc.selection.ids.length > 0) {
      for (const selId of doc.selection.ids) {
        const selLayer = doc.layersById[selId];
        if (selLayer) {
          drawSelectionHandlesV2(ctx, selLayer);
        }
      }
    }

    // Draw marquee if active
    const istate = interactionRef.current;
    if (istate.action.type === "marquee" && istate.phase === "dragging") {
      const { startWorld, currentWorld } = istate.action as { type: "marquee"; startWorld: { x: number; y: number }; currentWorld: { x: number; y: number } };
      ctx.save();
      ctx.strokeStyle = "#a3e635";
      ctx.lineWidth = 1 / vp.zoom;
      ctx.setLineDash([4 / vp.zoom, 4 / vp.zoom]);
      ctx.fillStyle = "rgba(163, 230, 53, 0.1)";
      const x = Math.min(startWorld.x, currentWorld.x);
      const y = Math.min(startWorld.y, currentWorld.y);
      const w = Math.abs(currentWorld.x - startWorld.x);
      const h = Math.abs(currentWorld.y - startWorld.y);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }

    ctx.restore(); // Undo viewport transform

    // Custom overlay (in screen space, receives viewport for coord conversion)
    if (renderOverlay) {
      renderOverlay(ctx, vp);
    }

    // Zoom indicator handled by HTML overlay
  }, [doc, vp, canvasSize, showGrid, showBleedSafe, viewport.showGuides, workspaceBg, renderOverlay]);

  // Re-render on any dependency change
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // ---- Notify selection changes ----
  useEffect(() => {
    onSelectionChange?.(doc.selection.ids);
  }, [doc.selection.ids, onSelectionChange]);

  // ---- Apply doc changes back to store/external ----
  const applyDocChanges = useCallback((newDoc: DesignDocumentV2) => {
    if (onDocumentChange) {
      onDocumentChange(newDoc);
    } else {
      store.setDoc(newDoc);
    }
  }, [onDocumentChange, store]);

  // ---- Get canvas-relative coords ----
  const getCanvasCoords = useCallback((e: ReactMouseEvent): { screen: { x: number; y: number }; world: { x: number; y: number } } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { screen: { x: 0, y: 0 }, world: { x: 0, y: 0 } };
    const screen = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const world = screenToWorld(screen.x, screen.y, vp);
    return { screen, world };
  }, [vp]);

  // ---- Mouse handlers ----
  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    if (readOnly) return;
    e.preventDefault();
    const { screen, world } = getCanvasCoords(e);

    const result = handlePointerDown(
      doc, interactionRef.current, mode,
      world, screen, vp,
      e.shiftKey, e.metaKey || e.ctrlKey
    );

    interactionRef.current = result.state;
    setCursor(result.cursor);

    if (result.selection) {
      store.selectLayers(result.selection.ids, result.selection.additive);
    }

    for (const cmd of result.commands) {
      store.execute(cmd);
    }

    if (result.needsRepaint) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(render);
    }
  }, [doc, mode, vp, readOnly, getCanvasCoords, store, render]);

  const handleMouseMove = useCallback((e: ReactMouseEvent) => {
    const { screen, world } = getCanvasCoords(e);

    const result = handlePointerMove(
      doc, interactionRef.current,
      world, screen, vp,
      viewport.snapEnabled
    );

    interactionRef.current = result.state;
    setCursor(result.cursor);

    if (result.viewportDelta) {
      store.setViewport(result.viewportDelta);
    }

    // Apply live-preview commands (these go directly, not through undo stack, during drag)
    if (result.commands.length > 0 && result.state.phase === "dragging") {
      let tempDoc = doc;
      for (const cmd of result.commands) {
        tempDoc = cmd.execute(tempDoc);
      }
      applyDocChanges(tempDoc);
    }

    if (result.needsRepaint) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(render);
    }
  }, [doc, vp, viewport.snapEnabled, getCanvasCoords, store, render, applyDocChanges]);

  const handleMouseUp = useCallback((e: ReactMouseEvent) => {
    if (readOnly) return;
    const { world } = getCanvasCoords(e);

    const result = handlePointerUp(doc, interactionRef.current, world);

    interactionRef.current = result.state;
    setCursor(result.cursor);

    if (result.selection) {
      store.selectLayers(result.selection.ids);
    }

    if (result.needsRepaint) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(render);
    }
  }, [doc, readOnly, getCanvasCoords, store, render]);

  const handleDoubleClick = useCallback((e: ReactMouseEvent) => {
    if (readOnly) return;
    getCanvasCoords(e);
    // Find the layer under cursor
    const selected = doc.selection.ids;
    if (selected.length === 1) {
      const layer = doc.layersById[selected[0]];
      if (layer) {
        onLayerDoubleClick?.(layer);
      }
    }
  }, [doc, readOnly, getCanvasCoords, onLayerDoubleClick]);

  // ---- Wheel → zoom ----
  const handleWheel = useCallback((e: ReactWheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      // Zoom toward cursor
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.max(minZoom, Math.min(maxZoom, viewport.zoom * zoomFactor));
      const ratio = newZoom / viewport.zoom;
      store.setViewport({
        zoom: newZoom,
        offsetX: mouseX - (mouseX - viewport.offsetX) * ratio,
        offsetY: mouseY - (mouseY - viewport.offsetY) * ratio,
      });
    } else {
      // Pan
      store.setViewport({
        offsetX: viewport.offsetX - e.deltaX,
        offsetY: viewport.offsetY - e.deltaY,
      });
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
  }, [viewport, minZoom, maxZoom, store, render]);

  // ---- Keyboard shortcuts ----
  const handleKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if (readOnly) return;

    // Undo/Redo
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      if (e.shiftKey) { store.redoCmd(); } else { store.undoCmd(); }
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(render);
      return;
    }

    // Copy/Paste/Cut
    if ((e.ctrlKey || e.metaKey) && e.key === "c") { store.copySelection(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === "v") { store.pasteClipboard(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === "x") { store.cutSelection(); return; }

    // Select All
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      e.preventDefault();
      const allIds = Object.keys(doc.layersById).filter(id => id !== doc.rootFrameId) as LayerId[];
      store.selectLayers(allIds);
      return;
    }

    // Delete
    if (e.key === "Delete" || e.key === "Backspace") {
      const selected = doc.selection.ids;
      if (selected.length > 0) {
        store.removeLayersFromDoc(selected);
        store.deselectAll();
      }
      return;
    }

    // Escape → deselect
    if (e.key === "Escape") {
      store.deselectAll();
      store.setMode("select");
      return;
    }

    // Tool shortcuts
    if (e.key === "v" || e.key === "V") { store.setMode("select"); return; }
    if (e.key === "h" || e.key === "H") { store.setMode("hand"); return; }
    if (e.key === "t" || e.key === "T") { store.setMode("text"); return; }

    // Arrow keys → nudge
    const action = handleKeyAction(doc, e.key, e.ctrlKey || e.metaKey, e.shiftKey);
    if (action) {
      e.preventDefault();
      for (const cmd of action.commands) {
        store.execute(cmd);
      }
      if (action.selection) {
        store.selectLayers(action.selection.ids);
      }
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(render);
    }
  }, [doc, readOnly, store, render]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden focus:outline-none ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ cursor }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize.w}
        height={canvasSize.h}
        className="absolute inset-0 w-full h-full"
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Floating zoom display */}
      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-gray-900/80 text-gray-300 text-xs font-mono backdrop-blur-sm border border-gray-700/50 pointer-events-none">
        {Math.round(viewport.zoom * 100)}%
      </div>

      {/* Mode indicator */}
      {mode !== "select" && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-primary-500/20 text-primary-400 text-xs font-medium backdrop-blur-sm border border-primary-500/30 pointer-events-none capitalize">
          {mode}
        </div>
      )}

      {/* AI processing indicator */}
      {store.ai.isProcessing && (
        <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary-500/20 text-secondary-400 text-xs font-medium backdrop-blur-sm border border-secondary-500/30 pointer-events-none">
          <span className="inline-block w-2 h-2 rounded-full bg-secondary-400 animate-pulse" />
          AI Processing…
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid drawing
// ---------------------------------------------------------------------------

function drawGrid(
  ctx: CanvasRenderingContext2D,
  vp: ViewportTransform,
  width: number,
  height: number
) {
  const gridSize = 8 * vp.zoom;
  if (gridSize < 4) return; // Too small to see

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 0.5;

  const startX = vp.offsetX % gridSize;
  const startY = vp.offsetY % gridSize;

  ctx.beginPath();
  for (let x = startX; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = startY; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
  ctx.restore();
}
