import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MaterialGraphJSON, SerializedNode } from "./worker/types";

// ---------------------------------------------------------------------------
// A React Flow (@xyflow/react) node-graph editor for a serialized TSL
// NodeMaterial. It reads the same `MaterialGraphJSON` produced by
// `materialParser.parseNodeMaterialToJSON` and renders the node graph as
// editable, pannable/zoomable nodes. Child links come from each node's
// `data.inputNodes` (the `edges` field is vestigial in the current format).
// ---------------------------------------------------------------------------

type TSLNodeData = {
  label: string;
  sublabel?: string;
  kind?: string;
};

// Color the node border by its semantic kind (fallback: neutral slate).
const KIND_STYLES: Record<string, string> = {
  operator: "border-amber-500/60",
  attribute: "border-emerald-500/60",
  const: "border-sky-500/60",
  join: "border-violet-500/60",
  convert: "border-cyan-500/60",
  math: "border-rose-500/60",
  split: "border-teal-500/60",
  var: "border-slate-500/60",
};

function fmt(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

/** Human-readable label + sublabel for a serialized node. */
function describeNode(node: SerializedNode): TSLNodeData {
  const data = node.data ?? {};
  const custom = node.customData ?? {};

  switch (node.type) {
    case "ConstNode":
      return {
        kind: "const",
        label: "const",
        sublabel: `${data.valueType ?? "float"} ${fmt(data.value)}`,
      };
    case "AttributeNode":
      return {
        kind: "attribute",
        label: "attribute",
        sublabel: String(data._attributeName ?? ""),
      };
    case "OperatorNode":
      return {
        kind: "operator",
        label: String(data.op ?? ""),
        sublabel: "operator",
      };
    case "SplitNode":
      return {
        kind: "split",
        label: `.${data.components ?? ""}`,
        sublabel: "swizzle",
      };
    case "JoinNode":
      return {
        kind: "join",
        label: String(custom.nodeType ?? data.nodeType ?? "join"),
        sublabel: "join",
      };
    case "ConvertNode":
      return {
        kind: "convert",
        label: `→ ${data.convertTo ?? ""}`,
        sublabel: "convert",
      };
    case "MathNode":
      return {
        kind: "math",
        label: String(data.method ?? "math"),
        sublabel: "math",
      };
    case "VarNode":
      return {
        kind: "var",
        label: custom.readOnly ? "const" : "var",
        sublabel: custom.name ? String(custom.name) : "",
      };
    case "VertexColorNode":
      return {
        kind: "attribute",
        label: "vertexColor",
        sublabel: `#${data.index ?? 0}`,
      };
    case "FrontFacingNode":
      return { kind: "attribute", label: "frontFacing", sublabel: "bool" };
    case "IndexNode":
      return {
        kind: "attribute",
        label: custom.scope === "vertex" ? "vertexIndex" : "instanceIndex",
        sublabel: "index",
      };
    case "ConditionalNode":
      return { kind: "math", label: "select", sublabel: "ternary" };
    case "VaryingNode":
      return {
        kind: "var",
        label: "varying",
        sublabel: custom.name ? String(custom.name) : "",
      };
    case "MemberNode":
      return {
        kind: "convert",
        label: `.${custom.property ?? data.property ?? ""}`,
        sublabel: "member",
      };
    case "ArrayElementNode":
      return { kind: "convert", label: "[]", sublabel: "element" };
    default:
      return { kind: node.type, label: node.type };
  }
}

/**
 * Follows transparent intent `VarNode`s (created by `nodeProxyIntent`) down to
 * the expression they wrap, so the graph shows the real structure instead of a
 * `VarNode` wrapper on every operation.
 */
function resolveId(id: string, nodeMap: Map<string, SerializedNode>): string {
  let cur = id;
  const seen = new Set<string>();
  while (!seen.has(cur)) {
    seen.add(cur);
    const n = nodeMap.get(cur);
    if (n && n.type === "VarNode" && n.customData?.intent === true) {
      cur = n.data?.inputNodes?.node ?? cur;
    } else {
      break;
    }
  }
  return cur;
}

/** Layered layout: material at the bottom, inputs fan out above. */
function layout(nodes: Node[], edges: Edge[], rootId: string): void {
  const depth = new Map<string, number>();
  depth.set(rootId, 0);

  const children = new Map<string, string[]>();
  for (const e of edges) {
    const list = children.get(e.target) ?? [];
    list.push(e.source);
    children.set(e.target, list);
  }

  const queue = [rootId];
  while (queue.length) {
    const id = queue.shift()!;
    const d = depth.get(id)!;
    for (const childId of children.get(id) ?? []) {
      if (!depth.has(childId)) {
        depth.set(childId, d + 1);
        queue.push(childId);
      }
    }
  }

  let maxDepth = 0;
  for (const d of depth.values()) maxDepth = Math.max(maxDepth, d);

  const byDepth = new Map<number, string[]>();
  for (const n of nodes) {
    const d = depth.get(n.id) ?? 0;
    const list = byDepth.get(d) ?? [];
    list.push(n.id);
    byDepth.set(d, list);
  }

  const X = 220;
  const Y = 90;
  for (const [d, ids] of byDepth) {
    const total = ids.length;
    ids.forEach((id, i) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      node.position = {
        x: i * X - ((total - 1) * X) / 2,
        y: (maxDepth - d) * Y,
      };
    });
  }
}

