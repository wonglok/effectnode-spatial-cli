import type { ComponentType } from "react";
import {
  useEditorStore,
  type SceneNode,
  type SceneNodeType,
} from "../../store/editorStore";
import { IconAssets, IconEffects, IconFolder, IconMaterials } from "../icons";

const TYPE_ICONS: Record<SceneNodeType, ComponentType<{ className?: string }>> = {
  group: IconFolder,
  mesh: IconAssets,
  geometry: IconAssets,
  material: IconMaterials,
  light: IconEffects,
};

function TreeNode({ node, depth }: { node: SceneNode; depth: number }) {
  const selectedId = useEditorStore((state) => state.selectedId);
  const select = useEditorStore((state) => state.select);
  const Icon = TYPE_ICONS[node.type];
  const isActive = selectedId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => select(node.id)}
        style={{ paddingLeft: `${depth * 14 + 10}px` }}
        className={[
          "flex w-full items-center gap-2 py-1.5 pr-3 text-left text-sm transition",
          isActive
            ? "bg-tiffany-50 text-tiffany-700"
            : "text-ink-700 hover:bg-ink-50",
        ].join(" ")}
      >
        <Icon
          className={
            isActive
              ? "h-4 w-4 shrink-0 text-tiffany-600"
              : "h-4 w-4 shrink-0 text-ink-400"
          }
        />
        <span className="truncate">{node.name}</span>
      </button>
      {node.children?.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function OutlinePanel() {
  const scene = useEditorStore((state) => state.scene);

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ink-200 bg-white">
      <div className="border-b border-ink-100 px-4 py-2.5 text-xs font-semibold text-ink-500">
        Outline
      </div>
      <div className="flex-1 overflow-y-auto py-1.5">
        {scene.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} />
        ))}
      </div>
    </aside>
  );
}
