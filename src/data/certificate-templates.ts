// =============================================================================
// DMSuite — Certificate Template Registry
// 8 curated templates with full metadata, colors, fonts, layout, and SVG paths.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CertificateType =
  | "achievement"
  | "completion"
  | "appreciation"
  | "participation"
  | "training"
  | "recognition"
  | "award"
  | "excellence"
  | "honorary"
  | "membership";

export const CERTIFICATE_TYPES: { id: CertificateType; label: string; defaultTitle: string }[] = [
  { id: "achievement", label: "Achievement", defaultTitle: "Certificate of Achievement" },
  { id: "completion", label: "Completion", defaultTitle: "Certificate of Completion" },
  { id: "appreciation", label: "Appreciation", defaultTitle: "Certificate of Appreciation" },
  { id: "participation", label: "Participation", defaultTitle: "Certificate of Participation" },
  { id: "training", label: "Training", defaultTitle: "Certificate of Training" },
  { id: "recognition", label: "Recognition", defaultTitle: "Certificate of Recognition" },
  { id: "award", label: "Award", defaultTitle: "Certificate of Award" },
  { id: "excellence", label: "Excellence", defaultTitle: "Certificate of Excellence" },
  { id: "honorary", label: "Honorary", defaultTitle: "Honorary Certificate" },
  { id: "membership", label: "Membership", defaultTitle: "Certificate of Membership" },
];

export type TemplateCategory = "formal" | "modern" | "artistic" | "minimal";

export type BorderStyle = "ornate" | "simple" | "double-line" | "corner-only";

export type SealPosition = "bottom-right" | "bottom-center" | "none";

export type SignatoryPosition = "bottom-spread" | "bottom-center" | "bottom-left";

export interface CertificateTemplateColors {
  background: string;
  primary: string;
  secondary: string;
  text: string;
  accent: string;
}

export interface CertificateTemplateFontPairing {
  heading: string;
  headingWeights: number[];
  body: string;
  bodyWeights: number[];
  accent: string;
  accentWeights: number[];
  googleImport: string;
}

export interface CertificateTemplateLayout {
  borderStyle: BorderStyle;
  headerPosition: "top-center";
  sealPosition: SealPosition;
  signatoryPosition: SignatoryPosition;
  orientation: "landscape";
}

export interface CertificateTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  thumbnail: string;
  width: number;
  height: number;
  colors: CertificateTemplateColors;
  fontPairing: CertificateTemplateFontPairing;
  layout: CertificateTemplateLayout;
  svgBorderPath: string;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Template Definitions
// ---------------------------------------------------------------------------

