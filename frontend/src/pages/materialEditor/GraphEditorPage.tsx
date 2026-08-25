import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
// three ships the runtime as a default export (`export default TSLGraphEditor`)
// while @types/three declares it as a named export — import the default and
// alias it to the name TypeScript expects.
// @ts-ignore -- runtime default export vs. @types/three named export mismatch
import TSLGraphEditorDefault from "three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js";
import { TSLGraphEditor } from "three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { GraphNodeUI } from "../../components/Editor/GraphNodeUI";
import { useTranslationService } from "../../components/Editor/worker/use-translator";
import { WebGPUCanvas } from "../../sdk/ui/WebGPUCanvas";
import { Environment, OrbitControls } from "@react-three/drei";
import { MaterialPreviewCodeMesh } from "../../components/Editor/MaterialPreviewMesh";

/**
 * Node-graph editor backed by three.js's official TSL Graph Editor.
 *
 * The editor ships as an inspector extension that hosts its UI in an iframe
 * (https://www.tsl-graph.xyz/editor/standalone) and talks to the host over
 * `postMessage`. We mount just its content element here and drive it with
 * `setMaterial`, so editing a node updates the live NodeMaterial in place.
 */
export function GraphEditorCore() {
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

const defaultData = {
  materialType: "MeshPhysicalNodeMaterial",
  rootNodeId: "dcda2b80-1597-4ef9-8917-2f28559512a3",
  materialSlots: {
    colorNode: "dcda2b80-1597-4ef9-8917-2f28559512a3",
  },
  nodes: [
    {
      id: "dcda2b80-1597-4ef9-8917-2f28559512a3",
      type: "VarNode",
      data: {
        inputNodes: {
          node: "6f12bbef-f9ba-45c1-b9d8-520ddfc188c4",
        },
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        global: true,
        parents: true,
        isNode: true,
        isVarNode: true,
        readOnly: false,
        intent: true,
      },
    },
    {
      id: "6f12bbef-f9ba-45c1-b9d8-520ddfc188c4",
      type: "JoinNode",
      data: {
        inputNodes: {
          nodes: [
            "524b6033-eec9-427f-90b0-d5a0e85938e9",
            "b3da57be-38f9-4648-9881-2e20c33a08fb",
            "4df64260-0d05-4add-a088-e423e2c1cbbf",
          ],
        },
      },
      customData: {
        nodeType: "vec3",
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
        isTempNode: true,
      },
    },
    {
      id: "524b6033-eec9-427f-90b0-d5a0e85938e9",
      type: "VarNode",
      data: {
        inputNodes: {
          node: "15f31210-5579-4012-9c98-8d957d1b852f",
        },
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        global: true,
        parents: true,
        isNode: true,
        isVarNode: true,
        readOnly: false,
        intent: true,
      },
    },
    {
      id: "15f31210-5579-4012-9c98-8d957d1b852f",
      type: "OperatorNode",
      data: {
        inputNodes: {
          aNode: "45d4cf6b-6840-487d-9e0a-c6e445b8509c",
          bNode: "e6562ed5-3d9c-4d3f-a131-90f60af0ad9d",
        },
        op: "*",
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
        isTempNode: true,
        isOperatorNode: true,
        intent: true,
      },
    },
    {
      id: "45d4cf6b-6840-487d-9e0a-c6e445b8509c",
      type: "VarNode",
      data: {
        inputNodes: {
          node: "ca058287-abf0-40c8-b9aa-ce5ab0ebc904",
        },
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        global: true,
        parents: true,
        isNode: true,
        isVarNode: true,
        readOnly: false,
        intent: true,
      },
    },
    {
      id: "ca058287-abf0-40c8-b9aa-ce5ab0ebc904",
      type: "OperatorNode",
      data: {
        inputNodes: {
          aNode: "b2c0981f-4f36-4f02-8e6d-6f8ae1ac0970",
          bNode: "2b8a3f4f-7b83-40aa-8fb9-72b97b7a55d5",
        },
        op: "+",
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
        isTempNode: true,
        isOperatorNode: true,
        intent: true,
      },
    },
    {
      id: "b2c0981f-4f36-4f02-8e6d-6f8ae1ac0970",
      type: "VarNode",
      data: {
        inputNodes: {
          node: "80372d7e-d368-49a0-ba3f-2c61988c3e16",
        },
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        global: true,
        parents: true,
        isNode: true,
        isVarNode: true,
        readOnly: false,
        intent: true,
      },
    },
    {
      id: "80372d7e-d368-49a0-ba3f-2c61988c3e16",
      type: "OperatorNode",
      data: {
        inputNodes: {
          aNode: "6212eeba-6054-41d0-a270-c942833cae43",
          bNode: "0f70aba6-0ef5-484e-8a3a-86c0b17e58eb",
        },
        op: "*",
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
        isTempNode: true,
        isOperatorNode: true,
        intent: true,
      },
    },
    {
      id: "6212eeba-6054-41d0-a270-c942833cae43",
      type: "SplitNode",
      data: {
        inputNodes: {
          node: "831f1e30-cf92-4c2a-a62b-79bcab267033",
        },
        components: "y",
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
        isSplitNode: true,
      },
    },
    {
      id: "831f1e30-cf92-4c2a-a62b-79bcab267033",
      type: "AttributeNode",
      data: {
        global: true,
        _attributeName: "uv",
      },
      customData: {
        nodeType: "vec2",
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        parents: false,
        isNode: true,
      },
    },
    {
      id: "0f70aba6-0ef5-484e-8a3a-86c0b17e58eb",
      type: "VarNode",
      data: {
        inputNodes: {
          node: "459a91f0-ef54-48ac-9ebd-c0a02f09a83c",
        },
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        global: true,
        parents: true,
        isNode: true,
        isVarNode: true,
        readOnly: false,
        intent: true,
      },
    },
    {
      id: "459a91f0-ef54-48ac-9ebd-c0a02f09a83c",
      type: "ConstNode",
      data: {
        value: 0.5,
        valueType: "float",
        nodeType: null,
        precision: null,
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
        isInputNode: true,
        isConstNode: true,
      },
    },
    {
      id: "2b8a3f4f-7b83-40aa-8fb9-72b97b7a55d5",
      type: "VarNode",
      data: {
        inputNodes: {
          node: "459a91f0-ef54-48ac-9ebd-c0a02f09a83c",
        },
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        global: true,
        parents: true,
        isNode: true,
        isVarNode: true,
        readOnly: false,
        intent: true,
      },
    },
    {
      id: "e6562ed5-3d9c-4d3f-a131-90f60af0ad9d",
      type: "VarNode",
      data: {
        inputNodes: {
          node: "4f863374-e31d-42d9-9cf0-f28caf07939d",
        },
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        global: true,
        parents: true,
        isNode: true,
        isVarNode: true,
        readOnly: false,
        intent: true,
      },
    },
    {
      id: "4f863374-e31d-42d9-9cf0-f28caf07939d",
      type: "ConstNode",
      data: {
        value: 1.5,
        valueType: "float",
        nodeType: null,
        precision: null,
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
        isInputNode: true,
        isConstNode: true,
      },
    },
    {
      id: "b3da57be-38f9-4648-9881-2e20c33a08fb",
      type: "VarNode",
      data: {
        inputNodes: {
          node: "f0d39336-2698-44d9-9dab-c79a498843d4",
        },
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        global: true,
        parents: true,
        isNode: true,
        isVarNode: true,
        readOnly: false,
        intent: true,
      },
    },
    {
      id: "f0d39336-2698-44d9-9dab-c79a498843d4",
      type: "ConvertNode",
      data: {
        inputNodes: {
          node: "4e44d12a-943d-49bb-b6cb-2deaf345f6e7",
        },
        convertTo: "float",
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
      },
    },
    {
      id: "4e44d12a-943d-49bb-b6cb-2deaf345f6e7",
      type: "SplitNode",
      data: {
        inputNodes: {
          node: "16a849f2-ebcd-45f0-851c-8df947804b1f",
        },
        components: "y",
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
        isSplitNode: true,
      },
    },
    {
      id: "16a849f2-ebcd-45f0-851c-8df947804b1f",
      type: "AttributeNode",
      data: {
        global: true,
        _attributeName: "uv",
      },
      customData: {
        nodeType: "vec2",
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        parents: false,
        isNode: true,
      },
    },
    {
      id: "4df64260-0d05-4add-a088-e423e2c1cbbf",
      type: "VarNode",
      data: {
        inputNodes: {
          node: "0ef228eb-8bf4-4619-91b5-b825dc1d9f51",
        },
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        global: true,
        parents: true,
        isNode: true,
        isVarNode: true,
        readOnly: false,
        intent: true,
      },
    },
    {
      id: "0ef228eb-8bf4-4619-91b5-b825dc1d9f51",
      type: "ConstNode",
      data: {
        value: 0.3,
        valueType: "float",
        nodeType: "float",
        precision: null,
      },
      customData: {
        updateType: "none",
        updateBeforeType: "none",
        updateAfterType: "none",
        version: 0,
        name: "",
        global: false,
        parents: false,
        isNode: true,
        isInputNode: true,
        isConstNode: true,
      },
    },
  ],
  edges: [],
};

let defaultCode = `
import * as THREE from 'three/webgpu'
import * as TSL from 'three/tsl'

return async function materialFunction () {

    const mat = new THREE.MeshPhysicalNodeMaterial();

    mat.colorNode = TSL.vec3(TSL.mul(TSL.add(TSL.mul(TSL.uv().y, TSL.float(0.5)), TSL.float(0.5)), TSL.float(1.5)), TSL.float(TSL.uv().y), TSL.float(0.3));

    return mat;
}
`;

export function GraphEditorPage() {
  let [tslCode, setTSLCode] = useState(defaultCode);

  let [json, setJSON] = useState(null);
  const { translateAsync } = useTranslationService();

  useEffect(() => {
    if (!tslCode) {
      return;
    }
    translateAsync(`${tslCode}`)?.then((result: any) => {
      setJSON(result.jsonGraph);
    });
  }, [tslCode]);

  return (
    <>
      <div className="w-full h-full">
        <div className="w-full h-1/2">
          {json && (
            <GraphNodeUI key={JSON.stringify(json)} json={json}></GraphNodeUI>
          )}
        </div>
        <div className="w-full h-1/2">
          <WebGPUCanvas>
            <MaterialPreviewCodeMesh
              tslCode={tslCode}
            ></MaterialPreviewCodeMesh>
            <OrbitControls makeDefault></OrbitControls>
            <Environment files={[`/hdr/venice_sunset_1k.hdr`]}></Environment>
          </WebGPUCanvas>
        </div>
      </div>
    </>
  );
}
