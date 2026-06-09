# AIDD Starter

AIDD Starter creates and updates a Markdown-based delivery control workspace for AI-assisted software projects.

AIDD is not a documentation site. It is a repo-native control layer for organising project context, standards, module boundaries, capability definitions, delivery roadmaps, and agent-ready implementation bundles.

The generated workspace keeps AIDD internals under `.aidd/` so the active project context stays clean and easy for humans and agents to navigate.

## Quick Start

Create an AIDD workspace:

```bash
npx github:WestForge/aidd17-starter AIDD
```

Enter the workspace:

```bash
cd AIDD
npm run aidd:check
```

Apply standards:

```bash
npm run aidd:standards:list
npm run aidd:standards:apply -- unreal-plugin
```

Create a module:

```bash
npm run aidd:module:create -- runtime --title "Runtime"
```

Create a capability that references one or more modules:

```bash
npm run aidd:capability:create -- hud-framework --title "HUD Framework" --modules runtime
```

Create a delivery bundle:

```bash
npm run aidd:bundle:create -- HUD-001 --title "HUD Framework Phase 1" --capability hud-framework
```

Complete the generated bundle phases, then mark the bundle ready and export it for implementation:

```bash
npm run aidd:bundle:ready -- HUD-001
npm run aidd:bundle:export -- HUD-001
```

The agent-ready implementation file is generated at:

```text
delivery/bundles/HUD-001/exports/HUD-001.agent.md
```

## What AIDD Is

AIDD is a Markdown-based delivery control system for software projects.

It helps teams define:

- what the project is
- what standards apply
- which systems own which responsibilities
- which capabilities the product must support
- which work is ready to implement
- what an AI agent or developer is allowed to change
- how completed work should be reviewed and validated

AIDD stores this information in plain Markdown and JSON so it can live inside a repository, be reviewed in Git, and be consumed by humans or AI agents.

## Why AIDD Matters

AI agents are powerful, but they often fail because they are given broad or unstable context.

Common failure modes include:

- implementing features that were not requested
- reading too much unrelated project history
- ignoring system boundaries
- changing files outside the intended scope
- inventing duplicate systems
- skipping acceptance criteria
- treating draft ideas as implementation instructions

AIDD reduces those risks by creating a controlled delivery flow:

```text
project context
  -> standards
  -> module boundaries
  -> capability definitions
  -> delivery bundles
  -> agent exports
  -> review and validation
```

The goal is to make AI-assisted work smaller, clearer, safer, and easier to review.

## Generated Structure

```text
AIDD/
  .aidd/
    scripts/
    templates/

  common/
  modules/
  capabilities/
  delivery/

  package.json
  aidd.config.json
  README.md
  AGENTS.md
```

### `.aidd/`

Internal AIDD tooling and reusable templates.

Agents should ignore `.aidd/` unless they are explicitly modifying AIDD itself.

### `common/`

Shared project context, standards, decisions, and delivery rules.

Use this for information that applies across the whole project.

### `modules/`

System boundaries and implementation ownership areas.

A module defines what a part of the system owns, what it does not own, what it exposes, and which coupling is forbidden.

### `capabilities/`

Product or technical outcomes the project must support.

A capability can reference one or more modules.

### `delivery/`

The delivery roadmap and phased delivery bundles.

Delivery is where planned work is queued, prepared, marked ready, and exported for implementation.

## Core Concepts

## Common Project Context

`common/` captures project-wide truth.

Typical files include:

```text
common/
  index.md
  01-project-overview.md
  02-product-definition.md
  03-audience-and-users.md
  04-decisions.md
  05-decision-ledger.md
  06-delivery-rules.md
  standards/
```

Use `common/` to answer questions like:

- What is this project?
- Who is it for?
- What decisions have already been made?
- What delivery rules must all work follow?
- What standards apply across the project?

## Standards

Standards define how work should be implemented.

AIDD supports reusable standards profiles, such as:

- implementation philosophy, for example SOLID or simple design
- language standards, for example C++, TypeScript, Java, Rust, Go
- platform standards, for example Unreal, Unity, Node.js, React
- practice standards, for example testing, documentation, security, API design

List available standards:

```bash
npm run aidd:standards:list
```

Apply a preset:

```bash
npm run aidd:standards:apply -- unreal-plugin
```

Apply individual profiles:

```bash
npm run aidd:standards:apply -- solid cpp unreal documentation testing ai-agent
```

