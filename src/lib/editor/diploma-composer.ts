// =============================================================================
// DMSuite — Diploma & Accreditation Template Composer
//
// Takes a DiplomaConfig (canvas-oriented) → produces a DesignDocumentV2
// using shared certificate-library assets + diploma-specific text layout.
//
// Architecture mirrors certificate-composer.ts exactly:
//   1. Types & Constants
//   2. Style-to-Mood Mapping
//   3. Asset Selection Logic (reuses certificate-library)
//   4. Text Layout Engine (diploma-specific: institution, degree, honors, signatories)
//   5. Document Composer (composeDiploma)
//
// Used by:
//   1. DiplomaDesignerWorkspace — initial document generation
//   2. Chiko AI — via diploma manifest intents
//   3. Template preview thumbnails
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

export type DiplomaType =
  | "bachelors"
  | "masters"
  | "doctorate"
  | "professional-diploma"
  | "honorary-doctorate"
  | "vocational"
  | "postgraduate"
  | "accreditation";

export type DiplomaSize = "a4-landscape" | "a4-portrait" | "letter-landscape" | "letter-portrait";

export interface DiplomaSizeSpec {
  id: DiplomaSize;
  label: string;
  width: number;
  height: number;
}

export const DIPLOMA_SIZES: DiplomaSizeSpec[] = [
  { id: "a4-landscape", label: "A4 Landscape", width: 842, height: 595 },
  { id: "a4-portrait", label: "A4 Portrait", width: 595, height: 842 },
  { id: "letter-landscape", label: "Letter Landscape", width: 792, height: 612 },
  { id: "letter-portrait", label: "Letter Portrait", width: 612, height: 792 },
];

export type DiplomaStyle = "academic" | "modern" | "classic" | "ivy-league" | "executive" | "minimal";

export interface DiplomaColorScheme {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

export const DIPLOMA_COLOR_SCHEMES: DiplomaColorScheme[] = [
  { id: "university-navy", label: "University Navy", primary: "#1E3A5F", secondary: "#0D1B2A", accent: "#4A90D9", bg: "#F5F7FA", text: "#1A1A2E" },
  { id: "ivy-crimson", label: "Ivy Crimson", primary: "#7C2D12", secondary: "#4A1B09", accent: "#DC7633", bg: "#FEF9EF", text: "#2E1A0A" },
  { id: "academic-green", label: "Academic Green", primary: "#166534", secondary: "#0D3311", accent: "#4CAF50", bg: "#F1F8F2", text: "#1A2E1B" },
  { id: "royal-purple", label: "Royal Purple", primary: "#4A148C", secondary: "#2E0854", accent: "#9C27B0", bg: "#FAF5FF", text: "#2D1A4E" },
  { id: "executive-black", label: "Executive Black", primary: "#18181B", secondary: "#27272A", accent: "#A1A1AA", bg: "#FDFCF8", text: "#18181B" },
  { id: "medical-teal", label: "Medical Teal", primary: "#047857", secondary: "#064E3B", accent: "#34D399", bg: "#F0FDF4", text: "#064E3B" },
  { id: "classic-gold", label: "Classic Gold", primary: "#C9A84C", secondary: "#8B6914", accent: "#D4AF37", bg: "#FFFDF7", text: "#2D2006" },
  { id: "vintage-sepia", label: "Vintage Sepia", primary: "#92400E", secondary: "#78350F", accent: "#A1887F", bg: "#FAF3E3", text: "#3E2723" },
];

export type HonorsLevel = "" | "cum-laude" | "magna-cum-laude" | "summa-cum-laude" | "distinction" | "high-distinction" | "first-class" | "merit";

export const HONORS_LEVELS: { id: HonorsLevel; label: string; display: string }[] = [
  { id: "", label: "No Honors", display: "" },
  { id: "cum-laude", label: "Cum Laude", display: "Cum Laude" },
  { id: "magna-cum-laude", label: "Magna Cum Laude", display: "Magna Cum Laude" },
  { id: "summa-cum-laude", label: "Summa Cum Laude", display: "Summa Cum Laude" },
  { id: "distinction", label: "With Distinction", display: "With Distinction" },
  { id: "high-distinction", label: "With High Distinction", display: "With High Distinction" },
  { id: "first-class", label: "First Class Honours", display: "First Class Honours" },
  { id: "merit", label: "With Merit", display: "With Merit" },
];

export interface DiplomaSignatory {
  name: string;
  title: string;
  role: string; // Chancellor, Dean, Registrar, etc.
}

export interface DiplomaConfig {
  type: DiplomaType;
  size: DiplomaSize;
  style: DiplomaStyle;
  colorSchemeId: string;

