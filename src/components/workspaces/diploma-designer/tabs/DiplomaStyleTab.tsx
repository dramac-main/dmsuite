// =============================================================================
// DMSuite — Diploma Designer: Style Tab
// Template picker, accent color, border style, font pairing, header style
// =============================================================================

"use client";

import {
  useDiplomaEditor,
  DIPLOMA_TEMPLATES,
  DIPLOMA_FONT_PAIRINGS,
  type DiplomaTemplate,
  type DiplomaBorderStyle,
} from "@/stores/diploma-editor";
import {
  AccordionSection,
  FormSelect,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import { useState, useCallback } from "react";

const icons = {
  template: <SIcon d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />,
  color: <SIcon d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />,
  font: <SIcon d="M4 7V4h16v3M9 20h6M12 4v16" />,
  lock: <SIcon d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" />,
  unlock: <SIcon d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 019.9-1" />,
};

const BORDER_OPTIONS: { id: DiplomaBorderStyle; label: string }[] = [
  { id: "ornate-classic", label: "Ornate Classic" },
  { id: "clean-line", label: "Clean Line" },
  { id: "double-frame", label: "Double Frame" },
  { id: "thin-elegant", label: "Thin Elegant" },
  { id: "official-border", label: "Official" },
  { id: "accent-corner", label: "Accent Corners" },
  { id: "modern-bracket", label: "Modern Bracket" },
  { id: "vintage-frame", label: "Vintage Frame" },
  { id: "none", label: "None" },
];

const HEADER_STYLES = [
  { id: "centered", label: "Centered" },
  { id: "left-aligned", label: "Left Aligned" },
  { id: "crest-centered", label: "Crest Centered" },
] as const;

const FONT_SCALE_OPTIONS = [
  { value: 0.85, label: "Compact" },
  { value: 0.92, label: "Small" },
  { value: 1, label: "Standard" },
  { value: 1.1, label: "Large" },
  { value: 1.2, label: "Extra Large" },
];

export default function DiplomaStyleTab() {
  const style = useDiplomaEditor((s) => s.form.style);
  const accentColorLocked = useDiplomaEditor((s) => s.accentColorLocked);
  const setTemplate = useDiplomaEditor((s) => s.setTemplate);
  const setAccentColor = useDiplomaEditor((s) => s.setAccentColor);
  const setAccentColorLocked = useDiplomaEditor((s) => s.setAccentColorLocked);
  const updateStyle = useDiplomaEditor((s) => s.updateStyle);

  const [openSection, setOpenSection] = useState<string | null>("template");

  const handleTemplateSelect = useCallback(
    (id: DiplomaTemplate) => {
      setTemplate(id);
    },
    [setTemplate],
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
            {DIPLOMA_TEMPLATES.map((t) => (
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
        icon={icons.font}
        isOpen={openSection === "border"}
        onToggle={() => setOpenSection(openSection === "border" ? null : "border")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormSelect
            label="Border Style"
            value={style.borderStyle}
            onChange={(e) => updateStyle({ borderStyle: e.target.value as DiplomaBorderStyle })}
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
            {Object.entries(DIPLOMA_FONT_PAIRINGS).map(([id, fp]) => (
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
              updateStyle({ headerStyle: e.target.value as "centered" | "left-aligned" | "crest-centered" })
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
