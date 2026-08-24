import { useState } from "react";
import type { ComponentType } from "react";
import { Link, useParams } from "react-router-dom";
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
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="card rounded-xl p-5">
      <div className="flex items-center gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tiffany-50 text-tiffany-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold leading-none text-ink-900">
            {value}
          </div>
          <div className="mt-1.5 text-sm text-ink-600">{label}</div>
        </div>
      </div>
    </div>
  );
}

export function ProjectDashboardPage() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.slug === projectID),
  );
  const updateProject = useProjectsStore((state) => state.updateProject);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  if (!project) return null;

  const base = `/projects/${project.slug}`;

  const startEdit = () => {
    setDraftName(project.name);
    setDraftDescription(project.description);
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await updateProject(project.slug, {
        name: draftName,
        description: draftDescription,
      });
    } catch {
      // Save failed; keep editing so the user can retry.
      return;
    }
    setEditing(false);
  };

  const activity = [
    { label: "Project created", when: formatDate(project.createdAt) },
    { label: "Last updated", when: timeAgo(project.updatedAt) },
    { label: "Ready to export", when: "Export .enfx" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {editing ? (
            <div className="space-y-3">
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-xl font-semibold text-ink-900 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
              />
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-700 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg px-4 py-2 text-sm text-ink-600 transition hover:text-ink-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="truncate text-2xl font-semibold text-ink-900">
                {project.name}
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
                {project.description || "No description yet."}
              </p>
            </>
          )}
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="btn-secondary shrink-0 rounded-lg px-4 py-2 text-sm font-medium"
          >
            Edit details
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={IconEffects}
          label="Effects"
          value={project.stats.effects}
        />
        <StatCard
          icon={IconMaterials}
          label="Materials"
          value={project.stats.materials}
        />
        <StatCard
          icon={IconAssets}
          label="Assets"
          value={project.stats.assets}
        />
      </div>

      {/* Quick actions */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-ink-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <Link
            to={`${base}/scenes`}
            className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <IconPlus className="h-4 w-4" /> New scene
          </Link>
          <Link
            to={`${base}/export`}
            className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <IconExport className="h-4 w-4" /> Export .enfx
          </Link>
          <Link
            to={`${base}/sdk`}
            className="btn-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <IconSdk className="h-4 w-4" /> Download SDK
          </Link>
        </div>
      </section>

      {/* Activity */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-ink-900">Activity</h2>
        <div className="card mt-3 divide-y divide-ink-100 rounded-xl">
          {activity.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <span className="text-sm text-ink-700">{item.label}</span>
              <span className="text-sm text-ink-500">{item.when}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
