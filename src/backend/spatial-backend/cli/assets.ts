import fs from "node:fs/promises";
import {
  ensureProjectFolders,
  resolveProject,
  uploadsDir,
} from "../routers/projects/store.js";

// ---------------------------------------------------------------------------
// Headless asset listing for AI agents: the files a project can reference in
// scene nodes (model/environment `src`). Reads the same uploads dir the
// running server serves under /api/projects/<slug>/uploads/<name>.
// ---------------------------------------------------------------------------

export interface ProjectAsset {
  name: string;
  src: string;
}

/** List the asset files available in a project. */
export async function assetsList(slug: string): Promise<ProjectAsset[]> {
  const project = await resolveProject(slug);
  if (!project) throw new Error("Project not found");
  await ensureProjectFolders(project.id);

  const entries = await fs.readdir(uploadsDir(project.id), {
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      name: entry.name,
      src: `/api/projects/${encodeURIComponent(slug)}/uploads/${encodeURIComponent(entry.name)}`,
    }));
}
