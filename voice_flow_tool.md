# DMSuite VoiceFlow Tool — Comprehensive Build Document

## PURPOSE

This document is a complete, self-contained specification for an AI agent to build the VoiceFlow tool inside the DMSuite platform. VoiceFlow is an AI-powered voice-to-text dictation tool that lets users speak naturally and receive clean, polished text. It is inspired by Wispr Flow and FreeFlow but built as a native DMSuite web tool with a future desktop companion app.

Read the entire TOOL-CREATION-GUIDE.md at D:\dramac-ai-suite\TOOL-CREATION-GUIDE.md before writing any code. Every pattern, naming convention, and architecture rule in that guide applies to this tool. Violations of the guide are bugs.

---

## TABLE OF CONTENTS

1. Platform Context and Existing Infrastructure
2. Tool Identity and Registration
3. Credit System and Profit Model
4. Architecture Overview
5. Phase 1 — API Routes (Server-Side Pipeline)
6. Phase 2 — Zustand Store
7. Phase 3 — Workspace Component (UI)
8. Phase 4 — Chiko AI Manifest
9. Phase 5 — Store Adapter and Router Registration
10. Phase 6 — Desktop Companion Architecture (Future)
11. File Manifest (Every File To Create or Modify)
12. Testing and Validation Checklist

---

## 1. PLATFORM CONTEXT AND EXISTING INFRASTRUCTURE

DMSuite is a Next.js 16 App Router application deployed on Vercel. It is a dark-first, glassmorphic, AI-powered creative suite with 195+ registered tools and 17 fully complete tools. The platform uses Supabase for auth and data, Zustand for state, Tailwind CSS v4 for styling, and Framer Motion for animations.

### What Already Exists (Do NOT Recreate)

These systems are production-ready. Import and use them:

- Authentication: Supabase auth with session middleware at src/middleware.ts and utility at src/lib/supabase/auth.ts. API routes use getAuthUser() which returns a mock user in dev mode.
- Credit System: src/data/credit-costs.ts defines pricing. src/lib/supabase/credits.ts provides checkCredits(), deductCredits(), refundCredits(), and logTokenUsage(). Credits are deducted before API calls and refunded on failure.
- Payments: Flutterwave integration (MTN Momo, Airtel Money) for credit purchases. Already live.
- Chiko AI Assistant: 31 tool manifests in src/lib/chiko/manifests/. System described in src/app/api/chiko/route.ts with streaming, context injection, and file support.
- Shared UI Components: src/components/workspaces/shared/WorkspaceUIKit.tsx exports FormInput, FormTextarea, FormSelect, Toggle, RangeSlider, ColorSwatchPicker, ChipGroup, AccordionSection, EditorTabNav, WorkspaceHeader, BottomBar, ActionButton, IconButton, ConfirmDialog, SIcon, Icons, TabIcons, InfoBadge, SelectionCard, WorkspaceErrorBoundary, and more.
- Workspace Events: src/lib/workspace-events.ts exports dispatchDirty(), dispatchProgress(), and WORKSPACE_EVENTS constants.
- Workspace Constants: src/lib/workspace-constants.ts exports ZOOM_MIN, ZOOM_MAX, ZOOM_STEP, ZOOM_DEFAULT, PAGE_DOTS_THRESHOLD, MILESTONE_EDIT_THRESHOLD.
- Print Utility: src/lib/print.ts exports printHTML().
- Store Adapters: src/lib/store-adapters.ts manages project data persistence. Every persisted store must have an adapter.
- Tool Router: src/app/tools/[categoryId]/[toolId]/page.tsx dynamically imports workspace components.
- Tools Registry: src/data/tools.ts contains all tool definitions including the Audio and Voice Studio category.
- Icons: src/components/icons.tsx contains 81+ icons with iconMap registry.

### Relevant Registered But Unbuilt Tools

The tools.ts file already registers these in the Audio and Voice Studio category with status coming-soon: voice-cloning, audio-transcription, music-generator, podcast-editor, text-to-speech. The credit-costs.ts file maps audio-transcription to audio-generation at 25 credits.

VoiceFlow replaces and supersedes audio-transcription. We will reuse the audio-transcription tool ID or create a new voice-flow ID depending on what is cleaner.

---

## 2. TOOL IDENTITY AND REGISTRATION

### Tool Definition (add to src/data/tools.ts in the Audio and Voice Studio category)

```
id: "voice-flow"
name: "VoiceFlow — AI Dictation"
description: "Speak naturally and get clean, polished text. Context-aware AI dictation that removes filler words, fixes grammar, and adapts tone to your task."
icon: "microphone" (add to icons.tsx if missing — use a microphone SVG)
status: "ready"
tags: ["voice", "dictation", "speech-to-text", "transcription", "audio", "accessibility", "productivity"]
aiProviders: ["whisper", "claude"]
outputs: ["txt", "clipboard"]
supportsPartEdit: false
printReady: false
devStatus: "scaffold" (change to "complete" when done)
```

