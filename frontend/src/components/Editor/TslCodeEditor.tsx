import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { useEffect, useRef, useState } from "react";

import { useParams } from "react-router-dom";

import { useTranslationService } from "./worker/use-translator";
import { WebGPUCanvas } from "../../sdk/ui/WebGPUCanvas";
// import { GraphNodeUI } from "./GraphNodeUI";
import { MaterialPreviewGarphMesh } from "./MaterialPreviewMesh";
import { useMaterialEditorStore } from "../../store/materialEditorStore";
import { Environment, OrbitControls } from "@react-three/drei";
// import { MaterialGraphJSON } from "./worker/types";
// import { jsonToCode } from "./worker/json-to-code";

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
  const { projectID, materialSlug } = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tslCode, setCode] = useState(() => {
    return `
import * as THREE from "three/webgpu";
import * as TSL from "three/tsl";

return async function materialFunction() {
  const mat = new THREE.MeshPhysicalNodeMaterial();

  mat.colorNode = TSL.vec3(
    TSL.mul(
      TSL.add(TSL.mul(TSL.uv().y, TSL.float(-0.5)), TSL.float(-0.5)),
      TSL.float(1.5),
    ),
    TSL.float(TSL.uv().y),
    TSL.float(0.3),
  );

  return mat;
};

`.trim();
  });

  const handleMount: OnMount = (editor) => {
    // Rely on `automaticLayout` (set by @monaco-editor/react) to fill the pane.
    editor.focus();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    return () => {
      //
    };
  }, [materialSlug]);

  const [json, setJSON] = useState<any>(null);
  const { translateAsync, ready } = useTranslationService();

  const load = useMaterialEditorStore((s) => s.load);
  const save = useMaterialEditorStore((s) => s.save);
  const setTslCode = useMaterialEditorStore((s) => s.setTslCode);
  const setJson = useMaterialEditorStore((s) => s.setJson);

  // Load the stored TSL code from the backend.
  useEffect(() => {
    if (!projectID || !materialSlug) return;
    load(projectID, materialSlug).then((code) => {
      if (code) setCode(code);
    });
  }, [projectID, materialSlug, load]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!tslCode) {
      return;
    }

    translateAsync(`${tslCode}`)?.then((result: any) => {
      setJSON(result.jsonGraph);
      setJson(result.jsonGraph);
    });
  }, [tslCode, ready, translateAsync, setJson]);

  // Debounced save: keep the store in sync and persist the code to the backend.
  useEffect(() => {
    if (!projectID || !materialSlug) return;
    setTslCode(tslCode);
    if (json) setJson(json);
    const timer = setTimeout(() => {
      save(projectID, materialSlug).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [tslCode, json, projectID, materialSlug, setTslCode, setJson, save]);

  if (!ready) {
    return null;
  }

  return (
    <>
      {/*  */}
      {/*  */}
      {/*  */}
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

        <div className="w-full h-1/2">
          {
            <WebGPUCanvas>
              {json && (
                <MaterialPreviewGarphMesh
                  jsonGraph={json}
                ></MaterialPreviewGarphMesh>
              )}
              <OrbitControls makeDefault></OrbitControls>
              <Environment files={[`/hdr/venice_sunset_1k.hdr`]}></Environment>
            </WebGPUCanvas>
          }
        </div>
      </div>
    </>
  );
}
