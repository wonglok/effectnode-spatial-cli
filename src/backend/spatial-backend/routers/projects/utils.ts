import path from "node:path";
import { ACCENTS } from "./types.js";
import type {
  AccentKey,
  Project,
  ProjectInput,
  ProjectStats,
  ProjectStatus,
} from "./types.js";

/** Convert a project name into a URL-safe slug. */
export function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "project";
}

/** Ensure a slug is unique by appending a numeric suffix when needed. */
export function uniqueSlug(base: string, projects: Project[]): string {
  const taken = new Set(projects.map((p) => p.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || "upload.bin";
}

export function makeStats(): ProjectStats {
  return { effects: 0, materials: 0, assets: 0 };
}

export function isStatus(value: unknown): value is ProjectStatus {
  return value === "draft" || value === "published" || value === "archived";
}

export function isAccent(value: unknown): value is AccentKey {
  return (ACCENTS as readonly string[]).includes(value as string);
}

/** Validate + coerce request input into a patchable `Partial<Project>`. */
export function parseProjectInput(
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
