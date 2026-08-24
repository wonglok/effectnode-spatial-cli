import {
  Color,
  Matrix3,
  Matrix4,
  Node,
  NodeMaterial,
  Vector2,
  Vector3,
  Vector4,
} from "three/webgpu";
import {
  MaterialGraphJSON,
  SerializedNode,
  SerializedEdge,
  NodeRegistry,
} from "./types";
import { defaultNodeRegistry } from "./nodeRegistry";

// ---------------------------------------------------------------------------
// Node `value` codec. Node values can be primitives (numbers/strings/bools) or
// three.js objects (Color, Vector2/3/4, Matrix3/4). JSON can only carry the
// former, so complex values are wrapped in a `{ __type, value }` envelope.
// This keeps parse -> hydrate and parse -> jsonToCode both lossless.
// ---------------------------------------------------------------------------

type SerializedComplexValue =
  | { __type: "color"; value: number }
  | { __type: "vec2" | "vec3" | "vec4"; value: number[] }
  | { __type: "mat3" | "mat4"; value: number[] };

function serializeNodeValue(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  const type = typeof value;
  if (
    type === "number" ||
    type === "string" ||
    type === "boolean" ||
    type === "bigint"
  ) {
    return value;
  }
  const v = value as Record<string, any>;
  if (v.isColor === true) return { __type: "color", value: v.getHex() };
  if (v.isVector2 === true) return { __type: "vec2", value: [v.x, v.y] };
  if (v.isVector3 === true)
    return { __type: "vec3", value: [v.x, v.y, v.z] };
  if (v.isVector4 === true)
    return { __type: "vec4", value: [v.x, v.y, v.z, v.w] };
  if (v.isMatrix3 === true)
    return { __type: "mat3", value: Array.from(v.elements) };
  if (v.isMatrix4 === true)
    return { __type: "mat4", value: Array.from(v.elements) };
  return undefined;
}

function deserializeNodeValue(value: unknown): unknown {
  if (value && typeof value === "object" && "__type" in (value as object)) {
    const { __type, value: inner } = value as SerializedComplexValue;
    switch (__type) {
      case "color":
        return new Color(inner as number);
      case "vec2":
        return new Vector2(...(inner as number[]));
      case "vec3":
        return new Vector3(...(inner as number[]));
      case "vec4":
        return new Vector4(...(inner as number[]));
      case "mat3":
        return new Matrix3().fromArray(inner as number[]);
      case "mat4":
        return new Matrix4().fromArray(inner as number[]);
      default:
        return value;
    }
  }
  return value;
}

const MATERIAL_SLOTS = [
  "colorNode",
  "opacityNode",
  "alphaTestNode",
  "normalNode",
  "emissiveNode",
  "metalnessNode",
  "roughnessNode",
  "clearcoatNode",
  "clearcoatRoughnessNode",
  "clearcoatNormalNode",
  "sheenNode",
  "sheenRoughnessNode",
  "transmissionNode",
  "thicknessNode",
  "iorNode",
  "iridescenceNode",
  "iridescenceIORNode",
  "iridescenceThicknessNode",
  "specularIntensityNode",
  "specularColorNode",
  "positionNode",
];

/**
 * Serializes a Three.js TSL NodeMaterial into a node and edge graph representation.
 */
