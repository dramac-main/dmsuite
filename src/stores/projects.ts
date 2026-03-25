import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Project {
  id: string;
  toolId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  /** 0–100 estimated completion */
  progress: number;
}

interface ProjectState {
  projects: Project[];
  addProject: (toolId: string, name: string) => string;
  updateProject: (id: string, patch: Partial<Pick<Project, "name" | "progress">>) => void;
  removeProject: (id: string) => void;
  touchProject: (id: string) => void;
}

let counter = 0;
function uid() {
  return `proj-${Date.now()}-${++counter}`;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      addProject: (toolId, name) => {
        const id = uid();
        set((s) => ({
          projects: [
            { id, toolId, name, createdAt: Date.now(), updatedAt: Date.now(), progress: 0 },
            ...s.projects,
          ].slice(0, 50),
        }));
        return id;
      },
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
          ),
        })),
      removeProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
      touchProject: (id) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, updatedAt: Date.now() } : p
          ),
        })),
    }),
    { name: "dmsuite-projects" }
  )
);
