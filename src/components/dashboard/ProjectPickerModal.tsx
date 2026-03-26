"use client";

import { useState, useMemo, useRef, useEffect, type ComponentType, type SVGProps } from "react";
import { useProjectStore, type Project } from "@/stores/projects";
import { IconFolder, IconSparkles } from "@/components/icons";
import { deleteProjectData } from "@/lib/project-data";

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function progressBarColor(progress: number): string {
  if (progress >= 100) return "bg-emerald-500";
  if (progress >= 70) return "bg-primary-500";
  if (progress >= 30) return "bg-secondary-500";
  return "bg-gray-400 dark:bg-gray-600";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectPickerModalProps {
  toolId: string;
  toolName: string;
  toolIcon?: ComponentType<SVGProps<SVGSVGElement>>;
  onSelect: (projectId: string) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProjectPickerModal({
  toolId,
  toolName,
  toolIcon,
  onSelect,
  onCreateNew,
  onClose,
}: ProjectPickerModalProps) {
  const projects = useProjectStore((s) => s.projects);
  const removeProject = useProjectStore((s) => s.removeProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const Icon = toolIcon ?? IconFolder;

  // Filter projects for this tool
  const toolProjects = useMemo(
    () =>
      projects
        .filter((p) => p.toolId === toolId)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [projects, toolId]
  );

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingId) {
          setEditingId(null);
        } else if (confirmDeleteId) {
          setConfirmDeleteId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, confirmDeleteId, onClose]);

  const handleStartRename = (p: Project) => {
    setEditingId(p.id);
    setEditName(p.name);
    setConfirmDeleteId(null);
  };

  const handleFinishRename = () => {
    if (editingId && editName.trim()) {
      renameProject(editingId, editName.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    removeProject(id);
    deleteProjectData(id).catch(() => {});
    setConfirmDeleteId(null);
  };

  const handleDuplicate = (p: Project) => {
    const newName = `${p.name} (Copy)`;
    duplicateProject(p.id, newName);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <div className="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <Icon className="size-5 text-primary-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {toolName}
            </h2>
            <p className="text-xs text-gray-500">
              {toolProjects.length === 0
                ? "Create your first project"
                : `${toolProjects.length} project${toolProjects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Create New button */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={onCreateNew}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-primary-500/30 hover:border-primary-500/60 bg-primary-500/5 hover:bg-primary-500/10 text-primary-600 dark:text-primary-400 transition-all group"
          >
            <div className="size-9 rounded-lg bg-primary-500/10 group-hover:bg-primary-500/20 flex items-center justify-center transition-colors">
              <IconSparkles className="size-4" />
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold">New Project</span>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Start fresh with a blank canvas
              </p>
            </div>
          </button>
        </div>

        {/* Project list */}
        {toolProjects.length > 0 && (
          <div className="px-4 pb-4 max-h-80 overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 py-2">
              Recent Projects
            </p>
            <div className="space-y-1.5">
              {toolProjects.map((p) => (
                <div
                  key={p.id}
                  className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  {/* Click to open */}
                  <button
                    onClick={() => onSelect(p.id)}
                    className="flex-1 flex items-center gap-3 min-w-0 text-left"
                  >
                    <div className="size-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                      <IconFolder className="size-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === p.id ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={handleFinishRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleFinishRename();
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-sm font-medium bg-white dark:bg-gray-800 border border-primary-500/50 rounded-lg px-2 py-0.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/30"
                          maxLength={60}
                        />
                      ) : (
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {p.name}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">
                          {timeAgo(p.updatedAt)}
                        </span>
                        <div className="flex-1 max-w-20 h-1 rounded-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progressBarColor(p.progress)} transition-all`}
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {p.progress}%
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Action buttons (visible on hover) */}
                  {editingId !== p.id && confirmDeleteId !== p.id && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {/* Rename */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartRename(p); }}
                        className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                        title="Rename"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                      </button>
                      {/* Duplicate */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(p); }}
                        className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-secondary-500 hover:bg-secondary-500/10 transition-colors"
                        title="Duplicate"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                        className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Delete confirmation */}
                  {confirmDeleteId === p.id && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-red-400">Delete?</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                        className="px-2 py-1 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {toolProjects.length === 0 && (
          <div className="px-6 pb-6 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No projects yet. Click &ldquo;New Project&rdquo; to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
