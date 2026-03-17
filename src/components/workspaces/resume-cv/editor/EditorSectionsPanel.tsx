// =============================================================================
// DMSuite — Resume Editor Left Panel: Sections
// Accordion-based section editor for all resume content.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeEditor } from "@/stores/resume-editor";
import { BUILT_IN_SECTIONS, createItemId } from "@/lib/resume/schema";
import type { Sections } from "@/lib/resume/schema";

// ── Inline SVG Icons ──

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function IconEye({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconPanelLeft({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section Display Names / Icons
// ---------------------------------------------------------------------------

const SECTION_LABELS: Record<string, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  volunteer: "Volunteer",
  projects: "Projects",
  awards: "Awards",
  references: "References",
};

// ---------------------------------------------------------------------------
// Basics Editor (name, headline, email, etc.)
// ---------------------------------------------------------------------------

function BasicsEditor() {
  const resume = useResumeEditor((s) => s.resume);
  const updateResume = useResumeEditor((s) => s.updateResume);

  const basics = resume.basics;

  return (
    <div className="space-y-3">
      <input
        value={basics.name}
        onChange={(e) => updateResume((d) => { d.basics.name = e.target.value; })}
        placeholder="Full Name"
        className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
      />
      <input
        value={basics.headline}
        onChange={(e) => updateResume((d) => { d.basics.headline = e.target.value; })}
        placeholder="Professional Headline"
        className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={basics.email}
          onChange={(e) => updateResume((d) => { d.basics.email = e.target.value; })}
          placeholder="Email"
          className="rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
        />
        <input
          value={basics.phone}
          onChange={(e) => updateResume((d) => { d.basics.phone = e.target.value; })}
          placeholder="Phone"
          className="rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
        />
      </div>
      <input
        value={basics.location}
        onChange={(e) => updateResume((d) => { d.basics.location = e.target.value; })}
        placeholder="Location"
        className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={basics.linkedin}
          onChange={(e) => updateResume((d) => { d.basics.linkedin = e.target.value; })}
          placeholder="LinkedIn"
          className="rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
        />
        <input
          value={basics.website.url}
          onChange={(e) => updateResume((d) => { d.basics.website.url = e.target.value; })}
          placeholder="Website"
          className="rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary Section Editor
// ---------------------------------------------------------------------------

function SummaryEditor() {
  const resume = useResumeEditor((s) => s.resume);
  const updateResume = useResumeEditor((s) => s.updateResume);

  return (
    <textarea
      value={resume.sections.summary.content}
      onChange={(e) => updateResume((d) => { d.sections.summary.content = e.target.value; })}
      placeholder="Write a professional summary..."
      rows={4}
      className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60 resize-none"
    />
  );
}

// ---------------------------------------------------------------------------
// Generic List Section Editor
// ---------------------------------------------------------------------------

function ListSectionEditor({ sectionKey }: { sectionKey: string }) {
  const resume = useResumeEditor((s) => s.resume);
  const addSectionItem = useResumeEditor((s) => s.addSectionItem);
  const updateSectionItem = useResumeEditor((s) => s.updateSectionItem);
  const removeSectionItem = useResumeEditor((s) => s.removeSectionItem);

  const section = (resume.sections as unknown as Record<string, { items: Record<string, unknown>[] }>)[sectionKey];
  if (!section?.items) return null;

  // Determine fields based on section type
  const fields = getSectionFields(sectionKey);

  return (
    <div className="space-y-2">
      {section.items.map((item, idx) => (
        <div
          key={(item.id as string) || idx}
          className="rounded-md border border-gray-700/50 bg-gray-800/30 p-2.5 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">#{idx + 1}</span>
            <button
              onClick={() => removeSectionItem(sectionKey, idx)}
              className="text-gray-600 hover:text-red-400 transition-colors"
            >
              <IconTrash />
            </button>
          </div>
          {fields.map((field) => (
            <input
              key={field.key}
              value={(item[field.key] as string) ?? ""}
              onChange={(e) =>
                updateSectionItem(sectionKey, idx, { [field.key]: e.target.value })
              }
              placeholder={field.label}
              className="w-full rounded-md border border-gray-700 bg-gray-800/60 px-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
            />
          ))}
        </div>
      ))}
      <button
        onClick={() =>
          addSectionItem(sectionKey, {
            id: createItemId(),
            hidden: false,
            ...getDefaultItem(sectionKey),
          })
        }
        className="flex items-center justify-center gap-1.5 w-full rounded-md border border-dashed border-gray-700 py-2 text-xs text-gray-500 transition-colors hover:border-primary-500/40 hover:text-primary-400"
      >
        <IconPlus />
        Add Item
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section field definitions
// ---------------------------------------------------------------------------

function getSectionFields(sectionKey: string): { key: string; label: string }[] {
  switch (sectionKey) {
    case "experience":
      return [
        { key: "company", label: "Company" },
        { key: "position", label: "Position" },
        { key: "location", label: "Location" },
        { key: "startDate", label: "Start Date" },
        { key: "endDate", label: "End Date" },
        { key: "description", label: "Description" },
      ];
    case "education":
      return [
        { key: "institution", label: "Institution" },
        { key: "degree", label: "Degree" },
        { key: "field", label: "Field" },
        { key: "graduationYear", label: "Year" },
      ];
    case "skills":
      return [
        { key: "name", label: "Skill Category" },
      ];
    case "certifications":
      return [
        { key: "name", label: "Name" },
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
        { key: "description", label: "Description" },
      ];
    case "projects":
      return [
        { key: "name", label: "Project Name" },
        { key: "description", label: "Description" },
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
      return [{ key: "title", label: "Title" }, { key: "description", label: "Description" }];
  }
}

function getDefaultItem(sectionKey: string): Record<string, string> {
  const fields = getSectionFields(sectionKey);
  const obj: Record<string, string> = {};
  for (const f of fields) obj[f.key] = "";
  return obj;
}

// ---------------------------------------------------------------------------
// Accordion Section
// ---------------------------------------------------------------------------

function AccordionSection({
  sectionKey,
  title,
  isOpen,
  onToggle,
  children,
}: {
  sectionKey: string;
  title: string;
  isOpen: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  const resume = useResumeEditor((s) => s.resume);
  const toggleSectionVisibility = useResumeEditor((s) => s.toggleSectionVisibility);

  const section = (resume.sections as unknown as Record<string, { hidden: boolean }>)[sectionKey];
  const isHidden = section?.hidden ?? false;

  return (
    <div className="border-b border-gray-800/50">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggle(sectionKey)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(sectionKey); } }}
        className="flex items-center justify-between w-full py-2.5 px-3 text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer select-none"
      >
        <span className={isHidden ? "line-through opacity-50" : ""}>{title}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSectionVisibility(sectionKey);
            }}
            className="text-gray-600 hover:text-gray-400 transition-colors p-0.5"
            title={isHidden ? "Show section" : "Hide section"}
          >
            {isHidden ? <IconEyeOff /> : <IconEye />}
          </button>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <IconChevronDown className="text-gray-600" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel Component
// ---------------------------------------------------------------------------

export default function EditorSectionsPanel({ onCollapse }: { onCollapse?: () => void }) {
  // ── Exclusive accordion: only one section open at a time ──
  const [openSection, setOpenSection] = useState<string | null>(null);

  const handleToggle = useCallback((key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900/60 border-r border-gray-800/40">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-800/50">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Sections
        </span>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="text-gray-600 hover:text-gray-400 transition-colors"
            title="Collapse panel"
          >
            <IconPanelLeft />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Basics */}
        <AccordionSection sectionKey="basics" title="Contact Information" isOpen={openSection === "basics"} onToggle={handleToggle}>
          <BasicsEditor />
        </AccordionSection>

        {/* Summary */}
        <AccordionSection sectionKey="summary" title={SECTION_LABELS.summary} isOpen={openSection === "summary"} onToggle={handleToggle}>
          <SummaryEditor />
        </AccordionSection>

        {/* All built-in sections with items */}
        {BUILT_IN_SECTIONS.filter((k) => k !== "summary").map((key) => (
          <AccordionSection key={key} sectionKey={key} title={SECTION_LABELS[key] || key} isOpen={openSection === key} onToggle={handleToggle}>
            <ListSectionEditor sectionKey={key} />
          </AccordionSection>
        ))}
      </div>
    </div>
  );
}
