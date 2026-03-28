// =============================================================================
// DMSuite — Certificate Template Composer
//
// Takes a CertificateConfig + style/mood selection → produces a complete
// DesignDocumentV2 by composing layers from the certificate asset library
// plus semantic text layers for all certificate content fields.
//
// Used by:
//  1. CertificateDesignerWorkspace — initial document generation
//  2. Chiko AI — via cert-manifest intents (regenerate, swap-style, etc.)
//  3. Template preview thumbnails
// =============================================================================

import type { DesignDocumentV2, LayerV2 } from "./schema";
import {
  createDocumentV2,
  addLayer,
  createTextLayerV2,
  hexToRGBA,
} from "./schema";
import {
  type CertBuildParams,
  type CertMood,
  type CertCategory,
  buildCertAsset,
  suggestCertAssets,
} from "./certificate-library";

// =============================================================================
// 1. Types
// =============================================================================

export type CertificateType =
  | "achievement" | "completion" | "award" | "recognition"
  | "participation" | "training" | "diploma" | "accreditation";

export type CertificateSize = "a4-landscape" | "a4-portrait" | "letter-landscape" | "letter-portrait";

export interface CertificateSizeSpec {
  id: CertificateSize;
  label: string;
  width: number;
  height: number;
}

export const CERT_SIZES: CertificateSizeSpec[] = [
  { id: "a4-landscape", label: "A4 Landscape", width: 842, height: 595 },
  { id: "a4-portrait", label: "A4 Portrait", width: 595, height: 842 },
  { id: "letter-landscape", label: "Letter Landscape", width: 792, height: 612 },
  { id: "letter-portrait", label: "Letter Portrait", width: 612, height: 792 },
];

