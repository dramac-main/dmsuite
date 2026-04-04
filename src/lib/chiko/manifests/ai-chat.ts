// =============================================================================
// DMSuite — AI Chat Assistant — Chiko Action Manifest
// Lobe Chat–inspired multi-model, agent/persona, topic-based chat workspace.
// =============================================================================

import type {
  ChikoActionManifest,
  ChikoActionResult,
} from "@/stores/chiko-actions";
import {
  useAIChatEditor,
  MODEL_OPTIONS,
  BUILTIN_AGENTS,
  type ChatModel,
} from "@/stores/ai-chat-editor";
import { withActivityLogging } from "@/stores/activity-log";

// ---------------------------------------------------------------------------
// Manifest factory
// ---------------------------------------------------------------------------

export function createAIChatManifest(
  store: typeof useAIChatEditor
): ChikoActionManifest {
  const modelNames = MODEL_OPTIONS.map(
    (m) => `${m.id} (${m.label}, ${m.provider})`
  ).join(", ");
  const agentNames = BUILTIN_AGENTS.map((a) => `${a.id} (${a.name})`).join(
    ", "
  );

  const baseManifest: ChikoActionManifest = {
    toolId: "ai-chat",
    toolName: "AI Chat Assistant",
    actions: [
      // ── State ──
      {
        name: "readCurrentState",
        description:
          "Read the current state: active conversation, agent, model selection, conversation count, and recent messages.",
        parameters: { type: "object", properties: {} },
        category: "State",
      },
      // ── Conversation management ──
      {
        name: "createConversation",
        description: "Create a new conversation with the currently active agent.",
        parameters: {
          type: "object",
          properties: {
            agentId: {
              type: "string",
              description: `Optional agent ID. Built-in agents: ${agentNames}`,
            },
          },
        },
        category: "Conversation",
      },
      {
        name: "deleteConversation",
        description: "Delete a conversation by ID.",
        parameters: {
          type: "object",
          properties: {
            conversationId: {
              type: "string",
              description: "Conversation ID to delete",
            },
          },
          required: ["conversationId"],
        },
        category: "Conversation",
      },
      {
        name: "renameConversation",
        description: "Rename a conversation.",
        parameters: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
            title: { type: "string" },
          },
          required: ["conversationId", "title"],
        },
        category: "Conversation",
      },
      {
        name: "switchConversation",
        description: "Switch to a different conversation by ID.",
        parameters: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
          },
          required: ["conversationId"],
        },
        category: "Conversation",
      },
      {
        name: "pinConversation",
        description: "Toggle pin on a conversation.",
        parameters: {
          type: "object",
          properties: {
            conversationId: { type: "string" },
          },
          required: ["conversationId"],
        },
        category: "Conversation",
      },
      // ── Model ──
      {
        name: "setModel",
        description: `Set the active AI model. Available models: ${modelNames}`,
        parameters: {
          type: "object",
          properties: {
            model: { type: "string", description: "Model ID from available list" },
          },
          required: ["model"],
        },
        category: "Model",
      },
      // ── Agent ──
      {
        name: "setAgent",
        description: `Switch to a different agent persona. Built-in agents: ${agentNames}`,
        parameters: {
          type: "object",
          properties: {
            agentId: { type: "string", description: "Agent ID" },
          },
          required: ["agentId"],
        },
        category: "Agent",
      },
      {
        name: "listAgents",
        description: "List all available agents (built-in + custom).",
        parameters: { type: "object", properties: {} },
        category: "Agent",
      },
      // ── Export ──
      {
        name: "exportConversation",
        description:
          "Export the active conversation. Formats: json, markdown, text.",
        parameters: {
          type: "object",
          properties: {
            format: {
              type: "string",
              enum: ["json", "markdown", "text"],
            },
          },
          required: ["format"],
        },
        category: "Export",
      },
      // ── Reset ──
      {
        name: "reset",
        description:
          "Reset the AI Chat workspace to defaults (clears all conversations and custom agents).",
        parameters: { type: "object", properties: {} },
        category: "General",
      },
    ],

    getState: () => {
      const s = store.getState();
      const conv = s.getActiveConversation();
      const agent = s.getActiveAgent();
      const model = MODEL_OPTIONS.find((m) => m.id === s.form.selectedModel);
      return {
        conversationCount: s.form.conversations.length,
        activeConversation: conv
          ? {
              id: conv.id,
              title: conv.title,
              messageCount: conv.messages.length,
              pinned: conv.pinned,
              archived: conv.archived,
            }
          : null,
        activeAgent: { id: agent.id, name: agent.name },
        selectedModel: model
          ? { id: model.id, label: model.label, provider: model.provider }
          : null,
        customAgentCount: s.form.agents.length,
        topicCount: s.form.topics.length,
      };
    },

    executeAction: (
      actionName: string,
      params: Record<string, unknown>
    ): ChikoActionResult => {
      try {
        const s = store.getState();

        switch (actionName) {
          case "readCurrentState": {
            const conv = s.getActiveConversation();
            const agent = s.getActiveAgent();
            const model = MODEL_OPTIONS.find(
              (m) => m.id === s.form.selectedModel
            );
            const recentMsgs = conv
              ? conv.messages
                  .slice(-5)
                  .map(
                    (m) =>
                      `[${m.role}] ${m.content.slice(0, 100)}${m.content.length > 100 ? "…" : ""}`
                  )
                  .join("\n")
              : "No active conversation";
            return {
              success: true,
              message: `Conversations: ${s.form.conversations.length}. Active: "${conv?.title || "none"}" (${conv?.messages.length || 0} msgs). Agent: ${agent.name}. Model: ${model?.label || s.form.selectedModel}.\n\nRecent messages:\n${recentMsgs}`,
            };
          }

          case "createConversation": {
            const agentId = (params.agentId as string) || s.form.activeAgentId;
            const id = s.createConversation(agentId);
            return {
              success: true,
              message: `Created new conversation (ID: ${id})`,
            };
          }

          case "deleteConversation": {
            s.deleteConversation(params.conversationId as string);
            return {
              success: true,
              message: `Deleted conversation ${params.conversationId}`,
            };
          }

          case "renameConversation": {
            s.renameConversation(
              params.conversationId as string,
              params.title as string
            );
            return {
              success: true,
              message: `Renamed conversation to "${params.title}"`,
            };
          }

          case "switchConversation": {
            s.setActiveConversation(params.conversationId as string);
            return {
              success: true,
              message: `Switched to conversation ${params.conversationId}`,
            };
          }

          case "pinConversation": {
            s.pinConversation(params.conversationId as string);
            return {
              success: true,
              message: `Toggled pin on conversation ${params.conversationId}`,
            };
          }

          case "setModel": {
            s.setSelectedModel(params.model as ChatModel);
            const m = MODEL_OPTIONS.find((o) => o.id === params.model);
            return {
              success: true,
              message: `Model set to ${m?.label || params.model}`,
            };
          }

          case "setAgent": {
            s.setActiveAgent(params.agentId as string);
            const allAgents = [...BUILTIN_AGENTS, ...s.form.agents];
            const agent = allAgents.find((a) => a.id === params.agentId);
            return {
              success: true,
              message: `Switched to agent: ${agent?.name || params.agentId}`,
            };
          }

          case "listAgents": {
            const all = [...BUILTIN_AGENTS, ...s.form.agents];
            const list = all
              .map(
                (a) =>
                  `• ${a.name} (${a.id}) — ${a.description.slice(0, 60)}${a.description.length > 60 ? "…" : ""}${a.isBuiltin ? " [built-in]" : ""}`
              )
              .join("\n");
            return {
              success: true,
              message: `${all.length} agents available:\n${list}`,
            };
          }

          case "exportConversation": {
            const conv = s.getActiveConversation();
            if (!conv)
              return { success: false, message: "No active conversation to export" };
            const data = s.exportConversation(
              conv.id,
              params.format as "json" | "markdown" | "text"
            );
            return {
              success: true,
              message: `Exported conversation "${conv.title}" as ${params.format} (${data.length} chars)`,
            };
          }

          case "reset": {
            s.resetForm();
            return {
              success: true,
              message: "AI Chat workspace reset to defaults",
            };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (error) {
        return {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => store.getState().form,
    (snapshot) => store.getState().setForm(snapshot as never),
  );
}
