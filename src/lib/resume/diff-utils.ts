// =============================================================================
// DMSuite — Resume Diff Utilities
// Computes and formats content diffs from JSON Patch operations.
// Used by the DiffOverlay and revision history to show additions/removals.
// =============================================================================

import type { Operation } from "fast-json-patch";
import { getValueByPointer } from "fast-json-patch";
import type { ResumeData } from "./schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiffChangeType = "added" | "removed" | "modified" | "moved";

export interface DiffChange {
  id: string;
  type: DiffChangeType;
  path: string;
  /** Human-friendly label for the changed field */
  label: string;
  /** Section the change belongs to (for grouping) */
  sectionId: string;
  /** Before value (undefined for additions) */
  before?: string;
  /** After value (undefined for removals) */
  after?: string;
  /** Inline character-level diff segments (for text fields) */
  segments?: DiffSegment[];
}

export interface DiffSegment {
  type: "equal" | "added" | "removed";
  text: string;
}

export interface DiffSummary {
  totalChanges: number;
  additions: number;
  removals: number;
  modifications: number;
  changesBySection: Record<string, DiffChange[]>;
}

// ---------------------------------------------------------------------------
// Path → human-friendly label mapping
// ---------------------------------------------------------------------------

const PATH_LABELS: Array<{ pattern: RegExp; label: (m: RegExpMatchArray) => string }> = [
  { pattern: /^\/basics\/name$/, label: () => "Full Name" },
  { pattern: /^\/basics\/headline$/, label: () => "Headline" },
  { pattern: /^\/basics\/email$/, label: () => "Email" },
  { pattern: /^\/basics\/phone$/, label: () => "Phone" },
  { pattern: /^\/basics\/location$/, label: () => "Location" },
  { pattern: /^\/basics\/website\/url$/, label: () => "Website URL" },
  { pattern: /^\/sections\/summary\/content$/, label: () => "Professional Summary" },
  { pattern: /^\/sections\/summary\/title$/, label: () => "Summary Section Title" },
  { pattern: /^\/sections\/(\w+)\/title$/, label: (m) => `${capitalize(m[1])} Section Title` },
  { pattern: /^\/sections\/(\w+)\/hidden$/, label: (m) => `${capitalize(m[1])} Visibility` },
  { pattern: /^\/sections\/experience\/items\/(\d+)\/description$/, label: (m) => `Experience #${+m[1] + 1} Description` },
  { pattern: /^\/sections\/experience\/items\/(\d+)\/position$/, label: (m) => `Experience #${+m[1] + 1} Position` },
  { pattern: /^\/sections\/experience\/items\/(\d+)\/company$/, label: (m) => `Experience #${+m[1] + 1} Company` },
  { pattern: /^\/sections\/experience\/items\/(\d+)\/(\w+)$/, label: (m) => `Experience #${+m[1] + 1} ${capitalize(m[2])}` },
  { pattern: /^\/sections\/education\/items\/(\d+)\/(\w+)$/, label: (m) => `Education #${+m[1] + 1} ${capitalize(m[2])}` },
  { pattern: /^\/sections\/skills\/items\/(\d+)\/keywords$/, label: (m) => `Skills Category #${+m[1] + 1} Keywords` },
  { pattern: /^\/sections\/skills\/items\/(\d+)\/name$/, label: (m) => `Skills Category #${+m[1] + 1} Name` },
  { pattern: /^\/sections\/(\w+)\/items\/(\d+)\/(\w+)$/, label: (m) => `${capitalize(m[1])} #${+m[2] + 1} ${capitalize(m[3])}` },
  { pattern: /^\/metadata\/template$/, label: () => "Template" },
  { pattern: /^\/metadata\/design\/primaryColor$/, label: () => "Accent Color" },
  { pattern: /^\/metadata\/typography\/fontPairing$/, label: () => "Font" },
  { pattern: /^\/metadata\/typography\/fontScale$/, label: () => "Spacing" },
  { pattern: /^\/metadata\/page\/format$/, label: () => "Page Format" },
  { pattern: /^\/metadata\/layout\/pages\/(\d+)\/(\w+)$/, label: (m) => `Page ${+m[1] + 1} ${capitalize(m[2])} Layout` },
];

