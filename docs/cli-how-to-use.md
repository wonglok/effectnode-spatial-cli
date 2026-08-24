# EffectNode Spatial CLI — How to Use

This document explains how to build, run, and drive the `effectnode-spatial` command-line tool. It was written by reading the source (`src/index.ts` + `src/backend/…`) and running the built CLI to capture real output.

---

## 1. What it is

`@effectnode/spatial-cli` is a single binary with two personalities:

| Mode            | Command                       | Purpose                                                                                                                                 |
| --------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Interactive** | `web`                         | Boot the full Studio — a Vite + React frontend and an Express backend (REST + WebSocket) — and open the browser.                        |
| **Headless**    | `projects`, `assets`, `scene` | Drive the scene graph from the terminal with JSON in / JSON out. Designed for AI agents and scripts (no browser, no heavy deps loaded). |

Both modes share the same on-disk workspace, so edits made from the CLI are visible in the Studio and vice-versa.

**Package / binary mapping**

| Property               | Value                                                       |
| ---------------------- | ----------------------------------------------------------- |
| Package                | `@effectnode/spatial-cli`                                   |
| npm `bin` entry        | `effectnode-spatial-cli`                                    |
| Commander program name | `effectnode-spatial`                                        |
| Entry                  | `bin/effectnode-spatial-cli` → `import("../dist/index.js")` |

---

## 2. Build & run

The CLI is TypeScript (`src/`), compiled to JavaScript (`dist/`) with `tsc`.

```bash
# Compile src/ → dist/
bun run build          # ≡ tsc

# Run the built CLI from this repo
npx .                  # runs bin/effectnode-spatial-cli → dist/index.js
bun start              # ≡ node bin/effectnode-spatial-cli
```

The canonical "build then run" flow the CLI is developed against:

```bash
bun run build; npx .
```

> `npx .` resolves the `bin` field in `package.json`, so it runs the compiled `dist/` output. Always re-`build` after editing `src/`.

**From npm (published)**

```bash
npx @effectnode/spatial-cli           # run without installing
bun add -g @effectnode/spatial-cli    # install globally
effectnode-spatial                    # then call the binary
```

---

## 3. Command reference

Top-level help (also printed when run with **no arguments** — note: this exits with code `1`, not `0`):

```
Usage: effectnode-spatial [options] [command]

EffectNode spatial studio — run `web` to start the app, or drive the scene graph
headlessly with the `projects` and `scene` subcommands.

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  web [options]   Start the web app (Vite + backend) and open the browser
  projects        List projects as JSON (id, slug, name, …)
  assets <slug>   List a project's asset files as JSON (name, src)
  scene           Read or edit a project's scene graph (headless, JSON in/out)
  help [command]  display help for command
```

There is **no default command** — you must pick `web` or a headless subcommand.

### 3.1 `web` — start the app

```
Usage: effectnode-spatial web [options]

Options:
  --frontend-port <port>  Frontend (Vite) port (default: "5288")
  --backend-port <port>   Backend (Express) port (default: "5201")
  --no-open               Do not open the browser
```

```bash
effectnode-spatial web
effectnode-spatial web --frontend-port 8080 --backend-port 9000
effectnode-spatial web --no-open
```

What it does:

1. Starts the Express backend on `--backend-port`.
2. Starts a Vite dev server on `--frontend-port`, proxying `/api` and `/ws` to the backend.
3. Prints the three endpoints and opens the browser (unless `--no-open` or `EFFECTNODE_MEDIA_NO_OPEN=1`).

```
effectnode-spatial is running:
  Frontend  → http://localhost:5288
  REST API  → http://localhost:5201/api
  WebSocket → ws://localhost:5201/ws
  Press Ctrl+C to stop.
```

> The backend actually binds the **first free port** from the requested port up to `+99` (it logs `BACKEND_PORT <n>`). If `5201` is taken, it silently moves up.

### 3.2 `projects` — list projects

```bash
effectnode-spatial projects
```

Prints the project database as pretty-printed JSON (an array of `Project` objects):

```json
[
  {
    "id": "4e946c03-d9f4-48e0-ba35-ef89000d30ea",
    "slug": "life-is-good",
    "name": "life is good!",
    "description": "",
    "status": "draft",
    "createdAt": "2026-08-23T08:25:53.276Z",
    "updatedAt": "2026-08-23T09:48:55.936Z",
    "accent": "tiffany",
    "stats": { "effects": 0, "materials": 0, "assets": 0 }
  }
]
```

> **`slug` is the key.** Every other command (`assets`, `scene …`) takes a project `slug` (not `id`, not `name`). The slug is derived from the name (`slugify`: lowercase, non-alphanumerics → `-`, deduped with a numeric suffix).

### 3.3 `assets <slug>` — list a project's files

```bash
effectnode-spatial assets life-is-good
```

Lists the files a project can reference from scene nodes (`model` / `environment` `src`):

