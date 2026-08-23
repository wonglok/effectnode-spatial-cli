import { create } from "zustand";
import type { SceneNode, SceneNodeType } from "../types/scene";

const DEFAULT_NAMES: Record<SceneNodeType, string> = {
  group: "Group",
  mesh: "Mesh",
  geometry: "Geometry",
  material: "Material",
  light: "Light",
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

interface EditorState {
  scene: SceneNode[];
  selectedId: string | null;
  select: (id: string | null) => void;
  addNode: (
    type: SceneNodeType,
    params?: Record<string, unknown>,
    name?: string,
  ) => void;
  removeNode: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  updateNodeParams: (id: string, params: Record<string, unknown>) => void;
  setScene: (scene: SceneNode[]) => void;
}

export const useEditorStore = create<EditorState>()((set) => ({
  scene: INITIAL_SCENE,
  selectedId: "box-mesh",

  select: (id) => set({ selectedId: id }),

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
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  renameNode: (id, name) =>
    set((state) => ({ scene: renameRecursive(state.scene, id, name) })),

  updateNodeParams: (id, params) =>
    set((state) => ({
      scene: updateParamsRecursive(state.scene, id, params),
    })),

  setScene: (scene) => set({ scene, selectedId: scene[0]?.id ?? null }),
}));

export function findSceneNode(
  nodes: SceneNode[],
  id: string | null,
): SceneNode | undefined {
  return findRecursive(nodes, id);
}
