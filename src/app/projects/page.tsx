"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useProjectStore, type Project, type Milestone } from "@/stores/projects";
import { getAllToolsFlat, type FlatTool } from "@/data/tools";
import { deleteProjectData, getStorageUsage } from "@/lib/project-data";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { useSidebarStore } from "@/stores/sidebar";
import {
  sidebar as sidebarConfig,
  surfaces,
  layout,
} from "@/lib/design-system";
import {
  getIcon,
  IconFolder,
  IconSearch,
  IconTrash,
  IconCopy,
  IconGrid,
  IconFilter,
  IconChevronDown,
} from "@/components/icons";
import { cn } from "@/lib/utils";

/* ── Helpers ─────────────────────────────────────────────────── */

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const MILESTONE_LABELS: Record<Milestone, string> = {
  opened: "Started",
  input: "Input provided",
  content: "Content created",
  edited: "Refined",
  exported: "Complete",
};

function progressBarColor(progress: number): string {
  if (progress >= 100) return "bg-success";
  if (progress >= 70) return "bg-primary-500";
  if (progress >= 30) return "bg-secondary-500";
  return "bg-gray-400 dark:bg-gray-500";
}

function latestMilestoneLabel(milestones?: Milestone[]): string {
  if (!milestones || milestones.length === 0) return "Started";
  const order: Milestone[] = ["exported", "edited", "content", "input", "opened"];
  for (const m of order) {
    if (milestones.includes(m)) return MILESTONE_LABELS[m];
  }
  return "Started";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Types ────────────────────────────────────────────────────── */

type SortOption = "recent" | "oldest" | "name-asc" | "name-desc" | "progress";
type ViewMode = "grid" | "list";

interface EnrichedProject extends Project {
  tool: FlatTool;
}

/* ── Inline icons ────────────────────────────────────────────── */

function IconList(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function IconSortDesc(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5h10" /><path d="M11 9h7" /><path d="M11 13h4" /><path d="M3 17l3 3 3-3" /><path d="M6 18V4" />
    </svg>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */

export default function ProjectsPage() {
  const pinned = useSidebarStore((s) => s.pinned);
  const openMobile = useSidebarStore((s) => s.openMobile);

  const projects = useProjectStore((s) => s.projects);
  const removeProject = useProjectStore((s) => s.removeProject);
  const renameProject = useProjectStore((s) => s.renameProject);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterTool, setFilterTool] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [storageBytes, setStorageBytes] = useState<number>(0);
  const editInputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Build tool lookup once
  const toolLookup = useMemo(() => {
    const all = getAllToolsFlat();
    return new Map(all.map((t) => [t.id, t]));
  }, []);

  // Get unique tool types that have projects
  const toolOptions = useMemo(() => {
    const toolIds = new Set(projects.map((p) => p.toolId));
    const opts: { id: string; name: string }[] = [];
    toolIds.forEach((id) => {
      const t = toolLookup.get(id);
      if (t) opts.push({ id, name: t.name });
    });
    return opts.sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, toolLookup]);

  // Enrich + filter + sort projects
  const filtered = useMemo(() => {
    let result: EnrichedProject[] = projects
      .map((p) => {
        const tool = toolLookup.get(p.toolId);
        return tool ? { ...p, tool } : null;
      })
      .filter((p): p is EnrichedProject => p !== null);

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tool.name.toLowerCase().includes(q) ||
          p.tool.categoryName.toLowerCase().includes(q)
      );
    }

    // Tool filter
    if (filterTool !== "all") {
      result = result.filter((p) => p.toolId === filterTool);
    }

    // Status filter
    if (filterStatus === "complete") {
      result = result.filter((p) => p.progress >= 100);
    } else if (filterStatus === "in-progress") {
      result = result.filter((p) => p.progress > 0 && p.progress < 100);
    } else if (filterStatus === "started") {
      result = result.filter((p) => p.progress <= 10);
    }

    // Sort
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case "oldest":
        result.sort((a, b) => a.updatedAt - b.updatedAt);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "progress":
        result.sort((a, b) => b.progress - a.progress);
        break;
    }

    return result;
  }, [projects, search, sortBy, filterTool, filterStatus, toolLookup]);

  // Group by tool category for stats
  const stats = useMemo(() => {
    const total = projects.length;
    const complete = projects.filter((p) => p.progress >= 100).length;
    const inProgress = projects.filter((p) => p.progress > 0 && p.progress < 100).length;
    const categories = new Set(
      projects.map((p) => toolLookup.get(p.toolId)?.categoryName).filter(Boolean)
    ).size;
    return { total, complete, inProgress, categories };
  }, [projects, toolLookup]);

  // Storage usage
  useEffect(() => {
    getStorageUsage()
      .then((usage) => setStorageBytes(usage.totalBytes))
      .catch(() => {});
  }, [projects.length]);

  // Focus edit input
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Close sort menu on outside click
  useEffect(() => {
    if (!showSortMenu) return;
    const handler = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSortMenu]);

  const handleStartRename = useCallback((p: Project) => {
    setEditingId(p.id);
    setEditName(p.name);
  }, []);

  const handleFinishRename = useCallback(() => {
    if (editingId && editName.trim()) {
      renameProject(editingId, editName.trim());
    }
    setEditingId(null);
  }, [editingId, editName, renameProject]);

  const handleDuplicate = useCallback(
    (p: Project) => {
      duplicateProject(p.id, `${p.name} (copy)`);
    },
    [duplicateProject]
  );

  const handleDelete = useCallback(
    (id: string) => {
      removeProject(id);
      deleteProjectData(id).catch(() => {});
      setDeleteConfirmId(null);
    },
    [removeProject]
  );

  const SORT_LABELS: Record<SortOption, string> = {
    recent: "Most recent",
    oldest: "Oldest first",
    "name-asc": "Name A–Z",
    "name-desc": "Name Z–A",
    progress: "Progress",
  };

  return (
    <div className={cn("min-h-dvh relative", surfaces.page, "transition-colors")}>
      {/* Ambient gradient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-primary-500/[0.04] dark:bg-primary-500/[0.06] blur-[120px]" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[60%] h-[60%] rounded-full bg-secondary-500/[0.04] dark:bg-secondary-500/[0.06] blur-[120px]" />
      </div>

      <Sidebar />

      <main
        className={cn(
          "min-h-dvh",
          sidebarConfig.transition,
          pinned ? sidebarConfig.mainMarginExpanded : sidebarConfig.mainMarginCollapsed
        )}
      >
        <div className={layout.container}>
          <TopBar onMenuClick={openMobile} title="My Projects" />

          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <IconFolder className="size-5 text-primary-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  My Projects
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  All your work across every tool — organized, searchable, always accessible.
                </p>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total Projects", value: stats.total, color: "text-primary-500" },
              { label: "In Progress", value: stats.inProgress, color: "text-secondary-500" },
              { label: "Completed", value: stats.complete, color: "text-success" },
              { label: "Storage Used", value: formatBytes(storageBytes), color: "text-gray-400" },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  "rounded-xl p-3.5 border",
                  "bg-white/60 dark:bg-white/5 backdrop-blur-sm",
                  "border-gray-200 dark:border-white/5"
                )}
              >
                <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {s.label}
                </p>
                <p className={cn("text-xl font-bold", s.color)}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Toolbar: search + filters + sort + view toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by name, tool, or category..."
                className={cn(
                  "w-full h-10 pl-9 pr-4 rounded-xl text-sm",
                  "bg-white/60 dark:bg-white/5 backdrop-blur-sm",
                  "border border-gray-200 dark:border-white/10",
                  "text-gray-900 dark:text-white placeholder:text-gray-400",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50",
                  "transition-all"
                )}
              />
            </div>

            {/* Tool filter */}
            <div className="relative">
              <IconFilter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
              <select
                value={filterTool}
                onChange={(e) => setFilterTool(e.target.value)}
                className={cn(
                  "h-10 pl-8 pr-8 rounded-xl text-sm appearance-none cursor-pointer",
                  "bg-white/60 dark:bg-white/5 backdrop-blur-sm",
                  "border border-gray-200 dark:border-white/10",
                  "text-gray-700 dark:text-gray-300",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                )}
              >
                <option value="all">All tools</option>
                {toolOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <IconChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={cn(
                  "h-10 pl-3 pr-8 rounded-xl text-sm appearance-none cursor-pointer",
                  "bg-white/60 dark:bg-white/5 backdrop-blur-sm",
                  "border border-gray-200 dark:border-white/10",
                  "text-gray-700 dark:text-gray-300",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                )}
              >
                <option value="all">All statuses</option>
                <option value="in-progress">In progress</option>
                <option value="complete">Complete</option>
                <option value="started">Just started</option>
              </select>
              <IconChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort dropdown */}
            <div className="relative" ref={sortMenuRef}>
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className={cn(
                  "h-10 px-3 rounded-xl text-sm flex items-center gap-2",
                  "bg-white/60 dark:bg-white/5 backdrop-blur-sm",
                  "border border-gray-200 dark:border-white/10",
                  "text-gray-700 dark:text-gray-300",
                  "hover:border-primary-500/30 transition-all"
                )}
              >
                <IconSortDesc className="size-4" />
                <span className="hidden sm:inline">{SORT_LABELS[sortBy]}</span>
                <IconChevronDown className="size-3" />
              </button>
              {showSortMenu && (
                <div className={cn(
                  "absolute right-0 top-full mt-1 z-20 w-44 rounded-xl py-1 shadow-xl",
                  "bg-white dark:bg-gray-800 border",
                  "border-gray-200 dark:border-white/10"
                )}>
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm transition-colors",
                        sortBy === key
                          ? "text-primary-500 bg-primary-500/10"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className={cn(
              "flex items-center rounded-xl overflow-hidden border",
              "border-gray-200 dark:border-white/10"
            )}>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-10 w-10 flex items-center justify-center transition-colors",
                  viewMode === "grid"
                    ? "bg-primary-500/10 text-primary-500"
                    : "bg-white/60 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                )}
                aria-label="Grid view"
              >
                <IconGrid className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "h-10 w-10 flex items-center justify-center transition-colors",
                  viewMode === "list"
                    ? "bg-primary-500/10 text-primary-500"
                    : "bg-white/60 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                )}
                aria-label="List view"
              >
                <IconList className="size-4" />
              </button>
            </div>
          </div>

          {/* Result count */}
          {search || filterTool !== "all" || filterStatus !== "all" ? (
            <p className="text-xs text-gray-400 mb-4">
              {filtered.length} project{filtered.length !== 1 ? "s" : ""} found
              {search && <span> for &ldquo;{search}&rdquo;</span>}
            </p>
          ) : null}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className={cn(
              "flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed",
              "border-gray-300 dark:border-white/10",
              "bg-white/30 dark:bg-white/[0.02]"
            )}>
              <IconFolder className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              {projects.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    No projects yet
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center max-w-md">
                    Start creating in any tool and your projects will appear here automatically.
                    Every document, design, and creation — all in one place.
                  </p>
                  <Link
                    href="/dashboard"
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                      "bg-primary-500 text-white hover:bg-primary-600",
                      "shadow-lg shadow-primary-500/25"
                    )}
                  >
                    Explore Tools
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    No matching projects
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Try adjusting your search or filters.
                  </p>
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilterTool("all");
                      setFilterStatus("all");
                    }}
                    className="text-sm text-primary-500 hover:text-primary-400 font-medium transition-colors"
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Grid View ──────────────────────────────────────── */}
          {filtered.length > 0 && viewMode === "grid" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProjectGridCard
                  key={p.id}
                  project={p}
                  isEditing={editingId === p.id}
                  editName={editName}
                  editInputRef={editingId === p.id ? editInputRef : undefined}
                  deleteConfirmId={deleteConfirmId}
                  onStartRename={handleStartRename}
                  onEditNameChange={setEditName}
                  onFinishRename={handleFinishRename}
                  onCancelRename={() => setEditingId(null)}
                  onDuplicate={handleDuplicate}
                  onRequestDelete={setDeleteConfirmId}
                  onConfirmDelete={handleDelete}
                  onCancelDelete={() => setDeleteConfirmId(null)}
                />
              ))}
            </div>
          )}

          {/* ── List View ──────────────────────────────────────── */}
          {filtered.length > 0 && viewMode === "list" && (
            <div className={cn(
              "rounded-xl border overflow-hidden",
              "border-gray-200 dark:border-white/5",
              "bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm"
            )}>
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_140px_100px_100px_80px_100px] gap-4 px-4 py-2.5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-white/5">
                <span>Project</span>
                <span>Tool</span>
                <span>Status</span>
                <span>Progress</span>
                <span>Updated</span>
                <span className="text-right">Actions</span>
              </div>
              {filtered.map((p) => (
                <ProjectListRow
                  key={p.id}
                  project={p}
                  isEditing={editingId === p.id}
                  editName={editName}
                  editInputRef={editingId === p.id ? editInputRef : undefined}
                  deleteConfirmId={deleteConfirmId}
                  onStartRename={handleStartRename}
                  onEditNameChange={setEditName}
                  onFinishRename={handleFinishRename}
                  onCancelRename={() => setEditingId(null)}
                  onDuplicate={handleDuplicate}
                  onRequestDelete={setDeleteConfirmId}
                  onConfirmDelete={handleDelete}
                  onCancelDelete={() => setDeleteConfirmId(null)}
                />
              ))}
            </div>
          )}

          {/* Bottom spacer */}
          <div className="h-16" />
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Grid Card Component
   ═══════════════════════════════════════════════════════════════ */