```json
[
  {
    "name": "banana.glb",
    "src": "/api/projects/life-is-good/uploads/banana.glb"
  },
  { "name": "room.glb", "src": "/api/projects/life-is-good/uploads/room.glb" },
  {
    "name": "shanghai_bund_1k.hdr",
    "src": "/api/projects/life-is-good/uploads/shanghai_bund_1k.hdr"
  }
]
```

`src` is the same URL the running Studio serves, so you can drop it straight into a node's `params.src`.

### 3.4 `scene` — read & edit the scene graph

```
Usage: effectnode-spatial scene [options] [command]

Commands:
  get <slug>                 Print the scene nodes as a JSON array
  template [type]            Print node template(s) showing available params per type
  set [options] <slug>       Replace the whole scene (JSON array via --json, --file, or stdin)
  add [options] <slug>       Append a node (JSON object via --json, --file, or stdin)
  remove <slug> <id>         Remove a node (and its descendants) by id
  rename <slug> <id> <name>  Rename a node by id
  clear <slug>               Reset the scene to empty
```

All commands persist to the project's `design.json` — the same file the Studio reads/writes.

| Command                           | What it does                    | Output                                    |
| --------------------------------- | ------------------------------- | ----------------------------------------- |
| `scene get <slug>`                | Print the scene as a JSON array | the node array                            |
| `scene template [type]`           | Print node template(s)          | JSON param schema per type (or all types) |
| `scene set <slug> --json <arr>`   | Replace the whole scene         | `Scene set (<n> nodes)`                   |
| `scene add <slug> --json <obj>`   | Append one node                 | the full node JSON (incl. generated `id`) |
| `scene remove <slug> <id>`        | Delete a node + descendants     | `Removed node <id>`                       |
| `scene rename <slug> <id> <name>` | Rename a node                   | `Renamed <id> -> <name>`                  |
| `scene clear <slug>`              | Reset scene to `[]`             | `Scene cleared`                           |

`set` and `add` accept JSON three ways (priority order):

1. `--json '<inline>'`
2. `--file <path>` — read JSON from a file
3. **stdin** — pipe JSON in (only when stdin is not a TTY)

```bash
# get
effectnode-spatial scene get life-is-good

# replace the whole scene from a file
effectnode-spatial scene set life-is-good --file scene.json

# add a single node (id + name are auto-filled if omitted)
effectnode-spatial scene add life-is-good --json '{"type":"light","params":{"intensity":2}}'

# add by piping
echo '{"type":"model","params":{"src":"/api/projects/life-is-good/uploads/van.glb"}}' \
  | effectnode-spatial scene add life-is-good

# remove / rename / clear
effectnode-spatial scene remove life-is-good b7290cc2-7d64-47c8-87c8-2244b87f226d
effectnode-spatial scene rename life-is-good b7290cc2-7d64-47c8-87c8-2244b87f226d "My HDR"
effectnode-spatial scene clear life-is-good
```

### 3.5 `scene template` — inspect node templates

Every node type has a machine-readable template describing exactly which `params` it accepts. Agents use this to build valid nodes without guessing param names.

```bash
# All 8 types (a JSON object keyed by type)
effectnode-spatial scene template

# One type
effectnode-spatial scene template model
effectnode-spatial scene template environment
```

Each template is JSON with these fields:

- `type`, `description` — what the node is
- `required` — param names that must be present (e.g. `model` and `environment` require `src`)
- `supportsChildren` — whether the node can nest child nodes
- `params` — a map of `{ type, description, default?, required? }` for every accepted param
- `example` — a minimal valid node you can copy into `scene add`

```jsonc
// effectnode-spatial scene template model
{
  "type": "model",
  "description": "A GLB/GLTF model loaded from an asset `src`.",
  "required": ["src"],
  "supportsChildren": false,
  "params": {
    "src": {
      "type": "string",
      "required": true,
      "description": "Asset URL (list files with the `assets` command)",
    },
    "position": {
      "type": "vec3",
      "default": [0, 0, 0],
      "description": "World position [x, y, z]",
    },
    "rotation": {
      "type": "vec3 (degrees)",
      "default": [0, 0, 0],
      "description": "Euler rotation in degrees [x, y, z]",
    },
    "scale": {
      "type": "vec3",
      "default": [1, 1, 1],
      "description": "Scale [x, y, z]",
    },
    "isCollider": {
      "type": "boolean",
      "default": false,
      "description": "Mark the node as a physics collider",
    },
    "userData": {
      "type": "array",
      "default": [],
      "description": "Array of { key: string, value: string } entries",
    },
  },
  "example": {
    "type": "model",
    "name": "model.glb",
    "params": {
      "src": "/api/projects/<slug>/uploads/model.glb",
      "position": [0, 0, 0],
    },
  },
}
```

Passing an unknown type errors and exits `1`:

```bash
effectnode-spatial scene template bogus
# ✖ Unknown node type "bogus" (expected one of group, mesh, geometry, material, light, camera, model, environment)
```

