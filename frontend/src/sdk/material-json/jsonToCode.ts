import type { MaterialGraphJSON, SerializedNode } from "./types";

// ---------------------------------------------------------------------------
// jsonToCode — the deterministic inverse of parseNodeMaterialToJSON.
//
// Given the node/edge graph produced by `parseNodeMaterialToJSON(material)`,
// this module emits TSL source code that rebuilds the same node graph. It runs
// as plain code — no AI involved — so a serialized material can be turned back
// into editable, human-readable TSL.
//
// Serialized value shape (see `serializeNodeValue` in materialParser.ts):
//   number | string | boolean
//   | { __type: "color"; value: number }
//   | { __type: "vec2" | "vec3" | "vec4"; value: number[] }
// ---------------------------------------------------------------------------

type ComplexValue =
  | { __type: "color"; value: number }
  | { __type: "vec2" | "vec3" | "vec4"; value: number[] };

type ConstValue = number | string | boolean | ComplexValue;

interface EdgeRef {
  source: string;
  handle: string;
}

interface EmitContext {
  usedFunctions: Set<string>;
  warnings: string[];
}

interface Graph {
  nodesById: Map<string, SerializedNode>;
  incoming: Map<string, EdgeRef[]>;
}

// Binary/ternary OperatorNode `op` -> TSL function name.
const OPERATOR_FUNCTIONS: Record<string, string> = {
  "*": "mul",
  "+": "add",
  "-": "sub",
  "/": "div",
  "%": "mod",
  "&": "bitAnd",
  "|": "bitOr",
  "^": "bitXor",
  "<<": "shiftLeft",
  ">>": "shiftRight",
  "==": "equal",
  "!=": "notEqual",
  "<": "lessThan",
  ">": "greaterThan",
  "<=": "lessThanEqual",
  ">=": "greaterThanEqual",
  "&&": "and",
  "||": "or",
  "^^": "xor",
};

// Unary OperatorNode `op` -> TSL function name (when bNode is absent).
const UNARY_OPERATOR_FUNCTIONS: Record<string, string> = {
  "!": "not",
  "~": "bitNot",
  "-": "negate",
};

// MathNode `method` -> TSL function name. Most are 1:1; the rest are aliased.
const MATH_FUNCTIONS: Record<string, string> = {
  abs: "abs",
  acos: "acos",
  asin: "asin",
  atan: "atan",
  atan2: "atan",
  cbrt: "cbrt",
  ceil: "ceil",
  clamp: "clamp",
  cos: "cos",
  cosh: "cosh",
  cross: "cross",
  difference: "difference",
  distance: "distance",
  dot: "dot",
  exp: "exp",
  exp2: "exp2",
  floor: "floor",
  fract: "fract",
  inverseSqrt: "inverseSqrt",
  length: "length",
  lengthSq: "lengthSq",
  log: "log",
  log2: "log2",
  max: "max",
  min: "min",
  mix: "mix",
  mod: "mod",
  modulo: "mod",
  negate: "negate",
  normalize: "normalize",
  oneMinus: "oneMinus",
  pow: "pow",
  reciprocal: "reciprocal",
  reflect: "reflect",
  refract: "refract",
  round: "round",
  saturate: "saturate",
  sign: "sign",
  sin: "sin",
  sinh: "sinh",
  smoothstep: "smoothstep",
  sqrt: "sqrt",
  step: "step",
  tan: "tan",
  tanh: "tanh",
  trunc: "trunc",
};

// ConvertNode `convertTo` -> TSL method name.
const CONVERT_METHODS: Record<string, string> = {
  bool: "toBool",
  float: "toFloat",
  int: "toInt",
  uint: "toUint",
  vec2: "toVec2",
  vec3: "toVec3",
  vec4: "toVec4",
};

const VEC_TYPES = new Set(["vec2", "vec3", "vec4"]);

function isComplexValue(v: unknown): v is ComplexValue {
  return (
    typeof v === "object" &&
    v !== null &&
    "__type" in (v as object) &&
    "value" in (v as object)
  );
}

function numberLiteral(value: number): string {
  return String(value);
}

function colorLiteral(hex: number): string {
  return `0x${hex.toString(16).padStart(6, "0")}`;
}

