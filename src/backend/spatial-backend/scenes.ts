import fs from "node:fs/promises";
import path from "node:path";
import { readJson, writeJson } from "../workspace.js";
import {
  ensureProjectFolders,
  projectDir,
  resolveProject,
} from "./routers/projects/store.js";
import { slugify } from "./routers/projects/utils.js";
import type { Design } from "./scene.js";

// ---------------------------------------------------------------------------
// Scene storage. A project holds multiple scenes; each scene lives in
// projects/<id>/scenes/<scene-slug>/ with a metadata.json and a design.json
// (the scene graph). This module also migrates a legacy db/design.json into a
// "main" scene on first access.
// ---------------------------------------------------------------------------

export interface SceneMetadata {
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_DESIGN: Design = { scene: [] };

// Paths relative to the workspace (for readJson/writeJson).
const metadataRel = (id: string, slug: string): string =>
  path.join("projects", id, "scenes", slug, "metadata.json");
const designRel = (id: string, slug: string): string =>
  path.join("projects", id, "scenes", slug, "design.json");

// Absolute paths (for fs directory operations).
const scenesAbs = (id: string): string => path.join(projectDir(id), "scenes");
const sceneAbs = (id: string, slug: string): string =>
  path.join(scenesAbs(id), slug);

// Slug format produced by slugify(). Reject anything else so a user-supplied
// scene slug (URL param / socket payload) can't traverse out of the scenes dir.
const SCENE_SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

function assertSceneSlug(slug: string): void {
  if (!SCENE_SLUG_RE.test(slug)) {
    throw new Error(`Invalid scene slug: ${slug}`);
  }
}

async function resolveProjectId(slug: string): Promise<string> {
  const project = await resolveProject(slug);
  if (!project) throw new Error("Project not found");
  await ensureProjectFolders(project.id);
  return project.id;
}

function uniqueSceneSlug(base: string, existing: SceneMetadata[]): string {
  const taken = new Set(existing.map((s) => s.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

async function listScenesForId(id: string): Promise<SceneMetadata[]> {
  await fs.mkdir(scenesAbs(id), { recursive: true });
  let entries;
  try {
    entries = await fs.readdir(scenesAbs(id), { withFileTypes: true });
  } catch {
    return [];
  }
  const scenes: SceneMetadata[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const meta = await readJson<SceneMetadata | null>(
      metadataRel(id, entry.name),
      null,
    );
    if (meta) scenes.push(meta);
  }
  scenes.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return scenes;
}

async function writeMetadata(id: string, meta: SceneMetadata): Promise<void> {
  await writeJson(metadataRel(id, meta.slug), meta);
}

async function createSceneWithId(
  id: string,
  name: string,
  design: Design = DEFAULT_DESIGN,
): Promise<SceneMetadata> {
  const existing = await listScenesForId(id);
  const slug = uniqueSceneSlug(slugify(name), existing);
  const now = new Date().toISOString();
  const meta: SceneMetadata = { slug, name, createdAt: now, updatedAt: now };
  await fs.mkdir(sceneAbs(id, slug), { recursive: true });
  await writeMetadata(id, meta);
  await writeJson(designRel(id, slug), design);
  return meta;
}

/** Idempotently migrate a legacy db/design.json into a "main" scene. */
async function migrateLegacyDesign(id: string): Promise<void> {
  try {
    const entries = await fs.readdir(scenesAbs(id));
    if (entries.length > 0) return;
  } catch {
    // scenes dir missing → nothing migrated yet
  }
  const legacy = await readJson<Design | null>(
    path.join("projects", id, "db", "design.json"),
    null,
  );
  if (!legacy) return;
  await createSceneWithId(id, "Main", legacy);
}

export async function listScenes(projectSlug: string): Promise<SceneMetadata[]> {
  const id = await resolveProjectId(projectSlug);
  await migrateLegacyDesign(id);
  return listScenesForId(id);
}

export async function createScene(
  projectSlug: string,
  name: string,
): Promise<SceneMetadata> {
  const id = await resolveProjectId(projectSlug);
  await migrateLegacyDesign(id);
  return createSceneWithId(id, name);
}

export async function renameScene(
  projectSlug: string,
  sceneSlug: string,
  name: string,
): Promise<SceneMetadata> {
  assertSceneSlug(sceneSlug);
  const id = await resolveProjectId(projectSlug);
  const meta = await readJson<SceneMetadata | null>(
    metadataRel(id, sceneSlug),
    null,
  );
  if (!meta) throw new Error("Scene not found");
  const updated: SceneMetadata = {
    ...meta,
    name,
    updatedAt: new Date().toISOString(),
  };
  await writeMetadata(id, updated);
  return updated;
}

export async function deleteScene(
  projectSlug: string,
  sceneSlug: string,
): Promise<void> {
  assertSceneSlug(sceneSlug);
  const id = await resolveProjectId(projectSlug);
  await fs.rm(sceneAbs(id, sceneSlug), { recursive: true, force: true });
}

export async function loadSceneDesign(
  projectSlug: string,
  sceneSlug: string,
): Promise<Design> {
  assertSceneSlug(sceneSlug);
  const id = await resolveProjectId(projectSlug);
  await migrateLegacyDesign(id);
  return readJson<Design>(designRel(id, sceneSlug), DEFAULT_DESIGN);
}

export async function saveSceneDesign(
  projectSlug: string,
  sceneSlug: string,
  design: Design,
): Promise<void> {
  assertSceneSlug(sceneSlug);
  const id = await resolveProjectId(projectSlug);
  await writeJson(designRel(id, sceneSlug), design);
  const meta = await readJson<SceneMetadata | null>(
    metadataRel(id, sceneSlug),
    null,
  );
  if (meta) {
    await writeMetadata(id, { ...meta, updatedAt: new Date().toISOString() });
  }
}