export interface CertColorScheme {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

export const CERT_COLOR_SCHEMES: CertColorScheme[] = [
  { id: "gold-classic", label: "Classic Gold", primary: "#C9A84C", secondary: "#8B6914", accent: "#D4AF37", bg: "#FFFDF7", text: "#2D2006" },
  { id: "navy-formal", label: "Navy Formal", primary: "#1E3A5F", secondary: "#0D1B2A", accent: "#4A90D9", bg: "#F5F7FA", text: "#1A1A2E" },
  { id: "emerald-honor", label: "Emerald Honor", primary: "#1B5E20", secondary: "#0D3311", accent: "#4CAF50", bg: "#F1F8F2", text: "#1A2E1B" },
  { id: "royal-purple", label: "Royal Purple", primary: "#4A148C", secondary: "#2E0854", accent: "#9C27B0", bg: "#FAF5FF", text: "#2D1A4E" },
  { id: "crimson-prestige", label: "Crimson Prestige", primary: "#8B0000", secondary: "#5C0000", accent: "#E53935", bg: "#FFF5F5", text: "#2E0A0A" },
  { id: "silver-modern", label: "Silver Modern", primary: "#546E7A", secondary: "#37474F", accent: "#90A4AE", bg: "#FAFAFA", text: "#212121" },
  { id: "bronze-vintage", label: "Bronze Vintage", primary: "#8D6E63", secondary: "#5D4037", accent: "#A1887F", bg: "#FBF8F5", text: "#3E2723" },
  { id: "midnight-luxury", label: "Midnight Luxury", primary: "#C9A84C", secondary: "#1A1A2E", accent: "#FFD700", bg: "#0F0F1A", text: "#E8DCC8" },
];

export type CertStyle = "classic" | "modern" | "elegant" | "bold" | "vintage" | "minimal";

export interface CertificateConfig {
  type: CertificateType;
  size: CertificateSize;
  style: CertStyle;
  colorSchemeId: string;
  /** Content fields */
  title: string;
  subtitle: string;
  recipientName: string;
  description: string;
  issuerName: string;
  issuerTitle: string;
  organizationName: string;
  date: string;
  serialNumber: string;
  /** Optional feature toggles */
  showSeal: boolean;
  showCorners: boolean;
  showRibbon: boolean;
  showDivider: boolean;
}

// =============================================================================
// 2. Style-to-Mood Mapping
// =============================================================================

const STYLE_MOOD_MAP: Record<CertStyle, CertMood[]> = {
  classic: ["classic", "elegant"],
  modern: ["modern", "bold"],
  elegant: ["elegant", "classic"],
  bold: ["bold", "modern"],
  vintage: ["vintage", "classic"],
  minimal: ["modern", "elegant"],
};

// =============================================================================
// 3. Asset Selection Logic
// =============================================================================

interface AssetSelection {
  background: string | null;
  frame: string | null;
  border: string | null;
  corners: string | null;
  divider: string | null;
  seal: string | null;
  ribbon: string | null;
  ornament: string | null;
}

function selectAssetsForStyle(style: CertStyle, config: CertificateConfig): AssetSelection {
  const moods = STYLE_MOOD_MAP[style];
  const primaryMood = moods[0];

  // Use suggestCertAssets for intelligent selection
  const suggested = suggestCertAssets({ mood: primaryMood, wantFrame: true, wantSeal: true, wantCorners: true, wantDivider: true, wantRibbon: true });
  const byCategory = new Map<CertCategory, string>();
  for (const a of suggested) {
    if (!byCategory.has(a.category)) {
      byCategory.set(a.category, a.id);
    }
  }

  // Style-specific overrides for curated combinations
  const overrides = getStyleOverrides(style);

  return {
    background: overrides.background ?? byCategory.get("backgrounds") ?? "bg-radial-vignette",
    frame: overrides.frame ?? byCategory.get("frames") ?? "frame-classic-double",
    border: overrides.border ?? byCategory.get("borders") ?? null,
    corners: config.showCorners ? (overrides.corners ?? byCategory.get("corners") ?? "corner-l-bracket") : null,
    divider: config.showDivider ? (overrides.divider ?? byCategory.get("dividers") ?? "divider-scrollwork") : null,
    seal: config.showSeal ? (overrides.seal ?? byCategory.get("seals") ?? "seal-wax-classic") : null,
    ribbon: config.showRibbon ? (overrides.ribbon ?? byCategory.get("ribbons") ?? null) : null,
    ornament: overrides.ornament ?? byCategory.get("ornaments") ?? null,
  };
}

function getStyleOverrides(style: CertStyle): Partial<AssetSelection> {
  switch (style) {
    case "classic":
      return {
        frame: "frame-classic-double",
        background: "bg-radial-vignette",
        corners: "corner-flourish-classic",
        divider: "divider-scrollwork",
        seal: "seal-wax-classic",
        ornament: "ornament-laurel-branch",
      };
    case "modern":
      return {
        frame: "frame-modern-thin",
        background: "bg-gradient-cool",
        corners: "corner-l-bracket",
        divider: "divider-triple-dash",
        seal: "seal-hexagonal",
        border: "border-dash-accent",
      };
    case "elegant":
      return {
        frame: "frame-ornate-gold",
        background: "bg-gold-shimmer",
        corners: "corner-filigree-swirl",
        divider: "divider-fleur-de-lis",
        seal: "seal-rosette",
        ornament: "ornament-olive-wreath",
      };
    case "bold":
      return {
        frame: "frame-thick-band",
        background: "bg-center-spotlight",
        corners: "corner-geometric-block",
        divider: "divider-diamond-center",
        seal: "seal-starburst",
        ribbon: "ribbon-center-banner",
      };
    case "vintage":
      return {
        frame: "frame-certificate-formal",
        background: "bg-paper-texture",
        corners: "corner-ornate-leaf",
        divider: "divider-ornate-rule",
        seal: "seal-laurel-wreath",
        ornament: "ornament-scroll-banner",
      };
    case "minimal":
      return {
        frame: "frame-modern-thin",
        background: "bg-gradient-warm",
        corners: "corner-dot-trio",
        divider: "divider-simple-line",
        seal: "seal-double-ring",
      };
    default:
      return {};
  }
}

// =============================================================================
// 4. Text Layout Engine
// =============================================================================

interface TextLayout {
  layers: LayerV2[];
}

function buildTextLayers(config: CertificateConfig, W: number, H: number, colorScheme: CertColorScheme): TextLayout {
  const layers: LayerV2[] = [];
  const textColor = colorScheme.text;
  const accentColor = colorScheme.accent;
  const isLandscape = W > H;
  const margin = isLandscape ? W * 0.12 : W * 0.10;
  const contentW = W - margin * 2;

  // Title — "Certificate of Achievement"
  const titleY = isLandscape ? H * 0.14 : H * 0.10;
  layers.push(createTextLayerV2({
    name: "Certificate Title",
    x: margin, y: titleY,
    width: contentW, height: 50,
    text: config.title || "Certificate of Achievement",
    fontSize: isLandscape ? 32 : 28,
    fontFamily: "serif",
    fontWeight: 700,
    color: hexToRGBA(textColor),
    align: "center",
    tags: ["text", "title", "cert-title", "editable"],
  }));

  // Subtitle
  if (config.subtitle) {
    layers.push(createTextLayerV2({
      name: "Subtitle",
      x: margin, y: titleY + 50,
      width: contentW, height: 30,
      text: config.subtitle,
      fontSize: isLandscape ? 16 : 14,
      fontFamily: "serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.7),
      align: "center",
      tags: ["text", "subtitle", "editable"],
    }));
  }

  // "This certifies that" preamble
  const preambleY = isLandscape ? H * 0.34 : H * 0.26;
  layers.push(createTextLayerV2({
    name: "Preamble",
    x: margin, y: preambleY,
    width: contentW, height: 24,
    text: "This certifies that",
    fontSize: isLandscape ? 14 : 12,
    fontFamily: "serif",
    fontWeight: 400,
    color: hexToRGBA(textColor, 0.6),
    align: "center",
    tags: ["text", "preamble", "editable"],
  }));

  // Recipient name — the biggest text
  const recipientY = preambleY + 30;
  layers.push(createTextLayerV2({
    name: "Recipient Name",
    x: margin, y: recipientY,
    width: contentW, height: 52,
    text: config.recipientName || "Recipient Name",
    fontSize: isLandscape ? 40 : 34,
    fontFamily: "serif",
    fontWeight: 700,
    color: hexToRGBA(accentColor),
    align: "center",
    tags: ["text", "recipient", "recipient-name", "editable", "hero-text"],
  }));

  // Description
  const descY = recipientY + 58;
  if (config.description) {
    layers.push(createTextLayerV2({
      name: "Description",
      x: margin + contentW * 0.1, y: descY,
      width: contentW * 0.8, height: 60,
      text: config.description,
      fontSize: isLandscape ? 13 : 11,
      fontFamily: "sans-serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.75),
      align: "center",
      tags: ["text", "description", "editable"],
    }));
  }

  // Footer zone — issuer, date, signature
  const footerY = isLandscape ? H * 0.74 : H * 0.68;
  const colW = contentW / 3;

  // Left column: Date
  if (config.date) {
    layers.push(createTextLayerV2({
      name: "Date",
      x: margin, y: footerY,
      width: colW, height: 20,
      text: config.date,
      fontSize: 12,
      fontFamily: "sans-serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.7),
      align: "center",
      tags: ["text", "date", "editable"],
    }));
    layers.push(createTextLayerV2({
      name: "Date Label",
      x: margin, y: footerY + 20,
      width: colW, height: 16,
      text: "Date",
      fontSize: 10,
      fontFamily: "sans-serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.45),
      align: "center",
      tags: ["text", "label", "date-label"],
    }));
  }

  // Center column: Issuer name + title
  layers.push(createTextLayerV2({
    name: "Issuer Name",
    x: margin + colW, y: footerY,
    width: colW, height: 20,
    text: config.issuerName || "Issuer Name",
    fontSize: 13,
    fontFamily: "serif",
    fontWeight: 600,
    color: hexToRGBA(textColor, 0.8),
    align: "center",
    tags: ["text", "issuer", "issuer-name", "editable"],
  }));
  if (config.issuerTitle) {
    layers.push(createTextLayerV2({
      name: "Issuer Title",
      x: margin + colW, y: footerY + 20,
      width: colW, height: 16,
      text: config.issuerTitle,
      fontSize: 10,
      fontFamily: "sans-serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.55),
      align: "center",
      tags: ["text", "issuer-title", "editable"],
    }));
  }

  // Right column: Organization
  if (config.organizationName) {
    layers.push(createTextLayerV2({
      name: "Organization",
      x: margin + colW * 2, y: footerY,
      width: colW, height: 20,
      text: config.organizationName,
      fontSize: 12,
      fontFamily: "sans-serif",
      fontWeight: 500,
      color: hexToRGBA(textColor, 0.7),
      align: "center",
      tags: ["text", "organization", "editable"],
    }));
    layers.push(createTextLayerV2({
      name: "Org Label",
      x: margin + colW * 2, y: footerY + 20,
      width: colW, height: 16,
      text: "Organization",
      fontSize: 10,
      fontFamily: "sans-serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.45),
      align: "center",
      tags: ["text", "label", "org-label"],
    }));
  }

  // Serial number (bottom center, small)
  if (config.serialNumber) {
    layers.push(createTextLayerV2({
      name: "Serial Number",
      x: margin, y: H * 0.92,
      width: contentW, height: 14,
      text: `No. ${config.serialNumber}`,
      fontSize: 9,
      fontFamily: "monospace",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.35),
      align: "center",
      tags: ["text", "serial", "serial-number"],
    }));
  }

