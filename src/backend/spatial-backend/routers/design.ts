import path from "node:path";
import { readJson, writeJson } from "../../workspace.js";
import { ensureProjectFolders, resolveProject } from "./projects/store.js";
import type { Design } from "../scene.js";

export const DEFAULT_DESIGN: Design = { scene: [] };

/** Load a project's design JSON (returns a default when none exists yet). */
export async function loadDesign(slug: string): Promise<Design> {
  const project = await resolveProject(slug);
  if (!project) throw new Error("Project not found");
  await ensureProjectFolders(project.id);
  return readJson<Design>(
    path.join("projects", project.id, "db", "design.json"),
    DEFAULT_DESIGN,
  );
}

/** Persist a project's design JSON. */
export async function saveDesign(slug: string, design: Design): Promise<void> {
  const project = await resolveProject(slug);
  if (!project) throw new Error("Project not found");
  await ensureProjectFolders(project.id);
  await writeJson(
    path.join("projects", project.id, "db", "design.json"),
    design,
  );
}
