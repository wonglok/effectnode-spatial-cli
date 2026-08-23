import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  // unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createNetServer } from "node:net";

// const __filename = fileURLToPath(import.meta.url);

import { homedir } from "node:os";
import express from "express";
import cors from "cors";
import { projectsRouter } from "./routers/projects.js";
import { Server } from "socket.io";
import { setupRealtime } from "./realtime.js";
// import { renderMediaRoutes } from "./render-media.js";
// import { agentBackend } from "./agent/agent-backend.js";
// import { generationQueueSetup } from "./generation-queue.js";
import { createServer } from "node:http";

// App configuration
// const APP_NAME = "Media Studio by loklok";
export const APP_DATA_DIR = join(homedir(), "spatial-studio");
export const PYTHON_DIR = join(APP_DATA_DIR, "python-src");
export const PROJECTS_DIR = join(APP_DATA_DIR, "projects");
export const JSON_DIR = join(APP_DATA_DIR, "json");

const BACKEND_PORT_START = 5201;
let BACKEND_PORT = BACKEND_PORT_START;

//

// Setup state
interface SetupState {
  port: string;
  homebrewInstalled: boolean;
  ffmpegInstalled: boolean;
  uvInstalled: boolean;
  pythonInstalled: boolean;
  depsInstalled: boolean;
  backendRunning: boolean;
  imageTestRendered: boolean;
  imageEditTestRendered: boolean;
  videoTestRendered: boolean;
  qwenImageTestRendered: boolean;
  allOK: boolean;
  error?: string;
}

let setupState: SetupState = {
  imageEditTestRendered: false,
  qwenImageTestRendered: false,
  port: "",
  homebrewInstalled: false,
  ffmpegInstalled: false,
  uvInstalled: false,
  pythonInstalled: false,
  depsInstalled: false,
  backendRunning: false,
  imageTestRendered: false,
  videoTestRendered: false,
  allOK: false,
  error: "",
};

export async function runSetup({
  port = 5201,
}: {
  port: number;
}): Promise<any> {
  [APP_DATA_DIR, PYTHON_DIR, PROJECTS_DIR, JSON_DIR].forEach((dir) => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  BACKEND_PORT = await findFreePort(port);

  console.log("BACKEND_PORT", BACKEND_PORT);

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "100gb" }));
  app.get("/api/hi", (req, res) => {
    res.json({ hi: "hi" });
  });

  app.use("/api/projects", projectsRouter);

  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: true, credentials: true },
  });
  setupRealtime(io);

  server.listen(BACKEND_PORT);

  return server;
}

async function findFreePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(`No free port found in range ${startPort}-${startPort + 99}`);
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createNetServer();
    server.once("error", () => resolve(false));
    // Bind the same wildcard address as `app.listen(port)` (Node defaults to
    // the IPv6 dual-stack wildcard), so the probe and the real listen agree on
    // which address family is in use.
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}