### Tool ID Decision

Use voice-flow as the tool ID. Keep audio-transcription registered separately as a future batch-transcription tool for uploaded audio files. VoiceFlow is specifically for live dictation.

---

## 3. CREDIT SYSTEM AND PROFIT MODEL

### Cost Analysis

Groq Whisper Large V3 pricing: approximately 0.006 USD per minute of audio. For a typical 30-second dictation that is approximately 0.003 USD.

Post-processing with Claude Haiku 4.5: approximately 800 input tokens plus 400 output tokens equals approximately 0.002 USD per transcript cleanup.

Total API cost per standard dictation: approximately 0.005 USD.

At the Agency pack rate of 0.0093 USD per credit, with 100 percent margin formula: ceil(0.005 times 2 divided by 0.0093) equals ceil(1.08) equals 2 credits minimum.

### Credit Tiers To Add

Add these to CREDIT_COSTS in src/data/credit-costs.ts:

```
"voice-transcription": 3       (standard 30-second dictation, 140%+ margin)
"voice-transcription-long": 8  (recordings 1 to 5 minutes, 100%+ margin)
"voice-post-process": 0        (bundled into transcription, not charged separately)
```

Add to TOOL_CREDIT_MAP:

```
"voice-flow": "voice-transcription"
```

### Revenue Per Pack (Voice-Only Usage)

Starter 100 credits at K49: 33 transcriptions, API cost 0.17 USD, profit approximately K48.
Popular 500 credits at K199: 166 transcriptions, API cost 0.83 USD, profit approximately K196.
Pro 1500 credits at K499: 500 transcriptions, API cost 2.50 USD, profit approximately K492.
Agency 5000 credits at K1299: 1666 transcriptions, API cost 8.33 USD, profit approximately K1276.

That is 97 percent gross margin. Voice transcription is one of the most profitable operations on the platform.

---

## 4. ARCHITECTURE OVERVIEW

### The Pipeline

VoiceFlow uses a three-stage pipeline identical in concept to FreeFlow but running through the DMSuite server:

Stage 1 — Record: Browser MediaRecorder API captures audio from the user microphone. Audio is recorded as webm/opus or wav depending on browser support. No desktop install needed.

Stage 2 — Transcribe: Audio is uploaded to the DMSuite API route /api/voice/transcribe. The server forwards it to Groq Whisper API (whisper-large-v3 model) and returns raw transcript text.

Stage 3 — Post-Process: Raw transcript plus optional context (what the user is working on, their custom vocabulary, chosen tone) is sent to /api/voice/post-process. The server calls Claude Haiku to clean filler words, fix grammar and spelling, apply the correct tone, and respect custom vocabulary. Returns polished text.

### Key Differences From FreeFlow

FreeFlow is macOS-only native Swift. VoiceFlow is a web application that works on any device with a browser and microphone.

FreeFlow captures screenshots and active window context via macOS Accessibility APIs. VoiceFlow captures context from user input: the user can optionally describe what they are working on, or Chiko can infer it from the active tool context if they are already inside DMSuite.

FreeFlow pastes directly into any app. VoiceFlow outputs to a text editor within the workspace, with one-click copy to clipboard.

FreeFlow is free with a Groq API key. VoiceFlow uses DMSuite credits so Drake profits from every use.

### Workspace Pattern

VoiceFlow uses a modified Pattern A layout (Multi-Panel Editor). The left panel has recording controls, settings, and transcript history. The center panel shows the live and cleaned transcript with a large editor. There is no layers panel (not a document-type tool). Instead the right area contains a settings and vocabulary panel that collapses.

```
+------------------+----------------------------------+-----------------+
| Recording Panel  | Transcript Editor                | Settings Panel  |
| (w-80)           | (flex-1)                         | (w-64 / w-8)    |
|                  |                                  |                 |
| WorkspaceHeader  | Toolbar: copy, clear, export     | "Settings"      |
| [Record Button]  | +----------------------------+   |                 |
| Waveform visual  | |                            |   | Context input   |
| Duration counter | |  Cleaned transcript text   |   | Tone selector   |
|                  | |  (editable textarea)       |   | Language        |
| History list:    | |                            |   | Custom vocab    |
|  > Transcript 1  | +----------------------------+   | Auto-copy       |
|  > Transcript 2  |                                  | Audio quality   |
|  > Transcript 3  | Raw transcript (collapsible)     |                 |
|                  |                                  | [Collapse]      |
| [Start Over]     |                                  |                 |
+------------------+----------------------------------+-----------------+
| Mobile BottomBar (lg:hidden): [Record] [Text] [Settings]              |
+-----------------------------------------------------------------------+
```