---

## 4. Scene node reference

A scene is a JSON array of nodes. Each node:

```jsonc
{
  "id": "b7290cc2-7d64-47c8-87c8-2244b87f226d", // string, auto-generated UUID if omitted on `add`
  "name": "shanghai_bund_1k.hdr", // string, defaulted from `type` if omitted
  "type": "environment", // one of the 8 types below
  "params": {
    /* free-form */
  },
  "children": [
    /* nested SceneNode[] */
  ], // optional
}
```

**Node types** (`type`):

`group` · `mesh` · `geometry` · `material` · `light` · `camera` · `model` · `environment`

Default names if `name` is omitted on `add`: `Group`, `Mesh`, `Geometry`, `Material`, `Light`, `Camera`, `Model`, `Environment`.

**`params` is free-form** — it's an untyped `Record<string, unknown>`. The Studio interprets specific keys per type. Run `effectnode-spatial scene template <type>` for the authoritative, machine-readable list of keys each type accepts (see §3.5). Real examples from a live project:

```jsonc
// environment — HDR sky/background
{
  "type": "environment",
  "params": {
    "src": "/api/projects/life-is-good/uploads/shanghai_bund_1k.hdr",
    "environmentIntensity": 1,
    "backgroundIntensity": 1,
    "useEnvironment": true,
    "useBackground": true
  }
}

// model — glTF asset with transform + collision flag
{
  "type": "model",
  "params": {
    "src": "/api/projects/life-is-good/uploads/banana.glb",
    "position": [-1.93, -0.03, 0.72],
    "scale": [3, 3, 3],
    "rotation": [0, 45, 0],
    "isCollider": false
  }
}
```

**Validation rules** (`scene set` is strict; `scene add` is lenient and coerces):

- `scene set` requires an **array of fully-valid nodes** — every node must have a string `id`, string `name`, a valid `type`, an object `params` (if present), and recursively-valid `children`. Otherwise it errors with `Expected a JSON array of scene nodes`.
- `scene add` **coerces** a partial object: it fills in `id` (UUID), `name` (default), and validates `type`. It rejects an unknown `type` with `Invalid node type "<x>" (expected one of group, mesh, geometry, material, light, camera, model, environment)`.

---

## 5. Where data lives

All persistent state is plain JSON under a per-user workspace (no database):

```
~/effectnode-spatial/
├── projects.json                  # the project database (array of Project)
└── projects/
    └── <project-id>/              # one folder per project (id = UUID)
        ├── <slug>.txt             # "thank you for using EffectNode!" placeholder
        ├── db/
        │   └── design.json        # the scene graph (scene node array)
        ├── assets/
        └── uploads/               # uploaded model/texture/HDR files
```

- `projects.json` is the source of truth for the `projects` command.
- `db/design.json` is the source of truth for `scene` commands (and the Studio's socket API).
- `uploads/` is what `assets <slug>` lists.

> The backend also creates `~/spatial-studio/` (with `projects`, `json`, `python-src`) at startup — that's a legacy/setup path from `core.ts`; the CLI's actual data lives in `~/effectnode-spatial`.

---

## 6. Headless agent workflow

The CLI is built for an AI agent (Claude Code, a script, etc.) to manipulate a project without launching the Studio. A typical loop:

```bash
# 1. Find a project slug
effectnode-spatial projects

# 2. See what files it can reference
effectnode-spatial assets life-is-good

# 3. Inspect node templates (optional — check valid params per type)
effectnode-spatial scene template model

# 4. Read the current scene
effectnode-spatial scene get life-is-good > scene.json

# 5. Add / edit nodes
effectnode-spatial scene add life-is-good \
  --json '{"type":"model","params":{"src":"/api/projects/life-is-good/uploads/van.glb","position":[0,0,-2]}}'

# 6. Review, then (optionally) open the Studio to see the result
effectnode-spatial web
```

Because every `scene` command writes `design.json` directly, edits are durable and the Studio picks them up on next load.

---

## 7. Notes & caveats

- **No default command** — bare `effectnode-spatial` prints help and exits `1`; you must run `web` explicitly.
- **`--version` reports `0.1.0`** (hardcoded in `src/index.ts`), which differs from the npm `package.json` version (`0.11.0`). Don't rely on `--version` for the published version.
- **`web` is the only startup path** — `projects` / `assets` / `scene` are headless and never start a server or pull in Vite/Express/socket.io (they're lazy-imported only in `web`), so those commands stay fast.
- **Backend port auto-increment** — if `--backend-port` is occupied, the backend binds the next free port (logged as `BACKEND_PORT <n>`).
- **`scene add` echoes the full node** (with the generated `id`) so an agent can capture the id for later `remove`/`rename`.
- **Stdin is supported** for `set`/`add` only when stdin is piped (not a TTY); otherwise you must pass `--json` or `--file`.
