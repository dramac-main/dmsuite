"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* â”€â”€ Chiko Avatar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Animated SVG avatar for Chiko â€” a friendly robot/sparkle
   character with a glowing electric-lime aura.
   Sizes: sm (32px), md (40px), lg (56px)
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface ChikoAvatarProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
  pulse?: boolean;
}

const sizeMap = { sm: 32, md: 40, lg: 56 };

export function ChikoAvatar({
  size = "md",
  animated = true,
  className,
  pulse = false,
}: ChikoAvatarProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Pulse ring */}
      {pulse && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary-500/20"
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Glow aura */}
      {animated && (
        <motion.div
          className="absolute -inset-0.75 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(132,204,22,0.3) 0%, transparent 70%)",
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Main avatar */}
      <motion.svg
        width={s}
        height={s}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        initial={animated ? { rotate: -5 } : undefined}
        animate={animated ? { rotate: [0, 3, -3, 0] } : undefined}
        transition={animated ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        {/* Background circle */}
        <circle cx="28" cy="28" r="26" fill="url(#chikoGrad)" stroke="url(#chikoStroke)" strokeWidth="2" />

        {/* Face plate */}
        <rect x="15" y="16" width="26" height="22" rx="8" fill="#1a1a2e" opacity="0.9" />

        {/* Left eye */}
        <motion.ellipse
          cx="22"
          cy="25"
          rx="3.5"
          ry="3.5"
          fill="#8b5cf6"
          animate={animated ? {
            ry: [3.5, 0.8, 3.5],
          } : undefined}
          transition={animated ? {
            duration: 4,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          } : undefined}
        />
        <circle cx="23" cy="24" r="1.2" fill="#ffffff" opacity="0.9" />

        {/* Right eye */}
        <motion.ellipse
          cx="34"
          cy="25"
          rx="3.5"
          ry="3.5"
          fill="#8b5cf6"
          animate={animated ? {
            ry: [3.5, 0.8, 3.5],
          } : undefined}
          transition={animated ? {
            duration: 4,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          } : undefined}
        />
        <circle cx="35" cy="24" r="1.2" fill="#ffffff" opacity="0.9" />

        {/* Mouth â€” happy smile */}
        <path
          d="M22 31 Q28 36 34 31"
          stroke="#8b5cf6"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Antenna */}
        <line x1="28" y1="16" x2="28" y2="8" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
        <motion.circle
          cx="28"
          cy="7"
          r="2.5"
          fill="#8b5cf6"
          animate={animated ? { opacity: [1, 0.4, 1], scale: [1, 1.2, 1] } : undefined}
          transition={animated ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : undefined}
        />

        {/* Left ear antenna */}
        <line x1="15" y1="20" x2="10" y2="14" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="9" cy="13" r="1.8" fill="#06b6d4" />

        {/* Right ear antenna */}
        <line x1="41" y1="20" x2="46" y2="14" stroke="#06b6d4" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="47" cy="13" r="1.8" fill="#06b6d4" />

        {/* Sparkle decorations */}
        <motion.path
          d="M8 32 L9.5 29.5 L11 32 L9.5 34.5Z"
          fill="#8b5cf6"
          opacity="0.7"
          animate={animated ? { opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.2, 0.8] } : undefined}
          transition={animated ? { duration: 2, repeat: Infinity, delay: 0.5 } : undefined}
        />
        <motion.path
          d="M46 36 L47.5 33.5 L49 36 L47.5 38.5Z"
          fill="#06b6d4"
          opacity="0.7"
          animate={animated ? { opacity: [0.3, 0.9, 0.3], scale: [0.8, 1.2, 0.8] } : undefined}
          transition={animated ? { duration: 2, repeat: Infinity, delay: 1 } : undefined}
        />

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="chikoGrad" x1="0" y1="0" x2="56" y2="56">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#16213e" />
          </linearGradient>
          <linearGradient id="chikoStroke" x1="0" y1="0" x2="56" y2="56">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}
