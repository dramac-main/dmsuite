// =============================================================================
// DMSuite — AI Flow Builder Execution Engine
// Topological graph traversal + node execution for running AI workflows.
// =============================================================================

import type { Node, Edge } from "@xyflow/react";
import type {
  FlowNodeData,
  NodeExecutionResult,
  FlowExecutionResult,
} from "@/types/flow-builder";
import { NODE_DEFINITIONS } from "./node-registry";

// ── Graph Utilities ─────────────────────────────────────────────────────────

/** Compute topological order (Kahn's algorithm) */
export function topologicalSort(nodes: Node<FlowNodeData>[], edges: Edge[]): string[] {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  for (const node of nodes) {
    inDegree[node.id] = 0;
    adjList[node.id] = [];
  }
  for (const edge of edges) {
    if (adjList[edge.source]) {
      adjList[edge.source].push(edge.target);
    }
    inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
  }
  const queue: string[] = [];
  for (const nodeId of Object.keys(inDegree)) {
    if (inDegree[nodeId] === 0) queue.push(nodeId);
  }
  const order: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const neighbor of adjList[current] || []) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) queue.push(neighbor);
    }
  }
  // If order doesn't include all nodes, there's a cycle
  if (order.length !== nodes.length) {
    throw new Error("Flow contains a cycle — cannot execute. Remove circular connections.");
  }
  return order;
}

/** Get all input values for a node from connected edges */
function gatherInputs(
  nodeId: string,
  edges: Edge[],
  nodeOutputs: Record<string, string>,
): Record<string, string> {
  const inputs: Record<string, string> = {};
  for (const edge of edges) {
    if (edge.target === nodeId && edge.targetHandle) {
      inputs[edge.targetHandle] = nodeOutputs[`${edge.source}:${edge.sourceHandle}`] || "";
    }
  }
  return inputs;
}

// ── Node Executors ──────────────────────────────────────────────────────────

