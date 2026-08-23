import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CanvasArea } from "../sdk/ui/CanvasArea";
import { api } from "../lib/api";
import { getSocket, joinProjectRoom } from "../lib/socket";
import type { SceneNode } from "../types/scene";

export function VfxPreviewPage() {
  const { projectID } = useParams();
  const [scene, setScene] = useState<SceneNode[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!projectID) return;

    const socket = getSocket();
    joinProjectRoom(projectID);
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onDesignUpdated = (payload: unknown) => {
      const design = (payload as { design?: { scene?: SceneNode[] } } | null)
        ?.design;
      if (design?.scene) setScene(design.scene);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("design:updated", onDesignUpdated);

    // Load the initial design over REST (in case the editor hasn't synced yet).
    api
      .get<{ scene?: SceneNode[] }>(
        `/projects/${encodeURIComponent(projectID)}/design`,
      )
      .then((design) => {
        if (design?.scene) setScene(design.scene);
      })
      .catch(() => {
        // No persisted design yet; the editor will broadcast one when it opens.
      });

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("design:updated", onDesignUpdated);
    };
  }, [projectID]);

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex items-center justify-between px-4 py-3 text-sm text-white">
        <span className="font-medium">Preview</span>
        <span className={connected ? "text-tiffany-400" : "text-ink-500"}>
          {connected ? "● Live" : "○ Offline"}
        </span>
      </header>
      <div className="min-h-0 flex-1">
        <CanvasArea scene={scene} />
      </div>
    </div>
  );
}
