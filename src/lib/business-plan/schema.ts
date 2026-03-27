// =============================================================================
// DMSuite — Business Plan Writer Schema
// Types, defaults, templates, and constants for the business plan tool.
// =============================================================================

// Re-export shared types from invoice schema
export { FONT_PAIRINGS, ACCENT_COLORS, PAGE_FORMATS, PAGE_DIMENSIONS } from "@/lib/invoice/schema";
export type { FontPairingId, PageFormat } from "@/lib/invoice/schema";

// ---------------------------------------------------------------------------
// Plan Types
// ---------------------------------------------------------------------------

export const PLAN_TYPES = [
  "startup",
  "traditional",
  "strategic",
  "investor",
  "lean",
  "franchise",
  "nonprofit",
  "internal",
] as const;

export type PlanType = (typeof PLAN_TYPES)[number];

export interface PlanTypeConfig {
  id: PlanType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  /** Which sections are enabled by default for this plan type */
  defaultSections: string[];
}

export const PLAN_TYPE_CONFIGS: Record<PlanType, PlanTypeConfig> = {
  startup: {
    id: "startup",
    label: "Startup Business Plan",
    shortLabel: "Startup",
    description: "For new ventures seeking funding, covering market opportunity and growth strategy",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    defaultSections: [
      "executive-summary", "company-description", "market-analysis",
      "competitive-analysis", "products-services", "marketing-strategy",
      "management-team", "financial-projections", "funding-requirements",
    ],
  },
  traditional: {
    id: "traditional",
    label: "Traditional Business Plan",
    shortLabel: "Traditional",
    description: "Comprehensive plan with all standard sections for banks and lenders",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    defaultSections: [
      "executive-summary", "company-description", "market-analysis",
      "competitive-analysis", "products-services", "marketing-strategy",
      "operations-plan", "management-team", "financial-projections",
      "revenue-model", "appendix",
    ],
  },
  strategic: {
    id: "strategic",
    label: "Strategic Growth Plan",
    shortLabel: "Strategic",
    description: "For existing businesses planning expansion, new markets, or pivots",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    defaultSections: [
      "executive-summary", "company-description", "market-analysis",
      "competitive-analysis", "marketing-strategy", "operations-plan",
      "management-team", "financial-projections", "revenue-model",
    ],
  },
  investor: {
    id: "investor",
    label: "Investor-Ready Plan",
    shortLabel: "Investor",
    description: "Optimized for VCs and angel investors with focus on returns and scalability",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    defaultSections: [
      "executive-summary", "company-description", "market-analysis",
      "competitive-analysis", "products-services", "marketing-strategy",
      "management-team", "financial-projections", "revenue-model",
      "funding-requirements",
    ],
  },
  lean: {
    id: "lean",
    label: "Lean Startup Plan",
    shortLabel: "Lean",
    description: "One-page agile plan focused on hypotheses, experiments, and rapid iteration",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    defaultSections: [
      "executive-summary", "products-services", "market-analysis",
      "revenue-model", "financial-projections",
    ],
  },
  franchise: {
    id: "franchise",
    label: "Franchise Business Plan",
    shortLabel: "Franchise",
    description: "Tailored for franchise applications with territory analysis and franchise fees",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    defaultSections: [
      "executive-summary", "company-description", "market-analysis",
      "competitive-analysis", "operations-plan", "management-team",
      "financial-projections", "funding-requirements",
    ],
  },
  nonprofit: {
    id: "nonprofit",
    label: "Nonprofit Business Plan",
    shortLabel: "Nonprofit",
    description: "Mission-driven plan for grant applications, donors, and community impact",
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    defaultSections: [
      "executive-summary", "company-description", "market-analysis",
      "products-services", "marketing-strategy", "operations-plan",
      "management-team", "financial-projections", "funding-requirements",
    ],
  },
  internal: {
    id: "internal",
    label: "Internal Operations Plan",
    shortLabel: "Internal",
    description: "For internal stakeholders focusing on operational efficiency and goals",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    defaultSections: [
      "executive-summary", "company-description", "competitive-analysis",
      "operations-plan", "management-team", "financial-projections",
    ],
  },
};

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export const SECTION_KEYS = [
  "executive-summary",
  "company-description",
  "market-analysis",
  "competitive-analysis",
  "products-services",
  "marketing-strategy",
  "operations-plan",
  "management-team",
  "financial-projections",
  "revenue-model",
  "funding-requirements",
  "appendix",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export interface SectionConfig {
  id: SectionKey;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
}

export const SECTION_CONFIGS: Record<SectionKey, SectionConfig> = {
  "executive-summary": {
    id: "executive-summary",
    label: "Executive Summary",
    shortLabel: "Exec Summary",
    description: "High-level overview of the business, opportunity, and key financials",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  "company-description": {
    id: "company-description",
    label: "Company Description",
    shortLabel: "Company",
    description: "Business overview, mission, vision, legal structure, and history",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  "market-analysis": {
    id: "market-analysis",
    label: "Market Analysis",
    shortLabel: "Market",
    description: "Target market, industry trends, TAM/SAM/SOM, and customer segments",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  "competitive-analysis": {
    id: "competitive-analysis",
    label: "Competitive Analysis & SWOT",
    shortLabel: "Competition",
    description: "Competitor landscape, SWOT analysis, and competitive advantages",
    icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  },
  "products-services": {
    id: "products-services",
    label: "Products & Services",
    shortLabel: "Products",
    description: "Product/service offerings, value proposition, and pricing strategy",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  "marketing-strategy": {
    id: "marketing-strategy",
    label: "Marketing Strategy",
    shortLabel: "Marketing",
    description: "Marketing channels, sales strategy, branding, and customer acquisition",
    icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  },
  "operations-plan": {
    id: "operations-plan",
    label: "Operations Plan",
    shortLabel: "Operations",
    description: "Day-to-day operations, supply chain, facilities, and technology",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  },
  "management-team": {
    id: "management-team",
    label: "Management Team",
    shortLabel: "Team",
    description: "Key team members, organizational structure, and advisory board",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  },
  "financial-projections": {
    id: "financial-projections",
    label: "Financial Projections",
    shortLabel: "Financials",
    description: "Income statements, cash flow, balance sheets, and break-even analysis",
    icon: "M9 7h6m0 10v-3m-3 3v-6m-3 6v-1m6-9a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2",
  },
  "revenue-model": {
    id: "revenue-model",
    label: "Revenue Model",
    shortLabel: "Revenue",
    description: "Revenue streams, pricing tiers, unit economics, and growth projections",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  "funding-requirements": {
    id: "funding-requirements",
    label: "Funding Requirements",
    shortLabel: "Funding",
    description: "Capital needed, use of funds, investment terms, and exit strategy",
    icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
  },
  appendix: {
    id: "appendix",
    label: "Appendix",
    shortLabel: "Appendix",
    description: "Supporting documents, charts, references, and additional data",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
};

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface BusinessPlanTemplate {
  id: string;
  name: string;
  accent: string;
  headerStyle: "banner" | "underline" | "sidebar" | "minimal" | "boxed";
  coverStyle: "executive" | "modern" | "minimal" | "bold";
  description: string;
}

export const BUSINESS_PLAN_TEMPLATES: BusinessPlanTemplate[] = [
  { id: "executive", name: "Executive", accent: "#1e40af", headerStyle: "banner", coverStyle: "executive", description: "Classic corporate with navy banner headers" },
  { id: "modern", name: "Modern", accent: "#7c3aed", headerStyle: "underline", coverStyle: "modern", description: "Clean design with violet accents" },
  { id: "startup", name: "Startup", accent: "#059669", headerStyle: "sidebar", coverStyle: "bold", description: "Bold and energetic for tech startups" },
  { id: "corporate", name: "Corporate", accent: "#0f172a", headerStyle: "banner", coverStyle: "executive", description: "Formal and traditional for large enterprises" },
  { id: "minimal", name: "Minimal", accent: "#475569", headerStyle: "minimal", coverStyle: "minimal", description: "Clean and understated for lean plans" },
  { id: "bold", name: "Bold", accent: "#b91c1c", headerStyle: "boxed", coverStyle: "bold", description: "High-impact design for investor pitches" },
  { id: "elegant", name: "Elegant", accent: "#0f766e", headerStyle: "underline", coverStyle: "modern", description: "Sophisticated design with teal accents" },
  { id: "consulting", name: "Consulting", accent: "#4338ca", headerStyle: "sidebar", coverStyle: "executive", description: "Professional consulting firm style" },
];

export function getBusinessPlanTemplate(id: string): BusinessPlanTemplate {
  return BUSINESS_PLAN_TEMPLATES.find((t) => t.id === id) ?? BUSINESS_PLAN_TEMPLATES[0];
}

// ---------------------------------------------------------------------------
// SWOT Analysis
// ---------------------------------------------------------------------------

export interface SwotItem {
  id: string;
  text: string;
}

export interface SwotAnalysis {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
}

// ---------------------------------------------------------------------------
// Team Member
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  linkedin: string;
}

// ---------------------------------------------------------------------------
// Financial Data
// ---------------------------------------------------------------------------

export interface FinancialYear {
  id: string;
  year: string;
  revenue: string;
  cogs: string;
  operatingExpenses: string;
  netIncome: string;
}

export interface FundingSource {
  id: string;
  source: string;
  amount: string;
  terms: string;
}

export interface UseOfFunds {
  id: string;
  category: string;
  amount: string;
  percentage: string;
}

// ---------------------------------------------------------------------------
// Competitor
// ---------------------------------------------------------------------------

export interface Competitor {
  id: string;
  name: string;
  strengths: string;
  weaknesses: string;
  marketShare: string;
}

// ---------------------------------------------------------------------------
// Section Content
// ---------------------------------------------------------------------------

export interface BusinessPlanSection {
  key: SectionKey;
  enabled: boolean;
  content: string;
}

// ---------------------------------------------------------------------------
// Style & Print Config
// ---------------------------------------------------------------------------

export interface StyleConfig {
  template: string;
  accentColor: string;
  fontPairing: string;
  headerStyle: "banner" | "underline" | "sidebar" | "minimal" | "boxed";
  coverStyle: "executive" | "modern" | "minimal" | "bold";
  showTableOfContents: boolean;
  showPageNumbers: boolean;
  showCoverPage: boolean;
}

export interface PrintConfig {
  pageSize: string;
  margins: "narrow" | "standard" | "wide";
  sectionSpacing: number;
  lineSpacing: "tight" | "normal" | "loose";
}

// ---------------------------------------------------------------------------
// Main Form Data
// ---------------------------------------------------------------------------

export interface BusinessPlanFormData {
  // Plan metadata
  planType: PlanType;
  title: string;
  subtitle: string;
  preparedFor: string;
  preparedBy: string;
  date: string;
  version: string;
  confidential: boolean;

  // Company info
  companyName: string;
  tagline: string;
  industry: string;
  foundedDate: string;
  legalStructure: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  mission: string;
  vision: string;

  // Sections
  sections: BusinessPlanSection[];

  // Executive summary fields
  executiveSummary: {
    overview: string;
    problem: string;
    solution: string;
    targetMarket: string;
    competitiveAdvantage: string;
    financialHighlights: string;
    fundingNeeded: string;
  };

  // Market analysis fields
  marketAnalysis: {
    industryOverview: string;
    targetMarket: string;
    marketSize: string;
    tam: string;
    sam: string;
    som: string;
    marketTrends: string;
    customerSegments: string;
  };

  // Competitive analysis
  competitors: Competitor[];
  swot: SwotAnalysis;
  competitiveAdvantage: string;

  // Products & Services
  productsServices: {
    overview: string;
    valueProposition: string;
    pricingStrategy: string;
    intellectualProperty: string;
    roadmap: string;
  };

  // Marketing strategy
  marketingStrategy: {
    overview: string;
    channels: string;
    salesStrategy: string;
    partnerships: string;
    customerRetention: string;
  };

  // Operations
  operationsPlan: {
    overview: string;
    facilities: string;
    technology: string;
    supplyChain: string;
    milestones: string;
  };

  // Team
  teamMembers: TeamMember[];
  advisors: string;
  organizationalStructure: string;

  // Financials
  financialProjections: FinancialYear[];
  revenueModel: string;
  breakEvenAnalysis: string;
  keyAssumptions: string;
  currency: string;

  // Funding
  totalFundingNeeded: string;
  fundingSources: FundingSource[];
  useOfFunds: UseOfFunds[];
  exitStrategy: string;
  investorReturns: string;

  // Appendix
  appendixNotes: string;

  // Style & print
  style: StyleConfig;
  printConfig: PrintConfig;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function createDefaultSwot(): SwotAnalysis {
  return {
    strengths: [{ id: uid(), text: "" }],
    weaknesses: [{ id: uid(), text: "" }],
    opportunities: [{ id: uid(), text: "" }],
    threats: [{ id: uid(), text: "" }],
  };
}

export function createDefaultFinancialYears(): FinancialYear[] {
  const currentYear = new Date().getFullYear();
  return [
    { id: uid(), year: `${currentYear}`, revenue: "", cogs: "", operatingExpenses: "", netIncome: "" },
    { id: uid(), year: `${currentYear + 1}`, revenue: "", cogs: "", operatingExpenses: "", netIncome: "" },
    { id: uid(), year: `${currentYear + 2}`, revenue: "", cogs: "", operatingExpenses: "", netIncome: "" },
  ];
}

export function createDefaultSections(planType: PlanType): BusinessPlanSection[] {
  const defaults = PLAN_TYPE_CONFIGS[planType].defaultSections;
  return SECTION_KEYS.map((key) => ({
    key,
    enabled: defaults.includes(key),
    content: "",
  }));
}

export function createDefaultBusinessPlanForm(planType: PlanType = "startup"): BusinessPlanFormData {
  const tpl = BUSINESS_PLAN_TEMPLATES[0];

  return {
    planType,
    title: "",
    subtitle: "",
    preparedFor: "",
    preparedBy: "",
    date: new Date().toISOString().split("T")[0],
    version: "1.0",
    confidential: false,

    companyName: "",
    tagline: "",
    industry: "",
    foundedDate: "",
    legalStructure: "",
    location: "",
    website: "",
    email: "",
    phone: "",
    mission: "",
    vision: "",

    sections: createDefaultSections(planType),

    executiveSummary: {
      overview: "",
      problem: "",
      solution: "",
      targetMarket: "",
      competitiveAdvantage: "",
      financialHighlights: "",
      fundingNeeded: "",
    },

    marketAnalysis: {
      industryOverview: "",
      targetMarket: "",
      marketSize: "",
      tam: "",
      sam: "",
      som: "",
      marketTrends: "",
      customerSegments: "",
    },

    competitors: [
      { id: uid(), name: "", strengths: "", weaknesses: "", marketShare: "" },
    ],
    swot: createDefaultSwot(),
    competitiveAdvantage: "",

    productsServices: {
      overview: "",
      valueProposition: "",
      pricingStrategy: "",
      intellectualProperty: "",
      roadmap: "",
    },

    marketingStrategy: {
      overview: "",
      channels: "",
      salesStrategy: "",
      partnerships: "",
      customerRetention: "",
    },

    operationsPlan: {
      overview: "",
      facilities: "",
      technology: "",
      supplyChain: "",
      milestones: "",
    },

    teamMembers: [
      { id: uid(), name: "", role: "", bio: "", linkedin: "" },
    ],
    advisors: "",
    organizationalStructure: "",

    financialProjections: createDefaultFinancialYears(),
    revenueModel: "",
    breakEvenAnalysis: "",
    keyAssumptions: "",
    currency: "USD",

    totalFundingNeeded: "",
    fundingSources: [{ id: uid(), source: "", amount: "", terms: "" }],
    useOfFunds: [{ id: uid(), category: "", amount: "", percentage: "" }],
    exitStrategy: "",
    investorReturns: "",

    appendixNotes: "",

    style: {
      template: tpl.id,
      accentColor: tpl.accent,
      fontPairing: "inter-inter",
      headerStyle: tpl.headerStyle,
      coverStyle: tpl.coverStyle,
      showTableOfContents: true,
      showPageNumbers: true,
      showCoverPage: true,
    },

    printConfig: {
      pageSize: "a4",
      margins: "standard",
      sectionSpacing: 24,
      lineSpacing: "normal",
    },
  };
}
