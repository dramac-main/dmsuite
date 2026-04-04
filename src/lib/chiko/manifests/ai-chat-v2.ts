// =============================================================================
// DMSuite — AI Chat V2 (Lobe) — Chiko Action Manifest
// Lobe Chat–faithful multi-model, session/topic/agent-based chat workspace.
// =============================================================================

import type {
  ChikoActionManifest,
  ChikoActionResult,
} from "@/stores/chiko-actions";
import {
  useAIChatV2Editor,
  MODEL_OPTIONS,
  BUILTIN_AGENTS,
  type ChatModel,
} from "@/stores/ai-chat-v2-editor";
import { withActivityLogging } from "@/stores/activity-log";

// ---------------------------------------------------------------------------
// Manifest factory
// ---------------------------------------------------------------------------

export function createAIChatV2Manifest(
  store: typeof useAIChatV2Editor
): ChikoActionManifest {
  const modelNames = MODEL_OPTIONS.map(
    (m) => `${m.id} (${m.label}, ${m.provider})`
  ).join(", ");
  const agentNames = BUILTIN_AGENTS.map((a) => `${a.id} (${a.name})`).join(
    ", "
  );

  const baseManifest: ChikoActionManifest = {
    toolId: "ai-chat-v2",
    toolName: "AI Chat V2 (Lobe)",
    actions: [
      // ── State ──
      {
        name: "readCurrentState",
        description:
          "Read the current state: active session, agent, model, session count, topics, and recent messages.",
        parameters: { type: "object", properties: {} },
        category: "State",
      },
      // ── Session management ──
      {
        name: "createSession",
        description:
          "Create a new session with an optional agent. Defaults to the LobeChat Assistant.",
        parameters: {
          type: "object",
          properties: {
            agentId: {
              type: "string",
              description: `Agent ID. Built-in: ${agentNames}`,
            },
          },
        },
        category: "Session",
      },
      {
        name: "deleteSession",
        description: "Delete a session by ID.",
        parameters: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "Session ID to delete" },
          },
          required: ["sessionId"],
        },
        category: "Session",
      },
      {
        name: "renameSession",
        description: "Rename a session.",
        parameters: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "Session ID to rename" },
            title: { type: "string", description: "New title" },
          },
          required: ["sessionId", "title"],
        },
        category: "Session",
      },
      {
        name: "switchSession",
        description: "Switch to a session by ID.",
        parameters: {
          type: "object",
          properties: {
            sessionId: {
              type: "string",
              description: "Session ID to switch to",
            },
          },
          required: ["sessionId"],
        },
        category: "Session",
      },
      {
        name: "pinSession",
        description: "Toggle the pin status of a session.",
        parameters: {
          type: "object",
          properties: {
            sessionId: { type: "string", description: "Session ID to pin/unpin" },
          },
          required: ["sessionId"],
        },
        category: "Session",
      },
      // ── Model / agent ──
      {
        name: "setModel",
        description: `Set the model for the active session. Available: ${modelNames}`,
        parameters: {
          type: "object",
          properties: {
            model: { type: "string", description: "Model ID" },
          },
          required: ["model"],
        },
        category: "Model",
      },
      {
        name: "setAgent",
        description: `Switch the agent for the current session. Built-in: ${agentNames}`,
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
        description:
          "List all available agents (built-in + custom) with IDs and descriptions.",
        parameters: { type: "object", properties: {} },
        category: "Agent",
      },
      // ── Topics ──
      {
        name: "createTopic",
        description: "Create a new topic in the active session.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Topic title (optional)" },
          },
        },
        category: "Topic",
      },
      {
        name: "listTopics",
        description: "List all topics for the active session.",
        parameters: { type: "object", properties: {} },
        category: "Topic",
      },
      // ── Export ──
      {
        name: "exportSession",
        description:
          "Export the active session as JSON, Markdown, or plain text.",
        parameters: {
          type: "object",
          properties: {
            format: {
              type: "string",
              enum: ["json", "markdown", "text"],
              description: "Export format",
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
          "Reset all sessions, agents, topics, and settings to defaults.",
        parameters: { type: "object", properties: {} },
        category: "Danger",
      },
    ],

    // -----------------------------------------------------------------------
    // getState — snapshot for Chiko context
    // -----------------------------------------------------------------------
    getState(): Record<string, unknown> {
      const s = store.getState().form;
      const active = s.sessions.find((x) => x.id === s.activeSessionId);
      const allAgents = [...BUILTIN_AGENTS, ...s.agents];
      const agent = active
        ? allAgents.find((a) => a.id === active.agentId) || BUILTIN_AGENTS[0]
        : BUILTIN_AGENTS[0];
      const model = MODEL_OPTIONS.find(
        (m) => m.id === (active?.model || s.globalModel)
      );
      const topics = s.topics.filter(
        (t) => t.sessionId === s.activeSessionId
      );

      return {
        sessionCount: s.sessions.length,
        activeSession: active?.title || "none",
        activeSessionMessages: active?.messages.length || 0,
        activeAgent: agent.name,
        selectedModel: model?.label || s.globalModel,
        customAgentCount: s.agents.length,
        topicCount: topics.length,
        sessionGroupCount: s.sessionGroups.length,
        pinnedSessionCount: s.sessions.filter((x) => x.pinned).length,
      };
    },

    // -----------------------------------------------------------------------
    // executeAction
    // -----------------------------------------------------------------------
    executeAction(
      actionName: string,
      params: Record<string, unknown>
    ): ChikoActionResult {
      try {
        const s = store.getState();

        switch (actionName) {
          case "readCurrentState": {
            const session = s.getActiveSession();
            const agent = s.getSessionAgent(session);
            const model = s.getSessionModel(session);
            const topics = session
              ? s.getSessionTopics(session.id)
              : [];
            const recentMsgs = session
              ? session.messages
                  .slice(-5)
                  .map(
                    (m) =>
                      `[${m.role}] ${m.content.slice(0, 100)}${m.content.length > 100 ? "…" : ""}`
                  )
                  .join("\n")
              : "No active session";
            return {
              success: true,
              message: `Sessions: ${s.form.sessions.length}. Active: "${session?.title || "none"}" (${session?.messages.length || 0} msgs). Agent: ${agent.name}. Model: ${model.label}. Topics: ${topics.length}.\n\nRecent messages:\n${recentMsgs}`,
            };
          }

          case "createSession": {
            const agentId = (params.agentId as string) || "default";
            const id = s.createSession(agentId);
            return {
              success: true,
              message: `Created new session (ID: ${id})`,
            };
          }

          case "deleteSession": {
            s.deleteSession(params.sessionId as string);
            return {
              success: true,
              message: `Deleted session ${params.sessionId}`,
            };
          }

          case "renameSession": {
            s.renameSession(
              params.sessionId as string,
              params.title as string
            );
            return {
              success: true,
              message: `Renamed session to "${params.title}"`,
            };
          }

          case "switchSession": {
            s.setActiveSession(params.sessionId as string);
            return {
              success: true,
              message: `Switched to session ${params.sessionId}`,
            };
          }

          case "pinSession": {
            s.pinSession(params.sessionId as string);
            return {
              success: true,
              message: `Toggled pin on session ${params.sessionId}`,
            };
          }

          case "setModel": {
            if (!s.getActiveSession()) {
              return { success: false, message: "No active session" };
            }
            s.updateSessionSettings(s.form.activeSessionId, {
              model: params.model as ChatModel,
            });
            const m = MODEL_OPTIONS.find((o) => o.id === params.model);
            return {
              success: true,
              message: `Model set to ${m?.label || params.model}`,
            };
          }

          case "setAgent": {
            const session = s.getActiveSession();
            if (!session) {
              return { success: false, message: "No active session" };
            }
            // Update agent on active session directly
            useAIChatV2Editor.setState((st) => {
              const ss = st.form.sessions.find(
                (x) => x.id === session.id
              );
              if (ss) {
                ss.agentId = params.agentId as string;
                ss.updatedAt = Date.now();
              }
            });
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

          case "createTopic": {
            const session = s.getActiveSession();
            if (!session) {
              return { success: false, message: "No active session" };
            }
            const title = (params.title as string) || undefined;
            const id = s.createTopic(session.id, title);
            return {
              success: true,
              message: `Created topic "${title || "New Topic"}" (ID: ${id})`,
            };
          }

          case "listTopics": {
            const session = s.getActiveSession();
            if (!session) {
              return { success: false, message: "No active session" };
            }
            const topics = s.getSessionTopics(session.id);
            if (topics.length === 0) {
              return {
                success: true,
                message: "No topics in this session",
              };
            }
            const list = topics
              .map(
                (t) =>
                  `• ${t.title} (${t.id})${t.favorite ? " ⭐" : ""}`
              )
              .join("\n");
            return {
              success: true,
              message: `${topics.length} topics:\n${list}`,
            };
          }

          case "exportSession": {
            const session = s.getActiveSession();
            if (!session) {
              return {
                success: false,
                message: "No active session to export",
              };
            }
            const data = s.exportSession(
              session.id,
              params.format as "json" | "markdown" | "text"
            );
            return {
              success: true,
              message: `Exported session "${session.title}" as ${params.format} (${data.length} chars)`,
            };
          }

          case "reset": {
            s.resetForm();
            return {
              success: true,
              message: "AI Chat V2 workspace reset to defaults",
            };
          }

          default:
            return {
              success: false,
              message: `Unknown action: ${actionName}`,
            };
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
    (snapshot) => store.getState().setForm(snapshot as never)
  );
}
