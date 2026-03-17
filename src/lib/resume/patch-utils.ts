// =============================================================================
// DMSuite — Resume JSON Patch Utilities
// RFC 6902 JSON Patch operations built on `fast-json-patch`.
// Follows Reactive Resume's `applyResumePatches()` pattern:
//   (1) validate operations structurally
//   (2) apply with applyPatch()
//   (3) validate result against resumeDataSchema with safeParse()
// =============================================================================

import { z } from "zod/v4";
import {
  type Operation,
  applyPatch,
  validate,
  deepClone,
  compare,
  getValueByPointer,
} from "fast-json-patch";
import { type ResumeData, resumeDataSchema } from "./schema";

// ---------------------------------------------------------------------------
// Error class — structured error reporting for patch failures
// ---------------------------------------------------------------------------

export type PatchErrorCode =
  | "VALIDATION_FAILED"
  | "APPLY_FAILED"
  | "SCHEMA_INVALID"
  | "SCOPE_VIOLATION"
  | "CONTENT_FIDELITY_VIOLATION"
  | "SECTION_BOUNDARY_VIOLATION"
  | "CHANGE_SIZE_EXCEEDED"
  | "SILENT_ADDITION";

export class ResumePatchError extends Error {
  /** Structured error code */
  readonly code: PatchErrorCode;
  /** Index of the failing operation (if applicable) */
  readonly operationIndex?: number;
  /** The operation that failed (if applicable) */
  readonly operation?: Operation;
  /** Additional detail (e.g., Zod issue list) */
  readonly detail?: unknown;

  constructor(
    code: PatchErrorCode,
    message: string,
    opts?: {
      operationIndex?: number;
      operation?: Operation;
      detail?: unknown;
    }
  ) {
    super(message);
    this.name = "ResumePatchError";
    this.code = code;
    this.operationIndex = opts?.operationIndex;
    this.operation = opts?.operation;
    this.detail = opts?.detail;
  }
}

// ---------------------------------------------------------------------------
// Zod schema for validating JSON Patch operations at the request boundary
// ---------------------------------------------------------------------------

const baseOpSchema = z.object({
  path: z.string().min(1),
});

const addOpSchema = baseOpSchema.extend({
  op: z.literal("add"),
  value: z.unknown(),
});

const removeOpSchema = baseOpSchema.extend({
  op: z.literal("remove"),
});

const replaceOpSchema = baseOpSchema.extend({
  op: z.literal("replace"),
  value: z.unknown(),
});

const moveOpSchema = baseOpSchema.extend({
  op: z.literal("move"),
  from: z.string().min(1),
});

const copyOpSchema = baseOpSchema.extend({
  op: z.literal("copy"),
  from: z.string().min(1),
});

const testOpSchema = baseOpSchema.extend({
  op: z.literal("test"),
  value: z.unknown(),
});

export const jsonPatchOperationSchema = z.discriminatedUnion("op", [
  addOpSchema,
  removeOpSchema,
  replaceOpSchema,
  moveOpSchema,
  copyOpSchema,
  testOpSchema,
]);

export type JsonPatchOperation = z.infer<typeof jsonPatchOperationSchema>;

export const jsonPatchArraySchema = z.array(jsonPatchOperationSchema).min(1);

// ---------------------------------------------------------------------------
// Revision scopes — whitelist of allowed JSON pointer prefixes
// ---------------------------------------------------------------------------

export type RevisionScope =
  | "content-only"
  | "design-only"
  | "section-specific"
  | "full";

/** Maps each scope to allowed JSON pointer path prefixes */
const SCOPE_ALLOWED_PATHS: Record<RevisionScope, string[]> = {
  "content-only": [
    "/basics",
    "/sections",
    "/customSections",
  ],
  "design-only": [
    "/metadata/template",
    "/metadata/layout",
    "/metadata/css",
    "/metadata/page",
    "/metadata/design",
    "/metadata/typography",
  ],
  "section-specific": [
    // Dynamically scoped — see scopedPatch helpers below
    "/",
  ],
  full: [
    "/",
  ],
};

