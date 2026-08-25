import { create } from "zustand";
import { api } from "../lib/api";
import type { MaterialGraphJSON } from "../components/Editor/worker/types";

type Status = "idle" | "loading" | "ready" | "error";

interface MaterialEditorState {
  /** Current TSL source code for the material being edited. */
  tslCode: string;
  /** Serialized node graph (drives the graph editor + preview). */
  json: MaterialGraphJSON | null;
  status: Status;
  error: string | null;
  /** Loads the graph (and its stored `sourceCode`) from the backend. */
  load: (projectSlug: string, materialSlug: string) => Promise<string>;
  /** Persists the current graph + `sourceCode` to the backend. */
  save: (projectSlug: string, materialSlug: string) => Promise<void>;
  setTslCode: (code: string) => void;
  setJson: (json: MaterialGraphJSON | null) => void;
}

const graphPath = (projectSlug: string, materialSlug: string) =>
  `/projects/${encodeURIComponent(projectSlug)}/materials/${encodeURIComponent(
    materialSlug,
  )}/graph`;

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const useMaterialEditorStore = create<MaterialEditorState>()(
  (set, get) => ({
    tslCode: "",
    json: null,
    status: "idle",
    error: null,

    setTslCode: (code) => set({ tslCode: code }),
    setJson: (json) => set({ json }),

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
