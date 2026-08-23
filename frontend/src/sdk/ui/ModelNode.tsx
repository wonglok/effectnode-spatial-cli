import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

/** Loads and renders a GLTF/GLB model at an optional world position. */
export function ModelNode({
  src,
  position,
}: {
  src: string;
  position?: [number, number, number];
}) {
  const { scene } = useGLTF(src);

  const { clonedScene } = useMemo(() => {
    return { clonedScene: clone(scene) };
  }, [scene]);

  return <primitive object={clonedScene} position={position} />;
}
