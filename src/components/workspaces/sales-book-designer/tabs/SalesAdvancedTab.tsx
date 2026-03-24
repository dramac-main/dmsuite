// =============================================================================
// DMSuite — Sales Advanced Tab (More)
// Custom blocks (DnD), brand/supplier logos
// Wraps the existing SBSectionCustomBlocks and SBSectionBrandLogos
// with proper SectionCard grouping
// =============================================================================

"use client";

import { SectionCard } from "../SalesUIKit";
import SBSectionCustomBlocks from "../SBSectionCustomBlocks";
import SBSectionBrandLogos from "../SBSectionBrandLogos";

export default function SalesAdvancedTab() {
  return (
    <div className="space-y-5 p-4">
      {/* ── Custom Blocks ── */}
      <SectionCard title="Custom Blocks" description="Add QR codes, text, dividers, images and more">
        <SBSectionCustomBlocks />
      </SectionCard>

      {/* ── Brand / Supplier Logos ── */}
      <SectionCard title="Brand & Supplier Logos" description="Show partner logos on printed forms">
        <SBSectionBrandLogos />
      </SectionCard>
    </div>
  );
}