function getPathLabel(path: string): string {
  for (const { pattern, label } of PATH_LABELS) {
    const m = path.match(pattern);
    if (m) return label(m);
  }
  // Fallback: last path segment
  const segments = path.split("/").filter(Boolean);
  return segments.length > 0 ? capitalize(segments[segments.length - 1]) : path;
}

function getSectionId(path: string): string {
  if (path.startsWith("/basics")) return "basics";
  if (path.startsWith("/metadata")) return "metadata";
  const sectionMatch = path.match(/^\/sections\/(\w+)/);
  if (sectionMatch) return sectionMatch[1];
  if (path.startsWith("/customSections")) return "customSections";
  return "other";
}

// ---------------------------------------------------------------------------
// Main: compute diff from operations
// ---------------------------------------------------------------------------

/**
 * Compute a structured diff from JSON Patch operations applied to resume data.
 * Compares original and patched data to produce human-readable change items.
 */
export function computeDiffFromOperations(
  original: ResumeData,
  operations: Operation[]
): DiffChange[] {
  const changes: DiffChange[] = [];

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const path = op.path;
    const label = getPathLabel(path);
    const sectionId = getSectionId(path);
    const id = `diff-${i}-${path.replace(/\//g, "-")}`;

    switch (op.op) {
      case "add": {
        const afterStr = formatValue(op.value);
        changes.push({
          id,
          type: "added",
          path,
          label,
          sectionId,
          after: afterStr,
        });
        break;
      }

      case "remove": {
        const beforeValue = safeGetValue(original, path);
        const beforeStr = formatValue(beforeValue);
        changes.push({
          id,
          type: "removed",
          path,
          label,
          sectionId,
          before: beforeStr,
        });
        break;
      }

      case "replace": {
        const beforeValue = safeGetValue(original, path);
        const beforeStr = formatValue(beforeValue);
        const afterStr = formatValue(op.value);

        // Compute inline diff for string changes
        const segments =
          typeof beforeValue === "string" && typeof op.value === "string"
            ? computeInlineDiff(beforeValue, op.value)
            : undefined;

        changes.push({
          id,
          type: "modified",
          path,
          label,
          sectionId,
          before: beforeStr,
          after: afterStr,
          segments,
        });
        break;
      }

      case "move": {
        changes.push({
          id,
          type: "moved",
          path,
          label: `${label} (moved from ${(op as Operation & { from: string }).from})`,
          sectionId,
        });
        break;
      }
    }
  }

  return changes;
}

/**
 * Compute diff by comparing two ResumeData snapshots directly.
 * Useful for revision history where we compare past states.
 */
export function computeDiffFromSnapshots(
  before: ResumeData,
  after: ResumeData
): DiffChange[] {
  // Use fast-json-patch compare under the hood
  const { compare } = require("fast-json-patch") as {
    compare: (a: unknown, b: unknown) => Operation[];
  };
  const ops = compare(
    before as unknown as Record<string, unknown>,
    after as unknown as Record<string, unknown>
  );
  return computeDiffFromOperations(before, ops);
}

/**
 * Build a summary from a list of diff changes.
 */
export function buildDiffSummary(changes: DiffChange[]): DiffSummary {
  const changesBySection: Record<string, DiffChange[]> = {};
  let additions = 0;
  let removals = 0;
  let modifications = 0;

  for (const change of changes) {
    if (!changesBySection[change.sectionId]) {
      changesBySection[change.sectionId] = [];
    }
    changesBySection[change.sectionId].push(change);

    switch (change.type) {
      case "added":
        additions++;
        break;
      case "removed":
        removals++;
        break;
      case "modified":
      case "moved":
        modifications++;
        break;
    }
  }

  return {
    totalChanges: changes.length,
    additions,
    removals,
    modifications,
    changesBySection,
  };
}

