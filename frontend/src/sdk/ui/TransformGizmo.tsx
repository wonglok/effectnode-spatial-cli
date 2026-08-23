import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import { useThree } from "@react-three/fiber";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { findSceneNode, useEditorStore } from "../../store/editorStore";
import { readVec3 } from "../types/vec3";

/**
 * A translate gizmo for the current multi-selection. A hidden pivot Object3D is
 * centered at the selection's centroid and driven by three's TransformControls;
 * each `objectChange` delta is applied to every selected node's position.
 */
export function TransformGizmo() {
  const { camera, gl, scene } = useThree();
  const selectedIds = useEditorStore((state) => state.selectedIds);

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const pivotRef = useRef<THREE.Object3D | null>(null);
  const controlsRef = useRef<TransformControls | null>(null);
  const lastPos = useRef(new THREE.Vector3());

  // Create the pivot + controls once, attached to the R3F scene.
  useEffect(() => {
    const pivot = new THREE.Object3D();
    pivot.visible = false;
    scene.add(pivot);
    pivotRef.current = pivot;

    const controls = new TransformControls(camera, gl.domElement);
    controls.setMode("translate");
    controls.attach(pivot);
    controlsRef.current = controls;

    const onObjectChange = () => {
      const delta = pivot.position.clone().sub(lastPos.current);
      if (delta.lengthSq() < 1e-12) return;

      const store = useEditorStore.getState();
      for (const id of selectedIdsRef.current) {
        const node = findSceneNode(store.scene, id);
        if (!node) continue;
        const p = readVec3(node.params?.position, [0, 0, 0]);
        store.updateNodeParams(id, {
          position: [p[0] + delta.x, p[1] + delta.y, p[2] + delta.z],
        });
      }
      lastPos.current.copy(pivot.position);
    };

    controls.addEventListener("objectChange", onObjectChange);
    scene.add(controls);

    return () => {
      controls.removeEventListener("objectChange", onObjectChange);
      controls.detach();
      controls.dispose();
      scene.remove(controls);
      scene.remove(pivot);
      pivotRef.current = null;
      controlsRef.current = null;
    };
  }, [camera, gl, scene]);

  // Re-center the gizmo at the selection centroid whenever selection changes.
  useEffect(() => {
    const pivot = pivotRef.current;
    const controls = controlsRef.current;
    if (!pivot || selectedIds.length === 0) {
      if (pivot) pivot.visible = false;
      if (controls) controls.visible = false;
      return;
    }

    const storeScene = useEditorStore.getState().scene;
    const centroid = new THREE.Vector3();
    let count = 0;
    for (const id of selectedIds) {
      const node = findSceneNode(storeScene, id);
      if (!node) continue;
      const p = readVec3(node.params?.position, [0, 0, 0]);
      centroid.x += p[0];
      centroid.y += p[1];
      centroid.z += p[2];
      count += 1;
    }
    if (count === 0) {
      pivot.visible = false;
      if (controls) controls.visible = false;
      return;
    }

    centroid.divideScalar(count);
    pivot.position.copy(centroid);
    lastPos.current.copy(centroid);
    pivot.visible = true;
    if (controls) controls.visible = true;
  }, [selectedIds]);

  return null;
}
