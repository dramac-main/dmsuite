// =============================================================================
// DMSuite — Certificate Adapter
// Converts CertificateConfig + CertificateTemplate → DesignDocumentV2
// following the business-card-adapter.ts pattern exactly.
// =============================================================================

import type {
  DesignDocumentV2,
  TextLayerV2,
  ShapeLayerV2,
  ImageLayerV2,
  RGBA,
  Paint,
  GradientPaint,
  GradientStop,
  StrokeSpec,
} from "./schema";
import {
  createDocumentV2,
  addLayer,
  updateLayer,
  createTextLayerV2,
  createShapeLayerV2,
  createImageLayerV2,
  hexToRGBA,
  solidPaint,
  solidPaintHex,
} from "./schema";
import type { LayerV2 } from "./schema";
import type {
  CertificateTemplate,
  CertificateTemplateColors,
  SealPosition,
} from "@/data/certificate-templates";
import {
  getCertificateTemplate,
  getDefaultTitleForType,
  CERTIFICATE_TYPES,
} from "@/data/certificate-templates";
import type { CertificateType } from "@/data/certificate-templates";
import { ensureDocumentFontsReady } from "./font-loader";
import { IDENTITY_MATRIX } from "./schema";

// =============================================================================
// 1.  CertificateConfig — user input data
// =============================================================================

export type SealStyle = "gold" | "silver" | "embossed" | "stamp" | "none";

export interface Signatory {
  id: string;
  name: string;
  title: string;
  organization: string;
}

export interface CertificateConfig {
  certificateType: CertificateType;
  title: string;
  subtitle: string;
  recipientName: string;
  description: string;
  additionalText: string;
  organizationName: string;
  organizationSubtitle: string;
  eventName: string;
  courseName: string;
  dateIssued: string;
  validUntil: string;
  referenceNumber: string;
  signatories: Signatory[];
  showSeal: boolean;
  sealText: string;
  sealStyle: SealStyle;
  logoUrl: string | null;
  templateId: string;
  fontScale: number;
}

export function createDefaultCertificateConfig(): CertificateConfig {
  return {
    certificateType: "achievement",
    title: "Certificate of Achievement",
    subtitle: "This is proudly presented to",
    recipientName: "",
    description: "",
    additionalText: "",
    organizationName: "",
    organizationSubtitle: "",
    eventName: "",
    courseName: "",
    dateIssued: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    validUntil: "",
    referenceNumber: "",
    signatories: [{ id: crypto.randomUUID(), name: "", title: "", organization: "" }],
    showSeal: true,
    sealText: "CERTIFIED",
    sealStyle: "gold",
    logoUrl: null,
    templateId: "classic-gold",
    fontScale: 1.0,
  };
}

// =============================================================================
// 2.  Canvas Constants
// =============================================================================

const W = 3508;
const H = 2480;
const SAFE = 150;

// =============================================================================
// 3.  Helper — create text layers with template fonts
// =============================================================================

function certText(opts: {
  name: string;
  x: number; y: number;
  w: number; h?: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  color: RGBA;
  align?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  letterSpacing?: number;
  lineHeight?: number;
  uppercase?: boolean;
  italic?: boolean;
  tags: string[];
}): TextLayerV2 {
  const layer = createTextLayerV2({
    name: opts.name,
    x: opts.x,
    y: opts.y,
    width: opts.w,
    height: opts.h ?? Math.round(opts.fontSize * 1.8),
    text: opts.text,
    fontSize: opts.fontSize,
    fontFamily: opts.fontFamily,
    fontWeight: opts.fontWeight ?? 400,
    color: opts.color,
    align: opts.align ?? "center",
    tags: opts.tags,
  });
  // Apply additional style overrides
  layer.defaultStyle.letterSpacing = opts.letterSpacing ?? 0;
  layer.defaultStyle.lineHeight = opts.lineHeight ?? 1.4;
  layer.defaultStyle.uppercase = opts.uppercase ?? false;
  layer.defaultStyle.italic = opts.italic ?? false;
  if (opts.verticalAlign) {
    layer.verticalAlign = opts.verticalAlign;
  }
  return layer;
}

