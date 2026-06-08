import path from 'node:path';
import { loadConfig, resolvePath } from '../core/config.mjs';
import { positional, titleFromSlug } from '../core/args.mjs';
import { exists, readText, writeText, writeJson, ensureDir } from '../core/fs.mjs';

export async function capabilityPack(args) {
  const config = await loadConfig();
  const slug = positional(args)[0];
  if (!slug) throw new Error('Capability slug is required. Example: npm run aidd:capability -- payments');
  const capabilityDir = resolvePath(config, path.join(config.capabilitiesDir, slug));
  if (!(await exists(capabilityDir))) throw new Error(`Capability does not exist: ${slug}`);

  const title = titleFromSlug(slug);
  const parts = [`# ${title} Capability Pack\n`, `## Capability Metadata\n\n- Capability: ${slug}\n- Generated: ${new Date().toISOString()}\n`];
  for (const file of ['index.md', ...config.capabilityFiles]) {
    const filePath = path.join(capabilityDir, file);
    if (await exists(filePath)) parts.push(`\n## Source: ${file}\n\n${(await readText(filePath)).trim()}\n`);
  }
  const outputDir = resolvePath(config, path.join(config.bundlesDir, 'capabilities'));
  await ensureDir(outputDir);
  const outputFile = `${slug}.capability.md`;
  await writeText(path.join(outputDir, outputFile), parts.join('\n'));
  await writeJson(path.join(outputDir, `${slug}.manifest.json`), {
    capability: slug,
    outputFile,
    generated: new Date().toISOString()
  });
  console.log(`Created capability pack: ${path.join(config.bundlesDir, 'capabilities', outputFile)}`);
}
