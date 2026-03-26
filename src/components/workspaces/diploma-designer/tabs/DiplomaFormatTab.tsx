// =============================================================================
// DMSuite — Diploma Designer: Format Tab
// Page size, orientation, margins, print tips
// =============================================================================

"use client";

import { useDiplomaEditor, type DiplomaFormatConfig } from "@/stores/diploma-editor";
import { AccordionSection, SIcon } from "@/components/workspaces/shared/WorkspaceUIKit";
import { useState } from "react";

const icons = {
  size: <SIcon d="M9 17h6M9 13h6M9 9h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />,
  orientation: <SIcon d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />,
  margins: <SIcon d="M21 3H3v18h18V3zM9 3v18M15 3v18M3 9h18M3 15h18" />,
  printer: <SIcon d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />,
};

type PageSizeOption = { id: DiplomaFormatConfig["pageSize"]; label: string; desc: string };
type MarginOption = { id: DiplomaFormatConfig["margins"]; label: string; desc: string };

const PAGE_SIZES: PageSizeOption[] = [
  { id: "a4", label: "A4", desc: "210 × 297 mm — International standard" },
  { id: "letter", label: "US Letter", desc: "8.5 × 11 in — Common in North America" },
  { id: "a5", label: "A5", desc: "148 × 210 mm — Compact format" },
];

const MARGINS: MarginOption[] = [
  { id: "narrow", label: "Narrow", desc: "Maximize printable area" },
  { id: "standard", label: "Standard", desc: "Balanced spacing (default)" },
  { id: "wide", label: "Wide", desc: "Extra breathing room" },
];

const PRINT_TIPS = [
  "Use 120–160 gsm acid-free cotton or parchment paper for archival quality.",
  "Set your printer to highest quality (1200 dpi+) with ICC profile matching.",
  "Enable borderless printing for edge-to-edge designs, or add standard crop marks.",
  "Embossed seals require a separate embossing pass after printing.",
  "For gold foil accents, use a thermal foil laminator on laser-printed output.",
];

export default function DiplomaFormatTab() {
  const format = useDiplomaEditor((s) => s.form.format);
  const updateFormat = useDiplomaEditor((s) => s.updateFormat);

  const [openSection, setOpenSection] = useState<string | null>("size");

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Page Size ── */}
      <AccordionSection
        title="Page Size"
        icon={icons.size}
        isOpen={openSection === "size"}
        onToggle={() => setOpenSection(openSection === "size" ? null : "size")}
      >
        <div className="px-4 pb-4 space-y-2">
          {PAGE_SIZES.map((s) => (
            <label
              key={s.id}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                format.pageSize === s.id
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="diploma-page-size"
                checked={format.pageSize === s.id}
                onChange={() => updateFormat({ pageSize: s.id })}
                className="sr-only"
              />
              <div
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  format.pageSize === s.id ? "border-primary-500" : "border-gray-500"
                }`}
              >
                {format.pageSize === s.id && (
                  <div className="h-2 w-2 rounded-full bg-primary-500" />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${
                    format.pageSize === s.id ? "text-primary-300" : "text-gray-300"
                  }`}
                >
                  {s.label}
                </span>
                <p className="text-xs text-gray-500">{s.desc}</p>
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
        onToggle={() => setOpenSection(openSection === "orientation" ? null : "orientation")}
      >
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {(["landscape", "portrait"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => updateFormat({ orientation: o })}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                  format.orientation === o
                    ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                    : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600"
                }`}
              >
                <div
                  className={`rounded border border-gray-500/60 ${
                    o === "landscape" ? "h-8 w-12" : "h-12 w-8"
                  } ${format.orientation === o ? "bg-primary-500/20" : "bg-gray-700/40"}`}
                />
                <span
                  className={`text-xs font-medium capitalize ${
                    format.orientation === o ? "text-primary-300" : "text-gray-400"
                  }`}
                >
                  {o}
                </span>
              </button>
            ))}
          </div>
        </div>
      </AccordionSection>

      {/* ── Margins ── */}
      <AccordionSection
        title="Margins"
        icon={icons.margins}
        isOpen={openSection === "margins"}
        onToggle={() => setOpenSection(openSection === "margins" ? null : "margins")}
      >
        <div className="px-4 pb-4 space-y-2">
          {MARGINS.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                format.margins === m.id
                  ? "border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/30"
                  : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="diploma-margins"
                checked={format.margins === m.id}
                onChange={() => updateFormat({ margins: m.id })}
                className="sr-only"
              />
              <div
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  format.margins === m.id ? "border-primary-500" : "border-gray-500"
                }`}
              >
                {format.margins === m.id && (
                  <div className="h-2 w-2 rounded-full bg-primary-500" />
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`text-sm font-medium ${
                    format.margins === m.id ? "text-primary-300" : "text-gray-300"
                  }`}
                >
                  {m.label}
                </span>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* ── Print Tips ── */}
      <AccordionSection
        title="Print Tips"
        icon={icons.printer}
        isOpen={openSection === "print"}
        onToggle={() => setOpenSection(openSection === "print" ? null : "print")}
      >
        <div className="px-4 pb-4">
          <ul className="space-y-2">
            {PRINT_TIPS.map((tip, i) => (
              <li key={i} className="flex gap-2 text-xs text-gray-400">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500/60" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </AccordionSection>
    </div>
  );
}
