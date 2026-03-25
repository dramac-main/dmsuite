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
  "tenancy-agreement",
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
    description: "Commercial property lease under the Landlord and Tenant (Business Premises) Act, Cap. 190",
    defaultTitle: "Lease Agreement",
    partyARole: "Landlord",
    partyBRole: "Tenant",
  },
  "tenancy-agreement": {
    id: "tenancy-agreement",
    label: "Residential Tenancy Agreement",
    shortLabel: "Tenancy",
    icon: "home",
    description: "Residential tenancy agreement under the Rent Act, Cap. 206 and common law of Zambia",
    defaultTitle: "Residential Tenancy Agreement",
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
  showCoverPage: z.boolean().default(true),
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
  // ── Standard Legal (DEFAULT) ─────────────────────────────────────────────
  {
    id: "standard-legal",
    name: "Standard Legal",
    category: "classic",
    accent: "#111827",
    headerStyle: "centered",
    fontSuggestion: "crimsonpro-worksans",
    borderStyle: "thin",
    watermark: "none",
    headerDivider: "double-line",
    footerStyle: "line",
    decorative: "page-border",
  },
  // ── Legal Classic ────────────────────────────────────────────────────────
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
  // ── Government Formal ────────────────────────────────────────────────────
  {
    id: "government-formal",
    name: "Government Formal",
    category: "classic",
    accent: "#0f172a",
    headerStyle: "centered",
    fontSuggestion: "cormorant-proza",
    borderStyle: "thin",
    watermark: "none",
    headerDivider: "thick-line",
    footerStyle: "line",
    decorative: "page-border",
  },
  // ── Corporate Blue ───────────────────────────────────────────────────────
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
  // ── Modern Minimal ───────────────────────────────────────────────────────
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
  // ── Corporate Green ──────────────────────────────────────────────────────
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
  // ── Elegant Gray ─────────────────────────────────────────────────────────
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
  // ── Forest Law ───────────────────────────────────────────────────────────
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
  // ── Warm Parchment ───────────────────────────────────────────────────────
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
      `In this Agreement, unless the context otherwise requires: "${ctx}" refers to the terms and obligations outlined herein. "Confidential Information" means any proprietary information disclosed by either party. "Effective Date" means the date first written above. "ZMW" means Zambian Kwacha, the lawful currency of the Republic of Zambia.`,
      "definitions",
    ),
  confidentiality: () =>
    makeClause(
      "Confidentiality",
      "Each party agrees to hold in strict confidence all Confidential Information received from the other party. Confidential Information shall not be disclosed to any third party without prior written consent. This obligation shall survive termination of this Agreement for a period of two (2) years. Nothing in this clause prevents disclosure required by law, regulation, or order of any Zambian court or regulatory authority.",
      "confidentiality",
    ),
  nonCompete: () =>
    makeClause(
      "Non-Compete",
      "During the term of this Agreement and for a period of twelve (12) months thereafter, neither party shall engage in any business that directly competes with the other party within the agreed territory, unless expressly authorised in writing. This restraint is limited in scope and duration to what is reasonably necessary to protect legitimate business interests, in accordance with the common law of the Republic of Zambia.",
      "non-compete",
    ),
  payment: (terms: string) =>
    makeClause(
      "Payment Terms",
      `Payment shall be made in Zambian Kwacha (ZMW) ${terms}. Late payments shall incur interest at the rate of 2% per month on the outstanding amount. All amounts stated are exclusive of Value Added Tax (VAT) at the prescribed rate under the Value Added Tax Act (Chapter 331). Withholding Tax shall be deducted in accordance with the Income Tax Act (Chapter 323) where applicable, and a withholding tax certificate shall be provided.`,
      "payment",
    ),
  liability: () =>
    makeClause(
      "Limitation of Liability",
      "Neither party shall be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with this Agreement, regardless of the cause of action. The total aggregate liability of either party shall not exceed the total fees paid or payable under this Agreement. Nothing in this clause limits liability for fraud, wilful misconduct, death, or personal injury caused by negligence.",
      "liability",
    ),
  ip: () =>
    makeClause(
      "Intellectual Property",
      "All intellectual property created during the course of this Agreement shall be owned as specified herein. Pre-existing intellectual property remains the sole property of the originating party. Any jointly developed IP shall be subject to a separate written agreement. Intellectual property rights are subject to the Patents Act (Chapter 400), the Copyright and Performance Rights Act (No. 44 of 1994), and the Trade Marks Act (Chapter 401) of Zambia.",
      "intellectual-property",
    ),
  termination: (notice: string) =>
    makeClause(
      "Termination",
      `Either party may terminate this Agreement by providing ${notice} written notice to the other party. Upon termination, all obligations shall cease except those which by their nature survive termination, including confidentiality, intellectual property, indemnification, and payment provisions for work already performed or delivered.`,
      "termination",
    ),
  disputeResolution: () =>
    makeClause(
      "Dispute Resolution",
      "Any dispute arising from this Agreement shall first be resolved through good-faith negotiation between the parties. If negotiation fails within thirty (30) days, the dispute shall be referred to mediation. If mediation is unsuccessful within a further thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act (No. 19 of 2000) of the Republic of Zambia, or, at either party's election, to the jurisdiction of the courts of Lusaka.",
      "dispute-resolution",
    ),
  governingLaw: () =>
    makeClause(
      "Governing Law",
      "This Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia. The parties irrevocably submit to the jurisdiction of the courts of Lusaka, or to arbitration in accordance with the Arbitration Act (No. 19 of 2000), for the resolution of any disputes arising hereunder.",
      "general",
    ),
  forceMajeure: () =>
    makeClause(
      "Force Majeure",
      "Neither party shall be liable for any failure or delay in performance under this Agreement due to circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, government actions or sanctions, epidemics or pandemics, civil unrest, strikes, or failure of third-party telecommunications or utilities. The affected party shall notify the other party in writing within seven (7) days of the event and use reasonable efforts to mitigate its effects.",
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
      "This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, warranties, commitments, offers, and agreements, whether written or oral. Each party acknowledges that it has not relied on any statement, promise, or representation not set forth in this Agreement.",
      "general",
    ),
  indemnification: () =>
    makeClause(
      "Indemnification",
      "Each party agrees to indemnify and hold harmless the other party from and against all claims, damages, losses, and expenses (including reasonable legal fees) arising out of any breach of this Agreement or any negligent or wrongful act by the indemnifying party. The indemnified party shall provide prompt written notice of any claim and allow the indemnifying party to control the defence of such claim.",
      "indemnification",
    ),
};

