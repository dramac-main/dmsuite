// =============================================================================
// Business Plan Content Tab — Plan type, meta, company info, exec summary
// =============================================================================

"use client";

import { useState } from "react";
import { useBusinessPlanEditor } from "@/stores/business-plan-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  Toggle,
  SIcon,
  SelectionCard,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import { PLAN_TYPE_CONFIGS, PLAN_TYPES } from "@/lib/business-plan/schema";
import type { PlanType } from "@/lib/business-plan/schema";

export default function BusinessPlanContentTab() {
  const store = useBusinessPlanEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    planType: true,
    meta: false,
    company: false,
    execSummary: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const icons = {
    planType: <SIcon d="M13 10V3L4 14h7v7l9-11h-7z" />,
    meta: <SIcon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    company: <SIcon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    execSummary: <SIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  };

  return (
    <div className="space-y-2">
      {/* Plan Type */}
      <AccordionSection
        title="Plan Type"
        icon={icons.planType}
        badge={PLAN_TYPE_CONFIGS[store.form.planType].shortLabel}
        isOpen={open.planType}
        onToggle={() => toggle("planType")}
      >
        <div className="grid grid-cols-2 gap-2">
          {PLAN_TYPES.map((pt) => {
            const cfg = PLAN_TYPE_CONFIGS[pt];
            return (
              <SelectionCard
                key={pt}
                selected={store.form.planType === pt}
                onClick={() => store.setPlanType(pt as PlanType)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 shrink-0"><SIcon d={cfg.icon} /></span>
                  <div>
                    <div className="text-xs font-semibold">{cfg.shortLabel}</div>
                    <div className="text-[10px] text-gray-400 leading-tight">{cfg.description.slice(0, 60)}</div>
                  </div>
                </div>
              </SelectionCard>
            );
          })}
        </div>
      </AccordionSection>

      {/* Meta / Document Info */}
      <AccordionSection
        title="Document Info"
        icon={icons.meta}
        isOpen={open.meta}
        onToggle={() => toggle("meta")}
      >
        <div className="space-y-2">
          <FormInput
            label="Plan Title"
            value={store.form.title}
            onChange={(e) => store.updateMeta({ title: e.target.value })}
            placeholder="Business Plan for Acme Corp"
          />
          <FormInput
            label="Subtitle"
            value={store.form.subtitle}
            onChange={(e) => store.updateMeta({ subtitle: e.target.value })}
            placeholder="Strategic Growth Plan 2025–2028"
          />
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Prepared By"
              value={store.form.preparedBy}
              onChange={(e) => store.updateMeta({ preparedBy: e.target.value })}
              placeholder="Your Name"
            />
            <FormInput
              label="Prepared For"
              value={store.form.preparedFor}
              onChange={(e) => store.updateMeta({ preparedFor: e.target.value })}
              placeholder="Investor / Bank"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Date"
              value={store.form.date}
              onChange={(e) => store.updateMeta({ date: e.target.value })}
              placeholder="2025-01-01"
            />
            <FormInput
              label="Version"
              value={store.form.version}
              onChange={(e) => store.updateMeta({ version: e.target.value })}
              placeholder="1.0"
            />
          </div>
          <Toggle
            label="Confidential"
            description="Mark document as confidential"
            checked={store.form.confidential}
            onChange={(v) => store.updateMeta({ confidential: v })}
          />
        </div>
      </AccordionSection>

      {/* Company Information */}
      <AccordionSection
        title="Company Information"
        icon={icons.company}
        isOpen={open.company}
        onToggle={() => toggle("company")}
      >
        <div className="space-y-2">
          <FormInput
            label="Company Name"
            value={store.form.companyName}
            onChange={(e) => store.updateCompanyInfo({ companyName: e.target.value })}
            placeholder="Acme Corporation"
          />
          <FormInput
            label="Tagline"
            value={store.form.tagline}
            onChange={(e) => store.updateCompanyInfo({ tagline: e.target.value })}
            placeholder="Innovating the future of..."
          />
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Industry"
              value={store.form.industry}
              onChange={(e) => store.updateCompanyInfo({ industry: e.target.value })}
              placeholder="Technology / SaaS"
            />
            <FormInput
              label="Legal Structure"
              value={store.form.legalStructure}
              onChange={(e) => store.updateCompanyInfo({ legalStructure: e.target.value })}
              placeholder="LLC / Corporation"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Location"
              value={store.form.location}
              onChange={(e) => store.updateCompanyInfo({ location: e.target.value })}
              placeholder="Lusaka, Zambia"
            />
            <FormInput
              label="Founded"
              value={store.form.foundedDate}
              onChange={(e) => store.updateCompanyInfo({ foundedDate: e.target.value })}
              placeholder="2023"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Website"
              value={store.form.website}
              onChange={(e) => store.updateCompanyInfo({ website: e.target.value })}
              placeholder="https://example.com"
            />
            <FormInput
              label="Email"
              value={store.form.email}
              onChange={(e) => store.updateCompanyInfo({ email: e.target.value })}
              placeholder="contact@example.com"
            />
          </div>
          <FormInput
            label="Phone"
            value={store.form.phone}
            onChange={(e) => store.updateCompanyInfo({ phone: e.target.value })}
            placeholder="+260 97 1234567"
          />
          <FormTextarea
            label="Mission Statement"
            value={store.form.mission}
            onChange={(e) => store.updateCompanyInfo({ mission: e.target.value })}
            placeholder="Our mission is to..."
            rows={3}
          />
          <FormTextarea
            label="Vision"
            value={store.form.vision}
            onChange={(e) => store.updateCompanyInfo({ vision: e.target.value })}
            placeholder="Our vision is to become..."
            rows={3}
          />
        </div>
      </AccordionSection>

      {/* Executive Summary */}
      <AccordionSection
        title="Executive Summary"
        icon={icons.execSummary}
        isOpen={open.execSummary}
        onToggle={() => toggle("execSummary")}
      >
        <div className="space-y-2">
          <FormTextarea
            label="Overview"
            value={store.form.executiveSummary.overview}
            onChange={(e) => store.updateExecSummary({ overview: e.target.value })}
            placeholder="High-level overview of your business and its key value proposition..."
            rows={4}
          />
          <FormTextarea
            label="Problem"
            value={store.form.executiveSummary.problem}
            onChange={(e) => store.updateExecSummary({ problem: e.target.value })}
            placeholder="What problem does your business solve?"
            rows={3}
          />
          <FormTextarea
            label="Solution"
            value={store.form.executiveSummary.solution}
            onChange={(e) => store.updateExecSummary({ solution: e.target.value })}
            placeholder="How does your product or service solve this problem?"
            rows={3}
          />
          <FormTextarea
            label="Target Market"
            value={store.form.executiveSummary.targetMarket}
            onChange={(e) => store.updateExecSummary({ targetMarket: e.target.value })}
            placeholder="Who are your ideal customers?"
            rows={2}
          />
          <FormTextarea
            label="Competitive Advantage"
            value={store.form.executiveSummary.competitiveAdvantage}
            onChange={(e) => store.updateExecSummary({ competitiveAdvantage: e.target.value })}
            placeholder="What makes you different from competitors?"
            rows={2}
          />
          <FormTextarea
            label="Financial Highlights"
            value={store.form.executiveSummary.financialHighlights}
            onChange={(e) => store.updateExecSummary({ financialHighlights: e.target.value })}
            placeholder="Key financial metrics and projections..."
            rows={2}
          />
          <FormTextarea
            label="Funding Required"
            value={store.form.executiveSummary.fundingNeeded}
            onChange={(e) => store.updateExecSummary({ fundingNeeded: e.target.value })}
            placeholder="How much funding do you need and why?"
            rows={2}
          />
        </div>
      </AccordionSection>
    </div>
  );
}
