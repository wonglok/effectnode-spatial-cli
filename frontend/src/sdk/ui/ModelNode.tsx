import { useGLTF } from "@react-three/drei";

/** Loads and renders a GLTF/GLB model at an optional world position. */
export function ModelNode({
  src,
  position,
}: {
  src: string;
  position?: [number, number, number];
}) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} position={position} />;
}
