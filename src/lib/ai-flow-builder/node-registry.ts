// =============================================================================
// DMSuite — AI Flow Builder Node Registry
// All node type definitions for the visual workflow builder.
// =============================================================================

import type {
  FlowNodeDefinition,
  FlowNodeCategory,
  FlowPort,
} from "@/types/flow-builder";
import { CATEGORY_COLORS } from "@/types/flow-builder";

// ── Helper to build ports quickly ──────────────────────────────────────────

function inp(
  id: string,
  name: string,
  dataType: FlowPort["dataType"],
  opts?: Partial<FlowPort>
): FlowPort {
  return { id, name, dataType, direction: "input", ...opts };
}

function out(
  id: string,
  name: string,
  dataType: FlowPort["dataType"],
  opts?: Partial<FlowPort>
): FlowPort {
  return { id, name, dataType, direction: "output", ...opts };
}

function catColor(cat: FlowNodeCategory): string {
  return CATEGORY_COLORS[cat];
}

// =============================================================================
// NODE DEFINITIONS — 22 node types across 8 categories
// =============================================================================

const NODE_DEFINITIONS: FlowNodeDefinition[] = [
  // ── INPUTS ────────────────────────────────────────────────────────────────
  {
    type: "text-input",
    name: "Text Input",
    description: "Provide static text to the flow",
    category: "inputs",
    icon: "📝",
    color: catColor("inputs"),
    inputs: [],
    outputs: [out("out-message", "Text", "message")],
    params: [
      {
        key: "text",
        label: "Input Text",
        type: "textarea",
        defaultValue: "",
        placeholder: "Enter your text...",
      },
    ],
  },
  {
    type: "chat-input",
    name: "Chat Input",
    description: "Receives user messages from the playground chat",
    category: "inputs",
    icon: "💬",
    color: catColor("inputs"),
    inputs: [],
    outputs: [out("out-message", "Message", "message")],
    params: [
      {
        key: "senderName",
        label: "Sender Name",
        type: "text",
        defaultValue: "User",
      },
    ],
  },
  {
    type: "file-input",
    name: "File Input",
    description: "Load text content from an uploaded file",
    category: "inputs",
    icon: "📁",
    color: catColor("inputs"),
    inputs: [],
    outputs: [out("out-data", "File Data", "data")],
    params: [
      {
        key: "fileName",
        label: "File Name",
        type: "text",
        defaultValue: "",
        placeholder: "Loaded file name will appear here",
      },
      {
        key: "fileContent",
        label: "File Content",
        type: "textarea",
        defaultValue: "",
        placeholder: "Paste file content or upload...",
      },
    ],
  },
  {
    type: "url-input",
    name: "URL Input",
    description: "Fetch and extract text content from a URL",
    category: "inputs",
    icon: "🔗",
    color: catColor("inputs"),
    inputs: [],
    outputs: [out("out-data", "Page Data", "data")],
    params: [
      {
        key: "url",
        label: "URL",
        type: "text",
        defaultValue: "",
        placeholder: "https://example.com",
      },
    ],
  },

  // ── OUTPUTS ───────────────────────────────────────────────────────────────
  {
    type: "chat-output",
    name: "Chat Output",
    description: "Send response to the playground chat",
    category: "outputs",
    icon: "💭",
    color: catColor("outputs"),
    inputs: [inp("in-message", "Message", "message", { required: true })],
    outputs: [],
    params: [
      {
        key: "senderName",
        label: "Sender Name",
        type: "text",
        defaultValue: "AI Assistant",
      },
    ],
  },
  {
    type: "text-output",
    name: "Text Output",
    description: "Display text result in the node output",
    category: "outputs",
    icon: "📄",
    color: catColor("outputs"),
    inputs: [inp("in-message", "Text", "message", { required: true })],
    outputs: [],
    params: [],
  },
  {
    type: "data-output",
    name: "Data Output",
    description: "Display structured data result",
    category: "outputs",
    icon: "📊",
    color: catColor("outputs"),
    inputs: [inp("in-data", "Data", "data", { required: true })],
    outputs: [],
    params: [
      {
        key: "format",
        label: "Display Format",
        type: "select",
        defaultValue: "json",
        options: [
          { label: "JSON", value: "json" },
          { label: "Table", value: "table" },
          { label: "Plain Text", value: "text" },
        ],
      },
    ],
  },

  // ── MODELS ────────────────────────────────────────────────────────────────
  {
    type: "claude-model",
    name: "Claude (Anthropic)",
    description: "Claude AI language model for text generation",
    category: "models",
    icon: "🧠",
    color: catColor("models"),
    inputs: [
      inp("in-prompt", "Prompt", "message", { required: true }),
      inp("in-system", "System", "message"),
      inp("in-memory", "Memory", "memory"),
    ],
    outputs: [out("out-message", "Response", "message")],
    params: [
      {
        key: "model",
        label: "Model",
        type: "select",
        defaultValue: "claude-sonnet-4-6",
        options: [
          { label: "Claude Sonnet 4.6", value: "claude-sonnet-4-6" },
          { label: "Claude Haiku 4.5", value: "claude-haiku-4-5" },
        ],
      },
      {
        key: "temperature",
        label: "Temperature",
        type: "slider",
        defaultValue: 0.7,
        min: 0,
        max: 1,
        step: 0.1,
        description: "Higher = more creative, Lower = more focused",
      },
      {
        key: "maxTokens",
        label: "Max Tokens",
        type: "number",
        defaultValue: 1024,
        min: 1,
        max: 4096,
      },
    ],
  },
  {
    type: "openai-model",
    name: "OpenAI GPT",
    description: "OpenAI GPT model for text generation",
    category: "models",
    icon: "🤖",
    color: catColor("models"),
    inputs: [
      inp("in-prompt", "Prompt", "message", { required: true }),
      inp("in-system", "System", "message"),
      inp("in-memory", "Memory", "memory"),
    ],
    outputs: [out("out-message", "Response", "message")],
    params: [
      {
        key: "model",
        label: "Model",
        type: "select",
        defaultValue: "gpt-4o",
        options: [
          { label: "GPT-4o", value: "gpt-4o" },
          { label: "GPT-4o Mini", value: "gpt-4o-mini" },
        ],
      },
      {
        key: "temperature",
        label: "Temperature",
        type: "slider",
        defaultValue: 0.7,
        min: 0,
        max: 2,
        step: 0.1,
      },
      {
        key: "maxTokens",
        label: "Max Tokens",
        type: "number",
        defaultValue: 1024,
        min: 1,
        max: 4096,
      },
    ],
  },

  // ── PROMPTS ───────────────────────────────────────────────────────────────
  {
    type: "prompt-template",
    name: "Prompt Template",
    description: "Create a prompt with {variable} placeholders",
    category: "prompts",
    icon: "📋",
    color: catColor("prompts"),
    inputs: [inp("in-variables", "Variables", "data")],
    outputs: [out("out-prompt", "Prompt", "message")],
    params: [
      {
        key: "template",
        label: "Prompt Template",
        type: "textarea",
        defaultValue: "You are a helpful assistant. {input}",
        placeholder: "Use {variable_name} for dynamic values",
        description: "Use curly braces for variables: {input}, {context}, etc.",
      },
    ],
  },
  {
    type: "system-message",
    name: "System Message",
    description: "Define a system instruction for the model",
    category: "prompts",
    icon: "⚙️",
    color: catColor("prompts"),
    inputs: [],
    outputs: [out("out-system", "System Prompt", "message")],
    params: [
      {
        key: "content",
        label: "System Message",
        type: "textarea",
        defaultValue: "You are a helpful AI assistant.",
        placeholder: "Define the AI's role and behavior...",
      },
    ],
  },
  {
    type: "few-shot-prompt",
    name: "Few-Shot Prompt",
    description: "Build a prompt with example input-output pairs",
    category: "prompts",
    icon: "📚",
    color: catColor("prompts"),
    inputs: [inp("in-input", "User Input", "message")],
    outputs: [out("out-prompt", "Prompt", "message")],
    params: [
      {
        key: "prefix",
        label: "Instruction Prefix",
        type: "textarea",
        defaultValue: "Follow these examples:",
      },
      {
        key: "examples",
        label: "Examples (JSON array)",
        type: "json",
        defaultValue: '[{"input":"Hello","output":"Hi there!"}]',
        description: 'Array of {input, output} objects',
      },
      {
        key: "suffix",
        label: "Suffix",
        type: "text",
        defaultValue: "Now respond to: {input}",
      },
    ],
  },

  // ── PROCESSING ────────────────────────────────────────────────────────────
  {
    type: "text-splitter",
    name: "Text Splitter",
    description: "Split text into chunks by separator or size",
    category: "processing",
    icon: "✂️",
    color: catColor("processing"),
    inputs: [inp("in-text", "Text", "message", { required: true })],
    outputs: [out("out-chunks", "Chunks", "data")],
    params: [
      {
        key: "method",
        label: "Split Method",
        type: "select",
        defaultValue: "size",
        options: [
          { label: "By Character Count", value: "size" },
          { label: "By Separator", value: "separator" },
          { label: "By Paragraph", value: "paragraph" },
          { label: "By Sentence", value: "sentence" },
        ],
      },
      {
        key: "chunkSize",
        label: "Chunk Size (chars)",
        type: "number",
        defaultValue: 500,
        min: 50,
        max: 10000,
      },
      {
        key: "overlap",
        label: "Overlap (chars)",
        type: "number",
        defaultValue: 50,
        min: 0,
        max: 500,
      },
      {
        key: "separator",
        label: "Custom Separator",
        type: "text",
        defaultValue: "\\n\\n",
        placeholder: "e.g. \\n\\n or ---",
      },
    ],
  },
  {
    type: "json-parser",
    name: "JSON Parser",
    description: "Parse JSON string or extract a field by path",
    category: "processing",
    icon: "🔧",
    color: catColor("processing"),
    inputs: [inp("in-text", "Text", "message", { required: true })],
    outputs: [out("out-data", "Parsed Data", "data")],
    params: [
      {
        key: "path",
        label: "JSON Path (optional)",
        type: "text",
        defaultValue: "",
        placeholder: "e.g. data.items[0].name",
        description: "Dot-notation path to extract a specific field",
      },
    ],
  },
  {
    type: "regex-extractor",
    name: "Regex Extractor",
    description: "Extract text matching a regular expression",
    category: "processing",
    icon: "🔍",
    color: catColor("processing"),
    inputs: [inp("in-text", "Text", "message", { required: true })],
    outputs: [out("out-matches", "Matches", "data")],
    params: [
      {
        key: "pattern",
        label: "Regex Pattern",
        type: "text",
        defaultValue: "",
        placeholder: "e.g. \\b[A-Z][a-z]+\\b",
      },
      {
        key: "flags",
        label: "Flags",
        type: "text",
        defaultValue: "gi",
        placeholder: "gi, gm, etc.",
      },
    ],
  },
  {
    type: "conditional-router",
    name: "Conditional Router",
    description: "Route data to different outputs based on a condition",
    category: "processing",
    icon: "🔀",
    color: catColor("processing"),
    inputs: [inp("in-data", "Input", "any", { required: true })],
    outputs: [
      out("out-true", "True", "any"),
      out("out-false", "False", "any"),
    ],
    params: [
      {
        key: "condition",
        label: "Condition Type",
        type: "select",
        defaultValue: "contains",
        options: [
          { label: "Contains text", value: "contains" },
          { label: "Equals", value: "equals" },
          { label: "Starts with", value: "starts_with" },
          { label: "Regex match", value: "regex" },
          { label: "Length greater than", value: "length_gt" },
          { label: "Is not empty", value: "not_empty" },
        ],
      },
      {
        key: "value",
        label: "Comparison Value",
        type: "text",
        defaultValue: "",
        placeholder: "Value to compare against",
      },
    ],
  },
  {
    type: "merge-node",
    name: "Merge / Combine",
    description: "Merge multiple inputs into a single output",
    category: "processing",
    icon: "🔗",
    color: catColor("processing"),
    inputs: [
      inp("in-a", "Input A", "any", { required: true }),
      inp("in-b", "Input B", "any"),
      inp("in-c", "Input C", "any"),
    ],
    outputs: [out("out-merged", "Merged", "message")],
    params: [
      {
        key: "separator",
        label: "Join Separator",
        type: "text",
        defaultValue: "\\n\\n",
      },
      {
        key: "template",
        label: "Merge Template (optional)",
        type: "textarea",
        defaultValue: "",
        placeholder: "Use {A}, {B}, {C} for inputs. Leave empty for simple join.",
      },
    ],
  },

  // ── MEMORY ────────────────────────────────────────────────────────────────
  {
    type: "conversation-memory",
    name: "Conversation Memory",
    description: "Store and retrieve conversation history",
    category: "memory",
    icon: "🧩",
    color: catColor("memory"),
    inputs: [
      inp("in-human", "Human Message", "message"),
      inp("in-ai", "AI Message", "message"),
    ],
    outputs: [out("out-memory", "Memory", "memory")],
    params: [
      {
        key: "maxMessages",
        label: "Max Messages",
        type: "number",
        defaultValue: 20,
        min: 2,
        max: 100,
        description: "Maximum number of messages to keep in memory",
      },
      {
        key: "sessionId",
        label: "Session ID",
        type: "text",
        defaultValue: "default",
        description: "Unique ID to separate different conversations",
      },
    ],
  },
  {
    type: "summary-memory",
    name: "Summary Memory",
    description: "Summarize conversation when it exceeds limit",
    category: "memory",
    icon: "📝",
    color: catColor("memory"),
    inputs: [
      inp("in-human", "Human Message", "message"),
      inp("in-ai", "AI Message", "message"),
    ],
    outputs: [out("out-memory", "Memory", "memory")],
    params: [
      {
        key: "maxTokens",
        label: "Max Tokens Before Summary",
        type: "number",
        defaultValue: 2000,
        min: 500,
        max: 10000,
      },
    ],
  },

  // ── AGENTS ────────────────────────────────────────────────────────────────
  {
    type: "react-agent",
    name: "ReAct Agent",
    description: "Reasoning-Action agent that can use tools to solve tasks",
    category: "agents",
    icon: "🕵️",
    color: catColor("agents"),
    inputs: [
      inp("in-prompt", "Task", "message", { required: true }),
      inp("in-tools", "Tools", "tool", { multi: true }),
      inp("in-memory", "Memory", "memory"),
    ],
    outputs: [out("out-result", "Result", "message")],
    params: [
      {
        key: "model",
        label: "Model",
        type: "select",
        defaultValue: "claude-sonnet-4-6",
        options: [
          { label: "Claude Sonnet 4.6", value: "claude-sonnet-4-6" },
          { label: "GPT-4o", value: "gpt-4o" },
        ],
      },
      {
        key: "maxIterations",
        label: "Max Iterations",
        type: "number",
        defaultValue: 5,
        min: 1,
        max: 20,
      },
      {
        key: "verbose",
        label: "Verbose Logging",
        type: "boolean",
        defaultValue: true,
      },
    ],
  },
  {
    type: "sequential-agent",
    name: "Sequential Agent",
    description: "Execute a chain of steps in sequence (pipeline)",
    category: "agents",
    icon: "⛓️",
    color: catColor("agents"),
    inputs: [
      inp("in-prompt", "Input", "message", { required: true }),
      inp("in-memory", "Memory", "memory"),
    ],
    outputs: [out("out-result", "Result", "message")],
    params: [
      {
        key: "model",
        label: "Model",
        type: "select",
        defaultValue: "claude-sonnet-4-6",
        options: [
          { label: "Claude Sonnet 4.6", value: "claude-sonnet-4-6" },
          { label: "Claude Haiku 4.5", value: "claude-haiku-4-5" },
        ],
      },
      {
        key: "steps",
        label: "Steps (JSON)",
        type: "json",
        defaultValue: '["Understand the task","Plan the approach","Execute"]',
        description: "Array of step instructions for the agent to follow",
      },
    ],
  },

  // ── TOOLS ─────────────────────────────────────────────────────────────────
  {
    type: "web-search-tool",
    name: "Web Search",
    description: "Search the web and return results (simulated)",
    category: "tools",
    icon: "🌐",
    color: catColor("tools"),
    inputs: [inp("in-query", "Query", "message", { required: true })],
    outputs: [out("out-tool", "Tool", "tool"), out("out-results", "Results", "data")],
    params: [
      {
        key: "numResults",
        label: "Number of Results",
        type: "number",
        defaultValue: 5,
        min: 1,
        max: 20,
      },
    ],
  },
  {
    type: "calculator-tool",
    name: "Calculator",
    description: "Evaluate mathematical expressions safely",
    category: "tools",
    icon: "🧮",
    color: catColor("tools"),
    inputs: [inp("in-expression", "Expression", "message", { required: true })],
    outputs: [out("out-tool", "Tool", "tool"), out("out-result", "Result", "message")],
    params: [],
  },
  {
    type: "api-call-tool",
    name: "API Call",
    description: "Make HTTP requests to external APIs",
    category: "tools",
    icon: "🔌",
    color: catColor("tools"),
    inputs: [inp("in-body", "Request Body", "data")],
    outputs: [out("out-tool", "Tool", "tool"), out("out-response", "Response", "data")],
    params: [
      {
        key: "method",
        label: "HTTP Method",
        type: "select",
        defaultValue: "GET",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "DELETE", value: "DELETE" },
        ],
      },
      {
        key: "url",
        label: "URL",
        type: "text",
        defaultValue: "",
        placeholder: "https://api.example.com/endpoint",
      },
      {
        key: "headers",
        label: "Headers (JSON)",
        type: "json",
        defaultValue: '{"Content-Type":"application/json"}',
      },
    ],
  },
];

