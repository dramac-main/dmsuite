/*  ═══════════════════════════════════════════════════════════════════════════
 *  Chiko AI Manifest — Certificate Designer (Canvas-Aware)
 *  22 actions across 8 categories. All canvas mutations find layers by tag.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import {
  useCertificateEditor,
  type CertificateConfig,
  type SealStyle,
  CERTIFICATE_TYPES,
  getDefaultTitleForType,
} from "@/stores/certificate-editor";
import { useEditorStore } from "@/stores/editor";
import {
  getCertificateTemplate,
  CERTIFICATE_TEMPLATES,
  type CertificateTemplateColors,
} from "@/data/certificate-templates";
import {
  certificateConfigToDocument,
  syncTextToCertificateDoc,
  syncColorsToCertificateDoc,
} from "@/lib/editor/certificate-adapter";
import {
  createTextLayerV2,
  createShapeLayerV2,
  createImageLayerV2,
  addLayer,
  getLayerOrder,
  solidPaintHex,
  hexToRGBA,
  defaultTransform,
  type DesignDocumentV2,
  type LayerV2,
  type TextLayerV2,
  type ShapeLayerV2,
  type FrameLayerV2,
} from "@/lib/editor/schema";
import { withActivityLogging } from "@/stores/activity-log";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Find the first layer whose tags include the target tag */
function findByTag(doc: DesignDocumentV2, tag: string): LayerV2 | undefined {
  return Object.values(doc.layersById).find((l) => l.tags?.includes(tag));
}

/** Find all layers whose tags include the target tag */
function findAllByTag(doc: DesignDocumentV2, tag: string): LayerV2[] {
  return Object.values(doc.layersById).filter((l) => l.tags?.includes(tag));
}

/** Update a single layer in the document, return new doc */
function patchLayer(doc: DesignDocumentV2, layerId: string, patch: Partial<LayerV2>): DesignDocumentV2 {
  const layer = doc.layersById[layerId];
  if (!layer) return doc;
  return {
    ...doc,
    layersById: {
      ...doc.layersById,
      [layerId]: { ...layer, ...patch } as LayerV2,
    },
  };
}

/** Update layer transform position/size */
function moveLayerTransform(
  doc: DesignDocumentV2,
  layerId: string,
  pos?: { x?: number; y?: number },
  size?: { w?: number; h?: number },
): DesignDocumentV2 {
  const layer = doc.layersById[layerId];
  if (!layer) return doc;
  const t = { ...layer.transform };
  if (pos) {
    t.position = {
      x: pos.x ?? t.position.x,
      y: pos.y ?? t.position.y,
    };
  }
  if (size) {
    t.size = {
      x: size.w ?? t.size.x,
      y: size.h ?? t.size.y,
    };
  }
  return patchLayer(doc, layerId, { transform: t } as Partial<LayerV2>);
}

/** Push doc to both stores */
function pushDoc(doc: DesignDocumentV2) {
  useCertificateEditor.getState().setDocumentSnapshot(doc);
  useEditorStore.getState().setDoc(doc);
}

function ok(message: string, state?: Record<string, unknown>): ChikoActionResult {
  return { success: true, message, newState: state };
}

function fail(message: string): ChikoActionResult {
  return { success: false, message };
}

function readState(): Record<string, unknown> {
  const s = useCertificateEditor.getState();
  return {
    certificateType: s.meta.certificateType,
    title: s.meta.title,
    subtitle: s.meta.subtitle,
    recipientName: s.meta.recipientName,
    description: s.meta.description,
    additionalText: s.meta.additionalText,
    organizationName: s.meta.organizationName,
    organizationSubtitle: s.meta.organizationSubtitle,
    eventName: s.meta.eventName,
    courseName: s.meta.courseName,
    dateIssued: s.meta.dateIssued,
    validUntil: s.meta.validUntil,
    referenceNumber: s.meta.referenceNumber,
    signatories: s.meta.signatories,
    showSeal: s.meta.showSeal,
    sealText: s.meta.sealText,
    sealStyle: s.meta.sealStyle,
    fontScale: s.meta.fontScale,
    templateId: s.selectedTemplateId,
    hasDocument: !!s.documentSnapshot,
    fontsReady: s.fontsReady,
    layerCount: s.documentSnapshot
      ? Object.keys(s.documentSnapshot.layersById).length
      : 0,
  };
}

