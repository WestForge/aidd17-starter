import path from 'node:path';
import { loadConfig, resolvePath } from '../core/config.mjs';
import { positional, getFlag, titleFromSlug } from '../core/args.mjs';
import { exists, ensureDir, readText, writeJson, writeText } from '../core/fs.mjs';

export async function createSlice(args) {
  const config = await loadConfig();
  const capability = positional(args)[0];
  if (!capability) throw new Error('Capability slug is required. Example: npm run aidd:slice -- payments --id PAY-SLICE-001 --title "Payments Slice 001"');

  const capabilityDir = resolvePath(config, path.join(config.capabilitiesDir, capability));
  if (!(await exists(capabilityDir))) throw new Error(`Capability does not exist: ${capability}`);

  const id = getFlag(args, 'id', `${capability.toUpperCase().replace(/[^A-Z0-9]/g, '-')}-SLICE-001`);
  const title = getFlag(args, 'title', titleFromSlug(id));
  const date = getFlag(args, 'date', new Date().toISOString().slice(0, 10));
  const safeId = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const sliceDir = resolvePath(config, path.join(config.deliveryDir, capability, `${safeId}-${date}`));
  if (await exists(sliceDir)) throw new Error(`Delivery slice already exists: ${path.relative(config.root, sliceDir)}`);
  await ensureDir(sliceDir);

  const sourceSections = [];
  const snapshotParts = [];
  for (const file of config.capabilityFiles) {
    const filePath = path.join(capabilityDir, file);
    if (await exists(filePath)) {
      sourceSections.push(path.relative(config.root, filePath).replaceAll('\\', '/'));
      const content = await readText(filePath);
      snapshotParts.push(`\n## Snapshot: ${file.replace(/\.md$/, '').replace(/^\d+-/, '').replace(/-/g, ' ')}\n\n${content.trim()}\n`);
    }
  }

  const sliceFileName = `${id.replace(/[^A-Za-z0-9]+/g, '_')}_${date}.md`;
  const sliceContent = `# ${title}\n\n## Slice Metadata\n\n- Slice ID: ${id}\n- Capability: ${capability}\n- Created: ${date}\n- Status: Draft\n- Ready For Implementation: No\n- Scope Lock: This file is the authority for this delivery slice.\n\n## Purpose\n\nDescribe the bounded work this slice will complete.\n\n## Snapshot Summary\n\nThis section is a snapshot from the capability docs at the time the slice was created.\n${snapshotParts.join('\n')}\n## Delivery Scope\n\n### In Scope\n\n- TODO: Define the work that must be completed in this slice.\n\n### Out of Scope\n\n- TODO: Define related work that must not be completed in this slice.\n\n### Explicitly Deferred\n\n- TODO: Define work intentionally left for future slices.\n\n## Files\n\n### Expected Files to Create\n\n- TODO\n\n### Expected Files to Modify\n\n- TODO\n\n### Forbidden Files\n\n- TODO\n\n## Tasks\n\n### Task 1 — Define the implementation plan\n\n**Goal:** Turn this slice into a concrete implementation task list.\n\n**Steps:**\n\n1. Review the snapshot summary.\n2. Fill in the delivery scope.\n3. Replace this placeholder task with implementation tasks.\n\n**Acceptance:**\n\n- Tasks are clear enough for an implementation agent.\n- Acceptance criteria are testable.\n\n## Acceptance Criteria\n\n- TODO: Add testable acceptance criteria for the whole slice.\n\n## AI Execution Contract\n\n### This slice is authoritative for\n\n- The work to complete in this delivery slice.\n- The accepted scope for this slice.\n- The tasks required to complete the work.\n- The files the agent may touch.\n\n### This slice is not authoritative for\n\n- Future capability behaviour.\n- Unrelated capabilities.\n- Broad architecture rewrites.\n\n### Required behaviour\n\n- Complete tasks in order unless blocked.\n- Preserve the scope lock.\n- Report blockers instead of expanding scope.\n\n### Forbidden behaviour\n\n- Do not add future features.\n- Do not modify unrelated capabilities.\n- Do not reinterpret scope from newer capability docs.\n\n## Context Loading Order\n\n1. Read this slice file first.\n2. Read common delivery rules only if needed.\n3. Read common decision ledger only if needed.\n4. Do not reread evolving capability docs unless explicitly instructed.\n\n## Stop Conditions\n\nStop and report if:\n\n- Required files do not exist.\n- Implementation requires scope outside this slice.\n- A decision conflicts with project rules.\n- A required dependency is missing.\n- Acceptance cannot be met.\n\n## Implementation Prompt\n\nImplement this delivery slice exactly as defined in this file.\n\nRules:\n\n- Complete the listed tasks.\n- Touch only the allowed files.\n- Do not expand scope.\n- Use this slice as the source of truth.\n\n## Review Prompt\n\nReview the implementation against this delivery slice.\n\nReport:\n\n- Missing tasks\n- Failed acceptance criteria\n- Unauthorised file changes\n- Scope creep\n- Duplicated systems\n- Risks or blockers\n`;

  await writeText(path.join(sliceDir, 'index.md'), `# ${title}\n\nScope-locked delivery slice for ${capability}.\n\n## Files\n\n- [Delivery slice](./${sliceFileName})\n- [Manifest](./manifest.json)\n\n## Status\n\nDraft. Edit the slice and then mark it ready before generating an implementation bundle.\n`);
  await writeText(path.join(sliceDir, sliceFileName), sliceContent);
  await writeJson(path.join(sliceDir, 'manifest.json'), {
    id,
    title,
    capability,
    created: date,
    status: 'draft',
    readyForImplementation: false,
    scopeLocked: true,
    sliceFile: sliceFileName,
    sourceSections
  });
  await ensureDir(resolvePath(config, path.join(config.deliveryDir, capability)));
  const capabilityIndex = resolvePath(config, path.join(config.deliveryDir, capability, 'index.md'));
  if (!(await exists(capabilityIndex))) await writeText(capabilityIndex, `# ${titleFromSlug(capability)} Delivery\n\nDelivery slices for ${capability}.\n`);
  console.log(`Created delivery slice: ${id}`);
  console.log(`Edit the slice, then run: npm run aidd:slice:ready -- ${id}`);
}
