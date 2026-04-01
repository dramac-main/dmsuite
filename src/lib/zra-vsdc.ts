// =============================================================================
// DMSuite — ZRA Smart Invoice VSDC Client
// Adapter for Zambia Revenue Authority Virtual Sales Data Controller (VSDC)
// Based on the official VSDC API specification and vsdcsdk patterns.
// =============================================================================

// ━━━ Enums & Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export enum ZRATaxType {
  StandardRated = "A",        // 16% VAT
  MinimumTaxableValue = "B",  // 16% on retail price
  Exports = "C1",             // 0%
  ZeroRatedLocal = "C2",      // 0%
  ZeroRatedNature = "C3",     // 0%
  Exempt = "D",               // No tax
  TurnoverTax = "TOT",        // Turnover tax — no VAT
}

export enum ZRAProductType {
  RawMaterial = "1",
  FinishedProduct = "2",
  Service = "3",
}

export enum ZRAPackagingUnit {
  Net = "NT",
  Bag = "BG",
  Barrel = "BA",
  Bottle = "BO",
  Box = "BX",
  Can = "CA",
  Carton = "CT",
  Container = "CTN",
  Dozen = "DZ",
  Kilogram = "KG",
  Litre = "LTR",
  Meter = "MTR",
  Piece = "U",
  Set = "SET",
}

export enum ZRAQuantityUnit {
  Piece = "U",
  Kilogram = "KG",
  Litre = "L",
}

export enum ZRATransactionType {
  Normal = "N",
  Copy = "C",
  Proforma = "P",
  Training = "T",
}

export enum ZRAReceiptType {
  Sale = "S",
  Return = "R",
}

export enum ZRAPaymentMethod {
  Cash = "01",
  Cheque = "02",
  Card = "03",
  MobileMoney = "04",
  BankTransfer = "05",
  Credit = "06",
  Other = "07",
}

export enum ZRATransactionStatus {
  Wait = "01",
  Approved = "02",
  Cancelled = "03",
}

// ━━━ Request/Response Types ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface VSDCConfig {
  baseUrl: string;         // URL of local VSDC (e.g. http://localhost:8080)
  tpin: string;            // Taxpayer Identification Number (10 digits)
  bhfId: string;           // Branch ID (e.g. "000" for HQ)
  deviceSerialNo: string;  // Device serial number for initialization
}

export interface VSDCSalesItem {
  itemSeq: number;
  itemCd: string;           // Item code registered in VSDC
  itemClsCd: string;        // ZRA Item Classification Code (UNSPSC-based)
  itemNm: string;           // Item name
  pkgUnitCd: string;        // Packaging unit code
  pkg: number;              // Number of packages
  qtyUnitCd: string;        // Quantity unit code
  qty: number;              // Quantity
  prc: number;              // Unit price
  splyAmt: number;          // Supply amount (qty × prc)
  dcRt: number;             // Discount rate (%)
  dcAmt: number;            // Discount amount
  taxTyCd: string;          // Tax type code (A, B, C1, C2, C3, D)
  taxblAmt: number;         // Taxable amount
  taxAmt: number;           // Tax amount
  totAmt: number;           // Total amount (taxblAmt + taxAmt)
}

