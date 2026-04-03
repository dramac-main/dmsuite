// =============================================================================
// DMSuite — AI Flow Builder Execution Engine
// Executes a flow graph by topological traversal, calling AI APIs for LLM nodes
// and performing local computation for processing/utility nodes.
// =============================================================================

import type {
  FlowNodeData,
  FlowExecutionResult,
  NodeExecutionResult,
  PlaygroundMessage,
} from "@/types/flow-builder";

// ── Types for the engine ────────────────────────────────────────────────────

interface EngineNode {
  id: string;
  data: FlowNodeData;
}

interface EngineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

interface ExecutionContext {
  /** Output values keyed by "nodeId:portId" */
  outputs: Map<string, string>;
  /** Conversation memory for memory nodes */
  memoryStore: Map<string, PlaygroundMessage[]>;
  /** The user message (from playground) */
  userMessage: string;
  /** Callback to update node status during execution */
  onNodeStatus?: (nodeId: string, status: "running" | "complete" | "error", output?: string, error?: string) => void;
  /** Callback for streaming output */
  onOutput?: (text: string) => void;
}

// ── Topological Sort ────────────────────────────────────────────────────────

function topologicalSort(nodes: EngineNode[], edges: EngineEdge[]): string[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const prev = inDegree.get(edge.target) ?? 0;
    inDegree.set(edge.target, prev + 1);
    const adj = adjacency.get(edge.source) ?? [];
    adj.push(edge.target);
    adjacency.set(edge.source, adj);
  }

  const queue: string[] = [];
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) queue.push(nodeId);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error("Flow contains a cycle — cannot execute");
  }

  return sorted;
}

// ── Gather input for a node from connected edge outputs ─────────────────────

function gatherInputs(
  nodeId: string,
  node: EngineNode,
  edges: EngineEdge[],
  ctx: ExecutionContext
): Record<string, string> {
  const inputs: Record<string, string> = {};
  const incomingEdges = edges.filter((e) => e.target === nodeId);

  for (const edge of incomingEdges) {
    const sourceKey = `${edge.source}:${edge.sourceHandle}`;
    const value = ctx.outputs.get(sourceKey) ?? "";
    inputs[edge.targetHandle] = value;
  }

  // Auto-inject user message for chat-input-like nodes with no connected "in-message" port
  for (const port of node.data.inputs) {
    if (!inputs[port.id] && ctx.userMessage) {
      if (port.id === "in-message" || port.id === "in-prompt" || port.id === "in-query") {
        inputs[port.id] = ctx.userMessage;
      }
    }
  }

  return inputs;
}

// ── Node Executors ──────────────────────────────────────────────────────────

function executeTextInput(node: EngineNode, _inputs: Record<string, string>, ctx: ExecutionContext): string {
  const text = String(node.data.paramValues.text ?? "");
  ctx.outputs.set(`${node.id}:out-message`, text);
  return text;
}

function executeChatInput(node: EngineNode, _inputs: Record<string, string>, ctx: ExecutionContext): string {
  const msg = ctx.userMessage || String(node.data.paramValues.text ?? "");
  ctx.outputs.set(`${node.id}:out-message`, msg);
  return msg;
}

function executeFileInput(node: EngineNode, _inputs: Record<string, string>, ctx: ExecutionContext): string {
  const content = String(node.data.paramValues.fileContent ?? "");
  ctx.outputs.set(`${node.id}:out-data`, content);
  return content ? `File loaded (${content.length} chars)` : "No file content";
}

function executeUrlInput(node: EngineNode, _inputs: Record<string, string>, ctx: ExecutionContext): string {
  const url = String(node.data.paramValues.url ?? "");
  const result = url ? `[URL content from ${url} would be fetched here]` : "No URL provided";
  ctx.outputs.set(`${node.id}:out-data`, result);
  return result;
}

function executeChatOutput(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const msg = inputs["in-message"] ?? "";
  ctx.onOutput?.(msg);
  return msg;
}

