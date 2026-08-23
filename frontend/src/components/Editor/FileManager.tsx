import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../lib/api";
import { IconFolder, IconSearch } from "../icons";

const ASSET_MIME = "application/x-enfx-asset";

interface UploadedFile {
  name: string;
}

export function FileManager({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [query, setQuery] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const list = await api.get<UploadedFile[]>(
      `/projects/${encodeURIComponent(projectId)}/uploads`,
    );
    setFiles(list);
  }, [projectId]);

  useEffect(() => {
    refresh().catch(() => {
      // Backend unreachable; leave the list empty and let a retry repopulate it.
    });
  }, [refresh]);

  const upload = async (fileList: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/uploads?filename=${encodeURIComponent(file.name)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: file,
          },
        );
      }
      await refresh();
    } finally {
      setUploading(false);
    }
  };

  const assetUrl = (name: string) =>
    `/api/projects/${encodeURIComponent(projectId)}/uploads/${encodeURIComponent(name)}`;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((file) => file.name.toLowerCase().includes(q));
  }, [files, query]);

  return (
    <div
      className={[
        "flex h-44 shrink-0 flex-col border-t border-ink-200 bg-white transition-colors",
        dragOver ? "bg-tiffany-50" : "",
      ].join(" ")}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
      }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-3 py-2">
        <span className="text-xs font-semibold text-ink-500">Files</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs font-medium text-tiffany-600 transition hover:text-tiffany-700"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".glb,.gltf,.hdr,.avif,.png,.jpg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="relative border-b border-ink-100 px-2 py-1.5">
        <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter files…"
          className="w-full rounded-md border border-ink-200 bg-white py-1 pl-8 pr-3 text-xs text-ink-800 placeholder:text-ink-400 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-ink-400">
            {files.length === 0 ? "Drop files here to upload" : "No matches"}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((file) => (
              <li
                key={file.name}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(ASSET_MIME, assetUrl(file.name));
                  e.dataTransfer.setData("text/plain", assetUrl(file.name));
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="flex cursor-grab items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-ink-50 active:cursor-grabbing"
              >
                <IconFolder className="h-4 w-4 shrink-0 text-tiffany-600" />
                <span className="min-w-0 flex-1 truncate text-ink-700">
                  {file.name}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
