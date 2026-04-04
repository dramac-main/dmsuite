"use client";
/**
 * Resume V2 — Right Sidebar Design Controls
 * Template picker, layout, typography, design, page, CSS, notes, export
 */
import React, { useState, useCallback, useRef } from "react";
import { useResumeV2Editor } from "@/stores/resume-v2-editor";
import { TEMPLATE_LIST, type Template, type PageFormat } from "@/lib/resume-v2/schema";

/* ═══════════════════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════════════════ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-sm font-semibold text-gray-200">{children}</h3>;
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-400">{label}</span>
      {children}
    </label>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <FormField label={`${label}: ${value}${unit}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary-500"
      />
    </FormField>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FormField label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-gray-600 bg-gray-800"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-gray-100 font-mono"
        />
      </div>
    </FormField>
  );
}

/* ═══════════════════════════════════════════════════════
   TEMPLATE PICKER
   ═══════════════════════════════════════════════════════ */
function TemplateSection() {
  const currentTemplate = useResumeV2Editor((s) => s.resume.metadata.template);
  const setTemplate = useResumeV2Editor((s) => s.setTemplate);

  return (
    <div className="space-y-3">
      <SectionTitle>Template</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {TEMPLATE_LIST.map((tmpl) => (
          <button
            key={tmpl}
            onClick={() => setTemplate(tmpl)}
            className={`rounded-lg border-2 px-2 py-2 text-xs capitalize transition-colors ${
              currentTemplate === tmpl
                ? "border-primary-500 bg-primary-500/10 text-primary-400"
                : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
            }`}
          >
            {tmpl}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LAYOUT EDITOR
   ═══════════════════════════════════════════════════════ */
function LayoutSection() {
  const sidebarWidth = useResumeV2Editor((s) => s.resume.metadata.layout.sidebarWidth);
  const pages = useResumeV2Editor((s) => s.resume.metadata.layout.pages);
  const setSidebarWidth = useResumeV2Editor((s) => s.setSidebarWidth);
  const addPage = useResumeV2Editor((s) => s.addPage);
  const removePage = useResumeV2Editor((s) => s.removePage);

  return (
    <div className="space-y-3">
      <SectionTitle>Layout</SectionTitle>
      <SliderField
        label="Sidebar Width"
        value={sidebarWidth}
        onChange={setSidebarWidth}
        min={15}
        max={50}
        unit="%"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Pages: {pages.length}</span>
        <div className="flex gap-1">
          <button
            onClick={addPage}
            className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-200 hover:bg-gray-600"
          >
            + Add Page
          </button>
          {pages.length > 1 && (
            <button
              onClick={() => removePage(pages.length - 1)}
              className="rounded bg-gray-700 px-2 py-0.5 text-xs text-red-400 hover:bg-gray-600"
            >
              Remove Last
            </button>
          )}
        </div>
      </div>
      {/* Section assignment info */}
      <div className="space-y-1">
        {pages.map((page, i) => (
          <div key={i} className="rounded border border-gray-700 p-2 text-xs text-gray-400">
            <div className="font-medium text-gray-300">Page {i + 1}</div>
            <div>Main: {page.main.length ? page.main.join(", ") : "—"}</div>
            <div>Sidebar: {page.sidebar.length ? page.sidebar.join(", ") : "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TYPOGRAPHY
   ═══════════════════════════════════════════════════════ */
function TypographySection() {
  const typography = useResumeV2Editor((s) => s.resume.metadata.typography);
  const setFontFamily = useResumeV2Editor((s) => s.setFontFamily);
  const setFontSize = useResumeV2Editor((s) => s.setFontSize);
  const setLineHeight = useResumeV2Editor((s) => s.setLineHeight);

  const FONT_OPTIONS = [
    "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
    "Source Sans Pro", "Raleway", "Nunito", "Playfair Display", "Merriweather",
    "Georgia", "Times New Roman", "Arial", "Helvetica",
  ];

  return (
    <div className="space-y-4">
      <SectionTitle>Typography</SectionTitle>

      {/* Body */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-300">Body</div>
        <FormField label="Font Family">
          <select
            value={typography.body.fontFamily}
            onChange={(e) => setFontFamily("body", e.target.value)}
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-100"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </FormField>
        <SliderField
          label="Font Size"
          value={typography.body.fontSize}
          onChange={(v) => setFontSize("body", v)}
          min={8}
          max={24}
          step={0.5}
          unit="px"
        />
        <SliderField
          label="Line Height"
          value={typography.body.lineHeight}
          onChange={(v) => setLineHeight("body", v)}
          min={1}
          max={3}
          step={0.1}
        />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-300">Heading</div>
        <FormField label="Font Family">
          <select
            value={typography.heading.fontFamily}
            onChange={(e) => setFontFamily("heading", e.target.value)}
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-gray-100"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </FormField>
        <SliderField
          label="Font Size"
          value={typography.heading.fontSize}
          onChange={(v) => setFontSize("heading", v)}
          min={10}
          max={32}
          step={0.5}
          unit="px"
        />
        <SliderField
          label="Line Height"
          value={typography.heading.lineHeight}
          onChange={(v) => setLineHeight("heading", v)}
          min={1}
          max={3}
          step={0.1}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DESIGN (Colors, Level Design)
   ═══════════════════════════════════════════════════════ */
function DesignSection() {
  const colors = useResumeV2Editor((s) => s.resume.metadata.design.colors);
  const level = useResumeV2Editor((s) => s.resume.metadata.design.level);
  const setPrimaryColor = useResumeV2Editor((s) => s.setPrimaryColor);
  const setTextColor = useResumeV2Editor((s) => s.setTextColor);
  const setBackgroundColor = useResumeV2Editor((s) => s.setBackgroundColor);
  const setLevelDesign = useResumeV2Editor((s) => s.setLevelDesign);

  const LEVEL_OPTIONS = ["hidden", "circle", "square", "rectangle", "rectangle-full", "progress-bar"] as const;

  return (
    <div className="space-y-4">
      <SectionTitle>Design</SectionTitle>
      <ColorField label="Primary Color" value={colors.primary} onChange={setPrimaryColor} />
      <ColorField label="Text Color" value={colors.text} onChange={setTextColor} />
      <ColorField label="Background Color" value={colors.background} onChange={setBackgroundColor} />

      <FormField label="Level Design">
        <div className="grid grid-cols-3 gap-1">
          {LEVEL_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setLevelDesign(opt)}
              className={`rounded px-2 py-1 text-xs capitalize ${
                level.type === opt
                  ? "bg-primary-500/20 text-primary-400"
                  : "bg-gray-700 text-gray-400 hover:text-gray-200"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </FormField>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE SETTINGS
   ═══════════════════════════════════════════════════════ */
function PageSection() {
  const page = useResumeV2Editor((s) => s.resume.metadata.page);
  const setPageMargins = useResumeV2Editor((s) => s.setPageMargins);
  const setPageGaps = useResumeV2Editor((s) => s.setPageGaps);
  const setPageFormat = useResumeV2Editor((s) => s.setPageFormat);
  const setHideIcons = useResumeV2Editor((s) => s.setHideIcons);

  const FORMAT_OPTIONS: PageFormat[] = ["a4", "letter", "free-form"];

  return (
    <div className="space-y-4">
      <SectionTitle>Page</SectionTitle>

      <FormField label="Format">
        <div className="grid grid-cols-3 gap-1">
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setPageFormat(fmt)}
              className={`rounded px-2 py-1 text-xs capitalize ${
                page.format === fmt
                  ? "bg-primary-500/20 text-primary-400"
                  : "bg-gray-700 text-gray-400 hover:text-gray-200"
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </FormField>

      <SliderField label="Margin X" value={page.marginX} onChange={(v) => setPageMargins(v, page.marginY)} min={0} max={80} unit="pt" />
      <SliderField label="Margin Y" value={page.marginY} onChange={(v) => setPageMargins(page.marginX, v)} min={0} max={80} unit="pt" />
      <SliderField label="Gap X" value={page.gapX} onChange={(v) => setPageGaps(v, page.gapY)} min={0} max={40} unit="pt" />
      <SliderField label="Gap Y" value={page.gapY} onChange={(v) => setPageGaps(page.gapX, v)} min={0} max={40} unit="pt" />

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={page.hideIcons}
          onChange={(e) => setHideIcons(e.target.checked)}
          className="rounded"
        />
        Hide section icons
      </label>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CUSTOM CSS
   ═══════════════════════════════════════════════════════ */
function CSSSection() {
  const css = useResumeV2Editor((s) => s.resume.metadata.css);
  const setCustomCSS = useResumeV2Editor((s) => s.setCustomCSS);

  return (
    <div className="space-y-3">
      <SectionTitle>Custom CSS</SectionTitle>
      <p className="text-xs text-gray-500">
        Advanced: Add custom CSS rules to style your resume.
      </p>
      <textarea
        value={css.value}
        onChange={(e) => setCustomCSS(css.enabled ?? true, e.target.value)}
        placeholder=".rv2-heading { color: red; }"
        rows={8}
        className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 font-mono text-xs text-gray-100 placeholder:text-gray-500 focus:border-primary-500 focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NOTES
   ═══════════════════════════════════════════════════════ */
function NotesSection() {
  const notes = useResumeV2Editor((s) => s.resume.metadata.notes);
  const setNotes = useResumeV2Editor((s) => s.setNotes);

  return (
    <div className="space-y-3">
      <SectionTitle>Notes</SectionTitle>
      <p className="text-xs text-gray-500">
        Personal notes — not visible on your resume.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add your notes here..."
        rows={6}
        className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-primary-500 focus:outline-none"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════ */
function ExportSection() {
  const data = useResumeV2Editor((s) => s.resume);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.basics.name || "resume"}-v2.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  const importJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        useResumeV2Editor.getState().initialize(parsed);
      } catch {
        alert("Failed to import JSON file.");
      }
    };
    input.click();
  }, []);

  return (
    <div className="space-y-3">
      <SectionTitle>Export</SectionTitle>
      <div className="space-y-2">
        <button
          onClick={exportPDF}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500"
        >
          <i className="ph ph-file-pdf text-base" />
          Export as PDF (Print)
        </button>
        <button
          onClick={exportJSON}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600"
        >
          <i className="ph ph-file-arrow-down text-base" />
          Export as JSON
        </button>
        <button
          onClick={importJSON}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700"
        >
          <i className="ph ph-file-arrow-up text-base" />
          Import JSON
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RIGHT SIDEBAR
   ═══════════════════════════════════════════════════════ */

const SECTIONS = [
  { key: "template", icon: "squares-four", label: "Template", Component: TemplateSection },
  { key: "layout", icon: "layout", label: "Layout", Component: LayoutSection },
  { key: "typography", icon: "text-aa", label: "Typography", Component: TypographySection },
  { key: "design", icon: "palette", label: "Design", Component: DesignSection },
  { key: "page", icon: "file", label: "Page", Component: PageSection },
  { key: "css", icon: "code", label: "CSS", Component: CSSSection },
  { key: "notes", icon: "note", label: "Notes", Component: NotesSection },
  { key: "export", icon: "export", label: "Export", Component: ExportSection },
] as const;

export default function RightSidebar() {
  const [activeSection, setActiveSection] = useState<string>("template");

  const active = SECTIONS.find((s) => s.key === activeSection);
  const ActiveComponent = active?.Component;

  return (
    <div className="flex h-full flex-row-reverse">
      {/* Icon edge strip */}
      <div className="flex w-10 shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-l border-gray-700 bg-gray-900 py-2">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex size-8 items-center justify-center rounded-md transition-colors ${
              activeSection === s.key
                ? "bg-primary-500/20 text-primary-400"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
            }`}
            title={s.label}
          >
            <i className={`ph ph-${s.icon} text-base`} />
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
