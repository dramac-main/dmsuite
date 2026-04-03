// =============================================================================
// DMSuite — AI Flow Builder Store
// Zustand store with persist + immer + temporal for undo/redo.
// =============================================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import type {
  FlowNodeData,
  PlaygroundMessage,
  SavedFlow,
} from "@/types/flow-builder";
import { getNodeDefinition } from "@/lib/ai-flow-builder/node-registry";

// ── Types ───────────────────────────────────────────────────────────────────

export interface FlowNode {
  id: string;
  type: string; // always "flowNode" for ReactFlow
  position: { x: number; y: number };
  data: FlowNodeData;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  animated?: boolean;
}

export interface AIFlowBuilderForm {
  /** Flow metadata */
  flowName: string;
  flowDescription: string;
  /** Canvas state */
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: { x: number; y: number; zoom: number };
  /** Playground chat */
  chatMessages: PlaygroundMessage[];
  /** Execution state */
  isExecuting: boolean;
  /** Selected node for inspector */
  selectedNodeId: string | null;
  /** Saved flows library */
  savedFlows: SavedFlow[];
  /** Counter for generating unique node IDs */
  nodeCounter: number;
}

const DEFAULT_FORM: AIFlowBuilderForm = {
  flowName: "Untitled Flow",
  flowDescription: "",
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  chatMessages: [],
  isExecuting: false,
  selectedNodeId: null,
  savedFlows: [],
  nodeCounter: 0,
};

interface AIFlowBuilderState {
  form: AIFlowBuilderForm;

  // ── Form-level actions ──
  setForm: (form: AIFlowBuilderForm) => void;
  resetForm: () => void;
  updateField: <K extends keyof AIFlowBuilderForm>(key: K, value: AIFlowBuilderForm[K]) => void;

  // ── Flow metadata ──
  setFlowName: (name: string) => void;
  setFlowDescription: (desc: string) => void;

  // ── Node actions ──
  addNode: (definitionType: string, position: { x: number; y: number }) => string;
  removeNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  updateNodeParam: (nodeId: string, key: string, value: string | number | boolean) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeData: (nodeId: string, patch: Partial<FlowNodeData>) => void;
  setNodeStatus: (nodeId: string, status: "running" | "complete" | "error", output?: string, error?: string) => void;
  clearNodeStatuses: () => void;
  toggleNodeFrozen: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // ── Edge actions ──
  addEdge: (edge: Omit<FlowEdge, "id">) => void;
  removeEdge: (edgeId: string) => void;
  setEdges: (edges: FlowEdge[]) => void;

  // ── Selection ──
  selectNode: (nodeId: string | null) => void;

  // ── Canvas ──
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setNodes: (nodes: FlowNode[]) => void;

  // ── Playground ──
  addChatMessage: (msg: PlaygroundMessage) => void;
  clearChat: () => void;
  setIsExecuting: (v: boolean) => void;

  // ── Flow management ──
  loadFlow: (flow: SavedFlow) => void;
  saveCurrentFlow: () => SavedFlow;
  deleteSavedFlow: (flowId: string) => void;

  // ── Bulk operations ──
  clearCanvas: () => void;
}

