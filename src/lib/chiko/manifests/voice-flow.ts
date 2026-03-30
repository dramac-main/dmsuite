// =============================================================================
// DMSuite — VoiceFlow AI Dictation Action Manifest for Chiko
// Gives Chiko AI control over VoiceFlow dictation settings, transcripts, and
// vocabulary management.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useVoiceFlowEditor } from "@/stores/voice-flow-editor";
import { withActivityLogging } from "@/stores/activity-log";
import type {
  VoiceFlowFormData,
  VoiceFlowSettings,
  ToneOption,
} from "@/stores/voice-flow-editor";

// ── Options ──

export interface VoiceFlowManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ── Read state ──

function readState(): Record<string, unknown> {
  const { form } = useVoiceFlowEditor.getState();
  return {
    transcriptCount: form.transcripts.length,
    activeTranscriptId: form.activeTranscriptId,
    activeTranscript: form.transcripts.find((t) => t.id === form.activeTranscriptId) ?? null,
    settings: { ...form.settings },
    recentTranscripts: form.transcripts.slice(-5).map((t) => ({
      id: t.id,
      status: t.status,
      tone: t.tone,
      duration: t.duration,
      createdAt: t.createdAt,
      preview: (t.editedTranscript || t.cleanedTranscript || t.rawTranscript).slice(0, 120),
    })),
  };
}

// ── Manifest Factory ──

export function createVoiceFlowManifest(options?: VoiceFlowManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "voice-flow",
    toolName: "VoiceFlow AI Dictation",
    actions: [
      {
        name: "readCurrentState",
        description: "Read the current VoiceFlow state including active transcript, settings, and recent history.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },
      {
        name: "updateContext",
        description: "Update the dictation context — describe what the user is dictating about so post-processing uses correct terminology.",
        parameters: {
          type: "object",
          properties: {
            context: { type: "string", description: "Free-form context description" },
          },
          required: ["context"],
        },
        category: "Content",
      },
      {
        name: "addVocabularyTerms",
        description: "Add custom vocabulary terms (comma-separated) that the transcription should recognize accurately.",
        parameters: {
          type: "object",
          properties: {
            terms: { type: "string", description: "Comma-separated list of terms or phrases" },
          },
          required: ["terms"],
        },
        category: "Content",
      },
      {
        name: "clearVocabulary",
        description: "Clear all custom vocabulary terms.",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },
      {
        name: "editActiveTranscript",
        description: "Edit the text of the currently active transcript.",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string", description: "The new/edited transcript text" },
          },
          required: ["text"],
        },
        category: "Content",
      },
      {
        name: "updateSettings",
        description: "Update VoiceFlow settings: tone (natural/professional/casual/technical/academic/creative), language (ISO code or 'auto'), autoPostProcess (bool), autoCopyToClipboard (bool), showRawTranscript (bool), recordingMode ('hold'|'tap').",
        parameters: {
          type: "object",
          properties: {
            tone: { type: "string" },
            language: { type: "string" },
            autoPostProcess: { type: "boolean" },
            autoCopyToClipboard: { type: "boolean" },
            showRawTranscript: { type: "boolean" },
            recordingMode: { type: "string" },
          },
        },
        category: "Settings",
      },
      {
        name: "copyToClipboard",
        description: "Copy the active transcript text to the user's clipboard.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "exportAllTranscripts",
        description: "Export all transcripts as a single text block (returns the combined text).",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "clearHistory",
        description: "Clear all transcript history.",
        parameters: { type: "object", properties: {} },
        category: "Content",
        destructive: true,
      },
      {
        name: "resetForm",
        description: "Reset VoiceFlow to default settings and clear all transcripts.",
        parameters: { type: "object", properties: {} },
        category: "Content",
        destructive: true,
      },
    ],

    getState: readState,

    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      try {
        const store = useVoiceFlowEditor.getState();

        switch (actionName) {
          case "readCurrentState":
            return { success: true, message: "Current state read successfully", newState: readState() };

          case "updateContext":
            store.updateSettings({ context: params.context as string });
            return { success: true, message: "Dictation context updated" };

          case "addVocabularyTerms": {
            const incoming = (params.terms as string).trim();
            const existing = store.form.settings.customVocabulary.trim();
            const merged = existing ? `${existing}, ${incoming}` : incoming;
            store.updateSettings({ customVocabulary: merged });
            return { success: true, message: `Added vocabulary terms: ${incoming}` };
          }

          case "clearVocabulary":
            store.updateSettings({ customVocabulary: "" });
            return { success: true, message: "Custom vocabulary cleared" };

          case "editActiveTranscript": {
            const activeId = store.form.activeTranscriptId;
            if (!activeId) {
              return { success: false, message: "No active transcript selected" };
            }
            store.updateTranscript(activeId, { editedTranscript: params.text as string });
            return { success: true, message: "Active transcript updated" };
          }

          case "updateSettings": {
            const patch: Partial<VoiceFlowSettings> = {};
            if (params.tone !== undefined) patch.tone = params.tone as ToneOption;
            if (params.language !== undefined) patch.language = params.language as string;
            if (params.autoPostProcess !== undefined) patch.autoPostProcess = params.autoPostProcess as boolean;
            if (params.autoCopyToClipboard !== undefined) patch.autoCopyToClipboard = params.autoCopyToClipboard as boolean;
            if (params.showRawTranscript !== undefined) patch.showRawTranscript = params.showRawTranscript as boolean;
            if (params.recordingMode !== undefined) patch.recordingMode = params.recordingMode as "hold" | "tap";
            store.updateSettings(patch);
            return { success: true, message: "Settings updated" };
          }

          case "copyToClipboard":
            options?.onPrintRef?.current?.();
            return { success: true, message: "Copied to clipboard" };

          case "exportAllTranscripts": {
            const all = store.form.transcripts
              .filter((t) => t.status === "ready")
              .map((t) => t.editedTranscript || t.cleanedTranscript || t.rawTranscript)
              .join("\n\n---\n\n");
            return {
              success: true,
              message: `Exported ${store.form.transcripts.length} transcripts`,
              newState: { exportedText: all } as unknown as Record<string, unknown>,
            };
          }

          case "clearHistory":
            store.clearHistory();
            return { success: true, message: "Transcript history cleared" };

          case "resetForm":
            store.resetForm();
            return { success: true, message: "VoiceFlow reset to defaults" };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Error: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useVoiceFlowEditor.getState().form,
    (snapshot) => useVoiceFlowEditor.getState().setForm(snapshot as VoiceFlowFormData),
  );
}
