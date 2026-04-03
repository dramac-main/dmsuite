// =============================================================================
// DMSuite — AI Flow Builder Type System
// Defines all types for the visual AI workflow builder (Langflow-inspired).
// =============================================================================

/** Port data types — determines what can connect to what */
export type PortDataType =
  | "message"    // Chat messages / text
  | "data"       // Generic data objects
  | "model"      // Language model references
  | "memory"     // Conversation memory
  | "tool"       // Agent tools
  | "embeddings" // Vector embeddings
  | "any";       // Accepts any type

/** Port direction */
export type PortDirection = "input" | "output";

/** A single port on a node */
export interface FlowPort {
  id: string;
  name: string;
  dataType: PortDataType;
  direction: PortDirection;
  /** Whether this port is required for execution */
  required?: boolean;
  /** Whether this port accepts multiple connections */
  multi?: boolean;
}

/** Node categories matching Langflow's component groups */
export type FlowNodeCategory =
  | "inputs"
  | "outputs"
  | "models"
  | "prompts"
  | "processing"
  | "memory"
  | "agents"
  | "tools";

/** Color map for port data types (Langflow-inspired) */
export const PORT_COLORS: Record<PortDataType, string> = {
  message:    "#6366f1", // Indigo
  data:       "#ef4444", // Red
  model:      "#d946ef", // Fuchsia
  memory:     "#f97316", // Orange
  tool:       "#06b6d4", // Cyan
  embeddings: "#10b981", // Emerald
  any:        "#6b7280", // Gray
};

/** Category colors for the node palette */
export const CATEGORY_COLORS: Record<FlowNodeCategory, string> = {
  inputs:     "#6366f1",
  outputs:    "#10b981",
  models:     "#d946ef",
  prompts:    "#f59e0b",
  processing: "#ef4444",
  memory:     "#f97316",
  agents:     "#8b5cf6",
  tools:      "#06b6d4",
};

/** Category display names */
export const CATEGORY_LABELS: Record<FlowNodeCategory, string> = {
  inputs:     "Inputs",
  outputs:    "Outputs",
  models:     "Models",
  prompts:    "Prompts",
  processing: "Processing",
  memory:     "Memory",
  agents:     "Agents",
  tools:      "Tools",
};

/** A parameter field for node configuration */
export interface FlowNodeParam {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "boolean" | "json" | "slider";
  defaultValue: string | number | boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

/** Definition of a node type in the registry */
export interface FlowNodeDefinition {
  type: string;
  name: string;
  description: string;
  category: FlowNodeCategory;
  icon: string; // SVG path or emoji
  inputs: FlowPort[];
  outputs: FlowPort[];
  params: FlowNodeParam[];
  /** Color accent for the node header */
  color: string;
}

/** Runtime state of a node's parameter values */
export type FlowNodeParamValues = Record<string, string | number | boolean>;

/** Data stored on each ReactFlow node */
export interface FlowNodeData {
  [key: string]: unknown;
  definitionType: string;
  label: string;
  description: string;
  category: FlowNodeCategory;
  color: string;
  icon: string;
  inputs: FlowPort[];
  outputs: FlowPort[];
  params: FlowNodeParam[];
  paramValues: FlowNodeParamValues;
  /** Last run output (for display) */
  lastOutput?: string;
  /** Whether this node is currently running */
  isRunning?: boolean;
  /** Whether this node has errored */
  hasError?: boolean;
  /** Error message if hasError */
  errorMessage?: string;
  /** Whether this node has completed */
  isComplete?: boolean;
  /** Frozen state — skip re-execution */
  isFrozen?: boolean;
}

/** Execution result for a single node */
export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  output: string;
  error?: string;
  duration?: number;
}

/** Full execution result for a flow run */
export interface FlowExecutionResult {
  success: boolean;
  results: NodeExecutionResult[];
  finalOutput: string;
  totalDuration: number;
  error?: string;
}

/** A saved flow (for export/import and templates) */
export interface SavedFlow {
  id: string;
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: FlowNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;
  }>;
  viewport?: { x: number; y: number; zoom: number };
  createdAt: string;
  updatedAt: string;
}

/** Chat message in the playground */
export interface PlaygroundMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}