function certShape(opts: {
  name: string;
  x: number; y: number;
  w: number; h: number;
  shapeType?: ShapeLayerV2["shapeType"];
  fill?: Paint;
  stroke?: StrokeSpec;
  cornerRadii?: [number, number, number, number];
  tags: string[];
}): ShapeLayerV2 {
  return createShapeLayerV2({
    name: opts.name,
    x: opts.x,
    y: opts.y,
    width: opts.w,
    height: opts.h,
    shapeType: opts.shapeType ?? "rectangle",
    fill: opts.fill,
    stroke: opts.stroke,
    cornerRadii: opts.cornerRadii,
    tags: opts.tags,
  });
}

function centerX(layerW: number): number {
  return Math.round((W - layerW) / 2);
}

// =============================================================================
// 4.  Seal Builder
// =============================================================================

function buildSealLayers(
  cfg: CertificateConfig,
  template: CertificateTemplate,
  sealX: number,
  sealY: number,
): (ShapeLayerV2 | TextLayerV2)[] {
  if (!cfg.showSeal || cfg.sealStyle === "none") return [];

  const layers: (ShapeLayerV2 | TextLayerV2)[] = [];
  const D = 280; // seal diameter

  const sealColors = getSealColors(cfg.sealStyle, template.colors);

  // Outer ring
  const outer = certShape({
    name: "Seal Outer Ring",
    x: sealX, y: sealY,
    w: D, h: D,
    shapeType: "ellipse",
    fill: sealColors.outerFill,
    stroke: sealColors.outerStroke,
    tags: ["seal", "seal-shape", "seal-outer"],
  });
  if (cfg.sealStyle === "stamp") {
    outer.transform.rotation = -8;
  }
  layers.push(outer);

  // Middle ring
  const middleInset = 15;
  const middle = certShape({
    name: "Seal Middle Ring",
    x: sealX + middleInset,
    y: sealY + middleInset,
    w: D - middleInset * 2,
    h: D - middleInset * 2,
    shapeType: "ellipse",
    fill: sealColors.middleFill,
    stroke: sealColors.middleStroke,
    tags: ["seal", "seal-shape", "seal-middle"],
  });
  if (cfg.sealStyle === "stamp") {
    middle.transform.rotation = -8;
  }
  layers.push(middle);

  // Inner circle
  const innerInset = 25;
  const inner = certShape({
    name: "Seal Inner Circle",
    x: sealX + innerInset,
    y: sealY + innerInset,
    w: D - innerInset * 2,
    h: D - innerInset * 2,
    shapeType: "ellipse",
    fill: sealColors.innerFill,
    tags: ["seal", "seal-shape", "seal-inner"],
  });
  if (cfg.sealStyle === "stamp") {
    inner.transform.rotation = -8;
  }
  layers.push(inner);

  // Seal text
  const textSize = Math.max(20, Math.round(D * 0.12));
  const sealTextLayer = certText({
    name: "Seal Text",
    x: sealX + innerInset + 5,
    y: sealY + Math.round(D / 2) - Math.round(textSize * 0.8),
    w: D - innerInset * 2 - 10,
    h: Math.round(textSize * 2.2),
    text: cfg.sealText || "CERTIFIED",
    fontFamily: template.fontPairing.heading,
    fontSize: textSize,
    fontWeight: 700,
    color: sealColors.textColor,
    align: "center",
    verticalAlign: "middle",
    uppercase: true,
    letterSpacing: 3,
    tags: ["seal", "seal-text"],
  });
  if (cfg.sealStyle === "stamp") {
    sealTextLayer.transform.rotation = -8;
  }
  layers.push(sealTextLayer);

  return layers;
}

interface SealColorScheme {
  outerFill: Paint;
  outerStroke?: StrokeSpec;
  middleFill: Paint;
  middleStroke?: StrokeSpec;
  innerFill: Paint;
  textColor: RGBA;
}

