import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccentKey, Project, ProjectStats } from "../lib/types";

const ACCENTS: AccentKey[] = ["tiffany", "periwinkle", "blush", "sky", "mint"];

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function makeStats(): ProjectStats {
  return {
    effects: Math.floor(Math.random() * 6),
    materials: Math.floor(Math.random() * 8) + 1,
    assets: Math.floor(Math.random() * 14) + 2,
  };
}

const SEED_PROJECTS: Project[] = [
  {
    id: "aurora-bloom",
    name: "Aurora Bloom",
    description: "A dreamy particle bloom drifting through a tiffany sky.",
    status: "published",
    createdAt: "2026-08-12T09:00:00.000Z",
    updatedAt: "2026-08-23T10:30:00.000Z",
    accent: "periwinkle",
    stats: { effects: 4, materials: 6, assets: 14 },
  },
  {
    id: "neon-drift",
    name: "Neon Drift",
    description: "Cinematic neon light trails with a frosted-glass bloom.",
    status: "published",
    createdAt: "2026-08-15T14:20:00.000Z",
    updatedAt: "2026-08-22T18:05:00.000Z",
    accent: "tiffany",
    stats: { effects: 7, materials: 9, assets: 21 },
  },
  {
    id: "glass-prism",
    name: "Glass Prism",
    description: "Refractive material study — clearcoat, transmission, iridescence.",
    status: "draft",
    createdAt: "2026-08-20T11:45:00.000Z",
    updatedAt: "2026-08-21T09:12:00.000Z",
    accent: "sky",
    stats: { effects: 1, materials: 12, assets: 6 },
  },
];

interface ProjectsState {
  projects: Project[];
  createProject: (input?: { name?: string; description?: string }) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: SEED_PROJECTS,

      createProject: (input = {}) => {
        const now = new Date().toISOString();
        const index = get().projects.length + 1;
        const project: Project = {
          id: uid(),
          name: input.name?.trim() || `Untitled Project ${index}`,
          description: input.description?.trim() || "",
          status: "draft",
          createdAt: now,
          updatedAt: now,
          accent: ACCENTS[index % ACCENTS.length],
          stats: makeStats(),
        };
        set((state) => ({ projects: [project, ...state.projects] }));
        return project;
      },

      updateProject: (id, patch) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, ...patch, updatedAt: new Date().toISOString() }
              : project,
          ),
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
        })),
    }),
    { name: "effectnode-projects" },
  ),
);
