// =============================================================================
// DMSuite — Contract Parties Tab
// Party A & Party B details editor with role labels.
// =============================================================================

"use client";

import React, { useState } from "react";
import { useContractEditor } from "@/stores/contract-editor";
import { CONTRACT_TYPE_CONFIGS } from "@/lib/contract/schema";
import {
  AccordionSection,
  FormInput,
  AdvancedToggle,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

const icons = {
  partyA: <SIcon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  partyB: <SIcon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
};

function PartyFields({
  party,
  onUpdate,
  roleLabel,
}: {
  party: { role: string; name: string; address: string; city: string; country: string; representative: string; representativeTitle: string; phone: string; email: string; taxId: string; registrationNumber: string };
  onUpdate: (patch: Record<string, string>) => void;
  roleLabel: string;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-3">
      <FormInput
        label={`${roleLabel} Name`}
        value={party.name}
        onChange={(e) => onUpdate({ name: e.target.value })}
        placeholder="e.g. DMSuite Solutions Ltd"
      />
      <FormInput
        label="Address"
        value={party.address}
        onChange={(e) => onUpdate({ address: e.target.value })}
        placeholder="e.g. Plot 123, Cairo Road"
      />
      <div className="grid grid-cols-2 gap-2">
        <FormInput
          label="City"
          value={party.city}
          onChange={(e) => onUpdate({ city: e.target.value })}
          placeholder="Lusaka"
        />
        <FormInput
          label="Country"
          value={party.country}
          onChange={(e) => onUpdate({ country: e.target.value })}
          placeholder="Zambia"
        />
      </div>
      <FormInput
        label="Representative"
        value={party.representative}
        onChange={(e) => onUpdate({ representative: e.target.value })}
        placeholder="e.g. John Banda"
      />
      <FormInput
        label="Representative Title"
        value={party.representativeTitle}
        onChange={(e) => onUpdate({ representativeTitle: e.target.value })}
        placeholder="e.g. Managing Director"
      />

      <AdvancedToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} label="Contact & Registration" />
      {showAdvanced && (
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Phone"
              value={party.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder="+260..."
            />
            <FormInput
              label="Email"
              value={party.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="info@company.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Tax PIN / TPIN"
              value={party.taxId}
              onChange={(e) => onUpdate({ taxId: e.target.value })}
              placeholder="1234567890"
            />
            <FormInput
              label="Registration No."
              value={party.registrationNumber}
              onChange={(e) => onUpdate({ registrationNumber: e.target.value })}
              placeholder="PACRA No."
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContractPartiesTab() {
  const form = useContractEditor((s) => s.form);
  const updatePartyA = useContractEditor((s) => s.updatePartyA);
  const updatePartyB = useContractEditor((s) => s.updatePartyB);
  const config = CONTRACT_TYPE_CONFIGS[form.contractType];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    partyA: true,
    partyB: true,
  });

  const toggle = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div>
      <AccordionSection
        title={form.partyA.role || config.partyARole}
        icon={icons.partyA}
        isOpen={openSections.partyA}
        onToggle={() => toggle("partyA")}
        badge={form.partyA.name ? form.partyA.name.slice(0, 16) : undefined}
      >
        <PartyFields
          party={form.partyA}
          onUpdate={updatePartyA}
          roleLabel={form.partyA.role || config.partyARole}
        />
      </AccordionSection>

      <AccordionSection
        title={form.partyB.role || config.partyBRole}
        icon={icons.partyB}
        isOpen={openSections.partyB}
        onToggle={() => toggle("partyB")}
        badge={form.partyB.name ? form.partyB.name.slice(0, 16) : undefined}
      >
        <PartyFields
          party={form.partyB}
          onUpdate={updatePartyB}
          roleLabel={form.partyB.role || config.partyBRole}
        />
      </AccordionSection>
    </div>
  );
}
