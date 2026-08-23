import { IconFolder } from "../icons";

interface FileEntry {
  name: string;
  kind: string;
  size: string;
}

const FILES: FileEntry[] = [
  { name: "box.glb", kind: "model", size: "12 KB" },
  { name: "albedo.avif", kind: "texture", size: "48 KB" },
  { name: "normal.avif", kind: "texture", size: "52 KB" },
];

export function FileManager() {
  return (
    <div className="flex h-40 shrink-0 flex-col border-t border-ink-200 bg-white">
      <div className="border-b border-ink-100 px-4 py-2 text-xs font-semibold text-ink-500">
        Files
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {FILES.map((file) => (
            <li
              key={file.name}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-50"
            >
              <IconFolder className="h-4 w-4 shrink-0 text-tiffany-600" />
              <span className="min-w-0 flex-1 truncate text-ink-700">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-ink-400">{file.size}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
