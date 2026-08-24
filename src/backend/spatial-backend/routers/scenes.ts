import { Router } from "express";
import {
  createScene,
  deleteScene,
  listScenes,
  renameScene,
} from "../scenes.js";

export const scenesRouter = Router();

// GET /api/projects/:projectID/scenes — list a project's scenes.
scenesRouter.get("/:projectID/scenes", async (req, res) => {
  try {
    res.json(await listScenes(req.params.projectID));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// POST /api/projects/:projectID/scenes — create a scene.
scenesRouter.post("/:projectID/scenes", async (req, res) => {
  try {
    const name = String((req.body as { name?: unknown })?.name ?? "").trim();
    if (!name) {
      res.status(400).json({ error: "A scene name is required" });
      return;
    }
    res.status(201).json(await createScene(req.params.projectID, name));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// PATCH /api/projects/:projectID/scenes/:sceneSlug — rename a scene.
scenesRouter.patch("/:projectID/scenes/:sceneSlug", async (req, res) => {
  try {
    const name = String((req.body as { name?: unknown })?.name ?? "").trim();
    if (!name) {
      res.status(400).json({ error: "A scene name is required" });
      return;
    }
    res.json(
      await renameScene(req.params.projectID, req.params.sceneSlug, name),
    );
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// DELETE /api/projects/:projectID/scenes/:sceneSlug — delete a scene.
scenesRouter.delete("/:projectID/scenes/:sceneSlug", async (req, res) => {
  try {
    await deleteScene(req.params.projectID, req.params.sceneSlug);
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});