/** Execute a single node and return its output string */
async function executeNode(
  node: Node<FlowNodeData>,
  inputs: Record<string, string>,
  chatHistory: Array<{ role: string; content: string }>,
  onNodeStatus?: (nodeId: string, status: "running" | "complete" | "error", output?: string, error?: string) => void,
): Promise<{ outputs: Record<string, string>; chatResponse?: string }> {
  const data = node.data;
  if (!data) throw new Error(`No data on node ${node.id}`);
  const params = data.paramValues || {};
  const defType = data.definitionType;
  const outputs: Record<string, string> = {};

  onNodeStatus?.(node.id, "running");

  try {
    switch (defType) {
      // ── Inputs ──
      case "text-input": {
        const val = String(params.value || "");
        outputs[`${node.id}:out-message`] = val;
        break;
      }
      case "chat-input": {
        // Chat input gets the last user message from chat history
        const lastUser = [...chatHistory].reverse().find((m) => m.role === "user");
        outputs[`${node.id}:out-message`] = lastUser?.content || String(params.value || "");
        break;
      }
      case "file-input": {
        outputs[`${node.id}:out-data`] = String(params.content || "");
        break;
      }
      case "url-input": {
        // In a real implementation this would fetch the URL
        outputs[`${node.id}:out-data`] = `[Content from ${params.url || "unknown URL"}]`;
        break;
      }

      // ── Outputs ──
      case "chat-output":
      case "text-output": {
        const incoming = inputs["in-message"] || "";
        outputs[`${node.id}:out-final`] = incoming;
        return { outputs, chatResponse: incoming };
      }
      case "json-output": {
        const incoming = inputs["in-data"] || inputs["in-message"] || "";
        try {
          const parsed = JSON.parse(incoming);
          outputs[`${node.id}:out-final`] = params.pretty
            ? JSON.stringify(parsed, null, 2)
            : JSON.stringify(parsed);
        } catch {
          outputs[`${node.id}:out-final`] = incoming;
        }
        return { outputs, chatResponse: outputs[`${node.id}:out-final`] };
      }

      // ── Models ──
      case "claude-model": {
        const prompt = inputs["in-prompt"] || "";
        const systemMsg = inputs["in-system"] || String(params.systemPrompt || "");
        const memoryCtx = inputs["in-memory"] || "";

        const fullPrompt = [memoryCtx, prompt].filter(Boolean).join("\n\n");

        // Call our Anthropic API route
        const response = await callLLM(
          fullPrompt,
          systemMsg,
          String(params.model || "claude-sonnet-4-20250514"),
          Number(params.temperature || 0.7),
          Number(params.maxTokens || 2048),
        );
        outputs[`${node.id}:out-response`] = response;
        outputs[`${node.id}:out-model`] = String(params.model || "claude-sonnet-4-20250514");
        break;
      }
      case "custom-llm": {
        const prompt = inputs["in-prompt"] || "";
        const systemMsg = inputs["in-system"] || "";
        // For custom LLM, we'd call the external API
        outputs[`${node.id}:out-response`] = `[Custom LLM response to: ${prompt.slice(0, 100)}...]`;
        outputs[`${node.id}:out-model`] = String(params.modelName || "custom");
        break;
      }

      // ── Prompts ──
      case "prompt-template": {
        let template = String(params.template || "");
        const variableData = inputs["in-variables"] || "";
        // Try to parse variable data as JSON
        try {
          const vars = JSON.parse(variableData);
          if (typeof vars === "object" && vars !== null) {
            for (const [key, val] of Object.entries(vars)) {
              template = template.replace(new RegExp(`\\{${key}\\}`, "g"), String(val));
            }
          }
        } catch {
          // If not JSON, replace {input} with raw text
          template = template.replace(/\{input\}/g, variableData);
        }
        outputs[`${node.id}:out-prompt`] = template;
        break;
      }
      case "system-message": {
        outputs[`${node.id}:out-message`] = String(params.content || "");
        break;
      }
      case "few-shot": {
        try {
          const examples = JSON.parse(String(params.examples || "[]"));
          const formatted = examples
            .map((ex: { input: string; output: string }) => `User: ${ex.input}\nAssistant: ${ex.output}`)
            .join("\n\n");
          outputs[`${node.id}:out-examples`] = formatted;
        } catch {
          outputs[`${node.id}:out-examples`] = String(params.examples || "");
        }
        break;
      }

      // ── Processing ──
      case "text-splitter": {
        const text = inputs["in-data"] || "";
        const chunkSize = Number(params.chunkSize || 1000);
        const overlap = Number(params.overlap || 200);
        const chunks: string[] = [];
        let i = 0;
        while (i < text.length) {
          chunks.push(text.slice(i, i + chunkSize));
          i += chunkSize - overlap;
        }
        outputs[`${node.id}:out-chunks`] = JSON.stringify(chunks);
        break;
      }
      case "combine-docs": {
        const d1 = inputs["in-data-1"] || "";
        const d2 = inputs["in-data-2"] || "";
        const sep = String(params.separator || "\n\n---\n\n").replace(/\\n/g, "\n");
        outputs[`${node.id}:out-combined`] = [d1, d2].filter(Boolean).join(sep);
        break;
      }
      case "conditional": {
        const input = inputs["in-data"] || "";
        const cond = String(params.condition || "contains");
        const val = String(params.value || "");
        let result = false;
        switch (cond) {
          case "contains": result = input.includes(val); break;
          case "not-contains": result = !input.includes(val); break;
          case "equals": result = input === val; break;
          case "starts-with": result = input.startsWith(val); break;
          case "ends-with": result = input.endsWith(val); break;
          case "is-empty": result = input.trim() === ""; break;
          case "length-gt": result = input.length > Number(val || 0); break;
        }
        if (result) {
          outputs[`${node.id}:out-true`] = input;
        } else {
          outputs[`${node.id}:out-false`] = input;
        }
        break;
      }
      case "json-parser": {
        const input = inputs["in-data"] || inputs["in-message"] || "";
        const path = String(params.path || "");
        try {
          let parsed = JSON.parse(input);
          if (path) {
            for (const key of path.split(".")) {
              const match = key.match(/^(\w+)\[(\d+)\]$/);
              if (match) {
                parsed = parsed[match[1]][Number(match[2])];
              } else {
                parsed = parsed[key];
              }
            }
          }
          outputs[`${node.id}:out-data`] = typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
        } catch {
          outputs[`${node.id}:out-data`] = input;
        }
        break;
      }
      case "text-transform": {
        let input = inputs["in-message"] || "";
        const op = String(params.operation || "trim");
        switch (op) {
          case "trim": input = input.trim(); break;
          case "uppercase": input = input.toUpperCase(); break;
          case "lowercase": input = input.toLowerCase(); break;
          case "replace":
            input = input.replace(new RegExp(String(params.findText || ""), "g"), String(params.replaceText || ""));
            break;
          case "prepend": input = String(params.findText || "") + input; break;
          case "append": input = input + String(params.findText || ""); break;
        }
        outputs[`${node.id}:out-message`] = input;
        break;
      }

      // ── Memory ──
      case "conversation-memory": {
        const maxMsgs = Number(params.maxMessages || 20);
        const recent = chatHistory.slice(-maxMsgs);
        const formatted = recent
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n");
        outputs[`${node.id}:out-memory`] = formatted;
        break;
      }
      case "summary-memory": {
        const maxLen = Number(params.maxLength || 500);
        const allMsgs = chatHistory.map((m) => `${m.role}: ${m.content}`).join("\n");
        outputs[`${node.id}:out-memory`] = allMsgs.slice(0, maxLen) + (allMsgs.length > maxLen ? "..." : "");
        break;
      }

      // ── Agents ──
      case "agent": {
        const task = inputs["in-prompt"] || "";
        const model = inputs["in-model"] || "claude-sonnet-4-20250514";
        const memory = inputs["in-memory"] || "";
        const tools = inputs["in-tools"] || "";

        const agentPrompt = [
          `You are an AI agent. Your task: ${task}`,
          memory ? `\nConversation context:\n${memory}` : "",
          tools ? `\nAvailable tools: ${tools}` : "",
          "\nProvide a helpful, accurate response.",
        ].join("");

        const response = await callLLM(agentPrompt, "You are a helpful AI agent that reasons step by step.", model, 0.7, 2048);
        outputs[`${node.id}:out-response`] = response;
        break;
      }
      case "sequential-chain": {
        const input = inputs["in-message"] || "";
        const model = inputs["in-model"] || "claude-sonnet-4-20250514";
        let stepsRaw: string[] = [];
        try {
          stepsRaw = JSON.parse(String(params.steps || "[]"));
        } catch {
          stepsRaw = [String(params.steps || "Process: {input}")];
        }
        let current = input;
        for (const step of stepsRaw) {
          const prompt = step.replace(/\{input\}/g, current);
          current = await callLLM(prompt, "You are a helpful assistant.", model, 0.7, 2048);
        }
        outputs[`${node.id}:out-response`] = current;
        break;
      }

      // ── Tools ──
      case "calculator-tool": {
        const expr = inputs["in-expression"] || String(params.expression || "");
        try {
          // Safe math evaluation (no eval)
          const result = safeMathEval(expr);
          outputs[`${node.id}:out-result`] = String(result);
        } catch (e) {
          outputs[`${node.id}:out-result`] = `Error: ${e instanceof Error ? e.message : "Invalid expression"}`;
        }
        break;
      }
      case "search-tool": {
        const query = inputs["in-query"] || String(params.query || "");
        outputs[`${node.id}:out-results`] = `[Search results for: "${query}" — Web search not yet connected. Provide search results via the input port.]`;
        break;
      }
      case "current-date-tool": {
        const fmt = String(params.format || "iso");
        const now = new Date();
        switch (fmt) {
          case "iso": outputs[`${node.id}:out-date`] = now.toISOString(); break;
          case "readable": outputs[`${node.id}:out-date`] = now.toLocaleString(); break;
          case "date": outputs[`${node.id}:out-date`] = now.toLocaleDateString(); break;
          case "time": outputs[`${node.id}:out-date`] = now.toLocaleTimeString(); break;
        }
        break;
      }

      default:
        outputs[`${node.id}:out-default`] = `[Unknown node type: ${defType}]`;
    }

    onNodeStatus?.(node.id, "complete", Object.values(outputs).join(""));
    return { outputs };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onNodeStatus?.(node.id, "error", undefined, msg);
    throw err;
  }
}