/** Serialized node value -> TSL literal for that constant's arguments. */
function constValueSource(value: unknown, nodeType: unknown): string {
  if (isComplexValue(value)) {
    switch (value.__type) {
      case "color":
        return colorLiteral(value.value);
      case "vec2":
      case "vec3":
      case "vec4":
        return (value.value as number[]).map(numberLiteral).join(", ");
      default:
        return "0";
    }
  }

  if (typeof value === "number") return numberLiteral(value);
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string") return JSON.stringify(value);

  // No value captured — fall back to a zero placeholder of the declared type.
  const type = typeof nodeType === "string" ? nodeType : "float";
  if (type === "color") return "0x000000";
  if (VEC_TYPES.has(type)) {
    const count = Number(type[3]);
    return new Array(count).fill("0").join(", ");
  }
  return "0";
}

function buildGraph(json: MaterialGraphJSON): Graph {
  const nodesById = new Map<string, SerializedNode>(
    json.nodes.map((n) => [n.id, n]),
  );
  const incoming = new Map<string, EdgeRef[]>();
  for (const edge of json.edges) {
    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    incoming.get(edge.target)!.push({
      source: edge.source,
      handle: edge.targetHandle,
    });
  }
  return { nodesById, incoming };
}

function createEmitter(graph: Graph, ctx: EmitContext) {
  const memo = new Map<string, string>();
  return function emit(id: string): string {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    const source = emitNode(id, graph, ctx, emit);
    memo.set(id, source);
    return source;
  };
}

export function jsonToCode(json: MaterialGraphJSON): string {
  const ctx: EmitContext = { usedFunctions: new Set(), warnings: [] };
  const graph = buildGraph(json);
  const emit = createEmitter(graph, ctx);

  const slotLines: string[] = [];
  for (const [slot, nodeId] of Object.entries(json.materialSlots)) {
    slotLines.push(`material.${slot} = ${emit(nodeId)};`);
  }

  const materialType = json.materialType || "NodeMaterial";
  const tslImports = Array.from(ctx.usedFunctions).sort().join(", ");

  const header =
    ctx.warnings.length > 0
      ? "// NOTE: the following nodes could not be faithfully reversed:\n" +
        ctx.warnings.map((w) => `//   - ${w}`).join("\n") +
        "\n\n"
      : "";

  const body = [
    `import { ${tslImports} } from "three/tsl";`,
    `import { ${materialType} } from "three/webgpu";`,
    "",
    `export function buildMaterial() {`,
    `  const material = new ${materialType}();`,
    ...(slotLines.length
      ? slotLines.map((l) => `  ${l}`)
      : ["  // (no material slots)"]),
    `  return material;`,
    `}`,
  ].join("\n");

  return header + body;
}

/** Emit the TSL expression for a single node (useful for testing/debugging). */
export function nodeExpression(json: MaterialGraphJSON, nodeId: string): string {
  const ctx: EmitContext = { usedFunctions: new Set(), warnings: [] };
  const graph = buildGraph(json);
  return createEmitter(graph, ctx)(nodeId);
}

