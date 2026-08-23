import { io, type Socket } from "socket.io-client";
import type { SceneNode } from "../sdk/types/scene";

let socket: Socket | null = null;

/** Lazily connect a singleton socket.io client (same-origin, via the vite proxy). */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({ autoConnect: true });
  }
  return socket;
}

/** Join the per-project room so this client receives realtime design updates. */
export function joinProjectRoom(projectId: string): void {
  getSocket().emit("project:join", { projectId });
}

/** Push the current design to the server (persists + broadcasts to the room). */
export function sendDesignUpdate(projectId: string, design: unknown): void {
  getSocket().emit("design:update", { projectId, design });
}

/** Scene-node CRUD over socket.io. */

export function listSceneNodes(projectId: string): Promise<SceneNode[]> {
  return new Promise((resolve, reject) => {
    getSocket().emit(
      "scene-node:list",
      { projectId },
      (res: { nodes?: SceneNode[]; error?: string }) => {
        if (res?.error) reject(new Error(res.error));
        else resolve(res?.nodes ?? []);
      },
    );
  });
}

export function saveSceneNode(projectId: string, node: SceneNode): void {
  getSocket().emit("scene-node:save", { projectId, node });
}

export function deleteSceneNode(projectId: string, nodeId: string): void {
  getSocket().emit("scene-node:delete", { projectId, nodeId });
}
