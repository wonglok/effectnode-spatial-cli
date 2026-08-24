import { Server, type Socket } from "socket.io";
import {
  type Design,
  type SceneNode,
  addNode,
  removeNode,
  renameNode,
  patchNode,
} from "./scene.js";
import { loadSceneDesign, saveSceneDesign } from "./scenes.js";

// ---------------------------------------------------------------------------
// Socket.io scene API — live sync of a scene's design between the editor and
// the server (which persists to projects/<id>/scenes/<slug>/design.json).
//
// Each scene lives in a room named `scene:<project>:<scene>`. Mutations are
// applied to an in-memory authoritative copy, debounced-persisted to disk,
// then broadcast to the OTHER sockets in the room (the sender already applied
// the change).
//
// Trust model: this is a single-user local tool with no user accounts or
// sessions (matching the REST API it replaces), so the client-supplied slugs
// are trusted as-is and CORS reflects the connecting origin. Do NOT deploy this
// multi-tenant without handshake auth + per-event project authorization.
// ---------------------------------------------------------------------------

interface CachedDesign {
  design: Design;
  saveTimer?: ReturnType<typeof setTimeout>;
}

const SAVE_DEBOUNCE_MS = 400;

const designs = new Map<string, CachedDesign>();

const roomName = (project: string, scene: string): string =>
  `scene:${project}:${scene}`;

const cacheKey = (project: string, scene: string): string =>
  `${project}:${scene}`;

// --- payload types (mirror the frontend emit shapes) ------------------------

interface JoinPayload {
  project: string;
  scene: string;
}

interface AddPayload {
  project: string;
  scene: string;
  node: SceneNode;
}

interface RemovePayload {
  project: string;
  scene: string;
  id: string;
}

interface RenamePayload {
  project: string;
  scene: string;
  id: string;
  name: string;
}

interface PatchPayload {
  project: string;
  scene: string;
  id: string;
  params: Record<string, unknown>;
}

interface ReplacePayload {
  project: string;
  scene: string;
  nodes: SceneNode[];
}

// --- cache / persistence -----------------------------------------------------

/** Return the cached design for a scene, loading and caching it on first use. */
async function getOrLoadDesign(project: string, scene: string): Promise<Design> {
  const key = cacheKey(project, scene);
  const cached = designs.get(key);
  if (cached) return cached.design;
  const design = await loadSceneDesign(project, scene);
  designs.set(key, { design });
  return design;
}

/** Debounced persist of the in-memory design for a scene (400ms). */
function scheduleSave(project: string, scene: string): void {
  const key = cacheKey(project, scene);
  const cached = designs.get(key);
  if (!cached) return;
  if (cached.saveTimer) clearTimeout(cached.saveTimer);
  cached.saveTimer = setTimeout(() => {
    cached.saveTimer = undefined;
    void saveSceneDesign(project, scene, cached.design).catch((err: unknown) => {
      console.error(`Failed to persist scene "${project}/${scene}":`, err);
    });
  }, SAVE_DEBOUNCE_MS);
}

// --- event handlers ----------------------------------------------------------

async function handleJoin(socket: Socket, payload: JoinPayload): Promise<void> {
  const design = await getOrLoadDesign(payload.project, payload.scene);
  socket.join(roomName(payload.project, payload.scene));
  socket.emit("design:state", { design });
}

async function handleSceneAdd(
  socket: Socket,
  payload: AddPayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project, payload.scene);
  design.scene = addNode(design.scene, payload.node);
  scheduleSave(payload.project, payload.scene);
  socket
    .to(roomName(payload.project, payload.scene))
    .emit("scene:added", { node: payload.node });
}

async function handleSceneRemove(
  socket: Socket,
  payload: RemovePayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project, payload.scene);
  design.scene = removeNode(design.scene, payload.id);
  scheduleSave(payload.project, payload.scene);
  socket
    .to(roomName(payload.project, payload.scene))
    .emit("scene:removed", { id: payload.id });
}

async function handleSceneRename(
  socket: Socket,
  payload: RenamePayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project, payload.scene);
  design.scene = renameNode(design.scene, payload.id, payload.name);
  scheduleSave(payload.project, payload.scene);
  socket
    .to(roomName(payload.project, payload.scene))
    .emit("scene:renamed", { id: payload.id, name: payload.name });
}

async function handleScenePatch(
  socket: Socket,
  payload: PatchPayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project, payload.scene);
  design.scene = patchNode(design.scene, payload.id, payload.params);
  scheduleSave(payload.project, payload.scene);
  socket
    .to(roomName(payload.project, payload.scene))
    .emit("scene:patched", { id: payload.id, params: payload.params });
}

async function handleSceneReplace(
  socket: Socket,
  payload: ReplacePayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project, payload.scene);
  design.scene = payload.nodes;
  scheduleSave(payload.project, payload.scene);
  socket
    .to(roomName(payload.project, payload.scene))
    .emit("scene:replaced", { nodes: payload.nodes });
}

/** Run an async handler, logging any rejection (avoids unhandled rejections). */
function run(handler: () => Promise<void>): void {
  void handler().catch((err: unknown) => {
    console.error("design socket handler failed:", err);
  });
}

/** Attach the socket.io design API to the given HTTP server. */
export function attachDesignSocket(server: import("node:http").Server): Server {
  const io = new Server(server, {
    path: "/ws/socket.io",
    cors: { origin: true },
  });

  io.on("connection", (socket) => {
    socket.on("design:join", (payload: JoinPayload) => {
      run(() => handleJoin(socket, payload));
    });
    socket.on("scene:add", (payload: AddPayload) => {
      run(() => handleSceneAdd(socket, payload));
    });
    socket.on("scene:remove", (payload: RemovePayload) => {
      run(() => handleSceneRemove(socket, payload));
    });
    socket.on("scene:rename", (payload: RenamePayload) => {
      run(() => handleSceneRename(socket, payload));
    });
    socket.on("scene:patch", (payload: PatchPayload) => {
      run(() => handleScenePatch(socket, payload));
    });
    socket.on("scene:replace", (payload: ReplacePayload) => {
      run(() => handleSceneReplace(socket, payload));
    });
  });

  // Close the socket server when the HTTP server shuts down.
  server.once("close", () => io.close());

  return io;
}
