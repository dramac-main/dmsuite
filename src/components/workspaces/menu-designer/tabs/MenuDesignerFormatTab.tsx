// =============================================================================
// DMSuite — Menu Designer: Format Tab
// Page size, fold type, orientation, margins, and print-mark configuration.
// =============================================================================

"use client";

import { useState } from "react";
import {
  useMenuDesignerEditor,
  type MenuFormatConfig,
  type MenuPageSize,
  type FoldType,
} from "@/stores/menu-designer-editor";
import {
  AccordionSection,
  SIcon,
  Toggle,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ━━━ Icons ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const icons = {
  page: <SIcon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
  fold: <SIcon d="M9 3v18M15 3v18M4 3h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" />,
  orientation: <SIcon d="M21 3H3v18h18V3zM3 9h18M3 15h18M9 3v18M15 3v18" />,
  margins: <SIcon d="M6 2h12M6 22h12M2 6v12M22 6v12" />,
  print: <SIcon d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />,
};

// ━━━ Data ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PAGE_SIZES: { id: MenuPageSize; label: string; dim: string; note?: string }[] = [
  { id: "a4", label: "A4", dim: "210 × 297 mm" },
  { id: "letter", label: "Letter", dim: "8.5 × 11 in" },
  { id: "a5", label: "A5", dim: "148 × 210 mm", note: "Ideal for compact menus" },
  { id: "dl", label: "DL", dim: "99 × 210 mm", note: "Slim rack card format" },
  { id: "square", label: "Square", dim: "210 × 210 mm", note: "Trendy & Instagram-friendly" },
  { id: "tabloid", label: "Tabloid", dim: "11 × 17 in", note: "Large-format placemats & posters" },
];

const FOLD_TYPES: { id: FoldType; label: string; desc: string }[] = [
  { id: "flat", label: "Flat Sheet", desc: "Single unfolded page" },
  { id: "bi-fold", label: "Bi-Fold", desc: "4 panels, folded in half" },
  { id: "tri-fold", label: "Tri-Fold", desc: "6 panels, letter-fold" },
];