interface ProjectCardProps {
  project: EnrichedProject;
  isEditing: boolean;
  editName: string;
  editInputRef?: React.Ref<HTMLInputElement>;
  deleteConfirmId: string | null;
  onStartRename: (p: Project) => void;
  onEditNameChange: (name: string) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;
  onDuplicate: (p: Project) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

function ProjectGridCard({
  project: p,
  isEditing,
  editName,
  editInputRef,
  deleteConfirmId,
  onStartRename,
  onEditNameChange,
  onFinishRename,
  onCancelRename,
  onDuplicate,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: ProjectCardProps) {
  const Icon = getIcon(p.tool.icon);
  const isDeleting = deleteConfirmId === p.id;

  return (
    <div className={cn(
      "group relative rounded-xl border p-4 transition-all",
      "bg-white/60 dark:bg-white/5 backdrop-blur-sm",
      "border-gray-200 dark:border-white/5",
      "hover:border-primary-500/30 hover:bg-gray-50 dark:hover:bg-white/8",
      "hover:shadow-lg hover:shadow-primary-500/5"
    )}>
      {/* Delete confirmation overlay */}
      {isDeleting && (
        <div className="absolute inset-0 z-10 rounded-xl bg-red-500/5 dark:bg-red-500/10 backdrop-blur-sm border border-red-500/30 flex flex-col items-center justify-center gap-3 p-4">
          <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">
            Delete &ldquo;{p.name}&rdquo;?
          </p>
          <p className="text-xs text-gray-500 text-center">
            This will permanently remove the project and all its data.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onConfirmDelete(p.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onCancelDelete}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons (top-right) */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onDuplicate(p)}
          className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-secondary-500 hover:bg-secondary-500/10 transition-colors"
          title="Duplicate"
        >
          <IconCopy className="size-3.5" />
        </button>
        <button
          onClick={() => onRequestDelete(p.id)}
          className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete"
        >
          <IconTrash className="size-3.5" />
        </button>
      </div>

      {/* Tool icon + project name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="size-9 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
          <Icon className="size-4.5 text-primary-500 dark:text-primary-400" />
        </div>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onBlur={onFinishRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") onFinishRename();
                if (e.key === "Escape") onCancelRename();
              }}
              className="w-full text-sm font-semibold bg-white dark:bg-gray-800 border border-primary-500/50 rounded-lg px-2 py-1 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/30"
              maxLength={60}
            />
          ) : (
            <h3
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-primary-500 transition-colors"
              onClick={() => onStartRename(p)}
              title="Click to rename"
            >
              {p.name}
            </h3>
          )}
          <p className="text-[10px] text-gray-500 truncate">
            {p.tool.name} &middot; {p.tool.categoryName}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-gray-500">
            {latestMilestoneLabel(p.milestones)}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            {p.progress}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", progressBarColor(p.progress))}
            style={{ width: `${p.progress}%` }}
          />
        </div>
      </div>

      {/* Footer: dates + continue */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] text-gray-500">{timeAgo(p.updatedAt)}</p>
          <p className="text-[9px] text-gray-400">Created {formatDate(p.createdAt)}</p>
        </div>
        <Link
          href={`/tools/${p.tool.categoryId}/${p.toolId}?project=${p.id}`}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            "bg-primary-500/10 text-primary-500 dark:text-primary-400",
            "hover:bg-primary-500 hover:text-white",
            "shadow-sm hover:shadow-md hover:shadow-primary-500/20"
          )}
        >
          Open
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   List Row Component
   ═══════════════════════════════════════════════════════════════ */

function ProjectListRow({
  project: p,
  isEditing,
  editName,
  editInputRef,
  deleteConfirmId,
  onStartRename,
  onEditNameChange,
  onFinishRename,
  onCancelRename,
  onDuplicate,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: ProjectCardProps) {
  const Icon = getIcon(p.tool.icon);
  const isDeleting = deleteConfirmId === p.id;

  if (isDeleting) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/5 bg-red-500/5 dark:bg-red-500/10">
        <p className="text-sm text-red-600 dark:text-red-400">
          Delete &ldquo;{p.name}&rdquo;? This cannot be undone.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onConfirmDelete(p.id)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onCancelDelete}
            className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_100px_80px_100px] gap-2 sm:gap-4 items-center px-4 py-3 border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
      {/* Project name + tool icon */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-primary-500 dark:text-primary-400" />
        </div>
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              ref={editInputRef}
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onBlur={onFinishRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") onFinishRename();
                if (e.key === "Escape") onCancelRename();
              }}
              className="w-full text-sm font-medium bg-white dark:bg-gray-800 border border-primary-500/50 rounded-md px-2 py-0.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/30"
              maxLength={60}
            />
          ) : (
            <span
              className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block cursor-pointer hover:text-primary-500 transition-colors"
              onClick={() => onStartRename(p)}
              title="Click to rename"
            >
              {p.name}
            </span>
          )}
        </div>
      </div>

