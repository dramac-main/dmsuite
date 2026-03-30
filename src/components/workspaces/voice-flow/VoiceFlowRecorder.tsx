"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useVoiceFlowEditor } from "@/stores/voice-flow-editor";

/* ── Helpers ─────────────────────────────────────────────────── */

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "audio/webm";
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── Props ───────────────────────────────────────────────────── */

interface VoiceFlowRecorderProps {
  onRecordingComplete: (file: File, duration: number) => void;
}

/* ── Component ───────────────────────────────────────────────── */

export default function VoiceFlowRecorder({
  onRecordingComplete,
}: VoiceFlowRecorderProps) {
  const isRecording = useVoiceFlowEditor((s) => s.isRecording);
  const recordingDuration = useVoiceFlowEditor((s) => s.recordingDuration);
  const recordingMode = useVoiceFlowEditor((s) => s.form.settings.recordingMode);
  const setRecording = useVoiceFlowEditor((s) => s.setRecording);
  const setRecordingDuration = useVoiceFlowEditor((s) => s.setRecordingDuration);
  const updateSettings = useVoiceFlowEditor((s) => s.updateSettings);

  const [micError, setMicError] = useState<string | null>(null);

  // Refs for recording state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const mimeTypeRef = useRef<string>("");

  // Waveform visualization
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);

  /* ── Waveform drawing ─────────────────────────────────────── */

  const drawWaveform = useCallback((idle = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const barCount = 32;
    const barWidth = w / 64;
    const barGap = barWidth;

    ctx.clearRect(0, 0, w, h);

    if (idle || !analyserRef.current) {
      // Idle state: flat bars
      ctx.fillStyle = "rgba(139, 92, 246, 0.3)";
      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + barGap) + barGap / 2;
        const barH = 2;
        const y = h / 2 - barH / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 1);
        ctx.fill();
      }
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
    const step = Math.floor(bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + barGap) + barGap / 2;
      const val = dataArray[i * step] / 255;
      const barH = Math.max(2, val * h * 0.9);
      const y = h - barH;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 2);
      ctx.fill();
    }
  }, []);

  const animateWaveformRef = useRef<() => void>(undefined);

  const animateWaveform = useCallback(() => {
    drawWaveform(false);
    rafRef.current = requestAnimationFrame(() => animateWaveformRef.current?.());
  }, [drawWaveform]);

  useEffect(() => {
    animateWaveformRef.current = animateWaveform;
  }, [animateWaveform]);

  /* ── Start recording ──────────────────────────────────────── */

  const startRecording = useCallback(async () => {
    setMicError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio context for waveform
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "m4a" : "ogg";
        const file = new File(
          [blob],
          `voiceflow-${Date.now()}.${ext}`,
          { type: mimeType }
        );
        const duration = (Date.now() - startTimeRef.current) / 1000;
        onRecordingComplete(file, duration);
      };

      recorder.start(250);
      startTimeRef.current = Date.now();
      setRecording(true);
      setRecordingDuration(0);

      // Duration timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setRecordingDuration(elapsed);
      }, 100);

      // Start waveform animation
      animateWaveform();
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setMicError(
          "Microphone access is required. Please allow microphone access in your browser settings."
        );
      } else {
        setMicError("Failed to access microphone. Please check your device settings.");
      }
    }
  }, [setRecording, setRecordingDuration, onRecordingComplete, animateWaveform]);

  /* ── Stop recording ───────────────────────────────────────── */

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop waveform
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;

    // Close audio context
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;

    setRecording(false);
  }, [setRecording]);

  /* ── Cleanup on unmount ───────────────────────────────────── */

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  /* ── Draw idle waveform when not recording ────────────────── */

  useEffect(() => {
    if (!isRecording) {
      drawWaveform(true);
    }
  }, [isRecording, drawWaveform]);

  /* ── Hold-to-record handlers ──────────────────────────────── */

  const handlePointerDown = useCallback(() => {
    if (recordingMode === "hold" && !isRecording) {
      startRecording();
    }
  }, [recordingMode, isRecording, startRecording]);

  const handlePointerUp = useCallback(() => {
    if (recordingMode === "hold" && isRecording) {
      stopRecording();
    }
  }, [recordingMode, isRecording, stopRecording]);

  /* ── Tap-to-toggle handler ────────────────────────────────── */

  const handleTap = useCallback(() => {
    if (recordingMode === "tap") {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }, [recordingMode, isRecording, startRecording, stopRecording]);

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-4">
      {/* Record Button */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleTap}
        className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 select-none touch-none
          ${
            isRecording
              ? "bg-red-500 shadow-lg shadow-red-500/40 scale-110"
              : "bg-primary-500 hover:bg-primary-400 shadow-md shadow-primary-500/20 hover:scale-105"
          }`}
      >
        {/* Pulse animation ring */}
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
        )}
        {/* Icon */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 text-white relative z-10"
        >
          {isRecording ? (
            // Stop icon
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          ) : (
            // Microphone icon
            <>
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </>
          )}
        </svg>
      </button>

      {/* Duration counter */}
      <span
        className={`text-sm font-mono tabular-nums ${
          isRecording ? "text-red-400" : "text-gray-500"
        }`}
      >
        {formatDuration(recordingDuration)}
      </span>

      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-12"
        style={{ imageRendering: "auto" }}
      />

      {/* Recording mode toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateSettings({ recordingMode: "hold" })}
          className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
            recordingMode === "hold"
              ? "bg-primary-500/20 text-primary-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Hold
        </button>
        <button
          type="button"
          onClick={() => updateSettings({ recordingMode: "tap" })}
          className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
            recordingMode === "tap"
              ? "bg-primary-500/20 text-primary-400"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Tap
        </button>
      </div>

      {/* Mic error */}
      {micError && (
        <p className="text-[11px] text-red-400 text-center px-2">{micError}</p>
      )}
    </div>
  );
}
