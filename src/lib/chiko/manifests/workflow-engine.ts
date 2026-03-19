// =============================================================================
// DMSuite — Workflow Engine Manifest for Chiko
// Global manifest — always registered while Chiko is open.
// Actions: navigateToTool, startWorkflow, advanceWorkflow, pauseWorkflow,
//          resumeWorkflow, cancelWorkflow, getWorkflowStatus, skipStep
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useChikoWorkflows } from "@/stores/chiko-workflows";
import {
  toolCategories,
  getAllToolsFlat,
  type FlatTool,
} from "@/data/tools";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findTool(toolId: string): FlatTool | null {
  const all = getAllToolsFlat();
  return all.find((t) => t.id === toolId) ?? null;
}

function getToolPath(tool: FlatTool): string {
  return `/tools/${tool.categoryId}/${tool.id}`;
}

/** Common toolIds that Chiko can navigate to */
const COMMON_TOOL_IDS = [
  "sales-book-a4",
  "sales-book-a5",
  "invoice-designer",
  "resume-cv",
  "business-card",
  "logo-generator",
  "certificate",
  "letterhead",
  "proposal-generator",
  "company-profile",
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Build the Workflow Engine manifest.
 * Requires a router reference for programmatic navigation.
 * Registered globally from ChikoAssistant (no cleanup).
 */
export function createWorkflowManifest(
  routerRef: React.RefObject<AppRouterInstance | null>,
): ChikoActionManifest {
  return {
    toolId: "workflow-engine",
    toolName: "Workflow Engine",
    actions: [
      {
        name: "navigateToTool",
        description:
          "Navigate the user to a specific tool workspace. Used as the first step when Chiko needs to work on a tool that is not currently on screen. After calling this action, wait for the tool's manifest to become available before executing actions on it.",
        parameters: {
          type: "object",
          properties: {
            toolId: {
              type: "string",
              description:
                "The tool ID to navigate to (e.g., 'sales-book-a4', 'invoice-designer', 'resume-cv')",
            },
          },
          required: ["toolId"],
        },
        category: "Navigation",
      },
      {
        name: "startWorkflow",
        description:
          "Begin a new multi-step workflow. Creates a workflow plan and starts execution. Only one workflow can be active at a time. Each step has a label, toolId, and a list of actions to execute.",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Human-readable workflow name" },
            steps: {
              type: "array",
              description:
                "Array of step objects. Each: { label (string), toolId (string), actions: [{ actionName (string), params (object) }] }",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  toolId: { type: "string" },
                  actions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        actionName: { type: "string" },
                        params: { type: "object" },
                      },
                      required: ["actionName", "params"],
                    },
                  },
                },
                required: ["label", "toolId", "actions"],
              },
            },
          },
          required: ["name", "steps"],
        },
        category: "Workflow",
      },
      {
        name: "advanceWorkflow",
        description:
          "Advance the workflow to the next step. Call this after completing all actions in the current step. If all steps are complete, this finishes the workflow.",
        parameters: { type: "object", properties: {} },
        category: "Workflow",
      },
      {
        name: "pauseWorkflow",
        description:
          "Pause the current workflow. The user can resume later. Useful when the user wants to review or manually adjust something mid-workflow.",
        parameters: { type: "object", properties: {} },
        category: "Workflow",
      },
      {
        name: "resumeWorkflow",
        description: "Resume a paused workflow from where it left off.",
        parameters: { type: "object", properties: {} },
        category: "Workflow",
      },
      {
        name: "cancelWorkflow",
        description:
          "Cancel the active workflow. This stops execution but does not undo changes already made to individual tools.",
        parameters: { type: "object", properties: {} },
        category: "Workflow",
        destructive: true,
      },
      {
        name: "getWorkflowStatus",
        description:
          "Get the current status of the active workflow, including which step is in progress and what has been completed.",
        parameters: { type: "object", properties: {} },
        category: "Workflow",
      },
      {
        name: "skipStep",
        description: "Skip the current workflow step and move to the next one.",
        parameters: { type: "object", properties: {} },
        category: "Workflow",
      },
    ],

    getState: () => {
      const wf = useChikoWorkflows.getState().activeWorkflow;
      if (!wf) {
        return {
          workflowActive: false,
          availableTools: COMMON_TOOL_IDS,
        };
      }
      return {
        workflowActive: true,
        workflowName: wf.name,
        workflowStatus: wf.status,
        currentStepIndex: wf.currentStepIndex,
        totalSteps: wf.steps.length,
        currentStepLabel: wf.steps[wf.currentStepIndex]?.label ?? "done",
        currentStepToolId: wf.steps[wf.currentStepIndex]?.toolId ?? null,
        completedSteps: wf.steps.filter((s) => s.status === "completed").length,
        stepSummary: wf.steps.map((s) => ({
          label: s.label,
          toolId: s.toolId,
          status: s.status,
        })),
        availableTools: COMMON_TOOL_IDS,
      };
    },

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useChikoWorkflows.getState();

      try {
        switch (actionName) {
          case "navigateToTool": {
            const toolId = params.toolId as string;
            if (!toolId) {
              return { success: false, message: "Missing toolId parameter" };
            }
            const tool = findTool(toolId);
            if (!tool) {
              return { success: false, message: `Tool "${toolId}" not found in the tool registry` };
            }
            const path = getToolPath(tool);
            const router = routerRef.current;
            if (!router) {
              return { success: false, message: "Navigation not available" };
            }
            // Navigate with the existing 500ms delay pattern
            setTimeout(() => router.push(path), 500);

            // If a workflow is active, mark the current step as navigating
            const wf = store.activeWorkflow;
            if (wf && wf.steps[wf.currentStepIndex]) {
              const updatedSteps = [...wf.steps];
              updatedSteps[wf.currentStepIndex] = {
                ...updatedSteps[wf.currentStepIndex],
                status: "navigating",
              };
              useChikoWorkflows.setState({
                activeWorkflow: { ...wf, steps: updatedSteps, status: "awaiting-navigation" },
              });
            }

            return { success: true, message: `Navigating to ${tool.name}...` };
          }

          case "startWorkflow": {
            const name = params.name as string;
            const steps = params.steps as {
              label: string;
              toolId: string;
              actions: { actionName: string; params: Record<string, unknown> }[];
            }[];

            if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
              return { success: false, message: "Missing workflow name or steps" };
            }

            // Check if a workflow is already active
            if (store.activeWorkflow) {
              return {
                success: false,
                message: "A workflow is already in progress. Cancel or complete it first.",
              };
            }

            // Validate tool IDs exist
            for (const step of steps) {
              const tool = findTool(step.toolId);
              if (!tool) {
                return {
                  success: false,
                  message: `Tool "${step.toolId}" in step "${step.label}" not found in the registry`,
                };
              }
            }

            const wf = store.startWorkflow(name, steps);
            return {
              success: true,
              message: `Workflow "${name}" started with ${wf.steps.length} steps. First step: ${wf.steps[0]?.label}`,
            };
          }

          case "advanceWorkflow": {
            const result = store.advanceStep();
            if (result.done) {
              return { success: true, message: result.summary || "Workflow complete!" };
            }
            return {
              success: true,
              message: `Step completed. Next: ${result.nextStep?.label} on ${result.nextStep?.toolId}`,
            };
          }

          case "pauseWorkflow": {
            const msg = store.pauseWorkflow();
            return { success: true, message: msg };
          }

          case "resumeWorkflow": {
            const result = store.resumeWorkflow();
            if (!result.success) {
              return { success: false, message: result.message };
            }
            return { success: true, message: result.message };
          }

          case "cancelWorkflow": {
            const msg = store.cancelWorkflow();
            return { success: true, message: msg };
          }

          case "getWorkflowStatus": {
            const wf = store.activeWorkflow;
            if (!wf) {
              return { success: true, message: "No workflow is currently active." };
            }
            const completed = wf.steps.filter((s) => s.status === "completed").length;
            const skipped = wf.steps.filter((s) => s.status === "skipped").length;
            const failed = wf.steps.filter((s) => s.status === "failed").length;
            const current = wf.steps[wf.currentStepIndex];
            const statusLines = wf.steps.map(
              (s, i) =>
                `${i + 1}. [${s.status}] ${s.label} (${s.toolId})${s.result ? ` — ${s.result}` : ""}${s.error ? ` — ERROR: ${s.error}` : ""}`,
            );
            return {
              success: true,
              message: `**${wf.name}** (${wf.status})\nStep ${wf.currentStepIndex + 1} of ${wf.steps.length}: ${current?.label}\nCompleted: ${completed} | Skipped: ${skipped} | Failed: ${failed}\n\n${statusLines.join("\n")}`,
            };
          }

          case "skipStep": {
            const result = store.skipStep();
            if (result.nextStep) {
              return {
                success: true,
                message: `Skipped "${result.skippedLabel}". Next: ${result.nextStep.label} on ${result.nextStep.toolId}`,
              };
            }
            return {
              success: true,
              message: `Skipped "${result.skippedLabel}". Workflow complete!`,
            };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return {
          success: false,
          message: `Action failed: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };
}
