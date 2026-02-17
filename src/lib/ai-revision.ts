// =============================================================================
// DMSuite — AI Revision Engine (Task 2.2.1)
// Precise, design-preserving AI revisions.
// =============================================================================

import type { DesignDocument, Layer } from "./canvas-layers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RevisionScope =
  | "text-only"
  | "colors-only"
  | "layout-only"
  | "element-specific"
  | "full-redesign";

export interface RevisionRequest {
  scope: RevisionScope;
  instruction: string;
  /** Specific layer IDs to target (for element-specific scope) */
  targetLayerIds?: string[];
}

export interface LayerChange {
  layerId: string;
  changes: Partial<Layer>;
}

export interface RevisionResult {
  changedLayers: LayerChange[];
  summary: string;
}

export interface RevisionHistoryEntry {
  id: string;
  timestamp: number;
  request: RevisionRequest;
  result: RevisionResult;
  beforeSnapshot: { layers: Layer[]; layerOrder: string[] };
  afterSnapshot: { layers: Layer[]; layerOrder: string[] };
}

export interface LockedProperty {
  layerId: string;
  properties: string[];
}

// ---------------------------------------------------------------------------
// Revision Prompt Builder
// ---------------------------------------------------------------------------

/**
 * Build a revision prompt that sends the current design state to the AI,
 * along with scope constraints and locked properties.
 */
export function buildRevisionPrompt(
  doc: DesignDocument,
  request: RevisionRequest,
  lockedProperties: LockedProperty[] = []
): string {
  // Serialize layers for the prompt (simplified)
  const layerDescriptions = doc.layers.map((l) => {
    const base = `ID: ${l.id} | Name: "${l.name}" | Type: ${l.type} | Pos: (${Math.round(l.x)}, ${Math.round(l.y)}) | Size: ${Math.round(l.width)}×${Math.round(l.height)}`;

    const locked = lockedProperties.find((lp) => lp.layerId === l.id);
    const lockNote = locked
      ? ` | DO NOT CHANGE: ${locked.properties.join(", ")}`
      : "";

    let details = "";
    switch (l.type) {
      case "text":
        details = ` | Text: "${l.text}" | FontSize: ${l.fontSize} | Color: ${l.color} | Align: ${l.align}`;
        break;
      case "shape":
        details = ` | Shape: ${l.shape} | Fill: ${l.fillColor} | Stroke: ${l.strokeColor}`;
        break;
      case "image":
        details = ` | Src: ${l.src.substring(0, 60)}...`;
        break;
      case "cta":
        details = ` | Text: "${l.text}" | BgColor: ${l.bgColor} | TextColor: ${l.textColor}`;
        break;
      case "decorative":
        details = ` | Type: ${l.decorationType} | Color: ${l.color}`;
        break;
    }

    return base + details + lockNote;
  });

  const scopeInstructions: Record<RevisionScope, string> = {
    "text-only":
      "ONLY modify text content (text, fontSize, fontWeight, color). Do NOT change positions, sizes, or non-text layers.",
    "colors-only":
      "ONLY modify color-related properties (color, fillColor, strokeColor, bgColor, textColor, backgroundColor). Do NOT change positions, sizes, or text content.",
    "layout-only":
      "ONLY modify positions (x, y) and sizes (width, height). Do NOT change colors, text content, or styles.",
    "element-specific": request.targetLayerIds
      ? `ONLY modify layers with IDs: ${request.targetLayerIds.join(", ")}. Leave all other layers completely unchanged.`
      : "Modify only the specified elements.",
    "full-redesign":
      "You may modify any property of any layer, including adding or removing layers. Preserve the overall design intent.",
  };

  return `You are a design revision AI. You have a design with the following layers:

${layerDescriptions.join("\n")}

Canvas size: ${doc.width}×${doc.height}
Background color: ${doc.backgroundColor}

SCOPE CONSTRAINT: ${scopeInstructions[request.scope]}

USER REQUEST: "${request.instruction}"

Respond with a JSON object containing:
{
  "changedLayers": [
    { "layerId": "...", "changes": { "property": "newValue", ... } }
  ],
  "summary": "Brief description of what was changed"
}

IMPORTANT:
- Only include layers that actually change
- Use exact layer IDs from the list above
- For colors, use hex format (#RRGGBB)
- For text, provide the complete new text
- Respect ALL "DO NOT CHANGE" constraints`;
}

// ---------------------------------------------------------------------------
// Apply Revision
// ---------------------------------------------------------------------------

/**
 * Apply a revision result to a design document.
 * Returns the updated document with only specified layers changed.
 */
export function applyRevision(
  doc: DesignDocument,
  result: RevisionResult
): DesignDocument {
  const updatedLayers = doc.layers.map((layer) => {
    const change = result.changedLayers.find((c) => c.layerId === layer.id);
    if (!change) return layer;
    return { ...layer, ...change.changes, id: layer.id, type: layer.type } as Layer;
  });

  return {
    ...doc,
    layers: updatedLayers,
    meta: { ...doc.meta, updatedAt: Date.now() },
  };
}

/**
 * Parse AI response into a RevisionResult.
 * Handles common formatting issues.
 */
export function parseRevisionResponse(response: string): RevisionResult | null {
  try {
    // Extract JSON from the response (may be wrapped in markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.changedLayers || !Array.isArray(parsed.changedLayers)) return null;

    return {
      changedLayers: parsed.changedLayers,
      summary: parsed.summary || "Revision applied",
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Scope Options (for UI dropdowns)
// ---------------------------------------------------------------------------

export const REVISION_SCOPE_OPTIONS: { value: RevisionScope; label: string; description: string }[] = [
  { value: "text-only", label: "Text Content", description: "Only change text, fonts, and text colors" },
  { value: "colors-only", label: "Colors & Theme", description: "Only change color scheme and gradients" },
  { value: "layout-only", label: "Layout & Composition", description: "Only change positions and sizes" },
  { value: "element-specific", label: "Specific Element", description: "Target a specific layer to modify" },
  { value: "full-redesign", label: "Full Redesign", description: "Complete creative overhaul" },
];
