# __PROJECT_NAME__

__PROJECT_DESCRIPTION__

This is a plain Markdown AIDD workspace. It is intended to live inside a project repository, commonly as `docs/` or `Docs/`.

AIDD is file-first. It does not require Astro, Starlight, MDX, or a website.

## Start here

Validate the workspace:

```bash
npm run aidd:check
```

List current capabilities and delivery slices:

```bash
npm run aidd:list
```

## Structure

```text
common/        Shared project context and delivery rules
capabilities/  Evolving capability definitions plus the generic capability template
delivery/      Scope-locked delivery slices plus the generic delivery template
bundles/       Generated agent-ready implementation and capability bundles
scripts/       Local AIDD tooling
templates/     Reusable implementation-plan template
```

## Generic sections

Generic capability and delivery section guidance is kept in:

- `capabilities/_template/`
- `delivery/_template/`

These templates are reference material and are used by the creation scripts. They are not active delivery work.

## Create a capability

AIDD does not create a capability during setup. Create one explicitly:

```bash
npm run aidd:capability:create -- payments --title "Payments"
```

This creates:

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

Complete the numbered files in order. The numbers are for local editor navigation and completion order.

## Create a delivery slice

Delivery slices are scope-locked snapshots created from a capability:

```bash
npm run aidd:slice -- payments --id PAY-SLICE-001 --title "Payments Slice 001"
```

A delivery slice starts as `draft`. Complete its scope, tasks, file boundaries, and acceptance criteria before marking it ready.

## Mark a delivery slice ready

```bash
npm run aidd:slice:ready -- PAY-SLICE-001
```

The readiness command checks that the slice has the required implementation sections and does not still contain placeholder text.

## Generate an implementation bundle

```bash
npm run aidd:bundle -- PAY-SLICE-001
```

AIDD refuses to generate an implementation bundle unless the slice is marked `ready`.

Generated bundles are written to:

```text
bundles/<SLICE-ID>/
```

## Generate a capability pack

```bash
npm run aidd:capability -- payments
```

Capability packs are useful for planning and review. Implementation agents should normally start from a ready delivery bundle instead.

## Core rule

Capabilities may evolve. Delivery slices do not. Once a delivery slice is created, it is the scope-locked authority for that piece of work.
