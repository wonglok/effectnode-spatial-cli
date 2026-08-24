import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import type { SceneNode } from "../sdk/types/scene";
import { useEditorStore } from "../store/editorStore";

export type Design = { scene: SceneNode[]; [key: string]: unknown };

export interface DesignSocketHandlers {
  onState(design: Design): void;
  onNodeAdded(node: SceneNode): void;
  onNodeRemoved(id: string): void;
  onNodeRenamed(id: string, name: string): void;
  onNodePatched(id: string, params: Record<string, unknown>): void;
  onSceneReplaced(scene: SceneNode[]): void;
}

// Module-level singleton: one socket.io connection serves whichever page is
// mounted. The server->client listeners attach when the socket is created and
// forward to the currently active handlers.
let socket: Socket | null = null;
let currentProject: string | null = null;
let currentScene: string | null = null;
let handlers: DesignSocketHandlers | null = null;

function ensureSocket(): Socket {
  if (socket) return socket;
  socket = io({ path: "/ws/socket.io" });

  socket.on("design:state", (payload: { design: Design }) => {
    handlers?.onState(payload.design);
  });
  socket.on("scene:added", (payload: { node: SceneNode }) => {
    handlers?.onNodeAdded(payload.node);
  });
  socket.on("scene:removed", (payload: { id: string }) => {
    handlers?.onNodeRemoved(payload.id);
  });
  socket.on("scene:renamed", (payload: { id: string; name: string }) => {
    handlers?.onNodeRenamed(payload.id, payload.name);
  });
  socket.on(
    "scene:patched",
    (payload: { id: string; params: Record<string, unknown> }) => {
      handlers?.onNodePatched(payload.id, payload.params);
    },
  );
  socket.on("scene:replaced", (payload: { nodes: SceneNode[] }) => {
    handlers?.onSceneReplaced(payload.nodes);
  });

  return socket;
}

export function connectDesignSocket(
  project: string,
  scene: string,
  h: DesignSocketHandlers,
): void {
  handlers = h;
  currentProject = project;
  currentScene = scene;
  ensureSocket().emit("design:join", { project, scene });
}

export function disconnectDesignSocket(): void {
  // Drop the connection so the socket leaves every room it joined. This keeps a
  // stale room (from a previous project/scene) from leaking its broadcasts into
  // the next scene's handlers when navigating between projects/scenes.
  handlers = null;
  currentProject = null;
  currentScene = null;
  socket?.disconnect();
  socket = null;
}

export const designSocket = {
  emitSceneAdd(node: SceneNode): void {
    if (!socket || !currentProject || !currentScene) return;
    socket.emit("scene:add", {
      project: currentProject,
      scene: currentScene,
      node,
    });
  },
  emitSceneRemove(id: string): void {
    if (!socket || !currentProject || !currentScene) return;
    socket.emit("scene:remove", {
      project: currentProject,
      scene: currentScene,
      id,
    });
  },
  emitSceneRename(id: string, name: string): void {
    if (!socket || !currentProject || !currentScene) return;
    socket.emit("scene:rename", {
      project: currentProject,
      scene: currentScene,
      id,
      name,
    });
  },
  emitScenePatch(id: string, params: Record<string, unknown>): void {
    if (!socket || !currentProject || !currentScene) return;
    socket.emit("scene:patch", {
      project: currentProject,
      scene: currentScene,
      id,
      params,
    });
  },
  emitSceneReplace(nodes: SceneNode[]): void {
    if (!socket || !currentProject || !currentScene) return;
    socket.emit("scene:replace", {
      project: currentProject,
      scene: currentScene,
      nodes,
    });
  },
};

export function useDesignSocket(
  project: string | null,
  scene: string | null,
  opts: { editable: boolean },
): void {
  useEffect(() => {
    if (!project || !scene) return;
    const store = useEditorStore.getState();
    connectDesignSocket(project, scene, {
      onState: (design) => store.setScene(design.scene),
      onNodeAdded: (node) => store.applyNodeAdded(node),
      onNodeRemoved: (id) => store.applyNodeRemoved(id),
      onNodeRenamed: (id, name) => store.applyNodeRenamed(id, name),
      onNodePatched: (id, params) => store.applyNodePatched(id, params),
      onSceneReplaced: (nodes) => store.applySceneReplaced(nodes),
    });
    return () => disconnectDesignSocket();
  }, [project, scene, opts.editable]);
}