  // Institution
  institutionName: string;
  institutionSubtitle: string;
  institutionMotto: string;

  // Recipient
  recipientName: string;
  recipientId: string;

  // Program
  degreeName: string;
  fieldOfStudy: string;
  honors: HonorsLevel;

  // Conferral
  conferralText: string;
  resolutionText: string;

  // Accreditation (for type=accreditation)
  accreditationBody: string;
  accreditationNumber: string;

  // Dates
  dateConferred: string;
  graduationDate: string;

  // Reference
  registrationNumber: string;
  serialNumber: string;

  // Signatories
  signatories: DiplomaSignatory[];

  // Feature toggles
  showSeal: boolean;
  showCorners: boolean;
  showBorder: boolean;
  showMotto: boolean;
}

// ---------------------------------------------------------------------------
// Template Presets
// ---------------------------------------------------------------------------

export interface DiplomaTemplatePreset {
  id: string;
  label: string;
  colorSchemeId: string;
  style: DiplomaStyle;
  type: DiplomaType;
  showSeal: boolean;
  showCorners: boolean;
  showBorder: boolean;
  showMotto: boolean;
}

export const DIPLOMA_TEMPLATE_PRESETS: DiplomaTemplatePreset[] = [
  { id: "university-classic", label: "University Classic", colorSchemeId: "university-navy", style: "academic", type: "bachelors", showSeal: true, showCorners: true, showBorder: true, showMotto: true },
  { id: "ivy-league", label: "Ivy League", colorSchemeId: "ivy-crimson", style: "ivy-league", type: "bachelors", showSeal: true, showCorners: true, showBorder: true, showMotto: true },
  { id: "graduate-modern", label: "Graduate Modern", colorSchemeId: "executive-black", style: "modern", type: "masters", showSeal: true, showCorners: false, showBorder: true, showMotto: false },
  { id: "doctorate-formal", label: "Doctorate Formal", colorSchemeId: "royal-purple", style: "classic", type: "doctorate", showSeal: true, showCorners: true, showBorder: true, showMotto: true },
  { id: "executive-diploma", label: "Executive", colorSchemeId: "classic-gold", style: "executive", type: "professional-diploma", showSeal: true, showCorners: true, showBorder: true, showMotto: false },
  { id: "medical-credential", label: "Medical Credential", colorSchemeId: "medical-teal", style: "modern", type: "professional-diploma", showSeal: true, showCorners: false, showBorder: true, showMotto: false },
  { id: "tvet-vocational", label: "TVET / Vocational", colorSchemeId: "academic-green", style: "minimal", type: "vocational", showSeal: true, showCorners: false, showBorder: true, showMotto: false },
  { id: "accreditation-cert", label: "Accreditation", colorSchemeId: "vintage-sepia", style: "classic", type: "accreditation", showSeal: true, showCorners: true, showBorder: true, showMotto: true },
];

// =============================================================================
// 2. Style-to-Mood Mapping
// =============================================================================

const STYLE_MOOD_MAP: Record<DiplomaStyle, CertMood[]> = {
  academic: ["classic", "elegant"],
  modern: ["modern", "bold"],
  classic: ["classic", "vintage"],
  "ivy-league": ["elegant", "classic"],
  executive: ["bold", "modern"],
  minimal: ["modern", "elegant"],
};

// =============================================================================
// 3. Asset Selection Logic (reuses certificate-library)
// =============================================================================

interface AssetSelection {
  background: string | null;
  frame: string | null;
  border: string | null;
  corners: string | null;
  divider: string | null;
  seal: string | null;
  ornament: string | null;
}

function selectAssetsForStyle(style: DiplomaStyle, config: DiplomaConfig): AssetSelection {
  const moods = STYLE_MOOD_MAP[style];
  const primaryMood = moods[0];

  const suggested = suggestCertAssets({
    mood: primaryMood,
    wantFrame: true,
    wantSeal: config.showSeal,
    wantCorners: config.showCorners,
    wantDivider: true,
    wantRibbon: false,
  });
  const byCategory = new Map<CertCategory, string>();
  for (const a of suggested) {
    if (!byCategory.has(a.category)) {
      byCategory.set(a.category, a.id);
    }
  }

  const overrides = getStyleOverrides(style);

  return {
    background: overrides.background ?? byCategory.get("backgrounds") ?? "bg-radial-vignette",
    frame: overrides.frame ?? byCategory.get("frames") ?? "frame-classic-double",
    border: config.showBorder ? (overrides.border ?? byCategory.get("borders") ?? null) : null,
    corners: config.showCorners ? (overrides.corners ?? byCategory.get("corners") ?? "corner-flourish-classic") : null,
    divider: overrides.divider ?? byCategory.get("dividers") ?? "divider-simple-line",
    seal: config.showSeal ? (overrides.seal ?? byCategory.get("seals") ?? "seal-wax-classic") : null,
    ornament: overrides.ornament ?? byCategory.get("ornaments") ?? null,
  };
}

function getStyleOverrides(style: DiplomaStyle): Partial<AssetSelection> {
  switch (style) {
    case "academic":
      return {
        frame: "frame-certificate-formal",
        background: "bg-radial-vignette",
        corners: "corner-ornate-leaf",
        divider: "divider-scrollwork",
        seal: "seal-laurel-wreath",
        ornament: "ornament-laurel-branch",
      };
    case "modern":
      return {
        frame: "frame-modern-thin",
        background: "bg-gradient-cool",
        corners: "corner-l-bracket",
        divider: "divider-triple-dash",
        seal: "seal-hexagonal",
      };
    case "classic":
      return {
        frame: "frame-ornate-gold",
        background: "bg-paper-texture",
        corners: "corner-filigree-swirl",
        divider: "divider-fleur-de-lis",
        seal: "seal-rosette",
        ornament: "ornament-olive-wreath",
      };
    case "ivy-league":
      return {
        frame: "frame-classic-double",
        background: "bg-gold-shimmer",
        corners: "corner-flourish-classic",
        divider: "divider-scrollwork",
        seal: "seal-wax-classic",
        ornament: "ornament-heraldic-shield",
      };
    case "executive":
      return {
        frame: "frame-thick-band",
        background: "bg-center-spotlight",
        corners: "corner-geometric-block",
        divider: "divider-diamond-center",
        seal: "seal-starburst",
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
// 4. Text Layout Engine (Diploma-specific)
// =============================================================================

function buildTextLayers(
  config: DiplomaConfig,
  W: number,
  H: number,
  colorScheme: DiplomaColorScheme,
): LayerV2[] {
  const layers: LayerV2[] = [];
  const textColor = colorScheme.text;
  const accentColor = colorScheme.accent;
  const primaryColor = colorScheme.primary;
  const isLandscape = W > H;
  const margin = isLandscape ? W * 0.10 : W * 0.08;
  const contentW = W - margin * 2;

  let cursorY = isLandscape ? H * 0.08 : H * 0.06;

  // ── Institution Header ──────────────────────────────────

  // Institution name (large, primary color)
  layers.push(createTextLayerV2({
    name: "Institution Name",
    x: margin, y: cursorY,
    width: contentW, height: 40,
    text: config.institutionName || "University Name",
    fontSize: isLandscape ? 28 : 24,
    fontFamily: "serif",
    fontWeight: 700,
    color: hexToRGBA(primaryColor),
    align: "center",
    tags: ["text", "institution", "institution-name", "editable", "hero-text"],
  }));
  cursorY += 42;

  // Institution subtitle (smaller, secondary)
  if (config.institutionSubtitle) {
    layers.push(createTextLayerV2({
      name: "Institution Subtitle",
      x: margin, y: cursorY,
      width: contentW, height: 22,
      text: config.institutionSubtitle,
      fontSize: isLandscape ? 13 : 11,
      fontFamily: "sans-serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.6),
      align: "center",
      tags: ["text", "institution-subtitle", "editable"],
    }));
    cursorY += 24;
  }

  // Motto (italic, subtle)
  if (config.showMotto && config.institutionMotto) {
    layers.push(createTextLayerV2({
      name: "Institution Motto",
      x: margin, y: cursorY,
      width: contentW, height: 20,
      text: `"${config.institutionMotto}"`,
      fontSize: isLandscape ? 11 : 10,
      fontFamily: "serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.45),
      align: "center",
      tags: ["text", "motto", "editable"],
    }));
    cursorY += 24;
  }

  // ── Conferral Text ──────────────────────────────────────

  cursorY += isLandscape ? H * 0.06 : H * 0.04;

  layers.push(createTextLayerV2({
    name: "Conferral Text",
    x: margin + contentW * 0.1, y: cursorY,
    width: contentW * 0.8, height: 30,
    text: config.conferralText || "The Board of Trustees, on recommendation of the Faculty, has conferred upon",
    fontSize: isLandscape ? 12 : 11,
    fontFamily: "serif",
    fontWeight: 400,
    color: hexToRGBA(textColor, 0.7),
    align: "center",
    tags: ["text", "conferral", "editable"],
  }));
  cursorY += 34;

  // ── Recipient Name (hero) ───────────────────────────────

  layers.push(createTextLayerV2({
    name: "Recipient Name",
    x: margin, y: cursorY,
    width: contentW, height: 50,
    text: config.recipientName || "Graduate Name",
    fontSize: isLandscape ? 38 : 32,
    fontFamily: "serif",
    fontWeight: 700,
    color: hexToRGBA(accentColor),
    align: "center",
    tags: ["text", "recipient", "recipient-name", "editable", "hero-text"],
  }));
  cursorY += 54;

  // Recipient ID (small, optional)
  if (config.recipientId) {
    layers.push(createTextLayerV2({
      name: "Recipient ID",
      x: margin, y: cursorY,
      width: contentW, height: 16,
      text: `Student ID: ${config.recipientId}`,
      fontSize: 9,
      fontFamily: "monospace",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.4),
      align: "center",
      tags: ["text", "recipient-id", "editable"],
    }));
    cursorY += 18;
  }

  // ── Resolution Text ─────────────────────────────────────

  if (config.resolutionText) {
    cursorY += 4;
    layers.push(createTextLayerV2({
      name: "Resolution Text",
      x: margin + contentW * 0.1, y: cursorY,
      width: contentW * 0.8, height: 22,
      text: config.resolutionText,
      fontSize: isLandscape ? 11 : 10,
      fontFamily: "serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.6),
      align: "center",
      tags: ["text", "resolution", "editable"],
    }));
    cursorY += 26;
  }

  // ── Degree / program ────────────────────────────────────

  cursorY += 6;

  // "the degree of"
  layers.push(createTextLayerV2({
    name: "Degree Preamble",
    x: margin, y: cursorY,
    width: contentW, height: 20,
    text: config.type === "accreditation" ? "the accreditation of" : "the degree of",
    fontSize: isLandscape ? 12 : 11,
    fontFamily: "serif",
    fontWeight: 400,
    color: hexToRGBA(textColor, 0.6),
    align: "center",
    tags: ["text", "degree-preamble"],
  }));
  cursorY += 22;

  // Degree name (prominent)
  layers.push(createTextLayerV2({
    name: "Degree Name",
    x: margin, y: cursorY,
    width: contentW, height: 36,
    text: config.degreeName || "Bachelor of Arts",
    fontSize: isLandscape ? 26 : 22,
    fontFamily: "serif",
    fontWeight: 700,
    color: hexToRGBA(primaryColor),
    align: "center",
    tags: ["text", "degree", "degree-name", "editable"],
  }));
  cursorY += 38;

  // Field of study
  if (config.fieldOfStudy) {
    layers.push(createTextLayerV2({
      name: "Field of Study",
      x: margin, y: cursorY,
      width: contentW, height: 22,
      text: `in ${config.fieldOfStudy}`,
      fontSize: isLandscape ? 15 : 13,
      fontFamily: "serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.75),
      align: "center",
      tags: ["text", "field-of-study", "editable"],
    }));
    cursorY += 24;
  }

  // Honors
  if (config.honors) {
    const honorsDisplay = HONORS_LEVELS.find((h) => h.id === config.honors)?.display;
    if (honorsDisplay) {
      layers.push(createTextLayerV2({
        name: "Honors",
        x: margin, y: cursorY,
        width: contentW, height: 20,
        text: honorsDisplay,
        fontSize: isLandscape ? 14 : 12,
        fontFamily: "serif",
        fontWeight: 600,
        color: hexToRGBA(accentColor, 0.85),
        align: "center",
        tags: ["text", "honors", "editable"],
      }));
      cursorY += 24;
    }
  }

  // Accreditation details (only for accreditation type)
  if (config.type === "accreditation" && (config.accreditationBody || config.accreditationNumber)) {
    cursorY += 4;
    if (config.accreditationBody) {
      layers.push(createTextLayerV2({
        name: "Accreditation Body",
        x: margin, y: cursorY,
        width: contentW, height: 18,
        text: `Accrediting Body: ${config.accreditationBody}`,
        fontSize: 10,
        fontFamily: "sans-serif",
        fontWeight: 500,
        color: hexToRGBA(textColor, 0.6),
        align: "center",
        tags: ["text", "accreditation-body", "editable"],
      }));
      cursorY += 20;
    }
    if (config.accreditationNumber) {
      layers.push(createTextLayerV2({
        name: "Accreditation Number",
        x: margin, y: cursorY,
        width: contentW, height: 16,
        text: `Accreditation No. ${config.accreditationNumber}`,
        fontSize: 9,
        fontFamily: "monospace",
        fontWeight: 400,
        color: hexToRGBA(textColor, 0.45),
        align: "center",
        tags: ["text", "accreditation-number", "editable"],
      }));
      cursorY += 20;
    }
  }

  // ── Footer: Signatories + Dates ────────────────────────

  const footerY = isLandscape ? H * 0.78 : H * 0.74;
  const sigCount = Math.max(config.signatories.length, 1);
  const colW = contentW / Math.max(sigCount + 1, 3); // +1 for date column

  // Date column (left)
  if (config.dateConferred) {
    layers.push(createTextLayerV2({
      name: "Date Conferred",
      x: margin, y: footerY,
      width: colW, height: 18,
      text: config.dateConferred,
      fontSize: 11,
      fontFamily: "sans-serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.7),
      align: "center",
      tags: ["text", "date", "date-conferred", "editable"],
    }));
    layers.push(createTextLayerV2({
      name: "Date Label",
      x: margin, y: footerY + 18,
      width: colW, height: 14,
      text: "Date Conferred",
      fontSize: 9,
      fontFamily: "sans-serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.4),
      align: "center",
      tags: ["text", "label", "date-label"],
    }));
  }

  // Signatory columns
  for (let i = 0; i < config.signatories.length; i++) {
    const sig = config.signatories[i];
    const sigX = margin + colW * (i + 1);
    layers.push(createTextLayerV2({
      name: `Signatory: ${sig.role || `Signatory ${i + 1}`}`,
      x: sigX, y: footerY,
      width: colW, height: 18,
      text: sig.name || sig.role || "Name",
      fontSize: 12,
      fontFamily: "serif",
      fontWeight: 600,
      color: hexToRGBA(textColor, 0.8),
      align: "center",
      tags: ["text", "signatory", `signatory-${i}`, "editable"],
    }));
    layers.push(createTextLayerV2({
      name: `Signatory Title: ${sig.role || `${i + 1}`}`,
      x: sigX, y: footerY + 18,
      width: colW, height: 14,
      text: sig.title || sig.role || "Title",
      fontSize: 9,
      fontFamily: "sans-serif",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.5),
      align: "center",
      tags: ["text", "signatory-title", `signatory-title-${i}`, "editable"],
    }));
  }

  // ── Serial & Registration ──────────────────────────────

  if (config.serialNumber || config.registrationNumber) {
    const footerBottomY = H * 0.93;
    const parts: string[] = [];
    if (config.registrationNumber) parts.push(`Reg. ${config.registrationNumber}`);
    if (config.serialNumber) parts.push(`No. ${config.serialNumber}`);
    layers.push(createTextLayerV2({
      name: "Reference Numbers",
      x: margin, y: footerBottomY,
      width: contentW, height: 14,
      text: parts.join("  ·  "),
      fontSize: 8,
      fontFamily: "monospace",
      fontWeight: 400,
      color: hexToRGBA(textColor, 0.3),
      align: "center",
      tags: ["text", "serial", "registration", "reference-numbers"],
    }));
  }

  return layers;
}

// =============================================================================
// 5. Document Composer
// =============================================================================

export interface DiplomaComposeOptions {
  config: DiplomaConfig;
  colorScheme?: DiplomaColorScheme;
  assetOverrides?: Partial<AssetSelection>;
}

/**
 * Compose a complete diploma DesignDocumentV2 from config + style.
 */
export function composeDiploma(options: DiplomaComposeOptions): DesignDocumentV2 {
  const { config, assetOverrides } = options;

  const colorScheme = options.colorScheme
    ?? DIPLOMA_COLOR_SCHEMES.find((s) => s.id === config.colorSchemeId)
    ?? DIPLOMA_COLOR_SCHEMES[0];

  const sizeSpec = DIPLOMA_SIZES.find((s) => s.id === config.size) ?? DIPLOMA_SIZES[0];
  const W = sizeSpec.width;
  const H = sizeSpec.height;

  let doc = createDocumentV2({
    toolId: "diploma-designer",
    name: config.degreeName || "Diploma",
    width: W,
    height: H,
    backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
  });

  const buildParams: CertBuildParams = {
    W,
    H,
    primary: colorScheme.primary,
    secondary: colorScheme.secondary,
    accent: colorScheme.accent,
    bg: colorScheme.bg,
    opacity: 1,
  };

  const selection = selectAssetsForStyle(config.style, config);
  const finalSelection = { ...selection, ...assetOverrides };

  // Layer Order (back → front):
  // 1. Background
  // 2. Frame
  // 3. Border
  // 4. Corners
  // 5. Ornaments
  // 6. Text layers
  // 7. Dividers
  // 8. Seal

  // 1. Background
  if (finalSelection.background) {
    const layers = buildCertAsset(finalSelection.background, buildParams);
    if (layers) for (const l of layers) doc = addLayer(doc, l);
  }

  // 2. Frame
  if (finalSelection.frame) {
    const layers = buildCertAsset(finalSelection.frame, buildParams);
    if (layers) for (const l of layers) doc = addLayer(doc, l);
  }

  // 3. Border
  if (finalSelection.border) {
    const layers = buildCertAsset(finalSelection.border, buildParams);
    if (layers) for (const l of layers) doc = addLayer(doc, l);
  }

  // 4. Corners
  if (finalSelection.corners) {
    const layers = buildCertAsset(finalSelection.corners, buildParams);
    if (layers) for (const l of layers) doc = addLayer(doc, l);
  }

  // 5. Ornaments
  if (finalSelection.ornament) {
    const layers = buildCertAsset(finalSelection.ornament, buildParams);
    if (layers) for (const l of layers) doc = addLayer(doc, l);
  }

  // 6. Text layers
  const textLayers = buildTextLayers(config, W, H, colorScheme);
  for (const l of textLayers) doc = addLayer(doc, l);

  // 7. Dividers (between institution header and conferral section)
  if (finalSelection.divider) {
    const layers = buildCertAsset(finalSelection.divider, buildParams);
    if (layers) for (const l of layers) doc = addLayer(doc, l);
  }

  // 8. Seal
  if (finalSelection.seal) {
    const layers = buildCertAsset(finalSelection.seal, buildParams);
    if (layers) for (const l of layers) doc = addLayer(doc, l);
  }

  return doc;
}

// ---------------------------------------------------------------------------
// Quick-start from preset
// ---------------------------------------------------------------------------

export function configFromPreset(
  preset: DiplomaTemplatePreset,
  overrides?: Partial<DiplomaConfig>,
): DiplomaConfig {
  return {
    type: preset.type,
    size: "a4-landscape",
    style: preset.style,
    colorSchemeId: preset.colorSchemeId,
    institutionName: "",
    institutionSubtitle: "",
    institutionMotto: "",
    recipientName: "",
    recipientId: "",
    degreeName: "",
    fieldOfStudy: "",
    honors: "",
    conferralText: "The Board of Trustees, on recommendation of the Faculty, has conferred upon",
    resolutionText: "By resolution of the Academic Senate",
    accreditationBody: "",
    accreditationNumber: "",
    dateConferred: new Date().toISOString().split("T")[0],
    graduationDate: "",
    registrationNumber: "",
    serialNumber: `DIP-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    signatories: [
      { name: "", title: "Chancellor", role: "chancellor" },
      { name: "", title: "Registrar", role: "registrar" },
    ],
    showSeal: preset.showSeal,
    showCorners: preset.showCorners,
    showBorder: preset.showBorder,
    showMotto: preset.showMotto,
    ...overrides,
  };
}
