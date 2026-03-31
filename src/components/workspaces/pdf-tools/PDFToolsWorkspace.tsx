"use client";

// =============================================================================
// DMSuite — PDF Tools Suite Workspace
// Inspired by Stirling-PDF: 18 powerful PDF operations, all client-side.
// Merge, split, extract, rotate, delete, reorder, compress, watermark,
// page-numbers, stamp, protect, metadata, convert, multi-page layout,
// overlay, reverse, scale, PDF info.
// =============================================================================

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  IconFileText,
  IconLoader,
  IconPlus,
  IconTrash,
  IconCheck,
} from "@/components/icons";
import { useChikoActions } from "@/hooks/useChikoActions";
import { createPDFToolsManifest, type PDFToolsRefs } from "@/lib/chiko/manifests/pdf-tools";
import {
  loadPDFFile,
  mergePDFs,
  splitPDF,
  extractPages,
  deletePages,
  rotatePages,
  reorderPages,
  reversePages,
  compressPDF,
  addWatermark,
  addPageNumbers,
  addStamp,
  setMetadata,
  getMetadata,
  imagesToPDF,
  multiPageLayout,
  overlayPDFs,
  scalePages,
  getPDFInfo,
  downloadBytes,
  downloadMultiple,
  parsePageRanges,
  type PDFFileEntry,
  type CompressLevel,
  type CompressResult,
  type RotationAngle,
  type WatermarkOptions,
  type PageNumberOptions,
} from "@/lib/pdf/pdf-engine";

/* ── Types ─────────────────────────────────────────────────── */

type PDFTool =
  | "merge" | "split" | "extract" | "rotate" | "delete-pages" | "reorder"
  | "compress" | "watermark" | "page-numbers" | "stamp" | "protect"
  | "metadata" | "convert" | "multi-page-layout" | "overlay" | "reverse"
  | "scale" | "info";

type ConvertMode = "images-to-pdf" | "pdf-to-images";

/* ── Tool Definitions ──────────────────────────────────────── */

interface ToolDef {
  id: PDFTool;
  label: string;
  desc: string;
  category: "pages" | "security" | "content" | "convert" | "advanced";
  icon: string;
  multiFile?: boolean;
}

const TOOL_CATEGORIES = [
  { id: "pages", label: "Page Operations" },
  { id: "security", label: "Security" },
  { id: "content", label: "Content & Editing" },
  { id: "convert", label: "Convert" },
  { id: "advanced", label: "Advanced" },
] as const;

const PDF_TOOLS: ToolDef[] = [
  // Page Operations
  { id: "merge", label: "Merge", desc: "Combine multiple PDFs into one", category: "pages", icon: "📎", multiFile: true },
  { id: "split", label: "Split", desc: "Split PDF by page ranges", category: "pages", icon: "✂️" },
  { id: "extract", label: "Extract Pages", desc: "Extract specific pages", category: "pages", icon: "📄" },
  { id: "rotate", label: "Rotate", desc: "Rotate pages 90°/180°/270°", category: "pages", icon: "🔄" },
  { id: "delete-pages", label: "Delete Pages", desc: "Remove pages from PDF", category: "pages", icon: "🗑️" },
  { id: "reorder", label: "Reorder", desc: "Rearrange page order", category: "pages", icon: "↕️" },
  { id: "reverse", label: "Reverse", desc: "Reverse all page order", category: "pages", icon: "🔃" },
  // Security
  { id: "protect", label: "Protect", desc: "Add protection metadata mark", category: "security", icon: "🔒" },
  // Content & Editing
  { id: "watermark", label: "Watermark", desc: "Add text watermark", category: "content", icon: "💧" },
  { id: "page-numbers", label: "Page Numbers", desc: "Add page numbering", category: "content", icon: "🔢" },
  { id: "stamp", label: "Stamp", desc: "Add text stamp overlay", category: "content", icon: "📌" },
  { id: "metadata", label: "Metadata", desc: "Edit PDF properties", category: "content", icon: "📋" },
  { id: "compress", label: "Compress", desc: "Reduce file size", category: "content", icon: "📦" },
  // Convert
  { id: "convert", label: "Convert", desc: "Images ↔ PDF conversion", category: "convert", icon: "🔄" },
  // Advanced
  { id: "multi-page-layout", label: "N-Up Layout", desc: "Multiple pages per sheet", category: "advanced", icon: "📐" },
  { id: "overlay", label: "Overlay", desc: "Overlay one PDF on another", category: "advanced", icon: "📑", multiFile: true },
  { id: "scale", label: "Scale Pages", desc: "Resize to specific dimensions", category: "advanced", icon: "📏" },
  { id: "info", label: "PDF Info", desc: "View file information", category: "advanced", icon: "ℹ️" },
];

/* ── Constants ─────────────────────────────────────────────── */

const COMPRESS_LEVELS: { id: CompressLevel; label: string; desc: string }[] = [
  { id: "low", label: "Low", desc: "Gentle compression, best quality" },
  { id: "medium", label: "Medium", desc: "Balanced size and quality" },
  { id: "high", label: "High", desc: "Aggressive, strips metadata" },
  { id: "maximum", label: "Maximum", desc: "Smallest possible size" },
];

