"use client";

// =============================================================================
// DMSuite — AI Flow Builder — Playground Chat Panel
// Test the flow by sending messages and viewing AI responses.
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAIFlowBuilderEditor } from "@/stores/ai-flow-builder-editor";
import { executeFlow, validateFlow } from "@/lib/ai-flow-builder/engine";
import type { PlaygroundMessage } from "@/types/flow-builder";

export default function PlaygroundChat() {
  const nodes = useAIFlowBuilderEditor((s) => s.form.nodes);
  const edges = useAIFlowBuilderEditor((s) => s.form.edges);
  const chatMessages = useAIFlowBuilderEditor((s) => s.form.chatMessages);
  const isExecuting = useAIFlowBuilderEditor((s) => s.form.isExecuting);
  const addChatMessage = useAIFlowBuilderEditor((s) => s.addChatMessage);
  const clearChat = useAIFlowBuilderEditor((s) => s.clearChat);
  const setIsExecuting = useAIFlowBuilderEditor((s) => s.setIsExecuting);
  const setNodeStatus = useAIFlowBuilderEditor((s) => s.setNodeStatus);
  const clearNodeStatuses = useAIFlowBuilderEditor((s) => s.clearNodeStatuses);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const memoryStoreRef = useRef(new Map<string, PlaygroundMessage[]>());

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages.length]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isExecuting) return;

    setInput("");

    // Add user message
    const userMsg: PlaygroundMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    addChatMessage(userMsg);

    // Validate flow
    const engineNodes = nodes.map((n) => ({ id: n.id, data: n.data }));
    const engineEdges = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    }));

    const validation = validateFlow(engineNodes, engineEdges);
    if (!validation.valid) {
      addChatMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `Flow validation errors:\n${validation.errors.join("\n")}`,
        timestamp: Date.now(),
      });
      return;
    }

    // Execute flow
    setIsExecuting(true);
    clearNodeStatuses();

    try {
      let finalOutput = "";
      const result = await executeFlow(engineNodes, engineEdges, text, {
        onNodeStatus: (nodeId, status, output, error) => {
          setNodeStatus(nodeId, status, output, error);
        },
        onOutput: (out) => {
          finalOutput = out;
        },
        memoryStore: memoryStoreRef.current,
      });

      const responseText =
        finalOutput || result.finalOutput || (result.success ? "Flow completed successfully." : `Flow failed: ${result.error ?? "Unknown error"}`);

      addChatMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseText,
        timestamp: Date.now(),
      });

      // Dispatch workspace events
      window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { milestone: "content" } }));
    } catch (err) {
      addChatMessage({
        id: crypto.randomUUID(),
        role: "system",
        content: `Execution error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: Date.now(),
      });
    } finally {
      setIsExecuting(false);
    }
  }, [input, isExecuting, nodes, edges, addChatMessage, setIsExecuting, clearNodeStatuses, setNodeStatus]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-800/40">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎮</span>
          <span className="text-[11px] font-semibold text-gray-300 uppercase tracking-wide">
            Playground
          </span>
        </div>
        <button
          onClick={() => {
            clearChat();
            clearNodeStatuses();
            memoryStoreRef.current.clear();
          }}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-thin">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-2xl mb-2 opacity-30">💬</div>
            <div className="text-xs text-gray-500 max-w-[180px]">
              Send a message to test your flow. Make sure you have a Chat Input → ... → Chat Output pipeline.
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary-500/20 text-primary-200 rounded-br-sm"
                  : msg.role === "system"
                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-bl-sm"
                  : "bg-gray-800/60 text-gray-300 rounded-bl-sm"
              }`}
            >
              {msg.role === "system" && (
                <div className="text-[10px] font-semibold text-amber-400 mb-0.5">⚠ System</div>
              )}
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              <div className="text-[9px] text-gray-600 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isExecuting && (
          <div className="flex justify-start">
            <div className="bg-gray-800/60 rounded-xl px-3 py-2 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Executing flow...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 px-3 py-2 border-t border-gray-800/40">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isExecuting ? "Running..." : "Type a message..."}
            disabled={isExecuting}
            className="flex-1 px-3 py-2 text-xs bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-primary-500/50 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={isExecuting || !input.trim()}
            className="shrink-0 px-3 py-2 text-xs font-medium bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {isExecuting ? "..." : "Send"}
          </button>
        </div>
        <div className="text-[10px] text-gray-600 mt-1">
          {nodes.length} nodes · {edges.length} connections
        </div>
      </div>
    </div>
  );
}
