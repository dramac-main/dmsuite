import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deleteProjectData, duplicateProjectData } from "@/lib/project-data";

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
  /** Whether this project has data saved in IndexedDB */
  hasData?: boolean;
}

interface ProjectState {
  projects: Project[];
  /** Create a new project. Returns project ID. */
  addProject: (toolId: string, name: string) => string;
  updateProject: (id: string, patch: Partial<Pick<Project, "name" | "progress" | "hasData">>) => void;
  /** Rename a project (convenience wrapper) */
  renameProject: (id: string, name: string) => void;
  /** Add a milestone and recompute progress. No-op if already present. */
  addMilestone: (id: string, milestone: Milestone) => void;
  /** Remove project metadata + IndexedDB data */
  removeProject: (id: string) => void;
  touchProject: (id: string) => void;
  /** Duplicate a project's metadata (caller must also duplicate IndexedDB data) */
  duplicateProject: (id: string, newName: string) => string | null;
  /** Get all projects for a given tool */
  getProjectsForTool: (toolId: string) => Project[];
}

let counter = 0;
function uid() {
  return `proj-${Date.now()}-${++counter}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],

      addProject: (toolId, name) => {
        const id = uid();
        const milestones: Milestone[] = ["opened"];
        set((s) => ({
          projects: [
            {
              id,
              toolId,
              name,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              progress: computeProgress(milestones),
              milestones,
              hasData: false,
            },
            ...s.projects,
          ].slice(0, 200), // Increased limit for multi-project support
        }));
        return id;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
          ),
        })),

      renameProject: (id, name) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p
          ),
        })),

      addMilestone: (id, milestone) =>
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== id) return p;
            if (p.milestones.includes(milestone)) return p;
            const milestones = [...p.milestones, milestone];
            return { ...p, milestones, progress: computeProgress(milestones), updatedAt: Date.now() };
          }),
        })),

      removeProject: (id) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
        // Also clean up IndexedDB data (fire and forget)
        deleteProjectData(id).catch(() => {});
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
        set((s) => ({
          projects: [
            {
              id: newId,
              toolId: source.toolId,
              name: newName,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              progress: source.progress,
              milestones: [...source.milestones],
              hasData: false, // Will be set true after data duplication
            },
            ...s.projects,
          ].slice(0, 200),
        }));
        // Duplicate IndexedDB data async
        duplicateProjectData(id, newId).then((ok) => {
          if (ok) {
            set((s) => ({
              projects: s.projects.map((p) =>
                p.id === newId ? { ...p, hasData: true } : p
              ),
            }));
          }
        }).catch(() => {});
        return newId;
      },

      getProjectsForTool: (toolId) =>
        get().projects.filter((p) => p.toolId === toolId),
    }),
    {
      name: "dmsuite-projects",
      // Migrate old projects that lack milestones
      migrate: (persisted: unknown) => {
        const state = persisted as ProjectState;
        if (state?.projects) {
          state.projects = state.projects.map((p) => {
            if (!p.milestones) {
              // Infer milestones from legacy progress value
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
