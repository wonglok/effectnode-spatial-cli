import type { Node } from "three/webgpu";

export interface SerializedNode {
  id: string;
  type: string; // Class name (e.g., 'FloatNode', 'ColorNode', 'OperatorNode')
  value?: any; // Value stored on uniform / constant nodes
  properties: Record<string, any>; // Primitive properties (e.g. 'op', 'nodeType')
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
}

export type NodeRegistry = Record<string, new (...args: any[]) => Node>;