function executeTextOutput(_node: EngineNode, inputs: Record<string, string>, _ctx: ExecutionContext): string {
  return inputs["in-message"] ?? "";
}

function executeDataOutput(_node: EngineNode, inputs: Record<string, string>, _ctx: ExecutionContext): string {
  return inputs["in-data"] ?? "";
}

function executePromptTemplate(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  let template = String(node.data.paramValues.template ?? "");

  // Build a variables map from all inputs + context
  const vars: Record<string, string> = {
    input: inputs["in-variables"] ?? ctx.userMessage ?? "",
    context: inputs["in-variables"] ?? "",
    query: ctx.userMessage ?? "",
    user_message: ctx.userMessage ?? "",
    ...inputs,
  };

  // Replace all {variable_name} placeholders with matching values
  template = template.replace(/\{([^}]+)\}/g, (match, key: string) => {
    const trimmedKey = key.trim();
    return vars[trimmedKey] ?? vars[trimmedKey.replace(/-/g, "_")] ?? "";
  });

  ctx.outputs.set(`${node.id}:out-prompt`, template);
  return template;
}

function executeSystemMessage(node: EngineNode, _inputs: Record<string, string>, ctx: ExecutionContext): string {
  const content = String(node.data.paramValues.content ?? "");
  ctx.outputs.set(`${node.id}:out-system`, content);
  return content;
}

function executeFewShotPrompt(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const prefix = String(node.data.paramValues.prefix ?? "");
  const suffix = String(node.data.paramValues.suffix ?? "");
  let examples: Array<{ input: string; output: string }> = [];
  try {
    examples = JSON.parse(String(node.data.paramValues.examples ?? "[]"));
  } catch { /* ignore */ }

  const userInput = inputs["in-input"] ?? ctx.userMessage ?? "";
  const exampleStr = examples
    .map((e) => `Input: ${e.input}\nOutput: ${e.output}`)
    .join("\n\n");

  const result = `${prefix}\n\n${exampleStr}\n\n${suffix.replace(/\{input\}/g, userInput)}`;
  ctx.outputs.set(`${node.id}:out-prompt`, result);
  return result;
}

function executeTextSplitter(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const text = inputs["in-text"] ?? "";
  const method = String(node.data.paramValues.method ?? "size");
  const chunkSize = Number(node.data.paramValues.chunkSize ?? 500);
  const separator = String(node.data.paramValues.separator ?? "\\n\\n").replace(/\\n/g, "\n");

  let chunks: string[] = [];
  switch (method) {
    case "separator":
      chunks = text.split(separator).filter(Boolean);
      break;
    case "paragraph":
      chunks = text.split(/\n\n+/).filter(Boolean);
      break;
    case "sentence":
      chunks = text.split(/[.!?]+\s+/).filter(Boolean);
      break;
    default: {
      // By size
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
    }
  }

  const result = JSON.stringify(chunks);
  ctx.outputs.set(`${node.id}:out-chunks`, result);
  return `${chunks.length} chunks created`;
}

function executeJsonParser(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const text = inputs["in-text"] ?? "";
  const path = String(node.data.paramValues.path ?? "");

  try {
    let parsed = JSON.parse(text);
    if (path) {
      const parts = path.split(".");
      for (const part of parts) {
        const arrMatch = part.match(/^(\w+)\[(\d+)\]$/);
        if (arrMatch) {
          parsed = parsed[arrMatch[1]][Number(arrMatch[2])];
        } else {
          parsed = parsed[part];
        }
      }
    }
    const result = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
    ctx.outputs.set(`${node.id}:out-data`, result);
    return result;
  } catch (err) {
    const errMsg = `JSON parse error: ${err instanceof Error ? err.message : String(err)}`;
    ctx.outputs.set(`${node.id}:out-data`, errMsg);
    return errMsg;
  }
}

