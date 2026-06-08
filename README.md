# AIDD Starter

AIDD Starter creates a repo-native Markdown workspace for organising project context, modules, capabilities, delivery slices, and AI-ready implementation bundles inside an existing software project.

It is designed to live inside your project as a `docs` or `Docs` directory, so delivery knowledge stays close to the code, versioned with the work, and easy to open in a local editor.

## Quick Start

```bash
npx github:WestForge/aidd17-starter docs
cd docs
npm run aidd:check
npm run aidd:module:create -- ai --title "AI"
npm run aidd:module:create -- characters --title "Characters"
npm run aidd:capability:create -- companion-behaviour --title "Companion Behaviour" --modules ai,characters
npm run aidd:slice -- companion-behaviour --id COMP-BEH-001 --title "Companion Behaviour Slice 001"
```

Complete the generated delivery slice, then:

```bash
npm run aidd:slice:ready -- COMP-BEH-001
npm run aidd:bundle -- COMP-BEH-001
```

## Core model

- `common/` contains shared project context, decisions, standards, and delivery rules.
- `modules/` contains system boundaries and implementation ownership areas.
- `capabilities/` contains outcomes that may reference one or more modules.
- `delivery/` contains scope-locked slices.
- `bundles/` contains generated implementation packs.

Modules define boundaries. Capabilities define outcomes. Delivery slices define implementation scope.
