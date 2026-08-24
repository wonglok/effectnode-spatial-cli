import { MaterialPreview } from "../../sdk/ui/SpherePreview";
import { WebGPUCanvas } from "../../sdk/ui/WebGPUCanvas";

export function GlbViewerPage() {
  let code = "";
  return (
    <div className="h-full w-full">
      <WebGPUCanvas>
        {/* Default preview sphere (64×64) until a GLB is uploaded. */}
        <MaterialPreview code={code} />
      </WebGPUCanvas>
    </div>
  );
}