  return { layers };
}

// =============================================================================
// 5. Document Composer — The Main Export
// =============================================================================

export interface ComposeOptions {
  config: CertificateConfig;
  /** Override color scheme (if not using colorSchemeId) */
  colorScheme?: CertColorScheme;
  /** Override specific asset selections */
  assetOverrides?: Partial<AssetSelection>;
}

/**
 * Compose a complete certificate DesignDocumentV2 from config + style.
 * This is the primary entry point for both workspace and Chiko AI.
 */
export function composeCertificate(options: ComposeOptions): DesignDocumentV2 {
  const { config, assetOverrides } = options;

  // Resolve color scheme
  const colorScheme = options.colorScheme
    ?? CERT_COLOR_SCHEMES.find((s) => s.id === config.colorSchemeId)
    ?? CERT_COLOR_SCHEMES[0];

  // Resolve size
  const sizeSpec = CERT_SIZES.find((s) => s.id === config.size) ?? CERT_SIZES[0];
  const W = sizeSpec.width;
  const H = sizeSpec.height;

  // Create base document
  let doc = createDocumentV2({
    toolId: "certificate-designer",
    name: config.title || "Certificate",
    width: W,
    height: H,
    backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
  });

  // Build params for asset library
  const buildParams: CertBuildParams = {
    W,
    H,
    primary: colorScheme.primary,
    secondary: colorScheme.secondary,
    accent: colorScheme.accent,
    bg: colorScheme.bg,
    opacity: 1,
  };

  // Select assets based on style
  const selection = selectAssetsForStyle(config.style, config);
  const finalSelection = { ...selection, ...assetOverrides };

  // ---- Layer Order (back to front) ----
  // 1. Background wash/texture
  // 2. Frame
  // 3. Border
  // 4. Corners
  // 5. Background ornaments
  // 6. Text layers
  // 7. Dividers
  // 8. Seals
  // 9. Ribbons
  // 10. Foreground ornaments

  // 1. Background
  if (finalSelection.background) {
    const layers = buildCertAsset(finalSelection.background, buildParams);
    if (layers) {
      for (const layer of layers) doc = addLayer(doc, layer);
    }
  }

  // 2. Frame
  if (finalSelection.frame) {
    const layers = buildCertAsset(finalSelection.frame, buildParams);
    if (layers) {
      for (const layer of layers) doc = addLayer(doc, layer);
    }
  }

  // 3. Border
  if (finalSelection.border) {
    const layers = buildCertAsset(finalSelection.border, buildParams);
    if (layers) {
      for (const layer of layers) doc = addLayer(doc, layer);
    }
  }

  // 4. Corners
  if (finalSelection.corners) {
    const layers = buildCertAsset(finalSelection.corners, buildParams);
    if (layers) {
      for (const layer of layers) doc = addLayer(doc, layer);
    }
  }

  // 5. Ornament (background-type, e.g., laurel behind text)
  if (finalSelection.ornament) {
    const layers = buildCertAsset(finalSelection.ornament, buildParams);
    if (layers) {
      for (const layer of layers) doc = addLayer(doc, layer);
    }
  }

  // 6. Text layers
  const textLayout = buildTextLayers(config, W, H, colorScheme);
  for (const layer of textLayout.layers) {
    doc = addLayer(doc, layer);
  }

  // 7. Dividers
  if (finalSelection.divider) {
    const layers = buildCertAsset(finalSelection.divider, buildParams);
    if (layers) {
      for (const layer of layers) doc = addLayer(doc, layer);
    }
  }

  // 8. Seal
  if (finalSelection.seal) {
    const layers = buildCertAsset(finalSelection.seal, buildParams);
    if (layers) {
      for (const layer of layers) doc = addLayer(doc, layer);
    }
  }

  // 9. Ribbon
  if (finalSelection.ribbon) {
    const layers = buildCertAsset(finalSelection.ribbon, buildParams);
    if (layers) {
      for (const layer of layers) doc = addLayer(doc, layer);
    }
  }

  return doc;
}

