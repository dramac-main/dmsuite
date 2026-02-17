"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconSparkles,
  IconDownload,
  IconLoader,
  IconCopy,
  IconDroplet,
  IconType,
  IconWand,
  IconImage,
  IconX,
  IconLayout,
} from "@/components/icons";
import StockImagePicker, { type StockImage } from "@/components/StockImagePicker";
import {
  hexToRgba,
  getContrastColor,
  getCanvasFont,
  getLetterSpacing,
  getLineHeight,
  drawDesignBackground,
  applyOverlay,
  drawCoverImage,
  cleanAIText,
  type FontStyle,
} from "@/lib/canvas-utils";
import {
  type Layer,
  type TextLayer,
  type CtaLayer,
  type ShapeLayer,
  type DesignDocument,
  type Point,
  createTextLayer,
  createShapeLayer,
  createCtaLayer,
  renderLayer,
  hitTest,
  drawSelectionHandles,
  getResizeHandle,
  deleteLayer,
  reorderLayer,
  duplicateLayer,
  renderToSize,
} from "@/lib/canvas-layers";
import { jsPDF } from "jspdf";
import {
  type CompositionType,
  type ExportFormat,
  getCompositionTemplates,
  getExportFormats,
  getExportFormatsByPlatform,
  getDeviceMockups,
  generateLayoutLayers,
  renderDeviceMockup,
  buildDesignDirectorPrompt,
  parseAIDesignDirective,
  renderCompositionFoundation,
  renderFullDesignToCanvas,
} from "@/lib/design-foundation";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";

/* ── Types ─────────────────────────────────────────────────── */

interface PosterConfig {
  format: string;
  composition: CompositionType;
  headline: string;
  subtext: string;
  ctaText: string;
  label: string;
  eventDate: string;
  venue: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  fontStyle: FontStyle;
  description: string;
  backgroundImage: StockImage | null;
  overlayIntensity: number;
  brandLogo: string;
  visualIntensity: number;
}

/* ── Format Presets ──────────────────────────────────────── */

const formats = [
  { id: "a3-portrait", label: "A3 Portrait", width: 1191, height: 1684, icon: "📄" },
  { id: "a4-portrait", label: "A4 Portrait", width: 794, height: 1123, icon: "📃" },
  { id: "a5-portrait", label: "A5 Portrait", width: 559, height: 794, icon: "📋" },
  { id: "tabloid", label: "Tabloid (11×17\")", width: 1056, height: 1632, icon: "🗞️" },
  { id: "letter-portrait", label: "Letter Portrait", width: 816, height: 1056, icon: "📝" },
  { id: "square", label: "Square", width: 1080, height: 1080, icon: "⬜" },
  { id: "dl-flyer", label: "DL Flyer", width: 396, height: 846, icon: "📜" },
  { id: "a5-landscape", label: "A5 Landscape", width: 794, height: 559, icon: "🖼️" },
] as const;

/* ── Composition Options ─────────────────────────────────── */

const compositionOptions: { id: CompositionType; label: string; desc: string }[] = [
  { id: "centered-hero", label: "Centered Hero", desc: "Strong center focal" },
  { id: "editorial-spread", label: "Editorial", desc: "Magazine columns" },
  { id: "asymmetric-tension", label: "Asymmetric", desc: "Dynamic tension" },
  { id: "z-pattern", label: "Z-Pattern", desc: "Natural flow" },
  { id: "diagonal-dynamic", label: "Diagonal", desc: "Energy & movement" },
  { id: "golden-ratio", label: "Golden Ratio", desc: "Harmonic balance" },
  { id: "rule-of-thirds", label: "Rule of Thirds", desc: "Classic composition" },
  { id: "full-bleed", label: "Full Bleed", desc: "Max visual impact" },
  { id: "split-panel", label: "Split Panel", desc: "Half & half" },
  { id: "layered-depth", label: "Layered", desc: "Depth & parallax" },
  { id: "minimal-whitespace", label: "Minimal", desc: "Clean whitespace" },
  { id: "typographic-poster", label: "Typographic", desc: "Type as art" },
];

/* ── Color Themes ────────────────────────────────────────── */

const colorThemes = [
  { name: "Lime", primary: "#8ae600", secondary: "#030712", text: "#ffffff" },
  { name: "Midnight", primary: "#6366f1", secondary: "#0f0f23", text: "#ffffff" },
  { name: "Sunset", primary: "#f97316", secondary: "#1a0a00", text: "#ffffff" },
  { name: "Rose", primary: "#f43f5e", secondary: "#1a0005", text: "#ffffff" },
  { name: "Ocean", primary: "#06b6d4", secondary: "#021a22", text: "#ffffff" },
  { name: "Royal", primary: "#a855f7", secondary: "#10002a", text: "#ffffff" },
  { name: "Clean", primary: "#18181b", secondary: "#ffffff", text: "#18181b" },
  { name: "Warm", primary: "#ea580c", secondary: "#1c0800", text: "#fef2e8" },
] as const;

/* ── Interaction State ───────────────────────────────────── */

interface InteractionState {
  mode: "select" | "pan" | "resize";
  isDragging: boolean;
  dragStart: Point;
  dragOffset: Point;
  resizeHandle: string | null;
  resizeStart: { x: number; y: number; width: number; height: number } | null;
}

/* ── Component ───────────────────────────────────────────── */

