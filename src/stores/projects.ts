import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deleteProjectData, duplicateProjectData } from "@/lib/project-data";
import {
  fetchUserProjects,
  createProjectRemote,
  updateProjectRemote,
  deleteProjectRemote,
  duplicateProjectDataRemote,
  type SupabaseProject,
} from "@/lib/supabase/projects";

/* ── Milestone-based progress tracking ──────────────────────── */

/** Milestone keys — each represents a concrete, verifiable stage of work */
export type Milestone = "opened" | "input" | "content" | "edited" | "exported";

/** Weight each milestone contributes to total progress (sums to 100) */
const MILESTONE_WEIGHTS: Record<Milestone, number> = {
  opened: 10,
  input: 20,
  content: 40,
  edited: 20,
  exported: 10,
};

/** Compute progress percentage from completed milestones */
export function computeProgress(milestones: Milestone[]): number {
  return milestones.reduce((sum, m) => sum + (MILESTONE_WEIGHTS[m] ?? 0), 0);
}

export interface Project {
  id: string;
  toolId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** 0–100 computed from milestones (or set explicitly for wizard tools) */
  progress: number;
  /** Completed milestone stages — drives the progress calculation */
  milestones: Milestone[];
  /** Whether this project has data saved */
  hasData?: boolean;
}

interface ProjectState {
  projects: Project[];
  /** Whether projects have been synced from Supabase in this session */
  hasSynced: boolean;
  /** Create a new project. Returns project ID. */
  addProject: (toolId: string, name: string) => string;
  updateProject: (id: string, patch: Partial<Pick<Project, "name" | "progress" | "hasData">>) => void;
  /** Rename a project (convenience wrapper) */
  renameProject: (id: string, name: string) => void;
  /** Add a milestone and recompute progress. No-op if already present. */
  addMilestone: (id: string, milestone: Milestone) => void;
  /** Remove project metadata + data (local + server) */
  removeProject: (id: string) => void;
  touchProject: (id: string) => void;
  /** Duplicate a project's metadata (caller must also duplicate data) */
  duplicateProject: (id: string, newName: string) => string | null;
  /** Get all projects for a given tool */
  getProjectsForTool: (toolId: string) => Project[];
  /** Sync projects from Supabase — merges server data into local state */
  syncFromServer: () => Promise<void>;
}

