import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { IconFolder } from "../icons";

const ASSET_MIME = "application/x-enfx-asset";

interface UploadedFile {
  name: string;
}

export function FileManager({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
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

  return (
    <div
      className={[
        "flex h-40 shrink-0 flex-col border-t border-ink-200 bg-white transition-colors",
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
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2">
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
          accept=".glb,.gltf,.avif,.png,.jpg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-ink-400">
            Drop files here to upload
          </p>
        ) : (
          <ul className="space-y-0.5">
            {files.map((file) => (
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