export function getDefaultClauses(contractType: ContractType): ContractClause[] {
  switch (contractType) {
    case "service-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Service Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Client\" means the party named herein as Client.\n" +
          "(b) \"Service Provider\" means the party named herein as Service Provider.\n" +
          "(c) \"Services\" means the services described in Clause 2 and Schedule A.\n" +
          "(d) \"Deliverables\" means all outputs, reports, documents, and materials produced by the Service Provider in performing the Services.\n" +
          "(e) \"Effective Date\" means the date on which both parties have executed this Agreement.\n" +
          "(f) \"Confidential Information\" means all non-public information disclosed by either party in connection with this Agreement.\n" +
          "(g) \"Business Day\" means any day other than a Saturday, Sunday, or public holiday gazetted by the Government of the Republic of Zambia.\n\n" +
          "This Agreement is governed by the Laws of the Republic of Zambia, including the Sale of Goods Act (Chapter 388), the Competition and Consumer Protection Act (No. 24 of 2010), and the Value Added Tax Act (Chapter 331).",
          "definitions",
        ),
        makeClause(
          "Scope of Services",
          "The Service Provider agrees to provide the following services to the Client as outlined in Schedule A attached hereto (the \"Services\"):\n\n" +
          "[Description of Services]\n\n" +
          "The Service Provider shall:\n" +
          "(a) Perform all Services with due care, skill, and diligence in accordance with industry best practices and professional standards;\n" +
          "(b) Comply with all applicable laws and regulations of the Republic of Zambia;\n" +
          "(c) Allocate sufficient qualified personnel to perform the Services;\n" +
          "(d) Provide regular progress reports as agreed between the parties;\n" +
          "(e) Notify the Client promptly of any circumstances that may affect the timely or adequate performance of the Services.\n\n" +
          "Any variation to the scope of Services shall be agreed in writing by both parties before implementation.",
          "scope",
        ),
        makeClause(
          "Duration and Milestones",
          "The Services shall commence on [Start Date] and shall be completed by [End Date], unless extended by mutual written agreement.\n\n" +
          "Key milestones (if applicable):\n" +
          "(a) Phase 1: [Description] — Due: [Date]\n" +
          "(b) Phase 2: [Description] — Due: [Date]\n" +
          "(c) Final Delivery: [Description] — Due: [Date]\n\n" +
          "Time is of the essence unless otherwise agreed in writing.",
          "general",
        ),
        makeClause(
          "Fees and Payment",
          "The Client shall pay the Service Provider the following fees for the Services:\n\n" +
          "Total Fee: ZMW [Amount] (Zambian Kwacha [Amount in Words] only)\n" +
          "Payment Structure: [Fixed fee / Hourly rate of ZMW _____ / Milestone-based]\n\n" +
          "Invoices shall be submitted [monthly / upon milestone completion] and are payable within thirty (30) days of receipt of a valid invoice. All fees are exclusive of Value Added Tax (VAT) at the applicable rate of 16% under the Value Added Tax Act, Chapter 331.\n\n" +
          "Late payments shall attract interest at the rate of two percent (2%) per month on the outstanding balance from the due date. The Service Provider may withhold Deliverables until outstanding invoices are settled.\n\n" +
          "Where applicable, the Client shall deduct Withholding Tax at the rate prescribed by the Income Tax Act (Chapter 323) and provide the Service Provider with a withholding tax certificate.",
          "payment",
        ),
        COMMON_CLAUSES.confidentiality(),
        makeClause(
          "Intellectual Property",
          "All Deliverables created by the Service Provider specifically for the Client under this Agreement shall become the property of the Client upon full payment of all fees.\n\n" +
          "The Service Provider retains ownership of all pre-existing intellectual property, tools, methodologies, and know-how. The Service Provider grants the Client a non-exclusive, perpetual licence to use any pre-existing IP embedded in the Deliverables, solely for the purpose contemplated by this Agreement.\n\n" +
          "The Service Provider warrants that the Deliverables shall not infringe the intellectual property rights of any third party. This clause is subject to the Patents Act (Chapter 400), the Trade Marks Act (Chapter 401), and the Copyright and Performance Rights Act (No. 44 of 1994) of Zambia.",
          "intellectual-property",
        ),
        COMMON_CLAUSES.liability(),
        COMMON_CLAUSES.indemnification(),
        makeClause(
          "Termination",
          "Either party may terminate this Agreement:\n\n" +
          "(a) By giving thirty (30) days' written notice to the other party;\n" +
          "(b) Immediately upon written notice if the other party commits a material breach and fails to remedy it within fourteen (14) days of receiving written notice of the breach;\n" +
          "(c) Immediately if the other party becomes insolvent, enters liquidation, or has a receiver appointed.\n\n" +
          "Upon termination, the Client shall pay for all Services satisfactorily performed up to the date of termination. The Service Provider shall deliver all completed and partially completed Deliverables to the Client. Clauses relating to Confidentiality, Intellectual Property, Liability, and Dispute Resolution shall survive termination.",
          "termination",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from or in connection with this Service Agreement shall first be resolved through good-faith negotiation between the parties within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation under the Arbitration Act (No. 19 of 2000). If mediation is unsuccessful within thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act, or either party may refer the matter to the courts of the Republic of Zambia.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Service Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Sale of Goods Act (Chapter 388), the Competition and Consumer Protection Act (No. 24 of 2010), the Value Added Tax Act (Chapter 331), the Income Tax Act (Chapter 323), and the Arbitration Act (No. 19 of 2000).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "nda":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Non-Disclosure Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Disclosing Party\" means the party disclosing Confidential Information under this Agreement.\n" +
          "(b) \"Receiving Party\" means the party receiving Confidential Information under this Agreement.\n" +
          "(c) \"Confidential Information\" shall mean all information, whether written, oral, electronic, visual, or in any other form, disclosed by or on behalf of the Disclosing Party to the Receiving Party, including but not limited to trade secrets, business plans, financial data, customer and supplier lists, pricing information, marketing strategies, technical specifications, software code, inventions, designs, processes, and any other proprietary or commercially sensitive information.\n" +
          "(d) \"Purpose\" means [describe the purpose for which Confidential Information is being shared].\n" +
          "(e) \"Representative\" means any director, officer, employee, agent, adviser, or consultant of a party.\n\n" +
          "This Agreement is governed by the Laws of the Republic of Zambia, including the Copyright and Performance Rights Act (No. 44 of 1994), the Patents Act (Chapter 400), the Trade Marks Act (Chapter 401), and the Competition and Consumer Protection Act (No. 24 of 2010).",
          "definitions",
        ),
        makeClause(
          "Scope of Confidential Information",
          "Confidential Information includes, without limitation:\n\n" +
          "(a) Technical information: inventions, designs, drawings, specifications, processes, formulae, software, algorithms, prototypes, and research data;\n" +
          "(b) Business information: business plans, financial statements and projections, pricing, customer and supplier data, sales figures, marketing strategies, tender documents, and contracts;\n" +
          "(c) Legal information: pending or threatened litigation, regulatory submissions, and intellectual property filings;\n" +
          "(d) Personnel information: employee data, organisational structure, compensation details;\n" +
          "(e) Any information marked 'Confidential', 'Proprietary', or with similar designation;\n" +
          "(f) Information that, by its nature or the circumstances of disclosure, would reasonably be understood to be confidential.\n\n" +
          "Confidential Information may be disclosed in writing, orally, by demonstration, or by any other means.",
          "confidentiality",
        ),
        makeClause(
          "Obligations of Receiving Party",
          "The Receiving Party shall:\n\n" +
          "(a) Use the Confidential Information solely for the Purpose and for no other purpose;\n" +
          "(b) Not disclose any Confidential Information to any third party without the prior written consent of the Disclosing Party;\n" +
          "(c) Protect the Confidential Information with at least the same degree of care it uses to protect its own confidential information, and in any event with no less than reasonable care;\n" +
          "(d) Limit access to the Confidential Information to those Representatives who have a genuine need to know for the Purpose;\n" +
          "(e) Ensure that all Representatives who receive access are bound by confidentiality obligations no less protective than those contained herein;\n" +
          "(f) Promptly notify the Disclosing Party if it becomes aware of any unauthorised use, disclosure, or loss of Confidential Information;\n" +
          "(g) Not copy or reproduce the Confidential Information except as reasonably necessary for the Purpose.\n\n" +
          "The Receiving Party shall be liable for any breach of this Agreement by its Representatives.",
          "confidentiality",
        ),
        makeClause(
          "Exclusions from Confidentiality",
          "The obligations under this Agreement shall not apply to information that:\n\n" +
          "(a) Is or becomes publicly available through no fault or act of the Receiving Party;\n" +
          "(b) Was already in the lawful possession of the Receiving Party prior to disclosure, as evidenced by written records;\n" +
          "(c) Is independently developed by the Receiving Party without reference to or use of the Confidential Information;\n" +
          "(d) Is lawfully received from a third party who is not under any obligation of confidentiality to the Disclosing Party;\n" +
          "(e) Is required to be disclosed by law, regulation, court order, or governmental authority — provided that the Receiving Party gives the Disclosing Party prompt written notice (where legally permitted) to allow the Disclosing Party to seek a protective order.",
          "confidentiality",
        ),
        makeClause(
          "Term and Survival",
          "This Agreement shall remain in effect for a period of [2/3/5] year(s) from the Effective Date (the \"Term\").\n\n" +
          "The confidentiality obligations imposed by this Agreement shall survive the expiration or termination of this Agreement for an additional period of [3/5] year(s).\n\n" +
          "Trade secrets shall remain protected for as long as they retain the character of a trade secret under applicable Zambian law.",
          "general",
        ),
        makeClause(
          "Return and Destruction of Information",
          "Upon expiration or termination of this Agreement, or upon written request by the Disclosing Party at any time, the Receiving Party shall within fourteen (14) days:\n\n" +
          "(a) Return all tangible materials containing Confidential Information (documents, files, media, samples);\n" +
          "(b) Permanently delete or destroy all electronic copies of Confidential Information;\n" +
          "(c) Provide written certification signed by an authorised officer confirming completion of such return or destruction.\n\n" +
          "The Receiving Party may retain one (1) archival copy solely for compliance and legal purposes, subject to continued confidentiality obligations.",
          "general",
        ),
        makeClause(
          "Remedies",
          "The parties acknowledge that any breach of this Agreement may cause irreparable harm to the Disclosing Party for which monetary damages alone may not be adequate. In the event of a breach or threatened breach, the Disclosing Party shall be entitled to seek:\n\n" +
          "(a) Injunctive relief (interdict) from the High Court of Zambia;\n" +
          "(b) Specific performance;\n" +
          "(c) Damages, including consequential damages attributable to the breach;\n" +
          "(d) Any other remedy available at law or in equity.\n\n" +
          "Such remedies shall not be mutually exclusive and shall be in addition to any other rights the Disclosing Party may have under Zambian law.",
          "liability",
        ),
        makeClause(
          "No Grant of Rights",
          "Nothing in this Agreement shall be construed as granting the Receiving Party any licence, intellectual property rights, or other rights in or to the Confidential Information, except the limited right to use it for the Purpose.\n\n" +
          "All Confidential Information remains the exclusive property of the Disclosing Party. Intellectual property rights are reserved in accordance with the Patents Act (Chapter 400), the Trade Marks Act (Chapter 401), and the Copyright and Performance Rights Act (No. 44 of 1994) of Zambia.",
          "intellectual-property",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from or in connection with this Agreement shall first be resolved through good-faith negotiation within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation. If mediation is unsuccessful within thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act (No. 19 of 2000), or either party may refer the matter to the High Court of Zambia.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Non-Disclosure Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Copyright and Performance Rights Act (No. 44 of 1994), the Patents Act (Chapter 400), the Trade Marks Act (Chapter 401), the Competition and Consumer Protection Act (No. 24 of 2010), and the Arbitration Act (No. 19 of 2000).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "employment-contract":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Employment Contract, unless the context otherwise requires:\n\n" +
          "(a) \"Employer\" means the party named herein as Employer.\n" +
          "(b) \"Employee\" means the party named herein as Employee.\n" +
          "(c) \"Commencement Date\" means the date on which the Employee begins active service.\n" +
          "(d) \"Probationary Period\" means the initial assessment period specified herein.\n" +
          "(e) \"Gross Salary\" means the total remuneration before statutory deductions.\n" +
          "(f) \"Net Salary\" means the amount payable after deduction of PAYE (Income Tax), NAPSA, and any other authorised deductions.\n\n" +
          "This Employment Contract is made in compliance with the Employment Code Act, 2019 (No. 3 of 2019), the Minimum Wages and Conditions of Employment Act (Chapter 276), and the National Pension Scheme Authority Act (No. 40 of 1996).",
          "definitions",
        ),
        makeClause(
          "Position and Duties",
          "The Employer hereby employs the Employee in the position of [Job Title], based at [Work Location], Zambia.\n\n" +
          "The Employee shall:\n" +
          "(a) Perform all duties as reasonably assigned and as described in the Job Description attached as Schedule A;\n" +
          "(b) Report to [Supervisor Name / Title];\n" +
          "(c) Devote their full working time, attention, and skill to the performance of their duties;\n" +
          "(d) Comply with all lawful instructions, policies, and procedures of the Employer;\n" +
          "(e) Act in good faith and in the best interests of the Employer at all times.\n\n" +
          "The Employer reserves the right to reasonably reassign duties or transfer the Employee to another location with adequate notice.",
          "scope",
        ),
        makeClause(
          "Probationary Period",
          "The Employee's appointment is subject to a probationary period of [3/6] months commencing on the Commencement Date. During the probationary period:\n\n" +
          "(a) Either party may terminate this contract by giving fourteen (14) days' written notice;\n" +
          "(b) The Employer shall assess the Employee's performance, conduct, and suitability for the role;\n" +
          "(c) At the end of the probationary period, the Employer shall confirm, extend, or terminate the appointment in writing.\n\n" +
          "The probationary period may be extended once, by a further period not exceeding the original probationary period, upon written notice to the Employee with reasons for the extension.",
          "general",
        ),
        makeClause(
          "Compensation and Benefits",
          "The Employee shall receive the following remuneration:\n\n" +
          "Gross Monthly Salary: ZMW [Amount]\n" +
          "Payment Date: Last working day of each calendar month\n" +
          "Payment Method: Bank transfer to the Employee's designated account\n\n" +
          "Statutory Deductions (deducted at source):\n" +
          "(a) Pay As You Earn (PAYE) — as per the Income Tax Act, Chapter 323\n" +
          "(b) National Pension Scheme Authority (NAPSA) — 5% Employee contribution (Employer contributes 5%)\n\n" +
          "Additional Benefits (if applicable):\n" +
          "(a) Medical Insurance: [Details / N/A]\n" +
          "(b) Housing Allowance: ZMW [Amount / N/A]\n" +
          "(c) Transport Allowance: ZMW [Amount / N/A]\n" +
          "(d) Lunch Allowance: ZMW [Amount / N/A]\n" +
          "(e) Communication Allowance: ZMW [Amount / N/A]\n" +
          "(f) Gratuity: [X]% of basic salary per completed year of service, payable on termination / N/A\n\n" +
          "Salary reviews shall be conducted annually at the Employer's discretion.",
          "payment",
        ),
        makeClause(
          "Working Hours and Overtime",
          "The standard working hours shall be [X] hours per week, [Monday through Friday / Monday through Saturday], from [Start Time] to [End Time], with a one-hour lunch break.\n\n" +
          "In accordance with Section 39 of the Employment Code Act, 2019 (No. 3 of 2019), working hours shall not exceed forty-eight (48) hours per week. Overtime work shall be voluntary and compensated at:\n" +
          "(a) Weekdays: 1.5 times the normal hourly rate;\n" +
          "(b) Saturdays: 1.5 times the normal hourly rate;\n" +
          "(c) Sundays and Public Holidays: 2 times the normal hourly rate.\n\n" +
          "Overtime shall not exceed forty-eight (48) hours in any four-week period (Section 40 of the Employment Code Act, 2019).",
          "general",
        ),
        makeClause(
          "Leave Entitlements",
          "The Employee shall be entitled to the following leave:\n\n" +
          "(a) Annual Leave: Twenty-four (24) working days per year (Section 42, Employment Code Act 2019). Leave shall accrue from the Commencement Date and may be taken after completion of the probationary period.\n" +
          "(b) Sick Leave: Twenty-six (26) working days per year at full pay, upon production of a medical certificate (Section 44, Employment Code Act 2019).\n" +
          "(c) Maternity Leave: Fourteen (14) weeks with the first seven (7) weeks at full pay (Section 46, Employment Code Act 2019).\n" +
          "(d) Paternity Leave: Five (5) working days at full pay (Section 47, Employment Code Act 2019).\n" +
          "(e) Compassionate Leave: [X] days per annum for bereavement of immediate family members.\n" +
          "(f) Public Holidays: As gazetted by the Government of the Republic of Zambia.\n\n" +
          "Unused annual leave may not be carried over beyond six (6) months into the following year unless agreed in writing.",
          "general",
        ),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.nonCompete(),
        COMMON_CLAUSES.ip(),
        makeClause(
          "Termination and Notice Period",
          "After confirmation of employment:\n\n" +
          "(a) Either party may terminate this contract by giving [1/2/3] month(s)' written notice, or the Employer may pay salary in lieu of notice.\n" +
          "(b) The minimum statutory notice period is one (1) month for monthly-paid employees, fourteen (14) days for fortnightly-paid employees, or one pay period otherwise (Section 53, Employment Code Act 2019).\n\n" +
          "Summary Dismissal: The Employer may dismiss the Employee without notice for gross misconduct, including but not limited to:\n" +
          "(a) Fraud, theft, dishonesty, or criminal conduct;\n" +
          "(b) Serious negligence causing damage to the Employer;\n" +
          "(c) Gross insubordination or refusal to obey lawful instructions;\n" +
          "(d) Intoxication at work;\n" +
          "(e) Breach of confidentiality.\n\n" +
          "The Employee shall be given the opportunity to be heard before any disciplinary action is taken, in accordance with the principles of natural justice and Section 52 of the Employment Code Act, 2019 (which requires the Employer to provide valid reasons for termination).\n\n" +
          "Redundancy: In the event of redundancy, the Employee shall be entitled to severance pay of not less than twenty-five percent (25%) of basic pay for each completed year of service, in accordance with Section 54 of the Employment Code Act, 2019. Additionally, for contracts of two (2) or more years, the Employee shall be entitled to gratuity as per Section 73.",
          "termination",
        ),
        makeClause(
          "Code of Conduct",
          "The Employee shall at all times conduct themselves in a professional manner and comply with the Employer's Code of Conduct, Employee Handbook, and all applicable policies. The Employee shall:\n\n" +
          "(a) Not engage in any activity that constitutes a conflict of interest;\n" +
          "(b) Not accept gifts, bribes, or inducements from third parties in connection with their employment;\n" +
          "(c) Report any suspected fraud, corruption, or misconduct;\n" +
          "(d) Comply with workplace health and safety regulations as required by the Occupational Health and Safety Act, No. 16 of 2025.",
          "general",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Employment Contract shall first be addressed through the Employer's internal grievance procedure. If the dispute is not resolved within fourteen (14) days, either party may refer the matter to the Labour Commissioner for conciliation under the Employment Code Act, 2019 (No. 3 of 2019). If conciliation fails, the matter may be referred to the Industrial Relations Court under the Industrial and Labour Relations Act (Chapter 269).",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Employment Contract shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Employment Code Act, 2019 (No. 3 of 2019), the Industrial and Labour Relations Act (Chapter 269), the Minimum Wages and Conditions of Employment Act (Chapter 276), the National Pension Scheme Authority Act (No. 40 of 1996), the Occupational Health and Safety Act (No. 16 of 2025), the Workers' Compensation Act (Chapter 271), the Income Tax Act (Chapter 323), and the Constitution of Zambia (Amendment) Act, 2016.",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "freelance-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Freelance Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Client\" means the party engaging the Contractor's services.\n" +
          "(b) \"Contractor\" means the independent freelance professional engaged under this Agreement.\n" +
          "(c) \"Services\" means the work described in Clause 2 and Schedule A.\n" +
          "(d) \"Deliverables\" means all outputs, work product, designs, code, reports, and materials produced under this Agreement.\n" +
          "(e) \"Project Fee\" means the total compensation payable to the Contractor.\n" +
          "(f) \"Effective Date\" means the date of execution of this Agreement by both parties.\n\n" +
          "This Agreement establishes an independent contractor relationship and is not an employment contract. The Contractor is not entitled to benefits under the Employment Code Act, 2019 (No. 3 of 2019), the Minimum Wages and Conditions of Employment Act (Chapter 276), or the NAPSA Act. This Agreement is governed by the general law of contract in the Republic of Zambia.",
          "definitions",
        ),
        makeClause(
          "Scope of Work",
          "The Contractor agrees to perform the services and produce the Deliverables described in Schedule A (the \"Work\").\n\n" +
          "The Contractor shall:\n" +
          "(a) Have sole discretion over the manner, means, and methods of performing the Work, provided that the Work meets the agreed specifications and deadlines;\n" +
          "(b) Use their own equipment, tools, and workspace unless otherwise agreed;\n" +
          "(c) Deliver work of professional quality that meets the standards described in the project brief;\n" +
          "(d) Communicate progress regularly and promptly notify the Client of any potential delays.\n\n" +
          "Any changes to the scope of Work shall be documented in a written Change Order signed by both parties before implementation.",
          "scope",
        ),
        makeClause(
          "Deliverables and Acceptance",
          "The Contractor shall deliver the following Deliverables by the agreed deadlines:\n\n" +
          "[List deliverables with deadlines]\n\n" +
          "The Client shall review each Deliverable and provide written acceptance or detailed feedback within [7/10] business days of submission. If the Client does not respond within this period, the Deliverable shall be deemed accepted.\n\n" +
          "The Contractor shall make up to [2/3] rounds of revisions at no additional cost. Further revisions shall be charged at the Contractor's standard rate of ZMW [Amount] per hour.",
          "scope",
        ),
        makeClause(
          "Fees and Payment",
          "The Client shall pay the Contractor the following:\n\n" +
          "Project Fee: ZMW [Amount] (Zambian Kwacha [Amount in Words] only)\n" +
          "Payment Structure: [Fixed fee / Hourly rate of ZMW _____ / Milestone-based]\n\n" +
          "Payment Schedule:\n" +
          "(a) [X]% deposit upon signing: ZMW [Amount]\n" +
          "(b) [X]% upon [milestone]: ZMW [Amount]\n" +
          "(c) [X]% upon final acceptance: ZMW [Amount]\n\n" +
          "Invoices are payable within fourteen (14) days of acceptance of Deliverables. Late payments shall attract interest at two percent (2%) per month.\n\n" +
          "The Contractor is solely responsible for their own tax obligations, including provisional income tax, turnover tax (if applicable under the Income Tax Act, Chapter 323), and any other statutory obligations. Where required, the Client shall deduct Withholding Tax and provide a withholding tax certificate.",
          "payment",
        ),
        makeClause(
          "Independent Contractor Status",
          "The Contractor is an independent contractor and NOT an employee, agent, partner, or joint venturer of the Client. The Contractor shall:\n\n" +
          "(a) Not be entitled to any employment benefits, allowances, leave, NAPSA contributions, or Workers' Compensation;\n" +
          "(b) Be solely responsible for all personal taxes, insurance, health cover, and pension arrangements;\n" +
          "(c) Have no authority to bind the Client or enter into obligations on the Client's behalf;\n" +
          "(d) Not represent themselves as an employee of the Client.\n\n" +
          "This clause is critical to distinguish this engagement from an employment relationship under the Employment Code Act, 2019 (No. 3 of 2019). Both parties confirm that the substance of this arrangement is a genuine independent contractor engagement.",
          "general",
        ),
        makeClause(
          "Intellectual Property",
          "Upon full payment of all fees, all intellectual property rights in the Deliverables created specifically for the Client shall be assigned to the Client.\n\n" +
          "The Contractor retains ownership of:\n" +
          "(a) All pre-existing intellectual property, tools, templates, libraries, and methodologies;\n" +
          "(b) General skills, knowledge, and techniques acquired during the engagement.\n\n" +
          "The Contractor grants the Client a non-exclusive, perpetual, royalty-free licence to use any pre-existing IP embedded in the Deliverables.\n\n" +
          "The Contractor warrants that the Deliverables are original and do not infringe any third-party intellectual property rights. IP rights are subject to the Copyright and Performance Rights Act (No. 44 of 1994), the Patents Act (Chapter 400), and the Trade Marks Act (Chapter 401) of Zambia.",
          "intellectual-property",
        ),
        COMMON_CLAUSES.confidentiality(),
        makeClause(
          "Termination",
          "Either party may terminate this Agreement:\n\n" +
          "(a) By giving fourteen (14) days' written notice to the other party;\n" +
          "(b) Immediately if the other party commits a material breach and fails to remedy within seven (7) days of written notice;\n" +
          "(c) Immediately if the other party becomes insolvent or unable to perform.\n\n" +
          "Upon termination:\n" +
          "(a) The Client shall pay for all Work satisfactorily completed up to the date of termination;\n" +
          "(b) The Contractor shall deliver all completed and partially completed Deliverables;\n" +
          "(c) Each party shall return or destroy any Confidential Information of the other party.\n\n" +
          "If the Client terminates for convenience (not for breach), the Client shall pay a kill fee of [X]% of the remaining Project Fee.",
          "termination",
        ),
        COMMON_CLAUSES.indemnification(),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Freelance Agreement shall first be resolved through good-faith negotiation within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation. If mediation is unsuccessful within thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act (No. 19 of 2000), or either party may refer the matter to the courts of the Republic of Zambia.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Freelance Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Income Tax Act (Chapter 323), the Copyright and Performance Rights Act (No. 44 of 1994), and the Arbitration Act (No. 19 of 2000). For the avoidance of doubt, this Agreement does not create an employment relationship and the Employment Code Act, 2019 (No. 3 of 2019) does not apply.",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "partnership-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Partnership Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Partners\" means the parties named herein who form the Partnership.\n" +
          "(b) \"Partnership\" means the business entity formed under this Agreement.\n" +
          "(c) \"Capital Contribution\" means the initial and subsequent contributions of money, property, or services by each Partner.\n" +
          "(d) \"Partnership Property\" means all assets, property, and interests acquired by or contributed to the Partnership.\n" +
          "(e) \"Net Profits\" means gross revenue less all Partnership expenses, tax obligations, and reserves.\n" +
          "(f) \"Partnership Account\" means the designated bank account in the name of the Partnership.\n\n" +
          "This Partnership is formed in accordance with the Partnership Act (Chapter 119 of the Laws of Zambia) and is subject to the Business Regulatory Act (No. 3 of 2014), the Income Tax Act (Chapter 323), and the Registration of Business Names Act (Chapter 389).",
          "definitions",
        ),
        makeClause(
          "Formation and Name",
          "The Partners hereby form a partnership for the purpose of carrying on business under the name \"[Partnership Name]\" (the \"Partnership\").\n\n" +
          "Principal Place of Business: [Address], Zambia\n" +
          "Commencement Date: [Date]\n\n" +
          "The Partnership name shall be registered with the Patents and Companies Registration Agency (PACRA) under the Registration of Business Names Act (Chapter 389). The Partners shall jointly apply for all necessary business permits and licences required under the Business Regulatory Act (No. 3 of 2014) and local authority regulations.",
          "scope",
        ),
        makeClause(
          "Partnership Purpose",
          "The Partnership is formed for the purpose of [describe business purpose in detail].\n\n" +
          "The Partnership shall not engage in any business activity outside the stated purpose without the written consent of all Partners. The Partnership shall conduct its business in compliance with all applicable laws and regulations of the Republic of Zambia.",
          "scope",
        ),
        makeClause(
          "Capital Contributions",
          "Each Partner shall contribute the following to the Partnership:\n\n" +
          "Partner A: [Name]\n" +
          "  Cash: ZMW [Amount]\n" +
          "  Assets: [Description, if any]\n" +
          "  Services / Skills: [Description, if any]\n\n" +
          "Partner B: [Name]\n" +
          "  Cash: ZMW [Amount]\n" +
          "  Assets: [Description, if any]\n" +
          "  Services / Skills: [Description, if any]\n\n" +
          "All cash contributions shall be deposited into the Partnership Account within [X] days of execution of this Agreement. Additional contributions may be made only by unanimous written agreement of all Partners.\n\n" +
          "No Partner shall withdraw any part of their Capital Contribution without the written consent of all other Partners.",
          "payment",
        ),
        makeClause(
          "Profit and Loss Sharing",
          "Net Profits and losses of the Partnership shall be shared between the Partners in the following ratio:\n\n" +
          "Partner A: [X]%\n" +
          "Partner B: [Y]%\n\n" +
          "Distributions of profits shall be made [monthly / quarterly / annually] after provision for:\n" +
          "(a) All Partnership expenses and liabilities;\n" +
          "(b) Tax obligations, including provisional income tax under the Income Tax Act (Chapter 323);\n" +
          "(c) A reserve fund of [X]% of net profits for working capital.\n\n" +
          "Each Partner shall be responsible for their personal income tax on their share of Partnership profits. The Partnership shall file returns with the Zambia Revenue Authority (ZRA) as required.",
          "payment",
        ),
        makeClause(
          "Management and Decision-Making",
          "The Partners shall jointly manage the affairs of the Partnership. Each Partner shall devote their [full / agreed] time and attention to the Partnership business.\n\n" +
          "Decisions shall be made as follows:\n" +
          "(a) Ordinary business decisions: By simple majority;\n" +
          "(b) Major decisions: By unanimous consent.\n\n" +
          "Major decisions requiring unanimous consent include:\n" +
          "(a) Expenditures exceeding ZMW [Amount];\n" +
          "(b) Entering into contracts exceeding ZMW [Amount] or twelve (12) months' duration;\n" +
          "(c) Borrowing money or granting securities on behalf of the Partnership;\n" +
          "(d) Hiring or dismissing employees;\n" +
          "(e) Admitting new Partners;\n" +
          "(f) Any change to the nature of the Partnership business.\n\n" +
          "Each Partner shall have access to all Partnership books and records at all reasonable times.",
          "general",
        ),
        makeClause(
          "Banking and Financial Records",
          "The Partnership shall maintain a bank account in the Partnership name at [Bank Name]. All Partnership income shall be deposited into this account.\n\n" +
          "Cheque signatories: [Both Partners jointly / Any one Partner up to ZMW ___, both Partners for amounts exceeding ZMW ___]\n\n" +
          "The Partnership shall maintain proper books of account (cash book, ledger, profit and loss account, balance sheet) in accordance with generally accepted accounting principles. Annual accounts shall be prepared and agreed by all Partners. The Partners may appoint an auditor at the Partnership's expense.",
          "payment",
        ),
        makeClause(
          "Non-Competition",
          "During the subsistence of the Partnership and for a period of [12/24] months after dissolution or withdrawal, no Partner shall:\n\n" +
          "(a) Directly or indirectly carry on or be engaged in any business competitive with the Partnership business within [geographic area];\n" +
          "(b) Solicit or entice away any customer, client, or employee of the Partnership;\n" +
          "(c) Use Partnership materials, contacts, or Confidential Information for personal gain.\n\n" +
          "This clause is enforceable to the extent permitted by the Competition and Consumer Protection Act (No. 24 of 2010) and the general law of restraint of trade in Zambia.",
          "non-compete",
        ),
        COMMON_CLAUSES.confidentiality(),
        makeClause(
          "Withdrawal and Dissolution",
          "Withdrawal: A Partner may withdraw from the Partnership by providing not less than six (6) months' written notice. The remaining Partner(s) shall have the right of first refusal to purchase the withdrawing Partner's interest at fair market value as determined by an independent valuer appointed by agreement or, failing agreement, by the Law Association of Zambia.\n\n" +
          "Dissolution: The Partnership shall be dissolved upon:\n" +
          "(a) Unanimous agreement of all Partners;\n" +
          "(b) Death, bankruptcy, or incapacity of a Partner (unless the remaining Partners elect to continue under Section 33 of the Partnership Act, Chapter 119);\n" +
          "(c) The occurrence of any event that makes it unlawful to carry on business;\n" +
          "(d) Order of the High Court under Section 35 of the Partnership Act.\n\n" +
          "Upon dissolution, Partnership assets shall be applied in order: (1) payment of debts and liabilities to third parties, (2) repayment of loans from Partners, (3) repayment of Capital Contributions, (4) distribution of surplus in profit-sharing ratio.",
          "termination",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute between the Partners arising from this Agreement shall first be addressed through a Partners' meeting. If not resolved within fourteen (14) days, the dispute shall be referred to mediation. If mediation fails within thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act (No. 19 of 2000). The arbitrator's decision shall be final and binding. The losing party shall bear the costs of arbitration unless the arbitrator directs otherwise.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Partnership Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Partnership Act (Chapter 119), the Registration of Business Names Act (Chapter 389), the Business Regulatory Act (No. 3 of 2014), the Income Tax Act (Chapter 323), the Competition and Consumer Protection Act (No. 24 of 2010), and the Arbitration Act (No. 19 of 2000).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "lease-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Lease Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Landlord\" means the party named herein as Landlord, including their successors in title and assigns.\n" +
          "(b) \"Tenant\" means the party named herein as Tenant, including their permitted assigns.\n" +
          "(c) \"Premises\" means the property described in Clause 2 below.\n" +
          "(d) \"Rent\" means the monthly rental amount specified herein.\n" +
          "(e) \"Lease Term\" means the period commencing on the Start Date and ending on the Expiry Date.\n" +
          "(f) \"Common Areas\" means areas of the building or complex shared by multiple tenants.\n\n" +
          "This Lease Agreement is subject to the Landlord and Tenant (Business Premises) Act, Chapter 190, the Lands Act No. 29 of 1995, and the Lands and Deeds Registry Act, Chapter 185 of the Laws of Zambia.",
          "definitions",
        ),
        makeClause(
          "Description of Premises",
          "The Landlord agrees to lease to the Tenant the following property (hereinafter referred to as the \"Premises\"):\n\n" +
          "Physical Address: _______________\n" +
          "Stand/Plot Number: _______________\n" +
          "Title Deed Reference: _______________\n" +
          "Floor Area: _______________ m²\n" +
          "Nature of Premises: [Office / Retail / Warehouse / Industrial]\n\n" +
          "The Premises includes all permanent fixtures and fittings as described in the Schedule of Condition attached hereto as Schedule A.",
          "scope",
        ),
        makeClause(
          "Lease Term and Renewal",
          "The lease shall commence on [Start Date] (the \"Commencement Date\") and shall expire on [End Date] (the \"Expiry Date\"), for a total period of [Duration]. The Tenant may request a renewal of this Lease by providing not less than ninety (90) days' written notice before the Expiry Date. The Landlord shall not unreasonably withhold consent to renewal, subject to the provisions of the Landlord and Tenant (Business Premises) Act, Chapter 190. Any renewal shall be on terms to be mutually agreed, including a reviewed rental amount.",
          "general",
        ),
        makeClause(
          "Rent and Payment",
          "The Tenant shall pay a monthly rent of ZMW [Amount] (Zambian Kwacha [Amount in Words]), exclusive of Value Added Tax (VAT) at the applicable rate of 16%, due and payable in advance on or before the first (1st) business day of each calendar month. Rent shall be paid by electronic bank transfer to the Landlord's designated account:\n\n" +
          "Bank: _______________\n" +
          "Account Name: _______________\n" +
          "Account Number: _______________\n" +
          "Branch: _______________\n\n" +
          "Late payment shall attract interest at the rate of two percent (2%) per month on the outstanding amount, calculated from the due date until payment is received in full. The first month's rent shall be payable upon execution of this Agreement.",
          "payment",
        ),
        makeClause(
          "Rent Review",
          "The rent payable under this Lease shall be subject to review on each anniversary of the Commencement Date. The reviewed rent shall be determined by mutual agreement between the Landlord and Tenant, having regard to prevailing market rates for comparable premises in the area. If the parties fail to agree within thirty (30) days, the matter shall be referred to an independent registered valuer for determination, whose decision shall be binding. The cost of the valuation shall be shared equally.",
          "payment",
        ),
        makeClause(
          "Security Deposit",
          "Upon signing this Agreement, the Tenant shall pay a security deposit of ZMW [Amount] (equivalent to [X] months' rent). The deposit shall be held by the Landlord as security for the Tenant's performance of all obligations under this Lease. The deposit (or balance thereof) shall be refunded to the Tenant within thirty (30) days of vacating the Premises, less any deductions for:\n\n" +
          "(a) Unpaid rent or other charges;\n" +
          "(b) Damage to the Premises beyond fair wear and tear;\n" +
          "(c) Cost of restoring the Premises to its original condition (subject to fair wear and tear).\n\n" +
          "The Landlord shall provide an itemised statement of any deductions made from the deposit.",
          "payment",
        ),
        makeClause(
          "Permitted Use",
          "The Premises shall be used solely for [commercial/office/retail/warehouse] purposes and for no other purpose without the prior written consent of the Landlord. The Tenant shall not carry on any illegal, immoral, or offensive activity on the Premises. The Tenant shall obtain and maintain all necessary licences, permits, and approvals for the conduct of their business on the Premises. The Tenant shall comply with all applicable laws, regulations, and by-laws of the Republic of Zambia, including health and safety regulations.",
          "general",
        ),
        makeClause(
          "Maintenance, Repairs and Alterations",
          "Landlord's Responsibilities: The Landlord shall be responsible for structural repairs and maintenance, including the roof, external walls, foundations, main plumbing, and electrical systems.\n\n" +
          "Tenant's Responsibilities: The Tenant shall maintain the interior of the Premises in good and tenantable condition, including internal decorations, minor plumbing, electrical fittings, and fixtures.\n\n" +
          "Alterations: The Tenant shall not make any structural alterations, additions, or improvements to the Premises without the prior written consent of the Landlord, which shall not be unreasonably withheld. Any authorised alterations shall become the property of the Landlord upon termination unless otherwise agreed in writing. The Tenant shall promptly report any defects, damage, or needed repairs to the Landlord.",
          "general",
        ),
        makeClause(
          "Assignment and Subletting",
          "The Tenant shall not assign, sublet, or part with possession of the Premises or any part thereof without the prior written consent of the Landlord. Any permitted assignment or subletting shall not release the Tenant from their obligations under this Lease. The Landlord's consent shall not be unreasonably withheld or delayed. Any assignment or subletting must comply with the Lands and Deeds Registry Act, Chapter 185.",
          "general",
        ),
        makeClause(
          "Insurance",
          "The Landlord shall insure the building (structure) against fire, natural disasters, and other standard perils. The Tenant shall insure their own fixtures, fittings, stock, and contents against all risks at their own cost. The Tenant shall obtain and maintain public liability insurance of not less than ZMW [Amount]. The Tenant shall not do or permit anything that may vitiate or increase the premium on the Landlord's insurance policy.",
          "general",
        ),
        makeClause(
          "Termination and Forfeiture",
          "Either party may terminate this Lease by providing not less than ninety (90) days' written notice to the other party, expiring on the last day of a calendar month.\n\nThe Landlord may forfeit this Lease if:\n" +
          "(a) The Tenant fails to pay rent within fourteen (14) days of the due date;\n" +
          "(b) The Tenant breaches any material term and fails to remedy within thirty (30) days of written notice;\n" +
          "(c) The Tenant becomes insolvent, enters liquidation, or has a receiver appointed.\n\n" +
          "Upon termination, the Tenant shall yield up vacant possession of the Premises in the condition required by this Lease. The Landlord shall comply with the provisions of the Rent Act, Chapter 206, regarding eviction procedures where applicable. No eviction shall take place without a court order where required by law.",
          "termination",
        ),
        makeClause(
          "Rates, Taxes and Utilities",
          "The Landlord shall be responsible for property rates and ground rent payable to the local authority. The Tenant shall be responsible for all utility charges (electricity, water, sewerage, internet, telephone) consumed at the Premises. The Tenant shall open utility accounts in their own name where possible. If utilities are shared or supplied through the Landlord, the Tenant shall reimburse the Landlord for their proportionate share as determined by meter readings or agreed apportionment.",
          "payment",
        ),
        COMMON_CLAUSES.forceMajeure(),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from or in connection with this Lease Agreement shall first be resolved through good-faith negotiation between the parties. If negotiation fails within thirty (30) days, the dispute shall be referred to mediation. Disputes regarding rent may be referred to the Lands Tribunal established under the Lands Tribunal Act, Chapter 228 (as amended by Act No. 7 of 2024). If mediation is unsuccessful, the dispute shall be submitted to the exclusive jurisdiction of the courts of Lusaka, Republic of Zambia.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Lease Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Landlord and Tenant (Business Premises) Act, Chapter 190, the Lands Act No. 29 of 1995, the Lands and Deeds Registry Act, Chapter 185, and the Rent Act, Chapter 206, as applicable.",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "tenancy-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Residential Tenancy Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Landlord\" means the party named herein as Landlord, including their heirs, executors, administrators, and assigns.\n" +
          "(b) \"Tenant\" means the party named herein as Tenant, including their authorised occupants.\n" +
          "(c) \"Premises\" means the residential property described in Clause 2 below.\n" +
          "(d) \"Rent\" means the monthly rental amount specified herein.\n" +
          "(e) \"Tenancy Period\" means the duration of this tenancy from the Commencement Date to the Expiry Date.\n" +
          "(f) \"Security Deposit\" means the deposit paid by the Tenant as security for faithful performance of obligations.\n" +
          "(g) \"Fair Wear and Tear\" means deterioration caused by reasonable use of the Premises over time.\n\n" +
          "This Agreement is subject to the Rent Act, Chapter 206, the Landlord and Tenant (Business Premises) Act, Chapter 190, and the general common law of the Republic of Zambia.",
          "definitions",
        ),
        makeClause(
          "Description of Premises",
          "The Landlord hereby lets and the Tenant hereby takes on rent the following residential premises (hereinafter referred to as the \"Premises\"):\n\n" +
          "Physical Address: _______________\n" +
          "Stand/Plot Number: _______________\n" +
          "House/Flat Number: _______________\n" +
          "Township/Area: _______________\n" +
          "City/Town: _______________\n" +
          "Province: _______________\n" +
          "Number of Bedrooms: _______________\n" +
          "Number of Bathrooms: _______________\n" +
          "Furnished / Unfurnished: _______________\n\n" +
          "The Premises is let together with all fixtures and fittings as described in the Inventory and Schedule of Condition attached hereto as Schedule A, signed by both parties at the commencement of this tenancy.",
          "scope",
        ),
        makeClause(
          "Tenancy Period",
          "This tenancy shall commence on [Start Date] (the \"Commencement Date\") and shall expire on [End Date] (the \"Expiry Date\"), for a fixed term of [Duration] months/years.\n\n" +
          "Upon expiry of the fixed term, this tenancy shall convert to a periodic (month-to-month) tenancy on the same terms and conditions, unless:\n" +
          "(a) Either party gives not less than one (1) calendar month's written notice to terminate; or\n" +
          "(b) A new tenancy agreement is entered into on agreed terms.\n\n" +
          "The notice to terminate shall expire at the end of a rental period. In accordance with Section 14 of the Rent Act, Chapter 206, the minimum notice to quit for residential tenancies is one (1) month.",
          "general",
        ),
        makeClause(
          "Rent",
          "The Tenant shall pay a monthly rent of ZMW [Amount] (Zambian Kwacha [Amount in Words] only), payable in advance on or before the [1st] day of each calendar month.\n\n" +
          "Rent shall be paid by:\n" +
          "[ ] Bank Transfer to: Bank: ___________ Account: ___________ Name: ___________\n" +
          "[ ] Mobile Money to: Number: ___________ Name: ___________\n" +
          "[ ] Cash (against official receipt signed by Landlord)\n\n" +
          "The Landlord shall issue a written receipt for every rent payment received, stating the amount, date, and period covered. Failure to issue a receipt is an offence under the Rent Act.\n\n" +
          "Late payment shall attract a penalty of [5]% per month on the outstanding amount. The first month's rent shall be payable upon execution of this Agreement.",
          "payment",
        ),
        makeClause(
          "Rent Increase",
          "The Landlord may increase the rent once per annum, effective on the anniversary of the Commencement Date, by giving the Tenant not less than sixty (60) days' written notice of the proposed increase. The increase shall not exceed [X]% of the current rent or the prevailing market rate for comparable residential premises in the area, whichever is lower. If the Tenant objects to the proposed increase, the matter may be referred to the Rent Tribunal or the courts for determination.",
          "payment",
        ),
        makeClause(
          "Security Deposit",
          "Upon signing this Agreement, the Tenant shall pay a security deposit of ZMW [Amount] (equivalent to [2/3] months' rent).\n\n" +
          "The security deposit shall be held by the Landlord as security for the faithful performance of the Tenant's obligations under this Agreement. The deposit shall NOT be applied towards rent payments.\n\n" +
          "Within thirty (30) days of the termination of this tenancy and the Tenant vacating the Premises, the Landlord shall refund the security deposit (or balance thereof) to the Tenant, less any lawful deductions for:\n" +
          "(a) Unpaid rent or utility charges;\n" +
          "(b) Cost of repairing damage caused by the Tenant, beyond fair wear and tear;\n" +
          "(c) Cost of replacing missing items from the Inventory (Schedule A);\n" +
          "(d) Cleaning costs if the Premises is not returned in a reasonably clean condition.\n\n" +
          "The Landlord shall provide an itemised written statement of all deductions with supporting receipts within the same thirty (30) day period. The Tenant's right to challenge deductions is preserved.",
          "payment",
        ),
        makeClause(
          "Use of Premises",
          "The Premises shall be used solely as a private residential dwelling by the Tenant and the following authorised occupants:\n\n" +
          "[Name 1] — Relationship: _______________\n" +
          "[Name 2] — Relationship: _______________\n" +
          "[Name 3] — Relationship: _______________\n\n" +
          "The Tenant shall NOT:\n" +
          "(a) Use the Premises for any business, trade, or commercial purpose;\n" +
          "(b) Carry on any illegal, immoral, or offensive activity;\n" +
          "(c) Cause or permit any nuisance, disturbance, or annoyance to neighbours;\n" +
          "(d) Keep any animals or pets without the prior written consent of the Landlord;\n" +
          "(e) Store any hazardous, flammable, or explosive materials;\n" +
          "(f) Exceed the number of authorised occupants without written consent.\n\n" +
          "The Tenant shall comply with all applicable laws, by-laws, and regulations of the Republic of Zambia and the local authority.",
          "general",
        ),
        makeClause(
          "Landlord's Obligations",
          "The Landlord shall:\n\n" +
          "(a) Deliver the Premises in a habitable condition, fit for residential occupation;\n" +
          "(b) Carry out and pay for structural repairs including the roof, external walls, foundations, guttering, downpipes, main plumbing (pipes and drains), and main electrical wiring;\n" +
          "(c) Maintain the exterior of the Premises in reasonable condition;\n" +
          "(d) Ensure that the Premises complies with all health, safety, and building regulations;\n" +
          "(e) Not interfere with the Tenant's quiet enjoyment of the Premises;\n" +
          "(f) Give at least twenty-four (24) hours' written notice before entering the Premises for inspection or repairs, except in cases of emergency;\n" +
          "(g) Provide a copy of this Agreement to the Tenant on execution;\n" +
          "(h) Issue receipts for all payments received from the Tenant.\n\n" +
          "In accordance with Section 20 of the Rent Act, Chapter 206, the Landlord shall not cut off or interrupt essential services (water, electricity, sanitation) as a means of enforcing any obligation or compelling the Tenant to vacate.",
          "general",
        ),
        makeClause(
          "Tenant's Obligations",
          "The Tenant shall:\n\n" +
          "(a) Pay rent punctually on the due date;\n" +
          "(b) Keep the interior of the Premises in a clean and sanitary condition;\n" +
          "(c) Use the Premises in a tenant-like manner, taking reasonable care of all fixtures, fittings, and appliances;\n" +
          "(d) Carry out minor internal maintenance (replacing light bulbs, unblocking sinks, minor plumbing repairs);\n" +
          "(e) Promptly report any defects, damage, or needed structural repairs to the Landlord in writing;\n" +
          "(f) Not make any structural alterations, additions, or improvements without the Landlord's prior written consent;\n" +
          "(g) Not sublet, assign, or share possession of the Premises without prior written consent;\n" +
          "(h) Not damage, deface, or remove any fixtures or fittings belonging to the Landlord;\n" +
          "(i) Allow the Landlord access for reasonable inspections (with 24 hours' notice);\n" +
          "(j) Comply with all rules and regulations of the housing complex or estate (if applicable);\n" +
          "(k) Ensure that the Tenant's conduct and that of their occupants and visitors does not cause nuisance or annoyance;\n" +
          "(l) On termination, return the Premises and all keys in the condition described in Schedule A, subject to fair wear and tear.",
          "general",
        ),
        makeClause(
          "Utilities and Services",
          "The Tenant shall be responsible for payment of all utility charges consumed at the Premises, including:\n\n" +
          "(a) Electricity (ZESCO — The Tenant shall transfer/open the electricity account in their name);\n" +
          "(b) Water and sewerage charges (Lusaka Water and Sewerage Company or relevant utility);\n" +
          "(c) Refuse collection charges;\n" +
          "(d) Internet and telephone services;\n" +
          "(e) Any other service charges applicable to the Premises.\n\n" +
          "If any utility is shared or billed through the Landlord, the Tenant shall pay their proportionate share as determined by sub-meter readings or agreed apportionment. The Tenant shall not tamper with, bypass, or illegally connect to any utility meter or supply.",
          "payment",
        ),
        makeClause(
          "Inventory and Condition Report",
          "At the commencement of this tenancy, both parties shall jointly inspect the Premises and sign an Inventory and Schedule of Condition (Schedule A), which shall describe:\n\n" +
          "(a) The condition of each room, wall, ceiling, and floor;\n" +
          "(b) All fixtures, fittings, and appliances with their condition;\n" +
          "(c) All furniture and contents (if furnished);\n" +
          "(d) Meter readings for electricity and water.\n\n" +
          "This schedule shall be the basis for assessing the condition of the Premises at the end of the tenancy. Any items not recorded in Schedule A shall be presumed to have been in good condition at the commencement of the tenancy.",
          "general",
        ),
        makeClause(
          "Termination and Notice",
          "Fixed Term: This tenancy shall automatically expire on the Expiry Date without further notice. Either party may give notice of non-renewal at least one (1) month before the Expiry Date.\n\n" +
          "Periodic Tenancy: If the tenancy converts to a month-to-month periodic tenancy, either party may terminate by giving not less than one (1) calendar month's written notice, expiring at the end of a rental period, in accordance with Section 14 of the Rent Act, Chapter 206.\n\n" +
          "Early Termination by Landlord: The Landlord may terminate this tenancy before the Expiry Date only where:\n" +
          "(a) The Tenant is in arrears of rent for two (2) or more months;\n" +
          "(b) The Tenant has committed a material breach and failed to remedy within fourteen (14) days of written notice;\n" +
          "(c) The Tenant uses the Premises for illegal purposes;\n" +
          "(d) The Premises are required for substantial reconstruction or the Landlord's own occupation (with at least three (3) months' notice).\n\n" +
          "Early Termination by Tenant: The Tenant may terminate before the Expiry Date by:\n" +
          "(a) Giving two (2) months' written notice; and\n" +
          "(b) Paying the equivalent of [1] month's rent as an early termination fee.\n\n" +
          "Eviction: No eviction shall be carried out except in accordance with Section 15 of the Rent Act, Chapter 206. The Landlord must obtain a court order before evicting any tenant. Self-help eviction (changing locks, removing belongings, cutting utilities) is unlawful.",
          "termination",
        ),
        makeClause(
          "Surrender and Handover",
          "Upon termination of this tenancy, the Tenant shall:\n\n" +
          "(a) Vacate the Premises and remove all personal belongings;\n" +
          "(b) Return the Premises in substantially the same condition as recorded in Schedule A, subject to fair wear and tear;\n" +
          "(c) Return all keys, access cards, and remote controls to the Landlord;\n" +
          "(d) Settle all outstanding utility bills and provide proof of final meter readings;\n" +
          "(e) Settle any outstanding rent or charges.\n\n" +
          "Both parties shall conduct a joint exit inspection. Any disputes regarding the condition of the Premises shall be resolved with reference to Schedule A. Personal belongings left at the Premises for more than fourteen (14) days after vacating shall be deemed abandoned.",
          "general",
        ),
        COMMON_CLAUSES.forceMajeure(),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Tenancy Agreement shall first be resolved through good-faith discussion between the Landlord and Tenant. If not resolved within fourteen (14) days, the dispute may be referred to:\n\n" +
          "(a) Mediation by a mutually agreed mediator; or\n" +
          "(b) The Rent Tribunal or Lands Tribunal established under the Laws of Zambia; or\n" +
          "(c) The Local Court or Subordinate Court having jurisdiction.\n\n" +
          "For claims exceeding the jurisdictional limit of the subordinate courts, either party may approach the High Court of Zambia (Lusaka).",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Tenancy Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including but not limited to:\n\n" +
          "(a) The Rent Act, Chapter 206;\n" +
          "(b) The Landlord and Tenant (Business Premises) Act, Chapter 190 (where applicable);\n" +
          "(c) The Lands Act, No. 29 of 1995;\n" +
          "(d) The Lands and Deeds Registry Act, Chapter 185;\n" +
          "(e) The Constitution of Zambia (Amendment) Act, 2016.\n\n" +
          "Any provision of this Agreement that is inconsistent with mandatory provisions of Zambian law shall be deemed amended to the extent necessary to comply with such law, and the remainder of this Agreement shall continue in full force and effect.",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "sales-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Sale Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Seller\" means the party selling the Goods described herein.\n" +
          "(b) \"Buyer\" means the party purchasing the Goods described herein.\n" +
          "(c) \"Goods\" means the products, items, or merchandise described in Clause 2 and Schedule A.\n" +
          "(d) \"Purchase Price\" means the total price payable for the Goods.\n" +
          "(e) \"Delivery Date\" means the date on which the Goods are to be delivered.\n" +
          "(f) \"Delivery Point\" means the agreed location for delivery of the Goods.\n" +
          "(g) \"Acceptance\" means the Buyer's confirmation that the Goods conform to the agreed specifications.\n\n" +
          "This Agreement is subject to the Sale of Goods Act (Chapter 388 of the Laws of Zambia), the Competition and Consumer Protection Act (No. 24 of 2010), and the Value Added Tax Act (Chapter 331).",
          "definitions",
        ),
        makeClause(
          "Description of Goods",
          "The Seller agrees to sell and the Buyer agrees to purchase the following Goods:\n\n" +
          "[Detailed description of Goods, including make, model, specifications, quality, grade, etc.]\n\n" +
          "Quantities, specifications, and quality standards shall be as described in Schedule A attached hereto.\n\n" +
          "The Goods shall comply with all applicable Zambian standards, including those issued by the Zambia Bureau of Standards (ZABS) and any sector-specific regulations. Under the Sale of Goods Act (Chapter 388), the Goods shall be of merchantable quality and fit for the purpose for which they are being purchased.",
          "scope",
        ),
        makeClause(
          "Purchase Price and Payment",
          "The total Purchase Price for the Goods is ZMW [Amount] (Zambian Kwacha [Amount in Words] only).\n\n" +
          "Payment shall be made as follows:\n" +
          "(a) Deposit: ZMW [Amount] ([X]%) payable upon signing of this Agreement.\n" +
          "(b) Balance: ZMW [Amount] payable [upon delivery / within X days of delivery / by instalments].\n\n" +
          "All prices are quoted in Zambian Kwacha and are exclusive of Value Added Tax (VAT) at 16% under the Value Added Tax Act (Chapter 331), unless expressly stated to be VAT-inclusive.\n\n" +
          "Payment shall be made by [bank transfer / mobile money / certified cheque] to the Seller's designated account. The Seller shall issue a tax invoice and official receipt for all payments.\n\n" +
          "Late payment shall attract interest at two percent (2%) per month on the outstanding balance.",
          "payment",
        ),
        makeClause(
          "Delivery",
          "The Seller shall deliver the Goods to the Buyer at [Delivery Point] on or before [Delivery Date].\n\n" +
          "Delivery terms:\n" +
          "(a) Delivery shall be accompanied by a delivery note signed by both parties;\n" +
          "(b) Risk of loss or damage shall transfer to the Buyer upon delivery, in accordance with Section 20 of the Sale of Goods Act (Chapter 388);\n" +
          "(c) Title to the Goods shall pass to the Buyer upon [delivery / full payment] (Retention of Title);\n" +
          "(d) The Seller shall bear all costs of delivery, including transport and insurance, to the Delivery Point;\n" +
          "(e) If the Seller fails to deliver within [X] days of the Delivery Date, the Buyer may cancel this Agreement and receive a full refund.\n\n" +
          "Partial deliveries shall be permitted only with the Buyer's prior written consent.",
          "general",
        ),
        makeClause(
          "Inspection and Acceptance",
          "The Buyer shall inspect the Goods within [5/7] business days of delivery (the \"Inspection Period\"). During the Inspection Period, the Buyer shall:\n\n" +
          "(a) Verify the quantity, quality, and condition of the Goods against the specifications in Schedule A;\n" +
          "(b) Notify the Seller in writing of any defects, shortages, or non-conformities.\n\n" +
          "If the Buyer does not notify the Seller of any defect within the Inspection Period, the Goods shall be deemed accepted. Acceptance does not waive the Buyer's rights under the warranty clause or the Sale of Goods Act.",
          "general",
        ),
        makeClause(
          "Warranty",
          "The Seller warrants that:\n\n" +
          "(a) The Goods shall conform to the agreed specifications and any applicable ZABS standards;\n" +
          "(b) The Goods shall be free from defects in material and workmanship for a period of [X] months from delivery;\n" +
          "(c) The Goods are of merchantable quality and fit for the purpose for which they are sold, in accordance with Sections 14 and 15 of the Sale of Goods Act (Chapter 388);\n" +
          "(d) The Seller has good title to the Goods and the right to sell them free from any encumbrance.\n\n" +
          "The Seller's sole obligation under this warranty shall be, at the Seller's option, to repair, replace, or refund the Purchase Price for defective Goods. The warranty does not cover damage caused by the Buyer's misuse, negligence, or failure to follow usage instructions.",
          "liability",
        ),
        makeClause(
          "Returns and Refunds",
          "The Buyer may return Goods and claim a refund in the following circumstances:\n\n" +
          "(a) Defective Goods: Within [X] days of discovery of the defect, upon written notification with original invoice;\n" +
          "(b) Wrong or short delivery: Within five (5) business days of delivery;\n" +
          "(c) Goods not conforming to specifications: Within the Inspection Period.\n\n" +
          "Refunds shall be processed within fourteen (14) days of receipt of the returned Goods.\n\n" +
          "The Buyer's rights under this clause are in addition to any rights under the Competition and Consumer Protection Act (No. 24 of 2010), which provides consumer protection against unfair trade practices and defective products.",
          "general",
        ),
        COMMON_CLAUSES.liability(),
        COMMON_CLAUSES.forceMajeure(),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Sale Agreement shall first be resolved through good-faith negotiation within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation. If mediation is unsuccessful within thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act (No. 19 of 2000), or either party may refer the matter to the courts of the Republic of Zambia.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Sale Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Sale of Goods Act (Chapter 388), the Competition and Consumer Protection Act (No. 24 of 2010), the Value Added Tax Act (Chapter 331), and the Arbitration Act (No. 19 of 2000).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];
    case "consulting-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Consulting Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Client\" means the party engaging the Consultant.\n" +
          "(b) \"Consultant\" means the professional advisor or consultancy firm engaged under this Agreement.\n" +
          "(c) \"Services\" means the consulting services described in Clause 2 and Schedule A.\n" +
          "(d) \"Deliverables\" means all reports, analyses, recommendations, and work product produced under this Agreement.\n" +
          "(e) \"Fee\" means the compensation payable to the Consultant.\n" +
          "(f) \"Term\" means the duration of this Agreement as specified herein.\n\n" +
          "This Agreement establishes an independent consulting engagement. The Consultant is not an employee of the Client for purposes of the Employment Code Act, 2019 (No. 3 of 2019). This Agreement is governed by the Laws of the Republic of Zambia.",
          "definitions",
        ),
        makeClause(
          "Scope of Services",
          "The Consultant shall provide the following professional consulting services as described in Schedule A:\n\n" +
          "[Description of consulting services]\n\n" +
          "The Consultant shall:\n" +
          "(a) Use their best professional judgement, expertise, and industry knowledge in delivering the Services;\n" +
          "(b) Comply with all applicable professional standards and codes of ethics;\n" +
          "(c) Comply with all applicable laws and regulations of the Republic of Zambia;\n" +
          "(d) Allocate qualified and experienced personnel to perform the Services;\n" +
          "(e) Provide regular written reports on progress and findings.\n\n" +
          "The Client shall provide reasonable access to information, premises, and personnel necessary for the Consultant to perform the Services.",
          "scope",
        ),
        makeClause(
          "Fees, Expenses, and Payment",
          "The Client shall pay the Consultant:\n\n" +
          "Consulting Fee: ZMW [Amount] per [hour / day / project / month]\n" +
          "Estimated total: ZMW [Amount]\n\n" +
          "Invoices shall be submitted [monthly / upon milestone completion] and are payable within thirty (30) days of receipt. All fees are exclusive of VAT at 16% under the Value Added Tax Act (Chapter 331).\n\n" +
          "Expenses: Reasonable and pre-approved out-of-pocket expenses (travel, accommodation, printing) shall be reimbursed upon submission of receipts within thirty (30) days.\n\n" +
          "Withholding Tax: Where required under the Income Tax Act (Chapter 323), the Client shall deduct Withholding Tax at the prescribed rate and provide a withholding tax certificate.\n\n" +
          "Late payments shall attract interest at two percent (2%) per month on the outstanding amount.",
          "payment",
        ),
        COMMON_CLAUSES.confidentiality(),
        makeClause(
          "Intellectual Property",
          "All Deliverables created specifically for the Client shall become the property of the Client upon full payment.\n\n" +
          "The Consultant retains ownership of:\n" +
          "(a) Pre-existing intellectual property, methodologies, frameworks, and tools;\n" +
          "(b) General knowledge, skills, and expertise.\n\n" +
          "The Consultant grants the Client a non-exclusive, royalty-free licence to use any pre-existing IP embedded in the Deliverables.\n\n" +
          "Intellectual property rights are subject to the Copyright and Performance Rights Act (No. 44 of 1994), the Patents Act (Chapter 400), and the Trade Marks Act (Chapter 401) of Zambia.",
          "intellectual-property",
        ),
        makeClause(
          "Non-Solicitation and Conflict of Interest",
          "During the term of this Agreement and for twelve (12) months thereafter:\n\n" +
          "(a) The Consultant shall not directly or indirectly solicit or entice any employee, officer, or contractor of the Client for employment or engagement;\n" +
          "(b) The Consultant shall not directly or indirectly solicit any client or customer of the Client for the purpose of diverting business;\n" +
          "(c) The Consultant shall promptly disclose any actual or potential conflict of interest that may arise during the engagement.\n\n" +
          "This clause is enforceable to the extent permitted by Zambian law and the Competition and Consumer Protection Act (No. 24 of 2010).",
          "non-compete",
        ),
        COMMON_CLAUSES.liability(),
        COMMON_CLAUSES.indemnification(),
        makeClause(
          "Termination",
          "Either party may terminate this Agreement:\n\n" +
          "(a) By giving thirty (30) days' written notice to the other party;\n" +
          "(b) Immediately if the other party commits a material breach and fails to remedy within fourteen (14) days of written notice;\n" +
          "(c) Immediately if the other party becomes insolvent or unable to perform.\n\n" +
          "Upon termination:\n" +
          "(a) The Client shall pay for all Services satisfactorily performed up to the date of termination;\n" +
          "(b) The Consultant shall deliver all completed and in-progress Deliverables;\n" +
          "(c) Each party shall return Confidential Information.\n\n" +
          "Confidentiality, Intellectual Property, Non-Solicitation, and Dispute Resolution clauses shall survive termination.",
          "termination",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Consulting Agreement shall first be resolved through good-faith negotiation within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation. If mediation is unsuccessful within thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act (No. 19 of 2000), or either party may refer the matter to the courts of the Republic of Zambia.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Consulting Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Income Tax Act (Chapter 323), the Value Added Tax Act (Chapter 331), the Competition and Consumer Protection Act (No. 24 of 2010), and the Arbitration Act (No. 19 of 2000).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];

    // -- New industry-standard types ------------------------------------------

    case "motor-vehicle-sale":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Motor Vehicle Sale Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Seller\" means the party selling the Vehicle described herein.\n" +
          "(b) \"Buyer\" means the party purchasing the Vehicle described herein.\n" +
          "(c) \"Vehicle\" means the motor vehicle described in Clause 2.\n" +
          "(d) \"Purchase Price\" means the total price payable for the Vehicle.\n" +
          "(e) \"Delivery\" means the physical handover of the Vehicle together with all keys and documents.\n" +
          "(f) \"RTSA\" means the Road Transport and Safety Agency of Zambia.\n" +
          "(g) \"Title Documents\" means the Vehicle registration certificate (ZP38 Yellow Card), road tax disc, and any other ownership documentation.\n\n" +
          "This Agreement is subject to the Sale of Goods Act (Chapter 388), the Road Traffic Act (No. 11 of 2002), the Road Transport and Safety Agency Act (No. 13 of 2002), and the Competition and Consumer Protection Act (No. 24 of 2010) of the Republic of Zambia.",
          "definitions",
        ),
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
          "Current Mileage: _______________ km\n" +
          "Fuel Type: [Petrol / Diesel / Electric / Hybrid]\n" +
          "Transmission: [Manual / Automatic]\n" +
          "RTSA Fitness Status: [Valid until ___ / Expired / Not applicable]\n\n" +
          "The Vehicle is sold together with all its accessories, tools, spare wheel, and documents as listed in Schedule A.",
          "scope",
        ),
        makeClause(
          "Purchase Price and Payment",
          "The total Purchase Price for the Vehicle is ZMW [Amount] (Zambian Kwacha [Amount in Words] only).\n\n" +
          "Payment shall be made as follows:\n" +
          "(a) Deposit of ZMW [Amount] payable upon signing of this Agreement.\n" +
          "(b) Balance of ZMW [Amount] payable upon delivery and transfer of title.\n\n" +
          "Payment shall be made by [bank transfer / mobile money / cash]. The Seller shall issue an official receipt for all payments received.\n\n" +
          "No VAT is applicable on the sale of a used vehicle by a private individual. If the Seller is a registered motor vehicle dealer, VAT at 16% shall be charged in accordance with the Value Added Tax Act (Chapter 331).",
          "payment",
        ),
        makeClause(
          "Title, Ownership and RTSA Transfer",
          "The Seller warrants that they hold clear, legal, and unencumbered title to the Vehicle and have the full legal right to sell it.\n\n" +
          "Upon receipt of full payment:\n" +
          "(a) The Seller shall transfer all original Title Documents (ZP38 Yellow Card, registration certificate) to the Buyer;\n" +
          "(b) The parties shall jointly complete the necessary RTSA transfer forms within fourteen (14) days;\n" +
          "(c) The Buyer shall bear the RTSA transfer fees and any applicable road tax;\n" +
          "(d) Until RTSA transfer is completed, the Seller shall cooperate fully in the transfer process.\n\n" +
          "The transfer of ownership must comply with the Road Traffic Act (No. 11 of 2002) and the RTSA regulations. The Seller shall sign all necessary documents to effect the transfer.",
          "general",
        ),
        makeClause(
          "Condition of Vehicle and Warranties",
          "The Vehicle is sold in its current condition as inspected by the Buyer. The Seller warrants that:\n\n" +
          "(a) The Vehicle has not been involved in any major accident that affects its structural integrity, save as disclosed in writing in Schedule B;\n" +
          "(b) The odometer reading is accurate to the best of the Seller's knowledge;\n" +
          "(c) The Vehicle has not been stolen, reconstructed from salvage, or had its identity altered;\n" +
          "(d) There are no outstanding traffic fines or penalties associated with the Vehicle;\n" +
          "(e) All disclosed defects are set out in Schedule B.\n\n" +
          "Save for the above warranties, the Vehicle is sold on an 'as is, where is' basis. The Buyer is strongly advised to conduct an independent mechanical inspection and RTSA fitness test prior to signing this Agreement.\n\n" +
          "If the Seller is a registered motor vehicle dealer, additional consumer protection provisions under the Competition and Consumer Protection Act (No. 24 of 2010) apply.",
          "liability",
        ),
        makeClause(
          "Risk, Insurance and Road Fitness",
          "Risk of loss or damage to the Vehicle shall pass to the Buyer upon delivery of the Vehicle and transfer of all Title Documents and keys.\n\n" +
          "The Buyer shall be responsible for:\n" +
          "(a) Insuring the Vehicle from the date of delivery (third-party motor vehicle insurance is mandatory under the Road Traffic Act);\n" +
          "(b) Obtaining or renewing an RTSA Certificate of Fitness if expired;\n" +
          "(c) Paying road tax from the date of transfer.\n\n" +
          "Prior to delivery, the Vehicle shall remain at the risk and insurance of the Seller.",
          "general",
        ),
        makeClause(
          "Delivery",
          "The Seller shall deliver the Vehicle to the Buyer at [delivery location / address] on or before [date].\n\n" +
          "Delivery shall be deemed complete when the following are handed to the Buyer:\n" +
          "(a) The Vehicle in the condition described herein;\n" +
          "(b) All keys (including spare keys);\n" +
          "(c) Original ZP38 Yellow Card / registration certificate;\n" +
          "(d) Signed RTSA transfer forms;\n" +
          "(e) Valid RTSA Certificate of Fitness (if applicable);\n" +
          "(f) Current road tax disc (if applicable);\n" +
          "(g) Service history / maintenance records (if available).\n\n" +
          "Both parties shall sign a Delivery Confirmation receipt at the time of delivery.",
          "general",
        ),
        makeClause(
          "Encumbrances and Outstanding Finance",
          "The Seller confirms and warrants that the Vehicle is free from any charge, mortgage, hire-purchase agreement, lien, court attachment, or any other encumbrance.\n\n" +
          "If, after transfer, any undisclosed encumbrance is discovered, the Seller shall:\n" +
          "(a) Indemnify the Buyer for all costs, losses, and expenses arising;\n" +
          "(b) Take all steps necessary to clear the encumbrance at the Seller's cost;\n" +
          "(c) Be liable for any legal costs incurred by the Buyer in defending their title.\n\n" +
          "The Buyer may conduct a search at RTSA to verify that the Vehicle is free from encumbrances prior to signing.",
          "indemnification",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Motor Vehicle Sale Agreement shall first be resolved through good-faith negotiation within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation. If mediation is unsuccessful within thirty (30) days, the dispute shall be submitted to the courts of the Republic of Zambia having jurisdiction.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Motor Vehicle Sale Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Sale of Goods Act (Chapter 388), the Road Traffic Act (No. 11 of 2002), the Road Transport and Safety Agency Act (No. 13 of 2002), the Competition and Consumer Protection Act (No. 24 of 2010), and the Value Added Tax Act (Chapter 331).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "property-sale-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Property Sale Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Vendor\" means the party selling the Property described herein.\n" +
          "(b) \"Purchaser\" means the party purchasing the Property described herein.\n" +
          "(c) \"Property\" means the immovable property described in Clause 2.\n" +
          "(d) \"Purchase Price\" means the total price payable for the Property.\n" +
          "(e) \"Conveyancing Attorney\" means the legal practitioner instructed to handle the transfer.\n" +
          "(f) \"Transfer\" means the formal registration of the Property in the Purchaser's name at the Zambia Lands and Deeds Registry.\n" +
          "(g) \"Completion Date\" means the date on which Transfer is effected and vacant possession delivered.\n" +
          "(h) \"Stamp Duty\" means the duty payable on transfer instruments as prescribed.\n\n" +
          "This Agreement is subject to the Lands Act (No. 29 of 1995), the Lands and Deeds Registry Act (Chapter 185), the Land Survey Act (Chapter 188), the Conveyancing Act (Chapter 71), the Stamp Duty Act (Chapter 339), and the Property Transfer Tax Act (Chapter 340) of the Republic of Zambia.",
          "definitions",
        ),
        makeClause(
          "Property Description",
          "The Vendor agrees to sell and the Purchaser agrees to purchase the following property (hereinafter referred to as the \"Property\"):\n\n" +
          "Title / Deed Reference: _______________\n" +
          "Street Address: _______________\n" +
          "Stand / Plot Number: _______________\n" +
          "Survey Diagram Reference: _______________\n" +
          "Plot Area: _______________ m²\n" +
          "Location / Township: _______________\n" +
          "City / Town: _______________\n" +
          "Province: _______________\n" +
          "Land Tenure: [Leasehold (99 years) / Freehold / Customary]\n\n" +
          "The Property is sold together with all permanent structures, fixtures, fittings, and improvements as described in Schedule A, unless specifically excluded herein.\n\n" +
          "Note: Under the Lands Act (No. 29 of 1995), all land in Zambia is vested in the President and held on leasehold tenure (maximum 99 years). There is no freehold interest in land, except for customary tenure in traditional areas.",
          "scope",
        ),
        makeClause(
          "Purchase Price and Payment Schedule",
          "The total Purchase Price for the Property is ZMW [Amount] (Zambian Kwacha [Amount in Words] only), payable as follows:\n\n" +
          "(a) Initial deposit of ZMW [Amount] ([X]%) payable within seven (7) days of signing this Agreement, into the Conveyancing Attorney's trust account;\n" +
          "(b) Balance of ZMW [Amount] payable on or before the date of Transfer at the Lands and Deeds Registry.\n\n" +
          "All payments shall be made to the Vendor's Conveyancing Attorney or, where no attorney is instructed, directly to the Vendor against an official receipt.\n\n" +
          "Property Transfer Tax (PTT) at the prescribed rate under the Property Transfer Tax Act (Chapter 340) shall be payable by the Vendor (or as otherwise agreed). The current PTT rate is 5% of the purchase price or open market value, whichever is higher.\n\n" +
          "The Purchaser shall bear:\n" +
          "(a) Stamp duty on the transfer instruments;\n" +
          "(b) Registration fees at the Lands and Deeds Registry;\n" +
          "(c) Conveyancing attorney's fees;\n" +
          "(d) Any survey fees required.",
          "payment",
        ),
        makeClause(
          "Title and Conveyancing",
          "The Vendor warrants that they hold good and marketable title to the Property, free from all encumbrances, charges, mortgages, caveats, and third-party claims, save as disclosed herein.\n\n" +
          "The parties shall instruct a mutually agreed Conveyancing Attorney (who must hold a valid practising certificate under the Legal Practitioners Act, Chapter 30) to attend to the formal Transfer of the Property at the Zambia Lands and Deeds Registry.\n\n" +
          "The Conveyancing Attorney shall:\n" +
          "(a) Conduct a title search to confirm clean title;\n" +
          "(b) Obtain the State Consent to the assignment (where required under the Lands Act);\n" +
          "(c) Prepare the Assignment and all transfer documents;\n" +
          "(d) Submit for registration at the Lands and Deeds Registry;\n" +
          "(e) Deliver the new title deed to the Purchaser upon registration.\n\n" +
          "Transfer shall be completed within ninety (90) days of signing this Agreement, unless delayed by the Lands and Deeds Registry or State Consent process.",
          "general",
        ),
        makeClause(
          "State Consent",
          "Where the Property is held on State Leasehold, the Vendor acknowledges that State Consent to the assignment is required under Sections 5 and 6 of the Lands Act (No. 29 of 1995). The Vendor shall cooperate in obtaining State Consent by providing all required documentation.\n\n" +
          "If State Consent is refused, this Agreement shall be void and the full deposit shall be refunded to the Purchaser within fourteen (14) days. The parties acknowledge that the Commissioner of Lands may impose conditions on the consent.",
          "general",
        ),
        makeClause(
          "Vacant Possession",
          "The Vendor shall deliver vacant possession of the Property on the Completion Date (date of Transfer of title) or on such other date as the parties may agree in writing.\n\n" +
          "Vacant possession means:\n" +
          "(a) The Property shall be vacated by all occupants, tenants, and their belongings;\n" +
          "(b) All personal property not forming part of the sale shall be removed;\n" +
          "(c) The Property shall be in a clean and orderly condition;\n" +
          "(d) All keys, access devices, and security codes shall be handed to the Purchaser.\n\n" +
          "If the Vendor fails to deliver vacant possession on the agreed date, the Vendor shall pay the Purchaser a penalty of ZMW [Amount] per day of delay.",
          "general",
        ),
        makeClause(
          "Condition of Property",
          "The Purchaser acknowledges that they have inspected the Property and accepts it in its current condition ('voetstoots' / as is), subject to:\n\n" +
          "(a) Any defects expressly disclosed by the Vendor in Schedule B;\n" +
          "(b) Any patent (visible) defects that a reasonable inspection would reveal.\n\n" +
          "The Vendor shall not be liable for any latent defects arising after Transfer, except in cases of deliberate concealment or fraud. The Vendor warrants that, to the best of their knowledge:\n" +
          "(a) The Property has no structural defects not disclosed in Schedule B;\n" +
          "(b) All building works were carried out with the necessary local authority approvals;\n" +
          "(c) There are no pending or threatened claims, disputes, or proceedings affecting the Property.",
          "liability",
        ),
        makeClause(
          "Risk and Insurance",
          "Risk of loss or damage to the Property shall remain with the Vendor until the Completion Date (delivery of vacant possession and Transfer of title).\n\n" +
          "The Vendor shall maintain insurance over the Property until the Completion Date. From the Completion Date, all risk passes to the Purchaser, who is advised to arrange buildings insurance immediately.\n\n" +
          "If the Property is materially damaged or destroyed before the Completion Date, the Purchaser may elect to:\n" +
          "(a) Proceed with the purchase at the original Price, with the benefit of any insurance proceeds; or\n" +
          "(b) Cancel this Agreement and receive a full refund of all monies paid.",
          "general",
        ),
        makeClause(
          "Rates, Levies, and Outgoings",
          "All rates, ground rent, levies, municipal charges, and other outgoings shall be settled by the Vendor up to the Completion Date. From the Completion Date, all such charges shall be for the account of the Purchaser.\n\n" +
          "The Vendor shall provide evidence of payment of all outstanding rates and charges to the Conveyancing Attorney prior to Transfer. Outstanding rates may be deducted from the Purchase Price at the Vendor's cost.\n\n" +
          "Ground rent payable to the Commissioner of Lands must be current — failure to pay ground rent may result in re-entry by the State under the Lands Act.",
          "general",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Property Sale Agreement shall first be resolved through good-faith negotiation within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation. Disputes concerning land may be referred to the Lands Tribunal established under the Lands Tribunal Act (Chapter 228, as amended by Act No. 7 of 2024). If mediation is unsuccessful, the dispute shall be submitted to the High Court of Zambia (Lusaka) which has original jurisdiction in land matters.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Property Sale Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Lands Act (No. 29 of 1995), the Lands and Deeds Registry Act (Chapter 185), the Conveyancing Act (Chapter 71), the Land Survey Act (Chapter 188), the Property Transfer Tax Act (Chapter 340), the Stamp Duty Act (Chapter 339), and the Lands Tribunal Act (Chapter 228).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "loan-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Loan Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Lender\" means the party advancing the Loan.\n" +
          "(b) \"Borrower\" means the party receiving the Loan.\n" +
          "(c) \"Principal\" means the original amount of the Loan advanced.\n" +
          "(d) \"Interest\" means the cost of borrowing calculated at the agreed rate.\n" +
          "(e) \"Repayment Schedule\" means the schedule of instalments set out in Clause 5.\n" +
          "(f) \"Security\" or \"Collateral\" means the assets pledged as security for repayment.\n" +
          "(g) \"Event of Default\" means any of the events specified in Clause 7.\n" +
          "(h) \"Outstanding Balance\" means the Principal plus accrued Interest less any payments made.\n\n" +
          "This Agreement is governed by the Laws of the Republic of Zambia. If the Lender is a bank or financial institution, this Agreement is additionally subject to the Banking and Financial Services Act (No. 7 of 2017) and regulations of the Bank of Zambia. Interest rates are subject to the provisions of the Money Lenders Act (Chapter 398) where applicable. Securities over immovable property are subject to the Lands and Deeds Registry Act (Chapter 185).",
          "definitions",
        ),
        makeClause(
          "Loan Amount and Disbursement",
          "The Lender agrees to lend to the Borrower the sum of ZMW [Amount] (Zambian Kwacha [Amount in Words]) (hereinafter referred to as the \"Principal\").\n\n" +
          "The Lender shall disburse the Principal to the Borrower by [bank transfer to Account No. _______________ at _______________ Bank / mobile money to _______________] within [X] business days of:\n" +
          "(a) Execution of this Agreement by both parties;\n" +
          "(b) Completion of all conditions precedent (if any);\n" +
          "(c) Delivery of all security documents (if applicable).\n\n" +
          "The Lender shall provide written confirmation of disbursement.",
          "scope",
        ),
        makeClause(
          "Purpose of Loan",
          "The Borrower shall apply the Principal solely for the purpose of:\n\n" +
          "[State purpose — e.g., business working capital, property acquisition, vehicle purchase, education, medical, personal]\n\n" +
          "Any change in the purpose of the Loan requires the prior written consent of the Lender. Misapplication of funds shall constitute an Event of Default.",
          "general",
        ),
        makeClause(
          "Interest Rate",
          "The Principal shall bear interest at the rate of [X]% per annum (equivalent to [X]% per month), calculated on the outstanding balance from the date of disbursement.\n\n" +
          "Interest shall be calculated on a [simple / reducing balance / compound] basis.\n\n" +
          "Default Interest: In the event of default, a default interest rate of [X]% per month shall apply on all overdue amounts, in addition to the standard interest rate.\n\n" +
          "The interest rate charged must comply with the Money Lenders Act (Chapter 398), which prohibits unconscionable interest rates. Where the Lender is a bank or financial institution, interest rates shall be in accordance with the prevailing Bank of Zambia policy rate and guidelines.",
          "payment",
        ),
        makeClause(
          "Repayment Schedule",
          "The Borrower shall repay the Principal together with accrued interest as follows:\n\n" +
          "(a) Total amount repayable: ZMW [Total Amount]\n" +
          "(b) Monthly instalment: ZMW [Instalment Amount]\n" +
          "(c) First repayment date: [Date]\n" +
          "(d) Number of instalments: [Number]\n" +
          "(e) Final repayment date: [Date]\n" +
          "(f) Payment method: [Bank transfer / Mobile money / Standing order]\n\n" +
          "All payments shall be made to the Lender's designated account by the [1st / last] business day of each month. A detailed amortisation schedule is attached as Schedule A.\n\n" +
          "The Borrower shall receive a receipt or statement for each payment made.",
          "payment",
        ),
        makeClause(
          "Security / Collateral",
          "As security for repayment of the Loan, the Borrower provides the following as collateral:\n\n" +
          "Type: [Immovable property / Motor vehicle / Equipment / Personal guarantee / None]\n" +
          "Description: _______________\n" +
          "Estimated Value: ZMW [Amount]\n" +
          "Supporting Documents: _______________\n\n" +
          "Where the security is immovable property, a mortgage or charge shall be registered at the Lands and Deeds Registry in accordance with the Lands and Deeds Registry Act (Chapter 185).\n\n" +
          "Where the security is a motor vehicle, the Borrower shall deliver the original registration documents (ZP38) to the Lender until the Loan is fully repaid.\n\n" +
          "The Lender shall have the right to enforce and realise the security in the event of default, subject to appropriate legal process. The Lender may not seize collateral without a court order except where expressly permitted by law.",
          "general",
        ),
        makeClause(
          "Events of Default",
          "The following shall constitute Events of Default:\n\n" +
          "(a) Failure to pay any instalment within seven (7) days of its due date;\n" +
          "(b) The Borrower breaches any material term of this Agreement;\n" +
          "(c) Any representation or warranty made by the Borrower proves materially false;\n" +
          "(d) The Borrower becomes insolvent, is declared bankrupt, or enters liquidation proceedings under the Corporate Insolvency Act (No. 9 of 2017);\n" +
          "(e) The Borrower disposes of or encumbers the Collateral without the Lender's consent;\n" +
          "(f) A court judgement or order is made against the Borrower that materially affects their ability to repay;\n" +
          "(g) Death of the Borrower (if an individual) — the estate shall be liable for repayment.\n\n" +
          "Upon an Event of Default, the Lender may declare the entire Outstanding Balance immediately due and payable (acceleration) by giving written notice to the Borrower.",
          "termination",
        ),
        makeClause(
          "Prepayment",
          "The Borrower may prepay the Loan in whole or in part at any time upon seven (7) days' written notice to the Lender.\n\n" +
          "Early repayment terms:\n" +
          "(a) No prepayment penalty shall apply [OR: A prepayment fee of X% of the prepaid amount shall apply];\n" +
          "(b) Partial prepayments shall be applied first to outstanding interest, then to the Principal;\n" +
          "(c) Early full repayment shall discharge all obligations under this Agreement;\n" +
          "(d) The Lender shall release all security within fourteen (14) days of full repayment.",
          "general",
        ),
        makeClause(
          "Borrower's Representations and Warranties",
          "The Borrower represents and warrants that:\n\n" +
          "(a) They have the legal capacity to enter into this Agreement;\n" +
          "(b) All information provided to the Lender is true, accurate, and complete;\n" +
          "(c) They are not currently in default under any other loan agreement;\n" +
          "(d) The Collateral (if any) is free from encumbrances and the Borrower has full authority to pledge it;\n" +
          "(e) There are no pending or threatened legal proceedings that would materially affect their ability to repay;\n" +
          "(f) They shall not take any action that would diminish the value of the Collateral.",
          "general",
        ),
        COMMON_CLAUSES.indemnification(),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Loan Agreement shall first be resolved through good-faith negotiation within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation. If mediation is unsuccessful within thirty (30) days, the dispute shall be submitted to the courts of the Republic of Zambia having jurisdiction. For loans secured by immovable property, disputes may also be referred to the Lands Tribunal.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Loan Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Money Lenders Act (Chapter 398), the Banking and Financial Services Act (No. 7 of 2017) (where applicable), the Lands and Deeds Registry Act (Chapter 185), the Corporate Insolvency Act (No. 9 of 2017), and the Income Tax Act (Chapter 323).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "shareholders-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Shareholders Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Company\" means the company described in Clause 2.\n" +
          "(b) \"Shareholders\" means the parties to this Agreement who hold shares in the Company.\n" +
          "(c) \"Shares\" means the issued ordinary shares in the capital of the Company.\n" +
          "(d) \"Board\" means the Board of Directors of the Company.\n" +
          "(e) \"Reserved Matters\" means those matters listed in Clause 8 requiring unanimous Shareholder consent.\n" +
          "(f) \"Fair Market Value\" means the value of shares as determined by an independent qualified valuer.\n" +
          "(g) \"Articles\" means the Articles of Association of the Company.\n" +
          "(h) \"PACRA\" means the Patents and Companies Registration Agency of Zambia.\n\n" +
          "This Agreement is subject to the Companies Act (No. 10 of 2017), the Securities Act (No. 41 of 2016), the Corporate Insolvency Act (No. 9 of 2017), and the Income Tax Act (Chapter 323) of the Republic of Zambia. In the event of conflict between this Agreement and the Articles, this Agreement shall prevail to the extent permitted by law.",
          "definitions",
        ),
        makeClause(
          "Company Details",
          "The Company in respect of which this Agreement is made is:\n\n" +
          "Company Name: _______________\n" +
          "PACRA Registration Number: _______________\n" +
          "TPIN (Tax Payer Identification Number): _______________\n" +
          "Registered Address: _______________\n" +
          "Date of Incorporation: _______________\n" +
          "Authorised Share Capital: [X] shares of ZMW [Amount] each\n" +
          "Issued Share Capital: [X] shares\n\n" +
          "This Agreement binds all current Shareholders and shall be binding upon any person who becomes a Shareholder in the Company after the date of this Agreement, who shall be required to sign a Deed of Adherence.",
          "scope",
        ),
        makeClause(
          "Shareholding Structure",
          "As at the Effective Date, the issued share capital of the Company and the respective shareholdings are as follows:\n\n" +
          "Shareholder A: [Name] — [X] shares — ([X]%)\n" +
          "Shareholder B: [Name] — [X] shares — ([X]%)\n" +
          "[Shareholder C: [Name] — [X] shares — ([X]%)]\n\n" +
          "Total: [X] shares — 100%\n\n" +
          "Any increase in share capital, allotment of new shares, or issue of any securities convertible into shares shall require the unanimous written consent of all Shareholders, in compliance with Section 73 of the Companies Act (No. 10 of 2017).",
          "scope",
        ),
        makeClause(
          "Board Composition and Management",
          "The Board of Directors shall comprise [X] directors, appointed as follows:\n\n" +
          "(a) Each Shareholder holding [25]% or more of the issued shares shall be entitled to nominate [1] director;\n" +
          "(b) Independent directors may be appointed by unanimous resolution of the Board.\n\n" +
          "The Board shall:\n" +
          "(a) Meet at least quarterly, with a minimum of seven (7) days' written notice;\n" +
          "(b) Maintain proper minutes of all meetings;\n" +
          "(c) Decide matters by simple majority, except Reserved Matters;\n" +
          "(d) Have quorum of [X] directors present.\n\n" +
          "The Chairperson shall be [Name / rotated annually]. The Chairperson shall have a casting vote in the event of a tie, except on Reserved Matters.\n\n" +
          "Directors' duties and responsibilities are governed by Part VI of the Companies Act (No. 10 of 2017).",
          "general",
        ),
        makeClause(
          "Dividend Policy",
          "Subject to the Company's financial position, applicable law, and the Companies Act (No. 10 of 2017):\n\n" +
          "(a) The Company shall distribute dividends in proportion to each Shareholder's shareholding;\n" +
          "(b) Dividends shall be recommended by the Board and approved at the Annual General Meeting (AGM);\n" +
          "(c) No dividend shall be declared or paid out of capital or that would render the Company insolvent;\n" +
          "(d) The Company shall distribute not less than [X]% of annual net profits as dividends, unless the Board unanimously resolves to retain profits for reinvestment.\n\n" +
          "Withholding Tax on dividends shall be deducted at the rate prescribed by the Income Tax Act (Chapter 323) — currently 15% for resident individuals and 20% for non-residents.",
          "payment",
        ),
        makeClause(
          "Pre-Emption Rights",
          "Before transferring, selling, or disposing of any shares to a third party, a transferring Shareholder (the \"Transferor\") must first offer those shares to the existing Shareholders (the \"Offerees\") as follows:\n\n" +
          "(a) The Transferor shall serve a written Transfer Notice on all Offerees, stating the number of shares, proposed price, and proposed transferee;\n" +
          "(b) Offerees shall have the right to purchase the shares pro rata to their existing holdings;\n" +
          "(c) Offerees shall have thirty (30) days from receipt of the Transfer Notice to exercise their pre-emption right;\n" +
          "(d) If not all shares are taken up, the remaining shares shall be offered to willing Offerees for a further fourteen (14) days;\n" +
          "(e) Only if no Offeree exercises their right may the Transferor sell to the third party at a price not less than the offered price.\n\n" +
          "Share transfers must comply with Section 49 of the Companies Act (No. 10 of 2017) and be registered at PACRA.",
          "general",
        ),
        makeClause(
          "Drag-Along and Tag-Along Rights",
          "Drag-Along: If Shareholders holding more than [75]% of the shares wish to sell all their shares to a bona fide third-party purchaser, they may require the remaining Shareholders to sell their shares on the same terms and conditions. The remaining Shareholders shall execute all documents necessary to effect the sale.\n\n" +
          "Tag-Along: If any Shareholder wishes to sell shares to a third party, the remaining Shareholders shall have the right (but not the obligation) to include their shares in the sale on the same terms and conditions, pro rata to their holdings. The selling Shareholder must notify all other Shareholders at least thirty (30) days before completing the sale.",
          "general",
        ),
        makeClause(
          "Reserved Matters",
          "The following matters shall require the unanimous written consent of all Shareholders, and the Board shall not act without such consent:\n\n" +
          "(a) Amendment of the Articles of Association or Memorandum;\n" +
          "(b) Merger, acquisition, disposal, or winding up of the Company or any substantial part of its business;\n" +
          "(c) Issue of new shares, convertible securities, or dilution of existing Shareholders;\n" +
          "(d) Creation of any charge, mortgage, or encumbrance over Company assets exceeding ZMW [Amount];\n" +
          "(e) Incurring debt or financial obligations exceeding ZMW [Amount];\n" +
          "(f) Appointment or removal of the Company Secretary, auditors, or bankers;\n" +
          "(g) Entry into related-party transactions;\n" +
          "(h) Commencement or settlement of litigation exceeding ZMW [Amount];\n" +
          "(i) Establishment of subsidiaries or joint ventures;\n" +
          "(j) Any change in the nature of the Company's business.",
          "general",
        ),
        makeClause(
          "Deadlock Resolution",
          "In the event that the Shareholders are unable to reach agreement on a Reserved Matter after good-faith discussion:\n\n" +
          "(a) The matter shall be escalated to the Shareholders personally (if represented by nominees) for direct negotiation;\n" +
          "(b) If not resolved within thirty (30) days, either party may invoke the buy-out mechanism: one Shareholder offers to buy the other's shares at a stated price, and the other must either accept or buy the offering Shareholder's shares at the same price (\"Russian Roulette\" or \"Texas Shoot-Out\" mechanism);\n" +
          "(c) Alternatively, the Shareholders may agree to wind up the Company in an orderly manner under the Corporate Insolvency Act (No. 9 of 2017).",
          "dispute-resolution",
        ),
        COMMON_CLAUSES.confidentiality(),
        makeClause(
          "Non-Competition",
          "During the subsistence of this Agreement and for a period of [12/24] months after ceasing to be a Shareholder, no Shareholder shall:\n\n" +
          "(a) Directly or indirectly carry on, be engaged in, or have a material interest in any business competitive with the Company within Zambia;\n" +
          "(b) Solicit or entice away any customer, client, supplier, or employee of the Company;\n" +
          "(c) Use Confidential Information of the Company for personal gain.\n\n" +
          "This clause is enforceable to the extent permitted by the Competition and Consumer Protection Act (No. 24 of 2010) and the general law of restraint of trade in Zambia.",
          "non-compete",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Shareholders Agreement shall first be resolved through good-faith negotiation between the Shareholders within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation. If mediation is unsuccessful within thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act (No. 19 of 2000). The arbitral award shall be final and binding.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Shareholders Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Companies Act (No. 10 of 2017), the Securities Act (No. 41 of 2016), the Corporate Insolvency Act (No. 9 of 2017), the Competition and Consumer Protection Act (No. 24 of 2010), the Income Tax Act (Chapter 323), and the Arbitration Act (No. 19 of 2000).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "supply-agreement":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Supply Agreement, unless the context otherwise requires:\n\n" +
          "(a) \"Supplier\" means the party supplying the Products under this Agreement.\n" +
          "(b) \"Purchaser\" means the party purchasing the Products under this Agreement.\n" +
          "(c) \"Products\" means the goods and/or materials described in Schedule A.\n" +
          "(d) \"Purchase Order\" means a written order submitted by the Purchaser for Products.\n" +
          "(e) \"Delivery Note\" means the document accompanying each delivery of Products.\n" +
          "(f) \"Defective Products\" means Products that do not conform to the agreed specifications or are damaged.\n" +
          "(g) \"ZABS\" means the Zambia Bureau of Standards.\n\n" +
          "This Agreement is subject to the Sale of Goods Act (Chapter 388), the Competition and Consumer Protection Act (No. 24 of 2010), the Value Added Tax Act (Chapter 331), the Standards Act (Chapter 416), and the Public Procurement Act (No. 8 of 2020) where applicable.",
          "definitions",
        ),
        makeClause(
          "Scope and Products",
          "The Supplier agrees to supply and the Purchaser agrees to purchase the Products described in Schedule A on the terms set out herein.\n\n" +
          "Schedule A shall specify:\n" +
          "(a) Product descriptions and specifications;\n" +
          "(b) ZABS standards applicable (if any);\n" +
          "(c) Unit prices;\n" +
          "(d) Minimum and maximum order quantities;\n" +
          "(e) Lead times for delivery.\n\n" +
          "The parties may amend Schedule A by mutual written agreement. All Products must comply with applicable Zambian standards issued by the Zambia Bureau of Standards (ZABS) under the Standards Act (Chapter 416).",
          "scope",
        ),
        makeClause(
          "Orders and Acceptance",
          "The Purchaser shall submit Purchase Orders to the Supplier in writing (including email). Each Purchase Order shall specify:\n" +
          "(a) Products required (by reference to Schedule A);\n" +
          "(b) Quantities;\n" +
          "(c) Required delivery date;\n" +
          "(d) Delivery address.\n\n" +
          "The Supplier shall confirm acceptance of each Purchase Order within [3/5] business days. An accepted Purchase Order constitutes a binding obligation. The Supplier shall notify the Purchaser immediately if it is unable to fulfil any order.\n\n" +
          "If this Agreement arises from a public procurement process, the provisions of the Public Procurement Act (No. 8 of 2020) shall apply.",
          "scope",
        ),
        makeClause(
          "Pricing and Payment",
          "Products shall be supplied at the prices set out in Schedule A.\n\n" +
          "Price adjustments: The Supplier may adjust prices with at least thirty (30) days' written notice, effective from the next order placed after the notice period. Prices for accepted Purchase Orders are fixed.\n\n" +
          "Invoicing: The Supplier shall submit a VAT-compliant tax invoice with each delivery. All prices are exclusive of VAT at 16% under the Value Added Tax Act (Chapter 331).\n\n" +
          "Payment terms: Invoices are payable within [30/60] days of delivery and receipt of a valid invoice.\n\n" +
          "Late payment: The Supplier may charge interest at [2]% per month on overdue amounts.\n\n" +
          "Withholding Tax: Where applicable, the Purchaser shall deduct Withholding Tax as required by the Income Tax Act (Chapter 323) and provide a withholding tax certificate.",
          "payment",
        ),
        makeClause(
          "Delivery and Risk",
          "The Supplier shall deliver Products to the Purchaser's specified address within the agreed lead time.\n\n" +
          "Delivery terms:\n" +
          "(a) Each delivery shall be accompanied by a Delivery Note specifying Products, quantities, and order reference;\n" +
          "(b) Risk of loss or damage shall pass to the Purchaser upon delivery and signature of the Delivery Note;\n" +
          "(c) Title to Products shall not pass until full payment is received (Retention of Title — Section 19 of the Sale of Goods Act, Chapter 388);\n" +
          "(d) The Supplier shall bear all delivery and transport costs to the specified address;\n" +
          "(e) Short deliveries must be reported within two (2) business days;\n" +
          "(f) The Supplier is liable for any damage caused during transit.",
          "general",
        ),
        makeClause(
          "Quality, Inspection, and Standards",
          "All Products shall conform to:\n" +
          "(a) The specifications set out in Schedule A;\n" +
          "(b) Applicable ZABS standards under the Standards Act (Chapter 416);\n" +
          "(c) Any industry-specific regulatory requirements.\n\n" +
          "The Purchaser shall inspect Products within five (5) business days of delivery (the \"Inspection Period\") and notify the Supplier of any defects, non-conformities, or shortages.\n\n" +
          "Failure to notify within the Inspection Period shall constitute acceptance, save for latent defects which may be notified within the warranty period.\n\n" +
          "The Supplier shall maintain quality management systems and permit the Purchaser to conduct audits of its facilities with reasonable notice.",
          "liability",
        ),
        makeClause(
          "Warranty and Defective Products",
          "The Supplier warrants that all Products shall:\n" +
          "(a) Be free from defects in materials and workmanship;\n" +
          "(b) Conform to the agreed specifications and applicable standards;\n" +
          "(c) Be of merchantable quality and fit for purpose (Sale of Goods Act, Chapter 388).\n\n" +
          "Warranty period: [X] months from delivery.\n\n" +
          "For Defective Products, the Supplier shall, at the Purchaser's option:\n" +
          "(a) Replace the Defective Products within [X] business days; or\n" +
          "(b) Issue a full credit note or refund.\n\n" +
          "The cost of returning Defective Products shall be borne by the Supplier.",
          "liability",
        ),
        COMMON_CLAUSES.confidentiality(),
        COMMON_CLAUSES.liability(),
        COMMON_CLAUSES.forceMajeure(),
        makeClause(
          "Termination",
          "Either party may terminate this Agreement:\n\n" +
          "(a) By giving sixty (60) days' written notice to the other party;\n" +
          "(b) Immediately if the other party commits a material breach and fails to remedy within fourteen (14) days of written notice;\n" +
          "(c) Immediately if the other party becomes insolvent, enters liquidation (under the Corporate Insolvency Act, No. 9 of 2017), or has a receiver appointed.\n\n" +
          "Upon termination:\n" +
          "(a) All accepted Purchase Orders shall be fulfilled unless otherwise agreed;\n" +
          "(b) The Purchaser shall pay for all Products delivered and accepted;\n" +
          "(c) The Supplier shall return any advance payments for undelivered Products.\n\n" +
          "The Confidentiality, Warranty, and Dispute Resolution clauses survive termination.",
          "termination",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Supply Agreement shall first be resolved through good-faith negotiation within fourteen (14) days. If negotiation fails, the dispute shall be referred to mediation. If mediation is unsuccessful within thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act (No. 19 of 2000), or either party may refer the matter to the courts of the Republic of Zambia.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Supply Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the Sale of Goods Act (Chapter 388), the Competition and Consumer Protection Act (No. 24 of 2010), the Value Added Tax Act (Chapter 331), the Standards Act (Chapter 416), and the Arbitration Act (No. 19 of 2000).",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "mou":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Memorandum of Understanding (\"MOU\"), unless the context otherwise requires:\n\n" +
          "(a) \"Parties\" means the signatories to this MOU.\n" +
          "(b) \"First Party\" or \"Party A\" means [Name of first party].\n" +
          "(c) \"Second Party\" or \"Party B\" means [Name of second party].\n" +
          "(d) \"Collaboration\" means the joint activities described in Clause 3.\n" +
          "(e) \"Effective Date\" means the date on which both Parties have executed this MOU.\n" +
          "(f) \"Binding Provisions\" means those clauses expressly stated to be legally binding (Confidentiality and Governing Law).\n\n" +
          "This MOU records the Parties' mutual understanding and intent regarding their proposed collaboration and is governed by the Laws of the Republic of Zambia.",
          "definitions",
        ),
        makeClause(
          "Purpose and Background",
          "The Parties enter into this MOU to record their mutual intent and understanding regarding:\n\n" +
          "[Describe the collaboration, project, partnership, or joint initiative in detail]\n\n" +
          "Background:\n" +
          "(a) Party A is [brief description of Party A and their relevant capability/expertise];\n" +
          "(b) Party B is [brief description of Party B and their relevant capability/expertise];\n" +
          "(c) The Parties have identified mutual benefits in collaborating on [describe area];\n" +
          "(d) This MOU establishes a framework for cooperation and sets out the guiding principles for the Parties' working relationship.",
          "scope",
        ),
        makeClause(
          "Scope of Collaboration",
          "The Parties intend to collaborate on the following activities:\n\n" +
          "(a) [Activity 1 — describe clearly with expected outcomes]\n" +
          "(b) [Activity 2 — describe clearly with expected outcomes]\n" +
          "(c) [Activity 3 — describe clearly with expected outcomes]\n\n" +
          "The specific terms, deliverables, timelines, budgets, and financial arrangements for each activity shall be set out in separate binding agreements executed by both Parties as required. This MOU does not commit either Party to undertake any specific activity.",
          "scope",
        ),
        makeClause(
          "Roles and Responsibilities",
          "Party A shall be responsible for:\n" +
          "(a) [List responsibilities]\n" +
          "(b) [List responsibilities]\n\n" +
          "Party B shall be responsible for:\n" +
          "(a) [List responsibilities]\n" +
          "(b) [List responsibilities]\n\n" +
          "Joint responsibilities:\n" +
          "(a) Regular progress meetings [monthly / quarterly];\n" +
          "(b) Sharing of relevant information and resources;\n" +
          "(c) Good-faith cooperation in furtherance of the Collaboration.\n\n" +
          "Each Party shall designate a primary contact person and notify the other of any change in contact within five (5) business days.",
          "scope",
        ),
        makeClause(
          "Non-Binding Nature",
          "IMPORTANT: This MOU is a statement of intent only and does NOT constitute a legally binding agreement, except for the Binding Provisions (Confidentiality and Governing Law).\n\n" +
          "Specifically:\n" +
          "(a) Neither Party shall have any legally enforceable rights or obligations arising from this MOU, except under the Binding Provisions;\n" +
          "(b) This MOU does not create any partnership, joint venture, agency, or employment relationship;\n" +
          "(c) Neither Party has authority to bind the other or make representations on the other's behalf;\n" +
          "(d) This MOU does not obligate either Party to enter into any future binding agreement.\n\n" +
          "Any legally binding commitments shall be contained in separate agreements duly negotiated and executed by both Parties.",
          "general",
        ),
        makeClause(
          "Financial Arrangements",
          "Unless separately agreed in writing:\n\n" +
          "(a) Each Party shall bear its own costs and expenses incurred in connection with this MOU and the Collaboration;\n" +
          "(b) Neither Party shall be liable for any costs or expenses incurred by the other;\n" +
          "(c) Any joint expenditure shall be subject to a separate cost-sharing agreement signed by both Parties;\n" +
          "(d) Any intellectual property developed jointly shall be addressed in a separate IP agreement.\n\n" +
          "If any financial obligations arise, they shall be documented in binding agreements and shall comply with the Income Tax Act (Chapter 323) and Value Added Tax Act (Chapter 331) where applicable.",
          "payment",
        ),
        makeClause(
          "Term and Termination",
          "This MOU shall become effective on the Effective Date and shall remain in force for a period of [X] month(s) / year(s), unless:\n\n" +
          "(a) Extended by mutual written agreement of both Parties;\n" +
          "(b) Terminated by either Party giving thirty (30) days' written notice to the other;\n" +
          "(c) Superseded by a binding agreement between the Parties.\n\n" +
          "Upon termination of this MOU:\n" +
          "(a) The Confidentiality clause shall survive for a period of [2/3] years;\n" +
          "(b) Each Party shall return or destroy any Confidential Information of the other;\n" +
          "(c) Neither Party shall have any claim against the other arising from this MOU.",
          "termination",
        ),
        makeClause(
          "Confidentiality (BINDING)",
          "This clause is legally binding on both Parties.\n\n" +
          "Each Party agrees to keep confidential all information received from the other Party in connection with this MOU and the Collaboration, and shall not disclose such information to any third party without the prior written consent of the disclosing Party.\n\n" +
          "This obligation does not apply to information that:\n" +
          "(a) Is or becomes publicly available through no fault of the receiving Party;\n" +
          "(b) Was already known to the receiving Party;\n" +
          "(c) Is independently developed without reference to Confidential Information;\n" +
          "(d) Is required to be disclosed by law or court order.\n\n" +
          "This confidentiality obligation shall survive the termination of this MOU for a period of [2/3] years.",
          "confidentiality",
        ),
        makeClause(
          "Intellectual Property",
          "Nothing in this MOU grants either Party any intellectual property rights of the other Party.\n\n" +
          "Any intellectual property:\n" +
          "(a) Owned by a Party prior to this MOU shall remain the sole property of that Party;\n" +
          "(b) Developed independently by a Party shall remain the property of that Party;\n" +
          "(c) Developed jointly in the course of the Collaboration shall be addressed in a separate binding IP agreement.\n\n" +
          "IP rights are subject to the Copyright and Performance Rights Act (No. 44 of 1994), the Patents Act (Chapter 400), and the Trade Marks Act (Chapter 401) of Zambia.",
          "intellectual-property",
        ),
        makeClause(
          "Governing Law (BINDING)",
          "This clause is legally binding on both Parties.\n\n" +
          "This MOU shall be governed by and construed in accordance with the Laws of the Republic of Zambia. Any dispute arising in connection with this MOU or the Binding Provisions shall be resolved through good-faith negotiation. If not resolved within thirty (30) days, either Party may refer the matter to the courts of the Republic of Zambia.",
          "general",
        ),
        COMMON_CLAUSES.entireAgreement(),
      ];

    case "construction-contract":
      return [
        makeClause(
          "Definitions and Interpretation",
          "In this Construction Contract, unless the context otherwise requires:\n\n" +
          "(a) \"Employer\" or \"Owner\" means the party commissioning the Works.\n" +
          "(b) \"Contractor\" means the party undertaking the Works.\n" +
          "(c) \"Works\" means the construction works described in Clause 2 and the Contract Documents.\n" +
          "(d) \"Contract Sum\" means the total agreed price for the Works.\n" +
          "(e) \"Contract Documents\" means this Agreement, the Bill of Quantities, drawings, specifications, and any addenda.\n" +
          "(f) \"Practical Completion\" means the stage when the Works are substantially complete and fit for occupation or use.\n" +
          "(g) \"Defects Liability Period\" means the period following Practical Completion during which the Contractor is liable for defects.\n" +
          "(h) \"Variation\" means any alteration, addition, or omission to the Works instructed by the Employer.\n" +
          "(i) \"NCC\" means the National Council for Construction of Zambia.\n" +
          "(j) \"Site\" means the location where the Works are to be carried out.\n\n" +
          "This Contract is subject to the National Council for Construction Act (No. 13 of 2003), the Occupational Health and Safety Act (No. 16 of 2025), the Workers' Compensation Act (Chapter 271), the Engineering Institution of Zambia Act (Chapter 432), and the Public Procurement Act (No. 8 of 2020) where applicable.",
          "definitions",
        ),
        makeClause(
          "Project Description and Scope of Works",
          "The Contractor shall carry out and complete the following construction works (hereinafter referred to as the \"Works\"):\n\n" +
          "Project Name: _______________\n" +
          "Site Address: _______________\n" +
          "Stand/Plot Number: _______________\n" +
          "Nature of Works: [New construction / Renovation / Extension / Demolition]\n" +
          "NCC Contractor Registration Grade: _______________\n\n" +
          "The full scope of Works is described in:\n" +
          "(a) Bill of Quantities (Schedule A);\n" +
          "(b) Architectural drawings (Schedule B);\n" +
          "(c) Engineering specifications (Schedule C);\n" +
          "(d) Any other documents forming part of this Contract.\n\n" +
          "The Contractor shall perform the Works in a good and workmanlike manner using materials of satisfactory quality that comply with applicable Zambian Standards (ZABS). The Contractor must hold a valid NCC registration certificate appropriate to the value and nature of the Works, in accordance with the National Council for Construction Act (No. 13 of 2003).",
          "scope",
        ),
        makeClause(
          "Contract Sum and Payment Milestones",
          "The total Contract Sum is ZMW [Amount] (Zambian Kwacha [Amount in Words] only), inclusive of all labour, materials, plant, overheads, and profit, payable as follows:\n\n" +
          "(a) Mobilisation advance: [X]% upon commencement — ZMW [Amount]\n" +
          "(b) Foundation complete: [X]% — ZMW [Amount]\n" +
          "(c) Roof level complete: [X]% — ZMW [Amount]\n" +
          "(d) Plastering and fitting-out complete: [X]% — ZMW [Amount]\n" +
          "(e) Practical Completion and handover: [X]% — ZMW [Amount]\n\n" +
          "Each milestone payment is due within fourteen (14) days of the Employer's written certification (or the Project Manager/Architect's interim certificate) that the milestone has been achieved.\n\n" +
          "VAT at 16% shall be charged on each payment in accordance with the Value Added Tax Act (Chapter 331). The Employer shall deduct Withholding Tax at the prescribed rate under the Income Tax Act (Chapter 323) and provide a withholding tax certificate.",
          "payment",
        ),
        makeClause(
          "Commencement, Programme, and Completion",
          "The Contractor shall commence the Works on [Start Date] (the \"Commencement Date\") and shall achieve Practical Completion no later than [Completion Date] (the \"Completion Date\"), being a contract period of [X] weeks/months.\n\n" +
          "The Contractor shall submit a detailed construction programme (Gantt chart) within seven (7) days of the Commencement Date, showing:\n" +
          "(a) Sequence of activities;\n" +
          "(b) Milestone dates;\n" +
          "(c) Critical path;\n" +
          "(d) Resource allocation.\n\n" +
          "Time is of the essence. Extensions of time may be granted only for:\n" +
          "(a) Force Majeure events;\n" +
          "(b) Employer-caused delays (late instructions, restricted site access);\n" +
          "(c) Variations instructed by the Employer;\n" +
          "(d) Exceptionally adverse weather conditions.\n\n" +
          "The Contractor must submit a written request for extension within seven (7) days of the delay-causing event.",
          "general",
        ),
        makeClause(
          "Liquidated Damages for Delay",
          "If the Contractor fails to achieve Practical Completion by the Completion Date (as may be extended), the Contractor shall pay the Employer liquidated damages at the rate of ZMW [Amount] per calendar day of delay, up to a maximum of [10]% of the Contract Sum.\n\n" +
          "The parties acknowledge and agree that:\n" +
          "(a) This rate represents a genuine pre-estimate of the Employer's losses due to late completion;\n" +
          "(b) Liquidated damages are the Employer's sole remedy for delay (but not for defective work);\n" +
          "(c) The Employer may deduct liquidated damages from payments due to the Contractor.",
          "liability",
        ),
        makeClause(
          "Retention",
          "The Employer shall retain five percent (5%) from each certified payment (\"Retention\") as security for the Contractor's performance.\n\n" +
          "Maximum Retention: ZMW [Amount] (or [5]% of the Contract Sum, whichever is less).\n\n" +
          "Release of Retention:\n" +
          "(a) One-half (50%) shall be released upon Practical Completion;\n" +
          "(b) The remaining half shall be released at the end of the Defects Liability Period, subject to all defects having been satisfactorily rectified.",
          "payment",
        ),
        makeClause(
          "Defects Liability Period",
          "The Contractor shall rectify all defects, shrinkages, settling, or other faults appearing within twelve (12) months of Practical Completion (the \"Defects Liability Period\") at no additional cost to the Employer.\n\n" +
          "The Contractor shall:\n" +
          "(a) Respond to defect notifications within seven (7) days;\n" +
          "(b) Complete rectification within thirty (30) days of notification (or such longer period as may be reasonable for the nature of the defect);\n" +
          "(c) Guarantee rectified work for a further twelve (12) months from the date of rectification.\n\n" +
          "If the Contractor fails to rectify within the specified period, the Employer may engage others to carry out the rectification and recover all costs from the Contractor (including from the Retention).",
          "liability",
        ),
        makeClause(
          "Variations and Additional Works",
          "The Employer may at any time instruct Variations to the Works in writing. No Variation shall invalidate this Contract.\n\n" +
          "Variation procedure:\n" +
          "(a) The Employer issues a written Variation Instruction;\n" +
          "(b) The Contractor provides a costed proposal within seven (7) days;\n" +
          "(c) The value of the Variation is agreed in writing before work commences;\n" +
          "(d) No additional payment shall be made for work carried out without a written Variation Order signed by the Employer.\n\n" +
          "Variations shall be valued using:\n" +
          "(a) Rates from the Bill of Quantities where applicable;\n" +
          "(b) Negotiated rates for work not covered by the Bill of Quantities.",
          "general",
        ),
        makeClause(
          "Health, Safety, and Environment",
          "The Contractor shall comply with all health, safety, and environmental regulations, including:\n\n" +
          "(a) The Occupational Health and Safety Act (No. 16 of 2025) — the Contractor shall maintain a safe working environment, provide personal protective equipment (PPE), and conduct regular safety briefings;\n" +
          "(b) The Environmental Management Act (No. 12 of 2011) — the Contractor shall minimise environmental impact and obtain any required Environmental Impact Assessment (EIA) approvals;\n" +
          "(c) The Workers' Compensation Act (Chapter 271) — the Contractor shall register with the Workers' Compensation Fund Commissioner and maintain coverage for all workers.\n\n" +
          "The Contractor shall:\n" +
          "(a) Appoint a qualified Safety Officer for the duration of the Works;\n" +
          "(b) Maintain an accident register and report all incidents;\n" +
          "(c) Not employ child labour (Employment Code Act, 2019, Section 25);\n" +
          "(d) Pay workers at least the minimum wage (Minimum Wages and Conditions of Employment Act, Chapter 276).",
          "general",
        ),
        makeClause(
          "Insurance",
          "The Contractor shall maintain throughout the project the following insurance policies:\n\n" +
          "(a) Contractor's All Risk Insurance: Covering the Works, temporary works, plant, and materials against all risks (fire, theft, vandalism, natural disasters) for the full Contract Sum;\n" +
          "(b) Public Liability Insurance: Minimum ZMW [Amount] per occurrence, covering injury or damage to third parties and their property;\n" +
          "(c) Employer's Liability / Workers' Compensation Insurance: As required by the Workers' Compensation Act (Chapter 271), covering all workers on site;\n" +
          "(d) Motor Vehicle Insurance: For all vehicles used in connection with the Works.\n\n" +
          "Evidence of insurance (certificates and policy documents) shall be provided to the Employer before commencement of the Works. The Contractor shall notify the Employer immediately of any lapse, cancellation, or material change in insurance coverage.",
          "general",
        ),
        COMMON_CLAUSES.forceMajeure(),
        makeClause(
          "Termination",
          "Termination by Employer:\n" +
          "(a) The Employer may terminate with fourteen (14) days' written notice if the Contractor commits a material breach (including persistent delays, defective work, safety violations, or failure to maintain insurance) and fails to remedy within the notice period;\n" +
          "(b) The Employer may terminate immediately if the Contractor becomes insolvent, is deregistered by NCC, or abandons the Works.\n\n" +
          "Termination by Contractor:\n" +
          "(a) The Contractor may terminate with fourteen (14) days' written notice if the Employer fails to make certified payments within thirty (30) days of the due date;\n" +
          "(b) The Contractor may terminate if the Employer suspends the Works for more than ninety (90) consecutive days.\n\n" +
          "Upon termination:\n" +
          "(a) The Contractor shall secure the Site and protect completed work;\n" +
          "(b) The Employer shall pay for all work properly executed up to the date of termination;\n" +
          "(c) All plant, materials, and temporary works paid for become the Employer's property.",
          "termination",
        ),
        makeClause(
          "Dispute Resolution",
          "Any dispute arising from this Construction Contract shall be resolved as follows:\n\n" +
          "(a) Site Meeting: The parties shall first attempt to resolve the dispute through a joint site meeting within seven (7) days;\n" +
          "(b) Senior Management: If unresolved, the matter shall be escalated to senior management representatives within fourteen (14) days;\n" +
          "(c) Mediation: If still unresolved, the dispute shall be referred to mediation;\n" +
          "(d) Arbitration: If mediation fails within thirty (30) days, the dispute shall be submitted to arbitration in Lusaka in accordance with the Arbitration Act (No. 19 of 2000).\n\n" +
          "Disputes involving allegations of professional negligence may be referred to the Engineering Institution of Zambia (EIZ) or the relevant professional body. Pending resolution, the Contractor shall continue with the Works unless instructed otherwise.",
          "dispute-resolution",
        ),
        makeClause(
          "Governing Law",
          "This Construction Contract shall be governed by and construed in accordance with the Laws of the Republic of Zambia, including the National Council for Construction Act (No. 13 of 2003), the Occupational Health and Safety Act (No. 16 of 2025), the Workers' Compensation Act (Chapter 271), the Environmental Management Act (No. 12 of 2011), the Engineering Institution of Zambia Act (Chapter 432), the Public Procurement Act (No. 8 of 2020) (where applicable), and the Arbitration Act (No. 19 of 2000).",
          "general",
        ),
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
    case "service-agreement":
      return `This Service Agreement is entered into between ${a} (hereinafter referred to as the "Service Provider") and ${b} (hereinafter referred to as the "Client"), setting forth the terms and conditions under which the Service Provider shall render professional services. This Agreement is governed by the general law of contract of the Republic of Zambia, the Sale of Goods Act (Chapter 388) where applicable, and the Value Added Tax Act (Chapter 331).`;
    case "nda":
      return `This Non-Disclosure Agreement is entered into for the purpose of preventing the unauthorised disclosure of Confidential Information as defined below. ${a} and ${b} agree to the following terms regarding the protection of confidential and proprietary information, subject to the Laws of the Republic of Zambia, including the Copyright and Performance Rights Act (No. 44 of 1994), the Patents Act (Chapter 400), and the Trade Marks Act (Chapter 401) insofar as they relate to intellectual property protection.`;
    case "employment-contract":
      return `This Employment Contract is entered into between ${a} (hereinafter referred to as the "Employer") and ${b} (hereinafter referred to as the "Employee"), setting forth the terms and conditions of employment. Both parties acknowledge and agree that this contract is governed by the Employment Code Act, 2019 (No. 3 of 2019), the Minimum Wages and Conditions of Employment Act (Chapter 276), and all other applicable labour legislation of the Republic of Zambia.`;
    case "freelance-agreement":
      return `This Freelance Agreement is entered into between ${a} (hereinafter referred to as the "Client") and ${b} (hereinafter referred to as the "Freelancer"), for the provision of independent professional services on the terms set out herein. The Freelancer is engaged as an independent contractor and not as an employee; accordingly, the Employment Code Act, 2019 (No. 3 of 2019) does not apply. This Agreement is governed by the general law of contract of the Republic of Zambia.`;
    case "partnership-agreement":
      return `This Partnership Agreement is entered into by ${a} and ${b} who desire to form a partnership and agree upon the terms and conditions governing its operations, management, and dissolution, in accordance with the Partnership Act (Chapter 119 of the Laws of Zambia) and subject to registration requirements under the Patents and Companies Registration Agency (PACRA).`;
    case "lease-agreement":
      return `This Lease Agreement is entered into between ${a} (hereinafter referred to as the "Landlord") and ${b} (hereinafter referred to as the "Tenant") for the lease of the commercial premises described herein, subject to the provisions of the Landlord and Tenant (Business Premises) Act, Chapter 190, the Lands Act No. 29 of 1995, and the Lands and Deeds Registry Act, Chapter 185 of the Laws of Zambia.`;
    case "tenancy-agreement":
      return `This Residential Tenancy Agreement is entered into between ${a} (hereinafter referred to as the "Landlord") and ${b} (hereinafter referred to as the "Tenant") for the letting and occupation of the residential premises described herein. This Agreement is subject to the Rent Act, Chapter 206 of the Laws of Zambia, and the general common law applicable to residential tenancies in the Republic of Zambia, and shall be enforceable upon execution by both parties.`;
    case "sales-agreement":
      return `This Sales Agreement is entered into between ${a} (hereinafter referred to as the "Seller") and ${b} (hereinafter referred to as the "Buyer") for the sale and purchase of goods described herein. This Agreement is governed by the Sale of Goods Act (Chapter 388 of the Laws of Zambia), the Competition and Consumer Protection Act (No. 24 of 2010), and the Value Added Tax Act (Chapter 331).`;
    case "consulting-agreement":
      return `This Consulting Agreement is entered into between ${a} (hereinafter referred to as the "Client") and ${b} (hereinafter referred to as the "Consultant"), for the provision of specialised advisory and consulting services. The Consultant is engaged as an independent professional and not as an employee. This Agreement is governed by the general law of contract of the Republic of Zambia and the Income Tax Act (Chapter 323) insofar as it relates to withholding tax obligations.`;
    case "motor-vehicle-sale":
      return `This Motor Vehicle Sale Agreement is entered into between ${a} (hereinafter referred to as the "Seller") and ${b} (hereinafter referred to as the "Buyer"), for the sale and purchase of the motor vehicle described herein. This Agreement is subject to the Road Traffic Act (No. 11 of 2002), the Road Transport and Safety Agency Act (No. 13 of 2002), the Sale of Goods Act (Chapter 388), and all applicable laws of the Republic of Zambia.`;
    case "property-sale-agreement":
      return `This Property Sale Agreement is entered into between ${a} (hereinafter referred to as the "Vendor") and ${b} (hereinafter referred to as the "Purchaser"), for the sale and purchase of the immovable property described herein. This Agreement is subject to the Lands Act (No. 29 of 1995), the Lands and Deeds Registry Act (Chapter 185), the Property Transfer Tax Act (Chapter 340), the Stamp Duty Act (Chapter 339), and all applicable laws of the Republic of Zambia.`;
    case "loan-agreement":
      return `This Loan Agreement is entered into between ${a} (hereinafter referred to as the "Lender") and ${b} (hereinafter referred to as the "Borrower"). The Lender agrees to advance a loan to the Borrower on the terms set out herein, and the Borrower agrees to repay such loan in accordance with the repayment schedule below. This Agreement is subject to the Banking and Financial Services Act (No. 7 of 2017), the Money Lenders Act (Chapter 398) where applicable, and the general law of contract of the Republic of Zambia.`;
    case "shareholders-agreement":
      return `This Shareholders Agreement is entered into between ${a} and ${b} (collectively referred to as the "Shareholders"), in relation to their shareholding in the Company described herein. The Shareholders agree to regulate their rights, obligations, and relationship in accordance with this Agreement, the Companies Act (No. 10 of 2017), the Securities Act (No. 41 of 2016), and the Laws of the Republic of Zambia.`;
    case "supply-agreement":
      return `This Supply Agreement is entered into between ${a} (hereinafter referred to as the "Supplier") and ${b} (hereinafter referred to as the "Purchaser") for the ongoing supply of goods and materials as described herein. This Agreement is governed by the Sale of Goods Act (Chapter 388), the Standards Act (Chapter 416), and the Value Added Tax Act (Chapter 331) of the Laws of the Republic of Zambia.`;
    case "mou":
      return `This Memorandum of Understanding is entered into in a spirit of mutual cooperation between ${a} and ${b}. The parties record their shared understanding, intentions, and the framework for their collaboration as described herein. This MOU is not intended to create legally binding obligations except as expressly stated, and is governed by the Laws of the Republic of Zambia.`;
    case "construction-contract":
      return `This Construction Contract is entered into between ${a} (hereinafter referred to as the "Contractor") and ${b} (hereinafter referred to as the "Employer" or "Owner") for the execution and completion of the construction works described herein. This Contract is subject to the National Council for Construction Act (No. 13 of 2003), the Occupational Health and Safety Act (No. 16 of 2025), the Workers' Compensation Act (Chapter 271), and the Arbitration Act (No. 19 of 2000) of the Laws of the Republic of Zambia.`;
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
      showCoverPage: true,
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
