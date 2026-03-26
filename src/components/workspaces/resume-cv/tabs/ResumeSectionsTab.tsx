// =============================================================================
// DMSuite — Resume Sections Tab
// Toggle-based section list mirroring Contract's Clauses tab pattern:
// each section is a row with toggle, title, item count, inline expand-edit.
// No accordion → flat toggleable list with inline editing on expand.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeEditor } from "@/stores/resume-editor";
import { BUILT_IN_SECTIONS, createItemId } from "@/lib/resume/schema";

// ── Inline SVG Icons ──

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconGripVertical({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

// ── Section display info ──

const SECTION_META: Record<string, { label: string; category: string }> = {
  summary: { label: "Professional Summary", category: "overview" },
  experience: { label: "Work Experience", category: "career" },
  education: { label: "Education", category: "career" },
  skills: { label: "Skills", category: "core" },
  certifications: { label: "Certifications", category: "credentials" },
  languages: { label: "Languages", category: "additional" },
  volunteer: { label: "Volunteer", category: "additional" },
  projects: { label: "Projects", category: "portfolio" },
  awards: { label: "Awards", category: "credentials" },
  references: { label: "References", category: "additional" },
};

const CATEGORY_COLORS: Record<string, string> = {
  overview: "text-blue-400 bg-blue-500/10",
  career: "text-green-400 bg-green-500/10",
  core: "text-amber-400 bg-amber-500/10",
  credentials: "text-purple-400 bg-purple-500/10",
  portfolio: "text-cyan-400 bg-cyan-500/10",
  additional: "text-gray-400 bg-gray-500/10",
};

const INPUT_CLS =
  "w-full rounded-md border border-gray-700 bg-gray-800/60 px-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-primary-500/60 transition-colors";

// ── Section field definitions ──

function getSectionFields(sectionKey: string): { key: string; label: string; large?: boolean }[] {
  switch (sectionKey) {
    case "experience":
      return [
        { key: "company", label: "Company" },
        { key: "position", label: "Position" },
        { key: "location", label: "Location" },
        { key: "startDate", label: "Start Date" },
        { key: "endDate", label: "End Date" },
        { key: "description", label: "Description", large: true },
      ];
    case "education":
      return [
        { key: "institution", label: "Institution" },
        { key: "degree", label: "Degree" },
        { key: "field", label: "Field of Study" },
        { key: "graduationYear", label: "Year" },
      ];
    case "skills":
      return [{ key: "name", label: "Skill Category" }];
    case "certifications":
      return [
        { key: "name", label: "Certification" },
        { key: "issuer", label: "Issuer" },
        { key: "year", label: "Year" },
      ];
    case "languages":
      return [
        { key: "name", label: "Language" },
        { key: "proficiency", label: "Proficiency" },
      ];
    case "volunteer":
      return [
        { key: "organization", label: "Organization" },
        { key: "role", label: "Role" },
        { key: "description", label: "Description", large: true },
      ];
    case "projects":
      return [
        { key: "name", label: "Project Name" },
        { key: "description", label: "Description", large: true },
        { key: "url", label: "URL" },
      ];
    case "awards":
      return [
        { key: "title", label: "Title" },
        { key: "issuer", label: "Issuer" },
        { key: "date", label: "Date" },
      ];
    case "references":
      return [
        { key: "name", label: "Name" },
        { key: "relationship", label: "Relationship" },
        { key: "email", label: "Email" },
      ];
    default:
      return [
        { key: "title", label: "Title" },
        { key: "description", label: "Description" },
      ];
  }
}

function getDefaultItem(sectionKey: string): Record<string, string> {
  const fields = getSectionFields(sectionKey);
  const obj: Record<string, string> = {};
  for (const f of fields) obj[f.key] = "";
  return obj;
}

// =============================================================================
// Section Row — mirrors Contract's Clause Row
// =============================================================================

function SectionRow({
  sectionKey,
  isExpanded,
  onToggleExpand,
}: {
  sectionKey: string;
  isExpanded: boolean;
  onToggleExpand: (key: string) => void;
}) {
  const resume = useResumeEditor((s) => s.resume);
  const toggleSectionVisibility = useResumeEditor((s) => s.toggleSectionVisibility);
  const addSectionItem = useResumeEditor((s) => s.addSectionItem);
  const updateSectionItem = useResumeEditor((s) => s.updateSectionItem);
  const removeSectionItem = useResumeEditor((s) => s.removeSectionItem);

  const meta = SECTION_META[sectionKey] || {
    label: sectionKey,
    category: "additional",
  };
  const catColor =
    CATEGORY_COLORS[meta.category] || CATEGORY_COLORS.additional;

  // Section data — summary is special (no items array)
  const section = (
    resume.sections as unknown as Record<
      string,
      { hidden: boolean; items?: Record<string, unknown>[] }
    >
  )[sectionKey];
  if (!section) return null;

  const isHidden = section.hidden ?? false;
  const itemCount = section.items?.length ?? 0;
  const isSummary = sectionKey === "summary";

  return (
    <div
      className={`border-b border-gray-800/40 transition-colors ${
        isHidden ? "opacity-50" : ""
      }`}
    >
      {/* ── Row header ── */}
      <div className="flex items-center gap-2 px-3 py-2.5 group">
        {/* Grip handle */}
        <span className="text-gray-700 group-hover:text-gray-500 transition-colors cursor-grab">
          <IconGripVertical />
        </span>

        {/* Visibility toggle (like contract clause toggle) */}
        <button
          onClick={() => toggleSectionVisibility(sectionKey)}
          className={`shrink-0 w-8 h-4.5 rounded-full transition-all relative ${
            isHidden
              ? "bg-gray-700"
              : "bg-primary-500/80"
          }`}
          title={isHidden ? "Show section" : "Hide section"}
        >
          <span
            className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all ${
              isHidden ? "left-0.5" : "left-[calc(100%-0.5rem-0.125rem)]"
            }`}
          />
        </button>

        {/* Title + badge */}
        <button
          onClick={() => onToggleExpand(sectionKey)}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          <span
            className={`text-sm font-medium transition-colors truncate ${
              isHidden
                ? "text-gray-600 line-through"
                : "text-gray-200"
            }`}
          >
            {meta.label}
          </span>
          <span
            className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${catColor}`}
          >
            {meta.category}
          </span>
          {!isSummary && itemCount > 0 && (
            <span className="shrink-0 text-[9px] text-gray-500 bg-gray-800 rounded-full px-1.5 py-0.5">
              {itemCount}
            </span>
          )}
        </button>

        {/* Expand/Edit pencil */}
        <motion.button
          onClick={() => onToggleExpand(sectionKey)}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors p-0.5"
          title="Edit section"
        >
          <IconChevronDown />
        </motion.button>
      </div>

      {/* ── Expanded inline editor ── */}
      <AnimatePresence initial={false}>
        {isExpanded && !isSummary && section.items && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {section.items.map(
                (item: Record<string, unknown>, idx: number) => {
                  const fields = getSectionFields(sectionKey);
                  return (
                    <div
                      key={(item.id as string) || idx}
                      className="rounded-lg border border-gray-700/40 bg-gray-800/30 p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 font-medium">
                          #{idx + 1}
                        </span>
                        <button
                          onClick={() =>
                            removeSectionItem(sectionKey, idx)
                          }
                          className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
                          title="Remove"
                        >
                          <IconTrash />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {fields.map((field) =>
                          field.large ? (
                            <textarea
                              key={field.key}
                              value={
                                (item[field.key] as string) ?? ""
                              }
                              onChange={(e) =>
                                updateSectionItem(
                                  sectionKey,
                                  idx,
                                  { [field.key]: e.target.value }
                                )
                              }
                              placeholder={field.label}
                              rows={3}
                              className={`${INPUT_CLS} resize-none`}
                            />
                          ) : (
                            <input
                              key={field.key}
                              value={
                                (item[field.key] as string) ?? ""
                              }
                              onChange={(e) =>
                                updateSectionItem(
                                  sectionKey,
                                  idx,
                                  { [field.key]: e.target.value }
                                )
                              }
                              placeholder={field.label}
                              className={INPUT_CLS}
                            />
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}

              {/* Add item button */}
              <button
                onClick={() =>
                  addSectionItem(sectionKey, {
                    id: createItemId(),
                    hidden: false,
                    ...getDefaultItem(sectionKey),
                  })
                }
                className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-dashed border-gray-700/50 py-2 text-xs text-gray-500 transition-colors hover:border-primary-500/40 hover:text-primary-400"
              >
                <IconPlus />
                Add Item
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary special: inline textarea */}
      <AnimatePresence initial={false}>
        {isExpanded && isSummary && (
          <SummaryInlineEditor />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Summary has special inline editor (textarea only) ──

function SummaryInlineEditor() {
  const resume = useResumeEditor((s) => s.resume);
  const updateResume = useResumeEditor((s) => s.updateResume);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="px-3 pb-3">
        <textarea
          value={resume.sections.summary.content}
          onChange={(e) =>
            updateResume((d) => {
              d.sections.summary.content = e.target.value;
            })
          }
          placeholder="Write a professional summary..."
          rows={4}
          className={`${INPUT_CLS} resize-none`}
        />
      </div>
    </motion.div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface ResumeSectionsTabProps {
  activeSectionKey?: string | null;
}

export default function ResumeSectionsTab({
  activeSectionKey,
}: ResumeSectionsTabProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Allow parent to force-expand a section (from layers or canvas click)
  const effectiveExpanded = activeSectionKey ?? expandedKey;

  const handleToggleExpand = useCallback((key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  }, []);

  const resume = useResumeEditor((s) => s.resume);

  // Count visible sections
  const visibleCount = Object.values(resume.sections).filter(
    (s) => s && typeof s === "object" && "hidden" in s && !s.hidden
  ).length;
  const totalCount = BUILT_IN_SECTIONS.length;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header bar with section count (like Contract clauses header) */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/40">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          Section Library
        </span>
        <span className="text-[10px] text-gray-500">
          <span className="text-primary-400 font-semibold">{visibleCount}</span>
          /{totalCount} visible
        </span>
      </div>

      {/* Section rows */}
      <div className="flex-1 overflow-y-auto">
        {BUILT_IN_SECTIONS.map((key) => (
          <SectionRow
            key={key}
            sectionKey={key}
            isExpanded={effectiveExpanded === key}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </div>
  );
}
