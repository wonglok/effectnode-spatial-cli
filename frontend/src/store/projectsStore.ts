import { create } from "zustand";
import type { Project } from "../lib/types";
import { api } from "../lib/api";

type LoadStatus = "loading" | "ready" | "error";

interface CreateProjectInput {
  name?: string;
  description?: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: Project["status"];
  accent?: Project["accent"];
}

interface ProjectsState {
  projects: Project[];
  status: LoadStatus;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (input?: CreateProjectInput) => Promise<Project>;
  updateProject: (id: string, patch: UpdateProjectInput) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const useProjectsStore = create<ProjectsState>()((set) => ({
  projects: [],
  status: "loading",
  error: null,

  fetchProjects: async () => {
    set({ status: "loading", error: null });
    try {
      const projects = await api.get<Project[]>("/projects");
      set({ projects, status: "ready" });
    } catch (err) {
      set({ status: "error", error: message(err) });
    }
  },

  createProject: async (input = {}) => {
    const project = await api.post<Project>("/projects", input);
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  updateProject: async (id, patch) => {
    const updated = await api.patch<Project>(
      `/projects/${encodeURIComponent(id)}`,
      patch,
    );
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  removeProject: async (id) => {
    await api.remove(`/projects/${encodeURIComponent(id)}`);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));
  },
}));
