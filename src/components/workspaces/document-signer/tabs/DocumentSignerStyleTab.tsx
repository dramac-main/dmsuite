// =============================================================================
// DMSuite — Document Signer — Style Tab
// Accent color, font, field appearance, branding
// =============================================================================

"use client";

import { useRef, useCallback } from "react";
import { useDocumentSignerEditor } from "@/stores/document-signer-editor";

const FONT_OPTIONS = [
  "Inter",
  "Georgia",
  "Times New Roman",
  "Merriweather",
  "Lora",
  "Roboto",
  "Open Sans",
  "Playfair Display",
  "Montserrat",
  "Courier New",
];

const ACCENT_PRESETS = [
  "#8b5cf6",
  "#06b6d4",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#f97316",
  "#14b8a6",
];

const BORDER_STYLES: { value: "solid" | "dashed" | "dotted" | "none"; label: string }[] = [
  { value: "dashed", label: "Dashed" },
  { value: "solid", label: "Solid" },
  { value: "dotted", label: "Dotted" },
  { value: "none", label: "None" },
];

export default function DocumentSignerStyleTab() {
  const form = useDocumentSignerEditor((s) => s.form);
  const updateStyle = useDocumentSignerEditor((s) => s.updateStyle);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateStyle({ companyLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    },
    [updateStyle]
  );

  return (
    <div className="p-4 space-y-6">
      {/* Accent Color */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Accent Color
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => updateStyle({ accentColor: color })}
              className={`w-7 h-7 rounded-lg transition-all ${
                form.style.accentColor === color
                  ? "ring-2 ring-white/30 ring-offset-1 ring-offset-gray-900 scale-110"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <div className="relative">
            <input
              type="color"
              value={form.style.accentColor}
              onChange={(e) => updateStyle({ accentColor: e.target.value })}
              className="w-7 h-7 rounded-lg cursor-pointer border border-gray-700/50 opacity-0 absolute inset-0"
            />
            <div className="w-7 h-7 rounded-lg border border-dashed border-gray-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Font Family */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Font Family
        </label>
        <select
          value={form.style.fontFamily}
          onChange={(e) => updateStyle({ fontFamily: e.target.value })}
          className="w-full h-9 px-3 rounded-lg bg-gray-800/60 border border-gray-700/50 text-sm text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Base Font Size */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Base Font Size
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={10}
            max={20}
            value={form.style.fontSize}
            onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
            className="flex-1 accent-primary-500"
          />
          <span className="text-[11px] text-gray-400 w-8 text-right font-mono">{form.style.fontSize}px</span>
        </div>
      </div>

      {/* Field Appearance */}
      <div className="space-y-3">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Field Appearance
        </label>

        {/* Border style */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Border Style</label>
          <div className="grid grid-cols-4 gap-1.5">
            {BORDER_STYLES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateStyle({ fieldBorderStyle: value })}
                className={`py-1.5 text-[10px] rounded-lg border transition-all ${
                  form.style.fieldBorderStyle === value
                    ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                    : "border-gray-700/40 text-gray-500 hover:border-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Background opacity */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Field Background Opacity</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={50}
              value={Math.round(form.style.fieldBackgroundOpacity * 100)}
              onChange={(e) => updateStyle({ fieldBackgroundOpacity: Number(e.target.value) / 100 })}
              className="flex-1 accent-primary-500"
            />
            <span className="text-[11px] text-gray-400 w-8 text-right font-mono">
              {Math.round(form.style.fieldBackgroundOpacity * 100)}%
            </span>
          </div>
        </div>

        {/* Show labels */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.style.showFieldLabels}
            onChange={(e) => updateStyle({ showFieldLabels: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-gray-600 text-primary-500 focus:ring-primary-500/30 bg-gray-800"
          />
          <span className="text-[11px] text-gray-300">Show field labels</span>
        </label>

        {/* Show required indicator */}
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={form.style.showRequiredIndicator}
            onChange={(e) => updateStyle({ showRequiredIndicator: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-gray-600 text-primary-500 focus:ring-primary-500/30 bg-gray-800"
          />
          <span className="text-[11px] text-gray-300">Show required (*) indicator</span>
        </label>
      </div>

      {/* Branding */}
      <div className="space-y-3">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Branding
        </label>

        {/* Company Name */}
        <div className="space-y-1">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Company Name</label>
          <input
            type="text"
            value={form.style.companyName}
            onChange={(e) => updateStyle({ companyName: e.target.value })}
            placeholder="Your Company Name"
            className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>

        {/* Company Logo */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Company Logo</label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          {form.style.companyLogo ? (
            <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-700/30 bg-gray-800/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.style.companyLogo}
                alt="Logo"
                className="w-10 h-10 rounded object-contain bg-white/10"
              />
              <button
                onClick={() => updateStyle({ companyLogo: undefined })}
                className="text-[9px] text-red-400/70 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              className="w-full p-3 rounded-lg border border-dashed border-gray-700/50 hover:border-primary-500/40 text-[10px] text-gray-500 hover:text-gray-400 transition-all"
            >
              Upload Logo
            </button>
          )}
        </div>

        {/* Brand Color */}
        <div className="space-y-1">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Brand Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.style.brandColor}
              onChange={(e) => updateStyle({ brandColor: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-gray-700/50"
            />
            <span className="text-[9px] text-gray-500 font-mono">{form.style.brandColor}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