// =============================================================================
// 6. Template Presets — Quick-start certificate templates
// =============================================================================

export interface CertTemplatePreset {
  id: string;
  label: string;
  description: string;
  style: CertStyle;
  colorSchemeId: string;
  certType: CertificateType;
  /** Feature toggles */
  showSeal: boolean;
  showCorners: boolean;
  showRibbon: boolean;
  showDivider: boolean;
}

export const CERT_TEMPLATE_PRESETS: CertTemplatePreset[] = [
  {
    id: "classic-gold",
    label: "Classic Gold",
    description: "Traditional gold certificate with ornate flourishes and wax seal",
    style: "classic",
    colorSchemeId: "gold-classic",
    certType: "achievement",
    showSeal: true, showCorners: true, showRibbon: false, showDivider: true,
  },
  {
    id: "corporate-formal",
    label: "Corporate Formal",
    description: "Professional navy design for corporate awards and recognition",
    style: "elegant",
    colorSchemeId: "navy-formal",
    certType: "recognition",
    showSeal: true, showCorners: true, showRibbon: false, showDivider: true,
  },
  {
    id: "modern-minimal",
    label: "Modern Minimal",
    description: "Clean and contemporary with subtle accents",
    style: "minimal",
    colorSchemeId: "silver-modern",
    certType: "completion",
    showSeal: true, showCorners: true, showRibbon: false, showDivider: true,
  },
  {
    id: "bold-achievement",
    label: "Bold Achievement",
    description: "High-impact design with spotlight and banner ribbon",
    style: "bold",
    colorSchemeId: "crimson-prestige",
    certType: "award",
    showSeal: true, showCorners: true, showRibbon: true, showDivider: true,
  },
  {
    id: "vintage-honor",
    label: "Vintage Honor",
    description: "Aged paper texture with ornate decorations and laurel wreath",
    style: "vintage",
    colorSchemeId: "bronze-vintage",
    certType: "achievement",
    showSeal: true, showCorners: true, showRibbon: false, showDivider: true,
  },
  {
    id: "royal-diploma",
    label: "Royal Diploma",
    description: "Regal purple design with crown ornament and rosette seal",
    style: "elegant",
    colorSchemeId: "royal-purple",
    certType: "diploma",
    showSeal: true, showCorners: true, showRibbon: false, showDivider: true,
  },
  {
    id: "emerald-academic",
    label: "Emerald Academic",
    description: "Distinguished green scheme for academic accomplishments",
    style: "classic",
    colorSchemeId: "emerald-honor",
    certType: "training",
    showSeal: true, showCorners: true, showRibbon: false, showDivider: true,
  },
  {
    id: "midnight-luxury",
    label: "Midnight Luxury",
    description: "Dark elegant design with gold accents for premium certificates",
    style: "elegant",
    colorSchemeId: "midnight-luxury",
    certType: "accreditation",
    showSeal: true, showCorners: true, showRibbon: false, showDivider: true,
  },
];

/**
 * Create a full config from a preset + user overrides.
 * Used for quick-start template selection.
 */
export function configFromPreset(
  preset: CertTemplatePreset,
  overrides?: Partial<CertificateConfig>,
): CertificateConfig {
  return {
    type: preset.certType,
    size: "a4-landscape",
    style: preset.style,
    colorSchemeId: preset.colorSchemeId,
    title: `Certificate of ${capitalize(preset.certType)}`,
    subtitle: "",
    recipientName: "Recipient Name",
    description: "For outstanding dedication and exemplary achievement in the pursuit of excellence.",
    issuerName: "Issuer Name",
    issuerTitle: "Director",
    organizationName: "Organization",
    date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    serialNumber: "",
    showSeal: preset.showSeal,
    showCorners: preset.showCorners,
    showRibbon: preset.showRibbon,
    showDivider: preset.showDivider,
    ...overrides,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
