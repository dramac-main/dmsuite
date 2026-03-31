// =============================================================================
// DMSuite — Document Signer — Signers Tab
// Manage document signing parties/recipients
// =============================================================================

"use client";

import { useCallback, useState } from "react";
import { useDocumentSignerEditor } from "@/stores/document-signer-editor";

export default function DocumentSignerSignersTab() {
  const form = useDocumentSignerEditor((s) => s.form);
  const addSigner = useDocumentSignerEditor((s) => s.addSigner);
  const updateSigner = useDocumentSignerEditor((s) => s.updateSigner);
  const removeSigner = useDocumentSignerEditor((s) => s.removeSigner);
  const setActiveSignerId = useDocumentSignerEditor((s) => s.setActiveSignerId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAddSigner = useCallback(() => {
    const n = form.signers.length + 1;
    addSigner(`Signer ${n}`, "");
  }, [addSigner, form.signers.length]);

  return (
    <div className="p-4 space-y-5">
      {/* Signing order info */}
      <div className="p-3 rounded-xl border border-gray-700/30 bg-gray-800/20">
        <p className="text-[10px] text-gray-400 leading-relaxed">
          <span className="text-primary-400 font-semibold">Signing Order: </span>
          Signers will receive the document in the order listed below.
          Each signer only sees fields assigned to them.
        </p>
      </div>

      {/* Signers list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Signing Parties ({form.signers.length})
          </label>
        </div>

        <div className="space-y-2">
          {form.signers.map((signer, idx) => {
            const isExpanded = expandedId === signer.id;
            const isActive = form.activeSignerId === signer.id;
            const assignedFields = form.fields.filter((f) => f.assignedTo === signer.id);

            return (
              <div
                key={signer.id}
                className={`rounded-xl border transition-all ${
                  isActive
                    ? "border-primary-500/40 bg-primary-500/5"
                    : "border-gray-700/40 bg-gray-800/20"
                }`}
              >
                {/* Header */}
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : signer.id);
                    setActiveSignerId(signer.id);
                  }}
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: signer.color }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-gray-200 truncate">
                      {signer.name || "Unnamed Signer"}
                    </p>
                    <p className="text-[9px] text-gray-500">
                      {signer.email || "No email"} • {assignedFields.length} field{assignedFields.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                        signer.status === "signed"
                          ? "bg-green-500/20 text-green-400"
                          : signer.status === "viewed"
                            ? "bg-amber-500/20 text-amber-400"
                            : signer.status === "declined"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-gray-700/50 text-gray-400"
                      }`}
                    >
                      {signer.status.toUpperCase()}
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-gray-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gray-700/30 pt-3">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        value={signer.name}
                        onChange={(e) => updateSigner(signer.id, { name: e.target.value })}
                        placeholder="Signer name"
                        className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase tracking-wider">Email</label>
                      <input
                        type="email"
                        value={signer.email}
                        onChange={(e) => updateSigner(signer.id, { email: e.target.value })}
                        placeholder="signer@example.com"
                        className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase tracking-wider">Phone (optional)</label>
                      <input
                        type="tel"
                        value={signer.phone || ""}
                        onChange={(e) => updateSigner(signer.id, { phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
                      />
                    </div>

                    {/* Signer color */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-gray-500 uppercase tracking-wider">Assignment Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={signer.color}
                          onChange={(e) => updateSigner(signer.id, { color: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-gray-700/50"
                        />
                        <span className="text-[9px] text-gray-500 font-mono">{signer.color}</span>
                      </div>
                    </div>

                    {/* Assigned fields summary */}
                    {assignedFields.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[9px] text-gray-500 uppercase tracking-wider">
                          Assigned Fields
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {assignedFields.map((f) => (
                            <span
                              key={f.id}
                              className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-700/40 text-gray-400"
                            >
                              {f.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remove button */}
                    {form.signers.length > 1 && (
                      <button
                        onClick={() => removeSigner(signer.id)}
                        className="w-full py-1.5 text-[10px] text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all hover:bg-red-500/5"
                      >
                        Remove Signer
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add signer button */}
        <button
          onClick={handleAddSigner}
          className="w-full py-2.5 text-[11px] font-medium text-primary-400 hover:text-primary-300 border border-gray-700/40 hover:border-primary-500/30 rounded-xl transition-all hover:bg-primary-500/5"
        >
          + Add Signer
        </button>
      </div>

      {/* Signing workflow info */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Document Status
        </label>
        <div className="p-3 rounded-xl border border-gray-700/30 bg-gray-800/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Status</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              form.status === "completed"
                ? "bg-green-500/20 text-green-400"
                : form.status === "in-progress"
                  ? "bg-amber-500/20 text-amber-400"
                  : form.status === "cancelled"
                    ? "bg-red-500/20 text-red-400"
                    : form.status === "sent"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-gray-700/50 text-gray-400"
            }`}>
              {form.status.replace("-", " ").toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Signed</span>
            <span className="text-[10px] text-gray-300">
              {form.signers.filter((s) => s.status === "signed").length} / {form.signers.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Total Fields</span>
            <span className="text-[10px] text-gray-300">{form.fields.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Filled</span>
            <span className="text-[10px] text-gray-300">
              {form.fields.filter((f) => !!f.value).length} / {form.fields.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
