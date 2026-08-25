import { Suspense, useEffect, useMemo, useRef, useState } from "react";

// import * as THREE from "three/webgpu";
// import * as TSL from "three/tsl";
// import {
//   hydrateJSONToNodeMaterial,
//   parseNodeMaterialToJSON,
// } from "../../sdk/code-material-json/materialParser";
// import { defaultNodeRegistry } from "../../sdk/code-material-json/nodeRegistry";
// import { GlbViewerPage } from "../../pages/materialEditor/GlbViewerPage";

// @ts-ignore
// import TSLGraphEditor from "three/examples/jsm/inspector/extensions/tsl-graph/TSLGraphEditor.js";
// import { TSLGraphLoader } from "three/examples/jsm/inspector/extensions/tsl-graph/TSLGraphLoader.js";
// import { Inspector } from "three/addons/inspector/Inspector.js";

// import TSLGraphEditorDefault from "three/addons/inspector/extensions/tsl-graph/TSLGraphEditor.js";
import { MeshPhysicalNodeMaterial, SphereGeometry } from "three/webgpu";
import { useTranslationService } from "./worker/use-translator";
import { hydrateMaterialAsync } from "./worker/materialParser";
import { defaultNodeRegistry } from "./worker/nodeRegistry";
// import { jsonToCode } from "./worker/json-to-code";
import { MaterialGraphJSON } from "./worker/types";

// export function MaterialPreviewCodeMesh({ tslCode = "" }: { tslCode: string }) {
//   const { translateAsync } = useTranslationService();
//   const [material, setMaterial] = useState<any>(null);
//   useEffect(() => {
//     translateAsync(`${tslCode}`)
//       ?.then((r: any) => {
//         //
//         //

//         // console.log(r.jsonGraph);
//         // let tslCode = jsonToCode(r.jsonGraph);
//         // console.log(tslCode);

//         // Hydrate -> Re-created Material (re-evaluates source for TSL.Fn).
//         hydrateMaterialAsync(
//           r.jsonGraph,
//           MeshPhysicalNodeMaterial,
//           defaultNodeRegistry,
//         ).then((restoredMaterial: any) => {
//           setMaterial(
//             <>
//               <mesh material={restoredMaterial}>
//                 <sphereGeometry args={[1, 64, 64]}></sphereGeometry>
//               </mesh>
//             </>,
//           );
//         });
//       })
//       .catch((r) => {
//         console.error(r);
//       });

//     return () => {
//       setMaterial(null);
//     };
//   }, [translateAsync, tslCode]);

//   return <group>{material}</group>;
// }

export function MaterialPreviewGarphMesh({
  jsonGraph,
}: {
  jsonGraph: MaterialGraphJSON;
}) {
  const { translateAsync } = useTranslationService();
  const [material, setMaterial] = useState<any>(null);

  let sphGeo = useMemo(() => {
    return new SphereGeometry(1, 64, 64);
  }, []);

  useEffect(() => {
    hydrateMaterialAsync(
      jsonGraph,
      MeshPhysicalNodeMaterial,
      defaultNodeRegistry,
    )
      .then((restoredMaterial: any) => {
        //
        setMaterial(
          <>
            <mesh geometry={sphGeo} material={restoredMaterial}></mesh>
          </>,
        );
      })
      .catch((e: any) => console.error(e));

    return () => {
      setMaterial(null);
    };
  }, [translateAsync, JSON.stringify(jsonGraph), sphGeo]);

  return <group>{material}</group>;
}
