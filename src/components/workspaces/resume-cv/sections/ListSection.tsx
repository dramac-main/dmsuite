// =============================================================================
// Resume & CV — Generic List Section Editor
// Renders expandable item cards with fields tailored per section type.
// Handles: experience, education, skills, languages, projects, awards,
//   certifications, publications, volunteer, references, interests, profiles
// =============================================================================

"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import type { SectionKey } from "@/lib/resume/schema";
import { createBlankItem, SECTION_META } from "@/lib/resume/schema";
import { FormInput, FormTextarea, Icons } from "@/components/workspaces/shared/WorkspaceUIKit";

// ---------------------------------------------------------------------------
// Field definitions per section type
// ---------------------------------------------------------------------------

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "keywords" | "url" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: number; // 1 = half, 2 = full
  min?: number;
  max?: number;
}

const PROFICIENCY_OPTIONS = [
  { value: "", label: "—" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
  { value: "Expert", label: "Expert" },
];

const FLUENCY_OPTIONS = [
  { value: "", label: "—" },
  { value: "Elementary", label: "Elementary" },
  { value: "Limited Working", label: "Limited Working" },
  { value: "Professional Working", label: "Professional Working" },
  { value: "Full Professional", label: "Full Professional" },
  { value: "Native", label: "Native / Bilingual" },
];

function getFieldsForSection(sectionKey: SectionKey): FieldDef[] {
  switch (sectionKey) {
    case "experience":
      return [
        { key: "company", label: "Company", type: "text", placeholder: "Acme Inc.", colSpan: 1 },
        { key: "position", label: "Position", type: "text", placeholder: "Software Engineer", colSpan: 1 },
        { key: "location", label: "Location", type: "text", placeholder: "San Francisco, CA", colSpan: 1 },
        { key: "period", label: "Period", type: "text", placeholder: "Jan 2020 — Present", colSpan: 1 },
        { key: "website.url", label: "Website", type: "text", placeholder: "https://...", colSpan: 2 },
        { key: "description", label: "Description", type: "textarea", placeholder: "Key achievements and responsibilities...", colSpan: 2 },
      ];
    case "education":
      return [
        { key: "school", label: "School", type: "text", placeholder: "MIT", colSpan: 1 },
        { key: "degree", label: "Degree", type: "text", placeholder: "Bachelor of Science", colSpan: 1 },
        { key: "area", label: "Field of Study", type: "text", placeholder: "Computer Science", colSpan: 1 },
        { key: "grade", label: "Grade / GPA", type: "text", placeholder: "3.9", colSpan: 1 },
        { key: "location", label: "Location", type: "text", placeholder: "Cambridge, MA", colSpan: 1 },
        { key: "period", label: "Period", type: "text", placeholder: "2016 — 2020", colSpan: 1 },
        { key: "description", label: "Description", type: "textarea", placeholder: "Notable coursework, thesis, etc.", colSpan: 2 },
      ];
    case "skills":
      return [
        { key: "name", label: "Skill", type: "text", placeholder: "React", colSpan: 1 },
        { key: "proficiency", label: "Proficiency", type: "select", options: PROFICIENCY_OPTIONS, colSpan: 1 },
        { key: "level", label: "Level (0–5)", type: "number", min: 0, max: 5, colSpan: 1 },
        { key: "keywords", label: "Keywords", type: "keywords", placeholder: "Type and press Enter", colSpan: 2 },
      ];
    case "languages":
      return [
        { key: "language", label: "Language", type: "text", placeholder: "English", colSpan: 1 },
        { key: "fluency", label: "Fluency", type: "select", options: FLUENCY_OPTIONS, colSpan: 1 },
        { key: "level", label: "Level (0–5)", type: "number", min: 0, max: 5, colSpan: 1 },
      ];
    case "projects":
      return [
        { key: "name", label: "Name", type: "text", placeholder: "Project Name", colSpan: 1 },
        { key: "period", label: "Period", type: "text", placeholder: "2023 — Present", colSpan: 1 },
        { key: "website.url", label: "URL", type: "text", placeholder: "https://...", colSpan: 2 },
        { key: "description", label: "Description", type: "textarea", placeholder: "What was built and its impact...", colSpan: 2 },
      ];
    case "awards":
      return [
        { key: "title", label: "Title", type: "text", placeholder: "Best Paper Award", colSpan: 1 },
        { key: "awarder", label: "Awarder", type: "text", placeholder: "IEEE", colSpan: 1 },
        { key: "date", label: "Date", type: "text", placeholder: "2023", colSpan: 1 },
        { key: "description", label: "Description", type: "textarea", placeholder: "Details...", colSpan: 2 },
      ];
    case "certifications":
      return [
        { key: "title", label: "Certification", type: "text", placeholder: "AWS Solutions Architect", colSpan: 1 },
        { key: "issuer", label: "Issuer", type: "text", placeholder: "Amazon", colSpan: 1 },
        { key: "date", label: "Date", type: "text", placeholder: "2023", colSpan: 1 },
        { key: "description", label: "Notes", type: "textarea", placeholder: "Credential details...", colSpan: 2 },
      ];
    case "publications":
      return [
        { key: "title", label: "Title", type: "text", placeholder: "Paper Title", colSpan: 1 },
        { key: "publisher", label: "Publisher", type: "text", placeholder: "Journal / Conference", colSpan: 1 },
        { key: "date", label: "Date", type: "text", placeholder: "2023", colSpan: 1 },
        { key: "description", label: "Summary", type: "textarea", placeholder: "Brief abstract...", colSpan: 2 },
      ];
    case "volunteer":
      return [
        { key: "organization", label: "Organization", type: "text", placeholder: "Red Cross", colSpan: 1 },
        { key: "location", label: "Location", type: "text", placeholder: "New York, NY", colSpan: 1 },
        { key: "period", label: "Period", type: "text", placeholder: "2020 — 2022", colSpan: 1 },
        { key: "description", label: "Description", type: "textarea", placeholder: "Activities and impact...", colSpan: 2 },
      ];
    case "references":
      return [
        { key: "name", label: "Name", type: "text", placeholder: "Jane Smith", colSpan: 1 },
        { key: "position", label: "Position", type: "text", placeholder: "CTO at Acme Inc.", colSpan: 1 },
        { key: "phone", label: "Phone", type: "text", placeholder: "+1 (555) ...", colSpan: 1 },
        { key: "description", label: "Note / Relationship", type: "textarea", placeholder: "How you know this person...", colSpan: 2 },
      ];
    case "interests":
      return [
        { key: "name", label: "Interest", type: "text", placeholder: "Open Source", colSpan: 1 },
        { key: "keywords", label: "Details", type: "keywords", placeholder: "Type and press Enter", colSpan: 2 },
      ];
    case "profiles":
      return [
        { key: "network", label: "Network", type: "text", placeholder: "LinkedIn", colSpan: 1 },
        { key: "username", label: "Username", type: "text", placeholder: "@johndoe", colSpan: 1 },
        { key: "website.url", label: "URL", type: "text", placeholder: "https://linkedin.com/in/...", colSpan: 2 },
      ];
    default:
      return [];
  }
}

function getItemTitle(sectionKey: SectionKey, item: Record<string, unknown>): string {
  switch (sectionKey) {
    case "experience": return (item.position as string) || (item.company as string) || "Untitled";
    case "education": return (item.degree as string) || (item.school as string) || "Untitled";
    case "skills": return (item.name as string) || "Untitled";
    case "languages": return (item.language as string) || "Untitled";
    case "projects": return (item.name as string) || "Untitled";
    case "awards": return (item.title as string) || "Untitled";
    case "certifications": return (item.title as string) || "Untitled";
    case "publications": return (item.title as string) || "Untitled";
    case "volunteer": return (item.organization as string) || "Untitled";
    case "references": return (item.name as string) || "Untitled";
    case "interests": return (item.name as string) || "Untitled";
    case "profiles": return (item.network as string) || "Untitled";
    default: return "Item";
  }
}

function getItemSubtitle(sectionKey: SectionKey, item: Record<string, unknown>): string {
  switch (sectionKey) {
    case "experience": return (item.company as string) || "";
    case "education": return (item.school as string) || "";
    case "certifications": return (item.issuer as string) || "";
    case "publications": return (item.publisher as string) || "";
    case "awards": return (item.awarder as string) || "";
    case "volunteer": return (item.location as string) || "";
    case "references": return (item.position as string) || "";
    default: return "";
  }
}

// ---------------------------------------------------------------------------
// Keywords chip input
// ---------------------------------------------------------------------------

function KeywordsInput({ keywords, onChange, placeholder }: {
  keywords: string[]; onChange: (kw: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      onChange([...keywords, trimmed]);
    }
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-primary-500/10 text-primary-300 border border-primary-500/20"
          >
            {kw}
            <button
              onClick={() => onChange(keywords.filter((_, j) => j !== i))}
              className="hover:text-red-400 transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        placeholder={placeholder}
        className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 placeholder-gray-600 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nested value helpers for dotted paths (e.g., "website.url")
// ---------------------------------------------------------------------------

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split(".");
  if (parts.length === 1) return { [path]: value };
  const first = parts[0];
  const rest = parts.slice(1).join(".");
  const existing = (obj[first] ?? {}) as Record<string, unknown>;
  return { [first]: { ...existing, ...setNestedValue(existing, rest, value) } };
}

// ---------------------------------------------------------------------------
// Item Card (expandable)
// ---------------------------------------------------------------------------

function ItemCard({
  sectionKey, item, itemIndex, expanded, onToggle,
}: {
  sectionKey: SectionKey;
  item: Record<string, unknown>;
  itemIndex: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const updateItem = useResumeEditor((s) => s.updateSectionItem);
  const removeItem = useResumeEditor((s) => s.removeSectionItem);
  const fields = useMemo(() => getFieldsForSection(sectionKey), [sectionKey]);
  const title = getItemTitle(sectionKey, item);
  const subtitle = getItemSubtitle(sectionKey, item);
  const isHidden = item.hidden as boolean;

  const handleFieldChange = useCallback(
    (fieldKey: string, value: unknown) => {
      if (fieldKey.includes(".")) {
        const update = setNestedValue(item, fieldKey, value);
        updateItem(sectionKey, itemIndex, update);
      } else {
        updateItem(sectionKey, itemIndex, { [fieldKey]: value });
      }
    },
    [updateItem, sectionKey, itemIndex, item],
  );

  return (
    <div className={`border border-gray-800/60 rounded-xl overflow-hidden transition-colors ${isHidden ? "opacity-50" : ""}`}>
      {/* Header */}
      <button onClick={onToggle} className="flex items-center w-full px-3 py-2.5 hover:bg-white/2 transition-colors group text-left">
        <span className="text-gray-500 mr-2 text-[10px] font-mono w-5 text-center">{itemIndex + 1}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-gray-200 truncate">{title}</div>
          {subtitle && <div className="text-[10px] text-gray-500 truncate">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); updateItem(sectionKey, itemIndex, { hidden: !isHidden }); }}
            className="p-1 rounded hover:bg-gray-700/50 text-gray-500 hover:text-gray-300 transition-colors"
            title={isHidden ? "Show" : "Hide"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isHidden ? <><line x1="1" y1="1" x2="23" y2="23" /><path d="M17 17.13a10.72 10.72 0 0 1-5 1.37c-7 0-11-8-11-8a20.73 20.73 0 0 1 5.12-6.13" /><path d="M9.9 4.24A9 9 0 0 1 12 4c7 0 11 8 11 8a20.29 20.29 0 0 1-4.36 5.43" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeItem(sectionKey, itemIndex); }}
            className="p-1 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
            title="Remove"
          >
            {Icons.close}
          </button>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-600 transition-transform ${expanded ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Fields */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-800/40">
          <div className="grid grid-cols-2 gap-2">
            {fields.map((field) => {
              const val = getNestedValue(item, field.key);
              const span = field.colSpan === 2 ? "col-span-2" : "";

              if (field.type === "textarea") {
                return (
                  <div key={field.key} className={span}>
                    <FormTextarea
                      label={field.label}
                      placeholder={field.placeholder}
                      value={(val as string) ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange(field.key, e.target.value)}
                      rows={3}
                    />
                  </div>
                );
              }

              if (field.type === "keywords") {
                return (
                  <div key={field.key} className={span}>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5">{field.label}</label>
                    <KeywordsInput
                      keywords={(val as string[]) ?? []}
                      onChange={(kw) => handleFieldChange(field.key, kw)}
                      placeholder={field.placeholder}
                    />
                  </div>
                );
              }

              if (field.type === "select") {
                return (
                  <div key={field.key} className={span}>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5">{field.label}</label>
                    <select
                      value={(val as string) ?? ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full rounded-xl bg-gray-800/60 border border-gray-700/60 px-3.5 py-2 text-[13px] text-gray-100 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.type === "number") {
                return (
                  <div key={field.key} className={span}>
                    <FormInput
                      label={field.label}
                      type="number"
                      min={field.min} max={field.max}
                      value={String(val ?? 0)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(field.key, Number(e.target.value))}
                    />
                  </div>
                );
              }

              return (
                <div key={field.key} className={span}>
                  <FormInput
                    label={field.label}
                    placeholder={field.placeholder}
                    value={(val as string) ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange(field.key, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ListSection (used by ResumeLeftPanel)
// ---------------------------------------------------------------------------

interface ListSectionProps {
  sectionKey: SectionKey;
}

export default function ListSection({ sectionKey }: ListSectionProps) {
  const section = useResumeEditor((s) => s.resume.sections[sectionKey]);
  const addItem = useResumeEditor((s) => s.addSectionItem);
  const reorder = useResumeEditor((s) => s.reorderSectionItems);

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const items = section?.items ?? [];
  const meta = SECTION_META[sectionKey];

  const handleAdd = useCallback(() => {
    const blank = createBlankItem(sectionKey);
    addItem(sectionKey, blank);
    setExpandedIdx(items.length); // expand new item
  }, [addItem, sectionKey, items.length]);

  const handleMoveUp = useCallback(
    (idx: number) => {
      if (idx > 0) reorder(sectionKey, idx, idx - 1);
    },
    [reorder, sectionKey],
  );

  const handleMoveDown = useCallback(
    (idx: number) => {
      if (idx < items.length - 1) reorder(sectionKey, idx, idx + 1);
    },
    [reorder, sectionKey, items.length],
  );

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="text-center py-4 text-gray-600 text-[12px]">
          No {meta.label.toLowerCase()} added yet
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <div key={(item as Record<string, unknown>).id as string ?? idx} className="group">
              <div className="flex items-start gap-1">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === items.length - 1}
                    className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <ItemCard
                    sectionKey={sectionKey}
                    item={item as Record<string, unknown>}
                    itemIndex={idx}
                    expanded={expandedIdx === idx}
                    onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleAdd}
        className="w-full py-2 rounded-xl border border-dashed border-gray-700 hover:border-primary-500/50 text-[12px] text-gray-400 hover:text-primary-400 transition-colors flex items-center justify-center gap-1.5"
      >
        <span className="text-lg leading-none">+</span>
        Add {meta.label.replace(/s$/, "")}
      </button>
    </div>
  );
}
