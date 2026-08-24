import { create } from "zustand";
import type { SceneMetadata } from "../lib/types";
import { api } from "../lib/api";

type LoadStatus = "loading" | "ready" | "error";

interface ScenesState {
  scenes: SceneMetadata[];
  status: LoadStatus;
  error: string | null;
  fetchScenes: (projectSlug: string) => Promise<void>;
  createScene: (projectSlug: string, name: string) => Promise<SceneMetadata>;
  renameScene: (
    projectSlug: string,
    sceneSlug: string,
    name: string,
  ) => Promise<void>;
  deleteScene: (projectSlug: string, sceneSlug: string) => Promise<void>;
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const scenesPath = (projectSlug: string, sceneSlug?: string) =>
  `/projects/${encodeURIComponent(projectSlug)}/scenes${
    sceneSlug ? `/${encodeURIComponent(sceneSlug)}` : ""
  }`;

export const useScenesStore = create<ScenesState>()((set) => ({
  scenes: [],
  status: "loading",
  error: null,

  fetchScenes: async (projectSlug) => {
    set({ status: "loading", error: null });
    try {
      const scenes = await api.get<SceneMetadata[]>(scenesPath(projectSlug));
      set({ scenes, status: "ready" });
    } catch (err) {
      set({ status: "error", error: message(err) });
    }
  },

  createScene: async (projectSlug, name) => {
    const scene = await api.post<SceneMetadata>(scenesPath(projectSlug), {
      name,
    });
    set((state) => ({ scenes: [...state.scenes, scene] }));
    return scene;
  },

  renameScene: async (projectSlug, sceneSlug, name) => {
    const updated = await api.patch<SceneMetadata>(
      scenesPath(projectSlug, sceneSlug),
      { name },
    );
    set((state) => ({
      scenes: state.scenes.map((s) => (s.slug === sceneSlug ? updated : s)),
    }));
  },

  deleteScene: async (projectSlug, sceneSlug) => {
    await api.remove(scenesPath(projectSlug, sceneSlug));
    set((state) => ({
      scenes: state.scenes.filter((s) => s.slug !== sceneSlug),
    }));
  },
}));
