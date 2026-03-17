// =============================================================================
// DMSuite — Resume Step 2: Target Role
// Collects job title, experience level, industry, additional context.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { useResumeCVWizard } from "@/stores/resume-cv-wizard";
import type { ExperienceLevel } from "@/lib/resume/schema";

// ── Inline SVG Icons ──

function IconTarget({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
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
// Experience level options
// ---------------------------------------------------------------------------

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string; description: string }[] = [
  { value: "entry", label: "Entry Level", description: "0-2 years experience" },
  { value: "mid", label: "Mid Level", description: "3-5 years experience" },
  { value: "senior", label: "Senior", description: "6-10 years experience" },
  { value: "executive", label: "Executive", description: "10+ years, leadership" },
];

const INDUSTRY_SUGGESTIONS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Marketing",
  "Engineering",
  "Design",
  "Consulting",
  "Legal",
  "Nonprofit",
  "Government",
  "Media",
];

// ---------------------------------------------------------------------------
// Step Component
// ---------------------------------------------------------------------------

export default function StepTargetRole() {
  const { targetRole, updateTargetRole, nextStep, prevStep } = useResumeCVWizard();

  const canContinue = targetRole.jobTitle.trim().length > 0;

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
          <IconTarget />
        </div>
        <h2 className="text-xl font-semibold text-white">Target Role</h2>
        <p className="text-sm text-gray-400 mt-1">
          What position are you targeting? This helps the AI tailor your resume.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        {/* Job Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            Target Job Title <span className="text-red-400 text-xs">*</span>
          </label>
          <input
            type="text"
            value={targetRole.jobTitle}
            onChange={(e) => updateTargetRole("jobTitle", e.target.value)}
            placeholder="Senior Software Engineer"
            className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30"
          />
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Experience Level</label>
          <div className="grid grid-cols-2 gap-2">
            {EXPERIENCE_LEVELS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => updateTargetRole("experienceLevel", value)}
                className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                  targetRole.experienceLevel === value
                    ? "border-primary-500/60 bg-primary-500/10 text-primary-300 ring-1 ring-primary-500/30"
                    : "border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:text-gray-300"
                }`}
              >
                <span className="text-sm font-medium block">{label}</span>
                <span className="text-xs text-gray-500">{description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Industry</label>
          <input
            type="text"
            value={targetRole.industry}
            onChange={(e) => updateTargetRole("industry", e.target.value)}
            placeholder="e.g., Technology"
            className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {INDUSTRY_SUGGESTIONS.map((ind) => (
              <button
                key={ind}
                onClick={() => updateTargetRole("industry", ind)}
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  targetRole.industry === ind
                    ? "bg-primary-500/20 text-primary-300 border border-primary-500/40"
                    : "bg-gray-800/60 text-gray-500 border border-gray-700/50 hover:text-gray-300 hover:border-gray-600"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Context */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            Additional Context
            <span className="text-gray-600 text-xs font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={targetRole.additionalContext}
            onChange={(e) => updateTargetRole("additionalContext", e.target.value)}
            placeholder="Any specific requirements, career change notes, or things the AI should know..."
            rows={3}
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
          disabled={!canContinue}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-all hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <IconArrowRight />
        </button>
      </motion.div>
    </div>
  );
}
