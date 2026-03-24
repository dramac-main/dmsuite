"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ============================================================
   Chiko 3D Avatar — Pure CSS 3D Robot Character
   ============================================================
   A stunning 3D robot character matching the Chiko design:
   - White/off-white body with smooth rounded forms
   - Dark visor with glowing cyan/teal eyes
   - Cyan neon accent lines across body
   - Floating animation with breathing/idle motion
   - Expression states: idle, thinking, speaking, happy, waving
   - Uses CSS 3D transforms + Framer Motion for life-like feel
   - Global branding: primary-500 (#84cc16) + secondary-500 (#06b6d4)
   - Dark background optimized (#3a3a3a / transparent)
   ============================================================ */

export type ChikoExpression =
  | "idle"
  | "thinking"
  | "speaking"
  | "happy"
  | "waving"
  | "greeting"
  | "listening";

export type ChikoSize = "xs" | "sm" | "md" | "lg" | "xl" | "hero";

interface Chiko3DAvatarProps {
  size?: ChikoSize;
  expression?: ChikoExpression;
  animated?: boolean;
  className?: string;
  showGlow?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const SIZE_MAP: Record<ChikoSize, number> = {
  xs: 32,
  sm: 44,
  md: 64,
  lg: 96,
  xl: 140,
  hero: 220,
};

/* ── Eye glow colors matching the 3D render ──────────────── */
const EYE_GLOW = "#2dd4bf"; // teal-400 — matches the cyan-teal glow in images
const ACCENT_CYAN = "#06b6d4"; // secondary-500
const BODY_WHITE = "#f0f2f5";
const BODY_HIGHLIGHT = "#ffffff";
const VISOR_DARK = "#1a1a2e";
const LINE_GLOW = "rgba(6, 182, 212, 0.7)";

export function Chiko3DAvatar({
  size = "md",
  expression = "idle",
  animated = true,
  className,
  showGlow = true,
  interactive = false,
  onClick,
}: Chiko3DAvatarProps) {
  const s = SIZE_MAP[size];
  const [hovered, setHovered] = useState(false);
  const [blink, setBlink] = useState(false);
  const blinkTimer = useRef<ReturnType<typeof setInterval>>(undefined);

  /* ── Auto-blink every 3-5 seconds ─────────────────────── */
  useEffect(() => {
    if (!animated) return;
    const startBlink = () => {
      blinkTimer.current = setInterval(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
      }, 3000 + Math.random() * 2000);
    };
    startBlink();
    return () => clearInterval(blinkTimer.current);
  }, [animated]);

  /* ── Expression-based body animation ───────────────────── */
  const getBodyAnimation = () => {
    switch (expression) {
      case "thinking":
        return { rotateZ: [0, -3, 0, 3, 0], y: [0, -2, 0] };
      case "speaking":
        return { y: [0, -1, 0, -1, 0], scale: [1, 1.008, 1, 1.008, 1] };
      case "happy":
        return { y: [0, -4, 0], rotateZ: [0, 2, -2, 0], scale: [1, 1.02, 1] };
      case "waving":
        return { y: [0, -1.5, 0], rotateZ: [0, -1, 1, 0] };
      case "greeting":
        return { y: [0, -3, 0], scale: [1, 1.02, 1] };
      case "listening":
        return { rotateZ: [0, 1, -1, 0], y: [0, -1, 0] };
      default: // idle
        return { y: [0, -3, 0], rotateZ: [0, 0.5, -0.5, 0] };
    }
  };

  const getBodyTransition = () => {
    switch (expression) {
      case "thinking":
        return { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const };
      case "speaking":
        return { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const };
      case "happy":
        return { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const };
      case "waving":
        return { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const };
      case "greeting":
        return { duration: 1.5, repeat: 2, ease: "easeInOut" as const };
      default:
        return { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const };
    }
  };

  /* ── Eye expression variants ───────────────────────────── */
  const getEyeScale = () => {
    if (blink) return { scaleY: 0.1 };
    switch (expression) {
      case "happy":
        return { scaleY: 0.6, scaleX: 1.15 }; // squint happy
      case "thinking":
        return { scaleY: 0.7, scaleX: 0.9 };
      case "speaking":
        return { scaleY: [1, 0.85, 1], scaleX: 1 };
      case "waving":
      case "greeting":
        return { scaleY: 1.1, scaleX: 1.05 }; // excited wider eyes
      case "listening":
        return { scaleY: 1.05, scaleX: 1.0 }; // alert
      default:
        return { scaleY: 1, scaleX: 1 };
    }
  };

  const isSmall = s <= 44;
  const scale = s / 140; // Normalize to xl size as base

  return (
    <motion.div
      className={cn(
        "relative inline-flex items-center justify-center",
        interactive && "cursor-pointer",
        className
      )}
      style={{ width: s, height: s }}
      onHoverStart={() => interactive && setHovered(true)}
      onHoverEnd={() => interactive && setHovered(false)}
      onClick={onClick}
      whileHover={interactive ? { scale: 1.08 } : undefined}
      whileTap={interactive ? { scale: 0.95 } : undefined}
    >
      {/* ── Ambient glow ─────────────────────────────────── */}
      {showGlow && !isSmall && (
        <motion.div
          className="absolute inset-[-15%] rounded-full"
          style={{
            background: `radial-gradient(circle, ${ACCENT_CYAN}20 0%, ${ACCENT_CYAN}08 40%, transparent 70%)`,
          }}
          animate={animated ? { opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] } : undefined}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* ── Main 3D character container ──────────────────── */}
      <motion.div
        className="relative w-full h-full"
        style={{ perspective: `${s * 4}px` }}
        animate={animated ? getBodyAnimation() : undefined}
        transition={animated ? getBodyTransition() : undefined}
      >
        <svg
          width={s}
          height={s}
          viewBox="0 0 140 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-lg"
          style={{
            filter: showGlow
              ? `drop-shadow(0 0 ${Math.max(4, s * 0.06)}px ${ACCENT_CYAN}40)`
              : undefined,
          }}
        >
          <defs>
            {/* Body gradient — white with subtle warm tones */}
            <radialGradient id="chiko3d-body" cx="0.4" cy="0.3" r="0.7">
              <stop offset="0%" stopColor={BODY_HIGHLIGHT} />
              <stop offset="60%" stopColor={BODY_WHITE} />
              <stop offset="100%" stopColor="#d8dce3" />
            </radialGradient>

            {/* Head gradient */}
            <radialGradient id="chiko3d-head" cx="0.45" cy="0.35" r="0.65">
              <stop offset="0%" stopColor={BODY_HIGHLIGHT} />
              <stop offset="50%" stopColor={BODY_WHITE} />
              <stop offset="100%" stopColor="#dde0e6" />
            </radialGradient>

            {/* Visor gradient — dark glass with reflection */}
            <linearGradient id="chiko3d-visor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2a2a3e" />
              <stop offset="40%" stopColor={VISOR_DARK} />
              <stop offset="100%" stopColor="#0f0f1e" />
            </linearGradient>

            {/* Eye glow gradient */}
            <radialGradient id="chiko3d-eye-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="30%" stopColor={EYE_GLOW} />
              <stop offset="100%" stopColor={EYE_GLOW} stopOpacity="0.3" />
            </radialGradient>

            {/* Cyan accent line glow */}
            <linearGradient id="chiko3d-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT_CYAN} stopOpacity="0.8" />
              <stop offset="50%" stopColor={ACCENT_CYAN} />
              <stop offset="100%" stopColor={ACCENT_CYAN} stopOpacity="0.8" />
            </linearGradient>

            {/* Shadow */}
            <radialGradient id="chiko3d-shadow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            {/* Visor reflection highlight */}
            <linearGradient id="chiko3d-visor-shine" x1="0" y1="0" x2="1" y2="0.5">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* ═══ SHADOW (bottom) ═══ */}
          <motion.ellipse
            cx="70"
            cy="132"
            rx="28"
            ry="5"
            fill="url(#chiko3d-shadow)"
            animate={animated ? { scaleX: [1, 0.86, 1], opacity: [0.5, 0.3, 0.5] } : undefined}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "70px 132px" }}
          />

          {/* ═══ BODY ═══ */}
          {/* Main torso — rounded egg shape */}
          <ellipse cx="70" cy="96" rx="32" ry="28" fill="url(#chiko3d-body)" />
          {/* Body highlight — 3D sheen */}
          <ellipse cx="62" cy="88" rx="18" ry="15" fill="#ffffff" opacity="0.25" />

          {/* ── Body accent lines (cyan glow strips) ────── */}
          {/* Center vertical line */}
          <motion.line
            x1="70" y1="72" x2="70" y2="118"
            stroke={ACCENT_CYAN}
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.7"
            animate={animated ? { opacity: [0.5, 0.9, 0.5] } : undefined}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Center body glow */}
          <motion.line
            x1="70" y1="72" x2="70" y2="118"
            stroke={ACCENT_CYAN}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.15"
            animate={animated ? { opacity: [0.08, 0.2, 0.08] } : undefined}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Horizontal body band */}
          <motion.path
            d="M42 92 Q70 87 98 92"
            stroke={ACCENT_CYAN}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
            animate={animated ? { opacity: [0.4, 0.8, 0.4] } : undefined}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />

          {/* ═══ LEFT ARM ═══ */}
          <motion.g
            animate={
              animated
                ? expression === "waving"
                  ? { rotate: [0, 6, -3, 6, 0] }
                  : expression === "greeting"
                    ? { rotate: [0, 8, 4, 8, 0] }
                    : expression === "happy"
                      ? { rotate: [0, -6, 0] }
                      : expression === "speaking"
                        ? { rotate: [0, -3, 3, 0] }
                        : { rotate: [0, 2, -2, 0] }
                : undefined
            }
            transition={
              expression === "waving"
                ? { duration: 1.0, repeat: Infinity, ease: "easeInOut" as const }
                : expression === "greeting"
                  ? { duration: 1.4, repeat: 2, ease: "easeInOut" as const }
                  : expression === "happy"
                    ? { duration: 0.8, repeat: 2, ease: "easeOut" as const }
                    : { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const }
            }
            style={{ transformOrigin: "40px 88px" }}
          >
            {/* Shoulder ball joint — overlaps body edge */}
            <circle cx="40" cy="88" r="7" fill="url(#chiko3d-body)" />
            <circle cx="39" cy="87" r="3" fill="#ffffff" opacity="0.15" />
            {/* Arm segment — bridges shoulder to hand */}
            <ellipse cx="30" cy="91" rx="12" ry="6" fill="url(#chiko3d-body)" />
            {/* Hand */}
            <circle cx="21" cy="94" r="8" fill="url(#chiko3d-body)" />
            <circle cx="19" cy="92" r="3.5" fill="#ffffff" opacity="0.2" />
            {/* Arm accent line */}
            <motion.line
              x1="37" y1="89" x2="24" y2="93"
              stroke={ACCENT_CYAN}
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.4"
              animate={animated ? { opacity: [0.3, 0.6, 0.3] } : undefined}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.g>

          {/* ═══ RIGHT ARM ═══ */}
          <motion.g
            animate={
              animated
                ? expression === "waving"
                  ? { rotate: [-20, -32, -20] }
                  : expression === "greeting"
                    ? { rotate: [0, -22, -14, -22, 0] }
                    : expression === "happy"
                      ? { rotate: [0, -8, 0] }
                      : expression === "speaking"
                        ? { rotate: [0, 3, -3, 0] }
                        : { rotate: [0, -2, 2, 0] }
                : undefined
            }
            transition={
              expression === "waving"
                ? { duration: 0.35, repeat: Infinity, ease: "easeInOut" as const }
                : expression === "greeting"
                  ? { duration: 1.0, repeat: 3, ease: "easeInOut" as const }
                  : expression === "happy"
                    ? { duration: 0.8, repeat: 2, ease: "easeOut" as const }
                    : { duration: 3.5, repeat: Infinity, ease: "easeInOut" as const, delay: 0.3 }
            }
            style={{ transformOrigin: "100px 88px" }}
          >
            {/* Shoulder ball joint — overlaps body edge */}
            <circle cx="100" cy="88" r="7" fill="url(#chiko3d-body)" />
            <circle cx="101" cy="87" r="3" fill="#ffffff" opacity="0.15" />
            {/* Arm segment — bridges shoulder to hand */}
            <ellipse cx="110" cy="91" rx="12" ry="6" fill="url(#chiko3d-body)" />
            {/* Hand */}
            <circle cx="119" cy="94" r="8" fill="url(#chiko3d-body)" />
            <circle cx="121" cy="92" r="3.5" fill="#ffffff" opacity="0.2" />
            {/* Arm accent line */}
            <motion.line
              x1="103" y1="89" x2="116" y2="93"
              stroke={ACCENT_CYAN}
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.4"
              animate={animated ? { opacity: [0.3, 0.6, 0.3] } : undefined}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
          </motion.g>

          {/* ═══ HEAD ═══ */}
          <g>
            {/* Neck connector */}
            <ellipse cx="70" cy="72" rx="14" ry="6" fill="url(#chiko3d-body)" />

            {/* Main head sphere */}
            <circle cx="70" cy="46" r="32" fill="url(#chiko3d-head)" />
            {/* Head 3D highlight */}
            <ellipse cx="60" cy="36" rx="18" ry="16" fill="#ffffff" opacity="0.2" />

            {/* ── Head accent lines ────────────────────── */}
            {/* Top center line */}
            <motion.line
              x1="70" y1="14" x2="70" y2="30"
              stroke={ACCENT_CYAN}
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
              animate={animated ? { opacity: [0.4, 0.8, 0.4] } : undefined}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Side accent lines */}
            <motion.path
              d="M52 22 Q70 16 88 22"
              stroke={ACCENT_CYAN}
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
              animate={animated ? { opacity: [0.3, 0.7, 0.3] } : undefined}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* ── VISOR (dark glass faceplate) ─────────── */}
            <path
              d="M44 38 Q44 30 54 28 L86 28 Q96 30 96 38 L96 50 Q96 58 86 58 L54 58 Q44 56 44 50 Z"
              fill="url(#chiko3d-visor)"
            />
            {/* Visor edge highlight */}
            <path
              d="M44 38 Q44 30 54 28 L86 28 Q96 30 96 38 L96 50 Q96 58 86 58 L54 58 Q44 56 44 50 Z"
              fill="none"
              stroke="#4a4a5e"
              strokeWidth="1"
              opacity="0.5"
            />
            {/* Visor glass reflection */}
            <path
              d="M48 34 Q48 31 56 30 L80 30 Q86 31 86 34 L86 38 Q78 37 56 37 Q50 37 48 38 Z"
              fill="url(#chiko3d-visor-shine)"
            />

            {/* ── LEFT EYE ────────────────────────────── */}
            <motion.g
              animate={animated ? getEyeScale() : undefined}
              transition={{ duration: blink ? 0.1 : 0.4, ease: "easeInOut" }}
              style={{ transformOrigin: "58px 44px" }}
            >
              {/* Eye glow aura */}
              <motion.circle
                cx="58"
                cy="44"
                r="8"
                fill={EYE_GLOW}
                opacity="0.15"
                animate={animated ? { opacity: [0.1, 0.25, 0.1], scale: [1, 1.125, 1] } : undefined}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "58px 44px" }}
              />
              {/* Main eye */}
              <circle cx="58" cy="44" r="5.5" fill="url(#chiko3d-eye-glow)" />
              {/* Eye inner bright core */}
              <circle cx="58" cy="44" r="2.5" fill="#ffffff" opacity="0.7" />
              {/* Eye specular highlight */}
              <circle cx="56" cy="42" r="1.5" fill="#ffffff" opacity="0.9" />
            </motion.g>

            {/* ── RIGHT EYE ───────────────────────────── */}
            <motion.g
              animate={animated ? getEyeScale() : undefined}
              transition={{ duration: blink ? 0.1 : 0.4, ease: "easeInOut" }}
              style={{ transformOrigin: "82px 44px" }}
            >
              <motion.circle
                cx="82"
                cy="44"
                r="8"
                fill={EYE_GLOW}
                opacity="0.15"
                animate={animated ? { opacity: [0.1, 0.25, 0.1], scale: [1, 1.125, 1] } : undefined}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                style={{ transformOrigin: "82px 44px" }}
              />
              <circle cx="82" cy="44" r="5.5" fill="url(#chiko3d-eye-glow)" />
              <circle cx="82" cy="44" r="2.5" fill="#ffffff" opacity="0.7" />
              <circle cx="80" cy="42" r="1.5" fill="#ffffff" opacity="0.9" />
            </motion.g>

            {/* ── Ear pieces ──────────────────────────── */}
            {/* Left ear */}
            <rect x="36" y="38" width="8" height="16" rx="4" fill="url(#chiko3d-body)" />
            <motion.line
              x1="40" y1="40" x2="40" y2="52"
              stroke={ACCENT_CYAN}
              strokeWidth="1"
              opacity="0.5"
              animate={animated ? { opacity: [0.3, 0.7, 0.3] } : undefined}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Right ear */}
            <rect x="96" y="38" width="8" height="16" rx="4" fill="url(#chiko3d-body)" />
            <motion.line
              x1="100" y1="40" x2="100" y2="52"
              stroke={ACCENT_CYAN}
              strokeWidth="1"
              opacity="0.5"
              animate={animated ? { opacity: [0.3, 0.7, 0.3] } : undefined}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </g>

          {/* ═══ EXPRESSION OVERLAYS ═══ */}

          {/* Happy — squint arcs under eyes */}
          {expression === "happy" && (
            <>
              <motion.path
                d="M53 48 Q58 52 63 48"
                stroke={EYE_GLOW}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
              />
              <motion.path
                d="M77 48 Q82 52 87 48"
                stroke={EYE_GLOW}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
              />
            </>
          )}

          {/* Thinking — animated dots above head */}
          {expression === "thinking" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.circle
                  key={`think-${i}`}
                  cx={56 + i * 14}
                  cy={8}
                  r={2}
                  fill={ACCENT_CYAN}
                  animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -3, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                />
              ))}
            </>
          )}

          {/* Speaking — voice indicator bars below visor */}
          {expression === "speaking" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.rect
                  key={`speak-${i}`}
                  x={64 + i * 5}
                  y={53}
                  width={3}
                  height={4}
                  rx={1}
                  fill={ACCENT_CYAN}
                  animate={{ scaleY: [0.5, 1.5, 0.5], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 0.3 + i * 0.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
                  style={{ transformOrigin: `${65.5 + i * 5}px 55px` }}
                />
              ))}
            </>
          )}

          {/* Listening — ear pulse rings */}
          {expression === "listening" && (
            <>
              <motion.circle
                cx="40" cy="46" r="8"
                fill="none"
                stroke={ACCENT_CYAN}
                strokeWidth="1"
                animate={{ scale: [1, 1.5, 1], opacity: [0, 0.25, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                style={{ transformOrigin: "40px 46px" }}
              />
              <motion.circle
                cx="100" cy="46" r="8"
                fill="none"
                stroke={ACCENT_CYAN}
                strokeWidth="1"
                animate={{ scale: [1, 1.5, 1], opacity: [0, 0.25, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                style={{ transformOrigin: "100px 46px" }}
              />
            </>
          )}

          {/* Waving / Greeting — small sparkle near waving hand */}
          {(expression === "waving" || expression === "greeting") && !isSmall && (
            <motion.circle
              cx="125" cy="80" r="2"
              fill={ACCENT_CYAN}
              animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.3, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </svg>
      </motion.div>

      {/* ── Interaction sparkle effect ────────────────────── */}
      <AnimatePresence>
        {hovered && interactive && !isSmall && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute"
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: i % 2 === 0 ? "#84cc16" : ACCENT_CYAN,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: [0, (i - 1.5) * 20],
                  y: [0, (i % 2 === 0 ? -1 : 1) * 15 - 10],
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
