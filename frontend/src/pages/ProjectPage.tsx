import { useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  IconAssets,
  IconChevronLeft,
  IconEffects,
  IconExport,
  IconMaterials,
  IconSdk,
  IconSettings,
  IconTrash,
} from "../components/icons";
import type { Project, ProjectStatus } from "../lib/types";
import { useProjectsStore } from "../store/projectsStore";

interface PageMeta {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const PAGE_META: Record<string, PageMeta> = {
  effects: {
    title: "Effects",
    description: "Node-based effects in this project.",
    icon: IconEffects,
  },
  materials: {
    title: "Materials",
    description: "TSL material graphs authored for WebGPU.",
    icon: IconMaterials,
  },
  assets: {
    title: "Assets",
    description: "Draco-compressed geometry and AVIF textures.",
    icon: IconAssets,
  },
  export: {
    title: "Export .enfx",
    description: "Package this project as a single portable .enfx file.",
    icon: IconExport,
  },
  sdk: {
    title: "Download SDK",
    description: "Get the EffectNode SDK to load .enfx files anywhere.",
    icon: IconSdk,
  },
  settings: {
    title: "Settings",
    description: "Manage this project.",
    icon: IconSettings,
  },
};

function ExportPanel({ project }: { project: Project }) {
  return (
    <div className="card rounded-xl p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <h2 className="text-base font-semibold text-ink-900">
            Package “{project.name}”
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Bundles geometry (<span className="font-mono text-xs">.draco</span>),
            textures (<span className="font-mono text-xs">.avif</span>), and the
            TSL material graph (
            <span className="font-mono text-xs">graph.json</span>) into one
            portable archive.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          <IconExport className="h-4 w-4" /> Export .enfx
        </button>
      </div>

      <pre className="mt-6 overflow-x-auto rounded-lg border border-ink-100 bg-ink-50 p-4 font-mono text-xs leading-relaxed text-ink-700">
{`${project.name.toLowerCase().replace(/\s+/g, "-")}.enfx.zip
├── metadata.json        # format version + provenance
├── data.json            # asset manifest + wiring
├── graph.json           # TSL material graph (nodes + edges)
├── geometry/*.draco     # Draco-compressed buffers
└── textures/*.avif      # AVIF textures`}
      </pre>
      <p className="mt-4 text-xs text-ink-500">
        The reference exporter lives in{" "}
        <span className="font-mono">frontend/src/sdk</span>.
      </p>
    </div>
  );
}

function SdkPanel({ project }: { project: Project }) {
  return (
    <div className="card rounded-xl p-7">
      <h2 className="text-base font-semibold text-ink-900">
        EffectNode SDK for “{project.name}”
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600">
        The SDK is the reference loader for{" "}
        <span className="font-medium">.enfx</span> files — the material
        serializer/hydrator, an archive reader, and Draco/AVIF decoders — so you
        can load exported effects in your own Three.js WebGPU app.
      </p>
      <button
        type="button"
        className="btn-primary mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
      >
        <IconSdk className="h-4 w-4" /> Download SDK
      </button>
      <p className="mt-4 text-xs text-ink-500">
        Works with Three.js WebGPU + TSL (see notes/tsl.md).
      </p>
    </div>
  );
}

const STATUSES: ProjectStatus[] = ["draft", "published", "archived"];

function SettingsPanel({ project }: { project: Project }) {
  const updateProject = useProjectsStore((state) => state.updateProject);
  const removeProject = useProjectsStore((state) => state.removeProject);
  const navigate = useNavigate();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [confirming, setConfirming] = useState(false);

  const save = async () => {
    try {
      await updateProject(project.slug, { name, description, status });
    } catch {
      // Save failed; keep the form as-is so the user can retry.
    }
  };

  const remove = async () => {
    try {
      await removeProject(project.slug);
      navigate("/projects");
    } catch {
      // Delete failed; stay on the page so the user can retry.
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="card rounded-xl p-6">
        <h2 className="text-base font-semibold text-ink-900">
          Project details
        </h2>

        <label className="mt-5 block text-sm font-medium text-ink-700">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-ink-700">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-ink-700">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={save}
          className="btn-primary mt-6 rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Save changes
        </button>
      </div>

      <div className="card rounded-xl border-red-200 p-6">
        <h2 className="text-base font-semibold text-red-600">Danger zone</h2>
        <p className="mt-1 text-sm text-ink-600">
          Deleting a project removes it permanently and cannot be undone.
        </p>

        {confirming ? (
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={remove}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-lg px-4 py-2 text-sm text-ink-600 transition hover:text-ink-900"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <IconTrash className="h-4 w-4" /> Delete project
          </button>
        )}
      </div>
    </div>
  );
}

function PlaceholderPanel({ meta }: { meta: PageMeta }) {
  const Icon = meta.icon;
  return (
    <div className="card flex flex-col items-center rounded-xl px-6 py-20 text-center">
      <Icon className="h-12 w-12 text-ink-300" />
      <h2 className="mt-4 text-base font-semibold text-ink-900">
        No {meta.title.toLowerCase()} yet
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-ink-600">
        {meta.description} This section is coming soon.
      </p>
    </div>
  );
}

export function ProjectPage() {
  const { projectID, page } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.slug === projectID),
  );

  if (!project) return null;

  const meta = page ? PAGE_META[page] : undefined;

  if (!meta) {
    return (
      <div className="card flex flex-col items-center rounded-xl px-6 py-20 text-center">
        <h2 className="text-base font-semibold text-ink-900">Page not found</h2>
        <p className="mt-1.5 text-sm text-ink-600">
          This section doesn't exist in the project.
        </p>
        <Link
          to={`/projects/${project.slug}`}
          className="btn-primary mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
        >
          <IconChevronLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  const HeaderIcon = meta.icon;

  let body: ReactNode;
  switch (page) {
    case "export":
      body = <ExportPanel project={project} />;
      break;
    case "sdk":
      body = <SdkPanel project={project} />;
      break;
    case "settings":
      body = <SettingsPanel key={project.id} project={project} />;
      break;
    default:
      body = <PlaceholderPanel meta={meta} />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tiffany-50 text-tiffany-600">
          <HeaderIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{meta.title}</h1>
          <p className="mt-0.5 text-sm text-ink-600">{meta.description}</p>
        </div>
      </header>

      <div className="mt-6">{body}</div>
    </div>
  );
}
