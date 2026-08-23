import { useParams } from "react-router-dom";
import { useProjectsStore } from "../store/projectsStore";
import { WebGPUCanvas } from "../components/Editor/WebGPUCanvas";
import { useUiStore } from "../store/uiStore";
import { useEffect } from "react";

export function VfxDesignPage() {
  const { projectID } = useParams();
  const project = useProjectsStore((state) =>
    state.projects.find((p) => p.slug === projectID),
  );
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  useEffect(() => {
    toggleSidebar();
    return () => {
      toggleSidebar();
    };
  }, []);

  if (!project) return null;

  return (
    <>
      <div className="w-full h-full">
        <WebGPUCanvas>
          <mesh>
            <boxGeometry></boxGeometry>
            <meshStandardMaterial></meshStandardMaterial>
          </mesh>
        </WebGPUCanvas>
      </div>
    </>
  );
}

//
//
//
