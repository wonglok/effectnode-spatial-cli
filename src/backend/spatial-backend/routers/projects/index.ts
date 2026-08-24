import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import express, { Router } from "express";
import { ACCENTS } from "./types.js";
import type { Project, ProjectInput } from "./types.js";
import {
  assetsDir,
  ensureProjectFolder,
  ensureProjectFolders,
  loadProjects,
  projectDir,
  resolveProject,
  saveProjects,
  uploadsDir,
} from "./store.js";
import {
  makeStats,
  parseProjectInput,
  sanitizeFilename,
  slugify,
  uniqueSlug,
} from "./utils.js";

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

// GET /api/projects/:projectID/uploads — list uploaded files.
projectsRouter.get("/:projectID/uploads", async (req, res) => {
  const project = await resolveProject(req.params.projectID);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  await ensureProjectFolders(project.id);
  const entries = await fs.readdir(uploadsDir(project.id), {
    withFileTypes: true,
  });
  res.json(entries.filter((e) => e.isFile()).map((e) => ({ name: e.name })));
});

// POST /api/projects/:projectID/uploads?filename=… — upload a binary file.
projectsRouter.post(
  "/:projectID/uploads",
  express.raw({ type: "application/octet-stream", limit: "100gb" }),
  async (req, res) => {
    const project = await resolveProject(req.params.projectID);
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const filename = sanitizeFilename(
      String(req.query.filename ?? "upload.bin"),
    );
    await ensureProjectFolders(project.id);
    await fs.writeFile(
      path.join(uploadsDir(project.id), filename),
      req.body as Buffer,
    );
    res.status(201).json({ name: filename, uri: `uploads/${filename}` });
  },
);

// GET /api/projects/:projectID/assets — list committed assets.
projectsRouter.get("/:projectID/assets", async (req, res) => {
  const project = await resolveProject(req.params.projectID);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  await ensureProjectFolders(project.id);
  const entries = await fs.readdir(assetsDir(project.id), {
    withFileTypes: true,
  });
  res.json(entries.filter((e) => e.isFile()).map((e) => ({ name: e.name })));
});

// GET /api/projects/:projectID/uploads/:filename — serve an uploaded file.
projectsRouter.get("/:projectID/uploads/:filename", async (req, res) => {
  const project = await resolveProject(req.params.projectID);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const filename = sanitizeFilename(req.params.filename);
  const filepath = path.join(uploadsDir(project.id), filename);
  try {
    await fs.access(filepath);
  } catch {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filepath);
});

// PATCH /api/projects/:projectID/uploads/:filename — rename an uploaded file.
projectsRouter.patch("/:projectID/uploads/:filename", async (req, res) => {
  const project = await resolveProject(req.params.projectID);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const oldName = sanitizeFilename(req.params.filename);
  const rawName = String((req.body as { name?: unknown })?.name ?? "").trim();
  if (!rawName) {
    res.status(400).json({ error: "A new name is required" });
    return;
  }
  const newName = sanitizeFilename(rawName);
  const dir = uploadsDir(project.id);
  try {
    await fs.rename(path.join(dir, oldName), path.join(dir, newName));
  } catch {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.json({ name: newName });
});

// DELETE /api/projects/:projectID/uploads/:filename — delete an uploaded file.
projectsRouter.delete("/:projectID/uploads/:filename", async (req, res) => {
  const project = await resolveProject(req.params.projectID);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const filename = sanitizeFilename(req.params.filename);
  await fs.rm(path.join(uploadsDir(project.id), filename), {
    force: true,
  });
  res.status(204).end();
});
