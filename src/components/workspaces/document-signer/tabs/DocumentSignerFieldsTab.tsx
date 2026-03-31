// =============================================================================
// DMSuite — Document Signer — Fields Tab
// Field type palette, field list, field properties editor
// =============================================================================

"use client";

import { useCallback } from "react";
import {
  useDocumentSignerEditor,
  type SignerFieldType,
  type DocumentField,
} from "@/stores/document-signer-editor";

// ── Field type palette ──────────────────────────────────────────────────────
const FIELD_PALETTE: { type: SignerFieldType; label: string; icon: string }[] = [
  { type: "signature", label: "Signature", icon: "M3 17l6-6 4 4 8-8M14 7h7v7" },
  { type: "initials", label: "Initials", icon: "M4 7V4h4M20 7V4h-4M4 17v3h4M20 17v3h-4M8 12h8" },
  { type: "date", label: "Date", icon: "M8 7V3m8 4V3M3 11h18M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" },
  { type: "text", label: "Text", icon: "M4 7h16M4 12h10M4 17h14" },
  { type: "number", label: "Number", icon: "M7 20l4-16m2 16l4-16M3 8h18M3 16h18" },
  { type: "email", label: "Email", icon: "M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { type: "phone", label: "Phone", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
  { type: "checkbox", label: "Checkbox", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { type: "radio", label: "Radio", icon: "M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0" },
  { type: "select", label: "Dropdown", icon: "M8 9l4-4 4 4M16 15l-4 4-4-4" },
  { type: "textarea", label: "Text Area", icon: "M4 6h16M4 10h16M4 14h10M4 18h14" },
  { type: "file", label: "File", icon: "M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z M14 2v5h5" },
  { type: "stamp", label: "Stamp", icon: "M12 8V4l8 4-8 4V8M4 16h16M4 20h16" },
  { type: "image", label: "Image", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
];

export default function DocumentSignerFieldsTab() {
  const form = useDocumentSignerEditor((s) => s.form);
  const addField = useDocumentSignerEditor((s) => s.addField);
  const updateField = useDocumentSignerEditor((s) => s.updateField);
  const removeField = useDocumentSignerEditor((s) => s.removeField);
  const duplicateField = useDocumentSignerEditor((s) => s.duplicateField);
  const setSelectedFieldId = useDocumentSignerEditor((s) => s.setSelectedFieldId);
  const clearAllFields = useDocumentSignerEditor((s) => s.clearAllFields);

  const selectedField = form.fields.find((f) => f.id === form.selectedFieldId);

  // Add field at center of active page
  const handleAddField = useCallback(
    (type: SignerFieldType) => {
      const id = addField(type, form.activePage, 30, 40);
      setSelectedFieldId(id);
    },
    [addField, form.activePage, setSelectedFieldId]
  );

  // Signer color map for field list
  const signerMap = new Map(form.signers.map((s) => [s.id, s]));

  return (
    <div className="p-4 space-y-5">
      {/* Field Type Palette */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Add Field
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {FIELD_PALETTE.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => handleAddField(type)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-700/40 bg-gray-800/30 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all group"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500 group-hover:text-primary-400 transition-colors"
              >
                <path d={icon} />
              </svg>
              <span className="text-[9px] text-gray-500 group-hover:text-gray-300 transition-colors">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active page fields list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Fields on Page {form.activePage} ({form.fields.filter((f) => f.page === form.activePage).length})
          </label>
          {form.fields.length > 0 && (
            <button
              onClick={() => clearAllFields()}
              className="text-[9px] text-red-400/70 hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
          {form.fields
            .filter((f) => f.page === form.activePage)
            .map((field) => {
              const signer = signerMap.get(field.assignedTo);
              return (
                <button
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    form.selectedFieldId === field.id
                      ? "border-primary-500/50 bg-primary-500/8"
                      : "border-gray-700/30 bg-gray-800/20 hover:border-gray-600"
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: signer?.color || "#8b5cf6" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-200 truncate">{field.label}</p>
                    <p className="text-[9px] text-gray-500 capitalize">{field.type}</p>
                  </div>
                  {field.required && (
                    <span className="text-[8px] text-red-400/70">REQ</span>
                  )}
                </button>
              );
            })}
          {form.fields.filter((f) => f.page === form.activePage).length === 0 && (
            <p className="text-[10px] text-gray-600 text-center py-4">
              No fields on this page. Click a field type above to add one.
            </p>
          )}
        </div>
      </div>

      {/* Selected Field Properties */}
      {selectedField && (
        <FieldProperties
          field={selectedField}
          signers={form.signers}
          onUpdate={(patch) => updateField(selectedField.id, patch)}
          onRemove={() => removeField(selectedField.id)}
          onDuplicate={() => duplicateField(selectedField.id)}
        />
      )}
    </div>
  );
}

// ── Field Properties Editor ─────────────────────────────────────────────────
function FieldProperties({
  field,
  signers,
  onUpdate,
  onRemove,
  onDuplicate,
}: {
  field: DocumentField;
  signers: { id: string; name: string; color: string }[];
  onUpdate: (patch: Partial<DocumentField>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  return (
    <div className="space-y-3 p-3 rounded-xl border border-gray-700/40 bg-gray-800/20">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-300">Field Properties</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            className="text-[9px] text-gray-500 hover:text-primary-400 px-1.5 py-0.5 rounded transition-colors"
            title="Duplicate field"
          >
            Copy
          </button>
          <button
            onClick={onRemove}
            className="text-[9px] text-gray-500 hover:text-red-400 px-1.5 py-0.5 rounded transition-colors"
            title="Remove field"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Label */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider">Label</label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
        />
      </div>

      {/* Placeholder */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider">Placeholder</label>
        <input
          type="text"
          value={field.placeholder || ""}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
        />
      </div>

      {/* Assigned Signer */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider">Assigned To</label>
        <select
          value={field.assignedTo}
          onChange={(e) => onUpdate({ assignedTo: e.target.value })}
          className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
        >
          {signers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Required Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="w-3.5 h-3.5 rounded border-gray-600 text-primary-500 focus:ring-primary-500/30 bg-gray-800"
        />
        <span className="text-[11px] text-gray-300">Required field</span>
      </label>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">X Position %</label>
          <input
            type="number"
            value={Math.round(field.x)}
            onChange={(e) => onUpdate({ x: Math.max(0, Math.min(100, Number(e.target.value))) })}
            min={0}
            max={100}
            className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Y Position %</label>
          <input
            type="number"
            value={Math.round(field.y)}
            onChange={(e) => onUpdate({ y: Math.max(0, Math.min(100, Number(e.target.value))) })}
            min={0}
            max={100}
            className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Width %</label>
          <input
            type="number"
            value={Math.round(field.width)}
            onChange={(e) => onUpdate({ width: Math.max(2, Math.min(100, Number(e.target.value))) })}
            min={2}
            max={100}
            className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Height %</label>
          <input
            type="number"
            value={Math.round(field.height)}
            onChange={(e) => onUpdate({ height: Math.max(2, Math.min(100, Number(e.target.value))) })}
            min={2}
            max={100}
            className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
      </div>

      {/* Font settings for text-like fields */}
      {["text", "number", "email", "phone", "textarea", "date"].includes(field.type) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] text-gray-500 uppercase tracking-wider">Font Size</label>
            <input
              type="number"
              value={field.fontSize || 14}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              min={8}
              max={48}
              className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-gray-500 uppercase tracking-wider">Font Color</label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={field.fontColor || "#1a1a2e"}
                onChange={(e) => onUpdate({ fontColor: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-gray-700/50"
              />
              <span className="text-[9px] text-gray-500 font-mono">{field.fontColor || "#1a1a2e"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Options for select/radio */}
      {(field.type === "select" || field.type === "radio") && (
        <div className="space-y-1.5">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Options (one per line)</label>
          <textarea
            value={(field.options || []).map((o) => o.label).join("\n")}
            onChange={(e) => {
              const lines = e.target.value.split("\n").filter(Boolean);
              onUpdate({
                options: lines.map((l) => ({
                  label: l.trim(),
                  value: l.trim().toLowerCase().replace(/\s+/g, "-"),
                })),
              });
            }}
            rows={3}
            className="w-full px-2.5 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all resize-none font-mono"
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider">Help Text</label>
        <input
          type="text"
          value={field.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Instructions for signer..."
          className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
        />
      </div>
    </div>
  );
}