export default function PosterFlyerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState("");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "export" | "present">("design");
  const [selectedExports, setSelectedExports] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  /* ── Print & Layout state ────────────────────────────── */
  const [showBleed, setShowBleed] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const [config, setConfig] = useState<PosterConfig>({
    format: "a4-portrait",
    composition: "typographic-poster",
    headline: "",
    subtext: "",
    ctaText: "",
    label: "",
    eventDate: "",
    venue: "",
    primaryColor: "#8ae600",
    secondaryColor: "#030712",
    textColor: "#ffffff",
    fontStyle: "modern",
    description: "",
    backgroundImage: null,
    overlayIntensity: 70,
    brandLogo: "",
    visualIntensity: 2,
  });

  /* ── Design Document ───────────────────────────────────── */
  const currentFormat = useMemo(
    () => formats.find((f) => f.id === config.format) ?? formats[1],
    [config.format]
  );

  const [doc, setDoc] = useState<DesignDocument>(() => ({
    id: `doc_${Date.now()}`,
    name: "Poster / Flyer",
    width: 794,
    height: 1123,
    backgroundColor: "#030712",
    layers: [],
    layerOrder: [],
    selectedLayers: [],
    history: [],
    historyIndex: 0,
    meta: {
      category: "poster",
      platform: "a4-portrait",
      layout: "typographic-poster",
      fontStyle: "modern" as FontStyle,
      accentColor: "#8ae600",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  }));
  const [undoStack, setUndoStack] = useState<DesignDocument[]>([]);
  const [redoStack, setRedoStack] = useState<DesignDocument[]>([]);

  /* ── Interaction ───────────────────────────────────────── */
  const [interaction, setInteraction] = useState<InteractionState>({
    mode: "select",
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    resizeHandle: null,
    resizeStart: null,
  });

  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["format", "composition", "content"])
  );

  const updateConfig = useCallback((partial: Partial<PosterConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const pushUndo = useCallback((d: DesignDocument) => {
    setUndoStack((prev) => [...prev.slice(-30), d]);
    setRedoStack([]);
  }, []);

  const updateDocument = useCallback(
    (updater: (prev: DesignDocument) => DesignDocument) => {
      setDoc((prev) => {
        pushUndo(prev);
        return updater(prev);
      });
    },
    [pushUndo]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    setRedoStack((prev) => [...prev, doc]);
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setDoc(previous);
  }, [undoStack, doc]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    setUndoStack((prev) => [...prev, doc]);
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setDoc(next);
  }, [redoStack, doc]);

  /* ── Generate Layers ───────────────────────────────────── */
  const generateLayers = useCallback(() => {
    const templates = getCompositionTemplates();
    const template = templates.find((t) => t.type === config.composition);
    if (!template) return;

    const w = currentFormat.width;
    const h = currentFormat.height;

    // Build content, including event fields if present
    const subtextParts = [config.subtext || "Add your supporting text"];
    if (config.eventDate) subtextParts.push(`📅 ${config.eventDate}`);
    if (config.venue) subtextParts.push(`📍 ${config.venue}`);

    const layers = generateLayoutLayers(
      template,
      {
        headline: config.headline || "Your Headline Here",
        subtext: subtextParts.join("\n"),
        ctaText: config.ctaText || "",
        label: config.label || "",
        brandName: config.brandLogo || undefined,
      },
      { width: w, height: h },
      {
        fontStyle: config.fontStyle,
        accentColor: config.primaryColor,
        textColor: config.textColor,
        bgColor: config.secondaryColor,
      },
      config.visualIntensity
    );

    const layerOrder = layers.map((l) => l.id);

    setDoc({
      id: `doc_${Date.now()}`,
      name: "Poster / Flyer",
      width: w,
      height: h,
      backgroundColor: config.secondaryColor,
      layers,
      layerOrder,
      selectedLayers: [],
      history: [],
      historyIndex: 0,
      meta: {
        category: "poster",
        platform: config.format,
        layout: config.composition,
        fontStyle: config.fontStyle,
        accentColor: config.primaryColor,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
    setUndoStack([]);
    setRedoStack([]);
  }, [config, currentFormat]);

  useEffect(() => {
    generateLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.composition,
    config.format,
    config.primaryColor,
    config.secondaryColor,
    config.textColor,
    config.fontStyle,
    config.headline,
    config.subtext,
    config.ctaText,
    config.label,
    config.eventDate,
    config.venue,
    config.brandLogo,
  ]);

  /* ── Load background ───────────────────────────────────── */
  useEffect(() => {
    if (!config.backgroundImage) {
      setLoadedImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setLoadedImage(img);
    img.onerror = () => setLoadedImage(null);
    img.src = config.backgroundImage.urls.regular;
  }, [config.backgroundImage]);

  /* ── Render canvas ─────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = currentFormat.width;
    const h = currentFormat.height;
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Background
    if (loadedImage) {
      drawCoverImage(ctx, loadedImage, w, h);
      applyOverlay(ctx, w, h, "gradient-bottom", config.secondaryColor, config.overlayIntensity / 100);
    } else {
      drawDesignBackground(ctx, w, h, config.secondaryColor, config.primaryColor);
    }

    // Composition foundation art (background shapes — not selectable)
    renderCompositionFoundation(ctx, config.composition, w, h, {
      accentColor: config.primaryColor,
      bgColor: config.secondaryColor,
      textColor: config.textColor,
    }, config.visualIntensity);

    // Render layers back-to-front
    for (let i = doc.layerOrder.length - 1; i >= 0; i--) {
      const id = doc.layerOrder[i];
      const layer = doc.layers.find((l) => l.id === id);
      if (layer) renderLayer(ctx, layer);
    }

    // Selection handles
    for (const id of doc.selectedLayers) {
      const layer = doc.layers.find((l) => l.id === id);
      if (layer) drawSelectionHandles(ctx, layer);
    }

    /* ── Grid Overlay ──────────────────────────────────── */
    if (showGrid && gridSize > 4) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 0.5;
      for (let gx = gridSize; gx < w; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = gridSize; gy < h; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ── QR Code Placeholder ───────────────────────────── */
    if (qrCodeUrl.trim()) {
      const qrSize = Math.min(w, h) * 0.12;
      const qrX = w - qrSize - 20;
      const qrY = h - qrSize - 20;
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);
      // Draw a simple QR-like pattern
      const cellCount = 7;
      const cellSize = (qrSize - 8) / cellCount;
      const pattern = [
        [1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1],
        [1,0,1,1,1,0,1],
        [1,0,1,0,1,0,1],
        [1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1],
        [1,1,1,1,1,1,1],
      ];
      ctx.fillStyle = "#000000";
      for (let row = 0; row < cellCount; row++) {
        for (let col = 0; col < cellCount; col++) {
          if (pattern[row][col]) {
            ctx.fillRect(qrX + 4 + col * cellSize, qrY + 4 + row * cellSize, cellSize, cellSize);
          }
        }
      }
      ctx.font = `bold ${Math.max(8, qrSize * 0.14)}px sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("QR", qrX + qrSize / 2, qrY + qrSize / 2);
      ctx.restore();
    }

    /* ── Print Bleed & Trim Marks ──────────────────────── */
    if (showBleed) {
      const bleed = 11.3; // 3mm ≈ 11.3px at 96dpi
      const markLen = 20;
      ctx.save();
      // Bleed overlay — semi-transparent red around edges
      ctx.fillStyle = "rgba(255, 0, 0, 0.12)";
      ctx.fillRect(0, 0, w, bleed);           // top
      ctx.fillRect(0, h - bleed, w, bleed);   // bottom
      ctx.fillRect(0, bleed, bleed, h - bleed * 2); // left
      ctx.fillRect(w - bleed, bleed, bleed, h - bleed * 2); // right

      // Trim marks — corner crop marks
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
      ctx.lineWidth = 1;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(bleed, 0); ctx.lineTo(bleed, markLen);
      ctx.moveTo(0, bleed); ctx.lineTo(markLen, bleed);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(w - bleed, 0); ctx.lineTo(w - bleed, markLen);
      ctx.moveTo(w, bleed); ctx.lineTo(w - markLen, bleed);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(bleed, h); ctx.lineTo(bleed, h - markLen);
      ctx.moveTo(0, h - bleed); ctx.lineTo(markLen, h - bleed);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(w - bleed, h); ctx.lineTo(w - bleed, h - markLen);
      ctx.moveTo(w, h - bleed); ctx.lineTo(w - markLen, h - bleed);
      ctx.stroke();
      ctx.restore();
    }

    /* ── Safe Zone Overlay ─────────────────────────────── */
    if (showSafeZone) {
      const safeInset = 37.8; // 10mm ≈ 37.8px at 96dpi
      ctx.save();
      // Green overlay outside safe area
      ctx.fillStyle = "rgba(0, 200, 80, 0.06)";
      ctx.fillRect(0, 0, w, safeInset);                             // top
      ctx.fillRect(0, h - safeInset, w, safeInset);                 // bottom
      ctx.fillRect(0, safeInset, safeInset, h - safeInset * 2);     // left
      ctx.fillRect(w - safeInset, safeInset, safeInset, h - safeInset * 2); // right

      // Dashed border at safe zone
      ctx.strokeStyle = "rgba(0, 200, 80, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(safeInset, safeInset, w - safeInset * 2, h - safeInset * 2);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [doc, config, currentFormat, loadedImage, showBleed, showSafeZone, showGrid, gridSize, qrCodeUrl]);

  /* ── Canvas Interaction ────────────────────────────────── */
  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = getCanvasPoint(e);

      if (doc.selectedLayers.length === 1) {
        const sel = doc.layers.find((l) => l.id === doc.selectedLayers[0]);
        if (sel) {
          const handle = getResizeHandle(sel, point);
          if (handle) {
            setInteraction({
              mode: "resize",
              isDragging: true,
              dragStart: point,
              dragOffset: { x: 0, y: 0 },
              resizeHandle: handle,
              resizeStart: { x: sel.x, y: sel.y, width: sel.width, height: sel.height },
            });
            return;
          }
        }
      }

      const hit = hitTest(doc.layers, doc.layerOrder, point);
      if (hit) {
        updateDocument((d) => ({ ...d, selectedLayers: [hit.id] }));
        setInteraction({
          mode: "select",
          isDragging: true,
          dragStart: point,
          dragOffset: { x: point.x - hit.x, y: point.y - hit.y },
          resizeHandle: null,
          resizeStart: null,
        });
      } else {
        updateDocument((d) => ({ ...d, selectedLayers: [] }));
        setInteraction((prev) => ({ ...prev, isDragging: false }));
      }
    },
    [doc, getCanvasPoint, updateDocument]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interaction.isDragging) return;
      const point = getCanvasPoint(e);

      if (interaction.mode === "resize" && interaction.resizeStart && interaction.resizeHandle) {
        const dx = point.x - interaction.dragStart.x;
        const dy = point.y - interaction.dragStart.y;
        const start = interaction.resizeStart;
        const handle = interaction.resizeHandle;

        setDoc((prev) => {
          const layers = prev.layers.map((l) => {
            if (!prev.selectedLayers.includes(l.id)) return l;
            const updated = { ...l };
            if (handle.includes("e")) updated.width = Math.max(20, start.width + dx);
            if (handle.includes("w")) {
              updated.x = start.x + dx;
              updated.width = Math.max(20, start.width - dx);
            }
            if (handle.includes("s")) updated.height = Math.max(20, start.height + dy);
            if (handle.includes("n")) {
              updated.y = start.y + dy;
              updated.height = Math.max(20, start.height - dy);
            }
            if (updated.type === "text") (updated as TextLayer).maxWidth = updated.width;
            return updated;
          });
          return { ...prev, layers };
        });
      } else if (interaction.mode === "select" && doc.selectedLayers.length > 0) {
        setDoc((prev) => {
          const layers = prev.layers.map((l) => {
            if (!prev.selectedLayers.includes(l.id)) return l;
            return {
              ...l,
              x: point.x - interaction.dragOffset.x,
              y: point.y - interaction.dragOffset.y,
            };
          });
          return { ...prev, layers };
        });
      }
    },
    [interaction, doc.selectedLayers, getCanvasPoint]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setInteraction((prev) => ({
      ...prev,
      isDragging: false,
      resizeHandle: null,
      resizeStart: null,
    }));
  }, []);

  /* ── Keyboard shortcuts ─────────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if ((e.key === "Delete" || e.key === "Backspace") && doc.selectedLayers.length > 0) {
        e.preventDefault();
        updateDocument((d) => {
          let result = d;
          for (const id of d.selectedLayers) result = deleteLayer(result, id);
          return result;
        });
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if (e.key === "d" && (e.ctrlKey || e.metaKey) && doc.selectedLayers.length === 1) {
        e.preventDefault();
        updateDocument((d) => duplicateLayer(d, d.selectedLayers[0]));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [doc.selectedLayers, updateDocument, handleUndo, handleRedo]);

  /* ── Layer helpers ─────────────────────────────────────── */
  const handleDeleteSelected = useCallback(() => {
    if (doc.selectedLayers.length === 0) return;
    updateDocument((d) => {
      let result = d;
      for (const id of d.selectedLayers) result = deleteLayer(result, id);
      return result;
    });
  }, [doc.selectedLayers, updateDocument]);

  const handleReorderLayer = useCallback(
    (layerId: string, direction: "up" | "down" | "top" | "bottom") => {
      updateDocument((d) => reorderLayer(d, layerId, direction));
    },
    [updateDocument]
  );

  const updateLayerProperty = useCallback(
    (layerId: string, updates: Record<string, unknown>) => {
      updateDocument((d) => ({
        ...d,
        layers: d.layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l)),
      }));
    },
    [updateDocument]
  );

  /* ── AI Design Director ─────────────────────────────────── */
  const hasExistingDesign = Boolean(config.headline || config.subtext || config.ctaText);

  const generateFullDesign = useCallback(async (mode: "fresh" | "revise" = "fresh") => {
    if (!config.description.trim()) return;
    setIsGenerating(true);
    try {
      const revision = mode === "revise" && revisionRequest.trim()
        ? {
            currentDesign: {
              headline: config.headline,
              subtext: config.subtext,
              ctaText: config.ctaText,
              label: config.label,
              composition: config.composition,
              primaryColor: config.primaryColor,
              secondaryColor: config.secondaryColor,
              textColor: config.textColor,
              fontStyle: config.fontStyle,
              visualIntensity: config.visualIntensity,
            },
            revisionRequest: revisionRequest.trim(),
          }
        : undefined;

      const prompt = buildDesignDirectorPrompt(
        config.description,
        "poster",
        { width: currentFormat.width, height: currentFormat.height },
        { format: config.format },
        revision
      );

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      if (!response.ok) throw new Error("Generation failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      let fullText = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      const directive = parseAIDesignDirective(fullText);
      if (directive) {
        const updates: Partial<PosterConfig> = {};
        if (directive.copy) {
          if (directive.copy.headline) updates.headline = cleanAIText(directive.copy.headline);
          if (directive.copy.subtext) updates.subtext = cleanAIText(directive.copy.subtext);
          if (directive.copy.ctaText) updates.ctaText = cleanAIText(directive.copy.ctaText);
          if (directive.copy.label) updates.label = cleanAIText(directive.copy.label);
        }
        if (directive.colors) {
          updates.primaryColor = directive.colors.primary;
          updates.secondaryColor = directive.colors.secondary;
          updates.textColor = directive.colors.text;
        }
        if (directive.fontStyle) updates.fontStyle = directive.fontStyle;
        if (directive.composition) updates.composition = directive.composition;
        if (directive.visualIntensity !== undefined) updates.visualIntensity = directive.visualIntensity;

        updateConfig(updates);
        if (mode === "revise") setRevisionRequest("");
      }
    } catch {
      /* AI design generation failed silently */
    } finally {
      setIsGenerating(false);
    }
  }, [config, currentFormat, updateConfig, revisionRequest]);

  /* ── Multi-Format Export ───────────────────────────────── */
  const exportFormats = useMemo(() => getExportFormats(), []);
  const exportByPlatform = useMemo(() => getExportFormatsByPlatform(), []);

  const toggleExportFormat = useCallback((id: string) => {
    setSelectedExports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleMultiExport = useCallback(async () => {
    if (selectedExports.size === 0) return;
    setIsExporting(true);
    try {
      for (const formatId of selectedExports) {
        const format = exportFormats.find((f: ExportFormat) => f.id === formatId);
        if (!format) continue;

        const exportCanvas = renderToSize(doc, format.width, format.height);
        if (loadedImage) {
          const ctx2 = exportCanvas.getContext("2d");
          if (ctx2) {
            ctx2.save();
            ctx2.globalCompositeOperation = "destination-over";
            drawCoverImage(ctx2, loadedImage, format.width, format.height);
            ctx2.restore();
          }
        }

        const blob = await new Promise<Blob | null>((resolve) =>
          exportCanvas.toBlob((b) => resolve(b), "image/png")
        );
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = window.document.createElement("a");
          a.href = url;
          a.download = `${config.headline || "poster"}-${format.id}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        await new Promise((r) => setTimeout(r, 300));
      }
    } finally {
      setIsExporting(false);
    }
  }, [selectedExports, exportFormats, doc, config.headline, loadedImage]);

  /* ── Device Mockup ─────────────────────────────────────── */
  const deviceMockups = useMemo(() => getDeviceMockups(), []);
  const [activeMockup, setActiveMockup] = useState<string | null>(null);
  const mockupCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!activeMockup || !mockupCanvasRef.current) return;
    const mockup = deviceMockups.find((m) => m.id === activeMockup);
    if (!mockup) return;

    /* Build a complete design on an offscreen canvas */
    const designConfig = {
      width: doc.width,
      height: doc.height,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      textColor: config.textColor,
      composition: config.composition,
      visualIntensity: config.visualIntensity,
      fontStyle: config.fontStyle as FontStyle,
      overlayIntensity: config.overlayIntensity,
      brandLogo: config.brandLogo,
      loadedImage: loadedImage ?? undefined,
    };
    const offscreen = renderFullDesignToCanvas(doc, designConfig);

    const result = renderDeviceMockup(offscreen, mockup, {
      backgroundColor: "#1a1a2e",
      showAppChrome: false,
    });

    const mctx = mockupCanvasRef.current.getContext("2d");
    if (!mctx) return;
    mockupCanvasRef.current.width = result.width;
    mockupCanvasRef.current.height = result.height;
    mctx.drawImage(result, 0, 0);
  }, [activeMockup, doc, config, loadedImage, deviceMockups]);

  /* ── Downloads ─────────────────────────────────────────── */
  const handleDownloadPng = useCallback(() => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `poster-${config.format}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [config.format]);

  const handleDownloadJpg = useCallback(() => {
    canvasRef.current?.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = `poster-${config.format}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      },
      "image/jpeg",
      0.95
    );
  }, [config.format]);

  const handleCopyCanvas = useCallback(async () => {
    try {
      canvasRef.current?.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch {
      /* clipboard not available */
    }
  }, []);

  const handleDownloadMockup = useCallback(() => {
    mockupCanvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `mockup-${activeMockup}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [activeMockup]);

  /* ── PDF Export ──────────────────────────────────────── */
  const handleDownloadPdf = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = currentFormat.width;
    const h = currentFormat.height;
    const pxToMm = (px: number) => px * 0.2645833;
    const wMm = pxToMm(w);
    const hMm = pxToMm(h);
    const orientation = wMm > hMm ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "mm", format: [wMm, hMm] });

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, wMm, hMm);

    // Draw crop marks in PDF if bleed is enabled
    if (showBleed) {
      const bleedMm = 3;
      const markLenMm = 5;
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.25);
      // Top-left
      pdf.line(bleedMm, 0, bleedMm, markLenMm);
      pdf.line(0, bleedMm, markLenMm, bleedMm);
      // Top-right
      pdf.line(wMm - bleedMm, 0, wMm - bleedMm, markLenMm);
      pdf.line(wMm, bleedMm, wMm - markLenMm, bleedMm);
      // Bottom-left
      pdf.line(bleedMm, hMm, bleedMm, hMm - markLenMm);
      pdf.line(0, hMm - bleedMm, markLenMm, hMm - bleedMm);
      // Bottom-right
      pdf.line(wMm - bleedMm, hMm, wMm - bleedMm, hMm - markLenMm);
      pdf.line(wMm, hMm - bleedMm, wMm - markLenMm, hMm - bleedMm);
    }

    pdf.save(`poster-${config.format}.pdf`);
  }, [config.format, currentFormat, showBleed]);

  /* ── Helpers ───────────────────────────────────────────── */
  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Zoom / Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(0.75);
  const displayWidth = Math.min(600, currentFormat.width) * zoom;
  const displayHeight = displayWidth * (currentFormat.height / currentFormat.width);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => compositionOptions.map((c) => ({
      id: c.id,
      label: c.label,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.fillStyle = config.secondaryColor;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = config.primaryColor;
        if (c.id === "centered-hero") { ctx.fillRect(w * 0.2, h * 0.15, w * 0.6, h * 0.4); }
        else if (c.id === "editorial-spread") { ctx.fillRect(0, 0, w * 0.4, h); ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fillRect(w * 0.45, h * 0.1, w * 0.5, h * 0.25); ctx.fillRect(w * 0.45, h * 0.4, w * 0.5, h * 0.25); }
        else if (c.id === "diagonal-dynamic") { ctx.beginPath(); ctx.moveTo(0, h * 0.6); ctx.lineTo(w, h * 0.2); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.fill(); }
        else if (c.id === "split-panel") { ctx.fillRect(0, 0, w * 0.5, h); }
        else if (c.id === "full-bleed") { ctx.globalAlpha = 0.3; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
        else if (c.id === "typographic-poster") { ctx.fillRect(w * 0.1, h * 0.25, w * 0.8, h * 0.08); ctx.globalAlpha = 0.4; ctx.fillRect(w * 0.1, h * 0.4, w * 0.6, h * 0.04); ctx.globalAlpha = 1; }
        else { ctx.fillRect(w * 0.1, h * 0.1, w * 0.35, h * 0.35); }
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 8px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(c.label, w / 2, h - 8);
      },
    })),
    [config.primaryColor, config.secondaryColor]
  );

  /* ── Copy to Clipboard ──────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* ignore */ }
  }, []);

  const selectedLayer =
    doc.selectedLayers.length === 1
      ? doc.layers.find((l) => l.id === doc.selectedLayers[0]) ?? null
      : null;

  /* ── Panel Definitions for StickyCanvasLayout ───────────── */

  const leftPanel = (
    <div className="space-y-3">
      {/* AI Design Director */}
      <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
        <label className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-secondary-500 mb-2">
          <IconSparkles className="size-3" />
          AI Design Director
        </label>
        <textarea
          rows={2}
          placeholder="Describe your event or product…"
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-secondary-500/20 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-secondary-500/50 focus:ring-2 focus:ring-secondary-500/20 transition-all resize-none mb-2"
        />
        <button
          onClick={() => generateFullDesign("fresh")}
          disabled={!config.description.trim() || isGenerating}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-linear-to-r from-secondary-500 to-primary-500 text-white text-[0.625rem] font-bold hover:from-secondary-400 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <IconLoader className="size-3 animate-spin" />
              Designing…
            </>
          ) : (
            <>
              <IconWand className="size-3" />
              {hasExistingDesign ? "Regenerate Design" : "Generate Full Design"}
            </>
          )}
        </button>
        {hasExistingDesign && (
          <div className="mt-2 space-y-1.5">
            <input
              type="text"
              placeholder="e.g. Make the headline bigger, use warmer colors…"
              value={revisionRequest}
              onChange={(e) => setRevisionRequest(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && revisionRequest.trim()) generateFullDesign("revise"); }}
              className="w-full px-3 py-1.5 rounded-lg border border-secondary-500/20 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-secondary-500/50 focus:ring-2 focus:ring-secondary-500/20 transition-all"
            />
            <button
              onClick={() => generateFullDesign("revise")}
              disabled={!revisionRequest.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border border-secondary-500/30 text-secondary-400 text-[0.625rem] font-semibold hover:bg-secondary-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IconWand className="size-3" />
              Revise
            </button>
          </div>
        )}
      </div>

      {/* Template Slider (compositions) */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.composition}
        onSelect={(id) => updateConfig({ composition: id as CompositionType })}
        thumbWidth={140}
        thumbHeight={100}
        label="Composition"
      />

      {/* Format */}
      <Section
        icon={<IconLayout className="size-3.5" />}
        label="Format"
        id="format"
        open={openSections.has("format")}
        toggle={toggleSection}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => updateConfig({ format: f.id })}
              className={`p-2 rounded-xl border text-left transition-all ${
                config.format === f.id
                  ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs">{f.icon}</span>
                <span
                  className={`text-[0.625rem] font-semibold ${
                    config.format === f.id
                      ? "text-primary-500"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {f.label}
                </span>
              </div>
              <span className="text-[0.5625rem] text-gray-400">
                {f.width}×{f.height}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Background Image */}
      <Section
        icon={<IconImage className="size-3.5" />}
        label="Background"
        id="image"
        open={openSections.has("image")}
        toggle={toggleSection}
      >
        {config.backgroundImage ? (
          <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={config.backgroundImage.urls.small}
              alt={config.backgroundImage.description}
              className="w-full h-24 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => setImagePickerOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white/90 text-gray-900 text-[0.625rem] font-semibold hover:bg-white transition-colors"
              >
                Change
              </button>
              <button
                onClick={() => updateConfig({ backgroundImage: null })}
                className="size-6 rounded-lg bg-red-500/90 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
              >
                <IconX className="size-3" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setImagePickerOpen(true)}
            className="w-full h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-primary-500 hover:border-primary-500/30 transition-all"
          >
            <IconImage className="size-4" />
            <span className="text-[0.625rem] font-medium">Add background photo</span>
          </button>
        )}
        {config.backgroundImage && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[0.5625rem] font-semibold uppercase tracking-wider text-gray-400">
                Overlay
              </span>
              <span className="text-[0.5625rem] text-gray-500 tabular-nums">
                {config.overlayIntensity}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              value={config.overlayIntensity}
              onChange={(e) => updateConfig({ overlayIntensity: parseInt(e.target.value) })}
              className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-500"
            />
          </div>
        )}
      </Section>

      {/* Style */}
      <Section
        icon={<IconDroplet className="size-3.5" />}
        label="Style"
        id="style"
        open={openSections.has("style")}
        toggle={toggleSection}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1">
            {colorThemes.map((theme) => (
              <button
                key={theme.name}
                onClick={() =>
                  updateConfig({
                    primaryColor: theme.primary,
                    secondaryColor: theme.secondary,
                    textColor: theme.text,
                  })
                }
                className={`p-1 rounded-lg border text-center transition-all ${
                  config.primaryColor === theme.primary && config.secondaryColor === theme.secondary
                    ? "border-primary-500 ring-1 ring-primary-500/30"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex gap-0.5 justify-center mb-0.5">
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <div className="size-2.5 rounded-full" style={{ backgroundColor: theme.secondary }} />
                </div>
                <span className="text-[0.5rem] text-gray-400">{theme.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                className="size-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
              />
              <span className="text-[0.5625rem] text-gray-400">Accent</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="color"
                value={config.secondaryColor}
                onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                className="size-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
              />
              <span className="text-[0.5625rem] text-gray-400">BG</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="color"
                value={config.textColor}
                onChange={(e) => updateConfig({ textColor: e.target.value })}
                className="size-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
              />
              <span className="text-[0.5625rem] text-gray-400">Text</span>
            </label>
          </div>
          <div>
            <p className="text-[0.5625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Typography
            </p>
            <div className="flex flex-wrap gap-1">
              {(["modern", "classic", "bold", "elegant"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => updateConfig({ fontStyle: style })}
                  className={`px-2.5 py-1 rounded-lg border text-[0.625rem] font-semibold capitalize transition-all ${
                    config.fontStyle === style
                      ? "border-primary-500 bg-primary-500/5 text-primary-500"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Print & Layout */}
      <Section
        icon={
          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="6" y="6" width="12" height="12" />
            <path d="M6 2v4M18 2v4M6 18v4M18 18v4M2 6h4M2 18h4M18 6h4M18 18h4" />
          </svg>
        }
        label="Print & Layout"
        id="print-layout"
        open={openSections.has("print-layout")}
        toggle={toggleSection}
      >
        <div className="space-y-2.5">
          {/* Bleed toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[0.625rem] font-medium text-gray-600 dark:text-gray-300">Bleed &amp; Trim Marks (3mm)</span>
            <button
              onClick={() => setShowBleed((p) => !p)}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${
                showBleed ? "bg-red-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow transition-transform ${
                  showBleed ? "translate-x-3.5" : ""
                }`}
              />
            </button>
          </label>

          {/* Safe zone toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[0.625rem] font-medium text-gray-600 dark:text-gray-300">Safe Zone (10mm inset)</span>
            <button
              onClick={() => setShowSafeZone((p) => !p)}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${
                showSafeZone ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow transition-transform ${
                  showSafeZone ? "translate-x-3.5" : ""
                }`}
              />
            </button>
          </label>

          {/* Grid toggle */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[0.625rem] font-medium text-gray-600 dark:text-gray-300">Grid Overlay</span>
            <button
              onClick={() => setShowGrid((p) => !p)}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${
                showGrid ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow transition-transform ${
                  showGrid ? "translate-x-3.5" : ""
                }`}
              />
            </button>
          </label>

          {/* Grid size slider */}
          {showGrid && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[0.5625rem] font-semibold uppercase tracking-wider text-gray-400">
                  Grid Size
                </span>
                <span className="text-[0.5625rem] text-gray-500 tabular-nums">{gridSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          )}

          {/* QR Code URL */}
          <div>
            <span className="text-[0.5625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">
              QR Code URL
            </span>
            <input
              type="url"
              placeholder="https://example.com"
              value={qrCodeUrl}
              onChange={(e) => setQrCodeUrl(e.target.value)}
              className="w-full h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            {qrCodeUrl.trim() && (
              <p className="text-[0.5rem] text-gray-400 mt-1">QR placeholder shown at bottom-right of canvas</p>
            )}
          </div>
        </div>
      </Section>
    </div>
  );

  const rightPanel = (
    <div className="space-y-3">
      {/* Content */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconType className="size-4 text-primary-500" />
          Content
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Headline"
            value={config.headline}
            onChange={(e) => updateConfig({ headline: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          <input
            type="text"
            placeholder="Supporting text"
            value={config.subtext}
            onChange={(e) => updateConfig({ subtext: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          <input
            type="text"
            placeholder="CTA button text"
            value={config.ctaText}
            onChange={(e) => updateConfig({ ctaText: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Event Date"
              value={config.eventDate}
              onChange={(e) => updateConfig({ eventDate: e.target.value })}
              className="flex-1 h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            <input
              type="text"
              placeholder="Venue"
              value={config.venue}
              onChange={(e) => updateConfig({ venue: e.target.value })}
              className="flex-1 h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Label / Category"
              value={config.label}
              onChange={(e) => updateConfig({ label: e.target.value })}
              className="flex-1 h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            <input
              type="text"
              placeholder="Brand"
              value={config.brandLogo}
              onChange={(e) => updateConfig({ brandLogo: e.target.value })}
              className="flex-1 h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Layer List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
          <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
            Layers ({doc.layers.length})
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                updateDocument((d) => {
                  const nl = createTextLayer({
                    text: "New Text",
                    x: d.width * 0.1,
                    y: d.height * 0.5,
                    fontStyle: config.fontStyle,
                    color: config.textColor,
                    maxWidth: d.width * 0.8,
                  });
                  return {
                    ...d,
                    layers: [...d.layers, nl],
                    layerOrder: [nl.id, ...d.layerOrder],
                    selectedLayers: [nl.id],
                  };
                });
              }}
              className="px-2 py-1 rounded-lg text-[0.5625rem] font-semibold text-primary-500 hover:bg-primary-500/10 transition-colors"
            >
              + Text
            </button>
            <button
              onClick={() => {
                updateDocument((d) => {
                  const nl = createShapeLayer({
                    shape: "rectangle",
                    x: d.width * 0.2,
                    y: d.height * 0.3,
                    width: d.width * 0.6,
                    height: d.height * 0.05,
                    fillColor: config.primaryColor,
                    fillOpacity: 0.2,
                    cornerRadius: 4,
                  });
                  return {
                    ...d,
                    layers: [...d.layers, nl],
                    layerOrder: [nl.id, ...d.layerOrder],
                    selectedLayers: [nl.id],
                  };
                });
              }}
              className="px-2 py-1 rounded-lg text-[0.5625rem] font-semibold text-secondary-500 hover:bg-secondary-500/10 transition-colors"
            >
              + Shape
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-48 overflow-y-auto">
          {doc.layerOrder.map((layerId) => {
            const layer = doc.layers.find((l) => l.id === layerId);
            if (!layer) return null;
            const isSel = doc.selectedLayers.includes(layerId);
            return (
              <div
                key={layerId}
                className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                  isSel ? "bg-primary-500/5" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
                onClick={() => updateDocument((d) => ({ ...d, selectedLayers: [layerId] }))}
              >
                <div
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor:
                      layer.type === "text"
                        ? "#3b82f6"
                        : layer.type === "cta"
                          ? "#8ae600"
                          : layer.type === "shape"
                            ? "#f97316"
                            : layer.type === "decorative"
                              ? "#a855f7"
                              : "#6b7280",
                  }}
                />
                <span
                  className={`flex-1 text-[0.625rem] truncate ${
                    isSel ? "text-primary-500 font-semibold" : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {layer.name}
                </span>
                <span className="text-[0.5rem] text-gray-400 capitalize">{layer.type}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateDocument((d) => ({
                      ...d,
                      layers: d.layers.map((l) =>
                        l.id === layerId ? { ...l, visible: !l.visible } : l
                      ),
                    }));
                  }}
                  className={`p-0.5 rounded transition-colors ${
                    layer.visible ? "text-gray-400 hover:text-gray-600" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    {layer.visible ? (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M1 1l22 22" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            );
          })}
          {doc.layers.length === 0 && (
            <div className="px-3 py-4 text-center text-[0.625rem] text-gray-400">
              No layers yet. Choose a composition to generate.
            </div>
          )}
        </div>
      </div>

      {/* Selected Layer Properties */}
      {selectedLayer && (
        <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-primary-500">
              {selectedLayer.name}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => handleReorderLayer(selectedLayer.id, "up")}
                className="p-1 rounded text-gray-400 hover:text-primary-500 transition-colors"
                title="Bring forward"
              >
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                onClick={() => handleReorderLayer(selectedLayer.id, "down")}
                className="p-1 rounded text-gray-400 hover:text-primary-500 transition-colors"
                title="Send backward"
              >
                <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <button
                onClick={() => updateDocument((d) => duplicateLayer(d, selectedLayer.id))}
                className="p-1 rounded text-gray-400 hover:text-primary-500 transition-colors"
                title="Duplicate"
              >
                <IconCopy className="size-3" />
              </button>
              <button
                onClick={handleDeleteSelected}
                className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <IconX className="size-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <label className="text-[0.5rem] text-gray-400">
              X
              <input
                type="number"
                value={Math.round(selectedLayer.x)}
                onChange={(e) => updateLayerProperty(selectedLayer.id, { x: Number(e.target.value) })}
                className="w-full h-7 px-2 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
              />
            </label>
            <label className="text-[0.5rem] text-gray-400">
              Y
              <input
                type="number"
                value={Math.round(selectedLayer.y)}
                onChange={(e) => updateLayerProperty(selectedLayer.id, { y: Number(e.target.value) })}
                className="w-full h-7 px-2 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
              />
            </label>
            <label className="text-[0.5rem] text-gray-400">
              W
              <input
                type="number"
                value={Math.round(selectedLayer.width)}
                onChange={(e) =>
                  updateLayerProperty(selectedLayer.id, {
                    width: Number(e.target.value),
                    ...(selectedLayer.type === "text" ? { maxWidth: Number(e.target.value) } : {}),
                  })
                }
                className="w-full h-7 px-2 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
              />
            </label>
            <label className="text-[0.5rem] text-gray-400">
              H
              <input
                type="number"
                value={Math.round(selectedLayer.height)}
                onChange={(e) => updateLayerProperty(selectedLayer.id, { height: Number(e.target.value) })}
                className="w-full h-7 px-2 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
              />
            </label>
          </div>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-[0.5rem] text-gray-400">Opacity</span>
              <span className="text-[0.5rem] text-gray-400 tabular-nums">
                {Math.round(selectedLayer.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(selectedLayer.opacity * 100)}
              onChange={(e) =>
                updateLayerProperty(selectedLayer.id, { opacity: Number(e.target.value) / 100 })
              }
              className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-500 mt-1"
            />
          </label>

          {/* Text controls */}
          {selectedLayer.type === "text" && (
            <div className="space-y-2 pt-1 border-t border-primary-500/10">
              <textarea
                value={(selectedLayer as TextLayer).text}
                onChange={(e) => updateLayerProperty(selectedLayer.id, { text: e.target.value })}
                className="w-full h-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white resize-none"
              />
              <div className="grid grid-cols-3 gap-1.5">
                <label className="text-[0.5rem] text-gray-400">
                  Size
                  <input
                    type="number"
                    value={(selectedLayer as TextLayer).fontSize}
                    onChange={(e) =>
                      updateLayerProperty(selectedLayer.id, {
                        fontSize: Number(e.target.value),
                        letterSpacing: getLetterSpacing(Number(e.target.value)),
                        lineHeight: getLineHeight(Number(e.target.value)),
                      })
                    }
                    className="w-full h-7 px-2 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
                  />
                </label>
                <label className="text-[0.5rem] text-gray-400">
                  Weight
                  <input
                    type="number"
                    value={(selectedLayer as TextLayer).fontWeight}
                    step={100}
                    min={100}
                    max={900}
                    onChange={(e) =>
                      updateLayerProperty(selectedLayer.id, { fontWeight: Number(e.target.value) })
                    }
                    className="w-full h-7 px-2 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
                  />
                </label>
                <label className="text-[0.5rem] text-gray-400">
                  Color
                  <input
                    type="color"
                    value={(selectedLayer as TextLayer).color}
                    onChange={(e) => updateLayerProperty(selectedLayer.id, { color: e.target.value })}
                    className="w-full h-7 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
                  />
                </label>
              </div>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateLayerProperty(selectedLayer.id, { align })}
                    className={`flex-1 py-1 rounded-lg text-[0.5625rem] font-semibold capitalize transition-all ${
                      (selectedLayer as TextLayer).align === align
                        ? "bg-primary-500/10 text-primary-500"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA controls */}
          {selectedLayer.type === "cta" && (
            <div className="space-y-2 pt-1 border-t border-primary-500/10">
              <input
                type="text"
                value={(selectedLayer as CtaLayer).text}
                onChange={(e) => updateLayerProperty(selectedLayer.id, { text: e.target.value })}
                className="w-full h-7 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <label className="text-[0.5rem] text-gray-400">
                  BG Color
                  <input
                    type="color"
                    value={(selectedLayer as CtaLayer).bgColor}
                    onChange={(e) => updateLayerProperty(selectedLayer.id, { bgColor: e.target.value })}
                    className="w-full h-7 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
                  />
                </label>
                <label className="text-[0.5rem] text-gray-400">
                  Font Size
                  <input
                    type="number"
                    value={(selectedLayer as CtaLayer).fontSize}
                    onChange={(e) =>
                      updateLayerProperty(selectedLayer.id, { fontSize: Number(e.target.value) })
                    }
                    className="w-full h-7 px-2 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Shape controls */}
          {selectedLayer.type === "shape" && (
            <div className="space-y-2 pt-1 border-t border-primary-500/10">
              <div className="grid grid-cols-2 gap-1.5">
                <label className="text-[0.5rem] text-gray-400">
                  Fill
                  <input
                    type="color"
                    value={(selectedLayer as ShapeLayer).fillColor}
                    onChange={(e) =>
                      updateLayerProperty(selectedLayer.id, { fillColor: e.target.value })
                    }
                    className="w-full h-7 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
                  />
                </label>
                <label className="text-[0.5rem] text-gray-400">
                  Opacity
                  <input
                    type="number"
                    value={Math.round((selectedLayer as ShapeLayer).fillOpacity * 100)}
                    min={0}
                    max={100}
                    onChange={(e) =>
                      updateLayerProperty(selectedLayer.id, { fillOpacity: Number(e.target.value) / 100 })
                    }
                    className="w-full h-7 px-2 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
                  />
                </label>
              </div>
              <label className="text-[0.5rem] text-gray-400">
                Corner Radius
                <input
                  type="number"
                  value={(selectedLayer as ShapeLayer).cornerRadius}
                  onChange={(e) =>
                    updateLayerProperty(selectedLayer.id, { cornerRadius: Number(e.target.value) })
                  }
                  className="w-full h-7 px-2 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Attribution */}
      {config.backgroundImage && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-3 py-2">
          <p
            className="text-[0.5rem] text-gray-400"
            dangerouslySetInnerHTML={{ __html: `📸 ${config.backgroundImage.attributionHtml}` }}
          />
        </div>
      )}
    </div>
  );

  const toolbar = (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-gray-400">{currentFormat.label}</span>
      <span className="text-gray-600">·</span>
      <span className="text-xs text-gray-500">{compositionOptions.find((c) => c.id === config.composition)?.label ?? config.composition}</span>
      {doc.layers.length > 0 && (
        <>
          <span className="text-gray-600">·</span>
          <span className="text-xs text-gray-500">{doc.layers.length} layers</span>
        </>
      )}
    </div>
  );

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <>
      <StockImagePicker
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onSelect={(image) => {
          updateConfig({ backgroundImage: image });
          setImagePickerOpen(false);
        }}
        title="Choose a Background Image"
      />

      <StickyCanvasLayout
        canvasRef={canvasRef}
        displayWidth={displayWidth}
        displayHeight={displayHeight}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
        onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
        onZoomFit={() => setZoom(0.75)}
        label={`Poster / Flyer — ${currentFormat.width}×${currentFormat.height}px`}
        mobileTabs={["Canvas", "Settings", "Content"]}
        toolbar={toolbar}
        canvasHandlers={{
          onMouseDown: handleCanvasMouseDown,
          onMouseMove: handleCanvasMouseMove,
          onMouseUp: handleCanvasMouseUp,
          onMouseLeave: handleCanvasMouseUp,
        }}
        leftPanel={leftPanel}
        rightPanel={rightPanel}
        actionsBar={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPng}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors"
            >
              <IconDownload className="size-3" />
              PNG
            </button>
            <button
              onClick={handleDownloadJpg}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              <IconDownload className="size-3" />
              JPG
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              <IconDownload className="size-3" />
              PDF
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              <IconCopy className="size-3" />
              Copy
            </button>
          </div>
        }
      />
    </>
  );
}

/* ── Section Component ───────────────────────────────────── */

function Section({
  icon,
  label,
  id,
  open,
  toggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  id: string;
  open: boolean;
  toggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={() => toggle(id)}
        className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full"
      >
        {icon}
        {label}
        <svg
          className={`size-3 ml-auto transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}
