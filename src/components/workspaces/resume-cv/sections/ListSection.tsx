// =============================================================================
// DMSuite — List Section Editor
// Generic, reusable section editor for all list-type resume sections.
// Supports: add, edit, delete, reorder (drag), hide/show items.
// Used for: experience, education, skills, certifications, languages,
//           volunteer, projects, awards, publications, interests,
//           references, profiles, and custom sections.
// =============================================================================

"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useResumeEditor } from "@/stores/resume-editor";
import { createItemId } from "@/lib/resume/schema";
import type { FieldDef } from "../ResumeLeftPanel";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  SIcon,
  IconButton,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// =============================================================================
// Keywords Input (for skills, technologies, etc.)
// =============================================================================

function KeywordsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        const trimmed = input.trim();
        if (trimmed && !value.includes(trimmed)) {
          onChange([...value, trimmed]);
        }
        setInput("");
      } else if (e.key === "Backspace" && !input && value.length > 0) {
        onChange(value.slice(0, -1));
      }
    },
    [input, value, onChange]
  );

  const removeKeyword = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {value.map((kw, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-primary-500/10 text-primary-400 rounded-full border border-primary-500/20"
          >
            {kw}
            <button
              onClick={() => removeKeyword(i)}
              className="text-primary-400/50 hover:text-primary-400 transition-colors"
            >
              <SIcon d="M6 18L18 6M6 6l12 12" />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type and press Enter..."}
        className="w-full px-2.5 py-1.5 text-[12px] bg-gray-800/50 border border-gray-700/30 rounded-md text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-primary-500/40 transition-colors"
      />
    </div>
  );
}

// =============================================================================
// Props
// =============================================================================

interface ListSectionProps {
  sectionKey: string;
  fields: FieldDef[];
  getItemLabel: (item: Record<string, unknown>) => string;
  getItemSubLabel: (item: Record<string, unknown>) => string;
  isCustom?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export default function ListSection({
  sectionKey,
  fields,
  getItemLabel,
  getItemSubLabel,
  isCustom,
}: ListSectionProps) {
  const resume = useResumeEditor((s) => s.resume);
  const addSectionItem = useResumeEditor((s) => s.addSectionItem);
  const updateSectionItem = useResumeEditor((s) => s.updateSectionItem);
  const removeSectionItem = useResumeEditor((s) => s.removeSectionItem);
  const reorderSectionItems = useResumeEditor((s) => s.reorderSectionItems);
  const removeCustomSection = useResumeEditor((s) => s.removeCustomSection);

  // Expanded item index (-1 = none)
  const [expandedItem, setExpandedItem] = useState(-1);
  // Drag state
  const [dragIndex, setDragIndex] = useState(-1);
  const [dragOverIndex, setDragOverIndex] = useState(-1);

  // Get items
  const items: Record<string, unknown>[] = useMemo(() => {
    if (isCustom) {
      const cs = resume.customSections.find((s) => s.id === sectionKey);
      return (cs?.items ?? []) as unknown as Record<string, unknown>[];
    }
    const section = (resume.sections as Record<string, { items?: Record<string, unknown>[] }>)[sectionKey];
    return section?.items ?? [];
  }, [resume.sections, resume.customSections, sectionKey, isCustom]);

  // ── Add item ──
  const handleAdd = useCallback(() => {
    const id = createItemId();
    addSectionItem(sectionKey, { id });
    setExpandedItem(items.length); // expand the new item
  }, [addSectionItem, sectionKey, items.length]);

  // ── Update field ──
  const handleFieldChange = useCallback(
    (itemIndex: number, fieldKey: string, value: unknown) => {
      updateSectionItem(sectionKey, itemIndex, { [fieldKey]: value });
    },
    [updateSectionItem, sectionKey]
  );

  // ── Toggle item visibility ──
  const handleToggleHidden = useCallback(
    (itemIndex: number) => {
      updateSectionItem(sectionKey, itemIndex, {
        hidden: !(items[itemIndex]?.hidden ?? false),
      });
    },
    [updateSectionItem, sectionKey, items]
  );

  // ── Delete item ──
  const handleDelete = useCallback(
    (itemIndex: number) => {
      removeSectionItem(sectionKey, itemIndex);
      if (expandedItem === itemIndex) setExpandedItem(-1);
      else if (expandedItem > itemIndex) setExpandedItem(expandedItem - 1);
    },
    [removeSectionItem, sectionKey, expandedItem]
  );

  // ── Drag & drop ──
  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      setDragOverIndex(index);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (dragIndex >= 0 && dragIndex !== toIndex) {
        reorderSectionItems(sectionKey, dragIndex, toIndex);
        if (expandedItem === dragIndex) setExpandedItem(toIndex);
      }
      setDragIndex(-1);
      setDragOverIndex(-1);
    },
    [dragIndex, reorderSectionItems, sectionKey, expandedItem]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(-1);
    setDragOverIndex(-1);
  }, []);

  return (
    <div className="pt-2 space-y-1">
      {/* Items */}
      {items.map((item, index) => {
        const isExpanded = expandedItem === index;
        const isHidden = item.hidden as boolean;
        const isDragTarget = dragOverIndex === index && dragIndex !== index;

        return (
          <div
            key={(item.id as string) || index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`rounded-md border transition-all ${
              isDragTarget
                ? "border-primary-500/40 bg-primary-500/5"
                : dragIndex === index
                ? "opacity-40 border-gray-700/20"
                : isHidden
                ? "border-gray-800/20 opacity-40"
                : "border-gray-700/20 bg-gray-800/10"
            }`}
          >
            {/* Item header */}
            <div
              onClick={() => setExpandedItem(isExpanded ? -1 : index)}
              className="flex items-center gap-2 px-2.5 py-2 cursor-pointer group"
            >
              {/* Drag handle */}
              <span className="text-gray-600 cursor-grab active:cursor-grabbing">
                <SIcon d="M4 8h16M4 16h16" />
              </span>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-300 truncate">
                  {getItemLabel(item)}
                </p>
                {!isExpanded && (
                  <p className="text-[10px] text-gray-600 truncate">
                    {getItemSubLabel(item)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleHidden(index);
                  }}
                  title={isHidden ? "Show" : "Hide"}
                  className="p-1 text-gray-600 hover:text-gray-400"
                >
                  {isHidden ? (
                    <SIcon d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                  ) : (
                    <SIcon d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(index);
                  }}
                  title="Delete"
                  className="p-1 text-gray-600 hover:text-red-400"
                >
                  <SIcon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </button>
              </div>

              <SIcon
                d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
              />
            </div>

            {/* Item fields (expanded) */}
            {isExpanded && (
              <div className="px-2.5 pb-2.5 border-t border-gray-700/10">
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {fields.map((field) => {
                    const colClass = field.colSpan === 2 ? "col-span-2" : "";
                    const val = item[field.key];

                    if (field.type === "textarea") {
                      return (
                        <div key={field.key} className={colClass}>
                          <FormTextarea
                            label={field.label}
                            value={(val as string) ?? ""}
                            onChange={(e) =>
                              handleFieldChange(index, field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            rows={3}
                          />
                        </div>
                      );
                    }

                    if (field.type === "select" && field.options) {
                      return (
                        <div key={field.key} className={colClass}>
                          <FormSelect
                            label={field.label}
                            value={(val as string) ?? ""}
                            onChange={(e) =>
                              handleFieldChange(index, field.key, e.target.value)
                            }
                          >
                            {field.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </FormSelect>
                        </div>
                      );
                    }

                    if (field.type === "keywords") {
                      return (
                        <div key={field.key} className={colClass}>
                          <label className="block text-[11px] text-gray-500 mb-1">
                            {field.label}
                          </label>
                          <KeywordsInput
                            value={
                              Array.isArray(val) ? (val as string[]) : []
                            }
                            onChange={(v) =>
                              handleFieldChange(index, field.key, v)
                            }
                            placeholder={field.placeholder}
                          />
                        </div>
                      );
                    }

                    // Default: text input
                    return (
                      <div key={field.key} className={colClass}>
                        <FormInput
                          label={field.label}
                          value={(val as string) ?? ""}
                          onChange={(e) =>
                            handleFieldChange(index, field.key, e.target.value)
                          }
                          placeholder={field.placeholder}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add item + Delete section (custom only) */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-primary-400 hover:text-primary-300 bg-primary-500/5 hover:bg-primary-500/10 rounded-md border border-primary-500/20 transition-colors flex-1 justify-center"
        >
          <SIcon d="M12 4v16m8-8H4" />
          Add Item
        </button>
        {isCustom && (
          <button
            onClick={() => removeCustomSection(sectionKey)}
            className="px-2 py-1.5 text-[11px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            title="Remove section"
          >
            <SIcon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </button>
        )}
      </div>
    </div>
  );
}
