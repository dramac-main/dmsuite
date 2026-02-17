"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconFileText,
  IconDownload,
  IconLoader,
  IconPlus,
  IconTrash,
  IconCheck,
} from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */

type PDFTool = "merge" | "split" | "compress" | "protect" | "edit" | "convert";
type CompressQuality = "screen" | "ebook" | "printer" | "prepress";
type EditOp = "watermark" | "page-numbers" | "rotate-pages";
type ConvertMode = "pdf-to-images" | "pdf-to-docx" | "images-to-pdf";

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pages?: number;
}

interface ProtectSettings {
  password: string;
  confirmPassword: string;
  allowPrint: boolean;
  allowCopy: boolean;
  allowEdit: boolean;
}

/* ── Constants ─────────────────────────────────────────────── */

const PDF_TOOLS: { id: PDFTool; label: string }[] = [
  { id: "merge", label: "Merge" },
  { id: "split", label: "Split" },
  { id: "compress", label: "Compress" },
  { id: "protect", label: "Protect" },
  { id: "edit", label: "Edit" },
  { id: "convert", label: "Convert" },
];

const COMPRESS_LEVELS: { id: CompressQuality; label: string; desc: string }[] = [
  { id: "screen", label: "Screen", desc: "Smallest size, low quality" },
  { id: "ebook", label: "eBook", desc: "Medium quality" },
  { id: "printer", label: "Printer", desc: "High quality" },
  { id: "prepress", label: "Prepress", desc: "Highest quality" },
];

const EDIT_OPS: { id: EditOp; label: string }[] = [
  { id: "watermark", label: "Add Watermark Text" },
  { id: "page-numbers", label: "Add Page Numbers" },
  { id: "rotate-pages", label: "Rotate Pages" },
];

