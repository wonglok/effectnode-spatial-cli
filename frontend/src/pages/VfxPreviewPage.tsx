import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CanvasArea } from "../sdk/ui/CanvasArea";
import { api } from "../lib/api";
import { getSocket, joinProjectRoom } from "../lib/socket";
import { useEditorStore } from "../store/editorStore";
import type { SceneNode } from "../sdk/types/scene";

export function VfxPreviewPage() {
  const { projectID } = useParams();
  const scene = useEditorStore((state) => state.scene);
  const setScene = useEditorStore((state) => state.setScene);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!projectID) return;

    const socket = getSocket();
    joinProjectRoom(projectID);
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNodeSaved = (payload: unknown) => {
      const node = (payload as { node?: SceneNode } | null)?.node;
      if (node?.id) useEditorStore.getState().upsertNode(node);
    };
    const onNodeDeleted = (payload: unknown) => {
      const nodeId = (payload as { nodeId?: string } | null)?.nodeId;
      if (nodeId) useEditorStore.getState().removeNode(nodeId);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("scene-node:saved", onNodeSaved);
    socket.on("scene-node:deleted", onNodeDeleted);

    // Load the initial design over REST (in case the editor hasn't synced yet).
    api
      .get<{ scene?: SceneNode[] }>(
        `/projects/${encodeURIComponent(projectID)}/design`,
      )
      .then((design) => {
        if (design?.scene) setScene(design.scene);
      })
      .catch(() => {
        // No persisted design yet; node updates will arrive over socket as the
        // editor changes.
      });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("scene-node:saved", onNodeSaved);
      socket.off("scene-node:deleted", onNodeDeleted);
    };
  }, [projectID, setScene]);

  return (
    <div className="flex h-screen relative flex-col bg-white">
      <div className="w-full h-full">
        <CanvasArea scene={scene} />
      </div>
      <header className="flex items-center justify-between px-4 py-3 text-sm text-white absolute top-0 right-0">
        <span className="font-medium">Preview</span>
        <span className={connected ? "text-tiffany-400" : "text-ink-500"}>
          {connected ? "● Live" : "○ Offline"}
        </span>
      </header>
    </div>
  );
}
