// =============================================================================
// DMSuite — Contract & Agreement Schema
// Configuration schema for creating legal contracts, service agreements,
// NDAs, employment contracts, freelance agreements, etc.
// Documents contain real legal text (not blank forms).
// =============================================================================

import { z } from "zod";

// Re-export shared types from invoice schema
export {
  FONT_PAIRINGS,
  ACCENT_COLORS,
  PAGE_FORMATS,
  PAGE_DIMENSIONS,
} from "@/lib/invoice/schema";

export type { FontPairingId, PageFormat } from "@/lib/invoice/schema";

// ---------------------------------------------------------------------------
// Contract Types
// ---------------------------------------------------------------------------

export const CONTRACT_TYPES = [
  "service-agreement",
  "nda",
  "employment-contract",
  "freelance-agreement",
  "partnership-agreement",
  "lease-agreement",
  "sales-agreement",
  "consulting-agreement",
  "motor-vehicle-sale",
  "property-sale-agreement",
  "loan-agreement",
  "shareholders-agreement",
  "supply-agreement",
  "mou",
  "construction-contract",
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];

export interface ContractTypeConfig {
  id: ContractType;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  defaultTitle: string;
  partyARole: string;
  partyBRole: string;
}

export const CONTRACT_TYPE_CONFIGS: Record<ContractType, ContractTypeConfig> = {
  "service-agreement": {
    id: "service-agreement",
    label: "Service Agreement",
    shortLabel: "Service",
    icon: "briefcase",
    description: "Agreement for provision of professional services",
    defaultTitle: "Service Agreement",
    partyARole: "Service Provider",
    partyBRole: "Client",
  },
  "nda": {
    id: "nda",
    label: "Non-Disclosure Agreement",
    shortLabel: "NDA",
    icon: "shield",
    description: "Mutual or one-way confidentiality agreement",
    defaultTitle: "Non-Disclosure Agreement",
    partyARole: "Disclosing Party",
    partyBRole: "Receiving Party",
  },
  "employment-contract": {
    id: "employment-contract",
    label: "Employment Contract",
    shortLabel: "Employment",
    icon: "users",
    description: "Agreement between employer and employee",
    defaultTitle: "Employment Contract",
    partyARole: "Employer",
    partyBRole: "Employee",
  },
  "freelance-agreement": {
    id: "freelance-agreement",
    label: "Freelance Agreement",
    shortLabel: "Freelance",
    icon: "pen-tool",
    description: "Independent contractor engagement terms",
    defaultTitle: "Freelance Agreement",
    partyARole: "Client",
    partyBRole: "Contractor",
  },
  "partnership-agreement": {
    id: "partnership-agreement",
    label: "Partnership Agreement",
    shortLabel: "Partnership",
    icon: "handshake",
    description: "Business partnership terms and profit sharing",
    defaultTitle: "Partnership Agreement",
    partyARole: "Partner A",
    partyBRole: "Partner B",
  },
  "lease-agreement": {
    id: "lease-agreement",
    label: "Lease Agreement",
    shortLabel: "Lease",
    icon: "home",
    description: "Property rental or lease terms",
    defaultTitle: "Lease Agreement",
    partyARole: "Landlord",
    partyBRole: "Tenant",
  },
  "sales-agreement": {
    id: "sales-agreement",
    label: "Sales Agreement",
    shortLabel: "Sales",
    icon: "shopping-cart",
    description: "Terms for sale of goods or assets",
    defaultTitle: "Sales Agreement",
    partyARole: "Seller",
    partyBRole: "Buyer",
  },
  "consulting-agreement": {
    id: "consulting-agreement",
    label: "Consulting Agreement",
    shortLabel: "Consulting",
    icon: "lightbulb",
    description: "Professional consulting engagement terms",
    defaultTitle: "Consulting Agreement",
    partyARole: "Consultant",
    partyBRole: "Client",
  },
  "motor-vehicle-sale": {
    id: "motor-vehicle-sale",
    label: "Motor Vehicle Sale Agreement",
    shortLabel: "Vehicle Sale",
    icon: "car",
    description: "Legal transfer of ownership of a motor vehicle",
    defaultTitle: "Motor Vehicle Sale Agreement",
    partyARole: "Seller",
    partyBRole: "Buyer",
  },
  "property-sale-agreement": {
    id: "property-sale-agreement",
    label: "Property Sale Agreement",
    shortLabel: "Property Sale",
    icon: "home",
    description: "Real property / land purchase agreement",
    defaultTitle: "Property Sale Agreement",
    partyARole: "Vendor",
    partyBRole: "Purchaser",
  },
  "loan-agreement": {
    id: "loan-agreement",
    label: "Loan Agreement",
    shortLabel: "Loan",
    icon: "credit-card",
    description: "Lending/borrowing agreement with repayment terms",
    defaultTitle: "Loan Agreement",
    partyARole: "Lender",
    partyBRole: "Borrower",
  },
  "shareholders-agreement": {
    id: "shareholders-agreement",
    label: "Shareholders Agreement",
    shortLabel: "Shareholders",
    icon: "users",
    description: "Rights and obligations of company shareholders",
    defaultTitle: "Shareholders Agreement",
    partyARole: "Shareholder A",
    partyBRole: "Shareholder B",
  },
  "supply-agreement": {
    id: "supply-agreement",
    label: "Supply Agreement",
    shortLabel: "Supply",
    icon: "truck",
    description: "Ongoing supply of goods or materials",
    defaultTitle: "Supply Agreement",
    partyARole: "Supplier",
    partyBRole: "Purchaser",
  },
  "mou": {
    id: "mou",
    label: "Memorandum of Understanding",
    shortLabel: "MOU",
    icon: "file-text",
    description: "Non-binding letter of intent / collaboration framework",
    defaultTitle: "Memorandum of Understanding",
    partyARole: "First Party",
    partyBRole: "Second Party",
  },
  "construction-contract": {
    id: "construction-contract",
    label: "Construction Contract",
    shortLabel: "Construction",
    icon: "tool",
    description: "Building / civil works contract",
    defaultTitle: "Construction Contract",
    partyARole: "Contractor",
    partyBRole: "Employer / Owner",
  },
};

// ---------------------------------------------------------------------------
// Clause Categories
// ---------------------------------------------------------------------------

export const CLAUSE_CATEGORIES = [
  "definitions",
  "confidentiality",
  "non-compete",
  "payment",
  "liability",
  "intellectual-property",
  "termination",
  "dispute-resolution",
  "general",
  "indemnification",
  "force-majeure",
  "amendments",
  "scope",
] as const;

export type ClauseCategory = (typeof CLAUSE_CATEGORIES)[number];

export const CLAUSE_CATEGORY_LABELS: Record<ClauseCategory, string> = {
  "definitions": "Definitions",
  "confidentiality": "Confidentiality",
  "non-compete": "Non-Compete",
  "payment": "Payment",
  "liability": "Liability",
  "intellectual-property": "IP Rights",
  "termination": "Termination",
  "dispute-resolution": "Disputes",
  "general": "General",
  "indemnification": "Indemnification",
  "force-majeure": "Force Majeure",
  "amendments": "Amendments",
  "scope": "Scope of Work",
};

