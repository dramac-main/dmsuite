// =============================================================================
// DMSuite — Business Plan Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo of business plan data.
// Follows the exact same architecture as contract-editor.ts.
// =============================================================================

"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";
import type {
  BusinessPlanFormData,
  PlanType,
  StyleConfig,
  PrintConfig,
  SwotAnalysis,
  TeamMember,
  FinancialYear,
  FundingSource,
  UseOfFunds,
  Competitor,
  SectionKey,
} from "@/lib/business-plan/schema";
import {
  createDefaultBusinessPlanForm,
  createDefaultSections,
  getBusinessPlanTemplate,
} from "@/lib/business-plan/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// State Interface
// ---------------------------------------------------------------------------

export interface BusinessPlanEditorState {
  form: BusinessPlanFormData;

  // Accent color lock
  accentColorLocked: boolean;
  setAccentColorLocked: (locked: boolean) => void;

  // Plan type
  setPlanType: (type: PlanType) => void;

  // Top-level
  setForm: (form: BusinessPlanFormData) => void;
  resetForm: (planType?: PlanType) => void;

  // Metadata
  updateMeta: (patch: Partial<Pick<BusinessPlanFormData,
    "title" | "subtitle" | "preparedFor" | "preparedBy" | "date" | "version" | "confidential"
  >>) => void;

  // Company info
  updateCompanyInfo: (patch: Partial<Pick<BusinessPlanFormData,
    "companyName" | "tagline" | "industry" | "foundedDate" | "legalStructure" |
    "location" | "website" | "email" | "phone" | "mission" | "vision"
  >>) => void;

  // Sections toggle
  toggleSection: (key: SectionKey) => void;
  updateSectionContent: (key: SectionKey, content: string) => void;

  // Executive summary
  updateExecSummary: (patch: Partial<BusinessPlanFormData["executiveSummary"]>) => void;

  // Market analysis
  updateMarketAnalysis: (patch: Partial<BusinessPlanFormData["marketAnalysis"]>) => void;

  // Competitive analysis
  updateCompetitor: (id: string, patch: Partial<Competitor>) => void;
  addCompetitor: () => string;
  removeCompetitor: (id: string) => void;
  updateSwot: (swot: SwotAnalysis) => void;
  setCompetitiveAdvantage: (text: string) => void;

  // Products & Services
  updateProductsServices: (patch: Partial<BusinessPlanFormData["productsServices"]>) => void;

  // Marketing Strategy
  updateMarketingStrategy: (patch: Partial<BusinessPlanFormData["marketingStrategy"]>) => void;

  // Operations
  updateOperationsPlan: (patch: Partial<BusinessPlanFormData["operationsPlan"]>) => void;

  // Team
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void;
  addTeamMember: () => string;
  removeTeamMember: (id: string) => void;
  setAdvisors: (text: string) => void;
  setOrgStructure: (text: string) => void;

  // Financial projections
  updateFinancialYear: (id: string, patch: Partial<FinancialYear>) => void;
  addFinancialYear: () => string;
  removeFinancialYear: (id: string) => void;
  setRevenueModel: (text: string) => void;
  setBreakEvenAnalysis: (text: string) => void;
  setKeyAssumptions: (text: string) => void;
  setCurrency: (currency: string) => void;

  // Funding
  setTotalFundingNeeded: (amount: string) => void;
  updateFundingSource: (id: string, patch: Partial<FundingSource>) => void;
  addFundingSource: () => string;
  removeFundingSource: (id: string) => void;
  updateUseOfFunds: (id: string, patch: Partial<UseOfFunds>) => void;
  addUseOfFunds: () => string;
  removeUseOfFunds: (id: string) => void;
  setExitStrategy: (text: string) => void;
  setInvestorReturns: (text: string) => void;

  // Appendix
  setAppendixNotes: (text: string) => void;

  // Style
  updateStyle: (patch: Partial<StyleConfig>) => void;
  setTemplate: (template: string) => void;
  setAccentColor: (color: string) => void;

