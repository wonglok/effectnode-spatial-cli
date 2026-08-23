import { io, type Socket } from "socket.io-client";

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