let counter = 0;
function uid() {
  return `proj-${Date.now()}-${++counter}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Convert a Supabase project row to local Project format */
function fromSupabase(sp: SupabaseProject): Project {
  return {
    id: sp.id,
    toolId: sp.tool_id,
    name: sp.name,
    createdAt: new Date(sp.created_at).getTime(),
    updatedAt: new Date(sp.updated_at).getTime(),
    progress: sp.progress,
    milestones: sp.milestones as Milestone[],
    hasData: sp.has_data,
  };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      hasSynced: false,

      addProject: (toolId, name) => {
        const id = uid();
        const milestones: Milestone[] = ["opened"];
        const progress = computeProgress(milestones);
        set((s) => ({
          projects: [
            {
              id,
              toolId,
              name,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              progress,
              milestones,
              hasData: false,
            },
            ...s.projects,
          ].slice(0, 200),
        }));
        // Async: push to Supabase (fire-and-forget — local is source of truth for UI)
        createProjectRemote({ id, toolId, name, milestones, progress }).catch(() => {});
        return id;
      },

      updateProject: (id, patch) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
          ),
        }));
        // Async: push patch to Supabase
        const remotePatch: Record<string, unknown> = {};
        if (patch.name !== undefined) remotePatch.name = patch.name;
        if (patch.progress !== undefined) remotePatch.progress = patch.progress;
        if (patch.hasData !== undefined) remotePatch.has_data = patch.hasData;
        if (Object.keys(remotePatch).length > 0) {
          updateProjectRemote(id, remotePatch as Parameters<typeof updateProjectRemote>[1]).catch(() => {});
        }
      },

      renameProject: (id, name) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        }));
        updateProjectRemote(id, { name }).catch(() => {});
      },

      addMilestone: (id, milestone) => {
        let newMilestones: Milestone[] | undefined;
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id) return p;
            if (p.milestones.includes(milestone)) return p;
            const milestones = [...p.milestones, milestone];
            newMilestones = milestones;
            return { ...p, milestones, progress: computeProgress(milestones), updatedAt: Date.now() };
          }),
        }));
        if (newMilestones) {
          updateProjectRemote(id, {
            milestones: newMilestones,
            progress: computeProgress(newMilestones),
          }).catch(() => {});
        }
      },

      removeProject: (id) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
        // Clean up IndexedDB data (local cache)
        deleteProjectData(id).catch(() => {});
        // Clean up Supabase (server — cascade deletes project_data)
        deleteProjectRemote(id).catch(() => {});
      },

      touchProject: (id) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, updatedAt: Date.now() } : p
          ),
        })),

      duplicateProject: (id, newName) => {
        const source = get().projects.find((p) => p.id === id);
        if (!source) return null;
        const newId = uid();
        const milestones = [...source.milestones];
        const progress = source.progress;
        set((s) => ({
          projects: [
            {
              id: newId,
              toolId: source.toolId,
              name: newName,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              progress,
              milestones,
              hasData: false,
            },
            ...s.projects,
          ].slice(0, 200),
        }));
        // Push project metadata to server
        createProjectRemote({ id: newId, toolId: source.toolId, name: newName, milestones, progress }).catch(() => {});
        // Duplicate IndexedDB data async (local cache)
        duplicateProjectData(id, newId)
          .then((ok) => {
            if (ok) {
              set((s) => ({
                projects: s.projects.map((p) =>
                  p.id === newId ? { ...p, hasData: true } : p
                ),
              }));
            }
          })
          .catch(() => {});
        // Duplicate server data async
        duplicateProjectDataRemote(id, newId).catch(() => {});
        return newId;
      },

      getProjectsForTool: (toolId) =>
        get().projects.filter((p) => p.toolId === toolId),

      /**
       * Sync projects from Supabase.
       * Strategy: server is authoritative. Server projects replace local by ID.
       * Local-only projects (not yet on server) get pushed up.
       */
      syncFromServer: async () => {
        if (get().hasSynced) return; // Already synced this session
        try {
          const serverProjects = await fetchUserProjects();

          if (serverProjects.length === 0) {
            // No server data yet — push all local projects to server
            const localProjects = get().projects;
            for (const p of localProjects) {
              createProjectRemote({
                id: p.id,
                toolId: p.toolId,
                name: p.name,
                milestones: p.milestones,
                progress: p.progress,
              }).catch(() => {});
            }
            set({ hasSynced: true });
            return;
          }

          // Merge: server wins for shared IDs, keep local-only projects
          const serverMap = new Map(serverProjects.map((p) => [p.id, p]));
          const localProjects = get().projects;
          const merged: Project[] = [];

          // All server projects (authoritative)
          for (const sp of serverProjects) {
            merged.push(fromSupabase(sp));
          }

          // Local-only projects (not on server) — push them up
          for (const lp of localProjects) {
            if (!serverMap.has(lp.id)) {
              merged.push(lp);
              createProjectRemote({
                id: lp.id,
                toolId: lp.toolId,
                name: lp.name,
                milestones: lp.milestones,
                progress: lp.progress,
              }).catch(() => {});
            }
          }

          // Sort by updatedAt descending
          merged.sort((a, b) => b.updatedAt - a.updatedAt);
          set({ projects: merged.slice(0, 200), hasSynced: true });
        } catch (err) {
          console.warn("[ProjectStore] syncFromServer error:", err);
          // Still mark synced on error — fall back to local-only, don't block UI
          set({ hasSynced: true });
        }
      },
    }),
    {
      name: "dmsuite-projects",
      partialize: (state) => ({
        projects: state.projects,
        // Don't persist hasSynced — always re-sync on fresh page load
      }),
      // Migrate old projects that lack milestones
      migrate: (persisted: unknown) => {
        const state = persisted as ProjectState;
        if (state?.projects) {
          state.projects = state.projects.map((p) => {
            if (!p.milestones) {
              const milestones: Milestone[] = ["opened"];
              if (p.progress >= 30) milestones.push("input");
              if (p.progress >= 60) milestones.push("content");
              if (p.progress >= 80) milestones.push("edited");
              if (p.progress >= 100) milestones.push("exported");
              return { ...p, milestones, progress: computeProgress(milestones) };
            }
            return p;
          });
        }
        return state;
      },
      version: 1,
    }
  )
);