function getSealColors(style: SealStyle, colors: CertificateTemplateColors): SealColorScheme {
  switch (style) {
    case "gold":
      return {
        outerFill: {
          kind: "gradient",
          gradientType: "radial",
          stops: [
            { offset: 0, color: hexToRGBA("#d4a843") },
            { offset: 0.5, color: hexToRGBA("#b8860b") },
            { offset: 1, color: hexToRGBA("#d4a843") },
          ],
          transform: IDENTITY_MATRIX,
          spread: "pad",
        } as GradientPaint,
        middleFill: solidPaintHex("#c9982e"),
        innerFill: solidPaintHex("#b8860b"),
        textColor: { r: 255, g: 255, b: 255, a: 1 },
      };
    case "silver":
      return {
        outerFill: {
          kind: "gradient",
          gradientType: "radial",
          stops: [
            { offset: 0, color: hexToRGBA("#c0c0c0") },
            { offset: 0.5, color: hexToRGBA("#808080") },
            { offset: 1, color: hexToRGBA("#c0c0c0") },
          ],
          transform: IDENTITY_MATRIX,
          spread: "pad",
        } as GradientPaint,
        middleFill: solidPaintHex("#a0a0a0"),
        innerFill: solidPaintHex("#808080"),
        textColor: { r: 255, g: 255, b: 255, a: 1 },
      };
    case "embossed":
      return {
        outerFill: solidPaint(hexToRGBA(colors.accent, 0.15)),
        middleFill: solidPaint(hexToRGBA(colors.accent, 0.1)),
        innerFill: solidPaint(hexToRGBA(colors.accent, 0.08)),
        textColor: hexToRGBA(colors.accent),
      };
    case "stamp":
      return {
        outerFill: solidPaint({ r: 0, g: 0, b: 0, a: 0 }),
        outerStroke: {
          paint: solidPaintHex("#c0392b"),
          width: 4,
          align: "center" as const,
          dash: [6, 3],
          cap: "round" as const,
          join: "round" as const,
          miterLimit: 4,
        },
        middleFill: solidPaint({ r: 0, g: 0, b: 0, a: 0 }),
        middleStroke: {
          paint: solidPaintHex("#c0392b"),
          width: 2,
          align: "center" as const,
          dash: [4, 2],
          cap: "round" as const,
          join: "round" as const,
          miterLimit: 4,
        },
        innerFill: solidPaint({ r: 0, g: 0, b: 0, a: 0 }),
        textColor: hexToRGBA("#c0392b"),
      };
    default:
      return {
        outerFill: solidPaintHex("#b8860b"),
        middleFill: solidPaintHex("#c9982e"),
        innerFill: solidPaintHex("#b8860b"),
        textColor: { r: 255, g: 255, b: 255, a: 1 },
      };
  }
}

// =============================================================================
// 5.  Signatory Block Builder
// =============================================================================

function buildSignatoryLayers(
  cfg: CertificateConfig,
  template: CertificateTemplate,
  baseY: number,
): (ShapeLayerV2 | TextLayerV2)[] {
  const layers: (ShapeLayerV2 | TextLayerV2)[] = [];
  const signatories = cfg.signatories.filter((s) => s.name || s.title);
  if (signatories.length === 0) return layers;

  const n = signatories.length;
  const contentW = W - SAFE * 2;
  const blockW = 400;
  const lineW = 350;
  const bodyFont = template.fontPairing.body;
  const textColor = hexToRGBA(template.colors.text);

  for (let i = 0; i < n; i++) {
    const sig = signatories[i];
    // Position: spread evenly across content width
    let cx: number;
    if (n === 1) cx = W / 2;
    else if (n === 2) cx = SAFE + contentW * (i === 0 ? 0.33 : 0.67);
    else cx = SAFE + contentW * ((i + 1) / (n + 1));

    const blockX = Math.round(cx - blockW / 2);
    let curY = baseY;

    // Signature line
    const lineX = Math.round(cx - lineW / 2);
    layers.push(certShape({
      name: `Signature Line ${i + 1}`,
      x: lineX, y: curY,
      w: lineW, h: 2,
      shapeType: "rectangle",
      fill: solidPaint({ ...textColor, a: 0.5 }),
      tags: ["signature-line", "signatory", "decorative"],
    }));
    curY += 20;

    // Signer name
    if (sig.name) {
      layers.push(certText({
        name: `Signatory ${i + 1} Name`,
        x: blockX, y: curY,
        w: blockW,
        text: sig.name,
        fontFamily: bodyFont,
        fontSize: 24,
        fontWeight: 600,
        color: textColor,
        tags: [`signatory-${i}`, "signatory", "name"],
      }));
      curY += 36;
    }

    // Signer title
    if (sig.title) {
      layers.push(certText({
        name: `Signatory ${i + 1} Title`,
        x: blockX, y: curY,
        w: blockW,
        text: sig.title,
        fontFamily: bodyFont,
        fontSize: 20,
        fontWeight: 400,
        color: { ...textColor, a: 0.7 },
        tags: [`signatory-${i}`, "signatory", "title"],
      }));
      curY += 28;
    }

    // Signer organization
    if (sig.organization && sig.organization !== cfg.organizationName) {
      layers.push(certText({
        name: `Signatory ${i + 1} Org`,
        x: blockX, y: curY,
        w: blockW,
        text: sig.organization,
        fontFamily: bodyFont,
        fontSize: 18,
        fontWeight: 400,
        color: { ...textColor, a: 0.5 },
        tags: [`signatory-${i}`, "signatory", "organization"],
      }));
    }
  }

  return layers;
}

