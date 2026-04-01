// =============================================================================
// Resume & CV — Design Drawer (slide-over panel)
// Template gallery, accent colors, typography, spacing, layout, custom CSS
// =============================================================================

"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import type { TemplateId, LevelType } from "@/lib/resume/schema";
import { FONT_PAIRINGS, POPULAR_FONTS } from "@/lib/resume/schema";
import { TEMPLATE_CONFIGS, TEMPLATE_LIST } from "@/lib/resume/templates";
import { FormSelect, Toggle } from "@/components/workspaces/shared/WorkspaceUIKit";

// ---------------------------------------------------------------------------
// Preset accent colors
// ---------------------------------------------------------------------------

const ACCENT_PRESETS = [
  "rgba(139,92,246,1)",   // Electric Violet (DMSuite)
  "rgba(59,130,246,1)",   // Blue
  "rgba(34,197,94,1)",    // Green
  "rgba(234,179,8,1)",    // Amber
  "rgba(239,68,68,1)",    // Red
  "rgba(14,165,233,1)",   // Sky
  "rgba(168,85,247,1)",   // Purple
  "rgba(107,114,128,1)",  // Gray
  "rgba(236,72,153,1)",   // Pink
  "rgba(20,184,166,1)",   // Teal
  "rgba(249,115,22,1)",   // Orange
  "rgba(0,0,0,1)",        // Black
];

const LEVEL_TYPES: { value: LevelType; label: string }[] = [
  { value: "circle", label: "Circles" },
  { value: "square", label: "Squares" },
  { value: "rectangle", label: "Rectangles" },
  { value: "progress-bar", label: "Progress Bar" },
  { value: "hidden", label: "Hidden" },
];

// ---------------------------------------------------------------------------
// Design Drawer
// ---------------------------------------------------------------------------

interface ResumeDesignDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function ResumeDesignDrawer({ open, onClose }: ResumeDesignDrawerProps) {
  const meta = useResumeEditor((s) => s.resume?.metadata);
  const changeTemplate = useResumeEditor((s) => s.changeTemplate);
  const setPrimaryColor = useResumeEditor((s) => s.setPrimaryColor);
  const setTextColor = useResumeEditor((s) => s.setTextColor);
  const setBackgroundColor = useResumeEditor((s) => s.setBackgroundColor);
  const setSidebarWidth = useResumeEditor((s) => s.setSidebarWidth);
  const setPageFormat = useResumeEditor((s) => s.setPageFormat);
  const setPageMargins = useResumeEditor((s) => s.setPageMargins);
  const setPageGaps = useResumeEditor((s) => s.setPageGaps);
  const setBodyTypography = useResumeEditor((s) => s.setBodyTypography);
  const setHeadingTypography = useResumeEditor((s) => s.setHeadingTypography);
  const setLevelDesign = useResumeEditor((s) => s.setLevelDesign);
  const setHideIcons = useResumeEditor((s) => s.setHideIcons);
  const setCustomCSS = useResumeEditor((s) => s.setCustomCSS);

  const [activeTab, setActiveTab] = useState<"templates" | "colors" | "typography" | "layout" | "css">("templates");

  // --- Font pairing options ---
  const fontPairOptions = useMemo(() =>
    Object.entries(FONT_PAIRINGS).map(([id, p]) => ({
      value: id,
      label: `${p.heading} / ${p.body}`,
    })),
    [],
  );

  // --- Font options ---
  const fontOptions = useMemo(() =>
    POPULAR_FONTS.map((f) => ({ value: f, label: f })),
    [],
  );

  // --- Current font pairing id ---
  const currentPairingId = useMemo(() => {
    const heading = meta?.typography?.heading?.fontFamily;
    const body = meta?.typography?.body?.fontFamily;
    if (!heading || !body) return "";
    const entry = Object.entries(FONT_PAIRINGS).find(
      ([, p]) => p.heading === heading && p.body === body,
    );
    return entry?.[0] ?? "";
  }, [meta?.typography]);

