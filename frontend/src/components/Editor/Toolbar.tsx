import { useEditorStore } from "../../store/editorStore";
import type { SceneNodeType } from "../../sdk/types/scene";
import { IconPlus, IconRedo, IconTrash, IconUndo } from "../icons";

const ADD_BUTTONS: { type: SceneNodeType; label: string }[] = [
  { type: "camera", label: "Camera" },
  { type: "mesh", label: "Mesh" },
  { type: "light", label: "Light" },
  { type: "group", label: "Group" },
];

export function Toolbar() {
  const addNode = useEditorStore((state) => state.addNode);
  const removeNode = useEditorStore((state) => state.removeNode);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const canUndo = useEditorStore((state) => state.canUndo);
  const canRedo = useEditorStore((state) => state.canRedo);

  return (
    <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-ink-200 bg-white px-3">
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (⌘Z)"
        className="rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconUndo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (⇧⌘Z)"
        className="rounded-lg p-1.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconRedo className="h-4 w-4" />
      </button>

      <div className="mx-1.5 h-5 w-px bg-ink-200" />

      <span className="flex items-center gap-1 pr-1">
        <IconPlus className="h-4 w-4 text-ink-400" />
        <span className="text-xs text-ink-500">Add</span>
      </span>
      {ADD_BUTTONS.map((button) => (
        <button
          key={button.type}
          type="button"
          onClick={() => addNode(button.type)}
          className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
        >
          {button.label}
        </button>
      ))}

      <div className="mx-1.5 h-5 w-px bg-ink-200" />

      <button
        type="button"
        onClick={() => selectedIds.forEach((id) => removeNode(id))}
        disabled={selectedIds.length === 0}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconTrash className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}