function executeRegexExtractor(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const text = inputs["in-text"] ?? "";
  const pattern = String(node.data.paramValues.pattern ?? "");
  const flags = String(node.data.paramValues.flags ?? "gi");

  if (!pattern) {
    ctx.outputs.set(`${node.id}:out-matches`, "[]");
    return "No pattern provided";
  }

  try {
    const re = new RegExp(pattern, flags);
    const matches = [...text.matchAll(re)].map((m) => m[0]);
    const result = JSON.stringify(matches);
    ctx.outputs.set(`${node.id}:out-matches`, result);
    return `${matches.length} matches found`;
  } catch {
    ctx.outputs.set(`${node.id}:out-matches`, "[]");
    return "Invalid regex pattern";
  }
}

function executeConditionalRouter(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const input = inputs["in-data"] ?? "";
  const condition = String(node.data.paramValues.condition ?? "contains");
  const value = String(node.data.paramValues.value ?? "");

  let result = false;
  switch (condition) {
    case "contains":
      result = input.toLowerCase().includes(value.toLowerCase());
      break;
    case "equals":
      result = input === value;
      break;
    case "starts_with":
      result = input.startsWith(value);
      break;
    case "regex":
      try { result = new RegExp(value).test(input); } catch { result = false; }
      break;
    case "length_gt":
      result = input.length > Number(value);
      break;
    case "not_empty":
      result = input.trim().length > 0;
      break;
  }

  if (result) {
    ctx.outputs.set(`${node.id}:out-true`, input);
    ctx.outputs.set(`${node.id}:out-false`, "");
  } else {
    ctx.outputs.set(`${node.id}:out-true`, "");
    ctx.outputs.set(`${node.id}:out-false`, input);
  }

  return `Condition "${condition}" → ${result ? "TRUE" : "FALSE"}`;
}

function executeMerge(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const a = inputs["in-a"] ?? "";
  const b = inputs["in-b"] ?? "";
  const c = inputs["in-c"] ?? "";
  const template = String(node.data.paramValues.template ?? "");
  const separator = String(node.data.paramValues.separator ?? "\\n\\n").replace(/\\n/g, "\n");

  let result: string;
  if (template) {
    result = template
      .replace(/\{A\}/g, a)
      .replace(/\{B\}/g, b)
      .replace(/\{C\}/g, c);
  } else {
    result = [a, b, c].filter(Boolean).join(separator);
  }

  ctx.outputs.set(`${node.id}:out-merged`, result);
  return result;
}

function executeConversationMemory(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const sessionId = String(node.data.paramValues.sessionId ?? "default");
  const maxMessages = Number(node.data.paramValues.maxMessages ?? 20);

  let messages = ctx.memoryStore.get(sessionId) ?? [];

  const humanMsg = inputs["in-human"];
  const aiMsg = inputs["in-ai"];

  if (humanMsg) {
    messages.push({ id: crypto.randomUUID(), role: "user", content: humanMsg, timestamp: Date.now() });
  }
  if (aiMsg) {
    messages.push({ id: crypto.randomUUID(), role: "assistant", content: aiMsg, timestamp: Date.now() });
  }

  // Trim to max
  if (messages.length > maxMessages) {
    messages = messages.slice(-maxMessages);
  }

  ctx.memoryStore.set(sessionId, messages);

  const memoryText = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  ctx.outputs.set(`${node.id}:out-memory`, memoryText);
  return `Memory: ${messages.length} messages`;
}

function executeSummaryMemory(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  // Simplified summary memory — just truncates for now
  const humanMsg = inputs["in-human"] ?? "";
  const aiMsg = inputs["in-ai"] ?? "";
  const maxTokens = Number(node.data.paramValues.maxTokens ?? 2000);

  let existing = ctx.outputs.get(`${node.id}:out-memory`) ?? "";
  if (humanMsg) existing += `\nUser: ${humanMsg}`;
  if (aiMsg) existing += `\nAssistant: ${aiMsg}`;

  // Simple truncation (approximate token count by chars/4)
  if (existing.length > maxTokens * 4) {
    existing = "[Earlier conversation summarized]\n" + existing.slice(-maxTokens * 3);
  }

  ctx.outputs.set(`${node.id}:out-memory`, existing);
  return `Summary memory: ~${Math.round(existing.length / 4)} tokens`;
}

