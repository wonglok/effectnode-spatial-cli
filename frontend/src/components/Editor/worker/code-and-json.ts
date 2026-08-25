import * as THREE from "three/webgpu";
import * as TSL from "three/tsl";
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { color, float, mul } from "three/tsl";
import {
  parseNodeMaterialToJSON,
  hydrateJSONToNodeMaterial,
} from "./materialParser";
import { defaultNodeRegistry } from "./nodeRegistry";

self.onmessage = (ev) => {
  let rawdata = ev.data;
  let data = JSON.parse(rawdata);

  let code = data.code;
  let id = data.id;

  try {
    let codeEval = new Function(code);

    let resultFunc = codeEval();

    resultFunc({ THREE, TSL })
      .then((material: any) => {
        // console.log(material);

        // Parse -> JSON
        const jsonGraph = parseNodeMaterialToJSON(material);

        self.postMessage(
          JSON.stringify({
            id: id,
            ok: true,
            result: {
              jsonGraph: jsonGraph,
            },
          }),
        );
      })
      .catch((e: any) => {
        console.log(e);
        self.postMessage(
          JSON.stringify({
            id: id,
            ok: false,
            result: e,
          }),
        );
      });
  } catch (e) {
    //
    console.log(e);

    self.postMessage(
      JSON.stringify({
        id: id,
        ok: false,
        result: e,
      }),
    );
  }
};

//

//

//
