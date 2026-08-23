import { Link } from "react-router-dom";
import { AuroraBackground } from "../components/AuroraBackground";
import { IconChevronRight, IconSdk } from "../components/icons";

const PILLS = ["Draco", "AVIF", "TSL", "WebGPU"];

export function WelcomePage() {
  return (
    <div className="relative min-h-screen">
      <AuroraBackground />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="glass w-full max-w-xl rounded-3xl p-10 text-center shadow-modal sm:p-14">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-tiffany-500 text-2xl font-bold text-white shadow-glow">
            E
          </div>

          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.35em] text-tiffany-600">
            EffectNode
          </p>

          <h1 className="wordmark mt-3 font-display text-5xl font-semibold leading-tight sm:text-6xl">
            FX Studio
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-500">
            Author real-time visual effects, ship them as portable{" "}
            <span className="font-medium text-ink-700">.enfx.zip</span> files,
            and download the SDK to run them anywhere on WebGPU.
          </p>

          <div className="mt-9 space-y-2 gap-3 flex flex-col">
            <Link
              to="/projects"
              className="btn-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold sm:w-auto"
            >
              Launch the Studio
              <IconChevronRight className="h-4 w-4" />
            </Link>
            {/* <Link
              to="/projects"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-tiffany-300 bg-white/60 px-6 py-3 text-sm font-semibold text-tiffany-700 transition hover:border-tiffany-400 hover:bg-white"
            >
              <IconSdk className="h-4 w-4" />
              Download the SDK
            </Link> */}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {PILLS.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-ink-100 bg-white/50 px-3 py-1 text-xs font-medium text-ink-500"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="pointer-events-none absolute bottom-5 left-0 right-0 z-10 text-center text-xs text-ink-400">
        EffectNode FX Studio · v0.11.0
      </p>
    </div>
  );
}