function graphToFlow(json: MaterialGraphJSON): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodeMap = new Map<string, SerializedNode>();
  for (const n of json.nodes) nodeMap.set(n.id, n);

  const resolve = (id: string): string => resolveId(id, nodeMap);

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const materialId = "__material__";

  // Material root node.
  nodes.push({
    id: materialId,
    type: "materialNode",
    position: { x: 0, y: 0 },
    data: { label: json.materialType ?? "Material" },
  });

  // Display nodes (skip collapsed intent VarNodes).
  for (const n of json.nodes) {
    if (n.type === "VarNode" && n.customData?.intent === true) continue;
    nodes.push({
      id: n.id,
      type: "tslNode",
      position: { x: 0, y: 0 },
      data: describeNode(n),
    });
  }

  // Child links from `data.inputNodes` (source = input, target = consumer).
  for (const n of json.nodes) {
    if (n.type === "VarNode" && n.customData?.intent === true) continue;
    const inputNodes = n.data?.inputNodes ?? {};
    for (const [key, ref] of Object.entries(inputNodes)) {
      if (Array.isArray(ref)) {
        ref.forEach((childId, i) => {
          if (typeof childId !== "string") return;
          edges.push({
            id: `${childId}->${n.id}:${key}[${i}]`,
            source: resolve(childId),
            target: resolve(n.id),
            label: `${key}[${i}]`,
            type: "smoothstep",
          });
        });
      } else if (typeof ref === "string") {
        edges.push({
          id: `${ref}->${n.id}:${key}`,
          source: resolve(ref),
          target: resolve(n.id),
          label: key,
          type: "smoothstep",
        });
      }
    }
  }

  // Material slots feed the material root.
  for (const [slot, nodeId] of Object.entries(json.materialSlots)) {
    edges.push({
      id: `${nodeId}->${materialId}:${slot}`,
      source: resolve(nodeId),
      target: materialId,
      label: slot,
      type: "smoothstep",
    });
  }

  layout(nodes, edges, materialId);
  return { nodes, edges };
}

function TSLNodeView({ data }: NodeProps) {
  const d = data as TSLNodeData;
  const border = KIND_STYLES[d.kind ?? ""] ?? "border-slate-600/70";
  return (
    <div
      className={`min-w-[90px] rounded-lg border bg-slate-800 px-3 py-2 shadow-md ${border}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <div className="font-mono text-xs font-semibold text-slate-100">
        {d.label}
      </div>
      {d.sublabel ? (
        <div className="max-w-[140px] truncate font-mono text-[10px] text-slate-400">
          {d.sublabel}
        </div>
      ) : null}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-slate-500"
      />
    </div>
  );
}

function MaterialNodeView({ data }: NodeProps) {
  const d = data as TSLNodeData;
  return (
    <div className="min-w-[160px] rounded-lg border border-blue-500/70 bg-blue-950/80 px-4 py-2 text-center shadow-md">
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div className="font-mono text-xs font-bold text-blue-100">{d.label}</div>
      <div className="font-mono text-[10px] text-blue-300/70">material</div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  tslNode: TSLNodeView,
  materialNode: MaterialNodeView,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: "arrowclosed" as const, color: "#64748b" },
  style: { stroke: "#64748b", strokeWidth: 1.5 },
};

export function GraphNodeUI({ json }: { json: MaterialGraphJSON }) {
  const { nodes, edges } = useMemo(() => graphToFlow(json), [json]);

  return (
    <div className="h-full w-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-slate-950"
      >
        <Background color="#1e293b" gap={20} />
        <Controls className="!bg-slate-900 !text-slate-200" />
        {/* <MiniMap
          pannable
          zoomable
          nodeColor={(n) => {
            const kind = (n.data as TSLNodeData).kind;
            return kind === "operator" ? "#f59e0b" : "#475569";
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          className="!bg-slate-900"
        /> */}
      </ReactFlow>
    </div>
  );
}
