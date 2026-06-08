# AIDD Starter

AIDD Starter creates and updates repo-native Markdown workspaces for organising project context, modules, capabilities, delivery roadmaps, and phased delivery bundles inside an existing software project.

It is designed to live inside your project as a `docs` or `Docs` directory, so delivery knowledge stays close to the code, versioned with the work, and easy to open in a local editor.

## Quick Start

From the root of an existing project:

```bash
npx github:WestForge/aidd17-starter docs
```

Then:

```bash
cd docs
npm run aidd:check
npm run aidd:module:create -- ai --title "AI"
npm run aidd:capability:create -- companion-behaviour --title "Companion Behaviour" --modules ai
npm run aidd:bundle:create -- COMP-BEH-001 --title "Companion Behaviour Phase 1" --capability companion-behaviour
npm run aidd:delivery:roadmap
```

Complete the generated delivery bundle, then mark it ready and create an agent export:

```bash
npm run aidd:bundle:ready -- COMP-BEH-001
npm run aidd:bundle:export -- COMP-BEH-001
```

Your agent export will be generated at:

```text
delivery/bundles/COMP-BEH-001/exports/COMP-BEH-001.agent.md
```

## Update an existing AIDD workspace

From the project root:

```bash
npx github:WestForge/aidd17-starter update docs
```

Or from inside the docs folder:

```bash
npx github:WestForge/aidd17-starter update .
```

The update command refreshes AIDD tooling and framework-owned templates while preserving your project docs, modules, capabilities, delivery roadmap, and delivery bundles.

## Core model

```text
common/
  Shared project context, decisions, standards, and delivery rules.

modules/
  System boundaries and implementation ownership areas.

capabilities/
  Product or technical outcomes that may reference one or more modules.

delivery/
  Roadmap and delivery bundles.

delivery/bundles/
  Planned delivery packages with phases and agent exports.
```

Modules define boundaries. Capabilities define outcomes. Delivery bundles define planned work. Delivery is the roadmap/queue of bundles.

## Useful commands

```bash
npm run aidd:check
npm run aidd:list

npm run aidd:module:create -- ai --title "AI"
npm run aidd:module:list

npm run aidd:capability:create -- companion-behaviour --title "Companion Behaviour" --modules ai,characters
npm run aidd:capability:list

npm run aidd:bundle:create -- COMP-BEH-001 --title "Companion Behaviour Phase 1" --capability companion-behaviour
npm run aidd:bundle:ready -- COMP-BEH-001
npm run aidd:bundle:export -- COMP-BEH-001
npm run aidd:bundle:list

npm run aidd:delivery:roadmap
npm run aidd:capability -- companion-behaviour
npm run aidd:clean
```
