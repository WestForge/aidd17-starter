import path from 'node:path';
import { loadConfig, resolvePath } from '../core/config.mjs';
import { exists, walk, readText, readJson } from '../core/fs.mjs';

export async function check() {
  const config = await loadConfig();
  const errors = [];
  const required = ['README.md', 'AGENTS.md', 'aidd.config.json', config.commonDir, config.capabilitiesDir, config.deliveryDir, config.bundlesDir];
  for (const item of required) {
    if (!(await exists(resolvePath(config, item)))) errors.push(`Missing required path: ${item}`);
  }

  for (const dir of [config.commonDir, config.capabilitiesDir, config.deliveryDir, config.bundlesDir]) {
    const relative = path.join(dir, 'index.md');
    if (!(await exists(resolvePath(config, relative)))) errors.push(`Missing section index: ${relative}`);
  }

  const capabilityTemplateDir = config.capabilityTemplateDir ?? path.join(config.capabilitiesDir, '_template');
  const deliveryTemplateDir = config.deliveryTemplateDir ?? path.join(config.deliveryDir, '_template');
  for (const relative of [path.join(capabilityTemplateDir, 'index.md'), path.join(deliveryTemplateDir, 'index.md'), path.join(deliveryTemplateDir, 'delivery-slice.md')]) {
    if (!(await exists(resolvePath(config, relative)))) errors.push(`Missing generic template file: ${relative}`);
  }

  for (const file of ['index.md', ...(config.commonFiles ?? [])]) {
    const relative = path.join(config.commonDir, file);
    if (!(await exists(resolvePath(config, relative)))) errors.push(`Missing common file: ${relative}`);
  }

  for (const file of ['index.md', ...(config.capabilityFiles ?? [])]) {
    const relative = path.join(capabilityTemplateDir, file);
    if (!(await exists(resolvePath(config, relative)))) errors.push(`Missing capability template file: ${relative}`);
  }

  const markdownFiles = await walk(config.root);
  for (const file of markdownFiles.filter((file) => file.endsWith('.md'))) {
    const rel = path.relative(config.root, file);
    if (rel.split(path.sep).includes('node_modules')) continue;
    const content = await readText(file);
    const firstNonBlank = content.split(/\r?\n/).find((line) => line.trim());
    if (firstNonBlank && !firstNonBlank.startsWith('#')) {
      errors.push(`Markdown file should start with a heading: ${rel}`);
    }
  }

  const manifests = (await walk(resolvePath(config, config.deliveryDir)))
    .filter((file) => path.basename(file) === 'manifest.json' && !file.split(path.sep).includes('_template'));
  for (const manifestPath of manifests) {
    const manifest = await readJson(manifestPath);
    if (!manifest.id) errors.push(`Slice manifest missing id: ${path.relative(config.root, manifestPath)}`);
    if (!manifest.status) errors.push(`Slice manifest missing status: ${path.relative(config.root, manifestPath)}`);
    if (manifest.readyForImplementation === undefined) errors.push(`Slice manifest missing readyForImplementation: ${path.relative(config.root, manifestPath)}`);
  }

  if (errors.length) {
    console.error('AIDD check failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('AIDD check passed.');
}
