import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { CanvasArea } from "../sdk/ui/CanvasArea";
import { FileManager } from "../components/Editor/FileManager";
import { OutlinePanel } from "../components/Editor/OutlinePanel";
import { PropsEditor } from "../components/Editor/PropsEditor";
import { Toolbar } from "../components/Editor/Toolbar";
import { useEditorStore } from "../store/editorStore";
import { useProjectsStore } from "../store/projectsStore";
import { useUiStore } from "../store/uiStore";
import { useDesignSocket } from "../lib/designSocket";

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

  // Undo/redo keyboard shortcuts (⌘/Ctrl+Z, ⇧⌘/Ctrl+Shift+Z). Skipped while
  // typing in a field so the browser's native text undo keeps working there.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) useEditorStore.getState().redo();
        else useEditorStore.getState().undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load the persisted design and live-sync edits over the socket. Local
  // mutations emit through the store, so no separate autosave is needed.
  // Hoisted above the early return so the hook count stays stable on first
  // render (when `project` is still undefined while projects are loading).
  useDesignSocket(project?.slug ?? null, { editable: true });

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
