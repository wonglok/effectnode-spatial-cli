import * as prettier from "prettier/standalone";
import * as prettierBabel from "prettier/plugins/babel";
import * as prettierEstree from "prettier/plugins/estree";
import { MaterialGraphJSON, SerializedNode } from "./types";

/**
 * Generates TypeScript/TSL source code that reconstructs a material from a
 * serialized node graph (the `MaterialGraphJSON` produced by
 * `materialParser.parseNodeMaterialToJSON`).
 *
 * The output is a standalone module of the form:
 *
 *   import * as THREE from 'three/webgpu'
 *   import * as TSL from 'three/tsl'
 *
 *   export async function materialFunction () {
 *     const mat = new THREE.MeshPhysicalNodeMaterial();
 *     mat.colorNode = TSL.vec3(...);
 *     return mat;
 *   }
 *
 * Node types with a known idiomatic TSL expression are emitted as readable TSL.
 * Any other node type falls back to a placeholder (`TSL.float(0)`) since there
 * is no clean one-liner for it.
 *
 * Because the output is later `eval`ed, any value taken from the JSON and
 * interpolated into the code is sanitized first (see the helpers below) so a
 * malformed/persisted graph cannot inject code.
 */

// AttributeNode `_attributeName` -> TSL accessor expression. `uv` is a function
// (hence the trailing `()`); the geometry accessors are pre-instantiated nodes.
const ATTRIBUTE_MAP: Record<string, string> = {
  position: "positionGeometry",
  normal: "normalGeometry",
  tangent: "tangentGeometry",
  bitangent: "bitangentGeometry",
  uv: "uv()",
};

// OperatorNode `op` -> TSL function name.
const OPERATOR_MAP: Record<string, string> = {
  "+": "add",
  "-": "sub",
  "*": "mul",
  "/": "div",
  "%": "mod",
  "==": "equal",
  "!=": "notEqual",
  "<": "lessThan",
  ">": "greaterThan",
  "<=": "lessThanEqual",
  ">=": "greaterThanEqual",
  "&&": "and",
  "||": "or",
  "^^": "xor",
  "!": "not",
  "~": "bitNot",
  "&": "bitAnd",
  "|": "bitOr",
  "^": "bitXor",
  "<<": "shiftLeft",
  ">>": "shiftRight",
};

// MathNode `method` values whose TSL export name differs from the method string.
const MATH_METHOD_REMAP: Record<string, string> = {
  inversesqrt: "inverseSqrt",
};

/** TSL functions that build a node of the given type (Join/Convert/Const). */
const TYPE_FNS = new Set([
  "float",
  "int",
  "uint",
  "bool",
  "color",
  "vec2",
  "vec3",
  "vec4",
  "ivec2",
  "ivec3",
  "ivec4",
  "uvec2",
  "uvec3",
  "uvec4",
  "bvec2",
  "bvec3",
  "bvec4",
  "mat2",
  "mat3",
  "mat4",
]);

function generateCode(json: MaterialGraphJSON): string {
  const nodesById = new Map<string, SerializedNode>();
  for (const node of json.nodes) {
    nodesById.set(node.id, node);
  }

  const gen = (id: string): string => genNode(id, nodesById, new Set());

  const materialClass = sanitizeIdentifier(
    json.materialType,
    "MeshPhysicalNodeMaterial",
  );

  const lines: string[] = [];
  lines.push("import * as THREE from 'three/webgpu'");
  lines.push("import * as TSL from 'three/tsl'");
  lines.push("");

  lines.push("return async function materialFunction () {");
  lines.push("");
  lines.push(`    const mat = new THREE.${materialClass}();`);
  lines.push("");

  for (const [slot, nodeId] of Object.entries(json.materialSlots)) {
    // Slot names become `mat.<slot>` — reject anything that is not a valid
    // identifier (e.g. a crafted key meant to break out of the assignment).
    if (!nodesById.has(nodeId) || !IDENTIFIER_RE.test(slot)) continue;
    lines.push(`    mat.${slot} = ${gen(nodeId)};`);
  }

  lines.push("");
  lines.push("    return mat;");
  lines.push("}");

  return lines.join("\n");
}

/** Generates TSL source and formats it with Prettier for readability. */
export async function jsonToCode(json: MaterialGraphJSON): Promise<string> {
  const code = generateCode(json);
  try {
    return await prettier.format(code, {
      parser: "babel-ts",
      plugins: [prettierBabel, prettierEstree],
    });
  } catch (e) {
    console.warn("Prettier failed to format generated code:", e);
    return code;
  }
}