function validate(): { issues: string[]; ready: boolean } {
  const m = useCertificateEditor.getState().meta;
  const issues: string[] = [];
  if (!m.recipientName) issues.push("Recipient name is required");
  if (!m.title) issues.push("Certificate title is required");
  if (!m.organizationName) issues.push("Organization name is recommended");
  if (m.signatories.every((s) => !s.name)) issues.push("At least one signatory name is recommended");
  return { issues, ready: issues.length === 0 };
}

// ── Manifest Factory ────────────────────────────────────────────────────────

interface ManifestOptions {
  store: typeof useCertificateEditor;
}

export function createCertificateManifest(options?: ManifestOptions): ChikoActionManifest {
  const store = options?.store ?? useCertificateEditor;

  const baseManifest: ChikoActionManifest = {
    toolId: "certificate",
    toolName: "Certificate Designer",
    actions: [
      // ─── Content ──────────────────────────────────────────────────────
      {
        name: "updateContent",
        description: "Update certificate text fields (title, subtitle, recipient, description, additional text)",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            recipientName: { type: "string" },
            description: { type: "string" },
            additionalText: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "updateOrganization",
        description: "Update organization details (name, subtitle, event, course)",
        parameters: {
          type: "object",
          properties: {
            organizationName: { type: "string" },
            organizationSubtitle: { type: "string" },
            eventName: { type: "string" },
            courseName: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "updateEvent",
        description: "Update event or course name on the certificate",
        parameters: {
          type: "object",
          properties: {
            eventName: { type: "string" },
            courseName: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "updateDates",
        description: "Update date issued, valid-until, and reference number",
        parameters: {
          type: "object",
          properties: {
            dateIssued: { type: "string" },
            validUntil: { type: "string" },
            referenceNumber: { type: "string" },
          },
        },
        category: "Content",
      },
      {
        name: "setCertificateType",
        description: "Change the certificate type (achievement, completion, participation, etc.)",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: CERTIFICATE_TYPES.map((t) => t.id),
            },
          },
          required: ["type"],
        },
        category: "Content",
      },

      // ─── Canvas ───────────────────────────────────────────────────────
      {
        name: "addTextLayer",
        description: "Add a new text layer to the certificate canvas",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
            fontSize: { type: "number" },
            fontFamily: { type: "string" },
            color: { type: "string", description: "Hex color" },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["text"],
        },
        category: "Canvas",
      },
      {
        name: "addShapeLayer",
        description: "Add a shape (rectangle, ellipse, line) to the canvas",
        parameters: {
          type: "object",
          properties: {
            shapeType: { type: "string", enum: ["rectangle", "ellipse", "line", "star"] },
            x: { type: "number" },
            y: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
            fill: { type: "string", description: "Hex color" },
            tags: { type: "array", items: { type: "string" } },
          },
        },
        category: "Canvas",
      },
      {
        name: "addImageLayer",
        description: "Add an image layer to the canvas",
        parameters: {
          type: "object",
          properties: {
            imageRef: { type: "string", description: "URL or data URI" },
            x: { type: "number" },
            y: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["imageRef"],
        },
        category: "Canvas",
      },
      {
        name: "updateLayer",
        description: "Update properties of an existing layer by tag or ID",
        parameters: {
          type: "object",
          properties: {
            tag: { type: "string", description: "Find layer by tag (preferred)" },
            layerId: { type: "string", description: "Layer ID (fallback)" },
            text: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
            width: { type: "number" },
            height: { type: "number" },
            fontSize: { type: "number" },
            fontFamily: { type: "string" },
            color: { type: "string", description: "Hex fill color" },
            opacity: { type: "number", description: "0-1" },
            visible: { type: "boolean" },
          },
        },
        category: "Canvas",
      },
      {
        name: "removeLayer",
        description: "Remove a layer by tag or ID",
        parameters: {
          type: "object",
          properties: {
            tag: { type: "string" },
            layerId: { type: "string" },
          },
        },
        category: "Canvas",
      },
      {
        name: "moveLayer",
        description: "Move a layer to a new position",
        parameters: {
          type: "object",
          properties: {
            tag: { type: "string" },
            layerId: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
          },
        },
        category: "Canvas",
      },
      {
        name: "reorderLayer",
        description: "Move a layer forward or backward in the stack",
        parameters: {
          type: "object",
          properties: {
            tag: { type: "string" },
            layerId: { type: "string" },
            direction: { type: "string", enum: ["forward", "backward", "toFront", "toBack"] },
          },
          required: ["direction"],
        },
        category: "Canvas",
      },
      {
        name: "duplicateLayer",
        description: "Duplicate a layer with an offset",
        parameters: {
          type: "object",
          properties: {
            tag: { type: "string" },
            layerId: { type: "string" },
            offsetX: { type: "number", description: "Default 20" },
            offsetY: { type: "number", description: "Default 20" },
          },
        },
        category: "Canvas",
      },

      // ─── Style ────────────────────────────────────────────────────────
      {
        name: "changeTemplate",
        description: "Switch to a different certificate template",
        parameters: {
          type: "object",
          properties: {
            templateId: {
              type: "string",
              enum: CERTIFICATE_TEMPLATES.map((t) => t.id),
            },
          },
          required: ["templateId"],
        },
        category: "Style",
      },
      {
        name: "updateColors",
        description: "Update certificate colors (background, primary, secondary, text, accent)",
        parameters: {
          type: "object",
          properties: {
            background: { type: "string" },
            primary: { type: "string" },
            secondary: { type: "string" },
            text: { type: "string" },
            accent: { type: "string" },
          },
        },
        category: "Style",
      },
      {
        name: "updateFonts",
        description: "Update font families for heading, body, or accent text",
        parameters: {
          type: "object",
          properties: {
            headingFont: { type: "string" },
            bodyFont: { type: "string" },
            accentFont: { type: "string" },
          },
        },
        category: "Style",
      },

      // ─── Seal ─────────────────────────────────────────────────────────
      {
        name: "updateSeal",
        description: "Update seal visibility, text, and style",
        parameters: {
          type: "object",
          properties: {
            showSeal: { type: "boolean" },
            sealText: { type: "string" },
            sealStyle: { type: "string", enum: ["gold", "silver", "embossed", "stamp", "none"] },
          },
        },
        category: "Seal",
      },

      // ─── AI ───────────────────────────────────────────────────────────
      {
        name: "generateDesign",
        description: "Generate a new certificate design using AI based on a description",
        parameters: {
          type: "object",
          properties: {
            description: { type: "string", description: "What the certificate should look like" },
          },
          required: ["description"],
        },
        category: "AI",
      },
      {
        name: "reviseDesign",
        description: "Apply an AI revision to the current certificate design",
        parameters: {
          type: "object",
          properties: {
            instruction: { type: "string", description: "What to change about the design" },
          },
          required: ["instruction"],
        },
        category: "AI",
      },

      // ─── Export ────────────────────────────────────────────────────────
      {
        name: "exportDocument",
        description: "Export the certificate as PNG or PDF",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["png", "pdf"] },
            quality: { type: "string", enum: ["standard", "high", "print"] },
          },
        },
        category: "Export",
      },
      {
        name: "validateBeforeExport",
        description: "Check if the certificate is ready for export (all required fields filled)",
        parameters: {},
        category: "Export",
      },

      // ─── Read ──────────────────────────────────────────────────────────
      {
        name: "readCurrentState",
        description: "Read the current certificate metadata and canvas state",
        parameters: {},
        category: "Read",
      },

      // ─── System ────────────────────────────────────────────────────────
      {
        name: "resetAll",
        description: "Reset the certificate to defaults, clearing all content",
        parameters: {},
        category: "System",
        destructive: true,
      },
    ],

    getState: readState,

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
        const doc = useEditorStore.getState().doc;
        const meta = store.getState().meta;

        switch (actionName) {
          // ── Content ──
          case "updateContent": {
            const patch: Partial<CertificateConfig> = {};
            if (params.title !== undefined) patch.title = params.title as string;
            if (params.subtitle !== undefined) patch.subtitle = params.subtitle as string;
            if (params.recipientName !== undefined) patch.recipientName = params.recipientName as string;
            if (params.description !== undefined) patch.description = params.description as string;
            if (params.additionalText !== undefined) patch.additionalText = params.additionalText as string;
            store.getState().setMeta(patch);
            if (doc) {
              const synced = syncTextToCertificateDoc(doc, { ...meta, ...patch });
              pushDoc(synced);
            }
            return ok("Certificate content updated", patch);
          }

          case "updateOrganization": {
            const patch: Partial<CertificateConfig> = {};
            if (params.organizationName !== undefined) patch.organizationName = params.organizationName as string;
            if (params.organizationSubtitle !== undefined) patch.organizationSubtitle = params.organizationSubtitle as string;
            if (params.eventName !== undefined) patch.eventName = params.eventName as string;
            if (params.courseName !== undefined) patch.courseName = params.courseName as string;
            store.getState().setMeta(patch);
            if (doc) {
              const synced = syncTextToCertificateDoc(doc, { ...meta, ...patch });
              pushDoc(synced);
            }
            return ok("Organization details updated", patch);
          }

          case "updateEvent": {
            const patch: Partial<CertificateConfig> = {};
            if (params.eventName !== undefined) patch.eventName = params.eventName as string;
            if (params.courseName !== undefined) patch.courseName = params.courseName as string;
            store.getState().setMeta(patch);
            return ok("Event details updated", patch);
          }

          case "updateDates": {
            const patch: Partial<CertificateConfig> = {};
            if (params.dateIssued !== undefined) patch.dateIssued = params.dateIssued as string;
            if (params.validUntil !== undefined) patch.validUntil = params.validUntil as string;
            if (params.referenceNumber !== undefined) patch.referenceNumber = params.referenceNumber as string;
            store.getState().setMeta(patch);
            if (doc) {
              const synced = syncTextToCertificateDoc(doc, { ...meta, ...patch });
              pushDoc(synced);
            }
            return ok("Dates updated", patch);
          }

          case "setCertificateType": {
            const typeId = params.type as string;
            const valid = CERTIFICATE_TYPES.find((t) => t.id === typeId);
            if (!valid) return fail(`Unknown certificate type: ${typeId}`);
            store.getState().setCertificateType(typeId as CertificateConfig["certificateType"]);
            const newTitle = getDefaultTitleForType(typeId as CertificateConfig["certificateType"]);
            if (doc) {
              const synced = syncTextToCertificateDoc(doc, { ...meta, certificateType: typeId as CertificateConfig["certificateType"], title: newTitle });
              pushDoc(synced);
            }
            return ok(`Certificate type changed to "${valid.label}"`, { type: typeId, title: newTitle });
          }

          // ── Canvas ──
          case "addTextLayer": {
            if (!doc) return fail("No document loaded");
            const layer = createTextLayerV2({
              text: (params.text as string) || "New Text",
              x: (params.x as number) ?? 150,
              y: (params.y as number) ?? 150,
              fontSize: (params.fontSize as number) ?? 36,
              fontFamily: (params.fontFamily as string) ?? "Inter",
              color: hexToRGBA((params.color as string) ?? "#1a1a1a"),
              tags: (params.tags as string[]) ?? ["user-added"],
            });
            const newDoc = addLayer(doc, layer);
            pushDoc(newDoc);
            return ok("Text layer added", { layerId: layer.id });
          }

          case "addShapeLayer": {
            if (!doc) return fail("No document loaded");
            const layer = createShapeLayerV2({
              shapeType: (params.shapeType as "rectangle" | "ellipse" | "line" | "star") ?? "rectangle",
              x: (params.x as number) ?? 150,
              y: (params.y as number) ?? 150,
              width: (params.width as number) ?? 200,
              height: (params.height as number) ?? 200,
              fill: solidPaintHex((params.fill as string) ?? "#cccccc"),
              tags: (params.tags as string[]) ?? ["user-added"],
            });
            const newDoc = addLayer(doc, layer);
            pushDoc(newDoc);
            return ok("Shape layer added", { layerId: layer.id });
          }

          case "addImageLayer": {
            if (!doc) return fail("No document loaded");
            const layer = createImageLayerV2({
              imageRef: params.imageRef as string,
              x: (params.x as number) ?? 150,
              y: (params.y as number) ?? 150,
              width: (params.width as number) ?? 400,
              height: (params.height as number) ?? 400,
              tags: (params.tags as string[]) ?? ["user-added"],
            });
            const newDoc = addLayer(doc, layer);
            pushDoc(newDoc);
            return ok("Image layer added", { layerId: layer.id });
          }

          case "updateLayer": {
            if (!doc) return fail("No document loaded");
            const target = params.tag
              ? findByTag(doc, params.tag as string)
              : params.layerId
                ? doc.layersById[params.layerId as string]
                : undefined;
            if (!target) return fail("Layer not found");

            let newDoc = doc;

            // Position/size updates via transform
            if (params.x !== undefined || params.y !== undefined) {
              newDoc = moveLayerTransform(newDoc, target.id, {
                x: params.x as number | undefined,
                y: params.y as number | undefined,
              });
            }
            if (params.width !== undefined || params.height !== undefined) {
              newDoc = moveLayerTransform(newDoc, target.id, undefined, {
                w: params.width as number | undefined,
                h: params.height as number | undefined,
              });
            }

            // Opacity / visibility
            const basePatch: Partial<LayerV2> = {};
            if (params.opacity !== undefined) basePatch.opacity = params.opacity as number;
            if (params.visible !== undefined) basePatch.visible = params.visible as boolean;
            if (Object.keys(basePatch).length > 0) {
              newDoc = patchLayer(newDoc, target.id, basePatch);
            }

            // Text-specific updates
            if (target.type === "text") {
              const textLayer = newDoc.layersById[target.id] as TextLayerV2;
              const style = { ...textLayer.defaultStyle };
              let textPatch: Partial<TextLayerV2> = {};
              if (params.text !== undefined) textPatch = { text: params.text as string };
              if (params.fontSize !== undefined) style.fontSize = params.fontSize as number;
              if (params.fontFamily !== undefined) style.fontFamily = params.fontFamily as string;
              if (params.color !== undefined) style.fill = solidPaintHex(params.color as string);
              textPatch.defaultStyle = style;
              newDoc = patchLayer(newDoc, target.id, textPatch as Partial<LayerV2>);
            }

            // Shape fill update
            if (target.type === "shape" && params.color !== undefined) {
              newDoc = patchLayer(newDoc, target.id, {
                fills: [solidPaintHex(params.color as string)],
              } as Partial<LayerV2>);
            }

            pushDoc(newDoc);
            return ok(`Layer "${target.name}" updated`);
          }

          case "removeLayer": {
            if (!doc) return fail("No document loaded");
            const target = params.tag
              ? findByTag(doc, params.tag as string)
              : params.layerId
                ? doc.layersById[params.layerId as string]
                : undefined;
            if (!target) return fail("Layer not found");
            if (target.id === doc.rootFrameId) return fail("Cannot remove root frame");

            const newLayers = { ...doc.layersById };
            delete newLayers[target.id];

            // Remove from parent's children
            const rootFrame = newLayers[doc.rootFrameId] as FrameLayerV2;
            if (rootFrame) {
              rootFrame.children = rootFrame.children.filter((id) => id !== target.id);
            }

            pushDoc({ ...doc, layersById: newLayers });
            return ok(`Layer "${target.name}" removed`);
          }

          case "moveLayer": {
            if (!doc) return fail("No document loaded");
            const target = params.tag
              ? findByTag(doc, params.tag as string)
              : params.layerId
                ? doc.layersById[params.layerId as string]
                : undefined;
            if (!target) return fail("Layer not found");
            const newDoc = moveLayerTransform(doc, target.id, {
              x: params.x as number | undefined,
              y: params.y as number | undefined,
            });
            pushDoc(newDoc);
            return ok(`Layer "${target.name}" moved`);
          }

          case "reorderLayer": {
            if (!doc) return fail("No document loaded");
            const target = params.tag
              ? findByTag(doc, params.tag as string)
              : params.layerId
                ? doc.layersById[params.layerId as string]
                : undefined;
            if (!target) return fail("Layer not found");

            const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2;
            const children = [...rootFrame.children];
            const idx = children.indexOf(target.id);
            if (idx === -1) return fail("Layer not in root frame children");

            const dir = params.direction as string;
            const newChildren = [...children];
            if (dir === "forward" && idx < children.length - 1) {
              [newChildren[idx], newChildren[idx + 1]] = [newChildren[idx + 1], newChildren[idx]];
            } else if (dir === "backward" && idx > 0) {
              [newChildren[idx], newChildren[idx - 1]] = [newChildren[idx - 1], newChildren[idx]];
            } else if (dir === "toFront") {
              newChildren.splice(idx, 1);
              newChildren.push(target.id);
            } else if (dir === "toBack") {
              newChildren.splice(idx, 1);
              newChildren.unshift(target.id);
            }

            const newDoc = patchLayer(doc, doc.rootFrameId, { children: newChildren } as Partial<LayerV2>);
            pushDoc(newDoc);
            return ok(`Layer "${target.name}" reordered (${dir})`);
          }

          case "duplicateLayer": {
            if (!doc) return fail("No document loaded");
            const target = params.tag
              ? findByTag(doc, params.tag as string)
              : params.layerId
                ? doc.layersById[params.layerId as string]
                : undefined;
            if (!target) return fail("Layer not found");
            if (target.id === doc.rootFrameId) return fail("Cannot duplicate root frame");

            const offsetX = (params.offsetX as number) ?? 20;
            const offsetY = (params.offsetY as number) ?? 20;
            const clone = structuredClone(target);
            clone.id = crypto.randomUUID();
            clone.name = `${target.name} (copy)`;
            clone.transform = {
              ...clone.transform,
              position: {
                x: clone.transform.position.x + offsetX,
                y: clone.transform.position.y + offsetY,
              },
            };

            const newDoc = addLayer(doc, clone as LayerV2);
            pushDoc(newDoc);
            return ok(`Layer "${target.name}" duplicated`);
          }

          // ── Style ──
          case "changeTemplate": {
            const templateId = params.templateId as string;
            const template = getCertificateTemplate(templateId);
            store.getState().setTemplateId(templateId);
            store.getState().setMeta({ templateId });
            const currentMeta = store.getState().meta;
            const newDoc = certificateConfigToDocument(currentMeta, template);
            pushDoc(newDoc);
            return ok(`Template changed to "${template.name}"`);
          }

          case "updateColors": {
            if (!doc) return fail("No document loaded");
            // Get current template colors as base, then override with params
            const template = getCertificateTemplate(store.getState().meta.templateId);
            const colors: CertificateTemplateColors = {
              background: (params.background as string) ?? template.colors.background,
              primary: (params.primary as string) ?? template.colors.primary,
              secondary: (params.secondary as string) ?? template.colors.secondary,
              text: (params.text as string) ?? template.colors.text,
              accent: (params.accent as string) ?? template.colors.accent,
            };
            const newDoc = syncColorsToCertificateDoc(doc, colors);
            pushDoc(newDoc);
            return ok("Colors updated");
          }

          case "updateFonts": {
            if (!doc) return fail("No document loaded");
            const layers = getLayerOrder(doc);
            let newDoc = doc;
            for (const layer of layers) {
              if (layer.type !== "text") continue;
              const tl = layer as TextLayerV2;
              const isHeading = tl.tags?.some((t) =>
                ["title", "heading", "certificate-title"].includes(t),
              );
              const isAccent = tl.tags?.some((t) =>
                ["recipient-name", "seal-text"].includes(t),
              );
              let newFamily: string | undefined;
              if (isHeading && params.headingFont) newFamily = params.headingFont as string;
              else if (isAccent && params.accentFont) newFamily = params.accentFont as string;
              else if (params.bodyFont) newFamily = params.bodyFont as string;
              if (newFamily) {
                newDoc = patchLayer(newDoc, layer.id, {
                  defaultStyle: { ...tl.defaultStyle, fontFamily: newFamily },
                } as Partial<LayerV2>);
              }
            }
            pushDoc(newDoc);
            return ok("Fonts updated");
          }

          // ── Seal ──
          case "updateSeal": {
            const patch: Partial<CertificateConfig> = {};
            if (params.showSeal !== undefined) patch.showSeal = params.showSeal as boolean;
            if (params.sealText !== undefined) patch.sealText = params.sealText as string;
            if (params.sealStyle !== undefined) patch.sealStyle = params.sealStyle as SealStyle;
            store.getState().setMeta(patch);
            // Regenerate full document to rebuild seal layers
            const currentMeta = store.getState().meta;
            const template = getCertificateTemplate(currentMeta.templateId);
            const newDoc = certificateConfigToDocument(currentMeta, template);
            pushDoc(newDoc);
            return ok("Seal updated", patch);
          }

          // ── AI ──
          case "generateDesign":
            return ok(
              "AI design generation should be triggered from the workspace UI. Use the AI revision bar or template picker.",
              { hint: "Use reviseDesign for modifications" },
            );

          case "reviseDesign":
            return ok(
              "AI revision should be triggered from the workspace UI revision bar.",
              { instruction: params.instruction },
            );

          // ── Export ──
          case "exportDocument":
            return ok(
              `Export as ${(params.format as string) || "png"} at ${(params.quality as string) || "standard"} quality. Use the export button in the toolbar.`,
              { format: params.format, quality: params.quality },
            );

          case "validateBeforeExport": {
            const result = validate();
            return result.ready
              ? ok("Certificate is ready for export!")
              : ok(`Certificate has ${result.issues.length} issue(s)`, {
                  issues: result.issues,
                  ready: false,
                });
          }

          // ── Read ──
          case "readCurrentState":
            return ok("Current certificate state", readState());

          // ── System ──
          case "resetAll":
            store.getState().resetToDefaults();
            useEditorStore.getState().resetDoc();
            return ok("Certificate reset to defaults");

          default:
            return fail(`Unknown action: ${actionName}`);
        }
      },
  };

  const getSnapshot = () => store.getState().meta;
  const restoreSnapshot = (s: unknown) => store.getState().setMeta(s as Partial<CertificateConfig>);

  return withActivityLogging(baseManifest, getSnapshot, restoreSnapshot);
}
