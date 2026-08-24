import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
// three ships the runtime as a default export (`export default TSLGraphEditor`)
// while @types/three declares it as a named export — import the default and
// alias it to the name TypeScript expects.
// @ts-ignore -- runtime default export vs. @types/three named export mismatch
import TSLGraphEditorDefault from "three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js";
// import { TSLGraphEditor } from "three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js";
// import { MeshPhysicalNodeMaterial } from "three/webgpu";

// import * as THREE from "three/webgpu";

// import { TSLGraphLoader } from "three/examples/jsm/inspector/extensions/tsl-graph/TSLGraphLoader.js";
// import * as TSL from "three/tsl";
// import {
//   hydrateJSONToNodeMaterial,
//   parseNodeMaterialToJSON,
// } from "../code-material-json/materialParser";
// import { defaultNodeRegistry } from "../code-material-json/nodeRegistry";

/**
 * Default material preview — a sphere with 64×64 segments shown before the
 * user uploads a GLB. Kept as its own component so the GLB viewer can swap it
 * out for the uploaded model (or the authored TSL material) later.
 */
export function MaterialPreview({
  code,
}: {
  code: string;
  /** Optional node material to apply; defaults to a neutral standard material. */
}) {
  const ref = useRef(null);

  return (
    <>
      <mesh ref={ref}>
        <sphereGeometry args={[1, 64, 64]} />
        {/* {material ?? (
          <meshStandardMaterial color="#cccccc" roughness={0.5} metalness={0} />
        )} */}
      </mesh>

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />

      <OrbitControls makeDefault enableDamping />
      <gridHelper args={[10, 10, 0x777777, 0xbababa]} />
    </>
  );
}