// =============================================================================
// 6.  Main Conversion — certificateConfigToDocument
// =============================================================================

export function certificateConfigToDocument(
  cfg: CertificateConfig,
  template?: CertificateTemplate,
): DesignDocumentV2 {
  const tpl = template ?? getCertificateTemplate(cfg.templateId);
  const fs = cfg.fontScale;
  const colors = tpl.colors;
  const fonts = tpl.fontPairing;

  // Create base document
  let doc = createDocumentV2({
    toolId: "certificate-designer",
    name: cfg.title || "Certificate",
    width: W,
    height: H,
    backgroundColor: hexToRGBA(colors.background),
    dpi: 300,
  });

  // --- 1. Background ---
  const bg = certShape({
    name: "Background",
    x: 0, y: 0,
    w: W, h: H,
    fill: solidPaintHex(colors.background),
    tags: ["background", "bg"],
  });
  doc = addLayer(doc, bg);

  // --- 2. SVG Border ---
  if (tpl.svgBorderPath) {
    const border = createImageLayerV2({
      name: "Border Frame",
      x: 0, y: 0,
      width: W, height: H,
      imageRef: tpl.svgBorderPath,
      fit: "stretch",
      tags: ["border", "frame", "decorative"],
    });
    doc = addLayer(doc, border);
  }

  // --- Vertical layout cursor (content stacking) ---
  let curY = Math.round(H * 0.08); // Start 8% from top

  // --- 3. Organization Name ---
  if (cfg.organizationName) {
    const orgW = Math.round(W * 0.6);
    doc = addLayer(doc, certText({
      name: "Organization",
      x: centerX(orgW), y: curY,
      w: orgW,
      text: cfg.organizationName,
      fontFamily: fonts.body,
      fontSize: Math.round(44 * fs),
      fontWeight: 600,
      color: hexToRGBA(colors.primary),
      uppercase: true,
      letterSpacing: 4,
      tags: ["organization", "org-name"],
    }));
    curY += Math.round(70 * fs);
  }

  // --- 4. Title ---
  const titleW = Math.round(W * 0.8);
  const titleText = cfg.title || getDefaultTitleForType(cfg.certificateType);
  doc = addLayer(doc, certText({
    name: "Title",
    x: centerX(titleW), y: curY,
    w: titleW,
    h: Math.round(130 * fs),
    text: titleText,
    fontFamily: fonts.heading,
    fontSize: Math.round(100 * fs),
    fontWeight: 700,
    color: hexToRGBA(colors.primary),
    uppercase: true,
    letterSpacing: 6,
    tags: ["title", "heading", "certificate-title"],
  }));
  curY += Math.round(150 * fs);

  // --- 5. Decorative Divider ---
  if (tpl.layout.borderStyle === "ornate" || tpl.layout.borderStyle === "double-line") {
    const divW = Math.round(W * 0.25);
    doc = addLayer(doc, certShape({
      name: "Divider",
      x: centerX(divW), y: curY,
      w: divW, h: 3,
      fill: solidPaintHex(colors.secondary),
      tags: ["decorative", "ornament", "divider"],
    }));
    curY += 40;
  }

  // --- 6. Subtitle ---
  const subtitleW = Math.round(W * 0.5);
  doc = addLayer(doc, certText({
    name: "Subtitle",
    x: centerX(subtitleW), y: curY,
    w: subtitleW,
    text: cfg.subtitle || "This is proudly presented to",
    fontFamily: fonts.body,
    fontSize: Math.round(38 * fs),
    fontWeight: 300,
    color: { ...hexToRGBA(colors.text), a: 0.7 },
    italic: true,
    tags: ["subtitle", "subheading", "presented-to"],
  }));
  curY += Math.round(70 * fs);

  // --- 7. Recipient Name ---
  const recipientW = Math.round(W * 0.7);
  doc = addLayer(doc, certText({
    name: "Recipient Name",
    x: centerX(recipientW), y: curY,
    w: recipientW,
    h: Math.round(100 * fs),
    text: cfg.recipientName || "Recipient Name",
    fontFamily: fonts.accent,
    fontSize: Math.round(72 * fs),
    fontWeight: 400,
    color: hexToRGBA(colors.primary),
    tags: ["recipient-name", "primary-text", "name"],
  }));
  curY += Math.round(110 * fs);

  // --- 8. Recipient Underline ---
  const underlineW = Math.min(Math.round(W * 0.4), 1400);
  doc = addLayer(doc, certShape({
    name: "Recipient Underline",
    x: centerX(underlineW), y: curY,
    w: underlineW, h: 2,
    fill: solidPaintHex(colors.secondary),
    tags: ["decorative", "underline"],
  }));
  curY += 40;

  // --- 9. Description ---
  if (cfg.description) {
    const descW = Math.round(W * 0.65);
    doc = addLayer(doc, certText({
      name: "Description",
      x: centerX(descW), y: curY,
      w: descW,
      h: Math.round(120 * fs),
      text: cfg.description,
      fontFamily: fonts.body,
      fontSize: Math.round(32 * fs),
      fontWeight: 400,
      color: hexToRGBA(colors.text),
      lineHeight: 1.5,
      tags: ["description", "body-text"],
    }));
    curY += Math.round(140 * fs);
  }

  // --- 10. Additional Text ---
  if (cfg.additionalText) {
    const addW = Math.round(W * 0.6);
    doc = addLayer(doc, certText({
      name: "Additional Text",
      x: centerX(addW), y: curY,
      w: addW,
      h: Math.round(80 * fs),
      text: cfg.additionalText,
      fontFamily: fonts.body,
      fontSize: Math.round(28 * fs),
      fontWeight: 400,
      color: hexToRGBA(colors.text),
      lineHeight: 1.5,
      tags: ["additional-text", "body-text"],
    }));
    curY += Math.round(100 * fs);
  }

  // --- 11. Date Line ---
  const dateW = Math.round(W * 0.4);
  const dateStr = cfg.dateIssued ? `Date: ${cfg.dateIssued}` : "";
  if (dateStr) {
    doc = addLayer(doc, certText({
      name: "Date",
      x: centerX(dateW), y: curY,
      w: dateW,
      text: dateStr,
      fontFamily: fonts.body,
      fontSize: Math.round(26 * fs),
      fontWeight: 400,
      color: hexToRGBA(colors.text),
      tags: ["date", "meta", "date-issued"],
    }));
    curY += Math.round(40 * fs);
  }

  // --- 12. Reference Number ---
  if (cfg.referenceNumber) {
    const refW = Math.round(W * 0.4);
    doc = addLayer(doc, certText({
      name: "Reference Number",
      x: centerX(refW), y: curY,
      w: refW,
      text: `Ref: ${cfg.referenceNumber}`,
      fontFamily: fonts.body,
      fontSize: Math.round(22 * fs),
      fontWeight: 400,
      color: { ...hexToRGBA(colors.text), a: 0.6 },
      tags: ["reference", "meta", "ref-number"],
    }));
    curY += Math.round(35 * fs);
  }

  // --- 13. Signatory Blocks ---
  const sigY = Math.max(curY + 40, Math.round(H * 0.76));
  const sigLayers = buildSignatoryLayers(cfg, tpl, sigY);
  for (const sl of sigLayers) {
    doc = addLayer(doc, sl);
  }

  // --- 14. Seal ---
  if (cfg.showSeal && cfg.sealStyle !== "none") {
    const sealD = 280;
    let sealX: number;
    let sealY: number;

    if (tpl.layout.sealPosition === "bottom-center") {
      sealX = Math.round((W - sealD) / 2);
      sealY = H - SAFE - sealD - 30;
    } else {
      // bottom-right default
      sealX = W - SAFE - sealD - 50;
      sealY = H - SAFE - sealD - 50;
    }

    const sealLayers = buildSealLayers(cfg, tpl, sealX, sealY);
    for (const sl of sealLayers) {
      doc = addLayer(doc, sl);
    }
  }

  // --- 15. Logo ---
  if (cfg.logoUrl) {
    const logoSize = 180;
    doc = addLayer(doc, createImageLayerV2({
      name: "Logo",
      x: SAFE + 30,
      y: SAFE + 20,
      width: logoSize,
      height: logoSize,
      imageRef: cfg.logoUrl,
      fit: "contain",
      tags: ["logo", "branding", "user-uploaded"],
    }));
  }

  return doc;
}

