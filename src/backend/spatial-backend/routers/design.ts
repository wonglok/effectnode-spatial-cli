import path from "node:path";
import { Router } from "express";
import { readJson, writeJson } from "../../workspace.js";
import { ensureProjectFolders, resolveProject } from "./projects.js";

const DEFAULT_DESIGN = { scene: [] };

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

export const designRouter = Router();

// GET /api/projects/:projectID/design — load the project's design JSON.
designRouter.get("/:projectID/design", async (req, res) => {
  try {
    res.json(await loadDesign(req.params.projectID));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// PUT /api/projects/:projectID/design — save the project's design JSON.
designRouter.put("/:projectID/design", async (req, res) => {
  try {
    await saveDesign(req.params.projectID, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});
