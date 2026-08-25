import * as TSL from "three/webgpu";
import type { NodeRegistry } from "./types";

/**
 * Builds and returns a registry mapping class names (e.g. 'FloatNode', 'OperatorNode')
 * to their respective Node constructors from 'three/webgpu'.
 */
export function createDefaultNodeRegistry(): NodeRegistry {
  const registry: NodeRegistry = {};

  // Inspect exports from three/webgpu
  for (const [key, value] of Object.entries(TSL)) {
    // Check if export is a constructor class and inherits from Node
    if (
      typeof value === "function" &&
      value.prototype &&
      (value.prototype instanceof TSL.Node || value === TSL.Node)
    ) {
      // console.log(key);
      registry[key] = value as new (...args: any[]) => TSL.Node;

      // Also register under the node's stable `type` (e.g. 'OperatorNode'),
      // since serialization stores `constructor.type`. This keeps lookups
      // working even when an export name differs from the class's `type`
      // (e.g. `SubBuildNode` -> `SubBuild`).
      const type = (value as any).type;
      if (type && registry[type] === undefined) {
        registry[type] = value as new (...args: any[]) => TSL.Node;
      }
    }
  }

  return registry;
}

/**
 * Pre-instantiated default registry containing all standard built-in TSL Node classes.
 */
export const defaultNodeRegistry: NodeRegistry = createDefaultNodeRegistry();