const CONVERT_MODES: { id: ConvertMode; label: string }[] = [
  { id: "pdf-to-images", label: "PDF → Images" },
  { id: "pdf-to-docx", label: "PDF → DOCX" },
  { id: "images-to-pdf", label: "Images → PDF" },
];

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
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [activeTool, setActiveTool] = useState<PDFTool>("merge");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Tool-specific state */
  const [splitRange, setSplitRange] = useState("1-3, 5, 7-10");
  const [compressLevel, setCompressLevel] = useState<CompressQuality>("ebook");
  const [compressResult, setCompressResult] = useState<{ original: number; compressed: number } | null>(null);
  const [protectSettings, setProtectSettings] = useState<ProtectSettings>({
    password: "",
    confirmPassword: "",
    allowPrint: true,
    allowCopy: false,
    allowEdit: false,
  });
  const [editOp, setEditOp] = useState<EditOp>("watermark");
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [rotateAngle, setRotateAngle] = useState(90);
  const [convertMode, setConvertMode] = useState<ConvertMode>("pdf-to-images");

  /* ── File handling ───────────────────────────────────────── */
  const addFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
      id: uid(),
      file: f,
      name: f.name,
      size: f.size,
      pages: Math.ceil(f.size / 50000) + 1,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setDone(false);
    setCompressResult(null);
  }, []);

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
  };

  const clearFiles = () => {
    setFiles([]);
    setDone(false);
    setCompressResult(null);
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

  /* ── Simulate processing ────────────────────────────────── */
  const runProcess = async () => {
    setProcessing(true);
    setProgress(0);
    setDone(false);
    for (let p = 0; p <= 100; p += 5) {
      await new Promise((r) => setTimeout(r, 100));
      setProgress(p);
    }
    if (activeTool === "compress" && files.length > 0) {
      const original = files.reduce((s, f) => s + f.size, 0);
      const ratio = compressLevel === "screen" ? 0.25 : compressLevel === "ebook" ? 0.5 : compressLevel === "printer" ? 0.7 : 0.85;
      setCompressResult({ original, compressed: Math.round(original * ratio) });
    }
    setProcessing(false);
    setProgress(100);
    setDone(true);
  };

  const acceptTypes = convertMode === "images-to-pdf" && activeTool === "convert" ? "image/*" : ".pdf";
  const passwordsMatch = protectSettings.password === protectSettings.confirmPassword && protectSettings.password.length > 0;

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 lg:hidden">
        {(["content", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div
          className={`w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto ${mobileTab !== "settings" ? "hidden lg:block" : ""}`}
        >
          {/* Tool Selector */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconFileText className="size-4 text-primary-500" />
              PDF Tool
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {PDF_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    clearFiles();
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTool === tool.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tool-specific Settings */}

          {/* Split Settings */}
          {activeTool === "split" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <label className="block text-xs text-gray-400">Page Ranges</label>
              <input
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder="e.g., 1-3, 5, 7-10"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <p className="text-[10px] text-gray-400">
                Separate ranges with commas. Example: 1-3, 5, 7-10
              </p>
            </div>
          )}

          {/* Compress Settings */}
          {activeTool === "compress" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider">Quality</label>
              <div className="space-y-1.5">
                {COMPRESS_LEVELS.map((cl) => (
                  <button
                    key={cl.id}
                    onClick={() => setCompressLevel(cl.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${compressLevel === cl.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                  >
                    <span className="text-xs font-medium">{cl.label}</span>
                    <span className="block text-[10px] opacity-70">{cl.desc}</span>
                  </button>
                ))}
              </div>
              {compressResult && (
                <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Original</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{fmtSize(compressResult.original)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Compressed</span>
                    <span className="text-green-500 font-semibold">{fmtSize(compressResult.compressed)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Saved</span>
                    <span className="text-primary-500 font-semibold">
                      {Math.round((1 - compressResult.compressed / compressResult.original) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Protect Settings */}
          {activeTool === "protect" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <label className="block text-xs text-gray-400">Password</label>
              <input
                type="password"
                value={protectSettings.password}
                onChange={(e) => setProtectSettings((p) => ({ ...p, password: e.target.value }))}
                placeholder="Enter password…"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
              <label className="block text-xs text-gray-400">Confirm Password</label>
              <input
                type="password"
                value={protectSettings.confirmPassword}
                onChange={(e) => setProtectSettings((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm password…"
                className={`w-full rounded-lg border bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${protectSettings.confirmPassword && !passwordsMatch ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
              />
              {protectSettings.confirmPassword && !passwordsMatch && (
                <p className="text-[10px] text-red-500">Passwords do not match</p>
              )}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <label className="block text-xs text-gray-400 font-semibold">Permissions</label>
                {(["allowPrint", "allowCopy", "allowEdit"] as const).map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={protectSettings[perm]}
                      onChange={(e) => setProtectSettings((p) => ({ ...p, [perm]: e.target.checked }))}
                      className="rounded accent-primary-500"
                    />
                    {perm === "allowPrint" ? "Allow Printing" : perm === "allowCopy" ? "Allow Copying" : "Allow Editing"}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Edit Settings */}
          {activeTool === "edit" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider">Operation</label>
              <div className="space-y-1.5">
                {EDIT_OPS.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setEditOp(op.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${editOp === op.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              {editOp === "watermark" && (
                <div className="pt-2">
                  <label className="block text-xs text-gray-400 mb-1">Watermark Text</label>
                  <input
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
              )}
              {editOp === "rotate-pages" && (
                <div className="pt-2">
                  <label className="block text-xs text-gray-400 mb-1">Rotation</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[90, 180, 270].map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setRotateAngle(angle)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${rotateAngle === angle ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                      >
                        {angle}°
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Convert Settings */}
          {activeTool === "convert" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider">Mode</label>
              <div className="space-y-1.5">
                {CONVERT_MODES.map((cm) => (
                  <button
                    key={cm.id}
                    onClick={() => setConvertMode(cm.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${convertMode === cm.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                  >
                    {cm.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Process Button */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <button
              onClick={runProcess}
              disabled={files.length === 0 || processing || (activeTool === "protect" && !passwordsMatch)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {processing ? (
                <IconLoader className="size-4 animate-spin" />
              ) : done ? (
                <IconCheck className="size-4" />
              ) : (
                <IconFileText className="size-4" />
              )}
              {processing
                ? "Processing…"
                : done
                ? "Done!"
                : activeTool === "merge"
                ? `Merge ${files.length} PDFs`
                : activeTool === "split"
                ? "Split PDF"
                : activeTool === "compress"
                ? "Compress PDF"
                : activeTool === "protect"
                ? "Protect PDF"
                : activeTool === "edit"
                ? "Apply Changes"
                : "Convert"}
            </button>

            {processing && (
              <div className="space-y-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 text-center">{progress}%</p>
              </div>
            )}

            {done && (
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <IconDownload className="size-4" />
                Download Result
              </button>
            )}
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-primary-500 bg-primary-500/5" : "border-gray-300 dark:border-gray-700 hover:border-primary-500/50 bg-white dark:bg-gray-900"}`}
          >
            <IconPlus className="size-8 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Drag & drop {activeTool === "convert" && convertMode === "images-to-pdf" ? "images" : "PDF files"} here
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {activeTool === "convert" && convertMode === "images-to-pdf"
                ? "PNG, JPG, WebP"
                : activeTool === "merge"
                ? "Upload multiple PDFs to merge"
                : "Upload a PDF file"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple={activeTool === "merge" || (activeTool === "convert" && convertMode === "images-to-pdf")}
              accept={acceptTypes}
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {files.length} file{files.length !== 1 ? "s" : ""} · {fmtSize(files.reduce((s, f) => s + f.size, 0))}
                </span>
                <button
                  onClick={clearFiles}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {files.map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="size-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                      <IconFileText className="size-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{f.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {fmtSize(f.size)}
                        {f.pages ? ` · ~${f.pages} pages` : ""}
                      </p>
                    </div>
                    {/* Merge reorder buttons */}
                    {activeTool === "merge" && (
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveFile(f.id, "up")}
                          disabled={idx === 0}
                          className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveFile(f.id, "down")}
                          disabled={idx === files.length - 1}
                          className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(f.id)}
                      className="p-1 hover:text-red-500 text-gray-400 transition-colors"
                    >
                      <IconTrash className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconFileText className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {activeTool === "merge"
                  ? "Merge PDF Files"
                  : activeTool === "split"
                  ? "Split a PDF"
                  : activeTool === "compress"
                  ? "Compress a PDF"
                  : activeTool === "protect"
                  ? "Protect a PDF"
                  : activeTool === "edit"
                  ? "Edit a PDF"
                  : "Convert Files"}
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                {activeTool === "merge"
                  ? "Upload multiple PDF files to merge them into one. Reorder them after uploading."
                  : activeTool === "split"
                  ? "Upload a PDF and specify page ranges to split it into multiple files."
                  : activeTool === "compress"
                  ? "Upload a PDF to reduce its file size. Choose a quality level in the settings."
                  : activeTool === "protect"
                  ? "Upload a PDF and set a password to protect it with encryption."
                  : activeTool === "edit"
                  ? "Upload a PDF to add watermarks, page numbers, or rotate pages."
                  : "Convert between PDF and other formats — images or documents."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
