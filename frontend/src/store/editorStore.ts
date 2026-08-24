import { create } from "zustand";
import type { SceneNode, SceneNodeType } from "../sdk/types/scene";
import { designSocket } from "../lib/designSocket";

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
  // Remote-apply actions: update state from a broadcast WITHOUT emitting and
  // WITHOUT touching undo history (the originating client owns the history).
  applyNodeAdded: (node: SceneNode) => void;
  applyNodeRemoved: (id: string) => void;
  applyNodeRenamed: (id: string, name: string) => void;
  applyNodePatched: (id: string, params: Record<string, unknown>) => void;
  applySceneReplaced: (scene: SceneNode[]) => void;
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

  addNode: (type, params, name) => {
    const node: SceneNode = {
      id: crypto.randomUUID(),
      name: name ?? DEFAULT_NAMES[type],
      type,
      ...(params ? { params } : {}),
    };
    set((state) => {
      record(state.scene, "add");
      return {
        scene: [...state.scene, node],
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    });
    designSocket.emitSceneAdd(node);
  },

  removeNode: (id) => {
    set((state) => {
      record(state.scene, "remove");
      return {
        scene: removeRecursive(state.scene, id),
        selectedIds: state.selectedIds.filter((x) => x !== id),
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    });
    designSocket.emitSceneRemove(id);
  },

  renameNode: (id, name) => {
    set((state) => {
      record(state.scene, "rename");
      return {
        scene: renameRecursive(state.scene, id, name),
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    });
    designSocket.emitSceneRename(id, name);
  },

  updateNodeParams: (id, params) => {
    set((state) => {
      record(state.scene, "params");
      return {
        scene: updateParamsRecursive(state.scene, id, params),
        canUndo: past.length > 0,
        canRedo: future.length > 0,
      };
    });
    designSocket.emitScenePatch(id, params);
  },

  undo: () => {
    const previous = past.pop();
    if (!previous) return;
    future.push(useEditorStore.getState().scene);
    lastKind = null;
    lastAt = 0;
    set({ scene: previous, canUndo: past.length > 0, canRedo: true });
    designSocket.emitSceneReplace(previous);
  },

  redo: () => {
    const next = future.pop();
    if (!next) return;
    past.push(useEditorStore.getState().scene);
    lastKind = null;
    lastAt = 0;
    set({ scene: next, canUndo: true, canRedo: future.length > 0 });
    designSocket.emitSceneReplace(next);
  },

  setScene: (scene) => {
    resetHistory();
    set({ scene, selectedIds: [], canUndo: false, canRedo: false });
  },

  applyNodeAdded: (node) =>
    set((state) => ({
      scene: [...state.scene, node],
    })),

  applyNodeRemoved: (id) =>
    set((state) => ({
      scene: removeRecursive(state.scene, id),
      selectedIds: state.selectedIds.filter((x) => x !== id),
    })),

  applyNodeRenamed: (id, name) =>
    set((state) => ({
      scene: renameRecursive(state.scene, id, name),
    })),

  applyNodePatched: (id, params) =>
    set((state) => ({
      scene: updateParamsRecursive(state.scene, id, params),
    })),

  applySceneReplaced: (scene) =>
    set(() => ({
      scene,
    })),
}));

export function findSceneNode(
  nodes: SceneNode[],
  id: string | null,
): SceneNode | undefined {
  return findRecursive(nodes, id);
}
