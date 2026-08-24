import { Suspense } from "react";
import type { SceneNode } from "../types/scene";
import { readVec3 } from "../types/vec3";
import { EnvironmentNode } from "./EnvironmentNode";
import { ModelNode } from "./ModelNode";

/** Build position/rotation/scale/userData props from a node's params. */
function transformProps(node: SceneNode) {
  const p = node.params ?? {};
  const position = readVec3(p.position, [0, 0, 0]);

  // Rotation is authored in degrees and converted to radians for three.js.
  const rotationDeg = readVec3(p.rotation, [0, 0, 0]);
  const rotation: [number, number, number] = [
    (rotationDeg[0] * Math.PI) / 180,
    (rotationDeg[1] * Math.PI) / 180,
    (rotationDeg[2] * Math.PI) / 180,
  ];

  const scale = readVec3(p.scale, [1, 1, 1]);

  const userData: Record<string, unknown> = {};
  if (Array.isArray(p.userData)) {
    for (const entry of p.userData) {
      if (
        entry &&
        typeof entry === "object" &&
        typeof (entry as { key?: unknown }).key === "string"
      ) {
        userData[(entry as { key: string }).key] = (
          entry as { value?: unknown }
        ).value;
      }
    }
  }
  if (p.isCollider === true) {
    userData.isCollider = true;
  }
  userData.nodeId = node.id;

  return { position, rotation, scale, userData };
}

/** Recursively renders a scene-graph node. */
export function SceneElement({ node }: { node: SceneNode }) {
  const children = node.children?.map((child) => {
    return (
      <Suspense fallback={null} key={child.id}>
        <SceneElement key={child.id + "el"} node={child} />
      </Suspense>
    );
  });

  switch (node.type) {
    case "group":
      return <group {...transformProps(node)}>{children}</group>;
    case "mesh":
      return <mesh {...transformProps(node)}>{children}</mesh>;
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
      if (typeof src !== "string") return null;
      return (
        <group {...transformProps(node)}>
          <ModelNode src={src} />
        </group>
      );
    }
    case "environment": {
      const src = node.params?.src;
      if (typeof src !== "string") return null;
      const environmentIntensity =
        typeof node.params?.environmentIntensity === "number"
          ? node.params.environmentIntensity
          : 1;
      const backgroundIntensity =
        typeof node.params?.backgroundIntensity === "number"
          ? node.params.backgroundIntensity
          : 1;
      const useEnvironment = node.params?.useEnvironment !== false;
      const useBackground = node.params?.useBackground !== false;

      return (
        <EnvironmentNode
          src={src}
          environmentIntensity={environmentIntensity}
          backgroundIntensity={backgroundIntensity}
          useEnvironment={useEnvironment}
          useBackground={useBackground}
        />
      );
    }
    case "light":
      return <ambientLight {...transformProps(node)} />;
    case "camera": {
      const params = node.params ?? {};
      const fov = typeof params.fov === "number" ? params.fov : 50;
      const near = typeof params.near === "number" ? params.near : 0.1;
      const far = typeof params.far === "number" ? params.far : 1000;
      return (
        <perspectiveCamera
          {...transformProps(node)}
          fov={fov}
          near={near}
          far={far}
        >
          {children}
        </perspectiveCamera>
      );
    }
    default:
      return null;
  }
}