export function parseNodeMaterialToJSON(
  material: NodeMaterial,
): MaterialGraphJSON {
  const nodesMap = new Map<string, SerializedNode>();
  const edges: SerializedEdge[] = [];
  const nodeToIdMap = new Map<Node, string>();
  const materialSlots: Record<string, string> = {};

  let idCounter = 0;

  function getOrCreateNodeId(node: Node): string {
    if (!nodeToIdMap.has(node)) {
      const typeName = node.constructor.name;
      const id = `node_${++idCounter}_${typeName}`;
      nodeToIdMap.set(node, id);
    }
    return nodeToIdMap.get(node)!;
  }

  function traverse(node: Node): string {
    if (!node || typeof node !== "object") return "";

    const nodeId = getOrCreateNodeId(node);
    if (nodesMap.has(nodeId)) {
      return nodeId;
    }

    const serializedNode: SerializedNode = {
      id: nodeId,
      type: node.constructor.name,
      properties: {},
    };

    nodesMap.set(nodeId, serializedNode);

    // Capture node values (scalars, colors, vectors, matrices) in a JSON-safe
    // form so colors/vectors don't get dropped by JSON.stringify.
    if ("value" in node) {
      const serializedValue = serializeNodeValue((node as any).value);
      if (serializedValue !== undefined) {
        serializedNode.value = serializedValue;
      }
    }

    // Process properties and child nodes
    for (const key of Object.keys(node)) {
      if (key.startsWith("_") || key === "uuid") continue;

      const val = (node as any)[key];

      if (val instanceof Node) {
        const childId = traverse(val);
        edges.push({
          id: `edge_${childId}_to_${nodeId}_${key}`,
          source: childId,
          target: nodeId,
          targetHandle: key,
        });
      } else if (Array.isArray(val)) {
        val.forEach((item, index) => {
          if (item instanceof Node) {
            const childId = traverse(item);
            edges.push({
              id: `edge_${childId}_to_${nodeId}_${key}_${index}`,
              source: childId,
              target: nodeId,
              targetHandle: `${key}[${index}]`,
            });
          }
        });
      } else if (
        val !== null &&
        typeof val !== "function" &&
        typeof val !== "object"
      ) {
        serializedNode.properties[key] = val;
      }
    }

    return nodeId;
  }

  const matObj = material as any;
  for (const slot of MATERIAL_SLOTS) {
    if (matObj[slot] && matObj[slot] instanceof Node) {
      const nodeId = traverse(matObj[slot]);
      materialSlots[slot] = nodeId;
    }
  }

  return {
    materialType: material.constructor.name,
    rootNodeId: Object.values(materialSlots)[0] || "",
    materialSlots,
    nodes: Array.from(nodesMap.values()),
    edges,
  };
}

/**
 * Hydrates a serialized Node/Edge JSON graph back into a active Three.js TSL NodeMaterial.
 */
export function hydrateJSONToNodeMaterial<T extends NodeMaterial>(
  json: MaterialGraphJSON,
  MaterialClass: new () => T,
  registry: NodeRegistry = defaultNodeRegistry,
): T {
  const material = new MaterialClass();
  const instantiatedNodes = new Map<string, Node>();

  // 1. Instantiate nodes using registry
  for (const serializedNode of json.nodes) {
    const NodeCtor = registry[serializedNode.type];
    if (!NodeCtor) {
      console.warn(
        `Node class "${serializedNode.type}" was not found in registry. Skipping node.`,
      );
      continue;
    }

    let nodeInstance: Node;

    // Handle initial constructor arguments or fallback instantiation
    if (serializedNode.value !== undefined) {
      nodeInstance = new (NodeCtor as any)(
        deserializeNodeValue(serializedNode.value),
      );
    } else {
      nodeInstance = new NodeCtor();
    }

    Object.assign(nodeInstance, serializedNode.properties);
    instantiatedNodes.set(serializedNode.id, nodeInstance);
  }

  // 2. Connect inputs and edges
  for (const edge of json.edges) {
    const sourceNode = instantiatedNodes.get(edge.source);
    const targetNode = instantiatedNodes.get(edge.target);

    if (sourceNode && targetNode) {
      if (edge.targetHandle.includes("[")) {
        const [propName, indexStr] = edge.targetHandle
          .split(/\[|\]/)
          .filter(Boolean);
        const idx = parseInt(indexStr, 10);
        if (!(targetNode as any)[propName]) {
          (targetNode as any)[propName] = [];
        }
        (targetNode as any)[propName][idx] = sourceNode;
      } else {
        (targetNode as any)[edge.targetHandle] = sourceNode;
      }
    }
  }

  // 3. Attach back to material root slots
  const matObj = material as any;
  for (const [slotName, nodeId] of Object.entries(json.materialSlots)) {
    const rootNode = instantiatedNodes.get(nodeId);
    if (rootNode) {
      matObj[slotName] = rootNode;
    }
  }

  return material;
}