// ---------------------------------------------------------------------------
// Content fidelity — paths that count as "user-provided text content"
// ---------------------------------------------------------------------------

/** Path patterns that match user-provided text content (for "keep-exact" mode) */
const CONTENT_PATH_PATTERNS: RegExp[] = [
  /^\/sections\/\w+\/items\/\d+\/description$/,
  /^\/sections\/\w+\/items\/\d+\/position$/,
  /^\/sections\/\w+\/items\/\d+\/company$/,
  /^\/sections\/\w+\/items\/\d+\/name$/,
  /^\/sections\/\w+\/items\/\d+\/role$/,
  /^\/sections\/\w+\/items\/\d+\/institution$/,
  /^\/sections\/\w+\/items\/\d+\/degree$/,
  /^\/sections\/\w+\/items\/\d+\/field$/,
  /^\/sections\/summary\/content$/,
  /^\/basics\/name$/,
  /^\/basics\/headline$/,
  /^\/basics\/email$/,
  /^\/basics\/phone$/,
  /^\/basics\/location$/,
  /^\/customSections\/\d+\/items\/\d+\/(title|subtitle|description)$/,
];

function isContentPath(path: string): boolean {
  return CONTENT_PATH_PATTERNS.some((pattern) => pattern.test(path));
}

// ---------------------------------------------------------------------------
// Core: applyResumePatches
// Follows RR's exact pattern: validate → apply → Zod safeParse
// ---------------------------------------------------------------------------

export interface PatchApplyResult {
  success: true;
  newDocument: ResumeData;
  applied: Operation[];
}

export interface PatchApplyError {
  success: false;
  error: ResumePatchError;
}

export type PatchResult = PatchApplyResult | PatchApplyError;

/**
 * Apply RFC 6902 JSON Patch operations to a ResumeData document.
 *
 * Pipeline:
 *   1. Deep-clone the document (never mutate the original)
 *   2. Structurally validate operations with fast-json-patch's validate()
 *   3. Apply with applyPatch()
 *   4. Validate the result against resumeDataSchema (Zod safeParse)
 *
 * Returns { success: true, newDocument, applied } on success.
 * Returns { success: false, error: ResumePatchError } on failure.
 */
export function applyResumePatches(
  document: ResumeData,
  operations: Operation[]
): PatchResult {
  // 1. Deep-clone to avoid mutating original
  const cloned = deepClone(document) as ResumeData;

  // 2. Structural validation
  const validationError = validate(operations, cloned);
  if (validationError) {
    return {
      success: false,
      error: new ResumePatchError(
        "VALIDATION_FAILED",
        `Patch validation failed at operation ${validationError.index ?? "?"}: ${validationError.message}`,
        {
          operationIndex: validationError.index ?? undefined,
          operation: validationError.index != null ? operations[validationError.index] : undefined,
          detail: validationError,
        }
      ),
    };
  }

  // 3. Apply patches
  let patched: ResumeData;
  try {
    const result = applyPatch(cloned, operations, false, true, true);
    patched = result.newDocument;
  } catch (err) {
    return {
      success: false,
      error: new ResumePatchError(
        "APPLY_FAILED",
        `Failed to apply patches: ${err instanceof Error ? err.message : String(err)}`,
        { detail: err }
      ),
    };
  }

  // 4. Schema validation — the patched data MUST conform to resumeDataSchema
  const parseResult = resumeDataSchema.safeParse(patched);
  if (!parseResult.success) {
    return {
      success: false,
      error: new ResumePatchError(
        "SCHEMA_INVALID",
        "Patched document does not conform to resume schema",
        { detail: parseResult.error }
      ),
    };
  }

  return {
    success: true,
    newDocument: parseResult.data,
    applied: operations,
  };
}

