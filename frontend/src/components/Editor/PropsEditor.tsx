import { useState } from "react";
import { findSceneNode, useEditorStore } from "../../store/editorStore";
import type { SceneNode } from "../../sdk/types/scene";
import { readVec3, type Vec3 } from "../../sdk/types/vec3";
import { IconPlus, IconTrash } from "../icons";

function Vec3Editor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Vec3;
  onChange: (value: Vec3) => void;
}) {
  const set = (index: number, raw: string) => {
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    const next: Vec3 = [...value];
    next[index] = n;
    onChange(next);
  };

  return (
    <div>
      <div className="text-[11px] font-medium text-ink-500">{label}</div>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {(["X", "Y", "Z"] as const).map((axis, index) => (
          <label key={axis} className="block">
            <span className="text-[10px] text-ink-400">{axis}</span>
            <input
              type="number"
              step={0.01}
              value={value[index]}
              onChange={(e) => set(index, e.target.value)}
              className="mt-0.5 w-full rounded-md border border-ink-200 bg-white px-1.5 py-1 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function TransformSection({ node }: { node: SceneNode }) {
  const updateNodeParams = useEditorStore((state) => state.updateNodeParams);
  const p = node.params ?? {};
  const position = readVec3(p.position, [0, 0, 0]);
  const rotation = readVec3(p.rotation, [0, 0, 0]);
  const scale = readVec3(p.scale, [1, 1, 1]);

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold text-ink-500">Transform</h3>
      <Vec3Editor
        label="Position"
        value={position}
        onChange={(v) => updateNodeParams(node.id, { position: v })}
      />
      <Vec3Editor
        label="Rotation (°)"
        value={rotation}
        onChange={(v) => updateNodeParams(node.id, { rotation: v })}
      />
      <Vec3Editor
        label="Scale"
        value={scale}
        onChange={(v) => updateNodeParams(node.id, { scale: v })}
      />
    </section>
  );
}

function MaterialParamsSection({ node }: { node: SceneNode }) {
  const updateNodeParams = useEditorStore((state) => state.updateNodeParams);
  const params = node.params ?? {};
  const color = typeof params.color === "string" ? params.color : "#ffffff";
  const roughness =
    typeof params.roughness === "number" ? params.roughness : 0.5;
  const metalness = typeof params.metalness === "number" ? params.metalness : 0;

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold text-ink-500">Material</h3>

      <label className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-ink-500">Color</span>
        <input
          type="color"
          value={color}
          onChange={(e) => updateNodeParams(node.id, { color: e.target.value })}
          className="h-8 w-11 cursor-pointer rounded-md border border-ink-200 bg-white p-0.5"
        />
      </label>

      <label className="block">
        <span className="flex items-center justify-between text-[11px] font-medium text-ink-500">
          <span>Roughness</span>
          <span className="text-ink-400">{roughness.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={roughness}
          onChange={(e) =>
            updateNodeParams(node.id, { roughness: Number(e.target.value) })
          }
          className="mt-1.5 w-full accent-tiffany-600"
        />
      </label>

      <label className="block">
        <span className="flex items-center justify-between text-[11px] font-medium text-ink-500">
          <span>Metalness</span>
          <span className="text-ink-400">{metalness.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={metalness}
          onChange={(e) =>
            updateNodeParams(node.id, { metalness: Number(e.target.value) })
          }
          className="mt-1.5 w-full accent-tiffany-600"
        />
      </label>
    </section>
  );
}

function EnvironmentParamsSection({ node }: { node: SceneNode }) {
  const updateNodeParams = useEditorStore((state) => state.updateNodeParams);
  const params = node.params ?? {};
  const environmentIntensity =
    typeof params.environmentIntensity === "number"
      ? params.environmentIntensity
      : 1;
  const backgroundIntensity =
    typeof params.backgroundIntensity === "number"
      ? params.backgroundIntensity
      : 1;
  const useEnvironment = params.useEnvironment !== false;
  const useBackground = params.useBackground !== false;

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold text-ink-500">Environment</h3>

      <label className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-ink-500">
          Use as Environment
        </span>
        <input
          type="checkbox"
          checked={useEnvironment}
          onChange={(e) =>
            updateNodeParams(node.id, { useEnvironment: e.target.checked })
          }
          className="h-4 w-4 accent-tiffany-600"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-ink-500">
          Use as Background
        </span>
        <input
          type="checkbox"
          checked={useBackground}
          onChange={(e) =>
            updateNodeParams(node.id, { useBackground: e.target.checked })
          }
          className="h-4 w-4 accent-tiffany-600"
        />
      </label>

      <label className="block">
        <span className="flex items-center justify-between text-[11px] font-medium text-ink-500">
          <span>Environment Intensity</span>
          <span className="text-ink-400">
            {environmentIntensity.toFixed(2)}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={4}
          step={0.01}
          value={environmentIntensity}
          onChange={(e) =>
            updateNodeParams(node.id, {
              environmentIntensity: Number(e.target.value),
            })
          }
          className="mt-1.5 w-full accent-tiffany-600"
        />
      </label>

      <label className="block">
        <span className="flex items-center justify-between text-[11px] font-medium text-ink-500">
          <span>Background Intensity</span>
          <span className="text-ink-400">{backgroundIntensity.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={4}
          step={0.01}
          value={backgroundIntensity}
          onChange={(e) =>
            updateNodeParams(node.id, {
              backgroundIntensity: Number(e.target.value),
            })
          }
          className="mt-1.5 w-full accent-tiffany-600"
        />
      </label>
    </section>
  );
}

interface UserDataEntry {
  key: string;
  value: string;
}

function UserDataSection({ node }: { node: SceneNode }) {
  const updateNodeParams = useEditorStore((state) => state.updateNodeParams);
  const entries: UserDataEntry[] = Array.isArray(node.params?.userData)
    ? (node.params.userData as UserDataEntry[]).filter(
        (e) => e && typeof e.key === "string" && typeof e.value === "string",
      )
    : [];
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const setEntries = (next: UserDataEntry[]) =>
    updateNodeParams(node.id, { userData: next });

  const updateEntry = (index: number, patch: Partial<UserDataEntry>) =>
    setEntries(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const removeEntry = (index: number) =>
    setEntries(entries.filter((_, i) => i !== index));

  const addEntry = () => {
    const key = newKey.trim();
    if (!key) return;
    setEntries([...entries, { key, value: newValue }]);
    setNewKey("");
    setNewValue("");
  };

  const inputClass =
    "w-full rounded-md border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40";

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold text-ink-500">User Data</h3>

      {entries.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <input
            value={entry.key}
            onChange={(e) => updateEntry(index, { key: e.target.value })}
            placeholder="key"
            className={inputClass}
          />
          <input
            value={entry.value}
            onChange={(e) => updateEntry(index, { value: e.target.value })}
            placeholder="value"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => removeEntry(index)}
            aria-label="Remove entry"
            className="shrink-0 rounded p-1 text-ink-300 transition hover:bg-red-50 hover:text-red-600"
          >
            <IconTrash className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-1.5">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="key"
          className={inputClass}
        />
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="value"
          className={inputClass}
        />
        <button
          type="button"
          onClick={addEntry}
          aria-label="Add entry"
          className="shrink-0 rounded p-1 text-ink-300 transition hover:bg-ink-100 hover:text-tiffany-600"
        >
          <IconPlus className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

function ColliderSection({ node }: { node: SceneNode }) {
  const updateNodeParams = useEditorStore((state) => state.updateNodeParams);
  const isCollider = node.params?.isCollider === true;

  return (
    <label className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-ink-500">Collider</span>
      <input
        type="checkbox"
        checked={isCollider}
        onChange={(e) =>
          updateNodeParams(node.id, { isCollider: e.target.checked })
        }
        className="h-4 w-4 accent-tiffany-600"
      />
    </label>
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

          {(node.type === "group" ||
            node.type === "mesh" ||
            node.type === "model" ||
            node.type === "light") && (
            <>
              <TransformSection node={node} />
              <ColliderSection node={node} />
              <UserDataSection node={node} />
            </>
          )}

          {node.type === "material" && <MaterialParamsSection node={node} />}

          {node.type === "environment" && (
            <EnvironmentParamsSection node={node} />
          )}
        </div>
      ) : (
        <p className="p-4 text-sm text-ink-500">No object selected</p>
      )}
    </aside>
  );
}