export const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  // 1. Classic Gold
  {
    id: "classic-gold",
    name: "Classic Gold",
    category: "formal",
    description: "Formal, gold and parchment certificate with ornate decorative borders. Perfect for traditional institutions and achievements.",
    thumbnail: "/templates/certificates/thumbs/classic-gold.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#faf6e8",
      primary: "#b8860b",
      secondary: "#d4af37",
      text: "#2c1810",
      accent: "#8b6914",
    },
    fontPairing: {
      heading: "Playfair Display",
      headingWeights: [400, 600, 700],
      body: "Lato",
      bodyWeights: [300, 400, 700],
      accent: "Great Vibes",
      accentWeights: [400],
      googleImport: "Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&family=Great+Vibes",
    },
    layout: {
      borderStyle: "ornate",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/classic-gold-border.svg",
    tags: ["formal", "classic", "gold", "traditional", "achievement", "parchment"],
  },

  // 2. Classic Blue
  {
    id: "classic-blue",
    name: "Classic Blue",
    category: "formal",
    description: "Stately navy and silver certificate. Ideal for academic awards, diplomas, and corporate recognition.",
    thumbnail: "/templates/certificates/thumbs/classic-blue.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#f0f4f8",
      primary: "#35517D",
      secondary: "#4a6fa5",
      text: "#1a2744",
      accent: "#8faabe",
    },
    fontPairing: {
      heading: "Playfair Display",
      headingWeights: [400, 600, 700],
      body: "Lato",
      bodyWeights: [300, 400, 700],
      accent: "Dancing Script",
      accentWeights: [400, 700],
      googleImport: "Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&family=Dancing+Script:wght@400;700",
    },
    layout: {
      borderStyle: "ornate",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/classic-blue-border.svg",
    tags: ["formal", "classic", "blue", "navy", "academic", "diploma"],
  },

  // 3. Burgundy Ornate
  {
    id: "burgundy-ornate",
    name: "Burgundy Ornate",
    category: "formal",
    description: "Rich burgundy and gold with elaborate ornate borders. Ceremonial and distinguished for awards of excellence.",
    thumbnail: "/templates/certificates/thumbs/burgundy-ornate.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#f9f3f0",
      primary: "#4C0C1E",
      secondary: "#7a1f3a",
      text: "#2a0a14",
      accent: "#c4a35a",
    },
    fontPairing: {
      heading: "Crimson Text",
      headingWeights: [400, 600, 700],
      body: "Source Sans 3",
      bodyWeights: [300, 400, 600],
      accent: "Parisienne",
      accentWeights: [400],
      googleImport: "Crimson+Text:wght@400;600;700&family=Source+Sans+3:wght@300;400;600&family=Parisienne",
    },
    layout: {
      borderStyle: "ornate",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/burgundy-ornate-border.svg",
    tags: ["formal", "burgundy", "ornate", "ceremonial", "wine", "elegant"],
  },

  // 4. Teal Modern
  {
    id: "teal-modern",
    name: "Teal Modern",
    category: "modern",
    description: "Clean, contemporary design with teal accents and simple geometric borders. Great for tech companies, workshops, and online courses.",
    thumbnail: "/templates/certificates/thumbs/teal-modern.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#f0fafa",
      primary: "#1a7f8f",
      secondary: "#20b2aa",
      text: "#1a1a2a",
      accent: "#14b8a6",
    },
    fontPairing: {
      heading: "Poppins",
      headingWeights: [400, 600, 700],
      body: "Inter",
      bodyWeights: [300, 400, 600],
      accent: "Caveat",
      accentWeights: [400, 700],
      googleImport: "Poppins:wght@400;600;700&family=Inter:wght@300;400;600&family=Caveat:wght@400;700",
    },
    layout: {
      borderStyle: "simple",
      headerPosition: "top-center",
      sealPosition: "bottom-center",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/teal-modern-border.svg",
    tags: ["modern", "teal", "clean", "tech", "minimalist", "course"],
  },

  // 5. Silver Minimal
  {
    id: "silver-minimal",
    name: "Silver Minimal",
    category: "minimal",
    description: "Ultra-clean design with gray tones and understated double-line border. Professional and uncluttered for corporate training and certifications.",
    thumbnail: "/templates/certificates/thumbs/silver-minimal.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#ffffff",
      primary: "#4a4a4a",
      secondary: "#c0c0c0",
      text: "#1a1a1a",
      accent: "#808080",
    },
    fontPairing: {
      heading: "Cormorant Garamond",
      headingWeights: [400, 600, 700],
      body: "Montserrat",
      bodyWeights: [300, 400, 600],
      accent: "Satisfy",
      accentWeights: [400],
      googleImport: "Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;600&family=Satisfy",
    },
    layout: {
      borderStyle: "double-line",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/silver-minimal-border.svg",
    tags: ["minimal", "silver", "clean", "corporate", "professional", "simple"],
  },

  // 6. Antique Parchment
  {
    id: "antique-parchment",
    name: "Antique Parchment",
    category: "formal",
    description: "Vintage-style certificate that evokes aged parchment with warm sepia tones and classic ornate borders. Perfect for honors, heritage awards, and historical societies.",
    thumbnail: "/templates/certificates/thumbs/antique-parchment.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#f5eed7",
      primary: "#3F3F41",
      secondary: "#8b7355",
      text: "#2c2418",
      accent: "#a08c5a",
    },
    fontPairing: {
      heading: "Cormorant Garamond",
      headingWeights: [400, 600, 700],
      body: "Montserrat",
      bodyWeights: [300, 400, 600],
      accent: "Pinyon Script",
      accentWeights: [400],
      googleImport: "Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;600&family=Pinyon+Script",
    },
    layout: {
      borderStyle: "ornate",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/antique-parchment-border.svg",
    tags: ["formal", "antique", "parchment", "vintage", "heritage", "warm"],
  },

  // 7. Botanical Modern
  {
    id: "botanical-modern",
    name: "Botanical Modern",
    category: "artistic",
    description: "Elegant design with botanical corner flourishes on a clean background. Navy and sage green create a calming, artistic feel. Ideal for creative awards, environmental programs, and wellness certifications.",
    thumbnail: "/templates/certificates/thumbs/botanical-modern.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#f8faf5",
      primary: "#1B2650",
      secondary: "#6b8e5b",
      text: "#1a2040",
      accent: "#8cb07a",
    },
    fontPairing: {
      heading: "Cormorant Garamond",
      headingWeights: [400, 600, 700],
      body: "Montserrat",
      bodyWeights: [300, 400, 600],
      accent: "Sacramento",
      accentWeights: [400],
      googleImport: "Cormorant+Garamond:wght@400;600;700&family=Montserrat:wght@300;400;600&family=Sacramento",
    },
    layout: {
      borderStyle: "corner-only",
      headerPosition: "top-center",
      sealPosition: "bottom-center",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/botanical-modern-border.svg",
    tags: ["artistic", "botanical", "green", "navy", "nature", "creative"],
  },

  // 8. Dark Prestige
  {
    id: "dark-prestige",
    name: "Dark Prestige",
    category: "modern",
    description: "Bold, dark-background certificate with gold accents. The inverted color scheme creates a premium, exclusive feel. Perfect for VIP awards, executive recognitions, and luxury events.",
    thumbnail: "/templates/certificates/thumbs/dark-prestige.png",
    width: 3508,
    height: 2480,
    colors: {
      background: "#1a1a2e",
      primary: "#d4af37",
      secondary: "#f0d060",
      text: "#e8e0d0",
      accent: "#b8860b",
    },
    fontPairing: {
      heading: "Playfair Display",
      headingWeights: [400, 600, 700],
      body: "Inter",
      bodyWeights: [300, 400, 600],
      accent: "Alex Brush",
      accentWeights: [400],
      googleImport: "Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;600&family=Alex+Brush",
    },
    layout: {
      borderStyle: "simple",
      headerPosition: "top-center",
      sealPosition: "bottom-right",
      signatoryPosition: "bottom-spread",
      orientation: "landscape",
    },
    svgBorderPath: "/templates/certificates/dark-prestige-border.svg",
    tags: ["modern", "dark", "gold", "prestige", "luxury", "premium", "vip"],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getCertificateTemplate(id: string): CertificateTemplate {
  return CERTIFICATE_TEMPLATES.find((t) => t.id === id) ?? CERTIFICATE_TEMPLATES[0];
}

export function getDefaultTitleForType(type: CertificateType): string {
  return CERTIFICATE_TYPES.find((t) => t.id === type)?.defaultTitle ?? "Certificate of Achievement";
}
