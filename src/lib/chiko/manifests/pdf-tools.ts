// =============================================================================
// DMSuite — Chiko AI Manifest: PDF Tools Suite
// Gives Chiko full control over every PDF operation.
// =============================================================================

import type { ChikoActionManifest } from "@/stores/chiko-actions";

/* ── Types for the workspace ref ──────────────────────────── */

export interface PDFToolsRefs {
  getState: () => {
    activeTool: string;
    fileCount: number;
    fileNames: string[];
    totalSize: number;
    totalPages: number;
    processing: boolean;
    done: boolean;
    splitRange: string;
    compressLevel: string;
    watermarkText: string;
    watermarkPosition: string;
    watermarkOpacity: number;
    watermarkFontSize: number;
    pageNumberFormat: string;
    pageNumberPosition: string;
    rotateAngle: number;
    convertMode: string;
    protectPassword: string;
    metadataTitle: string;
    metadataAuthor: string;
    stampText: string;
    stampFontSize: number;
    pagesPerSheet: number;
    compressResult: { original: number; compressed: number; savedPercent: number } | null;
  };
  setTool: (tool: string) => void;
  setSplitRange: (range: string) => void;
  setCompressLevel: (level: string) => void;
  setWatermarkText: (text: string) => void;
  setWatermarkPosition: (pos: string) => void;
  setWatermarkOpacity: (opacity: number) => void;
  setWatermarkFontSize: (size: number) => void;
  setPageNumberFormat: (fmt: string) => void;
  setPageNumberPosition: (pos: string) => void;
  setPageNumberStart: (n: number) => void;
  setRotateAngle: (angle: number) => void;
  setConvertMode: (mode: string) => void;
  setProtectPassword: (pw: string) => void;
  setProtectConfirm: (pw: string) => void;
  setReorderPageOrder: (order: string) => void;
  setMetadata: (field: string, value: string) => void;
  setStampText: (text: string) => void;
  setStampFontSize: (size: number) => void;
  setPagesPerSheet: (n: number) => void;
  runProcess: () => Promise<void>;
  clearFiles: () => void;
}

/* ── Manifest Factory ─────────────────────────────────────── */

