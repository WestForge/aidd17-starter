import path from 'node:path';
import { loadConfig, resolvePath } from '../core/config.mjs';
import { positional } from '../core/args.mjs';
import { walk, readJson, readText, writeJson, writeText, ensureDir } from '../core/fs.mjs';

export async function bundle(args) {
  const config = await loadConfig();
  const id = positional(args)[0];
  if (!id) throw new Error('Slice ID is required. Example: npm run aidd:bundle -- PAY-SLICE-001');

  const found = await findSlice(config, id);
  if (!found) throw new Error(`Delivery slice not found: ${id}`);

  if (found.manifest.status !== 'ready' || found.manifest.readyForImplementation !== true) {
    console.error(`Cannot create implementation bundle for ${id}.`);
    console.error('');
    console.error(`Current status: ${found.manifest.status ?? 'unknown'}`);
    console.error('Required status: ready');
    console.error('');
    console.error('Mark it ready first:');
    console.error(`  npm run aidd:slice:ready -- ${id}`);
    process.exit(1);
  }

  const sliceDir = path.dirname(found.manifestPath);
  const slicePath = path.join(sliceDir, found.manifest.sliceFile);
  const sliceContent = await readText(slicePath);
  const commonRules = await safeRead(resolvePath(config, path.join(config.commonDir, '06-delivery-rules.md')));
  const decisionLedger = await safeRead(resolvePath(config, path.join(config.commonDir, '05-decision-ledger.md')));
  const outputDir = resolvePath(config, path.join(config.bundlesDir, id));
  await ensureDir(outputDir);
  const outputFile = `${id}.bundle.md`;
  const implementationPlanFile = 'implementation-plan.md';
  const generated = new Date().toISOString();
  const implementationPlan = createImplementationPlan(found.manifest);

  const content = `# ${found.manifest.title} Implementation Bundle\n\n## Bundle Metadata\n\n- Slice ID: ${found.manifest.id}\n- Capability: ${found.manifest.capability}\n- Status At Bundle Creation: ${found.manifest.status}\n- Source Slice: ${path.relative(config.root, slicePath).replaceAll('\\', '/')}\n- Generated: ${generated}\n\n## Readiness Gate\n\nThis bundle was generated only after the delivery slice was marked \`ready\`.\n\nDo not implement this bundle if:\n\n- The source slice status is not \`ready\`.\n- The manifest is missing.\n- The slice has unresolved TODOs in scope, files, tasks, or acceptance criteria.\n- The implementation plan is incomplete.\n\n${implementationPlan.trim()}\n\n## Common Delivery Rules\n\n${commonRules.trim()}\n\n## Decision Ledger\n\n${decisionLedger.trim()}\n\n## Delivery Slice\n\n${sliceContent.trim()}\n`;
  await writeText(path.join(outputDir, outputFile), content);
  await writeText(path.join(outputDir, implementationPlanFile), implementationPlan);
  await writeJson(path.join(outputDir, 'manifest.json'), {
    id: found.manifest.id,
    title: found.manifest.title,
    capability: found.manifest.capability,
    statusAtBundleCreation: found.manifest.status,
    sourceSlice: path.relative(config.root, slicePath).replaceAll('\\', '/'),
    bundleFile: outputFile,
    implementationPlanFile,
    generated
  });
  console.log(`Created implementation bundle: ${path.join(config.bundlesDir, id, outputFile)}`);
}

async function findSlice(config, id) {
  const manifests = (await walk(resolvePath(config, config.deliveryDir))).filter((file) => path.basename(file) === 'manifest.json' && !file.split(path.sep).includes('_template'));
  for (const manifestPath of manifests) {
    const manifest = await readJson(manifestPath);
    if (manifest.id === id) return { manifest, manifestPath };
  }
  return null;
}

function createImplementationPlan(manifest) {
  return `## Implementation Plan\n\n### Objective\n\nComplete ${manifest.id} exactly as scoped in the delivery slice.\n\n### Work Sequence\n\n1. Read this bundle fully.\n2. Confirm the readiness gate.\n3. Review allowed files and forbidden files.\n4. Complete tasks in order.\n5. Run the smallest relevant checks.\n6. Update implementation notes.\n7. Stop for review.\n\n### Task Execution Rules\n\n- Complete tasks in the order listed unless blocked.\n- Do not expand scope.\n- Do not modify files outside the allowed list.\n- Do not implement deferred work.\n- Do not reinterpret the capability from newer docs.\n- Stop if acceptance criteria cannot be met.\n\n### Required Implementation Notes\n\nAt the end of the work, report:\n\n- Files changed\n- Tasks completed\n- Acceptance criteria met\n- Checks run\n- Risks remaining\n- Follow-up work intentionally not done\n`;
}

async function safeRead(filePath) {
  try { return await readText(filePath); } catch { return ''; }
}
