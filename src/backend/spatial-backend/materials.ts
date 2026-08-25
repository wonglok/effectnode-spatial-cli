import fs from "node:fs/promises";
import path from "node:path";
import { readJson, writeJson } from "../workspace.js";
import {
  ensureProjectFolders,
  projectDir,
  resolveProject,
} from "./routers/projects/store.js";
import { slugify } from "./routers/projects/utils.js";

// ---------------------------------------------------------------------------
// Material storage. A project holds multiple materials; each material lives in
// projects/<id>/materials/<material-slug>/ with a metadata.json and a
// material.json (the TSL node graph). Mirrors the scene layout in scenes.ts.
// ---------------------------------------------------------------------------

export interface MaterialMetadata {
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** A saved snapshot of a material, keyed by a millisecond-timestamp id. */
export interface MaterialBackup {
  id: string;
  createdAt: string;
}

/** Serialized TSL node graph — see frontend/src/sdk/material-json/types.ts. */
export interface MaterialGraph {
  materialType: string;
  rootNodeId: string;
  materialSlots: Record<string, string>;
  nodes: unknown[];
  edges: unknown[];
  // Original TSL source code (stored alongside the graph so the editor can
  // reload the code, not just the node graph).
  sourceCode?: string;
}

export const DEFAULT_MATERIAL: MaterialGraph = {
  materialType: "MeshStandardNodeMaterial",
  rootNodeId: "",
  materialSlots: {},
  nodes: [],
  edges: [],
};

// Paths relative to the workspace (for readJson/writeJson).
const metadataRel = (id: string, slug: string): string =>
  path.join("projects", id, "materials", slug, "metadata.json");
const graphRel = (id: string, slug: string): string =>
  path.join("projects", id, "materials", slug, "material.json");

// Absolute paths (for fs directory operations).
const materialsAbs = (id: string): string =>
  path.join(projectDir(id), "materials");
const materialAbs = (id: string, slug: string): string =>
  path.join(materialsAbs(id), slug);

// Backups live in projects/<id>/materials/<slug>/backups/<backupId>/material.json.
const backupsRel = (id: string, slug: string, backupId: string): string =>
  path.join(
    "projects",
    id,
    "materials",
    slug,
    "backups",
    backupId,
    "material.json",
  );
const backupsAbs = (id: string, slug: string): string =>
  path.join(materialAbs(id, slug), "backups");

// Slug format produced by slugify(). Reject anything else so a user-supplied
// material slug (URL param) can't traverse out of the materials dir.
const MATERIAL_SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

function assertMaterialSlug(slug: string): void {
  if (!MATERIAL_SLUG_RE.test(slug)) {
    throw new Error(`Invalid material slug: ${slug}`);
  }
}

async function resolveProjectId(slug: string): Promise<string> {
  const project = await resolveProject(slug);
  if (!project) throw new Error("Project not found");
  await ensureProjectFolders(project.id);
  return project.id;
}

function uniqueMaterialSlug(base: string, existing: MaterialMetadata[]): string {
  const taken = new Set(existing.map((m) => m.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

async function listMaterialsForId(id: string): Promise<MaterialMetadata[]> {
  await fs.mkdir(materialsAbs(id), { recursive: true });
  let entries;
  try {
    entries = await fs.readdir(materialsAbs(id), { withFileTypes: true });
  } catch {
    return [];
  }
  const materials: MaterialMetadata[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const meta = await readJson<MaterialMetadata | null>(
      metadataRel(id, entry.name),
      null,
    );
    if (meta) materials.push(meta);
  }
  materials.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return materials;
}

async function writeMetadata(
  id: string,
  meta: MaterialMetadata,
): Promise<void> {
  await writeJson(metadataRel(id, meta.slug), meta);
}

export async function listMaterials(
  projectSlug: string,
): Promise<MaterialMetadata[]> {
  const id = await resolveProjectId(projectSlug);
  return listMaterialsForId(id);
}

export async function createMaterial(
  projectSlug: string,
  name: string,
): Promise<MaterialMetadata> {
  const id = await resolveProjectId(projectSlug);
  const existing = await listMaterialsForId(id);
  const slug = uniqueMaterialSlug(slugify(name), existing);
  const now = new Date().toISOString();
  const meta: MaterialMetadata = { slug, name, createdAt: now, updatedAt: now };
  await fs.mkdir(materialAbs(id, slug), { recursive: true });
  await writeMetadata(id, meta);
  await writeJson(graphRel(id, slug), DEFAULT_MATERIAL);
  return meta;
}

export async function renameMaterial(
  projectSlug: string,
  materialSlug: string,
  name: string,
): Promise<MaterialMetadata> {
  assertMaterialSlug(materialSlug);
  const id = await resolveProjectId(projectSlug);
  const meta = await readJson<MaterialMetadata | null>(
    metadataRel(id, materialSlug),
    null,
  );
  if (!meta) throw new Error("Material not found");
  const updated: MaterialMetadata = {
    ...meta,
    name,
    updatedAt: new Date().toISOString(),
  };
  await writeMetadata(id, updated);
  return updated;
}

export async function deleteMaterial(
  projectSlug: string,
  materialSlug: string,
): Promise<void> {
  assertMaterialSlug(materialSlug);
  const id = await resolveProjectId(projectSlug);
  await fs.rm(materialAbs(id, materialSlug), { recursive: true, force: true });
}

export async function loadMaterialGraph(
  projectSlug: string,
  materialSlug: string,
): Promise<MaterialGraph> {
  assertMaterialSlug(materialSlug);
  const id = await resolveProjectId(projectSlug);
  return readJson<MaterialGraph>(graphRel(id, materialSlug), DEFAULT_MATERIAL);
}

export async function saveMaterialGraph(
  projectSlug: string,
  materialSlug: string,
  graph: MaterialGraph,
): Promise<void> {
  assertMaterialSlug(materialSlug);
  const id = await resolveProjectId(projectSlug);

  // Back up the previous version before overwriting it.
  const previous = await readJson<MaterialGraph | null>(
    graphRel(id, materialSlug),
    null,
  );
  if (previous) {
    const backupId = Date.now().toString();
    await fs.mkdir(path.join(backupsAbs(id, materialSlug), backupId), {
      recursive: true,
    });
    await writeJson(backupsRel(id, materialSlug, backupId), previous);
  }

  await writeJson(graphRel(id, materialSlug), graph);
  const meta = await readJson<MaterialMetadata | null>(
    metadataRel(id, materialSlug),
    null,
  );
  if (meta) {
    await writeMetadata(id, { ...meta, updatedAt: new Date().toISOString() });
  }
}

export async function listMaterialBackups(
  projectSlug: string,
  materialSlug: string,
): Promise<MaterialBackup[]> {
  assertMaterialSlug(materialSlug);
  const id = await resolveProjectId(projectSlug);
  let entries;
  try {
    entries = await fs.readdir(backupsAbs(id, materialSlug), {
      withFileTypes: true,
    });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && /^[0-9]+$/.test(e.name))
    .map((e) => ({
      id: e.name,
      createdAt: new Date(Number(e.name)).toISOString(),
    }))
    .sort((a, b) => Number(b.id) - Number(a.id)); // newest first
}

export async function restoreMaterialBackup(
  projectSlug: string,
  materialSlug: string,
  backupId: string,
): Promise<void> {
  assertMaterialSlug(materialSlug);
  if (!/^[0-9]+$/.test(backupId)) throw new Error("Invalid backup ID");
  const id = await resolveProjectId(projectSlug);
  const backup = await readJson<MaterialGraph | null>(
    backupsRel(id, materialSlug, backupId),
    null,
  );
  if (!backup) throw new Error("Backup not found");
  await writeJson(graphRel(id, materialSlug), backup);
  const meta = await readJson<MaterialMetadata | null>(
    metadataRel(id, materialSlug),
    null,
  );
  if (meta) {
    await writeMetadata(id, { ...meta, updatedAt: new Date().toISOString() });
  }
}

export async function createMaterialBackup(
  projectSlug: string,
  materialSlug: string,
): Promise<MaterialBackup> {
  assertMaterialSlug(materialSlug);
  const id = await resolveProjectId(projectSlug);
  const current = await readJson<MaterialGraph | null>(
    graphRel(id, materialSlug),
    null,
  );
  if (!current) throw new Error("Material not found");
  const backupId = Date.now().toString();
  await fs.mkdir(path.join(backupsAbs(id, materialSlug), backupId), {
    recursive: true,
  });
  await writeJson(backupsRel(id, materialSlug, backupId), current);
  return { id: backupId, createdAt: new Date(Number(backupId)).toISOString() };
}
