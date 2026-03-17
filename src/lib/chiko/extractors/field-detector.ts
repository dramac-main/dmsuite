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

  return fields;
}

/**
 * Build a human-readable summary from detected fields.
 */
export function buildFieldsSummary(fields: DetectedBusinessFields): string {
  const parts: string[] = [];
  if (fields.companyName) parts.push(`Company: ${fields.companyName}`);
  if (fields.address) parts.push(`Address: ${fields.address}`);
  if (fields.phone) parts.push(`Phone: ${fields.phone}`);
  if (fields.email) parts.push(`Email: ${fields.email}`);
  if (fields.website) parts.push(`Website: ${fields.website}`);
  if (fields.taxId) parts.push(`Tax ID/TPIN: ${fields.taxId}`);
  if (fields.bankName) parts.push(`Bank: ${fields.bankName}`);
  if (fields.bankAccount) parts.push(`Account: ${fields.bankAccount}`);
  if (fields.bankBranch) parts.push(`Branch: ${fields.bankBranch}`);
  return parts.length > 0 ? `Detected: ${parts.join(", ")}` : "";
}