Show applied standards:

```bash
npm run aidd:standards:show
```

Applied standards are copied into:

```text
common/standards/
```

Once applied, they become project-owned and can be edited.

## Modules

Modules define implementation boundaries.

Examples:

```text
modules/runtime/
modules/editor/
modules/styling/
modules/widgets/
modules/persistence/
```

Create a module:

```bash
npm run aidd:module:create -- runtime --title "Runtime"
```

A module should define:

- purpose
- boundaries
- interfaces
- dependencies
- architecture
- local standards
- decisions
- risks

The most important file is usually:

```text
modules/<module>/02-boundaries.md
```

That file should explain:

- what the module owns
- what the module does not own
- what it may depend on
- what may depend on it
- what coupling is forbidden
- when a boundary change requires a decision

## Capabilities

Capabilities define outcomes.

A capability describes something the project needs to be able to do. It may span one or more modules.

Create a capability:

```bash
npm run aidd:capability:create -- hud-framework --title "HUD Framework" --modules runtime,widgets,styling
```

A capability contains ordered files:

```text
capabilities/hud-framework/
  index.md
  capability.json
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

Use a capability to answer:

- What outcome are we trying to support?
- What is in scope?
- What is out of scope?
- What modules are involved?
- What requirements matter?
- What risks or validation rules exist?

## Delivery Bundles

A delivery bundle is a planned package of work.

Bundles live under:

```text
delivery/bundles/
```

Create a bundle:

```bash
npm run aidd:bundle:create -- HUD-001 --title "HUD Framework Phase 1" --capability hud-framework
```

A bundle contains phases:

```text
delivery/bundles/HUD-001/
  index.md
  bundle.json
  01-context.md
  02-scope.md
  03-design.md
  04-implementation-plan.md
  05-tasks.md
  06-acceptance.md
  07-review.md
  08-validation.md
  09-handoff.md
  exports/
```

The bundle is the thing that gets planned, reviewed, marked ready, and exported for implementation.

## Agent Exports

An agent export is a single Markdown implementation file generated from a ready bundle.

Export a ready bundle:

```bash
npm run aidd:bundle:export -- HUD-001
```

The export is written to:

```text
delivery/bundles/HUD-001/exports/HUD-001.agent.md
```

Give that file to an AI agent or developer as the source of truth for implementation.

The export includes:

- bundle metadata
- source of truth rules
- source map
- applied standards
- module boundary references
- context loading order
- scope
- design
- implementation plan
- tasks
- acceptance criteria
- review guidance
- validation instructions
- handoff requirements

## Project Management Options

AIDD can support different project-management styles depending on how your team works.

## Lightweight Planning

Use AIDD as a small planning and execution structure:

```text
common/
modules/
capabilities/
delivery/bundles/
```

Good for solo developers, plugin work, small tools, or focused AI-assisted implementation.

## Roadmap-Driven Delivery

Use `delivery/roadmap.md` as the queue of planned work.

```bash
npm run aidd:delivery:roadmap
```

Bundles can move through statuses such as:

```text
draft
planned
ready
in-progress
completed
archived
```

Good for teams that want a clear delivery queue.

## Capability-Driven Delivery

Use capabilities as the primary planning unit.

Flow:

```text
create capability
  -> define scope and requirements
  -> create one or more bundles
  -> export ready bundles for implementation
```

Good for product features, systems, and cross-module outcomes.

## Module-Driven Delivery

Use modules to control technical boundaries.

Flow:

```text
create modules
  -> define boundaries
  -> create capabilities that reference modules
  -> ensure bundles respect module boundaries
```

Good for large systems, game development, architecture-heavy work, or teams using AI agents across many files.

## AI-First Delivery

Use AIDD bundles as the only authorised implementation handoff.

Flow:

```text
draft bundle
  -> complete plan
  -> mark ready
  -> generate agent export
  -> implement only from export
  -> review against acceptance criteria
```

Good for reducing AI wandering and preventing scope creep.

## Multi-Repo or External Source Control

AIDD can be used as a control workspace that references one or more source roots.

For example:

```text
ProjectRoot/
  AIDD/
  source/
```

or:

```text
ProjectRoot/
  AIDD/
  source/
    plugin/
    host-project/
    tools/
