import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

/** Loads and renders a GLTF/GLB model at an optional world position. */
export function ModelNode({
  src,
  position,
}: {
  src: string;
  position?: [number, number, number];
}) {
  let [realURL, setURL] = useState("");

  useEffect(() => {
    //
    fetch(src)
      .then((r) => {
        if (!r.ok) {
          throw new Error("bad url");
        }
        return r.blob();
      })
      .then((blob) => {
        setURL(URL.createObjectURL(blob));
      })
      .catch((err) => {
        //
        console.log(err);
      });
    //
  }, [src]);
  return (
    <>
      {realURL && <AcutalNode src={realURL} position={position}></AcutalNode>}
    </>
  );
}

function AcutalNode({
  position,
  src,
}: {
  src: string;
  position?: [number, number, number];
}) {
  const { scene } = useGLTF(src);

  const { clonedScene } = useMemo(() => {
    return { clonedScene: clone(scene) };
  }, [scene]);

  return (
    <group>
      <primitive object={clonedScene} position={position} />;
    </group>
  );
}
