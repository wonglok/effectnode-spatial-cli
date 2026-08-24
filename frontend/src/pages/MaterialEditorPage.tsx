import { useEffect, type ComponentType } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import {
  IconAssets,
  IconChat,
  IconChevronLeft,
  IconCode,
  IconEffects,
  IconMaterials,
} from "../components/icons";
import { useProjectsStore } from "../store/projectsStore";
import { useMaterialsStore } from "../store/materialsStore";

interface Tab {
  segment: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { segment: "glb-viewer", label: "GLB Viewer", icon: IconAssets },
  { segment: "buffers", label: "Buffers", icon: IconMaterials },
  { segment: "ai-chat", label: "AI Chat", icon: IconChat },
  { segment: "tsl-code-editor", label: "TSL Code", icon: IconCode },
  { segment: "graph-editor", label: "Graph Editor", icon: IconEffects },
];

export function MaterialEditorPage() {
  const { projectID, materialSlug } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.slug === projectID),
  );
  const material = useMaterialsStore((state) =>
    state.materials.find((m) => m.slug === materialSlug),
  );
  const status = useMaterialsStore((state) => state.status);
  const fetchMaterials = useMaterialsStore((state) => state.fetchMaterials);

  // Keep the list loaded so a deep link (/materials/<slug> without visiting the
  // list first) can still resolve the material's name.
  useEffect(() => {
    if (projectID) fetchMaterials(projectID).catch(() => {});
  }, [projectID, fetchMaterials]);

  if (!project) return null;

  const base = `/projects/${project.slug}`;
  const materialBase = `${base}/materials/${materialSlug}`;

  if (status !== "loading" && !material) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="card max-w-sm rounded-xl p-10 text-center">
          <IconMaterials className="mx-auto h-12 w-12 text-ink-300" />
          <h1 className="mt-4 text-lg font-semibold text-ink-900">
            Material not found
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            This material may have been deleted or renamed.
          </p>
          <Link
            to={`${base}/materials`}
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            <IconChevronLeft className="h-4 w-4" /> Back to materials
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-ink-200 bg-white px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tiffany-50 text-tiffany-600">
            <IconMaterials className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink-900">
              {material?.name ?? materialSlug}
            </div>
            <div className="truncate font-mono text-xs text-ink-400">
              {materialSlug}
            </div>
          </div>
        </div>

        <Link
          to={`${base}/materials`}
          className="btn-secondary inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
        >
          <IconChevronLeft className="h-3.5 w-3.5" /> All materials
        </Link>
      </div>

      {/* Tab bar */}
      <nav className="flex shrink-0 items-center gap-1 border-b border-ink-200 bg-white px-4">
        {TABS.map((tab) => (
          <NavLink
            key={tab.segment}
            to={`${materialBase}/${tab.segment}`}
            className={({ isActive }) =>
              [
                "inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "border-tiffany-500 text-tiffany-700"
                  : "border-transparent text-ink-500 hover:text-ink-800",
              ].join(" ")
            }
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Sub-page */}
      <div className="w-full h-full">
        <Outlet />
      </div>
    </div>
  );
}
