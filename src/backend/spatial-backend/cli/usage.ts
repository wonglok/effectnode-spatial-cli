// Example CLI usage, printed by `effectnode-spatial example-usage`. Paths are
// generalized (placeholders like <slug>, <asset>, <project-id>) with no absolute
// or machine-specific paths, so agents can adapt them to any project.

const EXAMPLE_USAGE = `EffectNode Spatial CLI — example usage

# Start the app
effectnode-spatial web
effectnode-spatial web --no-open

# Discover a project (note the slug)
effectnode-spatial projects

# List a project's asset files (returns [{ name, src }])
effectnode-spatial assets <slug>

# Inspect node templates (available params per type)
effectnode-spatial scene template
effectnode-spatial scene template model

# Read the current scene
effectnode-spatial scene get <slug>
effectnode-spatial scene get <slug> > scene.json

# Add nodes (id/name are auto-filled if omitted)
effectnode-spatial scene add <slug> --json '{"type":"model","params":{"src":"/api/projects/<slug>/uploads/<asset>.glb","position":[0,0,0]}}'
effectnode-spatial scene add <slug> --json '{"type":"environment","params":{"src":"/api/projects/<slug>/uploads/<asset>.hdr"}}'

# Replace the whole scene (--json, --file, or stdin)
effectnode-spatial scene set <slug> --file scene.json

# Edit individual nodes
effectnode-spatial scene remove <slug> <node-id>
effectnode-spatial scene rename <slug> <node-id> "New Name"
effectnode-spatial scene clear <slug>

# Where data lives (under your workspace directory)
projects.json                        # project database
projects/<project-id>/db/design.json # the scene graph
projects/<project-id>/uploads/       # asset files (listed by 'assets')`;

export function printExampleUsage(): void {
  console.log(EXAMPLE_USAGE);
}
