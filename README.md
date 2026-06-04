# AIDD-17 Starlight Starter

This is a starter project for using AIDD-17 with Astro Starlight.

AIDD-17 is a document architecture for AI-assisted software delivery. It brings product intent, software architecture, delivery rules, implementation planning, and verification into one shared project definition.

## Why Starlight?

The Markdown and MDX files are the source of truth.

Astro Starlight renders those files as a readable documentation site for humans, while AI agents can work directly with the same files in the repository.

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Important folders

```text
src/content/docs/
  Reference site pages and templates.

src/content/docs/aidd-17/
  The project definition workspace.

src/content/docs/aidd-17/16-implementation-plan/slices/
  Implementation slices that AI agents can work from.

src/content/docs/aidd-17/14-decisions/
  Decision records.
```

## Recommended workflow

1. Fill in the AIDD-17 project definition under `src/content/docs/aidd-17/`.
2. Create an implementation slice under `16-implementation-plan/slices/`.
3. Give the slice and linked sections to an AI agent.
4. Verify the result against `17-verification/`.
5. Update the project definition when accepted work changes behaviour, architecture, or delivery rules.

## Core rule

Teams are free to choose their process. AI is not free to invent one.
