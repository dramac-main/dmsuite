// =============================================================================
// DMSuite — Resume Design Drawer
// Slide-over panel for template selection, colors, fonts, and spacing.
// =============================================================================

"use client";

import React, { useCallback, useMemo } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import {
  ACCENT_COLORS,
  FONT_PAIRINGS,
  type TemplateId,
  type FontScale,
  type MarginPreset,
  type SectionSpacing,
  type LineSpacing,
  type ColorIntensity,
} from "@/lib/resume/schema";
import { TEMPLATES } from "@/lib/resume/templates/templates";
import {
  FormSelect,
  SIcon,
  IconButton,
  RangeSlider,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// =============================================================================
// Props
// =============================================================================

interface ResumeDesignDrawerProps {
  onClose: () => void;
  onExport: (format: string) => void;
}

// =============================================================================
// Component
// =============================================================================

export default function ResumeDesignDrawer({
  onClose,
  onExport,
}: ResumeDesignDrawerProps) {
  const resume = useResumeEditor((s) => s.resume);
  const changeTemplate = useResumeEditor((s) => s.changeTemplate);
  const setAccentColor = useResumeEditor((s) => s.setAccentColor);
  const setFontPairing = useResumeEditor((s) => s.setFontPairing);
  const setFontScale = useResumeEditor((s) => s.setFontScale);
  const updateResume = useResumeEditor((s) => s.updateResume);

  const meta = resume.metadata;

  // ── Font pairings as options ──
  const fontOptions = useMemo(
    () =>
      Object.entries(FONT_PAIRINGS).map(([id, p]) => ({
        label: p.label,
        value: id,
      })),
    []
  );

  // ── Update page settings ──
  const setPageFormat = useCallback(
    (format: string) =>
      updateResume((d) => {
        d.metadata.page.format = format as typeof d.metadata.page.format;
      }),
    [updateResume]
  );

  const setMarginPreset = useCallback(
    (preset: string) =>
      updateResume((d) => {
        d.metadata.page.marginPreset = preset as MarginPreset;
      }),
    [updateResume]
  );

  const setSectionSpacing = useCallback(
    (spacing: string) =>
      updateResume((d) => {
        d.metadata.page.sectionSpacing = spacing as SectionSpacing;
      }),
    [updateResume]
  );

  const setLineSpacing = useCallback(
    (spacing: string) =>
      updateResume((d) => {
        d.metadata.page.lineSpacing = spacing as LineSpacing;
      }),
    [updateResume]
  );

  const setColorIntensity = useCallback(
    (intensity: string) =>
      updateResume((d) => {
        d.metadata.design.colorIntensity = intensity as ColorIntensity;
      }),
    [updateResume]
  );

  const setSidebarWidth = useCallback(
    (width: number) =>
      updateResume((d) => {
        d.metadata.layout.sidebarWidth = width;
      }),
    [updateResume]
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="relative w-80 max-w-full bg-gray-900 border-l border-gray-800/60 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between h-11 px-4 border-b border-gray-800/40 shrink-0">
          <span className="text-[13px] font-semibold text-gray-200">
            Design Settings
          </span>
          <IconButton
            icon={<SIcon d="M6 18L18 6M6 6l12 12" />}
            title="Close"
            onClick={onClose}
          />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
          {/* ── Template Selection ── */}
          <section>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Template
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => changeTemplate(t.id)}
                  className={`relative text-left px-3 py-2.5 rounded-lg border transition-all text-[11px] ${
                    meta.template === t.id
                      ? "bg-primary-500/10 border-primary-500/40 text-primary-300"
                      : "bg-gray-800/30 border-gray-700/20 text-gray-400 hover:border-gray-600/40 hover:text-gray-300"
                  }`}
                >
                  <p className="font-medium truncate">{t.name}</p>
                  {t.isDark && (
                    <span className="text-[9px] text-gray-600">Dark</span>
                  )}
                  {meta.template === t.id && (
                    <span className="absolute top-1.5 right-1.5">
                      <SIcon
                        d="M5 13l4 4L19 7"
                        className="w-3 h-3 text-primary-400"
                      />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ── Accent Color ── */}
          <section>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Accent Color
            </h3>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setAccentColor(c.value)}
                  title={c.name}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    meta.design.primaryColor === c.value
                      ? "border-white ring-2 ring-primary-500/30 scale-110"
                      : "border-gray-700/40"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
            {/* Custom color input */}
            <div className="flex items-center gap-2 mt-2.5">
              <input
                type="color"
                value={rgbaToHex(meta.design.primaryColor)}
                onChange={(e) => setAccentColor(hexToRgba(e.target.value))}
                className="w-7 h-7 rounded cursor-pointer bg-transparent border border-gray-700/30"
              />
              <span className="text-[10px] text-gray-600 font-mono">
                Custom
              </span>
            </div>
          </section>

          {/* ── Color Intensity ── */}
          <section>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Color Intensity
            </h3>
            <div className="flex gap-1.5">
              {(["subtle", "standard", "bold"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setColorIntensity(opt)}
                  className={`flex-1 py-1.5 text-[11px] rounded-md border transition-colors ${
                    meta.design.colorIntensity === opt
                      ? "bg-primary-500/10 border-primary-500/30 text-primary-400"
                      : "border-gray-700/20 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* ── Typography ── */}
          <section>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Typography
            </h3>
            <FormSelect
              label="Font Pairing"
              value={meta.typography.fontPairing}
              onChange={(v) => setFontPairing(v)}
              options={fontOptions}
            />
            <div className="mt-3">
              <span className="text-[11px] text-gray-500 mb-1.5 block">
                Font Scale
              </span>
              <div className="flex gap-1.5">
                {(["compact", "standard", "spacious"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFontScale(opt)}
                    className={`flex-1 py-1.5 text-[11px] rounded-md border transition-colors ${
                      meta.typography.fontScale === opt
                        ? "bg-primary-500/10 border-primary-500/30 text-primary-400"
                        : "border-gray-700/20 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Page Format ── */}
          <section>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Page Settings
            </h3>
            <FormSelect
              label="Page Format"
              value={meta.page.format}
              onChange={setPageFormat}
              options={[
                { label: "A4", value: "a4" },
                { label: "US Letter", value: "letter" },
                { label: "A5", value: "a5" },
                { label: "B5", value: "b5" },
              ]}
            />
          </section>

          {/* ── Margins ── */}
          <section>
            <span className="text-[11px] text-gray-500 mb-1.5 block">Margins</span>
            <div className="flex gap-1.5">
              {(["narrow", "standard", "wide"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setMarginPreset(opt)}
                  className={`flex-1 py-1.5 text-[11px] rounded-md border transition-colors ${
                    meta.page.marginPreset === opt
                      ? "bg-primary-500/10 border-primary-500/30 text-primary-400"
                      : "border-gray-700/20 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* ── Section Spacing ── */}
          <section>
            <span className="text-[11px] text-gray-500 mb-1.5 block">Section Spacing</span>
            <div className="flex gap-1.5">
              {(["compact", "standard", "relaxed"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSectionSpacing(opt)}
                  className={`flex-1 py-1.5 text-[11px] rounded-md border transition-colors ${
                    meta.page.sectionSpacing === opt
                      ? "bg-primary-500/10 border-primary-500/30 text-primary-400"
                      : "border-gray-700/20 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* ── Line Spacing ── */}
          <section>
            <span className="text-[11px] text-gray-500 mb-1.5 block">Line Spacing</span>
            <div className="flex gap-1.5">
              {(["tight", "normal", "loose"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLineSpacing(opt)}
                  className={`flex-1 py-1.5 text-[11px] rounded-md border transition-colors ${
                    meta.page.lineSpacing === opt
                      ? "bg-primary-500/10 border-primary-500/30 text-primary-400"
                      : "border-gray-700/20 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* ── Sidebar Width (two-column templates) ── */}
          <section>
            <span className="text-[11px] text-gray-500 mb-1.5 block">
              Sidebar Width ({meta.layout.sidebarWidth}%)
            </span>
            <input
              type="range"
              min={20}
              max={45}
              value={meta.layout.sidebarWidth}
              onChange={(e) => setSidebarWidth(Number(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </section>

          {/* Spacer */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Color helpers
// =============================================================================

function rgbaToHex(rgba: string): string {
  const match = rgba.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)/
  );
  if (!match) return "#2563eb";
  const r = parseInt(match[1]).toString(16).padStart(2, "0");
  const g = parseInt(match[2]).toString(16).padStart(2, "0");
  const b = parseInt(match[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function hexToRgba(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 1)`;
}
