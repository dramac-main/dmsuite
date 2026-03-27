// =============================================================================
// Cover Letter Target Tab — Letter type, tone, job targeting, personal background
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  useCoverLetterEditor,
  COVER_LETTER_TYPES,
  TONE_OPTIONS,
} from "@/stores/cover-letter-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  SelectionCard,
  SIcon,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import type { CoverLetterType, ToneStyle } from "@/stores/cover-letter-editor";

const icons = {
  type: <SIcon d="M13 10V3L4 14h7v7l9-11h-7z" />,
  tone: <SIcon d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4-4h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v1a3 3 0 01-3 3z" />,
  target: <SIcon d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  background: <SIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
};

// ── Chip input for skills / achievements ──

function TagInput({ tags, onAdd, onRemove, placeholder }: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Enter" || e.key === ",") && input.trim()) {
        e.preventDefault();
        onAdd(input.trim());
        setInput("");
      }
      if (e.key === "Backspace" && !input && tags.length > 0) {
        onRemove(tags.length - 1);
      }
    },
    [input, onAdd, onRemove, tags.length],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary-500/12 text-primary-300 text-[11px] font-medium"
          >
            {tag}
            <button
              onClick={() => onRemove(i)}
              className="text-primary-400/60 hover:text-primary-300 ml-0.5 transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2 text-[12px] text-gray-100 placeholder:text-gray-500 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
      />
      <p className="text-[10px] text-gray-600 mt-1">Press Enter or comma to add</p>
    </div>
  );
}

// ── Main Tab ──