// ---------------------------------------------------------------------------
// Contract Clause
// ---------------------------------------------------------------------------

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  category: ClauseCategory;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Party Info
// ---------------------------------------------------------------------------

export const partyInfoSchema = z.object({
  role: z.string().default(""),
  name: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  country: z.string().default("Zambia"),
  representative: z.string().default(""),
  representativeTitle: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  taxId: z.string().default(""),
  registrationNumber: z.string().default(""),
});

export type PartyInfo = z.infer<typeof partyInfoSchema>;

// ---------------------------------------------------------------------------
// Document Info
// ---------------------------------------------------------------------------

export const documentInfoSchema = z.object({
  title: z.string().default("Service Agreement"),
  subtitle: z.string().default(""),
  effectiveDate: z.string().default(""),
  expiryDate: z.string().default(""),
  jurisdiction: z.string().default("Republic of Zambia"),
  governingLaw: z.string().default("Laws of the Republic of Zambia"),
  referenceNumber: z.string().default(""),
  showConfidentialBanner: z.boolean().default(false),
  showTableOfContents: z.boolean().default(true),
  preambleText: z.string().default(""),
});

export type DocumentInfo = z.infer<typeof documentInfoSchema>;

// ---------------------------------------------------------------------------
// Signature Config
// ---------------------------------------------------------------------------

export const signatureConfigSchema = z.object({
  showDate: z.boolean().default(true),
  showWitness: z.boolean().default(true),
  witnessCount: z.number().int().min(1).max(3).default(1),
  showSeal: z.boolean().default(false),
  lineStyle: z.enum(["solid", "dotted"]).default("solid"),
});

export type SignatureConfig = z.infer<typeof signatureConfigSchema>;

// ---------------------------------------------------------------------------
// Style Config
// ---------------------------------------------------------------------------

export const styleConfigSchema = z.object({
  template: z.string().default("corporate-blue"),
  accentColor: z.string().default("#1e40af"),
  fontPairing: z.string().default("inter-inter"),
  headerStyle: z.enum(["banner", "centered", "left-aligned", "minimal"]).default("banner"),
  pageNumbering: z.boolean().default(true),
  pageNumberPosition: z.enum(["bottom-center", "bottom-right"]).default("bottom-center"),
});

export type StyleConfig = z.infer<typeof styleConfigSchema>;

// ---------------------------------------------------------------------------
// Print Config
// ---------------------------------------------------------------------------

export const printConfigSchema = z.object({
  pageSize: z.enum(["a4", "letter", "legal"]).default("a4"),
  showPageBorder: z.boolean().default(false),
  showWatermark: z.boolean().default(false),
  watermarkText: z.string().default("DRAFT"),
});

export type PrintConfig = z.infer<typeof printConfigSchema>;

// ---------------------------------------------------------------------------
// Contract Form Data (Full State)
// ---------------------------------------------------------------------------

export interface ContractFormData {
  contractType: ContractType;
  documentInfo: DocumentInfo;
  partyA: PartyInfo;
  partyB: PartyInfo;
  clauses: ContractClause[];
  signatureConfig: SignatureConfig;
  style: StyleConfig;
  printConfig: PrintConfig;
}

// ---------------------------------------------------------------------------
// Contract Visual Templates
// ---------------------------------------------------------------------------

export interface ContractTemplate {
  id: string;
  name: string;
  category: "professional" | "classic" | "modern" | "premium";
  accent: string;
  accentSecondary?: string;
  headerStyle: "banner" | "centered" | "left-aligned" | "minimal";
  fontSuggestion: string;
  borderStyle: "none" | "thin" | "thick";
  watermark: "none" | "text" | "faded-title";
  headerDivider: "thin-line" | "thick-line" | "double-line" | "accent-bar" | "none";
  footerStyle: "bar" | "line" | "none";
  decorative: "none" | "corner-gradient" | "page-border" | "accent-strip";
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: "corporate-blue",
    name: "Corporate Blue",
    category: "professional",
    accent: "#1e40af",
    accentSecondary: "#3b82f6",
    headerStyle: "banner",
    fontSuggestion: "inter-inter",
    borderStyle: "none",
    watermark: "none",
    headerDivider: "thick-line",
    footerStyle: "line",
    decorative: "none",
  },
  {
    id: "legal-classic",
    name: "Legal Classic",
    category: "classic",
    accent: "#1f2937",
    headerStyle: "centered",
    fontSuggestion: "playfair-source",
    borderStyle: "thin",
    watermark: "none",
    headerDivider: "double-line",
    footerStyle: "line",
    decorative: "page-border",
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    category: "modern",
    accent: "#475569",
    headerStyle: "left-aligned",
    fontSuggestion: "spacegrotesk-inter",
    borderStyle: "none",
    watermark: "none",
    headerDivider: "thin-line",
    footerStyle: "none",
    decorative: "none",
  },
  {
    id: "executive-gold",
    name: "Executive Gold",
    category: "premium",
    accent: "#b45309",
    accentSecondary: "#d97706",
    headerStyle: "centered",
    fontSuggestion: "cormorant-proza",
    borderStyle: "thin",
    watermark: "faded-title",
    headerDivider: "accent-bar",
    footerStyle: "bar",
    decorative: "corner-gradient",
  },
  {
    id: "corporate-green",
    name: "Corporate Green",
    category: "professional",
    accent: "#059669",
    accentSecondary: "#10b981",
    headerStyle: "banner",
    fontSuggestion: "montserrat-opensans",
    borderStyle: "none",
    watermark: "none",
    headerDivider: "thick-line",
    footerStyle: "bar",
    decorative: "none",
  },
  {
    id: "bold-slate",
    name: "Bold Slate",
    category: "modern",
    accent: "#0f172a",
    accentSecondary: "#334155",
    headerStyle: "banner",
    fontSuggestion: "poppins-inter",
    borderStyle: "none",
    watermark: "none",
    headerDivider: "accent-bar",
    footerStyle: "bar",
    decorative: "accent-strip",
  },
  {
    id: "elegant-gray",
    name: "Elegant Gray",
    category: "classic",
    accent: "#6b7280",
    headerStyle: "centered",
    fontSuggestion: "crimsonpro-worksans",
    borderStyle: "thin",
    watermark: "none",
    headerDivider: "thin-line",
    footerStyle: "line",
    decorative: "none",
  },
  {
    id: "creative-violet",
    name: "Creative Violet",
    category: "modern",
    accent: "#7c3aed",
    accentSecondary: "#a78bfa",
    headerStyle: "left-aligned",
    fontSuggestion: "raleway-lato",
    borderStyle: "none",
    watermark: "none",
    headerDivider: "accent-bar",
    footerStyle: "line",
    decorative: "corner-gradient",
  },
  {
    id: "deep-navy",
    name: "Deep Navy",
    category: "premium",
    accent: "#0f2744",
    accentSecondary: "#1e4080",
    headerStyle: "banner",
    fontSuggestion: "dmserif-dmsans",
    borderStyle: "thin",
    watermark: "none",
    headerDivider: "accent-bar",
    footerStyle: "bar",
    decorative: "corner-gradient",
  },
  {
    id: "rose-professional",
    name: "Rose Professional",
    category: "modern",
    accent: "#be123c",
    accentSecondary: "#e11d48",
    headerStyle: "centered",
    fontSuggestion: "poppins-inter",
    borderStyle: "none",
    watermark: "none",
    headerDivider: "thick-line",
    footerStyle: "line",
    decorative: "none",
  },
  {
    id: "forest-law",
    name: "Forest Law",
    category: "classic",
    accent: "#14532d",
    accentSecondary: "#166534",
    headerStyle: "banner",
    fontSuggestion: "crimsonpro-worksans",
    borderStyle: "thin",
    watermark: "none",
    headerDivider: "double-line",
    footerStyle: "line",
    decorative: "page-border",
  },
  {
    id: "warm-parchment",
    name: "Warm Parchment",
    category: "classic",
    accent: "#92400e",
    accentSecondary: "#b45309",
    headerStyle: "centered",
    fontSuggestion: "cormorant-proza",
    borderStyle: "thin",
    watermark: "faded-title",
    headerDivider: "double-line",
    footerStyle: "line",
    decorative: "page-border",
  },
];

