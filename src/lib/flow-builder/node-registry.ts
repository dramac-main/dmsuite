// =============================================================================
// DMSuite — AI Flow Builder Node Registry
// Defines all available node types for the visual workflow builder.
// Inspired by Langflow's component system.
// =============================================================================

import type { FlowNodeDefinition } from "@/types/flow-builder";

// ── INPUT NODES ─────────────────────────────────────────────────────────────

const textInput: FlowNodeDefinition = {
  type: "text-input",
  name: "Text Input",
  description: "Provide text input to the flow",
  category: "inputs",
  icon: "T",
  color: "#6366f1",
  inputs: [],
  outputs: [{ id: "out-message", name: "Message", dataType: "message", direction: "output" }],
  params: [
    { key: "value", label: "Input Value", type: "textarea", defaultValue: "", placeholder: "Enter text...", description: "The text to send into the flow" },
  ],
};

const chatInput: FlowNodeDefinition = {
  type: "chat-input",
  name: "Chat Input",
  description: "Receive chat messages from the user in the Playground",
  category: "inputs",
  icon: "💬",
  color: "#6366f1",
  inputs: [],
  outputs: [{ id: "out-message", name: "Message", dataType: "message", direction: "output" }],
  params: [
    { key: "senderName", label: "Sender Name", type: "text", defaultValue: "User", placeholder: "User" },
  ],
};

const fileInput: FlowNodeDefinition = {
  type: "file-input",
  name: "File Loader",
  description: "Load text content from uploaded files (TXT, MD, CSV, JSON)",
  category: "inputs",
  icon: "📄",
  color: "#6366f1",
  inputs: [],
  outputs: [{ id: "out-data", name: "Data", dataType: "data", direction: "output" }],
  params: [
    { key: "content", label: "File Content", type: "textarea", defaultValue: "", placeholder: "Paste file content here..." },
    { key: "fileName", label: "File Name", type: "text", defaultValue: "document.txt" },
  ],
};

const urlInput: FlowNodeDefinition = {
  type: "url-input",
  name: "URL Loader",
  description: "Fetch and extract text content from a web URL",
  category: "inputs",
  icon: "🌐",
  color: "#6366f1",
  inputs: [],
  outputs: [{ id: "out-data", name: "Data", dataType: "data", direction: "output" }],
  params: [
    { key: "url", label: "URL", type: "text", defaultValue: "", placeholder: "https://example.com" },
  ],
};

// ── OUTPUT NODES ────────────────────────────────────────────────────────────

const chatOutput: FlowNodeDefinition = {
  type: "chat-output",
  name: "Chat Output",
  description: "Display the final response in the Playground chat",
  category: "outputs",
  icon: "💬",
  color: "#10b981",
  inputs: [{ id: "in-message", name: "Message", dataType: "message", direction: "input", required: true }],
  outputs: [],
  params: [
    { key: "senderName", label: "Sender Name", type: "text", defaultValue: "AI Assistant" },
  ],
};

const textOutput: FlowNodeDefinition = {
  type: "text-output",
  name: "Text Output",
  description: "Display text output from the flow",
  category: "outputs",
  icon: "📝",
  color: "#10b981",
  inputs: [{ id: "in-message", name: "Message", dataType: "message", direction: "input", required: true }],
  outputs: [],
  params: [
    { key: "label", label: "Output Label", type: "text", defaultValue: "Result" },
  ],
};

const jsonOutput: FlowNodeDefinition = {
  type: "json-output",
  name: "JSON Output",
  description: "Output structured JSON data",
  category: "outputs",
  icon: "{ }",
  color: "#10b981",
  inputs: [{ id: "in-data", name: "Data", dataType: "data", direction: "input", required: true }],
  outputs: [],
  params: [
    { key: "pretty", label: "Pretty Print", type: "boolean", defaultValue: true },
  ],
};

// ── MODEL NODES ─────────────────────────────────────────────────────────────

