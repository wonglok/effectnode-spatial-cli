import { useState } from "react";
import { findSceneNode, useEditorStore } from "../../store/editorStore";

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-ink-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="mt-1 w-full rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
      />
    </label>
  );
}

function TransformSection() {
  const [x, setX] = useState("0");
  const [y, setY] = useState("0");
  const [z, setZ] = useState("0");

  return (
    <section>
      <h3 className="text-xs font-semibold text-ink-500">Transform</h3>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <NumberField label="X" value={x} onChange={setX} />
        <NumberField label="Y" value={y} onChange={setY} />
        <NumberField label="Z" value={z} onChange={setZ} />
      </div>
    </section>
  );
}

export function PropsEditor() {
  const scene = useEditorStore((state) => state.scene);
  const selectedId = useEditorStore((state) => state.selectedId);
  const renameNode = useEditorStore((state) => state.renameNode);
  const node = findSceneNode(scene, selectedId);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-ink-200 bg-white">
      <div className="border-b border-ink-100 px-4 py-2.5 text-xs font-semibold text-ink-500">
        Properties
      </div>

      {node ? (
        <div key={node.id} className="flex-1 space-y-5 overflow-y-auto p-4">
          <label className="block">
            <span className="text-[11px] font-medium text-ink-500">Name</span>
            <input
              value={node.name}
              onChange={(e) => renameNode(node.id, e.target.value)}
              className="mt-1 w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
            />
          </label>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-ink-500">Type</span>
            <span className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-medium capitalize text-ink-600">
              {node.type}
            </span>
          </div>

          {(node.type === "mesh" || node.type === "geometry") && (
            <TransformSection />
          )}
        </div>
      ) : (
        <p className="p-4 text-sm text-ink-500">No object selected</p>
      )}
    </aside>
  );
}
