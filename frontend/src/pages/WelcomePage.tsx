import { Link } from "react-router-dom";
import { IconChevronRight } from "../components/icons";

export function WelcomePage() {
  return (
    <div className="welcome-hero flex min-h-screen items-center justify-center px-6 py-16">
      <div className="card w-full max-w-md rounded-xl p-10 text-center shadow-modal">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-tiffany-600 text-xl font-bold text-white">
          E
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-ink-900">
          EffectNode <span className="text-tiffany-600">FX Studio</span>
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-600">
          Author real-time visual effects and ship them as portable{" "}
          <span className="font-medium text-ink-800">.enfx.zip</span> files that
          run anywhere on WebGPU.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            to="/projects"
            className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold"
          >
            Launch the Studio
            <IconChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
