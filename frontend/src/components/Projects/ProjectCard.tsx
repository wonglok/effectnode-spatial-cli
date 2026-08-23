import type { ComponentType } from "react";
import { Link } from "react-router-dom";
import type { AccentKey, Project } from "../../lib/types";
import { timeAgo } from "../../lib/format";
import { IconAssets, IconEffects, IconMaterials } from "../icons";

const ACCENT_GRADIENTS: Record<AccentKey, string> = {
  tiffany: "linear-gradient(135deg, #b0e8e3 0%, #4fc3bc 55%, #089a96 100%)",
  periwinkle:
    "linear-gradient(135deg, #c3b4f4 0%, #81d8d0 55%, #0abab5 100%)",
  blush: "linear-gradient(135deg, #ffd6ea 0%, #c3b4f4 55%, #4fc3bc 100%)",
  sky: "linear-gradient(135deg, #b7e1fb 0%, #81d8d0 55%, #c3b4f4 100%)",
  mint: "linear-gradient(135deg, #c8f1e6 0%, #b7e1fb 55%, #4fc3bc 100%)",
};

const STATUS_STYLES: Record<Project["status"], string> = {
  draft: "bg-ink-100 text-ink-600",
  published: "bg-tiffany-100 text-tiffany-700",
  archived: "bg-dream-blush/70 text-ink-500",
};

interface StatProps {
  icon: ComponentType<{ className?: string }>;
  value: number;
  label: string;
}

function Stat({ icon: Icon, value, label }: StatProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-tiffany-600" />
      <span className="font-medium text-ink-700">{value}</span>
      <span className="text-ink-400">{label}</span>
    </span>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl glass shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div
        className="relative flex aspect-[16/10] items-end overflow-hidden p-5"
        style={{ backgroundImage: ACCENT_GRADIENTS[project.accent] }}
      >
        <span className="pointer-events-none absolute -right-4 -top-6 select-none font-display text-[7rem] leading-none text-white/25 transition-transform duration-300 group-hover:scale-110">
          {project.name.charAt(0).toUpperCase()}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm ${STATUS_STYLES[project.status]}`}
        >
          {project.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="truncate text-lg font-semibold text-ink-900">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink-500">
            {project.description || "No description yet."}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-500">
          <span className="inline-flex items-center gap-3">
            <Stat icon={IconEffects} value={project.stats.effects} label="effects" />
            <Stat icon={IconMaterials} value={project.stats.materials} label="materials" />
            <Stat icon={IconAssets} value={project.stats.assets} label="assets" />
          </span>
          <span className="whitespace-nowrap text-ink-400">
            {timeAgo(project.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