function executeWebSearch(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const query = inputs["in-query"] ?? "";
  const numResults = Number(node.data.paramValues.numResults ?? 5);

  // Simulated web search results
  const results = Array.from({ length: numResults }, (_, i) => ({
    title: `Result ${i + 1} for "${query}"`,
    snippet: `This is a simulated search result for the query "${query}". In production, this would connect to a real search API.`,
    url: `https://example.com/result-${i + 1}`,
  }));

  const resultText = results.map((r) => `${r.title}\n${r.snippet}\n${r.url}`).join("\n\n");
  ctx.outputs.set(`${node.id}:out-tool`, "web-search");
  ctx.outputs.set(`${node.id}:out-results`, JSON.stringify(results));
  return resultText;
}

function executeCalculator(node: EngineNode, inputs: Record<string, string>, ctx: ExecutionContext): string {
  const expr = inputs["in-expression"] ?? "";

  try {
    // Safe math evaluation — only allow numbers, operators, parentheses
    const sanitized = expr.replace(/[^0-9+\-*/().%\s^]/g, "");
    if (!sanitized.trim()) {
      ctx.outputs.set(`${node.id}:out-result`, "0");
      return "No expression";
    }
    // Use Function instead of eval for slightly better isolation
    // Only allow mathematical operations
    const mathExpr = sanitized
      .replace(/\^/g, "**"); // Support ^ for power
    const safeEval = new Function(`"use strict"; return (${mathExpr})`);
    const result = String(safeEval());
    ctx.outputs.set(`${node.id}:out-tool`, "calculator");
    ctx.outputs.set(`${node.id}:out-result`, result);
    return result;
  } catch {
    ctx.outputs.set(`${node.id}:out-tool`, "calculator");
    ctx.outputs.set(`${node.id}:out-result`, "Error");
    return "Calculation error";
  }
}

function executeApiCall(node: EngineNode, _inputs: Record<string, string>, ctx: ExecutionContext): string {
  const method = String(node.data.paramValues.method ?? "GET");
  const url = String(node.data.paramValues.url ?? "");

  // Simulated — real API calls would need server-side proxy
  const result = `[${method} ${url}] — API calls require server-side execution. Configure an API route for production use.`;
  ctx.outputs.set(`${node.id}:out-tool`, "api-call");
  ctx.outputs.set(`${node.id}:out-response`, result);
  return result;
}

// ── LLM Node Executor (calls DMSuite API) ───────────────────────────────────

async function executeLLMNode(
  node: EngineNode,
  inputs: Record<string, string>,
  ctx: ExecutionContext
): Promise<string> {
  const prompt = inputs["in-prompt"] ?? "";
  const systemMsg = inputs["in-system"] ?? "";
  const memory = inputs["in-memory"] ?? "";
  const model = String(node.data.paramValues.model ?? "claude-sonnet-4-6");
  const temperature = Number(node.data.paramValues.temperature ?? 0.7);
  const maxTokens = Number(node.data.paramValues.maxTokens ?? 1024);

  if (!prompt.trim()) {
    ctx.outputs.set(`${node.id}:out-message`, "");
    return "No prompt provided";
  }

  // Build messages array
  const messages: Array<{ role: string; content: string }> = [];
  if (memory) {
    // Parse memory into messages
    const lines = memory.split("\n").filter(Boolean);
    for (const line of lines) {
      if (line.startsWith("User: ") || line.startsWith("user: ")) {
        messages.push({ role: "user", content: line.replace(/^[Uu]ser:\s*/, "") });
      } else if (line.startsWith("Assistant: ") || line.startsWith("assistant: ")) {
        messages.push({ role: "assistant", content: line.replace(/^[Aa]ssistant:\s*/, "") });
      }
    }
  }
  messages.push({ role: "user", content: prompt });

  try {
    const response = await fetch("/api/chat/ai-flow-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        system: systemMsg || undefined,
        model,
        temperature,
        maxTokens,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const output = data.content ?? data.text ?? "";
    ctx.outputs.set(`${node.id}:out-message`, output);
    ctx.outputs.set(`${node.id}:out-result`, output);
    return output;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`LLM call failed: ${errMsg}`);
  }
}