---

## 5. PHASE 1 — API ROUTES (SERVER-SIDE PIPELINE)

### Route 1: /api/voice/transcribe

Create file: src/app/api/voice/transcribe/route.ts

This route receives audio, sends it to Groq Whisper, and returns the raw transcript.

Request: POST with multipart/form-data containing:
- file: audio blob (webm, wav, or m4a, max 25 MB which is Groq limit)
- language: optional ISO 639-1 language code (default "en")

Response: JSON with transcript text, detected language, duration in seconds, and credits used.

Implementation steps:

1. Import getAuthUser from src/lib/supabase/auth.ts. Call it to verify the user is authenticated. Return 401 if not.

2. Parse the multipart form data using the standard Web API request.formData().

3. Get the audio file from the form data. Validate it exists, validate the MIME type is one of audio/webm, audio/wav, audio/mpeg, audio/mp4, audio/ogg, audio/m4a. Return 400 for invalid types.

4. Check file size. If over 25 MB return 400 with message about file size limit.

5. Determine credit operation based on audio duration estimate. If the file size suggests a long recording (over 2 MB for compressed formats or over 5 MB for WAV), use voice-transcription-long at 8 credits. Otherwise use voice-transcription at 3 credits. This is a heuristic. A more precise approach is to check the actual duration after transcription and adjust, but for simplicity charge upfront based on size.

6. Call checkCredits(userId, operation). If not allowed, return 402 with error "Insufficient credits" and include balance and cost in the response.

7. Call deductCredits(userId, cost, operation, "VoiceFlow transcription"). This deducts upfront. We will refund on failure.

8. Build the Groq API request. The Groq transcription endpoint is https://api.groq.com/openai/v1/audio/transcriptions. It accepts multipart/form-data with fields: file (the audio blob), model (whisper-large-v3), language (optional), response_format (json).

9. The Groq API key must be stored as an environment variable GROQ_API_KEY in .env.local. Add it to .env.example as well.

10. Send the request to Groq using fetch with the audio file as a Blob in FormData. Set Authorization header to Bearer plus the GROQ API key. Set a timeout of 30 seconds.

11. If the Groq API returns an error, call refundCredits(userId, cost, "VoiceFlow transcription failed") and return 502 with the error message.

12. Parse the JSON response. Groq returns { text: string }. The text field is the raw transcript.

13. If the transcript is empty or only whitespace, refund credits and return 200 with an empty transcript and a message indicating no speech was detected.

14. Return 200 with JSON: { transcript: string, language: string, creditsUsed: number }.

15. In a finally block or after the response, call logTokenUsage to record the actual API cost. For Whisper, there are no tokens — log inputTokens as 0 and outputTokens as 0, model as "whisper-large-v3". The api_cost_usd can be estimated as duration_seconds times 0.0001 (0.006 per minute).

Security considerations:
- Validate MIME type server-side. Do not trust the client Content-Type.
- Do not write audio to disk. Process entirely in memory.
- Rate limit by user. The credit system provides natural rate limiting but add a simple in-memory rate limit of 30 requests per minute per user as a safety net.
- Sanitize the language parameter. Only allow valid ISO 639-1 codes (2-letter strings, alphanumeric).

### Route 2: /api/voice/post-process

Create file: src/app/api/voice/post-process/route.ts

This route takes a raw transcript and context, sends it to an LLM for cleanup.

Request: POST with JSON body:
- transcript: string (the raw transcript text, required)
- context: string (optional description of what the user is working on)
- tone: string (optional, one of: "natural", "professional", "casual", "technical", "academic", "creative")
- vocabulary: string (optional comma-separated list of custom terms to spell correctly)
- language: string (optional ISO 639-1 code)

Response: JSON with cleaned transcript text.

Implementation steps:

1. Authenticate with getAuthUser(). Return 401 if not authenticated.

2. Parse the JSON body and validate. transcript is required and must be a non-empty string under 10000 characters. tone must be one of the allowed values or default to "natural". vocabulary must be under 2000 characters.

3. This route does NOT charge additional credits. Post-processing is bundled into the transcription credit cost. The cost was already paid in the /transcribe route.

4. Build the LLM prompt. Use Claude Haiku 4.5 via the Anthropic API (the platform already has ANTHROPIC_API_KEY configured).

System prompt:

