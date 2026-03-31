// =============================================================================
// DMSuite — Document Signer — Document Tab
// Template selection, document name, description, PDF upload
// =============================================================================

"use client";

import { useCallback, useRef } from "react";
import {
  useDocumentSignerEditor,
  DOCUMENT_TEMPLATES,
} from "@/stores/document-signer-editor";

export default function DocumentSignerDocumentTab() {
  const form = useDocumentSignerEditor((s) => s.form);
  const setDocumentName = useDocumentSignerEditor((s) => s.setDocumentName);
  const setDescription = useDocumentSignerEditor((s) => s.setDescription);
  const applyTemplate = useDocumentSignerEditor((s) => s.applyTemplate);
  const setUploadedPdf = useDocumentSignerEditor((s) => s.setUploadedPdf);
  const clearUploadedPdf = useDocumentSignerEditor((s) => s.clearUploadedPdf);
  const addPage = useDocumentSignerEditor((s) => s.addPage);
  const removePage = useDocumentSignerEditor((s) => s.removePage);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setUploadedPdf(base64, file.name);
      };
      reader.readAsDataURL(file);
    },
    [setUploadedPdf]
  );

  return (
    <div className="p-4 space-y-6">
      {/* Document Name */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Document Name
        </label>
        <input
          type="text"
          value={form.documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          placeholder="e.g. Service Agreement"
          className="w-full h-9 px-3 rounded-lg bg-gray-800/60 border border-gray-700/50 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this document..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all resize-none"
        />
      </div>

      {/* Template Selection */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Document Template
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DOCUMENT_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                form.documentType === tpl.type
                  ? "border-primary-500/50 bg-primary-500/8 ring-1 ring-primary-500/20"
                  : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-white/10"
                  style={{ backgroundColor: tpl.thumbnailColor }}
                />
                <span className="text-[11px] font-semibold text-gray-200 truncate">
                  {tpl.name}
                </span>
              </div>
              <p className="text-[9px] text-gray-500 line-clamp-2 leading-relaxed">
                {tpl.description}
              </p>
              {tpl.pages > 0 && (
                <span className="text-[8px] text-gray-600 mt-1">
                  {tpl.pages} page{tpl.pages > 1 ? "s" : ""}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* PDF Upload */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Upload PDF Document
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
        {form.uploadedPdfData ? (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-primary-500/30 bg-primary-500/5">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary-400 shrink-0"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-200 truncate">
                {form.uploadedPdfName}
              </p>
              <p className="text-[9px] text-gray-500">PDF uploaded</p>
            </div>
            <button
              onClick={() => clearUploadedPdf()}
              className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-500/10 transition-all"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-4 rounded-xl border-2 border-dashed border-gray-700/50 hover:border-primary-500/40 bg-gray-800/20 hover:bg-primary-500/5 transition-all group"
          >
            <div className="flex flex-col items-center gap-1.5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-gray-600 group-hover:text-primary-400 transition-colors"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-[11px] text-gray-500 group-hover:text-gray-400">
                Click to upload PDF
              </span>
              <span className="text-[9px] text-gray-600">
                Max 20MB • PDF only
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Page Management */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Pages ({form.pages.length})
        </label>
        <div className="space-y-1">
          {form.pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-800/40 border border-gray-700/30"
            >
              <span className="text-xs text-gray-300">
                Page {page.number}
              </span>
              {form.pages.length > 1 && (
                <button
                  onClick={() => removePage(page.number)}
                  className="text-[10px] text-gray-500 hover:text-red-400 px-1.5 py-0.5 rounded transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => addPage()}
          className="w-full py-2 text-[11px] font-medium text-primary-400 hover:text-primary-300 border border-gray-700/40 hover:border-primary-500/30 rounded-lg transition-all hover:bg-primary-500/5"
        >
          + Add Page
        </button>
      </div>
    </div>
  );
}
