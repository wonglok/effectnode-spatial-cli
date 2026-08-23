import { Suspense, useEffect, useState } from "react";
import * as THREE from "three/webgpu";
import { useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { SceneNode } from "../../store/editorStore";
import { useEditorStore } from "../../store/editorStore";
import { WebGPUCanvas } from "./WebGPUCanvas";

const ASSET_MIME = "application/x-enfx-asset";

function ModelNode({
  src,
  position,
}: {
  src: string;
  position?: [number, number, number];
}) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} position={position} />;
}

function SceneElement({ node }: { node: SceneNode }) {
  const children = node.children?.map((child) => (
    <SceneElement key={child.id} node={child} />
  ));

  switch (node.type) {
    case "group":
      return <group>{children}</group>;
    case "mesh":
      return <mesh>{children}</mesh>;
    case "geometry":
      return <boxGeometry />;
    case "material": {
      const params = node.params ?? {};
      const color = typeof params.color === "string" ? params.color : "#ffffff";
      const roughness =
        typeof params.roughness === "number" ? params.roughness : 0.5;
      const metalness =
        typeof params.metalness === "number" ? params.metalness : 0;
      return (
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
        />
      );
    }
    case "model": {
      const src = node.params?.src;
      const position = node.params?.position;
      if (typeof src !== "string") return null;
      const pos =
        Array.isArray(position) && position.length === 3
          ? (position as [number, number, number])
          : undefined;
      return <ModelNode src={src} position={pos} />;
    }
    case "light":
      return <ambientLight />;
    default:
      return null;
  }
}

/**
 * Editor-only: while a GLB is dragged over the canvas, raycast the pointer to
 * a 3D point and show a placement ring; on drop, add the model at that point.
 */
function PlacementController() {
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

      const hits = raycaster.intersectObjects(scene.children, true);
      if (hits.length > 0) {
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
    <mesh
      position={hover}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => null}
    >
      <ringGeometry args={[0.35, 0.45, 48]} />
      <meshBasicMaterial color="#0abab5" transparent opacity={0.9} />
    </mesh>
  );
}

export function CanvasArea({
  scene,
  editable = false,
}: {
  scene: SceneNode[];
  editable?: boolean;
}) {
  return (
    <WebGPUCanvas>
      <Suspense fallback={null}>
        {scene.map((node) => (
          <SceneElement key={node.id} node={node} />
        ))}
      </Suspense>
      {editable && <PlacementController />}
    </WebGPUCanvas>
  );
}
