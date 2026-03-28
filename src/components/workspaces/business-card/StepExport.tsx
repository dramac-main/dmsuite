// =============================================================================
// DMSuite — Step 6: Export
// Export modal with PNG, PDF, clipboard, and batch options.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessCardWizard } from "@/stores/business-card-wizard";
import { useEditorStore } from "@/stores/editor";

type ExportFormat = "png" | "pdf" | "clipboard" | "batch";
type ExportScale = 1 | 2 | 3;

export default function StepExport() {
  const { documents, prevStep, resetWizard } = useBusinessCardWizard();
  const { doc } = useEditorStore();
  const [activeFormat, setActiveFormat] = useState<ExportFormat>("png");
  const [scale, setScale] = useState<ExportScale>(2);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [includeBleed, setIncludeBleed] = useState(false);
  const [includeBothSides, setIncludeBothSides] = useState(true);

  const handleExportPNG = useCallback(async () => {
    const activeDoc = doc || documents.frontDoc;
    if (!activeDoc) return;

    setIsExporting(true);
    try {
      const { renderToCanvas } = await import("@/lib/editor/renderer");
      const canvas = renderToCanvas(activeDoc, scale);

      const link = document.createElement("a");
      link.download = `business-card-${documents.currentSide}-${scale}x.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      setExportSuccess("PNG downloaded successfully!");
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (e) {
      console.error("PNG export failed:", e);
    } finally {
      setIsExporting(false);
    }
  }, [doc, documents.frontDoc, documents.currentSide, scale]);

  const handleExportPDF = useCallback(async () => {
    const activeDoc = doc || documents.frontDoc;
    if (!activeDoc) return;

    setIsExporting(true);
    try {
      const { renderDocumentToPdf, downloadPdf } = await import("@/lib/editor/pdf-renderer");

      if (includeBothSides && documents.backDoc) {
        // Multi-page: front + back
        // Render front page first
        const frontBytes = await renderDocumentToPdf(activeDoc, {
          fileName: "business-card",
          author: "DMSuite",
        });

        // For multi-page, render back separately and merge via pdf-lib
        const { PDFDocument } = await import("pdf-lib");
        const backBytes = await renderDocumentToPdf(documents.backDoc, {
          fileName: "business-card-back",
          author: "DMSuite",
        });

        // Merge front + back into one PDF
        const merged = await PDFDocument.create();
        const frontPdf = await PDFDocument.load(frontBytes);
        const backPdf = await PDFDocument.load(backBytes);
        const [frontPage] = await merged.copyPages(frontPdf, [0]);
        const [backPage] = await merged.copyPages(backPdf, [0]);
        merged.addPage(frontPage);
        merged.addPage(backPage);
        const mergedBytes = await merged.save();
        downloadPdf(mergedBytes, "business-card.pdf");
      } else {
        const pdfBytes = await renderDocumentToPdf(activeDoc, {
          fileName: "business-card",
          author: "DMSuite",
        });
        downloadPdf(pdfBytes, "business-card.pdf");
      }

      setExportSuccess("PDF downloaded successfully!");
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setIsExporting(false);
    }
  }, [doc, documents.frontDoc, documents.backDoc, includeBothSides]);

  const handleCopyToClipboard = useCallback(async () => {
    const activeDoc = doc || documents.frontDoc;
    if (!activeDoc) return;

    setIsExporting(true);
    try {
      const { renderToCanvas } = await import("@/lib/editor/renderer");
      const canvas = renderToCanvas(activeDoc, scale);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setExportSuccess("Copied to clipboard!");
        setTimeout(() => setExportSuccess(null), 3000);
      }
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    } finally {
      setIsExporting(false);
    }
  }, [doc, documents.frontDoc, scale]);

  const FORMAT_OPTIONS: {
    id: ExportFormat;
    label: string;
    desc: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "png", label: "Download PNG", desc: "High-resolution raster image", Icon: ({ className }) => (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
    )},
    { id: "pdf", label: "Download PDF", desc: "Print-ready vector document", Icon: ({ className }) => (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
    )},
    { id: "clipboard", label: "Copy to Clipboard", desc: "Paste directly into other apps", Icon: ({ className }) => (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
    )},
    { id: "batch", label: "Batch Export", desc: "Generate cards for multiple people", Icon: ({ className }) => (
      <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
    )},
  ];

  return (
    <div className="flex flex-col items-center min-h-[60vh] gap-8 px-4 py-4 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-white mb-2">Export</h2>
        <p className="text-gray-400 text-sm">
          Your business card is ready! Choose an export format.
        </p>
      </motion.div>

      {/* Format selection */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {FORMAT_OPTIONS.map(({ id, label, desc, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveFormat(id)}
            className={`rounded-xl p-4 text-left transition-all border ${
              activeFormat === id
                ? "bg-primary-500/10 border-primary-500/50 ring-1 ring-primary-500/30"
                : "bg-gray-800/40 border-gray-700/50 hover:border-gray-600"
            }`}
          >
            <span className="mb-2 block text-gray-400"><Icon /></span>
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </button>
        ))}
      </motion.div>

      {/* Format-specific options */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="w-full bg-gray-800/30 rounded-xl p-5 border border-gray-700/40 space-y-4"
      >
        {activeFormat === "png" && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Resolution
            </p>
            <div className="flex gap-3">
              {([1, 2, 3] as ExportScale[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`flex-1 rounded-lg p-3 text-center border transition-all ${
                    scale === s
                      ? "bg-primary-500/10 border-primary-500/50"
                      : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
                  }`}
                >
                  <p className="text-white font-semibold text-sm">{s}x</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {s === 1 ? "72 DPI" : s === 2 ? "150 DPI" : "300 DPI"}
                  </p>
                </button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPNG}
              disabled={isExporting}
              className="w-full py-3 rounded-xl bg-primary-500 text-gray-950 font-semibold text-sm hover:bg-primary-400 transition-colors disabled:opacity-50"
            >
              {isExporting ? "Exporting..." : "Download PNG"}
            </motion.button>
          </div>
        )}

        {activeFormat === "pdf" && (
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBleed}
                onChange={(e) => setIncludeBleed(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30"
              />
              <span className="text-sm text-gray-300">Include bleed & crop marks</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeBothSides}
                onChange={(e) => setIncludeBothSides(e.target.checked)}
                className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30"
              />
              <span className="text-sm text-gray-300">Include front & back</span>
            </label>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full py-3 rounded-xl bg-primary-500 text-gray-950 font-semibold text-sm hover:bg-primary-400 transition-colors disabled:opacity-50"
            >
              {isExporting ? "Generating PDF..." : "Download PDF"}
            </motion.button>
          </div>
        )}

        {activeFormat === "clipboard" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Copy the card as a PNG image to your clipboard. You can paste it directly into
              presentations, documents, or design tools.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyToClipboard}
              disabled={isExporting}
              className="w-full py-3 rounded-xl bg-primary-500 text-gray-950 font-semibold text-sm hover:bg-primary-400 transition-colors disabled:opacity-50"
            >
              {isExporting ? "Copying..." : "Copy to Clipboard"}
            </motion.button>
          </div>
        )}

        {activeFormat === "batch" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Upload a CSV with contact details to generate cards for multiple people
              using the same design.
            </p>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-dashed border-gray-600 text-center">
              <p className="text-xs text-gray-500 mb-2">
                Batch export will be available in a future update.
              </p>
              <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
                Download CSV Template
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Success toast */}
      <AnimatePresence>
        {exportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-6 right-6 bg-green-500/20 border border-green-500/40 text-green-300 px-5 py-3 rounded-xl text-sm font-medium shadow-xl"
          >
            ✓ {exportSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={prevStep}
          className="px-5 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          ← Back to Editor
        </button>
        <button
          onClick={() => {
            if (confirm("Start a new business card design? This will clear your current work.")) {
              resetWizard();
            }
          }}
          className="px-5 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}
