// =============================================================================
// Chiko AI Manifest — AI Flow Builder
// 30+ actions for visual AI workflow building, node manipulation, flow
// execution, template loading, and playground chat.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import type { SavedFlow } from "@/types/flow-builder";
import {
  getAllNodeDefinitions,
  getNodeDefinition,
  getNodesByCategory,
} from "@/lib/ai-flow-builder/node-registry";
import { FLOW_TEMPLATES, getFlowTemplate } from "@/data/ai-flow-builder-templates";

function ok(message: string): ChikoActionResult {
  return { success: true, message };
}

function fail(message: string): ChikoActionResult {
  return { success: false, message };
}

/**
 * Create the Chiko manifest for the AI Flow Builder.
 * Accepts the zustand hook so it can call `.getState()` without React context.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createAIFlowBuilderManifest(
  useStore: { getState: () => any }
): ChikoActionManifest {
  // Helper to get typed state
  const store = () => useStore.getState() as Record<string, unknown> & {
    form: {
      flowName: string;
      flowDescription: string;
      nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: {
          definitionType: string;
          label: string;
          description: string;
          category: string;
          paramValues: Record<string, string | number | boolean>;
          isFrozen?: boolean;
          isRunning?: boolean;
          isComplete?: boolean;
          hasError?: boolean;
          lastOutput?: string;
          errorMessage?: string;
        };
      }>;
      edges: Array<{
        id: string;
        source: string;
        target: string;
        sourceHandle: string;
        targetHandle: string;
      }>;
      chatMessages: Array<{ role: string; content: string }>;
      isExecuting: boolean;
      selectedNodeId: string | null;
      savedFlows: SavedFlow[];
    };
    // Store actions
    setFlowName: (name: string) => void;
    setFlowDescription: (desc: string) => void;
    addNode: (type: string, position: { x: number; y: number }) => string;
    removeNode: (id: string) => void;
    updateNodeParam: (nodeId: string, key: string, value: string | number | boolean) => void;
    updateNodeLabel: (nodeId: string, label: string) => void;
    updateNodeData: (nodeId: string, patch: Record<string, unknown>) => void;
    toggleNodeFrozen: (nodeId: string) => void;
    duplicateNode: (nodeId: string) => void;
    clearNodeStatuses: () => void;
    addEdge: (edge: { source: string; target: string; sourceHandle: string; targetHandle: string }) => void;
    removeEdge: (edgeId: string) => void;
    selectNode: (nodeId: string | null) => void;
    addChatMessage: (msg: { role: string; content: string; timestamp: string }) => void;
    clearChat: () => void;
    loadFlow: (flow: SavedFlow) => void;
    saveCurrentFlow: () => SavedFlow;
    deleteSavedFlow: (flowId: string) => void;
    clearCanvas: () => void;
    resetForm: () => void;
  };

  const form = () => store().form;

  return {
    toolId: "ai-flow-builder",
    toolName: "AI Flow Builder",

    actions: [
      // ── Flow Metadata ──
      {
        name: "set_flow_name",
        description: "Set the name/title of the current flow",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "New flow name" },
          },
          required: ["name"],
        },
        category: "Flow",
      },
      {
        name: "set_flow_description",
        description: "Set the description of the current flow",
        parameters: {
          type: "object",
          properties: {
            description: { type: "string", description: "Flow description" },
          },
          required: ["description"],
        },
        category: "Flow",
      },

      // ── Node Operations ──
      {
        name: "add_node",
        description: "Add a new node to the canvas. Available types: chat-input, text-input, file-loader, url-loader, chat-output, text-output, data-output, openai-model, anthropic-model, local-model, prompt-template, few-shot-prompt, system-message, text-splitter, json-parser, recursive-character-splitter, output-parser, conversation-memory, entity-memory, zero-shot-agent, react-agent, calculator, web-search, api-request",
        parameters: {
          type: "object",
          properties: {
            nodeType: { type: "string", description: "Node definition type from the registry" },
            x: { type: "number", description: "X position on canvas (default: 200)" },
            y: { type: "number", description: "Y position on canvas (default: 200)" },
          },
          required: ["nodeType"],
        },
        category: "Nodes",
      },
      {
        name: "remove_node",
        description: "Remove a node from the canvas (also removes its connections)",
        parameters: {
          type: "object",
          properties: {
            nodeId: { type: "string", description: "ID of the node to remove" },
          },
          required: ["nodeId"],
        },
        category: "Nodes",
      },
      {
        name: "update_node_param",
        description: "Update a parameter value on a node (e.g., model name, temperature, prompt text)",
        parameters: {
          type: "object",
          properties: {
            nodeId: { type: "string" },
            paramKey: { type: "string", description: "Parameter key name" },
            value: { type: ["string", "number", "boolean"], description: "New value for the parameter" },
          },
          required: ["nodeId", "paramKey", "value"],
        },
        category: "Nodes",
      },
      {
        name: "rename_node",
        description: "Rename a node's display label",
        parameters: {
          type: "object",
          properties: {
            nodeId: { type: "string" },
            label: { type: "string", description: "New display label" },
          },
          required: ["nodeId", "label"],
        },
        category: "Nodes",
      },
      {
        name: "duplicate_node",
        description: "Duplicate an existing node (creates a copy offset by 50px)",
        parameters: {
          type: "object",
          properties: {
            nodeId: { type: "string" },
          },
          required: ["nodeId"],
        },
        category: "Nodes",
      },
      {
        name: "toggle_node_frozen",
        description: "Toggle whether a node is frozen (frozen nodes are skipped during execution)",
        parameters: {
          type: "object",
          properties: {
            nodeId: { type: "string" },
          },
          required: ["nodeId"],
        },
        category: "Nodes",
      },
      {
        name: "select_node",
        description: "Select a node (opens it in the inspector panel)",
        parameters: {
          type: "object",
          properties: {
            nodeId: { type: "string", description: "Node ID, or empty to deselect" },
          },
          required: ["nodeId"],
        },
        category: "Nodes",
      },
      {
        name: "list_nodes",
        description: "List all nodes currently on the canvas with their types and parameters",
        parameters: { type: "object", properties: {} },
        category: "Nodes",
      },

      // ── Edge / Connection Operations ──
      {
        name: "connect_nodes",
        description: "Connect two nodes by creating an edge between a source output port and a target input port",
        parameters: {
          type: "object",
          properties: {
            sourceNodeId: { type: "string" },
            sourcePort: { type: "string", description: "Source output port name (e.g., 'message', 'data', 'model')" },
            targetNodeId: { type: "string" },
            targetPort: { type: "string", description: "Target input port name" },
          },
          required: ["sourceNodeId", "sourcePort", "targetNodeId", "targetPort"],
        },
        category: "Connections",
      },
      {
        name: "disconnect_edge",
        description: "Remove a connection/edge between nodes",
        parameters: {
          type: "object",
          properties: {
            edgeId: { type: "string", description: "Edge ID to remove" },
          },
          required: ["edgeId"],
        },
        category: "Connections",
      },
      {
        name: "list_connections",
        description: "List all connections between nodes",
        parameters: { type: "object", properties: {} },
        category: "Connections",
      },

      // ── Template Operations ──
      {
        name: "load_template",
        description: "Load a pre-built flow template. Available: template-basic-chatbot, template-rag-pipeline, template-agent-tools, template-content-generator, template-translation-pipeline, template-multi-model",
        parameters: {
          type: "object",
          properties: {
            templateId: { type: "string", description: "Template ID to load" },
          },
          required: ["templateId"],
        },
        category: "Templates",
      },
      {
        name: "list_templates",
        description: "List all available flow templates",
        parameters: { type: "object", properties: {} },
        category: "Templates",
      },

      // ── Flow Management ──
      {
        name: "save_flow",
        description: "Save the current flow to the saved flows library",
        parameters: { type: "object", properties: {} },
        category: "Flow Management",
      },
      {
        name: "load_saved_flow",
        description: "Load a previously saved flow from the library",
        parameters: {
          type: "object",
          properties: {
            flowId: { type: "string", description: "Saved flow ID to load" },
          },
          required: ["flowId"],
        },
        category: "Flow Management",
      },
      {
        name: "delete_saved_flow",
        description: "Delete a saved flow from the library",
        parameters: {
          type: "object",
          properties: {
            flowId: { type: "string" },
          },
          required: ["flowId"],
        },
        category: "Flow Management",
        destructive: true,
      },
      {
        name: "list_saved_flows",
        description: "List all saved flows in the library",
        parameters: { type: "object", properties: {} },
        category: "Flow Management",
      },

      // ── Playground / Chat ──
      {
        name: "send_playground_message",
        description: "Send a message in the playground chat to test the flow",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string", description: "Message to send" },
          },
          required: ["message"],
        },
        category: "Playground",
      },
      {
        name: "clear_playground",
        description: "Clear all playground chat messages",
        parameters: { type: "object", properties: {} },
        category: "Playground",
      },

      // ── Canvas Operations ──
      {
        name: "clear_canvas",
        description: "Remove all nodes and edges from the canvas",
        parameters: { type: "object", properties: {} },
        category: "Canvas",
        destructive: true,
      },
      {
        name: "clear_node_statuses",
        description: "Reset all node execution statuses (running/complete/error indicators)",
        parameters: { type: "object", properties: {} },
        category: "Canvas",
      },

      // ── Registry / Info ──
      {
        name: "list_available_node_types",
        description: "List all available node types organized by category",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },
      {
        name: "get_node_info",
        description: "Get detailed information about a specific node type from the registry",
        parameters: {
          type: "object",
          properties: {
            nodeType: { type: "string", description: "Node definition type" },
          },
          required: ["nodeType"],
        },
        category: "Info",
      },

      // ── Build Flow (multi-step) ──
      {
        name: "build_flow",
        description: "Build a complete flow from a high-level description. Creates nodes and connects them automatically. Provide a list of steps, each specifying a node type, position, and parameter overrides.",
        parameters: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nodeType: { type: "string" },
                  label: { type: "string" },
                  x: { type: "number" },
                  y: { type: "number" },
                  params: { type: "object", description: "Key-value pairs for node parameters" },
                },
                required: ["nodeType"],
              },
              description: "Ordered list of nodes to create",
            },
            connections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fromStep: { type: "number", description: "0-based index of source step" },
                  fromPort: { type: "string" },
                  toStep: { type: "number", description: "0-based index of target step" },
                  toPort: { type: "string" },
                },
                required: ["fromStep", "fromPort", "toStep", "toPort"],
              },
              description: "Connections between steps",
            },
          },
          required: ["steps"],
        },
        category: "Flow",
      },

      // ── Reset ──
      {
        name: "reset_all",
        description: "Reset everything to defaults. THIS IS DESTRUCTIVE!",
        parameters: { type: "object", properties: {} },
        category: "Settings",
        destructive: true,
      },
    ],

    getState: () => {
      const f = form();
      const byCategory = getNodesByCategory();
      return {
        flowName: f.flowName,
        flowDescription: f.flowDescription,
        nodeCount: f.nodes.length,
        edgeCount: f.edges.length,
        isExecuting: f.isExecuting,
        selectedNodeId: f.selectedNodeId,
        chatMessageCount: f.chatMessages.length,
        savedFlowCount: f.savedFlows.length,
        templateCount: FLOW_TEMPLATES.length,
        availableNodeTypes: Object.entries(byCategory).map(([cat, defs]) => ({
          category: cat,
          count: defs.length,
          types: defs.map((d) => d.type),
        })),
        nodes: f.nodes.map((n) => ({
          id: n.id,
          type: n.data.definitionType,
          label: n.data.label,
          category: n.data.category,
          position: n.position,
          frozen: n.data.isFrozen || false,
          running: n.data.isRunning || false,
          complete: n.data.isComplete || false,
          hasError: n.data.hasError || false,
          params: n.data.paramValues,
        })),
        edges: f.edges.map((e) => ({
          id: e.id,
          from: `${e.source}:${e.sourceHandle}`,
          to: `${e.target}:${e.targetHandle}`,
        })),
        savedFlows: f.savedFlows.map((sf) => ({
          id: sf.id,
          name: sf.name,
          nodeCount: sf.nodes.length,
          updatedAt: sf.updatedAt,
        })),
      };
    },

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const s = store();
      const f = form();

      switch (actionName) {
        // ── Flow Metadata ──
        case "set_flow_name": {
          s.setFlowName(params.name as string);
          return ok(`Flow renamed to "${params.name}"`);
        }
        case "set_flow_description": {
          s.setFlowDescription(params.description as string);
          return ok("Flow description updated");
        }

        // ── Node Operations ──
        case "add_node": {
          const nodeType = params.nodeType as string;
          const def = getNodeDefinition(nodeType);
          if (!def) return fail(`Unknown node type: ${nodeType}. Use list_available_node_types to see available types.`);
          const x = (params.x as number) || 200;
          const y = (params.y as number) || 200;
          const id = s.addNode(nodeType, { x, y });
          if (!id) return fail(`Failed to add node of type "${nodeType}"`);
          return ok(`Added ${def.name} node (ID: ${id}) at (${x}, ${y})`);
        }
        case "remove_node": {
          const nodeId = params.nodeId as string;
          const node = f.nodes.find((n) => n.id === nodeId);
          if (!node) return fail(`Node ${nodeId} not found`);
          s.removeNode(nodeId);
          return ok(`Removed node "${node.data.label}" (${nodeId})`);
        }
        case "update_node_param": {
          const nodeId = params.nodeId as string;
          const node = f.nodes.find((n) => n.id === nodeId);
          if (!node) return fail(`Node ${nodeId} not found`);
          s.updateNodeParam(nodeId, params.paramKey as string, params.value as string | number | boolean);
          return ok(`Updated ${node.data.label}.${params.paramKey} = ${params.value}`);
        }
        case "rename_node": {
          const nodeId = params.nodeId as string;
          const node = f.nodes.find((n) => n.id === nodeId);
          if (!node) return fail(`Node ${nodeId} not found`);
          s.updateNodeLabel(nodeId, params.label as string);
          return ok(`Renamed node ${nodeId} to "${params.label}"`);
        }
        case "duplicate_node": {
          const nodeId = params.nodeId as string;
          const node = f.nodes.find((n) => n.id === nodeId);
          if (!node) return fail(`Node ${nodeId} not found`);
          s.duplicateNode(nodeId);
          return ok(`Duplicated node "${node.data.label}"`);
        }
        case "toggle_node_frozen": {
          const nodeId = params.nodeId as string;
          const node = f.nodes.find((n) => n.id === nodeId);
          if (!node) return fail(`Node ${nodeId} not found`);
          s.toggleNodeFrozen(nodeId);
          const isFrozen = !node.data.isFrozen;
          return ok(`Node "${node.data.label}" ${isFrozen ? "frozen" : "unfrozen"}`);
        }
        case "select_node": {
          const nodeId = (params.nodeId as string) || null;
          s.selectNode(nodeId);
          return ok(nodeId ? `Selected node ${nodeId}` : "Deselected all nodes");
        }
        case "list_nodes": {
          if (f.nodes.length === 0) return ok("Canvas is empty — no nodes.");
          const lines = f.nodes.map((n) => {
            const paramSummary = Object.entries(n.data.paramValues)
              .slice(0, 3)
              .map(([k, v]) => `${k}=${typeof v === "string" ? v.slice(0, 30) : v}`)
              .join(", ");
            return `• ${n.id} | ${n.data.label} (${n.data.definitionType}) [${n.data.category}] — ${paramSummary}${n.data.isFrozen ? " ❄️" : ""}`;
          });
          return ok(`${f.nodes.length} nodes on canvas:\n${lines.join("\n")}`);
        }

        // ── Edge / Connection Operations ──
        case "connect_nodes": {
          const sourceNode = f.nodes.find((n) => n.id === params.sourceNodeId);
          const targetNode = f.nodes.find((n) => n.id === params.targetNodeId);
          if (!sourceNode) return fail(`Source node ${params.sourceNodeId} not found`);
          if (!targetNode) return fail(`Target node ${params.targetNodeId} not found`);
          s.addEdge({
            source: params.sourceNodeId as string,
            sourceHandle: `${params.sourceNodeId}-output-${params.sourcePort}`,
            target: params.targetNodeId as string,
            targetHandle: `${params.targetNodeId}-input-${params.targetPort}`,
          });
          return ok(`Connected ${sourceNode.data.label}:${params.sourcePort} → ${targetNode.data.label}:${params.targetPort}`);
        }
        case "disconnect_edge": {
          const edgeId = params.edgeId as string;
          const edge = f.edges.find((e) => e.id === edgeId);
          if (!edge) return fail(`Edge ${edgeId} not found`);
          s.removeEdge(edgeId);
          return ok(`Disconnected edge ${edgeId}`);
        }
        case "list_connections": {
          if (f.edges.length === 0) return ok("No connections.");
          const lines = f.edges.map((e) => {
            const src = f.nodes.find((n) => n.id === e.source);
            const tgt = f.nodes.find((n) => n.id === e.target);
            return `• ${e.id}: ${src?.data.label || e.source}:${e.sourceHandle.split("-output-")[1] || "?"} → ${tgt?.data.label || e.target}:${e.targetHandle.split("-input-")[1] || "?"}`;
          });
          return ok(`${f.edges.length} connections:\n${lines.join("\n")}`);
        }

        // ── Template Operations ──
        case "load_template": {
          const template = getFlowTemplate(params.templateId as string);
          if (!template) {
            const available = FLOW_TEMPLATES.map((t) => `${t.id}: ${t.name}`).join(", ");
            return fail(`Template not found. Available: ${available}`);
          }
          s.loadFlow(template);
          s.clearNodeStatuses();
          return ok(`Loaded template "${template.name}" (${template.nodes.length} nodes, ${template.edges.length} edges)`);
        }
        case "list_templates": {
          const lines = FLOW_TEMPLATES.map(
            (t) => `• ${t.id}: ${t.name} — ${t.description} (${t.nodes.length} nodes)`
          );
          return ok(`${FLOW_TEMPLATES.length} templates:\n${lines.join("\n")}`);
        }

        // ── Flow Management ──
        case "save_flow": {
          const saved = s.saveCurrentFlow();
          return ok(`Flow saved as "${saved.name}" (ID: ${saved.id})`);
        }
        case "load_saved_flow": {
          const flow = f.savedFlows.find((sf) => sf.id === params.flowId);
          if (!flow) return fail(`Saved flow ${params.flowId} not found`);
          s.loadFlow(flow);
          return ok(`Loaded flow "${flow.name}"`);
        }
        case "delete_saved_flow": {
          const flow = f.savedFlows.find((sf) => sf.id === params.flowId);
          if (!flow) return fail(`Saved flow ${params.flowId} not found`);
          s.deleteSavedFlow(params.flowId as string);
          return ok(`Deleted saved flow "${flow.name}"`);
        }
        case "list_saved_flows": {
          if (f.savedFlows.length === 0) return ok("No saved flows yet.");
          const lines = f.savedFlows.map(
            (sf) => `• ${sf.id}: ${sf.name} (${sf.nodes.length} nodes, updated ${sf.updatedAt})`
          );
          return ok(`${f.savedFlows.length} saved flows:\n${lines.join("\n")}`);
        }

        // ── Playground ──
        case "send_playground_message": {
          s.addChatMessage({
            role: "user",
            content: params.message as string,
            timestamp: new Date().toISOString(),
          });
          return ok(`Message sent to playground: "${(params.message as string).slice(0, 50)}..."`);
        }
        case "clear_playground": {
          s.clearChat();
          return ok("Playground chat cleared");
        }

        // ── Canvas Operations ──
        case "clear_canvas": {
          s.clearCanvas();
          return ok("Canvas cleared — all nodes and edges removed");
        }
        case "clear_node_statuses": {
          s.clearNodeStatuses();
          return ok("All node statuses reset");
        }

        // ── Registry / Info ──
        case "list_available_node_types": {
          const byCategory = getNodesByCategory();
          const lines = Object.entries(byCategory).map(([cat, defs]) => {
            const types = defs.map((d) => d.type).join(", ");
            return `${cat} (${defs.length}): ${types}`;
          });
          return ok(`Available node types:\n${lines.join("\n")}`);
        }
        case "get_node_info": {
          const def = getNodeDefinition(params.nodeType as string);
          if (!def) return fail(`Unknown node type: ${params.nodeType}`);
          const paramList = def.params.map((p) => `  ${p.key} (${p.type}): ${p.label} [default: ${p.defaultValue}]`);
          const inputList = def.inputs.map((p) => `  ${p.name} (${p.dataType})`);
          const outputList = def.outputs.map((p) => `  ${p.name} (${p.dataType})`);
          return ok(
            `${def.name} [${def.category}]\n${def.description}\n\nInputs:\n${inputList.join("\n") || "  (none)"}\nOutputs:\n${outputList.join("\n") || "  (none)"}\nParameters:\n${paramList.join("\n") || "  (none)"}`
          );
        }

        // ── Build Flow ──
        case "build_flow": {
          s.clearCanvas();
          s.clearNodeStatuses();

          const steps = (params.steps as Array<{
            nodeType: string;
            label?: string;
            x?: number;
            y?: number;
            params?: Record<string, string | number | boolean>;
          }>) || [];

          const nodeIds: string[] = [];
          for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const x = step.x ?? 100 + i * 300;
            const y = step.y ?? 200;
            const id = s.addNode(step.nodeType, { x, y });
            if (!id) return fail(`Failed to add node of type "${step.nodeType}" at step ${i}`);
            nodeIds.push(id);

            if (step.label) s.updateNodeLabel(id, step.label);
            if (step.params) {
              for (const [key, value] of Object.entries(step.params)) {
                s.updateNodeParam(id, key, value);
              }
            }
          }

          const connections = (params.connections as Array<{
            fromStep: number;
            fromPort: string;
            toStep: number;
            toPort: string;
          }>) || [];

          for (const conn of connections) {
            const srcId = nodeIds[conn.fromStep];
            const tgtId = nodeIds[conn.toStep];
            if (!srcId || !tgtId) continue;
            s.addEdge({
              source: srcId,
              sourceHandle: `${srcId}-output-${conn.fromPort}`,
              target: tgtId,
              targetHandle: `${tgtId}-input-${conn.toPort}`,
            });
          }

          return ok(`Built flow with ${nodeIds.length} nodes and ${connections.length} connections`);
        }

        // ── Reset ──
        case "reset_all": {
          s.resetForm();
          return ok("All flow builder data reset to defaults");
        }

        default:
          return fail(`Unknown action: ${actionName}`);
      }
    },
  };
}
