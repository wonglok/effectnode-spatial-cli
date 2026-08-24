import { Server, type Socket } from "socket.io";
import { loadDesign, saveDesign } from "./routers/design.js";
import {
  type Design,
  type SceneNode,
  addNode,
  removeNode,
  renameNode,
  patchNode,
} from "./scene.js";

// ---------------------------------------------------------------------------
// Socket.io design API — replaces the REST design object
// (GET/PUT /api/projects/:projectID/design).
//
// Each project lives in a room named `design:<slug>`. Mutations are applied to
// an in-memory authoritative copy, debounced-persisted to disk, then broadcast
// to the OTHER sockets in the room (the sender already applied the change).
//
// Trust model: this is a single-user local tool with no user accounts or
// sessions (matching the REST API it replaces), so the client-supplied slug is
// trusted as-is and CORS reflects the connecting origin. Do NOT deploy this
// multi-tenant without handshake auth + per-event project authorization.
// ---------------------------------------------------------------------------

interface CachedDesign {
  design: Design;
  saveTimer?: ReturnType<typeof setTimeout>;
}

/** Debounce window for persisting a design to disk (ms). */
const SAVE_DEBOUNCE_MS = 400;

/** In-memory authoritative design per slug (per-process). */
const designs = new Map<string, CachedDesign>();

const roomName = (slug: string): string => `design:${slug}`;

// --- payload types (mirror the frontend emit shapes) ------------------------

interface JoinPayload {
  project: string;
}

interface AddPayload {
  project: string;
  node: SceneNode;
}

interface RemovePayload {
  project: string;
  id: string;
}

interface RenamePayload {
  project: string;
  id: string;
  name: string;
}

interface PatchPayload {
  project: string;
  id: string;
  params: Record<string, unknown>;
}

interface ReplacePayload {
  project: string;
  scene: SceneNode[];
}

// --- cache / persistence -----------------------------------------------------

/** Return the cached design for a slug, loading and caching it on first use. */
async function getOrLoadDesign(slug: string): Promise<Design> {
  const cached = designs.get(slug);
  if (cached) return cached.design;
  const design = await loadDesign(slug);
  designs.set(slug, { design });
  return design;
}

/** Debounced persist of the in-memory design for a slug (400ms). */
function scheduleSave(slug: string): void {
  const cached = designs.get(slug);
  if (!cached) return;
  if (cached.saveTimer) clearTimeout(cached.saveTimer);
  cached.saveTimer = setTimeout(() => {
    cached.saveTimer = undefined;
    void saveDesign(slug, cached.design).catch((err: unknown) => {
      console.error(`Failed to persist design for "${slug}":`, err);
    });
  }, SAVE_DEBOUNCE_MS);
}

// --- event handlers ----------------------------------------------------------

async function handleJoin(socket: Socket, payload: JoinPayload): Promise<void> {
  const design = await getOrLoadDesign(payload.project);
  socket.join(roomName(payload.project));
  socket.emit("design:state", { design });
}

async function handleSceneAdd(
  socket: Socket,
  payload: AddPayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project);
  design.scene = addNode(design.scene, payload.node);
  scheduleSave(payload.project);
  socket
    .to(roomName(payload.project))
    .emit("scene:added", { node: payload.node });
}

async function handleSceneRemove(
  socket: Socket,
  payload: RemovePayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project);
  design.scene = removeNode(design.scene, payload.id);
  scheduleSave(payload.project);
  socket.to(roomName(payload.project)).emit("scene:removed", { id: payload.id });
}

async function handleSceneRename(
  socket: Socket,
  payload: RenamePayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project);
  design.scene = renameNode(design.scene, payload.id, payload.name);
  scheduleSave(payload.project);
  socket
    .to(roomName(payload.project))
    .emit("scene:renamed", { id: payload.id, name: payload.name });
}

async function handleScenePatch(
  socket: Socket,
  payload: PatchPayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project);
  design.scene = patchNode(design.scene, payload.id, payload.params);
  scheduleSave(payload.project);
  socket
    .to(roomName(payload.project))
    .emit("scene:patched", { id: payload.id, params: payload.params });
}

async function handleSceneReplace(
  socket: Socket,
  payload: ReplacePayload,
): Promise<void> {
  const design = await getOrLoadDesign(payload.project);
  design.scene = payload.scene;
  scheduleSave(payload.project);
  socket
    .to(roomName(payload.project))
    .emit("scene:replaced", { scene: payload.scene });
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
