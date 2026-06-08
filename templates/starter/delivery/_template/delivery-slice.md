# Delivery Slice Template

## Slice Metadata

- Slice ID: TEMPLATE-SLICE-001
- Capability: capability-slug
- Created: YYYY-MM-DD
- Status: Draft
- Ready For Implementation: No
- Scope Lock: This file is the authority for this delivery slice.

## Purpose

Describe the bounded work this slice will complete.

## Snapshot Summary

This section is copied from the capability docs at the time the slice is created.

## Delivery Scope

### In Scope

- Define the work that must be completed in this slice.

### Out of Scope

- Define related work that must not be completed in this slice.

### Explicitly Deferred

- Define work intentionally left for future slices.

## Files

### Expected Files to Create

- List expected new files.

### Expected Files to Modify

- List expected existing files.

### Forbidden Files

- List files, folders, or areas that must not be touched.

## Tasks

### Task 1 — Example task

**Goal:** Describe the task outcome.

**Steps:**

1. Define the specific work.
2. Keep the task bounded.
3. Add task-level acceptance checks.

**Acceptance:**

- The task has a testable completion signal.

## Acceptance Criteria

- Add testable acceptance criteria for the whole slice.

## AI Execution Contract

### This slice is authoritative for

- The work to complete in this delivery slice.
- The accepted scope for this slice.
- The tasks required to complete the work.
- The files the agent may touch.

### This slice is not authoritative for

- Future capability behaviour.
- Unrelated capabilities.
- Broad architecture rewrites.

### Required behaviour

- Complete tasks in order unless blocked.
- Preserve the scope lock.
- Report blockers instead of expanding scope.

### Forbidden behaviour

- Do not add future features.
- Do not modify unrelated capabilities.
- Do not reinterpret scope from newer capability docs.

## Context Loading Order

1. Read this slice file first.
2. Read common delivery rules only if needed.
3. Read common decision ledger only if needed.
4. Do not reread evolving capability docs unless explicitly instructed.

## Stop Conditions

Stop and report if:

- Required files do not exist.
- Implementation requires scope outside this slice.
- A decision conflicts with project rules.
- A required dependency is missing.
- Acceptance cannot be met.

## Implementation Prompt

Implement this delivery slice exactly as defined in this file.

Rules:

- Complete the listed tasks.
- Touch only the allowed files.
- Do not expand scope.
- Use this slice as the source of truth.

## Review Prompt

Review the implementation against this delivery slice.

Report:

- Missing tasks
- Failed acceptance criteria
- Unauthorised file changes
- Scope creep
- Duplicated systems
- Risks or blockers
