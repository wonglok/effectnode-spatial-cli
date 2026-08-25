import * as THREE from "three/webgpu";
import * as TSL from "three/tsl";
// import { MeshPhysicalNodeMaterial } from "three/webgpu";
// import { color, float, mul } from "three/tsl";
import {
  parseNodeMaterialToJSON,
  // hydrateJSONToNodeMaterial,
} from "./materialParser";
// import { defaultNodeRegistry } from "./nodeRegistry";

self.onmessage = (ev) => {
  let rawdata = ev.data;
  let data = JSON.parse(rawdata);

  let code = data.code;
  let id = data.id;

  try {
    let importCode = ``;
    let lowerArr = "abcdefghijklmnopqrstuvwxyz".split("");
    for (let kn in TSL) {
      if (lowerArr.includes(kn.charAt(0))) {
        //
        let line = `const ${kn} = TSL["${kn}"]\n`;
        importCode += line;
        //
      }
    }

    // code = code.replace(
    //   "export default async function",
    //   "return async function",
    // );

    let all = code.split("\n");
    let noImportLines = all.filter((r: string) => {
      return !r.trim().startsWith("import");
    });

    code = noImportLines.join("\n");

    console.log(importCode);
    code = `${importCode}\n${code}`;

    let codeEval = new Function("TSL", "THREE", code);

    let resultFunc = codeEval(TSL, THREE);

    resultFunc({})
      .then((instace: any) => {
        // console.log(material);

        // Parse -> JSON

        const jsonGraph = parseNodeMaterialToJSON(instace);

        // console.log(jsonGraph);

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
