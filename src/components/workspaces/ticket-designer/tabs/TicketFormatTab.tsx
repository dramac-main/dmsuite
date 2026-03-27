"use client";

import { useState } from "react";
import {
  useTicketEditor,
  TICKET_SIZES,
  type TicketSize,
} from "@/stores/ticket-editor";
import {
  AccordionSection,
  FormInput,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ━━━ SVG paths ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ICON = {
  size: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4",
  margins: "M9 4v16M15 4v16M4 9h16M4 15h16",
  print: "M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z",
  batch: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
};

const MARGIN_OPTIONS = [
  { id: "none" as const, label: "None", desc: "Full bleed, no margins" },
  { id: "narrow" as const, label: "Narrow", desc: "6mm / 0.25in padding" },
  { id: "standard" as const, label: "Standard", desc: "12mm / 0.5in padding" },
];

export default function TicketFormatTab() {
  const form = useTicketEditor((s) => s.form);
  const updateFormat = useTicketEditor((s) => s.updateFormat);

  const [openSection, setOpenSection] = useState<string | null>("size");
  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  return (
    <div className="flex flex-col gap-1 p-2">
      {/* ─── Ticket Size ─── */}
      <AccordionSection
        title="Ticket Size"
        icon={<SIcon d={ICON.size} />}
        isOpen={openSection === "size"}
        onToggle={() => toggle("size")}
        badge={TICKET_SIZES.find((s) => s.id === form.format.ticketSize)?.label?.split(" ")[0]}
      >
        <div className="flex flex-col gap-1.5">
          {TICKET_SIZES.map((s) => (
            <label
              key={s.id}
              className={`flex items-start gap-2.5 rounded-md px-2.5 py-2 cursor-pointer transition-all border ${
                form.format.ticketSize === s.id
                  ? "border-primary-500 bg-primary-500/10 text-primary-300"
                  : "border-gray-700/40 bg-gray-800/20 text-gray-400 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="ticketSize"
                checked={form.format.ticketSize === s.id}
                onChange={() => updateFormat({ ticketSize: s.id })}
                className="mt-0.5 text-primary-500 focus:ring-primary-500/30 bg-gray-800 border-gray-600"
              />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium">{s.label}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">{s.description}</div>
              </div>
            </label>
          ))}

          {/* Custom dimensions */}
          {form.format.ticketSize === "custom" && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <FormInput
                label="Width (px)"
                type="number"
                value={String(form.format.customWidth)}
                onChange={(e) => updateFormat({ customWidth: Math.max(200, parseInt(e.target.value) || 816) })}
              />
              <FormInput
                label="Height (px)"
                type="number"
                value={String(form.format.customHeight)}
                onChange={(e) => updateFormat({ customHeight: Math.max(80, parseInt(e.target.value) || 336) })}
              />
            </div>
          )}
        </div>
      </AccordionSection>

      {/* ─── Margins ─── */}
      <AccordionSection
        title="Margins"
        icon={<SIcon d={ICON.margins} />}
        isOpen={openSection === "margins"}
        onToggle={() => toggle("margins")}
      >
        <div className="flex flex-col gap-1.5">
          {MARGIN_OPTIONS.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 cursor-pointer transition-all border ${
                form.format.margins === m.id
                  ? "border-primary-500 bg-primary-500/10 text-primary-300"
                  : "border-gray-700/40 bg-gray-800/20 text-gray-400 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="margins"
                checked={form.format.margins === m.id}
                onChange={() => updateFormat({ margins: m.id })}
                className="text-primary-500 focus:ring-primary-500/30 bg-gray-800 border-gray-600"
              />
              <div>
                <div className="text-[11px] font-medium">{m.label}</div>
                <div className="text-[9px] text-gray-500">{m.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* ─── Print Settings ─── */}
      <AccordionSection
        title="Print Settings"
        icon={<SIcon d={ICON.print} />}
        isOpen={openSection === "print"}
        onToggle={() => toggle("print")}
      >
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.format.bleed}
              onChange={(e) => updateFormat({ bleed: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30 size-3.5"
            />
            Show bleed area (3mm)
          </label>
          <label className="flex items-center gap-2 text-[11px] text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.format.cropMarks}
              onChange={(e) => updateFormat({ cropMarks: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30 size-3.5"
            />
            Show crop marks
          </label>

          {form.format.ticketSize === "a4-sheet" && (
            <div className="mt-1">
              <FormInput
                label="Tickets per page"
                type="number"
                value={String(form.format.ticketsPerPage)}
                onChange={(e) => updateFormat({ ticketsPerPage: Math.min(6, Math.max(1, parseInt(e.target.value) || 3)) })}
              />
            </div>
          )}
        </div>
      </AccordionSection>

      {/* ─── Print Tips ─── */}
      <AccordionSection
        title="Print Tips"
        icon={<SIcon d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
        isOpen={openSection === "tips"}
        onToggle={() => toggle("tips")}
      >
        <div className="text-[10px] text-gray-500 leading-relaxed space-y-2">
          <p>
            <strong className="text-gray-400 block mb-0.5">Paper Stock</strong>
            Use 80-110 lb cover stock or thick card for durability. Glossy for a premium feel, matte for readability.
          </p>
          <p>
            <strong className="text-gray-400 block mb-0.5">Bleed & Crop Marks</strong>
            Enable bleed (3mm) and crop marks for professional print shops. This ensures clean edges after trimming.
          </p>
          <p>
            <strong className="text-gray-400 block mb-0.5">Perforation</strong>
            If using detachable stubs, ask your printer about perforation die-cutting. Standard perf lines are at 72mm from the edge.
          </p>
          <p>
            <strong className="text-gray-400 block mb-0.5">Barcode Clarity</strong>
            Ensure barcodes/QR codes have at least 8px quiet zone. Print a test at 300 DPI and verify scanning.
          </p>
          <p>
            <strong className="text-gray-400 block mb-0.5">Batch Printing</strong>
            Use A4 Sheet mode for multiple tickets per page. Enable serial numbering for unique ticket IDs.
          </p>
        </div>
      </AccordionSection>
    </div>
  );
}
