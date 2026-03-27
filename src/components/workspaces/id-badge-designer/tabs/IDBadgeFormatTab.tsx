"use client";

import { useState } from "react";
import {
  useIDBadgeEditor,
  CARD_SIZES,
  type PrintLayout,
} from "@/stores/id-badge-editor";
import {
  AccordionSection,
  FormInput,
  FormSelect,
  Toggle,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ── Icons ───────────────────────────────────────────────────────────────────

const icons = {
  size: <SIcon d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />,
  print: <SIcon d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />,
  security: <SIcon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  bleed: <SIcon d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />,
  export: <SIcon d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
};

const PRINT_LAYOUTS: { value: PrintLayout; label: string; desc: string }[] = [
  { value: "single", label: "Single", desc: "One badge per page" },
  { value: "2-up", label: "2-Up", desc: "Two badges per sheet" },
  { value: "4-up", label: "4-Up", desc: "Four badges per sheet" },
  { value: "8-up", label: "8-Up", desc: "Eight badges per A4/Letter" },
  { value: "10-up", label: "10-Up", desc: "Ten badges — CR80 optimized" },
];

const ORIENTATIONS = [
  { value: "landscape", label: "Landscape (Standard)" },
  { value: "portrait", label: "Portrait" },
];

const PAGE_SIZES = [
  { value: "a4", label: "A4 (210 × 297mm)" },
  { value: "letter", label: "Letter (8.5 × 11″)" },
];

const DPI_OPTIONS = [
  { value: "300", label: "300 DPI (Standard)" },
  { value: "600", label: "600 DPI (High Quality)" },
];

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function IDBadgeFormatTab() {
  const form = useIDBadgeEditor((s) => s.form);
  const updateFormat = useIDBadgeEditor((s) => s.updateFormat);
  const updateSecurity = useIDBadgeEditor((s) => s.updateSecurity);
  const [openSection, setOpenSection] = useState<string | null>("size");

  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Card Size ── */}
      <AccordionSection
        title="Card Size"
        icon={icons.size}
        isOpen={openSection === "size"}
        onToggle={() => toggle("size")}
        badge={CARD_SIZES.find((s) => s.id === form.format.cardSize)?.name}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {CARD_SIZES.map((cs) => (
              <button
                key={cs.id}
                onClick={() => updateFormat({ cardSize: cs.id })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  form.format.cardSize === cs.id
                    ? "border-primary-500/50 bg-primary-500/10 ring-1 ring-primary-500/20"
                    : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60"
                }`}
              >
                <div className={`text-[10px] font-medium ${form.format.cardSize === cs.id ? "text-primary-300" : "text-gray-300"}`}>
                  {cs.name}
                </div>
                <div className="text-[8px] text-gray-600 mt-0.5">
                  {cs.widthMm} × {cs.heightMm} mm
                </div>
              </button>
            ))}
          </div>

          <FormSelect
            label="Orientation"
            value={form.format.orientation}
            onChange={(e) => updateFormat({ orientation: e.target.value as "landscape" | "portrait" })}
          >
            {ORIENTATIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </FormSelect>
        </div>
      </AccordionSection>

      {/* ── Print Layout ── */}
      <AccordionSection
        title="Print Layout"
        icon={icons.print}
        isOpen={openSection === "print"}
        onToggle={() => toggle("print")}
      >
        <div className="px-4 pb-4 space-y-3">
          <SectionLabel>Layout</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {PRINT_LAYOUTS.map((pl) => (
              <button
                key={pl.value}
                onClick={() => updateFormat({ printLayout: pl.value })}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  form.format.printLayout === pl.value
                    ? "border-primary-500/50 bg-primary-500/10"
                    : "border-gray-700/40 bg-gray-800/30 hover:border-gray-600/60"
                }`}
              >
                <div className={`text-[10px] font-medium ${form.format.printLayout === pl.value ? "text-primary-300" : "text-gray-300"}`}>
                  {pl.label}
                </div>
                <div className="text-[8px] text-gray-600 mt-0.5">{pl.desc}</div>
              </button>
            ))}
          </div>

          <FormSelect
            label="Page Size"
            value={form.format.printPageSize}
            onChange={(e) => updateFormat({ printPageSize: e.target.value as "a4" | "letter" })}
          >
            {PAGE_SIZES.map((ps) => (
              <option key={ps.value} value={ps.value}>{ps.label}</option>
            ))}
          </FormSelect>

          <FormSelect
            label="Resolution"
            value={form.format.dpi.toString()}
            onChange={(e) => updateFormat({ dpi: parseInt(e.target.value) as 300 | 600 })}
          >
            {DPI_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </FormSelect>
        </div>
      </AccordionSection>

      {/* ── Bleed & Marks ── */}
      <AccordionSection
        title="Bleed & Guides"
        icon={icons.bleed}
        isOpen={openSection === "bleed"}
        onToggle={() => toggle("bleed")}
      >
        <div className="px-4 pb-4 space-y-3">
          <Toggle
            label="Bleed Zone"
            description="3mm bleed area extends beyond card edges"
            checked={form.format.showBleedArea}
            onChange={(v) => updateFormat({ showBleedArea: v })}
          />
          <Toggle
            label="Safe Zone"
            description="5mm inside margin — critical content stays within"
            checked={form.format.showSafeZone}
            onChange={(v) => updateFormat({ showSafeZone: v })}
          />
          <Toggle
            label="Cut Marks"
            description="Crop marks at corners for trim-to-size cutting"
            checked={form.format.showCutMarks}
            onChange={(v) => updateFormat({ showCutMarks: v })}
          />
        </div>
      </AccordionSection>

      {/* ── Security Features ── */}
      <AccordionSection
        title="Security Features"
        icon={icons.security}
        isOpen={openSection === "security"}
        onToggle={() => toggle("security")}
      >
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[10px] text-gray-600">
            Security features are rendered visually and help prevent forgery. Most work best with professional card printers.
          </p>
          <Toggle
            label="Holographic Zone"
            description="Diagonal holographic shimmer pattern"
            checked={form.security.showHolographicZone}
            onChange={(v) => updateSecurity({ showHolographicZone: v })}
          />
          <Toggle
            label="Watermark"
            description="Subtle organization name watermark"
            checked={form.security.showWatermark}
            onChange={(v) => updateSecurity({ showWatermark: v })}
          />
          {form.security.showWatermark && (
            <FormInput
              label="Watermark Text"
              value={form.security.watermarkText}
              onChange={(e) => updateSecurity({ watermarkText: e.target.value })}
              placeholder="OFFICIAL"
            />
          )}
          <Toggle
            label="Microtext Border"
            description="Tiny repeating text around the badge perimeter"
            checked={form.security.showMicrotextBorder}
            onChange={(v) => updateSecurity({ showMicrotextBorder: v })}
          />
          {form.security.showMicrotextBorder && (
            <FormInput
              label="Microtext"
              value={form.security.microtextContent}
              onChange={(e) => updateSecurity({ microtextContent: e.target.value })}
              placeholder="AUTHENTIC VALID GENUINE"
            />
          )}
          <Toggle
            label="Sequential Numbering"
            description="Auto-number each badge (useful for batch mode)"
            checked={form.security.sequentialNumbering}
            onChange={(v) => updateSecurity({ sequentialNumbering: v })}
          />
          {form.security.sequentialNumbering && (
            <FormInput
              label="Starting Number"
              type="number"
              value={form.security.sequentialStart.toString()}
              onChange={(e) => updateSecurity({ sequentialStart: parseInt(e.target.value) || 1 })}
            />
          )}
        </div>
      </AccordionSection>

      {/* ── Export ── */}
      <AccordionSection
        title="Export Settings"
        icon={icons.export}
        isOpen={openSection === "export"}
        onToggle={() => toggle("export")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormSelect
            label="Color Profile"
            value={form.format.colorProfile}
            onChange={(e) => updateFormat({ colorProfile: e.target.value as "rgb" | "cmyk-sim" })}
          >
            <option value="rgb">RGB (Screen / Inkjet)</option>
            <option value="cmyk-sim">CMYK Simulation (Professional Print)</option>
          </FormSelect>
          <p className="text-[10px] text-gray-600">
            RGB is suitable for direct-to-card printers and inkjets. CMYK is recommended for offset/professional printing.
          </p>
        </div>
      </AccordionSection>
    </div>
  );
}
