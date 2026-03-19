// =============================================================================
// DMSuite — Chiko Workflow Engine Store
// Tracks multi-step workflow state for cross-tool orchestration (Layer 5).
// Persists to localStorage so workflows survive page navigations and refreshes.
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export interface StepAction {
  /** The manifest action to call (e.g., "updateBranding", "prefillFromMemory") */
  actionName: string;
  /** Parameters for the action */
  params: Record<string, unknown>;
  /** Whether this action has been executed */
  executed: boolean;
  /** Result message from execution */
  result: string | null;
}

export interface WorkflowStep {
  /** Unique step ID */
  id: string;
  /** Human-readable description */
  label: string;
  /** The tool workspace this step targets */
  toolId: string;
  /** Step state */
  status: "pending" | "navigating" | "in-progress" | "completed" | "skipped" | "failed";
  /** The actions to execute on the target tool */
  actions: StepAction[];
  /** Summary of what was done (filled after completion) */
  result: string | null;
  /** Error message if step failed */
  error: string | null;
}

export type WorkflowStatus =
  | "running"
  | "paused"
  | "awaiting-navigation"
  | "awaiting-confirmation"
  | "completed"
  | "cancelled";

export interface ActiveWorkflow {
  /** Unique workflow ID (UUID) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Current workflow state */
  status: WorkflowStatus;
  /** Ordered list of steps */
  steps: WorkflowStep[];
  /** Zero-based index of the step currently being executed */
  currentStepIndex: number;
  /** ISO timestamp when the workflow was started */
  createdAt: string;
  /** ISO timestamp when paused, if paused */
  pausedAt: string | null;
  /** ISO timestamp when completed */
  completedAt: string | null;
}

export interface WorkflowHistoryEntry {
  id: string;
  name: string;
  status: "completed" | "cancelled";
  stepCount: number;
  completedSteps: number;
  skippedSteps: number;
  failedSteps: number;
  createdAt: string;
  completedAt: string;
}

// ---------------------------------------------------------------------------
// Store State
// ---------------------------------------------------------------------------

interface ChikoWorkflowState {
  /** The currently running workflow, or null if idle */
  activeWorkflow: ActiveWorkflow | null;
  /** Completed workflows (last 10, for reference) */
  workflowHistory: WorkflowHistoryEntry[];

