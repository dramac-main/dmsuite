// =============================================================================
// DMSuite — Business Plan Writer Action Manifest for Chiko
// Gives Chiko AI full control over every aspect of the Business Plan Writer:
// meta, company info, executive summary, market analysis, products/services,
// marketing, operations, financials, SWOT, team, competitors, style, format.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useBusinessPlanEditor } from "@/stores/business-plan-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";
import type {
  BusinessPlanFormData,
  PlanType,
  SectionKey,
  StyleConfig,
  PrintConfig,
  SwotAnalysis,
  SwotItem,
} from "@/lib/business-plan/schema";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface BusinessPlanManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ---------------------------------------------------------------------------
// Read State
// ---------------------------------------------------------------------------

function readState(): Record<string, unknown> {
  const { form } = useBusinessPlanEditor.getState();
  return {
    planType: form.planType,
    title: form.title,
    subtitle: form.subtitle,
    companyName: form.companyName,
    industry: form.industry,
    enabledSections: form.sections.filter((s) => s.enabled).map((s) => s.key),
    disabledSections: form.sections.filter((s) => !s.enabled).map((s) => s.key),
    executiveSummary: { ...form.executiveSummary },
    marketAnalysis: { ...form.marketAnalysis },
    productsServices: { ...form.productsServices },
    marketingStrategy: { ...form.marketingStrategy },
    operationsPlan: { ...form.operationsPlan },
    swot: { ...form.swot },
    competitorCount: form.competitors.filter((c) => c.name).length,
    competitors: form.competitors.filter((c) => c.name).map((c) => ({ id: c.id, name: c.name })),
    teamMemberCount: form.teamMembers.filter((m) => m.name).length,
    teamMembers: form.teamMembers.filter((m) => m.name).map((m) => ({ id: m.id, name: m.name, role: m.role })),
    financialYears: form.financialProjections.length,
    currency: form.currency,
    totalFunding: form.totalFundingNeeded,
    revenueModel: form.revenueModel,
    style: { ...form.style },
    printConfig: { ...form.printConfig },
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

function validatePlan(): { issues: ValidationIssue[]; ready: boolean } {
  const { form } = useBusinessPlanEditor.getState();
  const issues: ValidationIssue[] = [];

  if (!form.title.trim()) {
    issues.push({ severity: "warning", field: "title", message: "Plan title is empty" });
  }
  if (!form.companyName.trim()) {
    issues.push({ severity: "warning", field: "companyName", message: "Company name is empty" });
  }
  const enabled = form.sections.filter((s) => s.enabled);
  if (enabled.length === 0) {
    issues.push({ severity: "error", field: "sections", message: "No sections are enabled" });
  }
  if (!form.executiveSummary.overview.trim()) {
    issues.push({ severity: "warning", field: "executiveSummary.overview", message: "Executive summary overview is empty" });
  }
  if (!form.industry.trim()) {
    issues.push({ severity: "warning", field: "industry", message: "Industry is not specified" });
  }

  return { issues, ready: issues.filter((i) => i.severity === "error").length === 0 };
}

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

export function createBusinessPlanManifest(options?: BusinessPlanManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "business-plan",
    toolName: "Business Plan Writer",
    actions: [
      // ── Plan Meta ──
      {
        name: "updatePlanMeta",
        description:
          "Update plan metadata: title, subtitle, preparedBy, preparedFor, date, version, confidential (boolean).",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            preparedBy: { type: "string" },
            preparedFor: { type: "string" },
            date: { type: "string" },
            version: { type: "string" },
            confidential: { type: "boolean" },
          },
        },
        category: "Content",
      },

      // ── Company Info ──
      {
        name: "updateCompanyInfo",
        description:
          "Update company info: companyName, tagline, industry, legalStructure, location, foundedDate, website, email, phone, mission, vision.",
        parameters: {
          type: "object",
          properties: {
            companyName: { type: "string" },
            tagline: { type: "string" },
            industry: { type: "string" },
            legalStructure: { type: "string" },
            location: { type: "string" },
            foundedDate: { type: "string" },
            website: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            mission: { type: "string" },
            vision: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Plan Type ──
      {
        name: "setPlanType",
        description:
          "Change plan type: startup, traditional, strategic, investor, lean, franchise, nonprofit, internal.",
        parameters: {
          type: "object",
          properties: {
            planType: {
              type: "string",
              enum: ["startup", "traditional", "strategic", "investor", "lean", "franchise", "nonprofit", "internal"],
            },
          },
          required: ["planType"],
        },
        category: "Content",
      },

      // ── Toggle Section ──
      {
        name: "toggleSection",
        description:
          "Enable or disable a section. Keys: executive-summary, company-description, market-analysis, competitive-analysis, products-services, marketing-strategy, operations-plan, management-team, financial-projections, revenue-model, funding-requirements, appendix.",
        parameters: {
          type: "object",
          properties: {
            sectionKey: { type: "string" },
          },
          required: ["sectionKey"],
        },
        category: "Content",
      },

      // ── Executive Summary ──
      {
        name: "updateExecutiveSummary",
        description:
          "Update executive summary: overview, problem, solution, targetMarket, competitiveAdvantage, financialHighlights, fundingNeeded.",
        parameters: {
          type: "object",
          properties: {
            overview: { type: "string" },
            problem: { type: "string" },
            solution: { type: "string" },
            targetMarket: { type: "string" },
            competitiveAdvantage: { type: "string" },
            financialHighlights: { type: "string" },
            fundingNeeded: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Market Analysis ──
      {
        name: "updateMarketAnalysis",
        description:
          "Update market analysis: industryOverview, targetMarket, marketSize, tam, sam, som, marketTrends, customerSegments.",
        parameters: {
          type: "object",
          properties: {
            industryOverview: { type: "string" },
            targetMarket: { type: "string" },
            marketSize: { type: "string" },
            tam: { type: "string" },
            sam: { type: "string" },
            som: { type: "string" },
            marketTrends: { type: "string" },
            customerSegments: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Products & Services ──
      {
        name: "updateProductsServices",
        description:
          "Update products/services: overview, valueProposition, pricingStrategy, intellectualProperty, roadmap.",
        parameters: {
          type: "object",
          properties: {
            overview: { type: "string" },
            valueProposition: { type: "string" },
            pricingStrategy: { type: "string" },
            intellectualProperty: { type: "string" },
            roadmap: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Marketing Strategy ──
      {
        name: "updateMarketingStrategy",
        description:
          "Update marketing strategy: overview, channels, salesStrategy, partnerships, customerRetention.",
        parameters: {
          type: "object",
          properties: {
            overview: { type: "string" },
            channels: { type: "string" },
            salesStrategy: { type: "string" },
            partnerships: { type: "string" },
            customerRetention: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── Operations Plan ──
      {
        name: "updateOperationsPlan",
        description:
          "Update operations plan: overview, facilities, technology, supplyChain, milestones.",
        parameters: {
          type: "object",
          properties: {
            overview: { type: "string" },
            facilities: { type: "string" },
            technology: { type: "string" },
            supplyChain: { type: "string" },
            milestones: { type: "string" },
          },
        },
        category: "Content",
      },

      // ── SWOT Analysis ──
      {
        name: "updateSwot",
        description:
          "Update SWOT analysis. Provide arrays of strings for each quadrant: strengths, weaknesses, opportunities, threats.",
        parameters: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            threats: { type: "array", items: { type: "string" } },
          },
        },
        category: "Content",
      },

      // ── Financial Info ──
      {
        name: "updateFinancials",
        description:
          "Update financial settings: revenueModel, breakEvenAnalysis, keyAssumptions, currency, totalFundingNeeded, exitStrategy, investorReturns.",
        parameters: {
          type: "object",
          properties: {
            revenueModel: { type: "string" },
            breakEvenAnalysis: { type: "string" },
            keyAssumptions: { type: "string" },
            currency: { type: "string" },
            totalFundingNeeded: { type: "string" },
            exitStrategy: { type: "string" },
            investorReturns: { type: "string" },
          },
        },
        category: "Financials",
      },

      // ── Style ──
      {
        name: "updateStyle",
        description:
          "Update visual style: template (executive/modern/startup/corporate/minimal/bold/elegant/consulting), accentColor (hex), fontPairing, headerStyle (banner/underline/sidebar/minimal/boxed), coverStyle (executive/modern/minimal/bold), showCoverPage (boolean), showTableOfContents (boolean), showPageNumbers (boolean).",
        parameters: {
          type: "object",
          properties: {
            template: { type: "string" },
            accentColor: { type: "string" },
            fontPairing: { type: "string" },
            headerStyle: { type: "string" },
            coverStyle: { type: "string" },
            showCoverPage: { type: "boolean" },
            showTableOfContents: { type: "boolean" },
            showPageNumbers: { type: "boolean" },
          },
        },
        category: "Style",
      },

      // ── Print / Format ──
      {
        name: "updateFormat",
        description:
          "Update format/print settings: pageSize (a4/a5/letter/legal), margins (narrow/standard/wide), sectionSpacing (number), lineSpacing (tight/normal/loose).",
        parameters: {
          type: "object",
          properties: {
            pageSize: { type: "string" },
            margins: { type: "string" },
            sectionSpacing: { type: "number" },
            lineSpacing: { type: "string" },
          },
        },
        category: "Format",
      },

      // ── Prefill from Business Memory ──
      {
        name: "prefillFromMemory",
        description:
          "Pre-fill company info from the user's saved business memory (company name, industry, location, contact, etc.).",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },

      // ── Export / Print ──
      {
        name: "exportPrint",
        description: "Export the business plan as a PDF (triggers the browser print dialog).",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // ── Read State ──
      {
        name: "readCurrentState",
        description:
          "Read the current state of the business plan for analysis or suggestions.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },

      // ── Validate ──
      {
        name: "validateBeforeExport",
        description:
          "Validate the business plan for completeness before exporting.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // ── Reset ──
      {
        name: "resetForm",
        description:
          "Reset the business plan to defaults. Optionally pass a planType to reset with that plan type's defaults.",
        parameters: {
          type: "object",
          properties: {
            planType: { type: "string" },
          },
        },
        category: "Content",
        destructive: true,
      },
    ],

    // ── State reader ──
    getState: readState,

    // ── Action Executor ──
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      try {
        const store = useBusinessPlanEditor.getState();

        switch (actionName) {
          case "updatePlanMeta":
            store.updateMeta(params as Partial<Pick<BusinessPlanFormData, "title" | "subtitle" | "preparedBy" | "preparedFor" | "date" | "version" | "confidential">>);
            return { success: true, message: `Updated plan metadata` };

          case "updateCompanyInfo":
            store.updateCompanyInfo(params as Partial<Pick<BusinessPlanFormData, "companyName" | "tagline" | "industry" | "legalStructure" | "location" | "foundedDate" | "website" | "email" | "phone" | "mission" | "vision">>);
            return { success: true, message: "Updated company info" };

          case "setPlanType":
            store.setPlanType(params.planType as PlanType);
            return { success: true, message: `Plan type set to ${params.planType}` };

          case "toggleSection":
            store.toggleSection(params.sectionKey as SectionKey);
            return { success: true, message: `Toggled section: ${params.sectionKey}` };

          case "updateExecutiveSummary":
            store.updateExecSummary(params as Partial<BusinessPlanFormData["executiveSummary"]>);
            return { success: true, message: "Updated executive summary" };

          case "updateMarketAnalysis":
            store.updateMarketAnalysis(params as Partial<BusinessPlanFormData["marketAnalysis"]>);
            return { success: true, message: "Updated market analysis" };

          case "updateProductsServices":
            store.updateProductsServices(params as Partial<BusinessPlanFormData["productsServices"]>);
            return { success: true, message: "Updated products & services" };

          case "updateMarketingStrategy":
            store.updateMarketingStrategy(params as Partial<BusinessPlanFormData["marketingStrategy"]>);
            return { success: true, message: "Updated marketing strategy" };

          case "updateOperationsPlan":
            store.updateOperationsPlan(params as Partial<BusinessPlanFormData["operationsPlan"]>);
            return { success: true, message: "Updated operations plan" };

          case "updateSwot": {
            const current = store.form.swot;
            const toItems = (arr: unknown[] | undefined, fallback: SwotItem[]): SwotItem[] =>
              arr ? arr.map((t, i) => ({ id: `swot-${Date.now()}-${i}`, text: String(t) })) : fallback;
            const swot: SwotAnalysis = {
              strengths: toItems(params.strengths as unknown[] | undefined, current.strengths),
              weaknesses: toItems(params.weaknesses as unknown[] | undefined, current.weaknesses),
              opportunities: toItems(params.opportunities as unknown[] | undefined, current.opportunities),
              threats: toItems(params.threats as unknown[] | undefined, current.threats),
            };
            store.updateSwot(swot);
            return { success: true, message: "Updated SWOT analysis" };
          }

          case "updateFinancials": {
            if (params.revenueModel !== undefined) store.setRevenueModel(params.revenueModel as string);
            if (params.breakEvenAnalysis !== undefined) store.setBreakEvenAnalysis(params.breakEvenAnalysis as string);
            if (params.keyAssumptions !== undefined) store.setKeyAssumptions(params.keyAssumptions as string);
            if (params.currency !== undefined) store.setCurrency(params.currency as string);
            if (params.totalFundingNeeded !== undefined) store.setTotalFundingNeeded(params.totalFundingNeeded as string);
            if (params.exitStrategy !== undefined) store.setExitStrategy(params.exitStrategy as string);
            if (params.investorReturns !== undefined) store.setInvestorReturns(params.investorReturns as string);
            return { success: true, message: "Updated financial settings" };
          }

          case "updateStyle": {
            if (params.template !== undefined) store.setTemplate(params.template as string);
            const stylePatch: Record<string, unknown> = {};
            for (const key of ["accentColor", "fontPairing", "headerStyle", "coverStyle", "showCoverPage", "showTableOfContents", "showPageNumbers"]) {
              if (params[key] !== undefined) stylePatch[key] = params[key];
            }
            if (Object.keys(stylePatch).length > 0) {
              store.updateStyle(stylePatch as Partial<StyleConfig>);
            }
            return { success: true, message: "Updated business plan style" };
          }

          case "updateFormat":
            store.updatePrint(params as Partial<PrintConfig>);
            return { success: true, message: "Updated format/print settings" };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved. Ask the user to set up Business Memory first." };
            }
            const p = memory.profile;
            const patch: Record<string, unknown> = {};
            if (p.companyName) patch.companyName = p.companyName;
            if (p.email) patch.email = p.email;
            if (p.phone) patch.phone = p.phone;
            if (p.website) patch.website = p.website;
            if (p.address) patch.location = p.address;
            if (p.tagline) patch.tagline = p.tagline;
            if (Object.keys(patch).length > 0) {
              store.updateCompanyInfo(patch as Partial<Pick<BusinessPlanFormData, "companyName" | "email" | "phone" | "website" | "location" | "tagline">>);
            }
            if (p.preferredAccentColor) store.setAccentColor(p.preferredAccentColor);
            if (p.preferredCurrency) store.setCurrency(p.preferredCurrency);
            return { success: true, message: `Pre-filled from business memory: ${p.companyName || "profile"}` };
          }

          case "exportPrint": {
            const { issues, ready } = validatePlan();
            const errors = issues.filter((i) => i.severity === "error");
            if (!ready) {
              return { success: false, message: `Cannot export — ${errors.length} error(s):\n${errors.map((i) => `• ${i.message}`).join("\n")}` };
            }
            const handler = options?.onPrintRef?.current;
            if (!handler) {
              return { success: false, message: "Export not ready yet — please wait and try again." };
            }
            handler();
            return { success: true, message: "Print dialog opened" };
          }

          case "readCurrentState":
            return { success: true, message: "Current business plan state", newState: readState() };

          case "validateBeforeExport": {
            const { issues, ready } = validatePlan();
            const errorCount = issues.filter((i) => i.severity === "error").length;
            const warningCount = issues.filter((i) => i.severity === "warning").length;
            let msg: string;
            if (ready && warningCount === 0) {
              msg = "Plan is ready for export — no issues found.";
            } else if (ready) {
              msg = `Plan can be exported but has ${warningCount} warning(s):\n${issues.map((i) => `  ⚠ ${i.message}`).join("\n")}`;
            } else {
              msg = `Plan has ${errorCount} error(s) and ${warningCount} warning(s):\n${issues.map((i) => `  ${i.severity === "error" ? "✘" : "⚠"} ${i.message}`).join("\n")}`;
            }
            return { success: true, message: msg, newState: { issues, ready, errorCount, warningCount } };
          }

          case "resetForm":
            store.resetForm(params.planType as PlanType | undefined);
            return { success: true, message: "Business plan reset to defaults" };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useBusinessPlanEditor.getState().form,
    (snapshot) => useBusinessPlanEditor.getState().setForm(snapshot as BusinessPlanFormData),
  );
}
