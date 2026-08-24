import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { color, float, mul, smoothstep, vec3 } from "three/tsl";
import { parseNodeMaterialToJSON } from "./materialParser";
import { jsonToCode, nodeExpression } from "./jsonToCode";

// Build TSL Material — a slightly richer graph so the emitted code shows
// constants, an operator, a math function and a swizzle.
const material = new MeshPhysicalNodeMaterial();
material.colorNode = mul(
  color(0x33aaff).rgb,
  smoothstep(float(0.2), float(0.8), vec3(0.5, 0.5, 0.5)),
);
material.roughnessNode = float(0.35);

// Parse -> JSON
const jsonGraph = parseNodeMaterialToJSON(material);

// JSON -> TSL source code. `jsonToCode` is the deterministic inverse of
// `parseNodeMaterialToJSON`: it emits editable TSL that rebuilds the graph.
const tslSource = jsonToCode(jsonGraph);
console.log(tslSource);
// -> import { color, float, mul, smoothstep, vec3 } from "three/tsl";
//    import { MeshPhysicalNodeMaterial } from "three/webgpu";
//
//    export function buildMaterial() {
//      const material = new MeshPhysicalNodeMaterial();
//      material.colorNode = mul(color(0x33aaff).xyz, smoothstep(float(0.2), float(0.8), vec3(0.5, 0.5, 0.5)));
//      material.roughnessNode = float(0.35);
//      return material;
//    }

// Single-node expression (useful for testing/debugging a specific node).
const rootExpression = nodeExpression(jsonGraph, jsonGraph.rootNodeId);
console.log(rootExpression);
// -> mul(color(0x33aaff).xyz, smoothstep(float(0.2), float(0.8), vec3(0.5, 0.5, 0.5)))