```
You are a dictation post-processor for DMSuite VoiceFlow. You receive raw speech-to-text output and return clean text ready to be used.

Your job:
- Remove filler words (um, uh, you know, like, so, basically) unless they carry genuine meaning.
- Fix spelling, grammar, and punctuation errors introduced by the speech-to-text model.
- When the transcript contains a word that is a close misspelling of a name or term from the custom vocabulary, correct the spelling. Never insert names or terms that the speaker did not say.
- Adjust the tone to match the requested style while preserving the speaker's intent and meaning exactly.
- Format appropriately: add paragraph breaks for long passages, use proper capitalization, add punctuation.

Tone guidelines:
- natural: Keep close to how the person spoke, just clean up errors and filler.
- professional: Formal business language, complete sentences, no contractions.
- casual: Friendly and conversational, contractions OK, relaxed punctuation.
- technical: Precise terminology, structured sentences, no ambiguity.
- academic: Formal, citation-ready language, complex sentence structures.
- creative: Expressive, varied sentence lengths, literary flair.

Output rules:
- Return ONLY the cleaned text. No labels, no markdown, no quotes around the output, no explanations.
- If the transcript is empty or nonsensical, return exactly: EMPTY
- Do not add content the speaker did not say. Context and vocabulary are only for correcting existing words.
- Preserve the speaker's meaning. Do not rephrase ideas.
```

User prompt:

```
CONTEXT: "{context or 'General dictation'}"
TONE: "{tone}"
CUSTOM VOCABULARY: "{vocabulary or 'None'}"
LANGUAGE: "{language or 'English'}"

RAW TRANSCRIPT:
"{transcript}"
```

5. Call the Anthropic API using fetch to https://api.anthropic.com/v1/messages. Model: claude-haiku-4-5. Max tokens: 4096. Temperature: 0.1.

6. Parse the response. Extract the text content from the first content block.

7. Clean the response: trim whitespace, strip outer quotes if the model wrapped them, return empty string if the model returned "EMPTY".

8. Return 200 with JSON: { cleaned: string, model: string }.

9. Log token usage with logTokenUsage for analytics tracking.

Security considerations:
- Validate and sanitize all string inputs. Limit lengths.
- The context field could contain sensitive information. Do not log it. Do not store it.
- Do not echo back the raw transcript in error messages.

### Environment Variables Required

Add to .env.example:

```
GROQ_API_KEY=your_groq_api_key_here
```

The ANTHROPIC_API_KEY already exists in .env.local and is used by the chat and chiko routes. Reuse it.

---

## 6. PHASE 2 — ZUSTAND STORE

Create file: src/stores/voice-flow-editor.ts

This store manages the VoiceFlow workspace state including recording status, transcripts, settings, and history.

### State Interface

```
VoiceFlowFormData:
  transcripts: TranscriptEntry[] (history of all transcriptions in this session)
  activeTranscriptId: string or null (currently selected transcript)
  settings:
    tone: "natural" | "professional" | "casual" | "technical" | "academic" | "creative"
    language: string (ISO 639-1 code, default "en")
    autoPostProcess: boolean (default true — automatically clean after transcription)
    autoCopyToClipboard: boolean (default false)
    customVocabulary: string (comma-separated terms)
    context: string (optional description of what user is working on)
    showRawTranscript: boolean (default false — toggle to show raw vs cleaned)

TranscriptEntry:
  id: string (uuid)
  rawTranscript: string
  cleanedTranscript: string
  editedTranscript: string (user can manually edit the cleaned text)
  tone: string (tone used for this entry)
  language: string
  duration: number (seconds)
  creditsUsed: number
  createdAt: string (ISO timestamp)
  status: "recording" | "transcribing" | "post-processing" | "ready" | "error"
  errorMessage: string or null

VoiceFlowEditorState:
  form: VoiceFlowFormData
  isRecording: boolean (UI state, not persisted to localStorage)
  recordingDuration: number (seconds, live counter)

  Actions:
    addTranscript(entry: TranscriptEntry): void
    updateTranscript(id: string, patch: Partial<TranscriptEntry>): void
    removeTranscript(id: string): void
    setActiveTranscript(id: string or null): void
    updateSettings(patch: Partial<VoiceFlowFormData["settings"]>): void
    setRecording(isRecording: boolean): void
    setRecordingDuration(seconds: number): void
    clearHistory(): void
    resetForm(): void
    setForm(data: VoiceFlowFormData): void
```

### Store Implementation Notes

Follow the exact middleware stacking pattern from TOOL-CREATION-GUIDE.md section 7: temporal(persist(immer(...))).

Persist key: "dmsuite-voice-flow".

Partialize for persist: only persist { form } (the transcripts and settings). Do NOT persist isRecording or recordingDuration — those are ephemeral UI state.

Partialize for temporal (undo): track { form } only.

The isRecording and recordingDuration fields live outside the immer form object. They are top-level state fields that are not persisted and not tracked by undo.

Default form values:
- transcripts: empty array
- activeTranscriptId: null
- settings.tone: "natural"
- settings.language: "en"
- settings.autoPostProcess: true
- settings.autoCopyToClipboard: false
- settings.customVocabulary: ""
- settings.context: ""
- settings.showRawTranscript: false

---

