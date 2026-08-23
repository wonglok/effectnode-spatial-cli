import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CanvasArea } from "../sdk/ui/CanvasArea";
import { FileManager } from "../components/Editor/FileManager";
import { OutlinePanel } from "../components/Editor/OutlinePanel";
import { PropsEditor } from "../components/Editor/PropsEditor";
import { Toolbar } from "../components/Editor/Toolbar";
import { api } from "../lib/api";
import { joinProjectRoom, sendDesignUpdate } from "../lib/socket";
import { useEditorStore } from "../store/editorStore";
import type { SceneNode } from "../sdk/types/scene";
import { useProjectsStore } from "../store/projectsStore";
import { useUiStore } from "../store/uiStore";

export function VfxDesignPage() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.slug === projectID),
  );
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const scene = useEditorStore((state) => state.scene);
  const setScene = useEditorStore((state) => state.setScene);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSidebarCollapsed(true);
    return () => {
      setSidebarCollapsed(false);
    };
  }, [setSidebarCollapsed]);

  // Restore the persisted design so a refresh doesn't lose the scene.
  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    setLoading(true);
    api
      .get<{ scene?: SceneNode[] }>(
        `/projects/${encodeURIComponent(project.slug)}/design`,
      )
      .then((design) => {
        if (
          !cancelled &&
          Array.isArray(design?.scene) &&
          design.scene.length > 0
        ) {
          setScene(design.scene);
        }
      })
      .catch(() => {
        // No persisted design yet; keep the default scene.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project, setScene]);

  useEffect(() => {
    if (project) {
      joinProjectRoom(project.slug);
    }
  }, [project]);

  // Broadcast every scene change (after the initial load) to the room.
  useEffect(() => {
    if (project && !loading) {
      sendDesignUpdate(project.slug, { scene });
    }
  }, [project, scene, loading]);

  // Auto-save the design (debounced) after any scene change — including when a
  // GLB is dropped from the file manager.
  useEffect(() => {
    if (!project || loading) return;
    const timer = setTimeout(() => {
      api
        .put(`/projects/${encodeURIComponent(project.slug)}/design`, { scene })
        .catch(() => {
          // Backend unreachable; the next scene change will retry.
        });
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [project, scene, loading]);

  if (!project) return null;

  return (
    <div className="flex h-full w-full overflow-hidden">
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
