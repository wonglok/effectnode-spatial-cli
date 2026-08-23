// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";

import { ProjectLayout } from "./components/Projects/ProjectLayout";
import { ProjectDashboardPage } from "./pages/ProjectDashboardPage";
import { ProjectPage } from "./pages/ProjectPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { VfxDesignPage } from "./pages/VfxDesignPage";
import { WelcomePage } from "./pages/WelcomePage";
import { useProjectsStore } from "./store/projectsStore";

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
      <Route path="/projects/:projectID" element={<ProjectLayout />}>
        <Route index element={<ProjectDashboardPage />} />
        <Route path="vfx-design" element={<VfxDesignPage />} />
        <Route path=":page" element={<ProjectPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>,
);
