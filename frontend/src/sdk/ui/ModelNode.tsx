import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

/** Loads and renders a GLTF/GLB model (transform applied by the parent group). */
export function ModelNode({ src }: { src: string }) {
  const [realURL, setURL] = useState("");

  useEffect(() => {
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
        console.log(err);
      });
  }, [src]);

  return <>{realURL && <AcutalNode src={realURL} />}</>;
}

function AcutalNode({ src }: { src: string }) {
  const { scene } = useGLTF(src);

  const { clonedScene } = useMemo(() => {
    return { clonedScene: clone(scene) };
  }, [scene]);

  return <primitive object={clonedScene} />;
}
