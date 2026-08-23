import type { SceneNode } from "../../store/editorStore";
import { WebGPUCanvas } from "./WebGPUCanvas";

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
    case "light":
      return <ambientLight />;
    default:
      return null;
  }
}

export function CanvasArea({ scene }: { scene: SceneNode[] }) {
  return (
    <WebGPUCanvas>
      {scene.map((node) => (
        <SceneElement key={node.id} node={node} />
      ))}
    </WebGPUCanvas>
  );
}