const claudeModel: FlowNodeDefinition = {
  type: "claude-model",
  name: "Claude (Anthropic)",
  description: "Anthropic Claude language model — the primary AI engine in DMSuite",
  category: "models",
  icon: "🧠",
  color: "#d946ef",
  inputs: [
    { id: "in-prompt", name: "Prompt", dataType: "message", direction: "input", required: true },
    { id: "in-system", name: "System Message", dataType: "message", direction: "input" },
    { id: "in-memory", name: "Memory", dataType: "memory", direction: "input" },
  ],
  outputs: [
    { id: "out-response", name: "Response", dataType: "message", direction: "output" },
    { id: "out-model", name: "Language Model", dataType: "model", direction: "output" },
  ],
  params: [
    { key: "model", label: "Model", type: "select", defaultValue: "claude-sonnet-4-20250514", options: [
      { label: "Claude Sonnet 4", value: "claude-sonnet-4-20250514" },
      { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
      { label: "Claude 3.5 Haiku", value: "claude-3-5-haiku-20241022" },
      { label: "Claude 3 Opus", value: "claude-3-opus-20240229" },
    ]},
    { key: "temperature", label: "Temperature", type: "slider", defaultValue: 0.7, min: 0, max: 1, step: 0.05, description: "Controls randomness. Lower = more deterministic." },
    { key: "maxTokens", label: "Max Tokens", type: "number", defaultValue: 2048, min: 1, max: 8192, description: "Maximum response length" },
    { key: "systemPrompt", label: "System Prompt", type: "textarea", defaultValue: "You are a helpful AI assistant.", placeholder: "System instructions..." },
  ],
};

const customLLM: FlowNodeDefinition = {
  type: "custom-llm",
  name: "Custom LLM",
  description: "Connect to any OpenAI-compatible language model API",
  category: "models",
  icon: "⚙️",
  color: "#d946ef",
  inputs: [
    { id: "in-prompt", name: "Prompt", dataType: "message", direction: "input", required: true },
    { id: "in-system", name: "System Message", dataType: "message", direction: "input" },
  ],
  outputs: [
    { id: "out-response", name: "Response", dataType: "message", direction: "output" },
    { id: "out-model", name: "Language Model", dataType: "model", direction: "output" },
  ],
  params: [
    { key: "apiUrl", label: "API URL", type: "text", defaultValue: "", placeholder: "https://api.openai.com/v1/chat/completions" },
    { key: "apiKey", label: "API Key", type: "text", defaultValue: "", placeholder: "sk-..." },
    { key: "modelName", label: "Model Name", type: "text", defaultValue: "gpt-4", placeholder: "gpt-4" },
    { key: "temperature", label: "Temperature", type: "slider", defaultValue: 0.7, min: 0, max: 2, step: 0.05 },
    { key: "maxTokens", label: "Max Tokens", type: "number", defaultValue: 2048, min: 1, max: 16384 },
  ],
};

// ── PROMPT NODES ────────────────────────────────────────────────────────────

const promptTemplate: FlowNodeDefinition = {
  type: "prompt-template",
  name: "Prompt Template",
  description: "Create a prompt with variable placeholders using {variable} syntax",
  category: "prompts",
  icon: "📋",
  color: "#f59e0b",
  inputs: [
    { id: "in-variables", name: "Variables", dataType: "data", direction: "input" },
  ],
  outputs: [
    { id: "out-prompt", name: "Prompt", dataType: "message", direction: "output" },
  ],
  params: [
    { key: "template", label: "Template", type: "textarea", defaultValue: "You are a {role}. Please {task} about {topic}.", placeholder: "Use {variable} for placeholders", description: "Variables in {curly braces} will be replaced with input values" },
  ],
};

const systemMessage: FlowNodeDefinition = {
  type: "system-message",
  name: "System Message",
  description: "Define the AI's behavior, personality, and constraints",
  category: "prompts",
  icon: "🎭",
  color: "#f59e0b",
  inputs: [],
  outputs: [
    { id: "out-message", name: "System Message", dataType: "message", direction: "output" },
  ],
  params: [
    { key: "content", label: "System Message", type: "textarea", defaultValue: "You are a helpful, accurate, and friendly AI assistant.", placeholder: "Define the AI's behavior..." },
  ],
};

const fewShotPrompt: FlowNodeDefinition = {
  type: "few-shot",
  name: "Few-Shot Examples",
  description: "Provide example input/output pairs to guide the AI's behavior",
  category: "prompts",
  icon: "📚",
  color: "#f59e0b",
  inputs: [],
  outputs: [
    { id: "out-examples", name: "Examples", dataType: "message", direction: "output" },
  ],
  params: [
    { key: "examples", label: "Examples (JSON array)", type: "textarea", defaultValue: '[\n  {"input": "Hello", "output": "Hi there! How can I help you?"}\n]', description: "JSON array of {input, output} pairs" },
  ],
};

// ── PROCESSING NODES ────────────────────────────────────────────────────────

const textSplitter: FlowNodeDefinition = {
  type: "text-splitter",
  name: "Text Splitter",
  description: "Split text into smaller chunks for processing or embedding",
  category: "processing",
  icon: "✂️",
  color: "#ef4444",
  inputs: [{ id: "in-data", name: "Text", dataType: "data", direction: "input", required: true }],
  outputs: [{ id: "out-chunks", name: "Chunks", dataType: "data", direction: "output" }],
  params: [
    { key: "chunkSize", label: "Chunk Size", type: "number", defaultValue: 1000, min: 100, max: 10000, description: "Maximum characters per chunk" },
    { key: "overlap", label: "Overlap", type: "number", defaultValue: 200, min: 0, max: 2000, description: "Character overlap between chunks" },
    { key: "separator", label: "Separator", type: "text", defaultValue: "\\n\\n", description: "Primary split character(s)" },
  ],
};

const combineDocuments: FlowNodeDefinition = {
  type: "combine-docs",
  name: "Combine Documents",
  description: "Merge multiple text inputs into a single document",
  category: "processing",
  icon: "📎",
  color: "#ef4444",
  inputs: [
    { id: "in-data-1", name: "Document 1", dataType: "data", direction: "input", required: true },
    { id: "in-data-2", name: "Document 2", dataType: "data", direction: "input" },
  ],
  outputs: [{ id: "out-combined", name: "Combined", dataType: "data", direction: "output" }],
  params: [
    { key: "separator", label: "Join Separator", type: "text", defaultValue: "\\n\\n---\\n\\n" },
  ],
};

const conditional: FlowNodeDefinition = {
  type: "conditional",
  name: "Conditional Router",
  description: "Route flow based on a condition — if/else branching",
  category: "processing",
  icon: "🔀",
  color: "#ef4444",
  inputs: [{ id: "in-data", name: "Input", dataType: "message", direction: "input", required: true }],
  outputs: [
    { id: "out-true", name: "True", dataType: "message", direction: "output" },
    { id: "out-false", name: "False", dataType: "message", direction: "output" },
  ],
  params: [
    { key: "condition", label: "Condition", type: "select", defaultValue: "contains", options: [
      { label: "Contains", value: "contains" },
      { label: "Not Contains", value: "not-contains" },
      { label: "Equals", value: "equals" },
      { label: "Starts With", value: "starts-with" },
      { label: "Ends With", value: "ends-with" },
      { label: "Is Empty", value: "is-empty" },
      { label: "Length Greater Than", value: "length-gt" },
    ]},
    { key: "value", label: "Compare Value", type: "text", defaultValue: "", placeholder: "Value to compare against" },
  ],
};

const jsonParser: FlowNodeDefinition = {
  type: "json-parser",
  name: "JSON Parser",
  description: "Parse JSON text into structured data or extract specific fields",
  category: "processing",
  icon: "{ }",
  color: "#ef4444",
  inputs: [{ id: "in-data", name: "Input", dataType: "message", direction: "input", required: true }],
  outputs: [{ id: "out-data", name: "Parsed Data", dataType: "data", direction: "output" }],
  params: [
    { key: "path", label: "JSON Path (optional)", type: "text", defaultValue: "", placeholder: "e.g., data.results[0].name", description: "Dot-notation path to extract. Leave empty for full parse." },
  ],
};

const textTransform: FlowNodeDefinition = {
  type: "text-transform",
  name: "Text Transform",
  description: "Apply transformations to text: uppercase, lowercase, trim, regex replace",
  category: "processing",
  icon: "🔄",
  color: "#ef4444",
  inputs: [{ id: "in-message", name: "Input", dataType: "message", direction: "input", required: true }],
  outputs: [{ id: "out-message", name: "Output", dataType: "message", direction: "output" }],
  params: [
    { key: "operation", label: "Operation", type: "select", defaultValue: "trim", options: [
      { label: "Trim Whitespace", value: "trim" },
      { label: "Uppercase", value: "uppercase" },
      { label: "Lowercase", value: "lowercase" },
      { label: "Replace", value: "replace" },
      { label: "Prepend", value: "prepend" },
      { label: "Append", value: "append" },
    ]},
    { key: "findText", label: "Find", type: "text", defaultValue: "", placeholder: "Text or regex to find" },
    { key: "replaceText", label: "Replace With", type: "text", defaultValue: "" },
  ],
};

// ── MEMORY NODES ────────────────────────────────────────────────────────────

const conversationMemory: FlowNodeDefinition = {
  type: "conversation-memory",
  name: "Conversation Memory",
  description: "Store and retrieve conversation history for context-aware responses",
  category: "memory",
  icon: "🧠",
  color: "#f97316",
  inputs: [{ id: "in-message", name: "New Message", dataType: "message", direction: "input" }],
  outputs: [{ id: "out-memory", name: "Memory", dataType: "memory", direction: "output" }],
  params: [
    { key: "maxMessages", label: "Max Messages", type: "number", defaultValue: 20, min: 1, max: 100, description: "Maximum messages to keep in memory" },
    { key: "sessionId", label: "Session ID", type: "text", defaultValue: "default", description: "Unique identifier for this conversation" },
  ],
};

const summaryMemory: FlowNodeDefinition = {
  type: "summary-memory",
  name: "Summary Memory",
  description: "Maintain a running summary of the conversation instead of full history",
  category: "memory",
  icon: "📝",
  color: "#f97316",
  inputs: [
    { id: "in-message", name: "New Message", dataType: "message", direction: "input" },
    { id: "in-model", name: "Summarizer Model", dataType: "model", direction: "input" },
  ],
  outputs: [{ id: "out-memory", name: "Summary", dataType: "memory", direction: "output" }],
  params: [
    { key: "maxLength", label: "Max Summary Length", type: "number", defaultValue: 500, min: 100, max: 2000 },
  ],
};

// ── AGENT NODES ─────────────────────────────────────────────────────────────

const agentNode: FlowNodeDefinition = {
  type: "agent",
  name: "AI Agent",
  description: "An autonomous agent that can use tools to accomplish tasks",
  category: "agents",
  icon: "🤖",
  color: "#8b5cf6",
  inputs: [
    { id: "in-prompt", name: "Task", dataType: "message", direction: "input", required: true },
    { id: "in-model", name: "Language Model", dataType: "model", direction: "input", required: true },
    { id: "in-tools", name: "Tools", dataType: "tool", direction: "input", multi: true },
    { id: "in-memory", name: "Memory", dataType: "memory", direction: "input" },
  ],
  outputs: [
    { id: "out-response", name: "Response", dataType: "message", direction: "output" },
  ],
  params: [
    { key: "agentType", label: "Agent Type", type: "select", defaultValue: "react", options: [
      { label: "ReAct (Reasoning + Acting)", value: "react" },
      { label: "Plan and Execute", value: "plan-execute" },
      { label: "Simple (Single-step)", value: "simple" },
    ]},
    { key: "maxIterations", label: "Max Iterations", type: "number", defaultValue: 5, min: 1, max: 20, description: "Maximum tool-use loops before forcing a response" },
    { key: "verbose", label: "Verbose Output", type: "boolean", defaultValue: false, description: "Show agent's reasoning steps" },
  ],
};

const sequentialChain: FlowNodeDefinition = {
  type: "sequential-chain",
  name: "Sequential Chain",
  description: "Execute a sequence of LLM calls, passing output to the next step",
  category: "agents",
  icon: "⛓️",
  color: "#8b5cf6",
  inputs: [
    { id: "in-message", name: "Input", dataType: "message", direction: "input", required: true },
    { id: "in-model", name: "Language Model", dataType: "model", direction: "input", required: true },
  ],
  outputs: [
    { id: "out-response", name: "Final Response", dataType: "message", direction: "output" },
  ],
  params: [
    { key: "steps", label: "Chain Steps (JSON)", type: "textarea", defaultValue: '[\n  "Summarize the following text:\\n{input}",\n  "Extract key points from:\\n{input}",\n  "Create action items from:\\n{input}"\n]', description: "JSON array of prompt strings. Each step receives the previous output as {input}." },
  ],
};

// ── TOOL NODES ──────────────────────────────────────────────────────────────

const calculatorTool: FlowNodeDefinition = {
  type: "calculator-tool",
  name: "Calculator",
  description: "Perform mathematical calculations",
  category: "tools",
  icon: "🔢",
  color: "#06b6d4",
  inputs: [{ id: "in-expression", name: "Expression", dataType: "message", direction: "input" }],
  outputs: [{ id: "out-result", name: "Result", dataType: "tool", direction: "output" }],
  params: [
    { key: "expression", label: "Expression", type: "text", defaultValue: "", placeholder: "2 + 2 * 3", description: "Math expression to evaluate" },
  ],
};

const searchTool: FlowNodeDefinition = {
  type: "search-tool",
  name: "Web Search",
  description: "Search the web for information using a query",
  category: "tools",
  icon: "🔍",
  color: "#06b6d4",
  inputs: [{ id: "in-query", name: "Query", dataType: "message", direction: "input" }],
  outputs: [{ id: "out-results", name: "Results", dataType: "tool", direction: "output" }],
  params: [
    { key: "query", label: "Search Query", type: "text", defaultValue: "", placeholder: "What to search for..." },
    { key: "maxResults", label: "Max Results", type: "number", defaultValue: 5, min: 1, max: 20 },
  ],
};

const currentDateTool: FlowNodeDefinition = {
  type: "current-date-tool",
  name: "Current Date/Time",
  description: "Get the current date and time",
  category: "tools",
  icon: "📅",
  color: "#06b6d4",
  inputs: [],
  outputs: [{ id: "out-date", name: "Date/Time", dataType: "tool", direction: "output" }],
  params: [
    { key: "format", label: "Format", type: "select", defaultValue: "iso", options: [
      { label: "ISO 8601", value: "iso" },
      { label: "Readable", value: "readable" },
      { label: "Date Only", value: "date" },
      { label: "Time Only", value: "time" },
    ]},
  ],
};

// ── REGISTRY ────────────────────────────────────────────────────────────────

/** All registered node definitions */
export const NODE_REGISTRY: FlowNodeDefinition[] = [
  // Inputs
  textInput, chatInput, fileInput, urlInput,
  // Outputs
  chatOutput, textOutput, jsonOutput,
  // Models
  claudeModel, customLLM,
  // Prompts
  promptTemplate, systemMessage, fewShotPrompt,
  // Processing
  textSplitter, combineDocuments, conditional, jsonParser, textTransform,
  // Memory
  conversationMemory, summaryMemory,
  // Agents
  agentNode, sequentialChain,
  // Tools
  calculatorTool, searchTool, currentDateTool,
];

/** O(1) lookup by node type */
export const NODE_DEFINITIONS: Record<string, FlowNodeDefinition> = Object.fromEntries(
  NODE_REGISTRY.map((def) => [def.type, def])
);

/** Get nodes grouped by category */
export function getNodesByCategory(): Record<FlowNodeCategory, FlowNodeDefinition[]> {
  const groups: Record<string, FlowNodeDefinition[]> = {};
  for (const def of NODE_REGISTRY) {
    if (!groups[def.category]) groups[def.category] = [];
    groups[def.category].push(def);
  }
  return groups as Record<FlowNodeCategory, FlowNodeDefinition[]>;
}
