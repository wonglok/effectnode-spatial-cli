import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import { useThree } from "@react-three/fiber";
import { useEditorStore } from "../../store/editorStore";

/** Walk up from a hit object to find its scene-node id, skipping colliders. */
function findNodeId(object: THREE.Object3D): string | null {
  let obj: THREE.Object3D | null = object;
  while (obj) {
    const userData = obj.userData as { nodeId?: unknown; isCollider?: unknown };
    if (userData.isCollider === true) return null;
    if (typeof userData.nodeId === "string") return userData.nodeId;
    obj = obj.parent;
  }
  return null;
}

/**
 * Canvas click-to-select. On a click (no drag) raycast the pointer and select
 * the scene node under it (shift = toggle), skipping collider meshes. Works for
 * GLB primitives too by walking up the parent chain via `userData.nodeId`.
 */
export function ClickSelector() {
  const { camera, gl, scene, raycaster } = useThree();
  const select = useEditorStore((state) => state.select);
  const toggleSelect = useEditorStore((state) => state.toggleSelect);
  const downPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = gl.domElement;
    const ndc = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      downPos.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const start = downPos.current;
      downPos.current = null;
      if (!start) return;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;

      const rect = el.getBoundingClientRect();
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(scene.children, true);

      for (const hit of hits) {
        const nodeId = findNodeId(hit.object);
        if (nodeId) {
          if (e.shiftKey) toggleSelect(nodeId);
          else select(nodeId);
          return;
        }
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
    };
  }, [camera, gl, scene, raycaster, select, toggleSelect]);

  return null;
}
