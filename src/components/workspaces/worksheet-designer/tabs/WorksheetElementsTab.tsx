// =============================================================================
// Worksheet Elements Tab — Section management + element library + per-element
// editing with type-specific controls
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import { useWorksheetEditor } from "@/stores/worksheet-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  Toggle,
  SIcon,
  ActionButton,
  RangeSlider,
  ChipGroup,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import {
  ELEMENT_CATEGORIES,
  ELEMENT_TYPE_CONFIGS,
  ELEMENT_TYPES,
} from "@/lib/worksheet/schema";
import type { ElementType, FormElement, FormElementOption, LikertStatement, MatchingPair, TableColumn } from "@/lib/worksheet/schema";

// ── Icons ──
const icons = {
  sections: <SIcon d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
  add: <SIcon d="M12 4v16m8-8H4" />,
  elements: <SIcon d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />,
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function WorksheetElementsTab() {
  const store = useWorksheetEditor();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(store.form.sections.map((s, i) => [s.id, i === 0]))
  );
  const [editingElement, setEditingElement] = useState<{ sectionId: string; elementId: string } | null>(null);
  const [showElementPalette, setShowElementPalette] = useState<string | null>(null);

  const toggleSection = (k: string) => setOpenSections((p) => ({ ...p, [k]: !p[k] }));

  // Add element to section
  const handleAddElement = useCallback((sectionId: string, type: ElementType) => {
    store.addElement(sectionId, type);
    setShowElementPalette(null);
  }, [store]);

  return (
    <div className="space-y-2">
      {/* Section Management Bar */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Sections ({store.form.sections.length})
        </span>
        <ActionButton
          size="sm"
          variant="ghost"
          icon={icons.add}
          onClick={() => store.addSection()}
        >
          Add Section
        </ActionButton>
      </div>

      {/* Sections */}
      {store.form.sections.map((section, sIdx) => (
        <AccordionSection
          key={section.id}
          title={section.title || `Section ${sIdx + 1}`}
          icon={icons.sections}
          badge={`${section.elements.length}`}
          isOpen={openSections[section.id] ?? false}
          onToggle={() => toggleSection(section.id)}
        >
          <div className="space-y-2">
            {/* Section settings */}
            <div className="space-y-2 pb-2 border-b border-gray-800/30">
              <FormInput
                label="Section Title"
                value={section.title}
                onChange={(e) => store.updateSection(section.id, { title: e.target.value })}
              />
              <FormTextarea
                label="Description"
                value={section.description ?? ""}
                onChange={(e) => store.updateSection(section.id, { description: e.target.value || undefined })}
                placeholder="Optional section description"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <ChipGroup
                  options={[
                    { value: "1", label: "1 Column" },
                    { value: "2", label: "2 Columns" },
                  ]}
                  value={String(section.columns ?? 1)}
                  onChange={(v) => store.updateSection(section.id, { columns: Number(v) as 1 | 2 })}
                  direction="horizontal"
                />
              </div>
              <div className="flex gap-2">
                <Toggle
                  label="Visible"
                  checked={section.visible}
                  onChange={() => store.toggleSectionVisibility(section.id)}
                />
              </div>
              {store.form.sections.length > 1 && (
                <div className="flex gap-1 pt-1">
                  <button
                    onClick={() => sIdx > 0 && store.reorderSections(sIdx, sIdx - 1)}
                    disabled={sIdx === 0}
                    className="text-[10px] text-gray-500 hover:text-gray-300 disabled:opacity-30 px-2 py-1 rounded border border-gray-800/40 hover:border-gray-700"
                    title="Move up"
                  >↑ Up</button>
                  <button
                    onClick={() => sIdx < store.form.sections.length - 1 && store.reorderSections(sIdx, sIdx + 1)}
                    disabled={sIdx === store.form.sections.length - 1}
                    className="text-[10px] text-gray-500 hover:text-gray-300 disabled:opacity-30 px-2 py-1 rounded border border-gray-800/40 hover:border-gray-700"
                    title="Move down"
                  >↓ Down</button>
                  <button
                    onClick={() => store.removeSection(section.id)}
                    className="text-[10px] text-red-500/70 hover:text-red-400 px-2 py-1 rounded border border-red-900/30 hover:border-red-800/50 ml-auto"
                    title="Delete section"
                  >Delete</button>
                </div>
              )}
            </div>

            {/* Elements in this section */}
            {section.elements.map((element, eIdx) => (
              <div key={element.id} className="group">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/3 transition-colors">
                  {/* Element type icon */}
                  <span className="w-3.5 h-3.5 text-gray-500 shrink-0">
                    <SIcon d={ELEMENT_TYPE_CONFIGS[element.type].icon} />
                  </span>

                  {/* Label */}
                  <span className="text-[11px] text-gray-300 truncate flex-1 cursor-pointer"
                    onClick={() => setEditingElement(
                      editingElement?.elementId === element.id ? null : { sectionId: section.id, elementId: element.id }
                    )}
                  >
                    {element.label || ELEMENT_TYPE_CONFIGS[element.type].label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => eIdx > 0 && store.reorderElement(section.id, eIdx, eIdx - 1)}
                      disabled={eIdx === 0}
                      className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 disabled:opacity-20 rounded"
                      title="Move up"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      onClick={() => eIdx < section.elements.length - 1 && store.reorderElement(section.id, eIdx, eIdx + 1)}
                      disabled={eIdx === section.elements.length - 1}
                      className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 disabled:opacity-20 rounded"
                      title="Move down"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button
                      onClick={() => store.duplicateElement(section.id, element.id)}
                      className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 rounded"
                      title="Duplicate"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    </button>
                    <button
                      onClick={() => store.removeElement(section.id, element.id)}
                      className="w-5 h-5 flex items-center justify-center text-red-500/60 hover:text-red-400 rounded"
                      title="Delete"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {/* Inline element editor */}
                {editingElement?.sectionId === section.id && editingElement?.elementId === element.id && (
                  <ElementEditor
                    sectionId={section.id}
                    element={element}
                    isEducational={store.form.documentType === "educational-worksheet"}
                    onClose={() => setEditingElement(null)}
                  />
                )}
              </div>
            ))}

            {/* Add Element */}
            {showElementPalette === section.id ? (
              <ElementPalette
                onSelect={(type) => handleAddElement(section.id, type)}
                onClose={() => setShowElementPalette(null)}
                isEducational={store.form.documentType === "educational-worksheet"}
              />
            ) : (
              <button
                onClick={() => setShowElementPalette(section.id)}
                className="w-full py-2 text-[10px] font-medium text-gray-500 hover:text-primary-400 border border-dashed border-gray-700/40 hover:border-primary-500/30 rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <SIcon d="M12 4v16m8-8H4" />
                Add Element
              </button>
            )}
          </div>
        </AccordionSection>
      ))}
    </div>
  );
}

// ━━━ Element Palette ━━━
function ElementPalette({
  onSelect, onClose, isEducational
}: {
  onSelect: (type: ElementType) => void;
  onClose: () => void;
  isEducational: boolean;
}) {
  return (
    <div className="border border-gray-700/40 rounded-lg bg-gray-900/80 p-2 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Add Element</span>
        <button onClick={onClose} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {ELEMENT_CATEGORIES.filter((cat) => isEducational || cat.key !== "educational").map((cat) => {
        const elements = ELEMENT_TYPES.filter((t) => ELEMENT_TYPE_CONFIGS[t].category === cat.key);
        if (elements.length === 0) return null;
        return (
          <div key={cat.key}>
            <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1 mb-1">{cat.label}</div>
            <div className="grid grid-cols-2 gap-1">
              {elements.map((type) => {
                const cfg = ELEMENT_TYPE_CONFIGS[type];
                return (
                  <button
                    key={type}
                    onClick={() => onSelect(type)}
                    className="flex items-center gap-1.5 px-2 py-1.5 text-left rounded-md hover:bg-primary-500/10 text-[10px] text-gray-400 hover:text-gray-200 transition-colors border border-transparent hover:border-gray-700/40"
                  >
                    <span className="w-3 h-3 shrink-0 text-gray-500"><SIcon d={cfg.icon} /></span>
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ━━━ Element Editor ━━━
function ElementEditor({
  sectionId, element, isEducational, onClose
}: {
  sectionId: string;
  element: FormElement;
  isEducational: boolean;
  onClose: () => void;
}) {
  const store = useWorksheetEditor();
  const update = (patch: Partial<FormElement>) => store.updateElement(sectionId, element.id, patch);

  return (
    <div className="ml-5 mr-1 mt-1 mb-2 p-2.5 border border-gray-700/40 rounded-lg bg-gray-900/50 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-primary-400">
          Edit: {ELEMENT_TYPE_CONFIGS[element.type].label}
        </span>
        <button onClick={onClose} className="text-[10px] text-gray-500 hover:text-gray-300">Done</button>
      </div>

      {/* Common fields */}
      <FormInput label="Label" value={element.label} onChange={(e) => update({ label: e.target.value })} />

      {element.type !== "heading" && element.type !== "paragraph" && element.type !== "divider" && element.type !== "spacer" && (
        <Toggle label="Required" checked={element.required ?? false} onChange={(v) => update({ required: v })} />
      )}

      {/* Points (educational) */}
      {isEducational && element.points !== undefined && (
        <RangeSlider label="Points" min={0} max={20} step={1} value={element.points ?? 0} onChange={(v) => update({ points: v })} />
      )}

      {/* Type-specific controls */}
      {renderTypeSpecificControls(element, update)}

      {/* Answer key content */}
      {isEducational && ["text-field", "textarea", "short-answer"].includes(element.type) && (
        <FormTextarea
          label="Answer Key Content"
          value={element.answerKeyContent ?? ""}
          onChange={(e) => update({ answerKeyContent: e.target.value })}
          placeholder="Correct answer for the answer key"
          rows={2}
        />
      )}
    </div>
  );
}

// ━━━ Type-specific Controls ━━━
function renderTypeSpecificControls(
  element: FormElement,
  update: (patch: Partial<FormElement>) => void,
): React.ReactNode {
  switch (element.type) {
    case "textarea":
    case "lined-writing":
      return (
        <RangeSlider label="Lines" min={2} max={20} step={1} value={element.lineCount ?? 4} onChange={(v) => update({ lineCount: v })} />
      );

    case "short-answer":
      return (
        <RangeSlider label="Answer Lines" min={1} max={10} step={1} value={element.answerLines ?? 3} onChange={(v) => update({ answerLines: v })} />
      );

    case "checkbox":
    case "radio-group":
    case "dropdown":
    case "multiple-choice":
      return (
        <OptionsEditor
          options={element.options ?? []}
          onChange={(opts) => update({ options: opts })}
          showCorrect={element.type === "multiple-choice" || element.type === "radio-group"}
        />
      );

    case "signature-block":
      return (
        <SignatureFieldsEditor
          fields={element.signatureFields ?? []}
          onChange={(fields) => update({ signatureFields: fields })}
        />
      );

    case "rating-scale":
      return (
        <>
          <RangeSlider label="Min" min={0} max={5} step={1} value={element.ratingMin ?? 1} onChange={(v) => update({ ratingMin: v })} />
          <RangeSlider label="Max" min={3} max={10} step={1} value={element.ratingMax ?? 5} onChange={(v) => update({ ratingMax: v })} />
          <FormInput label="Min Label" value={element.ratingLabels?.min ?? ""} onChange={(e) => update({ ratingLabels: { min: e.target.value, max: element.ratingLabels?.max ?? "" } })} />
          <FormInput label="Max Label" value={element.ratingLabels?.max ?? ""} onChange={(e) => update({ ratingLabels: { min: element.ratingLabels?.min ?? "", max: e.target.value } })} />
        </>
      );

    case "likert-scale":
      return (
        <LikertEditor
          statements={element.likertStatements ?? []}
          labels={element.likertLabels ?? []}
          onStatementsChange={(s) => update({ likertStatements: s })}
          onLabelsChange={(l) => update({ likertLabels: l })}
        />
      );

    case "table":
      return (
        <TableEditor
          columns={element.tableColumns ?? []}
          rows={element.tableRows ?? 5}
          onColumnsChange={(c) => update({ tableColumns: c })}
          onRowsChange={(r) => update({ tableRows: r })}
        />
      );

    case "matching-columns":
      return (
        <MatchingPairsEditor
          pairs={element.matchingPairs ?? []}
          onChange={(p) => update({ matchingPairs: p })}
        />
      );

    case "word-bank":
      return (
        <WordBankEditor
          words={element.words ?? []}
          onChange={(w) => update({ words: w })}
        />
      );

    case "fill-in-blank":
      return (
        <>
          <FormTextarea
            label="Sentence (use ____ for blanks)"
            value={element.sentence ?? ""}
            onChange={(e) => update({ sentence: e.target.value })}
            rows={2}
          />
          <FormInput
            label="Answers (comma-separated)"
            value={(element.answers ?? []).join(", ")}
            onChange={(e) => update({ answers: e.target.value.split(",").map((a: string) => a.trim()).filter(Boolean) })}
          />
        </>
      );

    case "math-grid":
      return (
        <>
          <RangeSlider label="Rows" min={5} max={30} step={1} value={element.gridRows ?? 10} onChange={(v) => update({ gridRows: v })} />
          <RangeSlider label="Columns" min={5} max={30} step={1} value={element.gridCols ?? 10} onChange={(v) => update({ gridCols: v })} />
          <ChipGroup
            options={[
              { value: "blank", label: "Blank" },
              { value: "numbered", label: "Numbered" },
              { value: "coordinate", label: "Coordinate" },
            ]}
            value={element.gridType ?? "blank"}
            onChange={(v) => update({ gridType: v as "blank" | "numbered" | "coordinate" })}
            direction="horizontal"
          />
        </>
      );

    case "diagram-label":
      return (
        <>
          <FormInput
            label="Caption"
            value={element.diagramImageCaption ?? ""}
            onChange={(e) => update({ diagramImageCaption: e.target.value })}
          />
          <DiagramLabelsEditor
            labels={element.diagramLabels ?? []}
            onChange={(l) => update({ diagramLabels: l })}
          />
        </>
      );

    case "true-false":
      return (
        <>
          <FormTextarea
            label="Statement"
            value={element.statement ?? ""}
            onChange={(e) => update({ statement: e.target.value })}
            rows={2}
          />
          <ChipGroup
            options={[
              { value: "true", label: "True" },
              { value: "false", label: "False" },
            ]}
            value={element.correctAnswer === true ? "true" : element.correctAnswer === false ? "false" : ""}
            onChange={(v) => update({ correctAnswer: v === "true" })}
            direction="horizontal"
          />
        </>
      );

    case "heading":
      return (
        <>
          <FormInput label="Text" value={element.content ?? ""} onChange={(e) => update({ content: e.target.value })} />
          <ChipGroup
            options={[
              { value: "1", label: "H1" },
              { value: "2", label: "H2" },
              { value: "3", label: "H3" },
            ]}
            value={String(element.headingLevel ?? 2)}
            onChange={(v) => update({ headingLevel: Number(v) as 1 | 2 | 3 })}
            direction="horizontal"
          />
        </>
      );

    case "paragraph":
      return (
        <FormTextarea label="Text" value={element.content ?? ""} onChange={(e) => update({ content: e.target.value })} rows={4} />
      );

    case "spacer":
      return (
        <RangeSlider label="Height (px)" min={8} max={80} step={4} value={element.spacerHeight ?? 20} onChange={(v) => update({ spacerHeight: v })} />
      );

    case "reading-passage":
      return (
        <>
          <FormInput label="Title" value={element.passageTitle ?? ""} onChange={(e) => update({ passageTitle: e.target.value })} />
          <FormTextarea
            label="Passage Text"
            value={element.passageText ?? ""}
            onChange={(e) => update({ passageText: e.target.value })}
            rows={6}
          />
        </>
      );

    case "numbered-list":
      return (
        <ListItemsEditor
          items={element.items ?? []}
          onChange={(items) => update({ items })}
        />
      );

    default:
      return null;
  }
}

// ━━━━━━━━ Sub-Editors ━━━━━━━━

function OptionsEditor({ options, onChange, showCorrect }: {
  options: FormElementOption[];
  onChange: (opts: FormElementOption[]) => void;
  showCorrect: boolean;
}) {
  const addOption = () => onChange([...options, { id: uid(), label: `Option ${options.length + 1}` }]);
  const removeOption = (id: string) => onChange(options.filter((o) => o.id !== id));

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-gray-400">Options</div>
      {options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-1.5">
          {showCorrect && (
            <button
              onClick={() => onChange(options.map((o) => ({ ...o, isCorrect: o.id === opt.id ? !o.isCorrect : false })))}
              className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${opt.isCorrect ? "border-primary-400 bg-primary-500" : "border-gray-600"}`}
              title="Mark as correct"
            />
          )}
          <input
            type="text"
            value={opt.label}
            onChange={(e) => onChange(options.map((o) => o.id === opt.id ? { ...o, label: e.target.value } : o))}
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-700/40 rounded px-2 py-1 text-gray-200 focus:border-primary-500/50 focus:outline-none"
          />
          <button onClick={() => removeOption(opt.id)} className="text-gray-600 hover:text-red-400 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button onClick={addOption} className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors">+ Add Option</button>
    </div>
  );
}

function SignatureFieldsEditor({ fields, onChange }: {
  fields: Array<{ id: string; role: string; showDate: boolean }>;
  onChange: (f: Array<{ id: string; role: string; showDate: boolean }>) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-gray-400">Signature Fields</div>
      {fields.map((f) => (
        <div key={f.id} className="flex items-center gap-1.5">
          <input
            type="text"
            value={f.role}
            onChange={(e) => onChange(fields.map((s) => s.id === f.id ? { ...s, role: e.target.value } : s))}
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-700/40 rounded px-2 py-1 text-gray-200 focus:border-primary-500/50 focus:outline-none"
            placeholder="Role name"
          />
          <Toggle label="Date" checked={f.showDate} onChange={(v) => onChange(fields.map((s) => s.id === f.id ? { ...s, showDate: v } : s))} />
          <button onClick={() => onChange(fields.filter((s) => s.id !== f.id))} className="text-gray-600 hover:text-red-400 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...fields, { id: uid(), role: "Signatory", showDate: true }])} className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors">+ Add Signature</button>
    </div>
  );
}

function LikertEditor({ statements, labels, onStatementsChange, onLabelsChange }: {
  statements: LikertStatement[];
  labels: string[];
  onStatementsChange: (s: LikertStatement[]) => void;
  onLabelsChange: (l: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-gray-400">Scale Labels</div>
      <div className="flex flex-wrap gap-1">
        {labels.map((label, i) => (
          <input
            key={i}
            type="text"
            value={label}
            onChange={(e) => { const nl = [...labels]; nl[i] = e.target.value; onLabelsChange(nl); }}
            className="text-[10px] bg-gray-800/50 border border-gray-700/40 rounded px-1.5 py-0.5 text-gray-200 w-20 focus:border-primary-500/50 focus:outline-none"
          />
        ))}
      </div>
      <div className="text-[10px] font-semibold text-gray-400">Statements</div>
      {statements.map((stmt) => (
        <div key={stmt.id} className="flex items-center gap-1.5">
          <input
            type="text"
            value={stmt.text}
            onChange={(e) => onStatementsChange(statements.map((s) => s.id === stmt.id ? { ...s, text: e.target.value } : s))}
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-700/40 rounded px-2 py-1 text-gray-200 focus:border-primary-500/50 focus:outline-none"
          />
          <button onClick={() => onStatementsChange(statements.filter((s) => s.id !== stmt.id))} className="text-gray-600 hover:text-red-400 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button onClick={() => onStatementsChange([...statements, { id: uid(), text: "New statement" }])} className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors">+ Add Statement</button>
    </div>
  );
}

function TableEditor({ columns, rows, onColumnsChange, onRowsChange }: {
  columns: TableColumn[];
  rows: number;
  onColumnsChange: (c: TableColumn[]) => void;
  onRowsChange: (r: number) => void;
}) {
  return (
    <div className="space-y-2">
      <RangeSlider label="Rows" min={1} max={20} step={1} value={rows} onChange={onRowsChange} />
      <div className="text-[10px] font-semibold text-gray-400">Columns</div>
      {columns.map((col) => (
        <div key={col.id} className="flex items-center gap-1.5">
          <input
            type="text"
            value={col.header}
            onChange={(e) => onColumnsChange(columns.map((c) => c.id === col.id ? { ...c, header: e.target.value } : c))}
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-700/40 rounded px-2 py-1 text-gray-200 focus:border-primary-500/50 focus:outline-none"
            placeholder="Column header"
          />
          <button onClick={() => onColumnsChange(columns.filter((c) => c.id !== col.id))} className="text-gray-600 hover:text-red-400 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button onClick={() => onColumnsChange([...columns, { id: uid(), header: `Column ${columns.length + 1}` }])} className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors">+ Add Column</button>
    </div>
  );
}

function MatchingPairsEditor({ pairs, onChange }: {
  pairs: MatchingPair[];
  onChange: (p: MatchingPair[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-gray-400">Matching Pairs</div>
      {pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-1.5">
          <input
            type="text"
            value={pair.left}
            onChange={(e) => onChange(pairs.map((p) => p.id === pair.id ? { ...p, left: e.target.value } : p))}
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-700/40 rounded px-2 py-1 text-gray-200 focus:border-primary-500/50 focus:outline-none"
            placeholder="Left item"
          />
          <span className="text-[10px] text-gray-600">→</span>
          <input
            type="text"
            value={pair.right}
            onChange={(e) => onChange(pairs.map((p) => p.id === pair.id ? { ...p, right: e.target.value } : p))}
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-700/40 rounded px-2 py-1 text-gray-200 focus:border-primary-500/50 focus:outline-none"
            placeholder="Right item"
          />
          <button onClick={() => onChange(pairs.filter((p) => p.id !== pair.id))} className="text-gray-600 hover:text-red-400 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...pairs, { id: uid(), left: "", right: "" }])} className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors">+ Add Pair</button>
    </div>
  );
}

function WordBankEditor({ words, onChange }: {
  words: string[];
  onChange: (w: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-gray-400">Words</div>
      <FormTextarea
        label=""
        value={words.join(", ")}
        onChange={(e) => onChange(e.target.value.split(",").map((w: string) => w.trim()).filter(Boolean))}
        placeholder="word1, word2, word3..."
        rows={2}
      />
    </div>
  );
}

function DiagramLabelsEditor({ labels, onChange }: {
  labels: string[];
  onChange: (l: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-gray-400">Labels</div>
      {labels.map((label, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 w-4 text-right">{i + 1}.</span>
          <input
            type="text"
            value={label}
            onChange={(e) => { const nl = [...labels]; nl[i] = e.target.value; onChange(nl); }}
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-700/40 rounded px-2 py-1 text-gray-200 focus:border-primary-500/50 focus:outline-none"
          />
          <button onClick={() => onChange(labels.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...labels, `Label ${labels.length + 1}`])} className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors">+ Add Label</button>
    </div>
  );
}

function ListItemsEditor({ items, onChange }: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-semibold text-gray-400">Items</div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-500 w-4 text-right">{i + 1}.</span>
          <input
            type="text"
            value={item}
            onChange={(e) => { const ni = [...items]; ni[i] = e.target.value; onChange(ni); }}
            className="flex-1 text-[11px] bg-gray-800/50 border border-gray-700/40 rounded px-2 py-1 text-gray-200 focus:border-primary-500/50 focus:outline-none"
          />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, `Item ${items.length + 1}`])} className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors">+ Add Item</button>
    </div>
  );
}
