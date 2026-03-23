// =============================================================================
// DMSuite — Chiko Website Extractor
// Server-side website scraper that fetches a URL, parses structured data
// (company name, contact, services, social links, meta tags, colors, etc.)
// and returns a normalized ExtractedWebsiteData object.
// Uses only built-in Node.js APIs — no external scraping dependencies.
// =============================================================================

import type { DetectedBusinessFields } from "./field-detector";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedWebsiteData {
  /** The URL that was scanned */
  url: string;
  /** Final URL after redirects */
  finalUrl: string;
  /** Page title from <title> tag */
  title: string;
  /** Meta description */
  description: string;
  /** Open Graph / meta image URL */
  ogImage?: string;
  /** Favicon URL */
  favicon?: string;
  /** Full visible text content (cleaned, max 6000 chars) */
  text: string;
  /** Structured sections found on the page */
  sections: WebsiteSection[];
  /** Contact info extracted from the page */
  contact: WebsiteContact;
  /** Social media links found */
  socialLinks: Record<string, string>;
  /** Brand colors detected from inline styles, CSS variables, and meta theme-color */
  brandColors: string[];
  /** Business fields detected via heuristic field detector */
  detectedFields?: DetectedBusinessFields;
  /** Summary of what was found */
  summary: string;
}

export interface WebsiteSection {
  heading: string;
  content: string;
}

export interface WebsiteContact {
  emails: string[];
  phones: string[];
  addresses: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2MB max HTML download
const FETCH_TIMEOUT_MS = 15_000; // 15 second timeout
const MAX_TEXT_LENGTH = 6000;

/** Allowlisted URL protocols */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

// ── URL Validation ───────────────────────────────────────────────────────────

/**
 * Validates and normalizes a user-provided URL.
 * Prevents SSRF by blocking private/internal IPs and non-HTTP protocols.
 */
export function validateUrl(input: string): { valid: boolean; url?: URL; error?: string } {
  let urlStr = input.trim();

  // Auto-prepend https:// if no protocol
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = `https://${urlStr}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // Protocol check
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { valid: false, error: "Only HTTP and HTTPS URLs are supported" };
  }

  // Block localhost and private IPs (SSRF protection)
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("172.") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal" ||
    hostname === "169.254.169.254" // AWS metadata
  ) {
    return { valid: false, error: "Cannot scan internal or private network addresses" };
  }

  // Block IP addresses in 172.16-31.x.x range (private)
  const ipMatch = hostname.match(/^172\.(\d+)\./);
  if (ipMatch) {
    const second = parseInt(ipMatch[1], 10);
    if (second >= 16 && second <= 31) {
      return { valid: false, error: "Cannot scan internal or private network addresses" };
    }
  }

  return { valid: true, url: parsed };
}

// ── HTML Parsing Utilities ───────────────────────────────────────────────────

/** Extract content from a specific meta tag */
function extractMeta(html: string, nameOrProperty: string): string {
  // Match both name="" and property="" (for OG tags)
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:name|property)\\s*=\\s*["']${escapeRegex(nameOrProperty)}["'][^>]*content\\s*=\\s*["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${escapeRegex(nameOrProperty)}["']`,
      "i"
    ),
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return "";
}

/** Extract the <title> tag content */
function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeHtmlEntities(m[1].trim()) : "";
}

/** Extract favicon URL */
function extractFavicon(html: string, baseUrl: string): string | undefined {
  const m = html.match(/<link[^>]*rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]*href\s*=\s*["']([^"']+)["']/i)
    || html.match(/<link[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["'](?:shortcut\s+)?icon["']/i);
  if (m?.[1]) {
    return resolveUrl(m[1], baseUrl);
  }
  return undefined;
}

/** Extract all heading sections (h1-h3 with following text) */
function extractSections(html: string): WebsiteSection[] {
  const sections: WebsiteSection[] = [];
  // Match headings h1-h3 and capture text until next heading or end
  const headingRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  const bodyHtml = extractBodyHtml(html);
  let match;
  const headingPositions: { heading: string; index: number }[] = [];

  while ((match = headingRegex.exec(bodyHtml)) !== null) {
    headingPositions.push({
      heading: stripHtml(match[1]).trim(),
      index: match.index + match[0].length,
    });
  }

  for (let i = 0; i < headingPositions.length && sections.length < 20; i++) {
    const start = headingPositions[i].index;
    const end = i + 1 < headingPositions.length ? headingPositions[i + 1].index - 100 : bodyHtml.length;
    const sectionHtml = bodyHtml.slice(start, Math.min(end, start + 2000));
    const content = stripHtml(sectionHtml).trim().slice(0, 500);
    if (headingPositions[i].heading && content) {
      sections.push({ heading: headingPositions[i].heading, content });
    }
  }

  return sections;
}

/** Extract visible text from HTML, removing scripts, styles, and tags */
function extractVisibleText(html: string): string {
  let bodyHtml = extractBodyHtml(html);

  // Remove non-visible elements
  bodyHtml = bodyHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  return stripHtml(bodyHtml);
}

/** Extract body content from full HTML */
function extractBodyHtml(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

/** Strip HTML tags, decode entities, normalize whitespace */
function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|h[1-6]|tr|section|article|header|footer)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
  ).trim();
}

