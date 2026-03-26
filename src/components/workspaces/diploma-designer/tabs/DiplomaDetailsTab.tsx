// =============================================================================
// DMSuite — Diploma Designer: Details Tab
// Signatories management and seal/stamp configuration
// =============================================================================

"use client";

import {
  useDiplomaEditor,
  type SealStyle,
} from "@/stores/diploma-editor";
import {
  AccordionSection,
  FormInput,
  FormSelect,
  SectionLabel,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import { useState } from "react";

const icons = {
  signatory: <SIcon d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2M9 7a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  seal: <SIcon d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4l2 2" />,
  add: <SIcon d="M12 5v14M5 12h14" />,
  trash: <SIcon d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />,
};

const SEAL_STYLES: { id: SealStyle; label: string }[] = [
  { id: "gold", label: "Gold" },
  { id: "silver", label: "Silver" },
  { id: "embossed", label: "Embossed" },
  { id: "stamp", label: "Stamp" },
  { id: "none", label: "No Seal" },
];

const SIGNATORY_ROLES = [
  "Chancellor",
  "Vice Chancellor",
  "Dean",
  "Registrar",
  "Director",
  "Head of Department",
  "Secretary",
  "President",
  "Provost",
  "Board Chair",
];

export default function DiplomaDetailsTab() {
  const form = useDiplomaEditor((s) => s.form);
  const addSignatory = useDiplomaEditor((s) => s.addSignatory);
  const removeSignatory = useDiplomaEditor((s) => s.removeSignatory);
  const updateSignatory = useDiplomaEditor((s) => s.updateSignatory);
  const updateSeal = useDiplomaEditor((s) => s.updateSeal);

  const [openSection, setOpenSection] = useState<string | null>("signatories");

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Signatories ── */}
      <AccordionSection
        title="Signatories"
        icon={icons.signatory}
        isOpen={openSection === "signatories"}
        onToggle={() => setOpenSection(openSection === "signatories" ? null : "signatories")}
        badge={`${form.signatories.length}`}
      >
        <div className="px-4 pb-4 space-y-4">
          {form.signatories.map((sig, idx) => (
            <div
              key={sig.id}
              className="rounded-lg border border-gray-700/40 bg-gray-800/20 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <SectionLabel>Signatory {idx + 1}</SectionLabel>
                {form.signatories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSignatory(sig.id)}
                    className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    aria-label="Remove signatory"
                  >
                    {icons.trash}
                  </button>
                )}
              </div>
              <FormInput
                label="Name"
                value={sig.name}
                onChange={(e) => updateSignatory(sig.id, { name: e.target.value })}
                placeholder="Prof. John Doe"
              />
              <FormInput
                label="Title / Position"
                value={sig.title}
                onChange={(e) => updateSignatory(sig.id, { title: e.target.value })}
                placeholder="Vice Chancellor"
              />
              <FormSelect
                label="Role"
                value={sig.role}
                onChange={(e) => updateSignatory(sig.id, { role: e.target.value })}
              >
                <option value="">Select role...</option>
                {SIGNATORY_ROLES.map((r) => (
                  <option key={r} value={r.toLowerCase()}>
                    {r}
                  </option>
                ))}
                <option value="other">Other</option>
              </FormSelect>
            </div>
          ))}

          {form.signatories.length < 5 && (
            <button
              type="button"
              onClick={() => addSignatory()}
              className="flex items-center gap-2 w-full justify-center py-2 rounded-lg border border-dashed border-gray-600/50 text-sm text-gray-400 hover:text-primary-400 hover:border-primary-500/50 transition-colors"
            >
              {icons.add}
              Add Signatory
            </button>
          )}
        </div>
      </AccordionSection>

      {/* ── Seal / Stamp ── */}
      <AccordionSection
        title="Institutional Seal"
        icon={icons.seal}
        isOpen={openSection === "seal"}
        onToggle={() => setOpenSection(openSection === "seal" ? null : "seal")}
      >
        <div className="px-4 pb-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showSeal}
              onChange={(e) => updateSeal({ showSeal: e.target.checked })}
              className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30"
            />
            Show institutional seal
          </label>

          {form.showSeal && (
            <>
              <FormSelect
                label="Seal Style"
                value={form.sealStyle}
                onChange={(e) => updateSeal({ sealStyle: e.target.value as SealStyle })}
              >
                {SEAL_STYLES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </FormSelect>
              <FormInput
                label="Seal Text"
                value={form.sealText}
                onChange={(e) => updateSeal({ sealText: e.target.value })}
                placeholder="UNIVERSITY SEAL"
              />
            </>
          )}
        </div>
      </AccordionSection>
    </div>
  );
}
