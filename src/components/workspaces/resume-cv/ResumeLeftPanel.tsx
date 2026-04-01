// =============================================================================
// Resume & CV — Left Panel (Section Editors)
// Accordion-based panel with all 14 sections (basics, summary, 12 list sections)
// + custom sections + import/clear controls.
// =============================================================================

"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import type { SectionKey } from "@/lib/resume/schema";
import { SECTION_META } from "@/lib/resume/schema";
import { AccordionSection, Icons, SIcon, FormInput, ConfirmDialog } from "@/components/workspaces/shared/WorkspaceUIKit";
import BasicsSection from "./sections/BasicsSection";
import SummarySection from "./sections/SummarySection";
import ListSection from "./sections/ListSection";

// ---------------------------------------------------------------------------
// Section icons (inline SVGs for each section)
// ---------------------------------------------------------------------------

const SECTION_ICONS: Record<string, React.ReactNode> = {
  basics: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 12 0v1" /></svg>,
  summary: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
  profiles: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
  experience: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 3h-8v4h8z" /></svg>,
  education: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" /></svg>,
  skills: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  languages: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l6 6" /><path d="M4 14l6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>,
  projects: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2z" /></svg>,
  awards: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" /></svg>,
  certifications: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15l-2 5 2-1 2 1-2-5z" /><circle cx="12" cy="9" r="6" /><path d="M9 3.6A9 9 0 0 0 3 12a9 9 0 0 0 9 9 9 9 0 0 0 9-9A9 9 0 0 0 15 3.6" /></svg>,
  publications: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
  volunteer: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  references: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  interests: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>,
  custom: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v8M8 12h8" /></svg>,
};

// ---------------------------------------------------------------------------
// Section order (Reactive Resume style)
// ---------------------------------------------------------------------------

const SECTION_ORDER: Array<"basics" | "summary" | SectionKey> = [
  "basics", "summary", "profiles", "experience", "education", "projects",
  "skills", "languages", "interests", "awards", "certifications",
  "publications", "volunteer", "references",
];

// ---------------------------------------------------------------------------
// ResumeLeftPanel
// ---------------------------------------------------------------------------

interface ResumeLeftPanelProps {
  className?: string;
}

