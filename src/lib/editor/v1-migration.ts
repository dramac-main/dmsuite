// =============================================================================
// DMSuite — v1 → v2 Layer System Migration Bridge
// Converts DesignDocument (canvas-layers.ts) → DesignDocumentV2 (schema.ts)
// =============================================================================

import type {
  DesignDocument,
  Layer,
  TextLayer,
  ShapeLayer,
  ImageLayer,
  CtaLayer,
  DecorativeLayer,
  GroupLayer,
} from "@/lib/canvas-layers";
import type { FontStyle } from "@/lib/canvas-utils";

import {
  type DesignDocumentV2,
  type LayerV2,
  type LayerId,
  type TextLayerV2,
  type ShapeLayerV2,
  type ImageLayerV2,
  type GroupLayerV2,
  type Paint,
  type GradientPaint,
  type StrokeSpec,
  type RGBA,
  createDocumentV2,
  addLayer,
  updateLayer,
  defaultTransform,
  createTextLayerV2,
  createShapeLayerV2,
  createImageLayerV2,
  createGroupLayerV2,
  hexToRGBA,
  solidPaintHex,
  defaultStroke,
  rgbaToHex,
  IDENTITY_MATRIX,
} from "@/lib/editor/schema";

// ---------------------------------------------------------------------------
// 1. Font Style Mapping
// ---------------------------------------------------------------------------

const FONT_STYLE_MAP: Record<FontStyle, string> = {
  modern: "Inter",
  classic: "Georgia",
  bold: "Impact",
  elegant: "Playfair Display",
  compact: "Inter",
};

export function mapFontFamily(fontStyle: FontStyle): string {
  return FONT_STYLE_MAP[fontStyle] ?? FONT_STYLE_MAP.modern;
}

// ---------------------------------------------------------------------------
// 2. Color + Gradient Conversion
// ---------------------------------------------------------------------------

function solidPaintHexAlpha(hex: string, alpha = 1): Paint {
  const paint = solidPaintHex(hex);
  if (paint.kind === "solid" && alpha < 1) {
    paint.color = { ...paint.color, a: alpha };
  }
  return paint;
}

function gradientToPaint(gradient: NonNullable<ShapeLayer["gradient"]>): GradientPaint {
  return {
    kind: "gradient",
    gradientType: gradient.type === "radial" ? "radial" : "linear",
    stops: gradient.stops.map((s) => ({
      offset: s.offset,
      color: hexToRGBA(s.color),
    })),
    transform: IDENTITY_MATRIX,
    spread: "pad",
  };
}

// ---------------------------------------------------------------------------
// 3. Align Mapping
// ---------------------------------------------------------------------------

export function mapAlign(align?: CanvasTextAlign): "left" | "center" | "right" | "justify" {
  switch (align) {
    case "center":
      return "center";
    case "right":
    case "end":
      return "right";
    default:
      return "left";
  }
}

// ---------------------------------------------------------------------------
// 4. Layer Converters
// ---------------------------------------------------------------------------

function applyCommon<T extends LayerV2>(layer: T, v1: Layer): T {
  return {
    ...layer,
    transform: {
      ...defaultTransform(v1.x, v1.y, v1.width, v1.height),
      rotation: v1.rotation,
    },
    opacity: v1.opacity,
    visible: v1.visible,
    locked: v1.locked,
  } as T;
}

export function convertTextLayer(layer: TextLayer, fallbackFontStyle: FontStyle): TextLayerV2 {
  const base = createTextLayerV2({
    name: layer.name || "Text",
    text: layer.text,
    fontFamily: mapFontFamily(layer.fontStyle ?? fallbackFontStyle),
    fontSize: layer.fontSize,
    fontWeight: layer.fontWeight,
    color: hexToRGBA(layer.color),
    align: mapAlign(layer.align),
    tags: ["text"],
  });

  const updated: TextLayerV2 = {
    ...base,
    tags: layer.shadow ? ["text", "shadow"] : ["text"],
    defaultStyle: {
      ...base.defaultStyle,
      fontWeight: layer.fontWeight,
      letterSpacing: layer.letterSpacing ?? 0,
      lineHeight: layer.lineHeight ?? 1.2,
      uppercase: layer.uppercase ?? false,
      fill: solidPaintHex(layer.color),
    },
    paragraphs: [{ align: mapAlign(layer.align), indent: 0, spaceBefore: 0, spaceAfter: 0 }],
  };

  return applyCommon(updated, layer);
}

