import { create } from "zustand";
import type { SceneNode, SceneNodeType } from "../sdk/types/scene";

const DEFAULT_NAMES: Record<SceneNodeType, string> = {
  group: "Group",
  mesh: "Mesh",
  geometry: "Geometry",
  material: "Material",
  light: "Light",
  camera: "Camera",
  model: "Model",
  environment: "Environment",
};

const INITIAL_SCENE: SceneNode[] = [];

const HISTORY_LIMIT = 100;
// Continuous edits (slider drags, gizmo drags, typing, multi-delete) within this
// window collapse into a single undo step instead of one per event.
const COALESCE_MS = 400;

type EditKind = "add" | "remove" | "rename" | "params";

// Non-reactive history stacks: only `scene`/`canUndo`/`canRedo` drive re-renders.
let past: SceneNode[][] = [];
let future: SceneNode[][] = [];
let lastKind: EditKind | null = null;
let lastAt = 0;

function snapshot(scene: SceneNode[]): void {
  past.push(scene);
  if (past.length > HISTORY_LIMIT) past.shift();
  future = [];
}

/** Record the pre-edit scene, coalescing same-kind edits within COALESCE_MS. */
function record(scene: SceneNode[], kind: EditKind): void {
  const now = Date.now();
  const coalesce =
    kind !== "add" && lastKind === kind && now - lastAt < COALESCE_MS;
  if (!coalesce) snapshot(scene);
  lastKind = kind;
  lastAt = now;
}

function resetHistory(): void {
  past = [];
  future = [];
  lastKind = null;
  lastAt = 0;
}

function removeRecursive(nodes: SceneNode[], id: string): SceneNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) => ({
      ...node,
      children: node.children ? removeRecursive(node.children, id) : undefined,
    }));
}

function renameRecursive(
  nodes: SceneNode[],
  id: string,
  name: string,
): SceneNode[] {
  return nodes.map((node) =>
    node.id === id
      ? { ...node, name }
      : {
          ...node,
          children: node.children
            ? renameRecursive(node.children, id, name)
            : undefined,
        },
  );
}

function updateParamsRecursive(
  nodes: SceneNode[],
  id: string,
  params: Record<string, unknown>,
): SceneNode[] {
  return nodes.map((node) =>
    node.id === id
      ? { ...node, params: { ...node.params, ...params } }
      : {
          ...node,
          children: node.children
            ? updateParamsRecursive(node.children, id, params)
            : undefined,
        },
  );
}

function findRecursive(
  nodes: SceneNode[],
  id: string | null,
): SceneNode | undefined {
  if (!id) return undefined;
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findRecursive(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

interface EditorState {
  scene: SceneNode[];
  selectedIds: string[];
  canUndo: boolean;
  canRedo: boolean;
  select: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  addNode: (
    type: SceneNodeType,
    params?: Record<string, unknown>,
    name?: string,
  ) => void;
  removeNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  updateNodeParams: (id: string, params: Record<string, unknown>) => void;
  undo: () => void;
  redo: () => void;
  setScene: (scene: SceneNode[]) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  scene: INITIAL_SCENE,
  selectedIds: [],
  canUndo: false,
  canRedo: false,

  select: (id) => set({ selectedIds: id ? [id] : [] }),
  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),

  addNode: (type, params, name) =>
    set((state) => {
      record(state.scene, "add");
      return {
        scene: [
          ...state.scene,
          {
            id: crypto.randomUUID(),
            name: name ?? DEFAULT_NAMES[type],
            type,
            ...(params ? { params } : {}),
          },
        ],
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    }),

  removeNode: (id) =>
    set((state) => {
      record(state.scene, "remove");
      return {
        scene: removeRecursive(state.scene, id),
        selectedIds: state.selectedIds.filter((x) => x !== id),
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    }),

  renameNode: (id, name) =>
    set((state) => {
      record(state.scene, "rename");
      return {
        scene: renameRecursive(state.scene, id, name),
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    }),

  updateNodeParams: (id, params) =>
    set((state) => {
      record(state.scene, "params");
      return {
        scene: updateParamsRecursive(state.scene, id, params),
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    }),

  undo: () =>
    set((state) => {
      const previous = past.pop();
      if (!previous) return {};
      future.push(state.scene);
      lastKind = null;
      lastAt = 0;
      return {
        scene: previous,
        canUndo: past.length > 0,
        canRedo: true,
      };
    }),

  redo: () =>
    set((state) => {
      const next = future.pop();
      if (!next) return {};
      past.push(state.scene);
      lastKind = null;
      lastAt = 0;
      return {
        scene: next,
        canUndo: true,
        canRedo: future.length > 0,
      };
    }),

  setScene: (scene) => {
    resetHistory();
    set({ scene, selectedIds: [], canUndo: false, canRedo: false });
  },
}));

export function findSceneNode(
  nodes: SceneNode[],
  id: string | null,
): SceneNode | undefined {
  return findRecursive(nodes, id);
}
