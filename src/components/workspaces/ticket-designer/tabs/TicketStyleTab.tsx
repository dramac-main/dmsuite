"use client";

import { useState, useCallback } from "react";
import {
  useTicketEditor,
  TICKET_TEMPLATES,
  TICKET_FONT_PAIRINGS,
  type TicketTemplate,
} from "@/stores/ticket-editor";
import {
  AccordionSection,
  FormInput,
  FormSelect,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ━━━ SVG paths ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ICON = {
  template: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
  color: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a6 6 0 00-6-6h-2",
  font: "M4 7V4h16v3M9 20h6M12 4v16",
  layout: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  lock: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  unlock: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z",
};

const FONT_OPTIONS = Object.entries(TICKET_FONT_PAIRINGS).map(([id, pair]) => ({
  value: id,
  label: `${pair.heading} + ${pair.body}`,
}));

const HEADER_STYLES = [
  { value: "left-aligned", label: "Left Aligned" },
  { value: "centered", label: "Centered" },
  { value: "split", label: "Split (Name + Date)" },
];

const GRADIENT_DIRS = [
  { value: "to-right", label: "→ Right" },
  { value: "to-bottom", label: "↓ Down" },
  { value: "to-br", label: "↘ Diagonal" },
  { value: "to-bl", label: "↙ Reverse" },
];

export default function TicketStyleTab() {
  const form = useTicketEditor((s) => s.form);
  const accentColorLocked = useTicketEditor((s) => s.accentColorLocked);
  const setTemplate = useTicketEditor((s) => s.setTemplate);
  const setAccentColor = useTicketEditor((s) => s.setAccentColor);
  const setAccentColorLocked = useTicketEditor((s) => s.setAccentColorLocked);
  const updateStyle = useTicketEditor((s) => s.updateStyle);

  const [openSection, setOpenSection] = useState<string | null>("template");
  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  const handleTemplateSelect = useCallback(
    (id: TicketTemplate) => setTemplate(id),
    [setTemplate]
  );

  return (
    <div className="flex flex-col gap-1 p-2">
      {/* ─── Template ─── */}
      <AccordionSection
        title="Template"
        icon={<SIcon d={ICON.template} />}
        isOpen={openSection === "template"}
        onToggle={() => toggle("template")}
        badge={TICKET_TEMPLATES.find((t) => t.id === form.style.template)?.name}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {TICKET_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTemplateSelect(t.id)}
              className={`rounded-md px-2.5 py-2 text-left text-[11px] transition-all border flex items-center gap-2 ${
                form.style.template === t.id
                  ? "border-primary-500 bg-primary-500/10 text-primary-300"
                  : "border-gray-700/40 bg-gray-800/20 text-gray-400 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              <div
                className="size-4 rounded-sm shrink-0 border border-gray-600/30"
                style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.bgColor})` }}
              />
              <span className="truncate font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      </AccordionSection>

      {/* ─── Accent Color ─── */}
      <AccordionSection
        title="Accent Color"
        icon={<SIcon d={ICON.color} />}
        isOpen={openSection === "color"}
        onToggle={() => toggle("color")}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.style.accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-8 w-10 rounded border border-gray-700 bg-gray-800 cursor-pointer"
            />
            <input
              type="text"
              value={form.style.accentColor}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(v)) setAccentColor(v);
              }}
              className="flex-1 rounded-md border border-gray-700 bg-gray-800/60 px-2.5 py-1.5 text-[11px] text-gray-300 font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none"
              placeholder="#3b82f6"
            />
            <button
              onClick={() => setAccentColorLocked(!accentColorLocked)}
              className={`rounded-md p-1.5 transition-all border ${
                accentColorLocked
                  ? "border-primary-500/50 bg-primary-500/10 text-primary-400"
                  : "border-gray-700/40 bg-gray-800/20 text-gray-500 hover:text-gray-400"
              }`}
              title={accentColorLocked ? "Color locked — templates won't override" : "Color unlocked — templates will set color"}
            >
              <SIcon d={accentColorLocked ? ICON.lock : ICON.unlock} />
            </button>
          </div>
          {accentColorLocked && (
            <p className="text-[10px] text-gray-500">
              Color is locked. Changing templates won&apos;t override your color.
            </p>
          )}

          <SectionLabel>Background & Text</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={form.style.bgColor}
                onChange={(e) => updateStyle({ bgColor: e.target.value })}
                className="h-6 w-8 rounded border border-gray-700 bg-gray-800 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500">Background</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={form.style.textColor}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
                className="h-6 w-8 rounded border border-gray-700 bg-gray-800 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500">Text</span>
            </div>
          </div>

          <SectionLabel>Gradient</SectionLabel>
          <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.style.backgroundGradient}
              onChange={(e) => updateStyle({ backgroundGradient: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30 size-3.5"
            />
            Enable gradient background
          </label>
          {form.style.backgroundGradient && (
            <FormSelect
              label="Direction"
              value={form.style.gradientDirection}
              onChange={(e) => updateStyle({ gradientDirection: e.target.value as typeof form.style.gradientDirection })}
            >
              {GRADIENT_DIRS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </FormSelect>
          )}
        </div>
      </AccordionSection>

      {/* ─── Typography ─── */}
      <AccordionSection
        title="Typography"
        icon={<SIcon d={ICON.font} />}
        isOpen={openSection === "font"}
        onToggle={() => toggle("font")}
      >
        <div className="flex flex-col gap-2">
          <FormSelect
            label="Font Pairing"
            value={form.style.fontPairing}
            onChange={(e) => updateStyle({ fontPairing: e.target.value })}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </FormSelect>
          <FormSelect
            label="Font Scale"
            value={String(form.style.fontScale)}
            onChange={(e) => updateStyle({ fontScale: parseFloat(e.target.value) })}
          >
            <option value="0.85">Small</option>
            <option value="0.92">Compact</option>
            <option value="1">Default</option>
            <option value="1.1">Large</option>
            <option value="1.2">Extra Large</option>
          </FormSelect>
        </div>
      </AccordionSection>

      {/* ─── Layout ─── */}
      <AccordionSection
        title="Layout & Branding"
        icon={<SIcon d={ICON.layout} />}
        isOpen={openSection === "layout"}
        onToggle={() => toggle("layout")}
      >
        <div className="flex flex-col gap-2">
          <FormSelect
            label="Header Style"
            value={form.style.headerStyle}
            onChange={(e) => updateStyle({ headerStyle: e.target.value as typeof form.style.headerStyle })}
          >
            {HEADER_STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </FormSelect>
          <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.style.showLogo}
              onChange={(e) => updateStyle({ showLogo: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30 size-3.5"
            />
            Show logo / brand text
          </label>
          {form.style.showLogo && (
            <FormInput
              label="Logo Text"
              value={form.style.logoText}
              onChange={(e) => updateStyle({ logoText: e.target.value })}
              placeholder="e.g. EVENTPRO"
            />
          )}
        </div>
      </AccordionSection>
    </div>
  );
}