function genNode(
  id: string,
  nodesById: Map<string, SerializedNode>,
  visiting: Set<string>,
): string {
  const node = nodesById.get(id);
  if (!node) return "TSL.float(0)";
  if (visiting.has(id)) return "/* cycle */ TSL.float(0)";

  visiting.add(id);
  try {
    const data = node.data || {};
    const custom = node.customData || {};
    const inputNodes = data.inputNodes || {};

    const child = (key: string): string | null => {
      const ref = inputNodes[key];
      if (typeof ref !== "string" || ref === "") return null;
      return genNode(ref, nodesById, visiting);
    };
    const childOrZero = (key: string): string => child(key) ?? "TSL.float(0)";

    switch (node.type) {
      case "VarNode": {
        const inner = childOrZero("node");
        // Intent vars (created by `nodeProxyIntent`) are transparent — emit the
        // wrapped expression directly.
        if (custom.intent === true) return inner;
        const method = custom.readOnly ? "toConst" : "toVar";
        const name =
          typeof custom.name === "string" && custom.name !== ""
            ? `('${sanitizeStringLiteral(custom.name)}')`
            : "()";
        return `${inner}.${method}${name}`;
      }

      case "AttributeNode": {
        const attributeName = data._attributeName as string;
        const accessor = ATTRIBUTE_MAP[attributeName];
        if (accessor) return `TSL.${accessor}`;
        // `uv1`, `uv2`, ... map to uv(index).
        const uvMatch = /^uv(\d+)$/.exec(attributeName);
        if (uvMatch) return `TSL.uv(${uvMatch[1]})`;
        return `TSL.attribute('${sanitizeStringLiteral(attributeName)}')`;
      }

      case "VertexColorNode": {
        const index =
          Number.isInteger(data.index) && data.index >= 0 ? data.index : 0;
        return `TSL.vertexColor(${index})`;
      }

      case "ConstNode": {
        return genConst(data);
      }

      case "OperatorNode": {
        const fn = OPERATOR_MAP[data.op] ?? "add";
        const a = childOrZero("aNode");
        const b = child("bNode");
        return b === null ? `TSL.${fn}(${a})` : `TSL.${fn}(${a}, ${b})`;
      }

      case "SplitNode": {
        // Swizzle components (e.g. "x", "xy", "rgb") become `.x` — restrict to
        // a valid identifier so a crafted value cannot inject.
        const components = sanitizeIdentifier(data.components, "x");
        return `${childOrZero("node")}.${components}`;
      }

      case "JoinNode": {
        const fn = tslTypeFn(custom.nodeType, "vec3");
        const children = (inputNodes.nodes || [])
          .filter((ref: unknown): ref is string => typeof ref === "string")
          .map((ref: string) => genNode(ref, nodesById, visiting));
        return `TSL.${fn}(${children.join(", ")})`;
      }

      case "ConvertNode": {
        const fn = tslTypeFn(data.convertTo, "float");
        return `TSL.${fn}(${childOrZero("node")})`;
      }

      case "MathNode": {
        const method = sanitizeIdentifier(data.method, "sin");
        const fn = MATH_METHOD_REMAP[method] ?? method;
        const args = [childOrZero("aNode")];
        if (inputNodes.bNode) args.push(childOrZero("bNode"));
        if (inputNodes.cNode) args.push(childOrZero("cNode"));
        return `TSL.${fn}(${args.join(", ")})`;
      }

      case "ConditionalNode": {
        const cond = childOrZero("condNode");
        const ifNode = childOrZero("ifNode");
        const elseNode = child("elseNode");
        return elseNode === null
          ? `TSL.select(${cond}, ${ifNode})`
          : `TSL.select(${cond}, ${ifNode}, ${elseNode})`;
      }

      case "VaryingNode": {
        const inner = childOrZero("node");
        const name =
          typeof custom.name === "string" && custom.name !== ""
            ? `('${sanitizeStringLiteral(custom.name)}')`
            : "()";
        return `${inner}.toVarying${name}`;
      }

      case "MemberNode": {
        const struct = childOrZero("structNode");
        const property = sanitizeStringLiteral(
          (custom.property ?? data.property ?? "") as string,
        );
        return `${struct}.get('${property}')`;
      }

      case "ArrayElementNode": {
        const array = childOrZero("node");
        const index = childOrZero("indexNode");
        return `${array}.element(${index})`;
      }

      case "FrontFacingNode": {
        return "TSL.frontFacing";
      }

      case "IndexNode": {
        return custom.scope === "vertex"
          ? "TSL.vertexIndex"
          : "TSL.instanceIndex";
      }

      default: {
        // No idiomatic mapping — emit a neutral placeholder and flag it.
        const type = sanitizeIdentifier(node.type, "unknown");
        return `/* unsupported node: ${type} */ TSL.float(0)`;
      }
    }
  } finally {
    visiting.delete(id);
  }
}

function genConst(data: Record<string, any>): string {
  const value = data.value;
  const valueType = data.valueType || "float";

  if (valueType === "color") {
    return `TSL.color(${formatValue(value)})`;
  }

  const fn = tslTypeFn(valueType, "float");
  return `TSL.${fn}(${formatValue(value)})`;
}

/** Returns the value as a TSL-safe argument string (arrays become `a, b, c`). */
function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).join(", ");
  }
  const encoded = JSON.stringify(value);
  return encoded === undefined ? "0" : encoded;
}

/** Returns `type` if it maps to a TSL constructor, otherwise `fallback`. */
function tslTypeFn(type: unknown, fallback: string): string {
  return typeof type === "string" && TYPE_FNS.has(type) ? type : fallback;
}

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function sanitizeIdentifier(value: unknown, fallback: string): string {
  return typeof value === "string" && IDENTIFIER_RE.test(value)
    ? value
    : fallback;
}

function sanitizeStringLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
