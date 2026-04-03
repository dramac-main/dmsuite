// =============================================================================
// DMSuite — AI Flow Builder Pre-Built Templates
// 6 starter flow templates that users can load to get started quickly.
// =============================================================================

import type { SavedFlow } from "@/types/flow-builder";
import { getNodeDefinition } from "@/lib/ai-flow-builder/node-registry";
import type { FlowNodeData } from "@/types/flow-builder";

/** Helper to create node data from a definition type */
function makeNodeData(
  defType: string,
  overrides?: Partial<FlowNodeData> & { paramOverrides?: Record<string, string | number | boolean> }
): FlowNodeData {
  const def = getNodeDefinition(defType);
  if (!def) throw new Error(`Unknown node type: ${defType}`);

  const paramValues: Record<string, string | number | boolean> = {};
  for (const p of def.params) {
    paramValues[p.key] = overrides?.paramOverrides?.[p.key] ?? p.defaultValue;
  }

  return {
    definitionType: defType,
    label: overrides?.label ?? def.name,
    description: def.description,
    category: def.category,
    color: def.color,
    icon: def.icon,
    inputs: [...def.inputs],
    outputs: [...def.outputs],
    params: [...def.params],
    paramValues,
  };
}

// ── Template 1: Basic Chatbot ───────────────────────────────────────────────

