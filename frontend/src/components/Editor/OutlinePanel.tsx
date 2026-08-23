import { useState } from "react";
import type { ComponentType } from "react";
import { useEditorStore } from "../../store/editorStore";
import type { SceneNode, SceneNodeType } from "../../sdk/types/scene";
import { IconAssets, IconEffects, IconFolder, IconMaterials } from "../icons";
import { ChatPanel } from "./ChatPanel";

const TYPE_ICONS: Record<
  SceneNodeType,
  ComponentType<{ className?: string }>
> = {
  group: IconFolder,
  mesh: IconAssets,
  geometry: IconAssets,
  material: IconMaterials,
  light: IconEffects,
  model: IconAssets,
  environment: IconEffects,
};

function TreeNode({ node, depth }: { node: SceneNode; depth: number }) {
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const select = useEditorStore((state) => state.select);
  const toggleSelect = useEditorStore((state) => state.toggleSelect);
  const Icon = TYPE_ICONS[node.type];
  const isActive = selectedIds.includes(node.id);

  return (
    <div>
      <button
        type="button"
        onClick={(e) =>
          e.shiftKey ? toggleSelect(node.id) : select(node.id)
        }
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

function OutlineTree() {
  const scene = useEditorStore((state) => state.scene);

  return (
    <div className="flex-1 overflow-y-auto py-1.5">
      {scene.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}

export function OutlinePanel() {
  const [tab, setTab] = useState<"outline" | "chat">("outline");

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ink-200 bg-white">
      <div className="flex border-b border-ink-100">
        <button
          type="button"
          onClick={() => setTab("outline")}
          className={[
            "flex-1 border-b-2 py-2 text-xs font-semibold transition",
            tab === "outline"
              ? "border-tiffany-500 text-tiffany-700"
              : "border-transparent text-ink-500 hover:bg-ink-50",
          ].join(" ")}
        >
          Outline
        </button>
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={[
            "flex-1 border-b-2 py-2 text-xs font-semibold transition",
            tab === "chat"
              ? "border-tiffany-500 text-tiffany-700"
              : "border-transparent text-ink-500 hover:bg-ink-50",
          ].join(" ")}
        >
          Chat
        </button>
      </div>

      {tab === "outline" ? <OutlineTree /> : <ChatPanel />}
    </aside>
  );
}