export function convertShapeLayer(layer: ShapeLayer): ShapeLayerV2 {
  const shapeMap: Record<ShapeLayer["shape"], ShapeLayerV2["shapeType"]> = {
    rectangle: "rectangle",
    circle: "ellipse",
    ellipse: "ellipse",
    line: "line",
    triangle: "triangle",
    polygon: "polygon",
  };

  const fillPaint: Paint = layer.gradient
    ? gradientToPaint(layer.gradient)
    : solidPaintHexAlpha(layer.fillColor, layer.fillOpacity ?? 1);

  const stroke: StrokeSpec | undefined =
    layer.strokeWidth > 0 && layer.strokeColor
      ? defaultStroke(hexToRGBA(layer.strokeColor), layer.strokeWidth)
      : undefined;

  const base = createShapeLayerV2({
    name: layer.name || "Shape",
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    shapeType: shapeMap[layer.shape] ?? "rectangle",
    fill: fillPaint,
    stroke,
    cornerRadii: layer.cornerRadius > 0
      ? [layer.cornerRadius, layer.cornerRadius, layer.cornerRadius, layer.cornerRadius]
      : [0, 0, 0, 0],
    tags: ["shape"],
  });

  return applyCommon(base, layer);
}

export function convertImageLayer(layer: ImageLayer): ImageLayerV2 {
  const base = createImageLayerV2({
    name: layer.name || "Image",
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    imageRef: layer.src,
    fit: layer.fit === "stretch" ? "stretch" : layer.fit,
    tags: ["image"],
  });

  const updated: ImageLayerV2 = {
    ...base,
    _imageElement: layer.imageElement,
    focalPoint: { x: layer.focalX ?? 0.5, y: layer.focalY ?? 0.5 },
    cornerRadius: layer.clipRadius ?? 0,
  };

  return applyCommon(updated, layer);
}

export function convertCtaLayer(layer: CtaLayer, fallbackFontStyle: FontStyle): [ShapeLayerV2, TextLayerV2] {
  const bgShape = createShapeLayerV2({
    name: `${layer.name || "CTA"} — BG`,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    shapeType: "rectangle",
    fill: solidPaintHex(layer.bgColor),
    cornerRadii: [layer.cornerRadius, layer.cornerRadius, layer.cornerRadius, layer.cornerRadius],
    tags: ["cta", "cta-bg", "button"],
  });

  const textLayer = createTextLayerV2({
    name: `${layer.name || "CTA"} — Text`,
    x: layer.x + layer.paddingX,
    y: layer.y + layer.paddingY,
    width: layer.width - layer.paddingX * 2,
    height: layer.height - layer.paddingY * 2,
    text: layer.text,
    fontFamily: mapFontFamily(layer.fontStyle ?? fallbackFontStyle),
    fontSize: layer.fontSize,
    fontWeight: 700,
    color: hexToRGBA(layer.textColor),
    align: "center",
    tags: ["cta", "cta-text", "button"],
  });

  const bgUpdated = applyCommon(
    { ...bgShape, opacity: layer.glassMorphism ? 0.7 : layer.opacity },
    layer
  );
  const textUpdated = applyCommon(textLayer, layer);

  return [bgUpdated, textUpdated];
}

export function convertDecorativeLayer(layer: DecorativeLayer): ShapeLayerV2 {
  const base = createShapeLayerV2({
    name: layer.name || `Deco — ${layer.decorationType}`,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    shapeType: "rectangle",
    fill: solidPaintHex(layer.color),
    tags: ["decorative", layer.decorationType],
  });
  return applyCommon(base, layer);
}

export function convertGroupLayer(layer: GroupLayer): GroupLayerV2 {
  const base = createGroupLayerV2({
    name: layer.name || "Group",
    children: [],
  });
  const updated: GroupLayerV2 = {
    ...base,
    tags: ["group"],
  };
  return applyCommon(updated, layer);
}

// ---------------------------------------------------------------------------
// 5. Main Migration Function
// ---------------------------------------------------------------------------

export interface MigrationOptions {
  /** Tool ID for the document (e.g., "poster-flyer", "banner-ad") */
  toolId: string;
  /** DPI for print-ready output */
  dpi?: number;
  /** Bleed margin in mm */
  bleedMm?: number;
  /** Safe area margin in mm */
  safeAreaMm?: number;
  /** Default font style for layers that don't specify one */
  fontStyle?: FontStyle;
  /** Additional tags to add to all layers */
  globalTags?: string[];
  /** Custom background paints (overrides doc backgroundColor) */
  backgroundFills?: Paint[];
}

/**
 * Convert a v1 DesignDocument to a v2 DesignDocumentV2.
 */
