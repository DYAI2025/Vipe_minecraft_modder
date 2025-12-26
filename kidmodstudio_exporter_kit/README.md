# KidModStudio Exporter Kit (Node.js)

## What this is
- `project.schema.json`: JSON Schema for project files
- `project.example.json`: example project
- `exporter/index.js`: exporter that writes a Fabric mod project (template + generated files)

## Quick start
1) Install Node.js 18+
2) Install deps:
   npm install
3) Put a Fabric template folder at `exporter/template/` (see below) OR point `--template` to it.
4) Run:
   node index.js --project ../project.example.json --template ./template --out ./out

## Template requirement
This exporter expects a template folder that already contains:
- gradle wrapper scripts and jar
- `build.gradle`, `settings.gradle`, `gradle.properties`
- `src/main/resources/fabric.mod.json` (with placeholders)
- `src/main/java/...` (will be overwritten by generator)

You can build that template once using your Fabric template files, then keep it in-repo.
