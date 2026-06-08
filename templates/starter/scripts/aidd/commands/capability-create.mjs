import path from 'node:path';
import { loadConfig, resolvePath } from '../core/config.mjs';
import { positional, getFlag, titleFromSlug } from '../core/args.mjs';
import { exists, ensureDir, readText, writeText } from '../core/fs.mjs';

export async function createCapability(args) {
  const config = await loadConfig();
  const slug = positional(args)[0];
  if (!slug) throw new Error('Capability slug is required. Example: npm run aidd:capability:create -- payments --title "Payments"');

  const title = getFlag(args, 'title', titleFromSlug(slug));
  const dir = resolvePath(config, path.join(config.capabilitiesDir, slug));
  if (await exists(dir)) throw new Error(`Capability already exists: ${slug}`);

  const templateDir = resolvePath(config, config.capabilityTemplateDir ?? path.join(config.capabilitiesDir, '_template'));
  if (!(await exists(templateDir))) throw new Error(`Capability template not found: ${path.relative(config.root, templateDir)}`);

  await ensureDir(dir);

  for (const file of ['index.md', ...config.capabilityFiles]) {
    const templateFile = path.join(templateDir, file);
    if (!(await exists(templateFile))) throw new Error(`Capability template file missing: ${path.relative(config.root, templateFile)}`);
    const content = (await readText(templateFile))
      .replaceAll('__CAPABILITY_TITLE__', title)
      .replaceAll('__CAPABILITY_SLUG__', slug)
      .replace(/^# Capability Template$/m, `# ${title}`)
      .replace('This is the generic section template used to create real capabilities.', `Capability definition for ${title}.`)
      .replace(/Do not implement work from this folder\.[\s\S]*?## Capability sections\n/m, '## Status\n\nDraft\n\n## Capability Files\n');
    await writeText(path.join(dir, file), content);
  }

  await ensureCapabilityIndex(config, slug, title);
  console.log(`Created capability: ${slug}`);
  console.log(`Next: complete the numbered files in ${path.join(config.capabilitiesDir, slug)}`);
}

async function ensureCapabilityIndex(config, slug, title) {
  const indexPath = resolvePath(config, path.join(config.capabilitiesDir, 'index.md'));
  const marker = `- [${title}](./${slug}/index.md)`;
  const current = await readText(indexPath);
  if (current.includes(marker)) return;
  const addition = `\n## Active capabilities\n\n${marker}\n`;
  await writeText(indexPath, current.trimEnd() + addition);
}