export default function ResumeLeftPanel({ className }: ResumeLeftPanelProps) {
  const resume = useResumeEditor((s) => s.resume);
  const resetResume = useResumeEditor((s) => s.resetResume);
  const setResume = useResumeEditor((s) => s.setResume);
  const addCustomSection = useResumeEditor((s) => s.addCustomSection);
  const removeCustomSection = useResumeEditor((s) => s.removeCustomSection);

  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(["basics", "summary"]));
  const [showClear, setShowClear] = useState(false);
  const [showCustomAdd, setShowCustomAdd] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleSection = useCallback((key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // --- Import JSON ---
  const handleImport = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const onImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (data.basics) {
            setResume(data);
          } else {
            alert("Invalid resume JSON format");
          }
        } catch {
          alert("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);
    },
    [setResume],
  );

  // --- Section badge (item count) ---
  const getSectionBadge = useCallback(
    (key: string): string | undefined => {
      if (key === "basics" || key === "summary") return undefined;
      const section = resume.sections?.[key as SectionKey];
      if (!section) return undefined;
      const count = section.items?.length ?? 0;
      return count > 0 ? String(count) : undefined;
    },
    [resume.sections],
  );

  // --- Add custom section ---
  const handleAddCustom = useCallback(() => {
    if (customTitle.trim()) {
      addCustomSection(customTitle.trim());
      setCustomTitle("");
      setShowCustomAdd(false);
    }
  }, [addCustomSection, customTitle]);

  return (
    <div className={`flex flex-col h-full ${className ?? ""}`}>
      {/* Top controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800/40">
        <button
          onClick={handleImport}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-primary-400 bg-gray-800/40 hover:bg-gray-800/60 transition-colors text-center"
        >
          Import JSON
        </button>
        <button
          onClick={() => setShowClear(true)}
          className="flex-1 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-red-400 bg-gray-800/40 hover:bg-red-900/20 transition-colors text-center"
        >
          Clear All
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={onImportFile} />
      </div>

      {/* Section accordions */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {SECTION_ORDER.map((key) => {
          const isBasics = key === "basics";
          const isSummary = key === "summary";

          return (
            <AccordionSection
              key={key}
              title={isBasics ? "Personal Details" : isSummary ? "Summary" : SECTION_META[key as SectionKey].label}
              icon={SECTION_ICONS[key] ?? SECTION_ICONS.custom}
              isOpen={openSections.has(key)}
              onToggle={() => toggleSection(key)}
              badge={getSectionBadge(key)}
            >
              {isBasics && <BasicsSection />}
              {isSummary && <SummarySection />}
              {!isBasics && !isSummary && <ListSection sectionKey={key as SectionKey} />}
            </AccordionSection>
          );
        })}

        {/* Custom sections */}
        {(resume.customSections ?? []).map((cs) => (
          <AccordionSection
            key={cs.id}
            title={cs.title}
            icon={SECTION_ICONS.custom}
            isOpen={openSections.has(cs.id)}
            onToggle={() => toggleSection(cs.id)}
            badge={cs.items.length > 0 ? String(cs.items.length) : undefined}
          >
            <div className="space-y-2">
              <p className="text-[10px] text-gray-500">Custom section — add items below</p>
              {cs.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <textarea
                    value={(item as { content?: string }).content ?? ""}
                    onChange={(e) => {
                      const updateCustom = useResumeEditor.getState().updateCustomSectionItem;
                      updateCustom(cs.id, idx, { content: e.target.value });
                    }}
                    className="flex-1 rounded-xl bg-gray-800/60 border border-gray-700/60 px-3 py-2 text-[13px] text-gray-100 placeholder-gray-600 resize-none focus:border-primary-500/50 outline-none transition-all"
                    rows={2}
                    placeholder="Content..."
                  />
                  <button
                    onClick={() => {
                      const removeCsItem = useResumeEditor.getState().removeCustomSectionItem;
                      removeCsItem(cs.id, idx);
                    }}
                    className="mt-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    {Icons.close}
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const addCsItem = useResumeEditor.getState().addCustomSectionItem;
                    addCsItem(cs.id);
                  }}
                  className="flex-1 py-1.5 rounded-lg text-[11px] text-gray-400 hover:text-primary-400 border border-dashed border-gray-700 hover:border-primary-500/40 transition-colors"
                >
                  + Add Item
                </button>
                <button
                  onClick={() => removeCustomSection(cs.id)}
                  className="py-1.5 px-3 rounded-lg text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  Delete Section
                </button>
              </div>
            </div>
          </AccordionSection>
        ))}

        {/* Add custom section */}
        <div className="px-4 py-3 border-t border-gray-800/40">
          {showCustomAdd ? (
            <div className="flex gap-2">
              <FormInput
                placeholder="Section title..."
                value={customTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTitle(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") handleAddCustom(); }}
              />
              <button onClick={handleAddCustom} className="px-3 py-1.5 rounded-lg text-[11px] bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors">Add</button>
              <button onClick={() => setShowCustomAdd(false)} className="px-2 text-gray-500 hover:text-gray-300">×</button>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomAdd(true)}
              className="w-full py-2 rounded-lg text-[11px] text-gray-500 hover:text-primary-400 border border-dashed border-gray-800 hover:border-primary-500/40 transition-colors"
            >
              + Add Custom Section
            </button>
          )}
        </div>
      </div>

      {/* Clear confirm dialog */}
      <ConfirmDialog
        open={showClear}
        title="Clear All Data"
        description="This will reset all resume content to blank. This action cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={() => { resetResume(); setShowClear(false); }}
        onCancel={() => setShowClear(false)}
      />
    </div>
  );
}
