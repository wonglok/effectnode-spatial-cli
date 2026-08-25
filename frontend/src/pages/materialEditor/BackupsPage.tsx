import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMaterialEditorStore } from "../../store/materialEditorStore";

/**
 * Backup / version history for a material. Every save snapshots the previous
 * graph into `backups/<id>/material.json` (see the backend `saveMaterialGraph`),
 * and this page lets you pick an older snapshot to restore.
 */
export function BackupsPage() {
  const { projectID, materialSlug } = useParams();

  const backups = useMaterialEditorStore((s) => s.backups);
  const fetchBackups = useMaterialEditorStore((s) => s.fetchBackups);
  const restoreBackup = useMaterialEditorStore((s) => s.restoreBackup);
  const createBackup = useMaterialEditorStore((s) => s.createBackup);
  const load = useMaterialEditorStore((s) => s.load);

  const [selected, setSelected] = useState<string>("");
  const [restoring, setRestoring] = useState(false);
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!projectID || !materialSlug) return;
    setCreating(true);
    try {
      await createBackup(projectID, materialSlug);
    } catch {
      // Failed; leave the list as-is.
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (projectID && materialSlug) {
      fetchBackups(projectID, materialSlug).catch(() => {});
    }
  }, [projectID, materialSlug, fetchBackups]);

  const restore = async () => {
    if (!projectID || !materialSlug || !selected) return;
    setRestoring(true);
    try {
      await restoreBackup(projectID, materialSlug, selected);
      // Reload the material so the editors reflect the restored snapshot.
      await load(projectID, materialSlug);
    } catch {
      // Restore failed; keep the selection so the user can retry.
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Backups</h1>
          <p className="mt-0.5 text-sm text-ink-600">
            Restore this material to a previously saved version.
          </p>
        </div>
        <button
          type="button"
          onClick={create}
          disabled={creating}
          className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {creating ? "Creating…" : "Add backup"}
        </button>
      </header>

      {backups.length === 0 ? (
        <div className="card mt-6 rounded-xl px-6 py-16 text-center">
          <p className="text-sm text-ink-500">
            No backups yet — save the material to create the first snapshot.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-3">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full max-w-md rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
          >
            <option value="" disabled>
              Choose a version…
            </option>
            {backups.map((b) => (
              <option key={b.id} value={b.id}>
                {new Date(b.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={restore}
            disabled={!selected || restoring}
            className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {restoring ? "Restoring…" : "Restore"}
          </button>
        </div>
      )}
    </div>
  );
}