  // -- Actions --
  startWorkflow: (
    name: string,
    steps: { label: string; toolId: string; actions: { actionName: string; params: Record<string, unknown> }[] }[],
  ) => ActiveWorkflow;
  advanceStep: () => { done: boolean; nextStep?: WorkflowStep; summary?: string };
  markStepCompleted: (result: string) => void;
  markStepFailed: (error: string) => void;
  markActionExecuted: (stepIndex: number, actionIndex: number, result: string) => void;
  pauseWorkflow: () => string;
  resumeWorkflow: () => { success: boolean; currentStep?: WorkflowStep; message: string };
  cancelWorkflow: () => string;
  skipStep: () => { skippedLabel: string; nextStep?: WorkflowStep };
  completeWorkflow: () => void;
  getActiveWorkflow: () => ActiveWorkflow | null;
  getProgressSummary: () => string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_HISTORY = 10;

function generateWorkflowId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `wf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function toHistoryEntry(wf: ActiveWorkflow): WorkflowHistoryEntry {
  return {
    id: wf.id,
    name: wf.name,
    status: wf.status === "completed" ? "completed" : "cancelled",
    stepCount: wf.steps.length,
    completedSteps: wf.steps.filter((s) => s.status === "completed").length,
    skippedSteps: wf.steps.filter((s) => s.status === "skipped").length,
    failedSteps: wf.steps.filter((s) => s.status === "failed").length,
    createdAt: wf.createdAt,
    completedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChikoWorkflows = create<ChikoWorkflowState>()(
  persist(
    (set, get) => ({
      activeWorkflow: null,
      workflowHistory: [],

      startWorkflow: (name, steps) => {
        const wf: ActiveWorkflow = {
          id: generateWorkflowId(),
          name,
          status: "running",
          steps: steps.map((s) => ({
            id: generateStepId(),
            label: s.label,
            toolId: s.toolId,
            status: "pending",
            actions: s.actions.map((a) => ({
              actionName: a.actionName,
              params: a.params,
              executed: false,
              result: null,
            })),
            result: null,
            error: null,
          })),
          currentStepIndex: 0,
          createdAt: new Date().toISOString(),
          pausedAt: null,
          completedAt: null,
        };
        // Mark first step as navigating
        if (wf.steps.length > 0) {
          wf.steps[0].status = "navigating";
        }
        set({ activeWorkflow: wf });
        return wf;
      },

      advanceStep: () => {
        const { activeWorkflow: wf } = get();
        if (!wf) return { done: true, summary: "No active workflow" };

        const updatedSteps = [...wf.steps];
        const current = updatedSteps[wf.currentStepIndex];
        if (current && current.status !== "completed" && current.status !== "skipped" && current.status !== "failed") {
          current.status = "completed";
          current.result = current.result || "Completed";
        }

        const nextIndex = wf.currentStepIndex + 1;
        if (nextIndex >= wf.steps.length) {
          // All steps done — complete the workflow
          const completed: ActiveWorkflow = {
            ...wf,
            steps: updatedSteps,
            status: "completed",
            completedAt: new Date().toISOString(),
            currentStepIndex: wf.currentStepIndex,
          };
          const entry = toHistoryEntry(completed);
          const history = [entry, ...get().workflowHistory].slice(0, MAX_HISTORY);
          set({ activeWorkflow: null, workflowHistory: history });
          return {
            done: true,
            summary: `Workflow complete! All ${wf.steps.length} steps finished.`,
          };
        }

        // Move to next step
        updatedSteps[nextIndex].status = "navigating";
        set({
          activeWorkflow: {
            ...wf,
            steps: updatedSteps,
            currentStepIndex: nextIndex,
            status: "running",
          },
        });
        return { done: false, nextStep: updatedSteps[nextIndex] };
      },

      markStepCompleted: (result) => {
        const { activeWorkflow: wf } = get();
        if (!wf) return;
        const updatedSteps = [...wf.steps];
        const step = updatedSteps[wf.currentStepIndex];
        if (step) {
          step.status = "completed";
          step.result = result;
        }
        set({ activeWorkflow: { ...wf, steps: updatedSteps } });
      },

      markStepFailed: (error) => {
        const { activeWorkflow: wf } = get();
        if (!wf) return;
        const updatedSteps = [...wf.steps];
        const step = updatedSteps[wf.currentStepIndex];
        if (step) {
          step.status = "failed";
          step.error = error;
        }
        set({
          activeWorkflow: {
            ...wf,
            steps: updatedSteps,
            status: "paused",
            pausedAt: new Date().toISOString(),
          },
        });
      },

      markActionExecuted: (stepIndex, actionIndex, result) => {
        const { activeWorkflow: wf } = get();
        if (!wf) return;
        const updatedSteps = [...wf.steps];
        const step = updatedSteps[stepIndex];
        if (step && step.actions[actionIndex]) {
          step.actions[actionIndex] = {
            ...step.actions[actionIndex],
            executed: true,
            result,
          };
        }
        set({ activeWorkflow: { ...wf, steps: updatedSteps } });
      },

      pauseWorkflow: () => {
        const { activeWorkflow: wf } = get();
        if (!wf) return "No active workflow to pause";
        const now = new Date().toISOString();
        set({
          activeWorkflow: { ...wf, status: "paused", pausedAt: now },
        });
        const step = wf.steps[wf.currentStepIndex];
        return `Workflow paused at step ${wf.currentStepIndex + 1} of ${wf.steps.length}: ${step?.label || "unknown"}`;
      },

      resumeWorkflow: () => {
        const { activeWorkflow: wf } = get();
        if (!wf) return { success: false, message: "No active workflow to resume" };
        if (wf.status !== "paused") return { success: false, message: `Workflow is ${wf.status}, not paused` };
        const step = wf.steps[wf.currentStepIndex];
        set({
          activeWorkflow: { ...wf, status: "running", pausedAt: null },
        });
        return {
          success: true,
          currentStep: step,
          message: `Workflow resumed at step ${wf.currentStepIndex + 1} of ${wf.steps.length}: ${step?.label || "unknown"}`,
        };
      },

      cancelWorkflow: () => {
        const { activeWorkflow: wf } = get();
        if (!wf) return "No active workflow to cancel";
        const cancelled: ActiveWorkflow = { ...wf, status: "cancelled" };
        const entry = toHistoryEntry(cancelled);
        const history = [entry, ...get().workflowHistory].slice(0, MAX_HISTORY);
        set({ activeWorkflow: null, workflowHistory: history });
        return "Workflow cancelled. Changes made to individual tools are preserved — use undo on each tool to revert.";
      },

      skipStep: () => {
        const { activeWorkflow: wf } = get();
        if (!wf) return { skippedLabel: "none" };
        const updatedSteps = [...wf.steps];
        const current = updatedSteps[wf.currentStepIndex];
        if (current) {
          current.status = "skipped";
        }
        const nextIndex = wf.currentStepIndex + 1;
        if (nextIndex >= wf.steps.length) {
          // All steps done
          const completed: ActiveWorkflow = {
            ...wf,
            steps: updatedSteps,
            status: "completed",
            completedAt: new Date().toISOString(),
          };
          const entry = toHistoryEntry(completed);
          const history = [entry, ...get().workflowHistory].slice(0, MAX_HISTORY);
          set({ activeWorkflow: null, workflowHistory: history });
          return { skippedLabel: current?.label || "unknown" };
        }
        updatedSteps[nextIndex].status = "navigating";
        set({
          activeWorkflow: {
            ...wf,
            steps: updatedSteps,
            currentStepIndex: nextIndex,
          },
        });
        return {
          skippedLabel: current?.label || "unknown",
          nextStep: updatedSteps[nextIndex],
        };
      },

      completeWorkflow: () => {
        const { activeWorkflow: wf } = get();
        if (!wf) return;
        const completed: ActiveWorkflow = {
          ...wf,
          status: "completed",
          completedAt: new Date().toISOString(),
        };
        const entry = toHistoryEntry(completed);
        const history = [entry, ...get().workflowHistory].slice(0, MAX_HISTORY);
        set({ activeWorkflow: null, workflowHistory: history });
      },

      getActiveWorkflow: () => get().activeWorkflow,

      getProgressSummary: () => {
        const { activeWorkflow: wf } = get();
        if (!wf) return "No workflow is currently active.";
        const completed = wf.steps.filter((s) => s.status === "completed").length;
        const current = wf.steps[wf.currentStepIndex];
        return `Workflow "${wf.name}" — Step ${wf.currentStepIndex + 1} of ${wf.steps.length}: ${current?.label || "done"} (${completed} completed, status: ${wf.status})`;
      },
    }),
    {
      name: "dmsuite-chiko-workflows",
      partialize: (state) => ({
        activeWorkflow: state.activeWorkflow,
        workflowHistory: state.workflowHistory,
      }),
    },
  ),
);
