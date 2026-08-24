import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { useEffect, useMemo, useRef, useState } from "react";

// import * as THREE from "three/webgpu";
// import * as TSL from "three/tsl";
// import {
//   hydrateJSONToNodeMaterial,
//   parseNodeMaterialToJSON,
// } from "../../sdk/code-material-json/materialParser";
// import { defaultNodeRegistry } from "../../sdk/code-material-json/nodeRegistry";
// import { GlbViewerPage } from "../../pages/materialEditor/GlbViewerPage";
import { useParams } from "react-router-dom";

// @ts-ignore
import TSLGraphEditor from "three/examples/jsm/inspector/extensions/tsl-graph/TSLGraphEditor.js";
// import { TSLGraphLoader } from "three/examples/jsm/inspector/extensions/tsl-graph/TSLGraphLoader.js";
// import { Inspector } from "three/addons/inspector/Inspector.js";

// import TSLGraphEditorDefault from "three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js";
import { InspectorBase, MeshPhysicalNodeMaterial } from "three/webgpu";
// import { tslToJSON } from "../../sdk/code-material-json/convertTSLCodeToJSONAll";
// import {
//   convertJsonToTSLCodeAll,
//   generateTSLCode,
// } from "../../sdk/code-material-json/convertJsonToTSLCodeAll";

// ---------------------------------------------------------------------------
// Serve Monaco's web workers from locally-bundled files (via Vite's ?worker)
// instead of the default CDN, keeping the app CORS-safe and offline-capable.
// ---------------------------------------------------------------------------
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === "typescript" || label === "javascript") return new TsWorker();
    if (label === "json") return new JsonWorker();
    return new EditorWorker();
  },
};

// Point @monaco-editor/react's loader at the locally-installed monaco (no CDN).
loader.config({ monaco });

const EDITOR_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 13,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  scrollBeyondLastLine: false,
  tabSize: 4,
  wordWrap: "on",
};

export function TslCodeEditor() {
  return (
    <div className="h-full w-full">
      <GraphEditorUnit></GraphEditorUnit>
    </div>
  );
}

function GraphEditorUnit({}: {}) {
  const { materialSlug } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<TSLGraphEditor | null>(null);
  const [tslCode, setCode] = useState(``);

  const handleMount: OnMount = (editor) => {
    // Rely on `automaticLayout` (set by @monaco-editor/react) to fill the pane.
    editor.focus();
  };

  const material = useMemo(() => {
    const material = new MeshPhysicalNodeMaterial();
    material.userData.graphId = `material:${materialSlug ?? "untitled"}`;
    return material;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const inspector = new InspectorBase();
    const editor = new TSLGraphEditor(inspector) as TSLGraphEditor;
    editorRef.current = editor;

    // `content` is the DOM root the Tab base class builds (header + iframe).
    // It isn't exposed on the TSLGraphEditor type, so read it via a narrow cast.
    const content = (editor as unknown as { content: HTMLDivElement }).content;

    // Mount the editor's DOM (header + iframe) into our page.
    container.appendChild(content);

    // The editor needs a NodeMaterial to edit; give it a default physical
    // material keyed by the material's slug until real graph persistence lands.
    editor.setMaterial(material).catch((err: unknown) => {
      console.warn("TSL Graph Editor failed to attach material:", err);
    });

    editor.getGraph().then((graph: any) => {
      console.log(graph);
    });

    editor.getCode().then((info: any) => {
      console.log(info?.material);

      if (info?.material) {
      }
    });

    //

    // const loader = new TSLGraphLoader() as any;
    // const applier = loader.parse(editor.getCodes() as any);
    // applier.apply(scene);

    return () => {
      if (container.contains(content)) {
        container.removeChild(content);
      }
      editorRef.current = null;
    };
  }, [materialSlug]);

  useEffect(() => {
    //
    if (!editorRef.current) {
      return;
    }

    //

    //
  }, [tslCode]);

  return (
    <>
      <div className="w-full h-full">
        <Editor
          height="50%"
          language="typescript"
          theme="vs-dark"
          value={tslCode}
          onChange={(value) => setCode(value ?? "")}
          onMount={handleMount}
          options={EDITOR_OPTIONS}
        />
        <div ref={containerRef} className="h-1/2 w-full" />
      </div>
    </>
  );
}
