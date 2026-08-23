import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import { WORKSPACE_DIR, readJson, writeJson } from "../../workspace.js";

// ---------------------------------------------------------------------------
// Types (mirrors frontend/src/lib/types.ts)
// ---------------------------------------------------------------------------

const ACCENTS = ["tiffany", "periwinkle", "blush", "sky", "mint"] as const;

type AccentKey = (typeof ACCENTS)[number];
type ProjectStatus = "draft" | "published" | "archived";

interface ProjectStats {
  effects: number;
  materials: number;
  assets: number;
}

interface Project {
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

interface ProjectInput {
  name?: unknown;
  description?: unknown;
  status?: unknown;
  accent?: unknown;
}

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

function projectDir(id: string): string {
  return path.join(PROJECTS_ROOT, id);
}

async function loadProjects(): Promise<Project[]> {
  return readJson<Project[]>(DB_FILE, []);
}

async function saveProjects(projects: Project[]): Promise<void> {
  await writeJson(DB_FILE, projects);
}

/** Create the project's folder and its <slug>.txt placeholder (idempotent). */
async function ensureProjectFolder(id: string, slug: string): Promise<string> {
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

function makeStats(): ProjectStats {
  return { effects: 0, materials: 0, assets: 0 };
}

function isStatus(value: unknown): value is ProjectStatus {
  return value === "draft" || value === "published" || value === "archived";
}

function isAccent(value: unknown): value is AccentKey {
  return (ACCENTS as readonly string[]).includes(value as string);
}

/** Convert a project name into a URL-safe slug. */
function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "project";
}

/** Ensure a slug is unique by appending a numeric suffix when needed. */
function uniqueSlug(base: string, projects: Project[]): string {
  const taken = new Set(projects.map((p) => p.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

/** Validate + coerce request input into a patchable `Partial<Project>`. */
function parseProjectInput(
  input: ProjectInput,
): Partial<Omit<Project, "id" | "slug" | "createdAt" | "updatedAt" | "stats">> {
  const patch: Partial<
    Omit<Project, "id" | "slug" | "createdAt" | "updatedAt" | "stats">
  > = {};

  if (typeof input.name === "string" && input.name.trim()) {
    patch.name = input.name.trim();
  }
  if (typeof input.description === "string") {
    patch.description = input.description.trim();
  }
  if (isStatus(input.status)) {
    patch.status = input.status;
  }
  if (isAccent(input.accent)) {
    patch.accent = input.accent;
  }

  return patch;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const projectsRouter = Router();

// GET /api/projects — list all projects (newest first).
projectsRouter.get("/", async (_req, res) => {
  const projects = await loadProjects();
  res.json(projects);
});

// GET /api/projects/:projectID — fetch one project by its slug.
projectsRouter.get("/:projectID", async (req, res) => {
  const projects = await loadProjects();
  const project = projects.find((p) => p.slug === req.params.projectID);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await ensureProjectFolder(project.id, project.slug);
  res.json(project);
});

// POST /api/projects — create a project (and its workspace folder).
projectsRouter.post("/", async (req, res) => {
  const projects = await loadProjects();
  const patch = parseProjectInput(req.body as ProjectInput);

  const name = patch.name ?? `Untitled Project ${projects.length + 1}`;
  const now = new Date().toISOString();
  const project: Project = {
    id: randomUUID(),
    slug: uniqueSlug(slugify(name), projects),
    name,
    description: patch.description ?? "",
    status: patch.status ?? "draft",
    createdAt: now,
    updatedAt: now,
    accent: patch.accent ?? ACCENTS[projects.length % ACCENTS.length],
    stats: makeStats(),
  };

  await ensureProjectFolder(project.id, project.slug);
  await saveProjects([project, ...projects]);

  res.status(201).json(project);
});

// PATCH /api/projects/:projectID — update a project's editable fields.
projectsRouter.patch("/:projectID", async (req, res) => {
  const projects = await loadProjects();
  const index = projects.findIndex((p) => p.slug === req.params.projectID);

  if (index === -1) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const patch = parseProjectInput(req.body as ProjectInput);
  const updated: Project = {
    ...projects[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const next = [...projects];
  next[index] = updated;
  await saveProjects(next);

  res.json(updated);
});

// DELETE /api/projects/:projectID — delete a project and its folder.
projectsRouter.delete("/:projectID", async (req, res) => {
  const projects = await loadProjects();
  const project = projects.find((p) => p.slug === req.params.projectID);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await saveProjects(projects.filter((p) => p.id !== project.id));
  await fs.rm(projectDir(project.id), { recursive: true, force: true });

  res.status(204).end();
});