// =============================================================================
// 7.  Sync Helpers
// =============================================================================

/** Update text content of tagged layers without changing positions/styles */
export function syncTextToCertificateDoc(
  doc: DesignDocumentV2,
  cfg: CertificateConfig,
): DesignDocumentV2 {
  let updated = { ...doc, layersById: { ...doc.layersById } };

  const tagTextMap: Record<string, string> = {
    "certificate-title": cfg.title || getDefaultTitleForType(cfg.certificateType),
    "presented-to": cfg.subtitle || "This is proudly presented to",
    "recipient-name": cfg.recipientName || "Recipient Name",
    "description": cfg.description,
    "additional-text": cfg.additionalText,
    "org-name": cfg.organizationName,
    "date-issued": cfg.dateIssued ? `Date: ${cfg.dateIssued}` : "",
    "ref-number": cfg.referenceNumber ? `Ref: ${cfg.referenceNumber}` : "",
    "seal-text": cfg.sealText || "CERTIFIED",
  };

  for (const [tag, text] of Object.entries(tagTextMap)) {
    const layer = Object.values(updated.layersById).find(
      (l) => l.type === "text" && l.tags.includes(tag),
    ) as TextLayerV2 | undefined;
    if (layer && text !== undefined) {
      updated.layersById[layer.id] = { ...layer, text };
    }
  }

  // Sync signatory names
  for (let i = 0; i < cfg.signatories.length; i++) {
    const sig = cfg.signatories[i];
    const nameLayer = Object.values(updated.layersById).find(
      (l) => l.type === "text" && l.tags.includes(`signatory-${i}`) && l.tags.includes("name"),
    ) as TextLayerV2 | undefined;
    if (nameLayer && sig.name) {
      updated.layersById[nameLayer.id] = { ...nameLayer, text: sig.name };
    }
    const titleLayer = Object.values(updated.layersById).find(
      (l) => l.type === "text" && l.tags.includes(`signatory-${i}`) && l.tags.includes("title"),
    ) as TextLayerV2 | undefined;
    if (titleLayer && sig.title) {
      updated.layersById[titleLayer.id] = { ...titleLayer, text: sig.title };
    }
  }

  updated.meta = { ...updated.meta, updatedAt: Date.now() };
  return updated;
}

