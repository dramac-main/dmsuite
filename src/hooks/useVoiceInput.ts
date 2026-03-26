"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ── useVoiceInput — Speech-to-Text with Wispr-like Polish ───
   Uses the Web Speech API for real-time transcription with
   interim results, then polishes the final transcript via
   server-side grammar correction for Wispr-quality output.
   ──────────────────────────────────────────────────────────── */

/** SpeechRecognition type shim for browsers */
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type VoiceInputState = "idle" | "listening" | "polishing" | "error";

export interface UseVoiceInputOptions {
  /** Language for recognition (default: "en-US") */
  lang?: string;
  /** Whether to auto-polish the transcript via API (default: true) */
  autoPolish?: boolean;
  /** Callback when final transcript is ready (after polish if enabled) */
  onTranscript?: (text: string) => void;
  /** Callback for interim results (real-time as user speaks) */
  onInterim?: (text: string) => void;
}

export interface UseVoiceInputReturn {
  /** Current state of voice input */
  state: VoiceInputState;
  /** Whether the browser supports speech recognition */
  isSupported: boolean;
  /** Interim transcript (updates in real-time while speaking) */
  interimText: string;
  /** Final transcript before polish */
  rawTranscript: string;
  /** Error message if state is "error" */
  errorMessage: string;
  /** Start listening */
  startListening: () => void;
  /** Stop listening (triggers polish + onTranscript) */
  stopListening: () => void;
  /** Cancel (discards everything) */
  cancel: () => void;
  /** Volume level 0-1 for visual feedback */
  volumeLevel: number;
}

/** Check if browser supports SpeechRecognition */
function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/** Polish raw transcript via server endpoint */
async function polishTranscript(raw: string): Promise<string> {
  if (!raw.trim()) return raw;
  try {
    const res = await fetch("/api/chiko/polish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: raw }),
    });
    if (!res.ok) return raw; // fallback to raw on error
    const data = await res.json();
    return data.polished || raw;
  } catch {
    return raw; // network error → fallback to raw
  }
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    lang = "en-US",
    autoPolish = true,
    onTranscript,
    onInterim,
  } = options;

  const [state, setState] = useState<VoiceInputState>("idle");
  const [interimText, setInterimText] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [isSupported] = useState(() => getSpeechRecognition() !== null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const finalTranscriptRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);
  const onInterimRef = useRef(onInterim);

  // Keep callback refs fresh without causing re-renders
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);

  /** Set up audio analyser for volume metering */
  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        // RMS of frequency data → 0-1 volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / dataArray.length) / 255;
        setVolumeLevel(Math.min(1, rms * 2.5)); // amplify slightly
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // Mic access denied or not available — volume meter won't work but recognition might
    }
  }, []);

  /** Stop audio meter and release mic stream */
  const stopAudioMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setVolumeLevel(0);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setState("error");
      setErrorMessage("Speech recognition is not supported in this browser.");
      return;
    }

    // Reset state
    finalTranscriptRef.current = "";
    setInterimText("");
    setRawTranscript("");
    setErrorMessage("");
    setState("listening");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        const transcript = result[0]?.transcript || "";
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) finalTranscriptRef.current = final;
      const display = (finalTranscriptRef.current + " " + interim).trim();
      setInterimText(display);
      onInterimRef.current?.(display);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      // "aborted" is expected when we call .abort()
      if (e.error === "aborted") return;
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access denied. Please allow mic permissions.",
        "no-speech": "No speech detected. Try again.",
        "audio-capture": "No microphone found.",
        "network": "Network error during recognition.",
      };
      setState("error");
      setErrorMessage(messages[e.error] || `Recognition error: ${e.error}`);
      stopAudioMeter();
    };

    recognition.onend = () => {
      // If we're still in "listening" state, the recognition ended naturally (silence timeout)
      // Process the final transcript
      if (finalTranscriptRef.current.trim()) {
        const raw = finalTranscriptRef.current.trim();
        setRawTranscript(raw);
        
        if (autoPolish) {
          setState("polishing");
          polishTranscript(raw).then((polished) => {
            setState("idle");
            setInterimText("");
            onTranscriptRef.current?.(polished);
          });
        } else {
          setState("idle");
          setInterimText("");
          onTranscriptRef.current?.(raw);
        }
      } else {
        setState("idle");
        setInterimText("");
      }
      stopAudioMeter();
    };

    recognitionRef.current = recognition;
    recognition.start();
    startAudioMeter();
  }, [lang, autoPolish, startAudioMeter, stopAudioMeter]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // triggers onend → processes transcript
      recognitionRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    stopAudioMeter();
    finalTranscriptRef.current = "";
    setState("idle");
    setInterimText("");
    setRawTranscript("");
    setErrorMessage("");
    setVolumeLevel(0);
  }, [stopAudioMeter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      stopAudioMeter();
    };
  }, [stopAudioMeter]);

  return {
    state,
    isSupported,
    interimText,
    rawTranscript,
    errorMessage,
    startListening,
    stopListening,
    cancel,
    volumeLevel,
  };
}
