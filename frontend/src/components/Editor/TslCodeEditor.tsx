import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { MeshStandardNodeMaterial, NodeMaterialLoader } from "three/webgpu";

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
// import TSLGraphEditor from "three/examples/jsm/inspector/extensions/tsl-graph/TSLGraphEditor.js";
// import { TSLGraphLoader } from "three/examples/jsm/inspector/extensions/tsl-graph/TSLGraphLoader.js";
// import { Inspector } from "three/addons/inspector/Inspector.js";

// import TSLGraphEditorDefault from "three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js";
import {
  MeshPhysicalNodeMaterial,
  NodeMaterial,
  NodeMaterialObserver,
} from "three/webgpu";
import { useTranslationService } from "./worker/use-translator";
import { WebGPUCanvas } from "../../sdk/ui/WebGPUCanvas";
import { Environment } from "@react-three/drei";
import { hydrateJSONToNodeMaterial } from "./worker/materialParser";
import { defaultNodeRegistry } from "./worker/nodeRegistry";
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
  const [tslCode, setCode] = useState(
    `

return async function materialFunction ({ THREE, TSL }) {

    const mat = new THREE.MeshPhysicalNodeMaterial({
      name: 'loklok'
    })

    mat.colorNode = TSL.vec3(TSL.uv().y.mul(0.5).add(0.5), TSL.float(0.0), TSL.float(0.3));

    return mat
}


`.trim(),
  );

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

  const { translateAsync } = useTranslationService();

  const [material, setMaterial] = useState<any>(null);
  useEffect(() => {
    translateAsync(`${tslCode}`)
      ?.then((r: any) => {
        //

        // Hydrate -> Re-created Material using auto-populated registry
        const restoredMaterial = hydrateJSONToNodeMaterial(
          r.jsonGraph,
          MeshPhysicalNodeMaterial,
          defaultNodeRegistry,
        );

        setTimeout(() => {
          setMaterial(
            <Suspense fallback={null}>
              <mesh material={restoredMaterial}>
                <sphereGeometry></sphereGeometry>
              </mesh>
            </Suspense>,
          );
        });
      })
      .catch((r) => {
        console.error(r);
      });

    return () => {
      setMaterial(null);
    };
  }, [translateAsync, tslCode]);

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
        <div className="w-full h-1/2">
          <WebGPUCanvas key={material?.uuid}>
            {/*  */}

            {material}

            <Suspense fallback={null}>
              <Environment preset="city"></Environment>
            </Suspense>
          </WebGPUCanvas>
        </div>
      </div>
    </>
  );
}
