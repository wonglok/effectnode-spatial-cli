import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { CanvasArea } from "../sdk/ui/CanvasArea";
import { FileManager } from "../components/Editor/FileManager";
import { OutlinePanel } from "../components/Editor/OutlinePanel";
import { PropsEditor } from "../components/Editor/PropsEditor";
import { Toolbar } from "../components/Editor/Toolbar";
import { api } from "../lib/api";
import { joinProjectRoom, sendDesignUpdate } from "../lib/socket";
import { useEditorStore } from "../store/editorStore";
import { useProjectsStore } from "../store/projectsStore";
import { useUiStore } from "../store/uiStore";

export function VfxDesignPage() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.slug === projectID),
  );
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const scene = useEditorStore((state) => state.scene);

  useEffect(() => {
    setSidebarCollapsed(true);
    return () => {
      setSidebarCollapsed(false);
    };
  }, [setSidebarCollapsed]);

  // Join the project room so the preview can follow this editor in realtime.
  useEffect(() => {
    if (project) joinProjectRoom(project.slug);
  }, [project]);

  // Broadcast every scene change (including the initial state) to the room.
  useEffect(() => {
    if (project) sendDesignUpdate(project.slug, { scene });
  }, [project, scene]);

  // Auto-save the design (debounced) after any scene change — including when a
  // GLB is dropped from the file manager — so persistence doesn't depend on the
  // socket being connected.
  useEffect(() => {
    if (!project) return;
    const timer = setTimeout(() => {
      api
        .put(`/projects/${encodeURIComponent(project.slug)}/design`, { scene })
        .catch(() => {
          // Backend unreachable; the next scene change will retry.
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [project, scene]);

  if (!project) return null;

  return (
    <div className="flex h-full min-h-[560px] overflow-hidden">
      <OutlinePanel />

      <div className="flex min-w-0 flex-1 flex-col">
        <Toolbar />
        <div className="min-h-0 flex-1 bg-white">
          <CanvasArea scene={scene} editable />
        </div>
        <FileManager projectId={project.slug} />
      </div>

      <PropsEditor />
    </div>
  );
}