export interface VSDCSalesRequest {
  tpin: string;
  bhfId: string;
  invcNo: number;
  orgInvcNo?: number;       // Original invoice number (for returns/credit notes)
  salesTyCd: string;        // Transaction type (N, C, P, T)
  rcptTyCd: string;         // Receipt type (S=Sale, R=Return)
  pmtTyCd: string;          // Payment method code
  salesSttsCd: string;      // Transaction status (02=Approved)
  cfmDt: string;            // Confirm datetime (YYYYMMDDHHmmss)
  salesDt: string;          // Sales date (YYYYMMDD)
  stockRlsDt?: string;      // Stock release date
  cnclReqDt?: string;       // Cancellation request date
  cnclDt?: string;          // Cancellation date
  rfdDt?: string;           // Refund date
  rfdRsnCd?: string;        // Refund reason code
  totItemCnt: number;       // Total item count
  totTaxblAmt: number;      // Total taxable amount
  totTaxAmt: number;        // Total tax amount
  totAmt: number;           // Total amount
  prchrAcptcYn: string;     // Purpose of purchase acceptance (Y/N)
  regrNm: string;           // Registrant name
  regrId: string;           // Registrant ID
  modrNm: string;           // Modifier name
  modrId: string;           // Modifier ID
  // Tax breakdown by type
  taxblAmtA: number;
  taxAmtA: number;
  taxblAmtB: number;
  taxAmtB: number;
  taxblAmtC1: number;
  taxAmtC1: number;
  taxblAmtC2: number;
  taxAmtC2: number;
  taxblAmtC3: number;
  taxAmtC3: number;
  taxblAmtD: number;
  taxAmtD: number;
  itemList: VSDCSalesItem[];
}

export interface VSDCItemSaveRequest {
  tpin: string;
  bhfId: string;
  itemCd: string;
  itemClsCd: string;
  itemTyCd: string;         // Product type (1, 2, 3)
  itemNm: string;
  pkgUnitCd: string;
  qtyUnitCd: string;
  taxTyCd: string;
  dftPrc: number;            // Default price
  regrNm: string;
  regrId: string;
  modrNm: string;
  modrId: string;
}

export interface VSDCResponse {
  resultCd: string;          // "000" = success
  resultMsg: string;
  resultDt: string;
  data?: Record<string, unknown>;
}

// ━━━ Tax Calculation Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TAX_RATES: Record<string, number> = {
  A: 16,   // Standard rated
  B: 16,   // Minimum taxable value
  C1: 0,   // Exports
  C2: 0,   // Zero rated local
  C3: 0,   // Zero rated nature
  D: 0,    // Exempt
};

export function calculateVSDCSalesItemTax(
  qty: number,
  unitPrice: number,
  discountPercent: number,
  taxTypeCode: string,
): { splyAmt: number; dcAmt: number; taxblAmt: number; taxAmt: number; totAmt: number } {
  const splyAmt = qty * unitPrice;
  const dcAmt = splyAmt * (discountPercent / 100);
  const taxblAmt = splyAmt - dcAmt;
  const rate = TAX_RATES[taxTypeCode] ?? 0;
  const taxAmt = Math.round(taxblAmt * (rate / 100) * 100) / 100;
  const totAmt = taxblAmt + taxAmt;
  return { splyAmt, dcAmt, taxblAmt, taxAmt, totAmt };
}

export function calculateVSDCSalesTotals(items: VSDCSalesItem[]): {
  totItemCnt: number;
  totTaxblAmt: number;
  totTaxAmt: number;
  totAmt: number;
  taxblAmtA: number; taxAmtA: number;
  taxblAmtB: number; taxAmtB: number;
  taxblAmtC1: number; taxAmtC1: number;
  taxblAmtC2: number; taxAmtC2: number;
  taxblAmtC3: number; taxAmtC3: number;
  taxblAmtD: number; taxAmtD: number;
} {
  const taxes: Record<string, { taxable: number; tax: number }> = {
    A: { taxable: 0, tax: 0 },
    B: { taxable: 0, tax: 0 },
    C1: { taxable: 0, tax: 0 },
    C2: { taxable: 0, tax: 0 },
    C3: { taxable: 0, tax: 0 },
    D: { taxable: 0, tax: 0 },
  };

  let totTaxblAmt = 0;
  let totTaxAmt = 0;
  let totAmt = 0;

  for (const item of items) {
    totTaxblAmt += item.taxblAmt;
    totTaxAmt += item.taxAmt;
    totAmt += item.totAmt;
    if (taxes[item.taxTyCd]) {
      taxes[item.taxTyCd].taxable += item.taxblAmt;
      taxes[item.taxTyCd].tax += item.taxAmt;
    }
  }

  return {
    totItemCnt: items.length,
    totTaxblAmt: Math.round(totTaxblAmt * 100) / 100,
    totTaxAmt: Math.round(totTaxAmt * 100) / 100,
    totAmt: Math.round(totAmt * 100) / 100,
    taxblAmtA: taxes.A.taxable, taxAmtA: taxes.A.tax,
    taxblAmtB: taxes.B.taxable, taxAmtB: taxes.B.tax,
    taxblAmtC1: taxes.C1.taxable, taxAmtC1: taxes.C1.tax,
    taxblAmtC2: taxes.C2.taxable, taxAmtC2: taxes.C2.tax,
    taxblAmtC3: taxes.C3.taxable, taxAmtC3: taxes.C3.tax,
    taxblAmtD: taxes.D.taxable, taxAmtD: taxes.D.tax,
  };
}

