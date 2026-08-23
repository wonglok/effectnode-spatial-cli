import { Suspense } from "react";
import { OrbitControls } from "@react-three/drei";
import type { SceneNode } from "../types/scene";
import { PlacementController } from "./PlacementController";
import { SceneElement } from "./SceneElement";
import { WebGPUCanvas } from "./WebGPUCanvas";

export function CanvasArea({
  scene,
  editable = false,
}: {
  scene: SceneNode[];
  editable?: boolean;
}) {
  return (
    <WebGPUCanvas>
      {scene.map((node) => {
        return (
          <Suspense fallback={null}>
            <SceneElement key={node.id} node={node} />
          </Suspense>
        );
      })}

      {editable && <OrbitControls makeDefault enableDamping />}
      {editable && <gridHelper args={[100, 100, 0x777777, 0xbababa]} />}
      {editable && <PlacementController />}
    </WebGPUCanvas>
  );
}

//
//
//
