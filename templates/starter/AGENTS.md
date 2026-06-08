# AGENTS

This repository uses AIDD as a plain Markdown delivery workspace.

## Source of truth

- `common/` contains project-wide context and rules.
- `capabilities/` contains evolving capability definitions.
- `delivery/` contains scope-locked delivery slices.
- `bundles/` contains generated agent-ready outputs.

## Generic templates

- `capabilities/_template/` describes the generic capability sections.
- `delivery/_template/` describes the generic delivery slice shape.
- Do not implement work from template folders.

## Implementation rule

Do not implement from a delivery slice unless it is marked `ready` and an implementation bundle has been generated.

Use:

```powershell
npm run aidd:slice:ready -- <SLICE-ID>
npm run aidd:bundle -- <SLICE-ID>
```

## Agent context loading

For implementation work, read the generated bundle first. Only climb back to delivery, capability, or common docs if the bundle explicitly instructs you to.