```

The AIDD configuration can describe where implementation source lives. Agent exports should then use those configured source roots when describing allowed and forbidden paths.

## Preparing a Capability for AI Implementation

AIDD works best when a capability is prepared before creating implementation bundles.

## 1. Create the Module Boundaries

Create the modules that own the implementation areas:

```bash
npm run aidd:module:create -- runtime --title "Runtime"
npm run aidd:module:create -- styling --title "Styling"
npm run aidd:module:create -- widgets --title "Widgets"
```

Complete each module boundary file:

```text
modules/<module>/02-boundaries.md
```

Before AI implementation, make sure each relevant module clearly states:

- owns
- does not own
- may depend on
- may be used by
- exposes
- forbidden coupling
- boundary change rules

## 2. Create the Capability

Create the capability and reference the modules it touches:

```bash
npm run aidd:capability:create -- common-style-assets --title "Common Style Assets" --modules runtime,styling
```

## 3. Complete Capability Scope

Fill in at least:

```text
01-outcomes.md
02-scope.md
04-functional-requirements.md
08-architecture.md
10-risks.md
11-validation.md
```

The capability should explain what the system should become, but it should not be used directly as an implementation prompt.

## 4. Create a Delivery Bundle

Create a delivery bundle for a bounded piece of work:

```bash
npm run aidd:bundle:create -- STYLE-001 --title "Common Style Asset Phase 1" --capability common-style-assets
```

## 5. Complete the Bundle Phases

Fill in:

```text
01-context.md
02-scope.md
03-design.md
04-implementation-plan.md
05-tasks.md
06-acceptance.md
07-review.md
08-validation.md
09-handoff.md
```

The implementation plan should include:

- objective
- work sequence
- expected files to create
- expected files to modify
- forbidden files
- allowed source roots
- checks to run
- stop conditions

## 6. Mark the Bundle Ready

```bash
npm run aidd:bundle:ready -- STYLE-001
```

AIDD should refuse readiness if required bundle files still contain `TODO`.

## 7. Export for AI Implementation

```bash
npm run aidd:bundle:export -- STYLE-001
```

Give the generated `.agent.md` file to the AI agent.

## 8. Review Against the Bundle

Review implementation against:

- tasks
- acceptance criteria
- forbidden files
- module boundaries
- applied standards
- validation checks

The bundle, not the evolving capability docs, is the implementation authority.

## Command Reference

## Workspace

```bash
npm run aidd:check
npm run aidd:list
```

## Standards

```bash
npm run aidd:standards:list
npm run aidd:standards:apply -- unreal-plugin
npm run aidd:standards:show
npm run aidd:standards:remove -- unreal
```

## Modules

```bash
npm run aidd:module:create -- runtime --title "Runtime"
npm run aidd:module:list
```

## Capabilities

```bash
npm run aidd:capability:create -- hud-framework --title "HUD Framework" --modules runtime
npm run aidd:capability:list
npm run aidd:capability -- hud-framework
```

## Delivery Bundles

```bash
npm run aidd:bundle:create -- HUD-001 --title "HUD Framework Phase 1" --capability hud-framework
npm run aidd:bundle:ready -- HUD-001
npm run aidd:bundle:export -- HUD-001
npm run aidd:bundle:list
```

## Delivery Roadmap

```bash
npm run aidd:delivery:roadmap
```

## Clean Generated Exports

```bash
npm run aidd:clean
```

## Updating an Existing Workspace

Update an existing AIDD workspace from the starter:

```bash
npx github:WestForge/aidd17-starter update AIDD
```

Or, from inside the workspace:

```bash
npx github:WestForge/aidd17-starter update .
```

The update command refreshes AIDD internals while preserving project-owned content.

## Agent Guidance

AI agents should not implement directly from source files or broad capability documents.

Implementation should start from a ready delivery bundle export:

```text
delivery/bundles/<bundle-id>/exports/<bundle-id>.agent.md
```

Agents should:

1. read the assigned agent export
2. follow the context loading order
3. respect module boundaries
4. obey applied standards
5. modify only allowed source paths
6. stop if the work exceeds the bundle scope

Agents should ignore `.aidd/` unless explicitly asked to modify AIDD tooling.

## Summary

AIDD is the project control layer for AI-assisted delivery.

Use it to define:

```text
what the project is
how the project should be built
which systems own which responsibilities
which capabilities matter
which delivery bundles are ready
what agents are allowed to implement
how work is reviewed
```

The stronger the AIDD bundle, the safer and more predictable the implementation.
