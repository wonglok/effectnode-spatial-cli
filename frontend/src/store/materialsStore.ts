import { create } from "zustand";
import type { MaterialMetadata } from "../lib/types";
import { api } from "../lib/api";

type LoadStatus = "loading" | "ready" | "error";

interface MaterialsState {
  materials: MaterialMetadata[];
  status: LoadStatus;
  error: string | null;
  fetchMaterials: (projectSlug: string) => Promise<void>;
  createMaterial: (
    projectSlug: string,
    name: string,
  ) => Promise<MaterialMetadata>;
  renameMaterial: (
    projectSlug: string,
    materialSlug: string,
    name: string,
  ) => Promise<void>;
  deleteMaterial: (projectSlug: string, materialSlug: string) => Promise<void>;
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

const materialsPath = (projectSlug: string, materialSlug?: string) =>
  `/projects/${encodeURIComponent(projectSlug)}/materials${
    materialSlug ? `/${encodeURIComponent(materialSlug)}` : ""
  }`;

export const useMaterialsStore = create<MaterialsState>()((set) => ({
  materials: [],
  status: "loading",
  error: null,

  fetchMaterials: async (projectSlug) => {
    set({ status: "loading", error: null });
    try {
      const materials = await api.get<MaterialMetadata[]>(
        materialsPath(projectSlug),
      );
      set({ materials, status: "ready" });
    } catch (err) {
      set({ status: "error", error: message(err) });
    }
  },

  createMaterial: async (projectSlug, name) => {
    const material = await api.post<MaterialMetadata>(
      materialsPath(projectSlug),
      { name },
    );
    set((state) => ({ materials: [...state.materials, material] }));
    return material;
  },

  renameMaterial: async (projectSlug, materialSlug, name) => {
    const updated = await api.patch<MaterialMetadata>(
      materialsPath(projectSlug, materialSlug),
      { name },
    );
    set((state) => ({
      materials: state.materials.map((m) =>
        m.slug === materialSlug ? updated : m,
      ),
    }));
  },

  deleteMaterial: async (projectSlug, materialSlug) => {
    await api.remove(materialsPath(projectSlug, materialSlug));
    set((state) => ({
      materials: state.materials.filter((m) => m.slug !== materialSlug),
    }));
  },
}));
