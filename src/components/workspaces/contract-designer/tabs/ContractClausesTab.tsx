// =============================================================================
// DMSuite — Contract Clauses Tab
// Clause library with toggle, reorder, edit, add, and remove.
// =============================================================================

"use client";

import React, { useState, useCallback } from "react";
import { useContractEditor } from "@/stores/contract-editor";
import {
  CLAUSE_CATEGORIES,
  CLAUSE_CATEGORY_LABELS,
  type ClauseCategory,
} from "@/lib/contract/schema";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  FormSelect,
  ActionButton,
  EmptyState,
  SIcon,
  InfoBadge,
} from "@/components/workspaces/shared/WorkspaceUIKit";

const icons = {
  clauses: <SIcon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  add: <SIcon d="M12 6v6m0 0v6m0-6h6m-6 0H6" />,
};

export default function ContractClausesTab() {
  const form = useContractEditor((s) => s.form);
  const updateClause = useContractEditor((s) => s.updateClause);
  const toggleClause = useContractEditor((s) => s.toggleClause);
  const addClause = useContractEditor((s) => s.addClause);
  const removeClause = useContractEditor((s) => s.removeClause);
  const reorderClauses = useContractEditor((s) => s.reorderClauses);
  const resetClauses = useContractEditor((s) => s.resetClauses);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    library: true,
    add: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<ClauseCategory>("general");

  const toggle = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const enabledCount = form.clauses.filter((c) => c.enabled).length;

  const handleAdd = useCallback(() => {
    if (!newTitle.trim() || !newContent.trim()) return;
    addClause(newTitle.trim(), newContent.trim(), newCategory);
    setNewTitle("");
    setNewContent("");
    setNewCategory("general");
    setOpenSections((p) => ({ ...p, add: false }));
  }, [newTitle, newContent, newCategory, addClause]);

  const moveUp = useCallback((index: number) => {
    if (index > 0) reorderClauses(index, index - 1);
  }, [reorderClauses]);

  const moveDown = useCallback((index: number) => {
    if (index < form.clauses.length - 1) reorderClauses(index, index + 1);
  }, [reorderClauses, form.clauses.length]);

  return (
    <div>
      {/* Clause Library */}
      <AccordionSection
        title="Clause Library"
        icon={icons.clauses}
        isOpen={openSections.library}
        onToggle={() => toggle("library")}
        badge={`${enabledCount}/${form.clauses.length}`}
      >
        {form.clauses.length === 0 ? (
          <EmptyState
            title="No clauses"
            description="Add clauses to your contract using the section below"
          />
        ) : (
          <div className="space-y-1.5">
            {form.clauses.map((clause, index) => {
              const isEditing = editingId === clause.id;

              return (
                <div key={clause.id} className={`rounded-xl border transition-all ${
                  clause.enabled
                    ? "border-gray-700/40 bg-gray-800/30"
                    : "border-gray-800/30 bg-gray-900/20 opacity-50"
                }`}>
                  {/* Clause header row */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleClause(clause.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        clause.enabled
                          ? "border-primary-500 bg-primary-500"
                          : "border-gray-600 bg-transparent hover:border-gray-500"
                      }`}
                    >
                      {clause.enabled && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-950">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    {/* Title + category */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-gray-200 truncate">
                        <span className="text-primary-500/70 mr-1">{index + 1}.</span>
                        {clause.title}
                      </div>
                    </div>

                    {/* Category badge */}
                    <InfoBadge variant="muted">
                      {CLAUSE_CATEGORY_LABELS[clause.category] ?? clause.category}
                    </InfoBadge>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                        title="Move up"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === form.clauses.length - 1}
                        className="p-1 text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                        title="Move down"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                      </button>
                      <button
                        onClick={() => setEditingId(isEditing ? null : clause.id)}
                        className={`p-1 transition-colors ${isEditing ? "text-primary-400" : "text-gray-600 hover:text-gray-300"}`}
                        title="Edit"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeClause(clause.id)}
                        className="p-1 text-gray-600 hover:text-error transition-colors"
                        title="Remove"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Inline editor */}
                  {isEditing && (
                    <div className="px-3 pb-3 space-y-2 border-t border-gray-800/40 mt-1 pt-2">
                      <FormInput
                        label="Title"
                        value={clause.title}
                        onChange={(e) => updateClause(clause.id, { title: e.target.value })}
                      />
                      <FormTextarea
                        label="Content"
                        value={clause.content}
                        onChange={(e) => updateClause(clause.id, { content: e.target.value })}
                        rows={4}
                      />
                      <FormSelect
                        label="Category"
                        value={clause.category}
                        onChange={(e) => updateClause(clause.id, { category: e.target.value as ClauseCategory })}
                      >
                        {CLAUSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{CLAUSE_CATEGORY_LABELS[cat]}</option>
                        ))}
                      </FormSelect>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Reset clauses button */}
            <div className="pt-2">
              <button
                onClick={resetClauses}
                className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
              >
                Reset to default clauses
              </button>
            </div>
          </div>
        )}
      </AccordionSection>

      {/* Add Custom Clause */}
      <AccordionSection
        title="Add Custom Clause"
        icon={icons.add}
        isOpen={openSections.add}
        onToggle={() => toggle("add")}
      >
        <div className="space-y-3">
          <FormInput
            label="Clause Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Data Protection"
          />
          <FormTextarea
            label="Clause Content"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            placeholder="Enter the legal text for this clause..."
          />
          <FormSelect
            label="Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as ClauseCategory)}
          >
            {CLAUSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{CLAUSE_CATEGORY_LABELS[cat]}</option>
            ))}
          </FormSelect>
          <ActionButton
            variant="primary"
            size="md"
            onClick={handleAdd}
            disabled={!newTitle.trim() || !newContent.trim()}
            className="w-full"
          >
            Add Clause
          </ActionButton>
        </div>
      </AccordionSection>
    </div>
  );
}
