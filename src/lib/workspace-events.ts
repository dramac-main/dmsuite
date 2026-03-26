// =============================================================================
// DMSuite — Workspace Event Constants
// Typed event names and dispatch helpers for workspace ↔ shell communication.
// =============================================================================

/** Workspace event names — used by workspace components to notify the shell */
export const WORKSPACE_EVENTS = {
  /** Dispatched when workspace state has been modified */
  DIRTY: "workspace:dirty",
  /** Dispatched when a milestone is reached (input, content, edited, exported) */
  PROGRESS: "workspace:progress",
} as const;

/** Milestone types used in workspace:progress events */
export type WorkspaceMilestone = "input" | "content" | "edited" | "exported";

/** Dispatch a workspace:dirty event */
export function dispatchDirty(): void {
  window.dispatchEvent(new CustomEvent(WORKSPACE_EVENTS.DIRTY));
}

/** Dispatch a workspace:progress milestone event */
export function dispatchProgress(milestone: WorkspaceMilestone): void {
  window.dispatchEvent(
    new CustomEvent(WORKSPACE_EVENTS.PROGRESS, { detail: { milestone } }),
  );
}
