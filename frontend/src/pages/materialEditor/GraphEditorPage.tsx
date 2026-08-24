import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
// three ships the runtime as a default export (`export default TSLGraphEditor`)
// while @types/three declares it as a named export — import the default and
// alias it to the name TypeScript expects.
// @ts-ignore -- runtime default export vs. @types/three named export mismatch
import TSLGraphEditorDefault from "three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js";
import { TSLGraphEditor } from "three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js";
import { MeshPhysicalNodeMaterial } from "three/webgpu";

/**
 * Node-graph editor backed by three.js's official TSL Graph Editor.
 *
 * The editor ships as an inspector extension that hosts its UI in an iframe
 * (https://www.tsl-graph.xyz/editor/standalone) and talks to the host over
 * `postMessage`. We mount just its content element here and drive it with
 * `setMaterial`, so editing a node updates the live NodeMaterial in place.
 */
export function GraphEditorPage() {
  const { materialSlug } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<TSLGraphEditor | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const editor = new TSLGraphEditorDefault() as unknown as TSLGraphEditor;
    editorRef.current = editor;

    // `content` is the DOM root the Tab base class builds (header + iframe).
    // It isn't exposed on the TSLGraphEditor type, so read it via a narrow cast.
    const content = (editor as unknown as { content: HTMLDivElement }).content;

    // Mount the editor's DOM (header + iframe) into our page.
    container.appendChild(content);

    // The editor needs a NodeMaterial to edit; give it a default physical
    // material keyed by the material's slug until real graph persistence lands.
    const material = new MeshPhysicalNodeMaterial();
    material.userData.graphId = `material:${materialSlug ?? "untitled"}`;
    editor.setMaterial(material).catch((err: unknown) => {
      console.warn("TSL Graph Editor failed to attach material:", err);
    });

    return () => {
      if (container.contains(content)) {
        container.removeChild(content);
      }
      editorRef.current = null;
    };
  }, [materialSlug]);

  return <div ref={containerRef} className="h-full w-full" />;
}