// ---------------------------------------------------------------------------
// Scope validation — check operations against allowed scope
// ---------------------------------------------------------------------------

export interface ScopeCheckResult {
  allowed: Operation[];
  rejected: Array<{ op: Operation; reason: string }>;
}

/**
 * Filter operations by revision scope. Returns allowed and rejected ops.
 */
export function checkScope(
  operations: Operation[],
  scope: RevisionScope,
  targetSectionId?: string
): ScopeCheckResult {
  const allowedPrefixes = SCOPE_ALLOWED_PATHS[scope];

  // For section-specific scope, build the allowed prefix dynamically
  const effectivePrefixes =
    scope === "section-specific" && targetSectionId
      ? [
          `/sections/${targetSectionId}`,
          `/customSections`, // Custom sections need index-based access
        ]
      : allowedPrefixes;

  const allowed: Operation[] = [];
  const rejected: ScopeCheckResult["rejected"] = [];

  for (const op of operations) {
    const path = op.path;
    const fromPath = "from" in op ? (op as { from: string }).from : undefined;

    const pathAllowed = effectivePrefixes.some(
      (prefix) => prefix === "/" || path.startsWith(prefix)
    );
    const fromAllowed =
      !fromPath ||
      effectivePrefixes.some(
        (prefix) => prefix === "/" || fromPath.startsWith(prefix)
      );

    if (pathAllowed && fromAllowed) {
      allowed.push(op);
    } else {
      rejected.push({
        op,
        reason: `Path "${path}" is not allowed under scope "${scope}"${
          targetSectionId ? ` (target: ${targetSectionId})` : ""
        }`,
      });
    }
  }

  return { allowed, rejected };
}

// ---------------------------------------------------------------------------
// Content fidelity check — block text-content patches in "keep-exact" mode
// ---------------------------------------------------------------------------

export interface FidelityCheckResult {
  allowed: Operation[];
  rejected: Array<{ op: Operation; reason: string }>;
}

/**
 * When content fidelity is "keep-exact", block any operations that modify
 * user-provided text content (descriptions, names, titles, etc.).
 */
export function checkContentFidelity(
  operations: Operation[],
  mode: "keep-exact" | "ai-enhanced"
): FidelityCheckResult {
  if (mode === "ai-enhanced") {
    return { allowed: operations, rejected: [] };
  }

  const allowed: Operation[] = [];
  const rejected: FidelityCheckResult["rejected"] = [];

  for (const op of operations) {
    if (isContentPath(op.path)) {
      rejected.push({
        op,
        reason: `Content fidelity mode "keep-exact" blocks modification to "${op.path}"`,
      });
    } else {
      allowed.push(op);
    }
  }

  return { allowed, rejected };
}

// ---------------------------------------------------------------------------
// Section boundary check — ensure only targeted section is modified
// ---------------------------------------------------------------------------

/**
 * Verify that ALL operations only affect the targeted section.
 * Returns any ops that escaped the boundary.
 */
export function checkSectionBoundary(
  operations: Operation[],
  targetSectionId: string
): ScopeCheckResult {
  const builtInPrefix = `/sections/${targetSectionId}`;

  const allowed: Operation[] = [];
  const rejected: ScopeCheckResult["rejected"] = [];

  for (const op of operations) {
    // Allow ops that target the specific built-in section
    if (op.path.startsWith(builtInPrefix)) {
      allowed.push(op);
      continue;
    }

    // Allow ops targeting custom sections by checking their id inside the array
    // (Custom sections are /customSections/N/... — we'd need the actual index)
    if (
      op.path.startsWith("/customSections/") &&
      targetSectionId.startsWith("custom-")
    ) {
      allowed.push(op);
      continue;
    }

    rejected.push({
      op,
      reason: `Operation targets "${op.path}" but only section "${targetSectionId}" should be modified`,
    });
  }

  return { allowed, rejected };
}

// ---------------------------------------------------------------------------
// Change size analysis
// ---------------------------------------------------------------------------

