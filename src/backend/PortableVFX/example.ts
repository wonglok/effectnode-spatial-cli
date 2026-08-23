import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { color, float, mul } from "three/tsl";
import {
  parseNodeMaterialToJSON,
  hydrateJSONToNodeMaterial,
} from "./materialParser";
import { defaultNodeRegistry } from "./nodeRegistry";

// Build TSL Material
const material = new MeshPhysicalNodeMaterial();
material.colorNode = mul(color(0x00ff00).rgb, float(2.0));
material.roughnessNode = float(0.4);

// Parse -> JSON
const jsonGraph = parseNodeMaterialToJSON(material);

// Hydrate -> Re-created Material using auto-populated registry
const restoredMaterial = hydrateJSONToNodeMaterial(
  jsonGraph,
  MeshPhysicalNodeMaterial,
  defaultNodeRegistry,
);

//