// ---------------------------------------------------------------------------
// Inline character-level diff (Myers / simple LCS approach)
// ---------------------------------------------------------------------------

/**
 * Compute a simple word-level inline diff between two strings.
 * Uses a greedy LCS-based approach for readable results.
 */
export function computeInlineDiff(before: string, after: string): DiffSegment[] {
  if (before === after) return [{ type: "equal", text: before }];
  if (!before) return [{ type: "added", text: after }];
  if (!after) return [{ type: "removed", text: before }];

  // Word-level diff for better readability
  const beforeWords = tokenize(before);
  const afterWords = tokenize(after);

  const lcs = computeLCS(beforeWords, afterWords);
  const segments: DiffSegment[] = [];

  let bi = 0;
  let ai = 0;
  let li = 0;

  while (bi < beforeWords.length || ai < afterWords.length) {
    if (li < lcs.length && bi < beforeWords.length && ai < afterWords.length) {
      // Emit removed words before next LCS match
      const removedParts: string[] = [];
      while (bi < beforeWords.length && beforeWords[bi] !== lcs[li]) {
        removedParts.push(beforeWords[bi]);
        bi++;
      }
      if (removedParts.length > 0) {
        segments.push({ type: "removed", text: removedParts.join("") });
      }

      // Emit added words before next LCS match
      const addedParts: string[] = [];
      while (ai < afterWords.length && afterWords[ai] !== lcs[li]) {
        addedParts.push(afterWords[ai]);
        ai++;
      }
      if (addedParts.length > 0) {
        segments.push({ type: "added", text: addedParts.join("") });
      }

      // Emit the matching LCS word
      if (li < lcs.length && bi < beforeWords.length && ai < afterWords.length) {
        segments.push({ type: "equal", text: lcs[li] });
        bi++;
        ai++;
        li++;
      }
    } else {
      // Emit remaining removed words
      const remaining: string[] = [];
      while (bi < beforeWords.length) {
        remaining.push(beforeWords[bi]);
        bi++;
      }
      if (remaining.length > 0) {
        segments.push({ type: "removed", text: remaining.join("") });
      }

      // Emit remaining added words
      const remainingAdded: string[] = [];
      while (ai < afterWords.length) {
        remainingAdded.push(afterWords[ai]);
        ai++;
      }
      if (remainingAdded.length > 0) {
        segments.push({ type: "added", text: remainingAdded.join("") });
      }
    }
  }

  // Merge adjacent segments of the same type
  return mergeSegments(segments);
}

// ---------------------------------------------------------------------------
// LCS helper (word-level)
// ---------------------------------------------------------------------------

function tokenize(text: string): string[] {
  // Split into words preserving whitespace as separate tokens
  return text.match(/\S+|\s+/g) ?? [text];
}

function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;

  // Optimization: cap the LCS computation for very long texts
  if (m * n > 100_000) {
    // Fall back to simple approach for very large texts
    return simpleLCS(a, b);
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0) as number[]
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const result: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

/** Simple LCS for large texts — just find matching words in order */
function simpleLCS(a: string[], b: string[]): string[] {
  const result: string[] = [];
  let j = 0;
  for (let i = 0; i < a.length && j < b.length; i++) {
    if (a[i] === b[j]) {
      result.push(a[i]);
      j++;
    }
  }
  return result;
}

function mergeSegments(segments: DiffSegment[]): DiffSegment[] {
  if (segments.length === 0) return segments;
  const merged: DiffSegment[] = [segments[0]];
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1];
    if (last.type === segments[i].type) {
      last.text += segments[i].text;
    } else {
      merged.push({ ...segments[i] });
    }
  }
  return merged.filter((s) => s.text.length > 0);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string")) {
      return value.join(", ");
    }
    return JSON.stringify(value, null, 2);
  }
  return JSON.stringify(value, null, 2);
}

function safeGetValue(obj: ResumeData, path: string): unknown {
  try {
    return getValueByPointer(obj as unknown as Record<string, unknown>, path);
  } catch {
    return undefined;
  }
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