export default function CoverLetterTargetTab() {
  const store = useCoverLetterEditor();
  const [open, setOpen] = useState<Record<string, boolean>>({
    type: true,
    tone: false,
    target: false,
    background: false,
  });

  const toggle = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const currentType = COVER_LETTER_TYPES.find((t) => t.id === store.form.letterType)?.label;
  const currentTone = TONE_OPTIONS.find((t) => t.id === store.form.tone)?.label;
  const skillCount = store.form.background.keySkills.length;
  const achieveCount = store.form.background.achievements.length;

  return (
    <div className="space-y-2">
      {/* Letter Type */}
      <AccordionSection
        title="Letter Type"
        icon={icons.type}
        badge={currentType}
        isOpen={open.type}
        onToggle={() => toggle("type")}
      >
        <div className="grid grid-cols-2 gap-2">
          {COVER_LETTER_TYPES.map((lt) => (
            <SelectionCard
              key={lt.id}
              selected={store.form.letterType === lt.id}
              onClick={() => store.setLetterType(lt.id as CoverLetterType)}
            >
              <div>
                <div className="text-xs font-semibold">{lt.label}</div>
                <div className="text-[10px] text-gray-400 leading-tight">{lt.description}</div>
              </div>
            </SelectionCard>
          ))}
        </div>
      </AccordionSection>

      {/* Tone */}
      <AccordionSection
        title="Tone & Voice"
        icon={icons.tone}
        badge={currentTone}
        isOpen={open.tone}
        onToggle={() => toggle("tone")}
      >
        <div className="grid grid-cols-1 gap-2">
          {TONE_OPTIONS.map((to) => (
            <SelectionCard
              key={to.id}
              selected={store.form.tone === to.id}
              onClick={() => store.setTone(to.id as ToneStyle)}
            >
              <div>
                <div className="text-xs font-semibold">{to.label}</div>
                <div className="text-[10px] text-gray-400 leading-tight">{to.description}</div>
              </div>
            </SelectionCard>
          ))}
        </div>
      </AccordionSection>

      {/* Job Target */}
      <AccordionSection
        title="Job Target"
        icon={icons.target}
        badge={store.form.target.jobTitle || undefined}
        isOpen={open.target}
        onToggle={() => toggle("target")}
      >
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Job Title"
              value={store.form.target.jobTitle}
              onChange={(e) => store.updateTarget({ jobTitle: e.target.value })}
              placeholder="Senior Product Manager"
            />
            <FormInput
              label="Industry"
              value={store.form.target.industry}
              onChange={(e) => store.updateTarget({ industry: e.target.value })}
              placeholder="Technology / SaaS"
            />
          </div>
          <FormTextarea
            label="Job Description (key points)"
            value={store.form.target.jobDescription}
            onChange={(e) => store.updateTarget({ jobDescription: e.target.value })}
            placeholder="Paste the key responsibilities and requirements from the job posting…"
            rows={4}
          />
          <FormTextarea
            label="Key Requirements"
            value={store.form.target.keyRequirements}
            onChange={(e) => store.updateTarget({ keyRequirements: e.target.value })}
            placeholder="5+ years PM experience, data-driven decision making, stakeholder management…"
            rows={3}
          />
          <FormTextarea
            label="Company Mission / Values"
            value={store.form.target.companyMission}
            onChange={(e) => store.updateTarget({ companyMission: e.target.value })}
            placeholder="What does this company stand for? What makes it special?"
            rows={2}
          />
          <FormTextarea
            label="Why This Company?"
            value={store.form.target.whyThisCompany}
            onChange={(e) => store.updateTarget({ whyThisCompany: e.target.value })}
            placeholder="What specifically draws you to this company and role?"
            rows={2}
          />
        </div>
      </AccordionSection>

      {/* Personal Background */}
      <AccordionSection
        title="Your Background"
        icon={icons.background}
        badge={skillCount + achieveCount > 0 ? `${skillCount} skills · ${achieveCount} achievements` : undefined}
        isOpen={open.background}
        onToggle={() => toggle("background")}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <FormInput
              label="Current Role"
              value={store.form.background.currentRole}
              onChange={(e) => store.updateBackground({ currentRole: e.target.value })}
              placeholder="Product Lead at XYZ Inc."
            />
            <FormInput
              label="Years of Experience"
              value={store.form.background.yearsOfExperience}
              onChange={(e) => store.updateBackground({ yearsOfExperience: e.target.value })}
              placeholder="8+"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">Key Skills</label>
            <TagInput
              tags={store.form.background.keySkills}
              onAdd={(s) => store.addSkill(s)}
              onRemove={(i) => store.removeSkill(i)}
              placeholder="e.g. Project management, Python, UX design…"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1.5">Key Achievements</label>
            <TagInput
              tags={store.form.background.achievements}
              onAdd={(a) => store.addAchievement(a)}
              onRemove={(i) => store.removeAchievement(i)}
              placeholder="e.g. Increased revenue by 35%, Led team of 12…"
            />
          </div>

          <FormTextarea
            label="Career Highlights"
            value={store.form.background.careerHighlights}
            onChange={(e) => store.updateBackground({ careerHighlights: e.target.value })}
            placeholder="Brief summary of your most notable career accomplishments…"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-2">
            <FormTextarea
              label="Education"
              value={store.form.background.educationSummary}
              onChange={(e) => store.updateBackground({ educationSummary: e.target.value })}
              placeholder="MBA, Stanford University"
              rows={2}
            />
            <FormTextarea
              label="Certifications"
              value={store.form.background.relevantCertifications}
              onChange={(e) => store.updateBackground({ relevantCertifications: e.target.value })}
              placeholder="PMP, AWS Solutions Architect"
              rows={2}
            />
          </div>
        </div>
      </AccordionSection>

      {/* Variation Notes */}
      <AccordionSection
        title="Variation Notes"
        icon={<SIcon d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />}
        isOpen={false}
        onToggle={() => toggle("variation")}
      >
        <FormTextarea
          label="Notes for AI"
          value={store.form.variationNotes}
          onChange={(e) => store.setVariationNotes(e.target.value)}
          placeholder="Any extra context for Chiko to use when generating or refining your letter…"
          rows={3}
        />
      </AccordionSection>
    </div>
  );
}
