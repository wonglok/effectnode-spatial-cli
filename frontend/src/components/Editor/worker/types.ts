import type { Node } from "three/webgpu";

export interface SerializedNode {
  id: string; // Node uuid (stable across serialization)
  type: string; // Stable node type from the class's static `type` getter (e.g. 'OperatorNode')
  data: Record<string, any>; // Output of node.serialize(): `inputNodes` (child uuids) + class fields
  customData: Record<string, any>; // Primitive own-props not covered by serialize (e.g. VarNode.intent)
}

export interface SerializedEdge {
  id: string;
  source: string; // Source Node ID
  target: string; // Target Node ID
  targetHandle: string; // Target node property key or array channel
}

export interface MaterialGraphJSON {
  materialType: string;
  rootNodeId: string;
  materialSlots: Record<string, string>; // Maps slot (e.g. 'colorNode') -> Node ID
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  // Original TSL source code, captured when the graph contains `TSL.Fn` nodes
  // whose JS bodies cannot be reconstructed from the node graph alone.
  sourceCode?: string;
}

export type NodeRegistry = Record<string, new (...args: any[]) => Node>;
