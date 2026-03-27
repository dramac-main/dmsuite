// =============================================================================
// DMSuite — Menu Designer: Style Tab
// Template selection, accent color, font pairing, price display, dividers,
// column layout, border style, and visual options.
// =============================================================================

"use client";

import { useState } from "react";
import {
  useMenuDesignerEditor,
  MENU_TEMPLATES,
  MENU_FONT_PAIRINGS,
  type MenuTemplate,
  type PriceDisplayStyle,
  type DividerStyle,
  type ColumnLayout,
} from "@/stores/menu-designer-editor";
import {
  AccordionSection,
  ColorSwatchPicker,
  ChipGroup,
  Toggle,
  SIcon,
  SelectionCard,
  RangeSlider,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import AdvancedSettingsPanel from "@/components/workspaces/AdvancedSettingsPanel";

// ━━━ Icons ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const styleIcons = {
  template: <SIcon d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />,
  color: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="12" r="2.5" /><circle cx="13.5" cy="17.5" r="2.5" />
    </svg>
  ),
  font: <SIcon d="M4 7V4h16v3M9 20h6M12 4v16" />,
  layout: <SIcon d="M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zM9 3v18M15 3v18" />,
  display: <SIcon d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />,
  advanced: <SIcon d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />,
};

// ━━━ Color Presets ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ACCENT_COLORS: readonly { hex: string; label: string }[] = [
  { hex: "#b8860b", label: "Gold" },
  { hex: "#18181b", label: "Black" },
  { hex: "#92400e", label: "Brown" },
  { hex: "#7c2d12", label: "Rust" },
  { hex: "#c084fc", label: "Purple" },
  { hex: "#65a30d", label: "Green" },
  { hex: "#dc2626", label: "Red" },
  { hex: "#b91c1c", label: "Crimson" },
  { hex: "#0369a1", label: "Blue" },
  { hex: "#991b1b", label: "Wine" },
  { hex: "#ea580c", label: "Orange" },
  { hex: "#78716c", label: "Stone" },
  { hex: "#7c3aed", label: "Violet" },
  { hex: "#0891b2", label: "Teal" },
  { hex: "#d97706", label: "Amber" },
  { hex: "#059669", label: "Emerald" },
];

// ━━━ Option Lists ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PRICE_STYLES: { value: PriceDisplayStyle; label: string }[] = [
  { value: "dots", label: "Dot Leader" },
  { value: "right-aligned", label: "Right Aligned" },
  { value: "inline", label: "Inline" },
  { value: "centered", label: "Centered" },
  { value: "parentheses", label: "Parentheses" },
];

const DIVIDER_STYLES: { value: DividerStyle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "thin-line", label: "Thin Line" },
  { value: "thick-rule", label: "Thick Rule" },
  { value: "dashed", label: "Dashed" },
  { value: "ornamental", label: "Ornamental" },
  { value: "dots-pattern", label: "Dots" },
  { value: "botanical", label: "Botanical" },
  { value: "wave", label: "Wave" },
  { value: "brush-stroke", label: "Brush" },
  { value: "grape-vine", label: "Grape Vine" },
  { value: "glow-line", label: "Glow Line" },
];

const COLUMN_OPTIONS: { value: ColumnLayout; label: string }[] = [
  { value: "single", label: "1 Column" },
  { value: "two-column", label: "2 Columns" },
  { value: "three-column", label: "3 Columns" },
];

const HEADER_STYLES: { value: string; label: string }[] = [
  { value: "centered", label: "Centered" },
  { value: "left-aligned", label: "Left Aligned" },
  { value: "accent-bar", label: "Accent Bar" },
];

const BORDER_STYLES: { value: string; label: string }[] = [
  { value: "none", label: "None" },
  { value: "thin", label: "Thin" },
  { value: "double", label: "Double" },
  { value: "ornate", label: "Ornate" },
  { value: "accent-edge", label: "Accent Edge" },
];