      {/* Tool */}
      <span className="text-xs text-gray-500 truncate hidden sm:block">
        {p.tool.name}
      </span>

      {/* Status */}
      <span className="hidden sm:block">
        <span className={cn(
          "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
          p.progress >= 100
            ? "bg-success/10 text-success"
            : p.progress > 10
              ? "bg-secondary-500/10 text-secondary-500"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500"
        )}>
          <span className={cn(
            "size-1.5 rounded-full",
            p.progress >= 100 ? "bg-success" : p.progress > 10 ? "bg-secondary-500" : "bg-gray-400"
          )} />
          {latestMilestoneLabel(p.milestones)}
        </span>
      </span>

      {/* Progress */}
      <div className="hidden sm:block">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700/50 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", progressBarColor(p.progress))}
              style={{ width: `${p.progress}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-mono w-7 text-right">
            {p.progress}%
          </span>
        </div>
      </div>

      {/* Updated */}
      <span className="text-[10px] text-gray-400 hidden sm:block">
        {timeAgo(p.updatedAt)}
      </span>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => onDuplicate(p)}
          className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-secondary-500 hover:bg-secondary-500/10 opacity-0 group-hover:opacity-100 transition-all"
          title="Duplicate"
        >
          <IconCopy className="size-3.5" />
        </button>
        <button
          onClick={() => onRequestDelete(p.id)}
          className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
          title="Delete"
        >
          <IconTrash className="size-3.5" />
        </button>
        <Link
          href={`/tools/${p.tool.categoryId}/${p.toolId}?project=${p.id}`}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
            "text-primary-500 dark:text-primary-400",
            "hover:bg-primary-500/10"
          )}
        >
          Open →
        </Link>
      </div>
    </div>
  );
}
