import { readFileSync } from "node:fs";
import { loadDesign, saveDesign } from "../routers/design.js";
import {
  addNode,
  coerceNode,
  isSceneArray,
  removeNode,
  renameNode,
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

export async function sceneGet(slug: string): Promise<void> {
  const design = await loadDesign(slug);
  console.log(JSON.stringify(design.scene, null, 2));
}

export async function sceneSet(
  slug: string,
  options: JsonInputOptions,
): Promise<void> {
  const input = await readJsonInput(options);
  if (!isSceneArray(input)) {
    throw new Error("Expected a JSON array of scene nodes");
  }
  const design = await loadDesign(slug);
  design.scene = input;
  await saveDesign(slug, design);
  console.log(`Scene set (${input.length} nodes)`);
}

export async function sceneAdd(
  slug: string,
  options: JsonInputOptions,
): Promise<void> {
  const node = coerceNode(await readJsonInput(options));
  const design = await loadDesign(slug);
  design.scene = addNode(design.scene, node);
  await saveDesign(slug, design);
  // Echo the full node (including the generated id) so the agent can reference it.
  console.log(JSON.stringify(node, null, 2));
}

export async function sceneRemove(slug: string, id: string): Promise<void> {
  const design = await loadDesign(slug);
  design.scene = removeNode(design.scene, id);
  await saveDesign(slug, design);
  console.log(`Removed node ${id}`);
}

export async function sceneRename(
  slug: string,
  id: string,
  name: string,
): Promise<void> {
  const design = await loadDesign(slug);
  design.scene = renameNode(design.scene, id, name);
  await saveDesign(slug, design);
  console.log(`Renamed ${id} -> ${name}`);
}

export async function sceneClear(slug: string): Promise<void> {
  const design = await loadDesign(slug);
  design.scene = [];
  await saveDesign(slug, design);
  console.log("Scene cleared");
}
