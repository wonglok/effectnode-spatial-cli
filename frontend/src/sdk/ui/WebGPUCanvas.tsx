import * as THREE from "three/webgpu";
// import * as TSL from "three/tsl";
//
import { Canvas, extend, ThreeToJSXElements } from "@react-three/fiber";
import { ReactNode, useState } from "react";

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any);

export const WebGPUCanvas = ({ children }: { children?: ReactNode }) => {
  let [ready, setOK] = useState(false);
  return (
    <Canvas
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer({
          ...(props as any),
          stencil: false,
          requiredLimits: {
            maxColorAttachmentBytesPerSample: 64,
          },
        });
        await renderer.init();

        let ttt = setInterval(() => {
          if (renderer.initialized) {
            clearInterval(ttt);
            setOK(true);
          }
        }, 0);

        return renderer;
      }}
    >
      {ready && children}
    </Canvas>
  );
};
