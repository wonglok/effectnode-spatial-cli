// Example CLI usage, printed by `effectnode-spatial example-usage`. Paths are
// generalized (placeholders like <project>, <scene>, <asset>) with no absolute
// or machine-specific paths, so agents can adapt them to any project.

const EXAMPLE_USAGE = `EffectNode Spatial CLI — example usage

# Start the app
effectnode-spatial web
effectnode-spatial web --no-open

# Discover a project (note the slug)
effectnode-spatial projects

# List a project's asset files (returns [{ name, src }])
effectnode-spatial assets <slug>

# List / create scenes in a project
effectnode-spatial scene list <project>
effectnode-spatial scene create <project> "My Scene"

# Inspect node templates (available params per type)
effectnode-spatial scene template
effectnode-spatial scene template model

# Read a scene
effectnode-spatial scene get <project> <scene>
effectnode-spatial scene get <project> <scene> > scene.json

# Add nodes (id/name are auto-filled if omitted)
effectnode-spatial scene add <project> <scene> --json '{"type":"model","params":{"src":"/api/projects/<slug>/uploads/<asset>.glb","position":[0,0,0]}}'
effectnode-spatial scene add <project> <scene> --json '{"type":"environment","params":{"src":"/api/projects/<slug>/uploads/<asset>.hdr"}}'

# Replace the whole scene (--json, --file, or stdin)
effectnode-spatial scene set <project> <scene> --file scene.json

# Edit individual nodes
effectnode-spatial scene remove <project> <scene> <node-id>
effectnode-spatial scene rename <project> <scene> <node-id> "New Name"
effectnode-spatial scene clear <project> <scene>

# Where data lives (under your workspace directory)
projects.json                                       # project database
projects/<project-id>/scenes/<scene-slug>/metadata.json # scene metadata
projects/<project-id>/scenes/<scene-slug>/design.json   # the scene graph
projects/<project-id>/uploads/                      # asset files (listed by 'assets')`;

export function printExampleUsage(): void {
  console.log(EXAMPLE_USAGE);
}
