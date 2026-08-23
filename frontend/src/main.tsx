// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";

//
// ANYPORT (window as any).PORT
//
// ANYPORT (window as any).DOMAIN
//
// ANYPORT (window as any).PROTOCOL HTTPS OR HTTP
//

createRoot(document.getElementById("root")!).render(
  <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<>Home</>} />
        <Route path="/projects/:projectID/:tab" element={<>Tab Project</>} />
      </Routes>
    </BrowserRouter>
  </>,
);

//
