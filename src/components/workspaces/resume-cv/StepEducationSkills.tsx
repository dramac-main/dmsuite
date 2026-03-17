// =============================================================================
// DMSuite — Resume Step 4: Education & Skills
// Education entries + skill tags input.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeCVWizard } from "@/stores/resume-cv-wizard";

// ── Inline SVG Icons ──

function IconGraduationCap({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
// Education Card
// ---------------------------------------------------------------------------

function EducationCard({
  entry,
  onUpdate,
  onRemove,
}: {
  entry: { id: string; institution: string; degree: string; field: string; graduationYear: string };
  onUpdate: (data: Partial<typeof entry>) => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg border border-gray-700/60 bg-gray-800/40 p-3 space-y-3"
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-gray-300">
          {entry.institution || entry.degree || "New Education"}
        </span>
        <button
          onClick={onRemove}
          className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
          aria-label="Remove education"
        >
          <IconTrash />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={entry.institution}
          onChange={(e) => onUpdate({ institution: e.target.value })}
          placeholder="Institution name"
          className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
        />
        <input
          value={entry.degree}
          onChange={(e) => onUpdate({ degree: e.target.value })}
          placeholder="Degree (e.g., B.S.)"
          className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          value={entry.field}
          onChange={(e) => onUpdate({ field: e.target.value })}
          placeholder="Field of study"
          className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
        />
        <input
          value={entry.graduationYear}
          onChange={(e) => onUpdate({ graduationYear: e.target.value })}
          placeholder="Year (e.g., 2020)"
          className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
        />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Skill Tag Input
// ---------------------------------------------------------------------------

function SkillsInput({
  skills,
  onAdd,
  onRemove,
}: {
  skills: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Enter" || e.key === ",") && input.trim()) {
        e.preventDefault();
        onAdd(input.trim());
        setInput("");
      }
      if (e.key === "Backspace" && !input && skills.length > 0) {
        onRemove(skills[skills.length - 1]);
      }
    },
    [input, skills, onAdd, onRemove]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2">
        <AnimatePresence mode="popLayout">
          {skills.map((skill) => (
            <motion.span
              key={skill}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="inline-flex items-center gap-1 rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs text-primary-300"
            >
              {skill}
              <button
                onClick={() => onRemove(skill)}
                className="text-primary-400/60 hover:text-primary-300 transition-colors"
                aria-label={`Remove ${skill}`}
              >
                <IconX />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? "Type a skill and press Enter..." : ""}
          className="flex-1 min-w-20 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
        />
      </div>
      <p className="text-xs text-gray-600">
        {skills.length}/25 skills. Press Enter or comma to add.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suggested skills
// ---------------------------------------------------------------------------

const SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL",
  "Project Management", "Leadership", "Communication", "Data Analysis",
  "AWS", "Docker", "Git", "Agile", "UI/UX Design", "Machine Learning",
];

// ---------------------------------------------------------------------------
// Step Component
// ---------------------------------------------------------------------------

export default function StepEducationSkills() {
  const {
    education,
    addEducation,
    updateEducation,
    removeEducation,
    skills,
    addSkill,
    removeSkill,
    nextStep,
    prevStep,
  } = useResumeCVWizard();

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
          <IconGraduationCap />
        </div>
        <h2 className="text-xl font-semibold text-white">Education & Skills</h2>
        <p className="text-sm text-gray-400 mt-1">
          Add your education and key skills. These are essential for ATS scoring.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-8"
      >
        {/* ── Education Section ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Education</h3>

          <AnimatePresence mode="popLayout">
            {education.map((entry) => (
              <EducationCard
                key={entry.id}
                entry={entry}
                onUpdate={(data) => updateEducation(entry.id, data)}
                onRemove={() => removeEducation(entry.id)}
              />
            ))}
          </AnimatePresence>

          <button
            onClick={addEducation}
            className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-gray-700 py-3 text-sm text-gray-500 transition-colors hover:border-primary-500/40 hover:text-primary-400"
          >
            <IconPlus />
            Add Education
          </button>
        </div>

        {/* ── Skills Section ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Skills</h3>
          <SkillsInput skills={skills} onAdd={addSkill} onRemove={removeSkill} />

          {/* Suggestions */}
          <div className="space-y-1.5">
            <span className="text-xs text-gray-600">Suggestions:</span>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="rounded-full border border-gray-700/50 bg-gray-800/40 px-2.5 py-0.5 text-xs text-gray-500 transition-colors hover:text-gray-300 hover:border-gray-600"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
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
          Continue
          <IconArrowRight />
        </button>
      </motion.div>
    </div>
  );
}
