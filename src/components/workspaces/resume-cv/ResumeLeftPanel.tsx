// =============================================================================
// DMSuite — Resume Left Panel
// Scrollable panel with all section editors in accordion-style cards.
// Mirrors Reactive Resume's left sidebar: Basics → Profiles → Summary →
// Experience → Education → Skills → then remaining sections.
// =============================================================================

"use client";

import React, { useState, useCallback, useRef } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import { createItemId, type BuiltInSectionId } from "@/lib/resume/schema";
import BasicsSection from "./sections/BasicsSection";
import SummarySection from "./sections/SummarySection";
import ListSection from "./sections/ListSection";
import {
  AccordionSection,
  SIcon,
  IconButton,
  ActionButton,
  Icons,
  FormInput,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// =============================================================================
// Section metadata for rendering
// =============================================================================

interface SectionMeta {
  key: string;
  label: string;
  icon: string; // SVG path d
  type: "basics" | "summary" | "list";
}

const SECTION_ORDER: SectionMeta[] = [
  { key: "basics", label: "Basics", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", type: "basics" },
  { key: "summary", label: "Summary", icon: "M4 6h16M4 12h16M4 18h7", type: "summary" },
  { key: "profiles", label: "Profiles", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", type: "list" },
  { key: "experience", label: "Experience", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", type: "list" },
  { key: "education", label: "Education", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z", type: "list" },
  { key: "skills", label: "Skills", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", type: "list" },
  { key: "certifications", label: "Certifications", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", type: "list" },
  { key: "languages", label: "Languages", icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129", type: "list" },
  { key: "projects", label: "Projects", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z", type: "list" },
  { key: "volunteer", label: "Volunteer", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", type: "list" },
  { key: "awards", label: "Awards", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", type: "list" },
  { key: "publications", label: "Publications", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", type: "list" },
  { key: "interests", label: "Interests", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", type: "list" },
  { key: "references", label: "References", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", type: "list" },
];

// =============================================================================
// Schema for field definitions per section key (list sections)
// =============================================================================

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "keywords" | "date";
  placeholder?: string;
  options?: { label: string; value: string }[];
  colSpan?: 2; // full width
}

export const SECTION_FIELDS: Record<string, FieldDef[]> = {
  profiles: [
    { key: "network", label: "Network", type: "text", placeholder: "e.g. LinkedIn, GitHub, Twitter" },
    { key: "username", label: "Username", type: "text", placeholder: "johndoe" },
    { key: "url", label: "URL", type: "text", placeholder: "https://...", colSpan: 2 },
  ],
  experience: [
    { key: "company", label: "Company", type: "text", placeholder: "Company name" },
    { key: "position", label: "Position", type: "text", placeholder: "Job title" },
    { key: "location", label: "Location", type: "text", placeholder: "City, Country" },
    { key: "startDate", label: "Start Date", type: "text", placeholder: "Jan 2020" },
    { key: "endDate", label: "End Date", type: "text", placeholder: "Present" },
    { key: "website", label: "Website", type: "text", placeholder: "https://..." },
    { key: "description", label: "Description", type: "textarea", placeholder: "Describe your responsibilities and achievements...", colSpan: 2 },
  ],
  education: [
    { key: "institution", label: "Institution", type: "text", placeholder: "University name" },
    { key: "degree", label: "Degree", type: "text", placeholder: "e.g. Bachelor of Science" },
    { key: "field", label: "Field of Study", type: "text", placeholder: "e.g. Computer Science" },
    { key: "graduationYear", label: "Year", type: "text", placeholder: "2024" },
    { key: "description", label: "Description", type: "textarea", placeholder: "Relevant coursework, honors...", colSpan: 2 },
  ],
  skills: [
    { key: "name", label: "Skill Group", type: "text", placeholder: "e.g. Programming Languages" },
    { key: "proficiency", label: "Level", type: "select", options: [
      { label: "Beginner", value: "beginner" },
      { label: "Intermediate", value: "intermediate" },
      { label: "Advanced", value: "advanced" },
      { label: "Expert", value: "expert" },
    ]},
    { key: "keywords", label: "Skills", type: "keywords", placeholder: "Add a skill...", colSpan: 2 },
  ],
  certifications: [
    { key: "name", label: "Name", type: "text", placeholder: "Certification name" },
    { key: "issuer", label: "Issuer", type: "text", placeholder: "Issuing organization" },
    { key: "year", label: "Year", type: "text", placeholder: "2024" },
    { key: "url", label: "URL", type: "text", placeholder: "https://..." },
  ],
  languages: [
    { key: "name", label: "Language", type: "text", placeholder: "e.g. English" },
    { key: "proficiency", label: "Proficiency", type: "select", options: [
      { label: "Native", value: "native" },
      { label: "Fluent", value: "fluent" },
      { label: "Intermediate", value: "intermediate" },
      { label: "Basic", value: "basic" },
    ]},
  ],
  volunteer: [
    { key: "organization", label: "Organization", type: "text", placeholder: "Organization name" },
    { key: "role", label: "Role", type: "text", placeholder: "Your role" },
    { key: "startDate", label: "Start Date", type: "text", placeholder: "Jan 2020" },
    { key: "endDate", label: "End Date", type: "text", placeholder: "Present" },
    { key: "description", label: "Description", type: "textarea", placeholder: "Describe your contributions...", colSpan: 2 },
  ],
  projects: [
    { key: "name", label: "Project Name", type: "text", placeholder: "Project name" },
    { key: "url", label: "URL", type: "text", placeholder: "https://..." },
    { key: "description", label: "Description", type: "textarea", placeholder: "Describe the project...", colSpan: 2 },
    { key: "keywords", label: "Technologies", type: "keywords", placeholder: "Add a technology...", colSpan: 2 },
  ],
  awards: [
    { key: "title", label: "Title", type: "text", placeholder: "Award name" },
    { key: "issuer", label: "Issuer", type: "text", placeholder: "Awarding organization" },
    { key: "date", label: "Date", type: "text", placeholder: "2024" },
    { key: "description", label: "Description", type: "textarea", placeholder: "Describe the award...", colSpan: 2 },
  ],
  publications: [
    { key: "name", label: "Title", type: "text", placeholder: "Publication title" },
    { key: "publisher", label: "Publisher", type: "text", placeholder: "Publisher name" },
    { key: "date", label: "Date", type: "text", placeholder: "2024" },
    { key: "url", label: "URL", type: "text", placeholder: "https://..." },
    { key: "description", label: "Description", type: "textarea", placeholder: "Describe the publication...", colSpan: 2 },
  ],
  interests: [
    { key: "name", label: "Interest", type: "text", placeholder: "e.g. Photography" },
    { key: "keywords", label: "Details", type: "keywords", placeholder: "Add details...", colSpan: 2 },
  ],
  references: [
    { key: "name", label: "Name", type: "text", placeholder: "Reference name" },
    { key: "relationship", label: "Relationship", type: "text", placeholder: "e.g. Former Manager" },
    { key: "phone", label: "Phone", type: "text", placeholder: "+1 234 567 890" },
    { key: "email", label: "Email", type: "text", placeholder: "email@example.com" },
    { key: "description", label: "Description", type: "textarea", placeholder: "Additional context...", colSpan: 2 },
  ],
};

// Item display label helpers
function getItemLabel(sectionKey: string, item: Record<string, unknown>): string {
  switch (sectionKey) {
    case "profiles": return (item.network as string) || (item.username as string) || "New Profile";
    case "experience": return (item.position as string) || (item.company as string) || "New Experience";
    case "education": return (item.degree as string) || (item.institution as string) || "New Education";
    case "skills": return (item.name as string) || "New Skill Group";
    case "certifications": return (item.name as string) || "New Certification";
    case "languages": return (item.name as string) || "New Language";
    case "volunteer": return (item.role as string) || (item.organization as string) || "New Volunteer";
    case "projects": return (item.name as string) || "New Project";
    case "awards": return (item.title as string) || "New Award";
    case "publications": return (item.name as string) || "New Publication";
    case "interests": return (item.name as string) || "New Interest";
    case "references": return (item.name as string) || "New Reference";
    default: return "Item";
  }
}

function getItemSubLabel(sectionKey: string, item: Record<string, unknown>): string {
  switch (sectionKey) {
    case "profiles": return (item.url as string) || "";
    case "experience": return (item.company as string) || "";
    case "education": return (item.field as string) || "";
    case "skills": return ((item.keywords as string[]) || []).join(", ");
    case "certifications": return (item.issuer as string) || "";
    case "languages": return (item.proficiency as string) || "";
    case "volunteer": return (item.organization as string) || "";
    case "projects": return ((item.keywords as string[]) || []).join(", ");
    case "awards": return (item.issuer as string) || "";
    case "publications": return (item.publisher as string) || "";
    case "interests": return ((item.keywords as string[]) || []).join(", ");
    case "references": return (item.relationship as string) || "";
    default: return "";
  }
}

// =============================================================================
// Props
// =============================================================================

interface ResumeLeftPanelProps {
  onStartOver: () => void;
  onOpenDesign: () => void;
}

// =============================================================================
// Component
// =============================================================================

export default function ResumeLeftPanel({ onStartOver, onOpenDesign }: ResumeLeftPanelProps) {
  const resume = useResumeEditor((s) => s.resume);
  const updateResume = useResumeEditor((s) => s.updateResume);
  const addSectionItem = useResumeEditor((s) => s.addSectionItem);
  const toggleSectionVisibility = useResumeEditor((s) => s.toggleSectionVisibility);
  const addCustomSection = useResumeEditor((s) => s.addCustomSection);

  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(["basics", "summary"])
  );

  // Import dialog
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleExpanded = useCallback((key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Hidden items count for each section
  const getHiddenCount = useCallback(
    (key: string) => {
      const section = (resume.sections as Record<string, { items?: Array<{ hidden?: boolean }> }>)[key];
      if (!section?.items) return 0;
      return section.items.filter((i) => i.hidden).length;
    },
    [resume.sections]
  );

  // ── Import resume from file ──
  const handleFileImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Support JSON import
      if (file.name.endsWith(".json")) {
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          if (data.basics && data.sections) {
            updateResume((draft) => {
              Object.assign(draft, data);
            });
          }
        } catch {
          // Invalid JSON
        }
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
      setShowImport(false);
    },
    [updateResume]
  );

  // ── Add new item to a list section ──
  const handleAddItem = useCallback(
    (sectionKey: string) => {
      const id = createItemId();
      addSectionItem(sectionKey, { id });
    },
    [addSectionItem]
  );

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-3 space-y-1.5">
        {/* ── Import / Actions strip ── */}
        <div className="flex items-center gap-1.5 mb-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700/50 rounded-md border border-gray-700/30 transition-colors"
          >
            <SIcon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            Import
          </button>
          <button
            onClick={onOpenDesign}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-700/50 rounded-md border border-gray-700/30 transition-colors lg:hidden"
          >
            <SIcon d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
            Design
          </button>
          <div className="flex-1" />
          <button
            onClick={onStartOver}
            className="flex items-center gap-1 px-2 py-1.5 text-[11px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
          >
            <SIcon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            Clear
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileImport}
          />
        </div>

        {/* ── Section editors ── */}
        {SECTION_ORDER.map((meta) => {
          const isExpanded = expandedSections.has(meta.key);
          const section = (resume.sections as Record<string, { hidden?: boolean; items?: unknown[]; title?: string }>)[meta.key];
          const isHidden = section?.hidden ?? false;
          const itemCount = section?.items?.length ?? 0;
          const hiddenCount = meta.type === "list" ? getHiddenCount(meta.key) : 0;

          return (
            <div
              key={meta.key}
              className={`rounded-lg border transition-colors ${
                isHidden
                  ? "border-gray-800/20 opacity-50"
                  : "border-gray-700/30 bg-gray-800/20"
              }`}
            >
              {/* Section header */}
              <button
                onClick={() => toggleExpanded(meta.key)}
                className="flex items-center w-full px-3 py-2.5 text-left group"
              >
                <SIcon
                  d={meta.icon}
                />
                <span className="text-[13px] font-medium text-gray-200 flex-1">
                  {section?.title || meta.label}
                </span>

                {/* Item count badge */}
                {meta.type === "list" && itemCount > 0 && (
                  <span className="text-[10px] text-gray-500 bg-gray-700/40 px-1.5 py-0.5 rounded-full mr-2">
                    {itemCount}
                    {hiddenCount > 0 && (
                      <span className="text-yellow-500/60"> ({hiddenCount} hidden)</span>
                    )}
                  </span>
                )}

                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionVisibility(meta.key);
                  }}
                  title={isHidden ? "Show section" : "Hide section"}
                  className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {isHidden ? (
                    <SIcon d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <SIcon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </button>

                {/* Expand chevron */}
                <SIcon
                  d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
                />
              </button>

              {/* Section body */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-700/20">
                  {meta.type === "basics" && <BasicsSection />}
                  {meta.type === "summary" && <SummarySection />}
                  {meta.type === "list" && (
                    <ListSection
                      sectionKey={meta.key as BuiltInSectionId}
                      fields={SECTION_FIELDS[meta.key] || []}
                      getItemLabel={(item) => getItemLabel(meta.key, item)}
                      getItemSubLabel={(item) => getItemSubLabel(meta.key, item)}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Custom Sections ── */}
        {resume.customSections.map((cs) => (
          <div
            key={cs.id}
            className="rounded-lg border border-gray-700/30 bg-gray-800/20"
          >
            <button
              onClick={() => toggleExpanded(cs.id)}
              className="flex items-center w-full px-3 py-2.5 text-left"
            >
              <SIcon
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
              <span className="text-[13px] font-medium text-gray-200 flex-1">
                {cs.title}
              </span>
              <span className="text-[10px] text-gray-500 bg-gray-700/40 px-1.5 py-0.5 rounded-full mr-2">
                {cs.items.length}
              </span>
              <SIcon
                d={expandedSections.has(cs.id) ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
              />
            </button>
            {expandedSections.has(cs.id) && (
              <div className="px-3 pb-3 border-t border-gray-700/20">
                <ListSection
                  sectionKey={cs.id}
                  fields={[
                    { key: "title", label: "Title", type: "text", placeholder: "Title" },
                    { key: "subtitle", label: "Subtitle", type: "text", placeholder: "Subtitle" },
                    { key: "date", label: "Date", type: "text", placeholder: "Date" },
                    { key: "url", label: "URL", type: "text", placeholder: "https://..." },
                    { key: "description", label: "Description", type: "textarea", placeholder: "Description...", colSpan: 2 },
                  ]}
                  getItemLabel={(item) => (item.title as string) || "New Item"}
                  getItemSubLabel={(item) => (item.subtitle as string) || ""}
                  isCustom
                />
              </div>
            )}
          </div>
        ))}

        {/* ── Add Custom Section ── */}
        <button
          onClick={() => addCustomSection("Custom Section")}
          className="flex items-center justify-center gap-2 w-full py-2.5 text-[12px] text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 rounded-lg border border-dashed border-gray-700/30 hover:border-gray-600/40 transition-colors"
        >
          <SIcon d="M12 4v16m8-8H4" />
          Add Custom Section
        </button>

        {/* Spacer */}
        <div className="h-16" />
      </div>
    </div>
  );
}
