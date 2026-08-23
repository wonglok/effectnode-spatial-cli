import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import { useThree } from "@react-three/fiber";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { findSceneNode, useEditorStore } from "../../store/editorStore";
import type { SceneNode } from "../types/scene";
import { readVec3 } from "../types/vec3";

/** Selected node ids that have no selected ancestor (avoids double-moving children). */
function topLevelSelectedIds(scene: SceneNode[], ids: string[]): string[] {
  const selected = new Set(ids);
  const result: string[] = [];

  const walk = (nodes: SceneNode[], hasSelectedAncestor: boolean) => {
    for (const node of nodes) {
      const isSelected = selected.has(node.id);
      if (isSelected && !hasSelectedAncestor) result.push(node.id);
      if (node.children) {
        walk(node.children, hasSelectedAncestor || isSelected);
      }
    }
  };

  walk(scene, false);
  return result;
}

/**
 * A translate gizmo for the current multi-selection. A hidden pivot Object3D is
 * centered at the selection's centroid and driven by three's TransformControls.
 * Node positions are captured once when the drag begins; on each objectChange
 * the gizmo's total displacement is applied to the top-level selected nodes, so
 * every node moves exactly with the gizmo (no compounding). OrbitControls is
 * suspended while dragging.
 */
export function TransformGizmo() {
  const { camera, gl, scene } = useThree();
  const selectedIds = useEditorStore((state) => state.selectedIds);

  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  const orbitControls = useThree((state) => state.controls) as {
    enabled: boolean;
  } | null;
  const orbitControlsRef = useRef(orbitControls);
  orbitControlsRef.current = orbitControls;

  const pivotRef = useRef<THREE.Object3D | null>(null);
  const helperRef = useRef<THREE.Object3D | null>(null);
  const dragStartRef = useRef<{
    pivot: THREE.Vector3;
    positions: Map<string, [number, number, number]>;
  } | null>(null);

  // Create the pivot + controls once, attached to the R3F scene.
  useEffect(() => {
    const pivot = new THREE.Object3D();
    pivot.visible = false;
    scene.add(pivot);
    pivotRef.current = pivot;

    const controls = new TransformControls(camera, gl.domElement);
    controls.setMode("translate");
    controls.attach(pivot);

    const helper = controls.getHelper();
    helper.visible = false;
    scene.add(helper);
    helperRef.current = helper;

    const setOrbitEnabled = (enabled: boolean) => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = enabled;
      }
    };

    const onDraggingChanged = (event: unknown) => {
      const dragging = (event as { value?: boolean }).value === true;
      setOrbitEnabled(!dragging);

      if (dragging) {
        // Snapshot the top-level selected nodes' positions at drag start.
        const store = useEditorStore.getState();
        const positions = new Map<string, [number, number, number]>();
        for (const id of topLevelSelectedIds(
          store.scene,
          selectedIdsRef.current,
        )) {
          const node = findSceneNode(store.scene, id);
          if (node) positions.set(id, readVec3(node.params?.position, [0, 0, 0]));
        }
        dragStartRef.current = { pivot: pivot.position.clone(), positions };
      } else {
        dragStartRef.current = null;
      }
    };

    const onObjectChange = () => {
      const start = dragStartRef.current;
      if (!start) return;

      const totalDelta = pivot.position.clone().sub(start.pivot);
      const store = useEditorStore.getState();
      for (const [id, initial] of start.positions) {
        store.updateNodeParams(id, {
          position: [
            initial[0] + totalDelta.x,
            initial[1] + totalDelta.y,
            initial[2] + totalDelta.z,
          ],
        });
      }
    };

    const onWindowBlur = () => setOrbitEnabled(true);
    const onWindowPointerUp = () => setOrbitEnabled(true);

    controls.addEventListener("objectChange", onObjectChange);
    controls.addEventListener("dragging-changed", onDraggingChanged);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("pointerup", onWindowPointerUp);

    return () => {
      controls.removeEventListener("objectChange", onObjectChange);
      controls.removeEventListener("dragging-changed", onDraggingChanged);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("pointerup", onWindowPointerUp);
      controls.detach();
      controls.dispose();
      scene.remove(helper);
      scene.remove(pivot);
      pivotRef.current = null;
      helperRef.current = null;
    };
  }, [camera, gl, scene]);

  // Re-center the gizmo at the selection centroid whenever selection changes.
  useEffect(() => {
    const pivot = pivotRef.current;
    const helper = helperRef.current;
    if (!pivot || !helper || selectedIds.length === 0) {
      if (pivot) pivot.visible = false;
      if (helper) helper.visible = false;
      return;
    }

    const storeScene = useEditorStore.getState().scene;
    const ids = topLevelSelectedIds(storeScene, selectedIds);
    const centroid = new THREE.Vector3();
    let count = 0;
    for (const id of ids) {
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
      helper.visible = false;
      return;
    }

    centroid.divideScalar(count);
    pivot.position.copy(centroid);
    pivot.visible = true;
    helper.visible = true;
  }, [selectedIds]);

  return null;
}
