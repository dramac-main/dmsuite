"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type DesignDocument,
  type Layer,
  type Point,
  hitTest,
  drawSelectionHandles,
  getResizeHandle,
  deleteLayer,
  reorderLayer,
  duplicateLayer,
} from "@/lib/canvas-layers";
import {
  IconTrash,
  IconCopy,
  IconChevronUp,
  IconChevronDown,
  IconEye,
  IconDownload,
  IconLock,
} from "@/components/icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CanvasConfig {
  width: number;
  height: number;
  label?: string;
}

interface InteractionState {
  mode: "select" | "pan" | "resize";
  isDragging: boolean;
  dragStart: Point;
  dragOffset: Point;
  resizeHandle: string | null;
  resizeStart: { x: number; y: number; width: number; height: number } | null;
}

interface CanvasWorkspaceShellProps {
  /** Left settings panel content */
  leftPanel: ReactNode;
  /** Canvas size configuration */
  canvasConfig: CanvasConfig;
  /** The design document (layer state) */
  document: DesignDocument;
  /** State setter for the design document */
  setDocument: (doc: DesignDocument | ((prev: DesignDocument) => DesignDocument)) => void;
  /** Callback to render the full design to the canvas context */
  renderDesign: (ctx: CanvasRenderingContext2D, doc: DesignDocument, width: number, height: number) => void;
  /** Optional extra controls for the right (layers) panel */
  rightPanelExtra?: ReactNode;
  /** Optional toolbar items to show above the canvas */
  toolbarExtra?: ReactNode;
  /** Export formats available */
  exportFormats?: { id: string; label: string; ext: string }[];
  /** Called when user clicks Export with the chosen format */
  onExport?: (format: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const initialInteraction: InteractionState = {
  mode: "select",
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
  resizeHandle: null,
  resizeStart: null,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Shared canvas workspace shell for layer-based design tools
 * (Social Media Post, Poster/Flyer, Banner Ad, etc.)
 *
 * Provides:
 * - Left panel (settings — supplied by parent)
 * - Center canvas with mouse interaction (select, drag, resize)
 * - Right panel (layer list with reorder/duplicate/delete/visibility)
 * - Bottom toolbar (undo/redo placeholder, export)
 */
export default function CanvasWorkspaceShell({
  leftPanel,
  canvasConfig,
  document: doc,
  setDocument,
  renderDesign,
  rightPanelExtra,
  toolbarExtra,
  exportFormats = [
    { id: "png", label: "PNG", ext: "png" },
    { id: "jpg", label: "JPG", ext: "jpg" },
  ],
  onExport,
}: CanvasWorkspaceShellProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [interaction, setInteraction] = useState<InteractionState>(initialInteraction);
  const [rightTab, setRightTab] = useState<"layers" | "export">("layers");
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings" | "layers">("canvas");

  // ── Scale for display ──────────────────────────────────
  const maxDisplayW = 560;
  const scale = Math.min(1, maxDisplayW / canvasConfig.width);
  const displayW = canvasConfig.width * scale;
  const displayH = canvasConfig.height * scale;

  // ── Redraw ─────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvasConfig.width;
    canvas.height = canvasConfig.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    renderDesign(ctx, doc, canvasConfig.width, canvasConfig.height);

    // Draw selection handles
    for (const selId of doc.selectedLayers) {
      const layer = doc.layers.find((l) => l.id === selId);
      if (layer) drawSelectionHandles(ctx, layer);
    }
  }, [doc, canvasConfig, renderDesign]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // ── Canvas Mouse Handlers ─────────────────────────────
  const toCanvas = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pt = toCanvas(e);

    // Check resize handle first
    if (doc.selectedLayers.length > 0) {
      const sel = doc.layers.find((l) => l.id === doc.selectedLayers[0]);
      if (sel) {
        const handle = getResizeHandle(sel, pt);
        if (handle) {
          setInteraction({
            mode: "resize",
            isDragging: true,
            dragStart: pt,
            dragOffset: { x: 0, y: 0 },
            resizeHandle: handle,
            resizeStart: { x: sel.x, y: sel.y, width: sel.width, height: sel.height },
          });
          return;
        }
      }
    }

    // Hit test layers (top to bottom)
    const hit = hitTest(doc.layers, doc.layerOrder, pt);

    if (hit) {
      setDocument((prev) => ({ ...prev, selectedLayers: [hit.id] }));
      setInteraction({
        mode: "select",
        isDragging: true,
        dragStart: pt,
        dragOffset: { x: pt.x - hit.x, y: pt.y - hit.y },
        resizeHandle: null,
        resizeStart: null,
      });
    } else {
      setDocument((prev) => ({ ...prev, selectedLayers: [] }));
      setInteraction(initialInteraction);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!interaction.isDragging) return;
    const pt = toCanvas(e);

    if (interaction.mode === "select" && doc.selectedLayers.length > 0) {
      setDocument((prev) => ({
        ...prev,
        layers: prev.layers.map((l) =>
          prev.selectedLayers.includes(l.id)
            ? { ...l, x: pt.x - interaction.dragOffset.x, y: pt.y - interaction.dragOffset.y }
            : l
        ),
      }));
    }

    if (interaction.mode === "resize" && doc.selectedLayers.length > 0 && interaction.resizeStart) {
      const dx = pt.x - interaction.dragStart.x;
      const dy = pt.y - interaction.dragStart.y;
      const rs = interaction.resizeStart;

      setDocument((prev) => ({
        ...prev,
        layers: prev.layers.map((l) =>
          prev.selectedLayers.includes(l.id)
            ? {
                ...l,
                width: Math.max(20, rs.width + dx),
                height: Math.max(20, rs.height + dy),
              }
            : l
        ),
      }));
    }
  };

  const handleMouseUp = () => {
    setInteraction((prev) => ({ ...prev, isDragging: false }));
  };

  // ── Layer Actions ──────────────────────────────────────
  const handleDeleteLayer = () => {
    if (doc.selectedLayers.length === 0) return;
    setDocument((prev) => deleteLayer(prev, prev.selectedLayers[0]));
  };

  const handleDuplicate = () => {
    if (doc.selectedLayers.length === 0) return;
    setDocument((prev) => duplicateLayer(prev, prev.selectedLayers[0]));
  };

  const handleReorder = (layerId: string, dir: "up" | "down") => {
    setDocument((prev) => reorderLayer(prev, layerId, dir));
  };

  const handleToggleVisibility = (layerId: string) => {
    setDocument((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    }));
  };

