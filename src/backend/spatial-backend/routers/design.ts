import path from "node:path";
import { readJson, writeJson } from "../../workspace.js";
import { ensureProjectFolders, resolveProject } from "./projects/store.js";

export const DEFAULT_DESIGN = { scene: [] };

/** Load a project's design JSON (returns a default when none exists yet). */
export async function loadDesign(slug: string): Promise<unknown> {
  const project = await resolveProject(slug);
  if (!project) throw new Error("Project not found");
  await ensureProjectFolders(project.id);
  return readJson<unknown>(
    path.join("projects", project.id, "db", "design.json"),
    DEFAULT_DESIGN,
  );
}

/** Persist a project's design JSON. */
export async function saveDesign(slug: string, design: unknown): Promise<void> {
  const project = await resolveProject(slug);
  if (!project) throw new Error("Project not found");
  await ensureProjectFolders(project.id);
  await writeJson(
    path.join("projects", project.id, "db", "design.json"),
    design,
  );
}
