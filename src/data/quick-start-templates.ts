export interface QuickStartTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
}

/**
 * Quick Start templates per tool ID.
 * Each template represents a preset configuration / use case the user can start from.
 */
export const quickStartTemplates: Record<string, QuickStartTemplate[]> = {
  "logo-generator": [
    { id: "wordmark", label: "Wordmark Logo", description: "Clean text-based logo with custom typography", icon: "type" },
    { id: "icon-mark", label: "Icon + Text", description: "Symbol paired with company name", icon: "image" },
    { id: "monogram", label: "Monogram", description: "Letter-based logo using initials", icon: "bold" },
  ],
  "business-card": [
    { id: "modern", label: "Modern Minimal", description: "Clean layout with ample white space", icon: "layout" },
    { id: "corporate", label: "Corporate", description: "Traditional professional design", icon: "briefcase" },
    { id: "creative", label: "Creative Bold", description: "Eye-catching design with vivid colors", icon: "palette" },
  ],
  "social-media-post": [
    { id: "announcement", label: "Announcement", description: "Product launch or news post", icon: "megaphone" },
    { id: "quote", label: "Quote Card", description: "Inspirational or testimonial quote", icon: "quote" },
    { id: "promo", label: "Promotion", description: "Sale, discount, or offer graphic", icon: "tag" },
  ],
  "invoice-designer": [
    { id: "standard", label: "Standard Invoice", description: "Professional itemized invoice", icon: "file-text" },
    { id: "freelance", label: "Freelancer", description: "Simple hourly/project billing", icon: "clock" },
    { id: "recurring", label: "Recurring", description: "Monthly subscription billing", icon: "refresh" },
  ],
  "resume-cv": [
    { id: "modern", label: "Modern", description: "Clean two-column layout", icon: "layout" },
    { id: "executive", label: "Executive", description: "Formal corporate style", icon: "briefcase" },
    { id: "creative", label: "Creative", description: "Portfolio-style with color accents", icon: "palette" },
  ],
  "blog-writer": [
    { id: "how-to", label: "How-To Guide", description: "Step-by-step tutorial article", icon: "list" },
    { id: "listicle", label: "Listicle", description: "Numbered list article format", icon: "list" },
    { id: "opinion", label: "Opinion Piece", description: "Thought leadership editorial", icon: "edit" },
  ],
  "email-template": [
    { id: "newsletter", label: "Newsletter", description: "Regular subscriber update", icon: "mail" },
    { id: "welcome", label: "Welcome Email", description: "New subscriber onboarding", icon: "heart" },
    { id: "promo", label: "Promotional", description: "Sale or product announcement", icon: "tag" },
  ],
  "poster": [
    { id: "event", label: "Event Poster", description: "Concert, conference, or meetup", icon: "calendar" },
    { id: "product", label: "Product Launch", description: "New product announcement", icon: "package" },
    { id: "awareness", label: "Awareness Campaign", description: "Cause or charity poster", icon: "heart" },
  ],
  "presentation": [
    { id: "pitch-deck", label: "Pitch Deck", description: "Startup investor presentation", icon: "trending-up" },
    { id: "report", label: "Report", description: "Data-driven quarterly report", icon: "bar-chart" },
    { id: "training", label: "Training", description: "Educational workshop slides", icon: "book" },
  ],
};