// ── Agent Executor ──────────────────────────────────────────────────────────

async function executeAgent(
  node: EngineNode,
  inputs: Record<string, string>,
  ctx: ExecutionContext
): Promise<string> {
  const prompt = inputs["in-prompt"] ?? "";
  const model = String(node.data.paramValues.model ?? "claude-sonnet-4-6");
  const maxIterations = Number(node.data.paramValues.maxIterations ?? 5);
  const memory = inputs["in-memory"] ?? "";

  if (!prompt.trim()) {
    ctx.outputs.set(`${node.id}:out-result`, "");
    return "No task provided";
  }

  const systemPrompt = node.data.definitionType === "react-agent"
    ? `You are a ReAct agent. Think step by step. For each step, explain your reasoning, then take an action. You have ${maxIterations} max iterations. Be concise and solve the task directly.`
    : `You are a sequential execution agent. Follow each step carefully and build on the previous step's output.`;

  const messages: Array<{ role: string; content: string }> = [];

  if (memory) {
    const lines = memory.split("\n").filter(Boolean);
    for (const line of lines) {
      if (line.startsWith("User: ") || line.startsWith("user: ")) {
        messages.push({ role: "user", content: line.replace(/^[Uu]ser:\s*/, "") });
      } else if (line.startsWith("Assistant: ") || line.startsWith("assistant: ")) {
        messages.push({ role: "assistant", content: line.replace(/^[Aa]ssistant:\s*/, "") });
      }
    }
  }

  messages.push({ role: "user", content: prompt });

  try {
    const response = await fetch("/api/chat/ai-flow-builder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        system: systemPrompt,
        model,
        temperature: 0.5,
        maxTokens: 2048,
      }),
    });

    if (!response.ok) throw new Error(`Agent API error: ${response.status}`);
    const data = await response.json();
    const output = data.content ?? data.text ?? "";
    ctx.outputs.set(`${node.id}:out-result`, output);
    return output;
  } catch (err) {
    throw new Error(`Agent failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ── Main Executor ───────────────────────────────────────────────────────────

type NodeExecutorFn = (
  node: EngineNode,
  inputs: Record<string, string>,
  ctx: ExecutionContext
) => string;

const SYNC_EXECUTORS: Record<string, NodeExecutorFn> = {
  "text-input": executeTextInput,
  "chat-input": executeChatInput,
  "file-input": executeFileInput,
  "url-input": executeUrlInput,
  "chat-output": executeChatOutput,
  "text-output": executeTextOutput,
  "data-output": executeDataOutput,
  "prompt-template": executePromptTemplate,
  "system-message": executeSystemMessage,
  "few-shot-prompt": executeFewShotPrompt,
  "text-splitter": executeTextSplitter,
  "json-parser": executeJsonParser,
  "regex-extractor": executeRegexExtractor,
  "conditional-router": executeConditionalRouter,
  "merge-node": executeMerge,
  "conversation-memory": executeConversationMemory,
  "summary-memory": executeSummaryMemory,
  "web-search-tool": executeWebSearch,
  "calculator-tool": executeCalculator,
  "api-call-tool": executeApiCall,
};

const ASYNC_NODE_TYPES = new Set([
  "claude-model",
  "openai-model",
  "react-agent",
  "sequential-agent",
]);

/**
 * Execute a complete flow graph.
 */
export async function executeFlow(
  nodes: EngineNode[],
  edges: EngineEdge[],
  userMessage: string,
  options?: {
    onNodeStatus?: ExecutionContext["onNodeStatus"];
    onOutput?: ExecutionContext["onOutput"];
    memoryStore?: Map<string, PlaygroundMessage[]>;
  }
): Promise<FlowExecutionResult> {
  const startTime = performance.now();
  const results: NodeExecutionResult[] = [];
  let finalOutput = "";

  const ctx: ExecutionContext = {
    outputs: new Map(),
    memoryStore: options?.memoryStore ?? new Map(),
    userMessage,
    onNodeStatus: options?.onNodeStatus,
    onOutput: options?.onOutput,
  };

  try {
    // Keep ALL nodes in graph (frozen nodes use cached output instead of re-executing)
    const order = topologicalSort(nodes, edges);
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    for (const nodeId of order) {
      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const nodeStart = performance.now();
      ctx.onNodeStatus?.(nodeId, "running");

      try {
        const inputs = gatherInputs(nodeId, node, edges, ctx);
        let output: string;

        // Frozen nodes use their cached output (pass-through)
        if (node.data.isFrozen) {
          output = node.data.lastOutput ?? "";
          // Propagate cached outputs to all output ports
          for (const port of node.data.outputs) {
            if (!ctx.outputs.has(`${nodeId}:${port.id}`)) {
              ctx.outputs.set(`${nodeId}:${port.id}`, output);
            }
          }
          const duration = performance.now() - nodeStart;
          ctx.onNodeStatus?.(nodeId, "complete", output);
          results.push({ nodeId, success: true, output: "[frozen] " + output, duration });
          continue;
        }

        if (ASYNC_NODE_TYPES.has(node.data.definitionType)) {
          if (
            node.data.definitionType === "react-agent" ||
            node.data.definitionType === "sequential-agent"
          ) {
            output = await executeAgent(node, inputs, ctx);
          } else {
            output = await executeLLMNode(node, inputs, ctx);
          }
        } else {
          const executor = SYNC_EXECUTORS[node.data.definitionType];
          if (executor) {
            output = executor(node, inputs, ctx);
          } else {
            output = `Unknown node type: ${node.data.definitionType}`;
          }
        }

        const duration = performance.now() - nodeStart;
        ctx.onNodeStatus?.(nodeId, "complete", output);
        results.push({ nodeId, success: true, output, duration });

        // Track final output (last output-type node wins)
        if (
          node.data.category === "outputs" ||
          node.data.definitionType === "chat-output"
        ) {
          finalOutput = output;
        }
      } catch (err) {
        const duration = performance.now() - nodeStart;
        const errMsg = err instanceof Error ? err.message : String(err);
        ctx.onNodeStatus?.(nodeId, "error", undefined, errMsg);
        results.push({ nodeId, success: false, output: "", error: errMsg, duration });
      }
    }

    return {
      success: results.every((r) => r.success),
      results,
      finalOutput,
      totalDuration: performance.now() - startTime,
    };
  } catch (err) {
    return {
      success: false,
      results,
      finalOutput: "",
      totalDuration: performance.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Validate a flow before execution — check for missing connections, cycles, etc.
 */
export function validateFlow(
  nodes: EngineNode[],
  edges: EngineEdge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (nodes.length === 0) {
    errors.push("Flow has no nodes");
    return { valid: false, errors };
  }

  // Check for cycles
  try {
    topologicalSort(nodes, edges);
  } catch {
    errors.push("Flow contains a cycle — remove circular connections");
  }

  // Check for disconnected required inputs
  const connectedInputs = new Set(edges.map((e) => `${e.target}:${e.targetHandle}`));
  for (const node of nodes) {
    if (node.data.isFrozen) continue;
    for (const port of node.data.inputs) {
      if (port.required && !connectedInputs.has(`${node.id}:${port.id}`)) {
        // Chat inputs can use playground message, so skip
        if (node.data.definitionType === "chat-input") continue;
        errors.push(`"${node.data.label}" is missing required input: ${port.name}`);
      }
    }
  }

  // Check for nodes with no connections at all (orphans)
  const connectedNodes = new Set<string>();
  for (const edge of edges) {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  }
  if (nodes.length > 1) {
    for (const node of nodes) {
      if (!connectedNodes.has(node.id) && !node.data.isFrozen) {
        errors.push(`"${node.data.label}" is not connected to any other node`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