## 7. PHASE 3 — WORKSPACE COMPONENT (UI)

### File Structure

```
src/components/workspaces/voice-flow/
  VoiceFlowWorkspace.tsx         (main workspace component)
  VoiceFlowTranscriptEditor.tsx  (center panel transcript display and editor)
  VoiceFlowSettingsPanel.tsx     (right panel settings and vocabulary)
  VoiceFlowRecorder.tsx          (recording button, waveform, duration)
  tabs/
    VoiceFlowHistoryTab.tsx      (transcript history list in left panel)
    VoiceFlowSettingsTab.tsx     (settings form in left panel)
```

### VoiceFlowWorkspace.tsx — Main Component

This is the entry point registered in the tool router. It renders a three-panel layout.

#### Left Panel (Recording and History)

Width: lg:w-80 xl:w-96. Contains:

1. WorkspaceHeader with title "VoiceFlow" and subtitle showing credit cost "3 credits per use".

2. The VoiceFlowRecorder component: a large circular record button (centered, 80px diameter). The button pulses with a red glow animation when recording. Below it shows recording duration as mm:ss. Below that shows a real-time audio waveform visualization using the Web Audio API AnalyserNode to draw frequency bars on a canvas element.

3. EditorTabNav with two tabs: "History" and "Settings".

4. Tab content area (scrollable):
   - History tab: shows a list of past transcriptions in reverse chronological order. Each entry shows a truncated preview of the cleaned text (first 60 characters), the timestamp, duration, credits used, and status. Clicking an entry sets it as the active transcript and shows it in the center panel. A delete button (small X) removes entries.
   - Settings tab: contains the settings form (tone, language, vocabulary, context, toggles).

5. Start Over button at the bottom in every tab.

#### Center Panel (Transcript Editor)

Flex-1 fills remaining width. Contains:

1. Toolbar row (h-10, border-b, bg-gray-900/30) with:
   - Toggle between "Cleaned" and "Raw" transcript view (only when showRawTranscript setting allows)
   - Copy to clipboard button
   - Clear current transcript button
   - Word count display (text-[10px] font-mono text-gray-500)

2. Main content area: a large textarea or contentEditable div showing the active transcript. When no transcript is active, show an EmptyState component with a microphone icon and message "Hold the record button and speak. Your words will appear here."

3. The textarea is editable. Edits are saved to editedTranscript on the active TranscriptEntry. This allows the user to refine the AI output.

4. Below the main editor, if the raw transcript is available and different from the cleaned version, show a collapsible "Raw Transcript" section with the original text in a smaller, muted font.

5. Status indicators: when the pipeline is running, show inline status messages:
   - "Recording..." with a pulsing red dot
   - "Transcribing..." with a spinning loader
   - "Cleaning up..." with a sparkle animation
   - "Ready" with a green check, then fades out after 2 seconds

#### Right Panel (Settings — Collapsible)

Width: w-64 expanded, w-8 collapsed. Visible on lg+ only.

Contains AccordionSection components for:

1. Context: FormTextarea where user describes what they are working on (placeholder: "Replying to an email from Sarah about the Q2 report..."). This context is sent to the post-processing LLM to improve accuracy.

2. Tone: ChipGroup with options natural, professional, casual, technical, academic, creative. Each has a small description tooltip.

3. Language: FormSelect dropdown with common languages. English is default. Include: English, Spanish, French, German, Portuguese, Italian, Dutch, Japanese, Chinese, Korean, Arabic, Hindi, Swahili, and "Auto-detect".

4. Custom Vocabulary: FormTextarea for comma-separated terms (placeholder: "DMSuite, Chiko, Zambia, Kwacha, Flutterwave"). These terms are sent to the LLM to ensure correct spelling.

5. Preferences: Toggle switches for Auto-copy to clipboard and Auto-post-process (both from settings).

#### Mobile Layout

On mobile (below lg breakpoint), the three panels collapse to a single-panel view with a BottomBar:

BottomBar actions: Record (primary, always visible), Text (shows transcript), Settings (shows settings).

The Record action should trigger the recording flow directly, not switch panels. When recording is active, the BottomBar Record button should show a stop icon and be red.

### Recording Flow (VoiceFlowRecorder.tsx)

This is the core interaction. The user presses and holds (or taps to toggle) the record button.

#### Browser Audio Capture

Use the MediaRecorder API:

1. On record start: call navigator.mediaDevices.getUserMedia({ audio: true }). Handle permission denied gracefully with a clear error message ("Microphone access is required. Please allow microphone access in your browser settings.").

2. Create a MediaRecorder with the stream. Preferred MIME type priority: audio/webm;codecs=opus (Chrome, Edge), audio/mp4 (Safari), audio/ogg;codecs=opus (Firefox fallback), audio/wav (legacy fallback). Use MediaRecorder.isTypeSupported() to find the first supported type.

