import { create } from "zustand";
import { api } from "../lib/api";
import type { MaterialGraphJSON } from "../components/Editor/worker/types";

type Status = "idle" | "loading" | "ready" | "error";

interface MaterialBackup {
  id: string;
  createdAt: string;
}

interface MaterialEditorState {
  /** Current TSL source code for the material being edited. */
  tslCode: string;
  /** Serialized node graph (drives the graph editor + preview). */
  json: MaterialGraphJSON | null;
  status: Status;
  error: string | null;
  /** Saved snapshots of this material (newest first). */
  backups: MaterialBackup[];
  /** Loads the graph (and its stored `sourceCode`) from the backend. */
  load: (projectSlug: string, materialSlug: string) => Promise<string>;
  /** Persists the current graph + `sourceCode` to the backend. */
  save: (projectSlug: string, materialSlug: string) => Promise<void>;
  /** Lists the material's backups (newest first). */
  fetchBackups: (projectSlug: string, materialSlug: string) => Promise<void>;
  /** Restores the material to a previous backup. */
  restoreBackup: (
    projectSlug: string,
    materialSlug: string,
    backupId: string,
  ) => Promise<void>;
  /** Snapshots the current material as a new backup. */
  createBackup: (projectSlug: string, materialSlug: string) => Promise<void>;
  setTslCode: (code: string) => void;
  setJson: (json: MaterialGraphJSON | null) => void;
}

const graphPath = (projectSlug: string, materialSlug: string) =>
  `/projects/${encodeURIComponent(projectSlug)}/materials/${encodeURIComponent(
    materialSlug,
  )}/graph`;

const backupsPath = (projectSlug: string, materialSlug: string) =>
  `/projects/${encodeURIComponent(projectSlug)}/materials/${encodeURIComponent(
    materialSlug,
  )}/backups`;

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const useMaterialEditorStore = create<MaterialEditorState>()(
  (set, get) => ({
    tslCode: "",
    json: null,
    status: "idle",
    error: null,
    backups: [],

    setTslCode: (code) => set({ tslCode: code }),
    setJson: (json) => set({ json }),

    fetchBackups: async (projectSlug, materialSlug) => {
      try {
        const backups = await api.get<MaterialBackup[]>(
          backupsPath(projectSlug, materialSlug),
        );
        set({ backups });
      } catch (err) {
        set({ error: message(err) });
      }
    },

    restoreBackup: async (projectSlug, materialSlug, backupId) => {
      await api.post(
        `${backupsPath(projectSlug, materialSlug)}/${encodeURIComponent(
          backupId,
        )}/restore`,
      );
    },

    createBackup: async (projectSlug, materialSlug) => {
      const backup = await api.post<MaterialBackup>(
        backupsPath(projectSlug, materialSlug),
      );
      set((state) => ({ backups: [backup, ...state.backups] }));
    },

    load: async (projectSlug, materialSlug) => {
      set({ status: "loading", error: null });
      try {
        const graph = await api.get<MaterialGraphJSON>(
          graphPath(projectSlug, materialSlug),
        );
        const code = graph.sourceCode ?? "";
        set({ json: graph, tslCode: code, status: "ready" });
        return code;
      } catch (err) {
        set({ status: "error", error: message(err) });
        return "";
      }
    },

    save: async (projectSlug, materialSlug) => {
      const { tslCode, json } = get();
      if (!json) return;
      await api.put(graphPath(projectSlug, materialSlug), {
        ...json,
        sourceCode: tslCode,
      });
    },
  }),
);