export interface ChangeSizeAnalysis {
  totalOps: number;
  addOps: number;
  removeOps: number;
  replaceOps: number;
  moveOps: number;
  /** Percentage of the document affected (rough estimate) */
  estimatedImpact: number;
  /** True if the change seems excessive for a "small tweak" */
  isExtensive: boolean;
  warning?: string;
}

/**
 * Analyze the scope of changes — flag excessive changes.
 */
export function analyzeChangeSize(
  operations: Operation[],
  originalDocument: ResumeData
): ChangeSizeAnalysis {
  const totalOps = operations.length;
  const addOps = operations.filter((o) => o.op === "add").length;
  const removeOps = operations.filter((o) => o.op === "remove").length;
  const replaceOps = operations.filter((o) => o.op === "replace").length;
  const moveOps = operations.filter((o) => o.op === "move" || o.op === "copy").length;

  // Rough estimate: count unique top-level path segments affected
  const topLevelPaths = new Set(
    operations.map((op) => {
      const parts = op.path.split("/").filter(Boolean);
      return parts.slice(0, 2).join("/");
    })
  );

  // Total top-level paths in a resume (basics, sections/*, customSections, metadata/*)
  const totalTopLevel = 20; // rough approximation
  const estimatedImpact = Math.min(
    1,
    topLevelPaths.size / totalTopLevel
  );

  const isExtensive = estimatedImpact > 0.4;
  const warning = isExtensive
    ? `AI made extensive changes affecting ${Math.round(estimatedImpact * 100)}% of the document — review carefully.`
    : undefined;

  return {
    totalOps,
    addOps,
    removeOps,
    replaceOps,
    moveOps,
    estimatedImpact,
    isExtensive,
    warning,
  };
}

// ---------------------------------------------------------------------------
// Directional size checks (for shorten/expand intents)
// ---------------------------------------------------------------------------

/**
 * Verify that a "shorten" operation actually reduced content length.
 */
export function verifyShorterContent(
  original: ResumeData,
  patched: ResumeData,
  targetPath?: string
): boolean {
  const origText = extractTextAtPath(original, targetPath);
  const patchedText = extractTextAtPath(patched, targetPath);
  return patchedText.length < origText.length;
}

/**
 * Verify that an "expand" operation actually increased content length.
 */
export function verifyLongerContent(
  original: ResumeData,
  patched: ResumeData,
  targetPath?: string
): boolean {
  const origText = extractTextAtPath(original, targetPath);
  const patchedText = extractTextAtPath(patched, targetPath);
  return patchedText.length > origText.length;
}

/**
 * Extract all text content under a given path (or entire document).
 */
function extractTextAtPath(data: ResumeData, path?: string): string {
  const target = path
    ? getValueByPointer(data as unknown as Record<string, unknown>, path)
    : data;

  if (typeof target === "string") return target;
  if (target == null) return "";

  // Recursively collect all string values
  return collectStrings(target).join(" ");
}

