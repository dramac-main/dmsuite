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
  IconSmartphone,
  IconShare,
  IconTarget,
  IconCheck,
  IconGlobe,
  IconShield,
  IconEye,
  IconMonitor,
} from "@/components/icons";
import StockImagePicker, { type StockImage } from "@/components/StockImagePicker";
import {
  hexToRgba,
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
import {
  type CompositionType,
  type ExportFormat,
  getCompositionTemplates,
  getExportFormats,
  getExportFormatsByPlatform,
  generateLayoutLayers,
  buildDesignDirectorPrompt,
  parseAIDesignDirective,
  renderCompositionFoundation,
  getDeviceMockups,
  renderDeviceMockup,
  renderFullDesignToCanvas,
} from "@/lib/design-foundation";

/* ── Types ─────────────────────────────────────────────────── */

interface BannerConfig {
  size: string;
  composition: CompositionType;
  headline: string;
  subtext: string;
  ctaText: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  fontStyle: FontStyle;
  description: string;
  backgroundImage: StockImage | null;
  overlayIntensity: number;
  visualIntensity: number;
}

/* ── IAB Standard Sizes ──────────────────────────────────── */

const bannerSizes = [
  { id: "leaderboard", label: "Leaderboard", width: 728, height: 90, cat: "Standard" },
  { id: "banner", label: "Full Banner", width: 468, height: 60, cat: "Standard" },
  { id: "half-banner", label: "Half Banner", width: 234, height: 60, cat: "Standard" },
  { id: "medium-rect", label: "Medium Rectangle", width: 300, height: 250, cat: "Rectangle" },
  { id: "large-rect", label: "Large Rectangle", width: 336, height: 280, cat: "Rectangle" },
  { id: "square", label: "Square", width: 250, height: 250, cat: "Rectangle" },
  { id: "wide-sky", label: "Wide Skyscraper", width: 160, height: 600, cat: "Skyscraper" },
  { id: "skyscraper", label: "Skyscraper", width: 120, height: 600, cat: "Skyscraper" },
  { id: "billboard", label: "Billboard", width: 970, height: 250, cat: "Premium" },
  { id: "large-lb", label: "Large Leaderboard", width: 970, height: 90, cat: "Premium" },
  { id: "half-page", label: "Half Page", width: 300, height: 600, cat: "Premium" },
  { id: "portrait", label: "Portrait", width: 300, height: 1050, cat: "Premium" },
] as const;

/* ── Ad Network Compliance Specs ──────────────────────────── */

interface AdNetworkSpec {
  network: string;
  sizes: { w: number; h: number }[];
  maxFileKB: number;
  color: string;
}

const adNetworkSpecs: AdNetworkSpec[] = [
  {
    network: "Google Ads",
    maxFileKB: 150,
    color: "#4285f4",
    sizes: [
      { w: 728, h: 90 }, { w: 468, h: 60 }, { w: 300, h: 250 }, { w: 336, h: 280 },
      { w: 250, h: 250 }, { w: 160, h: 600 }, { w: 120, h: 600 }, { w: 970, h: 250 },
      { w: 970, h: 90 }, { w: 300, h: 600 }, { w: 300, h: 1050 }, { w: 234, h: 60 },
    ],
  },
  {
    network: "Meta",
    maxFileKB: 30720,
    color: "#1877f2",
    sizes: [
      { w: 1200, h: 628 }, { w: 1080, h: 1080 }, { w: 1200, h: 1200 },
      { w: 300, h: 250 }, { w: 728, h: 90 },
    ],
  },
  {
    network: "IAB Standard",
    maxFileKB: 200,
    color: "#00b894",
    sizes: [
      { w: 728, h: 90 }, { w: 468, h: 60 }, { w: 234, h: 60 }, { w: 300, h: 250 },
      { w: 336, h: 280 }, { w: 250, h: 250 }, { w: 160, h: 600 }, { w: 120, h: 600 },
      { w: 970, h: 250 }, { w: 970, h: 90 }, { w: 300, h: 600 }, { w: 300, h: 1050 },
    ],
  },
];

/* ── Composition Options ─────────────────────────────────── */

const compositionOptions: { id: CompositionType; label: string; desc: string }[] = [
  { id: "centered-hero", label: "Centered", desc: "Centered layout" },
  { id: "split-panel", label: "Split", desc: "Half & half" },
  { id: "asymmetric-tension", label: "Asymmetric", desc: "Dynamic tension" },
  { id: "z-pattern", label: "Z-Pattern", desc: "Natural flow" },
  { id: "minimal-whitespace", label: "Minimal", desc: "Clean & simple" },
  { id: "full-bleed", label: "Full Bleed", desc: "Max impact" },
];

/* ── Color Themes ────────────────────────────────────────── */

const colorThemes = [
  { name: "Lime", primary: "#8ae600", secondary: "#030712", text: "#ffffff" },
  { name: "Indigo", primary: "#6366f1", secondary: "#0f0f23", text: "#ffffff" },
  { name: "Amber", primary: "#f59e0b", secondary: "#1a1400", text: "#ffffff" },
  { name: "Red", primary: "#ef4444", secondary: "#1a0005", text: "#ffffff" },
  { name: "Cyan", primary: "#06b6d4", secondary: "#021a22", text: "#ffffff" },
  { name: "White", primary: "#3b82f6", secondary: "#ffffff", text: "#1e293b" },
  { name: "Dark", primary: "#a855f7", secondary: "#09090b", text: "#fafafa" },
  { name: "Warm", primary: "#ea580c", secondary: "#fffbeb", text: "#1c1917" },
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

export default function BannerAdWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revisionRequest, setRevisionRequest] = useState("");
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "export" | "present">("design");
  const [selectedExports, setSelectedExports] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  /* ── New feature state ─────────────────────────────────── */
  const [clickThroughUrl, setClickThroughUrl] = useState("");
  const [exportedHtml, setExportedHtml] = useState<string | null>(null);
  const [estimatedFileSize, setEstimatedFileSize] = useState<number | null>(null);
  const [activeMockup, setActiveMockup] = useState<string | null>(null);
  const mockupCanvasRef = useRef<HTMLCanvasElement>(null);

  const [config, setConfig] = useState<BannerConfig>({
    size: "medium-rect",
    composition: "centered-hero",
    headline: "",
    subtext: "",
    ctaText: "",
    brandName: "",
    primaryColor: "#8ae600",
    secondaryColor: "#030712",
    textColor: "#ffffff",
    fontStyle: "compact",
    description: "",
    backgroundImage: null,
    overlayIntensity: 70,
    visualIntensity: 2,
  });

  /* ── Design Document ───────────────────────────────────── */
  const currentSize = useMemo(
    () => bannerSizes.find((s) => s.id === config.size) ?? bannerSizes[3],
    [config.size]
  );

  const [doc, setDoc] = useState<DesignDocument>(() => ({
    id: `doc_${Date.now()}`,
    name: "Banner Ad",
    width: 300,
    height: 250,
    backgroundColor: "#030712",
    layers: [],
    layerOrder: [],
    selectedLayers: [],
    history: [],
    historyIndex: 0,
    meta: {
      category: "banner",
      platform: "medium-rect",
      layout: "centered-hero",
      fontStyle: "compact" as FontStyle,
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
    new Set(["size", "composition", "content"])
  );

  const updateConfig = useCallback((partial: Partial<BannerConfig>) => {
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

    const w = currentSize.width;
    const h = currentSize.height;

    const layers = generateLayoutLayers(
      template,
      {
        headline: config.headline || "Your Banner Headline",
        subtext: config.subtext || "",
        ctaText: config.ctaText || "Click Here",
        label: "",
        brandName: config.brandName || undefined,
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
      name: "Banner Ad",
      width: w,
      height: h,
      backgroundColor: config.secondaryColor,
      layers,
      layerOrder,
      selectedLayers: [],
      history: [],
      historyIndex: 0,
      meta: {
        category: "banner",
        platform: config.size,
        layout: config.composition,
        fontStyle: config.fontStyle,
        accentColor: config.primaryColor,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    });
    setUndoStack([]);
    setRedoStack([]);
  }, [config, currentSize]);

  useEffect(() => {
    generateLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.composition,
    config.size,
    config.primaryColor,
    config.secondaryColor,
    config.textColor,
    config.fontStyle,
    config.headline,
    config.subtext,
    config.ctaText,
    config.brandName,
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

    const w = currentSize.width;
    const h = currentSize.height;
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

    // Render layers
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

    // Border for banners
    ctx.strokeStyle = hexToRgba(config.primaryColor, 0.15);
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // Estimate file size
    canvas.toBlob(
      (blob) => {
        if (blob) setEstimatedFileSize(blob.size);
      },
      "image/png"
    );
  }, [doc, config, currentSize, loadedImage]);

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
            if (handle.includes("e")) updated.width = Math.max(10, start.width + dx);
            if (handle.includes("w")) {
              updated.x = start.x + dx;
              updated.width = Math.max(10, start.width - dx);
            }
            if (handle.includes("s")) updated.height = Math.max(10, start.height + dy);
            if (handle.includes("n")) {
              updated.y = start.y + dy;
              updated.height = Math.max(10, start.height - dy);
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

  /* ── Layer operations ──────────────────────────────────── */
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
        "banner",
        { width: currentSize.width, height: currentSize.height },
        undefined,
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
        const updates: Partial<BannerConfig> = {};
        if (directive.copy) {
          if (directive.copy.headline) updates.headline = cleanAIText(directive.copy.headline);
          if (directive.copy.subtext) updates.subtext = cleanAIText(directive.copy.subtext);
          if (directive.copy.ctaText) updates.ctaText = cleanAIText(directive.copy.ctaText);
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
  }, [config, currentSize, updateConfig, revisionRequest]);

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
          a.download = `banner-${format.id}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        await new Promise((r) => setTimeout(r, 300));
      }
    } finally {
      setIsExporting(false);
    }
  }, [selectedExports, exportFormats, doc, loadedImage]);

  /* ── Downloads ─────────────────────────────────────────── */
  const handleDownloadPng = useCallback(() => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `banner-${config.size}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [config.size]);

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

  /* ── HTML5/CSS Export ────────────────────────────────── */
  const handleExportHtml = useCallback(() => {
    const w = currentSize.width;
    const h = currentSize.height;
    const layerDivs: string[] = [];

    for (let i = doc.layerOrder.length - 1; i >= 0; i--) {
      const id = doc.layerOrder[i];
      const layer = doc.layers.find((l) => l.id === id);
      if (!layer || !layer.visible) continue;

      const baseStyle = `position:absolute;left:${Math.round(layer.x)}px;top:${Math.round(layer.y)}px;width:${Math.round(layer.width)}px;height:${Math.round(layer.height)}px;opacity:${layer.opacity};`;

      if (layer.type === "text") {
        const t = layer as TextLayer;
        layerDivs.push(
          `  <div style="${baseStyle}font-size:${t.fontSize}px;font-weight:${t.fontWeight};color:${t.color};font-family:Inter,sans-serif;line-height:${t.lineHeight};letter-spacing:${t.letterSpacing}px;text-align:${t.align};overflow:hidden;">${t.text}</div>`
        );
      } else if (layer.type === "cta") {
        const c = layer as CtaLayer;
        layerDivs.push(
          `  <div style="${baseStyle}background:${c.bgColor};color:${c.textColor};font-size:${c.fontSize}px;font-weight:700;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;border-radius:${c.cornerRadius}px;cursor:pointer;">${c.text}</div>`
        );
      } else if (layer.type === "shape") {
        const s = layer as ShapeLayer;
        const bg = s.fillColor + Math.round(s.fillOpacity * 255).toString(16).padStart(2, "0");
        const radius = s.shape === "circle" ? "50%" : `${s.cornerRadius}px`;
        layerDivs.push(
          `  <div style="${baseStyle}background:${bg};border-radius:${radius};"></div>`
        );
      }
    }

    const innerContent = layerDivs.join("\n");
    const wrapperOpen = clickThroughUrl
      ? `<a href="${clickThroughUrl}" target="_blank" rel="noopener noreferrer" style="display:block;width:${w}px;height:${h}px;position:relative;text-decoration:none;">`
      : `<div style="width:${w}px;height:${h}px;position:relative;">`;
    const wrapperClose = clickThroughUrl ? `</a>` : `</div>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="ad.size" content="width=${w},height=${h}">
  <title>Banner Ad ${w}x${h}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f0f0f0; }
    .banner { background: ${config.secondaryColor}; overflow: hidden; }
  </style>
</head>
<body>
  <div class="banner">
    ${wrapperOpen}
${innerContent}
    ${wrapperClose}
  </div>
</body>
</html>`;

    setExportedHtml(html);
    return html;
  }, [doc, currentSize, config.secondaryColor, clickThroughUrl]);

  const handleCopyHtml = useCallback(() => {
    const html = handleExportHtml();
    if (html) navigator.clipboard.writeText(html).catch(() => {});
  }, [handleExportHtml]);

  const handleDownloadHtml = useCallback(() => {
    const html = handleExportHtml();
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banner-${config.size}-${currentSize.width}x${currentSize.height}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [handleExportHtml, config.size, currentSize]);

  /* ── Ad Network Compliance ──────────────────────────────── */
  const complianceResults = useMemo(() => {
    const w = currentSize.width;
    const h = currentSize.height;
    const fileSizeKB = estimatedFileSize ? estimatedFileSize / 1024 : 0;

    return adNetworkSpecs.map((spec) => {
      const sizeMatch = spec.sizes.some((s) => s.w === w && s.h === h);
      const fileSizeOk = fileSizeKB <= spec.maxFileKB;
      return {
        network: spec.network,
        color: spec.color,
        sizeMatch,
        fileSizeOk,
        compliant: sizeMatch && fileSizeOk,
        maxFileKB: spec.maxFileKB,
      };
    });
  }, [currentSize, estimatedFileSize]);

  /* ── Device Mockup Preview ─────────────────────────────── */
  const deviceMockups = useMemo(() => getDeviceMockups(), []);

  useEffect(() => {
    if (!activeMockup || !mockupCanvasRef.current) return;
    const mockup = deviceMockups.find((m) => m.id === activeMockup);
    if (!mockup) return;

    const designCanvas = renderFullDesignToCanvas(doc, {
      composition: config.composition,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      textColor: config.textColor,
      fontStyle: config.fontStyle,
      visualIntensity: config.visualIntensity,
      backgroundImage: loadedImage,
      overlayIntensity: config.overlayIntensity,
    });

    const result = renderDeviceMockup(designCanvas, mockup, {
      backgroundColor: "#1a1a2e",
      showAppChrome: true,
      appName: config.brandName || undefined,
    });

    const mctx = mockupCanvasRef.current.getContext("2d");
    if (!mctx) return;
    mockupCanvasRef.current.width = result.width;
    mockupCanvasRef.current.height = result.height;
    mctx.drawImage(result, 0, 0);
  }, [activeMockup, doc, config, loadedImage, deviceMockups]);

  const handleDownloadMockup = useCallback(() => {
    mockupCanvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `banner-mockup-${activeMockup}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [activeMockup]);

  /* ── Helpers ───────────────────────────────────────────── */
  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedLayer =
    doc.selectedLayers.length === 1
      ? doc.layers.find((l) => l.id === doc.selectedLayers[0]) ?? null
      : null;

  const sizeCategories = useMemo(() => {
    const cats: Record<string, typeof bannerSizes[number][]> = {};
    bannerSizes.forEach((s) => {
      if (!cats[s.cat]) cats[s.cat] = [];
      cats[s.cat].push(s);
    });
    return cats;
  }, []);

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── Left Panel ─────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
          {/* Banner Size */}
          <Section
            icon={<IconLayout className="size-3.5" />}
            label="Banner Size"
            id="size"
            open={openSections.has("size")}
            toggle={toggleSection}
          >
            <div className="space-y-2">
              {Object.entries(sizeCategories).map(([cat, sizes]) => (
                <div key={cat}>
                  <p className="text-[0.5rem] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    {cat}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {sizes.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => updateConfig({ size: s.id })}
                        className={`p-1.5 rounded-lg border text-left transition-all ${
                          config.size === s.id
                            ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <p
                          className={`text-[0.5625rem] font-semibold ${
                            config.size === s.id
                              ? "text-primary-500"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {s.label}
                        </p>
                        <p className="text-[0.5rem] text-gray-400">
                          {s.width}×{s.height}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Background */}
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
                  className="w-full h-20 object-cover"
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
                className="w-full h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-primary-500 hover:border-primary-500/30 transition-all"
              >
                <IconImage className="size-4" />
                <span className="text-[0.625rem] font-medium">Add photo</span>
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

          {/* Composition */}
          <Section
            icon={<IconTarget className="size-3.5" />}
            label="Layout"
            id="composition"
            open={openSections.has("composition")}
            toggle={toggleSection}
          >
            <div className="grid grid-cols-2 gap-1.5">
              {compositionOptions.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => updateConfig({ composition: comp.id })}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    config.composition === comp.id
                      ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <p
                    className={`text-[0.625rem] font-semibold leading-tight ${
                      config.composition === comp.id
                        ? "text-primary-500"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {comp.label}
                  </p>
                  <p className="text-[0.5rem] text-gray-400 mt-0.5">{comp.desc}</p>
                </button>
              ))}
            </div>
          </Section>

          {/* Content */}
          <Section
            icon={<IconType className="size-3.5" />}
            label="Content"
            id="content"
            open={openSections.has("content")}
            toggle={toggleSection}
          >
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Headline"
                value={config.headline}
                onChange={(e) => updateConfig({ headline: e.target.value })}
                className="w-full h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <input
                type="text"
                placeholder="Supporting text"
                value={config.subtext}
                onChange={(e) => updateConfig({ subtext: e.target.value })}
                className="w-full h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="CTA"
                  value={config.ctaText}
                  onChange={(e) => updateConfig({ ctaText: e.target.value })}
                  className="flex-1 h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <input
                  type="text"
                  placeholder="Brand"
                  value={config.brandName}
                  onChange={(e) => updateConfig({ brandName: e.target.value })}
                  className="flex-1 h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
              {/* Click-Through URL */}
              <div className="flex items-center gap-1.5">
                <IconGlobe className="size-3 text-gray-400 shrink-0" />
                <input
                  type="url"
                  placeholder="Click-through URL (https://…)"
                  value={clickThroughUrl}
                  onChange={(e) => setClickThroughUrl(e.target.value)}
                  className="flex-1 h-8 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-[0.625rem] placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
              {clickThroughUrl && (
                <p className="text-[0.5rem] text-gray-400 truncate">
                  🔗 {clickThroughUrl}
                </p>
              )}
            </div>
          </Section>

          {/* AI Design Director */}
          <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
            <label className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-secondary-500 mb-2">
              <IconSparkles className="size-3" />
              AI Design Director
            </label>
            <textarea
              rows={2}
              placeholder="Describe your product or offer…"
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-secondary-500/20 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-secondary-500/50 focus:ring-2 focus:ring-secondary-500/20 transition-all resize-none mb-2"
            />
            <button
              onClick={() => generateFullDesign("fresh")}
              disabled={!config.description.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 h-8 rounded-xl bg-linear-to-r from-secondary-500 to-primary-500 text-white text-[0.625rem] font-bold hover:from-secondary-400 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              </div>
              <div>
                <p className="text-[0.5625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Typography
                </p>
                <div className="flex flex-wrap gap-1">
                  {(["modern", "compact", "bold", "elegant"] as const).map((style) => (
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

          {/* Ad Network Compliance */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 space-y-2">
            <div className="flex items-center gap-1.5">
              <IconShield className="size-3 text-gray-400" />
              <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500">
                Ad Compliance
              </span>
            </div>
            <div className="space-y-1">
              {complianceResults.map((r) => (
                <div
                  key={r.network}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div
                    className={`size-4 rounded-full flex items-center justify-center text-white text-[0.5rem] font-bold ${
                      r.compliant ? "bg-success-500" : r.sizeMatch ? "bg-warning-500" : "bg-gray-400"
                    }`}
                  >
                    {r.compliant ? "✓" : r.sizeMatch ? "!" : "✗"}
                  </div>
                  <span className="flex-1 text-[0.5625rem] font-medium text-gray-700 dark:text-gray-300">
                    {r.network}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className={`text-[0.5rem] font-semibold ${
                      r.sizeMatch ? "text-success-500" : "text-gray-400"
                    }`}>
                      {r.sizeMatch ? "Size ✓" : "Size ✗"}
                    </span>
                    <span className={`text-[0.5rem] ${
                      r.fileSizeOk ? "text-success-500" : "text-error-500"
                    }`}>
                      {r.fileSizeOk ? `≤${r.maxFileKB}KB ✓` : `>${r.maxFileKB}KB ✗`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {estimatedFileSize !== null && (
              <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-[0.5rem] text-gray-400">Est. file size:</span>
                <span
                  className={`text-[0.5625rem] font-bold tabular-nums ${
                    estimatedFileSize / 1024 < 50
                      ? "text-success-500"
                      : estimatedFileSize / 1024 < 150
                        ? "text-warning-500"
                        : "text-error-500"
                  }`}
                >
                  {estimatedFileSize < 1024
                    ? `${estimatedFileSize} B`
                    : `${(estimatedFileSize / 1024).toFixed(1)} KB`}
                </span>
                <span
                  className={`size-2 rounded-full ${
                    estimatedFileSize / 1024 < 50
                      ? "bg-success-500"
                      : estimatedFileSize / 1024 < 150
                        ? "bg-warning-500"
                        : "bg-error-500"
                  }`}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Center: Canvas / Export ─────────────────────── */}
        <div className="lg:col-span-6 space-y-3">
          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {(
              [
                { id: "design", label: "Design", icon: <IconLayout className="size-3.5" /> },
                { id: "export", label: "Export All Sizes", icon: <IconDownload className="size-3.5" /> },
                { id: "present", label: "Client Preview", icon: <IconSmartphone className="size-3.5" /> },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Design Tab */}
          {activeTab === "design" && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">Canvas</span>
                  <span className="text-[0.5625rem] text-gray-400">
                    {currentSize.width}×{currentSize.height} — {currentSize.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                    title="Undo"
                  >
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H12" />
                      <path d="M3 10l5-5M3 10l5 5" />
                    </svg>
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                    title="Redo"
                  >
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h1" />
                      <path d="M21 10l-5-5M21 10l-5 5" />
                    </svg>
                  </button>
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <button
                    onClick={handleCopyCanvas}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.625rem] font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <IconCopy className="size-3" />
                    Copy
                  </button>
                  <button
                    onClick={handleDownloadPng}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.625rem] font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 transition-colors"
                  >
                    <IconDownload className="size-3" />
                    PNG
                  </button>
                  {estimatedFileSize !== null && (
                    <span
                      className={`text-[0.5rem] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                        estimatedFileSize / 1024 < 50
                          ? "text-success-600 bg-success-500/10"
                          : estimatedFileSize / 1024 < 150
                            ? "text-warning-600 bg-warning-500/10"
                            : "text-error-600 bg-error-500/10"
                      }`}
                    >
                      {(estimatedFileSize / 1024).toFixed(1)}KB
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center p-6 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#1f2937_0%_25%,transparent_0%_50%)] bg-size-[20px_20px] min-h-48">
                <div className="shadow-2xl rounded-lg overflow-hidden inline-block">
                  <canvas
                    ref={canvasRef}
                    className="cursor-crosshair"
                    style={{
                      width: `${Math.min(currentSize.width, 500)}px`,
                      height: `${Math.min(currentSize.height, 500) * (currentSize.height / currentSize.width)}px`,
                      maxWidth: "100%",
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[0.5625rem] text-gray-400">
                  Click to select • Drag to move • Handles to resize •{" "}
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[0.5rem]">Del</kbd> delete •{" "}
                  <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[0.5rem]">Ctrl+D</kbd> duplicate
                </p>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === "export" && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Export to All Sizes
                  </h3>
                  <p className="text-[0.625rem] text-gray-400 mt-0.5">
                    Export your banner design to multiple IAB standard sizes.
                  </p>
                </div>
                <button
                  onClick={handleMultiExport}
                  disabled={selectedExports.size === 0 || isExporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isExporting ? (
                    <>
                      <IconLoader className="size-3.5 animate-spin" />
                      Exporting…
                    </>
                  ) : (
                    <>
                      <IconDownload className="size-3.5" />
                      Export {selectedExports.size}
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const web = exportFormats.filter((f: ExportFormat) => f.category === "web");
                    setSelectedExports(new Set(web.map((f: ExportFormat) => f.id)));
                  }}
                  className="px-3 py-1 rounded-lg text-[0.625rem] font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-500/30 transition-colors"
                >
                  Select Web
                </button>
                <button
                  onClick={() => setSelectedExports(new Set())}
                  className="px-3 py-1 rounded-lg text-[0.625rem] font-semibold border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {Object.entries(exportByPlatform).map(([platform, fmts]) => (
                <div key={platform}>
                  <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    {platform}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(fmts as ExportFormat[]).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => toggleExportFormat(f.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedExports.has(f.id)
                            ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-[0.625rem] font-semibold ${
                              selectedExports.has(f.id)
                                ? "text-primary-500"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {f.name}
                          </span>
                          <div
                            className={`size-4 rounded border-2 flex items-center justify-center transition-colors ${
                              selectedExports.has(f.id)
                                ? "border-primary-500 bg-primary-500"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            {selectedExports.has(f.id) && (
                              <svg className="size-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <p className="text-[0.5rem] text-gray-400">
                          {f.width}×{f.height}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Present Tab — Device Mockups */}
          {activeTab === "present" && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Client Presentation
                </h3>
                <p className="text-[0.625rem] text-gray-400 mt-0.5">
                  Preview your banner ad on real devices. See how it looks in context.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {deviceMockups.map((mockup) => (
                  <button
                    key={mockup.id}
                    onClick={() => setActiveMockup(mockup.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      activeMockup === mockup.id
                        ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="text-lg mb-1">
                      {mockup.device === "phone"
                        ? "📱"
                        : mockup.device === "tablet"
                          ? "📱"
                          : mockup.device === "laptop"
                            ? "💻"
                            : "🖥️"}
                    </div>
                    <p
                      className={`text-[0.625rem] font-semibold ${
                        activeMockup === mockup.id
                          ? "text-primary-500"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {mockup.name}
                    </p>
                    <p className="text-[0.5rem] text-gray-400">{mockup.platform}</p>
                  </button>
                ))}
              </div>

              {activeMockup && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center p-6 rounded-xl bg-linear-to-br from-gray-900 to-gray-800 min-h-80">
                    <canvas ref={mockupCanvasRef} className="max-w-xs w-full h-auto drop-shadow-2xl" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadMockup}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors"
                    >
                      <IconDownload className="size-3.5" />
                      Download Mockup
                    </button>
                    <button
                      onClick={handleCopyCanvas}
                      className="flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <IconCopy className="size-3.5" />
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Export (design tab) */}
          {activeTab === "design" && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={handleDownloadPng}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10"
                >
                  <IconDownload className="size-3.5" />
                  <span className="text-[0.625rem] font-semibold">.png</span>
                </button>
                <button
                  onClick={handleCopyHtml}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10"
                >
                  <IconMonitor className="size-3.5" />
                  <span className="text-[0.625rem] font-semibold">HTML</span>
                </button>
                <button
                  onClick={handleDownloadHtml}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <IconGlobe className="size-3.5" />
                  <span className="text-[0.625rem] font-semibold">.html</span>
                </button>
                <button
                  onClick={handleCopyCanvas}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <IconCopy className="size-3.5" />
                  <span className="text-[0.625rem] font-semibold">Copy</span>
                </button>
                <button
                  onClick={() => setActiveTab("export")}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <IconShare className="size-3.5" />
                  <span className="text-[0.625rem] font-semibold">All Sizes</span>
                </button>
              </div>
              {/* HTML Export Preview */}
              {exportedHtml && (
                <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-[0.5625rem] font-semibold text-gray-500 uppercase tracking-wider">HTML5 Banner</span>
                    <div className="flex gap-1">
                      <button
                        onClick={handleCopyHtml}
                        className="px-2 py-0.5 rounded text-[0.5rem] font-semibold text-primary-500 hover:bg-primary-500/10 transition-colors"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => setExportedHtml(null)}
                        className="p-0.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <IconX className="size-3" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 text-[0.5rem] text-gray-600 dark:text-gray-400 overflow-x-auto max-h-32 font-mono leading-relaxed">
                    {exportedHtml.slice(0, 600)}{exportedHtml.length > 600 ? "\n…" : ""}
                  </pre>
                </div>
              )}
              {clickThroughUrl && (
                <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <IconGlobe className="size-3 text-gray-400" />
                  <span className="text-[0.5rem] text-gray-500 truncate">{clickThroughUrl}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right Panel: Layers ──────────────────────────── */}
        <div className="lg:col-span-3 space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto pl-1">
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
                        text: "Text",
                        x: d.width * 0.1,
                        y: d.height * 0.4,
                        fontStyle: config.fontStyle,
                        color: config.textColor,
                        maxWidth: d.width * 0.8,
                        fontSize: Math.max(10, Math.min(d.width, d.height) * 0.08),
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
                        x: d.width * 0.1,
                        y: d.height * 0.1,
                        width: d.width * 0.3,
                        height: d.height * 0.15,
                        fillColor: config.primaryColor,
                        fillOpacity: 0.15,
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
                  No layers yet. Choose a layout to generate.
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
                  >
                    <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleReorderLayer(selectedLayer.id, "down")}
                    className="p-1 rounded text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <button
                    onClick={() => updateDocument((d) => duplicateLayer(d, selectedLayer.id))}
                    className="p-1 rounded text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    <IconCopy className="size-3" />
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
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
                  <input
                    type="text"
                    value={(selectedLayer as TextLayer).text}
                    onChange={(e) => updateLayerProperty(selectedLayer.id, { text: e.target.value })}
                    className="w-full h-7 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[0.625rem] text-gray-900 dark:text-white"
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
                      BG
                      <input
                        type="color"
                        value={(selectedLayer as CtaLayer).bgColor}
                        onChange={(e) => updateLayerProperty(selectedLayer.id, { bgColor: e.target.value })}
                        className="w-full h-7 mt-0.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
                      />
                    </label>
                    <label className="text-[0.5rem] text-gray-400">
                      Size
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
                </div>
              )}
            </div>
          )}

          {/* Quick Size Switch */}
          <div>
            <p className="text-[0.5625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Quick Size Switch
            </p>
            <div className="grid grid-cols-2 gap-1">
              {bannerSizes
                .filter((s) => s.id !== config.size)
                .slice(0, 4)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateConfig({ size: s.id })}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-500/30 transition-all p-1.5 text-center"
                  >
                    <p className="text-[0.5625rem] font-medium text-gray-600 dark:text-gray-300">
                      {s.label}
                    </p>
                    <p className="text-[0.5rem] text-gray-400">
                      {s.width}×{s.height}
                    </p>
                  </button>
                ))}
            </div>
          </div>

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
      </div>
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
