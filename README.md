# AIDD Starter

AIDD Starter creates and updates repo-native Markdown workspaces for organising project context, modules, capabilities, delivery slices, and AI-ready implementation bundles inside an existing software project.

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

The update command refreshes AIDD tooling and framework-owned templates while preserving your project docs, modules, capabilities, delivery slices, and bundles.

## Core model

```text
common/
  Shared project context, decisions, standards, and delivery rules.

modules/
  System boundaries and implementation ownership areas.

capabilities/
  Product or technical outcomes that may reference one or more modules.

delivery/
  Scope-locked slices that define what is being built now.

bundles/
  Generated implementation packs for AI agents or developers.
```

Modules define boundaries. Capabilities define outcomes. Delivery slices define implementation scope.

## Useful commands

```bash
npm run aidd:check
npm run aidd:list

npm run aidd:module:create -- ai --title "AI"
npm run aidd:module:list

npm run aidd:capability:create -- companion-behaviour --title "Companion Behaviour" --modules ai,characters
npm run aidd:capability:list

npm run aidd:slice -- companion-behaviour --id COMP-BEH-001 --title "Companion Behaviour Slice 001"
npm run aidd:slice:ready -- COMP-BEH-001
npm run aidd:bundle -- COMP-BEH-001
npm run aidd:capability -- companion-behaviour
npm run aidd:clean
```
