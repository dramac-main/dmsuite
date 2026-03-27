// =============================================================================
// DMSuite — Certificate Designer: Style Tab
// Template picker, accent color, border style, font pairing, header style
// =============================================================================

"use client";

import {
  useCertificateEditor,
  CERTIFICATE_TEMPLATES,
  CERTIFICATE_FONT_PAIRINGS,
  type CertificateTemplate,
  type BorderStyle,
  getCertificateTemplate,
} from "@/stores/certificate-editor";
import {
  AccordionSection,
  FormSelect,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import { useState, useCallback } from "react";

// ━━━ Icons ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const icons = {
  template: <SIcon d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />,
  color: <SIcon d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />,
  font: <SIcon d="M4 7V4h16v3M9 20h6M12 4v16" />,
  border: <SIcon d="M3 3h18v18H3zM7 3v18M17 3v18M3 7h18M3 17h18" />,
  lock: <SIcon d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" />,
  unlock: <SIcon d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 019.9-1" />,
};

const BORDER_OPTIONS: { id: BorderStyle; label: string }[] = [
  { id: "classic-blue-frame", label: "Classic Blue Frame" },
  { id: "burgundy-flourish", label: "Burgundy Flourish" },
  { id: "antique-frame", label: "Antique Frame" },
  { id: "golden-frame", label: "Golden Frame" },
  { id: "silver-weave-border", label: "Silver Weave" },
  { id: "vintage-warm-frame", label: "Vintage Warm" },
  { id: "teal-scrollwork", label: "Teal Scrollwork" },
  { id: "botanical-panel", label: "Botanical Panel" },
  { id: "none", label: "None" },
];

const HEADER_STYLES = [
  { id: "centered", label: "Centered" },
  { id: "left-aligned", label: "Left Aligned" },
  { id: "accent-bar", label: "Accent Bar" },
] as const;

const FONT_SCALE_OPTIONS = [
  { value: 0.85, label: "Compact" },
  { value: 0.92, label: "Small" },
  { value: 1, label: "Standard" },
  { value: 1.1, label: "Large" },
  { value: 1.2, label: "Extra Large" },
];

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CertificateStyleTab() {
  const style = useCertificateEditor((s) => s.form.style);
  const accentColorLocked = useCertificateEditor((s) => s.accentColorLocked);
  const setTemplate = useCertificateEditor((s) => s.setTemplate);
  const setAccentColor = useCertificateEditor((s) => s.setAccentColor);
  const setAccentColorLocked = useCertificateEditor((s) => s.setAccentColorLocked);
  const updateStyle = useCertificateEditor((s) => s.updateStyle);

  const [openSection, setOpenSection] = useState<string | null>("template");

  const handleTemplateSelect = useCallback(
    (id: CertificateTemplate) => {
      setTemplate(id);
    },
    [setTemplate]
  );

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Template Picker ── */}
      <AccordionSection
        title="Template"
        icon={icons.template}
        isOpen={openSection === "template"}
        onToggle={() => setOpenSection(openSection === "template" ? null : "template")}
      >
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {CERTIFICATE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTemplateSelect(t.id)}
                className={`relative flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-xs transition-all ${
                  style.template === t.id
                    ? "border-primary-500 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/30"
                    : "border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                }`}
              >
                <div
                  className="h-6 w-10 rounded-sm border border-gray-600/30"
                  style={{ backgroundColor: t.bgColor, borderColor: t.accent }}
                />
                <span className="truncate w-full text-center">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* ── Accent Color ── */}
      <AccordionSection
        title="Accent Color"
        icon={icons.color}
        isOpen={openSection === "color"}
        onToggle={() => setOpenSection(openSection === "color" ? null : "color")}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-9 w-12 rounded border border-gray-600 bg-gray-800 cursor-pointer"
            />
            <input
              type="text"
              value={style.accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/60 px-3 py-1.5 text-sm text-gray-200 font-mono focus:border-primary-500/50 focus:outline-none"
              maxLength={7}
            />
            <button
              type="button"
              onClick={() => setAccentColorLocked(!accentColorLocked)}
              className={`p-1.5 rounded-md transition-colors ${
                accentColorLocked
                  ? "text-primary-400 bg-primary-500/10"
                  : "text-gray-500 hover:text-gray-300"
              }`}
              title={accentColorLocked ? "Unlock — template changes won't override color" : "Lock color"}
            >
              {accentColorLocked ? icons.lock : icons.unlock}
            </button>
          </div>
          {accentColorLocked && (
            <p className="text-xs text-gray-500">
              Color is locked — switching templates won&apos;t change it.
            </p>
          )}
        </div>
      </AccordionSection>

      {/* ── Border & Font ── */}
      <AccordionSection
        title="Border & Font"
        icon={icons.border}
        isOpen={openSection === "border"}
        onToggle={() => setOpenSection(openSection === "border" ? null : "border")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormSelect
            label="Border Style"
            value={style.borderStyle}
            onChange={(e) => updateStyle({ borderStyle: e.target.value as BorderStyle })}
          >
            {BORDER_OPTIONS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Font Pairing"
            value={style.fontPairing}
            onChange={(e) => updateStyle({ fontPairing: e.target.value })}
          >
            {Object.entries(CERTIFICATE_FONT_PAIRINGS).map(([id, fp]) => (
              <option key={id} value={id}>
                {fp.heading} / {fp.body}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Font Scale"
            value={String(style.fontScale)}
            onChange={(e) => updateStyle({ fontScale: parseFloat(e.target.value) })}
          >
            {FONT_SCALE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({Math.round(o.value * 100)}%)
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Header Style"
            value={style.headerStyle}
            onChange={(e) =>
              updateStyle({ headerStyle: e.target.value as "centered" | "left-aligned" | "accent-bar" })
            }
          >
            {HEADER_STYLES.map((h) => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </FormSelect>
        </div>
      </AccordionSection>
    </div>
  );
}
