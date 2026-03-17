// =============================================================================
// DMSuite — Chiko Action Registry Store
// Central Zustand store that holds all registered tool manifests and provides
// execute/read capabilities for Chiko's Action System (Layer 1).
// No persistence — manifests are re-registered on component mount.
// =============================================================================

import { create } from "zustand";

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

/** Describes a single action a tool exposes to Chiko */
export interface ChikoActionDescriptor {
  /** Machine-readable action name — matches the store function name */
  name: string;
  /** Human-readable description for the AI to understand what this does */
  description: string;
  /** JSON Schema describing the parameters this action accepts */
  parameters: Record<string, unknown>;
  /** Grouping label for UI organization */
  category: string;
  /** Whether this action is destructive (resets, deletes, removes) */
  destructive?: boolean;
}

/** What a tool registers with Chiko */
export interface ChikoActionManifest {
  /** Which tool this manifest belongs to (e.g., "sales-book-editor") */
  toolId: string;
  /** Human-readable tool name for AI context */
  toolName: string;
  /** List of all actions this tool exposes to Chiko */
  actions: ChikoActionDescriptor[];
  /** Returns current tool state as a plain object for AI to read */
  getState: () => Record<string, unknown>;
  /** Executes a named action with given parameters */
  executeAction: (actionName: string, params: Record<string, unknown>) => ChikoActionResult;
}

/** What comes back after executing an action */
export interface ChikoActionResult {
  success: boolean;
  message: string;
  newState?: Record<string, unknown>;
}

/** Matches the format expected by Claude's tool_use or OpenAI's function_calling */
export interface AIToolDescriptor {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/** When the AI decides to call an action */
export interface ChikoActionRequest {
  /** The action to execute (format: "toolId__actionName") */
  action: string;
  /** Parameters for the action */
  params: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Registry State
// ---------------------------------------------------------------------------

interface ChikoActionRegistryState {
  manifests: Map<string, ChikoActionManifest>;
  register: (manifest: ChikoActionManifest) => void;
  unregister: (toolId: string) => void;
  getActionDescriptorsForAI: () => AIToolDescriptor[];
  execute: (toolId: string, actionName: string, params: Record<string, unknown>) => ChikoActionResult;
  readState: (toolId: string) => Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChikoActionRegistry = create<ChikoActionRegistryState>()((set, get) => ({
  manifests: new Map(),

  register: (manifest) =>
    set((state) => {
      const next = new Map(state.manifests);
      next.set(manifest.toolId, manifest);
      return { manifests: next };
    }),

  unregister: (toolId) =>
    set((state) => {
      const next = new Map(state.manifests);
      next.delete(toolId);
      return { manifests: next };
    }),

  getActionDescriptorsForAI: () => {
    const descriptors: AIToolDescriptor[] = [];
    const { manifests } = get();
    for (const [, manifest] of manifests) {
      for (const action of manifest.actions) {
        // Claude requires alphanumeric + underscores only for tool names
        const toolName = `${manifest.toolId.replace(/-/g, "_")}__${action.name}`;
        const schema = action.parameters as {
          type?: string;
          properties?: Record<string, unknown>;
          required?: string[];
        };
        descriptors.push({
          name: toolName,
          description: `[${manifest.toolName}] ${action.description}`,
          input_schema: {
            type: "object",
            properties: schema.properties ?? {},
            required: schema.required,
          },
        });
      }
    }
    return descriptors;
  },

  execute: (toolId, actionName, params) => {
    const { manifests } = get();
    const manifest = manifests.get(toolId);
    if (!manifest) {
      return { success: false, message: `Tool "${toolId}" is not registered` };
    }
    const action = manifest.actions.find((a) => a.name === actionName);
    if (!action) {
      return { success: false, message: `Action "${actionName}" not found on tool "${toolId}"` };
    }
    return manifest.executeAction(actionName, params);
  },

  readState: (toolId) => {
    const { manifests } = get();
    const manifest = manifests.get(toolId);
    if (!manifest) return null;
    return manifest.getState();
  },
}));
