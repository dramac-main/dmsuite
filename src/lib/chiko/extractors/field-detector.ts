// =============================================================================
// DMSuite — Heuristic Business Field Detection
// Scans extracted text for common business data fields using regex patterns.
// Used by PDF and DOCX extractors to enrich their output.
// =============================================================================

export interface DetectedBusinessFields {
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
  bankBranch?: string;
  // Brand intelligence fields
  tagline?: string;
  industry?: string;
  services?: string;
  brandColors?: string;
  companyDescription?: string;
  [key: string]: string | undefined;
}

/**
 * Scan text for common business data fields using regex heuristics.
 * Returns detected fields (only populated ones).
 */
export function detectBusinessFields(text: string): DetectedBusinessFields {
  const fields: DetectedBusinessFields = {};

  if (!text || typeof text !== "string") return fields;

  // ── Email ────────────────────────────────────────────────
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  if (emailMatch) {
    fields.email = emailMatch[0];
  }

  // ── Phone ────────────────────────────────────────────────
  // International formats: +260 977 123 456, +1 (555) 123-4567, etc.
  const phoneMatch = text.match(
    /(?:\+\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/
  );
  if (phoneMatch) {
    const phone = phoneMatch[0].trim();
    // Avoid matching things that look like dates or IDs
    if (phone.length >= 7) {
      fields.phone = phone;
    }
  }

  // ── Website ──────────────────────────────────────────────
  const websiteMatch = text.match(
    /(?:https?:\/\/)?(?:www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)*/i
  );
  if (websiteMatch) {
    fields.website = websiteMatch[0];
  } else {
    // Try http/https URLs
    const urlMatch = text.match(
      /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)*/i
    );
    if (urlMatch) {
      fields.website = urlMatch[0];
    }
  }

  // ── Tax ID / TPIN ────────────────────────────────────────
  const taxPatterns = [
    /(?:TPIN|Tax\s*ID|TIN|VAT\s*(?:No|Number|#)?)[:\s]*(\d{4,12})/i,
    /(?:Tax\s*Identification\s*Number)[:\s]*(\d{4,12})/i,
  ];
  for (const pattern of taxPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      fields.taxId = match[1];
      break;
    }
  }

  // ── Banking Details ──────────────────────────────────────
  const bankNameMatch = text.match(
    /(?:Bank(?:\s*Name)?)[:\s]+([A-Z][A-Za-z\s&]+?)(?:\n|$|,|\s{2,})/i
  );
  if (bankNameMatch?.[1]) {
    fields.bankName = bankNameMatch[1].trim();
  }

  const bankAccMatch = text.match(
    /(?:Account\s*(?:No|Number|#)?|A\/C\s*(?:No)?)[:\s]+(\d[\d\s-]{4,20}\d)/i
  );
  if (bankAccMatch?.[1]) {
    fields.bankAccount = bankAccMatch[1].trim();
  }

  const branchMatch = text.match(
    /(?:Branch)[:\s]+([A-Za-z\s]+?)(?:\n|$|,|\s{2,})/i
  );
  if (branchMatch?.[1]) {
    fields.bankBranch = branchMatch[1].trim();
  }

  // ── Address ──────────────────────────────────────────────
  // Look for multi-line blocks with street-like patterns
  const addressPatterns = [
    /(?:Address|Located\s*at)[:\s]+(.+?)(?:\n\n|\n(?=[A-Z][a-z])|$)/i,
    // Pattern: "Number + Street/Road/Avenue" followed by city-like text
    /(\d+[A-Za-z]?\s+(?:Plot|Street|Road|Avenue|Ave|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Crescent|Close|Court)[^,\n]*(?:,\s*[^\n,]+)?(?:,\s*[^\n,]+)?)/i,
  ];
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const addr = match[1].trim().replace(/\s+/g, " ");
      if (addr.length > 8 && addr.length < 200) {
        fields.address = addr;
        break;
      }
    }
  }

  // ── Company Name ─────────────────────────────────────────
  // Heuristic: first non-empty line of prominent text, or text matching business suffixes
  const companyPatterns = [
    // Common business suffixes
    /^(.+?(?:Ltd|LLC|Inc|Corp|Pty|Co|GmbH|SA|PLC|Limited|Company|Solutions|Services|Enterprises|Group|Holdings|Associates|Consulting|Agency|Studio|International)\.?)\s*$/im,
  ];
  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim();
      if (name.length >= 3 && name.length < 100) {
        fields.companyName = name;
        break;
      }
    }
  }

  // Fallback: first non-empty line (often company name in business docs)
  if (!fields.companyName) {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0];
      // Only use if it looks like a name (not a date, number, or generic text)
      if (
        firstLine.length >= 3 &&
        firstLine.length < 80 &&
        !/^\d/.test(firstLine) &&
        !/^(page|date|invoice|receipt|quotation|delivery|credit|purchase|proforma)/i.test(firstLine)
      ) {
        fields.companyName = firstLine;
      }
    }
  }

  // ── Brand Colors ─────────────────────────────────────────
  // Detect hex color codes and named brand colors in context
  const hexColors = text.match(/#[0-9A-Fa-f]{6}\b/g);
  if (hexColors && hexColors.length > 0) {
    // Deduplicate
    const unique = [...new Set(hexColors.map(c => c.toLowerCase()))];
    fields.brandColors = unique.slice(0, 6).join(", ");
  }
  if (!fields.brandColors) {
    // Look for named colors near "brand", "color", "colour", "palette" keywords
    const colorContextMatch = text.match(
      /(?:brand|primary|corporate|company|our)\s*(?:colou?rs?|palette)[:\s]*([^\n.]{3,80})/i
    );
    if (colorContextMatch?.[1]) {
      fields.brandColors = colorContextMatch[1].trim();
    }
  }

  // ── Tagline / Slogan ────────────────────────────────────
  const taglinePatterns = [
    /(?:tagline|slogan|motto)[:\s]*[""]?([^"""\n]{5,120})[""]?/i,
    /[""\u201c]([^"""\u201d\n]{5,80})[""\u201d]\s*$/m,
  ];
  for (const pattern of taglinePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const tl = match[1].trim();
      if (tl.length >= 5 && tl.length < 120) {
        fields.tagline = tl;
        break;
      }
    }
  }

  // ── Industry / Sector ───────────────────────────────────
  const industryPatterns = [
    /(?:industry|sector|field)[:\s]+([^\n.]{3,80})/i,
    /(?:we are|we're|is)\s+(?:a|an)\s+(?:leading|premier|trusted|established|innovative)?\s*([^\n.]{5,80}?)(?:\s+(?:company|firm|agency|business|provider|specialist|consultancy))/i,
  ];
  for (const pattern of industryPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      fields.industry = match[1].trim();
      break;
    }
  }
  // Keyword-based industry detection as fallback
  if (!fields.industry) {
    const industryKeywords: [RegExp, string][] = [
      [/\b(?:marketing|advertising|digital marketing|branding|creative agency)\b/i, "Marketing & Advertising"],
      [/\b(?:software|technology|tech|IT services|SaaS|cloud|app development)\b/i, "Technology & IT"],
      [/\b(?:construction|building|architecture|engineering|civil)\b/i, "Construction & Engineering"],
      [/\b(?:real estate|property|realty|housing)\b/i, "Real Estate"],
      [/\b(?:healthcare|medical|hospital|clinic|pharmaceutical|health)\b/i, "Healthcare"],
      [/\b(?:education|school|university|training|learning|academy)\b/i, "Education"],
      [/\b(?:finance|banking|insurance|accounting|investment|financial)\b/i, "Finance & Banking"],
      [/\b(?:retail|e-commerce|ecommerce|shop|store|merchandise)\b/i, "Retail & E-Commerce"],
      [/\b(?:hospitality|hotel|restaurant|tourism|travel|catering)\b/i, "Hospitality & Tourism"],
      [/\b(?:manufacturing|factory|production|industrial)\b/i, "Manufacturing"],
      [/\b(?:legal|law firm|attorney|advocate|solicitor)\b/i, "Legal Services"],
      [/\b(?:logistics|transport|shipping|freight|supply chain)\b/i, "Logistics & Transport"],
      [/\b(?:agriculture|farming|agri|livestock|crop)\b/i, "Agriculture"],
      [/\b(?:media|entertainment|film|music|broadcast|publishing)\b/i, "Media & Entertainment"],
      [/\b(?:consulting|consultancy|advisory|management consulting)\b/i, "Consulting"],
      [/\b(?:mining|mineral|resources|extraction)\b/i, "Mining & Resources"],
      [/\b(?:energy|power|solar|renewable|oil|gas|petroleum)\b/i, "Energy"],
      [/\b(?:telecommunications|telecom|mobile|network)\b/i, "Telecommunications"],
      [/\b(?:fashion|apparel|clothing|textile|design house)\b/i, "Fashion & Apparel"],
      [/\b(?:food|beverage|catering|bakery|restaurant)\b/i, "Food & Beverage"],
    ];
    // Count matches for each industry, pick the one with most hits
    let bestIndustry = "";
    let bestCount = 0;
    for (const [pattern, label] of industryKeywords) {
      const matches = text.match(new RegExp(pattern.source, "gi"));
      const count = matches ? matches.length : 0;
      if (count > bestCount) {
        bestCount = count;
        bestIndustry = label;
      }
    }
    if (bestCount >= 2) {
      fields.industry = bestIndustry;
    }
  }

  // ── Services Offered ────────────────────────────────────
  const servicesPatterns = [
    /(?:(?:our\s+)?services|what we (?:do|offer)|we (?:provide|offer|specialize))[:\s]*([^\n]{10,200})/i,
    /(?:services\s*(?:include|offered|provided))[:\s]*([^\n]{10,200})/i,
  ];
  for (const pattern of servicesPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      fields.services = match[1].trim().slice(0, 200);
      break;
    }
  }

  // ── Company Description / About ─────────────────────────
  const aboutPatterns = [
    /(?:about\s+(?:us|the company|our company)|who\s+we\s+are|company\s+(?:overview|profile|description))[:\s]*\n?([\s\S]{20,500}?)(?:\n\n|\n[A-Z])/i,
    /(?:about\s+(?:us|the company))[:\s]*\n?([\s\S]{20,300})/i,
  ];
  for (const pattern of aboutPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      fields.companyDescription = match[1].trim().replace(/\s+/g, " ").slice(0, 300);
      break;
    }
  }

  return fields;
}

/**
 * Build a human-readable summary from detected fields.
 */
export function buildFieldsSummary(fields: DetectedBusinessFields): string {
  const parts: string[] = [];
  if (fields.companyName) parts.push(`Company: ${fields.companyName}`);
  if (fields.industry) parts.push(`Industry: ${fields.industry}`);
  if (fields.address) parts.push(`Address: ${fields.address}`);
  if (fields.phone) parts.push(`Phone: ${fields.phone}`);
  if (fields.email) parts.push(`Email: ${fields.email}`);
  if (fields.website) parts.push(`Website: ${fields.website}`);
  if (fields.taxId) parts.push(`Tax ID/TPIN: ${fields.taxId}`);
  if (fields.bankName) parts.push(`Bank: ${fields.bankName}`);
  if (fields.bankAccount) parts.push(`Account: ${fields.bankAccount}`);
  if (fields.bankBranch) parts.push(`Branch: ${fields.bankBranch}`);
  if (fields.brandColors) parts.push(`Brand Colors: ${fields.brandColors}`);
  if (fields.tagline) parts.push(`Tagline: ${fields.tagline}`);
  return parts.length > 0 ? `Detected: ${parts.join(", ")}` : "";
}
