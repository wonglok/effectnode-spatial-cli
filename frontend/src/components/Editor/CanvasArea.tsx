import { WebGPUCanvas } from "../../sdk/ui/WebGPUCanvas";

export function CanvasArea() {
  return (
    <>
      <WebGPUCanvas>
        <mesh>
          <boxGeometry></boxGeometry>
        </mesh>
      </WebGPUCanvas>
    </>
  );
}
