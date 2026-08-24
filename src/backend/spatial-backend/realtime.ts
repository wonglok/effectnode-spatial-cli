import type { Server, Socket } from "socket.io";
import {
  deleteSceneNode,
  listSceneNodes,
  saveSceneNode,
} from "./routers/projects.js";

function projectRoom(projectId: string): string {
  return `project:${projectId}`;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Wire up socket.io for realtime scene-node sync: per-project rooms and
 * per-scene-node CRUD (reads ack, writes broadcast to the room). Whole-design
 * persistence is handled separately over the REST API.
 */
export function setupRealtime(io: Server): void {
  io.on("connection", (socket: Socket) => {
    socket.on("project:join", (payload: unknown) => {
      const projectId = (payload as { projectId?: unknown } | null)?.projectId;
      if (typeof projectId === "string" && projectId) {
        socket.join(projectRoom(projectId));
      }
    });

    // Scene-node CRUD.
    socket.on(
      "scene-node:list",
      async (payload: unknown, ack?: (res: unknown) => void) => {
        const projectId = (payload as { projectId?: unknown } | null)
          ?.projectId;
        if (typeof projectId !== "string" || !projectId) {
          ack?.({ error: "Missing projectId" });
          return;
        }
        try {
          ack?.({ nodes: await listSceneNodes(projectId) });
        } catch (err) {
          ack?.({ error: errorMessage(err) });
        }
      },
    );

    socket.on("scene-node:save", async (payload: unknown) => {
      const { projectId, node } = (payload ?? {}) as {
        projectId?: unknown;
        node?: unknown;
      };
      if (typeof projectId !== "string" || !projectId) return;
      try {
        const saved = await saveSceneNode(projectId, node as { id?: unknown });
        io.to(projectRoom(projectId)).emit("scene-node:saved", { node: saved });
      } catch (err) {
        socket.emit("scene-node:error", { error: errorMessage(err) });
      }
    });

    socket.on("scene-node:delete", async (payload: unknown) => {
      const { projectId, nodeId } = (payload ?? {}) as {
        projectId?: unknown;
        nodeId?: unknown;
      };
      if (typeof projectId !== "string" || !projectId) return;
      if (typeof nodeId !== "string" || !nodeId) return;
      try {
        await deleteSceneNode(projectId, nodeId);
        io.to(projectRoom(projectId)).emit("scene-node:deleted", { nodeId });
      } catch (err) {
        socket.emit("scene-node:error", { error: errorMessage(err) });
      }
    });
  });
}
