import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { FileManager } from "../components/Editor/FileManager";
import { OutlinePanel } from "../components/Editor/OutlinePanel";
import { PropsEditor } from "../components/Editor/PropsEditor";
import { Toolbar } from "../components/Editor/Toolbar";
import { useProjectsStore } from "../store/projectsStore";
import { useUiStore } from "../store/uiStore";
import { CanvasArea } from "../components/Editor/CanvasArea";

export function VfxDesignPage() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.slug === projectID),
  );
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);

  useEffect(() => {
    setSidebarCollapsed(true);
    return () => {
      setSidebarCollapsed(false);
    };
  }, [setSidebarCollapsed]);

  if (!project) return null;

  return (
    <div className="flex h-full min-h-[560px] overflow-hidden rounded-xl border border-ink-200 bg-white">
      <OutlinePanel />

      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        <div className="min-h-0 flex-1 bg-ink-50/60">
          <CanvasArea></CanvasArea>
        </div>
        <FileManager />
      </div>

      <PropsEditor />
    </div>
  );
}
