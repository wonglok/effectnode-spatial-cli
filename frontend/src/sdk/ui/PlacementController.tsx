import { useEffect, useState } from "react";
import * as THREE from "three/webgpu";
import { useThree } from "@react-three/fiber";
import { useEditorStore } from "../../store/editorStore";

const ASSET_MIME = "application/x-enfx-asset";

/**
 * Editor-only: while a GLB is dragged over the canvas, raycast the pointer to
 * a 3D point and show a placement ring; on drop, add the model at that point.
 */
export function PlacementController() {
  const { camera, gl, scene, raycaster } = useThree();
  const addNode = useEditorStore((state) => state.addNode);
  const [hover, setHover] = useState<[number, number, number] | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const ndc = new THREE.Vector2();
    const planePoint = new THREE.Vector3();

    const toPoint = (e: DragEvent): [number, number, number] | null => {
      const rect = el.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);

      let list: any = [];
      scene.traverse((it: any) => {
        if (it) {
          if (it.isLine) {
            return;
          }
          if (it.isScene) {
            return;
          }
          if (it.isLight) {
            return;
          }
          if (it.geometry) {
            list.push(it);
            return;
          }
          if (it.userData.isCollider) {
            list.push(it);
            return;
          }
        }
      });

      const hits = raycaster.intersectObjects(list, true);
      if (hits.length > 0) {
        hits.sort((a: any, b: any) => {
          if (a.distance > b.distance) {
            return -1;
          } else if (a.distance < b.distance) {
            return 1;
          } else {
            return 0;
          }
        });
        return [hits[0].point.x, hits[0].point.y, hits[0].point.z];
      }

      if (raycaster.ray.intersectPlane(ground, planePoint)) {
        return [planePoint.x, planePoint.y, planePoint.z];
      }
      return null;
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      setHover(toPoint(e));
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const src = e.dataTransfer?.getData(ASSET_MIME);
      const position = toPoint(e);
      if (src && position) {
        const name = src.split("/").pop() || "Model";
        addNode("model", { src, position }, name);
      }
      setHover(null);
    };

    const onDragLeave = () => setHover(null);

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    el.addEventListener("dragleave", onDragLeave);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
      el.removeEventListener("dragleave", onDragLeave);
    };
  }, [camera, gl, scene, raycaster, addNode]);

  if (!hover) return null;

  return (
    <>
      <mesh
        position={hover}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <ringGeometry args={[0.35, 0.45, 48]} />
        <meshBasicMaterial color="#0abab5" transparent opacity={0.9} />
      </mesh>

      {/*  */}
    </>
  );
}
