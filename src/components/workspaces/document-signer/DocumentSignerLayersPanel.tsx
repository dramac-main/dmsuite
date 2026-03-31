// =============================================================================
// DMSuite — Document Signer — Layers Panel
// Collapsible right-hand panel showing document structure
// =============================================================================

"use client";

import { useDocumentSignerEditor } from "@/stores/document-signer-editor";

interface Props {
  onOpenSection: (section: string) => void;
  onHoverSection: (section: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function DocumentSignerLayersPanel({
  onOpenSection,
  onHoverSection,
  collapsed,
  onToggleCollapse,
}: Props) {
  const form = useDocumentSignerEditor((s) => s.form);
  const setSelectedFieldId = useDocumentSignerEditor((s) => s.setSelectedFieldId);
  const setActivePage = useDocumentSignerEditor((s) => s.setActivePage);

  const signerMap = new Map(form.signers.map((s) => [s.id, s]));

  // Group fields by page
  const fieldsByPage = new Map<number, typeof form.fields>();
  form.fields.forEach((f) => {
    const arr = fieldsByPage.get(f.page) || [];
    arr.push(f);
    fieldsByPage.set(f.page, arr);
  });

  if (collapsed) {
    return (
      <div className="w-8 border-l border-gray-800/40 bg-gray-950 flex flex-col items-center py-2">
        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-400 hover:bg-white/5 transition-all"
          title="Expand layers"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-52 xl:w-56 border-l border-gray-800/40 bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between h-10 px-3 border-b border-gray-800/40">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Layers
        </span>
        <button
          onClick={onToggleCollapse}
          className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-gray-400 hover:bg-white/5 transition-all"
          title="Collapse layers"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
        {/* Document info layer */}
        <LayerItem
          icon="📄"
          label={form.documentName || "Untitled"}
          sublabel={form.documentType.replace(/-/g, " ")}
          active={false}
          onClick={() => onOpenSection("document")}
          onHover={(h) => onHoverSection(h ? "header" : null)}
        />

        {/* Signers overview */}
        <div className="space-y-0.5">
          <span className="text-[8px] text-gray-600 uppercase tracking-widest font-bold px-1">
            Signers
          </span>
          {form.signers.map((signer) => (
            <LayerItem
              key={signer.id}
              icon={
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: signer.color }}
                />
              }
              label={signer.name || "Unnamed"}
              sublabel={`${form.fields.filter((f) => f.assignedTo === signer.id).length} fields · ${signer.status}`}
              active={form.activeSignerId === signer.id}
              onClick={() => onOpenSection("signers")}
              onHover={(h) => onHoverSection(h ? `signer-${signer.id}` : null)}
            />
          ))}
        </div>

        {/* Fields by page */}
        {form.pages.map((page) => {
          const pageFields = fieldsByPage.get(page.number) || [];
          return (
            <div key={page.id} className="space-y-0.5">
              <button
                className="w-full flex items-center gap-1 px-1 py-0.5 text-[8px] text-gray-600 uppercase tracking-widest font-bold hover:text-gray-400 transition-colors"
                onClick={() => {
                  setActivePage(page.number);
                  onOpenSection("fields");
                }}
              >
                Page {page.number}
                <span className="text-gray-700">({pageFields.length})</span>
              </button>

              {pageFields.map((field) => {
                const signer = signerMap.get(field.assignedTo);
                return (
                  <LayerItem
                    key={field.id}
                    icon={
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: signer?.color || "#8b5cf6" }}
                      />
                    }
                    label={field.label}
                    sublabel={`${field.type} · ${signer?.name || "unassigned"}`}
                    active={form.selectedFieldId === field.id}
                    filled={!!field.value}
                    required={field.required}
                    onClick={() => {
                      setSelectedFieldId(field.id);
                      setActivePage(page.number);
                      onOpenSection("fields");
                    }}
                    onHover={(h) => onHoverSection(h ? `field-${field.id}` : null)}
                  />
                );
              })}

              {pageFields.length === 0 && (
                <p className="text-[8px] text-gray-700 px-1 py-1 italic">No fields</p>
              )}
            </div>
          );
        })}

        {/* Style layer */}
        <LayerItem
          icon="🎨"
          label="Style"
          sublabel={`${form.style.fontFamily} · ${form.style.accentColor}`}
          active={false}
          onClick={() => onOpenSection("style")}
          onHover={(h) => onHoverSection(h ? "style" : null)}
        />

        {/* Settings layer */}
        <LayerItem
          icon="⚙️"
          label="Settings"
          sublabel={`${form.auditTrail.length} audit entries`}
          active={false}
          onClick={() => onOpenSection("settings")}
          onHover={(h) => onHoverSection(h ? "settings" : null)}
        />
      </div>
    </div>
  );
}

// ── Layer Item Component ────────────────────────────────────────────────────
function LayerItem({
  icon,
  label,
  sublabel,
  active,
  filled,
  required,
  onClick,
  onHover,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  active: boolean;
  filled?: boolean;
  required?: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}) {
  return (
    <button
      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all ${
        active
          ? "bg-primary-500/10 border border-primary-500/30"
          : "hover:bg-white/3 border border-transparent"
      }`}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <span className="shrink-0 text-[10px] flex items-center justify-center w-4">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-300 truncate">{label}</span>
          {required && <span className="text-[7px] text-red-400">*</span>}
          {filled && (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" className="shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        {sublabel && (
          <span className="text-[8px] text-gray-600 truncate block">{sublabel}</span>
        )}
      </div>
    </button>
  );
}
