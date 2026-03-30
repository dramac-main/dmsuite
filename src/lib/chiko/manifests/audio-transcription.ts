// =============================================================================
// DMSuite — Audio Transcription Action Manifest for Chiko
// Gives Chiko AI control over Audio Transcription settings, transcripts, and
// export capabilities.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import { useAudioTranscriptionEditor } from "@/stores/audio-transcription-editor";
import { withActivityLogging } from "@/stores/activity-log";
import type {
  AudioTranscriptionFormData,
  AudioTranscriptionSettings,
  ExportFormat,
} from "@/stores/audio-transcription-editor";

// ── Options ──

export interface AudioTranscriptionManifestOptions {
  onCopyRef?: React.RefObject<(() => void) | null>;
}

// ── Read state ──

function readState(): Record<string, unknown> {
  const { form } = useAudioTranscriptionEditor.getState();
  return {
    transcriptionCount: form.transcriptions.length,
    activeTranscriptionId: form.activeTranscriptionId,
    activeTranscription:
      form.transcriptions.find((t) => t.id === form.activeTranscriptionId) ?? null,
    settings: { ...form.settings },
    recentTranscriptions: form.transcriptions.slice(0, 5).map((t) => ({
      id: t.id,
      status: t.status,
      fileName: t.fileName,
      duration: t.duration,
      language: t.detectedLanguage || t.language,
      createdAt: t.createdAt,
      preview: t.transcript.slice(0, 120),
    })),
  };
}

// ── Manifest Factory ──

export function createAudioTranscriptionManifest(
  options?: AudioTranscriptionManifestOptions
): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "audio-transcription",
    toolName: "Audio Transcription",
    actions: [
      {
        name: "readCurrentState",
        description:
          "Read the current Audio Transcription state including active transcription, settings, and recent history.",
        parameters: { type: "object", properties: {} },
        category: "Info",
      },
      {
        name: "updateSettings",
        description:
          "Update transcription settings: language (ISO code or 'auto'), translateToEnglish (bool), showTimestamps (bool), exportFormat ('txt'|'srt'|'vtt'|'json').",
        parameters: {
          type: "object",
          properties: {
            language: { type: "string" },
            translateToEnglish: { type: "boolean" },
            showTimestamps: { type: "boolean" },
            exportFormat: { type: "string" },
          },
        },
        category: "Settings",
      },
      {
        name: "selectTranscription",
        description: "Select a transcription by its ID to make it active.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Transcription entry ID" },
          },
          required: ["id"],
        },
        category: "Content",
      },
      {
        name: "copyToClipboard",
        description: "Copy the active transcription text to the user's clipboard.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
      {
        name: "exportTranscription",
        description:
          "Get the active transcription text in the specified format (returns the text content).",
        parameters: {
          type: "object",
          properties: {
            format: {
              type: "string",
              description: "Export format: txt, srt, vtt, or json",
            },
          },
        },
        category: "Export",
      },
      {
        name: "clearHistory",
        description: "Clear all transcription history.",
        parameters: { type: "object", properties: {} },
        category: "Content",
        destructive: true,
      },
      {
        name: "resetForm",
        description: "Reset Audio Transcription to default settings and clear all history.",
        parameters: { type: "object", properties: {} },
        category: "Content",
        destructive: true,
      },
    ],

    getState: readState,

    executeAction: (
      actionName: string,
      params: Record<string, unknown>
    ): ChikoActionResult => {
      try {
        const store = useAudioTranscriptionEditor.getState();

        switch (actionName) {
          case "readCurrentState":
            return {
              success: true,
              message: "Current state read successfully",
              newState: readState(),
            };

          case "updateSettings": {
            const patch: Partial<AudioTranscriptionSettings> = {};
            if (params.language !== undefined)
              patch.language = params.language as string;
            if (params.translateToEnglish !== undefined)
              patch.translateToEnglish = params.translateToEnglish as boolean;
            if (params.showTimestamps !== undefined)
              patch.showTimestamps = params.showTimestamps as boolean;
            if (params.exportFormat !== undefined)
              patch.exportFormat = params.exportFormat as ExportFormat;
            store.updateSettings(patch);
            return { success: true, message: "Settings updated" };
          }

          case "selectTranscription": {
            const id = params.id as string;
            const exists = store.form.transcriptions.some((t) => t.id === id);
            if (!exists) {
              return { success: false, message: "Transcription not found" };
            }
            store.setActiveTranscription(id);
            return { success: true, message: "Transcription selected" };
          }

          case "copyToClipboard":
            options?.onCopyRef?.current?.();
            return { success: true, message: "Copied to clipboard" };

          case "exportTranscription": {
            const active = store.form.transcriptions.find(
              (t) => t.id === store.form.activeTranscriptionId
            );
            if (!active) {
              return { success: false, message: "No active transcription" };
            }
            const fmt = (params.format as ExportFormat) || store.form.settings.exportFormat;
            // Inline minimal export
            let text: string;
            if (fmt === "json") {
              text = JSON.stringify(
                {
                  fileName: active.fileName,
                  duration: active.duration,
                  language: active.detectedLanguage || active.language,
                  transcript: active.transcript,
                  segments: active.segments,
                },
                null,
                2
              );
            } else if (fmt === "srt" && active.segments.length > 0) {
              text = active.segments
                .map((s, i) => {
                  const fmtTime = (sec: number) => {
                    const h = Math.floor(sec / 3600);
                    const m = Math.floor((sec % 3600) / 60);
                    const ss = Math.floor(sec % 60);
                    const ms = Math.floor((sec % 1) * 1000);
                    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
                  };
                  return `${i + 1}\n${fmtTime(s.start)} --> ${fmtTime(s.end)}\n${s.text}`;
                })
                .join("\n\n");
            } else {
              text = active.transcript;
            }
            return {
              success: true,
              message: `Exported as ${fmt.toUpperCase()}`,
              newState: { exportedText: text } as unknown as Record<string, unknown>,
            };
          }

          case "clearHistory":
            store.clearHistory();
            return { success: true, message: "Transcription history cleared" };

          case "resetForm":
            store.resetForm();
            return { success: true, message: "Audio Transcription reset to defaults" };

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return {
          success: false,
          message: `Error: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useAudioTranscriptionEditor.getState().form,
    (snapshot) =>
      useAudioTranscriptionEditor
        .getState()
        .setForm(snapshot as AudioTranscriptionFormData)
  );
}
