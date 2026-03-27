// =============================================================================
// DMSuite — Menu Designer: Content Tab
// Restaurant info, header/footer notes, currency, and menu type selection.
// =============================================================================

"use client";

import { useState } from "react";
import {
  useMenuDesignerEditor,
  MENU_TYPES,
  CURRENCIES,
  type MenuType,
  type CurrencyConfig,
} from "@/stores/menu-designer-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  FormSelect,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ━━━ Icons ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const icons = {
  restaurant: <SIcon d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />,
  type: <SIcon d="M4 7h16M4 12h16M4 17h7" />,
  currency: <SIcon d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
  notes: <SIcon d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />,
};

// ━━━ Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function MenuDesignerContentTab() {
  const form = useMenuDesignerEditor((s) => s.form);
  const setMenuType = useMenuDesignerEditor((s) => s.setMenuType);
  const updateHeader = useMenuDesignerEditor((s) => s.updateHeader);
  const setCurrency = useMenuDesignerEditor((s) => s.setCurrency);

  const [openSection, setOpenSection] = useState<string | null>("restaurant");

  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  return (
    <div className="divide-y divide-gray-800/30">
      {/* ── Menu Type ── */}
      <AccordionSection
        title="Menu Type"
        icon={icons.type}
        isOpen={openSection === "type"}
        onToggle={() => toggle("type")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormSelect
            label="Type"
            value={form.menuType}
            onChange={(e) => setMenuType(e.target.value as MenuType)}
          >
            {MENU_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </FormSelect>
        </div>
      </AccordionSection>

      {/* ── Restaurant Info ── */}
      <AccordionSection
        title="Restaurant Info"
        icon={icons.restaurant}
        isOpen={openSection === "restaurant"}
        onToggle={() => toggle("restaurant")}
        badge={form.restaurantName ? "✓" : undefined}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormInput
            label="Restaurant / Venue Name"
            value={form.restaurantName}
            onChange={(e) => updateHeader({ restaurantName: e.target.value })}
            placeholder="The Lusaka Kitchen"
          />
          <FormInput
            label="Tagline"
            value={form.tagline}
            onChange={(e) => updateHeader({ tagline: e.target.value })}
            placeholder="A Taste of Zambia"
          />
        </div>
      </AccordionSection>

      {/* ── Currency ── */}
      <AccordionSection
        title="Currency"
        icon={icons.currency}
        isOpen={openSection === "currency"}
        onToggle={() => toggle("currency")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormSelect
            label="Currency"
            value={form.currency.code}
            onChange={(e) => {
              const c = CURRENCIES.find((cur) => cur.code === e.target.value);
              if (c) setCurrency(c);
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} — {c.code}
              </option>
            ))}
          </FormSelect>
          <div className="text-[10px] text-gray-600">
            Preview: {form.currency.position === "before" ? `${form.currency.symbol}${form.currency.separator}100` : `100${form.currency.separator}${form.currency.symbol}`}
          </div>
        </div>
      </AccordionSection>

      {/* ── Header & Footer Notes ── */}
      <AccordionSection
        title="Header & Footer Notes"
        icon={icons.notes}
        isOpen={openSection === "notes"}
        onToggle={() => toggle("notes")}
      >
        <div className="px-4 pb-4 space-y-3">
          <FormTextarea
            label="Header Note"
            value={form.headerNote}
            onChange={(e) => updateHeader({ headerNote: e.target.value })}
            placeholder="Optional note below tagline (e.g. hours, special occasion)"
            rows={2}
          />
          <FormTextarea
            label="Footer Note"
            value={form.footerNote}
            onChange={(e) => updateHeader({ footerNote: e.target.value })}
            placeholder="Please inform our staff of any allergies or dietary requirements."
            rows={2}
          />
        </div>
      </AccordionSection>
    </div>
  );
}
