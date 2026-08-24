import { readFileSync } from "node:fs";
import {
  createScene,
  listScenes,
  loadSceneDesign,
  saveSceneDesign,
} from "../scenes.js";
import {
  addNode,
  coerceNode,
  isSceneArray,
  removeNode,
  renameNode,
  SCENE_NODE_TYPES,
  type SceneNodeType,
} from "../scene.js";

// ---------------------------------------------------------------------------
// Headless scene editing for AI agents (Claude Code, scripts, …). Reads JSON
// from --json / --file / stdin and writes to the same design.json the running
// server uses, so CLI edits and in-app edits stay consistent.
// ---------------------------------------------------------------------------

interface JsonInputOptions {
  json?: string;
  file?: string;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`);
  }
}

/** Read JSON input from --json, --file, or stdin (in that priority order). */
async function readJsonInput(options: JsonInputOptions): Promise<unknown> {
  if (options.json !== undefined) return parseJson(options.json);
  if (options.file) return parseJson(readFileSync(options.file, "utf-8"));
  if (process.stdin.isTTY) {
    throw new Error("Provide JSON via --json <json>, --file <path>, or stdin");
  }
  return parseJson(await readStdin());
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString("utf-8");
}

export async function sceneList(project: string): Promise<void> {
  console.log(JSON.stringify(await listScenes(project), null, 2));
}

export async function sceneCreate(project: string, name: string): Promise<void> {
  console.log(JSON.stringify(await createScene(project, name), null, 2));
}

export async function sceneGet(project: string, scene: string): Promise<void> {
  const design = await loadSceneDesign(project, scene);
  console.log(JSON.stringify(design.scene, null, 2));
}

export async function sceneSet(
  project: string,
  scene: string,
  options: JsonInputOptions,
): Promise<void> {
  const input = await readJsonInput(options);
  if (!isSceneArray(input)) {
    throw new Error("Expected a JSON array of scene nodes");
  }
  const design = await loadSceneDesign(project, scene);
  design.scene = input;
  await saveSceneDesign(project, scene, design);
  console.log(`Scene set (${input.length} nodes)`);
}

export async function sceneAdd(
  project: string,
  scene: string,
  options: JsonInputOptions,
): Promise<void> {
  const node = coerceNode(await readJsonInput(options));
  const design = await loadSceneDesign(project, scene);
  design.scene = addNode(design.scene, node);
  await saveSceneDesign(project, scene, design);
  // Echo the full node (including the generated id) so the agent can reference it.
  console.log(JSON.stringify(node, null, 2));
}

export async function sceneRemove(
  project: string,
  scene: string,
  id: string,
): Promise<void> {
  const design = await loadSceneDesign(project, scene);
  design.scene = removeNode(design.scene, id);
  await saveSceneDesign(project, scene, design);
  console.log(`Removed node ${id}`);
}

export async function sceneRename(
  project: string,
  scene: string,
  id: string,
  name: string,
): Promise<void> {
  const design = await loadSceneDesign(project, scene);
  design.scene = renameNode(design.scene, id, name);
  await saveSceneDesign(project, scene, design);
  console.log(`Renamed ${id} -> ${name}`);
}

export async function sceneClear(project: string, scene: string): Promise<void> {
  const design = await loadSceneDesign(project, scene);
  design.scene = [];
  await saveSceneDesign(project, scene, design);
  console.log("Scene cleared");
}

// --- node templates (for AI agents: what params each type accepts) -----------

interface ParamSpec {
  type: string;
  description: string;
  default?: unknown;
  required?: boolean;
}

interface NodeTemplate {
  type: SceneNodeType;
  description: string;
  required: string[];
  supportsChildren: boolean;
  params: Record<string, ParamSpec>;
  example: {
    type: SceneNodeType;
    name?: string;
    params?: Record<string, unknown>;
  };
}

const TRANSFORM_PARAMS: Record<string, ParamSpec> = {
  position: {
    type: "vec3",
    default: [0, 0, 0],
    description: "World position [x, y, z]",
  },
  rotation: {
    type: "vec3 (degrees)",
    default: [0, 0, 0],
    description: "Euler rotation in degrees [x, y, z]",
  },
  scale: {
    type: "vec3",
    default: [1, 1, 1],
    description: "Scale [x, y, z]",
  },
};

const COLLIDER_USERDATA_PARAMS: Record<string, ParamSpec> = {
  isCollider: {
    type: "boolean",
    default: false,
    description: "Mark the node as a physics collider",
  },
  userData: {
    type: "array",
    default: [],
    description: "Array of { key: string, value: string } entries",
  },
};

const NODE_TEMPLATES: NodeTemplate[] = [
  {
    type: "group",
    description: "Empty container that groups child nodes.",
    required: [],
    supportsChildren: true,
    params: { ...TRANSFORM_PARAMS, ...COLLIDER_USERDATA_PARAMS },
    example: { type: "group", name: "Group", params: { position: [0, 0, 0] } },
  },
  {
    type: "mesh",
    description:
      "A mesh object with an optional transform, collider, and userData.",
    required: [],
    supportsChildren: true,
    params: { ...TRANSFORM_PARAMS, ...COLLIDER_USERDATA_PARAMS },
    example: { type: "mesh", name: "Mesh" },
  },
  {
    type: "geometry",
    description: "A box geometry placeholder. No editable params.",
    required: [],
    supportsChildren: false,
    params: {},
    example: { type: "geometry", name: "Geometry" },
  },
  {
    type: "material",
    description: "A standard PBR material.",
    required: [],
    supportsChildren: false,
    params: {
      color: {
        type: "string (hex)",
        default: "#ffffff",
        description: "Base color",
      },
      roughness: {
        type: "number (0-1)",
        default: 0.5,
        description: "Surface roughness",
      },
      metalness: {
        type: "number (0-1)",
        default: 0,
        description: "Metallic reflectivity",
      },
    },
    example: {
      type: "material",
      name: "Material",
      params: { color: "#ffffff", roughness: 0.5, metalness: 0 },
    },
  },
  {
    type: "light",
    description: "An ambient light.",
    required: [],
    supportsChildren: false,
    params: { ...TRANSFORM_PARAMS, ...COLLIDER_USERDATA_PARAMS },
    example: { type: "light", name: "Light" },
  },
  {
    type: "camera",
    description: "A perspective camera.",
    required: [],
    supportsChildren: false,
    params: {
      fov: {
        type: "number",
        default: 50,
        description: "Vertical field of view (degrees)",
      },
      near: {
        type: "number",
        default: 0.1,
        description: "Near clipping plane",
      },
      far: {
        type: "number",
        default: 1000,
        description: "Far clipping plane",
      },
      ...TRANSFORM_PARAMS,
    },
    example: {
      type: "camera",
      name: "Camera",
      params: { fov: 50, near: 0.1, far: 1000 },
    },
  },
  {
    type: "model",
    description: "A GLB/GLTF model loaded from an asset `src`.",
    required: ["src"],
    supportsChildren: false,
    params: {
      src: {
        type: "string",
        required: true,
        description: "Asset URL (list files with the `assets` command)",
      },
      ...TRANSFORM_PARAMS,
      ...COLLIDER_USERDATA_PARAMS,
    },
    example: {
      type: "model",
      name: "model.glb",
      params: {
        src: "/api/projects/<slug>/uploads/model.glb",
        position: [0, 0, 0],
      },
    },
  },
  {
    type: "environment",
    description: "An HDR environment map for scene lighting and/or background.",
    required: ["src"],
    supportsChildren: false,
    params: {
      src: {
        type: "string",
        required: true,
        description: "HDR asset URL (list files with the `assets` command)",
      },
      environmentIntensity: {
        type: "number",
        default: 1,
        description: "Environment light intensity",
      },
      backgroundIntensity: {
        type: "number",
        default: 1,
        description: "Background intensity",
      },
      useEnvironment: {
        type: "boolean",
        default: true,
        description: "Apply as scene environment",
      },
      useBackground: {
        type: "boolean",
        default: true,
        description: "Show as scene background",
      },
    },
    example: {
      type: "environment",
      name: "sky.hdr",
      params: {
        src: "/api/projects/<slug>/uploads/sky.hdr",
        useEnvironment: true,
        useBackground: true,
      },
    },
  },
];

/** Print the template for one node type, or all types when `type` is omitted. */
export async function sceneTemplate(type?: string): Promise<void> {
  if (type) {
    const template = NODE_TEMPLATES.find((t) => t.type === type);
    if (!template) {
      throw new Error(
        `Unknown node type "${type}" (expected one of ${SCENE_NODE_TYPES.join(", ")})`,
      );
    }
    console.log(JSON.stringify(template, null, 2));
    return;
  }
  const map = Object.fromEntries(NODE_TEMPLATES.map((t) => [t.type, t]));
  console.log(JSON.stringify(map, null, 2));
}
