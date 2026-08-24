#!/usr/bin/env node
import { Command } from "commander";
import { fileURLToPath } from "node:url";
import path from "node:path";
import chalk from "chalk";
import { loadProjects } from "./backend/spatial-backend/routers/projects/store.js";
import {
  sceneAdd,
  sceneClear,
  sceneGet,
  sceneRemove,
  sceneRename,
  sceneSet,
} from "./backend/spatial-backend/cli/scene.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The Vite app source lives at the package root, next to dist/ (shipped in
// "files"), so this resolves correctly from both src/ (tsx) and dist/ (build).
const FRONTEND_ROOT = path.resolve(__dirname, "..", "frontend");

const program = new Command();

program
  .name("effectnode-spatial")
  .description(
    "EffectNode spatial studio — run `web` to start the app, or drive the scene " +
      "graph headlessly with the `projects` and `scene` subcommands.",
  )
  .version("0.1.0");

/** Wrap an async command action so errors exit cleanly with a message. */
function run(fn: (...args: any[]) => Promise<void>) {
  return async (...args: any[]): Promise<void> => {
    try {
      await fn(...args);
    } catch (err) {
      console.error(chalk.red(`\n✖ ${(err as Error).message}`));
      process.exit(1);
    }
  };
}

// --- web (start the app) ------------------------------------------------------

program
  .command("web")
  .description("Start the web app (Vite + backend) and open the browser")
  .option("--frontend-port <port>", "Frontend (Vite) port", "5288")
  .option("--backend-port <port>", "Backend (Express) port", "5201")
  .option("--no-open", "Do not open the browser")
  .action(async (options) => {
    await start(
      options as {
        frontendPort: string;
        backendPort: string;
        open: boolean;
      },
    );
  });

// --- projects -----------------------------------------------------------------

program
  .command("projects")
  .description("List projects as JSON (id, slug, name, …)")
  .action(
    run(async () => {
      console.log(JSON.stringify(await loadProjects(), null, 2));
    }),
  );

// --- scene --------------------------------------------------------------------

const scene = program
  .command("scene")
  .description("Read or edit a project's scene graph (headless, JSON in/out)");

scene
  .command("get <slug>")
  .description("Print the scene nodes as a JSON array")
  .action(run(async (slug: string) => sceneGet(slug)));

scene
  .command("set <slug>")
  .description(
    "Replace the whole scene (JSON array via --json, --file, or stdin)",
  )
  .option("--json <json>", "inline JSON")
  .option("--file <path>", "read JSON from a file")
  .action(run(async (slug: string, opts) => sceneSet(slug, opts)));

scene
  .command("add <slug>")
  .description("Append a node (JSON object via --json, --file, or stdin)")
  .option("--json <json>", "inline JSON")
  .option("--file <path>", "read JSON from a file")
  .action(run(async (slug: string, opts) => sceneAdd(slug, opts)));

scene
  .command("remove <slug> <id>")
  .description("Remove a node (and its descendants) by id")
  .action(run(async (slug: string, id: string) => sceneRemove(slug, id)));

scene
  .command("rename <slug> <id> <name>")
  .description("Rename a node by id")
  .action(
    run(async (slug: string, id: string, name: string) =>
      sceneRename(slug, id, name),
    ),
  );

scene
  .command("clear <slug>")
  .description("Reset the scene to empty")
  .action(run(async (slug: string) => sceneClear(slug)));

// --- start (default) ----------------------------------------------------------

// Heavy dependencies are loaded lazily so the headless `projects`/`scene`
// commands start fast without pulling in Vite/Express/socket.io.
async function start(options: {
  frontendPort: string;
  backendPort: string;
  open: boolean;
}): Promise<void> {
  const [
    { createBackendServer },
    { createServer: createViteServer },
    reactPlugin,
    tailwindPlugin,
    openMod,
  ] = await Promise.all([
    import("./backend/index.js"),
    import("vite"),
    import("@vitejs/plugin-react"),
    import("@tailwindcss/vite"),
    import("open"),
  ]);

  const frontendPort = Number(options.frontendPort);
  const backendPort = Number(options.backendPort);

  const backend = await createBackendServer({ port: backendPort });

  const vite = await createViteServer({
    root: FRONTEND_ROOT,
    plugins: [reactPlugin.default(), tailwindPlugin.default()],
    env: { PORT: backendPort },
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      port: frontendPort,
      strictPort: true,
      proxy: {
        "/api": {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
        "/ws": {
          target: `http://localhost:${backendPort}`,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  });
  await vite.listen();

  const url = `http://localhost:${frontendPort}`;

  console.log("");
  console.log(chalk.green("effectnode-spatial is running:"));
  console.log(chalk.cyan(`  Frontend  → ${url}`));
  console.log(chalk.cyan(`  REST API  → http://localhost:${backendPort}/api`));
  console.log(chalk.cyan(`  WebSocket → ws://localhost:${backendPort}/ws`));
  console.log(chalk.dim("  Press Ctrl+C to stop."));
  console.log("");

  if (options.open !== false && process.env.EFFECTNODE_MEDIA_NO_OPEN !== "1") {
    await openMod.default(url);
  }

  const shutdown = () => {
    void vite.close();
    backend.close();
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

program.parseAsync().catch((err: Error) => {
  console.error(chalk.red(`\n✖ ${err.message}`));
  process.exit(1);
});
