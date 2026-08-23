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
// import { renderMediaRoutes } from "./render-media.js";
// import { agentBackend } from "./agent/agent-backend.js";
// import { generationQueueSetup } from "./generation-queue.js";
import { createServer } from "node:http";

// import { readdir } from "node:fs/promises";
// import { rename } from "node:fs/promises";
// import { execSync } from "node:child_process";

// const DEV_SERVER_PORT = 5173;
// const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// // Check if Vite dev server is running for HMR
// async function getMainViewUrl(): Promise<string> {
//   const channel = await Updater.localInfo.channel();
//   if (channel === "dev") {
//     try {
//       await fetch(DEV_SERVER_URL, { method: "HEAD" });
//       console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
//       return DEV_SERVER_URL;
//     } catch {
//       console.log(
//         "Vite dev server not running. Run 'bun run dev:hmr' for HMR support.",
//       );
//     }
//   }
//   return "views://mainview/index.html";
// }

// App configuration
// const APP_NAME = "Media Studio by loklok";
const APP_DATA_DIR = join(homedir(), "spatial-studio");
const PYTHON_DIR = join(APP_DATA_DIR, "python-src");
const PROJECTS_DIR = join(APP_DATA_DIR, "projects");
const JSON_DIR = join(APP_DATA_DIR, "json");
const BACKEND_PORT_START = 4000;
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
  port = 4000,
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

  app.listen(BACKEND_PORT);

  const server = createServer(app);

  //

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