  // Print
  updatePrint: (patch: Partial<PrintConfig>) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useBusinessPlanEditor = create<BusinessPlanEditorState>()(
  temporal(
    persist(
      immer<BusinessPlanEditorState>((set) => ({
        form: createDefaultBusinessPlanForm(),
        accentColorLocked: false,

        setAccentColorLocked: (locked) => set((s) => { s.accentColorLocked = locked; }),

        // ── Plan Type ──
        setPlanType: (type) =>
          set((s) => {
            s.form.planType = type;
            s.form.sections = createDefaultSections(type);
            s.accentColorLocked = false;
          }),

        // ── Top-level ──
        setForm: (form) =>
          set((s) => {
            s.form = form;
          }),

        resetForm: (planType) =>
          set((s) => {
            s.form = createDefaultBusinessPlanForm(planType ?? s.form.planType);
            s.accentColorLocked = false;
          }),

        // ── Metadata ──
        updateMeta: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        // ── Company Info ──
        updateCompanyInfo: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        // ── Sections ──
        toggleSection: (key) =>
          set((s) => {
            const section = s.form.sections.find((sec) => sec.key === key);
            if (section) section.enabled = !section.enabled;
          }),

        updateSectionContent: (key, content) =>
          set((s) => {
            const section = s.form.sections.find((sec) => sec.key === key);
            if (section) section.content = content;
          }),

        // ── Executive Summary ──
        updateExecSummary: (patch) =>
          set((s) => {
            Object.assign(s.form.executiveSummary, patch);
          }),

        // ── Market Analysis ──
        updateMarketAnalysis: (patch) =>
          set((s) => {
            Object.assign(s.form.marketAnalysis, patch);
          }),

        // ── Competitive Analysis ──
        updateCompetitor: (id, patch) =>
          set((s) => {
            const comp = s.form.competitors.find((c) => c.id === id);
            if (comp) Object.assign(comp, patch);
          }),

        addCompetitor: () => {
          const newId = uid();
          set((s) => {
            s.form.competitors.push({ id: newId, name: "", strengths: "", weaknesses: "", marketShare: "" });
          });
          return newId;
        },

        removeCompetitor: (id) =>
          set((s) => {
            s.form.competitors = s.form.competitors.filter((c) => c.id !== id);
          }),

        updateSwot: (swot) =>
          set((s) => {
            s.form.swot = swot;
          }),

        setCompetitiveAdvantage: (text) =>
          set((s) => {
            s.form.competitiveAdvantage = text;
          }),

        // ── Products & Services ──
        updateProductsServices: (patch) =>
          set((s) => {
            Object.assign(s.form.productsServices, patch);
          }),

        // ── Marketing Strategy ──
        updateMarketingStrategy: (patch) =>
          set((s) => {
            Object.assign(s.form.marketingStrategy, patch);
          }),

        // ── Operations ──
        updateOperationsPlan: (patch) =>
          set((s) => {
            Object.assign(s.form.operationsPlan, patch);
          }),

        // ── Team ──
        updateTeamMember: (id, patch) =>
          set((s) => {
            const member = s.form.teamMembers.find((m) => m.id === id);
            if (member) Object.assign(member, patch);
          }),

        addTeamMember: () => {
          const newId = uid();
          set((s) => {
            s.form.teamMembers.push({ id: newId, name: "", role: "", bio: "", linkedin: "" });
          });
          return newId;
        },

        removeTeamMember: (id) =>
          set((s) => {
            s.form.teamMembers = s.form.teamMembers.filter((m) => m.id !== id);
          }),

        setAdvisors: (text) =>
          set((s) => { s.form.advisors = text; }),

        setOrgStructure: (text) =>
          set((s) => { s.form.organizationalStructure = text; }),

        // ── Financial Projections ──
        updateFinancialYear: (id, patch) =>
          set((s) => {
            const year = s.form.financialProjections.find((y) => y.id === id);
            if (year) Object.assign(year, patch);
          }),

        addFinancialYear: () => {
          const newId = uid();
          set((s) => {
            const lastYear = s.form.financialProjections[s.form.financialProjections.length - 1];
            const nextYear = lastYear ? `${parseInt(lastYear.year) + 1}` : `${new Date().getFullYear()}`;
            s.form.financialProjections.push({
              id: newId, year: nextYear, revenue: "", cogs: "", operatingExpenses: "", netIncome: "",
            });
          });
          return newId;
        },

        removeFinancialYear: (id) =>
          set((s) => {
            s.form.financialProjections = s.form.financialProjections.filter((y) => y.id !== id);
          }),

        setRevenueModel: (text) =>
          set((s) => { s.form.revenueModel = text; }),

        setBreakEvenAnalysis: (text) =>
          set((s) => { s.form.breakEvenAnalysis = text; }),

        setKeyAssumptions: (text) =>
          set((s) => { s.form.keyAssumptions = text; }),

        setCurrency: (currency) =>
          set((s) => { s.form.currency = currency; }),

        // ── Funding ──
        setTotalFundingNeeded: (amount) =>
          set((s) => { s.form.totalFundingNeeded = amount; }),

        updateFundingSource: (id, patch) =>
          set((s) => {
            const src = s.form.fundingSources.find((f) => f.id === id);
            if (src) Object.assign(src, patch);
          }),

        addFundingSource: () => {
          const newId = uid();
          set((s) => {
            s.form.fundingSources.push({ id: newId, source: "", amount: "", terms: "" });
          });
          return newId;
        },

        removeFundingSource: (id) =>
          set((s) => {
            s.form.fundingSources = s.form.fundingSources.filter((f) => f.id !== id);
          }),

        updateUseOfFunds: (id, patch) =>
          set((s) => {
            const item = s.form.useOfFunds.find((u) => u.id === id);
            if (item) Object.assign(item, patch);
          }),

        addUseOfFunds: () => {
          const newId = uid();
          set((s) => {
            s.form.useOfFunds.push({ id: newId, category: "", amount: "", percentage: "" });
          });
          return newId;
        },

        removeUseOfFunds: (id) =>
          set((s) => {
            s.form.useOfFunds = s.form.useOfFunds.filter((u) => u.id !== id);
          }),

        setExitStrategy: (text) =>
          set((s) => { s.form.exitStrategy = text; }),

        setInvestorReturns: (text) =>
          set((s) => { s.form.investorReturns = text; }),

        // ── Appendix ──
        setAppendixNotes: (text) =>
          set((s) => { s.form.appendixNotes = text; }),

        // ── Style ──
        updateStyle: (patch) =>
          set((s) => {
            if (patch.accentColor) s.accentColorLocked = true;
            if (patch.template && !s.accentColorLocked) {
              const tpl = getBusinessPlanTemplate(patch.template);
              patch.accentColor = tpl.accent;
              patch.headerStyle = tpl.headerStyle;
              patch.coverStyle = tpl.coverStyle;
            }
            Object.assign(s.form.style, patch);
          }),

        setTemplate: (template) =>
          set((s) => {
            const tpl = getBusinessPlanTemplate(template);
            s.form.style.template = template;
            if (!s.accentColorLocked) {
              s.form.style.accentColor = tpl.accent;
            }
            s.form.style.headerStyle = tpl.headerStyle;
            s.form.style.coverStyle = tpl.coverStyle;
          }),

        setAccentColor: (color) =>
          set((s) => {
            s.form.style.accentColor = color;
            s.accentColorLocked = true;
          }),

        // ── Print ──
        updatePrint: (patch) =>
          set((s) => {
            Object.assign(s.form.printConfig, patch);
          }),
      })),
      {
        name: "dmsuite-business-plan",
        version: 1,
      },
    ),
    {
      partialize: (state) => ({ form: state.form }),
      equality: (a, b) => equal(a, b),
      limit: 50,
    },
  ),
);

// ---------------------------------------------------------------------------
// Undo hook
// ---------------------------------------------------------------------------

export function useBusinessPlanUndo() {
  const { undo, redo, pastStates, futureStates } = useBusinessPlanEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
