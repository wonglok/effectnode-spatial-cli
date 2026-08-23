import type { Server, Socket } from "socket.io";
import { saveDesign } from "./routers/projects.js";

function projectRoom(projectId: string): string {
  return `project:${projectId}`;
}

/**
 * Wire up socket.io for realtime design sync. A client joins a per-project
 * room with `project:join { projectId }`; when it emits `design:update`, we
 * persist the design and broadcast `design:updated` to everyone else in the
 * room (e.g. a phone viewing the /vfx-preview route).
 */
export function setupRealtime(io: Server): void {
  io.on("connection", (socket: Socket) => {
    socket.on("project:join", (payload: unknown) => {
      const projectId = (payload as { projectId?: unknown } | null)?.projectId;
      if (typeof projectId === "string" && projectId) {
        socket.join(projectRoom(projectId));
      }
    });

    socket.on("design:update", async (payload: unknown) => {
      const { projectId, design } = (payload ?? {}) as {
        projectId?: unknown;
        design?: unknown;
      };

      if (typeof projectId !== "string" || !projectId) return;

      try {
        await saveDesign(projectId, design);
        io.to(projectRoom(projectId)).emit("design:updated", { design });
      } catch (err) {
        socket.emit("design:error", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    });
  });
}