3. Collect audio chunks in an array via the ondataavailable event. Set timeslice to 250ms for responsive waveform visualization.

4. Start a duration counter using setInterval every 100ms. Display as mm:ss in the UI. Store in the Zustand store via setRecordingDuration.

5. For waveform visualization: create an AudioContext and AnalyserNode. Connect the media stream to the analyser. In a requestAnimationFrame loop, read frequency data with getByteFrequencyData and render bars on a small canvas element (width 100%, height 48px, using the primary-500 color for bars against a transparent background).

6. On record stop: stop the MediaRecorder, stop all tracks on the stream, clear the duration interval, stop the animation frame loop.

7. Combine the audio chunks into a single Blob. Create a File object with an appropriate name (voiceflow-{timestamp}.webm).

#### Upload and Processing Flow

After recording stops:

1. Create a new TranscriptEntry with status "transcribing", a generated UUID, and the current timestamp. Add it to the store and set it as active.

2. Create a FormData with the audio file and language setting. POST to /api/voice/transcribe.

3. If the transcription succeeds, update the entry with rawTranscript and status "post-processing" (if autoPostProcess is on) or "ready" (if off).

4. If autoPostProcess is on, immediately POST to /api/voice/post-process with the raw transcript, context, tone, vocabulary, and language. Update the entry with cleanedTranscript and editedTranscript (initially same as cleaned), and set status to "ready".

5. If autoCopyToClipboard is on and the transcript is ready, copy the cleaned text to clipboard using navigator.clipboard.writeText().

6. If any step fails, update the entry with status "error" and the error message. Show a toast/notification. The credits were already refunded server-side on transcription failure.

7. Dispatch workspace events: dispatchDirty() when a new transcript is added, dispatchProgress("content") when a transcript reaches "ready" status.

#### Recording Modes

Support two recording modes:

Hold-to-record: User presses and holds the record button. Recording starts on mousedown/touchstart and stops on mouseup/touchend. This is the default and primary mode.

Tap-to-toggle: User taps the record button once to start, taps again to stop. A small toggle below the record button lets the user switch between "Hold" and "Tap" mode. Store the preference in Zustand settings.

### Audio Waveform Visualization

The waveform is a real-time frequency bar visualization rendered on an HTML canvas element. It provides visual feedback that the microphone is working and capturing audio.

