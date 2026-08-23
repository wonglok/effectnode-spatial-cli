import type { ComponentType } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";
import { useProjectsStore } from "../../store/projectsStore";
import { useUiStore } from "../../store/uiStore";
import {
  IconChevronLeft,
  IconDashboard,
  IconEffects,
  IconExport,
  IconFolder,
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
  // { segment: "materials", label: "Materials", icon: IconMaterials },
  // { segment: "assets", label: "Assets", icon: IconAssets },
  { segment: "export", label: "Export .enfx", icon: IconExport },
  { segment: "sdk", label: "Download SDK", icon: IconSdk },
  { segment: "settings", label: "Settings", icon: IconSettings },
];

export function ProjectLayout() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.id === projectID),
  );
  const status = useProjectsStore((state) => state.status);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-sm rounded-xl p-10 text-center shadow-modal">
          <p className="text-sm text-ink-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-sm rounded-xl p-10 text-center shadow-modal">
          <IconFolder className="mx-auto h-12 w-12 text-ink-300" />
          <h1 className="mt-4 text-lg font-semibold text-ink-900">
            Project not found
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            This project may have been deleted or moved.
          </p>
          <Link
            to="/projects"
            className="btn-primary mt-6 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
          >
            <IconChevronLeft className="h-4 w-4" /> Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const base = `/projects/${project.id}`;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={[
          "sticky top-0 z-20 flex h-screen shrink-0 flex-col border-r border-ink-200 bg-white transition-[width] duration-200",
          sidebarCollapsed ? "w-16" : "w-64",
        ].join(" ")}
      >
        <div
          className={[
            "flex items-center gap-3 border-b border-ink-100",
            sidebarCollapsed ? "justify-center px-2 py-4" : "px-4 py-4",
          ].join(" ")}
        >
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-tiffany-600 text-base font-bold text-white"
            >
              E
            </button>
          ) : (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tiffany-600 text-base font-bold text-white">
                E
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold leading-tight text-ink-900">
                  EffectNode
                </div>
                <div className="text-xs text-ink-500">FX Studio</div>
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
              >
                <IconChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="border-b border-ink-100 px-4 py-3.5">
            <Link
              to="/projects"
              className="mb-2 inline-flex items-center gap-1.5 text-xs text-ink-500 transition hover:text-ink-800"
            >
              <IconChevronLeft className="h-3.5 w-3.5" /> All projects
            </Link>
            <div className="truncate text-sm font-medium text-ink-900">
              {project.name}
            </div>
            <div className="text-xs capitalize text-ink-500">
              {project.status}
            </div>
          </div>
        )}

        <nav
          className={[
            "flex-1 space-y-0.5 overflow-y-auto py-3",
            sidebarCollapsed ? "px-2" : "px-2.5",
          ].join(" ")}
        >
          {NAV.map((item) => {
            const to = item.segment ? `${base}/${item.segment}` : base;
            return (
              <NavLink
                key={item.segment || "dashboard"}
                to={to}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-lg text-sm transition",
                    sidebarCollapsed
                      ? "justify-center px-2 py-2.5"
                      : "px-2.5 py-2",
                    isActive
                      ? "bg-tiffany-50 font-medium text-tiffany-700"
                      : "font-normal text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                  ].join(" ")
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && item.label}
              </NavLink>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="border-t border-ink-100 px-4 py-3 text-[11px] text-ink-500">
            <div>EffectNode FX Studio</div>
            <div className="mt-0.5">v0.11.0</div>
          </div>
        )}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-200 bg-white px-6 py-3 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-ink-500">
            <Link to="/projects" className="transition hover:text-ink-800">
              Projects
            </Link>
            <span className="text-ink-300">/</span>
            <span className="truncate font-medium text-ink-800">
              {project.name}
            </span>
          </nav>

          <Link
            to={`${base}/export`}
            className="btn-primary inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <IconExport className="h-4 w-4" /> Export .enfx
          </Link>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