function collectStrings(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (Array.isArray(obj)) return obj.flatMap(collectStrings);
  if (typeof obj === "object" && obj !== null) {
    return Object.values(obj).flatMap(collectStrings);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Silent addition detection
// ---------------------------------------------------------------------------

/**
 * Detect if the AI silently added new section items that weren't requested.
 * Returns the indices of any "add" operations that create new items.
 */
export function detectSilentAdditions(
  operations: Operation[],
  intent: string
): Array<{ op: Operation; reason: string }> {
  // Only flag for non-additive intents
  const addIntents = ["add-section", "add-keywords", "expand-section"];
  if (addIntents.includes(intent)) return [];

  const additions: Array<{ op: Operation; reason: string }> = [];

  for (const op of operations) {
    if (op.op !== "add") continue;

    // Check if adding a new item to a section's items array
    // Pattern: /sections/*/items/- (append) or /sections/*/items/N
    const isNewItem = /^\/sections\/\w+\/items\/(-)|\d+$/.test(op.path);
    const isNewCustomSection = /^\/customSections\/(-)|\d+$/.test(op.path);

    if (isNewItem || isNewCustomSection) {
      additions.push({
        op,
        reason: `AI silently added a new item at "${op.path}" — not part of the requested "${intent}" operation`,
      });
    }
  }

  return additions;
}

// ---------------------------------------------------------------------------
// Diffing utilities
// ---------------------------------------------------------------------------

/**
 * Generate RFC 6902 diff between two ResumeData documents.
 * Wrapper around fast-json-patch's compare().
 */
export function generateDiff(
  original: ResumeData,
  modified: ResumeData
): Operation[] {
  return compare(
    original as unknown as Record<string, unknown>,
    modified as unknown as Record<string, unknown>
  );
}

// ---------------------------------------------------------------------------
// Full validation pipeline
// ---------------------------------------------------------------------------

export interface ValidationPipelineOptions {
  scope: RevisionScope;
  contentFidelityMode: "keep-exact" | "ai-enhanced";
  targetSectionId?: string;
  intent?: string;
}

export interface ValidationPipelineResult {
  success: boolean;
  allowed: Operation[];
  rejected: Array<{ op: Operation; reason: string }>;
  warnings: string[];
  newDocument?: ResumeData;
}

/**
 * Run the complete validation pipeline on a set of operations:
 *   1. Scope check
 *   2. Content fidelity check
 *   3. Section boundary check (if section-specific)
 *   4. Silent addition detection
 *   5. Apply patches
 *   6. Change size analysis
 */
export function runValidationPipeline(
  document: ResumeData,
  operations: Operation[],
  options: ValidationPipelineOptions
): ValidationPipelineResult {
  const allRejected: Array<{ op: Operation; reason: string }> = [];
  const warnings: string[] = [];

  // 1. Scope check
  const scopeResult = checkScope(operations, options.scope, options.targetSectionId);
  allRejected.push(...scopeResult.rejected);
  let remaining = scopeResult.allowed;

  // 2. Content fidelity check
  const fidelityResult = checkContentFidelity(remaining, options.contentFidelityMode);
  allRejected.push(...fidelityResult.rejected);
  remaining = fidelityResult.allowed;

  // 3. Section boundary check (only for section-specific scope)
  if (options.scope === "section-specific" && options.targetSectionId) {
    const boundaryResult = checkSectionBoundary(remaining, options.targetSectionId);
    allRejected.push(...boundaryResult.rejected);
    remaining = boundaryResult.allowed;
  }

  // 4. Silent addition detection
  if (options.intent) {
    const silentAdds = detectSilentAdditions(remaining, options.intent);
    allRejected.push(...silentAdds);
    remaining = remaining.filter(
      (op) => !silentAdds.some((s) => s.op === op)
    );
  }

  // 5. If no operations remain, return early
  if (remaining.length === 0) {
    return {
      success: false,
      allowed: [],
      rejected: allRejected,
      warnings: allRejected.length > 0
        ? ["All operations were rejected by the validation pipeline."]
        : [],
    };
  }

  // 6. Apply patches
  const patchResult = applyResumePatches(document, remaining);
  if (!patchResult.success) {
    return {
      success: false,
      allowed: [],
      rejected: [
        ...allRejected,
        ...remaining.map((op) => ({
          op,
          reason: patchResult.error.message,
        })),
      ],
      warnings: [],
    };
  }

  // 7. Change size analysis
  const sizeAnalysis = analyzeChangeSize(remaining, document);
  if (sizeAnalysis.warning) {
    warnings.push(sizeAnalysis.warning);
  }

  return {
    success: true,
    allowed: remaining,
    rejected: allRejected,
    warnings,
    newDocument: patchResult.newDocument,
  };
}

// ---------------------------------------------------------------------------
// Scoped patch helpers
// ---------------------------------------------------------------------------

/**
 * Build a scoped set of replace operations from a partial update.
 * Useful for converting a "rewrite-section" result into patches.
 */
export function buildSectionReplacePatch(
  sectionKey: string,
  field: string,
  newValue: unknown
): Operation[] {
  return [
    { op: "replace" as const, path: `/sections/${sectionKey}/${field}`, value: newValue },
  ];
}

/**
 * Build replace patches for an entire section item.
 */
export function buildItemReplacePatch(
  sectionKey: string,
  itemIndex: number,
  updates: Record<string, unknown>
): Operation[] {
  return Object.entries(updates).map(([key, value]) => ({
    op: "replace" as const,
    path: `/sections/${sectionKey}/items/${itemIndex}/${key}`,
    value,
  }));
}

/**
 * Build patches to reorder section items.
 */
export function buildReorderPatch(
  sectionKey: string,
  fromIndex: number,
  toIndex: number,
  items: unknown[]
): Operation[] {
  // Create a new array with the item moved
  const newItems = [...items];
  const [moved] = newItems.splice(fromIndex, 1);
  newItems.splice(toIndex, 0, moved);

  return [
    {
      op: "replace" as const,
      path: `/sections/${sectionKey}/items`,
      value: newItems,
    },
  ];
}

/**
 * Build patches to toggle section visibility.
 */
export function buildToggleVisibilityPatch(
  sectionKey: string,
  hidden: boolean
): Operation[] {
  return [
    {
      op: "replace" as const,
      path: `/sections/${sectionKey}/hidden`,
      value: hidden,
    },
  ];
}

/**
 * Build patches to move a section between layout columns.
 */
export function buildMoveSectionPatch(
  currentLayout: { pages: Array<{ main: string[]; sidebar: string[] }> },
  sectionKey: string,
  targetColumn: "main" | "sidebar",
  pageIndex: number
): Operation[] {
  const ops: Operation[] = [];

  // Remove from all pages first
  for (let i = 0; i < currentLayout.pages.length; i++) {
    const page = currentLayout.pages[i];
    const mainIdx = page.main.indexOf(sectionKey);
    const sidebarIdx = page.sidebar.indexOf(sectionKey);

    if (mainIdx !== -1) {
      const newMain = page.main.filter((k) => k !== sectionKey);
      ops.push({
        op: "replace" as const,
        path: `/metadata/layout/pages/${i}/main`,
        value: newMain,
      });
    }
    if (sidebarIdx !== -1) {
      const newSidebar = page.sidebar.filter((k) => k !== sectionKey);
      ops.push({
        op: "replace" as const,
        path: `/metadata/layout/pages/${i}/sidebar`,
        value: newSidebar,
      });
    }
  }

  // Add to target column on target page
  const targetPage = currentLayout.pages[pageIndex];
  if (targetPage) {
    const currentCol = targetPage[targetColumn];
    ops.push({
      op: "replace" as const,
      path: `/metadata/layout/pages/${pageIndex}/${targetColumn}`,
      value: [...currentCol.filter((k) => k !== sectionKey), sectionKey],
    });
  }

  return ops;
}

/**
 * Build patches for design/metadata changes (100% deterministic).
 */
export function buildDesignPatch(
  path: string,
  value: unknown
): Operation[] {
  return [
    { op: "replace" as const, path: `/metadata/${path}`, value },
  ];
}

// ---------------------------------------------------------------------------
// Utility: validate an array of operations against our Zod schema
// ---------------------------------------------------------------------------

/**
 * Validate raw JSON from the AI against our jsonPatchArraySchema.
 * Returns parsed operations or throws ResumePatchError.
 */
export function parseAndValidateOperations(raw: unknown): Operation[] {
  const result = jsonPatchArraySchema.safeParse(raw);
  if (!result.success) {
    throw new ResumePatchError(
      "VALIDATION_FAILED",
      "AI response contains invalid JSON Patch operations",
      { detail: result.error }
    );
  }
  return result.data as Operation[];
}
