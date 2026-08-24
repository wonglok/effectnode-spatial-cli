import fs from "node:fs/promises";
import path from "node:path";
import { WORKSPACE_DIR, readJson, writeJson } from "../../../workspace.js";
import { slugify } from "./utils.js";
import type { Project } from "./types.js";

// ---------------------------------------------------------------------------
// Storage layout
//
//   Local JSON database:  ~/effectnode-spatial/projects.json
//   Project folders:      ~/effectnode-spatial/projects/:id/*
//
// The `id` is a stable UUID used for the project folder. The `slug` is derived
// from the project name and is what the API exposes in URLs (the :projectID
// route parameter), so links are human-readable.
// ---------------------------------------------------------------------------

const DB_FILE = "projects.json";
const PROJECTS_ROOT = path.join(WORKSPACE_DIR, "projects");

export function projectDir(id: string): string {
  return path.join(PROJECTS_ROOT, id);
}

export function uploadsDir(id: string): string {
  return path.join(PROJECTS_ROOT, id, "uploads");
}

export function assetsDir(id: string): string {
  // Assets and uploads share one folder: scene assets live in `uploads`.
  return uploadsDir(id);
}

export async function loadProjects(): Promise<Project[]> {
  return readJson<Project[]>(DB_FILE, []);
}

export async function saveProjects(projects: Project[]): Promise<void> {
  await writeJson(DB_FILE, projects);
}

/** Create the project's folder and its <slug>.txt placeholder (idempotent). */
export async function ensureProjectFolder(
  id: string,
  slug: string,
): Promise<string> {
  const dir = projectDir(id);
  await fs.mkdir(dir, { recursive: true });

  // `slug` is always produced by slugify(), but re-sanitize it here anyway so
  // a tampered database can't smuggle path separators into the filename.
  const thanksFile = path.join(dir, `${slugify(slug)}.txt`);
  await fs
    .writeFile(thanksFile, "thank you for using EffectNode!", { flag: "wx" })
    .catch((err: unknown) => {
      if ((err as { code?: string }).code !== "EEXIST") throw err;
    });

  return dir;
}

const SUBFOLDERS = ["db", "assets", "uploads"] as const;

/** Create the project's db/assets/uploads subfolders (idempotent). */
export async function ensureProjectFolders(id: string): Promise<string> {
  const dir = projectDir(id);
  await Promise.all(
    SUBFOLDERS.map((sub) => fs.mkdir(path.join(dir, sub), { recursive: true })),
  );
  return dir;
}

export async function resolveProject(
  slug: string,
): Promise<Project | undefined> {
  const projects = await loadProjects();
  return projects.find((p) => p.slug === slug);
}
