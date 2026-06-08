import path from 'node:path';
import { loadConfig, resolvePath } from '../core/config.mjs';
import { positional } from '../core/args.mjs';
import { walk, readJson, readText, writeJson } from '../core/fs.mjs';

export async function sliceReady(args) {
  const config = await loadConfig();
  const id = positional(args)[0];
  if (!id) throw new Error('Slice ID is required. Example: npm run aidd:slice:ready -- PAY-SLICE-001');

  const found = await findSlice(config, id);
  if (!found) throw new Error(`Delivery slice not found: ${id}`);

  const sliceDir = path.dirname(found.manifestPath);
  const slicePath = path.join(sliceDir, found.manifest.sliceFile);
  const sliceContent = await readText(slicePath);
  const errors = validateSliceForReady(config, sliceContent, found.manifest);

  if (errors.length) {
    console.error(`${id} cannot be marked ready.`);
    console.error('');
    for (const error of errors) console.error(`- ${error}`);
    console.error('');
    console.error('Fix the slice, then run the command again.');
    process.exit(1);
  }

  const updated = {
    ...found.manifest,
    status: 'ready',
    readyForImplementation: true,
    readyAt: new Date().toISOString()
  };
  await writeJson(found.manifestPath, updated);
  console.log(`Marked ready for implementation: ${id}`);
}

async function findSlice(config, id) {
  const manifests = (await walk(resolvePath(config, config.deliveryDir))).filter((file) => path.basename(file) === 'manifest.json' && !file.split(path.sep).includes('_template'));
  for (const manifestPath of manifests) {
    const manifest = await readJson(manifestPath);
    if (manifest.id === id) return { manifest, manifestPath };
  }
  return null;
}

function validateSliceForReady(config, content, manifest) {
  const errors = [];
  for (const section of config.requiredReadySections ?? []) {
    const pattern = new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, 'im');
    if (!pattern.test(content)) errors.push(`Missing required section: ${section}`);
  }
  if (/\bTODO\b|\bTBD\b|placeholder task/i.test(content)) {
    errors.push('Slice still contains TODO, TBD, or placeholder task text.');
  }
  if (!manifest.scopeLocked) errors.push('Manifest must have scopeLocked: true.');
  if (!manifest.sliceFile) errors.push('Manifest must identify sliceFile.');
  return errors;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
