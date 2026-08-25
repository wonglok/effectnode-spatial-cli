import { Node, NodeMaterial } from "three/webgpu";
import * as THREE from "three/webgpu";
import * as TSL from "three/tsl";
import { MaterialGraphJSON, SerializedNode, NodeRegistry } from "./types";
import { defaultNodeRegistry } from "./nodeRegistry";
Node.captureStackTrace = true;
/**
 * Returns a stable type identifier for a node. Prefers the instance `type`
 * getter (which delegates to the class's `static get type()`, e.g.
 * 'OperatorNode') over `constructor.name`, because bundlers (Vite/rollup) can
 * rename class bindings (e.g. `OperatorNode` -> `_OperatorNode`) when the node
 * classes are re-exported through `three/tsl`, which would break registry
 * lookups.
 */
function getNodeTypeName(node: Node): string {
  return (node as any).type ?? node.constructor.name;
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
 * Serializes a Three.js TSL NodeMaterial into a node graph representation.
 *
 * Delegates the per-node serialization to each node's own `serialize()` method
 * (the same contract used by three.js' `Node.toJSON`/`NodeLoader`), which
 * records child-node references under `inputNodes` plus class-specific fields
 * (e.g. `OperatorNode.op`, `InputNode.value`, `AttributeNode._attributeName`).
 *
 * Some node classes (e.g. `VarNode`, `JoinNode`) do not override `serialize`,
 * so we also capture any remaining primitive own-properties as `customData` to
 * keep the round-trip lossless (e.g. `VarNode.intent`, `JoinNode.nodeType`).
 */
export function parseNodeMaterialToJSON(
  material: NodeMaterial,
  sourceCode?: string,
): MaterialGraphJSON {
  const materialSlots: Record<string, string> = {};
  const liveNodes: Node[] = [];
  const seen = new Set<Node>();
  const matObj = material as any;
  let hasFn = false;
  let hasTime = false;

  function collect(node: Node): void {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if ((node as any).isShaderCallNodeInternal || (node as any).isFn) hasFn = true;
    // Time / timer / animated uniforms register a per-frame update whose
    // callback is a function and therefore not serializable — flag them so the
    // source can be re-evaluated on hydrate.
    if ((node as any).updateType === "render") hasTime = true;
    liveNodes.push(node);
    for (const { childNode } of (node as any).getSerializeChildren()) {
      collect(childNode);
    }
  }

  for (const slot of MATERIAL_SLOTS) {
    const node = matObj[slot];
    if (node && node instanceof Node) {
      collect(node);
      materialSlots[slot] = node.uuid;
    }
  }

  const nodes: SerializedNode[] = liveNodes.map((node) => {
    // Let the node serialize itself. `inputNodes` records child references by
    // their uuid, which doubles as the node id used below.
    const data: Record<string, any> = { meta: { nodes: {}, textures: {} } };
    (node as any).serialize(data);
    delete data.meta;

    // Capture primitive own-properties that `serialize()` did not cover, so
    // state like `VarNode.intent`/`name`/`readOnly` and `JoinNode.nodeType`
    // survives (these classes have no serialize/deserialize override).
    const customData: Record<string, any> = {};
    for (const key of Object.getOwnPropertyNames(node)) {
      if (key.startsWith("_") || key === "uuid" || key === "id") continue;
      if (key in data) continue;
      const val = (node as any)[key];
      if (
        val !== null &&
        typeof val !== "function" &&
        typeof val !== "object"
      ) {
        customData[key] = val;
      }
    }

    return { id: node.uuid, type: getNodeTypeName(node), data, customData };
  });

  return {
    materialType: material.type ?? material.constructor.name,
    rootNodeId: Object.values(materialSlots)[0] || "",
    materialSlots,
    nodes,
    // Child links now live in each node's `data.inputNodes`; kept for the
    // MaterialGraphJSON shape (see backend `MaterialGraph`).
    edges: [],
    // TSL.Fn bodies and time/timer uniforms can't be reconstructed from the
    // graph, so carry the original source for the hydrate step to re-evaluate.
    ...(sourceCode && (hasFn || hasTime) ? { sourceCode } : {}),
  };
}

/**
 * Hydrates a serialized Node/Edge JSON graph back into an active Three.js TSL
 * NodeMaterial. Mirrors three.js' `NodeLoader`: instantiate each node with an
 * empty constructor, then call its `deserialize()` to restore child links and
 * class fields, then re-apply `customData` for fields `deserialize` ignores.
 */
export function hydrateJSONToNodeMaterial<T extends NodeMaterial>(
  json: MaterialGraphJSON,
  MaterialClass: new () => T,
  registry: NodeRegistry = defaultNodeRegistry,
  sameMaterial?: any,
): T {
  const material = sameMaterial || new MaterialClass();
  const nodeById = new Map<string, Node>();

  // 1. Instantiate nodes using the registry (state is restored via deserialize).
  for (const serializedNode of json.nodes) {
    const NodeCtor = registry[serializedNode.type];
    if (!NodeCtor) {
      console.warn(
        `Node class "${serializedNode.type}" was not found in registry. Skipping node.`,
      );
      continue;
    }

    const nodeInstance = new (NodeCtor as any)();
    // `uuid` is a getter-only property backed by `_uuid`.
    (nodeInstance as any)._uuid = serializedNode.id;
    nodeById.set(serializedNode.id, nodeInstance);
  }

  // 2. Deserialize each node (links children via `inputNodes` + restores fields).
  const meta = { nodes: Object.fromEntries(nodeById), textures: {} };
  for (const serializedNode of json.nodes) {
    const node = nodeById.get(serializedNode.id);
    if (!node) continue;
    (node as any).deserialize({ ...serializedNode.data, meta });
    Object.assign(node, serializedNode.customData);
  }

  // 3. Attach root slots back to the material.
  const matObj = material as any;
  for (const [slotName, nodeId] of Object.entries(json.materialSlots)) {
    const rootNode = nodeById.get(nodeId);
    if (rootNode) {
      matObj[slotName] = rootNode;
    }
  }

  return material;
}

/**
 * Re-evaluates the original TSL source (the same text the editor sends to the
 * worker) to reconstruct a material. Needed for `TSL.Fn`, whose function bodies
 * are arbitrary JS and therefore cannot be rebuilt from the serialized node
 * graph. Mirrors the evaluation logic in `code-and-json.ts`.
 */
export async function evaluateTSLCode(code: string): Promise<any> {
  let importCode = "";
  const lowerArr = "abcdefghijklmnopqrstuvwxyz".split("");
  for (const kn in TSL) {
    if (lowerArr.includes(kn.charAt(0))) {
      importCode += `const ${kn} = TSL["${kn}"]\n`;
    }
  }

  const noImportLines = code
    .split("\n")
    .filter((r) => !r.trim().startsWith("import"));

  const full = `${importCode}\n${noImportLines.join("\n")}`;
  const codeEval = new Function("TSL", "THREE", full);
  const resultFunc = codeEval(TSL, THREE);
  return resultFunc({});
}

/**
 * Returns true when the graph contains `TSL.Fn` nodes (whose bodies are
 * arbitrary JS and cannot be rebuilt from the node graph alone).
 */
function graphHasFn(json: MaterialGraphJSON): boolean {
  return json.nodes.some(
    (n) =>
      n.customData?.isShaderCallNodeInternal === true ||
      n.customData?.isFn === true,
  );
}

function graphHasTime(json: MaterialGraphJSON): boolean {
  return json.nodes.some((n) => n.customData?.updateType === "render");
}

/**
 * Hydrates a material from a graph, re-evaluating the original source only when
 * the graph actually contains `TSL.Fn` nodes or time/timer uniforms (whose
 * per-frame callbacks are functions and can't be rebuilt from the graph). A
 * graph edited in the editor carries a stale `sourceCode` (persisted by the
 * store), so presence of `sourceCode` alone is not enough to decide whether to
 * re-evaluate — that would ignore in-place node edits.
 */
export async function hydrateMaterialAsync<T extends NodeMaterial>(
  json: MaterialGraphJSON,
  MaterialClass: new () => T,
  registry: NodeRegistry = defaultNodeRegistry,
): Promise<any> {
  if (json.sourceCode && (graphHasFn(json) || graphHasTime(json))) {
    return evaluateTSLCode(json.sourceCode);
  }
  return hydrateJSONToNodeMaterial(json, MaterialClass, registry);
}