export function createPDFToolsManifest(refs: PDFToolsRefs): ChikoActionManifest {
  return {
    toolId: "pdf-tools",
    toolName: "PDF Tools Suite",
    actions: [
      // ── Tool Selection ──
      {
        name: "selectTool",
        description:
          "Switch to a specific PDF tool. Available tools: merge, split, extract, rotate, delete-pages, reorder, compress, watermark, page-numbers, stamp, protect, metadata, convert, multi-page-layout, overlay, reverse, scale, info. Use this FIRST before configuring or running.",
        parameters: {
          type: "object",
          properties: {
            tool: {
              type: "string",
              enum: [
                "merge", "split", "extract", "rotate", "delete-pages", "reorder",
                "compress", "watermark", "page-numbers", "stamp", "protect",
                "metadata", "convert", "multi-page-layout", "overlay", "reverse",
                "scale", "info",
              ],
            },
          },
          required: ["tool"],
        },
        category: "Navigation",
      },

      // ── Merge ──
      {
        name: "runMerge",
        description: "Merge all uploaded PDF files into a single PDF. Files are combined in the order shown in the file list. User must upload files first.",
        parameters: { type: "object", properties: {} },
        category: "Page Operations",
      },

      // ── Split ──
      {
        name: "configureSplit",
        description: "Set page ranges for splitting a PDF. Use comma-separated ranges like '1-3, 5, 7-10'. Each range becomes a separate output PDF.",
        parameters: {
          type: "object",
          properties: {
            pageRanges: { type: "string", description: "Comma-separated page ranges, e.g. '1-3, 5, 7-10'" },
          },
          required: ["pageRanges"],
        },
        category: "Page Operations",
      },
      {
        name: "runSplit",
        description: "Execute the split operation using the configured page ranges. Downloads separate PDF files for each range.",
        parameters: { type: "object", properties: {} },
        category: "Page Operations",
      },

      // ── Extract ──
      {
        name: "configureExtract",
        description: "Set which pages to extract from the PDF. Produces a new PDF with only those pages.",
        parameters: {
          type: "object",
          properties: {
            pageRanges: { type: "string", description: "Pages to extract, e.g. '1, 3, 5-8'" },
          },
          required: ["pageRanges"],
        },
        category: "Page Operations",
      },

      // ── Rotate ──
      {
        name: "configureRotate",
        description: "Set the rotation angle for pages. Can rotate 90°, 180°, or 270° clockwise.",
        parameters: {
          type: "object",
          properties: {
            angle: { type: "number", enum: [90, 180, 270], description: "Rotation angle in degrees clockwise" },
          },
          required: ["angle"],
        },
        category: "Page Operations",
      },

      // ── Reorder ──
      {
        name: "configureReorder",
        description: "Set a custom page order for a single PDF. Use comma-separated 1-based page numbers, e.g. '3, 1, 2, 5, 4' puts page 3 first, then page 1, etc.",
        parameters: {
          type: "object",
          properties: {
            pageOrder: { type: "string", description: "Comma-separated page numbers in desired order, e.g. '3, 1, 2, 5, 4'" },
          },
          required: ["pageOrder"],
        },
        category: "Page Operations",
      },

      // ── Compress ──
      {
        name: "configureCompress",
        description: "Set compression level for PDF. 'low' = gentle, 'medium' = balanced, 'high' = aggressive with metadata strip, 'maximum' = smallest possible.",
        parameters: {
          type: "object",
          properties: {
            level: { type: "string", enum: ["low", "medium", "high", "maximum"] },
          },
          required: ["level"],
        },
        category: "Optimize",
      },

      // ── Watermark ──
      {
        name: "configureWatermark",
        description: "Configure watermark settings. Sets text, position, opacity, and font size for the watermark overlay on all pages.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Watermark text, e.g. 'CONFIDENTIAL', 'DRAFT', 'SAMPLE'" },
            position: { type: "string", enum: ["center", "diagonal", "top-left", "top-right", "bottom-left", "bottom-right"] },
            opacity: { type: "number", description: "0.0 to 1.0, default 0.15" },
            fontSize: { type: "number", description: "Font size in points, default 48" },
          },
          required: ["text"],
        },
        category: "Content & Editing",
      },

      // ── Page Numbers ──
      {
        name: "configurePageNumbers",
        description: "Configure page numbering. Sets format, position, and starting number.",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["plain", "page-of-total", "dash", "parentheses"] },
            position: { type: "string", enum: ["bottom-center", "bottom-left", "bottom-right", "top-center", "top-left", "top-right"] },
            startNumber: { type: "number", description: "Starting page number, default 1" },
          },
        },
        category: "Content & Editing",
      },

      // ── Stamp ──
      {
        name: "configureStamp",
        description: "Configure a text stamp to overlay on pages. Stamps appear as bordered text. Good for 'APPROVED', 'REJECTED', 'SIGNED', 'COPY', etc.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "Stamp text" },
            fontSize: { type: "number", description: "Font size, default 14" },
          },
          required: ["text"],
        },
        category: "Content & Editing",
      },

      // ── Protect ──
      {
        name: "configureProtect",
        description: "Mark the PDF as protected by adding a DMSuite producer metadata stamp. Note: true password encryption is not available client-side.",
        parameters: {
          type: "object",
          properties: {},
        },
        category: "Security",
      },

      // ── Metadata ──
      {
        name: "configureMetadata",
        description: "Set PDF metadata fields: title, author, subject, keywords, creator.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            author: { type: "string" },
            subject: { type: "string" },
            keywords: { type: "string", description: "Comma-separated keywords" },
            creator: { type: "string" },
          },
        },
        category: "Content & Editing",
      },

      // ── Convert ──
      {
        name: "configureConvert",
        description: "Set conversion mode: 'images-to-pdf' combines uploaded images into a PDF. 'pdf-to-images' extracts pages as images.",
        parameters: {
          type: "object",
          properties: {
            mode: { type: "string", enum: ["images-to-pdf", "pdf-to-images"] },
          },
          required: ["mode"],
        },
        category: "Convert",
      },

      // ── Multi-Page Layout ──
      {
        name: "configureMultiPageLayout",
        description: "Set pages-per-sheet for multi-page layout (n-up printing). Options: 2, 4, 6, or 9 pages per A4 sheet.",
        parameters: {
          type: "object",
          properties: {
            pagesPerSheet: { type: "number", enum: [2, 4, 6, 9] },
          },
          required: ["pagesPerSheet"],
        },
        category: "Advanced",
      },

      // ── Universal Process ──
      {
        name: "runProcess",
        description: "Execute the currently selected PDF tool operation. Make sure files are uploaded and settings configured before calling this.",
        parameters: { type: "object", properties: {} },
        category: "Actions",
      },

      // ── File Management ──
      {
        name: "clearFiles",
        description: "Remove all uploaded files and reset the workspace.",
        parameters: { type: "object", properties: {} },
        category: "Actions",
        destructive: true,
      },

      // ── Read State ──
      {
        name: "readCurrentState",
        description: "Read the current state of the PDF Tools workspace — active tool, files, settings, and results.",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
    ],

    getState: () => {
      const s = refs.getState();
      return {
        activeTool: s.activeTool,
        fileCount: s.fileCount,
        fileNames: s.fileNames,
        totalSize: `${(s.totalSize / 1024).toFixed(1)} KB`,
        totalPages: s.totalPages,
        processing: s.processing,
        done: s.done,
        settings: {
          splitRange: s.splitRange,
          compressLevel: s.compressLevel,
          watermarkText: s.watermarkText,
          watermarkPosition: s.watermarkPosition,
          watermarkOpacity: s.watermarkOpacity,
          rotateAngle: s.rotateAngle,
          pageNumberFormat: s.pageNumberFormat,
          pageNumberPosition: s.pageNumberPosition,
          convertMode: s.convertMode,
          stampText: s.stampText,
          pagesPerSheet: s.pagesPerSheet,
        },
        compressResult: s.compressResult,
      } as Record<string, unknown>;
    },

    executeAction: (actionName: string, params: Record<string, unknown>) => {
      try {
        switch (actionName) {
          case "selectTool":
            refs.setTool(params.tool as string);
            return { success: true, message: `Switched to ${params.tool} tool.` };

          case "runMerge":
            refs.setTool("merge");
            refs.runProcess();
            return { success: true, message: "Merging uploaded PDFs..." };

          case "configureSplit":
            refs.setTool("split");
            refs.setSplitRange(params.pageRanges as string);
            return { success: true, message: `Split ranges set to: ${params.pageRanges}` };

          case "runSplit":
            refs.runProcess();
            return { success: true, message: "Splitting PDF..." };

          case "configureExtract":
            refs.setTool("extract");
            refs.setSplitRange(params.pageRanges as string);
            return { success: true, message: `Extract pages set to: ${params.pageRanges}` };

          case "configureRotate":
            refs.setTool("rotate");
            refs.setRotateAngle(params.angle as number);
            return { success: true, message: `Rotation angle set to ${params.angle}°` };

          case "configureReorder":
            refs.setTool("reorder");
            refs.setReorderPageOrder(params.pageOrder as string);
            return { success: true, message: `Page order set to: ${params.pageOrder}` };

          case "configureCompress":
            refs.setTool("compress");
            refs.setCompressLevel(params.level as string);
            return { success: true, message: `Compression level set to ${params.level}` };

          case "configureWatermark":
            refs.setTool("watermark");
            refs.setWatermarkText(params.text as string);
            if (params.position) refs.setWatermarkPosition(params.position as string);
            if (params.opacity !== undefined) refs.setWatermarkOpacity(params.opacity as number);
            if (params.fontSize !== undefined) refs.setWatermarkFontSize(params.fontSize as number);
            return { success: true, message: `Watermark configured: "${params.text}"` };

          case "configurePageNumbers":
            refs.setTool("page-numbers");
            if (params.format) refs.setPageNumberFormat(params.format as string);
            if (params.position) refs.setPageNumberPosition(params.position as string);
            if (params.startNumber !== undefined) refs.setPageNumberStart(params.startNumber as number);
            return { success: true, message: "Page number settings updated." };

          case "configureStamp":
            refs.setTool("stamp");
            refs.setStampText(params.text as string);
            if (params.fontSize !== undefined) refs.setStampFontSize(params.fontSize as number);
            return { success: true, message: `Stamp configured: "${params.text}"` };

          case "configureProtect":
            refs.setTool("protect");
            return { success: true, message: "Protection metadata configured. Note: this adds a producer mark, not encryption." };

          case "configureMetadata":
            refs.setTool("metadata");
            if (params.title) refs.setMetadata("title", params.title as string);
            if (params.author) refs.setMetadata("author", params.author as string);
            if (params.subject) refs.setMetadata("subject", params.subject as string);
            if (params.keywords) refs.setMetadata("keywords", params.keywords as string);
            if (params.creator) refs.setMetadata("creator", params.creator as string);
            return { success: true, message: "Metadata fields updated." };

          case "configureConvert":
            refs.setTool("convert");
            refs.setConvertMode(params.mode as string);
            return { success: true, message: `Conversion mode set to ${params.mode}` };

          case "configureMultiPageLayout":
            refs.setTool("multi-page-layout");
            refs.setPagesPerSheet(params.pagesPerSheet as number);
            return { success: true, message: `Multi-page layout set to ${params.pagesPerSheet}-up` };

          case "runProcess":
            refs.runProcess();
            return { success: true, message: "Processing..." };

          case "clearFiles":
            refs.clearFiles();
            return { success: true, message: "All files cleared." };

          case "readCurrentState":
            return {
              success: true,
              message: "Current PDF Tools state retrieved.",
              newState: refs.getState() as Record<string, unknown>,
            };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, message: `Error: ${msg}` };
      }
    },
  };
}