// ━━━ DMSuite Tax Rate → ZRA Tax Type Mapping ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function mapDMSuiteTaxToZRA(taxRateId: string): string {
  switch (taxRateId) {
    case "vat-standard": return ZRATaxType.StandardRated;
    case "vat-zero": return ZRATaxType.ZeroRatedLocal;
    case "vat-exempt": return ZRATaxType.Exempt;
    case "turnover-tax": return ZRATaxType.Exempt; // TOT businesses don't submit VAT
    case "wht-services": return ZRATaxType.Exempt;
    case "wht-rent": return ZRATaxType.Exempt;
    case "wht-dividends": return ZRATaxType.Exempt;
    case "no-tax": return ZRATaxType.Exempt;
    default: return ZRATaxType.StandardRated;
  }
}

export function mapDMSuitePaymentToZRA(method: string): string {
  switch (method) {
    case "cash": return ZRAPaymentMethod.Cash;
    case "bank-transfer": return ZRAPaymentMethod.BankTransfer;
    case "mobile-money": return ZRAPaymentMethod.MobileMoney;
    case "card": return ZRAPaymentMethod.Card;
    case "cheque": return ZRAPaymentMethod.Cheque;
    default: return ZRAPaymentMethod.Other;
  }
}

// ━━━ VSDC API Endpoint Paths ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const VSDC_ENDPOINTS = {
  initializeDevice: "/initializer/selectInitInfo",
  getCodes: "/code/selectCodes",
  getItemClassifications: "/itemClass/selectItemsClass",
  saveItem: "/items/saveItems",
  saveSales: "/trnsSales/saveSales",
  getNotices: "/notices/selectNotices",
  getCustomers: "/customers/selectCustomer",
  getBranches: "/branches/selectBranches",
  saveBranchCustomer: "/branches/saveBrancheCustomers",
  getImportItems: "/imports/selectImportItems",
  getPurchases: "/trnsPurchase/selectTrnsPurchaseSales",
  savePurchase: "/trnsPurchase/savePurchases",
  getStockItems: "/stock/selectStockItems",
  saveStockIO: "/stock/saveStockItems",
  saveStockMaster: "/stockMaster/saveStockMaster",
} as const;

// ━━━ Date Formatting ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function formatZRADate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function formatZRADateTime(date: Date): string {
  const base = formatZRADate(date);
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${base}${h}${min}${s}`;
}

// ━━━ Validation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function validateTPIN(tpin: string): boolean {
  return /^\d{10}$/.test(tpin);
}

export function validateBranchId(bhfId: string): boolean {
  return /^\d{3}$/.test(bhfId);
}

// ━━━ ZRA Smart Invoice Status ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ZRASubmissionStatus =
  | "not-submitted"
  | "pending"
  | "submitted"
  | "verified"
  | "error";

export interface ZRASubmissionRecord {
  status: ZRASubmissionStatus;
  submittedAt: string | null;
  vsdcReceiptNo: string | null;
  vsdcInternalData: string | null;
  errorMessage: string | null;
  retryCount: number;
}

export function createDefaultZRASubmission(): ZRASubmissionRecord {
  return {
    status: "not-submitted",
    submittedAt: null,
    vsdcReceiptNo: null,
    vsdcInternalData: null,
    errorMessage: null,
    retryCount: 0,
  };
}