// ── Registry API ──────────────────────────────────────────────────────────

/** Get all node definitions */
export function getAllNodeDefinitions(): FlowNodeDefinition[] {
  return NODE_DEFINITIONS;
}

/** Get a node definition by type */
export function getNodeDefinition(type: string): FlowNodeDefinition | undefined {
  return NODE_DEFINITIONS.find((n) => n.type === type);
}

/** Get node definitions grouped by category */
export function getNodesByCategory(): Record<FlowNodeCategory, FlowNodeDefinition[]> {
  const grouped = {} as Record<FlowNodeCategory, FlowNodeDefinition[]>;
  const categories: FlowNodeCategory[] = [
    "inputs", "outputs", "models", "prompts", "processing", "memory", "agents", "tools",
  ];
  for (const cat of categories) {
    grouped[cat] = NODE_DEFINITIONS.filter((n) => n.category === cat);
  }
  return grouped;
}

/** Get count of node types by category */
export function getNodeCountByCategory(): Record<FlowNodeCategory, number> {
  const counts = {} as Record<FlowNodeCategory, number>;
  const categories: FlowNodeCategory[] = [
    "inputs", "outputs", "models", "prompts", "processing", "memory", "agents", "tools",
  ];
  for (const cat of categories) {
    counts[cat] = NODE_DEFINITIONS.filter((n) => n.category === cat).length;
  }
  return counts;
}
