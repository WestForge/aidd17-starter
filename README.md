# AIDD-17 Starter

AIDD-17 Starter creates a repo-native Markdown workspace for organising project context, capability definitions, delivery slices, and AI-ready implementation bundles inside an existing software project.

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
npm run aidd:capability:create -- payments --title "Payments"
npm run aidd:slice -- payments --id PAY-SLICE-001 --title "Payments Slice 001"
```

Complete the generated delivery slice, then mark it ready and create an implementation bundle:

```bash
npm run aidd:slice:ready -- PAY-SLICE-001
npm run aidd:bundle -- PAY-SLICE-001
```

Your implementation bundle will be generated at:

```text
bundles/PAY-SLICE-001/PAY-SLICE-001.bundle.md
```

Give that bundle to an AI agent or developer as the source of truth for the work.

## What AIDD creates

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
  package.json
```

## Why use it?

AIDD-17 helps teams turn project knowledge into controlled delivery work.

It gives you a repeatable structure for:

- capturing shared project context
- defining capabilities in small, navigable sections
- creating scope-locked delivery slices
- marking slices ready before implementation
- generating implementation bundles for AI agents or developers
- reviewing work against explicit acceptance criteria

The goal is to reduce AI wandering, repeated explanation, and wrong-context implementation by giving each piece of work a clear source of truth.

## Core idea

AIDD separates project knowledge into four layers:

```text
common/
  Shared project context, decisions, and delivery rules.

capabilities/
  Evolving definitions of what the product needs to support.

delivery/
  Scope-locked slices that define what is being built now.

bundles/
  Generated implementation packs for AI agents or developers.
```

Capability documents can evolve over time. Delivery slices are snapshots. Once a slice is marked ready, it becomes the authority for that implementation.

## Install into a different directory

Use `Docs` if that better fits your project convention:

```bash
npx github:WestForge/aidd17-starter Docs
```

For a quick local test without installing packages:

```bash
npx github:WestForge/aidd17-starter docs --no-install
```

## Local filesystem testing

If you have cloned this repository locally, you can test it from another directory.

PowerShell example:

```powershell
cd C:\tmp\aidd-test
npx C:\git\westforge\aidd17-starter docs --no-install
cd docs
npm run aidd:check
```

## Create a capability

A new workspace starts without real capabilities. Create one explicitly:

```bash
npm run aidd:capability:create -- payments --title "Payments"
```

This creates an ordered capability folder:

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

The `index.md` file links the capability sections together and acts as the local entry point.

## Create a delivery slice

A delivery slice is a scope-locked snapshot of work for a capability:

```bash
npm run aidd:slice -- payments --id PAY-SLICE-001 --title "Payments Slice 001"
```

Slices start as `draft`. This prevents unfinished scope from being handed to an implementation agent too early.

The generated slice lives under:

```text
delivery/payments/PAY-SLICE-001-<date>/
```

## Mark a slice ready

After completing the slice scope, tasks, allowed files, forbidden files, and acceptance criteria:

```bash
npm run aidd:slice:ready -- PAY-SLICE-001
```

AIDD will validate the slice before marking it ready.

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

The bundle is the file you hand to an AI agent or developer for implementation.

## Generate a capability pack

To generate a single capability-level Markdown pack:

```bash
npm run aidd:capability -- payments
```

This is useful for planning, review, or giving an AI agent broader capability context without loading the whole project.

## Useful commands

```bash
npm run aidd:check
npm run aidd:list
npm run aidd:capability:create -- payments --title "Payments"
npm run aidd:slice -- payments --id PAY-SLICE-001 --title "Payments Slice 001"
npm run aidd:slice:ready -- PAY-SLICE-001
npm run aidd:bundle -- PAY-SLICE-001
npm run aidd:capability -- payments
npm run aidd:clean
```

## Workspace structure

```text
common/
  index.md
  01-project-overview.md
  02-product-definition.md
  03-audience-and-users.md
  04-decisions.md
  05-decision-ledger.md
  06-delivery-rules.md

capabilities/
  index.md
  _template/
  <capability>/

delivery/
  index.md
  _template/
  <capability>/

bundles/
  index.md
  <slice-id>/

scripts/
  aidd.mjs
  aidd/
```

## Generic templates

AIDD includes generic templates for capability and delivery structure:

```text
capabilities/_template/
delivery/_template/
```

These are reference templates. They are not treated as real capabilities or delivery slices.

## Delivery workflow

```text
Create docs workspace
  -> complete common project context
  -> create a capability
  -> define the capability sections
  -> create a delivery slice
  -> complete the slice tasks and acceptance criteria
  -> mark the slice ready
  -> generate an implementation bundle
  -> give the bundle to an AI agent or developer
  -> review the work against the slice
```

## Commit generated work

AIDD is designed to be versioned with the project.

Commit capability definitions, delivery slices, and implementation bundles when they are useful to the project history:

```bash
git add docs
git commit -m "docs(aidd): add payments delivery slice"
```

## License

MIT
