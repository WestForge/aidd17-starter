# __PROJECT_NAME__

__PROJECT_DESCRIPTION__

## Quick Start

```bash
npm run aidd:check
npm run aidd:module:create -- ai --title "AI"
npm run aidd:capability:create -- companion-behaviour --title "Companion Behaviour" --modules ai
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
