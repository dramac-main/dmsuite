/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — FabricEditor (Main Editor Shell)
 *
 *  The universal visual editor component for all Fabric.js-based tools.
 *  Initializes the canvas, renders sidebar + toolbar + footer, provides
 *  the Editor API to child components via context.
 *
 *  Usage:
 *    <FabricEditor
 *      config={{ toolId: "certificate-designer", defaultWidth: 1056, ... }}
 *      defaultState={savedJson}
 *      onSave={(json, w, h) => saveToSupabase(json, w, h)}
 *    />
 *  ═══════════════════════════════════════════════════════════════════════════ */

"use client";

import { fabric } from "fabric";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useEditor, type Editor, type ActiveTool, type FabricEditorConfig, SELECTION_DEPENDENT_TOOLS, FONTS, createFabricManifest } from "@/lib/fabric-editor";
import { ensureFontReady } from "@/lib/fabric-editor/font-loader";
import { useChikoActionRegistry, type ChikoActionManifest } from "@/stores/chiko-actions";
import { EditorToolbar } from "./EditorToolbar";
import { EditorSidebar } from "./EditorSidebar";
import { EditorFooter } from "./EditorFooter";
import { EditorNavbar } from "./EditorNavbar";

// ── Context ─────────────────────────────────────────────────────────────────

interface FabricEditorContextValue {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  config: FabricEditorConfig;
}

const FabricEditorContext = createContext<FabricEditorContextValue | null>(null);

export function useFabricEditor() {
  const ctx = useContext(FabricEditorContext);
  if (!ctx) throw new Error("useFabricEditor must be used within <FabricEditor>");
  return ctx;
}

// ── Props ───────────────────────────────────────────────────────────────────

interface FabricEditorProps {
  /** Tool-specific configuration (size, templates, quick-edit fields, etc.) */
  config: FabricEditorConfig;
  /** Previously saved Fabric JSON (project reload) */
  defaultState?: string;
  /** Called when the editor auto-saves */
  onSave?: (json: string, width: number, height: number) => void;
  /** Optional extra sidebar content (tool-specific panels) */
  extraSidebar?: ReactNode;
  /** Optional extra navbar content (tool-specific buttons) */
  extraNavbar?: ReactNode;
  /**
   * Optional manifest factory for Chiko AI integration.
   * If provided, the returned manifest is registered with the Chiko action registry.
   * If omitted, a default manifest (core actions only) is registered automatically.
   */
  chikoManifestFactory?: (editor: Editor) => ChikoActionManifest;
}

// ── Component ───────────────────────────────────────────────────────────────

export function FabricEditor({
  config,
  defaultState,
  onSave,
  extraSidebar,
  extraNavbar,
  chikoManifestFactory,
}: FabricEditorProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>("select");

  const onClearSelection = useCallback(() => {
    if (SELECTION_DEPENDENT_TOOLS.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    defaultState,
    defaultWidth: config.defaultWidth,
    defaultHeight: config.defaultHeight,
    clearSelectionCallback: onClearSelection,
    saveCallback: onSave
      ? (values) => onSave(values.json, values.width, values.height)
      : undefined,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current,
    });

    return () => {
      canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-load Google Fonts so sidebar previews render correctly
  useEffect(() => {
    for (const font of FONTS) {
      ensureFontReady(font);
    }
  }, []);

  // ── Chiko AI action registration ──────────────────────────────────────
  const chikoRegister = useChikoActionRegistry((s) => s.register);
  const chikoUnregister = useChikoActionRegistry((s) => s.unregister);

  useEffect(() => {
    if (!editor) return;

    const manifest = chikoManifestFactory
      ? chikoManifestFactory(editor)
      : createFabricManifest({
          toolId: config.toolId,
          toolName: config.toolId
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          editor,
        });

    chikoRegister(manifest);
    return () => chikoUnregister(manifest.toolId);
  }, [editor, chikoManifestFactory, config.toolId, chikoRegister, chikoUnregister]);

  const contextValue: FabricEditorContextValue = {
    editor,
    activeTool,
    setActiveTool,
    config,
  };

  return (
    <FabricEditorContext.Provider value={contextValue}>
      <div className="flex h-full w-full flex-col overflow-hidden bg-gray-950">
        {/* Top navbar — save/export/undo/redo/zoom */}
        <EditorNavbar extra={extraNavbar} />

        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar — tool palette */}
          <EditorSidebar extra={extraSidebar} />

          {/* Center — canvas */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Context-sensitive toolbar */}
            <EditorToolbar />

            {/* Canvas container */}
            <div
              ref={containerRef}
              className="relative flex-1 overflow-hidden bg-gray-900"
            >
              <canvas ref={canvasRef} />
            </div>

            {/* Footer — zoom slider, info */}
            <EditorFooter />
          </div>
        </div>
      </div>
    </FabricEditorContext.Provider>
  );
}