const ITEM_SPACING_OPTIONS: { value: string; label: string }[] = [
  { value: "tight", label: "Tight" },
  { value: "normal", label: "Normal" },
  { value: "relaxed", label: "Relaxed" },
];

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function MenuDesignerStyleTab() {
  const form = useMenuDesignerEditor((s) => s.form);
  const setTemplate = useMenuDesignerEditor((s) => s.setTemplate);
  const setAccentColor = useMenuDesignerEditor((s) => s.setAccentColor);
  const updateStyle = useMenuDesignerEditor((s) => s.updateStyle);

  const [openSection, setOpenSection] = useState<string | null>("template");
  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Template ── */}
      <AccordionSection
        title="Template"
        icon={styleIcons.template}
        isOpen={openSection === "template"}
        onToggle={() => toggle("template")}
      >
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
            {MENU_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setTemplate(tpl.id)}
                className={`flex-shrink-0 w-[68px] rounded-lg border-2 transition-all overflow-hidden ${
                  form.style.template === tpl.id
                    ? "border-primary-500 ring-2 ring-primary-500/20 scale-105"
                    : "border-gray-700/40 hover:border-gray-600/60"
                }`}
              >
                <div
                  className="w-full h-20 flex flex-col items-center justify-center relative"
                  style={{ background: tpl.bgColor }}
                >
                  {/* Mini divider */}
                  <div style={{ width: 24, height: 1, background: tpl.accent, marginBottom: 3, borderRadius: 1 }} />
                  {/* Mini lines */}
                  <div style={{ width: 32, height: 2, background: tpl.accent, opacity: 0.6, borderRadius: 1, marginBottom: 2 }} />
                  <div style={{ width: 40, height: 1, background: tpl.textColor, opacity: 0.2, borderRadius: 1, marginBottom: 1 }} />
                  <div style={{ width: 36, height: 1, background: tpl.textColor, opacity: 0.15, borderRadius: 1, marginBottom: 1 }} />
                  <div style={{ width: 40, height: 1, background: tpl.textColor, opacity: 0.2, borderRadius: 1 }} />
                </div>
                <div className="px-1 py-1 bg-gray-900/80 text-center">
                  <span className="text-[7px] text-gray-400 truncate block">{tpl.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* ── Colors ── */}
      <AccordionSection
        title="Colors"
        icon={styleIcons.color}
        isOpen={openSection === "colors"}
        onToggle={() => toggle("colors")}
      >
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Accent Color</label>
            <ColorSwatchPicker
              colors={ACCENT_COLORS}
              value={form.style.accentColor}
              onChange={(color) => setAccentColor(color)}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.style.bgColor}
                onChange={(e) => updateStyle({ bgColor: e.target.value })}
                className="w-8 h-8 rounded-md border border-gray-700/60 cursor-pointer bg-transparent"
              />
              <span className="text-[10px] font-mono text-gray-500">{form.style.bgColor}</span>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Text Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.style.textColor}
                onChange={(e) => updateStyle({ textColor: e.target.value })}
                className="w-8 h-8 rounded-md border border-gray-700/60 cursor-pointer bg-transparent"
              />
              <span className="text-[10px] font-mono text-gray-500">{form.style.textColor}</span>
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* ── Typography ── */}
      <AccordionSection
        title="Typography"
        icon={styleIcons.font}
        isOpen={openSection === "font"}
        onToggle={() => toggle("font")}
      >
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-2 block">Font Pairing</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
              {Object.entries(MENU_FONT_PAIRINGS).map(([id, pair]) => (
                <SelectionCard
                  key={id}
                  selected={form.style.fontPairing === id}
                  onClick={() => updateStyle({ fontPairing: id })}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-gray-300">{pair.heading}</span>
                    <span className="text-[9px] text-gray-600">+</span>
                    <span className="text-[10px] text-gray-500">{pair.body}</span>
                  </div>
                </SelectionCard>
              ))}
            </div>
          </div>
          <RangeSlider
            label="Font Scale"
            value={form.style.fontScale}
            onChange={(v) => updateStyle({ fontScale: v })}
            min={0.7}
            max={1.4}
            step={0.05}
            suffix="×"
          />
        </div>
      </AccordionSection>

      {/* ── Layout & Display ── */}
      <AccordionSection
        title="Layout & Display"
        icon={styleIcons.layout}
        isOpen={openSection === "layout"}
        onToggle={() => toggle("layout")}
      >
        <div className="px-4 pb-4 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Column Layout</label>
            <ChipGroup
              options={COLUMN_OPTIONS}
              value={form.style.columnLayout}
              onChange={(v) => updateStyle({ columnLayout: v as ColumnLayout })}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Header Alignment</label>
            <ChipGroup
              options={HEADER_STYLES}
              value={form.style.headerStyle}
              onChange={(v) => updateStyle({ headerStyle: v as "centered" | "left-aligned" | "accent-bar" })}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Price Display</label>
            <ChipGroup
              options={PRICE_STYLES}
              value={form.style.priceStyle}
              onChange={(v) => updateStyle({ priceStyle: v as PriceDisplayStyle })}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Section Divider</label>
            <ChipGroup
              options={DIVIDER_STYLES}
              value={form.style.dividerStyle}
              onChange={(v) => updateStyle({ dividerStyle: v as DividerStyle })}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Border Style</label>
            <ChipGroup
              options={BORDER_STYLES}
              value={form.style.borderStyle}
              onChange={(v) => updateStyle({ borderStyle: v as "none" | "thin" | "double" | "ornate" | "accent-edge" })}
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Item Spacing</label>
            <ChipGroup
              options={ITEM_SPACING_OPTIONS}
              value={form.style.itemSpacing}
              onChange={(v) => updateStyle({ itemSpacing: v as "tight" | "normal" | "relaxed" })}
            />
          </div>
        </div>
      </AccordionSection>

      {/* ── Visibility Toggles ── */}
      <AccordionSection
        title="Display Options"
        icon={styleIcons.display}
        isOpen={openSection === "display"}
        onToggle={() => toggle("display")}
      >
        <div className="px-4 pb-4 space-y-3">
          <Toggle
            checked={form.style.showDietaryLegend}
            onChange={(v) => updateStyle({ showDietaryLegend: v })}
            label="Show Dietary Legend"
            description="Display dietary tag meanings at bottom"
          />
          <Toggle
            checked={form.style.showItemDescriptions}
            onChange={(v) => updateStyle({ showItemDescriptions: v })}
            label="Show Item Descriptions"
            description="Display description text under each item"
          />
          <Toggle
            checked={form.style.showSectionSubtitles}
            onChange={(v) => updateStyle({ showSectionSubtitles: v })}
            label="Show Section Subtitles"
            description="Display subtitle text under section titles"
          />
        </div>
      </AccordionSection>

      {/* ── Advanced Settings ── */}
      <AccordionSection
        title="Advanced Settings"
        icon={styleIcons.advanced}
        isOpen={openSection === "advanced"}
        onToggle={() => toggle("advanced")}
      >
        <div className="px-4 pb-4">
          <AdvancedSettingsPanel />
        </div>
      </AccordionSection>
    </div>
  );
}
