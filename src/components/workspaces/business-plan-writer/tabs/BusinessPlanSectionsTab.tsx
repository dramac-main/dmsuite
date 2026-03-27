// =============================================================================
// Business Plan Sections Tab — Market, Competition, Products, Marketing, Ops, Team
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useBusinessPlanEditor } from "@/stores/business-plan-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  Toggle,
  SIcon,
  IconButton,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import { SECTION_CONFIGS } from "@/lib/business-plan/schema";
import type { SwotAnalysis } from "@/lib/business-plan/schema";

export default function BusinessPlanSectionsTab() {
  const store = useBusinessPlanEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    sectionToggles: true,
    market: false,
    competition: false,
    products: false,
    marketing: false,
    operations: false,
    team: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const icons = {
    sections: <SIcon d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    market: <SIcon d={SECTION_CONFIGS["market-analysis"].icon} />,
    competition: <SIcon d={SECTION_CONFIGS["competitive-analysis"].icon} />,
    products: <SIcon d={SECTION_CONFIGS["products-services"].icon} />,
    marketing: <SIcon d={SECTION_CONFIGS["marketing-strategy"].icon} />,
    operations: <SIcon d={SECTION_CONFIGS["operations-plan"].icon} />,
    team: <SIcon d={SECTION_CONFIGS["management-team"].icon} />,
  };

  const handleAddSwotItem = useCallback(
    (quad: keyof SwotAnalysis) => {
      const uid = Math.random().toString(36).slice(2, 10);
      const updated: SwotAnalysis = {
        ...store.form.swot,
        [quad]: [...store.form.swot[quad], { id: uid, text: "" }],
      };
      store.updateSwot(updated);
    },
    [store],
  );

  const handleRemoveSwotItem = useCallback(
    (quad: keyof SwotAnalysis, id: string) => {
      if (store.form.swot[quad].length <= 1) return;
      const updated: SwotAnalysis = {
        ...store.form.swot,
        [quad]: store.form.swot[quad].filter((i) => i.id !== id),
      };
      store.updateSwot(updated);
    },
    [store],
  );

  const handleSwotTextChange = useCallback(
    (quad: keyof SwotAnalysis, itemId: string, text: string) => {
      const updated: SwotAnalysis = {
        ...store.form.swot,
        [quad]: store.form.swot[quad].map((it) =>
          it.id === itemId ? { ...it, text } : it,
        ),
      };
      store.updateSwot(updated);
    },
    [store],
  );

  const enabledCount = store.form.sections.filter((s) => s.enabled).length;

  return (
    <div className="space-y-2">
      {/* Section Toggles */}
      <AccordionSection
        title="Active Sections"
        icon={icons.sections}
        badge={`${enabledCount}/12`}
        isOpen={open.sectionToggles}
        onToggle={() => toggle("sectionToggles")}
      >
        <div className="space-y-1">
          {store.form.sections.map((s) => {
            const cfg = SECTION_CONFIGS[s.key];
            return (
              <div key={s.key} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-gray-800/50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3.5 h-3.5 text-gray-400 shrink-0"><SIcon d={cfg.icon} /></span>
                  <span className="text-xs text-gray-300 truncate">{cfg.label}</span>
                </div>
                <Toggle
                  checked={s.enabled}
                  onChange={() => store.toggleSection(s.key)}
                  label=""
                />
              </div>
            );
          })}
        </div>
      </AccordionSection>

      {/* Market Analysis */}
      <AccordionSection
        title="Market Analysis"
        icon={icons.market}
        isOpen={open.market}
        onToggle={() => toggle("market")}
      >
        <div className="space-y-2">
          <FormTextarea
            label="Industry Overview"
            value={store.form.marketAnalysis.industryOverview}
            onChange={(e) => store.updateMarketAnalysis({ industryOverview: e.target.value })}
            placeholder="Describe the industry landscape..."
            rows={3}
          />
          <FormTextarea
            label="Target Market"
            value={store.form.marketAnalysis.targetMarket}
            onChange={(e) => store.updateMarketAnalysis({ targetMarket: e.target.value })}
            placeholder="Who is your ideal customer?"
            rows={3}
          />
          <div className="grid grid-cols-3 gap-2">
            <FormInput
              label="TAM"
              value={store.form.marketAnalysis.tam}
              onChange={(e) => store.updateMarketAnalysis({ tam: e.target.value })}
              placeholder="$10B"
            />
            <FormInput
              label="SAM"
              value={store.form.marketAnalysis.sam}
              onChange={(e) => store.updateMarketAnalysis({ sam: e.target.value })}
              placeholder="$2B"
            />
            <FormInput
              label="SOM"
              value={store.form.marketAnalysis.som}
              onChange={(e) => store.updateMarketAnalysis({ som: e.target.value })}
              placeholder="$200M"
            />
          </div>
          <FormTextarea
            label="Market Size"
            value={store.form.marketAnalysis.marketSize}
            onChange={(e) => store.updateMarketAnalysis({ marketSize: e.target.value })}
            placeholder="Overall market size and growth rate..."
            rows={2}
          />
          <FormTextarea
            label="Market Trends"
            value={store.form.marketAnalysis.marketTrends}
            onChange={(e) => store.updateMarketAnalysis({ marketTrends: e.target.value })}
            placeholder="Key trends shaping your market..."
            rows={2}
          />
          <FormTextarea
            label="Customer Segments"
            value={store.form.marketAnalysis.customerSegments}
            onChange={(e) => store.updateMarketAnalysis({ customerSegments: e.target.value })}
            placeholder="Primary, secondary, and niche segments..."
            rows={2}
          />
        </div>
      </AccordionSection>

      {/* Competitive Analysis & SWOT */}
      <AccordionSection
        title="Competition & SWOT"
        icon={icons.competition}
        badge={`${store.form.competitors.filter((c) => c.name).length} competitors`}
        isOpen={open.competition}
        onToggle={() => toggle("competition")}
      >
        <div className="space-y-3">
          {/* Competitors */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Competitors</span>
              <IconButton
                icon={<SIcon d="M12 4v16m8-8H4" />}
                onClick={store.addCompetitor}
                title="Add competitor"
              />
            </div>
            {store.form.competitors.map((comp, i) => (
              <div key={comp.id} className="relative p-2 rounded-lg border border-gray-700/50 bg-gray-800/30 space-y-1.5">
                {store.form.competitors.length > 1 && (
                  <button
                    onClick={() => store.removeCompetitor(comp.id)}
                    className="absolute top-1.5 right-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <span className="w-3.5 h-3.5 block"><SIcon d="M6 18L18 6M6 6l12 12" /></span>
                  </button>
                )}
                <FormInput
                  label={`Competitor ${i + 1}`}
                  value={comp.name}
                  onChange={(e) => store.updateCompetitor(comp.id, { name: e.target.value })}
                  placeholder="Competitor name"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <FormInput
                    label="Strengths"
                    value={comp.strengths}
                    onChange={(e) => store.updateCompetitor(comp.id, { strengths: e.target.value })}
                    placeholder="Their strengths"
                  />
                  <FormInput
                    label="Weaknesses"
                    value={comp.weaknesses}
                    onChange={(e) => store.updateCompetitor(comp.id, { weaknesses: e.target.value })}
                    placeholder="Their weaknesses"
                  />
                </div>
                <FormInput
                  label="Market Share"
                  value={comp.marketShare}
                  onChange={(e) => store.updateCompetitor(comp.id, { marketShare: e.target.value })}
                  placeholder="~15%"
                />
              </div>
            ))}
          </div>

          {/* SWOT */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-300">SWOT Analysis</span>
            {(["strengths", "weaknesses", "opportunities", "threats"] as const).map((quad) => (
              <div key={quad} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{quad}</span>
                  <IconButton
                    icon={<SIcon d="M12 4v16m8-8H4" />}
                    onClick={() => handleAddSwotItem(quad)}
                    title={`Add ${quad} item`}
                  />
                </div>
                {store.form.swot[quad].map((item) => (
                  <div key={item.id} className="flex items-center gap-1">
                    <FormInput
                      value={item.text}
                      onChange={(e) => handleSwotTextChange(quad, item.id, e.target.value)}
                      placeholder={`Enter ${quad.slice(0, -1)}...`}
                    />
                    {store.form.swot[quad].length > 1 && (
                      <button
                        onClick={() => handleRemoveSwotItem(quad, item.id)}
                        className="text-gray-500 hover:text-red-400 shrink-0"
                        title="Remove"
                      >
                        <span className="w-3 h-3 block"><SIcon d="M6 18L18 6M6 6l12 12" /></span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <FormTextarea
            label="Competitive Advantage"
            value={store.form.competitiveAdvantage}
            onChange={(e) => store.setCompetitiveAdvantage(e.target.value)}
            placeholder="What makes you uniquely positioned to win?"
            rows={3}
          />
        </div>
      </AccordionSection>

      {/* Products & Services */}
      <AccordionSection
        title="Products & Services"
        icon={icons.products}
        isOpen={open.products}
        onToggle={() => toggle("products")}
      >
        <div className="space-y-2">
          <FormTextarea
            label="Overview"
            value={store.form.productsServices.overview}
            onChange={(e) => store.updateProductsServices({ overview: e.target.value })}
            placeholder="Describe your products or services..."
            rows={3}
          />
          <FormTextarea
            label="Value Proposition"
            value={store.form.productsServices.valueProposition}
            onChange={(e) => store.updateProductsServices({ valueProposition: e.target.value })}
            placeholder="What unique value do you offer?"
            rows={3}
          />
          <FormTextarea
            label="Pricing Strategy"
            value={store.form.productsServices.pricingStrategy}
            onChange={(e) => store.updateProductsServices({ pricingStrategy: e.target.value })}
            placeholder="How will you price your offering?"
            rows={2}
          />
          <FormTextarea
            label="Intellectual Property"
            value={store.form.productsServices.intellectualProperty}
            onChange={(e) => store.updateProductsServices({ intellectualProperty: e.target.value })}
            placeholder="Patents, trademarks, trade secrets..."
            rows={2}
          />
          <FormTextarea
            label="Product Roadmap"
            value={store.form.productsServices.roadmap}
            onChange={(e) => store.updateProductsServices({ roadmap: e.target.value })}
            placeholder="Key milestones and future product development..."
            rows={2}
          />
        </div>
      </AccordionSection>

      {/* Marketing Strategy */}
      <AccordionSection
        title="Marketing Strategy"
        icon={icons.marketing}
        isOpen={open.marketing}
        onToggle={() => toggle("marketing")}
      >
        <div className="space-y-2">
          <FormTextarea
            label="Overview"
            value={store.form.marketingStrategy.overview}
            onChange={(e) => store.updateMarketingStrategy({ overview: e.target.value })}
            placeholder="High-level marketing approach..."
            rows={3}
          />
          <FormTextarea
            label="Marketing Channels"
            value={store.form.marketingStrategy.channels}
            onChange={(e) => store.updateMarketingStrategy({ channels: e.target.value })}
            placeholder="Digital, social media, SEO, events..."
            rows={2}
          />
          <FormTextarea
            label="Sales Strategy"
            value={store.form.marketingStrategy.salesStrategy}
            onChange={(e) => store.updateMarketingStrategy({ salesStrategy: e.target.value })}
            placeholder="Direct sales, partnerships, enterprise..."
            rows={2}
          />
          <FormTextarea
            label="Strategic Partnerships"
            value={store.form.marketingStrategy.partnerships}
            onChange={(e) => store.updateMarketingStrategy({ partnerships: e.target.value })}
            placeholder="Key partnerships and alliances..."
            rows={2}
          />
          <FormTextarea
            label="Customer Retention"
            value={store.form.marketingStrategy.customerRetention}
            onChange={(e) => store.updateMarketingStrategy({ customerRetention: e.target.value })}
            placeholder="How will you keep customers coming back?"
            rows={2}
          />
        </div>
      </AccordionSection>

      {/* Operations Plan */}
      <AccordionSection
        title="Operations Plan"
        icon={icons.operations}
        isOpen={open.operations}
        onToggle={() => toggle("operations")}
      >
        <div className="space-y-2">
          <FormTextarea
            label="Overview"
            value={store.form.operationsPlan.overview}
            onChange={(e) => store.updateOperationsPlan({ overview: e.target.value })}
            placeholder="Day-to-day operations overview..."
            rows={3}
          />
          <FormTextarea
            label="Facilities"
            value={store.form.operationsPlan.facilities}
            onChange={(e) => store.updateOperationsPlan({ facilities: e.target.value })}
            placeholder="Office, warehouse, manufacturing..."
            rows={2}
          />
          <FormTextarea
            label="Technology"
            value={store.form.operationsPlan.technology}
            onChange={(e) => store.updateOperationsPlan({ technology: e.target.value })}
            placeholder="Tech stack, tools, and infrastructure..."
            rows={2}
          />
          <FormTextarea
            label="Supply Chain"
            value={store.form.operationsPlan.supplyChain}
            onChange={(e) => store.updateOperationsPlan({ supplyChain: e.target.value })}
            placeholder="Suppliers, logistics, and distribution..."
            rows={2}
          />
          <FormTextarea
            label="Key Milestones"
            value={store.form.operationsPlan.milestones}
            onChange={(e) => store.updateOperationsPlan({ milestones: e.target.value })}
            placeholder="Timeline of major operational milestones..."
            rows={2}
          />
        </div>
      </AccordionSection>

      {/* Management Team */}
      <AccordionSection
        title="Team & Leadership"
        icon={icons.team}
        badge={`${store.form.teamMembers.filter((m) => m.name).length} members`}
        isOpen={open.team}
        onToggle={() => toggle("team")}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-gray-300">Team Members</span>
            <IconButton
              icon={<SIcon d="M12 4v16m8-8H4" />}
              onClick={store.addTeamMember}
              title="Add team member"
            />
          </div>
          {store.form.teamMembers.map((m) => (
            <div key={m.id} className="relative p-2 rounded-lg border border-gray-700/50 bg-gray-800/30 space-y-1.5">
              {store.form.teamMembers.length > 1 && (
                <button
                  onClick={() => store.removeTeamMember(m.id)}
                  className="absolute top-1.5 right-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <span className="w-3.5 h-3.5 block"><SIcon d="M6 18L18 6M6 6l12 12" /></span>
                </button>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                <FormInput
                  label="Name"
                  value={m.name}
                  onChange={(e) => store.updateTeamMember(m.id, { name: e.target.value })}
                  placeholder="John Doe"
                />
                <FormInput
                  label="Role"
                  value={m.role}
                  onChange={(e) => store.updateTeamMember(m.id, { role: e.target.value })}
                  placeholder="CEO / CTO"
                />
              </div>
              <FormTextarea
                label="Bio"
                value={m.bio}
                onChange={(e) => store.updateTeamMember(m.id, { bio: e.target.value })}
                placeholder="Brief background and expertise..."
                rows={2}
              />
              <FormInput
                label="LinkedIn"
                value={m.linkedin}
                onChange={(e) => store.updateTeamMember(m.id, { linkedin: e.target.value })}
                placeholder="linkedin.com/in/..."
              />
            </div>
          ))}

          <FormTextarea
            label="Advisory Board"
            value={store.form.advisors}
            onChange={(e) => store.setAdvisors(e.target.value)}
            placeholder="List key advisors and their expertise..."
            rows={3}
          />
          <FormTextarea
            label="Organizational Structure"
            value={store.form.organizationalStructure}
            onChange={(e) => store.setOrgStructure(e.target.value)}
            placeholder="Describe your organization chart and reporting lines..."
            rows={3}
          />
        </div>
      </AccordionSection>
    </div>
  );
}
