# AIDD-17 Starter

AIDD-17 Starter creates a plain Markdown delivery workspace for AI-assisted software work.

It is designed to be installed into an existing project as a `docs` or `Docs` directory. The generated workspace is repo-native, editor-friendly, and does not require Astro, Starlight, MDX, or a website.

## Create a docs workspace from GitHub

From the root of the project you want to add AIDD to:

```bash
npx github:WestForge/aidd17-starter docs
```

Or, if your project uses a capitalised docs folder:

```bash
npx github:WestForge/aidd17-starter Docs
```

This creates a folder like:

```text
docs/
  README.md
  AGENTS.md
  aidd.config.json
  common/
  capabilities/
  delivery/
  bundles/
  scripts/
  templates/
  package.json
```

Then run:

```bash
cd docs
npm run aidd:check
```

The generated workspace has no external dependencies. `npm install` is optional and only needed if you want a `package-lock.json` or later add dependencies.

## Local filesystem test

If you have cloned this repository locally, you can test creation without publishing to npm:

```powershell
cd C:\tmp\aidd-test
npx C:\tmp\aidd17-starter docs --no-install
cd docs
npm run aidd:check
```

On macOS/Linux:

```bash
cd /tmp/aidd-test
npx /tmp/aidd17-starter docs --no-install
cd docs
npm run aidd:check
```

## CLI prompts

When run interactively, the creator asks for:

- target directory, default `docs`
- project name
- project description
- whether to run `npm install`

You can skip prompts with defaults:

```bash
npx github:WestForge/aidd17-starter docs --yes
```

You can force npm install if wanted:

```bash
npx github:WestForge/aidd17-starter docs --install
```

## Core workflow inside the generated workspace

```bash
npm run aidd:check
npm run aidd:capability:create -- payments --title "Payments"
npm run aidd:slice -- payments --id PAY-SLICE-001 --title "Payments Slice 001"
npm run aidd:slice:ready -- PAY-SLICE-001
npm run aidd:bundle -- PAY-SLICE-001
```

Delivery slices start as `draft`. AIDD will not generate an implementation bundle until the slice is marked `ready`.

## Workspace model

```text
common/        Project-wide context and rules
capabilities/  Evolving capability definitions and the generic capability template
delivery/      Scope-locked delivery slices and the generic delivery slice template
bundles/       Generated agent-ready implementation and capability bundles
scripts/       Local AIDD tooling
templates/     Reusable implementation-plan template
```

## Create a capability

AIDD does not create a first capability during setup. Create one when you are ready:

```bash
npm run aidd:capability:create -- payments --title "Payments"
```

This creates ordered Markdown files:

```text
capabilities/payments/
  index.md
  01-outcomes.md
  02-scope.md
  03-user-journeys.md
  04-functional-requirements.md
  05-non-functional-requirements.md
  06-data-model.md
  07-integrations.md
  08-architecture.md
  09-ux-ui.md
  10-risks.md
  11-validation.md
```

## Create a delivery slice

A delivery slice is a scope-locked snapshot created from a capability:

```bash
npm run aidd:slice -- payments --id PAY-SLICE-001 --title "Payments Slice 001"
```

Complete the slice, replace placeholder tasks, define acceptance criteria, then mark it ready:

```bash
npm run aidd:slice:ready -- PAY-SLICE-001
```

## Generate an implementation bundle

Once the slice is ready:

```bash
npm run aidd:bundle -- PAY-SLICE-001
```

This creates:

```text
bundles/PAY-SLICE-001/
  PAY-SLICE-001.bundle.md
  implementation-plan.md
  manifest.json
```

The bundle is the agent-ready execution file.

## Package naming

This repository can be called `aidd17-starter`, while the executable exposed by the package is `create-aidd`. That lets the GitHub install command stay simple now and keeps the path open for a future npm package.
