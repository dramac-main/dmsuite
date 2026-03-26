"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";
import { useProjectStore, type Project, type Milestone } from "@/stores/projects";
import { getAllToolsFlat, type FlatTool } from "@/data/tools";
import { getIcon, IconFolder } from "@/components/icons";
import EmptyState from "@/components/dashboard/EmptyState";
import { deleteProjectData } from "@/lib/project-data";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

/** Human-readable label for the latest milestone reached */
const MILESTONE_LABELS: Record<Milestone, string> = {
  opened: "Started",
  input: "Input provided",
  content: "Content created",
  edited: "Refined",
  exported: "Complete",
};

/** Color classes for progress bar based on completion range */
function progressBarColor(progress: number): string {
  if (progress >= 100) return "bg-success";
  if (progress >= 70) return "bg-primary-500";
  if (progress >= 30) return "bg-secondary-500";
  return "bg-gray-400 dark:bg-gray-500";
}

/** Get the latest milestone label */
function latestMilestoneLabel(milestones?: Milestone[]): string {
  if (!milestones || milestones.length === 0) return "Started";
  const order: Milestone[] = ["exported", "edited", "content", "input", "opened"];
  for (const m of order) {
    if (milestones.includes(m)) return MILESTONE_LABELS[m];
  }
  return "Started";
}

export default function ActiveProjects() {
  const projects = useProjectStore((s) => s.projects);
  const removeProject = useProjectStore((s) => s.removeProject);
  const renameProject = useProjectStore((s) => s.renameProject);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const enriched = useMemo(() => {
    if (projects.length === 0) return [];
    const all = getAllToolsFlat();
    const lookup = new Map(all.map((t) => [t.id, t]));
    return projects
      .slice(0, 8)
      .map((p) => ({ ...p, tool: lookup.get(p.toolId) }))
      .filter((p): p is Project & { tool: FlatTool } => !!p.tool);
  }, [projects]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (p: Project) => {
    setEditingId(p.id);
    setEditName(p.name);
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
  };

  if (enriched.length === 0) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <IconFolder className="size-5 text-primary-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Active Projects
          </h2>
        </div>
        <EmptyState
          icon={<IconFolder className="size-7 text-gray-400 dark:text-gray-500" />}
          title="No active projects"
          description="Projects you start in tool workspaces will be tracked here. Open any tool and begin creating."
        />
      </section>
    );
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconFolder className="size-5 text-primary-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Active Projects
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </span>
          <Link
            href="/projects"
            className="text-xs text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
          >
            View all →
          </Link>
        </div>
      </div>

      {/* Project cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {enriched.map((p) => {
          const Icon = getIcon(p.tool.icon);
          return (
            <div
              key={p.id}
              className="group relative rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 backdrop-blur-sm p-4 hover:border-primary-500/30 hover:bg-gray-100 dark:hover:bg-white/8 transition-all"
            >
              {/* Remove button */}
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute top-2 right-2 size-6 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Remove project"
              >
                <svg
                  className="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="flex items-center gap-2.5 mb-3">
                <div className="size-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                  <Icon className="size-4 text-primary-500 dark:text-primary-400" />
                </div>
                <div className="min-w-0 flex-1">
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
                      className="w-full text-sm font-semibold bg-white dark:bg-gray-800 border border-primary-500/50 rounded-md px-1.5 py-0.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/30"
                      maxLength={60}
                    />
                  ) : (
                    <h3
                      className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-primary-500 transition-colors"
                      onClick={() => handleStartRename(p)}
                      title="Click to rename"
                    >
                      {p.name}
                    </h3>
                  )}
                  <p className="text-[10px] text-gray-500">{p.tool.name}</p>
                </div>
              </div>

              {/* Progress bar with milestone label */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-gray-500">
                    {latestMilestoneLabel(p.milestones)}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {p.progress}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progressBarColor(p.progress)} transition-all`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">
                  {timeAgo(p.updatedAt)}
                </span>
                <Link
                  href={`/tools/${p.tool.categoryId}/${p.toolId}?project=${p.id}`}
                  className="text-[10px] text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                >
                  Continue →
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
