import type { SceneNode } from "../../types/scene";
import { EnvironmentNode } from "./EnvironmentNode";
import { ModelNode } from "./ModelNode";

/** Recursively renders a scene-graph node (group/mesh/geometry/material/light/model). */
export function SceneElement({ node }: { node: SceneNode }) {
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
      return (
        <EnvironmentNode
          src={src}
          environmentIntensity={environmentIntensity}
          backgroundIntensity={backgroundIntensity}
        />
      );
    }
    case "light":
      return <ambientLight />;
    default:
      return null;
  }
}