Implementation:
- Canvas dimensions: 100% width of the parent container, 48px height.
- Draw 32 vertical bars evenly spaced across the canvas width.
- Bar width: canvas width divided by 64 (32 bars with gaps). Bar gap: same as bar width.
- Bar height: scaled from the AnalyserNode frequencyBinCount data, mapped to canvas height.
- Bar color: primary-500 (#8b5cf6) with 80% opacity. Bar radius: 2px rounded tops.
- Background: transparent.
- When not recording, show flat bars at 2px height (idle state).
- Animate with requestAnimationFrame, cleanup on unmount.

### Transcript History List

Each entry in the history shows:
- A small status indicator dot (green for ready, yellow for processing, red for error).
- Truncated text preview (first 60 chars of editedTranscript or cleanedTranscript or rawTranscript, whichever is available).
- Relative timestamp ("2m ago", "1h ago", or full date if older than 24h).
- Duration badge (e.g., "0:32").
- Credits used badge (e.g., "3 cr").
- Click to select (sets active transcript, shows in center editor).
- Small delete button on hover (with ConfirmDialog for destructive action).

---

## 8. PHASE 4 — CHIKO AI MANIFEST

Create file: src/lib/chiko/manifests/voice-flow.ts

VoiceFlow needs a Chiko manifest so the AI assistant can help users with dictation settings, manage their vocabulary, and process transcripts.

### Manifest Actions

Read actions:
- readCurrentState: Returns current settings (tone, language, vocabulary, context), transcript count, active transcript preview. Category: Read.

Content actions:
- updateContext: Set the context description. Parameters: context (string). Category: Content.
- addVocabularyTerms: Add terms to the custom vocabulary. Parameters: terms (string, comma-separated). Category: Content.
- clearVocabulary: Clear all custom vocabulary. Category: Content.
- editActiveTranscript: Replace the text of the active transcript. Parameters: text (string). Category: Content. This allows Chiko to further refine a transcript when asked.

Settings actions:
- updateSettings: Change tone, language, auto-copy, auto-post-process. Parameters: tone (string, enum of allowed values), language (string), autoCopyToClipboard (boolean), autoPostProcess (boolean). All optional. Category: Settings.

Export actions:
- copyToClipboard: Copy the active transcript to clipboard. Category: Export.
- exportAllTranscripts: Export all transcripts as a single text file. Category: Export.

History actions:
- clearHistory: Delete all transcripts. Category: Reset. Destructive: true.

Standard actions:
- resetForm: Reset all settings and clear history. Category: Reset. Destructive: true.
- getActivityLog: Auto-added by withActivityLogging.
- revertToState: Auto-added by withActivityLogging.

### Manifest Registration

Register in VoiceFlowWorkspace.tsx using the standard pattern:

```
const chikoOnPrintRef = useRef<(() => void) | null>(null);
useEffect(() => { chikoOnPrintRef.current = handleCopyToClipboard; }, [handleCopyToClipboard]);
useChikoActions(() => createVoiceFlowManifest({ onPrintRef: chikoOnPrintRef }));
```

Wrap with withActivityLogging using form snapshot and setForm restore function.

---

## 9. PHASE 5 — STORE ADAPTER AND ROUTER REGISTRATION

### Store Adapter

Add to src/lib/store-adapters.ts:

Create a getVoiceFlowAdapter function following the exact pattern of existing adapters:

```
function getVoiceFlowAdapter(): StoreAdapter {
  const { useVoiceFlowEditor } = require("@/stores/voice-flow-editor");
  return {
    getSnapshot: () => {
      const { form } = useVoiceFlowEditor.getState();
      return { form };
    },
    restoreSnapshot: (data) => {
      if (data.form) {
        useVoiceFlowEditor.getState().setForm(data.form);
      }
    },
    resetStore: () => {
      useVoiceFlowEditor.getState().resetForm();
      nukePersistStorage("dmsuite-voice-flow");
    },
  };
}
```

Register in ADAPTER_FACTORIES:

```
"voice-flow": getVoiceFlowAdapter,
```

### Tool Router Registration

Add to src/app/tools/[categoryId]/[toolId]/page.tsx in the workspaceComponents object:

```
"voice-flow": dynamic(() => import("@/components/workspaces/voice-flow/VoiceFlowWorkspace")),
```

### TOOL-STATUS.md Update

Add VoiceFlow under the SCAFFOLD section initially, then move to COMPLETE when fully tested:

```
| 18 | voice-flow | VoiceFlow — AI Dictation | voice-flow/VoiceFlowWorkspace | Browser mic capture, Groq Whisper transcription, Claude post-processing, context-aware, custom vocabulary, tone selection, transcript history |
```

### Icon Registration

If a microphone icon does not already exist in src/components/icons.tsx, add one:

```
export function IconMicrophone(props: SVGProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
```

Register in iconMap: microphone: IconMicrophone.

Also add a waveform icon for the history/recording state if desired.

---

## 10. PHASE 6 — DESKTOP COMPANION ARCHITECTURE (FUTURE)

This section documents the architecture for a future downloadable desktop companion app. Do NOT build this in Phase 1. This is included for planning purposes only.

### Concept

A lightweight desktop application (built with Tauri or Electron) that runs in the Windows system tray. It captures global hotkeys, records microphone audio, sends it to the DMSuite VoiceFlow API, and pastes the cleaned text into whatever application the user is working in.

### Authentication Link

The desktop app authenticates against the DMSuite platform:

1. User downloads a small executable from the DMSuite website (the tools page or a dedicated /download route).
2. On first launch, the app opens the user's browser to https://yourdomain.com/auth/desktop-link.
3. The user logs in with their DMSuite account.
4. The platform generates a secure device token (UUID, stored in a device_tokens table linked to the user profile).
5. The browser redirects to a custom protocol URI (dmsuite://auth?token=xxxxx) which the desktop app intercepts.
6. The desktop app stores the token locally in an encrypted file.
7. Every API call from the desktop app includes the device token in the Authorization header.
8. The server validates the device token, looks up the user, and deducts credits from their account.

### Desktop App Capabilities

Global hotkey (configurable, default: Ctrl+Shift+Space for hold, Ctrl+Shift+V for toggle).
System tray icon showing recording state (idle, recording, processing).
Microphone selection (enumerate audio input devices).
Audio capture and encoding (WAV or WebM).
API calls to /api/voice/transcribe and /api/voice/post-process with the device token.
Text pasting via Windows SendInput API (simulates Ctrl+V after copying to clipboard).
Context capture: read the active window title and process name using Windows API (GetForegroundWindow, GetWindowText). Send this as context to the post-processing endpoint.
Settings sync: pull settings (tone, vocabulary, language) from the user's DMSuite profile.
Credit balance display in system tray tooltip.
Auto-update mechanism.

### API Changes for Desktop Support

Add a new header check in the voice API routes: if Authorization header contains a device token (prefixed with "dt_"), validate against the device_tokens table instead of the Supabase session cookie.

This is a future phase. The current web-based VoiceFlow tool is the priority.

---

## 11. FILE MANIFEST

Every file that must be created or modified, listed in build order:

### New Files To Create

1. src/app/api/voice/transcribe/route.ts — Transcription API route
2. src/app/api/voice/post-process/route.ts — Post-processing API route
3. src/stores/voice-flow-editor.ts — Zustand store
4. src/components/workspaces/voice-flow/VoiceFlowWorkspace.tsx — Main workspace
5. src/components/workspaces/voice-flow/VoiceFlowRecorder.tsx — Recording button, waveform, duration
6. src/components/workspaces/voice-flow/VoiceFlowTranscriptEditor.tsx — Center panel transcript display
7. src/components/workspaces/voice-flow/VoiceFlowSettingsPanel.tsx — Right panel settings
8. src/components/workspaces/voice-flow/tabs/VoiceFlowHistoryTab.tsx — Transcript history list
9. src/components/workspaces/voice-flow/tabs/VoiceFlowSettingsTab.tsx — Settings form
10. src/lib/chiko/manifests/voice-flow.ts — Chiko AI manifest

### Existing Files To Modify

11. src/data/credit-costs.ts — Add voice-transcription (3 credits), voice-transcription-long (8 credits) to CREDIT_COSTS. Add voice-flow to TOOL_CREDIT_MAP.
12. src/data/tools.ts — Add the voice-flow tool definition in the Audio and Voice Studio category. Update status from coming-soon to ready.
13. src/components/icons.tsx — Add IconMicrophone and IconWaveform if they do not exist. Register in iconMap.
14. src/app/tools/[categoryId]/[toolId]/page.tsx — Add dynamic import for voice-flow workspace.
15. src/lib/store-adapters.ts — Add getVoiceFlowAdapter and register in ADAPTER_FACTORIES.
16. src/styles/workspace-canvas.css — Add section highlighting CSS for VoiceFlow (prefix: vf).
17. TOOL-STATUS.md — Add VoiceFlow entry.
18. .env.example — Add GROQ_API_KEY placeholder.

---

## 12. TESTING AND VALIDATION CHECKLIST

Before marking the tool as COMPLETE, verify every item:

### TypeScript

- Zero TypeScript errors across all new files (run tsc --noEmit).
- No use of any type. No ts-ignore comments.
- All imports resolve correctly.

### Functionality

- Microphone permission request works and handles denial gracefully.
- Recording starts and stops correctly in both hold and tap modes.
- Audio waveform visualization renders during recording.
- Duration counter increments correctly during recording.
- Audio uploads to /api/voice/transcribe and returns a transcript.
- Post-processing via /api/voice/post-process cleans the transcript correctly.
- Credits are deducted on successful transcription.
- Credits are refunded on transcription failure.
- Transcript appears in the center editor panel.
- User can edit the cleaned transcript.
- Copy to clipboard works.
- Transcript history list shows all entries.
- Clicking a history entry makes it active.
- Deleting a history entry works with confirmation.
- Settings changes persist across page reloads (Zustand persist).
- Custom vocabulary terms are sent to the post-processing endpoint.
- Context description is sent to the post-processing endpoint.
- Tone selection affects the post-processing output.
- Start Over resets all state with confirmation.
- Undo and redo work for transcript edits.

### UI and Styling

- Dark mode looks correct. All surfaces use Tailwind tokens, no hardcoded hex colors.
- Glassmorphic surfaces with proper backdrop-blur and translucent borders.
- Animation on record button (pulse glow when recording).
- Framer Motion transitions on tab switches.
- Responsive layout works on mobile with BottomBar.
- Empty state displays when no transcripts exist.
- Loading states show during transcription and post-processing.
- Error states display clearly when something fails.

### Integration

- Chiko manifest is registered and all actions work.
- Activity logging wraps the manifest and records changes.
- Store adapter is registered and project data persists correctly.
- Tool appears in the DMSuite tool directory under Audio and Voice Studio.
- Clicking the tool navigates to the workspace correctly.
- Workspace events (dirty, progress) fire at the right times.
- Credit cost displays correctly in the UI.

### Security

- Audio files are validated server-side (MIME type, size).
- No audio is written to disk on the server.
- API routes authenticate users before processing.
- Credit checks happen before API calls.
- Refunds happen on failures.
- Language parameter is sanitized.
- No sensitive data is logged.
- Rate limiting prevents abuse.

### Browser Compatibility

- Chrome 90+ on Windows and Mac.
- Firefox 90+ on Windows and Mac.
- Safari 15+ on Mac.
- Edge 90+ on Windows.
- Mobile Safari on iOS 15+.
- Chrome on Android 10+.

---

## END OF DOCUMENT

This document contains everything needed to build VoiceFlow as a DMSuite tool. Read TOOL-CREATION-GUIDE.md for all architectural patterns, styling rules, and component APIs. Every convention in that guide applies here. Build in the order specified: API routes first, then store, then UI, then manifest, then integration. Test thoroughly before marking as COMPLETE.
