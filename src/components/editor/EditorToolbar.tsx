"use client";

// =============================================================================
// DMSuite — Editor Toolbar (Rebuilt — Phase C.2)
// Professional toolbar with SVG icons, add-layer actions, undo/redo, zoom,
// alignment, and view toggles. No emoji — all proper SVG icons.
// =============================================================================

import React, { useState, useRef, useCallback } from "react";
import { useEditorStore, type InteractionMode } from "@/stores/editor";
import type { LayerV2, LayerId, TextLayerV2, ShapeLayerV2, IconLayerV2 } from "@/lib/editor/schema";
import { defaultTransform } from "@/lib/editor/schema";
import { screenToWorld } from "@/lib/editor/interaction";
import AlignDistributeBar from "./AlignDistributeBar";
import IconPickerPopover from "./IconPickerPopover";
import {
  IconCursor, IconHand,
  IconUndo, IconRedo,
  IconZoomIn, IconZoomOut, IconFitView,
  IconGrid, IconGuides, IconMagnet, IconBleedSafe,
  IconType, IconPlus,
} from "@/components/icons";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditorToolbar({ canvasSize }: { canvasSize?: { w: number; h: number } }) {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const canUndoVal = useEditorStore((s) => s.canUndo());
  const canRedoVal = useEditorStore((s) => s.canRedo());
  const undoCmd = useEditorStore((s) => s.undoCmd);
  const redoCmd = useEditorStore((s) => s.redoCmd);
  const zoom = useEditorStore((s) => s.viewport.zoom);
  const zoomIn = useEditorStore((s) => s.zoomIn);
  const zoomOut = useEditorStore((s) => s.zoomOut);
  const zoomTo = useEditorStore((s) => s.zoomTo);
  const fitToCanvas = useEditorStore((s) => s.fitToCanvas);
  const showGrid = useEditorStore((s) => s.viewport.showGrid);
  const showGuides = useEditorStore((s) => s.viewport.showGuides);
  const showBleedSafe = useEditorStore((s) => s.viewport.showBleedSafe);
  const snapEnabled = useEditorStore((s) => s.viewport.snapEnabled);
  const setViewport = useEditorStore((s) => s.setViewport);
  const selCount = useEditorStore((s) => s.doc.selection.ids.length);
  const addLayerToDoc = useEditorStore((s) => s.addLayerToDoc);
  const selectLayers = useEditorStore((s) => s.selectLayers);
  const viewport = useEditorStore((s) => s.viewport);

  const [showIconPicker, setShowIconPicker] = useState(false);

  // Generate unique layer ID
  const genId = (type: string): LayerId =>
    `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` as LayerId;

  // Get viewport center in world coordinates
  const getWorldCenter = useCallback((): { x: number; y: number } => {
    const cw = canvasSize?.w ?? 800;
    const ch = canvasSize?.h ?? 600;
    return screenToWorld(cw / 2, ch / 2, {
      zoom: viewport.zoom,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY,
    });
  }, [canvasSize, viewport]);

  // ---- Add Text Layer ----
  const handleAddText = useCallback(() => {
    const center = getWorldCenter();
    const id = genId("text");
    const layer: TextLayerV2 = {
      id,
      type: "text",
      name: "Text",
      tags: ["text"],
      parentId: null,
      transform: defaultTransform(center.x - 100, center.y - 20, 200, 40),
      opacity: 1,
      blendMode: "normal",
      visible: true,
      locked: false,
      effects: [],
      constraints: { horizontal: "left", vertical: "top" },
      text: "New Text",
      defaultStyle: {
        fontFamily: "Inter",
        fontSize: 16,
        fontWeight: 400,
        italic: false,
        underline: false,
        strikethrough: false,
        letterSpacing: 0,
        lineHeight: 1.4,
        fill: { kind: "solid", color: { r: 255, g: 255, b: 255, a: 1 } },
        uppercase: false,
      },
      runs: [],
      paragraphs: [{ align: "left", indent: 0, spaceBefore: 0, spaceAfter: 0 }],
      overflow: "clip",
      verticalAlign: "top",
    };
    addLayerToDoc(layer);
    selectLayers([id]);
  }, [getWorldCenter, addLayerToDoc, selectLayers]);

  // ---- Add Shape Layer ----
  const handleAddShape = useCallback(() => {
    const center = getWorldCenter();
    const id = genId("shape");
    const layer: ShapeLayerV2 = {
      id,
      type: "shape",
      name: "Rectangle",
      tags: ["shape"],
      parentId: null,
      transform: defaultTransform(center.x - 75, center.y - 50, 150, 100),
      opacity: 1,
      blendMode: "normal",
      visible: true,
      locked: false,
      effects: [],
      constraints: { horizontal: "left", vertical: "top" },
      shapeType: "rectangle",
      fills: [{ kind: "solid", color: { r: 100, g: 149, b: 237, a: 1 } }],
      strokes: [],
      cornerRadii: [0, 0, 0, 0],
      sides: 4,
      innerRadiusRatio: 1,
    };
    addLayerToDoc(layer);
    selectLayers([id]);
  }, [getWorldCenter, addLayerToDoc, selectLayers]);

  // ---- Add Icon Layer ----
  const handleAddIcon = useCallback((iconId: string) => {
    const center = getWorldCenter();
    const id = genId("icon");
    const layer: IconLayerV2 = {
      id,
      type: "icon",
      name: iconId,
      tags: ["icon"],
      parentId: null,
      transform: defaultTransform(center.x - 16, center.y - 16, 32, 32),
      opacity: 1,
      blendMode: "normal",
      visible: true,
      locked: false,
      effects: [],
      constraints: { horizontal: "left", vertical: "top" },
      iconId,
      color: { r: 255, g: 255, b: 255, a: 1 },
      strokeWidth: 2,
    };
    addLayerToDoc(layer);
    selectLayers([id]);
    setShowIconPicker(false);
  }, [getWorldCenter, addLayerToDoc, selectLayers]);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-900 border-b border-gray-700/50 select-none">
      {/* Group 1 — Interaction Mode Tools */}
      <div className="flex items-center gap-0.5 mr-1">
        <ToolBtn
          active={mode === "select"}
          onClick={() => setMode("select")}
          title="Select (V)"
        >
          <IconCursor className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          active={mode === "hand"}
          onClick={() => setMode("hand")}
          title="Pan (H)"
        >
          <IconHand className="w-4 h-4" />
        </ToolBtn>
      </div>

      <Separator />

      {/* Group 2 — Add Layer Actions */}
      <div className="flex items-center gap-0.5 mr-1">
        <ToolBtn onClick={handleAddText} title="Add Text Layer">
          <span className="relative">
            <IconType className="w-4 h-4" />
            <IconPlus className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-primary-400" />
          </span>
        </ToolBtn>
        <ToolBtn onClick={handleAddShape} title="Add Shape Layer">
          <span className="relative">
            <RectangleIcon />
            <IconPlus className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-primary-400" />
          </span>
        </ToolBtn>
        <IconPickerPopover
          onSelect={handleAddIcon}
          trigger={
            <ToolBtn title="Add Icon Layer">
              <span className="relative">
                <StarIcon />
                <IconPlus className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-primary-400" />
              </span>
            </ToolBtn>
          }
        />
      </div>

      <Separator />

      {/* Group 3 — Undo / Redo */}
      <div className="flex items-center gap-0.5 mr-1">
        <ToolBtn
          onClick={undoCmd}
          disabled={!canUndoVal}
          title="Undo (Ctrl+Z)"
        >
          <IconUndo className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn
          onClick={redoCmd}
          disabled={!canRedoVal}
          title="Redo (Ctrl+Shift+Z)"
        >
          <IconRedo className="w-4 h-4" />
        </ToolBtn>
      </div>

      <Separator />

      {/* Group 4 — Zoom */}
      <div className="flex items-center gap-0.5 mr-1">
        <ToolBtn onClick={zoomOut} title="Zoom Out (-)">
          <IconZoomOut className="w-4 h-4" />
        </ToolBtn>
        <button
          onClick={() => zoomTo(1)}
          className="px-1.5 py-0.5 text-[10px] font-mono text-gray-400 hover:text-gray-200 rounded hover:bg-gray-800 transition-colors min-w-10 text-center"
          title="Reset to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>
        <ToolBtn onClick={zoomIn} title="Zoom In (+)">
          <IconZoomIn className="w-4 h-4" />
        </ToolBtn>
        {canvasSize && (
          <ToolBtn
            onClick={() => fitToCanvas(canvasSize.w, canvasSize.h)}
            title="Fit to Canvas"
          >
            <IconFitView className="w-4 h-4" />
          </ToolBtn>
        )}
      </div>

      <Separator />

      {/* Group 5 — Alignment (Contextual) */}
      {selCount >= 1 && (
        <>
          <AlignDistributeBar />
          <Separator />
        </>
      )}

      {/* Group 6 — View Toggles */}
      <div className="flex items-center gap-0.5">
        <ToggleBtn
          active={showGrid}
          onClick={() => setViewport({ showGrid: !showGrid })}
          title="Toggle Grid"
        >
          <IconGrid className="w-4 h-4" />
        </ToggleBtn>
        <ToggleBtn
          active={showGuides}
          onClick={() => setViewport({ showGuides: !showGuides })}
          title="Toggle Guides"
        >
          <IconGuides className="w-4 h-4" />
        </ToggleBtn>
        <ToggleBtn
          active={snapEnabled}
          onClick={() => setViewport({ snapEnabled: !snapEnabled })}
          title="Toggle Snap"
        >
          <IconMagnet className="w-4 h-4" />
        </ToggleBtn>
        <ToggleBtn
          active={showBleedSafe}
          onClick={() => setViewport({ showBleedSafe: !showBleedSafe })}
          title="Toggle Bleed/Safe Area"
        >
          <IconBleedSafe className="w-4 h-4" />
        </ToggleBtn>
      </div>

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline mini icons (for add-layer badges where we need a specific simple shape)
// ---------------------------------------------------------------------------

function RectangleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Reusable buttons
// ---------------------------------------------------------------------------

function ToolBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors
        ${active ? "bg-primary-500/20 text-primary-400 border border-primary-500/30" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent"}
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );
}

function ToggleBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors ${
        active
          ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800 border border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-5 bg-gray-700/50 mx-1" />;
}
