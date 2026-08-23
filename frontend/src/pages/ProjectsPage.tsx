import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuroraBackground } from "../components/AuroraBackground";
import { ProjectCard } from "../components/Projects/ProjectCard";
import {
  IconChevronLeft,
  IconFolder,
  IconPlus,
  IconSearch,
} from "../components/icons";
import { useProjectsStore } from "../store/projectsStore";

export function ProjectsPage() {
  const navigate = useNavigate();
  const projects = useProjectsStore((state) => state.projects);
  const createProject = useProjectsStore((state) => state.createProject);

  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  const handleCreate = () => {
    const project = createProject({ name, description });
    setShowCreate(false);
    setName("");
    setDescription("");
    navigate(`/projects/${project.id}`);
  };

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition hover:text-ink-800"
            >
              <IconChevronLeft className="h-4 w-4" /> Home
            </Link>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-4xl font-semibold text-ink-900">
                Projects
              </h1>
              <p className="mt-2 text-sm text-ink-500">
                {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"} · launch one to
                open the studio
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              <IconPlus className="h-4 w-4" /> New Project
            </button>
          </div>

          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-full border border-ink-100 bg-white/60 py-2.5 pl-11 pr-4 text-sm text-ink-800 placeholder:text-ink-400 outline-none backdrop-blur transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
            />
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="glass mt-12 flex flex-col items-center rounded-3xl px-6 py-20 text-center">
            <IconFolder className="h-14 w-14 text-tiffany-300" />
            <h2 className="mt-5 text-lg font-semibold text-ink-900">
              {projects.length === 0 ? "No projects yet" : "No matches"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-ink-500">
              {projects.length === 0
                ? "Create your first effect to start building in FX Studio."
                : `Nothing matches “${query}”. Try a different search.`}
            </p>
            {projects.length === 0 && (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                <IconPlus className="h-4 w-4" /> Create a project
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="glass relative w-full max-w-md rounded-2xl p-8 shadow-modal"
          >
            <h2 className="text-xl font-semibold text-ink-900">
              New project
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Start a fresh effect to author in FX Studio.
            </p>

            <label className="mt-6 block text-sm font-medium text-ink-700">
              Name
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Untitled Project"
                className="mt-1.5 w-full rounded-xl border border-ink-100 bg-white/70 px-4 py-2.5 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
              />
            </label>

            <label className="mt-4 block text-sm font-medium text-ink-700">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What does this effect do?"
                className="mt-1.5 w-full resize-none rounded-xl border border-ink-100 bg-white/70 px-4 py-2.5 text-sm text-ink-800 outline-none transition focus:border-tiffany-400 focus:ring-2 focus:ring-tiffany-300/40"
              />
            </label>

            <div className="mt-7 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-500 transition hover:text-ink-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary rounded-full px-5 py-2 text-sm font-semibold"
              >
                Create project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
