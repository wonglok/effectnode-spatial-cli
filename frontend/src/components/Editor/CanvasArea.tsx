import type { SceneNode } from "../../store/editorStore";
import { WebGPUCanvas } from "../../sdk/ui/WebGPUCanvas";

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
    case "material":
      return <meshStandardMaterial />;
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
