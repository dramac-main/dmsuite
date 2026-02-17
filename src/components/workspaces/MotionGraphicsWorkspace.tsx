"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconFilm,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlay,
  IconPause,
  IconRefresh,
  IconDroplet,
  IconType,
  IconLayers,
  IconPlus,
  IconTrash,
  IconCopy,
  IconCamera,
} from "@/components/icons";
import { hexToRgba, cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "./StickyCanvasLayout";

/* ══════════════════════════════════════════════════════════════
   DMSuite — Motion Graphics Workspace
   Canvas-based motion graphics creator with real-time animated
   preview, particle systems, shape animations, easing functions,
   keyframed layers, and AI text generation.
   ══════════════════════════════════════════════════════════════ */

/* ── Types ─────────────────────────────────────────────────── */

type MotionCategory = "lower-thirds" | "title-cards" | "transitions" | "intros" | "social-bumpers" | "countdowns";

type EasingFn = "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce" | "elastic" | "back";

interface Keyframe {
  time: number;      // 0–1 normalised
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
}

interface MotionLayer {
  id: string;
  name: string;
  type: "text" | "shape" | "accent" | "particle" | "background";
  visible: boolean;
  keyframes: Keyframe[];
  easing: EasingFn;
  /* Text */
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  color?: string;
  /* Shape */
  shape?: "rect" | "circle" | "line" | "triangle" | "diamond";
  shapeWidth?: number;
  shapeHeight?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  /* Particle */
  particleCount?: number;
  particleSize?: number;
  particleColor?: string;
  particleSpread?: number;
}

interface MotionTemplate {
  id: string;
  name: string;
  category: MotionCategory;
  description: string;
  duration: number;
  layers: MotionLayer[];
}

interface ProjectConfig {
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  resolution: "1080p" | "720p" | "480p";
  fps: 24 | 30 | 60;
  bgColor: string;
  bgGradient: boolean;
  bgGradientEnd: string;
  duration: number;
  selectedTemplate: string;
  category: MotionCategory;
}

/* ── Easing Functions ─────────────────────────────────────── */

const EASINGS: Record<EasingFn, (t: number) => number> = {
  "linear": (t) => t,
  "ease-in": (t) => t * t * t,
  "ease-out": (t) => 1 - Math.pow(1 - t, 3),
  "ease-in-out": (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  "bounce": (t) => {
    const n1 = 7.5625; const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  "elastic": (t) => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3) + 1,
  "back": (t) => { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};

/* ── Constants ─────────────────────────────────────────────── */

const ASPECT_DIMS: Record<string, { w: number; h: number }> = {
  "16:9": { w: 1920, h: 1080 },
  "9:16": { w: 1080, h: 1920 },
  "1:1":  { w: 1080, h: 1080 },
  "4:5":  { w: 1080, h: 1350 },
};

const CATEGORIES: { id: MotionCategory; label: string; icon: string }[] = [
  { id: "lower-thirds",   label: "Lower Thirds",   icon: "▰" },
  { id: "title-cards",    label: "Title Cards",     icon: "◆" },
  { id: "transitions",    label: "Transitions",     icon: "◀▶" },
  { id: "intros",         label: "Intros",          icon: "✦" },
  { id: "social-bumpers", label: "Social Bumpers",  icon: "♥" },
  { id: "countdowns",     label: "Countdowns",      icon: "⏱" },
];

const COLOR_PRESETS = [
  "#8ae600", "#3b82f6", "#ef4444", "#f59e0b",
  "#a855f7", "#06b6d4", "#ec4899", "#10b981",
  "#f97316", "#6366f1", "#14b8a6", "#e11d48",
];

const EASING_OPTIONS: { id: EasingFn; label: string }[] = [
  { id: "linear",      label: "Linear" },
  { id: "ease-in",     label: "Ease In" },
  { id: "ease-out",    label: "Ease Out" },
  { id: "ease-in-out", label: "Ease In-Out" },
  { id: "bounce",      label: "Bounce" },
  { id: "elastic",     label: "Elastic" },
  { id: "back",        label: "Back" },
];

/* ── Template Factory ─────────────────────────────────────── */

function makeId() { return Math.random().toString(36).slice(2, 9); }

function createLowerThirdTemplate(name: string, desc: string): MotionTemplate {
  return {
    id: `lt-${makeId()}`, name, category: "lower-thirds", description: desc, duration: 4,
    layers: [
      {
        id: makeId(), name: "Bar", type: "shape", visible: true, easing: "ease-out",
        shape: "rect", shapeWidth: 600, shapeHeight: 70, fillColor: "#111827", strokeColor: "#8ae600", strokeWidth: 2,
        keyframes: [
          { time: 0, x: -600, y: 420, scale: 1, opacity: 0, rotation: 0 },
          { time: 0.15, x: 40, y: 420, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.85, x: 40, y: 420, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: -600, y: 420, scale: 1, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Accent Line", type: "shape", visible: true, easing: "ease-out",
        shape: "rect", shapeWidth: 4, shapeHeight: 70, fillColor: "#8ae600", strokeWidth: 0,
        keyframes: [
          { time: 0, x: -10, y: 420, scale: 1, opacity: 0, rotation: 0 },
          { time: 0.2, x: 40, y: 420, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.8, x: 40, y: 420, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: -10, y: 420, scale: 1, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Name", type: "text", visible: true, easing: "ease-out",
        text: "John Doe", fontSize: 28, fontWeight: "bold", fontFamily: "Inter", color: "#ffffff",
        keyframes: [
          { time: 0, x: 60, y: 445, scale: 0.8, opacity: 0, rotation: 0 },
          { time: 0.25, x: 60, y: 445, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.8, x: 60, y: 445, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 60, y: 445, scale: 0.8, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Title", type: "text", visible: true, easing: "ease-out",
        text: "Creative Director", fontSize: 16, fontWeight: "normal", fontFamily: "Inter", color: "#8ae600",
        keyframes: [
          { time: 0, x: 60, y: 475, scale: 0.8, opacity: 0, rotation: 0 },
          { time: 0.3, x: 60, y: 475, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.75, x: 60, y: 475, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 60, y: 475, scale: 0.8, opacity: 0, rotation: 0 },
        ],
      },
    ],
  };
}

function createTitleCardTemplate(name: string, desc: string): MotionTemplate {
  return {
    id: `tc-${makeId()}`, name, category: "title-cards", description: desc, duration: 3,
    layers: [
      {
        id: makeId(), name: "Top Line", type: "shape", visible: true, easing: "ease-in-out",
        shape: "rect", shapeWidth: 120, shapeHeight: 3, fillColor: "#8ae600",
        keyframes: [
          { time: 0, x: 480, y: 230, scale: 0, opacity: 0, rotation: 0 },
          { time: 0.25, x: 420, y: 230, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.8, x: 420, y: 230, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 230, scale: 0, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Title Text", type: "text", visible: true, easing: "ease-out",
        text: "CHAPTER ONE", fontSize: 48, fontWeight: "bold", fontFamily: "Inter", color: "#ffffff",
        keyframes: [
          { time: 0, x: 480, y: 280, scale: 1.3, opacity: 0, rotation: 0 },
          { time: 0.3, x: 480, y: 280, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.75, x: 480, y: 280, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 280, scale: 0.8, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Subtitle", type: "text", visible: true, easing: "ease-out",
        text: "The Beginning", fontSize: 20, fontWeight: "normal", fontFamily: "Inter", color: "#9ca3af",
        keyframes: [
          { time: 0, x: 480, y: 320, scale: 1, opacity: 0, rotation: 0 },
          { time: 0.35, x: 480, y: 320, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.7, x: 480, y: 320, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 320, scale: 1, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Bottom Line", type: "shape", visible: true, easing: "ease-in-out",
        shape: "rect", shapeWidth: 120, shapeHeight: 3, fillColor: "#8ae600",
        keyframes: [
          { time: 0, x: 480, y: 345, scale: 0, opacity: 0, rotation: 0 },
          { time: 0.25, x: 420, y: 345, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.8, x: 420, y: 345, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 345, scale: 0, opacity: 0, rotation: 0 },
        ],
      },
    ],
  };
}

function createTransitionTemplate(name: string, desc: string): MotionTemplate {
  return {
    id: `tr-${makeId()}`, name, category: "transitions", description: desc, duration: 1.2,
    layers: [
      {
        id: makeId(), name: "Wipe Bar 1", type: "shape", visible: true, easing: "ease-in-out",
        shape: "rect", shapeWidth: 1000, shapeHeight: 600, fillColor: "#8ae600",
        keyframes: [
          { time: 0, x: -1000, y: 270, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.4, x: 480, y: 270, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.6, x: 480, y: 270, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 1960, y: 270, scale: 1, opacity: 1, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Wipe Bar 2", type: "shape", visible: true, easing: "ease-in-out",
        shape: "rect", shapeWidth: 1000, shapeHeight: 600, fillColor: "#111827",
        keyframes: [
          { time: 0, x: -1200, y: 270, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.45, x: 480, y: 270, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.55, x: 480, y: 270, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 2160, y: 270, scale: 1, opacity: 1, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Center Flash", type: "particle", visible: true, easing: "ease-out",
        particleCount: 30, particleSize: 4, particleColor: "#8ae600", particleSpread: 200,
        keyframes: [
          { time: 0, x: 480, y: 270, scale: 0, opacity: 0, rotation: 0 },
          { time: 0.45, x: 480, y: 270, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.6, x: 480, y: 270, scale: 1.5, opacity: 0, rotation: 0 },
          { time: 1, x: 480, y: 270, scale: 2, opacity: 0, rotation: 0 },
        ],
      },
    ],
  };
}

function createIntroTemplate(name: string, desc: string): MotionTemplate {
  return {
    id: `in-${makeId()}`, name, category: "intros", description: desc, duration: 5,
    layers: [
      {
        id: makeId(), name: "Particles", type: "particle", visible: true, easing: "ease-out",
        particleCount: 60, particleSize: 3, particleColor: "#8ae600", particleSpread: 400,
        keyframes: [
          { time: 0, x: 480, y: 270, scale: 2, opacity: 0, rotation: 0 },
          { time: 0.3, x: 480, y: 270, scale: 1, opacity: 1, rotation: 180 },
          { time: 0.7, x: 480, y: 270, scale: 0.5, opacity: 1, rotation: 360 },
          { time: 1, x: 480, y: 270, scale: 0.2, opacity: 0, rotation: 540 },
        ],
      },
      {
        id: makeId(), name: "Glow Ring", type: "shape", visible: true, easing: "ease-in-out",
        shape: "circle", shapeWidth: 200, shapeHeight: 200, fillColor: "transparent", strokeColor: "#8ae600", strokeWidth: 3,
        keyframes: [
          { time: 0, x: 480, y: 270, scale: 0, opacity: 0, rotation: 0 },
          { time: 0.2, x: 480, y: 270, scale: 1.5, opacity: 1, rotation: 90 },
          { time: 0.4, x: 480, y: 270, scale: 1, opacity: 1, rotation: 180 },
          { time: 0.8, x: 480, y: 270, scale: 1, opacity: 1, rotation: 270 },
          { time: 1, x: 480, y: 270, scale: 2, opacity: 0, rotation: 360 },
        ],
      },
      {
        id: makeId(), name: "Brand Name", type: "text", visible: true, easing: "elastic",
        text: "BRAND NAME", fontSize: 56, fontWeight: "bold", fontFamily: "Inter", color: "#ffffff",
        keyframes: [
          { time: 0, x: 480, y: 260, scale: 0, opacity: 0, rotation: -10 },
          { time: 0.35, x: 480, y: 260, scale: 1.2, opacity: 1, rotation: 0 },
          { time: 0.5, x: 480, y: 260, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.85, x: 480, y: 260, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 260, scale: 0.8, opacity: 0, rotation: 5 },
        ],
      },
      {
        id: makeId(), name: "Tagline", type: "text", visible: true, easing: "ease-out",
        text: "Your tagline goes here", fontSize: 18, fontWeight: "normal", fontFamily: "Inter", color: "#8ae600",
        keyframes: [
          { time: 0, x: 480, y: 310, scale: 1, opacity: 0, rotation: 0 },
          { time: 0.45, x: 480, y: 310, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.8, x: 480, y: 310, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 310, scale: 1, opacity: 0, rotation: 0 },
        ],
      },
    ],
  };
}

function createSocialBumperTemplate(name: string, desc: string): MotionTemplate {
  return {
    id: `sb-${makeId()}`, name, category: "social-bumpers", description: desc, duration: 3,
    layers: [
      {
        id: makeId(), name: "BG Circle", type: "shape", visible: true, easing: "elastic",
        shape: "circle", shapeWidth: 180, shapeHeight: 180, fillColor: "#8ae600",
        keyframes: [
          { time: 0, x: 480, y: 240, scale: 0, opacity: 0, rotation: 0 },
          { time: 0.3, x: 480, y: 240, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.8, x: 480, y: 240, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 240, scale: 1.5, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "CTA Text", type: "text", visible: true, easing: "bounce",
        text: "FOLLOW", fontSize: 36, fontWeight: "bold", fontFamily: "Inter", color: "#111827",
        keyframes: [
          { time: 0, x: 480, y: 245, scale: 0, opacity: 0, rotation: 0 },
          { time: 0.35, x: 480, y: 245, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.75, x: 480, y: 245, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 245, scale: 1.3, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Handle", type: "text", visible: true, easing: "ease-out",
        text: "@yourbrand", fontSize: 18, fontWeight: "normal", fontFamily: "Inter", color: "#d1d5db",
        keyframes: [
          { time: 0, x: 480, y: 320, scale: 1, opacity: 0, rotation: 0 },
          { time: 0.4, x: 480, y: 320, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.7, x: 480, y: 320, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 320, scale: 1, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Sparkles", type: "particle", visible: true, easing: "ease-out",
        particleCount: 20, particleSize: 3, particleColor: "#8ae600", particleSpread: 160,
        keyframes: [
          { time: 0, x: 480, y: 240, scale: 0, opacity: 0, rotation: 0 },
          { time: 0.3, x: 480, y: 240, scale: 0.5, opacity: 1, rotation: 90 },
          { time: 0.7, x: 480, y: 240, scale: 1.5, opacity: 0.6, rotation: 270 },
          { time: 1, x: 480, y: 240, scale: 2, opacity: 0, rotation: 360 },
        ],
      },
    ],
  };
}

function createCountdownTemplate(name: string, desc: string): MotionTemplate {
  return {
    id: `cd-${makeId()}`, name, category: "countdowns", description: desc, duration: 5,
    layers: [
      {
        id: makeId(), name: "Ring", type: "shape", visible: true, easing: "linear",
        shape: "circle", shapeWidth: 220, shapeHeight: 220, fillColor: "transparent", strokeColor: "#8ae600", strokeWidth: 6,
        keyframes: [
          { time: 0, x: 480, y: 270, scale: 1, opacity: 1, rotation: 0 },
          { time: 1, x: 480, y: 270, scale: 1, opacity: 1, rotation: 360 },
        ],
      },
      {
        id: makeId(), name: "Number", type: "text", visible: true, easing: "ease-out",
        text: "5", fontSize: 120, fontWeight: "bold", fontFamily: "Inter", color: "#ffffff",
        keyframes: [
          { time: 0, x: 480, y: 285, scale: 1.5, opacity: 0, rotation: 0 },
          { time: 0.05, x: 480, y: 285, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.18, x: 480, y: 285, scale: 0.8, opacity: 0, rotation: 0 },
          { time: 0.2, x: 480, y: 285, scale: 1.5, opacity: 0, rotation: 0 },
          { time: 0.25, x: 480, y: 285, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.38, x: 480, y: 285, scale: 0.8, opacity: 0, rotation: 0 },
          { time: 0.4, x: 480, y: 285, scale: 1.5, opacity: 0, rotation: 0 },
          { time: 0.45, x: 480, y: 285, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.58, x: 480, y: 285, scale: 0.8, opacity: 0, rotation: 0 },
          { time: 0.6, x: 480, y: 285, scale: 1.5, opacity: 0, rotation: 0 },
          { time: 0.65, x: 480, y: 285, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.78, x: 480, y: 285, scale: 0.8, opacity: 0, rotation: 0 },
          { time: 0.8, x: 480, y: 285, scale: 1.5, opacity: 0, rotation: 0 },
          { time: 0.85, x: 480, y: 285, scale: 1, opacity: 1, rotation: 0 },
          { time: 0.98, x: 480, y: 285, scale: 0.8, opacity: 0, rotation: 0 },
          { time: 1, x: 480, y: 285, scale: 0, opacity: 0, rotation: 0 },
        ],
      },
      {
        id: makeId(), name: "Pulse Ring", type: "shape", visible: true, easing: "ease-out",
        shape: "circle", shapeWidth: 240, shapeHeight: 240, fillColor: "transparent", strokeColor: "#8ae600", strokeWidth: 2,
        keyframes: [
          { time: 0, x: 480, y: 270, scale: 0.8, opacity: 0.5, rotation: 0 },
          { time: 0.5, x: 480, y: 270, scale: 1.3, opacity: 0, rotation: 0 },
          { time: 0.51, x: 480, y: 270, scale: 0.8, opacity: 0.5, rotation: 0 },
          { time: 1, x: 480, y: 270, scale: 1.3, opacity: 0, rotation: 0 },
        ],
      },
    ],
  };
}

/* ── Generate Templates ───────────────────────────────────── */

const TEMPLATES: MotionTemplate[] = [
  createLowerThirdTemplate("Slide Bar", "Clean bar slides in with name and title"),
  createLowerThirdTemplate("Fade Reveal", "Elegant fade with accent line"),
  createLowerThirdTemplate("Modern Split", "Split color bar with bold type"),
  createLowerThirdTemplate("Box Frame", "Bordered box with corner accent"),
  createTitleCardTemplate("Center Focus", "Centered text with expanding lines"),
  createTitleCardTemplate("Kinetic Type", "Dynamic word-by-word reveal"),
  createTitleCardTemplate("Minimal", "Clean minimal fade with motion"),
  createTitleCardTemplate("Bold Impact", "Large bold text with color wipe"),
  createTransitionTemplate("Color Wipe", "Smooth dual-bar color wipe"),
  createTransitionTemplate("Zoom Blur", "Quick zoom with particle burst"),
  createTransitionTemplate("Glitch Cut", "Digital glitch-style transition"),
  createTransitionTemplate("Circle Reveal", "Expanding circle iris"),
  createIntroTemplate("Particle Converge", "Particles converge to form text"),
  createIntroTemplate("Logo Reveal", "Ring animation reveals brand"),
  createIntroTemplate("Wave Motion", "Flowing wave with brand elements"),
  createIntroTemplate("3D Perspective", "Text with depth and rotation"),
  createSocialBumperTemplate("Follow CTA", "Quick follow call to action"),
  createSocialBumperTemplate("Like & Share", "Animated like and share"),
  createSocialBumperTemplate("Subscribe Bell", "Subscribe with bell animation"),
  createSocialBumperTemplate("End Screen", "Video end screen with links"),
  createCountdownTemplate("Ring Countdown", "Circular countdown with pulse"),
  createCountdownTemplate("Block Countdown", "Numeric countdown with blocks"),
  createCountdownTemplate("Minimal Count", "Clean minimal countdown"),
  createCountdownTemplate("Neon Countdown", "Neon glow countdown effect"),
];

/* ── Particle System (deterministic per-seed) ─────────────── */

function generateParticles(seed: number, count: number, spread: number) {
  const particles: { ax: number; ay: number; phase: number; speed: number }[] = [];
  let s = seed;
  const rng = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = rng() * spread;
    particles.push({
      ax: Math.cos(angle) * dist,
      ay: Math.sin(angle) * dist,
      phase: rng() * Math.PI * 2,
      speed: 0.5 + rng() * 2,
    });
  }
  return particles;
}

/* ── Interpolate Keyframes ────────────────────────────────── */

function interpolateKeyframes(keyframes: Keyframe[], t: number, easingFn: (t: number) => number): { x: number; y: number; scale: number; opacity: number; rotation: number } {
  if (keyframes.length === 0) return { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 };
  if (keyframes.length === 1) return keyframes[0];

  // Find the two keyframes to interpolate between
  let k0 = keyframes[0];
  let k1 = keyframes[keyframes.length - 1];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      k0 = keyframes[i]; k1 = keyframes[i + 1]; break;
    }
  }

  if (k1.time === k0.time) return k0;
  const localT = (t - k0.time) / (k1.time - k0.time);
  const eased = easingFn(Math.max(0, Math.min(1, localT)));

  return {
    x: k0.x + (k1.x - k0.x) * eased,
    y: k0.y + (k1.y - k0.y) * eased,
    scale: k0.scale + (k1.scale - k0.scale) * eased,
    opacity: k0.opacity + (k1.opacity - k0.opacity) * eased,
    rotation: k0.rotation + (k1.rotation - k0.rotation) * eased,
  };
}

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */

export default function MotionGraphicsWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  /* ── State ──────────────────────────────────────────────── */
  const [config, setConfig] = useState<ProjectConfig>({
    aspectRatio: "16:9",
    resolution: "1080p",
    fps: 30,
    bgColor: "#0f172a",
    bgGradient: true,
    bgGradientEnd: "#1e293b",
    duration: 4,
    selectedTemplate: TEMPLATES[0].id,
    category: "lower-thirds",
  });

  const [layers, setLayers] = useState<MotionLayer[]>(() =>
    TEMPLATES[0].layers.map((l) => ({ ...l, id: makeId(), keyframes: l.keyframes.map((k) => ({ ...k })) })),
  );

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 0–1 normalised
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  /* ── Derived ────────────────────────────────────────────── */
  const dims = ASPECT_DIMS[config.aspectRatio];
  const scale = config.resolution === "1080p" ? 1 : config.resolution === "720p" ? 0.667 : 0.444;
  const cW = dims.w * scale;
  const cH = dims.h * scale;
  const displayW = Math.min(640, cW * 0.55);
  const displayH = displayW * (cH / cW);

  const filteredTemplates = useMemo(
    () => TEMPLATES.filter((t) => t.category === config.category),
    [config.category],
  );
  const activeTemplate = TEMPLATES.find((t) => t.id === config.selectedTemplate);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  /* ── Select Template ────────────────────────────────────── */
  const selectTemplate = useCallback((tmpl: MotionTemplate) => {
    setConfig((p) => ({ ...p, selectedTemplate: tmpl.id, duration: tmpl.duration }));
    setLayers(tmpl.layers.map((l) => ({ ...l, id: makeId(), keyframes: l.keyframes.map((k) => ({ ...k })) })));
    setSelectedLayerId(null);
    setCurrentTime(0);
    setPlaying(false);
  }, []);

  /* ── Layer Operations ───────────────────────────────────── */
  const addLayer = useCallback((type: MotionLayer["type"]) => {
    const newLayer: MotionLayer = {
      id: makeId(), name: `New ${type}`, type, visible: true, easing: "ease-out",
      keyframes: [
        { time: 0, x: 480, y: 270, scale: 0, opacity: 0, rotation: 0 },
        { time: 0.2, x: 480, y: 270, scale: 1, opacity: 1, rotation: 0 },
        { time: 0.8, x: 480, y: 270, scale: 1, opacity: 1, rotation: 0 },
        { time: 1, x: 480, y: 270, scale: 0, opacity: 0, rotation: 0 },
      ],
      ...(type === "text" ? { text: "New Text", fontSize: 32, fontWeight: "bold", fontFamily: "Inter", color: "#ffffff" } : {}),
      ...(type === "shape" ? { shape: "rect" as const, shapeWidth: 100, shapeHeight: 100, fillColor: "#8ae600" } : {}),
      ...(type === "particle" ? { particleCount: 30, particleSize: 3, particleColor: "#8ae600", particleSpread: 150 } : {}),
    };
    setLayers((p) => [...p, newLayer]);
    setSelectedLayerId(newLayer.id);
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers((p) => p.filter((l) => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  }, [selectedLayerId]);

  const duplicateLayer = useCallback((id: string) => {
    setLayers((p) => {
      const idx = p.findIndex((l) => l.id === id);
      if (idx < 0) return p;
      const clone = { ...p[idx], id: makeId(), name: p[idx].name + " Copy", keyframes: p[idx].keyframes.map((k) => ({ ...k })) };
      const next = [...p];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<MotionLayer>) => {
    setLayers((p) => p.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }, []);

  /* ── Canvas Render ──────────────────────────────────────── */
  const renderFrame = useCallback((t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = cW;
    canvas.height = cH;

    // Background
    if (config.bgGradient) {
      const grad = ctx.createLinearGradient(0, 0, 0, cH);
      grad.addColorStop(0, config.bgColor);
      grad.addColorStop(1, config.bgGradientEnd);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = config.bgColor;
    }
    ctx.fillRect(0, 0, cW, cH);

    // Scale factor for rendering on canvas
    const sx = cW / 960;
    const sy = cH / 540;

    // Render each visible layer
    for (const layer of layers) {
      if (!layer.visible) continue;
      const easingFn = EASINGS[layer.easing] ?? EASINGS.linear;
      const interp = interpolateKeyframes(layer.keyframes, t, easingFn);
      if (interp.opacity <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, interp.opacity));
      ctx.translate(interp.x * sx, interp.y * sy);
      ctx.rotate((interp.rotation * Math.PI) / 180);
      ctx.scale(interp.scale, interp.scale);

      switch (layer.type) {
        case "text": {
          const size = (layer.fontSize ?? 32) * sx;
          ctx.font = `${layer.fontWeight ?? "normal"} ${size}px ${layer.fontFamily ?? "Inter"}, sans-serif`;
          ctx.fillStyle = layer.color ?? "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          // Shadow for readability
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 8 * sx;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2 * sx;
          // For countdown, show the number based on time
          let displayText = layer.text ?? "";
          if (layer.name === "Number" && config.category === "countdowns") {
            const num = Math.max(1, Math.ceil(config.duration * (1 - t)));
            displayText = String(num);
          }
          ctx.fillText(displayText, 0, 0);
          ctx.shadowBlur = 0;
          break;
        }

        case "shape": {
          const w = (layer.shapeWidth ?? 100) * sx;
          const h = (layer.shapeHeight ?? 100) * sy;
          ctx.fillStyle = layer.fillColor ?? "#8ae600";
          if (layer.strokeColor) {
            ctx.strokeStyle = layer.strokeColor;
            ctx.lineWidth = (layer.strokeWidth ?? 2) * sx;
          }

          switch (layer.shape) {
            case "rect":
              if (layer.fillColor && layer.fillColor !== "transparent") {
                ctx.fillRect(-w / 2, -h / 2, w, h);
              }
              if (layer.strokeColor) ctx.strokeRect(-w / 2, -h / 2, w, h);
              break;

            case "circle":
              ctx.beginPath();
              ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
              if (layer.fillColor && layer.fillColor !== "transparent") ctx.fill();
              if (layer.strokeColor) ctx.stroke();
              break;

            case "triangle":
              ctx.beginPath();
              ctx.moveTo(0, -h / 2);
              ctx.lineTo(w / 2, h / 2);
              ctx.lineTo(-w / 2, h / 2);
              ctx.closePath();
              if (layer.fillColor && layer.fillColor !== "transparent") ctx.fill();
              if (layer.strokeColor) ctx.stroke();
              break;

            case "diamond":
              ctx.beginPath();
              ctx.moveTo(0, -h / 2);
              ctx.lineTo(w / 2, 0);
              ctx.lineTo(0, h / 2);
              ctx.lineTo(-w / 2, 0);
              ctx.closePath();
              if (layer.fillColor && layer.fillColor !== "transparent") ctx.fill();
              if (layer.strokeColor) ctx.stroke();
              break;

            case "line":
              ctx.beginPath();
              ctx.moveTo(-w / 2, 0);
              ctx.lineTo(w / 2, 0);
              ctx.strokeStyle = layer.fillColor ?? "#8ae600";
              ctx.lineWidth = (layer.strokeWidth ?? 3) * sx;
              ctx.stroke();
              break;
          }
          break;
        }

        case "particle": {
          const count = layer.particleCount ?? 30;
          const size = (layer.particleSize ?? 3) * sx;
          const spread = (layer.particleSpread ?? 150) * sx;
          const color = layer.particleColor ?? "#8ae600";
          const particles = generateParticles(layer.id.charCodeAt(0) * 1000, count, spread);

          for (const p of particles) {
            const pProgress = Math.sin(t * Math.PI * p.speed + p.phase);
            const px = p.ax * sx * t * 2;
            const py = p.ay * sy * t * 2;
            const pAlpha = Math.max(0, Math.min(1, pProgress * 0.8 + 0.2));

            ctx.beginPath();
            ctx.arc(px, py, size * (0.5 + pProgress * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(color, pAlpha);
            ctx.fill();

            // Glow effect
            ctx.beginPath();
            ctx.arc(px, py, size * 2, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(color, pAlpha * 0.15);
            ctx.fill();
          }
          break;
        }

        case "accent": {
          // Decorative accent elements
          const w = (layer.shapeWidth ?? 80) * sx;
          ctx.strokeStyle = layer.fillColor ?? "#8ae600";
          ctx.lineWidth = 2 * sx;
          ctx.beginPath();
          ctx.moveTo(-w / 2, 0);
          ctx.lineTo(w / 2, 0);
          ctx.stroke();
          break;
        }

        case "background": {
          // Full-screen background overlay
          ctx.fillStyle = hexToRgba(layer.fillColor ?? "#000000", 0.6);
          ctx.fillRect(-cW, -cH, cW * 3, cH * 3);
          break;
        }
      }

      ctx.restore();
    }

    // Safe area guides (subtle)
    ctx.strokeStyle = hexToRgba("#ffffff", 0.08);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const margin = 40 * sx;
    ctx.strokeRect(margin, margin, cW - margin * 2, cH - margin * 2);
    ctx.setLineDash([]);

    // Timecode overlay
    const seconds = t * config.duration;
    const frame = Math.floor(seconds * config.fps);
    const tc = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}:${String(frame % config.fps).padStart(2, "0")}`;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    const tcW = 100 * sx;
    ctx.fillRect(cW - tcW - 10 * sx, cH - 30 * sy, tcW, 24 * sy);
    ctx.fillStyle = "#9ca3af";
    ctx.font = `${12 * sx}px JetBrains Mono, monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(tc, cW - 16 * sx, cH - 18 * sy);
  }, [layers, cW, cH, config]);

  /* ── Timeline Render ────────────────────────────────────── */
  const renderTimeline = useCallback(() => {
    const canvas = timelineRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    // Background
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, W, H);

    // Ruler
    const rulerH = 24;
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, W, rulerH);
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px JetBrains Mono, monospace";
    ctx.textAlign = "center";
    const ticks = Math.ceil(config.duration * 10);
    for (let i = 0; i <= ticks; i++) {
      const x = (i / ticks) * W;
      const isMajor = i % 10 === 0;
      ctx.strokeStyle = isMajor ? "#4b5563" : "#374151";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, rulerH - (isMajor ? 12 : 6));
      ctx.lineTo(x, rulerH);
      ctx.stroke();
      if (isMajor) {
        ctx.fillText(`${(i / 10).toFixed(1)}s`, x, 10);
      }
    }

    // Layer tracks
    const trackH = 28;
    const trackGap = 2;
    const trackY0 = rulerH + 6;
    const layerColors = ["#8ae600", "#3b82f6", "#ef4444", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899"];

    layers.forEach((layer, i) => {
      const y = trackY0 + i * (trackH + trackGap);
      if (y + trackH > H) return;

      // Track background
      ctx.fillStyle = layer.id === selectedLayerId ? "#1e3a5f" : "#1f2937";
      ctx.fillRect(0, y, W, trackH);

      // Layer name
      ctx.fillStyle = layer.visible ? "#d1d5db" : "#4b5563";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(layer.name, 6, y + trackH / 2 + 3);

      // Keyframe markers
      const color = layerColors[i % layerColors.length];
      for (const kf of layer.keyframes) {
        const kx = kf.time * W;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(kx, y + 4);
        ctx.lineTo(kx + 5, y + trackH / 2);
        ctx.lineTo(kx, y + trackH - 4);
        ctx.lineTo(kx - 5, y + trackH / 2);
        ctx.closePath();
        ctx.fill();
      }

      // Span bar
      if (layer.keyframes.length >= 2) {
        const t0 = layer.keyframes[0].time;
        const t1 = layer.keyframes[layer.keyframes.length - 1].time;
        ctx.fillStyle = hexToRgba(color, 0.15);
        ctx.fillRect(t0 * W, y + 2, (t1 - t0) * W, trackH - 4);
      }
    });

    // Playhead
    const px = currentTime * W;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, H);
    ctx.stroke();

    // Playhead triangle
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(px - 6, 0);
    ctx.lineTo(px + 6, 0);
    ctx.lineTo(px, 8);
    ctx.closePath();
    ctx.fill();
  }, [layers, currentTime, config, selectedLayerId]);

  /* ── Playback Loop ──────────────────────────────────────── */
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(animRef.current);
      return;
    }

    startTimeRef.current = performance.now() - currentTime * config.duration * 1000;

    const loop = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      let t = elapsed / config.duration;

      if (t >= 1) {
        t = 0;
        startTimeRef.current = now;
      }

      setCurrentTime(t);
      renderFrame(t);
      renderTimeline();
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, config.duration, renderFrame, renderTimeline, currentTime]);

  /* ── Initial + Static Render ────────────────────────────── */
  useEffect(() => {
    if (!playing) {
      renderFrame(currentTime);
      renderTimeline();
    }
  }, [currentTime, layers, config, renderFrame, renderTimeline, playing]);

  /* ── Timeline Click ─────────────────────────────────────── */
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = timelineRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = Math.max(0, Math.min(1, x / rect.width));
    setCurrentTime(t);
    setPlaying(false);
  }, []);

  /* ── Keyboard Shortcuts ─────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setPlaying((p) => !p);
          break;
        case "ArrowLeft":
          e.preventDefault();
          setCurrentTime((t) => Math.max(0, t - 0.02));
          setPlaying(false);
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentTime((t) => Math.min(1, t + 0.02));
          setPlaying(false);
          break;
        case "Home":
          e.preventDefault();
          setCurrentTime(0);
          setPlaying(false);
          break;
        case "End":
          e.preventDefault();
          setCurrentTime(1);
          setPlaying(false);
          break;
        case "Delete":
        case "Backspace":
          if (selectedLayerId) {
            e.preventDefault();
            removeLayer(selectedLayerId);
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedLayerId, removeLayer]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate text content for a ${config.category.replace(/-/g, " ")} motion graphic about: "${aiPrompt}". Return JSON: { "lines": ["line1", "line2"] }. Max 3 lines, each max 30 chars. Professional broadcast style.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.lines && Array.isArray(data.lines)) {
          // Apply AI text to text layers
          const textLayers = layers.filter((l) => l.type === "text");
          const updated = layers.map((l) => {
            if (l.type !== "text") return l;
            const idx = textLayers.indexOf(l);
            if (idx < data.lines.length) return { ...l, text: data.lines[idx] };
            return l;
          });
          setLayers(updated);
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export Frame ───────────────────────────────────────── */
  const exportFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderFrame(currentTime);
    const link = document.createElement("a");
    link.download = `motion-frame-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [currentTime, renderFrame]);

  /* ── Export Sprite Sheet ────────────────────────────────── */
  const exportSpriteSheet = useCallback(() => {
    const frameCount = Math.min(30, Math.ceil(config.duration * config.fps));
    const cols = Math.ceil(Math.sqrt(frameCount));
    const rows = Math.ceil(frameCount / cols);

    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = cW * cols;
    spriteCanvas.height = cH * rows;
    const sCtx = spriteCanvas.getContext("2d");
    if (!sCtx) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cW;
    tempCanvas.height = cH;

    for (let i = 0; i < frameCount; i++) {
      const t = i / (frameCount - 1);
      // Render to temp canvas
      const tCtx = tempCanvas.getContext("2d");
      if (!tCtx) continue;

      // We'll manually render each frame
      tCtx.clearRect(0, 0, cW, cH);

      // Background
      if (config.bgGradient) {
        const grad = tCtx.createLinearGradient(0, 0, 0, cH);
        grad.addColorStop(0, config.bgColor);
        grad.addColorStop(1, config.bgGradientEnd);
        tCtx.fillStyle = grad;
      } else {
        tCtx.fillStyle = config.bgColor;
      }
      tCtx.fillRect(0, 0, cW, cH);

      const sx = cW / 960;
      const sy = cH / 540;

      for (const layer of layers) {
        if (!layer.visible) continue;
        const easingFn = EASINGS[layer.easing] ?? EASINGS.linear;
        const interp = interpolateKeyframes(layer.keyframes, t, easingFn);
        if (interp.opacity <= 0.01) continue;

        tCtx.save();
        tCtx.globalAlpha = Math.max(0, Math.min(1, interp.opacity));
        tCtx.translate(interp.x * sx, interp.y * sy);
        tCtx.rotate((interp.rotation * Math.PI) / 180);
        tCtx.scale(interp.scale, interp.scale);

        if (layer.type === "text") {
          const size = (layer.fontSize ?? 32) * sx;
          tCtx.font = `${layer.fontWeight ?? "normal"} ${size}px ${layer.fontFamily ?? "Inter"}, sans-serif`;
          tCtx.fillStyle = layer.color ?? "#ffffff";
          tCtx.textAlign = "center";
          tCtx.textBaseline = "middle";
          let displayText = layer.text ?? "";
          if (layer.name === "Number" && config.category === "countdowns") {
            displayText = String(Math.max(1, Math.ceil(config.duration * (1 - t))));
          }
          tCtx.fillText(displayText, 0, 0);
        } else if (layer.type === "shape") {
          const w = (layer.shapeWidth ?? 100) * sx;
          const h = (layer.shapeHeight ?? 100) * sy;
          tCtx.fillStyle = layer.fillColor ?? "#8ae600";
          if (layer.shape === "rect") {
            if (layer.fillColor && layer.fillColor !== "transparent") tCtx.fillRect(-w / 2, -h / 2, w, h);
            if (layer.strokeColor) { tCtx.strokeStyle = layer.strokeColor; tCtx.lineWidth = (layer.strokeWidth ?? 2) * sx; tCtx.strokeRect(-w / 2, -h / 2, w, h); }
          } else if (layer.shape === "circle") {
            tCtx.beginPath();
            tCtx.arc(0, 0, w / 2, 0, Math.PI * 2);
            if (layer.fillColor && layer.fillColor !== "transparent") tCtx.fill();
            if (layer.strokeColor) { tCtx.strokeStyle = layer.strokeColor; tCtx.lineWidth = (layer.strokeWidth ?? 2) * sx; tCtx.stroke(); }
          }
        } else if (layer.type === "particle") {
          const particles = generateParticles(layer.id.charCodeAt(0) * 1000, layer.particleCount ?? 30, (layer.particleSpread ?? 150) * sx);
          for (const p of particles) {
            const pProgress = Math.sin(t * Math.PI * p.speed + p.phase);
            tCtx.beginPath();
            tCtx.arc(p.ax * sx * t * 2, p.ay * sy * t * 2, (layer.particleSize ?? 3) * sx * (0.5 + pProgress * 0.5), 0, Math.PI * 2);
            tCtx.fillStyle = hexToRgba(layer.particleColor ?? "#8ae600", Math.max(0, pProgress * 0.8 + 0.2));
            tCtx.fill();
          }
        }

        tCtx.restore();
      }

      // Copy to sprite sheet
      const col = i % cols;
      const row = Math.floor(i / cols);
      sCtx.drawImage(tempCanvas, col * cW, row * cH);
    }

    const link = document.createElement("a");
    link.download = `motion-spritesheet-${frameCount}f-${Date.now()}.png`;
    link.href = spriteCanvas.toDataURL("image/png");
    link.click();
  }, [layers, cW, cH, config]);

  /* ══════════════════════════════════════════════════════════
     UI — Left Panel
     ══════════════════════════════════════════════════════════ */

  const leftPanel = (
    <div className="space-y-4">
      {/* Category Selector */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconFilm className="size-4 text-primary-500" />Category
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setConfig((p) => ({ ...p, category: cat.id }));
                const first = TEMPLATES.find((t) => t.category === cat.id);
                if (first) selectTemplate(first);
              }}
              className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                config.category === cat.id
                  ? "bg-primary-500/10 text-primary-500 border border-primary-500/30"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Templates</h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {filteredTemplates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => selectTemplate(tmpl)}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                config.selectedTemplate === tmpl.id
                  ? "bg-primary-500/10 border border-primary-500/30 text-primary-500"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              <p className="text-xs font-semibold">{tmpl.name}</p>
              <p className="text-[10px] opacity-60">{tmpl.description}</p>
              <p className="text-[10px] text-primary-500 mt-0.5">{tmpl.duration}s • {tmpl.layers.length} layers</p>
            </button>
          ))}
        </div>
      </div>

      {/* Project Settings */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconDroplet className="size-4 text-primary-500" />Settings
        </h3>

        <label className="block text-xs text-gray-400">Aspect Ratio</label>
        <div className="grid grid-cols-4 gap-1">
          {(["16:9", "9:16", "1:1", "4:5"] as const).map((ar) => (
            <button key={ar} onClick={() => setConfig((p) => ({ ...p, aspectRatio: ar }))}
              className={`px-2 py-1.5 rounded-lg text-xs font-mono ${
                config.aspectRatio === ar ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}>{ar}</button>
          ))}
        </div>

        <label className="block text-xs text-gray-400">Resolution</label>
        <div className="grid grid-cols-3 gap-1">
          {(["1080p", "720p", "480p"] as const).map((r) => (
            <button key={r} onClick={() => setConfig((p) => ({ ...p, resolution: r }))}
              className={`px-2 py-1.5 rounded-lg text-xs ${
                config.resolution === r ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}>{r}</button>
          ))}
        </div>

        <label className="block text-xs text-gray-400">FPS</label>
        <div className="grid grid-cols-3 gap-1">
          {([24, 30, 60] as const).map((f) => (
            <button key={f} onClick={() => setConfig((p) => ({ ...p, fps: f }))}
              className={`px-2 py-1.5 rounded-lg text-xs ${
                config.fps === f ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}>{f} fps</button>
          ))}
        </div>

        <label className="block text-xs text-gray-400">Duration — {config.duration.toFixed(1)}s</label>
        <input type="range" min={0.5} max={10} step={0.1} value={config.duration}
          onChange={(e) => setConfig((p) => ({ ...p, duration: +e.target.value }))}
          className="w-full accent-primary-500" />

        <label className="block text-xs text-gray-400">Background</label>
        <div className="flex items-center gap-2">
          <input type="color" value={config.bgColor}
            onChange={(e) => setConfig((p) => ({ ...p, bgColor: e.target.value }))}
            className="size-8 rounded-lg cursor-pointer border-0" />
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input type="checkbox" checked={config.bgGradient}
              onChange={(e) => setConfig((p) => ({ ...p, bgGradient: e.target.checked }))}
              className="accent-primary-500" />Gradient
          </label>
          {config.bgGradient && (
            <input type="color" value={config.bgGradientEnd}
              onChange={(e) => setConfig((p) => ({ ...p, bgGradientEnd: e.target.value }))}
              className="size-8 rounded-lg cursor-pointer border-0" />
          )}
        </div>
      </div>

      {/* AI Text Generator */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconSparkles className="size-4 text-primary-500" />AI Text
        </h3>
        <textarea
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none"
          rows={2} placeholder="Describe the context (e.g. 'tech podcast host')…"
          value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button onClick={generateAI} disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          {loading ? "Generating…" : "Generate Text"}
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     UI — Right Panel (Layers & Properties)
     ══════════════════════════════════════════════════════════ */

  const rightPanel = (
    <div className="space-y-4">
      {/* Layer List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <IconLayers className="size-4 text-primary-500" />Layers
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={() => addLayer("text")} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500" title="Add text">
              <IconType className="size-3.5" />
            </button>
            <button onClick={() => addLayer("shape")} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500" title="Add shape">
              <IconPlus className="size-3.5" />
            </button>
            <button onClick={() => addLayer("particle")} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-500" title="Add particles">
              <IconSparkles className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-1 max-h-56 overflow-y-auto">
          {layers.map((layer) => (
            <div
              key={layer.id}
              onClick={() => setSelectedLayerId(layer.id === selectedLayerId ? null : layer.id)}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                layer.id === selectedLayerId
                  ? "bg-primary-500/10 border border-primary-500/30"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                className={`text-xs ${layer.visible ? "text-primary-500" : "text-gray-500"}`}
              >
                {layer.visible ? "●" : "○"}
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">
                {layer.name}
              </span>
              <span className="text-[10px] text-gray-500 uppercase">{layer.type}</span>
              <button onClick={(e) => { e.stopPropagation(); duplicateLayer(layer.id); }}
                className="p-0.5 text-gray-400 hover:text-primary-500"><IconCopy className="size-3" /></button>
              <button onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                className="p-0.5 text-gray-400 hover:text-red-400"><IconTrash className="size-3" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Layer Properties */}
      {selectedLayer && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Properties</h3>

          <label className="block text-xs text-gray-400">Name</label>
          <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
            value={selectedLayer.name}
            onChange={(e) => updateLayer(selectedLayer.id, { name: e.target.value })} />

          <label className="block text-xs text-gray-400">Easing</label>
          <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
            value={selectedLayer.easing}
            onChange={(e) => updateLayer(selectedLayer.id, { easing: e.target.value as EasingFn })}>
            {EASING_OPTIONS.map((eo) => <option key={eo.id} value={eo.id}>{eo.label}</option>)}
          </select>

          {/* Text Properties */}
          {selectedLayer.type === "text" && (
            <>
              <label className="block text-xs text-gray-400">Text</label>
              <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
                value={selectedLayer.text ?? ""}
                onChange={(e) => updateLayer(selectedLayer.id, { text: e.target.value })} />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400">Size</label>
                  <input type="number" min={8} max={200}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
                    value={selectedLayer.fontSize ?? 32}
                    onChange={(e) => updateLayer(selectedLayer.id, { fontSize: +e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Weight</label>
                  <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
                    value={selectedLayer.fontWeight ?? "normal"}
                    onChange={(e) => updateLayer(selectedLayer.id, { fontWeight: e.target.value })}>
                    <option value="normal">Regular</option>
                    <option value="bold">Bold</option>
                    <option value="800">Extra Bold</option>
                  </select>
                </div>
              </div>

              <label className="block text-xs text-gray-400">Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {COLOR_PRESETS.slice(0, 8).map((c) => (
                  <button key={c} onClick={() => updateLayer(selectedLayer.id, { color: c })}
                    className={`size-6 rounded-full border-2 transition ${selectedLayer.color === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }} />
                ))}
                <input type="color" value={selectedLayer.color ?? "#ffffff"}
                  onChange={(e) => updateLayer(selectedLayer.id, { color: e.target.value })}
                  className="size-6 rounded-full cursor-pointer border-0" />
              </div>
            </>
          )}

          {/* Shape Properties */}
          {selectedLayer.type === "shape" && (
            <>
              <label className="block text-xs text-gray-400">Shape</label>
              <div className="grid grid-cols-5 gap-1">
                {(["rect", "circle", "triangle", "diamond", "line"] as const).map((s) => (
                  <button key={s} onClick={() => updateLayer(selectedLayer.id, { shape: s })}
                    className={`px-1.5 py-1.5 rounded text-[10px] capitalize ${selectedLayer.shape === s ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{s}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400">W</label>
                  <input type="number" min={10} max={1000}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white"
                    value={selectedLayer.shapeWidth ?? 100}
                    onChange={(e) => updateLayer(selectedLayer.id, { shapeWidth: +e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400">H</label>
                  <input type="number" min={10} max={1000}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white"
                    value={selectedLayer.shapeHeight ?? 100}
                    onChange={(e) => updateLayer(selectedLayer.id, { shapeHeight: +e.target.value })} />
                </div>
              </div>

              <label className="block text-xs text-gray-400">Fill / Stroke</label>
              <div className="flex items-center gap-2">
                <input type="color" value={selectedLayer.fillColor ?? "#8ae600"}
                  onChange={(e) => updateLayer(selectedLayer.id, { fillColor: e.target.value })}
                  className="size-7 rounded-lg cursor-pointer border-0" />
                <input type="color" value={selectedLayer.strokeColor ?? "#ffffff"}
                  onChange={(e) => updateLayer(selectedLayer.id, { strokeColor: e.target.value })}
                  className="size-7 rounded-lg cursor-pointer border-0" />
                <input type="number" min={0} max={20} value={selectedLayer.strokeWidth ?? 2}
                  onChange={(e) => updateLayer(selectedLayer.id, { strokeWidth: +e.target.value })}
                  className="w-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" />
              </div>
            </>
          )}

          {/* Particle Properties */}
          {selectedLayer.type === "particle" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400">Count</label>
                  <input type="number" min={5} max={200}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white"
                    value={selectedLayer.particleCount ?? 30}
                    onChange={(e) => updateLayer(selectedLayer.id, { particleCount: +e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Size</label>
                  <input type="number" min={1} max={20}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white"
                    value={selectedLayer.particleSize ?? 3}
                    onChange={(e) => updateLayer(selectedLayer.id, { particleSize: +e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400">Spread</label>
                  <input type="number" min={20} max={500}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white"
                    value={selectedLayer.particleSpread ?? 150}
                    onChange={(e) => updateLayer(selectedLayer.id, { particleSpread: +e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400">Color</label>
                  <input type="color" value={selectedLayer.particleColor ?? "#8ae600"}
                    onChange={(e) => updateLayer(selectedLayer.id, { particleColor: e.target.value })}
                    className="w-full h-8 rounded-lg cursor-pointer border-0" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Export */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <IconDownload className="size-4 text-primary-500" />Export
        </h3>
        <button onClick={exportFrame}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors">
          <IconCamera className="size-4" />Export Current Frame (PNG)
        </button>
        <button onClick={exportSpriteSheet}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <IconLayers className="size-4" />Export Sprite Sheet (PNG)
        </button>
        <p className="text-[10px] text-gray-500 text-center">Sprite sheet: up to 30 frames in a grid</p>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     UI — Toolbar & Actions
     ══════════════════════════════════════════════════════════ */

  const toolbar = (
    <>
      <button
        onClick={() => setPlaying((p) => !p)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
          playing
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-primary-500/20 text-primary-500 border border-primary-500/30"
        }`}
      >
        {playing ? <IconPause className="size-3.5" /> : <IconPlay className="size-3.5" />}
        {playing ? "Pause" : "Play"}
      </button>
      <button onClick={() => { setCurrentTime(0); setPlaying(false); }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors" title="Reset">
        <IconRefresh className="size-4" />
      </button>
      <span className="text-xs font-mono text-gray-500">
        {(currentTime * config.duration).toFixed(2)}s / {config.duration.toFixed(1)}s
      </span>
    </>
  );

  const actionsBar = (
    <div className="w-full space-y-2">
      {/* Scrubber */}
      <input
        type="range" min={0} max={1} step={0.001}
        value={currentTime}
        onChange={(e) => { setCurrentTime(+e.target.value); setPlaying(false); }}
        className="w-full accent-primary-500"
      />

      {/* Timeline Canvas */}
      <div className="rounded-xl overflow-hidden border border-gray-700/50">
        <canvas
          ref={timelineRef}
          className="w-full cursor-pointer"
          style={{ height: Math.min(200, 30 + layers.length * 30 + 30) }}
          onClick={handleTimelineClick}
        />
      </div>

      <p className="text-[10px] text-gray-500 text-center">
        Space: play/pause • ← → scrub • Home/End: jump • Del: remove layer
      </p>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     Layout
     ══════════════════════════════════════════════════════════ */

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      label={`${config.category.replace(/-/g, " ")} • ${activeTemplate?.name ?? "Custom"} • ${config.aspectRatio} • ${config.resolution} • ${config.fps}fps`}
      toolbar={toolbar}
      mobileTabs={["Preview", "Settings", "Layers"]}
      actionsBar={actionsBar}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(2, z + 0.1))}
      onZoomOut={() => setZoom((z) => Math.max(0.3, z - 0.1))}
      onZoomFit={() => setZoom(1)}
    />
  );
}