/** Update colors across all layers to match new template colors */
export function syncColorsToCertificateDoc(
  doc: DesignDocumentV2,
  colors: CertificateTemplateColors,
): DesignDocumentV2 {
  let updated = { ...doc, layersById: { ...doc.layersById } };

  for (const [id, layer] of Object.entries(updated.layersById)) {
    if (layer.tags.includes("background") || layer.tags.includes("bg")) {
      if (layer.type === "shape") {
        const shape = { ...layer, fills: [solidPaintHex(colors.background)] } as ShapeLayerV2;
        updated.layersById[id] = shape;
      }
    } else if (layer.type === "text") {
      const textLayer = layer as TextLayerV2;
      if (textLayer.tags.includes("title") || textLayer.tags.includes("recipient-name") || textLayer.tags.includes("org-name")) {
        updated.layersById[id] = {
          ...textLayer,
          defaultStyle: { ...textLayer.defaultStyle, fill: solidPaintHex(colors.primary) },
        };
      } else if (textLayer.tags.includes("body-text") || textLayer.tags.includes("meta") || textLayer.tags.includes("signatory")) {
        updated.layersById[id] = {
          ...textLayer,
          defaultStyle: { ...textLayer.defaultStyle, fill: solidPaintHex(colors.text) },
        };
      } else if (textLayer.tags.includes("subtitle")) {
        updated.layersById[id] = {
          ...textLayer,
          defaultStyle: { ...textLayer.defaultStyle, fill: solidPaint({ ...hexToRGBA(colors.text), a: 0.7 }) },
        };
      }
    } else if (layer.type === "shape" && (layer.tags.includes("divider") || layer.tags.includes("underline"))) {
      updated.layersById[id] = { ...layer, fills: [solidPaintHex(colors.secondary)] } as ShapeLayerV2;
    }
  }

  updated.meta = { ...updated.meta, updatedAt: Date.now() };
  return updated;
}