export function migrateDocumentV1toV2(
  v1Doc: DesignDocument,
  options: MigrationOptions,
): DesignDocumentV2 {
  const {
    toolId,
    dpi = 150,
    bleedMm,
    safeAreaMm,
    fontStyle = v1Doc.meta?.fontStyle || "modern",
    globalTags = [],
    backgroundFills,
  } = options;

  let doc = createDocumentV2({
    toolId,
    name: v1Doc.name || "Untitled",
    width: v1Doc.width,
    height: v1Doc.height,
    backgroundColor: hexToRGBA(v1Doc.backgroundColor),
    dpi,
    bleedMm,
    safeAreaMm,
  });

  if (backgroundFills) {
    doc = updateLayer(doc, doc.rootFrameId, { fills: backgroundFills } as Partial<LayerV2>);
  }

  doc = {
    ...doc,
    meta: {
      ...doc.meta,
      toolConfig: {
        v1DocId: v1Doc.id,
        v1Meta: v1Doc.meta,
        fontStyle,
      },
    },
  };

  const orderedIds = [...v1Doc.layerOrder].reverse();
  const v1LayerMap = new Map(v1Doc.layers.map((l) => [l.id, l]));
  const idMap = new Map<string, LayerId>();

  for (const v1Id of orderedIds) {
    const layer = v1LayerMap.get(v1Id);
    if (!layer) continue;

    const extraTags = [...globalTags];

    switch (layer.type) {
      case "text": {
        const v2Layer = convertTextLayer(layer as TextLayer, fontStyle);
        v2Layer.tags = [...v2Layer.tags, ...extraTags];
        doc = addLayer(doc, v2Layer, doc.rootFrameId);
        idMap.set(v1Id, v2Layer.id);
        break;
      }

      case "shape": {
        const v2Layer = convertShapeLayer(layer as ShapeLayer);
        v2Layer.tags = [...v2Layer.tags, ...extraTags];
        doc = addLayer(doc, v2Layer, doc.rootFrameId);
        idMap.set(v1Id, v2Layer.id);
        break;
      }

      case "image": {
        const v2Layer = convertImageLayer(layer as ImageLayer);
        v2Layer.tags = [...v2Layer.tags, ...extraTags];
        doc = addLayer(doc, v2Layer, doc.rootFrameId);
        idMap.set(v1Id, v2Layer.id);
        break;
      }

      case "cta": {
        const [bgShape, ctaText] = convertCtaLayer(layer as CtaLayer, fontStyle);
        bgShape.tags = [...bgShape.tags, ...extraTags];
        ctaText.tags = [...ctaText.tags, ...extraTags];
        doc = addLayer(doc, bgShape, doc.rootFrameId);
        doc = addLayer(doc, ctaText, doc.rootFrameId);
        idMap.set(v1Id, ctaText.id);
        break;
      }

      case "decorative": {
        const v2Layer = convertDecorativeLayer(layer as DecorativeLayer);
        v2Layer.tags = [...v2Layer.tags, ...extraTags];
        doc = addLayer(doc, v2Layer, doc.rootFrameId);
        idMap.set(v1Id, v2Layer.id);
        break;
      }

      case "group": {
        const v2Group = convertGroupLayer(layer as GroupLayer);
        v2Group.tags = [...v2Group.tags, ...extraTags];
        doc = addLayer(doc, v2Group, doc.rootFrameId);
        idMap.set(v1Id, v2Group.id);
        break;
      }
    }
  }

  const v2SelectedIds: LayerId[] = [];
  for (const v1SelId of v1Doc.selectedLayers) {
    const v2Id = idMap.get(v1SelId);
    if (v2Id) v2SelectedIds.push(v2Id);
  }
  doc = {
    ...doc,
    selection: { ...doc.selection, ids: v2SelectedIds },
  };

  return doc;
}

// ---------------------------------------------------------------------------
// 6. Reverse Migration: v2 → v1 (sync-back for sidebar panels)
// ---------------------------------------------------------------------------

export function extractTextFromV2(doc: DesignDocumentV2): Map<string, string> {
  const result = new Map<string, string>();
  for (const layer of Object.values(doc.layersById)) {
    if (layer.type === "text") {
      const textLayer = layer as TextLayerV2;
      for (const tag of textLayer.tags) {
        result.set(tag, textLayer.text);
      }
    }
  }
  return result;
}

export function extractColorsFromV2(doc: DesignDocumentV2): string[] {
  const colors: string[] = [];
  for (const layer of Object.values(doc.layersById)) {
    const fills: Paint[] | undefined =
      layer.type === "shape" ? (layer as ShapeLayerV2).fills :
      layer.type === "image" ? (layer as ImageLayerV2).fills :
      layer.type === "frame" ? (layer as { fills: Paint[] }).fills :
      layer.type === "path" ? (layer as { fills: Paint[] }).fills :
      layer.type === "boolean-group" ? (layer as { fills: Paint[] }).fills :
      undefined;

    if (!fills) continue;
    for (const paint of fills) {
      if (paint.kind === "solid") {
        const hex = rgbaToHex(paint.color as RGBA);
        if (!colors.includes(hex)) colors.push(hex);
      }
    }
  }
  return colors;
}

// ---------------------------------------------------------------------------
// 7. Utility: Text layer lookup by tag
// ---------------------------------------------------------------------------

export function getTextLayersByTag(
  doc: DesignDocumentV2,
): Map<string, { id: LayerId; text: string; tags: string[] }> {
  const result = new Map<string, { id: LayerId; text: string; tags: string[] }>();
  for (const layer of Object.values(doc.layersById)) {
    if (layer.type === "text") {
      const t = layer as TextLayerV2;
      for (const tag of t.tags) {
        result.set(tag, { id: t.id, text: t.text, tags: t.tags });
      }
    }
  }
  return result;
}
