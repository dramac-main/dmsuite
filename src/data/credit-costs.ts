/**
 * DMSuite Credit Pricing System — Token-Aligned with 100% Margin
 * ============================================================
 *
 * Credits are the user-facing currency. Under the hood, each credit maps to a
 * real USD cost.  Every operation's credit price is set so that the platform
 * earns ≥100 % gross margin over the Anthropic API cost.
 *
 * Formula:  credits = ceil( expectedApiCostUSD / creditValueUSD ) × 2
 *
 * ── Model pricing (Anthropic, as of 2025-Q4) ───────────────
 *   Claude Sonnet 4.6   — $3.00 / 1M input,  $15.00 / 1M output
 *   Claude Haiku 4.5    — $0.80 / 1M input,   $4.00 / 1M output
 *
 * ── Credit pack value ───────────────────────────────────────
 *   Pack        Credits   Price(ZMW)  Per-credit(ZMW)  Per-credit(USD@28)
 *   Starter     100       K49         K0.49            $0.0175
 *   Popular     500       K199        K0.40            $0.0143
 *   Pro         1,500     K499        K0.33            $0.0118
 *   Agency      5,000     K1,299      K0.26            $0.0093
 *
 * We price against the **Agency pack** (cheapest per-credit) to guarantee
 * margin even for the highest-volume customer.
 *
 * Agency credit value ≈ $0.0093 USD.
 * 100% margin means: credit_cost ≥ apiCostUSD / $0.0093 × 2
 */

/* ── Per-model pricing (USD per token) ───────────────────── */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6":  { input: 3.00  / 1_000_000, output: 15.00 / 1_000_000 },
  "claude-sonnet-4-0":  { input: 3.00  / 1_000_000, output: 15.00 / 1_000_000 },
  "claude-3-5-sonnet":  { input: 3.00  / 1_000_000, output: 15.00 / 1_000_000 },
  "claude-haiku-4-5":   { input: 0.80  / 1_000_000, output:  4.00 / 1_000_000 },
  "claude-3-haiku":     { input: 0.25  / 1_000_000, output:  1.25 / 1_000_000 },
  "gpt-4o":             { input: 2.50  / 1_000_000, output: 10.00 / 1_000_000 },
  "gpt-4o-mini":        { input: 0.15  / 1_000_000, output:  0.60 / 1_000_000 },
};

/** Default model used across the platform */
export const DEFAULT_MODEL = "claude-sonnet-4-6";

/**
 * Agency pack credit value in USD — the floor for pricing.
 * All credit prices must be profitable at this rate.
 */
export const CREDIT_VALUE_USD = 0.0093;

/**
 * Compute actual API cost from token usage.
 */
export function computeApiCost(
  inputTokens: number,
  outputTokens: number,
  model: string = DEFAULT_MODEL
): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING[DEFAULT_MODEL];
  return inputTokens * pricing.input + outputTokens * pricing.output;
}

/**
 * Compute how many credits a given API cost is worth at 100% margin.
 * This is for analytics / internal tracking — NOT for live charging.
 * Live charges use the flat CREDIT_COSTS below.
 */
export function computeTokenCredits(
  inputTokens: number,
  outputTokens: number,
  model: string = DEFAULT_MODEL
): number {
  const apiCost = computeApiCost(inputTokens, outputTokens, model);
  // 100% margin: user pays 2× the API cost
  return Math.max(1, Math.ceil((apiCost * 2) / CREDIT_VALUE_USD));
}

