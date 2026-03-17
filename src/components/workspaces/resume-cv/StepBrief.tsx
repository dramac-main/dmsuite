// =============================================================================
// DMSuite — Resume Step 5: Brief / Preferences
// Style, template preference, accent color, content fidelity mode, job desc.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useResumeCVWizard } from "@/stores/resume-cv-wizard";
import type { ResumeStyle, PageCountPreference, ContentFidelityMode } from "@/lib/resume/schema";
import { ACCENT_COLORS } from "@/lib/resume/schema";

// ── Inline SVG Icons ──

function IconPen({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function IconArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function IconArrowLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Style options
// ---------------------------------------------------------------------------

const STYLE_OPTIONS: { value: ResumeStyle; label: string; description: string }[] = [
  { value: "professional", label: "Professional", description: "Clean and corporate" },
  { value: "modern", label: "Modern", description: "Contemporary design" },
  { value: "creative", label: "Creative", description: "Bold and expressive" },
  { value: "executive", label: "Executive", description: "Traditional leadership" },
];

const PAGE_COUNT_OPTIONS: { value: PageCountPreference; label: string }[] = [
  { value: "one", label: "1 Page" },
  { value: "two", label: "2 Pages" },
  { value: "auto", label: "Auto" },
];

const FIDELITY_OPTIONS: { value: ContentFidelityMode; label: string; description: string }[] = [
  { value: "keep-exact", label: "Keep Exact", description: "Use my exact wording" },
  { value: "ai-enhanced", label: "AI Enhanced", description: "Polish and improve my text" },
];

// ---------------------------------------------------------------------------
// Step Component
// ---------------------------------------------------------------------------

export default function StepBrief() {
  const { brief, updateBrief, nextStep, prevStep } = useResumeCVWizard();

  return (
    <div className="mx-auto max-w-lg px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500/10 text-primary-400 mb-4">
          <IconPen />
        </div>
        <h2 className="text-xl font-semibold text-white">Design Brief</h2>
        <p className="text-sm text-gray-400 mt-1">
          Customize how your resume will look and how the AI should handle your content.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        {/* Style Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Resume Style</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STYLE_OPTIONS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => updateBrief("style", value)}
                className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                  brief.style === value
                    ? "border-primary-500/60 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/30"
                    : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                }`}
              >
                <span className="text-xs font-medium block">{label}</span>
                <span className="text-xs text-gray-500">{description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Page Count */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Page Length</label>
          <div className="flex gap-2">
            {PAGE_COUNT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => updateBrief("pageCount", value)}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                  brief.pageCount === value
                    ? "border-primary-500/60 bg-primary-500/10 text-primary-300"
                    : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Accent Color</label>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map(({ name, value }) => (
              <button
                key={name}
                onClick={() => updateBrief("accentColor", value)}
                title={name}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  brief.accentColor === value
                    ? "border-white scale-110 shadow-lg"
                    : "border-transparent hover:border-gray-500"
                }`}
                style={{ backgroundColor: value }}
              />
            ))}
          </div>
        </div>

        {/* Content Fidelity */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Content Mode</label>
          <div className="space-y-2">
            {FIDELITY_OPTIONS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => updateBrief("contentFidelityMode", value)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                  brief.contentFidelityMode === value
                    ? "border-primary-500/60 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/30"
                    : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600"
                }`}
              >
                <span className="text-sm font-medium block">{label}</span>
                <span className="text-xs text-gray-500">{description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            Target Job Description
            <span className="text-gray-600 text-xs font-normal ml-1">(for ATS optimization)</span>
          </label>
          <textarea
            value={brief.jobDescription}
            onChange={(e) => updateBrief("jobDescription", e.target.value)}
            placeholder="Paste the job description here for AI-powered keyword optimization..."
            rows={4}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30 resize-none"
          />
        </div>

        {/* Additional notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            Additional Notes
            <span className="text-gray-600 text-xs font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={brief.description}
            onChange={(e) => updateBrief("description", e.target.value)}
            placeholder="Any specific instructions for the AI generator..."
            rows={2}
            className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30 resize-none"
          />
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-between mt-8"
      >
        <button
          onClick={prevStep}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:border-gray-600 hover:text-gray-300"
        >
          <IconArrowLeft />
          Back
        </button>
        <button
          onClick={nextStep}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-all hover:bg-primary-400"
        >
          Generate Resume
          <IconArrowRight />
        </button>
      </motion.div>
    </div>
  );
}
