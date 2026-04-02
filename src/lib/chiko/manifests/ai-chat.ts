import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useChatStore, BUILTIN_PRESETS } from "@/stores/chat";

export function createAIChatManifest(): ChikoActionManifest {
  return {
    toolId: "ai-chat",
    toolName: "AI Chat Assistant",
    actions: [
      // ── Info ──
      {
        name: "readCurrentState",
        description: "Read the current state of the AI Chat workspace",
        parameters: {},
        category: "Info",
      },
      {
        name: "listConversations",
        description: "List all conversations with their titles and message counts",
        parameters: {},
        category: "Info",
      },
      {
        name: "getBookmarkedMessages",
        description: "Get all bookmarked messages across conversations",
        parameters: {},
        category: "Info",
      },
      // ── Content ──
      {
        name: "createConversation",
        description: "Create a new conversation",
        parameters: {
          type: "object",
          properties: {
            temporary: { type: "boolean", description: "Whether chat is temporary (not saved)" },
          },
        },
        category: "Content",
      },
      {
        name: "renameConversation",
        description: "Rename the active conversation",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "New conversation title" },
          },
          required: ["title"],
        },
        category: "Content",
      },
      {
        name: "switchConversation",
        description: "Switch to a different conversation by index",
        parameters: {
          type: "object",
          properties: {
            index: { type: "number", description: "Conversation index (0-based)" },
          },
          required: ["index"],
        },
        category: "Content",
      },
      // ── Settings ──
      {
        name: "switchProvider",
        description: "Switch the AI provider for new messages",
        parameters: {
          type: "object",
          properties: {
            provider: { type: "string", enum: ["claude", "openai"], description: "AI provider" },
          },
          required: ["provider"],
        },
        category: "Settings",
      },
      {
        name: "setSystemPrompt",
        description: "Set the system prompt for new conversations",
        parameters: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "System prompt text" },
          },
          required: ["prompt"],
        },
        category: "Settings",
      },
      {
        name: "applyPreset",
        description: "Apply a built-in system prompt preset",
        parameters: {
          type: "object",
          properties: {
            presetId: {
              type: "string",
              enum: BUILTIN_PRESETS.map((p) => p.id),
              description: "Preset ID",
            },
          },
          required: ["presetId"],
        },
        category: "Settings",
      },
      // ── Organization ──
      {
        name: "pinConversation",
        description: "Pin or unpin the active conversation",
        parameters: {
          type: "object",
          properties: {
            pin: { type: "boolean", description: "true to pin, false to unpin" },
          },
          required: ["pin"],
        },
        category: "Organization",
      },
      {
        name: "createFolder",
        description: "Create a new folder for organizing conversations",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string", description: "Folder name" },
          },
          required: ["name"],
        },
        category: "Organization",
      },
      // ── Export ──
      {
        name: "exportConversation",
        description: "Export the active conversation",
        parameters: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["markdown", "json", "text"], description: "Export format" },
          },
          required: ["format"],
        },
        category: "Export",
      },
    ],

    getState: () => {
      const s = useChatStore.getState();
      const active = s.getActiveConversation();
      return {
        totalConversations: s.conversations.length,
        activeConversation: active
          ? {
              title: active.title,
              messageCount: active.messages.length,
              provider: active.provider,
              pinned: active.pinned,
            }
          : null,
        selectedProvider: s.selectedProvider,
        folders: s.folders,
        customPresets: s.customPresets.length,
      };
    },

    executeAction: (
      name: string,
      params: Record<string, unknown>
    ): ChikoActionResult => {
      try {
        const s = useChatStore.getState();
        switch (name) {
          case "readCurrentState": {
            const active = s.getActiveConversation();
            return {
              success: true,
              message: active
                ? `Active: "${active.title}" (${active.messages.length} msgs, ${active.provider ?? s.selectedProvider}). ${s.conversations.length} total conversations.`
                : `No active conversation. ${s.conversations.length} total.`,
            };
          }
          case "listConversations": {
            const list = s.conversations
              .slice(0, 20)
              .map(
                (c, i) =>
                  `${i}. "${c.title}" (${c.messages.length} msgs${c.pinned ? ", pinned" : ""})`
              )
              .join("\n");
            return { success: true, message: list || "No conversations." };
          }
          case "getBookmarkedMessages": {
            const bookmarks: string[] = [];
            for (const conv of s.conversations) {
              for (const msg of conv.messages) {
                if (msg.bookmarked) {
                  bookmarks.push(
                    `[${conv.title}] ${msg.role}: ${msg.content.slice(0, 80)}…`
                  );
                }
              }
            }
            return {
              success: true,
              message: bookmarks.length
                ? bookmarks.join("\n")
                : "No bookmarked messages.",
            };
          }
          case "createConversation": {
            const id = s.createConversation({
              temporary: params.temporary as boolean | undefined,
            });
            return { success: true, message: `Created conversation ${id}` };
          }
          case "renameConversation": {
            const active = s.getActiveConversation();
            if (!active) return { success: false, message: "No active conversation" };
            s.renameConversation(active.id, params.title as string);
            return { success: true, message: `Renamed to "${params.title}"` };
          }
          case "switchConversation": {
            const idx = params.index as number;
            if (idx < 0 || idx >= s.conversations.length)
              return { success: false, message: "Invalid index" };
            s.setActiveConversation(s.conversations[idx].id);
            return {
              success: true,
              message: `Switched to "${s.conversations[idx].title}"`,
            };
          }
          case "switchProvider": {
            s.setSelectedProvider(params.provider as "claude" | "openai");
            return {
              success: true,
              message: `Provider set to ${params.provider}`,
            };
          }
          case "setSystemPrompt": {
            s.setSystemPrompt(params.prompt as string);
            return { success: true, message: "System prompt updated" };
          }
          case "applyPreset": {
            const preset = BUILTIN_PRESETS.find(
              (p) => p.id === params.presetId
            );
            if (!preset)
              return { success: false, message: "Preset not found" };
            s.setSystemPrompt(preset.prompt);
            return {
              success: true,
              message: `Applied preset: ${preset.label}`,
            };
          }
          case "pinConversation": {
            const active = s.getActiveConversation();
            if (!active) return { success: false, message: "No active conversation" };
            if (params.pin) s.pinConversation(active.id);
            else s.unpinConversation(active.id);
            return {
              success: true,
              message: `Conversation ${params.pin ? "pinned" : "unpinned"}`,
            };
          }
          case "createFolder": {
            s.addFolder(params.name as string);
            return {
              success: true,
              message: `Folder "${params.name}" created`,
            };
          }
          case "exportConversation": {
            const active = s.getActiveConversation();
            if (!active) return { success: false, message: "No active conversation" };
            const content = s.exportConversation(
              active.id,
              params.format as "markdown" | "json" | "text"
            );
            return {
              success: true,
              message: `Export ready (${content.length} chars, ${params.format})`,
            };
          }
          default:
            return { success: false, message: `Unknown action: ${name}` };
        }
      } catch (err) {
        return {
          success: false,
          message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };
}
