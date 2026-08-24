import { IconMaterials } from "../../components/icons";
import { SubPagePlaceholder } from "./SubPagePlaceholder";

export function BuffersPage() {
  return (
    <SubPagePlaceholder
      icon={IconMaterials}
      title="Buffers"
      description="Inspect the GPU buffers backing this material. This panel is coming soon."
    />
  );
}
