// =============================================================================
// DMSuite — Step 3: Brief Description
// One textarea for brand/vision, compact card options row (size + sides).
// =============================================================================

"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useBusinessCardWizard, type CardSize } from "@/stores/business-card-wizard";

// ── Quick-start prompt suggestions ──
const PROMPT_SUGGESTIONS = [
  "Modern tech startup — clean, minimal, professional",
  "Luxury real estate — premium, gold accents, elegant",
  "Creative agency — bold colors, artistic, unique",
  "Law firm — traditional, trustworthy, navy & gold",
  "Café & bakery — warm, organic, inviting tones",
  "Personal trainer — energetic, dynamic, motivating",
];

const CARD_SIZE_OPTIONS: { value: CardSize; label: string; sub: string }[] = [
  { value: "standard", label: "Standard", sub: "3.5×2\"" },
  { value: "eu",       label: "EU",       sub: "85×54mm" },
  { value: "square",   label: "Square",   sub: "2.5×2.5\"" },
];

export default function StepBrief() {
  const {
    brief, setBriefDescription, setFrontOnly, setCardSize,
    nextStep, prevStep, details,
  } = useBusinessCardWizard();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [charCount, setCharCount] = useState(brief.description.length);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (value: string) => {
    setBriefDescription(value);
    setCharCount(value.length);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setBriefDescription(suggestion);
    setCharCount(suggestion.length);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex flex-col items-center min-h-[60vh] gap-5 px-4 py-2 max-w-2xl mx-auto w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-white mb-2">
          Describe Your Vision
        </h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Tell the AI about your brand — what your company does, the vibe you
          want, or skip and let the AI decide.
        </p>
      </motion.div>

      {/* Context preview — what AI already knows */}
      {(details.company || details.title) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl px-4 py-3"
        >
          <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 font-medium">
            AI already knows
          </p>
          <div className="flex flex-wrap gap-2">
            {details.name && (
              <span className="px-2.5 py-1 rounded-full bg-gray-700/40 text-gray-300 text-xs">
                {details.name}
              </span>
            )}
            {details.title && (
              <span className="px-2.5 py-1 rounded-full bg-gray-700/40 text-gray-300 text-xs">
                {details.title}
              </span>
            )}
            {details.company && (
              <span className="px-2.5 py-1 rounded-full bg-primary-500/15 text-primary-400 text-xs border border-primary-500/20">
                {details.company}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Main textarea — one field for everything */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="w-full"
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={brief.description}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={"Describe your business and the card style you want.\n\ne.g. We're a boutique architecture firm specializing in modern residential design. I want something clean and minimal with a Scandinavian feel..."}
            rows={5}
            maxLength={600}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
          />
          <div className="absolute bottom-2.5 right-3 text-[10px] text-gray-600 tabular-nums">
            {charCount}/600
          </div>
        </div>
      </motion.div>

      {/* Quick suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <div className="flex flex-wrap gap-2">
          {PROMPT_SUGGESTIONS.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border ${
                brief.description === suggestion
                  ? "bg-primary-500/15 text-primary-400 border-primary-500/30"
                  : "bg-gray-800/40 text-gray-400 border-gray-700/30 hover:bg-gray-700/50 hover:text-gray-300"
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Card options — compact inline row ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 bg-gray-800/20 border border-gray-700/20 rounded-xl px-4 py-3"
      >
        {/* Card size */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider whitespace-nowrap">Size</span>
          <div className="flex bg-gray-800/60 rounded-lg p-0.5">
            {CARD_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCardSize(opt.value)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                  brief.cardSize === opt.value
                    ? "bg-primary-500/15 text-primary-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
                title={opt.sub}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-gray-700/40" />

        {/* Card sides */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider whitespace-nowrap">Sides</span>
          <div className="flex bg-gray-800/60 rounded-lg p-0.5">
            <button
              onClick={() => setFrontOnly(false)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                !brief.frontOnly
                  ? "bg-primary-500/15 text-primary-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Front + Back
            </button>
            <button
              onClick={() => setFrontOnly(true)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                brief.frontOnly
                  ? "bg-primary-500/15 text-primary-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Front Only
            </button>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 pt-2"
      >
        <button
          onClick={prevStep}
          className="px-5 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          ← Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={nextStep}
          className="px-8 py-2.5 rounded-xl bg-primary-500 text-gray-950 font-semibold text-sm shadow-lg shadow-primary-500/20 hover:bg-primary-400 transition-colors"
        >
          Generate Design →
        </motion.button>
      </motion.div>
    </div>
  );
}
