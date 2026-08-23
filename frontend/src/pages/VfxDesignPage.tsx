import { useParams } from "react-router-dom";
import { IconEffects } from "../components/icons";
import { useProjectsStore } from "../store/projectsStore";

export function VfxDesignPage() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.id === projectID),
  );

  if (!project) return null;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-tiffany-200 bg-white/40 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tiffany-100 text-tiffany-600">
        <IconEffects className="h-7 w-7" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-ink-900">VFX Editor</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-500">
        Design node-based effects for “{project.name}”. The node editor is
        coming soon.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {["Node graph", "TSL materials", "Draco + AVIF"].map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-ink-100 bg-white/60 px-3 py-1 text-xs font-medium text-ink-500"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
