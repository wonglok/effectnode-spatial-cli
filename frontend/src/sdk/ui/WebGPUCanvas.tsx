import * as THREE from "three/webgpu";
// import * as TSL from "three/tsl";
//
import { Canvas, extend, ThreeToJSXElements } from "@react-three/fiber";
import { ReactNode } from "react";

declare module "@react-three/fiber" {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as any);

export const WebGPUCanvas = ({ children }: { children?: ReactNode }) => (
  <Canvas
    gl={async (props) => {
      const renderer = new THREE.WebGPURenderer(props as any);
      await renderer.init();
      return renderer;
    }}
  >
    {children}
  </Canvas>
);
