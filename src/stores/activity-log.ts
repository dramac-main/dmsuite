// =============================================================================
// DMSuite — Activity Log Store
// Records every significant action across all tools so Chiko can browse
// history and revert to any previous state. Non-persisted (session only).
// =============================================================================

import { create } from "zustand";
import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityEntry {
  id: string;
  timestamp: number;
  toolId: string;
  action: string;
  description: string;
  /** JSON-serialized full state snapshot BEFORE the action (for revert) */
  snapshot: string;
  source: "user" | "chiko";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ENTRIES_PER_TOOL = 50;

function genId(): string {
  return `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// Source tracking — set by withActivityLogging wrapper
// ---------------------------------------------------------------------------

let _chikoMode = false;

/** Returns "chiko" if called within a manifest wrapper, else "user" */
export function actionSource(): "user" | "chiko" {
  return _chikoMode ? "chiko" : "user";
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ActivityLogState {
  log: Record<string, ActivityEntry[]>;

  /** Record an activity entry. Returns the entry ID. */
  logActivity: (
    toolId: string,
    action: string,
    description: string,
    snapshot: unknown,
    source?: "user" | "chiko",
  ) => string;

  /** Get recent entries for a tool (newest last). */
  getLog: (toolId: string, limit?: number) => ActivityEntry[];

  /** Get a specific entry by tool + entry ID. */
  getEntry: (toolId: string, entryId: string) => ActivityEntry | undefined;

  /** Parse and return the snapshot for an entry. */
  getSnapshot: (toolId: string, entryId: string) => unknown | undefined;

  /** Clear all entries for a tool. */
  clearLog: (toolId: string) => void;
}

export const useActivityLog = create<ActivityLogState>()((set, get) => ({
  log: {},

  logActivity: (toolId, action, description, snapshot, source) => {
    const id = genId();
    set((state) => {
      const entries = [
        ...(state.log[toolId] ?? []),
        {
          id,
          timestamp: Date.now(),
          toolId,
          action,
          description,
          snapshot: JSON.stringify(snapshot),
          source: source ?? actionSource(),
        },
      ];
      return { log: { ...state.log, [toolId]: entries.slice(-MAX_ENTRIES_PER_TOOL) } };
    });
    return id;
  },

  getLog: (toolId, limit = 20) => (get().log[toolId] ?? []).slice(-limit),

  getEntry: (toolId, entryId) =>
    (get().log[toolId] ?? []).find((e) => e.id === entryId),

  getSnapshot: (toolId, entryId) => {
    const entry = get().getEntry(toolId, entryId);
    if (!entry) return undefined;
    try {
      return JSON.parse(entry.snapshot);
    } catch {
      return undefined;
    }
  },

  clearLog: (toolId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [toolId]: _, ...rest } = state.log;
      return { log: rest };
    }),
}));

// ---------------------------------------------------------------------------
// Manifest Wrapper — auto-logs all Chiko actions + adds history actions
// ---------------------------------------------------------------------------

/**
 * Wraps a Chiko action manifest to:
 *  1. Auto-log every executed action (before-snapshot) into the activity log
 *  2. Add `getActivityLog` and `revertToState` actions for history browsing
 *
 * @param manifest        - The original tool manifest
 * @param getFullSnapshot - Returns the full raw state object for snapshot storage
 * @param restoreSnapshot - Restores a full state from a snapshot object
 */
export function withActivityLogging(
  manifest: ChikoActionManifest,
  getFullSnapshot: () => unknown,
  restoreSnapshot: (snapshot: unknown) => void,
): ChikoActionManifest {
  const originalExecute = manifest.executeAction;

  const historyActions = [
    {
      name: "getActivityLog",
      description:
        "Get recent activity history for this tool. Returns entries with IDs that can be used with revertToState. Use this when the user asks to undo, revert, or see what changed.",
      parameters: {
        type: "object" as const,
        properties: {
          limit: {
            type: "number" as const,
            description: "Max entries to return (default 10)",
          },
        },
      },
      category: "History",
    },
    {
      name: "revertToState",
      description:
        "Revert the design to a previous state by activity entry ID. Call getActivityLog first to find the right entry. Each entry's snapshot is the state BEFORE that action was taken — reverting restores that snapshot.",
      parameters: {
        type: "object" as const,
        properties: {
          entryId: {
            type: "string" as const,
            description: "Activity entry ID to revert to",
          },
        },
        required: ["entryId"],
      },
      category: "History",
      destructive: true,
    },
  ];

  return {
    ...manifest,
    actions: [...manifest.actions, ...historyActions],
    executeAction: (
      actionName: string,
      params: Record<string, unknown>,
    ): ChikoActionResult => {
      // ── Handle history meta-actions ──
      if (actionName === "getActivityLog") {
        const limit = (params.limit as number) || 10;
        const entries = useActivityLog.getState().getLog(manifest.toolId, limit);
        return {
          success: true,
          message: `${entries.length} activity entries`,
          newState: {
            activityLog: entries.map((e) => ({
              id: e.id,
              time: new Date(e.timestamp).toLocaleTimeString(),
              action: e.action,
              description: e.description,
              source: e.source,
            })),
          },
        };
      }

      if (actionName === "revertToState") {
        const entryId = params.entryId as string;
        if (!entryId) {
          return { success: false, message: "Missing entryId parameter" };
        }
        const snapshot = useActivityLog
          .getState()
          .getSnapshot(manifest.toolId, entryId);
        if (!snapshot) {
          return { success: false, message: `Entry "${entryId}" not found` };
        }
        // Log the revert itself before restoring
        const beforeRevert = getFullSnapshot();
        restoreSnapshot(snapshot);
        useActivityLog.getState().logActivity(
          manifest.toolId,
          "revertToState",
          `Reverted to state from entry ${entryId}`,
          beforeRevert,
          "chiko",
        );
        return { success: true, message: "Reverted to previous state" };
      }

      // ── Regular action execution with activity logging ──
      const readOnlyActions = ["readCurrentState", "getActivityLog"];
      const isReadOnly = readOnlyActions.includes(actionName);

      // Capture before-snapshot for non-read actions
      const beforeSnapshot = isReadOnly ? null : getFullSnapshot();

      // Set chiko source flag so any store-level logging uses correct source
      _chikoMode = true;
      const result = originalExecute(actionName, params);
      _chikoMode = false;

      // Log the action if it was successful and mutating
      if (result.success && !isReadOnly && beforeSnapshot !== null) {
        useActivityLog.getState().logActivity(
          manifest.toolId,
          actionName,
          result.message,
          beforeSnapshot,
          "chiko",
        );
      }

      return result;
    },
  };
}
