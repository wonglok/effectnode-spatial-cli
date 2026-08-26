// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";

import { ProjectLayout } from "./components/Projects/ProjectLayout";
import { ProjectDashboardPage } from "./pages/ProjectDashboardPage";
import { ProjectPage } from "./pages/ProjectPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { MaterialEditorPage } from "./pages/MaterialEditorPage";
import { AiChatPage } from "./pages/materialEditor/AiChatPage";
import { BuffersPage } from "./pages/materialEditor/BuffersPage";
import { GlbViewerPage } from "./pages/materialEditor/GlbViewerPage";
import { BackupsPage } from "./pages/materialEditor/BackupsPage";
import { TslCodeEditorPage } from "./pages/materialEditor/TslCodeEditorPage";
import { MaterialsPage } from "./pages/MaterialsPage";
import { SceneEditorPage } from "./pages/SceneEditorPage";
import { ScenePreviewPage } from "./pages/ScenePreviewPage";
import { ScenesPage } from "./pages/ScenesPage";
import { WelcomePage } from "./pages/WelcomePage";
import { useProjectsStore } from "./store/projectsStore";
import { ColumnLayout } from "./components/Projects/ColumnLayout";

//
// ANYPORT (window as any).PORT
//
// ANYPORT (window as any).DOMAIN
//
// ANYPORT (window as any).PROTOCOL HTTPS OR HTTP
//

// Load projects from the backend before the first render.
useProjectsStore.getState().fetchProjects();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<WelcomePage />} />

      <Route path="/projects" element={<ProjectsPage />} />

      <Route
        path="/projects/:projectID/scenes/:sceneSlug/preview"
        element={<ScenePreviewPage />}
      />

      <Route path="/projects/:projectID" element={<ProjectLayout />}>
        <Route
          index
          element={
            <ColumnLayout>
              <ProjectDashboardPage />
            </ColumnLayout>
          }
        />

        <Route
          path="scenes"
          element={
            <ColumnLayout>
              <ScenesPage />
            </ColumnLayout>
          }
        />

        <Route path="scenes/:sceneSlug" element={<SceneEditorPage />} />

        <Route
          path="materials"
          element={
            <ColumnLayout>
              <MaterialsPage />
            </ColumnLayout>
          }
        />

        <Route path="materials/:materialSlug" element={<MaterialEditorPage />}>
          <Route index element={<Navigate to="glb-viewer" replace />} />
          <Route path="glb-viewer" element={<GlbViewerPage />} />
          <Route path="buffers" element={<BuffersPage />} />
          <Route path="ai-chat" element={<AiChatPage />} />
          <Route path="tsl-code-editor" element={<TslCodeEditorPage />} />
          <Route path="backups" element={<BackupsPage />} />
        </Route>

        <Route
          path=":page"
          element={
            <ColumnLayout>
              <ProjectPage />
            </ColumnLayout>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>,
);
