import { Router } from "express";
import {
  createMaterial,
  createMaterialBackup,
  deleteMaterial,
  listMaterials,
  listMaterialBackups,
  loadMaterialGraph,
  renameMaterial,
  restoreMaterialBackup,
  saveMaterialGraph,
  type MaterialGraph,
} from "../materials.js";

export const materialsRouter = Router();

// GET /api/projects/:projectID/materials — list a project's materials.
materialsRouter.get("/:projectID/materials", async (req, res) => {
  try {
    res.json(await listMaterials(req.params.projectID));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// POST /api/projects/:projectID/materials — create a material.
materialsRouter.post("/:projectID/materials", async (req, res) => {
  try {
    const name = String((req.body as { name?: unknown })?.name ?? "").trim();
    if (!name) {
      res.status(400).json({ error: "A material name is required" });
      return;
    }
    res.status(201).json(await createMaterial(req.params.projectID, name));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// PATCH /api/projects/:projectID/materials/:materialSlug — rename a material.
materialsRouter.patch("/:projectID/materials/:materialSlug", async (req, res) => {
  try {
    const name = String((req.body as { name?: unknown })?.name ?? "").trim();
    if (!name) {
      res.status(400).json({ error: "A material name is required" });
      return;
    }
    res.json(
      await renameMaterial(
        req.params.projectID,
        req.params.materialSlug,
        name,
      ),
    );
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// DELETE /api/projects/:projectID/materials/:materialSlug — delete a material.
materialsRouter.delete(
  "/:projectID/materials/:materialSlug",
  async (req, res) => {
    try {
      await deleteMaterial(req.params.projectID, req.params.materialSlug);
      res.status(204).end();
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  },
);

// GET /api/projects/:projectID/materials/:materialSlug/graph — read the graph.
materialsRouter.get(
  "/:projectID/materials/:materialSlug/graph",
  async (req, res) => {
    try {
      res.json(
        await loadMaterialGraph(req.params.projectID, req.params.materialSlug),
      );
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  },
);

// PUT /api/projects/:projectID/materials/:materialSlug/graph — write the graph.
materialsRouter.put(
  "/:projectID/materials/:materialSlug/graph",
  async (req, res) => {
    try {
      await saveMaterialGraph(
        req.params.projectID,
        req.params.materialSlug,
        req.body as MaterialGraph,
      );
      res.status(204).end();
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  },
);

// GET /api/projects/:projectID/materials/:materialSlug/backups — list backups.
materialsRouter.get(
  "/:projectID/materials/:materialSlug/backups",
  async (req, res) => {
    try {
      res.json(
        await listMaterialBackups(req.params.projectID, req.params.materialSlug),
      );
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  },
);

// POST /api/projects/:projectID/materials/:materialSlug/backups — snapshot.
materialsRouter.post(
  "/:projectID/materials/:materialSlug/backups",
  async (req, res) => {
    try {
      res.status(201).json(
        await createMaterialBackup(req.params.projectID, req.params.materialSlug),
      );
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  },
);

// POST /api/projects/:projectID/materials/:materialSlug/backups/:backupId/restore
materialsRouter.post(
  "/:projectID/materials/:materialSlug/backups/:backupId/restore",
  async (req, res) => {
    try {
      await restoreMaterialBackup(
        req.params.projectID,
        req.params.materialSlug,
        req.params.backupId,
      );
      res.status(204).end();
    } catch (err) {
      res.status(404).json({ error: (err as Error).message });
    }
  },
);
