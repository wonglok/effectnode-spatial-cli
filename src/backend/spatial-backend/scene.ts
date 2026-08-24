import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Shared scene-graph types and pure node operations. This is the backend's
// single source of truth for the scene node shape, used by both the socket
// design API (design-socket.ts) and the CLI (src/index.ts scene subcommands).
// ---------------------------------------------------------------------------

export type SceneNodeType =
  | "group"
  | "mesh"
  | "geometry"
  | "material"
  | "light"
  | "camera"
  | "model"
  | "environment";

export interface SceneNode {
  id: string;
  name: string;
  type: SceneNodeType;
  params?: Record<string, unknown>;
  children?: SceneNode[];
}

export interface Design {
  scene: SceneNode[];
  [key: string]: unknown;
}

export const SCENE_NODE_TYPES: readonly SceneNodeType[] = [
  "group",
  "mesh",
  "geometry",
  "material",
  "light",
  "camera",
  "model",
  "environment",
];

export const DEFAULT_NODE_NAMES: Record<SceneNodeType, string> = {
  group: "Group",
  mesh: "Mesh",
  geometry: "Geometry",
  material: "Material",
  light: "Light",
  camera: "Camera",
  model: "Model",
  environment: "Environment",
};

// --- pure tree operations ---------------------------------------------------

/** Append a node to the end of the scene. */
export function addNode(scene: SceneNode[], node: SceneNode): SceneNode[] {
  return [...scene, node];
}

/** Remove the node with the given id (including any descendants). */
export function removeNode(scene: SceneNode[], id: string): SceneNode[] {
  return scene
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children
        ? { ...node, children: removeNode(node.children, id) }
        : node,
    );
}

/** Rename the node with the given id. */
export function renameNode(
  scene: SceneNode[],
  id: string,
  name: string,
): SceneNode[] {
  return scene.map((node) => {
    const next = node.id === id ? { ...node, name } : node;
    return next.children
      ? { ...next, children: renameNode(next.children, id, name) }
      : next;
  });
}

/** Merge params into the node with the given id. */
export function patchNode(
  scene: SceneNode[],
  id: string,
  params: Record<string, unknown>,
): SceneNode[] {
  return scene.map((node) => {
    const next =
      node.id === id ? { ...node, params: { ...node.params, ...params } } : node;
    return next.children
      ? { ...next, children: patchNode(next.children, id, params) }
      : next;
  });
}

// --- validation (used by the CLI to reject malformed agent input) ------------

export function isSceneNodeType(value: unknown): value is SceneNodeType {
  return (
    typeof value === "string" &&
    (SCENE_NODE_TYPES as readonly string[]).includes(value)
  );
}

/** Strict check: a node must carry string id + name and a valid type. */
export function isSceneNode(value: unknown): value is SceneNode {
  if (typeof value !== "object" || value === null) return false;
  const node = value as Record<string, unknown>;
  if (typeof node.id !== "string") return false;
  if (typeof node.name !== "string") return false;
  if (!isSceneNodeType(node.type)) return false;
  if (
    node.params !== undefined &&
    (typeof node.params !== "object" || node.params === null)
  ) {
    return false;
  }
  if (node.children !== undefined) {
    if (!Array.isArray(node.children)) return false;
    if (!node.children.every(isSceneNode)) return false;
  }
  return true;
}

export function isSceneArray(value: unknown): value is SceneNode[] {
  return Array.isArray(value) && value.every(isSceneNode);
}

/**
 * Coerce agent input into a valid node, filling in `id`/`name` defaults. Used by
 * `scene add`, where an agent may supply just `{ type, params }`.
 */
export function coerceNode(value: unknown): SceneNode {
  if (typeof value !== "object" || value === null) {
    throw new Error("Expected a scene node object");
  }
  const input = value as Record<string, unknown>;
  if (!isSceneNodeType(input.type)) {
    throw new Error(
      `Invalid node type "${String(input.type)}" (expected one of ${SCENE_NODE_TYPES.join(", ")})`,
    );
  }
  const node: SceneNode = {
    id: typeof input.id === "string" ? input.id : randomUUID(),
    name:
      typeof input.name === "string" && input.name
        ? input.name
        : DEFAULT_NODE_NAMES[input.type],
    type: input.type,
  };
  if (input.params !== undefined) {
    if (typeof input.params !== "object" || input.params === null) {
      throw new Error("node.params must be an object");
    }
    node.params = input.params as Record<string, unknown>;
  }
  if (input.children !== undefined) {
    if (!Array.isArray(input.children)) {
      throw new Error("node.children must be an array");
    }
    node.children = input.children.map(coerceNode);
  }
  return node;
}
