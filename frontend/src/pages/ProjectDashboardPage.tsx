import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ComponentType } from "react";
import {
  IconAssets,
  IconEffects,
  IconExport,
  IconMaterials,
  IconPlus,
  IconSdk,
} from "../components/icons";
import { formatDate, timeAgo } from "../lib/format";
import { useProjectsStore } from "../store/projectsStore";

interface StatCardProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint: string;
}

function StatCard({ icon: Icon, label, value, hint }: StatCardProps) {
  return (
    <div className="glass rounded-2xl p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-500">{label}</span>
        <Icon className="h-5 w-5 text-tiffany-500" />
      </div>
      <div className="mt-2 text-3xl font-semibold text-ink-900">{value}</div>
      <div className="mt-1 text-xs text-ink-400">{hint}</div>
    </div>
  );
}

interface QuickActionProps {
  to: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function QuickAction({ to, icon: Icon, title, description }: QuickActionProps) {
  return (
    <Link
      to={to}
      className="glass group rounded-2xl p-5 shadow-card transition hover:shadow-card-hover"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tiffany-100 text-tiffany-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-ink-900 transition group-hover:text-tiffany-700">
            {title}
          </div>
          <div className="truncate text-xs text-ink-500">{description}</div>
        </div>
      </div>
    </Link>
  );
}

export function ProjectDashboardPage() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.id === projectID),
  );
  const updateProject = useProjectsStore((state) => state.updateProject);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  if (!project) return null;

  const base = `/projects/${project.id}`;

  const startEdit = () => {
    setDraftName(project.name);
    setDraftDescription(project.description);
    setEditing(true);
  };

  const saveEdit = () => {
    updateProject(project.id, {
      name: draftName,
      description: draftDescription,
    });
    setEditing(false);
  };

  const activity = [
    { label: "Project created", when: formatDate(project.createdAt) },
    { label: "Last updated", when: timeAgo(project.updatedAt) },
    { label: "Ready to export", when: "Export .enfx" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {editing ? (
            <div className="space-y-3">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-xl border border-ink-100 bg-white/70 px-4 py-2 text-2xl font-semibold text-ink-900 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
              />
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-ink-100 bg-white/70 px-4 py-2 text-sm text-ink-700 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="btn-primary rounded-full px-4 py-2 text-sm font-semibold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-full px-4 py-2 text-sm text-ink-500 transition hover:text-ink-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="truncate text-3xl font-semibold text-ink-900">
                {project.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
                {project.description || "No description yet."}
              </p>
            </>
          )}
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 rounded-full border border-ink-100 bg-white/60 px-4 py-2 text-sm font-medium text-ink-600 transition hover:border-tiffany-300 hover:text-tiffany-700"
          >
            Edit details
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={IconEffects}
          label="Effects"
          value={project.stats.effects}
          hint="Node-based effects"
        />
        <StatCard
          icon={IconMaterials}
          label="Materials"
          value={project.stats.materials}
          hint="TSL material graphs"
        />
        <StatCard
          icon={IconAssets}
          label="Assets"
          value={project.stats.assets}
          hint="Draco + AVIF assets"
        />
      </div>

      {/* Quick actions */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          Quick actions
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QuickAction
            to={`${base}/vfx-design`}
            icon={IconPlus}
            title="New effect"
            description="Start a fresh node graph"
          />
          <QuickAction
            to={`${base}/export`}
            icon={IconExport}
            title="Export .enfx"
            description="Package this project"
          />
          <QuickAction
            to={`${base}/sdk`}
            icon={IconSdk}
            title="Download SDK"
            description="Load .enfx anywhere"
          />
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
          Activity
        </h2>
        <div className="glass mt-4 divide-y divide-ink-100 rounded-2xl shadow-card">
          {activity.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-5 py-4"
            >
              <span className="flex items-center gap-3 text-sm text-ink-700">
                <span className="h-2 w-2 rounded-full bg-tiffany-400" />
                {item.label}
              </span>
              <span className="text-sm text-ink-400">{item.when}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