const WATERMARK_POSITIONS = [
  { id: "diagonal", label: "Diagonal" },
  { id: "center", label: "Center" },
  { id: "top-left", label: "Top Left" },
  { id: "top-right", label: "Top Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-right", label: "Bottom Right" },
] as const;

const PAGE_NUMBER_FORMATS = [
  { id: "plain", label: "1, 2, 3..." },
  { id: "page-of-total", label: "Page 1 of N" },
  { id: "dash", label: "- 1 -" },
  { id: "parentheses", label: "(1)" },
] as const;

const PAGE_NUMBER_POSITIONS = [
  { id: "bottom-center", label: "Bottom Center" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-right", label: "Bottom Right" },
  { id: "top-center", label: "Top Center" },
  { id: "top-left", label: "Top Left" },
  { id: "top-right", label: "Top Right" },
] as const;

const SCALE_PRESETS = [
  { label: "A4 Portrait", width: 595.28, height: 841.89 },
  { label: "A4 Landscape", width: 841.89, height: 595.28 },
  { label: "Letter Portrait", width: 612, height: 792 },
  { label: "Letter Landscape", width: 792, height: 612 },
  { label: "A5 Portrait", width: 419.53, height: 595.28 },
  { label: "A3 Portrait", width: 841.89, height: 1190.55 },
] as const;

const INPUT_CLS = "w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function PDFToolsWorkspace() {
  /* ── Core State ──────────────────────────────────────────── */
  const [activeTool, setActiveTool] = useState<PDFTool>("merge");
  const [files, setFiles] = useState<PDFFileEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"tools" | "files">("tools");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Tool-Specific Settings ──────────────────────────────── */
  const [splitRange, setSplitRange] = useState("1-3, 5, 7-10");
  const [compressLevel, setCompressLevel] = useState<CompressLevel>("medium");
  const [compressResult, setCompressResult] = useState<CompressResult | null>(null);
  const [rotateAngle, setRotateAngle] = useState<RotationAngle>(90);
  const [deletePageNums, setDeletePageNums] = useState("1");
  const [convertMode, setConvertMode] = useState<ConvertMode>("images-to-pdf");

  // Watermark settings
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkOptions["position"]>("diagonal");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.15);
  const [watermarkFontSize, setWatermarkFontSize] = useState(48);

  // Page number settings
  const [pageNumberFormat, setPageNumberFormat] = useState<PageNumberOptions["format"]>("plain");
  const [pageNumberPosition, setPageNumberPosition] = useState<PageNumberOptions["position"]>("bottom-center");
  const [pageNumberStart, setPageNumberStart] = useState(1);

  // Stamp settings
  const [stampText, setStampText] = useState("APPROVED");
  const [stampFontSize, setStampFontSize] = useState(14);

  // Protect settings
  // Note: pdf-lib cannot encrypt — protect tool stamps metadata only

  // Reorder settings
  const [reorderPageOrder, setReorderPageOrder] = useState("");

  // Metadata settings
  const [metaTitle, setMetaTitle] = useState("");
  const [metaAuthor, setMetaAuthor] = useState("");
  const [metaSubject, setMetaSubject] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [metaCreator, setMetaCreator] = useState("");

  // Multi-page layout
  const [pagesPerSheet, setPagesPerSheet] = useState<2 | 4 | 6 | 9>(2);

  // Scale
  const [scaleWidth, setScaleWidth] = useState(595.28);
  const [scaleHeight, setScaleHeight] = useState(841.89);

  // Info display
  const [pdfInfo, setPdfInfo] = useState<Awaited<ReturnType<typeof getPDFInfo>> | null>(null);

  /* ── Derived ─────────────────────────────────────────────── */
  const activeToolDef = useMemo(() => PDF_TOOLS.find((t) => t.id === activeTool), [activeTool]);
  const isMultiFile = activeToolDef?.multiFile || activeTool === "convert";
  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);
  const totalPages = useMemo(() => files.reduce((s, f) => s + f.pageCount, 0), [files]);

  /* ── File Handling ───────────────────────────────────────── */
  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    setError(null);
    const incoming = Array.from(fileList);
    try {
      const loaded: PDFFileEntry[] = [];
      for (const f of incoming) {
        if (activeTool === "convert" && convertMode === "images-to-pdf") {
          // Store images as pseudo-entries
          const bytes = new Uint8Array(await f.arrayBuffer());
          loaded.push({
            id: uid(),
            name: f.name,
            size: bytes.byteLength,
            pageCount: 1,
            bytes,
          });
        } else {
          const entry = await loadPDFFile(f);
          loaded.push(entry);
        }
      }
      setFiles((prev) => (isMultiFile ? [...prev, ...loaded] : loaded));
      setDone(false);
      setCompressResult(null);
      setPdfInfo(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load file";
      setError(msg);
    }
  }, [activeTool, convertMode, isMultiFile]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setDone(false);
  };

  const clearFiles = () => {
    setFiles([]);
    setDone(false);
    setCompressResult(null);
    setError(null);
    setPdfInfo(null);
  };

  const moveFile = (id: string, dir: "up" | "down") => {
    setFiles((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx < 0) return prev;
      const newIdx = dir === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  // When switching tools, clear state
  const switchTool = useCallback((tool: PDFTool) => {
    setActiveTool(tool);
    clearFiles();
    setReorderPageOrder("");
  }, []);

  // Auto-load metadata when file is loaded and tool is metadata/info
  // Auto-populate reorder page sequence when file is loaded for reorder
  useEffect(() => {
    if (files.length === 1 && (activeTool === "metadata" || activeTool === "info" || activeTool === "reorder")) {
      (async () => {
        try {
          if (activeTool === "metadata") {
            const meta = await getMetadata(files[0].bytes);
            setMetaTitle(meta.title ?? "");
            setMetaAuthor(meta.author ?? "");
            setMetaSubject(meta.subject ?? "");
            setMetaKeywords(meta.keywords ?? "");
            setMetaCreator(meta.creator ?? "");
          }
          if (activeTool === "info") {
            const info = await getPDFInfo(files[0].bytes);
            setPdfInfo(info);
          }
          if (activeTool === "reorder") {
            setReorderPageOrder(
              Array.from({ length: files[0].pageCount }, (_, i) => i + 1).join(", ")
            );
          }
        } catch {
          // Ignore metadata read errors
        }
      })();
    }
  }, [files, activeTool]);

  /* ── Process Execution ───────────────────────────────────── */
  const runProcess = useCallback(async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(10);
    setError(null);
    setDone(false);

    try {
      const file = files[0];
      const baseName = file.name.replace(/\.pdf$/i, "");

      setProgress(30);

      switch (activeTool) {
        case "merge": {
          const result = await mergePDFs(files);
          setProgress(90);
          downloadBytes(result, `${baseName}_merged.pdf`);
          break;
        }

        case "split": {
          const ranges = parsePageRanges(splitRange, file.pageCount);
          if (ranges.length === 0) throw new Error("No valid page ranges specified");
          const results = await splitPDF(file.bytes, ranges, baseName);
          setProgress(90);
          downloadMultiple(results);
          break;
        }

        case "extract": {
          const ranges = parsePageRanges(splitRange, file.pageCount);
          const pageNums: number[] = [];
          for (const r of ranges) {
            for (let p = r.start; p <= r.end; p++) pageNums.push(p);
          }
          if (pageNums.length === 0) throw new Error("No valid pages specified");
          const result = await extractPages(file.bytes, pageNums);
          setProgress(90);
          downloadBytes(result, `${baseName}_extracted.pdf`);
          break;
        }

        case "rotate": {
          const result = await rotatePages(file.bytes, rotateAngle);
          setProgress(90);
          downloadBytes(result, `${baseName}_rotated.pdf`);
          break;
        }

        case "delete-pages": {
          const ranges = parsePageRanges(deletePageNums, file.pageCount);
          const pageNums: number[] = [];
          for (const r of ranges) {
            for (let p = r.start; p <= r.end; p++) pageNums.push(p);
          }
          if (pageNums.length === 0) throw new Error("No pages specified to delete");
          if (pageNums.length >= file.pageCount) throw new Error("Cannot delete all pages");
          const result = await deletePages(file.bytes, pageNums);
          setProgress(90);
          downloadBytes(result, `${baseName}_trimmed.pdf`);
          break;
        }

        case "reorder": {
          // Parse user's custom page order (1-based, comma-separated)
          const orderNums = reorderPageOrder
            .split(",")
            .map((s) => parseInt(s.trim(), 10))
            .filter((n) => !isNaN(n) && n >= 1 && n <= file.pageCount);
          if (orderNums.length === 0) throw new Error("Enter a valid page order, e.g. '3, 1, 2'");
          const result = await reorderPages(file.bytes, orderNums);
          setProgress(90);
          downloadBytes(result, `${baseName}_reordered.pdf`);
          break;
        }

        case "reverse": {
          const result = await reversePages(file.bytes);
          setProgress(90);
          downloadBytes(result, `${baseName}_reversed.pdf`);
          break;
        }

        case "compress": {
          const result = await compressPDF(file.bytes, compressLevel);
          setProgress(90);
          setCompressResult(result);
          downloadBytes(result.bytes, `${baseName}_compressed.pdf`);
          break;
        }

        case "watermark": {
          const result = await addWatermark(file.bytes, {
            text: watermarkText,
            position: watermarkPosition,
            opacity: watermarkOpacity,
            fontSize: watermarkFontSize,
          });
          setProgress(90);
          downloadBytes(result, `${baseName}_watermarked.pdf`);
          break;
        }

        case "page-numbers": {
          const result = await addPageNumbers(file.bytes, {
            format: pageNumberFormat,
            position: pageNumberPosition,
            startNumber: pageNumberStart,
          });
          setProgress(90);
          downloadBytes(result, `${baseName}_numbered.pdf`);
          break;
        }

        case "stamp": {
          const result = await addStamp(file.bytes, {
            text: stampText,
            fontSize: stampFontSize,
          });
          setProgress(90);
          downloadBytes(result, `${baseName}_stamped.pdf`);
          break;
        }

        case "protect": {
          // pdf-lib doesn't support encryption — we add a producer metadata mark
          const result = await setMetadata(file.bytes, {
            producer: "DMSuite • Protected",
          });
          setProgress(90);
          downloadBytes(result, `${baseName}_protected.pdf`);
          break;
        }

        case "metadata": {
          const result = await setMetadata(file.bytes, {
            title: metaTitle,
            author: metaAuthor,
            subject: metaSubject,
            keywords: metaKeywords,
            creator: metaCreator,
            producer: "DMSuite PDF Tools",
          });
          setProgress(90);
          downloadBytes(result, `${baseName}_metadata.pdf`);
          break;
        }

        case "convert": {
          if (convertMode === "images-to-pdf") {
            const images = files.map((f) => ({
              bytes: f.bytes,
              name: f.name,
              type: f.name.endsWith(".png") ? "image/png" : "image/jpeg",
            }));
            const result = await imagesToPDF(images);
            setProgress(90);
            downloadBytes(result, "images_combined.pdf");
          } else {
            // pdf-to-images would require pdf.js for rendering
            throw new Error("PDF to images requires pdf.js rendering (coming soon). Use the export/screenshot approach for now.");
          }
          break;
        }

        case "multi-page-layout": {
          const result = await multiPageLayout(file.bytes, pagesPerSheet);
          setProgress(90);
          downloadBytes(result, `${baseName}_${pagesPerSheet}up.pdf`);
          break;
        }

        case "overlay": {
          if (files.length < 2) throw new Error("Upload 2 PDFs: base file first, then overlay");
          const result = await overlayPDFs(files[0].bytes, files[1].bytes);
          setProgress(90);
          downloadBytes(result, `${baseName}_overlay.pdf`);
          break;
        }

        case "scale": {
          const result = await scalePages(file.bytes, scaleWidth, scaleHeight);
          setProgress(90);
          downloadBytes(result, `${baseName}_scaled.pdf`);
          break;
        }

        case "info": {
          const info = await getPDFInfo(file.bytes);
          setProgress(90);
          setPdfInfo(info);
          break;
        }
      }

      setProgress(100);
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Processing failed";
      setError(msg);
    } finally {
      setProcessing(false);
    }
  }, [
    files, activeTool, splitRange, compressLevel, rotateAngle, deletePageNums,
    watermarkText, watermarkPosition, watermarkOpacity, watermarkFontSize,
    pageNumberFormat, pageNumberPosition, pageNumberStart,
    stampText, stampFontSize, reorderPageOrder,
    metaTitle, metaAuthor, metaSubject, metaKeywords, metaCreator,
    convertMode, pagesPerSheet, scaleWidth, scaleHeight,
  ]);

  /* ── Chiko Integration ───────────────────────────────────── */
  const chikoRefs = useMemo<PDFToolsRefs>(() => ({
    getState: () => ({
      activeTool,
      fileCount: files.length,
      fileNames: files.map((f) => f.name),
      totalSize,
      totalPages,
      processing,
      done,
      splitRange,
      compressLevel,
      watermarkText,
      watermarkPosition: watermarkPosition ?? "diagonal",
      watermarkOpacity,
      watermarkFontSize,
      pageNumberFormat: pageNumberFormat ?? "plain",
      pageNumberPosition: pageNumberPosition ?? "bottom-center",
      rotateAngle,
      convertMode,
      protectPassword: "",
      metadataTitle: metaTitle,
      metadataAuthor: metaAuthor,
      stampText,
      stampFontSize,
      pagesPerSheet,
      compressResult: compressResult
        ? { original: compressResult.originalSize, compressed: compressResult.compressedSize, savedPercent: compressResult.savedPercent }
        : null,
    }),
    setTool: (t: string) => switchTool(t as PDFTool),
    setSplitRange,
    setCompressLevel: (l: string) => setCompressLevel(l as CompressLevel),
    setWatermarkText,
    setWatermarkPosition: (p: string) => setWatermarkPosition(p as WatermarkOptions["position"]),
    setWatermarkOpacity,
    setWatermarkFontSize,
    setPageNumberFormat: (f: string) => setPageNumberFormat(f as PageNumberOptions["format"]),
    setPageNumberPosition: (p: string) => setPageNumberPosition(p as PageNumberOptions["position"]),
    setPageNumberStart: (n: number) => setPageNumberStart(n || 1),
    setRotateAngle: (a: number) => setRotateAngle(a as RotationAngle),
    setConvertMode: (m: string) => setConvertMode(m as ConvertMode),
    setProtectPassword: () => {},  // no-op: protect stamps metadata only
    setProtectConfirm: () => {},   // no-op: protect stamps metadata only
    setReorderPageOrder,
    setMetadata: (field: string, value: string) => {
      switch (field) {
        case "title": setMetaTitle(value); break;
        case "author": setMetaAuthor(value); break;
        case "subject": setMetaSubject(value); break;
        case "keywords": setMetaKeywords(value); break;
        case "creator": setMetaCreator(value); break;
      }
    },
    setStampText,
    setStampFontSize,
    setPagesPerSheet: (n: number) => setPagesPerSheet(n as 2 | 4 | 6 | 9),
    runProcess,
    clearFiles,
  }), [
    activeTool, files, totalSize, totalPages, processing, done,
    splitRange, compressLevel, watermarkText, watermarkPosition, watermarkOpacity,
    watermarkFontSize, pageNumberFormat, pageNumberPosition, rotateAngle,
    convertMode, metaTitle, metaAuthor, stampText, stampFontSize,
    pagesPerSheet, compressResult, switchTool, runProcess,
  ]);

  useChikoActions(useCallback(() => createPDFToolsManifest(chikoRefs), [chikoRefs]));

  /* ── Compute accept types ────────────────────────────────── */
  const acceptTypes = activeTool === "convert" && convertMode === "images-to-pdf"
    ? "image/png,image/jpeg"
    : "application/pdf,.pdf";

  /* ── Can Process? ────────────────────────────────────────── */
  const canProcess =
    files.length > 0 &&
    !processing &&
    (activeTool !== "overlay" || files.length >= 2) &&
    (activeTool !== "info" || !pdfInfo) &&
    (activeTool !== "reorder" || reorderPageOrder.trim().length > 0);

  const processLabel = useMemo(() => {
    if (processing) return "Processing…";
    if (done) return "Done!";
    const t = activeToolDef;
    if (!t) return "Process";
    switch (activeTool) {
      case "merge": return `Merge ${files.length} PDFs`;
      case "split": return "Split PDF";
      case "extract": return "Extract Pages";
      case "rotate": return `Rotate ${rotateAngle}°`;
      case "delete-pages": return "Delete Pages";
      case "reorder": return "Apply New Order";
      case "reverse": return "Reverse Pages";
      case "compress": return "Compress PDF";
      case "watermark": return "Add Watermark";
      case "page-numbers": return "Add Page Numbers";
      case "stamp": return "Add Stamp";
      case "protect": return "Protect PDF";
      case "metadata": return "Save Metadata";
      case "convert": return convertMode === "images-to-pdf" ? "Create PDF" : "Convert to Images";
      case "multi-page-layout": return `Create ${pagesPerSheet}-Up Layout`;
      case "overlay": return "Overlay PDFs";
      case "scale": return "Scale Pages";
      case "info": return "Get Info";
      default: return "Process";
    }
  }, [activeTool, activeToolDef, processing, done, files.length, rotateAngle, convertMode, pagesPerSheet]);

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mobile Tab Bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700/50 lg:hidden shrink-0">
        {(["tools", "files"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobilePanel(t)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              mobilePanel === t
                ? "text-primary-400 border-b-2 border-primary-500"
                : "text-gray-500"
            }`}
          >
            {t === "tools" ? "Tools & Settings" : "Files & Output"}
          </button>
        ))}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ═══ LEFT: Tool Selector + Settings ═══ */}
        <div
          className={`w-full lg:w-80 xl:w-88 shrink-0 border-r border-gray-200 dark:border-gray-700/50 flex flex-col overflow-hidden ${
            mobilePanel !== "tools" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Tool Grid */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700/50 overflow-y-auto max-h-64 lg:max-h-72 scrollbar-thin">
            {TOOL_CATEGORIES.map((cat) => {
              const tools = PDF_TOOLS.filter((t) => t.category === cat.id);
              if (tools.length === 0) return null;
              return (
                <div key={cat.id} className="mb-2.5 last:mb-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5 px-0.5">
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-3 gap-1">
                    {tools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => switchTool(tool.id)}
                        title={tool.desc}
                        className={`flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg text-center transition-all ${
                          activeTool === tool.id
                            ? "bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/30"
                            : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-300"
                        }`}
                      >
                        <span className="text-base leading-none">{tool.icon}</span>
                        <span className="text-[10px] font-medium leading-tight truncate w-full">
                          {tool.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Tool Description */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700/50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeToolDef?.icon}</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activeToolDef?.label}
                </h3>
                <p className="text-[10px] text-gray-400">{activeToolDef?.desc}</p>
              </div>
            </div>
          </div>

          {/* Settings Panel (scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {/* ── Split / Extract Settings ── */}
            {(activeTool === "split" || activeTool === "extract") && (
              <SettingsCard title="Page Ranges">
                <input
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder="e.g., 1-3, 5, 7-10"
                  className={`${INPUT_CLS} font-mono`}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Separate ranges with commas. Each range creates a separate file when splitting.
                </p>
              </SettingsCard>
            )}

            {/* ── Delete Pages Settings ── */}
            {activeTool === "delete-pages" && (
              <SettingsCard title="Pages to Delete">
                <input
                  value={deletePageNums}
                  onChange={(e) => setDeletePageNums(e.target.value)}
                  placeholder="e.g., 1, 3, 5-7"
                  className={`${INPUT_CLS} font-mono`}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  These pages will be removed from the PDF.
                </p>
              </SettingsCard>
            )}

            {/* ── Rotate Settings ── */}
            {activeTool === "rotate" && (
              <SettingsCard title="Rotation Angle">
                <div className="grid grid-cols-3 gap-1.5">
                  {([90, 180, 270] as const).map((angle) => (
                    <OptionButton
                      key={angle}
                      active={rotateAngle === angle}
                      onClick={() => setRotateAngle(angle)}
                      label={`${angle}°`}
                    />
                  ))}
                </div>
              </SettingsCard>
            )}

            {/* ── Compress Settings ── */}
            {activeTool === "compress" && (
              <>
                <SettingsCard title="Compression Level">
                  <div className="space-y-1.5">
                    {COMPRESS_LEVELS.map((cl) => (
                      <OptionButton
                        key={cl.id}
                        active={compressLevel === cl.id}
                        onClick={() => setCompressLevel(cl.id)}
                        label={cl.label}
                        desc={cl.desc}
                        fullWidth
                      />
                    ))}
                  </div>
                </SettingsCard>
                {compressResult && (
                  <SettingsCard title="Compression Results">
                    <div className="space-y-1.5">
                      <StatRow label="Original" value={fmtSize(compressResult.originalSize)} />
                      <StatRow label="Compressed" value={fmtSize(compressResult.compressedSize)} color="text-green-400" />
                      <StatRow label="Saved" value={`${compressResult.savedPercent}%`} color="text-primary-400" />
                    </div>
                  </SettingsCard>
                )}
              </>
            )}

            {/* ── Watermark Settings ── */}
            {activeTool === "watermark" && (
              <>
                <SettingsCard title="Watermark Text">
                  <input
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="CONFIDENTIAL"
                    className={INPUT_CLS}
                  />
                </SettingsCard>
                <SettingsCard title="Position">
                  <div className="grid grid-cols-2 gap-1.5">
                    {WATERMARK_POSITIONS.map((wp) => (
                      <OptionButton
                        key={wp.id}
                        active={watermarkPosition === wp.id}
                        onClick={() => setWatermarkPosition(wp.id as WatermarkOptions["position"])}
                        label={wp.label}
                      />
                    ))}
                  </div>
                </SettingsCard>
                <SettingsCard title="Appearance">
                  <label className="block text-[10px] text-gray-400 mb-1">
                    Opacity: {Math.round(watermarkOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0.01}
                    max={1}
                    step={0.01}
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full accent-primary-500"
                  />
                  <label className="block text-[10px] text-gray-400 mb-1 mt-2">
                    Font Size: {watermarkFontSize}px
                  </label>
                  <input
                    type="range"
                    min={12}
                    max={120}
                    step={2}
                    value={watermarkFontSize}
                    onChange={(e) => setWatermarkFontSize(parseInt(e.target.value))}
                    className="w-full accent-primary-500"
                  />
                </SettingsCard>
              </>
            )}

            {/* ── Page Numbers Settings ── */}
            {activeTool === "page-numbers" && (
              <>
                <SettingsCard title="Number Format">
                  <div className="space-y-1.5">
                    {PAGE_NUMBER_FORMATS.map((fmt) => (
                      <OptionButton
                        key={fmt.id}
                        active={pageNumberFormat === fmt.id}
                        onClick={() => setPageNumberFormat(fmt.id as PageNumberOptions["format"])}
                        label={fmt.label}
                        fullWidth
                      />
                    ))}
                  </div>
                </SettingsCard>
                <SettingsCard title="Position">
                  <div className="grid grid-cols-2 gap-1.5">
                    {PAGE_NUMBER_POSITIONS.map((pos) => (
                      <OptionButton
                        key={pos.id}
                        active={pageNumberPosition === pos.id}
                        onClick={() => setPageNumberPosition(pos.id as PageNumberOptions["position"])}
                        label={pos.label}
                      />
                    ))}
                  </div>
                </SettingsCard>
                <SettingsCard title="Start Number">
                  <input
                    type="number"
                    min={1}
                    value={pageNumberStart}
                    onChange={(e) => setPageNumberStart(parseInt(e.target.value) || 1)}
                    className={`${INPUT_CLS} w-24`}
                  />
                </SettingsCard>
              </>
            )}

            {/* ── Stamp Settings ── */}
            {activeTool === "stamp" && (
              <>
                <SettingsCard title="Stamp Text">
                  <input
                    value={stampText}
                    onChange={(e) => setStampText(e.target.value)}
                    placeholder="APPROVED"
                    className={INPUT_CLS}
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {["APPROVED", "REJECTED", "DRAFT", "SIGNED", "COPY", "VOID", "FINAL"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setStampText(t)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          stampText === t
                            ? "bg-primary-500/20 text-primary-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </SettingsCard>
                <SettingsCard title="Font Size">
                  <input
                    type="range"
                    min={8}
                    max={36}
                    step={1}
                    value={stampFontSize}
                    onChange={(e) => setStampFontSize(parseInt(e.target.value))}
                    className="w-full accent-primary-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{stampFontSize}px</p>
                </SettingsCard>
              </>
            )}

            {/* ── Protect Settings ── */}
            {activeTool === "protect" && (
              <SettingsCard title="Protection Mark">
                <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                  Adds a <strong className="text-gray-300">DMSuite • Protected</strong> producer mark to the PDF metadata.
                </p>
                <p className="text-[10px] text-amber-400/80 leading-relaxed">
                  Note: True password encryption requires a server-side solution. This stamps metadata only.
                </p>
              </SettingsCard>
            )}

            {/* ── Metadata Settings ── */}
            {activeTool === "metadata" && (
              <SettingsCard title="PDF Metadata">
                {[
                  { label: "Title", value: metaTitle, set: setMetaTitle },
                  { label: "Author", value: metaAuthor, set: setMetaAuthor },
                  { label: "Subject", value: metaSubject, set: setMetaSubject },
                  { label: "Keywords", value: metaKeywords, set: setMetaKeywords },
                  { label: "Creator", value: metaCreator, set: setMetaCreator },
                ].map((field) => (
                  <div key={field.label} className="mb-2">
                    <label className="block text-[10px] text-gray-400 mb-0.5">{field.label}</label>
                    <input
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      placeholder={field.label}
                      className={INPUT_CLS}
                    />
                  </div>
                ))}
              </SettingsCard>
            )}

            {/* ── Convert Settings ── */}
            {activeTool === "convert" && (
              <SettingsCard title="Conversion Mode">
                <div className="space-y-1.5">
                  <OptionButton
                    active={convertMode === "images-to-pdf"}
                    onClick={() => { setConvertMode("images-to-pdf"); clearFiles(); }}
                    label="Images → PDF"
                    desc="Combine images into a single PDF"
                    fullWidth
                  />
                  <OptionButton
                    active={convertMode === "pdf-to-images"}
                    onClick={() => { setConvertMode("pdf-to-images"); clearFiles(); }}
                    label="PDF → Images"
                    desc="Extract pages as images (coming soon)"
                    fullWidth
                  />
                </div>
              </SettingsCard>
            )}

            {/* ── Multi-Page Layout Settings ── */}
            {activeTool === "multi-page-layout" && (
              <SettingsCard title="Pages Per Sheet">
                <div className="grid grid-cols-2 gap-1.5">
                  {([2, 4, 6, 9] as const).map((n) => (
                    <OptionButton
                      key={n}
                      active={pagesPerSheet === n}
                      onClick={() => setPagesPerSheet(n)}
                      label={`${n}-Up`}
                      desc={`${n} pages per A4 sheet`}
                    />
                  ))}
                </div>
              </SettingsCard>
            )}

            {/* ── Scale Settings ── */}
            {activeTool === "scale" && (
              <>
                <SettingsCard title="Target Size">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Width (pt)</label>
                      <input
                        type="number"
                        value={Math.round(scaleWidth)}
                        onChange={(e) => setScaleWidth(parseFloat(e.target.value) || 595)}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Height (pt)</label>
                      <input
                        type="number"
                        value={Math.round(scaleHeight)}
                        onChange={(e) => setScaleHeight(parseFloat(e.target.value) || 842)}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2">Quick Presets:</p>
                  <div className="space-y-1">
                    {SCALE_PRESETS.map((p) => (
                      <OptionButton
                        key={p.label}
                        active={Math.abs(scaleWidth - p.width) < 1 && Math.abs(scaleHeight - p.height) < 1}
                        onClick={() => { setScaleWidth(p.width); setScaleHeight(p.height); }}
                        label={p.label}
                        fullWidth
                      />
                    ))}
                  </div>
                </SettingsCard>
              </>
            )}

            {/* ── Overlay Instructions ── */}
            {activeTool === "overlay" && (
              <SettingsCard title="How to Overlay">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Upload <strong>2 PDFs</strong>: The first is the <strong>base</strong>, the second is the <strong>overlay</strong> drawn on top.
                  Pages are matched 1:1 — overlay page 1 goes on base page 1, etc.
                </p>
              </SettingsCard>
            )}

            {/* ── Reverse Instructions ── */}
            {activeTool === "reverse" && (
              <SettingsCard title="Reverse Page Order">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Upload a PDF and all pages will be reversed — last page becomes first, etc.
                  Useful for fixing print ordering.
                </p>
              </SettingsCard>
            )}

            {/* ── Reorder Settings ── */}
            {activeTool === "reorder" && (
              <SettingsCard title="Reorder Pages">
                <input
                  value={reorderPageOrder}
                  onChange={(e) => setReorderPageOrder(e.target.value)}
                  placeholder="e.g., 3, 1, 2, 5, 4"
                  className={`${INPUT_CLS} font-mono`}
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Enter page numbers in desired order, comma-separated.
                  {files.length === 1 && files[0].pageCount > 1 && (
                    <> This PDF has {files[0].pageCount} pages.</>
                  )}
                </p>
                {files.length === 1 && files[0].pageCount > 1 && !reorderPageOrder && (
                  <button
                    onClick={() => setReorderPageOrder(
                      Array.from({ length: files[0].pageCount }, (_, i) => i + 1).join(", ")
                    )}
                    className="mt-1.5 text-[10px] text-primary-400 hover:text-primary-300 font-medium transition-colors"
                  >
                    Auto-fill page sequence →
                  </button>
                )}
              </SettingsCard>
            )}

            {/* ── Process Button ── */}
            <div className="pt-1">
              <button
                onClick={runProcess}
                disabled={!canProcess}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {processing ? (
                  <IconLoader className="size-4 animate-spin" />
                ) : done ? (
                  <IconCheck className="size-4" />
                ) : (
                  <IconFileText className="size-4" />
                )}
                {processLabel}
              </button>

              {processing && (
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-center">{progress}%</p>
                </div>
              )}

              {error && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-[10px] text-red-400">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: File Upload + Output ═══ */}
        <div
          className={`flex-1 min-w-0 flex flex-col overflow-hidden ${
            mobilePanel !== "files" ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Upload Zone */}
          <div className="p-4 shrink-0">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-primary-500 bg-primary-500/5"
                  : "border-gray-300 dark:border-gray-700 hover:border-primary-500/50"
              }`}
            >
              <IconPlus className="size-8 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Drag & drop {activeTool === "convert" && convertMode === "images-to-pdf" ? "images" : "PDF files"} here
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activeTool === "convert" && convertMode === "images-to-pdf"
                  ? "PNG, JPG • Multiple files allowed"
                  : isMultiFile
                    ? "Upload multiple PDFs"
                    : "Upload a PDF file"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple={isMultiFile}
                accept={acceptTypes}
                className="hidden"
                onChange={(e) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ""; } }}
              />
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin">
            {files.length > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700/50">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                    {files.length} file{files.length !== 1 ? "s" : ""} · {fmtSize(totalSize)} · {totalPages} page{totalPages !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={clearFiles}
                    className="text-[10px] text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {files.map((f, idx) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="size-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <IconFileText className="size-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{f.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {fmtSize(f.size)} · {f.pageCount} page{f.pageCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {(activeTool === "merge" || activeTool === "overlay") && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveFile(f.id, "up")}
                            disabled={idx === 0}
                            className="text-[10px] text-gray-400 hover:text-gray-200 disabled:opacity-20 transition-colors"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => moveFile(f.id, "down")}
                            disabled={idx === files.length - 1}
                            className="text-[10px] text-gray-400 hover:text-gray-200 disabled:opacity-20 transition-colors"
                          >
                            ▼
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => removeFile(f.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <IconTrash className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDF Info Display */}
            {activeTool === "info" && pdfInfo && (
              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700/50">
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white">PDF Information</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoField label="Pages" value={String(pdfInfo.pageCount)} />
                    <InfoField label="File Size" value={fmtSize(pdfInfo.fileSize)} />
                    <InfoField label="Title" value={pdfInfo.metadata.title || "—"} />
                    <InfoField label="Author" value={pdfInfo.metadata.author || "—"} />
                    <InfoField label="Subject" value={pdfInfo.metadata.subject || "—"} />
                    <InfoField label="Creator" value={pdfInfo.metadata.creator || "—"} />
                    <InfoField label="Producer" value={pdfInfo.metadata.producer || "—"} />
                    <InfoField label="Keywords" value={pdfInfo.metadata.keywords || "—"} />
                  </div>
                  {pdfInfo.pageSizes.length > 0 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700/50">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Page Sizes
                      </p>
                      <div className="space-y-0.5 max-h-40 overflow-y-auto">
                        {pdfInfo.pageSizes.map((ps) => (
                          <div key={ps.page} className="flex justify-between text-[10px]">
                            <span className="text-gray-400">Page {ps.page}</span>
                            <span className="text-gray-300 font-mono">
                              {ps.width} × {ps.height} pt
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {files.length === 0 && !(activeTool === "info" && pdfInfo) && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="size-16 rounded-2xl bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center mb-4">
                  <span className="text-3xl">{activeToolDef?.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {activeToolDef?.label}
                </h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  {activeToolDef?.desc}. Upload {isMultiFile ? "files" : "a file"} to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared Sub-Components ─────────────────────────────────── */

function SettingsCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700/40 bg-white dark:bg-gray-900/40 p-3">
      <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  label,
  desc,
  fullWidth,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`${fullWidth ? "w-full" : ""} text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
        active
          ? "bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/30"
          : "bg-gray-100 dark:bg-gray-800/60 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700/60 hover:text-gray-300"
      }`}
    >
      {label}
      {desc && <span className="block text-[10px] opacity-60 font-normal mt-0.5">{desc}</span>}
    </button>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold ${color ?? "text-gray-200"}`}>{value}</span>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-xs text-gray-200 truncate">{value}</p>
    </div>
  );
}