const MARGIN_OPTIONS: { id: MenuFormatConfig["margins"]; label: string; desc: string }[] = [
  { id: "narrow", label: "Narrow", desc: "10mm / 0.4in" },
  { id: "standard", label: "Standard", desc: "20mm / 0.8in" },
  { id: "wide", label: "Wide", desc: "30mm / 1.2in" },
];

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function MenuDesignerFormatTab() {
  const format = useMenuDesignerEditor((s) => s.form.format);
  const updateFormat = useMenuDesignerEditor((s) => s.updateFormat);

  const [openSection, setOpenSection] = useState<string | null>("page");
  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Page Size ── */}
      <AccordionSection
        title="Page Size"
        icon={icons.page}
        isOpen={openSection === "page"}
        onToggle={() => toggle("page")}
      >
        <div className="px-4 pb-4 space-y-2">
          {PAGE_SIZES.map((s) => (
            <label
              key={s.id}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                format.pageSize === s.id
                  ? "border-primary-500 bg-primary-500/10 text-primary-300"
                  : "border-gray-700/40 bg-gray-800/20 text-gray-400 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="pageSize"
                value={s.id}
                checked={format.pageSize === s.id}
                onChange={() => updateFormat({ pageSize: s.id })}
                className="text-primary-500 focus:ring-primary-500/30"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-gray-500">{s.dim}</div>
                {s.note && <div className="text-[10px] text-gray-600 mt-0.5">{s.note}</div>}
              </div>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* ── Fold Type ── */}
      <AccordionSection
        title="Fold Type"
        icon={icons.fold}
        isOpen={openSection === "fold"}
        onToggle={() => toggle("fold")}
      >
        <div className="px-4 pb-4 space-y-2">
          {FOLD_TYPES.map((f) => (
            <label
              key={f.id}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                format.foldType === f.id
                  ? "border-primary-500 bg-primary-500/10 text-primary-300"
                  : "border-gray-700/40 bg-gray-800/20 text-gray-400 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="foldType"
                value={f.id}
                checked={format.foldType === f.id}
                onChange={() => updateFormat({ foldType: f.id })}
                className="text-primary-500 focus:ring-primary-500/30"
              />
              <div>
                <div className="text-sm font-medium">{f.label}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* ── Orientation ── */}
      <AccordionSection
        title="Orientation"
        icon={icons.orientation}
        isOpen={openSection === "orientation"}
        onToggle={() => toggle("orientation")}
      >
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {(["portrait", "landscape"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => updateFormat({ orientation: o })}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                  format.orientation === o
                    ? "border-primary-500 bg-primary-500/10 text-primary-300"
                    : "border-gray-700/40 bg-gray-800/20 text-gray-400 hover:border-gray-600"
                }`}
              >
                <div
                  className={`border-2 rounded-sm ${
                    format.orientation === o
                      ? "border-primary-400"
                      : "border-gray-600"
                  } ${o === "landscape" ? "w-12 h-8" : "w-8 h-12"}`}
                />
                <span className="text-xs font-medium capitalize">{o}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Portrait is standard for most menus. Landscape works well for bi-fold and placemat layouts.
          </p>
        </div>
      </AccordionSection>

      {/* ── Margins ── */}
      <AccordionSection
        title="Margins"
        icon={icons.margins}
        isOpen={openSection === "margins"}
        onToggle={() => toggle("margins")}
      >
        <div className="px-4 pb-4 space-y-2">
          {MARGIN_OPTIONS.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                format.margins === m.id
                  ? "border-primary-500 bg-primary-500/10 text-primary-300"
                  : "border-gray-700/40 bg-gray-800/20 text-gray-400 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="margins"
                value={m.id}
                checked={format.margins === m.id}
                onChange={() => updateFormat({ margins: m.id })}
                className="text-primary-500 focus:ring-primary-500/30"
              />
              <div>
                <div className="text-sm font-medium">{m.label}</div>
                <div className="text-xs text-gray-500">{m.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* ── Print Marks & Tips ── */}
      <AccordionSection
        title="Print Settings"
        icon={icons.print}
        isOpen={openSection === "print"}
        onToggle={() => toggle("print")}
      >
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-3">
            <Toggle
              checked={format.bleedMarks}
              onChange={(v) => updateFormat({ bleedMarks: v })}
              label="Bleed Marks"
              description="Add 3mm bleed area for professional print runs"
            />
            <Toggle
              checked={format.cropMarks}
              onChange={(v) => updateFormat({ cropMarks: v })}
              label="Crop Marks"
              description="Show trim lines for cutting guides"
            />
          </div>

          <div className="border-t border-gray-800/30 pt-3">
            <p className="text-[11px] font-medium text-gray-500 mb-2">Print Tips</p>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex gap-2">
                <span className="text-primary-400">•</span>
                Use 200-300gsm card stock for table menus that get handled.
              </li>
              <li className="flex gap-2">
                <span className="text-primary-400">•</span>
                Laminate menus for restaurants — protects from splashes and grease.
              </li>
              <li className="flex gap-2">
                <span className="text-primary-400">•</span>
                Use matte finish for fine dining. Gloss works for takeaway/fast food.
              </li>
              <li className="flex gap-2">
                <span className="text-primary-400">•</span>
                Disable &quot;Fit to Page&quot; — print at 100% scale for correct sizing.
              </li>
              <li className="flex gap-2">
                <span className="text-primary-400">•</span>
                Set printer to &quot;Highest Quality&quot; for crisp text and sharp dividers.
              </li>
              <li className="flex gap-2">
                <span className="text-primary-400">•</span>
                DL format fits standard napkin holders and countertop displays.
              </li>
            </ul>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}
