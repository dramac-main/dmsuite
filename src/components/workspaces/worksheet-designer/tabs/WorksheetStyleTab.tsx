// =============================================================================
// Worksheet Style Tab — Template, accent color, font, header style, toggles
// =============================================================================

"use client";

import { useState } from "react";
import { useWorksheetEditor } from "@/stores/worksheet-editor";
import {
  AccordionSection,
  Toggle,
  SIcon,
  ChipGroup,
  ColorSwatchPicker,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import {
  WORKSHEET_TEMPLATES,
  FONT_PAIRINGS,
  ACCENT_COLORS,
} from "@/lib/worksheet/schema";
import type { HeaderStyle } from "@/lib/worksheet/schema";

// ── Icons ──
const icons = {
  template: <SIcon d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />,
  colors: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="13.5" cy="17.5" r="2.5" />
    </svg>
  ),
  header: <SIcon d="M4 6h16M4 12h8" />,
  display: <SIcon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
};

export default function WorksheetStyleTab() {
  const store = useWorksheetEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    template: true,
    colors: true,
    header: false,
    display: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));
  const isEducational = store.form.documentType === "educational-worksheet";

  const headerStyleOptions = [
    { value: "minimal", label: "Minimal" },
    { value: "banner", label: "Banner" },
    { value: "underline", label: "Underline" },
    { value: "border", label: "Border" },
    { value: "boxed", label: "Boxed" },
    { value: "playful", label: "Playful" },
  ];

  const fontOptions = FONT_PAIRINGS.map((fp) => ({
    value: fp.id,
    label: `${fp.heading}${fp.heading !== fp.body ? " / " + fp.body : ""}`,
  }));

  return (
    <div className="space-y-2">
      {/* Template */}
      <AccordionSection
        title="Template"
        icon={icons.template}
        badge={WORKSHEET_TEMPLATES.find((t) => t.id === store.form.style.template)?.name}
        isOpen={open.template}
        onToggle={() => toggle("template")}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {WORKSHEET_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => store.setTemplate(tpl.id)}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all ${
                store.form.style.template === tpl.id
                  ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                  : "border-gray-700/40 text-gray-400 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              <span className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10" style={{ backgroundColor: tpl.accent }} />
              <div className="min-w-0">
                <div className="text-[10px] font-semibold truncate">{tpl.name}</div>
                <div className="text-[8px] text-gray-500 truncate">{tpl.description}</div>
              </div>
            </button>
          ))}
        </div>
      </AccordionSection>

      {/* Accent Color & Font */}
      <AccordionSection
        title="Colors & Font"
        icon={icons.colors}
        isOpen={open.colors}
        onToggle={() => toggle("colors")}
      >
        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-semibold text-gray-400 mb-1.5">Accent Color</div>
            <ColorSwatchPicker
              colors={ACCENT_COLORS}
              value={store.form.style.accentColor}
              onChange={(c) => store.setAccentColor(c)}
            />
          </div>

          <div>
            <div className="text-[10px] font-semibold text-gray-400 mb-1.5">Font Pairing</div>
            <div className="grid grid-cols-1 gap-1">
              {fontOptions.slice(0, 6).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => store.updateStyle({ fontPairing: opt.value })}
                  className={`text-left px-2.5 py-1.5 rounded-md border text-[10px] transition-all ${
                    store.form.style.fontPairing === opt.value
                      ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                      : "border-gray-700/30 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Header Style */}
      <AccordionSection
        title="Header Style"
        icon={icons.header}
        badge={store.form.style.headerStyle}
        isOpen={open.header}
        onToggle={() => toggle("header")}
      >
        <ChipGroup
          options={headerStyleOptions}
          value={store.form.style.headerStyle}
          onChange={(v) => store.updateStyle({ headerStyle: v as HeaderStyle })}
          direction="grid"
          columns={3}
        />
      </AccordionSection>

      {/* Display Toggles */}
      <AccordionSection
        title="Display Options"
        icon={icons.display}
        isOpen={open.display}
        onToggle={() => toggle("display")}
      >
        <div className="space-y-2">
          <Toggle
            label="Show Instructions"
            checked={store.form.style.showInstructions}
            onChange={(v) => store.updateStyle({ showInstructions: v })}
          />
          <Toggle
            label="Show Page Numbers"
            checked={store.form.style.showPageNumbers}
            onChange={(v) => store.updateStyle({ showPageNumbers: v })}
          />
          <Toggle
            label="Show Form Number"
            checked={store.form.style.showFormNumber}
            onChange={(v) => store.updateStyle({ showFormNumber: v })}
          />
          <Toggle
            label="Show Date"
            checked={store.form.style.showDate}
            onChange={(v) => store.updateStyle({ showDate: v })}
          />
          <Toggle
            label="Numbered Elements"
            checked={store.form.style.numberedElements}
            onChange={(v) => store.updateStyle({ numberedElements: v })}
          />
          <Toggle
            label="Show Borders"
            checked={store.form.style.showBorders}
            onChange={(v) => store.updateStyle({ showBorders: v })}
          />
          <Toggle
            label="Alternate Row Shading"
            checked={store.form.style.alternateRowShading}
            onChange={(v) => store.updateStyle({ alternateRowShading: v })}
          />
          <Toggle
            label="Compact Mode"
            checked={store.form.style.compactMode}
            onChange={(v) => store.updateStyle({ compactMode: v })}
          />
          {isEducational && (
            <Toggle
              label="Show Point Values"
              checked={store.form.style.showPointValues}
              onChange={(v) => store.updateStyle({ showPointValues: v })}
            />
          )}
        </div>
      </AccordionSection>
    </div>
  );
}