function emitNode(
  id: string,
  graph: Graph,
  ctx: EmitContext,
  emit: (id: string) => string,
): string {
  const { nodesById, incoming } = graph;
  const node = nodesById.get(id);
  if (!node) {
    ctx.warnings.push(`missing node "${id}"`);
    return "float(0)";
  }

  const props = node.properties ?? {};
  const edges = incoming.get(id) ?? [];
  const child = (handle: string): string | undefined => {
    const e = edges.find((ed) => ed.handle === handle);
    return e ? emit(e.source) : undefined;
  };
  const arrayChildren = (key: string): { index: number; expr: string }[] => {
    const out: { index: number; expr: string }[] = [];
    for (const e of edges) {
      const m = e.handle.match(/^(\w+)\[(\d+)\]$/);
      if (m && m[1] === key) out.push({ index: Number(m[2]), expr: emit(e.source) });
    }
    return out.sort((a, b) => a.index - b.index);
  };

  switch (node.type) {
    // `VarNode` is a transparent wrapper around its `.node` child.
    case "VarNode": {
      return child("node") ?? "float(0)";
    }

    case "ConstNode": {
      const rawValue = node.value;
      let nodeType = props.nodeType as string | undefined;
      // Nested constants are often unresolved until the material is built, so
      // `nodeType` may be missing. Infer it from the captured value.
      if (nodeType === undefined) {
        if (isComplexValue(rawValue)) {
          nodeType = rawValue.__type;
        } else if (typeof rawValue === "number") {
          nodeType = "float";
        } else if (typeof rawValue === "boolean") {
          nodeType = "bool";
        }
      }
      const valueSource = constValueSource(rawValue, nodeType);
      switch (nodeType) {
        case "float":
          ctx.usedFunctions.add("float");
          return `float(${valueSource})`;
        case "int":
          ctx.usedFunctions.add("int");
          return `int(${valueSource})`;
        case "uint":
          ctx.usedFunctions.add("uint");
          return `uint(${valueSource})`;
        case "bool":
          ctx.usedFunctions.add("bool");
          return `bool(${valueSource})`;
        case "color":
          ctx.usedFunctions.add("color");
          return `color(${valueSource})`;
        case "vec2":
        case "vec3":
        case "vec4":
          ctx.usedFunctions.add(nodeType);
          return `${nodeType}(${valueSource})`;
        default:
          ctx.usedFunctions.add("float");
          ctx.warnings.push(
            `ConstNode "${id}" with unknown nodeType "${String(nodeType)}"`,
          );
          return `float(${valueSource})`;
      }
    }

    case "OperatorNode": {
      const op = (props.op as string) ?? "*";
      const a = child("aNode");
      const b = child("bNode");
      if (a === undefined) {
        ctx.warnings.push(`OperatorNode "${id}" has no aNode`);
        return "float(0)";
      }
      if (b === undefined) {
        const unary = UNARY_OPERATOR_FUNCTIONS[op];
        if (unary) {
          ctx.usedFunctions.add(unary);
          return `${unary}(${a})`;
        }
        return a;
      }
      const fn = OPERATOR_FUNCTIONS[op];
      if (!fn) {
        ctx.warnings.push(`OperatorNode "${id}" unknown op "${op}"`);
        return `${a} ${op} ${b}`;
      }
      ctx.usedFunctions.add(fn);
      return `${fn}(${a}, ${b})`;
    }

    case "MathNode": {
      const method = (props.method as string) ?? "abs";
      const fn = MATH_FUNCTIONS[method];
      if (!fn) {
        ctx.warnings.push(`MathNode "${id}" unknown method "${method}"`);
        return `/* MathNode.${method} */ float(0)`;
      }
      const args = [child("aNode"), child("bNode"), child("cNode")].filter(
        (x): x is string => x !== undefined,
      );
      ctx.usedFunctions.add(fn);
      return `${fn}(${args.join(", ")})`;
    }

    case "SplitNode": {
      // Swizzle. three normalises `.rgb`/`.st` to `.xyz` internally.
      const components = (props.components as string) ?? "xyz";
      const inner = child("node");
      if (inner === undefined) return "float(0)";
      return `${inner}.${components}`;
    }

    case "JoinNode": {
      const nodeType = (props.nodeType as string) ?? "vec3";
      const parts = arrayChildren("nodes").map((p) => p.expr);
      if (parts.length === 0) {
        ctx.warnings.push(`JoinNode "${id}" has no components`);
        parts.push("0", "0", "0");
      }
      ctx.usedFunctions.add(nodeType);
      return `${nodeType}(${parts.join(", ")})`;
    }

    case "ConvertNode": {
      const convertTo = (props.convertTo as string) ?? "vec3";
      const method = CONVERT_METHODS[convertTo];
      const inner = child("node");
      if (inner === undefined || !method) return inner ?? "float(0)";
      return `${inner}.${method}()`;
    }

    case "UniformNode": {
      // A user `uniform(...)`, or a builtin like `time` (which serializes as a
      // shared-group uniform). Shared groups are builtins and can't be named
      // back, so flag them rather than emit wrong code.
      const sharedGroup = edges.some((e) => {
        if (e.handle !== "groupNode") return false;
        return graph.nodesById.get(e.source)?.properties?.shared === true;
      });
      if (sharedGroup) {
        ctx.warnings.push(`UniformNode "${id}" is a builtin (e.g. time)`);
        return "/* builtin uniform */ float(0)";
      }
      const valueSource = constValueSource(node.value, "float");
      ctx.usedFunctions.add("uniform");
      return `uniform(${valueSource})`;
    }

    // Internal/builtin nodes the parser cannot reverse into a named TSL call.
    // Emit a clear placeholder rather than silently wrong code.
    default: {
      ctx.warnings.push(`unreversable node "${id}" (${node.type})`);
      return `/* ${node.type} */ float(0)`;
    }
  }
}