/* ── Flat credit costs per operation ─────────────────────────
 *
 * These are the ACTUAL prices users pay per operation.
 * Each is calibrated against expected average token usage for that
 * operation, priced at ≥100% margin over the Agency pack rate.
 *
 * Columns: operation → credits  |  expectedTokens (in+out) → apiCost → 2× → credits(agency)
 *
 *   chat-message:     ~1500+800    → $0.0165  → $0.033  → 3.5cr → round to 5
 *   chiko-message:    ~2500+1200   → $0.0255  → $0.051  → 5.5cr → round to 8
 *   file-parsing:     ~3000+1500   → $0.0315  → $0.063  → 6.8cr → round to 8
 *   image-analysis:   ~500+800     → $0.0135  → $0.027  → 2.9cr → round to 5
 *   resume-revision:  ~2000+2000   → $0.0360  → $0.072  → 7.7cr → round to 10
 *   resume-generation:~3000+4000   → $0.0690  → $0.138  → 14.8cr → round to 15
 *   sales-book-fill:  ~2500+2500   → $0.0450  → $0.090  → 9.7cr → round to 10
 *   invoice-fill:     ~2000+2000   → $0.0360  → $0.072  → 7.7cr → round to 10
 *   business-card:    ~4000+6000   → $0.1020  → $0.204  → 21.9cr → round to 25
 *   logo-generation:  ~3000+5000   → $0.0840  → $0.168  → 18.1cr → round to 20
 *
 * Tier guide:
 *   Free (0)       — no AI, pure utility / platform technology
 *   Micro (1-5)    — lightweight text / parsing / platform-heavy
 *   Standard (8-15) — chat generation / moderate output
 *   Heavy (20-35)  — large output / vision / multi-pass
 *   Premium (40-75) — video / audio / multi-model pipeline
 */
export const CREDIT_COSTS: Record<string, number> = {
  /* ── Free tier (platform-only, no AI) ──────────────────── */
  "image-search":            0,
  "file-upload":             0,

  /* ── Micro tier ────────────────────────────────────────── */
  "chat-message":            5,
  "image-analysis":          5,

  /* ── Standard tier ─────────────────────────────────────── */
  "chiko-message":           8,
  "file-parsing":            8,
  "resume-revision":        10,
  "sales-book-fill":        10,
  "invoice-fill":           10,
  "email-campaign":         10,
  "seo-content":            10,

  /* ── Heavy tier ────────────────────────────────────────── */
  "resume-generation":      15,
  "social-media-design":    15,
  "landing-page-copy":      15,
  "logo-generation":        20,
  "business-card-design":   25,
  "flyer-design":           25,
  "brochure-design":        30,
  "presentation-design":    35,

  /* ── Premium tier (future — multi-model) ───────────────── */
  "video-generation":       50,
  "audio-generation":       25,
};

/** Get credit cost for an operation. Returns 5 as default for unknown ops. */
export function getCreditCostClient(operation: string): number {
  return CREDIT_COSTS[operation] ?? 5;
}

/** Credit pack definitions (Zambian Kwacha) */
export const CREDIT_PACKS = [
  { id: "starter",  name: "Starter",  credits: 100,  priceZMW: 49,   perCredit: "K0.49" },
  { id: "popular",  name: "Popular",  credits: 500,  priceZMW: 199,  perCredit: "K0.40", popular: true },
  { id: "pro",      name: "Pro",      credits: 1_500, priceZMW: 499,  perCredit: "K0.33" },
  { id: "agency",   name: "Agency",   credits: 5_000, priceZMW: 1_299, perCredit: "K0.26" },
] as const;

/**
 * Maps tool IDs → credit operation keys.
 * Tools not listed here either cost 0 (utility) or use the category default.
 */