export function getContractTemplate(id: string): ContractTemplate {
  return CONTRACT_TEMPLATES.find((t) => t.id === id) ?? CONTRACT_TEMPLATES[0];
}

// ---------------------------------------------------------------------------
// Default Clauses per Contract Type
// ---------------------------------------------------------------------------

function makeClause(title: string, content: string, category: ClauseCategory): ContractClause {
  return { id: uid(), title, content, enabled: true, category };
}

const COMMON_CLAUSES = {
  definitions: (ctx: string) =>
    makeClause(
      "Definitions",
      `In this Agreement, unless the context otherwise requires: "${ctx}" refers to the terms and obligations outlined herein. "Confidential Information" means any proprietary information disclosed by either party. "Effective Date" means the date first written above.`,
      "definitions",
    ),
  confidentiality: () =>
    makeClause(
      "Confidentiality",
      "Each party agrees to hold in strict confidence all Confidential Information received from the other party. Confidential Information shall not be disclosed to any third party without prior written consent. This obligation shall survive termination of this Agreement for a period of two (2) years.",
      "confidentiality",
    ),
  nonCompete: () =>
    makeClause(
      "Non-Compete",
      "During the term of this Agreement and for a period of twelve (12) months thereafter, neither party shall engage in any business that directly competes with the other party within the agreed territory, unless expressly authorised in writing.",
      "non-compete",
    ),
  payment: (terms: string) =>
    makeClause(
      "Payment Terms",
      `Payment shall be made in Zambian Kwacha (ZMW) ${terms}. Late payments shall incur interest at the rate of 2% per month on the outstanding amount. All amounts stated are exclusive of Value Added Tax (VAT) at the applicable rate.`,
      "payment",
    ),
  liability: () =>
    makeClause(
      "Limitation of Liability",
      "Neither party shall be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with this Agreement, regardless of the cause of action. The total aggregate liability of either party shall not exceed the total fees paid or payable under this Agreement.",
      "liability",
    ),
  ip: () =>
    makeClause(
      "Intellectual Property",
      "All intellectual property created during the course of this Agreement shall be owned as specified herein. Pre-existing intellectual property remains the sole property of the originating party. Any jointly developed IP shall be subject to a separate written agreement.",
      "intellectual-property",
    ),
  termination: (notice: string) =>
    makeClause(
      "Termination",
      `Either party may terminate this Agreement by providing ${notice} written notice to the other party. Upon termination, all obligations shall cease except those which by their nature survive termination, including confidentiality, intellectual property, and indemnification provisions.`,
      "termination",
    ),
  disputeResolution: () =>
    makeClause(
      "Dispute Resolution",
      "Any dispute arising from this Agreement shall first be resolved through good-faith negotiation between the parties. If negotiation fails within thirty (30) days, the dispute shall be referred to mediation. If mediation is unsuccessful, the dispute shall be submitted to the jurisdiction of the courts of Lusaka, Republic of Zambia.",
      "dispute-resolution",
    ),
  governingLaw: () =>
    makeClause(
      "Governing Law",
      "This Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia. The parties irrevocably submit to the exclusive jurisdiction of the courts of Lusaka for the resolution of any disputes.",
      "general",
    ),
  forceMajeure: () =>
    makeClause(
      "Force Majeure",
      "Neither party shall be liable for any failure or delay in performance under this Agreement due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, government actions, epidemics, or failure of third-party telecommunications.",
      "force-majeure",
    ),
  amendments: () =>
    makeClause(
      "Amendments",
      "No amendment, modification, or waiver of any provision of this Agreement shall be effective unless made in writing and signed by both parties. No waiver of any breach shall constitute a waiver of any subsequent breach.",
      "amendments",
    ),
  entireAgreement: () =>
    makeClause(
      "Entire Agreement",
      "This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, warranties, commitments, offers, and agreements, whether written or oral.",
      "general",
    ),
  indemnification: () =>
    makeClause(
      "Indemnification",
      "Each party agrees to indemnify and hold harmless the other party from and against all claims, damages, losses, and expenses (including reasonable legal fees) arising out of any breach of this Agreement or any negligent or wrongful act by the indemnifying party.",
      "indemnification",
    ),
};

