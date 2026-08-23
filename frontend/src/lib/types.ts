export type ProjectStatus = "draft" | "published" | "archived";

export type AccentKey = "tiffany" | "periwinkle" | "blush" | "sky" | "mint";

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