  const handleToggleLock = (layerId: string) => {
    setDocument((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === layerId ? { ...l, locked: !l.locked } : l
      ),
    }));
  };

  // ── Keyboard Shortcuts ─────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.key === "Delete" || e.key === "Backspace") && doc.selectedLayers.length > 0) {
        e.preventDefault();
        handleDeleteLayer();
      }
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && doc.selectedLayers.length > 0) {
        e.preventDefault();
        handleDuplicate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div>
      {/* ── Mobile Tabs ──────────────────────────────────── */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["canvas", "settings", "layers"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
              mobileTab === tab
                ? "text-primary-500 border-b-2 border-primary-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* ── Left Panel (Settings) ────────────────────────── */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 order-2 lg:order-1 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          {leftPanel}
        </div>

        {/* ── Canvas Area ──────────────────────────────────── */}
        <div className={`flex-1 min-w-0 order-1 lg:order-2 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
        {toolbarExtra && (
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            {toolbarExtra}
          </div>
        )}

        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
          <canvas
            ref={canvasRef}
            style={{ width: displayW, height: displayH }}
            className="rounded-lg shadow-lg cursor-crosshair"
            role="img"
            aria-label="Design canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        {/* Canvas label */}
        {canvasConfig.label && (
          <p className="text-xs text-gray-400 text-center mt-2">
            {canvasConfig.label} — {canvasConfig.width}×{canvasConfig.height}
          </p>
        )}
      </div>

      {/* ── Right Panel (Layers / Export) ─────────────────── */}
      <div className={`w-full lg:w-72 shrink-0 order-3 ${mobileTab !== "layers" ? "hidden md:block" : ""}`}>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3">
          <button
            onClick={() => setRightTab("layers")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              rightTab === "layers"
                ? "text-primary-500 border-b-2 border-primary-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Layers ({doc.layers.length})
          </button>
          <button
            onClick={() => setRightTab("export")}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              rightTab === "export"
                ? "text-primary-500 border-b-2 border-primary-500"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Export
          </button>
        </div>

        {rightTab === "layers" ? (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {[...doc.layers].reverse().map((layer) => (
              <div
                key={layer.id}
                onClick={() =>
                  setDocument((prev) => ({ ...prev, selectedLayers: [layer.id] }))
                }
                className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  doc.selectedLayers.includes(layer.id)
                    ? "bg-primary-500/10 text-white"
                    : "text-gray-400 hover:bg-gray-800/50"
                }`}
              >
                <span className="truncate flex-1 font-medium">{layer.name}</span>

                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer.id); }}
                  className={`p-1 rounded ${layer.visible ? "text-gray-400" : "text-gray-600"}`}
                  aria-label={layer.visible ? "Hide layer" : "Show layer"}
                >
                  <IconEye className="size-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleLock(layer.id); }}
                  className={`p-1 rounded ${layer.locked ? "text-warning" : "text-gray-600"}`}
                  aria-label={layer.locked ? "Unlock layer" : "Lock layer"}
                >
                  <IconLock className="size-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReorder(layer.id, "up"); }}
                  className="p-1 rounded text-gray-500 hover:text-white"
                  aria-label="Move layer up"
                >
                  <IconChevronUp className="size-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReorder(layer.id, "down"); }}
                  className="p-1 rounded text-gray-500 hover:text-white"
                  aria-label="Move layer down"
                >
                  <IconChevronDown className="size-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDocument((prev) => ({ ...prev, selectedLayers: [layer.id] })); handleDuplicate(); }}
                  className="p-1 rounded text-gray-500 hover:text-primary-400"
                  aria-label="Duplicate layer"
                >
                  <IconCopy className="size-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocument((prev) => deleteLayer({ ...prev, selectedLayers: [layer.id] }, layer.id));
                  }}
                  className="p-1 rounded text-gray-500 hover:text-error"
                  aria-label="Delete layer"
                >
                  <IconTrash className="size-3" />
                </button>
              </div>
            ))}
            {doc.layers.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-8">
                No layers yet. Generate a design to get started.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {exportFormats.map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => onExport?.(fmt.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500/50 hover:bg-primary-500/5 transition-colors text-left"
              >
                <IconDownload className="size-4 text-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {fmt.label}
                  </p>
                  <p className="text-xs text-gray-400">.{fmt.ext}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {rightPanelExtra}
      </div>
      </div>
    </div>
  );
}
