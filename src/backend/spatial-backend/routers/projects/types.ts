// ---------------------------------------------------------------------------
// Types (mirrors frontend/src/lib/types.ts)
// ---------------------------------------------------------------------------

export const ACCENTS = ["tiffany", "periwinkle", "blush", "sky", "mint"] as const;

export type AccentKey = (typeof ACCENTS)[number];
export type ProjectStatus = "draft" | "published" | "archived";

export interface ProjectStats {
  effects: number;
  materials: number;
  assets: number;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  accent: AccentKey;
  stats: ProjectStats;
}

export interface ProjectInput {
  name?: unknown;
  description?: unknown;
  status?: unknown;
  accent?: unknown;
}
