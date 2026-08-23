# EffectNode FX Studio CLI

> One command launches **EffectNode FX Studio** — a real-time visual-effects authoring tool — then exports your work as portable **`.enfx`** files and lets you download the **EffectNode SDK** to load them anywhere.

`@effectnode/spatial-cli` is a full-stack CLI that boots a Vite + React + TypeScript frontend and an Express backend (REST + WebSocket), then opens the Studio in your browser. It's the fastest way to go from `npx` to an open, portable visual-effect file.

| Property   | Value                                                          |
| ---------- | -------------------------------------------------------------- |
| **Package**| [`@effectnode/spatial-cli`](https://www.npmjs.com/package/@effectnode/spatial-cli) |
| **Binary** | `effectnode-spatial-cli`                                       |
| **Command**| `effectnode-spatial`                                           |
| **Stack**  | Vite · React 19 · TypeScript · Express · WebSocket · Three.js WebGPU/TSL |
| **License**| MIT                                                            |

---

## What you can do

| Capability                       | Description                                                                 |
| -------------------------------- | --------------------------------------------------------------------------- |
| 🚀 **Launch FX Studio**          | One command starts the Studio (frontend + backend) and opens it in your browser. |
| 🎨 **Author effects**            | Build node-based materials with Three.js TSL, Draco geometry, and AVIF textures. |
| 📦 **Export `.enfx`**            | Serialize your whole effect — geometry, textures, and the TSL material graph — into a single portable archive. |
| 🧩 **Download the SDK**          | Grab the EffectNode SDK to load `.enfx` files in your own WebGPU/Three.js app. |

---

## Quick start

```bash
# Run it without installing
npx @effectnode/spatial-cli

# …or install globally
bun add -g @effectnode/spatial-cli
effectnode-spatial
```

The command starts both services and opens the Studio:

```
effectnode-spatial is running:
  Frontend  → http://localhost:5288
  REST API  → http://localhost:5201/api
  WebSocket → ws://localhost:5201/ws
```

### Options

| Flag              | Default     | Description                        |
| ----------------- | ----------- | ---------------------------------- |
| `--host <host>`   | `localhost` | Host to bind the servers to.       |
| `--frontend-port` | `5288`      | Port for the Vite frontend.        |
| `--backend-port`  | `5201`      | Port for the Express backend.      |
| `--no-open`       | —           | Don't open the browser on launch.  |

```bash
effectnode-spatial --frontend-port 8080 --backend-port 9000
```

---

## The Studio

EffectNode FX Studio is a browser-based editor for real-time visual effects:

- **Node-based materials** — author TSL (Three.js Shading Language) material graphs that compile to WebGPU shaders.
- **Portable assets** — geometry as **Draco**-compressed buffers, textures as **AVIF**.
- **Projects** — manage effects under `/projects` and per-project pages.

> The backend keeps a local JSON workspace at `~/effectnode-spatial` (project data is also staged under `~/spatial-studio`) — no external database required.

---

## The ENFX format

`.enfx` (**EffectNode FX**) is the open, portable format the Studio exports. A single
`.enfx.zip` archive carries everything an effect needs to render:

```
my-effect.enfx.zip
├── metadata.json        # Format identity, version, provenance
├── data.json            # Asset manifest + scene/material wiring
├── graph.json           # TSL material graph (nodes + edges)
├── geometry/
│   └── mesh-0.draco     # Draco-compressed geometry
└── textures/
    └── albedo.avif      # AVIF textures
```

The material is stored as a **portable node/edge graph** (not compiled shader bytecode), so
it can be re-opened, inspected, and re-rendered in any runtime that understands the spec.

📖 **Full specification:** [`frontend/src/PortableVFX/README.md`](frontend/src/PortableVFX/README.md)

### Reference implementation

| Module                | Responsibility                                                  |
| --------------------- | --------------------------------------------------------------- |
| `src-shared/PortableVFX/types.ts`           | `SerializedNode`, `SerializedEdge`, `MaterialGraphJSON`.    |
| `src-shared/PortableVFX/materialParser.ts`  | `parseNodeMaterialToJSON()` / `hydrateJSONToNodeMaterial()`.|
| `src-shared/PortableVFX/nodeRegistry.ts`    | Maps node class names to `three/webgpu` constructors.       |

```ts
import { MeshPhysicalNodeMaterial } from "three/webgpu";
import { color, float, mul } from "three/tsl";
import { parseNodeMaterialToJSON, hydrateJSONToNodeMaterial } from "./materialParser";

// Author → serialize → hydrate
const material = new MeshPhysicalNodeMaterial();
material.colorNode = mul(color(0x00ff00).rgb, float(2.0));
material.roughnessNode = float(0.4);

const graph = parseNodeMaterialToJSON(material);            // → graph.json content
const restored = hydrateJSONToNodeMaterial(graph, MeshPhysicalNodeMaterial);
```

### The SDK

The **EffectNode SDK** is the reference loader for `.enfx` files — the serializer/hydrator
above plus an archive reader and Draco/AVIF decoders — packaged so you can drop it into your
own Three.js WebGPU app and load exported effects directly. It's downloadable from the
Studio so teams can share effects across projects, engines, and runtimes.

---

## Development

```bash
bun install

# Run frontend + backend together (opens the Studio at :5288)
bun run dev

# Build the CLI (compiles src/ → dist/)
bun run build

# Run the built CLI
bun start
```

| Script         | What it does                                                        |
| -------------- | ------------------------------------------------------------------- |
| `dev`          | Runs backend (`nodemon`/tsx) + frontend (`vite`) concurrently.      |
| `dev:backend`  | Backend only (Express, hot-reloads via nodemon).                    |
| `dev:frontend` | Frontend only (Vite dev server).                                    |
| `build`        | TypeScript compile (`src/` → `dist/`).                              |
| `start`        | Runs the built CLI (`node bin/effectnode-spatial-cli`).             |

### Project layout

```
bin/                     # CLI entry → dist/index.js
src/
  index.ts               # CLI (commander): boots frontend + backend, opens browser
  backend/               # Express REST + WebSocket server
    spatial-backend/     # Studio backend core
    workspace.ts         # Local JSON workspace (~/effectnode-spatial)
src-shared/
  PortableVFX/           # ENFX reference implementation (shared types + serializer)
frontend/
  src/                   # React 19 UI (Zustand + Tailwind CSS)
  src/PortableVFX/       # ENFX format spec + reference
notes/
  tsl.md                 # TSL (Three.js Shading Language) authoring rules
```

---

## License

MIT — see [LICENSE](LICENSE). EffectNode and ENFX are not affiliated with Google (Draco) or
the AV1/AVIF project; those are independent open formats used as building blocks.