export function getDefaultClauses(contractType: ContractType): ContractClause[] {
  switch (contractType) {
    case "service-agreement":
      return [
        COMMON_CLAUSES.definitions("Services"),
        makeClause("Scope of Services", "The Service Provider agrees to provide the following services to the Client as outlined in Schedule A attached hereto. The Service Provider shall perform all services with due care, skill, and diligence in accordance with industry best practices.", "scope"),
        COMMON_CLAUSES.payment("within thirty (30) days of receipt of a valid invoice"),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.ip(),
        COMMON_CLAUSES.liability(),
        COMMON_CLAUSES.termination("thirty (30) days'"),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "nda":
      return [
        COMMON_CLAUSES.definitions("Confidential Information"),
        makeClause("Confidential Information", "\"Confidential Information\" shall mean all information, whether written, oral, electronic, or visual, disclosed by the Disclosing Party to the Receiving Party, including but not limited to trade secrets, business plans, financial data, customer lists, technical specifications, and any other proprietary information.", "confidentiality"),
        makeClause("Obligations of Receiving Party", "The Receiving Party shall: (a) use the Confidential Information solely for the Purpose; (b) not disclose any Confidential Information to third parties without prior written consent; (c) protect the Confidential Information with at least the same degree of care it uses for its own confidential information; (d) limit access to persons who have a need to know.", "confidentiality"),
        makeClause("Exclusions", "Confidential Information does not include information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was known to the Receiving Party prior to disclosure; (c) is independently developed without use of the Confidential Information; (d) is lawfully received from a third party without restriction.", "confidentiality"),
        makeClause("Term", "This Agreement shall remain in effect for a period of two (2) years from the Effective Date. The confidentiality obligations shall survive for an additional period of three (3) years after expiration or termination.", "general"),
        makeClause("Return of Information", "Upon termination or expiration of this Agreement, the Receiving Party shall promptly return or destroy all Confidential Information and any copies thereof, and shall provide written certification of such return or destruction.", "general"),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "employment-contract":
      return [
        COMMON_CLAUSES.definitions("Employment"),
        makeClause("Position and Duties", "The Employer hereby employs the Employee in the position of [Job Title]. The Employee shall perform all duties as reasonably assigned and shall report to [Supervisor]. The Employee agrees to devote their full working time, attention, and skill to the performance of their duties.", "scope"),
        makeClause("Compensation and Benefits", "The Employee shall receive a gross monthly salary of ZMW [Amount], payable on the last working day of each month. The Employee shall be entitled to benefits as outlined in the Employee Handbook, including medical insurance, pension contributions, and annual leave of [X] working days per year.", "payment"),
        makeClause("Working Hours", "The standard working hours shall be [X] hours per week, Monday through Friday. Overtime work shall be compensated in accordance with Zambian labour law. The Employee is entitled to public holidays as gazetted by the Government of the Republic of Zambia.", "general"),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.nonCompete(),
        COMMON_CLAUSES.ip(),
        makeClause("Notice Period", "Either party may terminate this contract by providing [X] months' written notice. The Employer may elect to pay salary in lieu of notice. During the notice period, the Employee shall continue to fulfil their duties unless otherwise directed.", "termination"),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "freelance-agreement":
      return [
        COMMON_CLAUSES.definitions("Services"),
        makeClause("Scope of Work", "The Contractor agrees to perform the services described in Schedule A (the \"Work\"). The Contractor shall have sole discretion over the manner and means of performing the Work, provided that the Work meets the specifications and deadlines agreed upon.", "scope"),
        makeClause("Deliverables", "The Contractor shall deliver the following deliverables by the agreed deadlines: [List deliverables]. All deliverables shall meet the quality standards as described in the project brief. The Client shall have [X] business days to review and provide feedback.", "scope"),
        COMMON_CLAUSES.payment("within fourteen (14) days of acceptance of deliverables"),
        makeClause("Independent Contractor Status", "The Contractor is an independent contractor and not an employee, agent, or partner of the Client. The Contractor shall be solely responsible for all taxes, insurance, and other obligations arising from this engagement.", "general"),
        COMMON_CLAUSES.ip(),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.termination("fourteen (14) days'"),
        COMMON_CLAUSES.indemnification(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "partnership-agreement":
      return [
        COMMON_CLAUSES.definitions("Partnership"),
        makeClause("Partnership Purpose", "The Partners hereby form a partnership for the purpose of [describe business purpose]. The Partnership shall operate under the name \"[Partnership Name]\" with its principal place of business at [Address], Lusaka, Zambia.", "scope"),
        makeClause("Capital Contributions", "Each Partner shall contribute the following to the Partnership: Partner A: ZMW [Amount] / [Assets]. Partner B: ZMW [Amount] / [Assets]. Additional contributions may be made by mutual written agreement.", "payment"),
        makeClause("Profit and Loss Sharing", "Profits and losses of the Partnership shall be shared between the Partners in the following ratio: Partner A: [X]% and Partner B: [Y]%. Distributions shall be made quarterly unless otherwise agreed.", "payment"),
        makeClause("Management and Decision-Making", "The Partners shall jointly manage the affairs of the Partnership. Decisions relating to ordinary business operations may be made by either Partner. Major decisions (expenditures exceeding ZMW [Amount], new contracts, etc.) require unanimous consent.", "general"),
        makeClause("Withdrawal and Dissolution", "A Partner may withdraw from the Partnership by providing six (6) months' written notice. Upon withdrawal, the remaining Partner(s) shall have the right to purchase the withdrawing Partner's interest at fair market value.", "termination"),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "lease-agreement":
      return [
        COMMON_CLAUSES.definitions("Lease"),
        makeClause("Property Description", "The Landlord agrees to lease to the Tenant the property located at [Full Address], Lusaka, Zambia (the \"Premises\"). The Premises comprises [description of property, size, features].", "scope"),
        makeClause("Lease Term", "The lease shall commence on [Start Date] and terminate on [End Date], for a total period of [Duration]. The Tenant may request renewal by providing ninety (90) days' written notice before the expiry date.", "general"),
        makeClause("Rent and Payment", "The Tenant shall pay a monthly rent of ZMW [Amount], due on the first day of each calendar month. Rent shall be paid by [bank transfer / mobile money] to the Landlord's designated account. Late payment shall attract a penalty of [X]% per month.", "payment"),
        makeClause("Security Deposit", "The Tenant shall pay a security deposit of ZMW [Amount] (equivalent to [X] months' rent) upon signing this Agreement. The deposit shall be refunded within thirty (30) days of vacating the Premises, less any deductions for damages or unpaid rent.", "payment"),
        makeClause("Maintenance and Repairs", "The Landlord shall be responsible for structural repairs and maintenance of the roof, walls, plumbing, and electrical systems. The Tenant shall maintain the interior of the Premises in good condition and report any defects promptly.", "general"),
        makeClause("Use of Property", "The Premises shall be used solely for [residential/commercial] purposes. The Tenant shall not make structural alterations without the Landlord's written consent. The Tenant shall comply with all applicable laws and regulations.", "general"),
        COMMON_CLAUSES.termination("ninety (90) days'"),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "sales-agreement":
      return [
        COMMON_CLAUSES.definitions("Sale"),
        makeClause("Product / Service Description", "The Seller agrees to sell and the Buyer agrees to purchase the following goods/services: [Detailed description]. Quantities, specifications, and quality standards shall be as described in Schedule A.", "scope"),
        makeClause("Price and Payment", "The total purchase price is ZMW [Amount]. Payment shall be made as follows: [X]% deposit upon signing, balance due upon delivery. All prices are quoted in Zambian Kwacha and are exclusive of VAT.", "payment"),
        makeClause("Delivery", "The Seller shall deliver the goods to [delivery location] on or before [delivery date]. Risk of loss shall transfer to the Buyer upon delivery. The Seller shall bear all shipping and insurance costs until delivery.", "general"),
        makeClause("Warranty", "The Seller warrants that the goods shall conform to the agreed specifications and be free from defects in material and workmanship for a period of [X] months from delivery. The Seller's sole obligation under this warranty shall be repair or replacement.", "liability"),
        makeClause("Returns and Refunds", "The Buyer may return defective goods within [X] days of delivery for a full refund or replacement. Returns must be accompanied by the original invoice and a written description of the defect.", "general"),
        COMMON_CLAUSES.liability(),
        COMMON_CLAUSES.forceMajeure(),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "consulting-agreement":
      return [
        COMMON_CLAUSES.definitions("Consulting Services"),
        makeClause("Scope of Services", "The Consultant shall provide professional consulting services as described in Schedule A. The Consultant shall use their best professional judgement and expertise in delivering the services. The Client shall provide reasonable access to information and personnel necessary for the Consultant to perform.", "scope"),
        makeClause("Fees and Expenses", "The Client shall pay the Consultant a fee of ZMW [Amount] per [hour/day/project]. Invoices shall be submitted [monthly/upon milestone completion] and are payable within thirty (30) days. Reasonable pre-approved expenses shall be reimbursed upon submission of receipts.", "payment"),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.ip(),
        makeClause("Non-Solicitation", "During the term of this Agreement and for twelve (12) months thereafter, the Consultant shall not directly or indirectly solicit any employee or contractor of the Client for employment or engagement.", "non-compete"),
        COMMON_CLAUSES.liability(),
        COMMON_CLAUSES.indemnification(),
        COMMON_CLAUSES.termination("thirty (30) days'"),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];

    // -- New industry-standard types ------------------------------------------

    case "motor-vehicle-sale":
      return [
        COMMON_CLAUSES.definitions("Motor Vehicle"),
        makeClause(
          "Vehicle Description",
          "The Seller agrees to sell and the Buyer agrees to purchase the following motor vehicle (hereinafter referred to as the \"Vehicle\"):\n\n" +
          "Make: _______________\n" +
          "Model: _______________\n" +
          "Year of Manufacture: _______________\n" +
          "Colour: _______________\n" +
          "Engine Number: _______________\n" +
          "Chassis / VIN Number: _______________\n" +
          "Registration Number: _______________\n" +
          "Current Mileage: _______________ km\n\n" +
          "The Vehicle is sold together with all its accessories, tools, spare wheel, and documents as listed in Schedule A.",
          "scope",
        ),
        makeClause(
          "Purchase Price and Payment",
          "The total purchase price for the Vehicle is ZMW [Amount] (Zambian Kwacha [Amount in Words] only).\n\n" +
          "Payment shall be made as follows:\n" +
          "(a) Deposit of ZMW [Amount] payable upon signing of this Agreement.\n" +
          "(b) Balance of ZMW [Amount] payable upon delivery and transfer of title.\n\n" +
          "Payment shall be made by [bank transfer / mobile money / cash]. The Seller shall issue an official receipt for all payments received.",
          "payment",
        ),
        makeClause(
          "Title and Transfer of Ownership",
          "The Seller warrants that they hold clear and unencumbered title to the Vehicle and have the legal right to sell it. The Seller shall transfer all original title documents (ZP38 Yellow Card / Title), road tax, and any other ownership documents to the Buyer upon receipt of full payment. The parties shall jointly complete the necessary RTSA (Road Transport and Safety Agency) transfer forms within fourteen (14) days of completion of this Agreement.",
          "general",
        ),
        makeClause(
          "Condition of Vehicle and Warranties",
          "The Vehicle is sold in its current condition as inspected by the Buyer. The Seller warrants that:\n" +
          "(a) The Vehicle has not been involved in any major accident that affects its structural integrity, save as disclosed in writing.\n" +
          "(b) All disclosed defects are set out in Schedule B.\n" +
          "(c) The odometer reading is accurate to the best of the Seller's knowledge.\n\n" +
          "Save for the above, the Vehicle is sold on an 'as is' basis. The Buyer is advised to conduct an independent mechanical inspection prior to signing this Agreement.",
          "liability",
        ),
        makeClause(
          "Risk and Insurance",
          "Risk of loss or damage to the Vehicle shall pass to the Buyer upon delivery of the Vehicle and transfer of all title documents. The Buyer shall be responsible for insuring the Vehicle from the date of delivery. Prior to delivery, the Vehicle shall remain at the risk of the Seller.",
          "general",
        ),
        makeClause(
          "Delivery",
          "The Seller shall deliver the Vehicle to the Buyer at [delivery location / address] on or before [date]. Delivery shall be deemed complete when the Vehicle, all keys, and all original documents are handed to the Buyer. The parties shall sign a Delivery Confirmation receipt at the time of delivery.",
          "general",
        ),
        makeClause(
          "Encumbrances and Outstanding Finance",
          "The Seller confirms that the Vehicle is free from any charge, mortgage, hire-purchase agreement, lien, or any other encumbrance. If, after transfer, any undisclosed encumbrance is discovered, the Seller shall indemnify the Buyer for all costs and losses arising.",
          "indemnification",
        ),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "property-sale-agreement":
      return [
        COMMON_CLAUSES.definitions("Property"),
        makeClause(
          "Property Description",
          "The Vendor agrees to sell and the Purchaser agrees to purchase the following property (hereinafter referred to as the \"Property\"):\n\n" +
          "Title / Deed Reference: _______________\n" +
          "Street Address: _______________\n" +
          "Stand Number: _______________\n" +
          "Plot Area: _______________ m²\n" +
          "Location / Township: _______________\n" +
          "City / Province: _______________\n\n" +
          "The Property is sold together with all permanent structures, fixtures, fittings, and improvements as described in Schedule A, unless specifically excluded herein.",
          "scope",
        ),
        makeClause(
          "Purchase Price and Payment Schedule",
          "The total purchase price for the Property is ZMW [Amount] (Zambian Kwacha [Amount in Words] only), payable as follows:\n\n" +
          "(a) Initial deposit of ZMW [Amount] payable within seven (7) days of signing this Agreement.\n" +
          "(b) Balance of ZMW [Amount] payable on or before the date of transfer of title at Lands and Deeds Registry.\n\n" +
          "All payments shall be made to the Vendor or the Vendor's Conveyancing Attorneys as directed. Receipts shall be issued for all payments.",
          "payment",
        ),
        makeClause(
          "Title and Conveyancing",
          "The Vendor warrants that they hold good and marketable title to the Property. The parties shall instruct a mutually agreed conveyancing attorney to attend to the formal transfer of the Property at the Zambia Lands and Deeds Registry within sixty (60) days of signing this Agreement. Costs of transfer, stamp duty, and registration fees shall be borne by the Purchaser unless otherwise agreed in writing.",
          "general",
        ),
        makeClause(
          "Vacant Possession",
          "The Vendor shall deliver vacant possession of the Property on the date of transfer of title or on such other date as the parties may agree in writing. Vacant possession means the Property shall be vacated by all occupants and cleared of all personal belongings not forming part of the sale.",
          "general",
        ),
        makeClause(
          "Condition of Property",
          "The Purchaser acknowledges that they have inspected the Property and accepts it in its current condition, subject to any defects disclosed by the Vendor in Schedule B. The Vendor shall not be liable for any latent defects arising after transfer, except in cases of deliberate concealment.",
          "liability",
        ),
        makeClause(
          "Risk and Insurance",
          "Risk of loss or damage to the Property shall pass to the Purchaser upon payment of the full purchase price and delivery of vacant possession. The Purchaser is advised to insure the Property from the date of transfer.",
          "general",
        ),
        makeClause(
          "Rates, Levies, and Outgoings",
          "All rates, ground rent, levies, and other municipal charges shall be settled by the Vendor up to the date of transfer. From the date of transfer, all such charges shall be for the account of the Purchaser.",
          "general",
        ),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "loan-agreement":
      return [
        COMMON_CLAUSES.definitions("Loan"),
        makeClause(
          "Loan Amount and Disbursement",
          "The Lender agrees to lend to the Borrower the sum of ZMW [Amount] (Zambian Kwacha [Amount in Words]) (hereinafter referred to as the \"Principal\"). The Lender shall disburse the Principal to the Borrower by [bank transfer to Account No. _______________ / mobile money to _______________] within [X] business days of the signing of this Agreement.",
          "scope",
        ),
        makeClause(
          "Purpose of Loan",
          "The Borrower shall apply the Principal solely for the purpose of [state purpose — e.g. business working capital, property acquisition, vehicle purchase]. Any change in purpose requires prior written consent from the Lender.",
          "general",
        ),
        makeClause(
          "Interest Rate",
          "The Principal shall bear interest at the rate of [X]% per annum (or [X]% per month), calculated on the outstanding balance from the date of disbursement. Interest shall be calculated on a [simple / compound] basis. In the event of default, a default interest rate of [X]% per month shall apply on all overdue amounts.",
          "payment",
        ),
        makeClause(
          "Repayment Schedule",
          "The Borrower shall repay the Principal together with accrued interest as follows:\n\n" +
          "(a) Total amount repayable: ZMW [Total Amount]\n" +
          "(b) Monthly instalment: ZMW [Instalment Amount]\n" +
          "(c) First repayment date: [Date]\n" +
          "(d) Number of instalments: [Number]\n" +
          "(e) Final repayment date: [Date]\n\n" +
          "All payments shall be made to the Lender's designated account by the first business day of each month.",
          "payment",
        ),
        makeClause(
          "Security / Collateral",
          "As security for repayment of the Loan, the Borrower provides the following as collateral:\n\n" +
          "[Describe security — e.g. Motor vehicle (Reg No. ___), Immovable property (Stand No. ___), Personal guarantee from ___]\n\n" +
          "The Lender shall have the right to enforce and realise the security in the event of default, in accordance with applicable Zambian law.",
          "general",
        ),
        makeClause(
          "Events of Default",
          "The following shall constitute an Event of Default:\n" +
          "(a) Failure to pay any instalment within seven (7) days of its due date.\n" +
          "(b) The Borrower becomes insolvent or enters liquidation proceedings.\n" +
          "(c) Any material misrepresentation made by the Borrower in this Agreement.\n" +
          "(d) Death, dissolution, or winding up of the Borrower (if a company).\n\n" +
          "Upon an Event of Default, the entire outstanding balance shall become immediately due and payable without further notice.",
          "termination",
        ),
        makeClause(
          "Prepayment",
          "The Borrower may prepay the Loan in whole or in part at any time upon seven (7) days' written notice to the Lender without incurring any prepayment penalty. Partial prepayments shall be applied first to outstanding interest, then to the Principal.",
          "general",
        ),
        COMMON_CLAUSES.indemnification(),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "shareholders-agreement":
      return [
        COMMON_CLAUSES.definitions("Company and Shareholders"),
        makeClause(
          "Company Details",
          "The Company in respect of which this Agreement is made is:\n\n" +
          "Company Name: _______________\n" +
          "Registration Number: _______________\n" +
          "Registered Address: _______________\n" +
          "Date of Incorporation: _______________\n\n" +
          "This Agreement binds all current and future shareholders of the Company.",
          "scope",
        ),
        makeClause(
          "Shareholding Structure",
          "As at the Effective Date, the issued share capital of the Company and the respective shareholdings are as follows:\n\n" +
          "Shareholder A: [Name] — [X] shares — ([X]%)\n" +
          "Shareholder B: [Name] — [X] shares — ([X]%)\n\n" +
          "Any increase in share capital or issue of new shares shall require the unanimous written consent of all Shareholders.",
          "scope",
        ),
        makeClause(
          "Board Composition and Management",
          "The Board of Directors shall comprise [X] directors. Each Shareholder holding more than [X]% of the issued share capital shall be entitled to nominate one (1) director. The Board shall meet at least quarterly. Decisions of the Board shall be by simple majority, except Reserved Matters which require unanimous consent.",
          "general",
        ),
        makeClause(
          "Dividend Policy",
          "Subject to the Company's financial position and applicable law, the Company shall declare dividends in proportion to each Shareholder's shareholding. The Board shall determine dividend distribution annually at the AGM. No Shareholder shall be entitled to demand a dividend payment.",
          "payment",
        ),
        makeClause(
          "Pre-Emption Rights",
          "Before transferring any shares to a third party, a transferring Shareholder must first offer those shares to the existing Shareholders pro rata to their existing holdings at the price proposed by the transferring Shareholder. Existing Shareholders shall have thirty (30) days to exercise their pre-emption right.",
          "general",
        ),
        makeClause(
          "Drag-Along and Tag-Along Rights",
          "Drag-Along: If Shareholders holding more than [X]% of the shares wish to sell to a bona fide third party, they may require the remaining Shareholders to sell their shares on the same terms.\n\nTag-Along: If a Shareholder wishes to sell to a third party, the remaining Shareholders shall have the right to include their shares in the sale on the same terms.",
          "general",
        ),
        makeClause(
          "Reserved Matters",
          "The following matters shall require the unanimous written consent of all Shareholders: (a) amendment of the Articles of Association; (b) merger, acquisition, or disposal of the Company or its business; (c) issue of new shares or dilution of existing shareholders; (d) incurring debt exceeding ZMW [Amount]; (e) appointment or removal of auditors; (f) entering into related-party transactions.",
          "general",
        ),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.nonCompete(),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "supply-agreement":
      return [
        COMMON_CLAUSES.definitions("Supply"),
        makeClause(
          "Scope and Products",
          "The Supplier agrees to supply and the Purchaser agrees to purchase the goods and/or materials described in Schedule A (hereinafter referred to as the \"Products\") on the terms set out herein. The parties may amend Schedule A by mutual written agreement without requiring an amendment to this Agreement.",
          "scope",
        ),
        makeClause(
          "Orders and Acceptance",
          "The Purchaser shall submit purchase orders to the Supplier in [writing / email / approved platform]. Each order shall specify the Products, quantities, delivery address, and required delivery date. The Supplier shall confirm acceptance of each order within [X] business days. An accepted order shall constitute a binding obligation.",
          "scope",
        ),
        makeClause(
          "Pricing and Payment",
          "Products shall be supplied at the prices set out in Schedule A unless varied by mutual written agreement with at least thirty (30) days' notice. Invoices are payable within [30/60] days of delivery. The Supplier reserves the right to charge interest at [X]% per month on overdue amounts.",
          "payment",
        ),
        makeClause(
          "Delivery and Risk",
          "The Supplier shall deliver Products to the Purchaser's specified address within the agreed lead time. Risk of loss shall pass to the Purchaser upon delivery. Title to the Products shall not pass until full payment is received (Retention of Title). All deliveries shall be accompanied by a delivery note.",
          "general",
        ),
        makeClause(
          "Quality and Inspection",
          "All Products shall conform to the specifications set out in Schedule A and applicable quality standards. The Purchaser shall inspect Products within five (5) business days of delivery and notify the Supplier of any defects. Failure to notify within this period shall constitute acceptance.",
          "liability",
        ),
        makeClause(
          "Warranty",
          "The Supplier warrants that Products shall be free from defects in materials and workmanship for [X] months from delivery. Defective Products shall be replaced or refunded at the Supplier's option. This warranty is the Purchaser's sole remedy for defective Products.",
          "liability",
        ),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.liability(),
        COMMON_CLAUSES.forceMajeure(),
        COMMON_CLAUSES.termination("sixty (60) days'"),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "mou":
      return [
        COMMON_CLAUSES.definitions("Collaboration"),
        makeClause(
          "Purpose and Background",
          "The Parties enter into this Memorandum of Understanding (\"MOU\") to record their mutual intent and understanding regarding [describe the collaboration / project / partnership]. This MOU establishes a framework for cooperation and sets out the guiding principles for the Parties' working relationship.",
          "scope",
        ),
        makeClause(
          "Scope of Collaboration",
          "The Parties intend to collaborate on the following activities:\n\n" +
          "(a) [Activity 1 — describe clearly]\n" +
          "(b) [Activity 2]\n" +
          "(c) [Activity 3]\n\n" +
          "The specific terms, deliverables, timelines, and financial arrangements for each activity shall be set out in separate binding agreements as required.",
          "scope",
        ),
        makeClause(
          "Roles and Responsibilities",
          "First Party shall be responsible for: [list responsibilities]\n" +
          "Second Party shall be responsible for: [list responsibilities]\n\n" +
          "Each Party shall designate a primary contact person and notify the other of any change in contact within five (5) business days.",
          "scope",
        ),
        makeClause(
          "Non-Binding Nature",
          "This MOU is a statement of intent only and does not constitute a legally binding agreement. Neither Party shall have any legally enforceable rights or obligations arising from this MOU, except for the provisions on Confidentiality and Governing Law which are binding.",
          "general",
        ),
        makeClause(
          "Financial Arrangements",
          "Unless separately agreed in writing, each Party shall bear its own costs and expenses incurred in connection with this MOU. Any joint expenditure shall be subject to a separate cost-sharing agreement signed by both Parties.",
          "payment",
        ),
        makeClause(
          "Term",
          "This MOU shall remain effective for a period of [X] month(s) / year(s) from the Effective Date, unless earlier terminated or extended by mutual written agreement. Either Party may terminate this MOU at any time by providing thirty (30) days' written notice.",
          "termination",
        ),
        COMMON_CLAUSES.confidentiality(),
        makeClause(
          "No Commitment to Future Agreement",
          "This MOU does not obligate either Party to enter into any future binding agreement. Nothing herein grants either Party any intellectual property rights, and no agency, partnership, or joint venture is created.",
          "general",
        ),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "construction-contract":
      return [
        COMMON_CLAUSES.definitions("Construction Project"),
        makeClause(
          "Project Description and Scope of Works",
          "The Contractor shall carry out and complete the following construction works (hereinafter referred to as the \"Works\"):\n\n" +
          "Project Name: _______________\n" +
          "Site Address: _______________\n" +
          "Nature of Works: _______________\n\n" +
          "The full scope of works is described in the Bill of Quantities, drawings, and specifications attached as Schedule A. The Contractor shall perform the Works in a good and workmanlike manner using materials of satisfactory quality.",
          "scope",
        ),
        makeClause(
          "Contract Sum and Payment Milestones",
          "The total contract sum is ZMW [Amount] (Zambian Kwacha [Amount in Words]), payable as follows:\n\n" +
          "(a) Mobilisation advance: [X]% upon commencement — ZMW [Amount]\n" +
          "(b) Foundation complete: [X]% — ZMW [Amount]\n" +
          "(c) Roof level complete: [X]% — ZMW [Amount]\n" +
          "(d) Plastering and fitting-out complete: [X]% — ZMW [Amount]\n" +
          "(e) Practical completion and handover: [X]% — ZMW [Amount]\n\n" +
          "Each milestone payment is due within fourteen (14) days of the Employer's written approval of the milestone.",
          "payment",
        ),
        makeClause(
          "Commencement and Completion",
          "The Contractor shall commence the Works on [Start Date] and shall achieve Practical Completion no later than [Completion Date] (the \"Completion Date\"), being a contract period of [X] weeks/months. Time is of the essence. Extensions of time may be granted only for Force Majeure or Employer-caused delays, and only upon the Contractor's written request within seven (7) days of the event.",
          "general",
        ),
        makeClause(
          "Liquidated Damages",
          "If the Contractor fails to achieve Practical Completion by the Completion Date, the Contractor shall pay the Employer liquidated damages at the rate of ZMW [Amount] per calendar day of delay, up to a maximum of [X]% of the Contract Sum. The parties acknowledge that this represents a genuine pre-estimate of the Employer's losses.",
          "liability",
        ),
        makeClause(
          "Retention",
          "The Employer shall retain five percent (5%) from each certified payment (\"Retention\") up to a maximum of ZMW [Amount]. One half of the Retention shall be released upon Practical Completion. The remaining half shall be released at the end of the Defects Liability Period.",
          "payment",
        ),
        makeClause(
          "Defects Liability",
          "The Contractor shall rectify all defects, shrinkages, or other faults appearing within twelve (12) months of Practical Completion (the \"Defects Liability Period\") at no additional cost to the Employer. If the Contractor fails to rectify within thirty (30) days of notification, the Employer may engage others to rectify and recover the cost from the Contractor.",
          "liability",
        ),
        makeClause(
          "Variations",
          "The Employer may at any time instruct Variations to the Works in writing. No Variation shall invalidate this Contract. The value of Variations shall be agreed upon in writing before the variation work commences. No additional payment shall be made for work carried out without a written Variation Order.",
          "general",
        ),
        makeClause(
          "Insurance",
          "The Contractor shall maintain throughout the project: (a) Contractor's All Risk Insurance covering the Works, plant, and materials; (b) Public Liability Insurance (minimum ZMW [Amount] per claim); (c) Employer's Liability / Workmen's Compensation Insurance as required by Zambian law. Evidence of insurance shall be provided to the Employer before commencement.",
          "general",
        ),
        COMMON_CLAUSES.forceMajeure(),
        COMMON_CLAUSES.termination("fourteen (14) days'"),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];
      return [
        COMMON_CLAUSES.definitions("Agreement"),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.payment("within thirty (30) days of invoice"),
        COMMON_CLAUSES.liability(),
        COMMON_CLAUSES.termination("thirty (30) days'"),
        COMMON_CLAUSES.disputeResolution(),
        COMMON_CLAUSES.governingLaw(),
        COMMON_CLAUSES.entireAgreement(),
      ];
  }
}

// ---------------------------------------------------------------------------
// Default Preamble per Contract Type
// ---------------------------------------------------------------------------

export function getDefaultPreamble(contractType: ContractType, partyAName: string, partyBName: string): string {
  const a = partyAName || "[Party A]";
  const b = partyBName || "[Party B]";
  switch (contractType) {
    case "nda":
      return `This Non-Disclosure Agreement is entered into for the purpose of preventing the unauthorised disclosure of Confidential Information as defined below. ${a} and ${b} agree to the following terms regarding the protection of confidential and proprietary information.`;
    case "employment-contract":
      return `This Employment Contract sets forth the terms and conditions under which ${a} agrees to employ ${b}. Both parties acknowledge and agree that this contract is governed by the Employment Act of Zambia and any other applicable legislation.`;
    case "partnership-agreement":
      return `This Partnership Agreement is entered into by ${a} and ${b} who desire to form a partnership and agree upon the terms and conditions governing its operations, management, and dissolution.`;
    case "lease-agreement":
      return `This Lease Agreement is entered into between ${a} (hereinafter referred to as the "Landlord") and ${b} (hereinafter referred to as the "Tenant") for the lease of the property described herein, subject to the following terms and conditions.`;
    case "motor-vehicle-sale":
      return `This Motor Vehicle Sale Agreement is entered into between ${a} (hereinafter referred to as the "Seller") and ${b} (hereinafter referred to as the "Buyer"), for the sale and purchase of the motor vehicle described herein. The parties agree to the terms and conditions set forth below, and confirm that this Agreement constitutes the complete record of their transaction.`;
    case "property-sale-agreement":
      return `This Property Sale Agreement is entered into between ${a} (hereinafter referred to as the "Vendor") and ${b} (hereinafter referred to as the "Purchaser"), for the sale and purchase of the immovable property described herein on the terms and conditions stated below. This Agreement is subject to the provisions of the Lands and Deeds Registry Act and all applicable laws of the Republic of Zambia.`;
    case "loan-agreement":
      return `This Loan Agreement is entered into between ${a} (hereinafter referred to as the "Lender") and ${b} (hereinafter referred to as the "Borrower"). The Lender agrees to advance a loan to the Borrower on the terms set out herein, and the Borrower agrees to repay such loan in accordance with the repayment schedule below.`;
    case "shareholders-agreement":
      return `This Shareholders Agreement is entered into between ${a} and ${b} (collectively referred to as the "Shareholders"), in relation to their shareholding in the Company described herein. The Shareholders agree to regulate their rights, obligations, and relationship as shareholders of the Company in accordance with the terms of this Agreement.`;
    case "supply-agreement":
      return `This Supply Agreement is entered into between ${a} (hereinafter referred to as the "Supplier") and ${b} (hereinafter referred to as the "Purchaser") for the ongoing supply of goods and materials as described herein. The parties agree to act in good faith and in accordance with the terms and conditions set out in this Agreement.`;
    case "mou":
      return `This Memorandum of Understanding is entered into in a spirit of mutual cooperation between ${a} and ${b}. The parties record their shared understanding, intentions, and the framework for their collaboration as described herein. This MOU is not intended to create legally binding obligations except as expressly stated.`;
    case "construction-contract":
      return `This Construction Contract is entered into between ${a} (hereinafter referred to as the "Contractor") and ${b} (hereinafter referred to as the "Employer" or "Owner") for the execution and completion of the construction works described herein. The parties have agreed to the contract sum, programme, and conditions set forth in this Agreement and its Schedules.`;
    default:
      return `This Agreement is entered into between ${a} and ${b} on the terms and conditions set forth herein. Both parties have read, understood, and agree to be bound by the provisions of this Agreement.`;
  }
}

// ---------------------------------------------------------------------------
// Factory: Create default contract form
// ---------------------------------------------------------------------------

export function createDefaultContractForm(contractType: ContractType = "service-agreement"): ContractFormData {
  const config = CONTRACT_TYPE_CONFIGS[contractType];
  const today = new Date().toISOString().slice(0, 10);

  return {
    contractType,
    documentInfo: {
      title: config.defaultTitle,
      subtitle: "",
      effectiveDate: today,
      expiryDate: "",
      jurisdiction: "Republic of Zambia",
      governingLaw: "Laws of the Republic of Zambia",
      referenceNumber: "",
      showConfidentialBanner: contractType === "nda",
      showTableOfContents: true,
      preambleText: getDefaultPreamble(contractType, "", ""),
    },
    partyA: {
      role: config.partyARole,
      name: "",
      address: "",
      city: "Lusaka",
      country: "Zambia",
      representative: "",
      representativeTitle: "",
      phone: "",
      email: "",
      taxId: "",
      registrationNumber: "",
    },
    partyB: {
      role: config.partyBRole,
      name: "",
      address: "",
      city: "Lusaka",
      country: "Zambia",
      representative: "",
      representativeTitle: "",
      phone: "",
      email: "",
      taxId: "",
      registrationNumber: "",
    },
    clauses: getDefaultClauses(contractType),
    signatureConfig: {
      showDate: true,
      showWitness: true,
      witnessCount: 1,
      showSeal: false,
      lineStyle: "solid",
    },
    style: {
      template: "corporate-blue",
      accentColor: "#1e40af",
      fontPairing: "inter-inter",
      headerStyle: "banner",
      pageNumbering: true,
      pageNumberPosition: "bottom-center",
    },
    printConfig: {
      pageSize: "a4",
      showPageBorder: false,
      showWatermark: false,
      watermarkText: "DRAFT",
    },
  };
}

// ---------------------------------------------------------------------------
// Convert between contract types (preserves user-entered data)
// ---------------------------------------------------------------------------

export function convertContractType(
  current: ContractFormData,
  newType: ContractType,
): ContractFormData {
  const config = CONTRACT_TYPE_CONFIGS[newType];

  return {
    ...current,
    contractType: newType,
    documentInfo: {
      ...current.documentInfo,
      title: config.defaultTitle,
      showConfidentialBanner: newType === "nda" ? true : current.documentInfo.showConfidentialBanner,
      preambleText: getDefaultPreamble(newType, current.partyA.name, current.partyB.name),
    },
    partyA: { ...current.partyA, role: config.partyARole },
    partyB: { ...current.partyB, role: config.partyBRole },
    clauses: getDefaultClauses(newType),
  };
}
