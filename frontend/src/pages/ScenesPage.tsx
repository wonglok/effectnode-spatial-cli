import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  IconEffects,
  IconEdit,
  IconPlus,
  IconTrash,
} from "../components/icons";
import { timeAgo } from "../lib/format";
import { useProjectsStore } from "../store/projectsStore";
import { useScenesStore } from "../store/scenesStore";

export function ScenesPage() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.slug === projectID),
  );
  const scenes = useScenesStore((state) => state.scenes);
  const status = useScenesStore((state) => state.status);
  const fetchScenes = useScenesStore((state) => state.fetchScenes);
  const createScene = useScenesStore((state) => state.createScene);
  const renameScene = useScenesStore((state) => state.renameScene);
  const deleteScene = useScenesStore((state) => state.deleteScene);

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (projectID) fetchScenes(projectID).catch(() => {});
  }, [projectID, fetchScenes]);

  if (!project) return null;

  const base = `/projects/${project.slug}`;

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createScene(project.slug, name);
      setNewName("");
    } catch {
      // Create failed; leave the input so the user can retry.
    } finally {
      setCreating(false);
    }
  };

  const startRename = (slug: string, name: string) => {
    setEditingSlug(slug);
    setEditValue(name);
  };

  const commitRename = async () => {
    const slug = editingSlug;
    const name = editValue.trim();
    setEditingSlug(null);
    if (slug && name) {
      try {
        await renameScene(project.slug, slug, name);
      } catch {
        // Rename failed; the list keeps the original name.
      }
    }
  };

  const remove = async (slug: string) => {
    try {
      await deleteScene(project.slug, slug);
    } catch {
      // Delete failed; stay put.
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tiffany-50 text-tiffany-600">
            <IconEffects className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink-900">Scenes</h1>
            <p className="mt-0.5 text-sm text-ink-600">
              Create and manage the scenes in this project.
            </p>
          </div>
        </div>
      </header>

      {/* New scene */}
      <div className="mt-6 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void create();
          }}
          placeholder="Scene name…"
          className="w-full max-w-xs rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
        />
        <button
          type="button"
          onClick={create}
          disabled={creating || !newName.trim()}
          className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <IconPlus className="h-4 w-4" /> New scene
        </button>
      </div>

      {/* Scene list */}
      <div className="mt-6">
        {status === "loading" ? (
          <p className="text-sm text-ink-500">Loading…</p>
        ) : scenes.length === 0 ? (
          <div className="card rounded-xl px-6 py-16 text-center">
            <p className="text-sm text-ink-500">
              No scenes yet — create one to get started.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {scenes.map((scene) => (
              <li
                key={scene.slug}
                className="card rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  {editingSlug === scene.slug ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void commitRename();
                        else if (e.key === "Escape") setEditingSlug(null);
                      }}
                      className="w-full rounded border border-tiffany-400 px-2 py-1 text-sm text-ink-800 outline-none ring-2 ring-tiffany-300/40"
                    />
                  ) : (
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink-900">
                        {scene.name}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-xs text-ink-400">
                        {scene.slug}
                      </div>
                      <div className="mt-1 text-xs text-ink-500">
                        Updated {timeAgo(scene.updatedAt)}
                      </div>
                    </div>
                  )}

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => startRename(scene.slug, scene.name)}
                      aria-label={`Rename ${scene.name}`}
                      title="Rename"
                      className="rounded p-1.5 text-ink-300 transition hover:bg-ink-100 hover:text-ink-700"
                    >
                      <IconEdit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(scene.slug)}
                      aria-label={`Delete ${scene.name}`}
                      title="Delete"
                      className="rounded p-1.5 text-ink-300 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    to={`${base}/scenes/${scene.slug}`}
                    className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                  >
                    Open editor
                  </Link>
                  <Link
                    to={`${base}/scenes/${scene.slug}/preview`}
                    className="btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    Preview
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