// ── LLM Call Helper ─────────────────────────────────────────────────────────

async function callLLM(
  prompt: string,
  systemPrompt: string,
  model: string,
  temperature: number,
  maxTokens: number,
): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "user", content: prompt },
        ],
        system: systemPrompt,
        model,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return `[LLM Error: ${res.status} — ${errText.slice(0, 200)}]`;
    }

    // Handle streaming response
    if (res.headers.get("content-type")?.includes("text/event-stream")) {
      const reader = res.body?.getReader();
      if (!reader) return "[Error: No response body]";
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) result += parsed.text;
              else if (parsed.delta?.text) result += parsed.delta.text;
              else if (typeof parsed === "string") result += parsed;
            } catch {
              result += data;
            }
          }
        }
      }
      return result || "[Empty response]";
    }

    // Handle JSON response
    const json = await res.json();
    return json.text || json.content || json.message || JSON.stringify(json);
  } catch (err) {
    return `[LLM Error: ${err instanceof Error ? err.message : String(err)}]`;
  }
}

// ── Safe Math Evaluator ─────────────────────────────────────────────────────

function safeMathEval(expr: string): number {
  // Only allow numbers, operators, parentheses, and common math functions
  const sanitized = expr.replace(/\s/g, "");
  if (!/^[0-9+\-*/().%^sincotaqrlegxpab]+$/i.test(sanitized)) {
    throw new Error("Invalid characters in expression");
  }
  // Use Function constructor with restricted scope (safer than eval)
  const mathFn = new Function(
    "Math",
    `"use strict"; return (${sanitized
      .replace(/\^/g, "**")
      .replace(/sin/g, "Math.sin")
      .replace(/cos/g, "Math.cos")
      .replace(/tan/g, "Math.tan")
      .replace(/sqrt/g, "Math.sqrt")
      .replace(/log/g, "Math.log")
      .replace(/abs/g, "Math.abs")
      .replace(/exp/g, "Math.exp")
      .replace(/pi/gi, "Math.PI")
    });`
  );
  const result = mathFn(Math);
  if (typeof result !== "number" || !isFinite(result)) {
    throw new Error("Result is not a finite number");
  }
  return result;
}

