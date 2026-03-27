"use client";

import { useState } from "react";
import {
  useIDBadgeEditor,
  BADGE_TEMPLATES,
  BADGE_FONT_PAIRINGS,
  BADGE_ACCENT_COLORS,
  ROLE_VARIANTS,
  type PhotoShape,
  type LayoutDensity,
} from "@/stores/id-badge-editor";
import {
  AccordionSection,
  FormSelect,
  Toggle,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ── Icons ───────────────────────────────────────────────────────────────────

const icons = {
  template: <SIcon d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />,
  color: <SIcon d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />,
  font: <SIcon d="M3 7V5h2l5 12h2l5-12h2v2m-7.5 0v10M9 17h6" />,
  layout: <SIcon d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h14a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z" />,
  photo: <SIcon d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
};

const PHOTO_SHAPES: { value: PhotoShape; label: string; icon: string }[] = [
  { value: "circle", label: "Circle", icon: "M12 2a10 10 0 100 20 10 10 0 000-20z" },
  { value: "rounded-square", label: "Rounded Square", icon: "M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" },
  { value: "rounded", label: "Rounded", icon: "M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3z" },
  { value: "square", label: "Square", icon: "M3 3h18v18H3z" },
];

const DENSITY_OPTIONS: { value: LayoutDensity; label: string; desc: string }[] = [
  { value: "compact", label: "Compact", desc: "Tighter spacing, more content" },
  { value: "standard", label: "Standard", desc: "Balanced spacing" },
  { value: "spacious", label: "Spacious", desc: "More breathing room" },
];

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function IDBadgeStyleTab() {
  const form = useIDBadgeEditor((s) => s.form);
  const setTemplate = useIDBadgeEditor((s) => s.setTemplate);
  const setAccentColor = useIDBadgeEditor((s) => s.setAccentColor);
  const updateStyle = useIDBadgeEditor((s) => s.updateStyle);
  const [openSection, setOpenSection] = useState<string | null>("template");

  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Template ── */}
      <AccordionSection
        title="Template"
        icon={icons.template}
        isOpen={openSection === "template"}
        onToggle={() => toggle("template")}
        badge={BADGE_TEMPLATES.find((t) => t.id === form.style.template)?.name}
      >
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {BADGE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => setTemplate(tmpl.id)}
                className={`group relative p-2.5 rounded-lg border text-left transition-all ${
                  form.style.template === tmpl.id
                    ? "border-primary-500/50 bg-primary-500/10 ring-1 ring-primary-500/20"
                    : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60 hover:bg-gray-800/50"
                }`}
              >
                {/* Mini preview bar */}
                <div
                  className="h-2 w-full rounded-full mb-2 opacity-80"
                  style={{
                    background: `linear-gradient(90deg, ${tmpl.accent}, ${tmpl.headerBg})`,
                  }}
                />
                <div className={`text-[10px] font-medium ${form.style.template === tmpl.id ? "text-primary-300" : "text-gray-300"}`}>
                  {tmpl.name}
                </div>
                <div className="text-[8px] text-gray-600 mt-0.5">{tmpl.photoShape} • {tmpl.fontPairing}</div>
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
        onToggle={() => toggle("color")}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {BADGE_ACCENT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setAccentColor(color)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  form.style.accentColor === color
                    ? "border-white/80 ring-2 ring-primary-500/30 scale-110"
                    : "border-gray-700/40 hover:scale-105"
                }`}
                style={{ background: color }}
              />
            ))}
          </div>

          <div className="mt-2 space-y-1">
            <SectionLabel>Role Color Preview</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_VARIANTS.map((r) => (
                <span
                  key={r.id}
                  className="text-[8px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${r.color}20`, color: r.color }}
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* ── Typography ── */}
      <AccordionSection
        title="Typography"
        icon={icons.font}
        isOpen={openSection === "font"}
        onToggle={() => toggle("font")}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="space-y-2">
            {Object.entries(BADGE_FONT_PAIRINGS).map(([key, fp]) => (
              <button
                key={key}
                onClick={() => updateStyle({ fontPairing: key })}
                className={`w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all ${
                  form.style.fontPairing === key
                    ? "border-primary-500/50 bg-primary-500/10"
                    : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[12px] font-semibold ${form.style.fontPairing === key ? "text-primary-300" : "text-gray-300"}`}
                    style={{ fontFamily: fp.heading }}
                  >
                    {fp.heading}
                  </div>
                  <div className="text-[9px] text-gray-600 mt-0.5" style={{ fontFamily: fp.body }}>
                    {fp.heading} + {fp.body}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <FormSelect
            label="Font Scale"
            value={form.style.fontScale.toString()}
            onChange={(e) => updateStyle({ fontScale: parseFloat(e.target.value) })}
          >
            <option value="0.85">Small (85%)</option>
            <option value="0.9">Compact (90%)</option>
            <option value="1">Default (100%)</option>
            <option value="1.1">Large (110%)</option>
            <option value="1.2">Extra Large (120%)</option>
          </FormSelect>
        </div>
      </AccordionSection>

      {/* ── Photo Style ── */}
      <AccordionSection
        title="Photo Style"
        icon={icons.photo}
        isOpen={openSection === "photo"}
        onToggle={() => toggle("photo")}
      >
        <div className="px-4 pb-4 space-y-3">
          <SectionLabel>Photo Shape</SectionLabel>
          <div className="flex gap-2">
            {PHOTO_SHAPES.map((shape) => (
              <button
                key={shape.value}
                onClick={() => updateStyle({ photoShape: shape.value })}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all flex-1 ${
                  form.style.photoShape === shape.value
                    ? "border-primary-500/50 bg-primary-500/10"
                    : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60"
                }`}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={form.style.photoShape === shape.value ? "#a78bfa" : "#64748b"} strokeWidth="1.5">
                  <path d={shape.icon} />
                </svg>
                <span className={`text-[9px] ${form.style.photoShape === shape.value ? "text-primary-300" : "text-gray-500"}`}>
                  {shape.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* ── Layout ── */}
      <AccordionSection
        title="Layout"
        icon={icons.layout}
        isOpen={openSection === "layout"}
        onToggle={() => toggle("layout")}
      >
        <div className="px-4 pb-4 space-y-3">
          <SectionLabel>Layout Density</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {DENSITY_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => updateStyle({ layoutDensity: d.value })}
                className={`p-2 rounded-lg border text-center transition-all ${
                  form.style.layoutDensity === d.value
                    ? "border-primary-500/50 bg-primary-500/10"
                    : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60"
                }`}
              >
                <div className={`text-[10px] font-medium ${form.style.layoutDensity === d.value ? "text-primary-300" : "text-gray-300"}`}>
                  {d.label}
                </div>
                <div className="text-[8px] text-gray-600 mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>

          <Toggle
            label="Show Role Badge"
            description="Display the role label on the badge"
            checked={form.style.showRoleBadge}
            onChange={(v) => updateStyle({ showRoleBadge: v })}
          />

          <Toggle
            label="Show Department Badge"
            description="Show the department below the role"
            checked={form.style.showDepartmentBadge}
            onChange={(v) => updateStyle({ showDepartmentBadge: v })}
          />

          <FormSelect
            label="Header Style"
            value={form.style.headerStyle}
            onChange={(e) => updateStyle({ headerStyle: e.target.value as "solid" | "gradient" | "pattern" | "minimal" })}
          >
            <option value="solid">Solid Color</option>
            <option value="gradient">Gradient</option>
            <option value="pattern">Pattern</option>
            <option value="minimal">Minimal</option>
          </FormSelect>
        </div>
      </AccordionSection>
    </div>
  );
}
