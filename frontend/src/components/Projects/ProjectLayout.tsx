import type { ComponentType } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { useProjectsStore } from "../../store/projectsStore";
import { AuroraBackground } from "../AuroraBackground";
import {
  IconAssets,
  IconChevronLeft,
  IconDashboard,
  IconEffects,
  IconExport,
  IconFolder,
  IconMaterials,
  IconSdk,
  IconSettings,
} from "../icons";

interface NavItem {
  segment: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const NAV: NavItem[] = [
  { segment: "", label: "Dashboard", icon: IconDashboard, end: true },
  { segment: "vfx-design", label: "VFX Editor", icon: IconEffects },
  { segment: "materials", label: "Materials", icon: IconMaterials },
  { segment: "assets", label: "Assets", icon: IconAssets },
  { segment: "export", label: "Export .enfx", icon: IconExport },
  { segment: "sdk", label: "Download SDK", icon: IconSdk },
  { segment: "settings", label: "Settings", icon: IconSettings },
];

export function ProjectLayout() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.id === projectID),
  );

  if (!project) {
    return (
      <div className="relative min-h-screen">
        <AuroraBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          <div className="glass max-w-sm rounded-2xl p-10 text-center shadow-modal">
            <IconFolder className="mx-auto h-12 w-12 text-tiffany-500" />
            <h1 className="mt-4 text-xl font-semibold text-ink-900">
              Project not found
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              This project may have been deleted or moved.
            </p>
            <Link
              to="/projects"
              className="btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              <IconChevronLeft className="h-4 w-4" /> Back to projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const base = `/projects/${project.id}`;

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />

      <div className="relative z-10 flex">
        {/* Sidebar */}
        <aside className="sticky top-0 z-20 flex h-screen w-64 shrink-0 flex-col border-r border-tiffany-500/10 bg-ink-950/95 backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-tiffany-500/10 px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tiffany-500 text-base font-bold text-white">
              E
            </div>
            <div>
              <div className="font-display text-lg leading-none text-white">
                EffectNode
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-tiffany-300/70">
                FX Studio
              </div>
            </div>
          </div>

          <div className="border-b border-tiffany-500/10 px-5 py-4">
            <Link
              to="/projects"
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-ink-300 transition hover:text-white"
            >
              <IconChevronLeft className="h-3.5 w-3.5" /> All projects
            </Link>
            <div className="truncate text-sm font-medium text-white">
              {project.name}
            </div>
            <div className="mt-0.5 text-xs capitalize text-ink-400">
              {project.status}
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV.map((item) => {
              const to = item.segment ? `${base}/${item.segment}` : base;
              return (
                <NavLink
                  key={item.segment || "dashboard"}
                  to={to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      isActive
                        ? "bg-tiffany-500/15 text-tiffany-300"
                        : "text-ink-300 hover:bg-white/5 hover:text-white",
                    ].join(" ")
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-tiffany-500/10 px-5 py-4 text-[11px] text-ink-400">
            <div>EffectNode FX Studio</div>
            <div className="mt-0.5">v0.11.0</div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-100 bg-white/60 px-6 py-3 backdrop-blur-xl lg:px-10">
            <nav className="flex items-center gap-2 text-sm text-ink-500">
              <Link
                to="/projects"
                className="transition hover:text-ink-800"
              >
                Projects
              </Link>
              <span className="text-ink-300">/</span>
              <span className="truncate font-medium text-ink-800">
                {project.name}
              </span>
            </nav>

            <Link
              to={`${base}/export`}
              className="btn-primary inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              <IconExport className="h-4 w-4" /> Export .enfx
            </Link>
          </header>

          <main className="flex-1 px-6 py-8 lg:px-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
