import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { CanvasArea } from "../sdk/ui/CanvasArea";
import { api } from "../lib/api";
import { useEditorStore } from "../store/editorStore";
import type { SceneNode } from "../sdk/types/scene";

export function VfxPreviewPage() {
  const { projectID } = useParams();
  const scene = useEditorStore((state) => state.scene);
  const setScene = useEditorStore((state) => state.setScene);

  useEffect(() => {
    if (!projectID) return;

    // Load the persisted design over REST.
    api
      .get<{ scene?: SceneNode[] }>(
        `/projects/${encodeURIComponent(projectID)}/design`,
      )
      .then((design) => {
        if (design?.scene) setScene(design.scene);
      })
      .catch(() => {
        // No persisted design yet.
      });
  }, [projectID, setScene]);

  return (
    <div className="flex h-screen relative flex-col bg-white">
      <div className="w-full h-full">
        <CanvasArea scene={scene} />
      </div>
      <header className="flex items-center justify-between px-4 py-3 text-sm text-white absolute top-0 right-0">
        <span className="font-medium">Preview</span>
      </header>
    </div>
  );
}