export const useAIFlowBuilderEditor = create<AIFlowBuilderState>()(
  temporal(
    persist(
      immer<AIFlowBuilderState>((set, get) => ({
        form: DEFAULT_FORM,

        // ── Form-level ──
        setForm: (form) => set({ form }),
        resetForm: () => set({ form: { ...DEFAULT_FORM, savedFlows: get().form.savedFlows } }),
        updateField: (key, value) =>
          set((s) => {
            (s.form as Record<string, unknown>)[key] = value;
          }),

        // ── Flow metadata ──
        setFlowName: (name) =>
          set((s) => {
            s.form.flowName = name;
          }),
        setFlowDescription: (desc) =>
          set((s) => {
            s.form.flowDescription = desc;
          }),

        // ── Node actions ──
        addNode: (definitionType, position) => {
          const def = getNodeDefinition(definitionType);
          if (!def) return "";

          const paramValues: Record<string, string | number | boolean> = {};
          for (const p of def.params) {
            paramValues[p.key] = p.defaultValue;
          }

          let newId = "";
          set((s) => {
            s.form.nodeCounter += 1;
            newId = `node-${s.form.nodeCounter}`;
            s.form.nodes.push({
              id: newId,
              type: "flowNode",
              position,
              data: {
                definitionType: def.type,
                label: def.name,
                description: def.description,
                category: def.category,
                color: def.color,
                icon: def.icon,
                inputs: [...def.inputs],
                outputs: [...def.outputs],
                params: [...def.params],
                paramValues,
              },
            });
          });
          return newId;
        },

        removeNode: (nodeId) =>
          set((s) => {
            s.form.nodes = s.form.nodes.filter((n) => n.id !== nodeId);
            s.form.edges = s.form.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId
            );
            if (s.form.selectedNodeId === nodeId) {
              s.form.selectedNodeId = null;
            }
          }),

        updateNodePosition: (nodeId, position) =>
          set((s) => {
            const node = s.form.nodes.find((n) => n.id === nodeId);
            if (node) node.position = position;
          }),

        updateNodeParam: (nodeId, key, value) =>
          set((s) => {
            const node = s.form.nodes.find((n) => n.id === nodeId);
            if (node) node.data.paramValues[key] = value;
          }),

        updateNodeLabel: (nodeId, label) =>
          set((s) => {
            const node = s.form.nodes.find((n) => n.id === nodeId);
            if (node) node.data.label = label;
          }),

        updateNodeData: (nodeId, patch) =>
          set((s) => {
            const node = s.form.nodes.find((n) => n.id === nodeId);
            if (node) Object.assign(node.data, patch);
          }),

        setNodeStatus: (nodeId, status, output, error) =>
          set((s) => {
            const node = s.form.nodes.find((n) => n.id === nodeId);
            if (!node) return;
            node.data.isRunning = status === "running";
            node.data.isComplete = status === "complete";
            node.data.hasError = status === "error";
            if (output !== undefined) node.data.lastOutput = output;
            if (error !== undefined) node.data.errorMessage = error;
          }),

        clearNodeStatuses: () =>
          set((s) => {
            for (const node of s.form.nodes) {
              node.data.isRunning = false;
              node.data.isComplete = false;
              node.data.hasError = false;
              node.data.errorMessage = undefined;
              node.data.lastOutput = undefined;
            }
          }),

        toggleNodeFrozen: (nodeId) =>
          set((s) => {
            const node = s.form.nodes.find((n) => n.id === nodeId);
            if (node) node.data.isFrozen = !node.data.isFrozen;
          }),

        duplicateNode: (nodeId) =>
          set((s) => {
            const node = s.form.nodes.find((n) => n.id === nodeId);
            if (!node) return;
            s.form.nodeCounter += 1;
            const newId = `node-${s.form.nodeCounter}`;
            s.form.nodes.push({
              id: newId,
              type: "flowNode",
              position: { x: node.position.x + 50, y: node.position.y + 50 },
              data: JSON.parse(JSON.stringify({
                ...node.data,
                isRunning: false,
                isComplete: false,
                hasError: false,
                errorMessage: undefined,
                lastOutput: undefined,
              })),
            });
          }),

        // ── Edge actions ──
        addEdge: (edge) =>
          set((s) => {
            const id = `e-${edge.source}-${edge.sourceHandle}-${edge.target}-${edge.targetHandle}`;
            // Prevent duplicates
            if (s.form.edges.some((e) => e.id === id)) return;
            s.form.edges.push({ ...edge, id });
          }),

        removeEdge: (edgeId) =>
          set((s) => {
            s.form.edges = s.form.edges.filter((e) => e.id !== edgeId);
          }),

        setEdges: (edges) =>
          set((s) => {
            s.form.edges = edges;
          }),

        // ── Selection ──
        selectNode: (nodeId) =>
          set((s) => {
            s.form.selectedNodeId = nodeId;
          }),

        // ── Canvas ──
        setViewport: (viewport) =>
          set((s) => {
            s.form.viewport = viewport;
          }),

        setNodes: (nodes) =>
          set((s) => {
            s.form.nodes = nodes;
          }),

        // ── Playground ──
        addChatMessage: (msg) =>
          set((s) => {
            s.form.chatMessages.push(msg);
          }),

        clearChat: () =>
          set((s) => {
            s.form.chatMessages = [];
          }),

        setIsExecuting: (v) =>
          set((s) => {
            s.form.isExecuting = v;
          }),

        // ── Flow management ──
        loadFlow: (flow) =>
          set((s) => {
            s.form.flowName = flow.name;
            s.form.flowDescription = flow.description;
            s.form.nodes = flow.nodes.map((n) => ({
              ...n,
              type: "flowNode",
            }));
            s.form.edges = flow.edges;
            if (flow.viewport) s.form.viewport = flow.viewport;
            s.form.selectedNodeId = null;
            s.form.chatMessages = [];
            s.form.isExecuting = false;
            // Ensure nodeCounter is higher than any existing node
            const maxNum = flow.nodes.reduce((max, n) => {
              const num = parseInt(n.id.replace("node-", ""), 10);
              return isNaN(num) ? max : Math.max(max, num);
            }, 0);
            s.form.nodeCounter = Math.max(s.form.nodeCounter, maxNum);
          }),

        saveCurrentFlow: () => {
          const { form } = get();
          const now = new Date().toISOString();
          const flow: SavedFlow = {
            id: `flow-${Date.now()}`,
            name: form.flowName,
            description: form.flowDescription,
            nodes: form.nodes.map((n) => ({
              id: n.id,
              type: n.type,
              position: n.position,
              data: n.data,
            })),
            edges: form.edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
            })),
            viewport: form.viewport,
            createdAt: now,
            updatedAt: now,
          };

          set((s) => {
            s.form.savedFlows.push(flow);
          });

          return flow;
        },

        deleteSavedFlow: (flowId) =>
          set((s) => {
            s.form.savedFlows = s.form.savedFlows.filter((f) => f.id !== flowId);
          }),

        // ── Bulk ──
        clearCanvas: () =>
          set((s) => {
            s.form.nodes = [];
            s.form.edges = [];
            s.form.selectedNodeId = null;
            s.form.nodeCounter = 0;
          }),
      })),
      {
        name: "dmsuite-ai-flow-builder",
        partialize: (state) => ({
          form: {
            ...state.form,
            // Don't persist transient execution state
            isExecuting: false,
            chatMessages: state.form.chatMessages.slice(-50), // Keep last 50 messages
          },
        }),
      }
    ),
    {
      // Temporal (undo/redo) options — limit history to 50 entries
      limit: 50,
      // Only track meaningful changes (not viewport/selection)
      equality: (a, b) => {
        const aNodes = JSON.stringify(a.form.nodes);
        const bNodes = JSON.stringify(b.form.nodes);
        const aEdges = JSON.stringify(a.form.edges);
        const bEdges = JSON.stringify(b.form.edges);
        return aNodes === bNodes && aEdges === bEdges;
      },
    }
  )
);