/** Complete regeneration when user switches template */
export async function regenerateCertificateFromTemplate(
  cfg: CertificateConfig,
  template: CertificateTemplate,
): Promise<DesignDocumentV2> {
  return certificateConfigToDocumentAsync(cfg, template);
}

// =============================================================================
// 8.  Async Wrapper (Font Loading)
// =============================================================================

export async function certificateConfigToDocumentAsync(
  cfg: CertificateConfig,
  template?: CertificateTemplate,
): Promise<DesignDocumentV2> {
  let doc = certificateConfigToDocument(cfg, template);

  // Load SVG border image and attach it to the image layer for canvas rendering
  const tpl = template ?? getCertificateTemplate(cfg.templateId);
  if (tpl.svgBorderPath) {
    const borderLayer = Object.values(doc.layersById).find(
      (l) => l.type === "image" && l.tags.includes("border"),
    );
    if (borderLayer) {
      try {
        const img = await loadImageElement(tpl.svgBorderPath);
        doc = updateLayer(doc, borderLayer.id, {
          _imageElement: img,
        } as Partial<LayerV2>);
      } catch (err) {
        console.warn("Failed to load SVG border:", err);
      }
    }
  }

  await ensureDocumentFontsReady(doc);
  return doc;
}

// ---------------------------------------------------------------------------
// Image loader helper
// ---------------------------------------------------------------------------

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// =============================================================================
// 9.  Metadata Extraction from Document (for bidirectional sync)
// =============================================================================

export function extractMetadataFromDoc(doc: DesignDocumentV2): Partial<CertificateConfig> {
  const meta: Partial<CertificateConfig> = {};
  const layers = Object.values(doc.layersById);

  for (const layer of layers) {
    if (layer.type !== "text") continue;
    const tl = layer as TextLayerV2;

    if (tl.tags.includes("certificate-title")) {
      meta.title = tl.text;
    } else if (tl.tags.includes("recipient-name")) {
      meta.recipientName = tl.text;
    } else if (tl.tags.includes("presented-to")) {
      meta.subtitle = tl.text;
    } else if (tl.tags.includes("description")) {
      meta.description = tl.text;
    } else if (tl.tags.includes("additional-text")) {
      meta.additionalText = tl.text;
    } else if (tl.tags.includes("org-name")) {
      meta.organizationName = tl.text;
    } else if (tl.tags.includes("date-issued")) {
      meta.dateIssued = tl.text.replace(/^Date:\s*/i, "");
    } else if (tl.tags.includes("ref-number")) {
      meta.referenceNumber = tl.text.replace(/^Ref:\s*/i, "");
    } else if (tl.tags.includes("seal-text")) {
      meta.sealText = tl.text;
    }
  }

  return meta;
}