  const handleFontPairing = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const pair = FONT_PAIRINGS[e.target.value];
      if (pair) {
        setHeadingTypography({ fontFamily: pair.heading });
        setBodyTypography({ fontFamily: pair.body });
      }
    },
    [setHeadingTypography, setBodyTypography],
  );

  if (!open) return null;

  // Safety guard: meta must be fully populated before rendering controls
  if (!meta?.typography?.heading || !meta?.typography?.body || !meta?.design?.colors || !meta?.page || !meta?.layout || !meta?.css) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-80 bg-gray-900/95 border-l border-gray-800/60 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/40">
          <h2 className="text-sm font-semibold text-gray-200">Design</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-lg">×</button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-800/40 overflow-x-auto">
          {(["templates", "colors", "typography", "layout", "css"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-2 py-2.5 text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                activeTab === tab ? "text-primary-400 border-b-2 border-primary-500" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "css" ? "CSS" : tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

          {/* === TEMPLATES TAB === */}
          {activeTab === "templates" && (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Choose Template</p>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATE_LIST.map((tpl) => {
                  const active = meta.template === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => changeTemplate(tpl.id)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                        active
                          ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                          : "border-gray-700/40 hover:border-gray-600 bg-gray-800/30 hover:bg-gray-800/50"
                      }`}
                    >
                      <span className="text-xl">{tpl.thumbnail}</span>
                      <span className={`text-[10px] font-medium ${active ? "text-primary-400" : "text-gray-400"}`}>{tpl.name}</span>
                    </button>
                  );
                })}
              </div>
              {meta.template && TEMPLATE_CONFIGS[meta.template as TemplateId] && (
                <p className="text-[10px] text-gray-500 italic">
                  {TEMPLATE_CONFIGS[meta.template as TemplateId].description}
                </p>
              )}
            </div>
          )}

          {/* === COLORS TAB === */}
          {activeTab === "colors" && (
            <div className="space-y-4">
              {/* Primary / Accent */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Accent Color</p>
                <div className="flex flex-wrap gap-2">
                  {ACCENT_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setPrimaryColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        meta.design.colors.primary === c ? "border-white scale-110 shadow-lg" : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500">Custom:</label>
                  <input
                    type="color"
                    value={rgbaToHex(meta.design.colors.primary)}
                    onChange={(e) => setPrimaryColor(hexToRgba(e.target.value))}
                    className="w-8 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-[10px] text-gray-600 font-mono">{meta.design.colors.primary}</span>
                </div>
              </div>

              {/* Text color */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Text Color</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={rgbaToHex(meta.design.colors.text)}
                    onChange={(e) => setTextColor(hexToRgba(e.target.value))}
                    className="w-8 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-[10px] text-gray-600 font-mono">{meta.design.colors.text}</span>
                </div>
              </div>

              {/* Background color */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Background Color</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={rgbaToHex(meta.design.colors.background)}
                    onChange={(e) => setBackgroundColor(hexToRgba(e.target.value))}
                    className="w-8 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="text-[10px] text-gray-600 font-mono">{meta.design.colors.background}</span>
                </div>
              </div>

              {/* Level design */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Skill Level Style</p>
                <div className="flex flex-wrap gap-1.5">
                  {LEVEL_TYPES.map((lt) => (
                    <button
                      key={lt.value}
                      onClick={() => setLevelDesign(lt.value)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                        meta.design.level.type === lt.value
                          ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                          : "bg-gray-800/40 text-gray-400 border border-gray-700/40 hover:border-gray-600"
                      }`}
                    >
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* === TYPOGRAPHY TAB === */}
          {activeTab === "typography" && (
            <div className="space-y-4">
              {/* Font pairing */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Font Pairing</p>
                <FormSelect
                  label="Quick Pairing"
                  value={currentPairingId}
                  onChange={handleFontPairing}
                >
                  <option value="">Custom</option>
                  {fontPairOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </FormSelect>
              </div>

              {/* Heading */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Heading Font</p>
                <FormSelect
                  value={meta.typography.heading.fontFamily}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setHeadingTypography({ fontFamily: e.target.value })}
                >
                  {fontOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </FormSelect>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">Size ({meta.typography.heading.fontSize}px)</label>
                    <input type="range" min={10} max={24} step={0.5} value={meta.typography.heading.fontSize}
                      onChange={(e) => setHeadingTypography({ fontSize: Number(e.target.value) })}
                      className="w-full accent-primary-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">Weight</label>
                    <FormSelect value={meta.typography.heading.fontWeight}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setHeadingTypography({ fontWeight: e.target.value })}>
                      <option value="300">Light</option>
                      <option value="400">Regular</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi-bold</option>
                      <option value="700">Bold</option>
                    </FormSelect>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Body Font</p>
                <FormSelect
                  value={meta.typography.body.fontFamily}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBodyTypography({ fontFamily: e.target.value })}
                >
                  {fontOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </FormSelect>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">Size ({meta.typography.body.fontSize}px)</label>
                    <input type="range" min={8} max={16} step={0.5} value={meta.typography.body.fontSize}
                      onChange={(e) => setBodyTypography({ fontSize: Number(e.target.value) })}
                      className="w-full accent-primary-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">Line Height ({meta.typography.body.lineHeight})</label>
                    <input type="range" min={1} max={3} step={0.1} value={meta.typography.body.lineHeight}
                      onChange={(e) => setBodyTypography({ lineHeight: Number(e.target.value) })}
                      className="w-full accent-primary-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === LAYOUT TAB === */}
          {activeTab === "layout" && (
            <div className="space-y-4">
              {/* Page format */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Page Format</p>
                <div className="flex gap-2">
                  {(["a4", "letter"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setPageFormat(fmt)}
                      className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-all ${
                        meta.page.format === fmt
                          ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                          : "bg-gray-800/40 text-gray-400 border border-gray-700/40 hover:border-gray-600"
                      }`}
                    >
                      {fmt === "a4" ? "A4" : "US Letter"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar width */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sidebar Width ({meta.layout.sidebarWidth}%)</p>
                <input type="range" min={0} max={50} value={meta.layout.sidebarWidth}
                  onChange={(e) => setSidebarWidth(Number(e.target.value))}
                  className="w-full accent-primary-500" />
                <div className="flex justify-between text-[9px] text-gray-600">
                  <span>0% (single column)</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Margins */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Margins (mm)</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">Horizontal ({meta.page.marginX}mm)</label>
                    <input type="range" min={4} max={30} value={meta.page.marginX}
                      onChange={(e) => setPageMargins(Number(e.target.value), meta.page.marginY)}
                      className="w-full accent-primary-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">Vertical ({meta.page.marginY}mm)</label>
                    <input type="range" min={4} max={30} value={meta.page.marginY}
                      onChange={(e) => setPageMargins(meta.page.marginX, Number(e.target.value))}
                      className="w-full accent-primary-500" />
                  </div>
                </div>
              </div>

              {/* Gaps */}
              <div className="space-y-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Section Gaps (mm)</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">Horizontal ({meta.page.gapX}mm)</label>
                    <input type="range" min={0} max={16} value={meta.page.gapX}
                      onChange={(e) => setPageGaps(Number(e.target.value), meta.page.gapY)}
                      className="w-full accent-primary-500" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-1">Vertical ({meta.page.gapY}mm)</label>
                    <input type="range" min={0} max={16} value={meta.page.gapY}
                      onChange={(e) => setPageGaps(meta.page.gapX, Number(e.target.value))}
                      className="w-full accent-primary-500" />
                  </div>
                </div>
              </div>

              {/* Hide icons */}
              <Toggle label="Hide section icons" checked={meta.page.hideIcons} onChange={(v) => setHideIcons(v)} />
            </div>
          )}

          {/* === CSS TAB === */}
          {activeTab === "css" && (
            <div className="space-y-3">
              <Toggle label="Enable Custom CSS" checked={meta.css.enabled} onChange={(v) => setCustomCSS(v, meta.css.value)} />
              {meta.css.enabled && (
                <textarea
                  value={meta.css.value}
                  onChange={(e) => setCustomCSS(true, e.target.value)}
                  rows={12}
                  spellCheck={false}
                  className="w-full font-mono text-[11px] rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2 text-green-400 placeholder-gray-600 resize-y focus:border-primary-500/50 outline-none transition-all"
                  placeholder={`.resume-page {\n  /* Your custom styles */\n}`}
                />
              )}
              <p className="text-[10px] text-gray-600">
                Target <code className="text-gray-500">.resume-page</code>, <code className="text-gray-500">.resume-section</code>, <code className="text-gray-500">h1</code>, <code className="text-gray-500">h3</code>, etc.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Animation keyframe */}
      <style dangerouslySetInnerHTML={{
        __html: `@keyframes slide-in-right{from{transform:translateX(100%)}to{transform:translateX(0)}}.animate-slide-in-right{animation:slide-in-right .25s ease-out}`,
      }} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Color conversion helpers
// ---------------------------------------------------------------------------

function rgbaToHex(rgba: string): string {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return "#8b5cf6";
  const r = Number(m[1]).toString(16).padStart(2, "0");
  const g = Number(m[2]).toString(16).padStart(2, "0");
  const b = Number(m[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function hexToRgba(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},1)`;
}
