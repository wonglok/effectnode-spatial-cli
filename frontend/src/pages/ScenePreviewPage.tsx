import { useParams } from "react-router-dom";
import { CanvasArea } from "../sdk/ui/CanvasArea";
import { useEditorStore } from "../store/editorStore";
import { useDesignSocket } from "../lib/designSocket";

export function ScenePreviewPage() {
  const { projectID, sceneSlug } = useParams();
  const scene = useEditorStore((state) => state.scene);

  // Live-sync the persisted design over the socket (read-only preview).
  useDesignSocket(projectID ?? null, sceneSlug ?? null, { editable: false });

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
