# AGENTS.md

This repository uses AIDD-17.

AIDD-17 is a document architecture for AI-assisted software development. Product intent, architecture, delivery rules, implementation planning, and verification live in one project definition.

## Source of truth

The project definition lives in:

```text
src/content/docs/aidd-17/
```

The Markdown and MDX files are the source of truth. The Starlight site is the rendered view.

## Execution bundles

Use generated bundles when they are available. They are created from implementation slices and placed in:

```text
dist/aidd-bundles/
```

Useful commands:

```bash
npm run aidd:check
npm run aidd:bundle -- IMP-001
npm run aidd:bundle -- --all
```

The source documentation remains authoritative. Do not edit generated bundles as the source of truth. Update the relevant implementation slice, then regenerate the bundle.

## Before implementation

Before implementing any change, read:

1. The assigned implementation slice in `src/content/docs/aidd-17/16-implementation-plan/slices/`.
2. Linked behaviours in `src/content/docs/aidd-17/03-behaviours/`.
3. Linked features in `src/content/docs/aidd-17/04-features/`.
4. Linked building blocks in `src/content/docs/aidd-17/09-building-blocks/`.
5. Linked data and interfaces in `src/content/docs/aidd-17/10-data-and-interfaces/`.
6. Applicable cross-cutting rules in `src/content/docs/aidd-17/13-cross-cutting-rules/`.
7. Relevant decisions in `src/content/docs/aidd-17/14-decisions/`.
8. Delivery rules in `src/content/docs/aidd-17/15-delivery-rules/`.
9. Verification rules in `src/content/docs/aidd-17/17-verification/`.

## Rules for AI agents

- Implement only the assigned implementation slice.
- Do not invent product behaviour.
- Do not invent architecture.
- Do not invent interfaces, data structures, delivery rules, or verification criteria.
- Do not expand scope.
- Do not implement out-of-scope items.
- Do not modify files outside the expected scope unless you explain why the change is required.
- Stop and report if required information is missing, contradictory, or ambiguous.
- Stop and report if the slice affects security, privacy, regulated data, authentication, authorization, payments, or audit logging and no explicit rule exists.

## Required response after implementation

Return:

- Summary of changes.
- Files changed.
- Tests added or changed.
- Verification performed.
- Assumptions made.
- Unresolved questions.
- Any AIDD-17 documents that should be updated.

## Core rule

Teams are free to choose their process. AI is not free to invent one.
