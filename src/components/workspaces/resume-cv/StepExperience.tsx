// =============================================================================
// DMSuite — Resume Step 3: Experience
// Dynamic experience entries with add/remove/reorder via @dnd-kit.
// =============================================================================

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeCVWizard } from "@/stores/resume-cv-wizard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ExperienceEntry } from "@/stores/resume-cv-wizard";

// ── Inline SVG Icons ──

function IconBriefcase({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
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

function IconGripVertical({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" />
    </svg>
  );
}

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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
// Sortable Experience Card
// ---------------------------------------------------------------------------

function SortableExperienceCard({
  entry,
  onUpdate,
  onRemove,
}: {
  entry: ExperienceEntry;
  onUpdate: (data: Partial<ExperienceEntry>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const title =
    entry.position || entry.company
      ? `${entry.position}${entry.position && entry.company ? " at " : ""}${entry.company}`
      : "New Experience";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg border border-gray-700/60 bg-gray-800/40"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-700/40">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing shrink-0"
          aria-label="Drag to reorder"
        >
          <IconGripVertical />
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm font-medium text-gray-300 truncate"
        >
          {title}
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-500 hover:text-gray-300 transition-transform"
        >
          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <IconChevronDown />
          </motion.div>
        </button>
        <button
          onClick={onRemove}
          className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
          aria-label="Remove experience"
        >
          <IconTrash />
        </button>
      </div>

      {/* Collapsible fields */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={entry.company}
                  onChange={(e) => onUpdate({ company: e.target.value })}
                  placeholder="Company name"
                  className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
                />
                <input
                  value={entry.position}
                  onChange={(e) => onUpdate({ position: e.target.value })}
                  placeholder="Position / Title"
                  className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
                <input
                  value={entry.startDate}
                  onChange={(e) => onUpdate({ startDate: e.target.value })}
                  placeholder="Start (e.g., Jan 2022)"
                  className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60"
                />
                <input
                  value={entry.endDate}
                  onChange={(e) => onUpdate({ endDate: e.target.value })}
                  placeholder="End (or Present)"
                  disabled={entry.isCurrent}
                  className="rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60 disabled:opacity-40"
                />
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entry.isCurrent}
                    onChange={(e) =>
                      onUpdate({
                        isCurrent: e.target.checked,
                        endDate: e.target.checked ? "Present" : "",
                      })
                    }
                    className="rounded border-gray-600 bg-gray-800 text-primary-500 focus:ring-primary-500/30"
                  />
                  Current role
                </label>
              </div>
              <textarea
                value={entry.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Key responsibilities and achievements (use bullet points)..."
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-primary-500/60 resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step Component
// ---------------------------------------------------------------------------

export default function StepExperience() {
  const {
    experiences,
    addExperience,
    updateExperience,
    removeExperience,
    reorderExperiences,
    nextStep,
    prevStep,
  } = useResumeCVWizard();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = experiences.findIndex((e) => e.id === active.id);
    const newIndex = experiences.findIndex((e) => e.id === over.id);
    const reordered = arrayMove(
      experiences.map((e) => e.id),
      oldIndex,
      newIndex
    );
    reorderExperiences(reordered);
  }

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
          <IconBriefcase />
        </div>
        <h2 className="text-xl font-semibold text-white">Work Experience</h2>
        <p className="text-sm text-gray-400 mt-1">
          Add your relevant work experience. Drag to reorder by importance.
        </p>
      </motion.div>

      {/* Experience list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={experiences.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {experiences.map((entry) => (
                <SortableExperienceCard
                  key={entry.id}
                  entry={entry}
                  onUpdate={(data) => updateExperience(entry.id, data)}
                  onRemove={() => removeExperience(entry.id)}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {/* Add button */}
        <button
          onClick={addExperience}
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-gray-700 py-3 text-sm text-gray-500 transition-colors hover:border-primary-500/40 hover:text-primary-400"
        >
          <IconPlus />
          Add Experience
        </button>

        {experiences.length === 0 && (
          <p className="text-center text-xs text-gray-600 mt-2">
            No experience added yet. You can skip this step and add later.
          </p>
        )}
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
