import { Link } from "react-router-dom";
import type { Project } from "../../lib/types";
import { timeAgo } from "../../lib/format";
import { IconEffects, IconFolder } from "../icons";

const STATUS_STYLES: Record<Project["status"], string> = {
  draft: "bg-ink-100 text-ink-600",
  published: "bg-tiffany-100 text-tiffany-700",
  archived: "bg-ink-100 text-ink-500",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card group flex flex-col rounded-xl p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tiffany-50 text-tiffany-600">
          <IconFolder className="h-5 w-5" />
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[project.status]}`}
        >
          {project.status}
        </span>
      </div>

      <h3 className="mt-4 truncate text-base font-semibold text-ink-900">
        {project.name}
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-ink-600">
        {project.description || "No description yet."}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <IconEffects className="h-4 w-4 text-tiffany-600" />
          {`${project.stats.effects} effects · ${project.stats.materials} materials · ${project.stats.assets} assets`}
        </span>
        <span className="whitespace-nowrap text-ink-400">
          {timeAgo(project.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