export const TOOL_CREDIT_MAP: Record<string, string> = {
  /* ── Design Studio ──────────────────────────────────── */
  "logo-reveal":           "logo-generation",
  "brand-identity":        "logo-generation",
  "business-card":         "business-card-design",
  "social-media-post":     "social-media-design",
  "poster":                "flyer-design",
  "flyer":                 "flyer-design",
  "brochure":              "brochure-design",
  "banner-ad":             "social-media-design",
  "infographic":           "flyer-design",
  "packaging-design":      "flyer-design",
  "icon-illustration":     "logo-generation",
  "mockup-generator":      "social-media-design",
  "sticker-designer":      "social-media-design",
  "tshirt-merch":          "social-media-design",
  "signage":               "flyer-design",
  "greeting-card":         "social-media-design",
  "invitation-designer":   "social-media-design",
  "calendar-designer":     "social-media-design",

  /* ── Document & Print Studio ────────────────────────── */
  "resume-cv":             "resume-generation",
  "cover-letter":          "resume-revision",
  "sales-book-a5":         "sales-book-fill",
  "invoice-designer":      "invoice-fill",
  "proforma-invoice":      "invoice-fill",
  "quote-estimate":        "invoice-fill",
  "receipt-designer":      "invoice-fill",
  "credit-note":           "invoice-fill",
  "delivery-note":         "invoice-fill",
  "purchase-order":        "invoice-fill",
  "statement-of-account":  "invoice-fill",
  "proposal-generator":    "sales-book-fill",
  "certificate":           "invoice-fill",
  "diploma-designer":      "invoice-fill",
  "letterhead":            "business-card-design",
  "envelope":              "business-card-design",
  "id-badge":              "business-card-design",
  "menu-designer":         "sales-book-fill",
  "ticket-designer":       "invoice-fill",
  "event-program":         "sales-book-fill",
  "newsletter-print":      "sales-book-fill",
  "company-profile":       "sales-book-fill",
  "media-kit":             "sales-book-fill",
  "price-list":            "invoice-fill",
  "line-sheet":            "invoice-fill",
  "product-catalog":       "brochure-design",
  "lookbook":              "brochure-design",
  "report-generator":      "sales-book-fill",
  "business-plan":         "sales-book-fill",
  "contract-template":     "sales-book-fill",
  "employee-handbook":     "sales-book-fill",
  "training-manual":       "sales-book-fill",
  "user-guide":            "sales-book-fill",
  "job-description":       "resume-revision",
  "gift-voucher":          "invoice-fill",
  "real-estate-listing":   "sales-book-fill",
  "white-paper":           "sales-book-fill",
  "case-study":            "sales-book-fill",
  "portfolio-builder":     "brochure-design",

  /* ── Video & Motion Studio ──────────────────────────── */
  "text-to-video":         "video-generation",
  "thumbnail-generator":   "social-media-design",
  "subtitle-caption":      "audio-generation",
  "gif-converter":         "chat-message",
  "video-compressor":      "chat-message",
  "motion-graphics":       "video-generation",

  /* ── Audio & Voice Studio ───────────────────────────── */
  "voice-cloning":         "audio-generation",
  "audio-transcription":   "audio-generation",
  "music-generator":       "audio-generation",
  "podcast-editor":        "audio-generation",

  /* ── Content Creation ───────────────────────────────── */
  "social-caption":        "chat-message",
  "email-campaign":        "email-campaign",
  "seo-optimizer":         "seo-content",
  "landing-page-copy":     "landing-page-copy",
  "product-description":   "chat-message",
  "video-script":          "chat-message",
  "content-calendar":      "chat-message",
  "ebook-creator":         "sales-book-fill",
  "email-sequence":        "email-campaign",

  /* ── Marketing & Sales ──────────────────────────────── */
  "sales-funnel":          "sales-book-fill",
  "lead-magnet":           "sales-book-fill",
  "analytics-dashboard":   "chat-message",

  /* ── Web & UI Design ────────────────────────────────── */
  "wireframe-generator":   "social-media-design",
  "ui-component-designer": "social-media-design",
  "email-template":        "email-campaign",

  /* ── Utilities (mostly free / low-cost) ─────────────── */
  "ai-image-generator":    "logo-generation",
  "image-enhancer":        "image-analysis",
  "background-remover":    "image-analysis",
  "color-palette":         "chat-message",
  "photo-retoucher":       "image-analysis",
  "presentation":          "presentation-design",
};

/**
 * Get the credit cost for a tool by its tool ID.
 * Returns the cost from the mapping, or 5 (default standard tier) if not mapped.
 */
export function getToolCreditCost(toolId: string): number {
  const operation = TOOL_CREDIT_MAP[toolId];
  if (!operation) return 5; // default for unmapped tools
  return CREDIT_COSTS[operation] ?? 5;
}