// ── Main Execution Function ─────────────────────────────────────────────────

export async function executeFlow(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
  chatHistory: Array<{ role: string; content: string }>,
  onNodeStatus?: (nodeId: string, status: "running" | "complete" | "error", output?: string, error?: string) => void,
): Promise<FlowExecutionResult> {
  const startTime = Date.now();
  const results: NodeExecutionResult[] = [];
  let finalOutput = "";

  try {
    // Filter out frozen nodes from execution
    const activeNodes = nodes.filter((n) => !n.data?.isFrozen);
    const order = topologicalSort(activeNodes, edges);
    const nodeOutputs: Record<string, string> = {};

    for (const nodeId of order) {
      const node = activeNodes.find((n) => n.id === nodeId);
      if (!node || !node.data) continue;

      const nodeStart = Date.now();
      const inputs = gatherInputs(nodeId, edges, nodeOutputs);

      try {
        const { outputs, chatResponse } = await executeNode(node, inputs, chatHistory, onNodeStatus);

        // Store all outputs
        for (const [key, val] of Object.entries(outputs)) {
          nodeOutputs[key] = val;
        }

        if (chatResponse) {
          finalOutput = chatResponse;
        }

        results.push({
          nodeId,
          success: true,
          output: Object.values(outputs).join(""),
          duration: Date.now() - nodeStart,
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({
          nodeId,
          success: false,
          output: "",
          error: errMsg,
          duration: Date.now() - nodeStart,
        });
        // Don't abort entire flow — continue with other branches
      }
    }

    return {
      success: results.every((r) => r.success),
      results,
      finalOutput: finalOutput || (results.length > 0 ? results[results.length - 1].output : ""),
      totalDuration: Date.now() - startTime,
    };
  } catch (err) {
    return {
      success: false,
      results,
      finalOutput: "",
      totalDuration: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Validate a flow before execution */
export function validateFlow(
  nodes: Node<FlowNodeData>[],
  edges: Edge[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (nodes.length === 0) {
    errors.push("Flow is empty — add at least one node");
    return { valid: false, errors };
  }

  // Check for input and output nodes
  const hasInput = nodes.some((n) =>
    n.data?.category === "inputs"
  );
  const hasOutput = nodes.some((n) =>
    n.data?.category === "outputs"
  );
  if (!hasInput) errors.push("Flow needs at least one Input node");
  if (!hasOutput) errors.push("Flow needs at least one Output node (Chat Output or Text Output)");

  // Check for required connections
  for (const node of nodes) {
    if (!node.data) continue;
    const def = NODE_DEFINITIONS[node.data.definitionType];
    if (!def) continue;
    for (const input of def.inputs) {
      if (input.required) {
        const hasConnection = edges.some(
          (e) => e.target === node.id && e.targetHandle === input.id
        );
        if (!hasConnection) {
          errors.push(`"${node.data.label}" is missing required connection: ${input.name}`);
        }
      }
    }
  }

  // Check for cycles
  try {
    topologicalSort(nodes, edges);
  } catch {
    errors.push("Flow contains a cycle — remove circular connections");
  }

  return { valid: errors.length === 0, errors };
}
