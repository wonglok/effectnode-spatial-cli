import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import dagre from "@dagrejs/dagre";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
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
//
// Nodes are draggable and select values (attribute name, numeric constant,
// operator) are editable in place. Every edit mutates the local
// `MaterialGraphJSON` and re-emits the whole graph via
// `onMaterialGraphJSONChange`.
// ---------------------------------------------------------------------------

type Socket = {
  id: string;
  label: string;
};

type TSLNodeData = {
  label: string;
  sublabel?: string;
  kind?: string;
  attributeName?: string;
  constValue?: number;
  valueType?: string;
  op?: string;
  inputs: Socket[];
  outputs: Socket[];
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

const ATTRIBUTE_OPTIONS = [
  "position",
  "normal",
  "tangent",
  "bitangent",
  "uv",
  "uv1",
  "uv2",
  "color",
  "instanceMatrix",
];

const OPERATOR_OPTIONS = [
  "+",
  "-",
  "*",
  "/",
  "%",
  "==",
  "!=",
  "<",
  ">",
  "<=",
  ">=",
  "&&",
  "||",
  "!",
];

/**
 * In-place edit handler. `patch` holds serialized `data` fields (e.g.
 * `{ _attributeName: "position" }`, `{ value: 2.5 }`, `{ op: "+" }`) merged
 * onto the edited node's `data`.
 */
const NodeEditContext = createContext<
  ((id: string, patch: Record<string, unknown>) => void) | undefined
>(undefined);

function fmt(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

/** Human-readable label + sublabel for a serialized node. */
function describeNode(
  node: SerializedNode,
): Omit<TSLNodeData, "inputs" | "outputs"> {
  const data = node.data ?? {};
  const custom = node.customData ?? {};

  switch (node.type) {
    case "ConstNode": {
      const valueType = data.valueType ?? "float";
      const numeric = typeof data.value === "number" ? data.value : undefined;
      return {
        kind: "const",
        label: "const",
        sublabel: `${valueType} ${fmt(data.value)}`,
        constValue: numeric,
        valueType,
      };
    }
    case "AttributeNode":
      return {
        kind: "attribute",
        label: "attribute",
        sublabel: String(data._attributeName ?? ""),
        attributeName: String(data._attributeName ?? ""),
      };
    case "OperatorNode":
      return {
        kind: "operator",
        label: String(data.op ?? ""),
        sublabel: "operator",
        op: String(data.op ?? ""),
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

/** One input socket per `inputNodes` entry (array entries expand to `key[i]`). */
function computeInputSockets(node: SerializedNode): Socket[] {
  const inputNodes = node.data?.inputNodes ?? {};
  const sockets: Socket[] = [];
  for (const [key, ref] of Object.entries(inputNodes)) {
    if (Array.isArray(ref)) {
      ref.forEach((_, i) =>
        sockets.push({ id: `${key}[${i}]`, label: `${key}[${i}]` }),
      );
    } else if (typeof ref === "string") {
      sockets.push({ id: key, label: key });
    }
  }
  return sockets;
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

const NODE_WIDTH = 170;
const NODE_HEIGHT = 60;

/** Dagre horizontal (left-to-right) layout: material ends up on the right. */
function layout(nodes: Node[], edges: Edge[]): void {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: 44,
    ranksep: 130,
    marginx: 20,
    marginy: 20,
  });

  for (const n of nodes) {
    const d = n.data as TSLNodeData;
    const height = Math.max(
      NODE_HEIGHT,
      Math.max(d.inputs?.length ?? 0, d.outputs?.length ?? 0) * 22 + 40,
    );
    g.setNode(n.id, { width: NODE_WIDTH, height });
  }

  for (const e of edges) {
    g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  for (const n of nodes) {
    const pos = g.node(n.id);
    if (!pos) continue;
    n.position = {
      x: (pos.x ?? 0) - (pos.width ?? NODE_WIDTH) / 2,
      y: (pos.y ?? 0) - (pos.height ?? NODE_HEIGHT) / 2,
    };
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

  // Material root node: one input socket per material slot, no output.
  const materialSlots = Object.keys(json.materialSlots);
  nodes.push({
    id: materialId,
    type: "materialNode",
    position: { x: 0, y: 0 },
    data: {
      label: json.materialType ?? "Material",
      inputs: materialSlots.map((slot) => ({ id: slot, label: slot })),
      outputs: [],
    },
  });

  // Display nodes (skip collapsed intent VarNodes).
  for (const n of json.nodes) {
    if (n.type === "VarNode" && n.customData?.intent === true) continue;
    nodes.push({
      id: n.id,
      type: "tslNode",
      position: { x: 0, y: 0 },
      data: {
        ...describeNode(n),
        inputs: computeInputSockets(n),
        outputs: [{ id: "out", label: "" }],
      },
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
          const socketId = `${key}[${i}]`;
          edges.push({
            id: `${childId}->${n.id}:${socketId}`,
            source: resolve(childId),
            sourceHandle: "out",
            target: resolve(n.id),
            targetHandle: socketId,
            label: socketId,
            type: "smoothstep",
          });
        });
      } else if (typeof ref === "string") {
        edges.push({
          id: `${ref}->${n.id}:${key}`,
          source: resolve(ref),
          sourceHandle: "out",
          target: resolve(n.id),
          targetHandle: key,
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
      sourceHandle: "out",
      target: materialId,
      targetHandle: slot,
      label: slot,
      type: "smoothstep",
    });
  }

  layout(nodes, edges);
  return { nodes, edges };
}

function socketTop(index: number, count: number): string {
  return `${((index + 1) / (count + 1)) * 100}%`;
}

/** Returns a new graph with `patch` merged into node `id`'s serialized `data`. */
function applyEdit(
  json: MaterialGraphJSON,
  id: string,
  patch: Record<string, unknown>,
): MaterialGraphJSON {
  return {
    ...json,
    nodes: json.nodes.map((n) =>
      n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
    ),
  };
}

function AttributeSelect({ id, value }: { id: string; value: string }) {
  const edit = useContext(NodeEditContext);
  const options = ATTRIBUTE_OPTIONS.includes(value)
    ? ATTRIBUTE_OPTIONS
    : [value, ...ATTRIBUTE_OPTIONS];

  return (
    <select
      value={value}
      disabled={!edit}
      onChange={(e) => edit?.(id, { _attributeName: e.target.value })}
      className="nodrag mt-0.5 w-full rounded border border-slate-600 bg-slate-700 px-1 py-0.5 font-mono text-[10px] text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ConstInput({ id, value }: { id: string; value: number }) {
  const edit = useContext(NodeEditContext);
  return (
    <input
      type="number"
      step="any"
      value={value}
      disabled={!edit}
      onChange={(e) => {
        const next = e.target.valueAsNumber;
        if (Number.isNaN(next)) return;
        edit?.(id, { value: next });
      }}
      className="nodrag mt-0.5 w-full rounded border border-slate-600 bg-slate-700 px-1 py-0.5 font-mono text-[10px] text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

function OperatorSelect({ id, value }: { id: string; value: string }) {
  const edit = useContext(NodeEditContext);
  const options = OPERATOR_OPTIONS.includes(value)
    ? OPERATOR_OPTIONS
    : [value, ...OPERATOR_OPTIONS];

  return (
    <select
      value={value}
      disabled={!edit}
      onChange={(e) => edit?.(id, { op: e.target.value })}
      className="nodrag mt-0.5 w-full rounded border border-slate-600 bg-slate-700 px-1 py-0.5 font-mono text-[10px] text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function TSLNodeView({ id, data }: NodeProps) {
  const d = data as TSLNodeData;
  const inputs = d.inputs ?? [];
  const outputs = d.outputs ?? [];
  const border = KIND_STYLES[d.kind ?? ""] ?? "border-slate-600/70";

  return (
    <div
      className={`relative min-w-[150px] rounded-lg border bg-slate-800 px-6 py-2 shadow-md ${border}`}
    >
      {inputs.map((s, i) => (
        <span
          key={`in-${s.id}`}
          className="absolute left-2 -translate-y-1/2 font-mono text-[9px] text-slate-400"
          style={{ top: socketTop(i, inputs.length) }}
        >
          {s.label}
        </span>
      ))}
      {inputs.map((s, i) => (
        <Handle
          key={`inh-${s.id}`}
          id={s.id}
          type="target"
          position={Position.Left}
          style={{ top: socketTop(i, inputs.length) }}
          className="bg-slate-500!"
        />
      ))}

      <div className="text-center">
        <div className="font-mono text-xs font-semibold text-slate-100">
          {d.label}
        </div>
        {d.attributeName !== undefined ? (
          <AttributeSelect id={id} value={d.attributeName} />
        ) : d.constValue !== undefined ? (
          <ConstInput id={id} value={d.constValue} />
        ) : d.op !== undefined ? (
          <OperatorSelect id={id} value={d.op} />
        ) : d.sublabel ? (
          <div className="mx-auto max-w-[130px] truncate font-mono text-[10px] text-slate-400">
            {d.sublabel}
          </div>
        ) : null}
      </div>

      {outputs.map((s, i) => (
        <span
          key={`out-${s.id}`}
          className="absolute right-2 -translate-y-1/2 font-mono text-[9px] text-slate-400"
          style={{ top: socketTop(i, outputs.length) }}
        >
          {s.label}
        </span>
      ))}
      {outputs.map((s, i) => (
        <Handle
          key={`outh-${s.id}`}
          id={s.id}
          type="source"
          position={Position.Right}
          style={{ top: socketTop(i, outputs.length) }}
          className="bg-slate-500!"
        />
      ))}
    </div>
  );
}

function MaterialNodeView({ data }: NodeProps) {
  const d = data as TSLNodeData;
  const inputs = d.inputs ?? [];

  return (
    <div className="relative min-w-[160px] rounded-lg border border-blue-500/70 bg-blue-950/80 px-6 py-3 text-center shadow-md">
      {inputs.map((s, i) => (
        <span
          key={`in-${s.id}`}
          className="absolute left-2 -translate-y-1/2 font-mono text-[9px] text-blue-300/80"
          style={{ top: socketTop(i, inputs.length) }}
        >
          {s.label}
        </span>
      ))}
      {inputs.map((s, i) => (
        <Handle
          key={`inh-${s.id}`}
          id={s.id}
          type="target"
          position={Position.Left}
          style={{ top: socketTop(i, inputs.length) }}
          className="bg-blue-400!"
        />
      ))}
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

export function GraphNodeUI({
  json,
  onMaterialGraphJSONChange,
  readOnly = false,
}: {
  json: MaterialGraphJSON;
  onMaterialGraphJSONChange?: (json: MaterialGraphJSON) => void;
  readOnly?: boolean;
}) {
  const jsonRef = useRef<MaterialGraphJSON>(json);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // (Re)build + layout the graph whenever the incoming `json` changes.
  useEffect(() => {
    jsonRef.current = json;
    const flow = graphToFlow(json);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [json, setNodes, setEdges]);

  const handleEdit = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      const next = applyEdit(jsonRef.current, id, patch);
      jsonRef.current = next;
      onMaterialGraphJSONChange?.(next);

      // Update just this node's visual data (no re-layout, keeps drag positions).
      const edited = next.nodes.find((n) => n.id === id);
      if (!edited) return;
      const visual = {
        ...describeNode(edited),
        inputs: computeInputSockets(edited),
        outputs: [{ id: "out", label: "" }],
      };
      setNodes((ns) =>
        ns.map((n) => (n.id === id ? { ...n, data: visual } : n)),
      );
    },
    [onMaterialGraphJSONChange, setNodes],
  );

  return (
    <NodeEditContext.Provider value={readOnly ? undefined : handleEdit}>
      <div className="h-full w-full bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          deleteKeyCode={readOnly ? null : undefined}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-slate-950"
        >
          <Background color="#1e293b" gap={20} />
          <Controls className="bg-slate-900! text-slate-200!" />
        </ReactFlow>
      </div>
    </NodeEditContext.Provider>
  );
}
