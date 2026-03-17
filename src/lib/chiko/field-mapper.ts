// =============================================================================
// DMSuite — Business Memory Field Mapper
// Maps canonical BusinessProfile fields to/from each tool's specific schema.
// Pure functions only — no state, no side effects.
// =============================================================================

import type { BusinessProfile } from "@/stores/business-memory";
import type { CompanyBranding } from "@/lib/sales-book/schema";
import type { BusinessInfo, PaymentInfo } from "@/lib/invoice/schema";
import type { UserDetails } from "@/stores/business-card-wizard";
import type { Basics as ResumeBasics } from "@/lib/resume/schema";
import type { DetectedBusinessFields } from "@/lib/chiko/extractors/field-detector";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Filter out empty strings from a record, returning only populated entries */
function filterPopulated<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value === "") continue;
    if (value === undefined) continue;
    (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Sales Book Mapping
// ---------------------------------------------------------------------------

/** Maps canonical profile → Sales Book CompanyBranding fields */
export function mapProfileToSalesBookBranding(profile: BusinessProfile): Partial<CompanyBranding> {
  return filterPopulated({
    name: profile.companyName,
    tagline: profile.tagline,
    address: profile.address,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    taxId: profile.taxId,
    logoUrl: profile.logoUrl || undefined,
    bankName: profile.bankName,
    bankAccount: profile.bankAccountNumber,  // canonical bankAccountNumber → SB bankAccount
    bankAccountName: profile.bankAccountName,
    bankBranch: profile.bankBranch,
    bankBranchCode: profile.bankBranchCode,
    bankSwiftBic: profile.bankSwiftBic,
    bankIban: profile.bankIban,
    bankSortCode: profile.bankSortCode,
    bankReference: profile.bankReference,
    bankCustomLabel: profile.bankCustomLabel,
    bankCustomValue: profile.bankCustomValue,
  }) as Partial<CompanyBranding>;
}

// ---------------------------------------------------------------------------
// Invoice Mapping
// ---------------------------------------------------------------------------

/** Maps canonical profile → Invoice BusinessInfo fields */
export function mapProfileToInvoiceBusinessInfo(profile: BusinessProfile): Partial<BusinessInfo> {
  return filterPopulated({
    name: profile.companyName,
    address: profile.address,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    taxId: profile.taxId,
    logoUrl: profile.logoUrl || undefined,
  }) as Partial<BusinessInfo>;
}

/** Maps canonical profile → Invoice PaymentInfo fields */
export function mapProfileToInvoicePaymentInfo(profile: BusinessProfile): Partial<PaymentInfo> {
  return filterPopulated({
    bankName: profile.bankName,
    accountName: profile.bankAccountName,
    accountNumber: profile.bankAccountNumber,
    routingNumber: profile.bankSortCode,     // canonical bankSortCode → Invoice routingNumber
    swiftCode: profile.bankSwiftBic,         // canonical bankSwiftBic → Invoice swiftCode
  }) as Partial<PaymentInfo>;
}

// ---------------------------------------------------------------------------
// Business Card Mapping
// ---------------------------------------------------------------------------

/** Maps canonical profile → Business Card UserDetails fields */
export function mapProfileToBusinessCardDetails(profile: BusinessProfile): Partial<UserDetails> {
  return filterPopulated({
    name: profile.personName,      // canonical personName → BC name
    title: profile.jobTitle,       // canonical jobTitle → BC title
    company: profile.companyName,  // canonical companyName → BC company
    tagline: profile.tagline,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    address: profile.address,
    linkedin: profile.linkedin,
    twitter: profile.twitter,
    instagram: profile.instagram,
  }) as Partial<UserDetails>;
}

// ---------------------------------------------------------------------------
// Resume Mapping
// ---------------------------------------------------------------------------

/** Maps canonical profile → Resume basics fields */
export function mapProfileToResumeBasics(profile: BusinessProfile): Partial<ResumeBasics> {
  const result: Partial<ResumeBasics> = {};
  if (profile.personName) result.name = profile.personName;
  if (profile.jobTitle) result.headline = profile.jobTitle;
  if (profile.email) result.email = profile.email;
  if (profile.phone) result.phone = profile.phone;
  if (profile.address) result.location = profile.address;
  if (profile.website) result.website = { url: profile.website, label: "Website" };
  if (profile.linkedin) result.linkedin = profile.linkedin;
  return result;
}

// ---------------------------------------------------------------------------
// Layer 2 Detected Fields → Profile
// ---------------------------------------------------------------------------

/** Maps Layer 2 field-detector output → canonical Business Profile fields */
export function mapDetectedFieldsToProfile(detected: DetectedBusinessFields): Partial<BusinessProfile> {
  const result: Partial<BusinessProfile> = {};
  if (detected.companyName) result.companyName = detected.companyName;
  if (detected.phone) result.phone = detected.phone;
  if (detected.email) result.email = detected.email;
  if (detected.address) result.address = detected.address;
  if (detected.website) result.website = detected.website;
  if (detected.taxId) result.taxId = detected.taxId;
  if (detected.bankName) result.bankName = detected.bankName;
  if (detected.bankAccount) result.bankAccountNumber = detected.bankAccount; // bankAccount → bankAccountNumber
  if (detected.bankBranch) result.bankBranch = detected.bankBranch;
  return result;
}

// ---------------------------------------------------------------------------
// Summary & Utilities
// ---------------------------------------------------------------------------

/** Returns the count of non-empty fields (excluding metadata) */
export function getPopulatedFieldCount(profile: BusinessProfile): number {
  const METADATA = new Set(["profileId", "profileName", "createdAt", "updatedAt"]);
  let count = 0;
  for (const [key, value] of Object.entries(profile)) {
    if (METADATA.has(key)) continue;
    if (key === "teamMembers") {
      if (Array.isArray(value) && value.length > 0) count++;
      continue;
    }
    if (typeof value === "string" && value !== "") count++;
  }
  return count;
}

/** Mask a string: show only last 4 characters, replace rest with stars */
function maskValue(val: string): string {
  if (val.length <= 4) return val;
  return "****" + val.slice(-4);
}

/**
 * Returns a multi-line human-readable profile summary for the AI system prompt.
 * Sensitive data (bank account, TPIN) is masked.
 */
export function describeProfileForAI(profile: BusinessProfile): string {
  if (
    !profile.companyName &&
    !profile.personName &&
    !profile.email &&
    !profile.phone
  ) {
    return "No business profile saved yet.";
  }

  const lines: string[] = [];
  if (profile.companyName) lines.push(`Company: ${profile.companyName}`);
  if (profile.personName) lines.push(`Contact: ${profile.personName}`);
  if (profile.jobTitle) lines.push(`Title: ${profile.jobTitle}`);
  if (profile.tagline) lines.push(`Tagline: ${profile.tagline}`);
  if (profile.address) lines.push(`Address: ${profile.address}`);
  if (profile.phone) lines.push(`Phone: ${profile.phone}`);
  if (profile.email) lines.push(`Email: ${profile.email}`);
  if (profile.website) lines.push(`Website: ${profile.website}`);
  if (profile.taxId) lines.push(`TPIN: ${maskValue(profile.taxId)}`);
  if (profile.logoUrl) lines.push(`Logo: saved`);

  // Banking — masked
  const bankParts: string[] = [];
  if (profile.bankName) bankParts.push(profile.bankName);
  if (profile.bankAccountNumber) bankParts.push(`Acc: ${maskValue(profile.bankAccountNumber)}`);
  if (profile.bankBranch) bankParts.push(`Branch: ${profile.bankBranch}`);
  if (bankParts.length > 0) lines.push(`Banking: ${bankParts.join(", ")}`);

  // Social
  if (profile.linkedin) lines.push(`LinkedIn: ${profile.linkedin}`);
  if (profile.twitter) lines.push(`Twitter: ${profile.twitter}`);
  if (profile.instagram) lines.push(`Instagram: ${profile.instagram}`);

  // Design prefs
  const prefParts: string[] = [];
  if (profile.preferredAccentColor) prefParts.push(`accent: ${profile.preferredAccentColor}`);
  if (profile.preferredCurrency) prefParts.push(`currency: ${profile.preferredCurrency}`);
  if (profile.preferredPageSize) prefParts.push(`page: ${profile.preferredPageSize}`);
  if (prefParts.length > 0) lines.push(`Preferences: ${prefParts.join(", ")}`);

  // Team
  if (profile.teamMembers.length > 0) {
    lines.push(`Team: ${profile.teamMembers.map((m) => `${m.name} (${m.title})`).join(", ")}`);
  }

  return lines.join("\n");
}
