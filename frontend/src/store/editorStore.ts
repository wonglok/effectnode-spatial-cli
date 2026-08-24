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

/** Replace a node by id (recursively), appending it at the root if unknown. */
function upsertRecursive(nodes: SceneNode[], node: SceneNode): SceneNode[] {
  const next = nodes.map((n) =>
    n.id === node.id
      ? node
      : {
          ...n,
          children: n.children ? upsertRecursive(n.children, node) : undefined,
        },
  );
  return findRecursive(next, node.id) ? next : [...next, node];
}

interface EditorState {
  scene: SceneNode[];
  selectedIds: string[];
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
  upsertNode: (node: SceneNode) => void;
  setScene: (scene: SceneNode[]) => void;
  /** Active project slug, set by the design page so gizmos can sync over socket. */
  projectId: string | null;
  setProjectId: (projectId: string | null) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  scene: INITIAL_SCENE,
  selectedIds: [],

  select: (id) => set({ selectedIds: id ? [id] : [] }),
  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),

  addNode: (type, params, name) =>
    set((state) => ({
      scene: [
        ...state.scene,
        {
          id: crypto.randomUUID(),
          name: name ?? DEFAULT_NAMES[type],
          type,
          ...(params ? { params } : {}),
        },
      ],
    })),

  removeNode: (id) =>
    set((state) => ({
      scene: removeRecursive(state.scene, id),
      selectedIds: state.selectedIds.filter((x) => x !== id),
    })),

  renameNode: (id, name) =>
    set((state) => ({ scene: renameRecursive(state.scene, id, name) })),

  updateNodeParams: (id, params) =>
    set((state) => ({
      scene: updateParamsRecursive(state.scene, id, params),
    })),

  upsertNode: (node) =>
    set((state) => ({ scene: upsertRecursive(state.scene, node) })),

  setScene: (scene) => set({ scene, selectedIds: [] }),

  projectId: null,
  setProjectId: (projectId) => set({ projectId }),
}));

export function findSceneNode(
  nodes: SceneNode[],
  id: string | null,
): SceneNode | undefined {
  return findRecursive(nodes, id);
}
