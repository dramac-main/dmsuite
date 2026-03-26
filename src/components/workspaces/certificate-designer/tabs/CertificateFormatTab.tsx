// =============================================================================
// DMSuite — Certificate Designer: Format Tab
// Page size, orientation, margins (print-focused configuration)
// =============================================================================

"use client";

import {
  useCertificateEditor,
  type CertificateFormatConfig,
  type PageOrientation,
} from "@/stores/certificate-editor";
import {
  AccordionSection,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import { useState } from "react";

// ━━━ Icons ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const icons = {
  page: <SIcon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
  orientation: <SIcon d="M21 3H3v18h18V3zM3 9h18M3 15h18M9 3v18M15 3v18" />,
  margins: <SIcon d="M6 2h12M6 22h12M2 6v12M22 6v12" />,
  print: <SIcon d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />,
};

const PAGE_SIZES: { id: CertificateFormatConfig["pageSize"]; label: string; dim: string }[] = [
  { id: "a4", label: "A4", dim: "297 × 210 mm" },
  { id: "letter", label: "Letter", dim: "11 × 8.5 in" },
  { id: "a5", label: "A5", dim: "210 × 148 mm" },
];

const MARGIN_OPTIONS: { id: CertificateFormatConfig["margins"]; label: string; desc: string }[] = [
  { id: "narrow", label: "Narrow", desc: "10mm / 0.4in" },
  { id: "standard", label: "Standard", desc: "20mm / 0.8in" },
  { id: "wide", label: "Wide", desc: "30mm / 1.2in" },
];

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CertificateFormatTab() {
  const format = useCertificateEditor((s) => s.form.format);
  const updateFormat = useCertificateEditor((s) => s.updateFormat);

  const [openSection, setOpenSection] = useState<string | null>("page");

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Page Size ── */}
      <AccordionSection
        title="Page Size"
        icon={icons.page}
        isOpen={openSection === "page"}
        onToggle={() => setOpenSection(openSection === "page" ? null : "page")}
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
              <div>
                <div className="text-sm font-medium">{s.label}</div>
                <div className="text-xs text-gray-500">{s.dim}</div>
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
          <div className="grid grid-cols-2 gap-2">
            {(["landscape", "portrait"] as PageOrientation[]).map((o) => (
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
            Landscape is recommended for most certificate types.
          </p>
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

      {/* ── Print Tips ── */}
      <AccordionSection
        title="Print Tips"
        icon={icons.print}
        isOpen={openSection === "tips"}
        onToggle={() => setOpenSection(openSection === "tips" ? null : "tips")}
      >
        <div className="px-4 pb-4">
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex gap-2">
              <span className="text-primary-400">•</span>
              Use 160-200gsm paper for a premium, weighty feel.
            </li>
            <li className="flex gap-2">
              <span className="text-primary-400">•</span>
              Matte or linen-textured paper hides fingerprints.
            </li>
            <li className="flex gap-2">
              <span className="text-primary-400">•</span>
              Set printer to &quot;Highest Quality&quot; / &quot;Best&quot; mode.
            </li>
            <li className="flex gap-2">
              <span className="text-primary-400">•</span>
              Disable &quot;Fit to Page&quot; — print at 100% scale.
            </li>
            <li className="flex gap-2">
              <span className="text-primary-400">•</span>
              For gold/silver effects, consider foil stamping after print.
            </li>
          </ul>
        </div>
      </AccordionSection>
    </div>
  );
}