/** Decode common HTML entities */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/** Escape string for use in regex */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resolve a potentially relative URL against a base */
function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

// ── Contact Extraction ───────────────────────────────────────────────────────

/** Extract emails from text (deduplicated) */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  // Filter out common false positives
  const filtered = matches.filter(
    (e) =>
      !e.endsWith(".png") &&
      !e.endsWith(".jpg") &&
      !e.endsWith(".svg") &&
      !e.includes("example.com") &&
      !e.includes("sentry.io") &&
      !e.includes("wixpress.com")
  );
  return [...new Set(filtered)].slice(0, 5);
}

/** Extract phone numbers from text */
function extractPhones(text: string): string[] {
  const phoneRegex = /(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g;
  const matches = text.match(phoneRegex) || [];
  // Filter to only plausible phone numbers (7+ digits)
  const filtered = matches.filter((p) => p.replace(/\D/g, "").length >= 7);
  return [...new Set(filtered.map((p) => p.trim()))].slice(0, 5);
}

/** Extract physical addresses (heuristic — looks for patterns with street/road/avenue keywords) */
function extractAddresses(text: string): string[] {
  const addressPatterns = [
    // "Plot 123, Street Name, City"
    /(?:plot|stand|building|house|suite|unit|office|floor|block)\s*(?:no\.?\s*)?\d+[^.!?\n]{5,80}/gi,
    // Street/Road/Avenue patterns
    /\d+\s+\w+\s+(?:street|st|road|rd|avenue|ave|drive|dr|boulevard|blvd|lane|way|crescent|close|court)[^.!?\n]{0,60}/gi,
    // "P.O. Box" patterns
    /P\.?\s*O\.?\s*Box\s+\d+[^.!?\n]{0,60}/gi,
  ];
  const addresses: string[] = [];
  for (const pat of addressPatterns) {
    const matches = text.match(pat) || [];
    addresses.push(...matches.map((a) => a.trim()));
  }
  return [...new Set(addresses)].slice(0, 3);
}

// ── Social Links ─────────────────────────────────────────────────────────────

const SOCIAL_PATTERNS: [string, RegExp][] = [
  ["facebook", /https?:\/\/(?:www\.)?facebook\.com\/[^\s"'<>]+/i],
  ["twitter", /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s"'<>]+/i],
  ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/i],
  ["linkedin", /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>]+/i],
  ["youtube", /https?:\/\/(?:www\.)?youtube\.com\/[^\s"'<>]+/i],
  ["tiktok", /https?:\/\/(?:www\.)?tiktok\.com\/@[^\s"'<>]+/i],
  ["whatsapp", /https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^\s"'<>]+/i],
];

function extractSocialLinks(html: string): Record<string, string> {
  const links: Record<string, string> = {};
  for (const [name, pattern] of SOCIAL_PATTERNS) {
    const m = html.match(pattern);
    if (m) links[name] = m[0];
  }
  return links;
}

// ── Brand Color Extraction ───────────────────────────────────────────────────

function extractBrandColors(html: string): string[] {
  const colors: Map<string, number> = new Map();

  // 1) meta theme-color
  const themeColor = extractMeta(html, "theme-color");
  if (themeColor && /^#[0-9a-fA-F]{3,8}$/.test(themeColor)) {
    colors.set(themeColor.toLowerCase(), 100);
  }

  // 2) CSS custom properties (--primary-color, --brand-color, etc.)
  const cssVarRegex = /--(?:primary|brand|accent|main|theme)[\w-]*\s*:\s*(#[0-9a-fA-F]{3,8})/gi;
  let m;
  while ((m = cssVarRegex.exec(html)) !== null) {
    colors.set(m[1].toLowerCase(), (colors.get(m[1].toLowerCase()) || 0) + 50);
  }

  // 3) Inline style colors on key elements (header, nav, hero, footer)
  const inlineColorRegex = /(?:background-color|background|color)\s*:\s*(#[0-9a-fA-F]{3,8})/gi;
  while ((m = inlineColorRegex.exec(html)) !== null) {
    const hex = m[1].toLowerCase();
    // Skip near-white and near-black (not brand colors)
    if (!isNeutral(hex)) {
      colors.set(hex, (colors.get(hex) || 0) + 1);
    }
  }

  // Sort by score (most prominent first), return top 8
  return [...colors.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c)
    .slice(0, 8);
}

/** Check if a hex color is near-white or near-black (neutral / not brand) */
function isNeutral(hex: string): boolean {
  const h = hex.replace("#", "");
  const fullHex = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  // Near-white
  if (r > 230 && g > 230 && b > 230) return true;
  // Near-black
  if (r < 25 && g < 25 && b < 25) return true;
  // Very low saturation (gray)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 20 && max < 200 && min > 50) return true;
  return false;
}

// ── Main Extractor ───────────────────────────────────────────────────────────

/**
 * Fetch and extract structured data from a website URL.
 * Uses Node.js built-in fetch with timeout + SSRF protection.
 */
export async function extractWebsite(url: string): Promise<ExtractedWebsiteData> {
  // Validate and normalize URL
  const validation = validateUrl(url);
  if (!validation.valid || !validation.url) {
    throw new Error(validation.error || "Invalid URL");
  }

  const targetUrl = validation.url.href;

  // Fetch with timeout and size limit
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DMSuite-Bot/1.0 (Website Scanner; +https://dmsuite.io)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Website took too long to respond (timeout)");
    }
    throw new Error(`Failed to reach website: ${err instanceof Error ? err.message : "Network error"}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Website returned HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new Error("URL does not point to an HTML page");
  }

  // Read body with size limit
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  let html = "";
  const decoder = new TextDecoder();
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_SIZE) {
      reader.cancel();
      break;
    }
    html += decoder.decode(value, { stream: true });
  }

  if (!html || html.length < 50) {
    throw new Error("Page returned no meaningful content");
  }

  const finalUrl = response.url || targetUrl;
  const baseUrl = new URL(finalUrl).origin;

  // ── Extract structured data ──────────────────────────────

  const title = extractTitle(html);
  const description = extractMeta(html, "description") || extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image") || extractMeta(html, "twitter:image");
  const favicon = extractFavicon(html, baseUrl);
  const sections = extractSections(html);
  const socialLinks = extractSocialLinks(html);
  const brandColors = extractBrandColors(html);

  // Extract visible text
  let text = extractVisibleText(html);
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH);
  }

  // Extract contact information
  const contact: WebsiteContact = {
    emails: extractEmails(text + " " + html.slice(0, 50_000)),
    phones: extractPhones(text),
    addresses: extractAddresses(text),
  };

  // Run field detector for business intelligence
  let detectedFields: DetectedBusinessFields | undefined;
  try {
    const { detectBusinessFields } = await import("./field-detector");
    detectedFields = detectBusinessFields(text);
    // Supplement with data from meta tags and contact extraction
    if (!detectedFields.companyName && title) {
      // Try to infer company name from title (often "Company Name - Tagline")
      const titleParts = title.split(/\s*[|\-–—]\s*/);
      if (titleParts.length > 0) {
        detectedFields.companyName = titleParts[0].trim();
      }
    }
    if (!detectedFields.email && contact.emails.length > 0) {
      detectedFields.email = contact.emails[0];
    }
    if (!detectedFields.phone && contact.phones.length > 0) {
      detectedFields.phone = contact.phones[0];
    }
    if (!detectedFields.website) {
      detectedFields.website = finalUrl;
    }
    if (!detectedFields.address && contact.addresses.length > 0) {
      detectedFields.address = contact.addresses[0];
    }
    if (brandColors.length > 0 && (!detectedFields.brandColors || detectedFields.brandColors.length === 0)) {
      detectedFields.brandColors = brandColors.join(", ");
    }
    if (!detectedFields.tagline && description) {
      detectedFields.tagline = description.slice(0, 150);
    }
  } catch {
    // Field detection failed — continue without it
  }

  // Build summary
  const summaryParts: string[] = [];
  if (title) summaryParts.push(`"${title}"`);
  if (contact.emails.length > 0) summaryParts.push(`${contact.emails.length} email(s)`);
  if (contact.phones.length > 0) summaryParts.push(`${contact.phones.length} phone number(s)`);
  if (contact.addresses.length > 0) summaryParts.push(`${contact.addresses.length} address(es)`);
  if (sections.length > 0) summaryParts.push(`${sections.length} content section(s)`);
  if (Object.keys(socialLinks).length > 0) summaryParts.push(`${Object.keys(socialLinks).length} social link(s)`);
  if (brandColors.length > 0) summaryParts.push(`${brandColors.length} brand color(s)`);

  const summary = `Website scan of ${new URL(finalUrl).hostname}: ${summaryParts.join(", ")}`;

  return {
    url: targetUrl,
    finalUrl,
    title,
    description,
    ogImage: ogImage ? resolveUrl(ogImage, baseUrl) : undefined,
    favicon: favicon ? resolveUrl(favicon, baseUrl) : undefined,
    text,
    sections,
    contact,
    socialLinks,
    brandColors,
    detectedFields,
    summary,
  };
}