const basicChatbot: SavedFlow = {
  id: "template-basic-chatbot",
  name: "Basic Chatbot",
  description: "Simple chat input → Claude model → chat output pipeline. The simplest possible conversational AI flow.",
  nodes: [
    {
      id: "node-1",
      type: "flowNode",
      position: { x: 100, y: 200 },
      data: makeNodeData("chat-input"),
    },
    {
      id: "node-2",
      type: "flowNode",
      position: { x: 450, y: 100 },
      data: makeNodeData("system-message", {
        paramOverrides: { content: "You are a friendly and helpful AI assistant. Be concise and clear in your responses." },
      }),
    },
    {
      id: "node-3",
      type: "flowNode",
      position: { x: 450, y: 300 },
      data: makeNodeData("claude-model", {
        paramOverrides: { model: "claude-sonnet-4-6", temperature: 0.7, maxTokens: 1024 },
      }),
    },
    {
      id: "node-4",
      type: "flowNode",
      position: { x: 800, y: 300 },
      data: makeNodeData("chat-output"),
    },
  ],
  edges: [
    { id: "e1", source: "node-1", target: "node-3", sourceHandle: "out-message", targetHandle: "in-prompt" },
    { id: "e2", source: "node-2", target: "node-3", sourceHandle: "out-system", targetHandle: "in-system" },
    { id: "e3", source: "node-3", target: "node-4", sourceHandle: "out-message", targetHandle: "in-message" },
  ],
  viewport: { x: 0, y: 0, zoom: 0.85 },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

// ── Template 2: RAG Pipeline ────────────────────────────────────────────────

const ragPipeline: SavedFlow = {
  id: "template-rag-pipeline",
  name: "RAG Pipeline",
  description: "Retrieval-Augmented Generation: file input → text splitter → merge with user query → Claude model → output.",
  nodes: [
    {
      id: "node-1",
      type: "flowNode",
      position: { x: 100, y: 100 },
      data: makeNodeData("file-input", { label: "Knowledge Base" }),
    },
    {
      id: "node-2",
      type: "flowNode",
      position: { x: 100, y: 400 },
      data: makeNodeData("chat-input", { label: "User Question" }),
    },
    {
      id: "node-3",
      type: "flowNode",
      position: { x: 450, y: 100 },
      data: makeNodeData("text-splitter", {
        paramOverrides: { method: "paragraph", chunkSize: 500, overlap: 50 },
      }),
    },
    {
      id: "node-4",
      type: "flowNode",
      position: { x: 450, y: 300 },
      data: makeNodeData("prompt-template", {
        paramOverrides: {
          template: "Based on the following context, answer the user's question accurately.\n\nContext:\n{context}\n\nQuestion: {input}\n\nAnswer:",
        },
      }),
    },
    {
      id: "node-5",
      type: "flowNode",
      position: { x: 800, y: 200 },
      data: makeNodeData("claude-model", {
        paramOverrides: { temperature: 0.3, maxTokens: 2048 },
      }),
    },
    {
      id: "node-6",
      type: "flowNode",
      position: { x: 1100, y: 200 },
      data: makeNodeData("chat-output"),
    },
  ],
  edges: [
    { id: "e1", source: "node-1", target: "node-3", sourceHandle: "out-data", targetHandle: "in-text" },
    { id: "e2", source: "node-3", target: "node-4", sourceHandle: "out-chunks", targetHandle: "in-variables" },
    { id: "e3", source: "node-4", target: "node-5", sourceHandle: "out-prompt", targetHandle: "in-prompt" },
    { id: "e4", source: "node-5", target: "node-6", sourceHandle: "out-message", targetHandle: "in-message" },
  ],
  viewport: { x: 0, y: 0, zoom: 0.75 },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

// ── Template 3: Agent with Tools ────────────────────────────────────────────

const agentWithTools: SavedFlow = {
  id: "template-agent-tools",
  name: "Agent with Tools",
  description: "ReAct agent connected to web search and calculator tools for autonomous task solving.",
  nodes: [
    {
      id: "node-1",
      type: "flowNode",
      position: { x: 100, y: 250 },
      data: makeNodeData("chat-input", { label: "Task Input" }),
    },
    {
      id: "node-2",
      type: "flowNode",
      position: { x: 450, y: 100 },
      data: makeNodeData("web-search-tool"),
    },
    {
      id: "node-3",
      type: "flowNode",
      position: { x: 450, y: 350 },
      data: makeNodeData("calculator-tool"),
    },
    {
      id: "node-4",
      type: "flowNode",
      position: { x: 800, y: 250 },
      data: makeNodeData("react-agent", {
        paramOverrides: { maxIterations: 5, verbose: true },
      }),
    },
    {
      id: "node-5",
      type: "flowNode",
      position: { x: 1150, y: 250 },
      data: makeNodeData("chat-output"),
    },
  ],
  edges: [
    { id: "e1", source: "node-1", target: "node-4", sourceHandle: "out-message", targetHandle: "in-prompt" },
    { id: "e2", source: "node-2", target: "node-4", sourceHandle: "out-tool", targetHandle: "in-tools" },
    { id: "e3", source: "node-3", target: "node-4", sourceHandle: "out-tool", targetHandle: "in-tools" },
    { id: "e4", source: "node-4", target: "node-5", sourceHandle: "out-result", targetHandle: "in-message" },
  ],
  viewport: { x: 0, y: 0, zoom: 0.8 },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

// ── Template 4: Content Pipeline ────────────────────────────────────────────

const contentPipeline: SavedFlow = {
  id: "template-content-pipeline",
  name: "Content Pipeline",
  description: "Sequential content generation: topic input → outline prompt → Claude → refinement prompt → Claude → polished output.",
  nodes: [
    {
      id: "node-1",
      type: "flowNode",
      position: { x: 100, y: 200 },
      data: makeNodeData("text-input", {
        label: "Topic",
        paramOverrides: { text: "AI in Healthcare" },
      }),
    },
    {
      id: "node-2",
      type: "flowNode",
      position: { x: 400, y: 200 },
      data: makeNodeData("prompt-template", {
        label: "Outline Prompt",
        paramOverrides: { template: "Create a detailed blog post outline about: {input}\n\nInclude: Introduction, 3-4 main sections, and conclusion." },
      }),
    },
    {
      id: "node-3",
      type: "flowNode",
      position: { x: 400, y: 50 },
      data: makeNodeData("system-message", {
        paramOverrides: { content: "You are an expert content strategist and writer." },
      }),
    },
    {
      id: "node-4",
      type: "flowNode",
      position: { x: 750, y: 200 },
      data: makeNodeData("claude-model", {
        label: "Outline Generator",
        paramOverrides: { temperature: 0.8, maxTokens: 1024 },
      }),
    },
    {
      id: "node-5",
      type: "flowNode",
      position: { x: 1050, y: 200 },
      data: makeNodeData("prompt-template", {
        label: "Refinement Prompt",
        paramOverrides: { template: "Take this outline and write a polished, engaging blog post:\n\n{input}\n\nMake it professional, informative, and engaging." },
      }),
    },
    {
      id: "node-6",
      type: "flowNode",
      position: { x: 1350, y: 200 },
      data: makeNodeData("claude-model", {
        label: "Content Writer",
        paramOverrides: { temperature: 0.7, maxTokens: 2048 },
      }),
    },
    {
      id: "node-7",
      type: "flowNode",
      position: { x: 1650, y: 200 },
      data: makeNodeData("text-output", { label: "Final Article" }),
    },
  ],
  edges: [
    { id: "e1", source: "node-1", target: "node-2", sourceHandle: "out-message", targetHandle: "in-variables" },
    { id: "e2", source: "node-2", target: "node-4", sourceHandle: "out-prompt", targetHandle: "in-prompt" },
    { id: "e3", source: "node-3", target: "node-4", sourceHandle: "out-system", targetHandle: "in-system" },
    { id: "e4", source: "node-4", target: "node-5", sourceHandle: "out-message", targetHandle: "in-variables" },
    { id: "e5", source: "node-3", target: "node-6", sourceHandle: "out-system", targetHandle: "in-system" },
    { id: "e6", source: "node-5", target: "node-6", sourceHandle: "out-prompt", targetHandle: "in-prompt" },
    { id: "e7", source: "node-6", target: "node-7", sourceHandle: "out-message", targetHandle: "in-message" },
  ],
  viewport: { x: 0, y: 0, zoom: 0.6 },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

// ── Template 5: Conversational with Memory ──────────────────────────────────

const conversationalMemory: SavedFlow = {
  id: "template-conversational-memory",
  name: "Conversational Memory Bot",
  description: "Chatbot with conversation memory — remembers previous messages for context-aware responses.",
  nodes: [
    {
      id: "node-1",
      type: "flowNode",
      position: { x: 100, y: 250 },
      data: makeNodeData("chat-input"),
    },
    {
      id: "node-2",
      type: "flowNode",
      position: { x: 100, y: 50 },
      data: makeNodeData("system-message", {
        paramOverrides: { content: "You are a helpful assistant with memory. Reference previous conversation when relevant." },
      }),
    },
    {
      id: "node-3",
      type: "flowNode",
      position: { x: 450, y: 400 },
      data: makeNodeData("conversation-memory", {
        paramOverrides: { maxMessages: 20, sessionId: "default" },
      }),
    },
    {
      id: "node-4",
      type: "flowNode",
      position: { x: 500, y: 200 },
      data: makeNodeData("claude-model", {
        paramOverrides: { temperature: 0.7, maxTokens: 1024 },
      }),
    },
    {
      id: "node-5",
      type: "flowNode",
      position: { x: 850, y: 200 },
      data: makeNodeData("chat-output"),
    },
  ],
  edges: [
    { id: "e1", source: "node-1", target: "node-4", sourceHandle: "out-message", targetHandle: "in-prompt" },
    { id: "e2", source: "node-2", target: "node-4", sourceHandle: "out-system", targetHandle: "in-system" },
    { id: "e3", source: "node-3", target: "node-4", sourceHandle: "out-memory", targetHandle: "in-memory" },
    { id: "e4", source: "node-1", target: "node-3", sourceHandle: "out-message", targetHandle: "in-human" },
    { id: "e5", source: "node-4", target: "node-5", sourceHandle: "out-message", targetHandle: "in-message" },
    { id: "e6", source: "node-4", target: "node-3", sourceHandle: "out-message", targetHandle: "in-ai" },
  ],
  viewport: { x: 0, y: 0, zoom: 0.8 },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

// ── Template 6: Data Processing Pipeline ────────────────────────────────────

const dataProcessing: SavedFlow = {
  id: "template-data-processing",
  name: "Data Processing Pipeline",
  description: "Text input → regex extraction → JSON parsing → conditional routing → dual outputs for matched/unmatched data.",
  nodes: [
    {
      id: "node-1",
      type: "flowNode",
      position: { x: 100, y: 200 },
      data: makeNodeData("text-input", {
        label: "Raw Data",
        paramOverrides: {
          text: '{"users":[{"name":"John","email":"john@example.com"},{"name":"Jane","email":"jane@test.org"}]}',
        },
      }),
    },
    {
      id: "node-2",
      type: "flowNode",
      position: { x: 450, y: 200 },
      data: makeNodeData("json-parser", {
        paramOverrides: { path: "users" },
      }),
    },
    {
      id: "node-3",
      type: "flowNode",
      position: { x: 800, y: 200 },
      data: makeNodeData("regex-extractor", {
        label: "Email Extractor",
        paramOverrides: { pattern: "[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}", flags: "gi" },
      }),
    },
    {
      id: "node-4",
      type: "flowNode",
      position: { x: 1150, y: 200 },
      data: makeNodeData("conditional-router", {
        paramOverrides: { condition: "not_empty", value: "" },
      }),
    },
    {
      id: "node-5",
      type: "flowNode",
      position: { x: 1450, y: 100 },
      data: makeNodeData("text-output", { label: "Emails Found" }),
    },
    {
      id: "node-6",
      type: "flowNode",
      position: { x: 1450, y: 350 },
      data: makeNodeData("text-output", { label: "No Emails" }),
    },
  ],
  edges: [
    { id: "e1", source: "node-1", target: "node-2", sourceHandle: "out-message", targetHandle: "in-text" },
    { id: "e2", source: "node-2", target: "node-3", sourceHandle: "out-data", targetHandle: "in-text" },
    { id: "e3", source: "node-3", target: "node-4", sourceHandle: "out-matches", targetHandle: "in-data" },
    { id: "e4", source: "node-4", target: "node-5", sourceHandle: "out-true", targetHandle: "in-message" },
    { id: "e5", source: "node-4", target: "node-6", sourceHandle: "out-false", targetHandle: "in-message" },
  ],
  viewport: { x: 0, y: 0, zoom: 0.75 },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

// ── Export ───────────────────────────────────────────────────────────────────

export const FLOW_TEMPLATES: SavedFlow[] = [
  basicChatbot,
  ragPipeline,
  agentWithTools,
  contentPipeline,
  conversationalMemory,
  dataProcessing,
];

export function getFlowTemplate(id: string): SavedFlow | undefined {
  return FLOW_TEMPLATES.find((t) => t.id === id);
}
